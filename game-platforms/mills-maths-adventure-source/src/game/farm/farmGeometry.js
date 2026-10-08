/**
 * FRACTION FARM — procedural GEOMETRY for the farm's trees, crops, hay,
 * fences and animals (no model files). Same contract as the jungle's
 * builders: each returns ONE merged BufferGeometry with
 *   position · normal · uv · color (baked shading) · aSway (0 roots → 1 tips)
 * so a whole kind draws as a single instanced mesh with the shared foliage
 * material (wind sway + per-instance tint). Seeded variants.
 */
import * as THREE from "three";
import { finish, merge, blob, ribbon, prand, vnoise3, hash3, buildBroadleaf, buildConifer, buildBush } from "../jungle/jungleGeometry.js";

const TAU = Math.PI * 2;
const C = (hex) => new THREE.Color(hex);
const _c = new THREE.Color();

/** A tapered limb (open cylinder) from a → b. */
function limb(a, b, r0, r1, segs = 6, colorFn = C("#6b4a33"), swayFn = 0) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r1, r0, len, segs, 1, true);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
  g.translate(A.x, A.y, A.z);
  return finish(g, colorFn, swayFn);
}
/** A leafy blob coloured dark underneath → light on top. */
function leafBlob(c, s, sy, detail, seed, cols, swayFn, amp = 0.28) {
  const b = blob(s, 1, sy, 1, detail, seed, amp);
  b.translate(c[0], c[1], c[2]);
  const top = c[1] + s * sy, bot = c[1] - s * sy;
  return finish(b, (x, y, z, nx, ny) => {
    const t = (y - bot) / Math.max(0.01, top - bot);
    _c.copy(cols[0]).lerp(cols[1], Math.min(1, t * 1.3));
    if (ny > 0.2) _c.lerp(cols[2], (ny - 0.2) * 0.75 * Math.min(1, t * 1.3));
    _c.offsetHSL((hash3(seed, 1, 2) - 0.5) * 0.02, 0, (vnoise3(x * 2.3, y * 2.3, z * 2.3) - 0.5) * 0.06);
    return _c;
  }, swayFn);
}

// ---------------------------------------------------------------------------
// TREES
// ---------------------------------------------------------------------------
const GUM_LEAF = [C("#4a5e3c"), C("#6b8152"), C("#a0b07c")];
/** A river red / ghost gum (~14 m): pale mottled trunk forking into limbs, open clumpy crown. */
export function buildGum(seed = 1, { height = 14, lod = false, far = false } = {}) {
  if (far) lod = true;
  const r = prand(seed);
  const H = height;
  const parts = [];
  const lean = [(r() - 0.5) * 0.8, (r() - 0.5) * 0.8];
  const fork = [lean[0], H * 0.42, lean[1]];
  const bark = (x, y, z) => {
    const n = vnoise3(x * 2.1 + seed, y * 0.9, z * 2.1);
    _c.set("#e3dccb").lerp(C("#b7a891"), smoothN(n, 0.45, 0.7) * 0.8);
    if (vnoise3(x * 3.3, y * 1.7 + seed, z * 3.3) > 0.68) _c.lerp(C("#c79c7f"), 0.55);
    if (y < 0.8) _c.lerp(C("#8a7a64"), (0.8 - y) * 0.6);
    return _c;
  };
  parts.push(limb([0, -0.2, 0], fork, 0.55, 0.36, far ? 4 : lod ? 6 : 9, bark, (x, y) => Math.max(0, y / H - 0.3) * 0.4));
  // Limbs up into the crown.
  const nL = far ? 2 : 3;
  const crowns = [];
  for (let k = 0; k < nL; k++) {
    const a = (k / nL) * TAU + r() * 0.9;
    const rr = 2.2 + r() * 1.8;
    const end = [fork[0] + Math.cos(a) * rr, H * (0.68 + r() * 0.14), fork[2] + Math.sin(a) * rr];
    parts.push(limb(fork, end, 0.3, 0.12, far ? 4 : 6, bark, (x, y) => Math.max(0, y / H - 0.3) * 0.6));
    crowns.push(end);
    if (!lod) {
      // A side branch.
      const mid = [(fork[0] + end[0]) / 2, (fork[1] + end[1]) / 2, (fork[2] + end[2]) / 2];
      const b2 = [mid[0] + Math.cos(a + 1.2) * 1.6, mid[1] + 1.4, mid[2] + Math.sin(a + 1.2) * 1.6];
      parts.push(limb(mid, b2, 0.1, 0.05, 5, bark, 0.5));
      crowns.push(b2);
    }
  }
  crowns.push([fork[0] + (r() - 0.5), H * 0.9, fork[2] + (r() - 0.5)]);
  crowns.forEach((c, k) => {
    const n = far ? 1 : 2;
    for (let j = 0; j < n; j++) {
      const s = (1.55 + r() * 0.7) * (far ? 1.35 : 1);
      const off = j ? [(r() - 0.5) * 1.6, 0.5 + r() * 0.6, (r() - 0.5) * 1.6] : [0, 0.3, 0];
      parts.push(leafBlob([c[0] + off[0], c[1] + off[1], c[2] + off[2]], s, 0.62, lod ? 0 : 1, seed * 11 + k * 3 + j, GUM_LEAF, 0.85, 0.34));
    }
  });
  return merge(parts);
}
function smoothN(v, a, b) { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); }

