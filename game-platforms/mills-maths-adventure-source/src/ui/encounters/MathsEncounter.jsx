import React, { useEffect, useRef, useState } from "react";

import { buildEncounterQuestions } from "../../maths/curriculum/curriculumRegistry.js";
import { buildMissionQuestions, missionCoversTopic } from "../../missions/missionEngine.js";
import { validateAnswerFormat } from "../../maths/helpers.js";
import { validateMathInput } from "../math-input/mathInputUtils.js";
import { answerModeOf, gradeAnswer, isAnswerReady, emptyValueFor } from "../../maths/answerModes.js";
import { useProgress } from "../../progress/store.js";
import { useSession } from "../../game/sessionStore.js";
import { useUI } from "../effects/uiStore.js";
import { announceResult } from "../effects/announce.js";
import { getBadge } from "../../data/badges.js";
import { scorePercent, bandMessage, resultTitle, isPass } from "../../missions/scoring.js";
import DiagramRenderer from "../diagrams/DiagramRenderer.jsx";
import QuestionPrompt from "../QuestionPrompt.jsx";
import AnswerRenderer from "../answer-modes/AnswerRenderer.jsx";
import TouchKeypad from "../TouchKeypad.jsx";
import CompletionScreen from "./CompletionScreen.jsx";
import { useResults } from "../../results/resultStore.js";
import { makeAttemptId } from "../../results/resultTypes.js";
import { routeForMission } from "../../data/topicWorldRoutes.js";
import { LONG_MISSION_THRESHOLD } from "../../data/missions.js";
import { useCloud } from "../../cloud/cloudSession.js";
import { playerState } from "../../game/sessionStore.js";
import { speakerInfo } from "../dialogue/speakers.js";
import { Bi } from "../../i18n/i18n.jsx";

// Enter checks the answer for these single-action modes; multiPart/table need
// an explicit Check click, and math mode lets the MathLive field handle Enter.
const ENTER_CHECK_MODES = new Set(["simple", "orderedList", "trueFalse", "comparison"]);

/**
 * MathsEncounter (wrapper) — owns the "Try again" retry: it re-mounts the run
 * with a fresh question set and resets mission progress so a failed attempt can
 * be retried cleanly.
 */
export default function MathsEncounter({ encounter }) {
  const [attempt, setAttempt] = useState(0);
  const resetMissionProgress = useProgress((s) => s.resetMissionProgress);
  const getActiveMission = useProgress((s) => s.getActiveMission);

  function retry() {
    if (getActiveMission()) resetMissionProgress();
    setAttempt((a) => a + 1);
  }

  return <MathsRun key={attempt} encounter={encounter} onRetry={retry} />;
}

// Small fixed bonus on top of the per-question XP (which scales with difficulty).
const COMPLETION_BONUS_XP = 10;
const COINS_PER_CORRECT = 5;

// A short "complete your answer" hint per mode (used to gate the Check button).
function readyHint(mode) {
  if (mode === "trueFalse") return "Choose True or False.";
  if (mode === "comparison") return "Choose <, > or =.";
  if (mode === "orderedList") return "Enter all the values, separated by commas.";
  if (mode === "multiPart") return "Answer every part (a, b, c…).";
  if (mode === "tableInput") return "Fill in every cell of the table.";
  if (mode === "ratio") return "Fill in every part of the ratio.";
  if (mode === "multipleChoice") return "Choose an answer.";
  return "Type an answer first.";
}

/**
 * MathsEncounter — runs a maths quiz.
 *
 * Questions now come from the CURRICULUM REGISTRY (Stage → Topic → Skill), so
 * each question carries rich metadata: topic/skill names, a 1–5 difficulty
 * level + label, an XP value that scales with difficulty, and an input mode.
 *
 * Difficulty is chosen per skill from the player's performance profile
 * (adaptive foundation); each answer is recorded back into that profile, which
 * nudges the working difficulty for next time. XP earned = sum of the xpValue
 * of correctly-answered questions (+ a small completion bonus).
 *
 * Input mode (simple box vs MathLive editor) and the Enter/E-key flow work
 * exactly as before — see the comments in the body.
 */
