/**
 * TEMPLE OF TRUTH (Temple Ruins, host Robot) — pure logic: PROPORTIONAL OR
 * NOT? Not every "if this, then that" situation is proportional (Lamon; Van
 * Dooren et al.; Cramer, Post & Currier; De Bock et al.'s "illusion of
 * linearity"). Using the ladder where it doesn't belong gives wrong answers.
 * This is the ONE jungle challenge where non-proportional situations appear
 * (Jeff, 2026-10-10: no trick rounds anywhere else) — and here they are the
 * announced topic, never a trick.
 *
 * Each carved tablet shows a jungle situation and three pairs of values.
 *   1  CALL IT: "The ladder works" (proportional) or "The ladder breaks".
 *      A wrong call ends the round.
 *   2a it works → hang the pairs, then FINISH the tablet: build to the
 *      missing value (any route).
 *   2b it breaks → hang the pairs (they won't hang straight — a crooked rung,
 *      or a zero that won't tie) and say WHY:
 *        starts with a fee · same difference · stays the same ·
 *        grows faster and faster · one goes up, the other goes down
 *      (a wrong reason is a slip; the tablet shows the right one)
 * Metric only — so no °C / °F tablet (°F is imperial).
 *
 * A SET is 15 rounds, 3 per stage:
 *   S1  one obvious each way (proportional · stays the same / grows faster)
 *   S2  starts with a fee
 *   S3  same difference
 *   S4  stays the same / grows faster · one up, one down · one that works
 *   S5  mixed — all of them
 * Every stage has at least one proportional tablet and one that breaks, in
 * a shuffled order (the set's very first tablet always works).
 */
import { buildSet, pick, randInt, shuffle } from "../magma/magmaMath.js";
import { rungFor, fmtVal, vineChip } from "./vineLadder.js";
import { planRound, solveLines } from "./roundKit.js";
import {
  PLANKS, MET1, MIN, KM1, SEC, LIT, STEPS, CRACKERS, PARROTS, DOLLARS, SQM, MET, num, count, ALL_MOVES,
} from "./jungleUnits.js";

export const REASONS = {
  fee: { label: "Starts with a fee", icon: "🎟️", why: "There's a cost before you even start — 0 doesn't match 0, so the vines can't tie at zero." },
  same: { label: "Same difference", icon: "➕", why: "Both grow by the SAME amount — adding, not multiplying." },
  stays: { label: "Stays the same", icon: "⏸️", why: "One number changes but the other stays the same." },
  faster: { label: "Grows faster and faster", icon: "📈", why: "Each step adds MORE than the last — the jumps keep growing." },
  down: { label: "One up, one down", icon: "🔃", why: "As one goes up, the other goes DOWN." },
};
export const REASON_KEYS = Object.keys(REASONS);

const BANANAS = count("🍌", "banana", "bananas");
const EGGS = count("🥚", "egg", "eggs");
const BIRDS = count("🐦", "bird", "birds");
const TOWELS = count("🧺", "towel", "towels");
const BUILDERS = count("👷", "builder", "builders");
const MONKEYS = count("🐒", "monkey", "monkeys");
const MANGOES = count("🥭", "mango", "mangoes");
const HOURS = num("h", 0, "hour", "hours", "⏱");
const RIDES = count("🎢", "ride", "rides");
const YEARS = num("yrs", 0, "year", "years", "🎂");
const DAYS = num("days", 0, "day", "days", "📅");
const CMV = num("cm", 0, "centimetre", "centimetres", "🌱");

