import { create } from "zustand";

interface GridState {
  gridCount: 1 | 16;
  seedLock: boolean;
  lockedSeed: number;
  image: string;
  seeds: number[];
  isGenerating: boolean;

  setGridCount: (count: 1 | 16) => void;
  setSeedLock: (locked: boolean) => void;
  setLockedSeed: (seed: number) => void;
  setResult: (image: string, seeds: number[]) => void;
  setGenerating: (isGenerating: boolean) => void;
}

export const useGridStore = create<GridState>((set) => ({
  gridCount: 16,
  seedLock: false,
  lockedSeed: 42,
  image: "",
  seeds: [],
  isGenerating: false,

  setGridCount: (gridCount) => set({ gridCount }),
  setSeedLock: (seedLock) => set({ seedLock }),
  setLockedSeed: (lockedSeed) => set({ lockedSeed }),
  setResult: (image, seeds) => set({ image, seeds, isGenerating: false }),
  setGenerating: (isGenerating) => set({ isGenerating }),
}));
