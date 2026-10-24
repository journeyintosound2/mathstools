/**
 * FRACTION FARM — the ten challenge demos (2026-10-24). Example 1 thinks
 * aloud; example 2 asks the watcher to predict first. The farm challenges
 * are the most physical in the game — walking a fence, herding cows,
 * swapping carrots, dragging a marker or a bed edge — so the demo does
 * exactly that: the avatar really walks, the cows really trot into the pen,
 * the marker really slides. Helpers: game/demo/demoRunner.js.
 */
import { useFarmChallenge } from "../../farmChallengeStore.js";
import { useRoundUp } from "../../roundUpStore.js";
import { useOrderParts } from "../../orderPartsStore.js";
import { useCratePacking } from "../../cratePackingStore.js";
import { useMilkSplitter } from "../../milkSplitterStore.js";
import { useWeighStation } from "../../weighStationStore.js";
import { useTradingPost } from "../../tradingPostStore.js";
import { useVeggiePlot } from "../../veggiePlotStore.js";
import { usePlankGap } from "../../plankGapStore.js";
import { useFarmShop } from "../../farmShopStore.js";
import { playerState, touchInput, requestMoveTo, clearMoveTarget } from "../../sessionStore.js";
import { CHALLENGE_FENCE } from "../../../data/farm/farmLayout.js";
import { generateRound as generateFenceRound } from "../../../data/farm/fenceChallenge.js";
import { generateRoundUpRound, fieldSpots, HERD_RADIUS } from "../../../data/farm/roundUpChallenge.js";
import { generateOrderRound, sortedItems } from "../../../data/farm/orderPartsChallenge.js";
import { generateCrateRound } from "../../../data/farm/cratePackingChallenge.js";
import { generateMilkRound } from "../../../data/farm/milkSplitterChallenge.js";
import { generateWeighRound } from "../../../data/farm/weighStationChallenge.js";
import { generateTradeRound, TRADE_STALL_NAMES } from "../../../data/farm/tradingPostChallenge.js";
import { generateVeggieRound } from "../../../data/farm/veggiePlotChallenge.js";
import { generatePlankRound, PLANK_PIECES } from "../../../data/farm/plankGapChallenge.js";
import { generateShopSet } from "../../../data/farm/farmShopChallenge.js";
import { roundWhere } from "../demoKit.js";
import { useUI } from "../../../ui/effects/uiStore.js";

const at = (gen, i, pred) => roundWhere((rand) => gen(i, rand), pred);

// ---------------------------------------------------------------------------
// 1 · FENCE CHALLENGE — a fraction of a length (Pip)
// ---------------------------------------------------------------------------
const fenceX = (fromRed) => CHALLENGE_FENCE.x1 + fromRed;
const fenceZ = () => CHALLENGE_FENCE.z + 0.4;

/** Walk the avatar along the fence to x (the ◀ ▶ controls, held then tapped). */
async function walkAlongFence(d, x) {
  const st = () => useFarmChallenge.getState();
  if (d.dry()) {
    playerState.x = x;
    return;
  }
  const release = () => { touchInput.rotateRight = false; touchInput.rotateLeft = false; };
  d.cleanup(release);
  for (let guard = 0; guard < 2400 && st().status === "placing"; guard++) {
    d.check();
    const dist = x - playerState.x;
    if (Math.abs(dist) < 0.22) break;
    const right = dist > 0;
    touchInput.rotateRight = right;
    touchInput.rotateLeft = !right;
    if (Math.abs(dist) > 1.6) {
      await d.frame();
    } else {
      // Close: one step at a time so we stop on the spot.
      await d.frame();
      release();
      await d.frame();
      await d.frame();
    }
  }
  release();
}

