/**
 * EMERALD JUNGLE — procedural GEOMETRY for every plant and rock (no model
 * files). Each builder returns ONE merged BufferGeometry carrying
 *   position · normal · uv · color (baked shading) · aSway (0 roots → 1 tips)
 * so a whole species renders as a single instanced draw with the shared
 * foliage material (wind sway + per-instance tint). Shapes are seeded: each
 * species has a few variants so neighbours never look cloned.
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
  return L(
    L(L(c(0, 0, 0), c(1, 0, 0), ux), L(c(0, 1, 0), c(1, 1, 0), ux), uy),
    L(L(c(0, 0, 1), c(1, 0, 1), ux), L(c(0, 1, 1), c(1, 1, 1), ux), uy),
    uz
  );
}
const C = (hex) => new THREE.Color(hex);
const _c = new THREE.Color();

/**
 * Give a geometry the shared attribute set. `colorFn(x,y,z,nx,ny,nz) → Color`
 * (or a Color), `swayFn(x,y,z) → number` (or a number). Works in the part's
 * FINAL (already transformed) space.
 */
function finish(geo, colorFn, swayFn) {
  let g = geo.index ? geo : geo;
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) {
    g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  }
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
  // Drop any extra attributes so parts merge cleanly.
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
/** Lumpy blob (icosphere with noise displacement). */
function blob(r, sx, sy, sz, detail, seed, amp = 0.16) {
  let g = new THREE.IcosahedronGeometry(r, detail);
  // Weld the polyhedron's per-face vertices so the lumps shade SMOOTHLY.
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = vnoise3(x * 1.7 + seed, y * 1.7 - seed, z * 1.7 + seed * 0.5) - 0.5;
    const k = 1 + n * amp * 2;
    p.setXYZ(i, x * sx * k, y * sy * k, z * sz * k);
  }
  g.computeVertexNormals();
  return g;
}
/** A strip bent along a path: pts [[x,y,z]…], widths per point, `up` side. */
function ribbon(pts, widths, side, flipV = false) {
  const n = pts.length;
  const pos = new Float32Array(n * 2 * 3);
  const uv = new Float32Array(n * 2 * 2);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const w = widths[i] / 2;
    const s = side(i);
    pos.set([p[0] - s[0] * w, p[1] - s[1] * w, p[2] - s[2] * w, p[0] + s[0] * w, p[1] + s[1] * w, p[2] + s[2] * w], i * 6);
    const v = flipV ? 1 - i / (n - 1) : i / (n - 1);
    uv.set([0, v, 1, v], i * 4);
  }
  const idx = [];
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------------------
// TREES
// ---------------------------------------------------------------------------
const BARK = C("#6b4a33"), BARK_DARK = C("#3f2b1e");
const LEAF_DARK = C("#2b5d24"), LEAF_MID = C("#4a8f33"), LEAF_LIGHT = C("#8cc653");

