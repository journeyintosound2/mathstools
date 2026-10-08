/**
 * SNOWBALL SUMS — CHALLENGE CAMERAS (2026-10-08). The ten snow challenges'
 * locked camera views in ONE place (they used to be ten branches in
 * Player.jsx). The framing maths is exactly the old per-challenge maths; the
 * views are PAD-RELATIVE (y measured from the stage's pad — Player.jsx adds
 * challengePadY(key)), because the valley now rolls. Every view is filmed
 * from the SOUTH (+z) of its stage and looks a little BELOW the activity so
 * the scene rides up clear of the bottom-docked card.
 */
import {
  RANGE_AREA, RANGE_VIEW_SPOT, RINK_GLIDE_LINE, RINK_GLIDE_VIEW_SPOT, GROVE_TREE_POS, GROVE_VIEW_SPOT,
  MEADOW_TOWER_LEFT, MEADOW_TOWER_RIGHT, MEADOW_VIEW_SPOT, SLOPE_LANE, SLOPE_VIEW_SPOT,
  VILLAGE_BUILD_SITE, VILLAGE_VIEW_SPOT, COLONY_AREA, COLONY_VIEW_SPOT, CAVE_AREA, CAVE_VIEW_SPOT,
  YARD_AREA, YARD_VIEW_SPOT, LOOKOUT_AREA, LOOKOUT_VIEW_SPOT,
} from "./snowLayout.js";
import { terrainHeight } from "./snowTerrain.js";

/** How far below the activity the camera looks (× the camera distance). */
export const SNOW_DOCK_LIFT = 0.14;

export const SNOW_CAMERA_KEYS = ["range", "rink", "grove", "meadow", "sled", "village", "colony", "cave", "yard", "lights"];

// The five late challenges share one framing recipe (front-on from the south):
//   spot  where the player parks · look  the camera's look-at point ·
//   fit   half-width the frame must fit · base  camera height at distance 0
const LATE = {
  village: { spot: VILLAGE_VIEW_SPOT, look: [VILLAGE_BUILD_SITE[0], 0.9, VILLAGE_BUILD_SITE[1] + 2.3], fit: 6.8, base: 2.6, minDist: 8.5 },
  colony: { spot: COLONY_VIEW_SPOT, look: [COLONY_AREA.x, 1.1, COLONY_AREA.z - 1.4], fit: 9.5, base: 2.4 },
  cave: { spot: CAVE_VIEW_SPOT, look: [CAVE_AREA.x, 1.1, CAVE_AREA.z - 4.0], fit: 6.6, base: 2.2, minDist: 8.5 },
  yard: { spot: YARD_VIEW_SPOT, look: [YARD_AREA.x + 2.6, 1.55, YARD_AREA.z - 2.5], fit: 4.3, base: 2.2, minDist: 6.5 },
  lights: { spot: LOOKOUT_VIEW_SPOT, look: [LOOKOUT_AREA.x, 4.6, LOOKOUT_AREA.z - 6.0], fit: 10.5, base: 3.4 },
};

/** Where the player parks while a challenge runs. */
export function snowParkSpot(key) {
  switch (key) {
    case "range": return RANGE_VIEW_SPOT;
    case "rink": return RINK_GLIDE_VIEW_SPOT;
    case "grove": return GROVE_VIEW_SPOT;
    case "meadow": return MEADOW_VIEW_SPOT;
    case "sled": return SLOPE_VIEW_SPOT;
    default: return LATE[key] ? LATE[key].spot : null;
  }
}

/**
 * The locked view for snow challenge `key` at the live fov/aspect:
 * { pos: [x, y, z], look: [x, y, z], dist } — y PAD-RELATIVE (except the sled,
 * whose stage stands on the real slope: its y is absolute and its pad is 0).
 */
export function snowChallengeView(key, fov = 50, aspect = 16 / 9) {
  const halfW = Math.tan((fov * Math.PI) / 360) * aspect;
  switch (key) {
    case "range": {
      const dist = Math.min(20, Math.max(9, 6.6 / halfW));
      return { dist, pos: [RANGE_AREA.x, 2.4 + dist * 0.26, RANGE_AREA.z + 1.2 + dist], look: [RANGE_AREA.x, 1.9 - SNOW_DOCK_LIFT * dist, RANGE_AREA.z - 2.4] };
    }
    case "rink": {
      const mid = (RINK_GLIDE_LINE.xMin + RINK_GLIDE_LINE.xMax) / 2;
      const half = (RINK_GLIDE_LINE.xMax - RINK_GLIDE_LINE.xMin) / 2;
      const dist = Math.min(44, Math.max(18, (half + 3.5) / halfW));
      return { dist, pos: [mid, 3.5 + dist * 0.3, RINK_GLIDE_LINE.z + dist], look: [mid, 0.6 - SNOW_DOCK_LIFT * dist, RINK_GLIDE_LINE.z] };
    }
    case "grove": {
      const dist = Math.min(26, Math.max(11, 8.5 / halfW));
      return { dist, pos: [GROVE_TREE_POS[0], 2.8 + dist * 0.3, GROVE_TREE_POS[1] + 2.0 + dist], look: [GROVE_TREE_POS[0], 2.2 - SNOW_DOCK_LIFT * dist, GROVE_TREE_POS[1]] };
    }
    case "meadow": {
      const mid = (MEADOW_TOWER_LEFT[0] + MEADOW_TOWER_RIGHT[0]) / 2;
      const dist = Math.min(26, Math.max(9, 7.2 / halfW));
      return { dist, pos: [mid, 2.6 + dist * 0.3, MEADOW_TOWER_LEFT[1] + 2.0 + dist], look: [mid, 2.3 - SNOW_DOCK_LIFT * dist, MEADOW_TOWER_LEFT[1]] };
    }
    case "sled": {
      const mid = (SLOPE_LANE.xTop + SLOPE_LANE.xBottom) / 2;
      const H = terrainHeight(mid, SLOPE_LANE.z);
      const dist = Math.min(30, Math.max(10, 7.2 / halfW));
      return { dist, pos: [mid, H + 2.6 + dist * 0.26, SLOPE_LANE.z + dist], look: [mid, H + 1.1 - SNOW_DOCK_LIFT * dist, SLOPE_LANE.z] };
    }
    default: {
      const v = LATE[key];
      if (!v) return null;
      const dist = Math.min(28, Math.max(v.minDist ?? 11, v.fit / halfW));
      return { dist, pos: [v.look[0], v.base + dist * 0.3, v.look[2] + 3.0 + dist], look: [v.look[0], v.look[1] - SNOW_DOCK_LIFT * dist, v.look[2]] };
    }
  }
}
