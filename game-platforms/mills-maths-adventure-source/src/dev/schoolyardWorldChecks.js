/**
 * RETRIEVAL PRACTICE PLAYGROUND (rebuilt 2026-10-09) — headless WORLD checks
 * SY1–SY10. They read the SAME pure modules the game uses (schoolyardLayout
 * / Terrain / Rails / Colliders / Props / Progress + regions), so a passing
 * run means the multi-storey school you walk round, its stairs + corridors,
 * the guard rails, the Head Teacher's padlocked hall, the follow camera's
 * fit under the corridor roofs, and the harbour view genuinely agree.
 */
import {
  LV, STOREY, SCHOOL_FENCE, SCHOOLYARD_BOUNDS, SCHOOLYARD_SPAWN, SCHOOLYARD_RETURN_PORTAL, SCHOOLYARD_WELCOME, SCHOOL_BUILDINGS,
  SCHOOL_FLIGHTS, SCHOOL_RAMPS, SCHOOLYARD_CHARACTERS, SCHOOL_AREAS, SCHOOL_SIGNPOSTS, SCHOOL_CHEST_SPOTS, HALL, SKY_PIER,
  CORRIDOR_W, BACKDROP, SEA_Y, SCHOOL_PLATFORMS,
} from "../data/schoolyard/schoolyardLayout.js";
import {
  S_STEP_UP, getSchoolStructures, schoolGroundHeight, schoolSlideAt, schoolIsSafe, schoolCameraFit, schoolBlockedAt,
  schoolCeilingAt, terrainHeight, inSchoolBuilding, schoolSolidTopAt, corridorRect, coastZ, rawHeight,
} from "../data/schoolyard/schoolyardTerrain.js";
import { getSchoolRails } from "../data/schoolyard/schoolyardRails.js";
import { getSchoolyardColliders, schoolColumns } from "../data/schoolyard/schoolyardColliders.js";
import { SCHOOL_TREES, SCHOOL_FURNITURE, schoolPropFootprints, inPierView } from "../data/schoolyard/schoolyardProps.js";
import { SCHOOLYARD_KEY_IDS } from "../data/schoolyard/schoolyardProgress.js";
import { inRect, polySD, toWorld } from "../data/schoolyard/schoolyardGeom.js";
import { getRegion } from "../data/regions.js";
import { getInteractablesForRegion } from "../data/interactables.js";
import { STEP_UP } from "../systems/collisionEngine.js";
import { SNOW_BOUNDS } from "../data/snow/snowLayout.js";

const REGION = "schoolyard";
const R = 0.47; // the player's radius (as the flood fills elsewhere)
const ALL_KEYS = SCHOOLYARD_KEY_IDS.map((id) => `warmup-${id}`);

/** A height-banded collider lookup (circles + oriented boxes). */
function blocker(colliders) {
  const CELL = 4, map = new Map();
  for (const c of colliders) {
    const r = c.radius + 0.6;
    for (let i = Math.floor((c.x - r) / CELL); i <= Math.floor((c.x + r) / CELL); i++) {
      for (let j = Math.floor((c.z - r) / CELL); j <= Math.floor((c.z + r) / CELL); j++) {
        const k = i * 4096 + j;
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(c);
      }
    }
  }
  return (x, z, y, ignore = null) => {
    for (const c of map.get(Math.floor(x / CELL) * 4096 + Math.floor(z / CELL)) || []) {
      if (ignore && ignore(c)) continue;
      if (c.yMin !== undefined && y < c.yMin) continue;
      if (c.yMax !== undefined && y > c.yMax) continue;
      if (c.box) {
        const dx = x - c.x, dz = z - c.z;
        const lx = dx * c.cos - dz * c.sin, lz = dx * c.sin + dz * c.cos;
        const qx = Math.max(-c.hx, Math.min(c.hx, lx)), qz = Math.max(-c.hz, Math.min(c.hz, lz));
        if ((lx - qx) ** 2 + (lz - qz) ** 2 < R * R) return c;
      } else if (Math.hypot(x - c.x, z - c.z) < c.radius + R) return c;
    }
    return null;
  };
}

