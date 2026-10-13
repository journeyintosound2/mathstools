/**
 * CLOUD PROGRESS — the live half (2026-10-13). Keeps a signed-in student's
 * save in `adventureProgress/{studentCode}` so they pick up where they left
 * off on any device. The pure rules (what travels, how two saves merge) are in
 * progressMerge.js; this file does the timing.
 *
 *   loadCloudProgress(student)   at sign-in: read the doc ONCE (or rebuild it
 *                                from the old achievement records), merge it
 *                                with this device's save, put the result in
 *                                place, then save the merged copy back
 *   startProgressAutosave()      once, from App: every 2 s compare the save
 *                                with what the cloud last got — a milestone
 *                                (mission, trophy best, journey beat…) saves
 *                                within ~8 s, XP / coins / skill levels within
 *                                ~30 s; leaving the page flushes
 *   flushProgress()              save now if anything's waiting
 *   stopProgressSync()           sign-out: flush, then stop
 *
 * SHARED DEVICES: the device remembers whose save it holds
 * (`mma-progress-owner`). Another student signing in puts that save aside on
 * the device (`mma-local-save:<code>`, plus their recent results) and starts
 * from their own — cloud copy, or the save they left here. Never mixes two
 * students.
 *
 * THE CLOUD NEVER GOES BACKWARDS: every write is mergeProgress(what the cloud
 * already has, this device) — so a reset device, an old tab or a bug can only
 * ever add to a student's cloud save, never shrink it.
 *
 * Nothing here blocks play: no cloud, a slow network or a missing Firestore
 * rule just means the game keeps saving on the device as before.
 */
import { create } from "zustand";

import { useProgress } from "../progress/store.js";
import { useResults, RESULTS_KEY } from "../results/resultStore.js";
import { readProgressDoc, writeProgressDoc, readMyAchievements } from "./firebaseClient.js";
import {
  collectProgress, mergeProgress, cleanPayload, backfillFromAchievements, syncPlan,
  progressDoc, changeKind, hasProgress, docBytes, SYNCED_KEY, isNumericKey,
} from "./progressMerge.js";

export const OWNER_KEY = "mma-progress-owner";
export const STASH_PREFIX = "mma-local-save:";
export const RESULTS_STASH_PREFIX = "mma-local-results:";
export const STASHED_RESULTS_MAX = 40;
export const TICK_MS = 2000;
export const MAJOR_GAP_MS = 8000;
export const MINOR_GAP_MS = 30000;
export const LOAD_TIMEOUT_MS = 6000;
export const WRITE_TIMEOUT_MS = 15000;
export const RETRY_MS = [20000, 60000, 180000];
export const MAX_DOC_BYTES = 900 * 1024; // Firestore's limit is 1 MiB

/**
 * For the HUD: off (not signed in) · loading · synced · saving · offline (it
 * will try again) · denied (the Firestore rule isn't in place yet).
 */
export const useProgressSync = create(() => ({ status: "off", savedAt: 0, error: null, studentCode: null }));

// The Firebase calls (the headless checks swap in a fake).
const REAL_API = { read: readProgressDoc, write: writeProgressDoc, achievements: readMyAchievements };
let api = REAL_API;
export function __setProgressApi(fake) { api = fake ? { ...REAL_API, ...fake } : REAL_API; }

let _student = null;    // who we're saving for
let _ready = false;     // the cloud copy was read — saving is allowed
let _cloud = null;      // what the cloud holds (last read or written payload)
let _sentAt = 0;
let _saving = null;
let _gen = 0;           // bumps on every sign-in / sign-out (stale replies are dropped)
let _retry = null;
let _retryN = 0;
let _timer = null;

// ---------------------------------------------------------------- storage --
const store = () => { try { return globalThis.localStorage || null; } catch { return null; } };
const lsGet = (k) => { try { return store()?.getItem(k) ?? null; } catch { return null; } };
const lsSet = (k, v) => { try { store()?.setItem(k, v); return true; } catch { return false; } };
const lsDel = (k) => { try { store()?.removeItem(k); } catch { /* ignore */ } };

export function progressOwner() { return lsGet(OWNER_KEY) || null; }

function localPayload() {
  return collectProgress(useProgress.getState(), store());
}

function syncedKeysOnDevice() {
  const s = store();
  const keys = [];
  if (!s) return keys;
  try {
    for (let i = 0; i < (s.length || 0); i++) {
      const k = s.key(i);
      if (k && SYNCED_KEY.test(k)) keys.push(k);
    }
  } catch { /* ignore */ }
  return keys;
}

/** Put a payload in place: its keys in localStorage, its progress in the store. */
function applyPayload(payload, { replace = false } = {}) {
  const p = payload || { progress: {}, bests: {}, flags: {} };
  if (replace) syncedKeysOnDevice().forEach(lsDel);
  for (const [k, v] of Object.entries(p.bests || {})) {
    if (SYNCED_KEY.test(k) && isNumericKey(k)) lsSet(k, String(v));
  }
  for (const k of Object.keys(p.flags || {})) {
    if (SYNCED_KEY.test(k) && !isNumericKey(k)) lsSet(k, "1");
  }
  useProgress.getState().applyCloudProgress(p.progress || {}, { replace });
}

