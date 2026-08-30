import React, { createContext, useContext, useState, useEffect } from "react";

export interface PlayerStats {
  steam_id: string;
  kills?: number;
  deaths?: number;
  kd_ratio?: number;
  playtime_seconds?: number;
  headshots?: number;
  structures_built?: number;
  explosives_used?: number;
  wood_gathered?: number;
  stone_gathered?: number;
  metal_gathered?: number;
  sulfur_gathered?: number;
  last_seen?: string;
}

export interface UserProfile {
  steam_id: string;
  steam_name: string;
  avatar: string;
  profile_url: string;
  discord_id?: string | null;
  discord_tag?: string | null;
  discord_avatar?: string | null;
  is_linked: boolean;
  is_booster?: boolean;
  role_granted: number;
  kit_granted: number;
  linked_at?: string;
  stats?: PlayerStats;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isProfileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  loginWithSteam: () => void;
  linkDiscord: () => void;
  logout: () => void;
  claimKit: () => Promise<{ success: boolean; message?: string; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user session:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    // Check URL parameters for status toasts
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status === "steam_connected" || status === "linked_success") {
      setIsProfileOpen(true);
      // Clean query params from URL without reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loginWithSteam = () => {
    window.location.href = "/auth/steam";
  };

  const linkDiscord = () => {
    window.location.href = "/auth/discord";
  };

  const logout = () => {
    window.location.href = "/auth/logout";
  };

  const claimKit = async () => {
    try {
      const res = await fetch("/api/claim-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        await fetchCurrentUser();
        return { success: true, message: data.message || "Kit unlocked on the server!" };
      } else {
        return { success: false, error: data.error || "Failed to claim kit." };
      }
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isProfileOpen,
        openProfile: () => setIsProfileOpen(true),
        closeProfile: () => setIsProfileOpen(false),
        loginWithSteam,
        linkDiscord,
        logout,
        claimKit,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
