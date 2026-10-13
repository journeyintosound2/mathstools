import { create } from "zustand";

import { useProgress } from "../progress/store.js";
import { useSession } from "./sessionStore.js";
import { useUI } from "../ui/effects/uiStore.js";
import { isAnyChallengeActive } from "./farmChallengeActive.js";
import { REGIONS } from "../data/regions.js";
import { hasVisited } from "../data/island/achievements.js";
import { getInteractable } from "../data/interactables.js";
import {
  JOURNEY_WORLDS, journeyState, journeySnapshot, journeyCounts, journeySignature, uncelebrated,
  portalLock, journeyWorld,
} from "../data/journey.js";
import { TRAINING_STEPS, introFor } from "../data/training.js";
import { regionMapPois } from "../data/maps/regionMaps.js";

/**
 * THE JOURNEY at runtime (2026-10-13) — the live, derived progression state
 * (data/journey.js) plus the engine that runs the Harbour Green training and
 * each world's first-visit intro.
 *
 *   useJourney.js        journeyState(…) — recomputed when progress changes,
 *                        on arriving in a world, and every 1.5 s (the trophy
 *                        bests live in localStorage, outside any store)
 *   useJourney.lockSig   changes whenever a gate's lock (or its x / 7) does —
 *                        Player.jsx rebuilds its colliders from it
 *   useJourney.celebrate the world key whose gate just opened (the
 *                        celebration card shows it; dismissing records it)
 *   journeyTrack         NON-reactive counters the coach steps watch (metres
 *                        walked / run, radians looked, jumps, Mills chats,
 *                        first-person exits, wall looks, waypoints, …).
 *                        Player.jsx + interaction.js add to them.
 */
export const journeyTrack = {
  walked: 0, ran: 0, looked: 0, jumps: 0, fpvExits: 0, millsTalks: 0,
  wallCloses: 0, waypoints: 0, mapOpens: 0, trophyCloses: 0, challengeStarts: 0,
  // First-person look-around (2026-10-13, Jeff: "make them use all the arrow
  // keys to look around for a bit"): how far you've looked each way in
  // first-person (radians — arrow keys or a drag; Player.jsx), and how many
  // times you came back out having looked ALL FOUR ways (the step's goal).
  fpvLook: { left: 0, right: 0, up: 0, down: 0 },
  fpvTours: 0,
};
/** How far (radians, ≈ half a second of holding the key) each way counts. */
export const FPV_LOOK_NEED = 0.8;
export const FPV_DIRS = ["left", "right", "up", "down"];
/** Has the player looked all four ways? */
export function fpvLookedAll(look = journeyTrack.fpvLook) {
  return FPV_DIRS.every((d) => (look[d] || 0) >= FPV_LOOK_NEED);
}
/** Leaving first-person: counts as the training's look-around only if you
 *  looked all four ways (the look carries over if you pop out early). */
export function noteFpvExit() {
  journeyTrack.fpvExits += 1;
  if (!fpvLookedAll()) return false;
  journeyTrack.fpvTours += 1;
  journeyTrack.fpvLook = { left: 0, right: 0, up: 0, down: 0 };
  return true;
}

const TICK_MS = 250;
const REFRESH_MS = 1500;
/** After this long on one world-tour step, the card offers "Skip this step". */
export const STEP_SKIP_AFTER_MS = 25000;
/**
 * The training can't be skipped (Jeff, 2026-10-13: "knowing my students they
 * will skip it") — but a step that somehow can't be done mustn't trap anyone,
 * so after a full minute on one step a small "Stuck? Skip this step" appears.
 */
export const TRAINING_STUCK_AFTER_MS = 60000;

function visitedMap() {
  return Object.fromEntries(JOURNEY_WORLDS.map((w) => [w.regionId, hasVisited(w.regionId)]));
}

/** Where a Number Island gate is, and a waypoint to just in front of it. */
export function gateWaypoint(worldKey) {
  const w = journeyWorld(worldKey);
  const portal = w && (REGIONS["island-1"].portals || []).find((p) => p.id === w.portalId);
  if (!portal) return null;
  return {
    regionId: "island-1", x: portal.position[0], z: portal.position[1],
    label: `${w.gate[0].toUpperCase()}${w.gate.slice(1)} — ${w.short || w.name}`, icon: w.icon, arrive: 4.2, auto: true,
  };
}