/** A shade tree (oak / elm): the jungle's broadleaf, wider + rounder. */
export function buildOak(seed = 1, opts = {}) {
  return buildBroadleaf(seed, { height: 9.5, spread: 1.28, ...opts });
}
export function buildPine(seed = 1, opts = {}) {
  return buildConifer(seed, { height: 12, ...opts });
}

/** Apple / pear tree (~4.5 m): short trunk, round crown dotted with fruit. */
export function buildFruitTree(seed = 1, { kind = "apple", lod = false } = {}) {
  const r = prand(seed);
  const parts = [];
  const pear = kind === "pear";
  const trunkTop = [0.1 * (r() - 0.5), 1.25, 0.1 * (r() - 0.5)];
  parts.push(limb([0, -0.1, 0], trunkTop, 0.2, 0.15, lod ? 5 : 7, (x, y) => _c.set("#5a4130").lerp(C("#7a5a40"), Math.min(1, y)), 0));
  const cols = pear ? [C("#3f6a2a"), C("#5e8f36"), C("#93bf5a")] : [C("#36622a"), C("#558a32"), C("#8cbc55")];
  const crownY = pear ? 2.9 : 2.6;
  const R = pear ? 1.45 : 1.7;
  const blobs = [[0, crownY + 0.35, 0, 1.25]];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU + r() * 0.6;
    blobs.push([Math.cos(a) * R * 0.62, crownY - 0.15 + (r() - 0.5) * 0.4, Math.sin(a) * R * 0.62, 0.95 + r() * 0.3]);
  }
  if (!lod) {
    for (let k = 0; k < 3; k++) {
      const b = blobs[1 + k];
      parts.push(limb(trunkTop, [b[0] * 0.7, b[1] - 0.3, b[2] * 0.7], 0.11, 0.05, 5, C("#6a4c36"), 0.3));
    }
  }
  blobs.forEach(([x, y, z, s], k) => {
    parts.push(leafBlob([x, y, z], s, pear ? 1.1 : 0.85, lod ? 0 : 1, seed * 13 + k, cols, (xx, yy) => 0.3 + 0.4 * Math.min(1, yy / (crownY + 1)), 0.25));
  });
  if (!lod) {
    // Fruit: little spheres sitting on the crown's surface.
    const fruit = pear ? C("#c9c04c") : C("#c8352b");
    const fruit2 = pear ? C("#a8b23e") : C("#e0563a");
    for (let k = 0; k < 22; k++) {
      const a = r() * TAU, el = (r() - 0.35) * 1.2;
      const rr = R * (0.95 + r() * 0.1);
      const fx = Math.cos(a) * Math.cos(el) * rr, fz = Math.sin(a) * Math.cos(el) * rr;
      const fy = crownY + Math.sin(el) * rr * (pear ? 1.0 : 0.75);
      const f = new THREE.IcosahedronGeometry(pear ? 0.1 : 0.11, 0);
      if (pear) f.scale(1, 1.35, 1);
      f.translate(fx, fy, fz);
      parts.push(finish(f, k % 3 ? fruit : fruit2, 0.4));
    }
  }
  return merge(parts);
}

/** Lombardy poplar (~15 m): slim trunk, tall narrow column of foliage. */
export function buildPoplar(seed = 1, { lod = false } = {}) {
  const r = prand(seed);
  const parts = [limb([0, -0.1, 0], [0, 3, 0], 0.26, 0.2, lod ? 5 : 7, C("#6b5a48"), 0)];
  const cols = [C("#2f5a25"), C("#4f8a33"), C("#8fc256")];
  const n = lod ? 4 : 6;
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1);
    const y = 3.2 + t * 10.5;
    const s = 1.35 * (1 - t * 0.62) + 0.25;
    parts.push(leafBlob([(r() - 0.5) * 0.25, y, (r() - 0.5) * 0.25], s, 1.55, lod ? 0 : 1, seed * 7 + k, cols, (x, yy) => 0.25 + 0.6 * (yy / 15), 0.2));
  }
  return merge(parts);
}

