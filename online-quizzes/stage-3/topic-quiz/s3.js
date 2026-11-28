/* Mills Maths Tools — Stage 3 whole-topic quizzes: the question layer
   ------------------------------------------------------------------------
   online-quizzes/stage-3/topic-quiz/s3.js   (ES module)

   21 quizzes, one per Stage 3 outcome, on the SAME engine as the Stage 4
   whole-topic quizzes (online-quizzes/stage-4/topic-quiz/engine.js + core.js,
   the shared start screen, builder, marking, save). Each quiz is a thin shell
   + banks/<slug>.js, which calls   MMTQ.run(stage3Bank("MA3-RN-01")).

   WHERE THE QUESTIONS COME FROM
   The Revision Generator's Stage 3 banks (assessment/exam-builder/question-
   banks/stage-3/*), the same banks the Stage 3 whole-topic worksheets use, so
   a class meets the same questions on paper and online. The type → outcome →
   content statement → syllabus part map below is the worksheets' map
   (tools/whole-topic-worksheets/stage3.py) — keep the two in step.

   A Revision Generator question is written for paper: a prompt, a picture and
   an answer STRING. Every type here is turned into ONE question with ONE
   answer the computer can mark (the rule of these quizzes):
     auto  the answer string says what it is — a number with its unit (the unit
           is printed after the box, so students type only the number), money,
           a fraction, a time, a duration, a coordinate pair — or a word, which
           becomes multiple choice with sibling answers as distractors.
     a SPEC per type where that is not enough: the prompt is reworded ("then
           write the number sentence" → "What is 39 + 23?"), one of several
           parts is chosen, or the answer is clicked (a number line, an order).
   Types that only work on paper (draw, construct, multi-part problems, "give
   two reasons") are left to the worksheets; quiz-native types fill their
   content statements so every statement is still asked.

   LEVELS are the syllabus parts, like the Stage 3 worksheets: "Part A" and
   "Parts A and B" (keys a / ab), or "Part B" alone for a Part B-only outcome.
*/
import * as RN from "../../../assessment/exam-builder/question-banks/stage-3/represents-numbers/index.js";
import * as AR from "../../../assessment/exam-builder/question-banks/stage-3/additive-relations/index.js";
import * as MR from "../../../assessment/exam-builder/question-banks/stage-3/multiplicative-relations/index.js";
import * as FR from "../../../assessment/exam-builder/question-banks/stage-3/fractions/index.js";
import * as GM from "../../../assessment/exam-builder/question-banks/stage-3/geometric-measure/index.js";
import * as TWOD from "../../../assessment/exam-builder/question-banks/stage-3/two-d-space-area/index.js";
import * as THREED from "../../../assessment/exam-builder/question-banks/stage-3/three-d-space-volume/index.js";
import * as MT from "../../../assessment/exam-builder/question-banks/stage-3/mass-time/index.js";
import * as DA from "../../../assessment/exam-builder/question-banks/stage-3/data/index.js";
import * as CH from "../../../assessment/exam-builder/question-banks/stage-3/chance/index.js";
import * as AN4 from "../../../assessment/exam-builder/question-banks/angles/index.js";

const C = (typeof window !== "undefined" ? window : globalThis).MMTQCore;
const { ri, pick, shuffle, fmt, gcd } = C;

const RG = {
  rn: [RN.generateRepresentsNumbersQuestions, RN.getRepresentsNumbersQuestionTypes],
  ar: [AR.generateAdditiveRelationsQuestions, AR.getAdditiveRelationsQuestionTypes],
  mr: [MR.generateMultiplicativeRelationsQuestions, MR.getMultiplicativeRelationsQuestionTypes],
  fr: [FR.generateStage3FractionsQuestions, FR.getStage3FractionsQuestionTypes],
  gm: [GM.generateStage3GeometricMeasureQuestions, GM.getStage3GeometricMeasureQuestionTypes],
  "2d": [TWOD.generateStage3TwoDQuestions, TWOD.getStage3TwoDQuestionTypes],
  "3d": [THREED.generateStage3ThreeDQuestions, THREED.getStage3ThreeDQuestionTypes],
  mt: [MT.generateStage3MassTimeQuestions, MT.getStage3MassTimeQuestionTypes],
  da: [DA.generateStage3DataQuestions, DA.getStage3DataQuestionTypes],
  ch: [CH.generateStage3ChanceQuestions, CH.getStage3ChanceQuestionTypes],
  an4: [AN4.generateAngleQuestions, AN4.getAngleQuestionTypes]
};
const LABELS = {};
function rgLabel(b, id) {
  if (!LABELS[b]) { LABELS[b] = {}; (RG[b][1]() || []).forEach(t => { LABELS[b][t.id] = t.label; }); }
  return LABELS[b][id] || id;
}
function rg(b, id) {
  for (let t = 0; t < 8; t++) { const q = (RG[b][0]({ count: 1, allowedTypes: [id] }) || [])[0]; if (q) return q; }
  throw new Error(`No ${b}:${id} question`);
}

/* ======================= text ======================= */
const ESC = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const FR_HTML = (n, d) => `<span class="fr"><span class="frn">${n}</span><span class="frd">${d}</span></span>`;
/* Revision Generator markup → HTML. Numbers grouped with spaces ("70 349 705") stay on one line. */
function RM(v) {
  return ESC(v)
    .replace(/\[\[frac:(-?\d+):(-?\d+)\]\]/g, (m, n, d) => FR_HTML(n, d))
    .replace(/\[\[algfrac:([^:\]]+):([^:\]]+)\]\]/g, (m, n, d) => FR_HTML(n, d))
    .replace(/\[\[sup:([^\]]+)\]\]/g, "<sup>$1</sup>")
    .replace(/(\d) (?=\d{3}\b)/g, "$1 ")
    .replace(/\r?\n/g, "<br>");
}
/* answer text without markup: [[frac:3:4]] → 3/4, groups joined */
const plain = v => String(v == null ? "" : v).replace(/\[\[frac:(-?\d+):(-?\d+)\]\]/g, "$1/$2").replace(/[   ]/g, " ").replace(/\s+/g, " ").trim();
const num = s => Number(String(s).replace(/[−–]/g, "-").replace(/[\s, ]/g, ""));
const tableHTML = t => !t || !Array.isArray(t.rows) || !t.rows.length ? "" :
  `${t.caption ? `<div class="sub">${RM(t.caption)}</div>` : ""}<table class="dtab">${t.rows.map((row, r) =>
    `<tr>${row.map((c, i) => (t.headerRow !== false && r === 0) || (t.headerCol && i === 0) ? `<th>${RM(c)}</th>` : `<td>${RM(c)}</td>`).join("")}</tr>`).join("")}</table>`;
/* Sentences that ask for something a screen can't mark: written explanations, working, drawing. */
const DROP = [
  /\s*Explain[^.?]*[.?]/gi, /\s*Give (a|two) reasons?[^.?]*[.?]/gi, /\s*Show (how you|your working)[^.?]*[.?]/gi,
  /\s*Use the (time line|counters|number line|bars) to help\.?/gi, /\s*Write the number sentence\.?/gi
];
function cleanPrompt(p) { let s = String(p || ""); DROP.forEach(r => { s = s.replace(r, ""); }); return s.replace(/\s{2,}/g, " ").trim(); }
const why = q => (q.working || []).map(RM).join(" &nbsp;·&nbsp; ");
/* Diagrams are drawn by the Revision Generator's engines (loaded by the shell). */
/* Drawing scale per engine (the shared engine trims each picture to its ink, then draws it at scale ×
   its own size, so labels come out the same size every time). Thin line drawings are drawn larger. */
const DSCALE = { "open-number-line-engine": 1.5, "bar-model-engine": 1.45, "integer-engine": 1.3, "measure-engine": 1.15, "array-area-engine": 1.2, "fdp-engine": 1.2, "statistics-engine": 1.15, "grid-engine": 1.15, "length-engine": 1.2, "area-engine": 1.15, "angle-engine": 1.1, "geometry-engine": 1.15, "solids-engine": 1.1, "probability-engine": 1.2, "volume-engine": 1.15, "linear-engine": 1.1 };
function diag(q, o = {}) {
  if (!q.diagram || !q.diagram.engine) return null;
  return { engine: q.diagram.engine, config: q.diagram.config || {}, scale: o.scale || DSCALE[q.diagram.engine] || 1.15, maxH: o.maxH || 360, caption: q.diagram.caption || "" };
}
function base(q, o = {}) {
  return { prompt: (o.prompt != null ? o.prompt : RM(cleanPrompt(q.prompt))) + tableHTML(q.table), diagram: o.noDiagram ? null : diag(q, o), why: o.why != null ? o.why : why(q) };
}

