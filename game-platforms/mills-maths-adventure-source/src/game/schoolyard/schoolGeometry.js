/**
 * PLAYGROUND PLANTS — procedural geometry for the Coffs Coast school's trees
 * + garden plants (no model files), on the jungle's contract: ONE merged
 * BufferGeometry per kind with position · normal · uv · color · aSway, drawn
 * instanced with the shared foliage material.
 *
 *   buildFig          the quad's huge Hill's figs: buttressed grey trunks +
 *                     a broad dark-green dome of a crown
 *   buildNorfolk      Norfolk Island pines: a straight trunk with level
 *                     tiers of bushy branch-pads (the coast's skyline)
 *   buildJacaranda    a broadleaf in October purple
 *   buildPaperbark    papery cream trunk, soft grey-green crown
 *   buildBangalow     a Bangalow palm (smooth ringed trunk, arching fronds)
 *   buildTreeFern     a furry trunk crowned with fern fronds
 *   buildFrangipani   candelabra branches tipped with leaves + white flowers
 *   buildBanana       a banana plant (green stem, huge paddle leaves)
 *   buildCordyline    red "ti" rosettes (the photos' burgundy cordylines)
 *   buildLomandra     a strappy tussock
 *   buildAgapanthus   strappy leaves + blue flower balls on stalks
 *   buildHedge        a clipped hedge block
 */
import * as THREE from "three";
import { finish, merge, blob, ribbon, prand, vnoise3, hash3, buildBroadleaf, buildPalmTrunk, buildPalmFronds, buildFern, buildBigLeaf } from "../jungle/jungleGeometry.js";
import { buildGum } from "../farm/farmGeometry.js";

const TAU = Math.PI * 2;
const C = (hex) => new THREE.Color(hex);
const _c = new THREE.Color();

function limb(a, b, r0, r1, segs, colorFn, swayFn = 0) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r1, r0, len, segs, 1, true);
  g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
  g.translate(A.x, A.y, A.z);
  return finish(g, colorFn, swayFn);
}
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
/** Recolour a built tree: canopy (aSway ≥ cut) via fn(leaf colour) → colour. */
function recolour(geo, { leaf, bark, cut = 0.5 }) {
  const col = geo.attributes.color, sw = geo.attributes.aSway, pos = geo.attributes.position;
  for (let i = 0; i < col.count; i++) {
    _c.setRGB(col.getX(i), col.getY(i), col.getZ(i));
    const isLeaf = sw.getX(i) >= cut;
    const f = isLeaf ? leaf : bark;
    if (!f) continue;
    f(_c, pos.getX(i), pos.getY(i), pos.getZ(i));
    col.setXYZ(i, _c.r, _c.g, _c.b);
  }
  col.needsUpdate = true;
  return geo;
}

// ---------------------------------------------------------------------------
// THE FIG — a Hill's fig (~18 m, crown ~20 m across).
// ---------------------------------------------------------------------------
const FIG_LEAF = [C("#1f4a1f"), C("#3c7a2c"), C("#78b04c")];
export function buildFig(seed = 1, { lod = false } = {}) {
  const r = prand(seed);
  const parts = [];
  const bark = (x, y, z) => {
    const n = vnoise3(x * 1.6 + seed, y * 0.7, z * 1.6);
    _c.set("#8f8a7d").lerp(C("#6a645a"), n * 0.7);
    if (y < 0.6) _c.lerp(C("#5a5248"), 0.5);
    return _c;
  };
  // A thick trunk with flared buttress roots (the photos' big grey bole).
  parts.push(limb([0, -0.3, 0], [0.2, 5.5, 0.1], 1.25, 0.85, lod ? 7 : 12, bark, (x, y) => Math.max(0, y / 18 - 0.25) * 0.3));
  if (!lod) {
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU + r() * 0.5;
      const fin = new THREE.BoxGeometry(0.3, 2.2, 2.4);
      fin.translate(0, 0.9, 1.0);
      const p = fin.attributes.position;
      for (let i = 0; i < p.count; i++) if (p.getY(i) > 1.2) p.setZ(i, p.getZ(i) * 0.3);
      fin.rotateY(a);
      parts.push(finish(fin, C("#7b756a"), 0));
    }
  }
  // Big limbs spreading out into the crown.
  const ends = [];
  for (let k = 0; k < (lod ? 4 : 6); k++) {
    const a = (k / (lod ? 4 : 6)) * TAU + r() * 0.6;
    const rr = 4.5 + r() * 2.5;
    const end = [Math.cos(a) * rr, 9 + r() * 2.5, Math.sin(a) * rr];
    parts.push(limb([0.2, 5, 0.1], end, 0.55, 0.22, lod ? 5 : 7, bark, (x, y) => Math.max(0, y / 18 - 0.25) * 0.5));
    ends.push(end);
  }
  // The crown: a broad dome of overlapping blobs.
  const blobs = [[0, 13.2, 0, 5.2]];
  for (const e of ends) blobs.push([e[0] * 1.25, e[1] + 1.6, e[2] * 1.25, 4.2 + r() * 0.8]);
  for (let k = 0; k < (lod ? 3 : 6); k++) {
    const a = (k / 6) * TAU + 0.5 + r();
    blobs.push([Math.cos(a) * 3.2, 15 + r() * 1.2, Math.sin(a) * 3.2, 3.6 + r() * 0.6]);
  }
  blobs.forEach(([x, y, z, s], k) => parts.push(leafBlob([x, y, z], s, 0.62, lod ? 0 : 1, seed * 13 + k, FIG_LEAF, (xx, yy) => 0.5 + Math.min(0.5, (yy - 8) / 14), 0.3)));
  return merge(parts);
}

