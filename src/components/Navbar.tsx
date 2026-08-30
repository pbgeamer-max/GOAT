import React, { useState, useEffect } from "react";
import { useServer } from "@/context/ServerContext";
import { useAuth } from "@/context/AuthContext";
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
          {/* Left: Atlas Style Bold Text Logo */}
          <a href="#home" className="flex items-center gap-2 group select-none">
            <span className="font-display font-black text-2xl sm:text-3xl tracking-tighter text-white uppercase group-hover:text-red-500 transition-colors">
              GOAT
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block -ml-1 mt-1 group-hover:scale-150 transition-transform" />
          </a>

          {/* Center: Atlas Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <a
              href="#home"
              className="px-3.5 py-1.5 text-xs font-display font-bold tracking-widest text-red-500 uppercase rounded transition-colors"
            >
              HOME
            </a>
            <a
              href="#wipes"
              className="px-3.5 py-1.5 text-xs font-display font-bold tracking-widest text-zinc-300 hover:text-white uppercase transition-colors"
            >
              WIPES
            </a>
            {/* Atlas STORE Yellow Box Button */}
            <a
              href="#store"
              className="px-3.5 py-1.5 text-xs font-display font-bold tracking-widest bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/25 uppercase rounded transition-all shadow-[0_0_12px_rgba(234,179,8,0.15)]"
            >
              STORE
            </a>
            <a
              href="#leaderboard"
              className="px-3.5 py-1.5 text-xs font-display font-bold tracking-widest text-zinc-300 hover:text-white uppercase transition-colors"
            >
              PLAYERS
            </a>
            <a
              href="#voice"
              className="px-3.5 py-1.5 text-xs font-display font-bold tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase transition-colors"
            >
              <Mic className="w-3.5 h-3.5" /> VOICE REWARDS
            </a>
            <a
              href="#rules"
              className="px-3.5 py-1.5 text-xs font-display font-bold tracking-widest text-zinc-300 hover:text-white uppercase transition-colors"
            >
              REPORT
            </a>
            <a
              href="#servers"
              className="px-3.5 py-1.5 text-xs font-display font-bold tracking-widest text-zinc-300 hover:text-white uppercase transition-colors"
            >
              MAPS
            </a>

            {/* HUB Dropdown */}
            <div className="relative">
              <button
                onClick={() => setHubDropdownOpen(!hubDropdownOpen)}
                className="px-3.5 py-1.5 text-xs font-display font-bold tracking-widest text-zinc-300 hover:text-white uppercase flex items-center gap-1 transition-colors"
              >
                HUB <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {hubDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#0b0e14] border border-white/10 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.9)] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <a
                    href="#how-to-play"
                    onClick={() => setHubDropdownOpen(false)}
                    className="block px-4 py-2 text-xs font-display font-bold text-zinc-300 hover:text-white hover:bg-white/5 uppercase"
                  >
                    HOW TO PLAY
                  </a>
                  <a
                    href="#discord"
                    onClick={() => setHubDropdownOpen(false)}
                    className="block px-4 py-2 text-xs font-display font-bold text-zinc-300 hover:text-white hover:bg-white/5 uppercase"
                  >
                    DISCORD COMMUNITY
                  </a>
                  <a
                    href="#stats"
                    onClick={() => setHubDropdownOpen(false)}
                    className="block px-4 py-2 text-xs font-display font-bold text-zinc-300 hover:text-white hover:bg-white/5 uppercase"
                  >
                    LIVE STATS
                  </a>
                </div>
              )}
            </div>
          </nav>

          {/* Right: Overwatch / Verified Badge + Steam Login */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Overwatch / Verified badge */}
            <a
              href="#discord"
              className="px-3 py-1.5 rounded text-[11px] font-display font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 uppercase flex items-center gap-1.5 transition-colors"
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
                {/* Steam SVG Icon */}
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
            <span className="font-display font-black text-2xl text-white">GOAT</span>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-zinc-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col gap-3 py-6 font-display font-bold text-sm tracking-wider uppercase">
            <a href="#home" onClick={() => setMobileMenuOpen(false)} className="text-red-500 py-2">
              HOME
            </a>
            <a href="#wipes" onClick={() => setMobileMenuOpen(false)} className="text-zinc-300 hover:text-white py-2">
              WIPES
            </a>
            <a href="#store" onClick={() => setMobileMenuOpen(false)} className="text-yellow-400 py-2">
              STORE
            </a>
            <a href="#leaderboard" onClick={() => setMobileMenuOpen(false)} className="text-zinc-300 hover:text-white py-2">
              PLAYERS
            </a>
            <a href="#voice" onClick={() => setMobileMenuOpen(false)} className="text-indigo-400 py-2 flex items-center gap-2">
              <Mic className="w-4 h-4" /> VOICE REWARDS
            </a>
            <a href="#rules" onClick={() => setMobileMenuOpen(false)} className="text-zinc-300 hover:text-white py-2">
              REPORT / RULES
            </a>
            <a href="#servers" onClick={() => setMobileMenuOpen(false)} className="text-zinc-300 hover:text-white py-2">
              MAPS
            </a>
            <a href="#how-to-play" onClick={() => setMobileMenuOpen(false)} className="text-zinc-300 hover:text-white py-2">
              HOW TO PLAY
            </a>
          </div>

          <div className="mt-auto pb-10 flex flex-col gap-3">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openProfile();
                }}
                className="w-full py-3 rounded-lg font-display font-bold text-xs uppercase bg-white/10 text-white border border-white/20 flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4 text-red-500" /> My Profile ({user.steam_name})
              </button>
            ) : (
              <button
                onClick={loginWithSteam}
                className="w-full py-3 rounded-lg font-display font-bold text-xs uppercase bg-[#171a21] text-white border border-white/20 flex items-center justify-center gap-2"
              >
                Sign in with Steam
              </button>
            )}

            <button
              onClick={() => {
                handleCopyF1();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3.5 atlas-btn-red text-white font-display font-extrabold text-sm uppercase flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "COPIED F1 COMMAND!" : "CONNECT F1 CONSOLE"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
