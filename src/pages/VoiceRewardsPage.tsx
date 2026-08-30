import React from "react";
import { VoiceRewardsSection } from "@/components/VoiceRewardsSection";
import { Mic, Headphones, Users, Award, Shield } from "lucide-react";
import { useServer } from "@/context/ServerContext";

export const VoiceRewardsPage: React.FC = () => {
  const { discordUrl } = useServer();

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-xs font-bold uppercase tracking-widest mb-4">
          <Mic className="w-3.5 h-3.5" /> VOICE REWARDS SYSTEM
        </div>
        <h1 className="font-display font-black text-4xl sm:text-6xl text-white uppercase tracking-tight">
          DISCORD VOICE HOURS <span className="text-indigo-400">&</span> CLAN TRACKING
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base font-sans max-w-2xl mt-2">
          Earn recognition and exclusive in-game perks simply by talking with your teammates in any Discord voice channel! Our bot automatically logs your active call time 24/7.
        </p>
      </div>

      {/* Main Voice Rewards Section */}
      <VoiceRewardsSection />
    </div>
  );
};
