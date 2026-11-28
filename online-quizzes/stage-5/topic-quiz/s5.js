/* Mills Maths Tools — Stage 5 whole-topic quizzes: the question layer
   ------------------------------------------------------------------------
   online-quizzes/stage-5/topic-quiz/s5.js   (ES module)

   41 quizzes, one per Stage 5 outcome (13 Core, 28 Path), on the SAME engine as
   the Stage 3 and Stage 4 whole-topic quizzes (online-quizzes/stage-4/topic-quiz/
   core.js + algebra.js + engine.js). Each quiz is a thin shell + banks/<slug>.js,
   which imports the Revision Generator banks its outcome uses and calls
       MMTQ.run(stage5Bank("MA5-ALG-C-01", { "algebraic-techniques-a": mod }, {related}))

   WHERE THE QUESTIONS COME FROM
   The Revision Generator's Stage 5 banks (assessment/exam-builder/question-
   banks/stage-5/*) — the banks behind the Stage 5 whole-topic worksheets. The
   type → outcome → content statement → level map is the worksheets' own
   (tools/whole-topic-worksheets/stage5.py), copied into s5-map.js by a script.
   Levels: Basic = the first steps of each content statement; Expected = the
   whole outcome.

   ONE QUESTION, ONE ANSWER THE COMPUTER CAN MARK
   A Revision Generator question is a prompt, perhaps a picture, and an answer
   STRING written for a marking key. convert() reads that string and decides how
   the student answers:
     a number (with $ or a unit printed beside the box) ......... num
     a point ...................................................... coord
     "x = 5", "t = 1.5 s" ........................................ num, "x =" printed
     "x = −4 or x = 7", "a = ±√39", "1 ± √10" .................. set (every solution)
     "m > 8" ...................................................... ineq
     an expression (expand / factorise / simplify / surds) ....... expr (typed algebra,
                                    marked by value then by form: see algebra.js)
     "y = 2x + 3", "4x + 3y − 23 = 0", "r = C/2π" ............... eqn
     two or three labelled values ("Gradient −5, y-intercept −8") . multi (a box each)
     a table with gaps ............................................ multi (a box per gap)
     "Yes: …", "Perpendicular: …", words ........................ multiple choice — from the
                                    bank's own choices or misconception distractors,
                                    the options the question names, or sibling answers
     a list to put in order ....................................... order
   A multi-part question becomes ONE of its parts, chosen at random. SPEC holds
   the types that need their own wording. Types that only make sense on paper
   (draw, sketch, prove in full) are in PAPER_ONLY and left to the worksheets.
*/
import { OUTCOMES, FN } from "./s5-map.js?v=20b36143";
export { OUTCOMES };

const C = (typeof window !== "undefined" ? window : globalThis).MMTQCore;
const { ri, pick, shuffle, fmt, gcd } = C;
const A = C.alg;

/* ======================= text ======================= */
const ESC = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const FR_HTML = (n, d) => `<span class="fr"><span class="frn">${n}</span><span class="frd">${d}</span></span>`;
/* Revision Generator markup → HTML */
export function RM(v) {
  let s = ESC(v);
  for (let i = 0; i < 3; i++) s = s.replace(/\[\[(?:alg)?frac:([^:\[\]]+):([^:\[\]]+)\]\]/g, (m, n, d) => FR_HTML(n, d));
  return s.replace(/\[\[sup:([^\]]+)\]\]/g, "<sup>$1</sup>").replace(/\[\[sub:([^\]]+)\]\]/g, "<sub>$1</sub>")
    .replace(/(\d) (?=\d{3}\b)/g, "$1 ").replace(/\r?\n/g, "<br>")
    .replace(/[√∛]/g, c => `<span class="rs">${c}</span>`);     // the root sign in the page's own font: in a maths font it hangs below the line
}
const plain = v => String(v == null ? "" : v).replace(/\[\[frac:(-?[^:\]]+):([^:\]]+)\]\]/g, "$1/$2").replace(/[   ]/g, " ").replace(/\s+/g, " ").trim();
const num = s => Number(String(s).replace(/[−–]/g, "-").replace(/[\s, ]/g, ""));
const cap1 = s => (/^[a-z][-′]/.test(s) || /^[a-z] /.test(s) ? s : s.charAt(0).toUpperCase() + s.slice(1));
const normW = s => plain(String(s).replace(/<[^>]*>/g, " ")).toLowerCase().replace(/^(a|an|the)\s+/, "").replace(/[.\s]+$/, "").replace(/\s+/g, " ");
const tableHTML = (t, blanks) => !t || !Array.isArray(t.rows) || !t.rows.length ? "" :
  `${t.caption ? `<div class="sub">${RM(t.caption)}</div>` : ""}<div class="tabWrap"><table class="dtab">${t.rows.map((row, r) =>
    `<tr>${row.map((c, i) => { const blank = String(c).trim() === ""; const tag = (t.headerRow !== false && r === 0) || i === 0 ? "th" : "td"; return `<${tag}${blank && blanks ? ' class="q"' : ""}>${blank && blanks ? "?" : RM(c)}</${tag}>`; }).join("")}</tr>`).join("")}</table></div>`;
/* sentences a screen can't mark: written explanations, working, drawing */
const DROP = [
  /\s*If not,[^.?]*[.?]/gi,
  /\s*Explain(?: how you know| your (?:answer|reasoning)| what this shows[^.?]*)?[.?]/gi, /\s*Give (?:a|two) reasons?(?: for your answer)?[.?]/gi, /\s*Show (?:how you|your working|your check)[^.?]*[.?]/gi,
  /\s*Justify(?: your answer)?[.?]/gi, /,? and explain (?:why|how|what)[^.?]*/gi, /,? giving reasons?/gi, /\s*If not,[^.?]*[.?]/gi, /\s*How reliable is it\?/gi, /\s*Explain, and correct it if necessary[.?]/gi,
  /\s*(?:Hypotenuse|Opposite|Adjacent): _{3,}/g, /\s*Draw a diagram and(?= find)/gi, /\s*Draw a diagram(?: first)?[.,]?/gi, /\s*Draw a grid \(table\) of outcomes and/gi, /(?<=table of values) and graph(?= the)/gi, /,?\s*giving a reason(?: for your answer)?/gi, /\s*Show all (?:your )?working[.?]/gi, /,? and draw it/gi, /,? then graph the solution on the number line/gi
];
function cleanPrompt(p) { let s = String(p || ""); DROP.forEach(r => { s = s.replace(r, ""); }); return s.replace(/\s{2,}/g, " ").replace(/\s+([.?])/g, "$1").replace(/([.?] )(find|calculate|state|write|give|use)\b/g, (_, a, b) => a + cap1(b)).replace(/\? Explain: (.+?)\.$/, ": $1?").trim(); }
const why = q => (q.working || []).map(RM).join(" &nbsp;·&nbsp; ");
const DSCALE = { "plane-engine": 1.05, "nonlinear-engine": 1.05, "trigonometry-engine": 1.1, "statistics-engine": 1.1, "probability-engine": 1.15, "geometry-engine": 1.15, "solids-engine": 1.1, "area-surface-engine": 1.1, "volume-engine": 1.1, "network-engine": 1.0, "algebra-engine": 1.15, "equation-engine": 1.25, "financial-engine": 1.1, "pythagoras-engine": 1.15 };
function diag(q, o = {}) {
  if (!q.diagram || !q.diagram.engine) return null;
  return { engine: q.diagram.engine, config: q.diagram.config || {}, scale: o.scale || DSCALE[q.diagram.engine] || 1.1, maxH: o.maxH || 380, caption: q.diagram.caption || "" };
}
function base(q, o = {}) {
  return { prompt: (o.prompt != null ? o.prompt : RM(cleanPrompt(q.prompt))) + (o.noTable ? "" : tableHTML(q.table, o.blanks)), diagram: o.noDiagram ? null : diag(q, o), why: o.why != null ? o.why : why(q) };
}

/* ======================= reading an answer string ======================= */
/* Revision Generator markup → what algebra.js parses */
export function toExpr(s) {
  let t = String(s == null ? "" : s);
  for (let i = 0; i < 3; i++) t = t.replace(/\[\[(?:alg)?frac:([^:\[\]]+):([^:\[\]]+)\]\]/g, "(($1)/($2))");
  return t.replace(/\[\[sup:([^\]]+)\]\]/g, "^($1)").replace(/[   ]/g, " ").trim();
}
const UNIT = "(?:mm|cm|km|m|kg|mg|g|t|kL|mL|ML|L|ha|h|min|s|ms|years?|months?|weeks?|days?|hours?|minutes?|seconds?|units?|cents?|c|°C|°|%|km\\/h|m\\/s|m\\/min|L\\/min|L\\/h|mL\\/s|\\$\\/h|people|students|litres|metres|tiles|cans|boxes|tickets|items|words|beats|points|runs|goals|marks)";
/* "$3 634.50", "−5°C", "17.3", "6%", "28 cm²", "9 m" → { value, pre, unit } */
function numAns(a) {
  let s = plain(a).replace(/\s+\((?=[^)]*(?:[A-Za-z]{2}|≈|=))[^)]*\)\s*$/, "").replace(/^≈\s*/, "").replace(/^about\s+/i, "");
  s = s.replace(/^([−-]?\s*\$?\s*\d[\d ]*\.\d[\d ]*\d)(?=$|\s*[^\d\s])/, x => x.replace(/(\d) (?=\d)/g, "$1"));       // 0.003 590 2
  if (/\d\s*,\s*\d/.test(s) && !/^\$?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) return null;
  const m = /^([−-])?\s*(\$)?\s*(\d+(?: \d{3})*(?:\.\d+)?|\.\d+)(\s*)(.*)$/.exec(s);
  if (!m) return null;
  const unit = m[5].trim();
  if (m[2] && /^\/[a-zA-Z]+$/.test(unit)) return { value: (m[1] ? -1 : 1) * num(m[3]), pre: "$", unit, money: true, dps: (m[3].split(".")[1] || "").length };   // "$24.00/kg"
  // "9 cm", "6%", "45°" are measurements; "9t", "2b", "8m(5m + 4b)" are algebra (no space before the letter)
  if (unit && !m[4] && !/^(%(?: pa| p\.a\.)?|°C?|c)$/.test(unit)) return null;
  if (unit && !new RegExp("^" + UNIT + "(?:[²³]|\\^[23])?(?:\\/" + UNIT + ")?(?: per [a-z]+)?$").test(unit) && !/^[a-zA-Z°%μ²³/$]{2,}( [a-z]+){0,2}$/.test(unit) && !/^% (pa|p\.a\.)$/.test(unit)) return null;
  let value = num(m[3]); if (m[1]) value = -value;
  if (!isFinite(value)) return null;
  return { value, pre: m[2] ? "$" : "", unit, money: !!m[2], dps: (m[3].split(".")[1] || "").length };
}
const UNIT_SP = new RegExp("^(.*\\S)\\s+(" + UNIT + "(?:[²³]|\\^[23])?(?:\\/" + UNIT + ")?(?: per [a-z]+)?)$");
/* a unit is set off by a space ("6√2 cm"); a letter hard against the number is algebra ("6√2m") */
function stripUnit(s) { const m = UNIT_SP.exec(s) || /^(.*[\d)])(%|°)$/.exec(s); return m ? { body: m[1].trim(), unit: m[2] } : { body: s, unit: "" }; }
const WORDY = /[A-Za-z]{4,}|\b(or|and|is|by|to|of|the|no|yes|not|if|for|when|as|at|in|on|are)\b/i;
const coordAns = a => { const m = /^\((−?-?[\d.]+(?:\/\d+)?), (−?-?[\d.]+(?:\/\d+)?)\)$/.exec(plain(a)); if (!m) return null; const v = x => { const p = x.replace(/[−–]/g, "-").split("/"); return p.length === 2 ? Number(p[0]) / Number(p[1]) : Number(p[0]); }; return { x: v(m[1]), y: v(m[2]) }; };
const tree = s => A.parse(toExpr(s));
const hasSyms = t => A.symbols(t).size > 0;

/* what the prompt asks of an expression */
function exprForm(prompt, ans) {
  const p = plain(prompt).toLowerCase(), o = {};
  const t = tree(ans);
  if (/factoris/.test(p) && !/simplify (?:by|after) factoris|then simplify|simplify\b[^.]*\bfactoris/.test(p) && t && !/expand/.test(p.split("factoris")[0])) o.form = "factor";
  else if (/expand/.test(p) && t && !A.unexpanded(t)) o.form = "expand";
  else o.form = "simplify";
  if (o.form === "factor" && t && !A.sumFactors(t).length && A.termsOf(t).length > 1) o.form = "simplify";
  if (/positive ind/.test(p)) o.posIndex = true;
  if (/negative index|without a fraction|using a negative/.test(p)) o.noFraction = true;
  if (/rationalise/.test(p)) o.ratDenom = true;
  if (/index form|in index notation|as a power of/.test(p)) { if (/[√∛]/.test(prompt) || /index form/.test(p)) o.noRoot = true; }
  const pw = /(?:as a|what) power of (\d+)/.exec(p); if (pw) { o.power = true; o.base = Number(pw[1]); o.form = "any"; }
  if (/entire surd/.test(p)) { o.entire = true; o.form = "any"; }
  if (/√/.test(ans) && !o.entire) o.surd = true;
  if (t && A.unexpanded(t) && o.form === "simplify") o.slack = 3;
  return o;
}
const KEYS = { expr: ["^", "(", ")", "/", "√"], eqn: ["=", "^", "(", ")", "/", "√"], set: ["−", ",", "±", "√", "/"], ineq: ["<", ">", "≤", "≥", "−"] };
const keysFor = (mode, ans) => { let k = KEYS[mode].slice(); if (!/√/.test(ans) && mode !== "set") k = k.filter(x => x !== "√"); if (/π/.test(ans)) k.push("π"); if (mode === "set" && !/[√±]/.test(ans)) k = ["−", ",", "/"]; return k; };

