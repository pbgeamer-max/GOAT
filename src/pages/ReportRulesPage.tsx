import React from "react";
import { RulesSection } from "@/components/RulesSection";
import { ShieldAlert, AlertTriangle, FileText, Send, MessageSquare } from "lucide-react";
import { useServer } from "@/context/ServerContext";

export const ReportRulesPage: React.FC = () => {
  const { discordUrl } = useServer();

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-bold uppercase tracking-widest mb-4">
          <ShieldAlert className="w-3.5 h-3.5" /> FAIR PLAY & ANTI-CHEAT
        </div>
        <h1 className="font-display font-black text-4xl sm:text-6xl text-white uppercase tracking-tight">
          SERVER RULES <span className="text-red-500">&</span> REPORT CHEATER
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base font-sans max-w-2xl mt-2">
          We uphold a zero-tolerance policy against cheating, script usage, bug abuse, and toxic harassment. Review our guidelines or submit an instant report ticket to active staff.
        </p>
      </div>

      {/* Cheater Report Callout Card */}
      <div className="mb-12 p-8 rounded-2xl bg-gradient-to-r from-red-950/40 via-red-900/20 to-black/60 border border-red-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 mt-1">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-black text-2xl text-white uppercase">
              Suspect a Cheater or Scripter?
            </h3>
            <p className="text-zinc-300 text-xs sm:text-sm font-sans mt-1 max-w-xl leading-relaxed">
              Do not call them out in public game chat. Open an urgent <strong>#report-cheater</strong> ticket in Discord with their Steam ID or combatlog clip for instant moderator investigation.
            </p>
          </div>
        </div>
        <a
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="atlas-btn-red px-6 py-3.5 text-white font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 whitespace-nowrap"
        >
          <MessageSquare className="w-4 h-4" />
          <span>OPEN REPORT TICKET</span>
        </a>
      </div>

      {/* Rules Section Component */}
      <RulesSection />
    </div>
  );
};
