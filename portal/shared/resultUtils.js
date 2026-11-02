/**
 * MMT Platform — shared result helpers (Phase 4A). PURE (no Firebase / DOM):
 * normalise compact `achievements` records, compute summary stats, build CSV +
 * copy-summary text. Used by both the Student and Teacher platforms.
 */
import { toolIdForAchievement } from "./mmtToolRegistry.js?v=6fdd718d";

export function num(v, d = 0) { const n = Number(v); return Number.isFinite(n) ? n : d; }

/** Below this share of a quiz, a part-finished attempt is recorded and still
 *  earns XP, but doesn't count towards mastery, win chips or topic averages.
 *  Kept in step with COVERAGE_FLOOR in /portal/shared/earlySubmit.js. */
export const COVERAGE_FLOOR = 50;

/** A short label for a part-finished attempt, e.g. "Partial · 7 of 15". */
export function partialLabel(r = {}) {
  return r.partial ? `Partial · ${num(r.attempted)} of ${num(r.quizLength)}` : "";
}

/** ms since epoch for a record's date-ish fields (newest-first sorting). */
export function recordTime(r = {}) {
  const c = r.createdAt;
  if (c && typeof c.toMillis === "function") { try { return c.toMillis(); } catch { /* noop */ } }
  if (c && typeof c.seconds === "number") return c.seconds * 1000;
  const s = r.createdAtClient || r.dateISO || r.date || r.timestamp;
  const t = s ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? t : 0;
}

export function formatDate(r) {
  const t = recordTime(r);
  if (!t) return "—";
  try { return new Date(t).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
  catch { return new Date(t).toISOString().slice(0, 10); }
}

/** Canonical view of one compact achievement record. */
export function normaliseAchievement(r = {}) {
  const total = num(r.total);
  const score = num(r.score);
  const percent = r.percent != null ? num(r.percent) : (total ? Math.round((score / total) * 100) : 0);
  return {
    id: r.id || null,
    studentCode: r.studentCode || r.code || "",
    studentName: r.studentName || r.name || "",
    className: r.className || "",
    teacherCode: r.teacherCode || "",
    teacherName: r.teacherName || r.teacher || "",
    school: r.school || "",
    tool: r.tool || r.toolName || "",
    toolId: toolIdForAchievement(r),
    topic: r.topic || r.masteryTopic || "",
    missionKind: r.missionKind || "",
    score, total, percent,
    // Shape of the attempt. A quiz submitted early records how far the student
    // got; older records have none of this and read as complete, which they are.
    partial: r.completion === "partial",
    quizLength: r.quizLength != null ? num(r.quizLength) : total,
    attempted: r.attempted != null ? num(r.attempted) : total,
    coverage: r.coverage != null ? num(r.coverage) : 100,
    // Below the coverage floor a part-finished attempt is still shown and still
    // earns XP, but it can't stand in for mastery of the topic.
    countsToMastery: r.countsToMastery != null ? !!r.countsToMastery
                     : (r.coverage != null ? num(r.coverage) >= COVERAGE_FLOOR : true),
    xpEarned: num(r.xpEarned),
    time: recordTime(r),
    dateLabel: formatDate(r),
    raw: r,
  };
}

/** Summary stats over a list of normalised records. */
export function summarise(records = []) {
  const n = records.length;
  const totalXp = records.reduce((a, r) => a + num(r.xpEarned), 0);
  // Every attempt counts as an attempt and earns its XP, but a part-finished
  // one below the coverage floor doesn't move the average or the best — three
  // right answers out of fifteen questions isn't a 100%.
  const counted = records.filter(r => r.countsToMastery !== false);
  const c = counted.length;
  const avg = c ? Math.round(counted.reduce((a, r) => a + num(r.percent), 0) / c) : 0;
  const best = counted.reduce((m, r) => Math.max(m, num(r.percent)), 0);
  return { attempts: n, averagePercent: avg, bestPercent: best, totalXp, counted: c, partials: n - c };
}

/** Per-student rollup for the teacher table. */
export function rollupByStudent(records = []) {
  const map = new Map();
  for (const r of records) {
    const key = r.studentCode || r.studentName || "?";
    if (!map.has(key)) map.set(key, { studentCode: r.studentCode, studentName: r.studentName, className: r.className, items: [] });
    map.get(key).items.push(r);
  }
  return [...map.values()].map((s) => {
    const items = s.items.sort((a, b) => b.time - a.time);
    const sum = summarise(items);
    return {
      studentCode: s.studentCode, studentName: s.studentName, className: s.className,
      attempts: sum.attempts, averagePercent: sum.averagePercent, bestPercent: sum.bestPercent,
      latest: items[0] || null, lastActive: items[0] ? items[0].dateLabel : "—",
      needsSupport: sum.attempts > 0 && sum.averagePercent < 50,
    };
  }).sort((a, b) => (a.className || "").localeCompare(b.className || "") || (a.studentName || "").localeCompare(b.studentName || ""));
}

const CSV_COLS = ["studentName", "studentCode", "className", "tool", "topic", "missionKind", "score", "total", "percent", "xpEarned", "dateLabel"];

export function toCSV(records = []) {
  const esc = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const head = CSV_COLS.join(",");
  const rows = records.map((r) => CSV_COLS.map((c) => esc(r[c])).join(","));
  return [head, ...rows].join("\n");
}

export function summaryText(records = [], heading = "MMT Results Summary") {
  const s = summarise(records);
  return [
    heading,
    `Attempts: ${s.attempts}`,
    `Average: ${s.averagePercent}%`,
    `Best: ${s.bestPercent}%`,
    `Total XP: ${s.totalXp}`,
  ].join("\n");
}
