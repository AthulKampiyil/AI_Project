"use client";

import React, { useState, useRef } from "react";
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
  const [isHovered, setIsHovered] = useState(false);
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
    <div
      className="space-y-1.5 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#EDEEF3] text-xs">{label}</span>
          <button
            type="button"
            onClick={handleDoubleClick}
            className={`text-[#8B8FA3] hover:text-[#8B7CFF] transition-opacity p-0.5 rounded ${
              value !== 0 ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            title="Reset slider to 0.0 (Double-click)"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
        <span
          className={`font-mono text-xs px-2 py-0.5 rounded transition-all ${
            value === 0
              ? "text-[#8B8FA3] bg-white/[0.04]"
              : isPositive
              ? "text-[#8B7CFF] bg-[#8B7CFF]/15 border border-[#8B7CFF]/30 font-semibold"
              : "text-[#38E1FF] bg-[#38E1FF]/15 border border-[#38E1FF]/30 font-semibold"
          }`}
        >
          {value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}
        </span>
      </div>

      {/* Slider Track with Outward Fill from Center */}
      <div
        ref={trackRef}
        onDoubleClick={handleDoubleClick}
        className="relative h-7 flex items-center cursor-pointer group"
      >
        {/* Background Rail */}
        <div className="absolute w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
          {/* Center Detent Marker */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 transform -translate-x-1/2 z-10" />

          {/* Outward fill from center (50%) */}
          {isPositive ? (
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-[#8B7CFF]/80 to-[#8B7CFF] rounded-r-full transition-all duration-75"
              style={{
                left: `${centerPercent}%`,
                width: `${percent - centerPercent}%`,
              }}
            />
          ) : (
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-l from-[#38E1FF]/80 to-[#38E1FF] rounded-l-full transition-all duration-75"
              style={{
                left: `${percent}%`,
                width: `${centerPercent - percent}%`,
              }}
            />
          )}
        </div>

        {/* Real HTML Range Slider for full keyboard and touch accessibility */}
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
          className="absolute w-4 h-4 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] border-2 border-[#0E1018] transform -translate-x-1/2 pointer-events-none transition-transform group-hover:scale-125 z-20"
          style={{ left: `${percent}%` }}
        />
      </div>

      {/* Left/Right Pole Labels */}
      <div className="flex justify-between text-[11px] text-[#8B8FA3] tracking-wide">
        <span className={value < 0 ? "text-[#38E1FF] font-medium" : ""}>
          {leftPole}
        </span>
        <span className={value > 0 ? "text-[#8B7CFF] font-medium" : ""}>
          {rightPole}
        </span>
      </div>
    </div>
  );
};
