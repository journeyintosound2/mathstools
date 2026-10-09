import React, { useMemo } from "react";
import * as THREE from "three";

import { smoothstep, fbm, vnoise, clamp } from "../../data/terrainKit.js";
import {
  GRID, getIslandGrid, terrainHeight, nearestPath, nearestPad, coastSD, slopeAt, snowCover, lagoonEdgeDist,
  lavaStreamDist, ISLAND_PATHS, islandSolidTopAt, SEA_Y,
} from "../../data/island/islandTerrain.js";
import { ISLAND_FIELDS, EMBER_PEAK, ISLAND_SPAWN, SCHOOLHOUSE, SCHOOL_FENCE, FARM_BARN, GATES } from "../../data/island/islandLayout.js";
import { volcanicness, jungleness, fieldQ } from "../../data/island/islandProps.js";
import { makeIslandTerrainMaterial, getIslandTextures } from "./islandMaterials.js";

/**
 * ISLAND TERRAIN — the ground you walk on, built from the SAME 1 m grid the
 * Player reads (islandTerrain.js), split into tiles for culling. Everything
 * the ground "is" is baked into vertex colours + a per-vertex mix (sand /
 * snow / ash / wet) the shader uses for detail: sunny meadow turf, the mown
 * lawns of Harbour Green, golden sand + wet sand at the waterline + the
 * pale seabed seen through the shallows, Frosty Peak's snow, Ember Peak's
 * ash + scorched lava banks, the farm's soil, worn earth round the pads.
 */
const CHUNK = 64;
const C = (h) => new THREE.Color(h);
const COL = {
  lush: C("#4f9e3a"), grass: C("#6dba4a"), sunny: C("#97cc58"), dry: C("#b6c46a"), lawn: C("#5fb948"), lawnLight: C("#7fcf5c"),
  sand: C("#f1dca2"), sandDry: C("#f6e7bd"), sandWet: C("#cdb37c"), seabed: C("#e6d39a"), seabedDeep: C("#9cc7b0"),
  snow: C("#f4f8fd"), snowShade: C("#d9e5f3"), ash: C("#5c5450"), ashDark: C("#3b3533"), scorch: C("#2a201d"),
  earth: C("#9b7a52"), earthDark: C("#6e5236"), soil: C("#6a4a2e"), stubble: C("#d9c26e"), moss: C("#3f7d2e"),
  rock: C("#8a8274"),
};
const tmp = new THREE.Color();
const t2 = new THREE.Color();