function MathsRun({ encounter, onRetry }) {
  const closeEncounter = useSession((s) => s.closeEncounter);
  const openEncounter = useSession((s) => s.openEncounter);
  const completeEncounter = useProgress((s) => s.completeEncounter);
  const recordSkillAttempt = useProgress((s) => s.recordSkillAttempt);
  const recordMissionAttempt = useProgress((s) => s.recordMissionAttempt);
  const finalizeActiveMission = useProgress((s) => s.finalizeActiveMission);
  const playSound = useUI((s) => s.playSound);
  const touchMode = useUI((s) => s.touchMode);

  // --- MISSION WIRING -------------------------------------------------------
  // Decide ONCE (at mount, non-reactively) whether this encounter is driven by
  // the active mission, and if so which mission filters to use:
  //   - config.useActiveMission → this IS the mission runner (whole mission)
  //   - otherwise, if a mission is active and covers this NPC's (stage, topic),
  //     the NPC's maths is filtered to that topic by the mission ("Fern pulls
  //     Stage 4 FDP from the selected skills"). Topics the mission doesn't cover
  //     fall back to the encounter's normal curriculum config.
  const [missionCtx] = useState(() => {
    const cfg = encounter.config;
    const active = useProgress.getState().getActiveMission();
    if (!active) return { mode: false };

    if (cfg.useActiveMission) {
      return { mode: true, mission: active, count: active.requiredQuestions ?? 5 };
    }
    if (cfg.stage && cfg.topicId && missionCoversTopic(active, cfg.stage, cfg.topicId)) {
      // Topic-scoped view of the mission so this NPC only asks its own topic,
      // but still respects the mission's selected skills + difficulty range.
      const scoped = { ...active, selectedTopics: [cfg.topicId] };
      return { mode: true, mission: scoped, count: cfg.questionCount ?? 5 };
    }
    return { mode: false };
  });

  // Build the question set once. Mission questions come from the mission filters
  // (respecting difficultyRange + adaptive); otherwise from the encounter config.
  const [questions] = useState(() => {
    if (missionCtx.mode) {
      return buildMissionQuestions(
        missionCtx.mission,
        missionCtx.count,
        (skillId) => useProgress.getState().getSkillProfile(skillId)
      );
    }
    return buildEncounterQuestions(encounter.config, (skillId) =>
      useProgress.getState().getWorkingDifficulty(skillId)
    );
  });

  const questionCount = questions.length || (encounter.config.questionCount ?? 5);

  const [index, setIndex] = useState(0);
  const [value, setValue] = useState(() => emptyValueFor(questions[0] || {}));
  const [lastGrade, setLastGrade] = useState(null);
  const [status, setStatus] = useState("answering"); // answering | correct | wrong
  const [validationMsg, setValidationMsg] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [reward, setReward] = useState(null);
  const [cloudStatus, setCloudStatus] = useState(null); // null|pending|saved|failed|demo|skipped
  const [marks, setMarks] = useState([]); // per question: true (right) / false (not yet)
  const [confirmLeave, setConfirmLeave] = useState(false);
  // WHO set this challenge (their face on the card): "Pip's Number Warm-up"
  // → Pip; else whoever you just talked to; else none (a 🎯 badge).
  const [host] = useState(() => {
    const m = missionCtx.mission;
    const fromTitle = m && m.title ? (String(m.title).match(/^(.+?)['’]s\b/) || [])[1] : null;
    const lh = playerState.lastHost;
    const recent = lh && lh.model === "npc" && Date.now() - lh.at < 120000 ? lh.name : null;
    const name = fromTitle || recent || null;
    return name ? { name, ...speakerInfo(name) } : null;
  });

  const awardedRef = useRef(false);
  const earnedXpRef = useRef(0); // accumulates xpValue of correct answers
  const missionDoneRef = useRef(null); // set if the mission completes mid-encounter

  // Result capture (Phase 2L): one attempt id + start time per RUN. "Try again"
  // remounts MathsRun (key=attempt), so each attempt gets a fresh record.
  const startedAtRef = useRef(Date.now());
  const attemptIdRef = useRef(null);
  if (!attemptIdRef.current) attemptIdRef.current = makeAttemptId();
  const questionResultsRef = useRef([]);
  const savedRecordRef = useRef(null); // the normalised record after saving

  const question = questions[index] || {};
  const isLast = index + 1 >= questionCount;
  const mode = answerModeOf(question);

  function checkAnswer() {
    if (status !== "answering") return;

    // Must have a complete answer for this mode (no blank/partial submits).
    if (!isAnswerReady(question, value)) {
      setValidationMsg(readyHint(mode));
      return;
    }
    // Typed numeric/expression formats still get their format validation.
    if (mode === "simple") {
      const v = validateAnswerFormat(value);
      if (!v.valid) { setValidationMsg(v.message); return; }
    } else if (mode === "math") {
      const v = validateMathInput(value);
      if (!v.valid) { setValidationMsg(v.message); return; }
    }
    setValidationMsg("");

    const grade = gradeAnswer(question, value);
    setLastGrade(grade);
    const isCorrect = grade.correct;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      earnedXpRef.current += question.xpValue || 0;
      playSound("correct");
    } else {
      playSound("wrong");
    }
    // Record the attempt against the question's skill (drives adaptive difficulty).
    if (question.skillId) recordSkillAttempt(question.skillId, isCorrect);

    // Mission-driven questions advance mission PROGRESS (display only). Whether
    // the mission completes is decided at the end based on the pass threshold.
    if (missionCtx.mode) {
      recordMissionAttempt(isCorrect, isCorrect ? question.xpValue || 0 : 0);
    }

    // Capture the question-level result (Phase 2L) — one push per question
    // (checkAnswer is guarded by status, so it can't double-record).
    questionResultsRef.current.push({
      questionId: question.id,
      text: question.text,
      topicId: question.topicId,
      skillId: question.skillId,
      difficultyLevel: question.difficultyLevel,
      requestedDifficultyLevel: question.requestedDifficultyLevel,
      actualDifficultyLevel: question.actualDifficultyLevel,
      answerMode: mode,
      studentAnswer: Array.isArray(value) ? value.join(" | ") : String(value),
      expectedAnswer: question.answer,
      acceptableAnswers: question.acceptableAnswers,
      correct: isCorrect,
      partResults: grade.partResults || null,
      diagramType: question.diagramType,
      legacyType: question.legacyType,
      sourceType: question.sourceType,
      feedback: question.feedback,
    });

    setMarks((mk) => { const n = mk.slice(); n[index] = isCorrect; return n; });
    setStatus(isCorrect ? "correct" : "wrong");
  }

  function next() {
    if (isLast) {
      setFinished(true);
      return;
    }
    const nextQ = questions[index + 1] || {};
    setIndex((i) => i + 1);
    setValue(emptyValueFor(nextQ));
    setLastGrade(null);
    setStatus("answering");
    setValidationMsg("");
  }

  function handleEnter() {
    if (status === "answering") checkAnswer();
    else next();
  }
  const handleEnterRef = useRef(handleEnter);
  handleEnterRef.current = handleEnter;

  // Enter behaviour (Phase 2K): while answering, only single-action modes check
  // on Enter (multiPart/table need an explicit Check; math lets the MathLive
  // field handle Enter). Once answered, Enter advances for every mode.
  useEffect(() => {
    if (finished) return undefined;
    function onKeyDown(e) {
      if (e.key === "Escape") { e.preventDefault(); setConfirmLeave((c) => !c); return; }
      if (e.key !== "Enter") return;
      if (confirmLeaveRef.current) return; // the leave question has the keys
      if (status === "answering") {
        if (mode === "math") return; // MathLive field handles its own Enter
        if (!ENTER_CHECK_MODES.has(mode)) return; // don't submit mid multi-field
      }
      e.preventDefault();
      handleEnterRef.current();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [status, finished, mode]);
  const confirmLeaveRef = useRef(false);
  confirmLeaveRef.current = confirmLeave;

  // Finish: decide pass/fail, award participation XP always, and only complete
  // the challenge/mission (and grant the mission reward) on a PASS (Phase 2G).
  useEffect(() => {
    if (finished && !awardedRef.current) {
      awardedRef.current = true;
      const pct = scorePercent(correctCount, questionCount);
      const passed = isPass(correctCount, questionCount);
      // Correct-answer XP is always earned; the completion bonus only on a pass.
      const xp = earnedXpRef.current + (passed ? COMPLETION_BONUS_XP : 0);
      const coins = correctCount * COINS_PER_CORRECT;
      const result = completeEncounter({ encounterId: encounter.id, xp, coins, passed });
      setReward({ xp, coins, passed, scorePercent: pct, ...result });
      playSound(passed ? "complete" : "wrong");
      if (passed) announceResult(result);

      // Mission completion is decided here, gated by the pass threshold.
      if (missionCtx.mode) {
        const md = finalizeActiveMission({ correct: correctCount, total: questionCount });
        if (md.justCompleted) {
          missionDoneRef.current = md;
          const badge = md.badge ? getBadge(md.badge) : null;
          useUI.getState().pushToast({
            type: "quest",
            icon: badge ? badge.icon : "🎯",
            title: "Mission Complete!",
            message: badge ? `Badge earned: ${badge.badgeName}` : "Rewards granted",
          });
          playSound("questComplete");
        }
      }

      // Save the LOCAL attempt result (Phase 2L). Runs once per finished run
      // (awardedRef guard) — failed attempts are saved as status "failed" and
      // never complete the mission. Leaving mid-attempt never reaches here.
      saveAttemptResult({ pct, passed, xp, coins });

      // CLOUD dual-save (Phase 3B / 3B.1) — fire-and-forget; never blocks the
      // result screen. Local save above is the source of truth. ALL completed
      // attempts sync when registered (story is tagged missionKind:"story" by the
      // mapper and never feeds teacher tasks/summaries). Demo/skip stay local.
      const rec = savedRecordRef.current;
      const cloud = useCloud.getState();
      if (cloud.mode === "skip") {
        setCloudStatus("demo");
      } else if (cloud.mode === "registered" && rec) {
        setCloudStatus("pending");
        cloud.saveAttempt(rec).then((s) => setCloudStatus(s.status)).catch(() => setCloudStatus("failed"));
      } else {
        // Not signed in — local only, with a gentle "sign in to save online".
        setCloudStatus("unregistered");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  // Build + persist the attempt record from this run's questions/mission.
  function saveAttemptResult({ pct, passed, xp, coins }) {
    const m = missionCtx.mission;
    const topicIds = [...new Set(questions.map((q) => q.topicId).filter(Boolean))];
    const topicNames = topicIds.map((id) => (questions.find((q) => q.topicId === id) || {}).topicName || id);
    const skillIds = [...new Set(questions.map((q) => q.skillId).filter(Boolean))];
    const skillNames = skillIds.map((id) => (questions.find((q) => q.skillId === id) || {}).skillName || id);
    const profile = useProgress.getState().profile || {};
    savedRecordRef.current = useResults.getState().addResult({
      attemptId: attemptIdRef.current,
      missionId: m ? m.missionId : null,
      missionKind: m ? (m.kind || "practice") : "practice",
      // Teacher-assigned tasks carry the assignment id as taskId so the teacher
      // portal can match completion to a specific Adventure task (missionId ===
      // assignmentId for these). Null for story/free/preset missions.
      taskId: m && m.kind === "teacher" ? m.missionId : null,
      missionTitle: m ? m.title : (encounter.title || "Challenge"),
      studentName: profile.name || "Explorer",
      studentCode: profile.studentCode || null,
      classCode: profile.classCode || null,
      stage: questions[0]?.stage || (m && m.stages && m.stages[0]) || null,
      topicIds, topicNames, skillIds, skillNames,
      difficultyRange: m ? m.difficultyRange : null,
      adaptiveOn: m ? Boolean(m.adaptiveOn) : false,
      passThreshold: (m && m.passThreshold) || 0.6,
      questionCount,
      correctCount,
      percentage: pct,
      passed,
      startedAt: startedAtRef.current,
      completedAt: Date.now(),
      xpAwarded: xp,
      coinsAwarded: coins,
      badgeAwarded: (missionDoneRef.current && missionDoneRef.current.badge) || null,
      routedTarget: m && m.kind !== "story" ? routeForMission(m).targetId : null,
      questionResults: questionResultsRef.current,
    });
  }

  // On the result/mission-complete screen, Escape closes it (no progress to
  // lose — the challenge is finished), consistent with the other safe popups.
  useEffect(() => {
    if (!finished) return undefined;
    function onKey(e) {
      if (e.key === "Escape") closeEncounter();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, closeEncounter]);

  if (finished) {
    const pct = scorePercent(correctCount, questionCount);
    const passed = isPass(correctCount, questionCount);
    const md = missionDoneRef.current;
    const missionReward = md && md.justCompleted
      ? {
          title: missionCtx.mission?.title,
          badge: md.badge ? getBadge(md.badge) : null,
          rewardXP: md.rewardXP,
          rewardCoins: md.rewardCoins,
          teacher: Boolean(missionCtx.mission && missionCtx.mission.kind === "teacher"),
        }
      : null;
    // (2026-10-13: the finish screen is just the score, the rewards and one
    // button — every attempt is still in the Results Centre.)
    return (
      <CompletionScreen
        title={passed ? "Challenge complete!" : "Nearly there!"}
        band={bandMessage(pct)}
        correct={correctCount}
        total={questionCount}
        pct={pct}
        passed={passed}
        reward={reward || {}}
        missionReward={missionReward}
        cloudStatus={cloudStatus}
        host={host}
        onRetry={passed ? null : onRetry}
        onClose={closeEncounter}
      />
    );
  }

  const long = questionCount > LONG_MISSION_THRESHOLD;
  const stars = Math.max(1, Math.min(5, question.difficultyLevel || 1));
  const kicker = host ? host.name : missionCtx.mode ? "Mission" : "Challenge";
  const cardTitle = (missionCtx.mode && missionCtx.mission && missionCtx.mission.title) || encounter.title;

  return (
    <div className={`modal-card qcard is-${status}`} style={host && host.color ? { "--qc": host.color } : undefined}>
      {/* The CHALLENGE CARD (2026-10-13 — Jeff: "the dialogue boxes for these
          challenges is from the original version … update the look to the
          same quality and polish"): the face of whoever set it, the
          question big in the middle, results as pips, one main button. */}
      <div className="qcard-head">
        <span className="qcard-face" aria-hidden="true">
          {host && host.img ? <img src={host.img} alt="" draggable="false" /> : <span>{(host && host.icon) || "🎯"}</span>}
        </span>
        <span className="qcard-titles">
          <span className="qcard-kicker">
            <Bi block={false}>{kicker}</Bi>
            {question.topicName && <> · <Bi block={false}>{question.topicName}</Bi></>}
          </span>
          <span className="qcard-title">{cardTitle}</span>
        </span>
        <button className="qcard-close" onClick={() => setConfirmLeave(true)} title="Leave challenge" aria-label="Leave challenge">✕</button>
      </div>

      <div className="qcard-track">
        {long ? (
          <span className="qcard-bar" aria-hidden="true"><span style={{ width: `${Math.round((index / questionCount) * 100)}%` }} /></span>
        ) : (
          <span className="qcard-pips" aria-hidden="true">
            {questions.map((_, i) => (
              <span key={i} className={marks[i] === true ? "ok" : marks[i] === false ? "miss" : i === index ? "now" : ""}>
                {marks[i] === true ? "✓" : ""}
              </span>
            ))}
          </span>
        )}
        <span className="qcard-count"><Bi block={false}>Question</Bi> <b>{index + 1}</b> / {questionCount}</span>
        <span className={`qcard-diff diff-level-${question.difficultyLevel}`} title={question.difficultyLabel}>
          <span aria-hidden="true">{"★".repeat(stars)}<i>{"★".repeat(5 - stars)}</i></span> +{question.xpValue} XP
        </span>
      </div>

      <div className="qcard-q" key={`q-${index}`}>
        <QuestionPrompt question={question} />
        {/* Optional figure for diagram-based questions (e.g. Area). */}
        {question.diagramType && question.diagramData && (
          <DiagramRenderer question={question} />
        )}
      </div>

      <div className="qcard-answer">
        <AnswerRenderer
          question={question}
          value={value}
          onChange={(v) => { setValue(v); if (validationMsg) setValidationMsg(""); }}
          disabled={status !== "answering"}
          invalid={Boolean(validationMsg)}
          result={lastGrade}
          onMathEnter={() => handleEnterRef.current()}
          remountKey={index}
        />

        {/* On-screen keypad (W4-D): touch devices type numeric answers here
            instead of the OS keyboard (simple numeric mode, while answering). */}
        {touchMode && mode === "simple" && status === "answering" && (
          <TouchKeypad
            onKey={(ch) => { setValue((v) => (v || "") + ch); if (validationMsg) setValidationMsg(""); }}
            onBackspace={() => { setValue((v) => (v || "").slice(0, -1)); if (validationMsg) setValidationMsg(""); }}
            onClear={() => { setValue(""); if (validationMsg) setValidationMsg(""); }}
          />
        )}

        {validationMsg && <div className="validation-msg"><Bi block={false}>{validationMsg}</Bi></div>}
      </div>

      {status === "correct" && (
        <div className="feedback correct pop qcard-fb">
          <span className="qcard-fb-icon" aria-hidden="true">✓</span>
          <span>
            <span className="feedback-head"><Bi block={false}>Correct!</Bi>{lastGrade && lastGrade.total > 1 ? ` — all ${lastGrade.total} parts!` : ""}</span>
            {question.feedback && <div className="feedback-work">{question.feedback}</div>}
          </span>
        </div>
      )}
      {status === "wrong" && (
        <div className="feedback wrong pop qcard-fb">
          <span className="qcard-fb-icon" aria-hidden="true">💡</span>
          <span>
            <span className="feedback-head"><Bi block={false}>Let's look at this one</Bi></span>
            {lastGrade && lastGrade.total > 1 && (
              <div className="part-score">{lastGrade.correctCount} of {lastGrade.total} parts correct (all parts needed)</div>
            )}
            <div className="feedback-work">
              <Bi block={false}>The answer is</Bi> <strong>{question.answer}</strong>.
              {question.feedback && <div className="feedback-explain">{question.feedback}</div>}
            </div>
          </span>
        </div>
      )}

      <div className="qcard-actions">
        <button className="qcard-leave" onClick={() => setConfirmLeave(true)}><Bi block={false}>Leave</Bi></button>
        {status === "answering" ? (
          <button className="qcard-go" onClick={checkAnswer}>
            <Bi block={false}>Check</Bi>
            {!touchMode && ENTER_CHECK_MODES.has(mode) && <kbd aria-hidden="true">Enter</kbd>}
          </button>
        ) : (
          <button className="qcard-go is-next" onClick={next}>
            <Bi block={false}>{isLast ? "Finish" : "Next"}</Bi> <span aria-hidden="true">▸</span>
            {!touchMode && <kbd aria-hidden="true">Enter</kbd>}
          </button>
        )}
      </div>

      {confirmLeave && (
        <div className="qcard-confirm" role="alertdialog" aria-modal="true" aria-label="Leave this challenge?">
          <div className="qcard-confirm-box">
            <b><Bi>Leave this challenge?</Bi></b>
            <p><Bi>Your answers so far won't be saved.</Bi></p>
            <div className="qcard-confirm-actions">
              <button className="qcard-leave" onClick={closeEncounter}><Bi block={false}>Leave</Bi></button>
              <button className="qcard-go" autoFocus onClick={() => setConfirmLeave(false)}><Bi block={false}>Keep going</Bi></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
