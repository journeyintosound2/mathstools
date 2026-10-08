/**
 * FRACTION FARM (the big rolling farm, 2026-10-07) — headless WORLD checks
 * FW1–FW9. They read the SAME pure modules the game uses (farmLayout /
 * farmTerrain / farmProps / farmColliders / farmCameras / regions), so a
 * passing run means the walkable farm, its ten challenge stages, their
 * cameras and the colliders genuinely agree.
 */
import {
  FARM_REGION_ID, FARM_BOUNDS, FARM_SPAWN, FARM_RETURN_PORTAL, BOUNDARY_FENCE, FARM_AREAS, FARM_PADS, CHALLENGE_PAD,
  CHALLENGE_FENCE, CHALLENGE_SIGN, ROUNDUP_PEN, ROUNDUP_FIELD, ROUNDUP_GATE_OUT, ROUNDUP_SIGN, ORDER_GARDEN,
  ORDER_VIEW_SPOT, ORDER_SIGN, CRATE_AREA, CRATE_PILES, CRATE_ROW, CRATE_VIEW_SPOT, CRATE_SIGN, crateSlotX, CRATE_SIZES,
  MILK_AREA, MILK_CHUTE_STOPS, MILK_CHUTE_REPEATS, MILK_TRUCK, MILK_SIGN, MILK_VIEW_SPOT, WEIGH_AREA, WEIGH_SIGN,
  WEIGH_VIEW_SPOT, TRADE_AREA, TRADE_STALL_OFFSETS, TRADE_TABLE_OFFSET, TRADE_SIGN, TRADE_VIEW_SPOT, VEGGIE_AREA,
  VEGGIE_BED, VEGGIE_SIGN, VEGGIE_VIEW_SPOT, PLANK_AREA, PLANK_SIGN, PLANK_VIEW_SPOT, SHOP_AREA, SHOP_SIGN,
  SHOP_VIEW_SPOT, FARM_RECORDS_STAND, FARM_WELCOME_SIGN, FARM_SIGNPOSTS, FARM_CHEST_SPOTS, FARM_BIG_WINDMILL,
  FARM_SHEARING_SHED, FARM_POND, FARM_PADDOCKS, FARM_FENCE_RAIL_TOP,
} from "../data/farm/farmLayout.js";
import {
  F_STEP_UP, F_SLIDE_SLOPE, F_WADE_SPEED, GRID, getFarmGrid, terrainHeight, slopeAt, farmWaterAt, farmGroundHeight,
  farmSlideAt, farmSpeedAt, farmIsSafe, nearestPath, nearestPad, onPad, farmPadLevel, challengePadY, FARM_PATHS,
  FARM_BRIDGES, ensureFarmStructures, outsideFence, getFarmPads,
} from "../data/farm/farmTerrain.js";
import { getFarmProps, FARM_FOOTPRINTS, FARM_TRUNK_R, FARM_TREE_H, footprintDist } from "../data/farm/farmProps.js";
import { farmChallengeView, FARM_CAMERA_KEYS, inFarmCameraView } from "../data/farm/farmCameras.js";
import { paddockGate } from "../data/farm/farmColliders.js";
import {
  JUNGLE_BOUNDS, GRID as JGRID, jungleWaterAt, slopeAt as jungleSlope, SLIDE_SLOPE as J_SLIDE,
} from "../data/jungle/jungleLayout.js";
import { getRegion } from "../data/regions.js";
import { getColliders } from "../data/worldColliders.js";
import { PLAYER_RADIUS, STEP_UP } from "../systems/collisionEngine.js";

const JUMP_V = 7.2, G = 20;
const JUMP_APEX = (JUMP_V * JUMP_V) / (2 * G); // ≈ 1.30 m

function colliderLookup(colliders) {
  const cell = 4;
  const map = new Map();
  for (const c of colliders) {
    const r = c.radius + PLAYER_RADIUS;
    for (let i = Math.floor((c.x - r) / cell); i <= Math.floor((c.x + r) / cell); i++) {
      for (let j = Math.floor((c.z - r) / cell); j <= Math.floor((c.z + r) / cell); j++) {
        const k = i * 8192 + j;
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(c);
      }
    }
  }
  return (x, z, h, pad = PLAYER_RADIUS * 0.9) => {
    const arr = map.get(Math.floor(x / cell) * 8192 + Math.floor(z / cell));
    if (!arr) return null;
    for (const c of arr) {
      if (c.yMin !== undefined && h < c.yMin) continue;
      if (c.yMax !== undefined && h > c.yMax) continue;
      if (Math.hypot(x - c.x, z - c.z) < c.radius + pad) return c;
    }
    return null;
  };
}

