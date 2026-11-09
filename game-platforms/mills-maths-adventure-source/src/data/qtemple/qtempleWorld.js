/**
 * THE QUOTIENT TEMPLE — INSIDE (2026-11-09). The ninth region: the halls
 * carved into the rock under the desert's temple, reached through the
 * Quotient Temple's door once a student holds at least a 🥉 on all fifteen
 * Timestable Temple stations. Land only — challenges come later.
 *
 * Jeff: "when you enter the door … they will scale a large set of steps
 * downward (like they are going underground) … a large terrain, about half
 * the size of the desert … inside a temple … take inspiration from the
 * images" (Twilight Princess' Temple of Time, Mario RPG's golden heads, the
 * SM64 + Banjo pyramids, an Egyptian cobra throne room).
 *
 * HOW IT'S BUILT — everything is carved out of solid rock:
 *   CELLS   the carved rooms + passages: a floor (flat, or a stair / ramp
 *           function) and a ceiling. Outside every cell is ROCK, so the
 *           walls are simply where the rock begins (no wall colliders).
 *   BLOCKS  solid masses inside rooms (the galleries, the dais tiers, the
 *           pit's ledges + ramps, the court's terraces) — always ground;
 *           taller than a step = a wall.
 *   DECKS   thin floors you can walk UNDER (the grate bridge over the pit) —
 *           ground only once you're at / above them (layered, like the
 *           jungle + desert).
 *   SAND    sinking-sand pools (the desert's quicksand rules: the edge slows
 *           you, the middle swallows you → back to the temple doors).
 * Pure: no React, no three — the headless checks drive all of it.
 *
 * Coordinates: north = −z. You arrive at the TOP (y = 0) by the doors, face
 * north and go DOWN the Grand Descent into the Great Hall (y = −18).
 */

export const QT_REGION_ID = "quotient-temple";
export const QT_NAME = "Quotient Temple";
export const QT_TOP = 0;
export const QT_HALL = -18;
export const QT_PIT_FLOOR = -32;
export const QT_ROCK = 60;
export const QT_STEP = 0.4;
/** The player's step-up (collisionEngine STEP_UP) — kept in step with the Player. */
export const QT_STEP_UP = 0.45;

// The player's clamp: the whole carved plan sits inside this rectangle.
export const QT_BOUNDS = { shape: "rect", width: 236, height: 180, center: [-5, 2] };
export const QT_SPAWN = { x: 0, z: 80 };
export const QT_ARRIVE_YAW = 0; // face north, down the Grand Descent
/** The doors back up to the desert (behind you as you arrive). */
export const QT_RETURN_PORTAL = [0, 84.4];

// ---------------------------------------------------------------------------
// Stair helpers — a stepped profile along one axis.
// ---------------------------------------------------------------------------
/**
 * Steps from `from` (height y0) to `to` (height y1) along an axis value `t`:
 * n equal steps; before `from` → y0, past `to` → y1.
 */
function stepped(t, from, to, y0, y1, n) {
  const f = (t - from) / (to - from);
  if (f <= 0) return y0;
  if (f >= 1) return y1;
  const k = Math.min(n, Math.ceil(f * n - 1e-9));
  return y0 + ((y1 - y0) * k) / n;
}
const lerp = (a, b, f) => a + (b - a) * Math.max(0, Math.min(1, f));

// The Grand Descent: three flights + two landings + a fan of steps into the
// Great Hall. 0 → −8 → −16 → −18 m, 20 + 20 + 5 steps of 40 cm.
export const DESCENT = {
  x0: -9, x1: 9, top: 73.5,
  flights: [
    { from: 73.5, to: 60, y0: 0, y1: -8, n: 20 },
    { from: 55, to: 41, y0: -8, y1: -16, n: 20 },
    { from: 37, to: 33.5, y0: -16, y1: -18, n: 5 },
  ],
  landings: [{ z0: 55, z1: 60, y: -8 }, { z0: 37, z1: 41, y: -16 }],
};
export function descentY(z) {
  if (z >= DESCENT.top) return 0;
  const [f1, f2, f3] = DESCENT.flights;
  if (z >= f1.to) return stepped(DESCENT.top - z, 0, f1.from - f1.to, f1.y0, f1.y1, f1.n);
  if (z >= f2.from) return -8;
  if (z >= f2.to) return stepped(f2.from - z, 0, f2.from - f2.to, f2.y0, f2.y1, f2.n);
  if (z >= f3.from) return -16;
  return stepped(f3.from - z, 0, f3.from - f3.to, f3.y0, f3.y1, f3.n);
}

