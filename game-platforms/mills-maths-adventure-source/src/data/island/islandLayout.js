/**
 * NUMBER ISLAND — LAYOUT (rebuilt 2026-10-09 as a big, polished hub island,
 * ~2.5× across the old one). The single source of truth for WHERE everything
 * is: the coastline, the hills, the level pads, the paths, the five world
 * gates, the island friends, the plaza, the arrival and the Achievements
 * Wall. Pure constants + tiny helpers — the terrain (islandTerrain.js), the
 * scatter (islandProps.js), the colliders, the renderer and the checks all
 * read these numbers, so they can never drift apart.
 *
 * THE ISLAND (≈ 200 m across, ≈ 30,000 m² of land — the old island was a
 * 76 m circle): a sunny hub in a turquoise sea. Every world gate stands in a
 * little landscape that FORESHADOWS its world:
 *
 *   S   HARBOUR GREEN — you step off the jetty onto the green, looking north
 *       through the NUMBER ISLAND arch, up Main Street to the plaza. The
 *       ACHIEVEMENTS WALL stands beside the arch; Mills waits on the green.
 *   C   MISSION PLAZA — a raised stone plaza (four stair flights) with the
 *       Number Fountain, the Mission Board and the Trophy Stand.
 *   N   SCHOOLHOUSE HILL — the little island school; the Retrieval Practice
 *       Playground gate is its yard gate (open — the 80% lock was removed 2026-10-09).
 *   NW  FROSTY PEAK — a snow-capped mountain. The Snowball Sums IGLOO sits in
 *       Igloo Hollow on its flank; Pip the Penguin keeps his giant
 *       thermometer number line at the snow's edge below.
 *   NE  EMBER PEAK — a smoking volcano. The Magma Multiples basalt arch sits
 *       on the Ember Terrace on its flank; Fern the Fox waits in the ash
 *       fields below.
 *   W   HAYBALE MEADOWS — a little farm (barn, windmill, wheat, sunflowers);
 *       the Fraction Farm haybale gate at the end of the farm lane.
 *   SW  EMERALD LAGOON — palms and ferns round a shallow lagoon; EMERALD FALLS
 *       pours off Emerald Bluff; the Emerald Jungle mossy arch on the ledge.
 *   E   ALBY'S LIGHTHOUSE — a rocky islet off the east headland, reached by a
 *       rope bridge; Alby the Owl by the lighthouse.
 *   SE  SUNNY COVE — a sandy cove with a pier, beach huts and rowboats.
 *
 * Coordinates: x = east, z = SOUTH (three.js), so north is −z. 1 unit = 1 m.
 * Sea level is y = 0 (the whole ocean, the lagoon and the shallows).
 */

export const ISLAND_REGION_ID = "island-1";
export const ISLAND_NAME = "Number Island";
export const SEA_Y = 0;

// Hard clamp (the deep sea bounces you back long before you reach it).
export const ISLAND_BOUNDS = { shape: "circle", radius: 136, center: [0, 0] };

// ---------------------------------------------------------------------------
// ARRIVAL — Harbour Green. You arrive at the top of the beach (just stepped
// off the jetty) LOOKING NORTH through the arch up Main Street.
// ---------------------------------------------------------------------------
export const ISLAND_SPAWN = { x: 0, z: 84 };
export const ISLAND_ARCH = { position: [0, 67], width: 10, height: 7.2, text: "NUMBER ISLAND" };
// The ACHIEVEMENTS WALL stands on the green just WEST of the arch, its face
// turned to the arrivals (front = +z, i.e. south). Six framed boards, one per
// world. `view` = where you stand to read it (the Enter prompt range).
export const ACHIEVEMENT_WALL = {
  position: [-16.5, 68.6], rotationY: 0.22, length: 15.6, height: 4.4,
  promptRange: 7.5, promptDepth: [1.2, 9.5],
};
// A big painted island map on the other side of the arch, facing the green.
export const ISLAND_MAP_BOARD = { position: [15, 69.4], rotationY: -0.24 };
// The welcome sign and Mills, the guide, on the green.
export const ISLAND_WELCOME = { position: [7.2, 77.5], text: "Welcome to Number Island!" };
// The jetty you arrived on + the moored sailboat.
export const ISLAND_JETTY = { from: [0, 90.5], to: [0, 116], halfWidth: 1.6, deckY: 1.05 };
export const ISLAND_SAILBOAT = { position: [5.6, 110], rotationY: 0.12 };

