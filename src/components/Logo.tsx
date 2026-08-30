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
    lg: "text-3xl sm:text-4xl",
  };

  const badgeSizes = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-xs px-2.5 py-1",
  };

  return (
    <a href="#home" className="group flex items-center gap-3 select-none">
      {/* 512.png Official Logo Image */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]} transition-transform duration-300 group-hover:scale-105 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.4)] border border-rust-500/40 bg-black/50`}>
        <img
          src="/512.png"
          alt="GOAT RUST"
          className="w-full h-full object-cover rounded-xl"
        />
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`font-display font-black tracking-wider text-white ${textSizes[size]} leading-none`}>
            GOAT
          </span>
          <span className={`font-display font-black bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 text-transparent bg-clip-text ${textSizes[size]} leading-none`}>
            RUST
          </span>
          <span className={`font-mono font-bold uppercase bg-red-600/20 text-red-400 border border-red-500/30 rounded ${badgeSizes[size]} tracking-tight ml-0.5`}>
            5X
          </span>
        </div>
        {showSubtitle && (
          <span className="font-mono text-[10px] text-zinc-400 tracking-widest uppercase mt-1">
            PREMIER 5X RUST SERVER
          </span>
        )}
      </div>
    </a>
  );
};
