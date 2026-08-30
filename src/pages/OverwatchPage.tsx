import React from "react";
import { Shield, Award, CheckCircle, Video, MessageSquare, ChevronRight } from "lucide-react";
import { useServer } from "@/context/ServerContext";

export const OverwatchPage: React.FC = () => {
  const { discordUrl } = useServer();

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold uppercase tracking-widest mb-4">
          <Shield className="w-3.5 h-3.5" /> COMMUNITY PROTECTION
        </div>
        <h1 className="font-display font-black text-4xl sm:text-6xl text-white uppercase tracking-tight">
          OVERWATCH <span className="text-emerald-400">PROGRAM</span>
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base font-sans max-w-2xl mt-2">
          Help us keep GOAT 5X clean of cheaters, scripters, and team-limit abusers. Report confirmed rule-breakers and earn free VIP rewards!
        </p>
      </div>

      {/* Hero Card */}
      <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-black border border-emerald-500/30 mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase mb-3">
            Earn VIP Ranks by Reporting Cheaters
          </h2>
          <p className="text-zinc-300 text-xs sm:text-sm font-sans max-w-xl leading-relaxed">
            Players who submit valid video clips leading to a confirmed permanent ban receive <strong>1 Week of Free VIP</strong> as an appreciation from server administration.
          </p>
        </div>
        <a
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-display font-black text-sm uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>SUBMIT REPORT IN DISCORD</span>
        </a>
      </div>

      {/* 3 Step Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 font-display font-black text-xl">
            1
          </div>
          <h3 className="font-display font-bold text-lg text-white uppercase mb-2">Record Evidence</h3>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
            Capture clear gameplay footage using ShadowPlay, Medal, or OBS showing suspicious behavior (recoil scripts, ESP, speedhacks, or combatlog).
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 font-display font-black text-xl">
            2
          </div>
          <h3 className="font-display font-bold text-lg text-white uppercase mb-2">Open Overwatch Ticket</h3>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
            Head to our Discord and create an <strong>#overwatch-report</strong> ticket. Provide the player's Steam profile link and YouTube/Streamable video link.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 font-display font-black text-xl">
            3
          </div>
          <h3 className="font-display font-bold text-lg text-white uppercase mb-2">Claim Your Reward</h3>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
            Once anti-cheat staff review and ban the cheater, your Overwatch badge and free VIP package will be unlocked on your linked Steam account!
          </p>
        </div>
      </div>
    </div>
  );
};
