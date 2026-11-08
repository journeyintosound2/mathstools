/**
 * SUNSTONE DESERT — LAYOUT (built 2026-11-08) — the single source of truth
 * for the EIGHTH region: a big golden desert reached through a GOLDEN gate
 * on Number Island. Land only (no maths yet): ten flat spots are reserved for
 * the challenges to come, like the Emerald Jungle's clearings.
 *
 * Inspiration (Jeff's six reference images): Banjo-Kazooie's Gobi's Valley
 * (a stepped sandstone pyramid, a sunken pool under a carved wall, stairs
 * with balustrades), SM64's Shifting Sand Land (a brick pyramid, obelisks,
 * quicksand, stone-slab paths), Mario Odyssey's Tostarena (red-gold dunes,
 * a half-buried wreck, glassy crystal pillars, a pastel town, a floating
 * upside-down pyramid), Skyward Sword's Lanayru (layered mesas + canyons,
 * mine-cart rails) and BotW's Gerudo Town (a smooth plaster arch + awnings).
 *
 * THE MAP (x = east, z = SOUTH; north is −z; 1 unit = 1 m):
 *
 *   S   THE CARAVAN GATE — you arrive on a paved plaza in the south, looking
 *       north through a smooth plaster arch up the bazaar street.
 *   S   THE BAZAAR — a pastel desert town: domes, awnings, market stalls round
 *       Bazaar Square, a stepped ziggurat and a tower with a roof bridge.
 *   C   THE GREAT PYRAMID — six brick tiers (21.6 m) with a grand stair up the
 *       south face to the golden SUNSTONE on top; obelisks at its corners.
 *   N   THE SUN TEMPLE — a columned temple carved into the north cliff at the
 *       end of the Obelisk Avenue; the Sky Pyramid floats overhead.
 *   W   THE OASIS — a sunken basin: a wadeable pool under a carved hieroglyph
 *       wall, palms, two grand stairs down from the rim.
 *   NW  THE MESA LANDS — Red Mesa (a monumental stair + a ladder) and Twin
 *       Mesa, joined by a rope bridge over the mine-cart canyon; the Sun Arch.
 *   NE  THE DUNE SEA — big wind-built dunes (walk up the gentle side, slide
 *       down the steep one), the half-buried Dune Ship and the Sand Sphinx.
 *   E   THE QUICKSAND FLATS — swirly pits of quicksand (it swallows you!) with
 *       a boardwalk + stepping stones out to the Quicksand Crossing island.
 *   E   SUNDIAL RISE — a round sandstone drum with a spiral ramp and a giant
 *       sundial on top.
 *   SE  CRYSTAL HOLLOW — glassy crystal spires in a sandy hollow.
 *   SW  THE FOSSIL DIG — a giant skeleton half out of the sand, a dig camp.
 *
 * Pure data + tiny helpers (no three, no React) — the terrain, scatter,
 * colliders, renderer and checks all read these numbers.
 */

export const DESERT_REGION_ID = "sunstone-desert";
/** Rename the world here (everything reads this). */
export const DESERT_NAME = "Timestable Temple";

/**
 * (2026-11-08, later) The world is now the TIMESTABLE TEMPLE and opens on the
 * journey (data/journey.js — with Magma Multiples, after Snowball Sums).
 * This flag is kept only as an override: true opens the gate for everyone.
 */
export const DESERT_OPEN_TO_STUDENTS = false;

const at = (A, dx, dz) => [A[0] + dx, A[1] + dz];

// ---------------------------------------------------------------------------
// THE BASIN — the walkable desert sits inside a rim of canyon cliffs (west,
// north, south) and giant dunes (east + north-east) that slide you back.
// ---------------------------------------------------------------------------
export const DESERT_BOUNDARY = { halfW: 146, halfD: 132 };
export const DESERT_BOUNDS = { shape: "rect", width: 300, height: 272, center: [0, 0] };

