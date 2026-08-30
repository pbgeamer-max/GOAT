import express from "express";
import { config } from "../config.js";
import { getUser } from "../database/db.js";
import { sendPlayerReport } from "../services/bot.js";

const router = express.Router();

// Helper to resolve Steam ID or Profile URL to Steam64 ID
async function resolveSteam64Id(input) {
  if (!input) return null;
  const cleanInput = String(input).trim();

  // 1. Direct 17-digit Steam64 ID
  const directMatch = cleanInput.match(/\b(7656119\d{10})\b/);
  if (directMatch) return directMatch[1];

  // 2. Steam Community Profiles URL
  const profileMatch = cleanInput.match(/steamcommunity\.com\/profiles\/(7656119\d{10})/i);
  if (profileMatch) return profileMatch[1];

  // 3. Steam Custom URL (Vanity URL)
  const vanityMatch = cleanInput.match(/steamcommunity\.com\/id\/([^\/\s\?]+)/i);
  const vanityName = vanityMatch ? vanityMatch[1] : cleanInput;

  if (config.steam.apiKey && vanityName) {
    try {
      const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${config.steam.apiKey}&vanityurl=${encodeURIComponent(vanityName)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.response?.success === 1 && data?.response?.steamid) {
        return data.response.steamid;
      }
    } catch (_) {}
  }

  return null;
}

// Helper to fetch player summary from Steam Web API
async function fetchSteamPlayerSummary(steam64Id) {
  if (!steam64Id) return null;

  if (config.steam.apiKey) {
    try {
      const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.steam.apiKey}&steamids=${steam64Id}`;
      const res = await fetch(url);
      const data = await res.json();
      const player = data?.response?.players?.[0];
      if (player) {
        return {
          steam_id: player.steamid,
          steam_name: player.personaname,
          avatar: player.avatarfull || player.avatarmedium || player.avatar,
          profile_url: player.profileurl,
          country: player.loccountrycode || "GLOBAL",
          time_created: player.timecreated ? new Date(player.timecreated * 1000).toLocaleDateString() : "Unknown",
        };
      }
    } catch (_) {}
  }

  // Fallback to local database if available
  const localUser = getUser(steam64Id);
  if (localUser) {
    return {
      steam_id: localUser.steam_id,
      steam_name: localUser.steam_name,
      avatar: localUser.avatar,
      profile_url: `https://steamcommunity.com/profiles/${localUser.steam_id}`,
      country: "GLOBAL",
      time_created: "Unknown",
    };
  }

  return {
    steam_id: steam64Id,
    steam_name: `Survivor_${steam64Id.slice(-4)}`,
    avatar: "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
    profile_url: `https://steamcommunity.com/profiles/${steam64Id}`,
    country: "GLOBAL",
    time_created: "Unknown",
  };
}

/**
 * GET /api/player-lookup
 * Search player by Steam64 ID or Profile URL
 */
router.get("/api/player-lookup", async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ success: false, error: "Please enter a Steam64 ID or profile URL" });
    }

    const steamId = await resolveSteam64Id(query);
    if (!steamId) {
      return res.status(404).json({ success: false, error: "Could not resolve Steam account from the provided input." });
    }

    const profile = await fetchSteamPlayerSummary(steamId);
    const dbUser = getUser(steamId);

    const stats = dbUser?.stats || {
      kills: 0,
      deaths: 0,
      kd_ratio: 0,
      playtime_seconds: 0,
      explosives_used: 0,
      sulfur_gathered: 0,
    };

    res.json({
      success: true,
      player: {
        ...profile,
        stats,
        is_linked: Boolean(dbUser?.is_linked),
        is_booster: Boolean(dbUser?.is_booster),
        voice_time_seconds: dbUser?.voice_time_seconds || 0,
        discord_tag: dbUser?.discord_tag || null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/report-player
 * Submit an instant cheater report -> Dispatches to Discord Staff Channel & DM
 */
router.post("/api/report-player", async (req, res) => {
  try {
    const { suspectInput, category, proofUrl, description } = req.body;

    if (!suspectInput) {
      return res.status(400).json({ success: false, error: "Suspect Steam ID or Profile URL is required." });
    }

    const suspectSteamId = await resolveSteam64Id(suspectInput);
    if (!suspectSteamId) {
      return res.status(400).json({
        success: false,
        error: "Invalid Steam ID or Profile URL. Please provide a valid 17-digit Steam64 ID or Community URL.",
      });
    }

    const suspectInfo = await fetchSteamPlayerSummary(suspectSteamId);

    const reporter = req.user || null;

    const reportResult = await sendPlayerReport({
      suspectSteamId: suspectInfo.steam_id,
      suspectName: suspectInfo.steam_name,
      suspectAvatar: suspectInfo.avatar,
      category: category || "Suspicious Behavior",
      proofUrl: proofUrl ? String(proofUrl).trim() : "",
      description: description ? String(description).trim() : "",
      reporterName: reporter?.steam_name || "Anonymous Survivor",
      reporterSteamId: reporter?.steam_id || null,
      reporterDiscordTag: reporter?.discord_id || null,
    });

    res.json({
      success: true,
      message: "Cheater report submitted successfully! Staff have been dispatched in Discord.",
      suspect: suspectInfo,
    });
  } catch (err) {
    console.error("[Report API Error]:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
