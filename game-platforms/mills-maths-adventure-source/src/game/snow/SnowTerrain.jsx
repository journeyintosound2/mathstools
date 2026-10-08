import React, { useMemo } from "react";
import * as THREE from "three";

import { smoothstep, fbm, vnoise } from "../../data/terrainKit.js";
import {
  GRID, getSnowGrid, nearestTrail, nearestPad, nearestChute, nearestRiver, lakeEdgeDist, outsideRim, iceKind,
  slopeAt, SNOW_TRAILS, SNOW_BRIDGES, ensureSnowStructures, terrainHeight, LAKE_LEVEL, SNOW_CHUTE_PATHS,
} from "../../data/snow/snowTerrain.js";
import { SNOW_LODGE, CAVE_AREA, RANGE_AREA, SNOW_POND, CAVE_MOUTH } from "../../data/snow/snowLayout.js";
import { snowPadLevel } from "../../data/snow/snowTerrain.js";
import { forestDensity } from "../../data/snow/snowProps.js";
import { makeSnowTerrainMaterial, getSnowTextures } from "./snowMaterials.js";

/**
 * SNOW TERRAIN — the ground you walk on, built from the SAME 1 m grid the
 * Player reads (snowTerrain.js), split into tiles for culling. Everything the
 * ground "is" lives in the vertex colours: fresh powder on the open fields,
 * blue-shaded snow under the pines, trodden snow round the village and the
 * stages, the polished-ice floors of the toboggan chutes, slushy grey at the
 * lake's waterline and its dark bed below, rock on the crags (the shader).
 */
const CHUNK = 64;
const C = (h) => new THREE.Color(h);
const COL = {
  powder: C("#f4f8fd"), powderCool: C("#e6eef9"), powderWarm: C("#fbf8f3"), shade: C("#d9e3f0"),
  trodden: C("#dfe6ef"), packed: C("#d2dce9"), iceFloor: C("#c9e3f2"), slush: C("#aab7c6"),
  bed: C("#29465e"), bedDeep: C("#1b3043"), rockDust: C("#c5ccd6"), cave: C("#b8c3d1"), caveDark: C("#0d131c"),
};
const CAVE_FLOOR = snowPadLevel("cave");
/** Inside the cave mouth's tunnel (below its arch)? → 0…1 darkness. */
function caveDarkness(x, z, h) {
  const M = CAVE_MOUTH;
  const dx = x - M.x;
  if (Math.abs(dx) > M.r + 0.4 || z > M.z + 0.6 || z < M.z - M.depth) return 0;
  const arch = Math.sqrt(Math.max(0, M.r * M.r - dx * dx));
  if (h > CAVE_FLOOR + arch + 0.4) return 0;
  return (1 - smoothstep(M.r - 0.6, M.r + 0.4, Math.abs(dx))) * (1 - smoothstep(M.z - 0.4, M.z + 0.6, z));
}
const tmp = new THREE.Color();

function vertexColour(x, z, h) {
  const n1 = fbm(x / 38, z / 38, 2, 81);
  const n2 = vnoise(x / 7, z / 7, 82);
  tmp.copy(COL.powder).lerp(COL.powderCool, smoothstep(0.35, 0.7, n1) * 0.7).lerp(COL.powderWarm, smoothstep(0.65, 0.85, n2) * 0.4);
  // Shaded snow under the forests.
  const fd = forestDensity(x, z);
  tmp.lerp(COL.shade, fd * 0.45);
  if (outsideRim(x, z) > 2) return tmp;

  // Trodden snow on the stage pads, round the lodge + the village square.
  const pd = nearestPad(x, z);
  if (pd.e < 1.5 && pd.id !== "snowman-top") tmp.lerp(COL.trodden, (1 - smoothstep(-2, 1.5, pd.e)) * 0.7);
  {
    const d = Math.hypot(x - SNOW_LODGE.x, z - (SNOW_LODGE.z + SNOW_LODGE.d / 2 + 3));
    if (d < 9) tmp.lerp(COL.packed, (1 - smoothstep(3, 9, d)) * 0.6);
    const dc = Math.hypot(x - CAVE_AREA.x, z - CAVE_AREA.z + 3);
    if (dc < 12) tmp.lerp(COL.cave, (1 - smoothstep(4, 12, dc)) * 0.45);
    const df = Math.hypot(x - RANGE_AREA.x, z - RANGE_AREA.z);
    if (df < 13) tmp.lerp(COL.trodden, (1 - smoothstep(6, 13, df)) * 0.5 * (0.6 + 0.4 * n2));
  }
  // Trail verges (the ribbon draws the trail itself).
  const nt = nearestTrail(x, z);
  if (nt && nt.e < 1.2) tmp.lerp(COL.packed, (1 - smoothstep(-0.5, 1.2, nt.e)) * 0.55);
  // The chutes: a polished ice floor between bright berms.
  const nc = nearestChute(x, z);
  if (nc && nc.d < nc.c.hw + 0.3) tmp.lerp(COL.iceFloor, 1 - smoothstep(nc.c.hw - 0.6, nc.c.hw + 0.3, nc.d));
  // Ice (under the glossy overlays).
  if (iceKind(x, z)) tmp.lerp(COL.iceFloor, 0.9);
  // Crags shed rock dust on the snow below them.
  const sl = slopeAt(x, z);
  if (sl > 0.6) tmp.lerp(COL.rockDust, smoothstep(0.6, 1.0, sl) * 0.35);
  // The cave mouth: dark rock inside the arch.
  const cd = caveDarkness(x, z, h);
  if (cd > 0) tmp.lerp(COL.caveDark, cd);
  // The lake: slush at the waterline, the dark bed beneath.
  const le = lakeEdgeDist(x, z);
  if (le < 3) {
    tmp.lerp(COL.slush, (1 - smoothstep(-0.5, 3, le)) * 0.55);
    if (h < LAKE_LEVEL - 0.05) {
      const depth = Math.min(1, (LAKE_LEVEL - h) / 2.2);
      tmp.copy(COL.bed).lerp(COL.bedDeep, depth);
    }
  }
  return tmp;
}

