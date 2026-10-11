/**
 * The touch TALK / OPEN button's wording + icon for an interactable (pure, so
 * the headless checks can run every interactable through it).
 *   "Talk to Pip — Fence Challenge" → { verb: "Talk", rest: "Pip — Fence Challenge" }
 */
export function actionIcon(it) {
  if (!it) return "💬";
  if (it.mapBoard) return "🗺️";
  if (it.model === "chest" || /chest/.test(it.id)) return "🎁";
  if (/records|trophy/.test(it.id)) return "🏆";
  if (it.model === "board") return "📋";
  if (it.model === "npc") return "💬";
  return "👆";
}

export function actionText(it) {
  const label = (it && it.promptLabel) || "Interact";
  const m = /^(Talk to|Open|Read|View)\s+(.*)$/i.exec(label);
  if (!m) return { verb: label, rest: "" };
  const verb = m[1].toLowerCase() === "talk to" ? "Talk" : m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
  return { verb, rest: m[2] };
}
