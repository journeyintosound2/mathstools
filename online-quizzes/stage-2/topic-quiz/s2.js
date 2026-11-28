/* Stage 2 whole-topic quizzes (Years 3–4) — one per outcome, on the shared engine in
   ../../stage-4/topic-quiz/. The questions are the Revision Generator's Stage 2 banks
   (question-banks/stage-2/*), which were written picture-first with a low reading load;
   this file turns each into a quiz question and keeps the words inside a Year 3–4 reading level.

   Design decisions for young students (see CLAUDE.md, "STAGE 2 WHOLE-TOPIC QUIZZES"):
   * every question is read aloud on request (bank.readAloud), and so are the answer choices;
   * a WORD is never typed: word answers are always chosen; only numerals, times and
     simple fractions are typed;
   * hard words in a prompt are swapped for everyday ones (EASY), and the harness fails a
     prompt that is too long;
   * a wrong first answer gets ONE more go with a hint before the answer is shown
     (bank.secondTry); only the first go scores;
   * the default quiz is 10 questions.
   The generic machinery (reading an answer, building choices, ordering) is the Stage 3
   file's (stage-3/topic-quiz/s3.js), copied: fix a bug there → port it here.
   THIS FILE IS ASSEMBLED (session scratch: head + s3's machinery + specs + tail). */
