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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#07080D]/95 backdrop-blur-2xl px-2 py-2 flex items-center justify-around shadow-2xl">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname.startsWith(tab.path);

        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={cn(
              "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all",
              isActive
                ? "text-[#8B7CFF]"
                : "text-[#8B8FA3] hover:text-[#EDEEF3]"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