// ---------------------------------------------------------------------------
// NORFOLK ISLAND PINE (~24 m): level tiers of bushy pads.
// ---------------------------------------------------------------------------
export function buildNorfolk(seed = 1, { lod = false, far = false } = {}) {
  if (far) lod = true;
  const r = prand(seed);
  const H = 24;
  const parts = [];
  const bark = (x, y) => _c.set("#6e5340").lerp(C("#4e3a2c"), y < 1 ? 1 - y : 0);
  parts.push(limb([0, -0.3, 0], [0, H, 0], 0.55, 0.06, far ? 5 : 8, bark, (x, y) => (y / H) * 0.25));
  const D = C("#1d4a2a"), M = C("#2f6b3a"), L = C("#5c9a58");
  const tiers = far ? 6 : lod ? 9 : 12;
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const y = 4.5 + t * (H - 5.2);
    const len = 4.4 * (1 - t * 0.82) + 0.4;
    if (far) {
      const cone = new THREE.ConeGeometry(len, 1.6, 7, 1, true);
      cone.translate(0, y + 0.4, 0);
      parts.push(finish(cone, (x, yy, z, nx, ny) => _c.copy(M).lerp(L, ny > 0.2 ? 0.4 : 0), (x, yy) => (yy / H) * 0.5));
      continue;
    }
    const n = lod ? 4 : 5 + (i % 2);
    const rot = r() * TAU;
    for (let k = 0; k < n; k++) {
      const a = rot + (k / n) * TAU;
      // A horizontal branch with a bushy, upturned pad along it.
      if (!lod) parts.push(limb([0, y, 0], [Math.cos(a) * len, y + 0.25, Math.sin(a) * len], 0.09, 0.03, 4, bark, 0.4));
      const pad = blob(1, 1, 0.35, 1, lod ? 0 : 1, seed * 7 + i * 13 + k, 0.25);
      pad.scale(len * 0.55, 0.9, 0.85 * (1 - t * 0.4) + 0.3);
      pad.rotateY(-a);
      pad.translate(Math.cos(a) * len * 0.55, y + 0.35, Math.sin(a) * len * 0.55);
      parts.push(finish(pad, (x, yy, z, nx, ny) => {
        _c.copy(D).lerp(M, Math.min(1, Math.hypot(x, z) / len));
        if (ny > 0.25) _c.lerp(L, (ny - 0.25) * 0.7);
        return _c;
      }, (x, yy) => 0.35 + (yy / H) * 0.6));
    }
  }
  // The pointed leader.
  const tip = new THREE.ConeGeometry(0.5, 2.2, 6, 1, true);
  tip.translate(0, H - 0.4, 0);
  parts.push(finish(tip, M, 0.9));
  return merge(parts);
}

