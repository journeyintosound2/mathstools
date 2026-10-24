/**
 * EMERALD JUNGLE — the ten challenge demos (2026-10-24).
 *
 * All ten challenges share ONE machine — the vine ladder (ladderStore.js,
 * LadderPlay.jsx) — so they share one demo player too: it plays a round
 * PHASE BY PHASE (build / common / call / type / smallest) the way a student
 * would: tap a rung chip, tap a move, type the partner on the other vine,
 * pick an option. Each challenge brings only its words (what the first rung
 * MEANS here), its two hand-picked rounds and, where it helps, a route.
 *
 * Jeff's rules for the jungle hold in the demos too (2026-10-10): ANY route
 * is a good route, only wrong numbers cost — and nobody is steered to "go
 * through one" (no demo route lands on a single fruit / 1 unit unless the
 * round itself starts there; the teacher names the unitary method later).
 * The captions say the key idea every time: whatever you do to one vine,
 * do to the other.
 */
import { JUNGLE_STORES } from "../../jungle/jungleActive.js";
import { driveAt } from "../../jungle/ladderStore.js";
import { getJungleChallenge } from "../../../data/jungle/jungleChallenges.js";
import { vineChip, vineOn, other, onSide, fmtVal, TIMES_CHOICES } from "../../../data/jungle/vineLadder.js";
import { generateSwapSet } from "../../../data/jungle/swapChallenge.js";
import { generateMarketSet } from "../../../data/jungle/marketChallenge.js";
import { generateRaceSet } from "../../../data/jungle/raceChallenge.js";
import { generateTapeSet } from "../../../data/jungle/tapeChallenge.js";
import { generatePotionSet } from "../../../data/jungle/potionChallenge.js";
import { generateBarrelsSet } from "../../../data/jungle/barrelsChallenge.js";
import { generateMapSet } from "../../../data/jungle/mapChallenge.js";
import { generateFirefliesSet } from "../../../data/jungle/firefliesChallenge.js";
import { generateTempleSet } from "../../../data/jungle/templeChallenge.js";
import { generatePathfinderSet } from "../../../data/jungle/pathfinderChallenge.js";
import { roundWhere } from "../demoKit.js";
import { DemoAbort } from "../demoRunner.js";


// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------
const rungText = (L, rung) => `${vineChip(L.top, rung[0])} ↔ ${vineChip(L.bottom, rung[1])}`;
/** What a student types for a value (units off — the box shows them). */
function typed(vine, v) {
  const s = fmtVal(vine, v);
  if (vine && vine.kind === "num" && vine.unit) return s.replace(new RegExp(`\\s*${vine.unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), "");
  return s;
}
const OP_WORDS = {
  again: () => "add one more lot of the first rung",
  x2: () => "double it — **× 2**",
  h2: () => "halve it — **÷ 2**",
  x10: () => "**× 10**",
  d10: () => "**÷ 10**",
  split: (n) => `split it into **${n} equal pieces**`,
  times: (n) => `stretch it **× ${n}**`,
  join: () => "**join** the two rungs — add them",
  gap: () => "find the **gap** between them — take one from the other",
  across: () => "jump straight **across**",
};
function partnerSum(op, n, src, start, pv) {
  const c = (v) => vineChip(pv, v);
  if (op === "again") return `${c(src[0])} + ${c(start)}`;
  if (op === "x2") return `${c(src[0])} × 2`;
  if (op === "h2") return `${c(src[0])} ÷ 2`;
  if (op === "x10") return `${c(src[0])} × 10`;
  if (op === "d10") return `${c(src[0])} ÷ 10`;
  if (op === "split") return `${c(src[0])} ÷ ${n}`;
  if (op === "times") return `${c(src[0])} × ${n}`;
  if (op === "join") return `${c(src[0])} + ${c(src[1])}`;
  if (op === "gap") return `${c(Math.max(src[0], src[1]))} − ${c(Math.min(src[0], src[1]))}`;
  return null;
}

// ---------------------------------------------------------------------------
// Targets on the card (LadderPlay tags its buttons with data-*)
// ---------------------------------------------------------------------------
const P = ".farm-challenge-panel";
const T = {
  rung: (d, li, i) => d.sel(`${P} .jungle-rungs[data-li="${li}"] .jungle-rung[data-i="${i}"]`),
  op: (d, op) => d.sel(`${P} .jungle-op[data-op="${op}"]`),
  n: (d, n) => d.sel(`${P} .jungle-n[data-n="${n}"]`),
  call: (d, i) => d.sel(`${P} .jungle-callbtn[data-call="${i}"]`),
  claim: (d) => d.sel(`${P} .magma-claim`),
};

// ---------------------------------------------------------------------------
// The player
// ---------------------------------------------------------------------------
/** Select exactly the rungs `want` (indices) on ladder li, the way a student taps. */
async function selectRungs(d, store, li, want) {
  const st = () => store.getState();
  if (st().active !== li) {
    await d.tap(T.rung(d, li, want[0]), () => st().select(li, want[0]));
  }
  for (const i of [...st().sel]) if (!want.includes(i)) await d.tap(T.rung(d, li, i), () => st().select(li, i));
  for (const i of want) if (!st().sel.includes(i)) await d.tap(T.rung(d, li, i), () => st().select(li, i));
}

/** Hang one rung: pick the source rung(s), make the move, type the partner. */
async function playStep(d, store, r, step, { verbose, firstStep, think }) {
  const st = () => store.getState();
  const li = step.li;
  const L = r.ladders[li].L;
  const dr = driveAt(r, st().phase, li);
  const dv = vineOn(L, dr);
  const pv = vineOn(L, other(dr));
  const rungs = st().ladders[li].rungs;
  const want = [];
  if (step.op !== "across") {
    want.push(rungs.findIndex((x) => onSide(x, dr) === step.a));
    if (step.b !== undefined) want.push(rungs.findIndex((x) => onSide(x, dr) === step.b));
  }
  const src = want.map((i) => rungs[i]);
  if (verbose) {
    const from = src.length === 2 ? `**${rungText(L, src[0])}** and **${rungText(L, src[1])}**` : src.length ? `**${rungText(L, src[0])}**` : "";
    await d.say(from ? `Start from ${from}: ${OP_WORDS[step.op](step.n)}.` : `Now ${OP_WORDS[step.op](step.n)}.`, { ms: 2600 });
  } else if (think && firstStep) {
    await d.think(`What move gets us closer to the 🎯 target?`, 2600);
    d.say(`${OP_WORDS[step.op](step.n).replace(/^./, (c) => c.toUpperCase())}!`, { wait: false });
  } else {
    d.say(`${OP_WORDS[step.op](step.n).replace(/^./, (c) => c.toUpperCase())}.`, { wait: false });
  }
  if (want.length) await selectRungs(d, store, li, want);
  await d.tap(T.op(d, step.op), () => st().choose(step.op));
  if (step.n) await d.tap(T.n(d, step.n), () => st().pickN(step.n));
  await d.until(() => Boolean(st().pending));
  const p = st().pending;
  const srcP = src.map((x) => onSide(x, other(dr)));
  const startP = onSide(r.ladders[li].start[0], other(dr));
  const sum = partnerSum(step.op, step.n, srcP, startP, pv);
  if (verbose) {
    await d.say(`That makes **${vineChip(dv, p.value)}**. ${firstStep ? "Whatever you do to one vine, do to the other: " : "The other vine too: "}${sum ? `${sum} = ` : ""}**${vineChip(pv, p.partner)}**.`, { ms: 3200 });
  } else {
    await d.think(`**${vineChip(dv, p.value)}** ↔ ? What goes on the other vine?`, 2200);
  }
  await d.type(d.input(), typed(pv, p.partner), (t) => st().submit(t));
  await d.sleep(900);
}

/** The steps for a "common" phase that line two ladders up WITHOUT going through one. */
function commonPlan(r, st) {
  const [A, B] = [0, 1].map((li) => ({ li, a: onSide(r.ladders[li].start[0], driveAt(r, st.phase, li)) }));
  const g = (x, y) => (y ? g(y, x % y) : x);
  const lcm = (A.a * B.a) / g(A.a, B.a);
  const out = [];
  for (const X of [A, B]) {
    const k = lcm / X.a;
    if (k === 1) continue;
    if (k === 2) out.push({ li: X.li, a: X.a, op: "x2" });
    else if (k === 10) out.push({ li: X.li, a: X.a, op: "x10" });
    else if (TIMES_CHOICES.includes(k)) out.push({ li: X.li, a: X.a, op: "times", n: k });
    else return null;
  }
  return out;
}

/** The comparison a call is about (two ladders lined up at the same amount). */
function lineUp(r, st) {
  if (st.common === null || st.common === undefined) return null;
  const rows = r.ladders.map((lad, li) => {
    const rung = st.ladders[li].rungs.find((x) => x[0] === st.common);
    return rung ? `${lad.name || `Ladder ${li + 1}`}: **${rungText(lad.L, rung)}**` : null;
  }).filter(Boolean);
  return rows.length === 2 ? rows.join(" · ") : null;
}

async function playRound(d, store, r, words, verbose) {
  const st = () => store.getState();
  const q = r.q || {};
  await d.say(`${q.lead || ""} **${q.ask || ""}**`.trim(), { ms: 3800 });
  if (verbose && words.intro) await d.say(words.intro(r));
  let firstStep = true;
  let stepNo = 1;
  for (let guard = 0; guard < 8 && st().status === "play"; guard++) {
    const i = st().phase;
    const ph = r.phases[i];
    if (!ph) break;
    if (ph.type === "build" || ph.type === "smallest" || ph.type === "common") {
      const goal = ph.type === "build" ? ph.goals.map((g) => vineChip(vineOn(r.ladders[g.li].L, driveAt(r, i, g.li)), g.target)).join(" and ") : null;
      d.step(stepNo++, ph.type === "common" ? "Line them up" : ph.type === "smallest" ? "Find the smallest" : "Build to the 🎯");
      if (ph.ask && ph.ask !== q.ask) await d.say(`**${ph.ask}**`, { ms: 2600 });
      if (ph.type === "common" && verbose) await d.say(`Build both ladders to the **same amount** — then they're easy to compare.`);
      else if (goal && verbose && firstStep) await d.say(`Build rungs until one reaches the 🎯 **${goal}**.`, { ms: 2600 });
      const steps = (ph.type === "common" && commonPlan(r, st())) || (words.route && words.route(r, i)) || r.solve[i].steps;
      for (const s of steps) {
        if (st().phase !== i || st().status !== "play") break;
        await playStep(d, store, r, s, { verbose, firstStep, think: !verbose });
        firstStep = false;
      }
      if (ph.type === "smallest" && st().phase === i) await d.tap(T.claim(d), () => st().claim());
      if (ph.type === "build" && verbose && goal) await d.say(`🎯 **${goal}** — reached!`, { ms: 1800 });
      if (ph.type === "common") {
        const lu = lineUp(r, st());
        if (lu) await d.say(lu, { ms: 3200 });
      }
    } else if (ph.type === "call") {
      d.step(stepNo++, "Decide");
      if (ph.ask) await d.say(`**${ph.ask}**`, { ms: 2400 });
      const why = (words.why && words.why(r, ph, st())) || (ph.right ? ph.right.replace(/^✓\s*/, "") : null);
      if (verbose) {
        if (why) await d.say(why, { ms: 3200 });
      } else {
        await d.think(`Have a think — which one?`, 2800);
        if (why) d.say(why, { wait: false });
      }
      await d.tap(T.call(d, ph.correct), () => st().call(ph.correct));
      await d.sleep(1200);
    } else if (ph.type === "type") {
      d.step(stepNo++, "Type it");
      await d.say(`**${ph.ask}**`, { ms: 2800 });
      const ans = typed(ph.vine, ph.answer);
      if (verbose) d.say((words.typeWhy && words.typeWhy(r, ph)) || `It's **${fmtVal(ph.vine, ph.answer)}**.`, { wait: false });
      else await d.think(`What's the number?`, 2400);
      await d.sleep(verbose ? 1800 : 100);
      await d.type(d.input(), ans, (t) => st().submit(t));
      await d.sleep(900);
    } else break;
    // The store moves on after its own little celebration — wait for that,
    // so a slow device never replays a phase it has already finished.
    if (d.dry()) continue;
    try {
      await d.until(() => st().phase !== i || st().status !== "play", { timeout: 5000 });
    } catch (e) {
      if (e instanceof DemoAbort) throw e;
      break;
    }
  }
  await d.until(() => st().status === "celebrate");
  await d.say(words.outro ? words.outro(r) : `Right! Any route up the ladder is a good route — just get every number right.`);
}

