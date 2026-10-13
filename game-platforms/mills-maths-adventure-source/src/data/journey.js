/**
 * THE JOURNEY (2026-10-13) — the game's PROGRESSION: the worlds open one at a
 * time, in order of difficulty, instead of the whole map being open at once.
 *
 *   1. TRAINING on Harbour Green (first visit): look, walk, run, jump, the
 *      first-person view, Mills, the Achievements Wall and the map.
 *      (data/training.js — the steps; ui/journey/TrainingCoach.jsx — the card.)
 *   2. THE ISLAND FRIENDS: pass Pip's, Fern's and Alby's warm-ups (any order)
 *      → the IGLOO GATE opens (Snowball Sums).
 *   3. Then each world opens the next once it holds 7 of its 10 trophies at
 *      🥉 bronze or better (Jeff, 2026-10-13):
 *        ❄️ Snowball Sums → 🌋 Magma Multiples → 🌾 Fraction Farm →
 *        🌿 Emerald Jungle → 🏫 the Retrieval Practice Playground.
 *      (The Lodge Interior is inside Snowball Sums, so it opens with it.)
 *   4. KEEP WHAT THEY'VE REACHED (Jeff's call for existing saves): any world
 *      the student has already scored in — a best above 0, or a Playground
 *      key — stays open, and so does every world before it on the path.
 *      No teacher override (Jeff's call): a teacher task in a locked world
 *      waits until the student opens it.
 *
 * PURE except `journeyCounts()`, which reads the local trophy bests through
 * each world's records module (those live in localStorage, like before).
 * Everything else takes a plain snapshot, so the headless checks can drive it.
 */
import { snowTrophyRows } from "./snow/snowRecords.js";
import { magmaTrophyRows } from "./magma/magmaRecords.js";
import { farmTrophyRows } from "./farm/farmRecords.js";
import { jungleTrophyRows } from "./jungle/jungleRecords.js";
import { SCHOOLYARD_CHARACTERS } from "./schoolyard/schoolyardLayout.js";
import { getChain } from "./npcQuestChains.js";

/** Trophies (bronze or better) a world needs before the NEXT world opens. */
export const TROPHIES_TO_OPEN = 7;

/** The island friends whose warm-ups open the igloo gate. Any order. */
export const JOURNEY_FRIENDS = [
  { id: "pip", name: "Pip", icon: "🐧", topic: "Adding & subtracting", where: "Pip's Number Line, under Frosty Peak" },
  { id: "fern", name: "Fern", icon: "🦊", topic: "Times tables", where: "Fern's Ash Fields, under Ember Peak" },
  { id: "alby", name: "Alby", icon: "🦉", topic: "Division facts", where: "Alby's Lighthouse, over the rope bridge" },
];
export const FRIEND_IDS = JOURNEY_FRIENDS.map((f) => f.id);

/**
 * The worlds in the order they open. `portalId` = the Number Island gate,
 * `gate` / `where` = how Mills and the cards describe it.
 */
export const JOURNEY_WORLDS = [
  {
    key: "snow", regionId: "snow-sums", portalId: "island-to-snow", name: "Snowball Sums", icon: "❄️", tag: "Snow", 
    gate: "the igloo gate", where: "Igloo Hollow, under Frosty Peak", topic: "Addition and subtraction strategies",
    trophies: true, color: "#2f95d0",
  },
  {
    key: "magma", regionId: "magma-multiples", portalId: "island-to-magma", name: "Magma Multiples", icon: "🌋", tag: "Volcano", 
    gate: "the volcano arch", where: "the Ember Terrace, under Ember Peak", topic: "Multiplicative thinking",
    trophies: true, color: "#d9442a",
  },
  {
    key: "farm", regionId: "farm-parts-whole", portalId: "island-to-farm", name: "Fraction Farm", icon: "🌾", tag: "Farm", 
    gate: "the haybale gate", where: "Haybale Meadows, on the west coast", topic: "Fractions, decimals and percentages",
    trophies: true, color: "#e2a018",
  },
  {
    key: "jungle", regionId: "emerald-jungle", portalId: "island-to-jungle", name: "Emerald Jungle", icon: "🌿", tag: "Jungle", 
    gate: "the mossy arch", where: "the ledge above the Emerald Lagoon", topic: "Proportional reasoning",
    trophies: true, color: "#1f9a4c",
  },
  {
    key: "playground", regionId: "schoolyard", portalId: "island-to-schoolyard", name: "Retrieval Practice Playground",
    short: "the Playground", tag: "School", icon: "🏫", gate: "the school gate", where: "the top of Schoolhouse Hill",
    topic: "Stage 4 retrieval practice", trophies: false, color: "#d9822b",
  },
];

