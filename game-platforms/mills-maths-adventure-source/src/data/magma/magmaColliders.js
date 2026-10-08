/**
 * MAGMA MULTIPLES — solid CIRCLE colliders (same shape as every other region:
 * { id, kind, x, z, radius, hint?, jumpable? }). Built from the SAME data the
 * renderer draws (magmaLayout + magmaProps), so visuals can't drift.
 *
 * Note what is NOT here: the volcano's walls, kerbs and steep flanks are
 * TERRAIN (magmaGroundHeight + magmaSlideAt), and lava is a bounce hazard
 * (magmaIsLava) — neither needs colliders.
 */
import {
  MAGMA_BRIDGES, MAGMA_BOULDERS, MAGMA_DEAD_TREES, MAGMA_LANTERNS,
  MAGMA_WELCOME_SIGN,
} from "./magmaLayout.js";
import {
  PLAZA_BRAZIERS, BRIDGE_BRAZIERS, BASALT_COLUMNS, OBSIDIAN_CLUSTERS, GEYSERS,
  FORGE, LAKE_OBELISK, LAVA_FALLS, CINDER_CONES, DRAGON, EMBER_TREES,
  CRATER_LIP_STONES, CRATER_GATE_PILLARS, SUMMIT_BEACON,
} from "./magmaProps.js";

import {
  MAGMA_CHALLENGES, magmaHostWorld, MAGMA_WELCOME_HOST, MAGMA_RECORDS_STAND, TERRACE_GEOM,
  getMagmaChallenge,
} from "./magmaChallenges.js";

export const CRATER_HINT = "The crater is sealed — far too hot to enter… for now!";

function c(id, kind, x, z, radius, extra) {
  return { id, kind, x, z, radius, ...(extra || {}) };
}

/** Rails down both sides of every bridge deck (keep you on the bridge). */
export function magmaBridgeRails() {
  const out = [];
  for (const b of MAGMA_BRIDGES) {
    const ax = b.from[0], az = b.from[1];
    const dx = b.to[0] - ax, dz = b.to[1] - az;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len, nz = dx / len;
    const n = Math.max(2, Math.round(len / 1.1));
    const off = b.halfWidth + 0.4;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      for (const s of [1, -1]) {
        out.push(c(`mg-rail-${b.id}-${i}-${s}`, "boundary", ax + dx * t + nx * off * s, az + dz * t + nz * off * s, 0.45));
      }
    }
  }
  return out;
}

