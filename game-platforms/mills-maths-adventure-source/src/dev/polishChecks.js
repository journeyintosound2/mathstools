/**
 * JEFF'S FEEDBACK BATCH 2 (2026-10-13, evening) — checks.
 *
 *   PL1  deep WATER is a wipe-out (island sea + snow lake know it's water,
 *        and where its surface is); lava stays a hop
 *   PL2  the wipe-out's timeline: dark before the move to the spawn, open
 *        after — and its words are in Farsi + Arabic
 *   PL3  the lava hop picks a remembered spot back along the path (never the
 *        edge it slipped off), drops the spots nearer the lava, and a third
 *        touch in a row goes to the spawn
 *   PL4  the lava hop's arc starts at the touch, lands EXACTLY on the spot,
 *        and rises clear of both ends — on a real Magma lava edge
 *   PL5  ENTER is the interaction key (E still works); a held key's repeat,
 *        a modifier or a text box never interacts; no training line still
 *        says "press E"
 *   PL6  the first-person step needs all four arrow keys: popping out after
 *        looking only some ways doesn't count (the look carries over), all
 *        four does — and the new words are translated
 *   PL7  "NEXT STOP": the three warm-ups → the igloo gate is the fresh gate
 *        (NEW! sign + a waypoint to it) until you've been in; every world's
 *        banner words are translated
 *   PL8  treasure chests open for the visit (reactive), once; the badge
 *        says "Opened"
 *   PL9  the finish screen: one short save line per cloud state, and its
 *        words (praise bands included) in Farsi + Arabic
 */
import { getRegion } from "../data/regions.js";
import { ROPE_BRIDGE } from "../data/island/islandLayout.js";
import { MAGMA_REGION_ID } from "../data/magma/magmaLayout.js";
import { TRANSLATIONS } from "../i18n/translations.js";
import { WIPE, HOP_MIN_BACK, pickHopTarget, planHop, hopPoint } from "../game/hazardRescue.js";
import { isInteractKey, isTypingTarget, INTERACT_KEY_LABEL } from "../game/interaction.js";
import { TRAINING_STEPS, TRAINING_PROMPTS } from "../data/training.js";
import { journeyTrack, noteFpvExit, FPV_LOOK_NEED, FPV_DIRS, useJourney, freshPortal, gateWaypoint } from "../game/journeyStore.js";
import { journeyState, journeySnapshot, journeyCounts, JOURNEY_WORLDS } from "../data/journey.js";
import { useChests } from "../game/chestStore.js";
import { getInteractableStatus } from "../game/interactableStatus.js";
import { cloudSaveShort } from "../cloud/cloudMessages.js";
import { bandMessage } from "../missions/scoring.js";

const translated = (s) => Boolean(TRANSLATIONS.fa[s] && TRANSLATIONS.ar[s]);

