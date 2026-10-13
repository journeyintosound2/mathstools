/**
 * CLOUD PROGRESS (2026-10-13) — headless checks for the signed-in student's
 * cloud save (src/cloud/progressMerge.js + progressSync.js).
 *
 *   CP1  what travels: the progress fields, every world's bests, visits, farm
 *        task markers and farm "reported" marks — nothing else from storage;
 *        the device-only guideTo never travels
 *   CP2  the merge keeps the best of both: max XP / coins / bests, union of
 *        missions / badges / journey beats, OR of one-way flags; order-free,
 *        idempotent, and never loses anything either side had
 *   CP3  a cloud doc is cleaned before it's applied (foreign keys, junk
 *        values and wrong types are dropped)
 *   CP4  students who played signed-in BEFORE this: their achievement
 *        records rebuild the passed warm-ups / keys / tasks and farm bests
 *   CP5  save timing: reordering is not a change, XP is "minor", a best or a
 *        mission is "major"; the Firestore doc only has the fields the rule
 *        allows and fits easily under the 1 MiB limit
 *   CP6  sign-in on a new device picks up the cloud save (journey, bests,
 *        XP); then the device's extra progress goes up — never down
 *   CP7  a shared iPad: student B's sign-in puts A's save aside and starts
 *        from B's; A signing back in gets A's own save back; a cloud
 *        failure still keeps the two apart, and saves nothing
 *   CP8  the autosave waits the right gap (milestones ~8 s, XP ~30 s)
 *   CP9  the Firestore rule: own doc only, pinned shape, no delete — in both
 *        copies of the rules; the collection is registered
 */
import {
  collectProgress, mergeProgress, cleanPayload, backfillFromAchievements, syncPlan, progressDoc,
  changeKind, stableKey, docBytes, readSyncedKeys, PROGRESS_FIELDS, SYNCED_KEY,
} from "../cloud/progressMerge.js";
import {
  beginLoad, finishLoad, prepareSave, confirmSaved, autosaveDue, progressOwner, useProgressSync,
  __resetProgressSync, __setSentAt, __progressSyncState, OWNER_KEY, STASH_PREFIX, MAJOR_GAP_MS, MINOR_GAP_MS, MAX_DOC_BYTES,
} from "../cloud/progressSync.js";
import { PHASE3D_CLAIMS_RULES } from "../cloud/firestoreRulesDraft.js";
import { COLLECTIONS } from "../cloud/firebaseConfig.js";
import { DEFAULT_JOURNEY } from "../data/journey.js";
import { FARM_BEST_KEYS, FARM_MAX_SCORES } from "../data/farm/farmRecords.js";
import { SNOW_BEST_KEYS } from "../data/snow/snowRecords.js";
import { MAGMA_BEST_KEYS } from "../data/magma/magmaRecords.js";
import { JUNGLE_BEST_KEYS } from "../data/jungle/jungleRecords.js";
import { useProgress } from "../progress/store.js";
import { useResults, RESULTS_KEY } from "../results/resultStore.js";

const SAVE_KEY = "mills-maths-adventure:v1";

/** A tiny localStorage stand-in for the pure functions. */
function fakeStorage(entries = {}) {
  const m = new Map(Object.entries(entries));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    _m: m,
  };
}

function payload({ xp = 0, coins = 0, missions = [], badges = [], journey = {}, bests = {}, flags = {}, skills = {} } = {}) {
  return {
    v: 1,
    progress: {
      xp, coins, completedEncounters: [], completedQuests: [], completedMissions: missions, earnedBadges: badges,
      skillProfiles: skills, onboardingSeen: false, sageMet: false, championClaimed: false, seenUnlocks: [],
      journey: { ...DEFAULT_JOURNEY, ...journey },
    },
    bests, flags,
  };
}

/** Every key the real game keeps in localStorage that this test may touch. */
function snapshotStorage() {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); out[k] = localStorage.getItem(k); }
  } catch { /* none */ }
  return out;
}
function restoreStorage(snap) {
  try {
    const now = [];
    for (let i = 0; i < localStorage.length; i++) now.push(localStorage.key(i));
    for (const k of now) if (!(k in snap)) localStorage.removeItem(k);
    for (const [k, v] of Object.entries(snap)) localStorage.setItem(k, v);
  } catch { /* none */ }
}

