/**
 * FIREBASE CONFIG (Phase 3B) — the EXISTING `mills-maths-tools` project config,
 * taken verbatim from the existing MMT quiz/dashboard tools so Mills Maths
 * Adventure joins the same ecosystem (students / teachers / achievements).
 *
 * A Firebase web `apiKey` is NOT a secret (it only identifies the project); real
 * protection comes from Firestore rules + App Check (see the rules draft doc).
 *
 * This module is PURE DATA — it imports nothing. The Firebase SDK itself is
 * loaded LAZILY (dynamic import) by firebaseClient.js, only when a student
 * actually signs in, so importing the cloud layer never pulls Firebase (and the
 * headless system checks never touch the network).
 */
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDYoJuHGslYY-cvV2rtuLkL6bE_hRDOESw",
  authDomain: "mills-maths-tools.firebaseapp.com",
  projectId: "mills-maths-tools",
  storageBucket: "mills-maths-tools.firebasestorage.app",
  messagingSenderId: "835000359454",
  appId: "1:835000359454:web:d7876be83ee367b5006c0f",
  measurementId: "G-35YCH5NJEG",
};

// SDK version pinned to match the existing MMT tools (gstatic ESM modules).
export const FIREBASE_SDK_VERSION = "10.12.5";

// Collections (existing + new Adventure). Only `achievements` (existing) and
// `adventureAttempts` (new) are WRITTEN in Phase 3B.
export const COLLECTIONS = {
  students: "students",
  teachers: "teachers",
  achievements: "achievements",
  adventureAttempts: "adventureAttempts",
  adventureAssignments: "adventureAssignments",
  // One save per signed-in student (2026-10-13) — doc id = studentCode.
  adventureProgress: "adventureProgress",
};

// Master flag — cloud features are opt-in (a student must enter a code). With
// this false the whole cloud layer is inert and the app is the local pilot.
export const CLOUD_ENABLED = true;
