/**
 * SNOWBALL SUMS — procedural GEOMETRY (2026-10-08). Every builder returns ONE
 * merged BufferGeometry with the shared attribute set (position · normal · uv
 * · color · aSway) so each kind is one instanced draw with the shared foliage
 * material (gentle sway + per-instance tint). Snow is BAKED into the vertex
 * colours: anything facing the sky is white, undersides keep their colour.
 */
import * as THREE from "three";
import { finish, merge, blob, prand, vnoise3 } from "../jungle/jungleGeometry.js";

const TAU = Math.PI * 2;
const C = (hex) => new THREE.Color(hex);
const _c = new THREE.Color();
const SNOW = C("#f3f7fc");
const SNOW_SHADE = C("#d4e0f0");
const PINE_DARK = C("#1d3a2c");
const PINE_MID = C("#2c5a3c");
const PINE_LIGHT = C("#3f7a4c");
const BARK = C("#4a3a2e");

function cyl(a, b, r0, r1, segs, col, sway = 0) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r1, r0, len, segs, 1, true);
  g.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  g.applyQuaternion(q);
  g.translate(A.x, A.y, A.z);
  return finish(g, col, sway);
}

/**
 * A snow-laden tier of fir branches: an open cone whose rim droops in a
 * wavy, branchy edge; the upper surface is snow, the edge + underside pine.
 */
function firTier(y, r, h, segs, seed, { snow = 0.62, droop = 0.35, dark = PINE_DARK, mid = PINE_MID } = {}) {
  const r0 = prand(seed);
  const g = new THREE.ConeGeometry(r, h, segs, 3, true);
  const p = g.attributes.position;
  const ph = r0() * TAU;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), yy = p.getY(i), z = p.getZ(i);
    const t = (h / 2 - yy) / h; // 0 apex → 1 rim
    const a = Math.atan2(z, x);
    const branch = 0.5 + 0.5 * Math.sin(a * segs * 0.5 + ph);
    const rad = 1 + (branch - 0.5) * 0.22 * t;
    x *= rad; z *= rad;
    yy -= droop * t * t * (0.6 + 0.8 * branch);
    p.setXYZ(i, x, yy, z);
  }
  g.computeVertexNormals();
  g.translate(0, y + h / 2, 0);
  return finish(g, (x, yy, z, nx, ny, nz) => {
    const t = Math.min(1, Math.max(0, (y + h - yy) / h));
    const n = vnoise3(x * 2.1 + seed, yy * 2.1, z * 2.1) - 0.5;
    // Snow on the upper surface (most of the tier), pine at the very edge.
    const s = ny > 0.15 && t < snow + n * 0.25 ? 1 : 0;
    _c.copy(dark).lerp(mid, 0.5 + n);
    if (s) _c.copy(SNOW).lerp(SNOW_SHADE, Math.max(0, 0.4 - ny * 0.4) + n * 0.25);
    return _c;
  }, (x, yy) => Math.min(1, Math.max(0, yy / (y + h + 2))) * 0.6);
}

/** A big SNOWY FIR (~10 m): stacked drooping tiers, white-laden, dark edges. */
export function buildSnowFir(seed = 1, { lod = false, far = false, height = 10 } = {}) {
  const r = prand(seed);
  const parts = [];
  if (far) {
    const g = new THREE.ConeGeometry(2.6, height * 0.92, 7, 1);
    g.translate(0, height * 0.46 + 0.6, 0);
    parts.push(finish(g, (x, y, z, nx, ny) => _c.copy(PINE_DARK).lerp(SNOW, ny > 0.3 ? 0.75 : 0.25), 0));
    return merge(parts);
  }
  parts.push(cyl([0, -0.2, 0], [0, height * 0.35, 0], 0.32, 0.22, lod ? 5 : 7, BARK, 0));
  const tiers = lod ? 4 : 6;
  for (let k = 0; k < tiers; k++) {
    const f = k / (tiers - 1);
    const y = 0.9 + f * height * 0.7;
    const rad = 2.9 * (1 - f * 0.78) + r() * 0.2;
    const h = 2.6 - f * 0.9;
    parts.push(firTier(y, rad, h, lod ? 7 : 11, seed * 7 + k, { snow: 0.7 - f * 0.1 }));
  }
  // The tip.
  const tip = new THREE.ConeGeometry(0.36, 1.3, lod ? 5 : 7);
  tip.translate(0, 0.9 + height * 0.7 + 1.9, 0);
  parts.push(finish(tip, SNOW, 0.8));
  return merge(parts);
}

