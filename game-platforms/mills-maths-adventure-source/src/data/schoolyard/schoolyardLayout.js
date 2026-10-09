/**
 * RETRIEVAL PRACTICE PLAYGROUND — LAYOUT (rebuilt 2026-10-09). The single
 * source of truth for the second region: a big hillside high school on the
 * Coffs Coast, inspired by Coffs Harbour High (Jeff's aerial + photos): red-
 * brick blocks under terracotta tile roofs, linked by STAIRS and open
 * concrete CORRIDORS on several levels, the big red-roofed SCHOOL HALL, a fig
 * quad, a garden courtyard, the oval, courts under a COLA, the ag plot, and
 * the harbour, Jetty Beach and Muttonbird Island out past the town. Terrain,
 * structures, colliders, props, the renderer and the checks all read this.
 *
 * Frame: x = east, z = south (three.js), metres. The site SLOPES DOWN toward
 * the SEA in the south (+z): you arrive at the front gate in the south,
 * looking NORTH up the hill at the school; turn round and the ocean is behind
 * you. (Real-world mapping, rotated: game north = real west / Edinburgh St,
 * game south = real east / Camperdown St + the harbour, game east = real
 * north / Harbour Drive + town, game west = real south / Beacon Hill.)
 *
 * LEVELS — the school steps up the hill in 3 m storeys, and the storeys line
 * up with the terraces, so a building's upper corridor meets the next
 * terrace up:
 *   L0 = 0   the front lawns + arrival plaza, the oval, the car park
 *   L1 = 3   the FIG QUAD, the canteen, the hall floor, the courts + COLA
 *   L2 = 6   the GARDEN COURTYARD (ground floor of Blocks A + B)
 *   L3 = 9   the UPPER TERRACE (Block A's 1st floor), ag plot + TAS
 *   L4 = 12  Block A + B's top corridors (the library + the science labs)
 *   …and the bush track climbs the hill behind to the SKY PIER (~21.5 m).
 */
export const LV = { L0: 0, L1: 3, L2: 6, L3: 9, L4: 12 };
export const STOREY = 3;
/** A thin deck's thickness (corridors, landings, bridges). */
export const DECK_T = 0.24;
/** Corridor width (the open concrete walkways). */
export const CORRIDOR_W = 2.8;
/** The sea, far below the town (the school sits on the hill above it). */
export const SEA_Y = -14;

export const SCHOOLYARD_REGION_NAME = "Retrieval Practice Playground";
export const SCHOOL_NAME = "Coffs Harbour High School";

// The fenced campus (the walkable limit). Snowball Sums / Fraction Farm are
// 290 × 258; the school is 280 × 255.
export const SCHOOL_FENCE = { xMin: -140, xMax: 140, zMin: -130, zMax: 125 };
export const SCHOOLYARD_BOUNDS = {
  shape: "rect",
  width: SCHOOL_FENCE.xMax - SCHOOL_FENCE.xMin,
  height: SCHOOL_FENCE.zMax - SCHOOL_FENCE.zMin,
  center: [(SCHOOL_FENCE.xMin + SCHOOL_FENCE.xMax) / 2, (SCHOOL_FENCE.zMin + SCHOOL_FENCE.zMax) / 2],
};

// ---------------------------------------------------------------------------
// ARRIVAL — through the front gate off Camperdown St, on the arrival plaza.
// ---------------------------------------------------------------------------
export const SCHOOLYARD_SPAWN = { x: 14, z: 112 };
export const SCHOOL_FRONT_GATE = { position: [14, 125], width: 12 };
/** The gate home: just behind-right of the arrival (clear of the camera). */
export const SCHOOLYARD_RETURN_PORTAL = [27, 117];
export const SCHOOLYARD_RETURN_PORTAL_YAW = -2.5;
/** Mills greets arrivals on the plaza (the old welcome-sign interactable). */
export const SCHOOLYARD_WELCOME = { position: [5, 103], text: "Welcome to the CHHS Maths Arena!" };
/** The big painted campus map board beside the plaza. */
export const SCHOOL_MAP_BOARD = { position: [24, 99], rotationY: -0.35 };
/** The school's name sign + garden bed out front. */
export const SCHOOL_SIGN = { position: [-6, 112], rotationY: 0.5 };

