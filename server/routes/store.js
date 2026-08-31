import express from "express";
import { config } from "../config.js";
import { getUser, grantVipSubscription, revokeVipSubscription } from "../database/db.js";
import { setRustServerVip } from "../services/rcon.js";
import { grantDiscordVipRole, revokeDiscordVipRole } from "../services/bot.js";

const router = express.Router();

/**
 * POST /api/store-webhook
 * Automated Webhook for Tebex / Store purchases.
 * Automatically grants in-game VIP group, HQ building upgrade, and Discord VIP role for 30 days.
 */
router.post("/api/store-webhook", async (req, res) => {
  try {
    const body = req.body || {};
    const secret = req.headers["x-store-secret"] || body.secret;
    const expectedSecret = process.env.STORE_WEBHOOK_SECRET || "goat-store-webhook-secret-2026";

    // Optional secret verification if configured
    if (process.env.STORE_WEBHOOK_SECRET && secret !== expectedSecret) {
      return res.status(403).json({ success: false, error: "Invalid webhook secret" });
    }

    // Extract Steam ID and package info (supports Tebex webhook schemas & direct API calls)
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

    // Check if user is in database
    const user = getUser(steamId) || { steam_id: steamId, steam_name: body.username || "Survivor" };
    const steamName = user.steam_name || body.username || "Survivor";

    // 1. Grant in-game VIP group & HQ Building upgrade via RCON
    const rconRes = await setRustServerVip(steamId, true, tier, steamName);

    // 2. Save in database with exact 30-day expiration timestamp
    grantVipSubscription(steamId, tier, durationDays, user.discord_id);

    // 3. Grant Discord VIP role if user is linked
    if (user.discord_id) {
      await grantDiscordVipRole(user.discord_id, tier, steamName);
    }

    console.log(`[Store Webhook] 🚀 Activated 30-day ${tier.toUpperCase()} for ${steamName} (${steamId})`);

    res.json({
      success: true,
      message: `Activated 30-day ${tier.toUpperCase()} for ${steamName} (${steamId})`,
      tier,
      durationDays,
      rconResult: rconRes,
    });
  } catch (err) {
    console.error("[Store Webhook Error]:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/user/vip-status
 * Check current authenticated user's VIP perks and remaining days
 */
router.get("/api/user/vip-status", (req, res) => {
  try {
    if (!req.user || !req.user.steam_id) {
      return res.status(401).json({ success: false, error: "Not logged in" });
    }

    const user = getUser(req.user.steam_id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    let remainingDays = 0;
    if (user.is_vip && user.vip_expires_at) {
      const exp = new Date(user.vip_expires_at).getTime();
      const diffMs = exp - Date.now();
      remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
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

export default router;
