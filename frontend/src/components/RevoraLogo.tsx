import React from "react";
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
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Official Running-Athlete REVORA Emblem */}
      <img
        src={revoraEmblem}
        alt="REVORA"
        className={`${emblemSizes[size]} w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105`}
        loading="eager"
        decoding="async"
      />

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

