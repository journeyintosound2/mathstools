/**
 * EMERALD JUNGLE — headless checks for the ten vine-ladder challenges
 * (pilot 2026-10-10 morning; the other eight + ACCURACY-ONLY scoring the
 * same afternoon). Framework checks JCF1–JCF6 plus three per challenge
 * (the Magma pattern):
 *   1  200-set generation fuzz — 15 rounds, the 5-stage arc, no repeats,
 *      every round answerable with the moves on offer, the challenge's own
 *      maths invariants
 *   2  PERFECT PLAY through the REAL store — 25 every round, 375, gold
 *   3  the pedagogy: the challenge's traps and consequences behave
 * JCF6 is Jeff's rule (2026-10-10): any route scores the same — a detour
 * costs nothing, only wrong numbers do.
 */
import {
  JUNGLE_CHALLENGES, JUNGLE_CHALLENGE_KEYS, BUILT_JUNGLE_CHALLENGES, jungleHostId, jungleHostWorld,
  JUNGLE_WELCOME_HOST, JUNGLE_RECORDS_STAND, inJungleChallengeView, LADDER_GEOM,
} from "../data/jungle/jungleChallenges.js";
import {
  JUNGLE_BEST_KEYS, JUNGLE_MAX_SCORES, jungleTrophyRows, readJungleBest, jungleBestPercent, medalFor, jungleShelfEntries,
} from "../data/jungle/jungleRecords.js";
import {
  JUNGLE_REGION_ID, JUNGLE_SPAWN, terrainHeight, nearestPath, jungleWaterAt, slopeAt,
  JUNGLE_SPOTS,
} from "../data/jungle/jungleLayout.js";
import { getJungleColliders } from "../data/jungle/jungleColliders.js";
import { getJungleProps } from "../data/jungle/jungleProps.js";
import { INTERACTABLES } from "../data/interactables.js";
import { ENCOUNTERS } from "../data/encounters.js";
import { JUNGLE_STORES, jungleStore, exitJungleExcept, activeJungleChallengeKey } from "../game/jungle/jungleActive.js";
import { driveAt } from "../game/jungle/ladderStore.js";
import {
  partnerOf, tryMove, additivePartner, untiedZero, parseMoney, parseKg, parseVal, fmtMoney, fmtVal, onSide, other, vineOn,
  rungFor, accuracyPoints, parseDec, fmtDec, LADDER_MOVES,
} from "../data/jungle/vineLadder.js";
import { playRound, playPhase, stepLadder } from "./ladderPlayer.js";
import { generateSwapSet } from "../data/jungle/swapChallenge.js";
import { generateMarketSet } from "../data/jungle/marketChallenge.js";
import { generateRaceSet } from "../data/jungle/raceChallenge.js";
import { generateTapeSet } from "../data/jungle/tapeChallenge.js";
import { generatePotionSet, potionRGB } from "../data/jungle/potionChallenge.js";
import { generateBarrelsSet } from "../data/jungle/barrelsChallenge.js";
import { generateMapSet } from "../data/jungle/mapChallenge.js";
import { generateFirefliesSet } from "../data/jungle/firefliesChallenge.js";
import { generateTempleSet, hangsStraight } from "../data/jungle/templeChallenge.js";
import { generatePathfinderSet } from "../data/jungle/pathfinderChallenge.js";
import { achievementsSummary } from "../data/island/achievements.js";

// Characters with a real glb (characterModels.js can't be imported headlessly).
const GLB_CHARACTERS = ["pip", "fern", "alby", "sage", "pearce", "mahoney", "ewings", "dawson", "heywood", "morgan", "bacon", "brookes", "trevor", "steve", "robot"];
const GENERATORS = {
  swap: generateSwapSet, market: generateMarketSet, race: generateRaceSet, tape: generateTapeSet, potion: generatePotionSet,
  barrels: generateBarrelsSet, map: generateMapSet, fireflies: generateFirefliesSet, temple: generateTempleSet, pathfinder: generatePathfinderSet,
};
const fuzz = (gen, n = 200) => Array.from({ length: n }, () => gen());
// Group failures like "potion:on-trail jg-potion-vines-7" by their stem so a
// long run of posts reads as one line ("potion:on-trail ×8").
function summariseBad(bad) {
  const groups = new Map();
  for (const b of bad) {
    const stem = b.replace(/-\d+(@[\d.]+)?$/, "").replace(/ jg-[\w-]+$/, "");
    groups.set(stem, (groups.get(stem) || 0) + 1);
  }
  return [...groups].map(([k, n]) => (n > 1 ? `${k} ×${n}` : k)).join(", ");
}
const stagesOk = (set) => set.length === 15 && set.every((r, i) => r.stage === Math.floor(i / 3) && r.roundIndex === i) && new Set(set.map((r) => r.sig)).size === 15;

/** Walk a round's plan through the pure ladder maths (no store). */
function walkPlan(r) {
  const rungs = r.ladders.map((l) => l.start.map((x) => [...x]));
  for (let p = 0; p < r.phases.length; p++) {
    const ph = r.phases[p];
    for (const st of r.solve[p].steps) {
      const d = driveAt(r, p, st.li);
      const vals = rungs[st.li].map((x) => onSide(x, d));
      const from = st.b !== undefined ? [st.a, st.b] : [st.a];
      if (!from.every((v) => vals.includes(v))) return `missing ${from}`;
      const base = onSide(r.ladders[st.li].start[0], d);
      const m = tryMove(r.ladders[st.li].L, d, st.op, from, st.n, base, r.maxDrive);
      if (!m.ok || m.value !== st.v) return `${st.op}:${m.why || m.value}`;
      if (!r.moves.includes(st.op)) return `move-not-offered:${st.op}`;
      rungs[st.li].push(m.rung);
    }
    if (ph.type === "build") {
      for (const g of ph.goals) {
        const d = driveAt(r, p, g.li);
        if (!rungs[g.li].some((x) => onSide(x, d) === g.target)) return `goal-unreached:${g.target}`;
      }
    }
  }
  return null;
}

