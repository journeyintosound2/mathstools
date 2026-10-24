/**
 * CHALLENGE DEMO CHECKS (DM1–DM6, 2026-10-24).
 *
 * Every in-world challenge teaches its rules with a live two-example demo
 * (game/demo/). These guard that it stays that way:
 *   DM1  every challenge store has a demo (a new challenge without one fails)
 *   DM2  each demo is well-formed: unique key, a host with a face, exactly
 *        two examples, two real, different rounds from its own generator
 *   DM3  (async) each demo PLAYS: run headlessly (dry mode — every tap runs
 *        its store action), both examples end on a right answer with full
 *        marks — so a change to a challenge that breaks its demo is caught
 *   DM4  (async) a demo never banks XP or coins
 *   DM5  (async) the mid-game ▶ Demo puts the game back exactly as it was
 */
import { ALL_CHALLENGE_STORES } from "../game/farmChallengeActive.js";
import { DEMOS } from "../game/demo/registry.js";
import { dryRunDemo, startDemo, finishDemo, setDemoDry } from "../game/demo/demoRunner.js";
import { roundPointsOf } from "../game/roundOutcome.js";
import { useProgress } from "../progress/store.js";
import { speakerInfo } from "../ui/dialogue/speakers.js";

const ok = (name, pass, detail) => ({ name, pass: Boolean(pass), detail });

export function runDemoChecks() {
  const out = [];
  // DM1
  const missing = ALL_CHALLENGE_STORES.filter((s) => !DEMOS.some((d) => d.store === s));
  const names = missing.map((s) => {
    try {
      return s.getState().key || Object.keys(s.getState()).slice(0, 3).join("/");
    } catch {
      return "?";
    }
  });
  out.push(ok("DM1 every challenge has a demo", missing.length === 0, missing.length ? `no demo: ${names.join(", ")}` : `${DEMOS.length} demos for ${ALL_CHALLENGE_STORES.length} challenges`));

  // DM2
  const bad = [];
  const keys = new Set();
  for (const d of DEMOS) {
    if (keys.has(d.key)) bad.push(`${d.key}: duplicate key`);
    keys.add(d.key);
    if (!d.name || !d.icon) bad.push(`${d.key}: name/icon`);
    const face = speakerInfo(d.host || "");
    if (!d.host || (!face.img && face.icon === "💬")) bad.push(`${d.key}: host "${d.host}" has no face in speakers.js`);
    if (!Array.isArray(d.examples) || d.examples.length !== 2) bad.push(`${d.key}: ${d.examples ? d.examples.length : 0} examples`);
    let rounds = null;
    try {
      rounds = d.rounds();
    } catch (e) {
      bad.push(`${d.key}: rounds() threw ${e.message}`);
    }
    if (rounds) {
      if (rounds.length !== 2 || !rounds[0] || !rounds[1]) bad.push(`${d.key}: needs 2 rounds`);
      else if (JSON.stringify(rounds[0]) === JSON.stringify(rounds[1])) bad.push(`${d.key}: the two examples are the same round`);
    }
  }
  out.push(ok("DM2 demos well-formed (host, 2 examples, 2 real rounds)", bad.length === 0, bad.length ? bad.slice(0, 8).join(" · ") : `${DEMOS.length} demos`));
  return out;
}

/** The async half (needs to await each demo's script). */
export async function runDemoPlayChecks() {
  const out = [];
  const fails = [];
  const xpFails = [];
  const t0 = Date.now();
  const before = { ...useProgress.getState() };
  for (const d of DEMOS) {
    const st = d.store.getState();
    if (st.status !== "idle") st.exit();
    // Real game first (the demo replaces it), as when a student walks up.
    d.store.getState().start();
    const xp0 = useProgress.getState().xp;
    const coins0 = useProgress.getState().coins;
    let res;
    try {
      res = await dryRunDemo(d);
    } catch (e) {
      res = { completed: false, error: e.message };
    }
    const s = d.store.getState();
    const max = d.maxPoints ?? 25;
    const pts = roundPointsOf(d.store, s);
    if (!res.completed) fails.push(`${d.key}: ${res.error || "did not finish"}`);
    else if (s.status !== (d.endsOn || "celebrate")) fails.push(`${d.key}: ended on "${s.status}" (not ${d.endsOn || "celebrate"})`);
    else if (s.roundIndex !== 1) fails.push(`${d.key}: ended on round ${s.roundIndex + 1}`);
    else if (pts < max) fails.push(`${d.key}: example 2 scored ${pts}/${max}`);
    else if (s.score < 2 * max) fails.push(`${d.key}: both examples scored ${s.score}/${2 * max}`);
    if (useProgress.getState().xp !== xp0 || useProgress.getState().coins !== coins0) xpFails.push(d.key);
    d.store.getState().exit();
  }
  out.push(ok("DM3 every demo plays both examples to a right answer (full marks)", fails.length === 0, fails.length ? fails.slice(0, 10).join(" · ") : `${DEMOS.length} demos, ${((Date.now() - t0) / 1000).toFixed(1)}s`));
  out.push(ok("DM4 a demo never banks XP or coins", xpFails.length === 0, xpFails.length ? `banked: ${xpFails.join(", ")}` : "XP + coins untouched"));
  void before;

  // DM5 — the mid-game replay goes back exactly.
  const rfails = [];
  setDemoDry(true);
  try {
    for (const d of DEMOS) {
      d.store.getState().start();
      const s0 = d.store.getState();
      if (s0.status === "intro" && s0.beginRounds) s0.beginRounds();
      d.store.setState({ score: 42 });
      const snap = d.store.getState();
      const run = startDemo(d, "replay");
      await run.promise;
      finishDemo(run);
      const s1 = d.store.getState();
      if (s1.rounds !== snap.rounds || s1.roundIndex !== snap.roundIndex || s1.score !== 42 || s1.status !== snap.status) {
        rfails.push(`${d.key}: ${s1.status}/${s1.roundIndex}/${s1.score}`);
      }
      d.store.getState().exit();
    }
  } finally {
    setDemoDry(false);
  }
  out.push(ok("DM5 ▶ Demo mid-game puts the game back exactly", rfails.length === 0, rfails.length ? rfails.slice(0, 8).join(" · ") : `${DEMOS.length} demos`));
  return out;
}
