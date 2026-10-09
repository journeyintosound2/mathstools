/**
 * EMERALD JUNGLE — deterministic PROP + VEGETATION scatter (trees, palms,
 * giant redwoods, ferns, bushes, big-leaf plants, flowers, mushrooms, reeds,
 * rocks, logs) and the set-pieces' prop positions. Pure data, computed once
 * (lazily — it samples the terrain grid) and shared by the renderer AND the
 * colliders, so what you bump into is exactly what you see.
 *
 * Every item: { x, z, y (ground), s (scale), rot, tint (0..1), lean? }
 */
import {
  terrainHeight, slopeAt, waterEdgeDist, pathEdgeDist, nearestPath, rimCoords, rng, fbm, smoothstep,
  JUNGLE_SPOTS, ARRIVAL_GLADE, JUNGLE_RETURN_PORTAL, GREAT_TREE, MUSHROOM_LEDGE, LAGOON,
  TEMPLE_ANCHOR, HILLS, escarpZ, PLATEAU_H, FALLS_POOL, JUNGLE_WELCOME_SIGN, JUNGLE_PATHS,
  ensureJungleStructures, ROPE_BRIDGE, JUNGLE_BRIDGES, LEAF_PADS, BOUNCE_PADS, TOADSTOOL, TEMPLE,
  VINE_WALLS, MID_LEDGE, FALLS, GRID, GREAT_STAIR, STAIR_FLIGHTS, FALLS_DECK, LOOKOUT, cliffWidthAt as escarpWidthAt,
} from "./jungleLayout.js";
import { inAnyJungleChallengeView, JUNGLE_RECORDS_STAND, JUNGLE_WELCOME_HOST } from "./jungleChallenges.js";

const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// Keep-clear zones (set-pieces, clearings, the portal…) — circles + boxes.
// ---------------------------------------------------------------------------
function keepClearList() {
  ensureJungleStructures();
  const circles = [
    ...JUNGLE_SPOTS.map((s) => ({ c: s.center, r: s.radius + 2.5 })),
    { c: ARRIVAL_GLADE.center, r: ARRIVAL_GLADE.radius + 3.5 },
    { c: JUNGLE_RETURN_PORTAL, r: 5.5 },
    { c: JUNGLE_WELCOME_SIGN.position, r: 2.5 },
    { c: JUNGLE_RECORDS_STAND.position, r: 4.6 }, // the trophy stand
    { c: JUNGLE_WELCOME_HOST.position, r: 1.6 }, // Mills
    { c: TEMPLE_ANCHOR.c, r: 18 },
    { c: GREAT_TREE.center, r: GREAT_TREE.deckR + 2.5 },
    { c: MUSHROOM_LEDGE.center, r: MUSHROOM_LEDGE.radius + 2.2 },
    { c: TOADSTOOL.c, r: 6 },
    ...BOUNCE_PADS.map((p) => ({ c: p.c, r: p.r + 1.6 })),
    { c: [LAGOON.center[0] + 3, LAGOON.center[1] + 1], r: 4.5 },
    { c: [22, escarpZ(22) - 1], r: 6.5 }, // falls lookout deck
  ];
  const boxes = [
    { x0: -48, x1: -15, z0: -104, z1: -86 }, // the Vine Cliffs + leaf poles
    { x0: 26, x1: 61, z0: -103, z1: -89 }, // the Waterfall Stairs
  ];
  return { circles, boxes };
}
let _keep = null;
/** The arrival VIEW: a wedge of meadow north of the glade, so you look out
 * over the canopy to the hills and the Great Tree instead of into trunks. */
export function inArrivalView(x, z) {
  const dx = x - ARRIVAL_GLADE.center[0], dz = ARRIVAL_GLADE.center[1] - z; // dz > 0 = north
  if (dz < -4 || dz > 46) return false;
  return Math.abs(dx) < 9 + dz * 0.42;
}
function inKeepClear(x, z, pad = 0) {
  if (!_keep) _keep = keepClearList();
  for (const k of _keep.circles) if (Math.hypot(x - k.c[0], z - k.c[1]) < k.r + pad) return true;
  for (const b of _keep.boxes) if (x > b.x0 - pad && x < b.x1 + pad && z > b.z0 - pad && z < b.z1 + pad) return true;
  return false;
}
function segDist(x, z, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const L2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
  return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
}
function nearBridge(x, z, pad) {
  for (const b of JUNGLE_BRIDGES) if (segDist(x, z, b.from, b.to) < b.halfWidth + pad) return true;
  return false;
}

