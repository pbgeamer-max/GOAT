import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import {
  Sparkles,
  Zap,
  Package,
  MessageSquare,
  Copy,
  ExternalLink,
  X,
  Eye,
  Flame,
  Star,
  Crown,
} from "lucide-react";

import { GemsStoreSection } from "@/components/GemsStoreSection";

export interface KitItem {
  Shortname: string;
  DisplayName?: string;
  Amount: number;
  SkinId?: number;
  Container?: string;
  Slot?: number;
}

export interface LiveKit {
  Id: string;
  TabName: string;
  Title: string;
  ColorHex?: string;
  Currency: string;
  Price: number;
  PriceText?: string;
  LockType: string;
  CustomUrl?: string;
  CooldownHours?: number;
  WipeLockHours?: number;
  MaxUsesPerWipe?: number;
  Items: KitItem[];
}

const DISCORD_TICKET_URL = "https://discord.gg/EbZwSY7jXy";

interface AtlasTheme {
  name: string;
  themeColor: string;
  borderClass: string;
  badgeClass: string;
  bulletClass: string;
  btnClass: string;
  IconComponent: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const ATLAS_THEMES: AtlasTheme[] = [
  {
    name: "emerald",
    themeColor: "#10b981",
    borderClass: "border-emerald-500/30 hover:border-emerald-400/70",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    bulletClass: "bg-emerald-400",
    btnClass: "bg-[#10b981] hover:bg-[#059669] text-black font-black shadow-[0_0_25px_rgba(16,185,129,0.35)]",
    IconComponent: Zap,
  },
  {
    name: "blue",
    themeColor: "#3b82f6",
    borderClass: "border-blue-500/30 hover:border-blue-400/70",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    bulletClass: "bg-blue-400",
    btnClass: "bg-[#6366f1] hover:bg-[#4f46e5] text-white font-black shadow-[0_0_25px_rgba(99,102,241,0.35)]",
    IconComponent: Star,
  },
  {
    name: "purple",
    themeColor: "#a855f7",
    borderClass: "border-purple-500/30 hover:border-purple-400/70",
    badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    bulletClass: "bg-purple-400",
    btnClass: "bg-[#9333ea] hover:bg-[#7e22ce] text-white font-black shadow-[0_0_25px_rgba(147,51,234,0.35)]",
    IconComponent: Sparkles,
  },
  {
    name: "red",
    themeColor: "#ef4444",
    borderClass: "border-red-500/30 hover:border-red-400/70",
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
    bulletClass: "bg-red-400",
    btnClass: "bg-[#e62020] hover:bg-[#ff2b2b] text-white font-black shadow-[0_0_25px_rgba(230,32,32,0.4)]",
    IconComponent: Flame,
  },
  {
    name: "gold",
    themeColor: "#eab308",
    borderClass: "border-yellow-500/30 hover:border-yellow-400/70",
    badgeClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    bulletClass: "bg-yellow-400",
    btnClass: "bg-[#eab308] hover:bg-[#ca8a04] text-black font-black shadow-[0_0_25px_rgba(234,179,8,0.4)]",
    IconComponent: Crown,
  },
];

function getAtlasTheme(kit: LiveKit, index: number): AtlasTheme {
  const t = (kit.Title || "").toUpperCase();
  const lock = (kit.LockType || "").toUpperCase();
  if (t.includes("CHAMPION") || lock === "GOD" || t.includes("GOD")) return ATLAS_THEMES[4];
  if (t.includes("VANGUARD") || lock === "GUNS" || t.includes("GUN")) return ATLAS_THEMES[3];
  if (t.includes("MYTHIC") || lock === "MVP" || t.includes("MVP")) return ATLAS_THEMES[2];
  if (t.includes("PRIME") || lock === "BUILDER" || t.includes("BUILD")) return ATLAS_THEMES[1];
  return ATLAS_THEMES[index % ATLAS_THEMES.length];
}

function getRustItemImageUrl(shortname: string): string {
  return `https://www.rustedit.io/images/imagelibrary/${shortname.toLowerCase().trim()}.png`;
}

const RustItemSlot: React.FC<{ item?: KitItem }> = ({ item }) => {
  const [imgSrc, setImgSrc] = useState<string>(() =>
    item?.Shortname ? getRustItemImageUrl(item.Shortname) : ""
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (item?.Shortname) {
      setImgSrc(getRustItemImageUrl(item.Shortname));
      setHasError(false);
    }
  }, [item?.Shortname]);

