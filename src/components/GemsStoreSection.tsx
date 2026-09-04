import React, { useState } from "react";
import { GemsPackage, GemsPurchaseModal } from "@/components/GemsPurchaseModal";
import gemsData from "../../data/gems_packages.json";
import { ShieldCheck, Zap, Headphones } from "lucide-react";

export const GemsStoreSection: React.FC = () => {
  const [selectedPkg, setSelectedPkg] = useState<GemsPackage | null>(null);

  const packages: GemsPackage[] = gemsData as GemsPackage[];

  return (
    <div className="w-full">
      {/* Atlas-Style Top Trust Indicators */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8 text-xs font-mono text-zinc-300">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c1322]/80 border border-[#1e2a42] text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-zinc-200">Instant Delivery</span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c1322]/80 border border-[#1e2a42] text-blue-400">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="font-bold text-zinc-200">Secure Payment</span>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0c1322]/80 border border-[#1e2a42] text-purple-400">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="font-bold text-zinc-200">24/7 Discord Support</span>
        </div>
      </div>

      {/* 5-Card Atlas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-4 xl:gap-5">
        {packages.map((pkg) => {
          const isPopular = pkg.badge?.color === "orange";
          const isBestValue = pkg.badge?.color === "emerald";
          const isMaxValue = pkg.badge?.color === "gold";

          return (
            <div key={pkg.id} className="relative group flex flex-col">
              {/* Subtle Ambient Glow for Featured Packages */}
              {(isPopular || isBestValue || isMaxValue) && (
                <div
                  className="absolute -inset-1 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none"
                  style={{ backgroundColor: pkg.glowColor }}
                />
              )}

              {/* Card Container */}
              <div
                className={`relative z-10 flex flex-col justify-between flex-1 rounded-2xl bg-[#0c1322]/90 backdrop-blur-md p-5 transition-all duration-200 ${
                  isPopular
                    ? "border border-[#ff5500]/60 hover:border-[#ff5500] shadow-[0_0_20px_rgba(255,85,0,0.15)]"
                    : isBestValue
                    ? "border border-[#00c978]/60 hover:border-[#00c978] shadow-[0_0_20px_rgba(0,201,120,0.15)]"
                    : isMaxValue
                    ? "border border-[#eab308]/60 hover:border-[#eab308] shadow-[0_0_20px_rgba(234,179,8,0.15)]"
                    : "border border-[#1b263b] hover:border-[#2f3f5e]"
                }`}
              >
                {/* Top Badge (Exact Atlas Style) */}
                {pkg.badge && (
                  <div className="absolute -top-3 right-4 z-20">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full font-display font-black text-[10px] uppercase tracking-wider shadow-lg ${
                        isPopular
                          ? "bg-[#ff5500] text-white shadow-[0_4px_12px_rgba(255,85,0,0.4)]"
                          : isBestValue
                          ? "bg-[#00c978] text-black shadow-[0_4px_12px_rgba(0,201,120,0.4)]"
                          : "bg-[#eab308] text-black shadow-[0_4px_12px_rgba(234,179,8,0.4)]"
                      }`}
                    >
                      {pkg.badge.text}
                    </span>
                  </div>
                )}

                {/* Upper Area: Image + Title + Bonus */}
                <div>
                  {/* Gem Artwork (Clean floating artwork with drop shadow, exactly like Atlas) */}
                  <div className="h-40 w-full flex items-center justify-center relative mb-2">
                    <img
                      src={pkg.image}
                      alt={pkg.title}
                      loading="lazy"
                      className="max-h-full max-w-[85%] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Gem Count / Title */}
                  <h4 className="font-display font-black text-2xl text-white uppercase tracking-tight text-center">
                    {pkg.title}
                  </h4>

                  {/* Value Bonus Subtext */}
                  <div className="h-5 flex items-center justify-center mt-0.5">
                    {pkg.bonusValue ? (
                      <span className="text-xs font-semibold text-zinc-400">
                        {pkg.bonusValue}
                      </span>
                    ) : (
                      <span className="text-transparent text-xs select-none">•</span>
                    )}
                  </div>

                  {/* Available On Pills (Exact Atlas Style) */}
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <div className="text-[11px] font-medium text-zinc-400 mb-1.5">Available on:</div>
                    <div className="flex items-center gap-1.5">
                      {["3x", "5x", "10x"].map((srv) => (
                        <span
                          key={srv}
                          className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#131c2e] border border-[#202f4a] text-zinc-300"
                        >
                          {srv}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Price & Add to Cart Button */}
                <div className="mt-6 pt-3 border-t border-white/5">
                  <div className="mb-3">
                    <div className="font-display font-black text-3xl text-white tracking-tight">
                      {pkg.priceText}
                    </div>
                    <div className="text-[11px] font-medium text-zinc-400 mt-0.5">
                      {pkg.subtext || "One-time purchase"}
                    </div>
                  </div>

                  {/* ADD TO CART Button (Exact Atlas Styling & Colors) */}
                  <button
                    onClick={() => setSelectedPkg(pkg)}
                    className={`w-full py-3 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center ${
                      isPopular
                        ? "bg-[#ff5500] hover:bg-[#ff6a1a] text-white shadow-[0_4px_20px_rgba(255,85,0,0.45)]"
                        : isBestValue
                        ? "bg-[#00c978] hover:bg-[#00dd85] text-black shadow-[0_4px_20px_rgba(0,201,120,0.45)]"
                        : isMaxValue
                        ? "bg-[#eab308] hover:bg-[#facc15] text-black shadow-[0_4px_20px_rgba(234,179,8,0.45)]"
                        : "bg-[#182338] hover:bg-[#223250] text-white border border-[#223352]"
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