// The Hall of Heads' sunken middle: three steps down (−19.2) and up again.
const SUNK = { x0: -76, x1: -54, edge: 2.1, depth: 1.2 };
function headsFloor(x) {
  if (x < SUNK.x0 || x > SUNK.x1) return QT_HALL;
  const d = Math.min(x - SUNK.x0, SUNK.x1 - x);
  return QT_HALL - stepped(d, 0, SUNK.edge, 0, SUNK.depth, 3);
}

// ---------------------------------------------------------------------------
// CELLS — the carved rooms + passages. floor = number | (x, z) => number.
// `mat` picks the floor + wall look; `ceil` the ceiling (camera stays under).
// ---------------------------------------------------------------------------
export const CELLS = [
  { id: "vestibule", label: "Temple Doors", x0: -8, x1: 8, z0: 73.5, z1: 86, floor: 0, ceil: 9, mat: "sandstone" },
  { id: "descent", label: "The Grand Descent", x0: -9, x1: 9, z0: 37, z1: 73.5, floor: (x, z) => descentY(z), ceil: (x, z) => descentY(z) + 11, mat: "stairs" },
  { id: "fan", label: "The Grand Descent", x0: -13, x1: 13, z0: 33.5, z1: 37, floor: (x, z) => descentY(z), ceil: 12, mat: "stairs" },
  { id: "hall", label: "The Great Hall", x0: -30, x1: 30, z0: -30, z1: 33.5, floor: QT_HALL, ceil: 12, mat: "marble" },
  { id: "heads", label: "The Hall of Heads", x0: -100, x1: -30, z0: 12, z1: 22, floor: (x) => headsFloor(x), ceil: -6, mat: "diamond" },
  { id: "library-door", label: "The Scribes' Library", x0: -56, x1: -46, z0: 22, z1: 27, floor: QT_HALL, ceil: -10, mat: "sandstone" },
  { id: "library", label: "The Scribes' Library", x0: -72, x1: -34, z0: 27, z1: 54, floor: QT_HALL, ceil: -8, mat: "wood" },
  { id: "pit-door", label: "The Sunken Pit", x0: -104, x1: -92, z0: -6, z1: 12, floor: QT_HALL, ceil: -6, mat: "brick" },
  { id: "pit", label: "The Sunken Pit", x0: -112, x1: -62, z0: -60, z1: -6, floor: QT_PIT_FLOOR, ceil: -2, mat: "brick" },
  { id: "antechamber", label: "The Cobra Throne", x0: 30, x1: 40, z0: 12, z1: 22, floor: QT_HALL, ceil: -8, mat: "slab" },
  { id: "throne", label: "The Cobra Throne", x0: 40, x1: 96, z0: -14, z1: 46, floor: QT_HALL, ceil: -6, mat: "slab" },
  { id: "treasury-door", label: "The Treasury", x0: 52, x1: 62, z0: 46, z1: 50, floor: QT_HALL, ceil: -10, mat: "slab" },
  { id: "treasury", label: "The Treasury", x0: 42, x1: 76, z0: 50, z1: 74, floor: QT_HALL, ceil: -9, mat: "gold" },
  { id: "court-door", label: "The Guardians' Court", x0: 56, x1: 68, z0: -30, z1: -14, floor: QT_HALL, ceil: -8, mat: "sandstone" },
  { id: "court", label: "The Guardians' Court", x0: 30, x1: 100, z0: -80, z1: -30, floor: QT_HALL, ceil: -1, mat: "sand" },
];
export const CELL = Object.fromEntries(CELLS.map((c) => [c.id, c]));
const floorOf = (c, x, z) => (typeof c.floor === "function" ? c.floor(x, z) : c.floor);
const ceilOf = (c, x, z) => (typeof c.ceil === "function" ? c.ceil(x, z) : c.ceil);
export function cellsAt(x, z) {
  return CELLS.filter((c) => x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1);
}
/** The carved floor at (x, z) (the highest of the cells it's in), or ROCK. */
export function baseFloor(x, z) {
  let best = null;
  for (const c of CELLS) {
    if (x < c.x0 || x > c.x1 || z < c.z0 || z > c.z1) continue;
    const f = floorOf(c, x, z);
    if (best === null || f > best) best = f;
  }
  return best === null ? QT_ROCK : best;
}
/** The ceiling over (x, z) (the room's), or the floor + 8 m. */
export function ceilingAt(x, z) {
  let best = null;
  for (const c of CELLS) {
    if (x < c.x0 || x > c.x1 || z < c.z0 || z > c.z1) continue;
    const v = ceilOf(c, x, z);
    if (best === null || v > best) best = v;
  }
  return best === null ? -Infinity : best;
}
export function isCarved(x, z) {
  return CELLS.some((c) => x >= c.x0 && x <= c.x1 && z >= c.z0 && z <= c.z1);
}

