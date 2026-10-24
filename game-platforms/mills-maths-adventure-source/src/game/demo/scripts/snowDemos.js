/**
 * SNOWBALL SUMS — the ten challenge demos (2026-10-24).
 *
 * Every demo plays two worked examples on the real stage with the real card:
 *   example 1 — "I do": the host thinks aloud through every step;
 *   example 2 — "you think, then watch": the host asks the watcher to
 *               predict first (🤔 + a thinking bar), then shows it.
 * Captions are short (one idea, ~15 words), name what's on screen, and put
 * the numbers that matter in **bold**. Examples are real rounds from each
 * challenge's own generator, hand-picked to be friendly (no traps — the
 * demo teaches the rules, the game teaches the rest).
 * Helpers: game/demo/demoRunner.js.
 */
import { useSnowballRange } from "../../snowballRangeStore.js";
import { useRinkGlide } from "../../rinkGlideStore.js";
import { useGroveLights } from "../../groveLightsStore.js";
import { useMeadowLevel } from "../../meadowLevelStore.js";
import { useSledSlope } from "../../sledSlopeStore.js";
import { useVillageSplit } from "../../villageSplitStore.js";
import { useColonyPairs } from "../../colonyPairsStore.js";
import { useCaveCrystals } from "../../caveCrystalsStore.js";
import { useLodgeYard } from "../../lodgeYardStore.js";
import { useAuroraLookout } from "../../auroraLookoutStore.js";
import { generateRangeRound } from "../../../data/snow/snowballRangeChallenge.js";
import { generateRinkRound } from "../../../data/snow/rinkGlideChallenge.js";
import { generateGroveRound } from "../../../data/snow/groveLightsChallenge.js";
import { generateMeadowRound } from "../../../data/snow/meadowLevelChallenge.js";
import { generateSledRound } from "../../../data/snow/sledSlopeChallenge.js";
import { generateVillageRound } from "../../../data/snow/villageSplitChallenge.js";
import { generateColonyRound } from "../../../data/snow/colonyPairsChallenge.js";
import { generateCaveRound } from "../../../data/snow/caveCrystalsChallenge.js";
import { generateYardRound } from "../../../data/snow/lodgeYardChallenge.js";
import { generateLookoutRound } from "../../../data/snow/auroraLookoutChallenge.js";
import { roundWhere, plural } from "../demoKit.js";

const chip = (d) => d.sel(".snow-chip", null, null);

// ---------------------------------------------------------------------------
// 1 · THE SNOWBALL RANGE — bridging to ten (Pip)
// ---------------------------------------------------------------------------
async function rangeExample(d, r, first) {
  const st = () => useSnowballRange.getState();
  const slidePole = async (to) => {
    await d.drag(d.anchor("range-pole", [0, 1.45, 0]), d.anchor(`range-gap-${to}`), (t) => {
      const want = Math.round(t * to);
      if (st().splitIndex !== want) st().setSplit(want);
    }, { ms: 500 + to * 260 });
    if (st().splitIndex !== to) st().setSplit(to);
  };

  d.step(1, "Fill the crate");
  if (first) {
    await d.point(chip(d), { ms: 300 });
    await d.say(`We need **${r.start} + ${r.add}**.`);
    await d.point(d.anchor("range-frame"), { ms: 300 });
    await d.say(`The crate already has **${r.ones}** snowballs. A full crate holds **10**.`);
    await d.point(d.anchor(`range-cell-${r.ones}`), { ms: 300 });
    await d.say(`${r.ones} and **${r.comp}** more make 10 — so **${r.comp}** empty spaces to fill.`);
    d.say(`I drag the **red pole** so ${r.comp} snowballs are on its left.`, { wait: false });
  } else {
    await d.point(chip(d), { ms: 300 });
    await d.say(`Now **${r.start} + ${r.add}**. ${r.fullCrates} full crates of ten, and **${r.ones}** in the open crate.`);
    await d.point(d.anchor(`range-cell-${r.ones}`), { ms: 300 });
    await d.think(`How many snowballs will fill the crate to **${r.nextTen}**?`);
    d.say(`**${r.comp}!** ${r.ones} and ${r.comp} make 10. Slide the pole to ${r.comp}.`, { wait: false });
  }
  await d.sleep(1000);
  await slidePole(r.comp);
  d.say(`Snowballs left of the pole go in the crate. **Throw!**`, { wait: false });
  await d.sleep(1200);
  await d.tap(d.btn(/Throw/), () => st().throwSplit());
  await d.until(() => st().status === "typing");
  await d.sleep(1500);
  await d.point(d.anchor("range-frame"), { ms: 300 });
  await d.say(`The crate is full — **${r.nextTen}**. The other **${r.rest}** land on the spare pile.`);

  d.step(2, "How many altogether?");
  if (first) {
    d.say(`${r.nextTen} and ${r.rest} more is **${r.sum}**. I type it in and Check.`, { wait: false });
  } else {
    await d.think(`${r.nextTen} and ${r.rest} more… how many altogether?`, 2600);
    d.say(`**${r.sum}!**`, { wait: false });
  }
  await d.sleep(1200);
  await d.type(d.input(), r.sum, (t) => st().submitSum(t));
  await d.until(() => st().status === "celebrate");
  await d.say(first ? `**${r.start} + ${r.add} = ${r.sum}**. Fill the crate to 10 first, then add the rest!` : `**${r.start} + ${r.add} = ${r.sum}**. Make the ten, then add on.`);
}

