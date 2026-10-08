/**
 * EMERALD JUNGLE — the SEVENTH region: a lush jungle / forest valley (land
 * only — no characters or maths yet). SINGLE SOURCE OF TRUTH for every
 * position, the terrain height-field, the water, the paths, the climbable
 * structures and the Player hooks. Pure data + pure helpers (no React /
 * three / stores), so the renderer (game/JungleScenery.jsx), the colliders
 * (jungleColliders.js), the Player (via the regions.js hooks) and the
 * headless system checks all read the SAME numbers and can never drift.
 *
 * THE WORLD (≈2× Magma Multiples' land): a long oval VALLEY (≈256 × 336 m)
 * walled in by steep forested RIM MOUNTAINS. You arrive in the south and look
 * north up the river valley:
 *   • a RIVER winds the length of the valley from a WATERFALL that drops off
 *     the northern ESCARPMENT, down to the LILY LAGOON in the south-east.
 *     All water is knee-deep — you can wade anywhere (slowly, with splashes).
 *   • THE HIGH PLATEAU (≈16 m up) fills the north behind the escarpment: the
 *     upper river, the Sky Shrine, a lookout at the lip of the falls.
 *   • Big tree-covered HILLS: Canopy Hill (27 m, a spiral trail to the
 *     Canopy Lookout), Mossback Ridge (24 m, a long crest that walks you up
 *     onto the plateau), Fern Hill, and the open, flowery Sunny Knoll.
 *   • Landmarks: the mossy Temple Ruins (a stream runs out of its arch),
 *     Redwood Hollow (giant trees + sunbeams), the Vine Cliffs, the Great
 *     Tree (spiral stair → treehouse → rope bridge to the ridge), the
 *     Mushroom Glade (bouncy toadstools), the Palm Grove and the lagoon.
 *
 * WAYS UP ("scaling" the world): walk the hills; the Waterfall Stairs; the
 * ridge crest; the VINE WALLS (push into them to climb); hop the LEAF POLES;
 * bounce on the MUSHROOMS; climb the Great Tree's spiral stair.
 *
 * Coordinates: x = east, z = SOUTH (three.js), so north is −z.
 *
 * LAYERED GROUND: the ground function takes the player's current height y.
 * Terrain (and "solid" structures) always count; THIN structures (bridges,
 * leaf pads, the treehouse, the tree's spiral stair) only count when they
 * are at or below y + STEP_UP — so you can walk UNDER a bridge or a stair
 * and stand ON it, and windings of a spiral can overlap in plan.
 */

// ---------------------------------------------------------------------------
// Identity + basics
// ---------------------------------------------------------------------------
export const JUNGLE_REGION_ID = "emerald-jungle";
export const JUNGLE_NAME = "Emerald Jungle";

// Mirrors systems/collisionEngine.js (importing it here would form an import
// cycle through worldColliders) — the checks assert they match.
export const J_STEP_UP = 0.45;
/** Mirrors Player.jsx's GRAVITY — the bounce pads' launch speeds are sized with it. */
export const BOUNCE_GRAVITY = 20;

const TAU = Math.PI * 2;
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
export function smoothstep(a, b, v) {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
function segDistT(x, z, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const L2 = dx * dx + dz * dz || 1e-9;
  const t = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1);
  return { d: Math.hypot(x - (ax + dx * t), z - (az + dz * t)), t };
}

// --- deterministic value noise + fbm (shared by terrain, scatter, renderer).
function ihash(ix, iz, seed) {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iz | 0, 668265263) ^ Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function vnoise(x, z, seed = 0) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = ihash(ix, iz, seed), b = ihash(ix + 1, iz, seed), c = ihash(ix, iz + 1, seed), d = ihash(ix + 1, iz + 1, seed);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
export function fbm(x, z, oct = 4, seed = 0) {
  let v = 0, amp = 0.5, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) {
    v += amp * vnoise(x * f, z * f, seed + i * 17);
    norm += amp; amp *= 0.5; f *= 2.03;
  }
  return v / norm;
}
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Catmull-Rom resample of a control polyline at ~`step` m spacing. */
export function smoothPolyline(ctrl, step = 1.5) {
  const out = [];
  const P = (i) => ctrl[clamp(i, 0, ctrl.length - 1)];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push([...ctrl[ctrl.length - 1]]);
  return out;
}
function cumLengths(pts) {
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return s;
}

// ---------------------------------------------------------------------------
// THE VALLEY + its RIM MOUNTAINS
// ---------------------------------------------------------------------------
// The valley floor is an oval; outside its (wavy) edge the rim mountains rise
// far too steeply to walk up (the slide hook keeps you in), so the world has
// a natural edge. The bounds circle only stops a launched player flying off.
export const VALLEY = { ax: 128, az: 168 };
export const JUNGLE_BOUNDS = { shape: "circle", radius: 182, center: [0, 0] };

/** q = normalised oval radius (1 = the rim's foot), edge = the wavy foot. */
export function rimCoords(x, z) {
  const ux = x / VALLEY.ax, uz = z / VALLEY.az;
  const q = Math.hypot(ux, uz);
  const th = Math.atan2(uz, ux);
  const edge = 1 + 0.042 * Math.sin(5 * th + 1.1) + 0.028 * Math.sin(8 * th + 0.3) + 0.018 * Math.sin(13 * th + 2.2);
  return { q, edge, th };
}
function rimHeight(x, z) {
  const { q, edge } = rimCoords(x, z);
  if (q < edge - 0.02) return 0;
  const rise = smoothstep(edge - 0.02, edge + 0.2, q);
  const peaks = 44 + 30 * fbm(x / 70 + 11, z / 70 - 4, 3, 5);
  // Keep climbing gently past the band (hides the grid's far edge).
  return rise * peaks + Math.max(0, q - edge - 0.2) * 120;
}

// ---------------------------------------------------------------------------
// THE ESCARPMENT + HIGH PLATEAU (north)
// ---------------------------------------------------------------------------
export const PLATEAU_H = 16;
// The cliff's foot line (z as a function of x); north of it the plateau.
const ESC_CTRL = [
  [-170, -114], [-126, -110], [-92, -105], [-66, -104], [-48, -101.5], [-34, -101], [-18, -101],
  [-4, -99.5], [8, -97.5], [20, -96.5], [30, -96], [56, -96], [70, -100], [90, -108], [120, -116], [170, -124],
];
const ESC_SAMPLES = (() => {
  const pts = smoothPolyline(ESC_CTRL, 1);
  // Re-sample to x-monotone 1 m steps.
  const out = [];
  for (let x = -170; x <= 170; x++) {
    let z = pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) {
      if (pts[i][0] <= x && pts[i + 1][0] >= x) {
        const t = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0] || 1);
        z = lerp(pts[i][1], pts[i + 1][1], t);
        break;
      }
      if (pts[i][0] > x) break;
      z = pts[i + 1][1];
    }
    out.push(z);
  }
  return out;
})();
/** z of the escarpment's FOOT at x. */
export function escarpZ(x) {
  const f = clamp(x + 170, 0, 339.999);
  const i = Math.floor(f), t = f - i;
  return lerp(ESC_SAMPLES[i], ESC_SAMPLES[i + 1], t);
}
// Cliff width (foot → lip, metres). Sheer (2.6 m) at the Vine Cliffs and the
// falls, steep everywhere else.
export function escarpWidth(x) {
  const sheer = Math.max(
    smoothstep(-52, -46, x) * (1 - smoothstep(-16, -10, x)), // Vine Cliffs
    smoothstep(0, 5, x) * (1 - smoothstep(22, 27, x)) // the falls
  );
  const stairs = smoothstep(24, 28, x) * (1 - smoothstep(58, 64, x)); // Waterfall Stairs
  return lerp(lerp(7, 4, stairs), 2.6, sheer);
}
/** 0 on the valley floor → 1 on the plateau (u = metres north of the foot). */
function plateauBlend(x, z) {
  const u = escarpZ(x) - z;
  const w = escarpWidth(x);
  const t = clamp((u + 0.5) / (w + 1.0), 0, 1);
  return lerp(t, t * t * (3 - 2 * t), 0.55);
}