// ---------------------------------------------------------------------------
// PLATFORMS — the built terraces (SOLID: brick retaining walls, paved tops).
// `rails`: guard rails go on every edge that drops more than RAIL_DROP,
// except at stairs/ramps (worked out in schoolyardTerrain.js).
// ---------------------------------------------------------------------------
export const RAIL_DROP = 1.2;
export const SCHOOL_PLATFORMS = [
  {
    // L1 — the fig quad, the canteen, the hall floor, the courts + COLA, and
    // the west terrace by Block C's north-west end.
    id: "quad", y: LV.L1, surface: "asphalt",
    pts: [[-48, -8], [36, -8], [36, -58], [140, -58], [140, 48], [-6, 48], [-6, 51.2], [-11.24, 51.2],
      [-10.02, 49.98], [-12, 48], [-48, 12], [-59.98, 23.98], [-78, 23.98], [-78, 4], [-48, 4]],
  },
  {
    // L2 — the garden courtyard inside the L of Blocks A + B (with the arm
    // along Block B down to its south end).
    id: "court", y: LV.L2, surface: "pavers",
    pts: [[-64, -68], [28, -68], [28, -58], [36, -58], [36, -8], [-48, -8], [-48, 4], [-64, 4]],
  },
  {
    // L3 — the upper terrace behind Block A (staff car park, ag plot, TAS) and
    // its arm east of Block A, above the hall + the courts.
    id: "upper", y: LV.L3, surface: "grass",
    pts: [[-100, -100], [140, -100], [140, -58], [28, -58], [28, -82], [-100, -82]],
  },
];

// ---------------------------------------------------------------------------
// BUILDINGS — every block is a frame { c, yaw } with its long axis = local x
// and its open CORRIDOR (when it has one) along the local +z face. Floors are
// STOREY apart from y0. `towers` = switchback stair towers standing just
// outside the corridor (local x position, which way flight 1 runs, and the
// floors they link: [0, 1] = ground → 1st). `ends` = extra decks wrapping a
// building end (local x = ±hx) on the corridor floors.
// ---------------------------------------------------------------------------
export const SCHOOL_BUILDINGS = [
  {
    id: "blockA", name: "Block A — Library & Admin", c: [-25, -75], yaw: 0, hx: 53, hz: 7,
    y0: LV.L2, floors: 3, wall: "brick", roof: { type: "hip", mat: "tiles", pitch: 0.48, oh: 1.0 },
    corridor: { floors: [1, 2], x0: -39, x1: 53, ground: true },
    // East end: ground → 1st → 2nd (the deck runs on east onto the upper terrace).
    towers: [{ x: 41, dir: -1, floors: [0, 1, 2] }],
    // The library's reading balcony: a two-storey bay out over the courtyard
    // (Ms. Mahoney waits on the top one, clear of the corridor).
    bays: [{ x0: 4, x1: 18, depth: 3.6, floors: [1, 2] }],
    north: { doorsAt: LV.L3 }, // the 1st floor opens onto the upper terrace behind
  },
  {
    id: "blockB", name: "Block B — Science", c: [-71, -32], yaw: Math.PI / 2, hx: 36, hz: 7,
    y0: LV.L2, floors: 3, wall: "brick", roof: { type: "hip", mat: "tiles", pitch: 0.48, oh: 1.0 },
    // local +x = north here; the corridor faces east into the courtyard and
    // meets Block A's corridor in the inner corner (local x up to 36 + 2.8).
    corridor: { floors: [1, 2], x0: -36, x1: 36, ground: true },
    towers: [{ x: -32, dir: 1, floors: [0, 1, 2] }],
    // The top floor wraps round the south end: the science lookout balcony
    // (Ms. Ewings + her telescope, looking out to sea).
    ends: [{ side: -1, floors: [2] }],
  },
  {
    id: "blockC", name: "Block C — English & HSIE", c: [-33.96, 33.96], yaw: -Math.PI / 4, hx: 25.456, hz: 5.6,
    // Split-level: the ground floor opens onto the oval lawns (L0) on the
    // south-west; the 1st floor is the quad (L1) on the north-east.
    y0: LV.L0, floors: 2, wall: "brick", roof: { type: "hip", mat: "tiles", pitch: 0.5, oh: 0.9 },
    corridor: { floors: [1], x0: -25.456, x1: 25.456, ground: true },
    ends: [{ side: 1, floors: [1] }], // the SE end balcony back onto the quad
    // A broad flight from the balcony straight down to the oval lawn.
    stairs: [{ x: -4, floors: [0, 1], width: 3.2 }],
  },
  {
    id: "art", name: "Art & Music", c: [9, 55], yaw: 0, hx: 15, hz: 7,
    // Split-level too: the mural faces the arrival plaza (L0); the quad
    // (L1) meets its upper floor at the back.
    y0: LV.L0, floors: 2, wall: "brick2", roof: { type: "flat", mat: "steel" }, mural: "+z",
  },
  {
    id: "hall", name: "The School Hall", c: [57, -35], yaw: 0, hx: 21, hz: 23,
    y0: LV.L1, floors: 1, wallH: 10, wall: "brick", roof: { type: "gable", mat: "redSteel", pitch: 0.36, oh: 0.9, ridge: "z", skylights: true },
    hall: true,
  },
  {
    id: "canteen", name: "The Canteen", c: [53, 29], yaw: 0, hx: 11, hz: 7,
    y0: LV.L1, floors: 1, wallH: 3.4, wall: "brick", roof: { type: "skillion", mat: "creamSteel", fall: "+x", oh: 1.6 },
    servery: "-x",
  },
  {
    id: "office", name: "Front Office", c: [56, 71], yaw: 0, hx: 16, hz: 7,
    y0: LV.L0, floors: 1, wallH: 3.6, wall: "brick", roof: { type: "hip", mat: "tiles", pitch: 0.5, oh: 1.1 },
    entry: "-x",
  },
  {
    id: "tas", name: "TAS Workshops", c: [111, -91], yaw: 0, hx: 19, hz: 7,
    y0: LV.L3, floors: 1, wallH: 4.6, wall: "brick2", roof: { type: "skillion", mat: "greySteel", fall: "-z", oh: 0.8 },
    rollerDoors: "+z",
  },
  {
    id: "shed", name: "Sports Shed", c: [-126, 44], yaw: 0, hx: 7, hz: 4,
    y0: LV.L0, floors: 1, wallH: 3.2, wall: "brick2", roof: { type: "skillion", mat: "greenSteel", fall: "-z", oh: 0.7 },
    rollerDoors: "+z",
  },
];
export const SCHOOL_BUILDING = Object.fromEntries(SCHOOL_BUILDINGS.map((b) => [b.id, b]));