// ---------------------------------------------------------------------------
// ARRIVAL — the Caravan Gate plaza. You arrive looking NORTH through the arch.
// ---------------------------------------------------------------------------
export const DESERT_SPAWN = { x: 0, z: 112 };
export const DESERT_RETURN_PORTAL = [10.5, 119];
// The gate's doorway (local +z) faces the arrival spot.
export const DESERT_RETURN_PORTAL_YAW = Math.atan2(DESERT_SPAWN.x - DESERT_RETURN_PORTAL[0], DESERT_SPAWN.z - DESERT_RETURN_PORTAL[1]);
export const DESERT_WELCOME_SIGN = { position: [-7, 105.5], rotationY: 0.45, text: `Welcome to the ${DESERT_NAME}!` };
/** Mills greets arrivals just beside the welcome board (not on it). */
export const DESERT_WELCOME_HOST = (() => {
  const [bx, bz] = DESERT_WELCOME_SIGN.position, r = DESERT_WELCOME_SIGN.rotationY;
  const lx = -2.1, lz = 0.8;
  return { id: "desert-welcome-host", position: [bx + lx * Math.cos(r) + lz * Math.sin(r), bz - lx * Math.sin(r) + lz * Math.cos(r)] };
})();
export const DESERT_MAP_BOARD = { position: [8.5, 104.5], rotationY: -0.45 };
/** The Caravan Gate: a smooth plaster wall across the road with a round arch. */
export const CARAVAN_GATE = { z: 97, halfSpan: 17, openHalf: 3.4, height: 7.4, archTop: 5.6, thick: 1.3 };

// ---------------------------------------------------------------------------
// THE BAZAAR (the town) — buildings are SOLID blocks (their flat roofs are
// walkable; the tower's outside stair + the roof bridge get you up there).
// [x, z] = centre, w (x) × d (z), h = roof height above the town level.
// ---------------------------------------------------------------------------
export const TOWN = { c: [0, 60], rx: 38, rz: 31 };
export const BAZAAR_BUILDINGS = [
  { id: "spice", x: 12.5, z: 84, w: 8, d: 7, h: 4.6, wall: "#f2b8a6", trim: "#c4553c", awning: "#e04b3a" },
  { id: "blue-dome", x: 13, z: 70, w: 9, d: 8, h: 6, wall: "#a9d4ec", trim: "#2f6fb0", dome: "#3f86d0" },
  { id: "tower", x: 14, z: 52, w: 8, d: 8, h: 9.5, wall: "#f6d77a", trim: "#c7832c", awning: "#2f9c8f", terrace: true },
  { id: "teal", x: 13, z: 36, w: 8, d: 7, h: 5, wall: "#8fd9c7", trim: "#20826e", awning: "#f2a33a" },
  { id: "twin", x: 27, z: 52, w: 7, d: 8, h: 9.5, wall: "#f4a76a", trim: "#b4542a", terrace: true },
  { id: "lilac", x: -12.5, z: 84, w: 8, d: 7, h: 5, wall: "#d7c0ec", trim: "#7a52a8", awning: "#7a52a8" },
  { id: "mint", x: -12, z: 70, w: 7, d: 8, h: 6.5, wall: "#c3ecb8", trim: "#4f9a3e", dome: "#f0c640" },
  { id: "peach", x: -13, z: 36, w: 8, d: 7, h: 5, wall: "#f8c9a0", trim: "#cf6a30", awning: "#3f7fc4" },
  { id: "sand-house", x: -30, z: 40, w: 7, d: 7, h: 4.5, wall: "#efd9b0", trim: "#9a6a3a", dome: "#e2734a" },
  { id: "back-e", x: 25, z: 80, w: 7, d: 6, h: 5.5, wall: "#f0e0c0", trim: "#a87a44", dome: "#d95a8a" },
  { id: "back-w", x: -27, z: 86, w: 7, d: 6, h: 4.5, wall: "#f6c7d4", trim: "#b44a6a", awning: "#f0c640" },
  { id: "back-se", x: 26, z: 35, w: 7, d: 7, h: 5, wall: "#bfe0f6", trim: "#2f74a8", awning: "#e04b3a" },
];
/** The tower's outside stair (up its east side) + the landing at roof height. */
export const TOWER_STAIR = { from: [19.25, 63], to: [19.25, 51.8], hw: 1.15 };
export const TOWER_LANDING = { c: [19.2, 49.9], hx: 1.3, hz: 1.9 };
/** The plank bridge from the tower's landing across to the twin roof. */
export const ROOF_BRIDGE = { from: [20.2, 49.9], to: [23.9, 49.9], hw: 0.95 };
/** The stepped ziggurat at the town's west edge (tiers: half-size, rise). */
export const ZIGGURAT = {
  c: [-32, 70],
  tiers: [{ half: 6, h: 3 }, { half: 4, h: 6 }, { half: 2.2, h: 8.6 }],
  stair: { from: [-20, 70], to: [-29.8, 70], hw: 1.3 },
};
/** BAZAAR SQUARE (a reserved spot) — market stalls ring it. */
export const BAZAAR_SQUARE = { c: [-20, 55], r: 8 };
/** Market stalls round the square: [x, z, yaw, awning colour]. */
export const MARKET_STALLS = [
  [-29.5, 51, Math.PI / 2 + 0.35, "#e04b3a"], [-30, 59, Math.PI / 2 - 0.3, "#f2a33a"], [-25, 65.2, Math.PI - 0.15, "#2f9c8f"],
  [-15, 65.2, Math.PI + 0.25, "#7a52a8"], [-24.5, 45, 0.1, "#3f7fc4"], [-15.5, 45, -0.2, "#d95a8a"],
];
/** The town well in the street + palm planters. */
export const TOWN_WELL = [6.5, 62];

