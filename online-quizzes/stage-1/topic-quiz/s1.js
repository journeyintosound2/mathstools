/* Stage 1 whole-topic quizzes (Years 1–2) — one per outcome, on the shared engine in
   ../../stage-4/topic-quiz/. The questions are the Revision Generator's Stage 1 banks
   (question-banks/stage-1/*), which were written picture-first with a low reading load;
   this file turns each into a quiz question and keeps the words inside a Year 1–2 reading level (most students this age are still learning to read: the
   question is read aloud by itself, and numbers go in on a number pad).

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
import { FN, OUTCOMES } from "./s1-map.js?v=020a89f2";
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

/* ---------- Stage 1 specs (Years 1–2). Most Stage 1 bank questions already ask for a number, a letter or one
   word; these are the ones written for paper. ---------- */
const order1 = (q, items, o = {}) => ord(q, items, plain(q.answer).split(/,\s*/), o.ends || ENDS(q.prompt), Object.assign({ p: "Put these in order. Start with the smallest." }, o));
spec("whole-numbers-a", "order-cards", q => order1(q, q.diagram.config.items.map(plain)));
spec("whole-numbers-b", "order-3digit", q => order1(q, q.diagram.config.items.map(plain)));
spec("position-length-a", "order-lengths", q => order1(q, plain(q.answer).split(/,\s*/).slice().sort(), { diagram: true, ends: ["shortest", "longest"], p: "Put them in order. Start with the shortest." }));
spec("three-d-space-a", "order-capacity", q => order1(q, plain(q.answer).split(/,\s*/).slice().sort(), { ends: ["holds least", "holds most"], p: plain(q.prompt).replace(/\s*Order from.*$/, " Put them in order. Start with the one that holds least.") }));
spec("mass-time-a", "order-mass-blocks", q => order1(q, plain(q.answer).split(/,\s*/).slice().sort(), { ends: ["lightest", "heaviest"], p: plain(q.prompt).replace(/\s*Lightest to heaviest\?$/, " Put them in order. Start with the lightest.") }));
spec("mass-time-b", "order-durations", q => order1(q, plain(q.prompt).replace(/^[^:]*:\s*/, "").replace(/\.$/, "").split(/,\s*/), { ends: ["shortest", "longest"], p: "Put these in order. Start with the shortest time." }));
spec("whole-numbers-a", "chart-missing", q => { const c = q.diagram.config, one = pick(c.blanks || []); if (one == null) return null;
  const b = base(Object.assign({}, q, { diagram: Object.assign({}, q.diagram, { config: Object.assign({}, c, { blanks: [one] }) }) }), { prompt: "What number is missing?" });
  return Object.assign(b, { mode: "num", value: one, why: `Count on from the number before it: ${one - 1}, ${one}.` }); });
spec("whole-numbers-a", "tens-ones-split", q => { const a = ints(q.answer); return multi(q, [F("Tens", a[0]), F("Ones", a[1])], { why: false }); });
spec("whole-numbers-b", "hto-split", q => { const a = ints(q.answer); return multi(q, [F("Hundreds", a[0]), F("Tens", a[1]), F("Ones", a[2])], { why: false }); });
spec("combining-separating-b", "split-add", q => { const a = ints(q.answer), m = /^(\d+ \+ \d+)/.exec(plain(q.prompt)); return a.length === 3 && m ? multi(q, [F("Tens", a[0]), F("Ones", a[1]), F("Total", a[2])], { p: `${m[1]}. Add the tens. Add the ones. Then find the total.` }) : null; });
paper("halves-quarters-a", "shade-half"); paper("halves-quarters-b", "colour-parts"); paper("mass-time-a", "draw-oclock");
spec("two-d-space-b", "compare-area-count", q => { const m = /^([AB]), (\d+) more/.exec(plain(q.answer)); return m ? multi(q, [FM("More squares", ["A", "B"], m[1] === "A" ? 0 : 1), F("How many more", Number(m[2]))], { why: false }) : null; });
spec("three-d-space-b", "build-volume", q => { const a = ints(q.answer); return a.length === 3 ? multi(q, [F("In one layer", a[0]), F("Layers", a[1]), F("Altogether", a[2])], { why: false }) : undefined; });
spec("data-a", "tally-totals", q => { const r = pick(q.diagram.config.rows); return Object.assign(B2(q, { p: `Look at the tally marks. How many for ${r.label}?` }), { mode: "num", value: r.count, why: "Each bundle of tally marks is 5." }); });
spec("data-b", "tally-from-list", q => { const pr = plain(q.answer).split(/,\s*/).map(s => /^(.+?):\s*(\d+)$/.exec(s)); if (pr.some(x => !x)) return null;
  return multi(Object.assign({}, q, { table: null }), pr.map(m => F(m[1], Number(m[2]))), { why: false, p: "Count each kind of picture." }); });
