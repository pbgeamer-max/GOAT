"use client";

import React, { useState } from "react";
import { useServer } from "@/context/ServerContext";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { 
  PlayCircle, 
  Terminal, 
  Check, 
  Copy, 
  Gamepad2, 
  ArrowRight, 
  HelpCircle,
  Laptop
} from "lucide-react";

export const HowToPlay: React.FC = () => {
  const { connectCommand, steamConnectUrl, serverName } = useServer();
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async () => {
    const success = await copyToClipboard(connectCommand);
    if (success) {
      setCopied(true);
      showToast(connectCommand, "success");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const steps = [
    {
      step: "01",
      title: "Launch Rust",
      description: "Start the game client from your Steam Library and ensure you are on the main menu.",
      icon: Laptop,
      badge: "STEP 1",
    },
    {
      step: "02",
      title: "Press F1",
      description: "Press the F1 key on your keyboard to open the Rust developer in-game console.",
      icon: Terminal,
      badge: "STEP 2",
    },
    {
      step: "03",
      title: "Paste & Connect",
      description: `Paste "${connectCommand}" into the console and press Enter to instantly connect.`,
      icon: PlayCircle,
      badge: "STEP 3",
      action: true,
    },
  ];

  return (
    <section id="how-to-play" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rust-500/10 border border-rust-500/30 text-rust-400 font-mono text-xs uppercase tracking-widest font-semibold mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          CONNECTION GUIDE
        </div>
        <h2 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-white uppercase tracking-tight mb-4">
          HOW TO <span className="bg-gradient-to-r from-rust-400 to-rust-600 text-transparent bg-clip-text">JOIN THE SERVER</span>
        </h2>
        <p className="font-sans text-base sm:text-lg text-zinc-400 leading-relaxed">
          Follow these 3 simple steps to enter {serverName} in under 10 seconds.
        </p>
      </div>

      {/* 3 Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.step}
              className="relative bg-obsidian-900/80 border border-white/10 hover:border-rust-500/50 rounded-2xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.7)] hover:shadow-[0_15px_40px_rgba(249,115,22,0.2)] transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Step indicator watermark */}
              <div className="absolute top-4 right-6 font-display font-black text-6xl text-white/[0.03] group-hover:text-rust-500/10 transition-colors pointer-events-none select-none">
                {s.step}
              </div>

              <div>
                {/* Header Icon + Badge */}
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-obsidian-950 border border-rust-500/30 group-hover:border-rust-500/60 flex items-center justify-center text-rust-400 group-hover:text-white transition-all group-hover:bg-rust-500/20 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-rust-500/15 text-rust-300 border border-rust-500/30">
                    {s.badge}
                  </span>
                </div>

                <h3 className="font-display font-bold text-2xl text-white uppercase tracking-wide mb-3 group-hover:text-rust-300 transition-colors">
                  {s.title}
                </h3>
                <p className="font-sans text-sm sm:text-base text-zinc-400 leading-relaxed mb-6">
                  {s.description}
                </p>
              </div>

              {/* Step Specific Action */}
              {s.action ? (
                <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
                  <button
                    onClick={handleCopy}
                    className={`w-full py-3 px-4 rounded-xl font-display font-bold text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                      copied
                        ? "bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400"
                        : "bg-gradient-to-r from-rust-600 to-rust-500 hover:from-rust-500 hover:to-rust-400 text-white shadow-[0_0_25px_rgba(249,115,22,0.4)] border border-rust-400/40"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        COPIED COMMAND!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        COPY COMMAND
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-zinc-500">
                  <span>NEXT STEP</span>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-rust-400 group-hover:translate-x-1 transition-all" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Alternative Steam Launcher Box */}
      <div className="mt-10 p-6 rounded-2xl bg-obsidian-950/70 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-[#171a21] border border-white/10 flex items-center justify-center text-white shrink-0">
            <Gamepad2 className="w-6 h-6 text-rust-400" />
          </div>
          <div>
            <h4 className="font-display font-bold text-lg text-white uppercase tracking-wide">
              Prefer One-Click Steam Launch?
            </h4>
            <p className="font-sans text-xs sm:text-sm text-zinc-400">
              Clicking below will automatically trigger Steam to boot Rust and direct-connect to the server.
            </p>
          </div>
        </div>
        <a
          href={steamConnectUrl}
          className="shrink-0 px-6 py-3 rounded-xl font-display font-bold text-sm uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-white border border-white/15 transition-colors flex items-center gap-2"
        >
          <Gamepad2 className="w-4 h-4 text-rust-400" />
          LAUNCH VIA STEAM
        </a>
      </div>
    </section>
  );
};
