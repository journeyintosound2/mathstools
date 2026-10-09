/**
 * NUMBER ISLAND — TERRAIN (rebuilt 2026-10-09). Pure + deterministic: the
 * coastline, the height-field, the level pads, the graded paths, the lagoon,
 * the volcano + its lava, the solid structures (the raised plaza + its four
 * stair flights) and the thin ones (the jetty, the cove pier, the rope
 * bridge), and the Player hooks. The renderer meshes the SAME 1 m grid with
 * the SAME triangle split as `terrainHeight`, so what you see is exactly what
 * you stand on. Layout numbers come from islandLayout.js.
 *
 *   rawHeight      the island: beaches rising to a gentle interior, cliffs
 *                  on the headlands, the hills, Ember Peak's cone + crater,
 *                  the sea floor shelving away from the shore
 *   carvedHeight   level PADS → graded PATHS → pad tops → the LAGOON + its
 *                  channel to the sea → the lava stream's channel
 *
 * Sea level is y = 0 everywhere (the ocean, the lagoon, the shallows): the
 * shallows are wadeable (slower); deeper water bounces you back to the last
 * dry spot with a splash, like Snowball Sums' icy lake.
 */
import {
  clamp, lerp, smoothstep, segDistT, vnoise, fbm, smoothPolyline, cumLengths, buildSegIndex,
} from "../terrainKit.js";
import {
  COAST, ISLET, ISLAND_HILLS, EMBER_PEAK, LAGOON, LAGOON_BED, ISLAND_PADS, ISLAND_PATH_CTRL, PLAZA,
  ISLAND_JETTY, COVE_PIER, ROPE_BRIDGE, SEA_Y, FROSTY_PEAK,
} from "./islandLayout.js";

/** Mirrors systems/collisionEngine.js STEP_UP (the checks assert they match). */
export const I_STEP_UP = 0.45;
export const I_SLIDE_SLOPE = 1.0;
export const I_WADE_SPEED = 0.62;
/** Deeper than this you're swimming → bounced back to the island. */
export const I_DEEP = 0.85;

const TAU = Math.PI * 2;
const angDiff = (a, b) => {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};

// ---------------------------------------------------------------------------
// THE COAST
// ---------------------------------------------------------------------------
/** The main island's coast radius at angle θ. */
export function coastRadius(theta) {
  let r = COAST.r0;
  for (const b of COAST.bumps) {
    const d = angDiff(theta, b.a) / b.w;
    r += b.d * Math.exp(-d * d);
  }
  r += 2.0 * Math.sin(7 * theta + 1.3) + 1.3 * Math.sin(11 * theta - 0.4) + 0.8 * Math.sin(17 * theta + 2.2);
  r += 4.2 * (fbm(Math.cos(theta) * 2.3 + 7, Math.sin(theta) * 2.3 - 3, 3, 91) - 0.5);
  return r;
}
function isletRadius(theta) {
  return ISLET.radius + 1.2 * Math.sin(5 * theta + 0.7) + 0.7 * Math.sin(9 * theta - 1.1);
}
/** Signed distance to the coast (+ = out at sea, − = inland), ~metres. */
export function coastSD(x, z) {
  const main = Math.hypot(x, z) - coastRadius(Math.atan2(z, x));
  const ix = x - ISLET.center[0], iz = z - ISLET.center[1];
  const islet = Math.hypot(ix, iz) - isletRadius(Math.atan2(iz, ix));
  return Math.min(main, islet);
}
function onIsletSide(x, z) {
  return Math.hypot(x - ISLET.center[0], z - ISLET.center[1]) < ISLET.radius + 9;
}
/** How cliff-like the coast is here (0 beach … 1 cliff). */
export function cliffiness(x, z) {
  if (onIsletSide(x, z)) return 0.75;
  const th = Math.atan2(z, x);
  let k = 0;
  for (const c of COAST.cliffs) {
    const d = angDiff(th, c.a) / c.w;
    k = Math.max(k, c.k * Math.exp(-d * d * 1.5));
  }
  return k;
}