let _static = null;
function buildStatic() {
  const out = [];
  // Crater lip: a sealed ring (overlapping stones) — the crater can't be entered.
  CRATER_LIP_STONES.forEach((s, i) => out.push(c(`mg-lip-${i}`, "boundary", s.c[0], s.c[1], 0.8, { hint: CRATER_HINT })));
  CRATER_GATE_PILLARS.forEach((p, i) => out.push(c(`mg-gate-${i}`, "landmark", p[0], p[1], 0.7, { hint: CRATER_HINT })));
  out.push(c("mg-summit-beacon", "landmark", SUMMIT_BEACON[0], SUMMIT_BEACON[1], 0.55));

  // Bridges.
  out.push(...magmaBridgeRails());

  // Plaza + bridge braziers, welcome sign posts.
  [...PLAZA_BRAZIERS, ...BRIDGE_BRAZIERS].forEach((p, i) => out.push(c(`mg-brazier-${i}`, "landmark", p[0], p[1], 0.45)));
  {
    const [x, z] = MAGMA_WELCOME_SIGN.position;
    const ry = MAGMA_WELCOME_SIGN.rotationY;
    [-1.1, 1.1].forEach((o, i) => out.push(c(`mg-welcome-${i}`, "landmark", x + Math.cos(ry) * o, z - Math.sin(ry) * o, 0.25)));
  }

  // Scatter.
  MAGMA_BOULDERS.forEach(([x, z, s], i) => {
    const r = 0.55 + s * 1.15;
    if (r > 0.75) out.push(c(`mg-boulder-${i}`, "prop", x, z, r * 0.85));
  });
  MAGMA_DEAD_TREES.forEach(([x, z], i) => out.push(c(`mg-tree-${i}`, "tree", x, z, 0.4)));
  MAGMA_LANTERNS.forEach(([x, z], i) => out.push(c(`mg-lantern-${i}`, "prop", x, z, 0.22)));

  // Set-pieces.
  BASALT_COLUMNS.forEach((col, i) => out.push(c(`mg-col-${i}`, "prop", col.c[0], col.c[1], col.r * 0.85)));
  OBSIDIAN_CLUSTERS.forEach((cl, i) => out.push(c(`mg-obsidian-${i}`, "prop", cl.c[0], cl.c[1], 1.25)));
  GEYSERS.forEach((g) => out.push(c(`mg-${g.id}`, "prop", g.c[0], g.c[1], g.r + 0.35)));
  {
    // Forge hut: back + side walls as rows of circles (front is open).
    const { center, yaw, w, d } = FORGE;
    const cs = Math.cos(yaw), sn = Math.sin(yaw);
    const L = (lx, lz) => [center[0] + lx * cs + lz * sn, center[1] - lx * sn + lz * cs];
    for (let lx = -w / 2; lx <= w / 2 + 0.01; lx += 0.9) { const p = L(lx, -d / 2); out.push(c(`mg-forge-b-${lx.toFixed(1)}`, "landmark", p[0], p[1], 0.55)); }
    for (let lz = -d / 2; lz <= d / 2 - 0.6; lz += 0.9) {
      for (const sx of [-1, 1]) { const p = L((sx * w) / 2, lz); out.push(c(`mg-forge-s-${sx}-${lz.toFixed(1)}`, "landmark", p[0], p[1], 0.55)); }
    }
    const furnace = L(0, -d / 2 + 1.2);
    out.push(c("mg-forge-furnace", "landmark", furnace[0], furnace[1], 1.2));
    out.push(c("mg-forge-anvil", "prop", FORGE.anvil[0], FORGE.anvil[1], 0.6));
    out.push(c("mg-forge-quench", "prop", FORGE.quench[0], FORGE.quench[1], 0.7));
    FORGE.barrels.forEach((p, i) => out.push(c(`mg-forge-barrel-${i}`, "prop", p[0], p[1], 0.45)));
    FORGE.oreCarts.forEach((p, i) => out.push(c(`mg-forge-cart-${i}`, "prop", p[0], p[1], 0.8)));
  }
  out.push(c("mg-obelisk", "landmark", LAKE_OBELISK.c[0], LAKE_OBELISK.c[1], 0.75));
  for (let z = LAVA_FALLS.z1; z <= LAVA_FALLS.z2 + 0.01; z += 1.2) out.push(c(`mg-cliff-${z.toFixed(1)}`, "boundary", LAVA_FALLS.x - 0.6, z, 0.9));
  CINDER_CONES.forEach((cc, i) => out.push(c(`mg-cinder-${i}`, "landmark", cc.c[0], cc.c[1], cc.r * 0.85)));
  DRAGON.feet.forEach((p, i) => out.push(c(`mg-rib-${i}`, "prop", p[0], p[1], 0.4)));
  out.push(c("mg-skull", "landmark", DRAGON.skull.c[0], DRAGON.skull.c[1], 1.9));
  EMBER_TREES.forEach((p, i) => out.push(c(`mg-ember-tree-${i}`, "tree", p[0], p[1], 0.45)));

  // The ten challenge hosts, Mills at the plaza and the trophy stand.
  MAGMA_CHALLENGES.forEach((ch) => {
    const [x, z] = magmaHostWorld(ch.key);
    out.push(c(`mg-host-${ch.key}`, "interactable", x, z, 0.7));
  });
  out.push(c("mg-welcome-mills", "interactable", MAGMA_WELCOME_HOST.position[0], MAGMA_WELCOME_HOST.position[1], 0.7));
  out.push(c("mg-records", "interactable", MAGMA_RECORDS_STAND.position[0], MAGMA_RECORDS_STAND.position[1], 2.0));

  // Tenfold Terraces: the seven-step stone staircase (two circles a step).
  {
    const fr = getMagmaChallenge("terraces").frame;
    for (const pl of TERRACE_GEOM.places) {
      for (const lz of [TERRACE_GEOM.z0 + 0.7, TERRACE_GEOM.z1 - 0.7]) {
        const [x, z] = fr.toWorld(TERRACE_GEOM.x(pl), lz);
        out.push(c(`mg-terrace-${pl}-${lz.toFixed(1)}`, "landmark", x, z, 0.78));
      }
    }
  }
  return out;
}

export function getMagmaColliders() {
  if (!_static) _static = buildStatic();
  return _static;
}
