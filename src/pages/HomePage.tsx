import React from "react";
import { HeroSection } from "@/components/HeroSection";
import { StatsDashboard } from "@/components/StatsDashboard";
import { ServerFeatures } from "@/components/ServerFeatures";
import { WipeSection } from "@/components/WipeSection";
import { DiscordSection } from "@/components/DiscordSection";

export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col animate-in fade-in duration-300">
      {/* 1:1 Atlas Hero Section with Live Telemetry & F1 Connect */}
      <HeroSection />

      {/* Steam + Discord Linking Callout */}
      <StatsDashboard />

      {/* Server Key Advantages & 5X Features */}
      <ServerFeatures />

      {/* Wipe Countdown Preview */}
      <WipeSection />

      {/* Discord Community Callout */}
      <DiscordSection />
    </div>
  );
};
