import { createMagmaStore } from "../magma/createMagmaStore.js";
import { getJungleChallenge } from "../../data/jungle/jungleChallenges.js";
import {
  JUNGLE_ROUNDS_PER_SET, JUNGLE_POINTS_PER_ROUND, readJungleBest, writeJungleBest,
} from "../../data/jungle/jungleRecords.js";
import {
  LADDER_MOVES, tryMove, parseVal, onSide, other, vineOn, additivePartner, untiedZero, partnerHint, partnerOf,
  accuracyPoints, partialPoints, MAX_NEW_RUNGS, vineChip, vineApprox, fmtVal,
} from "../../data/jungle/vineLadder.js";

/**
 * THE VINE-LADDER STORE — every Emerald Jungle challenge shares this round
 * machinery (on top of the Magma lifecycle: idle → intro → play →
 * celebrate | feedback → done).
 *
 * A ROUND is a short list of PHASES, done in order:
 *   build     hang a rung at every goal ({ li, target } on a ladder's DRIVE
 *             vine) — any route, any moves
 *   common    build two ladders (sharing their top vine) to the SAME amount
 *   call      pick one of a few options (the better stall, the faster
 *             racer, "same colour?", "the ladder works") — `final` calls end
 *             the round either way; a non-final wrong call is a mistake and
 *             the round carries on (the scene shows why)
 *   type      type one number (the across number, a scale, a total)
 *   smallest  split a big rung down to the smallest one, then claim it
 *
 * Every new rung: the SCENE places the drive end, the student TYPES the
 * partner. A wrong partner hangs crooked (or unties the zero) and is a
 * MISTAKE. Scoring is ACCURACY ONLY (Jeff, 2026-10-10): 25 a round, −4 a
 * mistake, never below 9 when the final answer is right — however many
 * rungs the student used to get there. Each mistake is written down
 * (`slips`) so the round card can say exactly what slipped.
 *
 * State: ladders[li].rungs ([top, bottom] in base units), phase, active
 * ladder, selected rung(s), a PENDING rung (scene placed, partner unknown),
 * the last WRONG try (crooked rung / untied zero / the scene's own
 * consequence when it was a goal rung), hits (goal rungs reached), common,
 * called, across (the tape's across move unlocked).
 *
 * Verbs: select(li, i) · setActive(li) · choose(op) · pickN(n) ·
 * submit(text) · cancel() · undo() · remove() · claim() · call(i).
 * `texts` (per challenge) words the refusals and the verdicts kindly; any
 * text left out falls back to the generic wording below.
 */

// Half-width (m) the camera must show: the vines + the stall, plus the vine
// NAME chips that hang left of the zero post (wide on a 4:3 screen).
const fitFor = (r, meta) => {
  if (r && r.viewFit) return r.viewFit;
  const base = meta && meta.view ? meta.view.fit : 7.4;
  return r && r.ladders.length > 1 && r.layout !== "chain" ? Math.max(base, 7.6) : base;
};

export const driveOf = (r, li) => (r.ladders[li] && r.ladders[li].drive) || r.drive || "top";
/** The drive in a given phase (a phase may lead with the other vine). */
export const driveAt = (r, phase, li) => (r && r.phases[phase] && r.phases[phase].drive) || driveOf(r, li);

/** The ladders the student can build on in a phase. */
export function workLadders(r, ph) {
  if (!ph) return [];
  if (ph.ladders) return ph.ladders;
  if (ph.type === "build") return [...new Set(ph.goals.map((g) => g.li))];
  if (ph.type === "common") return [0, 1];
  if (ph.type === "smallest") return [ph.li || 0];
  return [];
}

const nice = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : String(Math.round(x * 10) / 10));

