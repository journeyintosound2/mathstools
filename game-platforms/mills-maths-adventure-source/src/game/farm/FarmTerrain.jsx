import React, { useMemo } from "react";
import * as THREE from "three";

import { clamp, smoothstep, fbm, vnoise } from "../../data/terrainKit.js";
import {
  GRID, getFarmGrid, terrainHeight, nearestPath, waterEdgeDist, outsideFence, farmWaterAt, FARM_PATHS,
  FARM_BRIDGES, ensureFarmStructures, nearestPad, getFarmPads, slopeAt,
} from "../../data/farm/farmTerrain.js";
import {
  FARM_YARD, FARM_MUD, FARM_PADDOCKS, FARM_FIELDS, FARM_HAY_MEADOW, CHALLENGE_FENCE, ROUNDUP_PEN, ROUNDUP_FIELD,
  FARM_SAWMILL, FARM_PACKING_SHED, MILK_AREA, FARM_GRAIN_SILOS, FARM_MILKING_SHED, FARM_SHEARING_SHED, TRADE_AREA,
  FARM_BARN, SHOP_AREA, FARM_ENTRY_ARCH, WEIGH_AREA, BIG_AMBER,
} from "../../data/farm/farmLayout.js";
import { FARM_ORCHARD, FARM_VINEYARD, FARM_VEG_ROWS, paddockDist, fieldQ } from "../../data/farm/farmProps.js";
import { makeFarmTerrainMaterial, getFarmTextures } from "./farmMaterials.js";

/**
 * FARM TERRAIN — the ground you walk on, built from the SAME 1 m grid the
 * Player reads (farmTerrain.js), split into tiles for culling. Everything the
 * ground "is" is baked into the vertex colours: lush valley grass, sun-dried
 * hilltops, grazed paddocks, the pig pen's mud, packed-dirt yards, sawdust at
 * the mill, gravel round the silos, ploughed soil under every crop, the mown
 * stubble of the hay meadow, the creek's muddy banks — and, beyond the white
 * picket fence, the neighbours' patchwork of fields over the rolling hills.
 */
const CHUNK = 64;
const C = (h) => new THREE.Color(h);
const COL = {
  lush: C("#4f9a34"), grass: C("#6db043"), sunny: C("#97c254"), dry: C("#b9bd62"), straw: C("#c9b46a"),
  grazed: C("#86ab4c"), dirt: C("#9a7550"), dirtDark: C("#6e5236"), mud: C("#5a4128"), mudWet: C("#4a3420"),
  sawdust: C("#c9a46c"), gravel: C("#a59a88"), concrete: C("#b4b0a6"), soil: C("#6a4a2e"), soilLight: C("#8a6440"),
  stubble: C("#d6bf6a"), stubbleDark: C("#b49a4e"), sand: C("#cdb684"), bed: C("#7d7058"), bedDeep: C("#5d6650"),
  canola: C("#e8d23a"), lucerne: C("#3f7d34"), fallow: C("#b49a6a"), plough: C("#7a5636"), pasture: C("#7fae49"),
  hedge: C("#3c6a2c"),
};
const tmp = new THREE.Color();
const t2 = new THREE.Color();

function inRect(x, z, cx, cz, w, d, m = 0) {
  return Math.abs(x - cx) <= w / 2 + m && Math.abs(z - cz) <= d / 2 + m;
}
const rectSD = (x, z, cx, cz, w, d) => {
  const ox = Math.abs(x - cx) - w / 2, oz = Math.abs(z - cz) - d / 2;
  return ox > 0 || oz > 0 ? Math.hypot(Math.max(0, ox), Math.max(0, oz)) : Math.max(ox, oz);
};

/** The neighbours' patchwork beyond the fence (rotated field grid). */
function patchwork(x, z) {
  const a = 0.32;
  const u = x * Math.cos(a) + z * Math.sin(a), v = -x * Math.sin(a) + z * Math.cos(a);
  const fu = Math.floor((u + 1000) / 46), fv = Math.floor((v + 1000) / 38);
  const h = Math.abs(Math.sin(fu * 12.9898 + fv * 78.233) * 43758.5453) % 1;
  const pal = [COL.pasture, COL.stubble, COL.plough, COL.canola, COL.lucerne, COL.fallow, COL.pasture, COL.grass];
  const pi = Math.floor(h * pal.length);
  t2.copy(pal[pi]);
  // Ploughed / cropped fields get rows; hedgerows darken the field edges.
  const lu = ((u + 1000) % 46) / 46, lv = ((v + 1000) % 38) / 38;
  if (pi >= 1 && pi <= 4) t2.multiplyScalar(0.9 + 0.1 * Math.sin(lu * 46 * 3.2));
  const edge = Math.min(lu, 1 - lu, lv, 1 - lv);
  t2.lerp(COL.hedge, (1 - smoothstep(0.0, 0.05, edge)) * 0.7);
  return t2;
}

