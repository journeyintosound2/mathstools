import React from "react";

/**
 * EMERALD JUNGLE — each challenge's two-step "how to play" card + one worked
 * example (the Snowball Sums / Magma shape). The examples deliberately use
 * DIFFERENT routes (doubling, halving and joining, building up…) — never
 * "find one first" as THE way: students may discover going through one, and
 * the teacher names it later (Jeff, 2026-10-10). Every intro ends on the same
 * promise: any route counts; only wrong numbers cost.
 */
const ANY = <>Any route is a good route — <b>only wrong numbers cost points</b>.</>;

export const JUNGLE_INTROS = {
  swap: {
    steps: [
      <>The deal is the first <b>rung</b> on the vine ladder: bananas on top, mangoes below, <b>tied together at 0</b>.</>,
      <>Make new rungs with a move — <b>one more swap</b>, <b>× 2</b>, <b>× 10</b>, <b>join two</b> — and type the other vine each time. Reach the 🎯 target! {ANY}</>,
    ],
    example: "3 🍌 ↔ 2 🥭 → × 10 → 30 🍌 ↔ 20 🥭",
  },
  market: {
    steps: [
      <>The price is the first rung: fruit on top, dollars below. Make new rungs — <b>halve</b>, <b>double</b>, <b>split</b>, <b>join two</b> — and type the price each time.</>,
      <>Build your way to the 🎯 amount. Two stalls? Build both to the <b>same amount of fruit</b>, then pick the better buy. {ANY}</>,
    ],
    example: "4 🍋 ↔ $9 → ÷ 2 → 2 🍋 ↔ $4.50 → join 4 + 2 → 6 🍋 ↔ $13.50",
  },
  race: {
    steps: [
      <>A racer's card is the first rung: <b>seconds</b> on top, <b>metres</b> below, tied at 0. Build rungs — <b>again</b>, <b>double</b>, <b>halve</b>, <b>join</b> — and type the other vine.</>,
      <>Reach the 🎯 to see how far (or how long). Two racers? Line them up at the <b>same time</b> or the <b>same distance</b> before you say who's faster. {ANY}</>,
    ],
    example: "4 s ↔ 6 m → × 2 → 8 s ↔ 12 m → join 8 + 4 → 12 s ↔ 18 m",
  },
  tape: {
    steps: [
      <>The tape has a different unit on each edge. Look across the rungs: <b>one number</b> takes you from the left edge to the right on <b>every</b> rung — type it.</>,
      <>Then reach the 🎯: jump straight there with <b>↔ Across</b>, or build along the tape. {ANY}</>,
    ],
    example: "1 week ↔ 7 days · 2 weeks ↔ 14 days → × 7 on every rung → 3.5 weeks ↔ 24.5 days",
  },
  potion: {
    steps: [
      <>A recipe is a rung: <b>🔵 moonberry</b> on top, <b>🟡 sunfruit</b> below. Scale it on the ladder and the potion keeps its colour — at any size.</>,
      <>Adding the SAME scoops to both changes the colour! Two potions? Line them up at the <b>same blue</b> to see which is bluer. {ANY}</>,
    ],
    example: "2 🔵 ↔ 3 🟡 → × 2 → 4 🔵 ↔ 6 🟡 → join → 6 🔵 ↔ 9 🟡 — same colour",
  },
  barrels: {
    steps: [
      <>The pipe's rate is the first rung: <b>seconds</b> on top, <b>litres</b> below. Build along the ladder to time the tap.</>,
      <>A rate is "<b>per</b>": find litres per minute, per hour — and add two pipes together. {ANY}</>,
    ],
    example: "10 s ↔ 4 L → × 3 → 30 s ↔ 12 L → × 2 → 60 s ↔ 24 L (24 L a minute)",
  },
  map: {
    steps: [
      <>The map's scale is the first rung: <b>map cm</b> on top, <b>real metres</b> below. The bottom vine is the real trail.</>,
      <>Build to the route's length and the explorer digs where you say. A scale like <b>1 : 2500</b>? Change the cm into metres first. {ANY}</>,
    ],
    example: "2 cm ↔ 50 m → × 3 → 6 cm ↔ 150 m → join 6 + 1 (half of 2) → 7 cm ↔ 175 m",
  },
  fireflies: {
    steps: [
      <>Stand the ladder up! <b>Minutes</b> run along the ground, <b>kilometres</b> up the redwood. Every rung you build is a <b>firefly</b> at (time, distance).</>,
      <>A true ladder's fireflies sit on <b>one straight line from the roots</b>. Steeper = faster. Build fireflies to answer — or to check a line. {ANY}</>,
    ],
    example: "30 min ↔ 2 km → × 2 → 60 min ↔ 4 km → join → 90 min ↔ 6 km — all on one line",
  },
  temple: {
    steps: [
      <>Each tablet shows a jungle situation and its pairs. Decide: does it hang as a <b>ladder</b> — tied at 0, every rung straight? Or does the ladder <b>break</b>?</>,
      <>If it works, finish the tablet on the ladder. If it breaks, say <b>why</b>: a fee at the start, the same difference, stays the same, grows faster, or one up and one down.</>,
    ],
    example: "Canoe hire: $10 + $5 an hour → 1 h ↔ $15 but 2 h ↔ $20, not $30 — it breaks (a fee)",
  },
  pathfinder: {
    steps: [
      <>Plan an expedition: <b>one ladder after another</b>. The answer to the first ladder is the 🎯 of the next — map to metres, metres to seconds; swaps to prices.</>,
      <>Build each ladder your own way. {ANY}</>,
    ],
    example: "Map 4 cm → 100 m · then walk 100 m at 10 m every 8 s → 80 s",
  },
};

/** Per-challenge names for the moves (the card's buttons). */
export const JUNGLE_MOVE_LABELS = {
  swap: { again: "➕ One more swap" },
  market: {},
  potion: { again: "➕ One more batch" },
};
