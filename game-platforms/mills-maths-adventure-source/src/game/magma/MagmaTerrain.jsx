import React, { useMemo } from "react";
import * as THREE from "three";

import {
  GRID, getLandGrid, landSD, LAVA_Y, VOLCANO, V_K, TRAIL_END, TRAIL_PHI,
  volcanoSurface, trailRadius, trailHeight, trailPoint, MAGMA_PATHS,
  MAGMA_CHALLENGE_SPOTS, MAGMA_PLAZA, bridgeDeckAt, magmaGroundHeight,
  CRATER_LAVA_Y, CRATER_LAVA_R, KNOLLS,
} from "../../data/magma/magmaLayout.js";
import { makeLavaMaterial, makeGlowRockMaterial, getMagmaTextures } from "./magmaMaterials.js";

/**
 * MAGMA TERRAIN — the ground you actually walk on, built from the SAME
 * functions the Player reads (magmaLayout.js):
 *   • LavaSea       one big animated lava plane under everything (the sea,
 *                   moat, rivers, lake and pools are just where the rock
 *                   dips BELOW it).
 *   • Lowland       a 1 m height-grid mesh (vertex-coloured basalt, ash and
 *                   glowing lava banks).
 *   • VolcanoBody   a mesh laid out ALONG THE SPIRAL (rows = spiral angle,
 *                   columns = offset across the winding), so the trail's rock
 *                   walls and kerb are razor-crisp instead of grid-jaggy.
 *   • CraterBowl    the summit rim + crater walls + its lava lake.
 *   • TrailRibbon / PathRibbons / Plazas — cobbled overlays.
 */

const TAU = Math.PI * 2;