  if (!item) {
    return (
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-[#0e121c]/70 border border-[#1b2233]/70" />
    );
  }

  const clean = (item.Shortname || "").toLowerCase().trim();
  const name = item.DisplayName || item.Shortname.replace(".", " ").toUpperCase();

  return (
    <div
      title={`${name} x${item.Amount}`}
      className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-[#131826] hover:bg-[#1c2438] border border-[#242f46] hover:border-[#3d4e72] flex items-center justify-center p-1 transition-all cursor-pointer"
    >
      {!hasError ? (
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          onError={() => {
            if (imgSrc.includes("rustedit.io")) {
              setImgSrc(`https://rustlabs.com/img/items180/${clean}.png`);
            } else {
              setHasError(true);
            }
          }}
          className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] group-hover:scale-110 transition-transform"
        />
      ) : (
        <Package className="w-6 h-6 text-zinc-500" />
      )}
      <div className="absolute bottom-0.5 right-1 text-[9px] font-mono font-black text-white bg-black/60 px-0.5 rounded select-none pointer-events-none">
        {item.Amount >= 1000 ? item.Amount.toLocaleString() : item.Amount}
      </div>
    </div>
  );
};

export const StoreSection: React.FC = () => {
  const { user, loginWithSteam } = useAuth();
  const { showToast } = useToast();
  const [kits, setKits] = useState<LiveKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeMode, setStoreMode] = useState<"kits" | "gems">("kits");
  const [inspectKit, setInspectKit] = useState<LiveKit | null>(null);
  const [buyModalKit, setBuyModalKit] = useState<LiveKit | null>(null);
  const [copiedSteamId, setCopiedSteamId] = useState(false);

