"use client";

import React, { useState, useEffect } from "react";
import { useServer } from "@/context/ServerContext";
import { SERVER_CONFIG } from "@/config/serverConfig";
import { Calendar, Clock, RefreshCw } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const WipeSection: React.FC = () => {
  const { nextWipeDate, wipeCycle, discordUrl } = useServer();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft => {
      const target = new Date(nextWipeDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0 || isNaN(difference)) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [nextWipeDate]);

  const timeUnits = [
    { label: "DAYS", value: timeLeft.days },
    { label: "HOURS", value: timeLeft.hours },
    { label: "MINUTES", value: timeLeft.minutes },
    { label: "SECONDS", value: timeLeft.seconds },
  ];

  return (
    <section id="wipe" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Background ambient blast */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-80 bg-rust-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rust-500/10 border border-rust-500/30 text-rust-400 font-mono text-xs uppercase tracking-widest font-semibold mb-3">
          <Calendar className="w-3.5 h-3.5" />
          SERVER RESET CALENDAR
        </div>
        <h2 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-white uppercase tracking-tight mb-4">
          NEXT <span className="bg-gradient-to-r from-rust-400 to-rust-600 text-transparent bg-clip-text">WIPE COUNTDOWN</span>
        </h2>
        <p className="font-sans text-base sm:text-lg text-zinc-400 leading-relaxed">
          {wipeCycle}
        </p>
      </div>

      {/* Large Cinematic Countdown Timer */}
      <div className="relative bg-obsidian-900/90 border border-rust-500/30 rounded-3xl p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(249,115,22,0.2)] backdrop-blur-xl mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
          {timeUnits.map((unit) => (
            <div
              key={unit.label}
              className="bg-obsidian-950/90 border border-white/10 hover:border-rust-500/50 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center transition-all duration-300 group"
            >
              <span className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white tracking-tighter group-hover:text-rust-400 transition-colors drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                {String(unit.value).padStart(2, "0")}
              </span>
              <span className="font-mono text-xs sm:text-sm text-zinc-400 uppercase tracking-widest font-bold mt-2">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        {/* Status Callout Banner */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rust-500/20 text-rust-400 border border-rust-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-white uppercase block text-sm sm:text-base">
                Scheduled Server Wipe Cycle
              </span>
              <span className="font-sans text-xs text-zinc-400">
                Wipe notifications are announced 1 hour prior on our Discord server.
              </span>
            </div>
          </div>

          <a
            href={discordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl font-display font-bold text-xs uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-white/10 transition-colors shrink-0"
          >
            GET WIPE ALERTS
          </a>
        </div>
      </div>

      {/* Wipe Schedule Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SERVER_CONFIG.wipeSchedule.scheduleList.map((item, idx) => (
          <div
            key={idx}
            className="bg-obsidian-900/60 border border-white/10 rounded-2xl p-6 flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-obsidian-950 border border-white/10 flex items-center justify-center text-rust-400 shrink-0 mt-1">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-rust-400 font-bold uppercase px-2 py-0.5 rounded bg-rust-500/10 border border-rust-500/20">
                  {item.frequency}
                </span>
                <span className="font-display font-bold text-lg text-white uppercase">
                  {item.type}
                </span>
              </div>
              <span className="font-mono text-xs text-zinc-300 font-semibold block mb-2">
                {item.time}
              </span>
              <p className="font-sans text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
