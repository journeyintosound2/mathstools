/**
 * EMERALD JUNGLE — headless system checks (JG1–JG8). Everything here reads the
 * SAME pure modules the game uses (jungleLayout / jungleProps /
 * jungleColliders / regions), so a passing run means the walkable world, the
 * climbing routes and the colliders genuinely agree.
 *
 * The jump numbers mirror Player.jsx (JUMP_VELOCITY 7.2, GRAVITY 20,
 * MOVE_SPEED 7) — if those change, change them here too.
 */
import {
  JUNGLE_REGION_ID, JUNGLE_NAME, JUNGLE_BOUNDS, JUNGLE_SPAWN, JUNGLE_RETURN_PORTAL, J_STEP_UP,
  JUNGLE_SPOTS, JUNGLE_PATHS, ARRIVAL_GLADE, PLATEAU_H, LAGOON, GREAT_TREE, MUSHROOM_LEDGE, WADE_SPEED, SLIDE_SLOPE,
  ensureJungleStructures, getJungleStructures, JUNGLE_BRIDGES, LEAF_PADS, LILY_PADS, BOUNCE_PADS, VINE_WALLS, STAIR_FLIGHTS,
  GREAT_STAIR, ROPE_BRIDGE, TEMPLE, LOOKOUT, FALLS_DECK, TOADSTOOL, MID_LEDGE, escarpZ, escarpWidth,
  terrainHeight, slopeAt, jungleWaterAt, structureTopAt, pathEdgeDist, getJungleGrid, GRID,
  jungleGroundHeight, jungleSlideAt, jungleClimbAt, jungleBounceAt, jungleSpeedAt, jungleIsSafe,
} from "../data/jungle/jungleLayout.js";
import { getJungleProps } from "../data/jungle/jungleProps.js";
import { landSD, MAGMA_BOUNDS } from "../data/magma/magmaLayout.js";
import { getRegion } from "../data/regions.js";
import { onPad } from "../data/island/islandTerrain.js";
import { getColliders } from "../data/worldColliders.js";
import { BUILT_JUNGLE_CHALLENGES } from "../data/jungle/jungleChallenges.js";
import { PLAYER_RADIUS, STEP_UP } from "../systems/collisionEngine.js";

const JUMP_V = 7.2, G = 20, WALK = 7;
const JUMP_APEX = (JUMP_V * JUMP_V) / (2 * G); // ≈ 1.30 m
/** How far a running-start (walk speed) jump carries before it falls back to `dh` above take-off. */
const jumpReach = (dh) => {
  const disc = JUMP_V * JUMP_V - 2 * G * dh;
  if (disc < 0) return -1;
  return WALK * ((JUMP_V + Math.sqrt(disc)) / G);
};

/** A collider hash so the flood fill can ask "is a collider HERE at feet height h?" fast. */
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

