import React, { useState } from "react";
import { GemsPackage, GemsPurchaseModal } from "@/components/GemsPurchaseModal";
import gemsData from "../../data/gems_packages.json";
import { Sparkles, ShieldCheck, Zap, Headphones, Check, ExternalLink } from "lucide-react";

export const GemsStoreSection: React.FC = () => {
  const [selectedPkg, setSelectedPkg] = useState<GemsPackage | null>(null);

  const packages: GemsPackage[] = gemsData as GemsPackage[];

  return (
    <div className="w-full">
      {/* Header Banner */}
      <div className="mb-8 text-center sm:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-mono text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> OFFICIAL IN-GAME CURRENCY
          </div>
          <h3 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
            GOAT GEMS <span className="text-yellow-400">PACKAGES</span>
          </h3>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Purchase in-game GEMS to unlock permanent custom weapon skins, armor, doors, and exclusive store items.
          </p>
        </div>

        {/* Quick Trust Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-300">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Instant In-Game Delivery</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Zap className="w-4 h-4" />
            <span>Discord Ticket Support</span>
          </div>
        </div>
      </div>

      {/* 5-Card Atlas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
        {packages.map((pkg) => {
          const isPopular = pkg.badge?.color === "orange";
          const isBestValue = pkg.badge?.color === "emerald";
          const isMaxValue = pkg.badge?.color === "gold";

          return (
            <div key={pkg.id} className="relative group flex flex-col">
              {/* Glowing Background Halos (Matching Screenshot) */}
              <div
                className="absolute -inset-1 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"
                style={{ backgroundColor: pkg.glowColor }}
              />

              {/* Card Container */}
              <div
                className={`relative z-10 flex flex-col justify-between flex-1 rounded-2xl bg-[#0c1017] p-5 transition-all duration-200 ${
                  pkg.borderClass || "border border-[#1e2638] hover:border-[#2f3d59]"
                }`}
              >
                {/* Top Badge (if any) */}
                {pkg.badge && (
                  <div className="absolute -top-3 right-3 z-20">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-display font-black text-[10px] uppercase tracking-wider shadow-lg ${
                        isPopular
                          ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                          : isBestValue
                          ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                          : "bg-gradient-to-r from-yellow-500 to-amber-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                      }`}
                    >
                      {pkg.badge.text}
                    </span>
                  </div>
                )}

                {/* Top Section: Image & Title */}
                <div>
                  {/* Gem Artwork */}
                  <div className="relative w-full aspect-square rounded-xl bg-gradient-to-b from-black/40 to-black/80 flex items-center justify-center p-3 mb-4 overflow-hidden border border-white/5">
                    <img
                      src={pkg.image}
                      alt={pkg.title}
                      loading="lazy"
                      className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Gem Count / Title */}
                  <div className="text-center">
                    <h4 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-tight">
                      {pkg.title}
                    </h4>

                    {/* Value Bonus Subtext */}
                    <div className="h-5 mt-1 flex items-center justify-center">
                      {pkg.bonusValue ? (
                        <span
                          className={`text-xs font-mono font-bold ${
                            isPopular
                              ? "text-orange-400"
                              : isBestValue
                              ? "text-emerald-400"
                              : isMaxValue
                              ? "text-yellow-400"
                              : "text-zinc-400"
                          }`}
                        >
                          {pkg.bonusValue}
                        </span>
                      ) : (
                        <span className="text-transparent text-xs select-none">•</span>
                      )}
                    </div>
                  </div>

                  {/* Available On Pills (Exact Atlas Style) */}
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <div className="text-[11px] font-mono text-zinc-400 mb-1.5">Available on:</div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#131d2e] border border-blue-500/30 text-blue-300">
                        3x
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10242a] border border-cyan-500/30 text-cyan-300">
                        5x
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#26161b] border border-red-500/30 text-red-300">
                        10x
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Price & Add to Cart Button */}
                <div className="mt-6 pt-3 border-t border-white/5">
                  <div className="mb-3">
                    <div className="font-display font-black text-2xl text-white tracking-tight">
                      {pkg.priceText}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      {pkg.subtext || "One-time purchase"}
                    </div>
                  </div>

                  {/* ADD TO CART Button (Opens Discord Order Modal) */}
                  <button
                    onClick={() => setSelectedPkg(pkg)}
                    className={`w-full py-3 px-4 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all duration-150 transform active:scale-95 flex items-center justify-center gap-1.5 ${
                      pkg.btnClass
                    }`}
                  >
                    <span>ADD TO CART</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Modal */}
      {selectedPkg && (
        <GemsPurchaseModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />
      )}
    </div>
  );
};
