/**
 * RESULT UTILS (Phase 2L) — PURE aggregation + export over local result records.
 *
 * Turns a flat list of attempt records into the topic/skill/teacher summaries
 * the Results Centre and Student Progress views show, and into JSON/CSV exports.
 * No React, no stores, no DOM — fully testable in Node.
 */
import { statusForAverage, MASTERY } from "./resultTypes.js";

function avg(nums) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/**
 * The island friends' PASS MARK (Pip = integers, Fern = fdp, Alby = algebra) —
 * the Achievements Wall ticks a friend off at this best score. (Until
 * 2026-10-09 it also kept the Retrieval Practice Playground locked; that gate
 * is open now. isPlaygroundUnlocked is kept for reference/back-compat only.)
 */
export const PLAYGROUND_PASS_MARK = 80;
export const PLAYGROUND_REQUIRED_TOPICS = ["integers", "fdp", "algebra"];

/** True once integers, fdp AND algebra each have a best score ≥ the pass mark. */
export function isPlaygroundUnlocked(results = []) {
  const byId = new Map(summariseByTopic(results).map((t) => [t.topicId, t.bestScore || 0]));
  return PLAYGROUND_REQUIRED_TOPICS.every((id) => (byId.get(id) || 0) >= PLAYGROUND_PASS_MARK);
}

/** Sort newest first (by completedAt). Returns a new array. */
export function sortByRecent(results = []) {
  return [...results].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
}

/**
 * Topic summary — aggregates ATTEMPTS by each topic the attempt covered.
 * Returns [{ topicId, topicName, attempts, latestScore, bestScore,
 *            avgPercentage, passCount, failCount, lastAttempted, status }].
 */
export function summariseByTopic(results = []) {
  const map = new Map();
  for (const r of sortByRecent(results)) {
    const ids = r.topicIds && r.topicIds.length ? r.topicIds : ["(unknown)"];
    ids.forEach((id, i) => {
      const name = (r.topicNames && r.topicNames[i]) || id;
      if (!map.has(id)) {
        map.set(id, { topicId: id, topicName: name, _pcts: [], attempts: 0, passCount: 0, failCount: 0, latestScore: null, bestScore: 0, lastAttempted: 0 });
      }
      const e = map.get(id);
      e.attempts += 1;
      e._pcts.push(r.percentage);
      if (r.passed) e.passCount += 1; else e.failCount += 1;
      if (e.latestScore === null || (r.completedAt || 0) > e.lastAttempted) e.latestScore = r.percentage;
      e.bestScore = Math.max(e.bestScore, r.percentage);
      e.lastAttempted = Math.max(e.lastAttempted, r.completedAt || 0);
      if (name && name !== id) e.topicName = name;
    });
  }
  return [...map.values()].map((e) => {
    const avgPercentage = avg(e._pcts);
    delete e._pcts;
    return { ...e, avgPercentage, status: statusForAverage(avgPercentage, e.attempts) };
  });
}

/**
 * Skill summary — aggregates QUESTION-level results by skill (more granular).
 * Returns [{ skillId, skillName, questions, correct, avgPercentage, status,
 *            lastAttempted }].
 */
export function summariseBySkill(results = []) {
  const map = new Map();
  for (const r of results) {
    for (const q of r.questionResults || []) {
      const id = q.skillId || "(unknown)";
      if (!map.has(id)) map.set(id, { skillId: id, skillName: id, questions: 0, correct: 0, lastAttempted: 0 });
      const e = map.get(id);
      e.questions += 1;
      if (q.correct) e.correct += 1;
      e.lastAttempted = Math.max(e.lastAttempted, r.completedAt || 0);
    }
    // Prefer the human skill name from the attempt's skillNames where available.
    (r.skillIds || []).forEach((sid, i) => {
      const nm = (r.skillNames || [])[i];
      if (nm && map.has(sid)) map.get(sid).skillName = nm;
    });
  }
  return [...map.values()].map((e) => {
    const avgPercentage = e.questions ? Math.round((e.correct / e.questions) * 100) : 0;
    return { ...e, avgPercentage, status: statusForAverage(avgPercentage, e.questions) };
  });
}

/** Answer-mode breakdown across all question results. */
export function summariseByAnswerMode(results = []) {
  const map = new Map();
  for (const r of results) {
    for (const q of r.questionResults || []) {
      const m = q.answerMode || "simple";
      if (!map.has(m)) map.set(m, { answerMode: m, questions: 0, correct: 0 });
      const e = map.get(m);
      e.questions += 1;
      if (q.correct) e.correct += 1;
    }
  }
  return [...map.values()].map((e) => ({ ...e, avgPercentage: e.questions ? Math.round((e.correct / e.questions) * 100) : 0 }));
}

