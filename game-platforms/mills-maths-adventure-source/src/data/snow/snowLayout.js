/**
 * SNOWBALL SUMS — LAYOUT (rebuilt 2026-10-08) — the single source of truth
 * for the snow world. It used to be a flat 120 × 96 field; it is now a big,
 * rolling ALPINE VALLEY the size of Fraction Farm / the Emerald Jungle, ringed
 * by jagged peaks: rising snowfields, big hills you can SLIDE down (toboggan
 * chutes + a chairlift back up), a frozen river and pond you SKATE on, a
 * glacier lake of icy water with snowy islands joined by plank bridges, the
 * lodge village with glowing windows, pine forests, an ice cave under the
 * escarpment and a high lookout ridge under the aurora.
 *
 * Coordinates: x ∈ [-142, 142] (west → east), z ∈ [-126, 126] (north → south)
 * inside the rim; the terrain is modelled out to ±186 / ±170 so the peaks rise
 * on past it. You arrive in the SOUTH looking NORTH up the valley. 1 unit = 1 m.
 *
 * The ten challenges are unchanged — each claims a themed area here and its
 * stage stands on a level PAD (data/snow/snowTerrain.js lifts it there). Every
 * stage is still authored relative to its AREA and filmed from the SOUTH, so
 * all of a challenge's constants below are its area + the same offsets as
 * before (the 3D stages + cameras never had to change shape).
 *
 * Pure data (no three, no React) — the headless checks import it.
 */

const at = (A, dx, dz) => [A.x + dx, A.z + dz];

// ---------------------------------------------------------------------------
// THE VALLEY
// ---------------------------------------------------------------------------
/** The rim: the valley floor ends here and the mountains rise (slide back). */
export const SNOW_BOUNDARY = { halfW: 142, halfD: 126 };
export const SNOW_BOUNDS = { shape: "rect", width: 290, height: 258, center: [0, 0] };

// You arrive on the arrival plaza in the south, looking north up the valley.
export const SNOW_SPAWN = { x: 0, z: 104 };
// The igloo gate home stands just behind-right of the arrival (clear of the
// follow camera, which sits behind the player), facing the arrivals.
export const SNOW_RETURN_PORTAL = [9.5, 113.5];
export const SNOW_RETURN_PORTAL_YAW = -2.5;
export const SNOW_WELCOME_SIGN = { position: [-6.5, 98.5], rotationY: 0.45, text: "Welcome to Snowball Sums!" };
// Mills greets arrivals standing just to the board's left (as you face it),
// not ON it — he used to share the board's spot and stood through it.
// Local offset (−2.1 across, 0.7 out in front) in the board's own frame.
export const SNOW_WELCOME_HOST = (() => {
  const [bx, bz] = SNOW_WELCOME_SIGN.position, r = SNOW_WELCOME_SIGN.rotationY;
  const lx = -2.1, lz = 0.7;
  return { position: [bx + lx * Math.cos(r) + lz * Math.sin(r), bz - lx * Math.sin(r) + lz * Math.cos(r)] };
})();
// The trophy cabinet (trophy.glb — identical to the farm's) on the plaza's
// west side, its open front (local +z) turned to face the arrival spot. It
// used to face away (−π/2 + 0.3) — fixed 2026-10-09.
const SNOW_RECORDS_AT = [-13.5, 108.5];
export const SNOW_RECORDS_STAND = {
  id: "snow-records", position: SNOW_RECORDS_AT,
  rotationY: Math.atan2(SNOW_SPAWN.x - SNOW_RECORDS_AT[0], SNOW_SPAWN.z - SNOW_RECORDS_AT[1]),
};
// The welcome ARCH over the main trail just ahead of the arrival (two
// snow-block pillars + a snowy sign) and the painted TRAIL MAP beside it.
export const SNOW_ARCH = { position: [0.2, 95.5], width: 7.6, height: 5.4, text: "SNOWBALL SUMS" };
export const SNOW_MAP_BOARD = { position: [8.5, 97.5], rotationY: -0.45 };

