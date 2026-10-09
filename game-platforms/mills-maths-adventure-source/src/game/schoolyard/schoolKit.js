/**
 * SCHOOL KIT — a tiny geometry accumulator for the school's built world.
 * Every wall, slab, step, column, rail, roof plane and window is appended to
 * a per-MATERIAL buffer (position · normal · uv · color), then each buffer
 * becomes ONE mesh: the whole campus draws in a few dozen calls.
 *
 * UVs are in METRES and world-anchored, so brick courses run unbroken from
 * one box to the next and a texture's `repeat` sets its real size:
 *   vertical faces   u = distance along the face (its horizontal direction),
 *                    v = height (world y)
 *   horizontal faces u = x, v = z (world)
 *   sloped planes    u = along the eave, v = up the slope
 * `uv: "unit"` maps a quad 0…1 (windows, doors, signs, the mural).
 *
 * Every vertex has a colour (default white) that multiplies the material —
 * one "paint" material covers every painted thing in its own colour.
 */
import * as THREE from "three";

const _c = new THREE.Color();
function colorOf(c) {
  if (c === undefined || c === null) return [1, 1, 1];
  if (Array.isArray(c)) return c;
  _c.set(c);
  return [_c.r, _c.g, _c.b];
}
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => {
  const L = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / L, a[1] / L, a[2] / L];
};

export class Kit {
  constructor() {
    this.bufs = new Map();
  }
  _b(key) {
    let b = this.bufs.get(key);
    if (!b) {
      b = { pos: [], nor: [], uv: [], col: [], idx: [] };
      this.bufs.set(key, b);
    }
    return b;
  }

  /**
   * A planar polygon (3 or 4 points, counter-clockwise seen from its front).
   * opts: color, uv ("auto" | "unit" | [[u,v]…]), uvRot (rad, auto mode),
   * double (also add the back face).
   */
  poly(key, pts, opts = {}) {
    let n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
    if (opts.out && n[0] * opts.out[0] + n[1] * opts.out[1] + n[2] * opts.out[2] < 0) {
      // Face it the way it should look (`out` = roughly outward).
      pts = [...pts].reverse();
      if (Array.isArray(opts.uv)) opts = { ...opts, uv: [...opts.uv].reverse() };
      n = [-n[0], -n[1], -n[2]];
    }
    const b = this._b(key);
    const col = colorOf(opts.color);
    const base = b.pos.length / 3;
    let uvs;
    if (Array.isArray(opts.uv)) uvs = opts.uv;
    else if (opts.uv === "unit") uvs = pts.length === 3 ? [[0, 0], [1, 0], [0.5, 1]] : [[0, 0], [1, 0], [1, 1], [0, 1]];
    else uvs = autoUV(pts, n, opts);
    for (let i = 0; i < pts.length; i++) {
      b.pos.push(pts[i][0], pts[i][1], pts[i][2]);
      b.nor.push(n[0], n[1], n[2]);
      b.uv.push(uvs[i][0], uvs[i][1]);
      b.col.push(col[0], col[1], col[2]);
    }
    for (let i = 1; i < pts.length - 1; i++) b.idx.push(base, base + i, base + i + 1);
    if (opts.double) this.poly(key, [...pts].reverse(), { ...opts, double: false, uv: Array.isArray(uvs) ? [...uvs].reverse() : uvs });
  }
  /** A quad a-b-c-d (counter-clockwise from the front). */
  quad(key, a, b, c, d, opts) {
    this.poly(key, [a, b, c, d], opts);
  }

