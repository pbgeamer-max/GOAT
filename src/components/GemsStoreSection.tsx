import React, { useState } from "react";
import { GemsPackage, GemsPurchaseModal } from "@/components/GemsPurchaseModal";
import gemsData from "../../data/gems_packages.json";

interface GemsStoreSectionProps {
  onOpenAllRanks?: () => void;
}

export const GemsStoreSection: React.FC<GemsStoreSectionProps> = () => {
  const [selectedPkg, setSelectedPkg] = useState<GemsPackage | null>(null);

  const packages: GemsPackage[] = gemsData as GemsPackage[];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
      {/* Atlas-Style Trust Indicators */}
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-8 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <span className="font-semibold text-zinc-300">Instant Delivery</span>
        </div>
        <div className="hidden sm:block w-px h-3.5 bg-gray-700" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]" />
          <span className="font-semibold text-zinc-300">Secure Payment</span>
        </div>
        <div className="hidden sm:block w-px h-3.5 bg-gray-700" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_#c084fc]" />
          <span className="font-semibold text-zinc-300">24/7 Support</span>
        </div>
      </div>

      {/* 5-Card Atlas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {packages.map((pkg) => {
          const isPopular = pkg.badge?.color === "orange";
          const isBestValue = pkg.badge?.color === "emerald";
          const isMaxValue = pkg.badge?.color === "gold";

          /* Card base theme colors — exact Atlas palette */
          const cardBg = isMaxValue
            ? "bg-gray-900 bg-gradient-to-br from-yellow-600/35 via-yellow-600/15 to-gray-950/95"
            : isBestValue
            ? "bg-gray-900 bg-gradient-to-br from-green-600/35 via-green-600/15 to-gray-950/95"
            : isPopular
            ? "bg-gray-900 bg-gradient-to-br from-orange-600/20 via-orange-600/10 to-gray-950/95"
            : "bg-gray-900 bg-gradient-to-br from-gray-700/75 via-gray-900/65 to-gray-950/45";

          const cardBorder = isMaxValue
            ? "border-yellow-600/40 border-2"
            : isBestValue
            ? "border-green-600/40 border-2"
            : isPopular
            ? "border-orange-600/40 border-2"
            : "border-gray-600/40 border";

          const cardGlow = isMaxValue
            ? "shadow-lg shadow-yellow-500/15 hover:shadow-2xl hover:shadow-yellow-500/40"
            : isBestValue
            ? "shadow-lg shadow-green-500/15 hover:shadow-2xl hover:shadow-green-500/40"
            : isPopular
            ? "shadow-lg shadow-orange-500/15 hover:shadow-2xl hover:shadow-orange-500/40"
            : "shadow-lg shadow-gray-500/15 hover:shadow-2xl hover:shadow-gray-500/40";

          const btnClass = isMaxValue
            ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-extrabold"
            : isBestValue
            ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-extrabold"
            : isPopular
            ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold"
            : "bg-[#252c3c] hover:bg-[#2f384c] text-white font-bold border border-white/10";

          const badgeClass = isBestValue
            ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-green-400 shadow-lg shadow-green-500/25"
            : isMaxValue
            ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black border-yellow-400 shadow-lg shadow-yellow-500/25"
            : isPopular
            ? "bg-orange-600 text-white border-orange-500"
            : "";

          const accentColor = isMaxValue
            ? "text-yellow-400"
            : isBestValue
            ? "text-green-400"
            : isPopular
            ? "text-orange-400"
            : "text-gray-300";

          const imgDropShadow = isMaxValue
            ? "drop-shadow-[0_0_20px_rgba(234,179,8,0.35)]"
            : isBestValue
            ? "drop-shadow-[0_0_20px_rgba(34,197,94,0.35)]"
            : isPopular
            ? "drop-shadow-[0_0_20px_rgba(249,115,22,0.35)]"
            : "drop-shadow-[0_0_12px_rgba(255,255,255,0.05)]";

          return (
            <div
              key={pkg.id}
              onClick={() => setSelectedPkg(pkg)}
              className={`
                relative overflow-hidden rounded-2xl flex flex-col cursor-pointer
                ${cardBg} ${cardBorder}
                ${cardGlow}
                transform transition-all duration-300 hover:scale-[1.03]
              `}
            >
              {/* Badge Top-Right */}
              {pkg.badge && (
                <div className="absolute top-2.5 right-2.5 z-10">
                  <div
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass} tracking-wide`}
                  >
                    {pkg.badge.text}
                  </div>
                </div>
              )}

              {/* Card Body */}
              <div className="relative p-4 sm:p-5 flex flex-col h-full">
                <div className="flex-1">
                  {/* Gem Image */}
                  <div className="flex justify-center items-center h-28 sm:h-32 mb-3">
                    <img
                      src={(pkg as any).image}
                      alt={pkg.title}
                      loading="lazy"
                      className={`w-auto max-h-24 sm:max-h-28 object-contain transition-transform duration-200 hover:scale-105 ${imgDropShadow}`}
                    />
                  </div>

                  {/* Title */}
                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md">
                      {pkg.title}
                    </h3>
                  </div>

                  {/* Bonus value (or fixed height spacer) */}
                  <div className="text-center mt-1 h-5 flex items-center justify-center">
                    {pkg.bonusValue ? (
                      <span className={`text-xs sm:text-sm font-semibold ${accentColor}`}>
                        {pkg.bonusValue}
                      </span>
                    ) : (
                      <span className="invisible text-xs">-</span>
                    )}
                  </div>

                  {/* Available On */}
                  <div className="mt-4">
                    <p className="text-gray-400 text-xs mb-2 font-medium">Available on:</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="bg-green-600/20 text-green-400 border-green-600/50 text-[10px] font-bold px-2 py-0.5 rounded border">
                        3x
                      </span>
                      <span className="bg-blue-600/20 text-blue-400 border-blue-600/50 text-[10px] font-bold px-2 py-0.5 rounded border">
                        5x
                      </span>
                      <span className="bg-red-600/20 text-red-400 border-red-600/50 text-[10px] font-bold px-2 py-0.5 rounded border">
                        10x
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & Button */}
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="mb-3">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                      {pkg.priceText}
                    </span>
                    <div className="text-xs text-gray-400 mt-0.5">One-time purchase</div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPkg(pkg);
                    }}
                    className={`
                      w-full font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm tracking-wide
                      hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all
                      ${btnClass}
                    `}
                  >
                    BUY NOW
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedPkg && (
        <GemsPurchaseModal pkg={selectedPkg} onClose={() => setSelectedPkg(null)} />
      )}
    </div>
  );
};
