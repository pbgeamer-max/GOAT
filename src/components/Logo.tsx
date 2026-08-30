import React from "react";
import { SERVER_CONFIG } from "@/config/serverConfig";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = "md", showSubtitle = false }) => {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const badgeSizes = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  };

  return (
    <a href="#home" className="group flex items-center gap-3 select-none">
      {/* High-tech stylized geometric GOAT emblem */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]} transition-transform duration-300 group-hover:scale-105`}>
        {/* Glowing backdrop diamond */}
        <div className="absolute inset-0 bg-gradient-to-br from-rust-500 to-rust-700 rounded-lg transform rotate-45 opacity-80 group-hover:opacity-100 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.6)] transition-all duration-300 border border-rust-400/40" />
        
        {/* Inner dark center */}
        <div className="absolute inset-[2px] bg-obsidian-950 rounded-[6px] transform rotate-45 flex items-center justify-center" />

        {/* Custom Stylized Geometric Goat Horns Icon */}
        <svg
          className="relative z-10 w-3/5 h-3/5 text-rust-400 group-hover:text-white transition-colors duration-300 filter drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          {/* Stylized sharp geometric horns and goat crest */}
          <path d="M12 2L9 7L3 5L5 11L9 12L12 22L15 12L19 11L21 5L15 7L12 2Z" opacity="0.95" />
          <path d="M12 5L10.5 8.5L6.5 7.5L8 11.5L10.5 12L12 18L13.5 12L16 11.5L17.5 7.5L13.5 8.5L12 5Z" fill="#ffedd5" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`font-display font-bold tracking-wider text-white ${textSizes[size]} leading-none`}>
            GOAT
          </span>
          <span className={`font-display font-extrabold bg-gradient-to-r from-rust-400 to-rust-600 text-transparent bg-clip-text ${textSizes[size]} leading-none`}>
            5X
          </span>
          <span className={`font-mono font-semibold uppercase bg-rust-500/20 text-rust-400 border border-rust-500/30 rounded ${badgeSizes[size]} tracking-tight ml-0.5`}>
            RUST
          </span>
        </div>
        {showSubtitle && (
          <span className="font-mono text-[10px] text-zinc-400 tracking-widest uppercase mt-0.5">
            {SERVER_CONFIG.tagline}
          </span>
        )}
      </div>
    </a>
  );
};