// ---------------------------------------------------------------------------
// RAW TERRAIN
// ---------------------------------------------------------------------------
function hillT(hl, x, z) {
  const w = (hl.warp || 0) * (fbm(x / 26 + (hl.h || 0), z / 26 - (hl.h || 0), 2, 9) - 0.5) * 2;
  if (hl.a) {
    const { d } = segDistT(x, z, hl.a[0], hl.a[1], hl.b[0], hl.b[1]);
    return d / hl.r + w;
  }
  return Math.hypot((x - hl.c[0]) / hl.rx, (z - hl.c[1]) / hl.rz) + w;
}
function hillHeight(hl, x, z) {
  const t = hillT(hl, x, z);
  if (t >= 1) return 0;
  const tt = hl.flat > 0 ? Math.max(0, (t - hl.flat) / (1 - hl.flat)) : t;
  return hl.h * 0.5 * (1 + Math.cos(Math.PI * tt));
}
function smaxK(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
}
/** Ember Peak's height (cone + crater bowl), 0 beyond its foot. */
export function volcanoHeight(x, z) {
  const V = EMBER_PEAK;
  const d = Math.hypot(x - V.c[0], z - V.c[1]);
  if (d >= V.R) return 0;
  const t = d / V.R;
  let h = V.H * Math.pow(1 - t, V.exp);
  // Gnarly lava-rock ribs down the flanks.
  h += (fbm(x / 7, z / 7, 2, 93) - 0.5) * 1.6 * smoothstep(1, 0.5, t) * smoothstep(0, 0.25, t);
  const rimT = V.craterR / V.R;
  const rimH = V.H * Math.pow(1 - rimT, V.exp);
  if (d < V.craterR * 1.35) {
    // The crater: a bowl inside the rim (lava pools in it).
    const u = d / V.craterR;
    const bowl = rimH - V.craterDepth * (1 - smoothstep(0.55, 1.0, u)) + 0.6 * smoothstep(0.85, 1.0, u);
    const k = smoothstep(1.35, 1.0, u);
    h = lerp(h, Math.min(h, bowl + 0.6), k);
  }
  return h;
}
/**
 * FROSTY PEAK's alpine relief: ridged SPURS running down from the summit
 * (with gullies between them) and craggy ridged noise on the upper flanks,
 * so the mountain reads as a mountain — snowy ridges, rocky gullies — not a
 * smooth dome. Faded out at its foot and right at the summit (the lookout's
 * pad); the summit trail is graded through it like every other path.
 */
function alpineRelief(x, z) {
  const dx = x - FROSTY_PEAK.c[0], dz = z - FROSTY_PEAK.c[1];
  const r = Math.hypot(dx, dz);
  if (r > 46) return 0;
  const th = Math.atan2(dz, dx);
  const warp = (fbm(x / 20, z / 20, 2, 96) - 0.5) * 1.4;
  const spur = Math.pow(Math.abs(Math.sin(th * 2.5 + 0.7 + warp)), 3) * 0.6 + Math.pow(Math.abs(Math.sin(th * 4 + 2.1 - warp)), 4) * 0.4;
  const rn = 1 - Math.abs(2 * fbm(x / 10, z / 10, 3, 97) - 1);
  const fade = smoothstep(46, 26, r) * smoothstep(5, 12, r);
  return ((spur - 0.33) * 4.2 + (rn * rn - 0.45) * 2.6) * fade;
}

export const CRATER_LAVA_Y = EMBER_PEAK.H * Math.pow(1 - EMBER_PEAK.craterR / EMBER_PEAK.R, EMBER_PEAK.exp) - EMBER_PEAK.craterDepth + 1.4;

