"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGridStore } from "@/store/useGridStore";
import { fetchGrid } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { FaceStage } from "@/components/ui/FaceStage";
import {
  Grid as GridIcon,
  Sparkles,
  Lock,
  Unlock,
  Download,
  ExternalLink,
  Layers,
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-[#EDEEF3] transition-colors disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5 text-[#38E1FF]" />
          <span>Save PNG</span>
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Grid / Single Portrait Display */}
        <div className="lg:col-span-8 space-y-4">
          <GlassCard className="p-6 flex flex-col items-center justify-center">
            {gridCount === 1 ? (
              <div className="max-w-sm w-full space-y-3">
                <FaceStage
                  src={image}
                  loading={isGenerating}
                  label="PORTRAIT"
                  seed={seeds[0]}
                  onOpenStudio={handleTileClick}
                />
                <div className="text-center text-xs font-mono text-[#8B8FA3]">
                  Seed: #{seeds[0] ?? 42} · Single Radford Latent Sample
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xl space-y-3">
                {/* 4x4 Interactive Mosaic */}
                <div className="grid grid-cols-4 gap-2.5 p-2 rounded-2xl bg-black/40 border border-white/10">
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
                        className={`group relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all duration-150 ${
                          isHovered
                            ? "border-[#8B7CFF] scale-105 z-10 shadow-[0_0_15px_rgba(139,124,255,0.4)]"
                            : "border-white/10 hover:border-white/30"
                        }`}
                        title={`Click to open Seed #${currentSeed} in Facial Math Studio`}
                      >
                        <img
                          src={tileImg}
                          alt={`Seed ${currentSeed}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-center p-1 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-[#8B7CFF] mb-1" />
                          <span className="text-[10px] font-mono text-white font-semibold">
                            #{currentSeed}
                          </span>
                          <span className="text-[8px] text-[#8B8FA3]">
                            Open Studio
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#8B8FA3] px-2">
                  <span>Hover to reveal seed · Click to sculpt</span>
                  <span className="text-[#8B7CFF]">4×4 Matrix (16 Faces)</span>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right: Generator Controls */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 text-sm font-semibold text-[#EDEEF3]">
              <GridIcon className="w-4 h-4 text-[#8B7CFF]" />
              <span>Generation Modes</span>
            </div>

            {/* Buttons for 1 and 16 faces */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleGenerate(1)}
                disabled={isGenerating}
                className={`py-3 px-3 rounded-xl border font-semibold text-xs transition-all flex flex-col items-center justify-center gap-1.5 ${
                  gridCount === 1
                    ? "bg-[#8B7CFF]/15 border-[#8B7CFF]/50 text-[#8B7CFF] shadow-sm"
                    : "bg-white/[0.03] border-white/10 text-[#8B8FA3] hover:text-[#EDEEF3]"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Single Face</span>
              </button>

              <button
                type="button"
                onClick={() => handleGenerate(16)}
                disabled={isGenerating}
                className={`py-3 px-3 rounded-xl border font-semibold text-xs transition-all flex flex-col items-center justify-center gap-1.5 ${
                  gridCount === 16
                    ? "bg-[#8B7CFF]/15 border-[#8B7CFF]/50 text-[#8B7CFF] shadow-sm"
                    : "bg-white/[0.03] border-white/10 text-[#8B8FA3] hover:text-[#EDEEF3]"
                }`}
              >
                <GridIcon className="w-4 h-4" />
                <span>16 Mosaic (4×4)</span>
              </button>
            </div>

            {/* Seed Lock Toggle */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#EDEEF3] font-medium flex items-center gap-1.5">
                  {seedLock ? (
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-[#8B8FA3]" />
                  )}
                  <span>Seed Anchor Lock</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSeedLock(!seedLock)}
                  className={`text-xs font-mono px-2 py-0.5 rounded transition-all ${
                    seedLock
                      ? "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                      : "bg-white/[0.04] text-[#8B8FA3]"
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
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-[#EDEEF3]"
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
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8B7CFF] to-[#9B8EFF] hover:opacity-95 text-black font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(139,124,255,0.3)] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>
                {isGenerating
                  ? "Sampling Gaussian Sphere..."
                  : `Generate Random ${gridCount === 1 ? "Face" : "4×4 Mosaic"}`}
              </span>
            </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
