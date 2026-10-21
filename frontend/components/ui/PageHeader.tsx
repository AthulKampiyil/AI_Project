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
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-text-primary">
            {title}
          </h1>
          {badge && (
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent-subtle text-accent border border-accent/25 font-semibold">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted mt-1 font-normal max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};
