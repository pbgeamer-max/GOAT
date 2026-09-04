import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { useServer } from "@/context/ServerContext";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Crown,
  ShieldCheck,
  MessageSquare,
  User,
  Zap,
} from "lucide-react";

export interface VipRankItem {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  priceText?: string;
  billing?: string;
  perks: string[];
  accentColor: string;
  badge?: string;
}

interface VipPurchaseModalProps {
  rank: VipRankItem;
  onClose: () => void;
}

export const VipPurchaseModal: React.FC<VipPurchaseModalProps> = ({ rank, onClose }) => {
  const { user } = useAuth();
  const { discordUrl } = useServer();
  const { showToast } = useToast();

  const [steamInput, setSteamInput] = useState<string>(user?.steam_id || "");
  const [copied, setCopied] = useState(false);

  const steamIdToUse = (user?.steam_id || steamInput || "").trim();

  const orderText = `👑 [GOAT 5X VIP RANK ORDER]
━━━━━━━━━━━━━━━━━━━━━━━━━━
• Rank / Package: ${rank.title} (${rank.priceText || `$${rank.price}`}${rank.billing || "/mo"})
• SteamID64: ${steamIdToUse || "[Please enter your SteamID]"}
• Player: ${user?.steam_name || "Guest Customer"}
• Server: GOAT 5X NO BPS
• Perks:
${rank.perks.map((p) => `  - ${p}`).join("\n")}
━━━━━━━━━━━━━━━━━━━━━━━━━━
(Ticket created via website store)`;

  const handleCopyOrder = () => {
    if (!steamIdToUse) {
      showToast("Please enter your SteamID64 first!", "error");
      return;
    }
    navigator.clipboard.writeText(orderText);
    setCopied(true);
    showToast("VIP Order details copied! Paste it in your Discord ticket.", "success");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenDiscord = () => {
    window.open(discordUrl || "https://discord.gg/EbZwSY7jXy", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-xl bg-gradient-to-b from-[#0f172a] to-[#090d16] border border-[#1e293b] rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden"
        style={{
          boxShadow: `0 25px 60px rgba(0,0,0,0.9), 0 0 45px ${rank.accentColor}25`,
        }}
      >
        {/* Accent Bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: rank.accentColor }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border shrink-0"
            style={{
              backgroundColor: `${rank.accentColor}18`,
              borderColor: `${rank.accentColor}40`,
            }}
          >
            <Crown className="w-7 h-7" style={{ color: rank.accentColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-1"
                style={{ color: rank.accentColor }}
              >
                <Zap className="w-3.5 h-3.5" /> OFFICIAL VIP RANK
              </span>
              {rank.badge && (
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {rank.badge}
                </span>
              )}
            </div>
            <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
              {rank.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-display font-black text-xl text-white">
                {rank.priceText || `$${rank.price}`}
              </span>
              <span className="text-xs text-zinc-400 font-mono">{rank.billing || "/mo"}</span>
            </div>
          </div>
        </div>

        {/* Steps */}
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

            <input
              type="text"
              value={steamInput}
              onChange={(e) => setSteamInput(e.target.value)}
              placeholder="Enter your SteamID64 (e.g. 76561198...)"
              className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-[#1e293b] text-white font-mono text-xs focus:outline-none focus:border-yellow-400 transition-colors"
            />
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
              VIP rank permissions will be activated automatically on this SteamID via live RCON.
            </p>
          </div>

          {/* Step 2: Discord */}
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
              Open a ticket in <b>#tickets</b> on Discord and send your order details. We accept PayPal, Credit Card, Crypto, and more.
            </p>
          </div>
        </div>

        {/* Buttons */}
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

        <div className="mt-4 text-center">
          <p className="text-[11px] font-mono text-zinc-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instant In-Game Delivery via Automated Server Console</span>
          </p>
        </div>
      </div>
    </div>
  );
};
