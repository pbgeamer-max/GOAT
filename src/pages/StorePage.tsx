import React, { useEffect, useState } from "react";
import { StoreSection } from "@/components/StoreSection";
import { ShoppingBag, Zap, ShieldCheck, Gift, Crown, Clock, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface VipStatus {
  is_vip: boolean;
  vip_tier: string | null;
  vip_expires_at: string | null;
  vip_has_hq: boolean;
  remaining_days: number;
}

const TIER_COLORS: Record<string, string> = {
  god: "from-purple-600 to-fuchsia-500",
  mvp: "from-cyan-500 to-blue-600",
  vip: "from-yellow-500 to-amber-400",
  guns: "from-red-500 to-rose-400",
  builder: "from-emerald-500 to-green-400",
};

const TIER_LABELS: Record<string, string> = {
  god: "⚡ GOD",
  mvp: "💎 MVP",
  vip: "⭐ VIP",
  guns: "🔫 GUNS",
  builder: "🏗️ BUILDER",
};

export const StorePage: React.FC = () => {
  const { user, loginWithSteam } = useAuth();
  const [vipStatus, setVipStatus] = useState<VipStatus | null>(null);
  const [loadingVip, setLoadingVip] = useState(false);

  useEffect(() => {
    if (!user) { setVipStatus(null); return; }
    setLoadingVip(true);
    fetch("/api/user/vip-status", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.success) setVipStatus(data); })
      .catch(() => {})
      .finally(() => setLoadingVip(false));
  }, [user]);

  const tierKey = vipStatus?.vip_tier?.toLowerCase() || "vip";
  const gradient = TIER_COLORS[tierKey] || TIER_COLORS.vip;
  const tierLabel = TIER_LABELS[tierKey] || "⭐ VIP";

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-10 text-center sm:text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 font-mono text-xs font-bold uppercase tracking-widest mb-4">
            <ShoppingBag className="w-3.5 h-3.5" /> OFFICIAL VIP STORE
          </div>
          <h1 className="font-display font-black text-4xl sm:text-6xl text-white uppercase tracking-tight">
            VIP PACKAGES <span className="text-yellow-400">&</span> IN-GAME KITS
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base font-sans max-w-2xl mt-2">
            Enhance your gameplay with queue skip, VIP kits, skinbox access, and exclusive Discord roles. Delivered instantly via RCON!
          </p>
        </div>

        {/* User Status Pill — shows VIP badge if active */}
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3 min-w-[220px]">
          {user ? (
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.steam_name}
                  className={`w-10 h-10 rounded-lg border-2 ${vipStatus?.is_vip ? "border-yellow-400" : "border-white/20"}`}
                />
                <div className="text-left">
                  <div className="text-xs text-zinc-400 font-mono">Logged in as:</div>
                  <div className="text-sm font-display font-bold text-white">{user.steam_name}</div>
                </div>
              </div>

              {/* VIP Status Badge */}
              {!loadingVip && vipStatus?.is_vip ? (
                <div className={`w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-r ${gradient} bg-opacity-20 border border-yellow-500/30`}>
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-yellow-300" />
                    <span className="font-display font-bold text-xs text-white uppercase">{tierLabel} Active</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-200 font-mono text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{vipStatus.remaining_days}d left</span>
                  </div>
                </div>
              ) : !loadingVip ? (
                <div className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  <Star className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-zinc-500 text-xs font-mono">No active VIP subscription</span>
                </div>
              ) : null}
            </div>
          ) : (
            <button
              onClick={loginWithSteam}
              className="px-4 py-2.5 rounded-lg bg-[#171a21] hover:bg-[#222834] border border-white/20 text-white font-display font-bold text-xs uppercase flex items-center gap-2 transition-all shadow-md"
            >
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Login to Sync Steam</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Store Kits & Ranks */}
      <StoreSection />

      {/* Instant Delivery & Store Guarantee FAQ */}
      <div className="mt-16 pt-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
          <h3 className="font-display font-bold text-xl text-white uppercase flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Instant Automatic RCON Delivery
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
            All purchases are processed instantly. As soon as checkout completes, our automated WebRCON daemon transmits permissions to the live Rust server within <strong>3-5 seconds</strong> without server restarts.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
          <h3 className="font-display font-bold text-xl text-white uppercase flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-yellow-400" /> Free Kits Available
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm font-sans leading-relaxed">
            You don't have to pay to get rewarded! Link your Discord account on our website to claim the <strong>/kit discord</strong> starter kit, or boost our Discord to unlock the <strong>/kit booster</strong> pack completely free.
          </p>
        </div>
      </div>
    </div>
  );
};
