import WebSocket from "ws";
import { config } from "../config.js";
import { updateKitStatus, updateBoosterStatus } from "../database/db.js";

// ─────────────────────────────────────────────────────────────────────────────
//  Persistent RCON Connection Manager
//  Opens ONE WebSocket to the Rust server and keeps it alive.
//  All commands are serialized through a queue so they never overlap.
// ─────────────────────────────────────────────────────────────────────────────

let _ws = null;              // live WebSocket
let _ready = false;          // connection is open & authenticated
let _reconnecting = false;   // reconnect already scheduled
let _pendingResolvers = {};  // { [messageId]: { resolve, timer } }
let _cmdQueue = [];          // queued commands waiting for connection
let _processing = false;     // drain guard
let _idCounter = 1;          // auto-increment message ID

const DELAY_BETWEEN_CMDS  = 150;  // ms between sequential commands
const RECONNECT_DELAY_MS  = 3000; // ms before reconnect attempt
const CMD_TIMEOUT_MS      = 8000; // ms before a single command times out

function getRconUrl() {
  const { ip, rconPort, rconPassword } = config.rust;
  return `ws://${ip}:${rconPort}/${encodeURIComponent(rconPassword)}`;
}

function scheduleReconnect() {
  if (_reconnecting) return;
  _reconnecting = true;
  _ready = false;
  _ws = null;

  // Reject everything currently pending so callers don't hang
  for (const [id, { resolve, timer }] of Object.entries(_pendingResolvers)) {
    clearTimeout(timer);
    resolve({ success: false, error: "RCON reconnecting – command dropped" });
  }
  _pendingResolvers = {};

  console.log(`[RCON] Reconnecting in ${RECONNECT_DELAY_MS / 1000}s…`);
  setTimeout(() => {
    _reconnecting = false;
    connectRcon();
  }, RECONNECT_DELAY_MS);
}

function connectRcon() {
  if (!config.rust.rconPassword) {
    console.log("[RCON] No password configured – running in simulation mode.");
    return;
  }

  if (_ws) return; // already connecting or open

  const url = getRconUrl();
  console.log(`[RCON] Connecting to ${config.rust.ip}:${config.rust.rconPort}…`);

  try {
    _ws = new WebSocket(url, { handshakeTimeout: 5000 });
  } catch (err) {
    console.error("[RCON] Failed to create WebSocket:", err.message);
    scheduleReconnect();
    return;
  }

  _ws.on("open", () => {
    console.log("[RCON] ✅ Connected (persistent)");
    _ready = true;
    _reconnecting = false;
    drainQueue();
  });

  _ws.on("message", (raw) => {
    let parsed;
    try {
      parsed = JSON.parse(raw.toString("utf8"));
    } catch {
      return;
    }

    const id = parsed?.Identifier;
    if (id && _pendingResolvers[id]) {
      const { resolve, timer } = _pendingResolvers[id];
      clearTimeout(timer);
      delete _pendingResolvers[id];
      resolve({ success: true, output: parsed.Message || "" });
    }
  });

  _ws.on("error", (err) => {
    // ECONNRESET / ECONNREFUSED etc.
    console.error("[RCON] WebSocket error:", err.message);
    // Don't double-schedule; close event fires right after error
  });

  _ws.on("close", (code, reason) => {
    console.warn(`[RCON] Connection closed (code ${code}). Scheduling reconnect…`);
    _ready = false;
    scheduleReconnect();
  });
}

// Drain the command queue in strict serial order
async function drainQueue() {
  if (_processing) return;
  _processing = true;

  while (_cmdQueue.length > 0) {
    if (!_ready || !_ws || _ws.readyState !== WebSocket.OPEN) {
      _processing = false;
      return; // stop; reconnect will restart drainQueue via open event
    }

    const { command, resolve } = _cmdQueue.shift();
    const messageId = _idCounter++ & 0x7fffffff; // wrap at 31-bit positive int

    await new Promise((innerResolve) => {
      // Timeout guard per command
      const timer = setTimeout(() => {
        delete _pendingResolvers[messageId];
        resolve({ success: false, error: `RCON timeout after ${CMD_TIMEOUT_MS}ms: "${command}"` });
        innerResolve();
      }, CMD_TIMEOUT_MS);

      _pendingResolvers[messageId] = {
        resolve: (result) => {
          clearTimeout(timer);
          const output = (result.output || "").trim().slice(0, 120);
          if (result.success) {
            console.log(`[RCON] ✔ "${command}" → ${output || "(ok)"}`);
          } else {
            console.warn(`[RCON] ✘ "${command}" → ${result.error}`);
          }
          resolve(result);
          innerResolve();
        },
        timer,
      };

      try {
        _ws.send(JSON.stringify({ Identifier: messageId, Message: command, Name: "GOAT-RCON" }));
      } catch (err) {
        clearTimeout(timer);
        delete _pendingResolvers[messageId];
        resolve({ success: false, error: err.message });
        innerResolve();
      }
    });

    // Small breathing room to avoid overwhelming Rust's RCON parser
    if (_cmdQueue.length > 0) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_CMDS));
    }
  }

  _processing = false;
}

