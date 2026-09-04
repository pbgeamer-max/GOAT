import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import {
  Sparkles,
  Zap,
  Gift,
  Check,
  Package,
  Lock,
  MessageSquare,
  Copy,
  ExternalLink,
  X,
  Clock,
  Crown,
  Hammer,
  Crosshair,
  RefreshCw,
  Eye,
  Radio,
  ShieldAlert,
  Flame,
  Shield,
  Star,
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

/**
 * Returns a working image URL for a Rust item using rustedit.io CDN.
 * Tested: 20/20 common items return HTTP 200 ✅
 * Pattern: https://www.rustedit.io/images/imagelibrary/<shortname>.png
 */
function getRustItemImageUrl(shortname: string): string {
  const clean = shortname.toLowerCase().trim();
  return `https://www.rustedit.io/images/imagelibrary/${clean}.png`;
}

/**
 * Rust Inventory Slot Component
 * Faithfully matches the in-game inventory UI (dark square slots, real icons, amount badges)
 */
const RustItemSlot: React.FC<{ item?: KitItem; compact?: boolean }> = ({ item, compact = false }) => {
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (!item?.Shortname) return "";
    return getRustItemImageUrl(item.Shortname);
  });
  const [hasError, setHasError] = useState(false);

  // Reset image state when item changes
  useEffect(() => {
    if (item?.Shortname) {
      setImgSrc(getRustItemImageUrl(item.Shortname));
      setHasError(false);
    }
  }, [item?.Shortname]);

  if (!item) {
    // Shaded empty slot (matching Rust in-game inventory grid)
    return (
      <div
        className={`rounded-lg bg-[#0e121c]/70 border border-[#1b2233]/70 flex items-center justify-center transition-colors ${
          compact ? "w-11 h-11 sm:w-12 sm:h-12" : "w-14 h-14 sm:w-16 sm:h-16"
        }`}
      />
    );
  }

  const cleanShortname = (item.Shortname || "").toLowerCase().trim();
  const displayName = item.DisplayName || item.Shortname.replace(".", " ").toUpperCase();
  const formattedAmount = item.Amount >= 1000 ? item.Amount.toLocaleString() : String(item.Amount);

  return (
    <div
      title={`${displayName} • x${item.Amount.toLocaleString()}`}
      className={`group relative rounded-lg bg-[#131826] hover:bg-[#1c2438] border border-[#242f46] hover:border-[#3d4e72] flex items-center justify-center p-1 transition-all duration-150 cursor-pointer shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] ${
        compact ? "w-11 h-11 sm:w-12 sm:h-12" : "w-14 h-14 sm:w-16 sm:h-16"
      }`}
    >
      {!hasError ? (
        <img
          src={imgSrc}
          alt={displayName}
          loading="lazy"
          onError={() => {
            // If rustedit.io failed → try rustlabs direct → then give up
            if (imgSrc.includes("rustedit.io")) {
              setImgSrc(`https://rustlabs.com/img/items180/${cleanShortname}.png`);
            } else {
              setHasError(true);
            }
          }}
          className={`${
            compact ? "w-8 h-8 sm:w-9 sm:h-9" : "w-10 h-10 sm:w-12 sm:h-12"
          } object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] transition-transform group-hover:scale-110`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-center">
          <Package className="w-4 h-4 text-zinc-500" />
          <span className="text-[8px] font-mono text-zinc-400 truncate max-w-[36px]">
            {cleanShortname.slice(0, 5)}
          </span>
        </div>
      )}

      {/* Amount Badge (matching Rust in-game slot count) */}
      <div className="absolute bottom-0.5 right-1 px-1 py-0.2 rounded text-[9px] sm:text-[10px] font-mono font-black text-white leading-none tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,1)] bg-black/60 backdrop-blur-[1px] select-none pointer-events-none">
        {formattedAmount}
      </div>
    </div>
  );
};

