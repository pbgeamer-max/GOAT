import express from "express";
import { getLeaderboard, getUser, upsertPlayerStats, incrementPlayerStats } from "../database/db.js";

const router = express.Router();

/**
 * GET /api/leaderboard
 * Fetch Top 10 rankings by category
 */
router.get("/api/leaderboard", (req, res) => {
  try {
    const category = req.query.category || "kills";
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const rankings = getLeaderboard(category, limit);
    res.json({
      success: true,
      category,
      count: rankings.length,
      data: rankings,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/voice-leaderboard
 * Fetch Top Discord Voice Active Members
 */
router.get("/api/voice-leaderboard", async (req, res) => {
  try {
    const { getVoiceLeaderboard } = await import("../database/db.js");
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const rankings = getVoiceLeaderboard(limit);
    res.json({
      success: true,
      count: rankings.length,
      data: rankings,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/stats/:steamId
 * Fetch stats for any player
 */
router.get("/api/stats/:steamId", (req, res) => {
  try {
    const steamId = req.params.steamId;
    const user = getUser(steamId);
    if (!user) {
      return res.status(404).json({ success: false, error: "Player not found" });
    }
    res.json({
      success: true,
      user: {
        steam_id: user.steam_id,
        steam_name: user.steam_name,
        avatar: user.avatar,
        discord_tag: user.discord_tag,
        is_linked: user.is_linked,
      },
      stats: user.stats,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/sync-stats
 * Ingest player stats from Oxide Rust Plugin or Webhook (supports increment and upsert)
 */
router.post("/api/sync-stats", (req, res) => {
  try {
    const { secret, steam_id, steam_name, stats, increment } = req.body;
    // Optional secret key validation
    const expectedSecret = process.env.STATS_SYNC_SECRET || "goat-stats-sync-secret";
    if (secret && secret !== expectedSecret) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    if (!steam_id || !stats) {
      return res.status(400).json({ success: false, error: "Missing steam_id or stats payload" });
    }

    if (increment) {
      incrementPlayerStats(steam_id, stats, steam_name);
    } else {
      upsertPlayerStats(steam_id, stats);
    }

    res.json({ success: true, message: `Stats updated for ${steam_id}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