  const fetchLiveKits = useCallback(async (bg = false) => {
    if (!bg) setLoading(true);
    try {
      const res = await fetch("/api/kits");
      if (!res.ok) return;
      const data = await res.json();
      if (data?.success && Array.isArray(data.kits)) {
        const paid: LiveKit[] = data.kits.filter((k: LiveKit) => {
          const cur = (k.Currency || "").toUpperCase();
          const lock = (k.LockType || "").toUpperCase();
          const price = Number(k.Price) || 0;
          return (
            price > 0 &&
            cur !== "FREE" &&
            cur !== "GEMS" &&
            lock !== "LINKED" &&
            lock !== "BOOSTER" &&
            lock !== "FREE"
          );
        });
        setKits(paid);
      }
    } catch (e) {
      console.error("[Store]", e);
    } finally {
      if (!bg) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveKits(false);
    const t = setInterval(() => fetchLiveKits(true), 20000);
    return () => clearInterval(t);
  }, [fetchLiveKits]);

  const copySteamId = () => {
    if (!user?.steam_id) return;
    navigator.clipboard.writeText(user.steam_id);
    setCopiedSteamId(true);
    showToast("SteamID64 copied!", "success");
    setTimeout(() => setCopiedSteamId(false), 3000);
  };

  return (
    <section
      id="store"
      className="relative pb-20 border-t border-white/10 overflow-hidden bg-[#05080f]"
    >
      {/* ── Full-Width Hero with Soldier Background ── */}
      <div
        className="relative w-full min-h-[600px] sm:min-h-[660px] flex items-center pt-16"
        style={{
          backgroundImage: "url('/images/store_hero_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark overlay — dark on left (for text), transparent on right (to show soldier) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(5,8,15,0.97) 0%, rgba(5,8,15,0.88) 38%, rgba(5,8,15,0.45) 62%, rgba(5,8,15,0.15) 100%)",
          }}
        />
        {/* Bottom fade into page bg */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, #05080f 100%)",
          }}
        />
        {/* Ambient glow behind title */}
        <div className="absolute top-16 left-[6%] w-[380px] h-[260px] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Hero Content — left-aligned */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-20">
          <div className="max-w-xl">
            <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl uppercase tracking-tight leading-[0.9] text-white">
              VIP PACKAGES
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-7">
              {user ? (
                <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-[#080c14]/90 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  <span className="font-display font-bold text-xs uppercase text-emerald-400">
                    STEAM CONNECTED:
                  </span>
                  <span className="font-mono text-xs text-white font-bold">
                    {user.steam_name || user.steam_id}
                  </span>
                </div>
              ) : (
                <button
                  onClick={loginWithSteam}
                  className="px-6 py-3.5 rounded-xl bg-[#080c14]/90 hover:bg-[#121826] text-white border border-yellow-500/50 hover:border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.25)] font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2.5 transition-all group backdrop-blur-sm"
                >
                  <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400 group-hover:scale-110 transition-transform" />
                  <span>LOGIN TO SYNC STEAM</span>
                </button>
              )}
              <div className="h-5 w-px bg-white/20 hidden sm:block" />
              <span className="text-xs font-mono text-zinc-400 font-semibold tracking-wide">
                Secure. Fast. Instant.
              </span>
            </div>
          </div>
        </div>
      </div>

        {/* Store Card Container */}
        <div className="relative -mt-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-[#070b13]/90 backdrop-blur-md pt-8 sm:pt-10 pb-12 sm:pb-16 px-4 sm:px-8 shadow-[0_20px_60px_rgba(0,0,0,0.85)] mx-4 sm:mx-6 lg:mx-8">
          {/* Centered Store Header */}
          <div className="text-center mb-8">
            <h2 className="font-display font-black text-4xl sm:text-5xl text-white uppercase tracking-tight">
              {storeMode === "gems" ? (
                <>
                  <span>BUY </span>
                  <span className="text-yellow-400">GEMS</span>
                </>
              ) : (
                <>
                  <span>SERVER </span>
                  <span className="text-[#e62020]">KITS</span>
                </>
              )}
            </h2>

          </div>

          {/* Two Tabs */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <button
              id="tab-kits"
              onClick={() => setStoreMode("kits")}
              className={`px-6 sm:px-8 py-3 rounded-xl font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all duration-200 ${
                storeMode === "kits"
                  ? "bg-[#e62020] text-white shadow-[0_0_25px_rgba(230,32,32,0.5)] border border-red-400 scale-105"
                  : "bg-[#0c1220]/80 text-zinc-400 hover:text-white border border-[#1e2a42] hover:bg-[#151f33]"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>IN-GAME KITS</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-zinc-300">
                {kits.length}
              </span>
            </button>
            <button
              id="tab-gems"
              onClick={() => setStoreMode("gems")}
              className={`px-6 sm:px-8 py-3 rounded-xl font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 transition-all duration-200 ${
                storeMode === "gems"
                  ? "bg-yellow-500 text-black shadow-[0_0_25px_rgba(234,179,8,0.5)] border border-yellow-300 scale-105"
                  : "bg-[#0c1220]/80 text-zinc-400 hover:text-white border border-[#1e2a42] hover:bg-[#151f33]"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>GEMS PACKAGES</span>
            </button>
          </div>

          {/* Tab Content */}
          {storeMode === "gems" ? (
            <GemsStoreSection />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                <div className="col-span-full py-20 text-center">
                  <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <span className="text-xs font-mono text-zinc-400">Loading server kits...</span>
                </div>
              ) : kits.length === 0 ? (
                <div className="col-span-full py-16 px-6 text-center rounded-2xl bg-[#0b0e15] border border-white/10 flex flex-col items-center justify-center">
                  <Package className="w-12 h-12 text-zinc-600 mb-4" />
                  <h4 className="font-display font-bold text-lg text-white mb-2">
                    No paid kits available right now
                  </h4>
                  <p className="text-zinc-400 text-xs sm:text-sm max-w-md">
                    Kits added to the server with a price will appear here automatically.
                  </p>
                </div>
              ) : (
                kits.map((kit, ki) => {
                  const theme = getAtlasTheme(kit, ki);
                  const TIcon = theme.IconComponent;
                  const items = kit.Items || [];
                  const priceFormatted = kit.PriceText || `$${Number(kit.Price).toFixed(2)}`;

                  return (
                    <div
                      key={kit.Id}
                      className={`relative flex flex-col bg-[#0b0f19] border ${theme.borderClass} rounded-2xl sm:rounded-3xl p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1.5 shadow-[0_15px_35px_rgba(0,0,0,0.7)] group overflow-hidden`}
                    >
                      <div
                        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-15 group-hover:opacity-30 transition-opacity duration-500"
                        style={{ backgroundColor: theme.themeColor }}
                      />
                      <div className="absolute -right-6 -bottom-6 w-56 h-56 pointer-events-none opacity-[0.06] group-hover:opacity-[0.14] transition-opacity duration-500">
                        <svg
                          viewBox="0 0 200 200"
                          fill="currentColor"
                          className="w-full h-full"
                          style={{ color: theme.themeColor }}
                        >
                          <path
                            d="M100 15 L180 50 L180 120 C180 165 140 190 100 200 C60 190 20 165 20 120 L20 50 Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="5"
                          />
                          <path
                            d="M100 38 L160 64 L160 115 C160 150 130 170 100 180 C70 170 40 150 40 115 L40 64 Z"
                            fill="currentColor"
                            fillOpacity="0.25"
                          />
                          <circle cx="100" cy="100" r="32" stroke="currentColor" strokeWidth="3" fill="none" />
                          <polygon
                            points="100,80 106,94 120,94 109,103 113,117 100,108 87,117 91,103 80,94 94,94"
                            fill="currentColor"
                          />
                        </svg>
                      </div>

                      <div className="relative z-10 flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 group-hover:scale-110 transition-transform duration-300"
                            style={{
                              backgroundColor: theme.themeColor + "18",
                              borderColor: theme.themeColor + "40",
                            }}
                          >
                            <TIcon className="w-5 h-5" style={{ color: theme.themeColor }} />
                          </div>
                          <div>
                            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">
                              {kit.Title}
                            </h3>
                            <p className="text-zinc-400 text-xs mt-0.5">
                              Enhanced equipment with in-game perks
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shrink-0 ${theme.badgeClass}`}
                        >
                          {kit.TabName || "KIT"}
                        </span>
                      </div>

                      <div className="relative z-10 space-y-2.5 my-5 py-4 border-y border-white/5 flex-grow">
                        {[
                          "Instant In-Game RCON Delivery",
                          kit.CooldownHours
                            ? `${kit.CooldownHours}h Cooldown`
                            : "No Cooldown / Ready Instantly",
                          (kit.WipeLockHours || 0) > 0
                            ? `Wipe Locked: First ${kit.WipeLockHours}h`
                            : "Available immediately from wipe",
                          (kit.MaxUsesPerWipe || 0) > 0
                            ? `Limited to ${kit.MaxUsesPerWipe}x per wipe`
                            : "Unlimited usage throughout wipe",
                        ].map((perk, pi) => (
                          <div key={pi} className="flex items-center gap-2.5 text-xs text-zinc-300">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.bulletClass}`}
                            />
                            {perk}
                          </div>
                        ))}
                        <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.bulletClass}`} />
                          <span className="font-semibold text-white">
                            {items.length} In-Game Item{items.length !== 1 ? "s" : ""} Loaded
                          </span>
                        </div>
                      </div>

                      {items.length > 0 && (
                        <div className="relative z-10 mb-5">
                          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
                            <span className="uppercase">Loaded Items ({items.length})</span>
                            <button
                              onClick={() => setInspectKit(kit)}
                              className="text-xs text-zinc-300 hover:text-white flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-red-400" />
                              View 30 slots
                            </button>
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {items.slice(0, 6).map((it, ii) => (
                              <div
                                key={ii}
                                className="relative w-11 h-11 rounded-lg bg-black/40 border border-white/10 p-1 flex items-center justify-center shrink-0 hover:border-white/30 transition-all"
                              >
                                <img
                                  src={getRustItemImageUrl(it.Shortname)}
                                  alt={it.Shortname}
                                  className="w-8 h-8 object-contain"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = `https://rustlabs.com/img/items180/${it.Shortname.toLowerCase()}.png`;
                                  }}
                                />
                                <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold text-amber-400 bg-black/75 px-1 rounded">
                                  x{it.Amount}
                                </span>
                              </div>
                            ))}
                            {items.length > 6 && (
                              <button
                                onClick={() => setInspectKit(kit)}
                                className="w-11 h-11 rounded-lg bg-white/5 border border-dashed border-white/20 flex items-center justify-center shrink-0 text-zinc-400 hover:text-white hover:bg-white/10 text-xs font-mono font-bold transition-colors"
                              >
                                +{items.length - 6}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="relative z-10 flex items-center gap-2 text-xs font-mono text-zinc-400 mb-3">
                        <span>Available on:</span>
                        <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[11px] font-bold text-white">
                          5X
                        </span>
                      </div>

                      <div className="relative z-10 mb-4">
                        <div className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
                          {priceFormatted}
                        </div>
                      </div>

                      <div className="relative z-10 space-y-2 mt-auto">
                        <button
                          onClick={() => setBuyModalKit(kit)}
                          className={`w-full py-3.5 rounded-xl font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${theme.btnClass}`}
                        >
                          <MessageSquare className="w-4 h-4" /> BUY — {priceFormatted}
                        </button>
                        <button
                          onClick={() => setInspectKit(kit)}
                          className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect Kit Contents (30 slots)
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

      {/* Inspect Modal */}
      {inspectKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#0b0e15] border border-white/15 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden">
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: inspectKit.ColorHex || "#e62020" }}
            />
            <button
              onClick={() => setInspectKit(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-5 sm:p-7 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-xs font-mono text-zinc-400 uppercase mb-2">
                    <span>CATEGORY: {inspectKit.TabName || "GENERAL"}</span>
                    <span>•</span>
                    <span className="text-yellow-400">{inspectKit.LockType || "STANDARD"}</span>
                  </div>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase">
                    {inspectKit.Title}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-display font-black text-emerald-400">
                    {inspectKit.PriceText || `$${Number(inspectKit.Price).toFixed(2)}`}
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {inspectKit.CooldownHours
                      ? `${inspectKit.CooldownHours}h Cooldown`
                      : "Instant"}
                  </span>
                </div>
              </div>

              <div className="bg-[#06080d] p-4 sm:p-5 rounded-2xl border border-white/10 mb-5">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase mb-3">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-red-500" />
                    IN-GAME INVENTORY (6x5 SLOTS)
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {inspectKit.Items?.length || 0} / 30
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2 sm:gap-2.5 justify-items-center bg-[#090d16] p-3 sm:p-4 rounded-xl border border-white/5">
                  {Array.from({ length: 30 }).map((_, si) => (
                    <RustItemSlot key={si} item={inspectKit.Items?.[si]} />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setBuyModalKit(inspectKit);
                    setInspectKit(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-[#e62020] hover:bg-[#ff2b2b] text-white font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(230,32,32,0.4)] transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  BUY VIA DISCORD
                </button>
                <button
                  onClick={() => setInspectKit(null)}
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs uppercase"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buy Modal */}
      {buyModalKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0d1017] border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: buyModalKit.ColorHex || "#e62020" }}
            />
            <button
              onClick={() => setBuyModalKit(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-mono text-xs font-bold uppercase tracking-wider mb-4">
                <MessageSquare className="w-3.5 h-3.5" />
                DISCORD TICKET PURCHASE
              </div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase">
                    {buyModalKit.Title}
                  </h3>
                  <p className="text-zinc-400 text-xs font-mono mt-1">
                    Category: {buyModalKit.TabName || "GENERAL"} • Direct RCON Delivery
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-black text-emerald-400">
                    {buyModalKit.PriceText || `$${Number(buyModalKit.Price).toFixed(2)}`}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    30 Days Access
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#06080d] border border-white/10 mb-6">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
                  <span>YOUR STEAMID64:</span>
                  {user && (
                    <button
                      onClick={copySteamId}
                      className="text-emerald-400 hover:text-emerald-300 font-mono text-xs flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedSteamId ? "COPIED!" : "COPY"}
                    </button>
                  )}
                </div>
                {user ? (
                  <div className="flex items-center justify-between bg-white/[0.04] p-2.5 rounded-lg border border-white/5">
                    <span className="font-mono text-sm text-white font-bold">{user.steam_id}</span>
                    <span className="text-xs text-zinc-400">({user.steam_name})</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    <span className="font-mono text-xs text-amber-300">
                      Login with Steam to auto-fill your SteamID64.
                    </span>
                    <button
                      onClick={loginWithSteam}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-display font-bold text-xs rounded uppercase shrink-0 ml-2"
                    >
                      LOGIN
                    </button>
                  </div>
                )}
              </div>

              <a
                href={buyModalKit.CustomUrl || DISCORD_TICKET_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  if (user?.steam_id) copySteamId();
                }}
                className="w-full py-4 rounded-xl bg-[#e62020] hover:bg-[#ff2b2b] text-white font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(230,32,32,0.5)] transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                {buyModalKit.CustomUrl ? "BUY NOW ONLINE" : "OPEN DISCORD TICKET"}
              </a>
              <p className="text-center text-[11px] font-mono text-zinc-500 mt-3">
                Ticket: {DISCORD_TICKET_URL}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
export default StoreSection;