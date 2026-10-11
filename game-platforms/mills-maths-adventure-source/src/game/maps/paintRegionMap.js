import * as THREE from "three";

import { regionMapSpec, regionMapPois, worldToMap } from "../../data/maps/regionMaps.js";
// Number Island
import {
  getIslandGrid, GRID as I_GRID, terrainHeight as iHeight, isLavaAt as iLava, ISLAND_PATHS, PLAZA_BASE_Y,
} from "../../data/island/islandTerrain.js";
import { PLAZA, COTTAGES, SCHOOLHOUSE, LIGHTHOUSE, FARM_BARN, ISLAND_JETTY, ROPE_BRIDGE as I_ROPE } from "../../data/island/islandLayout.js";
import { getIslandProps } from "../../data/island/islandProps.js";
import { getIslandGroundColours } from "../island/IslandTerrain.jsx";
// Fraction Farm
import { getFarmGrid, GRID as F_GRID, terrainHeight as fHeight, FARM_PATHS, FARM_CREEK, FARM_BRIDGES, ensureFarmStructures } from "../../data/farm/farmTerrain.js";
import { BOUNDARY_FENCE, FARM_POND } from "../../data/farm/farmLayout.js";
import { FARM_FOOTPRINTS, getFarmProps } from "../../data/farm/farmProps.js";
import { getGroundColours as getFarmColours } from "../farm/FarmTerrain.jsx";
// Snowball Sums
import {
  getSnowGrid, GRID as S_GRID, terrainHeight as sHeight, SNOW_TRAILS, FROZEN_RIVER, SNOW_CHUTE_PATHS, LIFT, lakeEdgeDist, ensureSnowStructures,
} from "../../data/snow/snowTerrain.js";
import { SNOW_BOUNDARY, SNOW_LODGE } from "../../data/snow/snowLayout.js";
import { getSnowProps } from "../../data/snow/snowProps.js";
import { getSnowGroundColours } from "../snow/SnowTerrain.jsx";
// Magma Multiples
import {
  getLandGrid, GRID as M_GRID, magmaGroundHeight, magmaIsLava, MAGMA_PATHS, MAGMA_BRIDGES, MAGMA_CHALLENGE_SPOTS, MAGMA_PLAZA, VOLCANO,
  trailPoint,
} from "../../data/magma/magmaLayout.js";
// Emerald Jungle
import {
  getJungleGrid, GRID as J_GRID, terrainHeight as jHeight, slopeAt as jSlope, JUNGLE_PATHS, JUNGLE_SPOTS, GREAT_TREE, ARRIVAL_GLADE,
} from "../../data/jungle/jungleLayout.js";
import { getJungleProps } from "../../data/jungle/jungleProps.js";
// The Playground
import { terrainHeight as yHeight, GRID as Y_GRID, getSchoolGrid } from "../../data/schoolyard/schoolyardTerrain.js";
import {
  SCHOOL_PLATFORMS, SCHOOL_BUILDINGS, OVAL, COURTS, COLA, SCHOOL_PATH_CTRL, SKY_PIER, SCHOOL_FENCE,
} from "../../data/schoolyard/schoolyardLayout.js";
import { rectCorners } from "../../data/schoolyard/schoolyardGeom.js";
import { SCHOOL_TREES } from "../../data/schoolyard/schoolyardProps.js";
import { schoolGroundColour } from "../schoolyard/SchoolGround.jsx";

/**
 * WORLD MAP PAINTER (2026-10-10) — one painted map per world, used by the
 * full-screen map viewer (ui/map/MapViewer.jsx) and the map boards by each
 * spawn. The look is an explorer's map: the world's own ground colours,
 * hill-shaded from the north-west with faint contour lines, water and lava
 * drawn bold, trails as cream ribbons, trees as canopy dabs and buildings as
 * roofs — then (boards only) the title, the numbered challenge pins and the
 * area names. The viewer draws its pins + labels in HTML so they stay crisp
 * at every zoom.
 *
 * Painting happens once per world and is cached.
 */

const LONG_SIDE = 2048; // canvas px on the map's long side
const RES = 1.6; // raster samples per metre (upscaled smoothly; the vectors stay crisp)