// ---------------------------------------------------------------------------
// Tablets. Each maker → { type, top, bottom, text, pairs, missing? }.
// ---------------------------------------------------------------------------
const PROP = [
  (rand) => { const k = pick([[4, 30], [5, 40], [2, 15], [6, 45]], rand); return { top: PLANKS, bottom: MET1, text: `Rope bridge: every ${k[0]} planks cover ${fmtVal(MET1, k[1])}.`, base: k, ks: [1, 2, 3], ask: "planks" }; },
  (rand) => { const k = pick([[6, 450], [4, 300], [3, 240], [5, 350]], rand); return { top: BANANAS, bottom: DOLLARS, text: `A bunch of ${k[0]} bananas costs ${fmtVal(DOLLARS, k[1])}.`, base: k, ks: [1, 2, 4] }; },
  (rand) => { const k = pick([[30, 20], [45, 30], [20, 15], [15, 10]], rand); return { top: MIN, bottom: KM1, text: `A steady walk: ${fmtVal(KM1, k[1])} every ${k[0]} min.`, base: k, ks: [1, 2, 3] }; },
  (rand) => { const k = pick([[10, 6], [5, 4], [20, 15], [8, 5]], rand); return { top: SEC, bottom: LIT, text: `The tap fills ${k[1]} L every ${k[0]} s.`, base: k, ks: [1, 3, 4] }; },
  (rand) => { const k = pick([[12, 30], [8, 20], [10, 25], [16, 40]], rand); return { top: STEPS, bottom: MET1, text: `The temple stairs: every ${k[0]} steps climb ${fmtVal(MET1, k[1])}.`, base: k, ks: [1, 2, 3] }; },
  (rand) => { const k = pick([[2, 5], [3, 8], [4, 7], [2, 3]], rand); return { top: PARROTS, bottom: CRACKERS, text: `Every ${k[0]} parrots eat ${k[1]} crackers.`, base: k, ks: [1, 3, 5] }; },
];
const BREAKS = {
  fee: [
    (rand) => { const f = pick([10, 8, 6], rand), p = pick([5, 4, 3], rand); return { top: HOURS, bottom: DOLLARS, text: `Canoe hire: $${f} to start, then $${p} an hour.`, pairs: [1, 2, 4].map((h) => [h, (f + p * h) * 100]) }; },
    (rand) => { const f = pick([4, 5, 6], rand), p = pick([2, 3], rand); return { top: RIDES, bottom: DOLLARS, text: `Zip line: $${f} to get in, then $${p} a ride.`, pairs: [1, 3, 5].map((n) => [n, (f + p * n) * 100]) }; },
    (rand) => { const f = pick([3, 5], rand), p = pick([2, 4], rand); return { top: num("km", 0, "kilometre", "kilometres", "🛶"), bottom: DOLLARS, text: `River boat: $${f} to board, then $${p} for every km.`, pairs: [2, 3, 6].map((n) => [n, (f + p * n) * 100]) }; },
  ],
  same: [
    (rand) => { const g = pick([3, 4, 2], rand), s = pick([9, 8, 10], rand); return { top: YEARS, bottom: YEARS, labels: ["sister", "Sam"], text: `Sam is ${g} years older than his sister.`, pairs: [s, s + 3, s + 9].map((a) => [a, a + g]) }; },
    (rand) => { const g = pick([4, 3, 5], rand), f = pick([2, 3], rand); return { top: MET, bottom: MET, labels: ["fern", "palm"], text: `The palm is ${g} m taller than the fern, and both grow 1 m a year.`, pairs: [f, f + 3, f + 6].map((a) => [a, a + g]) }; },
    (rand) => { const g = pick([5, 6], rand); return { top: count("🐵", "monkey", "monkeys"), bottom: count("🐒", "monkey", "monkeys"), labels: ["Rua's tree", "Zaza's tree"], text: `Zaza's tree always has ${g} more monkeys than Rua's.`, pairs: [2, 4, 10].map((a) => [a, a + g]) }; },
  ],
  stays: [
    () => ({ top: EGGS, bottom: MIN, text: "Boiling eggs: one egg takes 6 minutes in the pot.", pairs: [[1, 6], [3, 6], [5, 6]] }),
    () => ({ top: BIRDS, bottom: MIN, text: "One bird sings its song in 3 minutes. Birds sing together.", pairs: [[1, 3], [4, 3], [6, 3]] }),
    () => ({ top: TOWELS, bottom: HOURS, text: "One towel dries in the sun in 2 hours. Towels hang side by side.", pairs: [[1, 2], [5, 2], [8, 2]] }),
  ],
  faster: [
    () => ({ top: MET, bottom: SQM, labels: ["side", "area"], text: "Square garden beds: the side and the area.", pairs: [[1, 1], [2, 4], [3, 9]] }),
    () => ({ top: DAYS, bottom: CMV, text: "A magic vine DOUBLES its length every day.", pairs: [[1, 2], [2, 4], [3, 8]] }),
    () => ({ top: MET, bottom: SQM, labels: ["side", "area"], text: "Square rafts: the side and the area.", pairs: [[2, 4], [4, 16], [5, 25]] }),
  ],
  down: [
    () => ({ top: BUILDERS, bottom: DAYS, text: "Building the treehouse: more builders, fewer days.", pairs: [[2, 6], [3, 4], [6, 2]] }),
    () => ({ top: MONKEYS, bottom: MANGOES, text: "24 mangoes shared equally between the monkeys.", pairs: [[2, 12], [3, 8], [6, 4]] }),
    () => ({ top: count("🛶", "paddler", "paddlers"), bottom: MIN, text: "Paddlers share the work of rowing the big raft across.", pairs: [[2, 12], [4, 6], [3, 8]] }),
  ],
};