/**
 * Teacher-style summary (local). Answers: what was attempted, which topics were
 * practised, which skills are strong / need practice, which attempts failed, and
 * which answer modes caused difficulty.
 */
export function teacherSummary(results = []) {
  const topics = summariseByTopic(results);
  const skills = summariseBySkill(results);
  const modes = summariseByAnswerMode(results);
  return {
    attemptCount: results.length,
    missionsAttempted: [...new Set(results.map((r) => r.missionTitle).filter(Boolean))],
    topicsPractised: topics.map((t) => t.topicName),
    strongSkills: skills.filter((s) => s.status === MASTERY.SECURE),
    developingSkills: skills.filter((s) => s.status === MASTERY.DEVELOPING),
    needPracticeSkills: skills.filter((s) => s.status === MASTERY.NEEDS),
    failedAttempts: results.filter((r) => !r.passed),
    answerModeStats: modes,
    byTopic: topics,
    bySkill: skills,
  };
}

/** Student-friendly progress snapshot. */
export function studentProgress(results = [], extras = {}) {
  const recent = sortByRecent(results).slice(0, 8);
  const topics = summariseByTopic(results);
  const best = {};
  for (const r of results) {
    for (const id of r.topicIds || []) best[id] = Math.max(best[id] || 0, r.percentage);
  }
  return {
    studentName: extras.studentName || (results[0] && results[0].studentName) || "Explorer",
    attemptCount: results.length,
    completedMissions: extras.completedMissions || [],
    badges: extras.badges || [],
    recent,
    topicSummary: topics,
    bestScores: best,
  };
}

// ---- Insights (Phase 2M) --------------------------------------------------

/** Overall snapshot: totals, average, latest attempt. */
export function overallSnapshot(results = []) {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const pcts = results.map((r) => r.percentage);
  return { total, passed, failed: total - passed, avgPercentage: avg(pcts), latest: sortByRecent(results)[0] || null };
}

/** Per-attempt answer-mode breakdown string, e.g. "simple:3/4; comparison:1/1". */
export function answerModeSummary(result = {}) {
  const m = {};
  for (const q of result.questionResults || []) {
    const k = q.answerMode || "simple";
    m[k] = m[k] || { c: 0, t: 0 };
    m[k].t += 1;
    if (q.correct) m[k].c += 1;
  }
  return Object.entries(m).map(([k, v]) => `${k}:${v.c}/${v.t}`).join("; ");
}

/** Answer modes ordered hardest-first (lowest accuracy). */
export function hardestAnswerModes(results = []) {
  return summariseByAnswerMode(results)
    .filter((m) => m.questions >= 1)
    .sort((a, b) => a.avgPercentage - b.avgPercentage);
}

/** Missions with two or more failed attempts. */
export function repeatedFailures(results = []) {
  const by = {};
  for (const r of results) {
    if (!r.passed) {
      const k = r.missionTitle || r.missionId || "Unknown mission";
      by[k] = (by[k] || 0) + 1;
    }
  }
  return Object.entries(by).filter(([, n]) => n >= 2).map(([title, count]) => ({ title, count }));
}

/** Topics with the lowest average results (for "needs attention"). */
export function lowTopics(results = [], threshold = 60) {
  return summariseByTopic(results)
    .filter((t) => t.attempts >= 1 && t.avgPercentage < threshold)
    .sort((a, b) => a.avgPercentage - b.avgPercentage);
}

/**
 * A simple, RULE-BASED next-step recommendation (no AI). Picks the weakest skill
 * and frames it with the weakest topic for context. Returns null if no data.
 */
export function suggestedNextStep(results = []) {
  if (!results.length) return null;
  const skills = summariseBySkill(results).filter((s) => s.questions >= 1);
  if (!skills.length) return null;
  const weakest = [...skills].sort((a, b) => a.avgPercentage - b.avgPercentage)[0];
  if (weakest.avgPercentage >= 80) {
    return "Great work — every skill is looking secure. Try a harder mission to keep stretching!";
  }
  const topics = summariseByTopic(results).filter((t) => t.attempts >= 1).sort((a, b) => a.avgPercentage - b.avgPercentage);
  const topicName = topics[0] ? topics[0].topicName : "this topic";
  return `Next step: revisit ${topicName} — ${weakest.skillName} is showing the lowest accuracy (${weakest.avgPercentage}%).`;
}

