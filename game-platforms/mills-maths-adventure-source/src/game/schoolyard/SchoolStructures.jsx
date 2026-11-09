import React, { useMemo } from "react";

import { toWorld, rectCorners } from "../../data/schoolyard/schoolyardGeom.js";
import {
  getSchoolStructures, terrainHeight, schoolSolidTopAt, towerFootprint, inSchoolBuilding, towerRoofY, TOWER_W, TOWER_STEPS, TOWER_TREAD, TOWER_LAND,
} from "../../data/schoolyard/schoolyardTerrain.js";
import { DECK_T, SCHOOL_BUILDINGS, STOREY, CORRIDOR_W, COLA, LV, SCHOOL_CANOPIES } from "../../data/schoolyard/schoolyardLayout.js";
import { getSchoolRails } from "../../data/schoolyard/schoolyardRails.js";
import { schoolColumns, canopyPosts } from "../../data/schoolyard/schoolyardColliders.js";
import { Kit, drapePolygon } from "./schoolKit.js";
import { kitMat, NO_SHADOW_KEYS } from "./schoolMaterials.js";

/**
 * THE SCHOOL'S STRUCTURES — everything you climb and walk along, drawn from
 * the SAME structure list the Player stands on (schoolyardTerrain.js):
 * concrete stair flights (solid on the ground, slabs + stringers up the
 * towers) with yellow nosings + tactile pads, the zig-zag access ramps,
 * landings, the open corridor DECKS + balconies + bays, their columns, the
 * stair-tower roofs, the Sky Pier on its steel frame — and every guard rail
 * (brick parapets on the terraces, concrete upstands + galvanised rails on
 * the decks, galvanised pipe rails on the stairs, ramps + landings).
 */
const GALV = "#b9bec2";
const CREAM = "#e9e2cf";

function groundBelow(x, z) {
  const t = terrainHeight(x, z);
  const s = schoolSolidTopAt(x, z);
  return s !== null && s > t ? s : t;
}
/** Local → world 3D in a rect frame. */
const W3 = (r, lx, y, lz) => {
  const [x, z] = toWorld(r, lx, lz);
  return [x, y, z];
};

function addFlight(kit, s) {
  const f = s.flight, r = s.r;
  const n = f.n, tr = f.tread;
  for (let k = 0; k < n; k++) {
    const top = f.y0 + (k + 1) * f.rise;
    const lx0 = -r.hx + k * tr, lx1 = lx0 + tr;
    const [cx, cz] = toWorld(r, (lx0 + lx1) / 2, 0);
    const bottom = s.thin ? top - 0.26 : f.y0 - 0.5;
    kit.boxY("concrete", cx, cz, tr / 2 + 0.002, r.hz, bottom, top, r.yaw, { topKey: "slab", faces: { nx: true, px: s.thin } });
    if (f.tactile || s.tower) {
      // Yellow nosing strip on every step edge.
      const [nx, nz] = toWorld(r, lx0 + 0.05, 0);
      kit.boxY("tactile", nx, nz, 0.05, r.hz - 0.02, top - 0.03, top + 0.006, r.yaw, { faces: { nx: true, px: false, pz: false, nz: false } });
    }
  }
  if (s.thin) {
    // A sloped soffit slab under the flight.
    kit.beam("concrete", W3(r, -r.hx, f.y0 - 0.32, 0), W3(r, r.hx, f.y0 + n * f.rise - 0.32, 0), r.hz * 2, 0.16, { ends: false });
  }
  if (f.tactile) {
    // Tactile warning pads at the top + bottom.
    const [bx, bz] = toWorld(r, -r.hx - 0.33, 0);
    kit.boxY("tactile", bx, bz, 0.3, r.hz * 0.9, f.y0 - 0.02, f.y0 + 0.012, r.yaw, { faces: { px: false, nx: false, pz: false, nz: false } });
    const [tx, tz] = toWorld(r, r.hx + 0.33, 0);
    kit.boxY("tactile", tx, tz, 0.3, r.hz * 0.9, f.y0 + n * f.rise - 0.02, f.y0 + n * f.rise + 0.012, r.yaw, { faces: { px: false, nx: false, pz: false, nz: false } });
  }
  if (f.cheeks) {
    // Brick cheek walls up both sides, their tops following the nosings.
    const ex = [Math.cos(r.yaw), 0, -Math.sin(r.yaw)], ez = [Math.sin(r.yaw), 0, Math.cos(r.yaw)];
    for (const side of [-1, 1]) {
      const lz = side * (r.hz + 0.14);
      const y0 = Math.min(f.y0, groundBelow(...toWorld(r, -r.hx, lz))) - 0.5;
      const yA = f.y0 + f.rise + 0.12, yB = f.y0 + n * f.rise + 0.12;
      const P = (lx, y, dz) => W3(r, lx, y, lz + dz);
      const out = [ez[0] * side, 0, ez[2] * side], inn = [-out[0], 0, -out[2]];
      kit.poly("brick", [P(-r.hx, y0, side * 0.14), P(r.hx, y0, side * 0.14), P(r.hx, yB, side * 0.14), P(-r.hx, yA, side * 0.14)], { out });
      kit.poly("brick", [P(-r.hx, y0, -side * 0.14), P(r.hx, y0, -side * 0.14), P(r.hx, yB, -side * 0.14), P(-r.hx, yA, -side * 0.14)], { out: inn });
      kit.poly("slab", [P(-r.hx, yA, -0.15), P(r.hx, yB, -0.15), P(r.hx, yB, 0.15), P(-r.hx, yA, 0.15)], { out: [0, 1, 0] });
      kit.poly("brick", [P(-r.hx, y0, -0.15), P(-r.hx, y0, 0.15), P(-r.hx, yA, 0.15), P(-r.hx, yA, -0.15)], { out: [-ex[0], 0, -ex[2]] });
    }
  }
}

