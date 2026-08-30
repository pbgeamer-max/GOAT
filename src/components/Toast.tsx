"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, Copy } from "lucide-react";

interface ToastContextType {
  showToast: (message: string, type?: "success" | "info") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string; type: "success" | "info"; id: number } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "info" = "success") => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-obsidian-900/95 border border-rust-500/60 text-white px-5 py-3.5 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(249,115,22,0.35)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rust-500/20 text-rust-400 border border-rust-500/30">
            {toast.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5 text-rust-400" />}
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-sm tracking-wide uppercase text-white">
              {toast.type === "success" ? "Copied to Clipboard" : "Notice"}
            </span>
            <span className="font-mono text-xs text-zinc-300">
              {toast.message}
            </span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