/** Put this device's save aside for `owner` (a shared device, another student signing in). */
function stashLocal(owner) {
  if (!owner) return;
  const p = localPayload();
  if (hasProgress(p) || Object.keys(p.flags || {}).length) lsSet(STASH_PREFIX + owner, JSON.stringify(p));
  try {
    const results = (useResults.getState().results || []).slice(0, STASHED_RESULTS_MAX);
    if (results.length) lsSet(RESULTS_STASH_PREFIX + owner, JSON.stringify(results));
  } catch { /* results are a nicety */ }
}

/** The save (and results) a student left on this device, removed from the stash. */
function takeStash(code) {
  let payload = null;
  let results = [];
  try { payload = cleanPayload(JSON.parse(lsGet(STASH_PREFIX + code) || "null")); } catch { payload = null; }
  try { results = JSON.parse(lsGet(RESULTS_STASH_PREFIX + code) || "[]"); } catch { results = []; }
  lsDel(STASH_PREFIX + code);
  lsDel(RESULTS_STASH_PREFIX + code);
  return { payload, results: Array.isArray(results) ? results : [] };
}

// ------------------------------------------------------------------- misc --
function withTimeout(promise, ms) {
  let t;
  return Promise.race([
    promise,
    new Promise((_, reject) => { t = setTimeout(() => reject(Object.assign(new Error("The cloud took too long."), { code: "timeout" })), ms); }),
  ]).finally(() => clearTimeout(t));
}

function isDenied(err) {
  const code = String((err && err.code) || "");
  return code === "permission-denied" || code === "firestore/permission-denied" || /insufficient permissions/i.test(String((err && err.message) || ""));
}

const errText = (err) => String((err && err.message) || err || "");

function setStatus(status, extra = {}) {
  useProgressSync.setState({ status, ...extra });
}

function clearRetry() {
  if (_retry) clearTimeout(_retry);
  _retry = null;
}

function scheduleRetry(student) {
  clearRetry();
  if (_retryN >= RETRY_MS.length) return;
  const wait = RETRY_MS[_retryN++];
  const gen = _gen;
  _retry = setTimeout(() => {
    _retry = null;
    if (gen === _gen && _student === student && !_ready) loadCloudProgress(student, { retry: true });
  }, wait);
}

// ------------------------------------------------------------------- load --
/**
 * Sign-in, step 1 (synchronous): start a load for `student`. Another
 * student's save on this device is put aside at once — even if the cloud
 * can't be reached, two students never share a save. Returns { gen, plan }.
 */
export function beginLoad(student, { retry = false } = {}) {
  const code = student.studentCode;
  const gen = ++_gen;
  if (!retry) _retryN = 0;
  clearRetry();
  _student = student;
  _ready = false;
  _cloud = null;
  setStatus("loading", { error: null, studentCode: code });
  const owner = progressOwner();
  const plan = syncPlan(owner, code);
  if (plan === "replace") {
    stashLocal(owner);
    const left = takeStash(code);
    applyPayload(left.payload, { replace: true });
    try { useResults.getState().replaceResults(left.results); } catch { /* a nicety */ }
  }
  lsSet(OWNER_KEY, code);
  return { gen, plan };
}

/**
 * Sign-in, step 2 (synchronous): the cloud answered. `cloud` = the cleaned
 * cloud payload, or what the old achievements rebuilt, or null. The best of
 * both goes in place and saving is switched on.
 */
export function finishLoad(gen, cloud, { created = false } = {}) {
  if (gen !== _gen) return false;
  const merged = mergeProgress(localPayload(), cloud);
  if (merged) applyPayload(merged, { replace: false });
  _ready = true;
  _retryN = 0;
  _cloud = created ? null : cloud;
  return true;
}

/** Sign-in, step 2 when the cloud couldn't be read. */
function failLoad(gen, student, err) {
  if (gen !== _gen) return;
  const denied = isDenied(err);
  setStatus(denied ? "denied" : "offline", { error: errText(err) });
  if (!denied) scheduleRetry(student);
}

/**
 * Sign-in: bring this student's cloud save onto the device. Resolves
 * { ok, plan, created, reason } — never throws.
 */
export async function loadCloudProgress(student, { timeoutMs = LOAD_TIMEOUT_MS, retry = false } = {}) {
  if (!student || !student.studentCode) return { ok: false, reason: "no-student" };
  const code = student.studentCode;
  const { gen, plan } = beginLoad(student, { retry });
  let cloud = null;
  let created = false;
  try {
    const doc = await withTimeout(api.read(code), timeoutMs);
    if (gen !== _gen) return { ok: false, reason: "superseded", plan };
    if (doc) {
      cloud = cleanPayload(doc);
    } else {
      // First time: rebuild what the old achievement records can tell us.
      created = true;
      try {
        cloud = backfillFromAchievements(await withTimeout(api.achievements(code), timeoutMs));
      } catch { cloud = null; /* the rebuild is a bonus */ }
    }
  } catch (err) {
    failLoad(gen, student, err);
    return { ok: false, reason: isDenied(err) ? "denied" : "offline", plan };
  }
  if (!finishLoad(gen, cloud, { created })) return { ok: false, reason: "superseded", plan };
  await saveNow("load"); // send the merged save back if the cloud is missing anything
  return { ok: true, plan, created };
}