async function fenceExample(d, r, first) {
  const st = () => useFarmChallenge.getState();
  const startX = fenceX(r.fromEnd === "red" ? 0 : r.length);
  const goalX = fenceX(r.targetFromRed);
  const amount = Math.round(r.value * r.length * 10) / 10;
  const post = r.fromEnd === "red" ? "RED" : "BLUE";
  d.step(1, "Work out the distance");
  await d.point(d.world([fenceX(0), 1.6, fenceZ()]), { ms: 300 });
  await d.say(`The fence is **${r.length} m** long — from the red post…`, { ms: 2000 });
  await d.point(d.world([fenceX(r.length), 1.6, fenceZ()]), { ms: 300 });
  await d.say(`…to the blue post.`, { ms: 1400 });
  await d.point(d.world([startX, 1.6, fenceZ()]), { ms: 300 });
  if (first) {
    await d.say(`Place the ${r.item} **${r.display}** of the way along, from the **${post}** post.`);
    await d.say(`${r.display} of ${r.length} m: split it into ${r.d} equal parts — **${r.length / r.d} m** each — and take ${r.n}: **${amount} m**.`);
  } else {
    await d.say(`This time: **${r.display}** of the way, from the **${post}** post.`);
    await d.think(`How far is ${r.display} of ${r.length} m?`);
    await d.say(`${r.length} ÷ ${r.d} = ${r.length / r.d}, and ${r.n} lots is **${amount} m** — from the ${post.toLowerCase()} post!`);
  }
  d.step(2, "Walk there");
  await d.point(d.world([goalX, 1.4, fenceZ()]), { ms: 900 });
  d.rest();
  d.say(
    useUI.getState().touchMode
      ? `Walk along the fence — push the **joystick** left or right…`
      : `Walk along the fence with the **← →** arrow keys…`,
    { wait: false },
  );
  await walkAlongFence(d, goalX);
  await d.sleep(500);
  await d.say(`${amount} m from the ${post.toLowerCase()} post. **Place it here!**`, { ms: 1800 });
  await d.tap(d.btn(/Place it here/), () => st().place(playerState.x));
  await d.until(() => st().status === "feedback");
  await d.say(`🎯 Bullseye! The closer you stand to the exact spot, the more points.`);
}

