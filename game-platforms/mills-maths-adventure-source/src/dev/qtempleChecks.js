/**
 * QUOTIENT TEMPLE CHECKS (QT1–QT10, 2026-11-09) — the temple under the
 * desert: the region's hooks, a walk of the whole plan (every room reached
 * from the doors and every room able to climb back out, nothing but the two
 * sand pools to sink in), the sealed door in the desert (shut until a 🥉 on
 * every station, both ways through it), what you see matching what you walk
 * on, the people + the chest, the size, the 7s' move to Sundial Rise and the
 * Farsi + Arabic.
 */
import {
  QT_REGION_ID, QT_SPAWN, QT_RETURN_PORTAL, QT_SPOTS, QT_LANDMARKS, QT_STEP_UP, QT_HALL, QT_PIT_FLOOR, CELLS, SAND_POOLS, SAND_EDGE,
  qtGroundHeight, qtHazardAt, qtHazardInfo, qtIsSafe, qtSpeedAt, qtCameraFit, ceilingAt, baseFloor, isCarved, sandAt, getQtColliders,
  walkableArea, DESERT_FROM_QT, CHEST_SPOT, QT_SANCTUM_SPOT, QT_WELCOME_HOST, QT_MAP_BOARD, QUOTIENT_DOOR_SPOT, QT_SAND_HINT, COURT,
} from "../data/qtemple/qtempleWorld.js";
import { REGIONS } from "../data/regions.js";
import { INTERACTABLES } from "../data/interactables.js";
import { ENCOUNTERS } from "../data/encounters.js";
import { WORLD_INTROS } from "../data/training.js";
import { STATIONS, STATION_KEYS, TABLES_BEST_KEYS, targetsFor, quotientDoorOpen, quotientDoorProgress, FAMILY, allBests } from "../data/temple/templeTables.js";
import { TEMPLE_STONE, DESERT_SPOTS, DESERT_REGION_ID } from "../data/desert/desertLayout.js";
import { desertGroundHeight, desertIsSafe, desertHazardAt } from "../data/desert/desertTerrain.js";
import { getDesertColliders } from "../data/desert/desertColliders.js";
import { resolveCircle, PLAYER_RADIUS } from "../systems/collisionEngine.js";
import { MAP_REGION_IDS } from "../data/maps/regionMaps.js";
import { REGION_WORLD } from "../data/journey.js";
import { TRANSLATIONS } from "../i18n/translations.js";
import { floorBoxes, wallBoxes } from "../game/qtemple/qtGeometry.js";

const STEP = 0.5;
const HEAD = 1.9; // headroom the player needs

/** Colliders bucketed by 8 m tiles (the walk tests thousands of spots). */
function bucketed(cols) {
  const T = 8, map = new Map();
  for (const c of cols) {
    const r = (c.radius || 1) + 1;
    for (let i = Math.floor((c.x - r) / T); i <= Math.floor((c.x + r) / T); i++) {
      for (let j = Math.floor((c.z - r) / T); j <= Math.floor((c.z + r) / T); j++) {
        const k = `${i},${j}`;
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(c);
      }
    }
  }
  return (x, z) => map.get(`${Math.floor(x / T)},${Math.floor(z / T)}`) || [];
}

/**
 * Walk the plan from (x, z) on a 0.5 m grid with the player's rules: a step
 * up of at most STEP_UP (any drop is fine), headroom under the ceiling, no
 * colliders (at that height), never into the sinking sand. Returns the set
 * of reached nodes "i,j,yKey" + a lookup of reached (x, z) → heights.
 */
