/**
 * THE JOURNEY (2026-10-13) — headless checks for the progression.
 *
 *   JY1  the path: five worlds in order (snow → magma → farm → jungle →
 *        Playground), each on its own Number Island gate; 7 trophies;
 *        Pip, Fern and Alby; the Lodge belongs to the snow
 *   JY2  a brand-new save: every gate locked, each saying what opens it;
 *        the goal is the island warm-ups (Pip first)
 *   JY3  the warm-ups: 2 of 3 keeps the igloo shut, 3 opens it (any order);
 *        a teacher task passed on a friend counts for that friend
 *   JY4  the 7-bronze rule down the whole path: 6 trophies keep the next
 *        gate shut, 7 open it; a 49% best is no trophy, 50% is
 *   JY5  keep what they've reached: any score in a world keeps it AND every
 *        world before it open (a Playground key opens all five)
 *   JY6  the goal walks the path (warm-ups → travel → trophies → keys →
 *        free) and Mills always says the right next step
 *   JY7  the coach script: 8 training steps in order, keyboard + touch
 *        words, known counters; every world has a first-visit welcome
 *   JY8  a locked gate is SOLID on the island (you're pushed back outside
 *        its trigger) and says what opens it; open gates aren't; nothing
 *        is locked anywhere else
 *   JY9  first run on an old save: the gates already open are marked seen
 *        (no celebration); a gate that opens later celebrates once
 *   JY10 the coach engine: training ticks off on real counts; the snow tour
 *        runs card → trophy stand → map → first challenge
 *   JY11 the Achievements Wall + the island map show the locks
 */
import {
  JOURNEY_WORLDS, JOURNEY_FRIENDS, TROPHIES_TO_OPEN, REGION_WORLD, journeyState, journeySnapshot, journeyCounts,
  portalLock, millsJourneyLines, friendDone,
} from "../data/journey.js";
import { TRAINING_STEPS, WORLD_INTROS, WALL_TRAINING_TIPS } from "../data/training.js";
import { TRANSLATIONS } from "../i18n/translations.js";
import { REGIONS } from "../data/regions.js";
import { FARM_BEST_KEYS, FARM_MAX_SCORES } from "../data/farm/farmRecords.js";
import { SNOW_BEST_KEYS, SNOW_MAX_SCORES } from "../data/snow/snowRecords.js";
import { MAGMA_BEST_KEYS, MAGMA_MAX_SCORES } from "../data/magma/magmaRecords.js";
import { JUNGLE_BEST_KEYS, JUNGLE_MAX_SCORES } from "../data/jungle/jungleRecords.js";
import { setRuntimeAssignments, clearRuntimeAssignments } from "../data/npcQuestChains.js";
import { achievementsSummary } from "../data/island/achievements.js";
import { regionMapPois } from "../data/maps/regionMaps.js";
import { resolveCircle, PLAYER_RADIUS } from "../systems/collisionEngine.js";
import { useProgress } from "../progress/store.js";
import { useSession } from "../game/sessionStore.js";
import { useUI } from "../ui/effects/uiStore.js";
import {
  useJourney, journeyTrack, currentCoach, lockedPortalColliders,
} from "../game/journeyStore.js";

const KEYS = { farm: [FARM_BEST_KEYS, FARM_MAX_SCORES], snow: [SNOW_BEST_KEYS, SNOW_MAX_SCORES], magma: [MAGMA_BEST_KEYS, MAGMA_MAX_SCORES], jungle: [JUNGLE_BEST_KEYS, JUNGLE_MAX_SCORES] };
const ALL_BEST_KEYS = Object.values(KEYS).flatMap(([k]) => Object.values(k));
const VISIT_KEYS = JOURNEY_WORLDS.map((w) => `mma-visited:${w.regionId}`);
const SAVE_KEY = "mills-maths-adventure:v1";

