import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { usePlayground, medalIcon, MEDAL } from "./playgroundStore.js";
import { drawDiagram } from "../../../data/schoolyard/challenges/diagrams/engines.js";

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
        <div className="pg-medals">{questions.length} questions · 🥉 {MEDAL.bronze} · 🥈 {MEDAL.silver} · 🥇 {MEDAL.gold}</div>
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
  const diagramHost = useRef(null);

  // Render / refresh the diagram when the question or its diagram changes.
  useEffect(() => {
    if (diagramHost.current && q && q.diagram) drawDiagram(diagramHost.current, q.diagram);
  }, [index, q]);

  // A controlled local input value — the store settles into `att.input` for review.
  const [input, setInput] = useState(() => att.input ?? (q.mode === "mc" ? null : ""));
  useEffect(() => { setInput(att.input ?? (q.mode === "mc" ? null : "")); }, [index, q.mode, att.input]);

  const [feedback, setFeedback] = useState(null); // {kind, text}
  useEffect(() => {
    if (att.nudge) setFeedback({ kind: "nudge", text: att.nudge });
    else if (att.used && att.ok) setFeedback({ kind: "ok", text: "Right!" });
    else if (att.used && !att.ok) setFeedback({ kind: "no", text: feedbackWrong(q) });
    else setFeedback(null);
  }, [index, att.nudge, att.used, att.ok, q]);

  const doCheck = useCallback(() => {
    if (settled) return;
    const r = checkAnswer(input);
    if (r.nudge) setFeedback({ kind: "nudge", text: r.nudge });
    else if (r.ok) setFeedback({ kind: "ok", text: `Right! +1 (${scoreSoFar() + 1} / ${questions.length})` });
    else setFeedback({ kind: "no", text: feedbackWrong(q) });
    function scoreSoFar() { return attempts.filter((a) => a.ok).length; }
  }, [checkAnswer, input, settled, q, attempts, questions.length]);

  const doNext = useCallback(() => advance(), [advance]);

  // Enter = Check or Next (unless a text field already handles it).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Enter") return;
      const t = e.target;
      if (t && t.tagName === "TEXTAREA") return;
      if (settled) { e.preventDefault(); doNext(); }
      else if (!(t && t.tagName === "INPUT" && t.type !== "button")) { e.preventDefault(); doCheck(); }
      else { e.preventDefault(); doCheck(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settled, doCheck, doNext]);

  const unit = q.unit ? ` ${q.unit}` : "";
  return (
    <>
      <div className="pg-head">
        <div className="pg-portrait" aria-hidden>{(active.name || "?")[0]}</div>
        <div className="pg-head-text">
          <div className="pg-name">{active.name}</div>
          <div className="pg-topic">{active.title}</div>
        </div>
        <div className="pg-round">{index + 1} / {questions.length}</div>
        <button type="button" className="pg-x" onClick={askLeave} aria-label="Leave this challenge">×</button>
      </div>
      <div className="pg-rail">
        {attempts.map((a, i) => (
          <span key={i} className={[
            a.used ? (a.ok ? "ok" : "no") : "",
            i === index ? "cur" : "",
          ].filter(Boolean).join(" ")} />
        ))}
      </div>
      <div className={"pg-body" + (q.diagram ? " with-diagram" : "")}>
        <div>
          <div className="pg-prompt" dangerouslySetInnerHTML={{ __html: q.prompt + (unit && q.mode !== "mc" ? ` <span style="color:#4a5377;font-size:.85em">(${q.unit})</span>` : "") }} />
          <div className="pg-answer">
            <AnswerInput q={q} value={input} setValue={setInput} disabled={settled} onEnter={doCheck} />
          </div>
          {feedback && (
            <div className={`pg-feedback ${feedback.kind}`}>
              <span>{feedback.text}{settled && !att.ok && q.why ? <><br/><span style={{opacity:.9, fontSize:"0.9em"}} dangerouslySetInnerHTML={{__html: "Why: " + q.why}} /></> : null}</span>
            </div>
          )}
        </div>
        {q.diagram && <div className="pg-diagram" ref={diagramHost} />}
      </div>
      <div className="pg-foot">
        <button type="button" className="pg-skip" onClick={skip} disabled={att.used && !settled}>Skip</button>
        <div className="pg-spacer" />
        {!settled ? (
          <button type="button" className="pg-action" onClick={doCheck} disabled={!canSubmit(q, input)}>Check</button>
        ) : (
          <button type="button" className={"pg-action ok"} onClick={doNext}>{index + 1 >= questions.length ? "Finish" : "Next ▸"}</button>
        )}
      </div>
    </>
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
          {medal && earned && <>You've earned {previousBest && previousBest.medal ? `an UPGRADED ${medal}` : "a KEY"} from {active.name}. Every key brings the Head Teacher's hall closer to opening.</>}
          {medal && !earned && <>Your best for this challenge is still {medalIcon(previousBest.medal)} {previousBest.score} / {previousBest.total}.</>}
          {!medal && <>Have another go — bronze is {MEDAL.bronze} right out of {total}.</>}
        </div>
        <button type="button" className="pg-done-close" onClick={leave}>Done</button>
      </div>
    </>
  );
}