// ---------------------------------------------------------------------------
// HILLS
// ---------------------------------------------------------------------------
// Each: centre (or a capsule a→b), radii, height, flat-top fraction. Bell
// profile (cos), domain-warped so they never look like perfect domes. Every
// hill's max grade stays walkable (≈0.85) — cliffs are separate features.
export const HILLS = [
  { id: "canopy", name: "Canopy Hill", c: [-72, 72], rx: 61, rz: 57, h: 26, flat: 0.12, warp: 0.04 },
  // The ridge is a capsule a→b with a gentle WEST flank (walk up it anywhere)
  // and a steep east flank down into the rim.
  { id: "mossback", name: "Mossback Ridge", a: [86, -106], b: [90, 44], rw: 46, re: 30, h: 23, flat: 0.08, warp: 0.05 },
  { id: "sunny", name: "Sunny Knoll", c: [54, 70], rx: 25, rz: 23, h: 10, flat: 0.28, warp: 0.06 },
  { id: "fern", name: "Fern Hill", c: [-98, -26], rx: 41, rz: 37, h: 16, flat: 0.1, warp: 0.06 },
  // Plateau rises: the Sky Shrine sits on one.
  { id: "shrine-rise", c: [-24, -137], rx: 26, rz: 21, h: 4.5, flat: 0.3, warp: 0.06, onPlateau: true },
  { id: "plateau-knoll", c: [44, -142], rx: 20, rz: 17, h: 5, flat: 0, warp: 0.08, onPlateau: true },
  // The arrival glade sits on a gentle rise: you look out over the canopy.
  { id: "arrival-rise", c: [2, 153], rx: 36, rz: 27, h: 8, flat: 0.22, warp: 0.05 },
  { id: "knoll-sw", c: [-62, 132], rx: 18, rz: 14, h: 5, flat: 0, warp: 0.1 },
  { id: "knoll-se", c: [100, 96], rx: 20, rz: 18, h: 7, flat: 0, warp: 0.1 },
  { id: "knoll-c", c: [24, 36], rx: 14, rz: 12, h: 3.2, flat: 0, warp: 0.1 },
  { id: "knoll-ne", c: [42, -46], rx: 13, rz: 12, h: 3.4, flat: 0, warp: 0.1 },
  { id: "knoll-w", c: [-92, 34], rx: 18, rz: 16, h: 6, flat: 0, warp: 0.1 },
  { id: "knoll-nw", c: [-28, -48], rx: 12, rz: 11, h: 2.6, flat: 0, warp: 0.1 },
  { id: "knoll-s", c: [-14, 88], rx: 12, rz: 10, h: 2.4, flat: 0, warp: 0.1 },
  { id: "knoll-e", c: [16, 112], rx: 13, rz: 9, h: 2.2, flat: 0, warp: 0.1 },
];
function hillT(hl, x, z) {
  const w = hl.warp * (fbm(x / 26 + hl.h, z / 26 - hl.h, 2, 9) - 0.5) * 2;
  if (hl.a) {
    const { d } = segDistT(x, z, hl.a[0], hl.a[1], hl.b[0], hl.b[1]);
    // Which flank? (east = the side the axis normal (dz, −dx) points to)
    const dx = hl.b[0] - hl.a[0], dz = hl.b[1] - hl.a[1];
    const east = (x - hl.a[0]) * dz - (z - hl.a[1]) * dx > 0;
    return d / (east ? hl.re : hl.rw) + w;
  }
  return Math.hypot((x - hl.c[0]) / hl.rx, (z - hl.c[1]) / hl.rz) + w;
}
function hillHeight(hl, x, z) {
  const t = hillT(hl, x, z);
  if (t >= 1) return 0;
  const tt = hl.flat > 0 ? Math.max(0, (t - hl.flat) / (1 - hl.flat)) : t;
  return hl.h * 0.5 * (1 + Math.cos(Math.PI * tt));
}
export function hillTop(id) {
  const hl = HILLS.find((h) => h.id === id);
  return hl.c ? [...hl.c] : [(hl.a[0] + hl.b[0]) / 2, (hl.a[1] + hl.b[1]) / 2];
}

// ---------------------------------------------------------------------------
// VALLEY FLOOR + RAW TERRAIN (no water, paths or clearings yet)
// ---------------------------------------------------------------------------
function floorHeight(x, z) {
  return (
    1.4 - 0.011 * z +
    3.2 * (fbm(x / 48 + 3, z / 48 - 2, 3, 1) - 0.5) +
    0.9 * (fbm(x / 15 - 5, z / 15 + 8, 2, 6) - 0.5) +
    0.3 * (fbm(x / 5, z / 5, 2, 2) - 0.5)
  );
}
function plateauHeight(x, z) {
  const u = escarpZ(x) - z;
  const inland = smoothstep(escarpWidth(x) + 2, escarpWidth(x) + 26, u);
  return PLATEAU_H + inland * 2.4 * (fbm(x / 38 - 7, z / 38 + 5, 3, 3) - 0.35);
}
function smax(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
}
/** Height before rivers / paths / clearings are carved in. */
export function rawHeight(x, z) {
  const F = floorHeight(x, z);
  const p = plateauBlend(x, z);
  const base = p > 0 ? lerp(F, plateauHeight(x, z), p) : F;
  let hill = 0, phill = 0;
  for (const hl of HILLS) {
    const h = hillHeight(hl, x, z);
    if (hl.onPlateau) { if (h > phill) phill = h; } else if (h > hill) hill = h;
  }
  let h = hill > 0.01 ? smax(base, F + hill + hill * 0.045 * (fbm(x / 11, z / 11, 2, 4) - 0.5), 2.5) : base;
  if (phill > 0.01) h += phill * p;
  h += rimHeight(x, z);
  return h;
}

// ---------------------------------------------------------------------------
// WATER — the lower river, the upper (plateau) river, the temple stream, the
// waterfall pool and the Lily Lagoon. Every channel is KNEE-DEEP: the bed sits
// WATER_DEPTH below the surface, the bank tops BANK_UP above it.
// ---------------------------------------------------------------------------
export const WATER_DEPTH = 0.62;
export const BANK_UP = 0.3;

export const FALLS_POOL = { center: [13, -88.5], radius: 8.2, level: 2.7 };
export const LAGOON = { center: [66, 127], rx: 25, rz: 16.5, level: 0.3 };

