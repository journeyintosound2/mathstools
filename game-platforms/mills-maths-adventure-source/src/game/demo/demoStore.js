import { create } from "zustand";

/**
 * CHALLENGE DEMOS (2026-10-24) — the live "watch how to play" state.
 *
 * Every in-world challenge (Snowball Sums, Magma Multiples, Fraction Farm,
 * Emerald Jungle) teaches its rules by PLAYING ITSELF: the real stage and the
 * real card run two worked examples while a hand taps the real buttons and
 * the host explains each step. This store is what the overlay
 * (ui/demo/DemoOverlay.jsx) draws; the runner (game/demo/demoRunner.js)
 * writes it. Nothing here is saved except two per-device preferences: which
 * demos this device has watched (so the first visit auto-plays) and
 * read-aloud on/off.
 */

const SPEAK_KEY = "mma-demo-speak";
const SEEN_PREFIX = "mma-demo-seen:";

function readSpeak() {
  try {
    return localStorage.getItem(SPEAK_KEY) === "1";
  } catch {
    return false;
  }
}

export const useDemo = create((set) => ({
  active: false, // a demo is running (the challenge is playing itself)
  key: null, // the demo's challenge key ("snow-range" …)
  mode: null, // "intro" (first time / ready card) | "replay" (mid-game)
  example: 0, // which worked example (0 or 1)
  examples: 2,
  step: null, // { n, title } — "Step 1 · Fill the crate"
  caption: null, // { text, think, at } — what the host is saying now
  paused: false,
  hand: null, // { x, y, press, drag, at } — the pointing hand (screen px)
  spot: null, // { x, y, w, h, circle } — the soft highlight ring
  ended: false, // the "Your turn!" card is up
  hold: false, // true → RoundCelebrate must not auto-advance (end of the demo)
  speak: readSpeak(),

  setSpeak(on) {
    try {
      localStorage.setItem(SPEAK_KEY, on ? "1" : "0");
    } catch {
      /* a nicety only */
    }
    set({ speak: on });
  },
}));

/** Is a demo playing right now? (non-reactive — safe anywhere) */
export function isDemoActive() {
  return useDemo.getState().active;
}

export function demoSeen(key) {
  try {
    return localStorage.getItem(SEEN_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

export function markDemoSeen(key) {
  try {
    localStorage.setItem(SEEN_PREFIX + key, "1");
  } catch {
    /* a nicety only */
  }
}

/** For the title screen's "Start new game" (and the checks). */
export function clearDemoSeen() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(SEEN_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