/** Flood fill on foot (0.5 m, the real step-up + slide + colliders at your height). */
function flood(colliders) {
  const blocked = blocker(colliders);
  const F = SCHOOL_FENCE, S = 0.5;
  const seen = new Map();
  const q = [];
  const key = (i, j, h) => `${i},${j},${Math.round(h * 2)}`;
  const push = (i, j, h) => { const k = key(i, j, h); if (seen.has(k)) return; seen.set(k, h); q.push([i, j, h]); };
  push(Math.round(SCHOOLYARD_SPAWN.x / S), Math.round(SCHOOLYARD_SPAWN.z / S), schoolGroundHeight(SCHOOLYARD_SPAWN.x, SCHOOLYARD_SPAWN.z, 0));
  let falls = 0;
  while (q.length) {
    const [i, j, h] = q.pop();
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const ni = i + di, nj = j + dj, x = ni * S, z = nj * S;
      if (x < F.xMin + 0.5 || x > F.xMax - 0.5 || z < F.zMin + 0.5 || z > F.zMax - 0.5) continue;
      const nh = schoolGroundHeight(x, z, h);
      if (nh - h > S_STEP_UP) continue;
      if (schoolSlideAt(x, z, nh) && nh > h + 0.02) continue;
      if (blocked(x, z, h) || blocked(x, z, nh)) continue;
      if (h - nh > 1.25) falls++;
      push(ni, nj, nh);
    }
  }
  // Reached-index: cells (2 m) → heights.
  const idx = new Map();
  for (const [k, h] of seen) {
    const [i, j] = k.split(",").map(Number);
    const kk = `${Math.round((i * S) / 2)},${Math.round((j * S) / 2)}`;
    if (!idx.has(kk)) idx.set(kk, []);
    idx.get(kk).push([i * S, j * S, h]);
  }
  const reached = (x, z, y, rad = 2.2) => {
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) {
      for (const [px, pz, h] of idx.get(`${Math.round(x / 2) + a},${Math.round(z / 2) + b}`) || []) {
        if (Math.abs(h - y) < 0.6 && Math.hypot(px - x, pz - z) < rad) return true;
      }
    }
    return false;
  };
  return { states: seen.size, falls, reached };
}

