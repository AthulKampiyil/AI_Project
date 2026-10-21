"use client";

import React from "react";
import { useMorphStore } from "@/store/useMorphStore";
import { morphFaces, fetchStrips } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { SeedInput } from "@/components/ui/SeedInput";
import { MorphPlayer } from "@/components/ui/MorphPlayer";
import { Filmstrip } from "@/components/ui/Filmstrip";
import { LatentSpaceVisualizer } from "@/components/ui/LatentSpaceVisualizer";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  Film,
  Sparkles,
  Layers,
  Compass,
  ArrowRight,
  Orbit,
} from "lucide-react";

export default function MorphPage() {
  const {
    seedA,
    seedB,
    mode,
    steps,
    fps,
    gifUrl,
    frames,
    lerpStrip,
    slerpStrip,
    isGenerating,
    isStripsLoading,
    setSeedA,
    setSeedB,
    setMode,
    setSteps,
    setFps,
    setReel,
    setStrips,
    setGenerating,
    setStripsLoading,
  } = useMorphStore();

  const handleGenerateReel = async () => {
    setGenerating(true);
    try {
      const res = await morphFaces({ seedA, seedB, mode, steps, fps });
      setReel(res.gifUrl, res.frames);
    } catch {
      setGenerating(false);
    }
  };

  const handleCompareStrips = async () => {
    setStripsLoading(true);
    try {
      const res = await fetchStrips({ seedA, seedB, steps: 7 });
      setStrips(res.lerp, res.slerp);
    } catch {
      setStripsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Morphing Studio"
        subtitle="Interpolate smoothly between two distant points in Gaussian latent space. Slerp stays on the high-probability hypersphere shell; Lerp cuts straight through the hollow core."
        badge="Geodesic Path"
      />

      {/* Main Grid: Player Stage & Filmstrip (left) + Controls & 3D (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Stage with Morph Player & Filmstrip */}
        <div className="lg:col-span-8 space-y-6">
          <GlassCard className="p-6">
            <div className="flex flex-col items-center">
              <MorphPlayer
                frames={frames}
                gifUrl={gifUrl}
                fps={fps}
                className="w-full max-w-md"
              />
            </div>
          </GlassCard>

          {/* Filmstrip Dual Trajectory Comparison */}
          <Filmstrip lerpStrip={lerpStrip} slerpStrip={slerpStrip} />
        </div>

        {/* Right: Controls & Hypersphere Trajectory Visualizer */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 text-sm font-semibold text-[#EDEEF3]">
              <Film className="w-4 h-4 text-[#38E1FF]" />
              <span>Interpolation Parameters</span>
            </div>

            {/* Seed Inputs */}
            <div className="space-y-4">
              <SeedInput
                label="Person A (Seed A)"
                value={seedA}
                onChange={setSeedA}
                disabled={isGenerating}
              />
              <SeedInput
                label="Person B (Seed B)"
                value={seedB}
                onChange={setSeedB}
                disabled={isGenerating}
              />
            </div>

            {/* Trajectory Segmented Control */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8B8FA3] font-medium">Trajectory Mode</span>
                <Tooltip
                  term="Slerp vs Lerp"
                  content="Slerp (Spherical Linear) maintains constant norm along the hypersphere shell. Lerp (Linear) cuts across chord distance through the center of the sphere, causing intermediate blurriness."
                />
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#0E1018] p-1 rounded-xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setMode("slerp")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold font-mono transition-all ${
                    mode === "slerp"
                      ? "bg-[#38E1FF]/20 text-[#38E1FF] border border-[#38E1FF]/40 shadow-sm"
                      : "text-[#8B8FA3] hover:text-[#EDEEF3]"
                  }`}
                >
                  Slerp (Arc)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("lerp")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold font-mono transition-all ${
                    mode === "lerp"
                      ? "bg-[#FFB88A]/20 text-[#FFB88A] border border-[#FFB88A]/40 shadow-sm"
                      : "text-[#8B8FA3] hover:text-[#EDEEF3]"
                  }`}
                >
                  Lerp (Line)
                </button>
              </div>
            </div>

            {/* Smoothness Steps Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8B8FA3]">Smoothness Steps</span>
                <span className="font-mono text-[#EDEEF3]">{steps} frames</span>
              </div>
              <input
                type="range"
                min={15}
                max={35}
                step={5}
                value={steps}
                onChange={(e) => setSteps(parseInt(e.target.value, 10))}
                className="w-full accent-[#38E1FF] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#8B8FA3]">
                <span>15 (Quick)</span>
                <span>35 (Ultra Smooth)</span>
              </div>
            </div>

            {/* FPS Speed Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8B8FA3]">Playback Speed</span>
                <span className="font-mono text-[#EDEEF3]">{fps} FPS</span>
              </div>
              <input
                type="range"
                min={10}
                max={24}
                step={2}
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value, 10))}
                className="w-full accent-[#38E1FF] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#8B8FA3]">
                <span>10 FPS</span>
                <span>24 FPS</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleGenerateReel}
                disabled={isGenerating}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#38E1FF] to-[#8B7CFF] hover:opacity-95 text-black font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(56,225,255,0.3)] disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                <span>
                  {isGenerating ? "Synthesizing Reel..." : "Generate Morphing Reel"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCompareStrips}
                disabled={isStripsLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-[#EDEEF3] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Layers className="w-4 h-4 text-[#FFB88A]" />
                <span>
                  {isStripsLoading ? "Rendering Strips..." : "Compare Slerp vs. Lerp Strips"}
                </span>
              </button>
            </div>
          </GlassCard>

          {/* 3D Hypersphere Trajectory Geometric Visualizer */}
          <GlassCard className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#EDEEF3]">
              <Orbit className="w-4 h-4 text-[#38E1FF]" />
              <span>3D Hypersphere Shell Geometry</span>
            </div>
            <LatentSpaceVisualizer mode={mode} />
            <p className="text-[11px] text-[#8B8FA3] font-mono leading-relaxed">
              In 100 dimensions, nearly 99.9% of Gaussian probability mass is concentrated in a thin shell around radius r ≈ √100 = 10.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