export function runPolishChecks() {
  const checks = [];
  const push = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

  // PL1
  {
    const isl = getRegion("island-1");
    const [bx, bz] = [(ROPE_BRIDGE.from[0] + ROPE_BRIDGE.to[0]) / 2, (ROPE_BRIDGE.from[1] + ROPE_BRIDGE.to[1]) / 2];
    const seaHz = isl.isLava(bx, bz, -1);
    const seaInfo = isl.hazardInfo(bx, bz);
    const seaLvl = isl.waterLevelAt(bx, bz);
    const onBridge = isl.isLava(bx, bz, isl.groundHeight(bx, bz, 50));
    const snow = getRegion("snow-sums");
    const magma = getRegion(MAGMA_REGION_ID);
    const ok = seaHz && seaInfo.kind === "water" && seaInfo.wipe && typeof seaLvl === "number" && !onBridge &&
      snow.hazardKind === "water" && typeof snow.waterLevelAt === "function" && snow.wipeLine &&
      !magma.hazardKind && !magma.waterLevelAt;
    push("PL1 deep water wipes you out (island sea + snow lake); lava stays a hop", ok,
      ok ? `under the rope bridge: water, surface ${seaLvl.toFixed(2)} · on the bridge: safe · snow lake: water · Magma: lava` : JSON.stringify({ seaHz, seaInfo, seaLvl, onBridge, snow: snow.hazardKind }));
  }

  // PL2
  {
    const order = WIPE.closeAt < WIPE.shutAt && WIPE.shutAt <= WIPE.teleportAt && WIPE.teleportAt < WIPE.openAt && WIPE.openAt < WIPE.endAt && WIPE.sinkMs <= WIPE.teleportAt;
    const words = ["Wiped out!", "You fell into the deep water!", "You fell into the freezing lake!", "Back to the start…"];
    const missing = words.filter((w) => !translated(w));
    const ok = order && !missing.length && WIPE.endAt <= 4000;
    push("PL2 the wipe-out: dark before the move to the spawn, under 4 s, translated", ok,
      ok ? `shut ${WIPE.shutAt} ms → spawn ${WIPE.teleportAt} ms → open ${WIPE.openAt} ms → done ${WIPE.endAt} ms` : JSON.stringify({ order, missing }));
  }

  // PL3
  {
    // A path walking +z toward lava at z = 10; the last two spots are edge spots.
    const trail = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((z) => ({ x: 0, y: 0, z: z * 0.9, edge: z >= 8 }));
    const from = { x: 0, y: 0, z: 10 };
    const a = pickHopTarget(trail, from, 1);
    const back = a.spot ? Math.hypot(a.spot.x - from.x, a.spot.z - from.z) : 0;
    const t2 = trail.slice(0, a.keep);
    const b = pickHopTarget(t2, { x: 0, y: 0, z: a.spot.z + 1 }, 2);
    const third = pickHopTarget(t2, from, 3);
    const empty = pickHopTarget([], from, 1);
    const ok = a.spot && !a.spot.edge && back >= HOP_MIN_BACK && a.keep === trail.indexOf(a.spot) + 1 &&
      b.spot && b.spot.z < a.spot.z && third.spot === null && empty.spot === null;
    push("PL3 the lava hop goes back along your path (further each time; a third touch → the spawn)", ok,
      ok ? `1st → ${back.toFixed(1)} m back (not an edge spot) · 2nd → further back · 3rd → spawn` : JSON.stringify({ a, b, third }));
  }

  // PL4
  {
    const m = getRegion(MAGMA_REGION_ID);
    const g = (x, z) => m.groundHeight(x, z, 1e4);
    let lavaZ = null;
    for (let z = 100; z < 120; z += 0.1) if (m.isLava(0, z)) { lavaZ = z; break; }
    const from = { x: 0, y: g(0, lavaZ + 0.4), z: lavaZ + 0.4 };
    const to = { x: 0, y: g(0, lavaZ - 2.6), z: lavaZ - 2.6 };
    const hop = planHop(from, to, g);
    const p0 = hopPoint(hop, 0);
    const p1 = hopPoint(hop, 1);
    const mid = hopPoint(hop, 0.5);
    let above = true;
    for (let i = 1; i < 20; i++) {
      const p = hopPoint(hop, i / 20);
      if (p.y < Math.min(from.y, to.y) - 1e-6) above = false;
    }
    const exact = Math.hypot(p1.x - to.x, p1.y - to.y, p1.z - to.z) < 1e-9 && Math.hypot(p0.x - from.x, p0.y - from.y, p0.z - from.z) < 1e-9;
    const ok = lavaZ !== null && exact && above && mid.y >= Math.max(from.y, to.y) + 1.9 && hop.dur >= 750 && hop.dur <= 1500 && !m.isLava(to.x, to.z);
    push("PL4 the lava hop lands exactly on the spot (a real Magma lava edge)", ok,
      ok ? `lava edge z ${lavaZ.toFixed(1)} · lands on (${to.x}, ${to.z.toFixed(1)}) exactly · apex +${(mid.y - Math.max(from.y, to.y)).toFixed(1)} m · ${hop.dur} ms` : JSON.stringify({ lavaZ, exact, above, mid, dur: hop.dur }));
  }

  // PL5
  {
    const yes = isInteractKey({ key: "Enter" }) && isInteractKey({ key: "e" }) && isInteractKey({ key: "E" });
    const no = !isInteractKey({ key: "Enter", repeat: true }) && !isInteractKey({ key: "Enter", ctrlKey: true }) && !isInteractKey({ key: " " }) && !isInteractKey({ key: "q" });
    const typing = isTypingTarget({ tagName: "INPUT" }) && isTypingTarget({ tagName: "MATH-FIELD" }) && isTypingTarget({ tagName: "DIV", isContentEditable: true }) && !isTypingTarget({ tagName: "BUTTON" });
    const texts = TRAINING_STEPS.flatMap((s) => [s.key, s.touch]).concat(Object.values(TRAINING_PROMPTS.key)).filter(Boolean);
    const sayE = texts.filter((t) => /press E\b|\bE to\b/.test(t));
    const mills = TRAINING_STEPS.find((s) => s.id === "mills");
    const ok = yes && no && typing && !sayE.length && /press Enter/.test(mills.key) && /Enter/.test(TRAINING_PROMPTS.key.talkNear) && INTERACT_KEY_LABEL === "Enter";
    push("PL5 Enter is the interaction key everywhere (E still works quietly)", ok,
      ok ? "Enter + e interact · auto-repeat / Ctrl / typing never do · the training says “press Enter”" : JSON.stringify({ yes, no, typing, sayE }));
  }

  // PL6
  {
    const saved = { look: journeyTrack.fpvLook, tours: journeyTrack.fpvTours, exits: journeyTrack.fpvExits };
    try {
      journeyTrack.fpvLook = { left: FPV_LOOK_NEED, right: FPV_LOOK_NEED, up: 0.2, down: 0 };
      const t0 = journeyTrack.fpvTours;
      const early = noteFpvExit();
      const kept = journeyTrack.fpvLook.left === FPV_LOOK_NEED && journeyTrack.fpvTours === t0;
      journeyTrack.fpvLook.up = FPV_LOOK_NEED; journeyTrack.fpvLook.down = FPV_LOOK_NEED;
      const done = noteFpvExit();
      const counted = journeyTrack.fpvTours === t0 + 1 && FPV_DIRS.every((d) => journeyTrack.fpvLook[d] === 0);
      const step = TRAINING_STEPS.find((s) => s.id === "fpv");
      const words = [step.key, step.touch, TRAINING_PROMPTS.key.fpvLook, TRAINING_PROMPTS.key.fpvAgain, TRAINING_PROMPTS.touch.fpvLook, TRAINING_PROMPTS.touch.fpvAgain];
      const missing = words.filter((w) => !translated(w));
      const ok = !early && kept && done && counted && step.goal.track === "fpvTours" && !missing.length;
      push("PL6 the first-person step needs all four arrow keys (a part-look carries over)", ok,
        ok ? `two ways + out → not yet (kept) · all four + out → done · ${FPV_LOOK_NEED} rad each way · translated` : JSON.stringify({ early, kept, done, counted, missing }));
    } finally {
      journeyTrack.fpvLook = saved.look; journeyTrack.fpvTours = saved.tours; journeyTrack.fpvExits = saved.exits;
    }
  }

  // PL7
  {
    const saved = useJourney.getState().js;
    try {
      // (No world scores — earlier checks may have left bests in storage.)
      const snap = journeySnapshot({ completedMissions: ["warmup-pip", "warmup-fern", "warmup-alby"], journey: { trainingDone: true, trainingStarted: true } }, {}, {});
      const js = journeyState({ ...snap, admin: false });
      useJourney.setState({ js });
      const snow = JOURNEY_WORLDS[0];
      const travel = js.goal.kind === "travel" && js.goal.worldKey === "snow";
      const fresh = freshPortal(snow.portalId) && !freshPortal(JOURNEY_WORLDS[1].portalId);
      const wp = gateWaypoint("snow");
      const visitedJs = journeyState({ ...journeySnapshot({ completedMissions: ["warmup-pip", "warmup-fern", "warmup-alby"], journey: { trainingDone: true } }, {}, { "snow-sums": true }), admin: false });
      useJourney.setState({ js: visitedJs });
      const goneAfter = !freshPortal(snow.portalId);
      const words = ["Next stop", "Head back to Number Island first — through the gate home.", "NEW!", "Step inside",
        ...JOURNEY_WORLDS.map((w) => `${w.short ? "The Playground" : w.name} is open!`),
        ...JOURNEY_WORLDS.map((w) => `Go through ${w.gate} — ${w.where}.`)];
      const missing = words.filter((w) => !translated(w));
      const ok = travel && fresh && wp && wp.regionId === "island-1" && goneAfter && !missing.length;
      push("PL7 NEXT STOP: a just-opened world gets the banner, a waypoint + a NEW! gate until you've been in", ok,
        ok ? `3 warm-ups → travel to ❄️ · igloo gate fresh (waypoint ${wp.x}, ${wp.z}) · gone once visited · ${words.length} words translated` : JSON.stringify({ travel, fresh, wp, goneAfter, missing }));
    } finally {
      useJourney.setState({ js: saved });
    }
  }

  // PL8
  {
    const saved = useChests.getState().opened;
    try {
      useChests.setState({ opened: {} });
      const before = useChests.getState().isOpen("chest");
      useChests.getState().open("chest");
      const ref1 = useChests.getState().opened;
      useChests.getState().open("chest");
      const same = useChests.getState().opened === ref1; // no needless re-render
      const after = useChests.getState().isOpen("chest") && !useChests.getState().isOpen("snow-chest");
      const shut = getInteractableStatus({ id: "snow-chest", model: "chest", encounterId: "snow-treasure" }, false);
      const open = getInteractableStatus({ id: "snow-chest", model: "chest", encounterId: "snow-treasure" }, true);
      const ok = !before && after && same && shut.label === "Treasure!" && open.label === "Opened";
      push("PL8 treasure chests open (and stay open) for the visit; the badge says Opened", ok,
        ok ? "shut → open on taking the coins · once · every chest's badge: Treasure! → Opened" : JSON.stringify({ before, after, same, shut, open }));
    } finally {
      useChests.setState({ opened: saved });
    }
  }

  // PL9
  {
    const states = ["pending", "saved", "failed", "demo", "unregistered"];
    const lines = states.map((st) => cloudSaveShort(st));
    const allShort = lines.every((l) => l && l.text.length <= 44) && cloudSaveShort(null) === null;
    const words = ["Challenge complete!", "Nearly there!", "correct", "Level up!", "Mission complete!", "Not now", "Try again", "Continue",
      "You need 60% to pass — have another go!", "Check", "Next", "Finish", "Leave", "Keep going", "Leave this challenge?",
      "Your answers so far won't be saved.", "Correct!", "Let's look at this one", "The answer is", "Question",
      ...lines.map((l) => l.text), ...[100, 85, 65, 45, 10, 0].map((p) => bandMessage(p))];
    const missing = [...new Set(words)].filter((w) => !translated(w));
    const ok = allShort && !missing.length;
    push("PL9 the finish screen: one short save line, every word in Farsi + Arabic", ok,
      ok ? `${states.length} save states, each one short line · ${new Set(words).size} words translated` : JSON.stringify({ allShort, missing }));
  }

  return checks;
}
