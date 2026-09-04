import React, { createContext, useContext, useEffect, useState } from "react";
import { SERVER_CONFIG } from "@/config/serverConfig";
import {
  fetchServerStatus,
  fetchDynamicConfig,
  ServerStatusData,
  DynamicServerConfig,
  DEFAULT_STATUS,
} from "@/services/serverStatus";

interface ServerContextType {
  status: ServerStatusData;
  config: DynamicServerConfig;
  isLoading: boolean;
  discordUrl: string;
  serverIp: string;
  serverPort: number;
  fullAddress: string;
  connectCommand: string;
  steamConnectUrl: string;
  nextWipeDate: string;
  wipeCycle: string;
  wipeSchedule?: { nextWipeDate: string; cycle: string };
  serverName: string;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ServerStatusData>(DEFAULT_STATUS);
  const [dynamicConfig, setDynamicConfig] = useState<DynamicServerConfig>({
    name: SERVER_CONFIG.name,
    ip: SERVER_CONFIG.ip,
    port: SERVER_CONFIG.port,
    discordUrl: SERVER_CONFIG.discordUrl,
    nextWipeDate: SERVER_CONFIG.wipeSchedule.nextWipeDate,
    wipeCycle: SERVER_CONFIG.wipeSchedule.cycle,
  });
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch initial configuration & status
  useEffect(() => {
    let mounted = true;

    async function init() {
      const cfg = await fetchDynamicConfig();
      if (cfg && mounted) {
        setDynamicConfig((prev) => ({
          ...prev,
          ...cfg,
        }));
      }

      const st = await fetchServerStatus();
      if (mounted) {
        setStatus(st);
        setIsLoading(false);
      }
    }

    init();

    // 2. Poll server status every 8 seconds for real-time live telemetry
    const interval = setInterval(async () => {
      const liveData = await fetchServerStatus();
      if (mounted) {
        setStatus(liveData);
      }
    }, 8000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const ip = dynamicConfig.ip || SERVER_CONFIG.ip;
  const port = dynamicConfig.port || SERVER_CONFIG.port;
  const fullAddress = `${ip}:${port}`;
  const connectCommand = `connect ${fullAddress}`;
  const steamConnectUrl = `steam://run/252490//+connect ${fullAddress}/`;
  const discordUrl = dynamicConfig.discordUrl || SERVER_CONFIG.discordUrl;
  const nextWipeDate = status.nextWipeDate || dynamicConfig.nextWipeDate || SERVER_CONFIG.wipeSchedule.nextWipeDate;
  const wipeCycle = dynamicConfig.wipeCycle || SERVER_CONFIG.wipeSchedule.cycle;
  const serverName = dynamicConfig.name || SERVER_CONFIG.name;

  return (
    <ServerContext.Provider
      value={{
        status,
        config: dynamicConfig,
        isLoading,
        discordUrl,
        serverIp: ip,
        serverPort: port,
        fullAddress,
        connectCommand,
        steamConnectUrl,
        nextWipeDate,
        wipeCycle,
        wipeSchedule: { nextWipeDate, cycle: wipeCycle },
        serverName,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};

export function useServer(): ServerContextType {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error("useServer must be used within a ServerProvider");
  }
  return context;
}