/** Broadleaf jungle tree (~10 m): bent trunk, branches, lumpy canopy. */
export function buildBroadleaf(seed = 1, { height = 10, spread = 1, emergent = false, lod = false, far = false } = {}) {
  if (far) lod = true;
  const r = prand(seed);
  const H = height;
  const parts = [];
  // Trunk: a bent, tapered cylinder (plus a flared root collar).
  const trunk = new THREE.CylinderGeometry(emergent ? 0.42 : 0.26, emergent ? 0.85 : 0.44, H * 0.72, far ? 4 : lod ? 6 : 9, far ? 1 : lod ? 2 : 6, true);
  trunk.translate(0, H * 0.36, 0);
  {
    const p = trunk.attributes.position;
    const bx = (r() - 0.5) * 0.9, bz = (r() - 0.5) * 0.9;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i), t = y / (H * 0.72);
      p.setX(i, p.getX(i) + bx * t * t + Math.sin(t * 5 + seed) * 0.05);
      p.setZ(i, p.getZ(i) + bz * t * t);
    }
    trunk.computeVertexNormals();
  }
  parts.push(finish(trunk, (x, y) => _c.copy(BARK_DARK).lerp(BARK, Math.min(1, y / 3)), (x, y) => Math.max(0, y / H - 0.3) * 0.5));
  const collar = new THREE.ConeGeometry(emergent ? 2.2 : 0.95, emergent ? 2.6 : 1.1, lod ? 6 : 9, 1, true);
  collar.translate(0, emergent ? 1.1 : 0.45, 0);
  if (!far) parts.push(finish(collar, BARK_DARK, 0));
  if (emergent && !lod) {
    // Buttress roots: thin flared fins.
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU + r();
      const fin = new THREE.BoxGeometry(0.22, 2.8, 2.4);
      fin.translate(0, 1.2, 1.1);
      const p = fin.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i), z = p.getZ(i);
        if (y > 1.5) p.setZ(i, z * 0.25);
      }
      fin.rotateY(a);
      parts.push(finish(fin, BARK, 0));
    }
  }
  // Canopy: a full, lumpy crown of blobs in two layers (lower ring + upper
  // dome), shaded dark underneath and sunlit on top.
  const crownY = H * (emergent ? 0.8 : 0.66);
  const R = (emergent ? 4.6 : 3.0) * spread;
  const centers = [[0, crownY + R * 0.55, 0]];
  const lower = emergent ? 7 : 5 + Math.floor(r() * 2);
  for (let k = 0; k < lower; k++) {
    const a = (k / lower) * TAU + r() * 0.5;
    const rr = R * (0.72 + r() * 0.25);
    centers.push([Math.cos(a) * rr, crownY + (r() - 0.4) * R * 0.3, Math.sin(a) * rr]);
  }
  const upper = emergent ? 4 : 3;
  for (let k = 0; k < upper; k++) {
    const a = (k / upper) * TAU + 0.7 + r() * 0.5;
    const rr = R * (0.38 + r() * 0.2);
    centers.push([Math.cos(a) * rr, crownY + R * (0.45 + r() * 0.3), Math.sin(a) * rr]);
  }
  // Three stout limbs up into the crown (mostly hidden by it).
  for (let k = 0; k < (lod ? 0 : 3); k++) {
    const c = centers[1 + Math.floor((k / 3) * lower)];
    const from = new THREE.Vector3(0, H * 0.52, 0), to = new THREE.Vector3(c[0] * 0.6, c[1] - 0.6, c[2] * 0.6);
    const len = from.distanceTo(to);
    const br = new THREE.CylinderGeometry(0.1, 0.19, len, 6, 1, true);
    br.translate(0, len / 2, 0);
    br.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize()));
    br.translate(from.x, from.y, from.z);
    parts.push(finish(br, BARK, (x, y) => Math.max(0, y / H - 0.3) * 0.6));
  }
  centers.forEach((c, k) => {
    let s = (emergent ? 2.5 : 1.85) * (0.82 + r() * 0.4) * spread * (k === 0 ? 1.15 : 1);
    // Far away: just the crown's top + every other ring blob, each a bit bigger.
    if (far && k > 0 && (k > lower || k % 2 === 0)) return;
    if (far) s *= k === 0 ? 1.3 : 1.25;
    const b = blob(s, 1, emergent ? 0.62 : 0.8, 1, lod ? 0 : 1, seed * 7 + k, 0.3);
    b.translate(c[0], c[1], c[2]);
    const top = c[1] + s, bot = c[1] - s;
    parts.push(finish(b, (x, y, z, nx, ny) => {
      const t = (y - bot) / (top - bot);
      _c.copy(LEAF_DARK).lerp(LEAF_MID, Math.min(1, t * 1.25));
      if (ny > 0.2) _c.lerp(LEAF_LIGHT, (ny - 0.2) * 0.8 * Math.min(1, t * 1.3));
      // Outer blobs are a touch lighter (sun-catching rim).
      const out = Math.hypot(x, z) / (R * 1.5);
      _c.lerp(LEAF_LIGHT, Math.min(0.25, out * 0.2));
      _c.offsetHSL((hash3(k, seed, 1) - 0.5) * 0.03, 0, (hash3(k, seed, 2) - 0.5) * 0.05);
      return _c;
    }, (x, y) => 0.55 + 0.45 * Math.min(1, Math.max(0, (y - crownY + R) / (2 * R)))));
  });
  return merge(parts);
}