// ---------------------------------------------------------------------------
// BLOCKS — solid masses in the rooms. top = number | (x, z) => number.
// ---------------------------------------------------------------------------
const box = (id, x0, z0, x1, z1, top, extra = {}) => ({ id, x0, z0, x1, z1, top, ...extra });
// The Great Hall's raised side galleries + the stairs up to them.
export const GALLERY = { w: { x0: -30, x1: -23 }, e: { x0: 23, x1: 30 }, z0: -26, z1: -4, top: -12, stairZ1: 5 };
const galleryStair = (x0, x1) => box(`gallery-stair-${x0 < 0 ? "w" : "e"}`, x0, GALLERY.z1, x1, GALLERY.stairZ1,
  (x, z) => stepped(z - GALLERY.z1, 0, GALLERY.stairZ1 - GALLERY.z1, GALLERY.top, QT_HALL, 15), { kind: "stair", look: "marble" });
// The Great Hall's north dais (three steps up to the sealed Sanctum door).
export const DAIS = { x0: -11, x1: 11, z1: -25, z0: -30, steps: [-17.6, -17.2, -16.8], depth: 1.2 };
// The pit: walkway ledges round the walls (−18), the east ramp down to the
// north-east platform (−25), the north ramp on down to the floor, the west
// stair back up, and the landing between the west stair + the south ledge.
export const PIT = {
  x0: -112, x1: -62, z0: -60, z1: -6, ledge: 4,
  ramp1: { x0: -70, x1: -66, zTop: -10, zLow: -32, yTop: QT_HALL, yLow: -25 },
  platform: { x0: -78, x1: -66, z0: -56, z1: -32, top: -25 },
  ramp2: { x0: -100, x1: -78, z0: -56, z1: -50, yHigh: -25, yLow: QT_PIT_FLOOR },
  stair: { x0: -108, x1: -104, zLow: -50, zTop: -14, n: 35 },
  landing: { x0: -108, x1: -104, z0: -14, z1: -10 },
  bridge: { x0: -108, x1: -66, z0: -30, z1: -26, top: QT_HALL },
  sand: { c: [-89, -36], r: 7.5 },
};
// The throne room's dais (four nested tiers, 40 cm each) + the cobra on top.
export const THRONE = { c: [92, 16], tiers: [
  { x0: 80, x1: 96, z0: 4, z1: 28, top: -17.6 },
  { x0: 83, x1: 96, z0: 6.5, z1: 25.5, top: -17.2 },
  { x0: 86, x1: 96, z0: 9, z1: 23, top: -16.8 },
  { x0: 89, x1: 96, z0: 11.5, z1: 20.5, top: -16.4 },
] };
// The Guardians' Court: two terraces up to the north + their stairs.
export const COURT = {
  x0: 30, x1: 100, stairX0: 59, stairX1: 69,
  tier2: { z0: -80, z1: -48, top: -14 },
  tier3: { z0: -80, z1: -62, top: -10 },
  stair1: { z0: -48, z1: -38, y0: QT_HALL, y1: -14, n: 10 },
  stair2: { z0: -62, z1: -52, y0: -14, y1: -10, n: 10 },
  sand: { c: [47, -39.5], r: 5.2 },
};
// The library's reading platform (one step up, then two).
export const READING = { x0: -62, x1: -44, z0: 44, z1: 52, steps: [-17.6, -17.2], depth: 1.5 };

