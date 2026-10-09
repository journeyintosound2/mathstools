/**
 * WORLD COLLIDERS (Phase 2H-B) — data-driven solid-object + verticality data.
 *
 * Colliders are simple CIRCLES (x, z, radius) so resolution is cheap and never
 * jitters. They are assembled from: trees, themed landmarks, interactables
 * (NPCs / board / chest / signs — each declares a `collision` block), the grove
 * barriers, and gate colliders that exist only while a gate is LOCKED.
 *
 * Verticality is a tiny height-field: a central plaza PLATEAU plus a few STAIR
 * bands. `collisionEngine.groundHeightAt` reads these. Everything is data, so a
 * new solid object becomes solid by adding an entry — no movement-code changes.
 *
 * Pure data + small assembly helpers. The only system import is isUnlockedById
 * (pure), which does not import this file → no cycle.
 */
import { WORLD_LANDMARKS } from "./worldLandmarks.js";
import { INTERACTABLES } from "./interactables.js";
import { WORLD_UNLOCKS } from "./worldUnlocks.js";
import { isUnlockedById } from "../systems/unlockEngine.js";
import { getBoundaryColliders } from "./worldBoundaries.js";
import { bridgeRailColliders } from "./worldBridges.js";
import { getSchoolyardColliders } from "./schoolyard/schoolyardColliders.js";
import { getFarmColliders } from "./farm/farmColliders.js";
import { getSnowColliders } from "./snow/snowColliders.js";
import { getCabinColliders } from "./cabin/cabinColliders.js";
import { getMagmaColliders } from "./magma/magmaColliders.js";
import { MAGMA_REGION_ID } from "./magma/magmaLayout.js";
import { getJungleColliders } from "./jungle/jungleColliders.js";
import { JUNGLE_REGION_ID } from "./jungle/jungleLayout.js";
import { getIslandStaticColliders } from "./island/islandColliders.js";
import { PLAZA } from "./island/islandLayout.js";
import { PLAZA_DECK_Y, PLAZA_BASE_Y, PLAZA_FLIGHTS } from "./island/islandTerrain.js";

// (2026-10-09) The island's trees are part of its scatter now
// (data/island/islandProps.js → islandColliders.js); this old list is empty.
export const TREE_POSITIONS = [];

// The raised MISSION PLAZA (an octagon, data/island/islandLayout.js PLAZA):
// described here as its inscribed square (`halfW`/`halfD`, all on the deck)
// with absolute heights, for older code + the checks. `radius` = apothem.
const _sq = PLAZA.apothem * 0.7;
export const PLATEAU = {
  x: PLAZA.center[0], z: PLAZA.center[1], halfW: _sq, halfD: _sq,
  height: PLAZA_DECK_Y, base: PLAZA_BASE_Y, radius: PLAZA.apothem,
};
// Its stair steps (each flight's treads), absolute heights.
export const STAIRS = PLAZA_FLIGHTS.flatMap((f) => Array.from({ length: f.steps }, (_, k) => {
  // k = 0 → the bottom step (furthest out).
  const a0 = PLAZA.apothem + (f.steps - 1 - k) * f.depth, a1 = a0 + f.depth;
  const cx = PLAZA.center[0], cz = PLAZA.center[1], hw = f.width / 2;
  const xs = f.nx ? [cx + f.nx * a0, cx + f.nx * a1] : [cx - hw, cx + hw];
  const zs = f.nz ? [cz + f.nz * a0, cz + f.nz * a1] : [cz - hw, cz + hw];
  return {
    id: `${f.id}-step-${k + 1}`, flight: f.id,
    xMin: Math.min(...xs), xMax: Math.max(...xs), zMin: Math.min(...zs), zMax: Math.max(...zs),
    height: PLAZA_BASE_Y + (k + 1) * f.rise,
  };
}));

// Landmark collision radii by type (0 = not solid). Scaled by the landmark's scale.
const LANDMARK_RADIUS = {
  fountain: 2.6, volcano: 3.6, dune: 1.5, crate: 0.9, palm: 0.5,
  trophy: 1.1, signpostPM: 0.45, plot: 0,
  // Integer Dunes snow props (W6): dunes are solid (block behind Pip); the
  // snowmen/trees are small solids. Scaled by each landmark's own `scale`.
  snowdune: 1.9, snowman: 0.6, xmastree: 0.6,
};

function treeColliders() {
  return TREE_POSITIONS.map((p, i) => ({ id: `tree-${i}`, kind: "tree", x: p[0], z: p[1], radius: 0.7 }));
}
function landmarkColliders() {
  return WORLD_LANDMARKS
    .filter((l) => (LANDMARK_RADIUS[l.type] || 0) > 0)
    .map((l) => ({
      id: `lm-${l.id}`, kind: "landmark",
      x: l.position[0], z: l.position[1],
      radius: (LANDMARK_RADIUS[l.type] || 1) * (l.scale || 1),
    }));
}
function interactableColliders() {
  return INTERACTABLES
    .filter((it) => (it.regionId || "island-1") === "island-1" && it.collision && it.collision.enabled !== false)
    .map((it) => ({
      id: `ix-${it.id}`, kind: "interactable",
      x: it.position[0], z: it.position[1],
      radius: it.collision.radius || 0.7,
    }));
}
// Gate colliders only exist while the gate is LOCKED (unlocking opens the path).
function gateColliders(snapshot) {
  return WORLD_UNLOCKS
    .filter((u) => !isUnlockedById(u.id, snapshot))
    .map((u) => ({
      id: `gate-${u.id}`, kind: "gate",
      x: u.position[0], z: u.position[1], radius: 2.4,
      hint: u.hint, name: u.name,
    }));
}

// Static colliders never change; computed once.
export const STATIC_COLLIDERS = [
  ...treeColliders(),
  ...landmarkColliders(),
  ...interactableColliders(),
];
let _islandStatic = null;
function islandStatic() {
  if (!_islandStatic) _islandStatic = [...STATIC_COLLIDERS, ...getIslandStaticColliders()];
  return _islandStatic;
}

/**
 * All colliders for the current progress snapshot + ACTIVE REGION. Island-1
 * (default) uses the static props + unlock gates + zone boundaries; the
 * Schoolyard uses its own solid props. This keeps each region's collision
 * self-contained — island NPCs/gates never bleed into the schoolyard.
 */
export function getColliders(snapshot = {}, regionId = "island-1") {
  if (regionId === "schoolyard") return getSchoolyardColliders(snapshot);
  if (regionId === "farm-parts-whole") return getFarmColliders(snapshot);
  if (regionId === "snow-sums") return getSnowColliders(snapshot);
  if (regionId === "cabin") return getCabinColliders(snapshot);
  if (regionId === MAGMA_REGION_ID) return getMagmaColliders();
  if (regionId === JUNGLE_REGION_ID) return getJungleColliders();
  return [
    ...islandStatic(),
    ...gateColliders(snapshot),
    ...getBoundaryColliders(snapshot),
    ...bridgeRailColliders(),
  ];
}
