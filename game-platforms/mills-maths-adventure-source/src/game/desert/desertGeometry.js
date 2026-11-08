/**
 * SUNSTONE DESERT — procedural GEOMETRY for the scatter (no model files).
 * Each builder returns ONE merged BufferGeometry carrying
 *   position · normal · uv · color (baked shading) · aSway (0 roots → 1 tips)
 * so a whole kind renders as a single instanced draw with the shared foliage
 * material (jungleMaterials.makeFoliageMaterial — wind sway + tint).
 * Cacti are ribbed, saguaros grow 0–3 arms, prickly pears stack their pads.
 */
import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const TAU = Math.PI * 2;
function prand(seed) {
  let s = (seed * 2654435761) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function hash3(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const u = (t) => t * t * (3 - 2 * t);
  const ux = u(fx), uy = u(fy), uz = u(fz);
  const L = (a, b, t) => a + (b - a) * t;
  const c = (dx, dy, dz) => hash3(ix + dx, iy + dy, iz + dz);
  return L(L(L(c(0, 0, 0), c(1, 0, 0), ux), L(c(0, 1, 0), c(1, 1, 0), ux), uy), L(L(c(0, 0, 1), c(1, 0, 1), ux), L(c(0, 1, 1), c(1, 1, 1), ux), uy), uz);
}
const C = (hex) => new THREE.Color(hex);
const _c = new THREE.Color();

function finish(geo, colorFn, swayFn = 0) {
  const g = geo;
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  const pos = g.attributes.position, nor = g.attributes.normal;
  const n = pos.count;
  const col = new Float32Array(n * 3);
  const sway = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const c = typeof colorFn === "function" ? colorFn(x, y, z, nor.getX(i), nor.getY(i), nor.getZ(i)) : colorFn;
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    sway[i] = typeof swayFn === "function" ? swayFn(x, y, z) : swayFn;
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("aSway", new THREE.Float32BufferAttribute(sway, 1));
  for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color", "aSway"].includes(k)) g.deleteAttribute(k);
  if (!g.index) {
    const idx = [];
    for (let i = 0; i < n; i++) idx.push(i);
    g.setIndex(idx);
  }
  return g;
}
function merge(parts) {
  const g = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  g.computeBoundingSphere();
  return g;
}
function blob(r, sx, sy, sz, detail, seed, amp = 0.16) {
  let g = new THREE.IcosahedronGeometry(r, detail);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + (vnoise3(x * 1.7 + seed, y * 1.7 - seed, z * 1.7 + seed * 0.5) - 0.5) * amp * 2;
    p.setXYZ(i, x * sx * k, y * sy * k, z * sz * k);
  }
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------
// CACTI
// ---------------------------------------------------------------------------
const CACTUS = C("#5e9440"), CACTUS_LIGHT = C("#86b85a"), CACTUS_DARK = C("#3e6a2c");
/** Ribbed column along a curve: ribs = ridges round it, radius tapers to a dome. */
function ribbedTube(curve, radius, ribs, segs = 18, radial = 20, taper = 0.85) {
  const tube = new THREE.TubeGeometry(curve, segs, radius, radial, false);
  const p = tube.attributes.position;
  const frames = curve.computeFrenetFrames(segs, false);
  for (let s = 0; s <= segs; s++) {
    const t = s / segs;
    const c = curve.getPointAt(t);
    const k = (1 - (1 - taper) * t) * (t > 0.86 ? Math.sqrt(Math.max(0.02, 1 - ((t - 0.86) / 0.14) ** 2)) : 1);
    for (let r = 0; r <= radial; r++) {
      const i = s * (radial + 1) + r;
      const a = (r / radial) * TAU;
      const rib = 1 + 0.11 * Math.pow(Math.abs(Math.cos(a * ribs / 2)), 2.5) - 0.05;
      const dx = p.getX(i) - c.x, dy = p.getY(i) - c.y, dz = p.getZ(i) - c.z;
      p.setXYZ(i, c.x + dx * k * rib, c.y + dy * k * rib, c.z + dz * k * rib);
    }
    void frames;
  }
  tube.computeVertexNormals();
  // Cap the bottom so it never shows a hole.
  return tube;
}
const ribColour = (x, y, z, nx, ny, nz) => {
  // Ridges catch the light: brighter where the surface bulges (approx. by noise on the angle).
  const a = Math.atan2(nz, nx);
  const ridge = Math.pow(Math.abs(Math.cos(a * 6)), 3);
  _c.copy(CACTUS_DARK).lerp(CACTUS, 0.55 + 0.45 * ridge).lerp(CACTUS_LIGHT, ridge * 0.35 * Math.max(0, ny + 0.6));
  if (y < 0.4) _c.lerp(C("#7a6a3a"), (0.4 - y) * 1.2);
  return _c;
};
/** A SAGUARO (~6 m at s = 1): a ribbed trunk + 0–3 arms that turn upward. */
export function buildSaguaro(seed = 1, arms = 2, { lod = false } = {}) {
  const r = prand(seed);
  const H = 6;
  const trunk = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.2, 0), new THREE.Vector3((r() - 0.5) * 0.1, H * 0.4, (r() - 0.5) * 0.1),
    new THREE.Vector3((r() - 0.5) * 0.15, H * 0.75, (r() - 0.5) * 0.15), new THREE.Vector3((r() - 0.5) * 0.12, H, (r() - 0.5) * 0.12),
  ]);
  const parts = [finish(ribbedTube(trunk, 0.42, 12, lod ? 6 : 14, lod ? 8 : 20, 0.9), ribColour, (x, y) => Math.max(0, y / H) * 0.15)];
  const used = [];
  for (let k = 0; k < arms; k++) {
    let a;
    do { a = r() * TAU; } while (used.some((u) => Math.abs(((a - u + Math.PI * 3) % TAU) - Math.PI) < 1.2) && used.length < 3);
    used.push(a);
    const y0 = H * (0.38 + r() * 0.22);
    const out = 0.9 + r() * 0.5, up = 1.4 + r() * 1.6;
    const ux = Math.cos(a), uz = Math.sin(a);
    const arm = new THREE.CatmullRomCurve3([
      new THREE.Vector3(ux * 0.2, y0, uz * 0.2), new THREE.Vector3(ux * (out * 0.75), y0 + 0.05, uz * (out * 0.75)),
      new THREE.Vector3(ux * out, y0 + 0.55, uz * out), new THREE.Vector3(ux * out, y0 + up, uz * out),
    ]);
    parts.push(finish(ribbedTube(arm, 0.28, 10, lod ? 5 : 12, lod ? 6 : 14, 0.85), ribColour, (x, y) => Math.max(0, y / H) * 0.15));
  }
  if (!lod && r() < 0.6) {
    // A crown of creamy flowers on the top.
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + r();
      const f = new THREE.SphereGeometry(0.09, 6, 4);
      f.scale(1, 0.6, 1);
      f.translate(Math.cos(a) * 0.22, H + 0.02, Math.sin(a) * 0.22);
      parts.push(finish(f, C(k % 2 ? "#fff3d6" : "#ffe08a"), 0.15));
    }
  }
  return merge(parts);
}
/** A BARREL cactus (~0.9 m): a ribbed squat dome with a ring of flowers. */
export function buildBarrel(seed = 1) {
  const r = prand(seed);
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new THREE.Vector2(0.5 * Math.sin(Math.PI * (0.08 + t * 0.62)) + 0.02, t * 0.9));
  }
  pts.push(new THREE.Vector2(0.001, 0.92));
  const g = new THREE.LatheGeometry(pts, 32);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const rib = 1 + 0.1 * Math.pow(Math.abs(Math.cos(a * 8)), 2) - 0.05;
    p.setX(i, x * rib); p.setZ(i, z * rib);
  }
  g.computeVertexNormals();
  const parts = [finish(g, (x, y, z, nx, ny, nz) => {
    const a = Math.atan2(z, x);
    const ridge = Math.pow(Math.abs(Math.cos(a * 8)), 3);
    return _c.copy(CACTUS_DARK).lerp(C("#6a9e46"), 0.5 + 0.5 * ridge).lerp(C("#b8a85a"), Math.max(0, 0.2 - y) * 2);
  }, 0)];
  const red = r() < 0.5;
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU;
    const f = new THREE.ConeGeometry(0.07, 0.12, 5);
    f.rotateX(Math.PI);
    f.translate(Math.cos(a) * 0.16, 0.94, Math.sin(a) * 0.16);
    parts.push(finish(f, C(red ? "#ff5a4a" : "#ffd43a"), 0));
  }
  return merge(parts);
}
/** A PRICKLY PEAR (~1.4 m): flat oval pads stacked into a clump, pink fruit on top. */
export function buildPricklyPear(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const pads = [];
  const add = (x, y, z, s, yaw, tilt) => {
    const g = blob(0.34, 1, 1.25, 0.32, 1, seed + pads.length * 3, 0.06);
    g.rotateZ(tilt); g.rotateY(yaw);
    g.translate(x, y, z);
    parts.push(finish(g, (px, py, pz, nx, ny) => _c.copy(C("#5b8e3e")).lerp(C("#8ec160"), Math.max(0, ny) * 0.4 + 0.15 * vnoise3(px * 6, py * 6, pz * 6)), 0.05));
    pads.push({ x, y, z, s, yaw, tilt });
  };
  add(0, 0.38, 0, 1, r() * TAU, 0);
  for (let k = 0; k < 6; k++) {
    const b = pads[Math.floor(r() * pads.length)];
    if (b.y > 1.3) continue;
    const yaw = b.yaw + (r() - 0.5) * 1.2, tilt = (r() - 0.5) * 1.1;
    add(b.x + Math.sin(tilt) * 0.35 * Math.cos(yaw) * -1, b.y + 0.48, b.z + Math.sin(tilt) * 0.35 * Math.sin(yaw), 0.85, yaw, tilt);
  }
  for (const p of pads) {
    if (r() < 0.55) continue;
    const f = new THREE.SphereGeometry(0.07, 6, 4);
    f.scale(1, 1.3, 1);
    f.translate(p.x + (r() - 0.5) * 0.2, p.y + 0.44, p.z);
    parts.push(finish(f, C("#d8346a"), 0.05));
  }
  return merge(parts);
}