/** Height above the valley floor contributed by a named hill (0 if off it). */
function onHill(x, z) {
  // A cheap proxy: how far above the smooth floor trend the terrain sits.
  const g = terrainHeight(x, z);
  const trend = 1.4 - 0.011 * z;
  return g - trend;
}
export const REDWOOD_HOLLOW = { center: [-62, -63], radius: 30 };

// ---------------------------------------------------------------------------
// Jittered-grid scatter.
// ---------------------------------------------------------------------------
function jitterScatter(seed, cell, jitter, x0, x1, z0, z1, accept) {
  const rand = rng(seed);
  const out = [];
  for (let gz = z0; gz < z1; gz += cell) {
    for (let gx = x0; gx < x1; gx += cell) {
      const x = gx + cell / 2 + (rand() - 0.5) * 2 * jitter;
      const z = gz + cell / 2 + (rand() - 0.5) * 2 * jitter;
      const r1 = rand(), r2 = rand(), r3 = rand(), r4 = rand();
      const item = accept(x, z, r1, r2, r3, r4);
      if (item) out.push(item);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// TREES
// ---------------------------------------------------------------------------
let _props = null;
export function getJungleProps() {
  if (_props) return _props;
  ensureJungleStructures();
  const T = { giant: [], broadleaf: [], conifer: [], palm: [], emergent: [] };

  // --- Redwood Hollow: a cathedral of giant redwoods (Wooded-Kingdom feel).
  {
    const rand = rng(77);
    const H = REDWOOD_HOLLOW;
    let tries = 0;
    while (T.giant.length < 24 && tries < 3000) {
      tries++;
      const a = rand() * TAU, r = Math.sqrt(rand()) * H.radius;
      const x = H.center[0] + Math.cos(a) * r * 1.15, z = H.center[1] + Math.sin(a) * r;
      if (inKeepClear(x, z, 1.5) || pathEdgeDist(x, z) < 3.4 || waterEdgeDist(x, z) < 4) continue;
      if (inAnyJungleChallengeView(x, z)) continue;
      if (slopeAt(x, z) > 0.55) continue;
      if (T.giant.some((g) => Math.hypot(g.x - x, g.z - z) < 10.5)) continue;
      const s = 0.85 + rand() * 0.4;
      T.giant.push({ x, z, y: terrainHeight(x, z), s, rot: rand() * TAU, tint: rand() });
    }
    // A few more giants scattered along the foot of the escarpment.
    for (const [x, z] of [[-84, -84], [-72, -90], [-96, -64], [62, -86], [8, -64], [-14, -68], [-88, -6], [94, -66]]) {
      if (inKeepClear(x, z, 1.5) || pathEdgeDist(x, z) < 3.4 || waterEdgeDist(x, z) < 4) continue;
      T.giant.push({ x, z, y: terrainHeight(x, z), s: 0.8 + ((x * 7 + z * 3) % 10 + 10) % 10 * 0.03, rot: x + z, tint: 0.5 });
    }
  }

  // --- The forest: one jittered pass decides each cell's tree (or none).
  const forest = jitterScatter(1234, 4.6, 1.25, -160, 160, -205, 205, (x, z, r1, r2, r3, r4) => {
    const rc = rimCoords(x, z);
    const insideRim = rc.q < rc.edge - 0.005;
    const deco = !insideRim;
    if (deco) {
      // Rim decoration: forest on the lower mountain flanks only (no colliders).
      if (rc.q > rc.edge + 0.2) return null;
      if (r1 > 0.8) return null;
    }
    const g = terrainHeight(x, z);
    const sl = slopeAt(x, z);
    if (!deco) {
      if (sl > 0.98) return null; // cliffs + the rim's face are bare rock
      if (inKeepClear(x, z)) return null;
      if (inArrivalView(x, z)) return null;
      if (inAnyJungleChallengeView(x, z)) return null; // a challenge camera's line
      if (pathEdgeDist(x, z) < 1.6) return null;
      if (waterEdgeDist(x, z) < 1.4) return null;
      if (nearBridge(x, z, 2.5)) return null;
      if (Math.hypot(x - REDWOOD_HOLLOW.center[0], z - REDWOOD_HOLLOW.center[1]) < REDWOOD_HOLLOW.radius + 4 && r1 > 0.12) return null;
      if (T.giant.some((t) => Math.hypot(t.x - x, t.z - z) < 4.5 * t.s)) return null;
    }
    const plateau = z < escarpZ(x) - 4 && g > PLATEAU_H - 3;
    const hillUp = onHill(x, z);
    const we = deco ? 99 : waterEdgeDist(x, z);
    // Sunny Knoll's top is an open flower meadow.
    const sunny = HILLS[2];
    const sunnyT = Math.hypot((x - sunny.c[0]) / sunny.rx, (z - sunny.c[1]) / sunny.rz);
    // Density by zone.
    let dens;
    if (deco) dens = 0.95;
    else if (plateau) dens = 0.42 + 0.35 * smoothstep(0.45, 0.7, fbm(x / 30, z / 30, 2, 31));
    else if (hillUp > 3) dens = sunnyT < 0.75 ? 0.04 : 0.82;
    else {
      const clump = smoothstep(0.42, 0.62, fbm(x / 34 + 9, z / 34 - 3, 3, 41));
      dens = 0.1 + 0.62 * clump;
      if (we < 7) dens = Math.max(dens, 0.32);
    }
    if (r2 > dens) return null;
    // Type by zone.
    let type;
    if (deco) type = g > 30 || rc.q > rc.edge + 0.1 ? "conifer" : r3 < 0.55 ? "conifer" : "broadleaf";
    else if (plateau) type = r3 < 0.7 ? "conifer" : "broadleaf";
    else if (we < 7 || (z > 70 && hillUp < 3 && r3 < 0.35)) type = r3 < 0.7 ? "palm" : "broadleaf";
    else if (hillUp > 12) type = r3 < 0.45 ? "conifer" : "broadleaf";
    else type = r3 < 0.06 ? "emergent" : r3 < 0.18 ? "conifer" : "broadleaf";
    // Size: bigger on hills + plateau, smaller along the water.
    let s = 0.78 + r4 * 0.5;
    if (type === "emergent") s = 1.0 + r4 * 0.35;
    if (deco) s *= 1.15;
    const lean = type === "palm" ? (0.05 + r1 * 0.14) : (r1 - 0.5) * 0.06;
    return { type, deco, x, z, y: g, s, rot: r3 * TAU + r1 * 10, tint: r4, lean };
  });
  for (const t of forest) T[t.type].push(t);

  // --- The Palm Grove + the lagoon shore: extra palms (Banjo-style jungle).
  {
    const rand = rng(99);
    const groves = [
      { c: [-25, 101], r: 18, n: 16 },
      { c: [70, 102.5], r: 16, n: 10 },
      { c: [8, 124], r: 14, n: 7 },
      { c: [44, 122], r: 10, n: 6 },
    ];
    for (const gv of groves) {
      let made = 0, tries = 0;
      while (made < gv.n && tries < 400) {
        tries++;
        const a = rand() * TAU, r = gv.r * (0.45 + rand() * 0.55);
        const x = gv.c[0] + Math.cos(a) * r, z = gv.c[1] + Math.sin(a) * r;
        if (inKeepClear(x, z) || inArrivalView(x, z) || inAnyJungleChallengeView(x, z) || pathEdgeDist(x, z) < 1.5 || waterEdgeDist(x, z) < 1.2 || slopeAt(x, z) > 0.6) continue;
        const all = [...T.palm, ...T.broadleaf, ...T.emergent, ...T.conifer];
        if (all.some((o) => !o.deco && Math.hypot(o.x - x, o.z - z) < 3.2)) continue;
        T.palm.push({ type: "palm", x, z, y: terrainHeight(x, z), s: 0.8 + rand() * 0.35, rot: rand() * TAU, tint: rand(), lean: 0.06 + rand() * 0.16 });
        made++;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // UNDERGROWTH (no colliders — you brush through it).
  // ---------------------------------------------------------------------------
  const allTrees = [...T.giant, ...T.broadleaf, ...T.conifer, ...T.palm, ...T.emergent];
  const treeHash = new Map();
  for (const t of allTrees) {
    const k = Math.floor(t.x / 8) * 4096 + Math.floor(t.z / 8);
    if (!treeHash.has(k)) treeHash.set(k, []);
    treeHash.get(k).push(t);
  }
  function nearTrunk(x, z, pad) {
    const i0 = Math.floor(x / 8), j0 = Math.floor(z / 8);
    for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) {
      for (const t of treeHash.get(i * 4096 + j) || []) {
        const r = (t.type === "giant" ? 2.4 : t.type === "palm" ? 0.35 : 0.5) * t.s;
        if (Math.hypot(t.x - x, t.z - z) < r + pad) return true;
      }
    }
    return false;
  }
  function forestShade(x, z) {
    // How "under the canopy" a spot is (0..1): count trees within 7 m.
    let n = 0;
    const i0 = Math.floor(x / 8), j0 = Math.floor(z / 8);
    for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) {
      for (const t of treeHash.get(i * 4096 + j) || []) if (Math.hypot(t.x - x, t.z - z) < 7) n++;
    }
    return Math.min(1, n / 4);
  }
  const groundOK = (x, z, pathPad = 0.6) => {
    const rc = rimCoords(x, z);
    if (rc.q > rc.edge + 0.02) return false;
    if (slopeAt(x, z) > 0.95) return false;
    if (pathEdgeDist(x, z) < pathPad) return false;
    if (waterEdgeDist(x, z) < 0.5) return false;
    if (nearBridge(x, z, 0.5)) return false;
    return true;
  };

  const ferns = jitterScatter(501, 2.3, 0.95, -150, 150, -195, 195, (x, z, r1, r2, r3, r4) => {
    if (!groundOK(x, z, 0.4) || inKeepClear(x, z, -1.5) || nearTrunk(x, z, 0.3)) return null;
    const shade = forestShade(x, z);
    const inHollow = Math.hypot(x - REDWOOD_HOLLOW.center[0], z - REDWOOD_HOLLOW.center[1]) < REDWOOD_HOLLOW.radius + 6;
    const p = inHollow ? 0.85 : 0.08 + shade * 0.55;
    if (r1 > p) return null;
    return { x, z, y: terrainHeight(x, z), s: 0.7 + r2 * 0.75 + (inHollow ? 0.35 : 0), rot: r3 * TAU, tint: r4 };
  });
  const bushes = jitterScatter(602, 3.4, 1.2, -150, 150, -195, 195, (x, z, r1, r2, r3, r4) => {
    if (!groundOK(x, z, 1.0) || inKeepClear(x, z, -0.5) || nearTrunk(x, z, 0.6) || inArrivalView(x, z) || inAnyJungleChallengeView(x, z)) return null;
    const shade = forestShade(x, z);
    if (r1 > 0.05 + shade * 0.32) return null;
    return { x, z, y: terrainHeight(x, z), s: 0.7 + r2 * 0.8, rot: r3 * TAU, tint: r4 };
  });
  const bigleaf = jitterScatter(703, 4.2, 1.5, -150, 150, -195, 195, (x, z, r1, r2, r3, r4) => {
    if (!groundOK(x, z, 0.7) || inKeepClear(x, z, -1) || nearTrunk(x, z, 0.5) || inAnyJungleChallengeView(x, z)) return null;
    const we = waterEdgeDist(x, z);
    const palmy = z > 60 || we < 10;
    const p = (palmy ? 0.32 : 0.1) + forestShade(x, z) * 0.12;
    if (r1 > p) return null;
    return { x, z, y: terrainHeight(x, z), s: 0.75 + r2 * 0.75, rot: r3 * TAU, tint: r4 };
  });
  const flowers = jitterScatter(804, 2.6, 1.1, -150, 150, -195, 195, (x, z, r1, r2, r3, r4) => {
    if (!groundOK(x, z, 0.3) || nearTrunk(x, z, 0.2)) return null;
    const sunny = HILLS[2];
    const sunnyT = Math.hypot((x - sunny.c[0]) / sunny.rx, (z - sunny.c[1]) / sunny.rz);
    const meadow = sunnyT < 0.95 ? 0.85 : 0;
    const patch = smoothstep(0.55, 0.7, fbm(x / 22 - 4, z / 22 + 6, 2, 51)) * 0.5;
    const p = Math.max(meadow, patch * (1 - forestShade(x, z) * 0.7));
    if (r1 > p) return null;
    return { x, z, y: terrainHeight(x, z), s: 0.7 + r2 * 0.6, rot: r3 * TAU, tint: r4 };
  });
  const mushrooms = jitterScatter(905, 3.0, 1.2, -150, 150, -195, 195, (x, z, r1, r2, r3, r4) => {
    if (!groundOK(x, z, 0.3)) return null;
    const glade = Math.hypot(x - (-50), z - 28) < 22;
    const shade = forestShade(x, z);
    const p = glade ? 0.6 : 0.03 + shade * 0.06;
    if (r1 > p || nearTrunk(x, z, 0.2)) return null;
    if (BOUNCE_PADS.some((b) => Math.hypot(b.c[0] - x, b.c[1] - z) < b.r + 0.8)) return null;
    if (Math.hypot(x - TOADSTOOL.c[0], z - TOADSTOOL.c[1]) < 2) return null;
    return { x, z, y: terrainHeight(x, z), s: (glade ? 0.9 : 0.55) + r2 * 0.6, rot: r3 * TAU, tint: r4, glow: glade };
  });
  const reeds = jitterScatter(1006, 1.6, 0.7, -150, 150, -195, 195, (x, z, r1, r2, r3, r4) => {
    const we = waterEdgeDist(x, z);
    if (we < -1.3 || we > 1.4) return null;
    if (pathEdgeDist(x, z) < 0.4 || nearBridge(x, z, 1.2)) return null;
    if (r1 > 0.42) return null;
    return { x, z, y: terrainHeight(x, z), s: 0.7 + r2 * 0.6, rot: r3 * TAU, tint: r4 };
  });
  const rocks = jitterScatter(1107, 6.5, 2.4, -155, 155, -200, 200, (x, z, r1, r2, r3, r4) => {
    const rc = rimCoords(x, z);
    if (rc.q > rc.edge + 0.08) return null;
    if (inKeepClear(x, z) || pathEdgeDist(x, z) < 1.4 || nearBridge(x, z, 1.5) || nearTrunk(x, z, 1.2) || inAnyJungleChallengeView(x, z)) return null;
    const we = waterEdgeDist(x, z);
    const inWater = we < -0.6;
    const sl = slopeAt(x, z);
    const p = inWater ? 0.16 : sl > 0.8 ? 0.4 : 0.07;
    if (r1 > p) return null;
    const s = inWater ? 0.5 + r2 * 0.6 : 0.45 + r2 * r2 * 1.9;
    return { x, z, y: terrainHeight(x, z), s, rot: r3 * TAU, tint: r4, wet: inWater, steep: sl > 0.8, collide: !inWater && s > 0.95 && rc.q < rc.edge - 0.01 && sl < 0.98 };
  });
  // Lily pads (decor) on the lagoon + slow pools.
  const lilies = jitterScatter(1208, 1.9, 0.8, 30, 100, 105, 150, (x, z, r1, r2, r3, r4) => {
    const q = Math.hypot((x - LAGOON.center[0]) / LAGOON.rx, (z - LAGOON.center[1]) / LAGOON.rz);
    if (q > 0.9 || q < 0.12) return null;
    if (r1 > 0.33) return null;
    return { x, z, y: LAGOON.level + 0.02, s: 0.6 + r2 * 0.7, rot: r3 * TAU, tint: r4, flower: r4 > 0.82 };
  });

  // Fallen logs: a few in the forests (solid, but you can hop over them).
  const logs = [];
  {
    const rand = rng(1309);
    let tries = 0;
    while (logs.length < 22 && tries < 4000) {
      tries++;
      const x = -130 + rand() * 260, z = -150 + rand() * 300;
      const rc = rimCoords(x, z);
      if (rc.q > rc.edge - 0.04) continue;
      if (inKeepClear(x, z, 2) || pathEdgeDist(x, z) < 3 || waterEdgeDist(x, z) < 3 || slopeAt(x, z) > 0.4 || inAnyJungleChallengeView(x, z)) continue;
      if (forestShade(x, z) < 0.5) continue;
      const rot = rand() * Math.PI;
      const len = 4 + rand() * 4;
      const ex = Math.cos(rot) * len / 2, ez = Math.sin(rot) * len / 2;
      let bad = false;
      for (let k = -1; k <= 1; k += 0.25) {
        const px = x + ex * k, pz = z + ez * k;
        if (nearTrunk(px, pz, 1.0) || pathEdgeDist(px, pz) < 1.5 || slopeAt(px, pz) > 0.5) { bad = true; break; }
      }
      if (bad || logs.some((l) => Math.hypot(l.x - x, l.z - z) < 12)) continue;
      logs.push({ x, z, y: terrainHeight(x, z), rot, len, r: 0.42 + rand() * 0.2, tint: rand() });
    }
  }
  // Stumps.
  const stumps = jitterScatter(1410, 14, 5, -150, 150, -195, 195, (x, z, r1, r2, r3, r4) => {
    if (!groundOK(x, z, 1.4) || inKeepClear(x, z) || nearTrunk(x, z, 1.4) || r1 > 0.22 || inAnyJungleChallengeView(x, z)) return null;
    return { x, z, y: terrainHeight(x, z), s: 0.7 + r2 * 0.6, rot: r3 * TAU, tint: r4 };
  });

  // Craggy rock slabs embedded in the escarpment's face (layered, mossy —
  // the Vine-Cliffs look), skipping the vine walls, the falls and the stairs.
  const cliffRocks = [];
  {
    const rand = rng(1511);
    const skip = (x) =>
      VINE_WALLS.some((w) => x > Math.min(w.a[0], w.b[0]) - 1.2 && x < Math.max(w.a[0], w.b[0]) + 1.2) ||
      (x > 6.5 && x < 18.5) || (x > 25 && x < 61);
    for (let x = -126; x <= 126; x += 1.7 + rand() * 1.3) {
      if (skip(x)) continue;
      const foot = escarpZ(x);
      const wid = escarpWidthAt(x);
      // Only where the cliff really is a cliff (not buried under the ridge).
      const mid = [x, foot - wid * 0.5];
      if (slopeAt(mid[0], mid[1]) < 1.3) continue;
      const rc = rimCoords(x, foot);
      if (rc.q > rc.edge + 0.05) continue;
      const n = 2 + Math.floor(rand() * 2);
      for (let k = 0; k < n; k++) {
        const f = (k + 0.25 + rand() * 0.5) / n;
        const z = foot - f * wid - 0.35;
        const xx = x + (rand() - 0.5) * 1.2;
        cliffRocks.push({ x: xx, z: z + 0.2, y: terrainHeight(xx, z) - 0.9, s: 1, sx: 1.5 + rand() * 1.5, sy: 1.3 + rand() * 1.5, sz: 1.4 + rand() * 0.8, rot: (rand() - 0.5) * 0.6, rx: (rand() - 0.5) * 0.4, tint: rand() });
      }
    }
  }

  _props = { trees: T, ferns, bushes, bigleaf, flowers, mushrooms, reeds, rocks, lilies, logs, stumps, cliffRocks };
  return _props;
}

// ---------------------------------------------------------------------------
// Collider radii per tree type (trunk at its base, × scale).
// ---------------------------------------------------------------------------
export const TRUNK_R = { giant: 2.1, broadleaf: 0.42, conifer: 0.38, palm: 0.3, emergent: 0.85 };

// ---------------------------------------------------------------------------
// Set-piece prop positions.
// ---------------------------------------------------------------------------
let _sp = null;
export function getJungleSetPieces() {
  if (_sp) return _sp;
  ensureJungleStructures();
  const [tx, tz] = TEMPLE_ANCHOR.c;
  const g = TEMPLE.ground;
  // Courtyard colonnade: two rows of pillars flanking the stream (some broken).
  const pillars = [];
  const templeSpot = JUNGLE_SPOTS.find((q) => q.id === "temple");
  for (let i = 0; i < 5; i++) {
    const x = tx + 6.5 + i * 4.2;
    for (const side of [-1, 1]) {
      const z = TEMPLE.arch.z + side * 6.2;
      // The Temple Ruins clearing is reserved open ground, and the trails stay clear.
      if (Math.hypot(x - templeSpot.center[0], z - templeSpot.center[1]) < templeSpot.radius + 1) continue;
      const np = nearestPath(x, z);
      if (np && np.e < 1.2) continue;
      const broken = (i * 3 + (side + 1)) % 4 === 1;
      pillars.push({ x, z, y: terrainHeight(x, z), h: broken ? 1.4 + ((i * 7) % 3) * 0.6 : 5.2, r: 0.62, broken, tilt: broken ? 0.12 : 0 });
    }
  }
  // Rubble blocks scattered round the courtyard.
  const rubble = [];
  {
    const rand = rng(31);
    let tries = 0;
    while (rubble.length < 16 && tries < 500) {
      tries++;
      const x = tx + 5 + rand() * 24, z = TEMPLE.arch.z + (rand() - 0.5) * 22;
      if (Math.abs(z - TEMPLE.arch.z) < 2.6) continue; // keep the stream channel clear
      if (pathEdgeDist(x, z) < 1.2) continue;
      if (pillars.some((p) => Math.hypot(p.x - x, p.z - z) < 1.6)) continue;
      if (rubble.some((r) => Math.hypot(r.x - x, r.z - z) < 1.8)) continue;
      rubble.push({ x, z, y: terrainHeight(x, z), s: 0.5 + rand() * 0.6, rot: rand() * TAU, tilt: (rand() - 0.5) * 0.5 });
    }
  }
  // Trail signposts at the main junctions.
  const sign = (x, z, rot, arrows) => ({ x, z, y: terrainHeight(x, z), rot, arrows });
  const signs = [
    sign(-3.5, 121, 0.4, [["Palm Grove", -0.6], ["Lily Lagoon", 2.2]]),
    sign(-39, 32.5, 0.2, [["Temple Ruins", 0], ["Canopy Lookout", 2.6]]),
    sign(-39, -28.5, -0.2, [["Redwood Hollow", 0.2], ["Great Tree", 3.1]]),
    sign(30.5, -59, -0.6, [["Waterfall Stairs", 0], ["Great Tree", 3.2]]),
    sign(27.5, -21, 0.3, [["Mossback Ridge", 1.2], ["Temple Ruins", 3.0]]),
    sign(-11, -78, 0.1, [["Vine Cliffs", 0], ["Waterfall Pool", 2.6]]),
  ];
  // The Great Tree: a little hut on the treehouse deck (west side) and the
  // gap in the deck railing where the rope bridge leaves (east).
  const T = GREAT_TREE;
  const bridgeAng = Math.atan2(ROPE_BRIDGE.from[1] - T.center[1], ROPE_BRIDGE.from[0] - T.center[0]);
  const hut = { ang: Math.PI * 0.92, r: 8.3, w: 3.6, d: 2.9, h: 2.6 };
  hut.c = [T.center[0] + Math.cos(hut.ang) * hut.r, T.center[1] + Math.sin(hut.ang) * hut.r];
  const greatTree = { bridgeAng, hut };
  // Sky Shrine: a broken ring of standing stones round an altar.
  const shrineC = JUNGLE_SPOTS.find((q) => q.id === "shrine").center;
  // The altar stands at the ring's north side, leaving the clearing's middle open.
  const shrine = { c: shrineC, altar: { c: [shrineC[0], shrineC[1] - 5.4], r: 1.1 }, stones: [] };
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.2;
    const x = shrineC[0] + Math.cos(a) * 7.2, z = shrineC[1] + Math.sin(a) * 7.2;
    const np = nearestPath(x, z);
    if (np && np.e < 1.0) continue; // leave the trail through the ring
    if (Math.hypot(x - shrine.altar.c[0], z - shrine.altar.c[1]) < 2.4) continue;
    shrine.stones.push({ x, z, y: terrainHeight(x, z), h: 2.4 + ((i * 5) % 4) * 0.45, rot: a, fallen: i === 4 });
  }
  // The lagoon islet's lotus statue.
  const isle = { c: [LAGOON.center[0] + 3, LAGOON.center[1] + 1] };
  _sp = { pillars, rubble, signs, greatTree, shrine, isle };
  return _sp;
}

export { LEAF_PADS, BOUNCE_PADS, TOADSTOOL, VINE_WALLS, MID_LEDGE, FALLS, FALLS_POOL, ROPE_BRIDGE, JUNGLE_PATHS, GRID };
