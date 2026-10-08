/**
 * FRACTION FARM — the ten challenge CAMERAS, as pure maths (so Player.jsx and
 * the headless checks share one definition). Each returns where the camera
 * sits and what it looks at, in PAD-RELATIVE height: the caller adds the
 * pad's level (challengePadY) to both y values.
 *
 * `fov` is the camera's vertical fov in degrees, `aspect` width / height.
 * Every view films its stage from the SOUTH (+z); the Round-Up's from the
 * south-east, looking down at ~45°. These are the framings tuned with the
 * teachers on the flat farm — only the positions moved.
 */
import {
  CHALLENGE_FENCE, CHALLENGE_FENCE_LENGTH, ROUNDUP_FIELD, ROUNDUP_PEN, ORDER_GARDEN, CRATE_AREA, CRATE_ROW,
  MILK_AREA, WEIGH_AREA, TRADE_AREA, VEGGIE_AREA, PLANK_AREA, SHOP_AREA,
} from "./farmLayout.js";

export const FENCE_CAM_MIN = 20;
export const FENCE_CAM_MAX = 50;
export const ROUNDUP_CAM_YAW = Math.PI / 4; // camera sits to the SE (+x, +z)
export const ROUNDUP_CAM_MIN = 26;
export const ROUNDUP_CAM_MAX = 50;
// Centre of everything the Round-Up view must contain (field + pen).
export const RU_LOOK_X = (Math.min(ROUNDUP_FIELD.x1, ROUNDUP_PEN.x - ROUNDUP_PEN.w / 2) +
  Math.max(ROUNDUP_FIELD.x2, ROUNDUP_PEN.x + ROUNDUP_PEN.w / 2)) / 2;
export const RU_LOOK_Z = ((ROUNDUP_PEN.z - ROUNDUP_PEN.d / 2) + ROUNDUP_FIELD.z2) / 2;
const CRATE_LOOK_Z_OFFSET = -0.5;

/** The challenge keys, in trophy order. */
export const FARM_CAMERA_KEYS = ["fence", "roundup", "order", "crate", "milk", "weigh", "trade", "veggie", "plank", "shop"];

/** Whether this challenge's camera shakes on a wrong answer (the panels' wobble). */
export const FARM_CAMERA_SHAKES = { crate: true, milk: true, weigh: true, trade: true, veggie: true, plank: true, shop: true };

/**
 * { pos: [x, y, z], look: [x, y, z] } for a challenge camera (pad-relative y).
 */