/** Weeping willow (~9 m): leaning trunk, dome crown, curtains of hanging strands. */
export function buildWillow(seed = 1, { lod = false } = {}) {
  const r = prand(seed);
  const parts = [];
  const top = [0.6, 3.4, 0.2];
  parts.push(limb([0, -0.2, 0], top, 0.6, 0.38, lod ? 6 : 9, (x, y) => _c.set("#4a3c2c").lerp(C("#6a5640"), Math.min(1, y / 3)), 0));
  const cols = [C("#5a7a2c"), C("#86a83e"), C("#bcd26a")];
  parts.push(leafBlob([top[0], 6.2, top[2]], 3.0, 0.62, lod ? 0 : 1, seed * 5, cols, 0.6, 0.3));
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + r();
    parts.push(leafBlob([top[0] + Math.cos(a) * 2.3, 5.5, top[2] + Math.sin(a) * 2.3], 1.7, 0.7, lod ? 0 : 1, seed * 5 + k + 1, cols, 0.7, 0.3));
  }
  const strands = lod ? 22 : 46;
  for (let k = 0; k < strands; k++) {
    const a = (k / strands) * TAU + r() * 0.1;
    const rr = 2.6 + r() * 1.4;
    const x0 = top[0] + Math.cos(a) * rr, z0 = top[2] + Math.sin(a) * rr;
    const y0 = 5.6 + r() * 0.8, y1 = 0.9 + r() * 1.4;
    const pts = [], widths = [];
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      pts.push([x0 + Math.cos(a) * t * 0.5, y0 + (y1 - y0) * t, z0 + Math.sin(a) * t * 0.5]);
      widths.push(0.42 * (1 - t * 0.5));
    }
    parts.push(finish(ribbon(pts, widths, () => [-Math.sin(a), 0, Math.cos(a)]), (x, y) => _c.copy(cols[1]).lerp(cols[2], 1 - y / 7), (x, y) => 0.5 + 0.9 * (1 - y / 7)));
  }
  return merge(parts);
}

/** Liquid amber in autumn (~11 m): a conical crown in reds, oranges + golds. */
export function buildAmber(seed = 1, { lod = false } = {}) {
  const r = prand(seed);
  const parts = [limb([0, -0.1, 0], [0.1, 4.8, 0], 0.32, 0.22, lod ? 6 : 8, C("#5c4434"), 0)];
  const reds = [C("#8e2a1c"), C("#c9512a"), C("#f0a23a")];
  const n = lod ? 5 : 8;
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1);
    const a = k * 2.4 + r();
    const rad = (1 - t) * 1.9;
    const y = 4.4 + t * 6.2;
    const s = 2.1 * (1 - t * 0.55);
    const shade = r();
    const cols = shade < 0.33 ? [C("#7a2216"), C("#b8401f"), C("#e0702e")] : shade < 0.66 ? reds : [C("#a8541c"), C("#e39a2c"), C("#f6cf52")];
    parts.push(leafBlob([Math.cos(a) * rad, y, Math.sin(a) * rad], s, 0.85, lod ? 0 : 1, seed * 9 + k, cols, (x, yy) => 0.3 + 0.5 * (yy / 11), 0.3));
  }
  return merge(parts);
}

// ---------------------------------------------------------------------------
// CROPS (each ~one plant / clump, base at y = 0)
// ---------------------------------------------------------------------------
/**
 * A clump of ripe wheat as three crossed cards (the stalks + bearded ears are
 * the card's alpha cut-out — getFarmTextures().wheat), golden toward the top.
 */
