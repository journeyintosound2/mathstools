/**
 * FRACTION FARM — the SCATTER: every tree, crop, bush, flower, rock, reed,
 * hay bale and log, plus the footprints of the buildings + set-pieces. Pure +
 * deterministic (seeded) so the renderer, the colliders and the checks all
 * see the same farm.
 *
 * The rules that keep it a good place to play:
 *   · nothing on a track, a level pad or in the water (low things may edge
 *     the tracks; trees keep well back),
 *   · nothing tall inside a challenge camera's view of its stage
 *     (farmCameras.inFarmCameraView),
 *   · nothing inside a building, a paddock (trees), a crop field or a fence line,
 *   · trees + bushes + rocks are clustered by noise into copses, shelter belts,
 *     creek-side gums and the occasional lone paddock tree — open pasture
 *     between, so the rolling hills read.
 */
import { clamp, smoothstep, fbm, vnoise, rng, segDistT } from "../terrainKit.js";
import {
  BOUNDARY_FENCE, FARM_PADDOCKS, FARM_FENCE_LINES, FARM_FIELDS, FARM_POND, FARM_HAY_BALES, FARM_HAY_MEADOW,
  FARM_BARN, FARM_HOUSE, FARM_SILO, FARM_COOP, FARM_TRACTOR, FARM_WINDMILL, FARM_TANK, SHOP_AREA,
  FARM_PACKING_SHED, FARM_SAWMILL, FARM_MILKING_SHED, FARM_GRAIN_SILOS, FARM_GLASSHOUSES, FARM_BIG_WINDMILL,
  FARM_SHEARING_SHED, FARM_UTE, FARM_HAY_TRACTOR, FARM_PICNIC, MILK_TRUCK, FARM_ENTRY_ARCH, FARM_MAP_BOARD,
  FARM_RECORDS_STAND, FARM_WELCOME_SIGN, CHALLENGE_SIGN, ROUNDUP_SIGN, ORDER_SIGN, CRATE_SIGN, MILK_SIGN,
  WEIGH_SIGN, TRADE_SIGN, VEGGIE_SIGN, PLANK_SIGN, SHOP_SIGN, FARM_SIGNPOSTS, FARM_CHEST_SPOTS, BIG_AMBER,
  FARM_RETURN_PORTAL, FARM_SPAWN, ORDER_GARDEN, FARM_MUD, FARM_YARD, FARM_SCARECROW,
} from "./farmLayout.js";
import {
  terrainHeight, slopeAt, nearestPath, nearestPad, waterEdgeDist, outsideFence, FARM_PATHS, rawHeight,
} from "./farmTerrain.js";
import { inFarmCameraView } from "./farmCameras.js";

