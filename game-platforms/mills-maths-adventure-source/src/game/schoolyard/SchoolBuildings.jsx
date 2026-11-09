import React, { useMemo } from "react";
import * as THREE from "three";

import { toWorld } from "../../data/schoolyard/schoolyardGeom.js";
import {
  terrainHeight, schoolSolidTopAt, bayRect, roomSpans, roomWalls, ROOM_WALL, ROOM_DOOR_W, verandahRect,
} from "../../data/schoolyard/schoolyardTerrain.js";
import { STOREY, CORRIDOR_W, DECK_T, SCHOOL_BUILDINGS, HALL, LV } from "../../data/schoolyard/schoolyardLayout.js";
import { classroomDesks } from "../../data/schoolyard/schoolyardColliders.js";
import { Kit } from "./schoolKit.js";
import { kitMat, NO_SHADOW_KEYS, schoolSignTexture } from "./schoolMaterials.js";

/**
 * THE SCHOOL'S BUILDINGS — red-brick blocks with aluminium windows (blinds
 * half down), green + blue classroom doors onto the corridors, concrete
 * floor bands, terracotta HIP roofs that run out over the open corridors
 * on cream verandah beams + columns, the big red Colorbond GABLE of the
 * school hall with its skylight stripes, clerestory windows, porch, and the
 * hall INSIDE (timber floor, the stage with its red curtains), the canteen's
 * servery, the front office, the TAS roller doors, the art block's OCEAN
 * MURAL, downpipes + AC units. All merged per material (schoolKit).
 */
const CREAM = "#e9e2cf";
const GALV = "#b9bec2";
const UP = [0, 1, 0], DOWN = [0, -1, 0];

function groundBelow(x, z) {
  const t = terrainHeight(x, z);
  const s = schoolSolidTopAt(x, z);
  return s !== null && s > t ? s : t;
}
const eaveOf = (b) => b.y0 + (b.wallH || b.floors * STOREY);
const axes = (b) => ({ ex: [Math.cos(b.yaw), 0, -Math.sin(b.yaw)], ez: [Math.sin(b.yaw), 0, Math.cos(b.yaw)] });
const P3 = (b, lx, y, lz) => {
  const [x, z] = toWorld(b, lx, lz);
  return [x, y, z];
};
const neg = (v) => [-v[0], -v[1], -v[2]];

/** The four wall faces of a body: centre (local), outward normal (world), half length. */
function facesOf(b) {
  const { ex, ez } = axes(b);
  return [
    { id: "+z", lc: [0, b.hz], n: ez, half: b.hx, along: [1, 0] },
    { id: "-z", lc: [0, -b.hz], n: neg(ez), half: b.hx, along: [-1, 0] },
    { id: "+x", lc: [b.hx, 0], n: ex, half: b.hz, along: [0, -1] },
    { id: "-x", lc: [-b.hx, 0], n: neg(ex), half: b.hz, along: [0, 1] },
  ];
}
/** A local point u along a face (u: −half…half, left → right seen from outside). */
const faceLocal = (f, u, out = 0) => [f.lc[0] + f.along[0] * u + (f.id === "+x" ? out : f.id === "-x" ? -out : 0), f.lc[1] + f.along[1] * u + (f.id === "+z" ? out : f.id === "-z" ? -out : 0)];

/** A rectangle decal on a face (u0…u1 along, y0…y1 up), `out` metres proud. */
function faceRect(kit, key, b, f, u0, u1, y0, y1, out = 0.04, opts = {}) {
  const a = faceLocal(f, u0, out), c = faceLocal(f, u1, out);
  const pts = [P3(b, a[0], y0, a[1]), P3(b, c[0], y0, c[1]), P3(b, c[0], y1, c[1]), P3(b, a[0], y1, a[1])];
  kit.poly(key, pts, { out: f.n, ...opts });
}