function addRamp(kit, s) {
  const rp = s.ramp, r = s.r;
  if (s.thin) {
    // A walkway ramp in the air: a sloped slab with a soffit.
    const A = (lx, y, lz) => W3(r, lx, y, lz);
    kit.poly("slab", [A(-r.hx, rp.y0, r.hz), A(r.hx, rp.y1, r.hz), A(r.hx, rp.y1, -r.hz), A(-r.hx, rp.y0, -r.hz)], { out: [0, 1, 0] });
    kit.beam("concrete", A(-r.hx, rp.y0 - DECK_T / 2, 0), A(r.hx, rp.y1 - DECK_T / 2, 0), r.hz * 2, DECK_T, { ends: true });
    return;
  }
  const ga = groundBelow(...toWorld(r, -r.hx, 0)), gb = groundBelow(...toWorld(r, r.hx, 0));
  const base = Math.min(rp.y0, rp.y1, ga, gb) - 0.4;
  const A = (lx, y, lz) => W3(r, lx, y, lz);
  const hx = r.hx, hz = r.hz;
  // Top (sloped), the two long sides down to the base, both ends.
  const ex = [Math.cos(r.yaw), 0, -Math.sin(r.yaw)], ez = [Math.sin(r.yaw), 0, Math.cos(r.yaw)];
  kit.poly("slab", [A(-hx, rp.y0, hz), A(hx, rp.y1, hz), A(hx, rp.y1, -hz), A(-hx, rp.y0, -hz)], { out: [0, 1, 0] });
  kit.poly("concrete", [A(-hx, base, hz), A(hx, base, hz), A(hx, rp.y1, hz), A(-hx, rp.y0, hz)], { out: ez });
  kit.poly("concrete", [A(hx, base, -hz), A(-hx, base, -hz), A(-hx, rp.y0, -hz), A(hx, rp.y1, -hz)], { out: [-ez[0], 0, -ez[2]] });
  kit.poly("concrete", [A(-hx, base, -hz), A(-hx, base, hz), A(-hx, rp.y0, hz), A(-hx, rp.y0, -hz)], { out: [-ex[0], 0, -ex[2]] });
  kit.poly("concrete", [A(hx, base, hz), A(hx, base, -hz), A(hx, rp.y1, -hz), A(hx, rp.y1, hz)], { out: ex });
  // Grip strips across the ramp every 1.2 m.
  for (let lx = -hx + 0.6; lx < hx - 0.3; lx += 1.2) {
    const t = (lx + hx) / (2 * hx);
    const y = rp.y0 + (rp.y1 - rp.y0) * t;
    const [cx, cz] = toWorld(r, lx, 0);
    kit.boxY("matte", cx, cz, 0.04, hz - 0.08, y - 0.02, y + 0.008, r.yaw, { color: "#8b8f92", faces: { px: false, nx: false, pz: false, nz: false } });
  }
}

