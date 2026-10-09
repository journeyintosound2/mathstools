/**
 * NUMBER ISLAND — the SCATTER: every palm, tree, fir, bush, fern, flower,
 * rock, shell and log, plus the FOOTPRINTS of the buildings + set-pieces.
 * Pure + deterministic (seeded) so the renderer, the colliders and the
 * checks all see the same island.
 *
 * Biomes (read from the terrain itself):
 *   · the BEACHES: leaning coconut palms in loose groves, driftwood, shells,
 *     starfish and the odd boulder at the waterline
 *   · EMERALD LAGOON: a little jungle — broadleaf trees, palms, ferns, big
 *     leaves and reeds round the water and under Emerald Bluff
 *   · the MEADOWS: copses of round oaks + gums, wildflower drifts, bushes
 *     along the paths; the village keeps a few shade trees
 *   · FROSTY PEAK: snowy firs + spruces, pines on its lower slopes, snowy rocks
 *   · EMBER PEAK + the ash fields: dark basalt boulders, little else
 * Nothing on a path, a level pad, a building, the water or a gate.
 */
import { clamp, smoothstep, fbm, vnoise, rng, segDistT } from "../terrainKit.js";
import {
  ISLAND_SPAWN, ISLAND_ARCH, ACHIEVEMENT_WALL, ISLAND_MAP_BOARD, ISLAND_WELCOME, ISLAND_JETTY, ISLAND_SAILBOAT,
  PLAZA, PLAZA_FOUNTAIN, MISSION_BOARD_POS, TROPHY_STAND_POS, PIP_SPOT, FERN_SPOT, ALBY_SPOT, MILLS_SPOT,
  PIP_THERMOMETER, GATES, SCHOOLHOUSE, SCHOOL_FENCE, LIGHTHOUSE, ROPE_BRIDGE, FARM_BARN, FARM_WINDMILL, ISLAND_FIELDS,
  ISLAND_HAY_BALES, COVE_PIER, BEACH_HUTS, ROWBOATS, ISLAND_SIGNPOSTS, ISLAND_CHEST_SPOTS, COTTAGES, LAGOON,
  EMERALD_BLUFF, EMERALD_FALLS, EMBER_PEAK, FROSTY_PEAK, FERN_ASH, ISLET,
} from "./islandLayout.js";
import {
  terrainHeight, slopeAt, nearestPath, nearestPad, coastSD, lagoonEdgeDist, snowCover, isLavaAt, lavaStreamDist,
  plazaOct, SEA_Y,
} from "./islandTerrain.js";