// ---------------------------------------------------------------------------
// ROOFS
// ---------------------------------------------------------------------------
function hipRoof(kit, key, b, x0, x1, z0, z1, e, pitch, color) {
  const P = (lx, y, lz) => P3(b, lx, y, lz);
  const W = x1 - x0, D = z1 - z0;
  const o = { out: UP, color };
  let R0, R1;
  if (W >= D) {
    const h = (pitch * D) / 2, zm = (z0 + z1) / 2;
    R0 = P(x0 + D / 2, e + h, zm); R1 = P(x1 - D / 2, e + h, zm);
    kit.poly(key, [P(x0, e, z1), P(x1, e, z1), R1, R0], o);
    kit.poly(key, [P(x1, e, z0), P(x0, e, z0), R0, R1], o);
    kit.poly(key, [P(x0, e, z0), P(x0, e, z1), R0], o);
    kit.poly(key, [P(x1, e, z1), P(x1, e, z0), R1], o);
  } else {
    const h = (pitch * W) / 2, xm = (x0 + x1) / 2;
    R0 = P(xm, e + h, z0 + W / 2); R1 = P(xm, e + h, z1 - W / 2);
    kit.poly(key, [P(x0, e, z0), P(x0, e, z1), R1, R0], o);
    kit.poly(key, [P(x1, e, z1), P(x1, e, z0), R0, R1], o);
    kit.poly(key, [P(x1, e, z0), P(x0, e, z0), R0], o);
    kit.poly(key, [P(x0, e, z1), P(x1, e, z1), R1], o);
  }
  // Ridge + hip capping.
  const cap = "#c98f78";
  kit.beam(key, R0, R1, 0.32, 0.14, { color: cap });
  for (const [cx, cz, R] of [[x0, z0, R0], [x1, z0, W >= D ? R1 : R0], [x1, z1, R1], [x0, z1, W >= D ? R0 : R1]]) {
    kit.beam(key, P(cx, e + 0.02, cz), R, 0.24, 0.1, { color: cap });
  }
  eaveTrim(kit, b, x0, x1, z0, z1, e);
}
function gableRoof(kit, key, b, x0, x1, z0, z1, e, pitch, wall) {
  const P = (lx, y, lz) => P3(b, lx, y, lz);
  const xm = (x0 + x1) / 2, h = (pitch * (x1 - x0)) / 2;
  kit.poly(key, [P(x0, e, z0), P(x0, e, z1), P(xm, e + h, z1), P(xm, e + h, z0)], { out: UP });
  kit.poly(key, [P(x1, e, z1), P(x1, e, z0), P(xm, e + h, z0), P(xm, e + h, z1)], { out: UP });
  kit.beam("metal", P(xm, e + h + 0.02, z0), P(xm, e + h + 0.02, z1), 0.5, 0.12, { color: "#8f2a22" });
  // Gable ends (the wall line), up under the roof.
  const { ez } = axes(b);
  for (const [lz, n] of [[wall.z0, neg(ez)], [wall.z1, ez]]) {
    const yAt = (x) => e + pitch * (x < xm ? x - x0 : x1 - x);
    kit.poly(wall.key, [P(wall.x0, e - 0.05, lz), P(wall.x1, e - 0.05, lz), P(wall.x1, yAt(wall.x1), lz), P(xm, e + h - 0.05, lz), P(wall.x0, yAt(wall.x0), lz)], { out: n });
  }
  eaveTrim(kit, b, x0, x1, z0, z1, e, { gable: true });
  return { xm, h };
}
function skillionRoof(kit, key, b, x0, x1, z0, z1, e, fall, wall, wallKey) {
  const P = (lx, y, lz) => P3(b, lx, y, lz);
  const alongX = fall === "+x" || fall === "-x";
  const span = alongX ? x1 - x0 : z1 - z0;
  const rise = Math.min(1.5, 0.075 * span);
  // y(lx, lz): high on the side away from the fall.
  const yAt = (lx, lz) => {
    if (fall === "+x") return e + rise * (x1 - lx) / span;
    if (fall === "-x") return e + rise * (lx - x0) / span;
    if (fall === "+z") return e + rise * (z1 - lz) / span;
    return e + rise * (lz - z0) / span;
  };
  kit.poly(key, [P(x0, yAt(x0, z1), z1), P(x1, yAt(x1, z1), z1), P(x1, yAt(x1, z0), z0), P(x0, yAt(x0, z0), z0)], { out: UP });
  kit.poly("paint", [P(x0, yAt(x0, z0) - 0.04, z0), P(x1, yAt(x1, z0) - 0.04, z0), P(x1, yAt(x1, z1) - 0.04, z1), P(x0, yAt(x0, z1) - 0.04, z1)], { out: DOWN, color: CREAM });
  // Infill the walls up to the roof line.
  const { ex, ez } = axes(b);
  const { x0: wx0, x1: wx1, z0: wz0, z1: wz1 } = wall;
  kit.poly(wallKey, [P(wx0, e - 0.05, wz1), P(wx1, e - 0.05, wz1), P(wx1, yAt(wx1, wz1), wz1), P(wx0, yAt(wx0, wz1), wz1)], { out: ez });
  kit.poly(wallKey, [P(wx0, e - 0.05, wz0), P(wx1, e - 0.05, wz0), P(wx1, yAt(wx1, wz0), wz0), P(wx0, yAt(wx0, wz0), wz0)], { out: neg(ez) });
  kit.poly(wallKey, [P(wx1, e - 0.05, wz0), P(wx1, e - 0.05, wz1), P(wx1, yAt(wx1, wz1), wz1), P(wx1, yAt(wx1, wz0), wz0)], { out: ex });
  kit.poly(wallKey, [P(wx0, e - 0.05, wz0), P(wx0, e - 0.05, wz1), P(wx0, yAt(wx0, wz1), wz1), P(wx0, yAt(wx0, wz0), wz0)], { out: neg(ex) });
  // Fascia round the roof edge.
  const fz = (lz, nn) => kit.poly("paint", [P(x0, yAt(x0, lz) - 0.22, lz), P(x1, yAt(x1, lz) - 0.22, lz), P(x1, yAt(x1, lz) + 0.03, lz), P(x0, yAt(x0, lz) + 0.03, lz)], { out: nn, color: CREAM });
  fz(z1, ez); fz(z0, neg(ez));
  const fx = (lx, nn) => kit.poly("paint", [P(lx, yAt(lx, z0) - 0.22, z0), P(lx, yAt(lx, z1) - 0.22, z1), P(lx, yAt(lx, z1) + 0.03, z1), P(lx, yAt(lx, z0) + 0.03, z0)], { out: nn, color: CREAM });
  fx(x1, ex); fx(x0, neg(ex));
}
/** Soffit (the ceiling under the eaves) + fascia boards + a gutter. */
function eaveTrim(kit, b, x0, x1, z0, z1, e, { gable = false } = {}) {
  const P = (lx, y, lz) => P3(b, lx, y, lz);
  const { ex, ez } = axes(b);
  kit.poly("paint", [P(x0, e - 0.02, z0), P(x1, e - 0.02, z0), P(x1, e - 0.02, z1), P(x0, e - 0.02, z1)], { out: DOWN, color: CREAM });
  const band = (a, c, n) => kit.poly("paint", [P(a[0], e - 0.24, a[1]), P(c[0], e - 0.24, c[1]), P(c[0], e + 0.03, c[1]), P(a[0], e + 0.03, a[1])], { out: n, color: CREAM });
  band([x0, z1], [x1, z1], ez);
  band([x1, z0], [x0, z0], neg(ez));
  if (!gable) {
    band([x1, z1], [x1, z0], ex);
    band([x0, z0], [x0, z1], neg(ex));
  }
  // Gutters along the long sides.
  const g = (lz, s) => kit.beam("metal", P(x0, e - 0.08, lz + s * 0.07), P(x1, e - 0.08, lz + s * 0.07), 0.14, 0.13, { color: "#d6d3cb" });
  g(z1, 1); g(z0, -1);
}

// ---------------------------------------------------------------------------
// BODIES, WINDOWS, DOORS
// ---------------------------------------------------------------------------
function footOf(b) {
  let g = b.y0;
  for (const f of facesOf(b)) {
    for (const u of [-f.half, 0, f.half]) {
      const [lx, lz] = faceLocal(f, u, 0.6);
      const [x, z] = toWorld(b, lx, lz);
      g = Math.min(g, groundBelow(x, z));
    }
  }
  return g - 0.6;
}
function groundAtFace(b, f, u) {
  const [lx, lz] = faceLocal(f, u, 0.7);
  const [x, z] = toWorld(b, lx, lz);
  return groundBelow(x, z);
}

function addWindowsAndDoors(kit, b) {
  const corridorFloors = b.corridor ? [...(b.corridor.ground ? [0] : []), ...b.corridor.floors] : [];
  const floors = b.floors;
  const fh = b.wallH ? Math.min(b.wallH, 3.6) : STOREY;
  for (const f of facesOf(b)) {
    if (b.mural && f.id === b.mural) continue;
    if (f.id === b.servery || f.id === b.entry || f.id === b.rollerDoors) continue;
    const L = f.half * 2;
    const corridorFace = b.corridor && f.id === "+z";
    for (let fl = b.undercroft ? 1 : 0; fl < floors; fl++) {
      const fy = b.y0 + fl * STOREY;
      const doorFloor = corridorFace ? corridorFloors.includes(fl) : false;
      const mod = corridorFace ? 4.5 : f.half < 6 ? 3.0 : 3.2;
      const n = Math.max(1, Math.floor((L - 1.2) / mod));
      const start = -((n - 1) * mod) / 2;
      for (let k = 0; k < n; k++) {
        const u = start + k * mod;
        const g = groundAtFace(b, f, u);
        // Doors where the floor meets walkable ground / a corridor.
        const level = Math.abs(g - fy) < 0.35;
        const wantDoor = (doorFloor && k % 2 === 0) || (!corridorFace && level && fl === 0 && k % 4 === 1 && f.half > 6) || (!corridorFace && level && b.north && f.id === "-z" && fl > 0 && k % 4 === 1);
        if (wantDoor && g <= fy + 0.4) {
          const key = (k + fl) % 3 === 0 ? "doorBlue" : "doorGreen";
          faceRect(kit, key, b, f, u - 0.6, u + 0.6, fy + 0.02, fy + 2.4, 0.05, { uv: [[0, 0], [1, 0], [1, 1], [0, 1]] });
          // A little window beside the door.
          if (corridorFace) faceRect(kit, "window2", b, f, u + 0.95, u + 2.7, fy + 1.0, Math.min(fy + 2.6, fy + fh - 0.5), 0.04, { uv: "unit" });
          continue;
        }
        const sill = fy + (corridorFace ? 1.05 : 0.95);
        const top = Math.min(fy + (corridorFace ? 2.9 : 3.3), fy + fh - 0.55);
        if (g > sill - 0.1) continue; // buried by a terrace / the hillside
        const w = corridorFace ? 3.2 : f.half < 6 ? 1.2 : 1.9;
        faceRect(kit, (k + fl) % 2 ? "window" : "window2", b, f, u - w / 2, u + w / 2, sill, top, 0.04, { uv: "unit" });
        // Sill + head (cream) for depth.
        faceRect(kit, "paint", b, f, u - w / 2 - 0.06, u + w / 2 + 0.06, sill - 0.09, sill, 0.07, { color: CREAM });
      }
    }
  }
}

