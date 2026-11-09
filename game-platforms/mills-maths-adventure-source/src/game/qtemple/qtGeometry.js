import * as THREE from "three";

import {
  CELLS, BLOCKS, isCarved, baseFloor, ceilingAt, descentY, QT_HALL,
} from "../../data/qtemple/qtempleWorld.js";

/**
 * QUOTIENT TEMPLE GEOMETRY (2026-11-09) — turns the carved-rock plan in
 * data/qtemple/qtempleWorld.js into boxes, so what you SEE is exactly what
 * the physics walks on:
 *   floorBoxes()   each room's floor slab (stepped floors → one slab a step)
 *   wallBoxes()    walk every room's edges: rock behind → a wall; another
 *                  room behind → an opening, with a LINTEL above it when the
 *                  next room's ceiling is lower and a RISER when its floor
 *                  is higher
 *   ceilingBoxes() each room's ceiling slab (the Great Hall's nave is left
 *                  open for the vault)
 *   blockParts()   the galleries, daises, ledges, terraces, stairs + ramps
 * Every box: { p: centre, s: size, m: look name, tile: metres a texture }.
 */

const floorOf = (c, x, z) => (typeof c.floor === "function" ? c.floor(x, z) : c.floor);
const ceilOf = (c, x, z) => (typeof c.ceil === "function" ? c.ceil(x, z) : c.ceil);
const topOf = (b, x, z) => (typeof b.top === "function" ? b.top(x, z) : b.top);

// Each room look → its floor, wall + ceiling materials (names in qtMaterials).
export const LOOKS = {
  sandstone: { floor: "paving", wall: "sandstone", ceil: "coffer", ft: 3, wt: 3 },
  stairs: { floor: "paving", wall: "sandstone", ceil: "coffer", ft: 2.5, wt: 3 },
  marble: { floor: "marble", wall: "marbleWall", ceil: "coffer", ft: 8, wt: 3 },
  diamond: { floor: "diamond", wall: "bricks", ceil: "coffer", ft: 3, wt: 2 },
  wood: { floor: "wood", wall: "darkBricks", ceil: "woodCeil", ft: 2, wt: 2 },
  brick: { floor: "bricks", wall: "bricks", ceil: "darkBricks", ft: 2, wt: 2 },
  slab: { floor: "slab", wall: "darkStone", ceil: "slabCeil", ft: 4, wt: 4 },
  gold: { floor: "goldTiles", wall: "sandstone", ceil: "coffer", ft: 3, wt: 3 },
  sand: { floor: "sand", wall: "sandstone", ceil: "sandCeil", ft: 6, wt: 3 },
};
// Block looks → { top, side } material names.
const BLOCK_LOOKS = {
  marble: { top: "marble", side: "marbleWall", tt: 8, st: 3 },
  brick: { top: "bricks", side: "bricks", tt: 2, st: 2 },
  brickRamp: { top: "ramp", side: "bricks", tt: 4, st: 2 },
  darkStone: { top: "slab", side: "darkStone", tt: 4, st: 4 },
  sandstone: { top: "paving", side: "sandstone", tt: 3, st: 3 },
  wood: { top: "wood", side: "woodSide", tt: 2, st: 2 },
};

/** Constant-height runs of f(t) for t in [a, b] (scan step `ds`). */
function runs(a, b, f, ds = 0.02) {
  const out = [];
  let t0 = a, v0 = f(a + ds / 2);
  for (let t = a + ds; t < b - 1e-9; t += ds) {
    const v = f(t + ds / 2);
    if (Math.abs(v - v0) > 1e-6) { out.push({ a: t0, b: t, v: v0 }); t0 = t; v0 = v; }
  }
  out.push({ a: t0, b, v: v0 });
  return out;
}
const B = (x0, x1, y0, y1, z0, z1, m, tile = 1, extra = {}) => ({
  p: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], s: [Math.max(0.01, x1 - x0), Math.max(0.01, y1 - y0), Math.max(0.01, z1 - z0)], m, tile, ...extra,
});
const isFn = (v) => typeof v === "function";

/** Which axis a cell's floor varies along ("x" | "z" | null). */
function floorAxis(c) {
  if (!isFn(c.floor)) return null;
  const zm = (c.z0 + c.z1) / 2, xm = (c.x0 + c.x1) / 2;
  const vx = Math.abs(floorOf(c, c.x0 + 0.01, zm) - floorOf(c, c.x1 - 0.01, zm)) > 1e-6
    || Math.abs(floorOf(c, (c.x0 + xm) / 2, zm) - floorOf(c, xm, zm)) > 1e-6;
  return vx ? "x" : "z";
}