spec("forming-groups-a", "groups-of", q => { const c = q.diagram.config; return c.groups && c.each ? multi(q, [F("Groups", c.groups), F("In each group", c.each)], { why: false }) : undefined; });
spec("forming-groups-b", "left-over", q => { const a = ints(q.answer); return multi(q, [F("Each", a[0]), F("Left over", a[1])], { why: false }); });
spec("data-b", "good-question", q => { const rows = (q.table || {}).rows || [], a = plain(q.answer), hit = rows.find(r => r[0] === a); if (!hit) return null;
  return mc(base(Object.assign({}, q, { table: null }), { prompt: "Which is the best survey question?" }), hit[1], shuffle(rows.filter(r => r !== hit).map(r => r[1])), { html: false }); });
paper("position-length-a", "same-unit");
spec("two-d-space-a", "turned-still-same", q => { if (Math.random() < 0.5) return undefined; const b = B2(q, { p: "Shape B is turned. Is it a different shape now?" }); b.why = "Turning a shape does not change its sides or corners."; return mc(b, "No", ["Yes"], { keepOrder: ["Yes", "No"] }); });
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


/* Stage 1 default: anything the bank gives choices for and asks as "Which…?", "Is…?", "About how…?" is
   CHOSEN (even a number), letters and Yes/No stay in their natural order, and a pair of number cards
   is not drawn twice. */
const autoY = auto;
const NAT = [["A", "B", "C", "D"], ["Yes", "No"], ["will happen", "might happen", "won't happen"], ["impossible", "unlikely", "likely", "certain"], ["more likely", "less likely", "the same"], ["m", "cm"], ["longer", "shorter"], ["odd", "even"], ["True", "False"]];
function natural(out) {
  if (!out || out.mode !== "mc") return out;
  const txt = out.options.map(o => plain(String(o).replace(/<[^>]*>/g, ""))), last = /^(They are the same|the same|It does not matter)$/i;
  const core = txt.filter(t => !last.test(t)), set = NAT.find(n => core.every(t => n.includes(t)));
  if (!set && core.length === txt.length) return out;
  const rank = t => last.test(t) ? 99 : set ? set.indexOf(t) : txt.indexOf(t), idx = txt.map((t, i) => i).sort((a, b) => rank(txt[a]) - rank(txt[b]));
  const right = out.options[out.correct]; out.options = idx.map(i => out.options[i]); out.correct = out.options.indexOf(right);
  return out;
}
auto = function (q, b, id, o = {}) {
  const has = q.mcDistractors && q.mcDistractors.length, p = plain(q.prompt);
  if (has && (/^(Which|About how|Would you|Is |Are |Can |Do |Does |Could )/i.test(p) || /\b(Which|Where is|Yes or no)\b[^.]*\?\s*$/i.test(p) || /(st|nd|rd|th)$/.test(plain(q.answer))))
    return mcBank(q, Object.assign({ keep: true, noDiagram: !!(q.diagram && q.diagram.config && q.diagram.config.diagramType === "cards") }, o));
  return autoY(q, b, id, o);
};
const young0 = young;
young = function (out, q) { out = natural(young0(out, q)); if (typeof out.prompt === "string") out.prompt = out.prompt.replace(/\s*Yes or no\?/i, ""); return out; };


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
export function stage1Bank(code, mods, extra = {}) {
  const O = OUTCOMES[code]; if (!O) throw new Error("No Stage 1 outcome " + code);
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
  const levels = hasA && hasB ? { a: { name: "Part A", sub: `Usually Year 1: ${list(A)}.`, xp: 1 }, ab: { name: "Parts A and B", sub: `Usually Year 2. Everything in Part A, plus ${list(B)}.`, xp: 1.5 } }
    : hasA ? { a: { name: "Part A", sub: `Usually Year 1: ${list(A)}.`, xp: 1.2 } } : { b: { name: "Part B", sub: `Usually Year 2: ${list(B)}.`, xp: 1.5 } };
  return Object.assign({
    id: "s1-" + O.slug, title: O.title, outcome: code,
    toolId: `s1-${O.slug}-quiz`, tool: `s1-${O.slug}-student-quiz`, mastery: "s1-" + O.slug,
    levels, readAloud: true, young: true, year12: true, secondTry: true, autoRead: true, numPad: true, stars: true, defaultCount: 10, types, related: []
  }, extra);
}
export const _internal = { auto, SPEC, NATIVE, PAPER_ONLY, rg, RM, plain, numAns, fracAns, timeAns, durAns, rgType, base, mc, orderQ, cleanPrompt };