const srgb = (v) => Math.max(0, Math.min(255, Math.round(Math.pow(Math.max(0, v), 1 / 2.2) * 255)));
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function hash2(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
/** Smooth value noise (0..1) — bilinear over a hashed lattice. */
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const fx = x - xi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash2(xi, zi), b = hash2(xi + 1, zi), c = hash2(xi, zi + 1), d = hash2(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function gridIndex(G, x, z) {
  const nx = G.nx ?? Math.round((G.xMax - G.xMin) / G.step) + 1;
  const nz = G.nz ?? Math.round((G.zMax - G.zMin) / G.step) + 1;
  const i = Math.round((x - G.xMin) / G.step), j = Math.round((z - G.zMin) / G.step);
  if (i < 0 || j < 0 || i >= nx || j >= nz) return -1;
  return j * nx + i;
}

// ---------------------------------------------------------------------------
// GROUND — per world: height (for the shading) + colour (sRGB 0..255) +
// whether the spot is water/lava (no contours, flat shading).
// ---------------------------------------------------------------------------
const SEA_SHALLOW = hex("#7fd6d8"), SEA_DEEP = hex("#2c7fb8");
const LAVA_HOT = hex("#ffb13b"), LAVA_DEEP = hex("#e0451c");
const WATER = hex("#4fa6d6"), ICE = hex("#cde9f7"), LAKE = hex("#3f86c4");

const GROUND = {
  "island-1": () => {
    const { h } = getIslandGrid();
    const { col, mix } = getIslandGroundColours();
    return (x, z) => {
      const k = gridIndex(I_GRID, x, z);
      const y = iHeight(x, z);
      if (k < 0) return { h: 0, c: SEA_DEEP, wet: true };
      if (y < -0.05) return { h: 0, c: mixc(SEA_SHALLOW, SEA_DEEP, Math.min(1, -h[k] / 7)), wet: true };
      if (iLava(x, z)) return { h: y, c: mixc(LAVA_HOT, LAVA_DEEP, vnoise(x / 3, z / 3) * 0.7), wet: true };
      if (mix[k * 4 + 1] > 0.5) return { h: y, c: [244, 248, 255] };
      return { h: y, c: [srgb(col[k * 3]), srgb(col[k * 3 + 1]), srgb(col[k * 3 + 2])] };
    };
  },
  "farm-parts-whole": () => {
    ensureFarmStructures();
    const { water } = getFarmGrid();
    const col = getFarmColours();
    return (x, z) => {
      const k = gridIndex(F_GRID, x, z);
      const y = fHeight(x, z);
      if (k < 0) return { h: y, c: [120, 150, 90] };
      if (water[k] > y + 0.05) return { h: water[k], c: WATER, wet: true };
      return { h: y, c: [srgb(col[k * 3]), srgb(col[k * 3 + 1]), srgb(col[k * 3 + 2])] };
    };
  },
  "snow-sums": () => {
    ensureSnowStructures();
    getSnowGrid();
    const col = getSnowGroundColours();
    return (x, z) => {
      const k = gridIndex(S_GRID, x, z);
      const y = sHeight(x, z);
      if (lakeEdgeDist(x, z) < 0) return { h: 0, c: LAKE, wet: true };
      if (k < 0) return { h: y, c: [236, 242, 250] };
      return { h: y, c: [srgb(col[k * 3]), srgb(col[k * 3 + 1]), srgb(col[k * 3 + 2])] };
    };
  },
  "magma-multiples": () => {
    getLandGrid();
    const BASALT = hex("#55504c"), BASALT_HI = hex("#7a7068"), ASH = hex("#9a8f86"), CONE = hex("#6a5a52"), SCORCH = hex("#2e2724");
    return (x, z) => {
      const r = Math.hypot(x, z);
      if (magmaIsLava(x, z)) {
        const f = vnoise(x / 9 + Math.sin(z / 13), z / 9) * 0.65 + vnoise(x / 3.5, z / 3.5) * 0.35;
        return { h: 0, c: mixc(LAVA_HOT, LAVA_DEEP, 0.15 + f * 0.75), wet: true };
      }
      const y = magmaGroundHeight(x, z);
      if (r < VOLCANO.rBase) {
        const t = Math.min(1, y / VOLCANO.height);
        return { h: y, c: r < VOLCANO.rCrater ? LAVA_DEEP : mixc(CONE, BASALT_HI, t * 0.8) };
      }
      const n = vnoise(x / 7, z / 7);
      let c = mixc(BASALT, BASALT_HI, n * 0.7);
      if (n > 0.7) c = mixc(c, ASH, 0.5);
      // (The scorched bank next to the lava is darkened in the shading pass.)
      return { h: y, c, scorch: SCORCH };
    };
  },
  "emerald-jungle": () => {
    const { water } = getJungleGrid();
    const LOW = hex("#79b552"), MID = hex("#5f9f45"), HIGH = hex("#4d8a3c"), ROCK = hex("#8f8a7a"), SAND = hex("#d9c58f");
    return (x, z) => {
      const k = gridIndex(J_GRID, x, z);
      const y = jHeight(x, z);
      if (k >= 0 && !Number.isNaN(water[k]) && water[k] > y + 0.03) return { h: water[k], c: mixc(hex("#5fb4c9"), hex("#2f7f9e"), Math.min(1, (water[k] - y) / 0.8)), wet: true };
      const t = Math.max(0, Math.min(1, (y - 2) / 22));
      let c = t < 0.5 ? mixc(LOW, MID, t * 2) : mixc(MID, HIGH, (t - 0.5) * 2);
      const n = vnoise(x / 5, z / 5);
      c = mixc(c, hex("#8cc35e"), n * 0.2);
      const sl = jSlope(x, z);
      if (sl > 0.75) c = mixc(c, ROCK, Math.min(1, (sl - 0.75) * 2.2));
      if (k >= 0 && !Number.isNaN(water[k]) && water[k] > y - 0.4) c = mixc(c, SAND, 0.45);
      if (Math.hypot(x, z) > 176) c = mixc(c, hex("#3f7a34"), 0.6);
      return { h: y, c };
    };
  },
  schoolyard: () => {
    getSchoolGrid();
    const t = new THREE.Color();
    return (x, z) => {
      const y = yHeight(x, z);
      if (y < -0.2) return { h: 0, c: mixc(SEA_SHALLOW, SEA_DEEP, Math.min(1, -y / 5)), wet: true };
      t.copy(schoolGroundColour(x, z, y).col).convertLinearToSRGB();
      return { h: y, c: [t.r * 255, t.g * 255, t.b * 255] };
    };
  },
};

// ---------------------------------------------------------------------------
// OVERLAYS — the vector layer on top of the ground (P = world → canvas px,
// m = canvas px per metre).
// ---------------------------------------------------------------------------
function pline(g, P, pts) {
  g.beginPath();
  pts.forEach(([x, z], i) => {
    const [a, b] = P(x, z);
    if (i) g.lineTo(a, b); else g.moveTo(a, b);
  });
}
function trails(g, P, m, list, { fill = "#efe2c0", edge = "rgba(92,64,34,0.75)", widthOf = (p) => (p.hw || 1.6) * 2 } = {}) {
  g.lineCap = "round"; g.lineJoin = "round";
  for (const p of list) { pline(g, P, p.pts); g.strokeStyle = edge; g.lineWidth = widthOf(p) * m + 3; g.stroke(); }
  for (const p of list) { pline(g, P, p.pts); g.strokeStyle = fill; g.lineWidth = widthOf(p) * m; g.stroke(); }
}
function canopy(g, P, m, trees, { col = "#2f6b2a", hi = "rgba(170,220,120,0.35)", r = 2.4, every = 1 } = {}) {
  let n = 0;
  for (const t of trees) {
    if (n++ % every) continue;
    const [a, b] = P(t.x, t.z);
    const rr = Math.max(2.2, r * (t.s || 1) * m);
    g.fillStyle = "rgba(0,0,0,0.18)";
    g.beginPath(); g.arc(a + rr * 0.25, b + rr * 0.3, rr, 0, Math.PI * 2); g.fill();
    g.fillStyle = col;
    g.beginPath(); g.arc(a, b, rr, 0, Math.PI * 2); g.fill();
    g.fillStyle = hi;
    g.beginPath(); g.arc(a - rr * 0.3, b - rr * 0.32, rr * 0.5, 0, Math.PI * 2); g.fill();
  }
}
function roof(g, P, m, x, z, w, d, rot, col = "#a4432f") {
  const [a, b] = P(x, z);
  g.save(); g.translate(a, b); g.rotate(-rot || 0);
  g.fillStyle = "rgba(0,0,0,0.28)"; g.fillRect((-w / 2) * m + 3, (-d / 2) * m + 4, w * m, d * m);
  g.fillStyle = col; g.fillRect((-w / 2) * m, (-d / 2) * m, w * m, d * m);
  g.strokeStyle = "rgba(40,20,10,0.55)"; g.lineWidth = 2; g.strokeRect((-w / 2) * m, (-d / 2) * m, w * m, d * m);
  g.strokeStyle = "rgba(255,255,255,0.25)"; g.beginPath(); g.moveTo((-w / 2) * m, 0); g.lineTo((w / 2) * m, 0); g.stroke();
  g.restore();
}
const allTrees = (T, skip = () => false) => Object.values(T).flat().filter((t) => !t.deco && !skip(t));

const OVERLAYS = {
  "island-1": (g, P, m) => {
    trails(g, P, m, ISLAND_PATHS.map((p) => ({ pts: p.pts, hw: p.hw * 0.8 })));
    // The raised plaza (an octagon).
    {
      const R = (PLAZA.apothem || 12.5) / Math.cos(Math.PI / 8);
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const [px, pz] = P(PLAZA.center[0] + Math.cos(a) * R, PLAZA.center[1] + Math.sin(a) * R);
        if (i) g.lineTo(px, pz); else g.moveTo(px, pz);
      }
      g.closePath(); g.fillStyle = "#d9cdb4"; g.fill(); g.strokeStyle = "#8a7a5c"; g.lineWidth = 3; g.stroke();
    }
    // Jetty + rope bridge.
    g.lineCap = "butt";
    pline(g, P, [ISLAND_JETTY.from, ISLAND_JETTY.to]); g.strokeStyle = "#8a6038"; g.lineWidth = ISLAND_JETTY.halfWidth * 2 * m; g.stroke();
    pline(g, P, [I_ROPE.from, I_ROPE.to]); g.strokeStyle = "#a0763f"; g.lineWidth = I_ROPE.halfWidth * 2 * m; g.stroke();
    canopy(g, P, m, allTrees(getIslandProps().trees), { col: "#3d7d36", r: 2.0 });
    for (const c of COTTAGES) roof(g, P, m, c.x, c.z, c.w || 6, c.d || 5, c.rotationY || 0, c.roof || "#c0603e");
    roof(g, P, m, SCHOOLHOUSE.x, SCHOOLHOUSE.z, SCHOOLHOUSE.w, SCHOOLHOUSE.d, SCHOOLHOUSE.rotationY, "#b8432f");
    roof(g, P, m, FARM_BARN.x, FARM_BARN.z, FARM_BARN.w, FARM_BARN.d, FARM_BARN.rotationY, "#a33a2a");
    { const [a, b] = P(LIGHTHOUSE.position[0], LIGHTHOUSE.position[1]); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(a, b, LIGHTHOUSE.radius * m, 0, 7); g.fill(); g.strokeStyle = "#d33"; g.lineWidth = 4; g.stroke(); }
    void PLAZA_BASE_Y;
  },
  "farm-parts-whole": (g, P, m) => {
    g.lineCap = "round"; g.lineJoin = "round";
    pline(g, P, FARM_CREEK.pts); g.strokeStyle = "#3f8fc4"; g.lineWidth = 4.2 * m; g.stroke();
    { const [a, b] = P(FARM_POND.center[0], FARM_POND.center[1]); g.fillStyle = "#4f9fd0"; g.beginPath(); g.arc(a, b, FARM_POND.radius * m, 0, 7); g.fill(); }
    trails(g, P, m, FARM_PATHS.map((p) => ({ pts: p.pts, hw: (p.hw || 1.6) * 0.85 })), { fill: "#e3c99a" });
    for (const b of FARM_BRIDGES) { pline(g, P, [b.from, b.to]); g.strokeStyle = "#7a5230"; g.lineCap = "butt"; g.lineWidth = (b.halfWidth || 1.4) * 2 * m; g.stroke(); }
    canopy(g, P, m, allTrees(getFarmProps().trees), { col: "#3f7a2f", r: 2.3 });
    for (const f of FARM_FOOTPRINTS) {
      if (!/barn|house|shed|mill|silo|glass|coop|shop|stall|truck|tank/.test(f.id)) continue;
      if (f.shape === "circle") { const [a, b] = P(f.x, f.z); g.fillStyle = "#b9b2a6"; g.beginPath(); g.arc(a, b, Math.max(3, f.r * m), 0, 7); g.fill(); g.strokeStyle = "#5b544a"; g.lineWidth = 2; g.stroke(); }
      else roof(g, P, m, f.x, f.z, f.w, f.d, f.rot, /glass/.test(f.id) ? "#cfe8e4" : /barn/.test(f.id) ? "#b4402c" : "#8a6a4a");
    }
    g.setLineDash([10, 6]); g.strokeStyle = "rgba(255,255,255,0.9)"; g.lineWidth = 3;
    { const [a, b] = P(-BOUNDARY_FENCE.halfW, -BOUNDARY_FENCE.halfD); const [c, d] = P(BOUNDARY_FENCE.halfW, BOUNDARY_FENCE.halfD); g.strokeRect(a, b, c - a, d - b); }
    g.setLineDash([]);
  },
  "snow-sums": (g, P, m) => {
    g.lineCap = "round"; g.lineJoin = "round";
    pline(g, P, FROZEN_RIVER.pts); g.strokeStyle = "#a9dcf2"; g.lineWidth = 5 * m; g.stroke();
    trails(g, P, m, SNOW_TRAILS.map((p) => ({ pts: p.pts, hw: (p.hw || 1.6) * 0.85 })), { fill: "#f4ead7", edge: "rgba(110,84,58,0.75)" });
    g.setLineDash([12, 7]);
    for (const c of SNOW_CHUTE_PATHS) { pline(g, P, c.pts); g.strokeStyle = "#d0342c"; g.lineWidth = 2.4 * m; g.stroke(); }
    g.setLineDash([6, 6]); pline(g, P, [LIFT.from, LIFT.to]); g.strokeStyle = "#2b2f36"; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
    canopy(g, P, m, allTrees(getSnowProps().trees), { col: "#2d5a45", hi: "rgba(255,255,255,0.55)", r: 2.0 });
    roof(g, P, m, SNOW_LODGE.x, SNOW_LODGE.z, SNOW_LODGE.w, SNOW_LODGE.d, 0, "#3d4a63");
    g.setLineDash([10, 6]); g.strokeStyle = "rgba(40,70,110,0.6)"; g.lineWidth = 3;
    { const [a, b] = P(-SNOW_BOUNDARY.halfW, -SNOW_BOUNDARY.halfD); const [c, d] = P(SNOW_BOUNDARY.halfW, SNOW_BOUNDARY.halfD); g.strokeRect(a, b, c - a, d - b); }
    g.setLineDash([]);
  },
  "magma-multiples": (g, P, m) => {
    // The summit trail spiral.
    {
      const pts = [];
      const span = VOLCANO.turns * Math.PI * 2 + (VOLCANO.landing || 0);
      for (let i = 0; i <= 400; i++) pts.push(trailPoint((i / 400) * span));
      if (pts.length > 2) { g.lineCap = "round"; pline(g, P, pts); g.strokeStyle = "rgba(60,40,30,0.7)"; g.lineWidth = VOLCANO.pathW * m + 3; g.stroke(); pline(g, P, pts); g.strokeStyle = "#b8a48e"; g.lineWidth = VOLCANO.pathW * m * 0.8; g.stroke(); }
    }
    trails(g, P, m, MAGMA_PATHS, { fill: "#c9b49b", edge: "rgba(40,28,22,0.8)", widthOf: (p) => p.hw * 1.7 });
    for (const s of [...MAGMA_CHALLENGE_SPOTS, { center: MAGMA_PLAZA.center, radius: MAGMA_PLAZA.radius }]) {
      const [a, b] = P(s.center[0], s.center[1]);
      g.fillStyle = "#c2ad94"; g.beginPath(); g.arc(a, b, s.radius * m, 0, 7); g.fill();
      g.strokeStyle = "rgba(40,28,22,0.7)"; g.lineWidth = 3; g.stroke();
    }
    g.lineCap = "butt";
    for (const b of MAGMA_BRIDGES) { pline(g, P, [b.from, b.to]); g.strokeStyle = "#3a2f2a"; g.lineWidth = b.halfWidth * 2 * m + 4; g.stroke(); pline(g, P, [b.from, b.to]); g.strokeStyle = "#a08870"; g.lineWidth = b.halfWidth * 2 * m; g.stroke(); }
    // The crater rim.
    { const [a, b] = P(0, 0); g.strokeStyle = "#3b2a22"; g.lineWidth = 5; g.beginPath(); g.arc(a, b, VOLCANO.rCrater * m, 0, 7); g.stroke(); }
  },
  "emerald-jungle": (g, P, m) => {
    trails(g, P, m, JUNGLE_PATHS, { fill: "#e6d3a3", edge: "rgba(84,58,30,0.8)", widthOf: (p) => (p.hw || 1.6) * 1.7 });
    for (const s of JUNGLE_SPOTS) {
      const [a, b] = P(s.center[0], s.center[1]);
      g.fillStyle = "rgba(230,214,168,0.85)"; g.beginPath(); g.arc(a, b, s.radius * m, 0, 7); g.fill();
    }
    { const [a, b] = P(ARRIVAL_GLADE.center[0], ARRIVAL_GLADE.center[1]); g.fillStyle = "rgba(200,230,150,0.9)"; g.beginPath(); g.arc(a, b, ARRIVAL_GLADE.radius * m, 0, 7); g.fill(); }
    canopy(g, P, m, allTrees(getJungleProps().trees, (t) => Math.hypot(t.x, t.z) > 176), { col: "#2c6b2d", hi: "rgba(160,215,110,0.35)", r: 2.2 });
    { const [a, b] = P(GREAT_TREE.center[0], GREAT_TREE.center[1]); g.fillStyle = "#245a26"; g.beginPath(); g.arc(a, b, 11 * m, 0, 7); g.fill(); g.fillStyle = "#6a4a2a"; g.beginPath(); g.arc(a, b, 3.2 * m, 0, 7); g.fill(); }
  },
  schoolyard: (g, P, m) => {
    { const [cx, cz] = P(OVAL.c[0], OVAL.c[1]); g.fillStyle = "#6fb24f"; g.strokeStyle = "#ffffff"; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cz, OVAL.rx * m, OVAL.rz * m, 0, 0, Math.PI * 2); g.fill(); g.stroke(); }
    const fills = { asphalt: "#868a90", pavers: "#cfbea8", grass: "#9ccf7a" };
    for (const p of SCHOOL_PLATFORMS) {
      g.fillStyle = fills[p.surface] || "#aaa";
      pline(g, P, p.pts); g.closePath(); g.fill();
      g.strokeStyle = "#8a4a32"; g.lineWidth = 3; g.stroke();
    }
    g.fillStyle = "#2f6d5c";
    for (const c of COURTS) { const [a, b] = P(c.c[0] - c.hx, c.c[1] - c.hz); g.fillRect(a, b, c.hx * 2 * m, c.hz * 2 * m); }
    g.strokeStyle = "#ffffff"; g.setLineDash([8, 6]); { const [a, b] = P(COLA.c[0] - COLA.hx, COLA.c[1] - COLA.hz); g.strokeRect(a, b, COLA.hx * 2 * m, COLA.hz * 2 * m); } g.setLineDash([]);
    trails(g, P, m, SCHOOL_PATH_CTRL.map((p) => ({ pts: p.ctrl, hw: (p.hw || 1.4) * 0.9 })), { fill: "#d8c4a0" });
    canopy(g, P, m, SCHOOL_TREES, { col: "#3d7a35", r: 2.4 });
    for (const b of SCHOOL_BUILDINGS) {
      const cs = rectCorners(b);
      g.fillStyle = "rgba(0,0,0,0.25)"; pline(g, (x, z) => { const [a, c] = P(x, z); return [a + 4, c + 5]; }, cs); g.closePath(); g.fill();
      g.fillStyle = b.hall ? "#9a2a22" : b.roof?.mat === "tiles" ? "#c0603e" : "#9aa0a4";
      pline(g, P, cs); g.closePath(); g.fill();
      g.strokeStyle = "#5a2a1c"; g.lineWidth = 2; g.stroke();
    }
    g.lineCap = "butt"; pline(g, P, [SKY_PIER.from, SKY_PIER.to]); g.strokeStyle = "#5a5a64"; g.lineWidth = SKY_PIER.halfWidth * 2 * m; g.stroke();
    g.setLineDash([10, 6]); g.strokeStyle = "rgba(30,30,40,0.55)"; g.lineWidth = 3;
    { const [a, b] = P(SCHOOL_FENCE.xMin, SCHOOL_FENCE.zMin); const [c, d] = P(SCHOOL_FENCE.xMax, SCHOOL_FENCE.zMax); g.strokeRect(a, b, c - a, d - b); }
    g.setLineDash([]);
  },
};

