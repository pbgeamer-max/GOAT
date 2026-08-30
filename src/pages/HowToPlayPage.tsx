import React from "react";
import { HowToPlay } from "@/components/HowToPlay";
import { BookOpen, Sparkles, HelpCircle } from "lucide-react";

export const HowToPlayPage: React.FC = () => {
  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-bold uppercase tracking-widest mb-4">
          <BookOpen className="w-3.5 h-3.5" /> SURVIVOR GUIDE
        </div>
        <h1 className="font-display font-black text-4xl sm:text-6xl text-white uppercase tracking-tight">
          HOW TO PLAY <span className="text-red-500">&</span> JOIN SERVER
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base font-sans max-w-2xl mt-2">
          New to GOAT 5X? Follow our simple 3-step connection guide, claim your free starter kit, and dominate the map in minutes.
        </p>
      </div>

      {/* Main How to Play Component */}
      <HowToPlay />
    </div>
  );
};