/** Region ids that belong to a journey world (the Lodge sits inside the snow). */
export const REGION_WORLD = {
  "snow-sums": "snow", cabin: "snow", "magma-multiples": "magma", "farm-parts-whole": "farm",
  "emerald-jungle": "jungle", schoolyard: "playground",
};

export function journeyWorld(keyOrRegion) {
  return JOURNEY_WORLDS.find((w) => w.key === keyOrRegion || w.regionId === keyOrRegion) || null;
}
export function worldForPortal(portalId) {
  return JOURNEY_WORLDS.find((w) => w.portalId === portalId) || null;
}

// ---------------------------------------------------------------------------
// Reading the saves
// ---------------------------------------------------------------------------

const ROWS = { snow: snowTrophyRows, magma: magmaTrophyRows, farm: farmTrophyRows, jungle: jungleTrophyRows };

/** Trophy tallies for the four trophy worlds (reads the local bests). */
export function journeyCounts() {
  const out = {};
  for (const [key, rowsFn] of Object.entries(ROWS)) {
    let rows = [];
    try { rows = rowsFn() || []; } catch { rows = []; }
    out[key] = {
      medals: rows.filter((r) => r.medal).length,
      played: rows.filter((r) => (r.best || 0) > 0).length,
      total: rows.length || 10,
    };
  }
  return out;
}

/** Has this island friend been passed? Their warm-up — or a teacher task set on them. */
export function friendDone(id, completedMissions = []) {
  const cm = completedMissions instanceof Set ? completedMissions : new Set(completedMissions);
  if (cm.has(`warmup-${id}`)) return true;
  let chain = null;
  try { chain = getChain(id); } catch { chain = null; }
  return Boolean(chain && chain.steps.some((s) => cm.has(s.missionId)));
}

const STAFF = SCHOOLYARD_CHARACTERS.filter((c) => !c.boss);
const BOSS = SCHOOLYARD_CHARACTERS.find((c) => c.boss) || null;

export function playgroundKeys(completedMissions = []) {
  const cm = completedMissions instanceof Set ? completedMissions : new Set(completedMissions);
  return STAFF.filter((c) => cm.has(`warmup-${c.id}`)).length;
}
export function playgroundBossDone(completedMissions = []) {
  const cm = completedMissions instanceof Set ? completedMissions : new Set(completedMissions);
  return Boolean(BOSS && cm.has(`warmup-${BOSS.id}`));
}

/** The default persisted journey flags (progress store `journey`). */
export const DEFAULT_JOURNEY = {
  step: 0, // the current training step (index into TRAINING_STEPS)
  trainingStarted: false, // the welcome card's "Start training" was pressed
  trainingDone: false,
  trainingSkipped: false,
  offerSeen: false, // a returning player has been offered the training
  intros: [], // region ids whose first-visit intro has finished
  introStep: {}, // { regionId: step index } — a world intro in progress
  celebrated: [], // world keys whose gate-opening has been celebrated
  seeded: false, // first run: the gates already open were marked celebrated
  guideTo: null, // a world key to set a waypoint to on the next island arrival
};

/** Build the snapshot journeyState() reads, from the progress store's state. */
export function journeySnapshot(progress = {}, counts = journeyCounts(), visited = {}) {
  return {
    completedMissions: progress.completedMissions || [],
    journey: { ...DEFAULT_JOURNEY, ...(progress.journey || {}) },
    counts,
    visited,
  };
}

// ---------------------------------------------------------------------------
// The derived state
// ---------------------------------------------------------------------------

/**
 * Everything the game needs to know about the journey right now. Pure.
 *
 *   friends        [{ ...friend, done }] + friendsDone
 *   worlds         [{ ...world, open, earned, kept, requirement, medals, … }]
 *   trainingActive the Harbour Green training is still running
 *   goal           the ONE next thing to do: { kind, text, icon, have, need,
 *                  worldKey?, friendId?, targetRegion?, targetId? }
 */
