/**
 * EMERALD JUNGLE — the TEN proportional-reasoning challenges: one registry
 * (pure data) shared by the stores, the 3D layer, the panels, the camera,
 * the hosts, the scatter and the headless checks. Mirrors Magma Multiples'
 * registry (data/magma/magmaChallenges.js) — same STAGE FRAME idea.
 *
 * Every challenge is built around the same tool, the VINE LADDER (the
 * jungle's double number line — data/jungle/vineLadder.js), dressed for a
 * different context. Reading order (= the trophy stand, top row first) is
 * the recommended learning order (the design doc in the project:
 * "emerald-jungle-challenges-plan.md"):
 *   1 swap       A ratio is a bundle you can repeat      Mr. Morgan    BUILT
 *   2 market     The unitary method + best buys          Mr. Pearce    BUILT
 *   3 race       Speed is a rate                         Mr. Heywood
 *   4 tape       The across multiplier (conversions)     Ms. Ewings
 *   5 potion     Mixtures: same ratio, same colour       Ms. Brookes
 *   6 barrels    Rates are "per"; rate units             Trevor
 *   7 map        Scale is a ratio                        Ms. Mahoney
 *   8 fireflies  Stand the ladder up: the graph          Mr. Dawson
 *   9 temple     Proportional or not?                    Robot
 *  10 pathfinder The capstone: the easiest route         Ms. Bacon
 *
 * The PILOT (2026-10-10) builds the first two; the other eight show as
 * "coming soon" on the trophy stand and the Achievements Wall. Jeff's
 * calls for the rest: metric units only (no imperial), no non-proportional
 * "trick" rounds outside the Temple, staff glbs as hosts.
 *
 * Stage frame: local +x to the camera's right, +z TOWARD the camera, y up,
 * origin = the apparatus centre on the clearing's flat pad. Each built
 * clearing is filmed ACROSS its trail, so walkers pass in front of the
 * ladder rather than through it.
 */
import { makeFrame } from "../magma/magmaChallenges.js";
import { JUNGLE_SPOTS, terrainHeight } from "./jungleLayout.js";

const spot = (id) => JUNGLE_SPOTS.find((s) => s.id === id);

/** A compass bearing (0 = north/−z, 90 = east/+x) → a unit [x, z]. */
export function bearing(deg) {
  const r = (deg * Math.PI) / 180;
  return [Math.sin(r), -Math.cos(r)];
}

/**
 * A clearing's stage frame. The camera stands on the `camDeg` side of the
 * clearing looking across it; the apparatus is pushed `back` metres away
 * from the camera so the clearing's trail runs in front of it.
 */
function clearingFrame(id, camDeg, back = 2.6) {
  const c = spot(id).center;
  const f = bearing(camDeg + 180); // the camera LOOKS this way
  const o = [c[0] + f[0] * back, c[1] + f[1] * back];
  return makeFrame(o, f, terrainHeight(c[0], c[1]));
}

/**
 * The vine ladder's footprint in its stage frame (shared by the 3D ladder,
 * the colliders and the checks): vines run from the ZERO post at x0 to the
 * end post at x1, in the plane z; the stall stands back-right.
 */
export const LADDER_GEOM = { x0: -4.6, x1: 5.9, z: -0.4, stall: { x: 5.05, z: -3.25, w: 3.0 } };

// The view every vine ladder uses (a vertical board of vines facing the
// camera), in STAGE coordinates: see Player.jsx's stage camera.
const LADDER_VIEW = { look: [0, 2.05, -0.2], elev: 0.3, fit: 6.7, minDist: 9, maxDist: 18, lift: 0.24 };

