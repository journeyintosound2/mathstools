/**
 * WORLD BOUNDARIES (Phase 2H-D) — data-driven physical blockers that seal each
 * topic zone so locked gates can't be walked around.
 *
 * Each boundary is an ARC of low-poly blockers wrapping the hub-facing front of
 * a zone (the zone's back faces the ocean, which the island clamp already
 * blocks). The arc leaves a GAP aligned with the zone's gate/path; while the
 * zone is LOCKED a "gate-fill" collider seals that gap, and the matching gate
 * hint is attached to every blocker. When the gate unlocks, the gate-fill is
 * removed and the gap becomes a walkable path — the terrain (rocks/cacti/etc.)
 * stays as scenery.
 *
 * Pure data + small helpers. Imports only unlock data/helpers (no cycle).
 *
 * Boundary descriptor:
 *   id, zoneId, type ("rock"|"cactus"|"river"|"hedge"), center [x,z],
 *   radius (arc radius around the zone), gapHalfAngle (half-width of the path
 *   gap, radians), frontHalfAngle (how far around the front to wrap),
 *   blockerRadius, spacing, unlockId (gate that opens the gap; null = always
 *   open path, e.g. the early Integer zone).
 */
import { WORLD_UNLOCKS } from "./worldUnlocks.js";
import { WALKABLE_RADIUS } from "./worldZones.js";
import { isUnlockedById } from "../systems/unlockEngine.js";

const FRONT = Math.PI; // wrap the whole ON-ISLAND ring; the ocean seals the rest.

// (2026-10-09) The rebuilt island has no zone-boundary arcs — the world is
// open (sandbox), and its edges are natural: the sea, the cliffs, the plaza
// wall. Kept as an empty list so the gate machinery keeps working.
export const WORLD_BOUNDARIES = [];

function unlockHint(unlockId) {
  const u = WORLD_UNLOCKS.find((x) => x.id === unlockId);
  return u ? u.hint : null;
}

// The angle (in the x-z plane) from the zone toward the hub — where the gap is.
function gapAngleOf(b) {
  return Math.atan2(-b.center[1], -b.center[0]);
}

// Whether a point is on the walkable island (vs out in the ocean).
function onIsland(x, z) {
  return Math.hypot(x, z) <= WALKABLE_RADIUS - 0.2;
}

/**
 * Blocker angles: every step around the ring that is ON the island and NOT in
 * the gate gap. The on-island arc gets walled; the ocean seals the rest and the
 * gate seals the gap. This prevents walking around the sides near the coast.
 */
function arcBlockerAngles(b) {
  const gap = gapAngleOf(b);
  const step = b.spacing / b.radius;
  const angles = [];
  for (let off = b.gapHalfAngle; off <= b.frontHalfAngle + 1e-6; off += step) {
    for (const a of [gap + off, gap - off]) {
      const x = b.center[0] + b.radius * Math.cos(a);
      const z = b.center[1] + b.radius * Math.sin(a);
      if (onIsland(x, z)) angles.push(a);
    }
  }
  return angles;
}

/**
 * Colliders for all boundaries given a progress snapshot. Terrain blockers are
 * ALWAYS solid; a gate-fill collider seals the path gap only while the zone is
 * locked (and carries the hint). Hints attach to blockers only while locked.
 */
export function getBoundaryColliders(snapshot = {}) {
  const out = [];
  for (const b of WORLD_BOUNDARIES) {
    const locked = b.unlockId ? !isUnlockedById(b.unlockId, snapshot) : false;
    const hint = locked ? unlockHint(b.unlockId) : null;
    for (const a of arcBlockerAngles(b)) {
      out.push({
        id: `${b.id}-${a.toFixed(2)}`, kind: "boundary", boundaryType: b.type,
        x: b.center[0] + b.radius * Math.cos(a),
        z: b.center[1] + b.radius * Math.sin(a),
        radius: b.blockerRadius, hint,
      });
    }
    if (b.unlockId && locked) {
      // Gate-fill: a collider on the ring at the gap, big enough to bridge to
      // the first blockers so the path is truly sealed while locked.
      const gap = gapAngleOf(b);
      const chord = 2 * b.radius * Math.sin(b.gapHalfAngle / 2);
      const gateFill = Math.max(2.2, chord - b.blockerRadius + 0.5);
      out.push({
        id: `${b.id}-gatefill`, kind: "gate", boundaryType: "gate",
        x: b.center[0] + b.radius * Math.cos(gap),
        z: b.center[1] + b.radius * Math.sin(gap),
        radius: gateFill, hint,
      });
    }
  }
  return out;
}

// A point on a zone's boundary ring at the given angle (for checks/teleports).
export function boundaryRingPoint(b, angle) {
  return [b.center[0] + b.radius * Math.cos(angle), b.center[1] + b.radius * Math.sin(angle)];
}

export function getBoundary(id) {
  return WORLD_BOUNDARIES.find((b) => b.id === id) || null;
}