  /**
   * An oriented box: centre [x, y, z], half sizes [hx, hy, hz], yaw (three.js
   * convention). opts.faces = { top, bottom, px, nx, pz, nz } (default all
   * but bottom); opts.topKey / opts.sideKey put the top / sides in another
   * material; opts.color / opts.topColor.
   */
  box(key, c, h, yaw = 0, opts = {}) {
    const co = Math.cos(yaw), si = Math.sin(yaw);
    const P = (lx, ly, lz) => [c[0] + lx * co + lz * si, c[1] + ly, c[2] - lx * si + lz * co];
    const [hx, hy, hz] = h;
    const f = { top: true, bottom: false, px: true, nx: true, pz: true, nz: true, ...(opts.faces || {}) };
    const side = opts.sideKey || key;
    const top = opts.topKey || key;
    const o = { color: opts.color, uvScale: opts.uvScale };
    const ot = { color: opts.topColor ?? opts.color, uvScale: opts.uvScale };
    if (f.top) this.quad(top, P(-hx, hy, hz), P(hx, hy, hz), P(hx, hy, -hz), P(-hx, hy, -hz), ot);
    if (f.bottom) this.quad(opts.bottomKey || side, P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, -hy, hz), P(-hx, -hy, hz), o);
    if (f.pz) this.quad(side, P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz), o);
    if (f.nz) this.quad(side, P(hx, -hy, -hz), P(-hx, -hy, -hz), P(-hx, hy, -hz), P(hx, hy, -hz), o);
    if (f.px) this.quad(side, P(hx, -hy, hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(hx, hy, hz), o);
    if (f.nx) this.quad(side, P(-hx, -hy, -hz), P(-hx, -hy, hz), P(-hx, hy, hz), P(-hx, hy, -hz), o);
  }
  /** A box between y0 and y1 (handier for walls + slabs). */
  boxY(key, cx, cz, hx, hz, y0, y1, yaw = 0, opts = {}) {
    this.box(key, [cx, (y0 + y1) / 2, cz], [hx, (y1 - y0) / 2, hz], yaw, opts);
  }
  /** A straight wall from a → b (plan), y0 … y1, thickness t centred on the line. */
  wall(key, a, b, y0, y1, t, opts = {}) {
    const dx = b[0] - a[0], dz = b[1] - a[1];
    const L = Math.hypot(dx, dz);
    if (L < 1e-4) return;
    this.boxY(key, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, L / 2 + (opts.extend || 0), t / 2, y0, y1, Math.atan2(-dz, dx), opts);
  }
  /**
   * A beam / slab from A to B (3D points) with width w (horizontal, across)
   * and thickness t (perpendicular, roughly "up"). For ramps, stringers,
   * sloped rails.
   */
  beam(key, A, B, w, t, opts = {}) {
    const d = sub(B, A);
    const L = Math.hypot(d[0], d[1], d[2]);
    if (L < 1e-5) return;
    const ax = [d[0] / L, d[1] / L, d[2] / L];
    let side = norm(cross(ax, [0, 1, 0]));
    if (!Number.isFinite(side[0]) || Math.hypot(...cross(ax, [0, 1, 0])) < 1e-4) side = [1, 0, 0];
    const up = norm(cross(side, ax));
    const hw = w / 2, ht = t / 2;
    const corner = (s, e, u, v) => {
      const base = s ? B : A;
      return [
        base[0] + side[0] * u * hw + up[0] * v * ht,
        base[1] + side[1] * u * hw + up[1] * v * ht,
        base[2] + side[2] * u * hw + up[2] * v * ht,
      ];
    };
    const p000 = corner(0, 0, -1, -1), p010 = corner(0, 0, 1, -1), p011 = corner(0, 0, 1, 1), p001 = corner(0, 0, -1, 1);
    const p100 = corner(1, 0, -1, -1), p110 = corner(1, 0, 1, -1), p111 = corner(1, 0, 1, 1), p101 = corner(1, 0, -1, 1);
    const o = { color: opts.color };
    const ot = { color: opts.topColor ?? opts.color };
    this.quad(opts.topKey || key, p001, p011, p111, p101, ot); // top (+up)
    if (opts.bottom !== false) this.quad(key, p100, p110, p010, p000, o);
    this.quad(key, p000, p001, p101, p100, o); // −side
    this.quad(key, p110, p111, p011, p010, o); // +side
    if (opts.ends !== false) {
      this.quad(key, p010, p011, p001, p000, o);
      this.quad(key, p100, p101, p111, p110, o);
    }
  }
  /** A cylinder between two 3D points (posts, rails, pipes). */
  tube(key, A, B, r, seg = 8, opts = {}) {
    const b = this._b(key);
    const d = sub(B, A);
    const L = Math.hypot(d[0], d[1], d[2]);
    if (L < 1e-5) return;
    const ax = [d[0] / L, d[1] / L, d[2] / L];
    const ref = Math.abs(ax[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const s = norm(cross(ax, ref));
    const t = cross(ax, s);
    const col = colorOf(opts.color);
    const base = b.pos.length / 3;
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const nx = s[0] * Math.cos(a) + t[0] * Math.sin(a), ny = s[1] * Math.cos(a) + t[1] * Math.sin(a), nz = s[2] * Math.cos(a) + t[2] * Math.sin(a);
      for (const [P, v] of [[A, 0], [B, L]]) {
        b.pos.push(P[0] + nx * r, P[1] + ny * r, P[2] + nz * r);
        b.nor.push(nx, ny, nz);
        b.uv.push((i / seg) * Math.PI * 2 * r, v);
        b.col.push(col[0], col[1], col[2]);
      }
    }
    for (let i = 0; i < seg; i++) {
      const a = base + i * 2;
      b.idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    if (opts.caps) {
      this.disc(key, B, ax, r, seg, opts);
      this.disc(key, A, [-ax[0], -ax[1], -ax[2]], r, seg, opts);
    }
  }
  /** A flat disc facing `n`. */
  disc(key, c, n, r, seg = 12, opts = {}) {
    const b = this._b(key);
    const ref = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const s = norm(cross(n, ref));
    const t = cross(n, s);
    const col = colorOf(opts.color);
    const base = b.pos.length / 3;
    b.pos.push(c[0], c[1], c[2]); b.nor.push(n[0], n[1], n[2]); b.uv.push(0.5, 0.5); b.col.push(col[0], col[1], col[2]);
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      b.pos.push(c[0] + (s[0] * Math.cos(a) + t[0] * Math.sin(a)) * r, c[1] + (s[1] * Math.cos(a) + t[1] * Math.sin(a)) * r, c[2] + (s[2] * Math.cos(a) + t[2] * Math.sin(a)) * r);
      b.nor.push(n[0], n[1], n[2]);
      b.uv.push(0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a));
      b.col.push(col[0], col[1], col[2]);
    }
    for (let i = 0; i < seg; i++) b.idx.push(base, base + 1 + i, base + 2 + i);
  }
  /** A vertical post (cylinder) at (x, z) from y0 to y1. */
  post(key, x, z, y0, y1, r, seg = 8, opts = {}) {
    this.tube(key, [x, y0, z], [x, y1, z], r, seg, opts);
    if (opts.cap !== false) this.disc(key, [x, y1, z], [0, 1, 0], r, seg, opts);
  }
  /** Append an existing BufferGeometry (world space) to a buffer. */
  geometry(key, g, opts = {}) {
    const b = this._b(key);
    const gi = g.index ? g : g;
    const pos = gi.attributes.position, nor = gi.attributes.normal, uv = gi.attributes.uv, col = gi.attributes.color;
    const c = colorOf(opts.color);
    const base = b.pos.length / 3;
    for (let i = 0; i < pos.count; i++) {
      b.pos.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      if (nor) b.nor.push(nor.getX(i), nor.getY(i), nor.getZ(i)); else b.nor.push(0, 1, 0);
      if (uv) b.uv.push(uv.getX(i), uv.getY(i)); else b.uv.push(0, 0);
      if (col) b.col.push(col.getX(i) * c[0], col.getY(i) * c[1], col.getZ(i) * c[2]); else b.col.push(c[0], c[1], c[2]);
    }
    if (gi.index) for (let i = 0; i < gi.index.count; i++) b.idx.push(base + gi.index.getX(i));
    else for (let i = 0; i < pos.count; i++) b.idx.push(base + i);
  }

  /** Every buffer as a BufferGeometry: [{ key, geometry }]. */
  build() {
    const out = [];
    for (const [key, b] of this.bufs) {
      if (!b.idx.length) continue;
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(b.pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(b.nor, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(b.uv, 2));
      g.setAttribute("color", new THREE.Float32BufferAttribute(b.col, 3));
      g.setIndex(b.pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(b.idx, 1) : new THREE.Uint16BufferAttribute(b.idx, 1));
      g.computeBoundingSphere();
      g.computeBoundingBox();
      out.push({ key, geometry: g });
    }
    return out;
  }
  /** Rough triangle count (for the perf notes). */
  triangles() {
    let n = 0;
    for (const b of this.bufs.values()) n += b.idx.length / 3;
    return n;
  }
}

