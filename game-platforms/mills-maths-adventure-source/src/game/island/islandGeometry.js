/**
 * NUMBER ISLAND — small procedural geometry the other kits don't have:
 * beachcombing (scallop shells, starfish, conches), dark basalt boulders for
 * Ember Peak, puffy cloud clusters and a little crab. Same attribute set as
 * the jungle kit (position, normal, uv, color, aSway) so they share the
 * foliage material + InstancedChunks.
 */
import * as THREE from "three";
import { finish, merge, blob, vnoise3 } from "../jungle/jungleGeometry.js";

const TAU = Math.PI * 2;
const C = (h) => new THREE.Color(h);
const _c = new THREE.Color();

/** v = 0 scallop · 1 starfish · 2 conch. ~0.15–0.3 m. */
export function buildShell(v = 0) {
  if (v === 1) {
    const s = new THREE.Shape();
    for (let k = 0; k <= 10; k++) {
      const a = (k / 10) * TAU + Math.PI / 2;
      const r = k % 2 ? 0.07 : 0.2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (k === 0) s.moveTo(x, y); else s.lineTo(x, y);
    }
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0.02, 0);
    return merge([finish(g, (x, y, z) => _c.set("#ff8a4c").lerp(C("#ffc07a"), Math.min(1, Math.hypot(x, z) / 0.2)), 0)]);
  }
  if (v === 2) {
    const g = new THREE.ConeGeometry(0.08, 0.3, 9, 4);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const tw = (y + 0.15) * 9;
      const x = p.getX(i), z = p.getZ(i);
      p.setXYZ(i, x * Math.cos(tw) - z * Math.sin(tw), y, x * Math.sin(tw) + z * Math.cos(tw));
    }
    g.computeVertexNormals();
    g.rotateZ(Math.PI / 2 - 0.25);
    g.translate(0, 0.06, 0);
    return merge([finish(g, (x, y, z) => _c.set("#f4dcc4").lerp(C("#e59a7a"), (vnoise3(x * 30, y * 30, z * 30))), 0)]);
  }
  // Scallop: a ribbed half-disc.
  const g = new THREE.CircleGeometry(0.16, 14, Math.PI * 0.08, Math.PI * 0.84);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const a = Math.atan2(y, x);
    const r = Math.hypot(x, y);
    p.setZ(i, Math.abs(Math.sin(a * 9)) * 0.012 + r * 0.25);
  }
  g.computeVertexNormals();
  g.rotateX(-Math.PI / 2 + 0.25);
  g.translate(0, 0.03, 0.05);
  return merge([finish(g, (x, y, z) => _c.set("#fff1e4").lerp(C("#f6a6b8"), Math.min(1, Math.hypot(x, z) / 0.16)), 0)]);
}

/** A dark, faceted basalt boulder (Ember Peak + the ash fields). */
export function buildBasalt(seed = 1) {
  let g = new THREE.DodecahedronGeometry(1, 0);
  g = g.toNonIndexed();
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const k = 1 + (vnoise3(x * 1.3 + seed, y * 1.3, z * 1.3 - seed) - 0.5) * 0.5;
    p.setXYZ(i, x * 1.1 * k, Math.max(-0.3, y * 0.7 * k), z * k);
  }
  g.computeVertexNormals();
  g.translate(0, 0.32, 0);
  return merge([finish(g, (x, y, z, nx, ny) => {
    _c.set("#2c2624").lerp(C("#4a403b"), vnoise3(x * 3 + seed, y * 3, z * 3));
    if (ny > 0.6) _c.lerp(C("#5d5450"), 0.35);
    return _c;
  }, 0)]);
}

/** A puffy cumulus cluster (white, soft-shaded) ~ 20 m across. */
export function buildCloud(seed = 1) {
  const parts = [];
  let s = seed * 9301 + 49297;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const n = 7 + Math.floor(r() * 4);
  for (let k = 0; k < n; k++) {
    const rad = 3.2 + r() * 3.6;
    const b = blob(rad, 1.25, 0.82, 1.05, 1, seed + k, 0.12);
    const x = (k / (n - 1) - 0.5) * 18 + (r() - 0.5) * 4;
    const y = (1 - Math.abs(k / (n - 1) - 0.5) * 2) * 3 + r() * 1.5;
    b.translate(x, y, (r() - 0.5) * 6);
    parts.push(finish(b, (px, py, pz, nx, ny) => _c.setRGB(0.86 + 0.14 * Math.max(0, ny), 0.9 + 0.1 * Math.max(0, ny), 0.97 + 0.03 * Math.max(0, ny)), 0));
  }
  // A flat-ish base so the cloud reads as cumulus.
  const g = merge(parts);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) < -1.2) p.setY(i, -1.2 + (p.getY(i) + 1.2) * 0.25);
  g.computeVertexNormals();
  return g;
}

/** A little red crab (body + claws + legs), ~0.35 m. */
export function buildCrab() {
  const parts = [];
  const body = new THREE.SphereGeometry(0.15, 10, 6);
  body.scale(1.3, 0.55, 1);
  body.translate(0, 0.1, 0);
  parts.push(finish(body, C("#e2513a"), 0));
  for (const s of [-1, 1]) {
    const claw = new THREE.SphereGeometry(0.07, 8, 5);
    claw.scale(1, 0.7, 1.3);
    claw.translate(s * 0.16, 0.12, 0.17);
    parts.push(finish(claw, C("#f06a4f"), 0));
    for (let k = 0; k < 3; k++) {
      const leg = new THREE.CylinderGeometry(0.012, 0.012, 0.18, 4);
      leg.rotateZ(s * 1.0);
      leg.translate(s * 0.2, 0.06, (k - 1) * 0.07);
      parts.push(finish(leg, C("#c94530"), 0));
    }
    const eye = new THREE.SphereGeometry(0.025, 6, 4);
    eye.translate(s * 0.05, 0.2, 0.1);
    parts.push(finish(eye, C("#1a1a1a"), 0));
  }
  return merge(parts);
}