const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// FOOTPRINTS — buildings + set-pieces: rect { x, z, w, d, rot } or circle
// { x, z, r }, with a height (tall things also stay out of camera views).
// ---------------------------------------------------------------------------
const rect = (id, x, z, w, d, rot, h) => ({ id, shape: "rect", x, z, w, d, rot: rot || 0, h });
const circ = (id, x, z, r, h) => ({ id, shape: "circle", x, z, r, h });
export const FARM_FOOTPRINTS = [
  rect("barn", FARM_BARN.x, FARM_BARN.z, FARM_BARN.w, FARM_BARN.d, 0, 11),
  rect("house", FARM_HOUSE.x, FARM_HOUSE.z, FARM_HOUSE.w + 3.2, FARM_HOUSE.d + 3.2, FARM_HOUSE.rotationY, 7),
  circ("feed-silo", FARM_SILO.x, FARM_SILO.z, FARM_SILO.radius + 0.3, FARM_SILO.height + 1.5),
  rect("coop", FARM_COOP.x, FARM_COOP.z, FARM_COOP.w, FARM_COOP.d, 0, 3),
  rect("tractor", FARM_TRACTOR.position[0], FARM_TRACTOR.position[1], 2.4, 4, FARM_TRACTOR.rotationY, 3),
  circ("water-windmill", FARM_WINDMILL.x, FARM_WINDMILL.z, 2.2, FARM_WINDMILL.height + 2),
  circ("tank", FARM_TANK.x, FARM_TANK.z, FARM_TANK.radius + 0.2, FARM_TANK.height + 1),
  rect("shop", SHOP_AREA.x, SHOP_AREA.z, 7, 4.2, 0, 4),
  rect("packing-shed", FARM_PACKING_SHED.x, FARM_PACKING_SHED.z, FARM_PACKING_SHED.w, FARM_PACKING_SHED.d, 0, 5.5),
  rect("sawmill", FARM_SAWMILL.x, FARM_SAWMILL.z, FARM_SAWMILL.w, FARM_SAWMILL.d, 0, 7),
  circ("water-wheel", FARM_SAWMILL.wheel[0], FARM_SAWMILL.wheel[1], 3.2, 6),
  rect("milking-shed", FARM_MILKING_SHED.x, FARM_MILKING_SHED.z, FARM_MILKING_SHED.w, FARM_MILKING_SHED.d, 0, 6),
  ...FARM_GRAIN_SILOS.map(([x, z, r, h], i) => circ(`grain-silo-${i}`, x, z, r + 0.4, h + 2)),
  rect("weighbridge", 74, -36, 3.6, 9.4, 0, 1),
  rect("weighbridge-office", 78.8, -42.5, 3.4, 2.8, 0, 3.4),
  ...FARM_GLASSHOUSES.map((g, i) => rect(`glasshouse-${i}`, g.x, g.z, g.w, g.d, 0, 4.2)),
  rect("shearing-shed", FARM_SHEARING_SHED.x, FARM_SHEARING_SHED.z, FARM_SHEARING_SHED.w, FARM_SHEARING_SHED.d, FARM_SHEARING_SHED.rotationY, 6),
  circ("big-windmill", FARM_BIG_WINDMILL.position[0], FARM_BIG_WINDMILL.position[1], 3.4, FARM_BIG_WINDMILL.height + 7),
  rect("picnic", FARM_PICNIC.position[0], FARM_PICNIC.position[1], 2.2, 2.2, FARM_PICNIC.rotationY, 1),
  rect("ute", FARM_UTE.position[0], FARM_UTE.position[1], 2.1, 4.8, FARM_UTE.rotationY, 2),
  rect("hay-tractor", FARM_HAY_TRACTOR.position[0], FARM_HAY_TRACTOR.position[1], 2.6, 6.5, FARM_HAY_TRACTOR.rotationY, 3),
  rect("milk-truck", MILK_TRUCK.position[0], MILK_TRUCK.position[1], 2.8, 7.4, MILK_TRUCK.rotationY, 3.5),
  circ("arch-w", FARM_ENTRY_ARCH.position[0] - FARM_ENTRY_ARCH.width / 2, FARM_ENTRY_ARCH.position[1], 0.6, FARM_ENTRY_ARCH.height),
  circ("arch-e", FARM_ENTRY_ARCH.position[0] + FARM_ENTRY_ARCH.width / 2, FARM_ENTRY_ARCH.position[1], 0.6, FARM_ENTRY_ARCH.height),
  rect("map-board", FARM_MAP_BOARD.position[0], FARM_MAP_BOARD.position[1], 3.6, 0.8, FARM_MAP_BOARD.rotationY, 3),
  circ("records", FARM_RECORDS_STAND.position[0], FARM_RECORDS_STAND.position[1], 3.2, 6),
  circ("portal", FARM_RETURN_PORTAL[0], FARM_RETURN_PORTAL[1], 3.5, 6),
  circ("spawn", FARM_SPAWN.x, FARM_SPAWN.z, 2.5, 0),
  circ("big-amber", BIG_AMBER.position[0], BIG_AMBER.position[1], 1.2, 12),
  circ("scarecrow", FARM_SCARECROW.x, FARM_SCARECROW.z, 0.6, 2.4),
  ...[FARM_WELCOME_SIGN, CHALLENGE_SIGN, ROUNDUP_SIGN, ORDER_SIGN, CRATE_SIGN, MILK_SIGN, WEIGH_SIGN, TRADE_SIGN, VEGGIE_SIGN, PLANK_SIGN, SHOP_SIGN]
    .map((s, i) => circ(`host-${i}`, s.position[0], s.position[1], 1.4, 2)),
  ...FARM_SIGNPOSTS.map((s) => circ(`signpost-${s.id}`, s.at[0], s.at[1], 0.6, 2.8)),
  ...FARM_CHEST_SPOTS.map((p, i) => circ(`chest-${i}`, p[0], p[1], 1.6, 0)),
];
/** Metres outside a footprint (− = inside). */
export function footprintDist(f, x, z) {
  if (f.shape === "circle") return Math.hypot(x - f.x, z - f.z) - f.r;
  const c = Math.cos(f.rot), s = Math.sin(f.rot);
  const dx = x - f.x, dz = z - f.z;
  // three.js rotation.y: local (lx, lz) → world (lx c + lz s, −lx s + lz c).
  const lx = dx * c - dz * s, lz = dx * s + dz * c;
  const ox = Math.abs(lx) - f.w / 2, oz = Math.abs(lz) - f.d / 2;
  return ox > 0 || oz > 0 ? Math.hypot(Math.max(0, ox), Math.max(0, oz)) : Math.max(ox, oz);
}
export function nearestFootprint(x, z) {
  let best = { e: Infinity, f: null };
  for (const f of FARM_FOOTPRINTS) {
    if (Math.abs(x - f.x) > 30 || Math.abs(z - f.z) > 30) continue;
    const e = footprintDist(f, x, z);
    if (e < best.e) best = { e, f };
  }
  return best;
}

