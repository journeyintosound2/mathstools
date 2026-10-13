/**
 * REGION MAPS (2026-10-10) — the data behind every world's map: the painted
 * board by each spawn, the full-screen map viewer and the waypoints you set
 * on it. PURE (no DOM / THREE), so the headless checks can read it.
 *
 *   regionMapSpec(id)       title, palette, the world area the map shows,
 *                           where its board stands, the area labels
 *   regionMapPois(id, ctx)  the clickable places: every challenge (in trophy
 *                           order, with its medal), the gates, the trophy
 *                           stand, Mills, the island friends / school staff,
 *                           and a few landmarks. `target` = where a waypoint
 *                           to that place leads (the host you talk to).
 *   worldToMap / mapToWorld the 0..1 map frame (north is UP: −z)
 *
 * Map frame: u = (x − x0) / (x1 − x0), v = (z − z0) / (z1 − z0).
 */
import { REGIONS } from "../regions.js";
import { INTERACTABLES } from "../interactables.js";
import { achievementsSummary } from "../island/achievements.js";
import { portalLock } from "../journey.js";
import {
  ISLAND_SPAWN, ISLAND_AREAS, ISLAND_MAP_BOARD, GATES as ISLAND_GATES, ACHIEVEMENT_WALL, PLAZA, FROSTY_PEAK, EMBER_PEAK, LIGHTHOUSE,
} from "../island/islandLayout.js";
import { FARM_SPAWN, FARM_AREAS, FARM_MAP_BOARD, FARM_RECORDS_STAND } from "../farm/farmLayout.js";
import { farmTrophyRows } from "../farm/farmRecords.js";
import { SNOW_SPAWN, SNOW_MAP_BOARD, SNOW_RECORDS_STAND, SNOW_CHALLENGE_SPOTS, SNOW_LODGE, GIANT_SNOWMAN, SNOW_LAKE } from "../snow/snowLayout.js";
import { snowTrophyRows } from "../snow/snowRecords.js";
import { MAGMA_SPAWN, MAGMA_CHALLENGE_SPOTS, MAGMA_MAP_BOARD, LAVA_LAKE } from "../magma/magmaLayout.js";
import { MAGMA_RECORDS_STAND } from "../magma/magmaChallenges.js";
import { magmaTrophyRows } from "../magma/magmaRecords.js";
import { JUNGLE_SPAWN, JUNGLE_SPOTS, JUNGLE_MAP_BOARD, JUNGLE_LANDMARKS, GREAT_TREE, ARRIVAL_GLADE } from "../jungle/jungleLayout.js";
import { JUNGLE_CHALLENGES, JUNGLE_RECORDS_STAND } from "../jungle/jungleChallenges.js";
import { jungleTrophyRows } from "../jungle/jungleRecords.js";
import { SCHOOLYARD_SPAWN, SCHOOL_AREAS, SCHOOL_MAP_BOARD, SCHOOLYARD_CHARACTERS } from "../schoolyard/schoolyardLayout.js";

/** The worlds that have a map (the Lodge is one room — no map needed). */
export const MAP_REGION_IDS = ["island-1", "farm-parts-whole", "snow-sums", "magma-multiples", "emerald-jungle", "schoolyard"];