export const BLOCKS = [
  box("gallery-w", GALLERY.w.x0, GALLERY.z0, GALLERY.w.x1, GALLERY.z1, GALLERY.top, { look: "marble" }),
  box("gallery-e", GALLERY.e.x0, GALLERY.z0, GALLERY.e.x1, GALLERY.z1, GALLERY.top, { look: "marble" }),
  galleryStair(-30, -25), galleryStair(25, 30),
  ...DAIS.steps.map((top, i) => box(`dais-${i}`, DAIS.x0 + i * 1.2, DAIS.z0, DAIS.x1 - i * 1.2, DAIS.z1 - i * DAIS.depth, top, { look: "marble" })),
  // Pit ledges.
  box("pit-ledge-s", PIT.x0, PIT.z1 - PIT.ledge, PIT.x1, PIT.z1, QT_HALL, { look: "brick" }),
  box("pit-ledge-n", PIT.x0, PIT.z0, PIT.x1, PIT.z0 + PIT.ledge, QT_HALL, { look: "brick" }),
  box("pit-ledge-w", PIT.x0, PIT.z0, PIT.x0 + PIT.ledge, PIT.z1, QT_HALL, { look: "brick" }),
  box("pit-ledge-e", PIT.x1 - PIT.ledge, PIT.z0, PIT.x1, PIT.z1, QT_HALL, { look: "brick" }),
  box("pit-ramp1", PIT.ramp1.x0, PIT.ramp1.zLow, PIT.ramp1.x1, PIT.ramp1.zTop,
    (x, z) => lerp(PIT.ramp1.yLow, PIT.ramp1.yTop, (z - PIT.ramp1.zLow) / (PIT.ramp1.zTop - PIT.ramp1.zLow)), { kind: "ramp", look: "brickRamp" }),
  box("pit-platform", PIT.platform.x0, PIT.platform.z0, PIT.platform.x1, PIT.platform.z1, PIT.platform.top, { look: "brick" }),
  box("pit-ramp2", PIT.ramp2.x0, PIT.ramp2.z0, PIT.ramp2.x1, PIT.ramp2.z1,
    (x) => lerp(PIT.ramp2.yLow, PIT.ramp2.yHigh, (x - PIT.ramp2.x0) / (PIT.ramp2.x1 - PIT.ramp2.x0)), { kind: "ramp", look: "brickRamp" }),
  box("pit-stair", PIT.stair.x0, PIT.stair.zLow, PIT.stair.x1, PIT.stair.zTop,
    (x, z) => stepped(z - PIT.stair.zLow, 0, PIT.stair.zTop - PIT.stair.zLow, QT_PIT_FLOOR, QT_HALL, PIT.stair.n), { kind: "stair", look: "brick" }),
  box("pit-landing", PIT.landing.x0, PIT.landing.z0, PIT.landing.x1, PIT.landing.z1, QT_HALL, { look: "brick" }),
  // Throne dais.
  ...THRONE.tiers.map((t, i) => box(`throne-${i}`, t.x0, t.z0, t.x1, t.z1, t.top, { look: "darkStone" })),
  // The court's terraces + stairs.
  box("court-tier2-w", COURT.x0, COURT.tier2.z0, COURT.stairX0, COURT.tier2.z1, COURT.tier2.top, { look: "sandstone" }),
  box("court-tier2-e", COURT.stairX1, COURT.tier2.z0, COURT.x1, COURT.tier2.z1, COURT.tier2.top, { look: "sandstone" }),
  box("court-tier2-mid", COURT.stairX0, COURT.tier2.z0, COURT.stairX1, COURT.tier2.z1, COURT.tier2.top, { look: "sandstone" }),
  box("court-tier3", COURT.x0, COURT.tier3.z0, COURT.x1, COURT.tier3.z1, COURT.tier3.top, { look: "sandstone" }),
  box("court-stair1", COURT.stairX0, COURT.stair1.z0, COURT.stairX1, COURT.stair1.z1,
    (x, z) => stepped(COURT.stair1.z1 - z, 0, COURT.stair1.z1 - COURT.stair1.z0, COURT.stair1.y0, COURT.stair1.y1, COURT.stair1.n), { kind: "stair", look: "sandstone" }),
  box("court-stair2", COURT.stairX0, COURT.stair2.z0, COURT.stairX1, COURT.stair2.z1,
    (x, z) => stepped(COURT.stair2.z1 - z, 0, COURT.stair2.z1 - COURT.stair2.z0, COURT.stair2.y0, COURT.stair2.y1, COURT.stair2.n), { kind: "stair", look: "sandstone" }),
  // The library's reading platform.
  ...READING.steps.map((top, i) => box(`reading-${i}`, READING.x0 + i * READING.depth, READING.z0 + i * READING.depth, READING.x1 - i * READING.depth, READING.z1, top, { look: "wood" })),
];
// Thin floors you can walk under.
export const DECKS = [
  { id: "grate-bridge", x0: PIT.bridge.x0, z0: PIT.bridge.z0, x1: PIT.bridge.x1, z1: PIT.bridge.z1, top: PIT.bridge.top, thick: 0.35 },
];
const topOf = (b, x, z) => (typeof b.top === "function" ? b.top(x, z) : b.top);
const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;

/** The highest block / deck top under (x, z) that counts at height `lim`. */
export function structureTopAt(x, z, lim = Infinity) {
  let best = null;
  for (const b of BLOCKS) {
    if (!inBox(b, x, z)) continue;
    const t = topOf(b, x, z);
    if (best === null || t > best) best = t;
  }
  for (const d of DECKS) {
    if (!inBox(d, x, z) || d.top > lim) continue;
    if (best === null || d.top > best) best = d.top;
  }
  return best;
}

