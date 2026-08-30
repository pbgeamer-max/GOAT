"use client";

import React, { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { SERVER_CONFIG } from "@/config/serverConfig";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { 
  Server, 
  Copy, 
  Check, 
  MapPin, 
  Users, 
  Gamepad2, 
  Terminal,
  Radio,
  Clock
} from "lucide-react";

export const ServerDetails: React.FC = () => {
  const { 
    status, 
    fullAddress, 
    serverPort, 
    connectCommand, 
    steamConnectUrl, 
    serverName 
  } = useServer();

  const [copiedIp, setCopiedIp] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const { showToast } = useToast();

  const handleCopyIp = async () => {
    const success = await copyToClipboard(fullAddress);
    if (success) {
      setCopiedIp(true);
      showToast(fullAddress, "success");
      setTimeout(() => setCopiedIp(false), 2500);
    }
  };

  const handleCopyCommand = async () => {
    const success = await copyToClipboard(connectCommand);
    if (success) {
      setCopiedCmd(true);
      showToast(connectCommand, "success");
      setTimeout(() => setCopiedCmd(false), 2500);
    }
  };

  const isOnline = status.isOnline;
  const players = isOnline ? status.players : 0;
  const maxPlayers = status.maxPlayers || SERVER_CONFIG.maxPlayers;
  const percentage = maxPlayers > 0 ? Math.min(100, Math.round((players / maxPlayers) * 100)) : 0;

  return (
    <section className="relative py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="relative bg-gradient-to-b from-obsidian-900/90 via-obsidian-900/95 to-obsidian-950/95 border border-white/15 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(249,115,22,0.15)] backdrop-blur-2xl overflow-hidden">
        {/* Ambient background decorative glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-rust-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-rust-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Bar / Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-white/10 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-rust-400 mb-2">
              <Radio className={`w-3.5 h-3.5 ${isOnline ? "animate-pulse text-emerald-400" : "text-rose-500"}`} />
              {isOnline ? "LIVE SERVER TELEMETRY — ONLINE" : "LIVE SERVER TELEMETRY — OFFLINE"}
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight">
              {status.serverName || serverName}
            </h2>
          </div>

          {/* Direct Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopyIp}
              className={`px-5 py-3 rounded-xl font-display font-bold text-sm uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
                copiedIp
                  ? "bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  : "bg-rust-600 hover:bg-rust-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.35)]"
              }`}
            >
              {copiedIp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedIp ? "IP COPIED!" : "COPY IP"}
            </button>

            <a
              href={steamConnectUrl}
              className="px-5 py-3 rounded-xl font-display font-bold text-sm uppercase tracking-wider bg-obsidian-950 hover:bg-obsidian-850 text-zinc-200 hover:text-white border border-white/15 hover:border-rust-500/40 transition-all flex items-center gap-2"
            >
              <Gamepad2 className="w-4 h-4 text-rust-400" />
              STEAM LAUNCH
            </a>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 relative z-10">
          {/* IP & Port Card */}
          <div className="bg-obsidian-950/80 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-zinc-400 uppercase font-semibold">Direct Server IP</span>
              <Terminal className="w-4 h-4 text-rust-400" />
            </div>
            <div>
              <span className="font-mono text-xl sm:text-2xl text-white font-bold tracking-tight block select-all mb-2">
                {fullAddress}
              </span>
              <p className="font-sans text-xs text-zinc-400">
                Port: <span className="font-mono text-zinc-200 font-bold">{serverPort}</span> • Low Latency Global Routing
              </p>
            </div>
            <button
              onClick={handleCopyCommand}
              className="mt-4 pt-3 border-t border-white/5 font-mono text-xs text-rust-400 hover:text-rust-300 flex items-center justify-between transition-colors w-full"
            >
              <span>{copiedCmd ? "Copied command!" : "Copy F1 Console command"}</span>
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Players & Capacity */}
          <div className="bg-obsidian-950/80 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-zinc-400 uppercase font-semibold">Live Population</span>
              <Users className="w-4 h-4 text-rust-400" />
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-display font-extrabold text-3xl sm:text-4xl text-white">
                  {players}
                </span>
                <span className="font-display font-semibold text-lg text-zinc-500">
                  / {maxPlayers} PLAYERS
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-obsidian-900 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-rust-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between font-mono text-xs text-zinc-400">
              <span>Queue: <strong className="text-zinc-200">{status.queue}</strong></span>
              <span className={isOnline ? "text-emerald-400 font-bold" : "text-rose-500 font-bold"}>
                {isOnline ? "100% ONLINE" : "OFFLINE"}
              </span>
            </div>
          </div>

          {/* Map & World Details */}
          <div className="bg-obsidian-950/80 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs text-zinc-400 uppercase font-semibold">Map & Wipe Details</span>
              <MapPin className="w-4 h-4 text-rust-400" />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-white block mb-1">
                {status.map || SERVER_CONFIG.mapName}
              </span>
              <p className="font-sans text-xs text-zinc-400">
                Last Wipe: <span className="font-mono text-zinc-200 font-bold">{status.lastWipe}</span>
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between font-mono text-xs text-zinc-400">
              <span>Cycle: <strong className="text-zinc-200">Weekly</strong></span>
              <span>Next: <strong className="text-rust-300">{status.nextWipe}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