// ---------------------------------------------------------------------------
// Paddocks, fence lines, fields — distances.
// ---------------------------------------------------------------------------
/** Metres outside the paddock rect (− = inside). */
export function paddockDist(p, x, z) {
  const ox = Math.abs(x - p.x) - p.w / 2, oz = Math.abs(z - p.z) - p.d / 2;
  return ox > 0 || oz > 0 ? Math.hypot(Math.max(0, ox), Math.max(0, oz)) : Math.max(ox, oz);
}
export function nearestPaddock(x, z) {
  let best = { e: Infinity, p: null };
  for (const p of FARM_PADDOCKS) {
    const e = paddockDist(p, x, z);
    if (e < best.e) best = { e, p };
  }
  return best;
}
/** Distance to the nearest fence (paddock edge or fence line). */
export function fenceDist(x, z) {
  let d = Infinity;
  for (const p of FARM_PADDOCKS) d = Math.min(d, Math.abs(paddockDist(p, x, z)));
  for (const l of FARM_FENCE_LINES) {
    for (let i = 0; i < l.pts.length - 1; i++) {
      const a = l.pts[i], b = l.pts[i + 1];
      d = Math.min(d, segDistT(x, z, a[0], a[1], b[0], b[1]).d);
    }
  }
  return d;
}
export function fieldQ(f, x, z) {
  return Math.hypot((x - f.c[0]) / f.rx, (z - f.c[1]) / f.rz);
}
export function inField(x, z, grow = 0) {
  for (const f of FARM_FIELDS) {
    if (Math.hypot((x - f.c[0]) / (f.rx + grow), (z - f.c[1]) / (f.rz + grow)) < 1) return f;
  }
  return null;
}
/** Orchard + vineyard blocks (rows of trees / vines). */
export const FARM_ORCHARD = { x0: -100, x1: -74, z0: 12, z1: 64, rowGap: 6.2, treeGap: 5.4 };
export const FARM_VINEYARD = { x0: 92, x1: 118, z0: 88, z1: 110, rowGap: 2.6, postGap: 3.2 };
export const FARM_VEG_ROWS = { x0: -98, x1: -82, z0: 74, z1: 85, rowGap: 1.4 };
function inBlock(b, x, z, m = 0) {
  return x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m;
}

// ---------------------------------------------------------------------------
// The shared "can something stand here?" test.
// ---------------------------------------------------------------------------
/**
 * opts: path (min m outside a track edge), pad (min m outside a pad rim),
 * water (min m from the water's edge), foot (min m outside a footprint),
 * fence (min m from any fence), tall (keep out of camera views), field (keep
 * out of crop fields), slope (max slope), paddock (−1 allow inside, else min m
 * outside), outside (true → only beyond the fence, false → only inside).
 */
export function clearAt(x, z, o) {
  const out = outsideFence(x, z);
  if (o.outside === true) { if (out < 3) return false; }
  else if (out > -(o.edge ?? 2.5)) return false;
  if (o.slope !== undefined && slopeAt(x, z) > o.slope) return false;
  if (o.water !== undefined && waterEdgeDist(x, z) < o.water) return false;
  if (o.outside === true) return true;
  if (o.path !== undefined) {
    const np = nearestPath(x, z);
    if (np && np.e < o.path) return false;
  }
  if (o.pad !== undefined && nearestPad(x, z).e < o.pad) return false;
  if (o.foot !== undefined && nearestFootprint(x, z).e < o.foot) return false;
  if (o.fence !== undefined && fenceDist(x, z) < o.fence) return false;
  if (o.paddock !== undefined && o.paddock >= 0 && nearestPaddock(x, z).e < o.paddock) return false;
  if (o.field && inField(x, z, o.field)) return false;
  if (o.tall && inFarmCameraView(x, z, o.tallMargin ?? 3)) return false;
  if (o.blocks !== false && (inBlock(FARM_ORCHARD, x, z, 2) || inBlock(FARM_VINEYARD, x, z, 2) || inBlock(FARM_VEG_ROWS, x, z, 1))) return false;
  return true;
}

