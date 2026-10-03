import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Bvh } from "@react-three/drei";
import * as THREE from "three";
import {
  Sparkles,
  RotateCcw,
  Compass,
  Layers,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  MANIFEST,
  LAYERS,
  DEFAULT_LAYERS,
  LAYER_DISPLAY_NAMES,
  LAYER_COUNTS,
  byId,
  partsByMeshName,
  getAnatomyForMesh,
  type AnatomyStructure,
  type ModelLayer,
} from "@/data/anatomyManifest";
import { GradientButton } from "@/components/ui/gradient-button";
import { AnatomyInfoPanel } from "./AnatomyInfoPanel";
import { AnatomySearch } from "./AnatomySearch";

// Preload the GLB model asset
useGLTF.preload("/models/revora-anatomy.glb");

export interface AnatomyViewerProps {
  selectedStructureId: string | null;
  confirmedAreas: string[];
  onSelectStructure: (structure: AnatomyStructure | null) => void;
  onConfirmArea: (structure: AnatomyStructure) => void;
  onRemoveArea?: (areaId: string) => void;
  modelUrl?: string;
  className?: string;
}

// ── Camera Presets (Upright adult model: center y ≈ 0.88m, facing +Z, left is +X)
const CAMERA_PRESETS = {
  front: { position: [0, 0.88, 2.35] as [number, number, number], target: [0, 0.88, 0] as [number, number, number] },
  back: { position: [0, 0.88, -2.35] as [number, number, number], target: [0, 0.88, 0] as [number, number, number] },
  left: { position: [2.35, 0.88, 0] as [number, number, number], target: [0, 0.88, 0] as [number, number, number] },
  right: { position: [-2.35, 0.88, 0] as [number, number, number], target: [0, 0.88, 0] as [number, number, number] },
};

// Selection & Highlight Color Tokens (REVORA Design System)
const COLOR_HOVER = new THREE.Color("#8B5CF6"); // Violet emissive
const COLOR_SELECTED = new THREE.Color("#F97368"); // Coral emissive
const COLOR_CONFIRMED = new THREE.Color("#A78BFA"); // Lighter violet emissive
const COLOR_BLACK = new THREE.Color("#000000");

// Check user reduced motion preference
function checkReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ── Smooth Camera Controller ─────────────────────────────────────────────
interface CameraControllerProps {
  target: [number, number, number];
  position: [number, number, number];
  controlsRef: React.RefObject<any>;
  animatingRef: React.MutableRefObject<boolean>;
}

function SmoothCameraController({
  target,
  position,
  controlsRef,
  animatingRef,
}: CameraControllerProps) {
  const { camera } = useThree();
  const targetVec = useMemo(() => new THREE.Vector3(...target), [target]);
  const posVec = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((_, delta) => {
    if (!animatingRef.current) return;

    const reduced = checkReducedMotion();
    if (reduced) {
      camera.position.copy(posVec);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetVec);
        controlsRef.current.update();
      }
      animatingRef.current = false;
      return;
    }

    const step = Math.min(delta * 5.5, 0.25);
    camera.position.lerp(posVec, step);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetVec, step);
      controlsRef.current.update();
    }

    const distPos = camera.position.distanceTo(posVec);
    const distTarget = controlsRef.current
      ? controlsRef.current.target.distanceTo(targetVec)
      : 0;

    if (distPos < 0.005 && distTarget < 0.005) {
      camera.position.copy(posVec);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetVec);
        controlsRef.current.update();
      }
      animatingRef.current = false;
    }
  });

  return null;
}

// ── Scene Meshes Renderer ────────────────────────────────────────────────
interface ModelSceneProps {
  modelUrl: string;
  activeLayers: Record<ModelLayer, boolean>;
  selectedMeshNames: Set<string>;
  confirmedMeshNames: Set<string>;
  hoveredMeshName: string | null;
  onHoverMesh: (structure: AnatomyStructure | null, event?: any) => void;
  onClickMesh: (structure: AnatomyStructure) => void;
  onLoaded: (success: boolean, error?: string | null) => void;
}

