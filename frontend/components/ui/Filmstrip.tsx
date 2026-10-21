"use client";

import React, { useState } from "react";
import { Sparkles, Info } from "lucide-react";

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
      <div className="w-full p-8 rounded-2xl border border-white/[0.08] bg-[#0E1018]/60 text-center text-[#8B8FA3] flex flex-col items-center justify-center">
        <Sparkles className="w-7 h-7 text-[#FFB88A]/50 mb-2" />
        <p className="text-xs font-mono">
          Click &quot;Compare Slerp vs Lerp Strips&quot; to reveal the side-by-side trajectory filmstrip.
        </p>
      </div>
    );
  }

  const steps = Math.min(lerpStrip.length, slerpStrip.length);

  return (
    <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0E1018]/80 p-4 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-[#EDEEF3] flex items-center gap-2">
            <span>Geodesic Comparison Filmstrip</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-[#8B8FA3]">
              {steps} STEPS
            </span>
          </h4>
          <p className="text-xs text-[#8B8FA3] mt-0.5">
            Hover any column to inspect how Lerp cuts into the hollow hypersphere interior (loss of definition) while Slerp stays on the high-probability shell.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex flex-col gap-3 min-w-max">
          {/* Lerp Row (Warm) */}
          <div className="flex items-center gap-2">
            <div className="w-24 shrink-0 flex flex-col">
              <span className="text-xs font-mono font-semibold text-[#FFB88A]">
                LERP
              </span>
              <span className="text-[10px] text-[#8B8FA3]">
                Euclidean line
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {lerpStrip.slice(0, steps).map((src, idx) => {
                const t = (idx / (steps - 1)).toFixed(2);
                const isHovered = hoveredIndex === idx;
                const isMidpoint = Math.abs(idx / (steps - 1) - 0.5) < 0.15;

                return (
                  <div
                    key={`lerp-${idx}`}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border transition-all duration-150 cursor-pointer ${
                      isHovered
                        ? "border-[#FFB88A] ring-2 ring-[#FFB88A]/30 scale-105 z-10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Lerp t=${t}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[9px] font-mono text-[#FFB88A]">
                      t={t}
                    </div>
                    {isMidpoint && (
                      <div className="absolute top-1 left-1 px-1 rounded bg-amber-500/80 text-[8px] font-mono text-black font-bold">
                        Hollow
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Slerp Row (Cyan) */}
          <div className="flex items-center gap-2">
            <div className="w-24 shrink-0 flex flex-col">
              <span className="text-xs font-mono font-semibold text-[#38E1FF]">
                SLERP
              </span>
              <span className="text-[10px] text-[#8B8FA3]">
                Spherical arc
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {slerpStrip.slice(0, steps).map((src, idx) => {
                const t = (idx / (steps - 1)).toFixed(2);
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={`slerp-${idx}`}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border transition-all duration-150 cursor-pointer ${
                      isHovered
                        ? "border-[#38E1FF] ring-2 ring-[#38E1FF]/30 scale-105 z-10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Slerp t=${t}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-1 right-1 px-1 rounded bg-black/70 text-[9px] font-mono text-[#38E1FF]">
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
