/**
 * THE VINE LADDER — the shared maths behind every Emerald Jungle challenge
 * (pure: no React, no stores). The vine ladder is the jungle's DOUBLE NUMBER
 * LINE: two vines, each ONE quantity in its own unit, KNOTTED TOGETHER AT
 * ZERO, with bamboo RUNGS linking matching pairs (3 bananas ↔ 2 mangoes).
 *
 * PEDAGOGY (see the project doc "emerald-jungle-challenges-plan.md"):
 *   - a ratio is a COMPOSED UNIT you can repeat (Lamon; Lobato & Ellis) —
 *     "again" adds another copy of the starting rung;
 *   - scaling ALONG the vines first (double, halve, × 10, split into equal
 *     pieces, join two rungs) — ICCAMS found along-the-line reasoning far
 *     easier than the between-the-lines multiplier (Küchemann, Hodgen &
 *     Brown 2014), so the early challenges live here;
 *   - the zero tie is what makes it proportional: a student who ADDS the
 *     same amount to both vines is caught and SHOWN the vine sliding off
 *     its zero ("now 0 mangoes sits under 1 banana") — Hart's / Karplus's
 *     additive strategy, made visible.
 *
 * Every quantity is an INTEGER in its vine's base unit (whole fruit, cents,
 * grams), so there is never any float dust: a move that would make half a
 * banana or a third of a cent is refused (and that refusal is itself a
 * lesson — "try a friendlier piece").
 *
 *   L = { top: VINE, bottom: VINE, a, b }   a top-units ↔ b bottom-units
 *   VINE = { kind: "count" | "money" | "kg", icon, one, many }
 *   drive = "top" | "bottom" — the vine the SCENE fills in; the student
 *           types the partner on the other vine.
 */
import { parseWhole, parseThousandths, fmtThousandths } from "../magma/magmaMath.js";

// ---------------------------------------------------------------------------
// Units: formatting + reading what a student types.
// ---------------------------------------------------------------------------

/** Cents → "$17.50" (whole dollars → "$10"). */
export function fmtMoney(c) {
  const neg = c < 0;
  const a = Math.abs(c);
  const d = Math.floor(a / 100);
  const cc = a % 100;
  const s = cc ? `$${d}.${String(cc).padStart(2, "0")}` : `$${d}`;
  return neg ? `−${s}` : s;
}

/** Grams → "1.5 kg". */
export function fmtKg(g) {
  return `${fmtThousandths(g)} kg`;
}

/** A vine value in its own unit, as a student reads it ("21", "$2.50", "1.5 kg"). */
export function fmtVal(kind, v) {
  if (kind === "money") return fmtMoney(v);
  if (kind === "kg") return fmtKg(v);
  return String(v);
}

/** The plain number a student thinks in (dollars, kilograms, items). */
export function dispNum(kind, v) {
  if (kind === "money") return v / 100;
  if (kind === "kg") return v / 1000;
  return v;
}
/** …and back to base units (rounded — only used for whole-unit maths). */
export function fromDisp(kind, n) {
  if (kind === "money") return Math.round(n * 100);
  if (kind === "kg") return Math.round(n * 1000);
  return Math.round(n);
}

/** "$17.50", "17.5", "17", "$17", "1750c", "17.50 dollars" → cents (or null). */
export function parseMoney(text) {
  let t = String(text ?? "").trim().toLowerCase().replace(/dollars?$/, "").replace(/\s+/g, "");
  if (/^\d+c$/.test(t)) return Number(t.slice(0, -1));
  t = t.replace(/^\$/, "").replace(/,/g, "");
  if (t.startsWith(".")) t = "0" + t;
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const [w, f = ""] = t.split(".");
  return Number(w) * 100 + Number((f + "00").slice(0, 2));
}

/** "1.5", "1.5kg", "1.50 kg" → grams (or null). */
export function parseKg(text) {
  const t = String(text ?? "").trim().toLowerCase().replace(/\s*(kg|kilos?|kilograms?)$/, "");
  return parseThousandths(t);
}

/** Read a typed value for a vine kind → base units, or null if unreadable. */
export function parseVal(kind, text) {
  if (kind === "money") return parseMoney(text);
  if (kind === "kg") {
    const v = parseKg(text);
    return v === null || v < 0 ? null : v;
  }
  const v = parseWhole(text);
  return v === null || v < 0 ? null : v;
}