/** A slender dark SPRUCE (~13 m): many narrow tiers, a dusting of snow. */
export function buildSpruce(seed = 1, { lod = false, far = false, height = 13 } = {}) {
  const r = prand(seed);
  const parts = [];
  if (far) {
    const g = new THREE.ConeGeometry(1.7, height * 0.95, 6, 1);
    g.translate(0, height * 0.475 + 0.5, 0);
    parts.push(finish(g, (x, y, z, nx, ny) => _c.copy(PINE_DARK).lerp(SNOW_SHADE, ny > 0.35 ? 0.45 : 0.08), 0));
    return merge(parts);
  }
  parts.push(cyl([0, -0.2, 0], [0, height * 0.3, 0], 0.26, 0.18, lod ? 5 : 6, BARK, 0));
  const tiers = lod ? 5 : 8;
  for (let k = 0; k < tiers; k++) {
    const f = k / (tiers - 1);
    const y = 0.8 + f * height * 0.78;
    const rad = 1.9 * (1 - f * 0.82) + r() * 0.12;
    parts.push(firTier(y, rad, 2.3 - f * 0.8, lod ? 6 : 9, seed * 11 + k, { snow: 0.38, droop: 0.28, dark: C("#16302a"), mid: C("#24493a") }));
  }
  const tip = new THREE.ConeGeometry(0.24, 1.2, 5);
  tip.translate(0, 0.8 + height * 0.78 + 1.8, 0);
  parts.push(finish(tip, PINE_DARK, 0.8));
  return merge(parts);
}

/** A star-shaped flat layer (the SM64 spiky pine's tiers). */
function starLayer(y, R, points, seed, thick = 0.32) {
  const r = prand(seed);
  const shape = new THREE.Shape();
  for (let i = 0; i <= points * 2; i++) {
    const a = (i / (points * 2)) * TAU + r() * 0.02;
    const rad = i % 2 === 0 ? R : R * 0.42;
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad;
    if (i === 0) shape.moveTo(x, z); else shape.lineTo(x, z);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 1 });
  g.rotateX(Math.PI / 2);
  g.translate(0, y + thick, 0);
  // Tips droop a touch (outer vertices lower).
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const d = Math.hypot(p.getX(i), p.getZ(i)) / R;
    p.setY(i, p.getY(i) - Math.pow(d, 1.4) * 0.62);
  }
  g.computeVertexNormals();
  return finish(g, (x, yy, z, nx, ny) => {
    const d = Math.hypot(x, z) / R;
    if (ny > 0.4) return _c.copy(SNOW).lerp(SNOW_SHADE, d * 0.4);
    return _c.copy(PINE_MID).lerp(SNOW, d > 0.8 ? 0.6 : 0);
  }, (x, yy, z) => 0.3 + Math.min(1, Math.hypot(x, z) / R) * 0.4);
}
/** The SM64-style SPIKY PINE (~6 m): star-shaped snowy tiers on a thin trunk. */
export function buildSpikyPine(seed = 1, { lod = false } = {}) {
  const parts = [cyl([0, -0.2, 0], [0, 5.6, 0], 0.18, 0.1, lod ? 5 : 7, C("#5b4636"), 0)];
  const tiers = [[1.3, 2.1], [2.55, 1.7], [3.7, 1.3], [4.75, 0.9]];
  tiers.forEach(([y, R], k) => parts.push(starLayer(y, R, lod ? 5 : 7, seed * 5 + k)));
  const tip = new THREE.ConeGeometry(0.32, 1.1, 6);
  tip.translate(0, 5.9, 0);
  parts.push(finish(tip, SNOW, 0.8));
  return merge(parts);
}

