/**
 * SUNSTONE DESERT — PROPS (built 2026-11-08). Deterministic placement of
 * everything that isn't terrain: the FOOTPRINTS of the hand-placed set-pieces
 * (so the scatter keeps clear of them) and the SCATTER — saguaro, barrel and
 * prickly-pear cacti, palms round the oasis + town, dry shrubs and grass
 * tufts, sandstone boulders + scree, bleached bones and tumbleweeds.
 * Pure (no three / React) — the renderer, the colliders and the checks read it.
 */
import { TAU, smoothstep, fbm, vnoise, rng, segDistT } from "../terrainKit.js";
import {
  DESERT_SPAWN, DESERT_RETURN_PORTAL, DESERT_WELCOME_SIGN, DESERT_WELCOME_HOST, DESERT_MAP_BOARD, CARAVAN_GATE,
  BAZAAR_BUILDINGS, TOWER_STAIR, ZIGGURAT, MARKET_STALLS, TOWN_WELL, PYRAMID, SUNSTONE, OBELISKS, SUN_TEMPLE,
  OASIS, OASIS_POOL, OASIS_STAIRS, HIERO_WALL, MESA_STAIR, MINE_RAILS, MINE_MOUTH, SUN_ARCH, SUNDIAL_RISE, DUNE_SHIP,
  SAND_SPHINX, CRYSTALS, FOSSIL, DESERT_SPOTS, TEMPLE_STONES, TEMPLE_STONE_CLEAR, TEMPLE_WALL, TEMPLE_DASH, DESERT_SIGNPOSTS, QS_SIGNS, CAMELS, DESERT_CHEST_SPOTS, BOARDWALK,
  DESERT_BOUNDARY, TOWN,
} from "./desertLayout.js";
import {
  terrainHeight, slopeAt, nearestTrail, nearestPad, quicksandAt, poolEdgeDist, outsideRim, duneFieldAt, onPad,
  structureTopAt, D_SLIDE_SLOPE, getMesas, getButtes,
} from "./desertTerrain.js";

// ---------------------------------------------------------------------------
// FOOTPRINTS — circles { id, x, z, r } or rects { id, x, z, w, d, rot, shape: "rect" }.
// ---------------------------------------------------------------------------
const circ = (id, [x, z], r, extra = {}) => ({ id, x, z, r, shape: "circle", ...extra });
const rect = (id, x, z, w, d, rot = 0, extra = {}) => ({ id, x, z, w, d, rot, shape: "rect", ...extra });
/** Signed distance from (x, z) to a footprint (− = inside). */
export function footprintDist(f, x, z) {
  if (f.shape === "circle") return Math.hypot(x - f.x, z - f.z) - f.r;
  const c = Math.cos(f.rot), s = Math.sin(f.rot);
  const dx = x - f.x, dz = z - f.z;
  const lx = dx * c - dz * s, lz = dx * s + dz * c;
  const qx = Math.abs(lx) - f.w / 2, qz = Math.abs(lz) - f.d / 2;
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0);
}

const ARCH_LEGS = (() => {
  const c = Math.cos(SUN_ARCH.yaw), s = Math.sin(SUN_ARCH.yaw);
  const h = SUN_ARCH.span / 2;
  return [-1, 1].map((k) => [SUN_ARCH.c[0] + c * h * k, SUN_ARCH.c[1] - s * h * k]);
})();
export { ARCH_LEGS };

