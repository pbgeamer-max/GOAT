import React from "react";
import { LeaderboardSection } from "@/components/LeaderboardSection";
import { StatsDashboard } from "@/components/StatsDashboard";
import { Users, Trophy, Flame, Target } from "lucide-react";

export const PlayersPage: React.FC = () => {
  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-bold uppercase tracking-widest mb-4">
          <Trophy className="w-3.5 h-3.5" /> COMPETITIVE STANDINGS
        </div>
        <h1 className="font-display font-black text-4xl sm:text-6xl text-white uppercase tracking-tight">
          TOP PLAYERS <span className="text-red-500">&</span> LEADERBOARD
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base font-sans max-w-2xl mt-2">
          Real-time player telemetry directly synced from our Rust server. Track top fraggers, K/D ratios, raid explosives, and farm champions across the current wipe!
        </p>
      </div>

      {/* Main Leaderboard */}
      <div className="mb-16">
        <LeaderboardSection />
      </div>

      {/* Profile & Linking Section */}
      <div className="mt-12">
        <StatsDashboard />
      </div>
    </div>
  );
};
