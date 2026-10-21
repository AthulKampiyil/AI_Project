import { create } from "zustand";

interface MorphState {
  seedA: number;
  seedB: number;
  mode: "slerp" | "lerp";
  steps: number;
  fps: number;
  gifUrl: string;
  frames: string[];
  lerpStrip: string[];
  slerpStrip: string[];
  isGenerating: boolean;
  isStripsLoading: boolean;

  setSeedA: (seedA: number) => void;
  setSeedB: (seedB: number) => void;
  setMode: (mode: "slerp" | "lerp") => void;
  setSteps: (steps: number) => void;
  setFps: (fps: number) => void;
  setReel: (gifUrl: string, frames: string[]) => void;
  setStrips: (lerpStrip: string[], slerpStrip: string[]) => void;
  setGenerating: (isGenerating: boolean) => void;
  setStripsLoading: (isStripsLoading: boolean) => void;
}

export const useMorphStore = create<MorphState>((set) => ({
  seedA: 42,
  seedB: 105,
  mode: "slerp",
  steps: 20,
  fps: 16,
  gifUrl: "",
  frames: [],
  lerpStrip: [],
  slerpStrip: [],
  isGenerating: false,
  isStripsLoading: false,

  setSeedA: (seedA) => set({ seedA }),
  setSeedB: (seedB) => set({ seedB }),
  setMode: (mode) => set({ mode }),
  setSteps: (steps) => set({ steps }),
  setFps: (fps) => set({ fps }),
  setReel: (gifUrl, frames) => set({ gifUrl, frames, isGenerating: false }),
  setStrips: (lerpStrip, slerpStrip) =>
    set({ lerpStrip, slerpStrip, isStripsLoading: false }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setStripsLoading: (isStripsLoading) => set({ isStripsLoading }),
}));
