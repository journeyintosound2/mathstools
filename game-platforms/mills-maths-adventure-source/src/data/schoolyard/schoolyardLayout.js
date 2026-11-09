/**
 * RETRIEVAL PRACTICE PLAYGROUND — LAYOUT (redesigned 2026-11-09 from Jeff's
 * eleven walk-through videos + his annotated aerial of Coffs Harbour High).
 * The single source of truth for the second region. Terrain, structures,
 * colliders, props, the renderer, the map and the checks all read this.
 *
 * Frame: x = east, z = south (three.js), metres. The aerial is turned a
 * quarter: game EAST (+x) = real north (Jetty Lane), game SOUTH (+z) = real
 * east (Camperdown St, the harbour), game NORTH (−z) = real west (Edinburgh
 * St). You arrive from Camperdown St in the south, looking north at the
 * school hall's front doors.
 *
 * SCALE — deliberately BIGGER than the real school so it is easy to steer a
 * character round on a screen: plan positions are the aerial at ~1.35×,
 * storeys are 4.5 m (high ceilings), every open corridor is 4.6 m wide, stair
 * towers are 3 m wide with 3 m landings.
 *
 * The video spots (Jeff's numbers on the aerial):
 *   1  the FIG QUAD — figs, picnic sets, benches, grates, stairs down
 *   2  the CANTEEN (blue + yellow) under the hall's striped awning, brick
 *      planters, the ramp up to the raised seating deck
 *   3  the UNDERCROFT under B Block — concrete columns, brick piers, stairs up
 *   4  the TAS STAIRS (the rainbow TAS poster on the half landing) up to the
 *      first-floor balcony over Banksia Court
 *   5  the GLASS STAIRS — a glazed stair tower up to the top floor
 *   6  the TOP BALCONY — benches + desks along the top-floor corridor
 *   7  the FOOD TECH WALKWAY — off C Block's first floor, a ramp down along
 *      the Maths Block's brick end wall, then steps onto its balcony
 *   8  the A BLOCK COURTYARD — 1920s brick, cream verandahs on brick piers,
 *      painted squares, timber planter boxes, the pelican mural
 *   9  the MURAL LANE — the white verandah block, the BLUE WAVES mural, out
 *      onto the big yard with its trees
 *   10 the balconies round BANKSIA COURT, the steel railings at the end
 *   11 the MATHS BLOCK — TWO CLASSROOMS ON EVERY LEVEL (you can walk in),
 *      its open balcony looking out over the car park to the sea
 *
 * LEVELS — 4.5 m storeys:
 *   L0 = 0     the Camperdown St frontage (arrival plaza, front lawns, car park)
 *   LM = 3     the lower terrace by the Maths Block + the courts (one flight down)
 *   L1 = 4.5   the campus: quad, yard, courtyards, the hall floor, ground floors
 *   L2 = 9     first floors
 *   L3 = 13.5  top floors
 *   (the Maths Block steps down the hill: its floors are 3, 7.5 and 12)
 */
export const LV = { L0: 0, LM: 3, L1: 4.5, L2: 9, L3: 13.5 };
export const STOREY = 4.5;
/** A thin deck's thickness (corridors, landings, bridges). */
export const DECK_T = 0.3;
/** Corridor width (the open concrete walkways — wide on purpose). */
export const CORRIDOR_W = 4.6;
/** The sea, far below the town (the school sits on the hill above it). */
export const SEA_Y = -14;

export const SCHOOLYARD_REGION_NAME = "Retrieval Practice Playground";
export const SCHOOL_NAME = "Coffs Harbour High School";

// The fenced campus (the walkable limit).
export const SCHOOL_FENCE = { xMin: -140, xMax: 140, zMin: -130, zMax: 125 };
export const SCHOOLYARD_BOUNDS = {
  shape: "rect",
  width: SCHOOL_FENCE.xMax - SCHOOL_FENCE.xMin,
  height: SCHOOL_FENCE.zMax - SCHOOL_FENCE.zMin,
  center: [(SCHOOL_FENCE.xMin + SCHOOL_FENCE.xMax) / 2, (SCHOOL_FENCE.zMin + SCHOOL_FENCE.zMax) / 2],
};

// ---------------------------------------------------------------------------
// ARRIVAL — through the front gate off Camperdown St, onto the arrival plaza,
// looking north up the front stairs at the hall's padlocked doors.
// ---------------------------------------------------------------------------
export const SCHOOLYARD_SPAWN = { x: 13, z: 112 };
export const SCHOOL_FRONT_GATE = { position: [13, 125], width: 12 };
/** The gate home: just behind-right of the arrival (clear of the camera). */
export const SCHOOLYARD_RETURN_PORTAL = [27, 118];
export const SCHOOLYARD_RETURN_PORTAL_YAW = -2.5;
/** Mills greets arrivals on the plaza. */
export const SCHOOLYARD_WELCOME = { position: [4, 103], text: "Welcome to the CHHS Maths Arena!" };
/** The big painted campus map board beside the plaza. */
export const SCHOOL_MAP_BOARD = { position: [24, 100], rotationY: -0.35 };
/** The school's name sign + garden bed out front. */
export const SCHOOL_SIGN = { position: [-10, 113], rotationY: 0.5 };