/** World-anchored metre UVs for a planar polygon with normal n. */
function autoUV(pts, n, opts) {
  const s = opts.uvScale || 1;
  if (Math.abs(n[1]) > 0.985) {
    // Horizontal: plan coordinates (optionally rotated).
    const r = opts.uvRot || 0, co = Math.cos(r), si = Math.sin(r);
    return pts.map((p) => [(p[0] * co - p[2] * si) * s, (p[0] * si + p[2] * co) * s * (n[1] > 0 ? -1 : 1)]);
  }
  if (Math.abs(n[1]) < 0.02) {
    // Vertical: along the face × height.
    const tx = -n[2], tz = n[0];
    const L = Math.hypot(tx, tz) || 1;
    return pts.map((p) => [((p[0] * tx + p[2] * tz) / L) * s, p[1] * s]);
  }
  // Sloped: u along the level line, v up the slope.
  const h = norm([n[0], 0, n[2]]);
  const t = [-h[2], 0, h[0]];
  const k = Math.hypot(n[0], n[2]) / Math.max(0.05, Math.abs(n[1])); // slope
  const sec = Math.sqrt(1 + k * k);
  return pts.map((p) => [(p[0] * t[0] + p[2] * t[2]) * s, -(p[0] * h[0] + p[2] * h[2]) * sec * s]);
}

