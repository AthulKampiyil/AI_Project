"use client";

import React, { useEffect } from "react";
import { useHealthStore } from "@/store/useHealthStore";
import { Activity, Cpu, Loader2, Sparkles } from "lucide-react";

export const StatusChip: React.FC = () => {
  const { weightsLoaded, device, latencyMs, isWaking, pollHealth } =
    useHealthStore();

  useEffect(() => {
    pollHealth();
    const interval = setInterval(pollHealth, 15000);
    return () => clearInterval(interval);
  }, [pollHealth]);

  if (isWaking) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono animate-pulse">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
        <span>Waking the model...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-white/[0.08] bg-[#0E1018]/90 text-xs font-mono shadow-sm">
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            weightsLoaded ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-400"
          }`}
        />
        <span className="text-[#EDEEF3] font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#8B7CFF]" />
          {weightsLoaded ? "G: loaded" : "G: offline"}
        </span>
      </div>
      <span className="text-white/20">|</span>
      <div className="flex items-center gap-1 text-[#8B8FA3]">
        <Cpu className="w-3 h-3 text-[#38E1FF]" />
        <span>{device.includes("cuda") ? "CUDA" : device.includes("Mock") ? "MOCK" : "CPU"}</span>
      </div>
      <span className="text-white/20">|</span>
      <div className="flex items-center gap-1 text-[#8B8FA3]">
        <Activity className="w-3 h-3 text-emerald-400" />
        <span>{latencyMs > 0 ? `${latencyMs}ms` : "<45ms"}</span>
      </div>
    </div>
  );
};