/** Conifer / spruce (~13 m) — stacked drooping tiers with jagged rims. */
export function buildConifer(seed = 1, { height = 13, lod = false, far = false } = {}) {
  if (far) lod = true;
  const r = prand(seed);
  const H = height;
  const parts = [];
  const SEG = far ? 6 : lod ? 7 : 11;
  const trunk = new THREE.CylinderGeometry(0.12, 0.34, H * 0.8, lod ? 5 : 7, 1, true);
  trunk.translate(0, H * 0.4, 0);
  parts.push(finish(trunk, (x, y) => _c.copy(BARK_DARK).lerp(C("#5a3d2a"), Math.min(1, y / 3)), 0));
  const tiers = 6;
  const DARK = C("#173d2c"), MID = C("#2b6142"), LIGHT = C("#4f8c5c");
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const rad = 3.1 * (1 - t * 0.78) * (0.92 + r() * 0.16);
    const h = 3.3 * (1 - t * 0.35);
    const y0 = H * 0.16 + t * H * 0.66;
    const cone = new THREE.ConeGeometry(rad, h, SEG, lod ? 1 : 2, true);
    cone.translate(0, y0 + h / 2, 0);
    const p = cone.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const y = p.getY(k);
      if (Math.abs(y - y0) < 0.01) {
        // Jagged, drooping rim.
        const a = Math.atan2(p.getZ(k), p.getX(k));
        const j = 1 + (Math.sin(a * SEG + seed + i) > 0 ? 0.13 : -0.08);
        p.setX(k, p.getX(k) * j);
        p.setZ(k, p.getZ(k) * j);
        p.setY(k, y - 0.35 * j);
      }
    }
    cone.computeVertexNormals();
    parts.push(finish(cone, (x, y, z, nx, ny) => {
      const lt = (y - y0) / h;
      _c.copy(DARK).lerp(MID, Math.min(1, lt * 1.3));
      if (ny > 0.3) _c.lerp(LIGHT, (ny - 0.3) * 0.6);
      return _c;
    }, (x, y) => Math.min(1, (y / H) * 1.1) * 0.6));
    if (far) continue;
    // Underside skirt so tiers aren't hollow from below.
    const under = new THREE.CircleGeometry(rad * 0.92, SEG);
    under.rotateX(Math.PI / 2);
    under.translate(0, y0 - 0.2, 0);
    parts.push(finish(under, DARK, (x, y) => Math.min(1, (y / H) * 1.1) * 0.6));
  }
  return merge(parts);
}

