"use client";

import React, { useState } from "react";
import { Download, Copy, ExternalLink, Check, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FaceStageProps {
  src?: string;
  loading?: boolean;
  label: string;
  pixelated?: boolean;
  seed?: number;
  className?: string;
  onOpenStudio?: (seed: number) => void;
}

export const FaceStage: React.FC<FaceStageProps> = ({
  src,
  loading = false,
  label,
  pixelated = false,
  seed,
  className,
  onOpenStudio,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (seed !== undefined) {
      navigator.clipboard.writeText(seed.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = `dcgan_face_${seed ?? "specimen"}_${label.toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className={cn(
        "relative group rounded-2xl border border-border-subtle bg-surface-elevated overflow-hidden shadow-xs transition-all duration-150",
        className
      )}
    >
      {/* Corner Label Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface border border-border-subtle text-[10px] font-mono tracking-wider font-semibold text-text-primary shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        {label}
      </div>

      {/* Resolution Indicator Badge */}
      <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-md bg-surface border border-border-subtle text-[10px] font-mono text-text-muted shadow-xs">
        {pixelated ? "64×64 RAW" : "384×384 BICUBIC"}
      </div>

      {/* Main Image Frame with Cross-fade & Skeleton Shimmer */}
      <div className="relative w-full aspect-square flex items-center justify-center p-3 z-10">
        {loading && (
          <div className="absolute inset-3 rounded-xl bg-surface-hover overflow-hidden z-20">
            <div className="w-full h-full animate-pulse bg-gradient-to-r from-transparent via-surface-elevated to-transparent" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {src ? (
            <motion.img
              key={src}
              src={src}
              alt={label}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.8 }}
              transition={{ duration: 0.12 }}
              className={cn(
                "w-full h-full object-contain rounded-xl transition-all",
                pixelated && "pixelated"
              )}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-text-muted border border-dashed border-border-strong rounded-xl">
              <SlidersHorizontal className="w-7 h-7 text-text-muted mb-2 opacity-50" />
              <p className="text-xs font-mono">Synthesizing Latent Vector...</p>
            </div>
          )}
        </AnimatePresence>

        {/* Hover Action Toolbar */}
        {src && (
          <div
            className="absolute bottom-4 inset-x-4 z-30 flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-surface border border-border-subtle opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-md"
          >
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-surface-elevated text-xs font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Download PNG"
            >
              <Download className="w-3.5 h-3.5 text-text-muted" />
              <span>Save</span>
            </button>

            {seed !== undefined && (
              <button
                type="button"
                onClick={handleCopySeed}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-surface-elevated text-xs font-mono text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title="Copy Seed to Clipboard"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-text-muted" />
                )}
                <span>{copied ? "Copied" : `#${seed}`}</span>
              </button>
            )}

            {onOpenStudio && seed !== undefined && (
              <button
                type="button"
                onClick={() => onOpenStudio(seed)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-surface-elevated text-xs font-medium text-accent transition-colors cursor-pointer"
                title="Open in Facial Math Studio"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Sculpt</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
