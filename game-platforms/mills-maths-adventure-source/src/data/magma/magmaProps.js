/**
 * MAGMA MULTIPLES — set-piece PROP positions (pure data). Shared by the
 * renderer (game/MagmaScenery.jsx) and the colliders (magmaColliders.js) so
 * what you see is exactly what you bump into. Every set-piece hugs the EDGE
 * of its clearing — the paved middle of each clearing is kept OPEN for the
 * future challenge that will claim it.
 */
import {
  polar, MAGMA_CHALLENGE_SPOTS, MAGMA_PLAZA, LAKE_ISLET, LAVA_LAKE, VOLCANO,
  COLUMN_STAIR_PIVOT, CRATER_GATE,
} from "./magmaLayout.js";

const DEG = Math.PI / 180;
const spot = (id) => MAGMA_CHALLENGE_SPOTS.find((s) => s.id === id);

/** Local frame of a clearing: out = away from the volcano, tan = clockwise. */
function frame(id) {
  const s = spot(id);
  const [cx, cz] = s.center;
  const r = Math.hypot(cx, cz);
  const ox = cx / r, oz = cz / r;
  return {
    c: s.center,
    // a = along the outward axis, b = along the tangent.
    at: (a, b) => [cx + ox * a - oz * b, cz + oz * a + ox * b],
    yaw: Math.atan2(ox, oz), // rotation.y that faces local +z OUTWARD
  };
}

// Tiny deterministic RNG for prop jitter.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Spawn plaza — four lava braziers round the plaza.
// ---------------------------------------------------------------------------
export const PLAZA_BRAZIERS = [
  [-3.6, MAGMA_PLAZA.center[1] - 6.3], [3.6, MAGMA_PLAZA.center[1] - 6.3],
  [7.1, MAGMA_PLAZA.center[1] + 1.2], [-7.3, MAGMA_PLAZA.center[1] - 1.6],
];
// Braziers flanking the main bridge + the trail mouth.
export const BRIDGE_BRAZIERS = [[-3.4, 64.4], [3.4, 64.4], [-3.4, 49.9], [3.4, 49.9]];

