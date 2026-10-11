/**
 * PHONE / iPad CONTROLS + SMALL-SCREEN FRAMING (2026-10-11) — headless checks.
 *
 *   TC1  the shared touch input carries the joystick (moveX / moveY / run)
 *        and the camera drag (yawDelta); the Player publishes touchCaps
 *   TC2  tap vs drag: a world tap only acts when the finger lifts without
 *        moving — never after a drag, a joystick push (claimed), a long
 *        press or a cancel; the nearest object (first to queue) wins
 *   TC3  every interactable gets a sensible TALK / OPEN button (verb + who)
 *   TC4  stage framing: a challenge camera on a phone frames its stage into
 *        the screen area the card leaves free — centred there, narrow areas
 *        keep the verified 4:3 camera position (wider fov), wide areas keep
 *        fov 50, and desktop (tracker inactive) is untouched
 *   TC5  keyboard hints: "(Enter)" drops out of button labels and story
 *        lines say "tap" / "🗺️" instead of "click" / "press M" — on touch
 *        only, English only
 */
import { touchInput, playerState } from "../game/sessionStore.js";
import { queueTap, claimPointer, __gestureTest } from "../game/touchGesture.js";
import { stageViewport, stageFraming, BASE_FOV } from "../game/stageViewport.js";
import { INTERACTABLES } from "../data/interactables.js";
import { actionText, actionIcon } from "../ui/touchActionLabel.js";
import { kh, touchWords } from "../ui/keyHints.js";
import { useUI } from "../ui/effects/uiStore.js";

