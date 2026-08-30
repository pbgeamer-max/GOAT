import express from "express";
import passport from "../auth/passport.js";
import { config } from "../config.js";
import { getUser, upsertSteamUser } from "../database/db.js";
import { grantDiscordKit, notifyRustServerLink } from "../services/rcon.js";
import { grantVerifiedRole } from "../services/bot.js";

const router = express.Router();

// Helper to strip any newlines or spaces
const cleanStr = (s) => (s ? String(s).trim().replace(/[\r\n\t]+/g, "") : "");

// 1. Steam Login Initiation (Guaranteed Clean OpenID Realm & Return URL)
router.get("/auth/steam", (req, res) => {
  const host = cleanStr(req.headers["x-forwarded-host"] || req.headers.host);
  const proto = cleanStr(req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http"));
  const detectedOrigin = `${proto}://${host}`;

  const rawRealm = config.steam.realm.startsWith("http") ? config.steam.realm : `${detectedOrigin}/`;
  const cleanRealm = cleanStr(rawRealm);
  const formattedRealm = cleanRealm.endsWith("/") ? cleanRealm : `${cleanRealm}/`;

  const rawReturnTo = config.steam.returnUrl.startsWith("http") ? config.steam.returnUrl : `${detectedOrigin}/auth/steam/return`;
  const cleanReturnTo = cleanStr(rawReturnTo);

  const params = new URLSearchParams();
  params.set("openid.ns", "http://specs.openid.net/auth/2.0");
  params.set("openid.mode", "checkid_setup");
  params.set("openid.return_to", cleanReturnTo);
  params.set("openid.realm", formattedRealm);
  params.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
  params.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");

  res.redirect(`https://steamcommunity.com/openid/login?${params.toString()}`);
});

// 2. Steam Login Callback (Accepts both GET and POST responses)
const handleSteamReturn = async (req, res) => {
  try {
    const data = { ...req.query, ...req.body };
    const claimedId = cleanStr(data["openid.claimed_id"] || data["openid.identity"]);
    if (!claimedId) {
      console.warn("[Auth] Steam return missing claimed_id, query:", data);
      return res.redirect("/?error=steam_cancelled");
    }

    // Extract SteamID64 from claimed_id URL (https://steamcommunity.com/openid/id/<steamid>)
    const match = claimedId.match(/https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)/);
    const steamId = match ? match[1] : null;

    if (!steamId) {
      return res.redirect("/?error=invalid_steam_id");
    }

    // Fetch user profile from official Steam Web API
    let steamName = `Survivor_${steamId.slice(-4)}`;
    let avatar = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg";
    let profileUrl = `https://steamcommunity.com/profiles/${steamId}`;

    if (config.steam.apiKey) {
      try {
        const steamRes = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.steam.apiKey}&steamids=${steamId}`
        );
        if (steamRes.ok) {
          const resData = await steamRes.json();
          const p = resData?.response?.players?.[0];
          if (p) {
            steamName = p.personaname || steamName;
            avatar = p.avatarfull || p.avatarmedium || p.avatar || avatar;
            profileUrl = p.profileurl || profileUrl;
          }
        }
      } catch (apiErr) {
        console.warn("[Steam API] Failed to fetch player profile:", apiErr.message);
      }
    }

    // Save to Database
    const savedUser = upsertSteamUser({
      steam_id: steamId,
      steam_name: steamName,
      avatar,
      profile_url: profileUrl,
    });

    // Save session explicitly
    req.session.steam_id = steamId;
    req.session.user = savedUser;

    if (req.login) {
      req.login(savedUser, () => {
        req.session.save(() => {
          res.redirect("/?status=steam_connected#profile");
        });
      });
    } else {
      req.session.save(() => {
        res.redirect("/?status=steam_connected#profile");
      });
    }
  } catch (err) {
    console.error("[Auth] Steam return error:", err);
    res.redirect("/?error=steam_failed");
  }
};

router.get("/auth/steam/return", handleSteamReturn);
router.post("/auth/steam/return", handleSteamReturn);

// 3. Discord Linking Initiation
router.get("/auth/discord", (req, res, next) => {
  const currentSteamId = req.user?.steam_id || req.session?.steam_id;
  if (!currentSteamId) {
    return res.redirect("/auth/steam");
  }
  passport.authenticate("discord", { failureRedirect: "/?error=discord_failed" })(req, res, next);
});

// 4. Discord Linking Callback
router.get(
  "/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/?error=discord_failed" }),
  (req, res) => {
    res.redirect("/?status=linked_success#profile");
  }
);

// 5. Logout Route
router.get("/auth/logout", (req, res) => {
  req.session.steam_id = null;
  req.session.user = null;
  if (req.logout) {
    req.logout(() => {});
  }
  req.session.destroy(() => {
    res.redirect("/?status=logged_out");
  });
});

// 6. Get Current Authenticated User & Stats
router.get("/api/me", (req, res) => {
  const steamId = req.user?.steam_id || req.session?.steam_id;
  if (!steamId) {
    return res.json({ authenticated: false, user: null });
  }

  const freshUser = getUser(steamId);
  res.json({
    authenticated: true,
    user: freshUser || req.user || req.session?.user,
  });
});

// In-Memory Cooldown Map to prevent RCON and Discord spam (60s cooldown per player)
const syncCooldowns = new Map();

// 7. Manual / Re-trigger In-Game Kit Grant (RCON) with 60s cooldown
router.post("/api/claim-kit", async (req, res) => {
  const steamId = req.user?.steam_id || req.session?.steam_id;
  if (!steamId) {
    return res.status(401).json({ success: false, error: "Please log in first." });
  }

  const now = Date.now();
  const lastSync = syncCooldowns.get(steamId) || 0;
  const cooldownMs = 60 * 1000;

  if (now - lastSync < cooldownMs) {
    const remainingSec = Math.ceil((cooldownMs - (now - lastSync)) / 1000);
    return res.status(429).json({
      success: false,
      error: `Please wait ${remainingSec}s before syncing kits again.`,
      remainingSeconds: remainingSec,
    });
  }

  const user = getUser(steamId);
  if (!user || !user.is_linked) {
    return res.status(400).json({ success: false, error: "You must link Discord before claiming /kit." });
  }

  syncCooldowns.set(steamId, now);

  try {
    const rconRes = await grantDiscordKit(user.steam_id, user.steam_name);
    return res.json({ success: true, message: "Kit permissions synced with Rust server!", rcon: rconRes });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
