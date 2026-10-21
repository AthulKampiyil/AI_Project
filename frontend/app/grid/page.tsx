"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGridStore } from "@/store/useGridStore";
import { fetchGrid } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/GlassCard";
import { FaceStage } from "@/components/ui/FaceStage";
import {
  Grid as GridIcon,
  Lock,
  Unlock,
  Download,
  ExternalLink,
  User,
} from "lucide-react";
import { generateMockFaceSvg } from "@/lib/mockData";

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

  const handleGenerate = async (n: 1 | 16) => {
    setGridCount(n);
    setGenerating(true);
    try {
      const activeSeed = seedLock ? lockedSeed : undefined;
      const res = await fetchGrid({ n, seed: activeSeed });
      setResult(res.image, res.seeds);
    } catch {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!image) {
      handleGenerate(16);
    }
  }, []);

  const handleDownload = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `dcgan_grid_${gridCount}faces.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleTileClick = (tileSeed: number) => {
    router.push(`/studio?seed=${tileSeed}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classic Grid Generator"
        subtitle="Sample random Gaussian noise vectors z ~ N(0, I) through the Radford generator. Click any tile to import its latent seed directly into the Facial Math Studio."
        badge="Monte Carlo Sampling"
      >
        <button
          type="button"
          onClick={handleDownload}
          disabled={!image}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border-subtle text-xs font-mono text-text-primary transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-text-muted" />
          <span>Save PNG</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Grid / Single Portrait Display */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-6 flex flex-col items-center justify-center">
            {gridCount === 1 ? (
              <div className="max-w-sm w-full space-y-3">
                <FaceStage
                  src={image}
                  loading={isGenerating}
                  label="PORTRAIT"
                  seed={seeds[0]}
                  onOpenStudio={handleTileClick}
                />
                <div className="text-center text-xs font-mono text-text-muted">
                  Seed: #{seeds[0] ?? 42} · Single Radford Latent Sample
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xl space-y-3">
                {/* 4x4 Interactive Mosaic */}
                <div className="grid grid-cols-4 gap-2.5 p-2 rounded-xl bg-surface-elevated border border-border-subtle">
                  {Array.from({ length: 16 }, (_, idx) => {
                    const currentSeed = seeds[idx] ?? (42 + idx * 37);
                    const tileImg = generateMockFaceSvg(currentSeed, {}, 128);
                    const isHovered = hoveredTileIndex === idx;

                    return (
                      <div
                        key={`tile-${idx}`}
                        onMouseEnter={() => setHoveredTileIndex(idx)}
                        onMouseLeave={() => setHoveredTileIndex(null)}
                        onClick={() => handleTileClick(currentSeed)}
                        className={`group relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all duration-100 ${
                          isHovered
                            ? "border-accent scale-105 z-10 shadow-md ring-2 ring-accent/20"
                            : "border-border-subtle hover:border-border-strong bg-surface"
                        }`}
                        title={`Click to open Seed #${currentSeed} in Facial Math Studio`}
                      >
                        <img
                          src={tileImg}
                          alt={`Seed ${currentSeed}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-center p-1 transition-opacity">
                          <ExternalLink className="w-3.5 h-3.5 text-white mb-1" />
                          <span className="text-[10px] font-mono text-white font-semibold">
                            #{currentSeed}
                          </span>
                          <span className="text-[9px] text-gray-300 font-mono">
                            Sculpt
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-text-muted px-2">
                  <span>Hover to reveal seed · Click to sculpt</span>
                  <span className="text-accent font-medium">4×4 Matrix (16 Faces)</span>
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
