/**
 * Playground session helpers — the bridge from an NPC interaction to the
 * challenge veil. Called by `src/game/interaction.js` when the student talks
 * to one of the 16 playground characters (or the boss).
 */
import { usePlayground } from "./playgroundStore.js";
import { PLAYGROUND_BY_NPC, PLAYGROUND_BY_ID, BOSS_EXAM, PLAYGROUND_CHALLENGES, ROUND_SIZE } from "../../../data/schoolyard/challenges/challengeList.js";
import { getBank, dealRound } from "../../../data/schoolyard/challenges/banks/_adapt.js";

// Side-effect import: every ported bank registers itself here.
import "../../../data/schoolyard/challenges/banks/integers.js";
import "../../../data/schoolyard/challenges/banks/fdp.js";
import "../../../data/schoolyard/challenges/banks/algebraic-techniques.js";
import "../../../data/schoolyard/challenges/banks/equations.js";
import "../../../data/schoolyard/challenges/banks/ratios-rates.js";
import "../../../data/schoolyard/challenges/banks/indices.js";
import "../../../data/schoolyard/challenges/banks/linear-relationships.js";
import "../../../data/schoolyard/challenges/banks/length.js";
import "../../../data/schoolyard/challenges/banks/angle-relationships.js";
import "../../../data/schoolyard/challenges/banks/pythagoras.js";
import "../../../data/schoolyard/challenges/banks/area.js";
import "../../../data/schoolyard/challenges/banks/volume.js";
import "../../../data/schoolyard/challenges/banks/geometrical-figures.js";
import "../../../data/schoolyard/challenges/banks/data-visualisation.js";
import "../../../data/schoolyard/challenges/banks/data-analysis.js";
import "../../../data/schoolyard/challenges/banks/probability.js";

/** Is this NPC a playground challenger (not the boss)? */
export function isPlaygroundNpc(npcId) {
  return Boolean(PLAYGROUND_BY_NPC[npcId]);
}

/** Open a challenge for an NPC. Returns true if we handled it. */
export function openPlaygroundForNpc(npc) {
  const def = PLAYGROUND_BY_NPC[npc.id];
  if (!def) return false;
  if (!def.bankId || !getBank(def.bankId)) {
    // Not ported yet — leave a friendly placeholder dialogue rather than crashing.
    return "coming-soon";
  }
  usePlayground.getState().open({
    id: def.id,
    npcId: def.npcId || npc.id,
    bankId: def.bankId,
    name: npc.name,
    color: def.color || npc.color,
    outcome: def.outcome,
    title: def.title,
    host: def.host,
    areaId: def.strand,
    flavor: npc.flavor,
    roundSize: ROUND_SIZE,
  });
  return true;
}

/** Open the Head Teacher's Exam (60 Q mixed). */
export function openBossExam(npc, { completedMissions = [] } = {}) {
  // Need every key.
  const keys = PLAYGROUND_CHALLENGES.filter((c) => completedMissions.includes(`warmup-${c.npcId}`)).length;
  if (keys < PLAYGROUND_CHALLENGES.length) return { locked: true, keys, need: PLAYGROUND_CHALLENGES.length };
  // Deal 4 from each outcome, 2 from each of the two Data outcomes. Banks that
  // aren't ported yet are skipped — the exam shortens accordingly until every
  // bank exists.
  const pool = [];
  for (const slice of BOSS_EXAM.mix) {
    if (!slice.bankId || !getBank(slice.bankId)) continue;
    const title = PLAYGROUND_BY_ID[slice.challengeId]?.title || slice.bankId;
    pool.push(...dealRound(slice.bankId, slice.count).map((q) => ({ ...q, _label: title })));
  }
  if (!pool.length) return { locked: false, empty: true };
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  usePlayground.getState().open({
    id: BOSS_EXAM.id,
    npcId: npc.id || BOSS_EXAM.npcId,
    bankId: null,
    name: npc.name,
    color: BOSS_EXAM.color,
    outcome: BOSS_EXAM.outcome,
    title: BOSS_EXAM.title,
    host: BOSS_EXAM.host,
    areaId: "boss",
    flavor: npc.flavor,
    roundSize: pool.length,
    questions: pool,
  });
  return { ok: true };
}

/**
 * When a challenge ends with bronze+ we mark its warm-up mission complete so
 * the existing key/hall/trophy logic picks it up. Called by the veil's result
 * screen (wired below in src/App.jsx).
 */
export function medalEarnedMission(challengeId) {
  return `warmup-${PLAYGROUND_BY_ID[challengeId]?.npcId || challengeId}`;
}