/* ======================= answers ======================= */
const UNIT_RE = /^(?:[a-zA-Zμ°²³%½]+(?:[ \-][a-zA-Z]+){0,2})$/;
/* "70 349 705", "$3 634", "−5°C", "6 099 points", "2½ symbols", "0.75", "28%" → { value, pre, unit } */
function numAns(a) {
  const s = plain(a).replace(/\s*\([^)]*\)\s*$/, "");          // "160 mL (160 cm³)" → "160 mL"
  if (/\d\s*,\s*\d/.test(s)) return null;                    // a list ("6, 12, 18"), not a number
  const m = /^([−-])?\s*(\$)?\s*(\d[\d ]*(?:\.\d+)?|\.\d+)(½)?\s*(.*)$/.exec(s);
  if (!m) return null;
  let unit = m[5].trim();
  if (unit && !UNIT_RE.test(unit)) return null;
  let value = num(m[3]) + (m[4] ? 0.5 : 0);
  if (m[1]) value = -value;
  if (!isFinite(value)) return null;
  return { value, pre: m[2] ? "$" : "", unit, money: !!m[2] };
}
function fracAns(a) {
  const s = String(a || "").trim();
  let m = /^\[\[frac:(-?\d+):(\d+)\]\]$/.exec(s); if (m) return { n: Number(m[1]), d: Number(m[2]) };
  m = /^(\d+) \[\[frac:(\d+):(\d+)\]\]$/.exec(s); if (m) return { n: Number(m[1]) * Number(m[3]) + Number(m[2]), d: Number(m[3]), mixed: true };
  return null;
}
function timeAns(a) {
  const m = /^(\d{1,2}):(\d{2})(?:\s*([ap])m)?$/i.exec(plain(a));
  if (!m) return null;
  let h = Number(m[1]); const ap = m[3] ? m[3].toLowerCase() : null;
  if (ap) h = (h % 12) + (ap === "p" ? 12 : 0);
  return { h, m: Number(m[2]), ap: !!ap, pad: m[1].length === 2 };
}
function durAns(a) {
  const s = plain(a); let m;
  if ((m = /^(\d+) h(?: (\d+) min)?$/.exec(s))) return { mins: Number(m[1]) * 60 + Number(m[2] || 0), hm: true };
  return null;
}
const coordAns = a => { const m = /^\((−?-?\d+), (−?-?\d+)\)$/.exec(plain(a)); return m ? { x: num(m[1]), y: num(m[2]) } : null; };
const isWordy = a => { const s = plain(a); return !!s && !numAns(s) && !fracAns(String(a).trim()) && !timeAns(s) && !durAns(s) && !coordAns(s); };
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const normW = s => plain(String(s).replace(/<[^>]*>/g, " ")).toLowerCase().replace(/^(a|an|the)\s+/, "").replace(/[.\s]+$/, "").replace(/\s+/g, " ");

/* Multiple choice: the right answer + distractors. o.keepOrder = the order to show them in (else shuffled);
   o.html = options are HTML already; o.max = most options (default 4). */
function mc(b, correct, distractors, o = {}) {
  const seen = new Set([normW(correct)]), opts = [correct];
  for (const d of distractors) { const k = normW(d); if (!k || seen.has(k)) continue; seen.add(k); opts.push(d); if (opts.length >= (o.max || 4)) break; }
  if (opts.length < 2) return null;
  let order;
  if (Array.isArray(o.keepOrder)) { const ko = o.keepOrder.map(normW), at = x => { const i = ko.indexOf(normW(x)); return i < 0 ? 99 : i; }; order = opts.slice().sort((x, y) => at(x) - at(y)); }
  else order = shuffle(opts);
  return Object.assign(b, { mode: "mc", options: order.map(x => (o.html ? x : RM(x))), correct: order.indexOf(correct), answerHTML: o.html ? correct : RM(correct) });
}
/* Distractors from other questions of the same type ("Obtuse" for an acute angle): 90 sampled once and
   cached, in buckets (keyFn) when a type asks more than one kind of question. */