// ---------------------------------------------------------------------------
// THE GREAT PYRAMID — six brick tiers on a square base, a grand stair up the
// middle of the south face to the 16 × 16 m summit and the golden Sunstone.
// ---------------------------------------------------------------------------
export const PYRAMID = {
  c: [0, -40], half: 24, tiers: 6, rise: 3.6, inset: 3.2,
  // The grand stair: 60 steps of 0.36 × 0.45 m, |x| ≤ hw, from its bottom
  // edge (zFoot) north to the summit's south edge.
  stair: { hw: 3.2, n: 60, rise: 0.36, run: 0.45 },
};
PYRAMID.top = PYRAMID.tiers * PYRAMID.rise; // 21.6 m
PYRAMID.topHalf = PYRAMID.half - (PYRAMID.tiers - 1) * PYRAMID.inset; // 8 m
PYRAMID.stair.zTop = PYRAMID.c[1] + PYRAMID.topHalf; // −32
PYRAMID.stair.zFoot = PYRAMID.stair.zTop + PYRAMID.stair.n * PYRAMID.stair.run; // −5
/** The golden SUNSTONE capstone on the summit (north half of the top). */
export const SUNSTONE = { position: [0, PYRAMID.c[1] - 3.5], base: 2.6, height: 3.2, pedestal: 0.6 };
/** Obelisks: the pyramid's four corners + three pairs up the avenue. */
export const OBELISKS = [
  [-27, -12.5], [27, -12.5], [-26, -63.5], [26, -63.5],
  [-5.8, -77], [5.8, -77], [-5.8, -85.5], [5.8, -85.5], [-9.5, -93], [9.5, -93],
];

// ---------------------------------------------------------------------------
// THE SUN TEMPLE — a columned portico carved into the north cliff.
// ---------------------------------------------------------------------------
export const SUN_TEMPLE = {
  // The raised portico (x span, front + back z) and its height.
  x0: -14, x1: 14, zFront: -110.5, zBack: -118.5, h: 2.4,
  // The front steps (bottom edge → top edge), half-width.
  steps: { from: [0, -107], to: [0, -110.5], hw: 6.5, n: 7 },
  // The cliff the temple is carved into rises behind it.
  cliff: { z: -119, halfW: 24, h: 22 },
  sphinxes: [[-10.5, -105.5], [10.5, -105.5]],
};
/** The Sky Pyramid — an upside-down pyramid floating over the avenue (visual). */
export const SKY_PYRAMID = { position: [0, 64, -84], size: 18 };

// ---------------------------------------------------------------------------
// THE OASIS — a sunken basin with a wadeable pool, palms and grand stairs.
// ---------------------------------------------------------------------------
export const OASIS = { c: [-84, 8], rx: 24, rz: 19, p: 2.4, depth: 6.5 };
export const OASIS_POOL = { c: [-87, 4], rx: 12, rz: 8, depth: 0.62, rough: 1.1 };
/** Two grand stairs down from the rim (bottom edge = basin floor end). */
export const OASIS_STAIRS = [
  { id: "oasis-east", from: [-68.5, 20], to: [-57.5, 20], hw: 2.2 },
  { id: "oasis-north", from: [-102, -4], to: [-102, -15.5], hw: 2.2 },
];
/** The carved hieroglyph wall on the basin's west bank, above the pool. */
export const HIERO_WALL = { position: [-107.4, 3], rotationY: Math.PI / 2, width: 13, height: 6.2 };