/* One answer string → the fields of a quiz question (mode + what its checker needs), or null. */
function read(ans, prompt, o = {}) {
  let a = String(ans == null ? "" : ans).trim().replace(/\.$/, "");
  const P = plain(prompt), pa = plain(a);
  if (!pa) return null;
  let m;
  // --- "x = …" ---
  if ((m = /^([A-Za-zθΔ])\s*(=|≈)\s*([^=≈]+)$/.exec(a)) && !/,\s*[A-Za-z]\s*=/.test(a)) {
    const v = m[1], rest = m[3].trim();
    if (/\bor\b|±| and /.test(rest)) { const r = readSet(v, rest, m[2] === "≈", P); if (r) return r; }
    const n = numAns(rest);
    if (n) return numQ(n, P, { pre: `<i>${v}</i> =` });
    const su = stripUnit(plain(rest)), t = tree(su.body === plain(rest) ? rest : su.body);
    if (t && !hasSyms(t)) return Object.assign({ mode: "expr", expr: toExpr(su.body === plain(rest) ? rest : su.body), pre: `<i>${v}</i> =`, unit: su.unit, allowLhs: true, keys: keysFor("expr", rest), answerHTML: `${v} = ${RM(rest)}` }, exprForm(P, rest), { form: "simplify" });
    if (t) return { mode: "eqn", eqn: `${v} = ${toExpr(rest)}`, subject: v, rightWord: "Right", keys: keysFor("eqn", rest), placeholder: `${v} = …`, answerHTML: RM(a), simplify: !/\(/.test(rest) ? undefined : false };
  }
  // --- a compass bearing ---
  if (/^[NS] ?\d+° ?[EW]$/.test(pa)) return { mode: "text", accept: [pa, pa.replace(/[° ]/g, "")], placeholder: "e.g. N 35° E", keys: ["N", "S", "E", "W", "°"], answerHTML: RM(a) };
  // --- "Option B by $645.00" ---
  if ((m = /^Option ([AB]) by (\$[\d ,.]+)$/.exec(pa))) { const amt = read(m[2], P); return multi([{ name: "Which option?", q: { mode: "mc", options: ["Option A", "Option B"], correct: m[1] === "A" ? 0 : 1 } }, { name: "By how much?", q: amt }], a); }
  // --- "BC ≈ 10.9 cm", "SA = 576 mm²", "tan θ = 3/4" ---
  if ((m = /^([A-Z]{2,3}|(?:sin|cos|tan) ?θ|[A-Za-z][₀-₉]?|σ|Δ|∠[A-Z]{1,3})\s*(=|≈)\s*([^=≈;]+)$/.exec(a)) && m[1].length > 1) { const r = read(m[3], P); if (r && ["num", "frac", "expr"].includes(r.mode) && !(r.mode === "expr" && hasSyms(tree(m[3]) || { t: "num", v: 0 }))) return Object.assign(r, { pre: `${RM(m[1])} =` + (r.pre ? " " + r.pre : ""), answerHTML: RM(a) }); }
  // --- "P(x) = x(x + 1)(x + 2)" ---
  if ((m = /^([A-Za-z])\(([a-z])\)\s*=\s*([^=]+)$/.exec(a))) { const r = read(m[3], P); if (r && r.mode !== "multi") return Object.assign(r, { pre: `<i>${m[1]}</i>(<i>${m[2]}</i>) =`, answerHTML: RM(a) }); }
  // --- "x = 3, 2, −1/2" ---
  if ((m = /^([a-z])\s*=\s*((?:−|-)?[\d./]+(?:,\s*(?:−|-)?[\d./]+)+)$/.exec(pa))) { const r = readSet(m[1], m[2], false, P); if (r) return r; }
  // --- "x = 3 and y = −1" (two lines: asymptotes) ---
  if ((m = /^(?:Asymptotes )?(x = −?[\d.]+)(?: and |, )(y = −?[\d.]+)$/.exec(pa)) && /asymptote/i.test(P)) { const E = t => ({ mode: "eqn", eqn: toExpr(t), keys: ["=", "−"], example: "x = 2", answerHTML: RM(t) }); return multi([{ name: "Vertical asymptote", q: E(m[1]) }, { name: "Horizontal asymptote", q: E(m[2]) }], a); }
  // --- "t = 1 s and t = 4 s (on the way up and on the way down)" ---
  if ((m = /^([a-zθ]) = (.+?) (?:and|or) \1 = (.+?)(?: \(.*\))?$/.exec(pa))) { const r = readSet(m[1], `${m[2]} and ${m[3]}`, false, P); if (r) return Object.assign(r, { answerHTML: RM(a) }); }
  // --- a ratio: "1 : 5 000" ---
  if ((m = /^(\d[\d ]*) : (\d[\d ]*)$/.exec(pa))) return { mode: "ratio", parts: [num(m[1]), num(m[2])], simplest: true, placeholder: "e.g. 1 : 250", answerHTML: RM(a) };
  // --- scientific notation ---
  if ((m = /^((?:−|-)?\d(?:\.\d+)?) × 10(\^\(?[−-]?\d+\)?|[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)(?:\s+(.+))?$/.exec(pa)) && (!m[3] || /^[a-zA-Zμ°/²³ ]+$/.test(m[3]))) return { mode: "expr", expr: toExpr(`${m[1]} × 10${m[2]}`), form: "any", sci: true, unit: m[3] || "", keys: ["× 10^", "−"], placeholder: "e.g. 3.2 × 10^5", answerHTML: RM(a) };
  // --- "score = 8", "width = 3 cm" ---
  if ((m = /^([A-Za-z][A-Za-z ]{2,24})\s*=\s*([^=]+)$/.exec(a))) { const r = read(m[2], P); if (r && (r.mode === "num" || r.mode === "frac")) return r; }
  // --- two numbers: "13 and 11" ---
  if ((m = /^(−?-?\d+(?:\.\d+)?) and (−?-?\d+(?:\.\d+)?)$/.exec(pa))) return { mode: "set", values: [m[1], m[2]], keys: ["−", ","], placeholder: "e.g. 7, 12", answerHTML: RM(a), sub: "Type both numbers, with a comma between them." };
  // --- every solution ---
  if (/^[A-Za-z]\s*[=≈].*\bor\b/.test(a) || /^[A-Za-z]\s*=\s*±/.test(a)) { const v = a[0]; const r = readSet(v, a.replace(new RegExp(v + "\\s*[=≈]\\s*", "g"), ""), /≈/.test(a), P); if (r) return r; }
  // --- x = a, y = b ---
  if ((m = /^([a-z])\s*=\s*([^,;=]+)[,;]\s*(?:and\s+)?([a-z])\s*=\s*([^,;=]+)$/.exec(a))) {
    const f1 = read(`${m[1]} = ${m[2]}`, P), f2 = read(`${m[3]} = ${m[4]}`, P);
    if (f1 && f2) return m[1] === m[3] ? f2 : multi([{ name: "", q: f1 }, { name: "", q: f2 }], a);
  }
  // --- inequality ---
  if ((m = /^([a-z])\s*([<>≤≥])\s*(−?-?[\d.]+(?:\/\d+)?)$/.exec(pa))) { const t = tree(m[3]); if (t) return { mode: "ineq", v: m[1], op: m[2], value: A.ev(t, {}, 1), keys: KEYS.ineq, placeholder: `e.g. ${m[1]} ≥ 3`, answerHTML: RM(a) }; }
  // --- a point ---
  const c = coordAns(a); if (c) return { mode: "coord", x: c.x, y: c.y, answerHTML: RM(a) };
  // --- a number ---
  const n = numAns(a); if (n) return numQ(n, P);
  // --- an equation in two letters (a line, a circle) ---
  if (/=/.test(a) && a.split("=").length === 2 && !/[;,]/.test(a.replace(/\(\s*−?-?[\d.]+\s*,\s*−?-?[\d.]+\s*\)/g, ""))) {
    const e = A.splitEq(toExpr(a));
    if (e && (hasSyms(e.l) || hasSyms(e.r)) && !WORDY.test(toExpr(a).replace(/sqrt|cbrt|log|sin|cos|tan/g, ""))) {
      const general = /general form/i.test(P), yform = /y = mx \+ [cb]|gradient.intercept form/i.test(P);
      const sub = e.l.t === "sym" && !A.symbols(e.r).has(e.l.n) ? e.l.n : null;
      return { mode: "eqn", eqn: toExpr(a), form: general ? "general" : yform ? "subject" : undefined, subject: yform ? "y" : (sub && !general && /subject|in the form/i.test(P) ? sub : undefined), rightWord: "Right line", keys: keysFor("eqn", a), placeholder: general ? "… = 0" : sub ? `${sub} = …` : "", example: general ? "2x − y + 3 = 0" : undefined, answerHTML: RM(a) };
    }
  }
  // --- a plain fraction ---
  if ((m = /^(\d+)\/(\d+)$/.exec(pa)) || (m = /^\[\[frac:(\d+):(\d+)\]\]$/.exec(a))) return { mode: "frac", n: Number(m[1]), d: Number(m[2]), form: /fraction/i.test(P) ? "fraction" : null, simplest: /simplest|simplif/i.test(P), placeholder: "e.g. 3/4", keys: ["/"], answerHTML: FR_HTML(m[1], m[2]) };
  // --- an expression ---
  const su = stripUnit(pa), body = su.unit ? a.replace(new RegExp("\\s*" + su.unit.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "$"), "") : a;
  const t = tree(body);
  if (t && !/[;:]/.test(toExpr(body)) && !WORDY.test(toExpr(body).replace(/sqrt|cbrt|log|sin|cos|tan/g, "")) && !/[A-Z]{2,}|^[A-Z][a-z]{2}/.test(plain(body)) && !/^[A-Z]$/.test(plain(body))) {
    const f = exprForm(P, body);
    return Object.assign({ mode: "expr", expr: toExpr(body), unit: su.unit, keys: keysFor("expr", body), answerHTML: RM(a) }, f, /\d\.\d{2,}\s*π/.test(body) ? { approx: true } : {});
  }
  return null;
}
function numQ(n, P, extra = {}) {
  const q = Object.assign({ mode: "num", value: n.value, unit: n.unit, pre: n.pre }, extra);
  if (n.pre && extra.pre) q.pre = extra.pre + " " + n.pre;
  const dp = /correct to (\d|one|two|three) decimal place/i.exec(P), near = /nearest (cent|dollar|degree|minute|whole|metre|centimetre|millimetre|tenth|hundredth)/i.exec(P);
  if (n.money) { q.tol = n.dps ? 0.0051 : 0.5; q.answerHTML = (extra.pre ? extra.pre + " " : "") + "$" + n.value.toFixed(n.dps ? 2 : 0).replace(/\B(?=(\d{3})+(?!\d))/g, " "); if (!n.dps && !/nearest dollar/i.test(P)) q.tol = 0.005; }
  else if (dp) q.dp = { one: 1, two: 2, three: 3 }[dp[1].toLowerCase()] || Number(dp[1]);
  else if (n.dps && /correct to|nearest|approximately|≈|estimate/i.test(P)) q.dp = n.dps;
  else if (n.dps >= 2 && !/exact/i.test(P)) q.dp = n.dps;             // a rounded decimal: anything that rounds to it
  if (q.unit === "%") q.unit = "%";
  return q;
}
function readSet(v, rest, approx, P) {
  const parts = rest.split(/\s+or\s+|\s+and\s+|,\s*/).map(s => s.trim()).filter(Boolean).map(s => stripUnit(plain(s.replace(/\s*\([^)]*\)$/, ""))).body);
  if (!parts.length || parts.some(p => { const t = tree(p); return !t || hasSyms(t); })) return null;
  const unit = (stripUnit(plain(rest.split(/\s+or\s+|\s+and\s+/)[0])).unit) || "";
  const dps = Math.max(...parts.map(p => ((/\.(\d+)/.exec(p) || [])[1] || "").length));
  const rounded = approx || /decimal place|nearest/i.test(P);
  return { mode: "set", values: parts.map(toExpr), v, pre: `<i>${v}</i> =`, unit, tol: rounded ? 0.5 * Math.pow(10, -dps) + 1e-9 : undefined, keys: keysFor("set", rest), placeholder: parts.length > 1 || /±/.test(rest) ? "e.g. −4, 7" : "", answerHTML: `${v} = ${RM(rest)}`, sub: parts.length > 1 || /±/.test(rest) ? "Type every solution, with a comma between them." : "" };
}
function multi(fields, ansText, o = {}) {
  if (fields.length < 2 || fields.length > 7 || fields.some(f => !f.q)) return null;
  return Object.assign({ mode: "multi", fields, answerHTML: RM(ansText) }, o);
}
/* "Gradient −5, y-intercept −8" · "Total cost $1 995.96; extra $95.96" · "2 lines; order 2" */
function readLabelled(ans, P) {
  const a = String(ans).trim().replace(/\.$/, "");
  const safe = a.replace(/\(([^()]*),([^()]*)\)/g, "($1\u0001$2)");          // keep the comma inside a point
  let parts = safe.split(/;\s*/); if (parts.length === 1) parts = safe.split(/,\s*(?=[A-Za-z])/);
  parts = parts.map(s => s.replace(/\u0001/g, ",").trim()).filter(Boolean);
  // "5 vertices and 7 edges", "61 adult and 44 child tickets"
  { const m2 = /^(\d+) ([a-z-]+(?: [a-z-]+)?) and (\d+) ([a-z-]+(?: [a-z-]+)?)$/.exec(plain(a)) || /^(\d+) ([a-z]+) and (\d+) ([a-z]+) [a-z]+$/.exec(plain(a)); if (m2) return multi([{ name: cap1(m2[2]), q: { mode: "num", value: Number(m2[1]) } }, { name: cap1(m2[4]), q: { mode: "num", value: Number(m2[3]) } }], a); }
  if (parts.length < 2 || parts.length > 5) return null;
  // "k = 6; y = 120": a box each, each with its own letter (the same letter twice: the last one is the answer)
  if (parts.every(x => /^[A-Za-z]\s*[=≈]\s*[^=≈]+$/.test(x))) { const fs = parts.map(x => read(x, P)); if (fs.every(Boolean)) { const ls = parts.map(x => x[0]); return new Set(ls).size === ls.length ? multi(fs.map(q => ({ name: "", q })), a) : fs[fs.length - 1]; } }
  const fields = [];
  for (const part of parts) {
    let m, name, val, eq = false;
    if ((m = /^([A-Za-zθσΔ∠′₀-₉ ]{1,12}?)\s*(?:=|≈)\s*([^=≈]+)$/.exec(part))) { name = m[1].trim(); val = m[2].trim(); eq = true; }
    else if ((m = /^(.*?[A-Za-z′₀-₉)])\s*(?::|is|of)?\s+((?:\(|−|-|\$|\d|\[\[|√|±).*)$/.exec(part))) { name = m[1].trim(); val = m[2].trim(); }
    else if ((m = /^((?:−|-|\$)?\d[\d ,.]*)\s+([a-z][a-z -]*)$/i.exec(part))) { name = cap1(m[2].trim()); val = m[1].trim(); }   // "2 lines"
    else return null;
    name = name.replace(/\s*[:=]$/, "").trim();
    if (!/^[A-Za-zθσΔ∠][A-Za-zθ′'₀-₉ -]{0,26}$/.test(name) || name.split(/\s+/).length > 3 || /^(and|so|then|the|or|but|with|by)\b/i.test(name) || /\b(is|are|by)$/i.test(name)) return null;
    const q = read(val.replace(/^±\s*/, ""), P); if (!q || q.mode === "multi") return null;
    fields.push(eq || name.length <= 2 ? { name: "", q: Object.assign(q, { pre: (name.length === 1 ? `<i>${name}</i>` : RM(name)) + " =" + (q.pre ? " " + q.pre : "") }) } : { name: cap1(name), q });
  }
  return multi(fields, a);
}
/* a table with gaps: a box for each gap, named by its column */
function readTable(q) {
  const t = q.table; if (!t || !t.rows) return null;
  const blanks = []; t.rows.forEach((row, r) => row.forEach((c, i) => { if (String(c).trim() === "" && r > 0 && i > 0) blanks.push([r, i]); }));
  if (blanks.length < 1 || blanks.length > 7) return null;
  let a = plain(q.answer).replace(/^[^:]*(?:y-values|values are|are)\s*:?\s*/i, "").replace(/\.\s*The graph.*$/i, "");
  const vals = a.split(/;\s*|,\s*(?![^()]*\))/).map(s => s.replace(/^.*(?:=|:)\s*/, "").trim()).filter(Boolean);
  if (vals.length !== blanks.length) return null;
  const fields = blanks.map(([r, i], k) => { const f = read(vals[k].replace(/^-/, "−"), ""); const h0 = plain(t.rows[0][0]); return { name: (/^[a-zA-Z]$/.test(h0) ? `<i>${h0}</i> = ` : "") + RM(t.rows[0][i]).replace(/^-/, "−") + (t.rows.length > 2 ? ` (${RM(t.rows[r][0])})` : ""), cell: [r, i], q: f }; });
  return multi(fields, q.answer, { layout: "cells" });
}

/* ======================= multiple choice ======================= */
function mc(b, correct, distractors, o = {}) {
  const seen = new Set([normW(correct)]), opts = [correct];
  for (const d of distractors) { const k = normW(d); if (!k || seen.has(k)) continue; seen.add(k); opts.push(d); if (opts.length >= (o.max || 4)) break; }
  if (opts.length < 2) return null;
  let order;
  if (Array.isArray(o.keepOrder)) { const ko = o.keepOrder.map(normW), at = x => { const i = ko.indexOf(normW(x)); return i < 0 ? 99 : i; }; order = opts.slice().sort((x, y) => at(x) - at(y)); }
  else order = shuffle(opts);
  return Object.assign(b, { mode: "mc", options: order.map(x => (o.html ? x : RM(x))), correct: order.indexOf(correct), answerHTML: o.html ? correct : RM(correct) });
}
/* the options a question names itself: "parallel, perpendicular or neither", "rational or irrational" */
function promptOptions(P, head, heads) {
  const h = normW(head), text = plain(P);
  for (const re of [/((?:[\w-]+, )*[\w-]+,? or [\w-]+)/g, /((?:[\w-]+(?: [\w-]+)?, )*[\w-]+(?: [\w-]+)?,? or [\w-]+(?: [\w-]+)?)/g, /((?:[\w-]+(?: [\w-]+){0,2}, )*[\w-]+(?: [\w-]+){0,2},? or [\w-]+(?: [\w-]+){0,2})/g]) {
    for (const m of text.matchAll(re)) {
      const items = m[1].split(/,\s*|\s+or\s+/).map(s => s.replace(/^or\s+/, "").trim()).filter(Boolean);
      if (items.length < 2 || items.length > 5 || !items.some(x => normW(x) === h)) continue;
      if (heads && heads.length && !heads.every(x => items.some(i => normW(i) === normW(x)))) continue;     // every answer this type can have is one of the options
      return items;
    }
  }
  return null;
}
const POOL = {};

/* ======================= convert one question ======================= */
const YESNO = /^(Yes|No)\b\s*[:—–,.-]?\s*(.*)$/s;
function convert(q, ctx, o = {}) {
  const P = o.promptText != null ? o.promptText : cleanPrompt(q.prompt), a = String(q.answer == null ? "" : q.answer).trim();
  const B = () => base(q, Object.assign({}, o, o.promptText != null ? { prompt: RM(o.promptText) } : {}));
  let m;
  // the bank's own choices
  if (Array.isArray(q.choices) && q.choices.length >= 2) {
    const texts = q.choices.map(c => plain(typeof c === "string" ? c : (c.text != null ? c.text : c.label)));
    const head = plain(a).split(/[;:]/)[0].trim();
    const hit = texts.find(t => normW(t) === normW(head)) || texts.find(t => normW(a).startsWith(normW(t)));
    if (hit) return mc(B(), hit, texts.filter(t => t !== hit), { keepOrder: texts, max: 6 });
  }
  // a multi-part question: one of its parts
  if (Array.isArray(q.subparts) && q.subparts.length && !o.noSubs) {
    for (const sp of shuffle(q.subparts)) {
      const stem = cleanPrompt(q.prompt), sub = cleanPrompt(sp.prompt), bare = !/[A-Za-z]{4,}/.test(plain(sub).replace(/sqrt|frac|algfrac/g, ""));
      let text;
      const verb = /^(Simplify|Factorise|Solve|Evaluate|Expand|Calculate|Find)\b/.exec(stem);
      if (bare && verb) text = `${verb[1]}${/fully/.test(stem) ? " fully" : ""}: ${sub}` + (/positive indices/.test(stem) ? " (write your answer with positive indices)" : "") + (/no pronumerals/.test(stem) && !/[a-z]/.test(sub.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, "")) ? "" : "");
      else if (/^(Answer each part|Expand or factorise as indicated|Solve each equation or inequality|Simplify, or evaluate)/i.test(stem)) text = bare ? `${/=|[<>≤≥]/.test(sub) ? "Solve" : /[a-z]/.test(sub) ? "Simplify" : "Evaluate"}: ${sub}` : sub;
      else text = `${stem} ${sub}`.trim();
      const out = convert({ prompt: text, answer: sp.answer, working: sp.working, diagram: sp.diagram || q.diagram, table: sp.table || q.table, mcDistractors: sp.mcDistractors }, ctx, { noSubs: true });
      if (out) return out;
    }
    return null;
  }
  // Yes / No
  if ((m = YESNO.exec(a)) && !/^No real|^No solution|^None/i.test(a)) return Object.assign(mc(B(), m[1], ["Yes", "No"], { keepOrder: ["yes", "no"] }), { why: RM(a) });
  if ((m = /^(Correct|Incorrect|True|False)\b\s*[:—–,.-]?/i.exec(a))) { const t = /^(correct|true)/i.test(m[1]); return Object.assign(B(), { mode: "tf", truth: t, why: RM(a), tfLabels: /correct/i.test(m[1]) ? ["Correct", "Not correct"] : null }); }
  // a category the question names: "Perpendicular: …", "exponential; constant multiplier"
  { const head = plain(a).split(/\s*[:;—–]\s*|\s+\(/)[0].trim(); const opts = head && head.split(" ").length <= 3 ? promptOptions(P, head, ctx && ctx.pool ? ctx.pool().map(x => x.split(/\s*[:;—–]\s*|\s+\(/)[0].trim()) : null) : null;
    if (opts) { const hit = opts.find(x => normW(x) === normW(head)); const r = mc(B(), cap1(hit), opts.filter(x => x !== hit).map(cap1), { keepOrder: opts.map(cap1) }); if (r) return Object.assign(r, { why: plain(a) === head ? r.why : RM(a) }); } }
  // "A" – "D": which graph / which diagram
  if (/^[A-F]$/.test(a)) { const cfg = (q.diagram && q.diagram.config) || {}; const L = (cfg.cards || cfg.options || cfg.graphs || cfg.items || []).map(x => x && (x.option || x.label || x.letter)).filter(x => /^[A-F]$/.test(x || "")); const opts = L.length >= 2 && L.includes(a) ? L : ["A", "B", "C", "D"]; return mc(B(), a, opts.filter(x => x !== a), { keepOrder: opts, max: 6 }); }
  // typed answers
  if (!o.mcOnly) {
    if (q.table && /complete the table/i.test(q.prompt)) { const r = readTable(q); if (r && r.fields.every(f => f.q)) return Object.assign(base(q, Object.assign({ blanks: true }, o)), r); }
    let r = read(a, P) || readLabelled(a, P), full = null;
    if (!r) { const cut = /^(.{1,40}?)(?::\s| — |, so |\. )(.+)$/s.exec(a); if (cut) { r = read(cut[1], P) || readLabelled(cut[1], P); if (r) full = RM(a); else { const so = /, so (.+)$/.exec(a); if (so) { r = read(so[1], P); if (r) full = RM(a); } } } }
    if (r && full) r.why = full;
    if (r) { const b0 = B(); return Object.assign(b0, r, r.sub ? { prompt: b0.prompt + `<span class="sub">${r.sub}</span>` } : {}, r.why ? {} : { why: b0.why }); }
  }
  // words: the bank's misconception distractors, else sibling answers when there are only a few
  if (Array.isArray(q.mcDistractors) && q.mcDistractors.length >= 1) {
    const ds = q.mcDistractors.map(String).filter(d => !/\[\[/.test(RM(d)));
    // "12 km/h: the distance increases by …" beside bare distractors would give itself away: keep the head, the rest is the reason
    let correct = a, reason = null; const cut = /^(.{1,60}?)(?::\s| — | \()/.exec(a);
    if (cut && !ds.some(d => /:\s| — /.test(d)) && a.length > 1.8 * Math.max(...ds.map(d => d.length))) { correct = cut[1].trim(); reason = RM(a); }
    const r = mc(B(), correct, ds, { html: false }); if (r) return reason ? Object.assign(r, { why: reason }) : r;
  }
  if (ctx && ctx.pool) { const sib = ctx.pool(); if (sib.length >= 2 && sib.length <= 7 && sib.includes(plain(a))) { const r = mc(B(), plain(a), shuffle(sib.filter(x => x !== plain(a)))); if (r) return r; } }
  return null;
}

/* ======================= per-type wording ======================= */
/* SPEC[bank][type](q, ctx) → quiz question | null (try another). Filled in below. */
export const SPEC = {};
export const PAPER_ONLY = new Set();
export const NATIVE = {};
const spec = (bank, ids, fn) => { SPEC[bank] = SPEC[bank] || {}; String(ids).split(/\s+/).forEach(id => { SPEC[bank][id] = fn; }); };
const paper = (bank, ids) => String(ids).split(/\s+/).forEach(id => PAPER_ONLY.add(bank + ":" + id));
export const _tools = { spec, paper, convert, read, readLabelled, readTable, base, mc, multi, RM, plain, cleanPrompt, toExpr, numAns, numQ, tree, FR_HTML, cap1, normW, promptOptions, why, exprForm, keysFor };

/* ======================= per-type specs ======================= */
const re = (q, ctx, P, ans, o = {}) => convert(Object.assign({}, q, { answer: ans, subparts: null, choices: null, mcDistractors: o.d || null }), ctx, Object.assign({ promptText: P }, o));
const MCQ = (q, P, correct, ds, o = {}) => mc(base(q, Object.assign({ prompt: RM(P) }, o)), correct, ds, o);
const MULTI = (q, P, fields, ansText, o = {}) => { const m = multi(fields, ansText); return m ? Object.assign(base(q, Object.assign({ prompt: RM(P) }, o)), m) : null; };
const NUM = (value, extra = {}) => Object.assign({ mode: "num", value }, extra);
const MONEY = v0 => { const value = Math.round(v0 * 100) / 100; return MONEY_(value); };
const MONEY_ = value => ({ mode: "num", value, pre: "$", tol: 0.0051, answerHTML: "$" + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ") });
const COORD = (x, y) => ({ mode: "coord", x, y, answerHTML: `(${fmt(x)}, ${fmt(y)})`.replace(/-/g, "−") });
const nn = s => num(String(s));
const ORDER = (q, P, list, sorted, ends) => { const items = list.map(s => s.trim()), want = sorted.map(s => s.trim()); const correct = want.map(w => items.indexOf(w)); if (correct.some(i => i < 0) || new Set(correct).size !== items.length) return null; return Object.assign(base(q, { prompt: RM(P) }), { mode: "order", items: items.map(RM), correct, ends, answerHTML: want.map(RM).join(", &nbsp;") }); };

/* --- Financial mathematics --- */
spec("financial-mathematics-a", "compare-payment-options", q => {
  const P = plain(q.prompt), m = /Cash price: \$([\d ]+?) • Payment plan: \$([\d ]+?) deposit plus (\d+) monthly payments of \$([\d .]+?) • Buy now, pay later: cash price plus \$([\d ]+?) in fees/.exec(P); if (!m) return null;
  const cash = nn(m[1]), dep = nn(m[2]), n = nn(m[3]), pay = nn(m[4]), fees = nn(m[5]), plan = dep + n * pay, bnpl = cash + fees;
  const stem = P.replace(/\s*Which option is cheapest\?/, "").split(" • ").map(RM).join("<br>• ");
  const k = ri(0, 3);
  if (k === 0) return Object.assign(base(q, { prompt: stem + "<br>What is the total cost of the payment plan?", why: `$${fmt(dep)} + ${n} × $${pay.toFixed(2)} = $${plan.toFixed(2)}` }), MONEY(plan));
  if (k === 1) return Object.assign(base(q, { prompt: stem + "<br>How much more than the cash price does the payment plan cost?", why: `Payment plan: $${fmt(dep)} + ${n} × $${pay.toFixed(2)} = $${plan.toFixed(2)}. &nbsp;·&nbsp; $${plan.toFixed(2)} − $${fmt(cash)} = $${(plan - cash).toFixed(2)}` }), MONEY(plan - cash));
  const opts = [["Cash", cash], ["Payment plan", plan], ["Buy now, pay later", bnpl]].sort((a, b) => a[1] - b[1]);
  if (k === 2) return Object.assign(base(q, { prompt: stem + "<br>Which option costs the most?", why: `Cash $${fmt(cash)}; payment plan $${plan.toFixed(2)}; buy now, pay later $${fmt(bnpl)}.` }), { mode: "mc", options: ["Cash", "Payment plan", "Buy now, pay later"], correct: ["Cash", "Payment plan", "Buy now, pay later"].indexOf(opts[2][0]), answerHTML: opts[2][0] });
  return Object.assign(base(q, { prompt: stem + "<br>How much is saved by paying cash instead of using the dearest option?", why: `Cash $${fmt(cash)}; payment plan $${plan.toFixed(2)}; buy now, pay later $${fmt(bnpl)}.` }), MONEY(opts[2][1] - cash));
});

/* --- Algebraic techniques --- */
spec("algebraic-techniques-b", "factorise-area-model", (q, ctx) => {
  const a = plain(q.answer), f = /\([^()]+\)\([^()]+\)/.exec(a), x = /(?:for|shows) (.+?) (?:\(the|split)/.exec(plain(q.prompt)); if (!f || !x) return null;
  return re(q, ctx, `The area model is for ${x[1]}. Use it to factorise ${x[1]}.`, f[0]);
});
spec("algebraic-techniques-c", "choose-technique", (q, ctx) => {
  const m = /^([^:]+): (.+)$/.exec(plain(q.answer)), x = /for (.+?), then factorise/.exec(plain(q.prompt)); if (!m || !x) return null;
  if (Math.random() < 0.5) return re(q, ctx, `Factorise ${x[1]} fully.`, m[2]);
  const names = [...new Set(ctx.pool().map(s => s.split(":")[0].trim()))].filter(n => n !== m[1]);
  return MCQ(q, `Which factorising technique fits ${x[1]}?`, m[1], shuffle(names), { why: RM(q.answer) });
});

/* --- Indices --- */
spec("indices-b", "quotient-negative", q => {
  const a = plain(q.answer), m = /\(i\)\s*(.+?)\s+\(ii\)\s*(.+)$/.exec(a); if (!m) return undefined;
  const P = cleanPrompt(q.prompt).replace(/, giving the answer.*$/, ".");
  return MULTI(q, P + " Give the answer both ways.", [
    { name: "With a negative index", q: { mode: "expr", expr: toExpr(m[1]), form: "any", noFraction: true, keys: ["^", "−"], answerHTML: RM(m[1]) } },
    { name: "With a positive index", q: { mode: "expr", expr: toExpr(m[2]), form: "any", posIndex: true, keys: ["^", "/"], answerHTML: RM(m[2]) } }], q.answer);
});
spec("indices-c", "rational-or-irrational", q => {
  const P = plain(q.prompt), m = /^(Which of these numbers (?:is|are) (?:ir)?rational\?)\s*(.+)$/.exec(P);
  if (!m) { const y = /^(Rational|Irrational): (.+)$/.exec(plain(q.answer)); if (!y) return undefined; return Object.assign(base(q, { why: RM(y[2]) }), { mode: "mc", options: ["Rational", "Irrational"], correct: y[1] === "Rational" ? 0 : 1, answerHTML: y[1] }); }
  const items = String(q.prompt).replace(/^.*?\?\s*/, "").split(/,\s+(?![^()]*\))/), a = String(q.answer).trim();
  if (!items.includes(a)) { // more than one of them: count them
    const picks = a.split(/,\s+(?![^()]*\))/); if (picks.length < 2 || picks.some(x => !items.includes(x))) return null;
    const what = /irrational/.test(m[1]) ? "irrational" : "rational";
    return Object.assign(base(q, { prompt: `How many of these numbers are ${what}?<span class="sub">${items.map(RM).join(" &nbsp;·&nbsp; ")}</span>`, why: RM(`${cap1(what)}: ${a}`) }), NUM(picks.length));
  }
  return mc(base(q, { prompt: RM(m[1].replace(" are ", " is ").replace("numbers", "numbers")) }), a, items.filter(x => x !== a), { keepOrder: items });
});
spec("indices-c", "order-surds", q => { const m = /^(.*?order): (.+)$/.exec(String(q.prompt)); if (!m) return null; const desc = /descending/.test(m[1]); return ORDER(q, `Put these in ${desc ? "descending" : "ascending"} order.`, m[2].split(", "), String(q.answer).split(", "), desc ? ["largest", "smallest"] : ["smallest", "largest"]); });
spec("numbers-of-any-magnitude", "order-scientific", q => { const m = /^(.*?order): (.+)$/.exec(String(q.prompt)); if (!m) return null; const desc = /descending/.test(m[1]); return ORDER(q, `Put these numbers in ${desc ? "descending" : "ascending"} order.`, m[2].split(", "), String(q.answer).split(", "), desc ? ["largest", "smallest"] : ["smallest", "largest"]); });
spec("numbers-of-any-magnitude", "absolute-error", q => {
  const a = plain(q.answer), m = /±([\d.]+) (\S+); between ([\d.]+) \S+ and ([\d.]+)/.exec(a); if (!m) return undefined;
  return MULTI(q, cleanPrompt(q.prompt), [
    { name: "Absolute error", q: NUM(nn(m[1]), { pre: "±", unit: m[2] }) },
    { name: "Lower limit", q: NUM(nn(m[3]), { unit: m[2] }) },
    { name: "Upper limit", q: NUM(nn(m[4]), { unit: m[2] }) }], q.answer);
});

/* --- Equations --- */
spec("equations-b", "graph-inequality", (q, ctx) => {
  const a = plain(q.answer), m = /^(.+?); (open|closed) circle at (\S+), arrow to the (left|right)$/.exec(a); if (!m) return undefined;
  const P = cleanPrompt(q.prompt).replace(/, then graph.*$/, ".");
  if (Math.random() < 0.55) return re(q, ctx, P, m[1], { noDiagram: true });
  const all = []; ["Closed", "Open"].forEach(c => ["left", "right"].forEach(d => all.push(`${c} circle at ${m[3]}, arrow to the ${d}`)));
  const right = `${cap1(m[2])} circle at ${m[3]}, arrow to the ${m[4]}`;
  return mc(base(q, { prompt: RM(P.replace(/\.$/, "")) + ". How is the solution graphed on a number line?", noDiagram: true, why: RM(q.answer) + (why(q) ? " &nbsp;·&nbsp; " + why(q) : "") }), right, all.filter(x => x !== right), { keepOrder: all });
});
spec("equations-c", "discriminant", q => {
  const a = plain(q.answer), m = /^(No|One|Two) real solutions? \(Δ = (−?\d+)\)$/.exec(a), e = /solutions (.+?) has/.exec(plain(q.prompt)); if (!m || !e) return undefined;
  if (Math.random() < 0.45) return Object.assign(base(q, { prompt: RM(`Find the value of the discriminant, Δ = b² − 4ac, for ${e[1]}.`) }), NUM(nn(m[2]), { pre: "Δ =" }));
  const opts = ["No real solutions", "One real solution", "Two real solutions"];
  return Object.assign(base(q, { prompt: RM(`Use the discriminant to decide how many real solutions ${e[1]} has.`), why: RM(`Δ = ${m[2]}`) + (why(q) ? " &nbsp;·&nbsp; " + why(q) : "") }), { mode: "mc", options: opts, correct: ["No", "One", "Two"].indexOf(m[1]), answerHTML: opts[["No", "One", "Two"].indexOf(m[1])] });
});
spec("equations-b", "inequality-problems", (q, ctx) => {
  const a = plain(q.answer); let m;
  if ((m = /, so (\d+) ([a-z ]+)$/.exec(a))) return Object.assign(base(q), NUM(nn(m[1]), { unit: m[2] }));
  const parts = a.split(/;\s*/); return re(q, ctx, cleanPrompt(q.prompt), parts[parts.length - 1]);
});

/* --- Linear relationships --- */
const gridOf = q => { const c = (q.diagram && q.diagram.config) || {}; return { xMin: c.xMin != null ? c.xMin : -6, xMax: c.xMax != null ? c.xMax : 6, yMin: c.yMin != null ? c.yMin : -6, yMax: c.yMax != null ? c.yMax : 6 }; };
const PLOT = (q, P, x, y, w) => { const g = gridOf(q); if (x < g.xMin || x > g.xMax || y < g.yMin || y > g.yMax || x % 1 || y % 1) return null; return { prompt: RM(P), mode: "plot", grid: g, x, y, why: w || why(q), answerHTML: `(${fmt(x)}, ${fmt(y)})`.replace(/-/g, "−") }; };
spec("linear-relationships-a", "graph-a-line", q => {
  const e = /graph of (.+?) on/.exec(String(q.prompt)), m = /through \((−?\d+), (−?\d+)\) and \((−?\d+), (−?\d+)\)/.exec(plain(q.answer)); if (!e || !m) return null;
  const [x1, y1, x2, y2] = m.slice(1).map(nn);
  return Math.random() < 0.4 ? PLOT(q, `The line ${e[1]} is to be drawn on the number plane. Click the point where it crosses the y-axis.`, x1, y1, `When x = 0, y = ${fmt(y1)}, so the line crosses the y-axis at (0, ${fmt(y1)}).`)
    : PLOT(q, `The line ${e[1]} is to be drawn on the number plane. Click the point on the line where x = ${fmt(x2)}.`, x2, y2, `Substitute x = ${fmt(x2)}: y = ${fmt(y2)}, so the point is (${fmt(x2)}, ${fmt(y2)}).`);
});
spec("linear-relationships-b", "sketch-from-m-c", q => {
  const e = /Sketch (.+?) using/.exec(String(q.prompt)), m = /through \((−?\d+), (−?\d+)\) and \((−?\d+), (−?\d+)\) \(rise (−?\d+), run (\d+)\)/.exec(plain(q.answer)); if (!e || !m) return null;
  const [x1, y1, x2, y2, rise, run] = m.slice(1).map(nn);
  return Math.random() < 0.35 ? PLOT(q, `To sketch ${e[1]}, start at the y-intercept. Click the y-intercept on the number plane.`, x1, y1, `The y-intercept is the constant term: (0, ${fmt(y1)}).`)
    : PLOT(q, `The line ${e[1]} crosses the y-axis at (0, ${fmt(y1)}). Use the gradient to click the point on the line ${run} unit${run > 1 ? "s" : ""} to the right of the y-intercept.`, x2, y2, `Gradient ${fmt(rise)}/${run}: from (0, ${fmt(y1)}) go ${run} right and ${Math.abs(rise)} ${rise < 0 ? "down" : "up"} to (${fmt(x2)}, ${fmt(y2)}).`);
});
spec("linear-relationships-a", "parallel-lines", q => {
  const m = /^(.*?\?)\s*(.+)$/.exec(String(q.prompt)); if (!m) return null;
  const lines = m[2].split(/;\s*/), a = plain(q.answer), pairs = [];
  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) pairs.push(`${lines[i]} and ${lines[j]}`);
  const right = pairs.find(p => normW(p) === normW(a)); if (!right) return null;
  return mc(base(q, { prompt: RM(m[1]) + `<span class="sub">${lines.map(RM).join(" &nbsp;·&nbsp; ")}</span>` }), right, shuffle(pairs.filter(p => p !== right)));
});
spec("linear-relationships-b", "rearrange-to-form", (q, ctx) => {
  const a = String(q.answer), m = /^(y = .+?); gradient (.+?), y-intercept (.+)$/.exec(a), e = /Write (.+?) in the form/.exec(plain(q.prompt)); if (!m || !e) return undefined;
  const k = ri(0, 3);
  if (k <= 1) { const r = re(q, ctx, `Write ${e[1]} in the form y = mx + c.`, m[1]); if (r) { r.subject = "y"; r.form = "subject"; } return r; }
  return re(q, ctx, k === 2 ? `What is the gradient of the line ${e[1]}?` : `What is the y-intercept of the line ${e[1]}?`, k === 2 ? m[2] : m[3], { why: RM(a) });
});
spec("linear-relationships-b", "linear-models", q => {
  const a = plain(q.answer), m = /^Gradient: (.+?)\.? Intercept: (.+?)\.?$/.exec(a), f = /\b([A-Z]) = ([^,]+?) (?:dollars|litres|,|where|after|km|metres|cm|\$)/.exec(plain(q.prompt)) || /\b([A-Z]) = (\S+ [+−] \S+)/.exec(plain(q.prompt)); if (!m) return undefined;
  const dep = f ? f[1] : "the quantity", ind = f ? ((/[a-z]/.exec(f[2]) || ["x"])[0]) : "x";
  const g = Math.random() < 0.5, P = cleanPrompt(q.prompt).replace(/\s*Explain what the gradient and the vertical intercept mean in this context\./, "");
  const tidy = t => cap1(t.replace(/^[−$\d. ]+[A-Za-z]*: /, "").replace(/^(−?\$?[\d.]+(?: [A-Za-z]+)?) \((.+)\)$/, "$1: $2"));
  const right = tidy(g ? m[1] : m[2]), other = tidy(g ? m[2] : m[1]);
  return MCQ(q, `${P} What does the ${g ? "gradient" : "vertical intercept"} tell you?`, right, shuffle([other, `The value of ${dep} when ${ind} = 1`, `The value of ${ind} when ${dep} = 0`]), { why: RM(a) });
});
const imagePts = a => { const out = []; String(plain(a)).replace(/([A-D])′\((−?\d+), (−?\d+)\)/g, (_, l, x, y) => { out.push([l, nn(x), nn(y)]); }); return out; };
spec("linear-relationships-c", "translate-coordinates reflect-in-axis", q => {
  const pts = imagePts(q.answer); if (pts.length < 3) return undefined;
  const P = cleanPrompt(q.prompt).replace(/\s*Find the coordinates of.*$/, "").replace(/, and draw it\.?$/, "");
  if (Math.random() < 0.5) { const p = pick(pts); return Object.assign(base(q, { prompt: RM(`${P} Find the coordinates of ${p[0]}′.`) }), COORD(p[1], p[2]), { pre: `${p[0]}′` }); }
  return MULTI(q, `${P} Find the coordinates of the image.`, pts.map(p => ({ name: "", q: Object.assign(COORD(p[1], p[2]), { pre: `${p[0]}′` }) })), q.answer);
});
paper("linear-relationships-c", "triangle-proof parallelogram-proof");

/* --- Non-linear relationships, polynomials, functions --- */
const upDown = up => ({ mode: "mc", options: ["Concave up (opens upwards)", "Concave down (opens downwards)"], correct: up ? 0 : 1, answerHTML: up ? "Concave up (opens upwards)" : "Concave down (opens downwards)" });
const xInts = (list) => { const vals = list.split(/,\s*|\s+and\s+/).map(s => s.trim()).filter(Boolean); if (!vals.length || vals.some(v => isNaN(nn(v)))) return null; return { mode: "set", values: vals.map(toExpr), v: "x", pre: "<i>x</i> =", keys: ["−", ","], placeholder: vals.length > 1 ? "e.g. −4, 7" : "", sub: vals.length > 1 ? "Type every x-intercept, with a comma between them." : "", answerHTML: "x = " + RM(vals.join(", ")) }; };
spec("non-linear-relationships-b", "nonlinear-b-quadratic-features", q => {
  const a = plain(q.answer).replace(/-(?=\d)/g, "−"), m = /vertex \((−?[\d.]+), (−?[\d.]+)\); axis of symmetry (x = −?[\d.]+); y-intercept \((−?[\d.]+), (−?[\d.]+)\); opens (up|down)wards/.exec(a), e = /parabola (.+?), state/.exec(plain(q.prompt)); if (!m || !e) return undefined;
  const k = ri(0, 3), eq = e[1].replace(/-(?=\d|x)/g, "−"), W = RM(a);
  if (k === 0) return Object.assign(base(q, { prompt: RM(`What is the vertex of the parabola ${eq}?`), why: W }), COORD(nn(m[1]), nn(m[2])));
  if (k === 1) return Object.assign(base(q, { prompt: RM(`Is the parabola ${eq} concave up or concave down?`), noDiagram: true, why: W }), upDown(m[6] === "up"));
  if (k === 2) return Object.assign(base(q, { prompt: RM(`What is the y-intercept of the parabola ${eq}?`), noDiagram: true, why: W }), NUM(nn(m[5]), { pre: "<i>y</i> =" }));
  return Object.assign(base(q, { prompt: RM(`Write the equation of the axis of symmetry of the parabola ${eq}.`), why: W }), { mode: "eqn", eqn: toExpr(m[3]), keys: ["=", "−"], example: "x = 2", answerHTML: RM(m[3]) });
});
spec("non-linear-relationships-b", "nonlinear-b-match-equation-graph", q => {
  const pairs = []; String(q.answer).split(/;\s*/).forEach(p => { const m = /^Graph ([A-D]): (.+)$/.exec(p.trim()); if (m) pairs.push(m); }); if (pairs.length < 3) return undefined;
  const p = pick(pairs);
  return mc(base(q, { prompt: `Which equation best matches Graph ${p[1]}?` }), p[2], shuffle(pairs.filter(x => x !== p).map(x => x[2])));
});
spec("non-linear-relationships-c", "sketch-parabola", q => {
  const a = plain(q.answer), e = /parabola (.+?) on the axes/.exec(plain(q.prompt)); if (!e) return undefined;
  const up = /Concave up/.test(a), xi = /x-intercepts? (.+?);/.exec(a), yi = /y-intercept (−?[\d.]+)/.exec(a), v = /vertex \((−?[\d.]+), (−?[\d.]+)\)/.exec(a), W = RM(a), eq = e[1];
  const k = ri(0, 3);
  if (k === 0 && xi) { const s = xInts(xi[1]); if (s) return Object.assign(base(q, { prompt: RM(`Find the x-intercepts of the parabola ${eq}.`), noDiagram: true, why: W }), s); }
  if (k === 1 && v) return Object.assign(base(q, { prompt: RM(`Find the vertex of the parabola ${eq}.`), noDiagram: true, why: W }), COORD(nn(v[1]), nn(v[2])));
  if (k === 2 && yi) return Object.assign(base(q, { prompt: RM(`What is the y-intercept of the parabola ${eq}?`), noDiagram: true, why: W }), NUM(nn(yi[1]), { pre: "<i>y</i> =" }));
  if (v && k === 3) return Object.assign(base(q, { prompt: RM(`Write the equation of the axis of symmetry of the parabola ${eq}.`), noDiagram: true, why: W }), { mode: "eqn", eqn: "x = " + toExpr(v[1]), keys: ["=", "−"], example: "x = 2", answerHTML: RM("x = " + v[1]) });
  return null;
});
const ENDS = ["Rises to the right, falls to the left", "Falls to the right, rises to the left", "Rises to the right and to the left", "Falls to the right and to the left"];
spec("polynomials", "polynomial-graph-features", q => {
  const a = plain(q.answer), e = /Sketch (.+?), showing/.exec(plain(q.prompt)); if (!e) return undefined;
  const xi = /x-intercepts? ([^;(]+?)(?: \(|;)/.exec(a), yi = /y-intercept (−?[\d.]+)/.exec(a), en = /(rises|falls) to the right, (rises|falls) to the left/.exec(a), W = RM(a), eq = e[1], k = ri(0, 2);
  if (k === 0 && xi) { const s = xInts(xi[1]); if (s) return Object.assign(base(q, { prompt: RM(`Find the x-intercepts of ${eq}.`), noDiagram: true, why: W }), s); }
  if (k === 1 && yi) return Object.assign(base(q, { prompt: RM(`Find the y-intercept of ${eq}.`), noDiagram: true, why: W }), NUM(nn(yi[1]), { pre: "<i>y</i> =" }));
  if (k === 2 && en) { const r = en[1] === "rises" ? (en[2] === "falls" ? 0 : 2) : (en[2] === "rises" ? 1 : 3); return Object.assign(base(q, { prompt: RM(`How does the graph of ${eq} behave at its ends?`), noDiagram: true, why: W }), { mode: "mc", options: ENDS, correct: r, answerHTML: ENDS[r] }); }
  return null;
});
spec("non-linear-relationships-c", "cubic-graphs", (q, ctx) => {
  const a = plain(q.answer), P = plain(q.prompt), W = RM(a); let e;
  if ((e = /cubic (.+?), find/.exec(P))) {
    const xi = /x-intercepts? ([^;]+);/.exec(a), yi = /y-intercept (−?[\d.]+)/.exec(a), up = /rises to the right/.test(a), k = ri(0, 2);
    if (k === 0 && xi) { const s = xInts(xi[1]); if (s) return Object.assign(base(q, { prompt: RM(`Find the x-intercepts of the cubic ${e[1]}.`), noDiagram: true, why: W }), s); }
    if (k === 1 && yi) return Object.assign(base(q, { prompt: RM(`Find the y-intercept of the cubic ${e[1]}.`), noDiagram: true, why: W }), NUM(nn(yi[1]), { pre: "<i>y</i> =" }));
    if (k === 2) return Object.assign(base(q, { prompt: RM(`For large positive values of x, what does the graph of ${e[1]} do?`), noDiagram: true, why: W }), { mode: "mc", options: ["It rises to the right (y → ∞)", "It falls to the right (y → −∞)"], correct: up ? 0 : 1, answerHTML: up ? "It rises to the right (y → ∞)" : "It falls to the right (y → −∞)" });
    return null;
  }
  if ((e = /graph of (.+?) is related to y = x³/.exec(P))) {
    const inf = /point of inflection \((−?[\d.]+), (−?[\d.]+)\)/.exec(a), yi = /y-intercept (−?[\d.]+)/.exec(a), tr = /^(.+?); y-intercept/.exec(a), k = ri(0, 2);
    if (k === 0 && inf) return Object.assign(base(q, { prompt: RM(`Find the coordinates of the point of inflection of ${e[1]}.`), why: W }), COORD(nn(inf[1]), nn(inf[2])));
    if (k === 1 && yi) return Object.assign(base(q, { prompt: RM(`What is the y-intercept of ${e[1]}?`), why: W }), NUM(nn(yi[1]), { pre: "<i>y</i> =" }));
    if (k === 2 && tr) { const pool = [...new Set(ctx.pool().map(s => (/^(.+?); y-intercept/.exec(s) || [])[1]).filter(Boolean))].filter(t => t !== tr[1]); if (pool.length >= 2) return MCQ(q, `How is the graph of ${e[1]} related to the graph of y = x³?`, cap1(tr[1]), shuffle(pool).map(cap1), { why: W }); }
    return null;
  }
  return undefined;
});
spec("functions-graphs", "graph-inequality-region", q => {
  const r = /shade the region (.+?)\.$/.exec(plain(q.prompt)), m = /as a (solid|dashed) line and shade (above|below|to the left of|to the right of) it/.exec(plain(q.answer)); if (!r || !m) return null;
  const sides = /above|below/.test(m[2]) ? ["above", "below"] : ["to the left of", "to the right of"], all = [];
  ["solid", "dashed"].forEach(l => sides.forEach(sd => all.push(`A ${l} boundary line, shaded ${sd} the line`)));
  const right = `A ${m[1]} boundary line, shaded ${m[2]} the line`;
  return mc(base(q, { prompt: RM(`The region ${r[1]} is graphed on the number plane. Which description is correct?`), noDiagram: true, why: RM(q.answer) }), right, all.filter(x => x !== right), { keepOrder: all });
});
spec("functions-graphs", "multiple-inequalities", q => {
  if (!/Write down the three inequalities/.test(q.prompt)) return null;
  const a = plain(q.answer), parts = a.split(/,\s*/); if (parts.length !== 3) return null;
  const flip = s => s.replace(/[<>≤≥]/, c => ({ "<": ">", ">": "<", "≤": "≥", "≥": "≤" }[c]));
  const wrong = [0, 1, 2].map(i => parts.map((p, j) => (j === i ? flip(p) : p)).join(", "));
  return mc(base(q, { prompt: "Which three inequalities together describe the shaded region?" }), a, shuffle(wrong));
});

/* --- Trigonometry --- */
spec("trigonometry-a", "match-trig-ratios", q => {
  const pairs = []; plain(q.answer).split(/;\s*/).forEach(p => { const m = /^(sin|cos|tan) θ → (\w+)\/(\w+)$/.exec(p.trim()); if (m) pairs.push(m); }); if (pairs.length < 3) return undefined;
  const p = pick(pairs), fr = (n, d) => FR_HTML(`<i>${n}</i>`, `<i>${d}</i>`), right = fr(p[2], p[3]);
  const ds = pairs.filter(x => x !== p).map(x => fr(x[2], x[3])).concat([fr(p[3], p[2])]);
  return mc(base(q, { prompt: `Which fraction is equal to ${p[1]} <i>θ</i> in this triangle?` }), right, shuffle(ds), { html: true });
});
spec("trigonometry-a", "similar-constant-ratios", q => {
  const m = /(sine|cosine|tangent) ratios are equal: (\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?) ≈ (\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/.exec(plain(q.answer)), ang = /angle of (\d+)°/.exec(plain(q.prompt)); if (!m || !ang) return undefined;
  const sides = { sine: "opposite ÷ hypotenuse", cosine: "adjacent ÷ hypotenuse", tangent: "opposite ÷ adjacent" }[m[1]], A = Math.random() < 0.5;
  const n = nn(A ? m[2] : m[4]), d = nn(A ? m[3] : m[5]);
  return Object.assign(base(q, { prompt: `The two right-angled triangles are similar and both contain an angle of ${ang[1]}°. Calculate the ${m[1]} ratio (${sides}) for Triangle ${A ? "A" : "B"}, correct to two decimal places.`, why: RM(`${fmt(n)} ÷ ${fmt(d)} ≈ ${(n / d).toFixed(2)}. Both triangles give the same ratio: ${m[2]}/${m[3]} ≈ ${m[4]}/${m[5]}.`) }), NUM(n / d, { dp: 2, answerHTML: (n / d).toFixed(2) }));
});
spec("trigonometry-d", "solve-from-graph", q => {
  const vals = []; plain(q.answer).replace(/x ≈ (−?[\d.]+)°/g, (_, v) => { vals.push(v); }); if (!vals.length) return undefined;
  return Object.assign(base(q), { mode: "set", values: vals, v: "x", pre: "<i>x</i> ≈", unit: "°", tol: 8, keys: [","], placeholder: "e.g. 40, 140", sub: "Type every solution, with a comma between them. Reading from the graph, anything within a few degrees is right.", answerHTML: RM(q.answer) });
});

/* --- Area and surface area --- */
spec("area-and-surface-area-a", "identify-prism-faces", q => {
  const c = (q.diagram && q.diagram.config) || {}, L = parseFloat(c.length), W = parseFloat(c.width), H = parseFloat(c.height), u = (/[a-z]+$/.exec(c.length || "cm") || ["cm"])[0]; if (!L || !W || !H) return undefined;
  const k = ri(0, 3), b = t => base(q, { prompt: t, why: RM(`A rectangular prism has 6 faces in three matching pairs: ${L} × ${W}, ${L} × ${H} and ${W} × ${H}.`) });
  if (k === 0) return Object.assign(b("How many faces does this rectangular prism have?"), NUM(6));
  const [p, r] = pick([[L, W], [L, H], [W, H]]);
  if (k === 1 && new Set([L, W, H]).size === 3) return Object.assign(b(`How many faces of this rectangular prism are ${p} ${u} by ${r} ${u} rectangles?`), NUM(2));
  if (k === 2) return Object.assign(b(`What is the area of one of the ${p} ${u} by ${r} ${u} faces of this prism?`), NUM(p * r, { unit: u + "²" }));
  return Object.assign(b(`How many different sizes of face does this rectangular prism have?`), NUM(new Set([L * W, L * H, W * H].map(String)).size === 3 && new Set([L, W, H]).size === 3 ? 3 : new Set([[L, W], [L, H], [W, H]].map(x => x.slice().sort().join("x"))).size));
});

/* --- Data --- */
spec("data-analysis-a", "effect-on-statistics", q => {
  const P = plain(q.prompt), a = plain(q.answer); let m;
  if ((m = /increased by (\d+)\. What happens to the mean, the median and the standard deviation/.exec(P))) { const k = m[1]; return MCQ(q, P, `The mean and median each increase by ${k}; the standard deviation does not change`, shuffle([`The mean, median and standard deviation all increase by ${k}`, `The mean increases by ${k}; the median and standard deviation do not change`, `None of them change`]), { why: "Adding the same number to every score slides the whole dataset along: the centre moves, the spread stays the same." }); }
  if ((m = /Every score in a dataset is (doubled|tripled|halved)\. What happens to the mean, the (IQR|range|median) and the standard deviation/.exec(P))) return MCQ(q, P, `All three are ${m[1]}`, shuffle([`The mean is ${m[1]}; the ${m[2]} and standard deviation do not change`, `The mean and ${m[2]} are ${m[1]}; the standard deviation does not change`, `None of them change`]), { why: "Multiplying every score by the same number multiplies the centre and the spread by that number." });
  if ((m = /^Mean ([\d.]+), median ([\d.]+), σ ≈ ([\d.]+)/.exec(a))) {
    const stem = P.replace(/\s*Find the new mean, median and σ, and comment\./, "");
    const k = ri(0, 2);
    if (k === 0) return Object.assign(base(q, { prompt: RM(`${stem} Find the new mean, correct to two decimal places.`), why: RM(a) }), NUM(nn(m[1]), { dp: 2 }));
    if (k === 1) return Object.assign(base(q, { prompt: RM(`${stem} Find the new median.`), why: RM(a) }), NUM(nn(m[2])));
    return MCQ(q, `${stem} Which statistic is changed least by the new value?`, "The median", ["The mean", "The standard deviation", "The range"], { why: RM(a), keepOrder: ["The mean", "The median", "The standard deviation", "The range"] });
  }
  return undefined;
});
paper("data-analysis-a", "draw-box-plot");
spec("data-analysis-a", "compare-datasets", q => {
  const m = /^(\w+): mean ([\d.]+), σ ([\d.]+); (\w+): mean ([\d.]+), σ ([\d.]+)\./.exec(plain(q.answer)); if (!m) return undefined;
  const P = cleanPrompt(q.prompt).replace(/\s*Compare their performances using the mean and standard deviation\./, "").replace(/\s*Compare.*$/, ""), k = ri(0, 2), W = RM(q.answer);
  const A = { n: m[1], mean: nn(m[2]), sd: nn(m[3]) }, B2 = { n: m[4], mean: nn(m[5]), sd: nn(m[6]) };
  if (k === 0) return Object.assign(base(q, { prompt: RM(`${P} Who is more consistent (has the smaller standard deviation)?`), why: W }), { mode: "mc", options: [A.n, B2.n], correct: A.sd < B2.sd ? 0 : 1, answerHTML: A.sd < B2.sd ? A.n : B2.n });
  if (k === 1) { const w = pick([A, B2]); return Object.assign(base(q, { prompt: RM(`${P} Find the mean for ${w.n}, correct to one decimal place.`), why: W }), NUM(w.mean, { dp: 1 })); }
  const w = pick([A, B2]); return Object.assign(base(q, { prompt: RM(`${P} Use your calculator to find the standard deviation (σ) for ${w.n}, correct to two decimal places.`), why: W }), NUM(w.sd, { dp: 2, pre: "σ ≈" }));
});
paper("data-analysis-c", "plan-inquiry");
spec("data-analysis-c", "misleading-graph", q => {
  const c = (q.diagram && q.diagram.config) || {}, v = c.values || []; if (!v.length || c.yMin == null) return undefined;
  const first = v[0], last = v[v.length - 1], pct = (last - first) / first * 100;
  if (Math.random() < 0.5) return MCQ(q, cleanPrompt(q.prompt).replace(/Explain why the graph is misleading\./, "What makes the graph misleading?"), `The vertical axis starts at ${c.yMin}, not 0, so small differences look large`, shuffle(["The columns are in the wrong order", "The horizontal axis has no scale", "Column graphs cannot be used for sales figures"]), { why: RM(q.answer) });
  return Object.assign(base(q, { prompt: RM(cleanPrompt(q.prompt).replace(/Explain why the graph is misleading\./, `The sales were ${first} and then ${last}. What was the actual percentage increase from ${c.categories[0]} to ${c.categories[v.length - 1]}, to the nearest whole per cent?`)), why: RM(q.answer) }), NUM(Math.round(pct), { unit: "%", tol: 0.6 }));
});

/* --- Probability --- */
spec("probability-a", "complete-tree", (q, ctx) => {
  const m = /^Missing: (.+?) (\[\[frac:\d+:\d+\]\])/.exec(String(q.answer)); if (!m) return undefined;
  return re(q, ctx, cleanPrompt(q.prompt).replace(/Complete the probability tree\./, `What probability belongs on each “${m[1]}” branch of the tree?`), m[2]);
});
spec("probability-a", "with-vs-without", (q, ctx) => {
  const m = /^\(a\) (.+?); \(b\) (.+?)\. (.+)$/.exec(String(q.answer)), e = /^(.*?Find (P\([^)]+\))) \(a\)/.exec(cleanPrompt(q.prompt)); if (!m || !e) return undefined;
  const A = Math.random() < 0.5;
  return re(q, ctx, `${e[1]} if the first ball is ${A ? "replaced before the second is drawn" : "not replaced"}.`.replace("first ball", /card/.test(e[1]) ? "first card" : /marble/.test(e[1]) ? "first marble" : /counter/.test(e[1]) ? "first counter" : "first one drawn"), A ? m[1] : m[2], { why: RM(q.answer) });
});

/* --- Geometry: a proof becomes "which test?" --- */
const TESTS = ["SSS", "SAS", "AAS", "RHS"];
spec("geometrical-figures-c", "prove-congruent prove-then-deduce prove-quadrilateral-property prove-isosceles-property", q => {
  const a = plain(q.answer), m = /(△\w+ ≡ △\w+) \((SSS|SAS|AAS|RHS)\)/.exec(a); if (!m) return null;
  const sents = plain(q.prompt).split(/(?<=\.)\s+/), given = sents.filter(x => !/prove/i.test(x)).concat(sents.filter(x => /^By drawing (.+?), prove/i.test(x)).map(x => cap1(/^By drawing (.+?), prove/i.exec(x)[1].replace(/^(\w+) perpendicular to (\w+)$/, "$1 is drawn perpendicular to $2")) + ".")).join(" ").replace(/\s*\(a\)\s*$/, "").trim();
  const steps = a.split(/;\s*/).filter(s => !/≡/.test(s) && !/^∴/.test(s));
  return Object.assign(base(q, { prompt: RM(`${given} A proof uses these facts:`) + `<span class="sub">${steps.map(RM).join("<br>")}</span>` + RM(`Which congruence test shows that ${m[1]}?`), why: RM(a) }), { mode: "mc", options: TESTS, correct: TESTS.indexOf(m[2]), answerHTML: m[2] });
});

/* --- second pass: types whose stock conversion asked the wrong thing --- */
spec("algebraic-techniques-a", "expand-and-evaluate", q => {
  const m = /^(.+?); value (−?[\d.]+)$/.exec(plain(q.answer)); if (!m) return undefined;
  return MULTI(q, cleanPrompt(q.prompt), [{ name: "Expanded and simplified", q: { mode: "expr", expr: toExpr(m[1]), form: "expand", keys: ["^", "−"], answerHTML: RM(m[1]) } }, { name: "Value", q: NUM(nn(m[2])) }], q.answer);
});
spec("algebraic-techniques-a", "area-expression", (q, ctx) => {
  const m = /= ([^=]+)$/.exec(plain(q.answer)); if (!m) return undefined;
  return re(q, ctx, cleanPrompt(q.prompt).replace(/Write an expression for its area and expand it\./, "Write an expression for its area, in expanded form."), m[1]);
});
spec("linear-relationships-a", "horizontal-vertical", q => {
  const a = plain(q.answer); if (!/^[xy] = −?[\d.]+$/.test(a)) return undefined;
  return Object.assign(base(q), { mode: "eqn", eqn: toExpr(a), keys: ["=", "−"], example: "y = 3", answerHTML: RM(a) });
});
spec("trigonometry-d", "related-angle", q => (Array.isArray(q.mcDistractors) && q.mcDistractors.length >= 2 ? MCQ(q, cleanPrompt(q.prompt), String(q.answer), shuffle(q.mcDistractors)) : undefined));
spec("trigonometry-d", "obtuse-angle-triangle", q => {
  const m = /^θ ≈ (\d+)° or θ ≈ (\d+)°: (.+)$/.exec(plain(q.answer)); if (!m) return undefined;
  return Object.assign(base(q, { why: RM(m[3]) }), { mode: "set", values: [m[1], m[2]], v: "θ", pre: "<i>θ</i> ≈", unit: "°", tol: 0.5, keys: [","], placeholder: "e.g. 40, 140", sub: "Type both angles, with a comma between them.", answerHTML: RM(`θ ≈ ${m[1]}° or ${m[2]}°`) });
});
spec("variation-b", "sketch-from-story", (q, ctx) => {
  const m = /^Sketch a graph of (.+?) against time for this situation: (.+)$/.exec(plain(q.prompt)); if (!m) return undefined;
  const a = plain(q.answer), others = shuffle(ctx.pool().filter(x => x !== a)).slice(0, 3); if (others.length < 2) return null;
  return MCQ(q, `${m[2]} Which description matches the graph of ${m[1]} against time?`, a, others, { noDiagram: true });
});
spec("logarithms", "log-graph", q => {
  const m = /graph of (y = .+?) is shown\. On the same axes, sketch (y = .+?), and/.exec(plain(q.prompt)); if (!m) return undefined;
  const k = ri(0, 2), pt = /and \((\d+), 1\)/.exec(plain(q.answer));
  if (k === 0 || !pt) return MCQ(q, `The graph of ${m[1]} is shown. How is the graph of ${m[2]} related to it?`, `It is the reflection of ${m[1]} in the line y = x`, shuffle([`It is the reflection of ${m[1]} in the x-axis`, `It is the reflection of ${m[1]} in the y-axis`, `It is ${m[1]} moved 1 unit to the right`]), { why: RM(q.answer) });
  if (k === 1) return Object.assign(base(q, { prompt: RM(`The graph of ${m[1]} is shown. The graph of ${m[2]} is its reflection in the line y = x. Where does ${m[2]} cross the x-axis?`), why: RM(q.answer) }), COORD(1, 0));
  return Object.assign(base(q, { prompt: RM(`The graph of ${m[1]} is shown. The graph of ${m[2]} is its reflection in the line y = x. For what value of x does ${m[2]} have a height of 1?`), why: RM(q.answer) }), NUM(nn(pt[1]), { pre: "<i>x</i> =" }));
});
spec("non-linear-relationships-b", "nonlinear-b-compare-parabolas", q => {
  const m = /^(y = .+?) is narrower\. (y = .+?) is translated (\d+) units? (up|down) compared with (y = .+?)\.$/.exec(plain(q.answer)), e = /parabolas (y = .+?) and (y = .+?) are shown/.exec(plain(q.prompt)); if (!m || !e) return undefined;
  if (Math.random() < 0.5) return Object.assign(base(q, { prompt: RM(`The two parabolas ${e[1]} and ${e[2]} are shown. Which parabola is narrower?`), why: RM(q.answer) }), { mode: "mc", options: [RM(e[1]), RM(e[2])], correct: m[1] === e[1] ? 0 : 1, answerHTML: RM(m[1]) });
  const all = []; ["up", "down"].forEach(d => [m[3], String(nn(m[3]) + 1)].forEach(n => all.push(`${n} units ${d}`)));
  return mc(base(q, { prompt: RM(`How is the parabola ${m[2]} translated compared with ${m[5]}?`), why: RM(q.answer) }), `${m[3]} units ${m[4]}`, all.filter(x => x !== `${m[3]} units ${m[4]}`), { keepOrder: all });
});
spec("non-linear-relationships-c", "parabola-transformations", q => {
  const P = plain(q.prompt), a = plain(q.answer), m = /onto (y = .+?), and state the vertex/.exec(P), v = /^(.+?)\. Vertex \((−?\d+), (−?\d+)\)\.$/.exec(a); if (!m || !v) return undefined;
  if (Math.random() < 0.4) return Object.assign(base(q, { prompt: RM(`The parabola y = x² is transformed to give ${m[1]}. State the vertex of the new parabola.`), why: RM(a) }), COORD(nn(v[2]), nn(v[3])));
  const sw = (t, x, y) => t.replace(new RegExp(x + "|" + y, "g"), w => (w === x ? y : x)), lr = /left|right/.test(v[1]), ud = /\bup\b|\bdown\b/.test(v[1]), rf = /reflected in the x-axis/.test(v[1]);
  const ds = [];
  if (lr) ds.push(sw(v[1], "left", "right")); if (ud) ds.push(sw(v[1], "up", "down")); if (lr && ud) ds.push(sw(sw(v[1], "left", "right"), "up", "down"));
  ds.push(rf ? v[1].replace(/,? then reflected in the x-axis|reflected in the x-axis,? then /i, "") : (/^Dilated/.test(v[1]) ? v[1].replace(/^(Dilated[^,]+), then /, "$1, then reflected in the x-axis, then ") : "Reflected in the x-axis, then " + lower1(v[1])));
  return MCQ(q, `Which transformations map y = x² onto ${m[1]}?`, cap1(v[1]), shuffle(ds.filter(Boolean).map(cap1)).slice(0, 3), { why: RM(a) });
});
spec("non-linear-relationships-b", "nonlinear-b-exponential-features", q => {
  const m = /^y-intercept \(0, (−?[\d.]+)\); horizontal asymptote (y = −?[\d.]+); (growth|decay)$/.exec(plain(q.answer)), e = /curve (y = .+?), state/.exec(plain(q.prompt)); if (!m || !e) return undefined;
  const k = ri(0, 2), W = RM(q.answer);
  if (k === 0) return Object.assign(base(q, { prompt: RM(`What is the y-intercept of the exponential curve ${e[1]}?`), why: W }), NUM(nn(m[1]), { pre: "<i>y</i> =" }));
  if (k === 1) return Object.assign(base(q, { prompt: RM(`Write the equation of the horizontal asymptote of ${e[1]}.`), why: W }), { mode: "eqn", eqn: toExpr(m[2]), keys: ["=", "−"], example: "y = 2", answerHTML: RM(m[2]) });
  return Object.assign(base(q, { prompt: RM(`Does the exponential curve ${e[1]} show growth or decay?`), why: W }), { mode: "mc", options: ["Growth", "Decay"], correct: m[3] === "growth" ? 0 : 1, answerHTML: cap1(m[3]) });
});
spec("non-linear-relationships-c", "circle-complete-square", q => {
  const m = /^(.+?): centre \((−?[\d.]+), (−?[\d.]+)\), radius (.+)$/.exec(plain(q.answer)); if (!m) return undefined;
  const r = read(m[4], ""); if (!r) return null;
  return MULTI(q, cleanPrompt(q.prompt), [{ name: "Centre", q: COORD(nn(m[2]), nn(m[3])) }, { name: "Radius", q: r }], q.answer, { why: RM(m[1]) + (why(q) ? " &nbsp;·&nbsp; " + why(q) : "") });
});
spec("polynomials", "divide-polynomial", q => {
  const m = /^Q\(x\) = (.+?), R = (−?\d+):/.exec(plain(q.answer)); if (!m) return undefined;
  return MULTI(q, cleanPrompt(q.prompt).replace(/Write P\(x\) in the form .+$/, "Find the quotient Q(x) and the remainder R."), [{ name: "", q: { mode: "expr", expr: toExpr(m[1]), form: "expand", pre: "Q(<i>x</i>) =", keys: ["^", "−"], answerHTML: RM(m[1]) } }, { name: "", q: NUM(nn(m[2]), { pre: "R =" }) }], q.answer);
});
spec("probability-a", "list-sample-space", (q, ctx) => {
  const a = String(q.answer), m = /^(.+?); P = .*?(\[\[frac:\d+:\d+\]\])$/.exec(a), e = /^(.*?) List the sample space and find (P\(.+\))\.$/.exec(cleanPrompt(q.prompt)); if (!m || !e) return undefined;
  const n = m[1].split(/,\s*/).length;
  if (Math.random() < 0.35) return Object.assign(base(q, { prompt: RM(`${e[1]} How many outcomes are in the sample space?`), why: RM(m[1]) }), NUM(n));
  return re(q, ctx, `${e[1]} Find ${e[2]}.`, m[2], { why: RM(a) });
});
spec("numbers-of-any-magnitude", "si-prefixes", (q, ctx) => {
  const a = String(q.answer).replace(/\s*\(.*\)$/, ""); if (!/^10[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+$/.test(a)) return undefined;
  const P = cleanPrompt(q.prompt);
  return re(q, ctx, /power of 10/.test(P) ? P : P + " Give your answer as a power of 10.", a);
});
/* --- data: collecting and reporting --- */
spec("data-analysis-a", "standard-deviation", q => {
  const m = /^Mean ([\d.]+), σ ≈ ([\d.]+)$/.exec(plain(q.answer)); if (!m) return undefined;
  return MULTI(q, cleanPrompt(q.prompt), [{ name: "Mean", q: NUM(nn(m[1]), { dp: 2 }) }, { name: "Standard deviation", q: NUM(nn(m[2]), { dp: 2, pre: "σ ≈" }) }], q.answer);
});
spec("data-analysis-a", "interpret-sd", q => {
  const m = /^Both have the same average, but (Class [AB])'s results are more consistent/.exec(plain(q.answer)); if (!m) return undefined;
  const opts = ["Class A", "Class B", "They were equally consistent"];
  return Object.assign(base(q, { prompt: RM(cleanPrompt(q.prompt).replace(/What does this tell you\?/, "Which class had the more consistent results?")), why: RM(q.answer) }), { mode: "mc", options: opts, correct: opts.indexOf(m[1]), answerHTML: m[1] });
});
spec("data-analysis-b", "plot-scatter", q => {
  const m = /(positive|negative), (strong|moderate|weak), linear association/.exec(plain(q.answer)); if (!m) return undefined;
  const all = []; ["positive", "negative"].forEach(d => [m[2], m[2] === "weak" ? "strong" : "weak"].forEach(st => all.push(`A ${st}, ${d}, linear association`)));
  const right = `A ${m[2]}, ${m[1]}, linear association`;
  return mc(base(q, { prompt: "The data in the table are plotted on a scatter plot. Which describes the association?", noDiagram: true, why: RM(q.answer.replace(/^Points plotted; /, "")) }), right, all.filter(x => x !== right), { keepOrder: all });
});
spec("data-analysis-c", "population-sample", q => {
  const a = plain(q.answer), m = /^Population: (.+?); sample: (.+?)\.(?: \(.*\))?$/.exec(a), P = cleanPrompt(q.prompt).replace(/\s*Identify the population and the sample \(or say if it is a census\)\./, "");
  if (!m) { if (/census/i.test(a)) return Object.assign(base(q, { prompt: RM(P + " Is this a sample or a census?"), why: RM(a) }), { mode: "mc", options: ["A sample", "A census"], correct: 1, answerHTML: "A census" }); return undefined; }
  const pop = Math.random() < 0.5;
  return MCQ(q, `${P} What is the ${pop ? "population" : "sample"}?`, cap1(pop ? m[1] : m[2]), shuffle([cap1(pop ? m[2] : m[1]), "The people who ran the survey", "The answers that were collected"]), { why: RM(a) });
});
spec("data-analysis-c", "question-wording", (q, ctx) => {
  const a = plain(q.answer), m = /^([^:]+): (.+)$/.exec(a) || (/options overlap/.test(a) ? [a, "Options", a] : /^Loaded words/.test(a) ? [a, "Loaded words", a] : null), e = /^What is wrong with this survey question, and how could it be improved\? (.+)$/.exec(plain(q.prompt)); if (!m || !e) return undefined;
  const FAULT = { Leading: "It is a leading question: it pushes people towards one answer", Loaded: "It uses loaded words that assume an answer", "Loaded words": "It uses loaded words that assume an answer", "Two questions in one": "It asks two questions at once", "Double-barrelled": "It asks two questions at once", Vague: "It is vague: people will read it in different ways", Ambiguous: "It is vague: people will read it in different ways", Options: "The answer options overlap or leave some answers out" };
  const head = m[1].replace(/\s*\(.*\)$/, "").trim(), right = FAULT[head] || FAULT[head.split(" ")[0]]; if (!right) return null;
  return MCQ(q, `What is wrong with this survey question? ${e[1]}`, right, shuffle([...new Set(Object.values(FAULT))].filter(x => x !== right)), { why: RM(a) });
});
spec("data-analysis-c", "systematic-sample", q => {
  const m = /^Every (\d+)(?:st|nd|rd|th) name: (\d+), (\d+), (\d+)$/.exec(plain(q.answer)); if (!m) return undefined;
  return MULTI(q, cleanPrompt(q.prompt).replace(/What is the sampling interval, and what are the next three numbers chosen\?/, "Find the sampling interval and the next number chosen."), [{ name: "Sampling interval", q: NUM(nn(m[1])) }, { name: "Next number chosen", q: NUM(nn(m[2])) }], q.answer);
});
spec("data-analysis-c", "stratified-sample", q => {
  const parts = plain(q.answer).split(/,\s*/).map(p => /^(.+?): (\d+)$/.exec(p)); if (parts.length < 2 || parts.some(p => !p)) return undefined;
  return MULTI(q, cleanPrompt(q.prompt), parts.map(p => ({ name: p[1], q: NUM(nn(p[2])) })), q.answer);
});
const BIAS = { ss: "Only people who choose to take part are counted (a self-selected sample)", un: "The people asked are not typical of the whole population", nr: "Most people did not reply, and those who did may be different (non-response)", uc: "The time and method leave some groups out, so they are under-represented", qw: "The question is worded to push people towards one answer", big: "Too many people were asked" };
spec("data-analysis-c", "identify-bias", q => {
  const e = /^Explain why this survey may give biased results\. (.+)$/.exec(plain(q.prompt)), a = plain(q.answer); if (!e) return undefined;
  const k = /^Self-selected/.test(a) ? ["ss", "nr", "uc", "qw"] : /^(Unrepresentative|Biased) sample/.test(a) ? ["un", "nr", "uc", "qw"] : /^Non-response/.test(a) ? ["nr", "uc", "qw", "big"] : /under-represented/.test(a) ? ["uc", "nr", "ss", "qw"] : null;
  if (!k) return MCQ(q, `${e[1]} Why might this survey give biased results?`, a, shuffle([BIAS.qw, BIAS.big, BIAS.nr]));
  return MCQ(q, `${e[1]} Why might this survey give biased results?`, BIAS[k[0]], shuffle(k.slice(1).map(x => BIAS[x])), { why: RM(a) });
});
const CLAIM = { coi: "A tiny sample, and the people asked had a reason to answer one way", cause: "A small sample, and an association is being treated as cause and effect", ss: "The people in the sample chose themselves, so they are not typical", mean: "The mean is distorted by a few very large values; the median would be fairer", paid: "The people asked were paid to give that answer", small: "The sample is too small to work out an average", all: "Everyone in the population was asked, so it is not a sample" };
spec("data-analysis-c", "evaluate-claim", q => {
  const e = /^Evaluate this claim: (.+)$/.exec(plain(q.prompt)), a = plain(q.answer); if (!e) return undefined;
  const k = /conflict of interest/.test(a) ? ["coi", "mean", "ss", "cause"] : /causation/.test(a) ? ["cause", "paid", "mean", "all"] : /^Self-selected/.test(a) ? ["ss", "cause", "mean", "all"] : /mean is pulled/.test(a) ? ["mean", "ss", "cause", "small"] : null;
  if (!k) return MCQ(q, `${e[1]} What is the main problem with this claim?`, a, shuffle([CLAIM.all, CLAIM.small, CLAIM.paid]));
  return MCQ(q, `${e[1]} What is the main problem with this claim?`, CLAIM[k[0]], shuffle(k.slice(1).map(x => CLAIM[x])), { why: RM(a) });
});
spec("data-analysis-b", "causation", q => {
  let P = cleanPrompt(q.prompt).replace(/\s*Explain\.?$/, "").trim(); if (!/\?$/.test(P)) P += " Does this show that one causes the other?";
  return MCQ(q, P, "Not necessarily: another factor may explain both. An association does not show cause and effect", shuffle(["Yes: a strong association means that one causes the other", "Yes: the variable on the horizontal axis always causes the change in the other", "No: two variables that are not cause and effect cannot be associated"]), { why: RM(q.answer) });
});

/* --- third pass: variants the stock conversion could not read --- */
spec("algebraic-techniques-c", "complete-the-square", q => {
  const add = /^(\d+); .+=.+$/.exec(plain(q.answer));
  if (add && /What must be added/.test(q.prompt)) return Object.assign(base(q, { why: RM(q.answer) }), NUM(nn(add[1])));
  const m = /^Complete the square: (.+)$/.exec(plain(q.prompt)), a = /^(−?[\d./]+); (−?[\d./]+)$/.exec(plain(q.answer)); if (!m || !a || (m[1].match(/___/g) || []).length !== 2) return undefined;
  let k = 0; const shown = m[1].replace(/___/g, () => (k++ ? "△" : "▢")), f1 = read(a[1], ""), f2 = read(a[2], ""); if (!f1 || !f2) return null;
  return MULTI(q, `Complete the square by finding the two missing numbers: ${shown}`, [{ name: "", q: Object.assign(f1, { pre: "▢ =" }) }, { name: "", q: Object.assign(f2, { pre: "△ =" }) }], `▢ = ${a[1]}, △ = ${a[2]}`);
});
spec("equations-b", "x-squared-equals-k", q => {
  const m = /^How many real solutions does (.+?) have\?/.exec(plain(q.prompt)); if (!m) return undefined;
  const a = plain(q.answer), opts = ["None", "One", "Two"], c = /^None/.test(a) ? 0 : /^One/.test(a) ? 1 : /^Two/.test(a) ? 2 : -1; if (c < 0) return null;
  return Object.assign(base(q, { prompt: RM(`How many real solutions does ${m[1]} have?`), why: RM(a) }), { mode: "mc", options: opts, correct: c, answerHTML: opts[c] });
});
spec("equations-b", "quadratic-problems", (q, ctx) => { const a = String(q.answer), m = /^[^;]*=[^;]*; (.+)$/.exec(a); return m && /[a-z]{4}/.test(m[1]) ? re(q, ctx, cleanPrompt(q.prompt), m[1], { why: RM(a) + (why(q) ? " &nbsp;·&nbsp; " + why(q) : "") }) : undefined; });
spec("non-linear-relationships-c", "line-curve-intersection", q => {
  const a = plain(q.answer), m = /^\((−?[\d.]+), (−?[\d.]+)\) and \((−?[\d.]+), (−?[\d.]+)\)$/.exec(a); if (!m) return undefined;
  if (Array.isArray(q.mcDistractors) && q.mcDistractors.length >= 2) return MCQ(q, cleanPrompt(q.prompt), a, shuffle(q.mcDistractors));
  const neg = v => (v.startsWith("−") ? v.slice(1) : v === "0" ? "0" : "−" + v);
  const ds = [`(${m[2]}, ${m[1]}) and (${m[4]}, ${m[3]})`, `(${neg(m[1])}, ${m[2]}) and (${neg(m[3])}, ${m[4]})`, `(${m[1]}, ${neg(m[2])}) and (${m[3]}, ${neg(m[4])})`, `(${m[3]}, ${m[4]}) only`].filter(d => normW(d) !== normW(a));
  return MCQ(q, cleanPrompt(q.prompt), a, shuffle([...new Set(ds)]).slice(0, 3));
});
spec("logarithms", "log-laws-expand", q => {
  const m = /^Expand (log\S*) √(\w) using the log laws\.$/.exec(plain(q.prompt)); if (!m) return undefined;
  return mc(base(q), String(q.answer), shuffle([`2${m[1]} ${m[2]}`, `${m[1]} ${m[2]} − 2`, `${m[1]} [[frac:${m[2]}:2]]`]));
});
spec("functions-graphs", "substitute-expression", q => {
  const m = /^(f\(.+?\)) = (.+?); (yes|no)\b/i.exec(plain(q.answer)), e = /^(.*?find f\(.+?\))\. Is (.+?)\?$/.exec(plain(q.prompt)); if (!m || !e) return undefined;
  const yes = /^yes/i.test(m[3]);
  return MULTI(q, `${e[1]}. Then decide: is ${e[2]}?`, [{ name: "", q: { mode: "expr", expr: toExpr(m[2]), form: "expand", pre: RM(m[1]) + " =", keys: ["^", "−"], answerHTML: RM(m[2]) } }, { name: `Is ${RM(e[2])}?`, q: { mode: "mc", options: ["Yes", "No"], correct: yes ? 0 : 1 } }], q.answer);
});
spec("functions-graphs", "domain-range-graph", q => {
  const a = plain(q.answer), m = /^Domain: (.+?) ([≤<]) x ([≤<]) (.+?); range: (.+?) ([≤<]) y ([≤<]) (.+)$/.exec(a); if (!m) return undefined;
  if (Array.isArray(q.mcDistractors) && q.mcDistractors.length >= 2) return MCQ(q, cleanPrompt(q.prompt), a, shuffle(q.mcDistractors));
  const ds = [`Domain: ${m[5]} ${m[6]} x ${m[7]} ${m[8]}; range: ${m[1]} ${m[2]} y ${m[3]} ${m[4]}`, `Domain: all real x; range: ${m[5]} ${m[6]} y ${m[7]} ${m[8]}`, `Domain: ${m[1]} ${m[2]} x ${m[3]} ${m[4]}; range: all real y`].filter(d => normW(d) !== normW(a));
  return MCQ(q, cleanPrompt(q.prompt), a, shuffle(ds));
});
spec("trigonometry-a", "mixed-trigonometry", (q, ctx) => (/Draw a line to match/.test(q.prompt) ? SPEC["trigonometry-a"]["match-trig-ratios"](q, ctx) : undefined));
spec("introduction-to-networks", "sum-of-degrees", q => {
  const m = /^Is it possible to draw a network whose vertices have degrees ([\d, ]+)\?/.exec(plain(q.prompt)); if (!m) return undefined;
  const sum = m[1].split(/,\s*/).reduce((t, v) => t + nn(v), 0), yes = sum % 2 === 0;
  return Object.assign(base(q, { prompt: RM(`Is it possible to draw a network whose vertices have degrees ${m[1]}?`), why: RM(q.answer) }), { mode: "mc", options: ["Yes", "No"], correct: yes ? 0 : 1, answerHTML: yes ? "Yes" : "No" });
});
spec("data-analysis-a", "outliers", q => {
  const a = plain(q.answer), d = /the data ([\d, ]+?) contains/.exec(plain(q.prompt)), f = /\((?:outside|all within) (−?-?[\d.]+) to (−?-?[\d.]+)\)/.exec(a); if (!d || !f) return undefined;
  const data = d[1].split(/,\s*/).map(nn), lo = Math.min(...data), hi = Math.max(...data), o = /^Outliers?: ([\d, and]+?) \(/.exec(a);
  const opts = ["There are no outliers", `${lo} is the only outlier`, `${hi} is the only outlier`, `${lo} and ${hi} are both outliers`];
  let c = 0; if (o) { const vals = o[1].split(/,\s*|\s+and\s+/).map(nn); c = vals.includes(lo) && vals.includes(hi) ? 3 : vals.length === 1 && vals[0] === lo ? 1 : vals.length === 1 && vals[0] === hi ? 2 : -1; }
  if (c < 0) return null;
  const k = Math.random();
  if (k < 0.3) return MULTI(q, `For the data ${d[1]}, use the 1.5 × IQR rule to find the lower and upper fences (the values beyond which a score is an outlier).`, [{ name: "Lower fence", q: NUM(nn(f[1].replace("-", "−"))) }, { name: "Upper fence", q: NUM(nn(f[2])) }], `${f[1]} and ${f[2]}`, { why: why(q) });
  return Object.assign(base(q, { why: RM(a) + (why(q) ? " &nbsp;·&nbsp; " + why(q) : "") }), { mode: "mc", options: opts, correct: c, answerHTML: opts[c] });
});
spec("probability-b", "shade-venn", (q, ctx) => {
  const m = /^Shade the region (.+?) on the Venn diagram\.$/.exec(plain(q.prompt)), a = /^Shade: (.+)$/.exec(plain(q.answer)); if (!m || !a) return undefined;
  const all = ["A only", "B only", "The overlap", "Outside both circles", "A only and B only", "A only, B only and the overlap", "B only and outside both circles", "A only and outside both circles"];
  const tidy = t => { const p = t.split(/,\s*/); return cap1(p.length > 1 ? p.slice(0, -1).join(", ") + " and " + p[p.length - 1] : p[0]); }, right = tidy(a[1]);
  return MCQ(q, `Which part (or parts) of a two-circle Venn diagram should be shaded to show ${m[1]}?`, right, shuffle(all.filter(x => normW(x) !== normW(right))).slice(0, 3), { noDiagram: false });
});

/* --- two types whose bank answer never changes: mix in statements that go the other way --- */
spec("area-and-surface-area-a", "recognise-valid-nets", q => {
  if (Math.random() < 0.3) return undefined;
  const k = ri(0, 2);
  if (k === 0) { const st = pick([["The net of a rectangular prism is made of 6 rectangles.", true], ["The net of a triangular prism is made of 2 triangles and 3 rectangles.", true], ["The net of a closed cylinder is made of 2 circles and 1 rectangle.", true], ["Any six rectangles joined edge to edge will fold into a rectangular prism.", false], ["The net of a triangular prism is made of 3 triangles and 2 rectangles.", false], ["In the net of a rectangular prism, the rectangles come in three matching pairs.", true], ["The area of a net is larger than the surface area of the solid it folds into.", false], ["The net of a cube is made of 4 squares.", false]]); return { prompt: "True or false? " + st[0], diagram: null, mode: "tf", truth: st[1], answerHTML: st[1] ? "True" : "False", why: "A net shows every face of the solid once, laid flat: its area is the surface area." }; }
  const s2 = pick([["rectangular prism", 6], ["triangular prism", 5], ["cube", 6], ["closed cylinder", 3], ["trapezoidal prism", 6], ["pentagonal prism", 7], ["hexagonal prism", 8]]);
  return { prompt: `How many faces are drawn in the net of a ${s2[0]}?`, diagram: null, mode: "num", value: s2[1], why: s2[0] === "closed cylinder" ? "Two circles and one rectangle (the curved surface, unrolled)." : `A ${s2[0]} has two matching ends and a rectangle for each side of the end: ${s2[1]} faces in all.` };
});
spec("geometrical-figures-b", "not-a-test", q => {
  if (Math.random() < 0.5) return undefined;
  const c = pick([["three pairs of equal sides", "SSS"], ["two pairs of equal sides and the angles between those sides equal", "SAS"], ["two pairs of equal angles and a pair of matching sides equal", "AAS"], ["a right angle each, equal hypotenuses and one other pair of equal sides", "RHS"]]);
  return { prompt: `Two triangles have ${c[0]}. Must they be congruent?`, diagram: null, mode: "mc", options: ["Yes", "No"], correct: 0, answerHTML: "Yes", why: `Yes: this is the ${c[1]} congruence test.` };
});

/* --- Networks: the bank has a handful of fixed pictures, so the quiz draws its own graphs --- */
const LET = "ABCDEFGH";
/* a connected planar graph: n vertices round an oval, the rim (some of it) plus chords that never cross */
function randGraph(o = {}) {
  const n = o.n || ri(5, 7), ids = LET.slice(0, n).split(""), tilt = Math.random() * Math.PI * 2;
  const nodes = ids.map((id, i) => { const t = tilt + i * 2 * Math.PI / n, wob = () => (Math.random() - 0.5) * 26; return { id, x: Math.round(360 + 215 * Math.cos(t) + wob()), y: Math.round(210 + 138 * Math.sin(t) + wob()) }; });
  const E = new Set(), key = (a, b) => (a < b ? a + "-" + b : b + "-" + a);
  for (let i = 0; i < n; i++) E.add(key(i, (i + 1) % n));
  const cross = (a, b, c, d) => { const btw = (x, lo, hi) => x > lo && x < hi; [a, b] = [Math.min(a, b), Math.max(a, b)]; [c, d] = [Math.min(c, d), Math.max(c, d)]; return (btw(c, a, b) && !btw(d, a, b) && d !== a && d !== b) || (btw(d, a, b) && !btw(c, a, b) && c !== a && c !== b); };
  const chords = []; let want = o.chords != null ? o.chords : ri(1, n - 3), guard = 0;
  while (chords.length < want && guard++ < 80) { const a = ri(0, n - 1), b = ri(0, n - 1); if (a === b || E.has(key(a, b)) || chords.some(c => cross(a, b, c[0], c[1]))) continue; chords.push([a, b]); E.add(key(a, b)); }
  // drop one or two rim edges, keeping the graph in one piece (a rim edge whose two ends both keep another edge and still connect)
  let drop = o.drop != null ? o.drop : ri(0, 1);
  const edgesOf = () => [...E].map(k => k.split("-").map(Number));
  const connected = () => { const adj = ids.map(() => []); edgesOf().forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); }); const seen = new Set([0]), st = [0]; while (st.length) { const v = st.pop(); adj[v].forEach(w => { if (!seen.has(w)) { seen.add(w); st.push(w); } }); } return seen.size === n; };
  guard = 0;
  while (drop > 0 && guard++ < 20) { const i = ri(0, n - 1), k = key(i, (i + 1) % n); if (!E.has(k)) continue; E.delete(k); if (connected()) drop--; else E.add(k); }
  const edges = edgesOf().map(([a, b]) => [ids[a], ids[b]]);
  const deg = {}; ids.forEach(id => { deg[id] = 0; }); edges.forEach(([a, b]) => { deg[a]++; deg[b]++; });
  const adj = {}; ids.forEach(id => { adj[id] = []; }); edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });
  return { ids, nodes, edges, deg, adj, odd: ids.filter(id => deg[id] % 2), graph: { nodes, edges } };
}
const netDiag = (G, extra = {}) => ({ engine: "network-engine", config: Object.assign({ diagramType: "graph", graph: G.graph }, extra), scale: 1, maxH: 380, caption: "" });
const NQ = (prompt, G, ans, w, extra) => Object.assign({ prompt, diagram: G ? netDiag(G, extra) : null, why: w }, ans);
const seqStr = sq => sq.join("–");

spec("introduction-to-networks", "vertices-edges-degree", () => {
  const G = randGraph(), k = ri(0, 3), v = G.ids.length, e = G.edges.length;
  if (k === 0) return NQ("For the network shown, state the number of vertices and the number of edges.", G, multi([{ name: "Vertices", q: NUM(v) }, { name: "Edges", q: NUM(e) }], `${v} vertices and ${e} edges`), `Count the labelled points (${v}) and the lines joining them (${e}).`);
  if (k === 1) { const x = pick(G.ids); return NQ(`For the network shown, find the degree of vertex ${x}.`, G, NUM(G.deg[x]), `The degree is the number of edges that meet at the vertex: ${G.deg[x]} edges meet at ${x} (to ${G.adj[x].sort().join(", ")}).`, { diagramType: "degree-graph", vertex: x }); }
  if (k === 2) { const mx = Math.max(...G.ids.map(i => G.deg[i])), top = G.ids.filter(i => G.deg[i] === mx); if (top.length !== 1) return null; return Object.assign(NQ("Which vertex of this network has the highest degree?", G, {}, `Degrees: ${G.ids.map(i => `${i} ${G.deg[i]}`).join(", ")}.`), { mode: "mc", options: G.ids, correct: G.ids.indexOf(top[0]), answerHTML: top[0] }); }
  return NQ("How many vertices of this network have an odd degree?", G, NUM(G.odd.length), `Degrees: ${G.ids.map(i => `${i} ${G.deg[i]}`).join(", ")}. Odd: ${G.odd.length ? G.odd.join(", ") : "none"}.`);
});
spec("introduction-to-networks", "network-from-table", (q, ctx) => {
  const pairs = []; plain(q.answer).split(/,\s*/).forEach(p => { const m = /^([A-H]): (\d+)$/.exec(p.trim()); if (m) pairs.push(m); }); if (pairs.length < 3) return undefined;
  const P = cleanPrompt(q.prompt).replace(/\s*Draw the network, and state the degree of each vertex\./, "");
  if (Math.random() < 0.5) { const p = pick(pairs); return Object.assign(base(q, { prompt: RM(`${P} What is the degree of vertex ${p[1]} in the network?`), why: RM("Count the roads that leave the town: " + q.answer) }), NUM(nn(p[2]))); }
  const tot = pairs.reduce((t, p) => t + nn(p[2]), 0);
  return Object.assign(base(q, { prompt: RM(`${P} How many edges does the network have?`), why: RM(`Each road is listed twice in the table. Degrees ${q.answer}: sum ${tot}, so ${tot / 2} edges.`) }), NUM(tot / 2));
});
spec("introduction-to-networks", "same-graph-different-drawings", (q) => {
  if (Math.random() < 0.5) return MCQ(q, "The two diagrams show the same graph drawn in different ways. Why are they the same graph?", "They have the same vertices, and the same pairs of vertices are joined by edges", shuffle(["The vertices are in the same positions in both drawings", "Both drawings have the same overall shape", "The edges are the same length in both drawings"]), { why: RM(q.answer) });
  const st = pick([["Two drawings show the same graph only if the vertices are in the same positions.", false], ["Moving a vertex, without changing which vertices are joined, gives a drawing of the same graph.", true], ["A graph is determined by its vertices and which pairs are joined, not by how it is drawn.", true], ["If an edge is drawn curved instead of straight, it becomes a different graph.", false]]);
  return Object.assign(base(q, { prompt: "True or false? " + st[0] }), { mode: "tf", truth: st[1], answerHTML: st[1] ? "True" : "False" });
});
spec("introduction-to-networks", "planar-and-non-planar", q => {
  const P = plain(q.prompt);
  if (/still planar/.test(P)) return MCQ(q, "The left drawing has edges that cross. Why is this graph still planar?", "It can be redrawn so that no two edges cross", shuffle(["Every graph with five vertices is planar", "Its edges are all straight lines", "It has the same number of vertices and edges"]), { why: RM(q.answer) });
  if (/Define a planar graph/.test(P)) return MCQ(q, "Which statement defines a planar graph?", "A graph that can be drawn so that no two edges cross", shuffle(["A graph that is drawn with no curved edges", "A graph in which every vertex has the same degree", "A graph with more edges than vertices"]), { why: RM(q.answer) });
  return Object.assign(base(q, { prompt: "True or false? If a drawing of a graph has two edges that cross, the graph must be non-planar." }), { mode: "tf", truth: false, answerHTML: "False" });
});
spec("introduction-to-networks", "faces-and-euler-formula", q => {
  const P = plain(q.prompt), k = ri(0, 4);
  if (k === 0 && /state v, e and f/.test(P)) { const m = /v = (\d+), e = (\d+), f = (\d+)/.exec(plain(q.answer)); if (m) return Object.assign(base(q, { prompt: "For the planar graph shown, state the number of vertices (<i>v</i>), edges (<i>e</i>) and faces (<i>f</i>). Count the outside region as a face." }), multi([{ name: "", q: NUM(nn(m[1]), { pre: "<i>v</i> =" }) }, { name: "", q: NUM(nn(m[2]), { pre: "<i>e</i> =" }) }, { name: "", q: NUM(nn(m[3]), { pre: "<i>f</i> =" }) }], q.answer)); }
  if (k === 1) { const G = randGraph({ drop: 0 }), v = G.ids.length, e = G.edges.length, f = e - v + 2; return NQ("How many faces does this planar graph have? Count the outside region as a face.", G, NUM(f), `Count the regions, or use Euler’s formula: v − e + f = 2, so ${v} − ${e} + f = 2 and f = ${f}.`); }
  const v = ri(4, 12), f = ri(3, 9), e = v + f - 2, miss = pick(["f", "v", "e"]);
  if (miss === "f") return NQ(`A connected planar graph has ${v} vertices and ${e} edges. Use Euler’s formula to find the number of faces.`, null, NUM(f, { pre: "<i>f</i> =" }), `v − e + f = 2 &nbsp;·&nbsp; ${v} − ${e} + f = 2 &nbsp;·&nbsp; f = ${f}`);
  if (miss === "v") return NQ(`A connected planar graph has ${f} faces and ${e} edges. Use Euler’s formula to find the number of vertices.`, null, NUM(v, { pre: "<i>v</i> =" }), `v − e + f = 2 &nbsp;·&nbsp; v − ${e} + ${f} = 2 &nbsp;·&nbsp; v = ${v}`);
  return NQ(`A connected planar graph has ${v} vertices and ${f} faces. Use Euler’s formula to find the number of edges.`, null, NUM(e, { pre: "<i>e</i> =" }), `v − e + f = 2 &nbsp;·&nbsp; ${v} − e + ${f} = 2 &nbsp;·&nbsp; e = ${e}`);
});
/* a walk on G of a chosen kind: "walk" repeats an edge, "trail" repeats a vertex but no edge, "path" repeats nothing, "cycle" closes up */
function walkOf(G, kind) {
  const ek = (a, b) => (a < b ? a + b : b + a);
  for (let t = 0; t < 200; t++) {
    const sq = [pick(G.ids)], usedE = new Set(); let ok = true;
    const len = kind === "path" ? ri(3, 4) : ri(4, 5);
    for (let i = 0; i < len && ok; i++) {
      const at = sq[sq.length - 1]; let opts = G.adj[at];
      if (kind === "path") opts = opts.filter(v => !sq.includes(v));
      else if (kind === "cycle") opts = opts.filter(v => !usedE.has(ek(at, v)) && (!sq.includes(v) || (v === sq[0] && sq.length >= 3)));
      else if (kind === "trail") opts = opts.filter(v => !usedE.has(ek(at, v)));
      if (!opts.length) { ok = false; break; }
      const nx = pick(opts); usedE.add(ek(at, nx)); sq.push(nx);
      if (kind === "cycle" && nx === sq[0]) break;
    }
    if (!ok) continue;
    const edges = sq.slice(1).map((v, i) => ek(sq[i], v)), repE = new Set(edges).size < edges.length, inner = sq.slice(0, -1), closed = sq[0] === sq[sq.length - 1];
    const repV = new Set(closed ? inner : sq).size < (closed ? inner : sq).length;
    const is = repE ? "walk" : (closed && !repV) ? "cycle" : repV || closed ? "trail" : "path";
    if (kind === "walk" && !repE) { // force a repeated edge: go back along the last edge
      const sq2 = sq.slice(0, 3).concat([sq[1], sq[2]]); if (sq2.length === 5) return sq2; continue; }
    if (is === kind && sq.length >= 4) return sq;
  }
  return null;
}
const WALK_OPTS = ["A walk only: an edge is repeated", "A trail, but not a path: no edge is repeated, but a vertex is", "A path: no vertex or edge is repeated", "A cycle: it returns to its start and repeats no other vertex"];
spec("introduction-to-networks", "connected-walk-trail-path-cycle", q => {
  const P = plain(q.prompt), k = ri(0, 5);
  if (k === 0 && /Which graph shown is connected/.test(P)) return Object.assign(base(q, { prompt: "Which graph is connected?" }), { mode: "mc", options: ["Graph A", "Graph B"], correct: 0, answerHTML: "Graph A" });
  if (k === 1) { const d = pick([["What is the difference between a walk and a trail?", "A trail is a walk that repeats no edge", ["A trail is a walk that visits every vertex", "A trail is a walk that ends where it starts", "A walk is a trail that repeats no vertex"]], ["What makes a path different from a trail?", "A path repeats no vertex (and so no edge)", ["A path must use every edge of the graph", "A path must start and end at the same vertex", "A path may repeat edges but not vertices"]], ["Which describes a cycle?", "It starts and ends at the same vertex and repeats no other vertex", ["It uses every edge of the graph exactly once", "It visits every vertex at least twice", "It is any walk with an even number of edges"]], ["A graph is connected when…", "there is a path between every pair of vertices", ["every vertex has the same degree", "no two edges cross", "every vertex is joined directly to every other vertex"]]]); return Object.assign({ prompt: d[0], diagram: null, why: "" }, mc({}, d[1], shuffle(d[2]))); }
  const kind = pick(["walk", "trail", "path", "cycle"]), G = randGraph({ chords: ri(2, 3), drop: 0 }), sq = walkOf(G, kind); if (!sq) return null;
  const i = ["walk", "trail", "path", "cycle"].indexOf(kind);
  return Object.assign(NQ(`In the network shown, a student travels ${seqStr(sq)}. Which is the best description of this route?`, G, {}, ["An edge is used twice, so it is a walk but not a trail.", "No edge is used twice, so it is a trail. A vertex is visited twice, so it is not a path.", "No vertex is visited twice, so it is a path.", "It ends where it began and no other vertex is repeated, so it is a cycle."][i]), { mode: "mc", options: WALK_OPTS, correct: i, answerHTML: WALK_OPTS[i] });
});
const EUL_OPTS = ["An Eulerian circuit (and so an Eulerian trail too)", "An Eulerian trail, but not an Eulerian circuit", "Neither"];
spec("introduction-to-networks", "eulerian-trails-circuits", () => {
  const k = ri(0, 5);
  if (k === 0) { const d = pick([["What is an Eulerian trail?", "A trail that uses every edge of the graph exactly once", ["A trail that visits every vertex exactly once", "The shortest route between two vertices", "A trail that uses every edge at least twice"]], ["What is an Eulerian circuit?", "An Eulerian trail that starts and ends at the same vertex", ["A cycle that visits every vertex exactly once", "Any walk that returns to its starting vertex", "A trail that uses half of the edges"]], ["A connected graph has an Eulerian circuit when…", "every vertex has an even degree", ["exactly two vertices have an odd degree", "every vertex has an odd degree", "it has an even number of vertices"]], ["A connected graph has an Eulerian trail that is not a circuit when…", "exactly two vertices have an odd degree", ["every vertex has an even degree", "more than two vertices have an odd degree", "it has an odd number of edges"]]]); return Object.assign({ prompt: d[0], diagram: null, why: "" }, mc({}, d[1], shuffle(d[2]))); }
  const want = pick([0, 2, 4]); let G = null;
  for (let t = 0; t < 120 && !G; t++) { const g = randGraph({ n: ri(5, 6), chords: ri(1, 3), drop: ri(0, 1) }); if (g.odd.length === want) G = g; }
  if (!G) return null;
  const degs = `Degrees: ${G.ids.map(i => `${i} ${G.deg[i]}`).join(", ")}.`, c = want === 0 ? 0 : want === 2 ? 1 : 2;
  if (k === 1 && want === 2) return Object.assign(NQ("This network has an Eulerian trail. At which pair of vertices must the trail start and end?", G, {}, `${degs} An Eulerian trail starts and ends at the two vertices of odd degree: ${G.odd.join(" and ")}.`), (() => { const right = G.odd.join(" and "), others = []; for (let a = 0; a < G.ids.length; a++) for (let b = a + 1; b < G.ids.length; b++) { const p = `${G.ids[a]} and ${G.ids[b]}`; if (p !== right) others.push(p); } return mc({}, right, shuffle(others)); })());
  return Object.assign(NQ("Does this network have an Eulerian trail, an Eulerian circuit, or neither?", G, {}, `${degs} ${want === 0 ? "Every vertex has an even degree, so there is an Eulerian circuit." : want === 2 ? "Exactly two vertices have an odd degree, so there is an Eulerian trail but no circuit." : `${want} vertices have an odd degree, so there is neither.`}`), { mode: "mc", options: EUL_OPTS, correct: c, answerHTML: EUL_OPTS[c] });
});
spec("introduction-to-networks", "konigsberg-bridges", q => {
  const d = (q.diagram && q.diagram.config) || {}, dia = { engine: "network-engine", config: Object.assign({}, d, { mapOnly: false }), scale: 1, maxH: 380, caption: "" }, k = ri(0, 3);
  const Q = (prompt, right, wrong, w) => Object.assign({ prompt, diagram: dia, why: w || RM(q.answer) }, mc({}, right, shuffle(wrong)));
  if (k === 0) return Q("In the network model of the Königsberg bridges problem, what do the vertices and the edges represent?", "Vertices are the land regions; edges are the bridges", ["Vertices are the bridges; edges are the land regions", "Vertices are the bridges; edges are the rivers", "Vertices are the people; edges are their walks"], "Each piece of land becomes a vertex and each bridge becomes an edge joining two of them.");
  if (k === 1) return Q("Why is it impossible to walk across each of the seven Königsberg bridges exactly once?", "All four vertices of the network have an odd degree, so it has no Eulerian trail", ["The network is not connected", "The network has an odd number of edges", "The network is not planar"], "An Eulerian trail needs exactly 0 or 2 vertices of odd degree. The Königsberg network has 4.");
  if (k === 2) return Object.assign({ prompt: "The Königsberg bridges network has 4 vertices (land regions) and 7 edges (bridges). What is the sum of the degrees of its vertices?", diagram: dia, why: "Every edge adds 2 to the sum of the degrees: 2 × 7 = 14 (the degrees are 5, 3, 3 and 3)." }, NUM(14));
  return Q("Crossing every bridge exactly once is the same as finding which of these in the network?", "An Eulerian trail", ["A cycle through every vertex", "The shortest path between two vertices", "A planar drawing of the network"], "An Eulerian trail uses every edge (bridge) exactly once.");
});

/* ======================= bank assembly ======================= */
export function typeGen(mods, b, id) {
  const gen = mods[b][FN[b][0]];
  // the networks bank deals its variants in turn within one paper, so ask for a run and take any one
  const many = b === "introduction-to-networks" ? 6 : 1;
  const rg = () => { for (let t = 0; t < 8; t++) { const qs = gen({ count: many, allowedTypes: [id] }) || []; const q = many > 1 ? pick(qs) : qs[0]; if (q) return q; } throw new Error(`No ${b}:${id} question`); };
  const key = b + ":" + id;
  const ctx = { rg, pool: () => { if (!POOL[key]) { const s = new Set(); for (let i = 0; i < 60; i++) s.add(plain(rg().answer)); POOL[key] = [...s]; } return POOL[key]; } };
  const sp = (SPEC[b] || {})[id];
  return () => {
    for (let t = 0; t < 40; t++) {
      const q = rg();
      let out = sp ? sp(q, ctx) : convert(q, ctx);
      if (out === undefined && sp) out = convert(q, ctx);
      if (out && out.prompt) { out.key = key + plain(q.prompt) + plain(q.answer) + JSON.stringify((q.diagram && q.diagram.config) || "").slice(0, 400); return out; }
    }
    throw new Error(`Could not make a ${key} question`);
  };
}
export function typeLabel(mods, b, id) { const f = mods[b][FN[b][1]]; const t = (f ? f() : []).find(x => x.id === id); return t ? t.label : id; }
const lower1 = s => s.charAt(0).toLowerCase() + s.slice(1);
export function stage5Bank(code, mods, extra = {}) {
  const O = OUTCOMES[code]; if (!O) throw new Error("No Stage 5 outcome " + code);
  const rows = O.rows.filter(r => !PAPER_ONLY.has(r[0] + ":" + r[1]));
  const types = rows.map(([b, id, lv, stmt]) => {
    const levels = lv === "B" ? ["basic", "expected"] : lv === "B0" ? ["basic"] : ["expected"];
    if (b === "native") return { id, levels, label: NATIVE[id].label, stmt, gen: NATIVE[id].gen };
    return { id: (b === O.bank ? "" : b.replace(/[^a-z]/g, "").slice(0, 6) + "-") + id, levels, label: typeLabel(mods, b, id), stmt, gen: typeGen(mods, b, id) };
  });
  const list = (lv, n) => { const l = types.filter(t => lv === "basic" ? t.levels.includes("basic") : !t.levels.includes("basic")).map(t => lower1(t.label)); return l.slice(0, n).join(", ") + (l.length > n ? " and more" : ""); };
  const expOnly = types.some(t => !t.levels.includes("basic"));
  const levels = {
    basic: { name: "Basic", sub: `The first steps of the outcome: ${list("basic", 4)}.`, xp: 1 },
    expected: { name: "Expected", sub: expOnly ? `The whole outcome. Adds ${list("expected", 4)}.` : "The whole outcome: every question type.", xp: 1.5 }
  };
  return Object.assign({
    id: "s5-" + O.slug, title: O.title, outcome: code, stageNote: O.kind === "Path" ? "Path" : "Core",
    toolId: `s5-${O.slug}-quiz`, tool: `s5-${O.slug}-student-quiz`, mastery: "s5-" + O.slug,
    levels, types, related: []
  }, extra);
}
