import React from "react";

import { useProgressSync } from "../../cloud/progressSync.js";

/**
 * A small dot on the ☁ chip: is the signed-in student's progress safe in the
 * cloud? green = saved · pulsing blue = saving / loading · amber = can't reach
 * the cloud (saved on the device, will try again) · grey = cloud progress
 * isn't switched on (the Firestore rule). Nothing when signed out.
 */
const TITLES = {
  synced: "Progress saved to your account",
  saving: "Saving your progress…",
  loading: "Loading your progress…",
  offline: "Saved on this device — will send to the cloud when it can",
  denied: "Saved on this device only (cloud progress isn't switched on yet)",
};

export default function ProgressSyncDot() {
  const status = useProgressSync((s) => s.status);
  if (!status || status === "off") return null;
  return <span className={`sync-dot sync-${status}`} title={TITLES[status] || ""} aria-label={TITLES[status] || ""} role="img" />;
}
