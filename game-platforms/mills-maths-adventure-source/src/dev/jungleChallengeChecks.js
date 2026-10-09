/**
 * EMERALD JUNGLE — headless checks for the vine-ladder challenges (the
 * 2026-10-10 pilot: Monkey Swap + Sunny Market). Framework checks JCF1–JCF5
 * plus three per built challenge (JC-<key>-1/2/3), the Magma pattern:
 *   1  300-set generation fuzz — 15 rounds, the 5-stage arc, no repeats,
 *      the challenge's own maths invariants
 *   2  PERFECT PLAY through the REAL store — 25 every round, 375, gold
 *   3  the pedagogy: the traps behave (add-the-same unties the zero, part
 *      fruit / part cents refused, early claims and wrong calls cost)
 */
import {
  JUNGLE_CHALLENGES, JUNGLE_CHALLENGE_KEYS, BUILT_JUNGLE_CHALLENGES, getJungleChallenge, jungleHostId, jungleHostWorld,
  JUNGLE_WELCOME_HOST, JUNGLE_RECORDS_STAND, inJungleChallengeView, LADDER_GEOM,
} from "../data/jungle/jungleChallenges.js";
import {
  JUNGLE_BEST_KEYS, JUNGLE_MAX_SCORES, jungleTrophyRows, readJungleBest, jungleBestPercent, medalFor, jungleShelfEntries,
} from "../data/jungle/jungleRecords.js";
import {
  JUNGLE_REGION_ID, JUNGLE_SPOTS, JUNGLE_SPAWN, terrainHeight, nearestPath, jungleWaterAt, slopeAt,
} from "../data/jungle/jungleLayout.js";
import { getJungleColliders } from "../data/jungle/jungleColliders.js";
import { getJungleProps } from "../data/jungle/jungleProps.js";
import { INTERACTABLES } from "../data/interactables.js";
import { ENCOUNTERS } from "../data/encounters.js";
import { JUNGLE_STORES, jungleStore, exitJungleExcept, activeJungleChallengeKey } from "../game/jungle/jungleActive.js";
import {
  partnerOf, tryMove, additivePartner, untiedZero, parseMoney, parseKg, parseVal, fmtMoney, fmtVal, onSide, other,
  fewestMoves, rungFor,
} from "../data/jungle/vineLadder.js";
import { generateSwapSet } from "../data/jungle/swapChallenge.js";
import { generateMarketSet } from "../data/jungle/marketChallenge.js";
import { achievementsSummary } from "../data/island/achievements.js";

// Characters with a real glb (characterModels.js can't be imported headlessly).
const GLB_CHARACTERS = ["pip", "fern", "alby", "sage", "pearce", "mahoney", "ewings", "dawson", "heywood", "morgan", "bacon", "brookes", "trevor", "steve", "robot"];
const fuzz = (gen, n = 300) => Array.from({ length: n }, () => gen());
const stagesOk = (set) => set.length === 15 && set.every((r, i) => r.stage === Math.floor(i / 3) && r.roundIndex === i) && new Set(set.map((r) => r.sig)).size === 15;

/** Walk a path of moves from the starting rung(s); the last value reached. */
function walk(L, drive, start, path, maxDrive) {
  const vals = [...start];
  let last = null;
  for (const s of path) {
    const from = s.b !== undefined ? [s.a, s.b] : [s.a];
    if (!from.every((v) => vals.includes(v))) return { ok: false, why: `missing ${from}` };
    const r = tryMove(L, drive, s.op, from, s.n, start[0], maxDrive);
    if (!r.ok || r.value !== s.v) return { ok: false, why: `${s.op}:${r.why || r.value}` };
    vals.push(r.value);
    last = r.value;
  }
  return { ok: true, last, vals };
}

