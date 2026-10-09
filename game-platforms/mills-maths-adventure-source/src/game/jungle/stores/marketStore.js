import { createLadderStore } from "../ladderStore.js";
import { generateMarketSet } from "../../../data/jungle/marketChallenge.js";
import { vineChip, fmtVal, other } from "../../../data/jungle/vineLadder.js";

const vineOf = (L, side) => (side === "top" ? L.top : L.bottom);
const nice = (x) => (Number.isInteger(x) ? String(x) : String(Math.round(x * 10) / 10));

/**
 * SUNNY MARKET store — the vine ladder with fruit and dollars (whole cents).
 * A split that won't come out in whole cents is refused with the nudge the
 * stage is about: "try a friendlier piece".
 */
export const useMarketChallenge = createLadderStore({
  key: "market",
  generate: generateMarketSet,
  texts: {
    pickOne: "Tap ONE rung for that move.",
    pickTwo: "Tap TWO rungs to join them.",
    refuse(r, L, why) {
      const d = r.drive, p = other(d);
      const dv = vineOf(L, d), pv = vineOf(L, p);
      if (why === "drive-part") {
        if (dv.kind === "money") return "That's part of a cent — try a different split.";
        if (dv.kind === "kg") return "That's a strange weight — try another move.";
        return `Part of a ${dv.one}? The stall only sells WHOLE fruit — try another move.`;
      }
      if (why === "partner-part") {
        if (pv.kind === "money") return "That price doesn't come out in whole cents — try a friendlier piece!";
        return `That would buy part of a ${pv.one} — try another split.`;
      }
      if (why === "too-big") return "That's off the end of the vine! Try a smaller move.";
      if (why === "same") return "Those two rungs are the same — pick two different ones.";
      return "Tap a rung first.";
    },
    dup: (r, L, rung) => `You already have ${vineChip(L.top, rung[0])} ↔ ${fmtVal(L.bottom.kind, rung[1])} — it's selected.`,
    hung: (r, L, rung) => `${vineChip(L.top, rung[0])} ↔ ${fmtVal(L.bottom.kind, rung[1])} ✓`,
    common: (r, v) => `Both ladders reach ${vineChip(r.fruit, v)} — compare the prices: which stall is the better buy?`,
    full: () => "That ladder is full of rungs! Here's a quicker way:",
    additive(r, L, src, p) {
      const d = r.drive, ps = other(d);
      const how = p.op === "split" ? `split the ${vineOf(L, ps).many} into ${p.n} too` : p.op === "times" ? `multiply the ${vineOf(L, ps).many} by ${p.n} too` : "do the same to the other vine";
      return `Adding the same amount to both slides the ${vineOf(L, ps).many} vine off zero! When you change the ${vineOf(L, d).many}, ${how}.`;
    },
    wrong(r, L, p, v) {
      const d = r.drive, ps = other(d);
      const at = d === "top" ? (v * L.a) / L.b : (v * L.b) / L.a;
      const atTxt = vineOf(L, d).kind === "count" ? `${nice(at)} ${vineOf(L, d).icon}` : fmtVal(vineOf(L, d).kind, Math.round(at));
      return `Crooked rung! ${fmtVal(vineOf(L, ps).kind, v)} hangs under ${atTxt}, not ${fmtVal(vineOf(L, d).kind, p.value)}. Try again.`;
    },
    hint: (r, L, h) => `Work out ${h}.`,
    notSmallest: () => "",
    needCommon: () => "First build BOTH ladders to the same amount of fruit — then compare.",
  },
});