function addBody(kit, b) {
  const e = eaveOf(b);
  // An undercroft block's walls start one storey up (columns underneath).
  const foot = b.undercroft ? b.y0 + STOREY - DECK_T : footOf(b);
  const key = b.wall || "brick";
  kit.boxY(key, b.c[0], b.c[1], b.hx, b.hz, foot, e, b.yaw, { faces: { top: false, bottom: Boolean(b.undercroft) }, bottomKey: "concrete" });
  if (b.undercroft) {
    // The undercroft's ceiling: bare concrete with a strip light per bay.
    for (let lx = -b.hx + 3; lx < b.hx - 2; lx += 6) {
      const [x, z] = toWorld(b, lx, 0);
      kit.boxY("glow", x, z, 0.12, b.hz * 0.7, foot - 0.08, foot - 0.02, b.yaw, { faces: { bottom: true, top: false }, color: "#fff6dc" });
    }
  }
  // Painted walls (the canteen's royal blue with a sunny yellow band — video 2).
  if (b.paint) {
    for (const f of facesOf(b)) {
      faceRect(kit, "paint", b, f, -f.half - 0.02, f.half + 0.02, b.y0 + 0.36, e - 0.2, 0.025, { color: b.paint.base });
      faceRect(kit, "paint", b, f, -f.half - 0.02, f.half + 0.02, b.y0 + 2.7, b.y0 + 3.2, 0.03, { color: b.paint.band });
      for (const u of [-f.half + 0.6, f.half - 0.6]) faceRect(kit, "paint", b, f, u - 0.6, u + 0.6, b.y0 + 0.36, e - 0.2, 0.032, { color: b.paint.band });
    }
  }
  // The 1920s blocks: the ground floor under the verandah is painted cream (video 8).
  for (const v of b.verandahs || []) {
    if (!v.cream) continue;
    const f = facesOf(b).find((q) => q.id === v.face);
    faceRect(kit, "paint", b, f, -f.half, f.half, b.y0 + 0.36, b.y0 + v.h - 0.1, 0.025, { color: "#efe3c2" });
  }
  // Concrete floor bands.
  for (let fl = b.undercroft ? 2 : 1; fl < b.floors; fl++) {
    const fy = b.y0 + fl * STOREY;
    kit.boxY("slab", b.c[0], b.c[1], b.hx + 0.05, b.hz + 0.05, fy - 0.2, fy + 0.06, b.yaw, { faces: { top: true } });
  }
  // A darker plinth course.
  if (!b.undercroft) kit.boxY("brickDark", b.c[0], b.c[1], b.hx + 0.02, b.hz + 0.02, foot, b.y0 + 0.35, b.yaw, { faces: { top: false } });
  // Downpipes at the corners.
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const [x, z] = toWorld(b, sx * (b.hx + 0.08), sz * (b.hz + 0.08));
    kit.post("metal", x, z, Math.max(foot, groundBelow(x, z)) - 0.05, e - 0.1, 0.05, 6, { color: "#d6d3cb" });
  }
  addWindowsAndDoors(kit, b);
}

function addCorridorTrim(kit, b) {
  if (!b.corridor) return;
  const e = eaveOf(b);
  const c = b.corridor;
  const lz = b.hz + CORRIDOR_W - 0.28;
  // The verandah beam along the column line, under the eave.
  kit.beam("paint", P3(b, c.x0, e - 0.24, lz), P3(b, c.x1, e - 0.24, lz), 0.3, 0.42, { color: CREAM });
  for (const en of b.ends || []) {
    const lx = en.side * (b.hx + CORRIDOR_W - 0.28);
    kit.beam("paint", P3(b, lx, e - 0.24, -b.hz), P3(b, lx, e - 0.24, b.hz + CORRIDOR_W), 0.3, 0.42, { color: CREAM });
  }
  for (const bay of b.bays || []) {
    const r = bayRect(b, bay, b.floors - 1);
    void r;
    const bz = b.hz + CORRIDOR_W + bay.depth - 0.28;
    kit.beam("paint", P3(b, bay.x0, e - 0.24, bz), P3(b, bay.x1, e - 0.24, bz), 0.3, 0.42, { color: CREAM });
  }
}

function addRoof(kit, b) {
  const e = eaveOf(b);
  const rf = b.roof;
  const oh = rf.oh ?? 0.8;
  let x0 = -b.hx - oh, x1 = b.hx + oh, z0 = -b.hz - oh, z1 = b.hz + oh;
  if (b.corridor) z1 = b.hz + CORRIDOR_W + oh * 0.7;
  for (const en of b.ends || []) {
    if (en.side < 0) x0 -= CORRIDOR_W; else x1 += CORRIDOR_W;
  }
  if (rf.type === "hip") {
    hipRoof(kit, rf.mat, b, x0, x1, z0, z1, e, rf.pitch || 0.48);
    if (rf.skylight) {
      // A glazed roof lantern on the ridge (the library's skylight on the aerial).
      const W = x1 - x0, D = z1 - z0;
      const h = (rf.pitch || 0.48) * Math.min(W, D) / 2;
      kit.boxY("paint", b.c[0], b.c[1], Math.min(W, D) * 0.16, Math.min(W, D) * 0.16, e + h - 0.6, e + h + 0.5, b.yaw, { color: CREAM });
      kit.boxY("glass", b.c[0], b.c[1], Math.min(W, D) * 0.15, Math.min(W, D) * 0.15, e + h + 0.5, e + h + 1.0, b.yaw, { color: "#bcd6e0" });
    }
    for (const bay of b.bays || []) {
      const bz0 = b.hz + CORRIDOR_W, bz1 = bz0 + bay.depth + 0.7;
      hipRoof(kit, rf.mat, b, bay.x0 - 0.5, bay.x1 + 0.5, bz0 - 0.6, bz1, e - 0.05, 0.36);
    }
  } else if (rf.type === "skillion") {
    skillionRoof(kit, rf.mat, b, x0, x1, z0, z1, e, rf.fall, { x0: -b.hx, x1: b.hx, z0: -b.hz, z1: b.hz }, b.wall);
  } else if (rf.type === "flat") {
    // A low steel deck behind a brick parapet + rooftop AC units.
    kit.boxY("greySteel", b.c[0], b.c[1], b.hx - 0.2, b.hz - 0.2, e - 0.1, e + 0.05, b.yaw, { faces: { px: false, nx: false, pz: false, nz: false } });
    const P = (lx, lz) => toWorld(b, lx, lz);
    const corners = [[-b.hx, -b.hz], [b.hx, -b.hz], [b.hx, b.hz], [-b.hx, b.hz]];
    for (let i = 0; i < 4; i++) {
      const a = corners[i], c = corners[(i + 1) % 4];
      const mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2;
      const L = Math.hypot(mx, mz) || 1;
      const ia = [a[0] - (mx / L) * 0.15, a[1] - (mz / L) * 0.15], ic = [c[0] - (mx / L) * 0.15, c[1] - (mz / L) * 0.15];
      kit.wall(b.wall, P(...ia), P(...ic), e - 0.1, e + 0.75, 0.3, { topKey: "slab", extend: 0.15 });
    }
    for (const [lx, lz] of [[-6, -2], [-1, 2], [6, -1]]) {
      const [x, z] = P(lx, lz);
      kit.boxY("paint", x, z, 0.9, 0.6, e + 0.05, e + 1.1, b.yaw, { color: "#d9dcdf" });
      kit.boxY("dark", x + 0.01, z, 0.5, 0.5, e + 1.1, e + 1.14, b.yaw);
    }
  }
}

