/**
 * Mills Maths Tools — Cloud Functions (Phase 3D): SECURE CODE EXCHANGE.
 *
 * NOT deployed from this repo automatically. Deploy manually:
 *   cd functions && npm install && firebase deploy --only functions
 *
 * Two callable functions validate a typed code SERVER-SIDE with the Admin SDK
 * (which bypasses Firestore rules) and mint a Firebase Auth CUSTOM TOKEN with
 * small role claims. The client signs in with that token; claim-based Firestore
 * rules (firestore.phase3d.claims.rules) then scope all reads/writes.
 *
 * The validation/claim/profile logic mirrors the pure module
 * src/cloud/codeExchange.js (kept in sync; that module is unit-tested headlessly).
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// EXACT same normalisation as the rest of the MMT ecosystem.
function normaliseCode(code) {
  return String(code || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}
function fullName(d) {
  return d.name || [d.firstName, d.surname].filter(Boolean).join(" ") || "Student";
}

/**
 * exchangeStudentCode({ studentCode, pin? }) →
 *   { token, profile, claims }
 * Rejects missing / inactive students and bad PINs. Custom-token uid is
 * `student:<CODE>` with role claims.
 */
exports.exchangeStudentCode = onCall(async (request) => {
  const code = normaliseCode(request.data && request.data.studentCode);
  if (!code) throw new HttpsError("invalid-argument", "Enter your student code.");

  const snap = await db.collection("students").doc(code).get();
  if (!snap.exists) throw new HttpsError("not-found", "Student code not found.");
  const doc = { studentCode: code, ...snap.data() };

  if (doc.active === false) throw new HttpsError("permission-denied", "This student code is not active.");
  const requiredPin = doc.pin || doc.studentPin || doc.dashboardPin;
  if (requiredPin && String((request.data && request.data.pin) || "") !== String(requiredPin)) {
    throw new HttpsError("permission-denied", "Incorrect PIN. Check it with your teacher.");
  }

  const claims = {
    role: "student",
    studentCode: code,
    teacherCode: doc.teacherCode || "",
    className: doc.className || "",
    school: doc.school || "",
  };
  const token = await admin.auth().createCustomToken(`student:${code}`, claims);
  const profile = {
    studentCode: code,
    firstName: doc.firstName || "",
    surname: doc.surname || "",
    name: fullName(doc),
    className: doc.className || "",
    teacherCode: doc.teacherCode || "",
    teacherName: doc.teacherName || doc.teacher || "",
    school: doc.school || "",
    // The student's saved explorer avatar (W3-B), if they've designed one. The
    // game applies this on sign-in so their character follows them across devices.
    avatar: sanitiseAvatar(doc.avatar),
  };
  return { token, profile, claims };
});

/**
 * Whitelist + type-clamp the customisable player avatar (W3-B). Only known keys
 * with the expected primitive types survive; anything else is dropped. Returns
 * null when there's nothing usable (so a brand-new student has no saved avatar).
 */
function sanitiseAvatar(a) {
  if (!a || typeof a !== "object") return null;
  const hex = (v, fb) => (typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : fb);
  const pick = (v, allowed, fb) => (allowed.includes(v) ? v : fb);
  const out = {
    color: hex(a.color, "#3a86ff"),
    skin: hex(a.skin, "#f1c27d"),
    hair: hex(a.hair, "#3b2a1a"),
    hairStyle: pick(a.hairStyle, ["none", "short", "long", "bun", "spiky"], "short"),
    hat: pick(a.hat, ["none", "cap", "beanie"], "none"),
    hatColour: hex(a.hatColour, "#e63946"),
    glasses: Boolean(a.glasses),
  };
  return out;
}

/**
 * setStudentAvatar({ avatar }) → { ok, avatar }
 *
 * Caller MUST be signed in as a student (role:"student" claim from
 * exchangeStudentCode). The avatar is written to the CALLER'S OWN
 * students/{code} doc (code taken from the verified claim, never client input),
 * so a student can only change their own character. Admin SDK write (bypasses
 * client-write rules); no typed answers or PII are stored — just cosmetic choices.
 */
exports.setStudentAvatar = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.role !== "student" || !auth.token.studentCode) {
    throw new HttpsError("permission-denied", "Sign in with your student code first.");
  }
  const code = normaliseCode(auth.token.studentCode);
  const avatar = sanitiseAvatar(request.data && request.data.avatar);
  if (!avatar) throw new HttpsError("invalid-argument", "No avatar to save.");
  await db.collection("students").doc(code).set(
    { avatar, avatarUpdatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
  return { ok: true, avatar };
});

/**
 * exchangeTeacherCode({ teacherCode }) → { token, profile, claims }
 * Rejects missing / inactive teachers. uid `teacher:<CODE>` with role claims.
 */
