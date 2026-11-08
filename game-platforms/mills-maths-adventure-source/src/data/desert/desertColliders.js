/**
 * SUNSTONE DESERT — COLLIDERS (built 2026-11-08). Circles + oriented boxes
 * (systems/collisionEngine.js boxCollider), built from the SAME data the
 * renderer draws (desertLayout + desertProps + desertTerrain).
 *
 * Buildings, the pyramid, the temple, the drum and the stair flights are
 * SOLID GROUND (desertTerrain.js structures): their sides are walls already,
 * so they need no colliders. What's here: the rim backstop, the Caravan
 * Gate's walls, the cacti, palms + boulders, the obelisks, statues, stalls,
 * signs + furniture, the set-pieces (ship, sphinx head, crystals, fossil,
 * arch legs), and railings that only block at deck height (yMin / yMax).
 */
import { boxCollider } from "../../systems/collisionEngine.js";
import {
  DESERT_BOUNDARY, DESERT_WELCOME_SIGN, DESERT_WELCOME_HOST, DESERT_MAP_BOARD, CARAVAN_GATE, MARKET_STALLS, TOWN_WELL,
  OBELISKS, SUNSTONE, SUN_TEMPLE, DUNE_SHIP, SAND_SPHINX, CRYSTALS, FOSSIL, CAMELS, DESERT_SIGNPOSTS, QS_SIGNS,
  SUNDIAL_RISE, BOARDWALK, MINE_MOUTH,
} from "./desertLayout.js";
import { getDesertProps, DESERT_TRUNK_R, ARCH_LEGS } from "./desertProps.js";
import { getLateStructures, ensureDesertStructures, SUNDIAL, PYR_BASE, ROOF_PLANK, TOWER_FLIGHT } from "./desertTerrain.js";

const BORDER_SPACING = 2.2;
const BORDER_RADIUS = 1.1;
function borderRun(prefix, x1, z1, x2, z2) {
  const cols = [];
  const len = Math.hypot(x2 - x1, z2 - z1);
  const steps = Math.max(1, Math.round(len / BORDER_SPACING));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    cols.push({ id: `${prefix}-${i}`, kind: "boundary", x: x1 + (x2 - x1) * t, z: z1 + (z2 - z1) * t, radius: BORDER_RADIUS });
  }
  return cols;
}
/** Railing posts along a deck's two sides (they only block at deck height). */
function deckRails(d, spacing = 0.9, extraOff = 0.25) {
  const out = [];
  const n = Math.max(3, Math.round(d.L / spacing));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const h = d.deckAt(t);
    const x = d.from[0] + (d.to[0] - d.from[0]) * t, z = d.from[1] + (d.to[1] - d.from[1]) * t;
    for (const s of [1, -1]) {
      out.push({ id: `desert-rail-${d.id}-${i}-${s}`, kind: "rail", x: x - d.uz * (d.hw + extraOff) * s, z: z + d.ux * (d.hw + extraOff) * s, radius: 0.28, yMin: h - 0.55, yMax: h + 1.3 });
    }
  }
  return out;
}