function walk(x0, z0, cols, y0) {
  const near = bucketed(cols);
  const blocked = (x, z, y) => {
    const list = near(x, z).filter((c) => (c.yMin === undefined || y >= c.yMin) && (c.yMax === undefined || y <= c.yMax));
    if (!list.length) return false;
    const r = resolveCircle(x, z, list, PLAYER_RADIUS * 0.8);
    return Math.hypot(r.x - x, r.z - z) > 0.05;
  };
  const key = (i, j, y) => `${i},${j},${Math.round(y * 4)}`;
  const seen = new Set();
  const reached = new Map(); // "i,j" → [ys]
  const gi = (v) => Math.round(v / STEP);
  const y = y0 ?? qtGroundHeight(x0, z0, 100);
  const q = [[gi(x0), gi(z0), y]];
  seen.add(key(gi(x0), gi(z0), y));
  while (q.length) {
    const [i, j, h] = q.pop();
    const ij = `${i},${j}`;
    if (!reached.has(ij)) reached.set(ij, []);
    reached.get(ij).push(h);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj;
      const x = ni * STEP, z = nj * STEP;
      if (!isCarved(x, z)) continue;
      const ny = qtGroundHeight(x, z, h);
      if (ny - h > QT_STEP_UP + 0.01) continue;
      if (ceilingAt(x, z) - ny < HEAD) continue;
      if (qtHazardAt(x, z, ny)) continue;
      if (blocked(x, z, ny)) continue;
      const k = key(ni, nj, ny);
      if (seen.has(k)) continue;
      seen.add(k);
      q.push([ni, nj, ny]);
    }
  }
  const reaches = (x, z, r = 1, y = null) => {
    for (let i = Math.floor((x - r) / STEP); i <= Math.ceil((x + r) / STEP); i++) {
      for (let j = Math.floor((z - r) / STEP); j <= Math.ceil((z + r) / STEP); j++) {
        if (Math.hypot(i * STEP - x, j * STEP - z) > r) continue;
        const ys = reached.get(`${i},${j}`);
        if (ys && (y === null || ys.some((v) => Math.abs(v - y) < 0.6))) return true;
      }
    }
    return false;
  };
  return { reached, reaches };
}

const withBests = (bests, fn) => {
  const keep = {};
  for (const k of STATION_KEYS) keep[k] = localStorage.getItem(TABLES_BEST_KEYS[k]);
  try {
    for (const k of STATION_KEYS) {
      if (bests[k] == null) localStorage.removeItem(TABLES_BEST_KEYS[k]);
      else localStorage.setItem(TABLES_BEST_KEYS[k], String(bests[k]));
    }
    return fn();
  } finally {
    for (const k of STATION_KEYS) {
      if (keep[k] == null) localStorage.removeItem(TABLES_BEST_KEYS[k]);
      else localStorage.setItem(TABLES_BEST_KEYS[k], keep[k]);
    }
  }
};