/** "3 bananas" / "1 banana" / "$2.50" / "1.5 kg of grapes". */
export function vineText(vine, v) {
  if (vine.kind === "money") return fmtMoney(v);
  if (vine.kind === "kg") return `${fmtKg(v)}${vine.many ? ` of ${vine.many}` : ""}`;
  return `${v} ${v === 1 ? vine.one : vine.many}`;
}
/** Short label for a chip: "21 🍌", "$2.50", "1.5 kg". */
export function vineChip(vine, v) {
  if (vine.kind === "count") return `${v} ${vine.icon}`;
  return fmtVal(vine.kind, v);
}

// ---------------------------------------------------------------------------
// The ladder itself.
// ---------------------------------------------------------------------------

export const other = (side) => (side === "top" ? "bottom" : "top");

/** The partner of value v on the `drive` vine (an integer, or null if it isn't whole). */
export function partnerOf(L, drive, v) {
  const num = drive === "top" ? v * L.b : v * L.a;
  const den = drive === "top" ? L.a : L.b;
  return num % den === 0 ? num / den : null;
}

/** A rung [top, bottom] from a drive value (null if the partner isn't whole). */
export function rungFor(L, drive, v) {
  const p = partnerOf(L, drive, v);
  if (p === null) return null;
  return drive === "top" ? [v, p] : [p, v];
}

/** Value of a rung on a side. */
export const onSide = (rung, side) => (side === "top" ? rung[0] : rung[1]);

/**
 * The moves. `again` adds another copy of the STARTING rung (the composed
 * unit), the rest are the moves students trust: double, halve, × 10, ÷ 10,
 * split into n equal pieces, stretch × n, join two rungs, the gap between two.
 */
export const LADDER_MOVES = {
  again: { arity: 1, label: "Again" },
  x2: { arity: 1, label: "× 2" },
  h2: { arity: 1, label: "÷ 2" },
  x10: { arity: 1, label: "× 10" },
  d10: { arity: 1, label: "÷ 10" },
  split: { arity: 1, label: "✂ Split", needsN: true },
  times: { arity: 1, label: "✖ Times", needsN: true },
  join: { arity: 2, label: "+ Join" },
  gap: { arity: 2, label: "− Gap" },
};
export const SPLIT_CHOICES = [2, 3, 4, 5, 6, 8, 10, 12];
export const TIMES_CHOICES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12];

/** The new DRIVE value a move makes (null if it isn't a positive whole number of base units). */
export function moveValue(op, a, b, n, base) {
  let v;
  if (op === "again") v = a + base;
  else if (op === "x2") v = a * 2;
  else if (op === "h2") v = a / 2;
  else if (op === "x10") v = a * 10;
  else if (op === "d10") v = a / 10;
  else if (op === "split") v = n ? a / n : NaN;
  else if (op === "times") v = n ? a * n : NaN;
  else if (op === "join") v = b === undefined ? NaN : a + b;
  else if (op === "gap") v = b === undefined ? NaN : Math.abs(a - b);
  else v = NaN;
  return Number.isInteger(v) && v > 0 ? v : null;
}

/**
 * Try a move on a ladder. `from` = drive values of the selected rung(s),
 * `base` = the starting rung's drive value (for "again").
 *   → { ok: true, value, partner, rung }  or  { ok: false, why }
 *   why: "drive-part" (not a whole drive unit) · "partner-part" (the
 *        partner wouldn't be whole) · "too-big" · "same" (gap of equal rungs)
 *        · "pick" (wrong number of rungs selected)
 */
export function tryMove(L, drive, op, from, n, base, maxDrive) {
  const def = LADDER_MOVES[op];
  if (!def) return { ok: false, why: "pick" };
  if (from.length !== def.arity) return { ok: false, why: "pick" };
  if (op === "gap" && from[0] === from[1]) return { ok: false, why: "same" };
  const raw =
    op === "again" ? from[0] + base
      : op === "x2" ? from[0] * 2
        : op === "h2" ? from[0] / 2
          : op === "x10" ? from[0] * 10
            : op === "d10" ? from[0] / 10
              : op === "split" ? from[0] / n
                : op === "times" ? from[0] * n
                  : op === "join" ? from[0] + from[1]
                    : Math.abs(from[0] - from[1]);
  if (!Number.isInteger(raw) || raw <= 0) return { ok: false, why: "drive-part", raw };
  if (raw > maxDrive) return { ok: false, why: "too-big", raw };
  const partner = partnerOf(L, drive, raw);
  if (partner === null) return { ok: false, why: "partner-part", raw };
  return { ok: true, value: raw, partner, rung: drive === "top" ? [raw, partner] : [partner, raw] };
}

