import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, "../../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let firestore = null;
let isFirebaseActive = false;

// ── In-Memory Sync Cache for instant microsecond responses ────
const memCache = {
  users: {}, // steam_id -> user object
  discordMap: {}, // discord_id -> steam_id
};

// ── Initialize Firebase Admin SDK ─────────────────────────────
try {
  let serviceAccount = null;
  const serviceAccountPath = path.resolve(__dirname, "serviceAccountKey.json");

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (_) {}
  }

  if (!serviceAccount && fs.existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
  }

  if (serviceAccount) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    firestore = admin.firestore();
    isFirebaseActive = true;
    console.log(`[Database] 🔥 Connected to Cloud Firebase Firestore successfully (Project: ${serviceAccount.project_id || "goat-server-1205e"})`);

    // Listen to real-time updates from Firestore to keep memCache always in sync
    firestore.collection("users").onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        if (!data || !data.steam_id) return;

        if (change.type === "removed") {
          delete memCache.users[data.steam_id];
          if (data.discord_id) delete memCache.discordMap[data.discord_id];
        } else {
          memCache.users[data.steam_id] = data;
          if (data.discord_id) {
            memCache.discordMap[data.discord_id] = data.steam_id;
          }
        }
      });
    }, (err) => {
      console.warn("[Database] Firestore snapshot listener notice:", err.message);
    });
  } else {
    console.warn("[Database] No Firebase credentials found. Using resilient local cache.");
  }
} catch (err) {
  console.error("[Database] Firebase initialization error:", err.message);
}

// Fallback JSON persistence
const fallbackFile = path.join(dataDir, "goat_store.json");
if (!isFirebaseActive) {
  if (fs.existsSync(fallbackFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(fallbackFile, "utf-8"));
      memCache.users = data.users || {};
      for (const u of Object.values(memCache.users)) {
        if (u.discord_id) memCache.discordMap[u.discord_id] = u.steam_id;
      }
    } catch (_) {}
  }
}

function saveLocalBackup() {
  if (!isFirebaseActive) {
    try {
      fs.writeFileSync(fallbackFile, JSON.stringify({ users: memCache.users }, null, 2), "utf-8");
    } catch (_) {}
  }
}

/**
 * Upsert Steam user on login
 */
export function upsertSteamUser(user) {
  const { steam_id, steam_name, avatar, profile_url } = user;
  const now = new Date().toISOString();

  const existing = memCache.users[steam_id] || {};
  const mergedUser = {
    ...existing,
    steam_id,
    steam_name,
    avatar: avatar || existing.avatar || "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
    profile_url: profile_url || existing.profile_url || `https://steamcommunity.com/profiles/${steam_id}`,
    is_linked: Boolean(existing.is_linked),
    is_booster: Boolean(existing.is_booster),
    voice_time_seconds: existing.voice_time_seconds || 0,
    clan_status: existing.clan_status || "approved",
    updated_at: now,
    created_at: existing.created_at || now,
    stats: existing.stats || {
      steam_id,
      kills: 0,
      deaths: 0,
      kd_ratio: 0,
      playtime_seconds: 0,
      headshots: 0,
      structures_built: 0,
      explosives_used: 0,
      wood_gathered: 0,
      stone_gathered: 0,
      metal_gathered: 0,
      sulfur_gathered: 0,
      last_seen: now,
    },
  };

  memCache.users[steam_id] = mergedUser;
  if (mergedUser.discord_id) {
    memCache.discordMap[mergedUser.discord_id] = steam_id;
  }

  if (isFirebaseActive && firestore) {
    firestore.collection("users").doc(steam_id).set(mergedUser, { merge: true }).catch((err) => {
      console.error("[Firestore] Error saving user:", err.message);
    });
  } else {
    saveLocalBackup();
  }

  return getUser(steam_id);
}

/**
 * Link Discord account to Steam User
 */
export function linkDiscordAccount(steam_id, discordProfile) {
  const { discord_id, discord_tag, discord_avatar } = discordProfile;
  const now = new Date().toISOString();

  const existing = memCache.users[steam_id] || { steam_id, steam_name: "Survivor" };
  existing.discord_id = discord_id;
  existing.discord_tag = discord_tag;
  existing.discord_avatar = discord_avatar;
  existing.is_linked = true;
  existing.linked_at = now;
  existing.updated_at = now;

  memCache.users[steam_id] = existing;
  memCache.discordMap[discord_id] = steam_id;

  if (isFirebaseActive && firestore) {
    firestore.collection("users").doc(steam_id).update({
      discord_id,
      discord_tag,
      discord_avatar,
      is_linked: true,
      linked_at: now,
      updated_at: now,
    }).catch((err) => {
      console.error("[Firestore] Error linking discord:", err.message);
    });
  } else {
    saveLocalBackup();
  }

  return getUser(steam_id);
}

