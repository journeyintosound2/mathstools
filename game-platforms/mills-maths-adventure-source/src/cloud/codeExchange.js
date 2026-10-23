/**
 * CODE EXCHANGE — shared PURE logic (Phase 3D).
 *
 * The secure code-exchange model: instead of the client reading
 * `students/{code}` directly (a shared-secret read), a Cloud Function validates
 * the code with the Admin SDK and mints a Firebase Auth CUSTOM TOKEN carrying
 * small role claims. The client signs in with that token, and the claim-based
 * Firestore rules then scope every read/write to that identity.
 *
 * This module holds the PURE validation + claim/profile builders so the SAME
 * logic is testable headlessly (no Firebase) AND mirrored by the Cloud Function
 * (`functions/index.js`). Imports nothing but the existing code normaliser.
 */
import { normaliseStudentCode } from "./studentSession.js";

// The callable Cloud Function names (the client + functions must agree).
export const EXCHANGE_FUNCTIONS = Object.freeze({
  student: "exchangeStudentCode",
  teacher: "exchangeTeacherCode",
});

// Teacher codes normalise the same way as student codes.
export const normaliseCode = normaliseStudentCode;

function fullName(d = {}) {
  return d.name || [d.firstName, d.surname].filter(Boolean).join(" ") || "Student";
}

// ---- Student ---------------------------------------------------------------

/**
 * Validate a fetched student doc for a code exchange. `pinInput` is checked only
 * when the doc requires a PIN (pin/studentPin/dashboardPin). Returns {ok,error}.
 */
export function validateStudentForExchange(studentDoc, pinInput) {
  if (!studentDoc) return { ok: false, error: "Student code not found." };
  if (studentDoc.active === false) return { ok: false, error: "This student code is not active." };
  const required = studentDoc.pin || studentDoc.studentPin || studentDoc.dashboardPin;
  if (required && String(pinInput || "") !== String(required)) {
    return { ok: false, error: "Incorrect PIN. Check it with your teacher." };
  }
  return { ok: true };
}

/** Small role claims for a student (kept minimal — no extra PII). */
export function buildStudentClaims(studentDoc = {}) {
  return {
    role: "student",
    studentCode: studentDoc.studentCode,
    teacherCode: studentDoc.teacherCode || "",
    className: studentDoc.className || "",
    school: studentDoc.school || "",
  };
}

/** Safe student profile returned to the UI (no sensitive fields like PIN). */
export function buildSafeStudentProfile(studentDoc = {}) {
  return {
    studentCode: studentDoc.studentCode,
    firstName: studentDoc.firstName || "",
    surname: studentDoc.surname || "",
    name: fullName(studentDoc),
    className: studentDoc.className || "",
    teacherCode: studentDoc.teacherCode || "",
    teacherName: studentDoc.teacherName || studentDoc.teacher || "",
    school: studentDoc.school || "",
  };
}

// ---- Teacher ---------------------------------------------------------------

export function validateTeacherForExchange(teacherDoc) {
  if (!teacherDoc) return { ok: false, error: "Teacher code not found." };
  if (teacherDoc.active === false) return { ok: false, error: "This teacher code is not active." };
  return { ok: true };
}

/** Small role claims for a teacher. */
export function buildTeacherClaims(teacherDoc = {}) {
  return {
    role: "teacher",
    teacherCode: teacherDoc.teacherCode,
    school: teacherDoc.school || "",
  };
}

export function buildSafeTeacherProfile(teacherDoc = {}) {
  return {
    teacherCode: teacherDoc.teacherCode,
    teacherName: teacherDoc.teacherName || "",
    school: teacherDoc.school || "",
    email: teacherDoc.email || "",
    position: teacherDoc.position || "",
    emailUpdates: teacherDoc.emailUpdates !== false,
    active: teacherDoc.active !== false,
  };
}
