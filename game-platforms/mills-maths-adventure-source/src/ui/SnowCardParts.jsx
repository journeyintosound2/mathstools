import React from "react";
import { kh } from "./keyHints.js";

/**
 * SNOWBALL SUMS — shared card pieces (2026-09-28 audit). The ten snow panels
 * were each hand-rolling the same intro / round header / reason card, and
 * each had drifted into its own wording. These keep the kid-facing shape
 * identical everywhere:
 *   <SnowIntro>     a title, 2–4 numbered "how to play" steps and ONE worked
 *                   example — no points maths on the first screen
 *   <SnowRoundHead> "Round 3 of 15 · ⭐ 50" + Quit, on one line
 *   <SnowWorking>   a worked solution written one step per line (the reason
 *                   cards used to be one long sentence)
 * Styles live in the SNOWBALL SUMS block at the end of styles/index.css.
 */

export function SnowIntro({ icon, title, steps, example, onStart, onQuit }) {
  return (
    <div className="farm-challenge-card">
      <div className="farm-challenge-head">
        <span>
          {icon} {title}
        </span>
      </div>
      <ol className="snow-steps">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      {example && <div className="snow-example">{example}</div>}
      <div className="farm-challenge-buttons">
        <button
          className="primary-button"
          onClick={(e) => {
            e.currentTarget.blur();
            onStart();
          }}
        >
          {kh("Let's go! (Enter)")}
        </button>
        <button className="link-button" onClick={onQuit}>
          Quit
        </button>
      </div>
    </div>
  );
}

export function SnowRoundHead({ icon, roundIndex, total, score, onQuit, children }) {
  return (
    <div className="farm-challenge-head" style={{ alignItems: "center" }}>
      <span className="snow-round">
        {icon} Round {roundIndex + 1} of {total} · ⭐ {score}
      </span>
      {children}
      <button className="link-button" onClick={onQuit}>
        Quit
      </button>
    </div>
  );
}

export function SnowWorking({ lines }) {
  return (
    <div className="snow-working">
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}
