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
import { useHealthStore } from "@/store/useHealthStore";

function StudioContent() {
  const searchParams = useSearchParams();
  const urlSeed = searchParams.get("seed");
  const [error, setError] = useState("");
  const [smile, setSmile] = useState(0);
  const [hair, setHair] = useState(0);
  const [baseImage, setBaseImage] = useState("");
  const sculptAvailable = useHealthStore((state) => state.sculptAvailable);
  const { seed, isNative64, image, isLoading, setSeed, setNative64, setResult, setLoading } = useStudioStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const lastUrlSeed = useRef<string | null>(null);
  const setPreviewSeed = useCallback((value: number) => {
    setSmile(0);
    setHair(0);
    setSeed(value);
  }, [setSeed]);

  useEffect(() => {
    if (urlSeed !== null && urlSeed !== lastUrlSeed.current) {
      lastUrlSeed.current = urlSeed;
      const parsed = parseInt(urlSeed, 10);
      if (!isNaN(parsed)) {
        const timer = window.setTimeout(() => setPreviewSeed(parsed), 0);
        return () => window.clearTimeout(timer);
      }
    }
  }, [urlSeed, setPreviewSeed]);

  const loadSeed = useCallback(async (value: number, smileValue: number, hairValue: number) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await sculptFace({ seed: value, smile: smileValue, pose: 0, hair: hairValue, light: 0 }, controller.signal);
      if (id === requestId.current) {
        setBaseImage(result.base);
        setResult(sculptAvailable ? result.sculpted : result.base);
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError" && id === requestId.current) {
        setLoading(false);
        setError("Could not load this preview. Check the connection and try again.");
      }
    }
  }, [sculptAvailable, setLoading, setResult]);

  useEffect(() => {
    const timer = setTimeout(() => loadSeed(seed, sculptAvailable ? smile : 0, sculptAvailable ? hair : 0), 180);
    return () => { clearTimeout(timer); abortControllerRef.current?.abort(); };
  }, [seed, smile, hair, sculptAvailable, loadSeed]);

  const resetEdits = () => { setSmile(0); setHair(0); };

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
            {sculptAvailable && <div className="mb-4"><FaceStage src={baseImage} loading={isLoading} label="BASE PREVIEW" seed={seed} pixelated={isNative64} /></div>}
            <FaceStage src={image} loading={isLoading} label={sculptAvailable ? "EDITED PREVIEW" : "SEED PREVIEW"} seed={seed} pixelated={isNative64} />
          </div>
          <p className="mt-4 text-center text-xs text-text-muted">A generated preview for seed <span className="font-mono text-text-primary">#{seed}</span>.</p>
        </Card>
        <Card className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary">Choose a seed</h2>
          <SeedInput value={seed} onChange={setPreviewSeed} label="Preview seed" disabled={isLoading} />
          {sculptAvailable ? <>
            <div className="space-y-5 border-t border-border-subtle pt-4">
              <label className="block text-xs font-medium text-text-primary" htmlFor="smile-slider">Smile tendency (experimental)
                <input id="smile-slider" type="range" min="-1" max="1" step="0.01" value={smile} onChange={(event) => setSmile(Number(event.target.value))} className="mt-3 w-full accent-accent" aria-valuetext={smile.toFixed(2)} />
                <span className="flex justify-between text-[11px] text-text-muted"><span>Less smile</span><span>More smile</span></span>
              </label>
              <label className="block text-xs font-medium text-text-primary" htmlFor="hair-slider">Hair lightness (experimental)
                <input id="hair-slider" type="range" min="-1" max="1" step="0.01" value={hair} onChange={(event) => setHair(Number(event.target.value))} className="mt-3 w-full accent-accent" aria-valuetext={hair.toFixed(2)} />
                <span className="flex justify-between text-[11px] text-text-muted"><span>Dark</span><span>Blond</span></span>
              </label>
            </div>
            <button type="button" onClick={resetEdits} className="text-xs font-medium text-accent hover:underline">Reset edits for this seed</button>
            <p role="note" className="text-xs leading-relaxed text-text-muted">Experimental edits vary by seed and can alter identity and skin tone. Compare the edited preview with its original base sample.</p>
          </> : <p role="note" className="border-t border-border-subtle pt-4 text-xs leading-relaxed text-text-muted">Seeds select generated samples. Experimental feature editing is unavailable, so this view shows the seed’s original preview only.</p>}
        </Card>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return <Suspense fallback={<div className="flex items-center justify-center p-20 text-xs text-text-muted">Loading seed preview…</div>}><StudioContent /></Suspense>;
}