function seaFloor(sd, cliff) {
  // A shallow wadeable shelf off the beaches; cliffs drop straight in.
  const s = sd * (1 + cliff * 1.8);
  return Math.max(-26, -0.04 - 0.085 * s - 0.024 * s * s);
}
/** Height before pads / paths / water are carved in. */
export function rawHeight(x, z) {
  const sd = coastSD(x, z);
  const cliff = cliffiness(x, z);
  const inland = -sd;
  // The interior: a gentle rise from the top of the beach.
  const interior = 1.35 + 3.7 * (1 - Math.exp(-Math.max(0, inland - 9) / 26)) +
    1.1 * (fbm(x / 48 + 3, z / 48 - 1, 3, 81) - 0.5) * smoothstep(9, 30, inland) +
    0.18 * (vnoise(x / 5, z / 5, 82) - 0.5);
  let hill = 0, added = 0;
  for (const hl of ISLAND_HILLS) {
    const h = hillHeight(hl, x, z);
    if (h <= 0) continue;
    if (hl.add) { added += h; continue; }
    hill = hill > 0 ? smaxK(hill, h, 2.5) : h;
  }
  hill += added;
  if (hill > 0.5) hill = Math.max(0, hill + alpineRelief(x, z) * smoothstep(0.5, 4, hill));
  const vol = volcanoHeight(x, z);
  // The hills + the volcano sit ON the land profile and run on past the
  // coast (headlands, the lava shore) — the SAME amount either side of the
  // waterline, so a hill that reaches the sea meets it as a slope, never a
  // seam in the ground.
  const bumps = hill + vol + hill * 0.04 * (fbm(x / 9, z / 9, 2, 83) - 0.5);
  const top = interior + bumps;
  if (sd <= 0) {
    // Beach: sand rises gently from the waterline to the grass.
    const beach = lerp(0, 1.35, smoothstep(0, 9.5, inland));
    const land = inland < 9.5 ? beach + (interior - 1.35) * smoothstep(4, 9.5, inland) : interior;
    // Cliffs: the full land height right to the edge.
    const cliffH = interior * smoothstep(0, 2.6, inland);
    return lerp(land, Math.max(land, cliffH), cliff) + bumps;
  }
  // Out at sea: the floor shelves away; hills/the volcano run on into the
  // water briefly before the floor wins.
  const floor = seaFloor(sd, cliff);
  const run = bumps * Math.exp(-sd / (2.5 + 5 * (1 - cliff)));
  return Math.max(floor, Math.min(top, floor + run));
}

// ---------------------------------------------------------------------------
// LEVEL PADS (the farm's pipeline)
// ---------------------------------------------------------------------------
function padQ(f, x, z) {
  const ax = Math.abs(x - f.c[0]) / f.rx, az = Math.abs(z - f.c[1]) / f.rz;
  return Math.pow(Math.pow(ax, f.p) + Math.pow(az, f.p), 1 / f.p);
}
function padEdgeDist(f, x, z, q = padQ(f, x, z)) {
  const r = Math.hypot(x - f.c[0], z - f.c[1]);
  if (r < 1e-6) return -Math.min(f.rx, f.rz);
  return r * (1 - 1 / Math.max(q, 1e-6));
}
const BANK_BINS = 48;
const BANK_MAX = 22;
const PADS = ISLAND_PADS.map((f) => {
  let sum = 0, n = 0;
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
    const x = f.c[0] + (i / 4) * f.rx * 0.85, z = f.c[1] + (j / 4) * f.rz * 0.85;
    if (padQ(f, x, z) <= 1) { sum += rawHeight(x, z); n++; }
  }
  const level = f.level !== undefined ? f.level : Math.round((sum / Math.max(1, n)) * 20) / 20;
  return { ...f, level };
}).map((f) => {
  const bank = new Float32Array(BANK_BINS);
  for (let a = 0; a < BANK_BINS; a++) {
    const ang = (a / BANK_BINS) * TAU;
    const dx = Math.cos(ang), dz = Math.sin(ang);
    const rim = 1 / Math.pow(Math.pow(Math.abs(dx) / f.rx, f.p) + Math.pow(Math.abs(dz) / f.rz, f.p), 1 / f.p);
    let d0 = 0;
    for (const o of [0, 1.5, 3]) d0 = Math.max(d0, Math.abs(rawHeight(f.c[0] + dx * (rim + o), f.c[1] + dz * (rim + o)) - f.level));
    bank[a] = Math.min(BANK_MAX, 4 + d0 * 2.4);
  }
  return { ...f, bank };
});
function bankWidth(f, x, z) {
  const ang = Math.atan2(z - f.c[1], x - f.c[0]);
  const u = ((((ang / TAU) % 1) + 1) % 1) * BANK_BINS;
  const i = Math.floor(u) % BANK_BINS, t = u - Math.floor(u);
  return f.bank[i] + (f.bank[(i + 1) % BANK_BINS] - f.bank[i]) * t;
}
const PAD_BY_ID = new Map(PADS.map((p) => [p.id, p]));
export function islandPadLevel(id) {
  const p = PAD_BY_ID.get(id);
  return p ? p.level : 0;
}
export function getIslandPads() { return PADS; }
export function nearestPad(x, z) {
  let best = { e: Infinity, id: null };
  for (const f of PADS) {
    if (Math.abs(x - f.c[0]) > f.rx + 40 || Math.abs(z - f.c[1]) > f.rz + 40) continue;
    const e = padEdgeDist(f, x, z);
    if (e < best.e) best = { e, id: f.id };
  }
  return best;
}
export function onPad(id, x, z, inset = 0) {
  const f = PAD_BY_ID.get(id);
  return Boolean(f) && padEdgeDist(f, x, z) <= -inset;
}
const ease = (t) => 0.5 * t + 0.5 * t * t * (3 - 2 * t);
function padUnder(x, z) {
  for (const f of PADS) {
    if (Math.abs(x - f.c[0]) > f.rx || Math.abs(z - f.c[1]) > f.rz) continue;
    if (padQ(f, x, z) <= 1) return f;
  }
  return null;
}
function padBlend(x, z, h) {
  const on = padUnder(x, z);
  if (on) return { h: on.level, w: 1 };
  let wsum = 0, lsum = 0, wmax = 0;
  for (const f of PADS) {
    if (Math.abs(x - f.c[0]) > f.rx + BANK_MAX + 2 || Math.abs(z - f.c[1]) > f.rz + BANK_MAX + 2) continue;
    const e = padEdgeDist(f, x, z);
    const B = bankWidth(f, x, z);
    if (e >= B) continue;
    const w = 1 - ease(e / B);
    const W = w / (1 - w + 1e-4);
    wsum += W; lsum += W * f.level; wmax = Math.max(wmax, w);
  }
  if (wmax <= 0) return { h, w: 0 };
  // A pad's bank never fills the sea (the islet channel stays open; a pad
  // by the shore just ends in a little bluff).
  const k = wmax * smoothstep(-1.2, 0.4, h);
  return { h: lerp(h, lsum / wsum, k), w: k };
}