// ---------------------------------------------------------------------------
// THE MESA LANDS — two flat-topped mesas, a monumental stair, ladders, a rope
// bridge over the mine-cart canyon, and the natural Sun Arch.
// ---------------------------------------------------------------------------
export const MESAS = [
  { id: "red-mesa", c: [-104, -84], rx: 22, rz: 17, p: 3, h: 14, band: 2.6 },
  { id: "twin-mesa", c: [-56, -96], rx: 12, rz: 12, p: 3, h: 14, band: 2.4 },
];
/** Buttes + hoodoos (tall, unclimbable pillars) round the canyon. */
export const BUTTES = [
  { c: [-130, -40], r: 6, h: 18 }, { c: [-36, -112], r: 5, h: 16 }, { c: [-124, -116], r: 7, h: 20 },
  { c: [-82, -36], r: 2.4, h: 8 }, { c: [-74, -40], r: 1.8, h: 6 }, { c: [-128, 4], r: 3.5, h: 12 },
];
/** The Red Mesa's monumental stair (two flights + a landing) up its south face. */
export const MESA_STAIR = {
  flights: [
    { id: "mesa-1", from: [-104, -45.5], to: [-104, -54.5], hw: 2 },
    { id: "mesa-2", from: [-104, -58.5], to: [-104, -69.5], hw: 2 },
  ],
  landing: { c: [-104, -56.5], hx: 2.8, hz: 2, h: 7 },
};
/** Ladders up mesa faces: the foot spot + the outward direction (yaw of n). */
export const LADDERS = [
  { id: "red-west", mesa: "red-mesa", angle: Math.PI, along: 0 },
  { id: "twin-east", mesa: "twin-mesa", angle: 0.35, along: 0 },
];
/** The rope bridge between the mesa tops. */
export const MESA_BRIDGE = { from: [-84.5, -90], to: [-66.5, -90], hw: 1.15, sag: 1.0 };
/** The mine-cart rails along the canyon floor (decoration) + the mine mouth. */
export const MINE_RAILS = [[-83, -122], [-80, -110], [-76, -98], [-74, -86], [-73, -74], [-73.5, -64]];
export const MINE_MOUTH = { position: [-83, -126.5], width: 5, height: 5.2 };
/** The Sun Arch — a natural rock arch over the canyon trail. */
export const SUN_ARCH = { c: [-48, -54], span: 15, yaw: 0.65, height: 12.5, thick: 3.2 };

// ---------------------------------------------------------------------------
// SUNDIAL RISE — a round sandstone drum, a spiral ramp, the sundial on top.
// ---------------------------------------------------------------------------
export const SUNDIAL_RISE = { c: [56, -16], r: 10.5, h: 7, rampW: 3.1, a0: Math.PI * 0.62, turn: Math.PI * 1.45 };

// ---------------------------------------------------------------------------
// THE DUNE SEA — the dune field's mask + wind; the Dune Ship + Sand Sphinx.
// ---------------------------------------------------------------------------
export const DUNE_SEA = { c: [94, -74], rx: 82, rz: 70, wind: [0.94, -0.34], wavelength: 42, height: 13 };
/** Smaller dune fields that roll across the open desert (same wind). */
export const DUNE_FIELDS = [
  { c: [62, 112], rx: 46, rz: 26, height: 5.5 },
  { c: [-120, 40], rx: 34, rz: 30, height: 5 },
  { c: [-56, -14], rx: 22, rz: 20, height: 3.5 },
  { c: [-6, -124], rx: 40, rz: 14, height: 4 },
  { c: [132, 66], rx: 22, rz: 40, height: 6 },
];
export const DUNE_SHIP = { position: [117, -84], rotationY: -0.5, tilt: 0.32, length: 22 };
export const SAND_SPHINX = { position: [76, -104], rotationY: 0.5, size: 1 };