const POOL = {};
function pool(b, id, keyFn, cur) {
  const k = b + ":" + id;
  if (!POOL[k]) {
    POOL[k] = {};
    for (let i = 0; i < 90; i++) { const q = rg(b, id), kk = keyFn ? keyFn(q) : ""; (POOL[k][kk] = POOL[k][kk] || new Set()).add(plain(q.answer)); }
  }
  return [...(POOL[k][keyFn ? keyFn(cur) : ""] || [])];
}
const firstWord = s => plain(s).split(/[\s:.,(]/)[0];

/* The default conversion. o.mcPool = choose from sibling answers; o.prompt = reworded prompt. */
function auto(q, b, id, o = {}) {
  const B = base(q, o);
  const a = o.answer != null ? o.answer : q.answer;
  if (o.mcPool || isWordy(a)) {
    const sibs = (q.mcDistractors && q.mcDistractors.length >= 2 ? q.mcDistractors : []).concat(shuffle(pool(b, id, o.poolKey, q)));
    return mc(B, plain(a), sibs.map(plain), o);
  }
  const f = fracAns(String(a).trim());
  if (f) {
    const simplest = /simplest/i.test(q.prompt) || o.simplest;
    return Object.assign(B, { mode: "frac", n: f.n, d: f.d, form: o.form || (f.mixed ? null : "fraction"), simplest: !!simplest, answerHTML: RM(a), placeholder: "e.g. 3/4", keys: ["/"] });
  }
  const t = timeAns(a);
  if (t) return Object.assign(B, { mode: "time", h: t.h, m: t.m, fmt: o.fmt || (t.ap ? "12" : t.pad ? "24" : "clock"), answerHTML: RM(a) });
  const d = durAns(a);
  if (d) return Object.assign(B, { mode: "dur", mins: d.mins, hm: o.hm != null ? o.hm : /hours and minutes/i.test(q.prompt), answerHTML: RM(a), placeholder: "e.g. 1 h 25 min" });
  const c = coordAns(a);
  if (c) return Object.assign(B, { mode: "coord", x: c.x, y: c.y });
  const n = numAns(a);
  if (n) {
    const out = Object.assign(B, { mode: "num", value: n.value, unit: n.unit === "%" ? "%" : n.unit, pre: n.pre });
    if (n.money) { out.tol = 0.005; out.answerHTML = "$" + n.value.toFixed(Number.isInteger(n.value) && !/\.\d/.test(plain(a)) ? 0 : 2); }
    if (o.tol != null) out.tol = o.tol;
    return out;
  }
  return null;
}

/* ======================= per-type specs ======================= */
/* A spec gets the Revision Generator question and returns the quiz question (or null: try another). */
const nbsp = s => String(s).replace(/(\d) (?=\d{3}\b)/g, "$1 ");
function orderQ(q, b, items, sortedPlain, ends, o = {}) {
  // items: the plain strings shown; sortedPlain: the same strings in the right order
  if (new Set(items).size !== items.length) return null;
  const B = base(q, { prompt: o.prompt || RM(cleanPrompt(q.prompt).replace(/:\s*.*$/, ".").replace(/^Write these/, "Put these")), noDiagram: true });
  const shown = shuffle(items.map((s, i) => i));
  const it = shown.map(i => RM(items[i]));
  const correct = sortedPlain.map(s => shown.findIndex(i => items[i] === s));
  if (correct.some(i => i < 0)) return null;
  return Object.assign(B, { mode: "order", items: it, correct, ends });
}
const listAfterColon = p => plain(p).replace(/^[^:]*:\s*/, "").replace(/\.$/, "").split(/,\s*/).map(s => s.trim()).filter(Boolean);
const ENDS = p => /descending|largest to smallest|heaviest to lightest|longest to shortest/i.test(p) ? (/heav/i.test(p) ? ["heaviest", "lightest"] : /long/i.test(p) ? ["longest", "shortest"] : ["largest", "smallest"])
  : /heav|light/i.test(p) ? ["lightest", "heaviest"] : /short|long/i.test(p) ? ["shortest", "longest"] : ["smallest", "largest"];
/* the options a prompt offers itself: "…: mm, cm, m or km?" / "… (cm³) or cubic metres (m³)?" */
function promptOptions(p) {
  const s = plain(p);
  let m = /:\s*([^:?]+?)\?\s*$/.exec(s);
  if (m && / or /.test(m[1])) return m[1].split(/,\s*|\s+or\s+/).map(x => x.trim()).filter(Boolean);
  m = /\b(?:in|use)\s+([^?]+?)\s+or\s+([^?]+?)\?\s*$/i.exec(s);
  if (m) return [m[1], m[2]].map(x => x.replace(/^(a|an)\s+/i, "").trim());
  return null;
}
function fromPromptMC(q, b, o = {}) {
  const opts = promptOptions(q.prompt); if (!opts) return null;
  const ans = plain(q.answer), hit = opts.find(x => normW(x) === normW(ans)) || opts.find(x => normW(ans).startsWith(normW(x)) || normW(x).startsWith(normW(ans)));
  if (!hit) return null;
  const B = base(q, o);
  B.prompt = B.prompt.replace(/:\s*[^:]*?\?\s*$/, "?");
  return mc(B, hit, opts.filter(x => x !== hit), { keepOrder: opts.map(normW), html: false });
}
const numberSentence = a => { const m = /^(.+?)\s*=\s*([^=]+)$/.exec(plain(a)); return m ? { lhs: m[1].trim(), rhs: m[2].trim() } : null; };

const SPEC = {
  rn: {
    "order-millions": q => orderQ(q, "rn", listAfterColon(q.prompt), plain(q.answer).split(/,\s*/), ENDS(q.prompt)),
    "place-value-large": q => auto(q, "rn", "place-value-large"),
    "integer-number-line": q => {
      const c = q.diagram.config, v = num(plain(q.answer));
      return Object.assign(base(q, { prompt: `Click the number line to place <b>${RM(q.answer)}</b>.`, noDiagram: true }),
        /* Ticks every c.step; a number between two ticks is placed by eye: clicks snap to whole numbers
           and anything within 1 of the number counts (arrow keys move one at a time). */
        { mode: "nline", value: v, min: c.min, max: c.max, step: c.step, snap: v % c.step ? 1 : c.step, tol: v % c.step ? 1 : undefined,
          labels: (c.labels || [c.min, 0, c.max]).map(x => ({ v: x, html: fmt(x) })), valueHTML: RM(q.answer),
          why: v % c.step ? `${fmt(v)} is between ${fmt(Math.floor(v / c.step) * c.step)} and ${fmt(Math.floor(v / c.step) * c.step + c.step)}.` : why(q) });
    },
    "decimal-place-value": q => {
      const m = /decimal ([\d.]+), which column is the digit (\d)/.exec(plain(q.prompt));
      if (m && m[1].split("").filter(ch => ch === m[2]).length !== 1) return null;   // the digit must appear once
      return mc(base(q), plain(q.answer), ["ones", "tenths", "hundredths", "thousandths", "tens"].filter(x => x !== plain(q.answer)).slice(0, 4), { keepOrder: ["tens", "ones", "tenths", "hundredths", "thousandths"] });
    },
    "compare-decimals": q => {
      const m = /^([\d.]+)\s*([<>=])\s*([\d.]+)$/.exec(plain(q.answer)); if (!m) return null;
      const B = base(q, { prompt: `Which sign makes this true?<span class="big">${m[1]} &nbsp;☐&nbsp; ${m[3]}</span>` });
      return mc(B, m[2], ["<", ">", "="].filter(x => x !== m[2]), { keepOrder: ["<", "=", ">"] });
    },
    "order-decimals": q => orderQ(q, "rn", listAfterColon(q.prompt), plain(q.answer).split(/,\s*/), ENDS(q.prompt)),
    "decimal-number-line": q => {
      const c = q.diagram.config, v = num(plain(q.answer).split(",")[0]), step = (c.max - c.min) / (c.tickCount || 10);
      return Object.assign(base(q, { prompt: `Click the number line to place <b>${fmt(v)}</b>.`, noDiagram: true }),
        { mode: "nline", value: v, min: c.min, max: c.max, step, labels: [{ v: c.min, html: fmt(c.min) }, { v: c.max, html: fmt(c.max) }], valueHTML: fmt(v) });
    },
    "benchmark-grid": q => {
      const parts = plain(q.answer).split(/\s*=\s*/); if (parts.length < 3) return null;
      const k = ri(0, 2), word = ["a percentage", "a fraction in its simplest form", "a decimal"][k];
      const B = base(q, { prompt: `What part of the grid is shaded? Write it as ${word}.` });
      const pct = parseFloat(parts[0]);
      if (k === 0) return Object.assign(B, { mode: "num", value: pct, unit: "%" });
      if (k === 1) { const g = gcd(pct, 100); return Object.assign(B, { mode: "frac", n: pct / g, d: 100 / g, form: "fraction", simplest: true, placeholder: "e.g. 3/4", keys: ["/"], answerHTML: FR_HTML(pct / g, 100 / g) }); }
      return Object.assign(B, { mode: "num", value: pct / 100 });
    },
    "benchmark-equivalents": q => {
      const a = String(q.answer).trim(), p = plain(q.prompt);
      const out = auto(q, "rn", "benchmark-equivalents");
      if (out && out.mode === "frac") { out.simplest = /simplest/i.test(p); out.form = "fraction"; }
      if (out && out.mode === "num" && /as a percentage/i.test(p)) out.unit = "%";
      return out;
    }
  },
  ar: {
    __onl: q => {
      const s = numberSentence(q.answer); if (!s) return null;
      const calc = /^([\d ]+)\s*([+−-])\s*([\d ]+)$/.exec(s.lhs); if (!calc) return null;
      const B = base(q, { prompt: `Use the open number line to help you work out <span class="big">${RM(s.lhs)} = ?</span>` });
      return Object.assign(B, { mode: "num", value: num(s.rhs) });
    },
    "onl-constant-difference": q => {
      const parts = plain(q.answer).split(/\s*=\s*/); if (parts.length < 3) return null;
      const B = base(q, { prompt: `${RM(cleanPrompt(q.prompt).replace(/\s*Fill the gaps.*$/i, ""))} <span class="big">${RM(parts[0])} = ?</span>` });
      return Object.assign(B, { mode: "num", value: num(parts[parts.length - 1]) });
    },
    "is-it-reasonable": q => mc(base(q, { prompt: RM(cleanPrompt(q.prompt).replace(/Use estimation to decide whether this is reasonable\.?/i, "Use estimation: is this answer reasonable?")) }), plain(q.answer), ["Reasonable", "Not reasonable"], { keepOrder: ["reasonable", "not reasonable"] }),
    "choose-strategy": q => auto(q, "ar", "choose-strategy", { mcPool: true }),
    "constant-difference": q => auto(q, "ar", "constant-difference", { prompt: RM(plain(q.prompt).replace(/Explain why this does not change the answer, then find the answer\.?/i, "What is the answer?")) }),
    "calculator-or-not": q => mc(base(q), plain(q.answer), ["A mental strategy", "A calculator"], { keepOrder: ["mental strategy", "calculator"] }),
    "bar-model-draw": q => {
      const n = numAns(plain(q.answer).replace(/\s*\(.*$/, "")); if (!n) return null;
      const B = base(q, { prompt: RM(plain(q.prompt).replace(/\s*Draw a bar model(?: to show the problem)?, then solve it\.?/i, " A bar model may help.")) });
      return Object.assign(B, { mode: "num", value: n.value, unit: n.unit, pre: n.pre });
    }
  },
  mr: {
    "array-product": q => { const s = numberSentence(q.answer); if (!s) return null; return Object.assign(base(q, { prompt: "Use multiplication to find how many counters are in this array." }), { mode: "num", value: num(s.rhs), why: `${RM(s.lhs)} = ${RM(s.rhs)}` }); },
    "array-commutative": q => {
      const m = /^(\d+) × (\d+) = (\d+) and (\d+) × (\d+) = (\d+)$/.exec(plain(q.answer)); if (!m || m[1] === m[2]) return null;
      const a = Number(m[1]), b = Number(m[2]), p = a * b;
      const B = base(q, { prompt: `This array shows <b>${a} × ${b} = ${p}</b>. Which other multiplication fact does the same array show?` });
      return mc(B, `${b} × ${a} = ${p}`, [`${a} + ${b} = ${a + b}`, `${p} × ${a} = ${p * a}`, `${b} × ${b} = ${b * b}`, `${a} × ${a} = ${a * a}`]);
    },
    "factor-rectangles": q => {
      const m = /made from (\d+) counters/.exec(plain(q.prompt)); if (!m) return null;
      const n = Number(m[1]), f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i);
      return Object.assign(base(q, { prompt: `Every rectangle that can be made from ${n} counters is shown. How many factors does ${n} have?` }), { mode: "num", value: f.length, why: `The factors of ${n} are ${f.join(", ")}.` });
    },
    "prime-composite-arrays": q => mc(base(q, { prompt: RM(cleanPrompt(q.prompt)) }), firstWord(q.answer), ["Prime", "Composite"], { keepOrder: ["prime", "composite"] }),
    "square-numbers": q => {
      const p = plain(q.prompt), m = /:\s*([\d, ]+)\?$/.exec(p);
      if (m) { const opts = m[1].split(/,\s*/); return mc(base(q, { prompt: "Which of these is a square number?" }), plain(q.answer), opts.filter(x => x !== plain(q.answer)), { keepOrder: opts }); }
      const s = numberSentence(q.answer); if (!s) return null;
      return Object.assign(base(q, { prompt: "The counters make a square array. What square number does it show?" }), { mode: "num", value: num(s.rhs), why: `${RM(s.lhs)} = ${RM(s.rhs)}` });
    },
    "missing-factor-pair": q => { const m = /^(\d+) × (\d+)$/.exec(plain(q.answer)); if (!m) return null; return Object.assign(base(q, { prompt: RM(cleanPrompt(q.prompt)) + ` <span class="sub">Write it like 3 × 8.</span>` }), { mode: "pair", pair: [Number(m[1]), Number(m[2])], keys: ["×"] }); },
    "partition-to-multiply": q => { const m = /total ([\d ]+)$/.exec(plain(q.answer)); const e = /work out ([\d ]+ × \d+)/.exec(plain(q.prompt)); if (!m || !e) return null; return Object.assign(base(q, { prompt: `Use partitioning to work out <span class="big">${RM(e[1])} = ?</span>`, why: RM(plain(q.answer).replace(/, total/, "; total")) }), { mode: "num", value: num(m[1]) }); },
    __areamodel: q => auto(q, "mr", "x", { prompt: RM(cleanPrompt(q.prompt).replace(/^Split (\d+) into tens and ones to complete this area model, and work out/, "Use the area model to work out").replace(/^Complete the area model to work out/, "Use the area model to work out")) }),
    "area-model-read": q => { const s = numberSentence(q.answer); if (!s) return null; return Object.assign(base(q, { prompt: "This area model shows a multiplication. What is the answer to the multiplication?" }), { mode: "num", value: num(s.rhs), why: `${RM(s.lhs)} = ${RM(s.rhs)}` }); },
    "division-model-remainder": q => { const m = /^(\d+) remainder (\d+)$/.exec(plain(q.answer)); if (!m) return null; return Object.assign(base(q, { prompt: RM(cleanPrompt(q.prompt)) + ` <span class="sub">Write it like 17 r 1.</span>` }), { mode: "rem", quot: Number(m[1]), rem: Number(m[2]) }); },
    "estimate-product": q => { const s = numberSentence(q.answer); if (!s) return null; return Object.assign(base(q, { why: RM(plain(q.answer)) }), { mode: "num", value: num(s.rhs) }); },
    /* "Estimate 106 ÷ 3 by first rounding 106 to the nearest ten": 110 ÷ 3 = 36.7, so 36 or 37 (or 36.7) is right. */
    "estimate-quotient": q => {
      const m = /Estimate ([\d ]+) ÷ (\d+) by first rounding [\d ]+ to the nearest (ten|hundred)/.exec(plain(q.prompt)); if (!m) return null;
      const r = (m[3] === "ten" ? 10 : 100), est = Math.round(num(m[1]) / r) * r / Number(m[2]);
      return Object.assign(base(q), { mode: "num", value: est, tol: 0.999, answerHTML: `about ${fmt(est, 1)} (${fmt(Math.round(num(m[1]) / r) * r)} ÷ ${m[2]})` });
    },
    "multiples-pattern": q => auto(q, "mr", "multiples-pattern", { mcPool: true }),
    "common-multiples": q => /,/.test(plain(q.answer)) ? null : auto(q, "mr", "common-multiples")
  },
  fr: {
    __name: q => auto(q, "fr", "x"),
    "fraction-number-line": q => {
      const c = q.diagram.config, f = fracAns(String(q.answer).trim()) || (() => { const m = /\[\[frac:(\d+):(\d+)\]\]/.exec(q.prompt); return m && { n: Number(m[1]), d: Number(m[2]) }; })();
      if (!f) return null;
      const d = c.denominator || f.d, W = c.wholes || 1, labels = []; for (let w = 0; w <= W; w++) labels.push({ v: w, html: String(w) });
      return Object.assign(base(q, { prompt: `Click the number line to place <b>${FR_HTML(f.n, f.d)}</b>.`, noDiagram: true }), { mode: "nline", value: f.n / f.d, min: 0, max: W, step: 1 / d, labels, valueHTML: FR_HTML(f.n, f.d) });
    },
    "mixed-numerals-bars": q => {
      const m = /^(\d+) \[\[frac:(\d+):(\d+)\]\] = \[\[frac:(\d+):(\d+)\]\]$/.exec(String(q.answer).trim()); if (!m) return null;
      const k = ri(0, 1), n = Number(m[4]), d = Number(m[5]);
      const B = base(q, { prompt: `Each bar is one whole. Write the shaded amount as ${k ? "an improper fraction" : "a mixed numeral"}.` });
      return Object.assign(B, { mode: "frac", n, d, form: k ? "improper" : "mixed", simplest: false, placeholder: k ? "e.g. 7/4" : "e.g. 1 3/4", keys: ["/"], answerHTML: k ? FR_HTML(n, d) : `${m[1]} ${FR_HTML(m[2], m[3])}` });
    },
    __compare: q => {
      const fr = [...String(q.prompt).matchAll(/\[\[frac:(\d+):(\d+)\]\]/g)].map(x => `[[frac:${x[1]}:${x[2]}]]`);
      if (fr.length !== 2 || fr[0] === fr[1]) return null;
      const B = base(q, { prompt: RM(cleanPrompt(q.prompt)) });
      return mc(B, RM(String(q.answer).trim()), fr.filter(x => x !== String(q.answer).trim()).map(RM), { keepOrder: fr.map(RM), html: true, max: 2 });
    },
    "order-fractions": q => {
      const items = [...String(q.prompt).replace(/^[^:]*:/, "").matchAll(/\[\[frac:(\d+):(\d+)\]\]/g)].map(x => `${x[1]}/${x[2]}`);
      const sorted = [...String(q.answer).matchAll(/\[\[frac:(\d+):(\d+)\]\]/g)].map(x => `${x[1]}/${x[2]}`);
      const o = orderQ(q, "fr", items, sorted, ENDS(q.prompt)); if (!o) return null;
      o.items = o.items.map(s => { const m = /^(\d+)\/(\d+)$/.exec(s); return m ? FR_HTML(m[1], m[2]) : s; });
      return o;
    },
    __sum: q => auto(q, "fr", "x", { simplest: false })
  },
  gm: {
    "grid-map-read": q => auto(q, "gm", "grid-map-read", { mcPool: true }),
    "grid-map-give": q => Object.assign(base(q), { mode: "text", accept: [plain(q.answer)], placeholder: "e.g. C4" }),
    "plot-point": q => {
      const m = /\((\d+), (\d+)\)/.exec(plain(q.prompt)); if (!m) return null; const c = q.diagram.config || {};
      return Object.assign(base(q, { prompt: RM(plain(q.prompt).replace(/^Plot the point/, "Click the grid to plot the point").replace(/ on the number plane below\.?$/, ".")), noDiagram: true }),
        { mode: "plot", x: Number(m[1]), y: Number(m[2]), grid: { xMin: c.xMin || 0, xMax: c.xMax || 6, yMin: c.yMin || 0, yMax: c.yMax || 6 } });
    },
    "four-quadrants": q => /quadrant/i.test(q.prompt) ? mc(base(q), plain(q.answer), ["The first quadrant", "The second quadrant", "The third quadrant", "The fourth quadrant"], { keepOrder: ["first quadrant", "second quadrant", "third quadrant", "fourth quadrant"] }) : auto(q, "gm", "four-quadrants"),
    "choose-length-unit": q => fromPromptMC(q, "gm"),
    __angleType: (q, id) => mc(base(q), cap1(plain(q.answer)), ["Acute", "Right", "Obtuse", "Straight", "Reflex", "Revolution"].filter(x => normW(x) !== normW(q.answer)).sort(() => Math.random() - 0.5).slice(0, 3), { keepOrder: ["acute", "right", "obtuse", "straight", "reflex", "revolution"] }),
    "estimate-angle": q => /bigger or smaller/i.test(q.prompt)
      ? mc(base(q), plain(q.answer), ["Bigger", "Smaller"], { keepOrder: ["bigger", "smaller"] })
      : auto(q, "gm", "estimate-angle"),
    "estimate-angle-diagram": q => {
      const m = /:\s*([^?]+)\?$/.exec(plain(q.prompt)); if (!m) return null; const opts = m[1].split(/,\s*/);
      return mc(base(q, { prompt: "Without measuring, which is the best estimate of the marked angle?" }), plain(q.answer), opts.filter(x => x !== plain(q.answer)), { keepOrder: opts.map(normW) });
    }
  },
  an4: {
    "vertically-opposite": q => auto(q, "an4", "vertically-opposite", { prompt: RM(cleanPrompt(q.prompt).replace(/\s*Name the angle relationship[^.]*\./i, "").replace(/, giving a reason for your answer/i, "")) })
  },
  "2d": {
    __mcpool: (q, id) => auto(q, "2d", id, { mcPool: true }),
    "describe-translation": q => {
      const m = /^(\d+) squares? (left|right) and (\d+) squares? (up|down)$/.exec(plain(q.answer));
      const sq = n => `${n} square${n === "1" ? "" : "s"}`;
      if (!m) return auto(q, "2d", "describe-translation", { mcPool: true });
      const flipH = { left: "right", right: "left" }, flipV = { up: "down", down: "up" };
      const c = `${sq(m[1])} ${m[2]} and ${sq(m[3])} ${m[4]}`;
      return mc(base(q), c, [`${sq(m[1])} ${flipH[m[2]]} and ${sq(m[3])} ${m[4]}`, `${sq(m[1])} ${m[2]} and ${sq(m[3])} ${flipV[m[4]]}`, `${sq(m[3])} ${m[2]} and ${sq(m[1])} ${m[4]}`, `${sq(m[1])} ${flipH[m[2]]} and ${sq(m[3])} ${flipV[m[4]]}`]);
    },
    "name-transformation-grid": q => mc(base(q, { prompt: RM(plain(q.prompt).replace(/ Is this a translation, a reflection or a rotation\?/, " Which transformation is this?")) }), cap1(plain(q.answer)), ["Translation", "Reflection", "Rotation"], { keepOrder: ["translation", "reflection", "rotation"] }),
    "transformations": q => mc(base(q), cap1(plain(q.answer).replace(/^(a|an) /i, "")), ["Translation", "Reflection", "Rotation"], { keepOrder: ["translation", "reflection", "rotation"] }),
    "choose-unit": q => fromPromptMC(q, "2d"),
    "rows-and-columns": q => auto(q, "2d", "rows-and-columns", { prompt: "What is the area of this rectangle? Try to find it without counting every square." })
  },
  "3d": {
    __mcpool: (q, id) => auto(q, "3d", id, { mcPool: true }),
    "prism-or-pyramid": q => mc(base(q, { prompt: RM(cleanPrompt(q.prompt).replace(/\s*Explain how you know\.?/, "")) }), cap1(firstWord(plain(q.answer).replace(/^(a|an) /i, ""))), ["Prism", "Pyramid"], { keepOrder: ["prism", "pyramid"] }),
    "faces-edges-vertices": q => {
      const subs = (q.subparts || []).filter(p => /^\d+$/.test(plain(p.answer))); if (!subs.length) return null;
      const p = pick(subs), what = plain(p.prompt).toLowerCase(), solid = (/This is an? ([^.]+)\./.exec(plain(q.prompt)) || [])[1] || "object";
      return Object.assign(base(q, { prompt: `This is a ${solid}. How many <b>${what}</b> does it have?` }), { mode: "num", value: num(p.answer), why: RM(plain(q.answer)) });
    },
    "face-shapes": q => /^\d+$/.test(plain(q.answer)) ? auto(q, "3d", "face-shapes") : auto(q, "3d", "face-shapes", { mcPool: true, poolKey: x => /^\d+$/.test(plain(x.answer)) ? "n" : "w" }),
    "fev-pattern": q => {
      const subs = (q.subparts || []).filter(p => /^\d+$/.test(plain(p.answer)) && !/table/i.test(p.prompt)); if (!subs.length) return null;
      const p = pick(subs);
      return Object.assign(base(q, { prompt: RM(plain(q.prompt)) + " " + RM(plain(p.prompt).replace(/ that pyramid/, " a pyramid with a base of " + ((/base with (\d+) sides/.exec(plain(q.subparts.map(x => x.prompt).join(" "))) || [])[1] || "that many") + " sides")) }), { mode: "num", value: num(p.answer) });
    },
    "cube-nets": q => { const L = (q.diagram.config.nets || []).map(n => n.label); return mc(base(q), plain(q.answer), L.filter(x => x !== plain(q.answer)), { keepOrder: L.map(normW), max: 6 }); },
    "cube-stack-views": q => { const L = (q.diagram.config.options || []).map(n => n.label); return mc(base(q), plain(q.answer), L.filter(x => x !== plain(q.answer)), { keepOrder: L.map(normW), max: 6 }); },
    "skeletal-models": q => numAns(q.answer) && !/ and /.test(plain(q.answer)) ? auto(q, "3d", "skeletal-models") : null,
    "capacity-units": q => fromPromptMC(q, "3d") || auto(q, "3d", "capacity-units", { mcPool: true }),
    "capacity-problems": q => isWordy(q.answer) ? mc(base(q), plain(q.answer), ["Jug A", "Jug B", "Jug C"], { keepOrder: ["jug a", "jug b", "jug c"] }) : auto(q, "3d", "capacity-problems"),
    "cubic-metres": q => fromPromptMC(q, "3d")
  },
  mt: {
    __mcpool: (q, id) => auto(q, "mt", id, { mcPool: true }),
    "order-masses": q => orderQ(q, "mt", listAfterColon(q.prompt), plain(q.answer).split(/,\s*/), ENDS(q.prompt)),
    "read-clock": q => auto(q, "mt", "read-clock", { fmt: "clock" }),
    "finish-time": q => auto(q, "mt", "finish-time", { fmt: /12-hour/i.test(q.prompt) ? "12" : /24-hour/i.test(q.prompt) ? "24" : undefined }),
    "start-time": q => auto(q, "mt", "start-time", { fmt: /12-hour/i.test(q.prompt) ? "12" : "24" }),
    "time-units": q => auto(q, "mt", "time-units", { hm: /hours and minutes/i.test(q.prompt) })
  },
  da: {
    __mcpool: (q, id) => auto(q, "da", id, { mcPool: true }),
    "data-types": q => mc(base(q, { prompt: RM(plain(q.prompt).replace(/ Is this categorical data or numerical data\?/, " What type of data is this?")) }), plain(q.answer), ["Categorical", "Numerical"], { keepOrder: ["categorical", "numerical"] }),
    "two-way-table": q => /^\d+$/.test(plain(q.answer)) ? auto(q, "da", "two-way-table") : null,
    "line-graph-read": q => {
      const c = q.diagram.config || {}, cats = c.categories || [];
      if (cats.includes(plain(q.answer))) return mc(base(q), plain(q.answer), shuffle(cats.filter(x => x !== plain(q.answer))), { keepOrder: cats.map(normW) });
      return auto(q, "da", "line-graph-read");
    },
    /* Built from the graph itself: the biggest rise between two readings, or the change overall. */
    "line-graph-trend": q => {
      const c = q.diagram.config || {}, cats = c.categories || [], v = c.values || [], unit = (/\(([^)]+)\)/.exec(c.yLabel || "") || [])[1] || "";
      if (cats.length < 3 || cats.length !== v.length) return null;
      const d = v.slice(1).map((x, i) => x - v[i]), up = Math.max(...d);
      const pairs = cats.slice(1).map((x, i) => `${cats[i]} and ${x}`);
      if (Math.random() < 0.6 && up > 0 && d.filter(x => x === up).length === 1) {
        const i = d.indexOf(up), B = base(q, { prompt: "Between which two readings was the biggest increase?" });
        return Object.assign(mc(B, pairs[i], shuffle(pairs.filter((_, k) => k !== i)), { keepOrder: pairs }), { why: `${cats[i]} to ${x2(cats[i + 1])}: ${fmt(v[i])} → ${fmt(v[i + 1])}, up ${fmt(up)}${unit ? " " + unit : ""}.` });
      }
      if (v[0] === v[v.length - 1]) return null;
      const B = base(q, { prompt: `Compare the first reading (${cats[0]}) with the last reading (${cats[cats.length - 1]}). Overall, did the reading increase or decrease?` });
      const ans = v[v.length - 1] > v[0] ? "It increased" : "It decreased";
      return Object.assign(mc(B, ans, ["It increased", "It decreased", "It stayed the same"].filter(x => x !== ans), { keepOrder: ["It increased", "It decreased", "It stayed the same"] }), { why: `${fmt(v[0])} at ${cats[0]}, ${fmt(v[v.length - 1])} at ${cats[cats.length - 1]}.` });
    },
    "timeline-read": q => {
      if (!isWordy(q.answer)) return auto(q, "da", "timeline-read");
      const notes = ((q.diagram.config || {}).points || []).map(p => p.note).filter(Boolean);
      return mc(base(q), plain(q.answer), shuffle(notes.filter(x => x !== plain(q.answer))));
    },
    "side-by-side": q => /^\d+$/.test(plain(q.answer)) ? auto(q, "da", "side-by-side") : null,
    "misleading-graph": q => {
      const m = /"([^"]+)" The survey asked only (\d+) children, all at an? ([^.]+?) party\./.exec(plain(q.prompt)); if (!m) return null;
      const B = base(q, { prompt: RM(plain(q.prompt).replace(/\s*Give two reasons.*$/, "")) + " <b>Which is the best reason this claim may not be true for all kids?</b>" });
      return mc(B, `Only ${m[2]} children were asked, and they were all at a ${m[3]} party.`, ["A percentage can never be bigger than 50%.", "The website did not draw a graph of the results.", "Kids are too young to choose what they like."], { html: false });
    }
  },
  ch: {
    "list-outcomes": q => { const items = plain(q.answer).split(/,\s*/); return Object.assign(base(q, { prompt: RM(plain(q.prompt).replace(/\s*List (all )?the possible outcomes\.?/i, " How many different outcomes are possible?")) }), { mode: "num", value: items.length, why: `The outcomes are ${RM(plain(q.answer))}.` }); },
    "chance-words": q => { const W = ["Impossible", "Unlikely", "Even chance", "Likely", "Certain"]; return mc(base(q, { prompt: RM(plain(q.prompt).replace(/\s*Use one of:.*$/, "")) }), W.find(w => normW(w) === normW(q.answer)) || plain(q.answer), W, { keepOrder: W.map(normW), max: 5 }); },
    "probability-scale": q => { const L = (q.diagram.config.markers || []).map(m => m.label); return mc(base(q), plain(q.answer), L.filter(x => x !== plain(q.answer)), { keepOrder: L.map(normW), max: 6 }); },
    "equally-likely": q => mc(base(q, { prompt: RM(cleanPrompt(q.prompt)) }), /^no/i.test(plain(q.answer)) ? "No" : "Yes", ["Yes", "No"], { keepOrder: ["yes", "no"] }),
    "probability-fraction": q => auto(q, "ch", "probability-fraction", { simplest: false }),
    "most-likely": q => {
      const a = plain(q.answer), cnt = (q.diagram && q.diagram.config && q.diagram.config.counts) || null;
      if (/^Bag [AB]/.test(a)) return mc(base(q, { prompt: RM(cleanPrompt(q.prompt)), why: RM(q.answer) }), a.slice(0, 5), ["Bag A", "Bag B"], { keepOrder: ["bag a", "bag b"] });
      if (!cnt) return null;
      const cols = Object.keys(cnt).map(cap1);
      return Object.assign(mc(base(q), cap1(a), cols.filter(c => normW(c) !== normW(a)), { keepOrder: cols }), { why: Object.entries(cnt).map(([k, v]) => `${v} ${k}`).join(", ") + "." });
    },
    /* "Write Red in some of the equal parts so that P(Red) = 3/5" → how many parts? */
    "design-generator": q => {
      const a = plain(q.answer); let m;
      if ((m = /^(\w+) written in (\d+) of the (\d+) parts$/.exec(a)))
        return Object.assign(base(q, { prompt: RM(plain(q.prompt).replace(/^Write "(\w+)" in some of the equal parts of this spinner so that (.+)\.$/, (x, c, rest) => `The spinner has ${m[3]} equal parts. We want ${rest.replace(/ is /, " to be ")}. In how many of the parts should "${c}" be written?`)) }), { mode: "num", value: Number(m[2]), why: `${m[2]} out of ${m[3]} parts.` });
      return auto(q, "ch", "design-generator");
    },
    "observed-vs-expected": q => { const m = /Expected (\d+)/.exec(plain(q.answer)), s = /^(.+?) How many (\w+) would she expect\?/.exec(plain(q.prompt)); if (!m || !s) return null; return Object.assign(base(q, { prompt: RM(`${s[1]} How many ${s[2]} would she expect?`) }), { mode: "num", value: Number(m[1]), unit: s[2] }); },
    "more-trials": q => {
      const p = plain(q.prompt), a = plain(q.answer);
      let m = /: (\d[\d ]* \w+) or (\d[\d ]* \w+)\?$/.exec(p);
      if (m) return mc(base(q), m[1] === a ? m[1] : m[2], [m[1], m[2]], { keepOrder: [normW(m[1]), normW(m[2])] });
      const names = [...p.matchAll(/\b([A-Z][a-z]+) tossed/g)].map(x => x[1]);
      if (names.length === 2) { const who = names.find(n => a.startsWith(n)); if (!who) return null; return mc(base(q, { prompt: RM(p.replace(/ Why\?$/, "")) }), `${who}’s`, names.map(n => `${n}’s`), { keepOrder: names.map(n => normW(n + "’s")) }); }
      return null;
    },
    "fraction-decimal-percent": q => { const o = auto(q, "ch", "fraction-decimal-percent"); if (o && o.mode === "num" && /percentage/i.test(q.prompt)) o.unit = "%"; if (o && o.mode === "frac") o.simplest = /simplest/i.test(q.prompt); return o; }
  }
};
const x2 = s => s;
/* shared specs */
["onl-bridging-add", "onl-jump-add", "onl-jumping-over-add", "onl-bridging-sub", "onl-counting-up"].forEach(k => { SPEC.ar[k] = SPEC.ar.__onl; });
["build-area-model", "area-model-3-digit", "area-model-2x2"].forEach(k => { SPEC.mr[k] = SPEC.mr.__areamodel; });
["compare-unit-fractions", "compare-related-fractions", "compare-with-bars"].forEach(k => { SPEC.fr[k] = SPEC.fr.__compare; });
["add-same-denominator", "subtract-same-denominator", "add-with-bars", "add-related-denominators", "fraction-as-division"].forEach(k => { SPEC.fr[k] = SPEC.fr.__sum; });
["classify-angle", "classify-angle-diagram"].forEach(k => { SPEC.gm[k] = SPEC.gm.__angleType; });
["classify-triangle-diagram", "classify-triangle", "classify-quadrilateral-diagram", "classify-quadrilateral", "shape-properties"].forEach(k => { SPEC["2d"][k] = q => SPEC["2d"].__mcpool(q, k); });
["name-solid", "net-to-solid"].forEach(k => { SPEC["3d"][k] = q => SPEC["3d"].__mcpool(q, k); });
["mass-units"].forEach(k => { SPEC.mt[k] = q => SPEC.mt.__mcpool(q, k); });
["choose-display", "choose-scale"].forEach(k => { SPEC.da[k] = q => SPEC.da.__mcpool(q, k); });

