import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-subtle bg-surface p-5 text-text-primary shadow-sm transition-all duration-150",
        glow && "hover:border-border-strong hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Backward-compatible alias for existing imports
export const GlassCard = Card;
