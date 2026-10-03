import React from "react";
import { RotateCcw, Compass, Layers } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import {
  LAYERS,
  LAYER_DISPLAY_NAMES,
  type ModelLayer,
} from "@/data/anatomyManifest";

interface AnatomyControlsProps {
  currentView: "front" | "back" | "left" | "right" | "custom";
  activeLayers: Record<ModelLayer, boolean>;
  onSetView: (view: "front" | "back" | "left" | "right" | "reset") => void;
  onToggleLayer: (layer: ModelLayer) => void;
}

export const AnatomyControls: React.FC<AnatomyControlsProps> = ({
  currentView,
  activeLayers,
  onSetView,
  onToggleLayer,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full">
      {/* ── Layer Toggles ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#18132D]/90 border border-[#7C3AED]/30 backdrop-blur-md shadow-lg overflow-x-auto">
        <div className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#B8AEC8]">
          <Layers className="w-3.5 h-3.5 text-[#A78BFA]" />
          <span className="hidden sm:inline">Layers:</span>
        </div>

        {LAYERS.map((layer) => {
          const isActive = Boolean(activeLayers[layer]);
          return (
            <GradientButton
              key={layer}
              type="button"
              variant={isActive ? "default" : "variant"}
              onClick={() => onToggleLayer(layer)}
              className="min-w-0 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer uppercase"
              aria-label={`Toggle ${LAYER_DISPLAY_NAMES[layer]} Layer`}
            >
              <span>{LAYER_DISPLAY_NAMES[layer]}</span>
            </GradientButton>
          );
        })}
      </div>

      {/* ── Camera Perspective Controls: Front / Back / Left / Right / Reset */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#18132D]/90 border border-[#7C3AED]/30 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#B8AEC8]">
          <Compass className="w-3.5 h-3.5 text-[#F97368]" />
          <span className="hidden sm:inline">View:</span>
        </div>

        {(["front", "back", "left", "right"] as const).map((v) => (
          <GradientButton
            key={v}
            type="button"
            variant={currentView === v ? "default" : "variant"}
            onClick={() => onSetView(v)}
            className="min-w-0 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer uppercase"
            aria-label={`Rotate to ${v} View`}
          >
            <span>{v}</span>
          </GradientButton>
        ))}

        <GradientButton
          type="button"
          variant="variant"
          onClick={() => onSetView("reset")}
          className="min-w-0 px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer text-[#B8AEC8] hover:text-[#FFFDF9]"
          aria-label="Reset Camera View"
          title="Reset Camera"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px] ml-1">RESET</span>
        </GradientButton>
      </div>
    </div>
  );
};

export default AnatomyControls;
