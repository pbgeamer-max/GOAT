import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Helper to aggressively strip newlines, carriage returns, and spaces
const clean = (val, fallback = "") => {
  if (!val) return fallback;
  return String(val).trim().replace(/[\r\n\t]+/g, "");
};

// Helper for URLs that fixes accidentally missing leading letters (e.g. ttps:// -> https://)
const cleanUrl = (val, fallback = "") => {
  let s = clean(val, fallback);
  if (s.startsWith("ttps://")) s = "h" + s;
  if (s.startsWith("ttp://")) s = "h" + s;
  return s;
};

const int = (val, fallback = null) => {
  const parsed = parseInt(clean(val), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Clean Base URL (remove trailing slashes and hidden line breaks)
const rawBaseUrl = cleanUrl(process.env.BASE_URL, `https://goat-production-d72e.up.railway.app`);
const baseUrl = rawBaseUrl.replace(/\/+$/, "");

// Steam OpenID Realm MUST be clean and end with /
const rawRealm = cleanUrl(process.env.STEAM_REALM, baseUrl);
const steamRealm = `${rawRealm.replace(/\/+$/, "")}/`;

const steamReturnUrl = cleanUrl(process.env.STEAM_RETURN_URL, `${baseUrl}/auth/steam/return`);
const discordCallbackUrl = cleanUrl(process.env.DISCORD_CALLBACK_URL, `${baseUrl}/auth/discord/callback`);

export const config = {
  // Server Web Port
  port: int(process.env.PORT, 3000),
  nodeEnv: clean(process.env.NODE_ENV, "production"),
  baseUrl: baseUrl,
  sessionSecret: clean(process.env.SESSION_SECRET, "goat-servers-super-secret-key-2026-rust-gaming"),

  // Steam OpenID & API
  steam: {
    apiKey: clean(process.env.STEAM_API_KEY, "011062FD81D94D866EF7556022676D2D"),
    realm: steamRealm,
    returnUrl: steamReturnUrl,
  },

  // Discord OAuth2 & Bot
  discord: {
    clientId: clean(process.env.DISCORD_CLIENT_ID, "1535122555323809812"),
    clientSecret: clean(process.env.DISCORD_CLIENT_SECRET, "5GdiOWIWqu0x_-X9qT_fTtSg6aNVoUgU"),
    callbackUrl: discordCallbackUrl,
    botToken: clean(process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN, ""),
    guildId: clean(process.env.GUILD_ID, "1317494515069747240"),
    verifiedRoleId: clean(process.env.DISCORD_VERIFIED_ROLE_ID, "1540336062801649814"),
    vipRoleId: clean(process.env.DISCORD_VIP_ROLE_ID || process.env.VIP_ROLE_ID, ""),
    logChannelId: clean(process.env.DISCORD_LOG_CHANNEL_ID || process.env.STATUS_CHANNEL_ID, "1540348220310552584"),
    statusChannelId: clean(process.env.STATUS_CHANNEL_ID, ""),
    voiceChannelId: clean(process.env.VOICE_CHANNEL_ID, ""),
    reportUserId: clean(process.env.DISCORD_REPORT_USER_ID || process.env.DISCORD_ADMIN_ID || process.env.DISCORD_STAFF_ID, ""),
    reportChannelId: clean(process.env.DISCORD_REPORT_CHANNEL_ID || process.env.DISCORD_LOG_CHANNEL_ID, "1540348220310552584"),
    reportWebhookUrl: cleanUrl(process.env.DISCORD_REPORT_WEBHOOK_URL, ""),
    inviteUrl: cleanUrl(process.env.DISCORD_INVITE_URL, "https://discord.gg/z48nV6hCWm"),
  },

  // Rust Server & RCON
  rust: {
    ip: clean(process.env.RUST_SERVER_IP || process.env.SERVER_IP, "168.100.161.129"),
    port: int(process.env.SERVER_PORT, 28056),
    queryPort: int(process.env.QUERY_PORT, 28056),
    name: clean(process.env.SERVER_NAME, "GOAT 5X"),
    rconPort: int(process.env.RUST_RCON_PORT || process.env.RCON_PORT, 28058),
    rconPassword: clean(process.env.RUST_RCON_PASSWORD || process.env.RCON_PASSWORD, "f4e89244bceb34699bd30880"),
    rconEnabled: clean(process.env.RCON_ENABLED) !== "false",
    kitCommand: clean(process.env.RUST_KIT_COMMAND, "oxide.grant user {STEAM_ID} kits.discord"),
    nextWipeDate: clean(process.env.NEXT_WIPE_DATE, ""),
    wipeCycle: clean(process.env.WIPE_CYCLE, "Weekly Thursday Wipe @ 5:00 PM (17:00)"),
  },

  // Polling / Timing
  timing: {
    pollIntervalMs: int(process.env.POLL_INTERVAL_MS, 30000),
    voiceSyncMs: int(process.env.VOICE_SYNC_MS, 60000),
    queryTimeoutMs: int(process.env.QUERY_TIMEOUT_MS, 6000),
    presenceMinMs: int(process.env.PRESENCE_MIN_MS, 30000),
    voiceMinRenameMs: int(process.env.VOICE_MIN_RENAME_MS, 300000),
  },

  // BattleMetrics
  battlemetrics: {
    apiKey: clean(process.env.BM_API_KEY, ""),
    serverId: clean(process.env.BM_SERVER_ID, ""),
  },
};

export function validateConfig() {
  const warnings = [];
  if (!config.steam.apiKey) warnings.push("STEAM_API_KEY is not set (Steam Profile details may be limited)");
  if (!config.discord.clientId) warnings.push("DISCORD_CLIENT_ID is not set (Discord OAuth2 linking will fail)");
  if (!config.discord.clientSecret) warnings.push("DISCORD_CLIENT_SECRET is not set (Discord OAuth2 linking will fail)");
  if (!config.discord.botToken) warnings.push("DISCORD_BOT_TOKEN is not set (Discord Bot role granting will be offline)");
  if (!config.rust.rconPassword) warnings.push("RUST_RCON_PASSWORD is not set (In-game RCON execution will be simulated)");

  if (warnings.length > 0) {
    console.warn("⚠️ [GOAT CONFIG WARNINGS]:");
    warnings.forEach((w) => console.warn(`   • ${w}`));
  }
}
