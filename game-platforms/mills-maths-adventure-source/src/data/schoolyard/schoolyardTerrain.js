/**
 * RETRIEVAL PRACTICE PLAYGROUND — TERRAIN + STRUCTURES (rebuilt 2026-10-09).
 * Pure + deterministic. Everything the player stands on, and everything the
 * follow camera must not look through:
 *
 *   TERRAIN      a 1 m height grid (the island/snow pipeline): the hillside
 *                landform (the bush hill behind, the town falling away to
 *                the sea in front, Beacon Hill to the west), level PADS (the
 *                lawns, the oval), graded PATHS (the bush track…), and the
 *                ground CARVED down under every platform + building so it
 *                never pokes through. The renderer meshes the SAME grid with
 *                the SAME triangle split as `terrainHeight`.
 *   SOLID        the built terraces (platforms), stair flights, ramps,
 *                landings, raised planters, the hall stage — you can't be
 *                under them.
 *   THIN         the open corridor DECKS on each storey, the stair towers'
 *                upper flights + landings, Block C's balcony, the Sky Pier —
 *                they only count once you're at/above them, so you walk
 *                UNDER the corridors on the floor below.
 *   CEILINGS     every deck's underside + the corridor roofs, the COLA, the
 *                hall's roof inside — and BLOCKERS (the building bodies) —
 *                for `schoolCameraFit`, which keeps the follow camera under
 *                the corridor ceilings and out of the buildings.
 */
import {
  clamp, lerp, smoothstep, toLocal, toWorld, inRect, inPoly, polySD, polyBox, rectBox, segDistT, stripRect,
} from "./schoolyardGeom.js";
import { fbm, vnoise, smoothPolyline, cumLengths, buildSegIndex } from "../terrainKit.js";
import {
  LV, STOREY, DECK_T, CORRIDOR_W, SEA_Y, SCHOOL_FENCE, SCHOOL_PLATFORMS, SCHOOL_BUILDINGS, SCHOOL_FLIGHTS,
  SCHOOL_LANDINGS, SCHOOL_RAMPS, SCHOOL_RAMP_LANDINGS, SKY_PIER, SCHOOL_PADS, SCHOOL_PATH_CTRL, HALL, QUAD_FIGS,
  COURT_BEDS, COLA, BACKDROP,
} from "./schoolyardLayout.js";

/** Mirrors systems/collisionEngine.js STEP_UP (the checks assert they match). */
export const S_STEP_UP = 0.45;
export const S_SLIDE_SLOPE = 1.05;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// THE LANDFORM (before pads / paths / carving) — valid everywhere, so the far
// backdrop mesh can use it too.
// ---------------------------------------------------------------------------
/** The coastline's z at x (Jetty Beach's gentle curve, the harbour beyond). */
export function coastZ(x) {
  return BACKDROP.beachZ + 18 * Math.sin(x / 140 + 0.6) - 26 * smoothstep(150, 320, x) * smoothstep(520, 330, x);
}
export function rawHeight(x, z) {
  // The campus hillside: 9 m up at the back (north) → 0 at the front.
  let h = 9 * (1 - smoothstep(-84, 34, z));
  // The bush hill behind the school, rising on into the hinterland.
  h += 12.6 * smoothstep(-99, -133, z) + Math.max(0, -133 - z) * 0.2;
  // Out the front: the town falls away down to Jetty Beach + the sea.
  if (z > 126) {
    const d = z - 126;
    h -= 0.075 * d + 0.00004 * d * d;
  }
  // The shore: sand just above the sea, then the sea floor shelving away.
  const cz = coastZ(x);
  if (z > cz - 30) {
    const t = z - cz;
    const shore = SEA_Y + 1.6 - 0.11 * t - 0.002 * Math.max(0, t) ** 2;
    h = lerp(h, Math.min(h, shore), smoothstep(-30, -6, t));
  }
  // Beacon Hill to the west; the hinterland ridges far to the north.
  h += 30 * smoothstep(-150, -330, x) * (1 - smoothstep(180, 360, z));
  h += 22 * smoothstep(-160, -320, z) * (0.6 + 0.4 * fbm(x / 120, 3.1, 2, 7));
  // Gentle undulation (quieter inside the fence).
  const inside = x > SCHOOL_FENCE.xMin - 6 && x < SCHOOL_FENCE.xMax + 6 && z > SCHOOL_FENCE.zMin - 6 && z < SCHOOL_FENCE.zMax + 6;
  h += (fbm(x / 46 + 3, z / 46 - 2, 3, 11) - 0.5) * (inside ? 0.9 : 3.2);
  h += (vnoise(x / 6, z / 6, 12) - 0.5) * (inside ? 0.12 : 0.4);
  return h;
}

