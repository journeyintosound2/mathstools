/**
 * MAGMA MULTIPLES — the ten challenge demos (2026-10-24). Same shape as the
 * Snowball Sums demos: example 1 thinks aloud, example 2 asks the watcher to
 * predict first. Every Magma card shares MagmaPanelShell, so the hand taps
 * the same kinds of buttons everywhere (big tap buttons + a number box with
 * Check). Helpers: game/demo/demoRunner.js.
 */
import { useColumnsChallenge } from "../../magma/stores/columnsStore.js";
import { useObsidianChallenge } from "../../magma/stores/obsidianStore.js";
import { useTerracesChallenge } from "../../magma/stores/terracesStore.js";
import { useGeysersChallenge } from "../../magma/stores/geysersStore.js";
import { useForgeChallenge } from "../../magma/stores/forgeStore.js";
import { useGardenChallenge } from "../../magma/stores/gardenStore.js";
import { useCinderChallenge } from "../../magma/stores/cinderStore.js";
import { useLakeChallenge } from "../../magma/stores/lakeStore.js";
import { useBonesChallenge } from "../../magma/stores/bonesStore.js";
import { useSummitChallenge } from "../../magma/stores/summitStore.js";
import { getMagmaChallenge } from "../../../data/magma/magmaChallenges.js";
import { generateColumnsSet } from "../../../data/magma/columnsChallenge.js";
import { generateObsidianSet } from "../../../data/magma/obsidianChallenge.js";
import { generateTerracesSet } from "../../../data/magma/terracesChallenge.js";
import { generateGeysersSet } from "../../../data/magma/geysersChallenge.js";
import { generateForgeSet } from "../../../data/magma/forgeChallenge.js";
import { generateGardenSet, GARDEN_FLOWERS } from "../../../data/magma/gardenChallenge.js";
import { generateCinderSet } from "../../../data/magma/cinderChallenge.js";
import { generateLakeSet, lakeChunks, lakeButtons } from "../../../data/magma/lakeChallenge.js";
import { generateBonesSet, BONE_NAMES } from "../../../data/magma/bonesChallenge.js";
import { generateSummitSet } from "../../../data/magma/summitChallenge.js";
import { fmtThousandths } from "../../../data/magma/magmaMath.js";
import { roundWhere } from "../demoKit.js";

/** A round at index i of a seeded set that fits `pred`. */
const pickRound = (gen, i, pred, opts) => roundWhere((rand) => gen(rand)[i], pred, { tries: 1500, ...opts });

function meta(key) {
  const m = getMagmaChallenge(key);
  return { name: m.name, icon: m.icon, host: m.host.name };
}

const btn = (d, re) => d.btn(re);
const num = (d) => d.input();

