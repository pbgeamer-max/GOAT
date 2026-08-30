import express from "express";
import { config } from "../config.js";
import { queryRustServer } from "../services/bot.js";

const router = express.Router();

// Cache for server status (25 seconds TTL)
let statusCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 25000;

// 1. Live Server Status (A2S query) with caching
router.get("/api/server-status", async (req, res) => {
  const now = Date.now();

  // Return cached result if still fresh
  if (statusCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return res.json(statusCache);
  }

  // Force fresh query
  try {
    const status = await queryRustServer(config.rust.ip, config.rust.queryPort || config.rust.port);
    statusCache = status;
    cacheTimestamp = Date.now();
    res.json(status);
  } catch (err) {
    // Return stale cache if available, otherwise offline response
    if (statusCache) {
      return res.json({ ...statusCache, updatedAt: new Date().toISOString() });
    }
    res.json({
      isOnline: false,
      online: false,
      serverName: config.rust.name,
      ip: config.rust.ip,
      port: config.rust.port,
      players: 0,
      maxPlayers: 100,
      queue: 0,
      map: "Procedural Map",
      lastWipe: null,
      nextWipe: config.rust.wipeCycle,
      updatedAt: new Date().toISOString(),
    });
  }
});

// 2. Public Config
router.get("/api/config", (req, res) => {
  res.json({
    name: config.rust.name,
    ip: config.rust.ip,
    port: config.rust.port,
    discordUrl: config.discord.inviteUrl,
    nextWipeDate: config.rust.nextWipeDate,
    wipeCycle: config.rust.wipeCycle,
  });
});

export default router;
