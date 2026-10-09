import { create } from "zustand";
import { play } from "./sound.js";

/**
 * UI / effects store — transient front-of-house state that isn't game progress.
 *
 * Holds:
 *   - whether the Quest Log is open
 *   - the toast queue (level-up / quest-complete celebrations)
 *   - the sound on/off preference (persisted on its own so muting survives
 *     refreshes without touching the saved game)
 *
 * Sound preference is kept here so a single 🔊/🔇 toggle controls everything,
 * and any component can mute by flipping one flag.
 */

const SOUND_KEY = "mills-maths-adventure:sound";
const QUEST_HUD_KEY = "mills-maths-adventure:questHud";
const CAMERA_LOCK_KEY = "mills-maths-adventure:cameraLock";
// Touch controls (W4). The override is tri-state: null = auto-detect, "1"/"0" =
// forced on/off (so a user can override the auto-detection from the ⚙ menu).
const TOUCH_KEY = "mills-maths-adventure:touch";

// Detect a touch-first device (phones / iPads). `pointer: coarse` is the modern
// signal; the ontouchstart check is a belt-and-braces fallback.
function detectTouch() {
  try {
    if (typeof window !== "undefined" && window.matchMedia) {
      if (window.matchMedia("(pointer: coarse)").matches) return true;
    }
    return typeof window !== "undefined" && "ontouchstart" in window;
  } catch {
    return false;
  }
}

// Resolve the initial touchMode from the saved override (if any), else auto.
function loadTouchMode() {
  try {
    const v = localStorage.getItem(TOUCH_KEY);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch { /* ignore */ }
  return detectTouch();
}

// Graphics quality (W5). "high" = full soft-cartoon lighting (rim light +
// environment IBL + heavier passes); "low" = the lean path for phones/tablets.
// Defaults to low on touch devices, high otherwise; overridable + persisted.
const GRAPHICS_KEY = "mills-maths-adventure:graphics";
function loadGraphicsQuality() {
  try {
    const v = localStorage.getItem(GRAPHICS_KEY);
    if (v === "high" || v === "low") return v;
  } catch { /* ignore */ }
  return detectTouch() ? "low" : "high";
}

// Language (bilingual EALD support). "en" = English only; "fa" = Farsi, "ar" =
// Arabic — both render the translation with the English underneath (see i18n/).
const LANGUAGE_KEY = "mills-maths-adventure:language";
function loadLanguage() {
  try {
    const v = localStorage.getItem(LANGUAGE_KEY);
    if (v === "en" || v === "fa" || v === "ar") return v;
  } catch { /* ignore */ }
  return "en";
}

function loadBoolPref(key, dflt) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? dflt : v === "1";
  } catch {
    return dflt;
  }
}

function loadSoundPref() {
  try {
    const v = localStorage.getItem(SOUND_KEY);
    return v === null ? true : v === "1"; // default ON
  } catch {
    return true;
  }
}

function loadQuestHudPref() {
  try {
    const v = localStorage.getItem(QUEST_HUD_KEY);
    return v === null ? false : v === "1"; // default OFF (card hidden until turned on)
  } catch {
    return false;
  }
}

let nextToastId = 0;

