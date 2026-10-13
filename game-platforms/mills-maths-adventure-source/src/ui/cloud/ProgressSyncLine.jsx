import React from "react";

import { Bi } from "../../i18n/i18n.jsx";
import { useProgressSync } from "../../cloud/progressSync.js";

/** One line in the sign-in panel: where the student's progress is saved. */
export default function ProgressSyncLine() {
  const status = useProgressSync((s) => s.status);
  if (!status || status === "off") return null;
  const text = {
    loading: "Loading your progress…",
    saving: "Saving your progress…",
    synced: "Your progress is saved to your account — sign in on any device to carry on.",
    offline: "Can't reach the cloud right now — your progress is saved on this device and will be sent when it can.",
    denied: "Your progress is saved on this device. (Cloud progress isn't switched on yet.)",
  }[status];
  if (!text) return null;
  return (
    <p className={`cloud-progress-line sync-${status}`}>
      <span className={`sync-dot sync-${status}`} aria-hidden="true" /> <Bi>{text}</Bi>
    </p>
  );
}
