import { create } from "zustand";
import { fetchHealth } from "../lib/api";

interface HealthState {
  weightsLoaded: boolean;
  device: string;
  latencyMs: number;
  modelId: string | null;
  sculptAvailable: boolean;
  isWaking: boolean;
  lastChecked: number;
  pollHealth: () => Promise<void>;
}

export const useHealthStore = create<HealthState>((set) => ({
  weightsLoaded: false,
  device: "Detecting...",
  latencyMs: 0,
  modelId: null,
  sculptAvailable: false,
  isWaking: false,
  lastChecked: 0,

  pollHealth: async () => {
    try {
      const res = await fetchHealth();
      set({
        weightsLoaded: res.weightsLoaded,
        device: res.device,
        latencyMs: res.latencyMs,
        modelId: res.modelId ?? null,
        sculptAvailable: res.sculptAvailable ?? false,
        isWaking: false,
        lastChecked: Date.now(),
      });
    } catch {
      set({
        weightsLoaded: false,
        modelId: null,
        sculptAvailable: false,
        isWaking: true,
      });
    }
  },
}));