const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// FOOTPRINTS — buildings + set-pieces: rect { x, z, w, d, rot } or circle.
// ---------------------------------------------------------------------------
const rect = (id, x, z, w, d, rot, h) => ({ id, shape: "rect", x, z, w, d, rot: rot || 0, h });
const circ = (id, x, z, r, h) => ({ id, shape: "circle", x, z, r, h });
const W = ACHIEVEMENT_WALL;
export const ISLAND_FOOTPRINTS = [
  circ("spawn", ISLAND_SPAWN.x, ISLAND_SPAWN.z, 3, 0),
  circ("arch-w", ISLAND_ARCH.position[0] - ISLAND_ARCH.width / 2, ISLAND_ARCH.position[1], 1.2, ISLAND_ARCH.height),
  circ("arch-e", ISLAND_ARCH.position[0] + ISLAND_ARCH.width / 2, ISLAND_ARCH.position[1], 1.2, ISLAND_ARCH.height),
  rect("achievement-wall", W.position[0], W.position[1], W.length + 2.4, 2.6, W.rotationY, W.height + 1.6),
  // The viewing corridor in front of it (the first-person look camera stands up to ~11 m back).
  rect("achievement-view", W.position[0] + Math.sin(W.rotationY) * 6.5, W.position[1] + Math.cos(W.rotationY) * 6.5, W.length + 1, 11, W.rotationY, 0),
  rect("map-board", ISLAND_MAP_BOARD.position[0], ISLAND_MAP_BOARD.position[1], 6.2, 1.4, ISLAND_MAP_BOARD.rotationY, 4),
  circ("welcome", ISLAND_WELCOME.position[0], ISLAND_WELCOME.position[1], 1.2, 2.5),
  circ("mills", MILLS_SPOT.position[0], MILLS_SPOT.position[1], 1.6, 2.5),
  circ("plaza", PLAZA.center[0], PLAZA.center[1], PLAZA.apothem + PLAZA.stairs.steps * PLAZA.stairs.depth + 2, 3),
  circ("pip", PIP_SPOT.position[0], PIP_SPOT.position[1], 2.2, 2.5),
  circ("fern", FERN_SPOT.position[0], FERN_SPOT.position[1], 2.2, 2.5),
  circ("alby", ALBY_SPOT.position[0], ALBY_SPOT.position[1], 1.8, 2.5),
  circ("thermometer", PIP_THERMOMETER.position[0], PIP_THERMOMETER.position[1], 3.6, 7),
  ...Object.values(GATES).map((g) => circ(`gate-${g.id}`, g.position[0], g.position[1], 5, 7)),
  ...Object.values(GATES).map((g) => circ(`gate-arrive-${g.id}`, g.arrive[0], g.arrive[1], 2, 0)),
  rect("school", SCHOOLHOUSE.x, SCHOOLHOUSE.z, SCHOOLHOUSE.w + 2, SCHOOLHOUSE.d + 2, SCHOOLHOUSE.rotationY, 12),
  rect("school-fence", 0, SCHOOL_FENCE.z, SCHOOL_FENCE.x1 - SCHOOL_FENCE.x0, 1.2, 0, 1.2),
  rect("school-yard", 0, (SCHOOL_FENCE.z + SCHOOLHOUSE.z + SCHOOLHOUSE.d / 2) / 2, 26, 8, 0, 2),
  circ("lighthouse", LIGHTHOUSE.position[0], LIGHTHOUSE.position[1], LIGHTHOUSE.radius + 1.2, LIGHTHOUSE.height),
  rect("barn", FARM_BARN.x, FARM_BARN.z, FARM_BARN.w + 1, FARM_BARN.d + 1, FARM_BARN.rotationY, 9),
  circ("windmill", FARM_WINDMILL.position[0], FARM_WINDMILL.position[1], 2.6, FARM_WINDMILL.height + 5),
  ...ISLAND_HAY_BALES.map(([x, z], i) => circ(`bale-${i}`, x, z, 1.3, 1.5)),
  ...BEACH_HUTS.map(([x, z, r], i) => rect(`hut-${i}`, x, z, 3.6, 3.2, r, 4)),
  ...ROWBOATS.map(([x, z, r], i) => rect(`rowboat-${i}`, x, z, 1.6, 3.6, r, 1)),
  rect("sailboat", ISLAND_SAILBOAT.position[0], ISLAND_SAILBOAT.position[1], 3, 8, ISLAND_SAILBOAT.rotationY, 10),
  ...COTTAGES.map((c) => rect(`cottage-${c.id}`, c.x, c.z, c.w + 1.5, c.d + 1.5, c.rotationY, 8)),
  circ("board", MISSION_BOARD_POS[0], MISSION_BOARD_POS[1], 2, 3),
  circ("trophy", TROPHY_STAND_POS[0], TROPHY_STAND_POS[1], 2, 3),
  circ("fountain", PLAZA_FOUNTAIN.position[0], PLAZA_FOUNTAIN.position[1], PLAZA_FOUNTAIN.radius + 0.5, 5),
  circ("falls", EMERALD_FALLS.foot[0], EMERALD_FALLS.foot[1], 3, 10),
  ...ISLAND_SIGNPOSTS.map((s) => circ(`signpost-${s.id}`, s.at[0], s.at[1], 0.9, 2.8)),
  ...ISLAND_CHEST_SPOTS.map((p, i) => circ(`chest-${i}`, p[0], p[1], 1.8, 0)),
];
/** Metres outside a footprint (− = inside). */
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
  for (const f of ISLAND_FOOTPRINTS) {
    if (Math.abs(x - f.x) > 32 || Math.abs(z - f.z) > 32) continue;
    const e = footprintDist(f, x, z);
    if (e < best.e) best = { e, f };
  }
  return best;
}
export function fieldQ(f, x, z) {
  return Math.hypot((x - f.c[0]) / f.rx, (z - f.c[1]) / f.rz);
}
export function inIslandField(x, z, grow = 0) {
  for (const f of ISLAND_FIELDS) {
    if (Math.hypot((x - f.c[0]) / (f.rx + grow), (z - f.c[1]) / (f.rz + grow)) < 1) return f;
  }
  return null;
}
/** Distance to the line of the jetty / pier / rope bridge (keep scatter off them). */
function deckLineDist(x, z) {
  let d = Infinity;
  for (const s of [ISLAND_JETTY, COVE_PIER, ROPE_BRIDGE]) d = Math.min(d, segDistT(x, z, s.from[0], s.from[1], s.to[0], s.to[1]).d - s.halfWidth);
  return d;
}

