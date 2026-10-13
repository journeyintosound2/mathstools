import { create } from "zustand";

/**
 * Which treasure chests are open this visit (2026-10-13). Reactive, so the 3D
 * chest (game/TreasureChest.jsx) swings its lid open the moment
 * game/interaction.js hands over the coins — and stays open until the next
 * visit (when a new chest washes up somewhere else).
 */
export const useChests = create((set, get) => ({
  opened: {}, // { [interactableId]: true }
  open(id) { if (!get().opened[id]) set({ opened: { ...get().opened, [id]: true } }); },
  isOpen(id) { return Boolean(get().opened[id]); },
}));
