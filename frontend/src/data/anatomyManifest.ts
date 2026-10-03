// anatomyManifest.ts
// Single source of truth for REVORA 3D Human Anatomy Model metadata.
// Integrates revora-anatomy.glb manifest: 1,066 meshes across 6 anatomical layers.

import manifestJson from "../anatomy-manifest.json";

export type ModelLayer =
  | "Muscles"
  | "Skeleton"
  | "Joints"
  | "Tendons"
  | "Ligaments"
  | "Internal_Organs";

export type AnatomyLayer = ModelLayer | "external" | "internal" | "both";

export type AnatomyCategory =
  | "Muscle"
  | "Bone"
  | "Joint structure"
  | "Joint capsule"
  | "Joint cartilage"
  | "Intervertebral disc"
  | "Tendon"
  | "Aponeurosis"
  | "Ligament"
  | "Organ"
  | "Muscle group"
  | "Joint region"
  | "General Region";

export type AnatomyRegion =
  | "abdomen"
  | "head-neck"
  | "lower-limb"
  | "pelvis"
  | "spine-back"
  | "thorax"
  | "upper-limb";

export type AnatomySide = "left" | "right" | "center";

export interface ManifestPart {
  meshName: string;
  id: string;
  name: string;
  layer: ModelLayer;
  category: string;
  side: AnatomySide;
  region: AnatomyRegion;
  group: string | null;
  aliases: string[];
  sourceName: string;
  center: [number, number, number];
  bbox: [[number, number, number], [number, number, number]];
}

export interface ManifestFunctionalGroup {
  id: string;
  name: string;
  nodeName: string;
  side: AnatomySide;
  category: string;
  layer: ModelLayer;
  members: string[]; // meshNames
  aliases: string[];
}

export interface ManifestJointRegion {
  id: string;
  name: string;
  side: AnatomySide;
  category: string;
  layer: ModelLayer;
  members: string[]; // meshNames across Joints, Ligaments, Skeleton
  memberLayers: ModelLayer[];
  aliases: string[];
}

export interface AnatomyManifest {
  schema: number;
  model: string;
  units: string;
  up: string;
  front: string;
  anatomicalLeft: string;
  layers: Record<ModelLayer, number>;
  defaultVisibleLayers: ModelLayer[];
  parts: ManifestPart[];
  functionalGroups: ManifestFunctionalGroup[];
  jointRegions: ManifestJointRegion[];
  attribution: string;
}

export const MANIFEST = manifestJson as unknown as AnatomyManifest;

export const LAYERS: ModelLayer[] = [
  "Muscles",
  "Skeleton",
  "Joints",
  "Tendons",
  "Ligaments",
  "Internal_Organs",
];

export const DEFAULT_LAYERS: Record<ModelLayer, boolean> = {
  Muscles: true,
  Skeleton: false,
  Joints: false,
  Tendons: false,
  Ligaments: false,
  Internal_Organs: false,
};

export const LAYER_DISPLAY_NAMES: Record<ModelLayer, string> = {
  Muscles: "Muscles",
  Skeleton: "Skeleton",
  Joints: "Joints",
  Tendons: "Tendons",
  Ligaments: "Ligaments",
  Internal_Organs: "Internal Organs",
};

export const LAYER_COUNTS: Record<ModelLayer, number> = MANIFEST.layers || {
  Muscles: 455,
  Skeleton: 232,
  Joints: 103,
  Tendons: 11,
  Ligaments: 238,
  Internal_Organs: 27,
};

// ── Unified Selectable Structure Interface ──────────────────────────────
export interface AnatomyStructure {
  id: string;
  name: string;
  type: "part" | "functional_group" | "joint_region";
  category: string;
  layer: ModelLayer;
  memberLayers: ModelLayer[];
  side: AnatomySide;
  region: string;
  group: string | null;
  aliases: string[];
  meshNames: string[]; // 1 mesh for parts, multiple for groups/regions
  center: [number, number, number];
  bbox: [[number, number, number], [number, number, number]];
  cameraTarget: [number, number, number];
  cameraDistance: number;
  description?: string;
}

// Helper to compute bounding box and center across multiple parts
function computeBoundsForMeshes(
  meshNames: string[],
  partsMap: Map<string, ManifestPart>
): {
  center: [number, number, number];
  bbox: [[number, number, number], [number, number, number]];
  radius: number;
} {
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  meshNames.forEach((name) => {
    const part = partsMap.get(name);
    if (part) {
      minX = Math.min(minX, part.bbox[0][0]);
      minY = Math.min(minY, part.bbox[0][1]);
      minZ = Math.min(minZ, part.bbox[0][2]);
      maxX = Math.max(maxX, part.bbox[1][0]);
      maxY = Math.max(maxY, part.bbox[1][1]);
      maxZ = Math.max(maxZ, part.bbox[1][2]);
    }
  });

  if (minX === Infinity) {
    return {
      center: [0, 0.88, 0],
      bbox: [
        [-0.3, 0, -0.2],
        [0.3, 1.7, 0.2],
      ],
      radius: 0.85,
    };
  }

  const cx = parseFloat(((minX + maxX) / 2).toFixed(4));
  const cy = parseFloat(((minY + maxY) / 2).toFixed(4));
  const cz = parseFloat(((minZ + maxZ) / 2).toFixed(4));

  const dx = maxX - minX;
  const dy = maxY - minY;
  const dz = maxZ - minZ;
  const radius = parseFloat((Math.sqrt(dx * dx + dy * dy + dz * dz) / 2).toFixed(4));

  return {
    center: [cx, cy, cz],
    bbox: [
      [minX, minY, minZ],
      [maxX, maxY, maxZ],
    ],
    radius: Math.max(radius, 0.08),
  };
}

