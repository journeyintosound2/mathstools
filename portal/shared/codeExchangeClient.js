/**
 * MMT Platform — secure code-exchange client (Phase 4A). The ONLY auth path for
 * the portals. There is NO anonymous sign-in and NO client read of
 * `students/{code}` / `teachers/{code}` before login: a Cloud Function validates
 * the code server-side and mints a custom token, and we sign in with it. After
 * sign-in, claim-based Firestore rules scope every read/write to the owner.
 *
 * Loaded as a browser ES module by the portal pages (imports the Firebase SDK
 * straight from gstatic — no bundler needed).
 */
import { FIREBASE_CONFIG, FUNCTIONS_REGION, EXCHANGE_FUNCTIONS } from "./firebaseConfig.js";

// Firebase JS SDK 10.12.5 from gstatic. Static imports need literal URLs; keep
// this version in sync with firebaseConfig.FIREBASE_SDK_VERSION.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithCustomToken, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

/*
 * ONE SIGN-IN PER SIDE (2026-10-29). Firebase keeps one signed-in user per app
 * NAME per browser, shared by every tab. Teacher pages, student pages and the
 * quizzes used to share the default app, so signing in as a student anywhere
 * (student portal, a quiz) silently turned an open Teacher Platform tab into
 * that student: what was on screen stayed, but its next read was refused
 * ("Missing or insufficient permissions"). Each side now has its own named app
 * and its own cached profile, so they can't knock each other out. The quizzes
 * keep the default app. (The admin console already used in-memory auth.)
 */
const SESSION_BASE = "mmt-portal-session";
const APP_NAMES = { teacher: "mmt-teacher", student: "mmt-student" };
function sideFromPath() {
  const p = (typeof location !== "undefined" && location.pathname) || "";
  if (p.startsWith("/portal/teacher") || p.startsWith("/mmt-screen")) return "teacher";
  if (p.startsWith("/portal/student")) return "student";
  return "";
}
let SESSION_KEY = SESSION_BASE;

let _app = null, _auth = null, _db = null, _functions = null;
let _session = null; // { role, profile }

/**
 * Initialise Firebase handles. No sign-in here. Idempotent — the first call
 * fixes the side: "teacher" | "student" (or inferred from the page's path;
 * anything else gets the shared default app, as before).
 */
export function initPortal(side) {
  if (_app) return { app: _app, auth: _auth, db: _db, functions: _functions };
  side = APP_NAMES[side] ? side : sideFromPath();
  if (APP_NAMES[side]) { _app = initializeApp(FIREBASE_CONFIG, APP_NAMES[side]); SESSION_KEY = SESSION_BASE + "-" + side; }
  else _app = initializeApp(FIREBASE_CONFIG);
  _auth = getAuth(_app);
  _db = getFirestore(_app);
  _functions = getFunctions(_app, FUNCTIONS_REGION);
  // Hydrate the cached profile (UI only — real access still needs a live token).
  try { const s = localStorage.getItem(SESSION_KEY); if (s) _session = JSON.parse(s); } catch { /* noop */ }
  return { app: _app, auth: _auth, db: _db, functions: _functions };
}

export function getDb() { return _db; }
export function getAuthInstance() { return _auth; }
export function getSession() { return _session; }
export function getProfile() { return _session ? _session.profile : null; }
export function getRole() { return _session ? _session.role : null; }

function persist(role, profile) {
  _session = { role, profile };
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(_session)); } catch { /* noop */ }
}

function friendlyError(err) {
  const m = String((err && err.message) || err || "");
  if (/not found/i.test(m)) return "That code was not found. Check it and try again.";
  if (/not active|inactive/i.test(m)) return "That code is not active. Please contact your teacher/admin.";
  if (/pin/i.test(m)) return m; // PIN messages are already friendly
  if (/internal|unavailable|network/i.test(m)) return "Sign-in service is unavailable right now. Please try again shortly.";
  return m || "Could not sign in. Please try again.";
}