/**
 * Public API – enqueue an RCON command and await the result.
 */
export function executeRconCommand(command, _unused = 6000) {
  if (!config.rust.rconPassword) {
    console.log(`[RCON SIMULATION] "${command}"`);
    return Promise.resolve({ success: true, output: "Simulation mode" });
  }

  // Lazily establish connection on first use
  if (!_ws && !_reconnecting) connectRcon();

  return new Promise((resolve) => {
    _cmdQueue.push({ command, resolve });
    if (_ready) drainQueue();
  });
}

// Boot the persistent connection when the module is imported
connectRcon();

// ─────────────────────────────────────────────────────────────────────────────
//  High-level helpers  (unchanged API surface)
// ─────────────────────────────────────────────────────────────────────────────

export async function notifyRustServerLink(steamId, steamName = "Survivor") {
  if (!steamId) {
    console.error("[RCON Link] Error: Missing SteamID");
    return { success: false, error: "Missing SteamID" };
  }

  const id = String(steamId).trim();
  console.log(`[RCON Link] 📡 Granting linked perks to: ${id} (${steamName})`);

  try {
    const res = await executeRconCommand(`o.grant user ${id} goatkitsui.linked`);
    if (!res.success || (res.output?.toLowerCase().includes("unknown command"))) {
      await executeRconCommand(`oxide.grant user ${id} goatkitsui.linked`);
    }
    await executeRconCommand(`o.usergroup add ${id} linked`).catch(() => {});
    await executeRconCommand(`say [GOAT 5X] ⭐ ${steamName} linked Discord on the website and unlocked /kit discord!`).catch(() => {});

    console.log(`[RCON Link] ✅ Linked perks granted for [${id}] (${steamName})`);
    updateKitStatus(id, 1);
    return { success: true, output: "Linked perks granted" };
  } catch (err) {
    console.error(`[RCON Link] ❌ Failed for "${id}":`, err.message);
    return { success: false, error: err.message };
  }
}

export async function setRustServerBooster(steamId, isBooster = true, steamName = "Survivor") {
  if (!steamId) {
    console.error("[RCON Booster] Error: Missing SteamID");
    return { success: false, error: "Missing SteamID" };
  }

  const id = String(steamId).trim();
  console.log(`[RCON Booster] 🚀 [${isBooster ? "GRANT" : "REVOKE"}] ${id} (${steamName})`);

  try {
    if (isBooster) {
      const res = await executeRconCommand(`o.grant user ${id} goatkitsui.booster`);
      if (!res.success || res.output?.toLowerCase().includes("unknown command")) {
        await executeRconCommand(`oxide.grant user ${id} goatkitsui.booster`);
      }
      await executeRconCommand(`o.usergroup add ${id} booster`).catch(() => {});
      await executeRconCommand(`say [GOAT 5X] 🚀 ${steamName} boosted our Discord server and unlocked Booster Perks & /kit booster!`).catch(() => {});
      console.log(`[RCON Booster] ✅ Granted booster for [${id}]`);
    } else {
      const res = await executeRconCommand(`o.revoke user ${id} goatkitsui.booster`);
      if (!res.success || res.output?.toLowerCase().includes("unknown command")) {
        await executeRconCommand(`oxide.revoke user ${id} goatkitsui.booster`);
      }
      await executeRconCommand(`o.usergroup remove ${id} booster`).catch(() => {});
      console.log(`[RCON Booster] 🔒 Revoked booster for [${id}]`);
    }

    updateBoosterStatus(id, isBooster ? 1 : 0);
    return { success: true, output: isBooster ? "Booster perks granted" : "Booster perks revoked" };
  } catch (err) {
    console.error(`[RCON Booster] ❌ Failed for "${id}":`, err.message);
    return { success: false, error: err.message };
  }
}

