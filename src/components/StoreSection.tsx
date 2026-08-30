import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useServer } from "@/context/ServerContext";
import { useToast } from "@/components/Toast";
import {
  Sparkles,
  Zap,
  Shield,
  Gift,
  Check,
  ChevronRight,
  Mic,
  Package,
  Crosshair,
  Lock,
} from "lucide-react";

interface KitCard {
  id: string;
  name: string;
  tag: string;
  category: "free" | "booster" | "voice" | "vip";
  cooldown: string;
  description: string;
  items: string[];
  gradient: string;
  badgeColor: string;
  command: string;
  isUnlocked?: boolean;
}

export const StoreSection: React.FC = () => {
  const { user, loginWithSteam, openProfile } = useAuth();
  const { discordUrl } = useServer();
  const { showToast } = useToast();
  const [activeCategory, setActiveCategory] = useState<"all" | "free" | "booster" | "voice" | "vip">("all");

  const kits: KitCard[] = [
    {
      id: "discord",
      name: "DISCORD VERIFIED KIT",
      tag: "FREE REWARD",
      category: "free",
      cooldown: "2 Hours",
      description: "Unlocked instantly when you link your Steam & Discord accounts on this website.",
      items: [
        "1x Semi-Automatic Rifle (SAR) + 60x 5.56 Ammo",
        "1x Full Roadsign Armor Set",
        "2x Medical Syringes + 1x Medkit",
        "2,500x Wood + 2,500x Stone",
        "100x Low Grade Fuel",
      ],
      gradient: "from-blue-600/20 via-blue-900/10 to-transparent",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      command: "/kit discord",
      isUnlocked: user?.is_linked,
    },
    {
      id: "booster",
      name: "DISCORD SERVER BOOSTER",
      tag: "BOOSTER EXCLUSIVE",
      category: "booster",
      cooldown: "3 Hours",
      description: "Exclusive reward crate for active Discord Server Boosters on GOAT 5X.",
      items: [
        "1x Assault Rifle (AK-47) + 120x 5.56 HV Ammo",
        "1x Full Metal Facemask & Chestplate Set",
        "4x Medical Syringes",
        "5,000x Wood + 5,000x Stone + 1,000x Metal",
        "1x Supply Signal (Airdrop Flare)",
      ],
      gradient: "from-fuchsia-600/20 via-fuchsia-900/10 to-transparent",
      badgeColor: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
      command: "/kit booster",
      isUnlocked: user?.is_booster,
    },
    {
      id: "voice",
      name: "VOICE ACTIVE CRATE",
      tag: "VOICE CALLS",
      category: "voice",
      cooldown: "4 Hours",
      description: "Earned by spending time in Discord voice channels with clanmates & community.",
      items: [
        "1x MP5A4 + 90x Pistol Ammo",
        "1x Coffee Can Helmet + Hoodie / Pants Set",
        "3x Medical Syringes",
        "3,000x Wood + 2,000x Stone",
        "500x Scrap",
      ],
      gradient: "from-indigo-600/20 via-indigo-900/10 to-transparent",
      badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      command: "/kit voice",
      isUnlocked: (user?.voice_time_seconds || 0) >= 3600,
    },
    {
      id: "vip",
      name: "VIP LEGEND PACK",
      tag: "VIP TIER",
      category: "vip",
      cooldown: "1 Hour",
      description: "High-tier server support package with instant teleport, queue skip & daily supply drops.",
      items: [
        "Queue Skip Priority (Permanent)",
        "1x L96 Sniper Rifle + 8x Scope",
        "2x Timed Explosive Charges (C4)",
        "10,000x Sulfur + 15,000x Wood",
        "Special VIP In-Game Chat Badge",
      ],
      gradient: "from-amber-600/20 via-amber-900/10 to-transparent",
      badgeColor: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      command: "/kit vip",
      isUnlocked: false,
    },
  ];

  const filteredKits = activeCategory === "all" ? kits : kits.filter((k) => k.category === activeCategory);

  return (
    <section id="store" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-[#07090e] border-t border-white/10">
      {/* Background radial atmosphere */}
      <div className="absolute inset-0 bg-tactical-grid opacity-15 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-red-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-mono text-xs uppercase tracking-widest mb-3">
              <Gift className="w-3.5 h-3.5" /> GOAT 5X KITS & STORE
            </div>
            <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white uppercase tracking-tight">
              SERVER KITS & <span className="text-[#e62020]">REWARDS</span>
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-[#0d1017] p-1.5 rounded-xl border border-white/10">
            {[
              { id: "all", label: "ALL KITS" },
              { id: "free", label: "LINKED REWARDS" },
              { id: "booster", label: "DISCORD BOOSTER" },
              { id: "voice", label: "VOICE ACTIVE" },
              { id: "vip", label: "VIP TIERS" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-4 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all ${
                  activeCategory === cat.id
                    ? "bg-[#e62020] text-white shadow-[0_0_15px_rgba(230,32,32,0.4)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kits Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredKits.map((kit) => (
            <div
              key={kit.id}
              className="relative flex flex-col bg-[#0b0e15] border border-white/10 hover:border-red-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] group overflow-hidden"
            >
              {/* Card top banner glow */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${kit.id === "booster" ? "from-fuchsia-500 to-pink-500" : kit.id === "vip" ? "from-yellow-500 to-amber-500" : "from-red-500 to-orange-500"}`} />

              {/* Tag & Cooldown */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${kit.badgeColor}`}>
                  {kit.tag}
                </span>
                <span className="font-mono text-xs text-zinc-400">
                  {kit.cooldown}
                </span>
              </div>

              {/* Kit Name */}
              <h3 className="font-display font-black text-xl text-white uppercase tracking-tight mb-2 group-hover:text-red-400 transition-colors">
                {kit.name}
              </h3>

              {/* Description */}
              <p className="text-zinc-400 text-xs leading-relaxed mb-5 flex-grow">
                {kit.description}
              </p>

              {/* Included Items List */}
              <div className="bg-[#06080d] rounded-xl p-3.5 border border-white/5 mb-6">
                <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-zinc-400" /> INCLUDED IN KIT:
                </div>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {kit.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              {user ? (
                kit.isUnlocked ? (
                  <button
                    onClick={() => {
                      showToast(`Type ${kit.command} in Rust server chat to claim!`, "success");
                    }}
                    className="w-full py-3 atlas-btn-red text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> UNLOCKED — USE {kit.command}
                  </button>
                ) : (
                  <button
                    onClick={openProfile}
                    className="w-full py-3 atlas-btn-dark text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-zinc-400" /> UNLOCK IN PROFILE
                  </button>
                )
              ) : (
                <button
                  onClick={loginWithSteam}
                  className="w-full py-3 bg-[#171a21] hover:bg-[#222834] border border-white/15 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 rounded-lg transition-colors"
                >
                  LOGIN TO CLAIM
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
