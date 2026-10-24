import React from "react";

import { startDemo } from "../../game/demo/demoRunner.js";
import { activeDemoDef } from "../../game/demo/registry.js";
import { useDemo } from "../../game/demo/demoStore.js";

/**
 * "▶ Demo" — on every challenge card's round header, so a student can watch
 * the two worked examples again at ANY point mid-game. Afterwards the game
 * comes back exactly where they left it (score, round, everything).
 */
export default function DemoButton({ demoKey }) {
  const active = useDemo((s) => s.active);
  const def = activeDemoDef(demoKey);
  if (!def || active) return null;
  return (
    <button
      className="demo-chip"
      title="Watch how to play"
      aria-label="Watch the demo again"
      onClick={(e) => {
        e.currentTarget.blur();
        startDemo(def, "replay");
      }}
    >
      <span className="demo-chip-play">▶</span> Demo
    </button>
  );
}

/**
 * The round label on a farm card: "Round 3/15 · 50 pts" — or, while the demo
 * plays, "Demo · Example 1 of 2".
 */
export function DemoRound({ children }) {
  const active = useDemo((s) => s.active);
  const example = useDemo((s) => s.example);
  const examples = useDemo((s) => s.examples);
  if (!active) return <>{children}</>;
  return <b className="demo-round-label">Demo · Example {example + 1} of {examples}</b>;
}
