import React, { useState } from "react";
import revoraEmblem from "@/assets/revora-emblem.png";

export interface RevoraLogoProps {
  className?: string;
  variant?: "dark-bg" | "light-bg" | "icon-only";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export const RevoraLogo: React.FC<RevoraLogoProps> = ({
  className = "",
  variant = "dark-bg",
  size = "md",
  showTagline = true,
}) => {
  // Track image load attempts: 0 = bundled asset, 1 = public root asset, 2 = athletic vector fallback
  const [loadStage, setLoadStage] = useState<number>(0);

  const emblemSizes = {
    sm: "h-7 sm:h-8",
    md: "h-8 sm:h-9",
    lg: "h-10 sm:h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const isLight = variant === "light-bg";

  return (
    <div
      className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}
    >
      {/* Official Running-Athlete REVORA Emblem */}
      {loadStage < 2 ? (
        <img
          src={loadStage === 0 ? revoraEmblem : "/revora-emblem.png"}
          alt="REVORA"
          className={`${emblemSizes[size]} w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105`}
          loading="eager"
          decoding="async"
          onError={() => setLoadStage((prev) => prev + 1)}
        />
      ) : (
        /* Athletic Vector Shield with Running Silhouette (Graceful Fallback) */
        <div
          aria-label="REVORA emblem"
          className={`${emblemSizes[size]} aspect-square shrink-0 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#F97368] to-[#FDBA8C] p-[1.5px] shadow-lg shadow-[#F97368]/20 flex items-center justify-center`}
        >
          <div className="w-full h-full bg-[#0D0A1F] rounded-[10px] flex items-center justify-center p-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="url(#revora-grad)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-full h-full"
            >
              <defs>
                <linearGradient id="revora-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDBA8C" />
                  <stop offset="50%" stopColor="#F97368" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
              {/* Athletic stylized runner icon */}
              <circle cx="17" cy="4" r="2" fill="url(#revora-grad)" stroke="none" />
              <path d="m15 8-4 3 2 4 4 1" />
              <path d="M6 16l4-2 2-5-3-2-5 3" />
              <path d="M13 15l-3 6" />
            </svg>
          </div>
        </div>
      )}

      {/* Brand Typography */}
      {variant !== "icon-only" && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-black tracking-tight font-display ${textSizes[size]} ${
                isLight ? "text-[#0D0A1F]" : "text-[#FFFDF9]"
              }`}
            >
              REVORA
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#F97368] shadow-sm shadow-[#F97368]/50" />
          </div>

          {showTagline && (
            <span
              className={`text-[10px] font-semibold tracking-widest uppercase mt-0.5 ${
                isLight ? "text-[#7C3AED]" : "text-[#FDBA8C]/90"
              }`}
            >
              AI Sports Tech
            </span>
          )}
        </div>
      )}
    </div>
  );
};
