import { create } from "zustand";

import { normaliseResult } from "./resultTypes.js";

/**
 * RESULT STORE (Phase 2L) — LOCAL attempt history.
 *
 * Stored in its OWN localStorage key (separate from game progress), so clearing
 * results never touches story/mission progress, and old saves with no result
 * data simply start empty. Robust: tolerates malformed JSON, missing fields,
 * and caps the history so localStorage stays small.
 *
 * A future Firebase move replaces load/save here with Firestore reads/writes —
 * the record shape (resultTypes.js) is already aligned.
 */
export const RESULTS_KEY = "mills-maths-adventure:results";

// Keep at most the latest N attempts (documented cap to bound storage size).
export const MAX_RESULTS = 200;

function loadResults() {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.results) ? parsed.results : [];
    // Normalise each (drops malformed entries safely).
    return list.map((r) => {
      try { return normaliseResult(r); } catch { return null; }
    }).filter(Boolean);
  } catch (err) {
    console.warn("Could not load results:", err);
    return [];
  }
}

function saveResults(list) {
  try {
    localStorage.setItem(RESULTS_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Could not save results:", err);
  }
}

export const useResults = create((set, get) => ({
  results: loadResults(),

  // Save a completed attempt. Normalises, de-duplicates by attemptId (so a
  // re-render or double-fire can't create a duplicate), prepends newest-first,
  // and caps the history. Returns the stored record (or the existing one).
  addResult(raw) {
    const record = normaliseResult(raw);
    const existing = get().results;
    if (existing.some((r) => r.attemptId === record.attemptId)) {
      return record; // duplicate — ignore
    }
    const next = [record, ...existing].slice(0, MAX_RESULTS);
    set({ results: next });
    saveResults(next);
    return record;
  },

  getResults() {
    return get().results;
  },

  latest() {
    return get().results[0] || null;
  },

  // Swap in another student's history (cloud progress, a shared device —
  // progressSync.js keeps each student's list aside on this device).
  replaceResults(list) {
    const next = (Array.isArray(list) ? list : []).map((r) => {
      try { return normaliseResult(r); } catch { return null; }
    }).filter(Boolean).slice(0, MAX_RESULTS);
    set({ results: next });
    saveResults(next);
  },

  // Clear ONLY the results history (never game/story/mission progress).
  clearResults() {
    set({ results: [] });
    try { localStorage.removeItem(RESULTS_KEY); } catch { /* ignore */ }
  },
}));
