"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SlidersHorizontal, Film, Camera, Grid, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { path: "/studio", label: "Studio", icon: SlidersHorizontal },
  { path: "/morph", label: "Morph", icon: Film },
  { path: "/match", label: "Match", icon: Camera },
  { path: "/grid", label: "Grid", icon: Grid },
  { path: "/lab", label: "Lab", icon: FlaskConical },
];

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-surface px-2 py-1.5 flex items-center justify-around shadow-sm">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname.startsWith(tab.path);

        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={cn(
              "flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg transition-colors",
              isActive
                ? "text-accent font-medium bg-accent-subtle"
                : "text-text-muted hover:text-text-primary"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
