"use client";

import React, { useRef } from "react";
import { RotateCcw } from "lucide-react";

interface LatentSliderProps {
  label: string;
  leftPole: string;
  rightPole: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const LatentSlider: React.FC<LatentSliderProps> = ({
  label,
  leftPole,
  rightPole,
  value,
  onChange,
  disabled = false,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  // Range is -1.5 to +1.5
  const min = -1.5;
  const max = 1.5;
  const step = 0.1;

  // Percentage from 0% to 100%
  const percent = ((value - min) / (max - min)) * 100;
  const isPositive = value >= 0;
  // Center is 50%
  const centerPercent = 50;

  // Double click to reset
  const handleDoubleClick = () => {
    onChange(0.0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const multiplier = e.shiftKey ? 5 : 1;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(min, parseFloat((value - step * multiplier).toFixed(1)));
      onChange(next);
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(max, parseFloat((value + step * multiplier).toFixed(1)));
      onChange(next);
    } else if (e.key === "Home") {
      e.preventDefault();
      onChange(0.0);
    }
  };

  return (
    <div className="space-y-1.5 select-none">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary text-xs">{label}</span>
          <button
            type="button"
            onClick={handleDoubleClick}
            className={`text-text-muted hover:text-accent transition-opacity p-0.5 rounded cursor-pointer ${
              value !== 0 ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            title="Reset slider to 0.0"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
        <span
          className={`font-mono text-[11px] px-2 py-0.5 rounded border transition-colors ${
            value === 0
              ? "text-text-muted bg-surface-elevated border-border-subtle"
              : isPositive
              ? "text-accent bg-accent-subtle border-accent/30 font-semibold"
              : "text-accent-secondary bg-sky-500/10 border-sky-500/30 font-semibold"
          }`}
        >
          {value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}
        </span>
      </div>

      {/* Slider Track with Outward Fill from Center */}
      <div
        ref={trackRef}
        onDoubleClick={handleDoubleClick}
        className="relative h-6 flex items-center cursor-pointer group"
      >
        {/* Background Rail */}
        <div className="absolute w-full h-1.5 rounded-full bg-surface-elevated border border-border-subtle overflow-hidden">
          {/* Center Detent Marker */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border-strong transform -translate-x-1/2 z-10" />

          {/* Outward fill from center (50%) */}
          {isPositive ? (
            <div
              className="absolute top-0 bottom-0 bg-accent rounded-r-full transition-all duration-75"
              style={{
                left: `${centerPercent}%`,
                width: `${percent - centerPercent}%`,
              }}
            />
          ) : (
            <div
              className="absolute top-0 bottom-0 bg-accent-secondary rounded-l-full transition-all duration-75"
              style={{
                left: `${percent}%`,
                width: `${centerPercent - percent}%`,
              }}
            />
          )}
        </div>

        {/* Real HTML Range Slider for full accessibility */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(parseFloat(parseFloat(e.target.value).toFixed(1)))}
          onKeyDown={handleKeyDown}
          aria-label={label}
          aria-valuenow={value}
          className="absolute w-full h-full opacity-0 cursor-pointer z-30"
        />

        {/* Custom Thumb visual handle */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full bg-surface border-2 border-accent shadow-xs transform -translate-x-1/2 pointer-events-none transition-transform group-hover:scale-110 z-20"
          style={{ left: `${percent}%` }}
        />
      </div>

      {/* Left/Right Pole Labels */}
      <div className="flex justify-between text-[11px] text-text-muted tracking-wide font-mono">
        <span className={value < 0 ? "text-accent-secondary font-medium" : ""}>
          {leftPole}
        </span>
        <span className={value > 0 ? "text-accent font-medium" : ""}>
          {rightPole}
        </span>
      </div>
    </div>
  );
};