import { FN, OUTCOMES } from "./s2-map.js?v=65cf5b95";
export { OUTCOMES };
const C = (typeof window !== "undefined" ? window : globalThis).MMTQCore;
const { ri, pick, shuffle, fmt, gcd } = C;
let MODS = {};
const LABELS = {};
function rgLabel(b, id) {
  if (!LABELS[b]) { LABELS[b] = {}; (MODS[b][FN[b][1]]() || []).forEach(t => { LABELS[b][t.id] = t.label; }); }
  return LABELS[b][id] || id;
}
function rg(b, id) {
  for (let t = 0; t < 8; t++) { const q = (MODS[b][FN[b][0]]({ count: 1, allowedTypes: [id] }) || [])[0]; if (q) return q; }
  throw new Error(`No ${b}:${id} question`);
}

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
let auto = function (q, b, id, o = {}) {
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


/* ======================= per-type specs ======================= */
const SPEC = {};
const PAPER_ONLY = new Set();
const NATIVE = {};
const spec = (b, ids, fn) => { SPEC[b] = SPEC[b] || {}; String(ids).split(/\s+/).forEach(id => { SPEC[b][id] = fn; }); };
const paper = (b, ids) => String(ids).split(/\s+/).forEach(id => PAPER_ONLY.add(b + ":" + id));
/* ---- words: everyday ones for those a Year 3 reader trips on; sentences a screen can't mark are dropped ---- */
const EASY = [[/\bCalculate\b/g, "Work out"], [/\bcalculate\b/g, "work out"], [/\bDetermine\b/g, "Find"], [/\bdetermine\b/g, "find"], [/\bIdentify\b/g, "Name"], [/\bidentify\b/g, "name"], [/\bapproximately\b/g, "about"], [/\bnumeral\b/g, "number"]];
const DROP2 = [/\s*Why\?/g, /\s*How do you know\?/g, /\s*How can you tell[^?]*\?/g, /\s*Explain\./g, /\s*Fill in the boxes\./g, /\s*Write (the|a) multiplication\./g, /\s*What do you notice\?/g];
const tidy = p => { let s = cleanPrompt(p); DROP2.forEach(r => { s = s.replace(r, ""); }); return s.replace(/\s{2,}/g, " ").trim(); };
/* a question that is CHOSEN must not say "write" or "list" */
const REWORD = [[/^Write ([^.]*?) in expanded form\./, "Which one shows $1 in expanded form?"], [/^Write as a multiplication:\s*(.+)$/, "Which multiplication matches $1?"], [/^Write a multiplication for this array\./, "Which multiplication matches this array?"],
  [/^Write (.+?) in words\./, "Which words say $1?"], [/^Write the time in words, using past or to\./, "Which words tell the time?"], [/^Write this digital time in words\./, "Which words say this time?"],
  [/Write two fractions that are equal\./, "Which two fractions are equal?"], [/^Write the shaded part as a fraction and as a decimal\./, "Which one shows the shaded part as a fraction and as a decimal?"], [/Write the grid reference\./, "Choose the grid reference."],
  [/Write the time with am or pm\./, "Which time is right?"], [/^Name this type of angle:[^.]*\./, "What type of angle is this?"], [/List all the possible outcomes\./, "Which list shows all the possible outcomes?"], [/^Write the missing direction\./, "Which direction is missing?"], [/^Write "([^"]+)" as a fraction\./, "Which fraction is $1?"]];
function young(out, q) {
  if (typeof out.prompt === "string") {
    EASY.forEach(([a, b]) => { out.prompt = out.prompt.replace(a, b); }); DROP2.forEach(r => { out.prompt = out.prompt.replace(r, ""); });
    out.prompt = out.prompt.replace(/\b1 (blocks|squares|cubes|rows|groups)\b/g, (m, w) => "1 " + w.slice(0, -1));
    if (typeof out.why === "string") out.why = out.why.replace(/\b1 (thousands|hundreds|tens|ones|blocks|squares|cubes|rows|groups)\b/g, (m, w) => "1 " + w.slice(0, -1));
    if (out.prompt.includes('<table class="dtab">') && !out.prompt.includes("tabWrap")) out.prompt = out.prompt.replace(/<table class="dtab">([\s\S]*?)<\/table>/g, '<div class="tabWrap"><table class="dtab">$1</table></div>');
    if (out.mode === "mc") REWORD.forEach(([a, b]) => { out.prompt = out.prompt.replace(a, b); });
  }
  return out;
}
const B2 = (q, o = {}) => base(q, Object.assign({}, o, o.p != null ? { prompt: RM(o.p) } : { prompt: RM(tidy(q.prompt)) }));
const ints = s => (plain(s).replace(/(\d) (?=\d{3}\b)/g, "$1").match(/\d+(?:\.\d+)?/g) || []).map(Number);
const lastInt = s => { const a = ints(String(s).split("=").pop()); return a.length ? a[a.length - 1] : null; };
/* an option without its reason: "Regular — all sides are equal." → "Regular"; "Yes. There are 4 groups." → "Yes" */
function trimOpt(s) {
  let t = plain(s);
  const yn = /^(Yes|No)\b[.:,—–\s]/.exec(t); if (yn) return yn[1];
  t = t.replace(/\s+[—–]\s.*$/, "").replace(/\s*\((?:or\b[^)]*|[^)]*[=÷×][^)]*|(?:[^)\s]+\s+){2,}[^)]*)\)/g, "").replace(/[.\s]+$/, "");
  return t;
}
const esc2 = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/* choose from the bank's own wrong answers (never from other questions) */
function mcBank(q, o = {}) {
  const raw = [q.answer].concat(q.mcDistractors || []).concat(o.more || []);
  const tr = o.keep ? raw.map(x => String(x)) : raw.map(x => /\[\[frac/.test(String(x)) ? String(x).replace(/\s*\(or[^)]*\)/, "") : trimOpt(x));
  const Bq = B2(q, o); if (o.why !== false && !Bq.why && plain(q.answer) !== tr[0]) Bq.why = RM(q.answer);
  return mc(Bq, tr[0], tr.slice(1), o);
}
const pickMC = (q, correct, wrongs, o = {}) => mc(B2(q, o), String(correct), wrongs.map(String), o);
const yesNo = (q, o = {}) => { const yes = /^yes/i.test(plain(q.answer)); const b = B2(q, o); if (!b.why) b.why = RM(plain(q.answer).replace(/^(Yes|No)[.:,—–\s]+/, "")); return mc(b, yes ? "Yes" : "No", [yes ? "No" : "Yes"], { keepOrder: ["Yes", "No"] }); };
const F = (name, value, unit, pre) => ({ name, q: { mode: "num", value, unit: unit || "", pre: pre || "" } });
const FM = (name, options, correct) => ({ name, q: { mode: "mc", options, correct } });
function multi(q, fields, o = {}) {
  if (fields.some(f => f.q.mode === "num" && !Number.isFinite(f.q.value)) || fields.some(f => f.q.mode === "mc" && f.q.correct < 0)) return null;
  const b = B2(q, o); if (!b.why && o.why !== false) b.why = RM(q.answer);
  return Object.assign(b, { mode: "multi", fields });
}
const finalNum = (q, o = {}) => { const v = lastInt(q.answer); if (v == null) return null; const b = B2(q, o); return Object.assign(b, { mode: "num", value: v, unit: o.unit || "", why: b.why || RM(q.answer) }); };
function sign(q) {
  const m = /^(.*?)\s*☐\s*(.+)$/.exec(String(q.prompt).replace(/^Write <(?:, >)?(?: or [>=])?(?: in the box)?\s*[:.]\s*/, "")); if (!m) return null;
  const b = base(q, { prompt: `Which sign goes in the box?<span class="big">${RM(m[1].trim())} ☐ ${RM(m[2].trim())}</span>` });
  const a = plain(q.answer), opts = ["&lt;", "=", "&gt;"], k = ["<", "=", ">"].indexOf(a); if (k < 0) return null;
  return Object.assign(b, { mode: "mc", options: opts, correct: k, answerHTML: opts[k], speakOptions: ["is less than", "equals", "is greater than"] });
}
function ord(q, items, sorted, ends, o = {}) {
  if (new Set(items).size !== items.length || items.length < 3) return null;
  const b = B2(q, Object.assign({ noDiagram: !o.diagram }, o));
  const shown = shuffle(items.map((s, i) => i)), correct = sorted.map(s => shown.findIndex(i => items[i] === s));
  if (correct.some(i => i < 0)) return null;
  return Object.assign(b, { mode: "order", items: shown.map(i => RM(items[i])), correct, ends });
}
const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function words(n) {
  const u100 = k => k < 20 ? ONES[k] : TENS[Math.floor(k / 10)] + (k % 10 ? "-" + ONES[k % 10] : "");
  const u1000 = k => { const h = Math.floor(k / 100), r = k % 100; return (h ? ONES[h] + " hundred" : "") + (h && r ? " and " : "") + (r ? u100(r) : ""); };
  const t = Math.floor(n / 1000), r = n % 1000;
  return ((t ? u1000(t) + " thousand" : "") + (t && r ? (r < 100 ? " and " : " ") : "") + (r ? u1000(r) : "")) || "zero";
}
const sp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const PV_NAME = { TTh: "Ten thousands", Th: "Thousands", H: "Hundreds", T: "Tens", O: "Ones", t: "Tenths", h: "Hundredths" };

/* ---------- Whole numbers and decimals ---------- */
spec("place-value-a", "complete-pv-chart", q => { const c = q.diagram.config, n = String(ints(q.prompt)[0]).padStart(c.columns.length, "0");
  return multi(q, c.columns.map((col, i) => c.digits[i] == null ? F(PV_NAME[col] || col, Number(n[i])) : null).filter(Boolean), { why: false }); });
spec("place-value-a", "compare-numbers", sign); spec("place-value-b", "compare-decimals", sign); spec("fractions-a", "compare-same-denominator", sign);
const cardOrder = q => { const it = q.diagram.config.items.map(plain); return ord(q, it, plain(q.answer).split(/,\s*/), ENDS(q.prompt), { p: /largest to smallest/i.test(q.prompt) ? "Put these in order. Start with the largest." : "Put these in order. Start with the smallest." }); };
spec("place-value-a", "order-numbers", cardOrder); spec("place-value-b", "order-decimals", cardOrder);
spec("place-value-a", "counting-patterns", q => { const a = ints(q.answer); return a.length === 2 ? multi(q, [F("First gap", a[0]), F("Second gap", a[1])], { why: false }) : undefined; });
spec("place-value-a place-value-b", "numerals-and-words words-5-digit", q => {
  const m = /^Write ([\d ]+) in words/.exec(plain(q.prompt)); if (!m) return undefined;
  const n = Number(m[1].replace(/ /g, "")), d = String(n).split(""), sw = (i, j) => { const e = d.slice(); [e[i], e[j]] = [e[j], e[i]]; return Number(e.join("")); };
  const wrong = [sw(d.length - 1, d.length - 2), sw(0, 1), n % 100 ? n - (n % 100) + ((n % 100) * 10) % 100 : n + 10, n + 100].filter(x => x !== n && x > 0 && String(x).length === d.length);
  return pickMC(q, cap1(words(n)), wrong.map(x => cap1(words(x))), { p: `Which words say ${sp(n)}?` });
});
spec("place-value-b", "expanded-5-digit", q => {
  const m = /^Write ([\d ]+) in expanded form/.exec(plain(q.prompt)); if (!m) return undefined;
  const s = m[1].replace(/ /g, ""), L = s.length, part = (k, sh = 0) => Number(s[k]) * Math.pow(10, L - 1 - k - sh), join = a => a.filter(x => x > 0).map(sp).join(" + ");
  const right = join(s.split("").map((c, k) => part(k)));
  return pickMC(q, right, [join(s.split("").map((c, k) => part(k, 1)).map(Math.floor)), s.split("").filter(c => c !== "0").join(" + "), join(s.split("").map((c, k) => k === 1 ? part(1) * 10 : part(k)))], { p: `Which one shows ${sp(Number(s))} in expanded form?` });
});
spec("place-value-b", "which-rounds", q => mcBank(q, { noDiagram: true, keep: true }));
spec("place-value-b", "decimal-pv", q => /^Which digit/.test(q.prompt) ? undefined : mcBank(q, { keep: true }));
spec("place-value-b", "money-decimals", q => /^Which is more/.test(q.prompt) ? mcBank(q, { keep: true }) : undefined);

/* ---------- Addition and subtraction ---------- */
spec("additive-relations-a", "jump-add jump-subtract", q => finalNum(q));
spec("additive-relations-a", "split-strategy", q => { const a = ints(q.answer), m = /:\s*([^=]+)=/.exec(plain(q.prompt)); return a.length === 3 && m ? multi(q, [F("Tens", a[0]), F("Ones", a[1]), F("Total", a[2])], { p: `Split into tens and ones to add ${m[1].trim()}.` }) : null; });
spec("additive-relations-b", "split-3-digit", q => { const a = ints(q.answer), m = /^(Split to (?:add|subtract)[^.]*\.)/.exec(plain(q.prompt)); return a.length === 4 && m ? multi(q, [F("Hundreds", a[0]), F("Tens", a[1]), F("Ones", a[2]), F("Total", a[3])], { p: m[1] }) : null; });
spec("additive-relations-a", "bridge-to-ten", q => { const a = ints(q.answer); return a.length === 2 ? multi(q, [F("Second jump", a[0], "", "+"), F("Lands on", a[1])], { p: tidy(q.prompt).replace(/:\s*first/, ". First") }) : null; });
spec("additive-relations-b", "find-the-error", q => finalNum(q, { p: "Sam made a mistake. What is the right answer?" }));
paper("additive-relations-b", "which-strategy");
spec("additive-relations-a", "check-with-inverse", q => yesNo(q));

/* ---------- Multiplication and division ---------- */
spec("multiplicative-relations-a", "equal-groups", q => { const c = q.diagram.config; return c.groups && c.each ? multi(q, [F("Groups", c.groups), F("In each group", c.each), F("Altogether", c.groups * c.each)], { p: "How many groups? How many in each group? How many altogether?" }) : undefined; });
spec("multiplicative-relations-a", "are-groups-equal", q => yesNo(q));
spec("multiplicative-relations-a", "skip-count-line", q => finalNum(q));
spec("multiplicative-relations-a", "odd-even", q => { const odd = /^odd/i.test(plain(q.answer)); const b = B2(q); b.why = RM(q.answer); return mc(b, odd ? "Odd" : "Even", [odd ? "Even" : "Odd"], { keepOrder: ["Odd", "Even"] }); });
spec("multiplicative-relations-b", "split-array", q => { const a = ints(q.answer), m = /Fill in:\s*(\d+ × \d+) \+ (\d+ × \d+)/.exec(plain(q.prompt)); return a.length === 3 && m ? multi(q, [F(m[1], a[0]), F(m[2], a[1]), F("Total", a[2])], { p: plain(q.prompt).replace(/\s*Fill in:.*$/, " Work out each part, then the total.") }) : null; });
spec("multiplicative-relations-b", "remainders-groups", q => { const a = ints(q.answer); return multi(q, [F("Full rows", a[0]), F("Left over", a[1])]); });
spec("multiplicative-relations-b", "multiples", q => {
  const m = /^List the first (\d+) multiples of (\d+)/.exec(plain(q.prompt)); if (!m) return undefined;
  const n = Number(m[1]), k = Number(m[2]); if (n > 5) return null;
  const L = f => Array.from({ length: n }, (_, i) => f(i)).join(", ");
  return pickMC(q, L(i => k * (i + 1)), [L(i => k + i), L(i => k * i), L(i => i < n - 1 ? k * (i + 1) : k * (i + 1) + (k > 2 ? -2 : 1)), L(i => (k + 1) * (i + 1))], { p: `Which list shows the first ${n} multiples of ${k}?` });
});

/* ---------- Fractions ---------- */
spec("fractions-a", "equal-parts", q => yesNo(q));
paper("fractions-a", "shade-fraction");
spec("fractions-a", "compare-unit", q => mcBank(q, { keep: true }));
const fracOr = (q, b, id) => auto(q, b, id, { answer: String(q.answer).replace(/\s*\(or[^)]*\)\s*$/, "") });
spec("fractions-b", "number-line-beyond-1 count-beyond-1", fracOr);
spec("fractions-b", "equivalent-wall", q => { const f = fracAns(String(q.answer).trim()), m = /☐\s*([a-z]+)/.exec(plain(q.prompt)); return f && m ? Object.assign(B2(q), { mode: "num", value: f.n, unit: m[1], answerHTML: `${f.n} ${m[1]}` }) : undefined; });
spec("fractions-b", "compare-order-b", (q, b, id) => {
  if (/☐/.test(q.prompt)) return sign(q);
  if (/^Order/.test(q.prompt)) { const it = String(q.prompt).replace(/^[^:]*:\s*/, "").split(/,\s+/).map(s => s.trim()), so = String(q.answer).split(/,\s+/).map(s => s.trim()); return ord(q, it, so, ENDS(q.prompt), { p: /largest to smallest/i.test(q.prompt) ? "Put these in order. Start with the largest." : "Put these in order. Start with the smallest." }); }
  return mcBank(q, { keep: true });
});