export function floorBoxes() {
  const out = [];
  for (const c of CELLS) {
    const L = LOOKS[c.mat];
    const axis = floorAxis(c);
    if (!axis) { out.push(B(c.x0, c.x1, c.floor - 1, c.floor, c.z0, c.z1, L.floor, L.ft, { cell: c.id })); continue; }
    if (axis === "z") {
      for (const r of runs(c.z0, c.z1, (z) => floorOf(c, (c.x0 + c.x1) / 2, z))) out.push(B(c.x0, c.x1, r.v - 1.2, r.v, r.a, r.b, L.floor, L.ft, { cell: c.id, step: true }));
    } else {
      for (const r of runs(c.x0, c.x1, (x) => floorOf(c, x, (c.z0 + c.z1) / 2))) out.push(B(r.a, r.b, r.v - 1.2, r.v, c.z0, c.z1, L.floor, L.ft, { cell: c.id, step: true }));
    }
  }
  return out;
}

/** The Grand Descent's tread runs (for the carpet + the handrails). */
export function descentSteps() {
  return runs(33.5, 73.5, (z) => descentY(z));
}

export function ceilingBoxes() {
  const out = [];
  for (const c of CELLS) {
    const L = LOOKS[c.mat];
    if (c.id === "hall") {
      // The aisles only — the nave (|x| < 19) gets the gold-ribbed vault.
      out.push(B(c.x0, -19, c.ceil, c.ceil + 1, c.z0, c.z1, L.ceil, 6));
      out.push(B(19, c.x1, c.ceil, c.ceil + 1, c.z0, c.z1, L.ceil, 6));
      continue;
    }
    if (isFn(c.ceil)) {
      for (const r of runs(c.z0, c.z1, (z) => ceilOf(c, (c.x0 + c.x1) / 2, z))) out.push(B(c.x0, c.x1, r.v, r.v + 1, r.a, r.b, L.ceil, 6));
      continue;
    }
    out.push(B(c.x0, c.x1, c.ceil, c.ceil + 1, c.z0, c.z1, L.ceil, 6));
  }
  return out;
}

/**
 * Walk a room's four edges in small steps: rock behind → wall; a room behind
 * → nothing, or a lintel (its ceiling's lower) / a riser (its floor's higher).
 */
export function wallBoxes({ ds = 0.1, thick = 1 } = {}) {
  const out = [];
  for (const c of CELLS) {
    const L = LOOKS[c.mat];
    const edges = [
      { axis: "z", fixed: c.x0, n: -1, a: c.z0, b: c.z1 },
      { axis: "z", fixed: c.x1, n: 1, a: c.z0, b: c.z1 },
      { axis: "x", fixed: c.z0, n: -1, a: c.x0, b: c.x1 },
      { axis: "x", fixed: c.z1, n: 1, a: c.x0, b: c.x1 },
    ];
    for (const e of edges) {
      const at = (t, off) => (e.axis === "z" ? [e.fixed + e.n * off, t] : [t, e.fixed + e.n * off]);
      // Classify each little piece of the edge.
      const pieces = [];
      for (let t = e.a; t < e.b - 1e-9; t += ds) {
        const tm = Math.min(e.b, t + ds / 2);
        const [ix, iz] = at(tm, -0.3);
        const [ox, oz] = at(tm, 0.3);
        const f = floorOf(c, ix, iz), ce = ceilOf(c, ix, iz);
        let kind, y0, y1;
        if (!isCarved(ox, oz)) { kind = "wall"; y0 = f - 1.5; y1 = ce + 1; } else {
          const nf = baseFloor(ox, oz), nc = ceilingAt(ox, oz);
          const parts = [];
          if (nc < ce - 0.01) parts.push({ kind: "lintel", y0: nc, y1: ce + 1 });
          if (nf > f + 0.01) parts.push({ kind: "riser", y0: f - 1.5, y1: nf - 0.02 });
          pieces.push({ t, t1: Math.min(e.b, t + ds), parts });
          continue;
        }
        pieces.push({ t, t1: Math.min(e.b, t + ds), parts: [{ kind, y0, y1 }] });
      }
      // Merge neighbouring pieces with the same parts.
      const sig = (p) => p.parts.map((q) => `${q.kind}:${q.y0.toFixed(3)}:${q.y1.toFixed(3)}`).join("|");
      const merged = [];
      for (const p of pieces) {
        const last = merged[merged.length - 1];
        if (last && sig(last) === sig(p)) last.t1 = p.t1; else merged.push({ ...p });
      }
      for (const m of merged) {
        for (const q of m.parts) {
          // Walls + risers sit in the rock / under the next floor (outward);
          // lintels hang just inside this room (so no face is shared).
          const lt = q.kind === "lintel" ? 0.6 : thick;
          const o0 = q.kind === "lintel" ? -lt : 0, o1 = q.kind === "lintel" ? 0 : lt;
          const n0 = e.fixed + e.n * (e.n > 0 ? o0 : o1);
          const n1 = e.fixed + e.n * (e.n > 0 ? o1 : o0);
          const lo = Math.min(n0, n1), hi = Math.max(n0, n1);
          const box = e.axis === "z"
            ? B(lo, hi, q.y0, q.y1, m.t, m.t1, L.wall, L.wt)
            : B(m.t, m.t1, q.y0, q.y1, lo, hi, L.wall, L.wt);
          box.kind = q.kind; box.cell = c.id; box.edge = e; box.span = [m.t, m.t1];
          out.push(box);
        }
      }
    }
  }
  return out;
}

