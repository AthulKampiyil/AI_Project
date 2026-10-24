"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGridStore } from "@/store/useGridStore";
import { fetchGrid } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/GlassCard";
import { FaceStage } from "@/components/ui/FaceStage";
import { generateMockFaceSvg } from "@/lib/mockData";
import {
  Grid as GridIcon,
  Lock,
  Unlock,
  Download,
  ExternalLink,
  User,
} from "lucide-react";

export default function GridPage() {
  const router = useRouter();
  const {
    gridCount,
    seedLock,
    lockedSeed,
    image,
    seeds,
    isGenerating,
    setGridCount,
    setSeedLock,
    setLockedSeed,
    setResult,
    setGenerating,
  } = useGridStore();

  const [hoveredTileIndex, setHoveredTileIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const isDemo = process.env.NEXT_PUBLIC_MOCK === "1";

  const handleGenerate = useCallback(async (n: 1 | 16) => {
    setGridCount(n);
    setGenerating(true);
    setError("");
    try {
      const activeSeed = seedLock ? lockedSeed : undefined;
      const res = await fetchGrid({ n, seed: activeSeed });
      setResult(res.image, res.seeds);
    } catch {
      setResult("", []);
      setError("Could not generate faces. Check the connection and try again.");
    }
  }, [seedLock, lockedSeed, setGridCount, setGenerating, setResult]);

  useEffect(() => {
    if (!image && !error) {
      const timer = window.setTimeout(() => void handleGenerate(16), 0);
      return () => window.clearTimeout(timer);
    }
  }, [handleGenerate, image, error]);

  const shownImage = error ? "" : image;
  const shownSeeds = error ? [] : seeds;

  const handleDownload = () => {
    if (!image || error) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `dcgan_grid_${gridCount}faces.${isDemo ? "svg" : "png"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleTileClick = (tileSeed: number) => {
    router.push(`/studio?seed=${tileSeed}`);
  };

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <PageHeader
        title="Classic Grid Generator"
        subtitle="Sample random Gaussian noise vectors z ~ N(0, I) through the DCGAN generator. Click a tile to preview its seed in Seed Studio."
        badge="Monte Carlo Sampling"
      >
        <button
          type="button"
          onClick={handleDownload}
          disabled={!image || !!error || (isDemo && gridCount === 16)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border-subtle text-xs font-mono text-text-primary transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-text-muted" />
          <span>{isDemo && gridCount === 16 ? "Demo tiles · no composite download" : isDemo ? "Save demo SVG" : "Save PNG"}</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Grid / Single Portrait Display */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-6 flex flex-col items-center justify-center">
            {gridCount === 1 ? (
              <div className="max-w-sm w-full space-y-3">
                <FaceStage
                  src={shownImage}
                  loading={isGenerating}
                  label="PORTRAIT"
                  seed={shownSeeds[0]}
                  onOpenStudio={handleTileClick}
                />
                <div className="text-center text-xs font-mono text-text-muted">
                  Seed: #{shownSeeds[0] ?? "—"} · Single Radford Latent Sample
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xl space-y-3">
                {/* 4x4 Interactive Mosaic */}
                <div className="grid grid-cols-4 gap-2.5 p-2 rounded-xl bg-surface-elevated border border-border-subtle">
                  {Array.from({ length: 16 }, (_, idx) => {
                    const currentSeed = shownSeeds[idx];
                    const isHovered = hoveredTileIndex === idx;

                    return (
                      <div
                        key={`tile-${idx}`}
                        onMouseEnter={() => setHoveredTileIndex(idx)}
                        onMouseLeave={() => setHoveredTileIndex(null)}
                        onClick={() => currentSeed !== undefined && handleTileClick(currentSeed)}
                        className={`group relative aspect-square rounded-lg overflow-hidden border ${currentSeed === undefined ? "" : "cursor-pointer"} transition-all duration-100 ${
                          isHovered
                            ? "border-accent scale-105 z-10 shadow-md ring-2 ring-accent/20"
                            : "border-border-subtle hover:border-border-strong bg-surface"
                        }`}
                        title={currentSeed === undefined ? "Waiting for generated face" : `Open seed #${currentSeed} in Seed Studio`}
                      >
                        {shownImage && (isDemo
                          ? <img src={generateMockFaceSvg(currentSeed ?? 0, {}, 128)} alt={`Demo face, seed ${currentSeed}`} className="w-full h-full object-cover" />
                          : <div role="img" aria-label={`Generated face, seed ${currentSeed}`} className="w-full h-full" style={{ backgroundImage: `url(${shownImage})`, backgroundSize: "400% 400%", backgroundPosition: `${(idx % 4) * 100 / 3}% ${Math.floor(idx / 4) * 100 / 3}%` }} />)}
                        {!shownImage && <span className="absolute inset-0 flex items-center justify-center text-[10px] text-text-muted">{error ? "Generation failed" : "No image"}</span>}
                        {currentSeed !== undefined && <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-center p-1 transition-opacity">
                          <ExternalLink className="w-3.5 h-3.5 text-white mb-1" />
                          <span className="text-[10px] font-mono text-white font-semibold">
                            #{currentSeed}
                          </span>
                          <span className="text-[9px] text-gray-300 font-mono">
                            Open Studio
                          </span>
                        </div>}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-text-muted px-2">
                  <span>Hover to reveal seed · Click to open in Studio</span>
                  <span className="text-accent font-medium">{isDemo ? "DEMO · 4×4 samples" : "4×4 Matrix (16 Faces)"}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Generator Controls */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-3 text-sm font-semibold text-text-primary">
              <GridIcon className="w-4 h-4 text-accent" />
              <span>Generation Modes</span>
            </div>

            {/* Buttons for 1 and 16 faces */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleGenerate(1)}
                disabled={isGenerating}
                className={`py-2.5 px-3 rounded-xl border font-medium text-xs transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  gridCount === 1
                    ? "bg-accent-subtle border-accent/40 text-accent font-semibold shadow-xs"
                    : "bg-surface-elevated border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Single Face</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerate(16)}
                disabled={isGenerating}
                className={`py-2.5 px-3 rounded-xl border font-medium text-xs transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  gridCount === 16
                    ? "bg-accent-subtle border-accent/40 text-accent font-semibold shadow-xs"
                    : "bg-surface-elevated border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                <GridIcon className="w-4 h-4" />
                <span>16 Mosaic (4×4)</span>
              </button>
            </div>

            {/* Seed Lock Toggle */}
            <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-primary font-medium flex items-center gap-1.5">
                  {seedLock ? (
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-text-muted" />
                  )}
                  <span>Seed Anchor Lock</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSeedLock(!seedLock)}
                  className={`text-xs font-mono px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    seedLock
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold"
                      : "bg-surface border border-border-subtle text-text-muted hover:text-text-primary"
                  }`}
                >
                  {seedLock ? "LOCKED" : "UNLOCKED"}
                </button>
              </div>

              {seedLock && (
                <div className="pt-1">
                  <input
                    type="number"
                    value={lockedSeed}
                    onChange={(e) => setLockedSeed(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-border-subtle text-xs font-mono text-text-primary outline-none focus:border-accent"
                    placeholder="Locked Seed"
                  />
                </div>
              )}
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={() => handleGenerate(gridCount)}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <GridIcon className="w-3.5 h-3.5" />
              <span>
                {isGenerating
                  ? "Sampling Gaussian Sphere..."
                  : `Generate Random ${gridCount === 1 ? "Face" : "4×4 Mosaic"}`}
              </span>
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
