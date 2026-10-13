import { create } from "zustand";

/**
 * FALLING IN (2026-10-13 — Jeff: "i accidently fell into the water and I am in
 * an infinite loop of falling and trying to get pushed back… if they fall
 * into the water, play a 'you died' type animation and then send them back to
 * the starting spawn point").
 *
 * Two hazards, two responses:
 *
 *   WATER (Number Island's deep sea, Snowball Sums' freezing lake) → WIPED
 *   OUT: the player sinks with a splash, the screen irises shut on a big
 *   card ("WIPED OUT!"), and they reappear at the world's spawn point. No
 *   physics is involved in getting back, so there is nothing to loop.
 *
 *   LAVA (Magma Multiples, Ember Peak) keeps its "hot-foot" hop back to where
 *   you were — but it is now a GUIDED hop: a scripted arc from the touch
 *   point to a remembered safe spot that lands EXACTLY on it (the old
 *   ballistic bounce could fall short onto a cliff, slide back in, and
 *   repeat forever). Spots are remembered along your path; a quick second
 *   touch hops further back; a third within ten seconds goes to the spawn.
 *
 * The pure helpers here are shared by Player.jsx and the headless checks.
 */

// The wipe-out sequence (ms from the moment you go under).
export const WIPE = {
  sinkMs: 1100, // the player sinks this long…
  sinkDepth: 1.9, // …this far (metres)
  closeAt: 400, // the iris starts closing
  shutAt: 1150, // fully dark — the card is up
  teleportAt: 2200, // moved to the spawn while it's dark
  openAt: 2700, // the iris opens on the spawn
  endAt: 3300, // the overlay is gone
};

export const useWipeout = create((set, get) => ({
  active: null, // { id, at, kind, line }
  start(info) {
    set({ active: { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, at: Date.now(), ...info } });
  },
  end(id) {
    const a = get().active;
    if (a && (!id || a.id === id)) set({ active: null });
  },
}));

// ---------------------------------------------------------------------------
// The lava hop
// ---------------------------------------------------------------------------
export const TRAIL_STEP = 0.6; // remember a spot every 0.6 m of safe ground
export const TRAIL_MAX = 36; // ≈ the last 20 m of path
export const HOP_MIN_BACK = 2.2; // hop at least this far from the touch point
export const HOP_REPEAT_MS = 10000; // three touches in this long → the spawn
export const HOP_EDGE_R = 1.0; // a spot with hazard this close is an "edge" spot

/**
 * Where should a hop land? `trail` is oldest → newest safe spots
 * ({x, y, z, edge}); `hits` the touch times in the last HOP_REPEAT_MS
 * (including this one). Prefers the newest NON-edge spot at least
 * HOP_MIN_BACK from the touch, then any such spot, then the oldest. Returns
 * { spot, keep } (keep = how many trail entries survive — the ones nearer
 * the hazard are dropped, so a second touch goes further back), or
 * { spot: null } → go to the spawn.
 */
export function pickHopTarget(trail, from, hits) {
  if (!trail || !trail.length || hits >= 3) return { spot: null, keep: 0 };
  const far = (s) => Math.hypot(s.x - from.x, s.z - from.z) >= HOP_MIN_BACK;
  for (let i = trail.length - 1; i >= 0; i--) {
    if (!trail[i].edge && far(trail[i])) return { spot: trail[i], keep: i + 1 };
  }
  for (let i = trail.length - 1; i >= 0; i--) {
    if (far(trail[i])) return { spot: trail[i], keep: i + 1 };
  }
  return { spot: trail[0], keep: 1 };
}

/**
 * The hop's arc from `from` to `to` ({x, y, z}): clears the higher end AND
 * any ground along the way by a margin, lasts longer for a longer hop.
 * `groundAt(x, z)` = the walkable height (any deck counts).
 */
export function planHop(from, to, groundAt) {
  let top = Math.max(from.y, to.y);
  for (let i = 1; i < 10; i++) {
    const s = i / 10;
    top = Math.max(top, groundAt(from.x + (to.x - from.x) * s, from.z + (to.z - from.z) * s));
  }
  const peak = top + 2;
  const dist = Math.hypot(to.x - from.x, to.z - from.z);
  const dur = Math.min(1500, Math.max(750, 600 + dist * 45));
  return { from: { ...from }, to: { ...to }, h: peak - (from.y + to.y) / 2, dur };
}

/** Where the hop is at s ∈ [0, 1] (lands exactly on `to` at s = 1). */
export function hopPoint(hop, s) {
  const t = Math.max(0, Math.min(1, s));
  const { from: a, to: b } = hop;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t + 4 * hop.h * t * (1 - t),
    z: a.z + (b.z - a.z) * t,
  };
}