// ---------------------------------------------------------------------------
// MISSION PLAZA (centre) — a raised octagonal stone plaza on a level pad,
// 1.2 m up (a hop gets you up its wall; four stair flights walk you up).
// ---------------------------------------------------------------------------
export const PLAZA = {
  center: [0, 10], apothem: 12.5, rise: 1.2,
  stairs: { width: 7, steps: 4, depth: 0.62 },
};
export const PLAZA_FOUNTAIN = { position: [0, 8], radius: 3.4 };
export const MISSION_BOARD_POS = [-7.4, 8.5];
export const TROPHY_STAND_POS = [7.4, 8.5];

// ---------------------------------------------------------------------------
// THE ISLAND FRIENDS (the topic NPCs) + the zones they belong to.
// ---------------------------------------------------------------------------
export const PIP_SPOT = { position: [-30, -22], area: "pip" }; // integers — Pip's thermometer number line
export const FERN_SPOT = { position: [30, -21], area: "fern" }; // fractions/decimals/% — the ash fields
export const ALBY_SPOT = { position: [111.5, 9.5], area: "alby" }; // algebra — the lighthouse
export const MILLS_SPOT = { position: [5.5, 79] };
export const PIP_THERMOMETER = { position: [-34.5, -26.5], rotationY: 0.75 };

// ---------------------------------------------------------------------------
// THE FIVE WORLD GATES — each in its own little landscape. `yaw` turns the
// gate's doorway (+z local) to face its approach. `arrive` = where you land
// coming BACK from that world (just in front of the gate, outside its
// trigger), `arriveYaw` the camera yaw you arrive with (looking away from it).
// ---------------------------------------------------------------------------
const yawFrom = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]);
function gate(id, position, faceToward, arriveDist = 5.5) {
  const yaw = yawFrom(position, faceToward);
  const arrive = [position[0] + Math.sin(yaw) * arriveDist, position[1] + Math.cos(yaw) * arriveDist];
  // Camera yaw 0 = camera on +z looking −z; we look ALONG the gate's facing.
  return { id, position, yaw, arrive, arriveYaw: yaw + Math.PI };
}
export const GATES = {
  // Retrieval Practice Playground — the school's yard gate.
  playground: gate("playground", [0, -50.5], [0, -30]),
  // Snowball Sums — the igloo in Igloo Hollow, facing down to the plaza.
  snow: gate("snow", [-47.5, -46.5], [-30, -26]),
  // Magma Multiples — the basalt arch on the Ember Terrace.
  magma: gate("magma", [47.5, -42], [32, -26]),
  // Fraction Farm — the haybale gate at the end of the farm lane.
  farm: gate("farm", [-81, 2], [-60, 3]),
  // Emerald Jungle — the mossy arch on the lagoon ledge.
  jungle: gate("jungle", [-33.5, 46.5], [-22, 62]),
};