// ------------------------------------------------------------------- save --
/**
 * What a save would send right now: { payload, doc } — or null when the
 * cloud already has everything. Never backwards: the cloud's copy + this
 * device's, merged.
 */
export function prepareSave() {
  if (!_ready || !_student) return null;
  const payload = mergeProgress(_cloud, localPayload());
  if (_cloud && changeKind(_cloud, payload) === "none") return null;
  return { payload, doc: progressDoc(payload, _student) };
}

/** The cloud accepted `payload`. */
export function confirmSaved(payload, gen = _gen) {
  if (gen !== _gen) return;
  _cloud = payload;
  _sentAt = Date.now();
  setStatus("synced", { savedAt: Date.now(), error: null });
}

/** Write the student's save now (if there's anything new). Never throws. */
export async function saveNow(reason = "auto") {
  if (!_ready || !_student) return { ok: false, reason: "not-ready" };
  if (_saving) return _saving;
  const student = _student;
  const gen = _gen;
  const next = prepareSave();
  if (!next) {
    _sentAt = Date.now();
    if (useProgressSync.getState().status !== "synced") setStatus("synced", { savedAt: Date.now(), error: null });
    return { ok: true, skipped: true };
  }
  if (docBytes(next.doc) > MAX_DOC_BYTES) {
    setStatus("offline", { error: "The save is too big to send." });
    _sentAt = Date.now();
    return { ok: false, reason: "too-big" };
  }
  setStatus("saving");
  _saving = (async () => {
    try {
      await withTimeout(api.write(student.studentCode, next.doc), WRITE_TIMEOUT_MS);
      confirmSaved(next.payload, gen);
      return { ok: true, reason };
    } catch (err) {
      const denied = isDenied(err);
      if (gen === _gen) {
        _sentAt = Date.now(); // wait a gap before trying again
        if (denied) _ready = false; // the rule isn't there — stop trying
        setStatus(denied ? "denied" : "offline", { error: errText(err) });
      }
      return { ok: false, reason: denied ? "denied" : "offline" };
    } finally {
      _saving = null;
    }
  })();
  return _saving;
}

/** Save now if anything is waiting (sign-out, leaving the page). */
export function flushProgress() {
  if (!_ready || !_student) return Promise.resolve({ ok: false, reason: "not-ready" });
  return saveNow("flush");
}

/**
 * Is a save due? "major" (a milestone, once MAJOR_GAP_MS has passed since the
 * last save), "minor" (XP / coins / skills, after MINOR_GAP_MS) or null.
 */
export function autosaveDue(now = Date.now()) {
  if (!_ready || !_student || _saving) return null;
  const kind = changeKind(_cloud, mergeProgress(_cloud, localPayload()));
  if (kind === "none") return null;
  const gap = now - _sentAt;
  if ((kind === "major" && gap >= MAJOR_GAP_MS) || (kind === "minor" && gap >= MINOR_GAP_MS)) return kind;
  return null;
}

/** One autosave beat. */
export function autosaveTick(now = Date.now()) {
  const kind = autosaveDue(now);
  if (kind) saveNow(kind);
  return kind;
}

/** Start the autosave loop (once, from App). Safe to call again. */
export function startProgressAutosave() {
  if (_timer || typeof setInterval !== "function") return;
  _timer = setInterval(() => { try { autosaveTick(); } catch { /* never break the game */ } }, TICK_MS);
  if (typeof window !== "undefined" && window.addEventListener) {
    window.addEventListener("pagehide", () => { flushProgress(); });
  }
  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushProgress();
    });
  }
}

/** Sign-out: send anything waiting, then stop saving for this student. */
export async function stopProgressSync({ flush = true } = {}) {
  if (flush) {
    try { await withTimeout(flushProgress(), 5000); } catch { /* best effort */ }
  }
  _gen++;
  clearRetry();
  _student = null;
  _ready = false;
  _cloud = null;
  setStatus("off", { error: null, studentCode: null });
}

/** The device forgets whose save it holds (the title screen's reset). */
export function forgetProgressOwner() {
  lsDel(OWNER_KEY);
}

/** For the checks: what the sync thinks right now (+ set when the last save was). */
export function __progressSyncState() {
  return { student: _student, ready: _ready, cloud: _cloud, sentAt: _sentAt, saving: Boolean(_saving), gen: _gen };
}
export function __setSentAt(t) { _sentAt = t; }

/** For the checks: stop without flushing and forget everything (sync). */
export function __resetProgressSync() {
  _gen++;
  clearRetry();
  _student = null; _ready = false; _cloud = null; _sentAt = 0; _saving = null;
  setStatus("off", { error: null, studentCode: null });
}