function vertexColour(x, z, h, water) {
  const out = outsideFence(x, z);
  const n1 = fbm(x / 34, z / 34, 2, 61);
  const n2 = vnoise(x / 6, z / 6, 62);
  // Pasture: lush in the low, damp ground → sun-dried golden-green on the tops.
  tmp.copy(COL.lush).lerp(COL.grass, smoothstep(0.25, 0.6, n1));
  tmp.lerp(COL.sunny, smoothstep(0.55, 0.85, n1) * 0.7);
  tmp.lerp(COL.dry, smoothstep(7, 15, h) * 0.45 + smoothstep(0.62, 0.8, n2) * 0.12);
  // Beyond the fence: the patchwork (fading in past the fence's verge).
  if (out > 2) tmp.lerp(patchwork(x, z), smoothstep(2, 12, out) * 0.85);
  if (out > -2) return tmp;

  // Paddocks: grazed shorter (a touch paler) with worn dirt round the gates.
  for (const p of FARM_PADDOCKS) {
    const e = paddockDist(p, x, z);
    if (e > 0.5) continue;
    if (p.id === "pig-pen") {
      tmp.lerp(COL.dirt, 0.55 + 0.25 * n2);
      const dm = Math.hypot(x - FARM_MUD.center[0], z - FARM_MUD.center[1]);
      if (dm < FARM_MUD.radius + 1.5) tmp.lerp(COL.mudWet, 1 - smoothstep(FARM_MUD.radius - 1.5, FARM_MUD.radius + 1.5, dm));
    } else if (p.id === "chook-run") {
      tmp.lerp(COL.dirt, 0.35 + 0.45 * smoothstep(0.35, 0.7, n2));
    } else if (p.id === "veggie-garden") {
      tmp.lerp(COL.grazed, 0.5);
    } else {
      tmp.lerp(COL.grazed, 0.6).lerp(COL.dirt, smoothstep(0.62, 0.8, vnoise(x / 3, z / 3, 66)) * 0.35);
    }
  }
  // The sorting pen + the herd field: trampled.
  if (inRect(x, z, ROUNDUP_PEN.x, ROUNDUP_PEN.z, ROUNDUP_PEN.w, ROUNDUP_PEN.d)) tmp.lerp(COL.dirt, 0.8);
  if (x > ROUNDUP_FIELD.x1 - 1 && x < ROUNDUP_FIELD.x2 + 1 && z > ROUNDUP_FIELD.z1 - 1 && z < ROUNDUP_FIELD.z2 + 1) tmp.lerp(COL.grazed, 0.45);

  // Yards: packed dirt round the homestead, worn at the busy stations.
  {
    const d = Math.hypot(x - FARM_YARD.center[0], z - FARM_YARD.center[1]);
    const ragged = FARM_YARD.radius + (vnoise(x / 2.5, z / 2.5, 67) - 0.5) * 2.5;
    if (d < ragged + 2) tmp.lerp(COL.dirt, (1 - smoothstep(ragged - 2, ragged + 2, d)) * (0.85 + 0.1 * n2));
    // The barn's apron + the drive's end.
    const apron = rectSD(x, z, FARM_BARN.x, FARM_BARN.z + FARM_BARN.d / 2 + 3, FARM_BARN.w * 0.7, 6);
    if (apron < 2) tmp.lerp(COL.dirtDark, (1 - smoothstep(-1, 2, apron)) * 0.6);
  }
  const yard = (cx, cz, w, d, col, k = 0.85, soft = 3) => {
    const e = rectSD(x, z, cx, cz, w, d) + (vnoise(x / 2.2, z / 2.2, 68) - 0.5) * 1.6;
    if (e < soft) tmp.lerp(col, (1 - smoothstep(-soft * 0.4, soft, e)) * k);
  };
  yard(FARM_SAWMILL.x, FARM_SAWMILL.z, FARM_SAWMILL.w + 6, FARM_SAWMILL.d + 6, COL.sawdust, 0.8);
  yard(FARM_PACKING_SHED.x, FARM_PACKING_SHED.z + 1, FARM_PACKING_SHED.w + 4, FARM_PACKING_SHED.d + 5, COL.gravel, 0.75);
  yard(MILK_AREA.x, MILK_AREA.z - 4, 16, 12, COL.concrete, 0.6);
  yard(FARM_MILKING_SHED.x, FARM_MILKING_SHED.z, FARM_MILKING_SHED.w + 3, FARM_MILKING_SHED.d + 3, COL.concrete, 0.7);
  for (const [sx, sz, sr] of FARM_GRAIN_SILOS) yard(sx, sz, sr * 2 + 5, sr * 2 + 5, COL.gravel, 0.8);
  yard(74, -36, 6, 12, COL.concrete, 0.7);
  yard(WEIGH_AREA.x, WEIGH_AREA.z, 11, 7, COL.gravel, 0.55);
  yard(FARM_SHEARING_SHED.x - 6, FARM_SHEARING_SHED.z, 10, 10, COL.dirt, 0.65);
  yard(SHOP_AREA.x, SHOP_AREA.z + 2, 11, 9, COL.gravel, 0.5);
  yard(TRADE_AREA.x, TRADE_AREA.z, 14, 9, COL.grazed, 0.5);
  yard(FARM_ENTRY_ARCH.position[0], FARM_ENTRY_ARCH.position[1], 12, 6, COL.gravel, 0.5);
  // Fallen liquid-amber leaves on the market green.
  {
    const d = Math.hypot(x - BIG_AMBER.position[0], z - BIG_AMBER.position[1]);
    if (d < 7) tmp.lerp(C("#c4652e"), (1 - smoothstep(3, 7, d)) * 0.55 * (0.6 + 0.4 * vnoise(x * 1.3, z * 1.3, 69)));
  }

  // Crops: ploughed soil under every field (with row stripes).
  for (const f of FARM_FIELDS) {
    const q = fieldQ(f, x, z);
    if (q > 1.12) continue;
    const k = 1 - smoothstep(0.92, 1.12, q);
    if (f.kind === "wheat") {
      tmp.lerp(COL.stubble, k * 0.85);
    } else {
      const ang = f.kind === "lavender" ? 0.15 : f.kind === "corn" ? -0.1 : 0;
      const v = -(x - f.c[0]) * Math.sin(ang) + (z - f.c[1]) * Math.cos(ang);
      const rowSp = f.kind === "corn" ? 1.5 : f.kind === "lavender" ? 1.9 : 1.7;
      const stripe = 0.5 + 0.5 * Math.cos((v / rowSp) * Math.PI * 2);
      t2.copy(COL.soil).lerp(COL.soilLight, stripe * 0.5);
      tmp.lerp(t2, k * 0.9);
    }
  }
  // The veggie rows, the orchard's mown alleys, the vineyard's strips.
  const block = (b, m) => x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m;
  if (block(FARM_VEG_ROWS, 1)) {
    const stripe = 0.5 + 0.5 * Math.cos(((z - FARM_VEG_ROWS.z0) / FARM_VEG_ROWS.rowGap) * Math.PI * 2);
    tmp.lerp(t2.copy(COL.soil).lerp(COL.soilLight, stripe * 0.4), 0.9);
  }
  if (block(FARM_ORCHARD, 2)) {
    const stripe = 0.5 + 0.5 * Math.cos(((x - FARM_ORCHARD.x0) / FARM_ORCHARD.rowGap) * Math.PI * 2);
    tmp.lerp(COL.grazed, 0.35).lerp(COL.lush, stripe * 0.25);
  }
  if (block(FARM_VINEYARD, 1)) {
    const ang = -0.35;
    const v = -(x - (FARM_VINEYARD.x0 + FARM_VINEYARD.x1) / 2) * Math.sin(ang) + (z - (FARM_VINEYARD.z0 + FARM_VINEYARD.z1) / 2) * Math.cos(ang);
    const stripe = 0.5 + 0.5 * Math.cos((v / FARM_VINEYARD.rowGap) * Math.PI * 2);
    tmp.lerp(COL.soilLight, smoothstep(0.55, 0.95, stripe) * 0.65);
  }
  // The hay meadow north of the Long Paddock: mown stubble with windrows.
  {
    const M = FARM_HAY_MEADOW;
    const q = Math.hypot((x - M.c[0]) / (M.rx + 8), (z - M.c[1]) / (M.rz + 5));
    if (q < 1.1) {
      const k = 1 - smoothstep(0.85, 1.1, q);
      const stripe = 0.5 + 0.5 * Math.cos((x / 3.2) * Math.PI * 2);
      t2.copy(COL.stubble).lerp(COL.stubbleDark, stripe * 0.6);
      tmp.lerp(t2, k * 0.8);
    }
  }
  // The Long Paddock itself: a freshly mown strip either side of the fence.
  {
    const e = rectSD(x, z, (CHALLENGE_FENCE.x1 + CHALLENGE_FENCE.x2) / 2, CHALLENGE_FENCE.z, CHALLENGE_FENCE.x2 - CHALLENGE_FENCE.x1 + 8, 10);
    if (e < 2) {
      const stripe = 0.5 + 0.5 * Math.cos((z / 2.2) * Math.PI * 2);
      tmp.lerp(t2.copy(COL.sunny).lerp(COL.grass, stripe * 0.5), (1 - smoothstep(-1, 2, e)) * 0.6);
    }
  }
  // Worn grass on every level pad's middle (people stand + walk there).
  {
    const pd = nearestPad(x, z);
    if (pd.e < 0 && pd.id !== "homestead" && pd.id !== "summit") tmp.lerp(COL.grazed, smoothstep(0, -6, pd.e) * 0.3);
  }
  // Tracks (the ribbon covers them; this keeps their verges earthy).
  const np = nearestPath(x, z);
  if (np && np.e < 1.0) tmp.lerp(COL.dirt, (1 - smoothstep(-0.6, 1.0, np.e)) * 0.8);
  // Cut banks read as earth (the shader adds texture).
  const sl = slopeAt(x, z);
  if (sl > 0.45) tmp.lerp(COL.dirtDark, smoothstep(0.45, 0.8, sl) * 0.35);
  // Water's edge: mud, then the stony bed seen through the water.
  const we = waterEdgeDist(x, z);
  if (we < 2.4) {
    tmp.lerp(COL.mud, (1 - smoothstep(-0.4, 2.4, we)) * 0.75);
    if (!Number.isNaN(water) && h < water - 0.02) {
      const depth = Math.min(1, (water - h) / 0.6);
      tmp.copy(COL.bed).lerp(COL.bedDeep, depth).multiplyScalar(0.85 + 0.3 * n2);
    }
  }
  return tmp;
}