/** Giant redwood (~34 m): buttressed red trunk, layered high canopy. */
export function buildGiant(seed = 1, { height = 34, lod = false } = {}) {
  const r = prand(seed);
  const H = height;
  const parts = [];
  const RED = C("#8f4b2c"), RED_DARK = C("#4d2616"), RED_LIGHT = C("#ad6440");
  const trunk = new THREE.CylinderGeometry(0.95, 1.95, H * 0.9, lod ? 9 : 16, lod ? 3 : 10, true);
  trunk.translate(0, H * 0.45, 0);
  parts.push(finish(trunk, (x, y, z) => {
    const a = Math.atan2(z, x);
    const groove = Math.sin(a * 8 + Math.sin(y * 0.3) * 0.5) * 0.5 + 0.5;
    _c.copy(RED_DARK).lerp(RED, 0.45 + groove * 0.55);
    if (y < 4) _c.lerp(RED_DARK, (4 - y) / 6);
    _c.lerp(RED_LIGHT, vnoise3(x * 0.8, y * 0.2, z * 0.8) * 0.25);
    return _c;
  }, 0));
  // Buttress roots: smooth, concave fins flaring out from the trunk.
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU + r() * 0.4;
    const reach = 2.6 + r() * 1.3, tall = 4.2 + r() * 2.2;
    const sh = new THREE.Shape();
    sh.moveTo(0, -0.3);
    sh.lineTo(reach, -0.3);
    sh.quadraticCurveTo(reach * 0.22, 0.12, 0, tall);
    sh.lineTo(0, -0.3);
    const fin = new THREE.ExtrudeGeometry(sh, lod
      ? { depth: 0.55, bevelEnabled: false, curveSegments: 3 }
      : { depth: 0.55, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.16, bevelSegments: 2, curveSegments: 8 });
    fin.deleteAttribute("uv");
    fin.translate(1.4, 0, -0.28);
    fin.rotateY(-a);
    parts.push(finish(fin, (x, y) => _c.copy(RED_DARK).lerp(RED, Math.min(1, y / 4)), 0));
  }
  // Branch stubs + layered canopy tiers in the top half.
  const DARK = C("#1b3d26"), MID = C("#2e5e35"), LIGHT = C("#4c8848");
  const tiers = 7;
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const y = H * (0.5 + t * 0.47);
    const ring = 3 + Math.floor(r() * 2);
    for (let k = 0; k < ring; k++) {
      const a = (k / ring) * TAU + i * 0.9 + r() * 0.5;
      const reach = (5.4 - t * 3.6) * (0.85 + r() * 0.3);
      const s = (2.3 - t * 1.1) * (0.85 + r() * 0.3);
      const b = blob(s, 1.5, 0.5, 1, lod ? 0 : 1, seed * 13 + i * 7 + k, 0.22);
      b.rotateY(-a);
      b.translate(Math.cos(a) * reach, y + (r() - 0.5) * 1.2, Math.sin(a) * reach);
      parts.push(finish(b, (x, yy, z, nx, ny) => {
        _c.copy(DARK).lerp(MID, 0.4 + 0.6 * Math.max(0, ny));
        if (ny > 0.4) _c.lerp(LIGHT, (ny - 0.4) * 0.7);
        return _c;
      }, (x, yy) => 0.25 + 0.35 * (yy / H)));
      const br = new THREE.CylinderGeometry(0.12, 0.28, reach, lod ? 4 : 5, 1, true);
      br.rotateZ(-Math.PI / 2 + 0.18);
      br.translate(reach / 2, y - 0.4, 0);
      br.rotateY(-a);
      parts.push(finish(br, RED_DARK, 0.1));
    }
  }
  // A crown tuft at the very top.
  const top = blob(1.6, 1, 1.6, 1, lod ? 0 : 1, seed * 3, 0.2);
  top.translate(0, H * 0.98, 0);
  parts.push(finish(top, (x, y, z, nx, ny) => _c.copy(MID).lerp(LIGHT, Math.max(0, ny) * 0.5), 0.5));
  return merge(parts);
}

