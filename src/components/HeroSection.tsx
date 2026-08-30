import React, { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { ChevronRight, Copy, Check, ShieldAlert } from "lucide-react";

export const HeroSection: React.FC = () => {
  const { status, connectCommand } = useServer();
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopyF1 = async () => {
    const success = await copyToClipboard(connectCommand);
    if (success) {
      setCopied(true);
      showToast(connectCommand, "success");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isOnline = status.isOnline;
  const playersCount = status.players || 0;
  const maxPlayersCount = status.maxPlayers || 300;

  return (
    <section
      id="home"
      className="relative min-h-[92vh] flex flex-col justify-between items-center pt-32 pb-6 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#06080d]"
    >
      {/* Background Graphic Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Dark radial glow & spot illumination */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1100px] h-[550px] bg-radial-gradient from-red-600/10 via-red-900/5 to-transparent rounded-full blur-[140px]" />
        
        {/* Subtle Rust silhouettes backdrop */}
        <div className="absolute inset-0 bg-tactical-grid opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-transparent to-[#06080d]/80" />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full my-auto flex flex-col items-start px-4 sm:px-8">
        {/* Top Status Pill: 2,469 playing across 13 servers */}
        <div className="inline-flex items-center gap-2 mb-6 select-none animate-in fade-in slide-in-from-top-3 duration-500">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-display font-bold text-xs sm:text-sm tracking-wider text-zinc-300">
            <strong className="text-white font-extrabold">{isOnline ? `${playersCount}` : "2,469"}</strong> playing across{" "}
            <strong className="text-white font-extrabold">{isOnline ? "GOAT 5X" : "servers"}</strong>
          </span>
        </div>

        {/* 1:1 Atlas Rust Headline */}
        <div className="text-left mb-10 select-none">
          <h1 className="font-display font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight text-white uppercase leading-[0.95] drop-shadow-[0_15px_40px_rgba(0,0,0,0.95)]">
            WHERE THE
            <br />
            <span className="text-[#e62020] inline-block filter drop-shadow-[0_0_40px_rgba(230,32,32,0.6)]">
              BEST
            </span>
            <br />
            COMPETE<span className="text-[#e62020]">.</span>
          </h1>
        </div>

        {/* 1:1 Atlas Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-5 w-full sm:w-auto">
          {/* Primary: VISIT STORE > */}
          <a
            href="#store"
            className="atlas-btn-red px-8 py-4 text-white font-display font-extrabold text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(230,32,32,0.4)]"
          >
            <span>VISIT STORE</span>
            <ChevronRight className="w-4 h-4 text-white/80" />
          </a>

          {/* Secondary: REPORT CHEATER > */}
          <a
            href="#rules"
            className="atlas-btn-dark px-7 py-4 text-zinc-200 font-display font-bold text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <span>REPORT CHEATER</span>
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </a>

          {/* F1 Instant Connect Button */}
          <button
            onClick={handleCopyF1}
            className="px-6 py-4 rounded bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">COPIED F1!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>CONNECT F1</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1:1 Atlas Bottom Partner & Stats Bar */}
      <div className="relative z-10 w-full max-w-[1400px] border-t border-white/10 pt-6 mt-12 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-400 text-xs font-display">
        {/* Left: Powered by Partners */}
        <div className="flex items-center gap-6 opacity-75 grayscale hover:grayscale-0 transition-all">
          <span className="font-mono text-[11px] tracking-widest uppercase text-zinc-400">
            POWERED BY
          </span>
          <span className="font-display font-black text-sm tracking-wider text-white">
            RUST
          </span>
          <span className="font-mono text-xs tracking-wider text-zinc-400">
            GOAT-SHIELD
          </span>
          <span className="font-mono text-xs tracking-wider text-zinc-400">
            WEBRCON
          </span>
        </div>

        {/* Right: Server Telemetry Stats */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-[11px] uppercase tracking-wider text-zinc-300">
          <div>
            <strong className="text-white font-extrabold text-sm">50K+</strong> BANS
          </div>
          <div className="text-zinc-600">•</div>
          <div>
            <strong className="text-white font-extrabold text-sm">24/7</strong> STAFF
          </div>
          <div className="text-zinc-600">•</div>
          <div>
            <strong className="text-emerald-400 font-extrabold text-sm">99.9%</strong> UPTIME
          </div>
          <div className="text-zinc-600">•</div>
          <div>
            <strong className="text-white font-extrabold text-sm">5M+</strong> YEARLY PLAYERS
          </div>
        </div>
      </div>
    </section>
  );
};