export const DESERT_FOOTPRINTS = [
  circ("spawn", [DESERT_SPAWN.x, DESERT_SPAWN.z], 3),
  circ("portal", DESERT_RETURN_PORTAL, 3.4),
  circ("welcome", DESERT_WELCOME_SIGN.position, 1.6),
  circ("host-mills", DESERT_WELCOME_HOST.position, 1.2),
  circ("map-board", DESERT_MAP_BOARD.position, 2.6),
  // The Caravan Gate: two wall runs either side of the arch + round towers.
  rect("gate-wall-w", -(CARAVAN_GATE.openHalf + CARAVAN_GATE.halfSpan) / 2, CARAVAN_GATE.z, CARAVAN_GATE.halfSpan - CARAVAN_GATE.openHalf, CARAVAN_GATE.thick),
  rect("gate-wall-e", (CARAVAN_GATE.openHalf + CARAVAN_GATE.halfSpan) / 2, CARAVAN_GATE.z, CARAVAN_GATE.halfSpan - CARAVAN_GATE.openHalf, CARAVAN_GATE.thick),
  circ("gate-tower-w", [-CARAVAN_GATE.halfSpan - 1.2, CARAVAN_GATE.z], 2.3),
  circ("gate-tower-e", [CARAVAN_GATE.halfSpan + 1.2, CARAVAN_GATE.z], 2.3),
  // The town (solid buildings — the footprints keep the scatter off them).
  ...BAZAAR_BUILDINGS.map((b) => rect(`bld-${b.id}`, b.x, b.z, b.w + 1.2, b.d + 1.2)),
  rect("tower-stair", TOWER_STAIR.from[0], (TOWER_STAIR.from[1] + TOWER_STAIR.to[1]) / 2 - 1, 3, 16),
  rect("ziggurat", ZIGGURAT.c[0] + 3, ZIGGURAT.c[1], 19, 13.5),
  ...MARKET_STALLS.map(([x, z, yaw], i) => rect(`stall-${i}`, x, z, 3.2, 2.4, yaw)),
  circ("well", TOWN_WELL, 1.6),
  // The pyramid, its stair + the Sunstone; the obelisks.
  rect("pyramid", PYRAMID.c[0], PYRAMID.c[1], PYRAMID.half * 2 + 2, PYRAMID.half * 2 + 2),
  rect("pyramid-stair", 0, (PYRAMID.stair.zFoot - PYRAMID.c[1] + PYRAMID.half) / 2 + PYRAMID.c[1] - PYRAMID.half / 2, PYRAMID.stair.hw * 2 + 1.5, 30),
  circ("sunstone", SUNSTONE.position, SUNSTONE.base),
  ...OBELISKS.map((p, i) => circ(`obelisk-${i}`, p, 1.5)),
  // The Sun Temple + its sphinxes.
  rect("temple", 0, (SUN_TEMPLE.zFront + SUN_TEMPLE.zBack) / 2 - 1.5, SUN_TEMPLE.x1 - SUN_TEMPLE.x0 + 4, 14),
  ...SUN_TEMPLE.sphinxes.map((p, i) => rect(`sphinx-${i}`, p[0], p[1], 2.6, 5.4)),
  // The oasis: its stairs + the carved wall.
  ...OASIS_STAIRS.map((s) => rect(`stair-${s.id}`, (s.from[0] + s.to[0]) / 2, (s.from[1] + s.to[1]) / 2,
    Math.abs(s.to[0] - s.from[0]) + s.hw * 2 + 1.5, Math.abs(s.to[1] - s.from[1]) + s.hw * 2 + 1.5)),
  rect("hiero-wall", HIERO_WALL.position[0], HIERO_WALL.position[1], 2, HIERO_WALL.width + 1),
  // The mesas' stair + landing; the Sun Arch's legs; the mine mouth.
  rect("mesa-stair", MESA_STAIR.flights[0].from[0], (MESA_STAIR.flights[0].from[1] + MESA_STAIR.flights[1].to[1]) / 2, 6.5, 23),
  ...ARCH_LEGS.map((p, i) => circ(`arch-leg-${i}`, p, 3.2)),
  circ("mine-mouth", MINE_MOUTH.position, 4),
  // Sundial Rise (the drum + its ramp).
  circ("sundial", SUNDIAL_RISE.c, SUNDIAL_RISE.r + SUNDIAL_RISE.rampW + 1),
  // The Dune Ship + the Sand Sphinx; the crystals; the fossil skeleton.
  rect("dune-ship", DUNE_SHIP.position[0], DUNE_SHIP.position[1], 7, DUNE_SHIP.length, DUNE_SHIP.rotationY),
  circ("sand-sphinx", SAND_SPHINX.position, 6),
  ...CRYSTALS.map(([x, z, , r], i) => circ(`crystal-${i}`, [x, z], r + 0.8)),
  rect("fossil", FOSSIL.c[0], FOSSIL.c[1], FOSSIL.length + 2, 9, FOSSIL.yaw),
  // Camels, signposts, the quicksand warning signs, the chest spots.
  ...CAMELS.map(([x, z], i) => circ(`camel-${i}`, [x, z], 2)),
  ...DESERT_SIGNPOSTS.map((s) => circ(`signpost-${s.id}`, s.p, 0.6)),
  ...QS_SIGNS.map(([x, z], i) => circ(`qs-sign-${i}`, [x, z], 0.6)),
  ...DESERT_CHEST_SPOTS.map((p, i) => circ(`chest-${i}`, p, 1.6)),
  rect("boardwalk", (BOARDWALK.from[0] + BOARDWALK.to[0]) / 2, BOARDWALK.from[1], BOARDWALK.to[0] - BOARDWALK.from[0] + 2, BOARDWALK.hw * 2 + 1.5),
];
export function nearestFootprint(x, z) {
  let best = { e: Infinity, f: null };
  for (const f of DESERT_FOOTPRINTS) {
    const r = f.shape === "circle" ? f.r : Math.hypot(f.w, f.d) / 2;
    if (Math.abs(x - f.x) > r + 6 || Math.abs(z - f.z) > r + 6) continue;
    const e = footprintDist(f, x, z);
    if (e < best.e) best = { e, f };
  }
  return best;
}
/** Distance to the mine-cart rails (keep scatter off them). */
export function railDist(x, z) {
  let d = Infinity;
  for (let i = 0; i < MINE_RAILS.length - 1; i++) {
    const [ax, az] = MINE_RAILS[i], [bx, bz] = MINE_RAILS[i + 1];
    d = Math.min(d, segDistT(x, z, ax, az, bx, bz).d);
  }
  return d;
}