/** The hall's front doors (south wall, onto the quad) + the stage inside. */
export const HALL = {
  doorX: [53, 61], // the doorway's x range in the south wall (z = −12)
  doorZ: -12,
  wallT: 0.45,
  stage: { x: [40, 74], z: [-57.55, -48.5], h: 1.2 },
  porch: { x: [50, 64], z: [-12, -5.5], roofY: 3 + 4.4 },
};

/** The Head Teacher's padlocked hall doors — present while the 8 keys aren't all earned. */
export const SCHOOLYARD_BOSS_ID = "kellahan";
export const SCHOOLYARD_GATE = { x: [53, 61], z: -11.4, y: LV.L1, height: 3.4 };

// ---------------------------------------------------------------------------
// FREE-STANDING STAIRS + RAMPS (solid). `a` = the bottom edge's centre, `dir`
// the uphill direction, `w` the width; steps carry `rise` + `tread`.
// ---------------------------------------------------------------------------
export const SCHOOL_FLIGHTS = [
  // The main front stairs: arrival plaza (L0) → the quad (L1).
  { id: "front-stairs", a: [32, 58.2], dir: [0, -1], w: 10, n: 10, tread: 1.02, rise: 0.3, y0: LV.L0, cheeks: true },
  // The courtyard stairs (photo: tactile strips + rails): quad → courtyard.
  { id: "court-stairs", a: [-14, 2.3], dir: [0, -1], w: 7, n: 10, tread: 1.03, rise: 0.3, y0: LV.L1, cheeks: true, tactile: true },
  // Courtyard arm → the west terrace (L2 → L1), beside Block B's south end.
  { id: "arm-stairs", a: [-53, 12.2], dir: [0, -1], w: 4.4, n: 10, tread: 0.82, rise: 0.3, y0: LV.L1, cheeks: true, tactile: true },
  // Courtyard → the upper terrace's arm (L2 → L3), in the NE corner.
  { id: "corner-stairs", a: [32, -49.6], dir: [0, -1], w: 5.6, n: 10, tread: 0.84, rise: 0.3, y0: LV.L2, cheeks: true, tactile: true },
  // The grand stair from the courts up the bank to the ag plot (L1 → L3).
  { id: "courts-stairs-1", a: [82, -33.4], dir: [0, -1], w: 5.2, n: 10, tread: 1.1, rise: 0.3, y0: LV.L1, cheeks: true },
  { id: "courts-stairs-2", a: [82, -47], dir: [0, -1], w: 5.2, n: 10, tread: 1.1, rise: 0.3, y0: LV.L1 + 3, cheeks: true },
  // The art block's side stair (laneway L0 → the quad's south-west ledge).
  { id: "lane-stairs", a: [-8, 61], dir: [0, -1], w: 3.4, n: 10, tread: 0.98, rise: 0.3, y0: LV.L0, cheeks: true, tactile: true },
  // Hall stage steps (both front corners).
  { id: "stage-steps-w", a: [43.5, -46.1], dir: [0, -1], w: 3.2, n: 4, tread: 0.6, rise: 0.3, y0: LV.L1 },
  { id: "stage-steps-e", a: [70.5, -46.1], dir: [0, -1], w: 3.2, n: 4, tread: 0.6, rise: 0.3, y0: LV.L1 },
];
/** Landings between flights (solid, at a level). */
export const SCHOOL_LANDINGS = [
  { id: "courts-landing", c: [82, -45.7], yaw: 0, hx: 2.6, hz: 1.3, y: LV.L1 + 3 },
];
/** Ramps (photo: the long zig-zag access ramp with galvanised rails). */
export const SCHOOL_RAMPS = [
  // Arrival plaza → the quad, along the quad's south retaining wall.
  // (two runs: the outer one climbs from the plaza, turns, and the inner one
  // runs back up alongside the wall, flush with the quad at its top end).
  { id: "front-ramp-1", a: [46, 52.0], b: [70, 52.0], w: 2.4, y0: LV.L0, y1: 1.5 },
  { id: "front-ramp-2", a: [70, 49.2], b: [46, 49.2], w: 2.4, y0: 1.5, y1: LV.L1, flushEnd: true },
  // Quad → courtyard, east of the courtyard stairs (the same zig-zag).
  { id: "court-ramp-1", a: [4, -4.0], b: [26, -4.0], w: 2.4, y0: LV.L1, y1: 4.5 },
  { id: "court-ramp-2", a: [26, -6.8], b: [4, -6.8], w: 2.4, y0: 4.5, y1: LV.L2, flushEnd: true },
];
/** Ramp landings (level, solid). */
export const SCHOOL_RAMP_LANDINGS = [
  { id: "front-ramp-turn", c: [71.6, 50.6], yaw: 0, hx: 1.6, hz: 2.6, y: 1.5 },
  { id: "court-ramp-turn", c: [27.6, -5.4], yaw: 0, hx: 1.6, hz: 2.6, y: 4.5 },
];

