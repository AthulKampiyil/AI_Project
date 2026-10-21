"use client";

import React, { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  isReductionPositive?: boolean;
  sparklineData?: number[];
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  isReductionPositive = true,
  sparklineData,
  className,
}) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const isPositiveDelta = delta !== undefined && delta > 0;
  const isZeroDelta = delta !== undefined && delta === 0;

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#0E1018]/80 p-4 shadow-lg backdrop-blur-xl flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#8B8FA3] tracking-wide">
          {label}
        </span>
        {delta !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full",
              isZeroDelta
                ? "bg-white/[0.06] text-[#8B8FA3]"
                : (isPositiveDelta && isReductionPositive) || (!isPositiveDelta && !isReductionPositive)
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
            )}
          >
            {isZeroDelta ? (
              <Minus className="w-2.5 h-2.5" />
            ) : isPositiveDelta ? (
              <ArrowDownRight className="w-2.5 h-2.5" />
            ) : (
              <ArrowUpRight className="w-2.5 h-2.5" />
            )}
            <span>
              {delta > 0 ? `-${Math.abs(delta)}` : `+${Math.abs(delta)}`}
              {deltaLabel ? ` ${deltaLabel}` : "%"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold font-mono tracking-tight text-[#EDEEF3]">
          {displayValue}
        </span>
        {unit && <span className="text-xs font-mono text-[#8B8FA3]">{unit}</span>}
      </div>

      {/* Optional Sparkline visualization */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-3 h-8 w-full">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#8B7CFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={sparklineData
                .map((d, i) => {
                  const max = Math.max(...sparklineData);
                  const min = Math.min(...sparklineData);
                  const range = max - min || 1;
                  const x = (i / (sparklineData.length - 1)) * 100;
                  const y = 30 - ((d - min) / range) * 26;
                  return `${x}%,${y}`;
                })
                .join(" ")}
            />
          </svg>
        </div>
      )}
    </div>
  );
};
