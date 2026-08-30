import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useServer } from "@/context/ServerContext";
import {
  Mic,
  Trophy,
  Clock,
  Shield,
  Sparkles,
  Users,
  Award,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface VoiceMember {
  steam_id: string;
  steam_name: string;
  avatar: string;
  discord_id: string;
  discord_tag: string;
  discord_avatar: string;
  voice_time_seconds: number;
  is_booster: boolean;
}

export const VoiceRewardsSection: React.FC = () => {
  const { user, loginWithSteam } = useAuth();
  const { discordUrl } = useServer();
  const [voiceLeaderboard, setVoiceLeaderboard] = useState<VoiceMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/voice-leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setVoiceLeaderboard(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const userVoiceSecs = user?.voice_time_seconds || 0;
  const userHours = Math.floor(userVoiceSecs / 3600);
  const userMinutes = Math.floor((userVoiceSecs % 3600) / 60);

  const tiers = [
    {
      hours: 5,
      name: "BRONZE SPEAKER",
      badge: "🥉",
      role: "@Active Voice",
      perk: "Starter Resource Pack + 100 GEMS",
      color: "border-amber-700/50 bg-amber-950/20 text-amber-300",
      achieved: userHours >= 5,
    },
    {
      hours: 15,
      name: "SILVER CLANSMAN",
      badge: "🥈",
      role: "@Clan Raider",
      perk: "Tier 2 Component Crate + /kit voice",
      color: "border-slate-400/50 bg-slate-900/40 text-slate-200",
      achieved: userHours >= 15,
    },
    {
      hours: 30,
      name: "GOLD LEGEND",
      badge: "🥇",
      role: "@Voice Elite",
      perk: "AK-47 Weapon Pack + Exclusive Discord Tag",
      color: "border-yellow-500/50 bg-yellow-950/20 text-yellow-300",
      achieved: userHours >= 30,
    },
    {
      hours: 50,
      name: "GOAT WARLORD",
      badge: "👑",
      role: "@Clan Leader / VIP",
      perk: "Max 5X Perks + Permanent Queue Skip Priority",
      color: "border-red-500/50 bg-red-950/30 text-red-400",
      achieved: userHours >= 50,
    },
  ];

  return (
    <section id="voice" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-[#05070b] border-t border-white/10">
      {/* Background atmosphere */}
      <div className="absolute inset-0 bg-tactical-grid opacity-15 pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-mono text-xs uppercase tracking-widest mb-4">
            <Mic className="w-3.5 h-3.5" /> VOICE CALLS & CLAN REWARDS
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white uppercase tracking-tight mb-4">
            DISCORD VOICE <span className="text-indigo-400">TRACKING</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Spend time in our Discord voice channels (including locked clan rooms) to automatically earn hours, unlock exclusive clan roles, and claim free in-game Rust kits!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Left: User Voice Stats & Progress */}
          <div className="lg:col-span-7 space-y-6">
            {/* User Active Card */}
            <div className="bg-[#0b0e15] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={
                        user?.avatar ||
                        "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg"
                      }
                      alt={user?.steam_name || "Survivor"}
                      className="w-14 h-14 rounded-2xl border-2 border-indigo-500/50"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 border-2 border-[#0b0e15] flex items-center justify-center text-[8px] text-white">
                      🎙️
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-black text-xl text-white uppercase">
                      {user ? user.steam_name : "Your Voice Activity"}
                    </h3>
                    <p className="font-mono text-xs text-zinc-400">
                      {user?.is_linked ? `Discord: ${user.discord_tag || "Linked"}` : "Connect Steam + Discord to track"}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                    RECORDED VOICE TIME
                  </div>
                  <div className="font-display font-black text-2xl sm:text-3xl text-indigo-400">
                    {userHours}h {userMinutes}m
                  </div>
                </div>
              </div>

              {/* Progress Bar towards next tier */}
              <div className="pt-6">
                <div className="flex justify-between text-xs font-mono text-zinc-400 mb-2">
                  <span>Current Milestone Progress</span>
                  <span>{Math.min(100, Math.round((userHours / 50) * 100))}% towards Warlord</span>
                </div>
                <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-red-500 transition-all duration-500"
                    style={{ width: `${Math.max(4, Math.min(100, (userHours / 50) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Reward Tiers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tiers.map((t, idx) => (
                <div
                  key={idx}
                  className={`border rounded-xl p-5 relative overflow-hidden transition-all ${
                    t.achieved
                      ? `${t.color} shadow-[0_0_20px_rgba(99,102,241,0.2)]`
                      : "border-white/10 bg-[#0b0e15]/80 text-zinc-400"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-display font-extrabold text-sm uppercase text-white flex items-center gap-1.5">
                      <span>{t.badge}</span> {t.name}
                    </span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                      {t.hours}h+
                    </span>
                  </div>
                  <div className="text-xs text-zinc-300 font-semibold mb-1">
                    Role: <span className="text-indigo-400">{t.role}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {t.perk}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Top Voice Champions Leaderboard */}
          <div className="lg:col-span-5 bg-[#0b0e15] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">
                  TOP VOICE CHAMPIONS
                </h3>
              </div>
              <span className="font-mono text-[10px] uppercase text-zinc-500">
                LIVE SYNC
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                Loading voice rankings...
              </div>
            ) : voiceLeaderboard.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                No voice sessions recorded yet. Join our Discord voice rooms to be first!
              </div>
            ) : (
              <div className="space-y-2.5">
                {voiceLeaderboard.slice(0, 8).map((m, idx) => {
                  const h = Math.floor(m.voice_time_seconds / 3600);
                  const min = Math.floor((m.voice_time_seconds % 3600) / 60);
                  const isTop3 = idx < 3;

                  return (
                    <div
                      key={m.discord_id || idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-indigo-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-xs font-bold w-5 text-center ${idx === 0 ? "text-yellow-400 text-sm font-extrabold" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-500" : "text-zinc-500"}`}>
                          {idx === 0 ? "👑" : `#${idx + 1}`}
                        </span>
                        <img
                          src={m.avatar || m.discord_avatar || "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg"}
                          alt={m.steam_name}
                          className="w-8 h-8 rounded-lg border border-white/10"
                        />
                        <div className="text-left">
                          <div className="font-display font-bold text-xs text-white truncate max-w-[130px] sm:max-w-[170px]">
                            {m.steam_name || m.discord_tag || "Survivor"}
                          </div>
                          {m.is_booster && (
                            <span className="text-[9px] font-mono text-fuchsia-400 font-bold uppercase">
                              Booster 🚀
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="font-mono text-xs font-bold text-indigo-400">
                        {h}h {min}m
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Discord CTA */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <a
                href={discordUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(88,101,242,0.3)]"
              >
                <Users className="w-4 h-4" /> JOIN DISCORD VOICE ROOMS
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