/**
 * The SKY PIER — a cantilevered steel lookout at the top of the bush hill,
 * behind the TAS block, aimed down the hill at the HARBOUR: its sight line
 * runs east of the hall, over the COLA, the courts + the front car park
 * (all low), to the jetty, the breakwall and Muttonbird Island.
 */
export const SKY_PIER = { from: [67, -125], to: [73.5, -112], halfWidth: 1.6, y: 21.6, padY: 21.45 };

// ---------------------------------------------------------------------------
// THE NINE STAFF — the same nine (ids, names, skills, Coffs Coast lines) as
// ever, each now in a themed corner of the big school. `area` names the spot
// (its label shows as you approach). NPC missions/chains/dialogue/encounters
// are GENERATED from this list (missions.js, npcQuestChains.js, mainQuest.js,
// encounters.js). Keys: the eight non-boss staff; the boss waits on the hall
// stage behind the padlocked doors.
// ---------------------------------------------------------------------------
export const SCHOOLYARD_CHARACTERS = [
  { id: "pearce", name: "Mr. Pearce", position: [39.2, 29], color: "#e07a5f", skill: "addSubTo20", area: "canteen",
    flavor: "Ever ridden the toboggan at the Big Banana? What a blast!",
    complete: ["Nice one — that's the spirit! Here's your key.", "One down — go find the others."] },
  { id: "mahoney", name: "Ms. Mahoney", position: [-14, -63.3], color: "#3d9970", skill: "multFacts", area: "library",
    flavor: "Nothing beats a morning swim down at Jetty Beach — you can see it from up here!",
    complete: ["Great counting — take a key!", "Off you go — enjoy the sea breeze."] },
  { id: "ewings", name: "Ms. Ewings", position: [-70, 5.5], color: "#5b8def", skill: "divFacts", area: "science",
    flavor: "The breakwall walk to Muttonbird Island is my favourite — whales in season! Have a look through the telescope.",
    complete: ["Lovely sharing those out — here's a key!", "Say hi to the shearwaters for me."] },
  { id: "dawson", name: "Mr. Dawson", position: [72.2, -114.6], color: "#9b5de5", skill: "multFacts", area: "skypier",
    flavor: "The view from Sealy Lookout's Forest Sky Pier is unreal — this one's not bad either!",
    complete: ["Top work — that's a key earned!", "Take a moment and enjoy the view."] },
  { id: "heywood", name: "Mr. Heywood", position: [-118, 51], color: "#2a9d8f", skill: "divFacts", area: "oval",
    flavor: "Went diving out at the Solitary Islands on the weekend.",
    complete: ["Sharp division — take your key!", "Dive back in any time."] },
  { id: "morgan", name: "Mr. Morgan", position: [62, -91], color: "#e76f51", skill: "addSubTo20", area: "agplot",
    flavor: "The banana plantations up here go on for miles — we grow our own in the ag plot!",
    complete: ["Great work — here's a key!", "Keep it up."] },
  { id: "bacon", name: "Ms. Bacon", position: [-2.5, 67], color: "#457b9d", skill: "multFacts", area: "mural",
    flavor: "I love watching the boats come in at the marina — that's why I painted them on the mural.",
    complete: ["Terrific times tables — a key for you!", "Smooth sailing from here."] },
  { id: "brookes", name: "Ms. Brookes", position: [-24, -40], color: "#8ac926", skill: "divFacts", area: "courtyard",
    flavor: "The rainforest tracks at Bruxner Park are so peaceful — our courtyard garden is my little piece of it.",
    complete: ["Beautiful division — take your key!", "Now… the Head Teacher is waiting in the hall."] },
  // …and the BOSS: the Head Teacher, on the hall stage behind the padlocked doors.
  { id: "kellahan", name: "Mrs. Kellahan", position: [57, -52.5], color: "#f4772e", skill: "addSubTo20", area: "hall",
    boss: true, scale: 1.35,
    flavor: "You've earned every key — ready for the Head Teacher's challenge?",
    complete: ["🏆 You did it — you've completed the whole Schoolyard!",
      "What a champion. Well done, from all the staff on the Coffs Coast!"] },
];

