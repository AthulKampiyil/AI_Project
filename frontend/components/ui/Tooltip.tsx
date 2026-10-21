"use client";

import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  term?: string;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  term,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={cn("relative inline-flex items-center gap-1", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children ? (
        children
      ) : (
        <span className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-[#8B8FA3] text-xs text-[#EDEEF3]">
          {term}
          <HelpCircle className="w-3 h-3 text-[#8B8FA3]" />
        </span>
      )}

      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 rounded-xl bg-[#0E1018] border border-white/15 text-xs text-[#EDEEF3] shadow-2xl z-50 pointer-events-none backdrop-blur-xl animate-in fade-in duration-150">
          <p className="leading-relaxed">{content}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#0E1018]" />
        </div>
      )}
    </div>
  );
};
