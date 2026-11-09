import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { usePlayground, medalIcon, MEDAL } from "./playgroundStore.js";
import { drawDiagram, grid as drawGrid } from "../../../data/schoolyard/challenges/diagrams/engines.js";
import C from "../../../data/schoolyard/challenges/questionCore.js";
import { radicals } from "./mathHtml.js";

/**
 * PLAYGROUND VEIL — the modal shell for every Retrieval Practice Playground
 * challenge. Dark backdrop over the 3D world, big focused card on top.
 *
 * Phases: intro → question/settled → done, with a leave-confirm overlay.
 * Answer modes come from the question banks (shared with the website quizzes):
 * num, frac, ratio, mono, coord, linear, pi, mc, tf, plot.
 */
export default function PlaygroundVeil() {
  const active = usePlayground((s) => s.active);
  const phase = usePlayground((s) => s.phase);
  const leaveOpen = usePlayground((s) => s.leaveOpen);
  const askLeave = usePlayground((s) => s.askLeave);
  const cancelLeave = usePlayground((s) => s.cancelLeave);
  const leave = usePlayground((s) => s.leave);

  // Esc closes (via confirm). Capture so no other handler runs first.
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); askLeave(); }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [active, askLeave]);

  if (!active) return null;

  const tint = active.color || "#1a3c7a";
  const dark = darken(tint, 0.25);
  return (
    <div className="pg-veil" style={{ "--pg-tint": tint, "--pg-tint-dark": dark }}>
      <div className="pg-card">
        {phase === "intro" && <IntroCard />}
        {(phase === "question" || phase === "settled") && <QuestionCard />}
        {phase === "done" && <DoneCard />}
        {leaveOpen && (
          <div className="pg-leave">
            <div className="pg-leave-card">
              <h3>Leave this challenge?</h3>
              <p>You'll lose what you've done this round. Your best so far is kept.</p>
              <div className="pg-leave-btns">
                <button type="button" onClick={cancelLeave}>Keep playing</button>
                <button type="button" className="pg-leave-go" onClick={leave}>Leave</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IntroCard() {
  const active = usePlayground((s) => s.active);
  const previousBest = usePlayground((s) => s.previousBest);
  const questions = usePlayground((s) => s.questions);
  const begin = usePlayground((s) => s.begin);
  const askLeave = usePlayground((s) => s.askLeave);
  return (
    <>
      <div className="pg-head">
        <div className="pg-portrait" aria-hidden>{(active.name || "?")[0]}</div>
        <div className="pg-head-text">
          <div className="pg-name">{active.name}</div>
          <div className="pg-topic">{active.outcome} · {active.title}</div>
        </div>
        <button type="button" className="pg-x" onClick={askLeave} aria-label="Leave this challenge">×</button>
      </div>
      <div className="pg-intro">
        <h2>{active.title}</h2>
        <div className="pg-outcome">{active.outcome}</div>
        <div className="pg-medals">{questions.length} questions · 🥉 {need(MEDAL.bronze, questions.length)} · 🥈 {need(MEDAL.silver, questions.length)} · 🥇 {need(MEDAL.gold, questions.length)}</div>
        {active.flavor && <p>"{active.flavor}"</p>}
        {previousBest ? (
          <p><strong>Your best so far:</strong> {medalIcon(previousBest.medal)} {previousBest.score} / {previousBest.total}</p>
        ) : null}
        <button type="button" className="pg-begin" onClick={begin}>Begin</button>
      </div>
    </>
  );
}

function QuestionCard() {
  const active = usePlayground((s) => s.active);
  const questions = usePlayground((s) => s.questions);
  const index = usePlayground((s) => s.index);
  const phase = usePlayground((s) => s.phase);
  const attempts = usePlayground((s) => s.attempts);
  const checkAnswer = usePlayground((s) => s.check);
  const advance = usePlayground((s) => s.advance);
  const skip = usePlayground((s) => s.skip);
  const askLeave = usePlayground((s) => s.askLeave);

  const q = questions[index];
  const att = attempts[index] || {};
  const settled = phase === "settled";
  const isPlot = q.mode === "plot";
  const hasDiagram = Boolean(q.diagram) || isPlot;
  const diagramHost = useRef(null);
  const gridRef = useRef(null);

  // A controlled local input value — the store keeps `att.input` for review.
  const blank = q.mode === "mc" || q.mode === "tf" || isPlot ? null : "";
  const [input, setInput] = useState(() => att.input ?? blank);
  useEffect(() => { setInput(att.input ?? blank); }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Diagram (or the clickable plane for a plot question). Drawn once per question.
  useEffect(() => {
    const host = diagramHost.current;
    if (!host) return;
    gridRef.current = null;
    if (isPlot) {
      host.innerHTML = "";
      const g = drawGrid({ ...(q.grid || {}), interactive: true, onPick: (x, y) => setInput([x, y]) });
      host.appendChild(g);
      gridRef.current = g;
    } else if (q.diagram) drawDiagram(host, q.diagram);
  }, [index, q]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock the plane and show right/wrong once a plot question is marked.
  useEffect(() => {
    const g = gridRef.current;
    if (isPlot && settled && g && g.markAnswer) g.markAnswer(att.input, att.ok, [q.x, q.y]);
  }, [settled, isPlot, att.input, att.ok, q]);

  const [nudge, setNudge] = useState(null);
  useEffect(() => { setNudge(null); }, [index]);

  const doCheck = useCallback(() => {
    if (settled) return;
    if (!canSubmit(q, input)) { setNudge(isPlot ? "Click the grid to place your point." : "Type your answer first — or press Skip."); return; }
    const r = checkAnswer(input);
    setNudge(r.nudge || null);
  }, [checkAnswer, input, settled, q, isPlot]);

  const doNext = useCallback(() => advance(), [advance]);

  // Enter = Check, or Next once marked.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Enter" || e.repeat) return;
      const t = e.target;
      if (t && t.tagName === "TEXTAREA") return;
      if (t && t.tagName === "BUTTON") return; // let the focused button do its own thing
      e.preventDefault();
      if (settled) doNext(); else doCheck();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settled, doCheck, doNext]);

  const score = attempts.filter((a) => a.ok).length;
  return (
    <>
      <div className="pg-head">
        <div className="pg-portrait" aria-hidden>{(active.name || "?")[0]}</div>
        <div className="pg-head-text">
          <div className="pg-name">{active.name}</div>
          <div className="pg-topic">{active.title}{q._label ? <span className="pg-qtype"> · {q._label}</span> : null}</div>
        </div>
        <div className="pg-round">{index + 1} / {questions.length}</div>
        <button type="button" className="pg-x" onClick={askLeave} aria-label="Leave this challenge">×</button>
      </div>
      <div className="pg-rail">
        {attempts.map((a, i) => (
          <span key={i} className={[a.used ? (a.ok ? "ok" : "no") : "", i === index ? "cur" : ""].filter(Boolean).join(" ")} />
        ))}
      </div>
      <div className={"pg-body" + (hasDiagram ? " with-diagram" : "")}>
        <div className="pg-main">
          <div className="pg-prompt" dangerouslySetInnerHTML={{ __html: radicals(q.prompt) }} />
          <div className="pg-answer">
            <AnswerInput q={q} att={att} value={input} setValue={(v) => { setNudge(null); setInput(v); }} disabled={settled} />
          </div>
          {nudge && !settled && <div className="pg-feedback nudge"><span>{nudge}</span></div>}
          {settled && <Feedback q={q} att={att} score={score} total={questions.length} />}
        </div>
        {hasDiagram && <div className="pg-diagram" ref={diagramHost} />}
      </div>
      <div className="pg-foot">
        <button type="button" className="pg-skip" onClick={skip} disabled={settled}>Skip</button>
        <div className="pg-spacer" />
        {!settled ? (
          <button type="button" className="pg-action" onClick={doCheck} disabled={!canSubmit(q, input)}>Check</button>
        ) : (
          <button type="button" className="pg-action ok" onClick={doNext} autoFocus>{index + 1 >= questions.length ? "Finish" : "Next ▸"}</button>
        )}
      </div>
    </>
  );
}

const PRAISE = ["Correct!", "Nice work!", "Spot on!", "Yes!", "That's it!", "Great thinking!"];

function Feedback({ q, att, score, total }) {
  const praise = useMemo(() => PRAISE[Math.floor(Math.random() * PRAISE.length)], [q]);
  if (att.ok) {
    return (
      <div className="pg-feedback ok">
        <div className="pg-fb-head">✓ {praise} <span className="pg-fb-score">{score} / {total}</span></div>
      </div>
    );
  }
  const head = att.skipped ? "Skipped — here is the answer" : att.swapped ? "Not quite — check the order: x first, then y" : "Not quite";
  return (
    <div className="pg-feedback no">
      <div className="pg-fb-head">✕ {head}</div>
      <div className="pg-fb-ans">Answer: <b dangerouslySetInnerHTML={{ __html: radicals(answerText(q)) }} /></div>
      {q.why ? <div className="pg-fb-why" dangerouslySetInnerHTML={{ __html: radicals(q.why) }} /> : null}
    </div>
  );
}

function DoneCard() {
  const active = usePlayground((s) => s.active);
  const result = usePlayground((s) => s.result);
  const leave = usePlayground((s) => s.leave);
  if (!result) return null;
  const { score, total, medal, earned, previousBest } = result;
  return (
    <>
      <div className="pg-head">
        <div className="pg-portrait" aria-hidden>{(active.name || "?")[0]}</div>
        <div className="pg-head-text">
          <div className="pg-name">{active.name}</div>
          <div className="pg-topic">{active.title}</div>
        </div>
        <button type="button" className="pg-x" onClick={leave} aria-label="Close">×</button>
      </div>
      <div className="pg-done">
        <div className="pg-medal-big">{medal ? medalIcon(medal) : "📘"}</div>
        <div className="pg-done-h">{medal ? `${capital(medal)} medal!` : "Not quite this time"}</div>
        <div className="pg-score">{score} / {total}</div>
        <div className="pg-done-note">
          {medal && earned && active.areaId === "boss" && <>{previousBest && previousBest.medal ? `An UPGRADED ${medal} on the Head Teacher's Exam!` : "You have passed the Head Teacher's Exam — the whole of Stage 4!"}</>}
          {medal && earned && active.areaId !== "boss" && <>You've earned {previousBest && previousBest.medal ? `an UPGRADED ${medal}` : "a KEY"} from {active.name}. Every key brings the Head Teacher's hall closer to opening.</>}
          {medal && !earned && <>Your best for this challenge is still {medalIcon(previousBest.medal)} {previousBest.score} / {previousBest.total}.</>}
          {!medal && <>Have another go — bronze is {need(MEDAL.bronze, total)} right out of {total}.</>}
        </div>
        <button type="button" className="pg-done-close" onClick={leave}>Done</button>
      </div>
    </>
  );
}

/* ---------- answer inputs ---------- */

const MODE_KEYS = {
  pi: ["π"], mono: ["^", "×"], ratio: [":"], coord: ["(", ",", ")", "−"],
  linear: ["=", "+", "−", "x"], expr: ["^", "(", ")", "−"],
};
const MODE_PLACEHOLDER = {
  num: "Type a number", frac: "e.g. 3/4", ratio: "e.g. 3 : 5", coord: "e.g. (3, −2)",
  linear: "e.g. y = 2x + 3", pi: "e.g. 12π", mono: "e.g. 2^3 × 5", expr: "Type an expression",
};

function AnswerInput({ q, att, value, setValue, disabled }) {
  const inputRef = useRef(null);
  if (q.mode === "mc") return <MCInput q={q} att={att} value={value} setValue={setValue} disabled={disabled} />;
  if (q.mode === "tf") return <TFInput q={q} att={att} value={value} setValue={setValue} disabled={disabled} />;
  if (q.mode === "plot") {
    return <div className="pg-plotread">{Array.isArray(value) ? <>Your point: <b>({C.fmt(value[0])}, {C.fmt(value[1])})</b></> : "No point placed yet."}</div>;
  }
  let keys = q.keys || MODE_KEYS[q.mode] || null;
  if (!q.keys && q.mode === "num" && q.signed) keys = ["−"];
  const inputMode = q.mode === "num" && !keys ? "decimal" : "text";
  const insert = (k) => {
    const el = inputRef.current; if (!el || disabled) return;
    const ch = k === "−" ? "-" : k;
    const v = String(value || "");
    const s0 = el.selectionStart ?? v.length, e0 = el.selectionEnd ?? v.length;
    const next = v.slice(0, s0) + ch + v.slice(e0);
    setValue(next);
    requestAnimationFrame(() => { try { el.focus(); el.setSelectionRange(s0 + ch.length, s0 + ch.length); } catch (_) { /* ignore */ } });
  };
  const preview = previewHTML(q, String(value || ""));
  const cls = "pg-input" + (disabled ? (att.ok ? " good" : " bad") : "");
  return (
    <>
      <label htmlFor="pg-ans">Your answer</label>
      <div className="pg-inrow">
        {q.pre ? <span className="pg-aff" dangerouslySetInnerHTML={{ __html: q.pre }} /> : null}
        <input
          id="pg-ans"
          ref={inputRef}
          className={cls}
          type="text"
          inputMode={inputMode}
          autoComplete="off" autoCapitalize="off" spellCheck={false}
          placeholder={q.placeholder || MODE_PLACEHOLDER[q.mode] || "Your answer"}
          value={value || ""}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          autoFocus
        />
        {q.unit ? <span className="pg-aff" dangerouslySetInnerHTML={{ __html: q.unit }} /> : null}
      </div>
      {keys && !disabled && (
        <div className="pg-syms" aria-label="Symbol keys">
          {keys.map((k) => (
            <button key={k} type="button" title={"Type " + k} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(k)}>{k}</button>
          ))}
        </div>
      )}
      {preview ? <div className="pg-preview" dangerouslySetInnerHTML={{ __html: preview }} /> : null}
    </>
  );
}

function MCInput({ q, att, value, setValue, disabled }) {
  const long = q.mcLong || q.options.some((o) => stripTags(o).length > 38);
  return (
    <div className={"pg-mc" + (long ? " long" : "")} role="radiogroup">
      {q.options.map((opt, i) => {
        const cls = [value === i ? "picked" : "", disabled && i === q.correct ? "good" : "", disabled && i === value && !att.ok ? "bad" : ""].filter(Boolean).join(" ");
        return (
          <button key={i} type="button" className={cls} onClick={() => !disabled && setValue(i)} disabled={disabled}>
            <span className="pg-mc-l">{"ABCDEF"[i]}</span>
            <span className="pg-mc-t" dangerouslySetInnerHTML={{ __html: radicals(opt) }} />
          </button>
        );
      })}
    </div>
  );
}

function TFInput({ q, att, value, setValue, disabled }) {
  const cls = (v) => [value === v ? "picked" : "", disabled && q.truth === v ? "good" : "", disabled && value === v && !att.ok ? "bad" : ""].filter(Boolean).join(" ");
  return (
    <div className="pg-tf">
      <button type="button" className={cls(true)} onClick={() => !disabled && setValue(true)} disabled={disabled}>True</button>
      <button type="button" className={cls(false)} onClick={() => !disabled && setValue(false)} disabled={disabled}>False</button>
    </div>
  );
}

/* ---------- helpers ---------- */

function previewHTML(q, v) {
  if (!v.trim()) return "";
  if (q.mode === "mono") return "= " + C.prettyPowers(v.replace(/\s*[x*]\s*/gi, " × "));
  if (q.mode === "pi") return "= " + C.esc(v).replace(/pi/gi, "π");
  if (q.mode === "expr" && /\^/.test(v)) return "= " + C.prettyPowers(v);
  return "";
}

function canSubmit(q, v) {
  if (q.mode === "mc") return v !== null && v !== undefined;
  if (q.mode === "tf") return typeof v === "boolean";
  if (q.mode === "plot") return Array.isArray(v) && v.length === 2;
  return typeof v === "string" && v.trim().length > 0;
}

/** The right answer, as HTML (mirrors the website engine's answerText). */
function answerText(q) {
  if (q.answerHTML) return q.answerHTML;
  if (q.mode === "mc") return q.options[q.correct];
  if (q.mode === "tf") return q.truth ? "True" : "False";
  if (q.mode === "num") return (q.pre || "") + C.fmt(q.value, q.dp == null ? 4 : q.dp, q.dp != null && q.dp > 0) + (q.unit ? (q.unit === "°" ? "°" : " " + q.unit) : "");
  if (q.mode === "coord" || q.mode === "plot") return `(${C.fmt(q.x)}, ${C.fmt(q.y)})`;
  if (q.mode === "frac") return C.frac(q.n, q.d);
  if (q.mode === "ratio") return q.parts.join(" : ");
  return "";
}

function stripTags(html) { return String(html || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(); }
/** Correct answers needed for a medal in a round of `total` (thresholds are out of 20). */
function need(t, total) { return Math.ceil((t * total) / 20 - 1e-9); }
function capital(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function darken(hex, amt = 0.2) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || "")) return hex;
  const n = (i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amt))));
  return `#${[n(1), n(3), n(5)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