/** Shape + plan + text checks shared by every challenge's fuzz. */
function roundBasics(r) {
  const bad = [];
  if (!r.q || !r.q.lead || !r.celebrate || !Array.isArray(r.working) || !r.working.length) bad.push("text");
  if (!r.solve || r.solve.length !== r.phases.length) bad.push("solve");
  else {
    const w = walkPlan(r);
    if (w) bad.push(`walk:${w}`);
  }
  for (const l of r.ladders) {
    for (const [t, b] of l.start) if (!Number.isInteger(t) || !Number.isInteger(b) || t <= 0 || b <= 0) bad.push("start");
  }
  for (const ph of r.phases) {
    if (ph.type === "call" && !(ph.options.length >= 2 && ph.correct >= 0 && ph.correct < ph.options.length)) bad.push("call");
    if (ph.type === "type" && !(Number.isInteger(ph.answer) && ph.vine)) bad.push("type");
  }
  return bad;
}

function playSet(key, play) {
  const store = jungleStore(key);
  try { localStorage.removeItem(JUNGLE_BEST_KEYS[key]); } catch { /* headless */ }
  store.getState().exit();
  store.getState().start();
  store.getState().beginRounds();
  const pts = [];
  for (let i = 0; i < 15; i++) {
    const st = store.getState();
    if (st.status !== "play") { pts.push(-1); break; }
    play(st.currentRound(), store);
    const after = store.getState();
    pts.push(after.roundPoints);
    if (after.status === "celebrate" || after.status === "feedback") after.next();
    else { pts.push(-2); break; }
  }
  const end = store.getState();
  return { pts, status: end.status, score: end.score };
}
function perfectCheck(key) {
  const res = playSet(key, (r, S) => playRound(S, r));
  const best = readJungleBest(key);
  const medal = medalFor(jungleBestPercent(key, best));
  const ok = res.pts.length === 15 && res.pts.every((p) => p === 25) && res.score === 375 && res.status === "done" && best === 375 && medal && medal.id === "gold";
  jungleStore(key).getState().exit();
  return {
    name: `Jungle ${key}: perfect play scores 25 every round (375, gold)`,
    pass: Boolean(ok),
    detail: ok ? "15 × 25 = 375 · best saved · gold" : `pts ${res.pts.join(",")} score ${res.score} status ${res.status} best ${best}`,
  };
}

/** A fresh set, played perfectly up to round i (the store's own fresh state). */
function startAt(key, i) {
  const S = jungleStore(key);
  S.getState().exit();
  S.getState().start();
  S.getState().beginRounds();
  for (let k = 0; k < i; k++) { playRound(S, S.getState().currentRound()); S.getState().next(); }
  return S;
}
/** Start a set and play on (perfectly) to its first round matching a test. */
function startWhere(key, test) {
  const S = jungleStore(key);
  S.getState().exit();
  S.getState().start();
  S.getState().beginRounds();
  for (let k = 0; k < 14 && !test(S.getState().currentRound()); k++) { playRound(S, S.getState().currentRound()); S.getState().next(); }
  return S;
}
/** First round index matching a test. */
function findRound(key, test) {
  const S = jungleStore(key);
  S.getState().exit();
  S.getState().start();
  const i = S.getState().rounds.findIndex(test);
  return i;
}
/** Pend the next planned rung and type `val(pending)` instead. */
function pendNext(S, mutate) {
  const get = S.getState;
  const r = get().currentRound();
  const p = get().phase;
  const d = (li) => driveAt(r, p, li);
  const st = r.solve[p].steps.find((x) => !get().ladders[x.li].rungs.some((y) => onSide(y, d(x.li)) === x.v));
  if (!st) return null;
  const li = st.li;
  if (get().active !== li) get().setActive(li);
  const rungs = get().ladders[li].rungs;
  const want = [rungs.findIndex((x) => onSide(x, d(li)) === st.a)];
  if (st.b !== undefined) want.push(rungs.findIndex((x) => onSide(x, d(li)) === st.b));
  for (const i of [...get().sel]) get().select(li, i);
  for (const i of want) get().select(li, i);
  get().choose(st.op);
  if (st.n) get().pickN(st.n);
  const pend = get().pending;
  if (!pend) return null;
  const pv = vineOn(r.ladders[li].L, other(d(li)));
  const v = mutate(pend, r, li);
  return { res: get().submit(fmtVal(pv, v)), pend, st };
}

