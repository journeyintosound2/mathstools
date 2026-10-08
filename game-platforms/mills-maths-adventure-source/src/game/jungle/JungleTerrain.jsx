import React, { useMemo } from "react";
import * as THREE from "three";

import {
  GRID, getJungleGrid, rimCoords, fbm, vnoise, smoothstep, waterEdgeDist, nearestPath, terrainHeight,
  JUNGLE_PATHS, JUNGLE_SPOTS, ARRIVAL_GLADE, escarpZ, PLATEAU_H, LAGOON, jungleWaterAt, ensureJungleStructures,
  JUNGLE_BRIDGES,
} from "../../data/jungle/jungleLayout.js";
import { getJungleProps, REDWOOD_HOLLOW } from "../../data/jungle/jungleProps.js";
import { makeTerrainMaterial, getJungleTextures } from "./jungleMaterials.js";

/**
 * JUNGLE TERRAIN — the ground you actually walk on, built from the SAME 1 m
 * grid the Player reads (jungleLayout.js). Split into tiles so the camera +
 * the shadow camera only draw what they can see. Biome colours are baked per
 * vertex (meadow grass, forest floor, needle litter under the redwoods, mud
 * at the water's edge, the pebbly beds you see through the water, the
 * plateau's lighter turf); the terrain shader adds rock on every steep face.
 */
const CHUNK = 64;
const C = (h) => new THREE.Color(h);
const COL = {
  grassA: C("#5a9838"), grassB: C("#86ba4c"), grassDark: C("#3f7a2a"),
  forest: C("#3b6526"), litter: C("#6b5a35"), needles: C("#7a4b2c"),
  mud: C("#57472f"), bed: C("#86795a"), bedDeep: C("#5f6a4e"), sand: C("#cdb47c"),
  plateau: C("#78ad4c"), worn: C("#9a8a58"), rimLow: C("#4b7a33"), rimHigh: C("#55603f"),
  path: C("#8a6a45"),
};
const tmp = new THREE.Color();

function canopyGrid() {
  // Trees within ~6 m, on a 4 m grid → how shaded the forest floor is.
  const { trees } = getJungleProps();
  const S = 4;
  const nx = Math.ceil((GRID.xMax - GRID.xMin) / S) + 1, nz = Math.ceil((GRID.zMax - GRID.zMin) / S) + 1;
  const g = new Float32Array(nx * nz);
  const add = (t, w) => {
    const i0 = Math.round((t.x - GRID.xMin) / S), j0 = Math.round((t.z - GRID.zMin) / S);
    for (let j = j0 - 2; j <= j0 + 2; j++) for (let i = i0 - 2; i <= i0 + 2; i++) {
      if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
      const d = Math.hypot(GRID.xMin + i * S - t.x, GRID.zMin + j * S - t.z);
      if (d < 7) g[j * nx + i] += w * (1 - d / 7);
    }
  };
  for (const [k, arr] of Object.entries(trees)) for (const t of arr) add(t, k === "giant" ? 2.2 : k === "palm" ? 0.4 : 0.8);
  return (x, z) => {
    const fi = (x - GRID.xMin) / S, fj = (z - GRID.zMin) / S;
    const i = Math.max(0, Math.min(nx - 2, Math.floor(fi))), j = Math.max(0, Math.min(nz - 2, Math.floor(fj)));
    const tx = fi - i, tz = fj - j;
    const a = g[j * nx + i], b = g[j * nx + i + 1], c = g[(j + 1) * nx + i], d = g[(j + 1) * nx + i + 1];
    return Math.min(1, (a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz) / 1.6);
  };
}

