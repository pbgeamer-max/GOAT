import React from "react";
import { WipeSection } from "@/components/WipeSection";
import { Calendar, Clock, Bell, Zap, Shield, ChevronRight } from "lucide-react";
import { useServer } from "@/context/ServerContext";

export const WipesPage: React.FC = () => {
  const { wipeSchedule, discordUrl } = useServer();

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-bold uppercase tracking-widest mb-4">
          <Calendar className="w-3.5 h-3.5" /> OFFICIAL SCHEDULE
        </div>
        <h1 className="font-display font-black text-4xl sm:text-6xl text-white uppercase tracking-tight">
          WIPE SCHEDULE <span className="text-red-500">&</span> TIMETABLE
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base font-sans max-w-2xl mt-2">
          Track upcoming map resets, blueprint schedules, and force wipes. Get notified before each wipe so you never miss the fresh start rush!
        </p>
      </div>

      {/* Main Wipe Countdown & Details */}
      <div className="mb-16">
        <WipeSection />
      </div>

      {/* Wipe Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-red-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-display font-black text-xl text-white uppercase mb-2">
            Weekly Map Wipe
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
            Every <strong>Thursday @ 5:00 PM UTC</strong>. Full map reset with new procedural seed, fresh monuments, and balanced loot spawns.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-yellow-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-display font-black text-xl text-white uppercase mb-2">
            No Blueprints (No BPs)
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
            All tier 1, tier 2, and tier 3 blueprints are unlocked automatically! Jump straight into PvP, raiding, and high-tier warfare from minute one.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-display font-black text-xl text-white uppercase mb-2">
            VIP Queue Priority
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
            Skip the 200+ player wipe queue on reset days! VIP supporters bypass standard queues with instant slot reservation.
          </p>
        </div>
      </div>

      {/* Discord Notification Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-red-600/20 via-[#5865F2]/20 to-transparent border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display font-black text-2xl text-white uppercase flex items-center gap-2">
            <Bell className="w-6 h-6 text-yellow-400" /> Never Miss a Wipe
          </h3>
          <p className="text-zinc-300 text-xs sm:text-sm font-sans mt-1 max-w-xl">
            Join our Discord server and grab the <strong>@Wipe</strong> role to receive live countdown reminders 30 minutes before every reset.
          </p>
        </div>
        <a
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="atlas-btn-red px-6 py-3.5 text-white font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 whitespace-nowrap"
        >
          <span>JOIN DISCORD FOR ALERTS</span>
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