// ---------------------------------------------------------------------------
// SINKING SAND — the pit floor's pool + a smaller one in the court.
// ---------------------------------------------------------------------------
export const SAND_EDGE = 1.4; // the soft edge you can wade (slows you)
export const SAND_POOLS = [
  { id: "pit-sand", c: PIT.sand.c, r: PIT.sand.r, floor: QT_PIT_FLOOR },
  { id: "court-sand", c: COURT.sand.c, r: COURT.sand.r, floor: QT_HALL },
].map((p) => ({ ...p, level: p.floor - 0.12 }));
export function sandAt(x, z) {
  for (const p of SAND_POOLS) {
    const d = Math.hypot(x - p.c[0], z - p.c[1]);
    if (d < p.r) return { pool: p, d, sdf: d - p.r };
  }
  return null;
}
/** The floor dips under the sand (the pool's bowl). */
function sandDip(x, z) {
  const s = sandAt(x, z);
  if (!s) return 0;
  const f = 1 - (s.d / s.pool.r) ** 2;
  return 0.35 * f + (s.sdf < -SAND_EDGE ? 0.35 : 0);
}

// ---------------------------------------------------------------------------
// THE PLAYER HOOKS
// ---------------------------------------------------------------------------
/** Walkable ground (layered: the grate bridge counts once you're at/above it). */
export function qtGroundHeight(x, z, y) {
  const lim = y === undefined ? Infinity : y + QT_STEP_UP + 0.05;
  const g = baseFloor(x, z) - (isCarved(x, z) ? sandDip(x, z) : 0);
  const s = structureTopAt(x, z, lim);
  return s !== null && s > g ? s : g;
}
/** No slopes to slide down in here (everything is stairs + gentle ramps). */
export function qtSlideAt() {
  return null;
}
export const QT_SAND_SLOW = 0.5;
export function qtSpeedAt(x, z, y) {
  const s = sandAt(x, z);
  if (!s) return 1;
  if (y !== undefined && structureTopAt(x, z, y + 0.3) !== null) return 1;
  return QT_SAND_SLOW;
}
export function qtHazardAt(x, z, y) {
  const s = sandAt(x, z);
  if (!s || s.sdf >= -SAND_EDGE) return false;
  if (y !== undefined && y > s.pool.level + 0.25) return false; // over it on the bridge
  return structureTopAt(x, z, y === undefined ? Infinity : y + 0.3) === null;
}
export const QT_SAND_HINT = "That swirly sand is SINKING SAND! 🌀 Keep to the stone floor — or cross on the grate bridge above it.";
export function qtHazardInfo(x, z) {
  const s = sandAt(x, z);
  if (!s || s.sdf > 0.5) return null;
  return { kind: "quicksand", wipe: "You sank in the sand!", hint: QT_SAND_HINT, sound: "sink" };
}
export function qtSinkLevelAt(x, z) {
  const s = sandAt(x, z);
  return s && s.sdf < -SAND_EDGE ? s.pool.level : null;
}
/** A good spot to be returned to (stone floor, not sand). */
export function qtIsSafe(x, z) {
  if (!isCarved(x, z)) return false;
  const s = sandAt(x, z);
  if (s && s.sdf < 1.5) return false;
  return true;
}
/**
 * The camera never goes into the rock or above a room's ceiling: walk the
 * line from the player's head back to the camera and stop it just before the
 * first rock / wall / block it would pass through.
 */
export function qtCameraFit(px, py, pz, cam) {
  const hx = px, hy = py + 1.5, hz = pz;
  const dx = cam.x - hx, dy = cam.y - hy, dz = cam.z - hz;
  const L = Math.hypot(dx, dy, dz);
  if (L < 1e-3) return;
  const n = Math.max(4, Math.ceil(L / 0.3));
  let safe = 0;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const x = hx + dx * t, y = hy + dy * t, z = hz + dz * t;
    const solid = Math.max(baseFloor(x, z), structureTopAt(x, z, y) ?? -Infinity);
    const ceil = ceilingAt(x, z);
    if (y < solid + 0.35 || y > ceil - 0.5) break;
    safe = t;
  }
  const t = Math.max(0, safe - 0.06);
  cam.x = hx + dx * t;
  cam.y = hy + dy * t;
  cam.z = hz + dz * t;
  if (t < 0.25) {
    // Pressed against a wall: look from just above the head instead.
    cam.y = Math.min(ceilingAt(px, pz) - 0.6, hy + 1.2);
  }
}

