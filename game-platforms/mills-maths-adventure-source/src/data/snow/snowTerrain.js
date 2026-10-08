/**
 * SNOWBALL SUMS — TERRAIN (rebuilt 2026-10-08). Pure + deterministic: the
 * height-field, the packed-snow trails, the level pads, the FROZEN pond +
 * river (ice you skate on), the GLACIER LAKE (icy water — you hop back out),
 * the toboggan CHUTES you slide down, the chairlift, the bridges + ice floes,
 * and the Player hooks. The renderer meshes the SAME 1 m grid with the SAME
 * triangle split as `terrainHeight`, so what you see is what you stand on.
 * Layout numbers come from snowLayout.js.
 *
 *   rawHeight     rising snowfields (higher to the north) + the big hills, the
 *                 north-west escarpment and the jagged rim mountains
 *   carvedHeight  pads levelled → trails graded → frozen river + pond cut in →
 *                 chutes carved (troughs with berms) → the glacier lake +
 *                 its islands
 */
import {
  clamp, lerp, smoothstep, segDistT, vnoise, fbm, smoothPolyline, cumLengths, buildSegIndex,
} from "../terrainKit.js";
import {
  SNOW_BOUNDARY, SNOW_HILLS, SNOW_ESCARPMENT, SNOW_PADS, CHALLENGE_PAD, SNOW_LAKE, ICE_FLOES, LAKE_BRIDGES,
  FROZEN_RIVER_CTRL, ICE_PUDDLES, SNOW_TRAIL_CTRL, SNOW_CHUTES, SNOW_LIFT, SNOW_CHALLENGE_SPOTS,
  PETE_WANDER, PETE_CHALLENGE_CLEARANCE,
} from "./snowLayout.js";

/** Mirrors systems/collisionEngine.js STEP_UP (the checks assert they match). */
export const S_STEP_UP = 0.45;
export const S_SLIDE_SLOPE = 1.05;

