import { useUI } from "./effects/uiStore.js";

/**
 * Keyboard hints in button labels — "Next round (Enter)", "Check (Enter)" —
 * mean nothing on a phone or iPad. `kh(label)` drops the "(Enter)" / "(Esc)"
 * part when touch controls are on and leaves it for keyboard players.
 */
export function kh(label) {
  if (typeof label !== "string") return label;
  let touch = false;
  try { touch = useUI.getState().touchMode; } catch { /* headless */ }
  return touch ? label.replace(/\s*\((?:Enter|Esc|Space)\)/g, "") : label;
}

/**
 * Story lines written for a keyboard ("press M", "click a place", "press
 * Enter in front of it") read as touch instructions on a phone / iPad.
 * English only — a translated line keeps its dictionary match.
 */
const TOUCH_SWAPS = [
  [/\(press M any time\)/g, "(or tap 🗺️ any time)"],
  [/\(press M to open (?:it|the map) any time\)/g, "(tap 🗺️ to open it any time)"],
  [/Press M to open the map any time\./g, "Tap 🗺️ (top right) to open the map any time."],
  [/press Enter in front of it/g, "tap Look in front of it"],
  [/press Enter \(or tap a board\)/g, "tap Look (or tap a board)"],
  [/\bclick (a|one|it)\b/g, "tap $1"],
  [/\bclick\b/g, "tap"],
  [/\bClick\b/g, "Tap"],
];
export function touchWords(text) {
  if (typeof text !== "string") return text;
  let touch = false;
  let lang = "en";
  try { const u = useUI.getState(); touch = u.touchMode; lang = u.language; } catch { /* headless */ }
  if (!touch || lang !== "en") return text;
  let out = text;
  for (const [re, rep] of TOUCH_SWAPS) out = out.replace(re, rep);
  return out;
}
