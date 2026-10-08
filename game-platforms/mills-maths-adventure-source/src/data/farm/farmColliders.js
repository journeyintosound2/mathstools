/**
 * FARM COLLIDERS — solid props for Fraction Farm. Circles only (cheap,
 * jitter-free), same shape as every other region:
 *   { id, kind, x, z, radius, jumpable?, yMin?, yMax? }
 * Built from the SAME data the renderer draws (farmLayout + farmProps +
 * farmTerrain), so visuals and collision can't drift.
 *
 * JUMPABLE: every paddock / pen / fence-line / challenge-fence circle — the
 * player vaults them with Space (Player.jsx drops jumpable colliders while
 * airborne) but they block a walking player. The property BOUNDARY fence is
 * NON-jumpable. Gate gaps are open. Hills are terrain (the ground function
 * walls the steep outer rim) and the creek + pond are just slow, not solid.
 */
import {
  FARM_PADDOCKS, FARM_FENCE_LINES, BOUNDARY_FENCE, CHALLENGE_FENCE, CHALLENGE_SIGN, ROUNDUP_PEN, ROUNDUP_SIGN,
  ORDER_GARDEN, ORDER_SIGN, CRATE_SIGN, FARM_RECORDS_STAND, MILK_AREA, MILK_CHUTE_STOPS, MILK_CHUTE_REPEATS,
  MILK_SIGN, WEIGH_AREA, WEIGH_SIGN, TRADE_AREA, TRADE_STALL_OFFSETS, TRADE_TABLE_OFFSET, TRADE_SIGN, VEGGIE_AREA,
  VEGGIE_SIGN, PLANK_AREA, PLANK_SIGN, SHOP_AREA, SHOP_SIGN, FARM_WELCOME_SIGN,
} from "./farmLayout.js";
import { FARM_FOOTPRINTS, getFarmProps, FARM_TRUNK_R } from "./farmProps.js";
import { FARM_BRIDGES, ensureFarmStructures } from "./farmTerrain.js";

const FENCE_COLLIDER_SPACING = 1.8;
const FENCE_COLLIDER_RADIUS = 0.7;

/**
 * Circles along one straight fence run from (x1,z1) to (x2,z2), skipping any
 * point inside a gap ({ x, z, halfWidth } or a list of them). Jumpable. Pure.
 */
export function fenceRunColliders(idPrefix, x1, z1, x2, z2, gap = null, radius = FENCE_COLLIDER_RADIUS) {
  const gaps = Array.isArray(gap) ? gap.filter(Boolean) : gap ? [gap] : [];
  const cols = [];
  const len = Math.hypot(x2 - x1, z2 - z1);
  const steps = Math.max(1, Math.round(len / FENCE_COLLIDER_SPACING));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const z = z1 + (z2 - z1) * t;
    if (gaps.some((g) => Math.hypot(x - g.x, z - g.z) < g.halfWidth)) continue;
    cols.push({ id: `${idPrefix}-${i}`, kind: "boundary", x, z, radius, jumpable: true });
  }
  return cols;
}

/** The property BOUNDARY fence — solid and NON-jumpable (you can't hop out). */
const BORDER_COLLIDER_SPACING = 2.2;
const BORDER_COLLIDER_RADIUS = 1.1;
function borderRunColliders(idPrefix, x1, z1, x2, z2) {
  const cols = [];
  const len = Math.hypot(x2 - x1, z2 - z1);
  const steps = Math.max(1, Math.round(len / BORDER_COLLIDER_SPACING));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    cols.push({ id: `${idPrefix}-${i}`, kind: "boundary", x: x1 + (x2 - x1) * t, z: z1 + (z2 - z1) * t, radius: BORDER_COLLIDER_RADIUS });
  }
  return cols;
}
function boundaryColliders() {
  const { halfW, halfD } = BOUNDARY_FENCE;
  return [
    ...borderRunColliders("farm-border-n", -halfW, -halfD, halfW, -halfD),
    ...borderRunColliders("farm-border-s", -halfW, halfD, halfW, halfD),
    ...borderRunColliders("farm-border-w", -halfW, -halfD, -halfW, halfD),
    ...borderRunColliders("farm-border-e", halfW, -halfD, halfW, halfD),
  ];
}