// ---------------------------------------------------------------------------
// PLATFORMS — the built terraces (SOLID: brick retaining walls on the drops).
// ---------------------------------------------------------------------------
export const RAIL_DROP = 1.2;
export const SCHOOL_PLATFORMS = [
  {
    // L1 — the whole campus level (lawn by default; the paving is laid on
    // top as SURFACES). Its south edge steps out round the courtyard blocks.
    id: "campus", y: LV.L1, surface: "grass",
    pts: [[-104, -112], [104, -112], [104, 76], [-38.5, 76], [-38.5, 88], [-104, 88]],
  },
  {
    // LM — the lower terrace in front of the Maths Block (bike racks, the
    // steel balustrades above it) — one flight down from Banksia Court.
    id: "lower", y: LV.LM, surface: "asphalt",
    pts: [[-104, 88], [-38.5, 88], [-38.5, 116], [-104, 116]],
  },
  {
    // LM — the courts + their COLA, down the stairs off the quad's east edge.
    id: "courts", y: LV.LM, surface: "asphalt",
    pts: [[104, -112], [141, -112], [141, 60], [104, 60]],
  },
];

// ---------------------------------------------------------------------------
// BUILDINGS — every block is a frame { c, yaw } with its long axis = local x
// and its open CORRIDOR (when it has one) along the local +z face. Floors are
// STOREY apart from y0.
//   corridor   { floors (decks), x0, x1, ground (a ground-floor verandah) }
//   towers     switchback stair towers outside the corridor (glazed / tas)
//   rooms      { count } — a HOLLOW block you can walk into: `count`
//              classrooms per floor, a door each off the corridor
//   undercroft the ground floor is OPEN (columns + brick piers) — you walk
//              under the classrooms
//   verandahs  lean-to roofs on piers along a face (the 1920s blocks, the
//              hall's striped awning)
//   paint      painted walls (the canteen's blue + yellow)
//   murals     painted walls: { face, kind } (waves, pelican)
//   sign       a building sign over the corridor / a face
// ---------------------------------------------------------------------------
export const SCHOOL_BUILDINGS = [
  // — The courtyard complex round BANKSIA COURT (videos 3–7, 10, 11) —
  {
    id: "blockB", name: "B Block — TAS & Science", c: [-70.5, 37], yaw: 0, hx: 14.4, hz: 6,
    y0: LV.L1, floors: 3, wall: "brick", roof: { type: "hip", mat: "tiles", pitch: 0.45, oh: 1.0 },
    corridor: { floors: [1, 2], x0: -14.4, x1: 14.4, ground: false },
    undercroft: true,
    // The TAS stairs: from the undercroft up past the TAS poster to the 1st floor.
    towers: [{ x: -4, dir: 1, floors: [0, 1], tas: true }],
    murals: [{ face: "-z", kind: "pelican", floor: 1 }],
    sign: { text: "B BLOCK", face: "-z" },
  },
  {
    id: "blockN", name: "N Block — English & HSIE", c: [-45, 62], yaw: -Math.PI / 2, hx: 26, hz: 6.5,
    y0: LV.L1, floors: 3, wall: "brick", roof: { type: "hip", mat: "tiles", pitch: 0.45, oh: 1.0 },
    corridor: { floors: [1, 2], x0: -26, x1: 26, ground: true },
    // The GLASS STAIRS (video 5): ground → 1st → top, glazed all round.
    towers: [{ x: 8, dir: 1, floors: [0, 1, 2], glazed: true }],
    sign: { text: "N BLOCK", face: "+z" },
  },
  {
    id: "blockC", name: "C Block — Food Tech & Languages", c: [-96, 62], yaw: Math.PI / 2, hx: 26, hz: 6.5,
    y0: LV.L1, floors: 3, wall: "brick", roof: { type: "hip", mat: "tiles", pitch: 0.45, oh: 1.0 },
    corridor: { floors: [1, 2], x0: -26, x1: 26, ground: true },
    sign: { text: "FOOD TECH", face: "+z", floor: 1, at: -16 },
  },
  {
    id: "maths", name: "The Maths Block", c: [-70.5, 94], yaw: 0, hx: 14.4, hz: 6,
    // Steps down the hill: its floors are 3, 7.5 and 12 m.
    y0: LV.LM, floors: 3, wall: "brick2", roof: { type: "hip", mat: "tiles", pitch: 0.45, oh: 1.0 },
    corridor: { floors: [1, 2], x0: -14.4, x1: 14.4, ground: true, rail: "picket" },
    // TWO classrooms on every level (Jeff, video 11) — walk in.
    rooms: { count: 2 },
    towers: [{ x: 11.4, dir: -1, floors: [0, 1, 2] }],
    sign: { text: "MATHS", face: "+z", floor: 0, at: -2 },
  },
  // — The 1920s brick blocks + the white verandah block (videos 8, 9) —
  {
    id: "blockA", name: "A Block — 1920s", c: [-97, -27], yaw: Math.PI / 2, hx: 51, hz: 7,
    y0: LV.L1, floors: 3, wall: "brick", roof: { type: "hip", mat: "tiles", pitch: 0.5, oh: 0.9 },
    verandahs: [{ face: "+z", depth: 4, h: 4.2, piers: "brick", cream: true }],
    // The end wall at the mural lane: the BLUE WAVES mural (video 9).
    murals: [{ face: "+x", kind: "waves" }],
  },
  {
    id: "library", name: "D Block — Library", c: [-44, -11], yaw: 0, hx: 18, hz: 19,
    y0: LV.L1, floors: 2, wall: "brick", roof: { type: "hip", mat: "tiles", pitch: 0.5, oh: 1.0, skylight: true },
    verandahs: [{ face: "-x", depth: 4, h: 4.2, piers: "brick", cream: true }],
    sign: { text: "LIBRARY", face: "+x" },
  },
  {
    id: "blockW", name: "W Block — the White Building", c: [-12, -101], yaw: 0, hx: 46, hz: 7,
    y0: LV.L1, floors: 2, wall: "render", roof: { type: "hip", mat: "tiles", pitch: 0.5, oh: 0.9 },
    verandahs: [{ face: "+z", depth: 4.2, h: 4.3, piers: "post" }],
  },
  // — The hall, the canteen, the front office —
  {
    id: "hall", name: "The School Hall", c: [13, 42], yaw: 0, hx: 27, hz: 22,
    y0: LV.L1, floors: 1, wallH: 11, wall: "brick", roof: { type: "gable", mat: "redSteel", pitch: 0.36, oh: 0.9, ridge: "z", skylights: true },
    hall: true,
    // The striped awning down the hall's west side (the aerial + video 2).
    verandahs: [{ face: "-x", depth: 5, h: 4.4, piers: "post", stripes: true }],
  },
  {
    id: "canteen", name: "The Canteen", c: [-29, 20], yaw: 0, hx: 7, hz: 5.5,
    y0: LV.L1, floors: 1, wallH: 4.2, wall: "brick", roof: { type: "skillion", mat: "creamSteel", fall: "-x", oh: 1.6 },
    servery: "+x", paint: { base: "#2b5ea8", band: "#f2c94c" }, sign: { text: "CANTEEN", face: "+x" },
  },
  {
    id: "office", name: "Front Office", c: [80, 97], yaw: 0, hx: 14, hz: 7,
    y0: LV.L0, floors: 1, wallH: 3.8, wall: "brick", roof: { type: "hip", mat: "tiles", pitch: 0.5, oh: 1.1 },
    entry: "-x",
  },
  {
    id: "shed", name: "Sports Shed", c: [130, 54], yaw: 0, hx: 6, hz: 3.5,
    y0: LV.LM, floors: 1, wallH: 3.2, wall: "brick2", roof: { type: "skillion", mat: "greenSteel", fall: "-z", oh: 0.7 },
    rollerDoors: "-z",
  },
];
export const SCHOOL_BUILDING = Object.fromEntries(SCHOOL_BUILDINGS.map((b) => [b.id, b]));