function vertexColour(x, z, h, water, shadeAt) {
  const rc = rimCoords(x, z);
  const n1 = fbm(x / 30, z / 30, 2, 61);
  const n2 = vnoise(x / 5.5, z / 5.5, 62);
  tmp.copy(COL.grassA).lerp(COL.grassB, smoothstep(0.3, 0.75, n1));
  tmp.lerp(COL.grassDark, smoothstep(0.55, 0.85, n2) * 0.45);
  // The plateau's turf is a touch lighter and warmer.
  if (z < escarpZ(x) - 3 && h > PLATEAU_H - 2) tmp.lerp(COL.plateau, 0.45);
  // Forest floor under the canopy (needle litter in Redwood Hollow).
  const shade = shadeAt(x, z);
  if (shade > 0.05) {
    const hollow = 1 - smoothstep(REDWOOD_HOLLOW.radius - 6, REDWOOD_HOLLOW.radius + 8, Math.hypot(x - REDWOOD_HOLLOW.center[0], z - REDWOOD_HOLLOW.center[1]));
    tmp.lerp(COL.forest, shade * 0.75);
    tmp.lerp(COL.litter, shade * 0.35 * smoothstep(0.4, 0.7, vnoise(x / 3, z / 3, 63)));
    if (hollow > 0) tmp.lerp(COL.needles, hollow * 0.55 * (0.6 + 0.4 * n2));
  }
  // The rim mountains: darker, olive higher up (the shader adds the rock).
  if (rc.q > rc.edge - 0.01) {
    const up = smoothstep(rc.edge - 0.01, rc.edge + 0.2, rc.q);
    tmp.lerp(COL.rimLow, up * 0.6).lerp(COL.rimHigh, smoothstep(0.5, 1, up) * 0.5);
  }
  // Worn clearings.
  for (const s of JUNGLE_SPOTS) {
    const d = Math.hypot(x - s.center[0], z - s.center[1]);
    if (d < s.radius + 1.5) tmp.lerp(COL.worn, (1 - smoothstep(s.radius - 3, s.radius + 1.5, d)) * (0.45 + 0.25 * n2));
  }
  {
    const d = Math.hypot(x - ARRIVAL_GLADE.center[0], z - ARRIVAL_GLADE.center[1]);
    if (d < ARRIVAL_GLADE.radius + 2) tmp.lerp(COL.worn, (1 - smoothstep(ARRIVAL_GLADE.radius - 4, ARRIVAL_GLADE.radius + 2, d)) * 0.4);
  }
  // Paths (the ribbon covers them; this keeps the edges muddy, not green).
  const np = nearestPath(x, z);
  if (np && np.e < 0.8) tmp.lerp(COL.path, (1 - smoothstep(-0.6, 0.8, np.e)) * 0.85);
  // Water's edge: mud, then the pebbly bed seen through the water.
  const we = waterEdgeDist(x, z);
  if (we < 2.2) {
    tmp.lerp(COL.mud, (1 - smoothstep(-0.5, 2.2, we)) * 0.8);
    if (!Number.isNaN(water) && h < water - 0.02) {
      const depth = Math.min(1, (water - h) / 0.6);
      tmp.copy(COL.bed).lerp(COL.bedDeep, depth).multiplyScalar(0.85 + 0.3 * n2);
    }
  }
  // A sandy little beach on the lagoon's north shore.
  {
    const q = Math.hypot((x - LAGOON.center[0]) / (LAGOON.rx + 5), (z - LAGOON.center[1]) / (LAGOON.rz + 5));
    if (q < 1.05 && z < LAGOON.center[1] - 4 && h > LAGOON.level - 0.3) tmp.lerp(COL.sand, (1 - smoothstep(0.85, 1.05, q)) * 0.75);
  }
  return tmp;
}

function buildChunks() {
  const { h, water } = getJungleGrid();
  const { nx, nz } = GRID;
  const shadeAt = canopyGrid();
  // Shared per-vertex colours + normals over the whole grid.
  const col = new Float32Array(nx * nz * 3);
  const nor = new Float32Array(nx * nz * 3);
  for (let j = 0; j < nz; j++) {
    const z = GRID.zMin + j * GRID.step;
    for (let i = 0; i < nx; i++) {
      const x = GRID.xMin + i * GRID.step;
      const k = j * nx + i;
      const c = vertexColour(x, z, h[k], water[k], shadeAt);
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
      const hx = h[j * nx + Math.min(nx - 1, i + 1)] - h[j * nx + Math.max(0, i - 1)];
      const hz = h[Math.min(nz - 1, j + 1) * nx + i] - h[Math.max(0, j - 1) * nx + i];
      const L = Math.hypot(hx, 2 * GRID.step, hz);
      nor[k * 3] = -hx / L; nor[k * 3 + 1] = (2 * GRID.step) / L; nor[k * 3 + 2] = -hz / L;
    }
  }
  const chunks = [];
  for (let cj = 0; cj < nz - 1; cj += CHUNK) {
    for (let ci = 0; ci < nx - 1; ci += CHUNK) {
      const i1 = Math.min(nx - 1, ci + CHUNK), j1 = Math.min(nz - 1, cj + CHUNK);
      const w = i1 - ci + 1, d = j1 - cj + 1;
      const pos = new Float32Array(w * d * 3), c3 = new Float32Array(w * d * 3), n3 = new Float32Array(w * d * 3);
      for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) {
        const gi = ci + i, gj = cj + j, k = gj * nx + gi, o = (j * w + i) * 3;
        pos[o] = GRID.xMin + gi * GRID.step; pos[o + 1] = h[k]; pos[o + 2] = GRID.zMin + gj * GRID.step;
        c3[o] = col[k * 3]; c3[o + 1] = col[k * 3 + 1]; c3[o + 2] = col[k * 3 + 2];
        n3[o] = nor[k * 3]; n3[o + 1] = nor[k * 3 + 1]; n3[o + 2] = nor[k * 3 + 2];
      }
      const idx = [];
      for (let j = 0; j < d - 1; j++) for (let i = 0; i < w - 1; i++) {
        const a = j * w + i, b = a + 1, c = a + w, e = c + 1;
        idx.push(a, c, b, b, c, e); // same split as terrainHeight()
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(n3, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(c3, 3));
      geo.setIndex(idx);
      geo.computeBoundingSphere();
      geo.computeBoundingBox();
      chunks.push(geo);
    }
  }
  return chunks;
}