// ---------------------------------------------------------------------------
// The ten challenges: their words + two rounds each
// ---------------------------------------------------------------------------
const steps = (r) => r.phases.reduce((n, _, i) => n + ((r.solve[i] && r.solve[i].steps) || []).length, 0);
const ops = (r) => r.phases.flatMap((_, i) => ((r.solve[i] && r.solve[i].steps) || []).map((s) => s.op));
/** No step lands on ONE item / one unit (Jeff: don't steer to "go through one"). */
const noOne = (r) => r.phases.every((_, i) => ((r.solve[i] && r.solve[i].steps) || []).every((s) => s.v !== 1));
const kinds = (r) => r.phases.map((p) => p.type).join(",");
const at = (gen, i, pred) => roundWhere((rand) => gen(rand)[i], pred, { tries: 300 });

const SPEC = {
  swap: {
    rounds: () => [
      at(generateSwapSet, 1, (r) => steps(r) === 2 && kinds(r) === "build"),
      at(generateSwapSet, 3, (r) => ops(r).includes("x10") && steps(r) <= 3 && noOne(r)),
    ],
    intro: (r) => `The deal is the first **rung**: ${r.ladders[0].L.top.many} on the top vine, ${r.ladders[0].L.bottom.many} on the bottom — tied together at 0.`,
    outro: () => `Every rung is a fair swap! Any route works — just get every number right.`,
  },
  market: {
    rounds: () => [
      at(generateMarketSet, 3, (r) => kinds(r) === "build" && steps(r) === 2 && noOne(r) && r.layout !== "shared"),
      at(generateMarketSet, 9, (r) => r.layout === "shared" && kinds(r) === "common,call"),
    ],
    intro: () => `The price is the first rung: fruit on top, dollars below. Every rung is a fair price.`,
    why: (r, ph, st) => {
      const lu = lineUp(r, st);
      return lu ? `Same amount of fruit — ${lu}. **${ph.options[ph.correct].label}** is cheaper!` : null;
    },
  },
  race: {
    rounds: () => [
      at(generateRaceSet, 0, (r) => kinds(r) === "build" && steps(r) <= 2 && noOne(r)),
      at(generateRaceSet, 6, (r) => kinds(r) === "common,call"),
    ],
    intro: (r) => `The racer's card is the first rung: ${r.ladders[0].L.top.many || "time"} on top, ${r.ladders[0].L.bottom.many || "distance"} below.`,
    why: (r, ph, st) => {
      const lu = lineUp(r, st);
      return lu ? `Same time — ${lu}. Further in the same time is faster: **${ph.options[ph.correct].label}**!` : null;
    },
  },
  tape: {
    rounds: () => [
      at(generateTapeSet, 4, (r) => kinds(r) === "type,build"),
      at(generateTapeSet, 6, (r) => kinds(r) === "build" && steps(r) === 2 && noOne(r)),
    ],
    intro: () => `The tape has a different unit on each edge. Look along the rungs for the number that takes you **across**.`,
    typeWhy: (r, ph) => `Every rung: the left number **× ${typed(ph.vine, ph.answer)}** makes the right number.`,
    // Example 1 shows the tape's special move: ↔ Across, once the number is found.
    route: (r, i) => (r.phases[i].type === "build" && r.phases[0].type === "type" ? [{ li: 0, op: "across" }] : null),
  },
  potion: {
    rounds: () => [
      at(generatePotionSet, 0, (r) => kinds(r) === "build" && steps(r) === 1),
      at(generatePotionSet, 3, (r) => kinds(r) === "call,build" && r.phases[0].correct === 1),
    ],
    intro: () => `A recipe is a rung: 🔵 moonberry on top, 🟡 sunfruit below. Scale BOTH and the colour stays the same.`,
  },
  barrels: {
    rounds: () => [
      at(generateBarrelsSet, 0, (r) => kinds(r) === "build" && steps(r) === 1),
      at(generateBarrelsSet, 3, (r) => kinds(r) === "build" && steps(r) === 2 && noOne(r)),
    ],
    intro: () => `The pipe's rate is the first rung: seconds on top, litres below.`,
  },
  map: {
    rounds: () => [
      at(generateMapSet, 3, (r) => kinds(r) === "build" && steps(r) === 1),
      at(generateMapSet, 1, (r) => kinds(r) === "build" && steps(r) === 2),
    ],
    intro: () => `The scale is the first rung: map centimetres on top, real metres below — the real trail.`,
  },
  fireflies: {
    rounds: () => [
      at(generateFirefliesSet, 0, (r) => kinds(r) === "build" && steps(r) === 1),
      at(generateFirefliesSet, 3, (r) => kinds(r) === "common,call"),
    ],
    intro: () => `The ladder stands up: minutes along the ground, kilometres up the tree. Every rung is a **firefly**.`,
    why: (r, ph, st) => {
      const lu = lineUp(r, st);
      return lu ? `Same time — ${lu}. Further = a steeper line = faster: **${ph.options[ph.correct].label}**!` : null;
    },
  },
  temple: {
    rounds: () => [
      at(generateTempleSet, 0, (r) => kinds(r) === "call,build" && steps(r) === 1),
      at(generateTempleSet, 3, (r) => kinds(r) === "call,call"),
    ],
    intro: () => `Hang the tablet's pairs on the vines. Do they make a true ladder — tied at 0, every rung straight?`,
    why: (r, ph) => (ph.right ? ph.right.replace(/^✓\s*/, "") : null),
    outro: (r) => (r.phases.length > 1 && r.phases[1].type === "call" ? `It breaks — and now we know why. Works or breaks, then finish (or explain) the tablet.` : `It works — and the ladder finished the tablet!`),
  },
  pathfinder: {
    rounds: () => [
      at(generatePathfinderSet, 0, (r) => kinds(r) === "build" && steps(r) === 2 && noOne(r)),
      at(generatePathfinderSet, 6, (r) => r.layout === "chain" && kinds(r) === "build,build"),
    ],
    intro: () => `An expedition is one ladder after another — the answer to one is the 🎯 for the next.`,
  },
};

function demoOf(key, store) {
  const m = getJungleChallenge(key);
  const words = SPEC[key];
  return {
    key: `jungle-${key}`,
    name: m.name,
    icon: m.icon,
    host: m.host.name,
    store,
    rounds: words.rounds,
    examples: [
      (d, r) => playRound(d, store, r, words, true),
      (d, r) => playRound(d, store, r, words, false),
    ],
  };
}

export const JUNGLE_DEMOS = JUNGLE_STORES.map(([key, store]) => demoOf(key, store));
