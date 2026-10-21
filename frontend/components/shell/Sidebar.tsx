"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SlidersHorizontal,
  Film,
  Camera,
  Grid,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  Atom,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    path: "/studio",
    label: "Facial Math",
    icon: SlidersHorizontal,
    badge: "Vector Ops",
  },
  {
    path: "/morph",
    label: "Morphing",
    icon: Film,
    badge: "Slerp/Lerp",
  },
  {
    path: "/match",
    label: "Photo Matcher",
    icon: Camera,
    badge: "Inversion",
  },
  {
    path: "/grid",
    label: "Classic Grid",
    icon: Grid,
    badge: "Sampling",
  },
  {
    path: "/lab",
    label: "Research Lab",
    icon: FlaskConical,
    badge: "Metrics",
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col justify-between border-r border-white/[0.08] bg-[#07080D]/95 backdrop-blur-2xl transition-all duration-300 z-40 h-screen sticky top-0",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Top Logo Section */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <Link href="/studio" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B7CFF] to-[#38E1FF] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(139,124,255,0.4)]">
              <Atom className="w-5 h-5 text-black animate-spin-slow" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-sm tracking-tight text-[#EDEEF3] leading-none">
                  Latent Studio
                </span>
                <span className="text-[10px] font-mono text-[#8B8FA3] tracking-widest uppercase mt-1">
                  DCGAN Face Lab
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-[#8B8FA3] hover:text-[#EDEEF3] hover:bg-white/[0.06] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Routes */}
        <nav className="p-3 space-y-1.5 mt-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                  isActive
                    ? "bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30 shadow-[0_0_20px_rgba(139,124,255,0.15)]"
                    : "text-[#8B8FA3] hover:text-[#EDEEF3] hover:bg-white/[0.04]"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive
                      ? "text-[#8B7CFF]"
                      : "text-[#8B8FA3] group-hover:text-[#EDEEF3]"
                  )}
                />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="ml-auto text-[9px] font-mono text-[#8B8FA3] bg-white/[0.05] px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}

                {/* Left Active Glow Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#8B7CFF] shadow-[0_0_8px_#8B7CFF]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Specimen Indicator */}
      <div className="p-4 border-t border-white/[0.08]">
        {!collapsed ? (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8B8FA3]">
              <span>Radford et al. 2015</span>
              <Info className="w-3 h-3 text-[#8B7CFF]" />
            </div>
            <div className="text-[10px] text-[#8B8FA3]/80 font-mono">
              CelebA · z ∈ ℝ¹⁰⁰
            </div>
          </div>
        ) : (
          <div className="flex justify-center text-[#8B8FA3]" title="CelebA DCGAN 100D">
            <Info className="w-4 h-4 text-[#8B7CFF]" />
          </div>
        )}
      </div>
    </aside>
  );
};