/** The hall's front doors (south wall, onto the forecourt) + the stage inside. */
export const HALL = {
  doorX: [9, 17], // the doorway's x range in the south wall (z = 64)
  doorZ: 64,
  wallT: 0.45,
  stage: { x: [-13.55, 39.55], z: [20.45, 29.5], h: 1.2 },
  porch: { x: [4, 22], z: [64, 70], roofY: LV.L1 + 5.4 },
};

/** The Head Teacher's padlocked hall doors — present while the 16 keys aren't all earned. */
export const SCHOOLYARD_BOSS_ID = "kellahan";
export const SCHOOLYARD_GATE = { x: [9, 17], z: 64.6, y: LV.L1, height: 4.2 };

// ---------------------------------------------------------------------------
// FREE-STANDING STAIRS + RAMPS. `a` = the bottom edge's centre, `dir` the
// uphill direction, `w` the width; steps carry `rise` + `tread`. `thin`
// pieces hang in the air (you can walk under them).
// ---------------------------------------------------------------------------
export const SCHOOL_FLIGHTS = [
  // The main front stairs: arrival plaza (L0) → the hall forecourt (L1).
  { id: "front-stairs", a: [8, 82], dir: [0, -1], w: 12, n: 15, tread: 0.4, rise: 0.3, y0: LV.L0, cheeks: true, tactile: true },
  // Banksia Court → the lower terrace, either side of the Maths Block.
  { id: "court-stairs-c", a: [-87.2, 90.0], dir: [0, -1], w: 4.6, n: 5, tread: 0.4, rise: 0.3, y0: LV.LM, cheeks: true, tactile: true },
  { id: "court-stairs-n", a: [-53.8, 90.0], dir: [0, -1], w: 4.6, n: 5, tread: 0.4, rise: 0.3, y0: LV.LM, cheeks: true, tactile: true },
  // The lower terrace → the frontage (east + south).
  { id: "lower-stairs-e", a: [-34.5, 104], dir: [-1, 0], w: 5, n: 10, tread: 0.4, rise: 0.3, y0: LV.L0, cheeks: true, tactile: true },
  { id: "lower-stairs-s", a: [-72, 120], dir: [0, -1], w: 6, n: 10, tread: 0.4, rise: 0.3, y0: LV.L0, cheeks: true, tactile: true },
  // The quad → the courts (video 1: the stairs down beside the quad).
  { id: "courts-stairs", a: [108, -10], dir: [-1, 0], w: 6, n: 5, tread: 0.8, rise: 0.3, y0: LV.LM, cheeks: true, tactile: true },
  // The canteen's raised seating deck (video 2).
  { id: "deck-steps", a: [-22.8, 30.5], dir: [-1, 0], w: 4, n: 3, tread: 0.4, rise: 0.3, y0: LV.L1, cheeks: true, tactile: true },
  // The Food Tech walkway's steps down onto the Maths balcony (video 7 → 11).
  // (on the walkway's landing, so they finish level with the Maths balcony)
  { id: "link-steps", a: [-84.9, 102.3], dir: [-1, 0], w: 4.6, n: 3, tread: 0.5, rise: 0.3, y0: LV.LM + 4.5, thin: true, tactile: true },
  // Hall stage steps (both front corners).
  { id: "stage-steps-w", a: [-9.5, 31.9], dir: [0, -1], w: 3.2, n: 4, tread: 0.6, rise: 0.3, y0: LV.L1 },
  { id: "stage-steps-e", a: [35.5, 31.9], dir: [0, -1], w: 3.2, n: 4, tread: 0.6, rise: 0.3, y0: LV.L1 },
];
/** Landings (solid unless `thin`). */
export const SCHOOL_LANDINGS = [
  // The canteen's raised seating deck.
  { id: "canteen-deck", c: [-30, 30.5], yaw: 0, hx: 6, hz: 3.5, y: LV.L1 + 0.9 },
  // The Food Tech walkway's landing, level with the top of the steps.
  { id: "link-landing", c: [-87.95, 102.3], yaw: 0, hx: 1.55, hz: 2.3, y: LV.LM + 5.4, thin: true },
];
/** Extra thin decks (bridges): C Block's 1st-floor corridor runs on past its end. */
export const SCHOOL_DECKS = [
  { id: "link-deck", c: [-87.2, 90.4], yaw: 0, hx: 2.3, hz: 2.4, y: LV.L2 },
];
/** Ramps (galvanised rails; ≤ 1:12). */
export const SCHOOL_RAMPS = [
  // Arrival plaza → the hall forecourt (two runs + a turn, like the old one).
  { id: "front-ramp-1", a: [22, 80.0], b: [49, 80.0], w: 2.4, y0: LV.L0, y1: 2.25 },
  { id: "front-ramp-2", a: [49, 77.2], b: [22, 77.2], w: 2.4, y0: 2.25, y1: LV.L1, flushEnd: true },
  // Up onto the canteen's seating deck.
  { id: "canteen-ramp", a: [-32.8, 44.8], b: [-32.8, 34], w: 2.4, y0: LV.L1, y1: LV.L1 + 0.9, flushEnd: true },
  // The Food Tech walkway: down 0.6 m along the Maths Block's end wall.
  { id: "link-ramp", a: [-87.2, 92.8], b: [-87.2, 100], w: 4.6, y0: LV.L2, y1: LV.L2 - 0.6, thin: true, walls: true },
];
/** Ramp landings (level, solid). */
export const SCHOOL_RAMP_LANDINGS = [
  { id: "front-ramp-turn", c: [50.6, 78.6], yaw: 0, hx: 1.6, hz: 2.6, y: 2.25 },
];
/** Free-standing roofs on posts: { c, yaw, hx, hz, y (underside), kind }. */
export const SCHOOL_CANOPIES = [
  // Over the Food Tech walkway (video 7: the covered ramp).
  { id: "link-roof", c: [-87.2, 96.4], yaw: 0, hx: 2.3, hz: 8.4, y: LV.L2 + 3.1, kind: "steel" },
];

