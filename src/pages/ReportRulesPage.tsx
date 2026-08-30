import React, { useState } from "react";
import { RulesSection } from "@/components/RulesSection";
import {
  ShieldAlert,
  Search,
  AlertTriangle,
  Send,
  CheckCircle,
  ExternalLink,
  Video,
  User,
  Crosshair,
  Eye,
  Zap,
  Users,
  Bug,
  Flame,
  Award,
  Clock,
  Skull,
  Target,
  Shield,
  Loader2,
  X,
  Flag,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";

export const ReportRulesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [lookedUpPlayer, setLookedUpPlayer] = useState<any>(null);

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [category, setCategory] = useState("Aimbot / Recoil Script");
  const [proofUrl, setProofUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: "Aimbot / Recoil Script", label: "Aimbot / Recoil Script", icon: Crosshair, color: "text-red-400" },
    { id: "ESP / Wallhacks", label: "ESP / Wallhacks", icon: Eye, color: "text-amber-400" },
    { id: "Speedhack / Flyhack", label: "Speedhack / Movement Exploit", icon: Zap, color: "text-yellow-400" },
    { id: "Teaming / Clan Limit", label: "Teaming / Clan Limit", icon: Users, color: "text-blue-400" },
    { id: "Bug Abuse / Glitch", label: "Bug Abuse / Glitch", icon: Bug, color: "text-purple-400" },
    { id: "Toxic / Racism / Ban Evasion", label: "Toxic / Harassment", icon: Skull, color: "text-zinc-400" },
  ];

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchInput.trim();
    if (!query) {
      showToast("Please enter a Steam64 ID or profile URL", "error");
      return;
    }

    setIsSearching(true);
    setLookedUpPlayer(null);

    try {
      const res = await fetch(`/api/player-lookup?query=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.success && data.player) {
        setLookedUpPlayer(data.player);
        showToast(`Found player: ${data.player.steam_name}`, "success");
      } else {
        showToast(data.error || "Player not found on Steam", "error");
      }
    } catch (err) {
      showToast("Failed to lookup player. Check your connection.", "error");
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenReportModal = () => {
    if (!lookedUpPlayer) return;
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookedUpPlayer) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/report-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suspectInput: lookedUpPlayer.steam_id,
          category,
          proofUrl,
          description,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(`Report for ${lookedUpPlayer.steam_name} sent to Discord staff!`, "success");
        setIsReportModalOpen(false);
        setProofUrl("");
        setDescription("");
      } else {
        showToast(data.error || "Failed to submit report", "error");
      }
    } catch (err) {
      showToast("Failed to send report. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="mb-12 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-bold uppercase tracking-widest mb-4">
          <ShieldAlert className="w-3.5 h-3.5" /> FAIR PLAY & ANTI-CHEAT
        </div>
        <h1 className="font-display font-black text-4xl sm:text-6xl text-white uppercase tracking-tight">
          SERVER RULES <span className="text-red-500">&</span> REPORT CHEATER
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base font-sans max-w-2xl mt-2">
          We uphold a zero-tolerance policy against cheating, script usage, bug abuse, and toxic harassment. Search any player to inspect their live stats or report them directly to staff.
        </p>
      </div>

      {/* 1:1 Atlas Rust Player Lookup Box */}
      <div className="relative rounded-3xl bg-[#090c13] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden mb-16">
        {/* Glowing backdrop spotlight */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-6 sm:p-10">
          {/* Lookup Header */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <Crosshair className="w-7 h-7" />
            </div>
            <div className="font-mono text-xs text-red-400 uppercase tracking-widest font-bold mb-1">
              GOAT HUB • PUBLIC LOOKUP
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-white uppercase tracking-tight">
              Find any GOAT player
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-sans mt-2">
              Search by Steam64 ID or paste a Steam profile URL to view stats, scrim performance, combat history, and file an instant report.
            </p>
          </div>

          {/* Search Form Bar */}
          <form onSubmit={handleLookup} className="max-w-2xl mx-auto mb-8">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Steam64 ID or profile URL..."
                className="w-full pl-5 pr-32 py-4 rounded-xl bg-black/60 border border-white/20 hover:border-white/30 focus:border-red-500 text-white placeholder-zinc-500 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>{isSearching ? "Searching..." : "Search ->"}</span>
              </button>
            </div>
          </form>

          {/* Player Lookup Result Card */}
          {lookedUpPlayer && (
            <div className="max-w-3xl mx-auto mb-8 p-6 rounded-2xl bg-white/[0.03] border border-red-500/40 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <img
                    src={lookedUpPlayer.avatar}
                    alt={lookedUpPlayer.steam_name}
                    className="w-16 h-16 rounded-xl border border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-black text-2xl text-white">
                        {lookedUpPlayer.steam_name}
                      </h3>
                      {lookedUpPlayer.is_linked && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                          Linked
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-zinc-400 flex items-center gap-2 mt-1">
                      <span>ID: {lookedUpPlayer.steam_id}</span>
                      <span>•</span>
                      <span>Country: {lookedUpPlayer.country}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <a
                    href={`https://steamcommunity.com/profiles/${lookedUpPlayer.steam_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-display font-bold text-xs uppercase flex items-center gap-1.5 transition-all"
                  >
                    <span>Steam</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  </a>

                  {/* Trigger Report Modal Button */}
                  <button
                    onClick={handleOpenReportModal}
                    className="atlas-btn-red px-5 py-2.5 text-white font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(230,32,32,0.4)] cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>REPORT PLAYER</span>
                  </button>
                </div>
              </div>

              {/* Combat Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase">PvP Kills</div>
                  <div className="text-xl font-display font-bold text-white mt-1">
                    {lookedUpPlayer.stats?.kills || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase">Deaths</div>
                  <div className="text-xl font-display font-bold text-zinc-300 mt-1">
                    {lookedUpPlayer.stats?.deaths || 0}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase">K/D Ratio</div>
                  <div className="text-xl font-display font-bold text-red-400 mt-1">
                    {lookedUpPlayer.stats?.kd_ratio || "0.00"}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-center">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase">Playtime</div>
                  <div className="text-xl font-display font-bold text-emerald-400 mt-1">
                    {Math.round((lookedUpPlayer.stats?.playtime_seconds || 0) / 3600)}h
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Atlas 6 Feature Cards Grid */}
      <div className="mb-16">
        <div className="font-mono text-xs text-zinc-400 uppercase tracking-widest mb-4 font-bold">
          WHAT YOU'LL SEE
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
              <User className="w-5 h-5" />
            </div>
            <h4 className="font-display font-bold text-base text-white uppercase mb-1">Identity & status</h4>
            <p className="text-zinc-400 text-xs font-sans">
              Avatar, country, online status, account flags.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-display font-bold text-base text-white uppercase mb-1">Scrim performance</h4>
            <p className="text-zinc-400 text-xs font-sans">
              ELO rating, W/L, K/D, damage, recent form.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Target className="w-5 h-5" />
            </div>
            <h4 className="font-display font-bold text-base text-white uppercase mb-1">Gamemode stats</h4>
            <p className="text-zinc-400 text-xs font-sans">
              Duels, FFA, GunGame — kills, wins, accuracy.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Crosshair className="w-5 h-5" />
            </div>
            <h4 className="font-display font-bold text-base text-white uppercase mb-1">Aim trainer</h4>
            <p className="text-zinc-400 text-xs font-sans">
              Total aimtrain hours and sessions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
              <Flame className="w-5 h-5" />
            </div>
            <h4 className="font-display font-bold text-base text-white uppercase mb-1">Combat stats</h4>
            <p className="text-zinc-400 text-xs font-sans">
              K/D ratio, accuracy, headshot rate, kills & deaths.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="font-display font-bold text-base text-white uppercase mb-1">Ban records</h4>
            <p className="text-zinc-400 text-xs font-sans">
              Active and expired bans with full timeline.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Section Component */}
      <RulesSection />

      {/* Cheater Report Modal Popup */}
      {isReportModalOpen && lookedUpPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#0b0e14] border border-red-500/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(230,32,32,0.3)] max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-black text-2xl text-white uppercase">
                  Report Suspect: {lookedUpPlayer.steam_name}
                </h3>
                <p className="text-zinc-400 text-xs font-mono">
                  Steam64: {lookedUpPlayer.steam_id}
                </p>
              </div>
            </div>

            {/* Suspect Quick Preview */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3 mb-6">
              <img
                src={lookedUpPlayer.avatar}
                alt={lookedUpPlayer.steam_name}
                className="w-10 h-10 rounded-lg border border-red-500/50"
              />
              <div className="text-xs">
                <div className="font-display font-bold text-white">{lookedUpPlayer.steam_name}</div>
                <div className="font-mono text-zinc-400">Kills: {lookedUpPlayer.stats?.kills || 0} • K/D: {lookedUpPlayer.stats?.kd_ratio || "0.00"}</div>
              </div>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-5">
              {/* Violation Type */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-zinc-300 mb-2">
                  Select Violation Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all text-xs font-display font-bold uppercase ${
                          isSelected
                            ? "bg-red-600/20 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                            : "bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${cat.color}`} />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Proof Video Link */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-zinc-300 mb-1.5">
                  Video Proof URL (Medal, YouTube, Streamable)
                </label>
                <div className="relative flex items-center">
                  <Video className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://medal.tv/clip/... or https://youtube.com/..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-red-500 text-white placeholder-zinc-500 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-zinc-300 mb-1.5">
                  Description / Combatlog Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what happened, weapon used, monument location..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-red-500 text-white placeholder-zinc-500 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-300 font-display font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="atlas-btn-red px-6 py-2.5 text-white font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(230,32,32,0.4)] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>DISPATCHING...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>DISPATCH REPORT TO DISCORD</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
