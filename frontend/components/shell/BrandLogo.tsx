import React from "react";

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "", size = 22 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Structural bounding frame representing the 100-D latent hypercube boundary */}
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.75"
        className="opacity-90"
      />
      {/* Precision orthogonal coordinate axes / tensor partition */}
      <path
        d="M3 12H21"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeDasharray="2 2"
        className="opacity-40"
      />
      <path
        d="M12 3V21"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeDasharray="2 2"
        className="opacity-40"
      />
      {/* Central latent origin dot */}
      <circle cx="12" cy="12" r="2.25" fill="currentColor" />
    </svg>
  );
};