export function runSchoolyardWorldChecks() {
  const checks = [];
  const region = getRegion(REGION);
  const locked = getSchoolyardColliders({ completedMissions: [] });
  const open = getSchoolyardColliders({ completedMissions: ALL_KEYS });

  // SY1) Hooks, spawn, the gate home.
  {
    const hooks = ["groundHeight", "slideAt", "isSafe", "cameraFit"].every((k) => typeof region[k] === "function") && region.cameraTerrainClamp === true && region.arriveYaw === 0;
    const spawnY = schoolGroundHeight(SCHOOLYARD_SPAWN.x, SCHOOLYARD_SPAWN.z);
    const spawnOk = schoolIsSafe(SCHOOLYARD_SPAWN.x, SCHOOLYARD_SPAWN.z) && Math.abs(spawnY - LV.L0) < 0.05 && !blocker(locked)(SCHOOLYARD_SPAWN.x, SCHOOLYARD_SPAWN.z, spawnY);
    const portal = (region.portals || []).find((p) => p.target === "island-1");
    const [px, pz] = SCHOOLYARD_RETURN_PORTAL;
    const portalOk = Boolean(portal && portal.arrive) && Math.hypot(px - SCHOOLYARD_SPAWN.x, pz - SCHOOLYARD_SPAWN.z) > 6 &&
      Math.abs(schoolGroundHeight(px, pz) - LV.L0) < 0.05 && inRect({ c: SCHOOLYARD_BOUNDS.center, yaw: 0, hx: SCHOOLYARD_BOUNDS.width / 2, hz: SCHOOLYARD_BOUNDS.height / 2 }, px, pz);
    const stepOk = S_STEP_UP === STEP_UP;
    const pass = hooks && spawnOk && portalOk && stepOk;
    checks.push({ name: "SY1 Playground: region hooks, a safe arrival + the gate home", pass, detail: pass ? `spawn y ${spawnY.toFixed(2)}, portal ${portal.id}` : JSON.stringify({ hooks, spawnOk, portalOk, stepOk }) });
  }

  // SY2) Size + levels: Snowball-Sums-sized, three storeys on the hill.
  {
    const area = SCHOOLYARD_BOUNDS.width * SCHOOLYARD_BOUNDS.height;
    const snowArea = SNOW_BOUNDS.width * SNOW_BOUNDS.height;
    const ratio = area / snowArea;
    const storeys = Math.max(...SCHOOL_BUILDINGS.map((b) => b.floors));
    const decks = getSchoolStructures().list.filter((s) => s.kind === "deck").map((s) => s.y);
    const top = Math.max(...decks);
    const pass = ratio > 0.9 && ratio < 1.05 && storeys >= 3 && top >= LV.L4 && SKY_PIER.y - LV.L0 > 18;
    checks.push({ name: "SY2 Playground: Snowball Sums-sized, 3 storeys, levels L0–L4 + the Sky Pier", pass, detail: `${(ratio * 100).toFixed(0)}% of the snow world's area, ${storeys} storeys, top deck ${top} m, pier ${SKY_PIER.y} m` });
  }

  // SY3) Every flight + ramp is climbable and meets what it joins.
  {
    const bad = [];
    for (const s of getSchoolStructures().list) {
      if (s.kind === "flight") {
        const f = s.flight;
        if (f.rise > S_STEP_UP - 0.05) bad.push(`${s.id} rise ${f.rise}`);
        // The top tread's far edge meets ground / a deck at the flight's top level.
        const [tx, tz] = toWorld(s.r, s.r.hx + 0.35, 0);
        const topY = f.y0 + f.n * f.rise;
        const g = schoolGroundHeight(tx, tz, topY);
        if (Math.abs(g - topY) > S_STEP_UP) bad.push(`${s.id} top ${topY.toFixed(2)} meets ${g.toFixed(2)}`);
        const [bx, bz] = toWorld(s.r, -s.r.hx - 0.35, 0);
        const gb = schoolGroundHeight(bx, bz, f.y0);
        if (Math.abs(gb - f.y0) > S_STEP_UP) bad.push(`${s.id} foot ${f.y0} meets ${gb.toFixed(2)}`);
      }
    }
    for (const rp of SCHOOL_RAMPS) {
      const L = Math.hypot(rp.b[0] - rp.a[0], rp.b[1] - rp.a[1]);
      if (Math.abs(rp.y1 - rp.y0) / L > 1 / 12 + 0.002) bad.push(`${rp.id} grade ${(Math.abs(rp.y1 - rp.y0) / L).toFixed(3)}`);
    }
    checks.push({ name: "SY3 Playground: every stair flight + ramp climbable and joined (ramps ≤ 1:12)", pass: bad.length === 0, detail: bad.length ? bad.slice(0, 6).join("; ") : `${SCHOOL_FLIGHTS.length}+ flights, ${SCHOOL_RAMPS.length} ramps ok` });
  }

  // SY4) On foot from the gate: every staff member, every corridor, the hill +
  // the Sky Pier — and the hall only once all eight keys are in.
  {
    const L = flood(locked);
    const O = flood(open);
    const missing = [];
    for (const c of SCHOOLYARD_CHARACTERS) {
      const y = schoolGroundHeight(c.position[0], c.position[1]);
      const ok = c.boss ? !L.reached(c.position[0], c.position[1], y) && O.reached(c.position[0], c.position[1], y) : L.reached(c.position[0], c.position[1], y);
      if (!ok) missing.push(c.id);
    }
    for (const b of SCHOOL_BUILDINGS) {
      if (!b.corridor) continue;
      for (const f of b.corridor.floors) {
        const r = corridorRect(b, f);
        if (!L.reached(r.c[0], r.c[1], r.y, 3)) missing.push(`${b.id} deck ${f}`);
      }
    }
    const [px, pz] = toWorld({ c: SKY_PIER.to, yaw: 0 }, 0, 0);
    if (!L.reached(px - 1, pz - 2, SKY_PIER.y, 3)) missing.push("sky pier");
    for (const s of SCHOOL_SIGNPOSTS) if (!L.reached(s.p[0], s.p[1], schoolGroundHeight(s.p[0], s.p[1]), 3)) missing.push(`signpost ${s.id}`);
    for (const [x, z] of SCHOOL_CHEST_SPOTS) if (!L.reached(x, z, schoolGroundHeight(x, z), 3)) missing.push(`chest ${x},${z}`);
    const hallLocked = L.reached(57, -30, LV.L1, 3), hallOpen = O.reached(57, -30, LV.L1, 3);
    if (hallLocked || !hallOpen) missing.push(`hall locked=${hallLocked} open=${hallOpen}`);
    const pass = missing.length === 0 && L.falls === 0;
    checks.push({ name: "SY4 Playground: a flood fill on foot reaches all staff, decks, the pier — the hall only with 8 keys", pass, detail: pass ? `${L.states} states, no unguarded drops` : `missing: ${missing.join(", ")}; falls ${L.falls}` });
  }

  // SY5) The staff stand on proper ground: their level, not in a building, not
  // on a stair, clear of rails + columns; the interactables match the layout.
  {
    const bad = [];
    const cols = schoolColumns();
    const rails = getSchoolRails();
    for (const c of SCHOOLYARD_CHARACTERS) {
      const [x, z] = c.position;
      const y = schoolGroundHeight(x, z);
      const inB = inSchoolBuilding(x, z, 0.3);
      if (inB && !inB.hall) bad.push(`${c.id} in a building`);
      const on = getSchoolStructures().list.filter((s) => s.top(x, z) !== null);
      if (on.some((s) => s.kind === "flight" || s.kind === "ramp")) bad.push(`${c.id} on a stair`);
      if (cols.some((k) => Math.hypot(k.x - x, k.z - z) < 1.0 && y >= k.y0 - 0.5 && y <= k.y1)) bad.push(`${c.id} hugs a column`);
      if (rails.some((r) => Math.abs(r.ya - y) < 1 && (() => { const dx = r.b[0] - r.a[0], dz = r.b[1] - r.a[1]; const L2 = dx * dx + dz * dz || 1; const t = Math.max(0, Math.min(1, ((x - r.a[0]) * dx + (z - r.a[1]) * dz) / L2)); return Math.hypot(x - r.a[0] - dx * t, z - r.a[1] - dz * t) < 0.75; })())) bad.push(`${c.id} hugs a rail`);
    }
    const mahoney = SCHOOLYARD_CHARACTERS.find((c) => c.id === "mahoney"), ewings = SCHOOLYARD_CHARACTERS.find((c) => c.id === "ewings");
    if (Math.abs(schoolGroundHeight(...mahoney.position) - LV.L4) > 0.01) bad.push("Mahoney not on the top floor");
    if (Math.abs(schoolGroundHeight(...ewings.position) - LV.L4) > 0.01) bad.push("Ewings not on the top floor");
    const ix = getInteractablesForRegion(REGION);
    for (const c of SCHOOLYARD_CHARACTERS) {
      const it = ix.find((i) => i.id === c.id);
      if (!it) bad.push(`${c.id} has no interactable`);
      if (it && (Math.abs(it.position[0] - c.position[0]) > 0.01 || Math.abs(it.position[1] - c.position[1]) > 0.01)) bad.push(`${c.id} interactable moved`);
    }
    const mills = ix.find((i) => i.id === "schoolyard-sign");
    if (!mills || mills.position[0] !== SCHOOLYARD_WELCOME.position[0] || mills.position[1] !== SCHOOLYARD_WELCOME.position[1]) bad.push("Mills not at the welcome spot");
    checks.push({ name: "SY5 Playground: staff placed on their level, off stairs, clear of rails + columns", pass: bad.length === 0, detail: bad.length ? bad.join("; ") : "9 staff + Mills placed" });
  }

  // SY6) No unguarded drop: walking off any deck / terrace / landing edge
  // where the ground below is > 1.25 m down is blocked by a rail collider
  // (stairs + level joins are the only openings).
  {
    const blocked = blocker(locked);
    let gaps = 0;
    const where = [];
    for (const s of getSchoolStructures().list) {
      if (!["deck", "landing", "platform"].includes(s.kind) || s.id === "hall-stage") continue;
      const pts = s.kind === "platform" ? s.platform.pts : null;
      const edges = [];
      if (pts) {
        for (let i = 0; i < pts.length; i++) edges.push([pts[i], pts[(i + 1) % pts.length]]);
      } else if (s.r) {
        const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => toWorld(s.r, a * s.r.hx, b * s.r.hz));
        for (let i = 0; i < 4; i++) edges.push([cs[i], cs[(i + 1) % 4]]);
      }
      const y = s.kind === "platform" ? s.platform.y : s.y;
      for (const [a, b] of edges) {
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const n = Math.max(1, Math.round(L / 0.5));
        let nx = (b[1] - a[1]) / L, nz = -(b[0] - a[0]) / L;
        const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
        if (s.top(mx + nx * 0.3, mz + nz * 0.3) !== null) { nx = -nx; nz = -nz; }
        for (let k = 0; k < n; k++) {
          const t = (k + 0.5) / n;
          const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
          const ix = x - nx * 0.3, iz = z - nz * 0.3;
          if (s.top(ix, iz) === null) continue;
          if (x < SCHOOL_FENCE.xMin + 0.6 || x > SCHOOL_FENCE.xMax - 0.6 || z < SCHOOL_FENCE.zMin + 0.6 || z > SCHOOL_FENCE.zMax - 0.6) continue;
          const ox = x + nx * 0.3, oz = z + nz * 0.3;
          if (inSchoolBuilding(ox, oz, 0.05)) continue;
          const g = schoolGroundHeight(ox, oz, y);
          if (y - g <= 1.25) continue;
          // Something must stop you between the inside and the outside.
          let stop = false;
          for (let u = -0.2; u <= 0.7; u += 0.15) if (blocked(x + nx * u, z + nz * u, y)) { stop = true; break; }
          if (!stop) { gaps++; if (where.length < 6) where.push(`${s.id}@${x.toFixed(1)},${z.toFixed(1)}`); }
        }
      }
    }
    checks.push({ name: "SY6 Playground: every edge with a real drop is guarded (rails / parapets)", pass: gaps === 0, detail: gaps ? `${gaps} gaps: ${where.join(" ")}` : `${getSchoolRails().length} rail runs` });
  }

  // SY7) The Head Teacher's doors: padlocked shut across the WHOLE doorway
  // until the 8 keys are in, then open.
  {
    const gate = locked.filter((c) => String(c.id).startsWith("sy-gate"));
    const openGate = open.filter((c) => String(c.id).startsWith("sy-gate"));
    let gap = 0;
    const blocked = blocker(gate);
    for (let x = HALL.doorX[0] + 0.05; x < HALL.doorX[1]; x += 0.1) if (!blocked(x, HALL.doorZ + 0.6, LV.L1)) gap++;
    const pass = gate.length > 0 && openGate.length === 0 && gap === 0;
    checks.push({ name: "SY7 Playground: the hall doors are padlocked across the doorway until all 8 keys", pass, detail: pass ? `${gate.length} door colliders, opens with ${ALL_KEYS.length} keys` : `gate ${gate.length}, open ${openGate.length}, gap samples ${gap}` });
  }

  // SY8) The follow camera fits: under every corridor deck it keeps the sight
  // line below the ceiling + out of the blocks; in the open it's untouched.
  {
    const bad = [];
    const spots = [];
    for (const b of SCHOOL_BUILDINGS) {
      if (!b.corridor) continue;
      for (const f of [0, ...b.corridor.floors]) {
        if (f === 0 && !b.corridor.ground) continue;
        for (const lx of [-0.6, 0, 0.6]) {
          const c = b.corridor;
          const [x, z] = toWorld(b, ((c.x0 + c.x1) / 2) * 0.5 + lx * (c.x1 - c.x0) * 0.4, b.hz + CORRIDOR_W / 2);
          spots.push([x, b.y0 + f * STOREY, z, b]);
        }
      }
    }
    for (const [x, y, z, b] of spots) {
      for (let a = 0; a < 8; a++) {
        const yaw = (a / 8) * Math.PI * 2;
        const cam = { x: x + Math.sin(yaw) * 12, y: y + 4.5, z: z + Math.cos(yaw) * 12 };
        schoolCameraFit(x, y, z, cam);
        const hy = y + 1.45;
        for (let k = 1; k <= 20; k++) {
          const t = k / 20;
          const px = x + (cam.x - x) * t, py = hy + (cam.y - hy) * t, pz = z + (cam.z - z) * t;
          if (schoolBlockedAt(px, py, pz)) { bad.push(`${b.id}@${y} yaw ${a} blocked`); break; }
          const u = schoolCeilingAt(px, pz, hy + 0.15);
          if (py > u - 0.05) { bad.push(`${b.id}@${y} yaw ${a} through ceiling`); break; }
        }
      }
    }
    const open2 = { x: 14, y: 4.5, z: 124 };
    schoolCameraFit(14, 0, 112, open2);
    if (Math.abs(open2.x - 14) + Math.abs(open2.y - 4.5) + Math.abs(open2.z - 124) > 1e-6) bad.push("open plaza camera moved");
    checks.push({ name: "SY8 Playground: the follow camera tucks under the corridor roofs + stays out of the blocks", pass: bad.length === 0, detail: bad.length ? bad.slice(0, 5).join("; ") : `${spots.length * 8} camera fits clear` });
  }

  // SY9) Scatter: trees + furniture off the paving, stairs, decks + buildings,
  // clear of the staff; the Sky Pier's harbour view left open.
  {
    const bad = [];
    const npcSpots = [...SCHOOLYARD_CHARACTERS.map((c) => c.position), SCHOOLYARD_WELCOME.position, [SCHOOLYARD_SPAWN.x, SCHOOLYARD_SPAWN.z], SCHOOLYARD_RETURN_PORTAL];
    for (const t of SCHOOL_TREES) {
      if (inSchoolBuilding(t.x, t.z, 0.5)) bad.push(`tree in building ${t.x.toFixed(0)},${t.z.toFixed(0)}`);
      if (!t.planted && SCHOOL_PLATFORMS.some((p) => polySD(p.pts, t.x, t.z) < 0.5)) bad.push(`tree on a terrace ${t.x.toFixed(0)},${t.z.toFixed(0)}`);
      if (npcSpots.some(([x, z]) => Math.hypot(x - t.x, z - t.z) < 2.5)) bad.push(`tree on a staff spot ${t.x.toFixed(0)},${t.z.toFixed(0)}`);
      if (!t.planted && t.z > 0 && inPierView(t.x, t.z)) bad.push(`tree in the pier view ${t.x.toFixed(0)},${t.z.toFixed(0)}`);
    }
    for (const f of SCHOOL_FURNITURE) {
      if (f.kind === "chairs" || f.kind === "lectern") continue; // inside the hall
      if (inSchoolBuilding(f.x, f.z, 0)) bad.push(`${f.kind} in a building`);
      const on = getSchoolStructures().list.filter((s) => (s.kind === "flight" || s.kind === "ramp") && s.top(f.x, f.z) !== null);
      if (on.length) bad.push(`${f.kind} on ${on[0].id}`);
    }
    for (const fp of schoolPropFootprints()) {
      if (npcSpots.some(([x, z]) => Math.hypot(x - fp.x, z - fp.z) < 1.3)) bad.push(`${fp.id} on a staff spot`);
      const reach = fp.circle ? fp.r : Math.hypot(fp.hx, fp.hz);
      if (SCHOOL_CHEST_SPOTS.some(([x, z]) => Math.hypot(x - fp.x, z - fp.z) < reach + 1.2)) bad.push(`${fp.id} on a chest spot`);
    }
    checks.push({ name: "SY9 Playground: trees + furniture placed clear (paving, stairs, staff, the pier view)", pass: bad.length === 0, detail: bad.length ? bad.slice(0, 6).join("; ") : `${SCHOOL_TREES.length} trees, ${SCHOOL_FURNITURE.length} furniture` });
  }

  // SY10) The backdrop: the town + the sea are outside the fence and below
  // the school; from the Sky Pier the line to the harbour clears every roof.
  {
    const bad = [];
    const minCoast = Math.min(...Array.from({ length: 41 }, (_, i) => coastZ(-200 + i * 10)));
    if (minCoast - SCHOOL_FENCE.zMax < 100) bad.push(`beach only ${(minCoast - SCHOOL_FENCE.zMax).toFixed(0)} m from the fence`);
    if (rawHeight(0, coastZ(0) + 20) > SEA_Y + 0.5) bad.push("no sea beyond the beach");
    const [jx, jz] = BACKDROP.jetty.from;
    if (jz < SCHOOL_FENCE.zMax + 50) bad.push("jetty too close");
    // The pier's sight line (eye 1.6 m up at its end) to the harbour mouth.
    const eye = [SKY_PIER.to[0], SKY_PIER.y + 1.6, SKY_PIER.to[1]];
    for (const target of [[BACKDROP.jetty.to[0], BACKDROP.jetty.y, BACKDROP.jetty.to[1]], [BACKDROP.muttonbird.c[0], SEA_Y + BACKDROP.muttonbird.h * 0.7, BACKDROP.muttonbird.c[1]]]) {
      for (let k = 1; k < 200; k++) {
        const t = k / 200;
        const x = eye[0] + (target[0] - eye[0]) * t, y = eye[1] + (target[1] - eye[1]) * t, z = eye[2] + (target[2] - eye[2]) * t;
        if (Math.abs(x) > 175 || Math.abs(z) > 165) break;
        if (schoolBlockedAt(x, y, z)) { bad.push(`pier view blocked at ${x.toFixed(0)},${z.toFixed(0)}`); break; }
        if (terrainHeight(x, z) > y) { bad.push(`pier view hits the ground at ${x.toFixed(0)},${z.toFixed(0)}`); break; }
        const s = schoolSolidTopAt(x, z);
        if (s !== null && s > y) { bad.push(`pier view hits ${x.toFixed(0)},${z.toFixed(0)}`); break; }
      }
    }
    void jx;
    checks.push({ name: "SY10 Playground: the town + harbour lie beyond the fence, and the Sky Pier sees the sea", pass: bad.length === 0, detail: bad.length ? bad.join("; ") : `beach ${(minCoast - SCHOOL_FENCE.zMax).toFixed(0)} m beyond the fence; pier → jetty + Muttonbird clear` });
  }

  void SCHOOL_AREAS;
  return checks;
}
