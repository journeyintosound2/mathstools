/**
 * FRACTION FARM — TERRAIN (rebuilt 2026-10-07). Pure + deterministic: the
 * height-field, the farm tracks, the level pads, the creek + duck pond, the
 * bridges, and the Player hooks. The renderer meshes the SAME 1 m grid with
 * the SAME triangle split as `terrainHeight`, so what you see is exactly what
 * you stand on. Layout numbers come from farmLayout.js.
 *
 *   rawHeight      gently tilted, softly undulating farmland (rising to the
 *                  north) + the big rolling HILLS + the outer hills past the
 *                  boundary fence
 *   carvedHeight   tracks flattened across → level PADS → the creek + pond
 *                  cut in (knee-deep everywhere — wade, never swim)
 *
 * LAYERED ground (as in the jungle): bridge decks are THIN — they only count
 * when you're at or above them, so you can wade under a bridge.
 */
import {
  clamp, lerp, smoothstep, segDistT, vnoise, fbm, smoothPolyline, cumLengths, buildSegIndex,
} from "../terrainKit.js";
import {
  BOUNDARY_FENCE, FARM_HILLS, FARM_PADS, CHALLENGE_PAD, FARM_PATH_CTRL, FARM_CREEK_CTRL, FARM_POND,
} from "./farmLayout.js";

/** Mirrors systems/collisionEngine.js STEP_UP (the checks assert they match). */
export const F_STEP_UP = 0.45;
export const F_SLIDE_SLOPE = 1.05;
export const F_WADE_SPEED = 0.62;

// ---------------------------------------------------------------------------
// RAW TERRAIN
// ---------------------------------------------------------------------------
function baseHeight(x, z) {
  return (
    1.0 - 0.03 * z +
    3.2 * (fbm(x / 70 + 5, z / 70 - 3, 3, 21) - 0.5) +
    0.9 * (fbm(x / 21 - 2, z / 21 + 7, 2, 22) - 0.5) +
    0.16 * (vnoise(x / 4.5, z / 4.5, 23) - 0.5)
  );
}
function hillT(hl, x, z) {
  const w = hl.warp * (fbm(x / 26 + hl.h, z / 26 - hl.h, 2, 9) - 0.5) * 2;
  if (hl.a) {
    const { d } = segDistT(x, z, hl.a[0], hl.a[1], hl.b[0], hl.b[1]);
    const dx = hl.b[0] - hl.a[0], dz = hl.b[1] - hl.a[1];
    // Signed distance across the ridge line (+ = east side). The radius eases
    // from the west flank's to the east's across it, so the hill has no seam
    // off the ridge's ends.
    const side = ((x - hl.a[0]) * dz - (z - hl.a[1]) * dx) / (Math.hypot(dx, dz) || 1);
    return d / lerp(hl.rw, hl.re, smoothstep(-12, 12, side)) + w;
  }
  return Math.hypot((x - hl.c[0]) / hl.rx, (z - hl.c[1]) / hl.rz) + w;
}
function hillHeight(hl, x, z) {
  const t = hillT(hl, x, z);
  if (t >= 1) return 0;
  const tt = hl.flat > 0 ? Math.max(0, (t - hl.flat) / (1 - hl.flat)) : t;
  return hl.h * 0.5 * (1 + Math.cos(Math.PI * tt));
}
/** Metres OUTSIDE the boundary fence rectangle (negative inside). */
export function outsideFence(x, z) {
  return Math.max(Math.abs(x) - BOUNDARY_FENCE.halfW, Math.abs(z) - BOUNDARY_FENCE.halfD);
}
function rimHeight(x, z) {
  const d = outsideFence(x, z);
  if (d < 2) return 0;
  const rise = smoothstep(2, 48, d);
  const rolls = 15 + 15 * fbm(x / 58 + 11, z / 58 - 4, 3, 31);
  return rise * rolls + Math.max(0, d - 48) * 0.45;
}
function smaxK(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
}
/** Height before tracks / pads / water are carved in. */
export function rawHeight(x, z) {
  let hill = 0;
  for (const hl of FARM_HILLS) {
    const h = hillHeight(hl, x, z);
    if (h > 0) hill = hill > 0 ? smaxK(hill, h, 2.5) : h;
  }
  return baseHeight(x, z) + hill + hill * 0.03 * (fbm(x / 11, z / 11, 2, 4) - 0.5) + rimHeight(x, z);
}

