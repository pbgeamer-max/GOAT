import WebSocket from "ws";
import { config } from "../config.js";
import { updateKitStatus, updateBoosterStatus } from "../database/db.js";

// Sequential command queue to prevent multiple concurrent WebSockets hammering Rust RCON
let rconQueue = Promise.resolve();

/**
 * Execute an arbitrary RCON command sequentially on the Rust server using WebRcon
 */
export function executeRconCommand(command, timeoutMs = 6000) {
  return new Promise((resolve) => {
    rconQueue = rconQueue
      .then(() => _sendRconCommand(command, timeoutMs))
      .then((res) => {
        resolve(res);
        // Small 120ms breathing room between RCON commands to keep socket stable
        return new Promise((r) => setTimeout(r, 120));
      })
      .catch((err) => {
        resolve({ success: false, error: err.message });
      });
  });
}

function _sendRconCommand(command, timeoutMs) {
  return new Promise((resolve) => {
    if (!config.rust.rconPassword) {
      console.log(`[RCON SIMULATION] Executed command: "${command}"`);
      return resolve({ success: true, output: "Simulation mode (no RCON password configured)" });
    }

    const host = config.rust.ip;
    const port = config.rust.rconPort;
    const password = config.rust.rconPassword;
    const url = `ws://${host}:${port}/${encodeURIComponent(password)}`;

    let ws = null;
    let timer = null;
    let resolved = false;
    const messageId = Math.floor(Math.random() * 100000) + 1;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (ws) {
        try {
          ws.close();
        } catch (_) {}
      }
    };

    const done = (result) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(result);
    };

    timer = setTimeout(() => {
      done({ success: false, error: `RCON command timed out after ${timeoutMs}ms` });
    }, timeoutMs);

    try {
      ws = new WebSocket(url, { handshakeTimeout: 4000 });

      ws.on("open", () => {
        const payload = JSON.stringify({
          Identifier: messageId,
          Message: command,
          Name: "GOAT-RCON",
        });
        ws.send(payload);
      });

      ws.on("message", (raw) => {
        try {
          const parsed = JSON.parse(raw.toString("utf8"));
          if (parsed && (parsed.Identifier === messageId || parsed.Identifier === -1 || !parsed.Identifier)) {
            const output = parsed.Message || "";
            console.log(`[RCON] Executed "${command}" -> Response:`, output.trim().slice(0, 100));
            done({ success: true, output });
          }
        } catch (e) {
          done({ success: true, output: raw.toString("utf8") });
        }
      });

      ws.on("error", (err) => {
        console.error(`[RCON Error] ${command}:`, err.message);
        done({ success: false, error: err.message });
      });

      ws.on("close", () => {
        if (!resolved) {
          done({ success: false, error: "Connection closed before receiving response" });
        }
      });
    } catch (err) {
      done({ success: false, error: err.message });
    }
  });
}

/**
 * Notify the Rust server that a player has linked their Steam and Discord accounts
 * Grants: goatkitsui.linked and adds to group 'linked'
 */