exports.exchangeTeacherCode = onCall(async (request) => {
  const code = normaliseCode(request.data && request.data.teacherCode);
  if (!code) throw new HttpsError("invalid-argument", "Enter your teacher code.");

  const snap = await db.collection("teachers").doc(code).get();
  if (!snap.exists) throw new HttpsError("not-found", "Teacher code not found.");
  const doc = { teacherCode: code, ...snap.data() };

  if (doc.active === false) throw new HttpsError("permission-denied", "This teacher code is not active.");

  const claims = { role: "teacher", teacherCode: code, school: doc.school || "" };
  const token = await admin.auth().createCustomToken(`teacher:${code}`, claims);
  const profile = safeTeacherProfile(doc);

  // Last sign-in, for the admin console's teacher list (2026-10-24). Best
  // effort: a failed stamp must never stop a teacher signing in.
  try {
    await snap.ref.update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      loginCount: admin.firestore.FieldValue.increment(1),
    });
  } catch (e) { /* best effort */ }

  return { token, profile, claims };
});

/**
 * createStudentForTeacher({ firstName, surname, className }) → safe student.
 *
 * Caller MUST be signed in as a teacher (role:"teacher" claim from
 * exchangeTeacherCode). The new student is stamped with the CALLER'S OWN
 * teacherCode (from the verified claim, never client input), so a teacher can
 * only create students in their own classes. Generates a unique student code and
 * writes server-side with the Admin SDK (bypasses Firestore client-write rules).
 * "Creating a class" = just supplying a new className.
 */
const STUDENT_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1/L

function randomStudentCode() {
  let c = "";
  for (let i = 0; i < 6; i++) c += STUDENT_CODE_ALPHABET[Math.floor(Math.random() * STUDENT_CODE_ALPHABET.length)];
  return c;
}

async function generateUniqueStudentCode() {
  for (let i = 0; i < 40; i++) {
    const code = randomStudentCode();
    const snap = await db.collection("students").doc(code).get();
    if (!snap.exists) return code;
  }
  throw new HttpsError("internal", "Could not generate a unique code. Please try again.");
}

exports.createStudentForTeacher = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.role !== "teacher" || !auth.token.teacherCode) {
    throw new HttpsError("permission-denied", "Sign in with your teacher code first.");
  }
  const teacherCode = normaliseCode(auth.token.teacherCode);
  const firstName = String((request.data && request.data.firstName) || "").trim();
  const surname = String((request.data && request.data.surname) || "").trim();
  const className = String((request.data && request.data.className) || "").trim().toUpperCase();
  const name = [firstName, surname].filter(Boolean).join(" ");
  if (!name) throw new HttpsError("invalid-argument", "Enter the student's name.");
  if (!className) throw new HttpsError("invalid-argument", "Enter a class name.");

  // Stamp teacherName / school from the teacher's own record (best effort).
  let teacherName = "", school = "";
  try {
    const t = await db.collection("teachers").doc(teacherCode).get();
    if (t.exists) { const d = t.data() || {}; teacherName = d.teacherName || ""; school = d.school || ""; }
  } catch (e) { /* best effort */ }

  const studentCode = await generateUniqueStudentCode();
  await db.collection("students").doc(studentCode).set({
    studentCode, firstName, surname, name, className,
    teacherCode, teacherName, school,
    active: true,
    createdBy: "teacher-portal",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { studentCode, firstName, surname, name, className, teacherCode, teacherName, school, active: true };
});

/**
 * createAdventureTask(payload) → safe assignment.
 *
 * Caller MUST be signed in as a teacher (role:"teacher" claim from
 * exchangeTeacherCode). The assignment is stamped with the CALLER'S OWN
 * teacherCode (from the verified claim, never client input), so a teacher can
 * only set tasks for their own classes. Writes the curriculum "mission" slice +
 * an npcId (who delivers it) + the target className to `adventureAssignments`,
 * server-side with the Admin SDK (bypasses client-write rules).
 *
 * Structural validation only here (types/ranges/npcId/className). Deep curriculum
 * validity (real stage/topic/skill ids) is enforced where the curriculum registry
 * lives: the portal builds the form from a manifest, and the game runs the
 * assignment through normaliseMission/validateMission on read.
 */
const ADVENTURE_NPCS = [
  "pip", "fern", "alby",
  "pearce", "mahoney", "ewings", "kellahan", "dawson", "heywood", "morgan", "bacon", "brookes",
];

// Fraction Farm challenge ids (mirror src/data/farm/farmRecords.js keys). A farm
// task carries location:"farm" + one of these instead of an NPC + topic.
const FARM_CHALLENGE_IDS = ["fence", "roundup", "order", "crate", "milk", "weigh", "trade", "veggie", "plank", "shop"];

// Badges a teacher task may award on completion ("get to the end" → trophy).
// Must match the game's badge catalogue (src/data/badges.js). Anything else is
// dropped to null so a task can never inject an unknown badge id.
const ADVENTURE_BADGE_IDS = ["fraction-explorer", "integer-adventurer", "algebra-apprentice", "stage4-quest-champion"];
function cleanBadge(v) {
  const s = String(v || "").trim();
  return ADVENTURE_BADGE_IDS.includes(s) ? s : null;
}