const RANGE = {
  key: "snow-range",
  name: "The Snowball Range",
  icon: "❄️",
  host: "Pip",
  store: useSnowballRange,
  rounds: () => [
    roundWhere((rand) => generateRangeRound(0, rand), (r) => r.start === 8 && r.add === 5),
    roundWhere((rand) => generateRangeRound(6, rand), (r) => r.start === 46 && r.add === 7),
  ],
  examples: [(d, r) => rangeExample(d, r, true), (d, r) => rangeExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 2 · THE ICE RINK — jump by tens (Fern)
// ---------------------------------------------------------------------------
const pushBtn = (d, v) => d.btn(v === 10 ? /^\+10$/ : v === 1 ? /^\+1$/ : v === -10 ? /^−10$/ : /^−1$/);

async function rinkExample(d, r, first) {
  const st = () => useRinkGlide.getState();
  const push = async (v, times) => d.tapTimes(pushBtn(d, v), times, () => st().addPush(v), { gap: 360 });
  const diff = r.target - r.start;
  d.step(1, "Plan the jumps");
  await d.point(d.anchor("rink-start"), { ms: 300 });
  await d.say(`The penguin starts on **${r.start}**…`);
  await d.point(d.anchor("rink-target"), { ms: 300 });
  await d.say(`…and the fish bucket is on **${r.target}**.`);
  if (first) {
    const tens = Math.floor(diff / 10);
    const ones = diff % 10;
    await d.say(`That's **${diff}** to go. **${tens} tens**, then **${ones} ones**.`);
    d.say(`+10, +10 … then +1, +1, +1.`, { wait: false });
    await push(10, tens);
    await push(1, ones);
    await d.point(d.sel(".snow-plan"), { ms: 400 });
    await d.say(`The plan adds up to **+${diff}**. Ready… **Launch!**`);
  } else {
    // An overshoot round: jump one ten too far, then step back.
    const tens = Math.round(diff / 10);
    const back = tens * 10 - diff;
    await d.think(`**${diff}** to go. ${diff} is very close to **${tens * 10}**… what's the quickest plan?`);
    await d.say(`**${tens} tens** take us to ${r.start + tens * 10} — just past the bucket. Then **${back} back**.`, { wait: false });
    await push(10, tens);
    await push(-1, back);
    await d.say(`**+${tens * 10} − ${back} = +${diff}**. Only ${plural(tens + back, "tile")}! **Launch!**`);
  }
  d.step(2, "Launch!");
  await d.tap(d.btn(/Launch/), () => st().go());
  await d.until(() => st().status === "celebrate" || st().status === "feedback", { timeout: 20000, dry: () => st().finishGlide() });
  await d.say(first ? `Splash — right in the bucket! Big jumps of **10** first, then the little ones.` : `Right in the bucket! Going one ten too far and stepping back can be quicker.`);
}

const RINK = {
  key: "snow-rink",
  name: "The Ice Rink",
  icon: "⛸️",
  host: "Fern",
  store: useRinkGlide,
  rounds: () => [
    roundWhere((rand) => generateRinkRound(0, rand), (r) => r.target - r.start === 23 && r.start >= 12 && r.start <= 16),
    roundWhere((rand) => generateRinkRound(6, rand), (r) => r.target - r.start === 29 && r.start % 10 >= 2 && r.start < 40),
  ],
  examples: [(d, r) => rinkExample(d, r, true), (d, r) => rinkExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 3 · CHRISTMAS TREE GROVE — compensation (Alby)
// ---------------------------------------------------------------------------
const fixLabel = (a) => (a === -2 ? /Take 2 off/ : a === -1 ? /Take 1 off/ : a === 0 ? /Just right/ : a === 1 ? /Add 1 more/ : /Add 2 more/);

async function groveExample(d, r, first) {
  const st = () => useGroveLights.getState();
  const fixWords = r.adjust < 0 ? `**${-r.adjust} too many**` : `**${r.adjust} too few**`;
  d.step(1, "Grab bundles of 10");
  await d.point(d.anchor("grove-tree"), { ms: 300 });
  await d.say(`The tree has **${r.start}** lights. It needs **${r.add}** more.`);
  if (first) {
    await d.point(d.anchor("grove-box"), { ms: 300 });
    await d.say(`Lights come in bundles of **10**. ${r.add} is very close to **${r.grabValue}** — that's **${r.grabBundles} bundles**.`);
  } else {
    await d.think(`Which bundles are closest to **${r.add}**?`);
    await d.say(`**${r.grabBundles} bundles = ${r.grabValue}**!`, { wait: false });
  }
  await d.tap(d.btn(new RegExp(`^${r.grabBundles} bundles? =`)), () => st().chooseGrab(r.grabBundles));
  await d.until(() => st().status === "adjusting");
  await d.sleep(900);
  d.step(2, "Make it exact");
  await d.point(d.anchor("grove-tree"), { ms: 300 });
  if (first) {
    await d.say(`We hung **${r.grabValue}**, but only needed **${r.add}**. That's ${fixWords}.`);
  } else {
    await d.think(`We hung ${r.grabValue} but needed ${r.add}. How do we fix it?`);
    await d.say(r.adjust < 0 ? `Take ${-r.adjust} off!` : `Add ${r.adjust} more!`, { wait: false });
  }
  await d.tap(d.btn(fixLabel(r.adjust)), () => st().chooseAdjust(r.adjust));
  await d.until(() => st().status === "typing");
  await d.sleep(700);
  d.step(3, "How many now?");
  const op = r.adjust < 0 ? `${r.hung} − ${-r.adjust}` : `${r.hung} + ${r.adjust}`;
  if (first) {
    d.say(`${r.start} + ${r.grabValue} = **${r.hung}**. Then ${op} = **${r.total}**.`, { wait: false });
  } else {
    await d.think(`${op}… how many lights now?`, 2400);
  }
  await d.sleep(first ? 1600 : 300);
  await d.type(d.input(), r.total, (t) => st().submitTotal(t));
  await d.until(() => st().status === "celebrate");
  await d.say(first ? `**${r.start} + ${r.add} = ${r.total}**. Add the bundles, then fix the extra!` : `**${r.start} + ${r.add} = ${r.total}**. Nearly ${r.grabValue}, then fix it!`);
}

const GROVE = {
  key: "snow-grove",
  name: "Christmas Tree Grove",
  icon: "🎄",
  host: "Alby",
  store: useGroveLights,
  rounds: () => [
    roundWhere((rand) => generateGroveRound(3, rand), (r) => r.add === 29 && r.start === 34),
    roundWhere((rand) => generateGroveRound(6, rand), (r) => r.add === 21 && r.start >= 43 && r.start <= 48),
  ],
  examples: [(d, r) => groveExample(d, r, true), (d, r) => groveExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 4 · SNOWMAN MEADOW — levelling (Frosty)
// ---------------------------------------------------------------------------
async function meadowExample(d, r, first) {
  const st = () => useMeadowLevel.getState();
  const tallSide = r.tallerSide === "left" ? "meadow-left" : "meadow-right";
  const shortSide = r.tallerSide === "left" ? "meadow-right" : "meadow-left";
  d.step(1, "Make them match");
  await d.point(chip(d), { ms: 300 });
  await d.say(`**${r.left} + ${r.right}**. One snowman is **${r.taller}** balls tall, the other **${r.shorter}**.`);
  if (first) {
    await d.point(d.anchor(tallSide), { ms: 300 });
    await d.say(`Hop a snowball from the tall one to the short one. Watch them change!`);
  } else {
    await d.think(`How many hops until they're the **same height**?`);
    await d.say(`Let's hop and see.`, { wait: false });
  }
  for (let i = 0; i < r.moves; i++) {
    await d.tap(d.btn(/Hop a snowball/), () => st().hop(1), { linger: 250 });
    await d.sleep(650);
    const now = r.taller - (i + 1);
    const other = r.shorter + (i + 1);
    await d.say(`${now} and ${other}.`, { ms: 1100 });
  }
  await d.point(d.anchor(shortSide), { ms: 300 });
  await d.say(first ? `**${r.level}** and **${r.level}** — they match!` : `Only **${r.moves}** hops — each hop makes one smaller AND the other bigger.`);
  if (!first) {
    await d.point(d.btn(/never match/), { ms: 300 });
    await d.say(`(If two snowmen can NEVER be the same height, you'd tap **They can never match**.)`);
  }
  await d.tap(d.btn(/They match/), () => st().call("match"));
  await d.until(() => st().status === "typing");
  await d.sleep(800);
  d.step(2, "Use the double");
  if (first) {
    d.say(`${r.left} + ${r.right} is the same as **${r.level} + ${r.level}**. Double ${r.level} is **${r.total}**.`, { wait: false });
    await d.sleep(2600);
  } else {
    await d.think(`${r.left} + ${r.right} = double ${r.level} = ?`, 2600);
  }
  await d.type(d.input(), r.total, (t) => st().submitTotal(t));
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.left} + ${r.right} = ${r.total}**. Level them, then double!`);
}

const MEADOW = {
  key: "snow-meadow",
  name: "Snowman Meadow",
  icon: "⛄",
  host: "Frosty",
  store: useMeadowLevel,
  rounds: () => [
    roundWhere((rand) => generateMeadowRound(0, rand), (r) => r.level === 10 && r.moves === 2 && r.canTwin),
    roundWhere((rand) => generateMeadowRound(3, rand), (r) => r.level === 14 && r.moves === 3 && r.canTwin),
  ],
  examples: [(d, r) => meadowExample(d, r, true), (d, r) => meadowExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 5 · SLEDDING SLOPE — constant difference (Flake)
// ---------------------------------------------------------------------------
async function sledExample(d, r, first) {
  const st = () => useSledSlope.getState();
  const dir = r.shift > 0 ? 1 : -1;
  const n = Math.abs(r.shift);
  const btn = dir > 0 ? d.btn(/Both \+1/) : d.btn(/Both −1/);
  d.step(1, "Slide to a tens number");
  await d.point(d.anchor("sled-front"), { ms: 300 });
  await d.say(`**${r.a} − ${r.b}**: two sleds tied with a rope. The rope is the gap between them.`);
  await d.point(d.anchor("sled-back"), { ms: 300 });
  if (first) {
    await d.say(`**${r.b}** is nearly **${r.decade}**. Slide BOTH sleds ${dir > 0 ? "up" : "down"} ${plural(n, "place")}.`);
  } else {
    await d.think(`Which way should both sleds slide so **${r.b}** becomes a tens number?`);
    await d.say(`${dir > 0 ? "Up" : "Down"} ${n} — to **${r.decade}**!`, { wait: false });
  }
  await d.tapTimes(btn, n, () => st().nudge(dir), { gap: 650 });
  await d.sleep(500);
  await d.point(d.anchor("sled-front"), { ms: 300 });
  await d.say(`Now it's **${r.a + r.shift} − ${r.decade}**. The rope didn't stretch — same gap!`);
  await d.tap(d.btn(/That's it/), () => st().confirmSlide());
  await d.until(() => st().status === "typing");
  await d.sleep(700);
  d.step(2, "Find the gap");
  if (first) {
    d.say(`${r.a + r.shift} − ${r.decade} is easy: **${r.gap}**.`, { wait: false });
    await d.sleep(1800);
  } else {
    await d.think(`${r.a + r.shift} − ${r.decade} = ?`, 2400);
  }
  await d.type(d.input(), r.gap, (t) => st().submitDiff(t));
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.a} − ${r.b} = ${r.gap}**. Slide to a tens number — the gap stays the same!`);
}

const SLED = {
  key: "snow-sled",
  name: "Sledding Slope",
  icon: "🛷",
  host: "Flake",
  store: useSledSlope,
  rounds: () => [
    roundWhere((rand) => generateSledRound(0, rand), (r) => r.b === 29 && r.gap >= 25 && r.gap <= 34),
    roundWhere((rand) => generateSledRound(3, rand), (r) => r.shift === -1 && r.b === 41 && r.gap >= 20 && r.gap <= 28),
  ],
  examples: [(d, r) => sledExample(d, r, true), (d, r) => sledExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 6 · IGLOO VILLAGE — partitioning (Bloc)
// ---------------------------------------------------------------------------
const COL_A = ".snow-village-cols > .snow-village-col:first-child";
const COL_B = ".snow-village-cols > .snow-village-col:last-child";

async function villageExample(d, r, first) {
  const st = () => useVillageSplit.getState();
  const move = (side, kind, n) =>
    d.tapTimes(d.btn(kind === "ten" ? /a ten/ : /a one/, side === "a" ? COL_A : COL_B), n, () => st().moveBlock(side, kind), { gap: 230 });
  const tens = r.ta + r.tb;
  const ones = r.oa + r.ob;
  d.step(1, "Move the tens and ones");
  await d.say(`**${r.a} + ${r.b}**. ${r.a} is ${plural(r.ta, "ten")} and ${plural(r.oa, "one")}. ${r.b} is ${plural(r.tb, "ten")} and ${plural(r.ob, "one")}.`);
  d.say(`Move every **ten** into the middle igloo…`, { wait: false });
  await move("a", "ten", r.ta);
  await move("b", "ten", r.tb);
  d.say(`…then every **one**.`, { wait: false });
  await move("a", "one", r.oa);
  await move("b", "one", r.ob);
  await d.point(d.sel(".snow-village-mid"), { ms: 300 });
  if (ones >= 10) {
    d.step(2, "Swap 10 ones for a ten");
    if (first) await d.say(`**${tens} tens** and **${ones} ones**. That's 10 ones or more — swap them for a ten!`);
    else await d.think(`${tens} tens and ${ones} ones… is there anything to swap?`);
    await d.tap(d.btn(/10 ones → 1 ten/), () => st().regroup());
    await d.sleep(900);
    await d.say(`Now it's **${tens + 1} tens** and **${ones - 10} ones**.`);
  } else {
    await d.say(`**${tens} tens** and **${ones} ones**. Fewer than 10 ones, so nothing to swap.`);
  }
  await d.tap(d.btn(/Done/), () => st().finishBuild());
  await d.until(() => st().status === "typing");
  await d.sleep(600);
  d.step(ones >= 10 ? 3 : 2, "How many?");
  if (first) {
    d.say(`${r.a} + ${r.b} = **${r.total}**.`, { wait: false });
    await d.sleep(1400);
  } else {
    await d.think(`${tens + 1} tens and ${ones - 10} ones make…?`, 2400);
  }
  await d.type(d.input(), r.total, (t) => st().submitTotal(t));
  await d.until(() => st().status === "celebrate");
  await d.say(first ? `**${r.a} + ${r.b} = ${r.total}**. Tens with tens, ones with ones!` : `**${r.a} + ${r.b} = ${r.total}**. 10 ones make a new ten!`);
}

const VILLAGE = {
  key: "snow-village",
  name: "Igloo Village",
  icon: "🧊",
  host: "Bloc",
  store: useVillageSplit,
  rounds: () => [
    roundWhere((rand) => generateVillageRound(0, rand), (r) => r.ta === 2 && r.tb === 1 && r.oa + r.ob <= 8 && r.oa >= 2 && r.ob >= 2),
    roundWhere((rand) => generateVillageRound(6, rand), (r) => r.ta + r.tb <= 4 && r.oa + r.ob === 13),
  ],
  examples: [(d, r) => villageExample(d, r, true), (d, r) => villageExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 7 · PENGUIN COLONY — near doubles (Pippin)
// ---------------------------------------------------------------------------
async function colonyExample(d, r, first) {
  const st = () => useColonyPairs.getState();
  const idx = r.options.findIndex((o) => o.correct && o.base === r.a);
  const best = idx >= 0 ? idx : r.options.findIndex((o) => o.correct);
  const opt = r.options[best];
  d.step(1, "Pick the double");
  await d.point(d.anchor("colony-rows"), { ms: 300 });
  await d.say(`**${r.a} + ${r.b}**: ${r.a} penguins in one row, ${r.b} in the other.`);
  if (first) {
    await d.point(d.anchor("colony-odd"), { ms: 300 });
    await d.say(`They make **${r.a} pairs**… and **1** penguin is left over. That's **${opt.label}**.`);
  } else {
    await d.think(`Which **double** helps with ${r.a} + ${r.b}?`);
    await d.say(`**${opt.label}**!`, { wait: false });
  }
  await d.tap(d.btn(opt.label), () => st().choosePredict(best));
  await d.say(`Watch them pair up…`, { wait: false });
  await d.until(() => st().status === "typing", { timeout: 15000, dry: () => st().finishPairing() });
  await d.sleep(600);
  d.step(2, "How many penguins?");
  if (first) {
    d.say(`Double ${r.a} is **${2 * r.a}**, and 1 more is **${r.total}**.`, { wait: false });
    await d.sleep(2200);
  } else {
    await d.think(`Double ${r.a} is ${2 * r.a}… and one more?`, 2400);
  }
  await d.type(d.input(), r.total, (t) => st().submitTotal(t));
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.a} + ${r.b} = ${r.total}**. Find the double, then add the one left over!`);
}

const COLONY = {
  key: "snow-colony",
  name: "Penguin Colony",
  icon: "🐧",
  host: "Pippin",
  store: useColonyPairs,
  rounds: () => [
    roundWhere((rand) => generateColonyRound(0, rand), (r) => r.a === 7 && r.diff === 1),
    roundWhere((rand) => generateColonyRound(6, rand), (r) => r.a === 14 && r.diff === 1),
  ],
  examples: [(d, r) => colonyExample(d, r, true), (d, r) => colonyExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 8 · THE ICE CAVE — think addition (Glim)
// ---------------------------------------------------------------------------
async function caveExample(d, r, first) {
  const st = () => useCaveCrystals.getState();
  const up = r.kind === "up";
  d.step(1, "Up or back?");
  await d.point(chip(d), { ms: 300 });
  await d.say(`**${r.a} − ${r.b}**. We can count **up** from ${r.b} to ${r.a}, or count **back** ${r.b} from ${r.a}.`);
  if (first) {
    await d.say(up ? `${r.b} is really close to ${r.a}! Counting **up** is only **${r.answer}** steps.` : `Counting **back** ${r.b} is only ${r.b} steps.`);
  } else {
    await d.think(`Which way is quicker for **${r.a} − ${r.b}**?`);
    await d.say(up ? `Count **up** — ${r.b} is close to ${r.a}!` : `Count **back** — only ${r.b} steps!`, { wait: false });
  }
  await d.tap(d.btn(up ? /Count UP/ : /Count BACK/), () => st().chooseDirection(r.kind));
  await d.say(`Watch the crystals light up, one step at a time.`, { wait: false });
  await d.until(() => st().status === "typing", { timeout: 20000, dry: () => st().finishLighting() });
  await d.sleep(500);
  d.step(2, up ? "How many steps?" : "Where did we land?");
  if (first) {
    d.say(up ? `${r.b} … ${r.a}: that's **${r.answer}** steps. So ${r.a} − ${r.b} = **${r.answer}**.` : `We landed on **${r.answer}**.`, { wait: false });
    await d.sleep(2400);
  } else {
    await d.think(up ? `How many steps from ${r.b} up to ${r.a}?` : `${r.b} back from ${r.a}… where did we land?`, 2400);
  }
  await d.type(d.input(), r.answer, (t) => st().submitAnswer(t));
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.a} − ${r.b} = ${r.answer}**. Pick the quicker way!`);
}

const CAVE = {
  key: "snow-cave",
  name: "The Ice Cave",
  icon: "🌌",
  host: "Glim",
  store: useCaveCrystals,
  rounds: () => [
    roundWhere((rand) => generateCaveRound(0, rand), (r) => r.kind === "up" && r.a === 52 && r.b === 49),
    roundWhere((rand) => generateCaveRound(3, rand), (r) => r.kind === "back" && r.b === 4 && r.a >= 41 && r.a <= 49 && r.a % 10 >= 2),
  ],
  examples: [(d, r) => caveExample(d, r, true), (d, r) => caveExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 9 · THE LODGE YARD — friends of 100 (Cocoa)
// ---------------------------------------------------------------------------
async function yardExample(d, r, coins, first) {
  const st = () => useLodgeYard.getState();
  d.step(1, "Count up to 100c");
  await d.say(`A hot chocolate costs **${r.price}c**. We pay with **$1** — that's **100c**.`);
  if (first) await d.say(`To find the change, count up from ${r.price}c to 100c with coins.`);
  else await d.think(`From **${r.price}c**, which coin gets us to the next ten?`);
  let till = r.price;
  for (const c of coins) {
    till += c;
    d.say(`+ **${c}c** → ${till}c${till === 100 ? " — right on 100c!" : ""}`, { wait: false });
    await d.tap(d.btn(new RegExp(`^${c}c$`)), () => st().addCoin(c), { linger: 300 });
    await d.sleep(1300);
  }
  await d.tap(d.btn(/Give the change/), () => st().giveChange());
  await d.until(() => st().status === "typing");
  await d.sleep(600);
  d.step(2, "How much change?");
  const total = 100 - r.price;
  if (first) {
    d.say(`${coins.map((c) => `${c}c`).join(" + ")} = **${total}c**.`, { wait: false });
    await d.sleep(2000);
  } else {
    await d.think(`${coins.map((c) => `${c}c`).join(" + ")} = ?`, 2400);
  }
  await d.type(d.input(), total, (t) => st().submitChange(t));
  await d.until(() => st().status === "celebrate");
  await d.say(`The change is **${total}c**. Count up to the next ten, then on to 100!`);
}

const YARD = {
  key: "snow-yard",
  name: "The Lodge Yard",
  icon: "☕",
  host: "Cocoa",
  store: useLodgeYard,
  rounds: () => [
    roundWhere((rand) => generateYardRound(0, rand), (r) => r.price === 65),
    roundWhere((rand) => generateYardRound(3, rand), (r) => r.price === 48),
  ],
  examples: [(d, r) => yardExample(d, r, [5, 10, 20], true), (d, r) => yardExample(d, r, [1, 1, 50], false)],
};

// ---------------------------------------------------------------------------
// 10 · AURORA LOOKOUT — the strategy picker (Nova)
// ---------------------------------------------------------------------------
async function lookoutExample(d, r, first) {
  const st = () => useAuroraLookout.getState();
  const best = r.choices.find((c) => c.key === r.best);
  d.step(1, "Pick the easiest way");
  await d.point(d.sel(".snow-big-sum"), { ms: 300 });
  await d.say(`The sky says **${r.expr}**. Here are three ways to do it — they ALL work!`);
  if (first) {
    for (const c of r.choices) {
      await d.point(d.btn(c.show, ".snow-choices"), { ms: 1300 });
    }
    await d.say(`**${best.show}** is the easiest — that's the one I'd do in my head.`);
  } else {
    await d.think(`Which way would YOU find easiest for **${r.expr}**?`, 3600);
    await d.say(`I'd pick **${best.show}**.`, { wait: false });
  }
  await d.tap(d.btn(best.show, ".snow-choices"), () => st().choosePick(best.key));
  await d.until(() => st().status === "typing");
  await d.sleep(700);
  d.step(2, "Do it your way");
  await d.point(d.sel(".snow-exec"), { ms: 300 });
  const lines = best.steps.map((s) => s.replace(/\s*=\s*\?$/, ""));
  if (first) {
    await d.say(`Now do it, one step at a time: ${lines.slice(0, -1).join(", then ")}${lines.length > 1 ? "…" : ""}`);
    d.say(`…so it's **${r.answer}**.`, { wait: false });
  } else {
    await d.think(`${lines[lines.length - 1]} = ?`, 2600);
  }
  await d.type(d.input(), r.answer, (t) => st().submitAnswer(t));
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.expr} = ${r.answer}**. Choose the easiest way, then do it!`);
}

const LOOKOUT = {
  key: "snow-lookout",
  name: "Aurora Lookout",
  icon: "✨",
  host: "Nova",
  store: useAuroraLookout,
  rounds: () => [
    roundWhere((rand) => generateLookoutRound(3, rand), (r) => r.expr === "47 + 29"),
    roundWhere((rand) => generateLookoutRound(0, rand), (r) => r.expr === "8 + 5"),
  ],
  examples: [(d, r) => lookoutExample(d, r, true), (d, r) => lookoutExample(d, r, false)],
};

export const SNOW_DEMOS = [RANGE, RINK, GROVE, MEADOW, SLED, VILLAGE, COLONY, CAVE, YARD, LOOKOUT];