// ---------------------------------------------------------------------------
// WALK-IN CLASSROOMS (the Maths Block — two rooms on every floor, video 11):
// brick walls with a doorway per room off the balcony, concrete floors with
// vinyl, ceilings with strip lights, a maths whiteboard on the front wall,
// posters, double desks + chairs and the teacher's desk.
// ---------------------------------------------------------------------------
function addRoomsBlock(kit, b) {
  const e = eaveOf(b);
  const foot = footOf(b);
  const key = b.wall || "brick";
  const t = ROOM_WALL;
  const spans = roomSpans(b);
  const P = (lx, y, lz) => P3(b, lx, y, lz);
  const { ex, ez } = axes(b);
  // Walls (each a brick box, full height) + the lintels over every doorway.
  for (const w of roomWalls(b)) kit.boxY(key, w.c[0], w.c[1], w.hx, w.hz, foot, e, w.yaw, { faces: { top: true } });
  for (let f = 0; f < b.floors; f++) {
    const fy = b.y0 + f * STOREY;
    for (const rm of spans) {
      const [x, z] = toWorld(b, rm.door, b.hz - t / 2);
      kit.boxY(key, x, z, ROOM_DOOR_W / 2, t / 2, fy + 2.8, f === b.floors - 1 ? e : fy + STOREY, b.yaw);
    }
  }
  // A plinth course + the floor bands outside.
  kit.boxY("brickDark", b.c[0], b.c[1], b.hx + 0.02, b.hz + 0.02, foot, b.y0 + 0.35, b.yaw, { faces: { top: false, bottom: false, pz: true, nz: true, px: true, nx: true } });
  for (let f = 1; f < b.floors; f++) {
    const fy = b.y0 + f * STOREY;
    for (const [lz, n] of [[-b.hz - 0.06, neg(ez)], [b.hz + 0.06, ez]]) kit.poly("slab", [P(-b.hx - 0.06, fy - DECK_T, lz), P(b.hx + 0.06, fy - DECK_T, lz), P(b.hx + 0.06, fy + 0.06, lz), P(-b.hx - 0.06, fy + 0.06, lz)], { out: n });
  }
  // Floors (vinyl tops, ceilings under) + the top floor's ceiling under the roof.
  const ihx = b.hx - t, ihz = b.hz - t;
  for (let f = 0; f < b.floors; f++) {
    const fy = b.y0 + f * STOREY;
    if (f === 0) kit.boxY("vinyl", b.c[0], b.c[1], ihx, ihz, fy - 0.6, fy + 0.02, b.yaw);
    else kit.boxY("concrete", b.c[0], b.c[1], ihx, ihz, fy - DECK_T, fy, b.yaw, { topKey: "vinyl", faces: { bottom: true, px: false, nx: false, pz: false, nz: false }, bottomKey: "paint", color: "#f1ede4" });
    const ceil = f === b.floors - 1 ? e - 0.05 : fy + STOREY - DECK_T;
    if (f === b.floors - 1) kit.poly("paint", [P(-ihx, ceil, -ihz), P(ihx, ceil, -ihz), P(ihx, ceil, ihz), P(-ihx, ceil, ihz)], { out: [0, -1, 0], color: "#f1ede4" });
    // Strip lights.
    for (const rm of spans) {
      for (const lz of [-ihz * 0.5, ihz * 0.4]) {
        for (const fr of [0.3, 0.7]) {
          const lx = rm.x0 + (rm.x1 - rm.x0) * fr;
          const [x, z] = toWorld(b, lx, lz);
          kit.boxY("glow", x, z, 0.9, 0.14, ceil - 0.08, ceil - 0.01, b.yaw, { faces: { bottom: true, top: false }, color: "#fffbea" });
        }
      }
    }
  }
  // Windows: outside (both long faces) + the light coming in, seen from inside.
  for (let f = 0; f < b.floors; f++) {
    const fy = b.y0 + f * STOREY;
    for (const rm of spans) {
      const w = rm.x1 - rm.x0;
      // Back wall: a big band of windows (they look over Banksia Court).
      const n = Math.max(2, Math.floor((w - 2) / 3.4));
      for (let k = 0; k < n; k++) {
        const u0 = rm.x0 + 1 + (k * (w - 2)) / n + 0.2, u1 = rm.x0 + 1 + ((k + 1) * (w - 2)) / n - 0.2;
        kit.poly((k + f) % 2 ? "window" : "window2", [P(u1, fy + 1.0, -b.hz - 0.04), P(u0, fy + 1.0, -b.hz - 0.04), P(u0, fy + 3.3, -b.hz - 0.04), P(u1, fy + 3.3, -b.hz - 0.04)], { out: neg(ez), uv: "unit" });
        kit.poly("glow", [P(u0, fy + 1.0, -b.hz + t + 0.02), P(u1, fy + 1.0, -b.hz + t + 0.02), P(u1, fy + 3.3, -b.hz + t + 0.02), P(u0, fy + 3.3, -b.hz + t + 0.02)], { out: ez, color: "#cfe6f2" });
      }
      // Corridor wall: a window beside the door (both faces), the door frame.
      const wx0 = rm.door + (rm.i % 2 ? -ROOM_DOOR_W / 2 - 4.2 : ROOM_DOOR_W / 2 + 0.8);
      const wx1 = wx0 + 3.4;
      kit.poly("window2", [P(wx0, fy + 1.1, b.hz + 0.04), P(wx1, fy + 1.1, b.hz + 0.04), P(wx1, fy + 2.7, b.hz + 0.04), P(wx0, fy + 2.7, b.hz + 0.04)], { out: ez, uv: "unit" });
      kit.poly("glow", [P(wx1, fy + 1.1, b.hz - t - 0.02), P(wx0, fy + 1.1, b.hz - t - 0.02), P(wx0, fy + 2.7, b.hz - t - 0.02), P(wx1, fy + 2.7, b.hz - t - 0.02)], { out: neg(ez), color: "#d8ecf4" });
      for (const s2 of [-1, 1]) {
        const [x, z] = toWorld(b, rm.door + s2 * (ROOM_DOOR_W / 2 + 0.05), b.hz);
        kit.boxY("paint", x, z, 0.08, t / 2 + 0.06, fy, fy + 2.85, b.yaw, { color: "#6a9a8c" });
      }
      // The open door leaf, swung back against the inside wall.
      const [dx, dz] = toWorld(b, rm.door - ROOM_DOOR_W / 2 - 0.05, b.hz - t - 0.55);
      kit.boxY("paint", dx, dz, 0.05, 0.55, fy + 0.02, fy + 2.75, b.yaw, { color: "#8fb0b8" });
      // Inside: walls painted (a soft cream) with a grey dado.
      const lining = (a, c, n) => {
        kit.poly("paint", [P(a[0], fy + 0.02, a[1]), P(c[0], fy + 0.02, c[1]), P(c[0], fy + STOREY - DECK_T - 0.02, c[1]), P(a[0], fy + STOREY - DECK_T - 0.02, a[1])], { out: n, color: "#f0e8d6" });
        kit.poly("paint", [P(a[0], fy + 0.03, a[1]), P(c[0], fy + 0.03, c[1]), P(c[0], fy + 1.0, c[1]), P(a[0], fy + 1.0, a[1])], { out: n, color: "#a9b4b2" });
      };
      const xi0 = rm.x0 + (rm.i === 0 ? t : t / 2) + 0.01, xi1 = rm.x1 - (rm.i === spans.length - 1 ? t : t / 2) - 0.01;
      lining([xi0, -ihz + 0.01], [xi1, -ihz + 0.01], ez);
      lining([xi0 + 0.0, -ihz], [xi0, ihz], ex);
      lining([xi1, ihz], [xi1, -ihz], neg(ex));
      // The front: a big whiteboard with maths on it.
      const front = rm.i % 2 ? 1 : -1;
      const fx = front < 0 ? xi0 + 0.03 : xi1 - 0.03;
      const nIn = front < 0 ? ex : neg(ex);
      const bw = Math.min(6.5, ihz * 1.2);
      // zA = the board's LEFT edge as you face it (explicit UVs so a flipped
      // winding can never mirror the writing).
      const zA = front < 0 ? bw / 2 : -bw / 2, zB = -zA;
      kit.poly((f + rm.i) % 2 ? "whiteboard" : "whiteboard2", [P(fx, fy + 1.0, zA), P(fx, fy + 1.0, zB), P(fx, fy + 2.7, zB), P(fx, fy + 2.7, zA)], { out: nIn, uv: [[0, 0], [1, 0], [1, 1], [0, 1]] });
      kit.boxY("metal", ...toWorld(b, fx - front * 0.06, 0), 0.06, bw / 2, fy + 0.95, fy + 1.02, b.yaw, { color: "#9aa0a4" });
      // Posters along the back wall.
      const px0 = rm.x0 + w * 0.25, px1 = rm.x0 + w * 0.75;
      kit.poly("mathsPosters", [P(px0, fy + 2.75, -ihz + 0.03), P(px1, fy + 2.75, -ihz + 0.03), P(px1, fy + 3.55, -ihz + 0.03), P(px0, fy + 3.55, -ihz + 0.03)], { out: ez, uv: "unit" });
    }
  }
  // Desks + chairs (the colliders use the same list).
  for (const d of classroomDesks(b)) {
    const top = d.y + 0.74;
    if (d.teacher) {
      kit.boxY("timber", d.x, d.z, d.hx + 0.1, d.hz + 0.1, top - 0.05, top, b.yaw);
      kit.boxY("paint", d.x, d.z, d.hx, d.hz, d.y, top - 0.05, b.yaw, { color: "#5e6b74" });
      continue;
    }
    kit.boxY("paint", d.x, d.z, d.hx, d.hz, top - 0.04, top, b.yaw, { color: "#d9cdb1" });
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const [lx, lz] = [d.lx + sx * (d.hx - 0.06), d.lz + sz * (d.hz - 0.06)];
      const [x, z] = toWorld(b, lx, lz);
      kit.post("metal", x, z, d.y, top - 0.04, 0.025, 5, { color: "#5f6a72", cap: false });
    }
    // Two chairs behind each desk (away from the board).
    for (const sz of [-0.6, 0.6]) {
      const [cx, cz] = toWorld(b, d.lx - d.front * 0.75, d.lz + sz);
      kit.boxY("paint", cx, cz, 0.22, 0.22, d.y + 0.44, d.y + 0.48, b.yaw, { color: "#2f6fb4" });
      const [bx, bz] = toWorld(b, d.lx - d.front * 0.97, d.lz + sz);
      kit.boxY("paint", bx, bz, 0.03, 0.22, d.y + 0.48, d.y + 0.9, b.yaw, { color: "#2f6fb4" });
      kit.post("metal", cx, cz, d.y, d.y + 0.44, 0.03, 5, { color: "#5f6a72", cap: false });
    }
  }
}

