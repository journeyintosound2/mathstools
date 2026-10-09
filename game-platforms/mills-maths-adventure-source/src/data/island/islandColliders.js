/**
 * NUMBER ISLAND — COLLIDERS. Circles only (cheap, jitter-free), the same
 * shape as every other region: { id, kind, x, z, radius, jumpable?, yMin?, yMax? }.
 * Built from the SAME data the renderer draws (islandLayout + islandProps +
 * islandTerrain), so visuals and collision can't drift.
 *
 * Terrain does the rest: the raised plaza's wall (a hop or the stairs get
 * you up), the cliffs + the volcano's upper cone slide you back down, the
 * shallows are slow, and deep water / lava bounce you back to dry land.
 */
import {
  ISLAND_ARCH, ACHIEVEMENT_WALL, ISLAND_MAP_BOARD, ISLAND_WELCOME, PIP_THERMOMETER, SCHOOL_FENCE, ISLAND_HAY_BALES,
  PLAZA_FOUNTAIN, ISLAND_SIGNPOSTS, LAMP_POSTS, PLAZA_BENCHES, ISLAND_JETTY, COVE_PIER, ROPE_BRIDGE,
} from "./islandLayout.js";
import { ISLAND_FOOTPRINTS, islandPropColliders } from "./islandProps.js";
import { getIslandDecks, PLAZA_FLIGHTS } from "./islandTerrain.js";
import { PLAZA } from "./islandLayout.js";

function rectColliders(id, f, kind = "boundary", extra = {}) {
  const cols = [];
  const c = Math.cos(f.rot), s = Math.sin(f.rot);
  const r = Math.min(1.6, Math.max(0.45, Math.min(f.w, f.d) / 2));
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
function runColliders(idPrefix, a, b, spacing, radius, extra = {}, skip = null) {
  const out = [];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.round(L / spacing));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
    if (skip && skip(x, z)) continue;
    out.push({ id: `${idPrefix}-${i}`, x, z, radius, ...extra });
  }
  return out;
}

// Footprints with their own (finer) colliders below, or walk-through ones.
const OWN = new Set([
  "spawn", "arch-w", "arch-e", "achievement-wall", "achievement-view", "map-board", "welcome", "mills", "plaza", "pip",
  "fern", "alby", "thermometer", "school-fence", "school-yard", "board", "trophy", "fountain", "falls", "sailboat",
]);
const SKIP_PREFIX = ["gate-", "chest-", "signpost-", "bale-", "rowboat-"];