// Cheap deterministic value noise for colour variation.
function hash2(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
const C = (hex) => new THREE.Color(hex);
const COL = {
  basalt: C("#3f3735"),
  basaltLight: C("#5a504b"),
  ash: C("#7a706a"),
  scorch: C("#1c1312"),
  bankGlow: C("#b8441a"),
  path: C("#8f7764"),
  faceLow: C("#3a3230"),
  faceHigh: C("#2c2322"),
  faceTop: C("#4a2119"),
  oxide: C("#7a3320"),
  trail: C("#4a3a33"),
  kerb: C("#8a7262"),
  rim: C("#2e2321"),
  craterIn: C("#5a1d10"),
};
const tmp = new THREE.Color();

// ---------------------------------------------------------------------------
export function LavaSea() {
  const mat = useMemo(() => makeLavaMaterial({ farCrust: true }), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LAVA_Y, 0]} material={mat}>
      <circleGeometry args={[560, 72]} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
function buildLowland() {
  const g = getLandGrid();
  const n = GRID.n;
  const pos = new Float32Array(n * n * 3);
  const col = new Float32Array(n * n * 3);
  const glow = new Float32Array(n * n);
  const sdArr = new Float32Array(n * n);
  const rArr = new Float32Array(n * n);
  for (let j = 0; j < n; j++) {
    const z = GRID.min + j * GRID.step;
    for (let i = 0; i < n; i++) {
      const x = GRID.min + i * GRID.step;
      const k = j * n + i;
      const h = g[k];
      pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
      const r = Math.hypot(x, z);
      const sd = r < VOLCANO.rBase - 1 ? 20 : landSD(x, z);
      sdArr[k] = sd; rArr[k] = r;
      // Colour: basalt with ashy patches, lighter on knoll tops, scorched
      // black toward lava, glowing orange right at the bank.
      const nz = vnoise(x * 0.12, z * 0.12) * 0.65 + vnoise(x * 0.5, z * 0.5) * 0.35;
      tmp.copy(COL.basalt).lerp(COL.basaltLight, nz * 0.8);
      const ashy = THREE.MathUtils.smoothstep(vnoise(x * 0.05 + 7, z * 0.05 - 3), 0.55, 0.8);
      tmp.lerp(COL.ash, ashy * 0.6);
      if (h > 0.9) tmp.lerp(COL.basaltLight, Math.min(1, (h - 0.9) / 2) * 0.5);
      if (sd < 3) tmp.lerp(COL.scorch, THREE.MathUtils.smoothstep(3 - sd, 0, 2.6) * 0.85);
      if (sd < 0.6) tmp.lerp(COL.bankGlow, THREE.MathUtils.smoothstep(0.6 - sd, 0, 0.9));
      col[k * 3] = tmp.r; col[k * 3 + 1] = tmp.g; col[k * 3 + 2] = tmp.b;
      glow[k] = sd < 1.0 ? THREE.MathUtils.smoothstep(1.0 - sd, 0, 1.4) * 0.8 : 0;
    }
  }
  const idx = [];
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
      // Skip cells hidden inside the volcano, or deep under lava.
      const rin = VOLCANO.rBase + 0.6;
      if (rArr[a] < rin && rArr[b] < rin && rArr[c] < rin && rArr[d] < rin) continue;
      if (sdArr[a] < -1.6 && sdArr[b] < -1.6 && sdArr[c] < -1.6 && sdArr[d] < -1.6) continue;
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aGlow", new THREE.BufferAttribute(glow, 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export function Lowland({ onTap }) {
  const geo = useMemo(buildLowland, []);
  const mat = useMemo(() => makeGlowRockMaterial({ flat: true }), []);
  return <mesh geometry={geo} material={mat} receiveShadow onPointerDown={onTap} />;
}

// ---------------------------------------------------------------------------
// The volcano, meshed along its spiral.
// ---------------------------------------------------------------------------
const U_COLS = (() => {
  const W = VOLCANO.pathW / 2, kb = W - VOLCANO.curbW, P = (VOLCANO.rBase - VOLCANO.rRim) / VOLCANO.turns / 2;
  const e = 0.004;
  return [-P, -5.7, -4.6, -3.6, -W - e, -W + e, -1.4, 0, 1.4, kb - e, kb + e, W - e, W + e, 3.7, 4.7, 5.75, P];
})();
const STRIP_R_MIN = VOLCANO.rCrater + 1.1;
const STRIP_R_MAX = VOLCANO.rBase + 3.0;

function volcanoColour(r, h, u, phi, onTrail, onKerb) {
  if (onKerb) {
    tmp.copy(COL.kerb).multiplyScalar(0.85 + hash2(phi * 40, u) * 0.3);
    return;
  }
  if (onTrail) {
    tmp.copy(COL.trail);
    return;
  }
  const t = h / VOLCANO.height;
  tmp.copy(COL.faceLow).lerp(COL.faceHigh, t);
  if (r < VOLCANO.rRim + 5) tmp.lerp(COL.faceTop, (VOLCANO.rRim + 5 - r) / 6);
  const th = VOLCANO.theta0 + phi;
  const x = r * Math.cos(th), z = r * Math.sin(th);
  tmp.multiplyScalar(0.8 + vnoise(x * 0.25, z * 0.25) * 0.4);
  // Rust-red oxidised streaks down the fall line.
  const streak = Math.max(0, Math.sin(13 * th + 1.7 * Math.sin(4 * th)));
  tmp.lerp(COL.oxide, streak * streak * 0.35 * Math.min(1, h / 8));
  if (r >= VOLCANO.rBase - 0.01 && !onTrail) tmp.copy(COL.basalt);
}

function buildVolcanoStrip() {
  const W = VOLCANO.pathW / 2, kb = W - VOLCANO.curbW;
  const phi0 = -(STRIP_R_MAX + 8 - VOLCANO.rBase) / V_K;
  const phi1 = (VOLCANO.rBase - (STRIP_R_MIN - 7)) / V_K;
  const dphi = 0.012;
  const rows = Math.ceil((phi1 - phi0) / dphi) + 1;
  const cols = U_COLS.length;
  const pos = new Float32Array(rows * cols * 3);
  const col = new Float32Array(rows * cols * 3);
  const glow = new Float32Array(rows * cols);
  for (let ri = 0; ri < rows; ri++) {
    const phi = phi0 + ri * dphi;
    const R = trailRadius(phi);
    const th = VOLCANO.theta0 + phi;
    const cs = Math.cos(th), sn = Math.sin(th);
    for (let ci = 0; ci < cols; ci++) {
      let u = U_COLS[ci];
      let r = R + u;
      if (r < STRIP_R_MIN) r = STRIP_R_MIN;
      if (r > STRIP_R_MAX) r = STRIP_R_MAX;
      u = r - R;
      // Rock roughness on the bare flank (never near the trail edges).
      let h = volcanoSurface(r, th, true);
      const onTrail = phi >= 0 && phi <= TRAIL_END && Math.abs(u) <= W && r > VOLCANO.rRim - 4;
      const onKerb = onTrail && u > kb;
      const face = !onTrail && r > VOLCANO.rRim + 0.6 && r < VOLCANO.rBase - 0.5;
      if (face) {
        // Rocky gullies running down the fall line (+ a little fine grit),
        // faded to zero at the trail edges so walls/kerbs stay crisp.
        const away = Math.min(Math.abs(u - W), Math.abs(u + W));
        const amp = Math.min(1, away / 0.9);
        // (periodic in θ + world-space grit → identical on the seams where
        // neighbouring windings' rows meet — no cracks).
        const gul = 0.5 * Math.sin(23 * th + 2 * Math.sin(5 * th) + r * 0.15) + 0.3 * Math.sin(41 * th + r * 0.4);
        h += (gul * 0.45 + (vnoise(r * cs * 0.9, r * sn * 0.9) - 0.5) * 0.35) * amp;
      }
      const k = ri * cols + ci;
      pos[k * 3] = r * cs; pos[k * 3 + 1] = h; pos[k * 3 + 2] = r * sn;
      volcanoColour(r, h, u, phi, onTrail, onKerb);
      col[k * 3] = tmp.r; col[k * 3 + 1] = tmp.g; col[k * 3 + 2] = tmp.b;
      glow[k] = face && r < VOLCANO.rRim + 7 ? ((VOLCANO.rRim + 7 - r) / 7) * 0.22 * vnoise(r * cs * 0.6, r * sn * 0.6) : 0;
    }
  }
  const idx = [];
  for (let ri = 0; ri < rows - 1; ri++) {
    for (let ci = 0; ci < cols - 1; ci++) {
      const a = ri * cols + ci, b = a + 1, c = a + cols, d = c + 1;
      // Rows advance in +θ, columns outward — (a, c, b) winds normals UP.
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aGlow", new THREE.BufferAttribute(glow, 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// Summit rim + crater walls (polar rings, r ≤ rCrater + 1.35).
const CRATER_RINGS = [0, 4, -3.7, -2.9, -1.7, -0.8, 0, 0.22, 0.45, 0.68, 0.9, 1.35].map((d, i) => (i < 2 ? d : VOLCANO.rCrater + d));
function buildCrater() {
  const seg = 144;
  const nr = CRATER_RINGS.length;
  const pos = new Float32Array((seg + 1) * nr * 3);
  const col = new Float32Array((seg + 1) * nr * 3);
  const glow = new Float32Array((seg + 1) * nr);
  for (let s = 0; s <= seg; s++) {
    const th = (s / seg) * TAU;
    for (let q = 0; q < nr; q++) {
      const r = CRATER_RINGS[q];
      let h = volcanoSurface(r, th, true);
      if (r < VOLCANO.rCrater && r > 7) h += Math.sin(th * 19 + r) * 0.25;
      const k = s * nr + q;
      pos[k * 3] = r * Math.cos(th); pos[k * 3 + 1] = h; pos[k * 3 + 2] = r * Math.sin(th);
      if (r < VOLCANO.rCrater) {
        const t = THREE.MathUtils.clamp((VOLCANO.rCrater - r) / 3.5, 0, 1);
        tmp.copy(COL.rim).lerp(COL.craterIn, t);
        glow[k] = t * 0.95;
      } else {
        tmp.copy(COL.rim).multiplyScalar(0.85 + vnoise(r * Math.cos(th) * 0.8, r * Math.sin(th) * 0.8) * 0.3);
        glow[k] = r < 11.4 ? 0.08 : 0;
      }
      col[k * 3] = tmp.r; col[k * 3 + 1] = tmp.g; col[k * 3 + 2] = tmp.b;
    }
  }
  const idx = [];
  for (let s = 0; s < seg; s++) {
    for (let q = 0; q < nr - 1; q++) {
      const a = s * nr + q, b = a + 1, c = a + nr, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aGlow", new THREE.BufferAttribute(glow, 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export function VolcanoBody({ onTap }) {
  const strip = useMemo(buildVolcanoStrip, []);
  const crater = useMemo(buildCrater, []);
  const mat = useMemo(() => makeGlowRockMaterial({ flat: false, polygonOffset: -1 }), []);
  const lava = useMemo(() => makeLavaMaterial({ scale: 0.35, brightness: 1.45, crustAmount: 0.7 }), []);
  return (
    <group>
      <mesh geometry={strip} material={mat} castShadow receiveShadow onPointerDown={onTap} />
      <mesh geometry={crater} material={mat} receiveShadow />
      {/* The crater's lava lake. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, CRATER_LAVA_Y, 0]} material={lava}>
        <circleGeometry args={[CRATER_LAVA_R + 0.4, 48]} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Cobbled TRAIL ribbon up the volcano.
// ---------------------------------------------------------------------------
function buildTrailRibbon() {
  const W = VOLCANO.pathW / 2;
  const u0 = -W + 0.03, u1 = W - VOLCANO.curbW - 0.02;
  const pos = [], uv = [], idx = [];
  let v = 0;
  let prev = null;
  const step = 0.008;
  for (let phi = 0, i = 0; phi <= TRAIL_END + 1e-6; phi += step, i++) {
    const [ax, az] = trailPoint(phi, u0);
    const [bx, bz] = trailPoint(phi, u1);
    // Near the top the inner half dips into the rim plateau — clamp the
    // ribbon onto the trail surface there.
    const y = trailHeight(Math.min(phi, TRAIL_PHI)) + 0.025;
    if (prev) v += Math.hypot((ax + bx) / 2 - prev[0], (az + bz) / 2 - prev[1]) / (u1 - u0);
    prev = [(ax + bx) / 2, (az + bz) / 2];
    pos.push(ax, y, az, bx, y, bz);
    uv.push(0, v, 1, v);
    if (i > 0) {
      const a = (i - 1) * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export function TrailRibbon() {
  const geo = useMemo(buildTrailRibbon, []);
  const tex = getMagmaTextures().trail;
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial map={tex} roughness={0.92} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// Lowland path ribbons (broken where they cross lava — bridges cover those).
// ---------------------------------------------------------------------------
function resample(pts, step) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const L = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < n; k++) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

function buildPathRibbons() {
  const pos = [], uv = [], idx = [];
  MAGMA_PATHS.forEach((p, pi) => {
    // Each path sits a hair higher than the last so crossings never z-fight.
    const lift = 0.03 + pi * 0.004;
    const pts = resample(p.pts, 0.9);
    let v = 0;
    let base = -1; // vertex index of the previous valid sample (or -1)
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const tx = b[0] - a[0], tz = b[1] - a[1];
      const tl = Math.hypot(tx, tz) || 1;
      const nx = -tz / tl, nz = tx / tl;
      if (i > 0) v += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]) / (p.hw * 2);
      const L = [x + nx * p.hw, z + nz * p.hw], R = [x - nx * p.hw, z - nz * p.hw];
      const ok =
        landSD(L[0], L[1]) > 0.25 && landSD(R[0], R[1]) > 0.25 && landSD(x, z) > 0.25 &&
        bridgeDeckAt(x, z) === null && Math.hypot(x, z) > VOLCANO.rBase + 2.5;
      if (!ok) { base = -1; continue; }
      const yl = Math.max(0, magmaGroundHeight(L[0], L[1])) + lift;
      const yr = Math.max(0, magmaGroundHeight(R[0], R[1])) + lift;
      const vi = pos.length / 3;
      pos.push(L[0], yl, L[1], R[0], yr, R[1]);
      uv.push(0, v, 1, v);
      if (base >= 0) idx.push(base, vi, base + 1, base + 1, vi, vi + 1);
      base = vi;
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export function PathRibbons() {
  const geo = useMemo(buildPathRibbons, []);
  const tex = getMagmaTextures().path;
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial map={tex} roughness={0.93} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
    </mesh>
  );
}

/** Paved discs for the clearings + the arrival plaza (+ a kerb ring). */
export function Plazas() {
  const tex = useMemo(() => {
    const t = getMagmaTextures().plaza;
    if (!t) return null;
    const c = t.clone();
    c.needsUpdate = true;
    c.repeat.set(4, 4);
    return c;
  }, []);
  const discs = [
    ...MAGMA_CHALLENGE_SPOTS.map((s) => ({ c: s.center, r: s.radius })),
    { c: MAGMA_PLAZA.center, r: MAGMA_PLAZA.radius },
  ];
  return (
    <group>
      {discs.map((d, i) => (
        <group key={i} position={[d.c[0], 0.035, d.c[1]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[d.r, 48]} />
            <meshStandardMaterial map={tex} roughness={0.95} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[d.r - 0.35, d.r, 48]} />
            <meshStandardMaterial color="#3a2c26" roughness={1} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export { KNOLLS };
