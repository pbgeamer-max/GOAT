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
    <div className="animate-in fade-in duration-300 w-full">
      {/* Main Store — full width hero lives inside StoreSection */}
      <StoreSection />

      {/* Instant Delivery & Store Guarantee FAQ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
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
    </div>
  );

};
