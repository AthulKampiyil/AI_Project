"use client";

import React, { useEffect } from "react";
import { useHealthStore } from "@/store/useHealthStore";
import { Activity, Cpu, Loader2 } from "lucide-react";

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
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono animate-pulse">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
        <span>Initializing weights...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-border-subtle bg-surface-elevated text-xs font-mono shadow-xs">
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            weightsLoaded ? "bg-emerald-500" : "bg-rose-500"
          }`}
        />
        <span className="text-text-primary font-medium">
          {weightsLoaded ? "G: ready" : "G: offline"}
        </span>
      </div>
      <span className="text-border-strong select-none">|</span>
      <div className="flex items-center gap-1 text-text-muted">
        <Cpu className="w-3 h-3 text-text-secondary" />
        <span>{device.includes("cuda") ? "CUDA" : device.includes("Mock") ? "MOCK" : "CPU"}</span>
      </div>
      <span className="text-border-strong select-none">|</span>
      <div className="flex items-center gap-1 text-text-muted">
        <Activity className="w-3 h-3 text-emerald-500" />
        <span>{latencyMs > 0 ? `${latencyMs}ms` : "<45ms"}</span>
      </div>
    </div>
  );
};