// ---------------------------------------------------------------------------
// THE LODGE VILLAGE — the ski lodge (its AJAR door leads into the Lodge
// Interior region), log cabins with glowing windows, the village square.
// ---------------------------------------------------------------------------
export const SNOW_LODGE = { x: -8, z: 50, w: 14, d: 10, wall: "#7a5638", roof: "#3d4a63", trim: "#f3ead6" };
/** The lodge's front door (south face) — the snow-to-cabin portal sits in it. */
export const LODGE_DOOR = [SNOW_LODGE.x, SNOW_LODGE.z + SNOW_LODGE.d / 2 + 0.1];
// Log cabins round the village: [x, z, rotY, w, d] (door faces +z rotated).
export const SNOW_CABINS = [
  [-31, 79.5, 3.0, 7, 6],
  [-33, 51, 1.25, 6.5, 5.5],
  [45, 52, -1.0, 7, 6],
  [47, 69, -0.55, 6.5, 6],
  [18, 40, 2.9, 6, 5],
  [-21, 38, -2.75, 6, 5],
];
/** The big decorated tree in the middle of the village square. */
export const VILLAGE_TREE = [4, 66];

// ---------------------------------------------------------------------------
// TEN CHALLENGE AREAS. Each challenge's constants are its AREA + offsets.
// ---------------------------------------------------------------------------

// THE SNOWBALL RANGE (SR) — "range": up on Fort Frost, the snow-fort plateau
// in the south-east. Bridging to ten with a ten-frame crate.
export const RANGE_AREA = { x: 101, z: 50 };
export const RANGE_FRAME_POS = at(RANGE_AREA, 0, -3.5);
export const RANGE_CRATE_POS = at(RANGE_AREA, -3, -2.5);
export const RANGE_VIEW_SPOT = at(RANGE_AREA, 0, 4.5);
export const RANGE_SIGN = { position: at(RANGE_AREA, 4.5, 3.5) };

// THE ICE RINK — GLIDE BY TENS (RG) — "rink": the south end of the FROZEN
// POND in the middle of the valley; the ice itself is the number line.
export const SNOW_POND = { center: [0, 14], rx: 30, rz: 15 };
export const RINK_GLIDE_LINE = { z: 20, xMin: -11, xMax: 11 };
export const RINK_GLIDE_VIEW_SPOT = [-6.5, 24.5];
export const RINK_GLIDE_SIGN = { position: [-3.8, 30.9] };
/** Kept for the checks/scenery: the rink = the pond's ice. */
export const ICE_RINK = { center: SNOW_POND.center, rx: SNOW_POND.rx, rz: SNOW_POND.rz };
/** World x of a number-line value (0–100) on the rink. Pure. */
export function rinkGlideX(value) {
  const { xMin, xMax } = RINK_GLIDE_LINE;
  return xMin + (Math.max(0, Math.min(100, value)) / 100) * (xMax - xMin);
}

// CHRISTMAS TREE GROVE — LIGHT THE TREE (GV) — "pines": a clearing in the
// pine forest on Pine Hill's sunny south-east flank (west of the valley).
export const GROVE_AREA = { x: -99, z: -8 };
export const GROVE_TREE_POS = at(GROVE_AREA, 0, -3.5);
export const GROVE_BOX_POS = at(GROVE_AREA, -2.8, -3.2);
export const GROVE_VIEW_SPOT = at(GROVE_AREA, -3.2, 3.5);
export const GROVE_SIGN = { position: at(GROVE_AREA, 3.5, 3) };

// SNOWMAN MEADOW — LEVEL THE TWINS (ML) — "snowmen": the rolling meadow in
// the south-west, below Snowman Hill and its GIANT snowman.
export const MEADOW_AREA = { x: -84, z: 64 };
export const MEADOW_TOWER_LEFT = at(MEADOW_AREA, -1.8, -2.5);
export const MEADOW_TOWER_RIGHT = at(MEADOW_AREA, 1.8, -2.5);
export const MEADOW_VIEW_SPOT = at(MEADOW_AREA, 3.1, 5.3);
export const MEADOW_SIGN = { position: at(MEADOW_AREA, 3.8, 2.2) };

// SLEDDING SLOPE — THE ROPED SLEDS (SL) — "sled": a groomed run up the
// west flank of Big Sled Hill. The run is a real incline (snowTerrain.js
// builds it as a tilted pad): values increase UPHILL, to the east.
export const SLOPE_LANE = { z: -22, xBottom: 74, xTop: 85.5 };
/** Rise of the groomed run per metre east (the run is 3.1 m tall). */
export const SLOPE_RUN_GRADE = 0.27;
export const SLOPE_VIEW_SPOT = [SLOPE_LANE.xBottom, SLOPE_LANE.z + 9.5];
export const SLOPE_SIGN = { position: [SLOPE_LANE.xBottom + 9.5, SLOPE_LANE.z + 6.5] };