/** "Can something stand here?" — firm, open sand away from everything walkable. */
export function clearAt(x, z, o = {}) {
  if (outsideRim(x, z) > (o.rim ?? -3)) return false;
  if (o.slope !== undefined && slopeAt(x, z) > o.slope) return false;
  const q = quicksandAt(x, z);
  if (q && q.sdf < (o.pit ?? 2.5)) return false;
  if (onPad("oasis", x, z, -2) && poolEdgeDist(x, z) < (o.pool ?? 1)) return false;
  if (o.path !== undefined) {
    const nt = nearestTrail(x, z);
    if (nt && nt.e < o.path) return false;
  }
  if (o.pad !== undefined) {
    const pd = nearestPad(x, z);
    if (pd.e < o.pad && pd.id !== "flats" && pd.id !== "pyramid" && pd.id !== "oasis") return false;
  }
  if (o.foot !== undefined && nearestFootprint(x, z).e < o.foot) return false;
  for (const s of DESERT_SPOTS) if (Math.hypot(x - s.center[0], z - s.center[1]) < s.radius + (o.spot ?? 3)) return false;
  for (const t of TEMPLE_STONES) if (Math.hypot(x - t.position[0], z - t.position[1]) < TEMPLE_STONE_CLEAR + (t.tall ? 0.6 : 0)) return false;
  if (Math.hypot(x - TEMPLE_WALL.position[0], z - TEMPLE_WALL.position[1]) < TEMPLE_WALL.width / 2 + 1.5) return false;
  if (Math.hypot(x - TEMPLE_DASH.position[0], z - TEMPLE_DASH.position[1]) < 2.6) return false;
  if (railDist(x, z) < 1.8) return false;
  const st = structureTopAt(x, z);
  if (st !== null && st > terrainHeight(x, z) + 0.05) return false;
  return true;
}
/** On a mesa / butte top (or its cliff)? */
function onMesa(x, z, grow = 0) {
  for (const m of [...getMesas(), ...getButtes()]) {
    const ax = Math.abs(x - m.c[0]) / (m.rx + m.band + grow), az = Math.abs(z - m.c[1]) / (m.rz + m.band + grow);
    if (Math.pow(Math.pow(ax, m.p) + Math.pow(az, m.p), 1 / m.p) <= 1) return m;
  }
  return null;
}
/** The oasis's green (0..1): the basin floor round the pool. */
export function oasisGreen(x, z) {
  if (!onPad("oasis", x, z, 1.5)) return 0;
  return smoothstep(9, 1.5, poolEdgeDist(x, z));
}