function makeRiver(id, ctrl, w0, w1, level0, level1, step = 1.5) {
  const pts = smoothPolyline(ctrl, step);
  const s = cumLengths(pts);
  const len = s[s.length - 1];
  const hw = s.map((v) => lerp(w0, w1, v / len));
  const lvl = s.map((v) => lerp(level0, level1, v / len));
  return { id, pts, s, len, hw, lvl };
}
// The lower river: out of the falls pool, south down the valley, into the lagoon.
export const RIVER = makeRiver("river", [
  [15, -82], [19, -70], [18, -54], [9, -37], [-2, -21], [-8, -3], [-8, 17], [-1, 37], [9, 56],
  [18, 74], [28, 91], [40, 105], [50, 114], [56, 120],
], 3.6, 5.2, FALLS_POOL.level - 0.05, LAGOON.level);
// The upper river: from a spring cave in the north rim, across the plateau, to
// the lip of the falls.
export const UPPER_RIVER = makeRiver("upper", [
  [-8, -162], [-13, -149], [-6, -135], [6, -124], [11, -112], [12.2, -104], [12.5, -100.1],
], 2.4, 3.0, 16.7, 16.05);
// The upper river stops dead at the lip of the falls (no rounded end cap
// carving over the cliff).
UPPER_RIVER.openEnd = true;
{
  const n = UPPER_RIVER.pts.length;
  const a = UPPER_RIVER.pts[n - 2], b = UPPER_RIVER.pts[n - 1];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  UPPER_RIVER.endDir = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
}
// The temple stream: out of the temple's arch, east to the river. (Its level
// ends just above the river's level where they meet — computed below.)
const STREAM_CTRL = [[-55.5, -16], [-46, -16.5], [-34, -15], [-22, -14.5], [-12, -14], [-4.5, -12.5]];
function riverLevelNear(rv, x, z) {
  let best = Infinity, lv = rv.lvl[0];
  for (let i = 0; i < rv.pts.length; i++) {
    const d = Math.hypot(x - rv.pts[i][0], z - rv.pts[i][1]);
    if (d < best) { best = d; lv = rv.lvl[i]; }
  }
  return lv;
}
const STREAM_END_LEVEL = riverLevelNear(RIVER, -4.5, -12.5) + 0.02;
export const TEMPLE_STREAM = makeRiver("stream", STREAM_CTRL, 1.4, 1.9, STREAM_END_LEVEL + 0.55, STREAM_END_LEVEL, 1.0);
export const RIVERS = [RIVER, UPPER_RIVER, TEMPLE_STREAM];

// The falls: the upper river pours over the lip into the pool.
export const FALLS = (() => {
  const lip = UPPER_RIVER.pts[UPPER_RIVER.pts.length - 1];
  return {
    lip: [lip[0], lip[1]],
    top: UPPER_RIVER.lvl[UPPER_RIVER.lvl.length - 1],
    bottom: FALLS_POOL.level,
    halfWidth: 3.1,
    // Where the curtain meets the pool.
    foot: [FALLS_POOL.center[0] - 0.3, escarpZ(FALLS_POOL.center[0]) + 2.2],
  };
})();

// Segment index for fast "nearest river point" queries.
const SEG_CELL = 16;
function buildSegIndex(items) {
  // items: [{ ax, az, bx, bz, ...payload, reach }]
  const map = new Map();
  for (const it of items) {
    const x0 = Math.floor((Math.min(it.ax, it.bx) - it.reach) / SEG_CELL), x1 = Math.floor((Math.max(it.ax, it.bx) + it.reach) / SEG_CELL);
    const z0 = Math.floor((Math.min(it.az, it.bz) - it.reach) / SEG_CELL), z1 = Math.floor((Math.max(it.az, it.bz) + it.reach) / SEG_CELL);
    for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) {
      const k = i * 4096 + j;
      let arr = map.get(k);
      if (!arr) { arr = []; map.set(k, arr); }
      arr.push(it);
    }
  }
  return (x, z) => map.get(Math.floor(x / SEG_CELL) * 4096 + Math.floor(z / SEG_CELL)) || [];
}
const RIVER_REACH = 18; // banks blend out to hw + 16
const riverSegs = buildSegIndex(RIVERS.flatMap((rv) => rv.pts.slice(0, -1).map((p, i) => ({
  rv, i, ax: p[0], az: p[1], bx: rv.pts[i + 1][0], bz: rv.pts[i + 1][1], reach: rv.hw[i] + RIVER_REACH,
}))));

/** Nearest channel to (x, z): { d (from centre line), hw, level, rv, s } or null. */
export function nearestChannel(x, z) {
  let best = null, bd = Infinity;
  for (const sg of riverSegs(x, z)) {
    if (sg.rv.openEnd) {
      // Past the open end (beyond the plane through the last point)? Then
      // this channel doesn't reach here at all — no rounded end cap.
      const e = sg.rv.pts[sg.rv.pts.length - 1];
      if ((x - e[0]) * sg.rv.endDir[0] + (z - e[1]) * sg.rv.endDir[1] > -0.02) continue;
    }
    const { d, t } = segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz);
    const hw = lerp(sg.rv.hw[sg.i], sg.rv.hw[sg.i + 1], t);
    const e = d - hw;
    if (e < bd) {
      bd = e;
      best = { d, hw, level: lerp(sg.rv.lvl[sg.i], sg.rv.lvl[sg.i + 1], t), rv: sg.rv, s: lerp(sg.rv.s[sg.i], sg.rv.s[sg.i + 1], t), i: sg.i, t };
    }
  }
  return best;
}
/** Elliptical "distance outside the edge" (≈ metres) for the lagoon. */
function lagoonEdgeDist(x, z) {
  const L = LAGOON;
  const q = Math.hypot((x - L.center[0]) / L.rx, (z - L.center[1]) / L.rz);
  return (q - 1) * Math.min(L.rx, L.rz) * (q < 1 ? 1 : 1.15);
}
function poolEdgeDist(x, z) {
  return Math.hypot(x - FALLS_POOL.center[0], z - FALLS_POOL.center[1]) - FALLS_POOL.radius;
}
// Bank cross-section: e = metres outside the water's edge (− = in the water).
function bankProfile(level, e) {
  return level - WATER_DEPTH + (WATER_DEPTH + BANK_UP) * smoothstep(-2.2, 0.6, e) + 0.09 * Math.max(0, e - 0.6);
}

// ---------------------------------------------------------------------------
// CLEARINGS (the ten reserved areas for future challenges) + ARRIVAL
// ---------------------------------------------------------------------------
export const ARRIVAL_GLADE = { center: [0, 137], radius: 10 };
export const JUNGLE_SPAWN = { x: 0, z: 134.5 };
// Green return portal → Number Island, on the glade's south-west edge — off to
// the side so it never blocks the arrival view up the valley.
export const JUNGLE_RETURN_PORTAL = [-8.2, 142.2];
export const JUNGLE_RETURN_PORTAL_YAW = Math.atan2(8.2, -5.2); // faces the glade centre
export const JUNGLE_WELCOME_SIGN = { position: [5.6, 129.5], rotationY: -0.3, text: "Welcome to the Emerald Jungle" };

export const JUNGLE_SPOTS = [
  { id: "palm", label: "Palm Grove", center: [-25, 101], radius: 7.5 },
  { id: "lagoon", label: "Lily Lagoon", center: [70, 102.5], radius: 7.5 },
  { id: "knoll", label: "Sunny Knoll", center: [54, 70], radius: 7.5 },
  { id: "canopy", label: "Canopy Lookout", center: [-72, 72], radius: 7.5 },
  { id: "mushroom", label: "Mushroom Glade", center: [-44, 29], radius: 7.5 },
  { id: "temple", label: "Temple Ruins", center: [-42, -23], radius: 8 },
  { id: "greattree", label: "The Great Tree", center: [22, 4], radius: 7.5 },
  { id: "hollow", label: "Redwood Hollow", center: [-62, -63], radius: 8 },
  { id: "pool", label: "Waterfall Pool", center: [-6, -81], radius: 7 },
  { id: "shrine", label: "Sky Shrine", center: [-24, -134], radius: 8 },
];
export const JUNGLE_LANDMARKS = {
  vineCliffs: { label: "Vine Cliffs", center: [-32, -95] },
  fallsLookout: { label: "Falls Lookout", center: [23, -103] },
  ridgeTop: { label: "Mossback Ridge", center: [86, -34] },
  treehouse: { label: "Treehouse", center: [38, -8] },
  toadstool: { label: "Giant Toadstool", center: [-60, 20] },
};