export function buildWheat(seed = 1) {
  const r = prand(seed);
  const parts = [];
  for (let k = 0; k < 3; k++) {
    const w = 0.85 + r() * 0.2, h = 1.0 + r() * 0.2;
    const g = new THREE.PlaneGeometry(w, h, 1, 2);
    g.translate(0, h / 2 - 0.03, 0);
    g.rotateY((k / 3) * Math.PI + r() * 0.3);
    parts.push(finish(g, (x, y) => _c.set("#b08a3a").lerp(C("#ecd07c"), Math.min(1, y / h * 1.2)), (x, y) => y / h));
  }
  return merge(parts);
}
/** A corn (maize) plant ~2.1 m: stalk, arching leaves, tassel, a cob. */
export function buildCorn(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const H = 1.9 + r() * 0.4;
  parts.push(limb([0, 0, 0], [0.05, H, 0], 0.035, 0.018, 5, (x, y) => _c.set("#6f9a3a").lerp(C("#9bbf5a"), y / H), (x, y) => y / H));
  const nL = 7;
  for (let k = 0; k < nL; k++) {
    const a = k * 2.3 + r() * 0.4;
    const y0 = 0.35 + (k / nL) * (H - 0.6);
    const L = 0.75 - (k / nL) * 0.25;
    const pts = [], widths = [];
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      pts.push([Math.cos(a) * L * t, y0 + Math.sin(t * Math.PI * 0.55) * 0.32 - t * t * 0.42, Math.sin(a) * L * t]);
      widths.push(0.1 * Math.sin(Math.PI * (0.1 + t * 0.8)));
    }
    parts.push(finish(ribbon(pts, widths, () => [-Math.sin(a), 0.2, Math.cos(a)]), (x, y) => _c.set("#4f7f2c").lerp(C("#8fb84f"), Math.min(1, Math.hypot(x, 0) / L + 0.2)), (x, y) => 0.4 + y / H * 0.6));
  }
  for (let k = 0; k < 4; k++) {
    const a = k * 1.7;
    const pts = [[0.05, H, 0], [0.05 + Math.cos(a) * 0.12, H + 0.22, Math.sin(a) * 0.12], [0.05 + Math.cos(a) * 0.22, H + 0.3, Math.sin(a) * 0.22]];
    parts.push(finish(ribbon(pts, [0.03, 0.025, 0.015], () => [-Math.sin(a), 0, Math.cos(a)]), C("#d8b977"), 1));
  }
  const cob = new THREE.CylinderGeometry(0.045, 0.06, 0.26, 6);
  cob.rotateZ(0.5);
  cob.translate(0.1, H * 0.55, 0);
  parts.push(finish(cob, (x, y) => (y > H * 0.55 + 0.08 ? _c.set("#c9b46a") : _c.set("#7fa449")), 0.5));
  return merge(parts);
}
/** A sunflower ~1.9 m, its head facing +x (the farm's late sun). */
export function buildSunflower(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const H = 1.7 + r() * 0.35;
  parts.push(limb([0, 0, 0], [0.12, H, 0], 0.035, 0.025, 5, C("#5d8a33"), (x, y) => y / H));
  for (let k = 0; k < 4; k++) {
    const a = k * 1.9 + r();
    const y0 = 0.4 + k * 0.32;
    const pts = [[0, y0, 0], [Math.cos(a) * 0.18, y0 + 0.08, Math.sin(a) * 0.18], [Math.cos(a) * 0.36, y0 + 0.02, Math.sin(a) * 0.36]];
    parts.push(finish(ribbon(pts, [0.04, 0.2, 0.05], () => [-Math.sin(a), 0, Math.cos(a)]), C("#5f9036"), 0.5));
  }
  // Head: brown disc + a ring of yellow petals, tilted a little down.
  const head = new THREE.Group();
  const disc = new THREE.CircleGeometry(0.17, 12);
  const petals = [];
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * TAU;
    const p = new THREE.ConeGeometry(0.055, 0.2, 3);
    p.rotateZ(-Math.PI / 2);
    p.translate(0.25, 0, 0);
    p.rotateZ(a);
    petals.push(p);
  }
  const tilt = new THREE.Matrix4().makeRotationY(Math.PI / 2).premultiply(new THREE.Matrix4().makeRotationZ(-0.3));
  const place = (g) => { g.applyMatrix4(tilt); g.translate(0.16, H + 0.05, 0); return g; };
  parts.push(finish(place(disc), (x, y, z) => _c.set("#4a2e18").lerp(C("#7a4a22"), vnoise3(y * 30, z * 30, seed)), 1));
  const back = new THREE.CircleGeometry(0.19, 12);
  back.rotateY(Math.PI);
  back.translate(0, 0, -0.01);
  parts.push(finish(place(back), C("#4f7a2a"), 1));
  petals.forEach((p) => parts.push(finish(place(p), (x, y) => _c.set("#f2b81a").lerp(C("#ffd84a"), 0.5), 1)));
  void head;
  return merge(parts);
}
/** A pumpkin on its vine: ribbed orange body, stalk, a couple of big leaves. */
export function buildPumpkin(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const g = new THREE.SphereGeometry(0.34, 14, 9);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const k = 1 + 0.08 * Math.cos(a * 8);
    p.setXYZ(i, x * k, y * 0.72, z * k);
  }
  g.computeVertexNormals();
  g.translate(0, 0.22, 0);
  const orange = r() < 0.2 ? C("#e3c54a") : C("#e2741f");
  parts.push(finish(g, (x, y, z) => _c.copy(orange).multiplyScalar(0.8 + 0.3 * (0.5 + 0.5 * Math.cos(Math.atan2(z, x) * 8))), 0));
  parts.push(limb([0, 0.44, 0], [0.04, 0.58, 0.02], 0.03, 0.02, 5, C("#6b6a2a"), 0));
  for (let k = 0; k < 3; k++) {
    const a = r() * TAU;
    const lf = new THREE.CircleGeometry(0.28, 7);
    lf.rotateX(-Math.PI / 2 + 0.25);
    lf.translate(0.42, 0.06, 0);
    lf.rotateY(a);
    parts.push(finish(lf, C("#4f7f30"), 0.3));
  }
  return merge(parts);
}
/** A lavender bush: grey-green stalks with purple spikes. */
export function buildLavender(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const base = blob(0.32, 1.2, 0.5, 1.2, 1, seed, 0.2);
  base.translate(0, 0.14, 0);
  parts.push(finish(base, C("#6f8a6a"), 0.2));
  for (let k = 0; k < 10; k++) {
    const a = r() * TAU, d = r() * 0.32;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const h = 0.48 + r() * 0.22;
    const pts = [[x * 0.4, 0.2, z * 0.4], [x * 0.8, h * 0.7, z * 0.8], [x, h, z]];
    parts.push(finish(ribbon(pts, [0.015, 0.012, 0.01], () => [Math.cos(a + 1.5), 0, Math.sin(a + 1.5)]), C("#7f9a74"), (xx, y) => y / h));
    const spike = new THREE.CylinderGeometry(0.018, 0.028, 0.14, 4);
    spike.translate(x, h + 0.06, z);
    parts.push(finish(spike, (xx, y) => _c.set("#6b4fb8").lerp(C("#a184e0"), vnoise3(xx * 20, y * 20, seed)), 1));
  }
  return merge(parts);
}
/** A cabbage: blue-green head in cupped outer leaves. */
export function buildCabbage(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const head = blob(0.17, 1, 0.85, 1, 1, seed, 0.12);
  head.translate(0, 0.16, 0);
  parts.push(finish(head, (x, y) => _c.set("#8fb69a").lerp(C("#c4dcc0"), y / 0.3), 0.1));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU + r() * 0.4;
    const pts = [[0, 0.04, 0], [Math.cos(a) * 0.2, 0.12, Math.sin(a) * 0.2], [Math.cos(a) * 0.3, 0.26, Math.sin(a) * 0.3]];
    parts.push(finish(ribbon(pts, [0.06, 0.24, 0.16], () => [-Math.sin(a), 0, Math.cos(a)]), C("#6f9f86"), 0.3));
  }
  return merge(parts);
}
/** A lettuce rosette. */
export function buildLettuce(seed = 1) {
  const r = prand(seed);
  const parts = [];
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * TAU + r() * 0.3;
    const L = 0.18 + r() * 0.06;
    const pts = [[0, 0.02, 0], [Math.cos(a) * L * 0.6, 0.12, Math.sin(a) * L * 0.6], [Math.cos(a) * L, 0.18 + r() * 0.05, Math.sin(a) * L]];
    parts.push(finish(ribbon(pts, [0.05, 0.16, 0.14], () => [-Math.sin(a), 0.3, Math.cos(a)]), (x, y) => _c.set("#7fc04a").lerp(C("#c5e57a"), y / 0.22), 0.3));
  }
  return merge(parts);
}
/** Carrot tops: feathery fronds + an orange shoulder peeking out. */
export function buildCarrotTops(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const sh = new THREE.ConeGeometry(0.035, 0.08, 6);
  sh.rotateX(Math.PI);
  sh.translate(0, 0.02, 0);
  parts.push(finish(sh, C("#e8792a"), 0));
  for (let k = 0; k < 6; k++) {
    const a = r() * TAU;
    const h = 0.26 + r() * 0.12;
    const pts = [[0, 0.04, 0], [Math.cos(a) * 0.05, h * 0.6, Math.sin(a) * 0.05], [Math.cos(a) * 0.12, h, Math.sin(a) * 0.12]];
    parts.push(finish(ribbon(pts, [0.02, 0.07, 0.03], () => [-Math.sin(a), 0, Math.cos(a)]), C("#5c9a34"), (x, y) => y / h));
  }
  return merge(parts);
}
/** One metre of grapevine along +x on its trellis wire, with bunches. */
export function buildVine(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const wire = new THREE.BoxGeometry(1.02, 0.015, 0.015);
  wire.translate(0, 1.15, 0);
  parts.push(finish(wire, C("#6b6b6b"), 0));
  for (let k = 0; k < 3; k++) {
    const x = -0.33 + k * 0.33 + (r() - 0.5) * 0.1;
    parts.push(leafBlob([x, 1.12 + (r() - 0.5) * 0.12, 0], 0.3, 0.9, 1, seed * 3 + k, [C("#3d6a26"), C("#5d9436"), C("#9cc960")], 0.4, 0.3));
  }
  for (let k = 0; k < 2; k++) {
    const b = new THREE.ConeGeometry(0.07, 0.18, 6);
    b.rotateX(Math.PI);
    b.translate(-0.25 + k * 0.5 + (r() - 0.5) * 0.1, 0.88, (r() < 0.5 ? -1 : 1) * 0.16);
    parts.push(finish(b, C("#5a2a5e"), 0.3));
  }
  // The trunk every metre.
  parts.push(limb([0, 0, 0], [0.04, 1.12, 0], 0.035, 0.025, 5, C("#5a4232"), 0));
  return merge(parts);
}
export function buildVinePost() {
  const g = new THREE.BoxGeometry(0.09, 1.55, 0.09);
  g.translate(0, 0.72, 0);
  return merge([finish(g, (x, y) => _c.set("#7d6550").lerp(C("#9a8268"), y / 1.5), 0)]);
}

