import { getEncounter } from "../data/encounters.js";
import { stationOpen, medalFor, readTablesBest } from "../data/temple/templeTables.js";
import { isAdminMode } from "../data/adminMode.js";

/**
 * Decide which floating status badge an interactable should show, based on the
 * type of encounter it triggers and whether it has been completed.
 *
 * Returns: { icon, tone, label }
 *   icon   short text/emoji shown in the badge
 *   tone   drives the badge colour + whether it pulses (see CSS .tone-*)
 *   label  small caption under the name (optional)
 *
 * Pure and data-driven: add a new encounter type here (and a matching .tone-*
 * style) and every interactable using it picks up the indicator automatically.
 */
export function getInteractableStatus(data, completed) {
  const encounter = getEncounter(data.encounterId);
  const type = encounter?.type;
  // World map boards (2026-10-10) — a map, not a person.
  if (data.mapBoard) return { icon: "🗺️", tone: "reward", label: "Open the map" };
  // Every treasure chest (island, farm, snow, school): shut = treasure, open = opened.
  if (data.model === "chest") {
    return completed
      ? { icon: "🪙", tone: "claimed", label: "Opened" }
      : { icon: "✨", tone: "reward", label: "Treasure!" };
  }
  // The island friends' warm-ups (the journey, 2026-10-13).
  if (data.id === "pip" || data.id === "fern" || data.id === "alby") {
    return completed
      ? { icon: "✓", tone: "done", label: "Warm-up passed" }
      : { icon: "?", tone: "available", label: "Warm-up" };
  }

  // The Timestable Temple (2026-11-08): each stone shows its lock / medal.
  const stone = /^temple-stone-([a-z0-9]+)$/.exec(data.id || "");
  if (stone) {
    const key = stone[1];
    if (!stationOpen(key, undefined, isAdminMode())) return { icon: "🔒", tone: "locked", label: "Locked" };
    const best = readTablesBest(key);
    const m = medalFor(key, best);
    if (m) return { icon: { bronze: "🥉", silver: "🥈", gold: "🥇" }[m.id], tone: "done", label: `Best: ${best}` };
    return { icon: "⏱", tone: "available", label: best ? `Best: ${best}` : "Times-table station" };
  }
  if (data.id === "temple-wall") return { icon: "🔢", tone: "reward", label: "Your square" };
  if (data.id === "temple-dash") return { icon: "🐫", tone: "info", label: "Next station" };

  switch (type) {
    case "mathsChallenge":
      return completed
        ? { icon: "✓", tone: "done", label: "Completed" }
        : { icon: "?", tone: "available", label: "Maths challenge" };

    case "dialogue":
      return { icon: "💬", tone: "info", label: "Talk to me" };

    case "missionBoard":
      return { icon: "📋", tone: "reward", label: "Missions" };

    case "trophyBoard":
      return { icon: "🏆", tone: "reward", label: "Trophies" };

    case "treasure":
      return completed
        ? { icon: "🪙", tone: "claimed", label: "Opened" }
        : { icon: "✨", tone: "reward", label: "Treasure!" };

    case "gate":
      return { icon: "🔒", tone: "locked", label: "Locked" };

    case "battlePlaceholder":
      return { icon: "⚔", tone: "available", label: "Battle" };

    case "bossPlaceholder":
      return { icon: "♛", tone: "available", label: "Boss" };

    default:
      return { icon: "!", tone: "available", label: "" };
  }
}