export function runJungleChallengeChecks() {
  const checks = [];
  const colliders = getJungleColliders();

  // JCF1) Registry wiring: ten challenges in trophy order, all built, hosts
  //       with real glbs, interactables + encounters + best keys in lockstep.
  {
    const want = ["swap", "market", "race", "tape", "potion", "barrels", "map", "fireflies", "temple", "pathfinder"];
    const order = JUNGLE_CHALLENGE_KEYS.join() === want.join();
    const built = BUILT_JUNGLE_CHALLENGES.map((c) => c.key);
    const storesOk = JUNGLE_STORES.map(([k]) => k).join() === want.join() && built.join() === want.join();
    const spotsOk = new Set(JUNGLE_CHALLENGES.map((c) => c.spot)).size === 10 && JUNGLE_CHALLENGES.every((c) => JUNGLE_SPOTS.some((s) => s.id === c.spot));
    const ids = new Set(INTERACTABLES.filter((i) => i.regionId === JUNGLE_REGION_ID).map((i) => i.id));
    const ixOk = built.every((k) => ids.has(jungleHostId(k))) && ids.has(JUNGLE_WELCOME_HOST.id) && ids.has(JUNGLE_RECORDS_STAND.id) && ids.has("emerald-jungle-map") && ids.size === built.length + 3;
    const encOk = built.every((k) => ENCOUNTERS[`jungle-${k}-challenge`]) && ENCOUNTERS["jungle-welcome"] && ENCOUNTERS["jungle-records"];
    const glbOk = JUNGLE_CHALLENGES.every((c) => GLB_CHARACTERS.includes(c.host.characterId));
    const keysOk = JUNGLE_CHALLENGE_KEYS.every((k) => JUNGLE_BEST_KEYS[k] === `mma-jungle-${k}-best` && JUNGLE_MAX_SCORES[k] === 375);
    const rows = jungleTrophyRows();
    const rowsOk = rows.length === 10 && rows.filter((r) => r.soon).length === 0 && jungleShelfEntries().length === 10;
    const pass = order && storesOk && spotsOk && ixOk && encOk && glbOk && keysOk && rowsOk;
    checks.push({
      name: "Jungle challenges: all ten built in trophy order, real hosts, wiring in lockstep",
      pass,
      detail: pass ? "10 slots · 10 stores · 13 jungle interactables (10 hosts + Mills + stand + map) · mma-jungle-<key>-best (375) · none 'coming soon'"
        : `order:${order} stores:${storesOk} spots:${spotsOk} ix:${ixOk}(${ids.size}) enc:${Boolean(encOk)} glb:${glbOk} keys:${keysOk} rows:${rowsOk}`,
    });
  }

  // JCF2) Each clearing: the apparatus stands on the flat, dry pad; nothing
  //       solid of it sits on the trail; host + park spot clear; the camera
  //       floats above the ground with a clear line to the ladder (no tree
  //       trunk near the sight line) at 16:9, 4:3 and portrait.
  {
    const bad = [];
    const trunks = colliders.filter((c) => /^jg-(broadleaf|conifer|giant|palm|emergent)/.test(c.id));
    const P = getJungleProps();
    const G = LADDER_GEOM;
    for (const c of BUILT_JUNGLE_CHALLENGES) {
      const f = c.frame;
      // Sample the footprint: the ladder line + every solid row (+ the race lanes).
      const rows = [[G.x0, G.z, G.x1, G.z], ...(c.solids || []).map(([x0, z0, x1, z1]) => [x0, z0, x1, z1])];
      if (c.key === "race") rows.push([G.x0, 1.2, G.x1, 1.2], [G.x0, 2.2, G.x1, 2.2]);
      for (const [x0, z0, x1, z1] of rows) {
        const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.9));
        for (let k = 0; k <= n; k++) {
          const lx = x0 + ((x1 - x0) * k) / n, lz = z0 + ((z1 - z0) * k) / n;
          const [wx, wz] = f.toWorld(lx, lz);
          if (jungleWaterAt(wx, wz) !== null) { bad.push(`${c.key}:wet@${lx.toFixed(1)},${lz.toFixed(1)}`); break; }
          if (Math.abs(terrainHeight(wx, wz) - f.y) > 0.32) { bad.push(`${c.key}:slope@${lx.toFixed(1)},${lz.toFixed(1)}`); break; }
        }
      }
      const others = colliders.filter((k) => !k.id.startsWith(`jg-${c.key}-`) && k.id !== `jg-host-${c.key}`);
      for (const k of colliders.filter((k) => k.id.startsWith(`jg-${c.key}-`))) {
        const n = nearestPath(k.x, k.z);
        if (n && n.e < k.radius) bad.push(`${c.key}:on-trail ${k.id}`);
        // Nothing else (a signpost, a rock, a trunk, another stage) stands in the apparatus.
        const hit = others.find((o) => Math.hypot(o.x - k.x, o.z - k.z) < o.radius + k.radius);
        if (hit) bad.push(`${c.key}:clash ${hit.id.replace(/-\d+$/, "")}`);
      }
      // No set piece (a signpost, a standing stone, temple rubble, a rock) stands
      // inside the apparatus or just in front of it.
      for (const k of others.filter((o) => /^jg-(sign|shrine|pillar|rubble|rock|stump|log|statue)/.test(o.id))) {
        const [lx, lz] = f.toLocal(k.x, k.z);
        if (lx > G.x0 - 1.6 - k.radius && lx < G.x1 + 1.4 + k.radius && lz > -4.6 - k.radius && lz < 2.5 + k.radius) bad.push(`${c.key}:clutter ${k.id.replace(/-\d+$/, "")}`);
      }
      const [hx, hz] = jungleHostWorld(c.key);
      const nh = nearestPath(hx, hz);
      if (nh && nh.e < 0.7) bad.push(`${c.key}:host-on-trail`);
      if (Math.abs(terrainHeight(hx, hz) - f.y) > 0.4 || slopeAt(hx, hz) > 0.2) bad.push(`${c.key}:host-ground`);
      if (colliders.some((k) => k.id !== `jg-host-${c.key}` && Math.hypot(k.x - hx, k.z - hz) < k.radius + 0.6)) bad.push(`${c.key}:host-crowded`);
      const [px, pz] = f.toWorld(c.parkAt[0], c.parkAt[1]);
      if (colliders.some((k) => Math.hypot(k.x - px, k.z - pz) < k.radius + 0.45)) bad.push(`${c.key}:park-blocked`);
      for (const aspect of [16 / 9, 4 / 3, 0.75]) {
        const halfW = Math.tan((50 * Math.PI) / 360) * aspect;
        const halfV = Math.tan((50 * Math.PI) / 360);
        const dist = Math.min(c.view.maxDist, Math.max(c.view.minDist, c.view.fit / halfW, c.view.fitH ? c.view.fitH / halfV : 0));
        const [lx, ly, lz] = c.view.look;
        const [cx, cz] = f.toWorld(lx, lz + Math.cos(c.view.elev) * dist);
        const cy = f.y + ly + Math.sin(c.view.elev) * dist;
        if (cy < terrainHeight(cx, cz) + 1.2) bad.push(`${c.key}:camera-low@${aspect.toFixed(2)}`);
        for (const tx of [G.x0, 0, G.x1]) {
          const [ax, az] = f.toWorld(c.key === "tape" ? tx * 0.2 : tx, G.z);
          const ty = f.y + (c.key === "tape" ? 4 : 2);
          for (let s = 0.05; s < 0.95; s += 0.05) {
            const x = cx + (ax - cx) * s, z = cz + (az - cz) * s;
            const y = cy + (ty - cy) * s;
            if (y < terrainHeight(x, z) + 0.2) { bad.push(`${c.key}:ground-blocks@${aspect.toFixed(2)}`); break; }
            const hit = trunks.find((k) => Math.hypot(k.x - x, k.z - z) < k.radius + 0.25);
            if (hit) { bad.push(`${c.key}:trunk ${hit.id}@${aspect.toFixed(2)}`); break; }
          }
        }
      }
      const inShot = Object.values(P.trees).flat().filter((t) => !t.deco && inJungleChallengeView(c.key, t.x, t.z));
      if (inShot.length) bad.push(`${c.key}:${inShot.length} trees in the corridor`);
    }
    const [sx, sz] = JUNGLE_RECORDS_STAND.position;
    const facing = Math.cos(JUNGLE_RECORDS_STAND.rotationY - Math.atan2(JUNGLE_SPAWN.x - sx, JUNGLE_SPAWN.z - sz));
    if (facing < 0.99) bad.push("stand-facing");
    for (const [id, p, r] of [["stand", JUNGLE_RECORDS_STAND.position, 2.0], ["mills", JUNGLE_WELCOME_HOST.position, 0.7]]) {
      const np = nearestPath(p[0], p[1]);
      if (np && np.e < r) bad.push(`${id}-on-trail`);
      if (Math.hypot(p[0] - JUNGLE_SPAWN.x, p[1] - JUNGLE_SPAWN.z) < r + 2) bad.push(`${id}-on-spawn`);
    }
    checks.push({
      name: "Jungle challenges: ten stages on flat clearings off the trail, hosts + park spots clear, clear camera lines",
      pass: bad.length === 0,
      detail: bad.length ? summariseBad(bad) : `${BUILT_JUNGLE_CHALLENGES.length} stages · 3 aspects each · corridors free of trees · stand faces the arrivals`,
    });
  }

  // JCF3) Stores: the lifecycle works, no state field shadows a verb, one
  //       challenge at a time.
  {
    const bad = [];
    for (const [key, store] of JUNGLE_STORES) {
      const fnNames = Object.keys(store.getState()).filter((k) => typeof store.getState()[k] === "function");
      store.getState().start();
      if (store.getState().status !== "intro") bad.push(`${key}:intro`);
      const lost = fnNames.filter((k) => typeof store.getState()[k] !== "function");
      if (lost.length) bad.push(`${key}:shadowed ${lost.join("/")}`);
      store.getState().beginRounds();
      if (store.getState().status !== "play" || store.getState().rounds.length !== 15) bad.push(`${key}:play`);
    }
    exitJungleExcept("market");
    const still = JUNGLE_STORES.filter(([, s]) => s.getState().status !== "idle").map(([k]) => k);
    if (still.join() !== "market") bad.push(`exceptMarket:${still.join("/")}`);
    if (activeJungleChallengeKey() !== "market") bad.push("active");
    exitJungleExcept(null);
    if (activeJungleChallengeKey() !== null) bad.push("not-all-exited");
    checks.push({
      name: "Jungle challenges: stores run the lifecycle, verbs never shadowed, one at a time",
      pass: bad.length === 0,
      detail: bad.length ? bad.join(", ") : "10 stores · intro → play · 15 rounds · exitJungleExcept keeps only the named one",
    });
  }

  // JCF4) Records + the Achievements Wall: all ten slots live.
  {
    const saved = localStorage.getItem(JUNGLE_BEST_KEYS.race);
    let ok = false, detail = "";
    try {
      localStorage.setItem(JUNGLE_BEST_KEYS.race, "375");
      const s = achievementsSummary({ xp: 0, coins: 0, profile: { name: "Sam" } }, []);
      const j = s.panels.find((p) => p.id === "jungle");
      ok = j && j.kind === "trophies" && j.counts.gold >= 1 && j.rows.filter((r) => r.soon).length === 0 &&
        j.rows.find((r) => r.key === "race").medal === "gold" && s.totals.trophySlots === 40 &&
        jungleShelfEntries().find((e) => e.key === "race").percent === 100;
      detail = j ? `kind ${j.kind} · gold ${j.counts.gold} · soon ${j.rows.filter((r) => r.soon).length} · slots ${s.totals.trophySlots}` : "no jungle panel";
    } catch (e) {
      detail = `threw ${e.message}`;
    } finally {
      if (saved === null) localStorage.removeItem(JUNGLE_BEST_KEYS.race); else localStorage.setItem(JUNGLE_BEST_KEYS.race, saved);
    }
    checks.push({ name: "Jungle trophies: bests feed the stand, the grid and the Achievements Wall (all ten live)", pass: Boolean(ok), detail });
  }

  // JCF5) The vine-ladder maths (incl. metric measures + accuracy scoring).
  {
    const BAN = { kind: "count", icon: "🍌", one: "banana", many: "bananas" };
    const MAN = { kind: "count", icon: "🥭", one: "mango", many: "mangoes" };
    const USD = { kind: "money", icon: "💲", one: "dollar", many: "dollars" };
    const KM1 = { kind: "num", unit: "km", dp: 1, one: "kilometre", many: "kilometres" };
    const L = { top: BAN, bottom: MAN, a: 3, b: 2 };
    const M = { top: { kind: "count", one: "papaya", many: "papayas" }, bottom: USD, a: 6, b: 1000 };
    const bad = [];
    if (partnerOf(L, "top", 21) !== 14 || partnerOf(L, "top", 4) !== null || partnerOf(L, "bottom", 18) !== 27) bad.push("partner");
    if (tryMove(L, "top", "h2", [3], undefined, 3, 100).why !== "drive-part") bad.push("half-banana");
    if (tryMove(M, "top", "split", [6], 6, 6, 100).why !== "partner-part") bad.push("part-cents");
    if (tryMove(M, "top", "split", [6], 2, 6, 100).value !== 3) bad.push("friendly-piece");
    if (additivePartner(L, "top", [3, 2], 6) !== 5) bad.push("additive");
    if (untiedZero([3, 2], [6, 5]) !== 1) bad.push("untie");
    if (parseMoney("$17.50") !== 1750 || parseMoney("17.5") !== 1750 || parseMoney("50c") !== 50 || parseMoney("$10") !== 1000 || parseMoney("1.234") !== null) bad.push("money");
    if (parseKg("1.5 kg") !== 1500 || parseKg("0.25") !== 250) bad.push("kg");
    if (parseVal("count", "21 mangoes") !== 21 || parseVal("count", "2.5") !== null) bad.push("count");
    if (parseVal(KM1, "4.5 km") !== 45 || parseVal(KM1, "4.55") !== null || parseDec("1,200", 0) !== 1200 || parseDec(".5", 1) !== 5) bad.push("num-parse");
    if (fmtVal(KM1, 45) !== "4.5 km" || fmtDec(250, 2) !== "2.5" || fmtMoney(1750) !== "$17.50" || fmtMoney(1000) !== "$10") bad.push("fmt");
    if (accuracyPoints(0) !== 25 || accuracyPoints(1) !== 21 || accuracyPoints(2) !== 17 || accuracyPoints(9) !== 9) bad.push("accuracy");
    if (!LADDER_MOVES.across || LADDER_MOVES.across.arity !== 0) bad.push("across");
    checks.push({
      name: "Vine ladder maths: partners, refusals, the add-the-same trap, metric parsing, accuracy points",
      pass: bad.length === 0,
      detail: bad.length ? bad.join(", ") : "21 🍌 → 14 🥭 · ½ banana refused · $10 ÷ 6 refused · 3↔2 → 6↔5 unties at 1 · km to 0.1 · 25/21/17 … 9",
    });
  }

  // JCF6) ANY ROUTE SCORES THE SAME (Jeff, 2026-10-10): in every challenge a
  //       round played with a DETOUR (an extra correct rung first) still
  //       earns 25; one wrong number costs 4; nothing is ever lost for the
  //       number of rungs.
  {
    const bad = [];
    let tried = 0;
    for (const [key, S] of JUNGLE_STORES) {
      S.getState().exit(); S.getState().start(); S.getState().beginRounds();
      // Find a round with a build/common phase (after any opening calls —
      // the Temple's rounds start with "works / breaks") to detour in.
      const BUILDY = ["build", "common", "smallest"];
      let i = 0;
      for (; i < 15; i++) {
        const r = S.getState().currentRound();
        const pi = r.phases.findIndex((ph) => BUILDY.includes(ph.type));
        if (pi >= 0 && r.phases.slice(0, pi).every((ph) => ph.type === "call" || ph.type === "type")) break;
        playRound(S, r); S.getState().next();
      }
      if (i >= 15) continue;
      const get = S.getState;
      const r = get().currentRound();
      const pi = r.phases.findIndex((ph) => BUILDY.includes(ph.type));
      for (let g = 0; g < 6 && get().status === "play" && get().phase < pi; g++) playPhase(S, r);
      const ph0 = r.phases[pi];
      const li = ph0.type === "build" ? ph0.goals[0].li : ph0.li || 0;
      const d = driveAt(r, pi, li);
      // Detour: any offered one-rung move from the start that is correct but not a goal.
      let detoured = false;
      for (const op of r.moves) {
        if (op === "across" || LADDER_MOVES[op].arity !== 1) continue;
        for (const n of LADDER_MOVES[op].needsN ? [2, 3] : [undefined]) {
          if (get().pending || detoured) break;
          if (get().active !== li) get().setActive(li);
          for (const k of [...get().sel]) get().select(li, k);
          get().select(li, 0);
          get().choose(op);
          if (n) get().pickN(n);
          const p = get().pending;
          if (!p) continue;
          const goal = ph0.type === "build" && ph0.goals.some((g) => g.li === li && g.target === p.value);
          const planned = r.solve[pi].steps.some((s) => s.li === li && s.v === p.value);
          if (goal || planned) { get().cancel(); continue; }
          get().submit(fmtVal(vineOn(r.ladders[li].L, other(d)), p.partner));
          detoured = true;
        }
        if (detoured) break;
      }
      tried++;
      playRound(S, r, true);
      if (get().roundPoints !== 25 || get().status !== "celebrate") bad.push(`${key}:${detoured ? "detour" : "plain"}→${get().roundPoints}/${get().status}`);
      S.getState().exit();
    }
    // One wrong number costs 4 (swap round 1).
    const S = startAt("swap", 0);
    pendNext(S, (p) => p.partner + 1);
    playRound(S, S.getState().currentRound(), true);
    const one = S.getState().roundPoints;
    S.getState().exit();
    if (one !== 21) bad.push(`one-wrong→${one}`);
    checks.push({
      name: "Jungle: ANY route scores the same — a detour costs nothing, a wrong number costs 4",
      pass: bad.length === 0 && tried === 10,
      detail: bad.length ? bad.join(", ") : `${tried} challenges · detour round = 25 · one wrong number = 21`,
    });
  }

  // ---- Per challenge: fuzz · perfect play · pedagogy -----------------------
  const INVARIANTS = {
    swap: (r) => {
      const b = [];
      if (r.stage === 0 && r.moves.join() !== "again") b.push("S1-again-only");
      if ((r.stage === 2) !== (r.drive === "bottom") && r.kind !== "smallest") b.push("S3-drive");
      if (r.stage === 4) {
        const [a, c] = r.smallest; let g = a, h = c; while (h) [g, h] = [h, g % h];
        if (r.kind !== "smallest" || g !== 1) b.push("S5-smallest");
      }
      return b;
    },
    market: (r) => {
      const b = [];
      if (r.kind === "compare") {
        const [A, B] = r.ladders.map((l) => l.L);
        if ((A.a > B.a) !== (A.b > B.b)) b.push("trap");
        if (r.better !== (A.b / A.a < B.b / B.a ? 0 : 1)) b.push("better");
      } else if (r.stage === 1 && partnerOf(r.ladders[0].L, "top", 1) !== null) b.push("S2-one-is-whole");
      return b;
    },
    race: (r) => {
      const b = [];
      if (r.kind === "compare") {
        const [A, B] = r.ladders.map((l) => l.L);
        const sA = A.b / A.a, sB = B.b / B.a;
        if ((A.b > B.b) === (sA > sB)) b.push("fast-trap");
        if (r.phases[1].correct !== (sA > sB ? 0 : 1)) b.push("faster");
      }
      if (r.kind === "fill") {
        const D = r.phases[0].goals[0].target;
        const tA = rungFor(r.ladders[0].L, "top", D)[1], tB = rungFor(r.ladders[1].L, "top", D)[1];
        if (r.phases[1].correct !== (tA < tB ? 0 : 1)) b.push("bank-winner");
      }
      return b;
    },
    tape: (r) => {
      const b = [];
      if (r.kind === "tape" && r.phases[0].type === "type") {
        const L = r.ladders[0].L;
        // The across number really crosses every given rung.
        const k = r.phases[0].answer / 100;
        for (const [t, u] of r.ladders[0].start) {
          if (Math.abs((t / Math.pow(10, L.top.kind === "money" ? 2 : L.top.dp || 0)) * k - u / Math.pow(10, L.bottom.dp || 0)) > 1e-9) b.push("across-k");
        }
      }
      if (r.stage === 2 && r.moves.includes("across")) b.push("S3-along-only");
      return b;
    },
    potion: (r) => {
      const b = [];
      if (r.kind === "same") {
        const [x, y] = r.recipe, [fb, fy] = r.fern;
        if (r.same !== (fb * y === fy * x)) b.push("same-truth");
        if (r.phases[0].final) b.push("same-final");
      }
      if (r.kind === "compare") {
        const [[b1, y1], [b2, y2]] = r.recipes;
        if ((b1 > b2) === (b1 / (b1 + y1) > b2 / (b2 + y2))) b.push("bluer-trap");
      }
      return b;
    },
    barrels: (r) => {
      const b = [];
      if (r.kind === "fill" && r.phases[1].answer !== r.fill.two[0] + r.fill.two[1]) b.push("two-total");
      if (r.kind === "chain" && r.ladders[1].start[0][1] !== rungFor(r.ladders[0].L, "top", 60)[1]) b.push("per-hour-link");
      return b;
    },
    map: (r) => {
      const b = [];
      if (r.phases[0].type === "type" && !r.phases[0].hideLadder) b.push("scale-hidden");
      if (r.phases[0].type === "type" && r.ladders[0].start[0][1] !== r.phases[0].answer) b.push("scale-rung");
      if (r.kind === "long" && r.phases[2].answer !== r.goals2[0][1] + r.goals2[1][1]) b.push("long-total");
      return b;
    },
    fireflies: (r) => {
      const b = [];
      if (r.kind === "match") {
        // Exactly one line matches the story's speed; the story's pair is on no line's start.
        const sp = r.ladders.map((l) => l.L.b / l.L.a);
        const target = sp[r.phases[0].correct];
        if (sp.filter((s) => Math.abs(s - target) < 1e-9).length !== 1) b.push("match-unique");
        if (!r.phases[0].ladders || r.phases[0].ladders.length !== 3) b.push("match-explore");
      }
      if (r.kind === "compare" && r.phases[1].correct !== (r.ladders[0].L.b / r.ladders[0].L.a > r.ladders[1].L.b / r.ladders[1].L.a ? 0 : 1)) b.push("steeper");
      return b;
    },
    temple: (r) => {
      const b = [];
      const straight = r.pairs.every((p) => hangsStraight(r.pairs, p));
      if ((r.truth === "prop") !== straight) b.push(`truth-${r.truth}`);
      if (r.phases[0].correct !== (r.truth === "prop" ? 0 : 1) || !r.phases[0].final) b.push("call");
      return b;
    },
    pathfinder: (r) => {
      const b = [];
      if (r.kind === "chain") {
        const g1 = rungFor(r.ladders[0].L, "top", r.phases[0].goals[0].target);
        if (!g1 || r.phases[1].goals[0].target !== g1[1]) b.push("chain-link");
        if (r.ladders[0].L.bottom.unit !== r.ladders[1].L.top.unit && r.ladders[0].L.bottom.icon !== r.ladders[1].L.top.icon) b.push("chain-units");
      }
      return b;
    },
  };

  for (const key of JUNGLE_CHALLENGE_KEYS) {
    // 1 · fuzz
    {
      const bad = [];
      let rounds = 0;
      for (const s of fuzz(GENERATORS[key])) {
        if (!stagesOk(s)) { bad.push("shape"); break; }
        for (const r of s) {
          rounds++;
          bad.push(...roundBasics(r).map((x) => `${x}@${r.sig}`));
          bad.push(...INVARIANTS[key](r).map((x) => `${x}@${r.sig}`));
        }
        if (bad.length > 6) break;
      }
      checks.push({
        name: `Jungle ${key}: 200 sets — 15 rounds, 5 stages, every round answerable, its own maths holds`,
        pass: bad.length === 0,
        detail: bad.length ? [...new Set(bad)].slice(0, 6).join(" · ") : `${rounds} rounds · every plan walks to its goals · invariants hold`,
      });
    }
    // 2 · perfect play
    checks.push(perfectCheck(key));
  }

  // 3 · pedagogy, one per challenge.
  checks.push(swapTraps(), marketTraps(), raceTraps(), tapeTraps(), potionTraps(), barrelsTraps(), mapTraps(), firefliesTraps(), templeTraps(), pathfinderTraps());
  return checks;
}

