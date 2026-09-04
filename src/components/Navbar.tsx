import React, { useState, useEffect } from "react";
import { useServer } from "@/context/ServerContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigation, PageId } from "@/context/NavigationContext";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import {
  Menu,
  X,
  Shield,
  ChevronDown,
  User,
  Mic,
  Copy,
  Check,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { status, connectCommand } = useServer();
  const { user, loginWithSteam, openProfile } = useAuth();
  const { activePage, navigate } = useNavigation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hubDropdownOpen, setHubDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (page: PageId, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(page);
    setMobileMenuOpen(false);
    setHubDropdownOpen(false);
  };

  const handleCopyF1 = async () => {
    const success = await copyToClipboard(connectCommand);
    if (success) {
      setCopied(true);
      showToast("F1 Command copied! Paste in Rust console (F1)", "success");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#06080d]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.9)] py-3.5"
            : "bg-gradient-to-b from-black/90 via-black/40 to-transparent py-5"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: 128.gif Official Animated Logo */}
          <a
            href="#home"
            onClick={(e) => handleNavClick("home", e)}
            className="flex items-center gap-2 group select-none cursor-pointer"
          >
            <img
              src="/128.gif"
              alt="GOAT RUST"
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl drop-shadow-[0_0_15px_rgba(230,32,32,0.6)] group-hover:scale-105 transition-transform"
            />
          </a>

          {/* Center: Navigation Links with Active States */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* HOME */}
            <a
              href="#home"
              onClick={(e) => handleNavClick("home", e)}
              className={`px-3.5 py-1.5 text-xs font-display font-bold tracking-widest uppercase rounded transition-all cursor-pointer ${
                activePage === "home"
                  ? "text-red-500 bg-red-500/10 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              HOME
            </a>

            {/* WIPES */}
            <a
              href="#wipes"
              onClick={(e) => handleNavClick("wipes", e)}
              className={`px-3.5 py-1.5 text-xs font-display font-bold tracking-widest uppercase rounded transition-all cursor-pointer ${
                activePage === "wipes"
                  ? "text-red-400 bg-red-500/15 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              WIPES
            </a>

            {/* STORE */}
            <a
              href="#store"
              onClick={(e) => handleNavClick("store", e)}
              className={`px-3.5 py-1.5 text-xs font-display font-bold tracking-widest uppercase rounded transition-all cursor-pointer ${
                activePage === "store"
                  ? "bg-yellow-500 text-black border border-yellow-400 font-extrabold shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                  : "bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/25 shadow-[0_0_12px_rgba(234,179,8,0.15)]"
              }`}
            >
              STORE
            </a>

            {/* LEADERBOARD */}
            <a
              href="#leaderboard"
              onClick={(e) => handleNavClick("players", e)}
              className={`px-3.5 py-1.5 text-xs font-display font-bold tracking-widest uppercase rounded transition-all cursor-pointer ${
                activePage === "players"
                  ? "text-red-400 bg-red-500/15 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              LEADERBOARD
            </a>

            {/* VOICE REWARDS */}
            <a
              href="#voice"
              onClick={(e) => handleNavClick("voice", e)}
              className={`px-3.5 py-1.5 text-xs font-display font-bold tracking-widest uppercase rounded transition-all flex items-center gap-1 cursor-pointer ${
                activePage === "voice"
                  ? "text-indigo-300 bg-indigo-500/20 border border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                  : "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
              }`}
            >
              <Mic className="w-3.5 h-3.5" /> VOICE REWARDS
            </a>

            {/* REPORT / RULES */}
            <a
              href="#rules"
              onClick={(e) => handleNavClick("rules", e)}
              className={`px-3.5 py-1.5 text-xs font-display font-bold tracking-widest uppercase rounded transition-all cursor-pointer ${
                activePage === "rules"
                  ? "text-red-400 bg-red-500/15 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              REPORT
            </a>

            {/* MAPS */}
            <a
              href="#maps"
              onClick={(e) => handleNavClick("maps", e)}
              className={`px-3.5 py-1.5 text-xs font-display font-bold tracking-widest uppercase rounded transition-all cursor-pointer ${
                activePage === "maps"
                  ? "text-red-400 bg-red-500/15 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              MAPS
            </a>

            {/* HUB Dropdown */}
            <div className="relative">
              <button
                onClick={() => setHubDropdownOpen(!hubDropdownOpen)}
                className={`px-3.5 py-1.5 text-xs font-display font-bold tracking-widest uppercase flex items-center gap-1 rounded transition-colors ${
                  activePage === "how-to-play" || activePage === "discord" || activePage === "overwatch"
                    ? "text-white bg-white/10"
                    : "text-zinc-300 hover:text-white hover:bg-white/5"
                }`}
              >
                HUB <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {hubDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-[#0b0e14] border border-white/15 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.95)] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <a
                    href="#how-to-play"
                    onClick={(e) => handleNavClick("how-to-play", e)}
                    className={`block px-4 py-2 text-xs font-display font-bold uppercase transition-colors ${
                      activePage === "how-to-play" ? "text-red-400 bg-white/10" : "text-zinc-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    HOW TO PLAY
                  </a>
                  <a
                    href="#discord"
                    onClick={(e) => handleNavClick("discord", e)}
                    className={`block px-4 py-2 text-xs font-display font-bold uppercase transition-colors ${
                      activePage === "discord" ? "text-[#8ea1e1] bg-white/10" : "text-zinc-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    DISCORD COMMUNITY
                  </a>
                  <a
                    href="#overwatch"
                    onClick={(e) => handleNavClick("overwatch", e)}
                    className={`block px-4 py-2 text-xs font-display font-bold uppercase transition-colors ${
                      activePage === "overwatch" ? "text-emerald-400 bg-white/10" : "text-zinc-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    OVERWATCH PROGRAM
                  </a>
                </div>
              )}
            </div>
          </nav>

          {/* Right: Overwatch / Verified Badge + Steam Login */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Overwatch / Verified badge */}
            <a
              href="#overwatch"
              onClick={(e) => handleNavClick("overwatch", e)}
              className="px-3 py-1.5 rounded text-[11px] font-display font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" /> OVERWATCH PROGRAM
            </a>

            {/* Steam Login / Profile Button */}
            {user ? (
              <button
                onClick={openProfile}
                className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white flex items-center gap-2 transition-all group"
              >
                <img
                  src={user.avatar || "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg"}
                  alt={user.steam_name}
                  className="w-5 h-5 rounded-full border border-red-500"
                />
                <span className="text-xs font-display font-bold text-white group-hover:text-red-400 transition-colors">
                  {user.steam_name}
                </span>
              </button>
            ) : (
              <button
                onClick={loginWithSteam}
                className="px-4 py-2 rounded font-display font-bold text-xs uppercase tracking-wider text-white bg-[#171a21] hover:bg-[#202530] border border-white/20 hover:border-white/40 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              >
                <svg className="w-4 h-4 fill-current text-zinc-300" viewBox="0 0 24 24">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.719L.438 14.88C1.862 20.088 6.556 24 12.021 24c6.627 0 12-5.373 12-12S18.605 0 11.979 0zM7.545 18.24l-1.464-.606c.263-.538.775-.939 1.383-1.059l1.168 1.639c-.352.004-.707.014-1.087.026zm8.4-9.33c0-1.467 1.189-2.656 2.656-2.656s2.656 1.189 2.656 2.656-1.189 2.656-2.656 2.656-2.656-1.189-2.656-2.656zm-1.077 7.022c0-1.055.855-1.91 1.91-1.91s1.91.855 1.91 1.91-.855 1.91-1.91 1.91-1.91-.855-1.91-1.91z" />
                </svg>
                Login
              </button>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            {user ? (
              <button onClick={openProfile} className="p-1 rounded bg-white/10 border border-white/20">
                <img src={user.avatar} alt={user.steam_name} className="w-6 h-6 rounded-full" />
              </button>
            ) : (
              <button
                onClick={loginWithSteam}
                className="px-2.5 py-1 rounded text-xs font-bold bg-zinc-800 border border-white/20 text-white"
              >
                Login
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded bg-zinc-900 text-zinc-300 hover:text-white border border-white/10"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-[#06080d]/98 backdrop-blur-2xl flex flex-col pt-20 px-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center pb-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <img src="/128.gif" alt="GOAT" className="w-10 h-10 object-contain rounded-lg drop-shadow-[0_0_10px_rgba(230,32,32,0.5)]" />
              <span className="font-display font-black text-2xl text-white">GOAT</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-zinc-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col gap-2 py-6 font-display font-bold text-sm tracking-wider uppercase">
            <a
              href="#home"
              onClick={(e) => handleNavClick("home", e)}
              className={`py-2 px-3 rounded ${activePage === "home" ? "text-red-500 bg-white/5" : "text-zinc-300"}`}
            >
              HOME
            </a>
            <a
              href="#wipes"
              onClick={(e) => handleNavClick("wipes", e)}
              className={`py-2 px-3 rounded ${activePage === "wipes" ? "text-red-400 bg-white/5" : "text-zinc-300"}`}
            >
              WIPES
            </a>
            <a
              href="#store"
              onClick={(e) => handleNavClick("store", e)}
              className={`py-2 px-3 rounded ${activePage === "store" ? "text-yellow-400 bg-yellow-500/10" : "text-yellow-400"}`}
            >
              STORE
            </a>
            <a
              href="#leaderboard"
              onClick={(e) => handleNavClick("players", e)}
              className={`py-2 px-3 rounded ${activePage === "players" ? "text-red-400 bg-white/5" : "text-zinc-300"}`}
            >
              LEADERBOARD
            </a>
            <a
              href="#voice"
              onClick={(e) => handleNavClick("voice", e)}
              className={`py-2 px-3 rounded flex items-center gap-2 ${activePage === "voice" ? "text-indigo-300 bg-indigo-500/10" : "text-indigo-400"}`}
            >
              <Mic className="w-4 h-4" /> VOICE REWARDS
            </a>
            <a
              href="#rules"
              onClick={(e) => handleNavClick("rules", e)}
              className={`py-2 px-3 rounded ${activePage === "rules" ? "text-red-400 bg-white/5" : "text-zinc-300"}`}
            >
              REPORT / RULES
            </a>
            <a
              href="#maps"
              onClick={(e) => handleNavClick("maps", e)}
              className={`py-2 px-3 rounded ${activePage === "maps" ? "text-red-400 bg-white/5" : "text-zinc-300"}`}
            >
              MAPS
            </a>
            <a
              href="#how-to-play"
              onClick={(e) => handleNavClick("how-to-play", e)}
              className={`py-2 px-3 rounded ${activePage === "how-to-play" ? "text-red-400 bg-white/5" : "text-zinc-300"}`}
            >
              HOW TO PLAY
            </a>
            <a
              href="#overwatch"
              onClick={(e) => handleNavClick("overwatch", e)}
              className={`py-2 px-3 rounded text-emerald-400 flex items-center gap-1.5 ${activePage === "overwatch" ? "bg-emerald-500/10" : ""}`}
            >
              <Shield className="w-3.5 h-3.5" /> OVERWATCH PROGRAM
            </a>
          </div>

          <div className="mt-auto pb-10 flex flex-col gap-3">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openProfile();
                }}
                className="w-full py-3 rounded-lg bg-white/10 border border-white/20 text-white font-display font-bold text-xs uppercase flex items-center justify-center gap-2"
              >
                <img src={user.avatar} alt={user.steam_name} className="w-5 h-5 rounded-full" />
                <span>{user.steam_name} (Stats & Profile)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  loginWithSteam();
                }}
                className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-display font-black text-xs uppercase tracking-wider"
              >
                LOGIN WITH STEAM
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
