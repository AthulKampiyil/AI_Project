import { create } from "zustand";

interface StudioState {
  seed: number;
  isNative64: boolean;
  image: string;
  isLoading: boolean;

  setSeed: (seed: number) => void;
  setNative64: (val: boolean) => void;
  setResult: (image: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  seed: 42,
  isNative64: false,
  image: "",
  isLoading: false,

  setSeed: (seed) => set({ seed }),
  setNative64: (isNative64) => set({ isNative64 }),
  setResult: (image) => set({ image, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
