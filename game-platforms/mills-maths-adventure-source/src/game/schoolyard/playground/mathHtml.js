/**
 * Maths typesetting for Playground question HTML.
 *
 * The question banks (shared with the website quizzes) write a square root as
 * plain text: `√(24² + 10²)` or `√169`. Read on screen, the brackets make it
 * look as if the root covers only the opening bracket. This turns every root
 * into a drawn radical whose bar runs over the WHOLE radicand, and drops the
 * grouping brackets (the bar does their job):
 *
 *   √( … )      → radical over everything up to the matching ")"
 *   √169, √x    → radical over the number / single letter / <i>x</i>
 *
 * Applied at render time in PlaygroundVeil (prompt, "why" line, MC options),
 * so every bank — including ones ported later — gets it without edits.
 */

const TICK =
  '<svg class="rad-tick" viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true">' +
  '<path d="M0.5 12.5 L3 11 L6 19.5 L10 0.6" fill="none" stroke="currentColor" ' +
  'stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>';

const wrap = (body) =>
  `<span class="rad" role="math" aria-label="square root of ${stripTags(body)}">${TICK}<span class="rad-body">${body}</span></span>`;

function stripTags(s) {
  return String(s).replace(/<[^>]*>/g, "").replace(/"/g, "");
}

// Simple operand after √ with no brackets: a number, an <i>x</i>, or a letter.
const SIMPLE = /^(?:[0-9]+(?:[  ,][0-9]{3})*(?:\.[0-9]+)?(?:<sup>[^<]*<\/sup>)?|<i>[^<]*<\/i>|[A-Za-z](?![A-Za-z])(?:<sup>[^<]*<\/sup>)?)/;

export function radicals(html) {
  if (html == null) return html;
  const s = String(html);
  if (s.indexOf("√") < 0) return s;
  let out = "";
  let i = 0;
  while (i < s.length) {
    const k = s.indexOf("√", i);
    if (k < 0) { out += s.slice(i); break; }
    out += s.slice(i, k);
    let j = k + 1;
    // skip whitespace between √ and its operand
    while (s[j] === " ") j++;
    if (s[j] === "(") {
      // find the matching ")" — tags never contain brackets, so a plain count works
      let depth = 0, end = -1;
      for (let p = j; p < s.length; p++) {
        if (s[p] === "(") depth++;
        else if (s[p] === ")") { depth--; if (depth === 0) { end = p; break; } }
      }
      if (end > 0) {
        out += wrap(radicals(s.slice(j + 1, end)));
        i = end + 1;
        continue;
      }
    } else {
      const m = SIMPLE.exec(s.slice(j));
      if (m) {
        out += wrap(m[0]);
        i = j + m[0].length;
        continue;
      }
    }
    // Nothing recognisable after it — leave the sign as text.
    out += "√";
    i = k + 1;
  }
  return out;
}