// ---------------------------------------------------------------------------
// SCRUB, ROCKS, BONES, TUMBLEWEEDS, POTS
// ---------------------------------------------------------------------------
/** Dry desert scrub (~0.8 m): a few twiggy, grey-olive lumps. */
export function buildShrub(seed = 1) {
  const r = prand(seed);
  const parts = [];
  for (let k = 0; k < 4; k++) {
    const a = r() * TAU, d = r() * 0.35;
    const g = blob(0.32 + r() * 0.18, 1, 0.75, 1, 1, seed + k, 0.32);
    g.translate(Math.cos(a) * d, 0.28 + r() * 0.2, Math.sin(a) * d);
    parts.push(finish(g, (x, y, z, nx, ny) => _c.copy(C("#8c8a52")).lerp(C("#b6b07a"), Math.max(0, ny) * 0.5 + 0.2 * vnoise3(x * 5, y * 5, z * 5)), (x, y) => Math.min(1, y / 0.7) * 0.6));
  }
  // Bare twigs.
  for (let k = 0; k < 5; k++) {
    const a = r() * TAU;
    const tw = new THREE.CylinderGeometry(0.012, 0.02, 0.7, 4);
    tw.translate(0, 0.35, 0);
    tw.rotateZ(0.5 + r() * 0.4); tw.rotateY(a);
    parts.push(finish(tw, C("#7a6248"), (x, y) => y * 0.8));
  }
  return merge(parts);
}
/** A clump of dry grass blades (straw; tinted green near the oasis). */
export function buildTuft(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const n = 9;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + r() * 0.5;
    const h = 0.35 + r() * 0.4, w = 0.035;
    const g = new THREE.BufferGeometry();
    const lean = 0.25 + r() * 0.3;
    const pos = [
      -w, 0, 0, w, 0, 0, Math.sin(lean) * h * 0.55 - w * 0.4, h * 0.55, 0, Math.sin(lean) * h * 0.55 + w * 0.4, h * 0.55, 0, Math.sin(lean) * h, h, 0,
    ];
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
    g.rotateY(a);
    g.computeVertexNormals();
    parts.push(finish(g, (x, y) => _c.copy(C("#b39a5a")).lerp(C("#ecd690"), Math.min(1, y / 0.6)), (x, y) => Math.min(1, y / 0.6)));
  }
  return merge(parts);
}
/** A sandstone boulder (layered, rounded by the wind). */
export function buildBoulder(seed = 1) {
  const g = blob(1, 1.1, 0.72, 0.95, 2, seed, 0.2);
  g.translate(0, 0.45, 0);
  return finish(g, (x, y, z, nx, ny) => {
    const band = Math.floor((y + vnoise3(x, 0, z) * 0.3) * 3.2) % 3;
    _c.copy(band === 0 ? C("#d39a62") : band === 1 ? C("#c07a48") : C("#e1b07a"));
    _c.lerp(C("#f0d2a2"), Math.max(0, ny) * 0.25);
    return _c;
  }, 0);
}
/** Small scree stones (half-buried). */
export function buildScree(seed = 1) {
  const r = prand(seed);
  const parts = [];
  for (let k = 0; k < 4; k++) {
    const g = blob(0.3 + r() * 0.25, 1, 0.6, 1, 0, seed + k * 5, 0.25);
    g.translate((r() - 0.5) * 1.2, 0.08, (r() - 0.5) * 1.2);
    parts.push(finish(g, C(r() < 0.5 ? "#c48a56" : "#a96e44"), 0));
  }
  return merge(parts);
}
/** A bleached cattle skull + a few ribs (v 0–2). */
export function buildBones(seed = 1) {
  const r = prand(seed);
  const BONE = C("#f3ead6"), SHADE = C("#cfc2a4");
  const parts = [];
  const col = (x, y, z, nx, ny) => _c.copy(SHADE).lerp(BONE, 0.5 + 0.5 * Math.max(0, ny));
  const head = blob(0.28, 1, 0.6, 1.4, 1, seed, 0.1);
  head.translate(0, 0.14, 0);
  parts.push(finish(head, col, 0));
  for (const s of [-1, 1]) {
    const horn = new THREE.TorusGeometry(0.28, 0.045, 5, 10, Math.PI * 0.7);
    horn.rotateY(Math.PI / 2); horn.rotateZ(s * 0.3);
    horn.translate(s * 0.26, 0.24, -0.1);
    parts.push(finish(horn, col, 0));
    const eye = new THREE.SphereGeometry(0.06, 6, 4);
    eye.translate(s * 0.11, 0.22, 0.18);
    parts.push(finish(eye, C("#4a3a2a"), 0));
  }
  const ribs = 3 + Math.floor(r() * 3);
  for (let k = 0; k < ribs; k++) {
    const rib = new THREE.TorusGeometry(0.42, 0.035, 4, 10, Math.PI * 0.8);
    rib.rotateY(Math.PI / 2);
    rib.translate(-0.4 - k * 0.22, -0.05, 0.9 + (r() - 0.5) * 0.2);
    parts.push(finish(rib, col, 0));
  }
  return merge(parts);
}
/** A tumbleweed: a loose ball of thin dry stems. */
export function buildTumbleweed(seed = 1) {
  const r = prand(seed);
  const parts = [];
  for (let k = 0; k < 16; k++) {
    const a = r() * TAU, b = r() * TAU;
    const curve = new THREE.EllipseCurve(0, 0, 0.45 + r() * 0.1, 0.4 + r() * 0.12, a, a + Math.PI * (0.8 + r() * 0.8), false, 0);
    const pts = curve.getPoints(10).map((p) => new THREE.Vector3(p.x, p.y, (r() - 0.5) * 0.15));
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.016, 3, false);
    g.rotateY(b); g.rotateX(r() * TAU);
    g.translate(0, 0.45, 0);
    parts.push(finish(g, C(r() < 0.5 ? "#a8875a" : "#c7a774"), 0));
  }
  return merge(parts);
}
/** A clay pot / urn (v 0–2). */
export function buildPot(seed = 1, v = 0) {
  const pts = [];
  const H = v === 2 ? 1.1 : 0.75;
  const prof = v === 1 ? [0.18, 0.32, 0.38, 0.34, 0.2, 0.16, 0.2] : v === 2 ? [0.16, 0.3, 0.34, 0.28, 0.16, 0.12, 0.17] : [0.2, 0.36, 0.4, 0.36, 0.26, 0.22, 0.26];
  prof.forEach((rr, i) => pts.push(new THREE.Vector2(rr, (i / (prof.length - 1)) * H)));
  const g = new THREE.LatheGeometry(pts, 18);
  const base = v === 1 ? C("#b85a34") : v === 2 ? C("#d8a868") : C("#c46c3e");
  return finish(g, (x, y) => {
    _c.copy(base);
    const band = Math.abs(y / H - 0.55) < 0.06 || Math.abs(y / H - 0.42) < 0.025;
    if (band) _c.copy(v === 2 ? C("#3f7fc4") : C("#f2e0b8"));
    return _c;
  }, 0);
}
