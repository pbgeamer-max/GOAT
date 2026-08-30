import React from "react";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldAlert,
  Flame,
  Zap,
  Gift,
  Award,
  Crosshair,
  TrendingUp,
  Skull,
  UserCheck,
} from "lucide-react";

export const StatsDashboard: React.FC = () => {
  const { user, loginWithSteam, openProfile, linkDiscord } = useAuth();

  return (
    <section id="stats" className="relative py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
      {/* Ecosystem Callout Hero Card */}
      <div className="relative rounded-3xl bg-gradient-to-r from-obsidian-900/90 via-obsidian-850/90 to-obsidian-900/90 border border-rust-500/30 p-8 md:p-12 shadow-[0_0_50px_rgba(249,115,22,0.1)] overflow-hidden">
        {/* Glow Accents */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-rust-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-rust-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Column: Heading and description */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              Automated Steam & Discord Integration
            </div>

            <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight font-display text-white">
              Link Your Account & Unlock <span className="text-amber-400">/kit</span> Instantly
            </h3>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Authenticate via Steam and link your Discord in 1 click. Our automated bot assigns you the 
              <strong className="text-white"> @Verified</strong> Discord role and executes live RCON commands on the Rust server to grant you free starter kits and track your wipe statistics!
            </p>

            {/* Steps mini list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-rust-500/5 border border-rust-500/20">
                <span className="text-[10px] font-bold text-rust-400 uppercase tracking-wider block">Step 1</span>
                <span className="text-xs font-bold text-white">Login with Steam</span>
              </div>
              <div className="p-3 rounded-xl bg-rust-500/5 border border-rust-500/20">
                <span className="text-[10px] font-bold text-rust-300 uppercase tracking-wider block">Step 2</span>
                <span className="text-xs font-bold text-white">Link Discord Profile</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Step 3</span>
                <span className="text-xs font-bold text-white">Type /kit</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive State Card */}
          <div className="lg:col-span-5">
            {user ? (
              <div className="p-6 rounded-2xl bg-obsidian-950/80 border border-rust-500/40 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                  <img
                    src={user.avatar || "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg"}
                    alt={user.steam_name}
                    className="w-12 h-12 rounded-xl border-2 border-rust-400/60"
                  />
                  <div>
                    <h4 className="font-bold text-white text-base">{user.steam_name}</h4>
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Steam Authenticated
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Discord Status:</span>
                    {user.is_linked ? (
                      <span className="text-emerald-400 font-bold">✓ Linked ({user.discord_tag})</span>
                    ) : (
                      <span className="text-amber-400 font-bold">⚠️ Unlinked</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Kit Status:</span>
                    <span className="text-amber-300 font-bold font-mono">
                      {user.is_linked ? "READY (/kit)" : "LOCKED"}
                    </span>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    {user.is_linked ? (
                      <button
                        onClick={openProfile}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rust-600 to-rust-500 hover:from-rust-500 hover:to-rust-400 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-all flex items-center justify-center gap-2"
                      >
                        <Award className="w-4 h-4" /> Open Player Dashboard
                      </button>
                    ) : (
                      <button
                        onClick={linkDiscord}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(88,101,242,0.4)] transition-all flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" /> Link Discord to Claim Kit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-obsidian-950/80 border border-white/10 backdrop-blur-md text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rust-500/10 border border-rust-500/30 text-rust-400 flex items-center justify-center mx-auto">
                  <Gift className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Join the GOAT Community</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connect your Steam account to check your stats, climb the leaderboard, and unlock free perks!
                  </p>
                </div>
                <button
                  onClick={loginWithSteam}
                  className="w-full py-3 px-6 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-rust-600 via-rust-500 to-rust-400 text-white shadow-[0_0_25px_rgba(249,115,22,0.45)] hover:brightness-110 transition-all flex items-center justify-center gap-2 border border-rust-400/40"
                >
                  <Flame className="w-4 h-4 fill-current" /> Sign in with Steam
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
