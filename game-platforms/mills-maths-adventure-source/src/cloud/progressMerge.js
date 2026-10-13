/**
 * CLOUD PROGRESS — the pure half (2026-10-13). A signed-in student's whole
 * save lives in ONE Firestore document, `adventureProgress/{studentCode}`, so
 * signing in on any device picks up where they left off.
 *
 *   collectProgress(state, storage)   the payload: XP, coins, missions /
 *                                     warm-ups / keys, badges, adaptive skill
 *                                     profiles, the story + journey beats, and
 *                                     every world's local trophy bests
 *   mergeProgress(a, b)               the best of both (never loses progress):
 *                                     max for numbers + bests, union for lists,
 *                                     OR for one-way flags
 *   backfillFromAchievements(docs)    a student who played signed-in BEFORE
 *                                     this existed: rebuild what the old
 *                                     achievement records can tell us (passed
 *                                     warm-ups / keys / tasks + farm bests)
 *   syncPlan(owner, code)             whose save is on this device? merge it,
 *                                     or switch to this student's
 *
 * No Firebase, no React — the headless checks drive all of it.
 */
import { DEFAULT_JOURNEY } from "../data/journey.js";
import { FARM_BEST_KEYS, FARM_MAX_SCORES } from "../data/farm/farmRecords.js";
import { FARM_TASK_META } from "../data/farm/farmTaskObjective.js";
import { PASS_THRESHOLD } from "../missions/scoring.js";

export const PROGRESS_VERSION = 1;

/**
 * The localStorage keys that travel with a student: every world's trophy
 * bests, the worlds visited, farm teacher tasks done, and the farm's "already
 * reported to the teacher" high-water marks (so a new device doesn't re-send
 * every farm best as a fresh achievement).
 */
export const SYNCED_KEY = /^mma-(farm|snow|magma|jungle)-[a-z0-9]+-best$|^mma-visited:[a-z0-9-]+$|^mma-farm-task-done:[A-Za-z0-9_-]+$|^mma-farm-synced:[a-z]+$/;
/** Numbers (kept as the max); the rest are one-way "1" markers. */
export const isNumericKey = (k) => /-best$|^mma-farm-synced:/.test(k);
const isBestKey = isNumericKey;

/** Fields of the progress store that travel (level is derived from xp). */
export const PROGRESS_FIELDS = [
  "xp", "coins", "completedEncounters", "completedQuests", "completedMissions", "earnedBadges",
  "skillProfiles", "onboardingSeen", "sageMet", "championClaimed", "seenUnlocks", "journey",
];

const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const union = (a, b) => [...new Set([...arr(a), ...arr(b)])];

/** Read the synced localStorage keys into { bests, flags }. `storage` = localStorage-like. */
export function readSyncedKeys(storage) {
  const bests = {};
  const flags = {};
  if (!storage) return { bests, flags };
  try {
    const n = storage.length || 0;
    for (let i = 0; i < n; i++) {
      const k = storage.key(i);
      if (!k || !SYNCED_KEY.test(k)) continue;
      const v = storage.getItem(k);
      if (isBestKey(k)) { const b = num(v); if (b > 0) bests[k] = b; }
      else if (v) flags[k] = 1;
    }
  } catch { /* storage blocked → nothing */ }
  return { bests, flags };
}

/** The payload for one student (without identity — the sync adds that). */
export function collectProgress(state = {}, storage = null) {
  const progress = {};
  for (const f of PROGRESS_FIELDS) {
    if (state[f] !== undefined) progress[f] = state[f];
  }
  // guideTo is a one-off hint for THIS device — it never travels.
  progress.journey = { ...DEFAULT_JOURNEY, ...(state.journey || {}), guideTo: null };
  const { bests, flags } = readSyncedKeys(storage);
  return { v: PROGRESS_VERSION, progress, bests, flags };
}

/**
 * A payload read from the cloud, made safe to apply: only keys the game owns
 * (SYNCED_KEY), only real non-negative numbers, only known progress fields.
 */
