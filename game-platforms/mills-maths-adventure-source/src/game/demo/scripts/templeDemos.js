/**
 * TIMESTABLE TEMPLE — the shared demo for all fifteen stations (2026-11-08).
 * Dash plays two questions from the station the student opened: example 1
 * shows the keypad (the answer goes in by itself — no Enter), the clock and
 * the medal track; example 2 asks the watcher to answer in their head first,
 * then explains what a slip does and where Practise is. The clock is frozen
 * while it plays and nothing is recorded (templeStore asks isDemoActive()).
 */
import { useTempleTables } from "../../temple/templeStore.js";
import { stationOf, questionOf, factKey, TABLE_ORDER } from "../../../data/temple/templeTables.js";

const SCOPE = ".tt-panel";
const st = () => useTempleTables.getState();

/** Two different questions from the open station (two-digit answers, so the keypad shows). */
function demoRounds() {
  const station = stationOf(st().station) || stationOf("x10");
  const t = station.kind === "table" ? station.table : (station.newTables || TABLE_ORDER)[0];
  const t2 = station.kind === "table" ? t : (station.newTables || TABLE_ORDER)[1] || t;
  const pick = (table, ms) => {
    const m = ms.find((x) => table * x >= 10) || 6;
    return { a: table, b: m, ans: table * m, key: factKey(table, m), digits: String(table * m).length };
  };
  const r1 = pick(t, [6, 7, 4, 8, 3]);
  let r2 = pick(t2, [8, 3, 9, 7, 5]);
  if (r2.key === r1.key) r2 = pick(t2, [9, 11, 12]);
  // Example 2 the other way round (4 × 7 as well as 7 × 4).
  r2 = { ...r2, a: r2.b, b: r2.a };
  void questionOf;
  return [r1, r2];
}

async function typeAnswer(d, ans) {
  for (const ch of String(ans)) {
    await d.tap(d.btn(new RegExp(`^${ch}$`), SCOPE), () => st().press(ch), { linger: 260 });
    await d.sleep(180);
  }
}

export const TEMPLE_DEMOS = [
  {
    key: "tables",
    name: "Timestable Temple",
    icon: "🏺",
    host: "Dash",
    store: useTempleTables,
    maxPoints: 1,
    endsOn: "celebrate",
    rounds: demoRounds,
    ready: (s) => s.status === "play",
    examples: [
      async (d, r) => {
        d.step(1, "Answer as fast as you can");
        await d.say(`Every station is a race! Here's a question: **${r.a} × ${r.b}**.`);
        await d.point(d.sel(".tt-pad", null, SCOPE), { ms: 700 });
        await d.say(`Tap the numbers — or type them on a keyboard. **${r.ans}**…`, { ms: 2200 });
        await typeAnswer(d, r.ans);
        await d.say("No Enter needed — the answer goes in by itself as soon as it has enough digits. ✓", { ms: 3200 });
        d.step(2, "Beat the clock");
        await d.point(d.sel(".tt-clock", null, SCOPE), { ms: 600 });
        await d.say("You get **90 seconds**. The clock is stopped while I show you.");
        await d.point(d.sel(".tt-track", null, SCOPE), { ms: 600 });
        await d.say("Every right answer moves you along the track — past 🥉 bronze, 🥈 silver, all the way to 🥇 gold!");
      },
      async (d, r) => {
        d.step(3, "Your turn to think");
        await d.think(`What's **${r.a} × ${r.b}**? Say it in your head — quick!`, 2600);
        await typeAnswer(d, r.ans);
        await d.say(`**${r.ans}** ✓ — the same fact as ${r.b} × ${r.a}, just turned around.`);
        d.step(4, "Slips and practice");
        await d.say("A slip costs a little time, never points: the right answer shows with a quick way to work it out — type it, and that fact comes back soon.");
        await d.say("Not ready for the clock? Press **Practise** first — no timer at all. Win a 🥉 bronze to open the next station!");
      },
    ],
  },
];
