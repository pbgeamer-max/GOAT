import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config.js";
import { getUser, grantVipSubscription, revokeVipSubscription } from "../database/db.js";
import { setRustServerVip } from "../services/rcon.js";
import { grantDiscordVipRole, revokeDiscordVipRole } from "../services/bot.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const kitsFilePath = path.resolve(__dirname, "../../data/kits.json");
const tabsFilePath = path.resolve(__dirname, "../../data/tabs.json");

let inMemoryKits = null;
let inMemoryTabs = null;

function loadKits() {
  if (inMemoryKits !== null) return inMemoryKits;
  try {
    if (fs.existsSync(kitsFilePath)) {
      const raw = fs.readFileSync(kitsFilePath, "utf-8");
      inMemoryKits = JSON.parse(raw);
      return inMemoryKits;
    }
  } catch (err) {
    console.error("[Store] Failed to read kits.json:", err.message);
  }
  return [];
}

function loadTabs() {
  if (inMemoryTabs !== null && inMemoryTabs.length > 0) return inMemoryTabs;
  try {
    if (fs.existsSync(tabsFilePath)) {
      const raw = fs.readFileSync(tabsFilePath, "utf-8");
      inMemoryTabs = JSON.parse(raw);
      if (Array.isArray(inMemoryTabs) && inMemoryTabs.length > 0) return inMemoryTabs;
    }
  } catch (err) {
    console.error("[Store] Failed to read tabs.json:", err.message);
  }
  // Fallback: extract unique TabNames from current kits
  const kits = loadKits();
  const tabs = [...new Set(kits.map((k) => k.TabName).filter(Boolean))];
  if (tabs.length > 0) {
    inMemoryTabs = tabs;
    return tabs;
  }
  return ["VIP", "ALL KITS", "RESOURCES", "WEAPONS", "GEMS"];
}

const router = express.Router();

/**
 * POST /api/store-webhook
 * Automated Webhook for Tebex / Store purchases.
 */
router.post("/api/store-webhook", async (req, res) => {
  try {
    const body = req.body || {};
    const secret = req.headers["x-store-secret"] || body.secret;
    const expectedSecret = process.env.STORE_WEBHOOK_SECRET || "goat-store-webhook-secret-2026";

    if (process.env.STORE_WEBHOOK_SECRET && secret !== expectedSecret) {
      return res.status(403).json({ success: false, error: "Invalid webhook secret" });
    }

    const steamId =
      body.steam_id ||
      body.steamId ||
      body.player?.id ||
      body.subject?.steam_id ||
      body.params?.steam_id;

    if (!steamId) {
      return res.status(400).json({ success: false, error: "Missing steam_id in webhook payload" });
    }

    const rawPackage = String(body.package_name || body.tier || body.package || "vip").toLowerCase();
    let tier = "vip";
    if (rawPackage.includes("god")) tier = "god";
    else if (rawPackage.includes("mvp")) tier = "mvp";
    else if (rawPackage.includes("gun") || rawPackage.includes("weapon")) tier = "guns";
    else if (rawPackage.includes("build")) tier = "builder";

    const durationDays = parseInt(body.duration_days || body.days, 10) || 30;

    const user = getUser(steamId) || { steam_id: steamId, steam_name: body.username || "Survivor" };
    const steamName = user.steam_name || body.username || "Survivor";

    const rconRes = await setRustServerVip(steamId, true, tier, steamName);
    grantVipSubscription(steamId, tier, durationDays, user.discord_id);

    if (user.discord_id) {
      await grantDiscordVipRole(user.discord_id, tier, steamName);
    }

    console.log(`[Store Webhook] 🚀 Activated 30-day ${tier.toUpperCase()} for ${steamName} (${steamId})`);
    res.json({ success: true, message: `Activated 30-day ${tier.toUpperCase()} for ${steamName} (${steamId})`, tier, durationDays, rconResult: rconRes });
  } catch (err) {
    console.error("[Store Webhook Error]:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/user/vip-status
 */
router.get("/api/user/vip-status", (req, res) => {
  try {
    if (!req.user || !req.user.steam_id) {
      return res.status(401).json({ success: false, error: "Not logged in" });
    }

    const user = getUser(req.user.steam_id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    let remainingDays = 0;
    if (user.is_vip && user.vip_expires_at) {
      const exp = new Date(user.vip_expires_at).getTime();
      remainingDays = Math.max(0, Math.ceil((exp - Date.now()) / (1000 * 60 * 60 * 24)));
    }

    res.json({
      success: true,
      is_vip: Boolean(user.is_vip),
      vip_tier: user.vip_tier || null,
      vip_expires_at: user.vip_expires_at || null,
      vip_has_hq: Boolean(user.vip_has_hq),
      remaining_days: remainingDays,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/sync-kits
 * Real-time endpoint called by GoatKitsUI.cs whenever kits are created/updated/deleted in-game.
 * Receives both `tabs` (string[]) and `kits` (KitModel[]) and persists them.
 */
router.post("/api/sync-kits", (req, res) => {
  try {
    const { secret, tabs, kits } = req.body || {};
    const expectedSecret = process.env.API_SECRET || "goat-stats-sync-secret";

    if (secret && secret !== expectedSecret && req.headers["x-sync-secret"] !== expectedSecret) {
      console.warn("[Store] Sync-kits called with unverified secret");
    }

    if (Array.isArray(kits)) {
      // Save kits
      inMemoryKits = kits;
      try { fs.writeFileSync(kitsFilePath, JSON.stringify(kits, null, 2), "utf-8"); } catch (_) {}

      // Save tabs if provided
      if (Array.isArray(tabs)) {
        inMemoryTabs = tabs;
        try { fs.writeFileSync(tabsFilePath, JSON.stringify(tabs, null, 2), "utf-8"); } catch (_) {}
      }

      console.log(`[Store] 📦 Synced ${kits.length} kits + ${(tabs || []).length} tabs from Rust server!`);
      return res.json({ success: true, count: kits.length, tabs: (tabs || []).length });
    }

    res.status(400).json({ success: false, error: "Kits array expected" });
  } catch (err) {
    console.error("[Store] Error syncing kits:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/kits
 * Returns the current live kits list + tabs for the web store
 */
router.get("/api/kits", (req, res) => {
  try {
    const kits = loadKits();
    const tabs = loadTabs();
    res.json({
      success: true,
      kits,
      tabs,
      ticketUrl: config.discord?.inviteUrl || "https://discord.gg/7uRsxfknSG"
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
