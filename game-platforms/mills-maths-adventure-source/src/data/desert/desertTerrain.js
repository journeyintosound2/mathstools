/**
 * SUNSTONE DESERT — TERRAIN (built 2026-11-08). Pure + deterministic: the
 * height-field, the level pads, the graded trails, the quicksand pits, the
 * oasis pool, every walkable STRUCTURE (the pyramid's tiers + grand stair,
 * the temple portico, the sundial drum + spiral ramp, stair flights, the
 * town's solid buildings, the ziggurat, the rope bridge, the boardwalk, the
 * stepping stones) and the Player hooks. The renderer meshes the SAME 1 m
 * grid with the SAME triangle split as `terrainHeight`, so what you see is
 * what you stand on. Layout numbers come from desertLayout.js.
 *
 *   rawHeight     the desert floor (gentle swells + ripple dunes), the DUNE
 *                 SEA (wind-built dunes: a gentle windward side, a steep slip
 *                 face), the mesas + buttes, the temple cliff and the rim
 *                 (layered canyon cliffs west/north/south, giant dunes east)
 *   carvedHeight  pads levelled → trails graded → quicksand pits sunk →
 *                 the oasis pool's bed → terrain tucked under stair flights
 */
import {
  clamp, lerp, smoothstep, segDistT, vnoise, fbm, smoothPolyline, cumLengths, buildSegIndex,
} from "../terrainKit.js";
import {
  DESERT_BOUNDARY, DESERT_PADS, DESERT_TRAIL_CTRL, DUNE_SEA, MESAS, BUTTES, SUN_TEMPLE, PYRAMID, OASIS_POOL,
  OASIS_STAIRS, MESA_STAIR, LADDERS, MESA_BRIDGE, QUICKSAND, QS_EDGE, BOARDWALK, STEPPING_STONES, SUNDIAL_RISE,
  BAZAAR_BUILDINGS, TOWER_STAIR, TOWER_LANDING, ROOF_BRIDGE, ZIGGURAT, SUNSTONE, DUNE_FIELDS,
} from "./desertLayout.js";

/** Mirrors systems/collisionEngine.js STEP_UP (the checks assert they match). */
export const D_STEP_UP = 0.45;
/** Sand slides at a lower angle than snow or rock (a dune's slip face). */
export const D_SLIDE_SLOPE = 0.95;
/** Wading the quicksand's soft edge / the oasis pool. */
export const QS_SLOW = 0.48;
export const POOL_SLOW = 0.62;

// ---------------------------------------------------------------------------
// RAW TERRAIN
// ---------------------------------------------------------------------------
/** The wind-built dune profile at phase p ∈ [0, 1): a long gentle windward
 *  rise to a sharp crest, then a short steep slip face. */