export const useUI = create((set, get) => ({
  questLogOpen: false,
  trophyOpen: false,
  farmTrophyOpen: false, // the Fraction Farm trophy grid (opened from the stand)
  snowTrophyOpen: false, // the Snowball Sums trophy grid (opened from its stand)
  magmaTrophyOpen: false, // the Magma Multiples trophy grid (opened from its stand)
  jungleTrophyOpen: false, // the Emerald Jungle trophy grid (opened from its stand)
  // Whether the persistent "Current Quest" card is shown in the HUD (a student
  // preference, saved so it survives refreshes).
  questHudOn: loadQuestHudPref(),
  // Camera Lock: when ON the camera follows smoothly behind the player. Persisted.
  cameraLock: loadBoolPref(CAMERA_LOCK_KEY, true), // default ON
  // The cog (⚙) options dropdown open state.
  cogOpen: false,
  soundEnabled: loadSoundPref(),
  // Touch controls (W4): tap-to-move, tap-to-interact, on-screen keypad. Auto-on
  // for touch devices, overridable from the ⚙ menu. Keyboard/WASD stays active
  // regardless, so hybrid (touchscreen laptop) devices get both.
  touchMode: loadTouchMode(),
  toasts: [],

  // Force touch controls on/off (persists an explicit override).
  toggleTouchMode() {
    const next = !get().touchMode;
    try { localStorage.setItem(TOUCH_KEY, next ? "1" : "0"); } catch { /* ignore */ }
    set({ touchMode: next });
  },

  // First-person view (W6): when on, the camera sits at the player's eyes and
  // the arrow/WASD keys look around (up/down/left/right) instead of moving.
  // Toggled with "/". Transient (not persisted).
  fpv: false,
  toggleFpv() { set((s) => ({ fpv: !s.fpv })); },
  setFpv(on) { set({ fpv: Boolean(on) }); },

  // The ACHIEVEMENTS WALL first-person look (Number Island): null when off,
  // else { panel } — −1 = the whole wall, 0…5 = one world's board up close.
  // Player.jsx flies the camera there; ui/AchievementsWallUI.jsx drives it.
  wallView: null,
  wallLastPanel: 0,
  openWall(panel = -1) { set({ wallView: { panel }, fpv: false, ...(panel >= 0 ? { wallLastPanel: panel } : {}) }); },
  closeWall() { set({ wallView: null }); },
  wallStep(dir) {
    const v = get().wallView;
    if (!v) return;
    const n = 6;
    const from = v.panel < 0 ? (dir > 0 ? -1 : n) : v.panel;
    const panel = (from + dir + n) % n;
    set({ wallView: { panel }, wallLastPanel: panel });
  },
  wallZoom(zoomIn) {
    const v = get().wallView;
    if (!v) return;
    if (zoomIn && v.panel < 0) set({ wallView: { panel: get().wallLastPanel } });
    else if (!zoomIn && v.panel >= 0) set({ wallView: { panel: -1 } });
  },

  // The title screen's loading curtain lifts once the 3D world has drawn its
  // first frames (game/WorldReady.jsx flips this).
  worldReady: false,
  setWorldReady(on) { if (get().worldReady !== Boolean(on)) set({ worldReady: Boolean(on) }); },

  // Graphics quality (W5): "high" | "low". Toggling persists an explicit choice.
  graphicsQuality: loadGraphicsQuality(),
  toggleGraphicsQuality() {
    const next = get().graphicsQuality === "high" ? "low" : "high";
    try { localStorage.setItem(GRAPHICS_KEY, next); } catch { /* ignore */ }
    set({ graphicsQuality: next });
  },

  // Language (bilingual EALD support): "en" | "fa" | "ar". Persisted so a
  // student's choice survives refreshes. `setLanguage` sets a specific one;
  // `cycleLanguage` steps English → Farsi → Arabic → English.
  language: loadLanguage(),
  setLanguage(lang) {
    const next = lang === "fa" || lang === "ar" ? lang : "en";
    try { localStorage.setItem(LANGUAGE_KEY, next); } catch { /* ignore */ }
    set({ language: next });
  },
  cycleLanguage() {
    const order = ["en", "fa", "ar"];
    const next = order[(order.indexOf(get().language) + 1) % order.length];
    get().setLanguage(next);
  },

  toggleCameraLock() {
    const next = !get().cameraLock;
    try { localStorage.setItem(CAMERA_LOCK_KEY, next ? "1" : "0"); } catch { /* ignore */ }
    set({ cameraLock: next });
  },
  toggleCog() {
    set((s) => ({ cogOpen: !s.cogOpen }));
  },
  setCog(open) {
    set({ cogOpen: open });
  },

  toggleQuestHud() {
    const next = !get().questHudOn;
    try { localStorage.setItem(QUEST_HUD_KEY, next ? "1" : "0"); } catch { /* ignore */ }
    set({ questHudOn: next });
  },

  // The active-mission HUD card can be dismissed (× ); it reappears when a
  // DIFFERENT mission becomes active. Tracked by mission id.
  dismissedMissionId: null,
  dismissMissionCard(missionId) {
    set({ dismissedMissionId: missionId || null });
  },

  // DevPanel collision-debug overlay (collider outlines).
  collisionDebug: false,
  toggleCollisionDebug() {
    set((s) => ({ collisionDebug: !s.collisionDebug }));
  },

  toggleQuestLog() {
    set((s) => ({ questLogOpen: !s.questLogOpen }));
  },
  setQuestLog(open) {
    set({ questLogOpen: open });
  },

  toggleTrophy() {
    set((s) => ({ trophyOpen: !s.trophyOpen }));
  },
  setTrophy(open) {
    set({ trophyOpen: open });
  },
  setFarmTrophy(open) {
    set({ farmTrophyOpen: open });
  },
  setSnowTrophy(open) {
    set({ snowTrophyOpen: open });
  },
  setMagmaTrophy(open) {
    set({ magmaTrophyOpen: open });
  },
  setJungleTrophy(open) {
    set({ jungleTrophyOpen: open });
  },

  // Results Centre (Phase 2L) — local attempt history / reporting overlay.
  resultsOpen: false,
  toggleResults() {
    set((s) => ({ resultsOpen: !s.resultsOpen }));
  },
  setResults(open) {
    set({ resultsOpen: open });
  },

  // "How to play" card (Phase 2O) — a short classroom-friendly help overlay.
  howToOpen: false,
  toggleHowTo() {
    set((s) => ({ howToOpen: !s.howToOpen }));
  },
  setHowTo(open) {
    set({ howToOpen: open });
  },

  // Teacher Pilot card (Phase 2P) — local classroom launch/help overlay.
  pilotOpen: false,
  togglePilot() {
    set((s) => ({ pilotOpen: !s.pilotOpen }));
  },
  setPilot(open) {
    set({ pilotOpen: open });
  },

  // Cloud sign-in overlay (Phase 3B) — student-code / demo login.
  cloudLoginOpen: false,
  toggleCloudLogin() {
    set((s) => ({ cloudLoginOpen: !s.cloudLoginOpen }));
  },
  setCloudLogin(open) {
    set({ cloudLoginOpen: open });
  },

  toggleSound() {
    const next = !get().soundEnabled;
    try {
      localStorage.setItem(SOUND_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    set({ soundEnabled: next });
    if (next) play("coin"); // little confirmation blip when turning sound on
  },

  // Play a sound only if sound is enabled. One gate for the whole app.
  playSound(name) {
    if (get().soundEnabled) play(name);
  },

  /**
   * Queue a celebratory toast. Auto-dismisses after `duration` ms.
   *   { type, title, message, icon, duration? }
   */
  pushToast({ type = "info", title = "", message = "", icon = "", duration = 2800 }) {
    const id = ++nextToastId;
    set((s) => ({ toasts: [...s.toasts, { id, type, title, message, icon }] }));
    setTimeout(() => get().dismissToast(id), duration);
    return id;
  },

  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