/** Back-compat names. */
export const SCHOOLYARD_WELCOME_SIGN = { position: SCHOOLYARD_WELCOME.position, rotationY: 0, text: SCHOOLYARD_WELCOME.text };

// ---------------------------------------------------------------------------
// AREAS — named corners of the school (labels show as you approach).
// ---------------------------------------------------------------------------
export const SCHOOL_AREAS = [
  { id: "front", name: "Front Gate", icon: "🏫", c: [14, 96], y: LV.L0 + 4.2 },
  { id: "mural", name: "The Mural Wall", icon: "🎨", c: [4, 70], y: LV.L0 + 4.4 },
  { id: "quad", name: "The Fig Quad", icon: "🌳", c: [-8, 22], y: LV.L1 + 4.6 },
  { id: "canteen", name: "The Canteen", icon: "🥪", c: [44, 29], y: LV.L1 + 4.2 },
  { id: "courtyard", name: "Garden Courtyard", icon: "🌿", c: [-14, -38], y: LV.L2 + 4.4 },
  { id: "library", name: "Library Balcony (top floor)", icon: "📚", c: [-14, -63.3], y: LV.L4 + 3.0 },
  { id: "science", name: "Science Lookout (top floor)", icon: "🔭", c: [-70, 5.5], y: LV.L4 + 3.0 },
  { id: "hall", name: "The School Hall", icon: "🎭", c: [57, -2], y: LV.L1 + 6.4 },
  { id: "courts", name: "The Courts", icon: "🏀", c: [109, 18], y: LV.L1 + 4.4 },
  { id: "cola", name: "The COLA", icon: "⛱️", c: [109, -34], y: LV.L1 + 4.4 },
  { id: "agplot", name: "The Ag Plot", icon: "🍌", c: [62, -91], y: LV.L3 + 4.4 },
  { id: "tas", name: "TAS Workshops", icon: "🔧", c: [111, -78], y: LV.L3 + 4.0 },
  { id: "oval", name: "The Oval", icon: "🏉", c: [-92, 82], y: LV.L0 + 4.6 },
  { id: "bush", name: "Bush Track", icon: "🦘", c: [-70, -104], y: 13 },
  { id: "skypier", name: "The Sky Pier", icon: "🌅", c: [71, -117], y: SKY_PIER.y + 3.2 },
  { id: "blockc", name: "Block C", icon: "📖", c: [-46, 44], y: LV.L0 + 4.0 },
];

