export interface ServerFeature {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  badge?: string;
}

export interface ServerRule {
  id: string;
  number: string;
  title: string;
  summary: string;
  details: string;
}

export interface WipeScheduleItem {
  type: string;
  time: string;
  frequency: string;
  description: string;
}

export interface ServerConfig {
  name: string;
  shortName: string;
  multiplier: string;
  tagline: string;
  heroHeadline: string;
  heroSubtitle: string;
  ip: string;
  port: number;
  fullAddress: string;
  connectCommand: string;
  steamConnectUrl: string;
  discordUrl: string;
  region: string;
  mapName: string;
  mapSize: number;
  maxPlayers: number;
  tickRate: string;
  wipeSchedule: {
    nextWipeDate: string; // ISO 8601 format e.g. "2026-08-27T18:00:00Z"
    cycle: string;
    scheduleList: WipeScheduleItem[];
  };
  features: ServerFeature[];
  rules: ServerRule[];
  socials: {
    discord: string;
    steam: string;
    youtube?: string;
  };
}

export function getNextThursdayWipeDate(targetHour = 17, targetMinute = 0): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  let daysUntilThursday = (4 - dayOfWeek + 7) % 7;

  const targetDate = new Date(now);
  targetDate.setHours(targetHour, targetMinute, 0, 0);

  if (daysUntilThursday === 0 && now.getTime() >= targetDate.getTime()) {
    daysUntilThursday = 7;
  }

  targetDate.setDate(now.getDate() + daysUntilThursday);
  return targetDate.toISOString();
}

export const SERVER_CONFIG: ServerConfig = {
  name: "GOAT 5X",
  shortName: "GOAT",
  multiplier: "5X",
  tagline: "5X RUST SERVER",
  heroHeadline: "GOAT 5X",
  heroSubtitle: "Fast. Competitive. Unforgiving. The Ultimate High-Stakes Rust Experience.",
  ip: "168.100.161.129",
  port: 28056,
  fullAddress: "168.100.161.129:28056",
  connectCommand: "connect 168.100.161.129:28056",
  steamConnectUrl: "steam://run/252490//+connect 168.100.161.129:28056/",
  discordUrl: "https://discord.gg/goat5x", // Customizable Discord link
  region: "EU / Global Dedicated 10Gbps",
  mapName: "Procedural Map (Custom Monuments)",
  mapSize: 4000,
  maxPlayers: 250,
  tickRate: "100Hz Dedicated",
  wipeSchedule: {
    // Automatically calculates next Thursday @ 5:00 PM
    nextWipeDate: getNextThursdayWipeDate(17, 0),
    cycle: "Weekly Thursday Wipe @ 5:00 PM (17:00)",
    scheduleList: [
      {
        type: "Map Wipe",
        time: "Every Thursday @ 5:00 PM (17:00)",
        frequency: "Weekly",
        description: "Fresh procedural map generation with customized loot tables and monuments.",
      },
      {
        type: "Full Blueprint Wipe",
        time: "First Thursday of Every Month @ 5:00 PM",
        frequency: "Monthly",
        description: "Mandatory global Facepunch update and complete server progression reset.",
      },
    ],
  },
  features: [
    {
      id: "loot",
      title: "5X LOOT & GATHER",
      subtitle: "Accelerated Progression",
      description: "Balanced 5X gather rates on wood, stone, metal, and sulfur with refined scrap barrels and high-tier military crates.",
      icon: "Zap",
      badge: "5X RATES",
    },
    {
      id: "crafting",
      title: "INSTANT CRAFT & SMELT",
      subtitle: "Zero Waiting Times",
      description: "Instant crafting on standard tier items and ultra-fast furnace smelting so you spend more time roaming and raiding.",
      icon: "Flame",
      badge: "INSTANT",
    },
    {
      id: "pvp",
      title: "COMPETITIVE PVP",
      subtitle: "High-Octane Action",
      description: "Dedicated roaming zones, customized high-value airdrops, and competitive combat tuned for skilled Rust players.",
      icon: "Crosshair",
      badge: "PVP FOCUSED",
    },
    {
      id: "performance",
      title: "100HZ TICKRATE",
      subtitle: "Zero Lag Infrastructure",
      description: "Hosted on bare-metal enterprise servers with advanced DDoS mitigation and optimized entity cleanup for silky smooth FPS.",
      icon: "Cpu",
      badge: "DEDICATED",
    },
    {
      id: "qol",
      title: "BALANCED QOL",
      subtitle: "Refined Rust Gameplay",
      description: "Smart auto-auth on turrets, auto-doors, custom stack sizes, skinbox integration, and clans support without game-breaking P2W.",
      icon: "Sparkles",
      badge: "NO P2W",
    },
    {
      id: "anticheat",
      title: "ACTIVE ADMINS & ANTICHEAT",
      subtitle: "Fair Play Guaranteed",
      description: "Custom heuristic anticheat detection with round-the-clock staff monitoring and active ticket resolution on Discord.",
      icon: "ShieldCheck",
      badge: "24/7 ACTIVE",
    },
  ],
  rules: [
    {
      id: "rule-1",
      number: "01",
      title: "No Cheating, Scripting, or Third-Party Exploits",
      summary: "Zero tolerance for any external software, recoil scripts, or malicious hacks.",
      details: "Any use of third-party software, aimbots, ESP, crosshair overlays providing unfair advantages, mouse macros, or bloody mouse scripts will result in an immediate and permanent server ban without appeal.",
    },
    {
      id: "rule-2",
      number: "02",
      title: "Team Size & Clan Limit (Strict Max 5)",
      summary: "Group size must strictly adhere to the designated server team limit.",
      details: "No alliances, roaming in groups larger than 5, or rotating members in/out to bypass clan caps. Code locks, sleeping bags, and authorization on turrets must strictly contain team members only.",
    },
    {
      id: "rule-3",
      number: "03",
      title: "Fair Play & No Game/Map Glitching",
      summary: "Exploiting terrain, building inside unraidable rock glitches, or abusing bugs is prohibited.",
      details: "Do not build inside rock meshes, abuse terrain clipping, or exploit known engine bugs to hide loot. Unraidable glitch bases will be deleted without compensation.",
    },
    {
      id: "rule-4",
      number: "04",
      title: "Community Conduct & Chat Guidelines",
      summary: "Keep the chat competitive yet free from toxic hate speech and doxxing.",
      details: "Extreme toxicity, racial slurs, doxxing, DDOS threats, or server advertising in global chat or voice will result in mutes or bans. Healthy trash talk is permitted, but keep it within the game.",
    },
  ],
  socials: {
    discord: "https://discord.gg/goat5x",
    steam: "steam://connect/168.100.161.129:28056",
  },
};