/** Where a paddock's gate gap sits ({ x, z, halfWidth }) or null. */
export function paddockGate(p, g) {
  if (!g) return null;
  const hw = p.w / 2, hd = p.d / 2;
  const half = (g.width || 0) / 2 + 0.4; // a little clearance beyond the visual gap
  if (g.side === "north") return { side: "north", x: p.x + (g.offset || 0), z: p.z - hd, halfWidth: half };
  if (g.side === "south") return { side: "south", x: p.x + (g.offset || 0), z: p.z + hd, halfWidth: half };
  if (g.side === "east") return { side: "east", x: p.x + hw, z: p.z + (g.offset || 0), halfWidth: half };
  return { side: "west", x: p.x - hw, z: p.z + (g.offset || 0), halfWidth: half };
}
/**
 * The four fence runs of one paddock rect, split round its gate gap(s).
 * Pure — returns collider circles.
 */
export function paddockColliders(p) {
  const hw = p.w / 2, hd = p.d / 2;
  const west = p.x - hw, east = p.x + hw, north = p.z - hd, south = p.z + hd;
  const gates = [paddockGate(p, p.gate), paddockGate(p, p.gate2)].filter(Boolean);
  const gapsFor = (side) => gates.filter((g) => g.side === side);
  const r = p.style === "wire" ? 0.55 : FENCE_COLLIDER_RADIUS;
  return [
    ...fenceRunColliders(`${p.id}-n`, west, north, east, north, gapsFor("north"), r),
    ...fenceRunColliders(`${p.id}-s`, west, south, east, south, gapsFor("south"), r),
    ...fenceRunColliders(`${p.id}-e`, east, north, east, south, gapsFor("east"), r),
    ...fenceRunColliders(`${p.id}-w`, west, north, west, south, gapsFor("west"), r),
  ];
}

/** Circles filling a (rotated) rect footprint. */
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

// Footprints that are NOT solid (you walk onto / through them) or are solid
// through their own interactable/host collider instead.
const WALKABLE = new Set(["spawn", "portal", "weighbridge", "records"]);
const SKIP_PREFIX = ["host-", "chest-"];

