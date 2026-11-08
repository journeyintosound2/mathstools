/**
 * SUNSTONE DESERT (2026-11-08) — headless WORLD checks DS1–DS10. They read the
 * SAME pure modules the game uses (desertLayout / desertTerrain / desertProps
 * / desertColliders / regions / journey), so a passing run means the walkable
 * desert, its climbs, decks, quicksand and scatter genuinely agree.
 *
 * Jump numbers mirror Player.jsx (JUMP_VELOCITY 7.2, GRAVITY 20, WALK 7).
 */
import {
  DESERT_REGION_ID, DESERT_NAME, DESERT_BOUNDS, DESERT_BOUNDARY, DESERT_SPAWN, DESERT_RETURN_PORTAL, DESERT_WELCOME_HOST,
  DESERT_MAP_BOARD, DESERT_SPOTS, DESERT_SIGNPOSTS, DESERT_CHEST_SPOTS, QS_SIGNS, QUICKSAND, QS_EDGE, PYRAMID, SUNSTONE,
  SUN_TEMPLE, SUNDIAL_RISE, OASIS_POOL, MESAS, STEPPING_STONES, BOARDWALK, DUNE_SEA, DESERT_OPEN_TO_STUDENTS, ZIGGURAT, TEMPLE_STONES, TEMPLE_WALL, TEMPLE_DASH,
  BAZAAR_BUILDINGS, SAND_SPHINX, DUNE_SHIP, FOSSIL, CAMELS,
} from "../data/desert/desertLayout.js";
import {
  D_STEP_UP, D_SLIDE_SLOPE, terrainHeight, slopeAt, desertGroundHeight, desertSlideAt, desertClimbAt, desertSpeedAt,
  desertHazardAt, desertHazardInfo, desertSinkLevelAt, desertIsSafe, structureTopAt, getDesertStructures,
  ensureDesertStructures, getLateStructures, getLadders, getMesas, getQuicksandPits, quicksandAt, poolWaterAt, nearestTrail,
  DESERT_TRAILS, PYRAMID_STAIR, PYRAMID_TIERS, TOWER_FLIGHT, ZIGGURAT_FLIGHT, TEMPLE_STEPS, SUNDIAL, ROOF_PLANK,
  outsideRim, duneMask, QS_SLOW, POOL_SLOW, SUNSTONE_TOP, getDesertPads, rimDuneness,
} from "../data/desert/desertTerrain.js";
import { getDesertProps, DESERT_FOOTPRINTS, footprintDist, DESERT_TRUNK_R } from "../data/desert/desertProps.js";
import { landSD, MAGMA_BOUNDS } from "../data/magma/magmaLayout.js";
import { getRegion, REGIONS } from "../data/regions.js";
import { getColliders } from "../data/worldColliders.js";
import { GATES as ISLAND_GATES } from "../data/island/islandLayout.js";
import { portalLock, journeyState, DESERT_PORTAL_ID } from "../data/journey.js";
import { PLAYER_RADIUS, STEP_UP } from "../systems/collisionEngine.js";

const REGION = DESERT_REGION_ID;
const JUMP_V = 7.2, G = 20, WALK = 7;
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
      if (c.box) {
        const dx = x - c.x, dz = z - c.z;
        const lx = dx * c.cos - dz * c.sin, lz = dx * c.sin + dz * c.cos;
        const qx = Math.max(-c.hx, Math.min(c.hx, lx)), qz = Math.max(-c.hz, Math.min(c.hz, lz));
        if (Math.hypot(lx - qx, lz - qz) < pad) return c;
        continue;
      }
      if (Math.hypot(x - c.x, z - c.z) < c.radius + pad) return c;
    }
    return null;
  };
}

/** Walk a straight route as the player would (layered ground), counting problems. */
function walkRoute(pts, blockedAt, { step = 0.3, startH = null, allowSlow = true } = {}) {
  const res = { rise: 0, slide: 0, hazard: 0, blocked: [], maxRise: 0 };
  let h = startH;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let k = 0; k <= n; k++) {
      const x = ax + ((bx - ax) * k) / n, z = az + ((bz - az) * k) / n;
      const nh = desertGroundHeight(x, z, h === null ? terrainHeight(x, z) : h);
      if (h !== null) { res.maxRise = Math.max(res.maxRise, nh - h); if (nh - h > STEP_UP + 1e-6) res.rise++; }
      if (desertSlideAt(x, z, nh)) res.slide++;
      if (desertHazardAt(x, z, nh)) res.hazard++;
      if (!allowSlow && desertSpeedAt(x, z, nh) < 1) res.hazard++;
      const b = blockedAt(x, z, nh, 0.2);
      if (b && res.blocked.length < 4) res.blocked.push(b.id);
      h = nh;
    }
  }
  return res;
}