// ---------------------------------------------------------------------------
// The places (labels, the map, the checks).
// ---------------------------------------------------------------------------
export const QT_SPOTS = [
  { id: "doors", label: "Temple Doors", icon: "🚪", center: [0, 80], radius: 4 },
  { id: "descent", label: "The Grand Descent", icon: "⬇️", center: [0, 57.5], radius: 4 },
  { id: "hall", label: "The Great Hall", icon: "🏛️", center: [0, 4], radius: 8 },
  { id: "sanctum", label: "The Sealed Sanctum", icon: "➗", center: [0, -23], radius: 4 },
  { id: "galleries", label: "The Galleries", icon: "🏛️", center: [-26.5, -15], radius: 3 },
  { id: "heads", label: "The Hall of Heads", icon: "🗿", center: [-64, 17], radius: 4 },
  { id: "library", label: "The Scribes' Library", icon: "📜", center: [-53, 35], radius: 5 },
  { id: "pit", label: "The Sunken Pit", icon: "🕳️", center: [-96, -22], radius: 4 },
  { id: "throne", label: "The Cobra Throne", icon: "🐍", center: [70, 16], radius: 6 },
  { id: "treasury", label: "The Treasury", icon: "💰", center: [59, 62], radius: 5 },
  { id: "court", label: "The Guardians' Court", icon: "🛡️", center: [64, -42], radius: 5 },
];
/** Landmarks named on the map. */
export const QT_LANDMARKS = [
  { id: "medallion", label: "The Quotient Seal", p: [0, 4] },
  { id: "grate", label: "The Grate Bridge", p: [-87, -28] },
  { id: "cobra", label: "The Cobra", p: [93, 16] },
  { id: "terrace", label: "The High Terrace", p: [64, -72] },
];

