/**
 * MAGMA MULTIPLES — headless checks for the ten multiplicative challenges
 * (2026-10-03). Three per challenge (MC-<key>-1/2/3) + four framework
 * checks (MCF1–MCF4):
 *   1  300-set generation fuzz — 15 rounds, the 5-stage arc, no repeats,
 *      the challenge's own maths invariants
 *   2  PERFECT PLAY through the REAL store — every round scores exactly 25,
 *      the set 375, the local best is saved and the trophy turns gold
 *   3  the pedagogy: the traps and partial-credit paths behave (wrong
 *      paths score less and land on the feedback card)
 */
import {
  MAGMA_CHALLENGES, MAGMA_CHALLENGE_KEYS, getMagmaChallenge, magmaHostId, magmaHostWorld,
  MAGMA_WELCOME_HOST, MAGMA_RECORDS_STAND, inMagmaChallengeView, TERRACE_GEOM,
} from "../data/magma/magmaChallenges.js";
import {
  MAGMA_BEST_KEYS, MAGMA_MAX_SCORES, magmaTrophyRows, readMagmaBest, magmaBestPercent, medalFor,
} from "../data/magma/magmaRecords.js";
import {
  magmaGroundHeight, magmaIsLava, magmaSlideAt, isOnTrail, VOLCANO, MAGMA_REGION_ID, MAGMA_CHALLENGE_SPOTS,
} from "../data/magma/magmaLayout.js";
import { getMagmaColliders } from "../data/magma/magmaColliders.js";
import { INTERACTABLES } from "../data/interactables.js";
import { ENCOUNTERS } from "../data/encounters.js";
import { MAGMA_STORES, magmaStore, exitMagmaExcept, activeMagmaChallengeKey } from "../game/magma/magmaActive.js";
import { fmtThousandths, factorPairs, isPrime } from "../data/magma/magmaMath.js";

import { generateColumnsSet, gradeColumnsKeep } from "../data/magma/columnsChallenge.js";
import { generateObsidianSet, obsidianBestCrack, obsidianPieces, obsidianTotalOf } from "../data/magma/obsidianChallenge.js";
import { generateTerracesSet, terraceStones, shiftStones, terracePlaceholders, checkTerraceResult } from "../data/magma/terracesChallenge.js";
import { generateGeysersSet, geyserEasy } from "../data/magma/geysersChallenge.js";
import { generateForgeSet, forgePlan, forgeFriendly } from "../data/magma/forgeChallenge.js";
import { generateGardenSet, gradeGardenPredict } from "../data/magma/gardenChallenge.js";
import { generateCinderSet, cinderBestPath, cinderRocks } from "../data/magma/cinderChallenge.js";
import { generateLakeSet, lakeChunks } from "../data/magma/lakeChallenge.js";
import { generateBonesSet, gradeBonesRaise } from "../data/magma/bonesChallenge.js";
import { generateSummitSet } from "../data/magma/summitChallenge.js";

// Characters with a real glb (characterModels.js reads import.meta.env, so
// it can't be imported headlessly — this list mirrors its keys).
const GLB_CHARACTERS = ["pip", "fern", "alby", "sage", "pearce", "mahoney", "ewings", "dawson", "heywood", "morgan", "bacon", "brookes", "trevor", "steve", "robot"];

const fuzz = (gen, n = 300) => Array.from({ length: n }, () => gen());
const stagesOk = (set) => set.length === 15 && set.every((r, i) => r.stage === Math.floor(i / 3) && r.roundIndex === i) && new Set(set.map((r) => r.sig)).size === 15;

/** Drive a store through a whole set with `play(round, get)`; returns the per-round points. */
function playSet(key, play) {
  const store = magmaStore(key);
  try { localStorage.removeItem(MAGMA_BEST_KEYS[key]); } catch { /* headless */ }
  store.getState().exit();
  store.getState().start();
  store.getState().beginRounds();
  const pts = [];
  for (let i = 0; i < 15; i++) {
    const st = store.getState();
    if (st.status !== "play") { pts.push(-1); break; }
    play(st.currentRound(), store.getState, store);
    const after = store.getState();
    pts.push(after.roundPoints);
    if (after.status === "celebrate" || after.status === "feedback") after.next();
    else { pts.push(-2); break; }
  }
  const end = store.getState();
  return { pts, status: end.status, score: end.score };
}