// ---------------------------------------------------------------------------
// THE BASE MAP (ground + overlays), cached per world.
// ---------------------------------------------------------------------------
const _cache = new Map();

/** { canvas, W, H, ppm, spec } — the painted map of a world (no pins). */
export function getRegionMapCanvas(regionId) {
  if (_cache.has(regionId)) return _cache.get(regionId);
  if (typeof document === "undefined") return null;
  // Run the whole painting now (the async version spreads it over frames).
  const gen = paintSteps(regionId);
  let r = gen.next();
  while (!r.done) r = gen.next();
  return r.value;
}

const _pending = new Map();
/**
 * The same painting, spread over many short slices (≈10 ms each) so the
 * game keeps running while a world's map is drawn. Resolves to the same
 * cached { canvas, W, H, ppm, spec }.
 */
export function paintRegionMapAsync(regionId, sliceMs = 10) {
  if (_cache.has(regionId)) return Promise.resolve(_cache.get(regionId));
  if (_pending.has(regionId)) return _pending.get(regionId);
  if (typeof document === "undefined") return Promise.resolve(null);
  const p = new Promise((resolve) => {
    const gen = paintSteps(regionId);
    const pump = () => {
      const t0 = performance.now();
      let r = gen.next();
      while (!r.done && performance.now() - t0 < sliceMs) r = gen.next();
      if (r.done) { _pending.delete(regionId); resolve(r.value); } else setTimeout(pump, 0);
    };
    pump();
  });
  _pending.set(regionId, p);
  return p;
}

