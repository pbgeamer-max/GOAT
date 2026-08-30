# Rust Server Discord Bot

Real-time Rust server status bot built with **discord.js v14**. Polls your server via the Steam A2S query protocol (GameDig) and mirrors the state to Discord within one poll cycle (default **30 seconds**).

## Features

- `/server` slash command — live embed with server name, exact player count, online/offline status, plus a **Connect** button and a **Discord Join** button.
- > **Note:** Discord only allows `http:`, `https:` and `discord:` URLs in link buttons — `steam://` is rejected by the platform. The **Connect** button therefore opens a modal with the copyable `steam://connect/ip:port` link (the standard pattern used by Rust bots).
- **Instant state flip**: the moment the server goes offline/online, the bot (within one poll) switches the presence text, embed color (🟢 green / 🔴 red), and voice channel name.
- **Voice channel sync** every 60s: `🟢 25/100` or `🔴 Offline`.
- Optional persistent status message in a dedicated channel (`STATUS_CHANNEL_ID`) that is auto-maintained.
- BattleMetrics fallback if your host firewalls the A2S query port.
- Every API call wrapped in `try/catch`; the process never crashes on server restarts, API outages, or Discord rate limits.

## Requirements

- Node.js **18+** (tested on 24)
- A Discord application with a bot token
- Rust server reachable on the query port (normally **game port + 1**, e.g. 28016)

## Setup

### 1. Create the Discord bot

1. Go to https://discord.com/developers/applications → **New Application**.
2. **Bot** tab → **Reset Token** → copy it. Disable "Public Bot" if you like.
3. Invite the bot via the **OAuth2 → URL Generator**:
   - Scopes: `bot` + `applications.commands`
   - Permissions: `View Channels`, `Send Messages`, `Embed Links`, `Manage Channels` (needed for voice channel rename), `Connect`, `Speak`

### 2. Configure

```bash
npm install
copy .env.example .env
```

Edit `.env`:

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Bot token |
| `GUILD_ID` | ✅ | Right-click your server icon → Copy Server ID |
| `SERVER_IP` | ✅ | Public IP / hostname of the Rust server |
| `SERVER_PORT` | | Game port (default `28015`) |
| `QUERY_PORT` | | A2S query port. Empty = auto-try `game port + 1`, then game port |
| `STATUS_CHANNEL_ID` | | Channel where a live status embed is kept up to date |
| `VOICE_CHANNEL_ID` | | Voice channel renamed every 60s |
| `DISCORD_INVITE_URL` | | For the "Discord Join" button |
| `SERVER_NAME` | | Display name when offline |
| `POLL_INTERVAL_MS` | | Poll frequency (default `30000`). Don't go below 20s — Discord rate limits |
| `VOICE_SYNC_MS` | | Voice rename check interval (default `60000`) |
| `BM_API_KEY` / `BM_SERVER_ID` | | Optional BattleMetrics fallback (https://www.battlemetrics.com/developers) |

### 3. Run

```bash
npm start
```

## How it works / latency notes

- Every poll (30s default) the bot queries the server. On any state or player-count change it **immediately** updates the embed(s), presence, and voice channel — the Discord display never lags more than one poll cycle.
- **Discord rate limits you must know:**
  - Presence (bot status) ≈ 1 update per 60s → the bot throttles presence to `PRESENCE_MIN_MS` (30s) and never errors out.
  - Channel rename limit: **2 per 10 minutes** per channel → count-only renames are throttled to `VOICE_MIN_RENAME_MS` (5 min); online↔offline flips always bypass it.
  - Embeds are safe to edit at this frequency (limit: 5 edits / 5s / message).
- If the direct query fails (e.g. query port firewalled), the bot falls back to BattleMetrics; if that fails too, it reports **Offline** rather than erroring.

## Troubleshooting

- **"Missing required environment variables"** — copy `.env.example` to `.env` and fill `DISCORD_TOKEN`, `GUILD_ID`, `SERVER_IP`.
- **Always shows offline** — your host likely blocks the A2S query port. Set `QUERY_PORT` explicitly, or add `BM_API_KEY` + `BM_SERVER_ID`.
- **Voice channel not renaming** — the bot needs `Manage Channels` permission and `VOICE_CHANNEL_ID` must be correct.
- **Command not appearing** — re-invite the bot with the `applications.commands` scope, or run `/server` to test; registration happens at startup.