// ---------------------------------------------------------------------------
// THE COAST — a polar radius R(θ) (θ = atan2(z, x)) with designed bays and
// headlands + a gentle wobble, and the lighthouse ISLET as its own blob.
// `cliff` marks coasts that drop straight to the sea (no beach).
// ---------------------------------------------------------------------------
export const COAST = {
  r0: 101,
  bumps: [
    { a: Math.PI / 2, w: 0.2, d: -6.5 }, // Harbour Bay (south) — the jetty
    { a: 0.86, w: 0.15, d: -15 }, // Sunny Cove (south-east)
    { a: 0.02, w: 0.2, d: -7.5 }, // the east headland (before the islet channel)
    { a: -0.42, w: 0.2, d: 3 }, // east-north-east
    { a: -0.82, w: 0.3, d: 9 }, // Ember Peak's lava shore (north-east)
    { a: -1.55, w: 0.3, d: -1 }, // behind Schoolhouse Hill (north)
    { a: -2.3, w: 0.32, d: 7 }, // Frosty Peak's cliffs (north-west)
    { a: Math.PI, w: 0.34, d: 3 }, // Haybale Meadows' beach (west)
    { a: 2.32, w: 0.15, d: -4 }, // the lagoon mouth (south-west)
    { a: 1.95, w: 0.18, d: 2.5 }, // south-west point
  ],
  // Where the coast is a CLIFF (0 = beach … 1 = cliff), by angle.
  cliffs: [
    { a: 0.02, w: 0.28, k: 1 }, // the east headland
    { a: -2.25, w: 0.3, k: 0.85 }, // under Frosty Peak
    { a: -1.0, w: 0.18, k: 0.55 }, // Ember Peak's north-east foot
  ],
};
export const ISLET = { center: [114, 4], radius: 10.5 };

// ---------------------------------------------------------------------------
// HILLS — cosine bells (centre + radii, or a capsule a→b), domain-warped.
// `cone` = a volcano profile (with a crater); negative h = a dip.
// ---------------------------------------------------------------------------
export const FROSTY_PEAK = { c: [-61, -64], summit: [-62.5, -66.5] };
// The summit trail spirals once round the peak (east → north → west → south)
// from Igloo Hollow up to the lookout on top.
const SUMMIT_SPIRAL = (() => {
  const [sx, sz] = FROSTY_PEAK.summit;
  const out = [[-52.5, -51.5]];
  const a0 = Math.atan2(-51.5 - sz, -52.5 - sx);
  const N = 14;
  for (let k = 1; k <= N; k++) {
    const t = k / N;
    const a = a0 - t * Math.PI * 1.72;
    const r = 18 - 12 * t;
    out.push([sx + Math.cos(a) * r, sz + Math.sin(a) * r]);
  }
  return out;
})();
export const EMBER_PEAK = { c: [69, -61], R: 47, H: 31, exp: 1.32, craterR: 7.5, craterDepth: 4.5 };
export const EMERALD_BLUFF = { c: [-60, 46.5] };
export const ISLAND_HILLS = [
  { id: "frosty", c: FROSTY_PEAK.c, rx: 42, rz: 38, h: 15, flat: 0, warp: 0.08 },
  { id: "frosty-top", c: [-62.5, -66], rx: 16, rz: 14, h: 6.5, flat: 0.08, warp: 0.05, add: true },
  { id: "frosty-shoulder", c: [-82, -40], rx: 18, rz: 22, h: 4, flat: 0, warp: 0.1 },
  { id: "school", c: [0, -63], rx: 30, rz: 24, h: 5, flat: 0.32, warp: 0.06 },
  { id: "bluff", c: EMERALD_BLUFF.c, rx: 13, rz: 12, h: 7.5, flat: 0.5, warp: 0.05 },
  { id: "headland", c: [83, 5], rx: 11, rz: 19, h: 3.6, flat: 0.35, warp: 0.06 },
  { id: "islet", c: [114, 4], rx: 8, rz: 8, h: 4.6, flat: 0.4, warp: 0.05 },
  { id: "meadow-rise", c: [-58, 22], rx: 22, rz: 16, h: 1.6, flat: 0.1, warp: 0.1 },
  { id: "east-knoll", c: [48, 30], rx: 20, rz: 16, h: 2.2, flat: 0.1, warp: 0.12 },
  { id: "west-knoll", c: [-36, 30], rx: 12, rz: 11, h: 1.6, flat: 0.1, warp: 0.12 },
];

