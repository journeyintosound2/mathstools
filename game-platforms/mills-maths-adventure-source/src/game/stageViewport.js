/**
 * STAGE VIEWPORT (2026-10-11, phone / iPad pass).
 *
 * Every challenge films its 3D stage from a locked camera that was framed for
 * a 16:9 / 4:3 computer screen with the question card docked out of the way.
 * On a phone the card covers half the screen (or sits down the right-hand
 * side in landscape) and the screen itself may be tall and thin — the stage
 * ended up tiny, off-centre or under the card.
 *
 * So on touch devices + small windows the challenge camera frames the stage
 * into the part of the screen the card leaves FREE:
 *   • this tracker measures the docked card (and the HUD row above it) a few
 *     times a second and keeps the largest free rectangle;
 *   • Player.jsx turns that into an off-axis projection (camera.setViewOffset)
 *     so the stage's centre sits in the middle of the free area, and fits the
 *     stage to the free area's size. When the free area is narrower than a
 *     4:3 screen the camera keeps its verified 4:3 POSITION (nothing new can
 *     stand in its sight line) and widens its field of view instead.
 *
 * Desktop (no touch, normal-sized window) is untouched — the framings Jeff
 * tuned there are exactly as before.
 */
import { useUI } from "../ui/effects/uiStore.js";

export const BASE_FOV = 50; // the Canvas camera's fov (App.jsx)
const MIN_FRAME_ASPECT = 4 / 3; // the narrowest framing the cameras were verified at
const GAP = 8; // px between the card and the stage

export const stageViewport = { active: false, fw: 0, fh: 0, cx: 0, cy: 0, W: 0, H: 0 };

function wantsStageViewport() {
  if (typeof window === "undefined") return false;
  return useUI.getState().touchMode || window.innerWidth < 760 || window.innerHeight < 560;
}

function measure() {
  const sv = stageViewport;
  if (typeof document === "undefined") { sv.active = false; return; }
  const panel = document.querySelector(".farm-challenge-panel");
  if (!panel || !wantsStageViewport()) { sv.active = false; return; }
  const W = window.innerWidth;
  const H = window.innerHeight;
  const r = panel.getBoundingClientRect();
  if (r.width < 4 || r.height < 4) { sv.active = false; return; }
  // The HUD's top row (stats pill / buttons) is not stage either.
  let top = 0;
  const stats = document.querySelector(".hud-stats");
  if (stats) { const s = stats.getBoundingClientRect(); if (s.height) top = Math.max(top, s.bottom + 4); }
  // A playing demo's console (ui/demo/DemoOverlay.jsx) is a strip at the top
  // or bottom of a small screen — the stage frames itself around it too.
  let bottom = H;
  const con = document.querySelector(".demo-console");
  if (con) {
    const c = con.getBoundingClientRect();
    if (c.height > 4 && c.width > W * 0.6) {
      if (c.top < H / 2) top = Math.max(top, c.bottom + 4);
      else bottom = Math.min(bottom, c.top - 4);
    }
  }
  const cands = [
    { x0: 0, y0: top, x1: W, y1: Math.min(bottom, r.top - GAP) }, // above the card
    { x0: 0, y0: Math.max(top, r.bottom + GAP), x1: W, y1: bottom }, // below it
    { x0: 0, y0: top, x1: r.left - GAP, y1: bottom }, // left of it
    { x0: r.right + GAP, y0: top, x1: W, y1: bottom }, // right of it
  ];
  let best = null;
  let bestScore = -1;
  for (const c of cands) {
    const w = c.x1 - c.x0;
    const h = c.y1 - c.y0;
    if (w < 80 || h < 80) continue;
    // Area, but a very thin strip is worth less than a squarer one.
    const score = w * h * Math.min(1, Math.min(w, h) / (0.45 * Math.max(w, h)));
    if (score > bestScore) { bestScore = score; best = { ...c, w, h }; }
  }
  if (!best) { sv.active = false; return; }
  sv.active = true;
  sv.W = W;
  sv.H = H;
  sv.fw = best.w;
  sv.fh = best.h;
  sv.cx = best.x0 + best.w / 2;
  sv.cy = best.y0 + best.h / 2;
}

let started = false;
export function startStageViewportTracker() {
  if (started || typeof window === "undefined") return;
  started = true;
  setInterval(measure, 200);
  window.addEventListener("resize", measure);
  window.addEventListener("orientationchange", () => setTimeout(measure, 120));
}

/**
 * The framing for the current free area: the camera fov to use, the
 * equivalent (fov, aspect) to hand the pure view functions (so their
 * `tan(fov/2)·aspect` is the free area's real half-width), the half-tangents
 * themselves, and the projection offset that centres the stage in it.
 */
export function stageFraming() {
  const sv = stageViewport;
  if (!sv.active) return null;
  const t0 = Math.tan((BASE_FOV * Math.PI) / 360);
  let tanHalf = t0;
  // Narrower than 4:3 → keep the 4:3 camera position, widen the view.
  if ((t0 * sv.fw) / sv.H < t0 * MIN_FRAME_ASPECT) tanHalf = (t0 * MIN_FRAME_ASPECT * sv.H) / sv.fw;
  const halfW = (tanHalf * sv.fw) / sv.H;
  const halfV = (tanHalf * sv.fh) / sv.H;
  return {
    fov: (2 * Math.atan(tanHalf) * 180) / Math.PI,
    viewFov: (2 * Math.atan(halfV) * 180) / Math.PI,
    viewAspect: halfW / halfV,
    halfW,
    halfV,
    offX: sv.W / 2 - sv.cx,
    offY: sv.H / 2 - sv.cy,
    W: sv.W,
    H: sv.H,
  };
}