export function JungleGround({ onTap }) {
  const chunks = useMemo(buildChunks, []);
  const mat = useMemo(() => makeTerrainMaterial(), []);
  return (
    <group>
      {chunks.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} receiveShadow onPointerDown={onTap} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Trail ribbons — draped over the terrain (four samples across), broken where
// they meet water (the bridges carry the trail over).
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
function onBridge(x, z) {
  for (const b of JUNGLE_BRIDGES) {
    const dx = b.to[0] - b.from[0], dz = b.to[1] - b.from[1];
    const L2 = dx * dx + dz * dz;
    const t = ((x - b.from[0]) * dx + (z - b.from[1]) * dz) / L2;
    if (t < -0.02 || t > 1.02) continue;
    if (Math.hypot(x - (b.from[0] + dx * t), z - (b.from[1] + dz * t)) < b.halfWidth + 1.4) return true;
  }
  return false;
}
function buildPathRibbons() {
  ensureJungleStructures();
  const pos = [], uv = [], idx = [];
  const ACROSS = [-1, -0.34, 0.34, 1];
  JUNGLE_PATHS.forEach((p, pi) => {
    const lift = 0.045 + pi * 0.003;
    const pts = resample(p.pts, 0.8);
    const half = p.hw + 0.35;
    let v = 0, base = -1;
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
      const nx = -tz / tl, nz = tx / tl;
      if (i > 0) v += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]) / (half * 2);
      const ok = ACROSS.every((s) => jungleWaterAt(x + nx * half * s, z + nz * half * s) === null) && !onBridge(x, z);
      if (!ok) { base = -1; continue; }
      const vi = pos.length / 3;
      ACROSS.forEach((s, k) => {
        const px = x + nx * half * s, pz = z + nz * half * s;
        pos.push(px, terrainHeight(px, pz) + lift, pz);
        uv.push((s + 1) / 2, v);
      });
      if (base >= 0) for (let k = 0; k < 3; k++) idx.push(base + k, base + k + 1, vi + k, base + k + 1, vi + k + 1, vi + k);
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
export function TrailRibbons() {
  const geo = useMemo(buildPathRibbons, []);
  const tex = getJungleTextures().path;
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial map={tex} roughness={0.96} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// The far horizon: misty blue mountain ranges with snowy peaks (Wooded-Kingdom
// style), beyond the rim. Fog is OFF for these — their haze is baked into the
// colour, so they stay visible as soft silhouettes instead of vanishing.
// ---------------------------------------------------------------------------
export function DistantRanges({ horizon = "#bfdcd6" }) {
  const geo = useMemo(() => {
    const parts = [];
    const H = new THREE.Color(horizon);
    const ranges = [
      { r: 360, n: 22, hMin: 90, hMax: 170, haze: 0.74, seed: 3 },
      { r: 470, n: 18, hMin: 140, hMax: 240, haze: 0.84, seed: 7 },
    ];
    const pos = [], col = [], idx = [];
    for (const R of ranges) {
      // A jagged ridge-line ring: peaks + saddles, with snowy tops.
      const segs = 260;
      const base = pos.length / 3;
      for (let s = 0; s <= segs; s++) {
        const a = (s / segs) * Math.PI * 2;
        const ridge = fbm(Math.cos(a) * 6 + R.seed, Math.sin(a) * 6 - R.seed, 4, R.seed);
        const peak = Math.pow(Math.max(0, Math.sin(a * R.n * 0.5 + R.seed) * 0.5 + 0.5), 1.6);
        const hh = R.hMin + (R.hMax - R.hMin) * (0.55 * ridge + 0.45 * peak);
        const rr = R.r * (1 + 0.06 * Math.sin(a * 5 + R.seed));
        const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
        // bottom, snowline, top
        pos.push(x, -20, z, x * 0.995, hh * 0.72, z * 0.995, x * 0.985, hh, z * 0.985);
        const rock = new THREE.Color("#4f6f7a").lerp(H, R.haze);
        const rockHi = new THREE.Color("#6d8a92").lerp(H, R.haze * 0.92);
        const snow = new THREE.Color("#f4f8fb").lerp(H, R.haze * 0.55);
        const snowy = hh > R.hMin + (R.hMax - R.hMin) * 0.55;
        col.push(...rock.toArray(), ...rockHi.toArray(), ...(snowy ? snow : rockHi).toArray());
        if (s > 0) {
          const a0 = base + (s - 1) * 3, a1 = base + s * 3;
          idx.push(a0, a1, a0 + 1, a0 + 1, a1, a1 + 1, a0 + 1, a1 + 1, a0 + 2, a0 + 2, a1 + 1, a1 + 2);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    return g;
  }, [horizon]);
  return (
    <mesh geometry={geo} renderOrder={-0.5}>
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} fog={false} toneMapped={false} />
    </mesh>
  );
}