/** A waypoint to a world's own gate home (back to Number Island). */
export function homeGateWaypoint(regionId) {
  const portal = (REGIONS[regionId]?.portals || []).find((p) => p.target === "island-1");
  if (!portal) return null;
  return { regionId, x: portal.position[0], z: portal.position[1], label: "Gate home to Number Island", icon: "🏝️", arrive: 3.2, auto: true };
}

/** Ending the training / a tour early drops the waypoint the coach itself set. */
function clearCoachWaypoint() {
  const wp = useUI.getState().waypoint;
  if (wp && wp.auto) useUI.getState().clearWaypoint();
}

/** The coach step to show right now (or null). Pure-ish: reads the stores. */
export function currentCoach(progress = useProgress.getState(), regionId = useSession.getState().currentRegionId) {
  const j = progress.journey || {};
  if (regionId === "island-1" && !j.trainingDone) {
    if (!j.trainingStarted) return { scope: "training", card: "welcome", key: "training:welcome" };
    const i = j.step || 0;
    if (i < TRAINING_STEPS.length) {
      return { scope: "training", index: i, total: TRAINING_STEPS.length, step: TRAINING_STEPS[i], key: `training:${TRAINING_STEPS[i].id}` };
    }
    return { scope: "training", card: "finale", key: "training:finale" };
  }
  const intro = introFor(regionId);
  if (intro && !(j.intros || []).includes(regionId)) {
    const i = (j.introStep || {})[regionId] || 0;
    if (i >= intro.length) return null;
    const step = intro[i];
    return {
      scope: "intro", regionId, index: i, total: intro.length, step,
      card: step.card ? "intro" : null, key: `intro:${regionId}:${step.id}`,
    };
  }
  return null;
}

