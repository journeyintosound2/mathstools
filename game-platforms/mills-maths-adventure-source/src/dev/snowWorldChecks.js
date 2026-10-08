/**
 * SNOWBALL SUMS (the big alpine valley, 2026-10-08) — headless WORLD checks
 * SW1–SW10. They read the SAME pure modules the game uses (snowLayout /
 * snowTerrain / snowProps / snowColliders / snowCameras / regions), so a
 * passing run means the walkable valley, its slides, ice, lake, lift and the
 * ten challenge stages + their cameras genuinely agree.
 */
import {
  SNOW_BOUNDS, SNOW_BOUNDARY, SNOW_SPAWN, SNOW_RETURN_PORTAL, SNOW_WELCOME_SIGN, SNOW_RECORDS_STAND, CHALLENGE_PAD,
  SNOW_PADS, SNOW_SIGNPOSTS, SNOW_CHEST_SPOTS, SNOW_CHALLENGE_SPOTS, SNOW_LAKE, ICE_FLOES, ICE_PUDDLES, SNOW_LODGE,
  GIANT_SNOWMAN, FROZEN_FALLS, IGLOO_ISLAND, PENGUIN_FLOE, LODGE_DOOR,
  RANGE_FRAME_POS, RANGE_CRATE_POS, RANGE_VIEW_SPOT, RANGE_SIGN, RINK_GLIDE_LINE, RINK_GLIDE_VIEW_SPOT, RINK_GLIDE_SIGN,
  GROVE_TREE_POS, GROVE_BOX_POS, GROVE_VIEW_SPOT, GROVE_SIGN, MEADOW_TOWER_LEFT, MEADOW_TOWER_RIGHT, MEADOW_VIEW_SPOT,
  MEADOW_SIGN, SLOPE_LANE, SLOPE_VIEW_SPOT, SLOPE_SIGN, VILLAGE_LEFT_STAND, VILLAGE_RIGHT_STAND, VILLAGE_BUILD_SITE,
  VILLAGE_VIEW_SPOT, VILLAGE_SIGN, COLONY_AREA, COLONY_VIEW_SPOT, COLONY_SIGN, CAVE_WALL, CAVE_VIEW_SPOT, CAVE_SIGN,
  YARD_STALL, YARD_BOARD, YARD_VIEW_SPOT, YARD_SIGN, LOOKOUT_DECK, LOOKOUT_VIEW_SPOT, LOOKOUT_SIGN, inAnySnowChallengeView,
} from "../data/snow/snowLayout.js";
import {
  S_STEP_UP, S_SLIDE_SLOPE, LAKE_LEVEL, terrainHeight, slopeAt, snowGroundHeight, snowSlideAt, snowIceAt, snowHazardAt,
  snowIsSafe, snowChuteAt, chuteFrame, liftBoardAt, liftSeatAt, LIFT, LIFT_DISMOUNT, SNOW_TRAILS, nearestTrail,
  nearestPad, onPad, snowPadLevel, challengePadY, getSnowPads, iceKind, inLakeWater, FROZEN_RIVER, SNOW_CHUTE_PATHS,
  SNOW_BRIDGES, ensureSnowStructures, FLOE_TOP, outsideRim, nearestChute, lakeEdgeDist,
} from "../data/snow/snowTerrain.js";
import { getSnowProps, SNOW_FOOTPRINTS, SNOW_TRUNK_R, SNOW_TREE_H, footprintDist, LIFT_TOWERS, liftLineDist } from "../data/snow/snowProps.js";
import { snowChallengeView, SNOW_CAMERA_KEYS, snowParkSpot } from "../data/snow/snowCameras.js";
import { FARM_REGION_ID } from "../data/farm/farmLayout.js";
import { BOUNDARY_FENCE as FARM_FENCE } from "../data/farm/farmLayout.js";
import { farmWaterAt, slopeAt as farmSlope, F_SLIDE_SLOPE } from "../data/farm/farmTerrain.js";
import { getRegion } from "../data/regions.js";
import { getColliders } from "../data/worldColliders.js";
import { PLAYER_RADIUS, STEP_UP } from "../systems/collisionEngine.js";

const REGION = "snow-sums";
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

