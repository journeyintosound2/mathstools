/**
 * TOUCH GESTURES (2026-10-11, phone / iPad pass).
 *
 * One finger on the 3D view can mean three different things:
 *   • a TAP          → walk there / talk to the character you tapped
 *   • a JOYSTICK push (left thumb)  → walk / run
 *   • a CAMERA DRAG  (anywhere else) → look around
 *
 * The world's tap handlers (the terrain meshes, the invisible ground catcher,
 * every character) run on POINTER-DOWN, before anyone knows which of those it
 * will be. So instead of acting straight away they QUEUE their action here
 * (`queueTap`), and it only runs when that same finger lifts without having
 * moved — a drag or a joystick push that started on the ground never sends
 * the player wandering off.
 *
 * Non-reactive on purpose (read from pointer handlers + the frame loop).
 */

const TAP_SLOP = 12; // px a finger may wander and still count as a tap
const TAP_MAX_MS = 700; // a longer press isn't a tap

const pointers = new Map(); // pointerId → { x, y, t, moved, claimed, tap }
let lastDownId = null;
let installed = false;

// The gesture bookkeeping (pure — the window listeners below just feed it;
// the system checks drive it directly).
function down(id, x, y, t = Date.now()) {
  pointers.set(id, { x, y, t, moved: false, claimed: false, tap: null });
  lastDownId = id;
}
function move(id, x, y) {
  const p = pointers.get(id);
  if (!p || p.moved) return;
  if (Math.hypot(x - p.x, y - p.y) > TAP_SLOP) { p.moved = true; p.tap = null; }
}
function up(id, cancelled = false, t = Date.now()) {
  const p = pointers.get(id);
  pointers.delete(id);
  if (!p || !p.tap || cancelled) return;
  if (!p.moved && !p.claimed && t - p.t <= TAP_MAX_MS) {
    const fn = p.tap;
    p.tap = null;
    try { fn(); } catch (err) { console.error(err); }
  }
}

function install() {
  if (installed || typeof window === "undefined" || !window.addEventListener) return;
  installed = true;
  // Capture phase: we see the finger before R3F / any element handles it.
  window.addEventListener("pointerdown", (e) => down(e.pointerId, e.clientX, e.clientY), { capture: true, passive: true });
  window.addEventListener("pointermove", (e) => move(e.pointerId, e.clientX, e.clientY), { capture: true, passive: true });
  window.addEventListener("pointerup", (e) => up(e.pointerId, false), { capture: true, passive: true });
  window.addEventListener("pointercancel", (e) => up(e.pointerId, true), { capture: true, passive: true });
}
install();

/** For the headless checks only: drive the bookkeeping without a browser. */
export const __gestureTest = { down, move, up };

/**
 * Run `fn` when the finger that is going down right now lifts as a TAP.
 * Called from R3F onPointerDown handlers. A second queue for the same finger
 * keeps the first one (R3F calls the nearest object first, as with stopPropagation).
 * Mouse clicks (desktop with touch controls switched on) behave the same.
 */
export function queueTap(fn, pointerId) {
  install();
  const id = pointerId ?? lastDownId;
  const p = pointers.get(id);
  if (!p) { fn(); return; } // no tracked press (synthetic event) — just do it
  if (!p.tap) p.tap = fn;
}

/** A joystick / camera drag has taken this finger: it can't be a tap any more. */
export function claimPointer(pointerId) {
  const p = pointers.get(pointerId);
  if (p) { p.claimed = true; p.tap = null; }
}

/** Has this finger moved past the tap slop? */
export function pointerMoved(pointerId) {
  const p = pointers.get(pointerId);
  return Boolean(p && p.moved);
}

export const TOUCH_TAP_SLOP = TAP_SLOP;