export const useJourney = create((set, get) => ({
  js: null,
  sig: "",
  lockSig: "",
  celebrate: null,
  // The live coach step's baseline: { key, value, t } + how far along (0…1).
  base: null,
  frac: 0,
  // A brief "✓ done!" flash on the step just finished.
  flash: null,

  refresh() {
    const p = useProgress.getState();
    const js = journeyState(journeySnapshot(p, journeyCounts(), visitedMap()));
    const sig = journeySignature(js);
    if (sig !== get().sig) {
      const lockSig = js.worlds.map((w) => `${w.open ? 1 : 0}:${w.requirement.have}${w.visited ? "v" : ""}`).join("|");
      set({ js, sig, ...(lockSig !== get().lockSig ? { lockSig } : {}) });
    }
    // First run on this save: the gates that are ALREADY open (an old save's
    // worlds, the warm-ups already passed) are not news — mark them seen.
    const j = p.journey || {};
    if (!j.seeded) {
      p.updateJourney({ seeded: true, celebrated: js.worlds.filter((w) => w.open && !w.adminOpen).map((w) => w.key) });
      return;
    }
    if (!get().celebrate && useSession.getState().phase === "playing") {
      const pending = uncelebrated(js, j.celebrated || []);
      if (pending.length) set({ celebrate: pending[0] });
    }
  },

  /** Close the "gate open!" card. `guide` → set a waypoint to the new gate. */
  dismissCelebration(guide = false) {
    const key = get().celebrate;
    if (!key) return;
    useProgress.getState().journeyAdd("celebrated", key);
    set({ celebrate: null });
    if (!guide) return;
    const regionId = useSession.getState().currentRegionId;
    if (regionId === "island-1") {
      const wp = gateWaypoint(key);
      if (wp) useUI.getState().setWaypoint(wp);
    } else {
      // Off the island: walk to the gate home first; the island waypoint
      // is set the moment you arrive (see the region subscription below).
      useProgress.getState().updateJourney({ guideTo: key });
      const wp = homeGateWaypoint(regionId);
      if (wp) useUI.getState().setWaypoint(wp);
    }
    get().refresh();
  },

  // ---- the coach (training + intros) ----------------------------------
  startTraining() {
    useProgress.getState().updateJourney({ trainingStarted: true, step: 0 });
    set({ base: null, frac: 0 });
  },
  /** Admin mode only: mark the training done (no reward) to get on with testing. */
  adminFinishTraining() {
    useProgress.getState().updateJourney({ trainingStarted: true, trainingDone: true, step: TRAINING_STEPS.length });
    clearCoachWaypoint();
    set({ base: null, frac: 0 });
  },
  finishTraining() {
    const p = useProgress.getState();
    p.updateJourney({ trainingDone: true, step: TRAINING_STEPS.length });
    p.awardRewards({ xp: 20, coins: 10 });
    useUI.getState().playSound("levelUp");
    useUI.getState().pushToast({ type: "reward", icon: "🎓", title: "Training complete!", message: "+20 XP · +10 coins" });
    // Point the way to the first friend still to do (if nothing's set).
    const js = get().js;
    const next = js && js.friends.find((f) => !f.done);
    if (next && !useUI.getState().waypoint && useSession.getState().currentRegionId === "island-1") {
      const it = getInteractable(next.id);
      if (it) useUI.getState().setWaypoint({ regionId: "island-1", x: it.position[0], z: it.position[1], label: it.name, icon: next.icon, arrive: 4, auto: true });
    }
    set({ base: null, frac: 0 });
  },
  /** Move past the current step (it was done — or "Skip this step"). */
  advance(cur = currentCoach()) {
    if (!cur) return;
    const p = useProgress.getState();
    if (cur.scope === "training" && cur.step) {
      p.updateJourney({ step: cur.index + 1 });
    } else if (cur.scope === "intro") {
      const next = cur.index + 1;
      const intro = introFor(cur.regionId) || [];
      if (next >= intro.length) {
        p.journeyAdd("intros", cur.regionId);
        if (!cur.card) useUI.getState().pushToast({ type: "reward", icon: "⭐", title: "Tour complete!", message: "Good luck with the challenges." });
      } else {
        p.updateJourney({ introStep: { ...(p.journey.introStep || {}), [cur.regionId]: next } });
      }
    }
    if (cur.step && !cur.step.card) {
      set({ flash: { id: cur.step.id, title: cur.step.title, done: cur.step.done || cur.step.title, scope: cur.scope, at: Date.now() } });
      useUI.getState().playSound("correct");
    }
    set({ base: null, frac: 0 });
  },
  closeIntro(regionId = useSession.getState().currentRegionId) {
    useProgress.getState().journeyAdd("intros", regionId);
    clearCoachWaypoint();
    set({ base: null, frac: 0 });
  },

  /** One engine tick: watch the counters for the live coach step. */
  tick() {
    if (useSession.getState().phase !== "playing") return;
    const cur = currentCoach();
    if (!cur || !cur.step || cur.card) {
      if (get().base) set({ base: null, frac: 0 });
      return;
    }
    const { track, amount } = cur.step.goal;
    const value = journeyTrack[track] || 0;
    const b = get().base;
    if (!b || b.key !== cur.key) {
      set({ base: { key: cur.key, value, t: Date.now() }, frac: 0 });
      // A step with a place to go sets a waypoint there (unless one is set).
      if (cur.step.where && !useUI.getState().waypoint) {
        useUI.getState().setWaypoint({ regionId: useSession.getState().currentRegionId, ...cur.step.where, auto: true });
      }
      return;
    }
    const got = value - b.value;
    const frac = Math.max(0, Math.min(1, got / amount));
    if (Math.abs(frac - get().frac) > 0.02) set({ frac });
    if (got >= amount) get().advance(cur);
  },
}));

/**
 * "📍 Show me" on the journey tracker: set a waypoint to the next thing the
 * goal needs, from wherever the student is. Returns the waypoint (or null).
 *   friends   → the next friend still to pass (or the gate home first)
 *   travel    → the newly opened gate on Number Island
 *   trophies  → inside that world: the first challenge with no trophy yet;
 *               on the island: that world's gate
 *   keys      → inside the Playground: the first teacher with no key yet
 */
