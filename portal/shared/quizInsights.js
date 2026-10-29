/**
 * MMT QUIZ INSIGHTS (2026-10-29) — PURE helpers (no DOM, no Firebase) behind the
 * teacher's Results & Analytics. Reads the normalised achievement records from
 * resultUtils.normaliseAchievement (each has .raw = the stored doc).
 *
 * THE KEY JOB: quizzes save their per-question-type marks in FOUR shapes, and
 * this file turns all of them into one list of skills { id, label, ok, total }:
 *   1. types[] strings  "share:3/4"            (Stage 3 quizzes, counting strategies,
 *                                               perimeter, stacked bar …)
 *   2. types[] objects  {typeId,label,ok|correct,total}   (integers, angles, FDP,
 *                                               algebraic techniques, double number line…)
 *   3. a `breakdown` map {type:{correct,total,label}}      (equations)
 *   4. one tag per question "mild-obtuse-area-wrong"       (area of a triangle)
 * Everything else in types[] ("level:x", "lang:ar", "estimate:close",
 * "usedUnitReveal", "op:add" …) is a FACET: context, not marks.
 * A new quiz that saves "key:right/total" strings needs nothing here; add its
 * keys to SKILL_LABELS for nicer names.
 */
import { summarise } from "./resultUtils.js";

/* ---------- labels ---------- */
export const SKILL_LABELS = {
  // division by grouping
  share: "Share it out", left: "How many left?", rem: "With a remainder", inverse: "Missing factor", word: "Use it (word problems)",
  // multiply / divide by 10
  mult: "Multiply", div: "Divide", missing: "What is missing",
  // counting strategies
  count: "Counting", table: "Tables", equation: "Equations", meaning: "What the numbers mean", plot: "Plotting", apply: "Using it",
  // perimeter / area / ratio / additive
  perimeter: "Perimeter", "missing-side": "Finding a missing side", area: "Area",
  type1: "Share a total", type2: "One share is known", type3: "The difference is known", onepart: "Finding one part",
  add: "Addition by compensation", subtract: "Subtraction (constant difference)",
};
// keys saved as "n/t" that count a STRATEGY used, not marks
const STRATEGY_KEYS = { usedten: "Bridged through a ten" };
const FACET_LABELS = {
  level: "Level", lang: "Language", quadrants: "Quadrants", model: "Model", estimate: "Estimate", op: "Operation", kind: "Question kind",
};
const LANG_NAMES = { ar: "Arabic", fa: "Farsi", en: "English" };
export const LEVEL_ORDER = ["sweet","mild","medium","spicy","extra spicy","extraspicy","extra hot","extrahot","basic","foundation","core","expected","advanced","extension","challenge"];

