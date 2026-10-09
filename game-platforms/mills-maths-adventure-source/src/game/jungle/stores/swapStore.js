import { createLadderStore } from "../ladderStore.js";
import { generateSwapSet } from "../../../data/jungle/swapChallenge.js";
import { vineChip, onSide, other, untiedZero } from "../../../data/jungle/vineLadder.js";

const nice = (x) => (Number.isInteger(x) ? String(x) : String(Math.round(x * 10) / 10));
const icon = (L, side) => (side === "top" ? L.top : L.bottom).icon;
const word = (L, side) => (side === "top" ? L.top : L.bottom).one;

/**
 * MONKEY SWAP store — the vine ladder with fruit. Kid-sized wording for the
 * refusals ("monkeys only swap WHOLE fruit") and for the add-the-same trap
 * (the mango vine slides off its zero).
 */
export const useSwapChallenge = createLadderStore({
  key: "swap",
  generate: generateSwapSet,
  texts: {
    pickOne: "Tap ONE rung for that move.",
    pickTwo: "Tap TWO rungs to join them.",
    refuse(r, L, why) {
      const d = r.drive, p = other(d);
      if (why === "drive-part") return `That makes part of a ${word(L, d)} — monkeys only swap WHOLE fruit!`;
      if (why === "partner-part") return `That gives part of a ${word(L, p)} — monkeys only swap WHOLE fruit. Try another move!`;
      if (why === "too-big") return "That's off the end of the vine! Try a smaller jump.";
      if (why === "same") return "Those two rungs are the same — pick two different ones.";
      return "Tap a rung first.";
    },
    dup: (r, L, rung) => `You already have ${vineChip(L.top, rung[0])} ↔ ${vineChip(L.bottom, rung[1])} — it's selected.`,
    hung: (r, L, rung) => `${vineChip(L.top, rung[0])} ↔ ${vineChip(L.bottom, rung[1])} ✓ — another fair swap.`,
    common: () => "",
    full: () => "The vine is full of rungs! Here's a quicker way:",
    additive(r, L, src, p, v) {
      const d = r.drive, ps = other(d);
      const z = untiedZero([onSide(src, d), onSide(src, ps)], [p.value, v]);
      const where = z === null ? "" : z > 0 ? ` (look — its 0 is under ${nice(z)} ${icon(L, d)} now)` : " (look — its 0 has slipped past the post)";
      const deal = r.ladders[0].start[0];
      if (p.op === "again") {
        return `You added the same number to both — the ${word(L, ps)} vine slides off zero${where}! A fair swap adds a whole DEAL: +${vineChip(L.top, deal[0])} AND +${vineChip(L.bottom, deal[1])}.`;
      }
      return `Adding the same number to both slides the ${word(L, ps)} vine off zero${where}! Whatever you do to the ${L.top.many}, do it to the ${L.bottom.many} too.`;
    },
    wrong(r, L, p, v) {
      const d = r.drive, ps = other(d);
      const at = d === "top" ? (v * L.a) / L.b : (v * L.b) / L.a;
      return `Crooked rung! ${v} ${icon(L, ps)} hangs under ${nice(at)} ${icon(L, d)}, not ${p.value}. Try again.`;
    },
    hint: (r, L, h) => `Look at the other vine: work out ${h}.`,
    notSmallest: (r, small) => `${small[0]} 🍌 ↔ ${small[1]} 🥭 can still split into equal swaps — keep going!`,
    needCommon: () => "",
  },
});