export async function setRustServerVip(steamId, isVip = true, tier = "vip", steamName = "Survivor", durationDays = 30) {
  if (!steamId) return { success: false, error: "Missing SteamID" };

  const id  = String(steamId).trim();
  const lvl = String(tier).toLowerCase().trim() || "vip";
  console.log(`[RCON VIP] 👑 [${isVip ? "GRANT" : "REVOKE"}] Tier: ${lvl} for ${id} (${steamName}) [Days: ${durationDays}]`);

  try {
    if (isVip) {
      await executeRconCommand(`o.usergroup add ${id} ${lvl}`);
      await executeRconCommand(`o.grant user ${id} upgrade.hq`);
      await executeRconCommand(`o.grant user ${id} buildinggrade.toptier`).catch(() => {});
      await executeRconCommand(`o.grant user ${id} bgrade.4`).catch(() => {});
      await executeRconCommand(`o.grant user ${id} goatkitsui.${lvl}`).catch(() => {});
      await executeRconCommand(`goatui.setrole ${id} ${lvl} true ${durationDays}`).catch(() => {});

      // Clean up conflicting tiers in oxide usergroups so ranks are strictly isolated
      if (lvl === "god") {
        await executeRconCommand(`o.usergroup remove ${id} mvp`).catch(() => {});
        await executeRconCommand(`o.usergroup remove ${id} vip`).catch(() => {});
        await executeRconCommand(`o.revoke user ${id} goatkitsui.mvp`).catch(() => {});
        await executeRconCommand(`o.revoke user ${id} goatkitsui.vip`).catch(() => {});
      } else if (lvl === "mvp") {
        await executeRconCommand(`o.usergroup remove ${id} god`).catch(() => {});
        await executeRconCommand(`o.usergroup remove ${id} vip`).catch(() => {});
        await executeRconCommand(`o.revoke user ${id} goatkitsui.god`).catch(() => {});
        await executeRconCommand(`o.revoke user ${id} goatkitsui.vip`).catch(() => {});
      } else if (lvl === "vip") {
        await executeRconCommand(`o.usergroup remove ${id} god`).catch(() => {});
        await executeRconCommand(`o.usergroup remove ${id} mvp`).catch(() => {});
        await executeRconCommand(`o.revoke user ${id} goatkitsui.god`).catch(() => {});
        await executeRconCommand(`o.revoke user ${id} goatkitsui.mvp`).catch(() => {});
      }

      await executeRconCommand(`say [GOAT 5X] ⭐ ${steamName} unlocked ${lvl.toUpperCase()} (30 Days)!`).catch(() => {});
      console.log(`[RCON VIP] ✅ Granted ${lvl} + upgrade.hq (30 Days) for [${id}]`);
    } else {
      await executeRconCommand(`o.usergroup remove ${id} ${lvl}`);
      await executeRconCommand(`o.revoke user ${id} upgrade.hq`);
      await executeRconCommand(`o.revoke user ${id} buildinggrade.toptier`).catch(() => {});
      await executeRconCommand(`o.revoke user ${id} bgrade.4`).catch(() => {});
      await executeRconCommand(`o.revoke user ${id} goatkitsui.${lvl}`).catch(() => {});
      await executeRconCommand(`goatui.setrole ${id} ${lvl} false`).catch(() => {});
      console.log(`[RCON VIP] 🔒 Revoked ${lvl} + upgrade.hq for [${id}]`);
    }

    return { success: true, isVip, tier: lvl, durationDays };
  } catch (err) {
    console.error(`[RCON VIP] ❌ Failed for "${id}":`, err.message);
    return { success: false, error: err.message };
  }
}

export async function syncBoosterToRust(steamId, steamName = "Survivor") {
  return setRustServerBooster(steamId, true, steamName);
}

export async function grantDiscordKit(steamId, steamName = "Survivor") {
  return notifyRustServerLink(steamId, steamName);
}

export async function fetchRconPlayers() {
  const res = await executeRconCommand("players");
  if (!res.success || !res.output) return [];

  try {
    const data = JSON.parse(res.output);
    if (Array.isArray(data)) return data;
  } catch {}

  const statusRes = await executeRconCommand("status");
  if (!statusRes.success || !statusRes.output) return [];

  const lines = statusRes.output.split("\n");
  const players = [];
  let readingPlayers = false;

  for (const line of lines) {
    if (line.includes("id") && line.includes("name") && line.includes("ping")) {
      readingPlayers = true;
      continue;
    }
    if (readingPlayers && line.trim()) {
      const match = line.match(/^(\d{17})\s+"([^"]+)"/);
      if (match) {
        players.push({ SteamID: match[1], DisplayName: match[2] });
      }
    }
  }

  return players;
}