// ---------------------------------------------------------------------------
// HAY
// ---------------------------------------------------------------------------
/** A round bale lying on its side (axis along x), r 0.75 × 1.25 long. */
export function buildRoundBale() {
  const g = new THREE.CylinderGeometry(0.75, 0.75, 1.25, 18, 2, false);
  g.rotateZ(Math.PI / 2);
  g.translate(0, 0.72, 0);
  return merge([finish(g, (x, y, z, nx) => {
    if (Math.abs(nx) > 0.9) {
      // The end faces: a spiral of rolled hay.
      const rr = Math.hypot(y - 0.72, z);
      const ang = Math.atan2(z, y - 0.72);
      const sp = 0.5 + 0.5 * Math.sin(rr * 26 + ang);
      return _c.set("#b8913f").lerp(C("#e0c06a"), sp * 0.8);
    }
    const n = vnoise3(x * 6, y * 9, z * 9);
    return _c.set("#c9a24a").lerp(C("#e8cd78"), n).multiplyScalar(y > 1.1 ? 0.92 : 1);
  }, 0)]);
}
/** A small square bale 1.1 × 0.5 × 0.5 (long along x) with two twine bands. */
export function buildSquareBale() {
  const parts = [];
  const b = new THREE.BoxGeometry(1.1, 0.5, 0.5, 4, 2, 2);
  b.translate(0, 0.25, 0);
  parts.push(finish(b, (x, y, z) => _c.set("#d2aa50").lerp(C("#ead07e"), vnoise3(x * 8, y * 8, z * 8)), 0));
  for (const o of [-0.28, 0.28]) {
    const t = new THREE.BoxGeometry(0.03, 0.515, 0.515);
    t.translate(o, 0.25, 0);
    parts.push(finish(t, C("#6a4e2a"), 0));
  }
  return merge(parts);
}

