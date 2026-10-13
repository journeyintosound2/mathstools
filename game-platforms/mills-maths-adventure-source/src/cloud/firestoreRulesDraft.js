/**
 * FIRESTORE RULES — Phase 3C compatibility DRAFT (the canonical source).
 *
 * This module holds the proposed rules as a STRING so the system checks can
 * verify their properties statically (no filesystem / no network). The identical
 * text is also written to `firestore.phase3c.compatibility.rules` for review and
 * manual deployment via the Firebase console/CLI.
 *
 * THESE RULES ARE NOT DEPLOYED FROM CODE. They are a reviewed draft. They are
 * SAFER than the current open rules but are NOT production-grade identity — see
 * RULES_LIMITATIONS. Anonymous auth + a typed studentCode/teacherCode is a
 * SHARED SECRET, not authentication. True scoping needs Cloud Functions +
 * custom claims (documented as Phase 3D / production).
 */

export const PHASE3C_COMPATIBILITY_RULES = `rules_version = '2';

// Mills Maths Tools — Phase 3C compatibility rules (DRAFT, not auto-deployed).
// Replaces the unsafe open rules. Default-deny; identity is read-by-code only;
// result records are create-only + validated and can never be edited/deleted
// from the client. Reads of results stay broad (documented risk) so the existing
// dashboards keep working until the Phase 3D custom-claims model lands.

service cloud.firestore {
  match /databases/{database}/documents {

    function authed() { return request.auth != null; }
    function pct(v)   { return v is number && v >= 0 && v <= 100; }
    function nonneg(v){ return v is number && v >= 0; }

    // -------- Identity: read a single doc BY CODE; no listing; no client writes.
    // get → quizzes/Adventure/Student Dashboard log in by exact code.
    // list denied → stops enumeration of all student/teacher PII.
    // writes denied → Admin Console identity writes move to console/Functions
    //   (Phase 3D). This intentionally locks down anonymous admin writes.
    match /students/{studentCode} {
      allow get: if authed();
      allow list: if false;
      allow create, update, delete: if false;
    }
    match /teachers/{teacherCode} {
      allow get: if authed();
      allow list: if false;
      allow create, update, delete: if false;
    }

    // -------- Compact platform results: CREATE-ONLY + validated; never edited.
    // Reads kept (dashboards query by code) — a documented broad-read risk.
    match /achievements/{id} {
      allow read: if authed();
      allow create: if authed()
        && request.resource.data.studentCode is string
        && request.resource.data.teacherCode is string
        && request.resource.data.tool is string
        && request.resource.data.score is number
        && request.resource.data.total is number
        && pct(request.resource.data.percent)
        && request.resource.data.score >= 0
        && request.resource.data.total >= 0
        && request.resource.data.score <= request.resource.data.total + 1;
      allow update, delete: if false;
    }

    // -------- Rich Adventure attempts: CREATE-ONLY + validated; doc id = attemptId.
    match /adventureAttempts/{id} {
      allow read: if authed();
      allow create: if authed()
        && request.resource.data.attemptId == id
        && request.resource.data.studentCode is string
        && request.resource.data.teacherCode is string
        && request.resource.data.missionKind is string
        && request.resource.data.source == 'mills-maths-adventure'
        && nonneg(request.resource.data.questionCount)
        && nonneg(request.resource.data.correctCount)
        && pct(request.resource.data.percent)
        && request.resource.data.createdAtClient is string;
      allow update, delete: if false;
    }

    // -------- TEMPORARY COMPATIBILITY EXCEPTION (commented; DO NOT enable for a
    // public deployment). The Teacher Dashboard + Admin Console currently need to
    // LIST students/teachers. Until a teacher-owned mirror or custom claims exist
    // (Phase 3D), you may temporarily re-allow listing for signed-in clients.
    // This re-exposes PII enumeration and is NOT production-safe.
    //
    // match /students/{studentCode} { allow list: if authed(); }
    // match /teachers/{teacherCode} { allow list: if authed(); }

    // -------- Default: deny everything else.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;

// Machine-readable summary of what the draft does (used by the system checks).
export const RULES_META = Object.freeze({
  rulesVersion: "2",
  deniesByDefault: true,
  identityReadByCodeOnly: true,
  identityListDenied: true,
  identityWritesDenied: true,
  resultsCreateOnly: true,
  noClientResultEdits: true,
  resultsValidated: true,
});

// Plain-English remaining risks / compatibility notes (honest disclosure).
export const RULES_LIMITATIONS = Object.freeze([
  "Anonymous auth + a typed studentCode/teacherCode is a SHARED SECRET, not real identity. These rules are safer than open rules but are NOT production-grade authentication.",
  "Teacher Dashboard: its students query (where teacherCode == code) is a LIST/query op. With list denied it BREAKS until a teacher-owned mirror or custom claims (Phase 3D) exist, or the temporary list exception is enabled (not production-safe).",
  "Admin Console: identity writes are DENIED, so it can no longer create/edit/disable students or teachers from the web. Do those changes in the Firebase Console for now; a Cloud Functions/admin-auth path is required later.",
  "achievements and adventureAttempts remain READABLE by any signed-in (anonymous) client — a documented broad-read risk. Scoping reads to the owner needs custom claims (Phase 3D).",
  "Firestore rules cannot cheaply scan question arrays, so 'no typed studentAnswer' is enforced by the client mapper, not the rules. The mapper strips studentAnswer before write.",
]);

// Production direction (not built here): a Cloud Function validates a typed code
// once and mints a Firebase Auth custom token with claims { role, studentCode |
// teacherCode, classId }; rules then scope reads/writes to request.auth.token.*.
export const PRODUCTION_DIRECTION =
  "Phase 3D: Cloud Functions + custom claims (role/studentCode/teacherCode). " +
  "Then: scope identity get/list + result reads to the owner, move admin/teacher " +
  "writes server-side, and maintain teacher/student mirror views via Function triggers.";

/**
 * PHASE 3D — CLAIM-BASED rules (DRAFT, not auto-deployed). These assume the
 * secure code-exchange Cloud Functions are deployed: every client signs in with
 * a custom token carrying { role, studentCode | teacherCode, ... } claims, so
 * rules can scope reads/writes to the OWNER. This is the first tier where the
 * typed code is no longer a shared secret in the rules' eyes.
 *
 * Identical text is written to `firestore.phase3d.claims.rules`.
 */
export const PHASE3D_CLAIMS_RULES = `rules_version = '2';

