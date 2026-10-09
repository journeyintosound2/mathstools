/**
 * ACHIEVEMENTS WALL — the data behind the six boards on Number Island's
 * Achievements Wall (one per world). Pure: it takes the saved progress + the
 * results list (and reads each world's local trophy bests through that
 * world's own records module), and returns plain objects the 3D wall paints
 * onto its boards and the viewer reads aloud.
 *
 *   island      Level + XP, coins, the three island friends' best scores
 *               (Pip / Fern / Alby — a pass is 80%),
 *               the badge collection.
 *   playground  The Retrieval Practice Playground: the eight staff keys +
 *               the Head Teacher's trophy.
 *   farm        Fraction Farm's ten trophies.
 *   snow        Snowball Sums' ten trophies.
 *   magma       Magma Multiples' ten trophies.
 *   jungle      Emerald Jungle's ten trophies (the vine-ladder challenges;
 *               the ones still being built say "coming soon").
 */
import { deriveLevel, XP_PER_LEVEL } from "../../progress/store.js";
import { summariseByTopic, PLAYGROUND_PASS_MARK } from "../../results/resultUtils.js";
import { getAllBadges } from "../badges.js";
import { SCHOOLYARD_CHARACTERS } from "../schoolyard/schoolyardLayout.js";
import { farmTrophyRows, MEDALS } from "../farm/farmRecords.js";
import { snowTrophyRows } from "../snow/snowRecords.js";
import { magmaTrophyRows } from "../magma/magmaRecords.js";
import { jungleTrophyRows } from "../jungle/jungleRecords.js";

export { MEDALS };

/** Has the player ever been to a region? (sessionStore.setRegion stamps it.) */
export const VISITED_KEY = (regionId) => `mma-visited:${regionId}`;
export function hasVisited(regionId) {
  try { return localStorage.getItem(VISITED_KEY(regionId)) === "1"; } catch { return false; }
}
export function markVisited(regionId) {
  try { localStorage.setItem(VISITED_KEY(regionId), "1"); } catch { /* a nicety only */ }
}

/** Counts of each medal in a list of trophy rows. */
export function medalCounts(rows) {
  const c = { gold: 0, silver: 0, bronze: 0 };
  for (const r of rows) if (r.medal) c[r.medal.id] += 1;
  return c;
}

export const ISLAND_FRIENDS = [
  { id: "pip", topicId: "integers", name: "Pip", icon: "🌡️", topic: "Integers" },
  { id: "fern", topicId: "fdp", name: "Fern", icon: "🦊", topic: "Fractions, decimals & %" },
  { id: "alby", topicId: "algebra", name: "Alby", icon: "🦉", topic: "Algebra" },
];

function trophyPanel(id, title, icon, colors, rows, regionId) {
  const counts = medalCounts(rows);
  const earned = counts.gold + counts.silver + counts.bronze;
  const pct = rows.length ? Math.round(rows.reduce((a, r) => a + r.pct, 0) / rows.length) : 0;
  return {
    id, title, icon, ...colors, kind: "trophies", regionId,
    // A world with any best on its boards has obviously been visited (the
    // visited stamp only started on 2026-10-09, after many students played).
    visited: hasVisited(regionId) || rows.some((r) => (r.best || 0) > 0),
    rows: rows.map((r) => ({ key: r.key, icon: r.icon, name: r.name, pct: r.pct, medal: r.medal ? r.medal.id : null, best: r.best, soon: Boolean(r.soon) })),
    counts, earned, total: rows.length, pct,
    headline: `${earned} / ${rows.length} trophies`,
    summary: earned
      ? `${earned} of ${rows.length} trophies — ${counts.gold} gold, ${counts.silver} silver, ${counts.bronze} bronze.`
      : `No trophies yet — ${rows.length} challenges are waiting for you.`,
  };
}

/**
 * Everything the wall shows. `progress` = the progress store's state (or any
 * object with xp / coins / earnedBadges / completedMissions / profile);
 * `results` = the results store's list.
 */