// Which tablets each stage draws from: "prop" or a break reason.
// Each stage's three tablets: at least one that WORKS and one that BREAKS,
// in a shuffled order (so "the middle one always works" is never a pattern).
// The very first tablet of a set works — the intro is a ladder that hangs.
const STAGE_MIX = [
  ["prop", (r) => pick(["stays", "faster"], r), (r) => (r() < 0.5 ? "prop" : pick(["stays", "faster"], r))],
  ["fee", "prop", "fee"],
  ["same", "prop", "same"],
  [(r) => pick(["stays", "faster"], r), "down", "prop"],
  [(r) => pick(["fee", "same"], r), "prop", (r) => pick(["stays", "faster", "down"], r)],
];

function planTypes(rand) {
  const out = [];
  STAGE_MIX.forEach((slots, st) => {
    const trio = slots.map((slot) => (typeof slot === "function" ? slot(rand) : slot));
    const order = st === 0 ? [trio[0], ...shuffle(trio.slice(1), rand)] : shuffle(trio, rand);
    out.push(...order);
  });
  return out;
}

function makeTablet(type, rand) {
  for (let t = 0; t < 80; t++) {
    const r = type === "prop" ? propTablet(rand) : breakTablet(type, rand);
    if (r) return r;
  }
  return propTablet(rand);
}

function makeRound(i, stage, rand) {
  const slot = STAGE_MIX[stage][i % 3];
  return makeTablet(typeof slot === "function" ? slot(rand) : slot, rand);
}

const CALL = [
  { label: "The ladder works", icon: "🪢" },
  { label: "The ladder breaks", icon: "💥" },
];

function pairText(top, bottom, [x, y], labels) {
  const a = labels ? `${labels[0]} ${vineChip(top, x)}` : vineChip(top, x);
  const b = labels ? `${labels[1]} ${vineChip(bottom, y)}` : vineChip(bottom, y);
  return `${a} ↔ ${b}`;
}