// ---------------------------------------------------------------------------
// THE SCATTER
// ---------------------------------------------------------------------------
let _props = null;
export function getFarmProps() {
  if (_props) return _props;
  const R = rng(20261007);
  const trees = { apple: [], pear: [], gum: [], oak: [], poplar: [], willow: [], pine: [], amber: [] };
  const all = []; // spacing (tree trunks)
  const tooClose = (x, z, d) => all.some((t) => Math.abs(t.x - x) < d && Math.abs(t.z - z) < d && Math.hypot(t.x - x, t.z - z) < d);
  const put = (kind, x, z, s, extra = {}) => {
    const t = { x, z, y: terrainHeight(x, z), s, rot: R() * TAU, tint: R(), kind, ...extra };
    trees[kind].push(t);
    all.push(t);
    return t;
  };
  const treeOK = (x, z, extra = {}) => clearAt(x, z, {
    path: 3.2, pad: 4, water: 2.2, foot: 3, fence: 2.2, paddock: 2, field: 1.5, tall: true, slope: 0.62, ...extra,
  });

  // --- The ORCHARD: apple + pear rows down Orchard Hill's eastern slope. ----
  {
    const O = FARM_ORCHARD;
    let row = 0;
    for (let x = O.x0; x <= O.x1; x += O.rowGap, row++) {
      for (let z = O.z0 + (row % 2) * (O.treeGap / 2); z <= O.z1; z += O.treeGap) {
        const jx = x + (R() - 0.5) * 0.5, jz = z + (R() - 0.5) * 0.5;
        if (!clearAt(jx, jz, { path: 2.6, pad: 3, water: 3, foot: 3, fence: 2, field: 1, tall: true, slope: 0.6, blocks: false })) continue;
        put(row % 3 === 2 ? "pear" : "apple", jx, jz, 0.85 + R() * 0.3);
      }
    }
  }
  // --- POPLARS line the drive (both sides), arrival → homestead. ------------
  {
    const drive = FARM_PATHS.find((p) => p.id === "drive");
    let acc = 0;
    for (let i = 1; i < drive.pts.length; i++) {
      const [ax, az] = drive.pts[i - 1], [bx, bz] = drive.pts[i];
      acc += Math.hypot(bx - ax, bz - az);
      if (acc < 3.9) continue;
      acc = 0;
      if (bz > 92 || bz < 73) continue;
      const tl = Math.hypot(bx - ax, bz - az) || 1;
      const nx = -(bz - az) / tl, nz = (bx - ax) / tl;
      for (const side of [-1, 1]) {
        const x = bx + nx * 5.4 * side, z = bz + nz * 5.4 * side;
        if (clearAt(x, z, { path: 2.2, foot: 1.5, tall: true, water: 2, field: 0.5 })) put("poplar", x, z, 0.9 + R() * 0.2);
      }
    }
  }
  // --- WILLOWS weep over the duck pond + a few creek bends. -----------------
  for (let k = 0; k < 7; k++) {
    const a = 0.4 + (k / 7) * TAU + (R() - 0.5) * 0.3;
    const d = FARM_POND.radius + 3.2 + R() * 1.5;
    const x = FARM_POND.center[0] + Math.cos(a) * d, z = FARM_POND.center[1] + Math.sin(a) * d;
    if (treeOK(x, z, { water: 1.6, tall: true }) && !tooClose(x, z, 6)) put("willow", x, z, 0.9 + R() * 0.25);
  }
  // --- Big shade trees round the homestead + the market + liquid ambers. -----
  const manual = [
    ["oak", -36, 26, 1.15], ["oak", -38, 40, 1.0], ["oak", -16, 52, 1.05], ["amber", -33, 33, 0.95], ["oak", 31, 8, 1.1],
    ["oak", 26, 49, 0.95], ["amber", -6, 60, 0.85], ["oak", 54, 46, 1.1], ["amber", 66, 98, 1.0], ["amber", 38, 100, 0.9],
    ["oak", 78, 92, 1.0], ["oak", -50, 96, 1.0], ["oak", -76, 104, 1.1], ["oak", -20, -50, 1.2], ["oak", 44, -66, 1.15],
    ["amber", 18, 92, 0.9], ["oak", -110, -96, 1.1], ["oak", -84, -96, 1.05], ["oak", 30, -112, 1.0],
  ];
  for (const [kind, x, z, s] of manual) if (treeOK(x, z, { path: 2.6, pad: 2, foot: 2.5 })) put(kind, x, z, s);

  // --- PINE windbreak along the north boundary (gaps where the hills rise). -
  for (let x = -136; x <= 136; x += 4.3) {
    const z = -BOUNDARY_FENCE.halfD + 6 + (R() - 0.5) * 2.4;
    const jx = x + (R() - 0.5) * 1.6;
    if (vnoise(jx / 22, 3.3, 41) < 0.28) continue;
    if (treeOK(jx, z, { slope: 0.7, edge: 3 }) && !tooClose(jx, z, 3.4)) put("pine", jx, z, 0.85 + R() * 0.35);
  }
  // --- GUM TREES: creek-side, copses on the hills, shelter belts, lone trees.
  for (let x = -138; x <= 138; x += 4) {
    for (let z = -122; z <= 122; z += 4) {
      const jx = x + (R() - 0.5) * 3.6, jz = z + (R() - 0.5) * 3.6;
      const out = outsideFence(jx, jz);
      if (out > -3) continue;
      const copse = smoothstep(0.56, 0.69, fbm(jx / 46 + 3, jz / 46 - 7, 3, 51));
      const we = waterEdgeDist(jx, jz);
      const creek = we > 2.5 && we < 9 ? 0.42 : 0;
      const belt = out > -15 ? 0.3 * smoothstep(0.3, 0.55, vnoise(jx / 18, jz / 18, 52)) : 0;
      const lone = 0.014;
      const p = Math.max(copse * 0.78, creek, belt, lone);
      if (R() > p) continue;
      if (!treeOK(jx, jz)) continue;
      if (tooClose(jx, jz, copse > 0.3 ? 5.2 : 7)) continue;
      // Copses mix in an oak or two; otherwise gums (+ the odd pine up high).
      const kind = copse > 0.3 && R() < 0.22 ? "oak" : "gum";
      put(kind, jx, jz, 0.8 + R() * 0.45);
    }
  }
  // --- The OUTER HILLS beyond the fence: hedgerow lines + copses (no colliders).
  const deco = [];
  for (let x = -230; x <= 230; x += 5) {
    for (let z = -215; z <= 215; z += 5) {
      const jx = x + (R() - 0.5) * 4, jz = z + (R() - 0.5) * 4;
      const out = outsideFence(jx, jz);
      if (out < 5 || out > 70) continue;
      // Hedgerows follow the patchwork's field edges; copses in between.
      const fx = ((jx + 400) % 46) / 46, fz = ((jz + 400) % 38) / 38;
      const edge = Math.min(fx, 1 - fx, fz, 1 - fz) < 0.05 ? 0.55 : 0;
      const copse = smoothstep(0.62, 0.74, fbm(jx / 40 + 9, jz / 40 + 2, 3, 53)) * 0.6;
      if (R() > Math.max(edge, copse, 0.02)) continue;
      deco.push({ x: jx, z: jz, y: rawHeight(jx, jz), s: 0.9 + R() * 0.5, rot: R() * TAU, tint: R(), kind: R() < 0.7 ? "gum" : "oak", deco: true });
    }
  }

  // --- BUSHES along fences, track verges + copse edges. --------------------
  const bushes = [];
  const flowers = [];
  const rocks = [];
  for (let x = -138; x <= 138; x += 3) {
    for (let z = -122; z <= 122; z += 3) {
      const jx = x + (R() - 0.5) * 2.8, jz = z + (R() - 0.5) * 2.8;
      if (outsideFence(jx, jz) > -2) continue;
      const fd = fenceDist(jx, jz);
      const np = nearestPath(jx, jz);
      const verge = np && np.e > 1.2 && np.e < 3.5 ? 0.06 : 0;
      const hedge = fd > 0.9 && fd < 2.2 ? 0.12 : 0;
      const copseEdge = smoothstep(0.55, 0.66, fbm(jx / 46 + 3, jz / 46 - 7, 3, 51)) * 0.18;
      const pb = Math.max(verge, hedge, copseEdge);
      if (R() < pb && clearAt(jx, jz, { path: 1.2, pad: 1.5, water: 1.5, foot: 1.2, fence: 0.9, paddock: 0.9, field: 1, tall: true, tallMargin: 1, slope: 0.7 })) {
        bushes.push({ x: jx, z: jz, y: terrainHeight(jx, jz), s: 0.7 + R() * 0.6, rot: R() * TAU, tint: R() });
      }
      // Wildflower drifts in the pasture (dense in noise patches).
      const meadow = smoothstep(0.58, 0.7, fbm(jx / 24 - 5, jz / 24 + 9, 2, 54));
      if (R() < meadow * 0.75 + 0.03) {
        const fx = jx + (R() - 0.5) * 1.2, fz = jz + (R() - 0.5) * 1.2;
        if (clearAt(fx, fz, { path: 0.5, pad: 0.5, water: 1, foot: 0.8, fence: 0.6, paddock: 0.5, field: 0.5, slope: 0.75 })) {
          flowers.push({ x: fx, z: fz, y: terrainHeight(fx, fz), s: 0.8 + R() * 0.6, rot: R() * TAU, tint: R(), v: Math.floor(R() * 6) });
        }
      }
    }
  }
  // --- ROCKS: granite tors on the high ground + stones along the creek. ----
  for (let x = -138; x <= 138; x += 5) {
    for (let z = -122; z <= 122; z += 5) {
      const jx = x + (R() - 0.5) * 4.5, jz = z + (R() - 0.5) * 4.5;
      if (outsideFence(jx, jz) > -3) continue;
      const h = rawHeight(jx, jz);
      const high = smoothstep(9, 15, h) * smoothstep(0.62, 0.75, vnoise(jx / 14, jz / 14, 55)) * 0.55;
      const we = waterEdgeDist(jx, jz);
      const bank = we > 0.4 && we < 2.2 ? 0.16 : 0;
      if (R() > Math.max(high, bank, 0.006)) continue;
      if (!clearAt(jx, jz, { path: 1.6, pad: 2, water: 0.3, foot: 1.5, fence: 1.2, paddock: 1, field: 1, tall: true, tallMargin: 1 })) continue;
      const n = high > 0.2 ? 2 + Math.floor(R() * 3) : 1;
      for (let k = 0; k < n; k++) {
        const rx = jx + (R() - 0.5) * 3, rz = jz + (R() - 0.5) * 3;
        if (k && !clearAt(rx, rz, { path: 1.6, pad: 2, water: 0.3, foot: 1.5, fence: 1.2, paddock: 1, field: 1, tall: true, tallMargin: 1 })) continue;
        const s = (high > 0.2 ? 0.7 + R() * 0.9 : 0.35 + R() * 0.4) * (k ? 0.7 : 1);
        rocks.push({ x: rx, z: rz, y: terrainHeight(rx, rz), s, rot: R() * TAU, tint: R(), collide: s > 0.75 });
      }
    }
  }
  // --- REEDS + LILIES round the pond and in the creek's slow bends. --------
  const reeds = [];
  const lilies = [];
  for (let k = 0; k < 46; k++) {
    const a = R() * TAU, d = FARM_POND.radius + (R() - 0.6) * 1.6;
    const x = FARM_POND.center[0] + Math.cos(a) * d, z = FARM_POND.center[1] + Math.sin(a) * d;
    const np = nearestPath(x, z);
    if (np && np.e < 1) continue;
    reeds.push({ x, z, y: terrainHeight(x, z), s: 0.8 + R() * 0.5, rot: R() * TAU, tint: R() });
  }
  for (let k = 0; k < 26; k++) {
    const a = R() * TAU, d = Math.sqrt(R()) * (FARM_POND.radius - 2.2);
    const x = FARM_POND.center[0] + Math.cos(a) * d, z = FARM_POND.center[1] + Math.sin(a) * d;
    if (lilies.some((l) => Math.hypot(l.x - x, l.z - z) < 1.1)) continue;
    lilies.push({ x, z, s: 0.7 + R() * 0.6, rot: R() * TAU, tint: R(), flower: R() < 0.25 });
  }
  for (let x = -150; x <= 0; x += 2.5) {
    for (let z = -110; z <= 100; z += 2.5) {
      const jx = x + (R() - 0.5) * 2, jz = z + (R() - 0.5) * 2;
      const we = waterEdgeDist(jx, jz);
      if (we < -0.6 || we > 0.5 || R() > 0.22) continue;
      if (outsideFence(jx, jz) > -2) continue;
      const np = nearestPath(jx, jz);
      if (np && np.e < 2.5) continue;
      if (nearestFootprint(jx, jz).e < 1) continue;
      reeds.push({ x: jx, z: jz, y: terrainHeight(jx, jz), s: 0.7 + R() * 0.5, rot: R() * TAU, tint: R() });
    }
  }

  // --- CROPS -----------------------------------------------------------------
  const crops = { wheat: [], corn: [], sunflower: [], pumpkin: [], lavender: [], cabbage: [], lettuce: [], carrot: [], vine: [], vinePost: [] };
  for (const f of FARM_FIELDS) {
    const step = f.kind === "wheat" ? 0.95 : f.kind === "corn" ? 1.05 : f.kind === "sunflower" ? 1.5 : f.kind === "pumpkin" ? 1.9 : 1.3;
    const rowStep = f.kind === "wheat" ? 0.95 : f.kind === "corn" ? 1.5 : f.kind === "sunflower" ? 1.7 : f.kind === "pumpkin" ? 2.1 : 1.9;
    // Rows run along the field's long axis, slightly turned to follow the land.
    const ang = f.kind === "wheat" ? 0.35 : f.kind === "lavender" ? 0.15 : f.kind === "corn" ? -0.1 : 0;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    for (let u = -f.rx - 2; u <= f.rx + 2; u += step) {
      for (let v = -f.rz - 2; v <= f.rz + 2; v += rowStep) {
        const ju = u + (f.kind === "wheat" ? (R() - 0.5) * 0.6 : (R() - 0.5) * 0.15);
        const jv = v + (f.kind === "wheat" ? (R() - 0.5) * 0.6 : 0);
        const x = f.c[0] + ju * ca - jv * sa, z = f.c[1] + ju * sa + jv * ca;
        // A softly ragged field edge.
        const q = fieldQ(f, x, z) + (vnoise(x / 3, z / 3, 56) - 0.5) * 0.12;
        if (q > 1) continue;
        if (!clearAt(x, z, { path: 0.4, pad: 0.6, water: 1.5, foot: 0.8, fence: 0.6, slope: 0.8, blocks: false })) continue;
        const it = { x, z, y: terrainHeight(x, z), s: 0.85 + R() * 0.3, rot: f.kind === "lavender" || f.kind === "corn" ? ang + (R() - 0.5) * 0.4 : R() * TAU, tint: R() };
        crops[f.kind].push(it);
      }
    }
  }
  // Veggie rows west of the carrot patch: carrots, cabbages, lettuces.
  {
    const V = FARM_VEG_ROWS;
    let row = 0;
    for (let z = V.z0; z <= V.z1; z += V.rowGap, row++) {
      const kind = ["carrot", "cabbage", "carrot", "lettuce", "cabbage", "carrot", "lettuce", "cabbage"][row % 8];
      for (let x = V.x0; x <= V.x1; x += kind === "cabbage" ? 0.9 : 0.6) {
        const jx = x + (R() - 0.5) * 0.12;
        if (!clearAt(jx, z, { path: 0.6, pad: 0.6, water: 1.5, foot: 0.8, fence: 0.6, slope: 0.8, blocks: false })) continue;
        crops[kind].push({ x: jx, z, y: terrainHeight(jx, z), s: 0.85 + R() * 0.3, rot: R() * TAU, tint: R() });
      }
    }
  }
  // The vineyard: trellis rows on Lookout Knoll's sunny south-west flank.
  {
    const V = FARM_VINEYARD;
    const ang = -0.35;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const cx = (V.x0 + V.x1) / 2, cz = (V.z0 + V.z1) / 2;
    for (let v = -(V.z1 - V.z0) / 2; v <= (V.z1 - V.z0) / 2; v += V.rowGap) {
      for (let u = -(V.x1 - V.x0) / 2; u <= (V.x1 - V.x0) / 2; u += 1.0) {
        const x = cx + u * ca - v * sa, z = cz + u * sa + v * ca;
        if (outsideFence(x, z) > -4) continue;
        if (!clearAt(x, z, { path: 1.2, pad: 1, water: 2, foot: 1, fence: 1, slope: 0.7, blocks: false, tall: true, tallMargin: 1 })) continue;
        const post = Math.abs(((u + 100) % V.postGap) - V.postGap / 2) < 0.5;
        crops.vine.push({ x, z, y: terrainHeight(x, z), s: 0.9 + R() * 0.2, rot: ang, tint: R() });
        if (post) crops.vinePost.push({ x, z, y: terrainHeight(x, z), s: 1, rot: ang, tint: R() });
      }
    }
  }

  // --- HAY: round bales (the meadow + the homestead), square-bale stacks. ---
  const bales = { round: [], square: [] };
  for (const [x, z, rot] of FARM_HAY_BALES) {
    if (clearAt(x, z, { path: 1.5, pad: -100, water: 2, foot: 1, fence: 1.2, tall: true, tallMargin: 1, blocks: false })) {
      bales.round.push({ x, z, y: terrainHeight(x, z), s: 1, rot, tint: R() });
    }
  }
  {
    const M = FARM_HAY_MEADOW;
    for (let k = 0; k < 16; k++) {
      const a = R() * TAU, d = Math.sqrt(R());
      const x = M.c[0] + Math.cos(a) * d * M.rx, z = M.c[1] + Math.sin(a) * d * M.rz;
      if (bales.round.some((b) => Math.hypot(b.x - x, b.z - z) < 4)) continue;
      if (!clearAt(x, z, { path: 1.5, pad: 1, water: 2, foot: 1.5, fence: 1.5, tall: true, tallMargin: 1, slope: 0.5 })) continue;
      bales.round.push({ x, z, y: terrainHeight(x, z), s: 0.95 + R() * 0.1, rot: R() * TAU, tint: R() });
    }
  }
  // Square-bale stacks: beside the barn, at the market (seats), by the sheds.
  const stack = (x, z, rot, layers = 2, n = 3) => {
    const ca = Math.cos(rot), sa = Math.sin(rot);
    for (let L = 0; L < layers; L++) {
      for (let i = 0; i < n - L; i++) {
        const u = (i - (n - L - 1) / 2) * 1.12;
        const bx = x + u * ca, bz = z - u * sa;
        bales.square.push({ x: bx, z: bz, y: terrainHeight(x, z) + L * 0.5, s: 1, rot, tint: R(), layer: L });
      }
    }
  };
  stack(-11.5, 11, 0.1, 3, 4);
  stack(11.5, 4.5, 0.2, 2, 3);
  stack(52, 92, 0.6, 1, 3);
  stack(76, 90.5, 0.3, 1, 2);
  stack(-67, 24.5, 0, 2, 3);
  stack(-104, -76, 0.2, 2, 3);

  // --- LOGS + STUMPS round the sawmill; a few fallen logs in the copses. ---
  const logs = [];
  const stumps = [];
  const logPile = (x, z, rot, n) => {
    for (let k = 0; k < n; k++) {
      const layer = k < 3 ? 0 : k < 5 ? 1 : 2;
      const idx = layer === 0 ? k : layer === 1 ? k - 3 : 0;
      const off = (idx - (layer === 0 ? 1 : layer === 1 ? 0.5 : 0)) * 0.62;
      // Across the log's axis (local +x → world (cos, −sin) under rotation.y).
      const ca = Math.sin(rot), sa = Math.cos(rot);
      logs.push({ x: x + ca * off, z: z + sa * off, y: terrainHeight(x, z) + layer * 0.52, len: 4.6, r: 0.3, rot, tint: R(), pile: true });
    }
  };
  logPile(-52, -31, 0.15, 6);
  logPile(-66, -33.5, -0.3, 6);
  for (const [x, z] of [[-35, -24], [-40, -28], [-60, -6], [-30, 4]]) {
    if (clearAt(x, z, { path: 1.5, pad: 1, water: 1.5, foot: 1, fence: 1 })) stumps.push({ x, z, y: terrainHeight(x, z), s: 0.9 + R() * 0.3, rot: R() * TAU, tint: R() });
  }
  // A few fallen logs out in the copses.
  for (const t of trees.gum) {
    if (logs.length > 22 || R() > 0.05) continue;
    const a = R() * TAU, x = t.x + Math.cos(a) * 3.2, z = t.z + Math.sin(a) * 3.2;
    if (!clearAt(x, z, { path: 2.5, pad: 2, water: 2, foot: 2, fence: 2, field: 1, slope: 0.4, tall: false })) continue;
    logs.push({ x, z, y: terrainHeight(x, z), len: 3 + R() * 2.5, r: 0.26 + R() * 0.1, rot: R() * TAU, tint: R() });
  }

  _props = { trees, deco, bushes, flowers, rocks, reeds, lilies, crops, bales, logs, stumps };
  return _props;
}

/** Trunk radius per tree kind (× scale) — colliders + clearance checks. */
export const FARM_TRUNK_R = { apple: 0.24, pear: 0.24, gum: 0.42, oak: 0.55, poplar: 0.3, willow: 0.5, pine: 0.34, amber: 0.38 };
/** Typical height per tree kind (× scale) — renderer + camera checks. */
export const FARM_TREE_H = { apple: 4.4, pear: 5, gum: 14, oak: 10, poplar: 15, willow: 9, pine: 12, amber: 11 };

export { clamp, FARM_MUD, FARM_YARD, ORDER_GARDEN };