let _static = null;
export function getIslandStaticColliders() {
  if (_static) return _static;
  const out = [];
  // The arch's two stone posts.
  for (const s of [-1, 1]) {
    out.push({ id: `island-arch-${s}`, kind: "landmark", x: ISLAND_ARCH.position[0] + (s * ISLAND_ARCH.width) / 2, z: ISLAND_ARCH.position[1], radius: 0.95 });
  }
  // The Achievements Wall: a solid run of circles along its length.
  {
    const W = ACHIEVEMENT_WALL;
    const ux = Math.cos(W.rotationY), uz = -Math.sin(W.rotationY); // along the wall (local +x)
    const half = W.length / 2 + 0.3;
    out.push(...runColliders("island-wall", [W.position[0] - ux * half, W.position[1] - uz * half], [W.position[0] + ux * half, W.position[1] + uz * half], 0.9, 0.7, { kind: "landmark" }));
  }
  {
    const M = ISLAND_MAP_BOARD;
    const ux = Math.cos(M.rotationY), uz = -Math.sin(M.rotationY);
    out.push(...runColliders("island-map", [M.position[0] - ux * 2.6, M.position[1] - uz * 2.6], [M.position[0] + ux * 2.6, M.position[1] + uz * 2.6], 1.0, 0.55, { kind: "landmark" }));
  }
  out.push({ id: "island-welcome", kind: "landmark", x: ISLAND_WELCOME.position[0], z: ISLAND_WELCOME.position[1], radius: 0.5 });
  out.push({ id: "island-thermometer", kind: "landmark", x: PIP_THERMOMETER.position[0], z: PIP_THERMOMETER.position[1], radius: 1.1 });
  out.push({ id: "island-fountain", kind: "landmark", x: PLAZA_FOUNTAIN.position[0], z: PLAZA_FOUNTAIN.position[1], radius: PLAZA_FOUNTAIN.radius });
  for (const s of ISLAND_SIGNPOSTS) out.push({ id: `island-signpost-${s.id}`, kind: "landmark", x: s.at[0], z: s.at[1], radius: 0.3 });
  LAMP_POSTS.forEach(([x, z], i) => out.push({ id: `island-lamp-${i}`, kind: "landmark", x, z, radius: 0.28 }));
  PLAZA_BENCHES.forEach(([x, z], i) => out.push({ id: `island-bench-${i}`, kind: "landmark", x, z, radius: 0.75, jumpable: true }));
  ISLAND_HAY_BALES.forEach(([x, z], i) => out.push({ id: `island-bale-${i}`, kind: "prop", x, z, radius: 1.05, jumpable: true }));
  // The school's picket fence (a gap at the gate — the Playground portal).
  out.push(...runColliders("island-school-fence", [SCHOOL_FENCE.x0, SCHOOL_FENCE.z], [SCHOOL_FENCE.x1, SCHOOL_FENCE.z], 1.2, 0.5,
    { kind: "boundary", jumpable: true }, (x) => Math.abs(x) < SCHOOL_FENCE.gateHalf));
  for (const sx of [SCHOOL_FENCE.x0, SCHOOL_FENCE.x1]) {
    out.push(...runColliders(`island-school-side-${sx}`, [sx, SCHOOL_FENCE.z], [sx, SCHOOL_FENCE.z - 9], 1.2, 0.5, { kind: "boundary", jumpable: true }));
  }
  // The stepped cheek walls beside each plaza stair flight.
  for (const f of PLAZA_FLIGHTS) {
    const [cx, cz] = PLAZA.center;
    for (const s of [-1, 1]) {
      const across = s * (f.width / 2 + 0.25);
      const a0 = PLAZA.apothem, a1 = PLAZA.apothem + f.len;
      const p0 = [cx + f.nx * a0 + -f.nz * across, cz + f.nz * a0 + f.nx * across];
      const p1 = [cx + f.nx * a1 + -f.nz * across, cz + f.nz * a1 + f.nx * across];
      out.push(...runColliders(`island-cheek-${f.id}-${s}`, p0, p1, 0.5, 0.3, { kind: "landmark" }));
    }
  }
  // Buildings + set-pieces from their footprints.
  for (const f of ISLAND_FOOTPRINTS) {
    if (OWN.has(f.id) || SKIP_PREFIX.some((p) => f.id.startsWith(p))) continue;
    if (f.id.startsWith("hut-") || f.id.startsWith("cottage-") || f.id === "school" || f.id === "barn") {
      out.push(...rectColliders(`island-${f.id}`, { ...f, w: f.w - 1.2, d: f.d - 1.2 }, "boundary"));
      continue;
    }
    if (f.shape === "circle") out.push({ id: `island-${f.id}`, kind: "boundary", x: f.x, z: f.z, radius: f.r - 0.6 });
    else out.push(...rectColliders(`island-${f.id}`, f, "boundary"));
  }
  // Trees, rocks, driftwood.
  out.push(...islandPropColliders());
  // Rails along the jetty, the cove pier + the rope bridge (deck height only).
  for (const d of getIslandDecks()) {
    const dx = d.to[0] - d.from[0], dz = d.to[1] - d.from[1];
    const L = Math.hypot(dx, dz) || 1;
    const nx = -dz / L, nz = dx / L;
    const off = d.halfWidth + 0.28;
    const n = Math.max(3, Math.round(L / 0.9));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      if (d.id !== "rope-bridge" && t < 0.24) continue; // the ramp up off the sand is open
      const h = d.yAt(Math.min(1, t));
      for (const s of [1, -1]) {
        out.push({ id: `island-rail-${d.id}-${i}-${s}`, kind: "rail", x: d.from[0] + dx * t + nx * off * s, z: d.from[1] + dz * t + nz * off * s, radius: 0.3, yMin: h - 0.6, yMax: h + 1.4 });
      }
    }
    // The far end of the jetty / pier is closed (a rail across it).
    if (d.id !== "rope-bridge") {
      const h = d.yAt(1);
      for (let k = -1; k <= 1; k++) {
        out.push({ id: `island-rail-${d.id}-end-${k}`, kind: "rail", x: d.to[0] + (dx / L) * 0.35 + nx * k * 0.8, z: d.to[1] + (dz / L) * 0.35 + nz * k * 0.8, radius: 0.35, yMin: h - 0.6, yMax: h + 1.4 });
      }
    }
  }
  _static = out;
  return _static;
}
export { ISLAND_JETTY, COVE_PIER, ROPE_BRIDGE };