function strArray(v) {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x || "").trim()).filter(Boolean);
}
function clampInt(v, lo, hi, dflt) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return dflt;
  return Math.min(hi, Math.max(lo, n));
}

// Build + persist a Fraction Farm challenge assignment (no NPC/topic). The game
// reads location:"farm" + challengeId, shows the objective, and writes a cloud
// completion tagged with this doc id when the student finishes the set.
async function createFarmTask(teacherCode, d) {
  const challengeId = String(d.challengeId || "").trim().toLowerCase();
  if (!FARM_CHALLENGE_IDS.includes(challengeId)) {
    throw new HttpsError("invalid-argument", "Choose a farm challenge.");
  }
  const className = String(d.className || "").trim().toUpperCase();
  if (!className) throw new HttpsError("invalid-argument", "Choose a class.");
  const dueAt = Number.isFinite(Number(d.dueAt)) && Number(d.dueAt) > 0 ? Math.round(Number(d.dueAt)) : null;
  const ref = db.collection("adventureAssignments").doc();
  const now = Date.now();
  const assignment = {
    assignmentId: ref.id,
    location: "farm",
    challengeId,
    npcId: `farm-${challengeId}-sign`,
    title: String(d.title || "").trim() || "Farm challenge task",
    description: String(d.description || "").trim(),
    stages: [], selectedTopics: [], selectedSkills: [],
    difficultyRange: { min: 1, max: 5 }, adaptiveOn: true, requiredQuestions: 15,
    completionCriteria: { type: "answered", count: 15 }, passThreshold: 0,
    rewardXP: clampInt(d.rewardXP, 0, 1000, 50), rewardCoins: clampInt(d.rewardCoins, 0, 1000, 30),
    rewardBadge: cleanBadge(d.rewardBadge),
    teacherCode, className,
    createdBy: "teacher-portal",
    createdAtServer: admin.firestore.FieldValue.serverTimestamp(),
    assignedAt: now, dueAt, active: true,
  };
  await ref.set(assignment);
  return { ...assignment, createdAtServer: now };
}

exports.createAdventureTask = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.role !== "teacher" || !auth.token.teacherCode) {
    throw new HttpsError("permission-denied", "Sign in with your teacher code first.");
  }
  const teacherCode = normaliseCode(auth.token.teacherCode);
  const d = request.data || {};

  // Fraction Farm challenge task takes a different (NPC-free) shape.
  if (String(d.location || "").trim().toLowerCase() === "farm") {
    return await createFarmTask(teacherCode, d);
  }

  const npcId = String(d.npcId || "").trim().toLowerCase();
  if (!ADVENTURE_NPCS.includes(npcId)) {
    throw new HttpsError("invalid-argument", "Choose a character (Pip, Fern or Alby).");
  }
  const className = String(d.className || "").trim().toUpperCase();
  if (!className) throw new HttpsError("invalid-argument", "Choose a class.");

  const stages = strArray(d.stages);
  if (stages.length === 0) throw new HttpsError("invalid-argument", "Choose at least one stage.");
  const selectedTopics = strArray(d.selectedTopics);
  if (selectedTopics.length === 0) throw new HttpsError("invalid-argument", "Choose at least one topic.");
  const selectedSkills = strArray(d.selectedSkills); // empty = all skills of topics

  const min = clampInt(d.difficultyRange && d.difficultyRange.min, 1, 5, 1);
  const max = Math.max(min, clampInt(d.difficultyRange && d.difficultyRange.max, 1, 5, 5));
  const requiredQuestions = clampInt(d.requiredQuestions, 1, 50, 10);
  const ccType = (d.completionCriteria && d.completionCriteria.type) === "correct" ? "correct" : "answered";
  const ccCount = clampInt(d.completionCriteria && d.completionCriteria.count, 1, 50, requiredQuestions);
  const ptRaw = typeof d.passThreshold === "number" ? d.passThreshold : 0.6;
  const passThreshold = Math.min(1, Math.max(0, ptRaw));

  const dueAt = Number.isFinite(Number(d.dueAt)) && Number(d.dueAt) > 0 ? Math.round(Number(d.dueAt)) : null;

  const ref = db.collection("adventureAssignments").doc();
  const now = Date.now();
  const assignment = {
    assignmentId: ref.id,
    npcId,
    title: String(d.title || "").trim() || "Teacher task",
    description: String(d.description || "").trim(),
    stages,
    selectedTopics,
    selectedSkills,
    difficultyRange: { min, max },
    adaptiveOn: d.adaptiveOn !== false,
    requiredQuestions,
    completionCriteria: { type: ccType, count: ccCount },
    passThreshold,
    rewardXP: clampInt(d.rewardXP, 0, 1000, 50),
    rewardCoins: clampInt(d.rewardCoins, 0, 1000, 30),
    rewardBadge: cleanBadge(d.rewardBadge),
    teacherNotes: String(d.teacherNotes || "").trim(),
    // --- scoping / lifecycle (server-stamped) ---
    location: "island",
    teacherCode,
    className,
    createdBy: "teacher-portal",
    createdAtServer: admin.firestore.FieldValue.serverTimestamp(),
    assignedAt: now,
    dueAt,
    active: true,
  };
  await ref.set(assignment);
  // Return a JSON-safe copy (serverTimestamp isn't serialisable).
  return { ...assignment, createdAtServer: now };
});