// ---------------------------------------------------------------------------
// TERRAIN PADS (superellipse, banked — the island/farm recipe)
// ---------------------------------------------------------------------------
function padQ(f, x, z) {
  const ax = Math.abs(x - f.c[0]) / f.rx, az = Math.abs(z - f.c[1]) / f.rz;
  return Math.pow(Math.pow(ax, f.p) + Math.pow(az, f.p), 1 / f.p);
}
function padEdgeDist(f, x, z, q = padQ(f, x, z)) {
  const r = Math.hypot(x - f.c[0], z - f.c[1]);
  if (r < 1e-6) return -Math.min(f.rx, f.rz);
  return r * (1 - 1 / Math.max(q, 1e-6));
}
const BANK_BINS = 48;
const BANK_MAX = 18;
const PADS = SCHOOL_PADS.map((f) => {
  const bank = new Float32Array(BANK_BINS);
  for (let a = 0; a < BANK_BINS; a++) {
    const ang = (a / BANK_BINS) * TAU;
    const dx = Math.cos(ang), dz = Math.sin(ang);
    const rim = 1 / Math.pow(Math.pow(Math.abs(dx) / f.rx, f.p) + Math.pow(Math.abs(dz) / f.rz, f.p), 1 / f.p);
    let d0 = 0;
    for (const o of [0, 1.5, 3]) d0 = Math.max(d0, Math.abs(rawHeight(f.c[0] + dx * (rim + o), f.c[1] + dz * (rim + o)) - f.level));
    bank[a] = Math.min(BANK_MAX, 3 + d0 * 2.4);
  }
  return { ...f, bank };
});
function bankWidth(f, x, z) {
  const ang = Math.atan2(z - f.c[1], x - f.c[0]);
  const u = ((((ang / TAU) % 1) + 1) % 1) * BANK_BINS;
  const i = Math.floor(u) % BANK_BINS, t = u - Math.floor(u);
  return f.bank[i] + (f.bank[(i + 1) % BANK_BINS] - f.bank[i]) * t;
}
const ease = (t) => 0.5 * t + 0.5 * t * t * (3 - 2 * t);
function padUnder(x, z) {
  for (const f of PADS) {
    if (Math.abs(x - f.c[0]) > f.rx || Math.abs(z - f.c[1]) > f.rz) continue;
    if (padQ(f, x, z) <= 1) return f;
  }
  return null;
}
function padBlend(x, z, h) {
  const on = padUnder(x, z);
  if (on) return { h: on.level, w: 1 };
  let wsum = 0, lsum = 0, wmax = 0;
  for (const f of PADS) {
    if (Math.abs(x - f.c[0]) > f.rx + BANK_MAX + 2 || Math.abs(z - f.c[1]) > f.rz + BANK_MAX + 2) continue;
    const e = padEdgeDist(f, x, z);
    const B = bankWidth(f, x, z);
    if (e >= B) continue;
    const w = 1 - ease(e / B);
    const W = w / (1 - w + 1e-4);
    wsum += W; lsum += W * f.level; wmax = Math.max(wmax, w);
  }
  if (wmax <= 0) return { h, w: 0 };
  return { h: lerp(h, lsum / wsum, wmax), w: wmax };
}
export function getSchoolPads() { return PADS; }
export function onSchoolPad(id, x, z, inset = 0) {
  const f = PADS.find((p) => p.id === id);
  return Boolean(f) && padEdgeDist(f, x, z) <= -inset;
}