/** Generic, kind wording — each challenge overrides what it likes. */
function defaultTexts() {
  return {
    pickOne: "Tap ONE rung for that move.",
    pickTwo: "Tap TWO rungs for that move.",
    refuse(r, L, why, op, n, drive) {
      const dv = vineOn(L, drive), pv = vineOn(L, other(drive));
      if (why === "drive-part") {
        if (dv.kind === "count") return `That makes part of a ${dv.one} — only WHOLE ${dv.many} here. Try another move!`;
        if (dv.kind === "money") return "That's part of a cent — try a different move.";
        return `That number is too fiddly for this vine — try another move.`;
      }
      if (why === "partner-part") {
        if (pv.kind === "count") return `That would need part of a ${pv.one} on the other vine — try another move!`;
        if (pv.kind === "money") return "That price doesn't come out in whole cents — try a friendlier piece!";
        return "The other vine's number would be too fiddly there — try a friendlier piece!";
      }
      if (why === "too-big") return "That's off the end of the vine! Try a smaller move.";
      if (why === "same") return "Those two rungs are the same — pick two different ones.";
      return "Tap a rung first.";
    },
    dup: (r, L, rung) => `You already have ${vineChip(L.top, rung[0])} ↔ ${vineChip(L.bottom, rung[1])} — it's selected.`,
    hung: (r, L, rung) => `${vineChip(L.top, rung[0])} ↔ ${vineChip(L.bottom, rung[1])} ✓`,
    goal: (r, L, rung) => `🎯 ${vineChip(L.top, rung[0])} ↔ ${vineChip(L.bottom, rung[1])} — you reached it!`,
    common: (r, v) => `Both ladders reach ${vineChip(r.ladders[0].L.top, v)} — now compare them.`,
    full: () => "This vine is full of rungs — tap a rung and ✂ Remove it (or ↩ Undo) to make room.",
    additive(r, L, src, p, v, drive) {
      const ps = other(drive);
      return `Adding the same amount to both slides the ${vineOn(L, ps).many} vine off zero! Whatever you do to one vine, do it to the other.`;
    },
    wrong(r, L, p, v, drive) {
      const ps = other(drive);
      const at = drive === "top" ? (v * L.a) / L.b : (v * L.b) / L.a;
      return `Crooked rung! ${vineChip(vineOn(L, ps), v)} belongs under ${vineApprox(vineOn(L, drive), at)}, not ${vineChip(vineOn(L, drive), p.value)}. Try again.`;
    },
    hint: (r, L, h) => `Look at the other vine: work out ${h}.`,
    notSmallest: (r, small, L) => `${vineChip(L.top, small[0])} ↔ ${vineChip(L.bottom, small[1])} can still split into equal pieces — keep going!`,
    needCommon: () => "First build BOTH ladders to the same amount — then compare.",
    typeWrong: (r, ph, v) => `Not quite — ${ph.slipName || "check it"} again.`,
    typeRight: (r, ph) => ph.right || "✓",
    callRight: (r, ph) => ph.right || "✓ Yes!",
    callWrong: (r, ph) => ph.wrong || "Not this time — look again.",
    acrossLocked: () => "Find the across number first.",
    noGoalHere: () => "Across jumps straight to the 🎯 target — tap the ladder that has one.",
  };
}

