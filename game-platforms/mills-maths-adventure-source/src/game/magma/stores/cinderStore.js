import { createMagmaStore } from "../createMagmaStore.js";
import {
  generateCinderSet, cinderApply, cinderHit, cinderEfficiency, cinderReachPoints, CINDER_MAX_NEW,
  CINDER_OPS,
} from "../../../data/magma/cinderChallenge.js";
import { parseWhole } from "../../../data/magma/magmaMath.js";

const OP_HINT = {
  x2: (a) => `double ${a[1]}`,
  h2: (a) => `half of ${a[1]}`,
  x10: (a) => `${a[1]} × 10`,
  d10: (a) => `${a[1]} ÷ 10`,
  add: (a, b) => `${a[1]} + ${b[1]}`,
  sub: (a, b) => `${Math.max(a[1], b[1])} − ${Math.min(a[1], b[1])}`,
};

/** The camera widens as the table grows (Player reads viewFit). */
function fitFor(n) {
  return Math.max(6.0, (n * 1.75 + 5.6) / 2 + 0.6);
}

/**
 * CART TABLES store. Select one column (× 2, ÷ 2, × 10, ÷ 10) or two
 * (+, −); the new column's CARTS fill in, the student types its ROCKS.
 */
export const useCinderChallenge = createMagmaStore({
  key: "cinder",
  generate: generateCinderSet,
  fresh: (r) => ({ cols: r ? [[r.c0, r.r0]] : [], sel: r ? [0] : [], pending: null, misses: 0, hit: null, lastCol: null, viewFit: fitFor(2) }),
  actions: (set, get, api) => ({
    select(i) {
      if (get().status !== "play" || get().pending) return;
      const sel = get().sel;
      if (sel.includes(i)) set({ sel: sel.filter((x) => x !== i) });
      else set({ sel: sel.length >= 2 ? [sel[1], i] : [...sel, i] });
    },
    op(id) {
      const r = get().currentRound();
      if (get().status !== "play" || !r || get().pending) return;
      const opDef = CINDER_OPS.find((o) => o.id === id);
      const { sel, cols } = get();
      if (opDef.arity === 1 && sel.length !== 1) {
        api.say("Pick ONE column for that move.", "warm");
        return;
      }
      if (opDef.arity === 2 && sel.length !== 2) {
        api.say("Pick TWO columns to add or subtract.", "warm");
        return;
      }
      if (cols.length - 1 >= CINDER_MAX_NEW) {
        api.say("The table is full!", "warm");
        return;
      }
      const a = cols[sel[0]], b = opDef.arity === 2 ? cols[sel[1]] : null;
      const col = cinderApply(r, id, a, b);
      if (!col) {
        const why = id === "h2" ? "That won't halve into whole carts and rocks." : id === "d10" ? "÷ 10 needs both numbers to end in 0." : id === "sub" ? "Those columns are the same!" : "Too many carts for this table!";
        api.say(why, "warm");
        return;
      }
      if (cols.some((c) => c[0] === col[0])) {
        api.say(`You already have ${col[0]} carts.`, "warm");
        return;
      }
      set({ pending: { op: id, carts: col[0], rocks: col[1], from: sel.slice(), hint: OP_HINT[id](a, b) }, note: null, viewFit: fitFor(cols.length + 1) });
    },
    cancel() {
      set({ pending: null, viewFit: fitFor(get().cols.length + 1) });
    },
    /** Type the new column's rocks: "invalid" | "correct" | "wrong". */
    submitRocks(text) {
      const r = get().currentRound();
      const p = get().pending;
      if (get().status !== "play" || !r || !p) return "invalid";
      const v = parseWhole(text);
      if (v === null) return "invalid";
      if (v !== p.rocks) {
        set({ misses: get().misses + 1 });
        api.say(`Not quite — work out ${p.hint}.`, "bad");
        return "wrong";
      }
      const cols = [...get().cols, [p.carts, p.rocks]];
      set({ cols, pending: null, sel: [cols.length - 1], lastCol: { at: Date.now(), i: cols.length - 1 }, viewFit: fitFor(cols.length + 1) });
      if (cinderHit(r, [p.carts, p.rocks])) {
        const used = cols.length - 1;
        api.award(cinderReachPoints(get().misses) + cinderEfficiency(r, used));
        set({ hit: { used, min: r.min } });
        api.endRound();
        return "correct";
      }
      api.say(`${p.carts} carts → ${p.rocks} rocks ✓`, "good");
      if (cols.length - 1 >= CINDER_MAX_NEW) {
        set({ hit: null });
        api.endRound();
      }
      return "correct";
    },
    undo() {
      if (get().status !== "play" || get().cols.length <= 1) return;
      const cols = get().cols.slice(0, -1);
      set({ cols, pending: null, sel: [cols.length - 1], viewFit: fitFor(cols.length + 1) });
    },
  }),
});