// Pillars (round): [x, z, radius, style, floor].
export const PILLARS = [
  ...[-22, -14, -6, 2, 10, 18, 26].flatMap((z) => [[-19, z, 1.25, "hall"], [19, z, 1.25, "hall"]]),
  ...[50, 60, 70].flatMap((x) => [[x, 4, 1.3, "cobra"], [x, 28, 1.3, "cobra"]]),
  ...[-90, -80, -44, -36].flatMap((x) => [[x, 13.6, 0.7, "heads"], [x, 20.4, 0.7, "heads"]]),
];
// Gallery colonnade (on the galleries, −12).
export const GALLERY_COLUMNS = [-24, -18, -12, -6].flatMap((z) => [[-23.6, z], [23.6, z]]);
// Statues on the Descent's landings + the court's guardian heads.
export const STATUES = [
  { id: "owl-1", p: [-7.2, 57.5], kind: "owl", y: -8, yaw: Math.PI / 2 },
  { id: "owl-2", p: [7.2, 57.5], kind: "owl", y: -8, yaw: -Math.PI / 2 },
  { id: "owl-3", p: [-7.2, 39], kind: "owl", y: -16, yaw: Math.PI / 2 },
  { id: "owl-4", p: [7.2, 39], kind: "owl", y: -16, yaw: -Math.PI / 2 },
];
export const GUARDIANS = [
  { id: "g-1", p: [35, -36], y: QT_HALL, yaw: Math.PI / 2, s: 1 },
  { id: "g-2", p: [95, -36], y: QT_HALL, yaw: -Math.PI / 2, s: 1 },
  { id: "g-3", p: [35, -44], y: QT_HALL, yaw: Math.PI / 2, s: 1 },
  { id: "g-4", p: [95, -44], y: QT_HALL, yaw: -Math.PI / 2, s: 1 },
  { id: "g-5", p: [44, -56], y: COURT.tier2.top, yaw: 0, s: 1.15 },
  { id: "g-6", p: [84, -56], y: COURT.tier2.top, yaw: 0, s: 1.15 },
  { id: "g-7", p: [55, -73], y: COURT.tier3.top, yaw: 0.25, s: 1.35 },
  { id: "g-8", p: [73, -73], y: COURT.tier3.top, yaw: -0.25, s: 1.35 },
];
// The Great Hall's colossi: two seated kings by the Descent's arch, two
// standing guardians either side of the Sanctum door. hx/hz = footprint.
export const COLOSSI = [
  { id: "seated-w", kind: "seated", p: [-24.5, 28.5], yaw: Math.PI, s: 1.2, hx: 3.25, hz: 3.85 },
  { id: "seated-e", kind: "seated", p: [24.5, 28.5], yaw: Math.PI, s: 1.2, hx: 3.25, hz: 3.85 },
  { id: "standing-w", kind: "standing", p: [-14.8, -27.2], yaw: 0, s: 1.25, hx: 2.75, hz: 2.75 },
  { id: "standing-e", kind: "standing", p: [14.8, -27.2], yaw: 0, s: 1.25, hx: 2.75, hz: 2.75 },
];
// The vestibule's two small guardian heads by the doors.
export const DOOR_GUARDS = [[-6.2, 83.4], [6.2, 83.4]];
// Golden heads on the Hall of Heads' walls: x positions (north + south walls).
export const HEADS_X = [-94, -86, -70, -62, -50, -42];
// Balustrades (collide only at their own level): a → b, the level they sit on.
const rail = (id, a, b, y) => ({ id, a, b, y });
export const RAILS = [
  rail("gal-w", [-23, -26], [-23, -4], GALLERY.top),
  rail("gal-e", [23, -26], [23, -4], GALLERY.top),
  rail("pit-s", [-104, -10], [-70, -10], QT_HALL),
  rail("pit-w1", [-108, -56], [-108, -30], QT_HALL),
  rail("pit-w2", [-108, -26], [-108, -14], QT_HALL),
  rail("pit-n", [-108, -56], [-66, -56], QT_HALL),
  rail("pit-e1", [-66, -56], [-66, -30], QT_HALL),
  rail("pit-e2", [-66, -26], [-66, -12], QT_HALL),
  rail("bridge-n", [-108, -30], [-66, -30], PIT.bridge.top),
  rail("bridge-s", [-108, -26], [-66, -26], PIT.bridge.top),
  rail("plat-w", [-78, -50], [-78, -32], PIT.platform.top),
  rail("plat-s", [-78, -32], [-70, -32], PIT.platform.top),
  rail("court2-w", [30, -48], [COURT.stairX0, -48], COURT.tier2.top),
  rail("court2-e", [COURT.stairX1, -48], [100, -48], COURT.tier2.top),
  rail("court3-w", [30, -62], [COURT.stairX0, -62], COURT.tier3.top),
  rail("court3-e", [COURT.stairX1, -62], [100, -62], COURT.tier3.top),
];
// Torches (wall sconces): [x, z, y, facing yaw]. Bright ones get a real light.
export const TORCHES = [
  [-7.6, 82.5, 2.7, Math.PI / 2], [7.6, 82.5, 2.7, -Math.PI / 2], [-7.6, 76, 2.7, Math.PI / 2], [7.6, 76, 2.7, -Math.PI / 2],
  ...[44, 36, 28].map((z) => [-8.6, z + 20, descentY(z + 20) + 2.4, Math.PI / 2]),
  ...[44, 36, 28].map((z) => [8.6, z + 20, descentY(z + 20) + 2.4, -Math.PI / 2]),
  ...[-90, -74, -58, -40].map((x) => [x, 12.4, QT_HALL + 3.2, 0]),
  ...[-82, -66, -50].map((x) => [x, 21.6, QT_HALL + 3.2, Math.PI]),
  [40.4, 8, QT_HALL + 3, Math.PI / 2], [40.4, 26, QT_HALL + 3, Math.PI / 2],
  ...[48, 64, 78].map((x) => [x, -13.6, QT_HALL + 3.4, 0]),
  ...[48, 64, 78].map((x) => [x, 45.6, QT_HALL + 3.4, Math.PI]),
  [-111.6, -40, QT_PIT_FLOOR + 3, Math.PI / 2], [-62.4, -44, QT_PIT_FLOOR + 3, -Math.PI / 2],
  [-111.6, -20, QT_HALL + 2.6, Math.PI / 2], [-62.4, -20, QT_HALL + 2.6, -Math.PI / 2],
];
// Braziers (standing fire bowls) — the brightest lights.
export const BRAZIERS = [
  { id: "hall-1", p: [-8, -21], y: QT_HALL },
  { id: "hall-2", p: [8, -21], y: QT_HALL },
  { id: "throne-1", p: [78, 6], y: QT_HALL },
  { id: "throne-2", p: [78, 26], y: QT_HALL },
  { id: "court-1", p: [56, -66], y: COURT.tier3.top },
  { id: "court-2", p: [72, -66], y: COURT.tier3.top },
  { id: "treasury", p: [59, 68], y: QT_HALL },
];
// The library's hanging lamps: [x, z, y].
export const LAMPS = [[-61, 36, -11.5], [-47, 36, -11.5], [-54, 46, -12], [-40, 46, -11.5], [-68, 46, -11.5]];
// Treasure, shelves, tables.
export const COIN_PILES = [[47, 56, 1.6], [70, 56, 1.4], [47, 69, 1.3], [71, 69, 1.7]];
export const IDOL = { p: [59, 62], r: 1.4 };
export const TREASURY_COLUMNS = [[54, 57], [64, 57], [54, 67], [64, 67]];
export const GOLD_BARS = [[50, 66], [68, 66], [56, 54], [62.5, 70.5]];
export const SHELVES = [
  ...[-66, -58, -50, -42].map((x) => ({ x, z: 52.8, w: 6, d: 1.2, yaw: 0 })),
  ...[33, 39].map((z) => ({ x: -71, z, w: 5, d: 1.2, yaw: Math.PI / 2 })),
  ...[33, 39].map((z) => ({ x: -35, z, w: 5, d: 1.2, yaw: Math.PI / 2 })),
];
export const TABLES = [[-60, 33, 0], [-48, 33, 0], [-54, 39.5, Math.PI / 2]];
export const CHEST_SPOT = [64, -75];
/** Where you read the sealed Sanctum door (on the dais's top step). */
export const QT_SANCTUM_SPOT = [0, -27.9];
/** In the desert: in front of the temple's door (the portal is just behind). */
export const QUOTIENT_DOOR_SPOT = [0, -114.6];
export const QT_MAP_BOARD = { position: [5.6, 79.5], rotationY: -Math.PI / 2 };
export const QT_WELCOME_HOST = { position: [-4.6, 78], rotationY: Math.PI / 2 };
/** Where you come out in the desert (in front of the temple's door). */
export const DESERT_FROM_QT = { arrive: [0, -114.2], arriveYaw: Math.PI };

