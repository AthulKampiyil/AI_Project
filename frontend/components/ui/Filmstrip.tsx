"use client";

import React, { useState } from "react";
import { Film } from "lucide-react";

interface FilmstripProps {
  lerpStrip: string[];
  slerpStrip: string[];
}

export const Filmstrip: React.FC<FilmstripProps> = ({
  lerpStrip,
  slerpStrip,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (lerpStrip.length === 0 || slerpStrip.length === 0) {
    return (
      <div className="w-full p-8 rounded-xl border border-border-subtle bg-surface-elevated text-center text-text-muted flex flex-col items-center justify-center">
        <Film className="w-6 h-6 text-text-muted mb-2 opacity-50" />
        <p className="text-xs font-mono">
          Click &quot;Compare Slerp vs Lerp Strips&quot; to reveal the trajectory filmstrip.
        </p>
      </div>
    );
  }

  const steps = Math.min(lerpStrip.length, slerpStrip.length);

  return (
    <div className="w-full rounded-xl border border-border-subtle bg-surface p-4 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <span>Geodesic Comparison Filmstrip</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-elevated border border-border-subtle text-text-muted">
              {steps} STEPS
            </span>
          </h4>
          <p className="text-xs text-text-muted mt-0.5">
            Hover any column to inspect how Lerp cuts into the hollow hypersphere interior while Slerp stays on the high-probability manifold shell.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex flex-col gap-3 min-w-max">
          {/* Lerp Row */}
          <div className="flex items-center gap-2">
            <div className="w-24 shrink-0 flex flex-col">
              <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
                LERP
              </span>
              <span className="text-[10px] text-text-muted font-mono">
                Linear chord
              </span>
            </div>

            <div className="flex items-center gap-2">
              {lerpStrip.slice(0, steps).map((src, idx) => {
                const t = (idx / (steps - 1)).toFixed(2);
                const isHovered = hoveredIndex === idx;
                const isMidpoint = Math.abs(idx / (steps - 1) - 0.5) < 0.15;

                return (
                  <div
                    key={`lerp-${idx}`}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`relative w-18 h-18 rounded-lg overflow-hidden border transition-all duration-100 cursor-pointer ${
                      isHovered
                        ? "border-amber-500 ring-2 ring-amber-500/20 scale-105 z-10"
                        : "border-border-subtle hover:border-border-strong bg-surface-elevated"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Lerp t=${t}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-1 right-1 px-1 rounded bg-black/75 text-[9px] font-mono text-white">
                      t={t}
                    </div>
                    {isMidpoint && (
                      <div className="absolute top-1 left-1 px-1 rounded bg-amber-500 text-[8px] font-mono text-black font-bold">
                        Hollow
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Slerp Row */}
          <div className="flex items-center gap-2">
            <div className="w-24 shrink-0 flex flex-col">
              <span className="text-xs font-mono font-semibold text-accent">
                SLERP
              </span>
              <span className="text-[10px] text-text-muted font-mono">
                Spherical arc
              </span>
            </div>

            <div className="flex items-center gap-2">
              {slerpStrip.slice(0, steps).map((src, idx) => {
                const t = (idx / (steps - 1)).toFixed(2);
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={`slerp-${idx}`}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`relative w-18 h-18 rounded-lg overflow-hidden border transition-all duration-100 cursor-pointer ${
                      isHovered
                        ? "border-accent ring-2 ring-accent/20 scale-105 z-10"
                        : "border-border-subtle hover:border-border-strong bg-surface-elevated"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Slerp t=${t}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-1 right-1 px-1 rounded bg-black/75 text-[9px] font-mono text-white">
                      t={t}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