let _static = null;
function buildStatic() {
  if (_static) return _static;
  ensureDesertStructures();
  const { halfW, halfD } = DESERT_BOUNDARY;
  const G = CARAVAN_GATE;
  const wallLen = G.halfSpan - G.openHalf;
  const out = [
    ...borderRun("desert-border-n", -halfW, -halfD, halfW, -halfD),
    ...borderRun("desert-border-s", -halfW, halfD, halfW, halfD),
    ...borderRun("desert-border-w", -halfW, -halfD, -halfW, halfD),
    ...borderRun("desert-border-e", halfW, -halfD, halfW, halfD),
    // Mills + the welcome board + the map board.
    { id: DESERT_WELCOME_HOST.id, kind: "boundary", x: DESERT_WELCOME_HOST.position[0], z: DESERT_WELCOME_HOST.position[1], radius: 0.6 },
    boxCollider("desert-welcome-board", DESERT_WELCOME_SIGN.position[0], DESERT_WELCOME_SIGN.position[1], 1.25, 0.2, DESERT_WELCOME_SIGN.rotationY, { kind: "boundary" }),
    boxCollider("desert-map-board", DESERT_MAP_BOARD.position[0], DESERT_MAP_BOARD.position[1], 2.6, 0.35, DESERT_MAP_BOARD.rotationY, { kind: "boundary" }),
    // The Caravan Gate: two wall runs + their round towers (the arch is open).
    boxCollider("desert-gate-wall-w", -(G.openHalf + wallLen / 2), G.z, wallLen / 2, G.thick / 2, 0, { kind: "boundary" }),
    boxCollider("desert-gate-wall-e", G.openHalf + wallLen / 2, G.z, wallLen / 2, G.thick / 2, 0, { kind: "boundary" }),
    { id: "desert-gate-tower-w", kind: "boundary", x: -G.halfSpan - 1.2, z: G.z, radius: 2.1 },
    { id: "desert-gate-tower-e", kind: "boundary", x: G.halfSpan + 1.2, z: G.z, radius: 2.1 },
    // The town's stalls + well.
    ...MARKET_STALLS.map(([x, z, yaw], i) => boxCollider(`desert-stall-${i}`, x, z, 1.45, 0.95, yaw, { kind: "boundary" })),
    { id: "desert-well", kind: "boundary", x: TOWN_WELL[0], z: TOWN_WELL[1], radius: 1.25 },
    // Obelisks + the Sunstone on the summit (only up there).
    ...OBELISKS.map(([x, z], i) => boxCollider(`desert-obelisk-${i}`, x, z, 0.95, 0.95, 0, { kind: "landmark" })),
    { id: "desert-sunstone", kind: "landmark", x: SUNSTONE.position[0], z: SUNSTONE.position[1], radius: SUNSTONE.base * 0.62, yMin: PYR_BASE + 20 },
    // The temple's sphinxes + the portico's columns (they stand on the portico).
    ...SUN_TEMPLE.sphinxes.map(([x, z], i) => boxCollider(`desert-sphinx-${i}`, x, z, 1.15, 2.5, 0, { kind: "landmark" })),
    ...[-11, -6.6, -2.2, 2.2, 6.6, 11].map((x, i) => ({ id: `desert-column-${i}`, kind: "landmark", x, z: SUN_TEMPLE.zFront - 1.4, radius: 0.72 })),
    // The Dune Ship (a tilted hull), the Sand Sphinx's head, the crystals, the fossil.
    boxCollider("desert-dune-ship", DUNE_SHIP.position[0], DUNE_SHIP.position[1], 2.6, DUNE_SHIP.length / 2 - 0.5, DUNE_SHIP.rotationY, { kind: "landmark" }),
    { id: "desert-sand-sphinx", kind: "landmark", x: SAND_SPHINX.position[0], z: SAND_SPHINX.position[1], radius: 4.6 },
    ...CRYSTALS.map(([x, z, , r], i) => ({ id: `desert-crystal-${i}`, kind: "landmark", x, z, radius: r * 0.95 })),
    ...ARCH_LEGS.map(([x, z], i) => ({ id: `desert-arch-leg-${i}`, kind: "landmark", x, z, radius: 2.5 })),
    { id: "desert-mine-mouth", kind: "landmark", x: MINE_MOUTH.position[0], z: MINE_MOUTH.position[1] - 0.6, radius: 1.2 },
    // Camels (big, friendly, solid).
    ...CAMELS.map(([x, z, yaw], i) => boxCollider(`desert-camel-${i}`, x, z, 0.55, 1.35, yaw, { kind: "prop" })),
    // Signposts + warning signs.
    ...DESERT_SIGNPOSTS.map((s) => ({ id: `desert-signpost-${s.id}`, kind: "landmark", x: s.p[0], z: s.p[1], radius: 0.25 })),
    ...QS_SIGNS.map(([x, z], i) => ({ id: `desert-qs-sign-${i}`, kind: "landmark", x, z, radius: 0.22 })),
  ];
  // The fossil skeleton: the spine + rib feet (you can walk between the ribs).
  {
    const c = Math.cos(FOSSIL.yaw), s = Math.sin(FOSSIL.yaw);
    for (let k = -5; k <= 5; k++) {
      const a = (k / 5) * (FOSSIL.length / 2) * 0.72;
      for (const side of [-1, 1]) {
        const lx = a, lz = side * 3.4;
        out.push({ id: `desert-rib-${k}-${side}`, kind: "landmark", x: FOSSIL.c[0] + lx * c + lz * s, z: FOSSIL.c[1] - lx * s + lz * c, radius: 0.32 });
      }
    }
    // The skull at the front end.
    const hx = FOSSIL.length / 2 + 1.5;
    out.push({ id: "desert-fossil-skull", kind: "landmark", x: FOSSIL.c[0] + hx * c, z: FOSSIL.c[1] - hx * s, radius: 1.9 });
  }
  // Railings: the rope bridge, the boardwalk, the roof bridge.
  const L = getLateStructures();
  for (const d of L.decks) out.push(...deckRails(d, d.boardwalk ? 1.0 : 0.85, d.boardwalk ? 0.15 : 0.25));
  out.push(...deckRails(ROOF_PLANK, 0.8, 0.15));
  // The sundial ramp's outer parapet (only at ramp height) — leaves its foot open.
  {
    const S = SUNDIAL_RISE, ramp = SUNDIAL.ramp;
    const rOut = S.r + S.rampW + 0.2;
    const n = Math.round((S.turn * rOut) / 1.0);
    for (let i = 2; i <= n; i++) {
      const f = i / n;
      const a = S.a0 + f * S.turn;
      const h = ramp.base + S.h * f;
      out.push({ id: `desert-sundial-rail-${i}`, kind: "rail", x: S.c[0] + Math.cos(a) * rOut, z: S.c[1] + Math.sin(a) * rOut, radius: 0.3, yMin: h - 0.6, yMax: h + 1.3 });
    }
  }
  // The tower stair's outer handrail (east side; the tower wall is the west).
  {
    const f = TOWER_FLIGHT;
    for (let i = 1; i < f.n; i += 1) {
      const s = (i + 0.5) * f.run;
      const h = f.h0 + (i + 1) * f.rise;
      out.push({ id: `desert-tower-rail-${i}`, kind: "rail", x: f.from[0] + f.ux * s - f.uz * (f.hw + 0.2), z: f.from[1] + f.uz * s + f.ux * (f.hw + 0.2), radius: 0.25, yMin: h - 0.8, yMax: h + 1.3 });
    }
  }
  // The scatter: cacti, palms, boulders.
  const P = getDesertProps();
  for (const kind of ["saguaro", "barrel", "pear", "palm", "boulder"]) {
    P[kind].forEach((t, i) => {
      if (Math.abs(t.x) > DESERT_BOUNDARY.halfW + 2 || Math.abs(t.z) > DESERT_BOUNDARY.halfD + 2) return;
      out.push({
        id: `desert-${kind}-${i}`, kind: kind === "boulder" ? "prop" : "tree", x: t.x, z: t.z,
        radius: DESERT_TRUNK_R[kind] * t.s * (kind === "boulder" ? 1 : 1), jumpable: kind === "barrel" || (kind === "boulder" && t.s < 0.9),
      });
    });
  }
  _static = out;
  return _static;
}

/** Desert colliders (static — nothing progress-gated). */
export function getDesertColliders() {
  return buildStatic();
}
export { BOARDWALK };