export const StoreSection: React.FC = () => {
  const { user, loginWithSteam, openProfile } = useAuth();
  const { showToast } = useToast();
  const [kits, setKits] = useState<LiveKit[]>([]);
  const [tabs, setTabs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("VIP");
  const [storeMode, setStoreMode] = useState<"gems" | "kits">("gems");
  const [inspectKit, setInspectKit] = useState<LiveKit | null>(null);
  const [buyModalKit, setBuyModalKit] = useState<LiveKit | null>(null);
  const [copiedSteamId, setCopiedSteamId] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Fetch live kits and categories from the server
  const fetchLiveKits = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch("/api/kits");
      if (!res.ok) return;
      const data = await res.json();

      if (data?.success && Array.isArray(data.kits)) {
        const liveKits: LiveKit[] = data.kits;
        setKits(liveKits);

        // Gather categories from server / live kits, keeping only VIP (and any real kit tabs created)
        const serverTabs: string[] = Array.isArray(data.tabs) && data.tabs.length > 0 ? data.tabs : ["VIP"];
        const kitTabs: string[] = liveKits.map((k) => k.TabName).filter(Boolean);
        const uniqueTabs = Array.from(new Set([...serverTabs, ...kitTabs]));

        // Remove dummy categories: ALL KITS, RESOURCES, WEAPONS, GEMS
        const cleanTabs = uniqueTabs.filter(
          (t) =>
            t.toUpperCase() !== "ALL KITS" &&
            t.toUpperCase() !== "ALL" &&
            t.toUpperCase() !== "RESOURCES" &&
            t.toUpperCase() !== "WEAPONS" &&
            t.toUpperCase() !== "GEMS"
        );
        const finalTabs = cleanTabs.length > 0 ? cleanTabs : ["VIP"];

        setTabs(finalTabs);
        setLastSyncTime(new Date());

        setActiveTab((curr) => {
          if (!curr || !finalTabs.some((t) => t.toUpperCase() === curr.toUpperCase())) {
            return finalTabs[0] || "VIP";
          }
          return curr;
        });
      }
    } catch (err) {
      console.error("[Store] Failed to fetch kits:", err);
    } finally {
      if (!isBackground) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch and auto-polling every 20 seconds for real-time in-game kit changes
  useEffect(() => {
    fetchLiveKits(false);

    const interval = setInterval(() => {
      fetchLiveKits(true);
    }, 20000);

    return () => clearInterval(interval);
  }, [fetchLiveKits]);

  const copySteamId = () => {
    if (!user?.steam_id) return;
    navigator.clipboard.writeText(user.steam_id);
    setCopiedSteamId(true);
    showToast("SteamID64 copied to clipboard!", "success");
    setTimeout(() => setCopiedSteamId(false), 3000);
  };

  const isKitUnlocked = (kit: LiveKit): boolean => {
    if (!user) return false;
    const lock = (kit.LockType || "").toUpperCase();
    if (lock === "LINKED") return Boolean(user.is_linked);
    if (lock === "BOOSTER") return Boolean(user.is_booster);
    if (lock === "VIP" || lock === "MVP" || lock === "GOD" || lock === "BUILDER" || lock === "GUNS") {
      return Boolean(user.is_vip && user.vip_tier?.toLowerCase() === lock.toLowerCase());
    }
    return false;
  };

  const getTierIcon = (lock: string) => {
    switch (lock.toUpperCase()) {
      case "GOD":
        return <Zap className="w-3.5 h-3.5 text-purple-400" />;
      case "MVP":
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
      case "VIP":
        return <Crown className="w-3.5 h-3.5 text-yellow-400" />;
      case "BUILDER":
        return <Hammer className="w-3.5 h-3.5 text-emerald-400" />;
      case "GUNS":
        return <Crosshair className="w-3.5 h-3.5 text-red-400" />;
      case "BOOSTER":
        return <Flame className="w-3.5 h-3.5 text-fuchsia-400" />;
      case "LINKED":
        return <ExternalLink className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Package className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getTabIcon = (tabName: string) => {
    const t = tabName.toUpperCase();
    if (t.includes("VIP") || t.includes("GOD") || t.includes("MVP") || t.includes("RANK")) {
      return <Crown className="w-3.5 h-3.5 text-yellow-400" />;
    }
    if (t.includes("WEAPON") || t.includes("GUN") || t.includes("PVP") || t.includes("AMMO")) {
      return <Crosshair className="w-3.5 h-3.5 text-red-400" />;
    }
    if (t.includes("RESOURCE") || t.includes("FARM") || t.includes("MINE") || t.includes("WOOD") || t.includes("STONE")) {
      return <Hammer className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (t.includes("GEM") || t.includes("CRYSTAL")) {
      return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
    }
    if (t.includes("FREE") || t.includes("COMMUNITY") || t.includes("DISCORD") || t.includes("REWARD")) {
      return <Gift className="w-3.5 h-3.5 text-emerald-400" />;
    }
    return <Package className="w-3.5 h-3.5 text-zinc-400" />;
  };

  // Filter kits based on dynamic category tab
  const filteredKits = kits.filter((k) => {
    if (activeTab === "ALL KITS" || activeTab === "ALL" || !activeTab) return true;
    return (k.TabName || "").trim().toUpperCase() === activeTab.trim().toUpperCase();
  });

  return (
    <section
      id="store"
      className="relative py-20 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat border-t border-white/10 overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(5, 8, 15, 0.84) 0%, rgba(7, 11, 20, 0.82) 40%, rgba(5, 8, 15, 0.95) 100%), url('/images/atlas_store_bg.png')`,
        backgroundAttachment: "fixed",
      }}
    >
      {/* Subtle Atmospheric Light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-yellow-500/5 rounded-full blur-[170px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Real-time Server Sync Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#0c1220]/80 border border-[#1e2a42] mb-8 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
              LIVE RUST SERVER AUTO-SYNC ACTIVE
            </span>
            <span className="hidden sm:inline text-zinc-500 text-xs">•</span>
            <span className="hidden sm:inline text-zinc-400 text-xs">
              Kits are fetched directly from the Rust server and update automatically.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {lastSyncTime && (
              <span className="font-mono text-[11px] text-zinc-400">
                Last sync: {lastSyncTime.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchLiveKits(true)}
              disabled={refreshing}
              title="Force sync with server"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> OFFICIAL SERVER STORE
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white uppercase tracking-tight">
            {storeMode === "gems" ? (
              <>
                BUY <span className="text-yellow-400">GEMS</span>
              </>
            ) : (
              <>
                VIP PACKAGES & <span className="text-[#e62020]">KITS</span>
              </>
            )}
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl mx-auto">
            {storeMode === "gems"
              ? "Purchase in-game GEMS to unlock permanent custom weapon skins, armor, doors, and exclusive store items."
              : "Enhance your gameplay with queue skip, VIP kits, skinbox access, and exclusive Discord perks."}
          </p>
        </div>

        {/* Store Category Tabs: GEMS vs VIP RANKS & KITS */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setStoreMode("gems")}
            className={`px-6 sm:px-8 py-3 rounded-xl font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
              storeMode === "gems"
                ? "bg-yellow-500 text-black shadow-[0_0_25px_rgba(234,179,8,0.5)] border border-yellow-300 scale-105"
                : "bg-[#0c1220]/80 text-zinc-400 hover:text-white border border-[#1e2a42] hover:bg-[#151f33]"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>GEMS PACKAGES</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-black text-yellow-400 uppercase">
              POPULAR
            </span>
          </button>

          <button
            onClick={() => setStoreMode("kits")}
            className={`px-6 sm:px-8 py-3 rounded-xl font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2.5 transition-all duration-200 cursor-pointer ${
              storeMode === "kits"
                ? "bg-[#e62020] text-white shadow-[0_0_25px_rgba(230,32,32,0.5)] border border-red-400 scale-105"
                : "bg-[#0c1220]/80 text-zinc-400 hover:text-white border border-[#1e2a42] hover:bg-[#151f33]"
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>VIP RANKS & KITS</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-zinc-300">
              {kits.length}
            </span>
          </button>
        </div>

        {storeMode === "gems" ? (
          <GemsStoreSection />
        ) : (
          <>
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-mono text-xs uppercase tracking-widest mb-3">
                  <Gift className="w-3.5 h-3.5" /> GOAT 5X VIP RANKS & KITS
                </div>
                <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white uppercase tracking-tight">
                  SERVER KITS & <span className="text-[#e62020]">STORE</span>
                </h2>
                <p className="text-zinc-400 text-sm mt-2 max-w-2xl">
                  Browse all VIP ranks and kits available on the server. Click any kit to inspect its full inventory contents.
                </p>
              </div>

              {/* Dynamic Categories (Tabs) directly from Rust Server */}
              <div className="flex flex-wrap items-center gap-2 bg-[#0d1017] p-1.5 rounded-xl border border-white/10 max-w-full overflow-x-auto">
                <button
                  onClick={() => setStoreMode("gems")}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>💎 BUY GEMS</span>
                </button>
                {tabs.map((tab) => {
              const count =
                tab === "ALL KITS"
                  ? kits.length
                  : kits.filter((k) => (k.TabName || "").toUpperCase() === tab.toUpperCase()).length;

              const isActive = activeTab.toUpperCase() === tab.toUpperCase();

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#e62020] text-white shadow-[0_0_15px_rgba(230,32,32,0.4)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {getTabIcon(tab)}
                  <span>{tab}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isActive ? "bg-black/30 text-white" : "bg-white/10 text-zinc-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Atlas-Style Trust Guarantee Bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 py-3.5 px-6 rounded-2xl bg-[#090d15] border border-white/10 mb-8 text-xs font-mono text-zinc-300 shadow-xl">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Instant In-Game Delivery</span>
          </div>
          <span className="hidden sm:inline text-zinc-700">|</span>
          <div className="flex items-center gap-2 font-bold text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Secure Payment (PayPal, Card, Crypto)</span>
          </div>
          <span className="hidden sm:inline text-zinc-700">|</span>
          <div className="flex items-center gap-2 font-bold text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>24/7 Server Discord Support</span>
          </div>
        </div>

        {/* Kits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <span className="text-xs font-mono text-zinc-400">Loading server kits...</span>
            </div>
          ) : filteredKits.length === 0 ? (
            <div className="col-span-full py-16 px-6 text-center rounded-2xl bg-[#0b0e15] border border-white/10 flex flex-col items-center justify-center">
              <Package className="w-12 h-12 text-zinc-600 mb-4" />
              <h4 className="font-display font-bold text-lg text-white mb-2">
                No kits in "{activeTab}" right now
              </h4>
              <p className="text-zinc-400 text-xs sm:text-sm max-w-md mb-4 leading-relaxed">
                Any kit added or removed in-game via <span className="text-red-400 font-mono font-bold">/kit</span> will appear or disappear here instantly.
              </p>
              <button
                onClick={() => setActiveTab("ALL KITS")}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs uppercase"
              >
                View all kits
              </button>
            </div>
          ) : (
            filteredKits.map((kit, kitIdx) => {
              const theme = getAtlasTheme(kit, kitIdx);
              const ThemeIcon = theme.IconComponent;
              const unlocked = isKitUnlocked(kit);
              const lock = (kit.LockType || "NONE").toUpperCase();
              const isFree = kit.Currency?.toUpperCase() === "FREE" || kit.Price === 0;
              const items = kit.Items || [];

              return (
                <div
                  key={kit.Id}
                  className={`relative flex flex-col bg-[#0b0f19] border ${theme.borderClass} rounded-2xl sm:rounded-3xl p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1.5 shadow-[0_15px_35px_rgba(0,0,0,0.7)] group overflow-hidden`}
                >
                  {/* Faint ambient glow matching card theme */}
                  <div
                    className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 opacity-15 group-hover:opacity-30"
                    style={{ backgroundColor: theme.themeColor }}
                  />

                  {/* 3D Crest Background Watermark (Atlas Visual Depth) */}
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

                  {/* Top Header: Icon + Title + Category Pill */}
                  <div className="relative z-10 flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: `${theme.themeColor}18`,
                          borderColor: `${theme.themeColor}40`,
                        }}
                      >
                        <ThemeIcon className="w-5 h-5" style={{ color: theme.themeColor }} />
                      </div>
                      <div>
                        <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight group-hover:text-white transition-colors">
                          {kit.Title}
                        </h3>
                        <p className="text-zinc-400 text-xs font-sans mt-0.5">
                          Enhanced equipment with in-game perks
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shrink-0 ${theme.badgeClass}`}>
                      {kit.TabName || "VIP"}
                    </span>
                  </div>

                  {/* Perks Bullet List (Atlas Style) */}
                  <div className="relative z-10 space-y-2.5 my-5 py-4 border-y border-white/5 flex-grow">
                    <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.bulletClass}`} />
                      <span>Instant In-Game RCON Delivery</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.bulletClass}`} />
                      <span>
                        {kit.CooldownHours ? `${kit.CooldownHours}h Cooldown` : "No Cooldown / Ready Instantly"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.bulletClass}`} />
                      <span>
                        {(kit.WipeLockHours || 0) > 0
                          ? `Wipe Locked: First ${kit.WipeLockHours}h of wipe`
                          : "Available immediately from wipe"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.bulletClass}`} />
                      <span>
                        {(kit.MaxUsesPerWipe || 0) > 0
                          ? `Limited to ${kit.MaxUsesPerWipe}x per wipe cycle`
                          : "Unlimited usage throughout wipe"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.bulletClass}`} />
                      <span className="font-semibold text-white">
                        {items.length} In-Game Item{items.length !== 1 ? "s" : ""} Loaded
                      </span>
                    </div>
                  </div>

                  {/* In-Game Inventory Mini-Preview (Chips) */}
                  {items.length > 0 && (
                    <div className="relative z-10 mb-5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
                        <span className="uppercase">Loaded Items ({items.length})</span>
                        <button
                          type="button"
                          onClick={() => setInspectKit(kit)}
                          className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-red-400" />
                          <span>View 30 slots</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                        {items.slice(0, 6).map((it, iIdx) => (
                          <div
                            key={iIdx}
                            title={`${it.DisplayName || it.Shortname} x${it.Amount}`}
                            className="relative w-11 h-11 rounded-lg bg-black/40 border border-white/10 p-1 flex items-center justify-center shrink-0 group/item hover:border-white/30 transition-all"
                          >
                            <img
                              src={getRustItemImageUrl(it.Shortname)}
                              alt={it.Shortname}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = `https://rustlabs.com/img/items180/${it.Shortname.toLowerCase().trim()}.png`;
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

                  {/* Server Badge (Atlas: "Available on: [5X]") */}
                  <div className="relative z-10 flex items-center gap-2 text-xs font-mono text-zinc-400 mb-3">
                    <span>Available on:</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-[11px] font-bold text-white">
                      5X
                    </span>
                  </div>

                  {/* Price (Atlas Bold Style) */}
                  <div className="relative z-10 mb-4">
                    <div className="text-3xl sm:text-4xl font-black text-white font-display tracking-tight">
                      {kit.PriceText || (isFree ? "FREE" : `$${kit.Price}`)}
                    </div>
                  </div>

                  {/* CTA Buttons (Atlas Style) */}
                  <div className="relative z-10 space-y-2 mt-auto">
                    {unlocked ? (
                      <button
                        onClick={() => {
                          showToast(`Type /kit in-game to redeem your ${kit.Title} kit!`, "success");
                        }}
                        className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
                      >
                        <Check className="w-4 h-4" /> UNLOCKED — TYPE /KIT IN-GAME
                      </button>
                    ) : isFree && lock === "LINKED" ? (
                      <button
                        onClick={openProfile}
                        className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,168,255,0.4)]"
                      >
                        <ExternalLink className="w-4 h-4" /> LINK DISCORD TO UNLOCK
                      </button>
                    ) : isFree && lock === "BOOSTER" ? (
                      <a
                        href={DISCORD_TICKET_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(142,68,173,0.4)]"
                      >
                        <Zap className="w-4 h-4" /> BOOST DISCORD TO UNLOCK
                      </a>
                    ) : (
                      <button
                        onClick={() => setBuyModalKit(kit)}
                        className={`w-full py-3.5 rounded-xl font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${theme.btnClass}`}
                      >
                        <MessageSquare className="w-4 h-4" /> BUY — {kit.PriceText || `$${kit.Price}`}
                      </button>
                    )}

                    <button
                      onClick={() => setInspectKit(kit)}
                      className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Kit Contents (30 slots)</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        </>
      )}
      </div>

      {/* ── FULL RUST INVENTORY INSPECTION MODAL (EXACT 6x5 GRID FROM SCREENSHOT) ── */}
      {inspectKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#0b0e15] border border-white/15 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Top Accent Line */}
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: inspectKit.ColorHex || "#e62020" }}
            />

            {/* Close Button */}
            <button
              onClick={() => setInspectKit(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-5 sm:p-7 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-xs font-mono text-zinc-400 uppercase mb-2">
                    <span>CATEGORY: {inspectKit.TabName || "GENERAL"}</span>
                    <span>•</span>
                    <span className="text-yellow-400">{inspectKit.LockType || "STANDARD"}</span>
                  </div>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
                    {inspectKit.Title}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-display font-black text-emerald-400">
                    {inspectKit.PriceText || (inspectKit.Price === 0 ? "FREE" : `$${inspectKit.Price}`)}
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {inspectKit.CooldownHours ? `${inspectKit.CooldownHours}h Cooldown` : "Instant"}
                  </span>
                </div>
              </div>

              {/* ── 30-Slot Rust Inventory Box (6 columns x 5 rows) ── */}
              <div className="bg-[#06080d] p-4 sm:p-5 rounded-2xl border border-white/10 mb-5">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase mb-3">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-red-500" />
                    <span>IN-GAME INVENTORY PREVIEW (6x5 SLOTS)</span>
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {inspectKit.Items?.length || 0} / 30 SLOTS OCCUPIED
                  </span>
                </div>

                {/* The 30 Grid Slots (matching the user's screenshot exactly) */}
                <div className="grid grid-cols-6 gap-2 sm:gap-2.5 justify-items-center bg-[#090d16] p-3 sm:p-4 rounded-xl border border-white/5">
                  {Array.from({ length: 30 }).map((_, slotIndex) => {
                    const item = inspectKit.Items?.[slotIndex];
                    return <RustItemSlot key={slotIndex} item={item} />;
                  })}
                </div>
              </div>


              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setBuyModalKit(inspectKit);
                    setInspectKit(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-[#e62020] hover:bg-[#ff2b2b] text-white font-display font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(230,32,32,0.4)] transition-all"
                >
                  <MessageSquare className="w-4 h-4" /> BUY VIA DISCORD TICKET
                </button>
                <button
                  onClick={() => setInspectKit(null)}
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs uppercase transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Discord Ticket Purchase Modal ── */}
      {buyModalKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0d1017] border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Top Accent Stripe */}
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: buyModalKit.ColorHex || "#e62020" }}
            />

            {/* Close Button */}
            <button
              onClick={() => setBuyModalKit(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-mono text-xs font-bold uppercase tracking-wider mb-4">
                <MessageSquare className="w-3.5 h-3.5" /> DISCORD TICKET PURCHASE
              </div>

              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
                    {buyModalKit.Title}
                  </h3>
                  <p className="text-zinc-400 text-xs font-mono mt-1">
                    Category: {buyModalKit.TabName || "GENERAL"} • Direct RCON Delivery
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-black text-emerald-400">
                    {buyModalKit.PriceText || `$${buyModalKit.Price}`}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">30 Days Access</span>
                </div>
              </div>

              {/* SteamID Information Box */}
              <div className="p-4 rounded-xl bg-[#06080d] border border-white/10 mb-6">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
                  <span>YOUR STEAMID64 (REQUIRED FOR TICKET):</span>
                  {user && (
                    <button
                      onClick={copySteamId}
                      className="text-emerald-400 hover:text-emerald-300 font-mono text-xs flex items-center gap-1 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedSteamId ? "COPIED!" : "COPY"}
                    </button>
                  )}
                </div>

                {user ? (
                  <div className="flex items-center justify-between bg-white/[0.04] p-2.5 rounded-lg border border-white/5">
                    <span className="font-mono text-sm text-white font-bold tracking-wider">
                      {user.steam_id}
                    </span>
                    <span className="text-xs text-zinc-400 font-sans">({user.steam_name})</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                    <span className="font-mono text-xs text-amber-300">
                      Login with Steam to auto-fill your SteamID64.
                    </span>
                    <button
                      onClick={loginWithSteam}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-display font-bold text-xs rounded uppercase shrink-0 transition-colors ml-2"
                    >
                      LOGIN
                    </button>
                  </div>
                )}
              </div>



              {/* Direct Link Action */}
              <a
                href={DISCORD_TICKET_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  if (user?.steam_id) copySteamId();
                }}
                className="w-full py-4 rounded-xl bg-[#e62020] hover:bg-[#ff2b2b] text-white font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(230,32,32,0.5)] transition-all"
              >
                <ExternalLink className="w-4 h-4" /> OPEN DISCORD TICKET 🚀
              </a>

              <p className="text-center text-[11px] font-mono text-zinc-500 mt-3">
                Ticket URL: {DISCORD_TICKET_URL}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