/**
 * Secure student sign-in. Validates the code (+ optional PIN) via the Cloud
 * Function, signs in with the returned custom token, caches the safe profile.
 * Returns { ok, profile?, error? }.
 */
export async function loginStudent(code, pin) {
  initPortal();
  try {
    const call = httpsCallable(_functions, EXCHANGE_FUNCTIONS.student);
    const res = await call({ studentCode: code, pin: pin || undefined });
    const data = res.data || {};
    if (!data.token) return { ok: false, error: "Sign-in failed. Please try again." };
    await signInWithCustomToken(_auth, data.token);
    persist("student", data.profile);
    return { ok: true, profile: data.profile, claims: data.claims };
  } catch (err) { return { ok: false, error: friendlyError(err) }; }
}

/** Secure teacher sign-in (mirror of loginStudent). */
export async function loginTeacher(code) {
  initPortal();
  try {
    const call = httpsCallable(_functions, EXCHANGE_FUNCTIONS.teacher);
    const res = await call({ teacherCode: code });
    const data = res.data || {};
    if (!data.token) return { ok: false, error: "Sign-in failed. Please try again." };
    await signInWithCustomToken(_auth, data.token);
    persist("teacher", data.profile);
    return { ok: true, profile: data.profile, claims: data.claims };
  } catch (err) { return { ok: false, error: friendlyError(err) }; }
}