/** Each challenge's KEY POINTS (its props, the parked player, its host). */
export function snowStagePoints() {
  return {
    range: [RANGE_FRAME_POS, RANGE_CRATE_POS, RANGE_VIEW_SPOT],
    rink: [[RINK_GLIDE_LINE.xMin, RINK_GLIDE_LINE.z], [RINK_GLIDE_LINE.xMax, RINK_GLIDE_LINE.z], RINK_GLIDE_VIEW_SPOT],
    grove: [GROVE_TREE_POS, GROVE_BOX_POS, GROVE_VIEW_SPOT],
    meadow: [MEADOW_TOWER_LEFT, MEADOW_TOWER_RIGHT, MEADOW_VIEW_SPOT],
    sled: [],
    village: [VILLAGE_LEFT_STAND, VILLAGE_RIGHT_STAND, VILLAGE_BUILD_SITE, VILLAGE_VIEW_SPOT],
    colony: [[COLONY_AREA.x - 6, COLONY_AREA.z - 1.4], [COLONY_AREA.x + 6, COLONY_AREA.z + 0.8], COLONY_VIEW_SPOT],
    cave: [[CAVE_WALL.xMin, CAVE_WALL.z], [CAVE_WALL.xMax, CAVE_WALL.z], CAVE_VIEW_SPOT],
    yard: [YARD_STALL, YARD_BOARD, YARD_VIEW_SPOT],
    lights: [LOOKOUT_DECK, LOOKOUT_VIEW_SPOT],
  };
}
const SIGN_OF = {
  range: RANGE_SIGN, rink: RINK_GLIDE_SIGN, grove: GROVE_SIGN, meadow: MEADOW_SIGN, sled: SLOPE_SIGN, village: VILLAGE_SIGN,
  colony: COLONY_SIGN, cave: CAVE_SIGN, yard: YARD_SIGN, lights: LOOKOUT_SIGN,
};
const SPOT_ID = { range: "range", rink: "rink", grove: "pines", meadow: "snowmen", sled: "sled", village: "village", colony: "colony", cave: "cave", yard: "lodgeyard", lights: "lights" };

