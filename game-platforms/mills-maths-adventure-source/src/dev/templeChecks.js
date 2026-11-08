/**
 * TIMESTABLE TEMPLE CHECKS (TT1–TT10, 2026-11-08) — the times-table fluency
 * world: the fifteen stations, the typing-fair targets, the question decks
 * (no skip-counting, both orders, the mixes' 60/40 + no division), the round
 * (auto-submit, slips, the clock, medals, unlocks, coins), the fact records
 * (fluency on two days, spaced review), the warm-up, the strategies, the
 * journey branch, the stones in the world and the Farsi + Arabic.
 */
import {
  STATIONS, STATION_KEYS, TABLE_ORDER, FAMILIES, FAMILY, targetsFor, medalFor, makeDeck, stationPool, seeded,
  tableFacts, ALL_FACTS, strategyFor, recordAnswer, isFluent, dueFacts, warmupDeck, factKey, REVIEW_DAYS,
  readTablesBest, writeTablesBest, TABLES_BEST_KEYS, FACTS_KEY, readFactStats, stationOpen, nextStation, tablesTrophyRows,
  fastLimitMs, ROUND_SECONDS,
} from "../data/temple/templeTables.js";
import { useTempleTables, useTempleUI, summariseLog, practiceProgress } from "../game/temple/templeStore.js";
import { TEMPLE_STONES, TEMPLE_STONE, TEMPLE_WALL, TEMPLE_DASH, DESERT_REGION_ID } from "../data/desert/desertLayout.js";
import { desertGroundHeight, desertHazardAt, desertIsSafe, quicksandAt } from "../data/desert/desertTerrain.js";
import { getDesertColliders } from "../data/desert/desertColliders.js";
import { resolveCircle, PLAYER_RADIUS } from "../systems/collisionEngine.js";
import { INTERACTABLES } from "../data/interactables.js";
import { journeyState, portalLock, DESERT_PORTAL_ID } from "../data/journey.js";
import { TRANSLATIONS } from "../i18n/translations.js";
import { useProgress } from "../progress/store.js";
import { SYNCED_KEY } from "../cloud/progressMerge.js";

const withClean = (fn) => {
  const keep = {};
  const keys = [...Object.values(TABLES_BEST_KEYS), FACTS_KEY, "mma-tables-warmup-day"];
  for (const k of keys) keep[k] = localStorage.getItem(k);
  const prog = { xp: useProgress.getState().xp, coins: useProgress.getState().coins, level: useProgress.getState().level };
  try {
    for (const k of keys) localStorage.removeItem(k);
    return fn();
  } finally {
    for (const k of keys) {
      if (keep[k] == null) localStorage.removeItem(k);
      else localStorage.setItem(k, keep[k]);
    }
    useProgress.setState(prog);
    useTempleTables.getState().exit();
    useTempleUI.getState().close();
  }
};