// The LAGOON — a shallow (wadeable) inlet of the sea, joined to it by a
// sandy channel to the south-west. Water level = sea level.
export const LAGOON = { c: [-48.5, 62.5], rx: 14.5, rz: 10.5, mouth: { a: [-55, 69.5], b: [-66, 86], hw: 4.2 } };
export const LAGOON_BED = -0.52;
// EMERALD FALLS: pours from the bluff's lip into the lagoon's north-west.
export const EMERALD_FALLS = { lip: [-55.6, 51.6], foot: [-52.8, 55.0], width: 3.2 };

// ---------------------------------------------------------------------------
// LEVEL PADS — superellipse pads (c, rx, rz, power p) the terrain is
// levelled to; `level` pins a height, else it's the mean ground under it.
// ---------------------------------------------------------------------------
export const ISLAND_PADS = [
  { id: "arrival", c: [0, 76], rx: 25, rz: 11.5, p: 2.6 },
  { id: "plaza", c: PLAZA.center, rx: 19, rz: 19, p: 2 },
  { id: "school", c: [0, -57], rx: 15, rz: 12.5, p: 2.4 },
  { id: "pip", c: PIP_SPOT.position, rx: 8.5, rz: 8, p: 2 },
  { id: "fern", c: FERN_SPOT.position, rx: 8.5, rz: 8, p: 2 },
  { id: "igloo", c: [-46.5, -45.5], rx: 9, rz: 8.5, p: 2 },
  { id: "terrace", c: [46.5, -41], rx: 9.5, rz: 8.5, p: 2, level: 9.5 },
  { id: "farm", c: [-75, 2.5], rx: 11, rz: 9.5, p: 2.4 },
  { id: "jungle", c: [-32, 48], rx: 7, rz: 6, p: 2 },
  { id: "headland", c: [87.5, 4.5], rx: 6, rz: 6.5, p: 2 },
  { id: "islet", c: [112.5, 5], rx: 6.5, rz: 7, p: 2 },
  { id: "summit", c: FROSTY_PEAK.summit, rx: 5, rz: 4.5, p: 2 },
  { id: "cove", c: [50, 63], rx: 8, rz: 5.5, p: 2 },
];

// ---------------------------------------------------------------------------
// PATHS — paved Main Street + sandy/cobbled paths, graded (≤ 0.28) like the
// farm's tracks. hw = half width; `kind` styles the ribbon.
// ---------------------------------------------------------------------------
export const ISLAND_PATH_CTRL = [
  // Main Street: the green → through the arch → the plaza's south stairs.
  { id: "main-street", hw: 2.9, kind: "cobble", ctrl: [[0, 85], [0, 74], [0, 62], [0, 48], [0, 36], [0, 28]] },
  // The plaza's north stairs → up Schoolhouse Hill to the school gate.
  { id: "school-road", hw: 2.3, kind: "cobble", ctrl: [[0, -8], [0.5, -18], [-1.5, -30], [0, -38], [0, -44.5]] },
  // The plaza's west stairs → the farm lane → Haybale Meadows.
  { id: "west-road", hw: 2.3, kind: "sand", ctrl: [[-18, 10], [-30, 8.5], [-42, 6.5], [-53, 4.5], [-64, 3]] },
  // West road → north to Pip's number line.
  { id: "pip-road", hw: 2.0, kind: "sand", ctrl: [[-30, 8.5], [-31, 0], [-30.5, -8], [-30, -14]] },
  // Pip → zig-zag up Frosty Peak's flank to Igloo Hollow.
  { id: "igloo-trail", hw: 1.9, kind: "snow", ctrl: [[-30, -30], [-27, -38], [-34, -43], [-38.5, -44.5]] },
  // Igloo Hollow → the switchback trail to Frosty Peak's summit lookout.
  { id: "summit-trail", hw: 1.6, kind: "snow", ctrl: SUMMIT_SPIRAL },
  // The plaza's east stairs → the east road → the headland lookout.
  { id: "east-road", hw: 2.3, kind: "sand", ctrl: [[18, 10], [31, 8.5], [44, 7], [58, 6], [71, 5], [81.5, 4.5]] },
  // East road → north to Fern's ash fields.
  { id: "fern-road", hw: 2.0, kind: "sand", ctrl: [[31, 8.5], [31.5, 0], [30.5, -7], [30, -13]] },
  // Fern → up through the ash to the Ember Terrace.
  { id: "ember-trail", hw: 1.9, kind: "ash", ctrl: [[37.5, -22.5], [47, -19.5], [54.5, -24.5], [50, -30], [46.5, -32.5]] },
  // The green → west through the palms to the lagoon ledge.
  { id: "lagoon-path", hw: 2.0, kind: "sand", ctrl: [[-12, 80], [-21, 76], [-28, 69], [-30, 61.5], [-31, 54.5]] },
  // The green → east along the shore to Sunny Cove.
  { id: "cove-path", hw: 2.0, kind: "sand", ctrl: [[12, 80], [22, 78.5], [32, 75], [40, 69.5], [43, 66]] },
  // A shortcut: the arch → over the east knoll → the east road.
  { id: "knoll-path", hw: 1.7, kind: "sand", ctrl: [[4.5, 61], [17, 58], [27, 48], [32.5, 34], [32, 20], [31.5, 12]] },
];

