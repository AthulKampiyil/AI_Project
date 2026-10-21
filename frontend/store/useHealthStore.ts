import { create } from "zustand";
import { fetchHealth } from "../lib/api";

interface HealthState {
  weightsLoaded: boolean;
  device: string;
  latencyMs: number;
  isWaking: boolean;
  lastChecked: number;
  pollHealth: () => Promise<void>;
}

export const useHealthStore = create<HealthState>((set) => ({
  weightsLoaded: false,
  device: "Detecting...",
  latencyMs: 0,
  isWaking: false,
  lastChecked: 0,

  pollHealth: async () => {
    try {
      const res = await fetchHealth();
      set({
        weightsLoaded: res.weightsLoaded,
        device: res.device,
        latencyMs: res.latencyMs,
        isWaking: false,
        lastChecked: Date.now(),
      });
    } catch {
      set({ isWaking: true });
    }
  },
}));
