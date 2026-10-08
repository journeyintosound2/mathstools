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

// Decorative trees (also rendered by World.jsx) — each is solid.
export const TREE_POSITIONS = [
  [-28, -2], [28, 2], [-2, 28], [-26, 22], [26, 22], [-26, -23], [26, -23],
  [-12, 26], [12, 26], [-30, 8], [30, -8],
];

// Central Mission Plaza — a real raised plateau the player climbs onto. The
// Mission Board, Trophy Stand and Sage sit ON it. A wide staircase on the south
// side is fully WALKABLE (so students are never blocked), while a Shift jump
// lets you hop straight up the plateau edge as a shortcut.
// SQUARE plateau (W6-C) — a straight-edged platform so the staircases sit flush
// against its edges with no gaps. `halfW`/`halfD` are the half-extents; `radius`
// is kept as a nominal value for the radial path starts. Enlarged so the Mission
// Board + Trophy Stand sit apart without their interaction radii overlapping.
export const PLATEAU = { x: 0, z: 0, halfW: 8, halfD: 7, height: 1.1, radius: 7 };
export const STAIRS = [
  // South staircase (the player arrives from the south) — flush at the z=+7 edge.
  { id: "s-step-1", xMin: -4, xMax: 4, zMin: 8.5, zMax: 10.0, height: 0.4 },
  { id: "s-step-2", xMin: -4, xMax: 4, zMin: 7.0, zMax: 8.5, height: 0.8 },
  // North staircase (opposite side, toward the grove portal) — flush at z=-7.
  { id: "n-step-1", xMin: -4, xMax: 4, zMin: -10.0, zMax: -8.5, height: 0.4 },
  { id: "n-step-2", xMin: -4, xMax: 4, zMin: -8.5, zMax: -7.0, height: 0.8 },
];

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
    ...STATIC_COLLIDERS,
    ...gateColliders(snapshot),
    ...getBoundaryColliders(snapshot),
    ...bridgeRailColliders(),
  ];
}
