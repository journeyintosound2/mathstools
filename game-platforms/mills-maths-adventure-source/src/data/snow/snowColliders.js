/**
 * SNOW COLLIDERS (rebuilt 2026-10-08) — solid props for Snowball Sums.
 * Circles only (cheap, jitter-free), same shape as every other region:
 *   { id, kind, x, z, radius, jumpable?, yMin?, yMax? }
 * Built from the SAME data the renderer draws (snowLayout + snowProps +
 * snowTerrain), so visuals and collision can't drift.
 *
 * The valley's rim is terrain (it slides you back) and a solid, NON-jumpable
 * boundary run sits on the rim line as a backstop. Fort Frost's snow walls,
 * logs and stumps are JUMPABLE (vault them with Space). Bridge rails only
 * block at deck height (yMin / yMax).
 */
import {
  SNOW_BOUNDARY, SNOW_WELCOME_SIGN, SNOW_RECORDS_STAND,
  RANGE_FRAME_POS, RANGE_CRATE_POS, RANGE_SIGN, RINK_GLIDE_SIGN, GROVE_TREE_POS, GROVE_BOX_POS, GROVE_SIGN,
  MEADOW_TOWER_LEFT, MEADOW_TOWER_RIGHT, MEADOW_SIGN, SLOPE_SIGN, VILLAGE_LEFT_STAND, VILLAGE_RIGHT_STAND,
  VILLAGE_BUILD_SITE, VILLAGE_SIGN, COLONY_SIGN, CAVE_SIGN, YARD_STALL, YARD_BOARD, YARD_SIGN, LOOKOUT_DECK,
  LOOKOUT_SIGN, SNOW_LODGE,
} from "./snowLayout.js";
import { SNOW_FOOTPRINTS, FORT_WALLS, getSnowProps, SNOW_TRUNK_R } from "./snowProps.js";
import { SNOW_BRIDGES, ensureSnowStructures } from "./snowTerrain.js";

const BORDER_SPACING = 2.2;
const BORDER_RADIUS = 1.1;
function borderRunColliders(idPrefix, x1, z1, x2, z2) {
  const cols = [];
  const len = Math.hypot(x2 - x1, z2 - z1);
  const steps = Math.max(1, Math.round(len / BORDER_SPACING));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    cols.push({ id: `${idPrefix}-${i}`, kind: "boundary", x: x1 + (x2 - x1) * t, z: z1 + (z2 - z1) * t, radius: BORDER_RADIUS });
  }
  return cols;
}
function boundaryColliders() {
  const { halfW, halfD } = SNOW_BOUNDARY;
  return [
    ...borderRunColliders("snow-border-n", -halfW, -halfD, halfW, -halfD),
    ...borderRunColliders("snow-border-s", -halfW, halfD, halfW, halfD),
    ...borderRunColliders("snow-border-w", -halfW, -halfD, -halfW, halfD),
    ...borderRunColliders("snow-border-e", halfW, -halfD, halfW, halfD),
  ];
}
function rectColliders(id, f, kind = "boundary", extra = {}) {
  const cols = [];
  const c = Math.cos(f.rot), s = Math.sin(f.rot);
  const r = Math.min(1.6, Math.max(0.5, Math.min(f.w, f.d) / 2));
  const nx = Math.max(1, Math.ceil((f.w - 2 * r) / (r * 1.4)) + 1);
  const nz = Math.max(1, Math.ceil((f.d - 2 * r) / (r * 1.4)) + 1);
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      const lx = nx === 1 ? 0 : -f.w / 2 + r + ((f.w - 2 * r) * i) / (nx - 1);
      const lz = nz === 1 ? 0 : -f.d / 2 + r + ((f.d - 2 * r) * j) / (nz - 1);
      cols.push({ id: `${id}-${i}-${j}`, kind, x: f.x + lx * c + lz * s, z: f.z - lx * s + lz * c, radius: r, ...extra });
    }
  }
  return cols;
}
/** The lodge as a grid of circles over its walls (a closed building). */
function lodgeColliders() {
  const cols = [];
  const hw = SNOW_LODGE.w / 2;
  const hd = SNOW_LODGE.d / 2;
  for (let x = -hw + 1; x <= hw - 1; x += 2.4) {
    for (let z = -hd + 1; z <= hd - 1; z += 2.4) {
      cols.push({ id: `snow-lodge-${cols.length}`, kind: "boundary", x: SNOW_LODGE.x + x, z: SNOW_LODGE.z + z, radius: 1.6 });
    }
  }
  return cols;
}

// Footprints that aren't solid this way (walk-through, or solid through
// their own collider below / an interactable's).
const WALKABLE = new Set(["spawn", "portal", "records", "lodge", "lodge-door", "lift-base", "lift-top", "falls"]);
const SKIP_PREFIX = ["host-", "chest-", "fort-"];

