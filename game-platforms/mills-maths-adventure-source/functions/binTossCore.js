/**
 * Bin Toss: Student Interactive — the pure part of recordBinTossThrows (2026-11-28).
 * No Firebase in here, so it is unit-tested in Node. binToss.js wraps it in a callable + transaction.
 *
 * Documents it builds (all written ONLY by the function, never by a browser):
 *   binTossStudents/{studentCode}        one per student: name, class, per-spot n / in / prediction, rate limit
 *   binTossStats/c_<teacher>__<classKey> one per class: per-spot totals, by angle, prediction average,
 *                                        checkpoints every 10 throws (cpN/cpIn), last 120 throws (no names)
 *   binTossStats/global_s0 … global_s9   ten shards of the all-MMT totals (no names), last 40 throws each
 *   binTossThrows/{auto}                 the raw batch, for the teacher's CSV
 * A throw is stored compactly as "spot|angle|power|in|unixSeconds|hard", e.g. "b|35|79.1|1|1764300000|0".
 */
const SPOTS = { front: "f", middle: "m", back: "b" };
const MAX_BATCH = 20, PER_MIN = 60, CLASS_RING = 120, GLOBAL_RING = 40, MAX_CP = 200, SHARDS = 10;

function validate(data) {
  const d = data || {}, out = { throws: [], preds: {} };
  if (!Array.isArray(d.throws) || d.throws.length < 1 || d.throws.length > MAX_BATCH) throw new Error("bad-batch");
  for (const x of d.throws) {
    if (!x || !SPOTS[x.s]) throw new Error("bad-spot");
    const a = Number(x.a), p = Number(x.p);
    if (!Number.isInteger(a) || a < 15 || a > 75) throw new Error("bad-angle");
    if (!Number.isFinite(p) || p < 0 || p > 100) throw new Error("bad-power");
    out.throws.push({ s: x.s, a, p: Math.round(p * 10) / 10, i: x.i ? 1 : 0, h: x.h ? 1 : 0 });
  }
  if (d.preds && typeof d.preds === "object") for (const k of Object.keys(SPOTS)) {
    const v = d.preds[k];
    if (v != null && Number.isFinite(Number(v))) out.preds[k] = Math.max(0, Math.min(100, Math.round(Number(v))));
  }
  return out;
}
const classKey = (name) => (String(name || "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "none");
const classDocId = (teacherCode, className) => `c_${teacherCode || "none"}__${classKey(className)}`;
const enc = (x, now) => `${SPOTS[x.s]}|${x.a}|${x.p}|${x.i}|${now}|${x.h}`;
const bucket = (a) => String(Math.round(a / 5) * 5);
const spotsOf = (doc) => { const o = {}; for (const k of Object.keys(SPOTS)) o[k] = Object.assign({ n: 0, in: 0 }, (doc && doc.spots && doc.spots[k]) || {}); return o; };

/** Rate limit: at most PER_MIN throws in any 60-second window (per student). */
function rate(studentDoc, n, now) {
  const r = (studentDoc && studentDoc.rate) || { t: 0, c: 0 };
  const fresh = now - (r.t || 0) >= 60;
  const c = (fresh ? 0 : r.c || 0) + n;
  if (c > PER_MIN) return { ok: false };
  return { ok: true, rate: { t: fresh ? now : r.t, c } };
}
function applyStudent(doc, clean, info, now, rateV) {
  const spots = spotsOf(doc);
  for (const x of clean.throws) { spots[x.s].n++; spots[x.s].in += x.i; }
  for (const k in clean.preds) if (spots[k].pred == null) spots[k].pred = clean.preds[k];
  const n = Object.values(spots).reduce((a, s) => a + s.n, 0), ins = Object.values(spots).reduce((a, s) => a + s.in, 0);
  return { studentCode: info.studentCode, teacherCode: info.teacherCode, className: info.className, name: info.name || (doc && doc.name) || "",
    spots, n, in: ins, lastAt: now, rate: rateV };
}
function applyClass(doc, clean, studentBefore, info, now) {
  const spots = spotsOf(doc), before = spotsOf(studentBefore);
  for (const k in spots) { spots[k].ang = Object.assign({}, spots[k].ang || {}); spots[k].cpN = (spots[k].cpN || []).slice(); spots[k].cpIn = (spots[k].cpIn || []).slice(); spots[k].predSum = spots[k].predSum || 0; spots[k].predN = spots[k].predN || 0; }
  for (const x of clean.throws) {
    const s = spots[x.s]; s.n++; s.in += x.i;
    const b = bucket(x.a); s.ang[b] = { n: ((s.ang[b] && s.ang[b].n) || 0) + 1, in: ((s.ang[b] && s.ang[b].in) || 0) + x.i };
    if (s.n % 10 === 0) { s.cpN.push(s.n); s.cpIn.push(s.in); if (s.cpN.length > MAX_CP) { s.cpN = s.cpN.filter((_, i) => i % 2); s.cpIn = s.cpIn.filter((_, i) => i % 2); } }
  }
  for (const k in clean.preds) if (before[k].pred == null) { spots[k].predSum += clean.preds[k]; spots[k].predN++; }
  const recent = ((doc && doc.recent) || []).concat(clean.throws.map((x) => enc(x, now))).slice(-CLASS_RING);
  return { kind: "class", teacherCode: info.teacherCode, className: info.className, spots, recent, updatedAt: now };
}
function applyGlobal(doc, clean, now) {
  const spots = spotsOf(doc);
  for (const k in spots) spots[k].ang = Object.assign({}, spots[k].ang || {});
  for (const x of clean.throws) {
    const s = spots[x.s]; s.n++; s.in += x.i;
    const b = bucket(x.a); s.ang[b] = { n: ((s.ang[b] && s.ang[b].n) || 0) + 1, in: ((s.ang[b] && s.ang[b].in) || 0) + x.i };
  }
  const recent = ((doc && doc.recent) || []).concat(clean.throws.map((x) => enc(x, now))).slice(-GLOBAL_RING);
  return { kind: "global", spots, recent, updatedAt: now };
}
function rawBatch(clean, info, now) {
  return { studentCode: info.studentCode, teacherCode: info.teacherCode, className: info.className,
    throws: clean.throws.map((x) => enc(x, now)), n: clean.throws.length, ins: clean.throws.reduce((a, x) => a + x.i, 0), at: now };
}
module.exports = { SPOTS, SHARDS, MAX_BATCH, PER_MIN, validate, classKey, classDocId, rate, applyStudent, applyClass, applyGlobal, rawBatch };
