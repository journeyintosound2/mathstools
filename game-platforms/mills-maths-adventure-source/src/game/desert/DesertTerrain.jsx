import React, { useMemo } from "react";
import * as THREE from "three";

import { smoothstep, fbm, vnoise } from "../../data/terrainKit.js";
import {
  GRID, getDesertGrid, nearestTrail, nearestPad, quicksandAt, outsideRim, slopeAt, duneFieldAt, rimDuneness,
  DESERT_TRAILS, terrainHeight, structureTopAt, ensureDesertStructures, getMesas, getButtes, POOL_LEVEL, poolEdgeDist, onPad,
} from "../../data/desert/desertTerrain.js";
import { DESERT_HORIZON } from "../../data/desert/desertLayout.js";
import { oasisGreen, railDist } from "../../data/desert/desertProps.js";
import { makeDesertTerrainMaterial, makeStrataMaterial, getDesertTextures } from "./desertMaterials.js";

/**
 * DESERT TERRAIN — the ground you walk on, built from the SAME 1 m grid the
 * Player reads (desertTerrain.js), split into tiles for culling. The ground's
 * look lives in its vertex colours (golden sand, the dune sea's richer
 * orange, damp sand round the quicksand, the oasis's grass + wet shore, the
 * pale crust of the flats, packed sand in the town) — the shader adds the
 * wind ripples, the sparkle and the layered sandstone on every steep face.
 */
const CHUNK = 64;
const C = (h) => new THREE.Color(h);
const COL = {
  sand: C("#e8bf7c"), sandPale: C("#f1d6a2"), sandWarm: C("#e2aa66"), dune: C("#df9d58"), duneCrest: C("#ecb878"),
  damp: C("#b88a58"), crust: C("#ecdcb8"), packed: C("#e6cc9c"), stoneDust: C("#e3cfa4"), mesaTop: C("#c88b5c"),
  rimTop: C("#d29a66"), grass: C("#8fae4f"), grassDark: C("#6f9a3e"), shore: C("#a98a58"), bed: C("#86906a"), bedDeep: C("#4f7466"),
  pink: C("#e9b49c"), dug: C("#c69460"), rail: C("#9c7a52"),
};
const tmp = new THREE.Color();
const t2 = new THREE.Color();

function vertexColour(x, z, h) {
  const n1 = fbm(x / 40, z / 40, 2, 91);
  const n2 = vnoise(x / 6, z / 6, 92);
  tmp.copy(COL.sand).lerp(COL.sandPale, smoothstep(0.45, 0.75, n1) * 0.7).lerp(COL.sandWarm, smoothstep(0.6, 0.85, n2) * 0.25);
  // The dunes: a richer orange, paler along the crests (the slope tells).
  const df = duneFieldAt(x, z);
  if (df.m > 0) {
    tmp.lerp(COL.dune, df.m * 0.7);
    tmp.lerp(COL.duneCrest, df.m * smoothstep(0.25, 0.05, slopeAt(x, z)) * 0.25);
  }
  const rim = outsideRim(x, z);
  if (rim > -2) {
    tmp.lerp(rimDuneness(x, z) > 0.5 ? COL.dune : COL.rimTop, smoothstep(-2, 10, rim) * 0.7);
    return tmp;
  }
  // Mesa + butte tops.
  for (const m of [...getMesas(), ...getButtes()]) {
    if (Math.abs(x - m.c[0]) > m.rx + 2 || Math.abs(z - m.c[1]) > m.rz + 2) continue;
    if (Math.abs(h - m.top) < 0.3) tmp.lerp(COL.mesaTop, 0.8);
  }
  // Pads: packed sand in the town, stone dust round the pyramid + temple,
  // the pale crust of the quicksand flats, pink sand in the crystal hollow.
  const pd = nearestPad(x, z);
  if (pd.e < 3) {
    const k = 1 - smoothstep(-2, 3, pd.e);
    if (pd.id === "town" || pd.id === "arrival") tmp.lerp(COL.packed, k * 0.6);
    else if (pd.id === "pyramid" || pd.id === "plaza" || pd.id === "temple") tmp.lerp(COL.stoneDust, k * 0.65);
    else if (pd.id === "flats") tmp.lerp(COL.crust, k * (0.55 + 0.3 * n2));
    else if (pd.id === "crystal") tmp.lerp(COL.pink, k * 0.55);
    else if (pd.id === "fossil") tmp.lerp(COL.dug, k * 0.5 * (0.6 + 0.4 * n2));
    else if (pd.id === "sundial") tmp.lerp(COL.stoneDust, k * 0.35);
  }
  // Trail verges (the ribbon draws the trail itself).
  const nt = nearestTrail(x, z);
  if (nt && nt.e < 1.2) tmp.lerp(COL.packed, (1 - smoothstep(-0.5, 1.2, nt.e)) * 0.45);
  // The mine-cart rails' bed.
  if (railDist(x, z) < 1.6) tmp.lerp(COL.rail, (1 - smoothstep(0.6, 1.6, railDist(x, z))) * 0.5);
  // Damp sand round the quicksand (the pit itself is its own surface).
  const q = quicksandAt(x, z);
  if (q && q.sdf < 3.5) tmp.lerp(COL.damp, (1 - smoothstep(-0.5, 3.5, q.sdf)) * 0.8);
  // The oasis: grass round the pool, a wet shore, the clear bed beneath.
  if (onPad("oasis", x, z, -3)) {
    const g = oasisGreen(x, z);
    if (g > 0) { t2.copy(COL.grass).lerp(COL.grassDark, smoothstep(0.4, 0.8, n2)); tmp.lerp(t2, g * 0.85); }
    const pe = poolEdgeDist(x, z);
    if (pe < 1.6) tmp.lerp(COL.shore, (1 - smoothstep(-0.4, 1.6, pe)) * 0.8);
    if (h < POOL_LEVEL - 0.02) tmp.copy(COL.bed).lerp(COL.bedDeep, Math.min(1, (POOL_LEVEL - h) / 0.6));
  }
  return tmp;
}