let _cols = null;
/** The ground colour of every grid vertex (cached — the grass field matches it). */
export function getGroundColours() {
  if (_cols) return _cols;
  ensureFarmStructures();
  const { h, water } = getFarmGrid();
  const { nx, nz } = GRID;
  _cols = new Float32Array(nx * nz * 3);
  for (let j = 0; j < nz; j++) {
    const z = GRID.zMin + j * GRID.step;
    for (let i = 0; i < nx; i++) {
      const x = GRID.xMin + i * GRID.step;
      const k = j * nx + i;
      const c = vertexColour(x, z, h[k], water[k]);
      _cols[k * 3] = c.r; _cols[k * 3 + 1] = c.g; _cols[k * 3 + 2] = c.b;
    }
  }
  return _cols;
}

function buildChunks() {
  ensureFarmStructures();
  const { h } = getFarmGrid();
  const { nx, nz } = GRID;
  const col = getGroundColours();
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

export function FarmGround({ onTap }) {
  const chunks = useMemo(buildChunks, []);
  const mat = useMemo(() => makeFarmTerrainMaterial(), []);
  return (
    <group>
      {chunks.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} receiveShadow onPointerDown={onTap} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// FARM TRACK RIBBONS — two-wheel dirt tracks draped over the graded ground
// (five samples across), broken where they meet water (the bridges carry them).
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
  for (const b of FARM_BRIDGES) {
    const dx = b.to[0] - b.from[0], dz = b.to[1] - b.from[1];
    const L2 = dx * dx + dz * dz;
    const t = ((x - b.from[0]) * dx + (z - b.from[1]) * dz) / L2;
    if (t < 0.02 || t > 0.98) continue;
    if (Math.hypot(x - (b.from[0] + dx * t), z - (b.from[1] + dz * t)) < b.halfWidth + 1.2) return true;
  }
  return false;
}
function buildTrackRibbons() {
  ensureFarmStructures();
  const pos = [], uv = [], idx = [];
  const ACROSS = [-1, -0.5, 0, 0.5, 1];
  FARM_PATHS.forEach((p, pi) => {
    const lift = 0.04 + pi * 0.002;
    const pts = resample(p.pts, 0.8);
    const half = p.hw + 0.45;
    let v = 0, base = -1;
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
      const nx = -tz / tl, nz = tx / tl;
      if (i > 0) v += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]) / (half * 2);
      const ok = ACROSS.every((s) => farmWaterAt(x + nx * half * s, z + nz * half * s) === null) && !onBridge(x, z);
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
export function TrackRibbons() {
  const geo = useMemo(buildTrackRibbons, []);
  const tex = getFarmTextures().track;
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial map={tex} roughness={0.97} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
    </mesh>
  );
}

/** Pads → their worn-centre helper is in vertexColour; exported for the scenery. */
export { getFarmPads, clamp };
