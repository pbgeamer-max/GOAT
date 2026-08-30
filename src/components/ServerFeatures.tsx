"use client";

import React from "react";
import { SERVER_CONFIG } from "@/config/serverConfig";
import { 
  Zap, 
  Flame, 
  Crosshair, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Clock, 
  LucideIcon 
} from "lucide-react";

// Icon mapping dictionary
const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Flame,
  Crosshair,
  Cpu,
  Sparkles,
  ShieldCheck,
  Layers,
  Clock,
};

export const ServerFeatures: React.FC = () => {
  return (
    <section id="server" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rust-500/10 border border-rust-500/30 text-rust-400 font-mono text-xs uppercase tracking-widest font-semibold mb-3">
          <Layers className="w-3.5 h-3.5" />
          SERVER SPECIFICATIONS
        </div>
        <h2 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-white uppercase tracking-tight mb-4">
          THE <span className="bg-gradient-to-r from-rust-400 to-rust-600 text-transparent bg-clip-text">GOAT 5X</span> ADVANTAGE
        </h2>
        <p className="font-sans text-base sm:text-lg text-zinc-400 leading-relaxed">
          Engineered for high-intensity action, zero downtime, and a refined competitive Rust balance.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {SERVER_CONFIG.features.map((feature, idx) => {
          const IconComponent = ICON_MAP[feature.icon] || Zap;
          return (
            <div
              key={feature.id}
              className="group relative bg-obsidian-900/70 hover:bg-obsidian-850/90 border border-white/10 hover:border-rust-500/40 rounded-2xl p-6 sm:p-8 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_40px_rgba(249,115,22,0.18)] flex flex-col justify-between overflow-hidden"
            >
              {/* Subtle top card glow line on hover */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rust-500 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />

              <div>
                {/* Header Row: Icon + Badge */}
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-obsidian-950 border border-rust-500/30 group-hover:border-rust-500/60 flex items-center justify-center text-rust-400 group-hover:text-white transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover:bg-rust-500/20">
                    <IconComponent className="w-7 h-7" />
                  </div>

                  {feature.badge && (
                    <span className="font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-rust-500/15 text-rust-300 border border-rust-500/30">
                      {feature.badge}
                    </span>
                  )}
                </div>

                {/* Subtitle & Title */}
                <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest font-semibold block mb-1">
                  {feature.subtitle}
                </span>
                <h3 className="font-display font-bold text-2xl text-white uppercase tracking-wide mb-3 group-hover:text-rust-300 transition-colors">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="font-sans text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Bottom Feature Index */}
              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-600 font-bold">
                  0{idx + 1} // MODULE
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-rust-500/40 group-hover:bg-rust-400 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
