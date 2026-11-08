import { create } from "zustand";

import {
  STATIONS, stationOf, stationIndex, makeDeck, warmupDeck, reinsert, recordAnswer, readFactStats, writeFactStats,
  dayNumber, fastLimitMs, readTablesBest, writeTablesBest, medalFor, medalRank, roundCoins, nextStation, allBests,
  stationOpen, stationPool, ROUND_SECONDS, WARMUP_SECONDS, seeded,
} from "../../data/temple/templeTables.js";
import { isDemoActive } from "../demo/demoStore.js";
import { useProgress } from "../../progress/store.js";
import { useUI } from "../../ui/effects/uiStore.js";
import { isAdminMode } from "../../data/adminMode.js";
import { onProgressApplied } from "../../cloud/progressSync.js";

/**
 * TIMESTABLE TEMPLE — the one challenge store for all fifteen stations
 * (+ the Temple Warm-up). Each QUESTION is a "round" (so the shared demo
 * runner, the round-outcome XP rule and the checks all work unchanged):
 *
 *   idle       nothing open
 *   menu       a station's card: targets, best, Practise / Go for gold
 *   countdown  3 · 2 · 1 (the card counts; go() starts the clock)
 *   play       a question is up; digits go in via press()
 *   celebrate  right! (a blink — the card calls next())
 *   fix        a slip: the right answer + the quick way; type it to go on
 *   results    the round's card: right, medal, the facts fast/slow/missed
 *
 *   mode       "timed" (90 s, medals) · "practice" (no clock) ·
 *              "warmup" (60 s from the facts due for review)
 *
 * An answer goes in by itself once it has as many digits as the right one
 * (no Enter to press — Jeff wanted typing time considered); Enter / ✓ send
 * a shorter one. A wrong answer costs time, not points: the right answer
 * shows with the quick way, the student types it, and the fact comes back a
 * few questions later.
 */

const MAX_DIGITS = 3;
const now = () => (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());

/** A little store for the temple's other cards (the hub + the square). */
export const useTempleUI = create((set) => ({
  open: null, // null | "hub" | "square"
  version: 0, // bumps when fact records / bests change (the 3D wall + steles repaint)
  openHub: () => set({ open: "hub" }),
  openSquare: () => set({ open: "square" }),
  close: () => set({ open: null }),
  bump: () => set((s) => ({ version: s.version + 1 })),
}));

// A student's save arriving (sign-in / switch / sign-out) repaints the wall + stones.
onProgressApplied(() => useTempleUI.getState().bump());

const idle = {
  status: "idle", mode: "timed", station: null, rounds: [], roundIndex: 0, score: 0, typed: "",
  shownAt: 0, timeLeft: ROUND_SECONDS * 1000, count: 3, wrongs: 0, log: [], green: {}, streak: 0,
  slip: null, result: null, nudged: false,
};

function seedFor() {
  return Math.floor(Math.random() * 1e9);
}