/** "Can something stand here?" — dry land, off paths/pads/buildings/decks. */
export function clearAt(x, z, o) {
  const h = terrainHeight(x, z);
  if (h < SEA_Y + (o.dry ?? 0.15)) return false;
  if (o.slope !== undefined && slopeAt(x, z) > o.slope) return false;
  if (o.path !== undefined) {
    const np = nearestPath(x, z);
    if (np && np.e < o.path) return false;
  }
  if (o.pad !== undefined && nearestPad(x, z).e < o.pad) return false;
  if (o.foot !== undefined && nearestFootprint(x, z).e < o.foot) return false;
  if (o.lagoon !== undefined && lagoonEdgeDist(x, z) < o.lagoon) return false;
  if (o.field !== undefined && inIslandField(x, z, o.field)) return false;
  if (plazaOct(x, z) < PLAZA.apothem + 4.5) return false;
  if (deckLineDist(x, z) < 1.5) return false;
  if (isLavaAt(x, z) || lavaStreamDist(x, z) < 2) return false;
  return true;
}

const lagoonD = (x, z) => Math.hypot(x - LAGOON.c[0], z - LAGOON.c[1]);
/** The little jungle round Emerald Lagoon + under the bluff (0..1). */
export function jungleness(x, z) {
  const d = Math.min(lagoonD(x, z), Math.hypot(x - EMERALD_BLUFF.c[0], z - EMERALD_BLUFF.c[1]) + 3);
  return smoothstep(34, 18, d);
}
/** Ember Peak's volcanic ground (0..1). */
export function volcanicness(x, z) {
  const d = Math.hypot(x - EMBER_PEAK.c[0], z - EMBER_PEAK.c[1]);
  const ash = Math.hypot((x - FERN_ASH.c[0]) / FERN_ASH.rx, (z - FERN_ASH.c[1]) / FERN_ASH.rz);
  return Math.max(smoothstep(EMBER_PEAK.R + 2, EMBER_PEAK.R * 0.62, d), smoothstep(1.05, 0.55, ash) * 0.85);
}

