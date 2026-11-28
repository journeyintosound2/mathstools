/* Bin Toss: Student Interactive — everything that talks to Firebase. Loaded only when needed (dynamic import),
   so the game itself never depends on gstatic.com being reachable.
   Students sign in through the shared quiz client (default app); teachers through the portal client ("mmt-teacher" app),
   so a teacher signed in to the Teacher Platform in this browser is already signed in here. */
import { MMTQuiz } from "/portal/shared/quizClient.js?v=b1371afa";
import { initPortal, loginTeacher, logout as teacherLogout, getDb, getAuthInstance, getProfile, getRole } from "/portal/shared/codeExchangeClient.js?v=ca0c5c39";
import { getApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, setDoc, collection, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";

const SHARDS = 10, SPOTS = ["front", "middle", "back"];
let student = null;
const sdb = () => { MMTQuiz.init(); return getFirestore(getApp()); };

export async function studentSignIn(code) {
  MMTQuiz.init();
  const r = await MMTQuiz.signIn(code);
  if (r.ok) student = r.profile;
  return r;
}
export async function studentSignOut() { student = null; try { MMTQuiz.skipDemo(); await signOut(getAuth(getApp())); } catch (e) { /* noop */ } }

export async function recordThrows(payload) {
  try {
    const call = httpsCallable(getFunctions(getApp(), "us-central1"), "recordBinTossThrows");
    const res = await call(payload);
    return { ok: !!(res.data && res.data.ok) };
  } catch (e) {
    const code = String((e && e.code) || ""), msg = String((e && e.message) || e);
    // a callable that has not been deployed answers not-found (or internal from some regions)
    return { ok: false, missing: /not-found|internal/.test(code) && !/permission|invalid|exhausted/.test(code), error: msg };
  }
}
export async function saveAchievement(payload) {
  try { return await MMTQuiz.saveAchievement(payload); } catch (e) { return { error: String(e && e.message || e) }; }
}

function mergeShards(docs) {
  const out = { spots: {}, recent: [] };
  for (const s of SPOTS) out.spots[s] = { n: 0, in: 0, ang: {} };
  for (const d of docs) {
    if (!d) continue;
    for (const s of SPOTS) {
      const x = d.spots && d.spots[s]; if (!x) continue;
      out.spots[s].n += x.n || 0; out.spots[s].in += x.in || 0;
      for (const a in x.ang || {}) { const y = out.spots[s].ang[a] || (out.spots[s].ang[a] = { n: 0, in: 0 }); y.n += x.ang[a].n || 0; y.in += x.ang[a].in || 0; }
    }
    out.recent.push(...(d.recent || []));
  }
  return out;
}
async function globalFrom(db) {
  const snaps = await Promise.all(Array.from({ length: SHARDS }, (_, i) => getDoc(doc(db, "binTossStats", "global_s" + i)).catch(() => null)));
  return mergeShards(snaps.map((s) => (s && s.exists() ? s.data() : null)));
}
export async function loadGlobal() { return globalFrom(sdb()); }

export async function loadStudentReveal() {
  if (!student) return { cls: null, pred: null };
  const db = sdb();
  let cls = null, pred = null;
  try {
    const q = query(collection(db, "binTossStats"), where("teacherCode", "==", student.teacherCode || ""), where("className", "==", student.className || ""));
    const s = await getDocs(q); if (!s.empty) cls = s.docs[0].data();
  } catch (e) { console.warn("class stats", e); }
  try { const p = await getDoc(doc(db, "binTossPredictions", student.teacherCode || "none")); if (p.exists()) pred = p.data(); } catch (e) { /* none */ }
  return { cls, pred };
}

/* ---------------- teacher ---------------- */
export async function teacherSignIn(code, pin) {
  initPortal("teacher");
  const r = await loginTeacher(code, pin);
  return r.ok ? { ok: true, profile: r.profile } : { ok: false, error: r.error };
}
export async function teacherRestore() {
  initPortal("teacher");
  const auth = getAuthInstance();
  try { if (auth.authStateReady) await auth.authStateReady(); } catch (e) { /* noop */ }
  return auth.currentUser && getRole() === "teacher" ? getProfile() : null;
}
export async function teacherSignOut() { await teacherLogout(); }
const tCode = () => { const p = getProfile(); return (p && p.teacherCode) || ""; };
export async function loadTeacher() {
  initPortal("teacher");
  const db = getDb(), tc = tCode();
  const [cs, ss, ps, glob] = await Promise.all([
    getDocs(query(collection(db, "binTossStats"), where("teacherCode", "==", tc))),
    getDocs(query(collection(db, "binTossStudents"), where("teacherCode", "==", tc))),
    getDoc(doc(db, "binTossPredictions", tc)).catch(() => null),
    globalFrom(db),
  ]);
  return { classes: cs.docs.map((d) => d.data()), students: ss.docs.map((d) => d.data()), pred: ps && ps.exists() ? ps.data() : {}, glob };
}
export async function savePredictions(o) {
  try {
    initPortal("teacher");
    const tc = tCode();
    await setDoc(doc(getDb(), "binTossPredictions", tc), { teacherCode: tc, front: o.front ?? null, middle: o.middle ?? null, back: o.back ?? null, updatedAt: serverTimestamp() }, { merge: true });
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
}
const SPC = { f: "front", m: "middle", b: "back" };
export async function loadAllThrows() {
  initPortal("teacher");
  const db = getDb(), tc = tCode();
  const [ts, ss] = await Promise.all([
    getDocs(query(collection(db, "binTossThrows"), where("teacherCode", "==", tc))),
    getDocs(query(collection(db, "binTossStudents"), where("teacherCode", "==", tc))),
  ]);
  const names = {}; ss.docs.forEach((d) => { const x = d.data(); names[x.studentCode] = x.name || x.studentCode; });
  const rows = [];
  for (const d of ts.docs) {
    const b = d.data();
    for (const t of b.throws || []) {
      const p = String(t).split("|");
      rows.push({ name: names[b.studentCode] || b.studentCode, className: b.className || "", s: SPC[p[0]] || "back", a: +p[1], p: +p[2], i: p[3] === "1", h: p[5] === "1",
        at: new Date((+p[4] || b.at || 0) * 1000).toISOString().replace("T", " ").slice(0, 19), ts: +p[4] || 0 });
    }
  }
  return rows.sort((a, b) => a.ts - b.ts);
}