// ---------------------------------------------------------------------------
// THE SCATTER
// ---------------------------------------------------------------------------
let _props = null;
export function getDesertProps() {
  if (_props) return _props;
  const R = rng(20261108);
  const out = {
    saguaro: [], barrel: [], pear: [], palm: [], shrub: [], tuft: [], boulder: [], scree: [], bones: [], tumble: [],
    reeds: [], lily: [], pots: [],
  };
  const placed = [];
  const tooClose = (x, z, d) => placed.some((t) => Math.abs(t.x - x) < d && Math.abs(t.z - z) < d && Math.hypot(t.x - x, t.z - z) < d);
  const put = (kind, x, z, s, extra = {}) => {
    const t = { x, z, y: terrainHeight(x, z), s, rot: R() * TAU, tint: R(), kind, ...extra };
    out[kind].push(t);
    if (!extra.noBlock) placed.push(t);
    return t;
  };
  const B = DESERT_BOUNDARY;
  const inTown = (x, z) => onPad("town", x, z, -3) || onPad("arrival", x, z, -3);

  // --- SAGUAROS: tall arms in loose stands across the open floor. ---------
  for (let x = -B.halfW; x <= B.halfW; x += 5) {
    for (let z = -B.halfD; z <= B.halfD; z += 5) {
      const jx = x + (R() - 0.5) * 4.6, jz = z + (R() - 0.5) * 4.6;
      const dunes = duneFieldAt(jx, jz).m;
      const stand = smoothstep(0.46, 0.64, fbm(jx / 44 + 3, jz / 44 - 7, 3, 41));
      const p = (0.07 + stand * 0.45) * (1 - dunes * 0.8) * (inTown(jx, jz) ? 0.1 : 1);
      if (R() > p) continue;
      if (!clearAt(jx, jz, { path: 2.6, pad: 2.5, foot: 2.6, slope: 0.45 })) continue;
      if (onMesa(jx, jz, 2) || tooClose(jx, jz, 5.5)) continue;
      put("saguaro", jx, jz, 0.7 + R() * 0.5, { arms: Math.floor(R() * 4) });
    }
  }
  // --- BARREL + PRICKLY PEAR clumps: at the feet of saguaros + rocks. -----
  for (let x = -B.halfW; x <= B.halfW; x += 3) {
    for (let z = -B.halfD; z <= B.halfD; z += 3) {
      const jx = x + (R() - 0.5) * 2.8, jz = z + (R() - 0.5) * 2.8;
      const dunes = duneFieldAt(jx, jz).m;
      const clump = smoothstep(0.5, 0.7, fbm(jx / 26 - 2, jz / 26 + 5, 2, 42));
      const p = (0.02 + clump * 0.22) * (1 - dunes * 0.75) * (inTown(jx, jz) ? 0.25 : 1);
      if (R() > p) continue;
      if (!clearAt(jx, jz, { path: 1.4, pad: 1.4, foot: 1.6, slope: 0.55 })) continue;
      if (onMesa(jx, jz, 1) || tooClose(jx, jz, 2.2)) continue;
      put(R() < 0.55 ? "pear" : "barrel", jx, jz, 0.7 + R() * 0.6);
    }
  }
  // --- PALMS: thick round the oasis pool, planters in the town + arrival. -
  for (let x = OASIS.c[0] - OASIS.rx; x <= OASIS.c[0] + OASIS.rx; x += 3.2) {
    for (let z = OASIS.c[1] - OASIS.rz; z <= OASIS.c[1] + OASIS.rz; z += 3.2) {
      const jx = x + (R() - 0.5) * 2.8, jz = z + (R() - 0.5) * 2.8;
      const g = oasisGreen(jx, jz);
      if (R() > g * 0.95 + 0.12 * Number(onPad("oasis", jx, jz, 2))) continue;
      if (!clearAt(jx, jz, { path: 1.6, foot: 1.6, pool: 0.6, spot: 2.5 })) continue;
      if (tooClose(jx, jz, 3.2)) continue;
      // Lean out over the water.
      const a = Math.atan2(jz - OASIS_POOL.c[1], jx - OASIS_POOL.c[0]);
      put("palm", jx, jz, 0.85 + R() * 0.4, { rot: -a + Math.PI + (R() - 0.5) * 0.8 });
    }
  }
  const PALM_SPOTS = [
    [-5.2, 100.5], [5.4, 100.5], [-15.5, 112], [15, 108.5], [-4.6, 76], [4.6, 76], [-4.6, 60], [-4.6, 44], [4.6, 44],
    [-21, 76], [20, 62], [-36, 54], [34, 72], [-8.5, 18], [8.5, 18], [-17, 2], [17, 2], [-62, 92], [44, 18],
    [-58, -2], [-112, -8], [-116, 22], [-46, 30], [-26, 30], [20, 28], [124, 78], [-6.5, -103], [6.5, -103],
    [-14.5, -94], [14.5, -94], [-10, 106], [11, 96], [-31, 94.5], [32, 88], [-29, 47], [-12, 46.5], [31, 60], [-38, 80],
    [72, 34], [118, 22], [-130, -20], [-60, 52], [44, 64], [86, 98],
  ];
  for (const [x, z] of PALM_SPOTS) {
    if (!clearAt(x, z, { path: 0.4, foot: 0.6, spot: 0.4, pad: -100 })) continue;
    if (tooClose(x, z, 2.5)) continue;
    put("palm", x, z, 0.8 + R() * 0.35);
  }
  // --- REEDS + LILIES in + round the oasis pool. --------------------------
  for (let a = 0; a < 70; a++) {
    const ang = (a / 70) * TAU + R() * 0.08;
    const x = OASIS_POOL.c[0] + Math.cos(ang) * (OASIS_POOL.rx + (R() - 0.6) * 2.4);
    const z = OASIS_POOL.c[1] + Math.sin(ang) * (OASIS_POOL.rz + (R() - 0.6) * 2.4);
    const e = poolEdgeDist(x, z);
    if (e < -1.4 || e > 0.9) continue;
    if (R() < 0.55 && clearAt(x, z, { pool: -2, foot: 0.8, spot: 0.5 })) put("reeds", x, z, 0.7 + R() * 0.5, { noBlock: true });
  }
  for (let i = 0; i < 26; i++) {
    const x = OASIS_POOL.c[0] + (R() - 0.5) * OASIS_POOL.rx * 1.6, z = OASIS_POOL.c[1] + (R() - 0.5) * OASIS_POOL.rz * 1.6;
    if (poolEdgeDist(x, z) > -1.5) continue;
    out.lily.push({ x, z, y: 0, s: 0.6 + R() * 0.6, rot: R() * TAU, tint: R(), flower: R() < 0.35 });
  }
  // --- DRY SHRUBS + GRASS TUFTS: everywhere off the dunes. -----------------
  for (let x = -B.halfW; x <= B.halfW; x += 2.4) {
    for (let z = -B.halfD; z <= B.halfD; z += 2.4) {
      const jx = x + (R() - 0.5) * 2.2, jz = z + (R() - 0.5) * 2.2;
      const dunes = duneFieldAt(jx, jz).m;
      const scrub = smoothstep(0.4, 0.66, fbm(jx / 30 + 9, jz / 30 - 3, 2, 43));
      const g = oasisGreen(jx, jz);
      const pS = (0.02 + scrub * 0.13) * (1 - dunes * 0.8) + g * 0.12;
      const pT = (0.03 + scrub * 0.2) * (1 - dunes * 0.6) + g * 0.5;
      const r = R();
      if (r < pS) {
        if (clearAt(jx, jz, { path: 0.9, pad: 0.6, foot: 1, slope: 0.6, spot: 1.5 }) && !onMesa(jx, jz, 0.5)) put("shrub", jx, jz, 0.6 + R() * 0.7, { noBlock: true });
      } else if (r < pS + pT) {
        if (clearAt(jx, jz, { path: 0.5, pad: 0.4, foot: 0.6, slope: 0.7, spot: 0.8, pit: 1.2 })) put("tuft", jx, jz, 0.6 + R() * 0.7, { noBlock: true, green: g });
      }
    }
  }
  // --- BOULDERS + SCREE: at the feet of the cliffs, mesas + buttes. -------
  for (let x = -B.halfW - 4; x <= B.halfW + 4; x += 2.6) {
    for (let z = -B.halfD - 4; z <= B.halfD + 4; z += 2.6) {
      const jx = x + (R() - 0.5) * 2.4, jz = z + (R() - 0.5) * 2.4;
      const rim = outsideRim(jx, jz);
      const nearRim = smoothstep(-16, -6, rim) * (1 - smoothstep(-2, 2, rim));
      const m = onMesa(jx, jz, 5);
      const footMesa = m && !onMesa(jx, jz, 0.2) ? 1 : 0;
      const loose = smoothstep(0.62, 0.78, vnoise(jx / 14, jz / 14, 44)) * 0.08;
      const p = Math.max(nearRim * 0.22, footMesa * 0.3, loose);
      if (R() > p) continue;
      if (!clearAt(jx, jz, { path: 1.2, pad: 1, foot: 1.2, slope: 1.2, rim: 2, spot: 1.5 })) continue;
      if (R() < 0.35 && !tooClose(jx, jz, 2.6)) put("boulder", jx, jz, 0.6 + R() * 1.2, { rx: (R() - 0.5) * 0.4 });
      else put("scree", jx, jz, 0.3 + R() * 0.5, { noBlock: true });
    }
  }
  // --- BONES: a few bleached skulls + ribs in the dunes and the flats. ----
  for (let i = 0; i < 60 && out.bones.length < 16; i++) {
    const x = (R() - 0.5) * 2 * (B.halfW - 10), z = (R() - 0.5) * 2 * (B.halfD - 10);
    if (duneFieldAt(x, z).m < 0.3 && !onPad("flats", x, z, -6)) continue;
    if (!clearAt(x, z, { path: 1.5, pad: 1, foot: 1.5, slope: 0.4, spot: 2 })) continue;
    put("bones", x, z, 0.8 + R() * 0.5, { v: Math.floor(R() * 3), noBlock: true });
  }
  // --- TUMBLEWEEDS (resting; a few more roll about — game/desert). --------
  for (let i = 0; i < 80 && out.tumble.length < 22; i++) {
    const x = (R() - 0.5) * 2 * (B.halfW - 12), z = (R() - 0.5) * 2 * (B.halfD - 12);
    if (!clearAt(x, z, { path: 0.8, pad: 0.5, foot: 1, slope: 0.5, spot: 1 })) continue;
    put("tumble", x, z, 0.6 + R() * 0.5, { noBlock: true });
  }
  // --- POTS + URNS round the town + the temple. ---------------------------
  const POTS = [
    [-4.4, 88.5], [4.4, 88.2], [-17.6, 79.4], [17.8, 76.5], [-16.8, 63.5], [-4.2, 30], [4.3, 31], [9, 46.2], [-9, 49],
    [-12.8, -110], [12.8, -110], [-14.5, -108.6], [14.6, -108.4], [-62, 18.5], [-28.6, 64], [21.8, 57.8], [-3.5, -101], [3.5, -101],
  ];
  for (const [x, z] of POTS) if (clearAt(x, z, { path: 0.2, pad: -100, foot: 0.2, spot: 0.3 })) put("pots", x, z, 0.8 + R() * 0.5, { v: Math.floor(R() * 3) });

  _props = out;
  return _props;
}

/** Trunk radii (for colliders) and heights (for camera checks) per kind at s = 1. */
export const DESERT_TRUNK_R = { saguaro: 0.42, barrel: 0.48, pear: 0.62, palm: 0.32, boulder: 0.85 };
export const DESERT_PROP_H = { saguaro: 6.2, barrel: 0.9, pear: 1.4, palm: 9, boulder: 1.4 };
export { D_SLIDE_SLOPE, TOWN };
