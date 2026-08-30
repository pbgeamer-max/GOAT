import React, { createContext, useContext, useState, useEffect } from "react";

export type PageId =
  | "home"
  | "wipes"
  | "store"
  | "players"
  | "voice"
  | "rules"
  | "maps"
  | "how-to-play"
  | "discord"
  | "overwatch";

interface NavigationContextType {
  activePage: PageId;
  navigate: (page: PageId) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  activePage: "home",
  navigate: () => {},
});

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getPageFromHash = (): PageId => {
    const hash = window.location.hash.replace(/^#\/?/, "").toLowerCase();
    const validPages: PageId[] = [
      "home",
      "wipes",
      "store",
      "players",
      "voice",
      "rules",
      "maps",
      "how-to-play",
      "discord",
      "overwatch",
    ];

    if (hash === "leaderboard" || hash === "stats") return "players";
    if (hash === "servers" || hash === "server") return "maps";
    if (hash === "report" || hash === "rule") return "rules";
    if (hash === "wipe") return "wipes";

    if (validPages.includes(hash as PageId)) {
      return hash as PageId;
    }
    return "home";
  };

  const [activePage, setActivePage] = useState<PageId>(getPageFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      const page = getPageFromHash();
      setActivePage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (page: PageId) => {
    window.location.hash = page;
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <NavigationContext.Provider value={{ activePage, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