// ---------------------------------------------------------------------------
// THE QUICKSAND FLATS — the pits. A pit's SURFACE is level; walk into its
// soft edge (slow, you sink to your knees), reach its middle and it swallows
// you (wiped out → back to the start). `ring` = a moat round an island.
// ---------------------------------------------------------------------------
export const QUICKSAND_ISLAND = { c: [94, 30], r: 7.4 };
export const QUICKSAND = [
  // The moat round the Quicksand Crossing island.
  { id: "moat", ring: true, c: QUICKSAND_ISLAND.c, rIn: 8.6, rOut: 14.6 },
  // The flats.
  { id: "flats-1", c: [72, 12], rx: 8, rz: 5.5, rot: 0.4 },
  { id: "flats-2", c: [88, 2], rx: 6.5, rz: 7.5, rot: -0.3 },
  { id: "flats-3", c: [110, 12], rx: 10, rz: 6.5, rot: 0.2 },
  { id: "flats-4", c: [120, 38], rx: 7, rz: 9, rot: 0.6 },
  { id: "flats-5", c: [76, 52], rx: 9, rz: 6, rot: -0.5 },
  { id: "flats-6", c: [103, 56], rx: 6.5, rz: 5.5, rot: 0.1 },
  // Lone pits elsewhere (each with a warning sign).
  { id: "dunes-1", c: [70, -62], rx: 6.5, rz: 5, rot: 0.8 },
  { id: "dunes-2", c: [124, -46], rx: 6, rz: 7, rot: -0.2 },
  { id: "canyon-1", c: [-88, -40], rx: 5.5, rz: 4.5, rot: 0.3 },
  { id: "fossil-1", c: [-122, 62], rx: 6, rz: 5, rot: -0.6 },
  { id: "crystal-1", c: [124, 104], rx: 5.5, rz: 6.5, rot: 0.4 },
  { id: "south-1", c: [54, 104], rx: 6, rz: 4.5, rot: 0.1 },
];
/** The soft edge you can still wade (metres in from a pit's edge). */
export const QS_EDGE = 1.6;
/** The boardwalk across the moat (west) + the stepping stones (north). */
export const BOARDWALK = { from: [76.6, 30], to: [87.6, 30], hw: 1.3, lift: 0.5 };
export const STEPPING_STONES = [[94, 14.2], [94.4, 16.6], [93.6, 19], [94.2, 21.4]];
/** Warning signs by the pits: [x, z, yaw]. */
export const QS_SIGNS = [
  [66.5, 24.5, 0.9], [80.6, 39.6, 1.2], [60.5, -53, 0.4], [-80.5, -44.5, -0.8], [-115.5, 66, -1.2], [116.5, 101, 1.1],
  [45, 98.5, 1.9], [114, -37, 0.7], [96, 64, 3.0],
];

// ---------------------------------------------------------------------------
// CRYSTAL HOLLOW + THE FOSSIL DIG
// ---------------------------------------------------------------------------
export const CRYSTAL_HOLLOW = { c: [104, 92], r: 22 };
/** Crystal spires: [x, z, height, radius, tilt, yaw, hue (0 = aqua … 1 = rose)]. */
export const CRYSTALS = [
  [116, 82, 9, 1.3, 0.12, 0.2, 0.1], [119, 86, 6, 0.9, -0.2, 1.1, 0.6], [113, 79, 4.5, 0.8, 0.25, 2.2, 0.3],
  [118, 96, 11, 1.5, -0.1, 0.7, 0.85], [121, 92, 5.5, 0.85, 0.3, 2.9, 0.4], [114.5, 100, 7, 1.05, 0.18, 1.6, 0.15],
  [91, 104, 8, 1.15, -0.15, 0.9, 0.7], [87, 101, 5, 0.8, 0.28, 2.4, 0.25], [95, 108, 6.5, 0.95, -0.22, 0.3, 0.5],
  [108, 109, 9.5, 1.3, 0.1, 1.9, 0.95], [102, 112, 5.2, 0.8, -0.3, 2.7, 0.35], [124, 72, 7.5, 1.1, 0.2, 0.5, 0.75],
  [84, 86, 4.2, 0.7, 0.3, 1.2, 0.05], [112, 70, 5.8, 0.9, -0.25, 2.0, 0.55],
];
export const FOSSIL = { c: [-111, 97.5], yaw: -0.22, length: 24 };

