import React from "react";
import { LeaderboardSection } from "@/components/LeaderboardSection";
import { StatsDashboard } from "@/components/StatsDashboard";

export const PlayersPage: React.FC = () => {
  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto w-full animate-in fade-in duration-300">
      {/* Main Leaderboard */}
      <div className="mb-16">
        <LeaderboardSection />
      </div>

      {/* Profile & Linking Section */}
      <div className="mt-12">
        <StatsDashboard />
      </div>
    </div>
  );
};
