import React, { useState } from "react";
import { BodyRegion, type BodyRegionDef } from "./BodyRegion";

interface BodyMapProps {
  selectedRegions: string[];
  onToggleRegion: (regionId: string) => void;
  view: "front" | "back";
}

// ── FRONT BODY REGIONS ──────────────────────────────────────────────────
export const FRONT_REGIONS: BodyRegionDef[] = [
  { id: "head", label: "Head", cx: 170, cy: 45, r: 24, center: [170, 45] },
  { id: "neck", label: "Neck", d: "M 158 70 L 182 70 L 185 90 L 155 90 Z", center: [170, 80] },
  { id: "left_shoulder", label: "Left Shoulder", d: "M 186 90 L 230 102 L 224 136 L 186 114 Z", center: [208, 114] },
  { id: "right_shoulder", label: "Right Shoulder", d: "M 154 90 L 110 102 L 116 136 L 154 114 Z", center: [132, 114] },
  { id: "left_chest", label: "Left Chest", d: "M 170 92 L 206 96 L 200 148 L 170 148 Z", center: [186, 120] },
  { id: "right_chest", label: "Right Chest", d: "M 170 92 L 134 96 L 140 148 L 170 148 Z", center: [154, 120] },
  { id: "left_arm", label: "Left Arm (Bicep)", d: "M 224 136 L 242 144 L 232 196 L 216 190 Z", center: [230, 166] },
  { id: "right_arm", label: "Right Arm (Bicep)", d: "M 116 136 L 98 144 L 108 196 L 124 190 Z", center: [110, 166] },
  { id: "left_elbow", label: "Left Elbow", d: "M 232 196 L 244 200 L 240 226 L 226 222 Z", center: [236, 212] },
  { id: "right_elbow", label: "Right Elbow", d: "M 108 196 L 96 200 L 100 226 L 114 222 Z", center: [104, 212] },
  { id: "left_wrist", label: "Left Wrist", d: "M 240 226 L 252 230 L 248 258 L 236 254 Z", center: [244, 242] },
  { id: "right_wrist", label: "Right Wrist", d: "M 100 226 L 88 230 L 92 258 L 104 254 Z", center: [96, 242] },
  { id: "left_hand", label: "Left Hand", d: "M 248 258 L 262 270 L 254 300 L 238 286 Z", center: [250, 280] },
  { id: "right_hand", label: "Right Hand", d: "M 92 258 L 78 270 L 86 300 L 102 286 Z", center: [90, 280] },
  { id: "abdomen", label: "Abdomen / Core", d: "M 140 148 L 200 148 L 194 212 L 146 212 Z", center: [170, 180] },
  { id: "left_hip", label: "Left Hip / Pelvis", d: "M 170 212 L 206 212 L 214 256 L 170 256 Z", center: [192, 234] },
  { id: "right_hip", label: "Right Hip / Pelvis", d: "M 170 212 L 134 212 L 126 256 L 170 256 Z", center: [148, 234] },
  { id: "left_thigh", label: "Left Thigh / Quad", d: "M 172 256 L 212 256 L 204 346 L 172 346 Z", center: [192, 300] },
  { id: "right_thigh", label: "Right Thigh / Quad", d: "M 168 256 L 128 256 L 136 346 L 168 346 Z", center: [148, 300] },
  { id: "left_knee", label: "Left Knee", d: "M 172 348 L 204 348 L 200 388 L 172 388 Z", center: [188, 368] },
  { id: "right_knee", label: "Right Knee", d: "M 168 348 L 136 348 L 140 388 L 168 388 Z", center: [152, 368] },
  { id: "left_calf", label: "Left Shin / Calf", d: "M 172 390 L 198 390 L 192 462 L 172 462 Z", center: [184, 426] },
  { id: "right_calf", label: "Right Shin / Calf", d: "M 168 390 L 142 390 L 148 462 L 168 462 Z", center: [156, 426] },
  { id: "left_ankle", label: "Left Ankle", d: "M 172 464 L 190 464 L 188 490 L 172 490 Z", center: [180, 477] },
  { id: "right_ankle", label: "Right Ankle", d: "M 168 464 L 150 464 L 152 490 L 168 490 Z", center: [160, 477] },
  { id: "left_foot", label: "Left Foot", d: "M 172 492 L 196 498 L 202 522 L 170 522 Z", center: [186, 508] },
  { id: "right_foot", label: "Right Foot", d: "M 168 492 L 144 498 L 138 522 L 170 522 Z", center: [154, 508] },
];

