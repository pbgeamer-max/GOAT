import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useServer } from "@/context/ServerContext";
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
} from "lucide-react";

export interface KitItem {
  Shortname: string;
  DisplayName?: string;
  Amount: number;
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

export const StoreSection: React.FC = () => {
  const { user, loginWithSteam, openProfile } = useAuth();
  const { showToast } = useToast();
  const [kits, setKits] = useState<LiveKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("VIP");
  const [selectedKit, setSelectedKit] = useState<LiveKit | null>(null);
  const [copiedSteamId, setCopiedSteamId] = useState(false);

  // Fetch live kits synced from GoatKitsUI.cs
  useEffect(() => {
    fetch("/api/kits")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.kits)) {
          setKits(data.kits);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
        return <Zap className="w-4 h-4 text-purple-400" />;
      case "MVP":
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case "VIP":
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case "BUILDER":
        return <Hammer className="w-4 h-4 text-emerald-400" />;
      case "GUNS":
        return <Crosshair className="w-4 h-4 text-red-400" />;
      case "BOOSTER":
        return <Zap className="w-4 h-4 text-fuchsia-400" />;
      default:
        return <Package className="w-4 h-4 text-zinc-400" />;
    }
  };

  const filteredKits = kits.filter((k) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "VIP") {
      const l = (k.LockType || "").toUpperCase();
      const curr = (k.Currency || "").toUpperCase();
      return l === "VIP" || l === "MVP" || l === "GOD" || l === "BUILDER" || l === "GUNS" || curr === "USD";
    }
    if (activeTab === "WEAPONS") {
      return k.TabName?.toUpperCase() === "WEAPONS" || k.LockType?.toUpperCase() === "GUNS";
    }
    if (activeTab === "COMMUNITY") {
      const l = (k.LockType || "").toUpperCase();
      return l === "LINKED" || l === "BOOSTER" || k.Currency?.toUpperCase() === "FREE";
    }
    return true;
  });

  return (
    <section id="store" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-[#07090e] border-t border-white/10">
      {/* Tactical Glow Grid Background */}
      <div className="absolute inset-0 bg-tactical-grid opacity-15 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-red-600/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-mono text-xs uppercase tracking-widest mb-3">
              <Gift className="w-3.5 h-3.5" /> GOAT 5X VIP RANKS & KITS
            </div>
            <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white uppercase tracking-tight">
              SERVER KITS & <span className="text-[#e62020]">STORE</span>
            </h2>
            <p className="text-zinc-400 text-sm mt-2 max-w-2xl">
              تتم مزامنة جميع الكيتات والرتب المضافة داخل اللعبة مباشرة مع المتجر هنا.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-[#0d1017] p-1.5 rounded-xl border border-white/10">
            {[
              { id: "VIP", label: "👑 VIP & PAID KITS" },
              { id: "ALL", label: "ALL KITS" },
              { id: "WEAPONS", label: "🔫 WEAPONS" },
              { id: "COMMUNITY", label: "🎁 FREE REWARDS" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all ${
                  activeTab === tab.id
                    ? "bg-[#e62020] text-white shadow-[0_0_15px_rgba(230,32,32,0.4)]"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span className="text-xs font-mono text-zinc-400">جاري تحميل الكيتات من السيرفر...</span>
            </div>
          ) : filteredKits.length === 0 ? (
            <div className="col-span-full py-16 px-6 text-center rounded-2xl bg-[#0b0e15] border border-white/10 flex flex-col items-center justify-center">
              <Package className="w-12 h-12 text-zinc-600 mb-4" />
              <h4 className="font-display font-bold text-lg text-white mb-2">لا توجد كيتات مضافة حالياً</h4>
              <p className="text-zinc-400 text-xs sm:text-sm max-w-md mb-6 leading-relaxed">
                ادخل إلى سيرفر راست كآدمن واكتب <span className="text-red-400 font-mono font-bold">/kit</span> ثم اضغط <span className="text-emerald-400 font-mono font-bold">+ CREATE KIT</span> وضع أسلحتك ومواردك وحدد الرتبة والسعر، وسيظهر الكيت هنا فوراً بموارده وسعره!
              </p>
            </div>
          ) : (
            filteredKits.map((kit) => {
              const unlocked = isKitUnlocked(kit);
              const lock = (kit.LockType || "NONE").toUpperCase();
              const isFree = kit.Currency?.toUpperCase() === "FREE" || kit.Price === 0;

              return (
                <div
                  key={kit.Id}
                  className="relative flex flex-col bg-[#0b0e15] border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] group overflow-hidden"
                >
                  {/* Accent Top Border */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: kit.ColorHex || "#e62020" }}
                  />

                  {/* Badge Header: Lock Type & Cooldown */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase tracking-wider border border-white/10"
                      style={{
                        backgroundColor: `${kit.ColorHex || "#e62020"}22`,
                        color: kit.ColorHex || "#fff",
                      }}
                    >
                      {getTierIcon(lock)}
                      {lock === "NONE" ? "STANDARD" : lock}
                    </span>

                    <span className="inline-flex items-center gap-1 font-mono text-xs text-zinc-400">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {kit.CooldownHours ? `${kit.CooldownHours}h` : "Ready"}
                    </span>
                  </div>

                  {/* Title & Price */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="font-display font-black text-xl text-white uppercase tracking-tight group-hover:text-red-400 transition-colors">
                      {kit.Title}
                    </h3>
                    <span className="shrink-0 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs">
                      {kit.PriceText || (isFree ? "FREE" : `$${kit.Price}`)}
                    </span>
                  </div>

                  {/* Items Container */}
                  <div className="bg-[#06080d] rounded-xl p-3.5 border border-white/5 mb-5 flex-grow">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-zinc-400" /> ITEMS INCLUDED:
                      </span>
                      <span className="text-zinc-500">{kit.Items?.length || 0} items</span>
                    </div>

                    <ul className="space-y-1 text-xs text-zinc-300 max-h-52 overflow-y-auto pr-1">
                      {(kit.Items || []).map((item, idx) => {
                        const nameLower = (item.DisplayName || item.Shortname).toLowerCase();
                        let badgeColor = "text-zinc-300 bg-white/5";
                        if (nameLower.includes("wood")) badgeColor = "text-amber-300 bg-amber-500/10 border border-amber-500/20";
                        else if (nameLower.includes("stone")) badgeColor = "text-stone-300 bg-stone-500/10 border border-stone-500/20";
                        else if (nameLower.includes("metal") || nameLower.includes("frag")) badgeColor = "text-blue-300 bg-blue-500/10 border border-blue-500/20";
                        else if (nameLower.includes("sulfur")) badgeColor = "text-yellow-300 bg-yellow-500/10 border border-yellow-500/20";
                        else if (nameLower.includes("hqm") || nameLower.includes("refined")) badgeColor = "text-rose-300 bg-rose-500/10 border border-rose-500/20";
                        else if (nameLower.includes("ak") || nameLower.includes("rifle") || nameLower.includes("sniper") || nameLower.includes("m249") || nameLower.includes("smg") || nameLower.includes("thompson")) badgeColor = "text-red-300 bg-red-500/10 border border-red-500/20";
                        else if (nameLower.includes("c4") || nameLower.includes("rocket")) badgeColor = "text-orange-300 bg-orange-500/10 border border-orange-500/20";
                        else if (nameLower.includes("syringe") || nameLower.includes("medkit")) badgeColor = "text-emerald-300 bg-emerald-500/10 border border-emerald-500/20";

                        return (
                          <li key={idx} className="flex items-center justify-between gap-2 py-1 px-1.5 rounded border-b border-white/[0.03] hover:bg-white/[0.02]">
                            <span className={`text-[11px] truncate font-medium px-1.5 py-0.5 rounded ${badgeColor}`}>
                              {item.DisplayName || item.Shortname}
                            </span>
                            <span className="font-mono font-bold text-amber-400 shrink-0 text-xs">
                              x{item.Amount.toLocaleString()}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Action Button */}
                  {unlocked ? (
                    <button
                      onClick={() => {
                        showToast(`اكتب /kit داخل شات سيرفر راست لاستلام ${kit.Title}!`, "success");
                      }}
                      className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(46,204,113,0.3)] transition-all"
                    >
                      <Check className="w-4 h-4" /> UNLOCKED — USE /KIT
                    </button>
                  ) : isFree && lock === "LINKED" ? (
                    <button
                      onClick={openProfile}
                      className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(0,168,255,0.3)]"
                    >
                      <ExternalLink className="w-4 h-4" /> LINK ACCOUNT TO UNLOCK
                    </button>
                  ) : isFree && lock === "BOOSTER" ? (
                    <a
                      href={DISCORD_TICKET_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(142,68,173,0.3)]"
                    >
                      <Zap className="w-4 h-4" /> BOOST DISCORD TO UNLOCK
                    </a>
                  ) : (
                    <button
                      onClick={() => setSelectedKit(kit)}
                      className="w-full py-3 rounded-lg bg-[#e62020] hover:bg-[#ff2b2b] text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(230,32,32,0.4)]"
                    >
                      <MessageSquare className="w-4 h-4" /> BUY ON DISCORD — {kit.PriceText || `$${kit.Price}`}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Discord Ticket Purchase Modal ── */}
      {selectedKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0d1017] border border-white/15 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Top Accent Stripe */}
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: selectedKit.ColorHex || "#e62020" }}
            />

            {/* Close Button */}
            <button
              onClick={() => setSelectedKit(null)}
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
                    {selectedKit.Title}
                  </h3>
                  <p className="text-zinc-400 text-xs font-mono mt-1">
                    Rank & In-Game Kit • Instant Delivery via Bot
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-display font-black text-emerald-400">
                    {selectedKit.PriceText || `$${selectedKit.Price}`}
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
                    اضغط على <strong className="text-white">"OPEN DISCORD TICKET"</strong> للدخول للديسكورد والتوجه لروم <strong className="text-yellow-400">#store-tickets</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    أرسل الـ <strong className="text-white">SteamID64</strong> واختر طريقة الدفع التي تناسبك (PayPal, بطاقات, كريبتو).
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    يعطيك المشرف رتبتك في الديسكورد، فيقوم البوت فوراً بفتح الكيت ومزاياه في راست تلقائياً دون أي انتظار!
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
                Ticket URL: https://discord.gg/7uRsxfknSG
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