const SPECS = {
  "island-1": {
    title: "Number Island", icon: "🏝️", subtitle: "The hub — every world's gate is here",
    accent: "#1f7fc4", deep: "#134f7d", paper: "#f6ecd2",
    bounds: { x0: -112, x1: 136, z0: -110, z1: 124 },
    spawn: [ISLAND_SPAWN.x, ISLAND_SPAWN.z],
    board: ISLAND_MAP_BOARD,
    areas: ISLAND_AREAS.map((a) => ({ name: a.name, icon: a.icon, at: a.c })),
  },
  "farm-parts-whole": {
    title: "Fraction Farm", icon: "🌾", subtitle: "Ten fraction challenges across the farm",
    accent: "#c98a12", deep: "#7a5208", paper: "#f7edd4",
    bounds: { x0: -150, x1: 150, z0: -134, z1: 134 },
    spawn: [FARM_SPAWN.x, FARM_SPAWN.z],
    board: FARM_MAP_BOARD,
    areas: FARM_AREAS.filter((a) => !a.challenge).map((a) => ({ name: a.name, icon: a.icon, at: a.c })),
  },
  "snow-sums": {
    title: "Snowball Sums", icon: "❄️", subtitle: "Ten addition strategies in the alpine valley",
    accent: "#2f6fb5", deep: "#1b4677", paper: "#eef3f8",
    bounds: { x0: -150, x1: 150, z0: -134, z1: 134 },
    spawn: [SNOW_SPAWN.x, SNOW_SPAWN.z],
    board: SNOW_MAP_BOARD,
    areas: [
      { name: "Lodge Village", icon: "🏠", at: [SNOW_LODGE.x - 4, SNOW_LODGE.z - 8] },
      { name: "Snowman Hill", icon: "⛄", at: [GIANT_SNOWMAN.position[0], GIANT_SNOWMAN.position[1] - 8] },
      { name: "Big Sled Hill", icon: "🛷", at: [120, -32] },
      { name: "Glacier Lake", icon: "🧊", at: [SNOW_LAKE.center[0] + 20, SNOW_LAKE.center[1] + 16] },
      { name: "Frozen River", icon: "🏞️", at: [-46, -48] },
    ],
  },
  "magma-multiples": {
    title: "Magma Multiples", icon: "🌋", subtitle: "Ten multiplicative challenges round the volcano",
    accent: "#d9442a", deep: "#7f1f10", paper: "#f3e3d2",
    bounds: { x0: -118, x1: 122, z0: -118, z1: 118 },
    spawn: [MAGMA_SPAWN.x, MAGMA_SPAWN.z],
    board: MAGMA_MAP_BOARD,
    areas: [
      { name: "The Volcano", icon: "🌋", at: [0, -14] },
      { name: "Lava Lake", icon: "🔥", at: [LAVA_LAKE.center[0] + 2, LAVA_LAKE.center[1] - 20] },
      { name: "Arrival Plaza", icon: "🏛️", at: [0, 104] },
    ],
  },
  "emerald-jungle": {
    title: "Emerald Jungle", icon: "🌿", subtitle: "Vine-ladder challenges in the jungle valley",
    accent: "#1f9a4c", deep: "#0f5a2b", paper: "#eef2dc",
    bounds: { x0: -118, x1: 112, z0: -156, z1: 160 },
    spawn: [JUNGLE_SPAWN.x, JUNGLE_SPAWN.z],
    board: JUNGLE_MAP_BOARD,
    areas: [
      ...Object.values(JUNGLE_LANDMARKS).map((l) => ({ name: l.label, icon: "🧭", at: l.center })),
      { name: "Arrival Glade", icon: "🌿", at: [ARRIVAL_GLADE.center[0], ARRIVAL_GLADE.center[1] + 14] },
    ].filter((a) => a.name !== "Treehouse"),
  },
  schoolyard: {
    title: "Retrieval Practice Playground", icon: "🏫", subtitle: "Find the nine staff — each holds a key",
    accent: "#d9822b", deep: "#8a4a12", paper: "#f5ead8",
    bounds: { x0: -148, x1: 148, z0: -138, z1: 133 },
    spawn: [SCHOOLYARD_SPAWN.x, SCHOOLYARD_SPAWN.z],
    board: SCHOOL_MAP_BOARD,
    areas: SCHOOL_AREAS.map((a) => ({ name: a.name.replace(" (top floor)", ""), icon: a.icon, at: a.c })),
  },
};

export function hasRegionMap(regionId) {
  return Boolean(SPECS[regionId]);
}

export function regionMapSpec(regionId) {
  const s = SPECS[regionId];
  if (!s) return null;
  const { x0, x1, z0, z1 } = s.bounds;
  return { id: regionId, ...s, width: x1 - x0, depth: z1 - z0, aspect: (x1 - x0) / (z1 - z0) };
}

/** World (x, z) → map [u, v] in 0..1 (north up). */
export function worldToMap(spec, x, z) {
  const { x0, x1, z0, z1 } = spec.bounds;
  return [(x - x0) / (x1 - x0), (z - z0) / (z1 - z0)];
}
/** Map [u, v] → world (x, z). */
export function mapToWorld(spec, u, v) {
  const { x0, x1, z0, z1 } = spec.bounds;
  return [x0 + u * (x1 - x0), z0 + v * (z1 - z0)];
}

const ix = (id) => INTERACTABLES.find((i) => i.id === id) || null;
const posOf = (id) => {
  const i = ix(id);
  return i ? [i.position[0], i.position[1]] : null;
};