// ---------------------------------------------------------------------------
// Basalt Columns — a crowd of hexagonal columns on the clearing's outer rim
// (the climbable stair sits among them; see COLUMN_STAIR in magmaLayout).
// ---------------------------------------------------------------------------
export const BASALT_COLUMNS = (() => {
  // Tightly packed hexagonal clusters (a mini Giant's Causeway) whose heights
  // dome up toward each cluster's middle — they read as columns, not towers.
  const f = frame("columns");
  const out = [];
  const R = 0.82;
  const clusters = [
    { a: 9.6, b: -7.2, rad: 3.6, peak: 3.4 },
    { a: 9.4, b: 6.8, rad: 3.4, peak: 2.8 },
    { a: 2.6, b: -11.0, rad: 2.6, peak: 2.2 },
    { a: 4.6, b: 11.8, rad: 2.4, peak: 2.4 },
  ];
  const rand = rng(11);
  for (const cl of clusters) {
    for (let j = -4; j <= 4; j++) {
      for (let i = -4; i <= 4; i++) {
        const la = i * R * Math.sqrt(3) + (j % 2 ? (R * Math.sqrt(3)) / 2 : 0);
        const lb = j * R * 1.5;
        const d = Math.hypot(la, lb);
        if (d > cl.rad) continue;
        const h = 0.5 + cl.peak * (1 - d / cl.rad) + (rand() - 0.5) * 0.7;
        out.push({ c: f.at(cl.a + la, cl.b + lb), r: R, h: Math.max(0.5, h) });
      }
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// Obsidian Grove — clusters of black-glass crystal spires.
// ---------------------------------------------------------------------------
export const OBSIDIAN_CLUSTERS = (() => {
  const f = frame("obsidian");
  const spots = [[8.8, -6.5], [9.6, 1.2], [8.6, 7.8], [6.0, -9.8], [-5.5, 7.5], [3.6, 9.8], [-3.2, 10.6]];
  const rand = rng(29);
  return spots.map(([a, b], i) => ({
    c: f.at(a, b),
    spires: Array.from({ length: 4 + (i % 3) }, (_, j) => ({
      dx: (rand() - 0.5) * 2.2, dz: (rand() - 0.5) * 2.2,
      h: 1.6 + rand() * 3.6 + (j === 0 ? 1.8 : 0),
      r: 0.28 + rand() * 0.3,
      tx: (rand() - 0.5) * 0.5, tz: (rand() - 0.5) * 0.5,
      glow: rand() > 0.55,
    })),
  }));
})();

// ---------------------------------------------------------------------------
// Geyser Flats — three steam vents + bubbling mud pots around the edge.
// ---------------------------------------------------------------------------
export const GEYSERS = (() => {
  const f = frame("geysers");
  return [
    { id: "g1", c: f.at(9.2, -4.5), r: 1.1, period: 7.5, phase: 0.0 },
    { id: "g2", c: f.at(8.6, 5.5), r: 0.9, period: 6.0, phase: 2.6 },
    { id: "g3", c: f.at(-1.5, -10.4), r: 1.0, period: 9.0, phase: 4.8 },
  ];
})();
export const MUD_POTS = (() => {
  const f = frame("geysers");
  return [f.at(10.6, 0.6), f.at(4.4, 9.6), f.at(4.0, -10.0)];
})();

// ---------------------------------------------------------------------------
// Ember Forge — an open-fronted stone smithy facing the clearing.
// ---------------------------------------------------------------------------
export const FORGE = (() => {
  const f = frame("forge");
  // The hut sits on the clearing's outer edge, its open front facing in.
  return {
    center: f.at(10.6, 0),
    yaw: f.yaw + Math.PI, // local +z faces back toward the clearing
    w: 7, d: 5, h: 3.4,
    anvil: f.at(6.6, -2.6),
    quench: f.at(6.8, 2.8),
    barrels: [f.at(8.4, -5.8), f.at(9.2, -6.6), f.at(7.6, 6.2)],
    oreCarts: [f.at(4.2, -8.4)],
  };
})();

// ---------------------------------------------------------------------------
// Lava Lake — the obelisk on the islet + the lava-falls cliff to the west.
// ---------------------------------------------------------------------------
export const LAKE_OBELISK = { c: [LAKE_ISLET.center[0] - 1.6, LAKE_ISLET.center[1] - 1.4], h: 5.2 };
export const LAVA_FALLS = {
  // Cliff face along the lake's western shore (x), spanning z.
  x: LAVA_LAKE.center[0] - LAVA_LAKE.rx - 0.3,
  z1: -11, z2: 11,
  height: 15,
  // The two falls pour from notches in the cliff top.
  falls: [{ z: -3.6, w: 2.6 }, { z: 4.4, w: 1.8 }],
};

// ---------------------------------------------------------------------------
// Cinder Cones — small steep cones with smoking vents.
// ---------------------------------------------------------------------------
export const CINDER_CONES = (() => {
  const f = frame("cinder");
  return [
    { c: f.at(11.5, -4.0), r: 4.6, h: 6.2 },
    { c: f.at(10.2, 7.6), r: 3.6, h: 4.6 },
    { c: f.at(-3.5, 11.0), r: 3.0, h: 3.8 },
    { c: f.at(6.5, 12.4), r: 2.6, h: 3.2 },
  ];
})();

// ---------------------------------------------------------------------------
// Dragon Bones — a giant fossil ribcage arching OVER the north arc path (you
// walk through it), the skull resting on the clearing's outer edge.
// ---------------------------------------------------------------------------
export const DRAGON = (() => {
  const f = frame("bones");
  // Along the arc path (tangent axis b), ribs from b = −6 … +6.
  const ribs = [-6, -3, 0, 3, 6].map((b, i) => ({ c: f.at(0, b), span: 3.6 - Math.abs(i - 2) * 0.25, height: 5.4 - Math.abs(i - 2) * 0.55 }));
  return {
    ribs,
    yaw: f.yaw, // rib plane: local x = outward axis
    spineStart: f.at(0, -8.4), spineEnd: f.at(0, 8.4),
    skull: { c: f.at(9.4, 9.2), yaw: f.yaw + 2.4 },
    tail: [f.at(3.0, -9.4), f.at(4.6, -10.8), f.at(6.4, -11.6), f.at(8.4, -12.0)],
    // Rib FEET (both sides of the path) — the only solid parts.
    feet: ribs.flatMap((rb, i) => [f.at(rb.span, [-6, -3, 0, 3, 6][i]), f.at(-rb.span, [-6, -3, 0, 3, 6][i])]),
  };
})();

// ---------------------------------------------------------------------------
// Fire Flower Garden — glowing flower beds round the clearing + ember trees.
// ---------------------------------------------------------------------------
export const FIRE_FLOWERS = (() => {
  const f = frame("garden");
  const rand = rng(53);
  const out = [];
  // Beds hug the outer half of the clearing's edge, off the paths.
  const beds = [[8.6, -5.6], [9.4, 0.4], [8.4, 6.4], [3.4, -9.8], [3.0, 9.8], [-3.4, -9.4], [-3.8, 9.2]];
  beds.forEach(([a, b]) => {
    for (let k = 0; k < 11; k++) {
      out.push({
        c: f.at(a + (rand() - 0.5) * 3.2, b + (rand() - 0.5) * 3.2),
        h: 0.35 + rand() * 0.55,
        hue: Math.floor(rand() * 3),
        rot: rand() * Math.PI * 2,
      });
    }
  });
  return out;
})();
export const EMBER_TREES = (() => {
  const f = frame("garden");
  return [f.at(11.4, -3.2), f.at(11.0, 4.8), f.at(6.6, -11.0)];
})();

// ---------------------------------------------------------------------------
// Volcano: crater-lip boulders (a sealed ring) + the rune gate's pillars.
// ---------------------------------------------------------------------------
export const CRATER_LIP_R = VOLCANO.rCrater + 0.55;
export const CRATER_LIP_STONES = (() => {
  const n = 56;
  const rand = rng(77);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { c: [Math.cos(a) * CRATER_LIP_R, Math.sin(a) * CRATER_LIP_R], s: 0.75 + rand() * 0.45, rot: rand() * 6.28 };
  });
})();
export const CRATER_GATE_PILLARS = (() => {
  const [gx, gz] = CRATER_GATE.position;
  const r = Math.hypot(gx, gz);
  const tx = -gz / r, tz = gx / r; // tangent
  return [[gx + tx * 2.1, gz + tz * 2.1], [gx - tx * 2.1, gz - tz * 2.1]];
})();

// Summit beacon (a tall brazier where the trail arrives) — just inside the rim.
export const SUMMIT_BEACON = polar(VOLCANO.rRim - 2.6, (VOLCANO.theta0 / DEG) + 22);

export const COLUMN_STAIR_CENTER = COLUMN_STAIR_PIVOT;