/* ---------- Maps, length, angles ---------- */
const OPP = { north: "south", south: "north", east: "west", west: "east" };
function pathMC(q) {
  const m = /^Describe the red path from the ([a-z ]+?)(?: \([A-Z]\d\))? to the ([a-z ]+)\./.exec(plain(q.prompt)); if (!m) return undefined;
  const a = plain(q.answer).replace(/\s*It ends at.*$/, ""), mm = /^Go (\d+) squares? ([a-z-]+), then (\d+) squares? ([a-z-]+)\.$/.exec(a); if (!mm) return null;
  const say = (n1, d1, n2, d2) => `Go ${n1} square${n1 == 1 ? "" : "s"} ${d1}, then ${n2} square${n2 == 1 ? "" : "s"} ${d2}.`;
  const [, n1, d1, n2, d2] = mm, op = d => d.split("-").map(x => OPP[x] || x).join("-");
  return pickMC(q, say(n1, d1, n2, d2), [say(n1, op(d1), n2, d2), say(n1, d1, n2, op(d2)), say(n2, d1, n1, d2), say(n1, op(d1), n2, op(d2)), say(Number(n1) + 1, d1, n2, d2)], { p: `Look at the red path from the ${m[1]} to the ${m[2]}. Which words tell the path?` });
}
spec("geometric-measure-a", "follow-route", pathMC); spec("geometric-measure-b", "route-8", pathMC);
spec("geometric-measure-b", "compass-8", q => { const L = { NE: "north-east", NW: "north-west", SE: "south-east", SW: "south-west" }, miss = Object.keys(q.diagram.config.labels || {}).filter(k => L[k]).sort(); if (miss.length !== 2) return null;
  const all = ["NE", "NW", "SE", "SW"], pairs = []; all.forEach((a, i) => all.slice(i + 1).forEach(b => pairs.push([a, b]))); const say = p => `${L[p[0]]} and ${L[p[1]]}`;
  return pickMC(q, say(miss), shuffle(pairs.filter(p => p.join() !== miss.join())).map(say), { p: "Two compass points are missing. Which two?", why: false }); });
