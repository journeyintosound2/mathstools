import { create } from "zustand";

import { CLOUD_ENABLED } from "./firebaseConfig.js";
import { ensureConnected, exchangeStudentCode, setStudentAvatar, signOutCloud, readClassAssignments } from "./firebaseClient.js";
import { saveCloudAttempt } from "./cloudResultWriter.js";
import { normaliseStudentCode } from "./studentSession.js";
import { setRuntimeMissions, clearRuntimeMissions } from "../data/missions.js";
import { setRuntimeAssignments, clearRuntimeAssignments } from "../data/npcQuestChains.js";
import { useProgress } from "../progress/store.js";
import { loadCloudProgress, stopProgressSync } from "./progressSync.js";

// Bumps on every sign-in, so a slow sign-out never signs the NEXT student out.
let _authGen = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// How long sign-in waits for the cloud save before letting the student play
// (the load finishes in the background if the network is slow).
export const PROGRESS_WAIT_MS = 7000;

/**
 * Apply a cloud-saved explorer avatar (W3-B) to the local profile so the
 * student's character follows them across devices. `created:true` is set so the
 * character creator isn't forced after a fresh sign-in. No-op for a null avatar.
 */
function applyCloudAvatar(avatar) {
  if (!avatar || typeof avatar !== "object") return;
  const p = useProgress.getState();
  p.setProfile({
    ...p.profile,
    color: avatar.color || p.profile.color,
    skin: avatar.skin || p.profile.skin,
    hair: avatar.hair || p.profile.hair,
    hairStyle: avatar.hairStyle || p.profile.hairStyle,
    hat: avatar.hat || p.profile.hat,
    hatColour: avatar.hatColour || p.profile.hatColour,
    glasses: Boolean(avatar.glasses),
    created: true,
  });
}

/**
 * CLOUD SESSION STORE (Phase 3B) — the small reactive bridge between the cloud
 * adapter and the React UI. The game interacts with the cloud ONLY through this.
 *
 * mode:
 *   "pending"    — not signed in (default) → local only, no cloud writes
 *   "registered" — a valid student code is loaded → cloud save on
 *   "skip"       — explicit demo/skip → local only, no cloud writes
 *
 * The Firebase SDK only loads when the student tries to sign in (connect()).
 */
