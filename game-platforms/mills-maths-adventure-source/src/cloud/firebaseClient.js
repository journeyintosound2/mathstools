/**
 * FIREBASE CLIENT (Phase 3B → 3D) — the ONLY module that touches the Firebase
 * SDK. The SDK loads LAZILY via dynamic `import()` of the gstatic ESM modules
 * (same version as the MMT tools), so importing this module never pulls Firebase
 * and the headless checks never hit the network.
 *
 * Phase 3D: the client NO LONGER reads `students/{code}` directly. Instead it
 * calls the secure Cloud Function `exchangeStudentCode` (server validates the
 * code with the Admin SDK + mints a custom token), then signs in with that
 * token. Claim-based Firestore rules then scope all reads/writes. Result writes
 * (achievements / adventureAttempts) happen while signed in as that student.
 */
import { FIREBASE_CONFIG, FIREBASE_SDK_VERSION, COLLECTIONS, CLOUD_ENABLED } from "./firebaseConfig.js";
import { EXCHANGE_FUNCTIONS } from "./codeExchange.js";

const SDK = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;

let _state = null; // { app, auth, db, functions, fns }
let _connecting = null;

async function loadSdk() {
  const appMod = await import(/* @vite-ignore */ `${SDK}/firebase-app.js`);
  const authMod = await import(/* @vite-ignore */ `${SDK}/firebase-auth.js`);
  const fsMod = await import(/* @vite-ignore */ `${SDK}/firebase-firestore.js`);
  const fnMod = await import(/* @vite-ignore */ `${SDK}/firebase-functions.js`);
  return { appMod, authMod, fsMod, fnMod };
}

/**
 * Initialise the app + SDK handles (no sign-in here — identity comes from the
 * code-exchange custom token). Idempotent.
 */
export async function ensureConnected() {
  if (!CLOUD_ENABLED) throw new Error("Cloud is disabled.");
  if (_state) return _state;
  if (_connecting) return _connecting;
  _connecting = (async () => {
    const { appMod, authMod, fsMod, fnMod } = await loadSdk();
    const app = appMod.initializeApp(FIREBASE_CONFIG);
    const auth = authMod.getAuth(app);
    const db = fsMod.getFirestore(app);
    const functions = fnMod.getFunctions(app);
    _state = {
      app, auth, db, functions,
      fns: {
        signInWithCustomToken: authMod.signInWithCustomToken,
        httpsCallable: fnMod.httpsCallable,
        doc: fsMod.doc, collection: fsMod.collection,
        addDoc: fsMod.addDoc, setDoc: fsMod.setDoc, serverTimestamp: fsMod.serverTimestamp,
        query: fsMod.query, where: fsMod.where, getDocs: fsMod.getDocs,
        getDoc: fsMod.getDoc,
      },
    };
    return _state;
  })();
  try { return await _connecting; }
  finally { _connecting = null; }
}

export function isConnected() {
  return Boolean(_state);
}

/**
 * Secure STUDENT code exchange: call the Cloud Function, sign in with the
 * returned custom token, and return the safe profile. Throws on invalid/inactive
 * code (the function returns an HttpsError → surfaced as err.message).
 */
export async function exchangeStudentCode(studentCode, pin) {
  const { functions, auth, fns } = await ensureConnected();
  const call = fns.httpsCallable(functions, EXCHANGE_FUNCTIONS.student);
  const res = await call({ studentCode, pin });
  const { token, profile } = res.data || {};
  if (!token) throw new Error("Sign-in failed. Please try again.");
  await fns.signInWithCustomToken(auth, token);
  return profile;
}

/** Secure TEACHER code exchange (for the Teacher Dashboard / future tooling). */
export async function exchangeTeacherCode(teacherCode) {
  const { functions, auth, fns } = await ensureConnected();
  const call = fns.httpsCallable(functions, EXCHANGE_FUNCTIONS.teacher);
  const res = await call({ teacherCode });
  const { token, profile } = res.data || {};
  if (!token) throw new Error("Sign-in failed. Please try again.");
  await fns.signInWithCustomToken(auth, token);
  return profile;
}

