import React from "react";
import DemoStartCard from "./demo/DemoStartCard.jsx";
import DemoButton from "./demo/DemoButton.jsx";
import { useDemo } from "../game/demo/demoStore.js";

/**
 * SNOWBALL SUMS — shared card pieces (2026-09-28 audit). The ten snow panels
 * were each hand-rolling the same intro / round header / reason card, and
 * each had drifted into its own wording. These keep the kid-facing shape
 * identical everywhere:
 *   <SnowIntro>     the ready card (2026-10-24: the live demo replaced the
 *                   numbered steps + worked example)
 *   <SnowRoundHead> "Round 3 of 15 · ⭐ 50" + Quit, on one line
 *   <SnowWorking>   a worked solution written one step per line (the reason
 *                   cards used to be one long sentence)
 * Styles live in the SNOWBALL SUMS block at the end of styles/index.css.
 */

/**
 * The intro is now the READY CARD (2026-10-24): no written rules — the
 * challenge's live demo teaches them (game/demo/). The very first time a
 * student opens a challenge its demo plays by itself; after that this card
 * offers ▶ Watch how to play / Let's go!. `steps` / `example` are no longer
 * shown (kept in the call sites as notes for teachers reading the code).
 */
export function SnowIntro({ icon, title, onStart, onQuit }) {
  return <DemoStartCard icon={icon} title={title} onStart={onStart} onQuit={onQuit} />;
}

/** "Round 3 of 15 · ⭐ 50" (or "Example 1 of 2" while the demo plays) + ▶ Demo + Quit. */
export function SnowRoundHead({ icon, roundIndex, total, score, onQuit, children }) {
  const demo = useDemo((s) => s.active);
  const example = useDemo((s) => s.example);
  const examples = useDemo((s) => s.examples);
  return (
    <div className="farm-challenge-head" style={{ alignItems: "center" }}>
      <span className="snow-round">
        {demo ? (
          <>
            {icon} <b className="demo-round-label">Demo · Example {example + 1} of {examples}</b>
          </>
        ) : (
          <>
            {icon} Round {roundIndex + 1} of {total} · ⭐ {score}
          </>
        )}
      </span>
      {children}
      <span className="snow-round-tools">
        <DemoButton />
        <button className="link-button" onClick={onQuit}>
          Quit
        </button>
      </span>
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