// ---------------------------------------------------------------------------
// 1 · COLUMN RECTANGLES — arrays + factor pairs (Mr. Dawson)
// ---------------------------------------------------------------------------
async function columnsExample(d, r, first) {
  const st = () => useColumnsChallenge.getState();
  const setRows = async (to) => {
    const dir = to > st().rows ? 1 : -1;
    const n = Math.abs(to - st().rows);
    await d.tapTimes(btn(d, dir > 0 ? /^\+$/ : /^−$/), n, () => st().stepRows(dir), { gap: 520 });
    await d.sleep(500);
  };
  const keep = async () => d.tap(btn(d, /Keep it/), () => st().keep());
  const readout = () => d.sel(".magma-readout");
  d.step(1, "Stand the columns in rows");
  await d.say(`**${r.n}** columns. Let's find EVERY rectangle they can make — one row, two rows, three rows…`);
  const pairs = r.pairs; // [[1, n], [2, n/2] …] — rows ≤ columns
  for (let k = 0; k < pairs.length; k++) {
    const [rows, per] = pairs[k];
    await setRows(rows);
    await d.point(readout(), { ms: 300 });
    if (first || k === 0) await d.say(`**${rows} row${rows > 1 ? "s" : ""} of ${per}** — it fits! **Keep it.**`, { ms: 2400 });
    else await d.think(`${rows} rows of ${per}… does it fit?`, 1800);
    await keep();
    await d.sleep(500);
  }
  const [lastRows, lastPer] = pairs[pairs.length - 1];
  if (first) {
    // One that doesn't fit, then one that's just a kept rectangle turned.
    const miss = lastRows + 1;
    await setRows(miss);
    await d.point(readout(), { ms: 300 });
    await d.say(`${miss} rows? **${r.n - miss * Math.floor(r.n / miss)} left over** — they glow red. Not a rectangle!`);
    const turned = lastPer;
    if (turned > miss && turned - miss <= 3 && turned !== lastRows) {
      await setRows(turned);
      await d.point(readout(), { ms: 300 });
      await d.say(`${turned} rows of ${lastRows}? That's just **${lastRows} × ${lastPer} turned around** — we have it already.`);
    }
  }
  d.step(2, "Found them all?");
  if (first) await d.say(`After ${lastRows} rows, the rectangles only turn around. So that's all of them!`, { ms: 2600 });
  else await d.think(`${pairs.length} rectangles… is that ALL of them?`, 2600);
  await d.tap(btn(d, /That's all/), () => st().claim());
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.n}** = ${pairs.map(([a, b]) => `${a} × ${b}`).join(", ")}. Go in order so you never miss one!`);
}

const COLUMNS = {
  key: "magma-columns",
  ...meta("columns"),
  store: useColumnsChallenge,
  rounds: () => [
    pickRound(generateColumnsSet, 0, (r) => r.n === 8),
    pickRound(generateColumnsSet, 3, (r) => r.n === 12),
  ],
  examples: [(d, r) => columnsExample(d, r, true), (d, r) => columnsExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 2 · CRACK THE CRYSTAL — the area model (Ms. Mahoney)
// ---------------------------------------------------------------------------
async function obsidianExample(d, r, first, crackAt) {
  const st = () => useObsidianChallenge.getState();
  d.step(1, "Move the crack");
  await d.say(`**${r.a} × ${r.b}**: a crystal ${r.a} rows tall and ${r.b} columns wide.`);
  if (first) await d.say(`${r.a} × ${r.b} is tricky… but ${r.a} × **${crackAt}** is easy! Move the crack to **${crackAt}**.`);
  else await d.think(`Where should the crack go so both pieces are easy?`);
  if (!first) await d.say(`At **${crackAt}** — the tens!`, { wait: false });
  const n = Math.abs(crackAt - st().cols);
  const dir = crackAt > st().cols ? 1 : -1;
  await d.tapTimes(btn(d, dir > 0 ? /^▶$/ : /^◀$/), n, () => st().moveCrack(dir), { gap: 260 });
  await d.point(d.sel(".magma-readout"), { ms: 300 });
  await d.say(`${r.a} × ${r.b} = ${r.a} × ${crackAt} + ${r.a} × ${r.b - crackAt}. **Crack!**`, { ms: 2600 });
  await d.tap(btn(d, /Crack!/), () => st().lockCrack());
  await d.until(() => st().phase === "pieces");
  await d.sleep(700);
  d.step(2, "Work out each piece");
  for (let i = 0; i < st().pieces.length; i++) {
    const p = st().pieces[i];
    if (first) d.say(`${p.rows} × ${p.cols} = **${p.value}**.`, { wait: false });
    else await d.think(`${p.rows} × ${p.cols} = ?`, 2000);
    await d.sleep(first ? 900 : 100);
    await d.type(num(d), p.value, (t) => st().submitPiece(t));
    await d.sleep(500);
  }
  d.step(3, "Put them together");
  const [a, b] = st().pieces;
  if (first) d.say(`${a.value} + ${b.value} = **${r.product}**.`, { wait: false });
  else await d.think(`${a.value} + ${b.value} = ?`, 2200);
  await d.sleep(first ? 1300 : 100);
  await d.type(num(d), r.product, (t) => st().submitTotal(t));
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.a} × ${r.b} = ${r.product}**. Crack it into pieces you know!`);
}

