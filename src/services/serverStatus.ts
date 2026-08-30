import { SERVER_CONFIG } from "@/config/serverConfig";

export interface ServerStatusData {
  isOnline: boolean;
  serverName: string;
  ip: string;
  port: number;
  players: number;
  maxPlayers: number;
  queue: number;
  map: string;
  mapSize: number;
  fps: number;
  uptime: string;
  lastWipe: string;
  nextWipe: string;
  nextWipeDate: string;
  version?: string;
  updatedAt?: string;
}

export interface DynamicServerConfig {
  name: string;
  ip: string;
  port: number;
  discordUrl: string;
  nextWipeDate: string;
  wipeCycle: string;
}

export const DEFAULT_STATUS: ServerStatusData = {
  isOnline: false,
  serverName: SERVER_CONFIG.name,
  ip: SERVER_CONFIG.ip,
  port: SERVER_CONFIG.port,
  players: 0,
  maxPlayers: SERVER_CONFIG.maxPlayers,
  queue: 0,
  map: SERVER_CONFIG.mapName,
  mapSize: SERVER_CONFIG.mapSize,
  fps: 100,
  uptime: "99.9%",
  lastWipe: "Recently",
  nextWipe: SERVER_CONFIG.wipeSchedule.cycle,
  nextWipeDate: SERVER_CONFIG.wipeSchedule.nextWipeDate,
};

/**
 * Formats an ISO wipe date string into a user-friendly format
 */
export function formatWipeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Recently";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Fetch live status from our backend API (/api/server-status)
 */
export async function fetchServerStatus(): Promise<ServerStatusData> {
  try {
    const res = await fetch("/api/server-status", {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const data = await res.json();
    return {
      isOnline: Boolean(data.isOnline),
      serverName: data.serverName || SERVER_CONFIG.name,
      ip: data.ip || SERVER_CONFIG.ip,
      port: data.port || SERVER_CONFIG.port,
      players: Number(data.players) || 0,
      maxPlayers: Number(data.maxPlayers) || SERVER_CONFIG.maxPlayers,
      queue: Number(data.queue) || 0,
      map: data.map || SERVER_CONFIG.mapName,
      mapSize: SERVER_CONFIG.mapSize,
      fps: 100,
      uptime: data.isOnline ? "99.9%" : "0%",
      lastWipe: formatWipeDate(data.lastWipe),
      nextWipe: data.nextWipe || SERVER_CONFIG.wipeSchedule.cycle,
      nextWipeDate: data.nextWipeDate || SERVER_CONFIG.wipeSchedule.nextWipeDate,
      version: data.version,
      updatedAt: data.updatedAt,
    };
  } catch (err) {
    console.warn("[ServerStatus] Could not fetch live status, using fallback:", err);
    return {
      ...DEFAULT_STATUS,
      isOnline: false,
    };
  }
}

/**
 * Fetch dynamic configuration from backend (/api/config)
 */
export async function fetchDynamicConfig(): Promise<DynamicServerConfig | null> {
  try {
    const res = await fetch("/api/config", {
      signal: AbortSignal.timeout(4000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}