let _cols = null;
export function getSnowGroundColours() {
  if (_cols) return _cols;
  ensureSnowStructures();
  const { h } = getSnowGrid();
  const { nx, nz } = GRID;
  _cols = new Float32Array(nx * nz * 3);
  for (let j = 0; j < nz; j++) {
    const z = GRID.zMin + j * GRID.step;
    for (let i = 0; i < nx; i++) {
      const x = GRID.xMin + i * GRID.step;
      const k = j * nx + i;
      const c = vertexColour(x, z, h[k]);
      _cols[k * 3] = c.r; _cols[k * 3 + 1] = c.g; _cols[k * 3 + 2] = c.b;
    }
  }
  return _cols;
}

function buildChunks() {
  const { h } = getSnowGrid();
  const { nx, nz } = GRID;
  const col = getSnowGroundColours();
  const nor = new Float32Array(nx * nz * 3);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
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

export function SnowGround({ onTap }) {
  const chunks = useMemo(buildChunks, []);
  const mat = useMemo(() => makeSnowTerrainMaterial(), []);
  return (
    <group>
      {chunks.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} receiveShadow onPointerDown={onTap} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// PACKED-SNOW TRAIL RIBBONS — draped over the graded ground, broken where a
// bridge carries them or they cross ice.
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
  for (const b of SNOW_BRIDGES) {
    const dx = b.to[0] - b.from[0], dz = b.to[1] - b.from[1];
    const L2 = dx * dx + dz * dz;
    const t = ((x - b.from[0]) * dx + (z - b.from[1]) * dz) / L2;
    if (t < 0.02 || t > 0.98) continue;
    if (Math.hypot(x - (b.from[0] + dx * t), z - (b.from[1] + dz * t)) < b.halfWidth + 1.2) return true;
  }
  return false;
}
function buildTrailRibbons() {
  ensureSnowStructures();
  const pos = [], uv = [], idx = [];
  const ACROSS = [-1, -0.5, 0, 0.5, 1];
  SNOW_TRAILS.forEach((p, pi) => {
    const lift = 0.035 + pi * 0.002;
    const pts = resample(p.pts, 0.8);
    const half = p.hw + 0.45;
    let v = 0, base = -1;
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
      const nx = -tz / tl, nz = tx / tl;
      if (i > 0) v += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]) / (half * 2);
      const ok = ACROSS.every((s) => !iceKind(x + nx * half * s, z + nz * half * s) && lakeEdgeDist(x + nx * half * s, z + nz * half * s) > 0.3) && !onBridge(x, z);
      if (!ok) { base = -1; continue; }
      const vi = pos.length / 3;
      ACROSS.forEach((s) => {
        const px = x + nx * half * s, pz = z + nz * half * s;
        pos.push(px, terrainHeight(px, pz) + lift, pz);
        uv.push((s + 1) / 2, v);
      });
      if (base >= 0) for (let k = 0; k < 4; k++) idx.push(base + k, base + k + 1, vi + k, base + k + 1, vi + k + 1, vi + k);
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
  const geo = useMemo(buildTrailRibbons, []);
  const tex = getSnowTextures().trail;
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial map={tex} roughness={0.9} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
    </mesh>
  );
}

/** A chute's ribbon (for the ice overlay): the trough floor, draped. */
export function buildChuteRibbon(c, lift = 0.03) {
  const pos = [], uv = [], idx = [];
  const ACROSS = [-1, -0.5, 0, 0.5, 1];
  const pts = resample(c.pts, 0.7);
  const half = c.hw - 0.05;
  let v = 0, base = -1;
  for (let i = 0; i < pts.length; i++) {
    const [x, z] = pts[i];
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
    const nx = -tz / tl, nz = tx / tl;
    if (i > 0) v += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]) / 6;
    const vi = pos.length / 3;
    ACROSS.forEach((s) => {
      const px = x + nx * half * s, pz = z + nz * half * s;
      pos.push(px, terrainHeight(px, pz) + lift, pz);
      uv.push((s + 1) / 2, v);
    });
    if (base >= 0) for (let k = 0; k < 4; k++) idx.push(base + k, base + k + 1, vi + k, base + k + 1, vi + k + 1, vi + k);
    base = vi;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
export { SNOW_CHUTE_PATHS, SNOW_POND, nearestRiver };