// ---------------------------------------------------------------------------
// THE TEN RESERVED SPOTS — flat, open places for the challenges to come.
// ---------------------------------------------------------------------------
export const DESERT_SPOTS = [
  { id: "bazaar", label: "Bazaar Square", icon: "🏺", center: BAZAAR_SQUARE.c, radius: 7.5 },
  { id: "pyramid", label: "Pyramid Steps", icon: "🔺", center: [0, 5], radius: 7 },
  { id: "temple", label: "Sun Temple", icon: "☀️", center: [0, -99.5], radius: 6.5 },
  { id: "oasis", label: "Oasis Garden", icon: "🌴", center: [-69.5, 10.5], radius: 5.5 },
  { id: "mesa", label: "Mesa Top", icon: "🪨", center: [-108, -88], radius: 7 },
  { id: "fossil", label: "Fossil Dig", icon: "🦴", center: [-95, 82], radius: 7 },
  { id: "sundial", label: "Sundial Rise", icon: "🕰️", center: SUNDIAL_RISE.c, radius: 6.5 },
  { id: "quicksand", label: "Quicksand Crossing", icon: "🌀", center: QUICKSAND_ISLAND.c, radius: 5.5 },
  { id: "ship", label: "Dune Ship", icon: "⛵", center: [100, -72], radius: 7 },
  { id: "crystal", label: "Crystal Hollow", icon: "💎", center: [100, 92], radius: 7 },
];
// ---------------------------------------------------------------------------
// THE TIMESTABLE TEMPLE STATIONS (2026-11-08) — fifteen carved stones in
// their family groups (data/temple/templeTables.js has the maths):
//   the Anchors (10s, 5s, 11s + Anchor Mix) round Bazaar Square,
//   the Doubling family (2s, 4s, 8s + Doubling Mix) on the oasis shore,
//   the Threes family (3s, 6s, 9s, 12s + Threes Mix) on top of the Red Mesa,
//   the 7s before the Sun Temple, the Grand Mix beside the Sunstone.
// Each stone faces `look` (where students walk up from). Mixes are taller.
// The TIMES-TABLE WALL (the 12 × 12 square, lit fact by fact) + Dash the
// camel (the temple's guide) stand by the arrival.
// ---------------------------------------------------------------------------
const faceTo = (p, look) => Math.atan2(look[0] - p[0], look[1] - p[1]);
const stone = (key, position, look, extra = {}) => ({ key, position, rotationY: faceTo(position, look), ...extra });
export const TEMPLE_STONES = [
  stone("x10", [-23.5, 49.5], [-12, 55]),
  stone("x5", [-26, 55], [-12, 55]),
  stone("x11", [-23.5, 60.5], [-12, 55]),
  stone("mix1", [-18.5, 55], [-8, 55], { tall: true }),
  stone("x2", [-93, 19], [-87, 4]),
  stone("x4", [-87, 20.5], [-87, 4]),
  stone("x8", [-81, 20.5], [-85, 4]),
  stone("mix2", [-75, 19], [-80, 4], { tall: true }),
  stone("x3", [-113, -80], [-104, -71]),
  stone("x6", [-108.5, -84.5], [-104, -71]),
  stone("x9", [-99.5, -84.5], [-104, -71]),
  stone("x12", [-95, -80], [-104, -71]),
  stone("mix3", [-104, -88.5], [-104, -71], { tall: true }),
  stone("x7", [0, -102], [0, -90], { tall: true }),
  stone("grand", [0, -35.5], [0, -28], { tall: true, grand: true }),
];
export const TEMPLE_STONE = Object.fromEntries(TEMPLE_STONES.map((s) => [s.key, s]));
/** Clearance round each stone (no cacti / palms / boulders). */
export const TEMPLE_STONE_CLEAR = 2.6;
// The wall stands between the arrival trail and the town wall, facing the
// path (south); Dash waits at its west end.
export const TEMPLE_WALL = { position: [-17, 101.6], rotationY: 0, width: 6.6, height: 4.4, thick: 0.8 };
export const TEMPLE_DASH = { position: [-22.9, 103.3], rotationY: faceTo([-22.9, 103.3], [-12, 110]) };