export function achievementsSummary(progress = {}, results = []) {
  const xp = progress.xp || 0;
  const lvl = deriveLevel(xp);
  const earnedIds = new Set((progress.earnedBadges || []).map((b) => b.badgeId));
  const done = new Set(progress.completedMissions || []);

  // --- Number Island ---------------------------------------------------------
  const byTopic = new Map(summariseByTopic(results).map((t) => [t.topicId, t]));
  const friends = ISLAND_FRIENDS.map((f) => {
    const t = byTopic.get(f.topicId);
    const best = t ? Math.round(t.bestScore || 0) : 0;
    return { ...f, best, attempts: t ? t.attempts : 0, passed: best >= PLAYGROUND_PASS_MARK };
  });
  const passedFriends = friends.filter((f) => f.passed).length;
  const badges = getAllBadges().map((b) => ({ id: b.badgeId, icon: b.icon, name: b.badgeName, earned: earnedIds.has(b.badgeId) }));
  const island = {
    id: "island", title: "Number Island", icon: "🌴", color: "#1f7fc4", deep: "#134f7d", light: "#e3f3ff", kind: "island",
    level: lvl.level, xpInto: lvl.xpIntoLevel, xpFor: XP_PER_LEVEL, xp, coins: progress.coins || 0,
    friends, passedFriends, allPassed: passedFriends === friends.length, badges, badgesEarned: badges.filter((b) => b.earned).length,
    passMark: PLAYGROUND_PASS_MARK,
    headline: `Level ${lvl.level}`,
    summary: `Level ${lvl.level} with ${progress.coins || 0} coins. ${passedFriends} of 3 island friends passed at ${PLAYGROUND_PASS_MARK}% or more. ${badges.filter((b) => b.earned).length} of ${badges.length} badges.`,
  };

  // --- Retrieval Practice Playground ------------------------------------------
  const staff = SCHOOLYARD_CHARACTERS.filter((c) => !c.boss).map((c) => ({ id: c.id, name: c.name, color: c.color, done: done.has(`warmup-${c.id}`) }));
  const boss = SCHOOLYARD_CHARACTERS.find((c) => c.boss);
  const bossDone = boss ? done.has(`warmup-${boss.id}`) : false;
  const keys = staff.filter((s) => s.done).length;
  const playground = {
    id: "playground", title: "Retrieval Practice Playground", short: "The Playground", icon: "🏫",
    color: "#d9822b", deep: "#8a4a12", light: "#fff1e0", kind: "playground", regionId: "schoolyard",
    visited: hasVisited("schoolyard") || keys > 0 || bossDone,
    staff, keys, totalKeys: staff.length, boss: boss ? { name: boss.name, done: bossDone } : null,
    headline: bossDone ? "Champion!" : `${keys} / ${staff.length} keys`,
    summary: bossDone
      ? `All ${staff.length} keys and the Head Teacher's trophy — Schoolyard Champion!`
      : keys
        ? `${keys} of ${staff.length} staff keys collected.${keys === staff.length ? " The Head Teacher is waiting!" : ""}`
        : `Go through the school gate on Schoolhouse Hill — ${staff.length} teachers each hold a key.`,
  };

  // --- The three trophy worlds ------------------------------------------------
  const farm = trophyPanel("farm", "Fraction Farm", "🌾", { color: "#e2a018", deep: "#8a5a08", light: "#fff6dc" }, farmTrophyRows(), "farm-parts-whole");
  const snow = trophyPanel("snow", "Snowball Sums", "❄️", { color: "#2f95d0", deep: "#17577e", light: "#e8f6ff" }, snowTrophyRows(), "snow-sums");
  const magma = trophyPanel("magma", "Magma Multiples", "🌋", { color: "#d9442a", deep: "#7f1f10", light: "#ffece6" }, magmaTrophyRows(), "magma-multiples");

  // --- Emerald Jungle: the vine-ladder challenges (two built so far) --------
  const jungle = trophyPanel("jungle", "Emerald Jungle", "🌿", { color: "#1f9a4c", deep: "#0f5a2b", light: "#e6f8ec" }, jungleTrophyRows(), "emerald-jungle");
  {
    const open = jungle.rows.filter((r) => !r.soon).length;
    if (!jungle.earned) {
      jungle.summary = jungle.visited
        ? `No trophies yet — ${open} vine-ladder challenges are open, more coming soon.`
        : `Step through the mossy arch by the lagoon — ${open} vine-ladder challenges are waiting, more coming soon.`;
    }
  }

  const panels = [island, playground, farm, snow, magma, jungle];
  const trophies = farm.earned + snow.earned + magma.earned + jungle.earned;
  const golds = farm.counts.gold + snow.counts.gold + magma.counts.gold + jungle.counts.gold;
  return {
    name: (progress.profile && progress.profile.name) || "",
    panels,
    totals: { trophies, golds, trophySlots: farm.total + snow.total + magma.total + jungle.total, keys, badges: island.badgesEarned, level: lvl.level },
  };
}
