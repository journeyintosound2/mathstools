/**
 * MAGMA MULTIPLES — the TEN multiplicative-thinking challenges: one registry
 * (pure data) shared by the stores, the 3D layers, the panels, the camera,
 * the hosts and the headless checks.
 *
 * Every challenge lives in a STAGE FRAME: a local coordinate system centred
 * on its apparatus, with local +x to the camera's right, local +z TOWARD the
 * camera and y up. The camera always sits on the INNER side of a clearing
 * (toward the volcano) looking OUTWARD, so each clearing's own set-piece
 * (the forge, the dragon skull, the cliff of falls…) becomes the backdrop.
 *
 * Reading order (= the trophy stand, top row first) is the recommended
 * learning order, following Siemon's progression from arrays and the
 * factor-factor-product idea, through the properties that make mental
 * strategies work, to for-each/ratio, division, proportion and strategy
 * choice:
 *   1 columns  Arrays + factor pairs            Mr. Dawson
 *   2 obsidian Split arrays → area model        Ms. Mahoney
 *   3 terraces The ×10 idea (place value)       Ms. Ewings
 *   4 geysers  Halve & double                   Mr. Heywood
 *   5 forge    Flexible factoring               Robot
 *   6 garden   For each (Cartesian product)     Trevor
 *   7 cinder   Ratio tables (× and ÷)           Steve
 *   8 lake     Division: chunks + remainders    Mr. Pearce
 *   9 bones    Times as many (scaling)          Ms. Brookes
 *  10 summit   Strategy Summit (capstone)       Ms. Bacon
 */
import { polar, MAGMA_CHALLENGE_SPOTS, LAKE_ISLET, VOLCANO } from "./magmaLayout.js";

const spot = (id) => MAGMA_CHALLENGE_SPOTS.find((s) => s.id === id);

/**
 * A stage frame. `origin` [x, z] world, `forward` = the direction the camera
 * LOOKS (outward), `y` = ground height at the origin.
 *   toWorld(x, z)  stage → world [x, z]
 *   toLocal(x, z)  world → stage [x, z]
 *   yaw            rotation.y for a group so its local axes = the stage axes
 */
export function makeFrame(origin, forward, y = 0) {
  const fl = Math.hypot(forward[0], forward[1]) || 1;
  const fx = forward[0] / fl, fz = forward[1] / fl;
  // Right = F × up = (−fz, fx); local +z = −F (toward the camera).
  const rx = -fz, rz = fx;
  return {
    origin, y, forward: [fx, fz],
    yaw: Math.atan2(-fx, -fz),
    toWorld(x, z) {
      return [origin[0] + rx * x - fx * z, origin[1] + rz * x - fz * z];
    },
    toLocal(wx, wz) {
      const dx = wx - origin[0], dz = wz - origin[1];
      return [dx * rx + dz * rz, -(dx * fx + dz * fz)];
    },
  };
}

function clearingFrame(id, shiftOut = 0) {
  const c = spot(id).center;
  const r = Math.hypot(c[0], c[1]);
  const o = [c[0] / r, c[1] / r];
  return makeFrame([c[0] + o[0] * shiftOut, c[1] + o[1] * shiftOut], o, 0);
}

// The summit stage stands on the crater rim a little west of where the trail
// arrives — on the INTACT part of the rim (the trail's last quarter-turn is
// cut into the rim between θ ≈ −26° and 100°). It is the one stage filmed
// INWARD: the camera floats just outside the rim, so the glowing crater, its
// smoke plume and the sealed rune gate on the far side are the backdrop.
export const SUMMIT_DEG = 150;
const SUMMIT_ORIGIN = polar(VOLCANO.rRim - 3.4, SUMMIT_DEG);
const summitFrame = makeFrame(
  SUMMIT_ORIGIN,
  [-Math.cos((SUMMIT_DEG * Math.PI) / 180), -Math.sin((SUMMIT_DEG * Math.PI) / 180)],
  VOLCANO.height
);

// The lake stage sits on the islet; its stone channel runs SOUTH out over
// the lava lake (the only stretch long enough — the falls cliff is just
// west of the islet and the hop-stones run north). The camera floats over
// the islet looking south.
const lakeFrame = makeFrame(LAKE_ISLET.center, [0, 1], 0);

/**
 * view: the locked challenge camera, in STAGE coordinates.
 *   look  [x, y, z] the point the camera frames (before the dock lift)
 *   elev  camera elevation (radians above horizontal)
 *   fit   half-width (m) that must fit across the screen (a number, or the
 *         store may override with viewFit())
 *   minDist / maxDist  clamps on the camera distance
 *   lift  (optional) how far below the stage the camera aims, × distance
 *         (default 0.14 — taller cards want the scene pushed higher)
 * spot: where the (hidden) player parks · host: the host NPC's stand spot.
 */
