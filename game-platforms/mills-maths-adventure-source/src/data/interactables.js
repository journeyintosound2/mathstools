/**
 * INTERACTABLES — the things in the world the player can walk up to and use.
 *
 * Each interactable references an `encounterId` (defined in encounters.js)
 * instead of hardcoding any maths topic. That indirection is the key to the
 * scalable architecture: the world only knows "interacting here runs encounter
 * X"; what encounter X actually does is data + a renderer.
 *
 * Fields:
 *   id           unique string
 *   name         label shown above the object
 *   encounterId  which encounter to run (see src/data/encounters.js)
 *   model        which simple 3D shape to draw: "npc" | "chest" | "gate"
 *   color        main colour
 *   position     [x, z] on the ground plane
 *   promptLabel  text for the "Press E" prompt
 */
import { SCHOOLYARD_CHARACTERS } from "./schoolyard/schoolyardLayout.js";
import {
  FARM_WELCOME_SIGN, CHALLENGE_SIGN, ROUNDUP_SIGN, ORDER_SIGN, CRATE_SIGN, MILK_SIGN, WEIGH_SIGN, TRADE_SIGN, VEGGIE_SIGN, PLANK_SIGN, SHOP_SIGN, FARM_RECORDS_STAND,
  FARM_CHEST_SPOTS,
} from "./farm/farmLayout.js";
import {
  SNOW_WELCOME_SIGN, SNOW_RECORDS_STAND, RANGE_SIGN, RINK_GLIDE_SIGN, GROVE_SIGN, MEADOW_SIGN, SLOPE_SIGN,
  VILLAGE_SIGN, COLONY_SIGN, CAVE_SIGN, YARD_SIGN, LOOKOUT_SIGN,
  SNOW_CHEST_SPOTS,
} from "./snow/snowLayout.js";
import { CABIN_PIP } from "./cabin/cabinLayout.js";
import {
  MAGMA_CHALLENGES, magmaHostId, magmaHostWorld, MAGMA_WELCOME_HOST, MAGMA_RECORDS_STAND,
} from "./magma/magmaChallenges.js";
import { MAGMA_REGION_ID } from "./magma/magmaLayout.js";

// Magma Multiples (2026-10-03): ten hosts, one per multiplicative challenge,
// standing at the inner (volcano) edge of their clearing. Each host is
// INTERCEPTED in interaction.js → its challenge store's start().
const MAGMA_HOSTS = MAGMA_CHALLENGES.map((c) => ({
  id: magmaHostId(c.key),
  name: c.host.name,
  encounterId: `magma-${c.key}-challenge`,
  model: "npc",
  characterId: c.host.characterId,
  color: c.host.color,
  position: magmaHostWorld(c.key),
  promptLabel: `Talk to ${c.host.name} — ${c.name}`,
  collision: { type: "circle", radius: 0.7, enabled: true },
  interactionRadius: 3.6,
  regionId: MAGMA_REGION_ID,
}));

// Schoolyard NPCs (W2-D) — Helen / Darby / Elka. Built from the shared layout so
// positions match the map + colliders. They use the same chain/npcDialogue path
// as the island NPCs (a warm-up default; teacher-assignable). `regionId` tags
// them to the schoolyard so only that region renders/collides with them.
const SCHOOLYARD_NPCS = SCHOOLYARD_CHARACTERS.map((c) => ({
  id: c.id,
  name: c.name,
  encounterId: `${c.id}-complete`,
  model: "npc",
  color: c.color,
  position: c.position,
  promptLabel: `Talk to ${c.name}`,
  collision: { type: "circle", radius: c.boss ? 1.3 : 0.8, enabled: true },
  interactionRadius: c.boss ? 4.6 : 3.6, // reach the boss from in front of her podium
  scale: c.scale || 1,
  regionId: "schoolyard",
}));

// Random treasure-chest spot (W6-B): chosen once per load from hand-picked open
// grassy spots that are clear of the plaza, the topic zones, the grove and the
// Algebra moat/bridge — so the chest is always reachable and never buried.
const CHEST_SPOTS = [
  [12, -2], [-12, -2], [-10, 19], [10, 19], [-14, -20], [14, -20],
];
export const RANDOM_CHEST_POS = CHEST_SPOTS[Math.floor(Math.random() * CHEST_SPOTS.length)];

