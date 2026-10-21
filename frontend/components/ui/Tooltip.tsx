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
        <span className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-border-strong text-xs text-text-primary">
          {term}
          <HelpCircle className="w-3 h-3 text-text-muted" />
        </span>
      )}

      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 rounded-xl bg-surface border border-border-subtle text-xs text-text-secondary shadow-lg z-50 pointer-events-none transition-all">
          <p className="leading-relaxed">{content}</p>
        </div>
      )}
    </div>
  );
};