export const MAGMA_CHALLENGES = [
  {
    key: "columns", spot: "columns", icon: "🟫",
    name: "Column Rectangles", skill: "Arrays + factor pairs (factor × factor = product)",
    host: { name: "Mr. Dawson", characterId: "dawson", color: "#9b5de5", at: [-4.2, 6.2] },
    frame: clearingFrame("columns"),
    view: { look: [0, 0.4, -0.6], elev: 0.9, fit: 8.4, minDist: 10, maxDist: 34 },
    parkAt: [3.5, 7.5],
    blurb: "Stand the basalt columns up in rows. Some row counts make a perfect rectangle, some leave columns over — find EVERY rectangle a number can make. A rectangle turned on its side is the same one (3 × 8 = 8 × 3), and a number with only one rectangle is prime.",
  },
  {
    key: "obsidian", spot: "obsidian", icon: "💎",
    name: "Crack the Crystal", skill: "Split arrays + the area model (the distributive idea)",
    host: { name: "Ms. Mahoney", characterId: "mahoney", color: "#3d9970", at: [-4.2, 6.2] },
    frame: clearingFrame("obsidian"),
    view: { look: [0, 0.3, 0.2], elev: 0.98, fit: 7.0, minDist: 9, maxDist: 26 },
    parkAt: [3.5, 7.5],
    blurb: "Too big to know? Crack it into pieces you DO know. 7 × 8 is 7 fives and 7 threes; 9 × 7 is 10 sevens with one seven taken away; 23 × 14 cracks four ways — tens by tens, tens by ones, ones by ones.",
  },
  {
    key: "terraces", spot: "terraces", icon: "🪜",
    name: "Tenfold Terraces", skill: "The ×10 idea (place value is multiplicative)",
    host: { name: "Ms. Ewings", characterId: "ewings", color: "#5b8def", at: [-4.6, 6.0] },
    frame: clearingFrame("terraces"),
    view: { look: [0, 1.15, -1.6], elev: 0.42, fit: 6.1, minDist: 8, maxDist: 22 },
    parkAt: [3.5, 7.5],
    blurb: "Each terrace is TEN times the one below it. Multiply by 10 and every digit climbs one terrace — the point never moves, the digits do (so 3.5 × 10 is 35, not 3.50). 30 × 40 is 3 × 4 = 12, climbed two terraces.",
  },
  {
    key: "geysers", spot: "geysers", icon: "♨️",
    name: "Halve & Double", skill: "Halving and doubling (same area, new rectangle)",
    host: { name: "Mr. Heywood", characterId: "heywood", color: "#2a9d8f", at: [-4.4, 6.2] },
    frame: clearingFrame("geysers"),
    view: { look: [0, 0.3, 0.0], elev: 1.0, fit: 8.5, minDist: 10, maxDist: 34 },
    parkAt: [3.5, 7.5],
    blurb: "The steam cuts the terrace in half and slides one half alongside — half as many rows, twice as long. Same tiles, so the answer never changes: 16 × 25 = 8 × 50 = 4 × 100. Keep going until it's easy.",
  },
  {
    key: "forge", spot: "forge", icon: "⚒️",
    name: "Factor Forge", skill: "Flexible factoring (regroup the factors)",
    host: { name: "Robot", characterId: "robot", color: "#e76f51", at: [-4.4, 5.6] },
    frame: clearingFrame("forge"),
    view: { look: [0, 1.25, -0.3], elev: 0.55, fit: 5.0, minDist: 7, maxDist: 20 },
    parkAt: [3.5, 7.5],
    blurb: "Hammer a number into its factors, then fuse the pieces that make a friendly 10 or 100: 25 × 24 = 25 × 4 × 6 = 100 × 6. The product never changes — only how easy it is.",
  },
  {
    key: "garden", spot: "garden", icon: "🌺",
    name: "Flower Combos", skill: "For each (combinations make an array)",
    host: { name: "Trevor", characterId: "trevor", color: "#8ac926", at: [-4.4, 6.0] },
    frame: clearingFrame("garden"),
    view: { look: [0, 0.5, -0.7], elev: 0.82, fit: 6.4, minDist: 8, maxDist: 24, lift: 0.22 },
    parkAt: [3.5, 7.5],
    blurb: "FOR EACH flower there's a whole row of pots — plant every combination and the garden lays itself out as an array: 4 flowers × 3 pots = 12 combos. Add a glow and the array grows a layer.",
  },
  {
    key: "cinder", spot: "cinder", icon: "🛒",
    name: "Cart Tables", skill: "Ratio tables for multiplying AND dividing",
    host: { name: "Steve", characterId: "steve", color: "#e9c46a", at: [-4.6, 6.0] },
    frame: clearingFrame("cinder"),
    view: { look: [0, 1.3, -1.0], elev: 0.36, fit: 6.0, minDist: 7, maxDist: 24, lift: 0.17 },
    parkAt: [3.5, 7.5],
    blurb: "For each cart, 24 rocks. Build the table with moves you trust — double, halve, ×10, add two columns — until you reach the carts you need… or run it backwards to find how many carts a pile fills.",
  },
  {
    key: "lake", spot: "lake", icon: "🌋",
    name: "Lava Channels", skill: "Division: friendly chunks, both meanings, remainders",
    host: { name: "Mr. Pearce", characterId: "pearce", color: "#e07a5f", at: [-2.4, 2.4] },
    frame: lakeFrame,
    view: { look: [0.2, 0.2, -7.0], elev: 0.82, fit: 9.0, minDist: 10, maxDist: 28, lift: 0.2 },
    parkAt: [1.6, 3.0],
    blurb: "Pour the cauldron into a channel 12 wide, ten rows at a time if it fits — 156 ÷ 12 is 10 rows + 3 rows. The same rectangle shares 156 among 12 moulds. And when lava is left over, the question decides what to do with it.",
  },
  {
    key: "bones", spot: "bones", icon: "🦴",
    name: "Grow the Dragon", skill: "Times as many (scaling, not adding)",
    host: { name: "Ms. Brookes", characterId: "brookes", color: "#8ac926", at: [-4.6, 6.0] },
    frame: clearingFrame("bones"),
    view: { look: [0, 1.0, -0.6], elev: 0.5, fit: 5.8, minDist: 8, maxDist: 24 },
    parkAt: [3.5, 7.5],
    blurb: "Build the grown-up dragon from the baby's bones. If the skull is 3 times as long, EVERY bone is 3 times as long — add the same amount to each and the dragon comes out wonky.",
  },
  {
    key: "summit", spot: "summit", icon: "🏔️",
    name: "Strategy Summit", skill: "Choosing a strategy (the capstone)",
    host: { name: "Ms. Bacon", characterId: "bacon", color: "#457b9d", at: [-3.6, 1.6] },
    frame: summitFrame,
    view: { look: [0, 1.9, -1.0], elev: 0.3, fit: 5.0, minDist: 7, maxDist: 14 },
    parkAt: [2.6, 1.4],
    blurb: "Every problem at the top can be done several ways — all correct. Pick the EASIEST way, then do it step by step: halve and double, factor, split, round and adjust, or a ratio table.",
  },
];

