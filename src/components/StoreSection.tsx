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
} from "lucide-react";

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

const DISCORD_TICKET_URL = "https://discord.gg/7uRsxfknSG";

/**
 * Maps Rust item shortnames to their correct Wikia image filenames.
 * Wikia CDN (static.wikia.nocookie.net/play-rust) returns 200 ✅.
 */
const RUST_WIKIA_BASE = "https://static.wikia.nocookie.net/play-rust/images";

// Map: shortname → { path, file } – only entries where filename differs from the pattern
const WIKIA_OVERRIDES: Record<string, string> = {
  // Weapons
  "rifle.ak":              "0/0b/Assault_Rifle_icon.png",
  "rifle.bolt":            "1/14/Bolt_Action_Rifle_icon.png",
  "rifle.l96":             "1/12/L96_Rifle_icon.png",
  "rifle.lr300":           "8/8e/LR-300_Assault_Rifle_icon.png",
  "rifle.semiauto":        "9/9a/Semi-Automatic_Rifle_icon.png",
  "lmg.m249":              "b/b1/M249_icon.png",
  "smg.thompson":          "3/33/Thompson_icon.png",
  "smg.mp5":               "f/f3/MP5A4_icon.png",
  "smg.2":                 "b/b3/Custom_SMG_icon.png",
  "rocket.launcher":       "a/a1/Rocket_Launcher_icon.png",
  "pistol.revolver":       "f/f1/Revolver_icon.png",
  "pistol.semiauto":       "b/b0/Semi-Automatic_Pistol_icon.png",
  "pistol.python":         "b/bf/Python_Revolver_icon.png",
  "pistol.m92":            "b/b2/M92_Pistol_icon.png",
  "bow.hunting":           "8/87/Hunting_Bow_icon.png",
  "bow.compound":          "c/c4/Compound_Bow_icon.png",
  "crossbow":              "f/fc/Crossbow_icon.png",
  "shotgun.pump":          "b/b2/Pump_Shotgun_icon.png",
  "shotgun.double":        "f/fd/Double_Barrel_Shotgun_icon.png",
  "shotgun.spas12":        "1/1e/SPAS-12_Shotgun_icon.png",
  "multiplegrenadelauncher": "c/c5/Multiple_Grenade_Launcher_icon.png",
  "explosive.timed":       "4/4c/Timed_Explosive_Charge_icon.png",
  "explosive.satchel":     "6/6f/Satchel_Charge_icon.png",
  "ammo.rocket.basic":     "1/10/Rocket_icon.png",
  "ammo.rocket.hv":        "4/48/High_Velocity_Rocket_icon.png",
  "ammo.rocket.incendiary":"a/af/Incendiary_Rocket_icon.png",
  "ammo.rifle":            "2/29/5.56_Rifle_Ammo_icon.png",
  "ammo.rifle.hv":         "2/2a/HV_5.56_Rifle_Ammo_icon.png",
  "ammo.rifle.incendiary": "5/5d/Incendiary_5.56_Rifle_Ammo_icon.png",
  "ammo.pistol":           "0/07/Pistol_Bullet_icon.png",
  "ammo.pistol.hv":        "d/d5/HV_Pistol_Ammo_icon.png",
  "ammo.pistol.fire":      "5/5b/Incendiary_Pistol_Bullet_icon.png",
  "ammo.shotgun":          "3/33/12_Gauge_Buckshot_icon.png",
  "ammo.shotgun.slug":     "4/4c/12_Gauge_Slug_icon.png",
  "arrow.wooden":          "a/a1/Wooden_Arrow_icon.png",
  "arrow.hv":              "1/13/High_Velocity_Arrow_icon.png",
  "arrow.fire":            "f/f2/Fire_Arrow_icon.png",
  // Armor
  "metal.facemask":        "1/17/Metal_Facemask_icon.png",
  "metal.plate.torso":     "5/50/Metal_Chest_Plate_icon.png",
  "roadsign.jacket":       "1/13/Road_Sign_Jacket_icon.png",
  "roadsign.kilt":         "7/77/Road_Sign_Kilt_icon.png",
  "roadsign.gloves":       "a/a9/Road_Sign_Gloves_icon.png",
  "coffeecan.helmet":      "5/52/Coffee_Can_Helmet_icon.png",
  "tactical.gloves":       "4/43/Tactical_Gloves_icon.png",
  "shoes.boots":           "8/88/Boots_icon.png",
  "hoodie":                "c/c4/Hoodie_icon.png",
  "pants":                 "7/7b/Pants_icon.png",
  "hazmatsuit":            "3/31/Hazmat_Suit_icon.png",
  "bone.armor.suit":       "7/71/Bone_Armor_icon.png",
  "deer.skull.mask":       "d/d9/Bone_Helmet_icon.png",
  // Medical
  "syringe.medical":       "7/73/Medical_Syringe_icon.png",
  "largemedkit":           "1/1a/Large_Medkit_icon.png",
  "bandage":               "9/9a/Bandage_icon.png",
  "blueberries":           "7/7b/Blueberries_icon.png",
  // Resources
  "wood":                  "1/17/Wood_icon.png",
  "stones":                "1/1f/Stones_icon.png",
  "metal.fragments":       "e/ef/Metal_Fragments_icon.png",
  "metal.ore":             "3/3c/Metal_Ore_icon.png",
  "metal.refined":         "8/8c/High_Quality_Metal_icon.png",
  "sulfur":                "0/00/Sulfur_icon.png",
  "sulfur.ore":            "2/23/Sulfur_Ore_icon.png",
  "charcoal":              "5/5c/Charcoal_icon.png",
  "gunpowder":             "8/8e/Gun_Powder_icon.png",
  "lowgradefuel":          "6/60/Low_Grade_Fuel_icon.png",
  "cloth":                 "a/a8/Cloth_icon.png",
  "leather":               "f/f6/Leather_icon.png",
  "scrap":                 "0/01/Scrap_icon.png",
  "crude.oil":             "9/9b/Crude_Oil_icon.png",
  "rope":                  "a/ad/Rope_icon.png",
  // Components
  "riflebody":             "c/c1/Rifle_Body_icon.png",
  "smgbody":               "b/bb/SMG_Body_icon.png",
  "semibody":              "b/bf/Semi_Automatic_Body_icon.png",
  "metalspring":           "9/9f/Metal_Spring_icon.png",
  "techparts":             "e/ef/Tech_Trash_icon.png",
  "metalpipe":             "1/1f/Metal_Pipe_icon.png",
  "gears":                 "2/25/Gears_icon.png",
  "roadsigns":             "e/e4/Road_Signs_icon.png",
  "sewingkit":             "e/ee/Sewing_Kit_icon.png",
  // Building
  "building.planner":      "d/dd/Building_Plan_icon.png",
  "hammer":                "6/60/Building_Hammer_icon.png",
  "door.hinged.metal":     "d/da/Sheet_Metal_Door_icon.png",
  "door.hinged.armored":   "7/7c/Armoured_Door_icon.png",
  "wall.frame.garagedoor": "9/9c/Garage_Door_icon.png",
  "cupboard.tool":         "a/a4/Tool_Cupboard_icon.png",
  "box.wooden.large":      "3/39/Large_Wood_Box_icon.png",
  "autoturret":            "e/e6/Auto_Turret_icon.png",
  "lock.code":             "0/02/Code_Lock_icon.png",
  // Misc
  "supply.signal":         "3/3f/Supply_Signal_icon.png",
  "keycard_green":         "e/e4/Green_Keycard_icon.png",
  "keycard_blue":          "b/b0/Blue_Keycard_icon.png",
  "keycard_red":           "5/54/Red_Keycard_icon.png",
  "sleepingbag":           "4/44/Sleeping_Bag_icon.png",
  "bed":                   "3/35/Bed_icon.png",
  "pookie.bear":           "8/83/Pookie_Bear_icon.png",
  "workbench3":            "4/4c/Work_Bench_Level_3_icon.png",
  "workbench2":            "0/00/Work_Bench_Level_2_icon.png",
  "workbench1":            "c/c0/Work_Bench_Level_1_icon.png",
  "barricade.wood.cover":  "3/35/Wooden_Barricade_Cover_icon.png",
  "knife.bone":            "1/1a/Bone_Knife_icon.png",
  "pumpkin":               "0/01/Pumpkin_icon.png",
  // Gems category items
  "chainsaw":              "a/ab/Chainsaw_icon.png",
  "jackhammer":            "0/06/Jackhammer_icon.png",
  "supertea":              "e/ec/Super_Serum_icon.png",
  "generator.wind.scrap":  "5/54/Wind_Turbine_icon.png",
  "cctv.camera":           "0/03/CCTV_Camera_icon.png",
  "targeting.computer":    "9/9e/Targeting_Computer_icon.png",
  "electric.battery.rechargable.large": "c/c3/Large_Rechargeable_Battery_icon.png",
  // Weapon mods
  "weapon.mod.8x.scope":   "2/22/8x_Zoom_Scope_icon.png",
  "weapon.mod.silencer":   "8/86/Silencer_icon.png",
  "weapon.mod.holosight":  "8/8b/Holosight_icon.png",
  "weapon.mod.flashlight": "1/18/Flashlight_icon.png",
};

