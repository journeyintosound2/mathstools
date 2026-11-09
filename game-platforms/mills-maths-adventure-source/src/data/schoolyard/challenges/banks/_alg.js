/**
 * Small shared helpers for the Algebra and Equations banks: build an
 * expression from terms once, get BOTH the plain text the checker reads and
 * the typeset HTML the student sees.
 *
 *   T(3, "x")  T(-2, "ab")  T(5, "")  T(1, "x^2")
 *   expr([T(3,"x"), T(-5,"")]) → { txt: "3x - 5", html: "3<i>x</i> − 5" }
 */
import C from "../questionCore.js";

const MINUS = C.MINUS;
export const T = (c, v = "") => ({ c, v });
export const vh = (v) => String(v).replace(/([a-z])(?:\^(\d+))?/g, (m, l, e) => `<i>${l}</i>${e ? `<sup>${e}</sup>` : ""}`);

function coefTxt(c, v) {
  const a = Math.abs(c);
  if (v && a === 1) return "";
  return C.fmt(a).replace(/\s/g, "");
}
export function expr(terms) {
  const ts = terms.filter((t) => t.c !== 0);
  if (!ts.length) return { txt: "0", html: "0" };
  let txt = "", html = "";
  ts.forEach((t, i) => {
    const neg = t.c < 0;
    const ct = coefTxt(t.c, t.v);
    if (i === 0) { txt += (neg ? "-" : "") + ct + t.v; html += (neg ? MINUS : "") + ct + vh(t.v); }
    else { txt += (neg ? " - " : " + ") + ct + t.v; html += (neg ? ` ${MINUS} ` : " + ") + ct + vh(t.v); }
  });
  return { txt, html };
}
/** Collect like terms (keeps first-seen order). */
export function collect(terms) {
  const m = new Map();
  for (const t of terms) m.set(t.v, (m.get(t.v) || 0) + t.c);
  return [...m].map(([v, c]) => T(c, v)).filter((t) => t.c !== 0);
}
/** A typeset expression in a maths span. */
export const MX = (html) => `<span class="m">${html}</span>`;
/** "3 × (−2)" style substitution: brackets round negatives. */
export const br = (v) => (v < 0 ? `(${C.fmt(v)})` : C.fmt(v));
