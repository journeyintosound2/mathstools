/**
 * SCHOOLYARD GEOMETRY HELPERS — tiny pure helpers shared by the layout, the
 * terrain/structures, the colliders, the checks and the renderer, so every
 * one of them measures a rotated rectangle / polygon the SAME way.
 *
 * Frames follow three.js: an object rotated by `yaw` about +y maps its local
 * (lx, lz) to world (x, z) = (c + lx·cos + lz·sin, c − lx·sin + lz·cos).
 */
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** world → local for a frame { c:[x,z], yaw }. */
export function toLocal(f, x, z) {
  const dx = x - f.c[0], dz = z - f.c[1];
  const co = Math.cos(f.yaw || 0), si = Math.sin(f.yaw || 0);
  return [dx * co - dz * si, dx * si + dz * co];
}
/** local → world for a frame { c:[x,z], yaw }. */
export function toWorld(f, lx, lz) {
  const co = Math.cos(f.yaw || 0), si = Math.sin(f.yaw || 0);
  return [f.c[0] + lx * co + lz * si, f.c[1] - lx * si + lz * co];
}
/** Is (x, z) inside the rotated rect { c, yaw, hx, hz } (grown by `pad`)? */
export function inRect(r, x, z, pad = 0) {
  const [lx, lz] = toLocal(r, x, z);
  return Math.abs(lx) <= r.hx + pad && Math.abs(lz) <= r.hz + pad;
}
/** Signed distance to a rotated rect (− inside). */
export function rectSD(r, x, z) {
  const [lx, lz] = toLocal(r, x, z);
  const qx = Math.abs(lx) - r.hx, qz = Math.abs(lz) - r.hz;
  const ox = Math.max(qx, 0), oz = Math.max(qz, 0);
  return Math.hypot(ox, oz) + Math.min(Math.max(qx, qz), 0);
}
/** The four corners of a rotated rect, in order (−x−z, +x−z, +x+z, −x+z). */
export function rectCorners(r) {
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => toWorld(r, sx * r.hx, sz * r.hz));
}
/** A rotated rect from two ends of its centreline + half-width. */
export function stripRect(a, b, halfWidth) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const len = Math.hypot(dx, dz) || 1;
  // local +x runs a → b: cos = dx/len, −sin = dz/len → yaw = atan2(−dz, dx).
  return { c: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], yaw: Math.atan2(-dz, dx), hx: len / 2, hz: halfWidth };
}

/** Point in polygon (even-odd; works for concave). pts = [[x,z], …]. */
export function inPoly(pts, x, z) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-12) + xi) inside = !inside;
  }
  return inside;
}
/** Distance from (x, z) to segment a–b, and the parameter t. */
export function segDistT(x, z, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const L2 = dx * dx + dz * dz;
  const t = L2 > 0 ? clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1) : 0;
  return { d: Math.hypot(x - (ax + dx * t), z - (az + dz * t)), t };
}
/** Signed distance to a polygon edge (− inside). */
export function polySD(pts, x, z) {
  let d = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    d = Math.min(d, segDistT(x, z, pts[j][0], pts[j][1], pts[i][0], pts[i][1]).d);
  }
  return inPoly(pts, x, z) ? -d : d;
}
/** Polygon bounding box [xMin, zMin, xMax, zMax]. */
export function polyBox(pts) {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [x, z] of pts) { a = Math.min(a, x); b = Math.min(b, z); c = Math.max(c, x); d = Math.max(d, z); }
  return [a, b, c, d];
}
/** Rotated rect bounding box. */
export function rectBox(r) {
  return polyBox(rectCorners(r));
}

/** Deterministic PRNG (mulberry32). */
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