/**
 * The world's gates (from its portals): where they are + where they lead.
 * On Number Island a gate the journey hasn't opened yet shows 🔒 and what
 * opens it (ctx.journey = the journey state, 2026-10-13).
 */
function gatePois(regionId, ctx = {}) {
  const r = REGIONS[regionId];
  return (r?.portals || []).map((p) => {
    const dest = REGIONS[p.target];
    const lock = regionId === "island-1" && ctx.journey ? portalLock(ctx.journey, p.id) : null;
    return {
      id: `gate-${p.id}`, kind: "gate", icon: lock ? "🔒" : "🌀", name: p.target === "cabin" ? "The Lodge (go inside)" : `Gate to ${p.label}`,
      sub: lock ? `Locked — ${lock.note}` : dest ? (p.target === "island-1" ? "Back to the hub" : dest.name) : "", at: [p.position[0], p.position[1]],
      target: [p.position[0], p.position[1]], arrive: 3.2, locked: Boolean(lock),
    };
  });
}

function medalOf(row) {
  if (!row) return null;
  if (row.soon) return "soon";
  return row.medal ? (typeof row.medal === "string" ? row.medal : row.medal.id) : null;
}

/** The challenges of a trophy world as numbered pins (trophy order). */
function challengePois(rows, hostIdOf, extra = () => ({})) {
  return rows.map((row, i) => {
    const hostId = hostIdOf(row.key);
    const at = hostId ? posOf(hostId) : null;
    const host = hostId ? ix(hostId) : null;
    return {
      id: `ch-${row.key}`, kind: "challenge", n: i + 1, icon: row.icon, name: row.name,
      sub: host ? `Talk to ${host.name}` : "", at, target: at, medal: medalOf(row), best: row.best || 0, pct: row.pct || 0,
      ...extra(row, at),
    };
  }).filter((p) => p.at);
}

const person = (id, kind, icon, name, sub) => {
  const at = posOf(id);
  return at ? { id: `p-${id}`, kind, icon, name, sub, at, target: at } : null;
};

/**
 * Every clickable place on a world's map. ctx = { progress, results } (the
 * progress + results stores' state) for the island friends and school keys.
 */