// ---------------------------------------------------------------------------
// GROUND — the lawns, the oval + the bush hill are TERRAIN (a 1 m grid like
// the other worlds). Terrain pads (level) + graded paths.
// ---------------------------------------------------------------------------
export const OVAL = { c: [-92, 83], rx: 39, rz: 31 };
export const SCHOOL_PADS = [
  { id: "front", c: [56, 90], rx: 90, rz: 40, p: 8, level: LV.L0 },
  { id: "lane", c: [-16, 70], rx: 14, rz: 22, p: 4, level: LV.L0 },
  { id: "oval", c: OVAL.c, rx: OVAL.rx + 5, rz: OVAL.rz + 5, p: 2.2, level: LV.L0 },
  { id: "oval-apron", c: [-78, 50], rx: 30, rz: 14, p: 3, level: LV.L0 },
  { id: "west-top", c: [-120, -90], rx: 20, rz: 12, p: 4, level: LV.L3 },
  { id: "pier-top", c: [66, -128.5], rx: 10, rz: 5.5, p: 3, level: 21.45 },
];
/** Graded walking tracks on the terrain (bush track, lawns, round the oval). */
export const SCHOOL_PATH_CTRL = [
  // The bush track: from the upper terrace's west end, switchbacking up the
  // hill to the Sky Pier.
  { id: "bush-track", hw: 1.5, kind: "dirt", ctrl: [
    [-96, -101.5], [-104, -106], [-90, -110.5], [-56, -112.5], [-28, -114.8], [-40, -119.5],
    [-62, -121.5], [-50, -125.6], [-26, -127.4], [-6, -128.7], [20, -128.8], [44, -128.8], [61, -128.7],
  ] },
  // West lawn: from the upper terrace's west end down to the oval.
  { id: "west-path", hw: 1.4, kind: "gravel", ctrl: [
    [-102, -90], [-114, -70], [-112, -40], [-106, -14], [-108, 12], [-110, 34], [-104, 48],
  ] },
  // Round the oval (a gravel walking track).
  { id: "oval-loop", hw: 1.3, kind: "gravel", loop: true, ctrl: (() => {
    const pts = [];
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      pts.push([OVAL.c[0] + Math.cos(a) * (OVAL.rx + 3.4), OVAL.c[1] + Math.sin(a) * (OVAL.rz + 3.4)]);
    }
    pts.push(pts[0]);
    return pts;
  })() },
  // Laneway: arrival plaza → the oval, past Block C's south-east end.
  { id: "lane-path", hw: 1.6, kind: "pavers", ctrl: [[2, 92], [-12, 78], [-24, 66], [-40, 58], [-56, 54]] },
];