export function runSnowWorldChecks() {
  const checks = [];
  ensureSnowStructures();
  const region = getRegion(REGION);
  const colliders = getColliders({}, REGION);
  const blockedAt = colliderLookup(colliders);
  const sp = SNOW_SPAWN;
  const [bx, bz] = SNOW_RETURN_PORTAL;
  const back = (region.portals || []).find((p) => p.target === "island-1");
  const door = (region.portals || []).find((p) => p.target === "cabin");

  // SW1) Region hooks + gates + spawn: every snow hook is wired (layered
  //      ground, slides, ice, the cold lake, chutes, the lift), the return
  //      gate + lodge door stand on safe ground, the spawn is safe, collider-
  //      free and outside the gate's trigger; step-up agrees with the engine.
  const hooksOk = Boolean(region) && region.bounds === SNOW_BOUNDS && region.groundHeight === snowGroundHeight &&
    region.slideAt === snowSlideAt && region.iceAt === snowIceAt && region.isLava === snowHazardAt &&
    region.isSafe === snowIsSafe && region.chuteAt === snowChuteAt && region.chuteFrame === chuteFrame &&
    region.liftBoardAt === liftBoardAt && region.liftSeatAt === liftSeatAt && region.liftDismount === LIFT_DISMOUNT &&
    region.liftLength === LIFT.len && region.liftSpeed > 0 && typeof region.hazardHint === "string" &&
    region.cameraTerrainClamp === true && region.maxFrameDelta > 0 && region.maxFrameDelta <= 0.1 && region.arriveYaw === 0;
  const backOk = Boolean(back) && back.position === SNOW_RETURN_PORTAL && snowIsSafe(bx, bz) && outsideRim(bx, bz) < -3;
  const doorOk = Boolean(door) && Math.hypot(door.position[0] - LODGE_DOOR[0], door.position[1] - LODGE_DOOR[1]) < 1.5 &&
    snowIsSafe(door.position[0], door.position[1] + 2.5);
  const spawnOk = snowIsSafe(sp.x, sp.z) && !blockedAt(sp.x, sp.z, terrainHeight(sp.x, sp.z)) &&
    Math.hypot(sp.x - bx, sp.z - bz) > back.radius + 2 && region.spawn.x === sp.x && region.spawn.z === sp.z;
  const boundsOk = SNOW_BOUNDS.width / 2 > SNOW_BOUNDARY.halfW && SNOW_BOUNDS.height / 2 > SNOW_BOUNDARY.halfD &&
    SNOW_BOUNDS.width / 2 < SNOW_BOUNDARY.halfW + 6;
  const sw1 = hooksOk && backOk && doorOk && spawnOk && boundsOk && S_STEP_UP === STEP_UP;
  checks.push({
    name: "Snowball Sums world: terrain/ice/lake/chute/lift hooks + gates + safe spawn",
    pass: sw1,
    detail: sw1 ? `spawn (${sp.x}, ${sp.z}) at ${terrainHeight(sp.x, sp.z).toFixed(1)} m; step-up ${STEP_UP}` : `hooks:${hooksOk} back:${backOk} door:${doorOk} spawn:${spawnOk} bounds:${boundsOk}`,
  });

  // SW2) SIZE: the same size as Fraction Farm (and so the jungle) — walkable
  //      land inside the rim (dry, not too steep; ice counts, the lake
  //      doesn't) within ±25 % of the farm's — and genuinely HILLY.
  let land = 0;
  for (let x = -SNOW_BOUNDARY.halfW; x <= SNOW_BOUNDARY.halfW; x += 1) {
    for (let z = -SNOW_BOUNDARY.halfD; z <= SNOW_BOUNDARY.halfD; z += 1) {
      if (inLakeWater(x, z) || slopeAt(x, z) >= S_SLIDE_SLOPE) continue;
      land++;
    }
  }
  let fland = 0;
  for (let x = -FARM_FENCE.halfW; x <= FARM_FENCE.halfW; x += 1) {
    for (let z = -FARM_FENCE.halfD; z <= FARM_FENCE.halfD; z += 1) {
      if (farmWaterAt(x, z) !== null || farmSlope(x, z) >= F_SLIDE_SLOPE) continue;
      fland++;
    }
  }
  const ratio = land / fland;
  let hMin = Infinity, hMax = -Infinity;
  for (let x = -SNOW_BOUNDARY.halfW; x <= SNOW_BOUNDARY.halfW; x += 2) {
    for (let z = -SNOW_BOUNDARY.halfD; z <= SNOW_BOUNDARY.halfD; z += 2) {
      const h = terrainHeight(x, z);
      hMin = Math.min(hMin, h); hMax = Math.max(hMax, h);
    }
  }
  const sw2 = ratio > 0.8 && ratio < 1.25 && hMax - hMin > 18 && FARM_REGION_ID !== REGION;
  checks.push({
    name: "Snowball Sums world: Fraction Farm's size, and hilly",
    pass: sw2,
    detail: `walkable ${land} m² = ${ratio.toFixed(2)}× the farm's ${fland} m²; heights ${hMin.toFixed(1)}…${hMax.toFixed(1)} m`,
  });

  // SW3) Every snow TRAIL is walkable end to end (bridges carry it over the
  //      river + lake): each 0.4 m step rises ≤ STEP_UP, nothing slides, no
  //      collider stands on it, it never runs through the icy lake or down a
  //      chute, and the grade stays walkable (≤ 0.6, well under a slide).
  let badRise = 0, slides = 0, samples = 0, maxGrade = 0, gradeAt = "", wet = 0, chuted = 0;
  const blocked = [];
  const onBridge = (x, z) => SNOW_BRIDGES.some((br) => br.topAt(x, z, Infinity) !== null);
  for (const p of SNOW_TRAILS) {
    let h = null;
    for (let i = 0; i < p.pts.length - 1; i++) {
      const [ax, az] = p.pts[i], [cx, cz] = p.pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(cx - ax, cz - az) / 0.4));
      for (let k = 0; k < n; k++) {
        const x = ax + ((cx - ax) * k) / n, z = az + ((cz - az) * k) / n;
        const nh = snowGroundHeight(x, z, h === null ? terrainHeight(x, z) : h);
        if (h !== null && nh - h > STEP_UP) badRise++;
        if (snowSlideAt(x, z, nh)) slides++;
        if (snowHazardAt(x, z, nh)) wet++;
        if (snowChuteAt(x, z, nh)) chuted++;
        const b = blockedAt(x, z, nh, 0.2);
        if (b && blocked.length < 6) blocked.push(`${p.id}:${b.id}`);
        if (!onBridge(x, z)) {
          const s = slopeAt(x, z);
          if (s > maxGrade) { maxGrade = s; gradeAt = `${p.id} (${x.toFixed(0)}, ${z.toFixed(0)})`; }
        }
        h = nh;
        samples++;
      }
    }
  }
  const sw3 = badRise === 0 && slides === 0 && wet === 0 && chuted === 0 && blocked.length === 0 && maxGrade <= 0.6;
  checks.push({
    name: "Snowball Sums world: every snow trail is walkable end to end",
    pass: sw3,
    detail: sw3 ? `${SNOW_TRAILS.length} trails, ${samples} steps, steepest grade ${maxGrade.toFixed(2)}` : `rise:${badRise} slide:${slides} wet:${wet} chute:${chuted} blocked:${blocked.join(", ")} grade:${maxGrade.toFixed(2)} at ${gradeAt}`,
  });

  // SW4) REACHABLE on foot (no jumps, no chute rides, no lift): flood-fill a
  //      0.5 m grid of standable ground from the spawn. It must reach every
  //      challenge's viewing spot + host, the lodge door, the trophy stand,
  //      the gate, every signpost + chest spot, the lift's boarding spot,
  //      both chute tops, the summit, Igloo Island + the Penguin Floe (over
  //      the bridges), the cave, the falls pool and the giant snowman.
  const S = 0.5;
  const X0 = -SNOW_BOUNDARY.halfW, Z0 = -SNOW_BOUNDARY.halfD;
  const nx = Math.round((2 * SNOW_BOUNDARY.halfW) / S) + 1, nz = Math.round((2 * SNOW_BOUNDARY.halfD) / S) + 1;
  const hg = new Float32Array(nx * nz);
  const ok = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    const z = Z0 + j * S;
    for (let i = 0; i < nx; i++) {
      const x = X0 + i * S;
      const t = terrainHeight(x, z);
      const h = snowGroundHeight(x, z, t);
      if (snowSlideAt(x, z, h) || snowHazardAt(x, z, h) || snowChuteAt(x, z, h)) continue;
      if (blockedAt(x, z, h, 0.35)) continue;
      ok[j * nx + i] = 1;
      hg[j * nx + i] = h;
    }
  }
  // Bridge decks: the flood fill also walks along every deck (layered),
  // across its whole width inside the rails.
  for (const b of SNOW_BRIDGES) {
    const L = Math.hypot(b.to[0] - b.from[0], b.to[1] - b.from[1]);
    const ux = (b.to[0] - b.from[0]) / L, uz = (b.to[1] - b.from[1]) / L;
    for (let s = 0; s <= L; s += 0.25) {
      const t = s / L;
      for (let o = -(b.halfWidth - 0.3); o <= b.halfWidth - 0.3; o += 0.25) {
        const x = b.from[0] + (b.to[0] - b.from[0]) * t - uz * o, z = b.from[1] + (b.to[1] - b.from[1]) * t + ux * o;
        const i = Math.round((x - X0) / S), j = Math.round((z - Z0) / S);
        if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
        ok[j * nx + i] = 1;
        hg[j * nx + i] = b.deckAt(t);
      }
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
    ...SNOW_CAMERA_KEYS.map((k) => [`${k}-view`, snowParkSpot(k), 1.4]),
    ...SNOW_CAMERA_KEYS.map((k) => [`${k}-host`, SIGN_OF[k].position, 2.2]),
    ["welcome", SNOW_WELCOME_SIGN.position, 2.2],
    ["records", SNOW_RECORDS_STAND.position, 4.6],
    ["return-gate", [bx, bz - 2.5], 1.8],
    ["lodge-door", [LODGE_DOOR[0], LODGE_DOOR[1] + 1.6], 1.4],
    ["lift-board", LIFT.from, 1.4],
    ["lift-dismount", LIFT_DISMOUNT, 1.5],
    ...SNOW_CHUTE_PATHS.map((c) => [`chute-top-${c.id}`, [c.pts[0][0] - (c.pts[1][0] - c.pts[0][0]) * 1.2, c.pts[0][1] - (c.pts[1][1] - c.pts[0][1]) * 1.2], 2.5]),
    ["igloo-island", IGLOO_ISLAND.center, 3],
    ["penguin-floe", PENGUIN_FLOE.center, 3],
    ["giant-snowman", [GIANT_SNOWMAN.position[0], GIANT_SNOWMAN.position[1] - 6.5], 2.5],
    ["falls-pool", [FROZEN_FALLS.position[0], FROZEN_FALLS.position[1] + 9], 2.5],
    ...SNOW_SIGNPOSTS.map((s) => [`signpost-${s.id}`, s.p, 1.8]),
    ...SNOW_SIGNPOSTS.flatMap((s) => s.arrows.map(([label, to]) => [`arrow ${s.id}→${label}`, to, 6])),
    ...SNOW_CHEST_SPOTS.map((p, i) => [`chest-${i}`, p, 1.6]),
  ];
  const unreached = targets.filter(([, p, rad]) => !reach(p, rad)).map(([id]) => id);
  const sw4 = unreached.length === 0 && reachedCells > okCells * 0.85;
  checks.push({
    name: "Snowball Sums world: every challenge, the lift, chute tops, islands, signposts + chests reachable on foot",
    pass: sw4,
    detail: sw4 ? `${targets.length} targets reached; ${(100 * reachedCells / okCells).toFixed(0)}% of standable ground connected` : `unreached: ${unreached.slice(0, 8).join(", ")}; connected ${(100 * reachedCells / okCells).toFixed(0)}%`,
  });

  // SW5) LEVEL PADS: every pad is flat (± 2 cm) right across (the sled run is
  //      a clean incline at its grade instead), every key point of each stage
  //      is ≥ 1 m inside its pad at its level, the hosts stand at the stage's
  //      level, and challengePadY() is that level.
  const padFails = [];
  for (const f of getSnowPads()) {
    let dev = 0;
    for (let a = 0; a < 24; a++) for (const rr of [0.3, 0.6, 0.88]) {
      const x = f.c[0] + Math.cos((a / 24) * Math.PI * 2) * f.rx * rr;
      const z = f.c[1] + Math.sin((a / 24) * Math.PI * 2) * f.rz * rr;
      if (!onPad(f.id, x, z, 1.3)) continue;
      const want = f.incline ? f.level + f.incline.gx * (x - f.c[0]) + f.incline.gz * (z - f.c[1]) : f.level;
      dev = Math.max(dev, Math.abs(terrainHeight(x, z) - want));
    }
    if (dev > 0.02) padFails.push(`${f.id} not level (${dev.toFixed(2)})`);
  }
  const pts = snowStagePoints();
  for (const key of SNOW_CAMERA_KEYS) {
    const pid = CHALLENGE_PAD[key];
    if (!pid) continue;
    if (challengePadY(key) !== snowPadLevel(pid)) padFails.push(`${key} padY`);
    for (const p of pts[key]) {
      if (!onPad(pid, p[0], p[1], 1)) padFails.push(`${key} point (${p[0].toFixed(1)}, ${p[1].toFixed(1)}) off pad`);
      else if (Math.abs(terrainHeight(p[0], p[1]) - snowPadLevel(pid)) > 0.02) padFails.push(`${key} point not level`);
    }
    const sg = SIGN_OF[key].position;
    if (Math.abs(terrainHeight(sg[0], sg[1]) - snowPadLevel(pid)) > 0.6) padFails.push(`${key} host off level`);
  }
  // The sled run: both ends of its lane on the incline, view spot gentle.
  const sledPad = getSnowPads().find((f) => f.incline);
  if (!sledPad || !onPad(sledPad.id, SLOPE_LANE.xBottom, SLOPE_LANE.z, 0.5) || !onPad(sledPad.id, SLOPE_LANE.xTop, SLOPE_LANE.z, 0.5)) padFails.push("sled lane off its run");
  const sw5 = padFails.length === 0;
  checks.push({
    name: "Snowball Sums world: all ten challenge stages stand on level pads",
    pass: sw5,
    detail: sw5 ? `${SNOW_PADS.length} pads level; ${SNOW_CAMERA_KEYS.length} stages inside theirs` : padFails.slice(0, 6).join("; "),
  });

  // SW6) The challenge CAMERAS have a clear view: on a wide (16:9) and a
  //      narrow (4:3) screen each camera sits above the ground, the sight
  //      lines to its stage never dip into a hill, and no tree, building or
  //      big prop stands in its view (the scatter keeps them out).
  const P = getSnowProps();
  const tall = [];
  for (const [kind, arr] of Object.entries(P.trees)) for (const t of arr) tall.push({ id: kind, x: t.x, z: t.z, r: Math.max(SNOW_TRUNK_R[kind] * t.s, kind === "spiky" ? 1.6 : kind === "birch" ? 1.2 : 2.6) * 0.8, top: t.y + SNOW_TREE_H[kind] * t.s });
  for (const f of SNOW_FOOTPRINTS) if (f.h > 1.2) tall.push({ id: f.id, foot: f, top: terrainHeight(f.x, f.z) + f.h });
  for (const c of P.crags) tall.push({ id: "crag", x: c.x, z: c.z, r: 0.9 * c.s, top: c.y + 1.4 * c.s });
  const camFails = [];
  for (const key of SNOW_CAMERA_KEYS) {
    const py = challengePadY(key);
    for (const aspect of [16 / 9, 4 / 3]) {
      const v = snowChallengeView(key, 50, aspect);
      const cam = [v.pos[0], v.pos[1] + py, v.pos[2]];
      if (cam[1] < terrainHeight(cam[0], cam[2]) + 1.2) camFails.push(`${key} camera in the ground`);
      // (The look point sits a little BELOW the activity — the scene rides
      // up clear of the bottom-docked card — so aim at it from above ground.)
      const aims = [[v.look[0], Math.max(v.look[1], 0.6) + py, v.look[2]], ...pts[key].map((p) => [p[0], py + 0.8, p[1]])];
      for (const aim of aims) {
        const own = new Set(SNOW_FOOTPRINTS.filter((f) => footprintDist(f, aim[0], aim[2]) < 0.5).map((f) => f.id));
        const L = Math.hypot(aim[0] - cam[0], aim[2] - cam[2]);
        const n = Math.ceil(L / 0.5);
        for (let s = 1; s < n; s++) {
          const t = s / n;
          if (L * (1 - t) < 1.5) break;
          const x = cam[0] + (aim[0] - cam[0]) * t, y = cam[1] + (aim[1] - cam[1]) * t, z = cam[2] + (aim[2] - cam[2]) * t;
          if (terrainHeight(x, z) > y - 0.2) { camFails.push(`${key} hill in view (${x.toFixed(0)}, ${z.toFixed(0)})`); break; }
          const hit = tall.find((o) => (o.foot ? footprintDist(o.foot, x, z) < 0 : Math.hypot(o.x - x, o.z - z) < o.r) && o.top > y);
          if (hit && !own.has(hit.id)) { camFails.push(`${key} ${hit.id} in view`); break; }
        }
      }
    }
  }
  const treesInViews = Object.values(P.trees).flat().filter((t) => inAnySnowChallengeView(t.x, t.z, 0)).length;
  // Street furniture (lamps, signposts, candy canes, snowmen, decorated
  // trees) stays out of every challenge's shot too.
  for (const f of SNOW_FOOTPRINTS) {
    if (!/^(lamp|signpost|cane|snowman|xmas)-/.test(f.id)) continue;
    if (inAnySnowChallengeView(f.x, f.z, f.r || 0)) camFails.push(`${f.id} in a camera view`);
  }
  if (treesInViews) camFails.push(`${treesInViews} trees inside camera views`);
  const sw6 = camFails.length === 0;
  checks.push({
    name: "Snowball Sums world: every challenge camera has a clear view (16:9 + 4:3)",
    pass: sw6,
    detail: sw6 ? `${SNOW_CAMERA_KEYS.length} views × 2 screens clear of hills, trees + buildings` : [...new Set(camFails)].slice(0, 6).join("; "),
  });

  // SW7) ICE + THE COLD LAKE: the pond, river, puddles + runouts are
  //      slippery ice (and not on a bridge deck); the river always falls
  //      from the falls pool to the pond; the lake is a hazard in its water
  //      but never on the islands, bridges or floes; every bridge spans from
  //      dry, step-on ends with its deck clear of the water (rails both
  //      sides); the floe hops are short enough to jump.
  const wFails = [];
  const [pcx, pcz] = SNOW_PADS.find((f) => f.id === "pond").c;
  if (!snowIceAt(pcx, pcz) || iceKind(pcx, pcz) !== "pond") wFails.push("pond not ice");
  for (const [x, z] of ICE_PUDDLES) if (iceKind(x, z) !== "puddle") wFails.push(`puddle (${x}, ${z}) dry`);
  const mid = FROZEN_RIVER.pts[Math.floor(FROZEN_RIVER.pts.length / 2)];
  if (iceKind(mid[0], mid[1]) !== "river") wFails.push("river not ice");
  for (let i = 1; i < FROZEN_RIVER.lvl.length; i++) if (FROZEN_RIVER.lvl[i] > FROZEN_RIVER.lvl[i - 1] + 1e-6) { wFails.push("river runs uphill"); break; }
  if (snowIceAt(sp.x, sp.z)) wFails.push("spawn icy");
  let lakeCells = 0, lakeHazard = 0;
  for (let x = SNOW_LAKE.center[0] - SNOW_LAKE.rx; x <= SNOW_LAKE.center[0] + SNOW_LAKE.rx; x += 2) {
    for (let z = SNOW_LAKE.center[1] - SNOW_LAKE.rz; z <= SNOW_LAKE.center[1] + SNOW_LAKE.rz; z += 2) {
      if (!inLakeWater(x, z)) continue;
      lakeCells++;
      if (snowHazardAt(x, z, terrainHeight(x, z))) lakeHazard++;
    }
  }
  if (lakeCells < 400 || lakeHazard < lakeCells * 0.9) wFails.push(`lake hazard ${lakeHazard}/${lakeCells}`);
  for (const id of ["igloo-island", "penguin-floe"]) {
    const f = SNOW_PADS.find((q) => q.id === id);
    if (snowHazardAt(f.c[0], f.c[1], terrainHeight(f.c[0], f.c[1]))) wFails.push(`${id} is water`);
    if (terrainHeight(f.c[0], f.c[1]) < LAKE_LEVEL + 0.3) wFails.push(`${id} awash`);
  }
  for (const f of ICE_FLOES) if (snowHazardAt(f.c[0], f.c[1], FLOE_TOP)) wFails.push("floe is water");
  for (let i = 1; i < 3; i++) {
    const a = ICE_FLOES[i - 1], b = ICE_FLOES[i];
    if (Math.hypot(a.c[0] - b.c[0], a.c[1] - b.c[1]) - a.r - b.r > 2.0) wFails.push("floe hop too far");
  }
  for (const b of SNOW_BRIDGES) {
    const m = [(b.from[0] + b.to[0]) / 2, (b.from[1] + b.to[1]) / 2];
    const lake = inLakeWater(m[0], m[1]);
    const river = iceKind(m[0], m[1]) === "river";
    if (!lake && !river) wFails.push(`${b.id} spans nothing`);
    if (lake && b.deckAt(0.5) < LAKE_LEVEL + 0.3) wFails.push(`${b.id} deck in the water`);
    if (snowHazardAt(m[0], m[1], b.deckAt(0.5))) wFails.push(`${b.id} deck cold`);
    if (snowIceAt(m[0], m[1], b.deckAt(0.5))) wFails.push(`${b.id} deck icy`);
    for (const [e, h] of [[b.from, b.h0], [b.to, b.h1]]) {
      if (inLakeWater(e[0], e[1])) wFails.push(`${b.id} wet end`);
      if (Math.abs(h - terrainHeight(e[0], e[1])) > STEP_UP) wFails.push(`${b.id} end step`);
    }
    const rails = colliders.filter((c) => c.id.startsWith(`snow-rail-${b.id}-`));
    if (rails.length < 6) wFails.push(`${b.id} rails ${rails.length}`);
  }
  if (SNOW_BRIDGES.length < 4) wFails.push(`only ${SNOW_BRIDGES.length} bridges`);
  const sw7 = wFails.length === 0;
  checks.push({
    name: "Snowball Sums world: slippery ice, an icy lake to avoid, bridges + floes to cross it",
    pass: sw7,
    detail: sw7 ? `${lakeCells * 4} m² of lake (${lakeHazard} hazard samples); ${SNOW_BRIDGES.length} bridges; ${ICE_FLOES.length} floes` : [...new Set(wFails)].slice(0, 6).join("; "),
  });

  // SW8) SLIDING + THE LIFT: each toboggan chute always falls (every
  //      segment between 0.05 and 0.55 grade), its trough is detected (and
  //      its berm crest isn't), it ends on runout ice or the pond — never in
  //      the lake; the lift's boarding spot is standable, the gondola path
  //      clears the hillside (feet ≥ 1.2 m up, 3 m+ along the span), the
  //      towers stand clear of it, and
  //      the dismount lands on the summit pad, safe.
  const lFails = [];
  for (const c of SNOW_CHUTE_PATHS) {
    for (let i = 1; i < c.prof.length; i++) {
      const g = (c.prof[i - 1] - c.prof[i]) / Math.max(1e-6, c.s[i] - c.s[i - 1]);
      if (g < 0.05 || g > 0.55) { lFails.push(`${c.id} grade ${g.toFixed(2)} at ${i}`); break; }
    }
    const f = chuteFrame(c, c.len / 2);
    if (!snowChuteAt(f.x, f.z, f.h)) lFails.push(`${c.id} trough not detected`);
    if (snowChuteAt(f.x - f.tz * (c.hw + 1.6), f.z + f.tx * (c.hw + 1.6), terrainHeight(f.x - f.tz * (c.hw + 1.6), f.z + f.tx * (c.hw + 1.6)))) lFails.push(`${c.id} berm counts as chute`);
    const [ex, ez] = c.pts[c.pts.length - 1];
    const k = iceKind(ex + (ex - c.pts[c.pts.length - 2][0]) * 0.5, ez + (ez - c.pts[c.pts.length - 2][1]) * 0.5);
    if (k !== "runout" && k !== "pond") lFails.push(`${c.id} exits onto ${k}`);
    if (inLakeWater(ex, ez)) lFails.push(`${c.id} ends in the lake`);
    if (c.prof[0] - c.prof[c.prof.length - 1] < 6) lFails.push(`${c.id} only drops ${(c.prof[0] - c.prof[c.prof.length - 1]).toFixed(1)} m`);
  }
  if (!liftBoardAt(LIFT.from[0], LIFT.from[1]) || slopeAt(LIFT.from[0], LIFT.from[1]) > 0.3) lFails.push("boarding spot");
  let minClear = Infinity;
  for (let t = 0.04; t <= 0.96; t += 0.01) {
    const s = liftSeatAt(t);
    minClear = Math.min(minClear, s.y - terrainHeight(s.x, s.z));
    for (const tw of LIFT_TOWERS) if (Math.hypot(tw.x - s.x, tw.z - s.z) < 1.0) lFails.push("tower in the gondola's way");
  }
  if (minClear < 1.2) lFails.push(`gondola clears by only ${minClear.toFixed(2)} m`);
  if (!onPad("sled-summit", LIFT_DISMOUNT[0], LIFT_DISMOUNT[1], 0.5) || !snowIsSafe(LIFT_DISMOUNT[0], LIFT_DISMOUNT[1])) lFails.push("dismount not on the summit");
  if (LIFT.len < 40) lFails.push("lift too short");
  // The rim walls slide you back INTO the valley.
  const rimProbe = [[0, -SNOW_BOUNDARY.halfD - 6], [SNOW_BOUNDARY.halfW + 6, 0], [-SNOW_BOUNDARY.halfW - 6, 0], [0, SNOW_BOUNDARY.halfD + 6]];
  for (const [x, z] of rimProbe) {
    const d = snowSlideAt(x, z, terrainHeight(x, z));
    if (!d || d.x * x + d.z * z > 0) lFails.push(`rim (${x}, ${z}) doesn't slide inward`);
  }
  const sw8 = lFails.length === 0;
  checks.push({
    name: "Snowball Sums world: chutes always fall onto ice; the lift clears the hill to the summit; the rim slides you home",
    pass: sw8,
    detail: sw8 ? `${SNOW_CHUTE_PATHS.map((c) => `${c.id} ${c.len.toFixed(0)} m / drop ${(c.prof[0] - c.prof[c.prof.length - 1]).toFixed(1)} m`).join(", ")}; lift ${LIFT.len.toFixed(0)} m, min clearance ${minClear.toFixed(1)} m` : [...new Set(lFails)].slice(0, 6).join("; "),
  });

  // SW9) The SCATTER keeps the valley playable: no tree, rock, log or stump
  //      on a trail, a level pad, a chute, the ice, in the lake or under the
  //      lift; the boundary is unbroken + NOT jumpable; it's a real forest.
  const sFails = [];
  const scatter = colliders.filter((c) => /^snow-(fir|spruce|spiky|birch|rock|crag|log|stump)-/.test(c.id));
  for (const c of scatter) {
    const nt = nearestTrail(c.x, c.z);
    if (nt && nt.e < c.radius + 0.2) { sFails.push(`${c.id} on trail ${nt.p ? nt.p.id : ""}`); continue; }
    const pd = nearestPad(c.x, c.z);
    if (pd.e < c.radius && pd.id !== "snowman-top") sFails.push(`${c.id} on pad ${pd.id}`);
    if (iceKind(c.x, c.z)) sFails.push(`${c.id} on ice`);
    if (inLakeWater(c.x, c.z) && !/rock/.test(c.id)) sFails.push(`${c.id} in the lake`);
    const nc = nearestChute(c.x, c.z);
    if (nc && nc.d < nc.c.hw + c.radius) sFails.push(`${c.id} in a chute`);
    if (/fir|spruce|spiky|birch/.test(c.id) && liftLineDist(c.x, c.z) < 3) sFails.push(`${c.id} under the lift`);
  }
  for (const [kind, arr] of Object.entries(P.trees)) {
    for (const t of arr) if (outsideRim(t.x, t.z) < -2 && SNOW_FOOTPRINTS.some((f) => footprintDist(f, t.x, t.z) < 0)) sFails.push(`${kind} in a building`);
  }
  const border = colliders.filter((c) => c.id.startsWith("snow-border-"));
  if (border.some((c) => c.jumpable)) sFails.push("boundary jumpable");
  for (const side of ["n", "s", "w", "e"]) {
    const run = border.filter((c) => c.id.startsWith(`snow-border-${side}`));
    if (run.length < 10) sFails.push(`boundary ${side} short`);
    for (let i = 1; i < run.length; i++) {
      if (Math.hypot(run[i].x - run[i - 1].x, run[i].z - run[i - 1].z) > run[i].radius * 2 + 0.4) sFails.push(`boundary gap ${side}`);
    }
  }
  const treeCount = Object.values(P.trees).reduce((n, a) => n + a.length, 0);
  if (treeCount < 800) sFails.push(`only ${treeCount} trees`);
  const sw9 = sFails.length === 0;
  checks.push({
    name: "Snowball Sums world: scatter off trails, pads, chutes, ice + the lift line; boundary sealed",
    pass: sw9,
    detail: sw9 ? `${treeCount} trees, ${scatter.length} scatter colliders, ${border.length} boundary posts` : [...new Set(sFails)].slice(0, 6).join("; "),
  });

  // SW10) DISCOVERY: the ten challenge areas are spread out (≥ 30 m apart)
  //       and away from the arrival (≥ 40 m) so the student explores to find
  //       them; each challenge's spot sits by its stage; signposts stand off
  //       the trails; the giant snowman, falls, lift + lake are in the valley.
  const aFails = [];
  const centre = (k) => SNOW_CHALLENGE_SPOTS.find((s) => s.id === SPOT_ID[k]).center;
  for (const k of SNOW_CAMERA_KEYS) {
    const c = centre(k);
    if (Math.hypot(c[0] - sp.x, c[1] - sp.z) < 40) aFails.push(`${k} too near the arrival`);
    const park = snowParkSpot(k);
    if (Math.hypot(c[0] - park[0], c[1] - park[1]) > 14) aFails.push(`${k} spot far from its stage`);
  }
  for (let a = 0; a < SNOW_CAMERA_KEYS.length; a++) {
    for (let b = a + 1; b < SNOW_CAMERA_KEYS.length; b++) {
      const p = centre(SNOW_CAMERA_KEYS[a]), q = centre(SNOW_CAMERA_KEYS[b]);
      if (Math.hypot(p[0] - q[0], p[1] - q[1]) < 30) aFails.push(`${SNOW_CAMERA_KEYS[a]}/${SNOW_CAMERA_KEYS[b]} too close`);
    }
  }
  for (const s of SNOW_SIGNPOSTS) {
    const nt = nearestTrail(s.p[0], s.p[1]);
    if (nt && nt.e < 0.6) aFails.push(`signpost ${s.id} on a trail`);
  }
  for (const [name, [x, z]] of [["giant snowman", GIANT_SNOWMAN.position], ["falls", FROZEN_FALLS.position], ["lift", LIFT.to], ["lake", SNOW_LAKE.center], ["lodge", [SNOW_LODGE.x, SNOW_LODGE.z]]]) {
    if (Math.abs(x) > SNOW_BOUNDARY.halfW || Math.abs(z) > SNOW_BOUNDARY.halfD) aFails.push(`${name} outside the valley`);
  }
  const sw10 = aFails.length === 0;
  checks.push({
    name: "Snowball Sums world: ten challenge areas spread out to discover",
    pass: sw10,
    detail: sw10 ? `stages ≥ 30 m apart + ≥ 40 m from the gate; ${SNOW_SIGNPOSTS.length} signposts` : aFails.slice(0, 6).join("; "),
  });

  return checks;
}