// ---------------------------------------------------------------------------
function swapTraps() {
  // The add-the-same trap: 3 ↔ 2, "again" → 6 bananas, type 5 mangoes.
  const S = startAt("swap", 0);
  const res = pendNext(S, (p, r) => additivePartner(r.ladders[0].L, "top", p.from[0], p.value) ?? p.partner + 1);
  const w = S.getState().wrong;
  const trapped = res && res.res === "wrong" && w && w.additive && w.untie !== null && /zero/.test(S.getState().note.text) && S.getState().slips.length === 1;
  // An early "smallest" claim is a slip (−4), not a dead end.
  const i = findRound("swap", (r) => r.kind === "smallest");
  const T = startAt("swap", i);
  T.getState().claim();
  const early = T.getState().misses === 1 && T.getState().status === "play";
  playRound(T, T.getState().currentRound(), true);
  const pts = T.getState().roundPoints;
  // A half banana is refused (odd deal, ÷ 2).
  const H = startAt("swap", 0);
  const odd = H.getState().currentRound().ladders[0].start[0][0] % 2 === 1;
  H.getState().choose("h2");
  const refused = !odd || H.getState().pending === null;
  H.getState().exit();
  return {
    name: "Jungle swap: adding the same to both unties the zero; early claims are a slip; part fruit refused",
    pass: Boolean(trapped && early && pts === 21 && refused),
    detail: `trap:${Boolean(trapped)} early-claim:${early} smallest-round ${pts} pts refused:${refused}`,
  };
}