function* paintSteps(regionId) {
  if (_cache.has(regionId)) return _cache.get(regionId);
  const spec = regionMapSpec(regionId);
  if (!spec || !GROUND[regionId]) return null;
  const { x0, x1, z0, z1 } = spec.bounds;
  const W = spec.aspect >= 1 ? LONG_SIDE : Math.round(LONG_SIDE * spec.aspect);
  const H = spec.aspect >= 1 ? Math.round(LONG_SIDE / spec.aspect) : LONG_SIDE;
  const ppm = W / (x1 - x0);

  // 1) The raster: colour + height at RES samples a metre.
  const res = regionId === "schoolyard" ? 1.5 : RES;
  const sw = Math.ceil((x1 - x0) * res), sh = Math.ceil((z1 - z0) * res);
  const ground = GROUND[regionId]();
  const hs = new Float32Array(sw * sh);
  const cs = new Float32Array(sw * sh * 3);
  const wet = new Uint8Array(sw * sh);
  let scorch = null;
  for (let j = 0; j < sh; j++) {
    const z = z0 + (j + 0.5) / res;
    for (let i = 0; i < sw; i++) {
      const x = x0 + (i + 0.5) / res;
      const s = ground(x, z);
      const k = j * sw + i;
      hs[k] = s.h; cs[k * 3] = s.c[0]; cs[k * 3 + 1] = s.c[1]; cs[k * 3 + 2] = s.c[2]; wet[k] = s.wet ? 1 : 0;
      if (s.scorch) scorch = s.scorch;
    }
    yield;
  }
  // 2) Shade (light from the north-west) + contour lines every 4 m.
  const small = document.createElement("canvas");
  small.width = sw; small.height = sh;
  const sg = small.getContext("2d");
  const img = sg.createImageData(sw, sh);
  const L = [-0.55, 0.62, -0.55];
  const step = 1 / res;
  for (let j = 0; j < sh; j++) {
    for (let i = 0; i < sw; i++) {
      const k = j * sw + i;
      const hL = hs[j * sw + Math.max(0, i - 1)], hR = hs[j * sw + Math.min(sw - 1, i + 1)];
      const hU = hs[Math.max(0, j - 1) * sw + i], hD = hs[Math.min(sh - 1, j + 1) * sw + i];
      let shade = 1;
      if (!wet[k]) {
        const nx = -(hR - hL) / (2 * step), nz = -(hD - hU) / (2 * step);
        const nl = Math.hypot(nx, 1.4, nz);
        const d = (nx * L[0] + 1.4 * L[1] + nz * L[2]) / nl;
        shade = 0.62 + 0.62 * d;
        const c0 = Math.floor(hs[k] / 4);
        if (c0 !== Math.floor(hR / 4) || c0 !== Math.floor(hD / 4)) shade *= 0.86;
        // Lava worlds: land right next to the lava is scorched black.
        if (scorch && (wet[j * sw + Math.max(0, i - 3)] || wet[j * sw + Math.min(sw - 1, i + 3)] || wet[Math.max(0, j - 3) * sw + i] || wet[Math.min(sh - 1, j + 3) * sw + i])) {
          cs[k * 3] = cs[k * 3] * 0.4 + scorch[0] * 0.6; cs[k * 3 + 1] = cs[k * 3 + 1] * 0.4 + scorch[1] * 0.6; cs[k * 3 + 2] = cs[k * 3 + 2] * 0.4 + scorch[2] * 0.6;
        }
      } else {
        // A pale rim where water meets land.
        if (!wet[j * sw + Math.max(0, i - 2)] || !wet[j * sw + Math.min(sw - 1, i + 2)] || !wet[Math.max(0, j - 2) * sw + i] || !wet[Math.min(sh - 1, j + 2) * sw + i]) shade = 1.18;
      }
      const o = k * 4;
      img.data[o] = Math.min(255, cs[k * 3] * shade);
      img.data[o + 1] = Math.min(255, cs[k * 3 + 1] * shade);
      img.data[o + 2] = Math.min(255, cs[k * 3 + 2] * shade);
      img.data[o + 3] = 255;
    }
    if (j % 8 === 0) yield;
  }
  sg.putImageData(img, 0, 0);

  // 3) Upscale onto the map canvas + the vector overlays.
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(small, 0, 0, W, H);
  const P = (x, z) => [(x - x0) * ppm, (z - z0) * ppm];
  yield;
  try {
    OVERLAYS[regionId]?.(g, P, ppm);
  } catch (e) {
    // A missing overlay never stops the map from showing.
    if (typeof console !== "undefined") console.warn("[map] overlay", regionId, e);
  }
  // 4) A soft paper grain + an edge vignette.
  g.globalAlpha = 0.05;
  for (let n = 0; n < 9000; n++) {
    g.fillStyle = n % 2 ? "#000" : "#fff";
    g.fillRect(hash2(n, 1) * W, hash2(n, 2) * H, 2, 2);
  }
  g.globalAlpha = 1;
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, "rgba(60,40,20,0)");
  vg.addColorStop(1, "rgba(60,40,20,0.28)");
  g.fillStyle = vg;
  g.fillRect(0, 0, W, H);

  const out = { canvas: cv, W, H, ppm, spec };
  _cache.set(regionId, out);
  return out;
}