/**
 * The ADD-THE-SAME mistake: from a source rung, a student who adds the
 * drive's change straight onto the partner (3 🍌 ↔ 2 🥭, "again" → 6 🍌 ↔ 5
 * 🥭). Computed in the numbers students read (dollars, kg, items). Returns
 * the partner value (base units) that mistake gives, or null.
 */
export function additivePartner(L, drive, src, newDrive) {
  const dv = drive === "top" ? L.top : L.bottom;
  const pv = drive === "top" ? L.bottom : L.top;
  const sD = onSide(src, drive);
  const sP = onSide(src, other(drive));
  const delta = dispNum(dv.kind, newDrive) - dispNum(dv.kind, sD);
  const p = dispNum(pv.kind, sP) + delta;
  if (p <= 0) return null;
  const v = fromDisp(pv.kind, p);
  return Math.abs(dispNum(pv.kind, v) - p) < 1e-9 ? v : null;
}

/**
 * Where the PARTNER vine's zero would have to sit (as a DRIVE value) for
 * two claimed pairs to both hang straight — the "untied zero". For an
 * additive mistake on 3 ↔ 2 → 6 ↔ 5 this is 1: the mango vine has slid so
 * its 0 sits under 1 banana.
 */
export function untiedZero(srcPair, newPair) {
  // pairs are [drive, partner] in the SAME units as the vines are scaled
  // (the caller converts the partner into drive-equivalent units first).
  const [d1, p1] = srcPair;
  const [d2, p2] = newPair;
  if (p2 === p1) return null;
  return d1 - (p1 * (d2 - d1)) / (p2 - p1);
}

// ---------------------------------------------------------------------------
// The fewest moves (breadth-first over the SET of rungs on the ladder).
// ---------------------------------------------------------------------------

function expand(L, drive, vals, ops, base, maxDrive) {
  const out = [];
  for (let i = 0; i < vals.length; i++) {
    const a = vals[i];
    for (const op of ops) {
      const def = LADDER_MOVES[op];
      if (def.arity !== 1) continue;
      const ns = op === "split" ? SPLIT_CHOICES : op === "times" ? TIMES_CHOICES : [undefined];
      for (const n of ns) {
        const r = tryMove(L, drive, op, [a], n, base, maxDrive);
        if (r.ok && !vals.includes(r.value)) out.push({ op, a, n, v: r.value });
      }
    }
    for (let j = i + 1; j < vals.length; j++) {
      for (const op of ops) {
        if (LADDER_MOVES[op].arity !== 2) continue;
        const r = tryMove(L, drive, op, [vals[i], vals[j]], undefined, base, maxDrive);
        if (r.ok && !vals.includes(r.value)) out.push({ op, a: vals[i], b: vals[j], v: r.value });
      }
    }
  }
  return out;
}

const _cache = new Map();
/**
 * Fewest new rungs that reach drive value `target` from the starting rungs.
 * → { min, path: [{op, a, b?, n?, v}] } (min = 9 if not found within depth).
 */
export function fewestMoves(L, drive, startVals, target, ops, maxDrive, maxDepth = 5) {
  const key = `${L.a}:${L.b}:${drive}:${startVals.join(",")}>${target}|${ops.join(",")}|${maxDrive}`;
  if (_cache.has(key)) return _cache.get(key);
  const base = startVals[0];
  let res = { min: 9, path: [] };
  if (startVals.includes(target)) res = { min: 0, path: [] };
  else {
    let frontier = [{ vals: startVals.slice().sort((x, y) => x - y), path: [] }];
    const seen = new Set([frontier[0].vals.join(",")]);
    outer: for (let depth = 1; depth <= maxDepth; depth++) {
      const next = [];
      for (const st of frontier) {
        for (const m of expand(L, drive, st.vals, ops, base, maxDrive)) {
          if (m.v === target) { res = { min: depth, path: [...st.path, m] }; break outer; }
          if (depth === maxDepth) continue;
          const vals = [...st.vals, m.v].sort((x, y) => x - y);
          const k = vals.join(",");
          if (seen.has(k)) continue;
          seen.add(k);
          next.push({ vals, path: [...st.path, m] });
        }
      }
      frontier = next.length > 5000 ? next.slice(0, 5000) : next;
      if (!frontier.length) break;
    }
  }
  if (_cache.size > 4000) _cache.clear();
  _cache.set(key, res);
  return res;
}