/** All the round / box colliders (pillars, statues, rails, furniture). */
export function getQtColliders() {
  const out = [];
  for (const [x, z, r, style] of PILLARS) out.push({ id: `qt-pillar-${style}-${x}-${z}`, x, z, radius: r, kind: "landmark" });
  GALLERY_COLUMNS.forEach(([x, z], i) => out.push({ id: `qt-gcol-${i}`, x, z, radius: 0.45, kind: "landmark", yMin: GALLERY.top - 0.5 }));
  for (const s of STATUES) out.push({ id: `qt-${s.id}`, x: s.p[0], z: s.p[1], radius: 1.0, kind: "landmark" });
  for (const g of GUARDIANS) out.push({ id: `qt-${g.id}`, x: g.p[0], z: g.p[1], radius: 2.1 * g.s, kind: "landmark", yMin: g.y - 0.6 });
  for (const b of BRAZIERS) out.push({ id: `qt-brazier-${b.id}`, x: b.p[0], z: b.p[1], radius: 0.6, kind: "prop", yMin: b.y - 0.6 });
  for (const [x, z, r] of COIN_PILES) out.push({ id: `qt-coins-${x}-${z}`, x, z, radius: r, kind: "prop" });
  for (const [x, z] of TREASURY_COLUMNS) out.push({ id: `qt-tcol-${x}-${z}`, x, z, radius: 0.65, kind: "landmark" });
  for (const [x, z] of GOLD_BARS) out.push({ id: `qt-bars-${x}-${z}`, x, z, radius: 1.0, kind: "prop" });
  out.push({ id: "qt-idol", x: IDOL.p[0], z: IDOL.p[1], radius: IDOL.r, kind: "landmark" });
  out.push({ id: "qt-cobra", x: 93.2, z: 16, radius: 3.0, kind: "landmark" });
  for (const c of COLOSSI) out.push({ id: `qt-colossus-${c.id}`, box: true, x: c.p[0], z: c.p[1], hx: c.hx, hz: c.hz, cos: 1, sin: 0, radius: Math.hypot(c.hx, c.hz), kind: "landmark" });
  DOOR_GUARDS.forEach(([x, z], i) => out.push({ id: `qt-door-guard-${i}`, x, z, radius: 1.2, kind: "landmark" }));
  // Rails: a chain of small circles along each (collide only at their level).
  for (const r of RAILS) {
    const L = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]);
    const n = Math.max(1, Math.ceil(L / 0.7));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      out.push({ id: `qt-rail-${r.id}-${i}`, x: r.a[0] + (r.b[0] - r.a[0]) * t, z: r.a[1] + (r.b[1] - r.a[1]) * t, radius: 0.28, kind: "rail", yMin: r.y - 0.5, yMax: r.y + 1.6 });
    }
  }
  for (const s of SHELVES) {
    const c = Math.cos(s.yaw), sn = Math.sin(s.yaw);
    out.push({ id: `qt-shelf-${s.x}-${s.z}`, box: true, x: s.x, z: s.z, hx: s.w / 2, hz: s.d / 2, cos: c, sin: sn, radius: Math.hypot(s.w / 2, s.d / 2), kind: "prop" });
  }
  for (const [x, z, yaw] of TABLES) {
    out.push({ id: `qt-table-${x}-${z}`, box: true, x, z, hx: 2.2, hz: 1.0, cos: Math.cos(yaw), sin: Math.sin(yaw), radius: 2.4, kind: "prop" });
  }
  return out;
}

/** Walkable area (m²) of the carved floor — for the checks + the notes. */
export function walkableArea(step = 1) {
  let n = 0;
  for (let x = -120; x <= 110; x += step) for (let z = -90; z <= 95; z += step) if (isCarved(x, z)) n++;
  return n * step * step;
}
