"use client";

import React, { useState } from "react";
import { SERVER_CONFIG } from "@/config/serverConfig";
import { Shield, ChevronDown, CheckCircle2, AlertTriangle, Scale } from "lucide-react";

export const RulesSection: React.FC = () => {
  const [openRuleId, setOpenRuleId] = useState<string | null>(SERVER_CONFIG.rules[0]?.id ?? null);

  const toggleRule = (id: string) => {
    setOpenRuleId(openRuleId === id ? null : id);
  };

  return (
    <section id="rules" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rust-500/10 border border-rust-500/30 text-rust-400 font-mono text-xs uppercase tracking-widest font-semibold mb-3">
          <Scale className="w-3.5 h-3.5" />
          SERVER GUIDELINES
        </div>
        <h2 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-white uppercase tracking-tight mb-4">
          SERVER <span className="bg-gradient-to-r from-rust-400 to-rust-600 text-transparent bg-clip-text">RULES & CONDUCT</span>
        </h2>
        <p className="font-sans text-base sm:text-lg text-zinc-400 leading-relaxed">
          Violations of server rules are strictly enforced by our active admin team and automated security systems.
        </p>
      </div>

      {/* Rules List / Accordion */}
      <div className="max-w-4xl mx-auto space-y-4">
        {SERVER_CONFIG.rules.map((rule) => {
          const isOpen = openRuleId === rule.id;
          return (
            <div
              key={rule.id}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? "bg-obsidian-900/90 border-rust-500/50 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(249,115,22,0.15)]"
                  : "bg-obsidian-950/70 border-white/10 hover:border-white/20"
              }`}
            >
              <button
                onClick={() => toggleRule(rule.id)}
                className="w-full p-6 sm:p-7 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none"
              >
                <div className="flex items-center gap-4 sm:gap-6">
                  {/* Number Badge */}
                  <span className="w-12 h-12 rounded-xl bg-obsidian-950 border border-rust-500/30 flex items-center justify-center font-display font-extrabold text-xl text-rust-400 shrink-0">
                    {rule.number}
                  </span>
                  <div>
                    <h3 className="font-display font-bold text-lg sm:text-xl text-white uppercase tracking-wide">
                      {rule.title}
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-zinc-400 mt-1">
                      {rule.summary}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-8 h-8 rounded-lg bg-obsidian-900 border border-white/10 flex items-center justify-center text-zinc-400 transition-transform duration-300 shrink-0 ${
                    isOpen ? "rotate-180 text-rust-400 border-rust-500/30" : ""
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="bg-obsidian-950/90 rounded-xl p-4 sm:p-5 border border-white/5 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="font-sans text-sm text-zinc-300 leading-relaxed">
                      {rule.details}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