// ---------------------------------------------------------------------------
// PATHS — graded (smoothed profile, pinned on pads + at the ends, grade-
// limited), carved with batter cones (the island's recipe).
// ---------------------------------------------------------------------------
const PROFILE_W = 8;
export const SCHOOL_PATHS = SCHOOL_PATH_CTRL.map((p) => {
  const pts = smoothPolyline(p.ctrl, 1.4);
  const s = cumLengths(pts);
  const base = pts.map(([x, z]) => padBlend(x, z, rawHeight(x, z)));
  const pinned = base.map((b, i) => b.w > 0.97 || (!p.loop && (i === 0 || i === base.length - 1)));
  let prof = base.map((b) => b.h);
  for (let pass = 0; pass < 4; pass++) {
    prof = prof.map((v, i) => {
      if (pinned[i]) return base[i].h;
      let sum = 0, w = 0;
      for (let j = i; j >= 0 && s[i] - s[j] <= PROFILE_W; j--) { sum += prof[j]; w++; }
      for (let j = i + 1; j < prof.length && s[j] - s[i] <= PROFILE_W; j++) { sum += prof[j]; w++; }
      return sum / w;
    });
  }
  const G = 0.26;
  for (let it = 0; it < 10; it++) {
    for (let i = 1; i < prof.length; i++) {
      if (pinned[i]) continue;
      const d = (s[i] - s[i - 1]) * G;
      prof[i] = clamp(prof[i], prof[i - 1] - d, prof[i - 1] + d);
    }
    for (let i = prof.length - 2; i >= 0; i--) {
      if (pinned[i]) continue;
      const d = (s[i + 1] - s[i]) * G;
      prof[i] = clamp(prof[i], prof[i + 1] - d, prof[i + 1] + d);
    }
  }
  return { id: p.id, hw: p.hw, kind: p.kind, pts, s, prof };
});
const TRACK_REACH = 9;
const pathSegs = buildSegIndex(SCHOOL_PATHS.flatMap((p) => p.pts.slice(0, -1).map((a, i) => ({
  p, i, ax: a[0], az: a[1], bx: p.pts[i + 1][0], bz: p.pts[i + 1][1], reach: p.hw + TRACK_REACH,
}))));
/** Nearest path: { e: metres outside its edge (− = on it), cx, cz, h, p } or null. */
export function nearestSchoolPath(x, z) {
  let best = null, be = Infinity;
  for (const sg of pathSegs(x, z)) {
    const { d, t } = segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz);
    const e = d - sg.p.hw;
    if (e < be) {
      be = e;
      best = { e, cx: lerp(sg.ax, sg.bx, t), cz: lerp(sg.az, sg.bz, t), h: lerp(sg.p.prof[sg.i], sg.p.prof[sg.i + 1], t), p: sg.p };
    }
  }
  return best;
}
const BATTER = 0.7;
function trackCarve(x, z, h) {
  let lo = -Infinity, hi = Infinity;
  for (const sg of pathSegs(x, z)) {
    const { d, t } = segDistT(x, z, sg.ax, sg.az, sg.bx, sg.bz);
    const e = Math.max(0, d - sg.p.hw);
    if (e >= TRACK_REACH) continue;
    const hc = lerp(sg.p.prof[sg.i], sg.p.prof[sg.i + 1], t);
    const r = BATTER * e + 1.2 * Math.max(0, e - (TRACK_REACH - 3)) ** 2;
    lo = Math.max(lo, hc - r);
    hi = Math.min(hi, hc + r);
  }
  if (lo === -Infinity) return h;
  return lo <= hi ? clamp(h, lo, hi) : (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// STRUCTURES — built once (lazily, they don't need the terrain).
// Each: { id, kind, solid|thin, box:[x0,z0,x1,z1], top(x,z) → y | null,
//         under(x,z) → underside y (thin only) }
// ---------------------------------------------------------------------------
function rectStruct(id, kind, r, y, thin) {
  return {
    id, kind, thin, r, y, box: rectBox(r),
    top: (x, z) => (inRect(r, x, z) ? y : null),
    under: thin ? () => y - DECK_T : null,
  };
}
function flightRect(f) {
  const n = f.n, len = n * f.tread;
  const L = Math.hypot(f.dir[0], f.dir[1]) || 1;
  const ux = f.dir[0] / L, uz = f.dir[1] / L;
  return { c: [f.a[0] + ux * len / 2, f.a[1] + uz * len / 2], yaw: Math.atan2(-uz, ux), hx: len / 2, hz: f.w / 2 };
}
function flightStruct(f) {
  const r = flightRect(f);
  return {
    id: f.id, kind: "flight", thin: Boolean(f.thin), r, flight: f, box: rectBox(r),
    top(x, z) {
      const [lx, lz] = toLocal(r, x, z);
      if (Math.abs(lx) > r.hx || Math.abs(lz) > r.hz) return null;
      const k = Math.min(f.n - 1, Math.max(0, Math.floor((lx + r.hx) / f.tread)));
      return f.y0 + (k + 1) * f.rise;
    },
    under: f.thin ? (x, z) => {
      const [lx] = toLocal(r, x, z);
      return f.y0 + ((lx + r.hx) / (2 * r.hx)) * f.n * f.rise - 0.42;
    } : null,
  };
}
function rampStruct(rp) {
  const r = stripRect(rp.a, rp.b, rp.w / 2);
  return {
    id: rp.id, kind: "ramp", thin: false, r, ramp: rp, box: rectBox(r),
    top(x, z) {
      const [lx, lz] = toLocal(r, x, z);
      if (Math.abs(lx) > r.hx || Math.abs(lz) > r.hz) return null;
      return rp.y0 + ((lx + r.hx) / (2 * r.hx)) * (rp.y1 - rp.y0);
    },
    under: null,
  };
}

/** A building's corridor deck (floor f) as a rect. */
export function corridorRect(b, f = 1) {
  const c = b.corridor;
  return {
    c: toWorld(b, (c.x0 + c.x1) / 2, b.hz + CORRIDOR_W / 2), yaw: b.yaw,
    hx: (c.x1 - c.x0) / 2, hz: CORRIDOR_W / 2, y: b.y0 + f * STOREY,
  };
}
/** The end deck wrapping a building end (side ±1) on floor f. */
export function endDeckRect(b, side, f) {
  const lx = side * (b.hx + CORRIDOR_W / 2);
  return { c: toWorld(b, lx, CORRIDOR_W / 2), yaw: b.yaw, hx: CORRIDOR_W / 2, hz: b.hz + CORRIDOR_W / 2, y: b.y0 + f * STOREY };
}
/** A bay (bump-out) off a building's corridor, on floor f. */
export function bayRect(b, bay, f) {
  const z0 = b.hz + CORRIDOR_W;
  return { c: toWorld(b, (bay.x0 + bay.x1) / 2, z0 + bay.depth / 2), yaw: b.yaw, hx: (bay.x1 - bay.x0) / 2, hz: bay.depth / 2, y: b.y0 + f * STOREY };
}
/** World direction of a building's local +x. */
export const localX = (b) => [Math.cos(b.yaw), -Math.sin(b.yaw)];
export const localZ = (b) => [Math.sin(b.yaw), Math.cos(b.yaw)];

const TOWER_W = 2.0, TOWER_STEPS = 5, TOWER_TREAD = 0.5, TOWER_LAND = 1.6;
/**
 * A switchback stair tower's pieces, standing just outside a corridor. Per
 * storey: flight a climbs half a storey along the OUTER strip from the tower
 * mouth (local x = xs) → a half landing at the far end → flight b climbs
 * back along the INNER strip (beside the deck) → a full-width FLOOR LANDING
 * at the next floor, level with that corridor (both strips, local x from
 * xs back 1.6 m) — so you step off sideways onto the corridor, or across
 * onto the next flight up, with room to spare.
 */
export function towerPieces(b, t) {
  const out = [];
  const z0 = b.hz + CORRIDOR_W;
  const L = TOWER_STEPS * TOWER_TREAD;
  const [ux, uz] = localX(b);
  const d = t.dir;
  for (let i = 0; i < t.floors.length - 1; i++) {
    const base = b.y0 + t.floors[i] * STOREY;
    const thin = t.floors[i] > 0;
    const half = STOREY / 2;
    out.push({
      kind: "flight", id: `${b.id}-tower-${t.x}-${i}a`,
      flight: { a: toWorld(b, t.x, z0 + 1.5 * TOWER_W), dir: [ux * d, uz * d], w: TOWER_W, n: TOWER_STEPS, tread: TOWER_TREAD, rise: half / TOWER_STEPS, y0: base, thin },
    });
    out.push({
      kind: "landing", id: `${b.id}-tower-${t.x}-${i}L`, thin,
      r: { c: toWorld(b, t.x + d * (L + TOWER_LAND / 2), z0 + TOWER_W), yaw: b.yaw, hx: TOWER_LAND / 2, hz: TOWER_W }, y: base + half,
    });
    out.push({
      kind: "flight", id: `${b.id}-tower-${t.x}-${i}b`,
      flight: { a: toWorld(b, t.x + d * L, z0 + 0.5 * TOWER_W), dir: [-ux * d, -uz * d], w: TOWER_W, n: TOWER_STEPS, tread: TOWER_TREAD, rise: half / TOWER_STEPS, y0: base + half, thin },
    });
    out.push({
      kind: "landing", id: `${b.id}-tower-${t.x}-${i}F`, thin: true, floorLanding: true,
      r: { c: toWorld(b, t.x - d * (TOWER_LAND / 2), z0 + TOWER_W), yaw: b.yaw, hx: TOWER_LAND / 2, hz: TOWER_W }, y: base + STOREY,
    });
  }
  return out;
}
/** A stair tower's whole footprint (floor landing → far half landing) as a rect. */
export function towerFootprint(b, t) {
  const z0 = b.hz + CORRIDOR_W;
  const L = TOWER_STEPS * TOWER_TREAD;
  const xa = t.x - t.dir * TOWER_LAND, xb = t.x + t.dir * (L + TOWER_LAND);
  return { c: toWorld(b, (xa + xb) / 2, z0 + TOWER_W), yaw: b.yaw, hx: Math.abs(xb - xa) / 2, hz: TOWER_W, lx0: Math.min(xa, xb), lx1: Math.max(xa, xb), lz0: z0, lz1: z0 + 2 * TOWER_W };
}
/** Block C's broad stair from its balcony down to the lawn (and the like). */
export function buildingStairFlight(b, s) {
  const z0 = b.hz + CORRIDOR_W;
  const n = Math.round(((s.floors[1] - s.floors[0]) * STOREY) / 0.3);
  const tread = 1.0;
  const [vx, vz] = localZ(b);
  return {
    id: `${b.id}-stair-${s.x}`, a: toWorld(b, s.x, z0 + n * tread), dir: [-vx, -vz], w: s.width, n, tread, rise: 0.3,
    y0: b.y0 + s.floors[0] * STOREY, cheeks: true, tactile: true,
  };
}

let _structs = null;
export function getSchoolStructures() {
  if (_structs) return _structs;
  const list = [];
  for (const p of SCHOOL_PLATFORMS) {
    // Edges count as ON the terrace (a hair of tolerance), so a stair top or
    // a ramp that butts an edge never has a hairline seam down to the lawn.
    list.push({
      id: p.id, kind: "platform", thin: false, platform: p, box: polyBox(p.pts),
      top: (x, z) => (inPoly(p.pts, x, z) || polySD(p.pts, x, z) < 0.01 ? p.y : null), under: null,
    });
  }
  for (const f of SCHOOL_FLIGHTS) list.push(flightStruct(f));
  for (const l of SCHOOL_LANDINGS) list.push(rectStruct(l.id, "landing", l, l.y, false));
  for (const rp of SCHOOL_RAMPS) list.push(rampStruct(rp));
  for (const l of SCHOOL_RAMP_LANDINGS) list.push(rectStruct(l.id, "landing", l, l.y, false));
  for (const b of SCHOOL_BUILDINGS) {
    if (b.corridor) {
      for (const f of b.corridor.floors) {
        const r = corridorRect(b, f);
        list.push({ ...rectStruct(`${b.id}-deck-${f}`, "deck", r, r.y, true), building: b, floor: f });
      }
    }
    for (const e of b.ends || []) {
      for (const f of e.floors) {
        const r = endDeckRect(b, e.side, f);
        list.push({ ...rectStruct(`${b.id}-end-${e.side}-${f}`, "deck", r, r.y, true), building: b, floor: f });
      }
    }
    for (const [bi, bay] of (b.bays || []).entries()) {
      for (const f of bay.floors) {
        const r = bayRect(b, bay, f);
        list.push({ ...rectStruct(`${b.id}-bay-${bi}-${f}`, "deck", r, r.y, true), building: b, floor: f, bay: true });
      }
    }
    for (const t of b.towers || []) {
      for (const pc of towerPieces(b, t)) {
        if (pc.kind === "flight") list.push({ ...flightStruct({ id: pc.id, ...pc.flight }), building: b, tower: true });
        else list.push({ ...rectStruct(pc.id, "landing", pc.r, pc.y, pc.thin), building: b, tower: true });
      }
    }
    for (const s of b.stairs || []) list.push({ ...flightStruct(buildingStairFlight(b, s)), building: b });
  }
  // Raised brick planters (quad figs + courtyard beds) — 0.55 m kerbs.
  for (const [i, f] of QUAD_FIGS.entries()) {
    const r = { c: f.c, yaw: f.planter.yaw, hx: f.planter.hx, hz: f.planter.hz };
    list.push({ ...rectStruct(`fig-planter-${i}`, "planter", r, LV.L1 + 0.55, false), planter: true });
  }
  for (const [i, bd] of COURT_BEDS.entries()) {
    list.push({ ...rectStruct(`court-bed-${i}`, "planter", bd, LV.L2 + 0.55, false), planter: true });
  }
  // The hall stage.
  const st = HALL.stage;
  const stage = { c: [(st.x[0] + st.x[1]) / 2, (st.z[0] + st.z[1]) / 2], yaw: 0, hx: (st.x[1] - st.x[0]) / 2, hz: (st.z[1] - st.z[0]) / 2 };
  list.push(rectStruct("hall-stage", "stage", stage, LV.L1 + st.h, false));
  // The Sky Pier (thin: the hill falls away beneath it).
  const pier = stripRect(SKY_PIER.from, SKY_PIER.to, SKY_PIER.halfWidth);
  list.push({ ...rectStruct("sky-pier", "deck", pier, SKY_PIER.y, true) });
  // Spatial index (8 m cells).
  const CELL = 8;
  const map = new Map();
  for (const s of list) {
    const [x0, z0, x1, z1] = s.box;
    for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++) {
      for (let j = Math.floor(z0 / CELL); j <= Math.floor(z1 / CELL); j++) {
        const k = i * 4096 + j;
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(s);
      }
    }
  }
  const at = (x, z) => map.get(Math.floor(x / CELL) * 4096 + Math.floor(z / CELL)) || [];
  _structs = { list, at };
  return _structs;
}

/** Solid structure top at (x, z) (the highest), or null. */
export function schoolSolidTopAt(x, z) {
  let best = null;
  for (const s of getSchoolStructures().at(x, z)) {
    if (s.thin) continue;
    const [x0, z0, x1, z1] = s.box;
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    const t = s.top(x, z);
    if (t !== null && (best === null || t > best)) best = t;
  }
  return best;
}
/** The highest thin deck at (x, z) whose top ≤ lim, or null. */
export function schoolDeckTopAt(x, z, lim = Infinity) {
  let best = null;
  for (const s of getSchoolStructures().at(x, z)) {
    if (!s.thin) continue;
    const [x0, z0, x1, z1] = s.box;
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    const t = s.top(x, z);
    if (t !== null && t <= lim && (best === null || t > best)) best = t;
  }
  return best;
}
/** The structure ids standing at (x, z) (for the checks + the renderer). */
export function schoolStructuresAt(x, z) {
  return getSchoolStructures().at(x, z).filter((s) => {
    const [x0, z0, x1, z1] = s.box;
    return x >= x0 && x <= x1 && z >= z0 && z <= z1 && s.top(x, z) !== null;
  });
}

// ---------------------------------------------------------------------------
// CARVING — the terrain is pushed DOWN under every platform + building (with
// a 1 m margin), so it can never poke up through a paved terrace.
// ---------------------------------------------------------------------------
const CARVE_GROW = 1.1;
const CARVE_PLATFORMS = SCHOOL_PLATFORMS.map((p) => ({ p, box: polyBox(p.pts) }));
function carveUnder(x, z, h) {
  for (const { p, box } of CARVE_PLATFORMS) {
    if (x < box[0] - CARVE_GROW || x > box[2] + CARVE_GROW || z < box[1] - CARVE_GROW || z > box[3] + CARVE_GROW) continue;
    if (polySD(p.pts, x, z) <= CARVE_GROW) h = Math.min(h, p.y - 0.06);
  }
  // (Building bodies aren't carved: the ground inside a closed block is
  // never seen, and the walls run down past it — no gutter round the walls.)
  return h;
}

export function carvedHeight(x, z) {
  let h = padBlend(x, z, rawHeight(x, z)).h;
  h = trackCarve(x, z, h);
  const on = padUnder(x, z);
  if (on) h = on.level;
  h = carveUnder(x, z, h);
  return h;
}

// ---------------------------------------------------------------------------
// THE 1 m GRID (lazy)
// ---------------------------------------------------------------------------
export const GRID = { xMin: -176, xMax: 176, zMin: -172, zMax: 168, step: 1 };
GRID.nx = Math.round((GRID.xMax - GRID.xMin) / GRID.step) + 1;
GRID.nz = Math.round((GRID.zMax - GRID.zMin) / GRID.step) + 1;
let _grid = null;
export function getSchoolGrid() {
  if (_grid) return _grid;
  const { nx, nz } = GRID;
  const h = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    const z = GRID.zMin + j * GRID.step;
    for (let i = 0; i < nx; i++) h[j * nx + i] = carvedHeight(GRID.xMin + i * GRID.step, z);
  }
  const slope = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i;
    const hx = h[j * nx + Math.min(nx - 1, i + 1)] - h[j * nx + Math.max(0, i - 1)];
    const hz = h[Math.min(nz - 1, j + 1) * nx + i] - h[Math.max(0, j - 1) * nx + i];
    slope[k] = Math.hypot(hx, hz) / (2 * GRID.step);
  }
  _grid = { h, slope };
  return _grid;
}
function gridCoords(x, z) {
  const fx = clamp((x - GRID.xMin) / GRID.step, 0, GRID.nx - 1.0001);
  const fz = clamp((z - GRID.zMin) / GRID.step, 0, GRID.nz - 1.0001);
  const i = Math.floor(fx), j = Math.floor(fz);
  return { i, j, tx: fx - i, tz: fz - j };
}
/** Terrain height — exactly the rendered mesh's triangles (split a,c,b / b,c,e). */
export function terrainHeight(x, z) {
  if (x < GRID.xMin || x > GRID.xMax || z < GRID.zMin || z > GRID.zMax) return rawHeight(x, z);
  const g = getSchoolGrid().h;
  const { i, j, tx, tz } = gridCoords(x, z);
  const nx = GRID.nx;
  const a = g[j * nx + i], b = g[j * nx + i + 1], c = g[(j + 1) * nx + i], e = g[(j + 1) * nx + i + 1];
  if (tx + tz <= 1) return a + (b - a) * tx + (c - a) * tz;
  return e + (c - e) * (1 - tx) + (b - e) * (1 - tz);
}
export function slopeAt(x, z) {
  if (x < GRID.xMin || x > GRID.xMax || z < GRID.zMin || z > GRID.zMax) return 0;
  const g = getSchoolGrid().slope;
  const { i, j, tx, tz } = gridCoords(x, z);
  const nx = GRID.nx;
  const a = g[j * nx + i], b = g[j * nx + i + 1], c = g[(j + 1) * nx + i], d = g[(j + 1) * nx + i + 1];
  return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz;
}