export function journeyState(snap = {}) {
  const cm = new Set(snap.completedMissions || []);
  const j = { ...DEFAULT_JOURNEY, ...(snap.journey || {}) };
  const counts = snap.counts || {};
  const visited = snap.visited || {};

  const friends = JOURNEY_FRIENDS.map((f) => ({ ...f, done: friendDone(f.id, cm) }));
  const friendsDone = friends.filter((f) => f.done).length;
  const keys = playgroundKeys(cm);
  const bossDone = playgroundBossDone(cm);

  const c = (k) => counts[k] || { medals: 0, played: 0, total: 10 };
  // KEEP WHAT THEY'VE REACHED: the furthest world on the path with any score.
  const reached = JOURNEY_WORLDS.map((w) => (w.trophies ? c(w.key).played > 0 : keys > 0 || bossDone));
  let frontier = -1;
  reached.forEach((r, i) => { if (r) frontier = i; });

  const worlds = JOURNEY_WORLDS.map((w, i) => {
    const prev = i > 0 ? JOURNEY_WORLDS[i - 1] : null;
    const requirement = prev
      ? { kind: "trophies", from: prev.key, fromName: prev.name, fromIcon: prev.icon, have: Math.min(TROPHIES_TO_OPEN, c(prev.key).medals), need: TROPHIES_TO_OPEN }
      : { kind: "friends", have: friendsDone, need: JOURNEY_FRIENDS.length };
    const earned = requirement.have >= requirement.need;
    const kept = i <= frontier;
    const cc = c(w.key);
    return {
      ...w, index: i, requirement, earned, kept, open: earned || kept,
      medals: w.trophies ? cc.medals : keys,
      total: w.trophies ? cc.total : STAFF.length,
      played: w.trophies ? cc.played : keys,
      // This world's own job is done once it has opened the next one.
      complete: w.trophies ? cc.medals >= TROPHIES_TO_OPEN : bossDone,
      visited: Boolean(visited[w.regionId]) || reached[i],
    };
  });

  const trainingActive = !j.trainingDone && !j.trainingSkipped;
  const allOpen = worlds.every((w) => w.open);

  // ---- The ONE next goal ---------------------------------------------------
  let goal;
  const lastOpen = [...worlds].reverse().find((w) => w.open) || null;
  if (!worlds[0].open) {
    const next = friends.find((f) => !f.done);
    goal = {
      kind: "friends", icon: "🏝️", have: friendsDone, need: friends.length,
      friendId: next ? next.id : null, targetRegion: "island-1", targetId: next ? next.id : null,
      worldKey: "snow",
      title: "Island warm-ups",
      text: next ? `Find ${next.name} — ${next.where}.` : "Pass all three warm-ups.",
      reward: `Pass all three to open ${JOURNEY_WORLDS[0].icon} ${JOURNEY_WORLDS[0].name}`,
    };
  } else if (lastOpen && !lastOpen.visited) {
    goal = {
      kind: "travel", icon: lastOpen.icon, worldKey: lastOpen.key, targetRegion: "island-1", targetId: lastOpen.portalId,
      title: `${lastOpen.name} is open!`,
      text: `Go through ${lastOpen.gate} — ${lastOpen.where}.`,
      have: 0, need: 0,
    };
  } else if (lastOpen && lastOpen.trophies && !lastOpen.complete) {
    const next = worlds[lastOpen.index + 1];
    goal = {
      kind: "trophies", icon: lastOpen.icon, worldKey: lastOpen.key, targetRegion: lastOpen.regionId,
      have: Math.min(lastOpen.medals, TROPHIES_TO_OPEN), need: TROPHIES_TO_OPEN,
      title: `${lastOpen.name} trophies`,
      text: next ? `Win ${TROPHIES_TO_OPEN} trophies (🥉 or better) to open ${next.icon} ${next.short || next.name}.` : "Collect the trophies.",
      reward: next ? `Opens ${next.icon} ${next.short || next.name}` : "",
      nextKey: next ? next.key : null,
    };
  } else if (lastOpen && !lastOpen.trophies && !lastOpen.complete) {
    goal = {
      kind: "keys", icon: lastOpen.icon, worldKey: lastOpen.key, targetRegion: lastOpen.regionId,
      have: keys, need: STAFF.length,
      title: "Playground keys",
      text: keys >= STAFF.length ? "All 8 keys! The Head Teacher is waiting in the School Hall." : `Find the teachers — each holds a key. Collect all ${STAFF.length} to face the Head Teacher.`,
      reward: "The Head Teacher's Cup",
    };
  } else {
    goal = {
      kind: "free", icon: "🏆", have: 0, need: 0,
      title: allOpen ? "Every world is open!" : "Keep exploring",
      text: allOpen ? "Go back and turn your trophies into gold." : "Keep exploring the open worlds.",
    };
  }

  return {
    friends, friendsDone, friendsNeed: friends.length,
    worlds, allOpen, keys, totalKeys: STAFF.length, bossDone,
    trainingActive, trainingDone: j.trainingDone, trainingSkipped: j.trainingSkipped,
    goal,
  };
}