// ---------------------------------------------------------------------------
// FENCES (unit pieces, instanced along the fence lines)
// ---------------------------------------------------------------------------
/** A split-timber fence post, base at y = 0 (top at ~1.15). */
export function buildFencePost() {
  const g = new THREE.BoxGeometry(0.14, 1.3, 0.14);
  g.translate(0, 0.5, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 1.1 && p.getX(i) > 0) p.setY(i, p.getY(i) - 0.07); // slanted top
  g.computeVertexNormals();
  return merge([finish(g, (x, y, z) => _c.set("#6f6152").lerp(C("#9b8b76"), vnoise3(x * 9, y * 3, z * 9)), 0)]);
}
/** A rail: unit length along x, centred at the origin. */
export function buildRail() {
  const g = new THREE.BoxGeometry(1, 0.11, 0.065);
  return merge([finish(g, (x, y, z) => _c.set("#8c7a64").lerp(C("#a99780"), vnoise3(x * 5, y * 20, z * 20)), 0)]);
}
/** A white picket (pointed top), base at y = 0. */
export function buildPicket() {
  const s = new THREE.Shape();
  s.moveTo(-0.045, 0); s.lineTo(0.045, 0); s.lineTo(0.045, 0.82); s.lineTo(0, 0.92); s.lineTo(-0.045, 0.82); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.025, bevelEnabled: false });
  g.translate(0, -0.05, -0.0125);
  return merge([finish(g, (x, y) => _c.set("#e9e7de").lerp(C("#ffffff"), y), 0)]);
}
/** One metre of dry-stone wall along x (≈ 0.85 m high, 0.6 wide; textured with getFarmTextures().drystone). */
export function buildStoneWall(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const core = new THREE.BoxGeometry(1.0, 0.72, 0.58, 2, 1, 1);
  // Batter: narrower at the top.
  const p = core.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setZ(i, p.getZ(i) * 0.78);
  core.computeVertexNormals();
  core.translate(0, 0.36, 0);
  parts.push(finish(core, (x, y, z) => _c.setRGB(1, 1, 1).multiplyScalar(0.9 + 0.15 * vnoise3(x * 3 + seed, y * 3, z * 3)), 0));
  // Coping stones on edge along the top (mossy tops).
  for (let k = 0; k < 4; k++) {
    const st = new THREE.BoxGeometry(0.2, 0.2, 0.44);
    st.rotateX((r() - 0.5) * 0.25);
    st.rotateZ((r() - 0.5) * 0.45);
    st.translate(-0.375 + k * 0.25, 0.8, 0);
    parts.push(finish(st, (xx, yy) => (yy > 0.86 ? _c.set("#93a46a") : _c.set("#b7b09a")), 0));
  }
  return merge(parts);
}

