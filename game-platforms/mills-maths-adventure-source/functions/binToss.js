/**
 * recordBinTossThrows({ throws:[{s,a,p,i,h}], preds:{front?,middle?,back?} }) → { ok, saved }
 *
 * Bin Toss: Student Interactive (2026-11-28). Caller MUST be signed in as a student (role claim from
 * exchangeStudentCode). studentCode / teacherCode / className come from the VERIFIED token, never from the
 * browser. One transaction updates the student's doc, their class's totals and one random all-MMT shard, and
 * stores the raw batch. Validation and the maths are in binTossCore.js (unit-tested). Stall customers are
 * simulated in the browser and are never sent here: only the student's own practice throws are.
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const core = require("./binTossCore");

exports.recordBinTossThrows = onCall(async (request) => {
  const tok = (request.auth && request.auth.token) || {};
  if (!request.auth || tok.role !== "student" || !tok.studentCode) throw new HttpsError("permission-denied", "Sign in with your student code to save throws.");
  let clean;
  try { clean = core.validate(request.data); } catch (e) { throw new HttpsError("invalid-argument", "That batch of throws doesn't look right."); }
  const db = admin.firestore(), now = Math.floor(Date.now() / 1000);
  const info = { studentCode: tok.studentCode, teacherCode: tok.teacherCode || "", className: tok.className || "" };
  const sRef = db.collection("binTossStudents").doc(info.studentCode);
  const cRef = db.collection("binTossStats").doc(core.classDocId(info.teacherCode, info.className));
  const gRef = db.collection("binTossStats").doc("global_s" + Math.floor(Math.random() * core.SHARDS));
  const rRef = db.collection("binTossThrows").doc();
  await db.runTransaction(async (tx) => {
    const [sSnap, cSnap, gSnap] = await Promise.all([tx.get(sRef), tx.get(cRef), tx.get(gRef)]);
    const sDoc = sSnap.exists ? sSnap.data() : null;
    const r = core.rate(sDoc, clean.throws.length, now);
    if (!r.ok) throw new HttpsError("resource-exhausted", "Too many throws too quickly. Try again in a minute.");
    if (!sDoc || !sDoc.name) {
      const st = await tx.get(db.collection("students").doc(info.studentCode));
      const d = st.exists ? st.data() : {};
      info.name = d.name || [d.firstName, d.surname].filter(Boolean).join(" ") || info.studentCode;
    }
    tx.set(sRef, core.applyStudent(sDoc, clean, info, now, r.rate));
    tx.set(cRef, core.applyClass(cSnap.exists ? cSnap.data() : null, clean, sDoc, info, now));
    tx.set(gRef, core.applyGlobal(gSnap.exists ? gSnap.data() : null, clean, now));
    tx.set(rRef, Object.assign(core.rawBatch(clean, info, now), { createdAt: admin.firestore.FieldValue.serverTimestamp() }));
  });
  return { ok: true, saved: clean.throws.length };
});