// ---------------------------------------------------------------------------
// LEVEL PADS
// ---------------------------------------------------------------------------
function padQ(f, x, z) {
  const ax = Math.abs(x - f.c[0]) / f.rx, az = Math.abs(z - f.c[1]) / f.rz;
  return Math.pow(Math.pow(ax, f.p) + Math.pow(az, f.p), 1 / f.p);
}
/** Metres from (x, z) out to the pad's rim, measured along the ray from its
 *  centre (− inside) — true distance for round pads, close for long ones. */
function padEdgeDist(f, x, z, q = padQ(f, x, z)) {
  return Math.hypot(x - f.c[0], z - f.c[1]) * (1 - 1 / Math.max(q, 1e-6));
}
const BANK_BINS = 48;
const BANK_MAX = 24;
const PADS = FARM_PADS.map((f) => {
  // Level = the mean raw height over the pad (balances cut + fill).
  let sum = 0, n = 0;
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
    const x = f.c[0] + (i / 4) * f.rx * 0.85, z = f.c[1] + (j / 4) * f.rz * 0.85;
    if (padQ(f, x, z) <= 1) { sum += rawHeight(x, z); n++; }
  }
  const level = Math.round((sum / Math.max(1, n)) * 20) / 20;
  return { ...f, level };
}).map((f, _i, all) => {
  // A terrace that shares another pad's level (one flat yard round a building).
  const level = f.levelOf ? all.find((g) => g.id === f.levelOf).level : f.level;
  // The BANK round the pad, per direction: the deeper the cut / fill at the
  // rim, the wider the bank that eases it back into the natural ground.
  const bank = new Float32Array(BANK_BINS);
  for (let a = 0; a < BANK_BINS; a++) {
    const ang = (a / BANK_BINS) * Math.PI * 2;
    const dx = Math.cos(ang), dz = Math.sin(ang);
    const rim = 1 / Math.pow(Math.pow(Math.abs(dx) / f.rx, f.p) + Math.pow(Math.abs(dz) / f.rz, f.p), 1 / f.p);
    let d0 = 0;
    for (const o of [0, 1.5, 3]) d0 = Math.max(d0, Math.abs(rawHeight(f.c[0] + dx * (rim + o), f.c[1] + dz * (rim + o)) - level));
    bank[a] = Math.min(BANK_MAX, 5 + d0 * 2.4);
  }
  return { ...f, level, bank };
});
function bankWidth(f, x, z) {
  const ang = Math.atan2(z - f.c[1], x - f.c[0]);
  const u = ((((ang / (Math.PI * 2)) % 1) + 1) % 1) * BANK_BINS;
  const i = Math.floor(u) % BANK_BINS, t = u - Math.floor(u);
  return f.bank[i] + (f.bank[(i + 1) % BANK_BINS] - f.bank[i]) * t;
}
const PAD_BY_ID = new Map(PADS.map((p) => [p.id, p]));
/** The level (height) of a pad by id. */
export function farmPadLevel(id) {
  const p = PAD_BY_ID.get(id);
  return p ? p.level : 0;
}
/** The pad height a challenge stage stands on (its renderer + camera add it). */
export function challengePadY(key) {
  return farmPadLevel(CHALLENGE_PAD[key]);
}
export function getFarmPads() { return PADS; }
/** The nearest pad: { e: metres outside its rim (− = on it), id } (or e = ∞). */
export function nearestPad(x, z) {
  let best = { e: Infinity, id: null };
  for (const f of PADS) {
    if (Math.abs(x - f.c[0]) > f.rx + 40 || Math.abs(z - f.c[1]) > f.rz + 40) continue;
    const e = padEdgeDist(f, x, z);
    if (e < best.e) best = { e, id: f.id };
  }
  return best;
}
/** Whether (x, z) is on the level part of pad `id` (with an inset margin). */
export function onPad(id, x, z, inset = 0) {
  const f = PAD_BY_ID.get(id);
  return Boolean(f) && padEdgeDist(f, x, z) <= -inset;
}
/** 1 inside a pad, fading to 0 across a wide ring beyond it (water keeps off). */
function padKeep(x, z) {
  let m = 0;
  for (const f of PADS) {
    if (Math.abs(x - f.c[0]) > f.rx + 16 || Math.abs(z - f.c[1]) > f.rz + 16) continue;
    const e = padEdgeDist(f, x, z);
    m = Math.max(m, 1 - smoothstep(0, 12, e));
  }
  return m;
}
const ease = (t) => 0.5 * t + 0.5 * t * t * (3 - 2 * t);
/** The pad (if any) whose level part (x, z) is on. */
function padUnder(x, z) {
  for (const f of PADS) {
    if (Math.abs(x - f.c[0]) > f.rx || Math.abs(z - f.c[1]) > f.rz) continue;
    if (padQ(f, x, z) <= 1) return f;
  }
  return null;
}
/**
 * Level pads into the ground → { h, w }. ON a pad: its level (w = 1). Off
 * them, each pad within reach pulls the ground toward its level across its
 * bank; where two banks overlap they blend by closeness (the nearer rim wins
 * smoothly), so neighbouring pads never tilt each other. w = how strongly a
 * pad holds this spot (1 at a rim → 0 at the bank's foot).
 */
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
  return { h: lerp(h, lsum / wsum, wmax), w: wmax };
}

