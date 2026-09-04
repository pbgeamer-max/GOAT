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
  imageScale?: string;
  availableOn: string[];
  theme: string;
  borderClass?: string;
  btnClass?: string;
  glowColor?: string;
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
• Player: ${user?.steam_name || "Guest Customer"}
• Server: GOAT 5X NO BPS
━━━━━━━━━━━━━━━━━━━━━━━━━━
(Ticket created via website store)`;

  const handleCopyOrder = () => {
    if (!steamIdToUse) {
      showToast("Please enter your SteamID64 first!", "error");
      return;
    }
    navigator.clipboard.writeText(orderText);
    setCopied(true);
    showToast("Order details copied to clipboard! Paste it in your Discord ticket.", "success");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenDiscord = () => {
    window.open(discordUrl || "https://discord.gg/EbZwSY7jXy", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-xl bg-gradient-to-b from-[#0f172a] to-[#090d16] border border-[#1e293b] rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden"
        style={{
          boxShadow: `0 25px 60px rgba(0,0,0,0.9), 0 0 45px ${pkg.glowColor}25`,
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#080d1a] border border-[#1e2a42] p-2 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src={pkg.image}
              alt={pkg.title}
              className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(241,196,15,0.4)]"
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
          <div className="p-4 rounded-2xl bg-[#0c1220] border border-[#1e293b]">
            <div className="flex items-center justify-between mb-2">
              <label className="font-display font-bold text-xs uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span>1. YOUR STEAM ACCOUNT (STEAMID64)</span>
              </label>
              {user && (
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> AUTO-DETECTED
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                value={steamInput}
                onChange={(e) => setSteamInput(e.target.value)}
                placeholder="Enter your SteamID64 (e.g. 76561198...)"
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-[#1e293b] text-white font-mono text-xs focus:outline-none focus:border-yellow-400 transition-colors"
              />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
              GEMS will be credited directly to this account in-game upon payment verification.
            </p>
          </div>

          {/* Step 2: Discord Instructions */}
          <div className="p-4 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/30 text-xs text-zinc-300 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[#8ea1e1]">
                <MessageSquare className="w-4 h-4" />
                <span>2. OPEN A TICKET ON DISCORD</span>
              </div>
              <button
                onClick={handleCopyOrder}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-mono font-bold text-xs transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "COPIED!" : "COPY ORDER"}</span>
              </button>
            </div>
            <p className="leading-relaxed text-zinc-300">
              Click the button below to join our Discord server. Open a ticket in the <b>#tickets</b> section with your payment proof (PayPal / Crypto / Cards / Cash).
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCopyOrder}
            className="flex-1 py-3.5 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/10 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "ORDER COPIED!" : "COPY ORDER DETAILS"}</span>
          </button>

          <button
            onClick={handleOpenDiscord}
            className="flex-1 py-3.5 px-5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(88,101,242,0.5)] cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>OPEN DISCORD TICKET</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Footer Guarantee */}
        <div className="mt-4 text-center">
          <p className="text-[11px] font-mono text-zinc-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Instant & Secure Delivery via Automated Server Console</span>
          </p>
        </div>
      </div>
    </div>
  );
};