export function runTempleChecks() {
  const checks = [];
  const push = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

  // TT1 — the fifteen stations, in Jeff's order, in their families.
  {
    const order = STATION_KEYS.join(",");
    const tables = STATIONS.filter((s) => s.kind === "table").map((s) => s.table).join(",");
    const want = "x10,x5,x11,mix1,x2,x4,x8,mix2,x3,x6,x9,x12,mix3,x7,grand";
    const famOk = STATIONS.every((s) => FAMILY[s.family]) && FAMILIES.map((f) => f.id).join() === "anchors,doubling,threes,sevens,summit";
    const ixOk = STATIONS.every((s) => INTERACTABLES.some((i) => i.id === `temple-stone-${s.key}` && i.regionId === DESERT_REGION_ID) && TEMPLE_STONE[s.key]);
    const ok = order === want && tables === TABLE_ORDER.join(",") && tables === "10,5,11,2,4,8,3,6,9,12,7" && famOk && ixOk &&
      STATION_KEYS.every((k) => SYNCED_KEY.test(TABLES_BEST_KEYS[k])) && ROUND_SECONDS === 90;
    push("Temple: fifteen stations — 10, 5, 11, Anchor Mix, 2, 4, 8, Doubling Mix, 3, 6, 9, 12, Threes Mix, 7, Grand Mix — each a stone you can use, bests synced", ok,
      ok ? `${STATIONS.length} stations · 90 s rounds` : `order ${order} tables ${tables} fam:${famOk} stones:${ixOk}`);
  }

  // TT2 — the targets allow for typing (more digits → a few fewer needed).
  {
    const bad = [];
    for (const s of STATIONS) {
      const t = targetsFor(s);
      if (!(t.bronze < t.silver && t.silver < t.gold)) bad.push(`${s.key} order`);
      if (t.gold < 35 || t.gold > 52 || t.bronze < 14 || t.bronze > 26) bad.push(`${s.key} ${t.bronze}/${t.silver}/${t.gold}`);
      if (medalFor(s, t.gold)?.id !== "gold" || medalFor(s, t.gold - 1)?.id !== "silver" || medalFor(s, t.bronze - 1) !== null) bad.push(`${s.key} medals`);
    }
    const g = (k) => targetsFor(k).gold;
    if (!(g("x2") > g("x12") && g("x2") > g("x10"))) bad.push("digits don't count");
    if (!(g("mix2") < g("x8"))) bad.push("mixes no easier");
    push("Temple: medal targets count the TYPING — longer answers need a few fewer right (2s gold > 12s gold), mixes allow switching time", bad.length === 0,
      bad.length ? bad.join("; ") : STATIONS.map((s) => `${s.short === "Mix" || s.short === "Grand" ? s.key : s.short} ${targetsFor(s).gold}`).join(" · "));
  }

  // TT3 — the decks: no skip-counting, both orders, the mixes' weights, no division.
  {
    const bad = [];
    const rand = seeded(7);
    for (const s of STATIONS.filter((x) => x.kind === "table")) {
      const d = makeDeck(s, { n: 144, rand });
      for (let c = 0; c < 12; c++) {
        const keys = new Set(d.slice(c * 12, c * 12 + 12).map((q) => q.key));
        if (keys.size !== 12) { bad.push(`${s.key} cycle ${c}`); break; }
      }
      if (d.some((q, i) => i && q.key === d[i - 1].key)) bad.push(`${s.key} repeat`);
      if (s.table !== 1 && !d.some((q) => q.a !== s.table) || !d.some((q) => q.a === s.table && q.b !== s.table)) bad.push(`${s.key} one order only`);
      // In order up the table would be skip-counting: never 4 rising in a row.
      let run = 0, worst = 0;
      for (let i = 1; i < d.length; i++) { run = d[i].ans === d[i - 1].ans + s.table ? run + 1 : 0; worst = Math.max(worst, run); }
      if (worst >= 3) bad.push(`${s.key} counts up`);
    }
    const m2 = makeDeck("mix2", { n: 4000, rand: seeded(11) });
    const fresh = new Set(stationPool("mix2").filter((f) => [2, 4, 8].some((t) => f.a === t || f.b === t)).slice(0, 34).map((f) => f.key));
    const share = m2.filter((q) => tableFacts(2).concat(tableFacts(4), tableFacts(8)).some((f) => f.key === q.key)).length / m2.length;
    if (share < 0.55 || share > 0.68) bad.push(`mix2 new share ${share.toFixed(2)}`);
    for (let i = 1; i < m2.length; i++) if (m2.slice(Math.max(0, i - 6), i).some((q) => q.key === m2[i].key)) { bad.push("mix2 repeats soon"); break; }
    const grand = makeDeck("grand", { n: 900, rand: seeded(5) });
    const covered = new Set(grand.map((q) => q.key)).size;
    if (covered !== ALL_FACTS.length) bad.push(`grand covers ${covered}`);
    const all = [...m2, ...grand];
    if (!all.every((q) => q.a >= 1 && q.a <= 12 && q.b >= 1 && q.b <= 12 && q.ans === q.a * q.b)) bad.push("not a × b");
    void fresh;
    push("Temple: questions — each table shuffled (never counting up), both orders asked, mixes 60 % new family / 40 % earlier, the Grand Mix covers all 78 facts, no division", bad.length === 0,
      bad.length ? bad.join("; ") : `mix2 new share ${(share * 100).toFixed(0)} % · grand ${covered}/78`);
  }

  // TT4 — the round: auto-submit, slips cost time not points, Enter for short answers.
  push(...withClean(() => {
    const T = useTempleTables;
    const bad = [];
    T.getState().start("x10");
    if (T.getState().status !== "menu") bad.push("no menu");
    T.getState().beginTimed();
    if (T.getState().status !== "countdown") bad.push("no countdown");
    T.getState().go();
    const q0 = T.getState().currentRound();
    const s0 = String(q0.ans);
    for (const ch of s0) T.getState().press(ch);
    if (T.getState().status !== "celebrate" || T.getState().score !== 1) bad.push(`auto-submit ${T.getState().status}`);
    T.getState().press(String(T.getState().rounds[1].ans)[0]); // typing on during the blink moves on (no digit lost)
    if (T.getState().roundIndex !== 1 || T.getState().typed.length !== 1) bad.push("blink ate a digit");
    T.getState().back();
    const q1 = T.getState().currentRound();
    const a1 = String(q1.ans);
    const wrong = String((Number(a1[0]) % 9) + 1) + a1.slice(1);
    for (const ch of wrong) T.getState().press(ch);
    const S = T.getState();
    if (S.status !== "fix" || S.score !== 1 || S.wrongs !== 1) bad.push(`slip ${S.status}/${S.score}`);
    const back = S.rounds.slice(S.roundIndex + 1, S.roundIndex + 6).some((q) => q.key === q1.key);
    if (!back) bad.push("missed fact doesn't come back");
    T.getState().press(wrong[0]);
    if (T.getState().status !== "fix" || T.getState().typed !== "") bad.push("a wrong copy should clear");
    for (const ch of String(q1.ans)) T.getState().press(ch);
    if (T.getState().status !== "play" || T.getState().roundIndex !== 2 || T.getState().score !== 1) bad.push("copying didn't move on");
    // A short answer + Enter.
    T.setState({ rounds: [...T.getState().rounds.slice(0, 2), { a: 1, b: 7, ans: 7, key: "1x7", digits: 1 }, ...T.getState().rounds.slice(2)] });
    T.getState().press("7");
    if (T.getState().status !== "celebrate") bad.push("one digit");
    T.getState().exit();
    return ["Temple: an answer goes in by itself at the right length, typing on through the blink loses nothing, a slip shows the answer + costs time (never points), the fact comes back", bad.length === 0, bad.length ? bad.join("; ") : "auto · blink · slip · copy · comes back"];
  }));

  // TT5 — the clock, medals, bests, the next station opening, coins; practice has no clock.
  push(...withClean(() => {
    const T = useTempleTables;
    const bad = [];
    const coins0 = useProgress.getState().coins;
    if (!stationOpen("x10") || stationOpen("x5")) bad.push("start locks");
    T.getState().start("x5");
    T.getState().beginTimed();
    if (T.getState().status !== "menu") bad.push("locked station played");
    T.getState().start("x10");
    T.getState().beginTimed();
    T.getState().go();
    const tgt = targetsFor("x10");
    for (let i = 0; i < tgt.bronze; i++) {
      const q = T.getState().currentRound();
      for (const ch of String(q.ans)) T.getState().press(ch);
      T.getState().next();
    }
    T.getState().tick(30000);
    if (T.getState().status === "results") bad.push("ended early");
    T.getState().tick(ROUND_SECONDS * 1000);
    const r = T.getState().result;
    if (T.getState().status !== "results" || !r || r.medal !== "bronze" || r.opened !== "x5") bad.push(`results ${T.getState().status} ${r && r.medal} ${r && r.opened}`);
    if (readTablesBest("x10") !== tgt.bronze || !stationOpen("x5") || stationOpen("x11")) bad.push("best/unlock");
    if (useProgress.getState().coins - coins0 !== Math.floor(tgt.bronze / 5) + 10) bad.push(`coins ${useProgress.getState().coins - coins0}`);
    if (nextStation()?.key !== "x5") bad.push(`next ${nextStation()?.key}`);
    T.getState().start("x10");
    T.getState().beginPractice();
    T.getState().tick(ROUND_SECONDS * 2000);
    if (T.getState().status !== "play") bad.push("practice has a clock");
    for (const f of tableFacts(10)) T.setState({ green: { ...T.getState().green, [f.key]: true } });
    if (!practiceProgress("x10", T.getState().green).ready) bad.push("no ready nudge");
    const rows = tablesTrophyRows();
    if (rows.length !== 15 || rows.filter((x) => x.medal).length !== 1) bad.push("rows");
    T.getState().exit();
    return ["Temple: 90 s on the clock, a bronze opens the next station (one at a time), bests + coins saved, practice has no clock and nudges 'ready' once every fact's green", bad.length === 0, bad.length ? bad.join("; ") : `x10 bronze at ${tgt.bronze} → the 5s open`];
  }));

  // TT6 — fluency + spaced review.
  {
    const bad = [];
    const k = factKey(7, 8);
    let st = {};
    st = recordAnswer(st, k, { right: true, ms: 1500, digits: 2, today: 100 });
    st = recordAnswer(st, k, { right: true, ms: 1500, digits: 2, today: 100 });
    if (isFluent(st[k]) || st[k].box !== 1 || st[k].due !== 100 + REVIEW_DAYS[1]) bad.push("one day fluent / box raced");
    st = recordAnswer(st, k, { right: true, ms: 1200, digits: 2, today: 101 });
    if (!isFluent(st[k]) || st[k].box !== 2 || st[k].due !== 101 + REVIEW_DAYS[2]) bad.push("two days not fluent");
    st = recordAnswer(st, k, { right: true, ms: fastLimitMs(2) + 500, digits: 2, today: 104 });
    if (st[k].due !== 105) bad.push("slow → tomorrow");
    st = recordAnswer(st, k, { right: false, ms: 900, digits: 2, today: 105 });
    if (isFluent(st[k]) || st[k].box !== 0 || st[k].due !== 105 || !dueFacts(st, 105).includes(k)) bad.push("a slip should un-fluent + bring it back today");
    push("Temple: a fact is FLUENT once it's fast on two different days; fast answers push its review out (1 → 3 → 7 → 14 → 30 days), a slip brings it back today", bad.length === 0, bad.length ? bad.join("; ") : "two days · Leitner boxes · slips reset");
  }

  // TT7 — the warm-up: due facts first; nothing seen → no warm-up; coins once a day.
  push(...withClean(() => {
    const bad = [];
    if (warmupDeck({}, 200).length) bad.push("warm-up from nothing");
    let st = {};
    st = recordAnswer(st, "6x7", { right: false, ms: 900, digits: 2, today: 200 });
    for (const [k, d] of [["2x3", 1], ["3x9", 2], ["5x5", 2]]) st = recordAnswer(st, k, { right: true, ms: 1000, digits: d, today: 200 });
    const deck = warmupDeck(st, 200, { n: 60, rand: seeded(3) });
    const share67 = deck.filter((q) => q.key === "6x7").length / deck.length;
    if (!deck.length || share67 < 0.2) bad.push(`due fact share ${share67.toFixed(2)}`);
    localStorage.setItem(FACTS_KEY, JSON.stringify(st));
    const T = useTempleTables;
    const c0 = useProgress.getState().coins;
    if (!T.getState().beginWarmup()) bad.push("warm-up wouldn't start");
    T.getState().go();
    for (let i = 0; i < 4; i++) { const q = T.getState().currentRound(); for (const ch of String(q.ans)) T.getState().press(ch); T.getState().next(); }
    T.getState().tick(61000);
    const got = useProgress.getState().coins - c0;
    T.getState().beginWarmup(); T.getState().go();
    { const q = T.getState().currentRound(); for (const ch of String(q.ans)) T.getState().press(ch); }
    T.getState().tick(61000);
    if (got !== 4 || useProgress.getState().coins - c0 !== 4) bad.push(`coins ${got}/${useProgress.getState().coins - c0}`);
    if (!readFactStats()["6x7"]) bad.push("not recorded");
    return ["Temple: the daily warm-up is built from the facts DUE (a missed fact comes up most), needs facts first, and pays coins once a day", bad.length === 0, bad.length ? bad.join("; ") : `6 × 7 is ${(share67 * 100).toFixed(0)} % of the deck`];
  }));

  // TT8 — the quick ways.
  {
    const bad = [];
    for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) {
      const s = strategyFor(a, b);
      if (!new RegExp(`(= |→ )${a * b}$`).test(s) && !s.includes(`= ${a * b}`)) bad.push(`${a}×${b}: ${s}`);
    }
    if (!/Double the 4s/.test(strategyFor(8, 7)) || !/10 lots take away/.test(strategyFor(9, 7)) || !/Half of/.test(strategyFor(5, 8)) || !/twice/.test(strategyFor(11, 4))) bad.push("family strategies");
    const sum = summariseLog([{ key: "7x8", a: 7, b: 8, ans: 56, right: false }, { key: "7x8", a: 7, b: 8, ans: 56, right: true, fast: true }, { key: "2x3", a: 2, b: 3, ans: 6, right: true, fast: false }]);
    if (sum[0].verdict !== "missed" || sum[1].verdict !== "slow") bad.push("results order");
    push("Temple: every one of the 144 facts has a quick way that ends on the right answer, built on the family order (8 × 7 → double the 4s)", bad.length === 0, bad.length ? bad.slice(0, 3).join(" | ") : `${strategyFor(8, 7)}`);
  }

  // TT9 — the journey: with Magma after Snowball Sums; holds nothing up.
  {
    const base = { completedMissions: ["warmup-pip", "warmup-fern", "warmup-alby"], journey: {}, visited: {} };
    const cnt = (snow, magma, temple = 0) => ({ snow: { medals: snow, played: snow, total: 10 }, magma: { medals: magma, played: magma, total: 10 }, temple: { medals: temple, played: temple, total: 15 } });
    const six = journeyState({ ...base, counts: cnt(6, 0) });
    const seven = journeyState({ ...base, counts: cnt(7, 0) });
    const farm = journeyState({ ...base, counts: cnt(7, 7, 0) });
    const w = (js, k) => js.worlds.find((x) => x.key === k);
    const lock = portalLock(six, DESERT_PORTAL_ID);
    const ok = !w(six, "temple").open && w(seven, "temple").open && w(seven, "magma").open && w(farm, "farm").open && !w(farm, "temple").complete &&
      lock && /Snowball Sums/.test(lock.text) && w(seven, "temple").total === 15 && seven.goal.kind === "travel" && seven.goal.worldKey === "temple";
    push("Temple: the golden gate opens WITH Magma Multiples (7 Snowball Sums trophies), Fraction Farm still needs only Magma's — the Temple holds nothing up", ok,
      ok ? `6 → shut ("${lock.note}") · 7 → open + next stop` : `six:${w(six, "temple").open} seven:${w(seven, "temple").open} farm:${w(farm, "farm").open} goal:${seven.goal.kind}/${seven.goal.worldKey}`);
  }

  // TT10 — the stones in the world: grouped by family, safe, clear, on the summit / mesa.
  {
    const bad = [];
    const cols = getDesertColliders().filter((c) => !/^desert-stone-|^desert-tables-wall$|^desert-dash$/.test(c.id));
    const all = getDesertColliders();
    for (const t of TEMPLE_STONES) {
      const d = t.tall ? 1.9 : 1.6;
      const [x, z] = [t.position[0] + Math.sin(t.rotationY) * d, t.position[1] + Math.cos(t.rotationY) * d];
      const y = desertGroundHeight(x, z, 200);
      if (!desertIsSafe(x, z) || desertHazardAt(x, z, y) || (quicksandAt(x, z)?.sdf ?? 9) < 2) bad.push(`${t.key} unsafe`);
      const r = resolveCircle(x, z, all.filter((c) => c.yMin === undefined || y >= c.yMin - 0.5), PLAYER_RADIUS);
      if (Math.hypot(r.x - x, r.z - z) > 1e-3) bad.push(`${t.key} spot blocked`);
      const near = cols.filter((c) => Math.hypot(c.x - t.position[0], c.z - t.position[1]) < (c.radius || 0) + 1.2);
      if (near.length) bad.push(`${t.key} crowded by ${near[0].id}`);
      const ys = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => desertGroundHeight(t.position[0] + a, t.position[1] + b, y + 0.5));
      if (Math.max(...ys) - Math.min(...ys) > 0.2) bad.push(`${t.key} on a slope`);
    }
    if (desertGroundHeight(...TEMPLE_STONE.grand.position, 200) < 20) bad.push("grand not on the summit");
    if (desertGroundHeight(...TEMPLE_STONE.x3.position, 200) < 12) bad.push("threes not on the mesa");
    for (const f of FAMILIES) {
      const st = STATIONS.filter((s) => s.family === f.id).map((s) => TEMPLE_STONE[s.key].position);
      const cx = st.reduce((a, p) => a + p[0], 0) / st.length, cz = st.reduce((a, p) => a + p[1], 0) / st.length;
      if (st.some((p) => Math.hypot(p[0] - cx, p[1] - cz) > 12)) bad.push(`${f.id} spread out`);
    }
    if (!desertIsSafe(TEMPLE_WALL.position[0], TEMPLE_WALL.position[1] + 2) || !desertIsSafe(TEMPLE_DASH.position[0] + 2, TEMPLE_DASH.position[1] + 1.5)) bad.push("wall / Dash");
    push("Temple: the fifteen stones stand in their family groups (Bazaar, Oasis, Red Mesa top, Sun Temple, pyramid summit) on flat, safe, clear ground", bad.length === 0,
      bad.length ? bad.slice(0, 6).join("; ") : `${TEMPLE_STONES.length} stones + the wall + Dash`);
  }

  // TT11 — Farsi + Arabic for the temple's fixed words.
  {
    const words = [
      "Timestable Temple", "Practise", "Go for gold", "No clock", "Show me the way", "My times-table square", "Temple Warm-up",
      "Answers go in by themselves — no need to press Enter.", "Type the answer to keep going", "Looks like you're ready — go for gold?",
      "Where to next?", "Fluent — fast on two different days", "Getting there", "Missed last time", "Not tried yet", "right in 90 seconds",
      ...FAMILIES.flatMap((f) => [f.name, f.where]), ...STATIONS.map((s) => s.name),
    ];
    const missing = [...new Set(words)].filter((w) => !TRANSLATIONS.fa[w] || !TRANSLATIONS.ar[w]);
    push("Temple: every fixed word on its cards, families and stations is in Farsi + Arabic", missing.length === 0, missing.length ? `untranslated: ${missing.slice(0, 5).join(" | ")}` : `${words.length} strings`);
  }

  return checks;
}