spec("geometric-measure-a", "choose-length-unit", q => mcBank(q, { keep: true }));
spec("geometric-measure-b", "ruler-mm", q => { const a = ints(q.answer); return Object.assign(B2(q, { p: tidy(q.prompt).replace(/\?.*$/, "?") + " Write it in millimetres." }), { mode: "num", value: a[0], unit: "mm", why: RM(q.answer) }); });
spec("geometric-measure-b", "convert-length", q => { const m = /^(\d+) m (\d+) cm$/.exec(plain(q.answer)); return m ? multi(q, [F("Metres", Number(m[1]), "m"), F("Centimetres", Number(m[2]), "cm")], { why: false }) : undefined; });
spec("geometric-measure-b", "same-perimeter", q => { const a = ints(q.answer); return multi(q, [F("Perimeter of A", a[0], "cm"), F("Perimeter of B", a[1], "cm")], { p: "Each square side is 1 cm. Find the perimeter of A and of B." }); });
spec("geometric-measure-b", "order-angles", q => { const so = plain(q.answer).split(/,\s*/); return ord(q, so.slice().sort(), so, ["smallest", "largest"], { diagram: true, p: "Put the angles in order. Start with the smallest." }); });
spec("geometric-measure-a", "compare-lengths", q => mcBank(q, { keep: true }));

