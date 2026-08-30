import 'dotenv/config';

const int = (value) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
};

const serverPort = int(process.env.SERVER_PORT) ?? 28015;

export const config = {
  token: process.env.DISCORD_TOKEN,
  guildId: process.env.GUILD_ID,
  serverIp: process.env.SERVER_IP,
  serverName: process.env.SERVER_NAME || 'Rust Server',
  serverPort,
  queryPort: int(process.env.QUERY_PORT),
  queryTimeoutMs: int(process.env.QUERY_TIMEOUT_MS) ?? 6000,
  pollIntervalMs: int(process.env.POLL_INTERVAL_MS) ?? 30000,
  voiceSyncMs: int(process.env.VOICE_SYNC_MS) ?? 60000,
  presenceMinMs: int(process.env.PRESENCE_MIN_MS) ?? 30000,
  voiceMinRenameMs: int(process.env.VOICE_MIN_RENAME_MS) ?? 300000,
  statusChannelId: process.env.STATUS_CHANNEL_ID || null,
  voiceChannelId: process.env.VOICE_CHANNEL_ID || null,
  discordInvite: process.env.DISCORD_INVITE_URL || null,
  bmApiKey: process.env.BM_API_KEY || null,
  bmServerId: process.env.BM_SERVER_ID || null,
};

export const connectUrl = `steam://connect/${config.serverIp}:${config.serverPort}`;

export function validateConfig() {
  const missing = [];
  if (!config.token) missing.push('DISCORD_TOKEN');
  if (!config.guildId) missing.push('GUILD_ID');
  if (!config.serverIp) missing.push('SERVER_IP');
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill them in.'
    );
  }
}