// ---------------------------------------------------------------------------
// PATHS — graded (a smoothed height profile, pinned on pads + at the ends,
// grade-limited to 0.28), carved with batter cones (the farm's recipe).
// ---------------------------------------------------------------------------
const PROFILE_W = 9;
export const ISLAND_PATHS = ISLAND_PATH_CTRL.map((p) => {
  const pts = smoothPolyline(p.ctrl, 1.5);
  const s = cumLengths(pts);
  const base = pts.map(([x, z]) => padBlend(x, z, rawHeight(x, z)));
  const pinned = base.map((b, i) => b.w > 0.97 || i === 0 || i === base.length - 1);
  let prof = base.map((b) => b.h);
  for (let pass = 0; pass < 4; pass++) {
    prof = prof.map((v, i) => {
      if (pinned[i]) return base[i].h;
      let sum = 0, w = 0;
      for (let j = i; j >= 0 && s[i] - s[j] <= PROFILE_W; j--) { sum += prof[j]; w++; }
      for (let j = i + 1; j < prof.length && s[j] - s[i] <= PROFILE_W; j++) { sum += prof[j]; w++; }
      return sum / w;
    });
  }
  const G = 0.27;
  for (let it = 0; it < 8; it++) {
    for (let i = 1; i < prof.length; i++) {
      if (pinned[i]) continue;
      const d = (s[i] - s[i - 1]) * G;
      prof[i] = clamp(prof[i], prof[i - 1] - d, prof[i - 1] + d);
    }
    for (let i = prof.length - 2; i >= 0; i--) {
      if (pinned[i]) continue;
      const d = (s[i + 1] - s[i]) * G;
      prof[i] = clamp(prof[i], prof[i + 1] - d, prof[i + 1] + d);
    }
  }
  prof = prof.map((v, i) => base[i].h + clamp(v - base[i].h, -2.4, 2.4));
  return { id: p.id, hw: p.hw, kind: p.kind, pts, s, prof };
});
const TRACK_REACH = 11;
const pathSegs = buildSegIndex(ISLAND_PATHS.flatMap((p) => p.pts.slice(0, -1).map((a, i) => ({
  p, i, ax: a[0], az: a[1], bx: p.pts[i + 1][0], bz: p.pts[i + 1][1], reach: p.hw + TRACK_REACH,
}))));
/** Nearest path: { e: metres outside its edge (− = on it), cx, cz, h, p } or null. */
export function nearestPath(x, z) {
  let best = null, be = Infinity;
  for (const sg of pathSegs(x, z)) {
    const { d, t } = segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz);
    const e = d - sg.p.hw;
    if (e < be) {
      be = e;
      best = { e, cx: lerp(sg.ax, sg.bx, t), cz: lerp(sg.az, sg.bz, t), h: lerp(sg.p.prof[sg.i], sg.p.prof[sg.i + 1], t), p: sg.p };
    }
  }
  return best;
}
const BATTER = 0.7;
function trackCarve(x, z, h) {
  let lo = -Infinity, hi = Infinity;
  for (const sg of pathSegs(x, z)) {
    const { d, t } = segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz);
    const e = Math.max(0, d - sg.p.hw);
    if (e >= TRACK_REACH) continue;
    const hc = lerp(sg.p.prof[sg.i], sg.p.prof[sg.i + 1], t);
    const r = BATTER * e + 1.2 * Math.max(0, e - (TRACK_REACH - 4)) ** 2;
    lo = Math.max(lo, hc - r);
    hi = Math.min(hi, hc + r);
  }
  if (lo === -Infinity) return h;
  return lo <= hi ? clamp(h, lo, hi) : (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// THE LAGOON (a shallow inlet of the sea) + its channel to the sea.
// ---------------------------------------------------------------------------
/** Metres outside the lagoon's water edge (− = in it). */
export function lagoonEdgeDist(x, z) {
  const L = LAGOON;
  const q = Math.hypot((x - L.c[0]) / L.rx, (z - L.c[1]) / L.rz);
  const r = Math.hypot(x - L.c[0], z - L.c[1]);
  const ell = r < 1e-6 ? -Math.min(L.rx, L.rz) : r * (1 - 1 / Math.max(q, 1e-6));
  const wob = 1.1 * Math.sin(Math.atan2(z - L.c[1], x - L.c[0]) * 5 + 0.6);
  const m = L.mouth;
  const ch = segDistT(x, z, m.a[0], m.a[1], m.b[0], m.b[1]).d - m.hw;
  return Math.min(ell + wob, ch);
}
function lagoonCarve(x, z, h) {
  const e = lagoonEdgeDist(x, z);
  if (e > 12) return h;
  // Bed → a sandy shelving bank up to the shore (a little above sea level).
  const prof = LAGOON_BED + (0.0 - LAGOON_BED + 0.35) * smoothstep(-3.5, 0.4, e) + 0.12 * Math.max(0, e - 0.4);
  if (e < 0.4) return Math.min(h, prof);
  const np = nearestPath(x, z);
  const keep = Math.max(np ? 1 - smoothstep(0, 3, np.e) : 0, padKeep(x, z));
  const soft = lerp(prof, h, Math.max(smoothstep(1.5, 12, e), keep));
  return lerp(soft, h, smoothstep(2.5, 7, h - prof));
}
function padKeep(x, z) {
  let m = 0;
  for (const f of PADS) {
    if (Math.abs(x - f.c[0]) > f.rx + 14 || Math.abs(z - f.c[1]) > f.rz + 14) continue;
    m = Math.max(m, 1 - smoothstep(0, 10, padEdgeDist(f, x, z)));
  }
  return m;
}

// ---------------------------------------------------------------------------
// LAVA — Ember Peak's crater pool and the lava stream that runs down its
// north-east flank into the sea (hissing steam where it meets the water).
// ---------------------------------------------------------------------------
const LV = EMBER_PEAK;
const _ne = [Math.SQRT1_2, -Math.SQRT1_2];
export const LAVA_STREAM = (() => {
  const ctrl = [];
  for (let k = 0; k <= 8; k++) {
    const d = LV.craterR * 0.9 + (k / 8) * (LV.R + 10 - LV.craterR);
    const wig = Math.sin(k * 1.4) * 2.2;
    ctrl.push([LV.c[0] + _ne[0] * d - _ne[1] * wig, LV.c[1] + _ne[1] * d + _ne[0] * wig]);
  }
  const pts = smoothPolyline(ctrl, 1.2);
  return { pts, s: cumLengths(pts), hw: 1.15 };
})();
const lavaSegs = buildSegIndex(LAVA_STREAM.pts.slice(0, -1).map((a, i) => ({
  i, ax: a[0], az: a[1], bx: LAVA_STREAM.pts[i + 1][0], bz: LAVA_STREAM.pts[i + 1][1], reach: 6,
})));
export function lavaStreamDist(x, z) {
  let d = Infinity;
  for (const sg of lavaSegs(x, z)) d = Math.min(d, segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz).d);
  return d - LAVA_STREAM.hw;
}
function lavaCarve(x, z, h) {
  const e = lavaStreamDist(x, z);
  if (e > 2.5) return h;
  // A channel cut 0.5 m into the flank, with raised crusty levees.
  const levee = 0.35 * Math.exp(-((e - 0.9) ** 2) / 0.4);
  return h - 0.5 * (1 - smoothstep(-0.6, 0.8, e)) + levee;
}
/** Whether (x, z) is molten (crater pool or the stream). */
export function isLavaAt(x, z) {
  const d = Math.hypot(x - LV.c[0], z - LV.c[1]);
  if (d < LV.craterR * 0.9) return true;
  if (d > LV.R + 14) return false;
  return lavaStreamDist(x, z) < -0.15 && rawHeight(x, z) > SEA_Y + 0.3;
}