/* ---------- 2D shapes, area ---------- */
spec("two-d-space-a", "sides-vertices", q => { const a = ints(q.answer); return a.length === 2 ? multi(q, [F("Sides", a[0]), F("Vertices", a[1])], { why: false }) : undefined; });
spec("two-d-space-a", "turned-shape", q => { const m = /not an? ([a-z ]+?) because/.exec(plain(q.prompt)); if (!m) return yesNo(q);
  const an = /^[aeiou]/.test(m[1]) ? "an" : "a";
  if (Math.random() < 0.5) return yesNo(q);
  const b = B2(q, { p: `Mia says shape B is still ${an} ${m[1]}. It has just been turned. Is Mia right?` }); b.why = "Turning a shape does not change its sides or angles."; return mc(b, "Yes", ["No"], { keepOrder: ["Yes", "No"] }); });
spec("two-d-space-a", "odd-one-out", q => { const labs = (q.diagram.config.items || []).map(i => i.label).filter(Boolean), a = plain(q.answer).charAt(0); if (!labs.includes(a)) return null;
  const b = B2(q); b.why = RM(q.answer); return mc(b, a, labs.filter(x => x !== a), { keepOrder: labs }); });
paper("two-d-space-b", "complete-symmetry");
spec("two-d-space-b", "is-it-symmetry", q => yesNo(q));
spec("two-d-space-b", "split-shape", q => mcBank(q, { keep: true }));
spec("two-d-space-b", "describe-slide", q => { const m = /^(\d+) squares? (right|left) and (\d+) squares? (up|down)$/.exec(plain(q.answer)); if (!m) return null;
  const say = (a, h, b, v) => `${a} ${h} and ${b} ${v}`, [, a, h, b, v] = m, ov = v === "up" ? "down" : "up";
  return pickMC(q, say(a, h, b, v), [say(a, h, b, ov), say(b, h, a, v), say(Number(a) + 1, h, b, v), say(a, h, Number(b) + 1, v)].filter((x, i) => !(i === 1 && a === b)), { p: "Shape A slides to shape B. How many squares does it move?" }); });
spec("two-d-space-a", "compare-areas", q => { const m = /^([AB]), by \d+ squares? \(A = (\d+), B = (\d+)\)/.exec(plain(q.answer)); return m ? multi(q, [F("Area of A", Number(m[2]), "squares"), F("Area of B", Number(m[3]), "squares"), FM("Bigger area", ["A", "B"], m[1] === "A" ? 0 : 1)], { p: "Count the squares in A and in B. Which shape has the bigger area?", why: false }) : null; });
spec("two-d-space-a", "rows-of-squares", q => finalNum(q, { unit: "squares" }));
spec("two-d-space-b", "rectangle-area-cm2", q => finalNum(q, { unit: "cm²" }));
spec("two-d-space-b", "same-area", q => { const a = ints(plain(q.answer).replace(/cm²/g, "")); return multi(q, [F("Area of A", a[0], "cm²"), F("Area of B", a[1], "cm²")], { p: "Each square is 1 cm². Find the area of A and of B." }); });

/* ---------- 3D objects, capacity, volume ---------- */
spec("three-d-space-a", "flat-curved", q => { const m = /^(no|\d+) flat faces? and (no|\d+) curved surfaces?$/.exec(plain(q.answer)); const n = x => x === "no" ? 0 : Number(x); return m ? multi(q, [F("Flat faces", n(m[1])), F("Curved surfaces", n(m[2]))], { why: false }) : undefined; });
spec("three-d-space-a", "roll-stack-slide", q => { const a = plain(q.answer), roll = !/cannot roll/.test(a), stack = !/cannot stack|not stack/.test(a);
  return multi(q, [FM("Can it roll?", ["Yes", "No"], roll ? 0 : 1), FM("Can it stack?", ["Yes", "No"], stack ? 0 : 1)]); });
spec("three-d-space-b", "compare-objects", q => { const m = /^Which has more ([a-z]+): (an? [a-z ]+?) or (an? [a-z ]+?)\?/.exec(plain(q.prompt)), a = /^The ([a-z ]+), by (\d+)/.exec(plain(q.answer)); if (!m || !a) return null;
  const o1 = m[2].replace(/^an? /, ""), o2 = m[3].replace(/^an? /, ""); return multi(q, [FM(`More ${m[1]}`, [cap1(o1), cap1(o2)], a[1] === o1 ? 0 : a[1] === o2 ? 1 : -1), F("How many more", Number(a[2]))]); });