// ---------------------------------------------------------------------------
// THE SIXTEEN STAFF (2026-11-10, Jeff) — one per Stage 4 outcome, grouped on
// the map by STRAND so students can make a mental atlas:
//   EAST   Number & Algebra (7)   Quad / Canteen / Office / Courts / Plaza
//   WEST   Measurement & Space (6) Maths Block / Food Tech / Glass Stairs / Science
//   NORTH-WEST Statistics & Probability (3) Top Balcony / A-Block Courtyard / Mural Lane
// Each NPC's `strand` is one of `number-algebra` / `measurement-space` /
// `statistics-probability`. The challenge they open comes from `challengeList.js`;
// keys/padlocks/boss are derived from `SCHOOLYARD_KEY_IDS` (every non-boss id).
// The nine original staff names are kept and reassigned; eight new teachers
// were added. Mrs. Kellahan stays the boss in the hall.
// ---------------------------------------------------------------------------
export const SCHOOLYARD_CHARACTERS = [
  // ===== Number & Algebra — East =====
  { id: "pearce", name: "Mr. Pearce", strand: "number-algebra", position: [-19.9, 18.4], color: "#e07a5f", area: "canteen",
    flavor: "Integers are the maths of money — profit, loss, change in temperature. Keep sign in mind.",
    complete: ["Sharp work with the signs — here's a key!", "On to the next one."] },
  { id: "brookes", name: "Ms. Brookes", strand: "number-algebra", position: [56, -18], color: "#8ac926", area: "quad-fig-e",
    flavor: "A third, zero point three three three, thirty-three percent — all the same amount wearing different clothes.",
    complete: ["Beautifully done — take a key!", "Fractions, decimals, percentages: they're all friends."] },
  { id: "noor", name: "Mr. Noor", strand: "number-algebra", position: [62, 34], color: "#9b5de5", area: "quad-fig-c",
    flavor: "Algebra is arithmetic with the letters still in — same rules, bigger ideas.",
    complete: ["Nice working — here's your key.", "You've got the algebra bug now."] },
  { id: "lin", name: "Ms. Lin", strand: "number-algebra", position: [50, 34], color: "#3d9970", area: "quad-fig-w",
    flavor: "An equation is a balance — whatever you do to one side, do to the other.",
    complete: ["Perfectly balanced — a key for you!", "Equations solved; on you go."] },
  { id: "morgan", name: "Mr. Morgan", strand: "number-algebra", position: [66, 90], color: "#e76f51", area: "office",
    flavor: "Everything in school runs on rates — words per minute, kilojoules per gram, kids per teacher.",
    complete: ["Top ratio work — take a key!", "Rates make sense of the world."] },
  { id: "sahni", name: "Mr. Sahni", strand: "number-algebra", position: [30, 90], color: "#5b8def", area: "plaza",
    flavor: "Powers let you talk about very big and very small — the universe fits in a few of them.",
    complete: ["Indices under control — have a key!", "Powers, roots, done."] },
  { id: "okafor", name: "Ms. Okafor", strand: "number-algebra", position: [118, 20], color: "#2a9d8f", area: "cola",
    flavor: "Spot the pattern, write the rule, see the line — that's the whole trick.",
    complete: ["Lovely linear thinking — key earned!", "Lines and patterns: sorted."] },

  // ===== Measurement & Space — West =====
  { id: "green", name: "Mr. Green", strand: "measurement-space", position: [-87.2, 96], color: "#2a9d8f", area: "foodtech",
    flavor: "Length is everywhere — a running track, a perimeter fence, the trim round a window.",
    complete: ["Neatly measured — a key for you!", "Length and perimeter: on to the next."] },
  { id: "heywood", name: "Mr. Heywood", strand: "measurement-space", position: [-59, 72], color: "#f4772e", area: "glass",
    flavor: "Angles stack up to known totals — on a line, round a point, in a triangle. Always check the total.",
    complete: ["Angle work on point — key!", "Solid angle reasoning."] },
  { id: "dawson", name: "Mr. Dawson", strand: "measurement-space", position: [-73, 102.3], color: "#9b5de5", area: "skypier",
    flavor: "The squares on the sides of a right-angled triangle have a famous relationship. Use it on every leg.",
    complete: ["Pythagoras bows to you — have a key!", "Distances through right angles: easy now."] },
  { id: "patel", name: "Ms. Patel", strand: "measurement-space", position: [-74, 92], color: "#457b9d", area: "maths-m1",
    flavor: "Every shape's area is a rectangle wearing a disguise — cut it, rearrange it, measure it.",
    complete: ["Area sorted — key for you!", "Rectangles, triangles, circles, composites: all the same trick."] },
  { id: "vo", name: "Mr. Vo", strand: "measurement-space", position: [-67, 92], color: "#8ac926", area: "maths-m4",
    flavor: "Volume is area a storey up — the base times how tall it stands.",
    complete: ["Volume cracked — a key!", "Prisms, cylinders, capacity: smooth."] },
  { id: "ewings", name: "Ms. Ewings", strand: "measurement-space", position: [-87.2, 81], color: "#5b8def", area: "science",
    flavor: "Shapes aren't just drawings — every property (sides, angles, symmetry) is a clue.",
    complete: ["Geometry mastered — have a key!", "On to the next proof."] },

  // ===== Statistics & Probability — North-west =====
  { id: "mahoney", name: "Ms. Mahoney", strand: "statistics-probability", position: [-53.8, 50], color: "#3d9970", area: "library",
    flavor: "A good chart tells its story at a glance — titles, scales, labels all pulling their weight.",
    complete: ["Beautifully read — key for you!", "Charts: on to the next."] },
  { id: "ndlovu", name: "Ms. Ndlovu", strand: "statistics-probability", position: [-74, -2], color: "#8ac926", area: "courtyard",
    flavor: "Numbers in a column tell you the shape — the middle, the spread, the outliers.",
    complete: ["Summarised beautifully — have a key!", "Mean, median, mode, range: in hand."] },
  { id: "bacon", name: "Ms. Bacon", strand: "statistics-probability", position: [-95, -83.5], color: "#457b9d", area: "mural",
    flavor: "Chance is where maths meets fairness — a good estimate is never a guess.",
    complete: ["Chance sorted — key!", "Probability under your belt."] },

  // …and the BOSS: Mrs. Kellahan, on the hall stage behind the padlocked doors.
  { id: "kellahan", name: "Mrs. Kellahan", strand: "boss", position: [13, 25.5], color: "#f4772e", area: "hall",
    boss: true, scale: 1.35,
    flavor: "All sixteen keys — well done. The Head Teacher's Exam takes four from every topic (sixty in all).",
    complete: ["🏆 You did it — the Playground champion!",
      "A whole year's worth of Stage 4 maths, sat and sorted. Hat off."] },
];