/** Is a Number Island gate locked right now? → null when open, else the lock. */
export function portalLock(js, portalId) {
  const w = worldForPortal(portalId);
  if (!w || !js) return null;
  const ws = js.worlds.find((x) => x.key === w.key);
  if (!ws || ws.open) return null;
  const r = ws.requirement;
  if (r.kind === "friends") {
    return {
      worldKey: w.key, have: r.have, need: r.need,
      text: `Pass Pip's, Fern's and Alby's warm-ups to open ${w.name} (${r.have}/${r.need})`,
      note: `${r.have} / ${r.need} island warm-ups`,
    };
  }
  return {
    worldKey: w.key, have: r.have, need: r.need,
    text: `Win ${r.need} ${r.fromName} trophies (🥉 or better) to open ${w.short || w.name} (${r.have}/${r.need})`,
    note: `${r.have} / ${r.need} ${r.fromIcon} trophies`,
  };
}

/** A signature of everything that changes what the journey shows (for cheap change checks). */
export function journeySignature(js) {
  if (!js) return "";
  return [
    js.friends.map((f) => (f.done ? 1 : 0)).join(""),
    js.worlds.map((w) => `${w.open ? 1 : 0}${w.medals}${w.visited ? "v" : ""}`).join("."),
    js.trainingActive ? "T" : "t", js.bossDone ? "B" : "b", js.goal.kind, js.goal.have,
  ].join("|");
}

/** Worlds open now that haven't been celebrated yet (in path order). */
export function uncelebrated(js, celebrated = []) {
  if (!js) return [];
  return js.worlds.filter((w) => w.open && !celebrated.includes(w.key)).map((w) => w.key);
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

/** Mills on Harbour Green — what he says depends on where the student is up to. */
export function millsJourneyLines(js, name = "") {
  const hi = name ? `Welcome, ${name}!` : "Welcome, explorer!";
  if (!js) return [hi];
  const snow = JOURNEY_WORLDS[0];
  if (!js.worlds[0].open) {
    const left = js.friends.filter((f) => !f.done);
    const lines = js.friendsDone === 0
      ? [
          `${hi} I'm Mills, and this is Number Island.`,
          "Five maths worlds are waiting for you — and each gate opens in turn, from the easiest world to the hardest.",
          "First, my three friends each have a quick warm-up: Pip is under Frosty Peak, Fern is in the ash fields below Ember Peak, and Alby is out at the lighthouse.",
          `Pass all three and the igloo gate to ${snow.icon} ${snow.name} will open!`,
        ]
      : [
          `Great going — that's ${js.friendsDone} of 3 warm-ups done!`,
          `Still to find: ${left.map((f) => `${f.name} (${f.where})`).join(" and ")}.`,
          `Pass ${left.length === 1 ? "that one" : "them"} and the igloo gate to ${snow.icon} ${snow.name} opens.`,
        ];
    lines.push("Stuck? Open the map (M, or the 🗺️ button) and click a friend to set a waypoint.");
    return lines;
  }
  const g = js.goal;
  if (g.kind === "travel") {
    const w = journeyWorld(g.worldKey);
    return [
      `${w.icon} ${w.name} is open — well done!`,
      `Head for ${w.gate}: it's at ${w.where}. The map (M) will point the way.`,
      `Every world has ten challenges. Win ${TROPHIES_TO_OPEN} trophies there — 🥉 bronze or better — and the next gate opens.`,
    ];
  }
  if (g.kind === "trophies") {
    const w = journeyWorld(g.worldKey);
    const next = journeyWorld(g.nextKey);
    return [
      `You're working through ${w.icon} ${w.name} — ${g.have} of ${g.need} trophies so far.`,
      next ? `Win ${g.need - g.have} more (🥉 bronze or better) and ${next.gate} to ${next.icon} ${next.short || next.name} opens.` : "Keep collecting!",
      "A bronze is 50% of a challenge's best score, silver 75% and gold 100%. You can replay any challenge to improve.",
      "The Achievements Wall beside the arch shows every world's trophies.",
    ];
  }
  if (g.kind === "keys") {
    return [
      "The Retrieval Practice Playground is open — through the school gate on Schoolhouse Hill.",
      `Eight teachers each hold a key. You have ${js.keys} of ${js.totalKeys}.`,
      "Collect all eight and the School Hall opens — the Head Teacher is waiting!",
    ];
  }
  return [
    "Every world on Number Island is open — you've done the whole journey!",
    "Now go back and turn those bronzes and silvers into gold. 🥇",
  ];
}