function humanise(id) {
  const s = String(id || "").replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : "Question";
}
function cleanText(s) { return String(s ?? "").replace(/<[^>]*>/g, " ").replace(/[^\p{L}\p{N}\s'’()+\-/&,.]/gu, "").replace(/\s+/g, " ").trim(); }
export function levelKeyOf(s) { return cleanText(s).toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim(); }
const titleCase = (s) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

/** The level an attempt was played at → { key, label } ("" when the quiz has no levels). */
export function levelOf(r) {
  const raw = r.raw || r;
  const tag = (Array.isArray(raw.types) ? raw.types : []).filter((x) => typeof x === "string").find((x) => /^level:/i.test(x));
  const label = cleanText(raw.englishLevel || raw.level);
  const key = levelKeyOf(label) || levelKeyOf(raw.levelKey) || levelKeyOf(tag ? tag.slice(6) : "");
  return { key, label: label || (key ? titleCase(key) : "") };
}
export function levelRank(key) { const i = LEVEL_ORDER.indexOf(key); return i < 0 ? 999 : i; }

/** Group key for "which quiz is this": the registry toolId, else the tool name. */
export function quizKey(r) { return r.toolId && r.toolId !== "other" ? r.toolId : ("tool:" + (r.tool || "unknown")); }

/* ---------- skills from one attempt ---------- */
const N = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const TRI_RE = /^([a-z]+)(-obtuse)?-(missing|area)(-wrong)?$/i;

/** Per-question-type marks for one attempt: [{ id, label, ok, total }]. */
export function skillsOf(r) {
  const raw = r.raw || r;
  const out = new Map();
  const put = (id, label, ok, total) => {
    if (!(total > 0)) return;
    const e = out.get(id) || { id, label: label || SKILL_LABELS[id] || humanise(id), ok: 0, total: 0 };
    e.ok += Math.max(0, Math.min(ok, total)); e.total += total; out.set(id, e);
  };
  const types = Array.isArray(raw.types) ? raw.types : [];
  for (const t of types) {
    if (t && typeof t === "object") {
      const id = String(t.typeId || t.id || t.label || "").trim(); if (!id) continue;
      put(id, cleanText(t.label) || undefined, N(t.ok != null ? t.ok : t.correct), N(t.total));
      continue;
    }
    if (typeof t !== "string") continue;
    let m = /^([\w-]+):(\d+)\/(\d+)$/.exec(t);
    if (m) { if (STRATEGY_KEYS[m[1]]) continue; put(m[1], undefined, N(m[2]), N(m[3])); continue; }
    m = TRI_RE.exec(t);
    if (m && /^(sweet|mild|medium|spicy|extra|basic|expected)/i.test(m[1])) {
      const id = (m[3] === "missing" ? "tri-missing" : "tri-area") + (m[2] ? "-obtuse" : "");
      const label = (m[3] === "missing" ? "Find a missing length" : "Find the area") + (m[2] ? " (obtuse)" : "");
      put(id, label, m[4] ? 0 : 1, 1);
    }
  }
  if (raw.breakdown && typeof raw.breakdown === "object" && !Array.isArray(raw.breakdown)) {
    for (const [id, v] of Object.entries(raw.breakdown)) if (v && typeof v === "object") put(id, cleanText(v.label) || undefined, N(v.correct != null ? v.correct : v.ok), N(v.total));
  }
  return [...out.values()];
}

/** Context tags on one attempt: [{ group, value, label }] (never marks). */
export function facetsOf(r) {
  const raw = r.raw || r; const out = [];
  for (const t of (Array.isArray(raw.types) ? raw.types : [])) {
    if (typeof t !== "string") continue;
    let m = /^([a-z]+):([\w-]+)$/i.exec(t);
    if (m && FACET_LABELS[m[1]] && m[1] !== "level") {
      const v = m[2]; out.push({ group: FACET_LABELS[m[1]], value: v, label: m[1] === "lang" ? (LANG_NAMES[v] || v) : humanise(v) }); continue;
    }
    m = /^(\w+):(\d+)\/(\d+)$/.exec(t);
    if (m && STRATEGY_KEYS[m[1]]) { out.push({ group: STRATEGY_KEYS[m[1]], value: "q", label: `${m[2]} of ${m[3]} questions`, n: N(m[2]), t: N(m[3]) }); continue; }
    m = /^used([A-Z]\w*)Reveal$/.exec(t);
    if (m) out.push({ group: "Used a reveal", value: m[1], label: `Used the ${humanise(m[1]).toLowerCase()} reveal` });
  }
  return out;
}

/* ---------- tasks ---------- */
/** Attempts that count for a set task: same quiz, same class, made since it was set. */
export function taskRecords(task, records) {
  const since = Number(task.assignedAt) || 0;
  return records.filter((r) => (r.toolId || "") === task.toolId && (!task.className || (r.className || "") === task.className) && (!since || !r.time || r.time >= since - 60000));
}
export function taskLevel(task) {
  try { return levelKeyOf(new URL(task.launchUrl || "", "https://x.invalid").searchParams.get("level") || ""); } catch { return ""; }
}

/* ---------- per-student and class roll-ups for ONE quiz ---------- */
const better = (a, b) => !b || a.percent > b.percent || (a.percent === b.percent && a.score > b.score);

/**
 * roster: [{ code, name, className }] — who SHOULD have done it (a class, or [] to
 * use whoever attempted). records: the attempts in scope (one quiz).
 */
export function quizReport(records, roster = []) {
  const byStu = new Map();
  const ensure = (code, name, cls) => { if (!byStu.has(code)) byStu.set(code, { code, name: name || code, className: cls || "", items: [] }); return byStu.get(code); };
  roster.forEach((s) => ensure(s.code, s.name, s.className));
  records.forEach((r) => ensure(r.studentCode || r.studentName || "?", r.studentName, r.className).items.push(r));

  const skillMeta = new Map(); // id -> { id, label }
  const levelMap = new Map();
  const students = [...byStu.values()].map((s) => {
    const items = s.items.slice().sort((a, b) => a.time - b.time);
    const counted = items.filter((r) => r.countsToMastery !== false);
    let best = null; counted.forEach((r) => { if (better(r, best)) best = r; });
    const first = counted[0] || null, last = items[items.length - 1] || null;
    const skills = new Map();
    items.forEach((r) => skillsOf(r).forEach((k) => {
      if (!skillMeta.has(k.id)) skillMeta.set(k.id, { id: k.id, label: k.label });
      const e = skills.get(k.id) || { ok: 0, total: 0 }; e.ok += k.ok; e.total += k.total; skills.set(k.id, e);
    }));
    const levels = new Map();
    items.forEach((r) => {
      const lv = levelOf(r);
      const e = levels.get(lv.key) || { key: lv.key, label: lv.label || "—", attempts: 0, best: null };
      e.attempts++; if (r.countsToMastery !== false && better(r, e.best)) e.best = r; levels.set(lv.key, e);
      if (!levelMap.has(lv.key)) levelMap.set(lv.key, { key: lv.key, label: lv.label || "Quiz", students: new Set(), bests: new Map() });
      const L = levelMap.get(lv.key); L.students.add(s.code);
      if (r.countsToMastery !== false) { const cur = L.bests.get(s.code); if (better(r, cur)) L.bests.set(s.code, r); }
    });
    const bestLevel = best ? levelOf(best) : null;
    return {
      code: s.code, name: s.name, className: s.className, attempts: items.length, started: items.length > 0,
      best: best ? best.percent : null, bestScore: best ? `${best.score}/${best.total}` : "", bestLevel: bestLevel && bestLevel.label,
      first: first ? first.percent : null, gain: best && first ? best.percent - first.percent : null,
      last: last ? last.time : 0, onlyPartial: items.length > 0 && !counted.length,
      skills: Object.fromEntries([...skills.entries()].map(([id, v]) => [id, { ...v, rate: v.total ? Math.round((v.ok / v.total) * 100) : null }])),
    };
  });

  const started = students.filter((s) => s.started);
  const bests = started.map((s) => s.best).filter((v) => v != null).sort((a, b) => a - b);
  const median = bests.length ? (bests.length % 2 ? bests[(bests.length - 1) / 2] : Math.round((bests[bests.length / 2 - 1] + bests[bests.length / 2]) / 2)) : null;

  // Skills: each student's own success rate on that skill, averaged over the students who met it.
  const skills = [...skillMeta.values()].map((k) => {
    const rates = []; let ok = 0, total = 0; const below = [];
    started.forEach((s) => { const v = s.skills[k.id]; if (!v || !v.total) return; rates.push(v.ok / v.total); ok += v.ok; total += v.total; if (v.ok / v.total < 0.5) below.push(s); });
    return { id: k.id, label: k.label, students: rates.length, rate: rates.length ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100) : null, ok, total, below };
  }).filter((k) => k.students > 0).sort((a, b) => a.rate - b.rate || b.students - a.students);

  const levels = [...levelMap.values()].map((L) => {
    const bs = [...L.bests.values()].map((r) => r.percent);
    return { key: L.key, label: L.label, students: L.students.size, avgBest: bs.length ? Math.round(bs.reduce((a, b) => a + b, 0) / bs.length) : null };
  }).sort((a, b) => levelRank(a.key) - levelRank(b.key));

  const facets = new Map();
  records.forEach((r) => facetsOf(r).forEach((f) => {
    const g = facets.get(f.group) || new Map(); const e = g.get(f.label) || { label: f.label, n: 0, sumN: 0, sumT: 0 };
    e.n++; if (f.t) { e.sumN += f.n; e.sumT += f.t; } g.set(f.label, e); facets.set(f.group, g);
  }));

  const bands = [{ label: "Under 50%", min: 0, max: 49 }, { label: "50–69%", min: 50, max: 69 }, { label: "70–84%", min: 70, max: 84 }, { label: "85–100%", min: 85, max: 100 }]
    .map((b) => ({ ...b, n: bests.filter((v) => v >= b.min && v <= b.max).length }));

  return {
    students: students.sort((a, b) => (b.started - a.started) || (a.best ?? -1) - (b.best ?? -1) || a.name.localeCompare(b.name)),
    started: started.length, notStarted: students.filter((s) => !s.started), roster: students.length,
    attempts: records.length, avgBest: bests.length ? Math.round(bests.reduce((a, b) => a + b, 0) / bests.length) : null, median,
    avgAttempts: started.length ? Math.round((records.length / started.length) * 10) / 10 : 0,
    improved: started.filter((s) => s.gain != null && s.gain >= 10).length,
    skills, hasSkills: skills.length > 0, levels, bands,
    facets: [...facets.entries()].map(([group, m]) => ({ group, items: [...m.values()].sort((a, b) => b.n - a.n) })),
  };
}

/* ---------- skills across many quizzes ---------- */
export function skillsAcross(records, quizTitle) {
  const byQuiz = new Map();
  records.forEach((r) => { const k = quizKey(r); if (!byQuiz.has(k)) byQuiz.set(k, []); byQuiz.get(k).push(r); });
  const out = [];
  for (const [qk, recs] of byQuiz) {
    const rep = quizReport(recs, []);
    rep.skills.forEach((s) => out.push({ quiz: qk, quizTitle: quizTitle(qk, recs[0]), ...s }));
  }
  return out.sort((a, b) => a.rate - b.rate || b.students - a.students);
}

/* ---------- windows ---------- */
export const DAY = 86400000;
export function windowStats(records, rosterSize) {
  const s = summarise(records);
  const active = new Set(records.map((r) => r.studentCode).filter(Boolean)).size;
  return { attempts: s.attempts, avg: s.averagePercent, active, participation: rosterSize ? Math.round((active / rosterSize) * 100) : 0 };
}
