import React, { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { useNavigation } from "@/context/NavigationContext";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { ChevronRight, Copy, Check, ShieldAlert } from "lucide-react";

export const HeroSection: React.FC = () => {
  const { status, connectCommand } = useServer();
  const { activePage, navigate } = useNavigation();
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopyF1 = async () => {
    const success = await copyToClipboard(connectCommand);
    if (success) {
      setCopied(true);
      showToast("F1 Command copied! Paste in Rust console (F1)", "success");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isOnline = status.isOnline;
  const playersCount = status.players || 0;

  return (
    <section
      id="home"
      className="relative min-h-[90vh] flex flex-col justify-between items-center pt-28 sm:pt-32 pb-6 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#06080d]"
    >
      {/* 1:1 Atlas Rust Background Hero Video */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover opacity-35 filter grayscale contrast-125 brightness-95"
        >
          <source src="/atlas-hero-video.mp4" type="video/mp4" />
          <source src="/atlas-hero-video.mov" type="video/quicktime" />
        </video>

        {/* Cinematic Vignette & Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080d] via-[#06080d]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-transparent to-[#06080d]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#06080d_95%)]" />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full my-auto flex flex-col items-start px-4 sm:px-8">
        {/* Top Status Pill: 2,469 playing across servers */}
        <div className="inline-flex items-center gap-2 mb-4 select-none animate-in fade-in slide-in-from-top-3 duration-500">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-display font-bold text-xs sm:text-sm tracking-wider text-zinc-300">
            <strong className="text-white font-extrabold">{isOnline ? `${playersCount}` : "2,543"}</strong> playing across{" "}
            <strong className="text-white font-extrabold">{isOnline ? "GOAT 5X" : "servers"}</strong>
          </span>
        </div>

        {/* 1:1 Atlas Rust Headline */}
        <div className="text-left mb-8 select-none">
          <h1 className="font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] tracking-tight text-white uppercase leading-[0.93] drop-shadow-[0_15px_40px_rgba(0,0,0,0.95)]">
            WHERE THE
            <br />
            <span className="text-[#e62020] inline-block filter drop-shadow-[0_0_35px_rgba(230,32,32,0.6)]">
              BEST
            </span>
            <br />
            COMPETE<span className="text-[#e62020]">.</span>
          </h1>
        </div>

        {/* 1:1 Atlas Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          {/* Primary: VISIT STORE > */}
          <a
            href="#store"
            onClick={(e) => {
              e.preventDefault();
              navigate("store");
            }}
            className="atlas-btn-red px-7 py-3.5 text-white font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(230,32,32,0.4)] cursor-pointer"
          >
            <span>VISIT STORE</span>
            <ChevronRight className="w-4 h-4 text-white/80" />
          </a>

          {/* Secondary: REPORT CHEATER > */}
          <a
            href="#rules"
            onClick={(e) => {
              e.preventDefault();
              navigate("rules");
            }}
            className="atlas-btn-dark px-6 py-3.5 text-zinc-200 font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer hover:border-white/20"
          >
            <span>REPORT CHEATER</span>
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          </a>

          {/* F1 Instant Connect Button */}
          <button
            onClick={handleCopyF1}
            className="px-5 py-3.5 rounded bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">COPIED F1!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>CONNECT F1</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1:1 Atlas Bottom Partner & Stats Bar */}
      <div className="relative z-10 w-full max-w-[1400px] border-t border-white/10 pt-6 mt-10 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-400 text-xs font-display">
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