export function cleanPayload(doc) {
  if (!doc || typeof doc !== "object") return null;
  const progress = {};
  const src = doc.progress && typeof doc.progress === "object" ? doc.progress : {};
  for (const f of PROGRESS_FIELDS) if (src[f] !== undefined && src[f] !== null) progress[f] = src[f];
  for (const f of ["completedEncounters", "completedQuests", "completedMissions", "seenUnlocks"]) {
    if (progress[f] !== undefined) progress[f] = arr(progress[f]).filter((x) => typeof x === "string");
  }
  if (progress.earnedBadges !== undefined) progress.earnedBadges = arr(progress.earnedBadges).filter((b) => b && typeof b.badgeId === "string");
  if (progress.xp !== undefined) progress.xp = Math.max(0, num(progress.xp));
  if (progress.coins !== undefined) progress.coins = Math.max(0, num(progress.coins));
  if (progress.skillProfiles !== undefined && (typeof progress.skillProfiles !== "object" || Array.isArray(progress.skillProfiles))) delete progress.skillProfiles;
  if (progress.journey !== undefined) progress.journey = { ...DEFAULT_JOURNEY, ...(typeof progress.journey === "object" ? progress.journey : {}), guideTo: null };
  const bests = {};
  for (const [k, v] of Object.entries(doc.bests || {})) {
    if (SYNCED_KEY.test(k) && isNumericKey(k) && num(v) > 0) bests[k] = num(v);
  }
  const flags = {};
  for (const [k, v] of Object.entries(doc.flags || {})) {
    if (SYNCED_KEY.test(k) && !isNumericKey(k) && v) flags[k] = 1;
  }
  return { v: PROGRESS_VERSION, progress, bests, flags };
}

/** JSON with sorted keys (and sorted lists of plain values) — for comparing. */
export function stableKey(x) {
  const norm = (v) => {
    if (Array.isArray(v)) {
      const items = v.map(norm);
      return items.every((i) => typeof i !== "object" || i === null) ? [...items].sort() : items;
    }
    if (v && typeof v === "object") {
      const out = {};
      for (const k of Object.keys(v).sort()) if (v[k] !== undefined) out[k] = norm(v[k]);
      return out;
    }
    return v;
  };
  return JSON.stringify(norm(x));
}

/** Does this payload hold any real progress? */
export function hasProgress(p) {
  if (!p) return false;
  const g = p.progress || {};
  return num(g.xp) > 0 || arr(g.completedMissions).length > 0 || Object.keys(p.bests || {}).length > 0;
}

function mergeBadges(a, b) {
  const byId = new Map();
  for (const x of [...arr(a), ...arr(b)]) {
    if (!x || !x.badgeId) continue;
    const prev = byId.get(x.badgeId);
    if (!prev || num(x.earnedAt) < num(prev.earnedAt)) byId.set(x.badgeId, x);
  }
  return [...byId.values()];
}

function mergeSkills(a = {}, b = {}) {
  const out = { ...(a || {}) };
  for (const [k, p] of Object.entries(b || {})) {
    const q = out[k];
    if (!q || num(p.attempts) > num(q.attempts) || (num(p.attempts) === num(q.attempts) && num(p.lastAttempt) > num(q.lastAttempt))) out[k] = p;
  }
  return out;
}

export function mergeJourney(a = {}, b = {}) {
  const A = { ...DEFAULT_JOURNEY, ...(a || {}) };
  const B = { ...DEFAULT_JOURNEY, ...(b || {}) };
  const introStep = { ...(A.introStep || {}) };
  for (const [k, v] of Object.entries(B.introStep || {})) introStep[k] = Math.max(num(introStep[k]), num(v));
  return {
    ...B,
    ...A,
    step: Math.max(num(A.step), num(B.step)),
    trainingStarted: Boolean(A.trainingStarted || B.trainingStarted),
    trainingDone: Boolean(A.trainingDone || B.trainingDone),
    trainingSkipped: Boolean(A.trainingSkipped || B.trainingSkipped),
    offerSeen: Boolean(A.offerSeen || B.offerSeen),
    intros: union(A.intros, B.intros),
    introStep,
    celebrated: union(A.celebrated, B.celebrated),
    seeded: Boolean(A.seeded || B.seeded),
    guideTo: A.guideTo || null, // a one-off hint for THIS device
  };
}

/** The best of both payloads — progress is never lost. Either may be null. */
export function mergeProgress(a, b) {
  if (!a && !b) return null;
  if (!a) return { v: PROGRESS_VERSION, ...b, progress: { ...(b.progress || {}), journey: mergeJourney({}, (b.progress || {}).journey) } };
  if (!b) return a;
  const pa = a.progress || {};
  const pb = b.progress || {};
  const progress = {
    xp: Math.max(num(pa.xp), num(pb.xp)),
    coins: Math.max(num(pa.coins), num(pb.coins)),
    completedEncounters: union(pa.completedEncounters, pb.completedEncounters),
    completedQuests: union(pa.completedQuests, pb.completedQuests),
    completedMissions: union(pa.completedMissions, pb.completedMissions),
    earnedBadges: mergeBadges(pa.earnedBadges, pb.earnedBadges),
    skillProfiles: mergeSkills(pa.skillProfiles, pb.skillProfiles),
    onboardingSeen: Boolean(pa.onboardingSeen || pb.onboardingSeen),
    sageMet: Boolean(pa.sageMet || pb.sageMet),
    championClaimed: Boolean(pa.championClaimed || pb.championClaimed),
    seenUnlocks: union(pa.seenUnlocks, pb.seenUnlocks),
    journey: mergeJourney(pa.journey, pb.journey),
  };
  const bests = { ...(a.bests || {}) };
  for (const [k, v] of Object.entries(b.bests || {})) bests[k] = Math.max(num(bests[k]), num(v));
  const flags = { ...(a.flags || {}), ...(b.flags || {}) };
  return { v: PROGRESS_VERSION, progress, bests, flags };
}