/** Palm (~9 m): curved ringed trunk, drooping fronds (alpha), coconuts. */
export function buildPalmTrunk(seed = 1, { height = 9, lean = 0.28 } = {}) {
  const r = prand(seed);
  const H = height;
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new THREE.Vector3(Math.sin(t * 1.4) * lean * H * 0.35 + Math.sin(t * 5 + seed) * 0.08, t * H, (r() - 0.5) * 0.05));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.TubeGeometry(curve, 22, 0.24, 8, false);
  const p = tube.attributes.position;
  // Taper toward the top.
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const t = y / H;
    const c = curve.getPointAt(Math.min(1, Math.max(0, t)));
    const k = 1.25 - t * 0.45;
    p.setX(i, c.x + (p.getX(i) - c.x) * k);
    p.setZ(i, c.z + (p.getZ(i) - c.z) * k);
  }
  tube.computeVertexNormals();
  const A = C("#8c6a45"), B = C("#b08a5c"), D = C("#5e452d");
  const g = finish(tube, (x, y) => {
    const band = Math.floor(y / 0.42) % 2;
    _c.copy(band ? A : B);
    if (y < 1) _c.lerp(D, 1 - y);
    return _c;
  }, (x, y) => (y / H) * 0.35);
  const topPt = curve.getPointAt(1);
  // Coconuts + a fibrous crown knob.
  const parts = [g];
  const knob = blob(0.42, 1, 0.8, 1, 1, seed, 0.2);
  knob.translate(topPt.x, topPt.y, topPt.z);
  parts.push(finish(knob, C("#6b5532"), 0.35));
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU + r();
    const nut = new THREE.SphereGeometry(0.2, 7, 5);
    nut.translate(topPt.x + Math.cos(a) * 0.32, topPt.y - 0.32, topPt.z + Math.sin(a) * 0.32);
    parts.push(finish(nut, C("#5a3e22"), 0.35));
  }
  const geo = merge(parts);
  geo.userData.top = [topPt.x, topPt.y, topPt.z];
  return geo;
}
export function buildPalmFronds(seed = 1, top = [0, 9, 0]) {
  const r = prand(seed + 5);
  const parts = [];
  const n = 9;
  const G0 = C("#3f7f26"), G1 = C("#86c24a"), BROWN = C("#8a7044");
  for (let k = 0; k < n + 2; k++) {
    const dead = k >= n;
    const a = (k / n) * TAU + r() * 0.35;
    const len = dead ? 2.6 : 4.2 + r() * 1.2;
    const lift = dead ? -1.4 : 0.55 + r() * 0.5;
    const pts = [], widths = [];
    const seg = 9;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg;
      const d = t * len;
      const y = lift * Math.sin(t * Math.PI * 0.6) * 1.6 - t * t * (dead ? 2.4 : 2.6);
      pts.push([top[0] + Math.cos(a) * d, top[1] + y, top[2] + Math.sin(a) * d]);
      widths.push((dead ? 0.7 : 1.35) * Math.sin(Math.PI * (0.12 + t * 0.85)) + 0.08);
    }
    const sx = -Math.sin(a), sz = Math.cos(a);
    const rb = ribbon(pts, widths, () => [sx, 0.12, sz]);
    parts.push(finish(rb, (x, y, z) => {
      const d = Math.hypot(x - top[0], z - top[2]) / len;
      return dead ? _c.copy(BROWN) : _c.copy(G0).lerp(G1, d * 0.85);
    }, (x, y, z) => 0.35 + Math.min(1, Math.hypot(x - top[0], z - top[2]) / len) * 0.65));
  }
  return merge(parts);
}

