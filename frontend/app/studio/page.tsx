"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useStudioStore } from "@/store/useStudioStore";
import { sculptFace } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/GlassCard";
import { SeedInput } from "@/components/ui/SeedInput";
import { LatentSlider } from "@/components/ui/LatentSlider";
import { FaceStage } from "@/components/ui/FaceStage";
import { CompareSlider } from "@/components/ui/CompareSlider";
import {
  RotateCcw,
  Layers,
  Split,
  Eye,
  SlidersHorizontal,
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
        <div className="flex items-center gap-1.5 bg-surface-elevated p-1 rounded-xl border border-border-subtle">
          <button
            type="button"
            onClick={() => setCompareMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              !isCompareMode
                ? "bg-surface text-accent font-semibold shadow-xs border border-border-subtle"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            type="button"
            onClick={() => setCompareMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isCompareMode
                ? "bg-surface text-accent font-semibold shadow-xs border border-border-subtle"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Wipe Handle</span>
          </button>

          <span className="text-border-strong select-none">|</span>

          {/* Native 64px Toggle */}
          <button
            type="button"
            onClick={() => setNative64(!isNative64)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              isNative64
                ? "bg-accent-subtle text-accent border border-accent/30 font-medium"
                : "text-text-muted hover:text-text-primary"
            }`}
            title="Toggle Raw 64x64 Pixelated View"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Native 64px</span>
          </button>
        </div>
      </PageHeader>

      {/* Main Workspace: Stage (left) + Control Panel (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* STAGE ZONE */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-6 relative">
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
                  <div className="text-center text-[11px] font-mono text-text-muted">
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
                  <div className="text-center text-[11px] font-mono text-accent font-medium">
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
                <div className="text-center text-[11px] font-mono text-text-muted">
                  Drag handle or use ← / → arrow keys to compare identities
                </div>
              </div>
            )}

            {/* Scientific Monospace Telemetry Footer */}
            <div className="mt-6 pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-text-muted">
              <div className="flex items-center gap-4">
                <span>
                  seed: <strong className="text-text-primary">#{seed}</strong>
                </span>
                <span>
                  ||z||: <strong className="text-accent">{zNorm}</strong>
                </span>
                <span>
                  ||Δ||:{" "}
                  <strong
                    className={delta > 0 ? "text-accent" : "text-text-secondary"}
                  >
                    {delta}
                  </strong>
                </span>
              </div>

              <div className="text-[11px] text-text-muted">
                Hypersphere Norm-Preserved
              </div>
            </div>
          </Card>
        </div>

        {/* CONTROLS ZONE */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <SlidersHorizontal className="w-4 h-4 text-accent" />
                <span>Latent Attributes</span>
              </div>
              <button
                type="button"
                onClick={resetSliders}
                className="flex items-center gap-1 text-[11px] font-mono text-text-muted hover:text-accent transition-colors cursor-pointer"
                title="Reset all feature sliders"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            </div>

            {/* Seed & Preset Controller */}
            <SeedInput value={seed} onChange={setSeed} disabled={isLoading} />

            <div className="border-t border-border-subtle pt-4 space-y-4">
              {/* Sliders */}
              <LatentSlider
                label="Smile Intensity"
                leftPole="Neutral"
                rightPole="Smile"
                value={smile}
                onChange={(val) => setSlider("smile", val)}
                disabled={isLoading}
              />

              <LatentSlider
                label="Head Turn / Pose"
                leftPole="Left"
                rightPole="Right"
                value={pose}
                onChange={(val) => setSlider("pose", val)}
                disabled={isLoading}
              />

              <LatentSlider
                label="Hair Volume / Gender Tilt"
                leftPole="Masculine"
                rightPole="Feminine"
                value={hair}
                onChange={(val) => setSlider("hair", val)}
                disabled={isLoading}
              />

              <LatentSlider
                label="Scene Brightness"
                leftPole="Low Key"
                rightPole="Bright"
                value={light}
                onChange={(val) => setSlider("light", val)}
                disabled={isLoading}
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualApply}
                disabled={isLoading}
                className="flex-1 py-2 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Identity</span>
              </button>

              <button
                type="button"
                onClick={resetSliders}
                disabled={isLoading || delta === 0}
                className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-border-subtle text-text-secondary hover:text-text-primary transition-colors disabled:opacity-30 cursor-pointer"
                title="Reset Sliders"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-20 font-mono text-xs text-text-muted">
          Loading Latent Studio...
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
