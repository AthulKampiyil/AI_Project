"use client";

import React, { useState } from "react";
import { useMatchStore } from "@/store/useMatchStore";
import { invertFacePhoto } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/GlassCard";
import { PhotoDropzone } from "@/components/ui/PhotoDropzone";
import { FaceStage } from "@/components/ui/FaceStage";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  ShieldCheck,
  Target,
} from "lucide-react";

export default function MatchPage() {
  const {
    file,
    previewUrl,
    iterations,
    targetImage,
    twinImage,
    mseInitial,
    mseFinal,
    reductionPct,
    isOptimizing,
    setFile,
    setIterations,
    setResult,
    setOptimizing,
    reset,
  } = useMatchStore();

  const [error, setError] = useState("");

  const handleRunInversion = async () => {
    if (!file) return;
    setError("");
    setOptimizing(true);
    try {
      const res = await invertFacePhoto(file, iterations);
      setResult(res.target, res.twin, res.mseInitial, res.mseFinal);
    } catch (caughtError) {
      setOptimizing(false);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create the projection. Please try again."
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Photo Matcher"
        subtitle="Create an approximate DCGAN projection of a processed portrait. It is a visual reconstruction, not a same-person match."
        badge="Approximate projection"
      />
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Reconstructed Stage & Diagnostics */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <FaceStage
                  src={targetImage || previewUrl || undefined}
                  label="PROCESSED TARGET"
                  loading={isOptimizing}
                />
                <div className="text-center text-[11px] font-mono text-text-muted">
                  Input portrait · processed to 64×64
                </div>
              </div>

              <div className="space-y-2">
                <FaceStage
                  src={twinImage || undefined}
                  label="APPROXIMATE PROJECTION"
                  loading={isOptimizing}
                />
                <div className="text-center text-[11px] font-mono text-accent font-medium">
                  Generated from a bounded latent-space search
                </div>
              </div>
            </div>

            {/* Keep the projection's limitations beside the results. */}
            <div className="mt-6 p-3.5 rounded-xl bg-surface-elevated border border-border-subtle flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div className="text-xs text-text-muted space-y-0.5">
                <p className="text-text-primary font-medium">
                  What this result means
                </p>
                <p className="leading-relaxed">
                  This low-resolution DCGAN projection may reflect broad visual features, but it does not identify or verify a person. It can look substantially different from the input, and a lower pixel MSE does not mean a more accurate identity match.
                </p>
              </div>
            </div>
          </Card>

          {/* Diagnostics Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Initial pixel MSE"
              value={mseInitial.toFixed(4)}
              unit="pixel error"
              deltaLabel="starting pixel error"
            />
            <MetricCard
              label="Final pixel MSE"
              value={mseFinal.toFixed(4)}
              unit="pixel error"
              delta={parseFloat(((mseInitial - mseFinal) * 100).toFixed(1))}
              deltaLabel="pixel error change"
            />
            <MetricCard
              label="Pixel MSE reduction"
              value={`${reductionPct}%`}
              delta={reductionPct}
              deltaLabel="reduction"
              isReductionPositive={true}
            />
          </div>
        </div>

        {/* Right: Upload Dropzone & Optimization Settings */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-3 text-sm font-semibold text-text-primary">
              <Target className="w-4 h-4 text-accent" />
              <span>Projection setup</span>
            </div>

            {/* Dropzone */}
            <PhotoDropzone
              onFileSelected={setFile}
              onClear={reset}
              selectedFile={file}
              previewUrl={previewUrl}
              disabled={isOptimizing}
            />

            {/* Iterations Slider */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Optimization Steps</span>
                <span className="font-mono text-text-primary">{iterations} steps</span>
              </div>
              <input
                type="range"
                min={20}
                max={60}
                step={5}
                value={iterations}
                onChange={(e) => setIterations(parseInt(e.target.value, 10))}
                disabled={isOptimizing}
                className="w-full accent-[var(--accent)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-text-muted">
                <span>20 (Fast)</span>
                <span>60 (Deep Fit)</span>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-text-muted">
              This creates an approximate visual projection, not a same-person match. It may look unlike the processed target; pixel MSE measures pixel difference only, not identity accuracy.
            </p>

            {/* Invert Button */}
            <button
              type="button"
              onClick={handleRunInversion}
              disabled={!file || isOptimizing}
              className="w-full py-2.5 px-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Target className="w-3.5 h-3.5" />
              <span>
                {isOptimizing ? "Creating projection…" : "Create approximate projection"}
              </span>
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