/**
 * Save the signed-in student's explorer avatar (W3-B) via the secure Cloud
 * Function. The function stamps the caller's OWN studentCode from the verified
 * claim, so the client never sends an identity. Must be called while signed in
 * as a student. Returns the sanitised avatar the server stored.
 */
export async function setStudentAvatar(avatar) {
  const { functions, fns } = await ensureConnected();
  const call = fns.httpsCallable(functions, "setStudentAvatar");
  const res = await call({ avatar });
  return (res.data && res.data.avatar) || null;
}

/** Sign out of the cloud session (clears the custom-token auth). */
export async function signOutCloud() {
  if (!_state) return;
  try {
    const authMod = await import(/* @vite-ignore */ `${SDK}/firebase-auth.js`);
    await authMod.signOut(_state.auth);
  } catch { /* ignore */ }
}

/** Create a compact achievement record (append-only). Adds the server timestamp. */
export async function writeAchievement(record) {
  const { db, fns } = await ensureConnected();
  await fns.addDoc(fns.collection(db, COLLECTIONS.achievements), {
    ...record,
    createdAt: fns.serverTimestamp(),
  });
}

/** Create the rich adventure attempt; doc id = attemptId (claim-scoped create). */
export async function writeAdventureAttempt(attemptId, record) {
  const { db, fns } = await ensureConnected();
  await fns.setDoc(fns.doc(db, COLLECTIONS.adventureAttempts, attemptId), {
    ...record,
    createdAt: fns.serverTimestamp(),
  });
}

/**
 * Read the ACTIVE Adventure tasks a teacher set for this student's class. The
 * claim-based rules require the query be filtered by teacherCode + className +
 * active, which matches the signed-in student's claims. Returns raw docs (the
 * caller normalises them into missions). Must be called while signed in.
 */
export async function readClassAssignments(teacherCode, className) {
  const { db, fns } = await ensureConnected();
  if (!teacherCode || !className) return [];
  const q = fns.query(
    fns.collection(db, COLLECTIONS.adventureAssignments),
    fns.where("teacherCode", "==", teacherCode),
    fns.where("className", "==", className),
    fns.where("active", "==", true)
  );
  const snap = await fns.getDocs(q);
  return snap.docs.map((d) => ({ assignmentId: d.id, ...d.data() }));
}

/**
 * CLOUD PROGRESS (2026-10-13) — the signed-in student's ONE save document,
 * `adventureProgress/{studentCode}` (see progressMerge.js / progressSync.js).
 * Read once at sign-in; written (replaced whole) by the autosave. The rules let
 * a student read + write only their OWN doc. Returns null when there isn't one.
 */
export async function readProgressDoc(studentCode) {
  const { db, fns } = await ensureConnected();
  const snap = await fns.getDoc(fns.doc(db, COLLECTIONS.adventureProgress, studentCode));
  return snap.exists() ? snap.data() : null;
}

/** Replace the student's progress document (adds the server timestamp). */
export async function writeProgressDoc(studentCode, data) {
  const { db, fns } = await ensureConnected();
  await fns.setDoc(fns.doc(db, COLLECTIONS.adventureProgress, studentCode), {
    ...data,
    updatedAt: fns.serverTimestamp(),
  });
}

/**
 * The signed-in student's own achievement records (the rules allow a student
 * to read theirs; the query must filter by their studentCode). Used once, to
 * rebuild a save for students who played signed-in before cloud progress.
 */
export async function readMyAchievements(studentCode) {
  const { db, fns } = await ensureConnected();
  if (!studentCode) return [];
  const q = fns.query(
    fns.collection(db, COLLECTIONS.achievements),
    fns.where("studentCode", "==", studentCode)
  );
  const snap = await fns.getDocs(q);
  return snap.docs.map((d) => d.data());
}

// The default client the writer uses (tests inject a mock instead). No direct
// student-doc read here any more — identity comes from the code exchange.
export const defaultCloudClient = {
  ensureConnected,
  writeAchievement,
  writeAdventureAttempt,
};