// ── Build Fast In-Memory Indexes ─────────────────────────────────────────
export const partsByMeshName = new Map<string, ManifestPart>();
export const partsById = new Map<string, ManifestPart>();

MANIFEST.parts.forEach((p) => {
  partsByMeshName.set(p.meshName, p);
  partsById.set(p.id, p);
});

export const functionalGroupsById = new Map<string, ManifestFunctionalGroup>();
MANIFEST.functionalGroups.forEach((g) => {
  functionalGroupsById.set(g.id, g);
});

export const jointRegionsById = new Map<string, ManifestJointRegion>();
MANIFEST.jointRegions.forEach((r) => {
  jointRegionsById.set(r.id, r);
});

// Map each mesh name to its parent groups and regions
export const meshNameToGroups = new Map<string, ManifestFunctionalGroup[]>();
export const meshNameToRegions = new Map<string, ManifestJointRegion[]>();

MANIFEST.functionalGroups.forEach((group) => {
  group.members.forEach((meshName) => {
    const list = meshNameToGroups.get(meshName) || [];
    list.push(group);
    meshNameToGroups.set(meshName, list);
  });
});

MANIFEST.jointRegions.forEach((region) => {
  region.members.forEach((meshName) => {
    const list = meshNameToRegions.get(meshName) || [];
    list.push(region);
    meshNameToRegions.set(meshName, list);
  });
});

// Master byId and array of unified structures
export const byId: Record<string, AnatomyStructure> = {};
export const allJointRegions: AnatomyStructure[] = [];
export const allFunctionalGroups: AnatomyStructure[] = [];
export const allParts: AnatomyStructure[] = [];

// 1. Joint Regions (e.g. Left Knee, Hip, Shoulder, etc.)
MANIFEST.jointRegions.forEach((r) => {
  const bounds = computeBoundsForMeshes(r.members, partsByMeshName);
  const struct: AnatomyStructure = {
    id: r.id,
    name: r.name,
    type: "joint_region",
    category: r.category,
    layer: r.layer,
    memberLayers: r.memberLayers,
    side: r.side,
    region: "Joint Complex",
    group: null,
    aliases: r.aliases || [],
    meshNames: r.members,
    center: bounds.center,
    bbox: bounds.bbox,
    cameraTarget: bounds.center,
    cameraDistance: Math.max(bounds.radius * 2.8, 0.45),
    description: `Anatomical region containing skeletal, articular, and ligamentous structures of the ${r.name.toLowerCase()}.`,
  };
  byId[r.id] = struct;
  allJointRegions.push(struct);
});

// 2. Functional Groups (e.g. Quadriceps, Hamstrings, Rotator Cuff, etc.)
MANIFEST.functionalGroups.forEach((g) => {
  const bounds = computeBoundsForMeshes(g.members, partsByMeshName);
  const struct: AnatomyStructure = {
    id: g.id,
    name: g.name,
    type: "functional_group",
    category: g.category,
    layer: g.layer,
    memberLayers: [g.layer],
    side: g.side,
    region: "Muscular Group",
    group: g.nodeName,
    aliases: g.aliases || [],
    meshNames: g.members,
    center: bounds.center,
    bbox: bounds.bbox,
    cameraTarget: bounds.center,
    cameraDistance: Math.max(bounds.radius * 2.6, 0.45),
    description: `Functional muscular unit comprising ${g.members.length} synergistic structures.`,
  };
  byId[g.id] = struct;
  allFunctionalGroups.push(struct);
});

// 3. Individual Parts (1,066 distinct meshes)
MANIFEST.parts.forEach((p) => {
  const dx = p.bbox[1][0] - p.bbox[0][0];
  const dy = p.bbox[1][1] - p.bbox[0][1];
  const dz = p.bbox[1][2] - p.bbox[0][2];
  const radius = Math.sqrt(dx * dx + dy * dy + dz * dz) / 2;

  const struct: AnatomyStructure = {
    id: p.id,
    name: p.name,
    type: "part",
    category: p.category,
    layer: p.layer,
    memberLayers: [p.layer],
    side: p.side,
    region: p.region,
    group: p.group,
    aliases: p.aliases || [],
    meshNames: [p.meshName],
    center: p.center,
    bbox: p.bbox,
    cameraTarget: p.center,
    cameraDistance: Math.max(radius * 3.2, 0.35),
    description: `Specific anatomical ${p.category.toLowerCase()} located in the ${p.region.replace("-", " ")} region.`,
  };
  byId[p.id] = struct;
  byId[p.meshName] = struct; // Also index by exact meshName
  allParts.push(struct);
});

