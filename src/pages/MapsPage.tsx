import React, { useState } from "react";
import { ServerDetails } from "@/components/ServerDetails";
import { Map, Cpu, HardDrive, Shield, Copy, Check, Terminal } from "lucide-react";
import { useServer } from "@/context/ServerContext";
import { copyToClipboard } from "@/lib/utils";
import { useToast } from "@/components/Toast";

export const MapsPage: React.FC = () => {
  const { status, connectCommand } = useServer();
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopyF1 = async () => {
    const success = await copyToClipboard(connectCommand);
    if (success) {
      setCopied(true);
      showToast(connectCommand, "success");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-bold uppercase tracking-widest mb-4">
          <Map className="w-3.5 h-3.5" /> LIVE SERVER NODE & MAP
        </div>
        <h1 className="font-display font-black text-4xl sm:text-6xl text-white uppercase tracking-tight">
          SERVER MAP <span className="text-red-500">&</span> SPECIFICATIONS
        </h1>
        <p className="text-zinc-400 text-sm sm:text-base font-sans max-w-2xl mt-2">
          Hosted on bare-metal enterprise hardware optimized for high-tickrate Rust gameplay. Zero rubber-banding, low latency, and 99.9% uptime.
        </p>
      </div>

      {/* Direct Connect Banner */}
      <div className="mb-12 p-6 sm:p-8 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1">Direct Game Connect</div>
          <div className="font-mono font-black text-xl sm:text-2xl text-white tracking-wider">
            {status.ip}:{status.port}
          </div>
        </div>
        <button
          onClick={handleCopyF1}
          className="atlas-btn-red px-6 py-3.5 text-white font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Terminal className="w-4 h-4" />}
          <span>{copied ? "COPIED TO CLIPBOARD!" : "COPY F1 COMMAND"}</span>
        </button>
      </div>

      {/* Server Hardware & Node Details */}
      <ServerDetails />
    </div>
  );
};