export const MAGMA_CHALLENGE_KEYS = MAGMA_CHALLENGES.map((c) => c.key);

export function getMagmaChallenge(key) {
  return MAGMA_CHALLENGES.find((c) => c.key === key) || null;
}

/** Interactable id for a challenge's host. */
export const magmaHostId = (key) => `magma-${key}-host`;

/** World [x, z] of a stage-local point for a challenge. */
export function magmaStageToWorld(key, x, z) {
  const c = getMagmaChallenge(key);
  return c ? c.frame.toWorld(x, z) : [x, z];
}

/** World position of each host (the interactable stands here). */
export function magmaHostWorld(key) {
  const c = getMagmaChallenge(key);
  return c.frame.toWorld(c.host.at[0], c.host.at[1]);
}

/**
 * Is world point (x, z) inside a running challenge's camera corridor? Props
 * and host NPCs there step out of shot (the snow world's audit rule:
 * nothing stands between the student and the maths).
 */
export function inMagmaChallengeView(key, x, z, fitOverride) {
  const c = getMagmaChallenge(key);
  if (!c) return false;
  const [lx, lz] = c.frame.toLocal(x, z);
  const half = (fitOverride || c.view.fit) + 2.5;
  return lz > c.view.look[2] - 1.5 && lz < 30 && Math.abs(lx) < half + Math.max(0, lz) * 0.45;
}

// Welcome + the trophy stand on the arrival plaza.
export const MAGMA_WELCOME_HOST = { id: "magma-welcome-host", position: [-4.6, 86.8] };
export const MAGMA_RECORDS_STAND = { id: "magma-records", position: [6.8, 96.4], rotationY: Math.atan2(-6.8, -4.6) }; // faces the plaza centre

/**
 * TENFOLD TERRACES — the permanent stone staircase on the terraces clearing
 * (stage-local coordinates). Seven terraces, thousands (left, highest) down
 * to thousandths (right, lowest); the decimal-point orb sits on a pillar
 * between the ones and the tenths terraces.
 */
export const TERRACE_GEOM = {
  places: [3, 2, 1, 0, -1, -2, -3],
  x: (p) => -p * 1.55 + (p < 0 ? 0.35 : 0), // a little gap at the point
  top: (p) => 0.45 + (p + 3) * 0.32,
  width: 1.48,
  z0: -3.7, z1: -1.1,
  pointX: 0.95,
};
TERRACE_GEOM.zMid = (TERRACE_GEOM.z0 + TERRACE_GEOM.z1) / 2;
