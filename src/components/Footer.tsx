import React from "react";
import { Logo } from "@/components/Logo";
import { useServer } from "@/context/ServerContext";
import { useNavigation, PageId } from "@/context/NavigationContext";
import { ArrowUp } from "lucide-react";

export const Footer: React.FC = () => {
  const { discordUrl, serverName } = useServer();
  const { navigate } = useNavigation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavClick = (page: PageId, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(page);
  };

  return (
    <footer className="relative bg-obsidian-950 border-t border-white/10 pt-16 pb-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Top Footer Section */}
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-white/10">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Logo size="lg" showSubtitle={true} />
            <p className="font-sans text-xs sm:text-sm text-zinc-500 max-w-sm mt-3">
              The premier high-action Rust battlefield. Built for competitive players who demand peak performance.
            </p>
          </div>

          {/* Quick Nav Links */}
          <div className="flex flex-wrap justify-center items-center gap-6 font-display font-bold text-sm tracking-wider uppercase text-zinc-400">
            <a
              href="#home"
              onClick={(e) => handleNavClick("home", e)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Home
            </a>
            <a
              href="#store"
              onClick={(e) => handleNavClick("store", e)}
              className="text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer"
            >
              Store
            </a>
            <a
              href="#players"
              onClick={(e) => handleNavClick("players", e)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Players
            </a>
            <a
              href="#wipes"
              onClick={(e) => handleNavClick("wipes", e)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Wipes
            </a>
            <a
              href="#how-to-play"
              onClick={(e) => handleNavClick("how-to-play", e)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How to Play
            </a>
            <a
              href="#rules"
              onClick={(e) => handleNavClick("rules", e)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Rules
            </a>
            <a
              href="#maps"
              onClick={(e) => handleNavClick("maps", e)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Maps
            </a>
            <a
              href={discordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#8ea1e1] transition-colors flex items-center gap-1"
            >
              Discord
            </a>
          </div>

          {/* Scroll to Top Button */}
          <button
            onClick={scrollToTop}
            className="p-3 rounded-xl bg-obsidian-900 border border-white/10 hover:border-rust-500/40 text-zinc-400 hover:text-white transition-colors"
            title="Scroll to top"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Legal & Copyright */}
        <div className="w-full pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left font-sans text-xs text-zinc-500">
          <p>
            © {new Date().getFullYear()} <strong className="text-zinc-300 font-bold">{serverName}</strong>. All rights reserved.
          </p>
          <p className="text-[11px] max-w-md text-zinc-600">
            Rust is a registered trademark of Facepunch Studios LTD. {serverName} is not affiliated with or endorsed by Facepunch Studios.
          </p>
        </div>
      </div>
    </footer>
  );
};