/** A bare winter BIRCH (~9 m): white trunk with black marks, snowy branches. */
export function buildBirch(seed = 1, { lod = false } = {}) {
  const r = prand(seed);
  const parts = [];
  const bark = (x, y, z) => {
    const m = vnoise3(x * 9 + seed, y * 3.5, z * 9) > 0.72 ? 1 : 0;
    return m ? _c.set("#2a2a2e") : _c.set("#ecebe4").lerp(C("#c9c6bb"), vnoise3(x * 3, y * 2, z * 3) * 0.4);
  };
  parts.push(cyl([0, -0.2, 0], [0.15, 7.5, 0.1], 0.22, 0.07, lod ? 5 : 7, bark, 0.05));
  const nb = lod ? 4 : 8;
  for (let k = 0; k < nb; k++) {
    const y = 2.2 + (k / nb) * 4.8;
    const a = r() * TAU;
    const L = 1.4 + r() * 1.3 - (k / nb) * 0.6;
    const end = [Math.cos(a) * L, y + 0.9 + r() * 0.8, Math.sin(a) * L];
    parts.push(cyl([0.04 * k / nb, y, 0], end, 0.07, 0.025, 4, (x, yy, z, nx, ny) => (ny > 0.55 ? SNOW : _c.set("#3b3330")), 0.6));
    if (!lod) {
      const tw = [end[0] * 1.35 + (r() - 0.5) * 0.4, end[1] + 0.5, end[2] * 1.35 + (r() - 0.5) * 0.4];
      parts.push(cyl(end, tw, 0.025, 0.01, 3, _c.set("#3b3330"), 0.9));
    }
  }
  return merge(parts);
}

/** A snow-capped BOULDER: lumpy grey-blue rock, white where it faces the sky. */
export function buildSnowRock(seed = 1, { crag = false } = {}) {
  const g = crag ? blob(1, 1.3, 0.78, 1.05, 1, seed, 0.38) : blob(1, 1.15, 0.72, 1, 1, seed, 0.22);
  g.translate(0, crag ? 0.3 : 0.42, 0);
  return merge([finish(g, (x, y, z, nx, ny) => {
    const n = vnoise3(x * 2.3 + seed, y * 2.3, z * 2.3);
    if (ny > (crag ? 0.32 : 0.35) + (n - 0.5) * 0.3) return _c.copy(SNOW).lerp(SNOW_SHADE, (1 - ny) * 0.6);
    return _c.set("#5d6573").lerp(C("#8f97a3"), n * 0.9).lerp(C("#3f4652"), Math.max(0, -ny) * 0.5);
  }, 0)]);
}

/** A snow-laden SHRUB: white mounds with dark green peeking underneath. */
export function buildSnowShrub(seed = 1) {
  const r = prand(seed);
  const parts = [];
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + r();
    const g = blob(0.55 + r() * 0.2, 1.1, 0.7, 1.1, 1, seed * 3 + k, 0.2);
    g.translate(Math.cos(a) * 0.45, 0.35 + r() * 0.15, Math.sin(a) * 0.45);
    parts.push(finish(g, (x, y, z, nx, ny) => (ny > 0.2 ? _c.copy(SNOW).lerp(SNOW_SHADE, 0.3 * (1 - ny)) : _c.copy(PINE_MID).lerp(PINE_DARK, 0.5)), (x, y) => Math.min(1, y) * 0.4));
  }
  return merge(parts);
}

/** A wind-blown DRIFT: a long low smooth mound (scaled per instance). */
export function buildDrift(seed = 1) {
  const g = blob(1, 1, 0.5, 1, 2, seed, 0.12);
  g.translate(0, -0.05, 0);
  return merge([finish(g, (x, y, z, nx, ny) => _c.copy(SNOW).lerp(SNOW_SHADE, Math.max(0, 0.5 - ny * 0.5)), 0)]);
}