function addLanding(kit, s) {
  const r = s.r;
  if (s.thin) {
    const [cx, cz] = r.c;
    kit.boxY("concrete", cx, cz, r.hx, r.hz, s.y - DECK_T, s.y, r.yaw, { topKey: "slab", faces: { bottom: true } });
    return;
  }
  let g = Infinity;
  for (const [x, z] of rectCorners(r)) g = Math.min(g, groundBelow(x, z));
  kit.boxY("concrete", r.c[0], r.c[1], r.hx, r.hz, Math.min(g, s.y) - 0.5, s.y, r.yaw, { topKey: "slab" });
}

function addDeck(kit, s) {
  const r = s.r;
  kit.boxY("concrete", r.c[0], r.c[1], r.hx, r.hz, s.y - DECK_T, s.y, r.yaw, { topKey: "slab", faces: { bottom: true } });
  // A fascia band under the deck edge (the slab edge reads as a cream line).
  // (The parapets come from the rails.)
}

function addColumns(kit) {
  for (const c of schoolColumns()) {
    if (c.post) {
      kit.post("metal", c.x, c.z, c.y0, c.y1, c.r * 0.8, 8, { color: GALV });
      continue;
    }
    if (c.verandah) {
      if (c.pier === "brick") {
        // The 1920s verandahs: square brick piers with a concrete cap (video 8).
        kit.boxY("brick", c.x, c.z, 0.3, 0.3, c.y0 - 0.1, c.y1 - 0.25, 0);
        kit.boxY("slab", c.x, c.z, 0.36, 0.36, c.y1 - 0.25, c.y1 - 0.1, 0);
      } else {
        kit.post("metal", c.x, c.z, c.y0 - 0.05, c.y1, 0.1, 8, { color: "#2f3438" });
      }
      continue;
    }
    if (c.undercroft) {
      // The undercroft (video 3): brick piers round the edge, round concrete columns down the middle.
      if (c.brick) kit.boxY("brick", c.x, c.z, 0.28, 0.28, c.y0 - 0.1, c.y1, 0);
      else kit.post("concrete", c.x, c.z, c.y0 - 0.05, c.y1, 0.3, 12, { color: "#d9d6cd" });
      continue;
    }
    kit.boxY("paint", c.x, c.z, 0.17, 0.17, c.y0 - 0.05, c.y1, 0, { color: CREAM });
    // A brick base to each column.
    kit.boxY("brick", c.x, c.z, 0.24, 0.24, c.y0 - 0.1, c.y0 + 0.9, 0);
  }
}