// ---------------------------------------------------------------------------
// FULL CARVED HEIGHT
// ---------------------------------------------------------------------------
export function carvedHeight(x, z) {
  let h = padBlend(x, z, rawHeight(x, z)).h;
  h = trackCarve(x, z, h);
  const on = padUnder(x, z);
  if (on) h = on.level;
  h = lagoonCarve(x, z, h);
  h = lavaCarve(x, z, h);
  return h;
}

// ---------------------------------------------------------------------------
// THE 1 m GRID (lazy)
// ---------------------------------------------------------------------------
export const GRID = { xMin: -150, xMax: 150, zMin: -140, zMax: 140, step: 1 };
GRID.nx = Math.round((GRID.xMax - GRID.xMin) / GRID.step) + 1;
GRID.nz = Math.round((GRID.zMax - GRID.zMin) / GRID.step) + 1;
let _grid = null;
export function getIslandGrid() {
  if (_grid) return _grid;
  const { nx, nz } = GRID;
  const h = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    const z = GRID.zMin + j * GRID.step;
    for (let i = 0; i < nx; i++) h[j * nx + i] = carvedHeight(GRID.xMin + i * GRID.step, z);
  }
  const slope = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    const hx = h[j * nx + Math.min(nx - 1, i + 1)] - h[j * nx + Math.max(0, i - 1)];
    const hz = h[Math.min(nz - 1, j + 1) * nx + i] - h[Math.max(0, j - 1) * nx + i];
    slope[k] = Math.hypot(hx, hz) / (2 * GRID.step);
  }
  _grid = { h, slope };
  return _grid;
}
function gridCoords(x, z) {
  const fx = clamp((x - GRID.xMin) / GRID.step, 0, GRID.nx - 1.0001);
  const fz = clamp((z - GRID.zMin) / GRID.step, 0, GRID.nz - 1.0001);
  const i = Math.floor(fx), j = Math.floor(fz);
  return { i, j, tx: fx - i, tz: fz - j };
}
const OUT_OF_GRID = -30;
/** Terrain height — exactly the rendered mesh's triangles (split a,c,b / b,c,e). */
export function terrainHeight(x, z) {
  if (x < GRID.xMin || x > GRID.xMax || z < GRID.zMin || z > GRID.zMax) return OUT_OF_GRID;
  const g = getIslandGrid().h;
  const { i, j, tx, tz } = gridCoords(x, z);
  const nx = GRID.nx;
  const a = g[j * nx + i], b = g[j * nx + i + 1], c = g[(j + 1) * nx + i], e = g[(j + 1) * nx + i + 1];
  if (tx + tz <= 1) return a + (b - a) * tx + (c - a) * tz;
  return e + (c - e) * (1 - tx) + (b - e) * (1 - tz);
}
export function slopeAt(x, z) {
  if (x < GRID.xMin || x > GRID.xMax || z < GRID.zMin || z > GRID.zMax) return 0;
  const g = getIslandGrid().slope;
  const { i, j, tx, tz } = gridCoords(x, z);
  const nx = GRID.nx;
  const a = g[j * nx + i], b = g[j * nx + i + 1], c = g[(j + 1) * nx + i], d = g[(j + 1) * nx + i + 1];
  return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz;
}

