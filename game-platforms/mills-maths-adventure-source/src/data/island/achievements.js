/**
 * ACHIEVEMENTS WALL — the data behind the six boards on Number Island's
 * Achievements Wall (one per world). Pure: it takes the saved progress + the
 * results list (and reads each world's local trophy bests through that
 * world's own records module), and returns plain objects the 3D wall paints
 * onto its boards and the viewer reads aloud.
 *
 *   island      Level + XP, coins, the three island friends' warm-ups
 *               (Pip / Fern / Alby — passing all three opens the igloo
 *               gate, the journey's first step), the badge collection.
 *   playground  The Retrieval Practice Playground: the eight staff keys +
 *               the Head Teacher's trophy.
 *   farm        Fraction Farm's ten trophies.
 *   snow        Snowball Sums' ten trophies.
 *   magma       Magma Multiples' ten trophies.
 *   jungle      Emerald Jungle's ten trophies (the vine-ladder challenges;
 *               the ones still being built say "coming soon").
 *
 * THE JOURNEY (2026-10-13): the boards now read left → right in the order
 * the worlds open (island, snow, magma, farm, jungle, Playground), and a
 * world that isn't open yet carries `locked` + `lockText` (its board shows
 * a padlock and what opens it).
 */
import { deriveLevel, XP_PER_LEVEL } from "../../progress/store.js";
import { getAllBadges } from "../badges.js";
import { SCHOOLYARD_CHARACTERS } from "../schoolyard/schoolyardLayout.js";
import { farmTrophyRows, MEDALS } from "../farm/farmRecords.js";
import { snowTrophyRows } from "../snow/snowRecords.js";
import { magmaTrophyRows } from "../magma/magmaRecords.js";
import { jungleTrophyRows } from "../jungle/jungleRecords.js";
import { PASS_THRESHOLD } from "../../missions/scoring.js";
import {
  JOURNEY_FRIENDS, JOURNEY_WORLDS, friendDone, journeyState, journeySnapshot, journeyCounts, portalLock,
} from "../journey.js";

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

// The island friends = the journey's three warm-ups (data/journey.js).
export const ISLAND_FRIENDS = JOURNEY_FRIENDS.map((f) => ({ id: f.id, name: f.name, icon: f.icon, topic: f.topic }));
/** A warm-up passes at the missions' pass mark (60%). */
export const WARMUP_PASS_MARK = Math.round(PASS_THRESHOLD * 100);

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

  // The journey: which worlds are open (and what opens the rest).
  const visitedMap = Object.fromEntries(JOURNEY_WORLDS.map((w) => [w.regionId, hasVisited(w.regionId)]));
  const js = journeyState(journeySnapshot(progress, journeyCounts(), visitedMap));
  const lockOf = (key) => {
    const w = JOURNEY_WORLDS.find((x) => x.key === key);
    const lock = w ? portalLock(js, w.portalId) : null;
    return lock ? { locked: true, lockText: lock.text, lockNote: lock.note } : { locked: false };
  };

  // --- Number Island ---------------------------------------------------------
  // Each friend's warm-up: passed (the mission's pass mark) + the best try.
  const friends = ISLAND_FRIENDS.map((f) => {
    const mine = (results || []).filter((r) => r && r.missionId === `warmup-${f.id}`);
    const best = mine.reduce((m, r) => Math.max(m, Math.round(r.percentage || 0)), 0);
    const passed = friendDone(f.id, done);
    return { ...f, best: passed ? Math.max(best, WARMUP_PASS_MARK) : best, attempts: mine.length, passed };
  });
  const passedFriends = friends.filter((f) => f.passed).length;
  const badges = getAllBadges().map((b) => ({ id: b.badgeId, icon: b.icon, name: b.badgeName, earned: earnedIds.has(b.badgeId) }));
  const island = {
    id: "island", title: "Number Island", icon: "🌴", color: "#1f7fc4", deep: "#134f7d", light: "#e3f3ff", kind: "island",
    level: lvl.level, xpInto: lvl.xpIntoLevel, xpFor: XP_PER_LEVEL, xp, coins: progress.coins || 0,
    friends, passedFriends, allPassed: passedFriends === friends.length, badges, badgesEarned: badges.filter((b) => b.earned).length,
    passMark: WARMUP_PASS_MARK,
    headline: `Level ${lvl.level}`,
    summary: `Level ${lvl.level} with ${progress.coins || 0} coins. ${passedFriends} of 3 island warm-ups passed${passedFriends === 3 ? " — the igloo gate is open" : " — pass all three to open the igloo gate"}. ${badges.filter((b) => b.earned).length} of ${badges.length} badges.`,
  };

  // --- Retrieval Practice Playground ------------------------------------------
  const staff = SCHOOLYARD_CHARACTERS.filter((c) => !c.boss).map((c) => ({ id: c.id, name: c.name, color: c.color, done: done.has(`warmup-${c.id}`) }));
  const boss = SCHOOLYARD_CHARACTERS.find((c) => c.boss);
  const bossDone = boss ? done.has(`warmup-${boss.id}`) : false;
  const keys = staff.filter((s) => s.done).length;
  const playground = {
    ...lockOf("playground"),
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
  const farm = { ...trophyPanel("farm", "Fraction Farm", "🌾", { color: "#e2a018", deep: "#8a5a08", light: "#fff6dc" }, farmTrophyRows(), "farm-parts-whole"), ...lockOf("farm") };
  const snow = { ...trophyPanel("snow", "Snowball Sums", "❄️", { color: "#2f95d0", deep: "#17577e", light: "#e8f6ff" }, snowTrophyRows(), "snow-sums"), ...lockOf("snow") };
  const magma = { ...trophyPanel("magma", "Magma Multiples", "🌋", { color: "#d9442a", deep: "#7f1f10", light: "#ffece6" }, magmaTrophyRows(), "magma-multiples"), ...lockOf("magma") };

  // --- Emerald Jungle: the ten vine-ladder challenges -----------------------
  const jungle = { ...trophyPanel("jungle", "Emerald Jungle", "🌿", { color: "#1f9a4c", deep: "#0f5a2b", light: "#e6f8ec" }, jungleTrophyRows(), "emerald-jungle"), ...lockOf("jungle") };
  {
    const open = jungle.rows.filter((r) => !r.soon).length;
    if (!jungle.earned) {
      jungle.summary = jungle.visited
        ? `No trophies yet — ${open} vine-ladder challenges are open${open < jungle.rows.length ? ", more coming soon" : ""}.`
        : `Step through the mossy arch by the lagoon — ${open} vine-ladder challenges are waiting${open < jungle.rows.length ? ", more coming soon" : ""}.`;
    }
  }

  // A locked world says what opens it (its board shows a padlock).
  for (const P of [snow, magma, farm, jungle, playground]) {
    if (P.locked) P.summary = `Locked — ${P.lockText.replace(/ \(\d+\/\d+\)$/, "")}. ${P.lockNote}.`;
  }

  // The journey's order: the boards read left → right as the worlds open.
  const panels = [island, snow, magma, farm, jungle, playground];
  const trophies = farm.earned + snow.earned + magma.earned + jungle.earned;
  const golds = farm.counts.gold + snow.counts.gold + magma.counts.gold + jungle.counts.gold;
  return {
    name: (progress.profile && progress.profile.name) || "",
    panels,
    totals: { trophies, golds, trophySlots: farm.total + snow.total + magma.total + jungle.total, keys, badges: island.badgesEarned, level: lvl.level, worldsOpen: js.worlds.filter((w) => w.open).length },
  };
}
