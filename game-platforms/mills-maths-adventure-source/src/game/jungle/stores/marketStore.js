import { createLadderStore } from "../ladderStore.js";
import { generateMarketSet } from "../../../data/jungle/marketChallenge.js";
import { vineChip, fmtVal, other, vineOn } from "../../../data/jungle/vineLadder.js";

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
    refuse(r, L, why, op, n, d) {
      const dv = vineOn(L, d), pv = vineOn(L, other(d));
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
    goal: (r, L, rung) => `${vineChip(L.top, rung[0])} = ${fmtVal(L.bottom, rung[1])} — sold!`,
    common: (r, v) => `Both ladders reach ${vineChip(r.fruit, v)} — compare the prices: which stall is the better buy?`,
    additive(r, L, src, p, v, d) {
      const ps = other(d);
      const how = p.op === "split" ? `split the ${vineOn(L, ps).many} into ${p.n} too` : p.op === "times" ? `multiply the ${vineOn(L, ps).many} by ${p.n} too` : "do the same to the other vine";
      return `Adding the same amount to both slides the ${vineOn(L, ps).many} vine off zero! When you change the ${vineOn(L, d).many}, ${how}.`;
    },
    wrong(r, L, p, v, d) {
      const ps = other(d);
      const at = d === "top" ? (v * L.a) / L.b : (v * L.b) / L.a;
      const atTxt = vineOn(L, d).kind === "count" ? `${nice(at)} ${vineOn(L, d).icon}` : fmtVal(vineOn(L, d), Math.round(at));
      return `Crooked rung! ${fmtVal(vineOn(L, ps), v)} hangs under ${atTxt}, not ${fmtVal(vineOn(L, d), p.value)}. Try again.`;
    },
    hint: (r, L, h) => `Work out ${h}.`,
    needCommon: () => "First build BOTH ladders to the same amount of fruit — then compare.",
  },
});
