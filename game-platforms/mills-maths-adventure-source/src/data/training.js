/**
 * TRAINING + WORLD INTROS (2026-10-13) — the scripted coach steps of the
 * journey (data/journey.js). Pure data: ui/journey/TrainingCoach.jsx shows
 * the current step and game/journeyStore.js ticks it off when the student
 * actually DOES the thing (never a "next" button).
 *
 * Each step:
 *   id, icon, title
 *   key / touch   the instruction for a keyboard / a phone or iPad
 *   goal          { track, amount } — a counter in journeyStore's
 *                 `journeyTrack` must grow by `amount` from when the step
 *                 began (metres walked / run, radians looked, jumps, …)
 *   meter         how to show progress: "m" (metres), "x" (a count), "turn"
 *   where         optional — a waypoint the step sets if none is set
 *   done          the cheer when it's done ("Wow, that's fast!")
 *   prompt        how the big training prompt (ui/journey/TrainingPrompt)
 *                 draws it: the keys to show (keyboard) and the on-screen
 *                 control to point at (touch)
 *
 * Every string here is fixed text (no numbers), so it can be translated in
 * i18n/translations.js.
 */
import { SNOW_RECORDS_STAND } from "./snow/snowLayout.js";
import { MILLS_SPOT, ACHIEVEMENT_WALL } from "./island/islandLayout.js";

// Where you stand to read the Achievements Wall (5 m in front of its face).
const WALL_FRONT = [
  ACHIEVEMENT_WALL.position[0] + Math.sin(ACHIEVEMENT_WALL.rotationY) * 5,
  ACHIEVEMENT_WALL.position[1] + Math.cos(ACHIEVEMENT_WALL.rotationY) * 5,
];

export const TRAINING_STEPS = [
  {
    id: "walk", icon: "🚶", title: "Walk",
    key: "Walk with W A S D or the arrow keys.",
    touch: "Put your left thumb on the screen and push to walk.",
    goal: { track: "walked", amount: 8 }, meter: "m",
    done: "You can walk!", prompt: { keys: "move", touch: "joy" },
  },
  {
    id: "look", icon: "👀", title: "Look around",
    key: "Press Z or X to swing the camera round you.",
    touch: "Drag a finger across the right side of the screen to look around.",
    goal: { track: "looked", amount: 2.4 }, meter: "turn",
    done: "Great looking around!", prompt: { keys: "look", touch: "drag" },
  },
  {
    id: "run", icon: "🏃", title: "Run",
    key: "Hold Shift while you walk to run.",
    touch: "Push the joystick right out to its edge — the ring turns orange and you run.",
    goal: { track: "ran", amount: 14 }, meter: "m",
    done: "Wow, that's fast!", prompt: { keys: "run", touch: "joyRun" },
  },
  {
    id: "jump", icon: "🦘", title: "Jump",
    key: "Press Space to jump. Do three jumps!",
    touch: "Tap the yellow Jump button. Do three jumps!",
    goal: { track: "jumps", amount: 3 }, meter: "x",
    done: "Great jumping!", prompt: { keys: "jump", touch: "jump" },
  },
  {
    id: "fpv", icon: "👁️", title: "First-person view",
    key: "Press / to see through your explorer's eyes. Look around with all four arrow keys, then press / again to come back.",
    touch: "Tap the 👁️ button to see through your explorer's eyes. Drag left, right, up and down to look around, then tap 👁️ again to come back.",
    // Done = back out of first-person having looked all four ways
    // (journeyStore's fpvLook / fpvTours).
    goal: { track: "fpvTours", amount: 1 }, meter: "none",
    done: "You saw through your explorer's eyes!", prompt: { keys: "fpv", touch: "eye" },
  },
  {
    id: "mills", icon: "👋", title: "Meet Mills",
    key: "Walk up to Mills on the green and press Enter to talk to him.",
    touch: "Tap Mills to walk over and talk to him.",
    goal: { track: "millsTalks", amount: 1 }, meter: "none",
    where: { x: MILLS_SPOT.position[0], z: MILLS_SPOT.position[1] + 2, label: "Mills", icon: "👋", arrive: 3 },
    done: "You met Mills!", prompt: { keys: "talk", touch: "talk", near: "sage" },
  },
  {
    id: "wall", icon: "🏆", title: "The Achievements Wall",
    key: "Walk to the big wall beside the arch and press Enter to look at it.",
    touch: "Walk to the big wall beside the arch and tap “Look at the Achievements Wall”.",
    goal: { track: "wallCloses", amount: 1 }, meter: "none",
    where: { x: WALL_FRONT[0], z: WALL_FRONT[1], label: "Achievements Wall", icon: "🏆", arrive: 4 },
    done: "That's your Achievements Wall!", prompt: { keys: "wall", touch: "wall", near: "wall" },
  },
  {
    id: "map", icon: "🗺️", title: "Your map",
    key: "Press M (or the 🗺️ Map button) to open the map, then click Pip to set a waypoint.",
    touch: "Tap 🗺️ to open the map, then tap Pip to set a waypoint.",
    goal: { track: "waypoints", amount: 1 }, meter: "none",
    done: "Waypoint set — follow the arrow!", prompt: { keys: "map", touch: "map" },
  },
];