// ── BACK BODY REGIONS ───────────────────────────────────────────────────
export const BACK_REGIONS: BodyRegionDef[] = [
  { id: "head_back", label: "Head (Posterior)", cx: 170, cy: 45, r: 24, center: [170, 45] },
  { id: "neck_back", label: "Neck (Cervical)", d: "M 158 70 L 182 70 L 185 90 L 155 90 Z", center: [170, 80] },
  { id: "left_shoulder_back", label: "Left Shoulder Blade", d: "M 154 90 L 110 102 L 116 136 L 154 114 Z", center: [132, 114] },
  { id: "right_shoulder_back", label: "Right Shoulder Blade", d: "M 186 90 L 230 102 L 224 136 L 186 114 Z", center: [208, 114] },
  { id: "upper_back", label: "Upper Back / Thoracic", d: "M 136 92 L 204 92 L 200 158 L 140 158 Z", center: [170, 125] },
  { id: "lower_back", label: "Lower Back / Lumbar", d: "M 140 160 L 200 160 L 196 214 L 144 214 Z", center: [170, 187] },
  { id: "left_arm_back", label: "Left Arm (Tricep)", d: "M 116 136 L 98 144 L 108 196 L 124 190 Z", center: [110, 166] },
  { id: "right_arm_back", label: "Right Arm (Tricep)", d: "M 224 136 L 242 144 L 232 196 L 216 190 Z", center: [230, 166] },
  { id: "left_elbow_back", label: "Left Elbow", d: "M 108 196 L 96 200 L 100 226 L 114 222 Z", center: [104, 212] },
  { id: "right_elbow_back", label: "Right Elbow", d: "M 232 196 L 244 200 L 240 226 L 226 222 Z", center: [236, 212] },
  { id: "left_wrist_back", label: "Left Wrist", d: "M 100 226 L 88 230 L 92 258 L 104 254 Z", center: [96, 242] },
  { id: "right_wrist_back", label: "Right Wrist", d: "M 240 226 L 252 230 L 248 258 L 236 254 Z", center: [244, 242] },
  { id: "left_hand_back", label: "Left Hand", d: "M 92 258 L 78 270 L 86 300 L 102 286 Z", center: [90, 280] },
  { id: "right_hand_back", label: "Right Hand", d: "M 248 258 L 262 270 L 254 300 L 238 286 Z", center: [250, 280] },
  { id: "glutes_hip_left", label: "Left Glute", d: "M 170 214 L 132 214 L 126 260 L 170 260 Z", center: [148, 238] },
  { id: "glutes_hip_right", label: "Right Glute", d: "M 170 214 L 208 214 L 214 260 L 170 260 Z", center: [192, 238] },
  { id: "left_thigh_back", label: "Left Hamstring", d: "M 168 260 L 128 260 L 136 348 L 168 348 Z", center: [148, 304] },
  { id: "right_thigh_back", label: "Right Hamstring", d: "M 172 260 L 212 260 L 204 348 L 172 348 Z", center: [192, 304] },
  { id: "left_knee_back", label: "Left Knee (Posterior)", d: "M 168 350 L 136 350 L 140 390 L 168 390 Z", center: [152, 370] },
  { id: "right_knee_back", label: "Right Knee (Posterior)", d: "M 172 350 L 204 350 L 200 390 L 172 390 Z", center: [188, 370] },
  { id: "left_calf_back", label: "Left Calf (Gastrocnemius)", d: "M 168 392 L 142 392 L 148 464 L 168 464 Z", center: [156, 428] },
  { id: "right_calf_back", label: "Right Calf (Gastrocnemius)", d: "M 172 392 L 198 392 L 192 464 L 172 464 Z", center: [184, 428] },
  { id: "left_ankle_back", label: "Left Achilles Tendon", d: "M 168 466 L 150 466 L 152 492 L 168 492 Z", center: [160, 479] },
  { id: "right_ankle_back", label: "Right Achilles Tendon", d: "M 172 466 L 190 466 L 188 492 L 172 492 Z", center: [180, 479] },
  { id: "left_foot_back", label: "Left Heel / Sole", d: "M 168 494 L 144 500 L 140 524 L 168 524 Z", center: [154, 510] },
  { id: "right_foot_back", label: "Right Heel / Sole", d: "M 172 494 L 196 500 L 200 524 L 172 524 Z", center: [186, 510] },
];

export const BodyMap: React.FC<BodyMapProps> = ({
  selectedRegions,
  onToggleRegion,
  view = "front",
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegionDef | null>(null);

  const activeRegions = view === "front" ? FRONT_REGIONS : BACK_REGIONS;

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* ── Hover Tooltip Banner ──────────────────────────────────────── */}
      <div className="h-7 mb-2 flex items-center justify-center">
        {hoveredRegion ? (
          <div className="px-3 py-1 rounded-full bg-[#18132D] border border-[#8B5CF6]/50 text-xs font-bold text-[#FFFDF9] shadow-md shadow-[#7C3AED]/30 flex items-center gap-1.5 animate-in fade-in duration-150">
            <span className="w-2 h-2 rounded-full bg-[#F97368]" />
            <span>{hoveredRegion.label}</span>
          </div>
        ) : (
          <span className="text-xs text-[#B8AEC8]/70 italic">
            Hover or tap an area to select
          </span>
        )}
      </div>

      {/* ── Interactive SVG Human Body Map ────────────────────────────── */}
      <div className="relative w-full max-w-[310px] sm:max-w-[340px] aspect-[340/540] flex items-center justify-center bg-[#120D26]/70 rounded-3xl p-3 border border-[#7C3AED]/20 shadow-inner">
        <svg
          key={view}
          viewBox="0 0 340 540"
          className="w-full h-full animate-body-flip drop-shadow-xl"
        >
          {/* SVG Definitions & Gradients */}
          <defs>
            <linearGradient id="selected-region-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#FF6B6B" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#F97368" stopOpacity="0.95" />
            </linearGradient>

            <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Body Silhouette Guide Lines */}
          <g opacity="0.35" stroke="#7C3AED" strokeWidth="1" strokeDasharray="3 3">
            <line x1="170" y1="20" x2="170" y2="525" />
          </g>

          {/* Render All Anatomical Body Regions */}
          {activeRegions.map((region) => {
            const isSelected = selectedRegions.includes(region.id);
            const isHovered = hoveredRegion?.id === region.id;

            return (
              <BodyRegion
                key={region.id}
                region={region}
                isSelected={isSelected}
                isHovered={isHovered}
                onSelect={onToggleRegion}
                onHover={setHoveredRegion}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default BodyMap;