// ---------------------------------------------------------------------------
// THE SCATTER
// ---------------------------------------------------------------------------
let _props = null;
export function getIslandProps() {
  if (_props) return _props;
  const R = rng(20261009);
  const trees = { palm: [], broad: [], oak: [], gum: [], fir: [], spruce: [], pine: [], round: [] };
  const all = [];
  const tooClose = (x, z, d) => all.some((t) => Math.abs(t.x - x) < d && Math.abs(t.z - z) < d && Math.hypot(t.x - x, t.z - z) < d);
  const put = (kind, x, z, s, extra = {}) => {
    const t = { x, z, y: terrainHeight(x, z), s, rot: R() * TAU, tint: R(), kind, ...extra };
    trees[kind].push(t);
    all.push(t);
    return t;
  };
  const treeOK = (x, z, extra = {}) => clearAt(x, z, { path: 2.6, pad: 2.5, foot: 2.5, lagoon: 1.6, field: 1, slope: 0.85, dry: 0.5, ...extra });

  // --- COCONUT PALMS: loose groves along the beaches + round the lagoon. ---
  for (let x = -128; x <= 128; x += 3.2) {
    for (let z = -118; z <= 118; z += 3.2) {
      const jx = x + (R() - 0.5) * 3, jz = z + (R() - 0.5) * 3;
      const sd = coastSD(jx, jz);
      if (sd > -2.5 || sd < -26) continue;
      const h = terrainHeight(jx, jz);
      if (h < 0.55) continue;
      // Not on the cold north-west (Frosty Peak) or the volcano.
      if (snowCover(jx, jz, h) > 0.05 || volcanicness(jx, jz) > 0.3) continue;
      const grove = smoothstep(0.42, 0.62, fbm(jx / 30 + 4, jz / 30 - 6, 3, 61));
      const beachBand = smoothstep(-24, -8, sd) * smoothstep(-1.5, -5, sd);
      const lag = jungleness(jx, jz) * 0.5;
      const p = Math.max(grove * beachBand * 0.85, lag * smoothstep(0, 4, lagoonEdgeDist(jx, jz)), 0.02);
      if (R() > p) continue;
      if (!treeOK(jx, jz, { lagoon: 1.2, slope: 0.7 })) continue;
      if (tooClose(jx, jz, 3.9)) continue;
      // Palms lean out toward the sea (their facing = seaward).
      const a = Math.atan2(jz, jx);
      // (The palm trunk leans toward its local +x; rotation.y = −a turns +x seaward.)
      put("palm", jx, jz, 0.75 + R() * 0.45, { rot: -a + (R() - 0.5) * 0.9 });
    }
  }
  // --- THE LITTLE JUNGLE: broadleaf trees round the lagoon + the bluff. ---
  for (let x = -92; x <= -14; x += 4) {
    for (let z = 22; z <= 96; z += 4) {
      const jx = x + (R() - 0.5) * 3.4, jz = z + (R() - 0.5) * 3.4;
      const j = jungleness(jx, jz);
      if (R() > Math.min(1, j * 1.15)) continue;
      if (!treeOK(jx, jz, { lagoon: 2.2, path: 3 })) continue;
      if (tooClose(jx, jz, 4.2)) continue;
      put("broad", jx, jz, 0.62 + R() * 0.35);
    }
  }
  // --- FROSTY PEAK: snowy firs + spruces in the snow, pines below it. ---
  for (let x = -112; x <= -18; x += 3.6) {
    for (let z = -110; z <= -10; z += 3.6) {
      const jx = x + (R() - 0.5) * 3.2, jz = z + (R() - 0.5) * 3.2;
      const fd = Math.hypot(jx - FROSTY_PEAK.c[0], jz - FROSTY_PEAK.c[1]);
      if (fd > 58) continue;
      const h = terrainHeight(jx, jz);
      const snow = snowCover(jx, jz, h);
      const woods = smoothstep(0.4, 0.58, fbm(jx / 26 - 3, jz / 26 + 8, 3, 62));
      const p = snow > 0.3 ? 0.36 + woods * 0.45 : smoothstep(58, 36, fd) * (0.22 + woods * 0.6);
      if (R() > p) continue;
      if (!treeOK(jx, jz, { slope: 1.2, path: 2.4 })) continue;
      if (Math.hypot(jx - FROSTY_PEAK.summit[0], jz - FROSTY_PEAK.summit[1]) < 7) continue;
      if (tooClose(jx, jz, 3.8)) continue;
      const kind = snow > 0.3 ? (R() < 0.62 ? "fir" : "spruce") : "pine";
      put(kind, jx, jz, (kind === "pine" ? 0.75 : 0.62) + R() * 0.35, { snow });
    }
  }
  // --- MEADOW COPSES: round oaks + a few gums; lone shade trees. ---
  for (let x = -110; x <= 110; x += 4.2) {
    for (let z = -100; z <= 100; z += 4.2) {
      const jx = x + (R() - 0.5) * 3.6, jz = z + (R() - 0.5) * 3.6;
      const sd = coastSD(jx, jz);
      if (sd > -14) continue;
      if (jungleness(jx, jz) > 0.25 || volcanicness(jx, jz) > 0.25) continue;
      if (Math.hypot(jx - FROSTY_PEAK.c[0], jz - FROSTY_PEAK.c[1]) < 50) continue;
      // Keep the village + Main Street mostly open (a few shade trees only).
      const village = Math.abs(jx) < 22 && jz > -12 && jz < 72;
      const copse = smoothstep(0.47, 0.62, fbm(jx / 38 + 2, jz / 38 - 5, 3, 63));
      const p = village ? 0.006 : Math.max(copse * 1.0, 0.05);
      if (R() > p) continue;
      if (!treeOK(jx, jz, { path: 3.2, pad: 3 })) continue;
      if (tooClose(jx, jz, copse > 0.3 ? 5 : 7)) continue;
      put(R() < 0.72 ? "oak" : "gum", jx, jz, 0.7 + R() * 0.4);
    }
  }
  // --- THE NORTH WOODS: a mixed wood wrapping Schoolhouse Hill's back and
  //     flanks down to the north shore (between Frosty Peak and Ember Peak),
  //     so the school sits in a green bowl rather than on bare grass. ---
  for (let x = -40; x <= 44; x += 3.8) {
    for (let z = -104; z <= -40; z += 3.8) {
      const jx = x + (R() - 0.5) * 3.2, jz = z + (R() - 0.5) * 3.2;
      if (coastSD(jx, jz) > -4) continue;
      if (volcanicness(jx, jz) > 0.2 || snowCover(jx, jz, terrainHeight(jx, jz)) > 0.05) continue;
      // Behind + beside the school, never in front of its yard gate.
      const ahead = jz > SCHOOL_FENCE.z - 2 && Math.abs(jx) < 26;
      if (ahead) continue;
      const wood = smoothstep(0.38, 0.56, fbm(jx / 22 + 7, jz / 22 - 2, 3, 64));
      const p = 0.26 + wood * 0.6;
      if (R() > p) continue;
      if (!treeOK(jx, jz, { path: 3, pad: 2.5, foot: 3 })) continue;
      if (tooClose(jx, jz, 4.0)) continue;
      const k = R();
      put(k < 0.5 ? "oak" : k < 0.8 ? "gum" : "pine", jx, jz, 0.72 + R() * 0.38);
    }
  }
  // --- Hand-placed shade trees: the village, the school, the farm, the green. ---
  const manual = [
    ["round", -9, 61, 0.85], ["round", 9, 61.5, 0.85], ["oak", -21, 46, 0.95], ["oak", 22, 40, 0.9], ["round", -6.5, 26.5, 0.7],
    ["round", 6.5, 26.5, 0.7], ["oak", -17, -46, 1.0], ["oak", 17.5, -50, 1.05], ["oak", -9, -72, 0.95], ["oak", 12, -74, 1.0],
    ["gum", -94, 4, 0.95], ["oak", -78, -20, 1.0], ["oak", -26, 82, 0.9], ["palm", 24, 84, 0.95], ["palm", -20, 88, 0.9],
    ["oak", 40, -6, 0.95], ["oak", -40, -6, 0.95],
  ];
  for (const [kind, x, z, s] of manual) if (treeOK(x, z, { path: 2.2, pad: 0.5, foot: 1.8 })) put(kind, x, z, s);

  // --- UNDERGROWTH -------------------------------------------------------
  const bushes = [], flowers = [], ferns = [], leaves = [], rocks = [], basalt = [], shells = [], logs = [], reeds = [], snowRocks = [];
  for (let x = -126; x <= 126; x += 2.6) {
    for (let z = -116; z <= 116; z += 2.6) {
      const jx = x + (R() - 0.5) * 2.4, jz = z + (R() - 0.5) * 2.4;
      const h = terrainHeight(jx, jz);
      if (h < SEA_Y + 0.25) continue;
      const sd = coastSD(jx, jz);
      const snow = snowCover(jx, jz, h);
      const vol = volcanicness(jx, jz);
      const jun = jungleness(jx, jz);
      const np = nearestPath(jx, jz);
      const pe = np ? np.e : 99;
      const sand = h < 1.25 && sd > -11;
      // Ferns + big leaves in the little jungle.
      if (jun > 0.2 && R() < jun * 0.5) {
        if (clearAt(jx, jz, { path: 0.8, pad: 0.6, foot: 1, lagoon: 0.6, slope: 1.1, dry: 0.3 })) {
          (R() < 0.7 ? ferns : leaves).push({ x: jx, z: jz, y: terrainHeight(jx, jz), s: 0.7 + R() * 0.6, rot: R() * TAU, tint: R() });
        }
      }
      // Bushes: path verges + copse edges (not on sand/snow/ash).
      if (!sand && snow < 0.3 && vol < 0.4) {
        const verge = pe > 1.4 && pe < 3.6 ? 0.07 : 0;
        const copseEdge = smoothstep(0.52, 0.64, fbm(jx / 38 + 2, jz / 38 - 5, 3, 63)) * 0.16;
        if (R() < Math.max(verge, copseEdge, jun * 0.12) && clearAt(jx, jz, { path: 1.2, pad: 1.2, foot: 1.3, lagoon: 1, field: 0.8, slope: 0.8, dry: 0.4 })) {
          bushes.push({ x: jx, z: jz, y: terrainHeight(jx, jz), s: 0.7 + R() * 0.6, rot: R() * TAU, tint: R() });
        }
        // Wildflower drifts in the meadows (dense in noise patches).
        const meadow = smoothstep(0.56, 0.68, fbm(jx / 22 - 5, jz / 22 + 9, 2, 64));
        if (R() < meadow * 0.8 + 0.035 && sd < -12) {
          const fx = jx + (R() - 0.5) * 1.2, fz = jz + (R() - 0.5) * 1.2;
          if (clearAt(fx, fz, { path: 0.4, pad: 0.4, foot: 0.8, lagoon: 0.8, field: 0.4, slope: 0.8, dry: 0.4 })) {
            flowers.push({ x: fx, z: fz, y: terrainHeight(fx, fz), s: 0.8 + R() * 0.6, rot: R() * TAU, tint: R(), v: Math.floor(R() * 6) });
          }
        }
      }
      // Rocks: boulders at the waterline, tors on the high ground, snowy
      // rocks on Frosty Peak, dark basalt on Ember Peak + in the ash.
      const shore = sd > -4 && sd < 1.5 ? 0.06 : 0;
      const high = smoothstep(9, 16, h) * smoothstep(0.62, 0.74, vnoise(jx / 12, jz / 12, 65)) * 0.4;
      const pr = Math.max(shore, high, 0.004);
      if (vol > 0.35) {
        if (R() < 0.05 + vol * 0.07 && clearAt(jx, jz, { path: 1.2, pad: 1.2, foot: 1.5, slope: 1.4, dry: 0.3 })) {
          basalt.push({ x: jx, z: jz, y: terrainHeight(jx, jz), s: 0.4 + R() * 1.1, rot: R() * TAU, tint: R(), rx: (R() - 0.5) * 0.5, collide: false });
        }
      } else if (R() < pr && clearAt(jx, jz, { path: 1.4, pad: 1.6, foot: 1.6, lagoon: 0.2, slope: 1.6, dry: -0.6 })) {
        const s = shore > 0 ? 0.45 + R() * 0.9 : 0.6 + R() * 1.0;
        (snow > 0.4 ? snowRocks : rocks).push({ x: jx, z: jz, y: terrainHeight(jx, jz), s, rot: R() * TAU, tint: R(), rx: (R() - 0.5) * 0.4, collide: s > 0.85 });
      }
      // Beachcombing: shells + starfish on the sand, driftwood logs.
      if (sand && snow < 0.1 && vol < 0.3) {
        if (R() < 0.09 && clearAt(jx, jz, { path: 0.3, foot: 0.6, dry: 0.05 })) {
          shells.push({ x: jx, z: jz, y: terrainHeight(jx, jz), s: 0.8 + R() * 0.7, rot: R() * TAU, tint: R(), v: Math.floor(R() * 3) });
        }
        if (R() < 0.006 && clearAt(jx, jz, { path: 1.5, foot: 2, dry: 0.2, slope: 0.3 })) {
          logs.push({ x: jx, z: jz, y: terrainHeight(jx, jz), len: 1.6 + R() * 1.6, r: 0.18 + R() * 0.1, rot: R() * TAU, tint: R() });
        }
      }
    }
  }
  // Reeds along the lagoon's quieter edges.
  for (let k = 0; k < 120; k++) {
    const a = R() * TAU;
    const x = LAGOON.c[0] + Math.cos(a) * (LAGOON.rx + 0.6) + (R() - 0.5) * 2.2;
    const z = LAGOON.c[1] + Math.sin(a) * (LAGOON.rz + 0.6) + (R() - 0.5) * 2.2;
    const e = lagoonEdgeDist(x, z);
    if (e < -1.4 || e > 1.2) continue;
    const np = nearestPath(x, z);
    if (np && np.e < 1.2) continue;
    if (nearestFootprint(x, z).e < 1) continue;
    reeds.push({ x, z, y: terrainHeight(x, z), s: 0.8 + R() * 0.5, rot: R() * TAU, tint: R() });
  }
  _props = { trees, bushes, flowers, ferns, leaves, rocks, basalt, snowRocks, shells, logs, reeds };
  return _props;
}

/** Tree trunks + big rocks as colliders (pure data). */
export function islandPropColliders() {
  const P = getIslandProps();
  const out = [];
  const TR = { palm: 0.35, broad: 0.55, oak: 0.55, gum: 0.45, fir: 0.45, spruce: 0.5, pine: 0.4, round: 0.4 };
  for (const [kind, list] of Object.entries(P.trees)) {
    list.forEach((t, i) => out.push({ id: `tree-${kind}-${i}`, kind: "tree", x: t.x, z: t.z, radius: TR[kind] * Math.max(0.8, t.s) }));
  }
  for (const list of [P.rocks, P.snowRocks]) {
    list.forEach((r, i) => { if (r.collide) out.push({ id: `rock-${i}-${r.x.toFixed(1)}`, kind: "rock", x: r.x, z: r.z, radius: 0.75 * r.s, jumpable: r.s < 1.15 }); });
  }
  P.logs.forEach((l, i) => out.push({ id: `log-${i}`, kind: "log", x: l.x, z: l.z, radius: 0.4, jumpable: true }));
  return out;
}

export { clamp };
