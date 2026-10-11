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
 *   2 market     Prices + best buys                      Mr. Pearce    BUILT
 *   3 race       Speed is a rate                         Mr. Heywood   BUILT
 *   4 tape       The across number (conversions)         Ms. Ewings    BUILT
 *   5 potion     Mixtures: same ratio, same colour       Ms. Brookes   BUILT
 *   6 barrels    Rates are "per"; rate units             Trevor        BUILT
 *   7 map        Scale is a ratio                        Ms. Mahoney   BUILT
 *   8 fireflies  Stand the ladder up: the graph          Mr. Dawson    BUILT
 *   9 temple     Proportional or not?                    Robot         BUILT
 *  10 pathfinder The capstone: chained ladders           Ms. Bacon     BUILT
 *
 * The PILOT (2026-10-10) built the first two; the other eight followed the
 * same day. Jeff's calls: metric units only (no imperial), no
 * non-proportional "trick" rounds outside the Temple, staff glbs as hosts,
 * and ACCURACY NOT SPEED — any route up a ladder scores the same; only
 * mistakes cost.
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
const LADDER_VIEW = { look: [0, 2.05, -0.2], elev: 0.3, fit: 6.7, minDist: 9, maxDist: 18, lift: 0.19 };

// Views (STAGE coordinates — see Player.jsx's stage camera). `fit` = the
// half-width the screen must show, `fitH` (optional) = the half-height (the
// tall tape and the graph board), `lift` = how far below the look point the
// camera aims so the scene rides up clear of the bottom-docked card.
const RACE_VIEW = { look: [0.4, 1.9, 0.6], elev: 0.5, fit: 7.0, fitH: 5.0, minDist: 9, maxDist: 20, lift: 0.17 };
const TAPE_VIEW = { look: [0.2, 2.75, -0.2], elev: 0.0, fit: 4.0, fitH: 5.5, minDist: 8, maxDist: 18, lift: 0.0 };
const GRAPH_VIEW = { look: [0.3, 0.6, -0.2], elev: 0.15, fit: 6.8, fitH: 5.6, minDist: 9, maxDist: 18, lift: 0 };

/**
 * Each challenge's SOLID footprint in its stage frame — post rows
 * [x0, z0, x1, z1, radius] the colliders are built from (you walk round the
 * ladder and the props, never through them). Default: the ladder's vines
 * between its posts + the stall behind.
 */
const G0 = LADDER_GEOM;
const LADDER_ROW = [G0.x0 - 0.12, G0.z, G0.x1 + 0.14, G0.z, 0.3];
const STALL_ROW = [G0.stall.x - G0.stall.w / 2, G0.stall.z, G0.stall.x + G0.stall.w / 2, G0.stall.z, 0.55];