// ---------------------------------------------------------------------------
// The perfect player — uses only the store's public verbs.
// ---------------------------------------------------------------------------
function doStep(get, li, step, r) {
  if (get().active !== li) get().setActive(li);
  const rungs = get().ladders[li].rungs;
  const want = [rungs.findIndex((x) => onSide(x, r.drive) === step.a)];
  if (step.b !== undefined) want.push(rungs.findIndex((x) => onSide(x, r.drive) === step.b));
  for (const i of [...get().sel]) get().select(li, i);
  for (const i of want) get().select(li, i);
  get().choose(step.op);
  if (step.n) get().pickN(step.n);
  const p = get().pending;
  if (!p) return false;
  const ps = other(r.drive);
  const L = r.ladders[li].L;
  const kind = (ps === "top" ? L.top : L.bottom).kind;
  return get().submit(fmtVal(kind, p.partner)) === "correct";
}
function playPerfect(r, get) {
  if (r.kind === "compare") {
    r.plan.steps.forEach((s, li) => { if (s) doStep(get, li, s, r); });
    get().call(r.better);
    return;
  }
  for (const s of r.best.path) doStep(get, 0, s, r);
  if (r.kind === "smallest") get().claim();
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
    play(st.currentRound(), store.getState);
    const after = store.getState();
    pts.push(after.roundPoints);
    if (after.status === "celebrate" || after.status === "feedback") after.next();
    else { pts.push(-2); break; }
  }
  const end = store.getState();
  return { pts, status: end.status, score: end.score };
}
function perfectCheck(key) {
  const res = playSet(key, playPerfect);
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

/** Start a set at round `i` (the store's fresh() state for that round). */
function startAt(key, i) {
  const store = jungleStore(key);
  store.getState().exit();
  store.getState().start();
  store.getState().beginRounds();
  const r = store.getState().rounds[i];
  store.setState({
    roundIndex: i, roundPoints: 0, note: null,
    ladders: r.ladders.map((l) => ({ rungs: l.start.map((x) => [...x]), added: 0 })),
    active: 0, sel: [0], pending: null, misses: 0, wrong: null, claimFails: 0, common: null, called: null, hit: null, picker: null,
  });
  return store;
}

export function runJungleChallengeChecks() {
  const checks = [];
  const colliders = getJungleColliders();

  // JCF1) Registry wiring: ten challenges in trophy order (two built), hosts
  //       with real glbs, interactables + encounters + best keys in lockstep.
  {
    const want = ["swap", "market", "race", "tape", "potion", "barrels", "map", "fireflies", "temple", "pathfinder"];
    const order = JUNGLE_CHALLENGE_KEYS.join() === want.join();
    const built = BUILT_JUNGLE_CHALLENGES.map((c) => c.key);
    const storesOk = JUNGLE_STORES.map(([k]) => k).join() === built.join() && built.join() === "swap,market";
    const spotsOk = new Set(JUNGLE_CHALLENGES.map((c) => c.spot)).size === 10 && JUNGLE_CHALLENGES.every((c) => JUNGLE_SPOTS.some((s) => s.id === c.spot));
    const ids = new Set(INTERACTABLES.filter((i) => i.regionId === JUNGLE_REGION_ID).map((i) => i.id));
    const ixOk = built.every((k) => ids.has(jungleHostId(k))) && ids.has(JUNGLE_WELCOME_HOST.id) && ids.has(JUNGLE_RECORDS_STAND.id) && ids.size === built.length + 2;
    const encOk = built.every((k) => ENCOUNTERS[`jungle-${k}-challenge`]) && ENCOUNTERS["jungle-welcome"] && ENCOUNTERS["jungle-records"];
    const glbOk = JUNGLE_CHALLENGES.every((c) => GLB_CHARACTERS.includes(c.host.characterId));
    const keysOk = JUNGLE_CHALLENGE_KEYS.every((k) => JUNGLE_BEST_KEYS[k] === `mma-jungle-${k}-best` && JUNGLE_MAX_SCORES[k] === 375);
    const rows = jungleTrophyRows();
    const rowsOk = rows.length === 10 && rows.filter((r) => r.soon).length === 8 && jungleShelfEntries().length === 10;
    const pass = order && storesOk && spotsOk && ixOk && encOk && glbOk && keysOk && rowsOk;
    checks.push({
      name: "Jungle challenges: ten in trophy order (two built), real hosts, wiring in lockstep",
      pass,
      detail: pass ? "10 slots · built swap + market · 4 jungle interactables · mma-jungle-<key>-best (375) · 8 coming soon"
        : `order:${order} stores:${storesOk} spots:${spotsOk} ix:${ixOk} enc:${Boolean(encOk)} glb:${glbOk} keys:${keysOk} rows:${rowsOk}`,
    });
  }

  // JCF2) Each built clearing: the ladder + stall stand on the flat, dry pad;
  //       nothing solid of theirs sits on the trail; host + park spot clear;
  //       the camera floats above the ground with a clear line to the ladder
  //       (no tree trunk near the sight line) at 16:9, 4:3 and portrait.
  {
    const bad = [];
    const trunks = colliders.filter((c) => /^jg-(broadleaf|conifer|giant|palm|emergent)/.test(c.id));
    for (const c of BUILT_JUNGLE_CHALLENGES) {
      const f = c.frame;
      const G = LADDER_GEOM;
      for (let x = G.x0 - 0.2; x <= G.x1 + 0.2; x += 1.05) {
        for (const z of [G.z, G.stall.z]) {
          const [wx, wz] = f.toWorld(Math.min(x, z === G.stall.z ? G.stall.x + G.stall.w / 2 : x), z);
          if (jungleWaterAt(wx, wz) !== null) bad.push(`${c.key}:wet@${x.toFixed(1)},${z}`);
          if (Math.abs(terrainHeight(wx, wz) - f.y) > 0.3) bad.push(`${c.key}:slope@${x.toFixed(1)},${z}`);
        }
      }
      for (const k of colliders.filter((k) => k.id.startsWith(`jg-${c.key}-`))) {
        // (pathEdgeDist counts clearings as path — the TRAIL itself is what must stay open)
        const n = nearestPath(k.x, k.z);
        if (n && n.e < k.radius) bad.push(`${c.key}:on-trail ${k.id}`);
      }
      const [hx, hz] = jungleHostWorld(c.key);
      const nh = nearestPath(hx, hz);
      if (nh && nh.e < 0.7) bad.push(`${c.key}:host-on-trail`);
      if (Math.abs(terrainHeight(hx, hz) - f.y) > 0.4 || slopeAt(hx, hz) > 0.2) bad.push(`${c.key}:host-ground`);
      if (colliders.some((k) => k.id !== `jg-host-${c.key}` && Math.hypot(k.x - hx, k.z - hz) < k.radius + 0.6)) bad.push(`${c.key}:host-crowded`);
      const [px, pz] = f.toWorld(c.parkAt[0], c.parkAt[1]);
      if (colliders.some((k) => Math.hypot(k.x - px, k.z - pz) < k.radius + 0.45)) bad.push(`${c.key}:park-blocked`);
      // Cameras: 16:9, 4:3, iPad portrait (fov 50).
      for (const aspect of [16 / 9, 4 / 3, 0.75]) {
        const halfW = Math.tan((50 * Math.PI) / 360) * aspect;
        const dist = Math.min(c.view.maxDist, Math.max(c.view.minDist, c.view.fit / halfW));
        const [lx, ly, lz] = c.view.look;
        const [cx, cz] = f.toWorld(lx, lz + Math.cos(c.view.elev) * dist);
        const cy = f.y + ly + Math.sin(c.view.elev) * dist;
        if (cy < terrainHeight(cx, cz) + 1.2) bad.push(`${c.key}:camera-low@${aspect.toFixed(2)}`);
        // Sight lines from the camera to points along the ladder.
        for (const tx of [G.x0, 0, G.x1]) {
          const [ax, az] = f.toWorld(tx, G.z);
          for (let s = 0.05; s < 0.95; s += 0.05) {
            const x = cx + (ax - cx) * s, z = cz + (az - cz) * s;
            const y = cy + (f.y + 2 - cy) * s;
            if (y < terrainHeight(x, z) + 0.2) { bad.push(`${c.key}:ground-blocks@${aspect.toFixed(2)}`); break; }
            const hit = trunks.find((k) => Math.hypot(k.x - x, k.z - z) < k.radius + 0.25);
            if (hit) { bad.push(`${c.key}:trunk ${hit.id}@${aspect.toFixed(2)}`); break; }
          }
        }
      }
      // The scatter keeps the corridor clear of trees.
      const P = getJungleProps();
      const inShot = Object.values(P.trees).flat().filter((t) => !t.deco && inJungleChallengeView(c.key, t.x, t.z));
      if (inShot.length) bad.push(`${c.key}:${inShot.length} trees in the corridor`);
    }
    // Mills + the stand: on the glade, off the trail, the stand facing the spawn.
    const [sx, sz] = JUNGLE_RECORDS_STAND.position;
    const facing = Math.cos(JUNGLE_RECORDS_STAND.rotationY - Math.atan2(JUNGLE_SPAWN.x - sx, JUNGLE_SPAWN.z - sz));
    if (facing < 0.99) bad.push("stand-facing");
    for (const [id, p, r] of [["stand", JUNGLE_RECORDS_STAND.position, 2.0], ["mills", JUNGLE_WELCOME_HOST.position, 0.7]]) {
      const np = nearestPath(p[0], p[1]);
      if (np && np.e < r) bad.push(`${id}-on-trail`);
      if (Math.hypot(p[0] - JUNGLE_SPAWN.x, p[1] - JUNGLE_SPAWN.z) < r + 2) bad.push(`${id}-on-spawn`);
    }
    checks.push({
      name: "Jungle challenges: ladders on flat clearings off the trail, hosts + park spots clear, clear camera lines",
      pass: bad.length === 0,
      detail: bad.length ? [...new Set(bad)].slice(0, 8).join(", ") : `${BUILT_JUNGLE_CHALLENGES.length} stages · 3 aspects each · corridors free of trees · stand faces the arrivals`,
    });
  }

  // JCF3) Stores: the lifecycle works, no state field shadows a verb, one
  //       challenge at a time, hosts step out of their own shot.
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
      detail: bad.length ? bad.join(", ") : "intro → play · 15 rounds · exitJungleExcept keeps only the named one",
    });
  }

  // JCF4) Records + the Achievements Wall: bests read/write, the wall's
  //       jungle board is a trophy panel whose unbuilt slots say "soon".
  {
    const saved = localStorage.getItem(JUNGLE_BEST_KEYS.swap);
    let ok = false, detail = "";
    try {
      localStorage.setItem(JUNGLE_BEST_KEYS.swap, "375");
      const s = achievementsSummary({ xp: 0, coins: 0, profile: { name: "Sam" } }, []);
      const j = s.panels.find((p) => p.id === "jungle");
      ok = j && j.kind === "trophies" && j.counts.gold === 1 && j.rows.filter((r) => r.soon).length === 8 &&
        j.rows.find((r) => r.key === "swap").medal === "gold" && s.totals.trophySlots === 40 &&
        jungleShelfEntries().find((e) => e.key === "swap").percent === 100;
      detail = j ? `kind ${j.kind} · gold ${j.counts.gold} · soon ${j.rows.filter((r) => r.soon).length} · slots ${s.totals.trophySlots}` : "no jungle panel";
    } catch (e) {
      detail = `threw ${e.message}`;
    } finally {
      if (saved === null) localStorage.removeItem(JUNGLE_BEST_KEYS.swap); else localStorage.setItem(JUNGLE_BEST_KEYS.swap, saved);
    }
    checks.push({ name: "Jungle trophies: bests feed the stand, the grid and the Achievements Wall (8 slots 'coming soon')", pass: Boolean(ok), detail });
  }

  // JCF5) The vine-ladder maths.
  {
    const BAN = { kind: "count", icon: "🍌", one: "banana", many: "bananas" };
    const MAN = { kind: "count", icon: "🥭", one: "mango", many: "mangoes" };
    const USD = { kind: "money", icon: "💲", one: "dollar", many: "dollars" };
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
    if (fmtMoney(1750) !== "$17.50" || fmtMoney(1000) !== "$10") bad.push("fmt");
    const fm = fewestMoves(L, "top", [3], 30, ["again", "x2", "x10", "join"], 100);
    if (fm.min !== 1 || !rungFor(L, "top", 30)) bad.push(`fewest ${fm.min}`);
    checks.push({
      name: "Vine ladder maths: partners, refusals (part fruit / part cents), the add-the-same trap, parsing",
      pass: bad.length === 0,
      detail: bad.length ? bad.join(", ") : "21 🍌 → 14 🥭 · ½ banana refused · $10 ÷ 6 refused · 3↔2 → 6↔5 unties at 1 · $ + kg parsing",
    });
  }

  // ---- 1 · MONKEY SWAP ---------------------------------------------------
  {
    const bad = [];
    for (const s of fuzz(generateSwapSet)) {
      if (!stagesOk(s)) { bad.push("shape"); break; }
      for (const r of s) {
        const L = r.ladders[0].L;
        const startD = onSide(r.ladders[0].start[0], r.drive);
        const w = walk(L, r.drive, [startD], r.best.path, r.maxDrive);
        if (!w.ok || w.last !== r.target) bad.push(`path-${r.sig}:${w.why || w.last}`);
        if (r.stage === 0 && (r.moves.join() !== "again" || r.min !== r.k - 1)) bad.push("S1");
        if (r.stage > 0 && r.stage < 4 && (r.min < 2 || r.min > 4)) bad.push(`min-${r.sig}`);
        if ((r.stage === 1 || r.stage === 2) && r.target > 100) bad.push("big");
        if ((r.stage === 2) !== (r.drive === "bottom")) bad.push("S3-drive");
        if (r.stage === 3 && !r.best.path.some((p) => p.op === "h2")) bad.push("S4-half");
        if (r.stage === 4) {
          const [a, b] = r.smallest;
          let g = a, h = b; while (h) [g, h] = [h, g % h];
          if (r.kind !== "smallest" || g !== 1 || L.a !== a * r.m || L.b !== b * r.m) bad.push("S5-smallest");
        }
        if (!r.goal || !Number.isInteger(r.goal[0]) || !Number.isInteger(r.goal[1])) bad.push("goal");
      }
    }
    checks.push({ name: "Jungle swap: 300 sets — build-up, jumps, backwards, half a swap, the smallest swap", pass: bad.length === 0, detail: bad.length ? [...new Set(bad)].slice(0, 6).join(",") : "4500 rounds · every best path walks to its target" });
    checks.push(perfectCheck("swap"));
    // The add-the-same trap: 3 ↔ 2, "again" → 6 bananas, type 5 mangoes.
    const store = startAt("swap", 0);
    const r = store.getState().currentRound();
    store.getState().choose("again");
    const p = store.getState().pending;
    const deal = r.ladders[0].start[0];
    const add = additivePartner(r.ladders[0].L, "top", deal, p.value);
    store.getState().submit(String(add));
    const w = store.getState().wrong;
    const trapped = w && w.additive && w.untie !== null && store.getState().pending && store.getState().misses === 1 && /zero/.test(store.getState().note.text);
    store.getState().submit(String(p.partner));
    const recovered = store.getState().ladders[0].rungs.length === 2 && !store.getState().pending;
    // A half banana is refused; an early claim on the smallest swap costs 5.
    const st2 = startAt("swap", 13);
    const r2 = st2.getState().currentRound();
    st2.getState().claim();
    const early = st2.getState().claimFails === 1 && st2.getState().status === "play";
    for (const s of r2.best.path) doStep(st2.getState, 0, s, r2);
    st2.getState().claim();
    const pts = st2.getState().roundPoints;
    const half = startAt("swap", 0);
    const odd = half.getState().currentRound().ladders[0].start[0][0] % 2 === 1;
    half.getState().choose("h2");
    const refused = !odd || (half.getState().pending === null);
    jungleStore("swap").getState().exit();
    checks.push({
      name: "Jungle swap: adding the same to both unties the zero; early claims cost; part fruit refused",
      pass: Boolean(trapped && recovered && early && pts === 20 && refused),
      detail: `trap:${Boolean(trapped)} recovered:${recovered} early-claim:${early} smallest-round ${pts} pts refused:${refused}`,
    });
  }

  // ---- 2 · SUNNY MARKET ---------------------------------------------------
  {
    const bad = [];
    for (const s of fuzz(generateMarketSet)) {
      if (!stagesOk(s)) { bad.push("shape"); break; }
      for (const r of s) {
        if (r.stage < 3) {
          const L = r.ladders[0].L;
          const startD = onSide(r.ladders[0].start[0], r.drive);
          const w = walk(L, r.drive, [startD], r.best.path, r.maxDrive);
          if (!w.ok || w.last !== r.target) bad.push(`path-${r.sig}:${w.why || w.last}`);
          if (r.min < 2 || r.min > 3) bad.push(`min-${r.sig}`);
          if (r.stage === 1 && partnerOf(L, "top", 1) !== null) bad.push("S2-one-is-whole");
          if ((r.stage === 2) !== (r.drive === "bottom")) bad.push("S3-drive");
        } else {
          const [A, B] = r.ladders.map((l) => l.L);
          if (r.kind !== "compare") bad.push("compare");
          if ((A.a > B.a) !== (A.b > B.b)) bad.push("trap");
          const uA = A.b / A.a, uB = B.b / B.a;
          if (uA === uB || r.better !== (uA < uB ? 0 : 1)) bad.push("better");
          if ((r.stage === 4) !== (r.fruit.kind === "kg")) bad.push("S5-kg");
          const v = r.plan.v;
          if (!rungFor(A, "top", v) || !rungFor(B, "top", v) || r.plan.cost > 2) bad.push("plan");
        }
      }
    }
    checks.push({ name: "Jungle market: 300 sets — through one, friendlier pieces, backwards, best buys (count + kg)", pass: bad.length === 0, detail: bad.length ? [...new Set(bad)].slice(0, 6).join(",") : "4500 rounds · every path walks · ONE never whole in S2 · best buys need a common rung" });
    checks.push(perfectCheck("market"));
    // S2: splitting to ONE is refused (part cents); calling before a common
    // rung is refused; the wrong stall keeps only the common-rung 10.
    const s2 = startAt("market", 3);
    const r2 = s2.getState().currentRound();
    s2.getState().choose("split");
    s2.getState().pickN(r2.ladders[0].start[0][0]);
    const centsRefused = s2.getState().pending === null && /cents/.test(s2.getState().note?.text || "");
    const c = startAt("market", 9);
    const rc = c.getState().currentRound();
    c.getState().call(1 - rc.better);
    const early = c.getState().status === "play" && c.getState().called === null;
    rc.plan.steps.forEach((s, li) => { if (s) doStep(c.getState, li, s, rc); });
    c.getState().call(1 - rc.better);
    const wrongCall = c.getState().status === "feedback" && c.getState().roundPoints === 10;
    jungleStore("market").getState().exit();
    checks.push({
      name: "Jungle market: part cents refused ('a friendlier piece'), no call before a common rung, a wrong call keeps 10",
      pass: Boolean(centsRefused && early && wrongCall),
      detail: `cents:${centsRefused} early:${early} wrong-call:${wrongCall}`,
    });
  }

  return checks;
}