/* ---------- answer inputs ---------- */

function AnswerInput({ q, value, setValue, disabled, onEnter }) {
  if (q.mode === "mc") return <MCInput q={q} value={value} setValue={setValue} disabled={disabled} />;
  if (q.mode === "tf") return <TFInput value={value} setValue={setValue} disabled={disabled} />;
  if (q.mode === "plot") return <PlotInput q={q} value={value} setValue={setValue} disabled={disabled} />;
  const { placeholder, inputMode, symbols } = typedFor(q);
  return (
    <>
      <label>Your answer</label>
      <input
        className="pg-input"
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnter?.(); } }}
        disabled={disabled}
        autoFocus
      />
      {symbols && !disabled && (
        <div className="pg-syms">
          {symbols.map((s) => (
            <button key={s} type="button" onMouseDown={(e) => { e.preventDefault(); setValue((v) => (v || "") + s); }}>{s}</button>
          ))}
        </div>
      )}
    </>
  );
}

function MCInput({ q, value, setValue, disabled }) {
  return (
    <div className="pg-mc" role="radiogroup">
      {q.options.map((opt, i) => (
        <button key={i} type="button" className={value === i ? "picked" : ""} onClick={() => !disabled && setValue(i)} disabled={disabled}
          dangerouslySetInnerHTML={{ __html: opt }} />
      ))}
    </div>
  );
}

function TFInput({ value, setValue, disabled }) {
  return (
    <div className="pg-tf">
      <button type="button" className={"t" + (value === true ? " picked" : "")} onClick={() => !disabled && setValue(true)} disabled={disabled}>True</button>
      <button type="button" className={"f" + (value === false ? " picked" : "")} onClick={() => !disabled && setValue(false)} disabled={disabled}>False</button>
    </div>
  );
}