// ---------------------------------------------------------------------------
// PINS (shared look: the viewer draws them in HTML, the boards on canvas).
// ---------------------------------------------------------------------------
export const MEDAL_COLOURS = { gold: "#f2c230", silver: "#c7ced6", bronze: "#cd8a4d", pass: "#2fbf71" };
export function pinColour(p, accent) {
  if (p.kind === "gate") return "#7b4fd6";
  if (p.kind === "trophies") return "#e0a817";
  if (p.kind === "guide") return "#2a9d8f";
  if (p.kind === "place") return "#5b6b7a";
  if (p.kind === "boss") return "#c8102e";
  if (p.soon) return "#9aa3ab";
  return accent;
}

function drawPin(g, x, y, r, p, accent) {
  g.fillStyle = "rgba(0,0,0,0.3)";
  g.beginPath(); g.arc(x + 2, y + 3, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = pinColour(p, accent);
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.lineWidth = Math.max(2, r * 0.18);
  g.strokeStyle = p.medal && MEDAL_COLOURS[p.medal] ? MEDAL_COLOURS[p.medal] : "#ffffff";
  g.stroke();
  g.fillStyle = "#ffffff";
  g.font = `900 ${Math.round(r * 1.05)}px 'MMA Rounded', 'Trebuchet MS', sans-serif`;
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(p.n ? String(p.n) : p.icon || "•", x, y + r * 0.05);
}

/**
 * The map board's texture: the base map in a frame with the title, every
 * pin, area names and "You are here". A THREE texture (cached per world).
 */
const _boards = new Map();
export function regionBoardTexture(regionId, version = 0) {
  const key = `${regionId}:${version}`;
  if (_boards.has(key)) return _boards.get(key);
  const base = getRegionMapCanvas(regionId);
  if (!base) return null;
  const { spec } = base;
  const inner = 960;
  const iw = spec.aspect >= 1 ? inner : Math.round(inner * spec.aspect);
  const ih = spec.aspect >= 1 ? Math.round(inner / spec.aspect) : inner;
  const pad = 26, top = 92;
  const W = iw + pad * 2, H = ih + pad + top;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  g.fillStyle = spec.paper; g.fillRect(0, 0, W, H);
  g.drawImage(base.canvas, pad, top, iw, ih);
  g.strokeStyle = spec.deep; g.lineWidth = 4; g.strokeRect(pad, top, iw, ih);
  g.fillStyle = spec.deep; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = "400 52px 'MMA Display', 'Trebuchet MS', sans-serif";
  g.fillText(spec.title.toUpperCase(), W / 2, 40);
  g.font = "800 22px 'MMA Rounded', 'Trebuchet MS', sans-serif";
  g.fillStyle = "#4a3a2a"; g.fillText("Walk up to open the map · pick a place to set a waypoint", W / 2, 76);
  const M = (x, z) => { const [u, v] = worldToMap(spec, x, z); return [pad + u * iw, top + v * ih]; };
  // Area names.
  g.font = "800 17px 'MMA Rounded', 'Trebuchet MS', sans-serif";
  for (const a of spec.areas) {
    const [x, y] = M(a.at[0], a.at[1]);
    g.lineWidth = 4; g.strokeStyle = "rgba(255,250,235,0.9)"; g.strokeText(a.name, x, y);
    g.fillStyle = "#2d2318"; g.fillText(a.name, x, y);
  }
  // Pins.
  let pois = [];
  try { pois = regionMapPois(regionId, {}); } catch { pois = []; }
  for (const p of pois) {
    const [x, y] = M(p.at[0], p.at[1]);
    drawPin(g, x, y, p.kind === "challenge" ? 15 : 11, p, spec.accent);
  }
  // You are here (the board itself).
  {
    const [x, y] = M(spec.board.position[0], spec.board.position[1]);
    g.fillStyle = "#e63946"; g.beginPath();
    for (let k = 0; k <= 10; k++) {
      const a = -Math.PI / 2 + (k / 10) * Math.PI * 2;
      const r = k % 2 ? 7 : 16;
      if (k) g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); else g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    g.fill(); g.strokeStyle = "#ffffff"; g.lineWidth = 3; g.stroke();
    g.font = "900 18px 'MMA Rounded', 'Trebuchet MS', sans-serif";
    g.lineWidth = 4; g.strokeStyle = "#ffffff"; g.strokeText("YOU ARE HERE", x, y + 28);
    g.fillStyle = "#e63946"; g.fillText("YOU ARE HERE", x, y + 28);
  }
  // North arrow.
  g.save(); g.translate(W - pad - 40, top + 50);
  g.fillStyle = spec.deep; g.beginPath(); g.moveTo(0, -30); g.lineTo(10, 8); g.lineTo(0, 2); g.lineTo(-10, 8); g.closePath(); g.fill();
  g.font = "900 20px 'MMA Rounded', sans-serif"; g.fillText("N", 0, 26);
  g.restore();
  g.strokeStyle = spec.deep; g.lineWidth = 12; g.strokeRect(6, 6, W - 12, H - 12);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const out = { texture: t, aspect: W / H };
  _boards.set(key, out);
  return out;
}
