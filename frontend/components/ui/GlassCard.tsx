import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#0E1018]/80 backdrop-blur-xl p-5 text-[#EDEEF3] transition-all duration-200",
        glow && "hover:border-[#8B7CFF]/30 hover:shadow-[0_8px_30px_rgb(139,124,255,0.12)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