const FENCE = {
  key: "farm-fence",
  name: "Fence Challenge",
  icon: "🚜",
  host: "Pip",
  store: useFarmChallenge,
  endsOn: "feedback",
  setup(store, rounds) {
    store.getState().start();
    store.setState({ rounds, roundIndex: 0, results: [], score: 0, bullseyes: 0, status: "placing" });
  },
  rounds: () => [
    at(generateFenceRound, 0, (r) => r.n === 1 && r.d === 2 && r.fromEnd === "red"),
    at(generateFenceRound, 1, (r) => r.n === 3 && r.d === 4 && r.fromEnd === "blue"),
  ],
  examples: [(d, r) => fenceExample(d, r, true), (d, r) => fenceExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 2 · THE ROUND-UP — a fraction of an amount (Fern)
// ---------------------------------------------------------------------------
async function herd(d, cow) {
  const st = () => useRoundUp.getState();
  const [cx, cz] = cow.fieldSpot;
  if (!d.dry() && Math.hypot(playerState.x - cx, playerState.z - cz) > HERD_RADIUS - 2) {
    d.cleanup(() => clearMoveTarget());
    requestMoveTo(cx, cz + 2.5);
    await d.until(() => Math.hypot(playerState.x - cx, playerState.z - cz) < HERD_RADIUS - 2.5, { timeout: 9000, dry: () => {} }).catch(() => {});
    clearMoveTarget();
  }
  await d.tap(d.anchor(`cow-${cow.id}`), () => st().toggleCow(cow.id), { linger: 450 });
}

async function roundUpExample(d, r, first) {
  const st = () => useRoundUp.getState();
  d.step(1, "How many cows?");
  await d.say(`The herd has **${r.herd}** cows. Round up **${r.display}** of the herd into the pen.`);
  if (first) {
    await d.say(`${r.display} means: split the herd into **${r.d} equal groups**. ${r.herd} ÷ ${r.d} = **${r.groupSize}** in each group.`);
    await d.say(r.n === 1 ? `Take **1** group: **${r.target} cows**.` : `Take **${r.n}** groups: ${r.groupSize} × ${r.n} = **${r.target} cows**.`);
  } else {
    await d.think(`How many cows is ${r.display} of ${r.herd}?`);
    await d.say(`${r.herd} ÷ ${r.d} = ${r.groupSize}, and ${r.n} groups is **${r.target} cows**.`);
  }
  d.step(2, "Herd them into the pen");
  d.say(`Walk up to a cow and tap it — it trots into the pen.`, { wait: false });
  const cows = st().cows.filter((c) => c.state === "field").slice(0, r.target);
  for (let k = 0; k < cows.length; k++) {
    await herd(d, cows[k]);
    if (k > 0 && (k + 1) % r.groupSize === 0) d.say(`**${k + 1}** in the pen.`, { wait: false });
  }
  await d.sleep(800);
  await d.say(`**${r.target}** cows in the pen. That's the round-up!`, { ms: 2000 });
  await d.tap(d.btn(/That's the round-up/), () => st().submit());
  await d.until(() => st().status === "feedback");
  await d.sleep(1200);
  await d.say(`Watch: the herd lines up in **${r.d} equal groups** — and ${r.n === 1 ? "one group is" : `${r.n} groups are`} in the pen!`);
}

const ROUNDUP = {
  key: "farm-roundup",
  name: "The Round-Up",
  icon: "🐄",
  host: "Fern",
  store: useRoundUp,
  endsOn: "feedback",
  maxPoints: 1,
  setup(store, rounds) {
    store.getState().start();
    const spots = fieldSpots(rounds[0].herd);
    store.setState({
      rounds, roundIndex: 0, results: [], score: 0, status: "herding", pennedOrder: [], formation: null, hint: null,
      cows: spots.map((s, i) => ({ id: `cow-${i}`, state: "field", fieldSpot: s })),
    });
  },
  rounds: () => [
    at(generateRoundUpRound, 0, (r) => r.n === 1 && r.d === 2 && r.herd === 8),
    at(generateRoundUpRound, 3, (r) => r.n === 2 && r.d === 3 && r.herd === 9),
  ],
  examples: [(d, r) => roundUpExample(d, r, true), (d, r) => roundUpExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 3 · ORDER THE PARTS (Alby)
// ---------------------------------------------------------------------------
/** How many swaps the demo's "put the next smallest in place" makes. */
function swapsToSort(r) {
  const want = sortedItems(r).map((x) => x.id);
  const arr = r.items.map((x) => x.id);
  let n = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === want[i]) continue;
    const j = arr.indexOf(want[i]);
    [arr[i], arr[j]] = [arr[j], arr[i]];
    n++;
  }
  return n;
}

async function orderExample(d, r, first) {
  const st = () => useOrderParts.getState();
  const sorted = sortedItems(r);
  const show = (id) => r.items.find((x) => x.id === id).display;
  d.step(1, "Smallest → largest");
  await d.say(`Order the carrots from **smallest** to **largest**: ${r.items.map((x) => `**${x.display}**`).join(", ")}.`);
  if (first) {
    if (r.items.every((x) => x.kind === "fraction" && x.display.startsWith("1/"))) {
      await d.say(`All of them are ONE piece. The more pieces a whole is cut into, the **smaller** each piece.`);
    }
    await d.say(`So the order is ${sorted.map((x) => `**${x.display}**`).join(" → ")}.`);
  } else {
    await d.think(`Which carrot is the smallest?`);
    await d.say(`**${sorted[0].display}**! Then ${sorted.slice(1).map((x) => x.display).join(", then ")}.`);
  }
  d.step(2, "Swap them into place");
  d.say(`Tap a carrot to lift it, then tap another to swap them.`, { wait: false });
  for (let pos = 0; pos < sorted.length; pos++) {
    const arr = st().arrangement;
    const want = sorted[pos].id;
    if (arr[pos] === want) continue;
    const here = arr[pos];
    await d.tap(d.anchor(`carrot-${here}`), () => st().tapItem(here), { linger: 500 });
    d.say(`Swap **${show(here)}** with **${show(want)}**.`, { wait: false });
    await d.tap(d.anchor(`carrot-${want}`), () => st().tapItem(want), { linger: 900 });
  }
  await d.sleep(500);
  await d.say(`${sorted.map((x) => x.display).join(" < ")}. **Check the order!**`, { ms: 2200 });
  await d.tap(d.btn(/Check the order/), () => st().check());
  await d.until(() => st().status === "feedback");
  await d.say(`Harvested! Every carrot is in order.`);
}

const ORDER = {
  key: "farm-order",
  name: "Order the Parts",
  icon: "🥕",
  host: "Alby",
  store: useOrderParts,
  endsOn: "feedback",
  setup(store, rounds) {
    store.getState().start();
    store.setState({ rounds, roundIndex: 0, results: [], score: 0, selectedId: null, status: "ordering", arrangement: rounds[0].items.map((it) => it.id) });
  },
  rounds: () => [
    at(generateOrderRound, 0, (r) => swapsToSort(r) <= 2),
    at(generateOrderRound, 3, (r) => swapsToSort(r) <= 3),
  ],
  examples: [(d, r) => orderExample(d, r, true), (d, r) => orderExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 4 · CRATE PACKING — the highest common factor (Robot)
// ---------------------------------------------------------------------------
async function crateExample(d, r, first, last) {
  const st = () => useCratePacking.getState();
  const h = r.hcf;
  d.step(1, "Find the biggest group size");
  await d.point(d.anchor("crate-pile-0"), { ms: 300 });
  await d.say(`**${r.n1}** apples…`, { ms: 1400 });
  await d.point(d.anchor("crate-pile-1"), { ms: 300 });
  await d.say(`…and **${r.n2}** pears. Both piles must pack into the SAME size groups, with nothing left over.`);
  if (first) {
    await d.say(`Groups of **${h}**: ${r.n1} = ${r.n1 / h} groups, ${r.n2} = ${r.n2 / h} groups — nothing left over!`);
    await d.say(`Anything bigger leaves fruit over. So **${h}** is the biggest.`, { ms: 2600 });
  } else {
    await d.think(`What's the BIGGEST group size that fits both ${r.n1} and ${r.n2}?`);
    await d.say(`**${h}**! ${r.n1} = ${r.n1 / h} × ${h} and ${r.n2} = ${r.n2 / h} × ${h}.`);
  }
  d.step(2, "Tap that crate");
  await d.tap(d.anchor(`crate-size-${h}`), () => st().choose(h));
  await d.until(() => st().status === "feedback");
  await d.say(`Watch them pack — no fruit left over!`, { ms: 2600 });
  if (!last) await d.until(() => st().roundIndex === 1, { timeout: 15000, dry: () => st().next() });
}

const CRATE = {
  key: "farm-crate",
  name: "Crate Packing",
  icon: "📦",
  host: "Robot",
  store: useCratePacking,
  endsOn: "feedback",
  rounds: () => [
    at(generateCrateRound, 0, (r) => r.hcf === 3 && r.n1 + r.n2 === 15),
    at(generateCrateRound, 3, (r) => r.hcf === 4 && r.n1 + r.n2 === 20),
  ],
  examples: [(d, r) => crateExample(d, r, true, false), (d, r) => crateExample(d, r, false, true)],
};

// ---------------------------------------------------------------------------
// 5 · THE MILK SPLITTER — terminating vs recurring (The Milkman)
// ---------------------------------------------------------------------------
async function milkExample(d, r, first) {
  const st = () => useMilkSplitter.getState();
  const stops = r.isTerminating;
  d.step(1, "Stops or repeats?");
  await d.say(`**${r.n} L** of milk shared between **${r.d}** jugs: ${r.n} ÷ ${r.d}.`);
  await d.point(d.anchor("milk-chute-stops"), { ms: 300 });
  await d.say(`Will each share **STOP**…`, { ms: 1400 });
  await d.point(d.anchor("milk-chute-repeats"), { ms: 300 });
  await d.say(`…or **REPEAT** forever?`, { ms: 1400 });
  if (first) await d.say(stops ? `${r.n} ÷ ${r.d} = **${r.notation}** — it comes out exactly. It **STOPS**.` : `${r.n} ÷ ${r.d} never comes out even — **REPEATS**.`);
  else {
    await d.think(`${r.n} ÷ ${r.d}: does it stop, or go on forever?`);
    await d.say(stops ? `It **STOPS**!` : `It **REPEATS**: ${r.notation.replace(/̇/g, "")}${r.notation.replace(/̇/g, "").slice(-1)}${r.notation.replace(/̇/g, "").slice(-1)}… forever!`, { ms: 2400 });
  }
  await d.tap(d.anchor(stops ? "milk-chute-stops" : "milk-chute-repeats"), () => st().predict(stops));
  d.say(`Watch the machine divide…`, { wait: false });
  await d.until(() => st().status === "labelling", { timeout: 20000, dry: () => st().pourDone() });
  await d.sleep(600);
  d.step(2, "How is it written?");
  const opt = r.options[r.correctIndex];
  if (first) await d.say(stops ? `It stopped at **${opt}** — no dot needed.` : `A dot over a digit means **it repeats forever**: **${opt}**.`);
  else await d.think(`Which jug shows it written the right way?`, 2600);
  await d.tap(d.anchor(`milk-jug-${r.correctIndex}`), () => st().chooseNotation(r.correctIndex));
  await d.until(() => st().status === "celebrate");
  await d.say(stops ? `**${r.n} ÷ ${r.d} = ${opt}** — it stops!` : `**${r.n} ÷ ${r.d} = ${opt}** — the dot shows it repeats.`);
}

const MILK = {
  key: "farm-milk",
  name: "The Milk Splitter",
  icon: "🥛",
  host: "The Milkman",
  store: useMilkSplitter,
  rounds: () => [
    at(generateMilkRound, 0, (r) => r.n === 1 && r.d === 4 && r.isTerminating),
    at(generateMilkRound, 3, (r) => r.n === 1 && r.d === 3 && !r.isTerminating),
  ],
  examples: [(d, r) => milkExample(d, r, true), (d, r) => milkExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 6 · THE WEIGH STATION — rounding on a number line (The Weigh Master)
// ---------------------------------------------------------------------------
async function weighExample(d, r, first) {
  const st = () => useWeighStation.getState();
  d.step(1, "Find it on the beam");
  await d.say(`The ${r.produce} weighs **${r.exactStr}**.`, { ms: 2000 });
  await d.point(d.anchor("weigh-frac-0"), { ms: 300 });
  await d.say(`The beam starts at **${r.lowerStr}**…`, { ms: 1600 });
  await d.point(d.anchor("weigh-frac-20"), { ms: 300 });
  await d.say(`…and ends at **${r.upperStr}**.`, { ms: 1600 });
  const pct = Math.round(r.needleFrac * 100);
  if (first) await d.say(r.isTie ? `${r.exactStr} is **exactly halfway**.` : `${r.exactStr} is about **${pct}%** of the way along.`);
  else await d.think(`Where does ${r.exactStr} sit on the beam?`);
  const from = st().markerFrac;
  await d.drag(d.anchor("weigh-marker"), d.anchor("weigh-goal"), (t) => st().setMarkerFrac(from + (r.needleFrac - from) * t), { ms: 1600 });
  st().setMarkerFrac(r.needleFrac);
  await d.tap(d.btn(/Lock it in/), () => st().lockIn());
  await d.until(() => st().status === "typing");
  await d.sleep(700);
  d.step(2, `Round to ${r.place}`);
  const up = r.needleFrac >= 0.5;
  const ans = r.correctStr.replace(/\s*kg$/, "").replace(/^\$/, "");
  if (first) await d.say(r.isTie ? `Halfway always rounds **UP** — to **${r.correctStr}**.` : `It's closer to **${up ? r.upperStr : r.lowerStr}** — so **${r.correctStr}**.`);
  else await d.think(`Is it closer to ${r.lowerStr} or ${r.upperStr}?`, 2600);
  await d.type(d.input(), ans, (t) => st().submitRounded(t));
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.exactStr} ≈ ${r.correctStr}**. Find it on the beam, then round to the closer end.`);
}

const WEIGH = {
  key: "farm-weigh",
  name: "The Weigh Station",
  icon: "⚖️",
  host: "The Weigh Master",
  store: useWeighStation,
  rounds: () => [
    at(generateWeighRound, 0, (r) => r.kind === "round" && r.isTie && !r.money),
    at(generateWeighRound, 3, (r) => r.kind === "round" && !r.money && r.needleFrac >= 0.65 && r.needleFrac <= 0.85),
  ],
  examples: [(d, r) => weighExample(d, r, true), (d, r) => weighExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 7 · THE TRADING POST — fraction / decimal / percent (Steve)
// ---------------------------------------------------------------------------
async function tradeExample(d, r, first) {
  const st = () => useTradingPost.getState();
  d.step(1, "Same value, new language");
  await d.say(`${TRADE_STALL_NAMES[r.sourceStall] || "A stall"} sells ${r.item} for **${r.sourceDisplay}**. Pay the other two stalls the SAME amount — in their language.`);
  for (const t of r.targets) {
    const tag = t.tags[t.correctIndex];
    if (first) await d.say(`At ${TRADE_STALL_NAMES[t.stall]}: **${r.sourceDisplay} = ${tag}**.`, { ms: 2600 });
    else {
      await d.think(`${r.sourceDisplay} at ${TRADE_STALL_NAMES[t.stall]} is…?`, 2600);
      d.say(`**${tag}**!`, { wait: false });
    }
    await d.tap(d.anchor(`trade-tag-${t.stall}-${t.correctIndex}`), () => st().tapTag(t.stall, t.correctIndex), { linger: 700 });
  }
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.chain}** — one value, three ways to write it. Watch out for ×10 tricksters!`);
}

const TRADE = {
  key: "farm-trade",
  name: "The Trading Post",
  icon: "🏪",
  host: "Steve",
  store: useTradingPost,
  rounds: () => [
    at(generateTradeRound, 0, (r) => r.sourceDisplay === "0.25" || r.sourceDisplay === "1/2" || r.sourceDisplay === "50%"),
    at(generateTradeRound, 3, (r) => !r.bulk && r.targets.length === 2),
  ],
  examples: [(d, r) => tradeExample(d, r, true), (d, r) => tradeExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 8 · THE VEGGIE PLOT — multiplying fractions (Trevor)
// ---------------------------------------------------------------------------
async function veggieExample(d, r, first) {
  const st = () => useVeggiePlot.getState();
  d.step(1, "Plant the bed");
  await d.say(`Plant a bed **${r.widthStr}** of the width and **${r.lengthStr}** of the length.`);
  if (first) await d.say(`The width is cut into **${r.gridCols}** strips — drag the edge to **${r.targetCols}** of them.`, { ms: 2800 });
  else await d.think(`Where should the width edge go for ${r.widthStr}?`, 2400);
  const c0 = st().cols;
  await d.drag(d.anchor(`veggie-w-${c0}`), d.anchor(`veggie-w-${r.targetCols}`), (t) => st().setCols(Math.round(c0 + (r.targetCols - c0) * t)), { ms: 1200 });
  st().setCols(r.targetCols);
  if (first) await d.say(`The length is cut into **${r.gridRows}** — drag that edge to **${r.targetRows}**.`, { ms: 2600 });
  else d.say(`…and ${r.lengthStr} of the length.`, { wait: false });
  const r0 = st().rows;
  await d.drag(d.anchor(`veggie-l-${r0}`), d.anchor(`veggie-l-${r.targetRows}`), (t) => st().setRows(Math.round(r0 + (r.targetRows - r0) * t)), { ms: 1200 });
  st().setRows(r.targetRows);
  await d.tap(d.btn(/Lock the bed/), () => st().lockPlace());
  await d.until(() => st().status === "typing");
  await d.sleep(700);
  d.step(2, "Read the harvest");
  d.rest();
  const [n, dd] = r.productStr.split("/");
  if (first) await d.say(`The shaded overlap is **${r.prodN}** of the **${r.prodD}** little plots: **${r.productStr}**.`);
  else await d.think(`How many of the little plots are planted — out of how many?`, 2800);
  await d.type(d.input(0), n, null, { noSubmit: true });
  await d.type(d.input(1), dd, null, { noSubmit: true });
  await d.tap(d.btn(/Harvest/), () => st().submitProduct(r.productStr));
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.widthStr} × ${r.lengthStr} = ${r.productStr}** — the overlap IS the answer.`);
}

const VEGGIE = {
  key: "farm-veggie",
  name: "The Veggie Plot",
  icon: "🥬",
  host: "Trevor",
  store: useVeggiePlot,
  rounds: () => [
    at(generateVeggieRound, 0, (r) => r.kind === "area" && r.widthStr === "1/3" && r.lengthStr === "1/2"),
    at(generateVeggieRound, 3, (r) => r.kind === "area" && r.prodD <= 12 && r.targetCols + r.targetRows <= 5),
  ],
  examples: [(d, r) => veggieExample(d, r, true), (d, r) => veggieExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 9 · PLANK THE GAP — adding fractions (Woody)
// ---------------------------------------------------------------------------
function planksFor(tw) {
  const out = [];
  let left = tw;
  for (const p of PLANK_PIECES) {
    while (left >= p.tw && out.length < 4) {
      out.push(p);
      left -= p.tw;
    }
  }
  return left === 0 ? out : null;
}

async function plankExample(d, r, first) {
  const st = () => usePlankGap.getState();
  const plan = planksFor(r.gapTw) || [];
  d.step(1, "Fill the gap exactly");
  await d.say(`The gap is **${r.gapStr}** wide. Lay planks that add up to EXACTLY ${r.gapStr}.`);
  if (first) await d.say(`Every plank snaps to twelfths: ${r.gapStr} = **${r.gapTw}/12**. ${plan.map((p) => `${p.label} = ${p.tw}/12`).join(", ")}.`);
  else await d.think(`Which planks add up to ${r.gapStr}?`);
  if (!first) await d.say(`**${plan.map((p) => p.label).join(" + ")}**!`, { ms: 1600 });
  for (const p of plan) {
    await d.tap(d.btn(new RegExp(`^${p.label.replace("/", "\\/")}$`)), () => st().addPlank(p.tw), { linger: 700 });
  }
  await d.say(`${plan.map((p) => `${p.tw}/12`).join(" + ")} = **${r.gapTw}/12 = ${r.gapStr}**. **Fill it!**`, { ms: 2400 });
  await d.tap(d.btn(/Fill it/), () => st().check());
  await d.until(() => st().status === "celebrate");
  await d.say(`Gap filled — **${plan.map((p) => p.label).join(" + ")} = ${r.gapStr}**!`);
}

const PLANK = {
  key: "farm-plank",
  name: "Plank the Gap",
  icon: "🪵",
  host: "Woody",
  store: usePlankGap,
  rounds: () => [
    at(generatePlankRound, 0, (r) => r.kind === "add" && r.gapTw === 9),
    at(generatePlankRound, 3, (r) => r.kind === "add" && r.gapTw === 10),
  ],
  examples: [(d, r) => plankExample(d, r, true), (d, r) => plankExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 10 · THE FARM SHOP — percentages (Sunny)
// ---------------------------------------------------------------------------
async function shopExample(d, r, first, think) {
  const st = () => useFarmShop.getState();
  const ans = String(r.answerStr).replace(/^\$/, "").replace(/%$/, "");
  d.step(1, "Read the job");
  await d.say(r.prompt, { ms: 3600 });
  if (first) await d.say(think);
  else {
    await d.think(`Have a think — what's the answer?`, 3000);
    await d.say(think, { ms: 2800 });
  }
  d.step(2, "Ring it up");
  await d.type(d.input(), ans, (t) => { st().setInput(t); st().check(); }, { submitBtn: /Ring it up/ });
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.answerStr}** — rung up!`);
}

const SHOP = {
  key: "farm-shop",
  name: "The Farm Shop",
  icon: "🏪",
  host: "Sunny",
  store: useFarmShop,
  rounds: () => [
    roundWhere((rand) => generateShopSet(rand)[0], (r) => r.kind === "percentof" && r.given.a === 12 && r.given.b === 48),
    roundWhere((rand) => generateShopSet(rand)[2], (r) => r.kind === "markup" && r.answer === 15),
  ],
  examples: [
    (d, r) => shopExample(d, r, true, `12 out of 48 is the same as 1 out of 4 — a quarter. A quarter is **25%**.`),
    (d, r) => shopExample(d, r, false, `50% of $10 is $5. So the sell price is $10 + $5 = **$15**.`),
  ],
};

export const FARM_DEMOS = [FENCE, ROUNDUP, ORDER, CRATE, MILK, WEIGH, TRADE, VEGGIE, PLANK, SHOP];