// ---------------------------------------------------------------------------
// PATHS (smoothed polylines). Dirt trails with stones; flattened across.
// ---------------------------------------------------------------------------
function spiralTrail() {
  // Canopy Hill: a trail that winds up from its east foot to the summit.
  const c = HILLS[0].c;
  // Leaves trail-west north of the Palm Grove (clear of the grove's cut bank).
  const pts = [[-31, 84], [-38, 87]];
  const a0 = Math.atan2(87 - c[1], -38 - c[0]);
  const turns = 1.1;
  const n = 26;
  for (let i = 1; i <= n; i++) {
    const f = i / n;
    const a = a0 + f * turns * TAU;
    const r = lerp(37, 7.2, Math.pow(f, 0.9));
    pts.push([c[0] + Math.cos(a) * r * 1.05, c[1] + Math.sin(a) * r * 0.96]);
  }
  return pts;
}
const PATH_CTRL = [
  { id: "trail-west", hw: 1.7, ctrl: [[1, 128], [-5, 118], [-15, 109], [-25, 101], [-30, 88], [-32, 72], [-37, 52], [-44, 29], [-47, 11], [-46, -6], [-42, -23]] },
  { id: "trail-hollow", hw: 1.6, ctrl: [[-42, -23], [-49, -38], [-57, -50], [-62, -63], [-58, -76], [-47, -85], [-33, -86.5], [-19, -84.5], [-6, -81]] },
  { id: "trail-ford", hw: 1.6, ctrl: [[-6, -81], [3, -74], [12, -69], [22, -66], [33, -62]] },
  { id: "trail-east", hw: 1.7, ctrl: [[33, -62], [37, -48], [35, -32], [29, -17], [22, 4], [29, 21], [40, 36], [48, 50], [57, 52], [63, 57], [62, 63], [54, 70], [60, 86], [70, 102.5]] },
  { id: "trail-south", hw: 1.7, ctrl: [[70, 102.5], [60, 108], [49, 113], [37, 119], [24, 126], [12, 131], [4, 133]] },
  { id: "trail-temple", hw: 1.6, ctrl: [[-42, -23], [-31, -24.5], [-18, -24], [-6, -22.5], [8, -21], [19, -18.5], [29, -17]] },
  { id: "trail-canopy", hw: 1.4, ctrl: spiralTrail() },
  { id: "trail-ridge", hw: 1.5, ctrl: [[29, -17], [42, -24], [54, -30], [66, -38], [76, -52], [82, -68], [84, -86], [80, -102], [68, -111], [54, -112], [40, -109], [27, -104]] },
  { id: "trail-plateau", hw: 1.5, ctrl: [[26, -104], [17, -110], [6, -118], [-6, -126], [-16, -132], [-24, -134], [-33, -133], [-38, -128], [-37, -120], [-34, -110], [-34, -106]] },
  { id: "trail-stairs", hw: 1.5, ctrl: [[33, -62], [40, -72], [47, -82], [55, -84], [59, -88.5], [59.5, -92]] },
  { id: "trail-mushroom", hw: 1.3, ctrl: [[-44, 29], [-52, 26], [-56, 22]] },
];
export const JUNGLE_PATHS = PATH_CTRL.map((p) => ({ id: p.id, hw: p.hw, pts: smoothPolyline(p.ctrl, 2) }));
const pathSegs = buildSegIndex(JUNGLE_PATHS.flatMap((p) => p.pts.slice(0, -1).map((a, i) => ({
  p, i, ax: a[0], az: a[1], bx: p.pts[i + 1][0], bz: p.pts[i + 1][1], reach: p.hw + 8,
}))));
/** Nearest path: { e: metres outside its edge (− = on it), cx, cz (centre point) } */
export function nearestPath(x, z) {
  let best = null, be = Infinity;
  for (const sg of pathSegs(x, z)) {
    const { d, t } = segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz);
    const e = d - sg.p.hw;
    if (e < be) { be = e; best = { e, cx: lerp(sg.ax, sg.bx, t), cz: lerp(sg.az, sg.bz, t), p: sg.p }; }
  }
  return best;
}
export function pathEdgeDist(x, z) {
  const n = nearestPath(x, z);
  let d = n ? n.e : Infinity;
  for (const s of JUNGLE_SPOTS) d = Math.min(d, Math.hypot(x - s.center[0], z - s.center[1]) - s.radius);
  d = Math.min(d, Math.hypot(x - ARRIVAL_GLADE.center[0], z - ARRIVAL_GLADE.center[1]) - ARRIVAL_GLADE.radius);
  return d;
}

// ---------------------------------------------------------------------------
// THE CARVED TERRAIN (water + clearings + paths) → a 1 m grid
// ---------------------------------------------------------------------------
// Flattened pads: the clearings, the arrival glade, the Great Tree's foot and
// a few set-piece footprints. level = "auto" → the raw height at the centre.
export const GREAT_TREE = { center: [38, -8], trunkR: 5.0, visualR: 5.5, deckY: 20, deckR: 11.2 };
export const MUSHROOM_LEDGE = { center: [-58.5, 31.5], radius: 4.6, rise: 5.0 };
const FLATS = [
  ...JUNGLE_SPOTS.map((s) => ({ c: s.center, r: s.radius, blend: 4.5 })),
  { c: ARRIVAL_GLADE.center, r: ARRIVAL_GLADE.radius, blend: 5 },
  { c: GREAT_TREE.center, r: 9.5, blend: 5 },
  { c: [-60, 20], r: 5, blend: 4 }, // the giant toadstool's foot
  { c: [-61, -18], r: 13.5, blend: 5, levelOf: "temple" }, // the temple's footing
];
for (const f of FLATS) f.level = rawHeight(f.c[0], f.c[1]);
for (const f of FLATS) if (f.levelOf) f.level = FLATS.find((g) => g.c === JUNGLE_SPOTS.find((s) => s.id === f.levelOf).center).level;

function waterCarve(x, z, h) {
  // The NEAREST water body (river channel, pool or lagoon) owns the banks:
  // inside its edge the bed is cut to the knee-deep profile; just outside,
  // low ground is raised into a little levee (water is never perched above
  // dry land) and gentle ground eases down to a soft bank — but ground that
  // TOWERS over the water (a cliff, a steep hill) keeps its shape.
  let e = Infinity, level = 0;
  const ch = nearestChannel(x, z);
  if (ch) { e = ch.d - ch.hw; level = ch.level; }
  const ep = poolEdgeDist(x, z);
  if (ep < e) { e = ep; level = FALLS_POOL.level; }
  const el = lagoonEdgeDist(x, z);
  if (el < e) { e = el; level = LAGOON.level; }
  if (e >= 16) return h;
  const prof = bankProfile(level, e);
  if (e < 0.6) return prof;
  // …but a clearing near the water keeps its middle level: the easing fades
  // out across a wide ring round it (a narrow one would leave a step).
  const soft = lerp(prof, h, Math.max(smoothstep(3, 16, e), clearingKeep(x, z)));
  return lerp(soft, h, smoothstep(2.5, 7, h - prof));
}
/** 1 over a clearing's middle, fading to 0 across a wide ring beyond its rim. */
function clearingKeep(x, z) {
  let m = 0;
  for (const f of FLATS) {
    const d = Math.hypot(x - f.c[0], z - f.c[1]);
    if (d < f.r + 12) m = Math.max(m, 1 - smoothstep(f.r * 0.6, f.r + 12, d));
  }
  return m;
}
function flatten(x, z, h) {
  let out = h;
  for (const f of FLATS) {
    const d = Math.hypot(x - f.c[0], z - f.c[1]);
    if (d > f.r + f.blend + 7) continue;
    // A deeper cut/fill at the pad's rim (in this direction) → a wider
    // blend, so the bank stays walkable.
    const k = (f.r + 1) / Math.max(d, 1e-3);
    const dEdge = Math.abs(rawHeight(f.c[0] + (x - f.c[0]) * k, f.c[1] + (z - f.c[1]) * k) - f.level);
    const blend = f.blend + Math.min(7, dEdge * 1.4);
    if (d < f.r + blend) out = lerp(f.level, out, smoothstep(f.r, f.r + blend, d));
  }
  return out;
}
/** The full carved height (before grid sampling). */
export function carvedHeight(x, z) {
  let h = rawHeight(x, z);
  // Paths: flatten ACROSS the path to its centre-line height.
  // On a hillside the blend widens with the cut/fill depth, so a trail never
  // leaves a too-steep bank you can't step across.
  const np = nearestPath(x, z);
  if (np && np.e < 8) {
    const hc = rawHeight(np.cx, np.cz);
    const dh = Math.abs(h - hc);
    const span = 2.6 + Math.min(5.4, dh * 1.6);
    if (np.e < span) {
      // Steep cross-slope → only PART-flatten (the trail keeps a gentle tilt).
      const cross = dh / Math.max(1, np.e + np.p.hw);
      const f = lerp(1, 0.3, smoothstep(0.1, 0.45, cross));
      h = lerp(h, hc, f * (1 - smoothstep(0.3, span, np.e)));
    }
  }
  h = flatten(x, z, h);
  h = waterCarve(x, z, h);
  return h;
}

