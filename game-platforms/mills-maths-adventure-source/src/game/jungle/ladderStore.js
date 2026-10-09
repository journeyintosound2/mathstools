import { createMagmaStore } from "../magma/createMagmaStore.js";
import { getJungleChallenge } from "../../data/jungle/jungleChallenges.js";
import {
  JUNGLE_ROUNDS_PER_SET, JUNGLE_POINTS_PER_ROUND, readJungleBest, writeJungleBest,
} from "../../data/jungle/jungleRecords.js";
import {
  LADDER_MOVES, tryMove, parseVal, onSide, other, additivePartner, untiedZero, partnerHint,
  reachPoints, efficiencyPoints, MAX_NEW_RUNGS, vineChip,
} from "../../data/jungle/vineLadder.js";

/**
 * THE VINE-LADDER STORE — every Emerald Jungle challenge built on the vine
 * ladder shares this round machinery (on top of the Magma lifecycle:
 * idle → intro → play → celebrate | feedback → done).
 *
 * A round (from the challenge's logic file) carries:
 *   kind      "reach" (hang the target rung) · "smallest" (split down to the
 *             smallest swap, then claim it) · "compare" (two ladders: build a
 *             common rung, then choose the better one)
 *   ladders   [{ L, start: [[top, bottom]], name? }] — one, or two to compare
 *   drive     the vine the SCENE fills ("top" | "bottom"); the student types
 *             the partner
 *   target / smallest / better, moves, min, maxDrive, working
 *
 * State: ladders[li].rungs ([top, bottom] in base units), the active ladder,
 * the selected rung(s), a PENDING rung (scene placed, partner unknown), the
 * misses, the last WRONG try (for the crooked rung / untied zero in 3D).
 *
 * Verbs: select(li, i) · choose(op) · pickN(n) · submit(text) · cancel() ·
 * undo() · claim() · call(i). Scoring lives in the logic (vineLadder.js).
 *
 * `texts` (per challenge) words the refusals and the verdicts kindly.
 */

/** The camera widens a little for two stacked ladders. */
// Half-width (m) the camera must show: the vines + the stall, plus the vine
// NAME chips that hang left of the zero post (wide on a 4:3 screen).
const fitFor = (r) => (r && r.ladders.length > 1 ? 7.6 : 7.4);