/**
 * Update Kit Grant Status
 */
export function updateKitStatus(steam_id, granted = 1) {
  if (memCache.users[steam_id]) {
    memCache.users[steam_id].kit_granted = granted ? 1 : 0;
    memCache.users[steam_id].updated_at = new Date().toISOString();
  }
  if (isFirebaseActive && firestore) {
    firestore.collection("users").doc(steam_id).set({ kit_granted: granted ? 1 : 0 }, { merge: true }).catch(() => {});
  } else {
    saveLocalBackup();
  }
}

/**
 * Update Role Grant Status
 */
export function updateRoleStatus(steam_id, granted = 1) {
  if (memCache.users[steam_id]) {
    memCache.users[steam_id].role_granted = granted ? 1 : 0;
    memCache.users[steam_id].updated_at = new Date().toISOString();
  }
  if (isFirebaseActive && firestore) {
    firestore.collection("users").doc(steam_id).set({ role_granted: granted ? 1 : 0 }, { merge: true }).catch(() => {});
  } else {
    saveLocalBackup();
  }
}

/**
 * Update Booster Status
 */
export function updateBoosterStatus(steam_id, isBooster = 1) {
  if (memCache.users[steam_id]) {
    memCache.users[steam_id].is_booster = Boolean(isBooster);
    memCache.users[steam_id].updated_at = new Date().toISOString();
  }
  if (isFirebaseActive && firestore) {
    firestore.collection("users").doc(steam_id).set({ is_booster: Boolean(isBooster) }, { merge: true }).catch(() => {});
  } else {
    saveLocalBackup();
  }
}

/**
 * Get User by Steam ID
 */
export function getUser(steam_id) {
  if (!steam_id) return null;
  const user = memCache.users[steam_id];
  if (!user) return null;

  const stats = user.stats || {};
  const kills = stats.kills || 0;
  const deaths = stats.deaths || 0;
  const kd = deaths > 0 ? parseFloat((kills / deaths).toFixed(2)) : kills;

  return {
    ...user,
    is_linked: Boolean(user.is_linked),
    is_booster: Boolean(user.is_booster),
    voice_time_seconds: user.voice_time_seconds || 0,
    stats: {
      ...stats,
      kd_ratio: kd,
    },
  };
}

/**
 * Get User by Discord ID
 */
export function getUserByDiscordId(discord_id) {
  if (!discord_id) return null;
  const steamId = memCache.discordMap[discord_id] || Object.values(memCache.users).find((u) => u.discord_id === discord_id)?.steam_id;
  if (!steamId) return null;
  return getUser(steamId);
}

/**
 * Add voice time to user by Discord ID
 */
export function addVoiceTime(discordId, seconds) {
  if (!discordId || seconds <= 0) return;
  const user = getUserByDiscordId(discordId);

  if (user && user.steam_id) {
    const steamId = user.steam_id;
    memCache.users[steamId].voice_time_seconds = (memCache.users[steamId].voice_time_seconds || 0) + seconds;
    memCache.users[steamId].updated_at = new Date().toISOString();

    if (isFirebaseActive && firestore) {
      firestore.collection("users").doc(steamId).update({
        voice_time_seconds: admin.firestore.FieldValue.increment(seconds),
        updated_at: new Date().toISOString(),
      }).catch(() => {});
    } else {
      saveLocalBackup();
    }
  }
}

/**
 * Log a voice session
 */