export function runTouchControlChecks() {
  const checks = [];

  // TC1
  {
    const keys = ["jump", "rotateLeft", "rotateRight", "moveX", "moveY", "run", "yawDelta"];
    const missing = keys.filter((k) => !(k in touchInput));
    const caps = playerState.touchCaps;
    const capsOk = caps && ["walk", "walkAxis", "orbit", "jump"].every((k) => k in caps);
    checks.push({
      name: "TC1 Touch input: joystick + camera drag + caps",
      pass: missing.length === 0 && capsOk,
      detail: missing.length ? `missing ${missing.join(", ")}` : capsOk ? "moveX/moveY/run/yawDelta + touchCaps" : "touchCaps missing",
    });
  }

  // TC2
  {
    const { down, move, up } = __gestureTest;
    const log = [];
    const t0 = 1_000_000;
    // a clean tap
    down(901, 100, 100, t0); queueTap(() => log.push("tap"), 901); up(901, false, t0 + 120);
    // a drag (moved 30 px)
    down(902, 100, 100, t0); queueTap(() => log.push("drag"), 902); move(902, 130, 100); up(902, false, t0 + 200);
    // a tiny wobble is still a tap
    down(903, 100, 100, t0); queueTap(() => log.push("wobble"), 903); move(903, 106, 104); up(903, false, t0 + 150);
    // claimed by the joystick / camera drag
    down(904, 50, 300, t0); queueTap(() => log.push("claimed"), 904); claimPointer(904); up(904, false, t0 + 100);
    // a long press
    down(905, 100, 100, t0); queueTap(() => log.push("long"), 905); up(905, false, t0 + 2000);
    // cancelled (e.g. the OS took the touch)
    down(906, 100, 100, t0); queueTap(() => log.push("cancel"), 906); up(906, true, t0 + 100);
    // nearest first: a character queues before the ground under it
    down(907, 100, 100, t0); queueTap(() => log.push("character"), 907); queueTap(() => log.push("ground"), 907); up(907, false, t0 + 100);
    const want = ["tap", "wobble", "character"];
    const pass = JSON.stringify(log) === JSON.stringify(want);
    checks.push({ name: "TC2 Tap vs drag / joystick / long press", pass, detail: pass ? "only real taps act" : `got ${log.join(",")}` });
  }

  // TC3
  {
    const bad = [];
    for (const it of INTERACTABLES) {
      const a = actionText(it);
      const icon = actionIcon(it);
      if (!a.verb || a.verb.length > 22 || !icon) bad.push(it.id);
      if (it.model === "npc" && a.verb !== "Talk") bad.push(`${it.id}:${a.verb}`);
    }
    checks.push({
      name: "TC3 Touch TALK / OPEN button wording",
      pass: bad.length === 0,
      detail: bad.length ? `odd: ${bad.slice(0, 6).join(", ")}` : `${INTERACTABLES.length} interactables · every character says Talk`,
    });
  }

  // TC4
  {
    const saved = { ...stageViewport };
    const t0 = Math.tan((BASE_FOV * Math.PI) / 360);
    const set = (o) => Object.assign(stageViewport, { active: true }, o);
    const fails = [];
    // Phone upright, card at the bottom: free area = the top 390×340.
    set({ W: 390, H: 664, fw: 390, fh: 340, cx: 195, cy: 170 });
    let f = stageFraming();
    if (!(Math.abs(f.halfW - t0 * (4 / 3)) < 1e-9)) fails.push("portrait halfW ≠ 4:3");
    if (!(f.fov > BASE_FOV + 20)) fails.push("portrait fov not widened");
    if (!(Math.abs(f.offY - (664 / 2 - 170)) < 1e-9 && Math.abs(f.offX) < 1e-9)) fails.push("portrait offset");
    if (!(Math.abs(Math.tan((f.viewFov * Math.PI) / 360) * f.viewAspect - f.halfW) < 1e-9)) fails.push("view fov/aspect ≠ halfW");
    // Phone sideways, card on the right: free area = the left 400×342.
    set({ W: 750, H: 342, fw: 400, fh: 342, cx: 200, cy: 171 });
    f = stageFraming();
    if (!(Math.abs(f.offX - (375 - 200)) < 1e-9)) fails.push("landscape offX");
    if (!(Math.abs(f.halfW - t0 * (4 / 3)) < 1e-9)) fails.push("landscape halfW");
    // iPad sideways, card at the bottom: wide free area → fov stays 50.
    set({ W: 1080, H: 810, fw: 1080, fh: 430, cx: 540, cy: 215 });
    f = stageFraming();
    if (!(Math.abs(f.fov - BASE_FOV) < 1e-9)) fails.push("wide fov changed");
    if (!(Math.abs(f.halfW - (t0 * 1080) / 810) < 1e-9)) fails.push("wide halfW");
    if (!(f.halfV < t0)) fails.push("wide halfV not reduced");
    // Inactive (desktop) → no framing at all.
    stageViewport.active = false;
    if (stageFraming() !== null) fails.push("inactive returns framing");
    Object.assign(stageViewport, saved);
    checks.push({
      name: "TC4 Challenge camera frames into the free screen area",
      pass: fails.length === 0,
      detail: fails.length ? fails.join("; ") : "portrait 93°+ centred · landscape centred left · iPad fov 50 · desktop untouched",
    });
  }

  // TC5
  {
    const ui = useUI.getState();
    const wasTouch = ui.touchMode;
    const wasLang = ui.language;
    const fails = [];
    useUI.setState({ touchMode: false, language: "en" });
    if (kh("Next round (Enter)") !== "Next round (Enter)") fails.push("desktop label changed");
    if (touchWords("click a place (press M any time)") !== "click a place (press M any time)") fails.push("desktop line changed");
    useUI.setState({ touchMode: true });
    if (kh("Next round (Enter)") !== "Next round") fails.push(`touch label: ${kh("Next round (Enter)")}`);
    if (kh("🐉 Raise! (Enter)") !== "🐉 Raise!") fails.push("emoji label");
    const tw = touchWords("open the map, click a place to set a waypoint and follow the arrow (press M any time).");
    if (/click|press M/.test(tw)) fails.push(`touch line: ${tw}`);
    useUI.setState({ language: "fa" });
    if (touchWords("click a place") !== "click a place") fails.push("translated line changed");
    useUI.setState({ touchMode: wasTouch, language: wasLang });
    checks.push({
      name: "TC5 Keyboard hints hidden on touch",
      pass: fails.length === 0,
      detail: fails.length ? fails.join("; ") : "(Enter) dropped · click→tap · press M→🗺️ · desktop + translations untouched",
    });
  }

  return checks;
}