function addTowerRoofs(kit) {
  for (const b of SCHOOL_BUILDINGS) {
    const eave = b.y0 + (b.wallH || b.floors * STOREY);
    for (const t of b.towers || []) {
      const fp = towerFootprint(b, t);
      // A skillion roof over the tower, falling away from the building.
      const P = (lx, y, lz) => W3(b, lx, y, lz);
      const ez = [Math.sin(b.yaw), 0, Math.cos(b.yaw)];
      const x0 = fp.lx0 - 0.4, x1 = fp.lx1 + 0.4, z0 = fp.lz0 - 0.3, z1 = fp.lz1 + 0.6;
      const roofY = towerRoofY(b, t);
      const yHi = roofY + 0.5, yLo = roofY + 0.05;
      void eave;
      const base = b.y0 + t.floors[0] * STOREY;
      if (t.glazed) {
        // THE GLASS STAIRS (video 5): glazed all round the outer three sides,
        // dark aluminium mullions, a solid upstand at every landing.
        const G = (lx, y, lz) => W3(b, lx, y, lz);
        const sides = [[[fp.lx0, fp.lz1 - 0.05], [fp.lx1, fp.lz1 - 0.05]], [[fp.lx0 + 0.05, fp.lz0], [fp.lx0 + 0.05, fp.lz1]], [[fp.lx1 - 0.05, fp.lz0], [fp.lx1 - 0.05, fp.lz1]]];
        for (const [a, c2] of sides) {
          kit.poly("glazing", [G(a[0], base + 1.15, a[1]), G(c2[0], base + 1.15, c2[1]), G(c2[0], roofY - 0.1, c2[1]), G(a[0], roofY - 0.1, a[1])], { double: true });
          const L = Math.hypot(c2[0] - a[0], c2[1] - a[1]);
          const n = Math.max(1, Math.round(L / 1.6));
          for (let k = 0; k <= n; k++) {
            const lx = a[0] + ((c2[0] - a[0]) * k) / n, lz = a[1] + ((c2[1] - a[1]) * k) / n;
            const [x, z] = toWorld(b, lx, lz);
            kit.boxY("paint", x, z, 0.05, 0.05, base, roofY, b.yaw, { color: "#3a4046" });
          }
          for (let f = t.floors[0]; f <= t.floors[t.floors.length - 1]; f++) {
            for (const yy of [b.y0 + f * STOREY + 1.1, b.y0 + f * STOREY + STOREY / 2 + 1.1]) {
              if (yy > roofY - 0.3) continue;
              kit.beam("paint", G(a[0], yy, a[1]), G(c2[0], yy, c2[1]), 0.1, 0.1, { color: "#3a4046" });
            }
          }
        }
      }
      if (t.tas) {
        // The TAS stairs (video 4): a brick blade wall at the half landing with
        // the rainbow TAS poster on it.
        const far = t.x + t.dir * (TOWER_STEPS * TOWER_TREAD + TOWER_LAND) + t.dir * 0.2;
        const [wx, wz] = toWorld(b, far, fp.lz0 + TOWER_W);
        const yaw = b.yaw;
        kit.boxY("brick", wx, wz, 0.18, TOWER_W, base - 0.3, roofY, yaw);
        const half = base + STOREY / 2;
        const px = far - t.dir * 0.2;
        const G = (lx, y, lz) => W3(b, lx, y, lz);
        const lz0 = fp.lz0 + TOWER_W - 1.1, lz1 = fp.lz0 + TOWER_W + 1.1;
        // (left edge first as you face it; explicit UVs so it can't flip)
        const L0 = t.dir > 0 ? lz0 : lz1, L1 = t.dir > 0 ? lz1 : lz0;
        kit.poly("posterTAS", [G(px, half + 0.7, L0), G(px, half + 0.7, L1), G(px, half + 3.6, L1), G(px, half + 3.6, L0)], { out: [-t.dir * Math.cos(yaw), 0, t.dir * Math.sin(yaw)], uv: [[0, 0], [1, 0], [1, 1], [0, 1]] });
      }
      kit.poly("redSteel", [P(x0, yLo, z1), P(x1, yLo, z1), P(x1, yHi, z0), P(x0, yHi, z0)], { out: [0, 1, 0] });
      kit.poly("paint", [P(x0, yHi - 0.03, z0), P(x1, yHi - 0.03, z0), P(x1, yLo - 0.03, z1), P(x0, yLo - 0.03, z1)], { color: CREAM, out: [0, -1, 0] });
      kit.poly("paint", [P(x0, yLo - 0.22, z1), P(x1, yLo - 0.22, z1), P(x1, yLo + 0.02, z1), P(x0, yLo + 0.02, z1)], { color: CREAM, out: ez });
    }
  }
}

/** Free-standing canopies (the Food Tech walkway's roof — video 7). */
function addCanopies(kit) {
  for (const cn of SCHOOL_CANOPIES) {
    const ex = 0.25;
    kit.boxY("greySteel", cn.c[0], cn.c[1], cn.hx + ex, cn.hz + ex, cn.y, cn.y + 0.12, cn.yaw, { faces: { bottom: true }, bottomKey: "paint", color: "#e8e6df" });
    kit.boxY("paint", cn.c[0], cn.c[1], cn.hx + ex + 0.05, cn.hz + ex + 0.05, cn.y - 0.18, cn.y, cn.yaw, { color: CREAM, faces: { top: false } });
  }
  for (const p of canopyPosts()) kit.post("metal", p.x, p.z, p.y0 - 0.05, p.y1, 0.08, 8, { color: "#59606a" });
}