/** A fallen LOG with a strip of snow on top. */
export function buildSnowLog(seed = 1) {
  const g = new THREE.CylinderGeometry(0.32, 0.36, 2.2, 8, 1);
  g.rotateZ(Math.PI / 2);
  g.translate(0, 0.3, 0);
  return merge([finish(g, (x, y, z, nx, ny) => (ny > 0.55 ? SNOW : _c.set("#4f3c2d").lerp(C("#6e5642"), vnoise3(x * 4 + seed, y * 4, z * 4))), 0)]);
}
/** A STUMP with a cap of snow. */
export function buildSnowStump(seed = 1) {
  const g = new THREE.CylinderGeometry(0.38, 0.46, 0.7, 9, 1);
  g.translate(0, 0.3, 0);
  const cap = new THREE.SphereGeometry(0.4, 9, 4, 0, TAU, 0, Math.PI / 2);
  cap.scale(1, 0.45, 1);
  cap.translate(0, 0.64, 0);
  return merge([finish(g, (x, y, z, nx, ny) => (ny > 0.8 ? SNOW : _c.set("#5a4433")), 0), finish(cap, SNOW, 0)]);
}
/** Dry grass + heather poking through the snow. */
export function buildTuft(seed = 1) {
  const r = prand(seed);
  const parts = [];
  for (let k = 0; k < 7; k++) {
    const a = r() * TAU, lean = 0.2 + r() * 0.35;
    const h = 0.35 + r() * 0.35;
    const g = new THREE.ConeGeometry(0.03, h, 3, 1, true);
    g.translate(0, h / 2, 0);
    g.rotateZ(lean);
    g.rotateY(a);
    g.translate((r() - 0.5) * 0.25, 0, (r() - 0.5) * 0.25);
    parts.push(finish(g, (x, y) => _c.set("#a4885a").lerp(C("#d8c79a"), Math.min(1, y * 2)), (x, y) => y * 2));
  }
  return merge(parts);
}
/** An ICE CRYSTAL: a tall hexagonal shard with a pointed tip. */
export function buildIceCrystal(seed = 1) {
  const r = prand(seed);
  const parts = [];
  for (let k = 0; k < 3; k++) {
    const h = k === 0 ? 1.8 : 0.9 + r() * 0.6;
    const g = new THREE.CylinderGeometry(0, 0.22, 0.5, 6, 1);
    g.translate(0, h + 0.25, 0);
    const b = new THREE.CylinderGeometry(0.22, 0.25, h, 6, 1);
    b.translate(0, h / 2, 0);
    const part = merge([finish(g, C("#e9fbff"), 0), finish(b, (x, y) => _c.set("#9fe3f5").lerp(C("#dff8ff"), y / h), 0)]);
    if (k) {
      part.rotateZ((r() - 0.5) * 0.9);
      part.rotateY(r() * TAU);
      part.translate((r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5);
    }
    parts.push(part);
  }
  return merge(parts);
}

/**
 * A JAGGED MOUNTAIN for the horizon (the SSX skyline): a ridged, noise-
 * displaced cone, flat-shaded — sheer grey rock faces, snow on every ledge.
 */
export function buildPeak(seed = 1) {
  const g = new THREE.ConeGeometry(1, 1, 22, 10, false);
  g.translate(0, 0.5, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const ridge = Math.abs(Math.sin(a * 3 + seed)) * 0.18 + Math.abs(Math.sin(a * 7 + seed * 2)) * 0.08;
    const n = vnoise3(x * 3 + seed, y * 4, z * 3) - 0.5;
    const k = 1 + ridge + n * 0.5;
    const top = y > 0.97 ? 1 : 0;
    p.setXYZ(i, x * k, y + n * 0.06 * (1 - top), z * k);
  }
  const ng = g.toNonIndexed();
  ng.computeVertexNormals();
  return finish(ng, (x, y, z, nx, ny) => {
    const n = vnoise3(x * 6 + seed, y * 6, z * 6);
    if (ny > 0.55 - y * 0.3 + (n - 0.5) * 0.2) return _c.copy(SNOW).lerp(SNOW_SHADE, n * 0.4);
    return _c.set("#4c5566").lerp(C("#7b8597"), n);
  }, 0);
}