// ---------------------------------------------------------------------------
// STRUCTURES — the raised plaza deck + its four stair flights (SOLID), and
// the jetty, the cove pier and the rope bridge (THIN: you can't be under the
// jetty, but a deck only counts once you're at / above it).
// ---------------------------------------------------------------------------
export const PLAZA_BASE_Y = islandPadLevel("plaza");
export const PLAZA_DECK_Y = PLAZA_BASE_Y + PLAZA.rise;
/** Octagon distance: ≤ apothem inside. */
export function plazaOct(x, z) {
  const dx = Math.abs(x - PLAZA.center[0]), dz = Math.abs(z - PLAZA.center[1]);
  return Math.max(dx, dz, (dx + dz) * Math.SQRT1_2);
}
/** The four stair flights (outward from each flat face). */
export const PLAZA_FLIGHTS = (() => {
  const { width, steps, depth } = PLAZA.stairs;
  const A = PLAZA.apothem;
  const [cx, cz] = PLAZA.center;
  return [
    { id: "s", nx: 0, nz: 1 }, { id: "n", nx: 0, nz: -1 }, { id: "e", nx: 1, nz: 0 }, { id: "w", nx: -1, nz: 0 },
  ].map((f) => ({
    ...f, width, steps, depth, rise: PLAZA.rise / (steps + 1),
    // The flight's footprint: from the face (A) out to A + steps·depth.
    x0: cx + f.nx * A, z0: cz + f.nz * A,
    len: steps * depth,
  }));
})();
function flightTop(f, x, z) {
  const [cx, cz] = PLAZA.center;
  const along = (x - cx) * f.nx + (z - cz) * f.nz - PLAZA.apothem; // 0 at the face → len outward
  const across = Math.abs((x - cx) * -f.nz + (z - cz) * f.nx);
  if (along < -0.02 || along > f.len || across > f.width / 2) return null;
  const k = Math.min(f.steps - 1, Math.floor(along / f.depth)); // 0 = top step (by the deck)
  return PLAZA_BASE_Y + (f.steps - k) * f.rise;
}
/** Solid structure top at (x, z), or null. */
function solidTopAt(x, z) {
  if (plazaOct(x, z) <= PLAZA.apothem) return PLAZA_DECK_Y;
  for (const f of PLAZA_FLIGHTS) {
    const t = flightTop(f, x, z);
    if (t !== null) return t;
  }
  return null;
}
/** A thin deck: a straight strip between two points, height profile y(t). */
function deckStrip(id, from, to, halfWidth, yAt) {
  const dx = to[0] - from[0], dz = to[1] - from[1];
  const L2 = dx * dx + dz * dz || 1;
  return {
    id, from, to, halfWidth, yAt, len: Math.sqrt(L2),
    topAt(qx, qz) {
      const t = ((qx - from[0]) * dx + (qz - from[1]) * dz) / L2;
      if (t < 0 || t > 1) return null;
      if (Math.hypot(qx - (from[0] + dx * t), qz - (from[1] + dz * t)) > halfWidth) return null;
      return yAt(t);
    },
  };
}
let _decks = null;
/** The thin decks (built lazily — they read the terrain at their ends). */
export function getIslandDecks() {
  if (_decks) return _decks;
  const J = ISLAND_JETTY, P = COVE_PIER, B = ROPE_BRIDGE;
  // The jetty + pier ramp up from the sand onto the boardwalk.
  const ramp = (from, to, deckY) => {
    const h0 = terrainHeight(from[0], from[1]);
    return (t) => lerp(h0 + 0.04, deckY, smoothstep(0, 0.22, t));
  };
  const bh0 = terrainHeight(B.from[0], B.from[1]), bh1 = terrainHeight(B.to[0], B.to[1]);
  _decks = [
    deckStrip("jetty", J.from, J.to, J.halfWidth, ramp(J.from, J.to, J.deckY)),
    deckStrip("cove-pier", P.from, P.to, P.halfWidth, ramp(P.from, P.to, P.deckY)),
    // The rope bridge sags gently between the headland and the islet.
    deckStrip("rope-bridge", B.from, B.to, B.halfWidth, (t) => lerp(bh0, bh1, t) + 0.05 - B.sag * Math.sin(Math.PI * t)),
  ];
  return _decks;
}
function deckTopAt(x, z, lim = Infinity) {
  let best = null;
  for (const d of getIslandDecks()) {
    const t = d.topAt(x, z);
    if (t !== null && t <= lim && (best === null || t > best)) best = t;
  }
  return best;
}