/* One Revision Generator type → one quiz type generator. */
function rgType(b, id) {
  const spec = (SPEC[b] || {})[id];
  return () => {
    for (let t = 0; t < 25; t++) {
      const q = rg(b, id);
      const out = spec ? spec(q, id) : auto(q, b, id);
      if (out && out.prompt) { out.key = b + id + plain(q.prompt) + plain(q.answer) + JSON.stringify((q.diagram && q.diagram.config) || ""); return out; }
    }
    throw new Error(`Could not make a ${b}:${id} question`);
  };
}

/* ======================= quiz-native types ======================= */
/* Content statements whose Revision Generator types only work on paper still get asked. */
const NATIVE = {
  /* MA3-MR-01 Part B: problems with multiplication and division of whole numbers */
  "mr-word-problems": {
    label: "Multiplication and division problems",
    gen: () => {
      const k = ri(0, 4), name = pick(["Ava", "Leo", "Mia", "Noah", "Isla", "Kai", "Ruby", "Eli"]);
      if (k === 0) { const r = ri(12, 38), s = ri(14, 28); return { prompt: `A hall has ${r} rows of chairs with ${s} chairs in each row. How many chairs are there?`, mode: "num", value: r * s, unit: "chairs", why: `${r} × ${s} = ${fmt(r * s)}` }; }
      if (k === 1) { const per = ri(4, 9), n = ri(24, 120); return { prompt: `${n * per} pencils are packed into boxes of ${per}. How many boxes are filled?`, mode: "num", value: n, unit: "boxes", why: `${fmt(n * per)} ÷ ${per} = ${n}` }; }
      if (k === 2) { const per = ri(6, 9), n = ri(20, 60), r = ri(1, per - 1), tot = n * per + r; return { prompt: `${tot} students go on an excursion. Each minibus holds ${per} students. How many minibuses are needed so that everyone can go?`, mode: "num", value: n + 1, unit: "minibuses", why: `${tot} ÷ ${per} = ${n} r ${r}, so ${n} buses are not enough — ${n + 1} are needed.` }; }
      if (k === 3) { const price = ri(6, 19), qty = ri(12, 35), paid = Math.ceil(price * qty / 50) * 50 + 50; return { prompt: `${name} buys ${qty} books at $${price} each and pays with $${paid}. How much change does ${name} get?`, mode: "num", pre: "$", value: paid - price * qty, why: `${qty} × $${price} = $${price * qty}; $${paid} − $${price * qty} = $${paid - price * qty}` }; }
      const a = ri(3, 9), w = ri(15, 45), t = ri(2, 6); return { prompt: `A baker makes ${w} trays of muffins each day, with ${a} muffins on a tray. How many muffins does the baker make in ${t} days?`, mode: "num", value: a * w * t, unit: "muffins", why: `${w} × ${a} = ${w * a} a day; ${w * a} × ${t} = ${fmt(a * w * t)}` };
    }
  },
  /* MA3-GM-01 Part A: grid references name squares, coordinates name points */
  "gm-points-and-squares": {
    label: "Grid references and coordinates",
    gen: () => {
      const k = ri(0, 3), L = "ABCDEFG"[ri(0, 6)], n = ri(1, 6), x = ri(0, 6), y = ri(0, 6);
      if (k === 0) return mc({ prompt: `On a street map, the library is at <b>${L}${n}</b>. Does ${L}${n} name a point or an area?` }, "An area (a square on the map)", ["A point (one exact spot)"], { keepOrder: ["area (a square on the map)", "point (one exact spot)"], html: true });
      if (k === 1) return mc({ prompt: `On a number plane, does the pair <b>(${x}, ${y})</b> name a point or an area?` }, "A point (where two grid lines cross)", ["An area (a square of the grid)"], { keepOrder: ["point (where two grid lines cross)", "area (a square of the grid)"], html: true });
      if (k === 2) return mc({ prompt: "On a number plane, are the numbers on the axes written against the <b>lines</b> or against the <b>spaces</b> between them?" }, "Against the lines", ["Against the spaces"], { keepOrder: ["against the lines", "against the spaces"], html: true });
      return { prompt: `${pick(["Leo", "Mia", "Sam"])} says the point (0, 0) is in the bottom-left square of the grid. Is this true or false?`, mode: "tf", truth: false, why: "(0, 0) is the origin — the point where the two axes cross, not a square." };
    }
  },
  /* MA3-GM-02 Part B: compare lengths written in different units */
  "gm-order-lengths": {
    label: "Order lengths in different units",
    gen: () => {
      for (let t = 0; t < 200; t++) {
        const base = ri(12, 480) * 10;
        const vals = [base, base + pick([-1, 1]) * ri(1, 30) * 10, base + pick([-1, 1]) * ri(40, 300), base + pick([-1, 1]) * ri(5, 90) * 10];
        if (new Set(vals).size < 4 || vals.some(v => v <= 0)) continue;
        const show = v => pick([0, 1, 2]) === 0 ? `${fmt(v / 1000, 3)} m` : pick([0, 1]) ? `${fmt(v / 10, 1)} cm` : `${v} mm`;
        const items = vals.map(v => ({ v, s: show(v) }));
        if (new Set(items.map(i => i.s.split(" ")[1])).size < 2 || new Set(items.map(i => i.s)).size < 4) continue;
        const asc = items.slice().sort((a, b) => a.v - b.v), shown = shuffle(items);
        return { prompt: "Put these lengths in order from shortest to longest.", mode: "order", items: shown.map(i => i.s), correct: asc.map(a => shown.indexOf(a)), ends: ["shortest", "longest"], why: "In millimetres: " + asc.map(i => `${i.s} = ${fmt(i.v)} mm`).join(", ") + "." };
      }
    }
  }
};