/** Each challenge's KEY POINTS: everything its stage + camera + player use. */
export function farmStagePoints() {
  const F = CHALLENGE_FENCE;
  const walkZ = F.z + 2.4;
  const veg = VEGGIE_BED / 2 + 0.6;
  return {
    fence: [[F.x1, F.z], [F.x2, F.z], [F.x1 - 1.5, walkZ], [F.x2 + 1.5, walkZ], [(F.x1 + F.x2) / 2, walkZ], CHALLENGE_SIGN.position],
    roundup: [
      [ROUNDUP_FIELD.x1, ROUNDUP_FIELD.z1], [ROUNDUP_FIELD.x2, ROUNDUP_FIELD.z1], [ROUNDUP_FIELD.x1, ROUNDUP_FIELD.z2], [ROUNDUP_FIELD.x2, ROUNDUP_FIELD.z2],
      [ROUNDUP_PEN.x - ROUNDUP_PEN.w / 2, ROUNDUP_PEN.z - ROUNDUP_PEN.d / 2], [ROUNDUP_PEN.x + ROUNDUP_PEN.w / 2, ROUNDUP_PEN.z - ROUNDUP_PEN.d / 2],
      ROUNDUP_GATE_OUT, ROUNDUP_SIGN.position,
    ],
    order: [[ORDER_GARDEN.x - ORDER_GARDEN.bedW / 2, ORDER_GARDEN.z - ORDER_GARDEN.bedD / 2], [ORDER_GARDEN.x + ORDER_GARDEN.bedW / 2, ORDER_GARDEN.z + ORDER_GARDEN.bedD / 2], ORDER_VIEW_SPOT, ORDER_SIGN.position],
    crate: [...CRATE_PILES, [crateSlotX(0), CRATE_ROW.z], [crateSlotX(CRATE_SIZES.length - 1), CRATE_ROW.z], CRATE_VIEW_SPOT, CRATE_SIGN.position],
    milk: [[MILK_AREA.x, MILK_AREA.z], MILK_CHUTE_STOPS, MILK_CHUTE_REPEATS, MILK_TRUCK.position, MILK_SIGN.position, MILK_VIEW_SPOT],
    weigh: [[WEIGH_AREA.x - 4, WEIGH_AREA.z], [WEIGH_AREA.x + 4, WEIGH_AREA.z], WEIGH_SIGN.position, WEIGH_VIEW_SPOT],
    trade: [...Object.values(TRADE_STALL_OFFSETS).map(([ox, oz]) => [TRADE_AREA.x + ox, TRADE_AREA.z + oz]), [TRADE_AREA.x + TRADE_TABLE_OFFSET[0], TRADE_AREA.z + TRADE_TABLE_OFFSET[1]], TRADE_SIGN.position, TRADE_VIEW_SPOT],
    veggie: [[VEGGIE_AREA.x - veg, VEGGIE_AREA.z - veg], [VEGGIE_AREA.x + veg, VEGGIE_AREA.z + veg], VEGGIE_SIGN.position, VEGGIE_VIEW_SPOT],
    plank: [[PLANK_AREA.x - 5, PLANK_AREA.z], [PLANK_AREA.x + 5, PLANK_AREA.z], PLANK_SIGN.position, PLANK_VIEW_SPOT],
    shop: [[SHOP_AREA.x - 3, SHOP_AREA.z], [SHOP_AREA.x + 3, SHOP_AREA.z], SHOP_SIGN.position, SHOP_VIEW_SPOT],
  };
}
const STAGE_CENTRE = {
  fence: [(CHALLENGE_FENCE.x1 + CHALLENGE_FENCE.x2) / 2, CHALLENGE_FENCE.z], roundup: [ROUNDUP_PEN.x, ROUNDUP_PEN.z + 6],
  order: [ORDER_GARDEN.x, ORDER_GARDEN.z], crate: [CRATE_AREA.x, CRATE_AREA.z], milk: [MILK_AREA.x, MILK_AREA.z],
  weigh: [WEIGH_AREA.x, WEIGH_AREA.z], trade: [TRADE_AREA.x, TRADE_AREA.z], veggie: [VEGGIE_AREA.x, VEGGIE_AREA.z],
  plank: [PLANK_AREA.x, PLANK_AREA.z], shop: [SHOP_AREA.x, SHOP_AREA.z],
};
const VIEW_SPOT = {
  fence: [(CHALLENGE_FENCE.x1 + CHALLENGE_FENCE.x2) / 2, CHALLENGE_FENCE.z + 2.4], roundup: ROUNDUP_GATE_OUT,
  order: ORDER_VIEW_SPOT, crate: CRATE_VIEW_SPOT, milk: MILK_VIEW_SPOT, weigh: WEIGH_VIEW_SPOT, trade: TRADE_VIEW_SPOT,
  veggie: VEGGIE_VIEW_SPOT, plank: PLANK_VIEW_SPOT, shop: SHOP_VIEW_SPOT,
};
const SIGN_OF = {
  fence: CHALLENGE_SIGN, roundup: ROUNDUP_SIGN, order: ORDER_SIGN, crate: CRATE_SIGN, milk: MILK_SIGN, weigh: WEIGH_SIGN,
  trade: TRADE_SIGN, veggie: VEGGIE_SIGN, plank: PLANK_SIGN, shop: SHOP_SIGN,
};

