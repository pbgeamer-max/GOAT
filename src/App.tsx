import React from "react";
import { ServerProvider } from "@/context/ServerContext";
import { AuthProvider } from "@/context/AuthContext";
import { NavigationProvider, useNavigation } from "@/context/NavigationContext";
import { Navbar } from "@/components/Navbar";
import { EmberBackground } from "@/components/EmberBackground";
import { Footer } from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { UserProfileModal } from "@/components/UserProfileModal";

// Dedicated Pages
import { HomePage } from "@/pages/HomePage";
import { WipesPage } from "@/pages/WipesPage";
import { StorePage } from "@/pages/StorePage";
import { PlayersPage } from "@/pages/PlayersPage";
import { VoiceRewardsPage } from "@/pages/VoiceRewardsPage";
import { ReportRulesPage } from "@/pages/ReportRulesPage";
import { MapsPage } from "@/pages/MapsPage";
import { HowToPlayPage } from "@/pages/HowToPlayPage";
import { DiscordPage } from "@/pages/DiscordPage";
import { OverwatchPage } from "@/pages/OverwatchPage";

const MainContent: React.FC = () => {
  const { activePage } = useNavigation();

  const renderPage = () => {
    switch (activePage) {
      case "wipes":
        return <WipesPage />;
      case "store":
        return <StorePage />;
      case "players":
        return <PlayersPage />;
      case "voice":
        return <VoiceRewardsPage />;
      case "rules":
        return <ReportRulesPage />;
      case "maps":
        return <MapsPage />;
      case "how-to-play":
        return <HowToPlayPage />;
      case "discord":
        return <DiscordPage />;
      case "overwatch":
        return <OverwatchPage />;
      case "home":
      default:
        return <HomePage />;
    }
  };

  return (
    <main className="relative z-10 flex flex-col flex-grow min-h-[85vh]">
      {renderPage()}
    </main>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ServerProvider>
          <NavigationProvider>
            <div className="relative min-h-screen flex flex-col bg-[#06080d] text-foreground overflow-hidden">
              {/* Ambient Rust fire ember sparks canvas */}
              <EmberBackground />

              {/* Navigation Header with Live Tab Switching */}
              <Navbar />

              {/* Account Linking & Stats Modal */}
              <UserProfileModal />

              {/* Dynamic Dedicated Page View */}
              <MainContent />

              {/* Minimalist Dark Gaming Footer */}
              <Footer />
            </div>
          </NavigationProvider>
        </ServerProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