/**
 * updateAdventureTask({ assignmentId, ...fields }) → safe assignment.
 *
 * Teacher-only. Edits a task the caller owns (verified by teacherCode claim vs
 * the stored doc) instead of remove-and-recreate. Re-validates the same fields
 * as createAdventureTask. teacherCode/createdAt/active/assignmentId are NOT
 * changed here (use setAdventureTaskActive to enable/disable).
 */
exports.updateAdventureTask = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.role !== "teacher" || !auth.token.teacherCode) {
    throw new HttpsError("permission-denied", "Sign in with your teacher code first.");
  }
  const teacherCode = normaliseCode(auth.token.teacherCode);
  const d = request.data || {};
  const assignmentId = String(d.assignmentId || "").trim();
  if (!assignmentId) throw new HttpsError("invalid-argument", "Missing assignmentId.");

  const ref = db.collection("adventureAssignments").doc(assignmentId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Task not found.");
  if (normaliseCode((snap.data() || {}).teacherCode) !== teacherCode) {
    throw new HttpsError("permission-denied", "You can only change your own tasks.");
  }

  // Farm task edit (challenge + class + due only — no NPC/topic).
  if (String(d.location || "").trim().toLowerCase() === "farm"
      || String((snap.data() || {}).location || "") === "farm") {
    const challengeId = String(d.challengeId || "").trim().toLowerCase();
    if (!FARM_CHALLENGE_IDS.includes(challengeId)) throw new HttpsError("invalid-argument", "Choose a farm challenge.");
    const className = String(d.className || "").trim().toUpperCase();
    if (!className) throw new HttpsError("invalid-argument", "Choose a class.");
    const dueAt = Number.isFinite(Number(d.dueAt)) && Number(d.dueAt) > 0 ? Math.round(Number(d.dueAt)) : null;
    await ref.update({
      location: "farm", challengeId, npcId: `farm-${challengeId}-sign`,
      className, dueAt, rewardBadge: cleanBadge(d.rewardBadge),
      title: String(d.title || "").trim() || "Farm challenge task",
      description: String(d.description || "").trim(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const after = (await ref.get()).data() || {};
    return { ...after, assignmentId, createdAtServer: undefined };
  }

  const npcId = String(d.npcId || "").trim().toLowerCase();
  if (!ADVENTURE_NPCS.includes(npcId)) throw new HttpsError("invalid-argument", "Choose a character (Pip, Fern or Alby).");
  const className = String(d.className || "").trim().toUpperCase();
  if (!className) throw new HttpsError("invalid-argument", "Choose a class.");
  const stages = strArray(d.stages);
  if (stages.length === 0) throw new HttpsError("invalid-argument", "Choose at least one stage.");
  const selectedTopics = strArray(d.selectedTopics);
  if (selectedTopics.length === 0) throw new HttpsError("invalid-argument", "Choose at least one topic.");
  const selectedSkills = strArray(d.selectedSkills);
  const min = clampInt(d.difficultyRange && d.difficultyRange.min, 1, 5, 1);
  const max = Math.max(min, clampInt(d.difficultyRange && d.difficultyRange.max, 1, 5, 5));
  const requiredQuestions = clampInt(d.requiredQuestions, 1, 50, 10);
  const dueAt = Number.isFinite(Number(d.dueAt)) && Number(d.dueAt) > 0 ? Math.round(Number(d.dueAt)) : null;

  const patch = {
    npcId, className, stages, selectedTopics, selectedSkills,
    difficultyRange: { min, max },
    adaptiveOn: d.adaptiveOn !== false,
    requiredQuestions,
    rewardBadge: cleanBadge(d.rewardBadge),
    title: String(d.title || "").trim() || "Teacher task",
    description: String(d.description || "").trim(),
    dueAt,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await ref.update(patch);
  const after = (await ref.get()).data() || {};
  return { ...after, assignmentId, createdAtServer: undefined };
});

/**
 * setAdventureTaskActive({ assignmentId, active }) → { assignmentId, active }.
 *
 * Teacher-only. Enables/disables (soft-removes) a task the caller owns. Verifies
 * the assignment's teacherCode matches the CALLER'S OWN claim before updating, so
 * a teacher can only change their own tasks. Soft, not destructive: the doc is
 * preserved (active:false) so past attempts still resolve the task. Students only
 * ever read active==true tasks, so deactivating removes it for them immediately.
 */
exports.setAdventureTaskActive = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.role !== "teacher" || !auth.token.teacherCode) {
    throw new HttpsError("permission-denied", "Sign in with your teacher code first.");
  }
  const teacherCode = normaliseCode(auth.token.teacherCode);
  const d = request.data || {};
  const assignmentId = String(d.assignmentId || "").trim();
  if (!assignmentId) throw new HttpsError("invalid-argument", "Missing assignmentId.");
  const active = d.active === true; // default false (remove) unless explicitly true

  const ref = db.collection("adventureAssignments").doc(assignmentId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Task not found.");
  if (normaliseCode((snap.data() || {}).teacherCode) !== teacherCode) {
    throw new HttpsError("permission-denied", "You can only change your own tasks.");
  }
  await ref.update({ active, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { assignmentId, active };
});

/**
 * createClass({ name }) → { classId, name, teacherCode, active, existed }.
 *
 * Teacher-only. Persists a class as a first-class object so it survives reload
 * and fills the pickers even before it has any students. Doc id is deterministic
 * (`<TEACHERCODE>__<NAME>`) so re-adding the same class is idempotent; a
 * previously soft-removed class is reactivated. Stamped with the CALLER'S OWN
 * teacherCode (from the verified claim, never client input). Admin-SDK write
 * (bypasses client-write rules). Students are untouched.
 */
exports.createClass = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.role !== "teacher" || !auth.token.teacherCode) {
    throw new HttpsError("permission-denied", "Sign in with your teacher code first.");
  }
  const teacherCode = normaliseCode(auth.token.teacherCode);
  const name = String((request.data && request.data.name) || "").trim().toUpperCase();
  if (!name) throw new HttpsError("invalid-argument", "Enter a class name.");
  if (name.length > 40) throw new HttpsError("invalid-argument", "That class name is too long.");

  const classId = `${teacherCode}__${name}`;
  const ref = db.collection("classes").doc(classId);
  const existing = await ref.get();
  const wasActive = existing.exists && (existing.data() || {}).active !== false;
  await ref.set({
    classId, name, teacherCode,
    active: true,
    createdBy: "teacher-portal",
    createdAt: existing.exists ? (existing.data() || {}).createdAt || admin.firestore.FieldValue.serverTimestamp()
                               : admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  return { classId, name, teacherCode, active: true, existed: wasActive };
});

/**
 * setClassActive({ classId | name, active }) → { classId, active }.
 *
 * Teacher-only. Soft-removes (active:false) a class the caller owns so it stops
 * appearing in the pickers. Verifies the class's teacherCode matches the CALLER'S
 * OWN claim before updating. Does NOT delete or move students in that class —
 * their records are preserved (a class with students still surfaces via the
 * roster union in the portal, so you can only fully clear an EMPTY class).
 */
exports.setClassActive = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.role !== "teacher" || !auth.token.teacherCode) {
    throw new HttpsError("permission-denied", "Sign in with your teacher code first.");
  }
  const teacherCode = normaliseCode(auth.token.teacherCode);
  const d = request.data || {};
  let classId = String(d.classId || "").trim();
  if (!classId) {
    const name = String(d.name || "").trim().toUpperCase();
    if (!name) throw new HttpsError("invalid-argument", "Missing class.");
    classId = `${teacherCode}__${name}`;
  }
  const active = d.active === true; // default false (remove) unless explicitly true

  const ref = db.collection("classes").doc(classId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Class not found.");
  if (normaliseCode((snap.data() || {}).teacherCode) !== teacherCode) {
    throw new HttpsError("permission-denied", "You can only change your own classes.");
  }
  await ref.update({ active, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { classId, active };
});

/**
 * createDashboardTask({ className, quizzes:[{toolId,title,launchUrl?}], dueAt }) →
 *   { created:[assignment...] }.
 *
 * Teacher-only. Assigns one or more online quizzes to a class as "dashboard
 * tasks". Writes ONE doc per quiz to `dashboardAssignments` (so completion is
 * tracked per quiz and each shows as its own to-do), stamped with the CALLER'S
 * OWN teacherCode. Admin-SDK batch write (bypasses client-write rules). The
 * student portal reads active tasks for its class and shows the pop-up.
 */
exports.createDashboardTask = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.role !== "teacher" || !auth.token.teacherCode) {
    throw new HttpsError("permission-denied", "Sign in with your teacher code first.");
  }
  const teacherCode = normaliseCode(auth.token.teacherCode);
  const d = request.data || {};
  const className = String(d.className || "").trim().toUpperCase();
  if (!className) throw new HttpsError("invalid-argument", "Choose a class.");
  const quizzes = Array.isArray(d.quizzes) ? d.quizzes : [];
  if (!quizzes.length) throw new HttpsError("invalid-argument", "Choose at least one quiz.");
  const dueAt = Number.isFinite(Number(d.dueAt)) && Number(d.dueAt) > 0 ? Math.round(Number(d.dueAt)) : null;

  const batch = db.batch();
  const created = [];
  const now = Date.now();
  const seen = new Set();
  for (const q of quizzes.slice(0, 50)) {
    const toolId = String((q && q.toolId) || "").trim().slice(0, 80);
    if (!toolId || seen.has(toolId)) continue;
    seen.add(toolId);
    const title = String((q && q.title) || "").trim().slice(0, 160) || toolId;
    const launchUrl = String((q && q.launchUrl) || "").trim().slice(0, 300);
    const ref = db.collection("dashboardAssignments").doc();
    const assignment = {
      assignmentId: ref.id,
      teacherCode, className,
      toolId, title, launchUrl,
      dueAt, assignedAt: now,
      createdBy: "teacher-portal",
      createdAtServer: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
    };
    batch.set(ref, assignment);
    created.push({ ...assignment, createdAtServer: now });
  }
  if (!created.length) throw new HttpsError("invalid-argument", "No valid quizzes to assign.");
  await batch.commit();
  return { created };
});