export function logVoiceSession(discordId, channelId, channelName, joinedAt, leftAt, durationSeconds = 0) {
  if (!discordId) return;
  if (isFirebaseActive && firestore) {
    firestore.collection("voice_sessions").add({
      discord_id: String(discordId),
      channel_id: String(channelId || ""),
      channel_name: String(channelName || "Voice Room"),
      joined_at: joinedAt ? new Date(joinedAt).toISOString() : new Date().toISOString(),
      left_at: leftAt ? new Date(leftAt).toISOString() : new Date().toISOString(),
      duration_seconds: durationSeconds,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
  }
}

/**
 * Get Top Voice Members Leaderboard
 */
export function getVoiceLeaderboard(limit = 10) {
  const list = Object.values(memCache.users)
    .filter((u) => u.discord_id && (u.voice_time_seconds || 0) > 0)
    .sort((a, b) => (b.voice_time_seconds || 0) - (a.voice_time_seconds || 0));

  return list.slice(0, limit).map((u) => ({
    steam_id: u.steam_id,
    steam_name: u.steam_name,
    avatar: u.avatar,
    discord_id: u.discord_id,
    discord_tag: u.discord_tag,
    discord_avatar: u.discord_avatar,
    voice_time_seconds: u.voice_time_seconds || 0,
    is_booster: Boolean(u.is_booster),
    is_linked: Boolean(u.is_linked),
  }));
}

/**
 * Get Leaderboard rankings (Only real players)
 */
export function getLeaderboard(category = "kills", limit = 10) {
  const allowed = ["kills", "deaths", "kd_ratio", "playtime_seconds", "wood_gathered", "stone_gathered", "metal_gathered", "sulfur_gathered", "explosives_used", "voice_time_seconds"];
  const sortCol = allowed.includes(category) ? category : "kills";

  const list = Object.values(memCache.users)
    .filter((u) => !u.steam_id?.startsWith("7656119800000000"))
    .map((u) => {
      const s = u.stats || {};
      const kills = s.kills || 0;
      const deaths = s.deaths || 0;
      const kd = deaths > 0 ? parseFloat((kills / deaths).toFixed(2)) : kills;
      return {
        ...s,
        steam_id: u.steam_id,
        steam_name: u.steam_name,
        avatar: u.avatar,
        discord_tag: u.discord_tag,
        voice_time_seconds: u.voice_time_seconds || 0,
        kd_ratio: kd,
      };
    });

  list.sort((a, b) => (b[sortCol] ?? (sortCol === "voice_time_seconds" ? b.voice_time_seconds : 0)) - (a[sortCol] ?? 0));
  return list.slice(0, limit);
}

/**
 * Upsert or update player stats (absolute values)
 */
export function upsertPlayerStats(steam_id, stats) {
  if (!steam_id) return;
  const existing = memCache.users[steam_id] || { steam_id, steam_name: "Survivor" };
  existing.stats = {
    ...(existing.stats || {}),
    ...stats,
    steam_id,
    last_seen: new Date().toISOString(),
  };
  memCache.users[steam_id] = existing;

  if (isFirebaseActive && firestore) {
    firestore.collection("users").doc(steam_id).set({
      stats: existing.stats,
      updated_at: new Date().toISOString(),
    }, { merge: true }).catch(() => {});
  } else {
    saveLocalBackup();
  }
}

/**
 * Increment player stats (e.g. +1 kill, +1 death, +30s playtime, +1000 sulfur)
 */
export function incrementPlayerStats(steam_id, deltas = {}, playerName = null) {
  if (!steam_id) return;
  const now = new Date().toISOString();

  if (!memCache.users[steam_id]) {
    memCache.users[steam_id] = {
      steam_id,
      steam_name: playerName || "Survivor",
      avatar: "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
      profile_url: `https://steamcommunity.com/profiles/${steam_id}`,
      is_linked: false,
      created_at: now,
      updated_at: now,
    };
  }

  const cur = memCache.users[steam_id].stats || {
    steam_id,
    kills: 0,
    deaths: 0,
    playtime_seconds: 0,
    headshots: 0,
    structures_built: 0,
    explosives_used: 0,
    wood_gathered: 0,
    stone_gathered: 0,
    metal_gathered: 0,
    sulfur_gathered: 0,
  };

  memCache.users[steam_id].stats = {
    ...cur,
    kills: (cur.kills || 0) + (deltas.kills || 0),
    deaths: (cur.deaths || 0) + (deltas.deaths || 0),
    playtime_seconds: (cur.playtime_seconds || 0) + (deltas.playtime_seconds || 0),
    headshots: (cur.headshots || 0) + (deltas.headshots || 0),
    structures_built: (cur.structures_built || 0) + (deltas.structures_built || 0),
    explosives_used: (cur.explosives_used || 0) + (deltas.explosives_used || 0),
    wood_gathered: (cur.wood_gathered || 0) + (deltas.wood_gathered || 0),
    stone_gathered: (cur.stone_gathered || 0) + (deltas.stone_gathered || 0),
    metal_gathered: (cur.metal_gathered || 0) + (deltas.metal_gathered || 0),
    sulfur_gathered: (cur.sulfur_gathered || 0) + (deltas.sulfur_gathered || 0),
    last_seen: now,
  };

  if (playerName) {
    memCache.users[steam_id].steam_name = playerName;
  }

  if (isFirebaseActive && firestore) {
    firestore.collection("users").doc(steam_id).set({
      steam_name: memCache.users[steam_id].steam_name,
      stats: memCache.users[steam_id].stats,
      updated_at: now,
    }, { merge: true }).catch(() => {});
  } else {
    saveLocalBackup();
  }
}