/** Triangulate a plan polygon [[x,z]…] (any winding) → { pts, tris } (tris index pts). */
export function triangulatePlan(pts) {
  let P = pts.map(([x, z]) => [x, z]);
  if (THREE.ShapeUtils.isClockWise(P.map(([x, z]) => new THREE.Vector2(x, z)))) P = P.reverse();
  const tris = THREE.ShapeUtils.triangulateShape(P.map(([x, z]) => new THREE.Vector2(x, z)), []);
  return { pts: P, tris };
}

/**
 * Lay a plan polygon flat (or draped over `heightAt`), subdividing every
 * triangle until no edge is longer than `maxEdge` metres. Faces up.
 */
export function drapePolygon(kit, key, pts, heightAt, { maxEdge = 2, lift = 0.03, color, uvRot = 0, uvScale = 1 } = {}) {
  const { pts: P, tris } = triangulatePlan(pts);
  const out = [];
  const split = (a, b, c, depth) => {
    const ab = Math.hypot(a[0] - b[0], a[1] - b[1]), bc = Math.hypot(b[0] - c[0], b[1] - c[1]), ca = Math.hypot(c[0] - a[0], c[1] - a[1]);
    const m = Math.max(ab, bc, ca);
    if (m <= maxEdge || depth > 14) { out.push([a, b, c]); return; }
    if (m === ab) { const d = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; split(a, d, c, depth + 1); split(d, b, c, depth + 1); }
    else if (m === bc) { const d = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2]; split(a, b, d, depth + 1); split(a, d, c, depth + 1); }
    else { const d = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2]; split(a, b, d, depth + 1); split(d, b, c, depth + 1); }
  };
  for (const [i, j, k] of tris) split(P[i], P[j], P[k], 0);
  const b = kit._b(key);
  const col = colorOf(color);
  const co = Math.cos(uvRot), si = Math.sin(uvRot);
  for (const tri of out) {
    // Emit each triangle facing UP (+y): in three's frame a triangle that is
    // counter-clockwise in plan (x, z) faces down, so check + swap.
    const base = b.pos.length / 3;
    const [a, c2, d] = tri;
    const cy = (c2[1] - a[1]) * (d[0] - a[0]) - (c2[0] - a[0]) * (d[1] - a[1]);
    for (const p of cy >= 0 ? [a, c2, d] : [a, d, c2]) {
      const y = heightAt(p[0], p[1]) + lift;
      b.pos.push(p[0], y, p[1]);
      b.nor.push(0, 1, 0);
      b.uv.push((p[0] * co - p[1] * si) * uvScale, -(p[0] * si + p[1] * co) * uvScale);
      b.col.push(col[0], col[1], col[2]);
    }
    b.idx.push(base, base + 1, base + 2);
  }
}