/** Named landmarks (labels + the map). */
export const DESERT_LANDMARKS = {
  pyramid: { label: "The Great Pyramid", icon: "🔺", center: PYRAMID.c },
  sunstone: { label: "The Sunstone", icon: "✨", center: SUNSTONE.position },
  oasisPool: { label: "The Oasis", icon: "🏝️", center: OASIS_POOL.c },
  redMesa: { label: "Red Mesa", icon: "🪨", center: MESAS[0].c },
  twinMesa: { label: "Twin Mesa", icon: "🪨", center: MESAS[1].c },
  arch: { label: "The Sun Arch", icon: "🌉", center: SUN_ARCH.c },
  dunes: { label: "The Dune Sea", icon: "🏜️", center: [96, -44] },
  sphinx: { label: "The Sand Sphinx", icon: "🗿", center: SAND_SPHINX.position },
  flats: { label: "The Quicksand Flats", icon: "⚠️", center: [96, 46] },
  canyon: { label: "Mine-Cart Canyon", icon: "⛏️", center: [-74, -104] },
  town: { label: "The Bazaar", icon: "🕌", center: [0, 64] },
};

// ---------------------------------------------------------------------------
// LEVEL PADS — superellipse { c, rx, rz, p }: the ground is levelled to the
// mean height under it (`levelOf` shares a pad's level, `depth` sinks it, a
// small `bank` keeps the edge a steep wall).
// ---------------------------------------------------------------------------
export const DESERT_PADS = [
  { id: "arrival", c: [0, 110], rx: 17, rz: 10, p: 2.6 },
  { id: "town", c: TOWN.c, rx: TOWN.rx, rz: TOWN.rz, p: 3, levelOf: "arrival" },
  { id: "pyramid", c: PYRAMID.c, rx: 30, rz: 30, p: 7, calm: 8 },
  { id: "plaza", c: [0, 4], rx: 17, rz: 8.5, p: 2.6, levelOf: "pyramid" },
  { id: "temple", c: [0, -100], rx: 16, rz: 7.5, p: 2.6, calm: 10 },
  { id: "oasis", c: OASIS.c, rx: OASIS.rx, rz: OASIS.rz, p: OASIS.p, depth: OASIS.depth, bank: 2.4 },
  { id: "fossil", c: [-100, 86], rx: 18, rz: 12, p: 2.4, calm: 8 },
  { id: "sundial", c: SUNDIAL_RISE.c, rx: 18, rz: 18, p: 2, calm: 8 },
  { id: "ship", c: [100, -72], rx: 11, rz: 9, p: 2.2, calm: 14 },
  { id: "sphinx", c: [76, -100], rx: 8, rz: 8, p: 2, calm: 9 },
  { id: "crystal", c: [100, 92], rx: 12, rz: 10, p: 2.2, calm: 10 },
  { id: "flats", c: [96, 30], rx: 31, rz: 31, p: 2.4, calm: 10 },
];

// ---------------------------------------------------------------------------
// TRAILS — graded sand tracks (`kind` styles the ribbon): the main street
// (paving), the Obelisk Avenue (stone slabs), caravan tracks elsewhere.
// ---------------------------------------------------------------------------
export const DESERT_TRAIL_CTRL = [
  { id: "main", hw: 3.0, kind: "paved", ctrl: [[0, 108], [0, 96], [0, 82], [0, 66], [0, 50], [0, 34], [0, 20], [0, 10]] },
  { id: "pyr-west", hw: 2.2, kind: "stone", ctrl: [[-12, 5], [-28, -2], [-34, -18], [-35, -40], [-34, -62], [-24, -72], [-6, -73]] },
  { id: "pyr-east", hw: 2.2, kind: "stone", ctrl: [[12, 5], [28, -2], [34, -18], [35, -40], [34, -62], [24, -72], [6, -73]] },
  { id: "avenue", hw: 2.6, kind: "stone", ctrl: [[0, -71], [0, -80], [0, -90], [0, -96]] },
  { id: "west-road", hw: 2.2, kind: "sand", ctrl: [[-3, 44], [-18, 40], [-34, 32], [-46, 26], [-54, 21], [-58, 20]] },
  { id: "oasis-fossil", hw: 1.9, kind: "sand", ctrl: [[-50, 24], [-58, 36], [-70, 50], [-82, 64], [-90, 74]] },
  { id: "arrival-west", hw: 1.9, kind: "sand", ctrl: [[-12, 108], [-30, 106], [-50, 102], [-70, 96], [-86, 89]] },
  { id: "canyon", hw: 2.0, kind: "sand", ctrl: [[-35, -40], [-42, -48], [-50, -57], [-62, -62], [-74, -58], [-88, -50], [-104, -44]] },
  { id: "oasis-north", hw: 1.9, kind: "sand", ctrl: [[-104, -43], [-103, -32], [-102, -22], [-102, -16]] },
  { id: "canyon-floor", hw: 1.8, kind: "sand", reach: 3.5, batter: 2.6, ctrl: [[-72, -62], [-73.5, -76], [-75, -92], [-76, -106], [-79, -117]] },
  { id: "east-road", hw: 2.2, kind: "sand", ctrl: [[12, 5], [28, 8], [42, 12], [54, 18], [64, 24], [72, 28], [76.6, 30]] },
  { id: "sundial", hw: 2.0, kind: "sand", ctrl: [[28, 8], [34, 2], [38, -4]] },
  { id: "dunes", hw: 2.1, kind: "sand", ctrl: [[35, -40], [48, -40], [62, -42], [76, -48], [86, -58], [94, -66]] },
  { id: "crystal-road", hw: 2.0, kind: "sand", ctrl: [[3, 91.5], [14, 91.5], [26, 92], [40, 92], [62, 90], [78, 90], [90, 92]] },
];