export const JUNGLE_CHALLENGES = [
  {
    key: "swap", spot: "palm", icon: "🐒", built: true,
    name: "Monkey Swap", skill: "A ratio is a bundle you can repeat (build up, jump, simplify)",
    host: { name: "Mr. Morgan", characterId: "morgan", color: "#6a994e", at: [-6.3, -0.6] },
    frame: clearingFrame("palm", 60),
    view: LADDER_VIEW,
    parkAt: [3.5, 5.6],
    blurb: "The monkeys swap 3 bananas for 2 mangoes. Every swap hangs another rung on the vine ladder — 6 for 4, 9 for 6 — and big jumps (double, × 10) get there faster. Add the same number to both and the vines come untied at zero!",
  },
  {
    key: "market", spot: "knoll", icon: "🍍", built: true,
    name: "Sunny Market", skill: "The unitary method, friendly pieces and best buys",
    host: { name: "Mr. Pearce", characterId: "pearce", color: "#e07a5f", at: [-6.3, -0.6] },
    frame: clearingFrame("knoll", 90),
    view: LADDER_VIEW,
    parkAt: [3.5, 5.6],
    blurb: "4 pineapples cost $10 — split the rung into 4 to find the price of ONE, then stretch it. When one won't come out in whole cents, split into a friendlier piece. Two stalls? Line both ladders up at the same number of fruit to find the better buy.",
  },
  {
    key: "race", spot: "lagoon", icon: "🐸", built: false,
    name: "Lagoon Race", skill: "Speed is a rate — compare at the same time or distance",
    host: { name: "Mr. Heywood", characterId: "heywood", color: "#2a9d8f" },
    blurb: "Frog, turtle and duck race across the lily lagoon. Build each racer's ladder, predict the winner, then watch the race.",
  },
  {
    key: "tape", spot: "greattree", icon: "📏", built: false,
    name: "Tall Tree Tape", skill: "Converting units — the multiplier across the ladder",
    host: { name: "Ms. Ewings", characterId: "ewings", color: "#5b8def" },
    blurb: "A tape hangs from the treehouse: one unit on each edge. Find the ONE multiplier that works across every rung.",
  },
  {
    key: "potion", spot: "mushroom", icon: "🧪", built: false,
    name: "Mushroom Potions", skill: "Mixtures: the same ratio gives the same colour",
    host: { name: "Ms. Brookes", characterId: "brookes", color: "#8ac926" },
    blurb: "Scale the recipe and the potion keeps its colour. Add the same to both and it changes!",
  },
  {
    key: "barrels", spot: "pool", icon: "🪣", built: false,
    name: "Waterfall Barrels", skill: "Rates are 'per' — litres per minute, per hour",
    host: { name: "Trevor", characterId: "trevor", color: "#8ac926" },
    blurb: "A bamboo pipe fills the barrels. Set the timer just right — too long and it overflows.",
  },
  {
    key: "map", spot: "canopy", icon: "🗺️", built: false,
    name: "Treasure Map", skill: "Scale is a ratio — map distance to real distance",
    host: { name: "Ms. Mahoney", characterId: "mahoney", color: "#3d9970" },
    blurb: "Measure the route on the old map, convert it on the ladder, and see if the flare lands on the treasure.",
  },
  {
    key: "fireflies", spot: "hollow", icon: "✨", built: false,
    name: "Firefly Graphs", skill: "Stand the ladder up — a straight line through zero",
    host: { name: "Mr. Dawson", characterId: "dawson", color: "#9b5de5" },
    blurb: "Stand the ladder up a giant redwood: every rung becomes a firefly, and they line up from the roots.",
  },
  {
    key: "temple", spot: "temple", icon: "🗿", built: false,
    name: "Temple of Truth", skill: "Proportional or not? When the ladder breaks",
    host: { name: "Robot", characterId: "robot", color: "#e76f51" },
    blurb: "Hang each tablet on the vines. True proportions tie at zero — the rest break, and you say why.",
  },
  {
    key: "pathfinder", spot: "shrine", icon: "🧭", built: false,
    name: "Pathfinder", skill: "The capstone: pick the easiest route on the ladder",
    host: { name: "Ms. Bacon", characterId: "bacon", color: "#457b9d" },
    blurb: "The same problem, three correct routes. Pick the easiest, then walk it.",
  },
];

export const JUNGLE_CHALLENGE_KEYS = JUNGLE_CHALLENGES.map((c) => c.key);
export const BUILT_JUNGLE_CHALLENGES = JUNGLE_CHALLENGES.filter((c) => c.built);

export function getJungleChallenge(key) {
  return JUNGLE_CHALLENGES.find((c) => c.key === key) || null;
}

/** Interactable id for a challenge's host. */
export const jungleHostId = (key) => `jungle-${key}-host`;

/** World [x, z] of a stage-local point. */
export function jungleStageToWorld(key, x, z) {
  const c = getJungleChallenge(key);
  return c && c.frame ? c.frame.toWorld(x, z) : [x, z];
}

/** World position of a built challenge's host. */
export function jungleHostWorld(key) {
  const c = getJungleChallenge(key);
  return c.frame.toWorld(c.host.at[0], c.host.at[1]);
}

/**
 * Is world point (x, z) inside a built challenge's camera CORRIDOR (the box
 * between the camera and the apparatus)? Tall scatter is never placed there
 * (jungleProps.js), and host NPCs standing in it step out of shot while
 * that challenge runs.
 */
export function inJungleChallengeView(key, x, z) {
  const c = getJungleChallenge(key);
  if (!c || !c.frame) return false;
  const [lx, lz] = c.frame.toLocal(x, z);
  const camLz = c.view.maxDist * Math.cos(c.view.elev) + 3;
  if (lz < c.view.look[2] - 1.6 || lz > camLz) return false;
  // The view narrows toward the camera (nothing beside the lens is in shot).
  const half = (c.view.fit + 3.5) * (1 - 0.6 * Math.max(0, lz) / camLz);
  return Math.abs(lx) < half;
}

/** In ANY built challenge's corridor (the scatter's permanent keep-clear). */
export function inAnyJungleChallengeView(x, z) {
  for (const c of BUILT_JUNGLE_CHALLENGES) if (inJungleChallengeView(c.key, x, z)) return true;
  return false;
}

// Mills + the trophy stand on the arrival glade. Arrivals land at [0, 134.5]
// looking NORTH; the stand stands front-left facing them (trophy.glb's open
// front is its local +z, so rotationY = atan2(dx, dz) toward the spawn), Mills
// beside the welcome sign front-right.
export const JUNGLE_WELCOME_HOST = { id: "jungle-welcome-host", position: [3.3, 130.4] };
const STAND_AT = [-6.6, 130.2];
export const JUNGLE_RECORDS_STAND = {
  id: "jungle-records",
  position: STAND_AT,
  rotationY: Math.atan2(0 - STAND_AT[0], 134.5 - STAND_AT[1]),
  groupScale: 2.6,
};
