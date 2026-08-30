import WebSocket from "ws";
import { config } from "../config.js";
import { incrementPlayerStats, upsertPlayerStats } from "../database/db.js";

let monitorWs = null;
let reconnectTimer = null;
let pollTimer = null;
let isConnected = false;

/**
 * Parse console log messages for in-game kills, deaths, and events
 */
export function parseConsoleEvent(rawMessage) {
  if (!rawMessage || typeof rawMessage !== "string") return;

  const msg = rawMessage.trim();

  // Pattern 1: Standard Rust PVP Kill:
  // "VictimName[76561199863588476] was killed by KillerName[76561198123456789] with rifle.ak"
  // "VictimName[76561199863588476] was killed by KillerName[76561198123456789]"
  const pvpMatch = msg.match(/(.+?)\[(\d{17})\]\s+was\s+killed\s+by\s+(.+?)\[(\d{17})\]/i);
  if (pvpMatch) {
    const victimName = pvpMatch[1].trim();
    const victimId = pvpMatch[2];
    const killerName = pvpMatch[3].trim();
    const killerId = pvpMatch[4];
    const isHeadshot = msg.toLowerCase().includes("headshot") || msg.toLowerCase().includes("head");

    console.log(`[RCON Combat] PvP: ${killerName} (${killerId}) killed ${victimName} (${victimId})`);

    // Increment victim deaths
    incrementPlayerStats(victimId, { deaths: 1 }, victimName);

    // If killer is a different player, increment kills
    if (killerId !== victimId) {
      incrementPlayerStats(killerId, { kills: 1, headshots: isHeadshot ? 1 : 0 }, killerName);
    }
    return;
  }

  // Pattern 2: PvE Death (Animal, Scientist, Bradley, Heli, Turret, etc.):
  // "PlayerName[76561199863588476] was killed by Boar"
  // "PlayerName[76561199863588476] was killed by Wolf"
  // "PlayerName[76561199863588476] was killed by Bear"
  // "PlayerName[76561199863588476] was killed by Scientist"
  const pveMatch = msg.match(/(.+?)\[(\d{17})\]\s+was\s+killed\s+by\s+([^\[\n]+)/i);
  if (pveMatch) {
    const victimName = pveMatch[1].trim();
    const victimId = pveMatch[2];
    const cause = pveMatch[3].trim();

    console.log(`[RCON Combat] PvE: ${victimName} (${victimId}) was killed by ${cause}`);
    incrementPlayerStats(victimId, { deaths: 1 }, victimName);
    return;
  }

  // Pattern 3: Environmental / Suicide Death:
  // "PlayerName[76561199863588476] died (Fall)"
  // "PlayerName[76561199863588476] died (Drowned)"
  // "PlayerName[76561199863588476] died (Suicide)"
  // "PlayerName[76561199863588476] died (Radiation)"
  // "PlayerName[76561199863588476] died (Hunger)"
  // "PlayerName[76561199863588476] died (Cold)"
  // "PlayerName[76561199863588476] died (Bleeding)"
  // "PlayerName[76561199863588476] died (Generic)"
  const envMatch = msg.match(/(.+?)\[(\d{17})\]\s+died\s*\((.+?)\)/i);
  if (envMatch) {
    const victimName = envMatch[1].trim();
    const victimId = envMatch[2];
    const reason = envMatch[3].trim();

    console.log(`[RCON Combat] Environment: ${victimName} (${victimId}) died from ${reason}`);
    incrementPlayerStats(victimId, { deaths: 1 }, victimName);
    return;
  }

  // Pattern 4: DeathNotes or Plugin formatted logs:
  // "[DeathNotes] Killer killed Victim with Weapon"
  // "Death: VictimName (76561199863588476)"
  const pluginMatch = msg.match(/(\d{17}).*?(?:died|killed|death)/i);
  if (pluginMatch && !pvpMatch && !pveMatch && !envMatch) {
    const steamId = pluginMatch[1];
    incrementPlayerStats(steamId, { deaths: 1 });
  }
}

/**
 * Poll connected players via RCON and accumulate real-time in-game playtime
 */
async function syncOnlinePlaytime() {
  if (!monitorWs || monitorWs.readyState !== WebSocket.OPEN) return;

  try {
    const messageId = 8888;
    monitorWs.send(
      JSON.stringify({
        Identifier: messageId,
        Message: "status",
        Name: "GOAT-Monitor",
      })
    );
  } catch (err) {
    console.error("[RCON Monitor] Failed to request status:", err.message);
  }
}

/**
 * Parse status command response to extract all online players and credit playtime
 */
function handleStatusOutput(output) {
  if (!output || typeof output !== "string") return;

  const lines = output.split("\n");
  let foundPlayers = false;

  for (const line of lines) {
    // Look for player rows: id (17 digits) name ping connected addr
    // Example: 76561199863588476 "F1" 94 993.2044s 37.205.115.82:43815
    const match = line.match(/^(\d{17})\s+"?([^"]+?)"?\s+(\d+)\s+([\d\.]+)s/);
    if (match) {
      foundPlayers = true;
      const steamId = match[1];
      const playerName = match[2].trim();
      const connectedSeconds = Math.round(parseFloat(match[4])) || 30;

      // Credit 30 seconds of live in-server playtime
      incrementPlayerStats(steamId, { playtime_seconds: 30 }, playerName);
    }
  }
}

/**
 * Start the persistent WebRcon Monitor daemon
 */
export function startRconMonitor() {
  if (!config.rust.rconPassword || !config.rust.ip) {
    console.log("[RCON Monitor] No RCON credentials provided. Live in-game stats monitor skipped.");
    return;
  }

  const host = config.rust.ip;
  const port = config.rust.rconPort;
  const password = config.rust.rconPassword;
  const url = `ws://${host}:${port}/${encodeURIComponent(password)}`;

  function connect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);

    console.log(`[RCON Monitor] Connecting to Rust server ${host}:${port}...`);

    try {
      monitorWs = new WebSocket(url, { handshakeTimeout: 5000 });

      monitorWs.on("open", () => {
        isConnected = true;
        console.log(`[RCON Monitor] Connected! Listening for in-game kills, deaths & live playtime.`);

        // Setup 30s status polling to accumulate playtime
        if (pollTimer) clearInterval(pollTimer);
        pollTimer = setInterval(syncOnlinePlaytime, 30000);

        // Initial query
        syncOnlinePlaytime();
      });

      monitorWs.on("message", (raw) => {
        try {
          const parsed = JSON.parse(raw.toString("utf8"));
          const message = parsed.Message || "";

          // Check if this message is a response to our status poll
          if (parsed.Identifier === 8888 || message.includes("hostname:") || message.includes("players :")) {
            handleStatusOutput(message);
          } else {
            // Parse console stream for kill/death events
            parseConsoleEvent(message);
          }
        } catch (_) {
          parseConsoleEvent(raw.toString("utf8"));
        }
      });

      monitorWs.on("error", (err) => {
        console.warn("[RCON Monitor] WebSocket error:", err.message);
      });

      monitorWs.on("close", () => {
        isConnected = false;
        if (pollTimer) clearInterval(pollTimer);
        console.warn("[RCON Monitor] Connection lost. Reconnecting in 10s...");
        reconnectTimer = setTimeout(connect, 10000);
      });
    } catch (err) {
      console.error("[RCON Monitor] Startup error:", err.message);
      reconnectTimer = setTimeout(connect, 10000);
    }
  }

  connect();
}
