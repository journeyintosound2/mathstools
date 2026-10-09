/**
 * NUMBER ISLAND (rebuilt 2026-10-09) — headless WORLD checks IL1–IL10. They
 * read the SAME pure modules the game uses (islandLayout / islandTerrain /
 * islandProps / islandColliders / wallView / achievements / regions), so a
 * passing run means the walkable island, its water + lava, the five world
 * gates, the Achievements Wall + its look camera, and the title flyover
 * genuinely agree.
 */
import * as THREE from "three";

import {
  ISLAND_BOUNDS, ISLAND_SPAWN, GATES, ISLAND_PADS, ISLAND_AREAS, ISLAND_SIGNPOSTS, ISLAND_CHEST_SPOTS, PLAZA,
  ISLAND_JETTY, COVE_PIER, ROPE_BRIDGE, ISLET, LAGOON, LIGHTHOUSE, FROSTY_PEAK, EMBER_PEAK, ACHIEVEMENT_WALL,
  PIP_SPOT, FERN_SPOT, ALBY_SPOT, MILLS_SPOT, ISLAND_ARCH, SEA_Y,
} from "../data/island/islandLayout.js";
import {
  I_STEP_UP, I_DEEP, I_WADE_SPEED, terrainHeight, slopeAt, islandGroundHeight, islandSlideAt, islandSpeedAt, islandHazardAt,
  islandHazardInfo, islandIsSafe, islandWaterAt, ISLAND_PATHS, nearestPath, onPad, islandPadLevel, getIslandPads,
  getIslandDecks, isLavaAt, LAVA_STREAM, PLAZA_DECK_Y, SEA_HINT, LAVA_HINT_ISLAND, snowCover, coastSD,
} from "../data/island/islandTerrain.js";
import { getIslandProps, ISLAND_FOOTPRINTS, footprintDist } from "../data/island/islandProps.js";
import {
  WALL_BOARDS, WALL_GEOM, boardLocalX, wallToWorld, worldToWall, wallViewCamera, inWallPromptZone, wallBaseY,
} from "../data/island/wallView.js";
import { achievementsSummary } from "../data/island/achievements.js";
import { TITLE_SHOTS, TITLE_MIN_CLEARANCE } from "../data/island/titleShots.js";
import { FARM_BEST_KEYS, FARM_MAX_SCORES } from "../data/farm/farmRecords.js";
import { getRegion, getAllRegions } from "../data/regions.js";
import { getColliders } from "../data/worldColliders.js";
import { INTERACTABLES } from "../data/interactables.js";
import { PLAYER_RADIUS, STEP_UP } from "../systems/collisionEngine.js";

const REGION = "island-1";
const OLD_WALKABLE_RADIUS = 38; // the flat island this replaced (2026-07 → 10)

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
  return (x, z, h, pad = PLAYER_RADIUS * 0.9, ignore = null) => {
    const arr = map.get(Math.floor(x / cell) * 8192 + Math.floor(z / cell));
    if (!arr) return null;
    for (const c of arr) {
      if (ignore && ignore(c)) continue;
      if (c.yMin !== undefined && h < c.yMin) continue;
      if (c.yMax !== undefined && h > c.yMax) continue;
      if (Math.hypot(x - c.x, z - c.z) < c.radius + pad) return c;
    }
    return null;
  };
}