function colourAt(x, z, h) {
  const n1 = fbm(x / 34, z / 34, 2, 71);
  const n2 = vnoise(x / 6, z / 6, 72);
  const sd = coastSD(x, z);
  let sand = 0, snow = 0, ash = 0, wet = 0;
  // Meadow turf: lush in the hollows → sun-warmed on the rises.
  tmp.copy(COL.lush).lerp(COL.grass, smoothstep(0.25, 0.6, n1));
  tmp.lerp(COL.sunny, smoothstep(0.55, 0.85, n1) * 0.6);
  tmp.lerp(COL.dry, smoothstep(0.65, 0.8, n2) * 0.12);
  // The little jungle: deeper, mossier greens.
  const jun = jungleness(x, z);
  if (jun > 0) tmp.lerp(COL.moss, jun * 0.55);

  // Harbour Green's mown lawn (stripes) + the school's playing field.
  const pd = nearestPad(x, z);
  if (pd.id === "arrival" && pd.e < 2) {
    const stripe = 0.5 + 0.5 * Math.cos((x / 3.2) * Math.PI);
    t2.copy(COL.lawn).lerp(COL.lawnLight, stripe * 0.6);
    tmp.lerp(t2, (1 - smoothstep(-2, 2, pd.e)) * 0.85);
  }
  if (pd.e < 0 && (pd.id === "school" || pd.id === "plaza")) tmp.lerp(COL.lawnLight, 0.25);
  if (pd.e < 0 && pd.id === "farm") tmp.lerp(COL.earth, 0.45 + 0.3 * n2);
  // Worn earth round every gate (people come + go).
  for (const g of Object.values(GATES)) {
    const d = Math.hypot(x - g.position[0], z - g.position[1]);
    if (d < 7) tmp.lerp(COL.earthDark, (1 - smoothstep(2.5, 7, d)) * 0.35);
  }
  // The schoolyard (packed earth inside the fence) + the barnyard.
  if (Math.abs(x - SCHOOLHOUSE.x) < 13 && z < SCHOOL_FENCE.z && z > SCHOOLHOUSE.z + SCHOOLHOUSE.d / 2 - 1) tmp.lerp(COL.earth, 0.55 + 0.2 * n2);
  if (Math.hypot(x - FARM_BARN.x, z - (FARM_BARN.z + 7)) < 8) tmp.lerp(COL.earth, (1 - smoothstep(4, 8, Math.hypot(x - FARM_BARN.x, z - (FARM_BARN.z + 7)))) * 0.6);
  // Crops: ploughed soil rows (sunflowers) + golden wheat stubble.
  for (const f of ISLAND_FIELDS) {
    const q = fieldQ(f, x, z);
    if (q > 1.15) continue;
    const k = 1 - smoothstep(0.92, 1.15, q);
    if (f.kind === "wheat") tmp.lerp(COL.stubble, k * 0.8);
    else {
      const stripe = 0.5 + 0.5 * Math.cos(((z - f.c[1]) / 1.5) * Math.PI * 2);
      t2.copy(COL.soil).lerp(COL.earth, stripe * 0.5);
      tmp.lerp(t2, k * 0.9);
    }
  }
  // Path verges: earthy (the ribbon covers the path itself).
  const np = nearestPath(x, z);
  if (np && np.e < 0.9) tmp.lerp(COL.earthDark, (1 - smoothstep(-0.8, 0.9, np.e)) * 0.45);

  // Ash fields + Ember Peak.
  const vol = volcanicness(x, z);
  if (vol > 0) {
    t2.copy(COL.ash).lerp(COL.ashDark, smoothstep(0.4, 0.8, n2));
    tmp.lerp(t2, vol);
    ash = vol;
    const ls = lavaStreamDist(x, z);
    if (ls < 3) tmp.lerp(COL.scorch, (1 - smoothstep(-0.5, 3, ls)) * 0.9);
    const dc = Math.hypot(x - EMBER_PEAK.c[0], z - EMBER_PEAK.c[1]);
    if (dc < EMBER_PEAK.craterR * 1.6) tmp.lerp(COL.scorch, (1 - smoothstep(EMBER_PEAK.craterR, EMBER_PEAK.craterR * 1.6, dc)) * 0.8);
  }
  // Snow.
  const sc = snowCover(x, z, h);
  if (sc > 0) {
    t2.copy(COL.snow).lerp(COL.snowShade, smoothstep(0.35, 0.8, n1) * 0.6);
    tmp.lerp(t2, sc);
    snow = sc;
  }
  // Beaches: golden sand, wetter + darker near the water, the pale seabed
  // under the shallows (the lagoon's bed too).
  const le = lagoonEdgeDist(x, z);
  const beachy = Math.max(1 - smoothstep(-13, -7, sd), 1 - smoothstep(0.5, 3.5, le));
  if (h < 1.45 && beachy > 0 && sc < 0.6) {
    const k = (1 - smoothstep(1.0, 1.45, h)) * beachy * (1 - vol * 0.85);
    t2.copy(COL.sand).lerp(COL.sandDry, smoothstep(0.6, 1.2, h) * 0.6);
    tmp.lerp(t2, k);
    sand = Math.max(sand, k);
    if (h < 0.3) {
      const w = (1 - smoothstep(0.02, 0.3, h)) * k;
      tmp.lerp(COL.sandWet, w);
      wet = w;
    }
  }
  if (h < SEA_Y) {
    // Under water: the seabed (the ocean shader tints it by depth).
    const d = clamp(-h / 3, 0, 1);
    t2.copy(vol > 0.4 ? COL.ashDark : COL.seabed).lerp(COL.seabedDeep, d * 0.6);
    tmp.lerp(t2, 0.92);
    sand = 1; wet = 0.4;
  }
  // Steep faces: the shader turns them to rock; darken their foot a touch.
  const sl = slopeAt(x, z);
  if (sl > 0.6 && sc < 0.5) tmp.lerp(COL.rock, smoothstep(0.6, 1.1, sl) * 0.25);
  return { col: tmp, mix: [sand, snow, ash, wet] };
}

let _cols = null;
/** The ground colour + mix of every grid vertex (cached — the grass field matches it). */
export function getIslandGroundColours() {
  if (_cols) return _cols;
  const { h } = getIslandGrid();
  const { nx, nz } = GRID;
  const col = new Float32Array(nx * nz * 3);
  const mix = new Float32Array(nx * nz * 4);
  for (let j = 0; j < nz; j++) {
    const z = GRID.zMin + j * GRID.step;
    for (let i = 0; i < nx; i++) {
      const x = GRID.xMin + i * GRID.step;
      const k = j * nx + i;
      // Far out to sea there's nothing to see: skip the expensive lookups.
      const deepSea = h[k] < -6;
      const c = deepSea ? { col: COL.seabedDeep, mix: [1, 0, 0, 0] } : colourAt(x, z, h[k]);
      col[k * 3] = c.col.r; col[k * 3 + 1] = c.col.g; col[k * 3 + 2] = c.col.b;
      mix[k * 4] = c.mix[0]; mix[k * 4 + 1] = c.mix[1]; mix[k * 4 + 2] = c.mix[2]; mix[k * 4 + 3] = c.mix[3];
    }
  }
  _cols = { col, mix };
  return _cols;
}

