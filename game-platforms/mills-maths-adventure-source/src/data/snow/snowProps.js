/**
 * SNOWBALL SUMS — THE SCATTER (2026-10-08): every pine, birch, boulder,
 * crag, shrub, drift, log and ice crystal, plus the footprints of the
 * buildings + set-pieces. Pure + deterministic (seeded) so the renderer, the
 * colliders and the checks all see the same valley.
 *
 * The rules that keep it a good place to play:
 *   · nothing on a trail, a level pad, a chute, the ice or in the lake,
 *   · nothing tall inside any challenge camera's corridor,
 *   · nothing inside a building / set-piece footprint or under the chairlift,
 *   · forests cluster: dark pine belts on the rim's rising snowfields, the
 *     pine forest on Pine Hill, stands round the lake and the cave; open
 *     snowfields between, so the rolling ground reads.
 */
import { clamp, smoothstep, fbm, vnoise, rng, segDistT } from "../terrainKit.js";
import {
  SNOW_LODGE, SNOW_CABINS, VILLAGE_TREE, GIANT_SNOWMAN, FROZEN_FALLS, SNOW_IGLOOS, SNOWMEN, XMAS_TREES,
  SNOW_LAMPS, CANDY_CANES, SNOW_SIGNPOSTS, SNOW_CHEST_SPOTS, SNOW_WELCOME_SIGN, SNOW_WELCOME_HOST, SNOW_RECORDS_STAND,
  SNOW_RETURN_PORTAL, SNOW_SPAWN, SNOW_ARCH, SNOW_MAP_BOARD, RANGE_SIGN, RINK_GLIDE_SIGN, GROVE_SIGN, MEADOW_SIGN, SLOPE_SIGN,
  VILLAGE_SIGN, COLONY_SIGN, CAVE_SIGN, YARD_SIGN, LOOKOUT_SIGN, RANGE_AREA, CAVE_AREA, LODGE_DOOR,
  inAnySnowChallengeView,
} from "./snowLayout.js";
import {
  terrainHeight, slopeAt, nearestTrail, nearestPad, nearestChute, nearestRiver, lakeEdgeDist, outsideRim,
  iceKind, LIFT, onPad, ensureSnowStructures, SNOW_BRIDGES,
} from "./snowTerrain.js";

const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// SET-PIECES that the scatter + colliders both need.
// ---------------------------------------------------------------------------
/** Fort Frost: snow-block walls round the Snowball Range (outside its view). */
export const FORT_WALLS = [
  // The west wall stops short: the trail from the village walks in there.
  { a: [RANGE_AREA.x - 13, RANGE_AREA.z - 9], b: [RANGE_AREA.x - 13, RANGE_AREA.z - 0.5] },
  { a: [RANGE_AREA.x - 13, RANGE_AREA.z - 9], b: [RANGE_AREA.x + 13, RANGE_AREA.z - 9] },
  { a: [RANGE_AREA.x + 13, RANGE_AREA.z - 9], b: [RANGE_AREA.x + 13, RANGE_AREA.z + 6] },
];
/** The lift's sideways unit vector (the RETURN cable runs this far over). */
export const LIFT_SIDE = [LIFT.dir[1], -LIFT.dir[0]];
export const LIFT_RETURN_OFFSET = 3.2;
/** Chairlift towers along the line (fractions of the way up), standing
 *  BETWEEN the up cable (the rider's line) and the return cable. */
export const LIFT_TOWERS = [0.2, 0.42, 0.64, 0.85].map((t) => ({
  t,
  x: LIFT.from[0] + (LIFT.to[0] - LIFT.from[0]) * t + LIFT_SIDE[0] * LIFT_RETURN_OFFSET * 0.5,
  z: LIFT.from[1] + (LIFT.to[1] - LIFT.from[1]) * t + LIFT_SIDE[1] * LIFT_RETURN_OFFSET * 0.5,
}));
/** The cave mouth's flanking rock pillars (in front of the cliff). */
export const CAVE_ROCKS = [
  [CAVE_AREA.x - 9.5, CAVE_AREA.z - 6, 3.2], [CAVE_AREA.x + 9.5, CAVE_AREA.z - 6.5, 3.0],
  [CAVE_AREA.x - 11, CAVE_AREA.z - 1.5, 2.0], [CAVE_AREA.x + 12.5, CAVE_AREA.z - 6.5, 1.8],
];

