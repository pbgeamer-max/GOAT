import React from "react";
import { ServerProvider } from "@/context/ServerContext";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { EmberBackground } from "@/components/EmberBackground";
import { HeroSection } from "@/components/HeroSection";
import { StoreSection } from "@/components/StoreSection";
import { VoiceRewardsSection } from "@/components/VoiceRewardsSection";
import { StatsDashboard } from "@/components/StatsDashboard";
import { LeaderboardSection } from "@/components/LeaderboardSection";
import { ServerFeatures } from "@/components/ServerFeatures";
import { ServerDetails } from "@/components/ServerDetails";
import { WipeSection } from "@/components/WipeSection";
import { HowToPlay } from "@/components/HowToPlay";
import { RulesSection } from "@/components/RulesSection";
import { DiscordSection } from "@/components/DiscordSection";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { UserProfileModal } from "@/components/UserProfileModal";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ServerProvider>
          <div className="relative min-h-screen flex flex-col bg-[#06080d] text-foreground overflow-hidden">
            {/* Ambient Rust fire ember sparks canvas */}
            <EmberBackground />

            {/* Atlas 1:1 Navigation Header */}
            <Navbar />

            {/* Account Linking & Stats Modal */}
            <UserProfileModal />

            {/* Page Content Sections */}
            <main className="relative z-10 flex flex-col flex-grow">
              {/* 1:1 Atlas Hero Section with Live Telemetry & F1 Connect */}
              <HeroSection />

              {/* 1:1 Atlas Store & In-Game Kits (/kit discord, /kit booster, VIP) */}
              <StoreSection />

              {/* Discord Voice Calls & Clan Tracking Showcase */}
              <VoiceRewardsSection />

              {/* Steam + Discord Linking Callout */}
              <StatsDashboard />

              {/* Top 10 Leaderboard (PvP Kills, K/D, Voice Hours, Farm, Raids) */}
              <LeaderboardSection />

              {/* Next Wipe Countdown & Wipe Calendar */}
              <WipeSection />

              {/* Server Key Advantages */}
              <ServerFeatures />

              {/* Detailed Server Node Specifications */}
              <ServerDetails />

              {/* How to Connect 3-Step Guide */}
              <HowToPlay />

              {/* Server Rules & Anti-Cheat Regulations */}
              <RulesSection />

              {/* Discord Community Callout */}
              <DiscordSection />
            </main>

            {/* Minimalist Dark Gaming Footer */}
            <Footer />
          </div>
        </ServerProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