spec("three-d-space-b", "layers", q => { const a = ints(q.answer); return multi(q, [F("Cubes in one layer", a[0]), F("Volume", a[1], "cm³")], { why: false }); });
spec("three-d-space-b", "compare-volume", q => { const a = /^([AB]), by (\d+) cubes?/.exec(plain(q.answer)); return a ? multi(q, [FM("Bigger volume", ["A", "B"], a[1] === "A" ? 0 : 1), F("By how many", Number(a[2]), "cubes")]) : null; });

/* ---------- Mass, time ---------- */
spec("mass-time-a", "balance-compare", q => { const c = q.diagram.config, a = plain(q.answer).replace(/\s+[—–].*$/, "").replace(/^(a|an|the)\s+/i, ""); const o = [c.left, c.right].map(plain); if (!o.includes(a)) return null;
  const b = B2(q); b.why = RM(q.answer); return mc(b, cap1(a), o.filter(x => x !== a).map(cap1), { keepOrder: o.map(cap1) }); });
spec("mass-time-a", "balance-units", q => { const m = /^The ([a-z ]+) balances \d+ blocks\. The ([a-z ]+) balances/.exec(plain(q.prompt)), a = /^The ([a-z ]+), by (\d+)/.exec(plain(q.answer)); if (!m || !a) return null;
  return multi(q, [FM("Heavier", [cap1(m[1]), cap1(m[2])], a[1] === m[1] ? 0 : a[1] === m[2] ? 1 : -1), F("By how many", Number(a[2]), "blocks")], { why: false }); });
spec("mass-time-a", "estimate-mass", q => mcBank(q, { keep: true }));
spec("mass-time-b", "order-masses", q => { const it = plain(q.prompt).replace(/^[^:]*:\s*/, "").split(/,\s+/).map(s => s.trim().replace(/^the /, "")), names = plain(q.answer).split(/,\s*/).map(s => s.replace(/^the /, ""));
  const so = names.map(n => it.find(x => x.startsWith(n + " "))); if (so.some(x => !x)) return null; return ord(q, it.map(cap1), so.map(cap1), ["lightest", "heaviest"], { p: "Put the animals in order. Start with the lightest." }); });
paper("mass-time-a", "draw-hands");
spec("mass-time-b", "am-pm", q => mcBank(q, { keep: true, keepOrder: /\d/.test(plain(q.answer)) ? null : ["am", "pm"] }));
spec("mass-time-b", "seconds", q => /^About/.test(q.prompt) ? mcBank(q, { keep: true }) : undefined);

/* ---------- Data ---------- */
spec("data-a", "complete-tally", q => { const rows = q.diagram.config.rows, r = pick(rows), tot = rows.reduce((s, x) => s + x.count, 0); return multi(q, [F(r.label, r.count), F("Altogether", tot)], { p: `Look at the tally marks. How many for ${r.label}? How many altogether?` }); });
spec("data-a", "tally-from-list", q => { const pr = plain(q.answer).split(/,\s*/).map(s => /^(.+?):\s*(\d+)$/.exec(s)); if (pr.some(x => !x)) return null;
  return multi(q, pr.map(m => F(m[1], Number(m[2]))), { noDiagram: true, why: false, p: tidy(q.prompt).replace(/\s*Make a tally chart\.?/, " Count each answer.") }); });
paper("data-a", "draw-column-graph survey-question"); paper("data-b", "draw-scaled-graph");
spec("data-b", "choose-scale", q => mcBank(q, { keep: true, keepOrder: ["1s", "2s", "5s", "10s"] }));
spec("data-b", "true-false", q => { const m = /"([^"]+)"/.exec(plain(q.prompt)); if (!m) return null; const t = /^true/i.test(plain(q.answer));
  return Object.assign(B2(q, { p: `Look at the graph. Is this true or false? "${m[1]}"` }), { mode: "tf", truth: t, why: RM(plain(q.answer).replace(/^(True|False)\s*[—–]\s*/, "")) }); });
spec("data-b", "table-to-graph", q => { const cats = q.diagram.config.categories, a = plain(q.answer).split(/\s+[—–]/)[0]; if (!cats.includes(a)) return null; const b = B2(q); b.why = RM(q.answer); return mc(b, a, cats.filter(x => x !== a), { keepOrder: cats }); });
spec("data-b", "dot-plot-compare", q => { const a = plain(q.answer), m = /^smallest (\d+), largest (\d+)$/.exec(a); if (m) return multi(q, [F("Smallest", Number(m[1])), F("Largest", Number(m[2]))], { why: false });
  if (/ and /.test(a)) return null; return undefined; });