// ---------------------------------------------------------------------------
// UNDERGROWTH
// ---------------------------------------------------------------------------
/** Fern: arching alpha fronds from a crown. */
export function buildFern(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const n = 8;
  const G0 = C("#2d6a24"), G1 = C("#7cc04a");
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + r() * 0.5;
    const len = 0.95 + r() * 0.5;
    const rise = 0.55 + r() * 0.35;
    const pts = [], widths = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      pts.push([Math.cos(a) * t * len, rise * Math.sin(t * Math.PI * 0.75) - t * t * 0.35, Math.sin(a) * t * len]);
      widths.push(0.5);
    }
    const rb = ribbon(pts, widths, () => [-Math.sin(a), 0.25, Math.cos(a)]);
    parts.push(finish(rb, (x, y, z) => _c.copy(G0).lerp(G1, Math.min(1, Math.hypot(x, z) / len)), (x, y, z) => Math.min(1, Math.hypot(x, z) / len)));
  }
  return merge(parts);
}
/** Big-leaf plant (monstera / elephant ear) on stems. */
export function buildBigLeaf(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const n = 5 + Math.floor(r() * 2);
  const G0 = C("#1f5a24"), G1 = C("#58a43c"), STEM = C("#3f6b25");
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + r() * 0.6;
    const stemL = 0.7 + r() * 0.6;
    const out = 0.25 + r() * 0.2;
    const base = [Math.cos(a) * out, stemL, Math.sin(a) * out];
    const stem = new THREE.CylinderGeometry(0.025, 0.04, Math.hypot(stemL, out), 4, 1, true);
    stem.translate(0, Math.hypot(stemL, out) / 2, 0);
    stem.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(base[0], base[1], base[2]).normalize()));
    parts.push(finish(stem, STEM, (x, y) => y * 0.3));
    const L = 1.0 + r() * 0.45;
    const pts = [], widths = [];
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      pts.push([base[0] + Math.cos(a) * t * L * 0.85, base[1] + Math.sin(t * Math.PI * 0.6) * 0.25 - t * t * 0.45, base[2] + Math.sin(a) * t * L * 0.85]);
      widths.push(L * 0.85);
    }
    const rb = ribbon(pts, widths, () => [-Math.sin(a), 0.08, Math.cos(a)]);
    parts.push(finish(rb, (x, y, z) => _c.copy(G0).lerp(G1, 0.35 + 0.65 * Math.min(1, Math.hypot(x - base[0], z - base[2]) / L)), (x, y) => 0.3 + y * 0.35));
  }
  return merge(parts);
}
/** Bush: a few lumpy blobs. */
export function buildBush(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const D = C("#2a5a22"), M = C("#4a8a30"), L = C("#7ab84a");
  const n = 3 + Math.floor(r() * 2);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + r();
    const s = 0.55 + r() * 0.4;
    const b = blob(s, 1, 0.8, 1, 1, seed * 5 + k, 0.22);
    b.translate(Math.cos(a) * 0.45, s * 0.65, Math.sin(a) * 0.45);
    parts.push(finish(b, (x, y, z, nx, ny) => {
      _c.copy(D).lerp(M, Math.min(1, y / 1.1));
      if (ny > 0.3) _c.lerp(L, (ny - 0.3) * 0.6);
      return _c;
    }, (x, y) => Math.min(1, y / 1.2) * 0.5));
  }
  return merge(parts);
}
/** Flower clump: stems + star flowers in one colour (variant). */
const FLOWER_COLS = ["#ff5fa2", "#ffd23f", "#ffffff", "#b07cff", "#ff6b3d", "#5fd0ff"];
export function buildFlowers(seed = 1, variant = 0) {
  const r = prand(seed);
  const parts = [];
  const petal = C(FLOWER_COLS[variant % FLOWER_COLS.length]);
  const centre = C(variant % FLOWER_COLS.length === 1 ? "#ff8c1a" : "#ffe36b");
  const n = 5 + Math.floor(r() * 3);
  for (let k = 0; k < n; k++) {
    const a = r() * TAU, d = r() * 0.38;
    const h = 0.28 + r() * 0.3;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const stem = new THREE.CylinderGeometry(0.012, 0.018, h, 3, 1, true);
    stem.translate(x, h / 2, z);
    parts.push(finish(stem, C("#3d7a2a"), (xx, y) => y * 0.6));
    const flower = new THREE.CircleGeometry(0.075 + r() * 0.03, 5);
    const fp = flower.attributes.position;
    for (let i = 1; i < fp.count; i++) {
      // Star-ish petals.
      const k2 = (i - 1) % 2 ? 0.55 : 1;
      fp.setXYZ(i, fp.getX(i) * k2, fp.getY(i) * k2, 0);
    }
    flower.rotateX(-Math.PI / 2 + (r() - 0.5) * 0.6);
    flower.translate(x, h + 0.01, z);
    parts.push(finish(flower, (xx, yy, zz) => (Math.hypot(xx - x, zz - z) < 0.03 ? centre : petal), (xx, y) => y * 0.6));
  }
  // A few leaves at the base.
  for (let k = 0; k < 3; k++) {
    const a = r() * TAU;
    const lf = new THREE.PlaneGeometry(0.08, 0.26);
    lf.translate(0, 0.13, 0);
    lf.rotateX(-0.6);
    lf.rotateY(a);
    parts.push(finish(lf, C("#4f8f30"), 0.1));
  }
  return merge(parts);
}
/** Mushroom cluster (red-spotted / brown / glowing). */
export function buildMushrooms(seed = 1, kind = "red") {
  const r = prand(seed);
  const parts = [];
  const CAP = kind === "red" ? C("#d8352a") : kind === "glow" ? C("#59d6ff") : C("#9a6b44");
  const STEM = C("#efe6d2");
  const n = 2 + Math.floor(r() * 3);
  for (let k = 0; k < n; k++) {
    const a = r() * TAU, d = k === 0 ? 0 : 0.18 + r() * 0.2;
    const h = (k === 0 ? 0.36 : 0.18 + r() * 0.16);
    const cr = h * (0.7 + r() * 0.3);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const stem = new THREE.CylinderGeometry(cr * 0.28, cr * 0.36, h, 6, 1, true);
    stem.translate(x, h / 2, z);
    parts.push(finish(stem, STEM, 0));
    const cap = new THREE.SphereGeometry(cr, 9, 5, 0, TAU, 0, Math.PI / 2);
    cap.scale(1, 0.62, 1);
    cap.translate(x, h * 0.92, z);
    parts.push(finish(cap, (xx, yy, zz) => {
      // White spots on red caps.
      if (kind === "red" && vnoise3(xx * 14, yy * 14, zz * 14) > 0.72) return _c.set("#fff7ea");
      return _c.copy(CAP).multiplyScalar(0.8 + 0.25 * (yy - h * 0.9) / cr);
    }, 0));
  }
  return merge(parts);
}
/** Reeds + cattails. */
export function buildReeds(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const n = 7;
  for (let k = 0; k < n; k++) {
    const a = r() * TAU, d = r() * 0.25;
    const h = 0.9 + r() * 0.8;
    const lean = (r() - 0.5) * 0.5;
    const pts = [], widths = [];
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      pts.push([Math.cos(a) * d + lean * t * t, t * h, Math.sin(a) * d]);
      widths.push(0.07 * (1 - t * 0.85));
    }
    parts.push(finish(ribbon(pts, widths, () => [Math.cos(a + 1.57), 0, Math.sin(a + 1.57)]), (x, y) => _c.set("#5f8f3a").lerp(C("#a7c46a"), y / h), (x, y) => y / h));
    if (k < 2) {
      const cat = new THREE.CylinderGeometry(0.05, 0.05, 0.28, 6);
      cat.translate(Math.cos(a) * d + lean, h + 0.1, Math.sin(a) * d);
      parts.push(finish(cat, C("#6b4426"), 1));
    }
  }
  return merge(parts);
}
/** Mossy boulder. */
export function buildRock(seed = 1) {
  const g = blob(1, 1.15, 0.72, 1, 1, seed * 3.1, 0.28);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) < -0.2) p.setY(i, -0.2 + (p.getY(i) + 0.2) * 0.3);
  g.translate(0, 0.32, 0);
  g.computeVertexNormals();
  const ROCK = C("#7a776c"), DARK = C("#56534b"), MOSS = C("#4b7a2e");
  return merge([finish(g, (x, y, z, nx, ny) => {
    _c.copy(DARK).lerp(ROCK, vnoise3(x * 2 + seed, y * 2, z * 2));
    if (ny > 0.45) _c.lerp(MOSS, Math.min(1, (ny - 0.45) * 2.2) * (0.6 + 0.4 * vnoise3(x * 3, y * 3, z * 3 + seed)));
    return _c;
  }, 0)]);
}
/** Lily pad (+ optional flower). */
export function buildLily(seed = 1, flower = false) {
  const g = new THREE.CircleGeometry(0.55, 12, 0.25, TAU - 0.5);
  g.rotateX(-Math.PI / 2);
  const parts = [finish(g, (x, y, z) => _c.set("#3f8a34").lerp(C("#6fb84a"), Math.hypot(x, z) / 0.55), 0.15)];
  if (flower) {
    for (let k = 0; k < 7; k++) {
      const pet = new THREE.ConeGeometry(0.08, 0.26, 4);
      pet.rotateZ(Math.PI / 2 - 0.5);
      pet.translate(0.1, 0.1, 0);
      pet.rotateY((k / 7) * TAU);
      parts.push(finish(pet, C("#ffc4dc"), 0.2));
    }
    const c = new THREE.SphereGeometry(0.06, 6, 4);
    c.translate(0, 0.12, 0);
    parts.push(finish(c, C("#ffd84a"), 0.2));
  }
  return merge(parts);
}
/** Fallen mossy log, length 1 along +x (scaled per instance). */
export function buildLog(seed = 1) {
  const g = new THREE.CylinderGeometry(1, 1, 1, 12, 4, false);
  g.rotateZ(Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const k = 1 + (vnoise3(x * 3 + seed, p.getY(i) * 2, p.getZ(i) * 2) - 0.5) * 0.18;
    p.setY(i, p.getY(i) * k);
    p.setZ(i, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  return merge([finish(g, (x, y, z, nx, ny) => {
    if (Math.abs(nx) > 0.9) return _c.set("#c8a272"); // cut ends
    _c.set("#5b4030").lerp(C("#7a5a40"), vnoise3(x * 4, y * 4, z * 4));
    if (ny > 0.35) _c.lerp(C("#4f8a30"), Math.min(1, (ny - 0.35) * 2));
    return _c;
  }, 0)]);
}
/** Tree stump with a light cut top. */
export function buildStump(seed = 1) {
  const g = new THREE.CylinderGeometry(0.45, 0.62, 0.7, 10, 1, false);
  g.translate(0, 0.35, 0);
  const parts = [finish(g, (x, y, z, nx, ny) => (ny > 0.9 ? _c.set("#c9a679") : _c.set("#5e4331").lerp(C("#7c5a41"), y)), 0)];
  for (let k = 0; k < 4; k++) {
    const root = new THREE.ConeGeometry(0.2, 0.9, 5);
    root.rotateZ(-1.1);
    root.translate(0.55, 0.1, 0);
    root.rotateY((k / 4) * TAU + seed);
    parts.push(finish(root, C("#5e4331"), 0));
  }
  return merge(parts);
}
/** Hanging vine strip (alpha), 1 m long hanging DOWN from y = 0 (scaled per instance). */
export function buildVineStrip() {
  const pts = [], widths = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([Math.sin(t * 3) * 0.05, -t, 0]); widths.push(0.32); }
  const g = ribbon(pts, widths, () => [1, 0, 0]);
  return merge([finish(g, (x, y) => _c.set("#3f7a2a").lerp(C("#6aa83e"), -y), (x, y) => Math.min(1, -y * 1.2))]);
}
/** A clump of grass blades (alpha), for the GPU grass field. */
export function buildGrassTuft() {
  const parts = [];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI;
    const g = new THREE.PlaneGeometry(0.62, 0.42, 1, 2);
    g.translate(0, 0.21, 0);
    g.rotateY(a);
    // Pale grey → white root-to-tip; the field shader tints it to the ground.
    parts.push(finish(g, (x, y) => _c.setRGB(0.62 + 0.38 * (y / 0.42), 0.62 + 0.38 * (y / 0.42), 0.62 + 0.38 * (y / 0.42)), (x, y) => y / 0.42));
  }
  return merge(parts);
}