function ModelScene({
  modelUrl,
  activeLayers,
  selectedMeshNames,
  confirmedMeshNames,
  hoveredMeshName,
  onHoverMesh,
  onClickMesh,
  onLoaded,
}: ModelSceneProps) {
  const { scene } = useGLTF(modelUrl);
  const clonedMaterials = useRef<Map<THREE.Mesh, THREE.MeshStandardMaterial>>(new Map());
  const origProps = useRef<
    Map<
      THREE.Mesh,
      { color: THREE.Color; roughness: number; metalness: number; emissive: THREE.Color; emissiveIntensity: number }
    >
  >(new Map());

  // Startup Dev Verification Check
  useEffect(() => {
    if (import.meta.env.DEV && scene) {
      const glbMeshNames = new Set<string>();
      scene.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          glbMeshNames.add(node.name);
        }
      });

      const manifestMeshNames = new Set(MANIFEST.parts.map((p) => p.meshName));

      // Warn if GLB has mesh not in manifest
      glbMeshNames.forEach((name) => {
        if (!manifestMeshNames.has(name)) {
          console.warn(`[REVORA Anatomy Dev Warning] GLB mesh "${name}" missing from manifest.`);
        }
      });

      // Warn if manifest has mesh not in GLB
      manifestMeshNames.forEach((name) => {
        if (!glbMeshNames.has(name)) {
          console.warn(`[REVORA Anatomy Dev Warning] Manifest part "${name}" missing from GLB model.`);
        }
      });
    }
  }, [scene]);

  // Clone materials per-mesh on first load for isolated highlighting
  useEffect(() => {
    if (!scene) return;

    try {
      scene.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          if (!clonedMaterials.current.has(mesh)) {
            const mat = (
              Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
            ) as THREE.MeshStandardMaterial;

            if (mat && mat.isMaterial) {
              const cloned = mat.clone() as THREE.MeshStandardMaterial;
              mesh.material = cloned;
              clonedMaterials.current.set(mesh, cloned);
              origProps.current.set(mesh, {
                color: cloned.color ? cloned.color.clone() : new THREE.Color("#e2d9d0"),
                roughness: cloned.roughness ?? 0.45,
                metalness: cloned.metalness ?? 0.1,
                emissive: cloned.emissive ? cloned.emissive.clone() : new THREE.Color(0x000000),
                emissiveIntensity: cloned.emissiveIntensity ?? 0,
              });
            }
          }
        }
      });

      onLoaded(true, null);
    } catch (err: any) {
      console.error("Failed setting up anatomy materials:", err);
      onLoaded(false, err?.message || "Failed to parse 3D scene.");
    }

    return () => {
      // Dispose cloned materials on unmount
      clonedMaterials.current.forEach((mat) => mat.dispose());
      clonedMaterials.current.clear();
      origProps.current.clear();
    };
  }, [scene, onLoaded]);

  // Apply layer visibility and highlight styles
  useEffect(() => {
    if (!scene) return;

    scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        const layer = mesh.userData.layer as ModelLayer | undefined;

        // Visibility based on active layers (ignore hidden layers)
        const isVisible = layer ? Boolean(activeLayers[layer]) : false;
        mesh.visible = isVisible;

        // If not visible, no need to update highlighting
        if (!isVisible) return;

        const mat = clonedMaterials.current.get(mesh);
        const orig = origProps.current.get(mesh);
        if (!mat || !orig) return;

        const isHovered = mesh.name === hoveredMeshName;
        const isSelected = selectedMeshNames.has(mesh.name);
        const isConfirmed = confirmedMeshNames.has(mesh.name);

        if (isSelected) {
          // Selected highlight (Coral)
          mat.emissive = COLOR_SELECTED;
          mat.emissiveIntensity = isHovered ? 0.95 : 0.75;
          mat.roughness = 0.3;
        } else if (isHovered) {
          // Hover highlight (Violet)
          mat.emissive = COLOR_HOVER;
          mat.emissiveIntensity = 0.55;
          mat.roughness = 0.35;
        } else if (isConfirmed) {
          // Confirmed in multi-select (Light Violet)
          mat.emissive = COLOR_CONFIRMED;
          mat.emissiveIntensity = 0.38;
          mat.roughness = 0.4;
        } else {
          // Reset to default
          mat.emissive = COLOR_BLACK;
          mat.emissiveIntensity = 0;
          mat.roughness = orig.roughness;
        }
      }
    });
  }, [scene, activeLayers, selectedMeshNames, confirmedMeshNames, hoveredMeshName]);

  // Pointer move / raycast hover handler
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    if (!mesh || !mesh.visible) return;

    const struct = getAnatomyForMesh(mesh.name);
    if (struct) {
      onHoverMesh(struct, e);
    }
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    onHoverMesh(null);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    const mesh = e.object as THREE.Mesh;
    if (!mesh || !mesh.visible) return;

    const struct = getAnatomyForMesh(mesh.name);
    if (struct) {
      onClickMesh(struct);
    }
  };

  return (
    <primitive
      object={scene}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}