/** Back-compat names. */
export const SCHOOLYARD_WELCOME_SIGN = { position: SCHOOLYARD_WELCOME.position, rotationY: 0, text: SCHOOLYARD_WELCOME.text };

// ---------------------------------------------------------------------------
// AREAS — named corners of the school (labels show as you approach). The
// staff's `area` ids are kept (canteen, library, science, skypier, oval,
// agplot, mural, courtyard, hall); their names now match the new places.
// ---------------------------------------------------------------------------
export const SCHOOL_AREAS = [
  // Arrival + hall
  { id: "front", name: "Front Gate", icon: "🏫", c: [13, 96], y: LV.L0 + 4.2 },
  { id: "plaza", name: "Arrival Plaza — Indices", icon: "🔢", c: [30, 88], y: LV.L0 + 4.4 },
  { id: "hall", name: "The School Hall", icon: "🎭", c: [13, 70], y: LV.L1 + 6.4 },
  { id: "office", name: "Front Office — Ratios & Rates", icon: "⚖️", c: [66, 90], y: LV.L0 + 4.4 },
  // East — Number & Algebra
  { id: "canteen", name: "The Canteen — Integers", icon: "🥪", c: [-24, 14], y: LV.L1 + 4.6 },
  { id: "quad", name: "The Fig Quad", icon: "🌳", c: [70, 10], y: LV.L1 + 4.6 },
  { id: "quad-fig-e", name: "Fig: Fractions, Decimals, %", icon: "⅓", c: [56, -18], y: LV.L1 + 4.6 },
  { id: "quad-fig-c", name: "Fig: Algebra", icon: "𝒙", c: [62, 34], y: LV.L1 + 4.6 },
  { id: "quad-fig-w", name: "Fig: Equations", icon: "⚖️", c: [50, 34], y: LV.L1 + 4.6 },
  { id: "cola", name: "COLA — Linear Relationships", icon: "📈", c: [118, 20], y: LV.LM + 4.4 },
  { id: "yard", name: "The Big Yard", icon: "🌳", c: [-10, -60], y: LV.L1 + 4.6 },
  // West — Measurement & Space
  { id: "foodtech", name: "Food Tech Walkway — Length", icon: "📏", c: [-87.2, 96], y: LV.L2 + 2.6 },
  { id: "glass", name: "Glass Stairs — Angles", icon: "📐", c: [-59, 72], y: LV.L2 + 3.4 },
  { id: "skypier", name: "Maths Balcony — Pythagoras", icon: "🔺", c: [-73, 102.3], y: LV.LM + 9 + 3.0 },
  { id: "maths-m1", name: "Maths M1 — Area", icon: "⬛", c: [-74, 92], y: LV.LM + 4.6 },
  { id: "maths-m4", name: "Maths M4 — Volume", icon: "🧊", c: [-67, 92], y: LV.LM + 9 + 3.0 },
  { id: "science", name: "Science Lookout — Geometry", icon: "🔭", c: [-87.2, 81], y: LV.L3 + 3.0 },
  { id: "undercroft", name: "The Undercroft", icon: "🏛️", c: [-70.5, 30], y: LV.L1 + 3.6 },
  { id: "tas", name: "The TAS Stairs", icon: "🔧", c: [-72, 51], y: LV.L1 + 4.0 },
  // North-west — Statistics & Probability
  { id: "library", name: "Top Balcony — Data Charts", icon: "📊", c: [-53.8, 50], y: LV.L3 + 3.0 },
  { id: "courtyard", name: "A Block Courtyard — Data Analysis", icon: "📈", c: [-74, -2], y: LV.L1 + 4.6 },
  { id: "mural", name: "Mural Lane — Probability", icon: "🎲", c: [-95, -83.5], y: LV.L1 + 4.6 },
  { id: "library-front", name: "The Library", icon: "📖", c: [-22, -11], y: LV.L1 + 4.4 },
  { id: "oval", name: "The Courts", icon: "🏀", c: [118, 0], y: LV.LM + 4.4 },
];