export function farmChallengeView(key, fov = 50, aspect = 16 / 9) {
  const halfW = Math.tan((fov * Math.PI) / 360) * aspect;
  const clampD = (lo, hi, fit) => Math.min(hi, Math.max(lo, fit / halfW));
  switch (key) {
    case "fence": {
      const midX = (CHALLENGE_FENCE.x1 + CHALLENGE_FENCE.x2) / 2;
      const d = clampD(FENCE_CAM_MIN, FENCE_CAM_MAX, CHALLENGE_FENCE_LENGTH / 2 + 5);
      return { pos: [midX, 5 + d * 0.22, CHALLENGE_FENCE.z + d], look: [midX, 1.0, CHALLENGE_FENCE.z], dist: d };
    }
    case "roundup": {
      const d = clampD(ROUNDUP_CAM_MIN, ROUNDUP_CAM_MAX, 15);
      return { pos: [RU_LOOK_X + d * 0.5, d * 0.707, RU_LOOK_Z + d * 0.5], look: [RU_LOOK_X, 0, RU_LOOK_Z], dist: d };
    }
    case "order": {
      const d = clampD(11, 30, 7.5);
      return { pos: [ORDER_GARDEN.x, 3.2 + d * 0.28, ORDER_GARDEN.z + d], look: [ORDER_GARDEN.x, 0.9, ORDER_GARDEN.z], dist: d };
    }
    case "crate": {
      const d = clampD(10, 26, 7.0);
      const lookZ = (CRATE_AREA.z + CRATE_ROW.z) / 2 + CRATE_LOOK_Z_OFFSET;
      return { pos: [CRATE_AREA.x, d * 0.78, lookZ + d * 0.7], look: [CRATE_AREA.x, 0, lookZ], dist: d };
    }
    case "milk": {
      const d = clampD(11, 28, 8.0);
      return { pos: [MILK_AREA.x, 2.8 + d * 0.3, MILK_AREA.z + 1.5 + d], look: [MILK_AREA.x, 1.4, MILK_AREA.z - 0.5], dist: d };
    }
    case "weigh": {
      const d = clampD(9, 22, 6.2);
      return { pos: [WEIGH_AREA.x, 2.4 + d * 0.28, WEIGH_AREA.z + 1.9 + d], look: [WEIGH_AREA.x, 2.2, WEIGH_AREA.z + 1.4], dist: d };
    }
    case "trade": {
      const d = clampD(10, 24, 7.5);
      return { pos: [TRADE_AREA.x, d * 0.72, TRADE_AREA.z + 1.5 + d * 0.66], look: [TRADE_AREA.x, 0.8, TRADE_AREA.z - 0.6], dist: d };
    }
    case "veggie": {
      const d = clampD(10, 24, 7.5);
      return { pos: [VEGGIE_AREA.x, d * 0.82, VEGGIE_AREA.z + 1.0 + d * 0.6], look: [VEGGIE_AREA.x, 0.2, VEGGIE_AREA.z], dist: d };
    }
    case "plank": {
      const d = clampD(11, 26, 9.0);
      return { pos: [PLANK_AREA.x, 2.4 + d * 0.32, PLANK_AREA.z + 1.6 + d], look: [PLANK_AREA.x, 0.7, PLANK_AREA.z], dist: d };
    }
    case "shop": {
      const d = clampD(12, 26, 9.5);
      return { pos: [SHOP_AREA.x, 2.8 + d * 0.34, SHOP_AREA.z + 2.0 + d], look: [SHOP_AREA.x, 1.4, SHOP_AREA.z], dist: d };
    }
    default:
      return null;
  }
}

/**
 * The ground footprint of each challenge camera's view of its stage: a
 * triangle from the camera out to the frame's left/right edges at the stage
 * (worst case of a wide 16:9 and a narrow 4:3 screen). Nothing tall may stand
 * in it — the scatter keeps trees + buildings out and the checks verify it.
 */
let _corridors = null;
export function farmCameraCorridors() {
  if (_corridors) return _corridors;
  _corridors = [];
  for (const key of FARM_CAMERA_KEYS) {
    for (const aspect of [16 / 9, 4 / 3]) {
      const v = farmChallengeView(key, 50, aspect);
      const halfW = Math.tan((50 * Math.PI) / 360) * aspect;
      const dx = v.look[0] - v.pos[0], dz = v.look[2] - v.pos[2];
      const D = Math.hypot(dx, dz, v.look[1] - v.pos[1]);
      const L = Math.hypot(dx, dz) || 1;
      const nx = -dz / L, nz = dx / L;
      const w = halfW * D;
      // Run the far edge a few metres past the look point (the stage's depth).
      const fx = v.look[0] + (dx / L) * 4, fz = v.look[2] + (dz / L) * 4;
      _corridors.push({
        key, aspect,
        tri: [[v.pos[0], v.pos[2]], [fx + nx * w, fz + nz * w], [fx - nx * w, fz - nz * w]],
      });
    }
  }
  return _corridors;
}
function inTri(x, z, [a, b, c], margin) {
  // Signed distances to the three edges (inside = all ≥ −margin).
  const side = (p, q) => {
    const ex = q[0] - p[0], ez = q[1] - p[1];
    const L = Math.hypot(ex, ez) || 1;
    return ((x - p[0]) * ez - (z - p[1]) * ex) / L;
  };
  const s1 = side(a, b), s2 = side(b, c), s3 = side(c, a);
  const pos = s1 >= -margin && s2 >= -margin && s3 >= -margin;
  const neg = s1 <= margin && s2 <= margin && s3 <= margin;
  return pos || neg;
}
/** Is (x, z) inside (or within `margin` m of) any challenge camera's view? → key or null. */
export function inFarmCameraView(x, z, margin = 0) {
  for (const c of farmCameraCorridors()) if (inTri(x, z, c.tri, margin)) return c.key;
  return null;
}