// ---------------------------------------------------------------------------
// THE PLAYER HOOKS
// ---------------------------------------------------------------------------
/** Walkable ground (layered: thin decks count once you're at/above them). */
export function islandGroundHeight(x, z, y) {
  const g = terrainHeight(x, z);
  const s = solidTopAt(x, z);
  let h = s !== null && s > g ? s : g;
  const lim = y === undefined ? Infinity : y + I_STEP_UP + 0.05;
  const d = deckTopAt(x, z, lim);
  if (d !== null && d > h) h = d;
  return h;
}
/** Sea / lagoon water surface where (x, z) is under water, else null. */
export function islandWaterAt(x, z) {
  return terrainHeight(x, z) < SEA_Y - 0.02 ? SEA_Y : null;
}
function onDeck(x, z, y) {
  const d = deckTopAt(x, z, y === undefined ? Infinity : y + I_STEP_UP + 0.05);
  return d !== null && (y === undefined || y >= d - 0.3);
}
/** Too-steep ground (cliffs, the volcano's upper cone, the bluff): downhill dir, else null. */
export function islandSlideAt(x, z, y) {
  if (solidTopAt(x, z) !== null || onDeck(x, z, y)) return null;
  if (slopeAt(x, z) < I_SLIDE_SLOPE) return null;
  const e = 0.6;
  const gx = terrainHeight(x + e, z) - terrainHeight(x - e, z);
  const gz = terrainHeight(x, z + e) - terrainHeight(x, z - e);
  const L = Math.hypot(gx, gz);
  if (L < 1e-6) return null;
  return { x: -gx / L, z: -gz / L };
}
/** Wading the shallows / the lagoon is slower. */
export function islandSpeedAt(x, z, y) {
  if (onDeck(x, z, y)) return 1;
  const depth = SEA_Y - terrainHeight(x, z);
  return depth > 0.12 ? I_WADE_SPEED : 1;
}
/** Deep water + lava send you back to the last dry spot. */
export function islandHazardAt(x, z, y) {
  if (solidTopAt(x, z) !== null || onDeck(x, z, y)) return false;
  if (SEA_Y - terrainHeight(x, z) > I_DEEP) return true;
  return isLavaAt(x, z);
}
export const SEA_HINT = "Whoa — that water's too deep! 🌊 Stay in the shallows (the jetty and the rope bridge are safe).";
export const LAVA_HINT_ISLAND = "Ouch — hot lava! 🔥 Ember Peak's lava is far too hot to touch.";
/** Which hazard it is (for the hint + sound). */
export function islandHazardInfo(x, z) {
  return isLavaAt(x, z) ? { hint: LAVA_HINT_ISLAND, sound: "lava" } : { hint: SEA_HINT, sound: "splash" };
}
/** A good, safe spot (dry, not steep, not lava). */
export function islandIsSafe(x, z) {
  return terrainHeight(x, z) > SEA_Y - 0.1 && slopeAt(x, z) < 0.7 && !isLavaAt(x, z);
}
/** Path ground (footprints). */
export function isOnIslandPath(x, z) {
  const n = nearestPath(x, z);
  return Boolean(n && n.e < -0.25) && terrainHeight(x, z) > SEA_Y + 0.05 && solidTopAt(x, z) === null;
}
/** Sand (footprints on the beaches). */
export function isOnSand(x, z) {
  const h = terrainHeight(x, z);
  return h > SEA_Y + 0.02 && h < 1.25 && coastSD(x, z) > -10 && solidTopAt(x, z) === null && !onDeck(x, z);
}
/** Snow (footprints on Frosty Peak). */
export function snowCover(x, z, h = terrainHeight(x, z)) {
  // Snow above the snowline (lower on the north-facing slopes), patchy at
  // its edge, on Frosty Peak — plus a tongue of snow that flows down past
  // Igloo Hollow to Pip's number line at its foot.
  const north = clamp((-(z) - 20) / 90, 0, 1);
  const n = fbm(x / 14, z / 14, 2, 95) - 0.5;
  const line = 9.5 - 3 * north + 1.8 * n;
  const fd = Math.hypot(x - (-61), z - (-64));
  let c = smoothstep(line - 1.2, line + 1.2, h) * smoothstep(60, 42, fd);
  const { d, t } = segDistT(x, z, -55, -57, -33, -27);
  const wide = 12 - 4 * t + 3 * n;
  c = Math.max(c, smoothstep(wide + 2, wide - 2, d) * (h > SEA_Y + 1.2 ? 1 : 0));
  return c;
}
export function isOnSnowIsland(x, z) {
  return snowCover(x, z) > 0.5 && solidTopAt(x, z) === null;
}
export { solidTopAt as islandSolidTopAt, deckTopAt as islandDeckTopAt };
export { SEA_Y };