function marketTraps() {
  // S2: splitting to ONE is refused (part cents); a wrong stall keeps 10 − 4m.
  const S = startAt("market", 3);
  const r = S.getState().currentRound();
  S.getState().choose("split");
  S.getState().pickN(r.ladders[0].start[0][0]);
  const centsRefused = S.getState().pending === null && /cents/.test(S.getState().note?.text || "");
  const ci = findRound("market", (q) => q.kind === "compare");
  const C = startAt("market", ci);
  const rc = C.getState().currentRound();
  C.getState().call(1 - rc.better); // before a common rung: refused
  const early = C.getState().status === "play" && C.getState().called === null;
  playPhase(C, rc);
  C.getState().call(1 - rc.better);
  const wrongCall = C.getState().status === "feedback" && C.getState().roundPoints === 10;
  C.getState().exit();
  return {
    name: "Jungle market: part cents refused ('a friendlier piece'), no call before a common amount, a wrong stall keeps 10",
    pass: Boolean(centsRefused && early && wrongCall),
    detail: `cents:${centsRefused} early:${early} wrong-call:${wrongCall}`,
  };
}

function raceTraps() {
  // A wrong distance on the 🎯 rung = a slip AND a trial (the racer swims past the flag).
  const S = startAt("race", 0);
  const r = S.getState().currentRound();
  // Hang every planned rung but the last (the goal), then type the goal wrong.
  const steps = r.solve[0].steps;
  for (const st of steps.slice(0, -1)) stepLadder(S, st, r);
  const res = pendNext(S, (p) => p.partner + 3);
  const trial = S.getState().trial;
  const ok1 = res && res.res === "wrong" && trial && trial.typed === res.pend.partner + 3 && trial.right === res.pend.partner;
  playRound(S, r, true);
  const pts = S.getState().roundPoints;
  // Who's faster: the trap holds in every S3 round of a set.
  S.getState().exit(); S.getState().start();
  const s3 = S.getState().rounds.filter((q) => q.stage === 2);
  const trapOk = s3.every((q) => { const [A, B] = q.ladders.map((l) => l.L); return (A.b > B.b) !== (A.b / A.a > B.b / B.a); });
  S.getState().exit();
  return {
    name: "Jungle race: a wrong distance at the target is a slip + the racer swims past your flag; the 'bigger number' trap",
    pass: Boolean(ok1 && pts === 21 && trapOk),
    detail: `trial:${Boolean(ok1)} round ${pts} pts · trap in every S3 round:${trapOk}`,
  };
}