const OBSIDIAN = {
  key: "magma-obsidian",
  ...meta("obsidian"),
  store: useObsidianChallenge,
  rounds: () => [
    pickRound(generateObsidianSet, 0, (r) => r.a === 7 && r.b === 8),
    pickRound(generateObsidianSet, 3, (r) => r.a === 4 && r.b === 23),
  ],
  examples: [(d, r) => obsidianExample(d, r, true, 5), (d, r) => obsidianExample(d, r, false, 20)],
};

// ---------------------------------------------------------------------------
// 3 · TENFOLD TERRACES — the ×10 idea (Ms. Ewings)
// ---------------------------------------------------------------------------
async function terracesExample(d, r, first) {
  const st = () => useTerracesChallenge.getState();
  const up = r.shift > 0;
  const n = Math.abs(r.shift);
  d.step(1, "Slide the digits");
  await d.say(`**${r.text}**. Each terrace is **10 times** the one below it.`);
  if (first) await d.say(`× 10 slides every digit **up one terrace**. The point never moves.`);
  else await d.think(`${r.text}… which way do the digits slide, and how far?`);
  if (!first) await d.say(`${up ? "Up" : "Down"} ${n} terrace${n > 1 ? "s" : ""}!`, { wait: false });
  await d.tapTimes(btn(d, up ? /× 10/ : /÷ 10/), n, () => st().slide(up ? 1 : -1), { gap: 900 });
  await d.sleep(700);
  await d.tap(btn(d, /Lock it/), () => st().lock());
  await d.until(() => st().phase === "type");
  await d.sleep(900);
  d.step(2, "Say the number");
  const ans = fmtThousandths(r.result);
  if (first) d.say(`The digits now say **${ans}**.`, { wait: false });
  else await d.think(`What number do the digits make now?`, 2400);
  await d.sleep(first ? 1300 : 100);
  await d.type(num(d), ans, (t) => st().submitResult(t));
  await d.until(() => st().status === "celebrate");
  await d.say(first ? `**${r.text} = ${ans}**. Every digit moved up one terrace.` : `**${r.text} = ${ans}** — not ${fmtThousandths(r.start)}0! The digits move, the point stays.`);
}

