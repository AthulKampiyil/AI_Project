import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  children,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#EDEEF3]">
            {title}
          </h1>
          {badge && (
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8B7CFF]/15 text-[#8B7CFF] border border-[#8B7CFF]/30 font-semibold">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-[#8B8FA3] mt-1 font-normal max-w-2xl">
          {subtitle}
        </p>
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
};