export async function notifyRustServerLink(steamId, steamName = "Survivor") {
  if (!steamId) {
    console.error("[RCON Link] Error: Missing SteamID parameter");
    return { success: false, error: "Missing SteamID" };
  }

  const cleanSteamId = String(steamId).trim();
  console.log(`[RCON Link] 📡 Granting GoatKitsUI linked perks to: ${cleanSteamId} (${steamName})`);

  try {
    // 1. Grant GoatKitsUI linked permission (checked by IsPlayerLinked())
    const res = await executeRconCommand(`o.grant user ${cleanSteamId} goatkitsui.linked`);

    // 2. Also try oxide.grant fallback if needed
    if (!res.success || (res.output && res.output.toLowerCase().includes("unknown command"))) {
      await executeRconCommand(`oxide.grant user ${cleanSteamId} goatkitsui.linked`);
    }

    // 3. Add to Oxide 'linked' group
    await executeRconCommand(`o.usergroup add ${cleanSteamId} linked`).catch(() => {});

    // 4. In-game broadcast
    await executeRconCommand(`say [GOAT 5X] ⭐ ${steamName} linked Discord on the website and unlocked /kit discord!`).catch(() => {});

    console.log(`[RCON Link] ✅ Successfully granted goatkitsui.linked for [${cleanSteamId}] (${steamName})`);
    updateKitStatus(cleanSteamId, 1);
    return { success: true, output: "Linked perks granted" };
  } catch (err) {
    console.error(`[RCON Link] ❌ Failed to link player "${cleanSteamId}":`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Notify the Rust server of a player's Discord Booster status
 * Grants: goatkitsui.booster and adds to group 'booster'
 */
export async function setRustServerBooster(steamId, isBooster = true, steamName = "Survivor") {
  if (!steamId) {
    console.error("[RCON Booster] Error: Missing SteamID parameter");
    return { success: false, error: "Missing SteamID" };
  }

  const cleanSteamId = String(steamId).trim();
  console.log(`[RCON Booster] 🚀 Processing booster status [${isBooster ? "GRANT" : "REVOKE"}] for SteamID: ${cleanSteamId} (${steamName})`);

  try {
    if (isBooster) {
      // 1. Grant GoatKitsUI booster permission (checked by IsPlayerBooster())
      const permGrant = await executeRconCommand(`o.grant user ${cleanSteamId} goatkitsui.booster`);
      if (!permGrant.success || (permGrant.output && permGrant.output.toLowerCase().includes("unknown command"))) {
        await executeRconCommand(`oxide.grant user ${cleanSteamId} goatkitsui.booster`);
      }

      // 2. Add player to Oxide 'booster' group
      await executeRconCommand(`o.usergroup add ${cleanSteamId} booster`).catch(() => {});

      // 3. Broadcast in Rust chat
      await executeRconCommand(`say [GOAT 5X] 🚀 ${steamName} boosted our Discord server and unlocked Booster Perks & /kit booster!`).catch(() => {});

      console.log(`[RCON Booster] ✅ Granted goatkitsui.booster + added to 'booster' group for [${cleanSteamId}] (${steamName})`);
    } else {
      // 1. Revoke GoatKitsUI booster permission
      const permRevoke = await executeRconCommand(`o.revoke user ${cleanSteamId} goatkitsui.booster`);
      if (!permRevoke.success || (permRevoke.output && permRevoke.output.toLowerCase().includes("unknown command"))) {
        await executeRconCommand(`oxide.revoke user ${cleanSteamId} goatkitsui.booster`);
      }

      // 2. Remove player from Oxide 'booster' group
      await executeRconCommand(`o.usergroup remove ${cleanSteamId} booster`).catch(() => {});

      console.log(`[RCON Booster] 🔒 Revoked goatkitsui.booster + removed from 'booster' group for [${cleanSteamId}] (${steamName})`);
    }

    updateBoosterStatus(cleanSteamId, isBooster ? 1 : 0);
    return { success: true, output: isBooster ? "Booster perks granted" : "Booster perks revoked" };
  } catch (err) {
    console.error(`[RCON Booster] ❌ Failed booster command for "${cleanSteamId}":`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Set or Revoke in-game VIP Rank & HQ Building Upgrade (30 Days)
 */
export async function setRustServerVip(steamId, isVip = true, tier = "vip", steamName = "Survivor") {
  if (!steamId) return { success: false, error: "Missing SteamID" };

  const cleanSteamId = String(steamId).trim();
  const cleanTier = String(tier).toLowerCase().trim() || "vip";
  console.log(`[RCON VIP] 👑 Processing VIP status [${isVip ? "GRANT" : "REVOKE"}] Tier: ${cleanTier} for SteamID: ${cleanSteamId} (${steamName})`);

  try {
    if (isVip) {
      // 1. Add player to Oxide VIP group
      await executeRconCommand(`o.usergroup add ${cleanSteamId} ${cleanTier}`);

      // 2. Grant HQ Building Upgrade permission
      await executeRconCommand(`o.grant user ${cleanSteamId} upgrade.hq`);
      await executeRconCommand(`o.grant user ${cleanSteamId} buildinggrade.toptier`).catch(() => {});
      await executeRconCommand(`o.grant user ${cleanSteamId} bgrade.4`).catch(() => {});

      // 3. Grant Kit permission & UI role state
      await executeRconCommand(`o.grant user ${cleanSteamId} goatkitsui.${cleanTier}`).catch(() => {});
      await executeRconCommand(`goatui.setrole ${cleanSteamId} ${cleanTier} true`).catch(() => {});

      // 4. In-Game Chat Announcement
      await executeRconCommand(`say [GOAT 5X] ⭐ ${steamName} unlocked ${cleanTier.toUpperCase()} & HQ Building Upgrade (30 Days)!`).catch(() => {});

      console.log(`[RCON VIP] ✅ Granted ${cleanTier} + upgrade.hq for [${cleanSteamId}] (${steamName})`);
    } else {
      // 1. Remove player from Oxide VIP group
      await executeRconCommand(`o.usergroup remove ${cleanSteamId} ${cleanTier}`);

      // 2. Revoke HQ Building Upgrade permission
      await executeRconCommand(`o.revoke user ${cleanSteamId} upgrade.hq`);
      await executeRconCommand(`o.revoke user ${cleanSteamId} buildinggrade.toptier`).catch(() => {});
      await executeRconCommand(`o.revoke user ${cleanSteamId} bgrade.4`).catch(() => {});

      // 3. Revoke Kit permission & UI role state
      await executeRconCommand(`o.revoke user ${cleanSteamId} goatkitsui.${cleanTier}`).catch(() => {});
      await executeRconCommand(`goatui.setrole ${cleanSteamId} ${cleanTier} false`).catch(() => {});

      console.log(`[RCON VIP] 🔒 Revoked ${cleanTier} + upgrade.hq for [${cleanSteamId}] (${steamName})`);
    }

    return { success: true, isVip, tier: cleanTier };
  } catch (err) {
    console.error(`[RCON VIP] ❌ Failed VIP RCON command for "${cleanSteamId}":`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sync a single booster via RCON
 */
export async function syncBoosterToRust(steamId, steamName = "Survivor") {
  return setRustServerBooster(steamId, true, steamName);
}

/**
 * Automatically grant the Discord Kit to a linked Steam user
 */
export async function grantDiscordKit(steamId, steamName = "Survivor") {
  return notifyRustServerLink(steamId, steamName);
}

/**
 * Fetch online players directly via RCON
 */
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
        players.push({
          SteamID: match[1],
          DisplayName: match[2],
        });
      }
    }
  }

  return players;
}
