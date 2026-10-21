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
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shell/BrandLogo";

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
        "hidden lg:flex flex-col justify-between border-r border-border-subtle bg-surface transition-all duration-200 z-40 h-screen sticky top-0",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Top Logo Section */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <Link href="/studio" className="flex items-center gap-3 overflow-hidden group">
            <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-border-subtle text-accent flex items-center justify-center shrink-0 shadow-xs group-hover:border-border-strong transition-colors">
              <BrandLogo size={20} />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-semibold text-sm tracking-tight text-text-primary leading-none">
                  Latent Studio
                </span>
                <span className="text-[10px] font-mono text-text-muted tracking-wider uppercase mt-1">
                  DCGAN Face Lab
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
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
        <nav className="p-3 space-y-1 mt-2">
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
                    ? "bg-accent-subtle text-accent font-semibold border border-accent/20"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive
                      ? "text-accent"
                      : "text-text-muted group-hover:text-text-primary"
                  )}
                />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span
                    className={cn(
                      "ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded border",
                      isActive
                        ? "text-accent border-accent/20 bg-accent/5"
                        : "text-text-muted border-border-subtle bg-surface-elevated"
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Left Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Specimen Indicator */}
      <div className="p-4 border-t border-border-subtle">
        {!collapsed ? (
          <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary font-medium">
              <span>Radford et al. 2015</span>
              <Info className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="text-[10px] text-text-muted font-mono">
              CelebA · z ∈ ℝ¹⁰⁰
            </div>
          </div>
        ) : (
          <div className="flex justify-center text-text-muted" title="CelebA DCGAN 100D">
            <Info className="w-4 h-4 text-accent" />
          </div>
        )}
      </div>
    </aside>
  );
};
