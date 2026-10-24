"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye } from "lucide-react";
import { useStudioStore } from "@/store/useStudioStore";
import { sculptFace } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/GlassCard";
import { SeedInput } from "@/components/ui/SeedInput";
import { FaceStage } from "@/components/ui/FaceStage";

function StudioContent() {
  const searchParams = useSearchParams();
  const urlSeed = searchParams.get("seed");
  const [error, setError] = useState("");
  const { seed, isNative64, image, isLoading, setSeed, setNative64, setResult, setLoading } = useStudioStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (urlSeed !== null) {
      const parsed = parseInt(urlSeed, 10);
      if (!isNaN(parsed) && parsed !== seed) setSeed(parsed);
    }
  }, [urlSeed, setSeed, seed]);

  const loadSeed = useCallback(async (value: number) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setLoading(true);
    setError("");
    try {
      const result = await sculptFace({ seed: value, smile: 0, pose: 0, hair: 0, light: 0 }, controller.signal);
      setResult(result.base);
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setLoading(false);
        setError("Could not load this preview. Check the connection and try again.");
      }
    }
  }, [setLoading, setResult]);

  useEffect(() => {
    const timer = setTimeout(() => loadSeed(seed), 120);
    return () => clearTimeout(timer);
  }, [seed, loadSeed]);

  return (
    <div className="space-y-6">
      <PageHeader title="Seed Studio" subtitle="Explore generated face previews by seed." badge="Seed Browser">
        <button type="button" aria-pressed={isNative64} onClick={() => setNative64(!isNative64)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${isNative64 ? "bg-accent-subtle text-accent border-accent/30" : "bg-surface-elevated text-text-secondary border-border-subtle hover:text-text-primary"}`}>
          <Eye className="w-4 h-4" /> Native 64px
        </button>
      </PageHeader>

      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <Card className="p-4 sm:p-6">
          <div className="max-w-xl mx-auto">
            <FaceStage src={image} loading={isLoading} label="SEED PREVIEW" seed={seed} pixelated={isNative64} />
          </div>
          <p className="mt-4 text-center text-xs text-text-muted">A generated preview for seed <span className="font-mono text-text-primary">#{seed}</span>.</p>
        </Card>
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Choose a seed</h2>
          <SeedInput value={seed} onChange={setSeed} label="Preview seed" disabled={isLoading} />
          <p role="note" className="border-t border-border-subtle pt-4 text-xs leading-relaxed text-text-muted">Seeds select generated samples. This preview does not provide controls for editing facial features or preserving a person’s identity.</p>
        </Card>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return <Suspense fallback={<div className="flex items-center justify-center p-20 text-xs text-text-muted">Loading seed preview…</div>}><StudioContent /></Suspense>;
}