// ---------------------------------------------------------------------------
// THE PLAYER HOOKS
// ---------------------------------------------------------------------------
/** Walkable ground (layered: thin decks count once you're at / above them). */
export function schoolGroundHeight(x, z, y) {
  const g = terrainHeight(x, z);
  const s = schoolSolidTopAt(x, z);
  let h = s !== null && s > g ? s : g;
  const lim = y === undefined ? Infinity : y + S_STEP_UP + 0.05;
  const d = schoolDeckTopAt(x, z, lim);
  if (d !== null && d > h) h = d;
  return h;
}
function onStructure(x, z, y) {
  if (schoolSolidTopAt(x, z) !== null) return true;
  const d = schoolDeckTopAt(x, z, y === undefined ? Infinity : y + S_STEP_UP + 0.05);
  return d !== null && (y === undefined || y >= d - 0.3);
}
/** Too-steep terrain (the bush hill's faces): downhill direction, else null. */
export function schoolSlideAt(x, z, y) {
  if (onStructure(x, z, y)) return null;
  if (slopeAt(x, z) < S_SLIDE_SLOPE) return null;
  const e = 0.6;
  const gx = terrainHeight(x + e, z) - terrainHeight(x - e, z);
  const gz = terrainHeight(x, z + e) - terrainHeight(x, z - e);
  const L = Math.hypot(gx, gz);
  if (L < 1e-6) return null;
  return { x: -gx / L, z: -gz / L };
}
/** A safe spot to land (not a steep face). */
export function schoolIsSafe(x, z) {
  if (schoolSolidTopAt(x, z) !== null) return true;
  return slopeAt(x, z) < 0.7;
}
/** Dirt / gravel track ground (footprints). */
export function isOnSchoolTrack(x, z) {
  const n = nearestSchoolPath(x, z);
  return Boolean(n && n.e < -0.2 && (n.p.kind === "dirt" || n.p.kind === "gravel")) && schoolSolidTopAt(x, z) === null;
}