// ---------------------------------------------------------------------------
// RAW TERRAIN
// ---------------------------------------------------------------------------
function baseHeight(x, z) {
  // Rising to the north; broad swells; wind-sculpted DRIFTS (long, wavy
  // ridges of snow lying across the valley); fine crust texture.
  const drift = Math.sin((x * 0.55 + z * 0.84) / 17 + 3.2 * fbm(x / 60, z / 60, 2, 51)) * (0.5 + fbm(x / 40 - 3, z / 40 + 5, 2, 52));
  return (
    1.8 - 0.06 * z +
    7.0 * (fbm(x / 88 + 3, z / 88 - 6, 3, 41) - 0.5) +
    2.2 * (fbm(x / 28 - 4, z / 28 + 2, 2, 42) - 0.5) +
    1.1 * drift +
    0.14 * (vnoise(x / 5, z / 5, 43) - 0.5)
  );
}
function hillT(hl, x, z) {
  const w = hl.warp * (fbm(x / 26 + hl.h, z / 26 - hl.h, 2, 9) - 0.5) * 2;
  if (hl.a) {
    const { d } = segDistT(x, z, hl.a[0], hl.a[1], hl.b[0], hl.b[1]);
    const dx = hl.b[0] - hl.a[0], dz = hl.b[1] - hl.a[1];
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
/** Metres OUTSIDE the valley rim rectangle (negative inside). */
export function outsideRim(x, z) {
  return Math.max(Math.abs(x) - SNOW_BOUNDARY.halfW, Math.abs(z) - SNOW_BOUNDARY.halfD);
}
/** The rim: a steep snow wall just inside the boundary (you slide back off
 *  it), then jagged, rocky mountains rising on beyond. */
function rimHeight(x, z) {
  const d = outsideRim(x, z) + 7 * (fbm(x / 40 + 2, z / 40 - 9, 2, 44) - 0.5);
  if (d < -46) return 0;
  // Rising snowfields round the valley's edge, then the steep wall.
  const foothills = 9 * smoothstep(-46, -8, d) * (0.6 + 0.8 * fbm(x / 50 - 1, z / 50 + 6, 2, 53));
  if (d < -9) return foothills;
  const wall = foothills + 20 * smoothstep(-8, 9, d);
  // Ridged noise → jagged crests and gullies further out.
  const r1 = 1 - Math.abs(fbm(x / 36 - 7, z / 36 + 4, 3, 45) * 2 - 1);
  const r2 = 1 - Math.abs(fbm(x / 13 + 5, z / 13 - 2, 2, 46) * 2 - 1);
  const peaks = smoothstep(4, 46, d) * (16 + 34 * r1 * r1 + 8 * r2);
  return wall + peaks + Math.max(0, d - 46) * 0.7;
}
function escarpment(x, z) {
  const E = SNOW_ESCARPMENT;
  const z0 = E.z0 + 4 * (fbm(x / 30 + 1, 3.3, 2, 47) - 0.5);
  const k = smoothstep(z0, E.z1, z) * (1 - smoothstep(E.xEnd - 18, E.xEnd + 14, x));
  return k * (E.h + 3 * (fbm(x / 18, z / 18, 2, 48) - 0.5));
}
function smaxK(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
}
/** Height before trails / pads / ice / water are carved in. */
export function rawHeight(x, z) {
  let hill = 0, dip = 0;
  for (const hl of SNOW_HILLS) {
    const h = hillHeight(hl, x, z);
    if (h > 0) hill = hill > 0 ? smaxK(hill, h, 2.5) : h;
    else if (h < 0) dip += h;
  }
  return baseHeight(x, z) + hill + hill * 0.04 * (fbm(x / 11, z / 11, 2, 49) - 0.5) + dip + escarpment(x, z) + rimHeight(x, z);
}

// ---------------------------------------------------------------------------
// THE GLACIER LAKE (shape + level) — needed before the pads (island levels).
// ---------------------------------------------------------------------------
/** Metres outside the lake's shoreline (− = in the water), islands ignored. */
function lakeShoreDist(x, z) {
  const L = SNOW_LAKE;
  const q = Math.hypot((x - L.center[0]) / L.rx, (z - L.center[1]) / L.rz);
  return (q - 1) * Math.sqrt(L.rx * L.rz) + L.rough * (fbm(x / 22 + 8, z / 22 - 1, 2, 50) - 0.5) * 2;
}
/** The lake's water level: a little under the lowest ground round its shore. */
export const LAKE_LEVEL = (() => {
  const L = SNOW_LAKE;
  const hs = [];
  for (let a = 0; a < 72; a++) {
    const ang = (a / 72) * Math.PI * 2;
    const x = L.center[0] + Math.cos(ang) * (L.rx + 4), z = L.center[1] + Math.sin(ang) * (L.rz + 4);
    hs.push(rawHeight(x, z));
  }
  hs.sort((p, q) => p - q);
  return Math.round((hs[Math.floor(hs.length * 0.1)] - 0.9) * 20) / 20;
})();
export const LAKE_DEPTH = 2.4;
export const ISLAND_RISE = 0.75;

// ---------------------------------------------------------------------------
// LEVEL PADS
// ---------------------------------------------------------------------------
function padQ(f, x, z) {
  const ax = Math.abs(x - f.c[0]) / f.rx, az = Math.abs(z - f.c[1]) / f.rz;
  return Math.pow(Math.pow(ax, f.p) + Math.pow(az, f.p), 1 / f.p);
}
function padEdgeDist(f, x, z, q = padQ(f, x, z)) {
  const d = Math.hypot(x - f.c[0], z - f.c[1]);
  if (d < 1e-6) return -Math.min(f.rx, f.rz); // the very centre
  return d * (1 - 1 / Math.max(q, 1e-6));
}
const BANK_BINS = 48;
const BANK_MAX = 24;
function inclineAt(f, x, z) {
  return f.incline ? f.incline.gx * (x - f.c[0]) + f.incline.gz * (z - f.c[1]) : 0;
}
const PADS = SNOW_PADS.map((f) => {
  if (f.island) return { ...f, level: LAKE_LEVEL + ISLAND_RISE };
  let sum = 0, n = 0;
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
    const x = f.c[0] + (i / 4) * f.rx * 0.85, z = f.c[1] + (j / 4) * f.rz * 0.85;
    if (padQ(f, x, z) <= 1) { sum += rawHeight(x, z) - inclineAt(f, x, z); n++; }
  }
  const level = Math.round((sum / Math.max(1, n) - (f.ice ? 0.55 : 0)) * 20) / 20;
  return { ...f, level };
}).map((f, _i, all) => {
  const level = f.levelOf ? all.find((g) => g.id === f.levelOf).level : f.level;
  const bank = new Float32Array(BANK_BINS);
  for (let a = 0; a < BANK_BINS; a++) {
    const ang = (a / BANK_BINS) * Math.PI * 2;
    const dx = Math.cos(ang), dz = Math.sin(ang);
    const rim = 1 / Math.pow(Math.pow(Math.abs(dx) / f.rx, f.p) + Math.pow(Math.abs(dz) / f.rz, f.p), 1 / f.p);
    let d0 = 0, cut = false;
    for (const o of [0, 1.5, 3]) {
      const px = f.c[0] + dx * (rim + o), pz = f.c[1] + dz * (rim + o);
      const dd = rawHeight(px, pz) - (level + inclineAt(f, px, pz));
      d0 = Math.max(d0, Math.abs(dd));
      if (dd > 1.5) cut = true;
    }
    // A cliff-backed pad (the cave) keeps its cut nearly vertical.
    bank[a] = f.cliff && cut ? 2.5 : Math.min(BANK_MAX, 5 + d0 * 2.4);
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
/** A pad's level at (x, z) — constant, except the inclined sled run. */
function padLevelAt(f, x, z) { return f.level + inclineAt(f, x, z); }
export function snowPadLevel(id) {
  const p = PAD_BY_ID.get(id);
  return p ? p.level : 0;
}
/** The height a challenge stage stands on (its renderer + camera add it). */
export function challengePadY(key) {
  const id = CHALLENGE_PAD[key];
  return id ? snowPadLevel(id) : 0;
}
export function getSnowPads() { return PADS; }
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
function padKeep(x, z, reach = 12) {
  let m = 0;
  for (const f of PADS) {
    if (Math.abs(x - f.c[0]) > f.rx + reach + 4 || Math.abs(z - f.c[1]) > f.rz + reach + 4) continue;
    m = Math.max(m, 1 - smoothstep(0, reach, padEdgeDist(f, x, z)));
  }
  return m;
}
const ease = (t) => 0.5 * t + 0.5 * t * t * (3 - 2 * t);
function padUnder(x, z, land = true) {
  for (const f of PADS) {
    if (land && f.island) continue;
    if (Math.abs(x - f.c[0]) > f.rx || Math.abs(z - f.c[1]) > f.rz) continue;
    if (padQ(f, x, z) <= 1) return f;
  }
  return null;
}
function padBlend(x, z, h) {
  const on = padUnder(x, z);
  if (on) return { h: padLevelAt(on, x, z), w: 1 };
  let wsum = 0, lsum = 0, wmax = 0;
  for (const f of PADS) {
    if (f.island) continue;
    if (Math.abs(x - f.c[0]) > f.rx + BANK_MAX + 2 || Math.abs(z - f.c[1]) > f.rz + BANK_MAX + 2) continue;
    const e = padEdgeDist(f, x, z);
    const B = bankWidth(f, x, z);
    if (e >= B) continue;
    const w = 1 - ease(e / B);
    const W = w / (1 - w + 1e-4);
    wsum += W; lsum += W * padLevelAt(f, x, z); wmax = Math.max(wmax, w);
  }
  if (wmax <= 0) return { h, w: 0 };
  return { h: lerp(h, lsum / wsum, wmax), w: wmax };
}

// ---------------------------------------------------------------------------
// PACKED-SNOW TRAILS — graded like the farm's tracks.
// ---------------------------------------------------------------------------
const PROFILE_W = 10;
function gradeProfile(pts, base, pinned, G, passes = 4) {
  const s = cumLengths(pts);
  let prof = base.slice();
  for (let pass = 0; pass < passes; pass++) {
    prof = prof.map((v, i) => {
      if (pinned[i]) return base[i];
      let sum = 0, w = 0;
      for (let j = i; j >= 0 && s[i] - s[j] <= PROFILE_W; j--) { sum += prof[j]; w++; }
      for (let j = i + 1; j < prof.length && s[j] - s[i] <= PROFILE_W; j++) { sum += prof[j]; w++; }
      return sum / w;
    });
  }
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
  return { s, prof };
}
/** Where a trail's END meets an earlier trail: that trail's surface height. */
function junctionHeight(built, x, z) {
  let best = null, be = Infinity;
  for (const q of built) {
    for (let i = 0; i < q.pts.length - 1; i++) {
      const [ax, az] = q.pts[i], [bx, bz] = q.pts[i + 1];
      const { d, t } = segDistT(x, z, ax, az, bx, bz);
      if (d - q.hw < be) { be = d - q.hw; best = lerp(q.prof[i], q.prof[i + 1], t); }
    }
  }
  return be < 0.6 ? best : null;
}
export const SNOW_TRAILS = (() => {
  const built = [];
  for (const p of SNOW_TRAIL_CTRL) {
    const pts = smoothPolyline(p.ctrl, 2);
    const base = pts.map(([x, z]) => padBlend(x, z, rawHeight(x, z)));
    // A trail that branches off an earlier one starts (or ends) ON its surface.
    for (const i of [0, pts.length - 1]) {
      const jh = junctionHeight(built, pts[i][0], pts[i][1]);
      if (jh !== null) base[i] = { h: jh, w: 1 };
    }
    const pinned = base.map((b, i) => b.w > 0.97 || i === 0 || i === base.length - 1);
    const { s, prof: pr } = gradeProfile(pts, base.map((b) => b.h), pinned, 0.28);
    const prof = pr.map((v, i) => base[i].h + clamp(v - base[i].h, -7, 7));
    built.push({ id: p.id, hw: p.hw, pts, s, prof });
  }
  return built;
})();
const TRACK_REACH = 12;
const trailSegs = buildSegIndex(SNOW_TRAILS.flatMap((p) => p.pts.slice(0, -1).map((a, i) => ({
  p, i, ax: a[0], az: a[1], bx: p.pts[i + 1][0], bz: p.pts[i + 1][1], reach: p.hw + TRACK_REACH,
}))));
/** Nearest trail: { e: metres outside its edge (− = on it), cx, cz, h, p } or null. */
export function nearestTrail(x, z) {
  let best = null, be = Infinity;
  for (const sg of trailSegs(x, z)) {
    const { d, t } = segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz);
    const e = d - sg.p.hw;
    if (e < be) {
      be = e;
      best = { e, cx: lerp(sg.ax, sg.bx, t), cz: lerp(sg.az, sg.bz, t), h: lerp(sg.p.prof[sg.i], sg.p.prof[sg.i + 1], t), p: sg.p };
    }
  }
  return best;
}
const BATTER = 0.68;
function trackCarve(x, z, h) {
  let lo = -Infinity, hi = Infinity, near = null, nd = Infinity;
  for (const sg of trailSegs(x, z)) {
    const { d, t } = segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz);
    const e = Math.max(0, d - sg.p.hw);
    if (e >= TRACK_REACH) continue;
    const hc = lerp(sg.p.prof[sg.i], sg.p.prof[sg.i + 1], t);
    const r = BATTER * e + 1.2 * Math.max(0, e - (TRACK_REACH - 4)) ** 2;
    lo = Math.max(lo, hc - r);
    hi = Math.min(hi, hc + r);
    if (d - sg.p.hw < nd) { nd = d - sg.p.hw; near = [hc - r, hc + r]; }
  }
  if (lo === -Infinity) return h;
  if (lo <= hi) return clamp(h, lo, hi);
  // Two trails at different heights crowd each other: the NEARER one wins
  // (its surface stays flat; a cut bank forms between them).
  return clamp(h, near[0], near[1]);
}

// ---------------------------------------------------------------------------
// THE FROZEN RIVER — an ice ribbon from the falls pool down to the pond.
// ---------------------------------------------------------------------------
const POND = PAD_BY_ID.get("pond");
const FALLS_POOL = PAD_BY_ID.get("falls-pool");
export const FROZEN_RIVER = (() => {
  const pts = smoothPolyline(FROZEN_RIVER_CTRL, 1.5);
  const s = cumLengths(pts);
  const len = s[s.length - 1];
  const hw = s.map((v) => lerp(2.4, 3.6, v / len));
  let lvl = pts.map(([x, z]) => {
    let m = Infinity;
    for (const o of [-3, -1.5, 0, 1.5, 3]) m = Math.min(m, padBlend(x + o, z, rawHeight(x + o, z)).h);
    return m - 0.5;
  });
  const n = lvl.length - 1;
  const pin = () => {
    lvl[0] = FALLS_POOL.level;
    lvl[n] = POND.level;
    // Never running uphill toward the pond (and never below it).
    for (let i = 1; i < n; i++) lvl[i] = Math.min(lvl[i], lvl[i - 1] - 0.005);
    for (let i = n - 1; i > 0; i--) lvl[i] = Math.max(lvl[i], lvl[i + 1] + 0.005);
  };
  pin();
  for (let pass = 0; pass < 10; pass++) {
    const nx = lvl.slice();
    for (let i = 1; i < n; i++) nx[i] = (lvl[i - 1] + lvl[i] + lvl[i + 1]) / 3;
    lvl = nx;
    pin();
  }
  return { id: "frozen-river", pts, s, len, hw, lvl };
})();
const riverSegs = buildSegIndex(FROZEN_RIVER.pts.slice(0, -1).map((p, i) => ({
  i, ax: p[0], az: p[1], bx: FROZEN_RIVER.pts[i + 1][0], bz: FROZEN_RIVER.pts[i + 1][1], reach: FROZEN_RIVER.hw[i] + 16,
})));
/** Nearest point on the frozen river: { d, hw, level, s } or null. */
export function nearestRiver(x, z) {
  let best = null, bd = Infinity;
  for (const sg of riverSegs(x, z)) {
    const { d, t } = segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz);
    const hw = lerp(FROZEN_RIVER.hw[sg.i], FROZEN_RIVER.hw[sg.i + 1], t);
    if (d - hw < bd) {
      bd = d - hw;
      best = { d, hw, level: lerp(FROZEN_RIVER.lvl[sg.i], FROZEN_RIVER.lvl[sg.i + 1], t), s: lerp(FROZEN_RIVER.s[sg.i], FROZEN_RIVER.s[sg.i + 1], t) };
    }
  }
  return best;
}
const RIVER_BANK = 0.55;
function riverCarve(x, z, h) {
  const r = nearestRiver(x, z);
  if (!r) return h;
  const e = r.d - r.hw;
  if (e >= 12) return h;
  if (e <= 0) return r.level;
  // A low snow bank (0.55 m) out to 1.8 m, then easing back into the ground.
  if (e < 1.8) return r.level + RIVER_BANK * smoothstep(0, 1.8, e);
  const np = nearestTrail(x, z);
  const keep = Math.max(padKeep(x, z, 8), np ? 1 - smoothstep(0, 3, np.e) : 0);
  return lerp(r.level + RIVER_BANK, h, Math.max(smoothstep(1.8, 12, e), keep * smoothstep(1.8, 4.5, e)));
}

// ---------------------------------------------------------------------------
// TOBOGGAN CHUTES — icy troughs with berms, always falling.
// ---------------------------------------------------------------------------
const CHUTE_BERM = 1.0, CHUTE_BERM_W = 1.8;
export const SNOW_CHUTE_PATHS = SNOW_CHUTES.map((c) => {
  const pts = smoothPolyline(c.ctrl, 1.2);
  const s = cumLengths(pts);
  const len = s[s.length - 1];
  const base = pts.map(([x, z]) => padBlend(x, z, rawHeight(x, z)).h);
  // Both ends pinned to the ground (the summit pad above, the runout pad /
  // the pond below); in between a profile that ALWAYS falls (grade 0.07 –
  // 0.5), smoothed so the ride swoops instead of stepping.
  const n = base.length - 1;
  let prof = base.slice();
  const fix = () => {
    for (let it = 0; it < 4; it++) {
      for (let i = 1; i < n; i++) {
        const ds = s[i] - s[i - 1];
        prof[i] = clamp(prof[i], prof[i - 1] - 0.5 * ds, prof[i - 1] - 0.07 * ds);
      }
      for (let i = n - 1; i > 0; i--) {
        const ds = s[i + 1] - s[i];
        prof[i] = clamp(prof[i], prof[i + 1] + 0.07 * ds, prof[i + 1] + 0.5 * ds);
      }
    }
  };
  fix();
  for (let pass = 0; pass < 10; pass++) {
    const nx = prof.slice();
    for (let i = 1; i < n; i++) nx[i] = (prof[i - 1] + 2 * prof[i] + prof[i + 1]) / 4;
    prof = nx;
    fix();
  }
  return { id: c.id, hw: c.hw, pts, s, len, prof, runout: c.runout };
});
const chuteSegs = buildSegIndex(SNOW_CHUTE_PATHS.flatMap((c) => c.pts.slice(0, -1).map((a, i) => ({
  c, i, ax: a[0], az: a[1], bx: c.pts[i + 1][0], bz: c.pts[i + 1][1], reach: c.hw + CHUTE_BERM_W + 14,
}))));
/** Nearest chute point: { c, s, d (unsigned), off (signed, + = left of travel), h, i, t, tx, tz } or null. */
export function nearestChute(x, z) {
  let best = null, bd = Infinity;
  for (const sg of chuteSegs(x, z)) {
    const { d, t } = segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz);
    if (d < bd) {
      bd = d;
      const tx = sg.bx - sg.ax, tz = sg.bz - sg.az, tl = Math.hypot(tx, tz) || 1;
      const off = ((x - sg.ax) * -tz + (z - sg.az) * tx) / tl;
      best = {
        c: sg.c, d, off, i: sg.i, t, tx: tx / tl, tz: tz / tl,
        s: lerp(sg.c.s[sg.i], sg.c.s[sg.i + 1], t), h: lerp(sg.c.prof[sg.i], sg.c.prof[sg.i + 1], t),
      };
    }
  }
  return best;
}
function chuteCarve(x, z, h) {
  let forced = null, fd = Infinity, lo = -Infinity, hi = Infinity;
  for (const sg of chuteSegs(x, z)) {
    const { d, t } = segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz);
    const hc = lerp(sg.c.prof[sg.i], sg.c.prof[sg.i + 1], t);
    const hw = sg.c.hw;
    // Past the chute's ends only the cone applies (no berm wall across).
    const endT = (sg.i === 0 && t <= 0) || (sg.i === sg.c.pts.length - 2 && t >= 1);
    if (d <= hw + CHUTE_BERM_W && !endT) {
      const v = hc + CHUTE_BERM * smoothstep(hw, hw + CHUTE_BERM_W, d);
      if (d < fd) { fd = d; forced = v; }
    }
    const e = Math.max(0, d - hw - CHUTE_BERM_W);
    const top = hc + (endT ? 0 : CHUTE_BERM);
    const r = BATTER * e + 1.2 * Math.max(0, e - 10) ** 2;
    lo = Math.max(lo, top - 0.2 - r);
    hi = Math.min(hi, top + r);
  }
  if (forced !== null) return forced;
  if (lo === -Infinity) return h;
  return lo <= hi ? clamp(h, lo, hi) : (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// THE GLACIER LAKE — water bed, shore, islands.
// ---------------------------------------------------------------------------
const ISLANDS = PADS.filter((f) => f.island);
/** Metres outside the WATER's edge (− = in the water): islands are land. */
export function lakeEdgeDist(x, z) {
  let e = lakeShoreDist(x, z);
  for (const f of ISLANDS) {
    if (Math.abs(x - f.c[0]) > f.rx + 12 || Math.abs(z - f.c[1]) > f.rz + 12) continue;
    // The island's own shore sits ~2 m beyond its level pad.
    e = Math.max(e, -(padEdgeDist(f, x, z) - 2.0));
  }
  return e;
}
function islandAt(x, z) {
  for (const f of ISLANDS) {
    if (Math.abs(x - f.c[0]) > f.rx + 8 || Math.abs(z - f.c[1]) > f.rz + 8) continue;
    const e = padEdgeDist(f, x, z);
    if (e < 8) return { f, e };
  }
  return null;
}
function lakeCarve(x, z, h) {
  const eL = lakeShoreDist(x, z);
  if (eL >= 14) return h;
  const isl = islandAt(x, z);
  if (isl) {
    // The island: its level top, a short snowy shore down into the water.
    const { f, e } = isl;
    if (e <= 0) return f.level;
    const shore = f.level - (ISLAND_RISE + LAKE_DEPTH) * smoothstep(0, 4.5, e);
    if (eL < 0) return shore;
  }
  const bed = LAKE_LEVEL - LAKE_DEPTH;
  if (eL < 0.6) {
    const prof = bed + (LAKE_DEPTH + 0.4) * smoothstep(-4.5, 0.6, eL);
    return isl ? Math.max(prof, Math.min(h, prof)) : Math.min(h, prof);
  }
  // The shore: ease the ground to just above the water (gentle snowy banks).
  const shoreH = LAKE_LEVEL + 0.4 + 0.12 * (eL - 0.6);
  const np = nearestTrail(x, z);
  // Trails keep their graded ground AND their shoulders (no causeways).
  const keep = Math.max(padKeep(x, z), np ? 1 - smoothstep(1.5, 7, np.e) : 0);
  return lerp(lerp(shoreH, h, smoothstep(0.6, 14, eL)), h, keep);
}

/** The full carved height (before grid sampling). */
export function carvedHeight(x, z) {
  let h = padBlend(x, z, rawHeight(x, z)).h;
  h = trackCarve(x, z, h);
  const on = padUnder(x, z);
  if (on) h = padLevelAt(on, x, z);
  // The river + the chutes start/end INSIDE pads (the falls pool, the pond,
  // the summits, the runout) — the pad stays exactly level over them.
  if (!on) {
    h = riverCarve(x, z, h);
    h = chuteCarve(x, z, h);
  }
  h = lakeCarve(x, z, h);
  return h;
}

// ---------------------------------------------------------------------------
// THE 1 m GRID (lazy) — heights, ice mask, slopes.
// ---------------------------------------------------------------------------
export const GRID = { xMin: -186, xMax: 186, zMin: -170, zMax: 170, step: 1 };
GRID.nx = Math.round((GRID.xMax - GRID.xMin) / GRID.step) + 1;
GRID.nz = Math.round((GRID.zMax - GRID.zMin) / GRID.step) + 1;
let _grid = null;
export function getSnowGrid() {
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
/** Terrain height — exactly the rendered mesh's triangles (split a,c,b / b,c,e). */
export function terrainHeight(x, z) {
  const g = getSnowGrid().h;
  const { i, j, tx, tz } = gridCoords(x, z);
  const nx = GRID.nx;
  const a = g[j * nx + i], b = g[j * nx + i + 1], c = g[(j + 1) * nx + i], e = g[(j + 1) * nx + i + 1];
  if (tx + tz <= 1) return a + (b - a) * tx + (c - a) * tz;
  return e + (c - e) * (1 - tx) + (b - e) * (1 - tz);
}
export function slopeAt(x, z) {
  const g = getSnowGrid().slope;
  const { i, j, tx, tz } = gridCoords(x, z);
  const nx = GRID.nx;
  const a = g[j * nx + i], b = g[j * nx + i + 1], c = g[(j + 1) * nx + i], d = g[(j + 1) * nx + i + 1];
  return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz;
}

// ---------------------------------------------------------------------------
// ICE + WATER queries
// ---------------------------------------------------------------------------
/** Is (x, z) in the lake's open water (ground below the water line)? */
export function inLakeWater(x, z) {
  return lakeEdgeDist(x, z) < 0.4 && terrainHeight(x, z) < LAKE_LEVEL - 0.05;
}
/** Which ice (x, z) is on: "pond" | "river" | "puddle" | "runout" | null. */
export function iceKind(x, z) {
  if (onPad("pond", x, z, 0.15) || onPad("falls-pool", x, z, 0.15)) return "pond";
  const r = nearestRiver(x, z);
  if (r && r.d <= r.hw - 0.1) return "river";
  for (const [px, pz, pr] of ICE_PUDDLES) if (Math.hypot(x - px, z - pz) <= pr) return "puddle";
  for (const c of SNOW_CHUTE_PATHS) {
    if (!c.runout) continue;
    const [ex, ez] = c.pts[c.pts.length - 1];
    if (Math.hypot(x - ex, z - ez) <= c.runout) return "runout";
  }
  return null;
}
/** The open-water patches (for the renderer: puddle + runout discs). */
export function getIcePatches() {
  const out = ICE_PUDDLES.map(([x, z, r]) => ({ x, z, r, kind: "puddle" }));
  for (const c of SNOW_CHUTE_PATHS) {
    if (!c.runout) continue;
    const [ex, ez] = c.pts[c.pts.length - 1];
    out.push({ x: ex, z: ez, r: c.runout, kind: "runout" });
  }
  return out;
}

// ---------------------------------------------------------------------------
// BRIDGES + ICE FLOES (structures)
// ---------------------------------------------------------------------------
export const SNOW_BRIDGES = [];
let _built = false;
function makeBridge(id, from, to, hw, apex) {
  const h0 = terrainHeight(from[0], from[1]), h1 = terrainHeight(to[0], to[1]);
  const br = { id, from, to, halfWidth: hw, h0, h1, apex };
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
  return br;
}
function buildStructures() {
  if (_built) return;
  _built = true;
  getSnowGrid();
  for (const b of LAKE_BRIDGES) SNOW_BRIDGES.push(makeBridge(b.id, b.from, b.to, b.hw, 0.45));
  // Footbridges wherever a trail crosses the frozen river (skate under them).
  for (const p of SNOW_TRAILS) {
    let run = null;
    const runs = [];
    p.pts.forEach(([x, z], i) => {
      const r = nearestRiver(x, z);
      const wet = r && r.d < r.hw + 1.0;
      if (wet) {
        if (!run) run = { best: i, bd: r.d };
        if (r.d < run.bd) { run.bd = r.d; run.best = i; }
      } else if (run) { runs.push(run); run = null; }
    });
    if (run) runs.push(run);
    runs.forEach((r, k) => {
      const [x, z] = p.pts[r.best];
      const a = p.pts[Math.max(0, r.best - 1)], b = p.pts[Math.min(p.pts.length - 1, r.best + 1)];
      const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
      const rv = nearestRiver(x, z);
      const half = rv.hw + 3.0;
      const from = [x - (tx / tl) * half, z - (tz / tl) * half];
      const to = [x + (tx / tl) * half, z + (tz / tl) * half];
      SNOW_BRIDGES.push(makeBridge(`footbridge-${p.id}${k ? `-${k}` : ""}`, from, to, p.hw + 0.2, 1.1));
    });
  }
}
export function ensureSnowStructures() { buildStructures(); }
export const FLOE_TOP = LAKE_LEVEL + 0.42;
/** A floe's top if (x, z) is on one (solid — always counts), else null. */
export function floeTopAt(x, z) {
  for (const f of ICE_FLOES) if (Math.hypot(x - f.c[0], z - f.c[1]) <= f.r) return FLOE_TOP;
  return null;
}
function structureTopAt(x, z, lim = Infinity) {
  buildStructures();
  let best = floeTopAt(x, z);
  for (const b of SNOW_BRIDGES) {
    if (Math.abs(x - (b.from[0] + b.to[0]) / 2) > 12 || Math.abs(z - (b.from[1] + b.to[1]) / 2) > 12) continue;
    const t = b.topAt(x, z, lim);
    if (t !== null && (best === null || t > best)) best = t;
  }
  return best;
}

// ---------------------------------------------------------------------------
// THE CHAIRLIFT — a straight cable from the base station up to the summit.
// ---------------------------------------------------------------------------
export const LIFT = (() => {
  const [ax, az] = SNOW_LIFT.from, [bx, bz] = SNOW_LIFT.to;
  const len = Math.hypot(bx - ax, bz - az);
  return { ...SNOW_LIFT, len, dir: [(bx - ax) / len, (bz - az) / len] };
})();
/** The rider's seat position + heading a fraction t (0 → 1) up the lift. */
export function liftSeatAt(t) {
  const [ax, az] = LIFT.from, [bx, bz] = LIFT.to;
  const x = lerp(ax, bx, t), z = lerp(az, bz, t);
  const g0 = terrainHeight(ax, az), g1 = terrainHeight(bx, bz);
  // Clear the hillside by ≥ 3 m (sampled), easing in + out at the stations.
  const line = lerp(g0, g1, t);
  let clear = 0;
  for (let k = -2; k <= 2; k++) {
    const tt = clamp(t + k * 0.02, 0, 1);
    clear = Math.max(clear, terrainHeight(lerp(ax, bx, tt), lerp(az, bz, tt)) + 3.2 - lerp(g0, g1, tt));
  }
  const lift = Math.min(clear, 6) * smoothstep(0, 0.1, t) * smoothstep(1, 0.9, t);
  return { x, y: line + 0.55 + lift, z, yaw: Math.atan2(LIFT.dir[0], LIFT.dir[1]) };
}
/** Standing on the base station's boarding spot? */
export function liftBoardAt(x, z) {
  return Math.hypot(x - LIFT.from[0], z - LIFT.from[1]) <= 1.6;
}
/** Where a rider steps off at the top (inward, onto the summit pad). */
export const LIFT_DISMOUNT = [LIFT.to[0] + LIFT.dir[0] * 2.6, LIFT.to[1] + LIFT.dir[1] * 2.6];

// ---------------------------------------------------------------------------
// THE PLAYER HOOKS
// ---------------------------------------------------------------------------
/** Walkable ground (layered: a bridge deck counts once you're at/above it). */
export function snowGroundHeight(x, z, y) {
  const lim = y === undefined ? Infinity : y + S_STEP_UP + 0.05;
  const g = terrainHeight(x, z);
  const s = structureTopAt(x, z, lim);
  return s !== null && s > g ? s : g;
}
/** Too-steep ground (the rim, the cliffs, the hill faces): downhill dir, else null. */
export function snowSlideAt(x, z, y) {
  const g = terrainHeight(x, z);
  const lim = y === undefined ? Infinity : y + S_STEP_UP + 0.05;
  const s = structureTopAt(x, z, lim);
  if (s !== null && s >= g - 0.02) return null;
  if (slopeAt(x, z) < S_SLIDE_SLOPE) return null;
  const e = 0.6;
  const gx = terrainHeight(x + e, z) - terrainHeight(x - e, z);
  const gz = terrainHeight(x, z + e) - terrainHeight(x, z - e);
  const L = Math.hypot(gx, gz);
  if (L < 1e-6) return null;
  return { x: -gx / L, z: -gz / L };
}
/** Slippery ice underfoot (frozen pond / river / puddles / runouts)? */
export function snowIceAt(x, z, y) {
  if (y !== undefined) {
    const s = structureTopAt(x, z, y + S_STEP_UP + 0.05);
    if (s !== null && s >= terrainHeight(x, z) + 0.05 && Math.abs(y - s) < 0.3) return false; // on a bridge
  }
  return iceKind(x, z) !== null;
}
/**
 * In a toboggan chute's trough (and down at its floor)? → the ride state the
 * Player uses: { chute, s, off } (s = metres along, off = across, + left).
 */
export function snowChuteAt(x, z, y) {
  const n = nearestChute(x, z);
  if (!n || n.d > n.c.hw - 0.25) return null;
  if (n.s > n.c.len - 0.8) return null;
  if (y !== undefined && Math.abs(y - n.h) > 0.7) return null;
  return { chute: n.c, s: n.s, off: n.off };
}
/** A chute's centre-line point, tangent + floor height at distance s. */
export function chuteFrame(c, s) {
  const ss = clamp(s, 0, c.len);
  let i = 0;
  while (i < c.s.length - 2 && c.s[i + 1] < ss) i++;
  const t = (ss - c.s[i]) / Math.max(1e-6, c.s[i + 1] - c.s[i]);
  const [ax, az] = c.pts[i], [bx, bz] = c.pts[i + 1];
  const tl = Math.hypot(bx - ax, bz - az) || 1;
  return { x: lerp(ax, bx, t), z: lerp(az, bz, t), h: lerp(c.prof[i], c.prof[i + 1], t), tx: (bx - ax) / tl, tz: (bz - az) / tl, grade: (c.prof[i] - c.prof[i + 1]) / tl };
}
/** The glacier lake: too cold to stand in — the Player hops you back out. */
export function snowHazardAt(x, z, y) {
  if (!inLakeWater(x, z)) return false;
  if (y !== undefined && y > LAKE_LEVEL + 0.25) return false; // on a deck / floe
  return structureTopAt(x, z, y === undefined ? Infinity : y + 0.3) === null;
}
/** A good spot to be returned to (dry, not icy, not steep, not in a chute). */
export function snowIsSafe(x, z) {
  if (inLakeWater(x, z) || iceKind(x, z) !== null || slopeAt(x, z) > 0.7) return false;
  const n = nearestChute(x, z);
  return !(n && n.d < n.c.hw + CHUTE_BERM_W);
}
/** Snow underfoot (footprints): not ice, not water, not a chute trough. */
export function isOnSnow(x, z) {
  if (outsideRim(x, z) > 0) return false;
  if (iceKind(x, z) !== null || inLakeWater(x, z)) return false;
  const n = nearestChute(x, z);
  return !(n && n.d < n.c.hw);
}
/** Back-compat: the rink ice (now any ice). */
export function isOnIce(x, z) { return iceKind(x, z) !== null; }
/** On a packed-snow trail (footprints show crisper there). */
export function isOnSnowTrail(x, z) {
  const n = nearestTrail(x, z);
  return Boolean(n && n.e < -0.25) && isOnSnow(x, z);
}

/**
 * Is (x, z) somewhere Pete may walk? In his village wander box, on gentle dry
 * snow (no ice, water or chutes), and clear of every challenge clearing.
 */
export function isPeteSpotOk(x, z) {
  const b = PETE_WANDER;
  if (x < b.minX || x > b.maxX || z < b.minZ || z > b.maxZ) return false;
  if (!isOnSnow(x, z) || slopeAt(x, z) > 0.45) return false;
  for (const spot of SNOW_CHALLENGE_SPOTS) {
    if (Math.hypot(x - spot.center[0], z - spot.center[1]) < PETE_CHALLENGE_CLEARANCE) return false;
  }
  return true;
}