export function createLadderStore({ key, generate, texts }) {
  const world = {
    meta: getJungleChallenge(key),
    readBest: readJungleBest,
    writeBest: writeJungleBest,
    rounds: JUNGLE_ROUNDS_PER_SET,
    points: JUNGLE_POINTS_PER_ROUND,
    icon: "🌿",
    name: "Emerald Jungle",
  };
  return createMagmaStore({
    key,
    world,
    generate,
    fresh: (r) => ({
      ladders: r ? r.ladders.map((l) => ({ rungs: l.start.map((x) => [...x]), added: 0 })) : [],
      active: 0,
      sel: r ? [0] : [],
      pending: null,
      misses: 0,
      wrong: null,
      claimFails: 0,
      common: null,
      called: null,
      hit: null,
      last: null,
      picker: null,
      viewFit: fitFor(r),
    }),
    actions: (set, get, api) => {
      const round = () => get().currentRound();
      const L = (li) => round().ladders[li].L;
      const live = () => get().status === "play" && round();

      function addRung(li, rung) {
        const ladders = get().ladders.map((l, k) => (k === li ? { rungs: [...l.rungs, rung], added: l.added + 1 } : l));
        const i = ladders[li].rungs.length - 1;
        set({ ladders, pending: null, wrong: null, picker: null, active: li, sel: [i], last: { at: Date.now(), li, i } });
        return i;
      }

      function used() {
        return get().ladders.reduce((a, l) => a + l.added, 0);
      }

      function afterRung(li, i) {
        const r = round();
        const rung = get().ladders[li].rungs[i];
        const dv = onSide(rung, r.drive);
        if (r.kind === "reach" && dv === r.target) {
          api.award(reachPoints(get().misses) + efficiencyPoints(used(), r.min));
          set({ hit: { li, i } });
          api.endRound();
          return;
        }
        if (r.kind === "compare" && get().common === null) {
          const o = 1 - li;
          if (get().ladders[o].rungs.some((x) => x[0] === rung[0])) {
            api.award(Math.max(4, 10 - 2 * get().misses));
            set({ common: rung[0] });
            api.say(texts.common(r, rung[0]), "good");
            return;
          }
        }
        api.say(texts.hung(r, L(li), rung), "good");
        const full = get().ladders[li].added >= (r.kind === "compare" ? 6 : MAX_NEW_RUNGS);
        if (full && !(r.kind === "compare" && get().common !== null)) {
          api.say(texts.full(r), "warm");
          api.endRound();
        }
      }

      function apply(op, n) {
        const r = round();
        const st = get();
        const li = st.active;
        const lad = r.ladders[li];
        const rungs = st.ladders[li].rungs;
        const def = LADDER_MOVES[op];
        if (st.sel.length !== def.arity) {
          api.say(def.arity === 2 ? texts.pickTwo : texts.pickOne, "warm");
          set({ picker: null });
          return;
        }
        const from = st.sel.map((i) => rungs[i]);
        const res = tryMove(lad.L, r.drive, op, from.map((x) => onSide(x, r.drive)), n, onSide(lad.start[0], r.drive), r.maxDrive);
        set({ picker: null });
        if (!res.ok) {
          api.say(texts.refuse(r, lad.L, res.why, op, n), "warm");
          return;
        }
        const dup = rungs.findIndex((x) => onSide(x, r.drive) === res.value);
        if (dup >= 0) {
          set({ sel: [dup] });
          api.say(texts.dup(r, lad.L, rungs[dup]), "warm");
          return;
        }
        set({
          pending: { li, op, n, value: res.value, partner: res.partner, rung: res.rung, from, misses: 0 },
          note: null,
          wrong: null,
        });
      }

      return {
        select(li, i) {
          if (!live() || get().pending) return;
          const st = get();
          if (li !== st.active) { set({ active: li, sel: [i], picker: null }); return; }
          const sel = st.sel;
          if (sel.includes(i)) set({ sel: sel.filter((x) => x !== i) });
          else set({ sel: sel.length >= 2 ? [sel[1], i] : [...sel, i] });
        },
        setActive(li) {
          if (!live() || get().pending || li === get().active) return;
          const n = get().ladders[li].rungs.length;
          set({ active: li, sel: [n - 1], picker: null });
        },
        choose(op) {
          if (!live() || get().pending) return;
          if (!round().moves.includes(op)) return;
          if (LADDER_MOVES[op].needsN) {
            set({ picker: get().picker === op ? null : op });
            return;
          }
          apply(op);
        },
        pickN(n) {
          const op = get().picker;
          if (!live() || !op) return;
          apply(op, n);
        },
        closePicker() { set({ picker: null }); },
        /** Type the pending rung's partner: "invalid" | "correct" | "wrong". */
        submit(text) {
          const r = round();
          const p = get().pending;
          if (!live() || !p) return "invalid";
          const lad = r.ladders[p.li].L;
          const pSide = other(r.drive);
          const pVine = pSide === "top" ? lad.top : lad.bottom;
          const v = parseVal(pVine.kind, text);
          if (v === null) return "invalid";
          if (v === p.partner) {
            const i = addRung(p.li, p.rung);
            afterRung(p.li, i);
            return "correct";
          }
          // A wrong partner: the rung hangs CROOKED (it leans to where that
          // number really sits); adding the same amount unties the zero.
          const src = p.from.length === 1 ? p.from[0] : null;
          const addv = src ? additivePartner(lad, r.drive, src, p.value) : null;
          const additive = addv !== null && addv !== p.partner && v === addv;
          const untie = additive ? untiedZero([onSide(src, r.drive), onSide(src, pSide)], [p.value, v]) : null;
          set({
            misses: get().misses + 1,
            pending: { ...p, misses: p.misses + 1 },
            wrong: { at: Date.now(), li: p.li, value: p.value, typed: v, additive, untie, src },
          });
          if (additive) api.say(texts.additive(r, lad, src, p, v), "bad");
          else if (p.misses + 1 >= 2) api.say(texts.hint(r, lad, partnerHint(lad, r.drive, p.op, p.from, p.n, r.ladders[p.li].start[0])), "bad");
          else api.say(texts.wrong(r, lad, p, v), "bad");
          return "wrong";
        },
        cancel() {
          if (!get().pending) return;
          set({ pending: null, wrong: null });
        },
        undo() {
          const st = get();
          if (!live() || st.pending || st.common !== null) return;
          const li = st.active;
          const l = st.ladders[li];
          if (l.added <= 0) return;
          const ladders = st.ladders.map((x, k) => (k === li ? { rungs: x.rungs.slice(0, -1), added: x.added - 1 } : x));
          set({ ladders, sel: [ladders[li].rungs.length - 1], wrong: null, picker: null });
        },
        /** "That's the smallest swap!" (smallest rounds). */
        claim() {
          const r = round();
          if (!live() || r.kind !== "smallest" || get().pending) return;
          const rungs = get().ladders[0].rungs;
          const ok = rungs.some((x) => x[0] === r.smallest[0] && x[1] === r.smallest[1]);
          if (!ok) {
            set({ claimFails: get().claimFails + 1 });
            const small = rungs.reduce((m, x) => (x[0] < m[0] ? x : m), rungs[0]);
            api.say(texts.notSmallest(r, small), "bad");
            return;
          }
          const hitI = rungs.findIndex((x) => x[0] === r.smallest[0]);
          api.award(Math.max(4, reachPoints(get().misses) - 5 * get().claimFails) + efficiencyPoints(used(), r.min, 1));
          set({ hit: { li: 0, i: hitI } });
          api.endRound();
        },
        /** Pick the better stall (compare rounds). */
        call(i) {
          const r = round();
          if (!live() || r.kind !== "compare" || get().pending) return;
          if (get().common === null) {
            api.say(texts.needCommon(r), "warm");
            return;
          }
          set({ called: i });
          if (i === r.better) api.award(15);
          api.endRound();
        },
      };
    },
  });
}

export { vineChip };
