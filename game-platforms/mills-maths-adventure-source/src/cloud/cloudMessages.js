/**
 * CLOUD SAVE MESSAGES (Phase 3B.1) — PURE student-facing wording for the cloud
 * save status on the completion screen. Kept here (no React) so the system
 * checks can verify the wording without rendering.
 *
 * status: "pending" | "saved" | "failed" | "demo" | "unregistered" | "skipped"
 * isStory: true when the completed mission was a main-story mission (the cloud
 *          record is tagged missionKind:"story", separate from teacher tasks).
 */
export function cloudSaveMessage(status, isStory = false) {
  switch (status) {
    case "pending":
      return "☁ Saving to your class account…";
    case "saved":
      return isStory
        ? "☁ Saved locally and online. Story attempt tagged separately from teacher tasks."
        : "☁ Saved locally and online.";
    case "failed":
      return "Saved on this device, but online save failed.";
    case "demo":
      return "Demo mode — saved on this device only.";
    case "unregistered":
      return "Saved on this device only. Sign in with a student code to save online.";
    case "skipped":
      return "Cloud save skipped: no completed maths attempt was recorded.";
    default:
      return "";
  }
}

/**
 * The ONE short save line on the (2026-10-13) finish screen — the long
 * wording above stays for the Results Centre / checks.
 */
export function cloudSaveShort(status) {
  switch (status) {
    case "pending": return { icon: "☁️", text: "Saving to your class…" };
    case "saved": return { icon: "✓", text: "Saved to your class" };
    case "failed": return { icon: "💾", text: "Saved on this device (online save failed)" };
    case "demo": return { icon: "💾", text: "Saved on this device (demo)" };
    case "unregistered": return { icon: "💾", text: "Saved on this device" };
    default: return null;
  }
}