function duneProfile(p, lee) {
  if (p < 1 - lee) {
    const s = p / (1 - lee);
    return s * s * (3 - 2 * s) * 0.82 + s * 0.18;
  }
  const s = (p - (1 - lee)) / lee;
  return 1 - s * s * (3 - 2 * s);
}
const WIND = (() => {
  const [a, b] = DUNE_SEA.wind;
  const L = Math.hypot(a, b);
  return [a / L, b / L];
})();
/** How much the dune sea rules here (0..1). */
export function duneMask(x, z) {
  const D = DUNE_SEA;
  const q = Math.hypot((x - D.c[0]) / D.rx, (z - D.c[1]) / D.rz) + 0.18 * (fbm(x / 50 + 3, z / 50 - 2, 2, 31) - 0.5);
  return smoothstep(1.02, 0.55, q);
}
/** The wind-built dune wave at (x, z) for a given amplitude (0 … A). */
function duneWave(x, z, A, wavelength, seed = 0) {
  const along = x * WIND[0] + z * WIND[1];
  const across = -x * WIND[1] + z * WIND[0];
  const u = along / wavelength + 1.1 * (fbm(x / 80 - 4 + seed, z / 80 + 7, 2, 32) - 0.5) + 0.25 * Math.sin(across / 23 + seed);
  const p = u - Math.floor(u);
  // Crests break into separate dunes (passes between them).
  const k = Math.floor(u);
  const crest = smoothstep(0.2, 0.52, fbm(across / 34 + k * 3.7 + seed, k * 1.3, 2, 33));
  return A * crest * (0.6 + 0.55 * fbm(x / 46 + 5, z / 46 - 1, 2, 34)) * duneProfile(p, 0.16);
}
/** Dunes calm down round the pads that ask for it (`calm` metres). */
const CALM_PADS = DESERT_PADS.filter((f) => f.calm);
function duneCalm(x, z) {
  let k = 1;
  for (const f of CALM_PADS) {
    if (Math.abs(x - f.c[0]) > f.rx + f.calm || Math.abs(z - f.c[1]) > f.rz + f.calm) continue;
    const ax = Math.abs(x - f.c[0]) / f.rx, az = Math.abs(z - f.c[1]) / f.rz;
    const q = Math.pow(Math.pow(ax, f.p) + Math.pow(az, f.p), 1 / f.p);
    const d = Math.hypot(x - f.c[0], z - f.c[1]);
    const e = q < 1e-6 ? -1 : d * (1 - 1 / q);
    k = Math.min(k, smoothstep(0, f.calm, e));
  }
  return k;
}
/** How much any dune field rules here (0..1), and the sea's + the fields' amplitudes. */
export function duneFieldAt(x, z) {
  const sea = duneMask(x, z);
  let m = sea, fA = 0;
  for (const f of DUNE_FIELDS) {
    const q = Math.hypot((x - f.c[0]) / f.rx, (z - f.c[1]) / f.rz) + 0.2 * (fbm(x / 40 + f.c[0], z / 40, 2, 30) - 0.5);
    const w = smoothstep(1.02, 0.5, q);
    if (w > m) m = w;
    fA = Math.max(fA, f.height * w);
  }
  return { m, seaA: DUNE_SEA.height * sea, fieldA: fA };
}
/** The dunes' height (the dune sea + the smaller fields). */
export function duneSeaHeight(x, z) {
  const { seaA, fieldA } = duneFieldAt(x, z);
  if (seaA + fieldA <= 0.01) return 0;
  const calm = duneCalm(x, z);
  if (calm <= 0) return 0;
  const a = seaA > 0.01 ? duneWave(x, z, seaA, DUNE_SEA.wavelength) : 0;
  const b = fieldA > 0.01 ? duneWave(x, z, fieldA, 31, 5.3) : 0;
  return Math.max(a, b) * calm;
}
/** Little ripple dunes across the open floor (low, everywhere). */
function rippleDunes(x, z) {
  const along = x * WIND[0] + z * WIND[1];
  const u = along / 21 + 0.9 * (fbm(x / 40, z / 40, 2, 35) - 0.5);
  const p = u - Math.floor(u);
  const amp = 0.9 * smoothstep(0.35, 0.7, fbm(x / 60 - 8, z / 60 + 3, 2, 36));
  return amp * duneProfile(p, 0.3);
}
function baseHeight(x, z) {
  return (
    1.2 - 0.016 * z +
    4.0 * (fbm(x / 90 + 2, z / 90 - 5, 3, 21) - 0.5) +
    1.4 * (fbm(x / 30 - 6, z / 30 + 1, 2, 22) - 0.5) +
    0.12 * (vnoise(x / 4, z / 4, 23) - 0.5)
  );
}
/** Metres OUTSIDE the rim rectangle (negative inside). */
export function outsideRim(x, z) {
  // A rounded rectangle (no straight creases at the corners).
  const R = 26;
  const qx = Math.abs(x) - (DESERT_BOUNDARY.halfW - R), qz = Math.abs(z) - (DESERT_BOUNDARY.halfD - R);
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - R;
}
/** 0 = canyon cliffs (west, north-west, south), 1 = giant dunes (east). */
export function rimDuneness(x, z) {
  return smoothstep(10, 60, x) * (1 - smoothstep(60, 110, z));
}
function rimHeight(x, z) {
  const d = outsideRim(x, z) + 6 * (fbm(x / 36 + 2, z / 36 - 9, 2, 24) - 0.5);
  if (d < -40) return 0;
  const dn = rimDuneness(x, z);
  let cliff = 0, dune = 0;
  if (dn < 0.999) {
    // A scree apron, then a layered canyon wall in three steps, then
    // buttes + broken tableland beyond.
    const talus = 2.6 * smoothstep(-24, -6, d);
    const wall = 9 * smoothstep(-6, -3, d) + 8 * smoothstep(-1, 2, d) + 7 * smoothstep(5, 8, d);
    const r1 = 1 - Math.abs(fbm(x / 40 - 7, z / 40 + 4, 3, 25) * 2 - 1);
    const beyond = smoothstep(12, 48, d) * (6 + 22 * r1 * r1);
    cliff = talus + wall + beyond + Math.max(0, d - 48) * 0.35;
  }
  if (dn > 0.001) {
    // Giant dunes: rising sand, a steep face you slide back off.
    const swell = 5 * smoothstep(-38, -12, d);
    const face = 22 * smoothstep(-12, 10, d);
    const crests = smoothstep(8, 40, d) * (8 + 14 * fbm(x / 30 + 9, z / 30 - 3, 2, 26));
    dune = swell + face + crests;
  }
  return lerp(cliff, dune, dn);
}
/** A mesa or butte: flat top at an absolute level, a steep cliff band, a skirt. */
function mesaQ(m, x, z) {
  const w = 0.035 * (fbm(x / 9 + m.c[0], z / 9 - m.c[1], 2, 27) - 0.5) * 2;
  const ax = Math.abs(x - m.c[0]) / m.rx, az = Math.abs(z - m.c[1]) / m.rz;
  return Math.pow(Math.pow(ax, m.p) + Math.pow(az, m.p), 1 / m.p) + w;
}
const MESA_DEF = MESAS.map((m) => ({ ...m, top: Math.round((baseHeight(m.c[0], m.c[1]) + m.h) * 20) / 20 }));
const BUTTE_DEF = BUTTES.map((b, i) => ({ id: `butte-${i}`, c: b.c, rx: b.r, rz: b.r, p: 2, h: b.h, band: Math.max(1.2, b.r * 0.3), top: Math.round((baseHeight(b.c[0], b.c[1]) + b.h) * 20) / 20 }));
export function getMesas() { return MESA_DEF; }
export function getButtes() { return BUTTE_DEF; }
function mesaBlend(m, x, z, h) {
  const R = Math.sqrt(m.rx * m.rz);
  if (Math.abs(x - m.c[0]) > m.rx + m.band + 10 || Math.abs(z - m.c[1]) > m.rz + m.band + 10) return h;
  const q = mesaQ(m, x, z);
  const bq = m.band / R;
  if (q <= 1) return m.top;
  if (q >= 1 + bq + 6 / R) return h;
  // The cliff band, then a short scree skirt easing back to the floor.
  const cliffT = smoothstep(1 + bq, 1, q);
  const skirt = 1.6 * smoothstep(1 + bq + 6 / R, 1 + bq, q);
  return Math.max(lerp(h, m.top, cliffT), h + skirt);
}
/** The cliff the Sun Temple is carved into (rises behind the portico). */
function templeCliff(x, z) {
  const C = SUN_TEMPLE.cliff;
  return C.h * smoothstep(C.z + 0.6, C.z - 2.2, z) * smoothstep(C.halfW + 7, C.halfW - 1, Math.abs(x));
}
/** Height before pads / trails / pits / water are carved in. */
export function rawHeight(x, z) {
  let h = baseHeight(x, z) + rippleDunes(x, z) * (1 - duneFieldAt(x, z).m) + duneSeaHeight(x, z) + Math.max(rimHeight(x, z), templeCliff(x, z));
  for (const m of MESA_DEF) h = mesaBlend(m, x, z, h);
  for (const b of BUTTE_DEF) h = mesaBlend(b, x, z, h);
  return h;
}

