/**
 * TERRAIN KIT — small, pure, deterministic helpers shared by the big-terrain
 * regions (the farm's terrain + scatter): value noise / fbm, a seeded RNG,
 * Catmull-Rom polylines, segment distances and a tiny segment index. No three,
 * no React — safe in the headless checks.
 */
export const TAU = Math.PI * 2;
export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function smoothstep(a, b, v) {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
/** Distance from (x, z) to segment a→b, and the parameter t of the nearest point. */
export function segDistT(x, z, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const L2 = dx * dx + dz * dz || 1e-9;
  const t = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1);
  return { d: Math.hypot(x - (ax + dx * t), z - (az + dz * t)), t };
}

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
export function cumLengths(pts) {
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return s;
}

/** A spatial index of segments: items [{ ax, az, bx, bz, reach, … }] → (x, z) → candidates. */
export function buildSegIndex(items, cell = 16) {
  const map = new Map();
  for (const it of items) {
    const x0 = Math.floor((Math.min(it.ax, it.bx) - it.reach) / cell), x1 = Math.floor((Math.max(it.ax, it.bx) + it.reach) / cell);
    const z0 = Math.floor((Math.min(it.az, it.bz) - it.reach) / cell), z1 = Math.floor((Math.max(it.az, it.bz) + it.reach) / cell);
    for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) {
      const k = i * 4096 + j;
      let arr = map.get(k);
      if (!arr) { arr = []; map.set(k, arr); }
      arr.push(it);
    }
  }
  return (x, z) => map.get(Math.floor(x / cell) * 4096 + Math.floor(z / cell)) || [];
}
