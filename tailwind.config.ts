import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        background: "#08090c",
        foreground: "#f3f4f6",
        primary: {
          DEFAULT: "#f97316", // Rust vibrant orange
          hover: "#ea580c",
          light: "#fb923c",
          dark: "#c2410c",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#ff5500",
          hover: "#e04b00",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#fbbf24", // Gold / Amber
          hover: "#f59e0b",
          foreground: "#000000",
        },
        border: "rgba(255, 255, 255, 0.1)",
        muted: {
          DEFAULT: "#141720",
          foreground: "#94a3b8",
        },
        rust: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          glow: "#ff5500",
          amber: "#f59e0b",
        },
        obsidian: {
          950: "#060709",
          900: "#0a0b0f",
          850: "#0f1117",
          800: "#141720",
          750: "#1b1f2b",
          700: "#232838",
          600: "#32384e",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-rajdhani)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      boxShadow: {
        "rust-glow": "0 0 35px -5px rgba(249, 115, 22, 0.4)",
        "rust-sm": "0 0 15px 0 rgba(249, 115, 22, 0.25)",
        "rust-lg": "0 0 60px -10px rgba(255, 85, 0, 0.5)",
        "inner-glow": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)",
        "card-glow": "0 10px 30px -10px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(255, 255, 255, 0.05)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
        "scanline": "scanline 8s linear infinite",
      },
      keyframes: {
        glowPulse: {
          "0%": { opacity: "0.4", filter: "drop-shadow(0 0 15px rgba(249, 115, 22, 0.4))" },
          "100%": { opacity: "0.8", filter: "drop-shadow(0 0 30px rgba(255, 85, 0, 0.8))" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
