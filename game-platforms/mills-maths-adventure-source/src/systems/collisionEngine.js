/**
 * COLLISION ENGINE (Phase 2H-B) — a lightweight, pure collision + ground-height
 * system. No physics library: just circle push-out (which slides naturally) and
 * a tiny height-field for the plaza plateau + stairs.
 *
 * Pure: no React/three/stores.
 */
import { islandGroundHeight } from "../data/island/islandTerrain.js";

export const PLAYER_RADIUS = 0.5;
// Largest height the player can walk UP in one step (stairs/kerbs); anything
// taller is a wall and needs a jump.
export const STEP_UP = 0.45;
// Largest height the player can step DOWN smoothly; bigger drops cause a fall.
export const STEP_DOWN = 0.55;

/**
 * Surface height at (x, z) on NUMBER ISLAND (the default region): the
 * island's terrain + the raised plaza + its stairs + the jetty/pier/bridge
 * decks (data/island/islandTerrain.js). Regions with their own ground use
 * their `groundHeight` hook instead.
 */
export function groundHeightAt(x, z) {
  return islandGroundHeight(x, z);
}

/**
 * Resolve a desired position against circular (or `box`) colliders by pushing the point
 * out of any it overlaps (a few passes handle overlapping colliders). Sliding
 * emerges because only the penetrating (normal) component is corrected.
 * Returns { x, z, gate } where `gate` is a locked-gate collider that was hit
 * (used to show a contextual prompt), or null.
 */
/**
 * An oriented-rectangle collider (centre, half-sizes, yaw — three.js frame:
 * local (lx, lz) → world (x + lx·cos + lz·sin, z − lx·sin + lz·cos)).
 * `radius` is its bounding radius (cheap reject; circle-only code that reads
 * `radius` sees a sensible bound).
 */
export function boxCollider(id, cx, cz, hx, hz, yaw = 0, extra = {}) {
  return { id, box: true, x: cx, z: cz, hx, hz, cos: Math.cos(yaw), sin: Math.sin(yaw), radius: Math.hypot(hx, hz), ...extra };
}

export function resolveCircle(x, z, colliders, r = PLAYER_RADIUS) {
  let px = x;
  let pz = z;
  let gate = null;
  for (let pass = 0; pass < 3; pass++) {
    for (const c of colliders) {
      if (c.box) {
        // An oriented RECTANGLE (walls, building bodies, rails): push the
        // player's circle out of it along the nearest face. `cos`/`sin`
        // describe the rect's yaw (three.js convention); hx/hz half-sizes.
        const dx = px - c.x, dz = pz - c.z;
        if (Math.abs(dx) > c.radius + r || Math.abs(dz) > c.radius + r) continue;
        let lx = dx * c.cos - dz * c.sin;
        let lz = dx * c.sin + dz * c.cos;
        const qx = Math.max(-c.hx, Math.min(c.hx, lx));
        const qz = Math.max(-c.hz, Math.min(c.hz, lz));
        let ox = lx - qx, oz = lz - qz;
        const d2 = ox * ox + oz * oz;
        if (d2 >= r * r) continue;
        if (d2 > 1e-10) {
          const d = Math.sqrt(d2);
          lx = qx + (ox / d) * r;
          lz = qz + (oz / d) * r;
        } else if (c.hx - Math.abs(lx) < c.hz - Math.abs(lz)) {
          lx = (lx < 0 ? -1 : 1) * (c.hx + r);
        } else {
          lz = (lz < 0 ? -1 : 1) * (c.hz + r);
        }
        px = c.x + lx * c.cos + lz * c.sin;
        pz = c.z - lx * c.sin + lz * c.cos;
        if (c.kind === "gate") gate = c;
        continue;
      }
      const dx = px - c.x;
      const dz = pz - c.z;
      const min = r + c.radius;
      const d2 = dx * dx + dz * dz;
      if (d2 < min * min) {
        const d = Math.sqrt(d2) || 1e-4;
        const push = min - d;
        px += (dx / d) * push;
        pz += (dz / d) * push;
        if (c.kind === "gate") gate = c;
      }
    }
  }
  return { x: px, z: pz, gate };
}