/**
 * Returns a working Wikia CDN image URL for a given Rust item shortname.
 * Falls back to a generic path if no override is mapped.
 */
function getRustItemImageUrl(shortname: string): string {
  const clean = shortname.toLowerCase().trim();
  if (WIKIA_OVERRIDES[clean]) {
    return `${RUST_WIKIA_BASE}/${WIKIA_OVERRIDES[clean]}/revision/latest/scale-to-width-down/64`;
  }
  // Fallback: try rustlabs direct (no redirect) as secondary
  return `https://rustlabs.com/img/items180/${clean}.png`;
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
            // If Wikia failed → try rustlabs direct → then give up
            if (imgSrc.includes("wikia") || imgSrc.includes("wikia.nocookie")) {
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
  const [activeTab, setActiveTab] = useState<string>("ALL KITS");
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

        // Gather categories: prioritize server tabs list, and include any tabs found on kits
        const serverTabs: string[] = Array.isArray(data.tabs) && data.tabs.length > 0 ? data.tabs : [];
        const kitTabs: string[] = liveKits.map((k) => k.TabName).filter(Boolean);
        const uniqueTabs = Array.from(new Set([...serverTabs, ...kitTabs]));

        // Ensure "ALL KITS" is the first tab
        const hasAll = uniqueTabs.some((t) => t.toUpperCase() === "ALL KITS" || t.toUpperCase() === "ALL");
        const cleanTabs = uniqueTabs.filter((t) => t.toUpperCase() !== "ALL KITS" && t.toUpperCase() !== "ALL");
        const finalTabs = ["ALL KITS", ...cleanTabs];

        setTabs(finalTabs);
        setLastSyncTime(new Date());

        setActiveTab((curr) => {
          if (!curr || !finalTabs.some((t) => t.toUpperCase() === curr.toUpperCase())) {
            return "ALL KITS";
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
    <section id="store" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-[#07090e] border-t border-white/10">
      {/* Tactical Grid Background */}
      <div className="absolute inset-0 bg-tactical-grid opacity-15 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-red-600/5 rounded-full blur-[170px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Real-time Server Sync Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#0c1017] border border-white/10 mb-8">
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
              الكيتات والرتب مأخوذة مباشرة من سيرفر راست وتتحدث تلقائياً فور إضافتها أو حذفها
            </span>
          </div>

          <div className="flex items-center gap-2">
            {lastSyncTime && (
              <span className="font-mono text-[11px] text-zinc-400">
                آخر تحديث: {lastSyncTime.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchLiveKits(true)}
              disabled={refreshing}
              title="مزامنة فورية مع السيرفر"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>

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
              تصفح كيتات السيرفر ومواردها بدقة، مع استعراض كامل للأسلحة والمواد المتوفرة داخل كل كيت.
            </p>
          </div>

          {/* Dynamic Categories (Tabs) directly from Rust Server */}
          <div className="flex flex-wrap items-center gap-2 bg-[#0d1017] p-1.5 rounded-xl border border-white/10 max-w-full overflow-x-auto">
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

        {/* Kits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <span className="text-xs font-mono text-zinc-400">جاري تحميل كيتات السيرفر والموارد...</span>
            </div>
          ) : filteredKits.length === 0 ? (
            <div className="col-span-full py-16 px-6 text-center rounded-2xl bg-[#0b0e15] border border-white/10 flex flex-col items-center justify-center">
              <Package className="w-12 h-12 text-zinc-600 mb-4" />
              <h4 className="font-display font-bold text-lg text-white mb-2">
                لا توجد كيتات في قسم "{activeTab}" حالياً
              </h4>
              <p className="text-zinc-400 text-xs sm:text-sm max-w-md mb-4 leading-relaxed">
                أي كيت تضيفه أو تحذفه داخل سيرفر راست عبر أمر <span className="text-red-400 font-mono font-bold">/kit</span> يظهر أو يختفي من هنا فوراً وبشكل تلقائي.
              </p>
              <button
                onClick={() => setActiveTab("ALL KITS")}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs uppercase"
              >
                عرض كل الكيتات
              </button>
            </div>
          ) : (
            filteredKits.map((kit) => {
              const unlocked = isKitUnlocked(kit);
              const lock = (kit.LockType || "NONE").toUpperCase();
              const isFree = kit.Currency?.toUpperCase() === "FREE" || kit.Price === 0;
              const items = kit.Items || [];

              // Up to 12 slots for card preview (6 slots x 2 rows)
              const previewSlotsCount = 12;
              const previewSlots: (KitItem | undefined)[] = [];
              for (let i = 0; i < previewSlotsCount; i++) {
                previewSlots.push(items[i]);
              }

              return (
                <div
                  key={kit.Id}
                  className="relative flex flex-col bg-[#0b0e15] border border-white/10 hover:border-white/25 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,0,0,0.6)] group overflow-hidden"
                >
                  {/* Top Accent Line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: kit.ColorHex || "#e62020" }}
                  />

                  {/* Header: Category Badge & Tier */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        {kit.TabName || "GENERAL"}
                      </span>

                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border border-white/10"
                        style={{
                          backgroundColor: `${kit.ColorHex || "#e62020"}22`,
                          color: kit.ColorHex || "#fff",
                        }}
                      >
                        {getTierIcon(lock)}
                        {lock === "NONE" ? "STANDARD" : lock}
                      </span>
                    </div>

                    {/* Cooldown or ready badge */}
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-400">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {kit.CooldownHours ? `${kit.CooldownHours}h CD` : "Ready"}
                    </span>
                  </div>

                  {/* Title & Price */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-display font-black text-xl text-white uppercase tracking-tight group-hover:text-red-400 transition-colors">
                      {kit.Title}
                    </h3>
                    <span className="shrink-0 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-black text-xs">
                      {kit.PriceText || (isFree ? "FREE" : `$${kit.Price}`)}
                    </span>
                  </div>

                  {/* Limitations badges (WipeLock & MaxUses) */}
                  {(kit.WipeLockHours || 0) > 0 || (kit.MaxUsesPerWipe || 0) > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {(kit.WipeLockHours || 0) > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-mono flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Wipe Lock: {kit.WipeLockHours}h
                        </span>
                      )}
                      {(kit.MaxUsesPerWipe || 0) > 0 && (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-[10px] font-mono flex items-center gap-1">
                          <Crosshair className="w-2.5 h-2.5" /> Max: {kit.MaxUsesPerWipe}x / Wipe
                        </span>
                      )}
                    </div>
                  ) : null}

                  {/* ── Real Rust Inventory Grid Slots (6 columns x 2 rows) ── */}
                  <div className="bg-[#07090e] rounded-xl p-3 border border-white/5 mb-4 flex-grow">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-2.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-zinc-400" /> INVENTORY CONTENTS
                      </span>
                      <span className="text-zinc-500 font-mono">{items.length} items</span>
                    </div>

                    {/* 6 Columns Grid (Identical to in-game Rust slots) */}
                    <div className="grid grid-cols-6 gap-1.5 justify-items-center">
                      {previewSlots.map((slotItem, sIdx) => (
                        <RustItemSlot key={sIdx} item={slotItem} compact />
                      ))}
                    </div>

                    {/* Show "+X more" if kit has more items */}
                    {items.length > 12 && (
                      <button
                        onClick={() => setInspectKit(kit)}
                        className="w-full mt-2 py-1 px-2 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono text-zinc-400 hover:text-white flex items-center justify-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3 text-red-400" />
                        <span>+{items.length - 12} المزيد • معاينة الكيت بالكامل</span>
                      </button>
                    )}
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="space-y-2 mt-auto">
                    <button
                      onClick={() => setInspectKit(kit)}
                      className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-mono text-xs flex items-center justify-center gap-1.5 border border-white/5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-400" />
                      <span>معاينة محتويات الكيت (30 خانة)</span>
                    </button>

                    {unlocked ? (
                      <button
                        onClick={() => {
                          showToast(`اكتب /kit داخل سيرفر راست لاستلام ${kit.Title}!`, "success");
                        }}
                        className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(46,204,113,0.3)] transition-all"
                      >
                        <Check className="w-4 h-4" /> UNLOCKED — USE /KIT
                      </button>
                    ) : isFree && lock === "LINKED" ? (
                      <button
                        onClick={openProfile}
                        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,168,255,0.3)]"
                      >
                        <ExternalLink className="w-4 h-4" /> LINK ACCOUNT TO UNLOCK
                      </button>
                    ) : isFree && lock === "BOOSTER" ? (
                      <a
                        href={DISCORD_TICKET_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(142,68,173,0.3)]"
                      >
                        <Zap className="w-4 h-4" /> BOOST DISCORD TO UNLOCK
                      </a>
                    ) : (
                      <button
                        onClick={() => setBuyModalKit(kit)}
                        className="w-full py-2.5 rounded-lg bg-[#e62020] hover:bg-[#ff2b2b] text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(230,32,32,0.4)]"
                      >
                        <MessageSquare className="w-4 h-4" /> BUY — {kit.PriceText || `$${kit.Price}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
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

              {/* Detailed Breakdown List */}
              <div className="bg-[#07090e] p-4 rounded-xl border border-white/5 mb-6">
                <h4 className="font-mono text-xs uppercase text-zinc-400 mb-3 font-bold">
                  قائمة الموارد والأسلحة بالتفصيل:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {(inspectKit.Items || []).map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={getRustItemImageUrl(it.Shortname)}
                          alt=""
                          className="w-5 h-5 object-contain shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://rustlabs.com/img/items180/${it.Shortname.toLowerCase().trim()}.png`;
                          }}
                        />
                        <span className="text-zinc-200 font-medium truncate">
                          {it.DisplayName || it.Shortname}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-400 shrink-0 ml-2">
                        x{it.Amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
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
                  <MessageSquare className="w-4 h-4" /> طلب وشراء الكيت عبر الديسكورد
                </button>
                <button
                  onClick={() => setInspectKit(null)}
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs uppercase transition-colors"
                >
                  إغلاق
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
                      سجل دخولك بحساب ستيم ليتم نسخ الـ SteamID الخاص بك تلقائياً.
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

              {/* Step-by-Step Instructions */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    اضغط على <strong className="text-white">"OPEN DISCORD TICKET"</strong> للتوجه لسيرفر الديسكورد وفتح تذكرة في روم <strong className="text-yellow-400">#store-tickets</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    أرسل الـ <strong className="text-white">SteamID64</strong> الخاص بك وحدد طريقة الدفع (PayPal, بطاقات, كريبتو).
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    بمجرد اكتمال العملية، يعطيك المشرف الرتبة في الديسكورد ويتم تفعيل الكيت فوراً في السيرفر عبر RCON تلقائياً!
                  </p>
                </div>
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