/**
 * The big training prompt's live words (ui/journey/TrainingPrompt.jsx):
 * a step can change what it asks for as you go (in first-person → "press /
 * again"; next to Mills → "press Enter now"). Fixed strings, so they translate.
 */
export const TRAINING_PROMPTS = {
  key: {
    fpvLook: "Look around with all four arrow keys!",
    fpvBack: "Now press / again to come back.",
    fpvAgain: "Press / to look again — try all four arrow keys.",
    talkNear: "Press Enter to talk to Mills!",
    wallNear: "Press Enter to look at the wall!",
    follow: "Follow the arrow.",
  },
  touch: {
    fpvLook: "Drag left, right, up and down to look around!",
    fpvBack: "Now tap 👁️ again to come back.",
    fpvAgain: "Tap 👁️ to look again — drag all four ways.",
    talkNear: "Tap Talk!",
    wallNear: "Tap the Achievements Wall button!",
    follow: "Follow the arrow.",
  },
  caps: {
    move: "Move", or: "or", turnLeft: "Turn left", turnRight: "Turn right", hold: "Hold",
    jump: "Jump", eyes: "Your eyes", talk: "Talk", look: "Look", map: "Map",
    push: "Push", pushEdge: "Push to the edge", drag: "Drag here",
  },
  stuck: "Stuck? Skip this step",
  training: "Training",
  next: "Next:",
};

/** What the coach says while the student is LOOKING at the wall (training). */
export const WALL_TRAINING_TIPS = [
  "Each board is one world. The trophies, keys and badges you win appear here.",
  "A padlock means that world isn't open yet — the board tells you what opens it.",
];

/**
 * First visit to a world. Snowball Sums (the first world) gets the full tour;
 * the others get one welcome card. Every intro starts with that card
 * (`card`), whose buttons start the tour or close it.
 */
export const WORLD_INTROS = {
  "snow-sums": [
    {
      id: "hello", card: true, icon: "❄️", title: "Welcome to Snowball Sums!",
      lines: [
        "This valley has ten addition and subtraction challenges. Each one wins a trophy.",
        "Win seven trophies — bronze or better — and the volcano arch to Magma Multiples opens on Number Island.",
      ],
      go: "Show me around", skip: "I'll explore",
    },
    {
      id: "trophies", icon: "🏆", title: "Your trophy stand",
      key: "Follow the arrow to the trophy stand and press Enter to open it.",
      touch: "Follow the arrow to the trophy stand and tap it to open it.",
      goal: { track: "trophyCloses", amount: 1 }, meter: "none",
      where: { x: SNOW_RECORDS_STAND.position[0], z: SNOW_RECORDS_STAND.position[1], label: "Trophy stand", icon: "🏆", arrive: 3.2 },
    },
    {
      id: "map", icon: "🗺️", title: "Find a challenge",
      key: "Press M to open the map. Each numbered pin is a challenge — click number 1 to set a waypoint.",
      touch: "Tap 🗺️ to open the map. Each numbered pin is a challenge — tap number 1 to set a waypoint.",
      goal: { track: "waypoints", amount: 1 }, meter: "none",
    },
    {
      id: "go", icon: "⛸️", title: "Your first challenge",
      key: "Follow the arrow, then press Enter by the challenge's sign to play.",
      touch: "Follow the arrow, then tap the challenge's sign to play.",
      goal: { track: "challengeStarts", amount: 1 }, meter: "none",
    },
  ],
  "magma-multiples": [
    {
      id: "hello", card: true, icon: "🌋", title: "Welcome to Magma Multiples!",
      lines: [
        "Ten multiplication and division challenges wait round the volcano. Each one wins a trophy.",
        "Win seven trophies — bronze or better — to open the haybale gate to Fraction Farm.",
        "Your trophy stand and the map board are right here by the arrival.",
      ],
      go: "Let's go!",
    },
  ],
  "farm-parts-whole": [
    {
      id: "hello", card: true, icon: "🌾", title: "Welcome to Fraction Farm!",
      lines: [
        "Ten fraction, decimal and percentage challenges are hidden round the farm. Each one wins a trophy.",
        "Win seven trophies — bronze or better — to open the mossy arch to the Emerald Jungle.",
        "Your trophy cabinet and the map board are right here by the gate.",
      ],
      go: "Let's go!",
    },
  ],
  "emerald-jungle": [
    {
      id: "hello", card: true, icon: "🌿", title: "Welcome to the Emerald Jungle!",
      lines: [
        "Ten proportional-reasoning challenges hide in the jungle clearings. Each one wins a trophy.",
        "Win seven trophies — bronze or better — to open the school gate to the Retrieval Practice Playground.",
        "Your trophy stand and the map board are right here in the glade.",
      ],
      go: "Let's go!",
    },
  ],
  schoolyard: [
    {
      id: "hello", card: true, icon: "🏫", title: "Welcome to the Playground!",
      lines: [
        "Eight teachers are somewhere round the school, and each one holds a key.",
        "Collect all eight keys to open the School Hall — the Head Teacher is waiting inside.",
        "The campus map by the plaza shows where everyone is.",
      ],
      go: "Let's go!",
    },
  ],
};

export function introFor(regionId) {
  return WORLD_INTROS[regionId] || null;
}
