import { create } from "zustand";

interface MatchState {
  file: File | null;
  previewUrl: string | null;
  iterations: number;
  targetImage: string;
  twinImage: string;
  mseInitial: number;
  mseFinal: number;
  reductionPct: number;
  isOptimizing: boolean;

  setFile: (file: File | null) => void;
  setIterations: (iterations: number) => void;
  setResult: (target: string, twin: string, mseInitial: number, mseFinal: number) => void;
  setOptimizing: (isOptimizing: boolean) => void;
  reset: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  file: null,
  previewUrl: null,
  iterations: 35,
  targetImage: "",
  twinImage: "",
  mseInitial: 0.081,
  mseFinal: 0.019,
  reductionPct: 76.5,
  isOptimizing: false,

  setFile: (file) =>
    set({
      file,
      previewUrl: file ? URL.createObjectURL(file) : null,
      targetImage: "",
      twinImage: "",
    }),
  setIterations: (iterations) => set({ iterations }),
  setResult: (targetImage, twinImage, mseInitial, mseFinal) => {
    const reductionPct = Math.max(
      0,
      ((mseInitial - mseFinal) / (mseInitial + 1e-6)) * 100
    );
    set({
      targetImage,
      twinImage,
      mseInitial,
      mseFinal,
      reductionPct: parseFloat(reductionPct.toFixed(1)),
      isOptimizing: false,
    });
  },
  setOptimizing: (isOptimizing) => set({ isOptimizing }),
  reset: () =>
    set({
      file: null,
      previewUrl: null,
      targetImage: "",
      twinImage: "",
      mseInitial: 0.081,
      mseFinal: 0.019,
      reductionPct: 76.5,
      isOptimizing: false,
    }),
}));
