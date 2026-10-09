/**
 * DATA-DRIVEN ENCOUNTERS
 *
 * An "encounter" is anything that can happen when the player interacts with
 * something in the world. Encounters are pure data here — the UI decides how
 * to render each `type`. This keeps content (what encounters exist) separate
 * from behaviour (how they run).
 *
 * Supported types (handled by src/ui/EncounterModal.jsx):
 *   - mathsChallenge   : a 5-question maths quiz from a topic engine
 *   - dialogue         : a few lines of conversation
 *   - treasure         : a one-time coin reward
 *   - gate             : a locked-area placeholder message
 *   - battlePlaceholder: stub for a future battle system
 *   - bossPlaceholder  : stub for a future boss system
 *
 * Common fields:
 *   id       unique string
 *   type     one of the types above
 *   title    shown in the modal header
 *   config   type-specific settings (see each entry)
 *   rewards  optional fixed { xp, coins } (maths rewards are dynamic instead)
 *   oneTime  if true, rewards are only ever granted once (e.g. treasure)
 *
 * To add a new encounter: add an entry here and (if it should appear in the
 * world) reference its id from an interactable in src/data/interactables.js.
 */
import { SCHOOLYARD_CHARACTERS } from "./schoolyard/schoolyardLayout.js";

export const ENCOUNTERS = {
  // --- The three NPC maths challenges -----------------------------------
  // These now draw from the curriculum registry (Stage 4) instead of a
  // hardcoded topic file. The config points at a stage + topic; the encounter
  // picks the difficulty per skill from the player's performance profile.
  "maths-integers": {
    id: "maths-integers",
    type: "mathsChallenge",
    title: "Integer Challenge",
    config: { stage: "stage4", topicId: "integers", questionCount: 5 },
  },
  "maths-fractions": {
    id: "maths-fractions",
    type: "mathsChallenge",
    title: "Fractions Challenge",
    config: { stage: "stage4", topicId: "fdp", questionCount: 5 },
  },
  "maths-algebra": {
    id: "maths-algebra",
    type: "mathsChallenge",
    title: "Algebra Challenge",
    config: { stage: "stage4", topicId: "algebra", questionCount: 5 },
  },

  // --- New, simple test encounters --------------------------------------
  "dialogue-sage": {
    id: "dialogue-sage",
    type: "dialogue",
    title: "Mills",
    rewards: { xp: 5, coins: 0 }, // a tiny reward for saying hello (first time)
    config: {
      speaker: "Mills",
      lines: [
        "Welcome to Number Island, young explorer!",
        "Pip, Fern and Alby each have a maths puzzle for you — Pip under Frosty Peak, Fern in the ash fields below Ember Peak, and Alby out at the lighthouse.",
        "Solve all three with a pass mark of 80% and the school gate on Schoolhouse Hill — the Retrieval Practice Playground — will swing open.",
        "Every other world has its own gate: the igloo in Igloo Hollow, the volcano arch on the Ember Terrace, the haybales out in Haybale Meadows and the mossy arch by the Emerald Lagoon.",
        "The signposts and the big map by the arch show the way. And that wall beside the arch is your Achievements Wall — press Enter in front of it to see everything you've won.",
        "Off you go — adventure awaits!",
      ],
    },
  },
  "treasure-cove": {
    id: "treasure-cove",
    type: "treasure",
    title: "Hidden Chest",
    oneTime: true,
    config: { coins: 50, message: "You found a chest full of coins!" },
  },
  "gate-north": {
    id: "gate-north",
    type: "gate",
    title: "North Gate",
    config: { message: "This area will unlock later." },
  },

  // --- Equation-editor demo (Phase 2B; testable from the DevPanel) -------
  // Uses the example math engine and forces the "math" input mode so the
  // encounter shows the MathAnswerInput equation editor. Not placed in the
  // world, so the three curriculum NPCs are unchanged.
  "demo-math-input": {
    id: "demo-math-input",
    type: "mathsChallenge",
    title: "Equation Input Demo",
    config: { topic: "math-examples", questionCount: 4, inputMode: "math" },
  },
  // A curriculum-based math encounter (Stage 5 Surds) for testing the full
  // curriculum + adaptive + math-input flow from the DevPanel.
  "demo-stage5-surds": {
    id: "demo-stage5-surds",
    type: "mathsChallenge",
    title: "Stage 5 · Surds",
    config: { stage: "stage5", topicId: "surds", questionCount: 4 },
  },

  // --- Active mission runner (Phase 2D) ---------------------------------
  // A topic-agnostic encounter that plays whatever mission is currently active,
  // drawing all of its questions from the mission's stage/topic/skill filters
  // and difficulty range. Launched from the Student Mission view's "Start
  // mission" button and from the DevPanel. If no mission is active it simply
  // has nothing to ask, so the Student view only offers it when one is active.
  "mission-active": {
    id: "mission-active",
    type: "mathsChallenge",
    title: "Mission",
    config: { useActiveMission: true },
  },

  // --- World progression (Phase 2G) -------------------------------------
  // The student-facing Mission Board (its own encounter type).
  "mission-board": {
    id: "mission-board",
    type: "missionBoard",
    title: "Mission Board",
    config: {},
  },
  // The student/teacher-facing Mission Builder (Phase 2J), opened from the board.
  "mission-builder": {
    id: "mission-builder",
    type: "missionBuilder",
    title: "Mission Builder",
    config: {},
  },
  // Trophy stand — opens the Trophy Room. Interacting is intercepted in App,
  // but the entry exists so the world badge/status shows correctly.
  "trophy-board": {
    id: "trophy-board",
    type: "trophyBoard",
    title: "Trophy Stand",
    config: {},
  },
  // Area marker in the Area Meadow zone — a curriculum Area challenge.
  "maths-area": {
    id: "maths-area",
    type: "mathsChallenge",
    title: "Area Challenge",
    config: { stage: "stage4", topicId: "area", questionCount: 4 },
  },
  // NPC quest-chain completion dialogues.
  "pip-complete": {
    id: "pip-complete", type: "dialogue", title: "Pip the Penguin",
    config: { speaker: "Pip", lines: [
      "You've finished all of my integer quests — amazing work!",
      "Come back any time to practise. The island is open to you!",
    ] },
  },
  "fern-complete": {
    id: "fern-complete", type: "dialogue", title: "Fern the Fox",
    config: { speaker: "Fern", lines: [
      "Fractions, decimals and percentages — you've mastered them all!",
      "Thank you for helping me. Explore the rest of the island!",
    ] },
  },
  "alby-complete": {
    id: "alby-complete", type: "dialogue", title: "Alby the Owl",
    config: { speaker: "Alby", lines: [
      "Every algebra challenge complete — you're a true techniques champion!",
      "The school gate on Schoolhouse Hill awaits. Well done, explorer!",
    ] },
  },

  // Champion's Grove claim (Phase 2I). Interacting is intercepted in App to also
  // latch championClaimed; this entry keeps the id valid for checks/fallback.
  "champion-claim": {
    id: "champion-claim", type: "dialogue", title: "Island Spirit",
    config: { speaker: "Island Spirit", lines: [
      "You opened every path on Number Island!",
      "You are the Island Champion. Wear it with pride!",
    ] },
  },

  // Schoolyard greeter (W2-E) — Mills welcomes the player on arrival.
  "schoolyard-welcome": {
    id: "schoolyard-welcome", type: "dialogue", title: "Mills",
    config: { speaker: "Mills", lines: [
      "Test your Stage 4 skills across a range of topics.",
    ] },
  },

  // Parts of a Whole Farm (F1–F2). The welcome sign is a plain dialogue; the
  // fence sign's encounter is a FALLBACK only (interaction.js intercepts it to
  // start the in-world Fence Challenge, like the trophy stand / chest).
  "farm-welcome": {
    id: "farm-welcome", type: "dialogue", title: "Fraction Farm",
    config: { speaker: "Mills", lines: [
      "G'day — welcome to Fraction Farm! 🚜",
      "Everything here is about fractions — of lengths, of herds, of crates, of prices.",
      "The farm's a big one: rolling hills, a creek, paddocks and sheds. Ten fraction challenges are hidden around it, and each one has its own trophy.",
      "Your job is to find all ten and collect their trophies! Every trophy is earned by how well you score:",
      "🥇 Gold for 100%, 🥈 Silver for 75%, and 🥉 Bronze for 50%.",
      "Play a challenge again any time to polish a bronze or silver up to gold.",
      "Lost? Check the big map board by the gate, and follow the signposts at every crossroads — the farm tracks lead to every challenge.",
      "Start at the Farm Gate Shop up at the homestead, then explore: the orchard, the carrot patch, the old sawmill, the dairy, the cattle run, the long paddock, the grain silos, the glasshouses and the market green.",
      "Your trophies go in the trophy cabinet right here. Off you go — let's fill it with gold!",
    ] },
  },
  // Fallback dialogue for the farm treasure chest (interaction.js intercepts the
  // "farm-chest" interactable to award coins, so this is only a safety net).
  "farm-treasure": {
    id: "farm-treasure", type: "dialogue", title: "Treasure Chest",
    config: { speaker: "Treasure Chest", lines: [
      "A hidden chest, tucked behind the hay bales! ✨",
    ] },
  },
  "farm-fence-challenge": {
    id: "farm-fence-challenge", type: "dialogue", title: "Fence Challenge",
    config: { speaker: "Fence Challenge", lines: [
      "Walk to a fraction of the way along the fence and place the marker!",
    ] },
  },
  "farm-roundup-challenge": {
    id: "farm-roundup-challenge", type: "dialogue", title: "The Round-Up",
    config: { speaker: "The Round-Up", lines: [
      "Herd the right number of cows into the Sorting Pen!",
    ] },
  },
  "farm-order-challenge": {
    id: "farm-order-challenge", type: "dialogue", title: "Order the Parts",
    config: { speaker: "Order the Parts", lines: [
      "Swap the carrots until they're in order, smallest to largest!",
    ] },
  },
  "farm-crate-challenge": {
    id: "farm-crate-challenge", type: "dialogue", title: "Crate Packing",
    config: { speaker: "Robot", lines: [
      "Pack both harvests into identical crates — biggest crate wins!",
    ] },
  },
  "farm-veggie-challenge": {
    id: "farm-veggie-challenge", type: "dialogue", title: "The Veggie Plot",
    config: { speaker: "Trevor", lines: [
      "Multiply two fractions by planting a bed — the shaded overlap is your answer. Then try my fertiliser potions: some grow a plant, some SHRINK it!",
    ] },
  },
  "farm-plank-challenge": {
    id: "farm-plank-challenge", type: "dialogue", title: "Plank the Gap",
    config: { speaker: "Woody", lines: [
      "Fill the gap in the fence EXACTLY — lay planks that add up. They all snap to the same twelfths grid, so a half and a third become 6/12 and 4/12. Later, work out what's left to fill!",
    ] },
  },
  "farm-shop-challenge": {
    id: "farm-shop-challenge", type: "dialogue", title: "The Farm Shop",
    config: { speaker: "Sunny", lines: [
      "Mind the stall for market day! Buy at cost, mark it up, take a rainy-day discount, add the 10% GST at the till — then tell me the profit as a percent of what we paid. Restocks too: if 12 melons are 30% of the crop, how many are on the truck?",
    ] },
  },
  "farm-milk-challenge": {
    id: "farm-milk-challenge", type: "dialogue", title: "The Milk Splitter",
    config: { speaker: "The Milkman", lines: [
      "Predict whether each share of milk STOPS or REPEATS — then write it properly!",
    ] },
  },
  "farm-weigh-challenge": {
    id: "farm-weigh-challenge", type: "dialogue", title: "The Weigh Station",
    config: { speaker: "The Weigh Master", lines: [
      "The sign can't fit every digit — round the reading to the closer end!",
    ] },
  },
  "farm-trade-challenge": {
    id: "farm-trade-challenge", type: "dialogue", title: "The Trading Post",
    config: { speaker: "Steve", lines: [
      "Three stalls, three languages — pay each one in the notation it speaks!",
    ] },
  },
  "farm-records": {
    id: "farm-records", type: "dialogue", title: "Farm Records",
    config: { speaker: "Farm Records", lines: [
      "Your best efforts at the farm challenges are recorded here.",
    ] },
  },

  // Snowball Sums (S1–S2). Mills welcomes arrivals; the trophy stand's
  // encounter is a FALLBACK only (interaction.js intercepts it to open the
  // snow trophy grid, like the farm stand).
  "snow-welcome": {
    id: "snow-welcome", type: "dialogue", title: "Snowball Sums",
    config: { speaker: "Mills", lines: [
      "Brrr — welcome to Snowball Sums! ❄️ This whole valley is yours to explore.",
      "Check the trail map by the arch, then follow the signposts — ten snow challenges are hiding out there, from the Ice Rink to the Aurora Lookout.",
      "Ride the CHAIRLIFT up Big Sled Hill, then step into a sled run and slide all the way down! 🛷",
      "The frozen pond and river are slippery — get a run-up and glide. But keep out of the glacier lake: that water's freezing! Cross on the bridges or hop the ice floes.",
      "Every challenge earns a trophy on the stand by the igloo gate — 🥇 for 100%, 🥈 for 75%, 🥉 for 50%.",
      "And keep your eyes peeled — there's a treasure chest hidden somewhere in the snow!",
    ] },
  },
  // Safety net only: the snow chest is handled in interaction.js.
  "snow-treasure": {
    id: "snow-treasure", type: "dialogue", title: "Treasure Chest",
    config: { speaker: "Treasure Chest", lines: ["Frozen shut… crack! A few icy coins! ❄️"] },
  },
  // The Snowball Range sign is INTERCEPTED in interaction.js (starts the
  // challenge) — this dialogue is a fallback only.
  "snow-range-challenge": {
    id: "snow-range-challenge", type: "dialogue", title: "The Snowball Range",
    config: { speaker: "Pip", lines: [
      "Fill the crate to TEN first — then throw the rest. That's the secret to every big sum!",
    ] },
  },
  // The Ice Rink sign is INTERCEPTED in interaction.js (starts the glide
  // challenge) — this dialogue is a fallback only.
  "snow-rink-challenge": {
    id: "snow-rink-challenge", type: "dialogue", title: "The Ice Rink",
    config: { speaker: "Fern", lines: [
      "The whole rink is one big number line — jump by TENS and you'll fly. Fewest pushes wins the fish!",
    ] },
  },
  // The Grove sign is INTERCEPTED in interaction.js (starts the lights
  // challenge) — this dialogue is a fallback only.
  "snow-pines-challenge": {
    id: "snow-pines-challenge", type: "dialogue", title: "Christmas Tree Grove",
    config: { speaker: "Alby", lines: [
      "Whooo counts lights one at a time? Grab a friendly bundle, hang the lot, then fix the difference!",
    ] },
  },
  // The Meadow sign is INTERCEPTED in interaction.js (starts the levelling
  // challenge) — this dialogue is a fallback only.
  "snow-snowmen-challenge": {
    id: "snow-snowmen-challenge", type: "dialogue", title: "Snowman Meadow",
    config: { speaker: "Frosty", lines: [
      "Make my snowmen level twins and the sum turns into a double you already know!",
    ] },
  },
  // The Slope sign is INTERCEPTED in interaction.js (starts the roped-sleds
  // challenge) — this dialogue is a fallback only.
  "snow-sled-challenge": {
    id: "snow-sled-challenge", type: "dialogue", title: "Sledding Slope",
    config: { speaker: "Flake", lines: [
      "See the rope between my sleds? It can't stretch — slide them TOGETHER and the gap never changes!",
    ] },
  },
  // The final five snow challenges — all signs INTERCEPTED in interaction.js;
  // these dialogues are fallbacks only.
  "snow-village-challenge": {
    id: "snow-village-challenge", type: "dialogue", title: "Igloo Village",
    config: { speaker: "Bloc", lines: [
      "Ten-blocks with ten-blocks, one-blocks with one-blocks — and if the ones pile passes ten, SNAP!",
    ] },
  },
  "snow-colony-challenge": {
    id: "snow-colony-challenge", type: "dialogue", title: "Penguin Colony",
    config: { speaker: "Pippin", lines: [
      "Every sum has a double hiding in it — watch my penguins pair up and it shows itself!",
    ] },
  },
  "snow-cave-challenge": {
    id: "snow-cave-challenge", type: "dialogue", title: "The Ice Cave",
    config: { speaker: "Glim", lines: [
      "Who says subtraction means taking away? Sometimes the quick way is counting UP. Fewest glows wins!",
    ] },
  },
  "snow-yard-challenge": {
    id: "snow-yard-challenge", type: "dialogue", title: "The Lodge Yard",
    config: { speaker: "Cocoa", lines: [
      "One hundred-token, one hot chocolate — count the change UP: hop to the ten, then hop to a hundred!",
    ] },
  },
  "snow-lights-challenge": {
    id: "snow-lights-challenge", type: "dialogue", title: "Aurora Lookout",
    config: { speaker: "Nova", lines: [
      "The aurora writes the sums — you choose the tool. Any sound tool works, but the brightest path shines fullest!",
    ] },
  },
  // The Lodge Interior (CB): Pip's fireside addition — a curriculum maths
  // encounter (Stage 3 addition & subtraction facts, adaptive difficulty).
  "cabin-addition": {
    id: "cabin-addition",
    type: "mathsChallenge",
    title: "Fireside Addition",
    config: { stage: "stage3", topicId: "number-facts", skillId: "addSubTo20", questionCount: 5 },
  },
  "snow-records": {
    id: "snow-records", type: "dialogue", title: "Snow Trophies",
    config: { speaker: "Snow Trophies", lines: [
      "Your best efforts at the snow-world challenges will be recorded here.",
    ] },
  },

  // ---- Magma Multiples (2026-10-03): ten multiplicative challenges. Each
  // host is INTERCEPTED in interaction.js (starts its challenge) — these
  // one-liners are fallbacks only. ----
  "magma-welcome": {
    id: "magma-welcome", type: "dialogue", title: "Magma Multiples",
    config: { speaker: "Mills", lines: [
      "Welcome to Magma Multiples! 🌋 Mind the lava — it only bounces you back, but it's HOT.",
      "This is where we think in MULTIPLES — groups, arrays, times as many, for each.",
      "Ten teachers are waiting round the ring road, each with a challenge. Start with Mr. Dawson at the Basalt Columns (east), then work your way round.",
      "The last one is at the very top — climb the spiral trail to Ms. Bacon at the Strategy Summit!",
      "Every challenge earns a trophy on the stand right here — 🥇 100%, 🥈 75%, 🥉 50%.",
    ] },
  },
  "magma-records": {
    id: "magma-records", type: "dialogue", title: "Magma Trophies",
    config: { speaker: "Magma Trophies", lines: ["Your best Magma Multiples scores are kept here."] },
  },
  "magma-columns-challenge": { id: "magma-columns-challenge", type: "dialogue", title: "Column Rectangles", config: { speaker: "Mr. Dawson", lines: ["Every number makes rectangles — some make lots, primes make just one!"] } },
  "magma-obsidian-challenge": { id: "magma-obsidian-challenge", type: "dialogue", title: "Crack the Crystal", config: { speaker: "Ms. Mahoney", lines: ["Too big to know? Crack it into pieces you DO know."] } },
  "magma-terraces-challenge": { id: "magma-terraces-challenge", type: "dialogue", title: "Tenfold Terraces", config: { speaker: "Ms. Ewings", lines: ["Times ten moves every digit up a terrace. The point never moves!"] } },
  "magma-geysers-challenge": { id: "magma-geysers-challenge", type: "dialogue", title: "Halve & Double", config: { speaker: "Mr. Heywood", lines: ["Half as many rows, twice as long — same tiles, same answer."] } },
  "magma-forge-challenge": { id: "magma-forge-challenge", type: "dialogue", title: "Factor Forge", config: { speaker: "Robot", lines: ["BEEP. Hammer it into factors. Fuse a friendly ten. BEEP."] } },
  "magma-garden-challenge": { id: "magma-garden-challenge", type: "dialogue", title: "Flower Combos", config: { speaker: "Trevor", lines: ["For EACH flower, a whole row of pots — that's how combos grow."] } },
  "magma-cinder-challenge": { id: "magma-cinder-challenge", type: "dialogue", title: "Cart Tables", config: { speaker: "Steve", lines: ["Double it, halve it, times ten — the table does the rest."] } },
  "magma-lake-challenge": { id: "magma-lake-challenge", type: "dialogue", title: "Lava Channels", config: { speaker: "Mr. Pearce", lines: ["Pour in big chunks — ten rows at a time if it fits!"] } },
  "magma-bones-challenge": { id: "magma-bones-challenge", type: "dialogue", title: "Grow the Dragon", config: { speaker: "Ms. Brookes", lines: ["Grown-ups are TIMES as long, not just a bit longer."] } },
  "magma-summit-challenge": { id: "magma-summit-challenge", type: "dialogue", title: "Strategy Summit", config: { speaker: "Ms. Bacon", lines: ["Look at the numbers first — then pick the easiest way."] } },

  // Schoolyard NPC completion dialogues are GENERATED from the character list
  // (W2-F) — see the loop just after ENCOUNTERS.

  // --- Placeholders for future systems (testable from the DevPanel) ------
  "battle-slime": {
    id: "battle-slime",
    type: "battlePlaceholder",
    title: "Wild Slime",
    config: { enemy: "Slime", message: "A battle would start here." },
  },
  "boss-numbus": {
    id: "boss-numbus",
    type: "bossPlaceholder",
    title: "Numbus, Guardian of the Vault",
    config: { boss: "Numbus", message: "A boss fight would start here." },
  },
};

// Generate each schoolyard character's completion dialogue from the layout list
// (W2-F). Interaction still goes through the chain/npcDialogue path; this keeps
// the encounterId valid and gives a warm, local sign-off.
for (const c of SCHOOLYARD_CHARACTERS) {
  ENCOUNTERS[`${c.id}-complete`] = {
    id: `${c.id}-complete`, type: "dialogue", title: c.name,
    config: { speaker: c.name, lines: c.complete },
  };
}

// Look up an encounter by id.
export function getEncounter(id) {
  return ENCOUNTERS[id] || null;
}

// All encounter ids (used by the DevPanel and system checks).
export function getAllEncounterIds() {
  return Object.keys(ENCOUNTERS);
}