// Full combined list for fast search and traversal
export const ALL_STRUCTURES: AnatomyStructure[] = [
  ...allJointRegions,
  ...allFunctionalGroups,
  ...allParts,
];

// Mapping for backwards compatibility with previous imports
export const ANATOMY = byId;
export const ANATOMY_DATABASE = byId;

// ── Search Anatomy ───────────────────────────────────────────────────────
// Requirements:
// 1. Uses manifest names + aliases (e.g. "knee", "hamstring", "achilles", "acl", "kneecap")
// 2. Rank regions and groups BEFORE individual parts!
export function searchAnatomy(rawQuery: string): AnatomyStructure[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  const tokens = query.split(/\s+/).filter(Boolean);

  const scoreStructure = (
    struct: AnatomyStructure
  ): { score: number; match: boolean } => {
    const nameLower = struct.name.toLowerCase();
    const idLower = struct.id.toLowerCase();
    const aliasesLower = struct.aliases.map((a) => a.toLowerCase());
    const catLower = struct.category.toLowerCase();
    const regionLower = struct.region.toLowerCase();

    // Exact name or exact alias match
    const exactName = nameLower === query || idLower === query;
    const exactAlias = aliasesLower.includes(query);
    const startsWithName = nameLower.startsWith(query) || idLower.startsWith(query);
    const startsWithAlias = aliasesLower.some((a) => a.startsWith(query));

    // Token inclusion
    const allTokensInName = tokens.every((t) => nameLower.includes(t) || idLower.includes(t));
    const allTokensInAliases = aliasesLower.some((a) =>
      tokens.every((t) => a.includes(t))
    );
    const someTokensInName = tokens.some((t) => nameLower.includes(t) || idLower.includes(t));
    const someTokensInAliases = aliasesLower.some((a) =>
      tokens.some((t) => a.includes(t))
    );
    const tokenInCat = tokens.some((t) => catLower.includes(t));
    const tokenInRegion = tokens.some((t) => regionLower.includes(t));

    if (
      !exactName &&
      !exactAlias &&
      !startsWithName &&
      !startsWithAlias &&
      !allTokensInName &&
      !allTokensInAliases &&
      !someTokensInName &&
      !someTokensInAliases &&
      !tokenInCat &&
      !tokenInRegion
    ) {
      return { score: 0, match: false };
    }

    let score = 0;

    // Type ranking bonus: Regions & Groups rank higher than individual parts!
    if (struct.type === "joint_region") {
      score += 1000;
    } else if (struct.type === "functional_group") {
      score += 800;
    } else {
      score += 100;
    }

    // Match quality bonus
    if (exactName || exactAlias) {
      score += 500;
    } else if (startsWithName || startsWithAlias) {
      score += 300;
    } else if (allTokensInName || allTokensInAliases) {
      score += 200;
    } else if (someTokensInName || someTokensInAliases) {
      score += 80;
    }

    if (tokenInCat) score += 20;
    if (tokenInRegion) score += 15;

    return { score, match: true };
  };

  const matches: Array<{ struct: AnatomyStructure; score: number }> = [];

  // Iterate all structures and score
  ALL_STRUCTURES.forEach((struct) => {
    const res = scoreStructure(struct);
    if (res.match) {
      matches.push({ struct, score: res.score });
    }
  });

  // Sort descending by score
  matches.sort((a, b) => b.score - a.score);

  // Return unique structures (deduped by ID)
  const seen = new Set<string>();
  const results: AnatomyStructure[] = [];

  for (const m of matches) {
    if (!seen.has(m.struct.id)) {
      seen.add(m.struct.id);
      results.push(m.struct);
      if (results.length >= 25) break;
    }
  }

  return results;
}

// ── Structure Lookup Helpers ─────────────────────────────────────────────
export function getAnatomyForMesh(meshName: string): AnatomyStructure | null {
  const part = partsByMeshName.get(meshName);
  if (!part) return null;
  return byId[part.id] || null;
}

export function getAnatomyLabel(idOrName: string): string {
  if (!idOrName) return "";

  // Check if manual custom entry
  if (idOrName.startsWith("custom:") || idOrName.includes(" ")) {
    const clean = idOrName.replace(/^custom:\s*/i, "").trim();
    if (!byId[clean] && !partsByMeshName.has(clean)) {
      return clean;
    }
  }

  const struct = byId[idOrName] || partsByMeshName.get(idOrName);
  if (struct) return struct.name;

  // Fallback: format snake_case or kebab-case
  return idOrName
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const ALL_ANATOMY_LABELS: Record<string, string> = {};
ALL_STRUCTURES.forEach((s) => {
  ALL_ANATOMY_LABELS[s.id] = s.name;
  if (s.meshNames.length === 1) {
    ALL_ANATOMY_LABELS[s.meshNames[0]] = s.name;
  }
});