/**
 * updateDashboardTask({ assignmentId, dueAt }) → { assignmentId, dueAt }.
 * Teacher-only. Changes the due date on a dashboard task the caller owns
 * (verified by teacherCode claim vs the stored doc).
 */
exports.updateDashboardTask = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.role !== "teacher" || !auth.token.teacherCode) {
    throw new HttpsError("permission-denied", "Sign in with your teacher code first.");
  }
  const teacherCode = normaliseCode(auth.token.teacherCode);
  const d = request.data || {};
  const assignmentId = String(d.assignmentId || "").trim();
  if (!assignmentId) throw new HttpsError("invalid-argument", "Missing assignmentId.");
  const dueAt = Number.isFinite(Number(d.dueAt)) && Number(d.dueAt) > 0 ? Math.round(Number(d.dueAt)) : null;

  const ref = db.collection("dashboardAssignments").doc(assignmentId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Task not found.");
  if (normaliseCode((snap.data() || {}).teacherCode) !== teacherCode) {
    throw new HttpsError("permission-denied", "You can only change your own tasks.");
  }
  await ref.update({ dueAt, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { assignmentId, dueAt };
});

/**
 * setDashboardTaskActive({ assignmentId, active }) → { assignmentId, active }.
 * Teacher-only. Soft-removes (active:false) a dashboard task the caller owns.
 * Verified by teacherCode claim vs the stored doc. Students only read active
 * tasks, so deactivating removes it from their pop-up immediately.
 */
exports.setDashboardTaskActive = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.role !== "teacher" || !auth.token.teacherCode) {
    throw new HttpsError("permission-denied", "Sign in with your teacher code first.");
  }
  const teacherCode = normaliseCode(auth.token.teacherCode);
  const d = request.data || {};
  const assignmentId = String(d.assignmentId || "").trim();
  if (!assignmentId) throw new HttpsError("invalid-argument", "Missing assignmentId.");
  const active = d.active === true;

  const ref = db.collection("dashboardAssignments").doc(assignmentId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Task not found.");
  if (normaliseCode((snap.data() || {}).teacherCode) !== teacherCode) {
    throw new HttpsError("permission-denied", "You can only change your own tasks.");
  }
  await ref.update({ active, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { assignmentId, active };
});

/* =========================================================================
 * TEACHER PROFILES + ADMIN EMAIL (2026-10-24)
 * ======================================================================= */
const { defineSecret } = require("firebase-functions/params");

// Resend API key, held in Secret Manager — never in code or the browser.
//   firebase functions:secrets:set RESEND_API_KEY
const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

// MUST match isAdmin() in firestore.golive.claims.rules.
const ADMIN_UIDS = ["FQjmfFBvYrYPHljdX5pHfaYcdG82"];

// Who the emails come from (the domain must be verified in Resend) and where
// replies go. Change these two lines to change the sender or the reply inbox.
const MAIL_FROM = "Jeff Mills · Mills Maths Tools <hello@millsmathstools.au>";
const MAIL_REPLY_TO = "jeff.mills2@det.nsw.edu.au";
const SITE_URL = "https://millsmathstools.au";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function cleanEmail(v, required) {
  const s = String(v || "").trim().toLowerCase();
  if (!s) {
    if (required) throw new HttpsError("invalid-argument", "Enter your email address.");
    return "";
  }
  if (s.length > 254 || !EMAIL_RE.test(s)) throw new HttpsError("invalid-argument", "That email address doesn't look right.");
  return s;
}
function cleanText(v, max) { return String(v || "").replace(/\s+/g, " ").trim().slice(0, max); }

/** The profile the Teacher Platform is allowed to see about its own teacher. */
function safeTeacherProfile(doc) {
  return {
    teacherCode: doc.teacherCode,
    teacherName: doc.teacherName || "",
    school: doc.school || "",
    email: doc.email || "",
    position: doc.position || "",
    emailUpdates: doc.emailUpdates !== false,
    active: doc.active !== false,
  };
}

/**
 * updateMyTeacherProfile({ teacherName, email, school, position, emailUpdates })
 *   → { profile, studentsUpdated }
 *
 * Teacher-only. Writes the CALLER'S OWN teachers/{code} doc (code from the
 * verified claim, never client input) — identity stays server-written. If the
 * name or school changed, the copies stamped on that teacher's students are
 * updated too, so the student portal and the admin console agree.
 */
exports.updateMyTeacherProfile = onCall(async (request) => {
  const auth = request.auth;
  if (!auth || auth.token.role !== "teacher" || !auth.token.teacherCode) {
    throw new HttpsError("permission-denied", "Sign in with your teacher code first.");
  }
  const code = normaliseCode(auth.token.teacherCode);
  const d = request.data || {};
  const teacherName = cleanText(d.teacherName, 80);
  if (!teacherName) throw new HttpsError("invalid-argument", "Enter your name.");
  const email = cleanEmail(d.email, true);
  const school = cleanText(d.school, 120);
  const position = cleanText(d.position, 80);
  const emailUpdates = d.emailUpdates !== false;

  const ref = db.collection("teachers").doc(code);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Teacher account not found.");
  const before = snap.data() || {};
  if (before.active === false) throw new HttpsError("permission-denied", "This teacher code is not active.");

  const fields = {
    teacherName, email, school, position, emailUpdates,
    profileUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    profileUpdatedBy: "teacher",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await ref.update(fields);

  let studentsUpdated = 0;
  if ((before.teacherName || "") !== teacherName || (before.school || "") !== school) {
    const sSnap = await db.collection("students").where("teacherCode", "==", code).get();
    const docs = sSnap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = db.batch();
      docs.slice(i, i + 400).forEach((s) => batch.update(s.ref, {
        teacherName, teacher: teacherName, school,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }));
      await batch.commit();
    }
    studentsUpdated = docs.length;
  }
  return { profile: safeTeacherProfile({ ...before, ...fields, teacherCode: code }), studentsUpdated };
});

// ---- email building -------------------------------------------------------
function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
/** Plain text → simple HTML: paragraphs, line breaks, **bold**, bare links. */
function textToHtml(text) {
  return String(text).replace(/\r\n/g, "\n").trim().split(/\n{2,}/).map((p) => {
    let h = escHtml(p);
    h = h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g, '<a href="$1" style="color:#1d4ed8">$1</a>');
    h = h.replace(/\n/g, "<br>");
    return `<p style="margin:0 0 14px;line-height:1.6">${h}</p>`;
  }).join("");
}
function firstNameOf(name) { return String(name || "").trim().split(/\s+/)[0] || "there"; }
/** {firstName} {name} {code} {school} — the tokens the admin compose screen offers. */
function personalise(text, t) {
  const map = {
    firstname: firstNameOf(t.teacherName),
    name: t.teacherName || "there",
    code: t.teacherCode || "",
    school: t.school || "your school",
  };
  return String(text).replace(/\{(firstName|name|code|school)\}/gi, (m, k) => map[k.toLowerCase()]);
}
function footerText(kind) {
  const base = "You're receiving this because you have a teacher account on Mills Maths Tools (millsmathstools.au). Reply to this email to reach Jeff Mills.";
  return kind === "update"
    ? base + " To stop update emails, sign in to the Teacher Platform, open Profile and untick “Email me about updates”."
    : base;
}
function wrapHtml(bodyHtml, kind) {
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
<tr><td style="background:#1d4ed8;padding:18px 24px;color:#ffffff;font-weight:800;font-size:18px;letter-spacing:.2px">Mills Maths Tools</td></tr>
<tr><td style="padding:24px 24px 10px;font-size:15px">${bodyHtml}</td></tr>
<tr><td style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.5">${escHtml(footerText(kind))}</td></tr>
</table></td></tr></table></body></html>`;
}

const TEMPLATES = {
  welcome: {
    kind: "account",
    subject: "Your Mills Maths Tools teacher code",
    message: [
      "Hi {firstName},",
      "Welcome to Mills Maths Tools! Your teacher account is ready.",
      "Your teacher code is: **{code}**",
      `To sign in, go to ${SITE_URL}/portal/teacher/ and enter your code. From there you can add your classes and students, set quiz and Adventure tasks, and follow your students' results.`,
      "Please keep your code private — it is the key to your account. Once you're signed in, open Profile (top right) to check your details.",
      "If you need a hand with anything, just reply to this email.",
      "Jeff Mills\nMills Maths Tools",
    ].join("\n\n"),
  },
};

