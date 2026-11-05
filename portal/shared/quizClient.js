/**
 * MMT SHARED QUIZ CLIENT (Phase 4A.1) — the ONE module every Firebase quiz/tool
 * imports for secure sign-in + saving. It shares `firebaseConfig.js` with the
 * Student/Teacher platforms (single source of truth), so the whole site "talks
 * to itself" through the same config, collections and code-exchange functions.
 *
 * Quizzes import this from the SITE ROOT so it works at any folder depth:
 *   import { MMTQuiz } from "/portal/shared/quizClient.js";
 *
 * Flow: student enters code → exchangeStudentCode (server validates) →
 * signInWithCustomToken → saveAchievement writes a compact `achievements` record
 * AS that signed-in student (claim-rule compatible). Skip/demo stays local and
 * never saves. NEVER stores typed answers.
 */
import { FIREBASE_CONFIG, FUNCTIONS_REGION, EXCHANGE_FUNCTIONS, COLLECTIONS } from "./firebaseConfig.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

let _app = null, _auth = null, _db = null, _functions = null;
let _mode = "pending";          // pending | registered | skip
let _student = null;            // safe profile from the exchange

export function normaliseCode(code) {
  return String(code || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

/** Initialise handles only — NO anonymous sign-in. Idempotent. */
export function init() {
  if (_app) return;
  _app = initializeApp(FIREBASE_CONFIG);
  _auth = getAuth(_app);
  _db = getFirestore(_app);
  _functions = getFunctions(_app, FUNCTIONS_REGION);
}

export function getMode() { return _mode; }
export function getStudent() { return _student; }

/**
 * Secure student sign-in for a quiz. Validates code (+ optional PIN) server-side
 * and signs in with the custom token. Returns { ok, profile?, error? }.
 */
export async function signIn(code, pin) {
  init();
  try {
    const call = httpsCallable(_functions, EXCHANGE_FUNCTIONS.student);
    const res = await call({ studentCode: normaliseCode(code), pin: pin || undefined });
    const data = res.data || {};
    if (!data.token) return { ok: false, error: "Sign-in failed. Please try again." };
    await signInWithCustomToken(_auth, data.token);
    _student = data.profile; _mode = "registered";
    return { ok: true, profile: _student };
  } catch (err) {
    const m = String((err && err.message) || err || "");
    if (/not found/i.test(m)) return { ok: false, error: "Student code not found. Check it with your teacher." };
    if (/not active|inactive/i.test(m)) return { ok: false, error: "This student code is not active." };
    if (/pin/i.test(m)) return { ok: false, error: m };
    return { ok: false, error: m || "Could not validate that code." };
  }
}

/** Explicit demo/skip — local only, never saves. */
export function skipDemo() { _mode = "skip"; _student = null; }

/**
 * Save a compact achievement AS the signed-in student. No-ops in demo/skip.
 * `payload` carries the quiz's own fields (tool/topic/score/total/xp/etc.).
 * studentCode/teacherCode/etc. come from the signed-in profile (claim-safe).
 */
export async function saveAchievement(payload = {}) {
  if (_mode !== "registered" || !_student) return { skipped: true, reason: "not_registered" };
  const total = Number(payload.total || 0), score = Number(payload.score || 0);
  const percent = payload.percent != null ? Number(payload.percent) : (total ? Math.round((score / total) * 100) : 0);
  const record = {
    studentCode: _student.studentCode,
    studentName: _student.name || "",
    firstName: _student.firstName || "",
    surname: _student.surname || "",
    className: _student.className || "",
    teacherCode: _student.teacherCode || "",
    teacherName: _student.teacherName || "",
    school: _student.school || "",
    tool: payload.tool || "MMT Quiz",
    topic: payload.topic || "",
    level: payload.level || "",
    levelKey: payload.levelKey || "",
    score, total, percent,
    xpEarned: Number(payload.xpEarned || 0),
    baseXP: Number(payload.baseXP || 0),
    xpMultiplier: Number(payload.xpMultiplier || 1),
    masteryTopic: payload.masteryTopic || payload.topic || "",
    masteryScore: percent,
    platformVersion: payload.platformVersion || "mmt-platform-template-v1",
    types: payload.types || [],
    assignmentMode: !!payload.assignmentMode,
    certificateText: payload.certificateText || "",
    createdAt: serverTimestamp(),
    createdAtClient: new Date().toISOString(),
  };
  // Shape of the attempt (early submit) and the task link it came from. These were
  // dropped before 2026-11-05, so a part-finished 3/3 looked like a finished 100%.
  // Only these known, answer-free fields are passed through.
  if (payload.completion === "partial" || payload.completion === "complete") record.completion = payload.completion;
  for (const k of ["quizLength", "attempted", "coverage"]) if (Number.isFinite(Number(payload[k])) && payload[k] !== "" && payload[k] != null) record[k] = Number(payload[k]);
  if (typeof payload.countsToMastery === "boolean") record.countsToMastery = payload.countsToMastery;
  if (payload.assignmentId != null) record.assignmentId = String(payload.assignmentId).slice(0, 80);
  await addDoc(collection(_db, COLLECTIONS.achievements), record);
  return { saved: true };
}

/**
 * Low-level exchange for quizzes that keep their OWN Firebase app + save code.
 * Pass that quiz's own modular `functions` (getFunctions(app,"us-central1")) and
 * `auth` (getAuth(app)); this validates the code server-side and signs THAT app
 * in with the custom token, so the quiz's existing addDoc runs as the student.
 * Returns the safe profile, or throws (message is shown to the student).
 */
export async function exchangeOnApp({ functions, auth }, code, pin) {
  const call = httpsCallable(functions, EXCHANGE_FUNCTIONS.student);
  const res = await call({ studentCode: normaliseCode(code), pin: pin || undefined });
  const data = res.data || {};
  if (!data.token) throw new Error("Sign-in failed. Please try again.");
  await signInWithCustomToken(auth, data.token);
  return data.profile;
}

// Convenience namespace for non-module callers wired via window.
export const MMTQuiz = { init, signIn, skipDemo, saveAchievement, getMode, getStudent, normaliseCode };