// ---------------------------------------------------------------------------
// LEVEL PADS
// ---------------------------------------------------------------------------
function padQ(f, x, z) {
  const ax = Math.abs(x - f.c[0]) / f.rx, az = Math.abs(z - f.c[1]) / f.rz;
  return Math.pow(Math.pow(ax, f.p) + Math.pow(az, f.p), 1 / f.p);
}
function padEdgeDist(f, x, z, q = padQ(f, x, z)) {
  const d = Math.hypot(x - f.c[0], z - f.c[1]);
  if (d < 1e-6) return -Math.min(f.rx, f.rz);
  return d * (1 - 1 / Math.max(q, 1e-6));
}
const BANK_BINS = 48;
const BANK_MAX = 22;
const PADS = DESERT_PADS.map((f) => {
  let sum = 0, n = 0;
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) {
    const x = f.c[0] + (i / 4) * f.rx * 0.85, z = f.c[1] + (j / 4) * f.rz * 0.85;
    if (padQ(f, x, z) <= 1) { sum += baseHeight(x, z) + rippleDunes(x, z) * 0.5; n++; }
  }
  return { ...f, level: Math.round((sum / Math.max(1, n) - (f.depth || 0)) * 20) / 20 };
}).map((f, _i, all) => {
  const level = f.levelOf ? all.find((g) => g.id === f.levelOf).level : f.level;
  const bank = new Float32Array(BANK_BINS);
  for (let a = 0; a < BANK_BINS; a++) {
    const ang = (a / BANK_BINS) * Math.PI * 2;
    const dx = Math.cos(ang), dz = Math.sin(ang);
    const rim = 1 / Math.pow(Math.pow(Math.abs(dx) / f.rx, f.p) + Math.pow(Math.abs(dz) / f.rz, f.p), 1 / f.p);
    let d0 = 0;
    for (const o of [0, 1.5, 3]) {
      const px = f.c[0] + dx * (rim + o), pz = f.c[1] + dz * (rim + o);
      d0 = Math.max(d0, Math.abs(rawHeight(px, pz) - level));
    }
    bank[a] = f.bank ? f.bank : Math.min(BANK_MAX, 5 + d0 * 2.6);
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
export function desertPadLevel(id) {
  const p = PAD_BY_ID.get(id);
  return p ? p.level : 0;
}
export function getDesertPads() { return PADS; }
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
function padKeep(x, z, reach = 10) {
  let m = 0;
  for (const f of PADS) {
    if (Math.abs(x - f.c[0]) > f.rx + reach + 4 || Math.abs(z - f.c[1]) > f.rz + reach + 4) continue;
    m = Math.max(m, 1 - smoothstep(0, reach, padEdgeDist(f, x, z)));
  }
  return m;
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
    // A sunken pad (the oasis) keeps a crisp wall: a plain smoothstep.
    const w = f.depth ? 1 - smoothstep(0, B, e) : 1 - ease(e / B);
    const W = w / (1 - w + 1e-4);
    wsum += W; lsum += W * f.level; wmax = Math.max(wmax, w);
  }
  if (wmax <= 0) return { h, w: 0 };
  return { h: lerp(h, lsum / wsum, wmax), w: wmax };
}

// ---------------------------------------------------------------------------
// TRAILS — graded like the snow world's (≤ 0.28), junctions meet flush.
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
  return { s, prof };
}
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
const TRACK_REACH = 11;
const BATTER = 0.6;
export const DESERT_TRAILS = (() => {
  const built = [];
  for (const p of DESERT_TRAIL_CTRL) {
    const pts = smoothPolyline(p.ctrl, 2);
    const base = pts.map(([x, z]) => padBlend(x, z, rawHeight(x, z)));
    for (const i of [0, pts.length - 1]) {
      const jh = junctionHeight(built, pts[i][0], pts[i][1]);
      if (jh !== null) base[i] = { h: jh, w: 1 };
    }
    const pinned = base.map((b, i) => b.w > 0.97 || i === 0 || i === base.length - 1);
    const { s, prof: pr } = gradeProfile(pts, base.map((b) => b.h), pinned, 0.27);
    const prof = pr.map((v, i) => base[i].h + clamp(v - base[i].h, -8, 8));
    built.push({ id: p.id, hw: p.hw, kind: p.kind, pts, s, prof, reach: p.reach || TRACK_REACH, batter: p.batter || BATTER });
  }
  return built;
})();
const trailSegs = buildSegIndex(DESERT_TRAILS.flatMap((p) => p.pts.slice(0, -1).map((a, i) => ({
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
function trackCarve(x, z, h) {
  let lo = -Infinity, hi = Infinity, near = null, nd = Infinity;
  for (const sg of trailSegs(x, z)) {
    const { d, t } = segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz);
    const e = Math.max(0, d - sg.p.hw);
    if (e >= sg.p.reach) continue;
    const hc = lerp(sg.p.prof[sg.i], sg.p.prof[sg.i + 1], t);
    const r = sg.p.batter * e + 1.2 * Math.max(0, e - (sg.p.reach - 4)) ** 2;
    lo = Math.max(lo, hc - r);
    hi = Math.min(hi, hc + r);
    if (d - sg.p.hw < nd) { nd = d - sg.p.hw; near = [hc - r, hc + r]; }
  }
  if (lo === -Infinity) return h;
  if (lo <= hi) return clamp(h, lo, hi);
  return clamp(h, near[0], near[1]);
}

// ---------------------------------------------------------------------------
// QUICKSAND — each pit's SDF (metres outside its edge, − = inside), its level
// (the surface), the soft edge you can wade and the middle that swallows you.
// ---------------------------------------------------------------------------
function pitSDF(pt, x, z) {
  if (pt.ring) {
    const r = Math.hypot(x - pt.c[0], z - pt.c[1]);
    const mid = (pt.rIn + pt.rOut) / 2, hw = (pt.rOut - pt.rIn) / 2;
    return Math.abs(r - mid) - hw + 0.5 * (vnoise(x / 3 + 7, z / 3, 37) - 0.5);
  }
  const c = Math.cos(pt.rot), s = Math.sin(pt.rot);
  const dx = x - pt.c[0], dz = z - pt.c[1];
  const lx = dx * c + dz * s, lz = -dx * s + dz * c;
  const q = Math.hypot(lx / pt.rx, lz / pt.rz);
  return (q - 1) * Math.sqrt(pt.rx * pt.rz) + 1.2 * (fbm(x / 6 + 3, z / 6 - 4, 2, 38) - 0.5);
}
/** Ground before the pits are sunk (pads + trails). */
function preQuicksand(x, z) {
  let h = padBlend(x, z, rawHeight(x, z)).h;
  h = trackCarve(x, z, h);
  const on = padUnder(x, z);
  if (on) h = on.level;
  return h;
}
const PITS = QUICKSAND.map((pt) => {
  // The surface sits at the mean ground round the pit's edge.
  const hs = [];
  const R = pt.ring ? pt.rOut : Math.max(pt.rx, pt.rz);
  for (let a = 0; a < 32; a++) {
    const ang = (a / 32) * Math.PI * 2;
    for (const rr of [R + 1.5, R + 3]) hs.push(preQuicksand(pt.c[0] + Math.cos(ang) * rr, pt.c[1] + Math.sin(ang) * rr));
  }
  hs.sort((p, q) => p - q);
  const level = Math.round(hs[Math.floor(hs.length * 0.4)] * 20) / 20;
  return { ...pt, level, reach: R + 7 };
});
export function getQuicksandPits() { return PITS; }
/** The pit at (x, z): { pit, sdf } (sdf < 0 inside), or null when well clear. */
export function quicksandAt(x, z) {
  let best = null;
  for (const pt of PITS) {
    if (Math.abs(x - pt.c[0]) > pt.reach || Math.abs(z - pt.c[1]) > pt.reach) continue;
    const sdf = pitSDF(pt, x, z);
    if (!best || sdf < best.sdf) best = { pit: pt, sdf };
  }
  return best;
}
const PIT_DIP = 0.55, PIT_DEEP = 0.38;
function pitCarve(x, z, h) {
  const q = quicksandAt(x, z);
  if (!q || q.sdf > 6) return h;
  const { pit, sdf } = q;
  // The ground round a pit flattens to its surface (a dead-flat, damp plain).
  if (sdf >= 0) return lerp(pit.level, h, smoothstep(0.6, 6, sdf));
  // Under the surface: you sink to your knees in the soft edge, deeper in the middle.
  return pit.level - PIT_DIP * smoothstep(0, -QS_EDGE, sdf) - PIT_DEEP * smoothstep(-QS_EDGE, -QS_EDGE - 2.2, sdf);
}

// ---------------------------------------------------------------------------
// THE OASIS POOL — a wadeable pool in the sunken basin's floor.
// ---------------------------------------------------------------------------
const OASIS_PAD = PAD_BY_ID.get("oasis");
export const POOL_LEVEL = OASIS_PAD.level - 0.06;
export function poolEdgeDist(x, z) {
  const P = OASIS_POOL;
  const q = Math.hypot((x - P.c[0]) / P.rx, (z - P.c[1]) / P.rz);
  return (q - 1) * Math.sqrt(P.rx * P.rz) + P.rough * (fbm(x / 7 + 1, z / 7 - 2, 2, 39) - 0.5) * 2;
}
function poolCarve(x, z, h) {
  const e = poolEdgeDist(x, z);
  if (e > 1.4) return h;
  const bed = POOL_LEVEL - OASIS_POOL.depth;
  return Math.min(h, lerp(bed, OASIS_PAD.level + 0.02, smoothstep(-2.2, 1.4, e)));
}

// ---------------------------------------------------------------------------
// STRUCTURES (pure descriptions — the renderer + colliders read these too)
//
//   solid   always walkable ground (stairs, tiers, buildings, the drum…):
//           anything taller than STEP_UP is a wall
//   thin    a deck you can be UNDER (bridges, the boardwalk): it only counts
//           once you're at / above it
// ---------------------------------------------------------------------------
/** A straight stair flight from its bottom edge `from` to its top edge `to`. */
function makeFlight(id, from, to, hw, h0, h1, maxRise = 0.4) {
  const L = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const n = Math.max(2, Math.ceil(Math.abs(h1 - h0) / maxRise));
  const ux = (to[0] - from[0]) / L, uz = (to[1] - from[1]) / L;
  const f = { id, kind: "flight", solid: true, from, to, hw, h0, h1, n, L, ux, uz, run: L / n, rise: (h1 - h0) / n };
  f.local = (x, z) => {
    const rx = x - from[0], rz = z - from[1];
    return { s: rx * ux + rz * uz, o: -rx * uz + rz * ux };
  };
  f.topAt = (x, z) => {
    const { s, o } = f.local(x, z);
    if (s < 0 || s > L || Math.abs(o) > hw) return null;
    const k = Math.min(n - 1, Math.floor(s / f.run));
    return h0 + (k + 1) * f.rise;
  };
  f.bbox = bboxOf([from, to], hw + 0.2);
  return f;
}
function makeBox(id, c, hx, hz, top, solid = true, extra = {}) {
  const b = { id, kind: "box", solid, c, hx, hz, top, ...extra };
  b.topAt = (x, z) => (Math.abs(x - c[0]) <= hx && Math.abs(z - c[1]) <= hz ? top : null);
  b.bbox = [c[0] - hx, c[1] - hz, c[0] + hx, c[1] + hz];
  return b;
}
/** A deck from `from` to `to` (straight; `deckAt(t)` = its height). */
function makeDeck(id, from, to, hw, deckAt, extra = {}) {
  const L = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const ux = (to[0] - from[0]) / L, uz = (to[1] - from[1]) / L;
  const d = { id, kind: "deck", solid: false, from, to, hw, L, ux, uz, deckAt, ...extra };
  d.topAt = (x, z) => {
    const rx = x - from[0], rz = z - from[1];
    const s = rx * ux + rz * uz, o = -rx * uz + rz * ux;
    if (s < 0 || s > L || Math.abs(o) > hw) return null;
    return deckAt(s / L);
  };
  d.bbox = bboxOf([from, to], hw + 0.2);
  return d;
}
function bboxOf(pts, pad) {
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (const [x, z] of pts) { x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z); }
  return [x0 - pad, z0 - pad, x1 + pad, z1 + pad];
}

const lvl = (id) => PAD_BY_ID.get(id).level;
export const PYR_BASE = lvl("pyramid");
export const TOWN_LEVEL = lvl("town");

/** The Great Pyramid's tiers + its grand stair. */
export const PYRAMID_TIERS = Array.from({ length: PYRAMID.tiers }, (_, k) => {
  const half = PYRAMID.half - k * PYRAMID.inset;
  return makeBox(`pyramid-tier-${k}`, PYRAMID.c, half, half, PYR_BASE + PYRAMID.rise * (k + 1), true, { k, half });
});
export const PYRAMID_STAIR = makeFlight(
  "pyramid-stair", [PYRAMID.c[0], PYRAMID.stair.zFoot], [PYRAMID.c[0], PYRAMID.stair.zTop], PYRAMID.stair.hw,
  PYR_BASE, PYR_BASE + PYRAMID.top, PYRAMID.stair.rise + 1e-6,
);
export const SUNSTONE_TOP = PYR_BASE + PYRAMID.top;

/** The Sun Temple's portico + its front steps. */
const TEMPLE_LEVEL = lvl("temple");
export const TEMPLE_PORTICO = makeBox(
  "temple-portico", [(SUN_TEMPLE.x0 + SUN_TEMPLE.x1) / 2, (SUN_TEMPLE.zFront + SUN_TEMPLE.zBack) / 2],
  (SUN_TEMPLE.x1 - SUN_TEMPLE.x0) / 2, (SUN_TEMPLE.zFront - SUN_TEMPLE.zBack) / 2, TEMPLE_LEVEL + SUN_TEMPLE.h,
);
export const TEMPLE_STEPS = makeFlight("temple-steps", SUN_TEMPLE.steps.from, SUN_TEMPLE.steps.to, SUN_TEMPLE.steps.hw, TEMPLE_LEVEL, TEMPLE_LEVEL + SUN_TEMPLE.h);

/** Sundial Rise: the drum + the spiral ramp round it. */
const SUNDIAL_LEVEL = lvl("sundial");
export const SUNDIAL = (() => {
  const S = SUNDIAL_RISE;
  const top = SUNDIAL_LEVEL + S.h;
  const drum = { id: "sundial-drum", kind: "drum", solid: true, c: S.c, r: S.r, top, bbox: [S.c[0] - S.r, S.c[1] - S.r, S.c[0] + S.r, S.c[1] + S.r] };
  drum.topAt = (x, z) => (Math.hypot(x - S.c[0], z - S.c[1]) <= S.r ? top : null);
  const ramp = { id: "sundial-ramp", kind: "spiral", solid: true, c: S.c, r0: S.r, r1: S.r + S.rampW, a0: S.a0, turn: S.turn, base: SUNDIAL_LEVEL, top };
  /** The ramp's fraction (0 bottom → 1 top) at angle `a`, or null in the gap. */
  ramp.fracAt = (a) => {
    let d = a - S.a0;
    d = ((d % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (d > S.turn && d < S.turn + 0.02) return 1; // (rounding at the very top)
    return d <= S.turn ? d / S.turn : null;
  };
  ramp.topAt = (x, z) => {
    const r = Math.hypot(x - S.c[0], z - S.c[1]);
    if (r < S.r - 0.05 || r > S.r + S.rampW) return null;
    const f = ramp.fracAt(Math.atan2(z - S.c[1], x - S.c[0]));
    if (f === null) return null;
    // A short flat landing at the bottom so the first rise is gentle.
    return SUNDIAL_LEVEL + 0.04 + S.h * f;
  };
  const R = S.r + S.rampW;
  ramp.bbox = [S.c[0] - R, S.c[1] - R, S.c[0] + R, S.c[1] + R];
  /** Where the ramp starts (on the ground) and ends (at the drum top). */
  const mid = S.r + S.rampW / 2;
  ramp.footAt = [S.c[0] + Math.cos(S.a0) * mid, S.c[1] + Math.sin(S.a0) * mid];
  ramp.headAt = [S.c[0] + Math.cos(S.a0 + S.turn) * mid, S.c[1] + Math.sin(S.a0 + S.turn) * mid];
  return { drum, ramp, top, level: SUNDIAL_LEVEL };
})();

/** The town: solid buildings, the tower's stair + landing, the roof bridge, the ziggurat. */
export const TOWN_BLOCKS = BAZAAR_BUILDINGS.map((b) => makeBox(`bld-${b.id}`, [b.x, b.z], b.w / 2, b.d / 2, TOWN_LEVEL + b.h, true, { building: b }));
export const TOWER_FLIGHT = makeFlight("tower-stair", TOWER_STAIR.from, TOWER_STAIR.to, TOWER_STAIR.hw, TOWN_LEVEL, TOWN_LEVEL + 9.5);
export const TOWER_LANDING_BOX = makeBox("tower-landing", TOWER_LANDING.c, TOWER_LANDING.hx, TOWER_LANDING.hz, TOWN_LEVEL + 9.5);
export const ROOF_PLANK = makeDeck("roof-bridge", ROOF_BRIDGE.from, ROOF_BRIDGE.to, ROOF_BRIDGE.hw, () => TOWN_LEVEL + 9.5 + 0.06);
export const ZIGGURAT_TIERS = ZIGGURAT.tiers.map((t, k) => makeBox(`zig-tier-${k}`, ZIGGURAT.c, t.half, t.half, TOWN_LEVEL + t.h, true, { k, half: t.half }));
export const ZIGGURAT_FLIGHT = makeFlight(
  "zig-stair", ZIGGURAT.stair.from, ZIGGURAT.stair.to, ZIGGURAT.stair.hw, TOWN_LEVEL, TOWN_LEVEL + ZIGGURAT.tiers[ZIGGURAT.tiers.length - 1].h,
);

// Lazily built (they read the ground): the oasis + mesa flights, the mesa
// bridge, the boardwalk, the stepping stones, the ladders.
let _late = null;
function lateStructures() {
  if (_late) return _late;
  _late = { flights: [], boxes: [], decks: [], stones: [], ladders: [] };
  // Heights from the ground BEFORE the flights tuck it in.
  const g = (x, z) => carvedBase(x, z);
  for (const s of OASIS_STAIRS) _late.flights.push(makeFlight(s.id, s.from, s.to, s.hw, OASIS_PAD.level, g(s.to[0] + (s.to[0] - s.from[0]) * 0.08, s.to[1] + (s.to[1] - s.from[1]) * 0.08)));
  const red = MESA_DEF.find((m) => m.id === "red-mesa");
  const [f1, f2] = MESA_STAIR.flights;
  const footH = g(f1.from[0], f1.from[1] + 0.6);
  const landH = footH + (red.top - footH) / 2;
  _late.flights.push(makeFlight(f1.id, f1.from, f1.to, f1.hw, footH, landH));
  _late.boxes.push(makeBox("mesa-landing", MESA_STAIR.landing.c, MESA_STAIR.landing.hx, MESA_STAIR.landing.hz, landH));
  _late.flights.push(makeFlight(f2.id, f2.from, f2.to, f2.hw, landH, red.top));
  // The rope bridge (sags in the middle).
  const twin = MESA_DEF.find((m) => m.id === "twin-mesa");
  const B = MESA_BRIDGE;
  _late.decks.push(makeDeck("mesa-bridge", B.from, B.to, B.hw, (t) => lerp(red.top, twin.top, t) - B.sag * Math.sin(Math.PI * t) + 0.05, { rope: true }));
  // The boardwalk across the moat.
  const moat = PITS.find((p) => p.id === "moat");
  const W = BOARDWALK;
  _late.decks.push(makeDeck("boardwalk", W.from, W.to, W.hw, () => moat.level + 0.38, { boardwalk: true }));
  // Stepping stones (solid tops).
  STEPPING_STONES.forEach(([x, z], i) => {
    const top = moat.level + 0.3;
    const s = { id: `stone-${i}`, kind: "stone", solid: true, c: [x, z], r: 0.8, top, bbox: [x - 0.8, z - 0.8, x + 0.8, z + 0.8] };
    s.topAt = (qx, qz) => (Math.hypot(qx - x, qz - z) <= 0.8 ? top : null);
    _late.stones.push(s);
  });
  // LADDERS up the mesa faces: find the lip + foot along the outward direction.
  for (const L of LADDERS) {
    const m = MESA_DEF.find((q) => q.id === L.mesa);
    const nx = Math.cos(L.angle), nz = Math.sin(L.angle);
    // March out from the centre: the lip is where the top ends…
    let r = 0;
    while (r < 60 && rawHeight(m.c[0] + nx * r, m.c[1] + nz * r) >= m.top - 0.05) r += 0.1;
    const lip = [m.c[0] + nx * (r - 0.1), m.c[1] + nz * (r - 0.1)];
    // …the foot is where the cliff meets the scree below.
    const floor = (x, z) => carvedBase(x, z);
    let f = r;
    while (f < r + 14) {
      const x = m.c[0] + nx * f, z = m.c[1] + nz * f;
      const slope = Math.abs(floor(x + nx * 0.4, z + nz * 0.4) - floor(x - nx * 0.4, z - nz * 0.4)) / 0.8;
      if (slope < 0.6) break;
      f += 0.1;
    }
    const foot = [m.c[0] + nx * (f + 0.3), m.c[1] + nz * (f + 0.3)];
    const tx = -nz, tz = nx, len = 1.7;
    _late.ladders.push({
      id: L.id, mesa: m.id, a: [foot[0] - tx * len / 2, foot[1] - tz * len / 2], tx, tz, nx, nz, len,
      base: floor(foot[0], foot[1]), top: m.top, cliffW: Math.hypot(foot[0] - lip[0], foot[1] - lip[1]), lip, foot,
    });
  }
  return _late;
}

// ---------------------------------------------------------------------------
// CARVED HEIGHT + THE 1 m GRID
// ---------------------------------------------------------------------------
/** Ground after pads, trails, pits + the pool (before flights tuck it in). */
function carvedBase(x, z) {
  let h = preQuicksand(x, z);
  h = pitCarve(x, z, h);
  if (onPad("oasis", x, z, -1.5)) h = poolCarve(x, z, h);
  return h;
}
/** The full carved height (before grid sampling). */
export function carvedHeight(x, z) {
  let h = carvedBase(x, z);
  // Tuck the ground under every solid stair flight so steps never sink into
  // it, and give each end a little landing (the ground meets the step flush).
  for (const f of lateStructures().flights) {
    if (x < f.bbox[0] - 3 || x > f.bbox[2] + 3 || z < f.bbox[1] - 3 || z > f.bbox[3] + 3) continue;
    const { s, o } = f.local(x, z);
    if (Math.abs(o) > f.hw + 1.2 || s < -3 || s > f.L + 3) continue;
    const side = 1 - smoothstep(f.hw + 0.3, f.hw + 1.2, Math.abs(o));
    if (s > f.L) h = lerp(h, f.h1 - 0.02, side * (1 - smoothstep(f.L + 1.6, f.L + 3, s)));
    else if (s < 0) h = lerp(h, f.h0 - 0.02, side * (1 - smoothstep(-1.6, -3, s)));
    if (s < -0.3 || s > f.L + 0.3 || Math.abs(o) > f.hw + 0.3) continue;
    const sc = clamp(s, 0, f.L - 1e-6);
    h = Math.min(h, f.h0 + Math.floor(sc / f.run) * f.rise - 0.05);
  }
  return h;
}

export const GRID = { xMin: -200, xMax: 200, zMin: -188, zMax: 188, step: 1 };
GRID.nx = Math.round((GRID.xMax - GRID.xMin) / GRID.step) + 1;
GRID.nz = Math.round((GRID.zMax - GRID.zMin) / GRID.step) + 1;
let _grid = null;
export function getDesertGrid() {
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
  const g = getDesertGrid().h;
  const { i, j, tx, tz } = gridCoords(x, z);
  const nx = GRID.nx;
  const a = g[j * nx + i], b = g[j * nx + i + 1], c = g[(j + 1) * nx + i], e = g[(j + 1) * nx + i + 1];
  if (tx + tz <= 1) return a + (b - a) * tx + (c - a) * tz;
  return e + (c - e) * (1 - tx) + (b - e) * (1 - tz);
}
export function slopeAt(x, z) {
  const g = getDesertGrid().slope;
  const { i, j, tx, tz } = gridCoords(x, z);
  const nx = GRID.nx;
  const a = g[j * nx + i], b = g[j * nx + i + 1], c = g[(j + 1) * nx + i], d = g[(j + 1) * nx + i + 1];
  return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz;
}

// ---------------------------------------------------------------------------
// THE STRUCTURE INDEX
// ---------------------------------------------------------------------------
let _structs = null, _index = null;
export function getDesertStructures() {
  if (_structs) return _structs;
  const L = lateStructures();
  _structs = [
    ...PYRAMID_TIERS, PYRAMID_STAIR, TEMPLE_PORTICO, TEMPLE_STEPS, SUNDIAL.drum, SUNDIAL.ramp,
    ...TOWN_BLOCKS, TOWER_FLIGHT, TOWER_LANDING_BOX, ROOF_PLANK, ...ZIGGURAT_TIERS, ZIGGURAT_FLIGHT,
    ...L.flights, ...L.boxes, ...L.decks, ...L.stones,
  ];
  const cell = 8;
  const map = new Map();
  for (const s of _structs) {
    const [x0, z0, x1, z1] = s.bbox;
    for (let i = Math.floor(x0 / cell); i <= Math.floor(x1 / cell); i++) {
      for (let j = Math.floor(z0 / cell); j <= Math.floor(z1 / cell); j++) {
        const k = i * 4096 + j;
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(s);
      }
    }
  }
  _index = (x, z) => map.get(Math.floor(x / cell) * 4096 + Math.floor(z / cell)) || [];
  return _structs;
}
export function ensureDesertStructures() { getDesertGrid(); getDesertStructures(); }
export function getLadders() { return lateStructures().ladders; }
export function getLateStructures() { return lateStructures(); }
/** The highest structure top at (x, z) that counts for feet at `lim`: solid ones always, thin ones at/below lim. */
export function structureTopAt(x, z, lim = Infinity) {
  getDesertStructures();
  let best = null;
  for (const s of _index(x, z)) {
    if (x < s.bbox[0] || x > s.bbox[2] || z < s.bbox[1] || z > s.bbox[3]) continue;
    const t = s.topAt(x, z);
    if (t === null) continue;
    if (!s.solid && t > lim) continue;
    if (best === null || t > best) best = t;
  }
  return best;
}

// ---------------------------------------------------------------------------
// THE PLAYER HOOKS
// ---------------------------------------------------------------------------
/** Walkable ground (layered: a thin deck counts once you're at/above it). */
export function desertGroundHeight(x, z, y) {
  const lim = y === undefined ? Infinity : y + D_STEP_UP + 0.05;
  const g = terrainHeight(x, z);
  const s = structureTopAt(x, z, lim);
  return s !== null && s > g ? s : g;
}
/** Too-steep sand or rock (slip faces, cliffs, the rim): downhill dir, else null. */
export function desertSlideAt(x, z, y) {
  const g = terrainHeight(x, z);
  const lim = y === undefined ? Infinity : y + D_STEP_UP + 0.05;
  const s = structureTopAt(x, z, lim);
  if (s !== null && s >= g - 0.02) return null;
  if (slopeAt(x, z) < D_SLIDE_SLOPE) return null;
  const e = 0.6;
  const gx = terrainHeight(x + e, z) - terrainHeight(x - e, z);
  const gz = terrainHeight(x, z + e) - terrainHeight(x, z - e);
  const L = Math.hypot(gx, gz);
  if (L < 1e-6) return null;
  return { x: -gx / L, z: -gz / L };
}
/** Up a ladder: push into it to climb (Player's climbAt contract). */
export function desertClimbAt(x, z, y) {
  for (const w of lateStructures().ladders) {
    const rx = x - w.a[0], rz = z - w.a[1];
    const t = rx * w.tx + rz * w.tz;
    if (t < 0.25 || t > w.len - 0.25) continue;
    const s = rx * w.nx + rz * w.nz;
    if (s < -w.cliffW - 0.5 || s > 1.4) continue;
    if (y !== undefined && (y < w.base - 0.8 || y > w.top - 0.12)) continue;
    return { wall: w, t, s };
  }
  return null;
}
/** In the oasis pool (wading)? → the water surface height, else null. */
export function poolWaterAt(x, z) {
  if (!onPad("oasis", x, z, -0.5)) return null;
  return poolEdgeDist(x, z) < 0 && terrainHeight(x, z) < POOL_LEVEL - 0.02 ? POOL_LEVEL : null;
}
/** Wading the quicksand's soft edge or the pool is slower. */
export function desertSpeedAt(x, z, y) {
  if (y !== undefined) {
    const s = structureTopAt(x, z, y + D_STEP_UP + 0.05);
    if (s !== null && s >= terrainHeight(x, z) + 0.05 && Math.abs(y - s) < 0.3) return 1; // on a deck / stone
  }
  const q = quicksandAt(x, z);
  if (q && q.sdf < 0) return QS_SLOW;
  if (poolWaterAt(x, z) !== null) return POOL_SLOW;
  return 1;
}
/** In a pit's swallowing middle (past the soft edge)? */
export function inQuicksandCore(x, z) {
  const q = quicksandAt(x, z);
  return Boolean(q && q.sdf < -QS_EDGE);
}
/** Quicksand under (x, z) at feet height y — the hazard hook (isLava). */
export function desertHazardAt(x, z, y) {
  const q = quicksandAt(x, z);
  if (!q || q.sdf >= -QS_EDGE) return false;
  if (y !== undefined && y > q.pit.level - 0.12) return false; // on a stone / the boardwalk
  return structureTopAt(x, z, y === undefined ? Infinity : y + 0.3) === null;
}
export const QUICKSAND_HINT = "That swirly dark sand is QUICKSAND! 🌀 Go round it — or use the boardwalk and the stepping stones.";
/** What the hazard is (Player reads kind / wipe line / hint / sound). */
export function desertHazardInfo(x, z) {
  const q = quicksandAt(x, z);
  if (!q || q.sdf > 0.5) return null;
  return { kind: "quicksand", wipe: "You sank in the quicksand!", hint: QUICKSAND_HINT, sound: "sink" };
}
/** The quicksand's surface where (x, z) is in a pit's middle (falling in), else null. */
export function desertSinkLevelAt(x, z) {
  const q = quicksandAt(x, z);
  return q && q.sdf < -QS_EDGE ? q.pit.level : null;
}
/** A good spot to be returned to (dry, firm, not steep). */
export function desertIsSafe(x, z) {
  const q = quicksandAt(x, z);
  if (q && q.sdf < 1.2) return false;
  if (poolWaterAt(x, z) !== null) return false;
  return slopeAt(x, z) < 0.7;
}
/** Soft sand underfoot (footprints): not paving, water, quicksand or a structure top. */
export function isOnSand(x, z) {
  if (outsideRim(x, z) > 0) return false;
  const q = quicksandAt(x, z);
  if (q && q.sdf < 0.3) return false;
  if (poolWaterAt(x, z) !== null) return false;
  const nt = nearestTrail(x, z);
  if (nt && nt.e < 0 && nt.p.kind !== "sand") return false;
  return slopeAt(x, z) < D_SLIDE_SLOPE;
}
export { SUNSTONE };
