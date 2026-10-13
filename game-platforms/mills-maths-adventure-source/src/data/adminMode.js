/**
 * ADMIN MODE (2026-10-13) — Jeff's testing switch. Unlocked from the title
 * screen with a password; while it's on, EVERY world gate is open (so new
 * worlds can be tried without winning the trophies first) and the ⚙ admin
 * panel can jump straight to any world. It never changes a save: no trophies,
 * missions or journey beats are written, and gates opened this way are never
 * celebrated. Per device, in localStorage (never sent to the cloud — it isn't
 * a SYNCED_KEY), until it's switched off.
 *
 * The password is only stored as its SHA-256 hash, so it isn't sitting in the
 * built game as plain text. (This is a convenience lock for a classroom game,
 * not real security — anyone determined could flip the flag in the browser.)
 */
export const ADMIN_KEY = "mma-admin-mode";
export const ADMIN_PASSWORD_SHA256 = "0305d75141cbc73686558ca8d33c8001e157142b630daaa0aa5d67d7a1244349";

export function isAdminMode() {
  try { return globalThis.localStorage?.getItem(ADMIN_KEY) === "1"; } catch { return false; }
}

export function writeAdminMode(on) {
  try {
    if (on) globalThis.localStorage?.setItem(ADMIN_KEY, "1");
    else globalThis.localStorage?.removeItem(ADMIN_KEY);
  } catch { /* storage blocked — admin mode just won't stick */ }
}

/** SHA-256 of a string, as lowercase hex. */
export async function sha256Hex(text) {
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle) throw new Error("This browser can't check the password here.");
  const bytes = new TextEncoder().encode(String(text));
  const digest = await subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Is this the admin password? (Exact match — case and spaces count, except the ends.) */
export async function checkAdminPassword(attempt) {
  if (!attempt) return false;
  try { return (await sha256Hex(String(attempt).trim())) === ADMIN_PASSWORD_SHA256; } catch { return false; }
}