// ---------------------------------------------------------------------------
export function buildJacaranda(seed = 1, { lod = false } = {}) {
  const g = buildBroadleaf(seed, { height: 9, spread: 1.15, lod });
  const P0 = C("#6c4aa8"), P1 = C("#9a78d6"), P2 = C("#c3a9ec");
  return recolour(g, {
    leaf: (c, x, y, z) => {
      const n = vnoise3(x * 0.9, y * 0.9, z * 0.9);
      const l = c.r * 0.3 + c.g * 0.59 + c.b * 0.11; // luminance of the green
      c.copy(P0).lerp(P1, Math.min(1, l * 1.6)).lerp(P2, n > 0.62 ? 0.5 : 0);
      // A few green leaves showing through.
      if (n < 0.2) c.lerp(C("#5c8a3c"), 0.6);
    },
    bark: (c) => c.multiplyScalar(0.85),
  });
}
export function buildPaperbark(seed = 1, { lod = false } = {}) {
  const g = buildGum(seed, { height: 11, lod });
  return recolour(g, {
    leaf: (c) => c.lerp(C("#9bb08a"), 0.35),
    bark: (c, x, y, z) => c.set("#efe8d8").lerp(C("#cbbfa6"), vnoise3(x * 3, y * 1.5, z * 3) * 0.6),
  });
}
export function buildBangalow(seed = 1) {
  const trunk = buildPalmTrunk(seed, { height: 9.5, lean: 0.06 });
  const top = trunk.userData.top;
  recolour(trunk, { leaf: null, bark: (c, x, y) => c.set(Math.floor(y / 0.35) % 2 ? "#9aa08c" : "#b4b8a4"), cut: 2 });
  const fronds = buildPalmFronds(seed + 2, top);
  recolour(fronds, { leaf: (c) => c.lerp(C("#5d9a3a"), 0.25), cut: 0 });
  // The green crownshaft below the fronds.
  const shaft = new THREE.CylinderGeometry(0.2, 0.26, 1.4, 8, 1, true);
  shaft.translate(top[0], top[1] - 0.6, top[2]);
  const g = merge([trunk, fronds, finish(shaft, C("#5f8f3f"), 0.35)]);
  return g;
}
export function buildTreeFern(seed = 1) {
  const r = prand(seed);
  const H = 3.2 + r() * 0.8;
  const trunk = limb([0, -0.2, 0], [(r() - 0.5) * 0.4, H, (r() - 0.5) * 0.4], 0.28, 0.22, 8, (x, y, z) => _c.set("#4a3324").lerp(C("#6b4a30"), vnoise3(x * 6, y * 4, z * 6) * 0.6), 0.1);
  const crown = buildFern(seed);
  crown.scale(2.3, 1.6, 2.3);
  crown.translate(0, H, 0);
  return merge([trunk, crown]);
}
export function buildFrangipani(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const bark = () => _c.set("#8a8278");
  parts.push(limb([0, -0.1, 0], [0, 1.4, 0], 0.18, 0.15, 7, bark, 0));
  const leaf = [C("#2f6a2a"), C("#4f8f3a"), C("#7fbf5a")];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU + r() * 0.5;
    const mid = [Math.cos(a) * 0.9, 2.4, Math.sin(a) * 0.9];
    const end = [Math.cos(a) * 1.7, 3.3 + r() * 0.5, Math.sin(a) * 1.7];
    parts.push(limb([0, 1.4, 0], mid, 0.12, 0.09, 6, bark, 0.2));
    parts.push(limb(mid, end, 0.09, 0.06, 6, bark, 0.4));
    parts.push(leafBlob(end, 0.8, 0.55, 1, seed * 5 + k, leaf, 0.8, 0.35));
    // Clusters of white + yellow flowers.
    for (let j = 0; j < 4; j++) {
      const f = new THREE.SphereGeometry(0.075, 6, 4);
      f.scale(1, 0.45, 1);
      f.translate(end[0] + (r() - 0.5) * 0.9, end[1] + 0.35 + r() * 0.2, end[2] + (r() - 0.5) * 0.9);
      parts.push(finish(f, j % 2 ? C("#fff8e8") : C("#ffe27a"), 0.85));
    }
  }
  return merge(parts);
}
export function buildBanana(seed = 1) {
  const r = prand(seed);
  const parts = [];
  const stem = limb([0, -0.1, 0], [0, 2.6, 0], 0.2, 0.15, 8, () => _c.set("#7d9a4a"), 0.1);
  parts.push(stem);
  const G0 = C("#3d7a2a"), G1 = C("#8cc251"), BROWN = C("#8a7a46");
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU + r() * 0.4;
    const L = 2.2 + r() * 0.8;
    const pts = [], widths = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      pts.push([Math.cos(a) * t * L, 2.5 + Math.sin(t * Math.PI * 0.55) * 0.9 - t * t * 1.0, Math.sin(a) * t * L]);
      widths.push(0.08 + 0.75 * Math.sin(Math.PI * (0.08 + t * 0.85)));
    }
    const rb = ribbon(pts, widths, () => [-Math.sin(a), 0.1, Math.cos(a)]);
    const dead = k === 6;
    parts.push(finish(rb, (x, y, z) => (dead ? _c.copy(BROWN) : _c.copy(G0).lerp(G1, Math.min(1, Math.hypot(x, z) / L))), (x, y, z) => 0.3 + Math.min(0.7, (Math.hypot(x, z) / L) * 0.7)));
  }
  return merge(parts);
}