const TERRACES = {
  key: "magma-terraces",
  ...meta("terraces"),
  store: useTerracesChallenge,
  rounds: () => [
    pickRound(generateTerracesSet, 0, (r) => r.text === "47 × 10"),
    pickRound(generateTerracesSet, 3, (r) => r.text === "3.5 × 10"),
  ],
  examples: [(d, r) => terracesExample(d, r, true), (d, r) => terracesExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 4 · HALVE & DOUBLE (Mr. Heywood)
// ---------------------------------------------------------------------------
async function geysersExample(d, r, first, halvings) {
  const st = () => useGeysersChallenge.getState();
  const halveRows = r.a % 2 === 0 && r.b % 5 === 0;
  d.step(1, "Halve and double");
  await d.say(`**${r.a} × ${r.b}**: a terrace of ${r.a * r.b} tiles.`);
  let [a, b] = [r.a, r.b];
  for (let k = 0; k < halvings; k++) {
    const which = halveRows ? "rows" : "cols";
    const h = which === "rows" ? a : b;
    const o = which === "rows" ? b : a;
    if (first || k > 0) await d.say(`Halve the **${h}**, double the **${o}** — same tiles, new shape.`, { ms: 2400 });
    else {
      await d.think(`Which number should we halve?`, 2600);
      d.say(`The **${h}** — it halves nicely. Then double the **${o}**.`, { wait: false });
      await d.sleep(1400);
    }
    await d.tap(btn(d, new RegExp(`Halve the ${h}\\b`)), () => st().move(which));
    await d.sleep(1600);
    [a, b] = which === "rows" ? [a / 2, b * 2] : [a * 2, b / 2];
    await d.say(`Now it's **${a} × ${b}**.`, { ms: 1800 });
  }
  d.step(2, "Easy now — solve it");
  if (first) await d.say(`${a} × ${b} is EASY. Stop and solve it!`, { ms: 2000 });
  await d.tap(btn(d, /solve it/), () => st().solve());
  await d.until(() => st().phase === "type");
  if (first) d.say(`${a} × ${b} = **${r.product}**.`, { wait: false });
  else await d.think(`${a} × ${b} = ?`, 2200);
  await d.sleep(first ? 1200 : 100);
  await d.type(num(d), r.product, (t) => st().submit(t));
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.a} × ${r.b} = ${r.product}**. Halve one, double the other, until it's easy!`);
}

const GEYSERS = {
  key: "magma-geysers",
  ...meta("geysers"),
  store: useGeysersChallenge,
  rounds: () => [
    pickRound(generateGeysersSet, 0, (r) => r.a === 16 && r.b === 5),
    pickRound(generateGeysersSet, 3, (r) => r.a === 16 && r.b === 25),
  ],
  examples: [(d, r) => geysersExample(d, r, true, 1), (d, r) => geysersExample(d, r, false, 2)],
};

// ---------------------------------------------------------------------------
// 5 · FACTOR FORGE (Robot)
// ---------------------------------------------------------------------------
async function forgeExample(d, r, first, plan) {
  const st = () => useForgeChallenge.getState();
  const ingot = (v) => d.btn(new RegExp(`^${v}$`), ".magma-row");
  const idx = (v) => st().ingots.indexOf(v);
  const select = (v) => d.tap(ingot(v), () => st().select(idx(v)));
  const { split, pair, friendly, rest } = plan; // e.g. split 14 → [2, 7], fuse 5 × 2, then × 7
  d.step(1, "Hammer an ingot");
  await d.say(`Forge **${r.ingots.join(" × ")}** into one ingot.`);
  if (first) await d.say(`If we make a **10** or a **100** first, the rest is easy. ${friendly[0]} needs a **${friendly[1]}**…`);
  else await d.think(`${friendly[0]} × what makes a friendly ${friendly[0] * friendly[1]}?`);
  await d.say(`Tap **${split}** to hammer it: ${split} = ${pair[0]} × ${pair[1]}.`, { wait: false });
  await select(split);
  await d.tap(d.btn(new RegExp(`^${pair[0]} × ${pair[1]}$`)), () => st().split(pair));
  await d.sleep(1200);
  d.step(2, "Fuse a friendly number");
  await d.say(`Tap **${friendly[0]}** and **${friendly[1]}** to fuse them.`, { wait: false });
  await select(friendly[0]);
  await select(friendly[1]);
  const f = friendly[0] * friendly[1];
  if (first) d.say(`${friendly[0]} × ${friendly[1]} = **${f}** — friendly!`, { wait: false });
  else await d.think(`${friendly[0]} × ${friendly[1]} = ?`, 1800);
  await d.sleep(first ? 900 : 100);
  await d.type(num(d), f, (t) => st().fuse(t));
  await d.sleep(1200);
  d.step(3, "Finish the job");
  await select(f);
  await select(rest);
  if (first) d.say(`${f} × ${rest} = **${r.product}**.`, { wait: false });
  else await d.think(`${f} × ${rest} = ?`, 2000);
  await d.sleep(first ? 900 : 100);
  await d.type(num(d), r.product, (t) => st().fuse(t));
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.ingots.join(" × ")} = ${r.product}**. Make a friendly ten or hundred first!`);
}

const FORGE = {
  key: "magma-forge",
  ...meta("forge"),
  store: useForgeChallenge,
  rounds: () => [
    pickRound(generateForgeSet, 0, (r) => r.ingots[0] === 5 && r.ingots[1] === 14),
    pickRound(generateForgeSet, 3, (r) => r.ingots[0] === 25 && r.ingots[1] === 24),
  ],
  examples: [
    (d, r) => forgeExample(d, r, true, { split: 14, pair: [2, 7], friendly: [5, 2], rest: 7 }),
    (d, r) => forgeExample(d, r, false, { split: 24, pair: [4, 6], friendly: [25, 4], rest: 6 }),
  ],
};

// ---------------------------------------------------------------------------
// 6 · FLOWER COMBOS — for each (Trevor)
// ---------------------------------------------------------------------------
async function gardenExample(d, r, first) {
  const st = () => useGardenChallenge.getState();
  d.step(1, "How many combos?");
  await d.say(`**${r.f}** flowers and **${r.p}** pots. Every flower can go in every pot.`);
  if (first) await d.say(`For EACH flower there's a whole row of ${r.p} pots: ${r.f} × ${r.p} = **${r.total}** combos.`);
  else await d.think(`How many different flower + pot combos?`, 3000);
  if (!first) d.say(`${r.f} × ${r.p} = **${r.total}**!`, { wait: false });
  await d.type(num(d), r.total, (t) => st().submitPredict(t));
  await d.until(() => st().phase === "plant");
  await d.sleep(800);
  d.step(2, "Plant them all");
  for (let i = 0; i < r.f; i++) {
    const fl = GARDEN_FLOWERS[i].name;
    if (i === 0) d.say(`Pick the **${fl}**… then put it in EVERY pot.`, { wait: false });
    else d.say(`Now the **${fl}** in every pot.`, { wait: false });
    await d.tap(d.btn(fl, ".magma-picker"), () => st().choose("f", i));
    await d.tap(d.btn(/in EVERY pot/), () => st().plantRow());
    await d.sleep(800);
  }
  await d.point(d.sel(".magma-chip", /Planted/), { ms: 300 });
  await d.say(`**${r.total}** planted — ${r.f} rows of ${r.p}. That's every combo!`, { ms: 2400 });
  await d.tap(btn(d, /That's every combo/), () => st().claim());
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.f} × ${r.p} = ${r.total}** combos. For each flower, a whole row!`);
}

const GARDEN = {
  key: "magma-garden",
  ...meta("garden"),
  store: useGardenChallenge,
  rounds: () => [
    pickRound(generateGardenSet, 0, (r) => r.f === 3 && r.p === 4 && r.g === 1),
    pickRound(generateGardenSet, 3, (r) => r.f === 4 && r.p === 5 && r.g === 1 && !r.inverse),
  ],
  examples: [(d, r) => gardenExample(d, r, true), (d, r) => gardenExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 7 · CART TABLES — ratio tables (Steve)
// ---------------------------------------------------------------------------
async function cinderExample(d, r, plan, first) {
  const st = () => useCinderChallenge.getState();
  const col = (i) => d.sel(`.magma-table button.magma-col:nth-of-type(${i + 1})`);
  const opBtn = (id) => d.btn({ x2: /^× 2$/, h2: /^÷ 2$/, x10: /^× 10$/, d10: /^÷ 10$/, add: /^\+$/, sub: /^−$/ }[id]);
  d.step(1, "Build the table");
  await d.point(col(0), { ms: 300 });
  await d.say(`**1 cart** carries **${r.r0} rocks**. How many rocks fill **${r.targetCarts}** carts?`);
  for (let k = 0; k < plan.length; k++) {
    const p = plan[k];
    if (p.select) {
      for (const i of p.select) {
        if (!st().sel.includes(i)) await d.tap(col(i), () => st().select(i));
      }
    }
    if (first || k > 0) await d.say(p.say, { ms: 2200 });
    else await d.think(p.think || p.say, 2400);
    await d.tap(opBtn(p.op), () => st().op(p.op));
    await d.until(() => Boolean(st().pending));
    const pend = st().pending;
    if (first) d.say(`${pend.carts} carts → ${pend.hint} = **${pend.rocks}** rocks.`, { wait: false });
    else await d.think(`${pend.carts} carts → how many rocks?`, 1800);
    await d.sleep(first ? 1200 : 100);
    await d.type(num(d), pend.rocks, (t) => st().submitRocks(t));
    await d.sleep(900);
  }
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.targetCarts} carts carry ${r.targetRocks} rocks**. Build the table with moves you know!`);
}