// ---------------------------------------------------------------------------
// LANDMARKS + FURNITURE positions (all on the ground they stand on).
// ---------------------------------------------------------------------------
/** The three big figs in brick planters on the quad (the photos). */
export const QUAD_FIGS = [
  { c: [-30, 16], r: 5.6, h: 18, planter: { hx: 5.4, hz: 4.2, yaw: 0.25 } },
  { c: [-4, 30], r: 6.2, h: 19, planter: { hx: 6.0, hz: 4.4, yaw: -0.15 } },
  { c: [18, 14], r: 5.2, h: 17, planter: { hx: 4.8, hz: 4.0, yaw: 0.4 } },
];
/** Courtyard garden beds (raised brick planters with cordylines + ferns). */
export const COURT_BEDS = [
  { c: [-38, -48], hx: 6, hz: 3.4, yaw: 0.1 },
  { c: [-6, -54], hx: 7, hz: 3.0, yaw: -0.08 },
  { c: [14, -40], hx: 5, hz: 3.4, yaw: 0.3 },
  { c: [-40, -24], hx: 5.2, hz: 2.8, yaw: -0.25 },
  { c: [6, -20], hx: 6.4, hz: 2.6, yaw: 0.05 },
];
/** The courtyard's pond + bubbler fountain. */
export const COURT_POND = { c: [-12, -28], r: 3.2 };
/** Picnic tables on the quad + by the canteen (centre, yaw). */
export const PICNIC_TABLES = [
  [24, 26, 0], [24, 33, 0], [30, 22, 0.1], [30, 36, -0.1], [-46, 0, 0.4], [-20, 0, 0.2],
  [100, 40, 0], [92, 40, 0], [-16, 38, 0], [-6, 44, 0.2],
];
/** The basketball courts (two, side by side, under the open sky). */
export const COURTS = [
  { c: [96, 18], hx: 7.5, hz: 14, yaw: 0 },
  { c: [122, 18], hx: 7.5, hz: 14, yaw: 0 },
];
export const COLA = { c: [109, -34], hx: 22.5, hz: 19.5, roofY: LV.L1 + 6.6 };
/** The ag plot (garden beds, banana grove, chook pen, greenhouse). */
export const AG_PLOT = { c: [62, -92.5], hx: 20, hz: 6 };
export const GREENHOUSE = { c: [33, -92.5], hx: 3.8, hz: 5, yaw: 0 };
export const CHOOK_PEN = { c: [86, -92.5], hx: 3.6, hz: 5 };
/** Staff car park (upper terrace, behind Block A) + the front car park. */
export const STAFF_CARPARK = { c: [-60, -92], hx: 34, hz: 6 };
export const FRONT_CARPARK = { c: [108, 89], hx: 24, hz: 25 };
export const BUS_BAY = { c: [76, 120], hx: 30, hz: 3.2 };
/** Rugby league posts + the cricket pitch on the oval. */
export const OVAL_POSTS = [[-127.5, 83], [-56.5, 83]];
/** Ewings' telescope (science top floor, looking out to Muttonbird Island). */
export const TELESCOPE = { position: [-75.6, 5.9], y: LV.L4, aim: [352, 450] };
/** Signposts at the junctions: [x, z, y, [[label, [tx, tz]], …]]. */
export const SCHOOL_SIGNPOSTS = [
  { id: "front", p: [20, 88], arrows: [["Front Stairs", [32, 50]], ["The Oval", [-92, 83]], ["Front Office", [40, 71]]] },
  { id: "quad", p: [10, 40], arrows: [["Canteen", [53, 29]], ["Courtyard", [-14, -10]], ["School Hall", [57, -10]], ["Courts", [96, 18]]] },
  { id: "court", p: [-30, -12], arrows: [["Library (top floor)", [-14, -66]], ["Science (top floor)", [-62, 0]], ["Fig Quad", [-8, 20]]] },
  { id: "upper", p: [40, -76], arrows: [["Ag Plot", [62, -91]], ["TAS", [111, -91]], ["Bush Track", [-96, -101]]] },
  { id: "bush", p: [-92, -96], arrows: [["Sky Pier", [71, -117]], ["Oval", [-104, 48]]] },
  { id: "oval", p: [-66, 52], arrows: [["Block C", [-34, 34]], ["Front Gate", [14, 112]], ["West Path", [-108, 12]]] },
];
/** Treasure-chest spots (one chosen per load). */
export const SCHOOL_CHEST_SPOTS = [
  [-130, 70], [16, -92], [124, -96], [126, 44], [-126, -60], [70, 112],
];

// ---------------------------------------------------------------------------
// THE BACKDROP (outside the fence — never walkable): the streets + houses,
// the town on the slope down to Jetty Beach, the jetty, the harbour with its
// breakwalls out to Muttonbird Island, Beacon Hill, the hinterland range.
// ---------------------------------------------------------------------------
export const BACKDROP = {
  streets: [
    { id: "camperdown", a: [-300, 137], b: [300, 137], hw: 5.5 },
    { id: "edinburgh", a: [-300, -142], b: [300, -142], hw: 5 },
    { id: "harbour-dr", a: [152, -300], b: [152, 220], hw: 6 },
    { id: "west-st", a: [-152, -300], b: [-152, 200], hw: 5 },
  ],
  // The town drops steeply to Jetty Beach, so the sea shows over the roofs
  // from the school's upper floors, the upper terrace + the Sky Pier.
  beachZ: 262,
  jetty: { from: [120, 248], to: [150, 410], halfWidth: 3.2, y: SEA_Y + 4.5 },
  breakwall: [[230, 280], [262, 330], [300, 382], [318, 412]],
  muttonbird: { c: [352, 450], rx: 58, rz: 38, h: 34 },
  southBreakwall: [[-40, 330], [40, 370], [120, 402]],
  marina: { c: [250, 310], hx: 30, hz: 18 },
};