// ---------------------------------------------------------------------------
// FOOTPRINTS — rect { x, z, w, d, rot } or circle { x, z, r }, height h.
// ---------------------------------------------------------------------------
const rect = (id, x, z, w, d, rot, h) => ({ id, shape: "rect", x, z, w, d, rot: rot || 0, h });
const circ = (id, x, z, r, h) => ({ id, shape: "circle", x, z, r, h });
export const SNOW_FOOTPRINTS = [
  rect("lodge", SNOW_LODGE.x, SNOW_LODGE.z, SNOW_LODGE.w + 2, SNOW_LODGE.d + 2, 0, 10),
  rect("lodge-door", LODGE_DOOR[0], LODGE_DOOR[1] + 1.6, 3.2, 3.6, 0, 0),
  ...SNOW_CABINS.map(([x, z, rot, w, d], i) => rect(`cabin-${i}`, x, z, w + 1.6, d + 1.6, rot, 7)),
  circ("village-tree", VILLAGE_TREE[0], VILLAGE_TREE[1], 2.6, 10),
  circ("giant-snowman", GIANT_SNOWMAN.position[0], GIANT_SNOWMAN.position[1], 5.2, 14),
  rect("falls", FROZEN_FALLS.position[0], FROZEN_FALLS.position[1], FROZEN_FALLS.width + 4, 6, 0, 14),
  ...FORT_WALLS.map((w, i) => {
    const cx = (w.a[0] + w.b[0]) / 2, cz = (w.a[1] + w.b[1]) / 2;
    const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
    return rect(`fort-${i}`, cx, cz, w.a[0] === w.b[0] ? 1.6 : L + 1.6, w.a[0] === w.b[0] ? L + 1.6 : 1.6, 0, 1.5);
  }),
  circ("lift-base", LIFT.from[0], LIFT.from[1], 4.2, 6),
  circ("lift-top", LIFT.to[0], LIFT.to[1], 4.2, 6),
  ...LIFT_TOWERS.map((t, i) => circ(`lift-tower-${i}`, t.x, t.z, 1.2, 9)),
  ...CAVE_ROCKS.map(([x, z, r], i) => circ(`cave-rock-${i}`, x, z, r, 6)),
  ...SNOW_IGLOOS.map(([x, z], i) => circ(`igloo-${i}`, x, z, 2.6, 2.6)),
  ...SNOWMEN.map(([x, z], i) => circ(`snowman-${i}`, x, z, 0.9, 2)),
  ...XMAS_TREES.map(([x, z], i) => circ(`xmas-${i}`, x, z, 1.6, 5)),
  ...SNOW_LAMPS.map(([x, z], i) => circ(`lamp-${i}`, x, z, 0.6, 3)),
  ...CANDY_CANES.map(([x, z], i) => circ(`cane-${i}`, x, z, 0.5, 2)),
  circ("records", SNOW_RECORDS_STAND.position[0], SNOW_RECORDS_STAND.position[1], 3.2, 6),
  circ("arch-0", SNOW_ARCH.position[0] - SNOW_ARCH.width / 2, SNOW_ARCH.position[1], 0.85, 6),
  circ("arch-1", SNOW_ARCH.position[0] + SNOW_ARCH.width / 2, SNOW_ARCH.position[1], 0.85, 6),
  circ("map-board", SNOW_MAP_BOARD.position[0], SNOW_MAP_BOARD.position[1], 1.9, 3.4),
  circ("portal", SNOW_RETURN_PORTAL[0], SNOW_RETURN_PORTAL[1], 3.8, 4),
  circ("spawn", SNOW_SPAWN.x, SNOW_SPAWN.z, 2.5, 0),
  circ("welcome-host", SNOW_WELCOME_HOST.position[0], SNOW_WELCOME_HOST.position[1], 1.4, 2),
  ...[SNOW_WELCOME_SIGN, RANGE_SIGN, RINK_GLIDE_SIGN, GROVE_SIGN, MEADOW_SIGN, SLOPE_SIGN, VILLAGE_SIGN,
    COLONY_SIGN, CAVE_SIGN, YARD_SIGN, LOOKOUT_SIGN].map((s, i) => circ(`host-${i}`, s.position[0], s.position[1], 1.4, 2)),
  ...SNOW_SIGNPOSTS.map((s) => circ(`signpost-${s.id}`, s.p[0], s.p[1], 0.6, 2.8)),
  ...SNOW_CHEST_SPOTS.map((p, i) => circ(`chest-${i}`, p[0], p[1], 1.6, 0)),
];
export function footprintDist(f, x, z) {
  if (f.shape === "circle") return Math.hypot(x - f.x, z - f.z) - f.r;
  const c = Math.cos(f.rot), s = Math.sin(f.rot);
  const dx = x - f.x, dz = z - f.z;
  const lx = dx * c - dz * s, lz = dx * s + dz * c;
  const ox = Math.abs(lx) - f.w / 2, oz = Math.abs(lz) - f.d / 2;
  return ox > 0 || oz > 0 ? Math.hypot(Math.max(0, ox), Math.max(0, oz)) : Math.max(ox, oz);
}
export function nearestFootprint(x, z) {
  let best = { e: Infinity, f: null };
  for (const f of SNOW_FOOTPRINTS) {
    if (Math.abs(x - f.x) > 30 || Math.abs(z - f.z) > 30) continue;
    const e = footprintDist(f, x, z);
    if (e < best.e) best = { e, f };
  }
  return best;
}
/** Metres from the chairlift's line (the cable needs a clear lane). */
export function liftLineDist(x, z) {
  return segDistT(x, z, LIFT.from[0], LIFT.from[1], LIFT.to[0], LIFT.to[1]).d;
}
function bridgeDist(x, z) {
  ensureSnowStructures();
  let d = Infinity;
  for (const b of SNOW_BRIDGES) d = Math.min(d, segDistT(x, z, b.from[0], b.from[1], b.to[0], b.to[1]).d - b.halfWidth);
  return d;
}