export function runFarmWorldChecks() {
  const checks = [];
  ensureFarmStructures();
  const grid = getFarmGrid();
  const region = getRegion(FARM_REGION_ID);
  const colliders = getColliders({}, FARM_REGION_ID);
  const blockedAt = colliderLookup(colliders);
  const sp = FARM_SPAWN;
  const [bx, bz] = FARM_RETURN_PORTAL;
  const back = (region.portals || []).find((p) => p.target === "island-1");

  // FW1) Region hooks + gates + spawn: the farm's terrain hooks are wired (as
  //      the jungle's), the return gate stands on safe ground inside the
  //      fence, the spawn is safe, collider-free and outside the gate's
  //      trigger; the farm's step-up matches the collision engine's.
  const hooksOk = Boolean(region) && region.bounds === FARM_BOUNDS && region.groundHeight === farmGroundHeight &&
    region.slideAt === farmSlideAt && region.speedAt === farmSpeedAt && region.isSafe === farmIsSafe &&
    region.cameraTerrainClamp === true && region.maxFrameDelta > 0 && region.maxFrameDelta <= 0.1 && region.arriveYaw === 0;
  const backOk = Boolean(back) && back.position === FARM_RETURN_PORTAL && farmIsSafe(bx, bz) && outsideFence(bx, bz) < -3;
  const spawnOk = farmIsSafe(sp.x, sp.z) && !blockedAt(sp.x, sp.z, terrainHeight(sp.x, sp.z)) &&
    Math.hypot(sp.x - bx, sp.z - bz) > back.radius + 2 && region.spawn.x === sp.x && region.spawn.z === sp.z;
  const boundsOk = FARM_BOUNDS.width / 2 > BOUNDARY_FENCE.halfW && FARM_BOUNDS.height / 2 > BOUNDARY_FENCE.halfD &&
    FARM_BOUNDS.width / 2 < BOUNDARY_FENCE.halfW + 6;
  const fw1 = hooksOk && backOk && spawnOk && boundsOk && F_STEP_UP === STEP_UP;
  checks.push({
    name: "Fraction Farm world: terrain hooks + return gate + safe spawn",
    pass: fw1,
    detail: fw1 ? `spawn (${sp.x}, ${sp.z}) at ${terrainHeight(sp.x, sp.z).toFixed(1)} m; step-up ${STEP_UP}` : `hooks:${hooksOk} back:${backOk} spawn:${spawnOk} bounds:${boundsOk}`,
  });

  // FW2) SIZE: the same size as the Emerald Jungle — walkable farmland inside
  //      the boundary fence (dry, not too steep) within ±25 % of the jungle's
  //      walkable land (counted the way JG2 counts it).
  let land = 0;
  for (let x = -BOUNDARY_FENCE.halfW; x <= BOUNDARY_FENCE.halfW; x += 1) {
    for (let z = -BOUNDARY_FENCE.halfD; z <= BOUNDARY_FENCE.halfD; z += 1) {
      if (farmWaterAt(x, z) !== null || slopeAt(x, z) >= F_SLIDE_SLOPE) continue;
      land++;
    }
  }
  let jland = 0;
  const JR = JUNGLE_BOUNDS.radius;
  for (let x = -JR; x <= JR; x += 1) {
    for (let z = -JR; z <= JR; z += 1) {
      if (Math.hypot(x, z) > JR) continue;
      if (x < JGRID.xMin || x > JGRID.xMax || z < JGRID.zMin || z > JGRID.zMax) continue;
      if (jungleWaterAt(x, z) !== null || jungleSlope(x, z) >= J_SLIDE) continue;
      jland++;
    }
  }
  const ratio = land / jland;
  // …and genuinely HILLY: a real spread of heights inside the fence.
  let hMin = Infinity, hMax = -Infinity;
  for (let x = -BOUNDARY_FENCE.halfW; x <= BOUNDARY_FENCE.halfW; x += 2) {
    for (let z = -BOUNDARY_FENCE.halfD; z <= BOUNDARY_FENCE.halfD; z += 2) {
      const h = terrainHeight(x, z);
      hMin = Math.min(hMin, h); hMax = Math.max(hMax, h);
    }
  }
  const fw2 = ratio > 0.85 && ratio < 1.25 && hMax - hMin > 15;
  checks.push({
    name: "Fraction Farm world: the Emerald Jungle's size, and hilly",
    pass: fw2,
    detail: `walkable ${land} m² = ${ratio.toFixed(2)}× the jungle's ${jland} m²; heights ${hMin.toFixed(1)}…${hMax.toFixed(1)} m`,
  });

  // FW3) Every FARM TRACK is walkable end to end (bridges carry you over the
  //      creek): each 0.4 m step rises ≤ STEP_UP, nothing slides, no collider
  //      stands on it, and the grade stays gentle (≤ 0.45).
  let badRise = 0, slides = 0, samples = 0, maxGrade = 0, gradeAt = "";
  const blocked = [];
  for (const p of FARM_PATHS) {
    let h = null;
    for (let i = 0; i < p.pts.length - 1; i++) {
      const [ax, az] = p.pts[i], [cx, cz] = p.pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(cx - ax, cz - az) / 0.4));
      for (let k = 0; k < n; k++) {
        const x = ax + ((cx - ax) * k) / n, z = az + ((cz - az) * k) / n;
        const nh = farmGroundHeight(x, z, h === null ? terrainHeight(x, z) : h);
        if (h !== null && nh - h > STEP_UP) badRise++;
        if (farmSlideAt(x, z, nh)) slides++;
        const b = blockedAt(x, z, nh, 0.2);
        if (b && blocked.length < 6) blocked.push(`${p.id}:${b.id}`);
        if (farmWaterAt(x, z) === null && !FARM_BRIDGES.some((br) => br.topAt(x, z, Infinity) !== null)) {
          const s = slopeAt(x, z);
          if (s > maxGrade) { maxGrade = s; gradeAt = `${p.id} (${x.toFixed(0)}, ${z.toFixed(0)})`; }
        }
        h = nh;
        samples++;
      }
    }
  }
  const fw3 = badRise === 0 && slides === 0 && blocked.length === 0 && maxGrade <= 0.45;
  checks.push({
    name: "Fraction Farm world: every farm track is walkable end to end",
    pass: fw3,
    detail: fw3 ? `${FARM_PATHS.length} tracks, ${samples} steps, steepest grade ${maxGrade.toFixed(2)}` : `rise:${badRise} slide:${slides} blocked:${blocked.join(", ")} grade:${maxGrade.toFixed(2)} at ${gradeAt}`,
  });

  // FW4) REACHABLE on foot (no jumps): flood-fill a 0.5 m grid of standable
  //      ground from the spawn. It must reach every challenge's viewing spot
  //      + host, the hosts' approach, the summit, the trophy stand, the
  //      return gate, every signpost, every chest spot, every themed area and
  //      the shearing shed.
  const S = 0.5;
  const X0 = -BOUNDARY_FENCE.halfW, Z0 = -BOUNDARY_FENCE.halfD;
  const nx = Math.round((2 * BOUNDARY_FENCE.halfW) / S) + 1, nz = Math.round((2 * BOUNDARY_FENCE.halfD) / S) + 1;
  const hg = new Float32Array(nx * nz);
  const ok = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    const z = Z0 + j * S;
    for (let i = 0; i < nx; i++) {
      const x = X0 + i * S;
      const t = terrainHeight(x, z);
      const h = farmGroundHeight(x, z, t);
      if (farmSlideAt(x, z, h)) continue;
      if (blockedAt(x, z, h, 0.35)) continue;
      ok[j * nx + i] = 1;
      hg[j * nx + i] = h;
    }
  }
  const cellOf = (x, z) => [Math.round((x - X0) / S), Math.round((z - Z0) / S)];
  const seen = new Uint8Array(nx * nz);
  {
    const [si, sj] = cellOf(sp.x, sp.z);
    const q = [sj * nx + si];
    seen[q[0]] = 1;
    while (q.length) {
      const k = q.pop();
      const i = k % nx, j = (k - i) / nx;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
        const nk = nj * nx + ni;
        if (seen[nk] || !ok[nk] || hg[nk] - hg[k] > STEP_UP) continue;
        seen[nk] = 1;
        q.push(nk);
      }
    }
  }
  let reachedCells = 0, okCells = 0;
  for (let k = 0; k < ok.length; k++) { if (ok[k]) okCells++; if (seen[k]) reachedCells++; }
  const reach = ([x, z], rad = 1.5) => {
    const [ci, cj] = cellOf(x, z);
    const n = Math.ceil(rad / S);
    for (let dj = -n; dj <= n; dj++) for (let di = -n; di <= n; di++) {
      const i = ci + di, j = cj + dj;
      if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
      if (Math.hypot(di * S, dj * S) > rad) continue;
      if (seen[j * nx + i]) return true;
    }
    return false;
  };
  const targets = [
    ...FARM_CAMERA_KEYS.map((k) => [`${k}-view`, VIEW_SPOT[k], 1.2]),
    ...FARM_CAMERA_KEYS.map((k) => [`${k}-host`, SIGN_OF[k].position, 2.2]),
    ["welcome", FARM_WELCOME_SIGN.position, 2.2],
    ["summit", FARM_BIG_WINDMILL.position, 5],
    ["records", FARM_RECORDS_STAND.position, 4.5],
    ["return-gate", [bx, bz - 2.5], 1.5],
    ...FARM_SIGNPOSTS.map((s) => [`signpost-${s.id}`, s.at, 1.8]),
    ...FARM_CHEST_SPOTS.map((p, i) => [`chest-${i}`, p, 1.6]),
    ...FARM_AREAS.map((a) => [`area-${a.id}`, a.c, 5]),
    ["shearing-shed", [FARM_SHEARING_SHED.x - FARM_SHEARING_SHED.w / 2 - 2, FARM_SHEARING_SHED.z], 2],
    ["pond-shore", [FARM_POND.center[0] + FARM_POND.radius + 1.5, FARM_POND.center[1]], 1.5],
  ];
  const unreached = targets.filter(([, p, rad]) => !reach(p, rad)).map(([id]) => id);
  // Most of the walkable farm should be one connected place (paddock
  // interiors behind jumpable fences + sealed corners excepted).
  const fw4 = unreached.length === 0 && reachedCells > okCells * 0.85;
  checks.push({
    name: "Fraction Farm world: every challenge, the summit, gate, signposts + chests are reachable on foot",
    pass: fw4,
    detail: fw4 ? `${targets.length} targets reached; ${(100 * reachedCells / okCells).toFixed(0)}% of standable ground connected` : `unreached: ${unreached.join(", ")}; connected ${(100 * reachedCells / okCells).toFixed(0)}%`,
  });

  // FW5) Every challenge STAGE stands on its own LEVEL pad: the pad is flat
  //      (± 2 cm) right across, every key point of the stage (its props, the
  //      player's walk line / viewing spot, its host) is ≥ 1 m inside it, and
  //      challengePadY() is that level (the renderer + camera lift by it).
  const padFails = [];
  for (const f of getFarmPads()) {
    let dev = 0;
    for (let a = 0; a < 24; a++) for (const rr of [0.3, 0.6, 0.88]) {
      const x = f.c[0] + Math.cos((a / 24) * Math.PI * 2) * f.rx * rr;
      const z = f.c[1] + Math.sin((a / 24) * Math.PI * 2) * f.rz * rr;
      if (!onPad(f.id, x, z, 0.8)) continue;
      dev = Math.max(dev, Math.abs(terrainHeight(x, z) - f.level));
    }
    if (dev > 0.02) padFails.push(`${f.id} not level (${dev.toFixed(2)})`);
  }
  const pts = farmStagePoints();
  for (const key of FARM_CAMERA_KEYS) {
    const pid = CHALLENGE_PAD[key];
    if (challengePadY(key) !== farmPadLevel(pid)) padFails.push(`${key} padY`);
    for (const p of pts[key]) {
      if (!onPad(pid, p[0], p[1], 1)) padFails.push(`${key} point (${p[0].toFixed(1)}, ${p[1].toFixed(1)}) off pad`);
      else if (Math.abs(terrainHeight(p[0], p[1]) - farmPadLevel(pid)) > 0.02) padFails.push(`${key} point not level`);
    }
  }
  const fw5 = padFails.length === 0;
  checks.push({
    name: "Fraction Farm world: all ten challenge stages stand on level pads",
    pass: fw5,
    detail: fw5 ? `${FARM_PADS.length} pads level; ${FARM_CAMERA_KEYS.length} stages inside theirs` : padFails.slice(0, 6).join("; "),
  });

  // FW6) The challenge CAMERAS have a clear view: on a wide (16:9) and a
  //      narrow (4:3) screen each camera sits above the ground, the sight
  //      lines to its stage never dip into a hill, and no tree, building or
  //      big prop stands in its view (the scatter keeps them out).
  const P = getFarmProps();
  const tall = [];
  for (const [kind, arr] of Object.entries(P.trees)) for (const t of arr) tall.push({ id: `${kind}`, x: t.x, z: t.z, r: Math.max(FARM_TRUNK_R[kind] * t.s, kind === "poplar" ? 1.2 : kind === "pine" ? 2 : 3) * 0.8, top: t.y + FARM_TREE_H[kind] * t.s });
  for (const f of FARM_FOOTPRINTS) if (f.h > 1.2) tall.push({ id: f.id, foot: f, top: terrainHeight(f.x, f.z) + f.h });
  for (const b of P.bales.round) tall.push({ id: "bale", x: b.x, z: b.z, r: 0.9, top: b.y + 1.5 });
  const camFails = [];
  for (const key of FARM_CAMERA_KEYS) {
    const py = challengePadY(key);
    for (const aspect of [16 / 9, 4 / 3]) {
      const v = farmChallengeView(key, 50, aspect);
      const cam = [v.pos[0], v.pos[1] + py, v.pos[2]];
      if (cam[1] < terrainHeight(cam[0], cam[2]) + 1.5) camFails.push(`${key} camera in the ground`);
      const aims = [[v.look[0], v.look[1] + py, v.look[2]], ...pts[key].map((p) => [p[0], py + 0.8, p[1]])];
      for (const aim of aims) {
        // (A footprint the aim point itself stands in is the target, not a blocker.)
        const own = new Set(FARM_FOOTPRINTS.filter((f) => footprintDist(f, aim[0], aim[2]) < 0.5).map((f) => f.id));
        const L = Math.hypot(aim[0] - cam[0], aim[2] - cam[2]);
        const n = Math.ceil(L / 0.5);
        for (let s = 1; s < n; s++) {
          const t = s / n;
          if (L * (1 - t) < 1.5) break; // the stage's own ground
          const x = cam[0] + (aim[0] - cam[0]) * t, y = cam[1] + (aim[1] - cam[1]) * t, z = cam[2] + (aim[2] - cam[2]) * t;
          if (terrainHeight(x, z) > y - 0.2) { camFails.push(`${key} hill in view (${x.toFixed(0)}, ${z.toFixed(0)})`); break; }
          const hit = tall.find((o) => (o.foot ? footprintDist(o.foot, x, z) < 0 : Math.hypot(o.x - x, o.z - z) < o.r) && o.top > y);
          if (hit && !own.has(hit.id) && !(key === "shop" && hit.id === "water-windmill") && !(key === "shop" && hit.id === "shop")) {
            camFails.push(`${key} ${hit.id} in view`); break;
          }
        }
      }
    }
  }
  const treesInViews = Object.values(P.trees).flat().filter((t) => inFarmCameraView(t.x, t.z, 0)).length;
  if (treesInViews) camFails.push(`${treesInViews} trees inside camera views`);
  const fw6 = camFails.length === 0;
  checks.push({
    name: "Fraction Farm world: every challenge camera has a clear view (16:9 + 4:3)",
    pass: fw6,
    detail: fw6 ? `${FARM_CAMERA_KEYS.length} views × 2 screens clear of hills, trees + buildings` : [...new Set(camFails)].slice(0, 6).join("; "),
  });

  // FW7) WATER + BRIDGES: the creek + duck pond are knee-deep everywhere
  //      (wade, never swim) and only slow you while your feet are in them;
  //      every bridge spans water from dry, step-on banks with its deck clear
  //      of the surface; and the tracks only cross water on a bridge.
  const wFails = [];
  let maxDepth = 0, wet = 0;
  for (let k = 0; k < grid.water.length; k++) {
    if (Number.isNaN(grid.water[k])) continue;
    const d = grid.water[k] - grid.h[k];
    if (d > 0) { wet++; maxDepth = Math.max(maxDepth, d); }
  }
  if (maxDepth > 0.75) wFails.push(`water ${maxDepth.toFixed(2)} m deep`);
  if (wet < 600) wFails.push(`only ${wet} m² of water`);
  const pc = FARM_POND.center;
  if (farmWaterAt(pc[0], pc[1]) === null) wFails.push("pond dry");
  else if (farmSpeedAt(pc[0], pc[1], terrainHeight(pc[0], pc[1])) !== F_WADE_SPEED) wFails.push("no wading in the pond");
  if (farmSpeedAt(sp.x, sp.z, terrainHeight(sp.x, sp.z)) !== 1) wFails.push("slow on land");
  for (const b of FARM_BRIDGES) {
    const m = [(b.from[0] + b.to[0]) / 2, (b.from[1] + b.to[1]) / 2];
    const w = farmWaterAt(m[0], m[1]);
    if (w === null) wFails.push(`${b.id} no water under`);
    else {
      if (b.deckAt(0.5) < w + 0.3) wFails.push(`${b.id} deck in the water`);
      if (farmSpeedAt(m[0], m[1], b.deckAt(0.5)) !== 1) wFails.push(`${b.id} slow on deck`);
    }
    for (const [e, h] of [[b.from, b.h0], [b.to, b.h1]]) {
      if (farmWaterAt(e[0], e[1]) !== null) wFails.push(`${b.id} wet end`);
      if (Math.abs(h - terrainHeight(e[0], e[1])) > STEP_UP) wFails.push(`${b.id} end step`);
    }
    const rails = colliders.filter((c) => c.id.startsWith(`farm-rail-${b.id}-`));
    if (rails.length < 6) wFails.push(`${b.id} rails ${rails.length}`);
  }
  const onBridge = (x, z) => FARM_BRIDGES.some((b) => b.topAt(x, z, Infinity) !== null);
  let wetTrack = 0;
  for (const p of FARM_PATHS) {
    for (const [x, z] of p.pts) if (farmWaterAt(x, z) !== null && !onBridge(x, z)) wetTrack++;
  }
  if (wetTrack) wFails.push(`${wetTrack} track points in the water off a bridge`);
  const fw7 = wFails.length === 0 && FARM_BRIDGES.length >= 3;
  checks.push({
    name: "Fraction Farm world: knee-deep creek + pond; bridges carry every track over",
    pass: fw7,
    detail: fw7 ? `${wet} wet m², max depth ${maxDepth.toFixed(2)} m; ${FARM_BRIDGES.length} bridges` : wFails.slice(0, 6).join("; "),
  });

  // FW8) The SCATTER keeps the farm playable: no tree, rock, bale, log or
  //      stump on a track or a level pad, no tree in the water or inside a
  //      building; every paddock gate is open; the fences are low enough to
  //      vault (jumpable) and the property fence is unbroken + NOT jumpable.
  const sFails = [];
  const scatter = colliders.filter((c) => /^farm-(apple|pear|gum|oak|poplar|willow|pine|amber|rock|bale|sqbale|log|stump)-/.test(c.id));
  for (const c of scatter) {
    const np = nearestPath(c.x, c.z);
    if (np && np.e < c.radius + 0.2) { sFails.push(`${c.id} on track ${np.p.id}`); continue; }
    const pd = nearestPad(c.x, c.z);
    if (pd.e < c.radius && !(c.id.startsWith("farm-sqbale") || c.id.startsWith("farm-bale") || c.id.startsWith("farm-log"))) sFails.push(`${c.id} on pad ${pd.id}`);
  }
  for (const [kind, arr] of Object.entries(P.trees)) {
    for (const t of arr) {
      if (farmWaterAt(t.x, t.z) !== null) sFails.push(`${kind} in water`);
      if (FARM_FOOTPRINTS.some((f) => footprintDist(f, t.x, t.z) < 0)) sFails.push(`${kind} in a building`);
    }
  }
  for (const p of FARM_PADDOCKS) {
    for (const g of [paddockGate(p, p.gate), paddockGate(p, p.gate2)].filter(Boolean)) {
      const mine = colliders.filter((c) => c.id.startsWith(`${p.id}-`));
      if (!mine.length || !mine.every((c) => Math.hypot(c.x - g.x, c.z - g.z) > c.radius + 0.6)) sFails.push(`${p.id} gate sealed`);
    }
  }
  const border = colliders.filter((c) => c.id.startsWith("farm-border-"));
  if (border.some((c) => c.jumpable)) sFails.push("boundary jumpable");
  for (const side of ["n", "s", "w", "e"]) {
    const run = border.filter((c) => c.id.startsWith(`farm-border-${side}-`));
    for (let i = 1; i < run.length; i++) {
      if (Math.hypot(run[i].x - run[i - 1].x, run[i].z - run[i - 1].z) > run[i].radius * 2 + 0.4) sFails.push(`boundary gap ${side}`);
    }
  }
  if (FARM_FENCE_RAIL_TOP >= JUMP_APEX - 0.15) sFails.push("fences too tall to vault");
  const treeCount = Object.values(P.trees).reduce((n, a) => n + a.length, 0);
  const cropCount = Object.values(P.crops).reduce((n, a) => n + a.length, 0);
  if (treeCount < 250) sFails.push(`only ${treeCount} trees`);
  if (cropCount < 1200) sFails.push(`only ${cropCount} crop plants`);
  const fw8 = sFails.length === 0;
  checks.push({
    name: "Fraction Farm world: scatter off tracks + pads, gates open, fences vaultable, boundary sealed",
    pass: fw8,
    detail: fw8 ? `${treeCount} trees, ${cropCount} crop plants, ${scatter.length} scatter colliders; ${FARM_PADDOCKS.length} paddocks` : [...new Set(sFails)].slice(0, 6).join("; "),
  });

  // FW9) THEMED AREAS + DISCOVERY: each challenge sits in its themed area,
  //      the stages are spread out (≥ 30 m apart) and away from the arrival
  //      (≥ 40 m), so the student explores to find them; every signpost
  //      arrow points at a real area.
  const aFails = [];
  for (const key of FARM_CAMERA_KEYS) {
    const area = FARM_AREAS.find((a) => a.challenge === key);
    const c = STAGE_CENTRE[key];
    if (!area) { aFails.push(`${key} has no area`); continue; }
    if (Math.hypot(area.c[0] - c[0], area.c[1] - c[1]) > 10) aFails.push(`${key} away from ${area.name}`);
    if (Math.hypot(c[0] - sp.x, c[1] - sp.z) < 40) aFails.push(`${key} too near the arrival`);
  }
  for (let a = 0; a < FARM_CAMERA_KEYS.length; a++) {
    for (let b = a + 1; b < FARM_CAMERA_KEYS.length; b++) {
      const p = STAGE_CENTRE[FARM_CAMERA_KEYS[a]], q = STAGE_CENTRE[FARM_CAMERA_KEYS[b]];
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 30) aFails.push(`${FARM_CAMERA_KEYS[a]}/${FARM_CAMERA_KEYS[b]} too close`);
    }
  }
  const names = new Set([...FARM_AREAS.map((a) => a.name), "Arrival", "Packing Shed", "Old Sawmill", "Long Paddock", "Glasshouses", "Duck Pond"]);
  for (const s of FARM_SIGNPOSTS) {
    for (const [label] of s.arrows) if (!names.has(label)) aFails.push(`signpost ${s.id}: "${label}"`);
    const np = nearestPath(s.at[0], s.at[1]);
    if (np && np.e < 0.6) aFails.push(`signpost ${s.id} on a track`);
  }
  const fw9 = aFails.length === 0;
  checks.push({
    name: "Fraction Farm world: ten themed areas, challenges spread out to discover",
    pass: fw9,
    detail: fw9 ? `${FARM_AREAS.length} areas; stages ≥ 30 m apart + ≥ 40 m from the gate; ${FARM_SIGNPOSTS.length} signposts` : aFails.slice(0, 6).join("; "),
  });

  return checks;
}