function perfectCheck(key, play) {
  const res = playSet(key, play);
  const best = readMagmaBest(key);
  const pct = magmaBestPercent(key, best);
  const medal = medalFor(pct);
  const ok = res.pts.length === 15 && res.pts.every((p) => p === 25) && res.score === 375 && res.status === "done" && best === 375 && medal && medal.id === "gold";
  magmaStore(key).getState().exit();
  return {
    name: `Magma ${key}: perfect play scores 25 every round (375, gold)`,
    pass: Boolean(ok),
    detail: ok ? "15 × 25 = 375 · best saved · gold" : `pts ${res.pts.join(",")} score ${res.score} status ${res.status} best ${best}`,
  };
}

/** Play ONE round with `play`, return { points, status } (then exit). */
function oneRound(key, roundIndex, play) {
  const store = magmaStore(key);
  store.getState().exit();
  store.getState().start();
  store.getState().beginRounds();
  if (roundIndex) store.setState({ roundIndex, ...freshFor(key, store.getState().rounds[roundIndex]) });
  play(store.getState().currentRound(), store.getState, store);
  const s = store.getState();
  const out = { points: s.roundPoints, status: s.status, state: s };
  store.getState().exit();
  return out;
}
// Per-round state resets needed when jumping to a round (mirror each store's fresh()).
function freshFor(key, r) {
  switch (key) {
    case "obsidian": return { phase: "crack", crackStep: "cols", cols: Math.max(1, Math.floor(r.b / 2)), rows: Math.max(1, Math.floor(r.a / 2)), pieces: [], pieceIndex: 0, pieceResults: [] };
    case "terraces": return { phase: r.fact ? "fact" : "slide", shift: 0 };
    case "geysers": return { phase: "shape", chain: [[r.a, r.b]] };
    case "forge": return { ingots: r.ingots.slice(), selected: [], friendlyDone: false, finalMissed: false };
    case "cinder": return { cols: [[r.c0, r.r0]], sel: [0], pending: null, misses: 0 };
    case "lake": return { phase: "pour", left: r.D, pours: [], spills: 0 };
    case "bones": return { phase: r.askFactor ? "factor" : "build", vals: r.baby.slice(1), raises: 0, earned: [false, false, false], grade: null };
    case "garden": return { phase: "predict", planted: [], sel: { f: 0, p: 0, g: 0 } };
    case "summit": return { phase: "pick", picked: null };
    default: return { rows: 1, kept: [] };
  }
}

// ---------------------------------------------------------------------------
// Perfect players (they use only the store's public verbs).
// ---------------------------------------------------------------------------
const PERFECT = {
  columns(r, get) {
    for (const [a] of r.pairs) { get().setRows(a); get().keep(); }
    get().claim();
  },
  obsidian(r, get) {
    const best = obsidianBestCrack(r);
    get().setCrack(best.cols);
    get().lockCrack();
    if (r.kind === "area") { get().setCrack(best.rows); get().lockCrack(); }
    for (const p of get().pieces) get().submitPiece(String(p.value));
    get().submitTotal(String(r.product));
  },
  terraces(r, get) {
    if (r.fact) get().submitFact(String(r.fact[0] * r.fact[1]));
    for (let k = 0; k < Math.abs(r.shift); k++) get().slide(Math.sign(r.shift));
    get().lock();
    get().submitResult(fmtThousandths(r.result));
  },
  geysers(r, get) {
    for (let k = 1; k < r.best.length; k++) {
      const [a] = r.best[k - 1];
      const [a2] = r.best[k];
      get().move(a2 < a ? "rows" : "cols");
    }
    get().solve();
    get().submit(String(r.product));
  },
  forge(r, get) {
    const plan = forgePlan(r.ingots);
    let ingots = get().ingots;
    if (plan.split) {
      get().select(plan.j);
      get().split([plan.f, ingots[plan.j] / plan.f].sort((x, y) => x - y));
      ingots = get().ingots;
    }
    // fuse the friendly pair: ingot i's value with an f
    const vi = r.ingots[plan.i];
    const ii = ingots.indexOf(vi);
    let jj = ingots.findIndex((v, k) => k !== ii && v === plan.f);
    get().select(ii); get().select(jj);
    get().fuse(String(vi * plan.f));
    // then fuse whatever is left, left to right
    let guard = 0;
    while (get().ingots.length > 1 && guard++ < 6) {
      const ing = get().ingots;
      get().clearSelection();
      get().select(0); get().select(1);
      get().fuse(String(ing[0] * ing[1]));
    }
  },
  garden(r, get) {
    get().submitPredict(String(r.inverse ? r.p : r.total));
    for (let g = 0; g < r.g; g++) for (let f = 0; f < r.f; f++) { get().choose("f", f); get().choose("g", g); get().plantRow(); }
    get().claim();
  },
  cinder(r, get) {
    for (const step of cinderBestPath(r).path) {
      const cols = get().cols;
      const ia = cols.findIndex((c) => c[0] === step.a);
      const ib = step.b !== undefined ? cols.findIndex((c, k) => c[0] === step.b && k !== ia) : -1;
      useSel(get, ia, ib);
      get().op(step.op);
      get().submitRocks(String(get().pending.rocks));
    }
  },
  lake(r, get) {
    for (const k of lakeChunks(r.q)) get().pour(k);
    get().submitAnswer(String(r.answer));
  },
  bones(r, get) {
    if (r.askFactor) get().submitFactor(r.factorText);
    r.adult.slice(1).forEach((v, j) => get().setVal(j, v));
    get().raise();
  },
  summit(r, get) {
    get().pick(r.choices.find((c) => c.best).key);
    get().submit(String(r.answer));
  },
};
function useSel(get, ia, ib) {
  // reset the selection to exactly [ia] or [ia, ib]
  for (const k of get().sel.slice()) get().select(k);
  get().select(ia);
  if (ib >= 0) get().select(ib);
}