export const useTempleTables = create((set, get) => ({
  key: "tables",
  ...idle,

  /** Open a station's card (any station key; default = the next one). */
  start(stationKey) {
    const st = stationOf(stationKey) || stationOf(get().station) || nextStation() || STATIONS[0];
    set({ ...idle, status: "menu", station: st.key });
  },

  /** Is the current station open for this student? */
  isOpen() {
    const s = get().station;
    return s ? stationOpen(s, allBests(), isAdminMode()) : false;
  },

  /** Go for gold: 3 · 2 · 1, then 90 seconds. */
  beginTimed() {
    const { station } = get();
    if (!station || !get().isOpen()) return;
    const stats = readFactStats();
    const rounds = makeDeck(station, { n: 150, stats, today: dayNumber(), rand: seeded(seedFor()) });
    set({ ...idle, status: "countdown", count: 3, mode: "timed", station, rounds, timeLeft: ROUND_SECONDS * 1000 });
  },

  /** Practice: no clock, no medal — the facts strip goes green. */
  beginPractice() {
    const { station } = get();
    if (!station || !get().isOpen()) return;
    const stats = readFactStats();
    const rounds = makeDeck(station, { n: 150, stats, today: dayNumber(), rand: seeded(seedFor()) });
    set({ ...idle, status: "play", mode: "practice", station, rounds, shownAt: now() });
  },

  /** The Temple Warm-up (60 s, from the facts due). Needs facts seen. */
  beginWarmup() {
    const rounds = warmupDeck(readFactStats(), dayNumber(), { n: 120, rand: seeded(seedFor()) });
    if (!rounds.length) return false;
    useTempleUI.getState().close();
    set({ ...idle, status: "countdown", count: 3, mode: "warmup", station: null, rounds, timeLeft: WARMUP_SECONDS * 1000 });
    return true;
  },

  /** The countdown card counts down; at 0 the clock starts. */
  countDown() {
    const { status, count } = get();
    if (status !== "countdown") return;
    if (count > 1) set({ count: count - 1 });
    else set({ status: "play", count: 0, shownAt: now() });
  },
  go() {
    if (get().status === "countdown") set({ status: "play", count: 0, shownAt: now() });
  },

  /** A demo plays these rounds (game/demo/demoRunner.js) — no clock. */
  demoStart(rounds) {
    const station = get().station || "x10";
    set({ ...idle, status: "play", mode: "timed", station, rounds, roundIndex: 0, score: 0, shownAt: now() });
  },

  currentRound() {
    const { rounds, roundIndex } = get();
    return rounds[roundIndex] || null;
  },

  /** A digit from the keypad / keyboard. */
  press(d) {
    // A quick typist starts the next answer during the right-answer blink:
    // move on straight away so no digit is lost.
    if (get().status === "celebrate") get().advance();
    const s = get();
    if (s.status !== "play" && s.status !== "fix") return;
    const q = s.rounds[s.roundIndex];
    if (!q || !/^[0-9]$/.test(String(d))) return;
    const typed = (s.typed + d).slice(0, MAX_DIGITS);
    if (s.status === "fix") {
      // Copying the right answer: a wrong digit clears it.
      const want = String(q.ans);
      if (!want.startsWith(typed)) {
        set({ typed: "", slip: { ...s.slip, wobble: (s.slip?.wobble || 0) + 1 } });
        return;
      }
      if (typed === want) {
        get().advance();
        return;
      }
      set({ typed });
      return;
    }
    set({ typed });
    // In by itself once it's as long as the answer (no Enter needed).
    if (typed.length >= String(q.ans).length) get().submit();
  },
  back() {
    const s = get();
    if (s.status === "play" || s.status === "fix") set({ typed: s.typed.slice(0, -1) });
  },
  clear() {
    if (get().status === "play") set({ typed: "" });
  },

  /** Check what's typed (auto, or Enter / ✓ for a shorter answer). */
  submit() {
    const s = get();
    if (s.status !== "play" || !s.typed) return null;
    const q = s.rounds[s.roundIndex];
    if (!q) return null;
    const ms = now() - s.shownAt;
    const right = Number(s.typed) === q.ans;
    const demo = isDemoActive();
    if (!demo) {
      const stats = recordAnswer(readFactStats(), q.key, { right, ms, digits: q.digits, today: dayNumber() });
      writeFactStats(stats);
      useTempleUI.getState().bump();
    }
    const log = [...s.log, { key: q.key, a: q.a, b: q.b, ans: q.ans, right, ms: Math.round(ms), fast: right && ms <= fastLimitMs(q.digits) }];
    if (right) {
      const green = s.mode === "practice" ? { ...s.green, [q.key]: true } : s.green;
      set({ status: "celebrate", score: s.score + 1, log, green, streak: s.streak + 1 });
      return "correct";
    }
    // A slip: show the right answer + the quick way; type it to go on. The
    // fact comes back soon (practice: three times, spaced out).
    const gaps = s.mode === "practice" ? [2, 4, 7] : [3];
    set({
      status: "fix", typed: "", wrongs: s.wrongs + 1, log, streak: 0,
      rounds: reinsert(s.rounds, s.roundIndex + 1, q, gaps),
      slip: { typed: s.typed, wobble: 0 },
    });
    return "wrong";
  },

  /** After the right-answer blink (the card calls it), or the demo. */
  next() {
    if (get().status !== "celebrate") return;
    get().advance();
  },
  advance() {
    const s = get();
    let rounds = s.rounds;
    if (s.roundIndex + 2 >= rounds.length) {
      // Never run out: top the deck up (a long practice).
      const more = s.mode === "warmup"
        ? warmupDeck(readFactStats(), dayNumber(), { n: 60 })
        : makeDeck(s.station || "x10", { n: 60, stats: readFactStats(), today: dayNumber() });
      rounds = [...rounds, ...(more.length ? more : rounds.slice(0, 30))];
    }
    set({ status: "play", rounds, roundIndex: s.roundIndex + 1, typed: "", slip: null, shownAt: now() });
  },

  /** The clock (the card ticks it every frame). Frozen during a demo. */
  tick(dtMs) {
    const s = get();
    if (s.mode === "practice" || isDemoActive()) return;
    if (s.status !== "play" && s.status !== "fix" && s.status !== "celebrate") return;
    const left = s.timeLeft - dtMs;
    if (left <= 0) {
      set({ timeLeft: 0 });
      get().finish();
    } else set({ timeLeft: left });
  },

  /** Practice nudge seen ("Looks like you're ready — go for gold?"). */
  markNudged() {
    set({ nudged: true });
  },

  /** Time's up (or "Finish" from practice): the results card. */
  finish() {
    const s = get();
    if (s.status === "idle" || s.status === "results" || s.status === "menu") return;
    const facts = summariseLog(s.log);
    let result = { score: s.score, wrongs: s.wrongs, facts, mode: s.mode };
    if (s.mode === "timed" && s.station && !isDemoActive()) {
      const bestBefore = readTablesBest(s.station);
      const medalBefore = medalFor(s.station, bestBefore);
      writeTablesBest(s.station, s.score);
      const best = Math.max(bestBefore, s.score);
      const medal = medalFor(s.station, s.score);
      const i = stationIndex(s.station);
      const nextSt = STATIONS[i + 1] || null;
      const opened = Boolean(nextSt && medalRank(medal) >= 1 && medalRank(medalBefore) < 1);
      const coins = s.score > 0 ? roundCoins(s.station, s.score, bestBefore) : 0;
      if (coins > 0) {
        useProgress.getState().awardRewards({ coins });
        const st = stationOf(s.station);
        useUI.getState().pushToast({ type: "reward", icon: "🏺", title: st.name, message: `${s.score} right — +${s.score} XP, +${coins} coins!` });
      }
      result = { ...result, bestBefore, best, newBest: s.score > bestBefore, medal: medal ? medal.id : null, medalBefore: medalBefore ? medalBefore.id : null, opened: opened ? nextSt.key : null, coins };
      useTempleUI.getState().bump();
    } else if (s.mode === "warmup" && !isDemoActive()) {
      // The first warm-up each day pays coins (1 per right answer, up to 15).
      let coins = 0;
      try {
        const k = "mma-tables-warmup-day";
        const today = String(dayNumber());
        if (localStorage.getItem(k) !== today && s.score > 0) {
          coins = Math.min(15, s.score);
          localStorage.setItem(k, today);
        }
      } catch {
        coins = 0;
      }
      if (coins) {
        useProgress.getState().awardRewards({ coins });
        useUI.getState().pushToast({ type: "reward", icon: "⚡", title: "Temple Warm-up", message: `${s.score} right — +${coins} coins for today's warm-up!` });
      }
      result = { ...result, coins };
    }
    set({ status: "results", result, typed: "" });
  },

  /** Back to the station's card. */
  toMenu() {
    const { station } = get();
    if (!station) {
      get().exit();
      useTempleUI.getState().openHub();
      return;
    }
    set({ ...idle, status: "menu", station });
  },

  exit() {
    set({ ...idle });
  },
}));