export const useCloud = create((set, get) => ({
  enabled: CLOUD_ENABLED,
  status: "idle", // idle | connecting | connected | error
  mode: "pending", // pending | registered | skip
  student: null, // the Firebase students/{code} document (registered)
  error: null,
  lastSave: null, // { attemptId, status } of the most recent cloud attempt
  assignments: [], // teacher-set Adventure tasks for this student's class
  farmTasks: [], // active Fraction Farm challenge tasks (location:"farm")

  /** Connect + anonymous sign-in (lazy). Safe to call repeatedly. */
  async connect() {
    if (!get().enabled) return false;
    if (get().status === "connected") return true;
    set({ status: "connecting", error: null });
    try {
      await ensureConnected();
      set({ status: "connected" });
      return true;
    } catch (err) {
      set({ status: "error", error: String((err && err.message) || err) });
      return false;
    }
  },

  /**
   * Validate a student code via the SECURE Cloud Function exchange (Phase 3D) and
   * start a REGISTERED session. The client no longer reads `students/{code}`
   * directly — the function validates server-side, mints a custom token, and the
   * client signs in with it. The returned profile (name/class/teacher) comes from
   * Firebase. `pin` is optional (only used if the student doc requires one).
   * Returns { ok, error }.
   */
  async registerWithCode(rawCode, pin) {
    const code = normaliseStudentCode(rawCode);
    if (!code) return { ok: false, error: "Enter your student code first." };
    const connected = await get().connect();
    if (!connected) return { ok: false, error: "Could not connect. You can still play in demo mode." };
    // Someone else is signed in on this device? Send their last changes while
    // still signed in as them, then stop saving for them.
    const prev = get().mode === "registered" ? get().student : null;
    const switching = Boolean(prev && prev.studentCode && prev.studentCode !== code);
    if (switching) await stopProgressSync();
    _authGen++;
    try {
      const student = await exchangeStudentCode(code, pin);
      if (!student || !student.studentCode) {
        if (switching) loadCloudProgress(prev); // still them — carry on saving
        return { ok: false, error: "Student code not found. Check it with your teacher." };
      }
      set({ mode: "registered", student, error: null });
      // Apply the student's cloud-saved explorer avatar (W3-B), so their
      // character follows them across devices. Non-fatal if there isn't one.
      applyCloudAvatar(student.avatar);
      // CLOUD PROGRESS (2026-10-13): pick up where they left off. Waits a few
      // seconds at most; a slow network finishes it in the background.
      const progressLoad = loadCloudProgress(student);
      await Promise.race([progressLoad, sleep(PROGRESS_WAIT_MS)]);
      // Load any teacher-set tasks for this class (non-fatal if it fails).
      await get().loadAssignments();
      // Back-fill any Fraction Farm challenges completed locally (e.g. before
      // signing in) so the teacher sees them — AFTER the cloud save is in, so
      // farm bests already reported from another device aren't sent again.
      // Fire-and-forget; never blocks.
      progressLoad.finally(async () => {
        try { (await import("./farmCompletion.js")).syncLocalFarmBests(); } catch (e) { /* non-fatal */ }
      });
      return { ok: true, student };
    } catch (err) {
      if (switching) loadCloudProgress(prev);
      // Cloud Function HttpsError messages surface here (not found / inactive / PIN).
      return { ok: false, error: String((err && err.message) || err) };
    }
  },

  /**
   * Save the student's explorer avatar to their cloud account (W3-B). Only runs
   * when signed in (registered); otherwise it's a silent no-op and the local
   * save is the only persistence. Never throws — a failed cloud save must never
   * block play. Returns { ok }.
   */
  async saveAvatar(avatar) {
    if (!get().isRegistered()) return { ok: false, reason: "not-registered" };
    try {
      const saved = await setStudentAvatar(avatar);
      // Keep our cached student doc in sync so a later sign-out/in is consistent.
      if (saved) set({ student: { ...get().student, avatar: saved } });
      return { ok: true, avatar: saved };
    } catch (err) {
      return { ok: false, reason: String((err && err.message) || err) };
    }
  },

  /** Explicit demo/skip — local only, no cloud writes. */
  skipDemo() {
    if (get().mode === "registered") { get().clearSession(); }
    set({ mode: "skip", student: null, error: null });
  },

  /**
   * Fetch the teacher-set Adventure tasks for the registered student's class and
   * wire them into the mission system: register each as a runtime mission (so
   * activateMission/getMission resolve it) and overlay it on its NPC's chain.
   * Non-fatal — on any error the game simply falls back to the static chains.
   */
  async loadAssignments() {
    const student = get().mode === "registered" ? get().student : null;
    if (!student || !student.teacherCode || !student.className) {
      setRuntimeMissions([]); setRuntimeAssignments({}); set({ assignments: [], farmTasks: [] });
      return [];
    }
    try {
      const raw = await readClassAssignments(student.teacherCode, student.className);
      // Fraction Farm tasks are delivered by the farm challenges themselves (not
      // the NPC quest chain), so keep them separate from the island/schoolyard
      // missions and expose them via farmTaskFor() for the farm stores + HUD.
      const farmTasks = raw.filter((a) => a && a.location === "farm" && a.challengeId);
      const nonFarm = raw.filter((a) => !(a && a.location === "farm"));
      // Register non-farm tasks as runtime missions (mission id = assignment id).
      setRuntimeMissions(nonFarm.map((a) => ({ ...a, missionId: a.assignmentId })));
      // Group non-farm tasks by NPC for the chain overlay.
      const byNpc = {};
      for (const a of nonFarm) {
        const npc = String(a.npcId || "").toLowerCase();
        if (npc) (byNpc[npc] = byNpc[npc] || []).push(a);
      }
      setRuntimeAssignments(byNpc);
      set({ assignments: raw, farmTasks });
      return raw;
    } catch (err) {
      setRuntimeMissions([]); setRuntimeAssignments({}); set({ assignments: [], farmTasks: [] });
      return [];
    }
  },

  /** The active Fraction Farm task for a challenge id, or null. */
  farmTaskFor(challengeId) {
    return (get().farmTasks || []).find((t) => t && t.challengeId === challengeId) || null;
  },

  /**
   * Clear the cloud session (back to pending) + sign out. Never deletes data.
   * Any progress not yet sent goes first (while still signed in as them).
   * Returns a promise that settles once signed out.
   */
  clearSession() {
    const gen = _authGen;
    const flushing = stopProgressSync();
    clearRuntimeMissions(); clearRuntimeAssignments();
    set({ mode: "pending", student: null, error: null, lastSave: null, assignments: [], farmTasks: [] });
    return flushing.catch(() => {}).then(() => {
      if (gen === _authGen) return signOutCloud(); // nobody new has signed in meanwhile
      return undefined;
    });
  },

  /**
   * Dual-save a completed attempt to the cloud (compact achievement + rich
   * adventure attempt). Returns a status string and records it in `lastSave`.
   * Never throws; the local save is always already done by the caller.
   */
  async saveAttempt(resultRecord) {
    const student = get().mode === "registered" ? get().student : null;
    const result = await saveCloudAttempt(resultRecord, student);
    set({ lastSave: { attemptId: resultRecord && resultRecord.attemptId, status: result.status } });
    return result;
  },

  /** True when a completed non-story attempt would be cloud-saved right now. */
  isRegistered() {
    return get().mode === "registered" && Boolean(get().student);
  },
}));