spec("data-a", "read-dot-plot", q => { const m = /^(\d+); (\d+) altogether$/.exec(plain(q.answer)), p = /How many students had (\d+)\?/.exec(plain(q.prompt)); return m && p ? multi(q, [F(`Students with ${p[1]}`, Number(m[1])), F("Altogether", Number(m[2]))], { why: false }) : undefined; });
spec("data-b", "compare-groups", q => { const m = /^Class (\w+), by (\d+)$/.exec(plain(q.answer)), ds = (q.mcDistractors || []).map(d => (/^Class (\w+)/.exec(plain(d)) || [])[1]).filter(x => x && x !== (m || [])[1]); if (!m || !ds.length) return null;
  const cl = [m[1], ds[0]].sort(); return multi(q, [FM("Class", cl.map(c => "Class " + c), cl.indexOf(m[1])), F("By how many", Number(m[2]))], { why: false }); });

/* ---------- Chance ---------- */
paper("chance-a", "chance-line"); paper("chance-b", "design-spinner");
spec("chance-a", "chance-words", q => mcBank(q, { keep: true, max: 5, more: ["Impossible", "Unlikely", "Equally likely (even chance)", "Likely", "Certain"], keepOrder: ["Impossible", "Unlikely", "Equally likely (even chance)", "Likely", "Certain"], p: tidy(q.prompt).replace(/^Choose a chance word:[^.]*\.\s*/, "Choose the best chance word. ") }));
spec("chance-a", "list-outcomes", q => { if (q.mcDistractors && q.mcDistractors.length) return mcBank(q, { keep: true });
  const cols = plain(q.answer).split(/,\s*/), extra = ["Red", "Blue", "Green", "Yellow", "Purple"].filter(c => !cols.includes(c)); if (cols.length < 2 || !extra.length) return null;
  return pickMC(q, cols.join(", "), [cols.slice(0, -1).join(", "), cols.concat(extra[0]).join(", "), cols.slice(1).concat(extra[extra.length - 1]).join(", ")], { p: "One counter is taken from the bag without looking. Which colours could it be?" }); });
spec("chance-a", "can-it-happen", q => yesNo(q)); spec("chance-b", "equally-likely", q => yesNo(q));
spec("chance-b", "fair-game", q => { const fair = /^fair/i.test(plain(q.answer)); const b = B2(q, { p: tidy(q.prompt).replace(/^Is this game fair\?\s*(.*)$/, "$1 Is this game fair?") }); b.why = RM(plain(q.answer).replace(/^(Not fair|Fair)\s*[—–]\s*/, "")); return mc(b, fair ? "Fair" : "Not fair", [fair ? "Not fair" : "Fair"], { keepOrder: ["Fair", "Not fair"] }); });
spec("chance-b", "record-results", q => { const m = /^Heads (\d+), Tails (\d+)/.exec(plain(q.answer)); return m ? multi(q, [F("Heads (H)", Number(m[1])), F("Tails (T)", Number(m[2]))], { noDiagram: true, why: false, p: tidy(q.prompt).replace(/\s*Record the results.*$/, " Count the heads and the tails.") }) : null; });
spec("chance-b", "observed-expected", q => { const m = /^Expected about (\d+)/.exec(plain(q.answer)); return m ? Object.assign(B2(q, { p: tidy(q.prompt).replace(/\s*How many heads would you expect\?.*$/, " About how many heads would you expect?") }), { mode: "num", value: Number(m[1]), why: RM(q.answer) }) : null; });

/* The default for everything else: a word answer is chosen from the bank's own wrong answers;
   "which is the best…" questions are chosen too; numbers, times and fractions are typed. */
const auto3 = auto;
auto = function (q, b, id, o = {}) {
  const a = o.answer != null ? o.answer : q.answer, has = q.mcDistractors && q.mcDistractors.length;
  if (has && (isWordy(a) || /^(Which|Would you|About how)\b/i.test(plain(q.prompt)) && !numAns(a)?.value && false)) return mcBank(q, o);
  if (has && /^(Which is the best|Would you)\b/i.test(plain(q.prompt))) return mcBank(q, Object.assign({ keep: true }, o));
  if (isWordy(a)) return null;
  return auto3(q, b, id, Object.assign({ prompt: RM(tidy(q.prompt)) }, o));
};

/* ---------- quiz-only types, where the bank's own type needs paper ---------- */
const SURVEYS = [["favourite fruit", "What is your favourite fruit?", ["Do you like apples?", "What is your favourite colour?", "How many apples are in the bowl?"]], ["favourite sport", "What is your favourite sport?", ["Do you play soccer?", "What is your favourite food?", "How many balls are in the shed?"]],
  ["way of getting to school", "How do you get to school?", ["Do you walk to school?", "What time does school start?", "How far away is the school?"]], ["favourite colour", "What is your favourite colour?", ["Do you like red?", "What is your favourite pet?", "How many pencils do you have?"]],
  ["pets at home", "What pets do you have at home?", ["Do you have a dog?", "What is your favourite sport?", "How big is your dog?"]]];
NATIVE["survey-question"] = { outcome: "MA2-DATA-01", part: "A", label: "Choose a good survey question", gen: () => { const [topic, good, bad] = pick(SURVEYS);
  return mc({ prompt: `You want to find out your class's ${topic}. Which is the best question to ask everyone?`, diagram: null, why: "A good survey question lets everyone give their own answer about the topic." }, good, shuffle(bad), { html: true }); } };