function PlotInput({ q, value, setValue, disabled }) {
  // q carries grid bounds { xMin, xMax, yMin, yMax }. Default to a 10×10.
  const b = useMemo(() => ({ xMin: -5, xMax: 5, yMin: -5, yMax: 5, ...(q.grid || {}) }), [q]);
  const w = 360, h = 360, pad = 24;
  const W = w - 2 * pad, H = h - 2 * pad;
  const xToPx = (x) => pad + ((x - b.xMin) / (b.xMax - b.xMin)) * W;
  const yToPx = (y) => pad + ((b.yMax - y) / (b.yMax - b.yMin)) * H;
  const pxToX = (px) => Math.round((((px - pad) / W) * (b.xMax - b.xMin)) + b.xMin);
  const pxToY = (py) => Math.round(b.yMax - ((py - pad) / H) * (b.yMax - b.yMin));
  const ticks = (a, z) => Array.from({ length: z - a + 1 }, (_, i) => a + i);
  const handleClick = (e) => {
    if (disabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) * (w / r.width);
    const py = (e.clientY - r.top) * (h / r.height);
    setValue([pxToX(px), pxToY(py)]);
  };
  return (
    <div className="pg-plot-wrap">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} onClick={handleClick}>
        {ticks(b.xMin, b.xMax).map((x) => <line key={"vx" + x} x1={xToPx(x)} y1={pad} x2={xToPx(x)} y2={h - pad} stroke="#e8e4d6" />)}
        {ticks(b.yMin, b.yMax).map((y) => <line key={"vy" + y} x1={pad} y1={yToPx(y)} x2={w - pad} y2={yToPx(y)} stroke="#e8e4d6" />)}
        <line x1={xToPx(0)} y1={pad} x2={xToPx(0)} y2={h - pad} stroke="#1a2238" strokeWidth={2} />
        <line x1={pad} y1={yToPx(0)} x2={w - pad} y2={yToPx(0)} stroke="#1a2238" strokeWidth={2} />
        {ticks(b.xMin, b.xMax).filter((x) => x !== 0).map((x) => <text key={"lx" + x} x={xToPx(x)} y={yToPx(0) + 14} fontSize="11" textAnchor="middle" fill="#4a5377">{x}</text>)}
        {ticks(b.yMin, b.yMax).filter((y) => y !== 0).map((y) => <text key={"ly" + y} x={xToPx(0) - 8} y={yToPx(y) + 3} fontSize="11" textAnchor="end" fill="#4a5377">{y}</text>)}
        {value && <circle cx={xToPx(value[0])} cy={yToPx(value[1])} r={8} fill="#2a5bb6" />}
      </svg>
    </div>
  );
}

/* ---------- helpers ---------- */

function typedFor(q) {
  switch (q.mode) {
    case "num": return { placeholder: "Type a number", inputMode: "decimal", symbols: null };
    case "frac": return { placeholder: "3/4, 0.75 or 75%", inputMode: "text", symbols: null };
    case "ratio": return { placeholder: "e.g. 3:5", inputMode: "numeric", symbols: [":"] };
    case "coord": return { placeholder: "(3, −2)", inputMode: "text", symbols: ["(", ")", ",", "−"] };
    case "linear": return { placeholder: "y = 2x + 3", inputMode: "text", symbols: ["=", "+", "−", "x", "y", "/"] };
    case "pi": return { placeholder: "e.g. 12π", inputMode: "text", symbols: ["π", "+", "−", "/", "(", ")"] };
    case "mono": return { placeholder: "e.g. 2^3 × 5", inputMode: "text", symbols: ["^", "×", "+"] };
    default: return { placeholder: "Your answer", inputMode: "text", symbols: null };
  }
}

function canSubmit(q, v) {
  if (q.mode === "mc") return v !== null && v !== undefined;
  if (q.mode === "tf") return typeof v === "boolean";
  if (q.mode === "plot") return Array.isArray(v) && v.length === 2;
  return typeof v === "string" && v.trim().length > 0;
}

function feedbackWrong(q) {
  if (q.answerHTML) return "Not quite. The answer is " + stripTags(q.answerHTML);
  if (q.value != null) return "Not quite. The answer is " + q.value + (q.unit ? " " + q.unit : "");
  if (q.mode === "ratio") return "Not quite. The answer is " + q.parts.join(" : ");
  if (q.mode === "coord") return `Not quite. The answer is (${q.x}, ${q.y}).`;
  if (q.mode === "mc" && q.options) return "Not quite. The answer is " + stripTags(q.options[q.correct]) + ".";
  if (q.mode === "tf") return `Not quite — the correct answer is ${q.truth ? "True" : "False"}.`;
  return "Not quite.";
}

function stripTags(html) { return String(html || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(); }
function capital(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function darken(hex, amt = 0.2) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || "")) return hex;
  const n = (i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amt))));
  return `#${[n(1), n(3), n(5)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