/**
 * Students who played signed-in before cloud progress existed already have
 * `achievements` records. Rebuild what they can tell us: every passed mission
 * (Pip / Fern / Alby's warm-ups, the Playground's keys, teacher tasks) and the
 * Fraction Farm bests (the only world that reported its sets).
 */
const FARM_BY_TITLE = Object.fromEntries(
  Object.entries(FARM_TASK_META).map(([id, m]) => [`Fraction Farm: ${m.name}`, id])
);

/** Which farm challenge (if any) an achievement record is about. */
export function farmChallengeOf(d = {}) {
  const m = /^farm-([a-z]+)$/.exec(String(d.levelKey || ""));
  if (m && FARM_BEST_KEYS[m[1]]) return m[1];
  return FARM_BY_TITLE[d.level] || null; // a farm TEACHER task (levelKey = the task id)
}

export function backfillFromAchievements(docs = []) {
  const completedMissions = new Set();
  const bests = {};
  const flags = {};
  const passPct = Math.round(PASS_THRESHOLD * 100);
  for (const d of arr(docs)) {
    if (!d || !d.levelKey) continue;
    const key = String(d.levelKey);
    const pct = num(d.percent);
    const farm = farmChallengeOf(d);
    if (farm) {
      const best = Math.round((pct / 100) * num(FARM_MAX_SCORES[farm]));
      const k = FARM_BEST_KEYS[farm];
      if (best > num(bests[k])) bests[k] = best;
      if (d.adventureTaskId) flags[`mma-farm-task-done:${d.adventureTaskId}`] = 1;
      continue;
    }
    if (pct >= passPct) completedMissions.add(key);
  }
  if (!completedMissions.size && !Object.keys(bests).length) return null;
  return {
    v: PROGRESS_VERSION,
    progress: { completedMissions: [...completedMissions], journey: { ...DEFAULT_JOURNEY } },
    bests,
    flags,
  };
}

/**
 * Whose save is on this device?
 *   "merge"    it's this student's (or nobody's, with progress made before
 *              signing in) — combine it with the cloud copy
 *   "replace"  it belongs to ANOTHER student (a shared iPad) — put theirs
 *              aside and load this student's
 */
export function syncPlan(localOwner, studentCode) {
  if (!localOwner) return "merge";
  if (localOwner === studentCode) return "merge";
  return "replace";
}

/**
 * The Firestore document for a student (identity + payload). JSON round-trip:
 * Firestore refuses `undefined` anywhere in a document.
 */
export function progressDoc(payload, student, now = Date.now()) {
  return JSON.parse(JSON.stringify({
    v: PROGRESS_VERSION,
    studentCode: student.studentCode,
    teacherCode: student.teacherCode || "",
    className: student.className || "",
    updatedAtClient: now,
    progress: payload.progress || {},
    bests: payload.bests || {},
    flags: payload.flags || {},
  }));
}

/** Rough size of a document in bytes (Firestore's limit is 1 MiB). */
export function docBytes(doc) {
  try { return new TextEncoder().encode(JSON.stringify(doc)).length; } catch { return JSON.stringify(doc).length; }
}

/**
 * What changed between two payloads decides HOW SOON it's saved: "major" (a
 * mission, badge, journey beat, trophy best or marker — save soon), "minor"
 * (XP, coins, adaptive skill levels — save within the slow gap) or "none".
 */
export function changeKind(prev, next) {
  if (!prev) return next ? "major" : "none";
  if (!next) return "none";
  const P = prev.progress || {};
  const N = next.progress || {};
  const pick = (g, p) => [g.completedMissions, g.completedQuests, g.completedEncounters, g.earnedBadges, g.journey, g.seenUnlocks, g.onboardingSeen, g.sageMet, g.championClaimed, p.bests, p.flags];
  if (stableKey(pick(P, prev)) !== stableKey(pick(N, next))) return "major";
  return stableKey([P.xp, P.coins, P.skillProfiles]) === stableKey([N.xp, N.coins, N.skillProfiles]) ? "none" : "minor";
}