const GRAPHS = [["Colour", ["Red", "Blue", "Green", "Yellow"]], ["Pet", ["Dog", "Cat", "Fish", "Bird"]], ["Fruit", ["Apple", "Banana", "Grapes", "Mango"]], ["Sport", ["Soccer", "Netball", "Cricket", "Swimming"]]];
NATIVE["column-heights"] = { outcome: "MA2-DATA-01", part: "A", label: "Plan a column graph from a table", gen: () => { const [head, cats] = pick(GRAPHS), vals = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4), k = ri(0, 3), tall = vals.indexOf(Math.max(...vals));
  const t = tableHTML({ headerRow: true, rows: [[head, ...cats], ["Number", ...vals.map(String)]] });
  return Math.random() < 0.5
    ? { prompt: `You are drawing a column graph of this table. How many squares tall is the column for ${cats[k]}?` + t, diagram: null, mode: "num", value: vals[k], unit: "squares", why: `${cats[k]} has ${vals[k]}, so its column is ${vals[k]} squares tall.` }
    : mc({ prompt: "You are drawing a column graph of this table. Which column will be the tallest?" + t, diagram: null, why: `${cats[tall]} has the biggest number (${vals[tall]}), so it has the tallest column.` }, cats[tall], cats.filter((c, i) => i !== tall), { keepOrder: cats }); } };
NATIVE["fact-family-md"] = { outcome: "MA2-MR-02", part: "A", label: "Fact families (× and ÷)", gen: () => { let a = ri(2, 10), b = pick([2, 3, 4, 5, 10]); if (a === b) a += 1; const p = a * b;
  return mc({ prompt: `${a} × ${b} = ${p}. Which fact is in the same fact family?`, diagram: null, why: `${a} × ${b} = ${p}, so ${p} ÷ ${b} = ${a} and ${p} ÷ ${a} = ${b}.` }, `${p} ÷ ${b} = ${a}`, shuffle([`${p} − ${b} = ${p - b}`, `${a} + ${b} = ${a + b}`, `${p} ÷ ${a} = ${a}`, `${p} × ${b} = ${a}`]), { html: true }); } };
spec("chance-b", "more-trials", q => { if (Math.random() < 0.5) return undefined; const sw = s => String(s).replace(/Leo|Mia/g, m => m === "Leo" ? "Mia" : "Leo");
  return mcBank(Object.assign({}, q, { prompt: sw(q.prompt), answer: sw(q.answer), mcDistractors: (q.mcDistractors || []).map(sw), working: (q.working || []).map(sw) })); });


function rgType(b, id) {
  const sp = (SPEC[b] || {})[id];
  return () => {
    for (let t = 0; t < 30; t++) {
      const q = rg(b, id);
      let out = sp ? sp(q, b, id) : auto(q, b, id);
      if (out === undefined && sp) out = auto(q, b, id);
      if (out && out.prompt) { out.key = b + id + plain(q.prompt) + plain(q.answer) + JSON.stringify((q.diagram && q.diagram.config) || "").slice(0, 300); return young(out, q); }
    }
    throw new Error(`Could not make a ${b}:${id} question`);
  };
}
export function stage2Bank(code, mods, extra = {}) {
  const O = OUTCOMES[code]; if (!O) throw new Error("No Stage 2 outcome " + code);
  MODS = Object.assign(MODS, mods);
  const rows = O.rows.filter(r => !PAPER_ONLY.has(r[0] + ":" + r[1])).concat(Object.keys(NATIVE).filter(k => NATIVE[k].outcome === code).map(k => ["native", k, NATIVE[k].part]));
  const hasA = rows.some(r => r[2] === "A"), hasB = rows.some(r => r[2] === "B");
  const types = rows.map(([b, id, part]) => {
    const lv = hasA && hasB ? (part === "A" ? ["a", "ab"] : ["ab"]) : hasA ? ["a"] : ["b"];
    if (b === "native") return { id, levels: lv, label: NATIVE[id].label, gen: () => young(NATIVE[id].gen(), null) };
    return { id: `${b.replace(/^.*-(a|b)$/, "$1")}-${id}`, levels: lv, label: rgLabel(b, id), gen: rgType(b, id) };
  });
  const low = t => t.label.charAt(0).toLowerCase() + t.label.slice(1);
  const list = l => l.slice(0, 4).map(low).join(", ") + (l.length > 4 ? " and more" : "");
  const A = types.filter(t => t.levels[0] === "a"), B = types.filter(t => t.levels[0] !== "a");
  const levels = hasA && hasB ? { a: { name: "Part A", sub: `Usually Year 3: ${list(A)}.`, xp: 1 }, ab: { name: "Parts A and B", sub: `Usually Year 4. Everything in Part A, plus ${list(B)}.`, xp: 1.5 } }
    : hasA ? { a: { name: "Part A", sub: `Usually Year 3: ${list(A)}.`, xp: 1.2 } } : { b: { name: "Part B", sub: `Usually Year 4: ${list(B)}.`, xp: 1.5 } };
  return Object.assign({
    id: "s2-" + O.slug, title: O.title, outcome: code,
    toolId: `s2-${O.slug}-quiz`, tool: `s2-${O.slug}-student-quiz`, mastery: "s2-" + O.slug,
    levels, readAloud: true, young: true, secondTry: true, defaultCount: 10, types, related: []
  }, extra);
}
export const _internal = { auto, SPEC, NATIVE, PAPER_ONLY, rg, RM, plain, numAns, fracAns, timeAns, durAns, rgType, base, mc, orderQ, cleanPrompt };
