import { GameDig } from 'gamedig';
import { config, connectUrl } from './config.js';

export function offlineSnapshot() {
  return {
    online: false,
    name: config.serverName,
    players: 0,
    maxPlayers: 0,
    connect: connectUrl,
  };
}

function fromGamedig(result) {
  const players = Array.isArray(result.players)
    ? result.players.length
    : (result.numplayers ?? 0);
  return {
    online: true,
    name: result.name || config.serverName,
    players,
    maxPlayers: result.maxplayers ?? 0,
    connect: connectUrl,
  };
}

async function queryBattleMetrics() {
  if (!config.bmApiKey || !config.bmServerId) return null;
  const res = await fetch(
    `https://api.battlemetrics.com/servers/${config.bmServerId}?include=player`,
    {
      headers: { Authorization: `Bearer ${config.bmApiKey}` },
      signal: AbortSignal.timeout(config.queryTimeoutMs),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const attrs = data?.data?.attributes;
  return {
    online: true,
    name: attrs?.name || config.serverName,
    players: attrs?.players ?? 0,
    maxPlayers: attrs?.maxPlayers ?? 0,
    connect: connectUrl,
  };
}

export async function queryRustServer() {
  const ports = config.queryPort
    ? [config.queryPort]
    : [config.serverPort + 1, config.serverPort];

  for (const port of ports) {
    try {
      const result = await GameDig.query({
        type: 'rust',
        host: config.serverIp,
        port,
        maxAttempts: 1,
        timeout: config.queryTimeoutMs,
      });
      return fromGamedig(result);
    } catch (err) {
      console.warn(`[query] direct query failed on port ${port}: ${err.message}`);
    }
  }

  try {
    const bm = await queryBattleMetrics();
    if (bm) return bm;
  } catch (err) {
    console.warn(`[query] battlemetrics fallback failed: ${err.message}`);
  }

  return offlineSnapshot();
}