// Random FARM treasure-chest spot — the same idea as the island chest, but
// out in the open grass of the big rolling farm (FARM_CHEST_SPOTS in
// farmLayout.js — clear of every station, track, building and fence, and
// reachable: the farm world checks walk to each one).
export const FARM_CHEST_POS = FARM_CHEST_SPOTS[Math.floor(Math.random() * FARM_CHEST_SPOTS.length)];
// …and one hidden somewhere in the Snowball Sums valley (SNOW_CHEST_SPOTS —
// a lakeshore, a floe hop, the woods; the snow world checks reach each one).
export const SNOW_CHEST_POS = SNOW_CHEST_SPOTS[Math.floor(Math.random() * SNOW_CHEST_SPOTS.length)];

export const INTERACTABLES = [
  // The three original maths NPCs — same look, positions and topics as before.
  {
    id: "pip",
    name: "Pip the Penguin",
    encounterId: "maths-integers",
    model: "npc",
    color: "#ff8a5c",
    position: [-25, -16], // Integer Dunes
    promptLabel: "Talk to Pip",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
  },
  {
    id: "fern",
    name: "Fern the Fox",
    encounterId: "maths-fractions",
    model: "npc",
    color: "#9b8cff",
    position: [25, -16], // Fraction Volcano
    promptLabel: "Talk to Fern",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
  },
  {
    id: "alby",
    name: "Alby the Owl",
    encounterId: "maths-algebra",
    model: "npc",
    color: "#4fc3f7",
    position: [25, 16], // Algebra Coast
    promptLabel: "Talk to Alby",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
  },

  // Mills — a friendly guide in the hub (id stays "sage" internally).
  {
    id: "sage",
    name: "Mills",
    encounterId: "dialogue-sage",
    model: "npc",
    color: "#52b788",
    position: [5, 16], // down near the spawn point (off the plaza) — W6-C
    promptLabel: "Talk to Mills",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
  },

  // --- World progression (Phase 2G/2H) ---
  // The student-facing Mission Board, in the central hub.
  {
    id: "mission-board",
    name: "Mission Board",
    encounterId: "mission-board",
    model: "board",
    color: "#2a9d8f",
    position: [-5, 0], // left side of the plaza (spaced from the Trophy Stand)
    promptLabel: "Read the Mission Board",
    collision: { type: "circle", radius: 1.2, enabled: true },
    interactionRadius: 3.8,
  },
  // Trophy stand in the hub — opens the Trophy Room (handled specially in App).
  {
    id: "trophy-stand",
    name: "Trophy Stand",
    encounterId: "trophy-board",
    model: "trophy",
    color: "#ffd166",
    position: [5, 0], // right side of the plaza (spaced from the Mission Board)
    promptLabel: "View your trophies",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
  },
  // A hidden treasure chest (W6-B) — placed at a RANDOM, collision-safe, always-
  // reachable spot each load (see RANDOM_CHEST_POS). Opening it gives a small
  // coins bonus, re-findable each session (handled in game/interaction.js).
  {
    id: "chest",
    name: "Treasure Chest",
    encounterId: "treasure-cove",
    model: "chest",
    color: "#f4a261",
    position: RANDOM_CHEST_POS,
    promptLabel: "Open the chest",
    collision: { type: "circle", radius: 0.8, enabled: true },
    interactionRadius: 3.4,
  },

  // A hidden treasure chest on Fraction Farm — like the island one: a small
  // coins bonus at a RANDOM open spot each visit (handled in interaction.js).
  {
    id: "farm-chest",
    name: "Treasure Chest",
    encounterId: "farm-treasure",
    model: "chest",
    color: "#f4a261",
    position: FARM_CHEST_POS,
    promptLabel: "Open the chest",
    collision: { type: "circle", radius: 0.8, enabled: true },
    interactionRadius: 3.4,
    regionId: "farm-parts-whole",
  },

  // Schoolyard greeter (W2-E) — Mills welcomes the player on arrival (replaces
  // the old "Welcome to the Coffs Coast" sign). Renders mills.glb via the "sage"
  // character config.
  {
    id: "schoolyard-sign",
    name: "Mills",
    encounterId: "schoolyard-welcome",
    model: "npc",
    characterId: "sage",
    color: "#52b788",
    position: [0, 12], // just north of the spawn, on the way to the plaza
    promptLabel: "Talk to Mills",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.4,
    regionId: "schoolyard",
  },

  // The Schoolyard NPCs (W2-D).
  ...SCHOOLYARD_NPCS,

  // ---- Fraction Farm (F1–F5) ----
  // The three island friends host the farm challenges (via `characterId` they
  // reuse the pip/fern/alby models — the two regions never render together),
  // and Mills greets arrivals. Challenge starts are intercepted in
  // interaction.js; the encounters are fallbacks only.
  {
    id: "farm-welcome-sign",
    name: "Mills",
    encounterId: "farm-welcome",
    model: "npc",
    characterId: "sage",
    color: "#52b788",
    position: FARM_WELCOME_SIGN.position,
    promptLabel: "Talk to Mills",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "farm-parts-whole",
  },
  {
    id: "farm-fence-sign",
    name: "Pip the Penguin",
    encounterId: "farm-fence-challenge",
    model: "npc",
    characterId: "pip",
    color: "#ff8a5c",
    position: CHALLENGE_SIGN.position,
    promptLabel: "Talk to Pip — Fence Challenge",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "farm-parts-whole",
  },
  {
    id: "farm-roundup-sign",
    name: "Fern the Fox",
    encounterId: "farm-roundup-challenge",
    model: "npc",
    characterId: "fern",
    color: "#9b8cff",
    position: ROUNDUP_SIGN.position,
    promptLabel: "Talk to Fern — The Round-Up",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "farm-parts-whole",
  },
  {
    id: "farm-order-sign",
    name: "Alby the Owl",
    encounterId: "farm-order-challenge",
    model: "npc",
    characterId: "alby",
    color: "#4fc3f7",
    position: ORDER_SIGN.position,
    promptLabel: "Talk to Alby — Order the Parts",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "farm-parts-whole",
  },
  {
    id: "farm-crate-sign",
    name: "Robot",
    encounterId: "farm-crate-challenge",
    model: "npc",
    characterId: "robot",
    color: "#f3f3ee",
    position: CRATE_SIGN.position,
    promptLabel: "Talk to Robot — Crate Packing",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "farm-parts-whole",
  },
  {
    id: "farm-milk-sign",
    name: "The Milkman",
    encounterId: "farm-milk-challenge",
    model: "npc",
    // Placeholder: "milk-host" has no glb configured → primitive body until
    // the teacher's milkman model lands (then add it to characterModels).
    characterId: "milk-host",
    color: "#3a7bd5",
    position: MILK_SIGN.position,
    promptLabel: "Talk to the Milkman — The Milk Splitter",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "farm-parts-whole",
  },
  {
    id: "farm-weigh-sign",
    name: "The Weigh Master",
    encounterId: "farm-weigh-challenge",
    model: "npc",
    // Placeholder: no glb configured → primitive body until a model lands.
    characterId: "weigh-host",
    color: "#c9a227",
    position: WEIGH_SIGN.position,
    promptLabel: "Talk to the Weigh Master — The Weigh Station",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "farm-parts-whole",
  },
  {
    id: "farm-trade-sign",
    name: "Steve",
    encounterId: "farm-trade-challenge",
    model: "npc",
    characterId: "steve",
    color: "#9b5de5",
    position: TRADE_SIGN.position,
    promptLabel: "Talk to Steve — The Trading Post",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "farm-parts-whole",
  },
  {
    id: "farm-veggie-sign",
    name: "Trevor",
    encounterId: "farm-veggie-challenge",
    model: "npc",
    characterId: "trevor",
    color: "#6cbf3f",
    position: VEGGIE_SIGN.position,
    promptLabel: "Talk to Trevor — The Veggie Plot",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "farm-parts-whole",
  },
  {
    id: "farm-plank-sign",
    name: "Woody",
    encounterId: "farm-plank-challenge",
    model: "npc",
    characterId: "plank-host",
    color: "#c19a6b",
    position: PLANK_SIGN.position,
    promptLabel: "Talk to Woody — Plank the Gap",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "farm-parts-whole",
  },
  {
    id: "farm-shop-sign",
    name: "Sunny",
    encounterId: "farm-shop-challenge",
    model: "npc",
    characterId: "shop-host",
    color: "#e8a33d",
    position: SHOP_SIGN.position,
    promptLabel: "Talk to Sunny — The Farm Shop",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "farm-parts-whole",
  },
  // Farm trophy bench (F5) — gold/silver/bronze cups per challenge, rendered
  // live from the saved bests (FarmScenery TrophyShelf); the dialogue is
  // built in interaction.js.
  {
    id: "farm-records",
    name: "Farm Trophies",
    encounterId: "farm-records",
    model: "none", // visual = trophy.glb stand + dynamic cups (FarmScenery)
    color: "#ffd166",
    position: FARM_RECORDS_STAND.position,
    promptLabel: "Look at your trophies",
    collision: { type: "circle", radius: 2.0, enabled: true }, // larger stand now
    interactionRadius: 5.0,
    regionId: "farm-parts-whole",
  },

  // ---- Snowball Sums (S1–S2) ----
  // Mills greets arrivals by the welcome sign (the two regions never render
  // together, so sharing the glb is safe); the trophy stand opens the snow
  // trophy grid (intercepted in interaction.js — the encounter is a fallback).
  {
    id: "snow-welcome-sign",
    name: "Mills",
    encounterId: "snow-welcome",
    model: "npc",
    characterId: "sage",
    color: "#52b788",
    position: SNOW_WELCOME_SIGN.position,
    promptLabel: "Talk to Mills",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "snow-sums",
  },
  // Pip hosts the Snowball Range (the island + snow copies never render
  // together, so sharing pip.glb is safe — same pattern as the farm hosts).
  // The sign is INTERCEPTED in interaction.js → useSnowballRange.start().
  {
    id: "snow-range-sign",
    name: "Pip",
    encounterId: "snow-range-challenge",
    model: "npc",
    characterId: "pip",
    color: "#7fc8f0",
    position: RANGE_SIGN.position,
    promptLabel: "Talk to Pip — The Snowball Range",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "snow-sums",
  },
  // Fern hosts the Ice Rink glide from beside the southern rink gate (island
  // + snow never co-render, so sharing fern.glb is safe). The sign is
  // INTERCEPTED in interaction.js → useRinkGlide.start().
  {
    id: "snow-rink-sign",
    name: "Fern",
    encounterId: "snow-rink-challenge",
    model: "npc",
    characterId: "fern",
    color: "#67e08a",
    position: RINK_GLIDE_SIGN.position,
    promptLabel: "Talk to Fern — The Ice Rink",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "snow-sums",
  },
  // Alby hosts the Christmas Tree Grove (island + snow never co-render, so
  // sharing alby.glb is safe). INTERCEPTED in interaction.js.
  {
    id: "snow-pines-sign",
    name: "Alby",
    encounterId: "snow-pines-challenge",
    model: "npc",
    characterId: "alby",
    color: "#ffd166",
    position: GROVE_SIGN.position,
    promptLabel: "Talk to Alby — Christmas Tree Grove",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "snow-sums",
  },
  // Frosty hosts Snowman Meadow. Placeholder: "snowmen-host" has no glb
  // configured → primitive body until a teacher model lands (then add it to
  // characterModels, like the old milk/weigh hosts). INTERCEPTED in
  // interaction.js.
  {
    id: "snow-snowmen-sign",
    name: "Frosty",
    encounterId: "snow-snowmen-challenge",
    model: "npc",
    characterId: "snowmen-host",
    color: "#9fdcf2",
    position: MEADOW_SIGN.position,
    promptLabel: "Talk to Frosty — Snowman Meadow",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "snow-sums",
  },
  // Flake hosts the Sledding Slope. Placeholder: "sled-host" has no glb
  // configured → primitive body until a teacher model lands. INTERCEPTED in
  // interaction.js.
  {
    id: "snow-sled-sign",
    name: "Flake",
    encounterId: "snow-sled-challenge",
    model: "npc",
    characterId: "sled-host",
    color: "#ffd166",
    position: SLOPE_SIGN.position,
    promptLabel: "Talk to Flake — Sledding Slope",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "snow-sums",
  },
  // The final five snow hosts — ALL placeholders (no glbs configured →
  // primitive bodies until teacher models land; add each to characterModels
  // like the old milk/weigh hosts). Every sign is INTERCEPTED in
  // interaction.js.
  {
    id: "snow-village-sign",
    name: "Bloc",
    encounterId: "snow-village-challenge",
    model: "npc",
    characterId: "village-host",
    color: "#9fdcf2",
    position: VILLAGE_SIGN.position,
    promptLabel: "Talk to Bloc — Igloo Village",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "snow-sums",
  },
  {
    id: "snow-colony-sign",
    name: "Pippin",
    encounterId: "snow-colony-challenge",
    model: "npc",
    characterId: "colony-host",
    color: "#f2f6fb",
    position: COLONY_SIGN.position,
    promptLabel: "Talk to Pippin — Penguin Colony",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "snow-sums",
  },
  {
    id: "snow-cave-sign",
    name: "Glim",
    encounterId: "snow-cave-challenge",
    model: "npc",
    characterId: "cave-host",
    color: "#59d8e8",
    position: CAVE_SIGN.position,
    promptLabel: "Talk to Glim — The Ice Cave",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "snow-sums",
  },
  {
    id: "snow-yard-sign",
    name: "Cocoa",
    encounterId: "snow-yard-challenge",
    model: "npc",
    characterId: "yard-host",
    color: "#c69a5b",
    position: YARD_SIGN.position,
    promptLabel: "Talk to Cocoa — The Lodge Yard",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "snow-sums",
  },
  {
    id: "snow-lights-sign",
    name: "Nova",
    encounterId: "snow-lights-challenge",
    model: "npc",
    characterId: "lights-host",
    color: "#9b5de5",
    position: LOOKOUT_SIGN.position,
    promptLabel: "Talk to Nova — Aurora Lookout",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "snow-sums",
  },
  // ---- The Lodge Interior (CB) ----
  // Pip hosts FIRESIDE ADDITION by the hearth (the cabin and the island
  // never co-render, so sharing pip.glb is safe — same pattern as the snow
  // hosts). A plain maths encounter: no interception needed.
  {
    id: "cabin-pip",
    name: "Pip",
    encounterId: "cabin-addition",
    model: "npc",
    characterId: "pip",
    color: "#ffb36b",
    position: CABIN_PIP.position,
    promptLabel: "Talk to Pip — Fireside Addition",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: "cabin",
  },
  // A hidden treasure chest somewhere in the snowy valley (interaction.js).
  {
    id: "snow-chest",
    name: "Treasure Chest",
    encounterId: "snow-treasure",
    model: "chest",
    color: "#9fdcf2",
    position: SNOW_CHEST_POS,
    promptLabel: "Open the chest",
    collision: { type: "circle", radius: 0.8, enabled: true },
    interactionRadius: 3.4,
    regionId: "snow-sums",
  },
  {
    id: "snow-records",
    name: "Snow Trophies",
    encounterId: "snow-records",
    model: "none", // visual = trophy.glb stand + dynamic cups (SnowScenery)
    color: "#9fdcf2",
    position: SNOW_RECORDS_STAND.position,
    promptLabel: "Look at your trophies",
    collision: { type: "circle", radius: 2.0, enabled: true },
    interactionRadius: 5.0,
    regionId: "snow-sums",
  },
  // ---- Magma Multiples ----
  {
    id: MAGMA_WELCOME_HOST.id,
    name: "Mills",
    encounterId: "magma-welcome",
    model: "npc",
    characterId: "sage",
    color: "#ff7a3d",
    position: MAGMA_WELCOME_HOST.position,
    promptLabel: "Talk to Mills",
    collision: { type: "circle", radius: 0.7, enabled: true },
    interactionRadius: 3.6,
    regionId: MAGMA_REGION_ID,
  },
  ...MAGMA_HOSTS,
  {
    id: MAGMA_RECORDS_STAND.id,
    name: "Magma Trophies",
    encounterId: "magma-records",
    model: "none", // visual = trophy.glb stand + dynamic cups (MagmaScenery)
    color: "#ff9a4a",
    position: MAGMA_RECORDS_STAND.position,
    promptLabel: "Look at your trophies",
    collision: { type: "circle", radius: 2.0, enabled: true },
    interactionRadius: 5.0,
    regionId: MAGMA_REGION_ID,
  },
];

// Look up an interactable by id.
export function getInteractable(id) {
  return INTERACTABLES.find((i) => i.id === id) || null;
}

// Interactables that belong to a region (untagged ones default to island-1).
export function getInteractablesForRegion(regionId) {
  return INTERACTABLES.filter((i) => (i.regionId || "island-1") === regionId);
}