function isAdminAuth(auth) { return !!(auth && ADMIN_UIDS.includes(auth.uid)); }

async function resendBatch(key, emails) {
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(emails),
  });
  let body = null;
  try { body = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) {
    const m = (body && (body.message || body.name)) || `HTTP ${res.status}`;
    throw new Error(m);
  }
  return body;
}

/**
 * sendAdminEmail(...) — ADMIN ONLY (uid in ADMIN_UIDS).
 *
 *   { ping:true }                       → { configured, from, replyTo }
 *   { recipients:[teacherCode…], subject, message, respectOptOut?, test? }
 *   { recipients:[teacherCode], template:"welcome", test? }
 *     → { sent, failed, skipped:[{teacherCode, reason}], test }
 *
 * Recipient addresses are read from teachers/{code} SERVER-SIDE; the browser
 * only names which teachers. One email per teacher (never a shared To/CC
 * list), personalised with {firstName} {name} {code} {school}. Sent through
 * Resend's batch API, 100 at a time. Every real send is logged to emailLog;
 * a test goes only to the admin's own sign-in address and is not logged.
 */
exports.sendAdminEmail = onCall({ secrets: [RESEND_API_KEY] }, async (request) => {
  if (!isAdminAuth(request.auth)) throw new HttpsError("permission-denied", "Admin only.");
  const d = request.data || {};
  let key = "";
  try { key = String(RESEND_API_KEY.value() || "").trim(); } catch (e) { key = ""; }
  const configured = /^re_/.test(key);
  if (d.ping) return { configured, from: MAIL_FROM, replyTo: MAIL_REPLY_TO };
  if (!configured) {
    throw new HttpsError("failed-precondition", "Email sending isn't set up yet: the RESEND_API_KEY secret is missing or invalid.");
  }

  const tpl = d.template ? TEMPLATES[String(d.template)] : null;
  if (d.template && !tpl) throw new HttpsError("invalid-argument", "Unknown email template.");
  const kind = tpl ? tpl.kind : "update";
  const subject = tpl ? tpl.subject : cleanText(d.subject, 150);
  const message = tpl ? tpl.message : String(d.message || "").replace(/\r\n/g, "\n").trim().slice(0, 20000);
  if (!subject) throw new HttpsError("invalid-argument", "Add a subject.");
  if (!message) throw new HttpsError("invalid-argument", "Write a message.");
  const respectOptOut = kind === "update" && d.respectOptOut !== false;

  const codes = [...new Set((Array.isArray(d.recipients) ? d.recipients : []).map(normaliseCode).filter(Boolean))];
  if (!codes.length) throw new HttpsError("invalid-argument", "Choose at least one teacher.");
  if (codes.length > 1000) throw new HttpsError("invalid-argument", "That's too many recipients for one send.");

  const snaps = [];
  for (let i = 0; i < codes.length; i += 300) {
    snaps.push(...await db.getAll(...codes.slice(i, i + 300).map((c) => db.collection("teachers").doc(c))));
  }
  const eligible = [], skipped = [], seen = new Set();
  snaps.forEach((s, i) => {
    const code = codes[i];
    if (!s.exists) { skipped.push({ teacherCode: code, reason: "not found" }); return; }
    const t = { teacherCode: code, ...s.data() };
    const email = String(t.email || "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) { skipped.push({ teacherCode: code, name: t.teacherName || "", reason: "no email" }); return; }
    if (respectOptOut && t.emailUpdates === false) { skipped.push({ teacherCode: code, name: t.teacherName || "", reason: "opted out" }); return; }
    if (seen.has(email)) { skipped.push({ teacherCode: code, name: t.teacherName || "", reason: "duplicate email" }); return; }
    seen.add(email);
    eligible.push({ ...t, email });
  });

  const build = (t, to) => {
    const body = personalise(message, t);
    return {
      from: MAIL_FROM,
      to: [to],
      reply_to: MAIL_REPLY_TO,
      subject: (d.test ? "[TEST] " : "") + personalise(subject, t),
      html: wrapHtml(textToHtml(body), kind),
      text: body.replace(/\*\*(.+?)\*\*/g, "$1") + "\n\n—\n" + footerText(kind),
    };
  };

  if (d.test) {
    const me = String((request.auth.token && request.auth.token.email) || "").trim();
    if (!me) throw new HttpsError("failed-precondition", "Your admin account has no email address to send a test to.");
    const sample = eligible[0] || { teacherCode: codes[0], teacherName: "Sample Teacher", school: "Sample School" };
    try { await resendBatch(key, [build(sample, me)]); }
    catch (e) { throw new HttpsError("internal", `Resend refused the test: ${e.message}`); }
    return { sent: 1, failed: 0, skipped: [], test: true, to: me };
  }

  const results = [];
  for (let i = 0; i < eligible.length; i += 100) {
    const chunk = eligible.slice(i, i + 100);
    try {
      await resendBatch(key, chunk.map((t) => build(t, t.email)));
      chunk.forEach((t) => results.push({ teacherCode: t.teacherCode, name: t.teacherName || "", email: t.email, status: "sent" }));
    } catch (e) {
      chunk.forEach((t) => results.push({ teacherCode: t.teacherCode, name: t.teacherName || "", email: t.email, status: "failed", reason: String(e.message || e).slice(0, 200) }));
    }
  }
  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.length - sent;

  try {
    await db.collection("emailLog").add({
      subject, message, template: d.template || null, kind, respectOptOut,
      sentBy: (request.auth.token && request.auth.token.email) || request.auth.uid,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      sentAtMs: Date.now(),
      counts: { sent, failed, skipped: skipped.length },
      recipients: [...results, ...skipped.map((s) => ({ ...s, status: "skipped" }))],
    });
  } catch (e) { /* logging is best effort */ }

  return { sent, failed, skipped, test: false };
});