// ---------------------------------------------------------------------------
// AREAS — named places (near-labels + the map board + signposts).
// ---------------------------------------------------------------------------
export const ISLAND_AREAS = [
  { id: "green", name: "Harbour Green", icon: "⚓", c: [0, 78] },
  { id: "plaza", name: "Mission Plaza", icon: "🏛️", c: PLAZA.center },
  { id: "school", name: "Schoolhouse Hill", icon: "🔔", c: [0, -60] },
  { id: "frosty", name: "Frosty Peak", icon: "🏔️", c: FROSTY_PEAK.summit },
  { id: "igloo", name: "Igloo Hollow", icon: "❄️", c: [-46.5, -45.5] },
  { id: "pip", name: "Pip's Number Line", icon: "🌡️", c: PIP_SPOT.position },
  { id: "ember", name: "Ember Peak", icon: "🌋", c: EMBER_PEAK.c },
  { id: "terrace", name: "Ember Terrace", icon: "🔥", c: [46.5, -41] },
  { id: "fern", name: "Fern's Ash Fields", icon: "🦊", c: FERN_SPOT.position },
  { id: "meadows", name: "Haybale Meadows", icon: "🌾", c: [-74, 6] },
  { id: "lagoon", name: "Emerald Lagoon", icon: "🌴", c: LAGOON.c },
  { id: "lighthouse", name: "Alby's Lighthouse", icon: "🦉", c: ISLET.center },
  { id: "cove", name: "Sunny Cove", icon: "🏖️", c: [52, 68] },
];