let _static = null;
function buildStatic() {
  if (_static) return _static;
  ensureSnowStructures();
  const out = [
    ...boundaryColliders(),
    ...lodgeColliders(),
    { id: "snow-welcome-sign", kind: "boundary", x: SNOW_WELCOME_SIGN.position[0], z: SNOW_WELCOME_SIGN.position[1], radius: 0.6 },
    { id: "snow-records", kind: "interactable", x: SNOW_RECORDS_STAND.position[0], z: SNOW_RECORDS_STAND.position[1], radius: 3.6 },
    // The ten challenges' props + hosts (same ids as ever).
    { id: "snow-range-frame", kind: "boundary", x: RANGE_FRAME_POS[0], z: RANGE_FRAME_POS[1], radius: 0.9 },
    { id: "snow-range-crates", kind: "boundary", x: RANGE_CRATE_POS[0], z: RANGE_CRATE_POS[1], radius: 0.8 },
    { id: "snow-range-sign", kind: "boundary", x: RANGE_SIGN.position[0], z: RANGE_SIGN.position[1], radius: 0.6 },
    { id: "snow-rink-sign", kind: "boundary", x: RINK_GLIDE_SIGN.position[0], z: RINK_GLIDE_SIGN.position[1], radius: 0.6 },
    { id: "snow-grove-tree", kind: "tree", x: GROVE_TREE_POS[0], z: GROVE_TREE_POS[1], radius: 1.0 },
    { id: "snow-grove-box", kind: "boundary", x: GROVE_BOX_POS[0], z: GROVE_BOX_POS[1], radius: 0.8 },
    { id: "snow-pines-sign", kind: "boundary", x: GROVE_SIGN.position[0], z: GROVE_SIGN.position[1], radius: 0.6 },
    { id: "snow-meadow-left", kind: "boundary", x: MEADOW_TOWER_LEFT[0], z: MEADOW_TOWER_LEFT[1], radius: 0.8 },
    { id: "snow-meadow-right", kind: "boundary", x: MEADOW_TOWER_RIGHT[0], z: MEADOW_TOWER_RIGHT[1], radius: 0.8 },
    { id: "snow-snowmen-sign", kind: "boundary", x: MEADOW_SIGN.position[0], z: MEADOW_SIGN.position[1], radius: 0.6 },
    { id: "snow-sled-sign", kind: "boundary", x: SLOPE_SIGN.position[0], z: SLOPE_SIGN.position[1], radius: 0.6 },
    { id: "snow-village-left", kind: "boundary", x: VILLAGE_LEFT_STAND[0], z: VILLAGE_LEFT_STAND[1], radius: 1.0 },
    { id: "snow-village-right", kind: "boundary", x: VILLAGE_RIGHT_STAND[0], z: VILLAGE_RIGHT_STAND[1], radius: 1.0 },
    { id: "snow-village-site", kind: "boundary", x: VILLAGE_BUILD_SITE[0], z: VILLAGE_BUILD_SITE[1], radius: 1.2 },
    { id: "snow-village-sign", kind: "boundary", x: VILLAGE_SIGN.position[0], z: VILLAGE_SIGN.position[1], radius: 0.6 },
    { id: "snow-colony-sign", kind: "boundary", x: COLONY_SIGN.position[0], z: COLONY_SIGN.position[1], radius: 0.6 },
    { id: "snow-cave-sign", kind: "boundary", x: CAVE_SIGN.position[0], z: CAVE_SIGN.position[1], radius: 0.6 },
    { id: "snow-yard-stall", kind: "boundary", x: YARD_STALL[0], z: YARD_STALL[1], radius: 1.0 },
    { id: "snow-yard-board", kind: "boundary", x: YARD_BOARD[0], z: YARD_BOARD[1], radius: 0.9 },
    { id: "snow-yard-sign", kind: "boundary", x: YARD_SIGN.position[0], z: YARD_SIGN.position[1], radius: 0.6 },
    { id: "snow-lookout-deck", kind: "boundary", x: LOOKOUT_DECK[0], z: LOOKOUT_DECK[1], radius: 1.6 },
    { id: "snow-lights-sign", kind: "boundary", x: LOOKOUT_SIGN.position[0], z: LOOKOUT_SIGN.position[1], radius: 0.6 },
  ];

  // --- Buildings + set-pieces (their footprints). ---------------------------
  for (const f of SNOW_FOOTPRINTS) {
    if (WALKABLE.has(f.id) || SKIP_PREFIX.some((p) => f.id.startsWith(p))) continue;
    if (f.id.startsWith("signpost-")) { out.push({ id: `snow-${f.id}`, kind: "landmark", x: f.x, z: f.z, radius: 0.25 }); continue; }
    if (f.id.startsWith("lamp-")) { out.push({ id: `snow-${f.id}`, kind: "boundary", x: f.x, z: f.z, radius: 0.3 }); continue; }
    if (f.id.startsWith("cane-")) { out.push({ id: `snow-${f.id}`, kind: "boundary", x: f.x, z: f.z, radius: 0.25 }); continue; }
    if (f.id.startsWith("snowman-")) { out.push({ id: `snow-${f.id}`, kind: "boundary", x: f.x, z: f.z, radius: 0.55 }); continue; }
    if (f.id.startsWith("xmas-")) { out.push({ id: `snow-${f.id}`, kind: "tree", x: f.x, z: f.z, radius: 0.7 }); continue; }
    if (f.id.startsWith("igloo-")) { out.push({ id: `snow-${f.id}`, kind: "boundary", x: f.x, z: f.z, radius: 2.0 }); continue; }
    if (f.id.startsWith("lift-tower-")) { out.push({ id: `snow-${f.id}`, kind: "boundary", x: f.x, z: f.z, radius: 0.6 }); continue; }
    if (f.id === "village-tree") { out.push({ id: "snow-village-tree", kind: "tree", x: f.x, z: f.z, radius: 1.2 }); continue; }
    if (f.id === "giant-snowman") { out.push({ id: "snow-giant-snowman", kind: "boundary", x: f.x, z: f.z, radius: 4.4 }); continue; }
    if (f.shape === "circle") out.push({ id: `snow-${f.id}`, kind: "boundary", x: f.x, z: f.z, radius: f.r });
    else out.push(...rectColliders(`snow-${f.id}`, f));
  }
  // Fort Frost's snow walls: jumpable (a snowball-fight fort).
  FORT_WALLS.forEach((w, wi) => {
    const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
    const n = Math.max(1, Math.round(L / 1.2));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      out.push({ id: `snow-fort-${wi}-${i}`, kind: "boundary", x: w.a[0] + (w.b[0] - w.a[0]) * t, z: w.a[1] + (w.b[1] - w.a[1]) * t, radius: 0.7, jumpable: true });
    }
  });

  // --- Trees, rocks, crags, logs, stumps (from the scatter). ---------------
  const P = getSnowProps();
  for (const [kind, arr] of Object.entries(P.trees)) {
    arr.forEach((t, i) => {
      if (Math.abs(t.x) > SNOW_BOUNDARY.halfW + 4 || Math.abs(t.z) > SNOW_BOUNDARY.halfD + 4) return; // mountainside only
      out.push({ id: `snow-${kind}-${i}`, kind: "tree", x: t.x, z: t.z, radius: SNOW_TRUNK_R[kind] * t.s });
    });
  }
  P.rocks.forEach((r, i) => { if (r.s > 0.6) out.push({ id: `snow-rock-${i}`, kind: "prop", x: r.x, z: r.z, radius: 0.7 * r.s, jumpable: r.s < 0.9 }); });
  P.crags.forEach((r, i) => {
    if (Math.abs(r.x) > SNOW_BOUNDARY.halfW || Math.abs(r.z) > SNOW_BOUNDARY.halfD) return;
    out.push({ id: `snow-crag-${i}`, kind: "prop", x: r.x, z: r.z, radius: 0.75 * r.s });
  });
  P.logs.forEach((l, i) => {
    for (let k = -1; k <= 1; k++) {
      out.push({ id: `snow-log-${i}-${k}`, kind: "prop", x: l.x + Math.cos(l.rot) * 0.9 * l.s * k, z: l.z - Math.sin(l.rot) * 0.9 * l.s * k, radius: 0.35 * l.s, jumpable: true });
    }
  });
  P.stumps.forEach((s, i) => out.push({ id: `snow-stump-${i}`, kind: "prop", x: s.x, z: s.z, radius: 0.4 * s.s, jumpable: true }));

  // --- Bridge railings (only at deck height). -------------------------------
  for (const b of SNOW_BRIDGES) {
    const dx = b.to[0] - b.from[0], dz = b.to[1] - b.from[1];
    const L = Math.hypot(dx, dz) || 1;
    const nx = -dz / L, nz = dx / L;
    const off = b.halfWidth + 0.3;
    const n = Math.max(3, Math.round(L / 0.9));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const h = b.deckAt(t);
      for (const s of [1, -1]) {
        out.push({ id: `snow-rail-${b.id}-${i}-${s}`, kind: "rail", x: b.from[0] + dx * t + nx * off * s, z: b.from[1] + dz * t + nz * off * s, radius: 0.3, yMin: h - 0.55, yMax: h + 1.3 });
      }
    }
  }
  _static = out;
  return _static;
}

/** Snow-world colliders (static — no progress-gated barriers). */
export function getSnowColliders() {
  return buildStatic();
}