/* ======================= the 21 outcomes ======================= */
/* rows: [bank, type, part, statement] — the worksheets' map (tools/whole-topic-worksheets/stage3.py).
   Types that only work on paper are listed in PAPER_ONLY and skipped here. */
const PAPER_ONLY = new Set(["rn:multi-part-number", "ar:onl-draw-your-own", "ar:multistep-word", "mr:multi-part-multiplicative", "fr:shade-fraction", "fr:multi-part-fractions",
  "gm:coordinate-vs-grid-map", "gm:lines-not-spaces", "gm:multi-part-perimeter", "gm:construct-angle", "2d:complete-symmetric", "2d:draw-transformation", "2d:multi-part-area",
  "3d:multi-part-3d", "mt:draw-hands", "mt:multi-part-time", "da:survey-questions", "da:construct-column", "da:construct-dot-plot", "da:multi-part-data", "ch:multi-part-chance"]);
export const OUTCOMES = {
  "MA3-RN-01": { slug: "whole-numbers-integers", strand: "number", title: "Whole Numbers and Integers", full: "Represents Numbers: Whole Numbers and Integers", mastery: "s3-whole-numbers",
    a: "Read, write and order numbers into the millions, the value of each digit, rounding, and regrouping place values.", ab: "Everything in Part A, plus integers: placing them on a number line and reading temperatures below zero.", rows: [
    ["rn", "read-millions", "A", "millions"], ["rn", "order-millions", "A", "millions"], ["rn", "place-value-large", "A", "millions"], ["rn", "round-large", "A", "millions"],
    ["rn", "regroup-thousands", "A", "partition-billion"], ["rn", "partition-nonstandard", "A", "partition-billion"], ["rn", "integer-number-line", "B", "integers"], ["rn", "thermometer-negative", "B", "integers"]] },
  "MA3-RN-02": { slug: "decimals", strand: "number", title: "Decimals", full: "Represents Numbers: Decimals", mastery: "s3-decimals",
    a: "Place value to thousandths, decimals on a hundred grid and a number line, and comparing and ordering decimals.", rows: [
    ["rn", "decimal-place-value", "A", "beyond-hundredths"], ["rn", "hundred-grid", "A", "beyond-hundredths"], ["rn", "compare-decimals", "A", "compare-decimals"], ["rn", "order-decimals", "A", "compare-decimals"], ["rn", "decimal-number-line", "A", "compare-decimals"]] },
  "MA3-RN-03": { slug: "percentages", strand: "number", title: "Percentages", full: "Represents Numbers: Percentages", mastery: "s3-percentages",
    b: "Benchmark fractions, decimals and percentages, percentages of quantities, and discounts of 10%, 25% and 50%.", rows: [
    ["rn", "benchmark-equivalents", "B", "benchmark"], ["rn", "benchmark-grid", "B", "benchmark"], ["rn", "percent-of-quantity", "B", "benchmark"], ["rn", "percentage-discount", "B", "discounts"]] },
  "MA3-AR-01": { slug: "additive-relations", strand: "number", title: "Addition and Subtraction", full: "Additive Relations", mastery: "s3-additive",
    a: "Adding and subtracting large numbers, open number lines, bar models, word problems and estimating to check.", ab: "Everything in Part A, plus choosing efficient strategies (constant difference, bridging) and adding and subtracting decimals and money.", rows: [
    ["ar", "add-multidigit", "A", "mental-written"], ["ar", "subtract-multidigit", "A", "mental-written"], ["ar", "add-three-numbers", "A", "mental-written"], ["ar", "missing-addend", "A", "mental-written"],
    ["ar", "onl-bridging-add", "A", "mental-written"], ["ar", "onl-jump-add", "A", "mental-written"], ["ar", "onl-jumping-over-add", "A", "mental-written"], ["ar", "onl-bridging-sub", "A", "mental-written"], ["ar", "onl-counting-up", "A", "mental-written"],
    ["ar", "bar-model-total", "A", "mental-written"], ["ar", "bar-model-part", "A", "mental-written"], ["ar", "bar-model-compare", "A", "mental-written"], ["ar", "word-problem", "A", "mental-written"],
    ["ar", "estimate-sum", "A", "estimation"], ["ar", "is-it-reasonable", "A", "estimation"],
    ["ar", "choose-strategy", "B", "choose-strategies"], ["ar", "constant-difference", "B", "choose-strategies"], ["ar", "bridging", "B", "choose-strategies"], ["ar", "onl-constant-difference", "B", "choose-strategies"], ["ar", "calculator-or-not", "B", "choose-strategies"], ["ar", "bar-model-draw", "B", "choose-strategies"],
    ["ar", "add-decimals", "B", "decimals"], ["ar", "subtract-decimals", "B", "decimals"], ["ar", "money-totals", "B", "decimals"], ["ar", "bar-model-decimals", "B", "decimals"]] },
  "MA3-MR-01": { slug: "multiplying-dividing", strand: "number", title: "Multiplying and Dividing", full: "Multiplicative Relations: Multiplying and Dividing", mastery: "s3-multiply-divide",
    a: "Arrays, factors and square numbers, area models for multiplying, dividing with and without remainders, and estimating to check.", ab: "Everything in Part A, plus solving multiplication and division problems and multiplying and dividing by 10, 100 and 1000.", rows: [
    ["mr", "array-product", "A", "products-factors"], ["mr", "array-commutative", "A", "products-factors"], ["mr", "factor-rectangles", "A", "products-factors"], ["mr", "prime-composite-arrays", "A", "products-factors"], ["mr", "square-numbers", "A", "products-factors"], ["mr", "missing-factor-pair", "A", "products-factors"],
    ["mr", "partition-to-multiply", "A", "partition-multiply"], ["mr", "build-area-model", "A", "partition-multiply"], ["mr", "area-model-3-digit", "A", "partition-multiply"], ["mr", "area-model-read", "A", "partition-multiply"], ["mr", "area-model-2x2", "A", "multiply-2-digit"],
    ["mr", "division-model-remainder", "A", "remainders"], ["mr", "interpret-remainder", "A", "remainders"], ["mr", "division-model", "A", "divide-1-digit"], ["mr", "divide-3-digit", "A", "divide-1-digit"],
    ["mr", "estimate-product", "A", "estimate-check"], ["mr", "estimate-quotient", "A", "estimate-check"], ["native", "mr-word-problems", "B", "whole-numbers"], ["mr", "powers-of-ten", "B", "powers-of-10"]] },
  "MA3-MR-02": { slug: "number-sentences-patterns", strand: "number", title: "Number Sentences and Patterns", full: "Multiplicative Relations: Number Sentences and Patterns", mastery: "s3-number-sentences",
    b: "Equivalent number sentences and unknowns, patterns made by multiples, common multiples, and brackets and the order of operations.", rows: [
    ["mr", "equivalent-sentence", "B", "equivalent-sentences"], ["mr", "unknown-factor", "B", "equivalent-sentences"], ["mr", "multiples-pattern", "B", "patterns-multiples"], ["mr", "common-multiples", "B", "patterns-multiples"], ["mr", "order-of-operations", "B", "brackets-order"]] },
  "MA3-RQF-01": { slug: "fractions", strand: "number", title: "Fractions", full: "Fractions: Comparing, Adding and Subtracting", mastery: "s3-fractions",
    a: "Naming fractions of a whole, fractions on a number line, mixed numerals, comparing unit fractions, and adding and subtracting with the same denominator.", ab: "Everything in Part A, plus a fraction as a division, comparing and ordering related fractions, equivalent fractions and adding with related denominators.", rows: [
    ["fr", "name-fraction-bar", "A", "one-whole"], ["fr", "name-fraction-circle", "A", "one-whole"], ["fr", "fraction-number-line", "A", "one-whole"], ["fr", "mixed-numerals-bars", "A", "one-whole"], ["fr", "compare-unit-fractions", "A", "unit-fractions"],
    ["fr", "add-same-denominator", "A", "add-same-denominator"], ["fr", "subtract-same-denominator", "A", "add-same-denominator"],
    ["fr", "fraction-as-division", "B", "fraction-division"], ["fr", "compare-related-fractions", "B", "related-denominators"], ["fr", "compare-with-bars", "B", "related-denominators"], ["fr", "order-fractions", "B", "related-denominators"],
    ["fr", "equivalent-fractions", "B", "equivalence-add"], ["fr", "add-with-bars", "B", "equivalence-add"], ["fr", "add-related-denominators", "B", "equivalence-add"]] },
  "MA3-RQF-02": { slug: "fractions-of-quantities", strand: "number", title: "Fractions of Quantities", full: "Fractions: Fractions of Quantities", mastery: "s3-fraction-quantities",
    b: "Building up to the whole from a part, and finding a fraction of a number, a collection or a measurement.", rows: [
    ["fr", "build-to-whole", "B", "build-whole"], ["fr", "fraction-of-quantity", "B", "fraction-of-quantity"], ["fr", "fraction-of-collection", "B", "fraction-of-quantity"], ["fr", "name-fraction-set", "B", "fraction-of-quantity"], ["fr", "fraction-of-measure", "B", "fraction-of-quantity"]] },
  "MA3-GM-01": { slug: "position", strand: "measurement-space", title: "Position", full: "Geometric Measure: Position", mastery: "s3-position",
    a: "Grid maps and grid references, reading and plotting points on a number plane, and the difference between the two.", ab: "Everything in Part A, plus points in all four quadrants.", rows: [
    ["gm", "grid-map-read", "A", "cartesian"], ["gm", "grid-map-give", "A", "cartesian"], ["gm", "read-coordinates", "A", "cartesian"], ["gm", "plot-point", "A", "cartesian"], ["native", "gm-points-and-squares", "A", "cartesian"], ["gm", "four-quadrants", "B", "four-quadrants"]] },
  "MA3-GM-02": { slug: "length", strand: "measurement-space", title: "Length", full: "Geometric Measure: Length", mastery: "s3-length",
    a: "Metres and kilometres, choosing units, and the perimeter of rectangles and other polygons.", ab: "Everything in Part A, plus lengths as decimals, converting between mm, cm, m and km, and comparing lengths in different units.", rows: [
    ["gm", "metre-kilometre", "A", "metres-km"], ["gm", "choose-length-unit", "A", "metres-km"], ["gm", "perimeter-rectangle", "A", "perimeters"], ["gm", "perimeter-polygon", "A", "perimeters"], ["gm", "perimeter-missing-side", "A", "perimeters"],
    ["gm", "decimal-length", "B", "decimal-metric"], ["gm", "convert-length", "B", "convert-length"], ["native", "gm-order-lengths", "B", "compare-lengths"]] },
  "MA3-GM-03": { slug: "angles", strand: "measurement-space", title: "Angles", full: "Geometric Measure: Angles", mastery: "s3-angles",
    a: "Naming types of angles, estimating angles in degrees, and reading a protractor.", ab: "Everything in Part A, plus angles on a straight line, angles at a point and vertically opposite angles.", rows: [
    ["gm", "classify-angle", "A", "measure-angles"], ["gm", "classify-angle-diagram", "A", "measure-angles"], ["gm", "estimate-angle", "A", "measure-angles"], ["gm", "estimate-angle-diagram", "A", "measure-angles"], ["gm", "read-protractor", "A", "protractor"],
    ["gm", "angles-straight-line", "B", "straight-line-point"], ["gm", "angles-at-a-point", "B", "straight-line-point"], ["an4", "vertically-opposite", "B", "intersecting-lines"]] },
  "MA3-2DS-01": { slug: "2d-shapes", strand: "measurement-space", title: "2D Shapes", full: "2D Spatial Structure: Shapes and Transformations", mastery: "s3-2d-shapes",
    a: "Classifying triangles and quadrilaterals, their properties, and lines of symmetry.", ab: "Everything in Part A, plus translations, reflections and rotations on a grid.", rows: [
    ["2d", "classify-triangle-diagram", "A", "classify-shapes"], ["2d", "classify-triangle", "A", "classify-shapes"], ["2d", "classify-quadrilateral-diagram", "A", "classify-shapes"], ["2d", "classify-quadrilateral", "A", "classify-shapes"],
    ["2d", "shape-properties", "A", "classify-shapes"], ["2d", "symmetry-diagram", "A", "classify-shapes"], ["2d", "symmetry", "A", "classify-shapes"],
    ["2d", "name-transformation-grid", "B", "dissect-transform"], ["2d", "describe-translation", "B", "dissect-transform"], ["2d", "transformations", "B", "dissect-transform"]] },
  "MA3-2DS-02": { slug: "area-rectangles", strand: "measurement-space", title: "Area of Rectangles", full: "2D Spatial Structure: Area of Rectangles", mastery: "s3-area-rectangles",
    a: "Choosing units of area including hectares and km², and finding the area of squares and rectangles.", rows: [
    ["2d", "choose-unit", "A", "hectares"], ["2d", "hectares", "A", "hectares"], ["2d", "count-unit-squares", "A", "rectangles"], ["2d", "rows-and-columns", "A", "rectangles"], ["2d", "area-rectangle", "A", "rectangles"], ["2d", "area-square", "A", "rectangles"], ["2d", "missing-side", "A", "rectangles"]] },
  "MA3-2DS-03": { slug: "area-triangles-composite", strand: "measurement-space", title: "Area of Composite Figures, Parallelograms and Triangles", full: "2D Spatial Structure: Area of Composite Figures, Parallelograms and Triangles", mastery: "s3-area-composite",
    b: "The area of shapes made from rectangles, of parallelograms and of triangles.", rows: [
    ["2d", "composite-area-diagram", "B", "composite"], ["2d", "composite-area", "B", "composite"], ["2d", "area-parallelogram", "B", "parallelogram"], ["2d", "area-triangle", "B", "triangle"]] },
  "MA3-3DS-01": { slug: "3d-objects", strand: "measurement-space", title: "3D Objects", full: "3D Spatial Structure: 3D Objects", mastery: "s3-3d-objects",
    a: "Naming prisms and pyramids, their faces, edges and vertices, nets, and views from the top, front and side.", ab: "Everything in Part A, plus building skeletal models of prisms and pyramids.", rows: [
    ["3d", "name-solid", "A", "prisms-pyramids"], ["3d", "prism-or-pyramid", "A", "prisms-pyramids"], ["3d", "faces-edges-vertices", "A", "prisms-pyramids"], ["3d", "face-shapes", "A", "prisms-pyramids"], ["3d", "fev-pattern", "A", "prisms-pyramids"],
    ["3d", "net-to-solid", "A", "3d-to-2d"], ["3d", "cube-nets", "A", "3d-to-2d"], ["3d", "cube-stack-views", "A", "3d-to-2d"], ["3d", "skeletal-models", "B", "construct"]] },
  "MA3-3DS-02": { slug: "volume-capacity", strand: "measurement-space", title: "Volume and Capacity", full: "3D Spatial Structure: Volume and Capacity", mastery: "s3-volume-capacity",
    a: "Units of capacity, reading a measuring jug, capacity problems, volume by displacement and converting mL and L.", ab: "Everything in Part A, plus cubic metres, volume by counting cubes and layers, and the volume of rectangular prisms.", rows: [
    ["3d", "capacity-units", "A", "capacity-units"], ["3d", "read-jug", "A", "capacity-units"], ["3d", "capacity-problems", "A", "capacity-units"], ["3d", "displacement", "A", "displacement"], ["3d", "convert-capacity", "A", "decimal-metric"],
    ["3d", "cubic-metres", "B", "cubic-metres"], ["3d", "count-cubes", "B", "multiplicative-structure"], ["3d", "layers", "B", "multiplicative-structure"], ["3d", "volume-formula", "B", "rectangular-prisms"], ["3d", "missing-dimension", "B", "rectangular-prisms"]] },
  "MA3-NSM-01": { slug: "mass", strand: "measurement-space", title: "Mass", full: "Non-Spatial Measure: Mass", mastery: "s3-mass",
    a: "Choosing units of mass, reading a scale, ordering masses and writing masses as decimals.", ab: "Everything in Part A, plus converting between g, kg and t and solving mass problems.", rows: [
    ["mt", "mass-units", "A", "mass-units"], ["mt", "read-scale", "A", "mass-units"], ["mt", "order-masses", "A", "mass-units"], ["mt", "mass-decimals", "A", "decimal-metric"], ["mt", "convert-mass", "B", "convert-mass"], ["mt", "mass-problems", "B", "convert-mass"]] },
  "MA3-NSM-02": { slug: "time", strand: "measurement-space", title: "Time", full: "Non-Spatial Measure: Time", mastery: "s3-time",
    a: "Reading clocks, 12-hour and 24-hour time and converting between them, and units of time.", ab: "Everything in Part A, plus durations, starting and finishing times, and timetables.", rows: [
    ["mt", "read-clock", "A", "12-24-hour"], ["mt", "to-24-hour", "A", "12-24-hour"], ["mt", "to-12-hour", "A", "12-24-hour"], ["mt", "clock-to-24", "A", "12-24-hour"], ["mt", "time-units", "A", "12-24-hour"],
    ["mt", "duration", "B", "duration"], ["mt", "finish-time", "B", "duration"], ["mt", "start-time", "B", "duration"], ["mt", "timetable", "B", "duration"]] },
  "MA3-DATA-01": { slug: "data-collecting-displaying", strand: "statistics-probability", title: "Collecting and Displaying Data", full: "Data: Collecting and Displaying Data", mastery: "s3-data-collect",
    a: "Categorical and numerical data, choosing a graph and a scale, pictograms with a key, and two-way tables.", rows: [
    ["da", "data-types", "A", "collect"], ["da", "choose-display", "A", "tables-graphs"], ["da", "choose-scale", "A", "tables-graphs"], ["da", "pictogram-key", "A", "tables-graphs"], ["da", "two-way-table", "A", "tables-graphs"]] },
  "MA3-DATA-02": { slug: "data-interpreting", strand: "statistics-probability", title: "Interpreting Data", full: "Data: Interpreting Data", mastery: "s3-data-interpret",
    a: "Reading column graphs with a scale, dot plots, line graphs and time lines.", ab: "Everything in Part A, plus side-by-side column graphs and data claims in the media.", rows: [
    ["da", "many-to-one-scale", "A", "describe-interpret"], ["da", "dot-plot-read", "A", "describe-interpret"], ["da", "line-graph-read", "A", "describe-interpret"], ["da", "line-graph-trend", "A", "describe-interpret"], ["da", "timeline-read", "A", "describe-interpret"],
    ["da", "side-by-side", "B", "compare-displays"], ["da", "misleading-graph", "B", "digital-media"]] },
  "MA3-CHAN-01": { slug: "chance", strand: "statistics-probability", title: "Chance", full: "Chance", mastery: "s3-chance",
    a: "Outcomes of chance experiments, chance words, the 0 to 1 scale, equally likely outcomes and probabilities as fractions.", ab: "Everything in Part A, plus expected and observed results, designing a spinner or bag, and small and large numbers of trials.", rows: [
    ["ch", "list-outcomes", "A", "list-outcomes"], ["ch", "chance-words", "A", "list-outcomes"], ["ch", "probability-scale", "A", "list-outcomes"], ["ch", "equally-likely", "A", "list-outcomes"], ["ch", "probability-fraction", "A", "list-outcomes"], ["ch", "most-likely", "A", "list-outcomes"],
    ["ch", "expected-results", "B", "observed-expected"], ["ch", "observed-vs-expected", "B", "observed-expected"], ["ch", "design-generator", "B", "random-generators"], ["ch", "fraction-decimal-percent", "B", "random-generators"], ["ch", "more-trials", "B", "trials"]] }
};

