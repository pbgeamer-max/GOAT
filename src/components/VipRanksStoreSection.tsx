import React, { useState } from "react";
import {
  Crown,
  Star,
  Sparkles,
  Flame,
  ArrowLeftRight,
  ArrowRight,
  X,
  Check,
} from "lucide-react";
import vipData from "../../data/vip_ranks.json";
import { VipPurchaseModal, VipRankItem } from "@/components/VipPurchaseModal";

interface VipRanksStoreSectionProps {
  onBrowseOptions?: () => void;
}

export const VipRanksStoreSection: React.FC<VipRanksStoreSectionProps> = ({
  onBrowseOptions,
}) => {
  const [selectedRank, setSelectedRank] = useState<VipRankItem | null>(null);
  const [showTrialBanner, setShowTrialBanner] = useState(true);

  const ranks = vipData as any[];

  const handleBundleClick = () => {
    setSelectedRank({
      id: "bundle_all_ranks",
      title: "Bundle: All Ranks",
      subtitle: "Instant access to all premium ranks",
      price: 130.0,
      priceText: "$130.00",
      billing: "/mo",
      perks: [
        "All Prime, Mythic, Vanguard, & Champion perks",
        "+50 Gems/Hour across all servers",
        "Save $68.96 (35% OFF)",
        "+250 Free Gems instant bonus",
        "Instant delivery via automated console",
      ],
      accentColor: "#eab308",
      badge: "BUNDLE 35% OFF",
    });
  };

  const handleFreeTrialClick = () => {
    setSelectedRank({
      id: "champion_trial",
      title: "Champion (3 Days Free Trial)",
      subtitle: "Full access to our highest rank — no payment needed to start",
      price: 0,
      priceText: "FREE TRIAL",
      billing: " (3 Days)",
      perks: [
        "Full Champion tier perks",
        "No cooldowns & unlimited access",
        "Exclusive perks & queue priority",
        "+30 Gems/Hour during trial",
        "No payment needed to start",
      ],
      accentColor: "#eab308",
      badge: "FREE TRIAL",
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* ── Free Trial Banner (Atlas Style) ── */}
      {showTrialBanner && (
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#0c1220]/90 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">
                  Try <span className="text-yellow-400 font-extrabold">Champion</span> free for 3 days
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                Full access to our highest rank — no payment needed to start
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleFreeTrialClick}
              className="px-4 py-2 rounded-lg bg-[#eab308] hover:bg-[#ca8a04] text-black font-display font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(234,179,8,0.35)] cursor-pointer"
            >
              START FREE TRIAL
            </button>
            <button
              onClick={() => setShowTrialBanner(false)}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── 5 VIP Cards Grid (Exact 1:1 Atlas Dimensions & Proportions) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {ranks.map((rank) => {
          const isVipUltimate = rank.id === "vip_ultimate";
          const isPrime = rank.id === "rank_prime";
          const isMythic = rank.id === "rank_mythic";
          const isVanguard = rank.id === "rank_vanguard";
          const isChampion = rank.id === "rank_champion";

          return (
            <div
              key={rank.id}
              className={`relative flex flex-col justify-between rounded-2xl bg-[#0c1322]/90 backdrop-blur-md border border-[#1b263b] hover:border-[#2f3f5e] p-5 transition-all duration-300 hover:-translate-y-1 shadow-[0_15px_35px_rgba(0,0,0,0.6)] overflow-hidden group ${
                isChampion
                  ? "border-[#eab308]/40 hover:border-[#eab308]"
                  : isVanguard
                  ? "border-[#ef4444]/40 hover:border-[#ef4444]"
                  : ""
              }`}
            >
              {/* Top-Right Badge (e.g. POPULAR on Vanguard) */}
              {rank.badge && (
                <div className="absolute top-4 right-4 z-20">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-display font-black text-[10px] uppercase tracking-wider bg-[#9333ea]/25 text-[#c084fc] border border-[#a855f7]/40 shadow-sm">
                    {rank.badge}
                  </span>
                </div>
              )}

              {/* 3D Embossed Watermark Crest in Background (Exact Atlas Style) */}
              <div className="absolute -right-6 top-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.07] group-hover:opacity-[0.14] transition-opacity duration-300">
                <span
                  className="font-display font-black text-7xl tracking-tighter uppercase block"
                  style={{ color: rank.accentColor }}
                >
                  {rank.watermark}
                </span>
              </div>

              {/* Card Top Section */}
              <div className="relative z-10">
                {/* Header: Icon + Title */}
                <div className="flex items-center gap-2.5 mb-1">
                  {isVipUltimate && <ArrowLeftRight className="w-5 h-5 text-emerald-400" />}
                  {isPrime && <Star className="w-5 h-5 text-blue-400" />}
                  {isMythic && <Sparkles className="w-5 h-5 text-purple-400" />}
                  {isVanguard && <Star className="w-5 h-5 text-red-400" />}
                  {isChampion && <Crown className="w-5 h-5 text-yellow-400" />}

                  <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">
                    {rank.title}
                  </h3>
                </div>

                <p className="text-[11px] text-zinc-400 leading-tight mb-4">
                  {rank.subtitle}
                </p>

                {/* Features Bullet List */}
                <div className="space-y-2 mb-4">
                  {rank.perks.map((perk: string, pIdx: number) => (
                    <div key={pIdx} className="flex items-start gap-2 text-xs text-zinc-300">
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: rank.accentColor }}
                      />
                      <span className="leading-snug">{perk}</span>
                    </div>
                  ))}
                </div>

                {/* Graphic for Card 1 (VIP Card Graphic) */}
                {isVipUltimate && (
                  <div className="my-2 p-3 rounded-xl bg-gradient-to-tr from-[#0b151e] to-[#12232a] border border-emerald-500/20 relative overflow-hidden flex items-center justify-between">
                    <div className="font-display font-black text-xs text-emerald-400 tracking-wider">
                      VIP PASS
                    </div>
                    <div className="font-mono text-[10px] text-zinc-400">ATLAS / GOAT</div>
                    <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-lg" />
                  </div>
                )}
              </div>

              {/* Card Bottom Section */}
              <div className="relative z-10 pt-4 border-t border-white/5 mt-auto">
                {/* Available on badges */}
                <div className="mb-3">
                  <div className="text-[11px] font-medium text-zinc-400 mb-1.5">Available on:</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {rank.availableOn.map((srv: string) => (
                      <span
                        key={srv}
                        className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#131c2e] border border-[#202f4a] text-zinc-300"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price Display */}
                <div className="mb-3">
                  {rank.startingAt ? (
                    <div>
                      <div className="text-[11px] text-zinc-400 font-medium">Starting at</div>
                      <div className="font-display font-black text-2xl text-white tracking-tight">
                        {rank.startingAt}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="font-display font-black text-3xl text-white tracking-tight">
                        {rank.priceText}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">{rank.billing}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {isVipUltimate ? (
                  <button
                    onClick={onBrowseOptions || handleBundleClick}
                    className="w-full py-3 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center bg-[#10b981] hover:bg-[#059669] text-black shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                  >
                    <span>BROWSE VIP OPTIONS</span>
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setSelectedRank({
                        id: rank.id,
                        title: rank.title,
                        subtitle: rank.subtitle,
                        price: rank.price,
                        priceText: rank.priceText,
                        billing: rank.billing,
                        perks: rank.perks,
                        accentColor: rank.accentColor,
                        badge: rank.badge,
                      })
                    }
                    className={`w-full py-3 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center ${
                      isChampion
                        ? "bg-[#eab308] hover:bg-[#ca8a04] text-black shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                        : "bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]"
                    }`}
                  >
                    <span>BUY NOW</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bundle: All Ranks Banner (Exact 1:1 Atlas Rust Style) ── */}
      <div className="relative rounded-2xl bg-[#0c1322]/95 backdrop-blur-md border border-white/10 p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_15px_35px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Subtle Ambient Background Light */}
        <div className="absolute -left-20 top-0 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Left Side: Title + Description + Badges */}
        <div className="relative z-10">
          <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
            Bundle: All Ranks
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-xl">
            Get instant access to all premium ranks and dominate every server
          </p>

          {/* 4 Feature Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Save $68.96
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
              35% OFF
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              +250 Free Gems
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              +50 Per Hour
            </span>
          </div>
        </div>

        {/* Right Side: Price + CTA Button */}
        <div className="relative z-10 flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-start lg:items-center gap-4 shrink-0">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-zinc-500 line-through text-sm sm:text-base">
              $198.96
            </span>
            <span className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
              $130.00
            </span>
            <span className="text-xs text-zinc-400 font-mono">/mo</span>
          </div>

          <button
            onClick={handleBundleClick}
            className="px-6 py-3.5 rounded-xl bg-[#eab308] hover:bg-[#ca8a04] text-black font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(234,179,8,0.4)] cursor-pointer transition-all duration-200"
          >
            <span>GET ALL RANKS NOW</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Modal */}
      {selectedRank && (
        <VipPurchaseModal rank={selectedRank} onClose={() => setSelectedRank(null)} />
      )}
    </div>
  );
};