// ---------------------------------------------------------------------------
// VERANDAHS — the 1920s blocks' cream verandahs on brick piers (video 8), the
// white block's verandah on dark steel posts (video 9), the hall's red + white
// striped awning (the aerial, video 2). Piers come from schoolColumns.
// ---------------------------------------------------------------------------
function addVerandahs(kit, b) {
  for (const v of b.verandahs || []) {
    const vr = verandahRect(b, v);
    const yIn = b.y0 + v.h + 0.45, yOut = b.y0 + v.h;
    // Roof plane: from the wall (high) to the outer edge (low).
    const ix = vr.along === "x" ? 0 : -vr.s, iz = vr.along === "x" ? -vr.s : 0;
    const corners = vr.along === "x"
      ? [[-vr.hx - 0.2, -vr.s * vr.hz], [vr.hx + 0.2, -vr.s * vr.hz], [vr.hx + 0.2, vr.s * (vr.hz + 0.3)], [-vr.hx - 0.2, vr.s * (vr.hz + 0.3)]]
      : [[-vr.s * vr.hx, -vr.hz - 0.2], [vr.s * (vr.hx + 0.3), -vr.hz - 0.2], [vr.s * (vr.hx + 0.3), vr.hz + 0.2], [-vr.s * vr.hx, vr.hz + 0.2]];
    const yOf = (lx, lz) => {
      const d = vr.along === "x" ? (lz * vr.s + vr.hz) / (2 * vr.hz) : (lx * vr.s + vr.hx) / (2 * vr.hx);
      return yIn + (yOut - yIn) * d;
    };
    void ix; void iz;
    const pts = corners.map(([lx, lz]) => { const [x, z] = toWorld(vr, lx, lz); return [x, yOf(lx, lz), z]; });
    const mat = v.stripes ? "stripes" : v.piers === "brick" ? "creamSteel" : "greySteel";
    kit.poly(mat, pts, { out: [0, 1, 0] });
    kit.poly("paint", pts.map((p) => [p[0], p[1] - 0.05, p[2]]), { out: [0, -1, 0], color: v.stripes ? "#f4f1ea" : "#efe6d0" });
    // The fascia beam along the outer edge.
    const [a0, a1] = vr.along === "x" ? [[-vr.hx - 0.2, vr.s * (vr.hz + 0.3)], [vr.hx + 0.2, vr.s * (vr.hz + 0.3)]] : [[vr.s * (vr.hx + 0.3), -vr.hz - 0.2], [vr.s * (vr.hx + 0.3), vr.hz + 0.2]];
    const A = toWorld(vr, ...a0), B = toWorld(vr, ...a1);
    kit.beam("paint", [A[0], yOut - 0.12, A[1]], [B[0], yOut - 0.12, B[1]], 0.18, 0.36, { color: v.stripes ? "#b8322a" : "#e9e2cf" });
    if (v.stripes) {
      // A scalloped valance of the stripes hanging off the front edge.
      kit.poly("stripes", [[A[0], yOut - 0.9, A[1]], [B[0], yOut - 0.9, B[1]], [B[0], yOut - 0.25, B[1]], [A[0], yOut - 0.25, A[1]]], { double: true });
    }
    // The paving under it (+ a yellow edge line, video 8).
    const slab = vr.along === "x" ? { ...vr, hz: vr.hz } : vr;
    const [sx, sz] = slab.c;
    kit.boxY("slab", sx, sz, slab.hx, slab.hz, b.y0 - 0.3, b.y0 + 0.04, b.yaw, { faces: { px: false, nx: false, pz: false, nz: false } });
    const [l0, l1] = vr.along === "x" ? [[-vr.hx, vr.s * (vr.hz - 0.35)], [vr.hx, vr.s * (vr.hz - 0.35)]] : [[vr.s * (vr.hx - 0.35), -vr.hz], [vr.s * (vr.hx - 0.35), vr.hz]];
    const L0 = toWorld(vr, ...l0), L1 = toWorld(vr, ...l1);
    kit.beam("tactile", [L0[0], b.y0 + 0.05, L0[1]], [L1[0], b.y0 + 0.05, L1[1]], 0.1, 0.01, {});
  }
}