// ---------------------------------------------------------------------------
// GARDEN PLANTS
// ---------------------------------------------------------------------------
function strappy(seed, { n = 14, len = 0.9, w = 0.07, rise = 0.8, cols, droop = 0.5, stem = 0 }) {
  const r = prand(seed);
  const parts = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + r() * 0.4;
    const L = len * (0.7 + r() * 0.5);
    const up = rise * (0.6 + r() * 0.6);
    const pts = [], widths = [];
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      pts.push([Math.cos(a) * t * L * 0.6, stem + up * Math.sin(t * Math.PI * 0.55) - t * t * droop * L * 0.4, Math.sin(a) * t * L * 0.6]);
      widths.push(w * (1 - t * 0.7));
    }
    const rb = ribbon(pts, widths, () => [-Math.sin(a), 0.2, Math.cos(a)]);
    parts.push(finish(rb, (x, y) => _c.copy(cols[0]).lerp(cols[1], Math.min(1, (y - stem) / Math.max(0.2, up))), (x, y) => Math.min(1, (y - stem) / Math.max(0.2, up))));
  }
  return parts;
}
export function buildCordyline(seed = 1) {
  const parts = strappy(seed, { n: 16, len: 1.0, w: 0.12, rise: 0.75, cols: [C("#4a1424"), C("#b83a52")], droop: 0.6, stem: 0.5 });
  const stem = new THREE.CylinderGeometry(0.05, 0.07, 0.6, 5, 1, true);
  stem.translate(0, 0.3, 0);
  parts.push(finish(stem, C("#5a4030"), 0));
  return merge(parts);
}
export function buildLomandra(seed = 1) {
  return merge(strappy(seed, { n: 22, len: 0.9, w: 0.05, rise: 0.75, cols: [C("#3e6a2a"), C("#8db85a")], droop: 0.7 }));
}
export function buildAgapanthus(seed = 1) {
  const r = prand(seed);
  const parts = strappy(seed, { n: 14, len: 0.8, w: 0.07, rise: 0.45, cols: [C("#2f5e24"), C("#6fa24a")], droop: 0.8 });
  for (let k = 0; k < 3; k++) {
    const a = r() * TAU, d = 0.15 + r() * 0.2, h = 0.85 + r() * 0.3;
    const st = new THREE.CylinderGeometry(0.012, 0.016, h, 4, 1, true);
    st.translate(Math.cos(a) * d, h / 2, Math.sin(a) * d);
    parts.push(finish(st, C("#4d7a34"), (x, y) => y * 0.6));
    const ball = blob(0.16, 1, 0.85, 1, 1, seed * 3 + k, 0.35);
    ball.translate(Math.cos(a) * d, h + 0.08, Math.sin(a) * d);
    parts.push(finish(ball, (x, y, z, nx, ny) => _c.set("#5b6fd6").lerp(C("#9fb0ff"), Math.max(0, ny) * 0.6), 0.7));
  }
  return merge(parts);
}
export function buildHedge(seed = 1) {
  const b = blob(1, 1, 1, 1, 1, seed, 0.12);
  b.scale(0.9, 0.62, 0.62);
  b.translate(0, 0.6, 0);
  return merge([finish(b, (x, y, z, nx, ny) => _c.set("#2f5e26").lerp(C("#5f9a40"), Math.max(0, ny) * 0.7 + y * 0.2), (x, y) => y * 0.25)]);
}
export { buildGum, buildBigLeaf };