// ---------------------------------------------------------------------------
// SET-PIECES (anchors the renderer + scatter + colliders read).
// ---------------------------------------------------------------------------
// The village: four colourful cottages along Main Street (fronts face the street).
export const COTTAGES = [
  { id: "c1", x: -13, z: 53, w: 7, d: 6, rotationY: Math.PI / 2, wall: "#f6d7a7", roof: "#d0563b", door: "#3f7cac" },
  { id: "c2", x: -13.5, z: 40, w: 6.5, d: 6, rotationY: Math.PI / 2, wall: "#bfe3f2", roof: "#3f6fa0", door: "#e0a53a" },
  { id: "c3", x: 13, z: 47, w: 7, d: 6, rotationY: -Math.PI / 2, wall: "#f4c6c6", roof: "#7a4b8c", door: "#2f8f6a" },
  { id: "c4", x: 14, z: 34, w: 6.5, d: 5.5, rotationY: -Math.PI / 2, wall: "#e6f0c4", roof: "#c9822e", door: "#b5443a" },
];
export const SCHOOLHOUSE = { x: 0, z: -63, w: 13, d: 8.5, rotationY: 0 }; // front faces south
export const SCHOOL_FENCE = { z: -50.5, x0: -13.5, x1: 13.5, gateHalf: 3.2 };
export const LIGHTHOUSE = { position: [115.5, 2], radius: 2.6, height: 15 };
export const ROPE_BRIDGE = { from: [90, 4.8], to: [107, 4.8], halfWidth: 1.25, sag: 0.6 };
export const FARM_BARN = { x: -90, z: -11, w: 11, d: 8.5, rotationY: 0.25 };
export const FARM_WINDMILL = { position: [-64, -12], height: 9 };
export const ISLAND_FIELDS = [
  { id: "wheat", kind: "wheat", c: [-66, 20], rx: 9, rz: 6 },
  { id: "sunflowers", kind: "sunflower", c: [-86, 14], rx: 6, rz: 5 },
];
export const ISLAND_HAY_BALES = [[-70, -4, 0.4], [-73.5, -6, 1.2], [-84, 6, 2.0], [-62, 10, 0.8], [-79, -6, 2.6]];
export const COVE_PIER = { from: [50, 66.8], to: [57, 80], halfWidth: 1.3, deckY: 0.95 };
export const BEACH_HUTS = [[38, 61, 0.5], [44.5, 58.5, 0.35], [58.5, 59, -0.2]];
export const ROWBOATS = [[61, 74, 0.6], [44, 78, -0.4], [-9, 104, 0.3]];
export const FERN_ASH = { c: [38, -30], rx: 22, rz: 16 }; // the ash fields (ground tint + pebbles)
export const SNOWLINE = { base: 13, northBias: 4 }; // snow covers the ground above ~this height

// Street lamps (Main Street, the green, the plaza's corners) + plaza benches.
export const LAMP_POSTS = [
  ...[33, 42, 51].flatMap((z) => [[-4.7, z], [4.7, z]]),
  [-6.2, 64.5], [6.2, 64.5], [-7, 86.5], [7, 86.5],
  [-8, 2], [8, 2], [-8, 18], [8, 18],
  [-3.4, -14], [3.4, -26], [-3.6, -40],
];
export const PLAZA_BENCHES = [[-7, 19.2, 0], [7, 19.2, 0], [-7, 0.8, Math.PI], [7, 0.8, Math.PI]];

// Wooden finger-posts at the junctions: arrows name a place + point at a
// spot a little way down the path that leads there.
export const ISLAND_SIGNPOSTS = [
  { id: "green", at: [-4.6, 60.5], arrows: [["Mission Plaza", [0, 44]], ["Emerald Lagoon", [-22, 75]], ["Sunny Cove", [22, 78]]] },
  { id: "west", at: [-27, 13.5], arrows: [["Haybale Meadows", [-44, 6]], ["Pip & Frosty Peak", [-31, -2]], ["Mission Plaza", [-20, 10]]] },
  { id: "east", at: [27, 13.5], arrows: [["Alby's Lighthouse", [44, 7]], ["Fern & Ember Peak", [31, -2]], ["Mission Plaza", [20, 10]]] },
  { id: "school", at: [4.6, -18], arrows: [["Schoolhouse Hill", [0, -30]], ["Mission Plaza", [0, -8]]] },
];

// Open grassy spots for the random treasure chest (clear of every gate,
// path, building and the water — checked by IL checks).
export const ISLAND_CHEST_SPOTS = [[-22, 38], [24, 46], [-46, -14], [58, -12], [-90, 26], [70, 34], [16, -38], [-16, -36]];

// Where the ambient critters roam.
export const CRAB_BEACHES = [[0, 92, 14], [54, 72, 10], [-62, 82, 9], [-100, 10, 10]];
export const SEAGULL_FLOCKS = [[0, 60], [60, 40], [-50, 40], [20, -40]];
