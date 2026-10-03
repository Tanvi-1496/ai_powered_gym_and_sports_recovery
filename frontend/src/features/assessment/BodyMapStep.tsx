import React, { useState, Suspense, lazy } from "react";
import {
  Sparkles,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Info,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import type { AssessmentData } from "@/services/assessment";
import { ConfirmedAreas } from "@/components/assessment/ConfirmedAreas";
import { ManualAreaInput } from "@/components/assessment/ManualAreaInput";
import { BodyMap, FRONT_REGIONS, BACK_REGIONS } from "./BodyMap";
import {
  byId,
  partsByMeshName,
  ALL_ANATOMY_LABELS,
  type AnatomyStructure,
} from "@/data/anatomyManifest";
import { GradientButton } from "@/components/ui/gradient-button";

// Lazy-load the heavy 3D Anatomy Viewer for optimal route-level code splitting
const AnatomyViewer = lazy(() => import("@/components/assessment/AnatomyViewer"));

interface BodyMapStepProps {
  formData: AssessmentData;
  updateFormData: (fields: Partial<AssessmentData>) => void;
  errors: Record<string, string>;
}

// Global region lookup dictionary exported for backwards compatibility with AssessmentSummary & ReviewStep
export const ALL_BODY_REGIONS: Record<string, string> = {
  ...[...FRONT_REGIONS, ...BACK_REGIONS].reduce((acc, r) => {
    acc[r.id] = r.label;
    return acc;
  }, {} as Record<string, string>),
  ...ALL_ANATOMY_LABELS,
};

export const BodyMapStep: React.FC<BodyMapStepProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(
    null
  );
  const [useAccessible2DMap, setUseAccessible2DMap] = useState<boolean>(false);
  const [view2D, setView2D] = useState<"front" | "back">("front");

  const confirmedAreas = formData.body_areas || [];

  // ── Handlers for Anatomy Confirmation and Removal ────────────────────
  const handleConfirmArea = (structure: AnatomyStructure) => {
    if (!confirmedAreas.includes(structure.id)) {
      updateFormData({ body_areas: [...confirmedAreas, structure.id] });
    }
  };

  const handleRemoveArea = (areaIdOrText: string) => {
    updateFormData({
      body_areas: confirmedAreas.filter((item) => item !== areaIdOrText),
    });
    if (selectedStructureId === areaIdOrText) {
      setSelectedStructureId(null);
    }
  };

  const handleAddManualArea = (description: string) => {
    const cleanText = description.trim();
    if (!cleanText) return;
    if (!confirmedAreas.includes(cleanText)) {
      updateFormData({ body_areas: [...confirmedAreas, cleanText] });
    }
  };

  const handleSelectStructure = (structure: AnatomyStructure | null) => {
    if (structure) {
      setSelectedStructureId(structure.id);
    } else {
      setSelectedStructureId(null);
    }
  };

  const handleFocusFromChip = (areaIdOrText: string) => {
    if (byId[areaIdOrText] || partsByMeshName.has(areaIdOrText)) {
      setSelectedStructureId(areaIdOrText);
    }
  };

  // 2D fallback toggle region handler
  const handleToggle2DRegion = (regionId: string) => {
    if (confirmedAreas.includes(regionId)) {
      updateFormData({
        body_areas: confirmedAreas.filter((id) => id !== regionId),
      });
    } else {
      updateFormData({ body_areas: [...confirmedAreas, regionId] });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-page-enter max-w-5xl mx-auto">
      {/* ── 1. Step Title & Subheader ─────────────────────────────────── */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-xs font-bold text-[#FDBA8C] uppercase tracking-wider font-display mb-1">
          <Sparkles className="w-3.5 h-3.5 text-[#F97368]" />
          <span>REVORA 3D Anatomy Explorer</span>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#FFFDF9] tracking-tight font-display">
          Where do you feel pain or discomfort?
        </h2>

        <p className="text-xs sm:text-sm text-[#B8AEC8] max-w-2xl leading-relaxed">
          Explore the authentic 3D human anatomy model. Rotate, zoom, search specific muscles, joints, or ligaments, and confirm your affected areas for biomechanical analysis.
        </p>
      </div>

      {/* ── 2. Prominent, Centered 3D Human Anatomy Viewer ────────────── */}
      {!useAccessible2DMap ? (
        <div className="relative w-full">
          {/* Subtle Outer Glowing Accent Border */}
          <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-[#7C3AED]/70 via-[#F97368]/40 to-[#7C3AED]/30 shadow-[0_0_50px_-15px_rgba(124,58,237,0.35)]">
            <Suspense
              fallback={
                <div
                  className="w-full rounded-3xl bg-[#0D0A1F] border border-[#7C3AED]/30 flex flex-col items-center justify-center p-8 space-y-4 text-center"
                  style={{ minHeight: "560px", height: "72vh", maxHeight: "800px" }}
                >
                  <div className="relative">
                    <Loader2 className="w-10 h-10 animate-spin text-[#F97368]" />
                    <Sparkles className="w-4 h-4 text-[#FDBA8C] absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#FFFDF9] font-display uppercase tracking-wider">
                      Initializing 3D Anatomy Engine
                    </p>
                    <p className="text-xs text-[#B8AEC8]">
                      Loading 1,066 anatomical structures & shader pipeline...
                    </p>
                  </div>
                </div>
              }
            >
              <AnatomyViewer
                selectedStructureId={selectedStructureId}
                confirmedAreas={confirmedAreas}
                onSelectStructure={handleSelectStructure}
                onConfirmArea={handleConfirmArea}
                onRemoveArea={handleRemoveArea}
                modelUrl="/models/revora-anatomy.glb"
              />
            </Suspense>
          </div>

          {/* Validation Error Notice if user tries to continue without selecting an area */}
          {errors.body_areas && (
            <div className="mt-3 p-3.5 rounded-2xl bg-[#FF6B6B]/15 border border-[#FF6B6B]/40 text-xs sm:text-sm text-[#FF6B6B] font-medium flex items-center gap-2 animate-in fade-in">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errors.body_areas}</span>
            </div>
          )}
        </div>
      ) : (
        /* ── Accessible 2D Fallback Map ──────────────────────────────── */
        <div className="p-6 rounded-3xl bg-[#18132D] border border-[#7C3AED]/30 space-y-4 animate-in fade-in duration-200 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#7C3AED]/20">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#F97368]" />
              <h3 className="text-sm font-bold text-[#FFFDF9] font-display">
                2D Body Region Map
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <GradientButton
                type="button"
                variant={view2D === "front" ? "default" : "variant"}
                onClick={() => setView2D("front")}
                className="min-w-0 px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                FRONT
              </GradientButton>
              <GradientButton
                type="button"
                variant={view2D === "back" ? "default" : "variant"}
                onClick={() => setView2D("back")}
                className="min-w-0 px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                BACK
              </GradientButton>
            </div>
          </div>

          <div className="flex justify-center py-4">
            <BodyMap
              selectedRegions={confirmedAreas}
              onToggleRegion={handleToggle2DRegion}
              view={view2D}
            />
          </div>
        </div>
      )}

      {/* ── 3. Confirmed Affected Areas Chips ─────────────────────────── */}
      <ConfirmedAreas
        areas={confirmedAreas}
        onRemoveArea={handleRemoveArea}
        onFocusArea={handleFocusFromChip}
      />

      {/* ── 4. Manual Natural-Language Area Input ──────────────────────── */}
      <ManualAreaInput
        onAddManualArea={handleAddManualArea}
        existingAreas={confirmedAreas}
      />

      {/* ── 5. Non-Diagnostic Medical Notice ──────────────────────────── */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#18132D]/70 border border-[#7C3AED]/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#A78BFA] shrink-0 mt-0.5" />
        <p className="text-xs text-[#B8AEC8] leading-relaxed">
          <strong className="text-[#FFFDF9]">Symptom Telemetry Note:</strong> Selecting an area records where symptoms and discomfort are felt during or after activity. This anatomical input is utilized for training load and injury risk assessment and does not constitute a certified medical diagnosis.
        </p>
      </div>

      {/* ── 6. Accessible Mode Toggle Footer ──────────────────────────── */}
      <div className="flex items-center justify-between pt-1 text-xs text-[#B8AEC8]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUseAccessible2DMap(!useAccessible2DMap)}
            className="text-[11px] font-semibold text-[#A78BFA] hover:text-[#FFFDF9] underline flex items-center gap-1.5 cursor-pointer"
          >
            {useAccessible2DMap ? (
              <>
                <ToggleRight className="w-4 h-4 text-[#F97368]" />
                <span>Switch to 3D Anatomy Explorer</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-[#A78BFA]" />
                <span>Switch to 2D Schematic Body Map</span>
              </>
            )}
          </button>
        </div>

        <span className="text-[11px] text-[#B8AEC8]/70 hidden sm:inline">
          Use mouse or touch to rotate & zoom the 3D model
        </span>
      </div>
    </div>
  );
};

export default BodyMapStep;
