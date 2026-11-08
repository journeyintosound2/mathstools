import { useProgress } from "../progress/store.js";
import { useCloud } from "./cloudSession.js";

/**
 * THE EXPLORER BELONGS TO THE STUDENT (2026-11-09, Jeff: "when I change my
 * login it keeps the old person"). Called when the character card's Start /
 * Done is pressed, AFTER any sign-in it did:
 *   • a DIFFERENT student's code was entered → their own name + character
 *     (just loaded from their save / the cloud) are kept, unless this student
 *     actually typed a new name or turned the turntable here — the card's
 *     fields were still showing the previous student's
 *   • signed in as this code → the explorer is stamped as theirs (owner +
 *     when) so it travels with them to any device
 */
export function confirmExplorer({ name, character, code, prevCode = "", touchedName = false, touchedChar = false }) {
  const P = useProgress.getState();
  const prof = P.profile || {};
  const cloud = useCloud.getState();
  const up = (x) => String(x || "").trim().toUpperCase();
  const signed = cloud.isRegistered() ? cloud.student.studentCode : "";
  const mine = Boolean(code) && up(signed) === up(code);
  const switched = Boolean(code) && up(prevCode) !== up(code) && Boolean(prevCode || prof.owner);
  let useName = String(name || "").trim();
  let useChar = character || prof.character || "explorer";
  if (switched) {
    if (!touchedName) useName = mine ? prof.name : "";
    if (!touchedChar) useChar = mine ? prof.character : "explorer";
  }
  useName = (useName || prof.name || "Explorer").slice(0, 24);
  if (switched && !mine && !touchedName) useName = "Explorer";
  const changed = useName !== prof.name || useChar !== prof.character;
  const stamp = mine ? {
    owner: signed,
    explorerAt: changed || !prof.explorerAt || prof.explorerAt <= 1 || prof.owner !== signed ? Date.now() : prof.explorerAt,
  } : {};
  P.setProfile({ ...prof, name: useName, character: useChar, studentCode: code, created: true, ...stamp });
}
