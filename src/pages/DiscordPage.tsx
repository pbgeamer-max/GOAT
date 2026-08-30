import React from "react";
import { DiscordSection } from "@/components/DiscordSection";
import { MessageSquare, Users, Sparkles, Mic, Gift } from "lucide-react";
import { useServer } from "@/context/ServerContext";

export const DiscordPage: React.FC = () => {
  const { discordUrl } = useServer();

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#5865F2]/15 border border-[#5865F2]/40 text-[#8ea1e1] font-mono text-xs font-bold uppercase tracking-widest mb-4">
          <MessageSquare className="w-3.5 h-3.5" /> OFFICIAL COMMUNITY
        </div>
        <h1 className="font-display font-black text-4xl sm:text-6xl text-white uppercase tracking-tight">
          DISCORD <span className="text-[#5865F2]">COMMUNITY</span> & SUPPORT
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base font-sans max-w-2xl mt-2">
          Join thousands of active survivors. Connect with clans, trade loot, enter giveaways, and claim your free in-game kit!
        </p>
      </div>

      {/* Main Discord Component */}
      <DiscordSection />
    </div>
  );
};