export function runJungleChecks() {
  const checks = [];
  ensureJungleStructures();
  getJungleGrid();
  const region = getRegion(JUNGLE_REGION_ID);
  const island = getRegion("island-1");
  const colliders = getColliders({}, JUNGLE_REGION_ID);
  const blockedAt = colliderLookup(colliders);
  const R = JUNGLE_BOUNDS.radius;

  // JG1) Region + gates: the six hooks are wired; the GREEN mossy gate on
  //      Number Island targets the jungle, sits on the island clear of every
  //      island collider and of the other gates; the return gate goes home
  //      from dry, safe ground; the spawn is safe, dry, collider-free and out of
  //      the return gate's trigger (no bounce loop); the jungle's step-up
  //      matches the collision engine's.
  const toJungle = (island.portals || []).find((p) => p.target === JUNGLE_REGION_ID);
  const back = (region.portals || []).find((p) => p.target === "island-1");
  const hooksOk = Boolean(region) && region.name === JUNGLE_NAME && region.bounds === JUNGLE_BOUNDS &&
    region.groundHeight === jungleGroundHeight && region.slideAt === jungleSlideAt && region.climbAt === jungleClimbAt &&
    region.bounceAt === jungleBounceAt && region.speedAt === jungleSpeedAt && region.isSafe === jungleIsSafe &&
    region.cameraTerrainClamp === true && region.maxFrameDelta > 0 && region.maxFrameDelta <= 0.1;
  const otherGates = (island.portals || []).filter((p) => p !== toJungle);
  const islandGateOk = Boolean(toJungle) && toJungle.variant === "jungle" &&
    // (2026-10-09) On the rebuilt island it stands on the lagoon ledge.
    onPad("jungle", toJungle.position[0], toJungle.position[1]) &&
    getColliders({}, "island-1").every((c) => Math.hypot(c.x - toJungle.position[0], c.z - toJungle.position[1]) > c.radius + 2.2) &&
    otherGates.every((p) => Math.hypot(p.position[0] - toJungle.position[0], p.position[1] - toJungle.position[1]) > 8);
  const [bx, bz] = JUNGLE_RETURN_PORTAL;
  const backOk = Boolean(back) && back.variant === "jungle" && back.position === JUNGLE_RETURN_PORTAL &&
    jungleIsSafe(bx, bz) && Math.hypot(bx, bz) < R - 10;
  const sp = JUNGLE_SPAWN;
  const spawnOk = jungleIsSafe(sp.x, sp.z) && !blockedAt(sp.x, sp.z, terrainHeight(sp.x, sp.z)) &&
    Math.hypot(sp.x - bx, sp.z - bz) > back.radius + 2 && Math.hypot(sp.x, sp.z) < R - 10 &&
    region.spawn.x === sp.x && region.spawn.z === sp.z;
  const stepOk = J_STEP_UP === STEP_UP;
  const jg1 = hooksOk && islandGateOk && backOk && spawnOk && stepOk;
  checks.push({
    name: "Emerald Jungle: region hooks + green island gate + return gate + safe spawn",
    pass: jg1,
    detail: jg1 ? `gate at [${toJungle.position}] → ${JUNGLE_NAME}; spawn safe; step-up ${STEP_UP}` : `hooks:${hooksOk} gate:${islandGateOk} back:${backOk} spawn:${spawnOk} step:${stepOk}`,
  });

  // JG2) Size: about TWICE Magma Multiples' land. Jungle "land" = every 1 m
  //      cell inside the bounds you could stand on (dry, not a cliff/rim
  //      face); Magma's is counted the way MG2 counts it.
  let land = 0;
  for (let x = -R; x <= R; x += 1) {
    for (let z = -R; z <= R; z += 1) {
      if (Math.hypot(x, z) > R) continue;
      if (x < GRID.xMin || x > GRID.xMax || z < GRID.zMin || z > GRID.zMax) continue;
      if (jungleWaterAt(x, z) !== null || slopeAt(x, z) >= SLIDE_SLOPE) continue;
      land++;
    }
  }
  let magmaLand = 0;
  const MR = MAGMA_BOUNDS.radius;
  for (let x = -MR; x <= MR; x += 1) for (let z = -MR; z <= MR; z += 1) {
    if (Math.hypot(x, z) <= MR && landSD(x, z) >= 0) magmaLand++;
  }
  const ratio = land / magmaLand;
  const jg2 = ratio > 1.8 && ratio < 2.4;
  checks.push({
    name: "Emerald Jungle: about twice the size of Magma Multiples",
    pass: jg2,
    detail: `walkable land ${land} m² = ${ratio.toFixed(2)}× Magma's ${magmaLand} m²`,
  });

  // JG3) Every TRAIL is walkable as the player walks it (layered ground: bridge
  //      decks carry you over the water): along each centreline every 0.4 m
  //      step rises ≤ STEP_UP, nothing slides, and no collider (at that
  //      height) stands on it.
  let badRise = 0, slides = 0, blocked = [], samples = 0;
  for (const p of JUNGLE_PATHS) {
    let h = null;
    for (let i = 0; i < p.pts.length - 1; i++) {
      const [ax, az] = p.pts[i], [cx, cz] = p.pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(cx - ax, cz - az) / 0.4));
      for (let k = 0; k < n; k++) {
        const x = ax + ((cx - ax) * k) / n, z = az + ((cz - az) * k) / n;
        const nh = jungleGroundHeight(x, z, h === null ? terrainHeight(x, z) : h);
        if (h !== null && nh - h > STEP_UP) badRise++;
        if (jungleSlideAt(x, z, nh)) slides++;
        const b = blockedAt(x, z, nh, 0.2);
        if (b && blocked.length < 6) blocked.push(`${p.id}:${b.id}`);
        h = nh;
        samples++;
      }
    }
  }
  const jg3 = badRise === 0 && slides === 0 && blocked.length === 0;
  checks.push({
    name: "Emerald Jungle: every trail is walkable end to end (bridges carry you over water)",
    pass: jg3,
    detail: jg3 ? `${JUNGLE_PATHS.length} trails, ${samples} steps` : `rise:${badRise} slide:${slides} blocked:${blocked.join(", ")}`,
  });

  // JG4) REACHABLE on foot (no jumps): flood-fill a 0.5 m grid of standable
  //      ground (layered at ground level — solid stairs/landings/decks count,
  //      thin decks overhead don't; water is wadeable) from the spawn. It must
  //      reach all ten clearings (the Sky Shrine is up on the plateau — so the
  //      plateau is reachable without climbing), the return gate, the foot of
  //      every vine wall, the Great Tree's stair, every bounce pad's foot, the
  //      temple roof and both lookouts.
  const S = 0.5;
  const nx = Math.round((GRID.xMax - GRID.xMin) / S) + 1, nz = Math.round((GRID.zMax - GRID.zMin) / S) + 1;
  const hg = new Float32Array(nx * nz);
  const ok = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    const z = GRID.zMin + j * S;
    for (let i = 0; i < nx; i++) {
      const x = GRID.xMin + i * S;
      if (Math.hypot(x, z) > R - 1) continue;
      const t = terrainHeight(x, z);
      const h = jungleGroundHeight(x, z, t);
      if (jungleSlideAt(x, z, h)) continue;
      if (blockedAt(x, z, h, 0.35)) continue;
      ok[j * nx + i] = 1;
      hg[j * nx + i] = h;
    }
  }
  const cellOf = (x, z) => [Math.round((x - GRID.xMin) / S), Math.round((z - GRID.zMin) / S)];
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
  const reach = ([x, z], rad = 1.5) => {
    const [ci, cj] = cellOf(x, z);
    const n = Math.ceil(rad / S);
    for (let dj = -n; dj <= n; dj++) for (let di = -n; di <= n; di++) {
      const i = ci + di, j = cj + dj;
      if (i < 0 || j < 0 || i >= nx || j >= nz) continue;
      if (seen[j * nx + i]) return true;
    }
    return false;
  };
  const stairFoot = [GREAT_TREE.center[0] + Math.cos(GREAT_STAIR.phi0 + 0.5 * GREAT_STAIR.dphi) * (GREAT_STAIR.rOut + 0.9),
    GREAT_TREE.center[1] + Math.sin(GREAT_STAIR.phi0 + 0.5 * GREAT_STAIR.dphi) * (GREAT_STAIR.rOut + 0.9)];
  const roof = TEMPLE.block;
  const targets = [
    ...JUNGLE_SPOTS.map((s) => [s.id, s.center]),
    ["arrival", ARRIVAL_GLADE.center],
    ["return-gate", [bx + 2, bz - 2]],
    ...VINE_WALLS.filter((w) => w.id === "vine-wall-a").map((w) => [w.id, [(w.a[0] + w.b[0]) / 2 + w.nx * 1.4, (w.a[1] + w.b[1]) / 2 + w.nz * 1.4]]),
    ["great-stair-foot", stairFoot],
    ...BOUNCE_PADS.filter((p) => p.id !== "bounce-ledge").map((p) => [`${p.id}-foot`, [p.c[0], p.c[1]], p.r + 1.4]),
    ["temple-roof", [roof.c[0], roof.c[1]], 1],
    ["falls-deck", FALLS_DECK.c, 1],
    ["canopy-lookout", LOOKOUT.c, 1],
    ["lagoon-shore", [70, 110.5], 1.5],
  ];
  const unreached = targets.filter(([, p, rad]) => !reach(p, rad || 1.5)).map(([id]) => id);
  const jg4 = unreached.length === 0;
  checks.push({
    name: "Emerald Jungle: every clearing, the plateau, the climbs' feet and the gate are reachable on foot",
    pass: jg4,
    detail: jg4 ? `${targets.length} targets reached from the spawn (0.5 m flood fill)` : `unreached: ${unreached.join(", ")}`,
  });

  // JG5) THE CLIMBS work by the numbers:
  //   • vine walls — climbAt catches you at the foot and mid-way, lets go at
  //     the top, and the ground over the lip is the level above (the plateau,
  //     or the mid ledge for the lower half of the Vine Cliffs route);
  //   • leaf poles — each pad a hop up from the last (rise ≤ 1.1 m, gap within
  //     a running jump), the first a hop off the ground, the last a hop below
  //     the mid ledge, whose own vine wall goes on to the plateau;
  //   • every stair flight rises ≤ STEP_UP a step and tops out exactly at its
  //     landing (plateau 16 m / temple roof / lookout deck);
  //   • the Great Tree spiral: steps ≤ STEP_UP, first step a step off the
  //     ground, last step = the deck, the deck's hatch opens over it, and the
  //     rope bridge leaves from the deck and lands on walkable ridge ground.
  const fails = [];
  for (const w of VINE_WALLS) {
    const mx = (w.a[0] + w.b[0]) / 2, mz = (w.a[1] + w.b[1]) / 2;
    const foot = jungleClimbAt(mx + w.nx * 0.6, mz + w.nz * 0.6, w.base + 0.05);
    const mid = jungleClimbAt(mx + w.nx * 0.6 - w.nx * w.cliffW * 0.5, mz + w.nz * 0.6 - w.nz * w.cliffW * 0.5, (w.base + w.top) / 2);
    const top = jungleClimbAt(mx - w.nx * w.cliffW * 0.95, mz - w.nz * w.cliffW * 0.95, w.top + 0.05);
    const ox = mx - w.nx * (w.cliffW + 1.3), oz = mz - w.nz * (w.cliffW + 1.3);
    const over = jungleGroundHeight(ox, oz, w.top + 0.3);
    if (!foot || foot.wall !== w || !mid || top) fails.push(`${w.id}:grip`);
    if (Math.abs(over - w.top) > STEP_UP) fails.push(`${w.id}:lip ${over.toFixed(2)}≠${w.top.toFixed(2)}`);
    if (jungleSlideAt(ox, oz, over)) fails.push(`${w.id}:lip slides`);
  }
  if (VINE_WALLS.find((w) => w.id === "vine-wall-a")?.top !== PLATEAU_H) fails.push("wall-a top");
  const wb = VINE_WALLS.find((w) => w.id === "vine-wall-b");
  if (!wb || wb.base !== MID_LEDGE.top || wb.top !== PLATEAU_H) fails.push("wall-b span");
  // Leaf poles.
  const pads = LEAF_PADS;
  const first = pads[0];
  if (first.top - first.floor > JUMP_APEX - 0.15) fails.push("pad-0 too high off the ground");
  for (let i = 1; i < pads.length; i++) {
    const a = pads[i - 1], b = pads[i];
    const rise = b.top - a.top;
    const gap = Math.hypot(a.c[0] - b.c[0], a.c[1] - b.c[1]) - a.r - b.r;
    if (rise > 1.1 || rise < 0.2) fails.push(`pad-${i} rise ${rise.toFixed(2)}`);
    if (gap > jumpReach(rise) - 1.2 || gap < 0.3) fails.push(`pad-${i} gap ${gap.toFixed(2)}`);
  }
  {
    const last = pads[pads.length - 1];
    const rise = MID_LEDGE.top - last.top;
    const [lx, lz] = MID_LEDGE.local(last.c[0], last.c[1]);
    const gap = Math.max(0, Math.abs(lz) - MID_LEDGE.hz, Math.abs(lx) - MID_LEDGE.hx) - last.r;
    if (rise > 1.1 || rise < 0.2 || gap > jumpReach(rise) - 1.2) fails.push(`ledge hop rise ${rise.toFixed(2)} gap ${gap.toFixed(2)}`);
  }
  // Stair flights.
  for (const f of STAIR_FLIGHTS) {
    const step = (f.h1 - f.h0) / f.n;
    if (step > STEP_UP) fails.push(`${f.id}: step ${step.toFixed(2)}`);
    const firstUp = f.stepAt(0.001) - terrainHeight(f.a[0], f.a[1]);
    if (firstUp > STEP_UP) fails.push(`${f.id}: first step ${firstUp.toFixed(2)}`);
  }
  const fs = STAIR_FLIGHTS.find((f) => f.id === "falls-stairs");
  if (!fs || fs.h1 !== PLATEAU_H) fails.push("falls-stairs top");
  // Walk each built route the way the player would (layered ground, every
  // 0.25 m rises ≤ STEP_UP, nothing slides, no collider in the way).
  const walkRoute = (label, pts, endY) => {
    let h = null;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [cx, cz] = pts[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(cx - ax, cz - az) / 0.25));
      for (let k = 0; k <= n; k++) {
        const x = ax + ((cx - ax) * k) / n, z = az + ((cz - az) * k) / n;
        const nh = jungleGroundHeight(x, z, h === null ? terrainHeight(x, z) : h);
        if (h !== null && nh - h > STEP_UP) { fails.push(`${label}: ${(nh - h).toFixed(2)} m step at ${x.toFixed(1)},${z.toFixed(1)}`); return; }
        if (jungleSlideAt(x, z, nh)) { fails.push(`${label}: slides at ${x.toFixed(1)},${z.toFixed(1)}`); return; }
        const b = blockedAt(x, z, nh, 0.3);
        if (b) { fails.push(`${label}: ${b.id} in the way`); return; }
        h = nh;
      }
    }
    if (endY !== undefined && Math.abs(h - endY) > 0.6) fails.push(`${label}: ends at ${h.toFixed(2)} not ${endY.toFixed(2)}`);
  };
  {
    const zf = fs.a[1];
    const trailEnd = JUNGLE_PATHS.find((p) => p.id === "trail-stairs").pts.slice(-1)[0];
    walkRoute("falls stairs", [trailEnd, [fs.a[0] + 0.6, zf], [fs.b[0] + 0.3, zf], [fs.b[0] - 1.6, zf - 2], [fs.b[0] - 1.6, zf - 9.5]], PLATEAU_H);
    for (const f of TEMPLE.flights) {
      const back = [f.a[0] + f.dir[0] * -2, f.a[1] + f.dir[1] * -2];
      // Up the flight, on along the landing, then turn in over the roof.
      const turn = [f.b[0] + f.dir[0] * 1.3, f.b[1] + f.dir[1] * 1.3];
      walkRoute(f.id, [back, f.a, turn, [turn[0], f.b[1] + (TEMPLE.c[1] - f.b[1]) * 0.5], [TEMPLE.block.c[0], TEMPLE.block.c[1]]], TEMPLE.roofY);
    }
    const lk = STAIR_FLIGHTS.find((f) => f.id === "lookout-steps");
    walkRoute("lookout steps", [[lk.a[0] + 2, lk.a[1]], lk.a, lk.b, LOOKOUT.c], LOOKOUT.top);
  }
  if (!TEMPLE.flights.every((f) => f.h1 === TEMPLE.roofY)) fails.push("temple flights top");
  if (STAIR_FLIGHTS.find((f) => f.id === "lookout-steps")?.h1 !== LOOKOUT.top) fails.push("lookout steps top");
  // The Great Tree.
  {
    const st = GREAT_STAIR;
    for (let k = 1; k < st.n; k++) if (st.stepTop(k) - st.stepTop(k - 1) > STEP_UP + 1e-9) { fails.push(`spiral step ${k}`); break; }
    const a0 = st.phi0 + 0.5 * st.dphi, rm = (st.rIn + st.rOut) / 2;
    const g0 = terrainHeight(GREAT_TREE.center[0] + Math.cos(a0) * (st.rOut + 0.6), GREAT_TREE.center[1] + Math.sin(a0) * (st.rOut + 0.6));
    if (st.stepTop(0) - g0 > STEP_UP) fails.push(`spiral first step ${(st.stepTop(0) - g0).toFixed(2)}`);
    if (st.stepTop(st.n - 1) !== GREAT_TREE.deckY) fails.push("spiral top ≠ deck");
    if (st.dphi * rm < 0.6) fails.push(`spiral tread ${(st.dphi * rm).toFixed(2)} m`);
    // Headroom: one winding above another is far more than a body's height.
    if ((Math.PI * 2 / st.dphi) * st.rise < 3) fails.push("spiral headroom");
    // The hatch is open over the last steps (no head-bump) and the deck is solid elsewhere.
    const deck = getJungleStructures().find((s) => s.id === "great-deck");
    const aLast = st.phi0 + (st.n - 0.5) * st.dphi;
    const hx = GREAT_TREE.center[0] + Math.cos(aLast) * rm, hz = GREAT_TREE.center[1] + Math.sin(aLast) * rm;
    if (!deck.inHatch(hx, hz)) fails.push("hatch not over the stair top");
    const aOpp = aLast + Math.PI;
    if (deck.topAt(GREAT_TREE.center[0] + Math.cos(aOpp) * 8, GREAT_TREE.center[1] + Math.sin(aOpp) * 8, Infinity) !== GREAT_TREE.deckY) fails.push("deck floor");
    // Rope bridge.
    const rb = ROPE_BRIDGE;
    const rFrom = Math.hypot(rb.from[0] - GREAT_TREE.center[0], rb.from[1] - GREAT_TREE.center[1]);
    const endG = terrainHeight(rb.to[0], rb.to[1]);
    if (rb.h0 !== GREAT_TREE.deckY || rFrom > GREAT_TREE.deckR) fails.push("rope bridge start");
    if (Math.abs(rb.h1 - endG) > STEP_UP || jungleSlideAt(rb.to[0] + 1, rb.to[1], endG)) fails.push("rope bridge landing");
  }
  const jg5 = fails.length === 0;
  checks.push({
    name: "Emerald Jungle: vine walls, leaf poles, stairs, the spiral stair + rope bridge all climb",
    pass: jg5,
    detail: jg5 ? `${VINE_WALLS.length} vine walls, ${pads.length} leaf pads, ${STAIR_FLIGHTS.length} flights, ${GREAT_STAIR.n}-step spiral to ${GREAT_TREE.deckY} m` : fails.slice(0, 6).join("; "),
  });

  // JG6) BOUNCE + WATER: every mushroom cap launches (bounceAt only AT the
  //      cap's top); the glade pad's bounce clears the rock ledge and the
  //      ledge's own mushroom clears the giant toadstool, which is within a
  //      steered hop; the cap is a THIN roof you can walk under (only its
  //      stem is solid). Water is knee-deep everywhere (wade, never swim) and
  //      slows you only when your feet are in it; lily pads float on the
  //      lagoon a hop apart.
  const bfails = [];
  for (const p of BOUNCE_PADS) {
    if (jungleBounceAt(p.c[0], p.c[1], p.top) !== p) bfails.push(`${p.id} no bounce`);
    // The cap is a dome: landing near its rim (lower) bounces too, and its
    // rim is low enough that a hop from the ground clears it.
    const rimH = p.heightAt(p.c[0] + p.r * 0.9, p.c[1]);
    if (jungleBounceAt(p.c[0] + p.r * 0.9, p.c[1], rimH) !== p) bfails.push(`${p.id} rim no bounce`);
    if (p.top - p.dome - p.floor > JUMP_APEX - 0.5) bfails.push(`${p.id} rim too high to hop onto`);
    if (jungleBounceAt(p.c[0], p.c[1], p.top + 1.5)) bfails.push(`${p.id} bounces mid-air`);
    if ((p.vy * p.vy) / (2 * G) < 2.5) bfails.push(`${p.id} weak`);
  }
  // A steered bounce (walk speed × 0.75, as Player.jsx carries it) must LAND
  // on its target: apex above it, and the flight's reach inside its far rim.
  const bounceLands = (pad, target, label) => {
    const dh = target.top - pad.top;
    const apex = (pad.vy * pad.vy) / (2 * G);
    if (apex < dh + 0.6) { bfails.push(`${label}: apex ${apex.toFixed(2)} < ${dh.toFixed(2)}`); return; }
    const t = (pad.vy + Math.sqrt(pad.vy * pad.vy - 2 * G * dh)) / G;
    const reach = WALK * 0.75 * t;
    const gap = Math.hypot(pad.c[0] - target.c[0], pad.c[1] - target.c[1]) - pad.r - target.r;
    if (reach < gap + 0.3 || reach > gap + 2 * target.r - 0.3) bfails.push(`${label}: reach ${reach.toFixed(1)} vs gap ${gap.toFixed(1)}`);
  };
  const ledge = getJungleStructures().find((s) => s.id === "mushroom-ledge");
  bounceLands(BOUNCE_PADS.find((p) => p.id === "bounce-0"), ledge, "glade → ledge");
  bounceLands(BOUNCE_PADS.find((p) => p.id === "bounce-ledge"), TOADSTOOL, "ledge → toadstool");
  // Mushrooms + leaf poles stand OFF the trails.
  for (const p of [...BOUNCE_PADS.filter((q) => q.id !== "bounce-ledge"), ...LEAF_PADS]) {
    const np = pathEdgeDist(p.c[0], p.c[1]);
    const tp = JUNGLE_PATHS.length && (() => { let e = Infinity; for (const q of JUNGLE_PATHS) for (let i = 0; i < q.pts.length - 1; i++) { const [ax, az] = q.pts[i], [cx, cz] = q.pts[i + 1]; const dx = cx - ax, dz = cz - az; const L2 = dx * dx + dz * dz || 1; const t = Math.max(0, Math.min(1, ((p.c[0] - ax) * dx + (p.c[1] - az) * dz) / L2)); e = Math.min(e, Math.hypot(p.c[0] - ax - dx * t, p.c[1] - az - dz * t) - q.hw); } return e; })();
    if (tp < p.r + 0.4) bfails.push(`${p.id} on a trail (${tp.toFixed(1)})`);
    void np;
  }
  {
    const under = [TOADSTOOL.c[0] + TOADSTOOL.r - 1, TOADSTOOL.c[1]];
    const g = terrainHeight(under[0], under[1]);
    if (Math.abs(jungleGroundHeight(under[0], under[1], g) - g) > 0.05) bfails.push("toadstool cap not walk-under");
    if (jungleGroundHeight(under[0], under[1], TOADSTOOL.top) !== TOADSTOOL.top) bfails.push("toadstool cap not standable");
  }
  // Water depth over the whole grid.
  const grid = getJungleGrid();
  let maxDepth = 0, wet = 0;
  for (let k = 0; k < grid.water.length; k++) {
    if (Number.isNaN(grid.water[k])) continue;
    const d = grid.water[k] - grid.h[k];
    if (d > 0) { wet++; maxDepth = Math.max(maxDepth, d); }
  }
  if (maxDepth > 0.9) bfails.push(`water ${maxDepth.toFixed(2)} m deep`);
  // Wading: slower in the river, full speed on a bridge deck over it and on land.
  const ford = JUNGLE_BRIDGES.find((b) => b.id === "bridge-ford");
  const fm = [(ford.from[0] + ford.to[0]) / 2, (ford.from[1] + ford.to[1]) / 2];
  const deck = ford.deckAt(0.5);
  const fg = terrainHeight(fm[0], fm[1]);
  if (jungleSpeedAt(fm[0], fm[1], fg) !== WADE_SPEED) bfails.push("no wading in the river");
  if (jungleSpeedAt(fm[0], fm[1], deck) !== 1) bfails.push("slow on the bridge");
  if (jungleSpeedAt(sp.x, sp.z, terrainHeight(sp.x, sp.z)) !== 1) bfails.push("slow on land");
  // Lily pads: on the lagoon, ≤ a hop apart.
  for (let i = 0; i < LILY_PADS.length; i++) {
    const p = LILY_PADS[i];
    if (jungleWaterAt(p.c[0], p.c[1]) === null) bfails.push(`${p.id} not on water`);
    if (i > 0) {
      const q = LILY_PADS[i - 1];
      const gap = Math.hypot(p.c[0] - q.c[0], p.c[1] - q.c[1]) - p.r - q.r;
      if (gap > 2.2) bfails.push(`${p.id} gap ${gap.toFixed(2)}`);
    }
  }
  const jg6 = bfails.length === 0;
  checks.push({
    name: "Emerald Jungle: mushrooms bounce you up; the water is knee-deep and only slows wading",
    pass: jg6,
    detail: jg6 ? `${BOUNCE_PADS.length} mushrooms; ${wet} wet m², max depth ${maxDepth.toFixed(2)} m; ${LILY_PADS.length} lily pads` : bfails.slice(0, 6).join("; "),
  });

  // JG7) BRIDGES + CLIFFS: every water bridge spans water (dry, step-on ends,
  //      deck above the surface, rails both sides at deck height so you can
  //      still wade under); the escarpment is a real wall — its face slides
  //      you down everywhere except the built routes up it.
  const brFails = [];
  for (const b of JUNGLE_BRIDGES) {
    if (b === ROPE_BRIDGE) continue;
    const m = [(b.from[0] + b.to[0]) / 2, (b.from[1] + b.to[1]) / 2];
    const w = jungleWaterAt(m[0], m[1]);
    if (w === null) brFails.push(`${b.id} no water under`);
    else if (b.deckAt(0.5) < w + 0.15) brFails.push(`${b.id} deck in the water`);
    for (const [e, h] of [[b.from, b.h0], [b.to, b.h1]]) {
      if (jungleWaterAt(e[0], e[1]) !== null) brFails.push(`${b.id} wet end`);
      if (Math.abs(h - terrainHeight(e[0], e[1])) > STEP_UP) brFails.push(`${b.id} end step`);
    }
    const rails = colliders.filter((c) => c.id.startsWith(`jg-rail-${b.id}-`));
    const midRail = rails.find((c) => c.id === `jg-rail-${b.id}-${Math.floor(rails.length / 4)}-1`);
    if (rails.length < 6) brFails.push(`${b.id} rails ${rails.length}`);
    if (midRail && (midRail.yMin > b.deckAt(0.5) || midRail.yMin < w - 0.9)) brFails.push(`${b.id} rail band`);
  }
  let faceN = 0, faceSlides = 0;
  for (let x = -100; x <= 100; x += 2.5) {
    if (x > 4 && x < 21) continue; // the falls
    const z = escarpZ(x) - escarpWidth(x) * 0.5;
    const t = terrainHeight(x, z);
    if (t > PLATEAU_H - 3 || t < 4) continue; // only the true mid-face
    if (structureTopAt(x, z, t + STEP_UP) !== null) continue; // a built route up
    faceN++;
    if (jungleSlideAt(x, z, t)) faceSlides++;
  }
  if (faceN < 30 || faceSlides < faceN * 0.9) brFails.push(`cliff face slides ${faceSlides}/${faceN}`);
  const jg7 = brFails.length === 0;
  checks.push({
    name: "Emerald Jungle: bridges span the water (wade-under rails); the escarpment is a sliding wall",
    pass: jg7,
    detail: jg7 ? `${JUNGLE_BRIDGES.length - 1} water bridges; cliff face slides at ${faceSlides}/${faceN} samples` : brFails.slice(0, 6).join("; "),
  });

  // JG8) The ten CLEARINGS are open spaces for the challenges: ten of
  //      them, ≥ 14 m apart, dry and flat, nothing solid in the middles of
  //      the ones not yet claimed by a built challenge,
  //      and no tree/rock/log collider anywhere on a trail.
  const spots = JUNGLE_SPOTS;
  let apart = true;
  for (let a = 0; a < spots.length; a++) for (let b = a + 1; b < spots.length; b++) {
    if (Math.hypot(spots[a].center[0] - spots[b].center[0], spots[a].center[1] - spots[b].center[1]) < 14) apart = false;
  }
  const flatDry = spots.filter((s) => jungleWaterAt(s.center[0], s.center[1]) !== null || slopeAt(s.center[0], s.center[1]) > 0.15).map((s) => s.id);
  // Clearings CLAIMED by a built challenge (the vine ladders, 2026-10-10)
  // are checked by the challenge checks (JC*) instead.
  const claimed = new Set(BUILT_JUNGLE_CHALLENGES.map((c) => c.spot));
  const middleBlocked = spots.filter((s) => !claimed.has(s.id) && colliders.some((c) => c.yMin === undefined &&
    Math.hypot(c.x - s.center[0], c.z - s.center[1]) < Math.min(3.5, s.radius - 0.5) + c.radius)).map((s) => s.id);
  const scatter = colliders.filter((c) => /^jg-(broadleaf|conifer|giant|palm|emergent|rock|log|stump)/.test(c.id));
  const onPath = scatter.filter((c) => pathEdgeDist(c.x, c.z) < c.radius).map((c) => c.id);
  const props = getJungleProps();
  const treeCount = Object.values(props.trees).reduce((n, a) => n + a.length, 0);
  const jg8 = spots.length === 10 && apart && flatDry.length === 0 && middleBlocked.length === 0 && onPath.length === 0;
  checks.push({
    name: "Emerald Jungle: ten open, flat clearings reserved; no props on the trails",
    pass: jg8,
    detail: jg8 ? `${spots.length} clearings; ${treeCount} trees, ${scatter.length} scatter colliders clear of trails` : `apart:${apart} flat/dry:${flatDry} middle:${middleBlocked} onPath:${onPath.slice(0, 4)}`,
  });

  return checks;
}