/** The COLA: a big steel shade roof on six columns over the handball slab. */
function addCola(kit) {
  const { c, hx, hz, roofY } = COLA;
  const y0 = COLA.y;
  const posts = [];
  for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) posts.push([c[0] + sx * (hx - 0.4), c[1] + sz * (hz - 0.4)]);
  for (const [x, z] of posts) {
    kit.post("metal", x, z, y0 - 0.05, roofY - 0.1, 0.2, 10, { color: "#5f7d95" });
    kit.boxY("slab", x, z, 0.4, 0.4, y0 - 0.1, y0 + 0.25, 0);
  }
  // Perimeter beams.
  for (const sz of [-1, 1]) kit.beam("metal", [c[0] - hx + 0.4, roofY - 0.25, c[1] + sz * (hz - 0.4)], [c[0] + hx - 0.4, roofY - 0.25, c[1] + sz * (hz - 0.4)], 0.3, 0.5, { color: "#5f7d95" });
  for (const sx of [-1, 0, 1]) kit.beam("metal", [c[0] + sx * (hx - 0.4), roofY - 0.25, c[1] - hz + 0.4], [c[0] + sx * (hx - 0.4), roofY - 0.25, c[1] + hz - 0.4], 0.3, 0.5, { color: "#5f7d95" });
  // A low gable roof (ridge along x), overhanging the slab.
  const oh = 0.9, z0 = c[1] - hz - oh, z1 = c[1] + hz + oh, x0 = c[0] - hx - oh, x1 = c[0] + hx + oh;
  const ridge = roofY + 0.14 * (hz + oh);
  const UP = [0, 1, 0], DN = [0, -1, 0];
  kit.poly("greySteel", [[x0, roofY, z1], [x1, roofY, z1], [x1, ridge, c[1]], [x0, ridge, c[1]]], { out: UP, color: "#9fb4c6" });
  kit.poly("greySteel", [[x1, roofY, z0], [x0, roofY, z0], [x0, ridge, c[1]], [x1, ridge, c[1]]], { out: UP, color: "#9fb4c6" });
  kit.poly("paint", [[x0, roofY - 0.03, z1], [x1, roofY - 0.03, z1], [x1, ridge - 0.03, c[1]], [x0, ridge - 0.03, c[1]]], { out: DN, color: "#dfe4e6" });
  kit.poly("paint", [[x1, roofY - 0.03, z0], [x0, roofY - 0.03, z0], [x0, ridge - 0.03, c[1]], [x1, ridge - 0.03, c[1]]], { out: DN, color: "#dfe4e6" });
  for (const z of [z0, z1]) kit.poly("paint", [[x0, roofY - 0.25, z], [x1, roofY - 0.25, z], [x1, roofY + 0.03, z], [x0, roofY + 0.03, z]], { out: [0, 0, z > c[1] ? 1 : -1], color: "#e9e2cf" });
  // Gable ends + trusses.
  for (const [x, nx] of [[x0, -1], [x1, 1]]) kit.poly("paint", [[x, roofY, z0], [x, roofY, z1], [x, ridge, c[1]]], { out: [nx, 0, 0], color: "#e9e2cf" });
  for (let x = c[0] - hx + 0.4; x <= c[0] + hx - 0.3; x += (hx - 0.4) / 3) {
    kit.beam("metal", [x, roofY - 0.1, c[1] - hz + 0.4], [x, ridge - 0.15, c[1]], 0.14, 0.2, { color: "#5f7d95" });
    kit.beam("metal", [x, roofY - 0.1, c[1] + hz - 0.4], [x, ridge - 0.15, c[1]], 0.14, 0.2, { color: "#5f7d95" });
  }
}