// ---------------------------------------------------------------------------
// The shared "can something stand here?" test.
// ---------------------------------------------------------------------------
/**
 * opts: trail (min m outside a trail edge), pad (min m outside a pad rim),
 * chute (min m outside a chute's berms), ice (min m from river/pond ice),
 * lake (min m outside the water), foot (min m outside a footprint), lift
 * (min m from the lift line), tall (keep out of every camera corridor),
 * slope (max slope), outside (true → only past the rim; false → inside).
 */
export function clearAt(x, z, o) {
  const out = outsideRim(x, z);
  if (o.outside === true) { if (out < 2) return false; }
  else if (o.outside === false && out > -(o.edge ?? 1)) return false;
  if (o.slope !== undefined && slopeAt(x, z) > o.slope) return false;
  if (o.lake !== undefined && lakeEdgeDist(x, z) < o.lake) return false;
  if (o.outside === true) return true;
  if (o.trail !== undefined) {
    const n = nearestTrail(x, z);
    if (n && n.e < o.trail) return false;
  }
  if (o.pad !== undefined && nearestPad(x, z).e < o.pad) return false;
  if (o.chute !== undefined) {
    const n = nearestChute(x, z);
    if (n && n.d < n.c.hw + 1.8 + o.chute) return false;
  }
  if (o.ice !== undefined) {
    const r = nearestRiver(x, z);
    if (r && r.d - r.hw < o.ice) return false;
    if (iceKind(x, z) !== null) return false;
  }
  if (o.foot !== undefined && nearestFootprint(x, z).e < o.foot) return false;
  if (o.lift !== undefined && liftLineDist(x, z) < o.lift) return false;
  if (o.bridge !== undefined && bridgeDist(x, z) < o.bridge) return false;
  if (o.tall && inAnySnowChallengeView(x, z, o.tallMargin ?? 2)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Forest density (0 → open snowfield, 1 → dense pines).
// ---------------------------------------------------------------------------
export function forestDensity(x, z) {
  const out = outsideRim(x, z);
  // The pine belts on the rising snowfields + the mountainsides.
  let d = smoothstep(-34, -14, out) * (1 - smoothstep(26, 60, out)) * (0.55 + 0.6 * fbm(x / 30, z / 30, 2, 71));
  // Pine Hill's forest (west) and the cave's woods.
  d = Math.max(d, (1 - smoothstep(30, 62, Math.hypot(x + 128, z + 38))) * 0.95);
  d = Math.max(d, (1 - smoothstep(14, 30, Math.hypot(x + 112, z + 74))) * 0.8);
  // Stands round the lake's north + west shores and on the knolls.
  d = Math.max(d, (1 - smoothstep(10, 26, Math.hypot(x + 6, z + 84))) * 0.7);
  d = Math.max(d, (1 - smoothstep(8, 20, Math.hypot(x - 46, z + 4))) * 0.55);
  d = Math.max(d, (1 - smoothstep(10, 22, Math.hypot(x + 72, z + 30))) * 0.6);
  // Noise clumps everywhere else (sparse copses on the open snow).
  const clump = smoothstep(0.62, 0.8, fbm(x / 26 + 4, z / 26 - 2, 3, 72));
  d = Math.max(d, clump * 0.45);
  return clamp(d, 0, 1);
}

// ---------------------------------------------------------------------------
// THE SCATTER
// ---------------------------------------------------------------------------
let _props = null;
export function getSnowProps() {
  if (_props) return _props;
  const R = rng(20261008);
  const trees = { fir: [], spruce: [], spiky: [], birch: [] };
  // A spatial hash for trunk spacing.
  const cell = 6;
  const hash = new Map();
  const key = (i, j) => i * 8192 + j;
  const tooClose = (x, z, d) => {
    const i0 = Math.floor((x - d) / cell), i1 = Math.floor((x + d) / cell);
    const j0 = Math.floor((z - d) / cell), j1 = Math.floor((z + d) / cell);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const arr = hash.get(key(i, j));
      if (!arr) continue;
      for (const t of arr) if (Math.hypot(t.x - x, t.z - z) < d) return true;
    }
    return false;
  };
  const put = (kind, x, z, s, extra = {}) => {
    const t = { x, z, y: terrainHeight(x, z), s, rot: R() * TAU, tint: R(), kind, ...extra };
    trees[kind].push(t);
    const k = key(Math.floor(x / cell), Math.floor(z / cell));
    if (!hash.has(k)) hash.set(k, []);
    hash.get(k).push(t);
    return t;
  };
  const treeOK = (x, z, extra = {}) => clearAt(x, z, {
    trail: 3.0, pad: 3.2, chute: 2.5, ice: 2.0, lake: 2.0, foot: 2.5, lift: 8, bridge: 2, tall: true, slope: 1.3, ...extra,
  });

  // --- PINES: dart-throw over the whole valley + mountainsides. -----------
  const X0 = -184, X1 = 184, Z0 = -168, Z1 = 168;
  for (let n = 0; n < 26000; n++) {
    const x = X0 + R() * (X1 - X0), z = Z0 + R() * (Z1 - Z0);
    const dens = forestDensity(x, z);
    if (dens <= 0.02 || R() > dens) continue;
    const out = outsideRim(x, z);
    const sp = out > 6 ? 4.6 : 3.4 + 2.2 * (1 - dens);
    if (tooClose(x, z, sp)) continue;
    if (out > 8) {
      // On the mountainsides: anywhere not a sheer crag.
      if (slopeAt(x, z) > 1.6) continue;
    } else if (!treeOK(x, z)) continue;
    const r = R();
    const kind = out > 4 ? (r < 0.7 ? "spruce" : "fir") : r < 0.48 ? "fir" : r < 0.82 ? "spruce" : "spiky";
    const s = kind === "spiky" ? 0.85 + R() * 0.45 : 0.75 + R() * 0.6 + (out > 4 ? 0.2 : 0);
    put(kind, x, z, s);
  }
  // A few bare BIRCHES at the forest edges + by the frozen river.
  for (let n = 0; n < 2400; n++) {
    const x = -140 + R() * 280, z = -124 + R() * 248;
    const r = nearestRiver(x, z);
    const nearRiver = r && r.d - r.hw < 9;
    const edge = forestDensity(x, z);
    if (!(nearRiver || (edge > 0.25 && edge < 0.5))) continue;
    if (R() > 0.35) continue;
    if (tooClose(x, z, 3.2) || !treeOK(x, z, { slope: 0.8 })) continue;
    put("birch", x, z, 0.8 + R() * 0.4);
  }
  // SPIKY pines dotted over the open snowfields (the SM64 touch).
  for (let n = 0; n < 1500; n++) {
    const x = -136 + R() * 272, z = -120 + R() * 240;
    if (forestDensity(x, z) > 0.3 || R() > 0.4) continue;
    if (tooClose(x, z, 7) || !treeOK(x, z, { slope: 0.7 })) continue;
    put("spiky", x, z, 0.8 + R() * 0.5);
  }

  // --- ROCKS: snow-capped boulders + jagged crags on the steep ground. ---
  const rocks = [];
  const crags = [];
  for (let n = 0; n < 9000; n++) {
    const x = -184 + R() * 368, z = -168 + R() * 336;
    const sl = slopeAt(x, z);
    const out = outsideRim(x, z);
    const inside = out < -2;
    if (sl > (inside ? 1.2 : 0.95) && R() < (inside ? 0.3 : 0.22)) {
      if (inside && !treeOK(x, z, { slope: 10, trail: 2.5, pad: 2, foot: 2 })) continue;
      if (crags.length > 520 || tooClose(x, z, inside ? 6 : 7)) continue;
      crags.push({ x, z, y: terrainHeight(x, z), s: inside ? 0.9 + R() * 1.5 : 1.4 + R() * 2.8, rot: R() * TAU, tilt: (R() - 0.5) * 0.5, tint: R() });
    } else if (R() < 0.06 && out < 12) {
      if (out < -2 && !treeOK(x, z, { slope: 0.9, trail: 2.2, pad: 2.5 })) continue;
      if (rocks.length > 700 || tooClose(x, z, 2.5)) continue;
      rocks.push({ x, z, y: terrainHeight(x, z), s: 0.45 + R() * 1.1, rot: R() * TAU, tint: R() });
    }
  }
  // The lake shore: icy boulders half in the water.
  for (let n = 0; n < 1600; n++) {
    const x = -20 + R() * 112, z = -96 + R() * 64;
    const e = lakeEdgeDist(x, z);
    if (e < -0.8 || e > 1.6 || R() > 0.3) continue;
    if (!clearAt(x, z, { trail: 2.5, pad: 1.5, bridge: 2.5, foot: 1.5 })) continue;
    if (tooClose(x, z, 2.2)) continue;
    rocks.push({ x, z, y: terrainHeight(x, z), s: 0.5 + R() * 0.9, rot: R() * TAU, tint: R(), shore: true });
  }

  // --- SHRUBS (snow-laden bushes), LOGS + STUMPS, DRIFTS, TUFTS. --------
  const shrubs = [];
  const logs = [];
  const stumps = [];
  const drifts = [];
  const tufts = [];
  for (let n = 0; n < 9000; n++) {
    const x = -140 + R() * 280, z = -124 + R() * 248;
    const dens = forestDensity(x, z);
    const r = R();
    if (r < 0.13) {
      if (dens < 0.15 || shrubs.length > 900) continue;
      if (!clearAt(x, z, { outside: false, edge: 2, trail: 1.8, pad: 2, chute: 1.5, ice: 1.2, lake: 1.5, foot: 1.5, bridge: 1.5, slope: 0.9 })) continue;
      shrubs.push({ x, z, y: terrainHeight(x, z), s: 0.6 + R() * 0.7, rot: R() * TAU, tint: R() });
    } else if (r < 0.15) {
      if (dens < 0.25) continue;
      if (!treeOK(x, z, { slope: 0.5, tall: false, trail: 2.5 })) continue;
      if (R() < 0.5) logs.push({ x, z, y: terrainHeight(x, z), s: 0.8 + R() * 0.6, rot: R() * TAU });
      else stumps.push({ x, z, y: terrainHeight(x, z), s: 0.8 + R() * 0.5, rot: R() * TAU });
    } else if (r < 0.24) {
      // Wind-blown drifts: low smooth mounds on open snow.
      if (dens > 0.3 || drifts.length > 520) continue;
      if (!clearAt(x, z, { outside: false, edge: 2, trail: 2.2, pad: 2.5, chute: 2, ice: 2, lake: 2, foot: 2, bridge: 2, lift: 2, slope: 0.6 })) continue;
      drifts.push({ x, z, y: terrainHeight(x, z), sx: 1.4 + R() * 2.8, sz: 0.8 + R() * 1.4, h: 0.25 + R() * 0.5, rot: R() * TAU });
    } else if (r < 0.42) {
      // Dry grass + heather tufts poking through near the trails and rocks.
      const nt = nearestTrail(x, z);
      if (!nt || nt.e < 0.6 || nt.e > 6 || tufts.length > 1600) continue;
      if (!clearAt(x, z, { outside: false, edge: 2, pad: 1.5, chute: 1, ice: 1, lake: 1, foot: 1, slope: 0.8 })) continue;
      tufts.push({ x, z, y: terrainHeight(x, z), s: 0.5 + R() * 0.6, rot: R() * TAU, tint: R() });
    }
  }
  // --- ICE CRYSTALS: clusters at the cave mouth + the lake shore. -------
  const crystals = [];
  const crystalAt = (cx, cz, n, rad) => {
    for (let k = 0; k < n; k++) {
      const a = R() * TAU, rr = rad * Math.sqrt(R());
      const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
      if (!clearAt(x, z, { trail: 1.5, pad: 0.8, foot: 0.5, lake: -0.5, tall: true, tallMargin: 0.5 })) continue;
      crystals.push({ x, z, y: terrainHeight(x, z), s: 0.5 + R() * 0.9, rot: R() * TAU, lean: (R() - 0.5) * 0.6 });
    }
  };
  crystalAt(CAVE_AREA.x - 12, CAVE_AREA.z - 3, 14, 4);
  crystalAt(CAVE_AREA.x + 12, CAVE_AREA.z - 3, 14, 4);
  crystalAt(-55, -86, 10, 5);
  crystalAt(70, -78, 8, 4);

  _props = { trees, rocks, crags, shrubs, logs, stumps, drifts, tufts, crystals };
  return _props;
}

export const SNOW_TRUNK_R = { fir: 0.38, spruce: 0.32, spiky: 0.18, birch: 0.2 };
export const SNOW_TREE_H = { fir: 10, spruce: 13, spiky: 6, birch: 9 };
/** Is (x, z) on a challenge stage pad (for the renderer's stage clearing)? */
export function onAnyStagePad(x, z) {
  return ["range", "grove", "meadow", "igloo-island", "penguin-floe", "cave", "sled-summit", "sledrun"].some((id) => onPad(id, x, z));
}