// ---------------------------------------------------------------------------
// FARM TRACKS — graded like real farm roads. Each track gets a smoothed
// height PROFILE along its length (a ±10 m moving average, twice, of the
// ground with the pads already levelled in): a little cutting through each
// rise, a little embankment over each dip, so the grade stays even, and it
// meets every pad at the pad's own level.
// ---------------------------------------------------------------------------
const PROFILE_W = 10;
export const FARM_PATHS = FARM_PATH_CTRL.map((p) => {
  const pts = smoothPolyline(p.ctrl, 2);
  const s = cumLengths(pts);
  const base = pts.map(([x, z]) => padBlend(x, z, rawHeight(x, z)));
  // On / at a pad the track IS the pad surface: those points stay pinned
  // while everything else is smoothed, so the track ramps evenly out of the
  // pad. Each end is pinned to the ground too (where tracks join).
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
  // Then limit the grade (≤ 0.28 wherever the route allows): a forward +
  // backward pass, pinned points fixed.
  const G = 0.28;
  for (let it = 0; it < 6; it++) {
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
  prof = prof.map((v, i) => base[i].h + clamp(v - base[i].h, -1.8, 1.8));
  return { id: p.id, hw: p.hw, pts, s, prof };
});
const TRACK_REACH = 12;
const pathSegs = buildSegIndex(FARM_PATHS.flatMap((p) => p.pts.slice(0, -1).map((a, i) => ({
  p, i, ax: a[0], az: a[1], bx: p.pts[i + 1][0], bz: p.pts[i + 1][1], reach: p.hw + TRACK_REACH,
}))));
/** Nearest track: { e: metres outside its edge (− = on it), cx, cz, h (its graded height), p } or null. */
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
/**
 * Cut the tracks in. Each track holds the ground inside a CONE round its
 * graded surface: level across the track itself, and at most BATTER m of rise
 * or fall per metre away from its edge (a cutting's bank or an embankment's
 * side) — natural ground already inside every cone is left alone. Where two
 * tracks' cones disagree (switchback legs, junctions) the ground takes the
 * middle of the two, so the result is continuous everywhere.
 */
const BATTER = 0.68;
function trackCarve(x, z, h) {
  let lo = -Infinity, hi = Infinity;
  for (const sg of pathSegs(x, z)) {
    const { d, t } = segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz);
    const e = Math.max(0, d - sg.p.hw);
    if (e >= TRACK_REACH) continue;
    const hc = lerp(sg.p.prof[sg.i], sg.p.prof[sg.i + 1], t);
    // (The cone opens right out near the edge of its reach, so it can never
    //  leave a step where it ends.)
    const r = BATTER * e + 1.2 * Math.max(0, e - (TRACK_REACH - 4)) ** 2;
    lo = Math.max(lo, hc - r);
    hi = Math.min(hi, hc + r);
  }
  if (lo === -Infinity) return h;
  return lo <= hi ? clamp(h, lo, hi) : (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// THE CREEK + THE DUCK POND (knee-deep)
// ---------------------------------------------------------------------------
export const WATER_DEPTH = 0.6;
export const BANK_UP = 0.3;
export const FARM_CREEK = (() => {
  const pts = smoothPolyline(FARM_CREEK_CTRL, 1.5);
  const s = cumLengths(pts);
  const len = s[s.length - 1];
  const hw = s.map((v) => lerp(1.5, 2.4, v / len));
  // Water level: the ground along the line, eased down a little, never
  // running uphill, then gently smoothed.
  let lvl = pts.map(([x, z]) => {
    // Lowest ground across the channel here (it follows the valley floor).
    let m = Infinity;
    for (const o of [-3, -1.5, 0, 1.5, 3]) m = Math.min(m, rawHeight(x + o, z));
    return m - 0.45;
  });
  for (let i = 1; i < lvl.length; i++) lvl[i] = Math.min(lvl[i], lvl[i - 1] - 0.004);
  for (let pass = 0; pass < 6; pass++) {
    const nx = lvl.slice();
    for (let i = 1; i < lvl.length - 1; i++) nx[i] = Math.min(lvl[i - 1], (lvl[i - 1] + lvl[i] + lvl[i + 1]) / 3);
    lvl = nx;
  }
  return { id: "creek", pts, s, len, hw, lvl };
})();
export const POND_LEVEL = FARM_CREEK.lvl[FARM_CREEK.lvl.length - 1] - 0.02;
const creekSegs = buildSegIndex(FARM_CREEK.pts.slice(0, -1).map((p, i) => ({
  i, ax: p[0], az: p[1], bx: FARM_CREEK.pts[i + 1][0], bz: FARM_CREEK.pts[i + 1][1], reach: FARM_CREEK.hw[i] + 18,
})));
/** Nearest point on the creek: { d, hw, level, s, i, t } or null. */
export function nearestCreek(x, z) {
  let best = null, bd = Infinity;
  for (const sg of creekSegs(x, z)) {
    const { d, t } = segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz);
    const hw = lerp(FARM_CREEK.hw[sg.i], FARM_CREEK.hw[sg.i + 1], t);
    if (d - hw < bd) {
      bd = d - hw;
      best = { d, hw, level: lerp(FARM_CREEK.lvl[sg.i], FARM_CREEK.lvl[sg.i + 1], t), s: lerp(FARM_CREEK.s[sg.i], FARM_CREEK.s[sg.i + 1], t), i: sg.i, t };
    }
  }
  return best;
}
function pondEdgeDist(x, z) {
  return Math.hypot(x - FARM_POND.center[0], z - FARM_POND.center[1]) - FARM_POND.radius;
}
function bankProfile(level, e) {
  return level - WATER_DEPTH + (WATER_DEPTH + BANK_UP) * smoothstep(-2.0, 0.6, e) + 0.09 * Math.max(0, e - 0.6);
}
/** Metres outside the nearest water's edge (− = in the water) + its level. */
function nearestWater(x, z) {
  let e = Infinity, level = 0;
  const ch = nearestCreek(x, z);
  if (ch) { e = ch.d - ch.hw; level = ch.level; }
  const ep = pondEdgeDist(x, z);
  if (ep < e) { e = ep; level = POND_LEVEL; }
  return { e, level };
}
function waterCarve(x, z, h) {
  const { e, level } = nearestWater(x, z);
  if (e >= 14) return h;
  const prof = bankProfile(level, e);
  if (e < 0.6) return Math.min(h, prof);
  // (The soft bank keeps off the pads and the track surfaces.)
  const np = nearestPath(x, z);
  const trackKeep = np ? 1 - smoothstep(0, 4, np.e) : 0;
  const soft = lerp(prof, h, Math.max(smoothstep(2.5, 14, e), padKeep(x, z), trackKeep));
  return lerp(soft, h, smoothstep(2.5, 7, h - prof));
}
function waterLevelRaw(x, z) {
  const { e, level } = nearestWater(x, z);
  return e < 1.2 ? level : NaN;
}

/** The full carved height (before grid sampling): pads → tracks → pad tops → water. */
export function carvedHeight(x, z) {
  let h = padBlend(x, z, rawHeight(x, z)).h;
  h = trackCarve(x, z, h);
  const on = padUnder(x, z);
  if (on) h = on.level;
  h = waterCarve(x, z, h);
  return h;
}

// ---------------------------------------------------------------------------
// THE 1 m GRID (lazy) — heights, water levels (NaN = dry), slopes.
// ---------------------------------------------------------------------------
export const GRID = { xMin: -186, xMax: 186, zMin: -170, zMax: 170, step: 1 };
GRID.nx = Math.round((GRID.xMax - GRID.xMin) / GRID.step) + 1;
GRID.nz = Math.round((GRID.zMax - GRID.zMin) / GRID.step) + 1;
let _grid = null;
export function getFarmGrid() {
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
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    const hx = h[j * nx + Math.min(nx - 1, i + 1)] - h[j * nx + Math.max(0, i - 1)];
    const hz = h[Math.min(nz - 1, j + 1) * nx + i] - h[Math.max(0, j - 1) * nx + i];
    slope[k] = Math.hypot(hx, hz) / (2 * GRID.step);
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
/** Terrain height — exactly the rendered mesh's triangles (split a,c,b / b,c,e). */
export function terrainHeight(x, z) {
  const g = getFarmGrid().h;
  const { i, j, tx, tz } = gridCoords(x, z);
  const nx = GRID.nx;
  const a = g[j * nx + i], b = g[j * nx + i + 1], c = g[(j + 1) * nx + i], e = g[(j + 1) * nx + i + 1];
  if (tx + tz <= 1) return a + (b - a) * tx + (c - a) * tz;
  return e + (c - e) * (1 - tx) + (b - e) * (1 - tz);
}
export function slopeAt(x, z) {
  const g = getFarmGrid().slope;
  const { i, j, tx, tz } = gridCoords(x, z);
  const nx = GRID.nx;
  const a = g[j * nx + i], b = g[j * nx + i + 1], c = g[(j + 1) * nx + i], d = g[(j + 1) * nx + i + 1];
  return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz;
}
/** Water surface height where the ground is actually under water, else null. */
export function farmWaterAt(x, z) {
  const g = getFarmGrid();
  const { i, j, tx, tz } = gridCoords(x, z);
  const k = (tz < 0.5 ? j : j + 1) * GRID.nx + (tx < 0.5 ? i : i + 1);
  const lvl = g.water[k];
  if (Number.isNaN(lvl)) return null;
  return terrainHeight(x, z) < lvl - 0.02 ? lvl : null;
}
/** Metres outside the nearest water's edge (− = in it). */
export function waterEdgeDist(x, z) {
  return nearestWater(x, z).e;
}

// ---------------------------------------------------------------------------
// BRIDGES — wherever a track crosses the creek: an arched plank deck spanning
// bank to bank (thin: you can wade under it).
// ---------------------------------------------------------------------------
export const FARM_BRIDGES = [];
let _built = false;
function buildBridges() {
  if (_built) return;
  _built = true;
  getFarmGrid();
  for (const p of FARM_PATHS) {
    // Find each run of track centre-points that sit in the creek channel.
    let run = null;
    const runs = [];
    p.pts.forEach(([x, z], i) => {
      const ch = nearestCreek(x, z);
      const wet = ch && ch.d < ch.hw + 1.2;
      if (wet) {
        if (!run) run = { i0: i, i1: i, best: i, bd: ch.d };
        run.i1 = i;
        if (ch.d < run.bd) { run.bd = ch.d; run.best = i; }
      } else if (run) { runs.push(run); run = null; }
    });
    if (run) runs.push(run);
    runs.forEach((r, k) => {
      const [x, z] = p.pts[r.best];
      const a = p.pts[Math.max(0, r.best - 1)], b = p.pts[Math.min(p.pts.length - 1, r.best + 1)];
      const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
      const ch = nearestCreek(x, z);
      const half = ch.hw + 3.4;
      const from = [x - (tx / tl) * half, z - (tz / tl) * half];
      const to = [x + (tx / tl) * half, z + (tz / tl) * half];
      const h0 = terrainHeight(from[0], from[1]), h1 = terrainHeight(to[0], to[1]);
      const br = { id: `bridge-${p.id}${k ? `-${k}` : ""}`, from, to, halfWidth: p.hw + 0.25, h0, h1, apex: 0.7 };
      br.deckAt = (t) => lerp(br.h0, br.h1, t) + br.apex * Math.sin(Math.PI * t);
      br.topAt = (qx, qz, lim) => {
        const dx = br.to[0] - br.from[0], dz = br.to[1] - br.from[1];
        const L2 = dx * dx + dz * dz || 1;
        const t = ((qx - br.from[0]) * dx + (qz - br.from[1]) * dz) / L2;
        if (t < 0 || t > 1) return null;
        if (Math.hypot(qx - (br.from[0] + dx * t), qz - (br.from[1] + dz * t)) > br.halfWidth) return null;
        const hh = br.deckAt(t);
        return hh <= lim ? hh : null;
      };
      FARM_BRIDGES.push(br);
    });
  }
}
export function ensureFarmStructures() { buildBridges(); }
function structureTopAt(x, z, lim = Infinity) {
  buildBridges();
  let best = null;
  for (const b of FARM_BRIDGES) {
    if (Math.abs(x - (b.from[0] + b.to[0]) / 2) > 9 || Math.abs(z - (b.from[1] + b.to[1]) / 2) > 9) continue;
    const t = b.topAt(x, z, lim);
    if (t !== null && (best === null || t > best)) best = t;
  }
  return best;
}

// ---------------------------------------------------------------------------
// THE PLAYER HOOKS
// ---------------------------------------------------------------------------
/** Walkable ground (layered: a bridge deck counts once you're at/above it). */
export function farmGroundHeight(x, z, y) {
  const lim = y === undefined ? Infinity : y + F_STEP_UP + 0.05;
  const g = terrainHeight(x, z);
  const s = structureTopAt(x, z, lim);
  return s !== null && s > g ? s : g;
}
/** Too-steep ground (the outer hills): the downhill direction, else null. */
export function farmSlideAt(x, z, y) {
  const g = terrainHeight(x, z);
  const lim = y === undefined ? Infinity : y + F_STEP_UP + 0.05;
  const s = structureTopAt(x, z, lim);
  if (s !== null && s >= g - 0.02) return null;
  if (slopeAt(x, z) < F_SLIDE_SLOPE) return null;
  const e = 0.6;
  const gx = terrainHeight(x + e, z) - terrainHeight(x - e, z);
  const gz = terrainHeight(x, z + e) - terrainHeight(x, z - e);
  const L = Math.hypot(gx, gz);
  if (L < 1e-6) return null;
  return { x: -gx / L, z: -gz / L };
}
/** Wading through the knee-deep creek / pond is a little slower. */
export function farmSpeedAt(x, z, y) {
  const w = farmWaterAt(x, z);
  if (w === null) return 1;
  if (y !== undefined && y > w - 0.12) return 1;
  return F_WADE_SPEED;
}
/** A good, safe spot (dry, not steep). */
export function farmIsSafe(x, z) {
  return farmWaterAt(x, z) === null && slopeAt(x, z) < 0.7;
}
/** Dirt-track ground (footprints). */
export function isOnFarmPath(x, z) {
  const n = nearestPath(x, z);
  return Boolean(n && n.e < -0.25) && farmWaterAt(x, z) === null;
}