/** A readable plain-English local teacher report (for "Copy teacher summary"). */
export function teacherReportText(results = []) {
  if (!results.length) return "Mills Maths Adventure — no attempts recorded yet.";
  const s = overallSnapshot(results);
  const t = teacherSummary(results);
  const lines = [];
  lines.push("Mills Maths Adventure — local results report");
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");
  lines.push(`Attempts: ${s.total}  (passed ${s.passed}, failed ${s.failed})  ·  average ${s.avgPercentage}%`);
  lines.push(`Topics practised: ${t.topicsPractised.join(", ") || "—"}`);
  if (t.strongSkills.length) lines.push(`Strong skills: ${t.strongSkills.map((x) => `${x.skillName} (${x.avgPercentage}%)`).join(", ")}`);
  if (t.developingSkills.length) lines.push(`Developing: ${t.developingSkills.map((x) => `${x.skillName} (${x.avgPercentage}%)`).join(", ")}`);
  if (t.needPracticeSkills.length) lines.push(`Needs practice: ${t.needPracticeSkills.map((x) => `${x.skillName} (${x.avgPercentage}%)`).join(", ")}`);
  const hard = hardestAnswerModes(results)[0];
  if (hard) lines.push(`Hardest answer mode: ${hard.answerMode} (${hard.avgPercentage}%)`);
  const rep = repeatedFailures(results);
  if (rep.length) lines.push(`Repeated failed missions: ${rep.map((r) => `${r.title} ×${r.count}`).join(", ")}`);
  const next = suggestedNextStep(results);
  if (next) { lines.push(""); lines.push(next); }
  return lines.join("\n");
}

/**
 * A short plain-English summary of ONE attempt (Phase 2P) — for the completion
 * screen's "Copy Result Summary" button. Example:
 *   "Jeff (7M-12) completed Mixed Year 7 Review with 8/10 correct (80%).
 *    Result: passed. Saved locally on this device."
 */
export function resultSummaryText(r = {}) {
  const name = r.studentName || "Student";
  const who = r.studentCode ? `${name} (${r.studentCode})` : name;
  const title = r.missionTitle || "a mission";
  const verdict = r.passed ? "passed" : "not passed";
  return `${who} completed ${title} with ${r.correctCount || 0}/${r.questionCount || 0} correct (${r.percentage || 0}%). Result: ${verdict}. Saved locally on this device.`;
}

// ---- Export ---------------------------------------------------------------

/** A clean JSON export string (Firebase-ready). */
export function toJSON(results = []) {
  return JSON.stringify(
    { source: "mills-maths-adventure-local", exportedAt: new Date().toISOString(), count: results.length, results },
    null,
    2
  );
}

// CSV-escape a single cell (handles commas, quotes, and newlines).
export function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rangeStr(r) {
  return r && typeof r === "object" ? `${r.min}-${r.max}` : "";
}

/** Attempt-level CSV (one row per attempt) with teacher-facing columns. */
export function toCSV(results = []) {
  const cols = [
    "attemptId", "completedAt", "playerName", "missionTitle", "missionKind",
    "stage", "topicNames", "skillNames", "questionCount", "correctCount",
    "percentage", "passed", "status", "durationSeconds", "difficultyRange",
    "answerModeSummary", "source",
  ];
  const rows = sortByRecent(results).map((r) => [
    r.attemptId,
    new Date(r.completedAt || 0).toISOString(),
    r.studentName,
    r.missionTitle,
    r.missionKind,
    r.stage,
    (r.topicNames || []).join(" | "),
    (r.skillNames || []).join(" | "),
    r.questionCount,
    r.correctCount,
    r.percentage,
    r.passed,
    r.status,
    r.durationSeconds,
    rangeStr(r.difficultyRange),
    answerModeSummary(r),
    r.source,
  ].map(csvCell).join(","));
  return [cols.join(","), ...rows].join("\n");
}

/** Question-level CSV (one row per question across all attempts). */
export function toQuestionCSV(results = []) {
  const cols = [
    "attemptId", "completedAt", "playerName", "missionTitle", "topicName",
    "skillName", "questionNumber", "prompt", "answerMode", "studentAnswer",
    "expectedAnswer", "correct", "difficulty", "diagramType", "sourceType",
  ];
  const rows = [];
  for (const r of sortByRecent(results)) {
    // Map topic/skill ids → names using this attempt's parallel arrays.
    const topicName = {};
    (r.topicIds || []).forEach((id, i) => { topicName[id] = (r.topicNames || [])[i] || id; });
    const skillName = {};
    (r.skillIds || []).forEach((id, i) => { skillName[id] = (r.skillNames || [])[i] || id; });
    (r.questionResults || []).forEach((q, i) => {
      rows.push([
        r.attemptId,
        new Date(r.completedAt || 0).toISOString(),
        r.studentName,
        r.missionTitle,
        topicName[q.topicId] || q.topicId || "",
        skillName[q.skillId] || q.skillId || "",
        i + 1,
        q.text,
        q.answerMode,
        q.studentAnswer,
        q.expectedAnswer,
        q.correct,
        q.difficultyLevel == null ? "" : q.difficultyLevel,
        q.diagramType || "",
        q.sourceType || "",
      ].map(csvCell).join(","));
    });
  }
  return [cols.join(","), ...rows].join("\n");
}