function tapeTraps() {
  const S = startAt("tape", 0);
  const r = S.getState().currentRound();
  S.getState().choose("across"); // the across move isn't on the card until found
  const lockedBefore = S.getState().pending === null && S.getState().across === false;
  const wrong = S.getState().submit(String(r.phases[0].answer / 100 + 7));
  const slipped = wrong === "wrong" && S.getState().misses === 1;
  const right = S.getState().submit(String(r.phases[0].answer / 100));
  const unlocked = right === "correct" && S.getState().across === true && S.getState().phase === 1;
  S.getState().choose("across");
  const p = S.getState().pending;
  const jumped = p && p.value === r.phases[1].goals[0].target && p.op === "across";
  if (p) S.getState().submit(fmtVal(vineOn(r.ladders[0].L, other(r.drive)), p.partner));
  const done = S.getState().status === "celebrate" && S.getState().roundPoints === 21;
  S.getState().exit();
  return {
    name: "Jungle tape: the across number is found first (a wrong one is a slip), then ↔ Across jumps to the target",
    pass: Boolean(lockedBefore && slipped && unlocked && jumped && done),
    detail: `locked:${lockedBefore} slip:${slipped} unlocked:${unlocked} jumped:${Boolean(jumped)} done:${done}`,
  };
}

function potionTraps() {
  // "Same potion?": a wrong call is a slip, the round carries on to the fix.
  const i = findRound("potion", (q) => q.kind === "same");
  const S = startAt("potion", i);
  const r = S.getState().currentRound();
  S.getState().call(1 - r.phases[0].correct);
  const carried = S.getState().status === "play" && S.getState().phase === 1 && S.getState().misses === 1;
  playRound(S, r, true);
  const pts = S.getState().roundPoints;
  S.getState().exit();
  // Colour: blue + yellow makes green; the same ratio is the same colour; adding the same changes it.
  const g = potionRGB({ b: 1, y: 1 });
  const green = g[1] > g[0] && g[1] > g[2];
  const same = potionRGB({ b: 2, y: 3 }).every((v, k) => Math.abs(v - potionRGB({ b: 6, y: 9 })[k]) < 1e-9);
  const diff = potionRGB({ b: 2, y: 3 }).some((v, k) => Math.abs(v - potionRGB({ b: 5, y: 6 })[k]) > 0.01);
  return {
    name: "Jungle potion: a wrong 'same potion?' call is a slip and the fix follows; same ratio = same colour, + same changes it",
    pass: Boolean(carried && pts === 21 && green && same && diff),
    detail: `carried:${carried} ${pts} pts · green:${green} same:${same} diff:${diff}`,
  };
}