// IGLOO VILLAGE — JOIN THE IGLOOS (VG) — "village": on IGLOO ISLAND out in the
// glacier lake (plank bridges from the south shore + to the Penguin Floe).
export const IGLOO_ISLAND = { center: [14, -58], rx: 14.5, rz: 13.5 };
export const VILLAGE_AREA = { x: 14, z: -61.5 };
export const VILLAGE_LEFT_STAND = at(VILLAGE_AREA, -3.5, -2);
export const VILLAGE_RIGHT_STAND = at(VILLAGE_AREA, 3.5, -2);
export const VILLAGE_BUILD_SITE = at(VILLAGE_AREA, 0, -5.5);
export const VILLAGE_VIEW_SPOT = at(VILLAGE_AREA, -2.8, 7.3);
export const VILLAGE_SIGN = { position: at(VILLAGE_AREA, 4, 3.5) };

// PENGUIN COLONY — PAIR THE PENGUINS (PC) — "colony": the PENGUIN FLOE, a
// big flat ice-floe island east of Igloo Island.
export const PENGUIN_FLOE = { center: [55, -69], rx: 14, rz: 13 };
export const COLONY_AREA = { x: 55, z: -72 };
export const COLONY_ROWS = { z1: COLONY_AREA.z - 1.4, z2: COLONY_AREA.z + 0.8 };
export const COLONY_VIEW_SPOT = at(COLONY_AREA, 5.5, 5.8);
export const COLONY_SIGN = { position: at(COLONY_AREA, -5, 5) };

// THE ICE CAVE — LIGHT THE CRYSTALS (IC) — "cave": a cave mouth in the foot
// of the north-west escarpment.
export const CAVE_AREA = { x: -88, z: -91 };
export const CAVE_WALL = { z: CAVE_AREA.z - 4.5, xMin: CAVE_AREA.x - 5.5, xMax: CAVE_AREA.x + 5.5 };
export const CAVE_DOME = { center: at(CAVE_AREA, 0, -6), radius: 7.5 };
/** The cave's rocky MOUTH in the escarpment foot behind the stage: an arch
 *  of radius r whose dark tunnel runs `depth` metres into the cliff. */
export const CAVE_MOUTH = { x: CAVE_AREA.x, z: CAVE_AREA.z - 8.7, r: 4.4, depth: 6 };
export const CAVE_VIEW_SPOT = at(CAVE_AREA, 4, 4.5);
export const CAVE_SIGN = { position: at(CAVE_AREA, 4.5, 1.5) };

// THE LODGE YARD — COCOA CHANGE (LY) — "lodgeyard": the cocoa stall on the
// east side of the village square, beside the ski lodge.
export const YARD_AREA = { x: 27, z: 60 };
export const YARD_STALL = at(YARD_AREA, -1.5, -3);
export const YARD_BOARD = at(YARD_AREA, 3, -2.5);
export const YARD_VIEW_SPOT = at(YARD_AREA, -3.5, 5);
export const YARD_SIGN = { position: at(YARD_AREA, 3.5, 3) };

// AURORA LOOKOUT — THE STRATEGY PICKER (AL) — "lights": a viewing deck on the
// summit of Big Sled Hill (the valley's high point), facing north over the
// lake and the peaks to the aurora. Ride the chairlift up, sled back down.
export const LOOKOUT_AREA = { x: 121, z: -47 };
export const LOOKOUT_DECK = at(LOOKOUT_AREA, 2.5, -2.5);
export const LOOKOUT_VIEW_SPOT = at(LOOKOUT_AREA, -1, 4.5);
export const LOOKOUT_SIGN = { position: at(LOOKOUT_AREA, -3.5, 3) };