function propTablet(rand) {
  const T = pick(PROP, rand)(rand);
  const [a, b] = T.base;
  const L = { top: T.top, bottom: T.bottom, a, b };
  const pairs = T.ks.map((k) => [a * k, b * k]);
  const missX = pick([5, 6, 7, 10, 2.5, 1.5].map((m) => a * m).filter((v) => Number.isInteger(v) && !pairs.some((p) => p[0] === v)), rand);
  const goal = rungFor(L, "top", missX);
  if (!goal) return null;
  const r = {
    kind: "temple", truth: "prop", layout: "single",
    ladders: [{ L, start: pairs }],
    drive: "top", moves: ALL_MOVES, maxDrive: Math.max(missX * 2, 60 * a),
    phases: [
      { type: "call", options: CALL, correct: 0, final: true, ask: "Hang the pairs on the vines: will the ladder work?", right: "✓ It works — every rung hangs straight and ties at zero. Now finish the tablet." },
      { type: "build", goals: [{ li: 0, target: missX }], ask: `Finish the tablet: ${vineChip(T.top, missX)} ↔ ?` },
    ],
    text: T.text, pairs, goal, labels: null,
    sig: `p:${T.text}:${missX}`,
  };
  if (!planRound(r, 4)) return null;
  r.q = { lead: `🗿 ${T.text} (${pairs.map((p) => pairText(T.top, T.bottom, p)).join(" · ")})`, ask: "Ladder works, or ladder breaks?" };
  r.working = [`${pairs.map((p) => pairText(T.top, T.bottom, p)).join(" · ")} — every pair is the same ladder, tied at zero.`, ...solveLines(r)];
  r.celebrate = `It works — ${vineChip(T.top, goal[0])} ↔ ${vineChip(T.bottom, goal[1])}`;
  return r;
}

function breakTablet(reason, rand) {
  const T = pick(BREAKS[reason], rand)(rand);
  const pairs = T.pairs;
  const [x1, y1] = pairs[0];
  const L = { top: T.top, bottom: T.bottom, a: x1, b: y1 };
  const others = shuffle(REASON_KEYS.filter((k) => k !== reason), rand).slice(0, 3);
  const opts = shuffle([reason, ...others], rand);
  const r = {
    kind: "temple", truth: reason, layout: "single",
    ladders: [{ L, start: [pairs[0]] }],
    drive: "top", moves: [], maxDrive: 999,
    phases: [
      { type: "call", options: CALL, correct: 1, final: true, ask: "Hang the pairs on the vines: will the ladder work?", right: "✓ It breaks — the rungs won't all hang straight. Why?" },
      {
        type: "call", final: false, ask: "Why does the ladder break?", slipName: "the reason: picked",
        options: opts.map((k) => ({ label: REASONS[k].label, icon: REASONS[k].icon })), correct: opts.indexOf(reason),
        right: `✓ ${REASONS[reason].why}`, wrong: `Not quite — ${REASONS[reason].why}`,
      },
    ],
    text: T.text, pairs, labels: T.labels || null,
    sig: `b:${reason}:${T.text}:${pairs[0].join("/")}`,
  };
  planRound(r, 1);
  r.q = { lead: `🗿 ${T.text} (${pairs.map((p) => pairText(T.top, T.bottom, p, T.labels)).join(" · ")})`, ask: "Ladder works, or ladder breaks?" };
  r.working = [
    pairs.map((p) => pairText(T.top, T.bottom, p, T.labels)).join(" · "),
    `${REASONS[reason].label}: ${REASONS[reason].why}`,
  ];
  r.celebrate = `It breaks — ${REASONS[reason].label.toLowerCase()}`;
  return r;
}

export function generateTempleSet(rand = Math.random) {
  const plan = planTypes(rand);
  // buildSet re-asks for a round whose tablet repeats an earlier one; after
  // a few tries a BROKEN tablet switches to another way of breaking (some
  // banks are small), so the works/breaks mix of the stage never changes.
  const tries = new Array(15).fill(0);
  const BREAKS = ["stays", "faster", "down", "fee", "same"];
  return buildSet((i, stage, r) => {
    const n = tries[i]++;
    const type = plan[i] === "prop" || n < 12 ? plan[i] : BREAKS[(BREAKS.indexOf(plan[i]) + 1 + Math.floor(n / 12)) % BREAKS.length];
    return makeTablet(type, r);
  }, rand);
}

/** Would pair p hang straight on a ladder through pairs[0] (tied at zero)? */
export function hangsStraight(pairs, p) {
  const [x1, y1] = pairs[0];
  return p[0] * y1 === p[1] * x1;
}

export const __makeRound = makeRound;
export const __parts = [propTablet, (r) => breakTablet(pick(REASON_KEYS, r), r)];
export { randInt, fmtVal };