/** Run `fn` with clean bests / visits, putting everything back afterwards. */
function withCleanSlate(fn) {
  const saved = {};
  for (const k of [...ALL_BEST_KEYS, ...VISIT_KEYS, SAVE_KEY]) saved[k] = localStorage.getItem(k);
  try {
    for (const k of [...ALL_BEST_KEYS, ...VISIT_KEYS]) localStorage.removeItem(k);
    return fn();
  } finally {
    for (const k of Object.keys(saved)) { if (saved[k] === null) localStorage.removeItem(k); else localStorage.setItem(k, saved[k]); }
  }
}
/** Give a world's first n challenges a best of `pct` % (0 clears). */
function setBests(world, n, pct) {
  const [keys, max] = KEYS[world];
  Object.keys(keys).forEach((id, i) => {
    if (i < n && pct > 0) localStorage.setItem(keys[id], String(Math.ceil((max[id] * pct) / 100)));
    else localStorage.removeItem(keys[id]);
  });
}
const stateOf = (completedMissions = [], visited = {}) => journeyState(journeySnapshot({ completedMissions }, journeyCounts(), visited));
const openKeys = (js) => js.worlds.filter((w) => w.open).map((w) => w.key).join(",");
const FRIENDS3 = ["warmup-pip", "warmup-fern", "warmup-alby"];