// ---------------------------------------------------------------------------
// ANIMALS — each species = BODY + HEAD (pivot at the neck) + one LEG (pivot
// at the hip, hanging down). Facing +z. Built for instancing.
// ---------------------------------------------------------------------------
function boxAt(w, h, d, x, y, z, colorFn, rot = null) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rot) g.rotateX(rot);
  g.translate(x, y, z);
  return finish(g, colorFn, 0);
}
export const ANIMAL_RIGS = {
  holstein: { legs: [[-0.3, 0.66, -0.52], [0.3, 0.66, -0.52], [-0.3, 0.66, 0.5], [0.3, 0.66, 0.5]], neck: [0, 1.05, 0.72], legLen: 0.66 },
  hereford: { legs: [[-0.3, 0.62, -0.5], [0.3, 0.62, -0.5], [-0.3, 0.62, 0.48], [0.3, 0.62, 0.48]], neck: [0, 1.0, 0.7], legLen: 0.62 },
  sheep: { legs: [[-0.2, 0.42, -0.36], [0.2, 0.42, -0.36], [-0.2, 0.42, 0.36], [0.2, 0.42, 0.36]], neck: [0, 0.72, 0.5], legLen: 0.42 },
  pig: { legs: [[-0.2, 0.26, -0.32], [0.2, 0.26, -0.32], [-0.2, 0.26, 0.32], [0.2, 0.26, 0.32]], neck: [0, 0.48, 0.5], legLen: 0.26 },
  chook: { legs: [[-0.06, 0.16, 0], [0.06, 0.16, 0]], neck: [0, 0.34, 0.1], legLen: 0.16 },
};
export function buildAnimalParts(kind) {
  if (kind === "holstein" || kind === "hereford") {
    const holstein = kind === "holstein";
    const coat = (x, y, z) => {
      if (holstein) return vnoise3(x * 2.6 + 3, y * 2.6, z * 2.6) > 0.55 ? _c.set("#262422") : _c.set("#f2efe6");
      // Hereford: red-brown with a white belly + white legs.
      return y < 0.78 ? _c.set("#efe8dc") : _c.set("#8a3a1e").lerp(C("#a14a26"), vnoise3(x * 3, y * 3, z * 3));
    };
    const body = merge([
      boxAt(0.92, 0.62, 1.5, 0, 1.0, 0, coat),
      boxAt(0.8, 0.28, 1.2, 0, 0.66, 0, coat),
      boxAt(0.86, 0.5, 0.42, 0, 1.06, 0.62, coat),
      ...(holstein ? [boxAt(0.32, 0.18, 0.36, 0, 0.58, -0.3, C("#e9a9a4"))] : []),
      boxAt(0.06, 0.62, 0.06, 0, 0.82, -0.78, C(holstein ? "#2a2826" : "#7a321a"), 0.18),
      boxAt(0.12, 0.14, 0.12, 0, 0.5, -0.83, C("#3a3430")),
    ]);
    // Head (pivot at the neck): skull, muzzle, ears, horns / a white face.
    const head = merge([
      boxAt(0.44, 0.42, 0.5, 0, 0.0, 0.26, (x, y, z) => (holstein ? (vnoise3(x * 4, y * 4, z * 4 + 7) > 0.6 ? _c.set("#262422") : _c.set("#f2efe6")) : _c.set("#f3ece0"))),
      boxAt(0.36, 0.28, 0.2, 0, -0.1, 0.56, C(holstein ? "#e3a8a2" : "#d8b3a5")),
      boxAt(0.2, 0.1, 0.14, -0.3, 0.12, 0.2, C(holstein ? "#262422" : "#8a3a1e")),
      boxAt(0.2, 0.1, 0.14, 0.3, 0.12, 0.2, C(holstein ? "#262422" : "#8a3a1e")),
      ...(holstein ? [] : [boxAt(0.06, 0.06, 0.22, -0.22, 0.26, 0.16, C("#e8e0c8"), -0.6), boxAt(0.06, 0.06, 0.22, 0.22, 0.26, 0.16, C("#e8e0c8"), -0.6)]),
      boxAt(0.05, 0.05, 0.02, -0.14, 0.06, 0.52, C("#111111")),
      boxAt(0.05, 0.05, 0.02, 0.14, 0.06, 0.52, C("#111111")),
    ]);
    const L = ANIMAL_RIGS[kind].legLen;
    const leg = merge([boxAt(0.15, L, 0.15, 0, -L / 2, 0, (x, y) => (y < -L + 0.1 ? _c.set("#2a2420") : holstein ? _c.set("#f2efe6") : _c.set("#efe8dc")))]);
    return { body, head, leg };
  }
  if (kind === "sheep") {
    const wool = blob(0.5, 1.05, 0.78, 1.32, 1, 5, 0.35);
    wool.translate(0, 0.72, 0);
    const body = merge([
      finish(wool, (x, y, z) => _c.set("#e9e3d2").lerp(C("#fbf8ee"), vnoise3(x * 6, y * 6, z * 6)), 0),
      boxAt(0.08, 0.2, 0.08, 0, 0.72, -0.66, C("#ece6d6")),
    ]);
    const poll = blob(0.16, 1.2, 0.8, 1, 0, 3, 0.25);
    poll.translate(0, 0.14, 0.14);
    const head = merge([
      boxAt(0.24, 0.28, 0.36, 0, 0, 0.24, C("#2c2826")),
      finish(poll, C("#f3eee0"), 0),
      boxAt(0.2, 0.07, 0.1, -0.18, 0.08, 0.16, C("#2c2826")),
      boxAt(0.2, 0.07, 0.1, 0.18, 0.08, 0.16, C("#2c2826")),
    ]);
    const L = ANIMAL_RIGS.sheep.legLen;
    const leg = merge([boxAt(0.08, L, 0.08, 0, -L / 2, 0, C("#2c2826"))]);
    return { body, head, leg };
  }
  if (kind === "pig") {
    const b = blob(0.36, 0.95, 0.82, 1.45, 1, 7, 0.08);
    b.translate(0, 0.48, 0);
    const pink = (x, y, z) => _c.set("#eaa3b2").lerp(C("#f4c0c9"), y > 0.6 ? 0.5 : 0.1).multiplyScalar(0.92 + 0.12 * vnoise3(x * 5, y * 5, z * 5));
    const tail = new THREE.TorusGeometry(0.06, 0.02, 5, 10);
    tail.translate(0, 0.56, -0.52);
    const body = merge([finish(b, pink, 0), finish(tail, C("#eaa3b2"), 0)]);
    const snout = new THREE.CylinderGeometry(0.11, 0.12, 0.1, 10);
    snout.rotateX(Math.PI / 2);
    snout.translate(0, -0.04, 0.38);
    const ear = (s) => { const e = new THREE.ConeGeometry(0.08, 0.16, 4); e.rotateX(0.5); e.translate(s * 0.13, 0.17, 0.12); return finish(e, C("#df8fa1"), 0); };
    const head = merge([
      boxAt(0.36, 0.32, 0.34, 0, 0, 0.18, pink),
      finish(snout, C("#df8fa1"), 0),
      ear(-1), ear(1),
      boxAt(0.04, 0.04, 0.02, -0.09, 0.07, 0.36, C("#1a1a1a")),
      boxAt(0.04, 0.04, 0.02, 0.09, 0.07, 0.36, C("#1a1a1a")),
    ]);
    const L = ANIMAL_RIGS.pig.legLen;
    const leg = merge([boxAt(0.1, L, 0.1, 0, -L / 2, 0, (x, y) => (y < -L + 0.06 ? _c.set("#7a5560") : _c.set("#eaa3b2")))]);
    return { body, head, leg };
  }
  if (kind === "chook") {
    const b = blob(0.17, 1, 0.95, 1.25, 1, 9, 0.1);
    b.translate(0, 0.3, -0.02);
    const tail = new THREE.ConeGeometry(0.08, 0.2, 5);
    tail.rotateX(-0.9);
    tail.translate(0, 0.42, -0.2);
    const body = merge([
      finish(b, (x, y, z) => _c.set("#9a5428").lerp(C("#c47a3c"), vnoise3(x * 12, y * 12, z * 12)), 0),
      finish(tail, C("#3a2a1e"), 0),
    ]);
    const skull = blob(0.08, 1, 1.1, 1, 0, 2, 0.05);
    skull.translate(0, 0.06, 0.06);
    const beak = new THREE.ConeGeometry(0.025, 0.07, 4);
    beak.rotateX(Math.PI / 2);
    beak.translate(0, 0.05, 0.15);
    const head = merge([
      finish(skull, C("#a65e2c"), 0),
      boxAt(0.02, 0.06, 0.08, 0, 0.15, 0.06, C("#d22a22")),
      boxAt(0.02, 0.05, 0.03, 0, 0.0, 0.11, C("#d22a22")),
      finish(beak, C("#e8b230"), 0),
    ]);
    const L = ANIMAL_RIGS.chook.legLen;
    const leg = merge([boxAt(0.02, L, 0.02, 0, -L / 2, 0, C("#e0a630"))]);
    return { body, head, leg };
  }
  return null;
}
/** A mallard duck floating (water line at y = 0). */
export function buildDuck(seed = 1) {
  const drake = seed % 2 === 1;
  const parts = [];
  const b = blob(0.17, 1, 0.7, 1.45, 1, seed, 0.06);
  b.translate(0, 0.05, 0);
  parts.push(finish(b, (x, y, z) => (drake ? (z > 0.12 ? _c.set("#7a4a30") : _c.set("#d8d4cc").lerp(C("#9a958c"), y < 0.02 ? 0.4 : 0)) : _c.set("#8a6a48").lerp(C("#b08a5e"), vnoise3(x * 15, y * 15, z * 15))), 0));
  const tail = new THREE.ConeGeometry(0.06, 0.12, 4);
  tail.rotateX(-1.2);
  tail.translate(0, 0.1, -0.24);
  parts.push(finish(tail, C(drake ? "#222222" : "#7a5a3a"), 0));
  const head = blob(0.085, 1, 1.05, 1.15, 0, seed + 3, 0.05);
  head.translate(0, 0.26, 0.2);
  parts.push(finish(head, C(drake ? "#1d6b3a" : "#8a6a48"), 0));
  const bill = new THREE.BoxGeometry(0.06, 0.025, 0.1);
  bill.translate(0, 0.24, 0.3);
  parts.push(finish(bill, C(drake ? "#e5c43a" : "#d08a3a"), 0));
  return merge(parts);
}
/** A wild rabbit sitting up (hops as a whole). */
export function buildRabbit(seed = 1) {
  const parts = [];
  const b = blob(0.13, 1, 0.95, 1.3, 1, seed, 0.1);
  b.translate(0, 0.14, 0);
  const fur = (x, y, z) => _c.set("#8a7560").lerp(C("#b09a80"), vnoise3(x * 14, y * 14, z * 14));
  parts.push(finish(b, fur, 0));
  const head = blob(0.08, 1, 1, 1.15, 0, seed + 1, 0.05);
  head.translate(0, 0.25, 0.13);
  parts.push(finish(head, fur, 0));
  for (const s of [-1, 1]) {
    const ear = new THREE.BoxGeometry(0.03, 0.15, 0.05);
    ear.rotateZ(s * 0.2);
    ear.translate(s * 0.035, 0.38, 0.1);
    parts.push(finish(ear, C("#9a8268"), 0));
  }
  const tail = new THREE.IcosahedronGeometry(0.045, 0);
  tail.translate(0, 0.14, -0.17);
  parts.push(finish(tail, C("#f4f0e8"), 0));
  return merge(parts);
}

export { buildBush };