// ---------------------------------------------------------------------------
// SCENERY ANCHORS
// ---------------------------------------------------------------------------
/** Wooden finger-posts at the junctions: arrows name a place + point down the way. */
export const DESERT_SIGNPOSTS = [
  { id: "gate", p: [4.8, 88.4], arrows: [["The Bazaar", [0, 80]], ["The Fossil Dig", [-30, 106]], ["Crystal Hollow", [20, 92]]] },
  { id: "town-n", p: [5, 26], arrows: [["The Great Pyramid", [0, 12]], ["The Oasis", [-18, 40]], ["Sundial Rise", [20, 7]]] },
  { id: "plaza-w", p: [-16.5, 7.5], arrows: [["Sun Temple", [-30, -6]], ["Mesa Lands", [-30, -6]]] },
  { id: "plaza-e", p: [16.5, 8.5], arrows: [["Quicksand Flats", [30, 8.5]], ["The Dune Sea", [30, -4]]] },
  { id: "avenue", p: [-6, -68], arrows: [["Sun Temple", [0, -84]], ["The Great Pyramid", [-26, -70]]] },
  { id: "arch", p: [-38, -38], arrows: [["Mesa Lands", [-44, -50]], ["The Great Pyramid", [-35, -30]]] },
  { id: "mesa", p: [-97, -44], arrows: [["Red Mesa", [-100, -45.5]], ["The Oasis", [-101, -32]], ["Mine-Cart Canyon", [-80, -54]]] },
  { id: "oasis", p: [-50, 18], arrows: [["The Oasis", [-58, 20]], ["The Fossil Dig", [-58, 36]], ["The Bazaar", [-34, 32]]] },
  { id: "east", p: [58, 25.5], arrows: [["Quicksand Crossing", [72, 28]], ["Sundial Rise", [34, 2]]] },
  { id: "dunes", p: [38, -36], arrows: [["The Dune Ship", [62, -42]], ["The Great Pyramid", [34, -30]]] },
];
/** The treasure chest's possible spots (one is picked each visit). */
export const DESERT_CHEST_SPOTS = [[-118, -78], [130, -30], [-44, 76], [70, 72], [-130, 30], [40, -84]];
/** Camels resting round the caravan stop + the oasis: [x, z, yaw]. */
export const CAMELS = [[-39, 93, 0.8], [-44.5, 90.5, 1.9], [-76, -3, 2.4], [31, 99, -1.1]];
/** Distant buttes + mesas on the horizon: [x, z, radius, height]. */
export const DESERT_HORIZON = [
  [-260, -60, 34, 46], [-230, -190, 46, 62], [-90, -270, 52, 58], [60, -280, 40, 70], [200, -240, 56, 54],
  [290, -40, 44, 48], [270, 140, 38, 60], [140, 270, 50, 52], [-40, 280, 44, 64], [-200, 220, 52, 50],
  [-290, 90, 40, 56], [-180, -280, 30, 80],
];