// Precomputed 1 m grid (lazy) — the terrain mesh is built from the SAME grid,
// so what you see is what you stand on. Also: the water level grid (NaN = dry)
// and the slope grid (for the slide hook + the renderer's rock blend).
export const GRID = { xMin: -164, xMax: 164, zMin: -212, zMax: 212, step: 1 };
GRID.nx = Math.round((GRID.xMax - GRID.xMin) / GRID.step) + 1;
GRID.nz = Math.round((GRID.zMax - GRID.zMin) / GRID.step) + 1;
let _grid = null;
export function getJungleGrid() {
  if (_grid) return _grid;
  const { nx, nz } = GRID;
  const h = new Float32Array(nx * nz);
  const water = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    const z = GRID.zMin + j * GRID.step;
    for (let i = 0; i < nx; i++) {
      const x = GRID.xMin + i * GRID.step;
      const k = j * nx + i;
      h[k] = carvedHeight(x, z);
      water[k] = waterLevelRaw(x, z);
    }
  }
  const slope = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      const hx = h[j * nx + Math.min(nx - 1, i + 1)] - h[j * nx + Math.max(0, i - 1)];
      const hz = h[Math.min(nz - 1, j + 1) * nx + i] - h[Math.max(0, j - 1) * nx + i];
      slope[k] = Math.hypot(hx, hz) / (2 * GRID.step);
    }
  }
  _grid = { h, water, slope };
  return _grid;
}
function gridCoords(x, z) {
  const fx = clamp((x - GRID.xMin) / GRID.step, 0, GRID.nx - 1.0001);
  const fz = clamp((z - GRID.zMin) / GRID.step, 0, GRID.nz - 1.0001);
  const i = Math.floor(fx), j = Math.floor(fz);
  return { i, j, tx: fx - i, tz: fz - j };
}
/** Terrain height (exactly matching the rendered mesh's triangles). */
export function terrainHeight(x, z) {
  const g = getJungleGrid().h;
  const { i, j, tx, tz } = gridCoords(x, z);
  const n = GRID.nx;
  const a = g[j * n + i], b = g[j * n + i + 1], c = g[(j + 1) * n + i], d = g[(j + 1) * n + i + 1];
  if (tx + tz <= 1) return a + (b - a) * tx + (c - a) * tz;
  return d + (c - d) * (1 - tx) + (b - d) * (1 - tz);
}
export function slopeAt(x, z) {
  const s = getJungleGrid().slope;
  const { i, j, tx, tz } = gridCoords(x, z);
  const n = GRID.nx;
  return lerp(lerp(s[j * n + i], s[j * n + i + 1], tx), lerp(s[(j + 1) * n + i], s[(j + 1) * n + i + 1], tx), tz);
}

/** Metres from (x, z) to the nearest water edge (− = in the water). */
export function waterEdgeDist(x, z) {
  let e = Infinity;
  const ch = nearestChannel(x, z);
  if (ch) e = ch.d - ch.hw;
  return Math.min(e, poolEdgeDist(x, z), lagoonEdgeDist(x, z));
}

/** Water surface level at (x, z) from the analytic channels (NaN = none). */
function waterLevelRaw(x, z) {
  let lvl = NaN;
  const ch = nearestChannel(x, z);
  if (ch && ch.d < ch.hw + 1.2) lvl = ch.level;
  if (poolEdgeDist(x, z) < 1.2) lvl = Number.isNaN(lvl) ? FALLS_POOL.level : Math.max(lvl, FALLS_POOL.level);
  if (lagoonEdgeDist(x, z) < 1.2) lvl = Number.isNaN(lvl) ? LAGOON.level : Math.max(lvl, LAGOON.level);
  return lvl;
}
/** Water surface height where the ground is actually under water, else null. */
export function jungleWaterAt(x, z) {
  const g = getJungleGrid();
  const { i, j, tx, tz } = gridCoords(x, z);
  const k = (tz < 0.5 ? j : j + 1) * GRID.nx + (tx < 0.5 ? i : i + 1);
  const lvl = g.water[k];
  if (Number.isNaN(lvl)) return null;
  return terrainHeight(x, z) < lvl - 0.02 ? lvl : null;
}

// ---------------------------------------------------------------------------
// STRUCTURES — everything you stand on that isn't terrain. Each has
//   topAt(x, z, lim) → the highest walkable top here that is ≤ lim, or null
//   solid: true → counts regardless of lim (you can't be under it)
// ---------------------------------------------------------------------------
const STRUCTS = [];
function addStruct(s) { STRUCTS.push(s); return s; }

// --- Bridges (arched decks; thin — you can wade under them). -----------------
function bridge(id, style, from, to, halfWidth, apex, extra = {}) {
  const h0 = extra.h0 ?? Math.max(terrainHeightLazy(from[0], from[1]), 0);
  const h1 = extra.h1 ?? Math.max(terrainHeightLazy(to[0], to[1]), 0);
  const b = { id, style, from, to, halfWidth, apex, h0, h1, sag: extra.sag || 0, kind: "bridge" };
  b.deckAt = (t) => lerp(b.h0, b.h1, t) + b.apex * Math.sin(Math.PI * t) - b.sag * 4 * t * (1 - t);
  b.topAt = (x, z, lim) => {
    const ax = b.from[0], az = b.from[1], dx = b.to[0] - ax, dz = b.to[1] - az;
    const L2 = dx * dx + dz * dz || 1;
    const t = ((x - ax) * dx + (z - az) * dz) / L2;
    if (t < 0 || t > 1) return null;
    if (Math.hypot(x - (ax + dx * t), z - (az + dz * t)) > b.halfWidth) return null;
    const hh = b.deckAt(t);
    return hh <= lim ? hh : null;
  };
  b.bbox = [Math.min(from[0], to[0]) - halfWidth, Math.max(from[0], to[0]) + halfWidth, Math.min(from[1], to[1]) - halfWidth, Math.max(from[1], to[1]) + halfWidth];
  return addStruct(b);
}
// Terrain height used while BUILDING structures (the grid is built lazily on
// first use, so module-level structure definitions can sample it).
function terrainHeightLazy(x, z) { return terrainHeight(x, z); }

// --- Discs: leaf pads, lily pads, mushroom caps, stepping stones, ledges. ----
function disc(id, kind, c, r, top, solid, extra = {}) {
  const d = { id, kind, c, r, top, solid, ...extra };
  d.topAt = (x, z, lim) => (Math.hypot(x - c[0], z - c[1]) <= r && (solid || top <= lim) ? top : null);
  d.bbox = [c[0] - r, c[0] + r, c[1] - r, c[1] + r];
  return addStruct(d);
}