function buildChunks() {
  const { h } = getIslandGrid();
  const { nx, nz } = GRID;
  const { col, mix } = getIslandGroundColours();
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
      // A tile that's all deep sea floor is never seen (the ocean is opaque there).
      let maxH = -Infinity;
      for (let j = cj; j <= j1; j++) for (let i = ci; i <= i1; i++) maxH = Math.max(maxH, h[j * nx + i]);
      if (maxH < -4.5) continue;
      const w = i1 - ci + 1, d = j1 - cj + 1;
      const pos = new Float32Array(w * d * 3), c3 = new Float32Array(w * d * 3), n3 = new Float32Array(w * d * 3), m4 = new Float32Array(w * d * 4);
      for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) {
        const gi = ci + i, gj = cj + j, k = gj * nx + gi, o = (j * w + i) * 3, o4 = (j * w + i) * 4;
        pos[o] = GRID.xMin + gi * GRID.step; pos[o + 1] = h[k]; pos[o + 2] = GRID.zMin + gj * GRID.step;
        c3[o] = col[k * 3]; c3[o + 1] = col[k * 3 + 1]; c3[o + 2] = col[k * 3 + 2];
        n3[o] = nor[k * 3]; n3[o + 1] = nor[k * 3 + 1]; n3[o + 2] = nor[k * 3 + 2];
        m4[o4] = mix[k * 4]; m4[o4 + 1] = mix[k * 4 + 1]; m4[o4 + 2] = mix[k * 4 + 2]; m4[o4 + 3] = mix[k * 4 + 3];
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
      geo.setAttribute("aMix", new THREE.BufferAttribute(m4, 4));
      geo.setIndex(idx);
      geo.computeBoundingSphere();
      geo.computeBoundingBox();
      chunks.push(geo);
    }
  }
  return chunks;
}

export function IslandGround({ onTap }) {
  const chunks = useMemo(buildChunks, []);
  const mat = useMemo(() => makeIslandTerrainMaterial(), []);
  return (
    <group>
      {chunks.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} receiveShadow onPointerDown={onTap} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// PATH RIBBONS — cobbled Main Street + school road, sandy island paths, the
// snowy trails and the ash trail, draped over the graded ground (five
// samples across), broken where they meet water or the plaza.
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
function buildRibbons(kind) {
  const pos = [], uv = [], idx = [];
  const ACROSS = [-1, -0.5, 0, 0.5, 1];
  ISLAND_PATHS.forEach((p, pi) => {
    if (p.kind !== kind) return;
    const lift = 0.045 + pi * 0.002;
    const pts = resample(p.pts, 0.7);
    const half = p.hw + (kind === "cobble" ? 0.1 : 0.55);
    let v = 0, base = -1;
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
      const nx = -tz / tl, nz = tx / tl;
      if (i > 0) v += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]) / (half * 2);
      const ok = ACROSS.every((s) => {
        const px = x + nx * half * s, pz = z + nz * half * s;
        return terrainHeight(px, pz) > SEA_Y + 0.02 && islandSolidTopAt(px, pz) === null;
      });
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
export function PathRibbons() {
  const geos = useMemo(() => ({
    cobble: buildRibbons("cobble"), sand: buildRibbons("sand"), snow: buildRibbons("snow"), ash: buildRibbons("ash"),
  }), []);
  const tex = getIslandTextures();
  const common = { roughness: 0.95, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  return (
    <group>
      <mesh geometry={geos.cobble} receiveShadow>
        <meshStandardMaterial map={tex.cobble} {...common} roughness={0.8} />
      </mesh>
      <mesh geometry={geos.sand} receiveShadow>
        <meshStandardMaterial map={tex.sandPath} transparent alphaTest={0.02} depthWrite={false} {...common} />
      </mesh>
      <mesh geometry={geos.snow} receiveShadow>
        <meshStandardMaterial map={tex.snowPath} transparent alphaTest={0.02} depthWrite={false} {...common} />
      </mesh>
      <mesh geometry={geos.ash} receiveShadow>
        <meshStandardMaterial map={tex.ashPath} transparent alphaTest={0.02} depthWrite={false} {...common} />
      </mesh>
    </group>
  );
}

export { ISLAND_SPAWN };
