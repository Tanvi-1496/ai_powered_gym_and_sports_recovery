import React from "react";

export interface BodyRegionDef {
  id: string;
  label: string;
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  center?: [number, number];
}

interface BodyRegionProps {
  region: BodyRegionDef;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string) => void;
  onHover: (region: BodyRegionDef | null) => void;
}

export const BodyRegion: React.FC<BodyRegionProps> = ({
  region,
  isSelected,
  isHovered,
  onSelect,
  onHover,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(region.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(region.id);
    }
  };

  // Base styling for region path
  const fillStyle = isSelected
    ? "url(#selected-region-gradient)"
    : isHovered
    ? "rgba(139, 92, 246, 0.55)"
    : "rgba(33, 24, 58, 0.85)";

  const strokeStyle = isSelected
    ? "#F97368"
    : isHovered
    ? "#A78BFA"
    : "rgba(167, 139, 250, 0.28)";

  const strokeWidth = isSelected ? 2.5 : isHovered ? 2 : 1.2;

  if (region.r && region.cx !== undefined && region.cy !== undefined) {
    return (
      <g
        className="cursor-pointer transition-all duration-200 outline-none focus:ring-2 focus:ring-[#8B5CF6]"
        onClick={handleClick}
        onMouseEnter={() => onHover(region)}
        onMouseLeave={() => onHover(null)}
        onFocus={() => onHover(region)}
        onBlur={() => onHover(null)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={region.label}
        aria-pressed={isSelected}
      >
        <circle
          cx={region.cx}
          cy={region.cy}
          r={region.r}
          fill={fillStyle}
          stroke={strokeStyle}
          strokeWidth={strokeWidth}
          className={`transition-all duration-300 ${
            isSelected ? "animate-region-glow drop-shadow-[0_0_8px_rgba(249,115,104,0.7)]" : ""
          }`}
        />
        {isSelected && (
          <circle
            cx={region.cx}
            cy={region.cy}
            r={5}
            fill="#FFFDF9"
            className="animate-ping opacity-75 pointer-events-none"
          />
        )}
      </g>
    );
  }

  return (
    <g
      className="cursor-pointer transition-all duration-200 outline-none focus:ring-2 focus:ring-[#8B5CF6]"
      onClick={handleClick}
      onMouseEnter={() => onHover(region)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(region)}
      onBlur={() => onHover(null)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={region.label}
      aria-pressed={isSelected}
    >
      <path
        d={region.d}
        fill={fillStyle}
        stroke={strokeStyle}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
        className={`transition-all duration-300 ${
          isSelected ? "animate-region-glow drop-shadow-[0_0_10px_rgba(249,115,104,0.75)]" : ""
        }`}
      />
      {isSelected && region.center && (
        <circle
          cx={region.center[0]}
          cy={region.center[1]}
          r={4}
          fill="#FFFDF9"
          className="pointer-events-none drop-shadow-[0_0_4px_#F97368]"
        />
      )}
    </g>
  );
};

export default BodyRegion;