export const JUNGLE_CHALLENGES = [
  {
    key: "swap", spot: "palm", icon: "🐒", built: true,
    name: "Monkey Swap", skill: "A ratio is a bundle you can repeat (build up, jump, simplify)",
    host: { name: "Mr. Morgan", characterId: "morgan", color: "#6a994e", at: [-6.3, -0.6] },
    frame: clearingFrame("palm", 60),
    view: LADDER_VIEW,
    parkAt: [3.5, 5.6],
    solids: [LADDER_ROW, STALL_ROW],
    blurb: "The monkeys swap 3 bananas for 2 mangoes. Every swap hangs another rung on the vine ladder — 6 for 4, 9 for 6 — and big jumps (double, × 10) get there too. Add the same number to both and the vines come untied at zero!",
  },
  {
    key: "market", spot: "knoll", icon: "🍍", built: true,
    name: "Sunny Market", skill: "Prices on the ladder, friendly pieces and best buys",
    host: { name: "Mr. Pearce", characterId: "pearce", color: "#e07a5f", at: [-6.3, -0.6] },
    frame: clearingFrame("knoll", 90),
    view: LADDER_VIEW,
    parkAt: [3.5, 5.6],
    solids: [LADDER_ROW, STALL_ROW],
    blurb: "4 lemons cost $9 — halve, double, split or join rungs to find any price you need. When a split won't come out in whole cents, try a friendlier piece. Two stalls? Line both ladders up at the same amount of fruit to find the better buy.",
  },
  {
    key: "race", spot: "lagoon", icon: "🐸", built: true,
    name: "Lagoon Race", skill: "Speed is a rate — compare at the same time or distance",
    host: { name: "Mr. Heywood", characterId: "heywood", color: "#2a9d8f", at: [-6.4, 0.6] },
    frame: clearingFrame("lagoon", 300, 3),
    view: RACE_VIEW,
    parkAt: [3.6, 6.6],
    solids: [LADDER_ROW],
    blurb: "Frog, turtle and duck race across the lily lagoon. Build each racer's ladder — metres and seconds — to see how far they get, how long they take, and who is really faster.",
  },
  {
    key: "tape", spot: "greattree", icon: "📏", built: true,
    name: "Tall Tree Tape", skill: "Converting units — the number that crosses the ladder",
    host: { name: "Ms. Ewings", characterId: "ewings", color: "#5b8def", at: [-3.6, 0.9] },
    frame: clearingFrame("greattree", 232, -5),
    view: TAPE_VIEW,
    parkAt: [3.0, 5.2],
    solids: [[-2.4, -0.35, 2.4, -0.35, 0.3]],
    blurb: "A measuring tape hangs from a bamboo gantry under the Great Tree: one unit on each edge. Find the ONE number that crosses from one edge to the other at every rung — then use it, or keep building along.",
  },
  {
    key: "potion", spot: "mushroom", icon: "🧪", built: true,
    name: "Mushroom Potions", skill: "Mixtures: the same ratio gives the same colour",
    host: { name: "Ms. Brookes", characterId: "brookes", color: "#8ac926", at: [-6.3, -0.6] },
    frame: clearingFrame("mushroom", 70, -7),
    view: LADDER_VIEW,
    parkAt: [3.5, 5.6],
    solids: [LADDER_ROW, [3.3, -3.1, 6.6, -3.1, 0.7]],
    blurb: "Scale the recipe on the ladder and the potion keeps its colour — whatever the size of the batch. Add the same scoops to both and it changes! Fill the cauldron in the right ratio.",
  },
  {
    key: "barrels", spot: "pool", icon: "🪣", built: true,
    name: "Waterfall Barrels", skill: "Rates are 'per' — litres per minute, per hour",
    host: { name: "Trevor", characterId: "trevor", color: "#8ac926", at: [-6.3, -0.6] },
    frame: clearingFrame("pool", 220, -7),
    view: LADDER_VIEW,
    parkAt: [3.5, 5.6],
    solids: [LADDER_ROW, [2.6, -3.0, 6.4, -3.0, 0.7]],
    blurb: "A bamboo pipe from the falls fills the barrels: so many litres every so many seconds. Build the ladder to time the tap just right — and see how a rate turns into litres per minute, or per hour.",
  },
  {
    key: "map", spot: "canopy", icon: "🗺️", built: true,
    name: "Treasure Map", skill: "Scale is a ratio — map distance to real distance",
    host: { name: "Ms. Mahoney", characterId: "mahoney", color: "#3d9970", at: [-6.2, 0.4] },
    frame: clearingFrame("canopy", 180, -1.5),
    view: LADDER_VIEW,
    parkAt: [3.4, 5.0],
    solids: [LADDER_ROW],
    blurb: "The old map's scale is a ladder: map centimetres on one vine, real metres on the other. Convert the route — the explorer walks the trail vine and digs where you say.",
  },
  {
    key: "fireflies", spot: "hollow", icon: "✨", built: true,
    name: "Firefly Graphs", skill: "Stand the ladder up — a straight line through zero",
    host: { name: "Mr. Dawson", characterId: "dawson", color: "#9b5de5", at: [-6.6, 0.4] },
    frame: clearingFrame("hollow", 115, 4),
    view: GRAPH_VIEW,
    parkAt: [3.6, 5.8],
    solids: [[-5.3, -0.5, 5.6, -0.5, 0.3]],
    blurb: "Stand the vine ladder up: time along the ground, distance up the redwood. Every rung becomes a firefly — and a true ladder's fireflies line up in a straight line from the roots.",
  },
  {
    key: "temple", spot: "temple", icon: "🗿", built: true,
    name: "Temple of Truth", skill: "Proportional or not? When the ladder breaks",
    host: { name: "Robot", characterId: "robot", color: "#e76f51", at: [-6.3, -0.6] },
    frame: clearingFrame("temple", 210, 10),
    view: LADDER_VIEW,
    parkAt: [3.5, 5.6],
    solids: [LADDER_ROW, [-3.4, -3.6, 3.4, -3.6, 0.6]],
    blurb: "Each carved tablet shows a jungle situation. Hang its pairs on the vines: a true ladder ties at zero and hangs straight — the rest break, and you say why.",
  },
  {
    key: "pathfinder", spot: "shrine", icon: "🧭", built: true,
    name: "Pathfinder", skill: "The capstone: plan an expedition, ladder by ladder",
    host: { name: "Ms. Bacon", characterId: "bacon", color: "#457b9d", at: [-5.6, 1.2] },
    frame: clearingFrame("shrine", 205, -5.5),
    view: LADDER_VIEW,
    parkAt: [3.2, 5.4],
    solids: [LADDER_ROW],
    blurb: "Plan an expedition from the Sky Shrine: one ladder leads to the next — the map to metres, metres to minutes, swaps to prices. Any route on each ladder, so long as every rung is right.",
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
