/**
 * JEFF'S FEEDBACK BATCH (2026-10-13, after the journey went live) — checks.
 *
 *   UX1  the plaza Trophy Stand is gone (no interactable, no footprint, the
 *        map no longer lists it) — the Achievements Wall replaces it
 *   UX2  the training can't be skipped: no skip action, an old "skipped"
 *        save still gets the training, only a one-minute stuck valve
 *   UX3  the big training prompt: every step has its keys + touch control +
 *        a cheer; every fixed word of it has Farsi + Arabic
 *   UX4  admin mode opens every gate WITHOUT touching the save: the goal is
 *        the real one, admin-opened gates are never celebrated or seeded
 *   UX5  the dialogue box: portraits for the characters with models, a
 *        colour + role for the friends, the bold-words splitter
 *   UX6  Start new game + the dialogue box's labels are translated
 */
import { INTERACTABLES } from "../data/interactables.js";
import { regionMapPois } from "../data/maps/regionMaps.js";
import { ISLAND_FOOTPRINTS } from "../data/island/islandProps.js";
import { TRAINING_STEPS, TRAINING_PROMPTS } from "../data/training.js";
import { journeyState, journeySnapshot, journeyCounts, uncelebrated, portalLock, JOURNEY_WORLDS } from "../data/journey.js";
import { ADMIN_KEY, ADMIN_PASSWORD_SHA256, isAdminMode } from "../data/adminMode.js";
import { TRANSLATIONS } from "../i18n/translations.js";
import { speakerInfo, emphasisParts, PORTRAIT_FILES } from "../ui/dialogue/speakers.js";
import { useJourney, currentCoach, TRAINING_STUCK_AFTER_MS } from "../game/journeyStore.js";

const translated = (s) => Boolean(TRANSLATIONS.fa[s] && TRANSLATIONS.ar[s]);