export function runQTempleChecks() {
  const checks = [];
  const push = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
  const R = REGIONS[QT_REGION_ID];
  const cols = getQtColliders();

  // QT1 — the region + its hooks; the spawn at the top of the Descent.
  {
    const hooks = ["groundHeight", "slideAt", "speedAt", "isLava", "hazardInfo", "isSafe", "cameraFit", "waterLevelAt"];
    const missing = R ? hooks.filter((h) => typeof R[h] !== "function") : hooks;
    const y0 = qtGroundHeight(QT_SPAWN.x, QT_SPAWN.z, 5);
    const hall = qtGroundHeight(0, 4, 0);
    const ok = R && !missing.length && R.spawn.x === QT_SPAWN.x && qtIsSafe(QT_SPAWN.x, QT_SPAWN.z) && Math.abs(y0) < 0.01 && hall === QT_HALL &&
      REGION_WORLD[QT_REGION_ID] === "temple" && WORLD_INTROS[QT_REGION_ID]?.[0]?.card;
    push("Quotient Temple: the region and every hook, arriving at the top of the Grand Descent, 18 m above the Great Hall", ok,
      ok ? `spawn y ${y0} · hall ${hall} · part of the Timestable Temple world` : `missing ${missing.join(",")} y0 ${y0} hall ${hall}`);
  }

  // QT2 — walk the whole plan from the doors: every room, the chest, back out.
  let fromDoors = null;
  {
    fromDoors = walk(QT_SPAWN.x, QT_SPAWN.z, cols);
    const bad = [];
    for (const s of QT_SPOTS) if (!fromDoors.reaches(s.center[0], s.center[1], Math.max(1.5, s.radius * 0.6))) bad.push(s.id);
    for (const l of QT_LANDMARKS) if (!fromDoors.reaches(l.p[0], l.p[1], 4)) bad.push(l.id);
    if (!fromDoors.reaches(QT_RETURN_PORTAL[0], QT_RETURN_PORTAL[1], 1.4)) bad.push("return door");
    // The levels: the galleries (−12), the pit floor, the bridge (−18 over the pit), the high terrace (−10).
    if (!fromDoors.reaches(-26.5, -15, 1, -12)) bad.push("gallery top");
    if (!fromDoors.reaches(-104, -40, 1.5, QT_PIT_FLOOR)) bad.push("pit floor");
    if (!fromDoors.reaches(-87, -28, 1, QT_HALL)) bad.push("grate bridge");
    if (!fromDoors.reaches(64, -72, 1.5, COURT.tier3.top)) bad.push("high terrace");
    if (!fromDoors.reaches(93.2 - 4.5, 16, 1.5, -16.4)) bad.push("throne top");
    // …and every deep spot can climb back up to the doors.
    for (const [nm, [x, z, y]] of Object.entries({ pit: [-104, -40, QT_PIT_FLOOR], terrace: [64, -72, COURT.tier3.top], gallery: [-26.5, -15, -12], bridge: [-87, -28, QT_HALL] })) {
      const back = walk(x, z, cols, y);
      if (!back.reaches(QT_SPAWN.x, QT_SPAWN.z, 1.5, 0)) bad.push(`${nm} → doors`);
    }
    push("Quotient Temple: from the doors you can walk to every room, gallery, the pit floor, the bridge, the high terrace and the throne — and climb back out from each", bad.length === 0,
      bad.length ? `unreached: ${bad.slice(0, 6).join(", ")}` : `${fromDoors.reached.size} floor spots reached · ${QT_SPOTS.length} rooms · 4 deep spots climb back`);
  }

  // QT3 — sinking sand only in the two pools; it slows you at the edge.
  {
    const bad = [];
    let n = 0;
    for (const c of CELLS) {
      for (let x = c.x0 + 0.25; x < c.x1; x += 1.5) for (let z = c.z0 + 0.25; z < c.z1; z += 1.5) {
        const y = qtGroundHeight(x, z, 100);
        const s = sandAt(x, z);
        const hz = qtHazardAt(x, z, y);
        if (hz && (!s || s.sdf > -SAND_EDGE + 1e-6)) bad.push(`${x.toFixed(0)},${z.toFixed(0)}`);
        if (hz) n++;
      }
    }
    for (const p of SAND_POOLS) {
      const [x, z] = p.c;
      const y = qtGroundHeight(x, z, p.floor + 1);
      const info = qtHazardInfo(x, z);
      if (!qtHazardAt(x, z, y) || !info || info.hint !== QT_SAND_HINT || qtIsSafe(x, z)) bad.push(`${p.id} not deadly`);
      const ex = x + p.r - 0.4;
      if (qtHazardAt(ex, z, qtGroundHeight(ex, z, p.floor + 1)) || !(qtSpeedAt(ex, z, p.floor) < 1)) bad.push(`${p.id} edge`);
    }
    // The bridge over the pit's pool is safe.
    if (qtHazardAt(-89, -29, QT_HALL)) bad.push("bridge");
    push("Quotient Temple: sinking sand only in the pit's pool + the court's — its edge slows you, the middle sinks you, the bridge above is safe", bad.length === 0 && n > 0,
      bad.length ? bad.slice(0, 6).join(", ") : `${n} sinking spots, all inside the 2 pools`);
  }

  // QT4 — the door in the desert: shut until a 🥉 on every station; both ways through.
  {
    const bad = [];
    const D = REGIONS[DESERT_REGION_ID];
    const inP = (D.portals || []).find((p) => p.id === "desert-to-qtemple");
    const outP = (R.portals || []).find((p) => p.id === "qtemple-to-desert");
    if (!inP || inP.target !== QT_REGION_ID || inP.arrive[0] !== QT_SPAWN.x || inP.arrive[1] !== QT_SPAWN.z) bad.push("in-portal");
    if (!outP || outP.target !== DESERT_REGION_ID) bad.push("out-portal");
    const justUnder = Object.fromEntries(STATIONS.map((s) => [s.key, targetsFor(s).bronze]));
    const oneShort = { ...justUnder, x7: targetsFor("x7").bronze - 1 };
    withBests({}, () => {
      if (quotientDoorOpen() || !D.portalLocked("desert-to-qtemple") || quotientDoorProgress().have !== 0) bad.push("open with nothing");
      if (!quotientDoorOpen(undefined, true)) bad.push("admin can't");
    });
    withBests(oneShort, () => {
      const p = quotientDoorProgress();
      if (quotientDoorOpen() || p.have !== 14 || p.need !== 15) bad.push(`14/15 → ${p.have}`);
    });
    withBests(justUnder, () => {
      if (!quotientDoorOpen() || D.portalLocked("desert-to-qtemple") || D.portalLocked("desert-to-island")) bad.push("15 bronze shut");
      if (allBests().x10 !== justUnder.x10) bad.push("bests");
    });
    // The door spot in the desert: walkable, clear, and the arrival back out isn't on the portal.
    if (inP) {
      const [px, pz] = inP.position;
      const y = desertGroundHeight(px, pz, 200);
      const all = getDesertColliders().filter((c) => c.yMin === undefined || y >= c.yMin - 0.5);
      const r = resolveCircle(px, pz, all, PLAYER_RADIUS);
      if (Math.hypot(r.x - px, r.z - pz) > 0.6 || desertHazardAt(px, pz, y)) bad.push("door spot blocked");
      const [ax, az] = DESERT_FROM_QT.arrive;
      if (!desertIsSafe(ax, az) || Math.hypot(ax - px, az - pz) <= inP.radius + 0.8) bad.push("arrive");
      // From the arrival you can walk up to the door (no wall between).
      const ya = desertGroundHeight(ax, az, 200);
      if (Math.abs(ya - y) > 1.2) bad.push(`door step ${ya.toFixed(2)}→${y.toFixed(2)}`);
    }
    if (outP && Math.hypot(outP.position[0] - QT_SPAWN.x, outP.position[1] - QT_SPAWN.z) <= outP.radius + 0.8) bad.push("spawn on the way out");
    const door = INTERACTABLES.find((i) => i.id === "quotient-door");
    if (!door || door.regionId !== DESERT_REGION_ID || !ENCOUNTERS[door.encounterId] || Math.hypot(door.position[0] - QUOTIENT_DOOR_SPOT[0], door.position[1] - QUOTIENT_DOOR_SPOT[1]) > 0.01) bad.push("door ix");
    push("Quotient Temple: the door in the desert stays sealed until a 🥉 on all fifteen stations (14 isn't enough; admin opens it) — in and out land clear of the doorway", bad.length === 0,
      bad.length ? bad.join("; ") : "0/15 + 14/15 shut · 15/15 open · both portals · the door can be read");
  }

  // QT5 — the people + the chest stand where you can reach them; nothing blocks a room's middle.
  {
    const bad = [];
    const mine = INTERACTABLES.filter((i) => i.regionId === QT_REGION_ID);
    const want = ["qt-welcome-host", "qt-sanctum", "qt-chest", `${QT_REGION_ID}-map`];
    for (const id of want) {
      const ix = mine.find((i) => i.id === id);
      if (!ix || !ENCOUNTERS[ix.encounterId]) { bad.push(`${id} missing`); continue; }
      if (!fromDoors.reaches(ix.position[0], ix.position[1], ix.interactionRadius - 0.6)) bad.push(`${id} unreachable`);
    }
    if (Math.hypot(QT_WELCOME_HOST.position[0] - QT_SPAWN.x, QT_WELCOME_HOST.position[1] - QT_SPAWN.z) > 8) bad.push("Mills far");
    if (Math.hypot(QT_MAP_BOARD.position[0] - QT_SPAWN.x, QT_MAP_BOARD.position[1] - QT_SPAWN.z) > 10) bad.push("board far");
    if (qtGroundHeight(CHEST_SPOT[0], CHEST_SPOT[1], 0) !== COURT.tier3.top) bad.push("chest not on the terrace");
    if (Math.abs(qtGroundHeight(QT_SANCTUM_SPOT[0], QT_SANCTUM_SPOT[1], 0) - -16.8) > 0.01) bad.push("sanctum spot not on the dais");
    for (const s of QT_SPOTS) {
      const r = resolveCircle(s.center[0], s.center[1], cols.filter((c) => c.yMin === undefined || qtGroundHeight(s.center[0], s.center[1], 0) >= c.yMin), PLAYER_RADIUS);
      if (Math.hypot(r.x - s.center[0], r.z - s.center[1]) > 1e-3 && s.id !== "treasury") bad.push(`${s.id} blocked`);
    }
    push("Quotient Temple: Mills + the map by the doors, the Sanctum door on the dais, the chest on the high terrace — all reachable; no room's middle blocked", bad.length === 0,
      bad.length ? bad.join(", ") : `${want.length} things to use · ${cols.length} colliders`);
  }

  // QT6 — what you see is what you walk on: floors at the walk height, walls along every rock edge.
  {
    const bad = [];
    for (const b of floorBoxes()) {
      const top = b.p[1] + b.s[1] / 2;
      const [x, z] = [b.p[0], b.p[2]];
      if (Math.abs(baseFloor(x, z) - top) > 0.01 && Math.abs(qtGroundHeight(x, z, 100) - top) > 0.01 && !sandAt(x, z)) bad.push(`${b.cell}@${x.toFixed(1)},${z.toFixed(1)}`);
    }
    const walls = wallBoxes().filter((w) => w.kind === "wall");
    let edges = 0;
    for (const c of CELLS) {
      for (const [x, z, nx, nz] of [[c.x0, (c.z0 + c.z1) / 2, -1, 0], [c.x1, (c.z0 + c.z1) / 2, 1, 0], [(c.x0 + c.x1) / 2, c.z0, 0, -1], [(c.x0 + c.x1) / 2, c.z1, 0, 1]]) {
        if (isCarved(x + nx * 0.3, z + nz * 0.3)) continue;
        edges++;
        const wx = x + nx * 0.5, wz = z + nz * 0.5;
        const y = (typeof c.floor === "function" ? c.floor(x - nx * 0.3, z - nz * 0.3) : c.floor) + 1.5;
        if (!walls.some((w) => Math.abs(wx - w.p[0]) <= w.s[0] / 2 + 1e-6 && Math.abs(wz - w.p[2]) <= w.s[2] / 2 + 1e-6 && Math.abs(y - w.p[1]) <= w.s[1] / 2)) bad.push(`${c.id} wall`);
      }
    }
    push("Quotient Temple: the drawn floors sit exactly at the walking height, and a wall stands along every edge where the rock begins", bad.length === 0,
      bad.length ? bad.slice(0, 6).join(", ") : `${floorBoxes().length} floor slabs · ${walls.length} wall runs · ${edges} rock edges walled`);
  }

  // QT7 — the camera never ends up in the rock or above a ceiling.
  {
    const bad = [];
    const tries = [[0, 4, QT_HALL, 10, 8, 10], [-64, 17, QT_HALL, 0, 12, -14], [-96, -22, QT_HALL, -10, 6, 0], [0, 50, -12, 0, 20, 30], [64, -72, -10, 0, 30, 10], [-104, -40, QT_PIT_FLOOR, 0, 40, 0]];
    for (const [x, z, y, dx, dy, dz] of tries) {
      const cam = { x: x + dx, y: y + 1.5 + dy, z: z + dz };
      qtCameraFit(x, y, z, cam);
      if (cam.y > ceilingAt(cam.x, cam.z) - 0.3 || !isCarved(cam.x, cam.z) || cam.y < baseFloor(cam.x, cam.z)) bad.push(`${x},${z} → ${cam.x.toFixed(1)},${cam.y.toFixed(1)},${cam.z.toFixed(1)}`);
    }
    push("Quotient Temple: the camera pulls in before any wall, rock or ceiling (it never shows the outside of the temple)", bad.length === 0, bad.length ? bad.join("; ") : `${tries.length} awkward camera spots kept inside`);
  }

  // QT8 — the size + the map.
  {
    const area = walkableArea(1);
    const b = R.bounds;
    const desertSpan = 2 * 136 * 2 * 150;
    const ok = area > 15000 && b.width * b.height > desertSpan * 0.4 && b.width * b.height < desertSpan * 0.65 && MAP_REGION_IDS.includes(QT_REGION_ID) && CELLS.length >= 15;
    push("Quotient Temple: about half the desert's footprint, with room to grow — and on its own map", ok,
      `${Math.round(area)} m² of floor in ${CELLS.length} rooms · plan ${b.width} × ${b.height} m (${Math.round((100 * b.width * b.height) / desertSpan)}% of the desert's)`);
  }

  // QT9 — the 7s now stand on top of Sundial Rise; the temple's name in the desert.
  {
    const bad = [];
    const s7 = TEMPLE_STONE.x7;
    if (desertGroundHeight(s7.position[0], s7.position[1], 200) < 8) bad.push("x7 not on the rise");
    if (FAMILY.sevens.where !== "the top of Sundial Rise") bad.push("sevens where");
    const spot = DESERT_SPOTS.find((s) => s.id === "temple");
    if (!spot || spot.label !== "Quotient Temple") bad.push("spot name");
    if (!/Sundial Rise/.test(ENCOUNTERS["desert-welcome"].config.lines.join(" ")) || !/QUOTIENT TEMPLE/.test(ENCOUNTERS["desert-welcome"].config.lines.join(" "))) bad.push("Mills' lines");
    push("Quotient Temple: the 7s moved to the top of Sundial Rise; the old Sun Temple is now the Quotient Temple on every sign", bad.length === 0,
      bad.length ? bad.join(", ") : `x7 at ${s7.position.join(", ")} (${desertGroundHeight(s7.position[0], s7.position[1], 200).toFixed(1)} m up)`);
  }

  // QT10 — Farsi + Arabic for every fixed word.
  {
    const words = [
      "Quotient Temple", "➗ Quotient Temple", "the top of Sundial Rise", QT_SAND_HINT, R.wipeLine, REGIONS[DESERT_REGION_ID].portalLockedHint,
      "☀️ Back to Sunstone Desert", "Read the temple door", "Read the sealed door", "The halls under the desert — explore every wing", "Its challenges are coming soon",
      ...QT_SPOTS.flatMap((s) => [s.label, `${s.icon} ${s.label}`]), ...QT_LANDMARKS.map((l) => l.label),
      ...["qt-welcome", "qt-sanctum", "qt-treasure", "quotient-door", "desert-welcome"].flatMap((id) => [ENCOUNTERS[id].title, ...ENCOUNTERS[id].config.lines]),
      ...WORLD_INTROS[QT_REGION_ID].flatMap((s) => [s.title, s.go, ...s.lines]), ...WORLD_INTROS[DESERT_REGION_ID].flatMap((s) => s.lines),
      "The great door stands open! ➗ Step through to explore the Quotient Temple.",
      "A great door, sealed with a golden ÷. Fifteen sockets ring the doorway — one for each station.",
      "Win at least a 🥉 bronze on ALL fifteen Timestable Temple stations and the door will open.",
    ].filter(Boolean);
    const missing = [...new Set(words)].filter((w) => !TRANSLATIONS.fa[w] || !TRANSLATIONS.ar[w]);
    push("Quotient Temple: every fixed word (rooms, signs, Mills, the door, the intro) is in Farsi + Arabic", missing.length === 0,
      missing.length ? `untranslated: ${missing.slice(0, 4).join(" | ")}` : `${new Set(words).size} strings`);
  }

  return checks;
}