// ---------------------------------------------------------------------------
// CEILINGS + CAMERA BLOCKERS
// ---------------------------------------------------------------------------
let _cam = null;
/** Ceiling rects (each { r, under(x,z) }) + blocker volumes ({ r, y0, y1 }). */
export function getSchoolCameraGeometry() {
  if (_cam) return _cam;
  const ceilings = [];
  const blockers = [];
  for (const s of getSchoolStructures().list) {
    if (!s.thin) continue;
    if (s.r) ceilings.push({ id: s.id, r: s.r, box: s.box, under: s.under || (() => s.y - DECK_T) });
  }
  for (const b of SCHOOL_BUILDINGS) {
    const eave = b.y0 + (b.wallH || b.floors * STOREY);
    if (b.corridor) {
      // The roof runs out over the corridor (a verandah roof) on the top floor.
      const r = corridorRect(b, b.floors - 1);
      const rr = { ...r, hz: r.hz + 0.3, c: toWorld(b, (b.corridor.x0 + b.corridor.x1) / 2, b.hz + CORRIDOR_W / 2 + 0.3) };
      ceilings.push({ id: `${b.id}-roof`, r: rr, box: rectBox(rr), under: () => eave - 0.12 });
      for (const e of b.ends || []) {
        const er = endDeckRect(b, e.side, b.floors - 1);
        ceilings.push({ id: `${b.id}-endroof`, r: er, box: rectBox(er), under: () => eave - 0.12 });
      }
      // The roofs over the stair towers + the bays.
      for (const t of b.towers || []) {
        const tr = towerFootprint(b, t);
        ceilings.push({ id: `${b.id}-towerroof-${t.x}`, r: tr, box: rectBox(tr), under: () => eave - 0.12 });
      }
      for (const bay of b.bays || []) {
        const br = bayRect(b, bay, b.floors - 1);
        ceilings.push({ id: `${b.id}-bayroof`, r: br, box: rectBox(br), under: () => eave - 0.12 });
      }
    }
    if (b.hall) {
      // Inside the hall: its ceiling; outside: its walls + roof block the camera.
      ceilings.push({ id: "hall-ceiling", r: b, box: rectBox(b), under: () => eave - 0.3 });
      const t = HALL.wallT;
      const walls = [
        { c: toWorld(b, 0, -b.hz + t / 2), yaw: 0, hx: b.hx, hz: t / 2 },
        { c: toWorld(b, -b.hx + t / 2, 0), yaw: 0, hx: t / 2, hz: b.hz },
        { c: toWorld(b, b.hx - t / 2, 0), yaw: 0, hx: t / 2, hz: b.hz },
        // South wall, either side of the doorway.
        { c: [(b.c[0] - b.hx + HALL.doorX[0]) / 2, b.c[1] + b.hz - t / 2], yaw: 0, hx: (HALL.doorX[0] - (b.c[0] - b.hx)) / 2, hz: t / 2 },
        { c: [(HALL.doorX[1] + b.c[0] + b.hx) / 2, b.c[1] + b.hz - t / 2], yaw: 0, hx: (b.c[0] + b.hx - HALL.doorX[1]) / 2, hz: t / 2 },
      ];
      for (const w of walls) blockers.push({ r: w, box: rectBox(w), y0: b.y0 - 1, y1: eave });
      // Above the doorway (the wall over the doors).
      const over = { c: [(HALL.doorX[0] + HALL.doorX[1]) / 2, b.c[1] + b.hz - t / 2], yaw: 0, hx: (HALL.doorX[1] - HALL.doorX[0]) / 2, hz: t / 2 };
      blockers.push({ r: over, box: rectBox(over), y0: b.y0 + 3.6, y1: eave });
      blockers.push({ r: b, box: rectBox(b), y0: eave, y1: eave + b.hx * (b.roof.pitch || 0.36) + 0.8 });
      const p = HALL.porch;
      const pr = { c: [(p.x[0] + p.x[1]) / 2, (p.z[0] + p.z[1]) / 2], yaw: 0, hx: (p.x[1] - p.x[0]) / 2, hz: (p.z[1] - p.z[0]) / 2 };
      ceilings.push({ id: "hall-porch", r: pr, box: rectBox(pr), under: () => p.roofY - 0.25 });
      continue;
    }
    const inner = { c: b.c, yaw: b.yaw, hx: b.hx - 0.15, hz: b.hz - 0.15 };
    const ridge = b.roof.type === "flat" ? 1.0 : b.roof.type === "skillion" ? 1.6 : Math.min(b.hx, b.hz) * (b.roof.pitch || 0.45) + 0.6;
    blockers.push({ r: inner, box: rectBox(inner), y0: b.y0 - 6, y1: eave + ridge });
  }
  const cola = { c: COLA.c, yaw: 0, hx: COLA.hx, hz: COLA.hz };
  ceilings.push({ id: "cola", r: cola, box: rectBox(cola), under: () => COLA.roofY - 0.35 });
  // Index both (8 m cells).
  const CELL = 8;
  const index = (items) => {
    const map = new Map();
    for (const it of items) {
      const [x0, z0, x1, z1] = it.box;
      for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++) {
        for (let j = Math.floor(z0 / CELL); j <= Math.floor(z1 / CELL); j++) {
          const k = i * 4096 + j;
          if (!map.has(k)) map.set(k, []);
          map.get(k).push(it);
        }
      }
    }
    return (x, z) => map.get(Math.floor(x / CELL) * 4096 + Math.floor(z / CELL)) || [];
  };
  _cam = { ceilings, blockers, ceilAt: index(ceilings), blockAt: index(blockers) };
  return _cam;
}
/** The lowest ceiling above `above` at (x, z), or Infinity. */
export function schoolCeilingAt(x, z, above) {
  let best = Infinity;
  for (const c of getSchoolCameraGeometry().ceilAt(x, z)) {
    const [x0, z0, x1, z1] = c.box;
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    if (!inRect(c.r, x, z)) continue;
    const u = c.under(x, z);
    if (u > above && u < best) best = u;
  }
  return best;
}
/** Is (x, y, z) inside a camera blocker (a building body / the hall's walls)? */
export function schoolBlockedAt(x, y, z) {
  for (const b of getSchoolCameraGeometry().blockAt(x, z)) {
    if (y < b.y0 || y > b.y1) continue;
    const [x0, z0, x1, z1] = b.box;
    if (x < x0 || x > x1 || z < z0 || z > z1) continue;
    if (inRect(b.r, x, z)) return true;
  }
  return false;
}