export function createLadderStore({ key, generate, texts: own = {} }) {
  const texts = { ...defaultTexts(), ...own };
  const meta = getJungleChallenge(key);
  const world = {
    meta,
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
    fresh: (r) => {
      const ph0 = r ? r.phases[0] : null;
      const work = r ? workLadders(r, ph0) : [];
      const li0 = work.length ? work[0] : 0;
      return {
        ladders: r ? r.ladders.map((l) => ({ rungs: l.start.map((x) => [...x]), added: 0 })) : [],
        phase: 0,
        active: li0,
        sel: r && r.ladders[li0] ? [r.ladders[li0].start.length - 1] : [],
        pending: null,
        misses: 0,
        slips: [],
        wrong: null,
        hits: [],
        common: null,
        called: null,
        calls: [],
        typed: [],
        across: Boolean(r && r.acrossFree),
        picker: null,
        last: null,
        trial: null,
        viewFit: fitFor(r, meta),
      };
    },
    actions: (set, get, api) => {
      const round = () => get().currentRound();
      const ph = () => { const r = round(); return r ? r.phases[get().phase] : null; };
      const live = () => get().status === "play" && round();
      const drv = (li) => driveAt(round(), get().phase, li);
      const Lof = (li) => round().ladders[li].L;

      function mistake(text) {
        set({ misses: get().misses + 1, slips: [...get().slips, text] });
      }

      function finish(ok) {
        const r = round();
        const m = get().misses;
        const pts = ok ? accuracyPoints(m) : (r.partial === 0 ? 0 : get().phase > 0 ? partialPoints(m, r.partial ?? 10) : 0);
        api.award(pts);
        api.endRound({ ok });
      }

      function enterPhase(i) {
        const r = round();
        if (i >= r.phases.length) { finish(true); return; }
        const p = r.phases[i];
        // A goal the student already hung on the way (any route!) counts.
        if (p.type === "build") {
          const d = (li) => driveAt(r, i, li);
          const have = p.goals.filter((g) => get().ladders[g.li].rungs.some((x) => onSide(x, d(g.li)) === g.target));
          if (have.length) {
            const add = have
              .map((g) => ({ li: g.li, t: get().ladders[g.li].rungs.find((x) => onSide(x, d(g.li)) === g.target)[0] }))
              .filter((h) => !get().hits.some((k) => k.li === h.li && k.t === h.t));
            set({ hits: [...get().hits, ...add] });
          }
          if (have.length === p.goals.length) {
            set({ phase: i });
            if (p.say) api.say(p.say, "good");
            enterPhase(i + 1);
            return;
          }
        }
        const work = workLadders(r, p);
        const patch = { phase: i, picker: null, pending: null, wrong: null };
        if (work.length) {
          const li = work.includes(get().active) ? get().active : work[0];
          patch.active = li;
          patch.sel = [get().ladders[li].rungs.length - 1];
        }
        if (p.type === "build" && r.viewFitPhase && r.viewFitPhase[i]) patch.viewFit = r.viewFitPhase[i];
        set(patch);
        if (p.say) api.say(p.say, "good");
      }
      const advance = () => enterPhase(get().phase + 1);

      function goalsOf(p) {
        return p && p.type === "build" ? p.goals : [];
      }
      function goalDone(g) {
        return get().ladders[g.li].rungs.some((x) => onSide(x, drv(g.li)) === g.target);
      }
      /** The goal (if any) a drive value on ladder li is. */
      function goalAt(li, value) {
        return goalsOf(ph()).find((g) => g.li === li && g.target === value) || null;
      }

      function addRung(li, rung, how) {
        const ladders = get().ladders.map((l, k) => (k === li ? { rungs: [...l.rungs, rung], added: l.added + 1, how: [...(l.how || []), how] } : l));
        const i = ladders[li].rungs.length - 1;
        set({ ladders, pending: null, wrong: null, picker: null, active: li, sel: [i], last: { at: Date.now(), li, i }, trial: null });
        return i;
      }

      function afterRung(li, i) {
        const r = round();
        const p = ph();
        const rung = get().ladders[li].rungs[i];
        const dv = onSide(rung, drv(li));
        if (p.type === "build") {
          const g = goalAt(li, dv);
          if (g) {
            set({ hits: [...get().hits, { li, t: rung[0] }] });
            if (goalsOf(p).every(goalDone)) {
              api.say(texts.goal(r, Lof(li), rung, g), "good");
              advance();
              return;
            }
            api.say(texts.goal(r, Lof(li), rung, g), "good");
            const next = goalsOf(p).find((x) => !goalDone(x));
            if (next && next.li !== li) set({ active: next.li, sel: [get().ladders[next.li].rungs.length - 1] });
            return;
          }
        }
        if (p.type === "common" && get().common === null) {
          const o = li === 0 ? 1 : 0;
          if (get().ladders[o].rungs.some((x) => x[0] === rung[0])) {
            set({ common: rung[0] });
            api.say(texts.common(r, rung[0]), "good");
            advance();
            return;
          }
        }
        api.say(texts.hung(r, Lof(li), rung), "good");
      }

      function place(li, value, partner, rungArr, op, n, from) {
        set({
          pending: { li, op, n, value, partner, rung: rungArr, from, misses: 0, goal: Boolean(goalAt(li, value)) },
          wrong: null,
          picker: null,
          trial: null,
        });
      }

      function apply(op, n) {
        const r = round();
        const st = get();
        const li = st.active;
        const lad = r.ladders[li];
        const d = drv(li);
        const rungs = st.ladders[li].rungs;
        if (st.ladders[li].added >= MAX_NEW_RUNGS) {
          set({ picker: null });
          api.say(texts.full(r), "warm");
          return;
        }
        if (op === "across") {
          set({ picker: null });
          if (!st.across) { api.say(texts.acrossLocked(r), "warm"); return; }
          const g = goalsOf(ph()).find((x) => x.li === li && !goalDone(x));
          if (!g) { api.say(texts.noGoalHere(r), "warm"); return; }
          const partner = partnerOf(lad.L, d, g.target);
          const rungArr = d === "top" ? [g.target, partner] : [partner, g.target];
          place(li, g.target, partner, rungArr, "across", undefined, [rungs[0]]);
          return;
        }
        const def = LADDER_MOVES[op];
        if (st.sel.length !== def.arity) {
          api.say(def.arity === 2 ? texts.pickTwo : texts.pickOne, "warm");
          set({ picker: null });
          return;
        }
        const from = st.sel.map((i) => rungs[i]);
        const res = tryMove(lad.L, d, op, from.map((x) => onSide(x, d)), n, onSide(lad.start[0], d), r.maxDrive);
        set({ picker: null });
        if (!res.ok) {
          api.say(texts.refuse(r, lad.L, res.why, op, n, d), "warm");
          return;
        }
        const dup = rungs.findIndex((x) => onSide(x, d) === res.value);
        if (dup >= 0) {
          set({ sel: [dup] });
          // Already hung — and it's a target? Then it's reached.
          if (goalAt(li, res.value) && !get().hits.some((h) => h.li === li && h.t === rungs[dup][0])) {
            afterRung(li, dup);
            return;
          }
          api.say(texts.dup(r, lad.L, rungs[dup]), "warm");
          return;
        }
        place(li, res.value, res.partner, res.rung, op, n, from);
      }

      const workNow = () => workLadders(round(), ph());

      return {
        select(li, i) {
          if (!live() || get().pending) return;
          if (!workNow().includes(li)) return;
          const st = get();
          if (li !== st.active) { set({ active: li, sel: [i], picker: null }); return; }
          const sel = st.sel;
          if (sel.includes(i)) set({ sel: sel.filter((x) => x !== i) });
          else set({ sel: sel.length >= 2 ? [sel[1], i] : [...sel, i] });
        },
        setActive(li) {
          if (!live() || get().pending || li === get().active || !workNow().includes(li)) return;
          const n = get().ladders[li].rungs.length;
          set({ active: li, sel: [n - 1], picker: null });
        },
        choose(op) {
          if (!live() || get().pending) return;
          if (!round().moves.includes(op)) return;
          if (!workNow().length) return;
          if (LADDER_MOVES[op] && LADDER_MOVES[op].needsN) {
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
        /**
         * Type a number: the pending rung's partner, or a "type" phase's
         * answer → "invalid" | "correct" | "wrong".
         */
        submit(text) {
          const r = round();
          if (!live()) return "invalid";
          const p0 = ph();
          if (p0 && p0.type === "type") {
            const v = parseVal(p0.vine, text);
            if (v === null) return "invalid";
            if (v === p0.answer) {
              set({ typed: [...get().typed, { phase: get().phase, v }], wrong: null });
              if (p0.unlock === "across") set({ across: true });
              api.say(texts.typeRight(r, p0), "good");
              advance();
              return "correct";
            }
            mistake(`${p0.slipName || p0.ask}: ${fmtVal(p0.vine, v)} — it's ${fmtVal(p0.vine, p0.answer)}`);
            set({ wrong: { at: Date.now(), type: true, typed: v } });
            api.say(texts.typeWrong(r, p0, v), "bad");
            return "wrong";
          }
          const p = get().pending;
          if (!p) return "invalid";
          const lad = Lof(p.li);
          const d = drv(p.li);
          const pSide = other(d);
          const pVine = vineOn(lad, pSide);
          const dVine = vineOn(lad, d);
          const v = parseVal(pVine, text);
          if (v === null) return "invalid";
          if (v === p.partner) {
            const i = addRung(p.li, p.rung, { op: p.op, n: p.n, from: p.from });
            afterRung(p.li, i);
            return "correct";
          }
          // A wrong partner: the rung hangs CROOKED (it leans to where that
          // number really sits); adding the same amount unties the zero.
          const src = p.from && p.from.length === 1 && p.op !== "across" ? p.from[0] : null;
          const addv = src ? additivePartner(lad, d, src, p.value) : null;
          const additive = addv !== null && addv !== p.partner && v === addv;
          const untie = additive ? untiedZero([onSide(src, d), onSide(src, pSide)], [p.value, v]) : null;
          mistake(`${vineChip(dVine, p.value)} ↔ ${vineChip(pVine, v)}${additive ? " (the same added to both)" : ""} — it's ${vineChip(pVine, p.partner)}`);
          set({
            pending: { ...p, misses: p.misses + 1 },
            wrong: { at: Date.now(), li: p.li, value: p.value, typed: v, additive, untie, src, goal: p.goal },
            trial: p.goal ? { at: Date.now(), li: p.li, value: p.value, typed: v, right: p.partner } : null,
          });
          if (additive) api.say(texts.additive(r, lad, src, p, v, d), "bad");
          else if (p.misses + 1 >= 2) api.say(texts.hint(r, lad, partnerHint(lad, d, p.op, p.from, p.n, r.ladders[p.li].start[0], p0 && p0.k)), "bad");
          else api.say(texts.wrong(r, lad, p, v, d), "bad");
          return "wrong";
        },
        cancel() {
          if (!get().pending) return;
          set({ pending: null, wrong: null, trial: null });
        },
        undo() {
          const st = get();
          if (!live() || st.pending) return;
          const li = st.active;
          const l = st.ladders[li];
          if (!l || l.added <= 0) return;
          const last = l.rungs[l.rungs.length - 1];
          if (st.hits.some((h) => h.li === li && h.t === last[0])) return; // a reached goal stays
          if (st.common !== null && last[0] === st.common) return;
          const ladders = st.ladders.map((x, k) => (k === li ? { rungs: x.rungs.slice(0, -1), added: x.added - 1, how: (x.how || []).slice(0, -1) } : x));
          set({ ladders, sel: [ladders[li].rungs.length - 1], wrong: null, picker: null });
        },
        /** Take the selected rung off the vine (not a starting rung, not a reached goal). */
        remove() {
          const st = get();
          if (!live() || st.pending || st.sel.length !== 1) return;
          const r = round();
          const li = st.active;
          const i = st.sel[0];
          const nStart = r.ladders[li].start.length;
          if (i < nStart) { api.say("That rung came with the round — it stays.", "warm"); return; }
          const rung = st.ladders[li].rungs[i];
          if (st.hits.some((h) => h.li === li && h.t === rung[0]) || (st.common !== null && rung[0] === st.common)) {
            api.say("That's a rung you reached — it stays.", "warm");
            return;
          }
          const ladders = st.ladders.map((x, k) => {
            if (k !== li) return x;
            const how = (x.how || []).filter((_, j) => j !== i - nStart);
            return { rungs: x.rungs.filter((_, j) => j !== i), added: x.added - 1, how };
          });
          set({ ladders, sel: [ladders[li].rungs.length - 1], wrong: null, picker: null });
        },
        /** "That's the smallest!" (smallest phases). */
        claim() {
          const r = round();
          const p = ph();
          if (!live() || !p || p.type !== "smallest" || get().pending) return;
          const li = p.li || 0;
          const rungs = get().ladders[li].rungs;
          const ok = rungs.some((x) => x[0] === p.smallest[0] && x[1] === p.smallest[1]);
          if (!ok) {
            const small = rungs.reduce((m, x) => (x[0] < m[0] ? x : m), rungs[0]);
            mistake(`said "smallest" at ${vineChip(Lof(li).top, small[0])} ↔ ${vineChip(Lof(li).bottom, small[1])} — it could still split`);
            api.say(texts.notSmallest(r, small, Lof(li)), "bad");
            return;
          }
          set({ hits: [...get().hits, { li, t: p.smallest[0] }] });
          advance();
        },
        /** Pick an option in a "call" phase. */
        call(i) {
          const r = round();
          const p = ph();
          if (!live() || get().pending) return;
          if (!p || p.type !== "call") {
            if (p && p.type === "common") api.say(texts.needCommon(r), "warm");
            return;
          }
          const calls = [...get().calls, { phase: get().phase, i }];
          if (i === p.correct) {
            set({ called: i, calls });
            api.say(texts.callRight(r, p), "good");
            advance();
            return;
          }
          if (p.final) {
            set({ called: i, calls });
            finish(false);
            return;
          }
          mistake(`${p.slipName || "called"} "${p.options[i].label}" — it's "${p.options[p.correct].label}"`);
          set({ called: p.correct, calls, wrong: { at: Date.now(), call: i } });
          api.say(texts.callWrong(r, p, i), "bad");
          advance();
        },
        /** Enter mid-round: nothing (the card's own boxes handle Enter). */
        onEnter() {},
      };
    },
  });
}

export { vineChip };