/** The ten reserved areas (ids = the trophy-slot keys in snowRecords.js). */
export const SNOW_CHALLENGE_SPOTS = [
  { id: "rink", label: "The Ice Rink", center: [0, 20] },
  { id: "village", label: "Igloo Village", center: [VILLAGE_AREA.x, VILLAGE_AREA.z] },
  { id: "colony", label: "Penguin Colony", center: [COLONY_AREA.x, COLONY_AREA.z] },
  { id: "snowmen", label: "Snowman Meadow", center: [MEADOW_AREA.x, MEADOW_AREA.z] },
  { id: "pines", label: "Christmas Tree Grove", center: [GROVE_AREA.x, GROVE_AREA.z] },
  { id: "range", label: "Snowball Range", center: [RANGE_AREA.x, RANGE_AREA.z] },
  { id: "cave", label: "Ice Cave", center: [CAVE_AREA.x, CAVE_AREA.z] },
  { id: "sled", label: "Sledding Slope", center: [(SLOPE_LANE.xBottom + SLOPE_LANE.xTop) / 2, SLOPE_LANE.z] },
  { id: "lodgeyard", label: "Lodge Yard", center: [YARD_AREA.x, YARD_AREA.z] },
  { id: "lights", label: "Aurora Lookout", center: [LOOKOUT_AREA.x, LOOKOUT_AREA.z] },
];

