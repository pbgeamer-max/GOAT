import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { useServer } from "@/context/ServerContext";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  CreditCard,
  User,
  Zap,
} from "lucide-react";

export interface GemsPackage {
  id: string;
  gems: number;
  title: string;
  price: number;
  priceText: string;
  subtext?: string;
  bonusValue?: string | null;
  badge?: { text: string; color: string } | null;
  image: string;
  availableOn: string[];
  theme: string;
  borderClass?: string;
  btnClass: string;
  glowColor: string;
}

interface GemsPurchaseModalProps {
  pkg: GemsPackage;
  onClose: () => void;
}

export const GemsPurchaseModal: React.FC<GemsPurchaseModalProps> = ({ pkg, onClose }) => {
  const { user } = useAuth();
  const { discordUrl } = useServer();
  const { showToast } = useToast();

  const [steamInput, setSteamInput] = useState<string>(user?.steam_id || "");
  const [copied, setCopied] = useState(false);

  const steamIdToUse = (user?.steam_id || steamInput || "").trim();

  const orderText = `🛒 [GOAT 5X GEMS ORDER]
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Package: ${pkg.title} (${pkg.gems.toLocaleString()} GEMS)
• Price: ${pkg.priceText} USD
• Value Bonus: ${pkg.bonusValue || "Standard Pack"}
• SteamID64: ${steamIdToUse || "[Please enter your SteamID]"}
• Player: ${user?.display_name || "Guest Customer"}
• Server: GOAT 5X NO BPS
━━━━━━━━━━━━━━━━━━━━━━━━━━
(Ticket created via website store)`;

  const handleCopyOrder = () => {
    if (!steamIdToUse) {
      showToast("يرجى إدخال SteamID64 الخاص بك أولاً!", "error");
      return;
    }
    navigator.clipboard.writeText(orderText);
    setCopied(true);
    showToast("تم نسخ كود الطلب بنجاح! الصقه في تكت الديسكورد.", "success");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenDiscord = () => {
    window.open(discordUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-xl bg-gradient-to-b from-[#111624] to-[#0a0d15] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_50px_rgba(234,179,8,0.15)] overflow-hidden"
        style={{
          boxShadow: `0 25px 60px rgba(0,0,0,0.9), 0 0 50px ${pkg.glowColor}`,
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-black/60 border border-white/10 p-1.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src={pkg.image}
              alt={pkg.title}
              className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(241,196,15,0.5)]"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> GEMS STORE PACKAGE
              </span>
              {pkg.badge && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {pkg.badge.text}
                </span>
              )}
            </div>
            <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
              {pkg.title}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono font-black text-xl text-yellow-400">{pkg.priceText}</span>
              {pkg.bonusValue && (
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {pkg.bonusValue}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Steps Container */}
        <div className="space-y-4 mb-6">
          {/* Step 1: Steam ID */}
          <div className="p-4 rounded-2xl bg-[#0e1320] border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="font-display font-bold text-xs uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span>1. حسابك في ستيم (SteamID64)</span>
              </label>
              {user && (
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> تم التعرف تلقائياً
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={steamInput}
                onChange={(e) => setSteamInput(e.target.value)}
                placeholder="أدخل SteamID64 الخاص بك (مثال: 76561198...)"
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-yellow-400 transition-colors"
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
              سيتم شحن الجيمز مباشرة إلى هذا الحساب داخل السيرفر فور تأكيد الدفع.
            </p>
          </div>

          {/* Step 2: Copy Order */}
          <div className="p-4 rounded-2xl bg-[#0e1320] border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-bold text-xs uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <Copy className="w-4 h-4 text-yellow-400" />
                <span>2. نسخ كود الطلب</span>
              </span>
              <button
                onClick={handleCopyOrder}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-mono font-bold text-xs transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)]"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "تم النسخ!" : "نسخ الطلب"}</span>
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-black/70 border border-white/5 font-mono text-[11px] text-zinc-300 whitespace-pre-line select-all">
              {orderText}
            </div>
          </div>

          {/* Step 3: Discord Instructions */}
          <div className="p-4 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/30 text-xs text-zinc-300 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#8ea1e1]">
              <MessageSquare className="w-4 h-4" />
              <span>3. فتح تذكرة (Ticket) في الديسكورد:</span>
            </div>
            <p className="leading-relaxed">
              اضغط على الزر أدناه للانتقال إلى سيرفر الديسكورد، افتح تكت بقسم <b>#tickets</b> والصق كود الطلب مع إثبات الدفع (عبر PayPal / زين كاش / Crypto / بطاقات).
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopyOrder}
            className="flex-1 py-3.5 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/10"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "تم نسخ تفاصيل الطلب" : "نسخ تفاصيل الطلب"}</span>
          </button>

          <button
            onClick={handleOpenDiscord}
            className="flex-1 py-3.5 px-5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(88,101,242,0.5)]"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>فتح تكت بالديسكورد</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Footer Guarantee */}
        <div className="mt-4 text-center">
          <p className="text-[11px] font-mono text-zinc-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>تسليم فوري ومضمون 100% عبر أوامر السيرفر المباشرة</span>
          </p>
        </div>
      </div>
    </div>
  );
};