// ---------------------------------------------------------------------------
// GROUND — lawns are TERRAIN (a 1 m grid like the other worlds). Pads + paths.
// ---------------------------------------------------------------------------
export const SCHOOL_PADS = [
  { id: "front", c: [0, 110], rx: 150, rz: 16, p: 8, level: LV.L0 },
  { id: "campus", c: [0, -20], rx: 103, rz: 92, p: 8, level: LV.L1 },
];
/** Graded walking tracks on the terrain (the paths round the lawns). */
export const SCHOOL_PATH_CTRL = [
  // The west lawn: round the back of A + C Blocks.
  { id: "west-path", hw: 1.5, kind: "gravel", ctrl: [[-110, -110], [-120, -80], [-122, -40], [-118, 0], [-122, 40], [-116, 80], [-110, 104]] },
  // The north lawn, behind the white building.
  { id: "north-path", hw: 1.5, kind: "gravel", ctrl: [[-104, -118], [-60, -121], [0, -120], [60, -121], [100, -118]] },
];

// ---------------------------------------------------------------------------
// LANDMARKS + FURNITURE positions.
// ---------------------------------------------------------------------------
/** The big figs in brick planters: two on the quad, three in the Big Yard. */
export const QUAD_FIGS = [
  { c: [56, -18], r: 6.4, h: 19, planter: { hx: 5.6, hz: 4.4, yaw: 0.15 } },
  { c: [62, 34], r: 6.0, h: 18, planter: { hx: 5.2, hz: 4.2, yaw: -0.2 } },
  { c: [-34, -60], r: 6.6, h: 20, planter: { hx: 6.0, hz: 4.6, yaw: 0.1 } },
  { c: [4, -70], r: 6.2, h: 19, planter: { hx: 5.6, hz: 4.2, yaw: -0.12 } },
  { c: [20, -44], r: 5.8, h: 18, planter: { hx: 5.2, hz: 4.0, yaw: 0.3 } },
];
/** Raised brick garden beds (Banksia Court's kitchen garden + the canteen). */
export const COURT_BEDS = [
  { c: [-80, 64], hx: 1.6, hz: 6, yaw: 0, y: LV.L1 },
  { c: [-74, 82], hx: 5, hz: 1.4, yaw: 0, y: LV.L1 },
  { c: [-62, 86], hx: 3.6, hz: 1.2, yaw: 0, y: LV.L1 },
  { c: [-30, 11], hx: 6, hz: 1.2, yaw: 0, y: LV.L1 }, // the canteen's brick planter + bench (video 2)
];
/** Banksia Court's big leafy tree (videos 4, 6, 10 look out over it). */
export const COURT_TREE = { c: [-68, 66], r: 5.4, h: 15 };
/** A Block courtyard (video 8): timber planter boxes + the painted squares. */
export const PLANTER_BOXES = [
  { c: [-80, -18], hx: 1.4, hz: 1.0, yaw: 0 },
  { c: [-80, 6], hx: 1.4, hz: 1.0, yaw: 0 },
  { c: [-69, -24], hx: 1.4, hz: 1.0, yaw: 0.0 },
  { c: [-69, 14], hx: 1.4, hz: 1.0, yaw: 0 },
];
export const PAINTED_SQUARES = { c: [-75, -5], cols: 6, rows: 9, size: 2.1 };
/** Picnic tables: the quad (video 1), the canteen deck, the yard. */
export const PICNIC_TABLES = [
  [72, -6, 0], [72, 4, 0], [80, -6, 0.1], [80, 4, -0.1], [86, 22, 0], [86, -26, 0],
  [-33, 30.5, 0], [-27, 30.5, 0], [-10, -50, 0.2], [-44, -44, -0.1],
];
/** The basketball courts on the lower court terrace. */
export const COURTS = [
  { c: [123, -40], hx: 7.5, hz: 14, yaw: 0 },
  { c: [123, 20], hx: 7.5, hz: 14, yaw: 0 },
];
/** The COLA over the first court. */
export const COLA = { c: [123, -40], hx: 13.5, hz: 19, roofY: LV.LM + 6.6, y: LV.LM };
/** Front car park + the bus bay along Camperdown St. */
export const FRONT_CARPARK = { c: [118, 102], hx: 18, hz: 16 };
export const BUS_BAY = { c: [66, 120], hx: 22, hz: 3.2 };
/** Ewings' telescope (C Block's top floor, looking out to Muttonbird Island). */
export const TELESCOPE = { position: [-88.6, 85.2], y: LV.L3, aim: [352, 450] };
/** The top balcony's desks + benches (video 6): [x, z, rot]. */
export const BALCONY_DESKS = [
  [-55.4, 40, Math.PI / 2], [-55.4, 44, Math.PI / 2], [-55.4, 56, Math.PI / 2], [-55.4, 60, Math.PI / 2],
];
/** Signposts at the junctions: [x, z, y, [[label, [tx, tz]], …]]. */
export const SCHOOL_SIGNPOSTS = [
  { id: "front", p: [20, 90], arrows: [["School Hall", [13, 66]], ["Maths Block", [-60, 106]], ["Front Office", [66, 97]]] },
  { id: "forecourt", p: [-28, 72], arrows: [["Canteen", [-22, 20]], ["Banksia Court", [-70, 66]], ["Fig Quad", [70, 10]]] },
  { id: "quad", p: [50, 6], arrows: [["Courts", [118, 0]], ["Big Yard", [-10, -60]], ["School Hall", [13, 66]]] },
  { id: "yard", p: [-20, -38], arrows: [["Mural Lane", [-84, -84]], ["A Block Courtyard", [-74, -10]], ["Library", [-22, -11]]] },
  { id: "court8", p: [-64, -34], arrows: [["Undercroft", [-70, 30]], ["Big Yard", [-10, -60]], ["Mural Lane", [-90, -84]]] },
  { id: "banksia", p: [-80, 52], arrows: [["Maths Block", [-60, 106]], ["Glass Stairs", [-59, 72]], ["TAS Stairs", [-72, 51]]] },
];
/** Treasure-chest spots (one chosen per load). */
export const SCHOOL_CHEST_SPOTS = [
  [-128, -60], [120, -100], [-124, 108], [-96, 108], [80, -96], [-112, 46],
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
  beachZ: 262,
  jetty: { from: [120, 248], to: [150, 410], halfWidth: 3.2, y: SEA_Y + 4.5 },
  breakwall: [[230, 280], [262, 330], [300, 382], [318, 412]],
  muttonbird: { c: [352, 450], rx: 58, rz: 38, h: 34 },
  southBreakwall: [[-40, 330], [40, 370], [120, 402]],
  marina: { c: [250, 310], hx: 30, hz: 18 },
};