const CINDER = {
  key: "magma-cinder",
  ...meta("cinder"),
  store: useCinderChallenge,
  rounds: () => [
    pickRound(generateCinderSet, 0, (r) => r.c0 === 1 && r.r0 === 6 && r.targetCarts === 4 && r.min === 2),
    pickRound(generateCinderSet, 3, (r) => r.c0 === 1 && r.r0 === 8 && r.targetCarts === 15 && r.min === 3),
  ],
  examples: [
    (d, r) => cinderExample(d, r, [
      { op: "x2", say: `Double it! **× 2** makes 2 carts.` },
      { op: "x2", say: `Double again — **× 2** makes 4 carts.` },
    ], true),
    (d, r) => cinderExample(d, r, [
      { op: "x10", say: `**× 10** makes 10 carts.`, think: `15 carts… which move gets us close first?` },
      { op: "h2", say: `Half of 10 carts is 5 carts: **÷ 2**.` },
      { op: "add", select: [1, 2], say: `10 carts + 5 carts = 15! Tap both columns, then **+**.` },
    ], false),
  ],
};

// ---------------------------------------------------------------------------
// 8 · LAVA CHANNELS — division by chunking (Mr. Pearce)
// ---------------------------------------------------------------------------
async function lakeExample(d, r, first) {
  const st = () => useLakeChallenge.getState();
  const chunks = lakeChunks(r.q);
  d.step(1, "Pour big chunks");
  await d.say(`**${r.D} ÷ ${r.d}**: pour ${r.D} lava into a channel **${r.d} wide**. How many rows?`);
  for (let k = 0; k < chunks.length; k++) {
    const c = chunks[k];
    const left = st().left;
    if (first) await d.say(`${c} rows use ${c} × ${r.d} = **${c * r.d}**. We have ${left} — it fits!`, { ms: 2600 });
    else if (k === 0) await d.think(`What's a BIG chunk of rows that fits in ${left}?`, 2600);
    else await d.say(`${left} left — that's **${c}** more rows.`, { ms: 2000 });
    if (lakeButtons(r).includes(c)) {
      await d.tap(d.btn(new RegExp(`^${c} rows?$`)), () => st().pour(c));
    } else {
      await d.type(num(d), c, () => st().pour(c), { submitBtn: /check/i });
    }
    await d.sleep(1400);
  }
  await d.until(() => st().phase === "answer");
  d.step(2, "Answer");
  if (first) d.say(`${chunks.join(" rows + ")} rows = **${r.q}** rows.`, { wait: false });
  else await d.think(`${chunks.join(" + ")} rows… how many rows altogether?`, 2400);
  await d.sleep(first ? 1400 : 100);
  await d.type(num(d), r.answer, (t) => st().submitAnswer(t));
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.D} ÷ ${r.d} = ${r.q}**. Pour big chunks you know!`);
}

const LAKE = {
  key: "magma-lake",
  ...meta("lake"),
  store: useLakeChallenge,
  rounds: () => [
    pickRound(generateLakeSet, 0, (r) => r.d === 6 && r.q === 13),
    pickRound(generateLakeSet, 3, (r) => r.d === 6 && r.q === 21),
  ],
  examples: [(d, r) => lakeExample(d, r, true), (d, r) => lakeExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 9 · GROW THE DRAGON — times as many (Ms. Brookes)
// ---------------------------------------------------------------------------
async function bonesExample(d, r, first) {
  const st = () => useBonesChallenge.getState();
  const k = r.num / r.den;
  d.step(1, "How many times as long?");
  await d.say(`The baby's skull is **${r.baby[0]}**. The grown-up's skull is **${r.adult[0]}**.`);
  if (first) await d.say(`${r.adult[0]} is **${k} times** as long as ${r.baby[0]}. So EVERY bone must be ${k} times as long!`);
  else await d.think(`How many TIMES as long is the grown-up skull?`, 2800);
  if (!first) await d.say(`**${k} times!** Not "add ${r.adult[0] - r.baby[0]}" — that makes a wonky dragon.`);
  d.step(2, "Grow every bone");
  for (let j = 0; j < 3; j++) {
    const from = st().vals[j];
    const to = r.adult[j + 1];
    d.say(`${BONE_NAMES[j + 1]}: ${r.baby[j + 1]} × ${k} = **${to}**.`, { wait: false });
    await d.sleep(900);
    await d.tapTimes(d.btn(/^\+$/, `.magma-bones > .magma-bone:nth-child(${j + 1})`), to - from, () => st().nudge(j, 1), { gap: 200 });
    await d.sleep(500);
  }
  await d.say(`Every bone is ${k} times as long. **Raise!**`, { ms: 1800 });
  await d.tap(d.btn(/Raise/), () => st().raise());
  await d.until(() => st().status === "celebrate");
  await d.say(`A perfect grown-up dragon! Multiply EVERY bone by the same number.`);
}

const BONES = {
  key: "magma-bones",
  ...meta("bones"),
  store: useBonesChallenge,
  rounds: () => [
    pickRound(generateBonesSet, 0, (r) => r.num === 2 && r.den === 1 && r.baby.every((b) => b <= 5)),
    pickRound(generateBonesSet, 1, (r) => r.num === 3 && r.den === 1 && r.baby.every((b) => b <= 4) && r.baby[0] >= 2),
  ],
  examples: [(d, r) => bonesExample(d, r, true), (d, r) => bonesExample(d, r, false)],
};

// ---------------------------------------------------------------------------
// 10 · STRATEGY SUMMIT (Ms. Bacon)
// ---------------------------------------------------------------------------
async function summitExample(d, r, first) {
  const st = () => useSummitChallenge.getState();
  const best = r.choices.find((c) => c.best);
  d.step(1, "Pick the easiest tablet");
  await d.point(d.sel(".snow-big-sum"), { ms: 300 });
  await d.say(`**${r.q}**. Three rune tablets — the same problem written three ways. All are right!`);
  if (first) {
    for (const c of r.choices) await d.point(d.btn(c.show, ".snow-choices"), { ms: 1300 });
    await d.say(`**${best.show}** is the easiest — ${best.name.toLowerCase()}!`);
  } else {
    await d.think(`Which tablet would YOU find easiest?`, 3600);
    await d.say(`I'd pick **${best.show}**.`, { wait: false });
  }
  await d.tap(d.btn(best.show, ".snow-choices"), () => st().pick(best.key));
  await d.until(() => st().phase === "work");
  await d.sleep(700);
  d.step(2, "Do it that way");
  await d.point(d.sel(".snow-exec"), { ms: 300 });
  const last = best.steps[best.steps.length - 1];
  if (first) d.say(`${last.replace(/^=\s*/, "")} = **${r.answer}**.`, { wait: false });
  else await d.think(`${last.replace(/^=\s*/, "")} = ?`, 2400);
  await d.sleep(first ? 1600 : 100);
  await d.type(num(d), r.answer, (t) => st().submit(t));
  await d.until(() => st().status === "celebrate");
  await d.say(`**${r.q} = ${r.answer}**. Choose the easiest way — then do it!`);
}

const SUMMIT = {
  key: "magma-summit",
  ...meta("summit"),
  store: useSummitChallenge,
  rounds: () => [
    pickRound(generateSummitSet, 4, (r) => r.q === "25 × 28"),
    pickRound(generateSummitSet, 5, (r) => r.q === "9 × 34"),
  ],
  examples: [(d, r) => summitExample(d, r, true), (d, r) => summitExample(d, r, false)],
};

export const MAGMA_DEMOS = [COLUMNS, OBSIDIAN, TERRACES, GEYSERS, FORGE, GARDEN, CINDER, LAKE, BONES, SUMMIT];