export function guideToGoal() {
  const js = useJourney.getState().js;
  if (!js) return null;
  const g = js.goal;
  const here = useSession.getState().currentRegionId;
  const ui = useUI.getState();
  const goHome = (worldKey) => {
    const wp = homeGateWaypoint(here);
    if (worldKey) useProgress.getState().updateJourney({ guideTo: worldKey });
    if (wp) ui.setWaypoint(wp);
    return wp;
  };
  let wp = null;
  if (g.kind === "friends") {
    if (here !== "island-1") return goHome(null);
    const it = g.friendId ? getInteractable(g.friendId) : null;
    const f = js.friends.find((x) => x.id === g.friendId);
    if (it) wp = { regionId: here, x: it.position[0], z: it.position[1], label: it.name, icon: f ? f.icon : "👋", arrive: 4, auto: true };
  } else if (g.kind === "travel" || ((g.kind === "trophies" || g.kind === "keys") && here !== g.targetRegion)) {
    if (here !== "island-1") return goHome(g.worldKey);
    wp = gateWaypoint(g.worldKey);
  } else if (g.kind === "trophies" || g.kind === "keys") {
    let pois = [];
    try { pois = regionMapPois(here, { progress: useProgress.getState(), results: [] }); } catch { pois = []; }
    const kind = g.kind === "trophies" ? "challenge" : "friend";
    const p = pois.find((x) => x.kind === kind && !x.medal && !x.soon);
    if (p) wp = { regionId: here, x: p.target[0], z: p.target[1], label: p.name, icon: p.icon, arrive: p.arrive || 4, auto: true };
  }
  if (wp) ui.setWaypoint(wp);
  return wp;
}

/** Is this Number Island portal locked right now? (null = open) */
export function lockForPortal(portalId) {
  return portalLock(useJourney.getState().js, portalId);
}
/** Is this island gate's world OPEN but not yet visited (the "next stop")? */
export function freshPortal(portalId) {
  const js = useJourney.getState().js;
  if (!js) return false;
  const w = js.worlds.find((x) => x.portalId === portalId);
  return Boolean(w && w.open && !w.visited && !w.adminOpen);
}

/** Solid, hinted colliders across the doorways of the locked island gates. */
export function lockedPortalColliders(regionId) {
  if (regionId !== "island-1") return [];
  const js = useJourney.getState().js;
  if (!js) return [];
  const out = [];
  for (const p of REGIONS["island-1"].portals || []) {
    const lock = portalLock(js, p.id);
    if (!lock) continue;
    out.push({ id: `jlock-${p.id}`, kind: "gate", x: p.position[0], z: p.position[1], radius: (p.radius || 2) + 0.55, hint: lock.text, name: p.label });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Wiring: start once (App calls this). Subscriptions turn UI changes into
// journeyTrack counts; a ticker runs the coach + refreshes the trophies.
// ---------------------------------------------------------------------------
let started = false;
let lastChallenge = false;
export function startJourney() {
  if (started) return;
  started = true;
  const J = useJourney.getState();
  J.refresh();

  useProgress.subscribe((s, prev) => {
    if (s.completedMissions !== prev.completedMissions || s.journey !== prev.journey) useJourney.getState().refresh();
  });

  useSession.subscribe((s, prev) => {
    if (s.phase !== prev.phase) useJourney.getState().refresh();
    if (s.currentRegionId === prev.currentRegionId) return;
    useJourney.getState().refresh();
    useJourney.setState({ base: null, frac: 0 });
    // Coming home after "Show me the way": point at the newly opened gate.
    if (s.currentRegionId === "island-1") {
      const j = useProgress.getState().journey || {};
      if (j.guideTo) {
        const wp = gateWaypoint(j.guideTo);
        useProgress.getState().updateJourney({ guideTo: null });
        if (wp) setTimeout(() => useUI.getState().setWaypoint(wp), 60);
      }
    }
  });

  useUI.subscribe((s, prev) => {
    if (prev.fpv && !s.fpv) noteFpvExit();
    if (prev.wallView && !s.wallView) journeyTrack.wallCloses += 1;
    if (s.mapOpen && !prev.mapOpen) journeyTrack.mapOpens += 1;
    // Only waypoints the STUDENT sets count (not the coach's own).
    if (s.waypoint && !s.waypoint.auto && (!prev.waypoint || s.waypoint.at !== prev.waypoint.at)) journeyTrack.waypoints += 1;
    for (const k of ["trophyOpen", "farmTrophyOpen", "snowTrophyOpen", "magmaTrophyOpen", "jungleTrophyOpen"]) {
      if (prev[k] && !s[k]) journeyTrack.trophyCloses += 1;
    }
  });

  setInterval(() => {
    const on = isAnyChallengeActive();
    if (on && !lastChallenge) journeyTrack.challengeStarts += 1;
    lastChallenge = on;
    useJourney.getState().tick();
  }, TICK_MS);
  setInterval(() => useJourney.getState().refresh(), REFRESH_MS);
}

// DEV handle for the headless harness.
if (import.meta.env && import.meta.env.DEV && typeof window !== "undefined") {
  window.__journey = { useJourney, journeyTrack, currentCoach };
}
