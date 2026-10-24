"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusChip } from "@/components/ui/StatusChip";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BrandLogo } from "@/components/shell/BrandLogo";
import { FileText } from "lucide-react";

export const TopBar: React.FC = () => {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname.includes("/studio")) return "Seed Studio";
    if (pathname.includes("/morph")) return "Morphing Studio";
    if (pathname.includes("/match")) return "Photo Matcher";
    if (pathname.includes("/grid")) return "Classic Generator";
    if (pathname.includes("/lab")) return "Research Lab & Diagnostics";
    return "Latent Studio";
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border-subtle bg-surface px-4 lg:px-8 py-3 flex items-center justify-between">
      {/* Mobile Title with Brand Icon & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-surface-elevated border border-border-subtle text-accent flex items-center justify-center">
            <BrandLogo size={16} />
          </div>
          <span className="font-semibold text-sm text-text-primary">Latent Studio</span>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
            Observatory
          </span>
          <span className="text-border-strong">/</span>
          <span className="text-xs font-semibold text-text-primary">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Right Action & Status Container */}
      <div className="flex items-center gap-2.5">
        <StatusChip />

        <Link
          href="/lab"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle hover:border-border-strong bg-surface-elevated text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-text-muted" />
          <span>Paper & Ablations</span>
        </Link>

        {/* Theme Switcher Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
};