function barrelsTraps() {
  // Fill-the-barrel: a wrong time is a slip + a trial (over/under-fills).
  const i = findRound("barrels", (q) => q.fill && q.fill.barrel && q.layout === "single");
  const S = startAt("barrels", i);
  const r = S.getState().currentRound();
  for (const st of r.solve[0].steps.slice(0, -1)) stepLadder(S, st, r);
  const res = pendNext(S, (p) => p.partner + 5);
  const trial = S.getState().trial;
  const over = res && res.res === "wrong" && trial && trial.typed > trial.right;
  playRound(S, r, true);
  const ok1 = S.getState().status === "celebrate" && S.getState().roundPoints === 21;
  // Two pipes: the typed total is checked (a wrong total is a slip).
  const j = findRound("barrels", (q) => q.kind === "fill");
  const T = startAt("barrels", j);
  const rt = T.getState().currentRound();
  playPhase(T, rt);
  const wrongTotal = T.getState().submit(String(rt.phases[1].answer + 1)) === "wrong";
  T.getState().submit(String(rt.phases[1].answer));
  const ok2 = wrongTotal && T.getState().status === "celebrate" && T.getState().roundPoints === 21;
  T.getState().exit();
  return {
    name: "Jungle barrels: a wrong time over-fills the barrel (a slip); two pipes' total is checked",
    pass: Boolean(over && ok1 && ok2),
    detail: `overflow-trial:${Boolean(over)} fill:${ok1} two-pipes:${ok2}`,
  };
}