// ---------------------------------------------------------------------------
export function runMagmaChallengeChecks() {
  const checks = [];
  const colliders = getMagmaColliders();

  // MCF1) Registry wiring: ten challenges in trophy order, hosts with real
  //       models standing on safe ground, interactables + encounters + best
  //       keys + trophy rows all in lockstep.
  {
    const keys = MAGMA_CHALLENGE_KEYS;
    const want = ["columns", "obsidian", "terraces", "geysers", "forge", "garden", "cinder", "lake", "bones", "summit"];
    const order = keys.join() === want.join();
    const storesOk = MAGMA_STORES.map(([k]) => k).join() === want.join();
    const hostIds = new Set(INTERACTABLES.filter((i) => i.regionId === MAGMA_REGION_ID).map((i) => i.id));
    const ixOk = keys.every((k) => hostIds.has(magmaHostId(k))) && hostIds.has(MAGMA_WELCOME_HOST.id) && hostIds.has(MAGMA_RECORDS_STAND.id);
    const encOk = keys.every((k) => ENCOUNTERS[`magma-${k}-challenge`]) && ENCOUNTERS["magma-welcome"] && ENCOUNTERS["magma-records"];
    const glbOk = MAGMA_CHALLENGES.every((c) => GLB_CHARACTERS.includes(c.host.characterId));
    const distinct = new Set(MAGMA_CHALLENGES.map((c) => c.host.characterId)).size === 10;
    const badGround = [];
    for (const c of MAGMA_CHALLENGES) {
      for (const [label, p] of [["host", magmaHostWorld(c.key)], ["park", c.frame.toWorld(c.parkAt[0], c.parkAt[1])]]) {
        if (magmaIsLava(p[0], p[1]) || magmaSlideAt(p[0], p[1])) badGround.push(`${c.key}-${label}`);
        if (Math.abs(magmaGroundHeight(p[0], p[1]) - c.frame.y) > 0.6) badGround.push(`${c.key}-${label}-height`);
      }
    }
    const parkBlocked = MAGMA_CHALLENGES.filter((c) => {
      const [x, z] = c.frame.toWorld(c.parkAt[0], c.parkAt[1]);
      return colliders.some((k) => Math.hypot(k.x - x, k.z - z) < k.radius + 0.45);
    }).map((c) => c.key);
    const keysOk = keys.every((k) => MAGMA_BEST_KEYS[k] === `mma-magma-${k}-best` && MAGMA_MAX_SCORES[k] === 375) && magmaTrophyRows().length === 10;
    const pass = order && storesOk && ixOk && encOk && glbOk && distinct && badGround.length === 0 && parkBlocked.length === 0 && keysOk;
    checks.push({
      name: "Magma challenges: ten in trophy order, real hosts on safe ground, wiring in lockstep",
      pass,
      detail: pass ? "10 challenges · 10 distinct glb hosts · 12 interactables · bests mma-magma-<key>-best (375)"
        : `order:${order} stores:${storesOk} ix:${ixOk} enc:${Boolean(encOk)} glb:${glbOk} distinct:${distinct} ground:${badGround.join("|")} park:${parkBlocked.join("|")} keys:${keysOk}`,
    });
  }

  // MCF2) Every stage stands on flat, solid ground; every camera floats
  //       clear of the terrain at its closest AND furthest distance; the
  //       summit stage is on the intact rim (not the trail cut, not the lip).
  {
    const bad = [];
    for (const c of MAGMA_CHALLENGES) {
      const f = c.frame;
      if (c.key !== "lake") {
        const zs = c.key === "summit" ? [-2, -1, 0, 1] : [-3, -1, 1];
        for (let x = -4; x <= 4; x += 2) for (const z of zs) {
          const [wx, wz] = f.toWorld(x, z);
          if (magmaIsLava(wx, wz)) bad.push(`${c.key}:lava@${x},${z}`);
          if (Math.abs(magmaGroundHeight(wx, wz) - f.y) > 0.45) bad.push(`${c.key}:slope@${x},${z}`);
          if (c.key === "summit" && isOnTrail(wx, wz)) bad.push(`summit:trail@${x},${z}`);
        }
      }
      for (const dist of [c.view.minDist, c.view.maxDist]) {
        const [lx, ly, lz] = c.view.look;
        const [cx, cz] = f.toWorld(lx, lz + Math.cos(c.view.elev) * dist);
        const cy = f.y + ly + Math.sin(c.view.elev) * dist;
        if (cy < magmaGroundHeight(cx, cz) + 1.5) bad.push(`${c.key}:camera-underground@${dist}`);
      }
    }
    // The summit tablets sit between the crater lip and the rim kerb.
    const s = getMagmaChallenge("summit");
    const r = Math.hypot(...s.frame.toWorld(0, -1.2));
    if (!(r > VOLCANO.rCrater + 1.2 && r < VOLCANO.rRim - 1.0)) bad.push(`summit-r=${r.toFixed(1)}`);
    // The lake channel (stage z −3.5 … −12.3, x ≈ ±2.3) runs over open lava,
    // clear of the lake's hop-stones and the falls cliff.
    const lk = getMagmaChallenge("lake").frame;
    for (let z = -5; z >= -12; z -= 1) for (const x of [-1.5, 0.8, 2.6]) {
      const [wx, wz] = lk.toWorld(x, z);
      if (colliders.some((k) => /mg-cliff/.test(k.id) && Math.hypot(k.x - wx, k.z - wz) < k.radius)) bad.push(`lake-channel-cliff@${z}`);
    }
    checks.push({
      name: "Magma challenges: stages on flat solid ground, cameras above the terrain",
      pass: bad.length === 0,
      detail: bad.length === 0 ? "10 stages · 20 camera extremes · summit on the intact rim · lake channel over open lava" : bad.slice(0, 8).join(", "),
    });
  }

  // MCF3) Stores: the lifecycle works, no state field shadows a verb (the
  //       start() reset must never overwrite an action), one challenge at a
  //       time, and the corridor test knows each host is in its own shot.
  {
    const bad = [];
    for (const [key, store] of MAGMA_STORES) {
      const fnNames = Object.keys(store.getState()).filter((k) => typeof store.getState()[k] === "function");
      store.getState().start();
      if (store.getState().status !== "intro") bad.push(`${key}:intro`);
      const lost = fnNames.filter((k) => typeof store.getState()[k] !== "function");
      if (lost.length) bad.push(`${key}:shadowed ${lost.join("/")}`);
      store.getState().beginRounds();
      if (store.getState().status !== "play" || store.getState().rounds.length !== 15) bad.push(`${key}:play`);
    }
    if (activeMagmaChallengeKey() === null) bad.push("active-null");
    exitMagmaExcept("forge");
    const still = MAGMA_STORES.filter(([, s]) => s.getState().status !== "idle").map(([k]) => k);
    if (still.join() !== "forge") bad.push(`exceptForge:${still.join("/")}`);
    exitMagmaExcept(null);
    if (activeMagmaChallengeKey() !== null) bad.push("not-all-exited");
    const notInShot = MAGMA_CHALLENGES.filter((c) => {
      const [x, z] = c.frame.toWorld(...c.view.look.filter((_, i) => i !== 1));
      return !inMagmaChallengeView(c.key, x, z);
    }).map((c) => c.key);
    if (notInShot.length) bad.push(`corridor:${notInShot.join("/")}`);
    checks.push({
      name: "Magma challenges: store lifecycle, no shadowed verbs, one at a time",
      pass: bad.length === 0,
      detail: bad.length === 0 ? "10 stores start → intro → play (15 rounds) and exit cleanly" : bad.join(", "),
    });
  }

  // MCF4) The Tenfold Terraces staircase: seven terraces, each one step up
  //       (thousands highest), the decimal point between ones and tenths,
  //       and the clearing really exists.
  {
    const G = TERRACE_GEOM;
    const steps = G.places.slice(0, -1).every((p, i) => G.top(p) > G.top(G.places[i + 1]) && G.x(p) < G.x(G.places[i + 1]));
    const point = G.pointX > G.x(0) && G.pointX < G.x(-1);
    const spot = MAGMA_CHALLENGE_SPOTS.some((s) => s.id === "terraces");
    checks.push({
      name: "Magma: the Tenfold Terraces staircase (seven places, the point fixed between O and t)",
      pass: steps && point && spot && G.places.length === 7,
      detail: `steps:${steps} point:${point} clearing:${spot}`,
    });
  }

  // ---- 1 · COLUMN RECTANGLES -------------------------------------------
  {
    const sets = fuzz(generateColumnsSet);
    const bad = [];
    for (const s of sets) {
      if (!stagesOk(s)) { bad.push("shape"); break; }
      if (!s.slice(6, 9).some((r) => r.prime)) bad.push("no-prime");
      if (!s.slice(9, 12).every((r) => r.square)) bad.push("S4-not-square");
      if (!s.slice(12).every((r) => r.pairs.length >= 4)) bad.push("S5-not-rich");
      if (s.some((r) => r.pairs.length !== factorPairs(r.n).length || r.prime !== isPrime(r.n))) bad.push("pairs");
    }
    checks.push({ name: "Magma columns: 300 sets — primes in S3, squares in S4, rich numbers in S5", pass: bad.length === 0, detail: bad.length ? [...new Set(bad)].join(",") : "4500 rounds ok" });
    checks.push(perfectCheck("columns", PERFECT.columns));
    // Pedagogy: the turned rectangle isn't new; leftovers aren't kept; an
    // early claim scores only its share and ends on the feedback card.
    const r = { n: 12, pairs: factorPairs(12) };
    const turned = gradeColumnsKeep(r, 4, [[3, 4]]).kind === "turned";
    const left = gradeColumnsKeep(r, 5, []).kind === "leftover";
    const early = oneRound("columns", 12, (rr, get) => { get().setRows(1); get().keep(); get().claim(); });
    const pass = turned && left && early.points < 25 && early.status === "feedback" && early.state.missing.length > 0;
    checks.push({ name: "Magma columns: turned = same rectangle, leftovers glow, early claims reveal the rest", pass, detail: `turned:${turned} leftover:${left} early:${early.points}/${early.status}` });
  }

  // ---- 2 · CRACK THE CRYSTAL -------------------------------------------
  {
    const bad = [];
    for (const s of fuzz(generateObsidianSet)) {
      if (!stagesOk(s)) { bad.push("shape"); break; }
      for (const r of s) {
        const best = obsidianBestCrack(r);
        const pieces = obsidianPieces(r, best.cols, best.rows || null);
        if (obsidianTotalOf(pieces) !== r.product) bad.push(`sum-${r.sig}`);
        if (r.kind === "grow" && !pieces.some((p) => p.take)) bad.push("grow-no-ghost");
        if (r.kind === "area" && pieces.length !== 4) bad.push("area-not-4");
      }
      if (s.slice(12).map((r) => r.kind).sort().join() !== "area,grow,place") bad.push("S5-mix");
    }
    checks.push({ name: "Magma obsidian: 300 sets — the friendly crack always rebuilds the product", pass: bad.length === 0, detail: bad.length ? [...new Set(bad)].slice(0, 6).join(",") : "4500 rounds ok" });
    checks.push(perfectCheck("obsidian", PERFECT.obsidian));
    // A clumsy crack + a wrong piece still finishes the round, for less.
    const clumsy = oneRound("obsidian", 3, (r, get) => {
      get().setCrack(1); get().lockCrack();
      get().submitPiece("1"); get().submitPiece(String(get().pieces[1].value));
      get().submitTotal(String(r.product));
    });
    checks.push({ name: "Magma obsidian: a clumsy crack + a wrong piece score less (feedback)", pass: clumsy.points < 25 && clumsy.points > 0 && clumsy.status === "feedback", detail: `${clumsy.points} pts, ${clumsy.status}` });
  }

  // ---- 3 · TENFOLD TERRACES --------------------------------------------
  {
    const bad = [];
    for (const s of fuzz(generateTerracesSet)) {
      if (!stagesOk(s)) { bad.push("shape"); break; }
      for (const r of s) {
        const st = shiftStones(terraceStones(r.start), r.shift);
        if (!st.every((x) => x.place <= 3 && x.place >= -3)) bad.push(`off-terrace-${r.sig}`);
        if (!Number.isInteger(r.result) || r.result <= 0) bad.push(`result-${r.sig}`);
        if ((r.stage >= 3) !== Boolean(r.fact)) bad.push("fact-stage");
      }
      if (s[3].shift !== 1 || s[3].start % 1000 === 0) bad.push("no-trap-round4");
    }
    // The "just add a zero" trap is marked wrong; placeholders hold empty places.
    const trap = { result: 35000 };
    const trapOk = !checkTerraceResult(trap, "3.50").correct && checkTerraceResult(trap, "35").correct && checkTerraceResult(trap, "35.0").correct;
    const ph = terracePlaceholders(shiftStones(terraceStones(47000), 2)).join() === "1,0"; // 4700 → zeros in T and O
    checks.push({ name: "Magma terraces: 300 sets — digits stay on the terraces; 3.50 ≠ 35; zeros hold places", pass: bad.length === 0 && trapOk && ph, detail: bad.length ? [...new Set(bad)].slice(0, 6).join(",") : `trap:${trapOk} placeholders:${ph}` });
    checks.push(perfectCheck("terraces", PERFECT.terraces));
    const wrongWay = oneRound("terraces", 0, (r, get) => { get().slide(-Math.sign(r.shift) || -1); get().lock(); get().submitResult(fmtThousandths(r.result)); });
    checks.push({ name: "Magma terraces: sliding the wrong way loses the slide points (and snaps right)", pass: wrongWay.points === 15 && wrongWay.status === "feedback", detail: `${wrongWay.points} pts, ${wrongWay.status}` });
  }

  // ---- 4 · HALVE & DOUBLE ----------------------------------------------
  {
    const bad = [];
    for (const s of fuzz(generateGeysersSet)) {
      if (!stagesOk(s)) { bad.push("shape"); break; }
      for (const r of s) {
        const end = r.best[r.best.length - 1];
        if (!geyserEasy(end[0], end[1])) bad.push(`no-easy-${r.sig}`);
        if (r.best.length < 2) bad.push(`already-easy-${r.sig}`);
        if (r.best.some(([x, y]) => x * y !== r.product)) bad.push("area-changed");
      }
    }
    checks.push({ name: "Magma geysers: 300 sets — every terrace starts hard, reaches easy, keeps its area", pass: bad.length === 0, detail: bad.length ? [...new Set(bad)].slice(0, 6).join(",") : "4500 rounds ok" });
    checks.push(perfectCheck("geysers", PERFECT.geysers));
    const noSteps = oneRound("geysers", 0, (r, get) => { get().solve(); get().submit(String(r.product)); });
    const odd = oneRound("geysers", 0, (r, get) => { get().move(r.a % 2 ? "rows" : "cols"); });
    const oddOk = odd.state.chain.length === 1 && odd.state.note && /odd/.test(odd.state.note.text);
    checks.push({ name: "Magma geysers: solving without a blast earns only the product; odd numbers won't halve", pass: noSteps.points === 15 && noSteps.status === "feedback" && oddOk, detail: `no-steps ${noSteps.points} pts · odd refused ${oddOk}` });
  }

  // ---- 5 · FACTOR FORGE ------------------------------------------------
  {
    const bad = [];
    for (const s of fuzz(generateForgeSet)) {
      if (!stagesOk(s)) { bad.push("shape"); break; }
      for (const r of s) {
        const plan = forgePlan(r.ingots);
        if (!plan) bad.push(`no-plan-${r.sig}`);
        else if (!forgeFriendly(r.ingots[plan.i], plan.f)) bad.push(`plan-not-friendly-${r.sig}`);
      }
      if (!s.slice(9, 12).every((r) => r.ingots.length === 3)) bad.push("S4-not-three");
    }
    checks.push({ name: "Magma forge: 300 sets — every product has a friendly fusion to find", pass: bad.length === 0, detail: bad.length ? [...new Set(bad)].slice(0, 6).join(",") : "4500 rounds ok" });
    checks.push(perfectCheck("forge", PERFECT.forge));
    // Brute force (type the product straight away) earns only the 15.
    const brute = oneRound("forge", 0, (r, get) => { get().select(0); get().select(1); get().fuse(String(r.product)); });
    const prime = oneRound("forge", 10, (r, get) => { const k = get().ingots.findIndex((v) => isPrime(v) && v > 5); if (k >= 0) { get().select(k); get().split([1, get().ingots[k]]); } });
    checks.push({ name: "Magma forge: fusing without making a ten earns only the final 15; primes won't split", pass: brute.points === 15 && brute.status === "feedback" && prime.state.ingots.length === 3, detail: `brute ${brute.points} pts · prime round ingots ${prime.state.ingots.length}` });
  }

  // ---- 6 · FLOWER COMBOS -----------------------------------------------
  {
    const bad = [];
    for (const s of fuzz(generateGardenSet)) {
      if (!stagesOk(s)) { bad.push("shape"); break; }
      if (!s.slice(9, 12).every((r) => r.inverse)) bad.push("S4-not-inverse");
      if (!s.slice(6, 9).every((r) => r.g === 2) || s[13].g !== 3) bad.push("glows");
      if (s.some((r) => r.total !== r.f * r.p * r.g || r.total > 36)) bad.push("total");
    }
    const add = gradeGardenPredict({ f: 3, p: 4, g: 1, total: 12, inverse: false }, "7");
    checks.push({ name: "Magma garden: 300 sets — glows in S3, missing factors in S4; adding is named", pass: bad.length === 0 && !add.correct && /ADDS/.test(add.note), detail: bad.length ? [...new Set(bad)].join(",") : "4500 rounds ok · 3 + 4 flagged as adding" });
    checks.push(perfectCheck("garden", PERFECT.garden));
    const half = oneRound("garden", 3, (r, get) => { get().submitPredict(String(r.f + r.p)); get().choose("f", 0); get().plantRow(); get().claim(); });
    checks.push({ name: "Magma garden: a wrong guess + half a garden scores its share and shows the gaps", pass: half.points > 0 && half.points < 15 && half.status === "feedback" && half.state.claimResult.missing.length > 0, detail: `${half.points} pts, ${half.state.claimResult?.missing.length} gaps` });
  }

  // ---- 7 · CART TABLES -------------------------------------------------
  {
    const bad = [];
    for (const s of fuzz(generateCinderSet)) {
      if (!stagesOk(s)) { bad.push("shape"); break; }
      for (const r of s) {
        const bp = cinderBestPath(r);
        if (bp.min < 2 || bp.min > 5 || bp.path.length !== bp.min) bad.push(`min-${r.sig}`);
        if (bp.path[bp.path.length - 1]?.c !== r.targetCarts) bad.push(`path-${r.sig}`);
        if (cinderRocks(r, r.targetCarts) !== r.targetRocks) bad.push("rocks");
      }
      if (!s.slice(9, 12).every((r) => r.targetRow === "bottom")) bad.push("S4-not-division");
      if (!s.slice(12).every((r) => r.c0 > 1)) bad.push("S5-unit");
    }
    checks.push({ name: "Magma cinder: 300 sets — every target needs 2–5 columns, division in S4, non-unit rates in S5", pass: bad.length === 0, detail: bad.length ? [...new Set(bad)].slice(0, 6).join(",") : "4500 rounds ok" });
    checks.push(perfectCheck("cinder", PERFECT.cinder));
    // A wrong rock count costs 3; a long way round costs efficiency.
    const sloppy = oneRound("cinder", 0, (r, get) => {
      get().op("x2"); get().submitRocks("1"); get().submitRocks(String(get().pending.rocks));
      for (let k = 0; k < 8 && get().status === "play"; k++) {
        const cols = get().cols; const last = cols.length - 1;
        useSel(get, 0, last);
        get().op("add");
        if (!get().pending) break;
        get().submitRocks(String(get().pending.rocks));
      }
    });
    checks.push({ name: "Magma cinder: wrong rock counts and long tables score less", pass: sloppy.points < 25 && sloppy.status !== "play", detail: `${sloppy.points} pts, ${sloppy.status}` });
  }

  // ---- 8 · LAVA CHANNELS -----------------------------------------------
  {
    const bad = [];
    for (const s of fuzz(generateLakeSet)) {
      if (!stagesOk(s)) { bad.push("shape"); break; }
      for (const r of s) {
        if (r.D !== r.q * r.d + r.rem) bad.push("D");
        if (lakeChunks(r.q).reduce((a, b) => a + b, 0) !== r.q) bad.push("chunks");
      }
      if (s.slice(9, 12).map((r) => r.kind).join() !== "up,down,left" || !s.slice(9, 12).every((r) => r.rem > 0)) bad.push("S4-contexts");
      if (!s.slice(12).every((r) => r.kind === "share" && r.rem === 0)) bad.push("S5-share");
      if (s[9].answer !== s[9].q + 1 || s[10].answer !== s[10].q || s[11].answer !== s[11].rem) bad.push("context-answers");
    }
    checks.push({ name: "Magma lake: 300 sets — rafts round UP, full bags round DOWN, leftovers are the remainder", pass: bad.length === 0, detail: bad.length ? [...new Set(bad)].join(",") : "4500 rounds ok" });
    checks.push(perfectCheck("lake", PERFECT.lake));
    const oneAtATime = oneRound("lake", 3, (r, get) => { get().pour(r.q * 2); for (let k = 0; k < r.q; k++) get().pour(1); get().submitAnswer(String(r.answer)); });
    checks.push({ name: "Magma lake: a spill costs 3 and pouring one row at a time scores low", pass: oneAtATime.points < 15 && oneAtATime.state.spills === 1 && oneAtATime.status === "feedback", detail: `${oneAtATime.points} pts, ${oneAtATime.state.spills} spill` });
  }

  // ---- 9 · GROW THE DRAGON ---------------------------------------------
  {
    const bad = [];
    for (const s of fuzz(generateBonesSet)) {
      if (!stagesOk(s)) { bad.push("shape"); break; }
      for (const r of s) {
        if (!r.adult.every((v) => Number.isInteger(v) && v >= 1 && v <= 60)) bad.push(`len-${r.sig}`);
        const add = r.adult[0] - r.baby[0];
        const additive = r.baby.slice(1).map((b) => b + add);
        if (additive.some((v, j) => v === r.adult[j + 1])) bad.push("additive-indistinct");
      }
      if (!s.slice(6, 9).every((r) => r.toy && r.num === 1)) bad.push("S3-toy");
      if (!s.slice(12).every((r) => r.askFactor)) bad.push("S5-factor");
    }
    checks.push({ name: "Magma bones: 300 sets — whole-number bones; the add-the-same trap is always visibly wrong", pass: bad.length === 0, detail: bad.length ? [...new Set(bad)].slice(0, 6).join(",") : "4500 rounds ok" });
    checks.push(perfectCheck("bones", PERFECT.bones));
    const trap = oneRound("bones", 3, (r, get) => {
      const add = r.adult[0] - r.baby[0];
      r.baby.slice(1).forEach((b, j) => get().setVal(j, b + add));
      get().raise();
    });
    const g = gradeBonesRaise({ baby: [2, 4, 6, 8], adult: [3, 6, 9, 12] }, [5, 7, 9]);
    checks.push({ name: "Magma bones: adding the same amount is caught (named, retry offered)", pass: trap.points === 0 && trap.state.phase === "retry" && g.additive.every(Boolean), detail: `trap ${trap.points} pts, phase ${trap.state.phase}` });
  }

  // ---- 10 · STRATEGY SUMMIT --------------------------------------------
  {
    const bad = [];
    for (const s of fuzz(generateSummitSet)) {
      if (!stagesOk(s)) { bad.push("shape"); break; }
      for (const r of s) {
        if (r.choices.length !== 3 || r.choices.filter((c) => c.best).length !== 1) bad.push("choices");
        const re = new RegExp(`(^|[^0-9.])${r.answer}([^0-9.]|$)`);
        if (r.choices.some((c) => re.test(c.show) || c.steps.some((x) => re.test(x)))) bad.push(`leak-${r.sig}`);
        if (new Set(r.choices.map((c) => c.key)).size !== 3) bad.push("dup-key");
      }
      if (new Set(s.map((r) => r.kind)).size !== 8) bad.push("archetypes");
    }
    checks.push({ name: "Magma summit: 300 sets — 8 archetypes, 3 correct tablets, one easiest, no answer leaks", pass: bad.length === 0, detail: bad.length ? [...new Set(bad)].slice(0, 6).join(",") : "4500 rounds ok" });
    checks.push(perfectCheck("summit", PERFECT.summit));
    const other = oneRound("summit", 0, (r, get) => { get().pick(r.choices.find((c) => !c.best).key); get().submit(String(r.answer)); });
    checks.push({ name: "Magma summit: a sound-but-harder tablet earns 5 (20 for the round)", pass: other.points === 20 && other.status === "feedback", detail: `${other.points} pts` });
  }

  return checks;
}