/** Run `fn` against a clean device, putting the real save + stores back afterwards. */
function onCleanDevice(fn) {
  const snap = snapshotStorage();
  const prog = useProgress.getState();
  const keepProgress = {};
  for (const k of [...PROGRESS_FIELDS, "level", "profile", "activeMission", "activeMissionId", "missionProgress"]) keepProgress[k] = prog[k];
  const keepResults = useResults.getState().results;
  try {
    for (const k of Object.keys(snap)) if (SYNCED_KEY.test(k) || k === OWNER_KEY || k.startsWith(STASH_PREFIX) || k === SAVE_KEY || k === RESULTS_KEY || k.startsWith("mma-local-results:")) localStorage.removeItem(k);
    __resetProgressSync();
    useProgress.getState().applyCloudProgress({}, { replace: true });
    useResults.setState({ results: [] });
    return fn();
  } finally {
    __resetProgressSync();
    restoreStorage(snap);
    useProgress.setState(keepProgress);
    useResults.setState({ results: keepResults });
  }
}

export function runCloudProgressChecks() {
  const checks = [];
  const push = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
  const fence = FARM_BEST_KEYS.fence;
  const snowKey = Object.values(SNOW_BEST_KEYS)[0];
  const magmaKey = Object.values(MAGMA_BEST_KEYS)[0];
  const jungleKey = Object.values(JUNGLE_BEST_KEYS)[0];

  // CP1 — what travels.
  {
    const st = fakeStorage({
      [fence]: "300", [snowKey]: "120", [magmaKey]: "0", [jungleKey]: "75",
      "mma-visited:snow-sums": "1", "mma-farm-task-done:abc123": "1", "mma-farm-synced:fence": "300",
      "mma-touch-coach": "3", "mma-graphics": "high", [OWNER_KEY]: "AB12", [SAVE_KEY]: "{}", "mma-local-save:ZZ": "{}",
    });
    const { bests, flags } = readSyncedKeys(st);
    const state = { xp: 140, coins: 12, completedMissions: ["warmup-pip"], journey: { ...DEFAULT_JOURNEY, trainingDone: true, guideTo: "snow-sums" }, profile: { name: "Sam" }, activeMission: { missionId: "x" } };
    const p = collectProgress(state, st);
    const ok = bests[fence] === 300 && bests[snowKey] === 120 && !(magmaKey in bests) && bests[jungleKey] === 75 &&
      bests["mma-farm-synced:fence"] === 300 && flags["mma-visited:snow-sums"] === 1 && flags["mma-farm-task-done:abc123"] === 1 &&
      Object.keys(bests).length + Object.keys(flags).length === 6 &&
      p.progress.xp === 140 && p.progress.journey.trainingDone === true && p.progress.journey.guideTo === null &&
      !("profile" in p.progress) && !("activeMission" in p.progress);
    push("CP1 cloud progress: only the student's progress + bests/visits/markers travel", ok,
      ok ? "6 keys picked from 12; profile, settings, the owner + stashes stay on the device; guideTo stays" : JSON.stringify({ bests, flags, j: p.progress.journey }));
  }

  // CP2 — the merge.
  {
    const a = payload({ xp: 300, coins: 5, missions: ["warmup-pip", "warmup-fern"], badges: [{ badgeId: "b1", earnedAt: 20 }],
      journey: { step: 3, trainingStarted: true, intros: ["snow-sums"], introStep: { "snow-sums": 2 }, celebrated: ["snow"] },
      bests: { [fence]: 200, [snowKey]: 100 }, flags: { "mma-visited:snow-sums": 1 }, skills: { s1: { attempts: 4 } } });
    const b = payload({ xp: 120, coins: 40, missions: ["warmup-alby", "warmup-pip"], badges: [{ badgeId: "b1", earnedAt: 10 }, { badgeId: "b2", earnedAt: 30 }],
      journey: { step: 8, trainingDone: true, intros: ["magma-multiples"], introStep: { "snow-sums": 1 }, celebrated: ["magma"], seeded: true },
      bests: { [fence]: 250, [magmaKey]: 90 }, flags: { "mma-farm-task-done:t1": 1 }, skills: { s1: { attempts: 9 }, s2: { attempts: 1 } } });
    const m = mergeProgress(a, b);
    const g = m.progress;
    const ok = g.xp === 300 && g.coins === 40 && ["warmup-pip", "warmup-fern", "warmup-alby"].every((x) => g.completedMissions.includes(x)) && g.completedMissions.length === 3 &&
      g.earnedBadges.length === 2 && g.earnedBadges.find((x) => x.badgeId === "b1").earnedAt === 10 &&
      g.journey.step === 8 && g.journey.trainingStarted && g.journey.trainingDone && g.journey.seeded &&
      g.journey.intros.length === 2 && g.journey.introStep["snow-sums"] === 2 && g.journey.celebrated.length === 2 &&
      m.bests[fence] === 250 && m.bests[snowKey] === 100 && m.bests[magmaKey] === 90 &&
      m.flags["mma-visited:snow-sums"] && m.flags["mma-farm-task-done:t1"] && g.skillProfiles.s1.attempts === 9 && g.skillProfiles.s2;
    const strip = (x) => stableKey({ ...x, progress: { ...x.progress, journey: { ...x.progress.journey, guideTo: null } } });
    const orderFree = strip(mergeProgress(a, b)) === strip(mergeProgress(b, a));
    const idem = strip(mergeProgress(m, b)) === strip(m) && strip(mergeProgress(a, m)) === strip(m);
    const withNull = mergeProgress(null, b) && mergeProgress(a, null) === a && mergeProgress(null, null) === null;
    push("CP2 cloud progress: the merge keeps the best of both, in any order, never loses anything", ok && orderFree && idem && withNull,
      ok && orderFree && idem && withNull ? "max XP/coins/bests · union missions/badges/beats · OR flags · order-free · idempotent" : JSON.stringify({ ok, orderFree, idem, withNull }));
  }

  // CP3 — cleaning a cloud doc.
  {
    const dirty = {
      v: 1, studentCode: "AB12", teacherCode: "T1",
      progress: { xp: -50, coins: "7", completedMissions: ["warmup-pip", 5, null], earnedBadges: [{ badgeId: "b1" }, "x"], skillProfiles: [1, 2], journey: { step: 2, guideTo: "x" }, profile: { name: "hack" }, activeMission: { evil: 1 } },
      bests: { [fence]: 300, "mma-farm-fence-best": 300, [OWNER_KEY]: 9, "mills-maths-adventure:v1": 1, [snowKey]: -4, [jungleKey]: "abc" },
      flags: { "mma-visited:snow-sums": 1, [fence]: 1, "evil": 1, "mma-visited:../x": 1 },
    };
    const c = cleanPayload(dirty);
    const ok = c.progress.xp === 0 && c.progress.coins === 7 && stableKey(c.progress.completedMissions) === stableKey(["warmup-pip"]) &&
      c.progress.earnedBadges.length === 1 && !("skillProfiles" in c.progress) && c.progress.journey.guideTo === null &&
      !("profile" in c.progress) && !("activeMission" in c.progress) &&
      stableKey(Object.keys(c.bests)) === stableKey([fence]) && stableKey(Object.keys(c.flags)) === stableKey(["mma-visited:snow-sums"]) &&
      cleanPayload(null) === null;
    push("CP3 cloud progress: a cloud doc is cleaned before it is applied", ok,
      ok ? "foreign keys, negative/odd values and wrong types dropped" : JSON.stringify(c));
  }

  // CP4 — rebuilding from old achievement records.
  {
    const docs = [
      { levelKey: "warmup-pip", percent: 80 }, { levelKey: "warmup-fern", percent: 40 }, { levelKey: "warmup-fern", percent: 60 },
      { levelKey: "warmup-alby", percent: 55 }, { levelKey: "warmup-pearce", percent: 100 },
      { levelKey: "farm-fence", percent: 80, level: "Fraction Farm: Fence Challenge" },
      { levelKey: "farm-fence", percent: 60, level: "Fraction Farm: Fence Challenge" },
      { levelKey: "task-xyz", percent: 100, level: "Fraction Farm: The Milk Splitter", adventureTaskId: "task-xyz" },
      { levelKey: null, percent: 100 }, null,
    ];
    const r = backfillFromAchievements(docs);
    const cm = r && r.progress.completedMissions;
    const ok = r && cm.includes("warmup-pip") && cm.includes("warmup-fern") && !cm.includes("warmup-alby") && cm.includes("warmup-pearce") &&
      !cm.includes("farm-fence") && !cm.includes("task-xyz") &&
      r.bests[fence] === Math.round(0.8 * FARM_MAX_SCORES.fence) && r.bests[FARM_BEST_KEYS.milk] === FARM_MAX_SCORES.milk &&
      r.flags["mma-farm-task-done:task-xyz"] === 1 && backfillFromAchievements([]) === null &&
      backfillFromAchievements([{ levelKey: "warmup-pip", percent: 30 }]) === null;
    push("CP4 cloud progress: old achievement records rebuild warm-ups, keys, tasks + farm bests", ok,
      ok ? `missions ${cm.join(", ")} · farm bests from records + teacher tasks` : JSON.stringify(r));
  }

  // CP5 — save timing + the doc's shape.
  {
    const a = payload({ xp: 100, missions: ["warmup-pip", "warmup-fern"], bests: { [fence]: 100 } });
    const reordered = payload({ xp: 100, missions: ["warmup-fern", "warmup-pip"], bests: { [fence]: 100 } });
    const xpOnly = payload({ xp: 140, missions: ["warmup-pip", "warmup-fern"], bests: { [fence]: 100 } });
    const best = payload({ xp: 100, missions: ["warmup-pip", "warmup-fern"], bests: { [fence]: 150 } });
    const mission = payload({ xp: 100, missions: ["warmup-pip", "warmup-fern", "warmup-alby"], bests: { [fence]: 100 } });
    const kinds = [changeKind(a, a), changeKind(a, reordered), changeKind(a, xpOnly), changeKind(a, best), changeKind(a, mission), changeKind(null, a)];
    const kindsOk = kinds[0] === "none" && kinds[1] === "none" && kinds[2] === "minor" && kinds[3] === "major" && kinds[4] === "major" && kinds[5] === "major";
    const student = { studentCode: "AB12", teacherCode: "T9", className: "7M" };
    const withUndef = payload({ xp: 5, skills: { s1: { attempts: 1, lastAttempt: undefined } } });
    const doc = progressDoc(withUndef, student, 1234);
    const allowed = ["v", "studentCode", "teacherCode", "className", "updatedAtClient", "progress", "bests", "flags"];
    const shapeOk = stableKey(Object.keys(doc)) === stableKey(allowed) && doc.studentCode === "AB12" && doc.teacherCode === "T9" &&
      !JSON.stringify(doc).includes("undefined") && !("lastAttempt" in doc.progress.skillProfiles.s1);
    // A big save: every mission, every best, 150 skills, 40 badges.
    const allBests = {};
    for (const keys of [FARM_BEST_KEYS, SNOW_BEST_KEYS, MAGMA_BEST_KEYS, JUNGLE_BEST_KEYS]) for (const k of Object.values(keys)) allBests[k] = 375;
    const skills = {};
    for (let i = 0; i < 150; i++) skills[`skill-${i}`] = { attempts: 40, correct: 30, workingDifficulty: 3, streak: 2, incorrectStreak: 0, accuracy: 0.75, lastAttempt: 1760000000000 };
    const big = payload({ xp: 99999, coins: 9999, missions: Array.from({ length: 120 }, (_, i) => `mission-${i}`), badges: Array.from({ length: 40 }, (_, i) => ({ badgeId: `badge-${i}`, earnedAt: i })), bests: allBests, skills,
      journey: { intros: ["snow-sums", "magma-multiples", "farm-parts-whole", "emerald-jungle", "schoolyard"], celebrated: ["snow", "magma", "farm", "jungle", "playground"] } });
    const bytes = docBytes(progressDoc(big, student));
    const sizeOk = bytes < 60 * 1024 && MAX_DOC_BYTES < 1024 * 1024;
    push("CP5 cloud progress: save timing + a doc the rule accepts, well under Firestore's limit", kindsOk && shapeOk && sizeOk,
      kindsOk && shapeOk && sizeOk ? `reorder = none · XP = minor · best/mission = major · a full save ≈ ${(bytes / 1024).toFixed(1)} KB` : JSON.stringify({ kinds, shapeOk, bytes }));
  }

  // CP6 — sign-in on a new device, then the device's extra progress goes up.
  {
    let detail = "";
    const ok = onCleanDevice(() => {
      const student = { studentCode: "AB12", teacherCode: "T9", className: "7M" };
      const cloudDoc = progressDoc(payload({ xp: 640, coins: 33, missions: ["warmup-pip", "warmup-fern", "warmup-alby"],
        journey: { step: 8, trainingDone: true, seeded: true, celebrated: ["snow"], intros: ["snow-sums"] },
        bests: { [snowKey]: 300 }, flags: { "mma-visited:snow-sums": 1 } }), student);
      const { gen, plan } = beginLoad(student);
      const loaded = finishLoad(gen, cleanPayload(cloudDoc));
      const p = useProgress.getState();
      const pickedUp = plan === "merge" && loaded && p.xp === 640 && p.coins === 33 && p.completedMissions.length === 3 &&
        p.journey.trainingDone === true && p.journey.celebrated.includes("snow") && localStorage.getItem(snowKey) === "300" &&
        localStorage.getItem("mma-visited:snow-sums") === "1" && progressOwner() === "AB12" && p.level > 1;
      // The cloud already has all of it → nothing to send.
      const nothing = prepareSave() === null;
      // Play on: a new best + XP → a save goes up with BOTH.
      useProgress.getState().awardRewards({ xp: 25 });
      localStorage.setItem(FARM_BEST_KEYS.fence, "200");
      const next = prepareSave();
      const upOk = next && next.doc.progress.xp === 665 && next.doc.bests[FARM_BEST_KEYS.fence] === 200 && next.doc.bests[snowKey] === 300;
      if (next) confirmSaved(next.payload);
      // A reset device can't drag the cloud down: lose everything locally, nothing goes up.
      useProgress.getState().applyCloudProgress({}, { replace: true });
      localStorage.removeItem(snowKey);
      const afterReset = prepareSave();
      const neverDown = afterReset === null;
      detail = JSON.stringify({ pickedUp, nothing, upOk, neverDown, xp: p.xp });
      return pickedUp && nothing && upOk && neverDown && useProgressSync.getState().status === "synced";
    });
    push("CP6 cloud progress: a new device picks up the cloud save; play goes up; the cloud never goes down", ok,
      ok ? "XP 640, the warm-ups, the journey, the snow best + visit in place · +25 XP and a farm best go up · a reset device sends nothing" : detail);
  }

  // CP7 — a shared iPad.
  {
    let detail = "";
    const ok = onCleanDevice(() => {
      const A = { studentCode: "AAA1", teacherCode: "T9", className: "7M" };
      const B = { studentCode: "BBB2", teacherCode: "T9", className: "7M" };
      // A signs in (no cloud doc yet) and plays.
      let { gen } = beginLoad(A);
      finishLoad(gen, null, { created: true });
      useProgress.getState().awardRewards({ xp: 500 });
      useProgress.getState().applyCloudProgress({ completedMissions: ["warmup-pip"] });
      localStorage.setItem(snowKey, "250");
      useResults.getState().addResult({ attemptId: "a-1", missionId: "warmup-pip", percentage: 90, questionCount: 5, correctCount: 5 });
      // B signs in on the same iPad: A's save is put aside, B's cloud save loads.
      const bCloud = cleanPayload(progressDoc(payload({ xp: 90, missions: ["warmup-fern"], bests: { [magmaKey]: 40 } }), B));
      const b1 = beginLoad(B);
      const midway = useProgress.getState().xp === 0 && localStorage.getItem(snowKey) === null && useResults.getState().results.length === 0;
      finishLoad(b1.gen, bCloud);
      const pb = useProgress.getState();
      const bOk = b1.plan === "replace" && midway && pb.xp === 90 && stableKey(pb.completedMissions) === stableKey(["warmup-fern"]) &&
        localStorage.getItem(magmaKey) === "40" && localStorage.getItem(snowKey) === null && progressOwner() === "BBB2" &&
        Boolean(localStorage.getItem(STASH_PREFIX + "AAA1"));
      // A comes back: A's own save is restored (from the device) + merged with A's cloud copy.
      const aCloud = cleanPayload(progressDoc(payload({ xp: 500, missions: ["warmup-pip"], bests: { [snowKey]: 250 } }), A));
      const a2 = beginLoad(A);
      finishLoad(a2.gen, aCloud);
      const pa = useProgress.getState();
      const aOk = a2.plan === "replace" && pa.xp === 500 && stableKey(pa.completedMissions) === stableKey(["warmup-pip"]) &&
        localStorage.getItem(snowKey) === "250" && localStorage.getItem(magmaKey) === null &&
        useResults.getState().results.length === 1 && !localStorage.getItem(STASH_PREFIX + "AAA1") && Boolean(localStorage.getItem(STASH_PREFIX + "BBB2"));
      // B signs in while the cloud is unreachable: still kept apart, and nothing is saved.
      const b2 = beginLoad(B);
      const apartOk = b2.plan === "replace" && useProgress.getState().xp === 90 && localStorage.getItem(snowKey) === null &&
        __progressSyncState().ready === false && prepareSave() === null && autosaveDue(Date.now() + 999999) === null;
      detail = JSON.stringify({ bOk, aOk, apartOk, midway });
      return bOk && aOk && apartOk;
    });
    push("CP7 cloud progress: a shared iPad keeps each student's save apart (even offline)", ok,
      ok ? "B's sign-in sets A's save aside · A gets theirs back · a cloud failure still swaps, never saves" : detail);
  }

  // CP8 — the autosave gaps.
  {
    let detail = "";
    const ok = onCleanDevice(() => {
      const S = { studentCode: "CC33", teacherCode: "T9", className: "7M" };
      const { gen } = beginLoad(S);
      finishLoad(gen, cleanPayload(progressDoc(payload({ xp: 10 }), S)));
      const first = prepareSave();
      if (first) confirmSaved(first.payload);
      const t0 = Date.now();
      __setSentAt(t0);
      const idle = autosaveDue(t0 + 60000) === null;
      useProgress.getState().awardRewards({ xp: 5 });
      const minor = [autosaveDue(t0 + MAJOR_GAP_MS), autosaveDue(t0 + MINOR_GAP_MS - 1), autosaveDue(t0 + MINOR_GAP_MS)];
      localStorage.setItem(FARM_BEST_KEYS.order, "100");
      const major = [autosaveDue(t0 + MAJOR_GAP_MS - 1), autosaveDue(t0 + MAJOR_GAP_MS)];
      detail = JSON.stringify({ idle, minor, major });
      return idle && minor[0] === null && minor[1] === null && minor[2] === "minor" && major[0] === null && major[1] === "major";
    });
    push("CP8 cloud progress: the autosave waits ~8 s for milestones, ~30 s for XP", ok,
      ok ? `nothing new → no save · XP after ${MINOR_GAP_MS / 1000} s · a new best after ${MAJOR_GAP_MS / 1000} s` : detail);
  }

  // CP9 — the rule.
  {
    const R = PHASE3D_CLAIMS_RULES;
    const block = (R.match(/match\s*\/adventureProgress\/\{studentCode\}\s*\{[\s\S]*?\n\s{4}\}/) || [""])[0];
    const keysList = (block.match(/hasOnly\(\[([^\]]*)\]\)/) || [, ""])[1].split(",").map((x) => x.trim().replace(/'/g, "")).filter(Boolean);
    const docKeys = [...Object.keys(progressDoc(payload(), { studentCode: "X" })), "updatedAt"];
    const ok = Boolean(block) &&
      /allow\s+read:\s*if\s+\(isStudent\(\)\s*&&\s*myStudent\(\)\s*==\s*studentCode\)/.test(block) &&
      /isTeacher\(\)\s*&&\s*resource\.data\.teacherCode\s*==\s*myTeacher\(\)/.test(block) &&
      /allow\s+create,\s*update:\s*if\s+isStudent\(\)/.test(block) && /myStudent\(\)\s*==\s*studentCode/.test(block) &&
      /request\.resource\.data\.studentCode\s*==\s*studentCode/.test(block) && /request\.resource\.data\.teacherCode\s*==\s*myTeacher\(\)/.test(block) &&
      /allow\s+delete:\s*if\s+false/.test(block) &&
      stableKey(keysList) === stableKey(docKeys) &&
      R.indexOf("adventureProgress") < R.indexOf("match /{document=**}") &&
      COLLECTIONS.adventureProgress === "adventureProgress" && syncPlan(null, "A") === "merge" && syncPlan("A", "A") === "merge" && syncPlan("B", "A") === "replace";
    push("CP9 cloud progress: the Firestore rule — own doc only, pinned shape, no delete", ok,
      ok ? `student reads/writes own · teacher reads own class · ${keysList.length} fields pinned (= the doc) · before the default deny` : JSON.stringify({ found: Boolean(block), keysList, docKeys }));
  }

  return checks;
}