let _static = null;
/** Farm colliders (static — no progress-gated barriers). */
export function getFarmColliders() {
  if (_static) return _static;
  ensureFarmStructures();
  const out = [];

  // --- The property boundary + every paddock / fence line. -----------------
  out.push(...boundaryColliders());
  for (const p of FARM_PADDOCKS) out.push(...paddockColliders(p));
  for (const l of FARM_FENCE_LINES) {
    for (let i = 0; i < l.pts.length - 1; i++) {
      const [a, b] = [l.pts[i], l.pts[i + 1]];
      out.push(...fenceRunColliders(`farm-${l.id}-${i}`, a[0], a[1], b[0], b[1], null, l.style === "stone" ? 0.6 : l.style === "picket" ? 0.5 : FENCE_COLLIDER_RADIUS));
    }
  }

  // --- The challenge stations (unchanged arrangements, moved). --------------
  // The flagship CHALLENGE FENCE — a solid but JUMPABLE run.
  out.push(...fenceRunColliders("farm-challenge-fence", CHALLENGE_FENCE.x1, CHALLENGE_FENCE.z, CHALLENGE_FENCE.x2, CHALLENGE_FENCE.z));
  // Round-Up sorting pen — fenced like a paddock, gate gap open. (The herd
  // itself is walk-through.)
  out.push(...paddockColliders(ROUNDUP_PEN));
  out.push(
    { id: "farm-roundup-sign", kind: "interactable", x: ROUNDUP_SIGN.position[0], z: ROUNDUP_SIGN.position[1], radius: 0.6 },
    // Order-the-Parts carrot bed — solid so the row is never trampled.
    { id: "farm-order-bed-w", kind: "boundary", x: ORDER_GARDEN.x - 4, z: ORDER_GARDEN.z, radius: 2.0 },
    { id: "farm-order-bed-c", kind: "boundary", x: ORDER_GARDEN.x, z: ORDER_GARDEN.z, radius: 2.0 },
    { id: "farm-order-bed-e", kind: "boundary", x: ORDER_GARDEN.x + 4, z: ORDER_GARDEN.z, radius: 2.0 },
    { id: "farm-order-sign", kind: "interactable", x: ORDER_SIGN.position[0], z: ORDER_SIGN.position[1], radius: 0.6 },
    { id: "farm-crate-sign", kind: "interactable", x: CRATE_SIGN.position[0], z: CRATE_SIGN.position[1], radius: 0.6 },
    // Milk Splitter: machine + chutes (the tanker is a footprint below).
    { id: "farm-milk-machine", kind: "boundary", x: MILK_AREA.x, z: MILK_AREA.z - 0.4, radius: 1.4 },
    { id: "farm-milk-chute-s", kind: "boundary", x: MILK_CHUTE_STOPS[0], z: MILK_CHUTE_STOPS[1], radius: 0.9 },
    { id: "farm-milk-chute-r", kind: "boundary", x: MILK_CHUTE_REPEATS[0], z: MILK_CHUTE_REPEATS[1], radius: 0.9 },
    { id: "farm-milk-sign", kind: "interactable", x: MILK_SIGN.position[0], z: MILK_SIGN.position[1], radius: 0.6 },
    // Weigh Station: the scale + its host.
    { id: "farm-weigh-scale", kind: "boundary", x: WEIGH_AREA.x, z: WEIGH_AREA.z, radius: 1.3 },
    { id: "farm-weigh-sign", kind: "interactable", x: WEIGH_SIGN.position[0], z: WEIGH_SIGN.position[1], radius: 0.6 },
    // Trading Post: the three stalls + the trading table.
    ...Object.entries(TRADE_STALL_OFFSETS).map(([k, [ox, oz]]) => ({
      id: `farm-trade-stall-${k}`, kind: "boundary", x: TRADE_AREA.x + ox, z: TRADE_AREA.z + oz, radius: 1.3,
    })),
    { id: "farm-trade-table", kind: "boundary", x: TRADE_AREA.x + TRADE_TABLE_OFFSET[0], z: TRADE_AREA.z + TRADE_TABLE_OFFSET[1], radius: 0.9 },
    { id: "farm-trade-sign", kind: "interactable", x: TRADE_SIGN.position[0], z: TRADE_SIGN.position[1], radius: 0.6 },
    // Veggie Plot: the raised bed (solid) + its host.
    { id: "farm-veggie-bed", kind: "boundary", x: VEGGIE_AREA.x, z: VEGGIE_AREA.z, radius: 3.6 },
    { id: "farm-veggie-sign", kind: "interactable", x: VEGGIE_SIGN.position[0], z: VEGGIE_SIGN.position[1], radius: 0.6 },
    // Plank the Gap: the fence-gap structure + its host.
    { id: "farm-plank-gap", kind: "boundary", x: PLANK_AREA.x, z: PLANK_AREA.z, radius: 1.6 },
    { id: "farm-plank-sign", kind: "interactable", x: PLANK_SIGN.position[0], z: PLANK_SIGN.position[1], radius: 0.6 },
    // The Farm Shop: the stall counter + its host.
    { id: "farm-shop-stall", kind: "boundary", x: SHOP_AREA.x, z: SHOP_AREA.z, radius: 2.9 },
    { id: "farm-shop-sign", kind: "interactable", x: SHOP_SIGN.position[0], z: SHOP_SIGN.position[1], radius: 0.6 },
    { id: "farm-records", kind: "interactable", x: FARM_RECORDS_STAND.position[0], z: FARM_RECORDS_STAND.position[1], radius: 3.2 },
    { id: "farm-welcome-sign", kind: "boundary", x: FARM_WELCOME_SIGN.position[0], z: FARM_WELCOME_SIGN.position[1], radius: 0.6 },
    { id: "farm-challenge-sign", kind: "interactable", x: CHALLENGE_SIGN.position[0], z: CHALLENGE_SIGN.position[1], radius: 0.6 },
  );

  // --- Buildings + set-pieces (their footprints). ---------------------------
  for (const f of FARM_FOOTPRINTS) {
    if (WALKABLE.has(f.id) || SKIP_PREFIX.some((p) => f.id.startsWith(p))) continue;
    if (f.id === "shop") continue; // the stall's own collider above
    if (f.id.startsWith("signpost-")) { out.push({ id: `farm-${f.id}`, kind: "landmark", x: f.x, z: f.z, radius: 0.25 }); continue; }
    if (f.id.startsWith("arch-")) { out.push({ id: `farm-${f.id}`, kind: "landmark", x: f.x, z: f.z, radius: 0.45 }); continue; }
    if (f.id === "big-amber") { out.push({ id: "farm-big-amber", kind: "tree", x: f.x, z: f.z, radius: 1.1 }); continue; }
    if (f.id === "picnic") { out.push(...rectColliders(`farm-${f.id}`, f, "prop", { jumpable: true })); continue; }
    if (f.shape === "circle") out.push({ id: `farm-${f.id}`, kind: "boundary", x: f.x, z: f.z, radius: f.r });
    else out.push(...rectColliders(`farm-${f.id}`, f));
  }

  // --- Trees, rocks, hay, logs, stumps (from the scatter). ------------------
  const P = getFarmProps();
  for (const [kind, arr] of Object.entries(P.trees)) {
    arr.forEach((t, i) => out.push({ id: `farm-${kind}-${i}`, kind: "tree", x: t.x, z: t.z, radius: FARM_TRUNK_R[kind] * t.s }));
  }
  P.rocks.forEach((r, i) => { if (r.collide) out.push({ id: `farm-rock-${i}`, kind: "prop", x: r.x, z: r.z, radius: 0.72 * r.s }); });
  P.bales.round.forEach((b, i) => out.push({ id: `farm-bale-${i}`, kind: "prop", x: b.x, z: b.z, radius: 0.95 }));
  P.bales.square.forEach((b, i) => { if (b.layer === 0) out.push({ id: `farm-sqbale-${i}`, kind: "prop", x: b.x, z: b.z, radius: 0.6, jumpable: true }); });
  P.logs.forEach((l, i) => {
    const n = Math.max(2, Math.round(l.len / 0.8));
    for (let k = 0; k <= n; k++) {
      const f = k / n - 0.5;
      out.push({ id: `farm-log-${i}-${k}`, kind: "prop", x: l.x + Math.cos(l.rot) * l.len * f, z: l.z - Math.sin(l.rot) * l.len * f, radius: l.r + 0.05, jumpable: !l.pile });
    }
  });
  P.stumps.forEach((s, i) => out.push({ id: `farm-stump-${i}`, kind: "prop", x: s.x, z: s.z, radius: 0.5 * s.s, jumpable: true }));

  // --- Bridge railings (only at deck height — you can wade underneath). -----
  for (const b of FARM_BRIDGES) {
    const dx = b.to[0] - b.from[0], dz = b.to[1] - b.from[1];
    const L = Math.hypot(dx, dz) || 1;
    const nx = -dz / L, nz = dx / L;
    const off = b.halfWidth + 0.3;
    const n = Math.max(3, Math.round(L / 0.9));
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const h = b.deckAt(t);
      for (const s of [1, -1]) {
        out.push({ id: `farm-rail-${b.id}-${i}-${s}`, kind: "rail", x: b.from[0] + dx * t + nx * off * s, z: b.from[1] + dz * t + nz * off * s, radius: 0.3, yMin: h - 0.55, yMax: h + 1.3 });
      }
    }
  }

  _static = out;
  return _static;
}
