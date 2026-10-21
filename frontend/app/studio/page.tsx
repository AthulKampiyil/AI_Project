"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useStudioStore } from "@/store/useStudioStore";
import { sculptFace } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { SeedInput } from "@/components/ui/SeedInput";
import { LatentSlider } from "@/components/ui/LatentSlider";
import { FaceStage } from "@/components/ui/FaceStage";
import { CompareSlider } from "@/components/ui/CompareSlider";
import {
  RotateCcw,
  Sparkles,
  Layers,
  Split,
  Eye,
  Sliders,
  Check,
} from "lucide-react";
import { Suspense } from "react";

function StudioContent() {
  const searchParams = useSearchParams();
  const urlSeed = searchParams.get("seed");

  const {
    seed,
    smile,
    pose,
    hair,
    light,
    isNative64,
    isCompareMode,
    baseImage,
    sculptedImage,
    zNorm,
    delta,
    isLoading,
    setSeed,
    setSlider,
    resetSliders,
    setNative64,
    setCompareMode,
    setResult,
    setLoading,
  } = useStudioStore();

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync seed from URL query param if present
  useEffect(() => {
    if (urlSeed) {
      const parsed = parseInt(urlSeed, 10);
      if (!isNaN(parsed) && parsed !== seed) {
        setSeed(parsed);
      }
    }
  }, [urlSeed, setSeed, seed]);

  // Execute synthesis with cancellation & debounce
  const runSculpt = useCallback(
    async (s: number, sm: number, p: number, h: number, l: number) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      try {
        const res = await sculptFace(
          { seed: s, smile: sm, pose: p, hair: h, light: l },
          abortControllerRef.current.signal
        );
        setResult(res.base, res.sculpted, res.zNorm);
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          setLoading(false);
        }
      }
    },
    [setLoading, setResult]
  );

  // Debounced live update on parameter changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      runSculpt(seed, smile, pose, hair, light);
    }, 120);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [seed, smile, pose, hair, light, runSculpt]);

  const handleManualApply = () => {
    runSculpt(seed, smile, pose, hair, light);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facial Math Studio"
        subtitle="Perform linear vector arithmetic along learned attribute directions. Modified latents are projected back onto the Gaussian hypersphere to prevent artifacting."
        badge="100-D Hypersphere"
      >
        {/* Stage View Toggles */}
        <div className="flex items-center gap-2 bg-[#0E1018] p-1.5 rounded-2xl border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setCompareMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              !isCompareMode
                ? "bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30 font-semibold"
                : "text-[#8B8FA3] hover:text-[#EDEEF3]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            type="button"
            onClick={() => setCompareMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              isCompareMode
                ? "bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30 font-semibold"
                : "text-[#8B8FA3] hover:text-[#EDEEF3]"
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Wipe Handle</span>
          </button>

          <span className="text-white/10">|</span>

          {/* Native 64px Toggle */}
          <button
            type="button"
            onClick={() => setNative64(!isNative64)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
              isNative64
                ? "bg-[#38E1FF]/15 text-[#38E1FF] border border-[#38E1FF]/30"
                : "text-[#8B8FA3] hover:text-[#EDEEF3]"
            }`}
            title="Toggle Raw 64x64 Pixelated View"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Native 64px</span>
          </button>
        </div>
      </PageHeader>

      {/* Main Workspace: Stage (left) + Control Panel (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* STAGE ZONE (Large soft lit specimen stages) */}
        <div className="lg:col-span-8 space-y-4">
          <GlassCard className="p-6 relative">
            {!isCompareMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FaceStage
                    src={baseImage}
                    loading={isLoading}
                    label="BASE"
                    seed={seed}
                    pixelated={isNative64}
                  />
                  <div className="text-center text-[11px] font-mono text-[#8B8FA3]">
                    Original Latent Specimen
                  </div>
                </div>

                <div className="space-y-2">
                  <FaceStage
                    src={sculptedImage}
                    loading={isLoading}
                    label="SCULPTED"
                    seed={seed}
                    pixelated={isNative64}
                  />
                  <div className="text-center text-[11px] font-mono text-[#8B7CFF]">
                    Vector Modified (z + Δz)
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-2">
                <CompareSlider
                  baseImage={baseImage}
                  sculptedImage={sculptedImage}
                  pixelated={isNative64}
                />
                <div className="text-center text-[11px] font-mono text-[#8B8FA3]">
                  Drag handle or use ← / → arrow keys to compare identities
                </div>
              </div>
            )}

            {/* Scientific Monospace Telemetry Footer */}
            <div className="mt-6 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#8B8FA3]">
              <div className="flex items-center gap-4">
                <span>
                  seed: <strong className="text-[#EDEEF3]">#{seed}</strong>
                </span>
                <span>
                  ||z||: <strong className="text-[#38E1FF]">{zNorm}</strong>
                </span>
                <span>
                  ||Δ||:{" "}
                  <strong
                    className={delta > 0 ? "text-[#8B7CFF]" : "text-[#8B8FA3]"}
                  >
                    {delta}
                  </strong>
                </span>
              </div>

              <div className="text-[11px] text-[#8B8FA3]/80">
                Hypersphere Norm-Preserved
              </div>
            </div>
          </GlassCard>
        </div>

        {/* CONTROLS ZONE (340px slim precision glass control panel) */}
        <div className="lg:col-span-4 space-y-4">
          <GlassCard className="p-5 space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#EDEEF3]">
                <Sliders className="w-4 h-4 text-[#8B7CFF]" />
                <span>Latent Attributes</span>
              </div>
              <button
                type="button"
                onClick={resetSliders}
                className="flex items-center gap-1 text-[11px] font-mono text-[#8B8FA3] hover:text-[#8B7CFF] transition-colors"
                title="Reset all feature sliders"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            </div>

            {/* Seed & Preset Controller */}
            <SeedInput value={seed} onChange={setSeed} disabled={isLoading} />

            <div className="border-t border-white/[0.06] pt-4 space-y-5">
              {/* Sliders */}
              <LatentSlider
                label="Smile Intensity"
                leftPole="Serious / Neutral"
                rightPole="Broad Smile"
                value={smile}
                onChange={(val) => setSlider("smile", val)}
                disabled={isLoading}
              />

              <LatentSlider
                label="Head Turn / Pose"
                leftPole="Turn Left"
                rightPole="Turn Right"
                value={pose}
                onChange={(val) => setSlider("pose", val)}
                disabled={isLoading}
              />

              <LatentSlider
                label="Hair Volume / Gender Tilt"
                leftPole="Masculine Tilt"
                rightPole="Feminine / Volume"
                value={hair}
                onChange={(val) => setSlider("hair", val)}
                disabled={isLoading}
              />

              <LatentSlider
                label="Scene Brightness"
                leftPole="Low Key Studio"
                rightPole="Specular Bright"
                value={light}
                onChange={(val) => setSlider("light", val)}
                disabled={isLoading}
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleManualApply}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8B7CFF] to-[#9B8EFF] hover:opacity-95 text-black font-semibold text-xs transition-all shadow-[0_0_20px_rgba(139,124,255,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Apply Identity</span>
              </button>

              <button
                type="button"
                onClick={resetSliders}
                disabled={isLoading || delta === 0}
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#EDEEF3] transition-colors disabled:opacity-30"
                title="Reset Sliders"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-20 font-mono text-xs text-[#8B8FA3]">
          Loading Latent Studio...
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