/** Painted murals (the BLUE WAVES on A Block's end wall, the pelican). */
function addMurals(kit, b) {
  const faces = Object.fromEntries(facesOf(b).map((f) => [f.id, f]));
  const e = eaveOf(b);
  for (const m of b.murals || []) {
    const f = faces[m.face];
    if (m.kind === "waves") {
      faceRect(kit, "paint", b, f, -f.half - 0.02, f.half + 0.02, b.y0 + 0.36, e - 0.2, 0.03, { color: "#f3f1ea" });
      faceRect(kit, "muralWaves", b, f, -f.half + 0.4, f.half - 0.4, b.y0 + 0.5, e - 1.0, 0.05, { uv: [[0, 0], [1, 0], [1, 1], [0, 1]] });
    } else if (m.kind === "pelican") {
      const fy = b.y0 + (m.floor || 0) * STOREY;
      faceRect(kit, "muralPelican", b, f, f.half - 6.5, f.half - 1.5, fy + 0.6, fy + 4.1, 0.06, { uv: [[0, 0], [1, 0], [1, 1], [0, 1]] });
    }
  }
}

// ---------------------------------------------------------------------------
// THE HALL — walls with the doorway, gable roof + skylights, clerestory
// windows, the porch, and inside: timber floor, ceiling lights, the stage.
// ---------------------------------------------------------------------------
function addHall(kit, b) {
  const e = eaveOf(b), t = HALL.wallT;
  const foot = footOf(b);
  const x0 = b.c[0] - b.hx, x1 = b.c[0] + b.hx, z0 = b.c[1] - b.hz, z1 = b.c[1] + b.hz;
  const y0 = b.y0;
  const W = (key, a, c, ya, yb, opts) => kit.wall(key, a, c, ya, yb, t, opts);
  // Outer walls (the doorway gap in the south wall).
  W("brick", [x0, z0 + t / 2], [x1, z0 + t / 2], foot, e);
  W("brick", [x0 + t / 2, z0], [x0 + t / 2, z1], foot, e);
  W("brick", [x1 - t / 2, z0], [x1 - t / 2, z1], foot, e);
  W("brick", [x0, z1 - t / 2], [HALL.doorX[0], z1 - t / 2], foot, e);
  W("brick", [HALL.doorX[1], z1 - t / 2], [x1, z1 - t / 2], foot, e);
  W("brick", [HALL.doorX[0], z1 - t / 2], [HALL.doorX[1], z1 - t / 2], y0 + 3.6, e);
  // Door frame (a steel portal round the opening).
  kit.boxY("paint", HALL.doorX[0] - 0.12, z1 + 0.02, 0.14, t / 2 + 0.04, y0, y0 + 3.75, 0, { color: "#3a3f44" });
  kit.boxY("paint", HALL.doorX[1] + 0.12, z1 + 0.02, 0.14, t / 2 + 0.04, y0, y0 + 3.75, 0, { color: "#3a3f44" });
  kit.boxY("paint", (HALL.doorX[0] + HALL.doorX[1]) / 2, z1 + 0.02, (HALL.doorX[1] - HALL.doorX[0]) / 2 + 0.26, t / 2 + 0.04, y0 + 3.6, y0 + 3.78, 0, { color: "#3a3f44" });
  // Brick piers along the long walls (the hall's portal frames).
  for (let z = z0 + 4; z < z1 - 2; z += 5.75) {
    for (const x of [x0 - 0.04, x1 + 0.04]) kit.boxY("brick", x, z, 0.2, 0.42, foot, e - 0.1, 0);
  }
  // Clerestory windows high on both long walls (outside + inside).
  for (let z = z0 + 2.2; z < z1 - 2.5; z += 3.45) {
    for (const [x, nx] of [[x0, -1], [x1, 1]]) {
      const ox = x + nx * 0.03, ix = x - nx * (t + 0.02);
      kit.poly("clerestory", [[ox, y0 + 7.0, z], [ox, y0 + 7.0, z + 2.6], [ox, y0 + 8.9, z + 2.6], [ox, y0 + 8.9, z]], { out: [nx, 0, 0], uv: nx > 0 ? [[1, 0], [0, 0], [0, 1], [1, 1]] : "unit" });
      kit.poly("glow", [[ix, y0 + 7.0, z], [ix, y0 + 7.0, z + 2.6], [ix, y0 + 8.9, z + 2.6], [ix, y0 + 8.9, z]], { out: [-nx, 0, 0], color: "#dbe9f2" });
    }
  }
  // Gable roof with skylight stripes.
  const oh = b.roof.oh ?? 0.9, pitch = b.roof.pitch || 0.36;
  const rx0 = x0 - oh, rx1 = x1 + oh, rz0 = z0 - oh, rz1 = z1 + oh;
  const P = (x, y, z) => [x, y, z];
  const xm = (rx0 + rx1) / 2, h = (pitch * (rx1 - rx0)) / 2;
  kit.poly("redSteel", [P(rx0, e, rz0), P(rx0, e, rz1), P(xm, e + h, rz1), P(xm, e + h, rz0)], { out: UP });
  kit.poly("redSteel", [P(rx1, e, rz1), P(rx1, e, rz0), P(xm, e + h, rz0), P(xm, e + h, rz1)], { out: UP });
  kit.beam("metal", P(xm, e + h + 0.03, rz0), P(xm, e + h + 0.03, rz1), 0.6, 0.12, { color: "#7d2620" });
  const yRoof = (x) => e + pitch * (x < xm ? x - rx0 : rx1 - x);
  for (const [lz, nz] of [[z0, -1], [z1, 1]]) {
    const zz = lz + nz * 0.01;
    kit.poly("brick", [P(x0, e - 0.05, zz), P(x1, e - 0.05, zz), P(x1, yRoof(x1), zz), P(xm, e + h - 0.04, zz), P(x0, yRoof(x0), zz)], { out: [0, 0, nz] });
  }
  for (let z = rz0 + 3; z < rz1 - 2; z += 5.75) {
    for (const side of [-1, 1]) {
      // A translucent sheet from just above the eave to near the ridge.
      const xa = side < 0 ? rx0 + 2.2 : rx1 - 2.2, xb = side < 0 ? xm - 1.2 : xm + 1.2;
      const lift = 0.03;
      kit.poly("translucent", [P(xa, yRoof(xa) + lift, z), P(xa, yRoof(xa) + lift, z + 1.5), P(xb, yRoof(xb) + lift, z + 1.5), P(xb, yRoof(xb) + lift, z)], { out: UP });
    }
  }
  // Soffit + fascia + gutters.
  kit.poly("paint", [P(rx0, e - 0.02, rz0), P(rx1, e - 0.02, rz0), P(rx1, e - 0.02, rz1), P(rx0, e - 0.02, rz1)], { out: DOWN, color: CREAM });
  for (const [x, nx] of [[rx0, -1], [rx1, 1]]) {
    kit.poly("paint", [P(x, e - 0.26, rz0), P(x, e - 0.26, rz1), P(x, e + 0.03, rz1), P(x, e + 0.03, rz0)], { out: [nx, 0, 0], color: CREAM });
    kit.beam("metal", P(x + nx * 0.07, e - 0.1, rz0), P(x + nx * 0.07, e - 0.1, rz1), 0.14, 0.13, { color: "#d6d3cb" });
  }
  // INSIDE: lining, floor, ceiling + lights.
  const ix0 = x0 + t, ix1 = x1 - t, iz0 = z0 + t, iz1 = z1 - t;
  kit.poly("paint", [P(ix0, y0, iz0 + 0.001), P(ix1, y0, iz0 + 0.001), P(ix1, e - 0.3, iz0 + 0.001), P(ix0, e - 0.3, iz0 + 0.001)], { out: [0, 0, 1], color: "#e8dcc4" });
  kit.poly("paint", [P(ix0 + 0.001, y0, iz0), P(ix0 + 0.001, y0, iz1), P(ix0 + 0.001, e - 0.3, iz1), P(ix0 + 0.001, e - 0.3, iz0)], { out: [1, 0, 0], color: "#e8dcc4" });
  kit.poly("paint", [P(ix1 - 0.001, y0, iz0), P(ix1 - 0.001, y0, iz1), P(ix1 - 0.001, e - 0.3, iz1), P(ix1 - 0.001, e - 0.3, iz0)], { out: [-1, 0, 0], color: "#e8dcc4" });
  for (const [xa, xb, ya] of [[ix0, HALL.doorX[0], y0], [HALL.doorX[1], ix1, y0], [HALL.doorX[0], HALL.doorX[1], y0 + 3.6]]) {
    kit.poly("paint", [P(xa, ya, iz1 - 0.001), P(xb, ya, iz1 - 0.001), P(xb, e - 0.3, iz1 - 0.001), P(xa, e - 0.3, iz1 - 0.001)], { out: [0, 0, -1], color: "#e8dcc4" });
  }
  // A dado of timber panelling round the walls.
  for (const [a, c, n] of [[[ix0, iz0 + 0.01], [ix1, iz0 + 0.01], [0, 0, 1]], [[ix0 + 0.01, iz0], [ix0 + 0.01, iz1], [1, 0, 0]], [[ix1 - 0.01, iz0], [ix1 - 0.01, iz1], [-1, 0, 0]]]) {
    kit.poly("timber", [P(a[0], y0, a[1]), P(c[0], y0, c[1]), P(c[0], y0 + 1.3, c[1]), P(a[0], y0 + 1.3, a[1])], { out: n });
  }
  kit.poly("timber", [P(ix0, y0 + 0.012, iz0), P(ix1, y0 + 0.012, iz0), P(ix1, y0 + 0.012, iz1), P(ix0, y0 + 0.012, iz1)], { out: UP });
  kit.poly("paint", [P(ix0, e - 0.3, iz0), P(ix1, e - 0.3, iz0), P(ix1, e - 0.3, iz1), P(ix0, e - 0.3, iz1)], { out: DOWN, color: "#efe8d8" });
  for (let x = ix0 + 5; x < ix1 - 3; x += 7) {
    for (let z = iz0 + 4; z < iz1 - 2; z += 6) {
      kit.poly("glow", [P(x, e - 0.32, z), P(x + 2.4, e - 0.32, z), P(x + 2.4, e - 0.32, z + 0.5), P(x, e - 0.32, z + 0.5)], { out: DOWN, color: "#fffbea" });
    }
  }
  // Court lines on the hall floor (a badminton court + centre circle).
  const lineY = y0 + 0.02;
  const cxm = (ix0 + ix1) / 2, czm = (iz0 + iz1) / 2 + 4;
  const ln = (ax, az, bx, bz) => {
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1, nx = (-dz / L) * 0.05, nz = (dx / L) * 0.05;
    kit.poly("whiteLine", [P(ax - nx, lineY, az - nz), P(bx - nx, lineY, bz - nz), P(bx + nx, lineY, bz + nz), P(ax + nx, lineY, az + nz)], { out: UP });
  };
  ln(cxm - 6, czm - 9, cxm + 6, czm - 9); ln(cxm - 6, czm + 9, cxm + 6, czm + 9);
  ln(cxm - 6, czm - 9, cxm - 6, czm + 9); ln(cxm + 6, czm - 9, cxm + 6, czm + 9); ln(cxm - 6, czm, cxm + 6, czm);
  // THE STAGE.
  const st = HALL.stage;
  const sy = y0 + st.h;
  kit.boxY("paint", (st.x[0] + st.x[1]) / 2, (st.z[0] + st.z[1]) / 2, (st.x[1] - st.x[0]) / 2, (st.z[1] - st.z[0]) / 2, y0, sy, 0, { color: "#4a3426", topKey: "timber", topColor: "#c69a6a" });
  // Proscenium + curtains.
  const pz = st.z[1] - 0.6;
  const prosY = sy + 4.6;
  kit.boxY("paint", (ix0 + ix1) / 2, pz, (ix1 - ix0) / 2, 0.3, prosY, e - 0.3, 0, { color: "#e3d6bb" });
  kit.boxY("paint", st.x[0] + 0.6, pz, 0.6, 0.3, sy, prosY, 0, { color: "#e3d6bb" });
  kit.boxY("paint", st.x[1] - 0.6, pz, 0.6, 0.3, sy, prosY, 0, { color: "#e3d6bb" });
  for (const [xa, xb] of [[st.x[0] + 1.2, st.x[0] + 5.2], [st.x[1] - 5.2, st.x[1] - 1.2]]) {
    // Gathered side curtains (a zig-zag of folds).
    const folds = 8;
    for (let i = 0; i < folds; i++) {
      const a = xa + ((xb - xa) * i) / folds, c = xa + ((xb - xa) * (i + 1)) / folds;
      const za = pz + 0.32 + (i % 2) * 0.18, zc = pz + 0.32 + ((i + 1) % 2) * 0.18;
      kit.poly("curtain", [P(a, sy, za), P(c, sy, zc), P(c, prosY, zc), P(a, prosY, za)], { out: [0, 0, 1], color: "#ffffff" });
    }
  }
  kit.boxY("curtain", (st.x[0] + st.x[1]) / 2, pz + 0.45, (st.x[1] - st.x[0]) / 2 - 1.2, 0.08, prosY - 0.9, prosY, 0);
  // The back curtain (dark red) + the school crest banner.
  kit.poly("paint", [P(st.x[0] + 1, sy, st.z[0] + 0.5), P(st.x[1] - 1, sy, st.z[0] + 0.5), P(st.x[1] - 1, e - 0.4, st.z[0] + 0.5), P(st.x[0] + 1, e - 0.4, st.z[0] + 0.5)], { out: [0, 0, 1], color: "#5e1c22" });
  // THE PORCH over the doors.
  const p = HALL.porch;
  kit.boxY("paint", (p.x[0] + p.x[1]) / 2, (p.z[0] + p.z[1]) / 2, (p.x[1] - p.x[0]) / 2, (p.z[1] - p.z[0]) / 2, p.roofY - 0.05, p.roofY + 0.28, 0, { color: CREAM, topKey: "greySteel", faces: { bottom: true } });
  for (const x of [p.x[0] + 0.3, p.x[1] - 0.3]) kit.post("metal", x, p.z[1] - 0.3, y0, p.roofY - 0.05, 0.16, 10, { color: "#3a3f44" });
}

