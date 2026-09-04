import React, { useState, useEffect, useMemo } from "react";
import {
  Bomb,
  RefreshCw,
  Search,
  Swords,
  Pickaxe,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

export interface LeaderboardEntry {
  steam_id: string;
  steam_name: string;
  avatar?: string;
  discord_tag?: string;
  kills: number;
  deaths: number;
  kd_ratio: number;
  playtime_seconds: number;
  headshots?: number;
  wood_gathered?: number;
  stone_gathered?: number;
  metal_gathered?: number;
  sulfur_gathered?: number;
  total_farmed?: number;
  explosives_used?: number;
  rockets_fired?: number;
  c4_used?: number;
  satchels_used?: number;
  voice_time_seconds?: number;
}

type TabMode = "pvp" | "boom" | "farm";

interface ModeConfig {
  id: TabMode;
  title: string;
  subtitle: string;
  defaultSort: string;
  icon: React.FC<{ className?: string }>;
}

const MODES: ModeConfig[] = [
  {
    id: "pvp",
    title: "PvP Combat",
    subtitle: "Kills, Deaths & K/D Ratio",
    defaultSort: "kills",
    icon: Swords,
  },
  {
    id: "boom",
    title: "Raids & Boom",
    subtitle: "Rockets, C4 & Satchels",
    defaultSort: "explosives_used",
    icon: Bomb,
  },
  {
    id: "farm",
    title: "Farming & Nodes",
    subtitle: "Sulfur, Metal, Stone & Wood",
    defaultSort: "total_farmed",
    icon: Pickaxe,
  },
];

export const LeaderboardSection: React.FC = () => {
  const [activeMode, setActiveMode] = useState<TabMode>("pvp");
  const [sortBy, setSortBy] = useState<string>("kills");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Countdown timer to wipe / season reset
  const [timeLeft, setTimeLeft] = useState({ days: 26, hours: 19, mins: 33, secs: 27 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchLeaderboard = async (category = sortBy) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?category=${category}&limit=50`);
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
    fetchLeaderboard(sortBy);
  }, [sortBy]);

  // Handle Tab Switch
  const handleModeChange = (mode: TabMode) => {
    setActiveMode(mode);
    const m = MODES.find((item) => item.id === mode);
    if (m) {
      setSortBy(m.defaultSort);
      setSortOrder("desc");
    }
  };

  // Header column click sort
  const handleColumnSort = (colKey: string) => {
    if (sortBy === colKey) {
      setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(colKey);
      setSortOrder("desc");
    }
  };

  // Filter and Sort players
  const filteredAndSortedPlayers = useMemo(() => {
    let result = players.filter(
      (p) =>
        p.steam_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.steam_id?.includes(searchQuery) ||
        (p.discord_tag && p.discord_tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    result.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (sortBy) {
        case "kills":
          valA = a.kills || 0;
          valB = b.kills || 0;
          break;
        case "deaths":
          valA = a.deaths || 0;
          valB = b.deaths || 0;
          break;
        case "kd_ratio":
          valA = a.kd_ratio || 0;
          valB = b.kd_ratio || 0;
          break;
        case "playtime_seconds":
          valA = a.playtime_seconds || 0;
          valB = b.playtime_seconds || 0;
          break;

        case "total_farmed":
          valA =
            (a.total_farmed || 0) ||
            (a.wood_gathered || 0) +
              (a.stone_gathered || 0) +
              (a.metal_gathered || 0) +
              (a.sulfur_gathered || 0);
          valB =
            (b.total_farmed || 0) ||
            (b.wood_gathered || 0) +
              (b.stone_gathered || 0) +
              (b.metal_gathered || 0) +
              (b.sulfur_gathered || 0);
          break;
        case "sulfur_gathered":
          valA = a.sulfur_gathered || 0;
          valB = b.sulfur_gathered || 0;
          break;
        case "explosives_used":
          valA =
            (a.explosives_used || 0) ||
            (a.rockets_fired || 0) + (a.c4_used || 0) + (a.satchels_used || 0);
          valB =
            (b.explosives_used || 0) ||
            (b.rockets_fired || 0) + (b.c4_used || 0) + (b.satchels_used || 0);
          break;
        case "rockets_fired":
          valA = a.rockets_fired || 0;
          valB = b.rockets_fired || 0;
          break;
        case "c4_used":
          valA = a.c4_used || 0;
          valB = b.c4_used || 0;
          break;
        case "satchels_used":
          valA = a.satchels_used || 0;
          valB = b.satchels_used || 0;
          break;
        default:
          valA = a.kills || 0;
          valB = b.kills || 0;
      }

      return sortOrder === "desc" ? valB - valA : valA - valB;
    });

    return result;
  }, [players, searchQuery, sortBy, sortOrder]);

  // Helpers
  const formatTime = (seconds: number) => {
    if (!seconds) return "0h 0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatNumber = (num?: number) => {
    if (!num) return "0";
    return num.toLocaleString();
  };

  const formatCompact = (num?: number) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <section id="leaderboard" className="relative w-full max-w-[1400px] mx-auto z-10">
      {/* ── 1. Top Section Header (Atlas style: Left Title | Right Sort & Count) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Left Title */}
        <div className="flex items-center gap-3">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
            LEADERBOARD
          </h1>
          <span className="hidden sm:inline-block h-6 w-[2px] bg-red-600/40" />
          <span className="hidden sm:inline-block text-zinc-400 font-mono text-xs uppercase tracking-widest">
            TOP GOAT 5X PLAYERS
          </span>
        </div>

        {/* Right Controls: SORT Dropdown & Ranked Count */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-500 uppercase tracking-wider font-bold">SORT</span>
            <div className="relative inline-block">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setSortOrder("desc");
                }}
                className="appearance-none bg-[#090d16] border border-white/15 text-white rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold font-mono focus:outline-none focus:border-red-500 hover:border-white/30 cursor-pointer shadow-inner transition-colors"
              >
                <option value="kills">Kills</option>
                <option value="deaths">Deaths</option>
                <option value="kd_ratio">K/D Ratio</option>
                <option value="playtime_seconds">Playtime</option>
                <option value="total_farmed">Total Farmed</option>
                <option value="sulfur_gathered">Sulfur Nodes</option>
                <option value="metal_gathered">Metal Nodes</option>
                <option value="stone_gathered">Stone Nodes</option>
                <option value="wood_gathered">Wood Gathered</option>
                <option value="explosives_used">Total Boom</option>
                <option value="rockets_fired">Rockets Fired</option>
                <option value="c4_used">C4 Explosives</option>
                <option value="satchels_used">Satchel Charges</option>
                <option value="voice_time_seconds">Voice Time</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="text-xs font-mono font-bold text-zinc-400 tracking-wider">
            <span className="text-white font-black text-sm">
              {filteredAndSortedPlayers.length || players.length || 250}
            </span>{" "}
            RANKED
          </div>
        </div>
      </div>

      {/* ── 2. Four Mode Category Cards (Atlas layout) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={`text-left p-4 rounded-xl transition-all duration-200 border cursor-pointer group relative overflow-hidden ${
                isActive
                  ? "bg-gradient-to-b from-[#e62020]/20 via-[#18090b]/80 to-[#0a0d14] border-[#e62020] shadow-[0_0_25px_rgba(230,32,32,0.3)] ring-1 ring-[#e62020]/50"
                  : "bg-[#090d16]/80 hover:bg-[#101524] border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`font-display font-black text-base uppercase tracking-tight transition-colors ${
                    isActive ? "text-white" : "text-zinc-300 group-hover:text-white"
                  }`}
                >
                  {mode.title}
                </span>
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-red-500" : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                />
              </div>
              <p
                className={`text-xs transition-colors line-clamp-1 ${
                  isActive ? "text-red-400/90 font-medium" : "text-zinc-500 group-hover:text-zinc-400"
                }`}
              >
                {mode.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── 3. Season / Countdown Timer Bar (Atlas style) ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#080b12] border border-white/10 rounded-xl mb-4 text-xs font-mono">
        {/* Left: Season & Live Badges */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-white font-black tracking-wide">Season 1</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
            LIVE
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 uppercase tracking-widest">
            PRIZES
          </span>
        </div>

        {/* Right: Countdown */}
        <div className="text-zinc-400 flex items-center gap-1.5 tracking-wider font-semibold">
          <span>RESETS IN</span>
          <span className="text-white font-black">
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.mins}m {timeLeft.secs}s
          </span>
        </div>
      </div>

      {/* ── 4. Search & Refresh Bar ── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="search-player-input"
            type="text"
            placeholder="Search by name or Steam ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#080b12] border border-white/10 hover:border-white/20 focus:border-red-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
          />
        </div>
        <button
          id="btn-refresh-leaderboard"
          onClick={() => fetchLeaderboard(sortBy)}
          disabled={loading}
          className="p-2.5 rounded-xl bg-[#080b12] border border-white/10 hover:border-white/25 text-zinc-400 hover:text-white transition-all disabled:opacity-50 hover:bg-white/5 cursor-pointer shrink-0"
          title="Refresh stats"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-red-400" : ""}`} />
        </button>
      </div>

      {/* ── 5. Main Leaderboard Table Container ── */}
      <div className="bg-[#070a10] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
        {loading && players.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Syncing live player telemetry...
            </span>
          </div>
        ) : filteredAndSortedPlayers.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 font-mono text-xs">
            No players found matching "{searchQuery}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#05070d] font-display text-[11px] font-bold uppercase tracking-wider text-zinc-400 select-none">
                  {/* # Rank */}
                  <th className="py-3.5 px-4 w-14 text-center">#</th>

                  {/* Player */}
                  <th className="py-3.5 px-4">PLAYER</th>

                  {/* KILLS */}
                  <th
                    onClick={() => handleColumnSort("kills")}
                    className={`py-3.5 px-4 text-center cursor-pointer hover:text-white transition-colors ${
                      sortBy === "kills" ? "text-red-500 font-black" : ""
                    }`}
                  >
                    KILLS
                  </th>

                  {/* DEATHS */}
                  <th
                    onClick={() => handleColumnSort("deaths")}
                    className={`py-3.5 px-4 text-center cursor-pointer hover:text-white transition-colors ${
                      sortBy === "deaths" ? "text-red-500 font-black" : ""
                    }`}
                  >
                    DEATHS
                  </th>

                  {/* K/D */}
                  <th
                    onClick={() => handleColumnSort("kd_ratio")}
                    className={`py-3.5 px-4 text-center cursor-pointer hover:text-white transition-colors ${
                      sortBy === "kd_ratio" ? "text-red-500 font-black" : ""
                    }`}
                  >
                    K/D
                  </th>

                  {/* PLAYTIME */}
                  <th
                    onClick={() => handleColumnSort("playtime_seconds")}
                    className={`py-3.5 px-4 text-center cursor-pointer hover:text-white transition-colors ${
                      sortBy === "playtime_seconds" ? "text-red-500 font-black" : ""
                    }`}
                  >
                    PLAYTIME
                  </th>

                  {/* FARMING (NODES) */}
                  <th
                    onClick={() => handleColumnSort("total_farmed")}
                    className={`py-3.5 px-4 text-center cursor-pointer hover:text-white transition-colors ${
                      sortBy === "total_farmed" || sortBy === "sulfur_gathered"
                        ? "text-red-500 font-black"
                        : ""
                    }`}
                  >
                    FARM (NODES)
                  </th>

                  {/* BOOM (RAIDS) */}
                  <th
                    onClick={() => handleColumnSort("explosives_used")}
                    className={`py-3.5 px-4 text-center cursor-pointer hover:text-white transition-colors ${
                      sortBy === "explosives_used" || sortBy === "rockets_fired"
                        ? "text-red-500 font-black"
                        : ""
                    }`}
                  >
                    BOOM (RAIDS)
                  </th>


                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {filteredAndSortedPlayers.map((player, idx) => {
                  const rank = idx + 1;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;

                  // Farm calculations
                  const sulfur = player.sulfur_gathered || 0;
                  const metal = player.metal_gathered || 0;
                  const stone = player.stone_gathered || 0;
                  const wood = player.wood_gathered || 0;
                  const totalFarm = player.total_farmed || sulfur + metal + stone + wood;

                  // Boom calculations (Rockets, C4, Satchels)
                  const rockets = player.rockets_fired || 0;
                  const c4 = player.c4_used || 0;
                  const satchels = player.satchels_used || 0;
                  const totalBoom = (player.explosives_used || 0) || rockets + c4 + satchels;

                  return (
                    <tr
                      key={player.steam_id || idx}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* # Rank Number */}
                      <td className="py-3.5 px-4 text-center font-bold font-mono">
                        {isTop1 ? (
                          <span className="text-yellow-400 font-black text-sm drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                            1
                          </span>
                        ) : isTop2 ? (
                          <span className="text-zinc-200 font-bold text-sm drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                            2
                          </span>
                        ) : isTop3 ? (
                          <span className="text-amber-500 font-bold text-sm drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                            3
                          </span>
                        ) : (
                          <span className="text-zinc-500">{rank}</span>
                        )}
                      </td>

                      {/* Player Info (Avatar, Name, Steam ID) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              player.avatar ||
                              "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg"
                            }
                            alt={player.steam_name}
                            className={`w-9 h-9 rounded-lg border shrink-0 object-cover ${
                              isTop1
                                ? "border-yellow-400/80 ring-2 ring-yellow-400/30"
                                : isTop2
                                ? "border-zinc-300/80 ring-1 ring-white/20"
                                : isTop3
                                ? "border-amber-500/80"
                                : "border-white/10"
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://steamcommunity.com/profiles/${player.steam_id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="font-display font-bold text-sm text-white hover:text-red-400 transition-colors truncate flex items-center gap-1.5"
                              >
                                <span>{player.steam_name || "Survivor"}</span>
                                <ExternalLink className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </a>
                              {player.discord_tag && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30 truncate max-w-[110px]">
                                  {player.discord_tag}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-500 select-all">
                              {player.steam_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* KILLS */}
                      <td
                        className={`py-3.5 px-4 text-center font-bold ${
                          sortBy === "kills" ? "text-red-400 font-black text-sm" : "text-white"
                        }`}
                      >
                        {formatNumber(player.kills)}
                      </td>

                      {/* DEATHS */}
                      <td
                        className={`py-3.5 px-4 text-center ${
                          sortBy === "deaths" ? "text-red-400 font-bold" : "text-zinc-400"
                        }`}
                      >
                        {formatNumber(player.deaths)}
                      </td>

                      {/* K/D RATIO */}
                      <td
                        className={`py-3.5 px-4 text-center font-bold ${
                          sortBy === "kd_ratio"
                            ? "text-yellow-400 font-black text-sm"
                            : (player.kd_ratio || 0) >= 2
                            ? "text-emerald-400"
                            : (player.kd_ratio || 0) >= 1
                            ? "text-zinc-200"
                            : "text-zinc-400"
                        }`}
                      >
                        {(player.kd_ratio || 0).toFixed(2)}
                      </td>

                      {/* PLAYTIME */}
                      <td
                        className={`py-3.5 px-4 text-center ${
                          sortBy === "playtime_seconds" ? "text-red-400 font-bold" : "text-zinc-300"
                        }`}
                      >
                        {formatTime(player.playtime_seconds)}
                      </td>

                      {/* FARMING (NODES) with detailed breakdown */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-bold ${
                              sortBy === "total_farmed" || sortBy === "sulfur_gathered"
                                ? "text-yellow-400 font-black text-sm"
                                : "text-zinc-200"
                            }`}
                          >
                            {formatCompact(totalFarm)}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-0.5">
                             <span title="Sulfur nodes" className="text-yellow-500/80">
                               S:{formatCompact(sulfur)}
                             </span>
                             <span>·</span>
                             <span title="Metal nodes" className="text-zinc-400">
                               M:{formatCompact(metal)}
                             </span>
                             <span>·</span>
                             <span title="Stone nodes" className="text-zinc-500">
                               St:{formatCompact(stone)}
                             </span>
                           </div>
                        </div>
                      </td>

                      {/* BOOM (RAIDS: Satchels, C4, Rockets) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-bold ${
                              sortBy === "explosives_used" || sortBy === "rockets_fired"
                                ? "text-red-400 font-black text-sm"
                                : "text-zinc-200"
                            }`}
                          >
                            {formatNumber(totalBoom)}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono mt-0.5">
                             <span title="Rockets Fired" className="text-red-400/90">
                               R:{rockets}
                             </span>
                             <span>·</span>
                             <span title="C4 Used" className="text-amber-400/90">
                               C4:{c4}
                             </span>
                             <span>·</span>
                             <span title="Satchels Used" className="text-orange-400/90">
                               SA:{satchels}
                             </span>
                           </div>
                        </div>
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

export default LeaderboardSection;