export { FLOWER_COLS };

/**
 * A craggy ROCK MASS (outcrop / ledge): a box or a cylinder whose sides are
 * pushed in and out by noise while the TOP stays flat at y = h (it's a
 * walkable surface). Mossy on top, grey layered rock on the sides. Local
 * origin at the base centre.
 */
export function buildRockMass({ shape = "box", hx = 2, hz = 2, r = 2, h = 4, seed = 1 } = {}) {
  let g = shape === "cyl"
    ? new THREE.CylinderGeometry(r, r * 1.14, h, 14, 5, false)
    : new THREE.BoxGeometry(hx * 2, h, hz * 2, 6, 5, 6);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  g.translate(0, h / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const top = y > h - 0.01;
    const n = vnoise3(x * 0.55 + seed, y * 0.7, z * 0.55 - seed) - 0.5;
    const strata = Math.sin(y * 2.4 + seed) * 0.12;
    const L = Math.hypot(x, z) || 1;
    const push = top ? n * 0.25 : n * 0.7 + strata;
    p.setXYZ(i, x + (x / L) * push, top ? h : y + n * 0.15, z + (z / L) * push);
  }
  g.computeVertexNormals();
  const ROCK = C("#8a8676"), DARK = C("#5f5c50"), MOSS = C("#4d8530");
  return merge([finish(g, (x, y, z, nx, ny) => {
    _c.copy(DARK).lerp(ROCK, 0.4 + 0.6 * vnoise3(x * 0.8, y * 1.6, z * 0.8 + seed));
    if (ny > 0.55) _c.lerp(MOSS, Math.min(1, (ny - 0.55) * 3));
    else if (y > h - 0.9) _c.lerp(MOSS, 0.35 * vnoise3(x * 2, y * 2, z * 2));
    return _c;
  }, 0)]);
}

// Shared low-level builders (the farm's plants + props reuse them).
export { finish, merge, blob, ribbon, prand, vnoise3, hash3 };