export function runJourneyChecks() {
  const checks = [];
  const push = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

  // JY1 — the path.
  {
    const order = JOURNEY_WORLDS.map((w) => w.key).join(">");
    const portals = REGIONS["island-1"].portals.map((p) => p.id);
    const gatesOk = JOURNEY_WORLDS.every((w) => portals.includes(w.portalId) && REGIONS["island-1"].portals.find((p) => p.id === w.portalId).target === w.regionId);
    const ok = order === "snow>magma>farm>jungle>playground" && gatesOk && TROPHIES_TO_OPEN === 7 &&
      JOURNEY_FRIENDS.map((f) => f.id).join() === "pip,fern,alby" && REGION_WORLD.cabin === "snow" && portals.length === JOURNEY_WORLDS.length;
    push("Journey: five worlds in order (snow → magma → farm → jungle → Playground), one island gate each, 7 trophies, Pip/Fern/Alby",
      ok, ok ? `${order} · ${portals.length} gates` : `order ${order} gates:${gatesOk} portals ${portals.join(",")}`);
  }

  withCleanSlate(() => {
    // JY2 — a brand-new save.
    {
      const js = stateOf([]);
      const locks = JOURNEY_WORLDS.map((w) => portalLock(js, w.portalId));
      const ok = js.worlds.every((w) => !w.open) && locks.every((l) => l && l.text && l.note) &&
        /Pip.*Fern.*Alby/.test(locks[0].text) && /Win 7 Snowball Sums trophies/.test(locks[1].text) && /7 Emerald Jungle/.test(locks[4].text) &&
        js.goal.kind === "friends" && js.goal.friendId === "pip" && js.trainingActive === true;
      push("Journey: a new save starts with every gate locked (each saying what opens it) and the island warm-ups as the goal",
        ok, ok ? `goal: ${js.goal.text}` : `open ${openKeys(js)} goal ${js.goal.kind}/${js.goal.friendId} locks ${locks.map((l) => l && l.note).join(" | ")}`);
    }

    // JY3 — the warm-ups.
    {
      const two = stateOf(["warmup-alby", "warmup-fern"]);
      const three = stateOf(["warmup-alby", "warmup-fern", "warmup-pip"]);
      // A teacher task set on Pip, passed, counts for Pip.
      setRuntimeAssignments({ pip: [{ assignmentId: "task-xyz", title: "Teacher task" }] });
      let teacherOk = false;
      try { teacherOk = friendDone("pip", ["task-xyz"]) && stateOf(["task-xyz", "warmup-fern", "warmup-alby"]).worlds[0].open; }
      finally { clearRuntimeAssignments(); }
      const ok = !two.worlds[0].open && two.goal.friendId === "pip" && two.friendsDone === 2 &&
        three.worlds[0].open && !three.worlds[1].open && three.goal.kind === "travel" && three.goal.worldKey === "snow" && teacherOk;
      push("Journey: passing all three island warm-ups (any order) opens the igloo gate; two isn't enough; a teacher task on a friend counts",
        ok, ok ? `2/3 → shut · 3/3 → ${three.goal.title}` : `two:${openKeys(two)} three:${openKeys(three)} teacher:${teacherOk}`);
    }

    // JY4 — the 7-bronze rule, all the way down the path.
    {
      const bad = [];
      const visited = Object.fromEntries(JOURNEY_WORLDS.map((w) => [w.regionId, true]));
      const chain = ["snow", "magma", "farm", "jungle"];
      for (let i = 0; i < chain.length; i++) {
        // Earlier worlds full (7 bronze each), this one at 6, later ones empty.
        chain.forEach((k, j) => setBests(k, j < i ? TROPHIES_TO_OPEN : 0, 60));
        setBests(chain[i], 6, 60);
        const six = stateOf(FRIENDS3, visited);
        setBests(chain[i], 7, 49); // 7 played, none a trophy
        const near = stateOf(FRIENDS3, visited);
        setBests(chain[i], 7, 50);
        const seven = stateOf(FRIENDS3, visited);
        const next = JOURNEY_WORLDS[i + 1];
        if (six.worlds[i + 1].open) bad.push(`${next.key} opened at 6`);
        if (near.worlds[i + 1].open) bad.push(`${next.key} opened on 49%s`);
        if (!seven.worlds[i + 1].open) bad.push(`${next.key} shut at 7`);
        if (i + 2 < JOURNEY_WORLDS.length && seven.worlds[i + 2].open) bad.push(`${JOURNEY_WORLDS[i + 2].key} opened early`);
        if (six.goal.kind !== "trophies" || six.goal.worldKey !== chain[i] || six.goal.have !== 6) bad.push(`goal@${chain[i]} ${six.goal.kind}/${six.goal.worldKey}/${six.goal.have}`);
      }
      for (const k of chain) setBests(k, 0, 0);
      push("Journey: 7 trophies (🥉 50% or better) in a world open the next gate — 6 don't, and 49% bests aren't trophies",
        bad.length === 0, bad.length ? bad.join("; ") : "snow→magma→farm→jungle→Playground, each at exactly 7");
    }

    // JY5 — keep what they've reached.
    {
      setBests("farm", 1, 20); // one farm score, no trophy
      const farmOnly = stateOf([]);
      setBests("farm", 0, 0);
      setBests("jungle", 2, 80);
      const jungleOnly = stateOf([]);
      setBests("jungle", 0, 0);
      const keyOnly = stateOf(["warmup-pearce"]);
      const ok = openKeys(farmOnly) === "snow,magma,farm" && openKeys(jungleOnly) === "snow,magma,farm,jungle" &&
        openKeys(keyOnly) === "snow,magma,farm,jungle,playground" &&
        farmOnly.worlds[2].kept && !farmOnly.worlds[2].earned && farmOnly.goal.kind === "trophies" && farmOnly.goal.worldKey === "farm";
      push("Journey: an old save keeps what it reached — any score in a world keeps it and every world before it open",
        ok, ok ? "farm score → snow/magma/farm · jungle → +jungle · a Playground key → all five" : `farm:${openKeys(farmOnly)} jungle:${openKeys(jungleOnly)} key:${openKeys(keyOnly)} goal ${farmOnly.goal.kind}/${farmOnly.goal.worldKey}`);
    }

    // JY6 — the goal walks the path; Mills keeps up.
    {
      const seq = [];
      const lines = [];
      const say = (js) => lines.push(millsJourneyLines(js, "Sam").join(" "));
      let js = stateOf([]); seq.push(js.goal.kind); say(js);
      js = stateOf(FRIENDS3); seq.push(js.goal.kind); say(js);
      js = stateOf(FRIENDS3, { "snow-sums": true }); seq.push(`${js.goal.kind}:${js.goal.worldKey}`); say(js);
      setBests("snow", 7, 75);
      js = stateOf(FRIENDS3, { "snow-sums": true }); seq.push(`${js.goal.kind}:${js.goal.worldKey}`); say(js);
      setBests("magma", 7, 75); setBests("farm", 7, 75); setBests("jungle", 7, 75);
      const all = { "snow-sums": true, "magma-multiples": true, "farm-parts-whole": true, "emerald-jungle": true, schoolyard: true };
      js = stateOf(FRIENDS3, all); seq.push(`${js.goal.kind}:${js.goal.worldKey}`); say(js);
      const staff = ["warmup-pearce", "warmup-mahoney"];
      js = stateOf([...FRIENDS3, ...staff], all); seq.push(`${js.goal.kind}:${js.goal.have}`);
      const done = stateOf([...FRIENDS3, ...staff, "warmup-kellahan"], all);
      for (const k of ["snow", "magma", "farm", "jungle"]) setBests(k, 0, 0);
      const want = ["friends", "travel", "trophies:snow", "travel:magma", "keys:playground", "keys:2"];
      const linesOk = /Pip/.test(lines[0]) && /Sam/.test(lines[0]) && /igloo gate/.test(lines[1]) && /Snowball Sums/.test(lines[2]) &&
        /volcano arch/.test(lines[3]) && /hold a key/.test(lines[4]);
      const ok = want.every((w, i) => seq[i] === w) && linesOk && (done.goal.kind === "free" || done.bossDone);
      push("Journey: the goal walks the path (warm-ups → travel → trophies → … → keys) and Mills says the right next step",
        ok, ok ? seq.join(" → ") : `seq ${seq.join(" → ")} · lines ${linesOk}`);
    }
  });

  // JY7 — the coach script.
  {
    const known = new Set(Object.keys(journeyTrack));
    const ids = TRAINING_STEPS.map((s) => s.id).join(",");
    const stepsOk = ids === "walk,look,run,jump,fpv,mills,wall,map" &&
      TRAINING_STEPS.every((s) => s.title && s.key && s.touch && s.goal && known.has(s.goal.track) && s.goal.amount > 0 && s.key !== s.touch);
    const intros = JOURNEY_WORLDS.map((w) => WORLD_INTROS[w.regionId]);
    const introsOk = intros.every((list) => list && list[0] && list[0].card && list[0].lines.length && list[0].go) &&
      WORLD_INTROS["snow-sums"].length === 4 &&
      WORLD_INTROS["snow-sums"].slice(1).every((s) => s.key && s.touch && known.has(s.goal.track));
    // Every fixed coach string has Farsi + Arabic (EALD).
    const words = [
      ...TRAINING_STEPS.flatMap((s) => [s.title, s.key, s.touch]),
      ...Object.values(WORLD_INTROS).flat().flatMap((s) => [s.title, s.key, s.touch, s.go, s.skip, ...(s.lines || [])]),
      ...WALL_TRAINING_TIPS,
    ].filter(Boolean);
    const missing = words.filter((w) => !TRANSLATIONS.fa[w] || !TRANSLATIONS.ar[w]);
    const ok = stepsOk && introsOk && missing.length === 0;
    push("Journey: the training's 8 steps (walk, look, run, jump, first-person, Mills, the wall, the map) + a first-visit welcome in every world, all in Farsi + Arabic too",
      ok, ok ? `${ids} · snow tour ${WORLD_INTROS["snow-sums"].map((s) => s.id).join(">")} · ${words.length} strings translated` : `steps:${stepsOk} intros:${introsOk} (${ids}) untranslated: ${missing.slice(0, 3).join(" | ")}`);
  }

  // JY8 — locked gates are solid + hinted (island only).
  withCleanSlate(() => {
    const prevJs = useJourney.getState().js;
    try {
      useJourney.setState({ js: stateOf([]) });
      const cols = lockedPortalColliders("island-1");
      const elsewhere = ["snow-sums", "farm-parts-whole", "magma-multiples", "emerald-jungle", "schoolyard", "cabin"].map((r) => lockedPortalColliders(r).length);
      const portals = REGIONS["island-1"].portals;
      const pushedOut = portals.every((p) => {
        const r = resolveCircle(p.position[0] + 0.3, p.position[1] + 0.2, cols, PLAYER_RADIUS);
        return Math.hypot(r.x - p.position[0], r.z - p.position[1]) > p.radius;
      });
      useJourney.setState({ js: stateOf(FRIENDS3) });
      const afterFriends = lockedPortalColliders("island-1").map((c) => c.id);
      const ok = cols.length === 5 && cols.every((c) => c.hint && c.radius > 2) && pushedOut && elsewhere.every((n) => n === 0) &&
        afterFriends.length === 4 && !afterFriends.includes("jlock-island-to-snow");
      push("Journey: a locked island gate is solid (you stop outside its trigger) and says what opens it; open gates and other worlds aren't blocked",
        ok, ok ? `5 locked → 4 after the warm-ups · hint: "${cols[0].hint}"` : `cols ${cols.length} out:${pushedOut} elsewhere ${elsewhere.join("")} after ${afterFriends.join(",")}`);
    } finally {
      useJourney.setState({ js: prevJs });
    }
  });

  // JY9 + JY10 drive the live stores; put them back exactly afterwards.
  const savedProgress = { ...useProgress.getState() };
  const savedSession = { phase: useSession.getState().phase, currentRegionId: useSession.getState().currentRegionId };
  const savedUI = { waypoint: useUI.getState().waypoint };
  const savedJourney = { ...useJourney.getState() };
  const savedTrack = { ...journeyTrack };
  withCleanSlate(() => {
    try {
      useSession.setState({ phase: "playing", currentRegionId: "island-1" });
      // JY9 — first run on an old save vs a gate that opens later.
      {
        useJourney.setState({ celebrate: null, js: null, sig: "" });
        useProgress.setState({ completedMissions: [...FRIENDS3], journey: { ...savedProgress.journey, seeded: false, celebrated: [] } });
        useJourney.getState().refresh();
        const seededOk = useProgress.getState().journey.seeded && useProgress.getState().journey.celebrated.join() === "snow" && !useJourney.getState().celebrate;
        useProgress.setState({ completedMissions: ["warmup-pip", "warmup-fern"], journey: { ...useProgress.getState().journey, seeded: true, celebrated: [] } });
        useJourney.getState().refresh();
        const quiet = !useJourney.getState().celebrate;
        useProgress.setState({ completedMissions: [...FRIENDS3] });
        useJourney.getState().refresh();
        const fires = useJourney.getState().celebrate === "snow";
        useJourney.getState().dismissCelebration(false);
        useJourney.getState().refresh();
        const once = !useJourney.getState().celebrate && useProgress.getState().journey.celebrated.includes("snow");
        const ok = seededOk && quiet && fires && once;
        push("Journey: an old save's open gates are marked seen on first run; a gate that opens later celebrates exactly once",
          ok, ok ? "seeded quietly · igloo celebrates on the 3rd warm-up · never again" : `seeded:${seededOk} quiet:${quiet} fires:${fires} once:${once}`);
      }

      // JY10 — the coach engine.
      {
        const J = useJourney.getState();
        const log = [];
        useUI.setState({ waypoint: null });
        useProgress.setState({ journey: { ...useProgress.getState().journey, trainingStarted: false, trainingDone: false, trainingSkipped: false, step: 0, intros: [], introStep: {} } });
        useJourney.setState({ base: null });
        log.push(currentCoach().key);
        J.startTraining();
        const counters = { walked: 9, looked: 2.5, ran: 15, jumps: 3, fpvExits: 1, fpvTours: 1, millsTalks: 1, wallCloses: 1, waypoints: 1 };
        for (const s of TRAINING_STEPS) {
          J.tick(); // takes the baseline
          J.tick(); // nothing done yet → still here
          if (currentCoach().key !== `training:${s.id}`) log.push(`moved-early@${s.id}`);
          journeyTrack[s.goal.track] += counters[s.goal.track];
          J.tick();
          log.push(currentCoach().key.replace("training:", ""));
        }
        J.finishTraining();
        const trainedOk = useProgress.getState().journey.trainingDone && currentCoach() === null;
        // The snow tour.
        useSession.setState({ currentRegionId: "snow-sums" });
        const tour = [currentCoach().key];
        J.advance(currentCoach()); // "Show me around"
        J.tick(); // baseline + the trophy stand's waypoint
        const standWp = useUI.getState().waypoint && useUI.getState().waypoint.auto;
        journeyTrack.trophyCloses += 1; J.tick(); tour.push(currentCoach().key);
        J.tick(); journeyTrack.waypoints += 1; J.tick(); tour.push(currentCoach().key);
        J.tick(); journeyTrack.challengeStarts += 1; J.tick();
        const tourDone = currentCoach() === null && useProgress.getState().journey.intros.includes("snow-sums");
        const wantLog = ["training:welcome", "look", "run", "jump", "fpv", "mills", "wall", "map", "finale"];
        const logOk = wantLog.every((w, i) => log[i] === w) && log.length === wantLog.length;
        const tourOk = tour.join() === "intro:snow-sums:hello,intro:snow-sums:map,intro:snow-sums:go" && standWp && tourDone;
        const ok = logOk && trainedOk && tourOk;
        push("Journey: the coach ticks each training step off only when it's really done, then runs the Snowball Sums tour (stand → map → first challenge)",
          ok, ok ? `${log.join(" → ")} · tour ${tour.length + 1} steps` : `log ${log.join(",")} trained:${trainedOk} tour ${tour.join(",")} wp:${standWp} done:${tourDone}`);
      }
    } finally {
      useProgress.setState(savedProgress);
      useSession.setState(savedSession);
      useUI.setState(savedUI);
      useJourney.setState(savedJourney);
      Object.assign(journeyTrack, savedTrack);
    }
  });

  // JY11 — the wall + the island map show the locks.
  withCleanSlate(() => {
    const prevJs = useJourney.getState().js;
    try {
      const prog = { xp: 0, coins: 0, profile: { name: "Sam" }, completedMissions: ["warmup-pip"] };
      const s = achievementsSummary(prog, []);
      const byId = Object.fromEntries(s.panels.map((p) => [p.id, p]));
      const js = stateOf(["warmup-pip"]);
      const pois = regionMapPois("island-1", { progress: prog, results: [], journey: js });
      const gates = pois.filter((p) => p.kind === "gate");
      const pip = pois.find((p) => p.id === "p-pip");
      const ok = s.panels.map((p) => p.id).join() === "island,snow,magma,farm,jungle,playground" &&
        ["snow", "magma", "farm", "jungle", "playground"].every((k) => byId[k].locked && /^Locked/.test(byId[k].summary)) &&
        byId.island.passedFriends === 1 && gates.length === 5 && gates.every((g) => g.locked && g.icon === "🔒" && /Locked/.test(g.sub)) &&
        pip && /passed/.test(pip.sub) && pip.medal === "pass";
      push("Journey: the Achievements Wall reads in journey order with padlocked boards; the island map marks locked gates 🔒",
        ok, ok ? `wall ${s.panels.map((p) => p.icon).join("")} · ${gates.length} gates locked` : `order ${s.panels.map((p) => p.id).join()} gates ${gates.map((g) => g.icon).join("")} pip ${pip && pip.sub}`);
    } finally {
      useJourney.setState({ js: prevJs });
    }
  });

  return checks;
}