/** The plain wall runs of one room (for trims, panels + sconces). */
export function wallRuns(cellId) {
  return wallBoxes().filter((w) => w.cell === cellId && w.kind === "wall");
}

/** A sloped block: top(x, z) on the corners (ramps). Metre UVs. */
export function wedgeGeometry(x0, z0, x1, z1, top, bottom, tile = 2) {
  const t00 = top(x0, z0), t10 = top(x1, z0), t01 = top(x0, z1), t11 = top(x1, z1);
  const P = [];
  const UV = [];
  const quad = (a, b, c, d, ua, ub, uc, ud) => {
    P.push(...a, ...b, ...c, ...a, ...c, ...d);
    UV.push(...ua, ...ub, ...uc, ...ua, ...uc, ...ud);
  };
  const w = x1 - x0, d = z1 - z0;
  const s = (v) => v / tile;
  // top (+y): x0z1 → x1z1 → x1z0 → x0z0 (counter-clockwise seen from above)
  const lenZ = Math.hypot(d, (t01 + t11) / 2 - (t00 + t10) / 2);
  const lenX = Math.hypot(w, (t10 + t11) / 2 - (t00 + t01) / 2);
  quad([x0, t01, z1], [x1, t11, z1], [x1, t10, z0], [x0, t00, z0], [0, 0], [s(lenX), 0], [s(lenX), s(lenZ)], [0, s(lenZ)]);
  // sides
  quad([x0, bottom, z1], [x1, bottom, z1], [x1, t11, z1], [x0, t01, z1], [0, 0], [s(w), 0], [s(w), s(t11 - bottom)], [0, s(t01 - bottom)]); // +z
  quad([x1, bottom, z0], [x0, bottom, z0], [x0, t00, z0], [x1, t10, z0], [0, 0], [s(w), 0], [s(w), s(t00 - bottom)], [0, s(t10 - bottom)]); // −z
  quad([x1, bottom, z1], [x1, bottom, z0], [x1, t10, z0], [x1, t11, z1], [0, 0], [s(d), 0], [s(d), s(t10 - bottom)], [0, s(t11 - bottom)]); // +x
  quad([x0, bottom, z0], [x0, bottom, z1], [x0, t01, z1], [x0, t00, z0], [0, 0], [s(d), 0], [s(d), s(t01 - bottom)], [0, s(t00 - bottom)]); // −x
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
  g.computeVertexNormals();
  return g;
}

/** Boxes (+ ramp wedges) for every BLOCK — body in the side look, a cap on top. */
export function blockParts() {
  const boxes = [];
  const wedges = [];
  for (const b of BLOCKS) {
    const L = BLOCK_LOOKS[b.look] || BLOCK_LOOKS.sandstone;
    const xm = (b.x0 + b.x1) / 2, zm = (b.z0 + b.z1) / 2;
    const bottom = Math.min(
      baseFloor(xm, zm), baseFloor(b.x0 + 0.05, b.z0 + 0.05), baseFloor(b.x1 - 0.05, b.z1 - 0.05),
      baseFloor(b.x0 + 0.05, b.z1 - 0.05), baseFloor(b.x1 - 0.05, b.z0 + 0.05),
    ) - 0.5;
    if (b.kind === "ramp") {
      wedges.push({ id: b.id, geo: wedgeGeometry(b.x0, b.z0, b.x1, b.z1, (x, z) => topOf(b, x, z), bottom, L.tt), m: L.top, side: L.side });
      continue;
    }
    // Nested blocks (daises, terraces) inset a hair by height so shared faces never fight.
    const e = !isFn(b.top) ? Math.max(0, 0.0015 * (b.top + 33)) : 0;
    const x0 = b.x0 + e, x1 = b.x1 - e, z0 = b.z0 + e, z1 = b.z1 - e;
    if (b.kind === "stair") {
      const varX = Math.abs(topOf(b, b.x0 + 0.01, zm) - topOf(b, b.x1 - 0.01, zm)) > 1e-6;
      const rr = varX ? runs(b.x0, b.x1, (x) => topOf(b, x, zm)) : runs(b.z0, b.z1, (z) => topOf(b, xm, z));
      for (const r of rr) {
        const [a0, a1, c0, c1] = varX ? [r.a, r.b, b.z0, b.z1] : [b.x0, b.x1, r.a, r.b];
        boxes.push(B(a0, a1, bottom, r.v - 0.1, c0, c1, L.side, L.st, { block: b.id }));
        boxes.push(B(a0, a1, r.v - 0.1, r.v, c0, c1, L.top === "marble" ? "marblePale" : L.top, L.tt, { block: b.id, cap: true }));
      }
      continue;
    }
    const top = b.top;
    boxes.push(B(x0, x1, bottom, top - 0.12, z0, z1, L.side, L.st, { block: b.id }));
    boxes.push(B(x0 - 0.04, x1 + 0.04, top - 0.12, top, z0 - 0.04, z1 + 0.04, L.top, L.tt, { block: b.id, cap: true }));
  }
  return { boxes, wedges };
}

export { QT_HALL };