/**
 * A mushroom cap is a DOME, not a drum: its walkable top falls MUSHROOM_DOME
 * from the middle to the rim (matching the rounded caps you see). So a hop
 * onto it never catches the cap's side, and landing anywhere on it bounces.
 */
export const MUSHROOM_DOME = 0.45;
function domeCap(d) {
  d.dome = MUSHROOM_DOME;
  d.heightAt = (x, z) => {
    const q = Math.hypot(x - d.c[0], z - d.c[1]) / d.r;
    return q > 1 ? null : d.top - d.dome * q * q;
  };
  d.topAt = (x, z, lim) => {
    const t = d.heightAt(x, z);
    return t !== null && (d.solid || t <= lim) ? t : null;
  };
  return d;
}

// --- Straight stair flights (solid stone/wood blocks). ------------------------
// Runs from a (bottom, height h0) to b (top, h1), `width` wide, n steps.
function flight(id, a, b, h0, h1, width, n, extra = {}) {
  const f = { id, kind: "stairs", a, b, h0, h1, width, n, solid: true, ...extra };
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const L = Math.hypot(dx, dz);
  f.len = L; f.dir = [dx / L, dz / L];
  f.stepAt = (t) => h0 + ((h1 - h0) * Math.min(n, Math.floor(t * n) + 1)) / n;
  f.topAt = (x, z) => {
    const t = ((x - a[0]) * dx + (z - a[1]) * dz) / (L * L);
    if (t < 0 || t > 1) return null;
    const perp = Math.abs((x - a[0]) * f.dir[1] - (z - a[1]) * f.dir[0]);
    if (perp > width / 2) return null;
    return f.stepAt(t);
  };
  f.bbox = [Math.min(a[0], b[0]) - width, Math.max(a[0], b[0]) + width, Math.min(a[1], b[1]) - width, Math.max(a[1], b[1]) + width];
  return addStruct(f);
}
// --- Flat rectangles (landings, decks, temple blocks). ------------------------
function rect(id, kind, cx, cz, hx, hz, top, solid, rot = 0, extra = {}) {
  const r = { id, kind, c: [cx, cz], hx, hz, top, solid, rot, ...extra };
  const cs = Math.cos(rot), sn = Math.sin(rot);
  r.local = (x, z) => [(x - cx) * cs - (z - cz) * sn, (x - cx) * sn + (z - cz) * cs];
  r.topAt = (x, z, lim) => {
    const [lx, lz] = r.local(x, z);
    if (Math.abs(lx) > hx || Math.abs(lz) > hz) return null;
    return solid || top <= lim ? top : null;
  };
  const R = Math.hypot(hx, hz);
  r.bbox = [cx - R, cx + R, cz - R, cz + R];
  return addStruct(r);
}

// ---------------------------------------------------------------------------
// The structures themselves — built lazily (they sample the terrain grid).
// ---------------------------------------------------------------------------
export const JUNGLE_BRIDGES = [];
export const LEAF_PADS = [];
export const LILY_PADS = [];
export const BOUNCE_PADS = [];
export const VINE_WALLS = [];
export const STAIR_FLIGHTS = [];
export let MID_LEDGE = null;
export let TOADSTOOL = null;
export let GREAT_STAIR = null;
export let ROPE_BRIDGE = null;
export let TEMPLE = null;
export let FALLS_DECK = null;
export let LOOKOUT = null;
let _built = false;
let structIndex = null;

/** Where a path crosses a river channel: the bridge spans bank to bank. */
function crossing(pathId, rv, extraHalf = 3.2) {
  const p = JUNGLE_PATHS.find((q) => q.id === pathId);
  let best = null, bd = Infinity;
  for (let i = 0; i < p.pts.length; i++) {
    const [x, z] = p.pts[i];
    const ch = nearestChannel(x, z);
    if (!ch || ch.rv !== rv) continue;
    if (ch.d < bd) { bd = ch.d; best = { i, ch, x, z }; }
  }
  const a = p.pts[Math.max(0, best.i - 1)], b = p.pts[Math.min(p.pts.length - 1, best.i + 1)];
  const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
  const half = best.ch.hw + extraHalf;
  return { from: [best.x - (tx / tl) * half, best.z - (tz / tl) * half], to: [best.x + (tx / tl) * half, best.z + (tz / tl) * half] };
}

