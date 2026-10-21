import { create } from "zustand";

interface StudioState {
  seed: number;
  smile: number;
  pose: number;
  hair: number;
  light: number;
  isNative64: boolean;
  isCompareMode: boolean;
  comparePosition: number;
  baseImage: string;
  sculptedImage: string;
  zNorm: number;
  isLoading: boolean;
  delta: number;

  setSeed: (seed: number) => void;
  setSlider: (key: "smile" | "pose" | "hair" | "light", value: number) => void;
  resetSliders: () => void;
  setNative64: (val: boolean) => void;
  setCompareMode: (val: boolean) => void;
  setComparePosition: (pos: number) => void;
  setResult: (base: string, sculpted: string, zNorm: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  seed: 42,
  smile: 0.0,
  pose: 0.0,
  hair: 0.0,
  light: 0.0,
  isNative64: false,
  isCompareMode: false,
  comparePosition: 50,
  baseImage: "",
  sculptedImage: "",
  zNorm: 9.98,
  isLoading: false,
  delta: 0.0,

  setSeed: (seed) =>
    set({
      seed,
      smile: 0.0,
      pose: 0.0,
      hair: 0.0,
      light: 0.0,
      delta: 0.0,
    }),

  setSlider: (key, value) =>
    set((state) => {
      const next = { ...state, [key]: value };
      const delta = Math.sqrt(
        next.smile ** 2 + next.pose ** 2 + next.hair ** 2 + next.light ** 2
      );
      return { ...next, delta: parseFloat(delta.toFixed(2)) };
    }),

  resetSliders: () =>
    set({
      smile: 0.0,
      pose: 0.0,
      hair: 0.0,
      light: 0.0,
      delta: 0.0,
    }),

  setNative64: (isNative64) => set({ isNative64 }),
  setCompareMode: (isCompareMode) => set({ isCompareMode }),
  setComparePosition: (comparePosition) => set({ comparePosition }),
  setResult: (baseImage, sculptedImage, zNorm) =>
    set({ baseImage, sculptedImage, zNorm, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