/**
 * Keep the follow camera clear: pull it in front of any building body (or
 * hall wall) between it and the player, then keep the sight line from the
 * player's head UNDER every corridor deck / roof it passes beneath (so on a
 * ground-floor verandah the camera tucks under the deck above). Mutates and
 * returns `cam` ({ x, y, z }).
 */
const FIT_STEPS = 18;
export function schoolCameraFit(px, py, pz, cam) {
  const hx = px, hy = py + 1.45, hz = pz;
  let dx = cam.x - hx, dy = cam.y - hy, dz = cam.z - hz;
  // 1) Blockers: march out from the head; stop just before the first hit.
  let tHit = 1;
  for (let k = 1; k <= FIT_STEPS; k++) {
    const t = k / FIT_STEPS;
    if (schoolBlockedAt(hx + dx * t, hy + dy * t, hz + dz * t)) { tHit = Math.max(0.1, (k - 1.4) / FIT_STEPS); break; }
  }
  if (tHit < 1) {
    dx *= tHit; dy *= tHit; dz *= tHit;
  }
  // 2) Ceilings: the sight line must pass under each one it crosses.
  let maxDy = dy;
  for (let k = 1; k <= FIT_STEPS; k++) {
    const t = k / FIT_STEPS;
    const u = schoolCeilingAt(hx + dx * t, hz + dz * t, hy + 0.15);
    if (u === Infinity) continue;
    const lim = (u - 0.32 - hy) / t;
    if (lim < maxDy) maxDy = lim;
  }
  if (maxDy < dy) dy = Math.max(-0.6, maxDy);
  cam.x = hx + dx; cam.y = hy + dy; cam.z = hz + dz;
  return cam;
}

/** Is (x, z) inside a building body (for the colliders, scatter + checks)? */
export function inSchoolBuilding(x, z, pad = 0) {
  for (const b of SCHOOL_BUILDINGS) if (inRect(b, x, z, pad)) return b;
  return null;
}
export { TOWER_W, TOWER_STEPS, TOWER_TREAD, TOWER_LAND };