export function ensureJungleStructures() {
  if (_built) return;
  _built = true;
  getJungleGrid();

  // Bridges where the trails cross water.
  {
    const c1 = crossing("trail-ford", RIVER);
    JUNGLE_BRIDGES.push(bridge("bridge-ford", "plank", c1.from, c1.to, 1.7, 0.9));
    const c2 = crossing("trail-temple", RIVER, 3.6);
    JUNGLE_BRIDGES.push(bridge("bridge-temple", "stone", c2.from, c2.to, 1.9, 1.5));
    const c3 = crossing("trail-south", RIVER, 3.4);
    JUNGLE_BRIDGES.push(bridge("bridge-lagoon", "log", c3.from, c3.to, 1.5, 0.7));
    const c4 = crossing("trail-plateau", UPPER_RIVER, 2.6);
    JUNGLE_BRIDGES.push(bridge("bridge-upper", "log", c4.from, c4.to, 1.5, 0.6));
  }

  // --- THE VINE CLIFFS: a full-height vine wall, eight leaf poles up to a
  // rock ledge, and a second vine wall from the ledge to the top.
  {
    const footA = (x) => [x, escarpZ(x) + 0.35];
    const wA0 = footA(-43.5), wA1 = footA(-38.5);
    const baseA = Math.max(terrainHeight(wA0[0], wA0[1] + 1.2), terrainHeight(wA1[0], wA1[1] + 1.2));
    VINE_WALLS.push(makeVineWall("vine-wall-a", wA0, wA1, baseA, PLATEAU_H, escarpWidth(-41)));
    // The ledge: a rock shelf jutting from the cliff, east of the poles.
    const lx = -21.5;
    const lz = escarpZ(lx) + 1.6;
    const floorY = terrainHeight(lx, lz + 3);
    MID_LEDGE = rect("mid-ledge", "ledge", lx, lz, 4.2, 2.1, floorY + 8.6, true);
    // Leaf poles: a zig-zag of pads in front of the cliff, each ~1 m higher
    // than the last and ~1 m apart edge to edge, ending a hop below the ledge.
    const PAD_R = 1.1;
    const p0 = [-37.5, escarpZ(-37.5) + 10.6];
    const p7 = [lx - 0.9, MID_LEDGE.c[1] + MID_LEDGE.hz + PAD_R + 0.85];
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      const bx = lerp(p0[0], p7[0], t), bz = lerp(p0[1], p7[1], t);
      // Zig-zag perpendicular to the run (not on the last pad).
      const off = i === 7 ? 0 : (i % 2 ? 1 : -1) * 1.15;
      const dx = p7[0] - p0[0], dz = p7[1] - p0[1], dl = Math.hypot(dx, dz);
      const c = [bx - (dz / dl) * off, bz + (dx / dl) * off];
      LEAF_PADS.push(disc(`leaf-pad-${i}`, "leafpad", c, PAD_R, MID_LEDGE.top - (8 - i) * 0.98, false, { floor: terrainHeight(c[0], c[1]) }));
    }
    const wB0 = [lx - 2.6, escarpZ(lx - 2.6) + 0.35], wB1 = [lx + 2.6, escarpZ(lx + 2.6) + 0.35];
    VINE_WALLS.push(makeVineWall("vine-wall-b", wB0, wB1, MID_LEDGE.top, PLATEAU_H, escarpWidth(lx)));
  }

  // --- THE WATERFALL STAIRS: one long stone flight built against the cliff
  // east of the falls, rising WEST to a landing that bridges onto the plateau.
  {
    const zf = escarpZ(44) + 2.0;
    const bottomX = 58, topX = 31.5;
    // The first step sits one step above the trail's end (east of the foot).
    const h0 = terrainHeight(bottomX, zf) - 0.05;
    const fl = flight("falls-stairs", [bottomX, zf], [topX, zf], h0, PLATEAU_H, 2.6, 40, { style: "stone" });
    STAIR_FLIGHTS.push(fl);
    // Top landing: steps you north over the cliff lip onto the plateau.
    rect("falls-stairs-landing", "landing", topX - 1.6, zf - 3.4, 1.8, 4.6, PLATEAU_H, true);
  }
  // The Falls Lookout deck at the lip, beside the falls.
  FALLS_DECK = rect("falls-deck", "deck", 22, escarpZ(22) - 1.2, 3.2, 2.4, PLATEAU_H + 0.25, true);

  // --- THE MUSHROOM GLADE: a rock ledge jutting from Canopy Hill's flank,
  // high above the glade floor — the big red mushroom's MEGA bounce is the way
  // up from the glade (a hop from the hillside behind works too) — and a giant
  // toadstool reachable by bouncing from the ledge's own orange mushroom.
  {
    const L = MUSHROOM_LEDGE;
    const fy = terrainHeight(L.center[0], L.center[1]);
    const ledge = disc("mushroom-ledge", "ledge", L.center, L.radius, fy + L.rise, true);
    // vy: launch speed. The first (the big one by the ledge) is the MEGA
    // bounce — its apex clears the rock ledge by ~1.4 m (the ledge juts from
    // Canopy Hill's flank, so it sits well above the glade floor).
    const pads = [
      { c: [-51.2, 30.6], r: 1.55, rise: 1.15, clear: ledge.top + 1.4 },
      { c: [-38.5, 34.5], r: 1.4, rise: 1.0, vy: 11.2 },
      { c: [-50.5, 22.5], r: 1.3, rise: 0.95, vy: 10.8 },
    ];
    pads.forEach((p, i) => {
      const g = terrainHeight(p.c[0], p.c[1]);
      const top = g + p.rise;
      const vy = p.clear !== undefined ? Math.sqrt(2 * BOUNCE_GRAVITY * (p.clear - top)) : p.vy;
      BOUNCE_PADS.push(domeCap(disc(`bounce-${i}`, "mushroom", p.c, p.r, top, true, { vy, floor: g })));
    });
    // The ledge's own little mushroom (on top of the ledge).
    const lc = [L.center[0] - 1.6, L.center[1] - 1.2];
    BOUNCE_PADS.push(domeCap(disc("bounce-ledge", "mushroom", lc, 1.2, ledge.top + 0.9, true, { vy: 12.4, floor: ledge.top })));
    // The giant toadstool: a solid stem, and a THIN cap you can walk under.
    const tc = [-60, 20.5];
    const tg = terrainHeight(tc[0], tc[1]);
    TOADSTOOL = disc("giant-toadstool", "toadstool", tc, 4.1, tg + 9.4, false, { floor: tg, stemR: 1.25 });
    disc("giant-toadstool-stem", "stem", tc, 1.25, tg + 9.4, true);
  }

  // --- THE LILY LAGOON: a trail of lily pads across to a little shrine islet.
  {
    const L = LAGOON;
    const isle = [L.center[0] + 3, L.center[1] + 1];
    const from = [70, 110.5];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / (n + 1);
      const x = lerp(from[0], isle[0], t) + Math.sin(i * 1.9) * 1.6;
      const z = lerp(from[1], isle[1] - 3.2, t);
      LILY_PADS.push(disc(`lily-${i}`, "lilypad", [x, z], 0.95 + (i % 3) * 0.12, L.level + 0.07, false));
    }
    disc("lagoon-isle", "isle", isle, 3.3, L.level + 0.42, true);
  }

  // --- THE GREAT TREE: a spiral plank stair round the trunk to a treehouse
  // deck 20 m up, and a rope bridge from the deck east to Mossback Ridge.
  {
    const T = GREAT_TREE;
    const g0 = terrainHeight(T.center[0] - 7, T.center[1] + 2);
    GREAT_STAIR = makeSpiralStair("great-stair", T.center, T.trunkR + 0.45, T.trunkR + 2.15, g0, T.deckY, 0.32, 0.155, Math.PI * 0.86);
    addStruct(GREAT_STAIR);
    addStruct(makeTreeDeck("great-deck", T, GREAT_STAIR));
    // Rope bridge: deck edge → the ridge's west flank.
    const from = [T.center[0] + T.deckR - 0.6, T.center[1] + 0.5];
    let to = [from[0] + 14, from[1] + 1];
    for (let x = from[0] + 10; x < from[0] + 40; x += 0.5) {
      if (terrainHeight(x, from[1] + 1) >= T.deckY - 1.4) { to = [x + 1.2, from[1] + 1]; break; }
    }
    ROPE_BRIDGE = bridge("rope-bridge", "rope", from, to, 1.05, 0, { h0: T.deckY, h1: terrainHeight(to[0], to[1]), sag: 0.9 });
    JUNGLE_BRIDGES.push(ROPE_BRIDGE);
  }

  // --- THE TEMPLE: its walkable roof (two side flights) + the porch.
  TEMPLE = makeTemple();

  // --- CANOPY LOOKOUT: a wooden viewing platform on the summit of Canopy
  // Hill, three steps up (railings + a telescope are set-piece props).
  {
    const c = JUNGLE_SPOTS.find((q) => q.id === "canopy").center;
    const pc = [c[0] - 2.5, c[1] - 1.5];
    const g = terrainHeight(pc[0], pc[1]);
    const top = g + 1.32;
    LOOKOUT = { c: pc, g, top, hx: 3.2, hz: 2.6 };
    rect("lookout-deck", "deck", pc[0], pc[1], 3.2, 2.6, top, true);
    const fa = [pc[0] + 3.2 + 1.65, pc[1]], fb = [pc[0] + 3.2 + 0.05, pc[1]];
    STAIR_FLIGHTS.push(flight("lookout-steps", fa, fb, g, top, 1.8, 3, { style: "wood" }));
  }

  // Spatial index of every structure.
  const map = new Map();
  for (const s of STRUCTS) {
    const [x0, x1, z0, z1] = s.bbox;
    for (let i = Math.floor(x0 / 8); i <= Math.floor(x1 / 8); i++) {
      for (let j = Math.floor(z0 / 8); j <= Math.floor(z1 / 8); j++) {
        const k = i * 4096 + j;
        let arr = map.get(k);
        if (!arr) { arr = []; map.set(k, arr); }
        arr.push(s);
      }
    }
  }
  structIndex = (x, z) => map.get(Math.floor(x / 8) * 4096 + Math.floor(z / 8)) || [];
}
export function getJungleStructures() { ensureJungleStructures(); return STRUCTS; }

function makeVineWall(id, a, b, base, top, cliffW) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const L = Math.hypot(dx, dz);
  const tx = dx / L, tz = dz / L;
  // Outward normal = away from the cliff = SOUTH-ish (+z side).
  let nx = -tz, nz = tx;
  if (nz < 0) { nx = -nx; nz = -nz; }
  return { id, a, b, len: L, tx, tz, nx, nz, base, top, cliffW, kind: "vine" };
}

