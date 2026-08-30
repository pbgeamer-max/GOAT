import React, { useState, useEffect } from "react";
import {
  Trophy,
  Flame,
  Crosshair,
  Award,
  Clock,
  Zap,
  Bomb,
  RefreshCw,
  Search,
  Mic,
} from "lucide-react";

interface LeaderboardEntry {
  steam_id: string;
  steam_name: string;
  avatar?: string;
  discord_tag?: string;
  kills: number;
  deaths: number;
  kd_ratio: number;
  playtime_seconds: number;
  headshots: number;
  explosives_used: number;
  wood_gathered: number;
  stone_gathered: number;
  metal_gathered: number;
  sulfur_gathered: number;
  voice_time_seconds?: number;
}

const CATEGORIES = [
  { id: "kills", label: "PvP Kills", icon: Crosshair },
  { id: "kd_ratio", label: "K/D Ratio", icon: Award },
  { id: "voice_time_seconds", label: "Voice Hours 🎙️", icon: Mic },
  { id: "playtime_seconds", label: "Playtime", icon: Clock },
  { id: "sulfur_gathered", label: "Sulfur Farmed", icon: Flame },
  { id: "explosives_used", label: "Explosives / Raids", icon: Bomb },
];

export const LeaderboardSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("kills");
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLeaderboard = async (cat = activeCategory) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?category=${cat}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setPlayers(data.data);
        }
      }
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(activeCategory);
  }, [activeCategory]);

  const filteredPlayers = players.filter((p) =>
    p.steam_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.discord_tag && p.discord_tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatValue = (p: LeaderboardEntry, cat: string) => {
    switch (cat) {
      case "kills":
        return `${(p.kills || 0).toLocaleString()} Kills`;
      case "kd_ratio":
        return `${p.kd_ratio || 0} K/D`;
      case "voice_time_seconds": {
        const total = p.voice_time_seconds || 0;
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        return `${h}h ${m}m Voice`;
      }
      case "playtime_seconds":
        return `${Math.round((p.playtime_seconds || 0) / 3600)} Hours`;
      case "sulfur_gathered":
        return `${(p.sulfur_gathered || 0).toLocaleString()} Sulfur`;
      case "explosives_used":
        return `${(p.explosives_used || 0).toLocaleString()} Booms`;
      default:
        return (p.kills || 0).toString();
    }
  };

  return (
    <section id="leaderboard" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-red-600/5 blur-[130px] -z-10 rounded-full pointer-events-none" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Trophy className="w-3.5 h-3.5" />
          GOAT 5X PLAYER RANKINGS
        </div>
        <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white uppercase tracking-tight">
          TOP 10 <span className="text-[#e62020]">LEADERBOARD</span>
        </h2>
        <p className="text-zinc-400 text-sm sm:text-base mt-3">
          Compete in PvP combat, farm sulfur, and spend time in Discord voice rooms to climb the rankings!
        </p>
      </div>

      {/* Controls: Category Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 rounded-lg font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#e62020] text-white shadow-[0_0_15px_rgba(230,32,32,0.4)]"
                    : "bg-[#0b0e15] text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0b0e15] border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>
          <button
            onClick={() => fetchLeaderboard(activeCategory)}
            disabled={loading}
            className="p-2.5 rounded-lg bg-[#0b0e15] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="bg-[#0b0e15] border border-white/10 rounded-2xl overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
        {loading ? (
          <div className="py-16 text-center text-zinc-500 font-mono text-xs">
            Loading leaderboard data...
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 font-mono text-xs">
            No players found matching this category yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#07090e] font-display text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-4 px-6 w-16 text-center">Rank</th>
                  <th className="py-4 px-6">Survivor</th>
                  <th className="py-4 px-6 text-center">Kills</th>
                  <th className="py-4 px-6 text-center">Deaths</th>
                  <th className="py-4 px-6 text-center">K/D Ratio</th>
                  <th className="py-4 px-6 text-center">Voice Time</th>
                  <th className="py-4 px-6 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm font-display">
                {filteredPlayers.map((player, idx) => {
                  const isTop1 = idx === 0;
                  const isTop2 = idx === 1;
                  const isTop3 = idx === 2;

                  const voiceSecs = player.voice_time_seconds || 0;
                  const vh = Math.floor(voiceSecs / 3600);
                  const vm = Math.floor((voiceSecs % 3600) / 60);

                  return (
                    <tr
                      key={player.steam_id || idx}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Rank */}
                      <td className="py-4 px-6 text-center font-mono font-bold">
                        {isTop1 ? (
                          <span className="text-yellow-400 text-lg">👑 #1</span>
                        ) : isTop2 ? (
                          <span className="text-slate-300 font-extrabold">🥈 #2</span>
                        ) : isTop3 ? (
                          <span className="text-amber-500 font-extrabold">🥉 #3</span>
                        ) : (
                          <span className="text-zinc-500">#{idx + 1}</span>
                        )}
                      </td>

                      {/* Player Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              player.avatar ||
                              "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg"
                            }
                            alt={player.steam_name}
                            className="w-9 h-9 rounded-lg border border-white/10"
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{player.steam_name || "Survivor"}</span>
                              {player.discord_tag && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30">
                                  {player.discord_tag}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-500">
                              {player.steam_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kills */}
                      <td className="py-4 px-6 text-center font-mono text-white font-bold">
                        {(player.kills || 0).toLocaleString()}
                      </td>

                      {/* Deaths */}
                      <td className="py-4 px-6 text-center font-mono text-zinc-400">
                        {(player.deaths || 0).toLocaleString()}
                      </td>

                      {/* K/D */}
                      <td className="py-4 px-6 text-center font-mono font-bold text-yellow-400">
                        {player.kd_ratio || 0}
                      </td>

                      {/* Voice Time */}
                      <td className="py-4 px-6 text-center font-mono text-indigo-400 font-semibold">
                        {vh}h {vm}m
                      </td>

                      {/* Highlighted Value */}
                      <td className="py-4 px-6 text-right font-mono font-black text-red-400">
                        {formatValue(player, activeCategory)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