// ---------------------------------------------------------------------------
// SURFACES — paving laid over the lawns + terraces (drawn just above them).
// `y` = the level it lies on.
// ---------------------------------------------------------------------------
const rectPts = (c, hx, hz) => [[c[0] - hx, c[1] - hz], [c[0] + hx, c[1] - hz], [c[0] + hx, c[1] + hz], [c[0] - hx, c[1] + hz]];
const box = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
export const SCHOOL_SURFACES = [
  // L0 — the frontage.
  { id: "plaza", kind: "pavers", y: LV.L0, pts: box(-16, 86, 42, 125) },
  { id: "stairs-apron", kind: "concrete", y: LV.L0, pts: box(-2, 82, 54, 86) },
  { id: "front-walk", kind: "concrete", y: LV.L0, pts: box(-38.5, 116, -16, 125) },
  { id: "office-path", kind: "concrete", y: LV.L0, pts: box(42, 96, 66, 100) },
  { id: "carpark", kind: "asphalt", y: LV.L0, pts: rectPts(FRONT_CARPARK.c, FRONT_CARPARK.hx, FRONT_CARPARK.hz), lines: "bays" },
  { id: "carpark-drive", kind: "asphalt", y: LV.L0, pts: box(112, 118, 124, 125) },
  { id: "busbay", kind: "asphalt", y: LV.L0, pts: rectPts(BUS_BAY.c, BUS_BAY.hx, BUS_BAY.hz), lines: "bus" },
  // L1 — the paved campus.
  { id: "forecourt", kind: "concrete", y: LV.L1, pts: box(-38.5, 64, 104, 76) },
  { id: "quad", kind: "asphalt", y: LV.L1, pts: box(40, -40, 104, 64) },
  { id: "yard", kind: "asphalt", y: LV.L1, pts: box(-90, -89.8, 40, -30) },
  { id: "hall-walk", kind: "concrete", y: LV.L1, pts: box(-38.5, 8, -14, 64) },
  { id: "court8", kind: "pavers", y: LV.L1, pts: box(-86, -30, -66, 31) },
  { id: "court8-n", kind: "pavers", y: LV.L1, pts: box(-66, 8, -26, 31) },
  { id: "undercroft", kind: "concrete", y: LV.L1, pts: box(-89.5, 31, -51.5, 47.6) },
  { id: "banksia", kind: "pavers", y: LV.L1, pts: box(-84.9, 47.6, -56.1, 88) },
  { id: "c-walk", kind: "concrete", y: LV.L1, pts: box(-89.5, 24, -84.9, 88) },
  { id: "n-walk", kind: "concrete", y: LV.L1, pts: box(-56.1, 36, -38.5, 88) },
  { id: "lane", kind: "asphalt", y: LV.L1, pts: box(-104, -89.8, -90, -78) },
  { id: "a-east", kind: "concrete", y: LV.L1, pts: box(-104, 24, -84.9, 36) },
  // LM — the courts.
  ...COURTS.map((c, i) => ({ id: `court-${i}`, kind: "court", y: LV.LM, pts: rectPts(c.c, c.hx + 1.5, c.hz + 1.5), lines: "basketball", court: c })),
];