// ---------------------------------------------------------------------------
// SURFACES — paving laid over the lawns + terraces (drawn just above them):
// the arrival plaza, the mural forecourt, the car parks, the courts, the
// COLA slab, the ag plot's beds… `y` = the level it lies on.
// ---------------------------------------------------------------------------
const rectPts = (c, hx, hz) => [[c[0] - hx, c[1] - hz], [c[0] + hx, c[1] - hz], [c[0] + hx, c[1] + hz], [c[0] - hx, c[1] + hz]];
export const SCHOOL_SURFACES = [
  // L0 — the front.
  { id: "plaza", kind: "pavers", y: LV.L0, pts: [[-8, 88], [40, 88], [40, 125], [-8, 125]] },
  { id: "forecourt", kind: "asphalt", y: LV.L0, pts: [[-8, 62], [26, 62], [26, 88], [-8, 88]], lines: "parking" },
  { id: "front-walk", kind: "concrete", y: LV.L0, pts: [[26, 58.2], [40, 58.2], [40, 88], [26, 88]] },
  { id: "ramp-apron", kind: "concrete", y: LV.L0, pts: [[40, 48], [46, 48], [46, 60], [40, 60]] },
  { id: "office-path", kind: "concrete", y: LV.L0, pts: [[40, 66], [46, 66], [46, 60], [40, 60]] },
  { id: "carpark", kind: "asphalt", y: LV.L0, pts: rectPts(FRONT_CARPARK.c, FRONT_CARPARK.hx, FRONT_CARPARK.hz), lines: "bays" },
  { id: "carpark-drive", kind: "asphalt", y: LV.L0, pts: [[106, 114], [122, 114], [122, 125], [106, 125]] },
  { id: "busbay", kind: "asphalt", y: LV.L0, pts: rectPts(BUS_BAY.c, BUS_BAY.hx, BUS_BAY.hz), lines: "bus" },
  { id: "shed-apron", kind: "concrete", y: LV.L0, pts: [[-134, 48], [-117, 48], [-117, 53], [-134, 53]] },
  // L1 — zones on the quad.
  ...COURTS.map((c, i) => ({ id: `court-${i}`, kind: "court", y: LV.L1, pts: rectPts(c.c, c.hx + 1.5, c.hz + 1.5), lines: "basketball", court: c })),
  { id: "cola-slab", kind: "concrete", y: LV.L1, pts: rectPts(COLA.c, COLA.hx, COLA.hz), lines: "handball" },
  { id: "hall-forecourt", kind: "concrete", y: LV.L1, pts: [[36, -12], [80, -12], [80, 2], [36, 2]] },
  { id: "canteen-pavers", kind: "pavers", y: LV.L1, pts: [[36, 16], [70, 16], [70, 42], [36, 42]] },
  // L3 — on the upper terrace (a lawn).
  { id: "staff-carpark", kind: "asphalt", y: LV.L3, pts: rectPts(STAFF_CARPARK.c, STAFF_CARPARK.hx, STAFF_CARPARK.hz), lines: "bays" },
  { id: "upper-walk", kind: "concrete", y: LV.L3, pts: [[-100, -86], [90, -86], [90, -82], [-100, -82]] },
  { id: "upper-arm", kind: "concrete", y: LV.L3, pts: [[28, -82], [40, -82], [40, -58], [28, -58]] },
  { id: "upper-cross", kind: "concrete", y: LV.L3, pts: [[78, -82], [88, -82], [88, -58], [78, -58]] },
  { id: "ag-soil", kind: "soil", y: LV.L3, pts: rectPts(AG_PLOT.c, AG_PLOT.hx, AG_PLOT.hz) },
  { id: "tas-apron", kind: "concrete", y: LV.L3, pts: [[90, -84], [132, -84], [132, -76], [90, -76]] },
];