function mapTraps() {
  const i = findRound("map", (q) => q.kind === "scale");
  const S = startAt("map", i);
  const r = S.getState().currentRound();
  const hidden = r.phases[0].hideLadder === true && S.getState().phase === 0;
  const wrong = S.getState().submit(String(r.phases[0].answer * 10)) === "wrong"; // forgot ÷ 100 the other way
  playRound(S, r, true);
  const ok = S.getState().status === "celebrate" && S.getState().roundPoints === 21;
  S.getState().exit();
  return {
    name: "Jungle map: a 1 : N scale is changed to metres first (the ladder hides till then); a wrong scale is a slip",
    pass: Boolean(hidden && wrong && ok),
    detail: `hidden:${hidden} wrong:${wrong} round:${ok}`,
  };
}

function firefliesTraps() {
  // Match the story: hanging fireflies on ANY line while deciding is allowed.
  const i = findRound("fireflies", (q) => q.kind === "match");
  const S = startAt("fireflies", i);
  const r = S.getState().currentRound();
  const li = (r.phases[0].correct + 1) % 3;
  S.getState().setActive(li);
  S.getState().choose("x2");
  const p = S.getState().pending;
  if (p) S.getState().submit(fmtVal(vineOn(r.ladders[li].L, "bottom"), p.partner));
  const explored = S.getState().ladders[li].rungs.length === 2;
  S.getState().call(r.phases[0].correct);
  const ok = S.getState().status === "celebrate" && S.getState().roundPoints === 25;
  // Additive firefly: off the line, the zero untied.
  const T = startAt("fireflies", 0);
  const res = pendNext(T, (pp, rr) => additivePartner(rr.ladders[0].L, "top", pp.from[0], pp.value) ?? pp.partner + 1);
  const off = res && res.res === "wrong" && T.getState().wrong && (T.getState().wrong.additive ? T.getState().wrong.untie !== null : true);
  T.getState().exit();
  return {
    name: "Jungle fireflies: fireflies can be hung on any line before matching a story; a wrong one sits off the line",
    pass: Boolean(explored && ok && off),
    detail: `explored:${explored} match:${ok} off-line:${Boolean(off)}`,
  };
}

function templeTraps() {
  // (Tablets are shuffled within each stage, so find them in the live set.)
  // A wrong works/breaks call ends the round with nothing.
  const A = startWhere("temple", (q) => q.truth === "prop");
  A.getState().call(1);
  const ended = A.getState().status === "feedback" && A.getState().roundPoints === 0;
  // A wrong reason is a slip; the round still finishes right.
  const B = startWhere("temple", (q) => q.truth !== "prop");
  const rb = B.getState().currentRound();
  B.getState().call(1);
  B.getState().call((rb.phases[1].correct + 1) % rb.phases[1].options.length);
  const slip = B.getState().status === "celebrate" && B.getState().roundPoints === 21;
  B.getState().exit();
  // Every stage has a proportional tablet and a broken one.
  let mixOk = true;
  for (const s of fuzz(generateTempleSet, 60)) {
    for (let st = 0; st < 5; st++) {
      const trio = s.filter((q) => q.stage === st);
      if (!trio.some((q) => q.truth === "prop") || !trio.some((q) => q.truth !== "prop")) mixOk = false;
    }
  }
  return {
    name: "Jungle temple: a wrong 'works / breaks' call ends the round; a wrong reason is a slip; every stage mixes both",
    pass: Boolean(ended && slip && mixOk),
    detail: `ended:${ended} reason-slip:${slip} mix:${mixOk}`,
  };
}

function pathfinderTraps() {
  // A chain: leg 2 only after leg 1, and its target is leg 1's answer.
  const i = findRound("pathfinder", (q) => q.kind === "chain");
  const S = startAt("pathfinder", i);
  const r = S.getState().currentRound();
  S.getState().setActive(1);
  const notYet = S.getState().active === 0;
  playPhase(S, r);
  const onLeg2 = S.getState().phase === 1 && S.getState().active === 1;
  playRound(S, r, true);
  const ok = S.getState().status === "celebrate" && S.getState().roundPoints === 25;
  S.getState().exit();
  return {
    name: "Jungle pathfinder: expedition ladders run in order — leg 1's answer is leg 2's target",
    pass: Boolean(notYet && onLeg2 && ok),
    detail: `leg2-locked:${notYet} on-leg-2:${onLeg2} done:${ok}`,
  };
}