/** Guard rails from schoolyardRails (walls / parapets / pipes). */
function addRails(kit) {
  for (const rl of getSchoolRails()) {
    const dx = rl.b[0] - rl.a[0], dz = rl.b[1] - rl.a[1];
    const L = Math.hypot(dx, dz);
    if (L < 0.2) continue;
    const ux = dx / L, uz = dz / L;
    const [nx, nz] = rl.n;
    if (rl.style === "wall") {
      // A brick parapet with a concrete coping (the terrace edges).
      const o = 0.13;
      const a = [rl.a[0] - nx * o, rl.a[1] - nz * o], b = [rl.b[0] - nx * o, rl.b[1] - nz * o];
      kit.wall("brick", a, b, Math.min(rl.ya, rl.yb) - 0.05, rl.ya + 1.0, 0.26, { topKey: "slab", extend: 0.13 });
      continue;
    }
    if (rl.style === "parapet") {
      // The corridor decks: a concrete upstand + a galvanised top rail.
      const o = 0.08;
      const a = [rl.a[0] - nx * o, rl.a[1] - nz * o], b = [rl.b[0] - nx * o, rl.b[1] - nz * o];
      kit.wall("paint", a, b, rl.ya - DECK_T - 0.05, rl.ya + 0.85, 0.16, { color: CREAM, extend: 0.08 });
      const n = Math.max(1, Math.round(L / 2));
      for (let k = 0; k <= n; k++) {
        const x = a[0] + (b[0] - a[0]) * (k / n), z = a[1] + (b[1] - a[1]) * (k / n);
        kit.post("metal", x, z, rl.ya + 0.85, rl.ya + 1.1, 0.025, 6, { color: GALV, cap: false });
      }
      kit.tube("metal", [a[0], rl.ya + 1.1, a[1]], [b[0], rl.ya + 1.1, b[1]], 0.035, 8, { color: GALV });
      continue;
    }
    if (rl.style === "picket") {
      // The Maths balconies: a steel picket balustrade on a low upstand (video 11).
      const o = 0.06;
      const a = [rl.a[0] - nx * o, rl.a[1] - nz * o], b = [rl.b[0] - nx * o, rl.b[1] - nz * o];
      kit.wall("paint", a, b, rl.ya - DECK_T - 0.05, rl.ya + 0.15, 0.14, { color: CREAM, extend: 0.07 });
      const n = Math.max(1, Math.round(L / 0.12));
      for (let k = 0; k <= n; k++) {
        const x = a[0] + (b[0] - a[0]) * (k / n), z = a[1] + (b[1] - a[1]) * (k / n);
        kit.boxY("paint", x, z, 0.012, 0.012, rl.ya + 0.15, rl.ya + 1.1, 0, { color: "#2f3438", faces: { top: false } });
      }
      kit.beam("paint", [a[0], rl.ya + 1.12, a[1]], [b[0], rl.ya + 1.12, b[1]], 0.06, 0.05, { color: "#2f3438" });
      kit.beam("paint", [a[0], rl.ya + 0.2, a[1]], [b[0], rl.ya + 0.2, b[1]], 0.05, 0.04, { color: "#2f3438" });
      continue;
    }
    // Galvanised pipe rails (stairs, ramps, landings).
    const o = 0.06;
    const ax = rl.a[0] - nx * o, az = rl.a[1] - nz * o, bx = rl.b[0] - nx * o, bz = rl.b[1] - nz * o;
    const n = Math.max(1, Math.ceil(L / 1.6));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const x = ax + (bx - ax) * t, z = az + (bz - az) * t, y = rl.ya + (rl.yb - rl.ya) * t;
      kit.post("metal", x, z, y - 0.05, y + 1.0, 0.028, 6, { color: GALV, cap: false });
    }
    kit.tube("metal", [ax, rl.ya + 1.0, az], [bx, rl.yb + 1.0, bz], 0.032, 8, { color: GALV });
    kit.tube("metal", [ax, rl.ya + 0.5, az], [bx, rl.yb + 0.5, bz], 0.022, 6, { color: GALV });
    void ux; void uz;
  }
}

/** Ground-floor corridors: a concrete strip under each verandah. */
function addGroundCorridors(kit) {
  for (const b of SCHOOL_BUILDINGS) {
    if (!b.corridor || !b.corridor.ground) continue;
    const c = b.corridor;
    const r = { c: toWorld(b, (c.x0 + c.x1) / 2, b.hz + CORRIDOR_W / 2), yaw: b.yaw, hx: (c.x1 - c.x0) / 2, hz: CORRIDOR_W / 2 };
    drapePolygon(kit, "slab", rectCorners(r), (x, z) => Math.max(groundBelow(x, z), b.y0), { lift: 0.035, maxEdge: 2 });
  }
}

function buildStructures() {
  const kit = new Kit();
  for (const s of getSchoolStructures().list) {
    if (s.kind === "flight") addFlight(kit, s);
    else if (s.kind === "ramp") addRamp(kit, s);
    else if (s.kind === "landing") addLanding(kit, s);
    else if (s.kind === "deck") addDeck(kit, s);
  }
  addColumns(kit);
  addTowerRoofs(kit);
  addCanopies(kit);
  addCola(kit);
  addRails(kit);
  addGroundCorridors(kit);
  return kit.build();
}

export function SchoolStructures() {
  const built = useMemo(buildStructures, []);
  return (
    <group>
      {built.map(({ key, geometry }) => (
        <mesh key={key} geometry={geometry} material={kitMat(key)} castShadow={!NO_SHADOW_KEYS.has(key)} receiveShadow />
      ))}
    </group>
  );
}

export { inSchoolBuilding };