export function regionMapPois(regionId, ctx = {}) {
  const out = [];
  const add = (p) => { if (p && p.at) out.push(p); };
  if (regionId === "farm-parts-whole") {
    out.push(...challengePois(farmTrophyRows(), (k) => `farm-${k}-sign`, (row) => {
      const area = FARM_AREAS.find((a) => a.challenge === row.key);
      return area ? { place: `${area.icon} ${area.name}` } : {};
    }));
    add(person("farm-welcome-sign", "guide", "👋", "Mills", "Your guide"));
    add({ id: "trophies", kind: "trophies", icon: "🏆", name: "Farm Trophies", sub: "Your medals", at: FARM_RECORDS_STAND.position, target: FARM_RECORDS_STAND.position });
  } else if (regionId === "snow-sums") {
    out.push(...challengePois(snowTrophyRows(), (k) => `snow-${k === "lodgeyard" ? "yard" : k}-sign`, (row) => {
      const spot = SNOW_CHALLENGE_SPOTS.find((s) => s.id === row.key);
      return spot ? { place: spot.label } : {};
    }));
    add(person("snow-welcome-sign", "guide", "👋", "Mills", "Your guide"));
    add({ id: "trophies", kind: "trophies", icon: "🏆", name: "Snow Trophies", sub: "Your medals", at: SNOW_RECORDS_STAND.position, target: SNOW_RECORDS_STAND.position });
  } else if (regionId === "magma-multiples") {
    out.push(...challengePois(magmaTrophyRows(), (k) => `magma-${k}-host`, (row) => {
      const c = MAGMA_CHALLENGE_SPOTS.find((s) => s.id === row.key);
      return c ? { place: c.label } : {};
    }));
    add(person("magma-welcome-host", "guide", "👋", "Mills", "Your guide"));
    add({ id: "trophies", kind: "trophies", icon: "🏆", name: "Magma Trophies", sub: "Your medals", at: MAGMA_RECORDS_STAND.position, target: MAGMA_RECORDS_STAND.position });
  } else if (regionId === "emerald-jungle") {
    const rows = jungleTrophyRows();
    rows.forEach((row, i) => {
      const c = JUNGLE_CHALLENGES.find((q) => q.key === row.key);
      const spot = JUNGLE_SPOTS.find((s) => s.id === c.spot);
      const host = row.soon ? null : ix(`jungle-${row.key}-host`);
      const at = host ? [host.position[0], host.position[1]] : spot.center;
      out.push({
        id: `ch-${row.key}`, kind: "challenge", n: i + 1, icon: row.icon, name: row.name,
        sub: row.soon ? "Coming soon" : `Talk to ${host.name}`, place: spot.label,
        at, target: at, medal: medalOf(row), best: row.best || 0, pct: row.pct || 0, soon: Boolean(row.soon),
      });
    });
    add(person("jungle-welcome-host", "guide", "👋", "Mills", "Your guide"));
    add({ id: "trophies", kind: "trophies", icon: "🏆", name: "Jungle Trophies", sub: "Your medals", at: JUNGLE_RECORDS_STAND.position, target: JUNGLE_RECORDS_STAND.position });
    add({ id: "greattree", kind: "place", icon: "🌳", name: "The Great Tree", sub: "Climb to the treehouse", at: GREAT_TREE.center, target: [GREAT_TREE.center[0], GREAT_TREE.center[1] + 9] });
  } else if (regionId === "island-1") {
    const sum = achievementsSummary(ctx.progress || {}, ctx.results || []);
    const island = sum.panels.find((p) => p.id === "island");
    const friend = (id, f) => {
      const at = posOf(id);
      if (!at || !f) return null;
      return {
        id: `p-${id}`, kind: "friend", icon: f.icon, name: ix(id).name, sub: `${f.topic} warm-up${f.passed ? " · passed ✓" : ""}`,
        at, target: at, medal: f.passed ? "pass" : null, pct: f.best,
      };
    };
    for (const f of island.friends) add(friend(f.id, f));
    add(person("sage", "guide", "👋", "Mills", "Your guide"));
    add({ id: "plaza", kind: "place", icon: "🏛️", name: "Mission Plaza", sub: "Mission Board + the Number Fountain", at: PLAZA.center, target: [PLAZA.center[0], PLAZA.center[1] + 14] });
    add({ id: "wall", kind: "trophies", icon: "🏆", name: "Achievements Wall", sub: "Every world's progress", at: ACHIEVEMENT_WALL.position, target: [ACHIEVEMENT_WALL.position[0], ACHIEVEMENT_WALL.position[1] + 5] });
    add({ id: "frosty", kind: "place", icon: "🏔️", name: "Frosty Peak", sub: "Climb to the summit", at: FROSTY_PEAK.summit, target: FROSTY_PEAK.summit });
    add({ id: "ember", kind: "place", icon: "🌋", name: "Ember Peak", sub: "The island volcano", at: EMBER_PEAK.c, target: [EMBER_PEAK.c[0] - 16, EMBER_PEAK.c[1] + 26] });
    add({ id: "lighthouse", kind: "place", icon: "🗼", name: "The Lighthouse", sub: "Over the rope bridge", at: LIGHTHOUSE.position, target: [LIGHTHOUSE.position[0] - 5, LIGHTHOUSE.position[1] + 5] });
  } else if (regionId === "schoolyard") {
    const sum = achievementsSummary(ctx.progress || {}, ctx.results || []);
    const pg = sum.panels.find((p) => p.id === "playground");
    SCHOOLYARD_CHARACTERS.forEach((c) => {
      const done = c.boss ? pg.boss?.done : pg.staff.find((s) => s.id === c.id)?.done;
      const area = SCHOOL_AREAS.find((a) => a.id === c.area);
      add({
        id: `p-${c.id}`, kind: c.boss ? "boss" : "friend", icon: c.boss ? "⭐" : "🔑", name: c.name,
        sub: c.boss ? `The Head Teacher · the hall (${pg.keys}/${pg.totalKeys} keys)` : `${area ? area.name.replace(" (top floor)", " — top floor") : ""}`,
        at: c.position, target: c.position, medal: done ? "pass" : null,
      });
    });
    add(person("schoolyard-sign", "guide", "👋", "Mills", "Your guide"));
  }
  out.push(...gatePois(regionId, ctx));
  return out;
}

/** Can a free waypoint go here? (solid, safe ground in the world.) */
export function mapSpotIsWalkable(regionId, x, z) {
  const r = REGIONS[regionId];
  if (!r) return false;
  const safe = typeof r.isSafe === "function" ? r.isSafe(x, z) : true;
  return Boolean(safe);
}
