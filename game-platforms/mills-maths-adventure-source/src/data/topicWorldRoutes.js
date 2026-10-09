/**
 * TOPIC → WORLD ROUTES (Phase 2J).
 *
 * The single, data-driven source of truth for "if a mission covers TOPIC X,
 * where in the world should the student go to play it?". This is what lets a
 * teacher/free-choice mission on any registered topic guide the student to the
 * right zone/NPC — WITHOUT hardcoding that logic into the engine, and without
 * coupling to the curated main story.
 *
 * Each route:
 *   topicId          curriculum topic id (matches the registry)
 *   zoneId           world zone id (data/worldZones.js)
 *   npcId            the NPC/interactable that hosts this topic (interactableId)
 *   guidanceTarget   interactable id the guidance marker should point at
 *   fallbackTarget   where to send the student if the primary target is missing
 *   displayName      human label for the destination
 *   missionStartText short "go here" line for the Quest HUD / dialogue
 *
 * A topic with NO route falls back safely to the Mission Board (or a generic
 * marker) — it NEVER crashes and is NEVER forced onto Pip/Fern/Alby.
 *
 * Pure data + lookups. No React, no stores. Adding a destination for a new topic
 * later is a one-entry change here.
 */

// The universal safe fallback target (a topic with no dedicated destination).
export const GENERIC_FALLBACK = {
  targetId: "mission-board",
  text: "Open the Mission Board to begin",
  fallback: true,
};

export const TOPIC_WORLD_ROUTES = [
  {
    topicId: "integers",
    zoneId: "zone-integers",
    npcId: "pip",
    guidanceTarget: "pip",
    fallbackTarget: "mission-board",
    displayName: "Pip's Number Line",
    missionStartText: "Find Pip at his number line under Frosty Peak",
  },
  {
    topicId: "fdp",
    zoneId: "zone-fdp",
    npcId: "fern",
    guidanceTarget: "fern",
    fallbackTarget: "mission-board",
    displayName: "Fern's Ash Fields",
    missionStartText: "Find Fern in the ash fields below Ember Peak",
  },
  {
    topicId: "algebra",
    zoneId: "zone-algebra",
    npcId: "alby",
    guidanceTarget: "alby",
    fallbackTarget: "mission-board",
    displayName: "Alby's Lighthouse",
    missionStartText: "Find Alby at the lighthouse",
  },
  // (Area Meadow removed in W6-B — "area" and "pythagoras" topics now fall back
  //  safely to the Mission Board, since they have no dedicated on-island zone.)
];

/** The route for a topic, or null if none is registered. */
export function getTopicRoute(topicId) {
  return TOPIC_WORLD_ROUTES.find((r) => r.topicId === topicId) || null;
}

/**
 * Resolve a TOPIC to a guidance target { targetId, text, fallback }. Topics with
 * a route resolve to their guidanceTarget; everything else falls back safely.
 */
export function routeGuidanceTarget(topicId) {
  const r = getTopicRoute(topicId);
  if (r) return { targetId: r.guidanceTarget, text: r.missionStartText, fallback: false, route: r };
  return { ...GENERIC_FALLBACK };
}

/**
 * Resolve a MISSION (teacher/free-choice or otherwise) to a guidance target.
 * Single-topic missions route to that topic's destination; multi-topic or
 * topic-less missions fall back to the Mission Board. Never throws.
 */
export function routeForMission(mission) {
  if (!mission) return { ...GENERIC_FALLBACK };
  const topics = mission.selectedTopics || [];
  if (topics.length === 1) return routeGuidanceTarget(topics[0]);
  return { ...GENERIC_FALLBACK };
}