/** Clear the session + sign out. Never deletes any data. */
export async function logout() {
  _session = null;
  try { localStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
  try { if (_auth) await signOut(_auth); } catch { /* noop */ }
}

/**
 * Create a student (teacher-only). Calls the secure createStudentForTeacher
 * Cloud Function, which authorises via the signed-in teacher's claim and writes
 * the student server-side (stamped with the teacher's own teacherCode). Returns
 * the new safe student { studentCode, name, className, ... } or throws.
 */
export async function createStudent(payload) {
  initPortal();
  const call = httpsCallable(_functions, "createStudentForTeacher");
  const res = await call(payload || {});
  return res.data;
}

/**
 * Edit one of the teacher's own students (name and/or class). Calls the secure
 * updateStudentForTeacher Cloud Function, which checks the student belongs to the
 * signed-in teacher. `payload` = { studentCode, firstName, surname, className }.
 */
export async function updateStudent(payload) {
  initPortal();
  const call = httpsCallable(_functions, "updateStudentForTeacher");
  const res = await call(payload || {});
  return res.data;
}

/**
 * Archive ("remove"), restore or move several of the teacher's own students.
 * Calls manageStudentsForTeacher. Archiving stops the code signing in and hides
 * the student from the teacher's lists; their results are kept. Returns
 * { action, updated:[codes], skipped:[codes] } or throws.
 */
export async function manageStudents(studentCodes, action, className) {
  initPortal();
  const call = httpsCallable(_functions, "manageStudentsForTeacher");
  const res = await call({ studentCodes, action, ...(className ? { className } : {}) });
  return res.data;
}

/**
 * Set an Adventure task (teacher-only). Calls the secure createAdventureTask
 * Cloud Function, which authorises via the signed-in teacher's claim and writes
 * the assignment server-side (stamped with the teacher's own teacherCode).
 * `payload` carries { npcId, className, stages, selectedTopics, selectedSkills,
 * difficultyRange, requiredQuestions, adaptiveOn, dueAt, title, description }.
 * Returns the new safe assignment or throws.
 */
export async function createAdventureTask(payload) {
  initPortal();
  const call = httpsCallable(_functions, "createAdventureTask");
  const res = await call(payload || {});
  return res.data;
}

/**
 * Edit an Adventure task the teacher owns. Calls the secure updateAdventureTask
 * Cloud Function with the same payload shape as createAdventureTask plus an
 * assignmentId. Returns the updated assignment or throws.
 */
export async function updateAdventureTask(payload) {
  initPortal();
  const call = httpsCallable(_functions, "updateAdventureTask");
  const res = await call(payload || {});
  return res.data;
}

/**
 * Enable/disable (soft-remove) an Adventure task the teacher owns. Calls the
 * secure setAdventureTaskActive Cloud Function. `active:false` removes it for
 * students immediately. Returns { assignmentId, active } or throws.
 */
export async function setAdventureTaskActive(assignmentId, active) {
  initPortal();
  const call = httpsCallable(_functions, "setAdventureTaskActive");
  const res = await call({ assignmentId, active: active === true });
  return res.data;
}

/**
 * Create (or reactivate) a class the teacher owns. Calls the secure createClass
 * Cloud Function, which authorises via the signed-in teacher's claim and writes
 * the class server-side (stamped with the teacher's own teacherCode). Classes are
 * first-class objects so an empty class persists across reloads. Returns
 * { classId, name, teacherCode, active, existed } or throws.
 */
export async function createClass(name) {
  initPortal();
  const call = httpsCallable(_functions, "createClass");
  const res = await call({ name });
  return res.data;
}

/**
 * Enable/disable (soft-remove) a class the teacher owns. Calls the secure
 * setClassActive Cloud Function. `active:false` hides the class from the pickers
 * without touching any students in it. Returns { classId, active } or throws.
 */
export async function setClassActive(classId, active) {
  initPortal();
  const call = httpsCallable(_functions, "setClassActive");
  const res = await call({ classId, active: active === true });
  return res.data;
}

/**
 * Set one or more online-quiz "dashboard tasks" for a class (teacher-only).
 * Calls the secure createDashboardTask Cloud Function. `payload` carries
 * { className, quizzes:[{toolId,title,launchUrl}], dueAt }. One task doc is
 * created per quiz. Returns { created:[...] } or throws.
 */
export async function createDashboardTask(payload) {
  initPortal();
  const call = httpsCallable(_functions, "createDashboardTask");
  const res = await call(payload || {});
  return res.data;
}

/** Change a dashboard task's due date (teacher-only). Returns { assignmentId, dueAt }. */
export async function updateDashboardTask(assignmentId, dueAt) {
  initPortal();
  const call = httpsCallable(_functions, "updateDashboardTask");
  const res = await call({ assignmentId, dueAt });
  return res.data;
}

/**
 * Enable/disable (soft-remove) a dashboard task the teacher owns. `active:false`
 * removes it from the students' pop-up immediately. Returns { assignmentId, active }.
 */
export async function setDashboardTaskActive(assignmentId, active) {
  initPortal();
  const call = httpsCallable(_functions, "setDashboardTaskActive");
  const res = await call({ assignmentId, active: active === true });
  return res.data;
}

/**
 * Update the signed-in teacher's OWN profile (2026-10-24). Calls the secure
 * updateMyTeacherProfile Cloud Function, which takes the teacher code from the
 * verified claim (never from this payload) and writes teachers/{code}
 * server-side. `payload` = { teacherName, email, school, position, emailUpdates }.
 * Returns { profile, studentsUpdated } and refreshes the cached session profile.
 */
export async function updateTeacherProfile(payload) {
  initPortal();
  const call = httpsCallable(_functions, "updateMyTeacherProfile");
  const res = await call(payload || {});
  const data = res.data || {};
  if (data.profile && _session && _session.role === "teacher") persist("teacher", { ..._session.profile, ...data.profile });
  return data;
}

/**
 * Public "request teacher access" form (2026-10-24). No sign-in. Calls the
 * requestTeacherAccess Cloud Function, which validates, rate-limits, stores a
 * pending request for the admin and emails them. Returns { ok:true } or throws.
 */
export async function requestTeacherAccess(payload) {
  initPortal();
  const call = httpsCallable(_functions, "requestTeacherAccess");
  const res = await call(payload || {});
  return res.data || { ok: true };
}

/** Merge fresh fields into the cached profile (UI cache only). */
export function updateCachedProfile(fields) {
  if (!_session) return;
  persist(_session.role, { ..._session.profile, ...(fields || {}) });
}

/** Subscribe to auth restoration (custom-token sessions persist by default). */
export function onAuth(cb) { initPortal(); return onAuthStateChanged(_auth, cb); }

export function normaliseCode(code) {
  return String(code || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}
