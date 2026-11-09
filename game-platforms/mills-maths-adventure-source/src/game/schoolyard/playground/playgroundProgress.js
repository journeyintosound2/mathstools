/**
 * Playground per-challenge bests + key tally.
 *
 * - A medal is stored per challenge id, like the farm / snow / jungle / magma
 *   worlds: `mma-playground-<id>-best` holds `{ score, total, medal, when }`.
 * - A bronze (or better) means the key is earned; better medals replace worse
 *   ones but never downgrade.
 * - Cloud progress carries the bests across devices: see `SYNCED_KEY` in
 *   `src/cloud/progressMerge.js` — the glob pattern must include `playground`.
 */
const TIER = { bronze: 1, silver: 2, gold: 3 };

const keyOf = (id) => `mma-playground-${id}-best`;

/** Read a saved best, or null. */
export function readPlaygroundBest(id) {
  try {
    const raw = globalThis.localStorage?.getItem(keyOf(id));
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : null;
  } catch { return null; }
}

/**
 * Save a result if it beats the previous best. Returns `true` if a NEW key
 * was earned (bronze+ this time but no medal before), or if the medal was
 * UPGRADED (silver over bronze, etc).
 */
export function savePlaygroundBest(id, now, prev) {
  if (!now || !now.medal) return false;
  const nowT = TIER[now.medal] || 0;
  const prevT = prev && prev.medal ? (TIER[prev.medal] || 0) : 0;
  if (nowT <= prevT && (!prev || now.score <= (prev.score || 0))) return false;
  const next = { ...prev, ...now };
  try { globalThis.localStorage?.setItem(keyOf(id), JSON.stringify(next)); } catch { /* ignore */ }
  return nowT > prevT;
}

/** All challenge ids that have a bronze+ saved (= keys earned). */
export function playgroundKeysFromStorage(ids) {
  const out = [];
  for (const id of ids) {
    const b = readPlaygroundBest(id);
    if (b && TIER[b.medal]) out.push(id);
  }
  return out;
}

/** Medal tier counts across the given ids: { bronze, silver, gold, total }. */
export function playgroundMedalCounts(ids) {
  const c = { bronze: 0, silver: 0, gold: 0, total: 0 };
  for (const id of ids) {
    const b = readPlaygroundBest(id);
    if (!b || !TIER[b.medal]) continue;
    c[b.medal]++; c.total++;
  }
  return c;
}