export function runDesertChecks() {
  const checks = [];
  ensureDesertStructures();
  const region = getRegion(REGION);
  const colliders = getColliders({}, REGION);
  const blockedAt = colliderLookup(colliders);
  const sp = DESERT_SPAWN;
  const [bx, bz] = DESERT_RETURN_PORTAL;
  const back = (region.portals || []).find((p) => p.target === "island-1");
  const island = getRegion("island-1");
  const toDesert = (island.portals || []).find((p) => p.target === REGION);
  const late = getLateStructures();

  // DS1) Hooks + gates + spawn: every desert hook is wired; the golden gate
  //      stands on the island (variant "desert") and the return gate lands
  //      you back in front of it; the spawn is safe, clear and outside the
  //      gate's trigger; step-up agrees; the gate is shut ("coming soon")
  //      for students until DESERT_OPEN_TO_STUDENTS, and open in admin mode.
  const hooksOk = Boolean(region) && region.id === REGION && region.name === DESERT_NAME && region.bounds === DESERT_BOUNDS &&
    region.groundHeight === desertGroundHeight && region.slideAt === desertSlideAt && region.climbAt === desertClimbAt &&
    region.speedAt === desertSpeedAt && region.isLava === desertHazardAt && region.hazardInfo === desertHazardInfo &&
    region.waterLevelAt === desertSinkLevelAt && region.isSafe === desertIsSafe && region.hazardKind === "quicksand" &&
    typeof region.hazardHint === "string" && region.cameraTerrainClamp === true && region.maxFrameDelta > 0 && region.arriveYaw === 0;
  const gateOk = Boolean(toDesert) && toDesert.variant === "desert" && toDesert.position === ISLAND_GATES.desert.position &&
    Boolean(back) && back.variant === "desert" && back.arrive === ISLAND_GATES.desert.arrive && back.arriveYaw === ISLAND_GATES.desert.arriveYaw &&
    desertIsSafe(bx, bz) && outsideRim(bx, bz) < -6;
  const spawnOk = desertIsSafe(sp.x, sp.z) && !blockedAt(sp.x, sp.z, terrainHeight(sp.x, sp.z)) &&
    Math.hypot(sp.x - bx, sp.z - bz) > back.radius + 2 && region.spawn.x === sp.x && region.spawn.z === sp.z;
  const boundsOk = DESERT_BOUNDS.width / 2 > DESERT_BOUNDARY.halfW && DESERT_BOUNDS.height / 2 > DESERT_BOUNDARY.halfD &&
    DESERT_BOUNDS.width / 2 < DESERT_BOUNDARY.halfW + 6;
  const stu = journeyState({ completedMissions: [], journey: {}, counts: {}, visited: {}, admin: false });
  const adm = journeyState({ completedMissions: [], journey: {}, counts: {}, visited: {}, admin: true });
  const lockStu = portalLock(stu, DESERT_PORTAL_ID), lockAdm = portalLock(adm, DESERT_PORTAL_ID);
  // (2026-11-08, later) The Timestable Temple opens on the journey: shut for
  // a new student until Snowball Sums holds 7 trophies, open in admin mode.
  const lockOk = DESERT_PORTAL_ID === toDesert?.id && lockAdm === null &&
    (DESERT_OPEN_TO_STUDENTS ? lockStu === null : Boolean(lockStu && lockStu.worldKey === "temple" && /Snowball Sums/.test(lockStu.text)));
  const ds1 = hooksOk && gateOk && spawnOk && boundsOk && lockOk && D_STEP_UP === STEP_UP;
  checks.push({
    name: "Sunstone Desert: hooks + golden gates both ways + safe spawn + the journey's lock (open for admin)",
    pass: ds1,
    detail: ds1 ? `spawn (${sp.x}, ${sp.z}) at ${terrainHeight(sp.x, sp.z).toFixed(1)} m; island gate ${toDesert.id}; students: ${lockStu ? lockStu.note : "open"}` : `hooks:${hooksOk} gate:${gateOk} spawn:${spawnOk} bounds:${boundsOk} lock:${lockOk}`,
  });

  // DS2) SIZE: about TWICE Magma Multiples' land (walkable 1 m cells inside
  //      the rim — not quicksand, the pool or too steep) — and NOT flat.
  let land = 0, hMin = Infinity, hMax = -Infinity;
  const B = DESERT_BOUNDARY;
  for (let x = -B.halfW; x <= B.halfW; x += 1) {
    for (let z = -B.halfD; z <= B.halfD; z += 1) {
      const g = desertGroundHeight(x, z);
      hMin = Math.min(hMin, g); hMax = Math.max(hMax, g);
      const q = quicksandAt(x, z);
      if ((q && q.sdf < 0) || poolWaterAt(x, z) !== null || desertSlideAt(x, z, g)) continue;
      land++;
    }
  }
  let magmaLand = 0;
  const MR = MAGMA_BOUNDS.radius;
  for (let x = -MR; x <= MR; x += 1) for (let z = -MR; z <= MR; z += 1) {
    if (Math.hypot(x, z) <= MR && landSD(x, z) >= 0) magmaLand++;
  }
  const ratio = land / magmaLand;
  const ds2 = ratio > 1.8 && ratio < 2.4 && hMax - hMin > 24;
  checks.push({
    name: "Sunstone Desert: about twice the size of Magma Multiples, and not flat",
    pass: ds2,
    detail: `walkable ${land} m² = ${ratio.toFixed(2)}× Magma's ${magmaLand} m²; ground ${hMin.toFixed(1)}…${hMax.toFixed(1)} m`,
  });

  // DS3) Every TRAIL walkable end to end: rise ≤ STEP_UP per step, no slides,
  //      no quicksand, no colliders on it, grade ≤ 0.6.
  let samples = 0, maxGrade = 0, gradeAt = "";
  const trailFails = [];
  for (const p of DESERT_TRAILS) {
    const r = walkRoute(p.pts, blockedAt, { step: 0.4 });
    if (r.rise || r.slide || r.hazard || r.blocked.length) trailFails.push(`${p.id} rise:${r.rise} slide:${r.slide} qs:${r.hazard} ${r.blocked.join(",")}`);
    for (let i = 0; i < p.pts.length; i++) {
      const [x, z] = p.pts[i];
      if (structureTopAt(x, z) !== null) continue;
      const s = slopeAt(x, z);
      if (s > maxGrade) { maxGrade = s; gradeAt = `${p.id} (${x.toFixed(0)}, ${z.toFixed(0)})`; }
      samples++;
    }
  }
  const ds3 = trailFails.length === 0 && maxGrade <= 0.6;
  checks.push({
    name: "Sunstone Desert: every trail is walkable end to end",
    pass: ds3,
    detail: ds3 ? `${DESERT_TRAILS.length} trails, ${samples} points, steepest ${maxGrade.toFixed(2)}` : `${trailFails.slice(0, 4).join("; ")} grade:${maxGrade.toFixed(2)} at ${gradeAt}`,
  });

  // DS4) REACHABLE ON FOOT (no jumps, no ladders): a two-layer flood fill
  //      (the ground + every thin deck) from the spawn reaches all ten spots,
  //      Mills, the map board, the gate, every signpost + chest spot, the
  //      pyramid's summit, the temple portico, the sundial's top, both mesa
  //      tops (the stair + the rope bridge), the oasis floor + the pool's
  //      edge, the ziggurat top, both tower roofs (stair + roof bridge), the
  //      crossing island (boardwalk) and every ladder's foot.
  const S = 0.3;
  const X0 = -B.halfW, Z0 = -B.halfD;
  const nx = Math.round((2 * B.halfW) / S) + 1, nz = Math.round((2 * B.halfD) / S) + 1;
  const N = nx * nz;
  const hg = new Float32Array(N * 2), ok = new Uint8Array(N * 2);
  for (let j = 0; j < nz; j++) {
    const z = Z0 + j * S;
    for (let i = 0; i < nx; i++) {
      const x = X0 + i * S;
      const h = desertGroundHeight(x, z, terrainHeight(x, z) + 0.05);
      if (desertSlideAt(x, z, h) || desertHazardAt(x, z, h)) continue;
      if (blockedAt(x, z, h, 0.35)) continue;
      ok[j * nx + i] = 1;
      hg[j * nx + i] = h;
    }
  }
  const decks = [...late.decks, ROOF_PLANK];
  for (const d of decks) {
    for (let s = 0; s <= d.L; s += 0.25) {
      const t = s / d.L;
      for (let o = -(d.hw - 0.35); o <= d.hw - 0.35 + 1e-6; o += 0.25) {
        const x = d.from[0] + d.ux * s - d.uz * o, z = d.from[1] + d.uz * s + d.ux * o;
        const i = Math.round((x - X0) / S), j = Math.round((z - Z0) / S);
        if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
        const k = N + j * nx + i;
        const h = d.deckAt(t);
        if (blockedAt(x, z, h, 0.35)) continue;
        ok[k] = 1; hg[k] = h;
      }
    }
  }
  const cellOf = (x, z) => [Math.round((x - X0) / S), Math.round((z - Z0) / S)];
  const seen = new Uint8Array(N * 2);
  {
    const [si, sj] = cellOf(sp.x, sp.z);
    const q = [sj * nx + si];
    seen[q[0]] = 1;
    while (q.length) {
      const k = q.pop();
      const layer = k >= N ? 1 : 0, kk = k - layer * N;
      const i = kk % nx, j = (kk - i) / nx;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]]) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
        for (const nl of [0, 1]) {
          const nk = nl * N + nj * nx + ni;
          if (nk === k || seen[nk] || !ok[nk]) continue;
          const dh = hg[nk] - hg[k];
          if (dh > STEP_UP || dh < -0.55) continue; // a deck's end steps on/off; no drops onto/off it
          if (nl !== layer && Math.abs(dh) > STEP_UP) continue;
          seen[nk] = 1;
          q.push(nk);
        }
      }
    }
  }
  let reachedCells = 0, okCells = 0;
  for (let k = 0; k < N; k++) { if (ok[k]) okCells++; if (seen[k]) reachedCells++; }
  const reach = ([x, z], rad = 1.5, minH = -Infinity) => {
    const [ci, cj] = cellOf(x, z);
    const n = Math.ceil(rad / S);
    for (let dj = -n; dj <= n; dj++) for (let di = -n; di <= n; di++) {
      const i = ci + di, j = cj + dj;
      if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
      if (Math.hypot(di * S, dj * S) > rad) continue;
      for (const l of [0, 1]) {
        const k = l * N + j * nx + i;
        if (seen[k] && hg[k] >= minH) return true;
      }
    }
    return false;
  };
  const mesas = getMesas();
  const tower = BAZAAR_BUILDINGS.find((b) => b.id === "tower"), twin = BAZAAR_BUILDINGS.find((b) => b.id === "twin");
  const pyrTopZ = PYRAMID.c[1] + PYRAMID.topHalf - 2;
  const targets = [
    ...DESERT_SPOTS.map((s) => [`spot-${s.id}`, s.center, 1.5]),
    ["mills", [DESERT_WELCOME_HOST.position[0], DESERT_WELCOME_HOST.position[1] + 1.2], 1.6],
    ["map-board", [DESERT_MAP_BOARD.position[0] + Math.sin(DESERT_MAP_BOARD.rotationY) * 2, DESERT_MAP_BOARD.position[1] + Math.cos(DESERT_MAP_BOARD.rotationY) * 2], 1.6],
    ["return-gate", [bx - 2.2, bz - 1.6], 1.6],
    ["pyramid-summit", [0, pyrTopZ], 1.2, SUNSTONE_TOP - 0.1],
    ["temple-portico", [0, SUN_TEMPLE.zFront - 3], 1.5, SUN_TEMPLE.h + getDesertPads().find((p) => p.id === "temple").level - 0.1],
    ["sundial-top", [SUNDIAL_RISE.c[0], SUNDIAL_RISE.c[1] - 4], 1.5, SUNDIAL.top - 0.1],
    ["red-mesa-top", [mesas[0].c[0] + 6, mesas[0].c[1]], 2, mesas[0].top - 0.1],
    ["twin-mesa-top", mesas[1].c, 2, mesas[1].top - 0.1],
    ["oasis-floor", [-76, 0], 1.5],
    ["pool-edge", [OASIS_POOL.c[0] + OASIS_POOL.rx + 1.5, OASIS_POOL.c[1]], 2],
    ["ziggurat-top", [ZIGGURAT.c[0] + 1, ZIGGURAT.c[1]], 1.2, ZIGGURAT_FLIGHT.h1 - 0.1],
    ["tower-roof", [tower.x - 1, tower.z], 1.5, TOWER_FLIGHT.h1 - 0.1],
    ["twin-roof", [twin.x + 1, twin.z], 1.5, TOWER_FLIGHT.h1 - 0.1],
    ["crossing-island", [96, 30], 1.5],
    ["sphinx-head", [SAND_SPHINX.position[0], SAND_SPHINX.position[1] + 7], 2.5],
    ["dune-ship", [DUNE_SHIP.position[0] - 7, DUNE_SHIP.position[1] + 4], 3],
    ["fossil", [FOSSIL.c[0], FOSSIL.c[1] - 7], 3],
    ...getLadders().map((l) => [`ladder-foot-${l.id}`, [l.foot[0] + l.nx * 0.8, l.foot[1] + l.nz * 0.8], 1.4]),
    ...CAMELS.map(([x, z], i) => [`camel-${i}`, [x + 2.4, z], 2.2]),
    ...DESERT_SIGNPOSTS.map((s) => [`signpost-${s.id}`, s.p, 1.8]),
    ...DESERT_CHEST_SPOTS.map((p, i) => [`chest-${i}`, p, 1.6]),
    // The Timestable Temple: where you stand to use each stone, the wall + Dash.
    ...TEMPLE_STONES.map((t) => {
      const d = t.tall ? 1.9 : 1.6;
      const p = [t.position[0] + Math.sin(t.rotationY) * d, t.position[1] + Math.cos(t.rotationY) * d];
      return [`stone-${t.key}`, p, 1.3, desertGroundHeight(p[0], p[1], 200) - 0.3];
    }),
    ["tables-wall", [TEMPLE_WALL.position[0], TEMPLE_WALL.position[1] + 2], 1.4],
    ["dash", [TEMPLE_DASH.position[0] + 2, TEMPLE_DASH.position[1] + 1.5], 1.6],
  ];
  const unreached = targets.filter(([, p, rad, minH]) => !reach(p, rad, minH ?? -Infinity)).map(([id]) => id);
  const ds4 = unreached.length === 0 && reachedCells > okCells * 0.8;
  checks.push({
    name: "Sunstone Desert: every spot, summit, roof, mesa top, the oasis + the crossing island reachable on foot",
    pass: ds4,
    detail: ds4 ? `${targets.length} targets reached; ${(100 * reachedCells / okCells).toFixed(0)}% of standable ground connected` : `unreached: ${unreached.slice(0, 8).join(", ")}; connected ${(100 * reachedCells / okCells).toFixed(0)}%`,
  });

  // DS5) THE TEN RESERVED SPOTS are open + flat: level ground (± 6 cm) right
  //      across, no collider, prop or quicksand inside, nothing slides, and
  //      they're spread out (≥ 30 m apart, ≥ 40 m from the arrival).
  const P = getDesertProps();
  const spotFails = [];
  for (const s of DESERT_SPOTS) {
    let lo = Infinity, hi = -Infinity;
    for (let a = 0; a < 24; a++) for (const rr of [0, 0.4, 0.75, 1]) {
      const x = s.center[0] + Math.cos((a / 24) * Math.PI * 2) * s.radius * rr, z = s.center[1] + Math.sin((a / 24) * Math.PI * 2) * s.radius * rr;
      const g = desertGroundHeight(x, z);
      lo = Math.min(lo, g); hi = Math.max(hi, g);
      if (desertSlideAt(x, z, g) || desertHazardAt(x, z, g)) spotFails.push(`${s.id} unsafe`);
      const q = quicksandAt(x, z);
      if (q && q.sdf < 0) spotFails.push(`${s.id} quicksand`);
      const b = blockedAt(x, z, g, 0.1);
      // (The Timestable Temple's station stones were what these spots were kept for.)
      if (b && !/^desert-stone-/.test(b.id)) spotFails.push(`${s.id} ${b.id}`);
    }
    if (hi - lo > 0.06) spotFails.push(`${s.id} not flat (${(hi - lo).toFixed(2)})`);
    for (const kind of ["saguaro", "barrel", "pear", "palm", "boulder", "shrub", "bones", "pots"]) {
      if (P[kind].some((t) => Math.hypot(t.x - s.center[0], t.z - s.center[1]) < s.radius)) spotFails.push(`${s.id} ${kind}`);
    }
    if (Math.hypot(s.center[0] - sp.x, s.center[1] - sp.z) < 40) spotFails.push(`${s.id} near the arrival`);
  }
  for (let i = 0; i < DESERT_SPOTS.length; i++) for (let j = i + 1; j < DESERT_SPOTS.length; j++) {
    const a = DESERT_SPOTS[i].center, b = DESERT_SPOTS[j].center;
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 30) spotFails.push(`${DESERT_SPOTS[i].id}/${DESERT_SPOTS[j].id} crowded`);
  }
  const ds5 = spotFails.length === 0;
  checks.push({
    name: "Sunstone Desert: ten reserved spots — open, flat, spread out",
    pass: ds5,
    detail: ds5 ? `${DESERT_SPOTS.length} spots clear + level` : [...new Set(spotFails)].slice(0, 6).join("; "),
  });

  // DS6) CLIMBS: every stair flight's risers are ≤ STEP_UP and its top meets
  //      what it leads to; the pyramid stair rides above every tier; the
  //      sundial ramp's grade is gentle and meets the drum top; ladders
  //      detect a push from their foot and mantle onto the mesa top; decks
  //      step on at both ends; the stepping stones are jumpable hops.
  const cFails = [];
  const flights = [PYRAMID_STAIR, TOWER_FLIGHT, ZIGGURAT_FLIGHT, TEMPLE_STEPS, ...late.flights];
  for (const f of flights) {
    if (Math.abs(f.rise) > STEP_UP) cFails.push(`${f.id} rise ${f.rise.toFixed(2)}`);
    // Walk it up the middle: from just before its foot to just past its top.
    const pts = [[f.from[0] - f.ux * 0.8, f.from[1] - f.uz * 0.8], [f.to[0] + f.ux * 0.9, f.to[1] + f.uz * 0.9]];
    const r = walkRoute(pts, blockedAt, { step: 0.12 });
    if (r.rise || r.slide || r.hazard) cFails.push(`${f.id} walk rise:${r.rise} (max ${r.maxRise.toFixed(2)}) slide:${r.slide}`);
    const top = desertGroundHeight(pts[1][0], pts[1][1], f.h1);
    if (Math.abs(top - f.h1) > STEP_UP) cFails.push(`${f.id} top ${top.toFixed(2)} vs ${f.h1.toFixed(2)}`);
  }
  for (const t of PYRAMID_TIERS) {
    const zEdge = PYRAMID.c[1] + t.half - 0.1;
    if (PYRAMID_STAIR.topAt(0, zEdge) !== null && PYRAMID_STAIR.topAt(0, zEdge) < t.top - 1e-6) cFails.push(`stair under tier ${t.k}`);
  }
  {
    const r = SUNDIAL.ramp, Sd = SUNDIAL_RISE;
    const mid = Sd.r + Sd.rampW / 2;
    const pts = [];
    for (let i = 0; i <= 120; i++) { const a = Sd.a0 + (i / 120) * Sd.turn; pts.push([Sd.c[0] + Math.cos(a) * mid, Sd.c[1] + Math.sin(a) * mid]); }
    pts.push([Sd.c[0], Sd.c[1]]);
    const rr = walkRoute([r.footAt, ...pts], blockedAt, { step: 0.25 });
    if (rr.rise || rr.slide) cFails.push(`sundial ramp rise:${rr.rise} slide:${rr.slide}`);
    const grade = Sd.h / (mid * Sd.turn);
    if (grade > 0.2) cFails.push(`sundial ramp grade ${grade.toFixed(2)}`);
  }
  for (const L of getLadders()) {
    const m = getMesas().find((q) => q.id === L.mesa);
    const fx = L.foot[0] + L.nx * 0.5, fz = L.foot[1] + L.nz * 0.5;
    const c = desertClimbAt(fx, fz, terrainHeight(fx, fz));
    if (!c) cFails.push(`${L.id} not climbable from its foot`);
    if (L.top - L.base < 6) cFails.push(`${L.id} too short`);
    if (L.cliffW > 4) cFails.push(`${L.id} cliff band ${L.cliffW.toFixed(1)}`);
    const mx = L.a[0] + L.tx * L.len / 2 - L.nx * (L.cliffW + 1.3), mz = L.a[1] + L.tz * L.len / 2 - L.nz * (L.cliffW + 1.3);
    if (Math.abs(desertGroundHeight(mx, mz, L.top + 0.3) - m.top) > 0.05 || desertSlideAt(mx, mz, m.top)) cFails.push(`${L.id} mantle spot not on the top`);
  }
  for (const d of [...late.decks, ROOF_PLANK]) {
    for (const [e, t] of [[d.from, 0], [d.to, 1]]) {
      const ox = e[0] - d.ux * (t ? -0.6 : 0.6), oz = e[1] - d.uz * (t ? -0.6 : 0.6);
      const g = desertGroundHeight(ox, oz, d.deckAt(t));
      if (Math.abs(g - d.deckAt(t)) > STEP_UP) cFails.push(`${d.id} end ${t} step ${(d.deckAt(t) - g).toFixed(2)}`);
    }
    if (!colliders.some((c) => c.id.startsWith(`desert-rail-${d.id}-`))) cFails.push(`${d.id} no rails`);
  }
  for (let i = 1; i < STEPPING_STONES.length; i++) {
    const [ax, az] = STEPPING_STONES[i - 1], [cx, cz] = STEPPING_STONES[i];
    if (Math.hypot(cx - ax, cz - az) - 1.6 > 1.2) cFails.push("stepping stone hop too far");
  }
  const ds6 = cFails.length === 0;
  checks.push({
    name: "Sunstone Desert: stairs, the pyramid, the spiral ramp, ladders, bridges + stepping stones all climbable",
    pass: ds6,
    detail: ds6 ? `${flights.length} flights (pyramid ${PYRAMID_STAIR.n} steps to ${PYRAMID.top} m), ${getLadders().length} ladders, ${late.decks.length + 1} decks, ${STEPPING_STONES.length} stones` : [...new Set(cFails)].slice(0, 6).join("; "),
  });

  // DS7) QUICKSAND: every pit swallows you in its middle (a wipe-out — the
  //      hazard kind, line + sound), its soft edge only slows you, the ground
  //      round it is safe; no trail runs into one; the boardwalk + stones
  //      keep you up; every lone pit has a warning sign; the spawn is far.
  const qFails = [];
  let coreCells = 0;
  for (const pt of getQuicksandPits()) {
    let core = 0, edge = 0, unsafe = 0;
    const R = pt.ring ? pt.rOut : Math.max(pt.rx, pt.rz);
    for (let x = pt.c[0] - R - 3; x <= pt.c[0] + R + 3; x += 0.5) {
      for (let z = pt.c[1] - R - 3; z <= pt.c[1] + R + 3; z += 0.5) {
        const q = quicksandAt(x, z);
        if (!q || q.pit !== pt) continue;
        const g = terrainHeight(x, z);
        if (q.sdf < -QS_EDGE - 0.3) {
          if (structureTopAt(x, z) !== null) continue;
          core++;
          if (!desertHazardAt(x, z, g)) qFails.push(`${pt.id} core not hazardous`);
        } else if (q.sdf < -0.2 && q.sdf > -QS_EDGE + 0.2) {
          edge++;
          if (desertHazardAt(x, z, g) || Math.abs(desertSpeedAt(x, z, g) - QS_SLOW) > 1e-6) qFails.push(`${pt.id} edge wrong`);
        } else if (q.sdf > 1.5 && q.sdf < 2.5) {
          if (desertHazardAt(x, z, g) || !desertIsSafe(x, z) && slopeAt(x, z) < 0.6) unsafe++;
        }
      }
    }
    if (core < 8) qFails.push(`${pt.id} has no middle (${core})`);
    if (edge < 8) qFails.push(`${pt.id} has no soft edge`);
    if (unsafe) qFails.push(`${pt.id} unsafe surroundings`);
    coreCells += core;
    const info = desertHazardInfo(pt.c[0] + (pt.ring ? (pt.rIn + pt.rOut) / 2 : 0), pt.c[1]);
    if (!info || info.kind !== "quicksand" || !/quicksand/i.test(info.wipe) || info.sound !== "sink") qFails.push(`${pt.id} info`);
    const lvl = desertSinkLevelAt(pt.c[0] + (pt.ring ? (pt.rIn + pt.rOut) / 2 : 0), pt.c[1]);
    if (lvl === null || Math.abs(lvl - pt.level) > 1e-6) qFails.push(`${pt.id} sink level`);
    if (!/^flats|^moat/.test(pt.id) && !QS_SIGNS.some(([x, z]) => Math.hypot(x - pt.c[0], z - pt.c[1]) < R + 9)) qFails.push(`${pt.id} no warning sign`);
    if (Math.hypot(pt.c[0] - sp.x, pt.c[1] - sp.z) < 40) qFails.push(`${pt.id} near the spawn`);
  }
  for (const p of DESERT_TRAILS) for (const [x, z] of p.pts) {
    const q = quicksandAt(x, z);
    if (q && q.sdf < p.hw + 0.8 && !(x >= BOARDWALK.from[0] - 0.5 && Math.abs(z - BOARDWALK.from[1]) < 3)) { qFails.push(`trail ${p.id} into ${q.pit.id}`); break; }
  }
  // The boardwalk's middle stands over the moat's swallowing middle, safely.
  {
    const moat = getQuicksandPits().find((p) => p.id === "moat");
    let over = 0;
    for (let s = 0; s <= 1; s += 0.05) {
      const x = BOARDWALK.from[0] + (BOARDWALK.to[0] - BOARDWALK.from[0]) * s, z = BOARDWALK.from[1];
      const deck = moat.level + 0.38;
      const g = desertGroundHeight(x, z, deck);
      if (desertHazardAt(x, z, g) || Math.abs(desertSpeedAt(x, z, g) - 1) > 1e-6) qFails.push("boardwalk not safe");
      const q = quicksandAt(x, z);
      if (q && q.sdf < -QS_EDGE) over++;
    }
    if (over < 2) qFails.push("boardwalk doesn't cross the moat");
    for (const [x, z] of STEPPING_STONES) if (desertHazardAt(x, z, moat.level + 0.3)) qFails.push("stone sinks");
  }
  if (region.hazardKind !== "quicksand" || !/quicksand/i.test(region.wipeLine)) qFails.push("region wipe line");
  const ds7 = qFails.length === 0;
  checks.push({
    name: "Sunstone Desert: quicksand swallows you in the middle, slows you at the edge; boardwalk + stones + signs",
    pass: ds7,
    detail: ds7 ? `${QUICKSAND.length} pits (${coreCells * 0.25} m² of swallowing sand); edge speed ${QS_SLOW}, pool ${POOL_SLOW}` : [...new Set(qFails)].slice(0, 6).join("; "),
  });

  // DS8) DUNES + THE RIM: the dune sea has tall dunes (≥ 8 m) with slip faces
  //      that slide and windward sides you can walk up; the rim slides you
  //      back INTO the desert on all four sides (cliffs west/north/south,
  //      giant dunes east); the cliffs are tall.
  const dFails = [];
  let tall = 0, slip = 0, windward = 0;
  const D = DUNE_SEA;
  for (let x = D.c[0] - D.rx; x <= D.c[0] + D.rx; x += 1.5) {
    for (let z = D.c[1] - D.rz; z <= D.c[1] + D.rz; z += 1.5) {
      if (outsideRim(x, z) > -8 || duneMask(x, z) < 0.6) continue;
      const g = terrainHeight(x, z);
      if (g > getDesertPads().find((p) => p.id === "ship").level + 8) tall++;
      const s = slopeAt(x, z);
      if (s >= D_SLIDE_SLOPE) slip++;
      else if (s > 0.15 && s < 0.5) windward++;
    }
  }
  if (tall < 40) dFails.push(`only ${tall} tall dune samples`);
  if (slip < 60) dFails.push(`only ${slip} slip-face samples`);
  if (windward < slip) dFails.push("more slip faces than windward slopes");
  // The rim: sample just inside the boundary along all four sides — most of
  // it slides you back inward, and none of it slides you outward.
  let inward = 0, outward = 0, probes = 0;
  for (let t = -0.85; t <= 0.85; t += 0.05) {
    for (const [x, z] of [[t * B.halfW, -B.halfD + 4.5], [t * B.halfW, B.halfD - 4.5], [-B.halfW + 4.5, t * B.halfD], [B.halfW - 4.5, t * B.halfD]]) {
      for (const k of [0, 1.5, 3]) {
        const xx = x + Math.sign(x) * (Math.abs(x) > B.halfW - 6 ? k : 0), zz = z + Math.sign(z) * (Math.abs(z) > B.halfD - 6 ? k : 0);
        const d = desertSlideAt(xx, zz, terrainHeight(xx, zz));
        probes++;
        if (!d) continue;
        if (d.x * xx + d.z * zz < 0) inward++; else outward++;
      }
    }
  }
  if (inward < probes * 0.5 || outward > probes * 0.03) dFails.push(`rim slides inward ${inward}/${probes}, outward ${outward}`);
  const cliffH = terrainHeight(-B.halfW - 10, 0) - terrainHeight(-B.halfW + 20, 0);
  if (cliffH < 15) dFails.push(`west cliffs only ${cliffH.toFixed(1)} m`);
  if (rimDuneness(B.halfW, -40) < 0.9 || rimDuneness(-B.halfW, 0) > 0.1) dFails.push("rim kinds");
  const ds8 = dFails.length === 0;
  checks.push({
    name: "Sunstone Desert: a dune sea to climb + slide down; the rim (cliffs + giant dunes) slides you home",
    pass: ds8,
    detail: ds8 ? `${tall} tall-dune / ${slip} slip-face / ${windward} windward samples; rim slides inward at ${inward}/${probes} probes; west cliffs ${cliffH.toFixed(0)} m` : dFails.slice(0, 6).join("; "),
  });

  // DS9) SCATTER keeps the desert playable: no cactus, palm or boulder on a
  //      trail, in quicksand, the pool, a building, a stair or a structure;
  //      the boundary is sealed + NOT jumpable; there's a real cactus desert.
  const sFails = [];
  for (const kind of ["saguaro", "barrel", "pear", "palm", "boulder"]) {
    for (const t of P[kind]) {
      if (outsideRim(t.x, t.z) > 0) continue;
      const nt = nearestTrail(t.x, t.z);
      if (nt && nt.e < DESERT_TRUNK_R[kind] * t.s + 0.2) sFails.push(`${kind} on trail ${nt.p.id}`);
      const q = quicksandAt(t.x, t.z);
      if (q && q.sdf < 1) sFails.push(`${kind} in quicksand`);
      if (poolWaterAt(t.x, t.z) !== null) sFails.push(`${kind} in the pool`);
      const st = structureTopAt(t.x, t.z);
      if (st !== null && st > terrainHeight(t.x, t.z) + 0.05) sFails.push(`${kind} on a structure`);
      if (DESERT_FOOTPRINTS.some((f) => !/^chest-|^spawn/.test(f.id) && footprintDist(f, t.x, t.z) < 0)) sFails.push(`${kind} in a footprint`);
    }
  }
  const border = colliders.filter((c) => c.id.startsWith("desert-border-"));
  if (border.some((c) => c.jumpable)) sFails.push("boundary jumpable");
  for (const side of ["n", "s", "w", "e"]) {
    const run = border.filter((c) => c.id.startsWith(`desert-border-${side}`));
    if (run.length < 10) sFails.push(`boundary ${side} short`);
    for (let i = 1; i < run.length; i++) if (Math.hypot(run[i].x - run[i - 1].x, run[i].z - run[i - 1].z) > run[i].radius * 2 + 0.4) sFails.push(`boundary gap ${side}`);
  }
  if (P.saguaro.length < 120) sFails.push(`only ${P.saguaro.length} saguaros`);
  if (P.palm.length < 40) sFails.push(`only ${P.palm.length} palms`);
  if (P.barrel.length + P.pear.length < 150) sFails.push("few small cacti");
  const ds9 = sFails.length === 0;
  checks.push({
    name: "Sunstone Desert: scatter off trails, quicksand, the pool + structures; boundary sealed",
    pass: ds9,
    detail: ds9 ? `${P.saguaro.length} saguaros, ${P.barrel.length + P.pear.length} small cacti, ${P.palm.length} palms, ${P.boulder.length} boulders, ${border.length} boundary posts` : [...new Set(sFails)].slice(0, 6).join("; "),
  });

  // DS10) SIGNS + EXPLORING: every signpost stands beside a trail and each
  //       arrow points along one; every quicksand sign stands on firm ground;
  //       the island gate stands in its little dunes (checked in IL10); the
  //       landmarks exist; chest spots are off trails and safe.
  const gFails = [];
  for (const s of DESERT_SIGNPOSTS) {
    const nt = nearestTrail(...s.p);
    if (!nt || nt.e > 3.2 || nt.e < 0.2) gFails.push(`${s.id} not beside a trail (${nt ? nt.e.toFixed(1) : "-"})`);
    for (const [label, to] of s.arrows) {
      const at = nearestTrail(...to);
      if (!at || at.e > 0.6) gFails.push(`${s.id}→${label} off a trail`);
    }
  }
  for (const [x, z] of QS_SIGNS) if (!desertIsSafe(x, z)) gFails.push(`qs sign (${x}, ${z}) unsafe`);
  for (const [x, z] of DESERT_CHEST_SPOTS) {
    const nt = nearestTrail(x, z);
    if (!desertIsSafe(x, z) || (nt && nt.e < 1.5)) gFails.push(`chest (${x}, ${z})`);
  }
  if (!(getDesertStructures().length > 30)) gFails.push("structures missing");
  if (SUNSTONE.position[1] < PYRAMID.c[1] - PYRAMID.topHalf || SUNSTONE.position[1] > PYRAMID.c[1] + PYRAMID.topHalf) gFails.push("sunstone off the summit");
  if (MESAS.length < 2 || !REGIONS[REGION]) gFails.push("mesas / region");
  const ds10 = gFails.length === 0;
  checks.push({
    name: "Sunstone Desert: signposts point along trails, warning signs + chests on firm ground",
    pass: ds10,
    detail: ds10 ? `${DESERT_SIGNPOSTS.length} signposts, ${QS_SIGNS.length} quicksand signs, ${DESERT_CHEST_SPOTS.length} chest spots` : [...new Set(gFails)].slice(0, 6).join("; "),
  });
  return checks;
}
export { JUMP_APEX, WALK };
