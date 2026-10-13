import { create } from "zustand";

import { isAdminMode, writeAdminMode, checkAdminPassword } from "../data/adminMode.js";
import { useJourney } from "./journeyStore.js";
import { useSession } from "./sessionStore.js";
import { useUI } from "../ui/effects/uiStore.js";

/**
 * ADMIN MODE at runtime (2026-10-13 — see data/adminMode.js). `on` mirrors
 * the device flag; unlocking checks the password; the panel jumps to any
 * world. The journey re-derives the moment it changes, so every gate (and its
 * collider, sign, map pin and wall board) opens or closes at once.
 */
export const useAdmin = create((set, get) => ({
  on: isAdminMode(),
  panelOpen: false,

  /** Try a password. Resolves true (now on) or false. */
  async unlock(password) {
    const ok = await checkAdminPassword(password);
    if (!ok) return false;
    writeAdminMode(true);
    set({ on: true });
    useJourney.getState().refresh();
    useUI.getState().pushToast({ type: "info", icon: "🛠️", title: "Admin mode on", message: "Every gate is open. Your progress isn't changed." });
    return true;
  },

  turnOff() {
    writeAdminMode(false);
    set({ on: false, panelOpen: false });
    useJourney.getState().refresh();
    useUI.getState().pushToast({ type: "info", icon: "🛠️", title: "Admin mode off", message: "The gates follow your progress again." });
  },

  openPanel() { if (get().on) set({ panelOpen: true }); },
  closePanel() { set({ panelOpen: false }); },

  /** Jump straight to a world's arrival point. */
  travel(regionId) {
    if (!get().on) return;
    set({ panelOpen: false });
    const s = useSession.getState();
    if (s.currentRegionId !== regionId) s.setRegion(regionId);
    useUI.getState().clearWaypoint?.();
  },
}));