// ---------------------------------------------------------------------------
// CHALLENGE VIEW CORRIDORS — every snow challenge is filmed from the SOUTH.
// While one runs, anything standing between the camera and the activity
// (scenery props, host NPCs, the parked player) is hidden. A corridor is a box
// in x/z: ±halfW round the activity's centre x, from `back` metres behind its
// front line `z` to `depth` metres in front of it (toward the camera). Keys
// match the snow challenge keys in game/farmChallengeActive.js.
// ---------------------------------------------------------------------------
export const SNOW_CHALLENGE_VIEWS = {
  range: { x: RANGE_AREA.x, z: RANGE_AREA.z - 3.5, halfW: 9, back: 1.5, depth: 24 },
  rink: { x: 0, z: RINK_GLIDE_LINE.z, halfW: 15, back: 1.5, depth: 30 },
  grove: { x: GROVE_AREA.x - 1, z: GROVE_AREA.z - 3.5, halfW: 9, back: 1.5, depth: 26 },
  meadow: { x: MEADOW_AREA.x, z: MEADOW_AREA.z - 2.5, halfW: 9, back: 1.5, depth: 26 },
  sled: { x: (SLOPE_LANE.xBottom + SLOPE_LANE.xTop) / 2, z: SLOPE_LANE.z, halfW: 11, back: 5, depth: 24 },
  village: { x: VILLAGE_AREA.x, z: VILLAGE_AREA.z - 5.5, halfW: 9, back: 1.5, depth: 26 },
  colony: { x: COLONY_AREA.x, z: COLONY_AREA.z - 1.4, halfW: 12, back: 1.5, depth: 26 },
  cave: { x: CAVE_AREA.x, z: CAVE_AREA.z - 4.5, halfW: 9, back: 1.0, depth: 26 },
  yard: { x: YARD_AREA.x + 1, z: YARD_AREA.z - 3, halfW: 9, back: 1.5, depth: 24 },
  lights: { x: LOOKOUT_AREA.x, z: LOOKOUT_AREA.z - 6, halfW: 12, back: 1.5, depth: 26 },
};
/** Is world point (x, z) inside the running challenge's view corridor? Pure. */
export function inSnowChallengeView(key, x, z) {
  const v = key && SNOW_CHALLENGE_VIEWS[key];
  if (!v) return false;
  return Math.abs(x - v.x) <= v.halfW && z >= v.z - v.back && z <= v.z + v.depth;
}
/** Is (x, z) inside ANY challenge's corridor (the scatter keeps out of them all)? */
export function inAnySnowChallengeView(x, z, margin = 0) {
  for (const v of Object.values(SNOW_CHALLENGE_VIEWS)) {
    if (Math.abs(x - v.x) <= v.halfW + margin && z >= v.z - v.back - margin && z <= v.z + v.depth + margin) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// TERRAIN FEATURES (read by snowTerrain.js). Hills: { c, rx, rz, h, flat,
// warp } ellipses, or ridge capsules { a, b, rw, re, h, flat, warp }; a
// negative h scoops a basin.
// ---------------------------------------------------------------------------
export const SNOW_HILLS = [
  // Snowman Hill — the giant snowman's hill between the village and meadow.
  { id: "snowman-hill", c: [-50, 44], rx: 34, rz: 31, h: 12.5, flat: 0.2, warp: 0.06 },
  // Pine Hill — the forested west hill; the grove sits on its south-east flank.
  { id: "pine-hill", c: [-128, -38], rx: 46, rz: 52, h: 24, flat: 0.1, warp: 0.08 },
  // Big Sled Hill — the east hill with the toboggan run + chairlift — and
  // the gentle Sledding Bank at its west foot (the sled challenge's run).
  { id: "sled-hill", c: [120, -40], rx: 36, rz: 34, h: 16, flat: 0.24, warp: 0.06 },
  { id: "sled-bank", c: [96, -24], rx: 22, rz: 14, h: 6.5, flat: 0, warp: 0.04 },
  // The lookout ridge along the north-east (the deck sits on its crest).
  { id: "lookout-ridge", a: [66, -104], b: [138, -100], rw: 26, re: 26, h: 13, flat: 0.14, warp: 0.06 },
  // Frosty Knoll between the pond and the sled hill + the other rolls that
  // break the valley into rooms.
  { id: "frosty-knoll", c: [46, -4], rx: 22, rz: 18, h: 9, flat: 0, warp: 0.1 },
  { id: "pond-knoll", c: [-14, -13], rx: 15, rz: 10, h: 5, flat: 0, warp: 0.12 },
  { id: "west-rolls", a: [-80, 14], b: [-66, -14], rw: 15, re: 15, h: 8, flat: 0, warp: 0.1 },
  { id: "village-east", c: [64, 36], rx: 18, rz: 13, h: 8, flat: 0, warp: 0.1 },
  { id: "south-ridge", a: [24, 96], b: [92, 84], rw: 15, re: 15, h: 7, flat: 0, warp: 0.1 },
  { id: "meadow-rolls", c: [-122, 58], rx: 22, rz: 28, h: 11, flat: 0, warp: 0.1 },
  { id: "cave-knoll", c: [-118, -76], rx: 20, rz: 16, h: 9, flat: 0, warp: 0.1 },
  // Fort Frost's plateau rise (the range) and the south-east knolls.
  { id: "fort-rise", c: [112, 60], rx: 30, rz: 26, h: 6, flat: 0.3, warp: 0.06 },
  { id: "drift-knoll", c: [60, 96], rx: 24, rz: 18, h: 8, flat: 0, warp: 0.1 },
  { id: "west-drifts", c: [-108, 96], rx: 30, rz: 22, h: 9, flat: 0, warp: 0.1 },
  { id: "arrival-rise", c: [-52, 104], rx: 22, rz: 16, h: 6, flat: 0, warp: 0.1 },
  // Grove Knoll, west of the river.
  { id: "river-knoll", c: [-70, -40], rx: 16, rz: 22, h: 7, flat: 0, warp: 0.12 },
  // The glacier lake's basin (scooped out).
  { id: "lake-basin", c: [34, -63], rx: 60, rz: 36, h: -7, flat: 0.35, warp: 0.05 },
];
/** The north-west ESCARPMENT: a cliff-topped shelf along the valley's north. */
export const SNOW_ESCARPMENT = { z0: -98, z1: -110, h: 16, xEnd: 52 };

/** LEVEL PADS — superellipse { c, rx, rz, p }; `levelOf` shares another
 *  pad's level; `incline` tilts it (the sled run). Challenge stages stand on
 *  these (CHALLENGE_PAD). */
export const SNOW_PADS = [
  { id: "arrival", c: [0, 106], rx: 15, rz: 11, p: 2.4 },
  { id: "square", c: [8, 62], rx: 30, rz: 10.5, p: 2.6 },
  { id: "lodge", c: [SNOW_LODGE.x, SNOW_LODGE.z], rx: 9.5, rz: 7, p: 3, levelOf: "square" },
  { id: "pond", c: SNOW_POND.center, rx: SNOW_POND.rx, rz: SNOW_POND.rz, p: 2, ice: true },
  { id: "range", c: [RANGE_AREA.x, RANGE_AREA.z], rx: 12, rz: 10, p: 2.6 },
  { id: "grove", c: [GROVE_AREA.x, GROVE_AREA.z - 1], rx: 11, rz: 9.5, p: 2.2 },
  { id: "meadow", c: [MEADOW_AREA.x, MEADOW_AREA.z + 1], rx: 11, rz: 10, p: 2.2 },
  { id: "sledrun", c: [(SLOPE_LANE.xBottom + SLOPE_LANE.xTop) / 2 + 1, SLOPE_LANE.z + 3], rx: 10, rz: 9, p: 2.6, incline: { gx: SLOPE_RUN_GRADE, gz: 0 } },
  { id: "igloo-island", c: IGLOO_ISLAND.center, rx: IGLOO_ISLAND.rx, rz: IGLOO_ISLAND.rz, p: 2.2, island: true },
  { id: "penguin-floe", c: PENGUIN_FLOE.center, rx: PENGUIN_FLOE.rx, rz: PENGUIN_FLOE.rz, p: 2.6, island: true },
  { id: "cave", c: [CAVE_AREA.x, CAVE_AREA.z + 0.5], rx: 10, rz: 9, p: 2.4, cliff: true },
  { id: "snowman-top", c: [-48, 44], rx: 8, rz: 8, p: 2 },
  { id: "sled-summit", c: [119, -44], rx: 12.5, rz: 10.5, p: 2.4 },
  { id: "lift-base", c: [88, 19], rx: 5, rz: 4.5, p: 2.4 },
  { id: "runout", c: [100, 31], rx: 8.5, rz: 5.5, p: 2.2 },
  { id: "falls-pool", c: [-55, -92], rx: 8, rz: 5, p: 2, ice: true },
];
/** Which pad each challenge stage stands on (sled is on the incline: y 0). */
export const CHALLENGE_PAD = {
  range: "range", rink: "pond", grove: "grove", meadow: "meadow", sled: null,
  village: "igloo-island", colony: "penguin-floe", cave: "cave", yard: "square", lights: "sled-summit",
};

/** THE GLACIER LAKE — open, icy water (too cold to stand in: you hop back
 *  out). Its shore is an ellipse roughened by noise; the islands are pads. */
export const SNOW_LAKE = { center: [35, -62], rx: 51, rz: 27.5, rough: 4.5 };
/** Small floating ice floes (stepping stones you can hop between). */
export const ICE_FLOES = [
  // A hop trail from the Penguin Floe east toward the far shore's chest floe.
  { c: [-3.6, -60.5], r: 1.9 }, { c: [-7.8, -61.8], r: 1.7 }, { c: [-12, -62.6], r: 2.1 },
  // Decorative floes drifting round the lake.
  { c: [-3, -66], r: 2.4 }, { c: [30, -46], r: 1.8 }, { c: [36, -82], r: 2.6 }, { c: [6, -78], r: 1.6 },
];
/** Plank bridges over the lake: from → to (the decks are thin). */
export const LAKE_BRIDGES = [
  { id: "bridge-island", from: [14, -34.5], to: [14, -46.5], hw: 1.5 },
  { id: "bridge-floe", from: [27.5, -61.5], to: [42.5, -66], hw: 1.4 },
  { id: "bridge-east", from: [67.5, -70], to: [84, -70.5], hw: 1.4 },
];

/** THE FROZEN RIVER — from the frozen waterfall under the escarpment down to
 *  the pond: an ice ribbon you can skate down (gently sloped, slippery). */
export const FROZEN_RIVER_CTRL = [
  [-55, -92], [-54, -80], [-49, -64], [-46, -50], [-40, -34], [-34, -20], [-29, -6], [-27, 3], [-25, 9],
];
/** Frozen puddles — little slippery patches round the village + trails. */
export const ICE_PUDDLES = [
  [-12, 84, 2.6], [14, 88, 2.2], [32, 78, 3.0], [-40, 78, 2.8], [62, 34, 3.2], [-70, 20, 3.0], [70, 64, 2.4],
];

/** PACKED-SNOW TRAILS (control points, smoothed). */
export const SNOW_TRAIL_CTRL = [
  { id: "main", hw: 2.3, ctrl: [[0, 104], [0, 94], [1, 84], [2, 76], [2, 72]] },
  { id: "pond", hw: 2.1, ctrl: [[2, 52], [1, 44], [-1, 38], [-3, 32.5]] },
  { id: "west", hw: 2.0, ctrl: [[-21, 64], [-36, 72], [-52, 74], [-66, 70], [-74, 68]] },
  { id: "snowman-up", hw: 1.6, ctrl: [[-45, 73.6], [-52, 69], [-60, 66], [-67, 60], [-71, 52], [-71, 44], [-67, 37], [-60.5, 35.5], [-54.6, 41.2]] },
  { id: "meadow-grove", hw: 1.9, ctrl: [[-86, 54], [-92, 40], [-98, 24], [-100, 8], [-99, 3]] },
  { id: "grove-cave", hw: 1.9, ctrl: [[-106, -18], [-104, -36], [-98, -56], [-94, -72], [-91, -81]] },
  { id: "river-west", hw: 1.8, ctrl: [[-33.5, 13.5], [-36.5, 4], [-42, -10], [-50, -26], [-58, -46], [-62, -64], [-64, -80], [-72, -90], [-79, -92]] },
  { id: "grove-east", hw: 1.8, ctrl: [[-88, -10], [-74, -14], [-62, -18], [-46, -24], [-30, -27], [-12, -28], [4, -30], [11, -33]] },
  { id: "lake-south", hw: 2.0, ctrl: [[2, -0.5], [5, -10], [10, -20], [13, -28], [14, -33]] },
  { id: "east", hw: 2.0, ctrl: [[38, 62], [54, 60], [70, 56], [84, 54], [90, 52]] },
  { id: "pond-east", hw: 1.9, ctrl: [[30, 14], [44, 16], [58, 18], [72, 20], [86, 20]] },
  { id: "lift-range", hw: 1.9, ctrl: [[89, 23.5], [85, 30], [82.5, 38], [82.5, 46], [85, 53.2]] },
  { id: "sledrun-path", hw: 1.8, ctrl: [[62, 17], [64, 6], [68, -6], [71, -12]] },
  { id: "sled-hill", hw: 1.6, ctrl: [[87, -31], [94, -48], [104, -62], [118, -65], [126, -59], [121, -55.5]] },
  { id: "lake-east", hw: 1.8, ctrl: [[74, -32], [84.5, -41], [90.2, -52], [90.8, -62.5], [88, -69.2], [85.6, -70.4]] },
];

/** TOBOGGAN CHUTES — groomed, icy troughs you SLIDE down (snowTerrain.js
 *  carves them with a falling profile; Player.jsx rides them). */
export const SNOW_CHUTES = [
  // The Big Sled Run: off Big Sled Hill's summit, round its south face, out
  // onto the flats north of Fort Frost.
  { id: "big-run", hw: 2.4, ctrl: [[119, -35.5], [123, -25], [125, -16], [119, -8], [110, -4], [104, 3], [102, 11], [107, 17], [105, 23], [100, 27]], top: null, runout: 8 },
  // The Tumble Run: off Snowman Hill's top, curling north then east onto
  // the frozen pond (you glide out across the ice).
  { id: "tumble-run", hw: 2.2, ctrl: [[-49, 38], [-54, 28], [-50, 20], [-42, 17], [-34, 16], [-29, 15.5]], top: null, runout: 0 },
];
/** The CHAIRLIFT up Big Sled Hill (bottom station → top station). */
export const SNOW_LIFT = { from: [88, 19], to: [108.5, -40], speed: 4.2, chairs: 9 };

// ---------------------------------------------------------------------------
// SCENERY PLACEMENT (markers / props).
// ---------------------------------------------------------------------------
/** The giant snowman on top of Snowman Hill (a landmark, not climbable). */
export const GIANT_SNOWMAN = { position: [-47, 47], rotationY: 0.5 };
/** The frozen waterfall pouring (frozen!) off the escarpment into its pool. */
export const FROZEN_FALLS = { position: [-55, -99], width: 9, drop: 14 };

// Igloos round (not on) the Igloo Village stage — [x, z, rotY].
export const SNOW_IGLOOS = [
  [5.5, -52, 0.9], [23, -52.5, -0.8], [5, -65, 1.6], [24, -66, 2.6], [-10.5, 90.5, 0.7],
];
// Snowmen — the meadow's crowd + a few friends round the valley.
export const SNOWMEN = [
  [-94, 70], [-74, 70], [-92, 56], [-76, 56], [-98, 64], // the meadow
  [16, 96], [-20, 92], [36, 46], [-60, 8], [66, -10], [-82, -66],
];
// Decorated Christmas trees (the grove + the village).
export const XMAS_TREES = [
  [-108, -17], [-90, -18], [-111, -6], [-87, -2], [-113, 3],
  [VILLAGE_TREE[0], VILLAGE_TREE[1]], [-12, 112], [14, 104],
];
// Lamp posts with warm globes along the village trails.
export const SNOW_LAMPS = [
  [5.4, 100.5], [-3.4, 88], [4.6, 80], [-2.5, 72.5], [16, 70], [-14, 56.5], [5.6, 52.5], [-3.4, 51.5],
  [40, 64.5], [58, 63], [-30, 73.5], [-46, 77], [33, 17.5], [56, 21.5],
];
// Candy-cane poles round the arrival plaza.
export const CANDY_CANES = [[5.5, 109], [-5.5, 109], [12.5, 108], [-3.6, 101.5]];
// Slalom flags along the Big Sled Run (left/right of the trough).
export const SLALOM_FLAGS = true;
// Signposts at the main junctions: { id, p, yaw, arrows: [[label, [x, z]]…] }.
export const SNOW_SIGNPOSTS = [
  { id: "arrival", p: [4.2, 93], arrows: [["Lodge Village", [2, 72]], ["Snowman Meadow", [-74, 68]], ["Fort Frost", [101, 50]]] },
  { id: "square-w", p: [-21, 59], arrows: [["Snowman Hill", [-48, 44]], ["Snowman Meadow", [-74, 68]], ["Frozen Pond", [0, 14]]] },
  { id: "square-e", p: [39.5, 56.8], arrows: [["Fort Frost", [101, 50]], ["Ice Rink", [0, 20]], ["Lodge Yard", [27, 60]]] },
  { id: "pond-n", p: [-3.5, -4], arrows: [["Glacier Lake", [14, -46]], ["Frozen River", [-40, -10]], ["Ice Rink", [0, 20]]] },
  { id: "pond-e", p: [31, 10.5], arrows: [["Big Sled Hill", [119, -44]], ["Sledding Slope", [80, -22]], ["Fort Frost", [101, 50]]] },
  { id: "meadow", p: [-80, 51.5], arrows: [["Christmas Tree Grove", [-99, -8]], ["Lodge Village", [2, 62]]] },
  { id: "grove", p: [-93, -17.5], arrows: [["Ice Cave", [-88, -91]], ["Glacier Lake", [14, -46]], ["Snowman Meadow", [-84, 64]]] },
  { id: "lake-s", p: [8.5, -27], arrows: [["Igloo Village", [14, -58]], ["Christmas Tree Grove", [-99, -8]], ["Frozen Pond", [0, 14]]] },
  { id: "lift", p: [84, 24], arrows: [["Chairlift", [88, 19]], ["Fort Frost", [101, 50]], ["Sledding Slope", [80, -22]]] },
  { id: "lake-e", p: [94.6, -55.5], arrows: [["Penguin Colony", [55, -69]], ["Sledding Slope", [80, -22]], ["Aurora Lookout", [121, -47]]] },
];
// The treasure chest's possible spots (one is picked each visit).
export const SNOW_CHEST_SPOTS = [[-19.5, -63], [-120, 40], [-60, -86], [128, 20], [-40, 26], [30, -91.5]];

// Penguins waddle on the Penguin Floe; two more belly-slide on the pond.
export const PENGUIN_WANDER = { minX: PENGUIN_FLOE.center[0] - 10, maxX: PENGUIN_FLOE.center[0] + 10, minZ: PENGUIN_FLOE.center[1] - 9, maxZ: PENGUIN_FLOE.center[1] + 9 };
export const PENGUIN_COUNT = 7;
export const RINK_SLIDERS = 2;

// ---------------------------------------------------------------------------
// PETE — the snow world's wandering local (game/WanderingPete.jsx). Ambient
// life, not an interactable: he strolls round the lodge village, stops, throws
// a spin jump, then walks on. He NEVER runs.
// ---------------------------------------------------------------------------
export const PETE_CLIPS = {
  idle: "Idle_6",
  walk: "Walking",
  spin: "360_Power_Spin_Jump",
};
export const PETE_WANDER = { minX: -26, maxX: 50, minZ: 36, maxZ: 100 };
export const PETE_START = [12, 84];
export const PETE_WALK_SPEED = 1.15; // world units/sec — a stroll, never a run
export const PETE_IDLE_MS = [3000, 5000]; // pause before the spin jump
export const PETE_CHALLENGE_CLEARANCE = 11;

/** Snowy horizon peaks far out past the rim — [x, z, scale, height] (visual). */
export const SNOW_PEAKS = [
  [-215, -120, 60, 92], [-120, -230, 74, 118], [10, -250, 84, 132], [140, -225, 70, 108], [235, -110, 62, 96],
  [250, 30, 56, 80], [205, 170, 60, 86], [70, 240, 68, 90], [-90, 235, 64, 88], [-235, 150, 58, 84], [-260, 10, 62, 92],
  [-170, -190, 50, 76], [190, -170, 52, 80], [-50, -215, 58, 96], [80, -205, 56, 90],
];