/** Every value reachable in ONE move from a single starting rung (value → step). */
export function oneMoveValues(L, drive, start, ops, maxDrive) {
  const m = new Map();
  for (const s of expand(L, drive, [start], ops, start, maxDrive)) if (!m.has(s.v)) m.set(s.v, s);
  return m;
}

// ---------------------------------------------------------------------------
// Scoring (shared by every vine-ladder challenge; each round is 25).
// ---------------------------------------------------------------------------
export const REACH_POINTS = 15;
export const MISS_PENALTY = 3;
export const REACH_MIN = 6;
export const EFF_POINTS = [10, 6, 3];
export const MAX_NEW_RUNGS = 8;

export function reachPoints(misses) {
  return Math.max(REACH_MIN, REACH_POINTS - MISS_PENALTY * misses);
}
/** Efficiency vs the fewest moves: equal 10 · one more 6 · else 3 (`slack` widens it). */
export function efficiencyPoints(used, min, slack = 0) {
  if (used <= min + slack) return EFF_POINTS[0];
  if (used <= min + slack + 1) return EFF_POINTS[1];
  return EFF_POINTS[2];
}

/** A step written for the worked solution ("× 10 → 30 🍌 ↔ 20 🥭"). */
export function stepText(L, drive, step) {
  const dv = drive === "top" ? L.top : L.bottom;
  const how =
    step.op === "again" ? "+ one more deal"
      : step.op === "x2" ? `double ${fmtVal(dv.kind, step.a)}`
        : step.op === "h2" ? `halve ${fmtVal(dv.kind, step.a)}`
          : step.op === "x10" ? `${fmtVal(dv.kind, step.a)} × 10`
            : step.op === "d10" ? `${fmtVal(dv.kind, step.a)} ÷ 10`
              : step.op === "split" ? `split ${fmtVal(dv.kind, step.a)} into ${step.n}`
                : step.op === "times" ? `${fmtVal(dv.kind, step.a)} × ${step.n}`
                  : step.op === "join" ? `${fmtVal(dv.kind, step.a)} + ${fmtVal(dv.kind, step.b)}`
                    : `${fmtVal(dv.kind, Math.max(step.a, step.b))} − ${fmtVal(dv.kind, Math.min(step.a, step.b))}`;
  const rung = rungFor(L, drive, step.v);
  return `${how} → ${vineChip(L.top, rung[0])} ↔ ${vineChip(L.bottom, rung[1])}`;
}

/** The same move done to the PARTNER (the hint after two misses). */
export function partnerHint(L, drive, op, fromRungs, n, startRung) {
  const ps = other(drive);
  const pv = ps === "top" ? L.top : L.bottom;
  const show = (v) => (pv.kind === "count" ? vineChip(pv, v) : fmtVal(pv.kind, v));
  const f = (r) => show(onSide(r, ps));
  const a = fromRungs[0];
  if (op === "again") return startRung ? `${f(a)} + ${f(startRung)}` : `${f(a)} + one more deal`;
  if (op === "x2") return `double ${f(a)}`;
  if (op === "h2") return `half of ${f(a)}`;
  if (op === "x10") return `${f(a)} × 10`;
  if (op === "d10") return `${f(a)} ÷ 10`;
  if (op === "split") return `${f(a)} ÷ ${n}`;
  if (op === "times") return `${f(a)} × ${n}`;
  if (op === "join") return `${f(a)} + ${f(fromRungs[1])}`;
  const x = onSide(fromRungs[0], ps), y = onSide(fromRungs[1], ps);
  return `${show(Math.max(x, y))} − ${show(Math.min(x, y))}`;
}

export function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}