export function runUxChecks() {
  const checks = [];
  const push = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

  // UX1
  {
    const noIx = !INTERACTABLES.some((i) => i.id === "trophy-stand");
    const noFoot = !(ISLAND_FOOTPRINTS || []).some((f) => f && (f.id === "trophy" || f.kind === "trophy"));
    let pois = [];
    try { pois = regionMapPois("island-1", { progress: {}, results: [] }); } catch { pois = []; }
    const noPoi = !pois.some((p) => /trophy stand/i.test(`${p.name} ${p.sub || ""}`));
    push("UX1 the plaza Trophy Stand is gone (the Achievements Wall replaces it)", noIx && noFoot && noPoi,
      noIx && noFoot && noPoi ? "no interactable, footprint or map pin" : JSON.stringify({ noIx, noFoot, noPoi }));
  }

  // UX2
  {
    const J = useJourney.getState();
    const noSkipAction = typeof J.skipTraining !== "function";
    const skippedSave = { journey: { trainingStarted: true, trainingSkipped: true, trainingDone: false, step: 2 } };
    const cur = currentCoach(skippedSave, "island-1");
    const js = journeyState({ ...journeySnapshot({ completedMissions: [], journey: skippedSave.journey }, {}, {}), admin: false });
    const doneSave = currentCoach({ journey: { trainingStarted: true, trainingDone: true } }, "island-1");
    const ok = noSkipAction && cur && cur.scope === "training" && cur.index === 2 && js.trainingActive === true &&
      doneSave === null && TRAINING_STUCK_AFTER_MS >= 60000;
    push("UX2 the training can't be skipped (a stuck step frees itself after a minute)", ok,
      ok ? `no skip action · an old "skipped" save resumes at step 3 · stuck valve ${TRAINING_STUCK_AFTER_MS / 1000} s` : JSON.stringify({ noSkipAction, cur, active: js.trainingActive }));
  }

  // UX3
  {
    const KEYS = new Set(["move", "look", "run", "jump", "fpv", "talk", "wall", "map"]);
    const TOUCH = new Set(["joy", "drag", "joyRun", "jump", "eye", "talk", "wall", "map"]);
    const shaped = TRAINING_STEPS.every((s) => s.done && s.prompt && KEYS.has(s.prompt.keys) && TOUCH.has(s.prompt.touch));
    const nearOk = TRAINING_STEPS.filter((s) => s.prompt && s.prompt.near).every((s) => s.where);
    const words = [
      ...TRAINING_STEPS.map((s) => s.done),
      ...Object.values(TRAINING_PROMPTS.key), ...Object.values(TRAINING_PROMPTS.touch), ...Object.values(TRAINING_PROMPTS.caps),
      TRAINING_PROMPTS.stuck, TRAINING_PROMPTS.training, TRAINING_PROMPTS.next,
    ];
    const missing = [...new Set(words)].filter((w) => !translated(w));
    push("UX3 the training prompt: keys, touch control + a cheer for every step, all translated", shaped && nearOk && !missing.length,
      shaped && nearOk && !missing.length ? `${TRAINING_STEPS.length} steps · ${new Set(words).size} fixed words in Farsi + Arabic` : JSON.stringify({ shaped, nearOk, missing }));
  }

  // UX4
  {
    const snap = journeySnapshot({ completedMissions: ["warmup-pip"], journey: { seeded: true } }, journeyCounts(), {});
    const real = journeyState({ ...snap, admin: false });
    const adm = journeyState({ ...snap, admin: true });
    const allOpen = adm.worlds.every((w) => w.open) && adm.admin === true;
    const flagged = adm.worlds.filter((w) => w.adminOpen).length === real.worlds.filter((w) => !w.open).length;
    const sameGoal = JSON.stringify(adm.goal) === JSON.stringify(real.goal);
    const noCelebrate = uncelebrated(adm, []).length === uncelebrated(real, []).length;
    const noLocks = JOURNEY_WORLDS.every((w) => portalLock(adm, w.portalId) === null);
    const off = !isAdminMode() && typeof ADMIN_KEY === "string" && /^[0-9a-f]{64}$/.test(ADMIN_PASSWORD_SHA256);
    const ok = allOpen && flagged && sameGoal && noCelebrate && noLocks && off;
    push("UX4 admin mode opens every gate without touching the save (no celebrations, real goal)", ok,
      ok ? "all gates open + flagged · same goal · nothing to celebrate · password stored only as a SHA-256" : JSON.stringify({ allOpen, flagged, sameGoal, noCelebrate, noLocks, off }));
  }

  // UX5
  {
    const withPortraits = ["Mills", "Pip", "Fern", "Alby", "Mr. Pearce", "Ms. Brookes", "Robot", "Steve", "Trevor"].every((n) => /portraits\/[a-z0-9]+\.webp$/.test(speakerInfo(n).img || ""));
    const friendsRole = ["Pip", "Fern", "Alby"].every((n) => speakerInfo(n).role && translated(speakerInfo(n).role));
    const fallback = speakerInfo("Treasure Chest").img === null && speakerInfo("Treasure Chest").icon === "🪙" && speakerInfo("Somebody New").icon;
    const parts = emphasisParts("Win 7 trophies in Fraction Farm — 6 of 7 so far, 50% for 🥉. Golden goldfish.");
    const strong = parts.filter((p) => p.strong).map((p) => p.text);
    const split = JSON.stringify(strong) === JSON.stringify(["7", "trophies", "Fraction Farm", "6 of 7", "50%", "🥉"]) && parts.map((p) => p.text).join("") === "Win 7 trophies in Fraction Farm — 6 of 7 so far, 50% for 🥉. Golden goldfish.";
    const ok = withPortraits && friendsRole && fallback && split && PORTRAIT_FILES.length >= 15;
    push("UX5 the dialogue box: character portraits, roles, the bold words", ok,
      ok ? `${PORTRAIT_FILES.length} portraits · friends' roles translated · bold: ${strong.join(", ")}` : JSON.stringify({ withPortraits, friendsRole, fallback, strong }));
  }

  // UX6
  {
    const words = ["Next", "Back", "Skip", "Goodbye", "Maybe later", "Your guide", "Teacher", "Start new game", "Start again from the very beginning",
      "Start a new game?", "Yes, start a new game", "Cancel",
      "This starts again from the very beginning on this device — the training, the warm-ups, every trophy and your level.",
      "Everyone starts with a quick training lap — the controls, the Achievements Wall and the map. It only takes a few minutes."];
    const missing = words.filter((w) => !translated(w));
    push("UX6 Start new game + the dialogue box's words are in Farsi + Arabic", !missing.length,
      !missing.length ? `${words.length} strings` : `missing: ${missing.join(" | ")}`);
  }

  return checks;
}