/* The bank MMTQ.run() takes. */
export function stage3Bank(code, extra = {}) {
  const O = OUTCOMES[code]; if (!O) throw new Error("No Stage 3 outcome " + code);
  /* Levels are the syllabus parts. An outcome with both parts gets "Part A" and "Parts A and B";
     one with a single part (Decimals is all Part A, Percentages all Part B) gets just that part. */
  const hasA = O.rows.some(r => r[2] === "A"), hasB = O.rows.some(r => r[2] === "B");
  const levels = hasA && hasB ? { a: { name: "Part A", sub: O.a, xp: 1 }, ab: { name: "Parts A and B", sub: O.ab, xp: 1.5 } }
    : hasA ? { a: { name: "Part A", sub: O.a, xp: 1.2 } } : { b: { name: "Part B", sub: O.b, xp: 1.5 } };
  const types = O.rows.filter(r => !PAPER_ONLY.has(r[0] + ":" + r[1])).map(([b, id, part, stmt]) => {
    const lv = hasA && hasB ? (part === "A" ? ["a", "ab"] : ["ab"]) : hasA ? ["a"] : ["b"];
    if (b === "native") return { id, levels: lv, label: NATIVE[id].label, stmt, gen: NATIVE[id].gen };
    return { id: `${b}-${id}`, levels: lv, label: rgLabel(b, id), stmt, gen: rgType(b, id) };
  });
  return Object.assign({
    id: "s3-" + O.slug, title: O.title, outcome: code,
    toolId: `s3-${O.slug}-quiz`, tool: `s3-${O.slug}-student-quiz`, mastery: O.mastery,
    levels, readAloud: true, types, related: []
  }, extra);
}
export const _internal = { auto, SPEC, NATIVE, PAPER_ONLY, rg, RM, plain, numAns, fracAns, timeAns, durAns, rgType };