// Mills Maths Tools — Phase 3D claim-based rules (DRAFT, not auto-deployed).
// Requires the secure code-exchange Cloud Functions (custom-token sign-in with
// role claims). Reads/writes are scoped to the signed-in owner. Identity writes
// stay server-side only. Default-deny.

service cloud.firestore {
  match /databases/{database}/documents {

    function authed()      { return request.auth != null; }
    function role()        { return authed() ? request.auth.token.role : ''; }
    function isStudent()   { return role() == 'student'; }
    function isTeacher()   { return role() == 'teacher'; }
    function myStudent()   { return request.auth.token.studentCode; }
    function myTeacher()   { return request.auth.token.teacherCode; }
    function pct(v)        { return v is number && v >= 0 && v <= 100; }
    function nonneg(v)     { return v is number && v >= 0; }

    // -------- Students: own doc (student) or teacher's class (teacher). No writes.
    // Teacher LIST works only when the query is filtered by teacherCode == claim,
    // because the per-doc read rule below forces that constraint.
    match /students/{studentCode} {
      allow read: if (isStudent() && myStudent() == studentCode)
                  || (isTeacher() && resource.data.teacherCode == myTeacher());
      allow create, update, delete: if false;   // identity writes: server-side only
    }

    // -------- Teachers: own doc only. No listing. No writes.
    match /teachers/{teacherCode} {
      allow get: if isTeacher() && myTeacher() == teacherCode;
      allow list: if false;
      allow create, update, delete: if false;
    }

    // -------- Achievements: own (student) / class (teacher) reads; create-only,
    // and ONLY for the signed-in student's own studentCode.
    match /achievements/{id} {
      allow read: if (isStudent() && resource.data.studentCode == myStudent())
                  || (isTeacher() && resource.data.teacherCode == myTeacher());
      allow create: if isStudent()
        && request.resource.data.studentCode == myStudent()
        && request.resource.data.teacherCode is string
        && request.resource.data.tool is string
        && request.resource.data.score is number
        && request.resource.data.total is number
        && pct(request.resource.data.percent);
      allow update, delete: if false;
    }

    // -------- Adventure attempts: own/class reads; create-only for own student;
    // doc id == attemptId; source pinned; never edited/deleted.
    match /adventureAttempts/{id} {
      allow read: if (isStudent() && resource.data.studentCode == myStudent())
                  || (isTeacher() && resource.data.teacherCode == myTeacher());
      allow create: if isStudent()
        && request.resource.data.attemptId == id
        && request.resource.data.studentCode == myStudent()
        && request.resource.data.teacherCode is string
        && request.resource.data.missionKind is string
        && request.resource.data.source == 'mills-maths-adventure'
        && nonneg(request.resource.data.questionCount)
        && nonneg(request.resource.data.correctCount)
        && pct(request.resource.data.percent)
        && request.resource.data.createdAtClient is string;
      allow update, delete: if false;
    }

    // -------- Adventure assignments (teacher-set tasks): a teacher reads their
    // own class's tasks; a student reads ACTIVE tasks for their own class. Writes
    // go through the createAdventureTask Function only (server-side). The student
    // query MUST filter by teacherCode + className + active to satisfy this rule.
    match /adventureAssignments/{id} {
      allow read: if (isTeacher() && resource.data.teacherCode == myTeacher())
                  || (isStudent()
                      && resource.data.teacherCode == request.auth.token.teacherCode
                      && resource.data.className  == request.auth.token.className
                      && resource.data.active == true);
      allow create, update, delete: if false;   // via createAdventureTask only
    }

    // -------- Adventure progress (2026-10-13): ONE save per signed-in student,
    // doc id = studentCode, so a student picks up where they left off on any
    // device. A student reads + writes ONLY their own; a teacher can read their
    // class's. The shape is pinned; never deleted from the client.
    match /adventureProgress/{studentCode} {
      allow read: if (isStudent() && myStudent() == studentCode)
                  || (isTeacher() && resource.data.teacherCode == myTeacher());
      allow create, update: if isStudent()
        && myStudent() == studentCode
        && request.resource.data.studentCode == studentCode
        && request.resource.data.teacherCode == myTeacher()
        && request.resource.data.v is number
        && request.resource.data.progress is map
        && request.resource.data.bests is map
        && request.resource.data.flags is map
        && request.resource.data.keys().hasOnly(['v', 'studentCode', 'teacherCode', 'className', 'updatedAt', 'updatedAtClient', 'progress', 'bests', 'flags']);
      allow delete: if false;
    }

    // -------- Admin / identity writes: server-side (Admin SDK / Functions) only.
    // -------- Default: deny everything else.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;

export const RULES_3D_META = Object.freeze({
  rulesVersion: "2",
  usesCustomClaims: true,
  deniesByDefault: true,
  identityWritesServerSideOnly: true,
  resultReadsScopedToOwner: true,
  resultCreateScopedToOwnStudent: true,
  noClientResultEdits: true,
});

export const RULES_3D_LIMITATIONS = Object.freeze([
  "Requires the code-exchange Cloud Functions deployed; without them clients cannot sign in and all access is denied (fail-closed).",
  "Legacy achievements that lack a teacherCode (older `code`-only records) will NOT be visible to teachers under 3D until backfilled — document/migrate separately, do not bulk-edit in this phase.",
  "Student Dashboard class-leaderboard (read by className) is denied under 3D (not own studentCode, not teacher) — drop or redesign that feature.",
  "Admin Console identity writes remain server-side only; manage students/teachers via the Firebase Console or a future admin-auth Function.",
  "Rules still can't deep-scan question arrays; the client mapper strips typed studentAnswer (enforce App Check too).",
]);