export function runIslandWorldChecks() {
  const checks = [];
  const region = getRegion(REGION);
  const colliders = getColliders({ completedMissions: [], earnedBadges: [], completedEncounters: [] }, REGION);
  const blockedAt = colliderLookup(colliders);
  const sp = ISLAND_SPAWN;
  const gateList = Object.values(GATES);
  const portalFor = (id) => (region.portals || []).find((p) => Math.hypot(p.position[0] - GATES[id].position[0], p.position[1] - GATES[id].position[1]) < 0.01);

  // IL1) Region hooks + the five gates + spawn: every island hook is wired;
  //      the spawn is safe, collider-free and looks NORTH up Main Street;
  //      each world gate stands on its own level pad (or the snow), its
  //      ARRIVE point (where you land coming home) is safe, clear, outside
  //      the trigger, and you arrive looking away from the gate; every
  //      other world's return gate lands you at its island gate.
  const hooksOk = Boolean(region) && region.bounds === ISLAND_BOUNDS && region.groundHeight === islandGroundHeight &&
    region.slideAt === islandSlideAt && region.speedAt === islandSpeedAt && region.isLava === islandHazardAt &&
    region.hazardInfo === islandHazardInfo && region.isSafe === islandIsSafe && typeof region.hazardHint === "string" &&
    region.cameraTerrainClamp === true && region.maxFrameDelta > 0 && region.maxFrameDelta <= 0.1 && region.arriveYaw === 0;
  const spawnOk = islandIsSafe(sp.x, sp.z) && !blockedAt(sp.x, sp.z, terrainHeight(sp.x, sp.z)) &&
    region.spawn.x === sp.x && region.spawn.z === sp.z && onPad("arrival", sp.x, sp.z, 1) &&
    ISLAND_ARCH.position[1] < sp.z; // the arch is ahead (north) of you
  const PAD_OF = { playground: "school", snow: "igloo", magma: "terrace", farm: "farm", jungle: "jungle" };
  const gateFails = [];
  for (const g of gateList) {
    const p = portalFor(g.id);
    const [ax, az] = g.arrive;
    const ah = islandGroundHeight(ax, az);
    if (!p) { gateFails.push(`${g.id}: no portal`); continue; }
    if (Math.abs(p.rotationY - g.yaw) > 1e-9) gateFails.push(`${g.id}: yaw`);
    if (!onPad(PAD_OF[g.id], g.position[0], g.position[1], 0.5)) gateFails.push(`${g.id}: off its pad`);
    if (!islandIsSafe(ax, az) || blockedAt(ax, az, ah)) gateFails.push(`${g.id}: arrive not safe/clear`);
    if (Math.hypot(ax - g.position[0], az - g.position[1]) <= p.radius + 1.5) gateFails.push(`${g.id}: arrive inside trigger`);
    // arriveYaw = the camera's yaw; the camera sits behind you on +sin/cos(yaw),
    // so you face −(sin, cos): AWAY from the gate.
    const fx = -Math.sin(g.arriveYaw), fz = -Math.cos(g.arriveYaw);
    if (fx * (ax - g.position[0]) + fz * (az - g.position[1]) <= 0) gateFails.push(`${g.id}: arrives facing the gate`);
    // No collider stands in the gate's doorway.
    if (blockedAt(g.position[0], g.position[1], islandGroundHeight(g.position[0], g.position[1]), p.radius)) gateFails.push(`${g.id}: collider in the doorway`);
  }
  const returns = getAllRegions().flatMap((r) => (r.portals || []).filter((p) => p.target === REGION).map((p) => ({ r: r.id, p })));
  const returnFails = returns.filter(({ r, p }) => r !== "cabin" && !gateList.some((g) => p.arrive && p.arrive[0] === g.arrive[0] && p.arrive[1] === g.arrive[1] && p.arriveYaw === g.arriveYaw)).map(({ r }) => r);
  const il1 = hooksOk && spawnOk && gateFails.length === 0 && returnFails.length === 0 && I_STEP_UP === STEP_UP && gateList.length === 5;
  checks.push({
    name: "Number Island: terrain/water/lava hooks + safe spawn + five gates with door-to-door arrivals",
    pass: il1,
    detail: il1 ? `spawn (${sp.x}, ${sp.z}) at ${terrainHeight(sp.x, sp.z).toFixed(1)} m; ${returns.length} return gates land at their island gate` : `hooks:${hooksOk} spawn:${spawnOk} gates:${gateFails.join("; ")} returns:${returnFails.join(",")}`,
  });

  // IL2) SIZE: about 2.5× ACROSS the old island (its walkable circle was
  //      76 m across) — the land runs ≥ 190 m both ways — and genuinely hilly
  //      (Frosty Peak + Ember Peak tower over the plaza).
  let xMin = Infinity, xMax = -Infinity, zMin = Infinity, zMax = -Infinity, land = 0;
  for (let x = -140; x <= 140; x += 1) {
    for (let z = -130; z <= 130; z += 1) {
      if (terrainHeight(x, z) <= SEA_Y) continue;
      land++;
      xMin = Math.min(xMin, x); xMax = Math.max(xMax, x); zMin = Math.min(zMin, z); zMax = Math.max(zMax, z);
    }
  }
  const oldAcross = OLD_WALKABLE_RADIUS * 2;
  const across = Math.min(xMax - xMin, zMax - zMin);
  const areaRatio = land / (Math.PI * OLD_WALKABLE_RADIUS * OLD_WALKABLE_RADIUS);
  const peaks = islandPadLevel("summit") - PLAZA_DECK_Y;
  const il2 = across / oldAcross > 2.4 && across / oldAcross < 3.4 && peaks > 12;
  checks.push({
    name: "Number Island: ~2.5× across the old island, and hilly",
    pass: il2,
    detail: `${(xMax - xMin)} × ${(zMax - zMin)} m of land = ${(across / oldAcross).toFixed(2)}× across (${areaRatio.toFixed(1)}× the area); summit ${peaks.toFixed(1)} m above the plaza`,
  });

  // IL3) Every path is walkable end to end as the player walks it: each 0.4 m
  //      step rises ≤ STEP_UP, nothing slides, no deep water or lava, no
  //      collider stands on it, and the grade stays gentle.
  let badRise = 0, slides = 0, wet = 0, samples = 0, maxGrade = 0, gradeAt = "";
  const blocked = [];
  for (const p of ISLAND_PATHS) {
    let h = null;
    for (let i = 0; i < p.pts.length - 1; i++) {
      const [ax, az] = p.pts[i], [cx, cz] = p.pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(cx - ax, cz - az) / 0.4));
      for (let k = 0; k < n; k++) {
        const x = ax + ((cx - ax) * k) / n, z = az + ((cz - az) * k) / n;
        const nh = islandGroundHeight(x, z, h === null ? terrainHeight(x, z) : h);
        if (h !== null && nh - h > STEP_UP) badRise++;
        if (islandSlideAt(x, z, nh)) slides++;
        if (islandHazardAt(x, z, nh)) wet++;
        const b = blockedAt(x, z, nh, 0.2);
        if (b && blocked.length < 6) blocked.push(`${p.id}:${b.id}`);
        const s = slopeAt(x, z);
        if (s > maxGrade && nh - terrainHeight(x, z) < 0.05) { maxGrade = s; gradeAt = `${p.id} (${x.toFixed(0)}, ${z.toFixed(0)})`; }
        h = nh;
        samples++;
      }
    }
  }
  const il3 = badRise === 0 && slides === 0 && wet === 0 && blocked.length === 0 && maxGrade <= 0.6;
  checks.push({
    name: "Number Island: every path is walkable end to end",
    pass: il3,
    detail: il3 ? `${ISLAND_PATHS.length} paths, ${samples} steps, steepest ${maxGrade.toFixed(2)}` : `rise:${badRise} slide:${slides} wet:${wet} blocked:${blocked.join(", ")} grade:${maxGrade.toFixed(2)} at ${gradeAt}`,
  });

  // IL4) REACHABLE on foot (no jumps): a 0.5 m flood fill of standable ground
  //      from the spawn reaches every gate, every arrival spot, the island
  //      friends + Mills, the plaza (board + trophy), the summit, the
  //      Achievements Wall's look spot, the lighthouse islet over the rope
  //      bridge, the ends of the jetty + pier, every signpost (+ where its
  //      arrows point) and every chest spot.
  const S = 0.5, X0 = -132, Z0 = -124;
  const nx = Math.round(264 / S) + 1, nz = Math.round(248 / S) + 1;
  const hg = new Float32Array(nx * nz);
  const ok = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    const z = Z0 + j * S;
    for (let i = 0; i < nx; i++) {
      const x = X0 + i * S;
      const t = terrainHeight(x, z);
      if (t < SEA_Y - I_DEEP - 0.5) continue;
      const h = islandGroundHeight(x, z, t);
      if (islandSlideAt(x, z, h) || islandHazardAt(x, z, h)) continue;
      if (blockedAt(x, z, h, 0.35)) continue;
      ok[j * nx + i] = 1;
      hg[j * nx + i] = h;
    }
  }
  for (const d of getIslandDecks()) {
    const L = d.len, ux = (d.to[0] - d.from[0]) / L, uz = (d.to[1] - d.from[1]) / L;
    for (let s = 0; s <= L; s += 0.25) {
      const t = s / L;
      for (let o = -(d.halfWidth - 0.35); o <= d.halfWidth - 0.35; o += 0.25) {
        const x = d.from[0] + ux * s - uz * o, z = d.from[1] + uz * s + ux * o;
        const i = Math.round((x - X0) / S), j = Math.round((z - Z0) / S);
        if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
        ok[j * nx + i] = 1;
        hg[j * nx + i] = d.yAt(t);
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
  const ix = (id) => INTERACTABLES.find((x) => x.id === id);
  const targets = [
    ...gateList.map((g) => [`gate-${g.id}`, g.position, 1.8]),
    ...gateList.map((g) => [`arrive-${g.id}`, g.arrive, 1.0]),
    ...["pip", "fern", "alby", "sage", "mission-board", "trophy-stand"].map((id) => [id, ix(id).position, ix(id).interactionRadius - 0.6]),
    ["summit", FROSTY_PEAK.summit, 2.5],
    ["wall-look-spot", wallToWorld(0, 4), 1.0],
    ["lighthouse-islet", [ISLET.center[0] - 3, ISLET.center[1] + 2], 3],
    ["jetty-end", [ISLAND_JETTY.to[0], ISLAND_JETTY.to[1] - 1.5], 1.2],
    ["cove-pier-end", [COVE_PIER.to[0] - 0.6, COVE_PIER.to[1] - 1.2], 1.4],
    ...ISLAND_SIGNPOSTS.map((s) => [`signpost-${s.id}`, s.at, 1.8]),
    ...ISLAND_SIGNPOSTS.flatMap((s) => s.arrows.map(([label, to]) => [`arrow ${s.id}→${label}`, to, 3])),
    ...ISLAND_CHEST_SPOTS.map((p, i) => [`chest-${i}`, p, 1.6]),
  ];
  const unreached = targets.filter(([, p, rad]) => !reach(p, rad)).map(([id]) => id);
  const il4 = unreached.length === 0 && reachedCells > okCells * 0.85;
  checks.push({
    name: "Number Island: every gate, friend, the summit, the wall, the lighthouse, signposts + chests reachable on foot",
    pass: il4,
    detail: il4 ? `${targets.length} targets reached; ${(100 * reachedCells / okCells).toFixed(0)}% of standable ground connected` : `unreached: ${unreached.slice(0, 8).join(", ")}; connected ${(100 * reachedCells / okCells).toFixed(0)}%`,
  });

  // IL5) LEVEL PADS: every pad is flat (± 2 cm) inside its rim; the plaza deck
  //      sits PLAZA.rise above its pad and every stair flight climbs to it in
  //      walkable steps; each gate's pad, Pip + Fern's pads, the summit.
  const padFails = [];
  for (const f of getIslandPads()) {
    let dev = 0;
    for (let a = 0; a < 24; a++) for (const rr of [0.25, 0.55, 0.82]) {
      const x = f.c[0] + Math.cos((a / 24) * Math.PI * 2) * f.rx * rr;
      const z = f.c[1] + Math.sin((a / 24) * Math.PI * 2) * f.rz * rr;
      if (!onPad(f.id, x, z, 1.3)) continue;
      if (nearestPath(x, z) && nearestPath(x, z).e < 1.5 && f.id !== "plaza") continue; // a path may cross it at its own grade
      dev = Math.max(dev, Math.abs(terrainHeight(x, z) - f.level));
    }
    if (dev > 0.02) padFails.push(`${f.id} ${dev.toFixed(2)}`);
  }
  const deckOk = Math.abs(PLAZA_DECK_Y - islandPadLevel("plaza") - PLAZA.rise) < 1e-9 &&
    Math.abs(islandGroundHeight(PLAZA.center[0], PLAZA.center[1] + 6) - PLAZA_DECK_Y) < 1e-6;
  let stairOk = true;
  for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    let h = islandGroundHeight(PLAZA.center[0] + dx * (PLAZA.apothem + 5), PLAZA.center[1] + dz * (PLAZA.apothem + 5));
    for (let r = PLAZA.apothem + 5; r >= PLAZA.apothem - 1; r -= 0.2) {
      const nh = islandGroundHeight(PLAZA.center[0] + dx * r, PLAZA.center[1] + dz * r, h);
      if (nh - h > STEP_UP) stairOk = false;
      h = nh;
    }
    if (Math.abs(h - PLAZA_DECK_Y) > 1e-6) stairOk = false;
  }
  const il5 = padFails.length === 0 && deckOk && stairOk && ISLAND_PADS.length === getIslandPads().length;
  checks.push({
    name: "Number Island: level pads + the raised plaza deck + walkable stair flights",
    pass: il5,
    detail: il5 ? `${getIslandPads().length} pads flat; deck ${PLAZA_DECK_Y.toFixed(2)} m, four flights climbable` : `pads:${padFails.join(", ")} deck:${deckOk} stairs:${stairOk}`,
  });

  // IL6) THE ACHIEVEMENTS WALL: beside the arch, near the spawn, its face
  //      turned to the arrivals; the look spot in front is standable + in the
  //      prompt zone; the LOOK camera (the whole wall + each of the six
  //      boards, at 16:9, 4:3 and a portrait phone) stands on open ground,
  //      above it, with a clear line of sight to every board corner; and the
  //      boards' data adds up (medals, keys, visits, totals).
  const W = ACHIEVEMENT_WALL;
  const toSpawn = [sp.x - W.position[0], sp.z - W.position[1]];
  const nrm = [Math.sin(W.rotationY), Math.cos(W.rotationY)];
  const facing = (toSpawn[0] * nrm[0] + toSpawn[1] * nrm[1]) / Math.hypot(...toSpawn);
  const nearSpawn = Math.hypot(...toSpawn) < 26 && Math.hypot(W.position[0] - ISLAND_ARCH.position[0], W.position[1] - ISLAND_ARCH.position[1]) < 22;
  const lookSpot = wallToWorld(0, 4);
  const spotOk = inWallPromptZone(...lookSpot) && islandIsSafe(...lookSpot) && !blockedAt(...lookSpot, islandGroundHeight(...lookSpot));
  const trees = Object.values(getIslandProps().trees).flat();
  const y0 = wallBaseY();
  const camFails = [];
  for (const [fov, aspect, tag] of [[50, 16 / 9, "16:9"], [50, 4 / 3, "4:3"], [50, 9 / 16, "portrait"]]) {
    for (let panel = -1; panel < WALL_BOARDS; panel++) {
      const v = wallViewCamera(panel, fov, aspect);
      const [cx, cy, cz] = v.pos;
      if (cy < islandGroundHeight(cx, cz) + 1.2) camFails.push(`${tag}/${panel}: low`);
      // Line of sight to the board corners (or the whole wall's corners).
      const corners = [];
      const xs = panel < 0 ? [boardLocalX(0) - WALL_GEOM.boardW / 2, boardLocalX(WALL_BOARDS - 1) + WALL_GEOM.boardW / 2] : [boardLocalX(panel) - WALL_GEOM.boardW / 2, boardLocalX(panel) + WALL_GEOM.boardW / 2];
      for (const lx of xs) for (const ly of [WALL_GEOM.boardY - WALL_GEOM.boardH / 2, WALL_GEOM.boardY + WALL_GEOM.boardH / 2]) {
        const [wx, wz] = wallToWorld(lx, WALL_GEOM.boardFace + 0.05);
        corners.push([wx, y0 + ly, wz]);
      }
      for (const [tx, ty, tz] of corners) {
        for (let k = 1; k < 40; k++) {
          const t = k / 40;
          const x = cx + (tx - cx) * t, y = cy + (ty - cy) * t, z = cz + (tz - cz) * t;
          if (terrainHeight(x, z) > y - 0.05) { camFails.push(`${tag}/${panel}: terrain`); break; }
          const tr = trees.find((q) => Math.hypot(q.x - x, q.z - z) < 1.6 * Math.max(0.7, q.s) && y < q.y + 9 * q.s);
          if (tr) { camFails.push(`${tag}/${panel}: tree (${tr.x.toFixed(0)}, ${tr.z.toFixed(0)})`); break; }
          const [, lz] = worldToWall(x, z);
          if (lz > 1.2) {
            const f = ISLAND_FOOTPRINTS.find((q) => q.id !== "achievement-wall" && q.id !== "achievement-view" && q.h > 0 && footprintDist(q, x, z) < 0 && y < islandGroundHeight(x, z) + q.h);
            if (f) { camFails.push(`${tag}/${panel}: ${f.id}`); break; }
          }
        }
      }
    }
  }
  // The boards' data: a known progress + a few local bests.
  const saved = {};
  const keys = [FARM_BEST_KEYS.fence, FARM_BEST_KEYS.order, "mma-visited:emerald-jungle", "mma-visited:farm-parts-whole"];
  for (const k of keys) saved[k] = localStorage.getItem(k);
  let dataOk = false, dataDetail = "";
  try {
    localStorage.setItem(FARM_BEST_KEYS.fence, String(FARM_MAX_SCORES.fence)); // gold
    localStorage.setItem(FARM_BEST_KEYS.order, String(Math.round(FARM_MAX_SCORES.order * 0.6))); // bronze
    localStorage.setItem("mma-visited:emerald-jungle", "1");
    localStorage.removeItem("mma-visited:farm-parts-whole");
    const progress = {
      xp: 250, coins: 40, profile: { name: "Sam" },
      completedMissions: ["warmup-pearce", "warmup-mahoney", "warmup-kellahan"],
      earnedBadges: [{ badgeId: "integer-adventurer", earnedAt: 1 }],
    };
    const results = [{ topicIds: ["integers"], topicNames: ["Integers"], percentage: 85, passed: true, completedAt: 1 }];
    const s = achievementsSummary(progress, results);
    const byId = Object.fromEntries(s.panels.map((p) => [p.id, p]));
    const farm = byId.farm;
    dataOk = s.panels.length === WALL_BOARDS &&
      ["island", "playground", "farm", "snow", "magma", "jungle"].every((id, i) => s.panels[i].id === id) &&
      farm.counts.gold === 1 && farm.counts.bronze === 1 && farm.earned === 2 && farm.total === 10 && farm.visited === true /* bests imply a visit */ &&
      byId.jungle.visited === true && byId.playground.keys === 2 && byId.playground.boss.done === true &&
      byId.island.level === 3 && byId.island.friends.find((f) => f.id === "pip").passed === true && byId.island.passedFriends === 1 &&
      byId.island.badgesEarned === 1 && byId.island.gateOpen === false &&
      s.totals.trophies === 2 + byId.snow.earned + byId.magma.earned && s.name === "Sam";
    dataDetail = `farm ${farm.counts.gold}g/${farm.counts.silver}s/${farm.counts.bronze}b, keys ${byId.playground.keys}, level ${byId.island.level}`;
  } catch (e) {
    dataDetail = `threw: ${e.message}`;
  } finally {
    for (const k of keys) { if (saved[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, saved[k]); }
  }
  const il6 = facing > 0.5 && nearSpawn && spotOk && camFails.length === 0 && dataOk;
  checks.push({
    name: "Achievements Wall: by the arch, facing the arrivals, a clear first-person look at every board + its data",
    pass: il6,
    detail: il6 ? `faces the spawn (cos ${facing.toFixed(2)}); ${3 * (WALL_BOARDS + 1)} look views clear; ${dataDetail}` : `facing:${facing.toFixed(2)} near:${nearSpawn} spot:${spotOk} cams:${camFails.slice(0, 5).join("; ")} data:${dataOk} ${dataDetail}`,
  });

  // IL7) WATER + LAVA: the lagoon + the shallows are wadeable (slower, never
  //      a bounce); out past the shelf the deep sea bounces you back with the
  //      splash hint; Ember Peak's crater + lava stream bounce you with the
  //      lava hint; every deck is dry; water reads at sea level.
  let lagoonBad = 0, lagoonN = 0;
  for (let a = 0; a < 48; a++) for (const rr of [0.2, 0.5, 0.8]) {
    const x = LAGOON.c[0] + Math.cos((a / 48) * Math.PI * 2) * LAGOON.rx * rr;
    const z = LAGOON.c[1] + Math.sin((a / 48) * Math.PI * 2) * LAGOON.rz * rr;
    if (terrainHeight(x, z) >= SEA_Y - 0.05) continue;
    lagoonN++;
    if (islandHazardAt(x, z, terrainHeight(x, z)) || islandSpeedAt(x, z, terrainHeight(x, z)) > I_WADE_SPEED + 1e-9 && SEA_Y - terrainHeight(x, z) > 0.12) lagoonBad++;
    if (islandWaterAt(x, z) !== SEA_Y) lagoonBad++;
  }
  const deep = [[0, 135], [-130, 0], [130, -60], [60, 128]].every(([x, z]) => islandHazardAt(x, z, terrainHeight(x, z)) && islandHazardInfo(x, z).hint === SEA_HINT);
  const [ex, ez] = EMBER_PEAK.c;
  // (The stream's lower half runs on into the sea: test a point up the flank.)
  const midStream = LAVA_STREAM.pts ? LAVA_STREAM.pts[Math.floor(LAVA_STREAM.pts.length / 4)] : null;
  const lava = isLavaAt(ex, ez) && islandHazardAt(ex, ez, terrainHeight(ex, ez)) && islandHazardInfo(ex, ez).hint === LAVA_HINT_ISLAND &&
    islandHazardInfo(ex, ez).sound === "lava" && (!midStream || isLavaAt(midStream[0], midStream[1]));
  const decksDry = getIslandDecks().every((d) => [0.3, 0.5, 0.7, 0.95].every((t) => {
    const x = d.from[0] + (d.to[0] - d.from[0]) * t, z = d.from[1] + (d.to[1] - d.from[1]) * t;
    const h = d.yAt(t);
    return !islandHazardAt(x, z, h) && islandGroundHeight(x, z, h) >= h - 1e-6 && h > SEA_Y + 0.3;
  }));
  const il7 = lagoonN > 30 && lagoonBad === 0 && deep && lava && decksDry;
  checks.push({
    name: "Number Island: wadeable lagoon + shallows, deep-sea + lava bounce-backs, dry decks",
    pass: il7,
    detail: il7 ? `${lagoonN} lagoon points wadeable; deep sea + crater + stream bounce; ${getIslandDecks().length} decks dry` : `lagoon bad ${lagoonBad}/${lagoonN} deep:${deep} lava:${lava} decks:${decksDry}`,
  });

  // IL8) SCATTER: no tree on a path, a pad, a gate, a building or a deck; no
  //      tree in the water; the plaza is clear; the sea + slides seal the
  //      island (nothing walkable past the clamp).
  const P = getIslandProps();
  const treeFails = [];
  for (const t of trees) {
    const np = nearestPath(t.x, t.z);
    if (np && np.e < 1.2) treeFails.push(`path ${t.kind}`);
    else if (getIslandPads().some((f) => onPad(f.id, t.x, t.z, -0.5))) treeFails.push(`pad ${t.kind}`);
    else if (gateList.some((g) => Math.hypot(t.x - g.position[0], t.z - g.position[1]) < 4.5)) treeFails.push(`gate ${t.kind}`);
    else if (terrainHeight(t.x, t.z) < SEA_Y + 0.1) treeFails.push(`water ${t.kind}`);
    else if (ISLAND_FOOTPRINTS.some((f) => f.h > 1.5 && footprintDist(f, t.x, t.z) < 0.5)) treeFails.push(`building ${t.kind}`);
    if (treeFails.length > 6) break;
  }
  let sealed = true;
  for (let a = 0; a < 360; a += 3) {
    const r = ISLAND_BOUNDS.radius - 1;
    const x = Math.cos((a * Math.PI) / 180) * r, z = Math.sin((a * Math.PI) / 180) * r;
    if (!islandHazardAt(x, z, terrainHeight(x, z)) && !islandSlideAt(x, z, terrainHeight(x, z)) && coastSD(x, z) < 0) sealed = false;
  }
  const il8 = treeFails.length === 0 && sealed && trees.length > 300 && P.flowers.length > 50;
  checks.push({
    name: "Number Island: scatter off paths/pads/gates/buildings, island sealed by the sea",
    pass: il8,
    detail: il8 ? `${trees.length} trees, ${P.flowers.length} flowers placed clear; the rim is all sea` : `trees:${treeFails.join(", ")} sealed:${sealed}`,
  });

  // IL9) THE TITLE FLYOVER: flown at 600 points round the loop, the camera
  //      spline stays ≥ the clearance above the ground (before the runtime
  //      clamp), stays near the island, and always looks at the island.
  const pos = new THREE.CatmullRomCurve3(TITLE_SHOTS.map(([p]) => new THREE.Vector3(...p)), true, "centripetal", 0.5);
  const look = new THREE.CatmullRomCurve3(TITLE_SHOTS.map(([, l]) => new THREE.Vector3(...l)), true, "centripetal", 0.5);
  let low = 0, far = 0, offLook = 0, minClear = Infinity;
  const vp = new THREE.Vector3(), vl = new THREE.Vector3();
  for (let i = 0; i < 600; i++) {
    const k = i / 600;
    pos.getPoint(k, vp);
    look.getPoint(k, vl);
    const clear = vp.y - terrainHeight(vp.x, vp.z);
    minClear = Math.min(minClear, clear);
    if (clear < TITLE_MIN_CLEARANCE - 1) low++;
    if (Math.hypot(vp.x, vp.z) > 175) far++;
    if (Math.hypot(vl.x, vl.z) > ISLAND_BOUNDS.radius) offLook++;
  }
  const il9 = low === 0 && far === 0 && offLook === 0 && TITLE_SHOTS.length >= 8;
  checks.push({
    name: "Title screen: the island flyover stays clear of the ground and always looks at the island",
    pass: il9,
    detail: il9 ? `${TITLE_SHOTS.length} shots; lowest clearance ${minClear.toFixed(1)} m` : `low:${low} far:${far} offLook:${offLook} minClear:${minClear.toFixed(1)}`,
  });

  // IL10) PLACES + SIGNS: the named areas are spread out round the island;
  //       every island friend + Mills stands on safe ground near their place;
  //       each signpost stands beside a path and every arrow points along one;
  //       the snow gate stands on snow, the volcano gate by Ember Peak, the
  //       lighthouse on its islet.
  const areaPairs = [];
  for (let i = 0; i < ISLAND_AREAS.length; i++) for (let j = i + 1; j < ISLAND_AREAS.length; j++) {
    const a = ISLAND_AREAS[i], b = ISLAND_AREAS[j];
    if (Math.hypot(a.c[0] - b.c[0], a.c[1] - b.c[1]) < 14) areaPairs.push(`${a.id}/${b.id}`);
  }
  const friendsOk = [PIP_SPOT.position, FERN_SPOT.position, ALBY_SPOT.position, MILLS_SPOT.position].every(([x, z]) => islandIsSafe(x, z));
  const signFails = [];
  for (const s of ISLAND_SIGNPOSTS) {
    const np = nearestPath(...s.at);
    if (!np || np.e > 3 || np.e < 0.2) signFails.push(`${s.id} not beside a path`);
    for (const [label, to] of s.arrows) {
      const ap = nearestPath(...to);
      if (!ap || ap.e > 0.5) signFails.push(`${s.id}→${label} off a path`);
    }
  }
  const themed = snowCover(...GATES.snow.position) > 0.5 &&
    Math.hypot(GATES.magma.position[0] - EMBER_PEAK.c[0], GATES.magma.position[1] - EMBER_PEAK.c[1]) < EMBER_PEAK.R &&
    Math.hypot(LIGHTHOUSE.position[0] - ISLET.center[0], LIGHTHOUSE.position[1] - ISLET.center[1]) < ISLET.radius - LIGHTHOUSE.radius &&
    Math.hypot(GATES.jungle.position[0] - LAGOON.c[0], GATES.jungle.position[1] - LAGOON.c[1]) < 26;
  const il10 = areaPairs.length === 0 && friendsOk && signFails.length === 0 && themed && ISLAND_AREAS.length >= 12;
  checks.push({
    name: "Number Island: named areas spread out, friends on safe ground, signposts point along paths, gates in their landscapes",
    pass: il10,
    detail: il10 ? `${ISLAND_AREAS.length} areas, ${ISLAND_SIGNPOSTS.length} signposts, themed gates` : `crowded:${areaPairs.join(",")} friends:${friendsOk} signs:${signFails.join("; ")} themed:${themed}`,
  });

  return checks;
}
