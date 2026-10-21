"use client";

import React, { useState } from "react";
import { Download, Copy, ExternalLink, Check, Sparkles } from "lucide-react";
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
        "relative group rounded-3xl border border-white/[0.08] bg-[#0E1018]/90 overflow-hidden shadow-2xl transition-all duration-300",
        "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_center,rgba(255,184,138,0.1)_0%,transparent_70%)] before:pointer-events-none before:z-0",
        className
      )}
    >
      {/* Corner Label Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono tracking-wider font-semibold text-[#EDEEF3]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FFB88A]" />
        {label}
      </div>

      {/* Resolution Indicator Badge */}
      <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md border border-white/10 text-[10px] font-mono text-[#8B8FA3]">
        {pixelated ? "64×64 RAW" : "384×384 BICUBIC"}
      </div>

      {/* Main Image Frame with Cross-fade & Skeleton Shimmer */}
      <div className="relative w-full aspect-square flex items-center justify-center p-3 z-10">
        {loading && (
          <div className="absolute inset-3 rounded-2xl bg-white/[0.03] overflow-hidden z-20">
            <div className="w-full h-full animate-pulse bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {src ? (
            <motion.img
              key={src}
              src={src}
              alt={label}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.7 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "w-full h-full object-contain rounded-2xl shadow-inner transition-all",
                pixelated && "pixelated"
              )}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-[#8B8FA3] border border-dashed border-white/10 rounded-2xl">
              <Sparkles className="w-8 h-8 text-[#8B7CFF]/50 mb-2 animate-bounce" />
              <p className="text-xs font-mono">Synthesizing Latent Vector...</p>
            </div>
          )}
        </AnimatePresence>

        {/* Hover Action Toolbar */}
        {src && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="absolute bottom-5 inset-x-5 z-30 flex items-center justify-center gap-2 p-1.5 rounded-xl bg-[#07080D]/85 backdrop-blur-lg border border-white/15 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-xl"
          >
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs text-[#EDEEF3] transition-colors"
              title="Download High-Resolution PNG"
            >
              <Download className="w-3.5 h-3.5 text-[#38E1FF]" />
              <span>Save</span>
            </button>

            {seed !== undefined && (
              <button
                type="button"
                onClick={handleCopySeed}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs text-[#EDEEF3] transition-colors"
                title="Copy Seed to Clipboard"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#8B7CFF]" />
                )}
                <span>{copied ? "Copied" : `#${seed}`}</span>
              </button>
            )}

            {onOpenStudio && seed !== undefined && (
              <button
                type="button"
                onClick={() => onOpenStudio(seed)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs text-[#EDEEF3] transition-colors"
                title="Open in Facial Math Studio"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#FFB88A]" />
                <span>Sculpt</span>
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