let _cols = null;
export function getDesertGroundColours() {
  if (_cols) return _cols;
  ensureDesertStructures();
  const { h } = getDesertGrid();
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
  const { h } = getDesertGrid();
  const { nx, nz } = GRID;
  const col = getDesertGroundColours();
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

export function DesertGround({ onTap }) {
  const chunks = useMemo(buildChunks, []);
  const mat = useMemo(() => makeDesertTerrainMaterial(), []);
  return (
    <group>
      {chunks.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} receiveShadow onPointerDown={onTap} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// TRAIL RIBBONS — draped over the graded ground; cobbles down the bazaar
// street, stone slabs round the pyramid + up the avenue, caravan tracks
// elsewhere. Broken wherever a structure (a stair, the boardwalk) carries you.
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
function buildTrailRibbons(kind) {
  ensureDesertStructures();
  const pos = [], uv = [], idx = [];
  const ACROSS = [-1, -0.5, 0, 0.5, 1];
  DESERT_TRAILS.filter((p) => p.kind === kind).forEach((p, pi) => {
    const lift = 0.035 + pi * 0.003 + (kind === "paved" ? 0.01 : 0);
    const pts = resample(p.pts, 0.8);
    const half = p.hw + 0.45;
    let v = 0, base = -1;
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i];
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
      const nx = -tz / tl, nz = tx / tl;
      if (i > 0) v += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]) / (kind === "sand" ? half * 2 : 4);
      const ok = ACROSS.every((s) => {
        const px = x + nx * half * s, pz = z + nz * half * s;
        const st = structureTopAt(px, pz);
        const q = quicksandAt(px, pz);
        return (st === null || st < terrainHeight(px, pz) + 0.05) && !(q && q.sdf < 0.3);
      });
      if (!ok) { base = -1; continue; }
      const vi = pos.length / 3;
      ACROSS.forEach((s) => {
        const px = x + nx * half * s, pz = z + nz * half * s;
        pos.push(px, terrainHeight(px, pz) + lift, pz);
        uv.push(kind === "sand" ? (s + 1) / 2 : ((s + 1) / 2) * (half * 2) / 4, v);
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
  const geos = useMemo(() => ({ sand: buildTrailRibbons("sand"), paved: buildTrailRibbons("paved"), stone: buildTrailRibbons("stone") }), []);
  const tex = getDesertTextures();
  const common = { side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  return (
    <group>
      <mesh geometry={geos.sand} receiveShadow><meshStandardMaterial map={tex.track} roughness={0.95} {...common} /></mesh>
      <mesh geometry={geos.paved} receiveShadow><meshStandardMaterial map={tex.cobbles} roughness={0.85} {...common} /></mesh>
      <mesh geometry={geos.stone} receiveShadow><meshStandardMaterial map={tex.slabs} roughness={0.8} {...common} /></mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// THE HORIZON — buttes + mesas standing out in the haze past the rim, and a
// tableland ring under them so the world never ends in a void.
// ---------------------------------------------------------------------------
function buttGeometry(seed, r, h) {
  const pts = [];
  const n = 26;
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    // Steep layered sides: a few ledges stepping in toward the top.
    const k = 1 - 0.18 * Math.floor(t * 3) / 3 - 0.05 * t;
    pts.push(new THREE.Vector2(r * k * (1 + 0.04 * Math.sin(i * 2.1 + seed)), t * h));
  }
  pts.push(new THREE.Vector2(0, h));
  const g = new THREE.LatheGeometry(pts, n);
  // Roughen the outline (no perfect cylinders).
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const k = 1 + 0.12 * Math.sin(a * 3 + seed) + 0.07 * Math.sin(a * 7 - seed * 2) + 0.04 * Math.sin(y * 0.5 + a * 5);
    p.setX(i, x * k); p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}
export function DesertHorizon() {
  const mat = useMemo(() => makeStrataMaterial({ tint: "#f4e6d6", key: "horizon" }), []);
  const butt = useMemo(() => DESERT_HORIZON.map(([x, z, r, h], i) => ({ x, z, h, geo: buttGeometry(i * 1.7, r, h) })), []);
  const ring = useMemo(() => {
    const g = new THREE.RingGeometry(205, 1100, 64, 2);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={ring} position={[0, 20, 0]}>
        <meshStandardMaterial color="#d6ad7a" roughness={1} />
      </mesh>
      {butt.map((b, i) => (
        <mesh key={i} geometry={b.geo} material={mat} position={[b.x, 16, b.z]} />
      ))}
    </group>
  );
}