// ---------------------------------------------------------------------------
// BUILDING EXTRAS — the art block's mural, the canteen's servery, the office
// entry, the workshop roller doors.
// ---------------------------------------------------------------------------
function addExtras(kit, b) {
  const faces = Object.fromEntries(facesOf(b).map((f) => [f.id, f]));
  const e = eaveOf(b);
  if (b.mural) {
    const f = faces[b.mural];
    faceRect(kit, "mural", b, f, -f.half + 0.3, f.half - 0.3, b.y0 + 0.4, e - 0.25, 0.05, { uv: [[0, 0], [1, 0], [1, 1], [0, 1]] });
    // A door at the east end (into the music rooms).
    faceRect(kit, "doorBlue", b, f, f.half - 2.4, f.half - 1.2, b.y0 + 0.02, b.y0 + 2.15, 0.07, { uv: "unit" });
  }
  if (b.servery) {
    const f = faces[b.servery];
    const y = b.y0;
    // The servery: an open counter under a rolled-up shutter.
    faceRect(kit, "dark", b, f, -4.2, 4.2, y + 0.95, y + 2.35, 0.03);
    const [cx, cz] = toWorld(b, ...faceLocal(f, 0, 0.32));
    kit.boxY("metal", cx, cz, 4.4, 0.32, y + 0.9, y + 1.0, b.yaw + Math.PI / 2, { color: "#d9dde0" });
    kit.boxY("paint", cx, cz, 4.4, 0.28, y, y + 0.9, b.yaw + Math.PI / 2, { color: "#2f6d8f" });
    const [sx, sz] = toWorld(b, ...faceLocal(f, 0, 0.18));
    kit.boxY("greySteel", sx, sz, 4.4, 0.18, y + 2.35, y + 2.75, b.yaw + Math.PI / 2);
    // Pies, drinks fridge glow, a stack of trays.
    faceRect(kit, "glow", b, f, 2.6, 3.8, y + 1.0, y + 2.2, 0.05, { color: "#bfe6ff" });
    faceRect(kit, "paint", b, f, -3.8, -2.2, y + 1.6, y + 2.25, 0.05, { color: "#f0d9a0" });
  }
  if (b.entry) {
    const f = faces[b.entry];
    const y = b.y0;
    faceRect(kit, "glass", b, f, -1.6, 1.6, y + 0.02, y + 2.5, 0.05);
    for (const u of [-1.65, -0.03, 1.6]) faceRect(kit, "metal", b, f, u, u + 0.08, y, y + 2.55, 0.07, { color: "#c9ccce" });
    faceRect(kit, "metal", b, f, -1.65, 1.68, y + 2.5, y + 2.6, 0.07, { color: "#c9ccce" });
    // Entry canopy.
    const [cx, cz] = toWorld(b, ...faceLocal(f, 0, 1.4));
    kit.boxY("paint", cx, cz, 2.6, 1.4, y + 3.0, y + 3.22, b.yaw + Math.PI / 2, { color: CREAM, topKey: "greySteel", faces: { bottom: true } });
    for (const u of [-2.3, 2.3]) {
      const [px, pz] = toWorld(b, ...faceLocal(f, u, 2.6));
      kit.post("metal", px, pz, y, y + 3.0, 0.07, 8, { color: "#3a3f44" });
    }
  }
  if (b.rollerDoors) {
    const f = faces[b.rollerDoors];
    const y = b.y0;
    const n = Math.max(1, Math.floor((f.half * 2) / 9));
    for (let k = 0; k < n; k++) {
      const u = -f.half + (f.half * 2 * (k + 0.5)) / n;
      faceRect(kit, "greySteel", b, f, u - 1.8, u + 1.8, y + 0.02, y + Math.min(3.4, (b.wallH || 3.6) - 0.6), 0.05);
      faceRect(kit, "paint", b, f, u - 1.9, u + 1.9, y + Math.min(3.4, (b.wallH || 3.6) - 0.6), y + Math.min(3.75, (b.wallH || 3.6) - 0.25), 0.1, { color: "#c9ccce" });
    }
  }
}

