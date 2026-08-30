import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import {
  X,
  ShieldCheck,
  Zap,
  Gift,
  ExternalLink,
  Crosshair,
  Skull,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Mic,
  Rocket,
  LogOut,
  RefreshCw,
} from "lucide-react";

export const UserProfileModal: React.FC = () => {
  const { user, isProfileOpen, closeProfile, linkDiscord, claimKit, logout } = useAuth();
  const { showToast } = useToast();
  const [claiming, setClaiming] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isProfileOpen || !user) return null;

  const stats = user.stats || {};
  const playtimeHours = Math.round((stats.playtime_seconds || 0) / 3600);
  const voiceSeconds = user.voice_time_seconds || 0;
  const voiceHours = Math.floor(voiceSeconds / 3600);
  const voiceMinutes = Math.floor((voiceSeconds % 3600) / 60);

  const handleClaimKit = async () => {
    setClaiming(true);
    const res = await claimKit();
    setClaiming(false);

    if (res.success) {
      showToast("In-game kits (/kit discord & /kit booster) synced via RCON!", "success");
    } else {
      showToast(res.error || "RCON command sent to Rust server.", "info");
    }
  };

  const copyInGameCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    showToast(`Copied '${cmd}'! Paste into Rust server chat.`, "success");
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#0b0e15] border border-white/15 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.9)] p-6 md:p-8 text-foreground">
        {/* Top Glowing Red Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-yellow-500 rounded-t-2xl" />

        {/* Header with Close */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight uppercase font-display text-white">
                Player Profile & Perks
              </h2>
              <p className="text-xs text-zinc-400">
                Manage linked Steam, Discord, Voice Call hours, and in-game kits.
              </p>
            </div>
          </div>
          <button
            onClick={closeProfile}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Dual Account Linking Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Steam Account Card */}
          <div className="relative p-5 rounded-xl bg-[#06080d] border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Steam Account
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> CONNECTED
              </span>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={user.avatar || "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg"}
                alt={user.steam_name}
                className="w-14 h-14 rounded-xl border-2 border-red-500/60 shadow-[0_0_15px_rgba(230,32,32,0.2)]"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white truncate">{user.steam_name}</h3>
                <p className="text-xs text-zinc-400 font-mono truncate">ID: {user.steam_id}</p>
                <a
                  href={user.profile_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:underline mt-1"
                >
                  Steam Community <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Discord Account Card */}
          <div className="relative p-5 rounded-xl bg-[#06080d] border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${user.is_linked ? "bg-emerald-400" : "bg-indigo-500"} animate-pulse`} />
                Discord Account
              </span>
              {user.is_linked ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> NOT LINKED
                </span>
              )}
            </div>

            {user.is_linked ? (
              <div className="flex items-center gap-4">
                <img
                  src={user.discord_avatar || "https://cdn.discordapp.com/embed/avatars/0.png"}
                  alt={user.discord_tag || "Discord User"}
                  className="w-14 h-14 rounded-xl border-2 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{user.discord_tag || "Linked Member"}</h3>
                  <p className="text-xs text-zinc-400 font-mono truncate">Role: @Verified Assigned</p>
                  <p className="text-[11px] text-emerald-400 font-medium mt-1">✓ In-game /kit discord unlocked</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-zinc-400 mb-3">
                  Link Discord to receive the <strong>@Verified</strong> role & unlock <strong>/kit discord</strong>!
                </p>
                <button
                  onClick={linkDiscord}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(88,101,242,0.3)]"
                >
                  LINK DISCORD ACCOUNT
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Highlights: Booster Status & Voice Call Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Discord Server Booster Card */}
          <div className="p-4 rounded-xl bg-[#06080d] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold uppercase text-zinc-400">DISCORD BOOSTER</div>
                <div className="text-sm font-display font-bold text-white">
                  {user.is_booster ? "🚀 Active Booster (/kit booster)" : "Regular Member"}
                </div>
              </div>
            </div>
            {user.is_booster ? (
              <span className="px-2 py-1 rounded bg-fuchsia-500/20 text-fuchsia-300 text-[10px] font-bold">
                ACTIVE
              </span>
            ) : (
              <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                BOOST DISCORD
              </span>
            )}
          </div>

          {/* Voice Calls Tracker Card */}
          <div className="p-4 rounded-xl bg-[#06080d] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold uppercase text-zinc-400">DISCORD VOICE TIME</div>
                <div className="text-sm font-display font-bold text-indigo-400">
                  {voiceHours} Hours, {voiceMinutes} Minutes
                </div>
              </div>
            </div>
            <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
              LIVE TRACKED
            </span>
          </div>
        </div>

        {/* In-Game Rust PvP Stats */}
        <div className="mt-6">
          <h4 className="font-mono text-xs uppercase tracking-wider text-zinc-400 font-bold mb-3">
            YOUR IN-GAME RUST 5X STATS
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#06080d] p-3.5 rounded-xl border border-white/5 text-center">
              <div className="text-xs text-zinc-400 font-mono mb-1 flex items-center justify-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-red-500" /> Kills
              </div>
              <div className="text-xl font-display font-black text-white">{stats.kills || 0}</div>
            </div>
            <div className="bg-[#06080d] p-3.5 rounded-xl border border-white/5 text-center">
              <div className="text-xs text-zinc-400 font-mono mb-1 flex items-center justify-center gap-1">
                <Skull className="w-3.5 h-3.5 text-zinc-500" /> Deaths
              </div>
              <div className="text-xl font-display font-black text-white">{stats.deaths || 0}</div>
            </div>
            <div className="bg-[#06080d] p-3.5 rounded-xl border border-white/5 text-center">
              <div className="text-xs text-zinc-400 font-mono mb-1 flex items-center justify-center gap-1">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> K/D Ratio
              </div>
              <div className="text-xl font-display font-black text-yellow-400">{stats.kd_ratio || 0}</div>
            </div>
            <div className="bg-[#06080d] p-3.5 rounded-xl border border-white/5 text-center">
              <div className="text-xs text-zinc-400 font-mono mb-1 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Playtime
              </div>
              <div className="text-xl font-display font-black text-emerald-400">{playtimeHours}h</div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={logout}
            className="px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white font-display font-bold text-xs uppercase flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>

          <div className="flex items-center gap-3">
            {user.is_linked && (
              <button
                onClick={handleClaimKit}
                disabled={claiming}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs uppercase flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${claiming ? "animate-spin" : ""}`} />
                {claiming ? "Syncing..." : "Sync Kits (RCON)"}
              </button>
            )}

            <button
              onClick={closeProfile}
              className="atlas-btn-red px-6 py-2.5 text-white font-display font-bold text-xs uppercase"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
