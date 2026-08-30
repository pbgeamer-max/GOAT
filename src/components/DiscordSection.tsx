"use client";

import React from "react";
import { useServer } from "@/context/ServerContext";
import { MessageSquare, Users, Bell, Headphones, Sparkles, ArrowUpRight } from "lucide-react";

export const DiscordSection: React.FC = () => {
  const { discordUrl } = useServer();

  const discordPerks = [
    {
      icon: Bell,
      title: "Wipe Announcements",
      description: "Get real-time pings 1 hour before every map wipe and blueprint reset.",
    },
    {
      icon: Headphones,
      title: "24/7 Active Support",
      description: "Submit player reports, ticket requests, and get rapid admin assistance.",
    },
    {
      icon: Sparkles,
      title: "Giveaways & Events",
      description: "Participate in regular community skin giveaways and VIP event scrims.",
    },
    {
      icon: Users,
      title: "Looking For Group",
      description: "Find active teammates and recruit skilled players for your clan.",
    },
  ];

  return (
    <section id="discord" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="relative bg-gradient-to-b from-[#111320] via-obsidian-900 to-obsidian-950 border border-[#5865F2]/40 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_50px_rgba(88,101,242,0.2)] overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute -top-24 -right-24 w-[450px] h-[450px] bg-[#5865F2]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[450px] h-[450px] bg-rust-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Discord Icon Badge */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#5865F2] shadow-[0_0_35px_rgba(88,101,242,0.6)] flex items-center justify-center text-white mb-6 transform hover:scale-105 transition-transform">
            <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 fill-current" />
          </div>

          <h2 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-white uppercase tracking-tight mb-4">
            JOIN THE <span className="text-[#8ea1e1] drop-shadow-[0_0_30px_rgba(88,101,242,0.6)]">GOAT COMMUNITY</span>
          </h2>
          
          <p className="font-sans text-base sm:text-lg text-zinc-300 max-w-2xl mb-10 leading-relaxed">
            Connect with thousands of dedicated Rust players, track wipes in real-time, submit tickets directly to admins, and never miss a server update.
          </p>

          {/* Join Discord CTA Button */}
          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group px-10 py-5 rounded-2xl font-display font-extrabold text-lg sm:text-xl uppercase tracking-wider bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-[0_0_40px_rgba(88,101,242,0.6)] hover:shadow-[0_0_60px_rgba(88,101,242,0.9)] border border-white/20 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center gap-3 mb-14"
          >
            <MessageSquare className="w-6 h-6 fill-current" />
            <span>JOIN OFFICIAL DISCORD</span>
            <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          {/* Perks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left">
            {discordPerks.map((perk, idx) => {
              const Icon = perk.icon;
              return (
                <div
                  key={idx}
                  className="bg-obsidian-950/80 border border-white/10 rounded-2xl p-5 hover:border-[#5865F2]/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/30 flex items-center justify-center text-[#8ea1e1] mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-display font-bold text-base text-white uppercase mb-1">
                    {perk.title}
                  </h4>
                  <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                    {perk.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