function buildBuildings() {
  const kit = new Kit();
  for (const b of SCHOOL_BUILDINGS) {
    addVerandahs(kit, b);
    if (b.hall) { addHall(kit, b); continue; }
    if (b.rooms) {
      addRoomsBlock(kit, b);
      addCorridorTrim(kit, b);
      addRoof(kit, b);
      addExtras(kit, b);
      continue;
    }
    addBody(kit, b);
    addMurals(kit, b);
    addCorridorTrim(kit, b);
    addRoof(kit, b);
    addExtras(kit, b);
  }
  return kit.build();
}

// ---------------------------------------------------------------------------
// BUILDING SIGNS (each its own little texture)
// ---------------------------------------------------------------------------
// Signs from the layout (b.sign) + the classroom numbers by every door.
const SIGNS = (() => {
  const out = [
    { b: "office", face: "-x", u: 0, y: LV.L0 + 3.75, w: 3.6, h: 0.6, lines: ["FRONT OFFICE"], out: 2.7 },
    { b: "shed", face: "-z", u: 0, y: LV.LM + 3.0, w: 3.6, h: 0.42, lines: ["SPORTS SHED"], bg: "#2e6b3a", out: 0.16 },
  ];
  for (const b of SCHOOL_BUILDINGS) {
    const sg = b.sign;
    if (sg) {
      const fl = sg.floor ?? (b.undercroft && sg.face !== "+z" ? 1 : 0);
      const big = sg.face !== "+z";
      out.push({
        b: b.id, face: sg.face, u: sg.at || 0, y: b.y0 + fl * STOREY + (big ? (b.wallH ? Math.min(b.wallH - 0.7, 3.4) : 3.6) : 3.5),
        w: big ? 5.2 : 4.2, h: big ? 0.9 : 0.7, lines: [sg.text], bg: b.id === "canteen" ? "#c8102e" : "#1d3f78", out: sg.face === "+z" && b.corridor ? 0.09 : 0.12, key: `${b.id}-sign`,
      });
    }
    if (b.rooms) {
      let n = 1;
      for (let f = 0; f < b.floors; f++) {
        for (const rm of roomSpans(b)) {
          out.push({ b: b.id, face: "+z", u: rm.door + (rm.i % 2 ? -1 : 1) * (ROOM_DOOR_W / 2 + 0.45), y: b.y0 + f * STOREY + 2.1, w: 0.62, h: 0.42, lines: [`M${n}`], bg: "#2f5f8f", out: 0.08, key: `${b.id}-m${n}` });
          n++;
        }
      }
    }
  }
  return out;
})();
function BuildingSign({ s }) {
  const b = SCHOOL_BUILDINGS.find((q) => q.id === s.b);
  const f = facesOf(b).find((q) => q.id === s.face);
  const tex = useMemo(() => schoolSignTexture(s.lines, { bg: s.bg || "#1d3f78", w: 512, h: Math.round((512 * s.h) / s.w) }), [s]);
  const [lx, lz] = faceLocal(f, s.u, s.out || 0.09);
  const [x, z] = toWorld(b, lx, lz);
  const yaw = Math.atan2(f.n[0], f.n[2]);
  return (
    <mesh position={[x, s.y, z]} rotation={[0, yaw, 0]}>
      <planeGeometry args={[s.w, s.h]} />
      <meshStandardMaterial map={tex} roughness={0.6} />
    </mesh>
  );
}
function HallSign() {
  const tex = useMemo(() => schoolSignTexture(["SCHOOL HALL", "Coffs Harbour High School"], { bg: "#7d1e1e", border: "#f2c21b", w: 640, h: 160 }), []);
  const b = SCHOOL_BUILDINGS.find((q) => q.hall);
  return (
    <mesh position={[b.c[0], b.y0 + 9.6, b.c[1] + b.hz + 0.06]}>
      <planeGeometry args={[9, 2.25]} />
      <meshStandardMaterial map={tex} roughness={0.6} />
    </mesh>
  );
}

export function SchoolBuildings() {
  const built = useMemo(buildBuildings, []);
  return (
    <group>
      {built.map(({ key, geometry }) => (
        <mesh key={key} geometry={geometry} material={kitMat(key)} castShadow={!NO_SHADOW_KEYS.has(key)} receiveShadow />
      ))}
      {SIGNS.map((s) => <BuildingSign key={s.key || s.b} s={s} />)}
      <HallSign />
    </group>
  );
}

export { THREE };