/** Per fact for the results card: fast / slow / missed (worst first). */
export function summariseLog(log = []) {
  const by = new Map();
  for (const e of log) {
    const cur = by.get(e.key) || { key: e.key, a: e.a, b: e.b, ans: e.ans, missed: false, slow: false, fast: false, n: 0 };
    cur.n++;
    if (!e.right) cur.missed = true;
    else if (e.fast) cur.fast = true;
    else cur.slow = true;
    by.set(e.key, cur);
  }
  const out = [...by.values()].map((f) => ({ ...f, verdict: f.missed ? "missed" : f.slow && !f.fast ? "slow" : f.slow ? "slow" : "fast" }));
  const rank = { missed: 0, slow: 1, fast: 2 };
  return out.sort((p, q) => rank[p.verdict] - rank[q.verdict] || p.ans - q.ans);
}

/** Practice: how much of the station's pool has gone green. */
export function practiceProgress(stationKey, green = {}) {
  const pool = stationPool(stationKey);
  const have = pool.filter((f) => green[f.key]).length;
  const st = stationOf(stationKey);
  const need = st && st.kind === "table" ? pool.length : Math.ceil(pool.length * 0.75);
  return { have, total: pool.length, need, ready: have >= need };
}

/** NON-REACTIVE: is any temple card up (freezes the walker)? */
export function isTempleBusy() {
  return useTempleTables.getState().status !== "idle" || useTempleUI.getState().open !== null;
}
