"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusChip } from "@/components/ui/StatusChip";
import { Atom, Compass, Sparkles } from "lucide-react";

export const TopBar: React.FC = () => {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname.includes("/studio")) return "Facial Math Studio";
    if (pathname.includes("/morph")) return "Morphing Studio";
    if (pathname.includes("/match")) return "Photo Matcher";
    if (pathname.includes("/grid")) return "Classic Generator";
    if (pathname.includes("/lab")) return "Research Lab & Diagnostics";
    return "Latent Studio";
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#07080D]/80 backdrop-blur-xl px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Mobile Title with Brand Icon */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#8B7CFF] to-[#38E1FF] flex items-center justify-center">
            <Atom className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-sm text-[#EDEEF3]">Latent Studio</span>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[#8B8FA3]">
            Observatory
          </span>
          <span className="text-white/20">/</span>
          <span className="text-xs font-semibold text-[#EDEEF3]">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Right Action & Status Container */}
      <div className="flex items-center gap-3">
        <StatusChip />

        <Link
          href="/lab"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.08] hover:border-[#8B7CFF]/40 bg-[#0E1018] text-xs font-mono text-[#8B8FA3] hover:text-[#EDEEF3] transition-all"
        >
          <Compass className="w-3.5 h-3.5 text-[#8B7CFF]" />
          <span>Paper & Ablations</span>
        </Link>
      </div>
    </header>
  );
};