// ── Main AnatomyViewer Component ──────────────────────────────────────────
export const AnatomyViewer: React.FC<AnatomyViewerProps> = ({
  selectedStructureId,
  confirmedAreas,
  onSelectStructure,
  onConfirmArea,
  modelUrl = "/models/revora-anatomy.glb",
  className = "",
}) => {
  // Layer Toggles: Default to Muscles only
  const [activeLayers, setActiveLayers] = useState<Record<ModelLayer, boolean>>(DEFAULT_LAYERS);

  // Model Load State
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Interactive Hover & Tooltip State
  const [hoveredStructure, setHoveredStructure] = useState<AnatomyStructure | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Camera State
  const controlsRef = useRef<any>(null);
  const animatingRef = useRef<boolean>(false);
  const [cameraTarget, setCameraTarget] = useState<[number, number, number]>(CAMERA_PRESETS.front.target);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>(CAMERA_PRESETS.front.position);
  const [currentViewPreset, setCurrentViewPreset] = useState<"front" | "back" | "left" | "right" | "custom">("front");

  // Drag vs Click Tracking (so drag to rotate never triggers a selection click)
  const pointerDownPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Selected structure resolved from ID
  const selectedStructure = useMemo<AnatomyStructure | null>(() => {
    if (!selectedStructureId) return null;
    return byId[selectedStructureId] || null;
  }, [selectedStructureId]);

  // Selected mesh names set (supports multi-mesh groups/regions)
  const selectedMeshNames = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    if (selectedStructure) {
      selectedStructure.meshNames.forEach((name) => set.add(name));
    }
    return set;
  }, [selectedStructure]);

  // Confirmed mesh names set across all confirmed IDs
  const confirmedMeshNames = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    confirmedAreas.forEach((areaId) => {
      const struct = byId[areaId] || partsByMeshName.get(areaId);
      if (struct) {
        if ("meshNames" in struct) {
          struct.meshNames.forEach((name) => set.add(name));
        } else if ("meshName" in struct) {
          set.add((struct as any).meshName);
        }
      }
    });
    return set;
  }, [confirmedAreas]);

  // Handle Model Load Status Callback
  const handleLoadStatus = useCallback((loaded: boolean, error?: string | null) => {
    setIsLoading(!loaded);
    if (error) setLoadError(error);
  }, []);

  // ── Focus Camera on a Structure ──────────────────────────────────────────
  const focusCameraOnStructure = useCallback(
    (struct: AnatomyStructure) => {
      if (!controlsRef.current) return;

      const target = struct.cameraTarget;
      const distance = struct.cameraDistance || 0.65;

      // Maintain current view angle while framing target
      const currentCamera = controlsRef.current.object;
      const currentTarget = controlsRef.current.target;

      const dir = new THREE.Vector3()
        .subVectors(currentCamera.position, currentTarget)
        .normalize();

      // Fallback if camera is exactly at target
      if (dir.lengthSq() < 0.0001) {
        dir.set(0, 0, 1);
      }

      const newPos: [number, number, number] = [
        target[0] + dir.x * distance,
        target[1] + dir.y * distance,
        target[2] + dir.z * distance,
      ];

      setCameraTarget(target);
      setCameraPosition(newPos);
      animatingRef.current = true;
      setCurrentViewPreset("custom");
    },
    []
  );

  // ── Select Structure Handler ─────────────────────────────────────────────
  const handleSelectStructure = useCallback(
    (struct: AnatomyStructure | null) => {
      if (!struct) {
        onSelectStructure(null);
        return;
      }

      // Automatically enable required layers so the structure is visible
      setActiveLayers((prev) => {
        let changed = false;
        const next = { ...prev };
        struct.memberLayers.forEach((layer) => {
          if (!next[layer]) {
            next[layer] = true;
            changed = true;
          }
        });
        return changed ? next : prev;
      });

      onSelectStructure(struct);
      focusCameraOnStructure(struct);
    },
    [onSelectStructure, focusCameraOnStructure]
  );

  // ── Camera Preset Buttons Handler ────────────────────────────────────────
  const handleSetViewPreset = useCallback((preset: "front" | "back" | "left" | "right" | "reset") => {
    const p = preset === "reset" ? "front" : preset;
    const config = CAMERA_PRESETS[p];
    setCameraPosition(config.position);
    setCameraTarget(config.target);
    animatingRef.current = true;
    setCurrentViewPreset(preset === "reset" ? "front" : preset);
  }, []);

  // ── Layer Toggle Handler ─────────────────────────────────────────────────
  const handleToggleLayer = useCallback((layer: ModelLayer) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  }, []);

  // ── Enable All / Solo Layers Helper ───────────────────────────────────────
  const handleEnableAllLayers = useCallback(() => {
    setActiveLayers({
      Muscles: true,
      Skeleton: true,
      Joints: true,
      Tendons: true,
      Ligaments: true,
      Internal_Organs: true,
    });
  }, []);

  const handleResetLayers = useCallback(() => {
    setActiveLayers(DEFAULT_LAYERS);
  }, []);

  // Track pointer down position for drag threshold
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (_e: React.PointerEvent) => {
    // Pointer up handling
  };

  // Hover Tooltip Position Tracking
  const handleHoverMesh = useCallback((struct: AnatomyStructure | null, event?: any) => {
    setHoveredStructure(struct);
    if (struct && event && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setTooltipPos({ x, y });
    } else {
      setTooltipPos(null);
    }
  }, []);

  // Click on background/empty space dismisses selection info panel
  const handleCanvasMissedClick = () => {
    // Keep selection if clicking UI overlays
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={`relative w-full rounded-3xl bg-[#0D0A1F] overflow-hidden select-none border border-[#7C3AED]/30 shadow-2xl flex flex-col ${className}`}
      style={{ minHeight: "560px", height: "72vh", maxHeight: "800px" }}
    >
      {/* ── 1. Top Bar: Search Box & Quick Chips ────────────────────────── */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-col gap-2 max-w-xl">
        <AnatomySearch
          onSelectStructure={handleSelectStructure}
          selectedStructureId={selectedStructureId}
          activeLayers={activeLayers}
          onToggleLayer={handleToggleLayer}
        />
      </div>

      {/* ── 2. Top-Right / Quick Perspective Controls ──────────────────── */}
      <div className="absolute top-3 right-3 z-20 hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-[#18132D]/90 border border-[#7C3AED]/30 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#B8AEC8]">
          <Compass className="w-3.5 h-3.5 text-[#F97368]" />
          <span>View</span>
        </div>

        {(["front", "back", "left", "right"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => handleSetViewPreset(v)}
            className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
              currentViewPreset === v
                ? "bg-[#7C3AED] text-[#FFFDF9] shadow-sm"
                : "text-[#B8AEC8] hover:text-[#FFFDF9] hover:bg-[#21183A]"
            }`}
          >
            {v}
          </button>
        ))}

        <button
          type="button"
          onClick={() => handleSetViewPreset("reset")}
          className="p-1.5 rounded-xl text-[#B8AEC8] hover:text-[#FFFDF9] hover:bg-[#21183A] transition-all cursor-pointer"
          title="Reset Camera View"
          aria-label="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── 3. Left / Floating Layer Selector ───────────────────────────── */}
      <div className="absolute left-3 bottom-14 z-20 flex flex-col gap-1.5 p-2 rounded-2xl bg-[#18132D]/90 border border-[#7C3AED]/30 backdrop-blur-md shadow-xl max-w-[160px] sm:max-w-none">
        <div className="flex items-center justify-between gap-2 px-2 pb-1 border-b border-[#7C3AED]/20">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#FDBA8C] font-display">
            <Layers className="w-3.5 h-3.5 text-[#F97368]" />
            <span>Layers</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleEnableAllLayers}
              className="text-[10px] font-bold text-[#A78BFA] hover:text-[#FFFDF9] transition-colors cursor-pointer"
              title="Enable all anatomical layers"
            >
              All
            </button>
            <span className="text-[#7C3AED]/50">•</span>
            <button
              type="button"
              onClick={handleResetLayers}
              className="text-[10px] font-bold text-[#B8AEC8] hover:text-[#FFFDF9] transition-colors cursor-pointer"
              title="Reset to default (Muscles only)"
            >
              Default
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto sm:max-h-none">
          {LAYERS.map((layer) => {
            const isActive = Boolean(activeLayers[layer]);
            const count = LAYER_COUNTS[layer] || 0;
            return (
              <button
                key={layer}
                type="button"
                onClick={() => handleToggleLayer(layer)}
                className={`px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#7C3AED]/30 text-[#FFFDF9] border border-[#F97368]/60 shadow-sm"
                    : "bg-[#120D26]/70 text-[#B8AEC8]/70 border border-transparent hover:text-[#FFFDF9] hover:bg-[#21183A]"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isActive ? "bg-[#F97368]" : "bg-[#B8AEC8]/40"
                    }`}
                  />
                  <span className="truncate text-[11px] font-medium">
                    {LAYER_DISPLAY_NAMES[layer]}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#B8AEC8]/70 shrink-0">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Floating 3D Tooltip for Hovered Structure ────────────────── */}
      {hoveredStructure && tooltipPos && (
        <div
          className="absolute z-40 pointer-events-none px-3 py-1.5 rounded-xl bg-[#18132D]/95 border border-[#8B5CF6]/50 shadow-xl backdrop-blur-md text-[#FFFDF9] text-xs font-bold animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5"
          style={{
            left: Math.min(Math.max(tooltipPos.x + 12, 16), (containerRef.current?.clientWidth || 300) - 200),
            top: Math.max(tooltipPos.y - 45, 60),
          }}
        >
          <div className="flex items-center gap-1.5 text-xs text-[#FFFDF9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
            <span>{hoveredStructure.name}</span>
          </div>
          <div className="text-[10px] text-[#B8AEC8] font-normal flex items-center gap-1.5">
            <span className="capitalize">{hoveredStructure.category}</span>
            <span>•</span>
            <span className="text-[#FDBA8C]">{hoveredStructure.layer}</span>
          </div>
        </div>
      )}

      {/* ── 5. Selected Structure Info Panel (Right Side) ──────────────── */}
      {selectedStructure && (
        <div className="absolute top-20 right-3 z-30 max-w-sm w-full animate-in fade-in slide-in-from-right-3 duration-200">
          <AnatomyInfoPanel
            structure={selectedStructure}
            isConfirmed={confirmedAreas.includes(selectedStructure.id)}
            onConfirm={(struct) => onConfirmArea(struct)}
            onSelectRelated={(struct) => handleSelectStructure(struct)}
            onClose={() => onSelectStructure(null)}
          />
        </div>
      )}

      {/* ── 6. Error State Overlay if GLB Fails ─────────────────────────── */}
      {loadError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#0D0A1F]/95 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FF6B6B]/20 border border-[#FF6B6B]/50 flex items-center justify-center text-[#FF6B6B]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold text-[#FFFDF9] font-display">
              Unable to load 3D Anatomy Model
            </h3>
            <p className="text-xs text-[#B8AEC8] leading-relaxed">
              {loadError}
            </p>
          </div>
          <GradientButton
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2 text-xs font-bold"
          >
            Reload Model
          </GradientButton>
        </div>
      )}

      {/* ── 7. Three.js WebGL Canvas ───────────────────────────────────── */}
      <div className="w-full h-full flex-1 relative cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{
            fov: 38,
            position: CAMERA_PRESETS.front.position,
            near: 0.01,
            far: 50,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          onPointerMissed={handleCanvasMissedClick}
        >
          {/* Ambient & Directional Studio Lighting for Sharp Anatomical Definition */}
          <ambientLight intensity={0.9} />
          <directionalLight position={[4, 6, 5]} intensity={1.4} castShadow={false} />
          <directionalLight position={[-4, 4, -4]} intensity={0.8} />
          <directionalLight position={[0, -3, 3]} intensity={0.4} />
          <pointLight position={[0, 1.2, 2.5]} intensity={0.5} />

          {/* Smooth Camera Animation Component */}
          <SmoothCameraController
            target={cameraTarget}
            position={cameraPosition}
            controlsRef={controlsRef}
            animatingRef={animatingRef}
          />

          {/* Orbit Controls (Pan disabled per specifications, with touch rotate/pinch zoom) */}
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            minDistance={0.35}
            maxDistance={3.8}
            maxPolarAngle={Math.PI - 0.05}
            minPolarAngle={0.05}
            rotateSpeed={0.8}
            zoomSpeed={1.0}
            target={CAMERA_PRESETS.front.target}
          />

          {/* BVH Spatial Acceleration & GLB Scene */}
          <Suspense fallback={null}>
            <Bvh firstHitOnly>
              <ModelScene
                modelUrl={modelUrl}
                activeLayers={activeLayers}
                selectedMeshNames={selectedMeshNames}
                confirmedMeshNames={confirmedMeshNames}
                hoveredMeshName={hoveredStructure ? hoveredStructure.meshNames[0] : null}
                onHoverMesh={handleHoverMesh}
                onClickMesh={handleSelectStructure}
                onLoaded={handleLoadStatus}
              />
            </Bvh>
          </Suspense>
        </Canvas>
      </div>

      {/* ── 8. Loading Overlay ─────────────────────────────────────────── */}
      {isLoading && (
        <div className="absolute inset-0 z-40 bg-[#0D0A1F]/90 backdrop-blur-md flex flex-col items-center justify-center space-y-3 pointer-events-none animate-in fade-in duration-200">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-[#F97368]" />
            <Sparkles className="w-4 h-4 text-[#FDBA8C] absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-extrabold text-[#FFFDF9] font-display uppercase tracking-wider">
              Loading 3D Anatomy Model
            </p>
            <p className="text-xs text-[#B8AEC8]">
              Initializing 1,066 anatomical structures & biomechanical layers...
            </p>
          </div>
        </div>
      )}

      {/* ── 9. Bottom Navigation Bar: Mobile Perspectives & Reset ───────── */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex md:hidden items-center gap-1 p-1 rounded-2xl bg-[#18132D]/90 border border-[#7C3AED]/30 backdrop-blur-md shadow-lg pointer-events-auto">
          {(["front", "back", "left", "right"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handleSetViewPreset(v)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                currentViewPreset === v
                  ? "bg-[#7C3AED] text-[#FFFDF9]"
                  : "text-[#B8AEC8] hover:text-[#FFFDF9]"
              }`}
            >
              {v[0].toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleSetViewPreset("reset")}
            className="p-1 rounded-xl text-[#B8AEC8] hover:text-[#FFFDF9]"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Disclaimer Pill */}
        <div className="ml-auto pointer-events-auto px-3 py-1 rounded-full bg-[#18132D]/90 border border-[#7C3AED]/25 backdrop-blur-md text-[10px] text-[#B8AEC8] flex items-center gap-1.5 shadow-md">
          <Info className="w-3 h-3 text-[#A78BFA] shrink-0" />
          <span className="hidden sm:inline">
            Selecting an area records symptom location. It is not a medical diagnosis.
          </span>
          <span className="sm:hidden">
            Non-diagnostic symptom telemetry.
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnatomyViewer;
