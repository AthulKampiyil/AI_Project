"use client";

import React, { useState, useRef, useCallback } from "react";
import { MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompareSliderProps {
  baseImage: string;
  sculptedImage: string;
  pixelated?: boolean;
  className?: string;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({
  baseImage,
  sculptedImage,
  pixelated = false,
  className,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  }, []);

  const handlePointerDown = () => setIsDragging(true);
  const handlePointerUp = () => setIsDragging(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSliderPosition((prev) => Math.max(0, prev - (e.shiftKey ? 10 : 2)));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSliderPosition((prev) => Math.min(100, prev + (e.shiftKey ? 10 : 2)));
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-label="Before/After Compare Divider"
      aria-valuenow={Math.round(sliderPosition)}
      className={cn(
        "relative w-full aspect-square rounded-2xl border border-border-subtle bg-surface-elevated overflow-hidden shadow-xs select-none cursor-ew-resize focus:outline-none focus:ring-2 focus:ring-accent",
        className
      )}
    >
      {/* Background (Sculpted Image) */}
      <img
        src={sculptedImage}
        alt="Sculpted Identity"
        className={cn(
          "absolute inset-0 w-full h-full object-contain p-3",
          pixelated && "pixelated"
        )}
      />

      {/* Foreground (Base Image, clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={baseImage}
          alt="Base Identity"
          style={{ width: containerRef.current?.clientWidth || "100%" }}
          className={cn(
            "absolute inset-0 w-full h-full object-contain p-3 max-w-none",
            pixelated && "pixelated"
          )}
        />
      </div>

      {/* Draggable Divider Line & Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-border-strong pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface border-2 border-border-strong flex items-center justify-center text-text-primary shadow-md">
          <MoveHorizontal className="w-3.5 h-3.5 text-text-muted" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-surface border border-border-subtle text-[10px] font-mono font-semibold text-text-muted shadow-xs">
        BASE IDENTITY
      </div>
      <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-surface border border-border-subtle text-[10px] font-mono font-semibold text-accent shadow-xs">
        SCULPTED
      </div>
    </div>
  );
};
