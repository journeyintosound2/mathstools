/**
 * EVERY CHALLENGE DEMO, in one list (2026-10-24). A new challenge MUST add
 * its demo here (see CLAUDE.md "Challenge demos" — the DM checks fail if an
 * in-world challenge store has no demo).
 */
import { SNOW_DEMOS } from "./scripts/snowDemos.js";
import { MAGMA_DEMOS } from "./scripts/magmaDemos.js";
import { FARM_DEMOS } from "./scripts/farmDemos.js";
import { JUNGLE_DEMOS } from "./scripts/jungleDemos.js";

export const DEMOS = [...SNOW_DEMOS, ...MAGMA_DEMOS, ...FARM_DEMOS, ...JUNGLE_DEMOS];

const BY_KEY = new Map(DEMOS.map((d) => [d.key, d]));

export function demoFor(key) {
  return key ? BY_KEY.get(key) || null : null;
}

export function demoForStore(store) {
  return DEMOS.find((d) => d.store === store) || null;
}

/** The demo of the challenge that's running now (or `key`'s). */
export function activeDemoDef(key) {
  if (key) return demoFor(key);
  for (const d of DEMOS) if (d.store.getState().status !== "idle") return d;
  return null;
}