/** A helical plank stair round a trunk: steps of `rise`, `dphi` radians each. */
function makeSpiralStair(id, c, rIn, rOut, y0, y1, rise, dphi, phi0) {
  const n = Math.ceil((y1 - y0) / rise);
  const s = { id, kind: "spiral", c, rIn, rOut, y0, y1, rise, dphi, phi0, n, thin: true };
  s.stepTop = (k) => Math.min(y1, y0 + (k + 1) * rise);
  s.topAt = (x, z, lim) => {
    const r = Math.hypot(x - c[0], z - c[1]);
    if (r < rIn - 0.05 || r > rOut) return null;
    const ang = (((Math.atan2(z - c[1], x - c[0]) - phi0) % TAU) + TAU) % TAU;
    let best = null;
    for (let w = 0; w * TAU + ang <= n * dphi + 1e-6; w++) {
      const k = Math.floor((w * TAU + ang) / dphi);
      if (k < 0 || k >= n) continue;
      const top = s.stepTop(k);
      if (top <= lim && (best === null || top > best)) best = top;
    }
    return best;
  };
  s.bbox = [c[0] - rOut, c[0] + rOut, c[1] - rOut, c[1] + rOut];
  s.endAngle = phi0 + n * dphi;
  return s;
}
/** The treehouse deck: an annulus round the trunk with a hatch over the stair top. */
function makeTreeDeck(id, T, stair) {
  const d = { id, kind: "treedeck", c: T.center, rIn: T.trunkR, rOut: T.deckR, top: T.deckY, thin: true };
  // The hatch: the stair's last ~2.2 m of climb come up through the deck.
  const hatchSteps = Math.ceil(2.3 / stair.rise);
  const hatchA0 = stair.phi0 + (stair.n - hatchSteps) * stair.dphi;
  const hatchA1 = stair.phi0 + stair.n * stair.dphi + 0.05;
  d.hatch = { a0: hatchA0, a1: hatchA1, rMax: stair.rOut + 0.25 };
  d.inHatch = (x, z) => {
    const r = Math.hypot(x - T.center[0], z - T.center[1]);
    if (r > d.hatch.rMax) return false;
    const a = Math.atan2(z - T.center[1], x - T.center[0]);
    const span = d.hatch.a1 - d.hatch.a0;
    const rel = (((a - d.hatch.a0) % TAU) + TAU) % TAU;
    return rel <= span;
  };
  d.topAt = (x, z, lim) => {
    if (d.top > lim) return null;
    const r = Math.hypot(x - T.center[0], z - T.center[1]);
    if (r < d.rIn || r > d.rOut) return null;
    if (d.inHatch(x, z)) return null;
    return d.top;
  };
  d.bbox = [T.center[0] - T.deckR, T.center[0] + T.deckR, T.center[1] - T.deckR, T.center[1] + T.deckR];
  return d;
}

/**
 * THE TEMPLE RUINS — built into the foot of Fern Hill, facing EAST across its
 * courtyard. A great mossy archway (the temple stream runs out of it), a solid
 * stone mass you can climb onto via two side flights, and a broken colonnade.
 */
export const TEMPLE_ANCHOR = { c: [-57.5, -18], facing: 0 /* +x */ };
function makeTemple() {
  const [cx, cz] = TEMPLE_ANCHOR.c;
  const g = terrainHeight(cx + 4, cz);
  const roofY = g + 7.6;
  // The temple block (solid): 12 m deep (x) × 20 m wide (z), walkable roof.
  const block = rect("temple-block", "temple", cx - 5, cz, 6, 10, roofY, true);
  // Two side flights on the SOUTH and NORTH faces rising west onto the roof.
  // Each flight starts from the ground at its own foot (first step = one step up).
  const fS = flight("temple-stairs-s", [cx + 1.6, cz + 11.6], [cx - 9.5, cz + 11.6], terrainHeight(cx + 1.6, cz + 11.6), roofY, 2.4, 20, { style: "temple" });
  const fN = flight("temple-stairs-n", [cx + 1.6, cz - 11.6], [cx - 9.5, cz - 11.6], terrainHeight(cx + 1.6, cz - 11.6), roofY, 2.4, 20, { style: "temple" });
  STAIR_FLIGHTS.push(fS, fN);
  // Top landings joining each flight to the roof.
  rect("temple-landing-s", "landing", cx - 10.4, cz + 10.4, 1.6, 2.6, roofY, true);
  rect("temple-landing-n", "landing", cx - 10.4, cz - 10.4, 1.6, 2.6, roofY, true);
  return { c: [cx, cz], ground: g, roofY, block, flights: [fS, fN], arch: { x: cx + 1, z: TEMPLE_STREAM.pts[0][1], halfW: 3.0, h: 5.6 } };
}

// ---------------------------------------------------------------------------
// THE PLAYER HOOKS
// ---------------------------------------------------------------------------
/** Highest structure top at (x, z) that is ≤ lim (solids always), or null. */
export function structureTopAt(x, z, lim = Infinity) {
  ensureJungleStructures();
  let best = null;
  for (const s of structIndex(x, z)) {
    const t = s.topAt(x, z, lim);
    if (t !== null && (best === null || t > best)) best = t;
  }
  return best;
}

/** Walkable ground height (layered — see the file header). */
export function jungleGroundHeight(x, z, y) {
  const lim = y === undefined ? Infinity : y + J_STEP_UP + 0.05;
  const g = terrainHeight(x, z);
  const s = structureTopAt(x, z, lim);
  return s !== null && s > g ? s : g;
}

export const SLIDE_SLOPE = 1.05;
/** Too-steep ground (cliffs, the rim): the downhill direction, else null. */
export function jungleSlideAt(x, z, y) {
  const g = terrainHeight(x, z);
  // Standing on a structure (bridge, stair, pad, deck) never slides.
  const lim = y === undefined ? Infinity : y + J_STEP_UP + 0.05;
  const s = structureTopAt(x, z, lim);
  if (s !== null && s >= g - 0.02) return null;
  if (slopeAt(x, z) < SLIDE_SLOPE) return null;
  const e = 0.6;
  const gx = terrainHeight(x + e, z) - terrainHeight(x - e, z);
  const gz = terrainHeight(x, z + e) - terrainHeight(x, z - e);
  const L = Math.hypot(gx, gz);
  if (L < 1e-6) return null;
  return { x: -gx / L, z: -gz / L };
}

/**
 * Vine walls: standing right in front of one (and below its top) returns
 * { wall, t (metres along), s (metres out from the foot) }. The Player climbs
 * when you push INTO the wall.
 */
export function jungleClimbAt(x, z, y) {
  ensureJungleStructures();
  for (const w of VINE_WALLS) {
    const rx = x - w.a[0], rz = z - w.a[1];
    const t = rx * w.tx + rz * w.tz;
    if (t < 0.3 || t > w.len - 0.3) continue;
    const s = rx * w.nx + rz * w.nz;
    if (s < -w.cliffW - 0.5 || s > 1.6) continue;
    if (y !== undefined && (y < w.base - 0.8 || y > w.top - 0.12)) continue;
    return { wall: w, t, s };
  }
  return null;
}

/** Bouncy mushroom caps: the pad under (x, z) at height y, or null. */
export function jungleBounceAt(x, z, y) {
  ensureJungleStructures();
  for (const p of BOUNCE_PADS) {
    const h = p.heightAt(x, z);
    if (h !== null && (y === undefined || Math.abs(y - h) < 0.2)) return p;
  }
  return null;
}

export const WADE_SPEED = 0.62;
/** Wading through knee-deep water slows you down a little. */
export function jungleSpeedAt(x, z, y) {
  const w = jungleWaterAt(x, z);
  if (w === null) return 1;
  if (y !== undefined && y > w - 0.12) return 1; // on a bridge / pad above it
  return WADE_SPEED;
}

/** A good, safe spot (dry, not steep, not on a structure). */
export function jungleIsSafe(x, z) {
  return jungleWaterAt(x, z) === null && !jungleSlideAt(x, z) && slopeAt(x, z) < 0.7;
}

/** Dirt trail ground (footprints). */
export function isOnJunglePath(x, z) {
  const n = nearestPath(x, z);
  return Boolean(n && n.e < -0.25) && jungleWaterAt(x, z) === null;
}

// Convenience for set-pieces.
export function groundY(x, z) { return terrainHeight(x, z); }
export { escarpWidth as cliffWidthAt };
