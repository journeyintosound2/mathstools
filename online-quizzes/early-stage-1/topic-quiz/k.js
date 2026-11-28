/* Early Stage 1 (Kindergarten) whole-topic quizzes AND worksheets — one per outcome.
   This file is the ONE source of the questions: the quiz pages run them on the shared engine
   (../../stage-4/topic-quiz/engine.js) and the worksheet creators (worksheet-creators/early-stage-1/…)
   load the same bank files, so the screen and the paper ask the same things.

   Design decisions for five- and six-year-olds (most cannot read yet):
   * the question is ONE short sentence, read aloud by itself (bank.autoRead); answer choices are read too;
   * nothing is typed except a number, on the on-screen number pad; everything else is tapped;
   * where it can be, the answer choices are PICTURES (speakOptions gives each a spoken name);
   * every question has a picture, drawn here from the same numbers as the answer;
   * numbers stay within 20 (within 10 for adding, taking away and parts of numbers), as the syllabus sets;
   * a missed question gets one more go (bank.secondTry); 8 questions by default; stars, not a mark.
   Every type names the content statement it serves (stmt = an id in resources/contentStatements.js).
   Pictures are plain inline SVG (no engine needed) except ten-frames, dice and clocks. */
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[ri(0, a.length - 1)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const INK = "#1f2937";
const COL = { red: "#ef4444", blue: "#3b82f6", yellow: "#facc15", green: "#22c55e", orange: "#fb923c", purple: "#a855f7", pink: "#f472b6" };
const st = `stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"`;

/* ---------- pictures: every icon is drawn in a 40 × 40 box ---------- */
const starPts = (() => { const p = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 7 : 16, a = -Math.PI / 2 + i * Math.PI / 5; p.push((20 + r * Math.cos(a)).toFixed(1) + "," + (21 + r * Math.sin(a)).toFixed(1)); } return p.join(" "); })();
const ICON = {
  apple: () => `<circle cx="20" cy="24" r="13" fill="${COL.red}" ${st}/><path d="M20 11 q1 -6 5 -8" fill="none" stroke="#7c4a1e" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="28" cy="8" rx="5" ry="2.6" fill="${COL.green}" transform="rotate(-25 28 8)"/>`,
  star: () => `<polygon points="${starPts}" fill="${COL.yellow}" ${st}/>`,
  ball: () => `<circle cx="20" cy="20" r="15" fill="${COL.blue}" ${st}/><path d="M7 13 q13 9 26 0" fill="none" stroke="#fff" stroke-width="2.6"/>`,
  fish: () => `<path d="M3 20 q13 -15 26 0 q-13 15 -26 0z" fill="${COL.orange}" ${st}/><path d="M28 20 l10 -8 v16z" fill="${COL.orange}" ${st}/><circle cx="11" cy="18" r="1.9" fill="${INK}"/>`,
  flower: () => [0, 1, 2, 3, 4].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return `<circle cx="${(20 + 10 * Math.cos(a)).toFixed(1)}" cy="${(20 + 10 * Math.sin(a)).toFixed(1)}" r="7" fill="${COL.pink}" ${st}/>`; }).join("") + `<circle cx="20" cy="20" r="6" fill="${COL.yellow}" ${st}/>`,
  heart: () => `<path d="M20 35 C2 22 6 5 20 14 C34 5 38 22 20 35z" fill="${COL.red}" ${st}/>`,
  counter: c => `<circle cx="20" cy="20" r="15" fill="${COL[c] || c || COL.red}" ${st}/>`,
  block: c => `<rect x="4" y="4" width="32" height="32" rx="4" fill="${COL[c] || c || COL.blue}" ${st}/>`,
  circle: c => `<circle cx="20" cy="20" r="16" fill="${COL[c] || c || COL.blue}" ${st}/>`,
  square: c => `<rect x="5" y="5" width="30" height="30" fill="${COL[c] || c || COL.red}" ${st}/>`,
  triangle: c => `<polygon points="20,4 37,35 3,35" fill="${COL[c] || c || COL.green}" ${st}/>`,
  rectangle: c => `<rect x="1" y="10" width="38" height="20" fill="${COL[c] || c || COL.yellow}" ${st}/>`,
  cross: () => `<path d="M6 6 L34 34 M34 6 L6 34" stroke="#dc2626" stroke-width="4" stroke-linecap="round"/>`
};
const THINGS = ["apple", "star", "ball", "fish", "flower", "heart"];
const PL = { apple: "apples", star: "stars", ball: "balls", fish: "fish", flower: "flowers", heart: "hearts", counter: "counters", block: "blocks" };
const nm = (t, n) => (n === 1 ? t : PL[t] || t + "s");
const at = (inner, x, y, s = 1, extra = "") => `<g transform="translate(${x} ${y}) scale(${s})${extra}">${inner}</g>`;
/* svg wrapper: w × h user units, shown `px` wide on screen (never wider than its box) */
const svg = (w, h, inner, px) => `<svg class="kpic" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${px}" style="max-width:100%;height:auto" role="img">${inner}</svg>`;
const D = (w, h, inner, px, wMM) => ({ html: svg(w, h, inner, px), wMM: wMM || Math.round(px / 5) });
/* a collection in rows: items = array of 40-box drawings ("" leaves a gap) */
function rows(items, per = 5, o = {}) {
  const c = o.cell || 46, n = items.length, R = Math.ceil(n / per), W = Math.min(n, per) * c + 6, H = R * c + 6;
  const g = items.map((it, i) => it ? at(it, 6 + (i % per) * c, 6 + Math.floor(i / per) * c) : "").join("");
  return { w: W, h: H, g };
}
const coll = (items, per = 5, px) => { const r = rows(items, per); return D(r.w, r.h, r.g, px || Math.min(420, r.w * 1.5)); };
const optPic = (items, per = 5, px) => { const r = rows(items, per); return svg(r.w, r.h, r.g, Math.round(r.w * (px ? Math.min(1, px / 144) : 0.85))); };
const one = (inner, px = 78) => svg(44, 44, at(inner, 2, 2), px);
/* objects scattered (not in rows) so a small number is seen, not counted along a line */
function scatter(n, inner) {
  const spots = shuffle([[8, 6], [62, 4], [116, 10], [22, 54], [84, 50], [128, 58], [50, 98], [104, 100], [4, 100]]).slice(0, n);
  return D(176, 146, spots.map(([x, y]) => at(inner, x + ri(-3, 3), y + ri(-3, 3))).join(""), 300);
}
const tenFrame = (a, b = 0, frames) => ({ engine: "manipulatives-engine", config: Object.assign({ diagramType: "ten-frame", count: a, count2: b }, frames ? { frames } : {}), scale: 1.25 });
const dice = v => ({ engine: "manipulatives-engine", config: { diagramType: "dice", values: v }, scale: 1.3 });
const clock = h => ({ engine: "measure-engine", config: { diagramType: "clock", hours: h, minutes: 0 }, scale: 1.1 });
const digital = h => ({ engine: "measure-engine", config: { diagramType: "digital", text: h + ":00" }, scale: 1.1 });

/* ---------- question makers ---------- */
const num = (prompt, value, o = {}) => Object.assign({ prompt, mode: "num", value }, o);
/* opts: [{ h: html, s: spoken, ok }] — shuffled unless o.keep */
function mc(prompt, opts, o = {}) {
  const list = o.keep ? opts : shuffle(opts);
  const q = Object.assign({ prompt, mode: "mc", options: list.map(x => x.h), speakOptions: list.map(x => x.s || String(x.h)), correct: list.findIndex(x => x.ok) }, o); delete q.keep; return q;
}
const W = (word, ok) => ({ h: word, s: word, ok: !!ok });                     // a word or numeral choice
const numChoices = (ans, lo = 0, hi = 20) => { const s = new Set([ans]); [ans + 1, ans - 1, ans + 2, ans - 2].forEach(v => { if (v >= lo && v <= hi && s.size < 4) s.add(v); }); return [...s].sort((a, b) => a - b).map(v => W(String(v), v === ans)); };
const AB = ["A", "B", "C", "D"];
const lab = (x, y, t, size = 22) => `<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="${size}" fill="${INK}" text-anchor="middle">${t}</text>`;
const labChoices = (n, ok) => AB.slice(0, n).map((L, i) => W(L, i === ok));
const two = (a, b) => (a === b ? null : [a, b]);
const diff = (lo, hi, n) => shuffle(range(lo, hi)).slice(0, n);

const TYPES = [];
const T = (code, stmt, id, label, gen) => TYPES.push({ code, stmt, id, label, gen });
/* a pencil-and-paper type: only on the worksheet (drawing, colouring), never in the online quiz */
const PT = (code, stmt, id, label, gen) => TYPES.push({ code, stmt, id, label, gen, paper: true });
const drawQ = (prompt, key, o = {}) => Object.assign({ prompt, mode: "none", noAnswerBox: true, answerHTML: key, why: "" }, o);

/* =====================================================================================
   MAE-RWN-01  demonstrates an understanding of how whole numbers indicate quantity
   ===================================================================================== */
T("MAE-RWN-01", "instantly-name", "see-dots", "See how many dots (dice patterns)", () => { const n = ri(1, 6); return num("How many dots?", n, { diagram: dice([n]), why: `The dice shows ${n}.` }); });
T("MAE-RWN-01", "instantly-name", "see-things", "See how many (up to 5)", () => { const n = ri(1, 5), t = pick(THINGS); return num(`How many ${nm(t, 2)}?`, n, { diagram: scatter(n, ICON[t]()), why: `There ${n === 1 ? "is" : "are"} ${n} ${nm(t, n)}.` }); });
T("MAE-RWN-01", "instantly-name", "which-shows", "Which picture shows the number?", () => {
  const [a, b, c] = diff(1, 5, 3), t = pick(THINGS);
  return mc(`Which box has ${a}?`, [a, b, c].map((n, i) => ({ h: optPic(Array(n).fill(ICON[t]()), 3, 120), s: "this box", ok: i === 0 })), { why: `That box has ${a} ${nm(t, a)}.` });
});
T("MAE-RWN-01", "number-patterns", "ten-frame", "How many on the ten-frame?", () => { const n = ri(1, 10); return num("How many counters?", n, { diagram: tenFrame(n), why: n > 5 ? `5 on the top row and ${n - 5} more makes ${n}.` : `There are ${n} counters.` }); });
T("MAE-RWN-01", "number-patterns", "same-number", "Which shows the same number?", () => {
  const [a, b, c] = diff(2, 6, 3), t = pick(THINGS);
  return mc("Which box has the same number as the dice?", [a, b, c].map((n, i) => ({ h: optPic(Array(n).fill(ICON[t]()), 3, 120), s: "this box", ok: i === 0 })), { diagram: dice([a]), why: `The dice shows ${a}. That box has ${a} too.` });
});
T("MAE-RWN-01", "number-patterns", "two-dice", "Two dice: how many dots altogether?", () => { const a = ri(1, 5), b = ri(1, Math.min(5, 10 - a)); return num("How many dots altogether?", a + b, { diagram: dice([a, b]), why: `${a} and ${b} makes ${a + b}.` }); });
T("MAE-RWN-01", "counting-sequence", "number-after", "The number after", () => { const n = ri(1, 19); return num(`What number comes after ${n}?`, n + 1, { why: `Count on: ${n}, ${n + 1}.` }); });
T("MAE-RWN-01", "counting-sequence", "number-before", "The number before", () => { const n = ri(2, 20); return num(`What number comes before ${n}?`, n - 1, { why: `Count back: ${n}, ${n - 1}.` }); });
const track = (vals, hole) => { const c = 58; return D(vals.length * c + 8, 66, vals.map((v, i) => `<rect x="${4 + i * c}" y="4" width="${c - 6}" height="56" rx="9" fill="${i === hole ? "#fef9c3" : "#eff6ff"}" ${st}/>` + lab(4 + i * c + (c - 6) / 2, 42, i === hole ? "?" : v, 28)).join(""), Math.min(430, vals.length * 84)); };
T("MAE-RWN-01", "counting-sequence", "missing-number", "The missing number when counting on", () => { const a = ri(1, 16), hole = ri(1, 3), v = range(a, a + 4); return num("What number is missing?", v[hole], { diagram: track(v, hole), why: `Count: ${v.join(", ")}.` }); });
T("MAE-RWN-01", "counting-sequence", "count-back", "The missing number when counting back", () => { const a = ri(5, 20), hole = ri(2, 4), v = range(a - 4, a).reverse(); return num("Count back. What number is missing?", v[hole], { diagram: track(v, hole), why: `Count back: ${v.join(", ")}.` }); });

/* =====================================================================================
   MAE-RWN-02  reads numerals and represents whole numbers to at least 20
   ===================================================================================== */
T("MAE-RWN-02", "connect-counting-numerals", "count-10", "Count a collection (to 10)", () => { const n = ri(3, 10), t = pick(THINGS); return num(`How many ${nm(t, 2)}?`, n, { diagram: coll(Array(n).fill(ICON[t]()), 5), why: `Count them: ${n} ${nm(t, n)}.` }); });
T("MAE-RWN-02", "connect-counting-numerals", "count-20", "Count a collection (to 20)", () => { const n = ri(11, 20), t = pick(THINGS); return num(`How many ${nm(t, 2)}?`, n, { diagram: coll(Array(n).fill(ICON[t]()), 5, 330), why: `10 and ${n - 10} more makes ${n}.` }); });
T("MAE-RWN-02", "connect-counting-numerals", "none", "Zero: none left", () => { const t = pick(["apple", "fish", "flower"]); return num(`How many ${nm(t, 2)} are on the plate?`, 0, { diagram: D(200, 90, `<ellipse cx="100" cy="52" rx="92" ry="30" fill="#f8fafc" ${st}/><ellipse cx="100" cy="52" rx="62" ry="18" fill="#fff" stroke="#cbd5e1" stroke-width="1.5"/>`, 280), why: "The plate is empty. None is zero." }); });
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
T("MAE-RWN-02", "connect-counting-numerals", "hear-number", "Find the number you hear", () => { const n = ri(1, 20); return mc(`Find the number ${WORDS[n]}.`, numChoices(n, 1, 20).map(o => Object.assign(o, { s: "this number" })), { keep: true, why: `${WORDS[n][0].toUpperCase() + WORDS[n].slice(1)} is written ${n}.` }); });
T("MAE-RWN-02", "connect-counting-numerals", "match-numeral", "Match a number to a collection", () => {
  const [a, b, c] = diff(4, 10, 3), t = pick(THINGS);
  return mc(`Which box has ${a}?`, [a, b, c].map((n, i) => ({ h: optPic(Array(n).fill(ICON[t]()), 5, 150), s: "this box", ok: i === 0 })), { why: `Count them. That box has ${a}.` });
});
T("MAE-RWN-02", "connect-counting-numerals", "more", "Which group has more?", () => {
  const [a, b] = diff(2, 9, 2), t = pick(THINGS), more = pick([true, false]), ok = more ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
  const r = [a, b].map(n => rows(Array(n).fill(ICON[t]()), 5));
  const g = lab(16, 40, "A") + at(r[0].g, 34, 0) + lab(16, 148, "B") + at(r[1].g, 34, 108);
  return mc(`Which group has ${more ? "more" : "fewer"}?`, labChoices(2, ok), { keep: true, diagram: D(280, 208, g, 380), why: `A has ${a}. B has ${b}. ${Math[more ? "max" : "min"](a, b)} is ${more ? "more" : "fewer"}.` });
});
T("MAE-RWN-02", "connect-counting-numerals", "biggest-number", "The biggest or smallest number", () => {
  const v = diff(1, 20, 3), big = pick([true, false]), ans = Math[big ? "max" : "min"](...v);
  return mc(`Which number is the ${big ? "biggest" : "smallest"}?`, v.map(n => W(String(n), n === ans)), { keep: true, why: `${ans} is the ${big ? "biggest" : "smallest"}: ${v.slice().sort((a, b) => a - b).join(", ")}.` });
});
T("MAE-RWN-02", "connect-counting-numerals", "teen-frame", "Teen numbers on two ten-frames", () => { const n = ri(11, 19); return num("How many counters?", n, { diagram: tenFrame(10, n - 10, 2), why: `10 and ${n - 10} more makes ${n}.` }); });

/* =====================================================================================
   MAE-CSQ-01  combining and separating, and comparing collections
   ===================================================================================== */
T("MAE-CSQ-01", "additive-relations", "altogether", "How many altogether? (two colours)", () => { const a = ri(1, 6), b = ri(1, Math.min(5, 10 - a)); return num(`${a} red and ${b} blue. How many altogether?`, a + b, { diagram: coll([...Array(a).fill(ICON.counter("red")), ...Array(b).fill(ICON.counter("blue"))], 5), why: `${a} and ${b} makes ${a + b}.` }); });
T("MAE-CSQ-01", "additive-relations", "join-groups", "Join two groups", () => {
  const a = ri(1, 5), b = ri(1, 5), t = pick(THINGS), A = rows(Array(a).fill(ICON[t]()), 3), B = rows(Array(b).fill(ICON[t]()), 3), h = Math.max(A.h, B.h);
  return num(`How many ${nm(t, 2)} altogether?`, a + b, { diagram: D(330, h + 16, `<rect x="2" y="2" width="150" height="${h + 12}" rx="12" fill="#eff6ff" ${st}/><rect x="178" y="2" width="150" height="${h + 12}" rx="12" fill="#fefce8" ${st}/>` + at(A.g, 6, 6) + at(B.g, 182, 6), 430), why: `${a} and ${b} makes ${a + b}.` });
});
T("MAE-CSQ-01", "additive-relations", "take-away", "Take away: how many are left?", () => {
  const n = ri(3, 10), k = ri(1, n - 1), t = pick(THINGS);
  return num(`${n} ${nm(t, n)}. ${k} ${k === 1 ? "is" : "are"} crossed out. How many are left?`, n - k, { diagram: coll(range(1, n).map(i => ICON[t]() + (i > n - k ? ICON.cross() : "")), 5), why: `${n} take away ${k} leaves ${n - k}.` });
});
T("MAE-CSQ-01", "additive-relations", "one-more", "One more, one less", () => { const n = ri(2, 9), more = pick([true, false]); return num(`${n} counters. What is one ${more ? "more" : "less"}?`, n + (more ? 1 : -1), { diagram: tenFrame(n), why: `One ${more ? "more" : "less"} than ${n} is ${n + (more ? 1 : -1)}.` }); });
const twoRows = (a, b, t1, t2) => { const g = range(1, a).map(i => at(ICON[t1](), 6 + (i - 1) * 46, 6)).join("") + range(1, b).map(i => at(ICON[t2](), 6 + (i - 1) * 46, 58)).join(""); return D(Math.max(a, b) * 46 + 8, 106, g, Math.min(430, Math.max(a, b) * 62)); };
T("MAE-CSQ-01", "additive-relations", "how-many-more", "Compare: how many more?", () => {
  const [t1, t2] = shuffle(THINGS), b = ri(1, 6), a = b + ri(1, Math.min(3, 8 - b));
  return num(`How many more ${nm(t1, 2)} than ${nm(t2, 2)}?`, a - b, { diagram: twoRows(a, b, t1, t2), why: `${a} ${nm(t1, a)} and ${b} ${nm(t2, b)}. ${a} is ${a - b} more than ${b}.` });
});
T("MAE-CSQ-01", "additive-relations", "which-more", "Compare: which has more?", () => {
  const [t1, t2] = shuffle(THINGS), [a, b] = diff(2, 8, 2), first = a > b;
  return mc("Which has more?", [{ h: one(ICON[t1]()), s: nm(t1, 2), ok: first }, { h: one(ICON[t2]()), s: nm(t2, 2), ok: !first }], { keep: true, diagram: twoRows(a, b, t1, t2), why: `There are ${a} ${nm(t1, a)} and ${b} ${nm(t2, b)}.` });
});

/* =====================================================================================
   MAE-CSQ-02  the parts that form the whole, with numbers up to 10
   ===================================================================================== */
T("MAE-CSQ-02", "part-whole-10", "make-five", "How many more to make 5?", () => { const n = ri(1, 4); const c = 52; return num("How many more to make 5?", 5 - n, { diagram: D(5 * c + 8, 60, range(0, 4).map(i => `<rect x="${4 + i * c}" y="4" width="${c}" height="${c}" fill="#fff" ${st}/>` + (i < n ? at(ICON.counter("red"), 4 + i * c + 6, 10) : "")).join(""), 360), why: `${n} and ${5 - n} makes 5.` }); });
T("MAE-CSQ-02", "part-whole-10", "make-ten", "How many more to make 10?", () => { const n = ri(1, 9); return num("How many more to make 10?", 10 - n, { diagram: tenFrame(n), why: `${n} and ${10 - n} makes 10. Count the empty boxes.` }); });
T("MAE-CSQ-02", "part-whole-10", "two-parts", "Two parts of a number", () => { const n = ri(3, 10), a = ri(1, n - 1); return num(`${n} is ${a} and what number?`, n - a, { diagram: coll([...Array(a).fill(ICON.counter("red")), ...Array(n - a).fill(ICON.counter("yellow"))], 5), why: `${n} is ${a} and ${n - a}.` }); });
T("MAE-CSQ-02", "part-whole-10", "hiding", "How many are hiding?", () => {
  const n = ri(3, 9), show = ri(1, n - 1), r = rows(Array(show).fill(ICON.counter("blue")), 5);
  const cup = `<path d="M0 0 h88 l-12 78 h-64z" fill="#fde68a" ${st}/>` + lab(44, 50, "?", 30);
  return num(`There are ${n} counters. Some are under the cup. How many are hiding?`, n - show, { diagram: D(r.w + 120, Math.max(r.h, 90), at(r.g, 0, Math.max(0, (90 - r.h) / 2)) + at(cup, r.w + 20, 6), 400), why: `${show} are showing. ${show} and ${n - show} makes ${n}.` });
});
T("MAE-CSQ-02", "part-whole-10", "which-pair", "Which two numbers make it?", () => {
  const n = ri(4, 10), a = ri(1, n - 1), bad = shuffle(range(1, 9).filter(x => x !== n - a && x !== a)).slice(0, 2);
  return mc(`Which two numbers make ${n}?`, [{ h: `${a} and ${n - a}`, ok: true }, ...bad.map(x => ({ h: `${a} and ${x}` }))], { why: `${a} and ${n - a} makes ${n}.` });
});
T("MAE-CSQ-02", "part-whole-10", "split-frame", "Read the two parts on a ten-frame", () => { const a = ri(1, 5), b = ri(1, 5); return num(`${a} red and ${b} yellow. How many counters?`, a + b, { diagram: tenFrame(a, b), why: `${a} and ${b} makes ${a + b}.` }); });

/* =====================================================================================
   MAE-FG-01  recognises, describes and continues repeating patterns
   ===================================================================================== */
const PIECES = [["circle", "red"], ["square", "blue"], ["triangle", "green"], ["star"], ["heart"], ["circle", "yellow"], ["square", "purple"]];
const draw = p => ICON[p[0]](p[1]);
const say = p => (p[1] ? p[1] + " " : "") + p[0];
function pattern() {
  const unit = pick([[0, 1], [0, 1], [0, 0, 1], [0, 1, 1], [0, 1, 2]]), ps = shuffle(PIECES).filter((p, i, a) => a.findIndex(q => q[0] === p[0]) === i).slice(0, 3);
  return { unit, ps, at: i => ps[unit[i % unit.length]], used: [...new Set(unit)].map(k => ps[k]) };
}
const strip = (items, px) => { const c = 46; return D(items.length * c + 6, 52, items.map((it, i) => it === null ? `<rect x="${6 + i * c}" y="6" width="40" height="40" rx="8" fill="#fef9c3" stroke="${INK}" stroke-width="1.6" stroke-dasharray="5 4"/>` + lab(26 + i * c, 35, "?", 24) : at(it, 6 + i * c, 6)).join(""), px || Math.min(440, items.length * 58)); };
T("MAE-FG-01", "patterns", "what-next", "What comes next in the pattern?", () => {
  const P = pattern(), n = P.unit.length * 2 + ri(0, P.unit.length - 1), nxt = P.at(n);
  const opts = (P.used.length > 1 ? P.used : P.ps.slice(0, 2)).map(p => ({ h: one(draw(p)), s: say(p), ok: p === nxt }));
  return mc("What comes next?", opts, { diagram: strip([...range(0, n - 1).map(i => draw(P.at(i))), null]), why: `The pattern repeats: ${P.unit.map(k => say(P.ps[k])).join(", ")}.` });
});
T("MAE-FG-01", "patterns", "what-missing", "What is missing from the pattern?", () => {
  const P = pattern(), n = P.unit.length * 3, hole = ri(P.unit.length, n - 2), miss = P.at(hole);
  return mc("What is missing?", P.used.map(p => ({ h: one(draw(p)), s: say(p), ok: p === miss })), { diagram: strip(range(0, n - 1).map(i => i === hole ? null : draw(P.at(i)))), why: `The pattern repeats: ${P.unit.map(k => say(P.ps[k])).join(", ")}.` });
});
T("MAE-FG-01", "patterns", "which-pattern", "Which row is a repeating pattern?", () => {
  const P = pattern(), good = range(0, 5).map(i => draw(P.at(i)));
  let bad; do { bad = shuffle(range(0, 5).map(i => P.at(i))); } while (bad.every((p, i) => p === P.at(i)) || bad.every((p, i) => i < 2 || p === bad[i - 2]) || bad.every((p, i) => i < 3 || p === bad[i - 3]));
  const ok = ri(0, 1), rowsG = [ok === 0 ? good : bad.map(draw), ok === 1 ? good : bad.map(draw)];
  return mc("Which row is a pattern that repeats?", labChoices(2, ok), { keep: true, diagram: D(320, 112, rowsG.map((r, k) => lab(16, 36 + k * 56, AB[k]) + r.map((it, i) => at(it, 38 + i * 46, 6 + k * 56)).join("")).join(""), 430), why: `Row ${AB[ok]} repeats: ${P.unit.map(k => say(P.ps[k])).join(", ")}.` });
});
T("MAE-FG-01", "patterns", "repeating-part", "Which part repeats?", () => {
  const P = pattern(), L = P.unit.length, unitH = u => optPic(u.map(k => draw(P.ps[k])), 3);
  const wrong = L === 2 ? [[P.unit[0], P.unit[0]], [P.unit[1], P.unit[1]]] : [[P.unit[0], P.unit[1]], [P.unit[2], P.unit[1], P.unit[0]]].filter(u => u.join() !== P.unit.join());
  const opts = [{ u: P.unit, ok: true }, ...wrong.map(u => ({ u }))].map(o => ({ h: unitH(o.u), s: o.u.map(k => say(P.ps[k])).join(", "), ok: o.ok }));
  return mc("Which part repeats?", opts, { diagram: strip(range(0, L * 3 - 1).map(i => draw(P.at(i)))), why: `It repeats: ${P.unit.map(k => say(P.ps[k])).join(", ")}.` });
});

/* =====================================================================================
   MAE-FG-02  forms equal groups by sharing and counting collections of objects
   ===================================================================================== */
function groupsPic(sizes, t) {
  const c = 34, w = 118; let g = "";
  sizes.forEach((n, k) => { g += `<ellipse cx="${k * w + w / 2}" cy="62" rx="${w / 2 - 5}" ry="56" fill="#f8fafc" ${st}/>`; range(0, n - 1).forEach(i => { g += at(ICON[t](), k * w + 22 + (i % 2) * c + (n === 1 ? 17 : 0), 62 - Math.ceil(n / 2) * c / 2 + Math.floor(i / 2) * c, 0.78); }); });
  return D(sizes.length * w, 124, g, Math.min(440, sizes.length * 140));
}
T("MAE-FG-02", "equal-groups-sharing", "equal-or-not", "Are the groups equal?", () => {
  const k = ri(2, 3), n = ri(2, 4), eq = pick([true, false]), sizes = Array(k).fill(n); if (!eq) sizes[ri(0, k - 1)] += pick([-1, 1]);
  return mc("Are the groups equal?", [W("Yes", eq), W("No", !eq)], { keep: true, diagram: groupsPic(sizes, pick(THINGS)), why: eq ? `Each group has ${n}.` : `The groups have ${sizes.join(" and ")}. They are not the same.` });
});
T("MAE-FG-02", "equal-groups-sharing", "share", "Share equally: how many each?", () => {
  const k = ri(2, 3), each = ri(1, k === 2 ? 5 : 3), n = k * each, t = pick(["apple", "fish", "star", "heart"]), r = rows(Array(n).fill(ICON[t]()), 5);
  const plates = range(0, k - 1).map(i => `<ellipse cx="${50 + i * 100}" cy="${r.h + 30}" rx="44" ry="15" fill="#f1f5f9" ${st}/>`).join("");
  return num(`Share ${n} ${nm(t, n)} onto ${k} plates. How many on each plate?`, each, { diagram: D(Math.max(r.w, k * 100), r.h + 52, at(r.g, Math.max(0, (k * 100 - r.w) / 2), 0) + plates, 400), why: `${n} shared between ${k} is ${each} each.` });
});
T("MAE-FG-02", "equal-groups-sharing", "fair-share", "Is it a fair share?", () => {
  const each = ri(2, 4), fair = pick([true, false]), sizes = fair ? [each, each] : [each + 1, each - 1];
  return mc("Two friends share. Is it fair?", [W("Yes", fair), W("No", !fair)], { keep: true, diagram: groupsPic(sizes, pick(["apple", "star"])), why: fair ? `They get ${each} each. That is fair.` : `One gets ${sizes[0]} and one gets ${sizes[1]}. That is not fair.` });
});
T("MAE-FG-02", "record-grouping-sharing", "how-many-groups", "How many groups?", () => { const k = ri(2, 4), n = ri(2, 3); return num("How many groups?", k, { diagram: groupsPic(Array(k).fill(n), pick(THINGS)), why: `There are ${k} groups of ${n}.` }); });
T("MAE-FG-02", "record-grouping-sharing", "in-each-group", "How many in each group?", () => { const k = ri(2, 3), n = ri(2, 4); return num("How many in each group?", n, { diagram: groupsPic(Array(k).fill(n), pick(THINGS)), why: `Each group has ${n}.` }); });
T("MAE-FG-02", "record-grouping-sharing", "groups-altogether", "Equal groups: how many altogether?", () => { const k = ri(2, 4), n = ri(2, k === 4 ? 2 : 3), t = pick(THINGS); return num(`${k} groups of ${n}. How many ${nm(t, 2)} altogether?`, k * n, { diagram: groupsPic(Array(k).fill(n), t), why: `Count them all: ${range(1, k).map(i => i * n).join(", ")}.` }); });

/* =====================================================================================
   MAE-GM-01  describes position and gives and follows simple directions
   ===================================================================================== */
const table = `<rect x="40" y="70" width="120" height="12" rx="3" fill="#b45309" ${st}/><rect x="52" y="82" width="10" height="56" fill="#b45309" ${st}/><rect x="138" y="82" width="10" height="56" fill="#b45309" ${st}/>`;
const POS = { on: [80, 31], under: [80, 98], "next to": [166, 98] };
const scene = (where, t) => svg(210, 146, table + at(ICON[t](), POS[where][0], POS[where][1]) + `<line x1="4" y1="139" x2="206" y2="139" stroke="#94a3b8" stroke-width="2"/>`, 250);
T("MAE-GM-01", "position", "where-is-it", "Where is it? (on, under, next to)", () => {
  const t = pick(["ball", "apple", "star"]), w = pick(Object.keys(POS));
  return mc(`Where is the ${t}?`, Object.keys(POS).map(k => W(`${k[0].toUpperCase() + k.slice(1)} the table`, k === w)), { keep: true, diagram: { html: scene(w, t), wMM: 46 }, why: `The ${t} is ${w} the table.` });
});
T("MAE-GM-01", "position", "which-picture", "Which picture matches the words?", () => {
  const t = pick(["ball", "apple", "star"]), w = pick(Object.keys(POS));
  return mc(`Which picture shows the ${t} ${w} the table?`, Object.keys(POS).map(k => ({ h: scene(k, t).replace('width="250"', 'width="190"'), s: `${k} the table`, ok: k === w })), { why: `That ${t} is ${w} the table.` });
});
const line3 = ts => D(3 * 70, 62, ts.map((t, i) => at(ICON[t](), 15 + i * 70, 10)).join("") + `<line x1="4" y1="56" x2="206" y2="56" stroke="#94a3b8" stroke-width="2"/>`, 330);
T("MAE-GM-01", "position", "between", "What is between?", () => {
  const ts = shuffle(THINGS).slice(0, 3);
  return mc(`What is between the ${ts[0]} and the ${ts[2]}?`, shuffle(ts).map(t => ({ h: one(ICON[t]()), s: t, ok: t === ts[1] })), { keep: true, diagram: line3(ts), why: `The ${ts[1]} is in the middle.` });
});
T("MAE-GM-01", "position", "left-right", "Left and right", () => {
  const ts = shuffle(THINGS).slice(0, 2), left = pick([true, false]);
  return mc(`Which one is on the ${left ? "left" : "right"}?`, ts.map((t, i) => ({ h: one(ICON[t]()), s: t, ok: (i === 0) === left })), { keep: true, diagram: D(200, 60, at(ICON[ts[0]](), 20, 10) + at(ICON[ts[1]](), 140, 10), 300), why: `The ${ts[left ? 0 : 1]} is on the ${left ? "left" : "right"}.` });
});
T("MAE-GM-01", "position", "in-front-behind", "First and last in a line", () => {
  const ts = shuffle(THINGS).slice(0, 3), first = pick([true, false]);
  const arrow = `<path d="M150 74 h44 m-12 -8 l12 8 l-12 8" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  return mc(`They walk this way. Who is ${first ? "at the front" : "at the back"}?`, shuffle(ts).map(t => ({ h: one(ICON[t]()), s: t, ok: t === ts[first ? 2 : 0] })), { keep: true, diagram: D(210, 88, ts.map((t, i) => at(ICON[t](), 15 + i * 70, 6)).join("") + arrow.replace("M150", "M80"), 330), why: `The arrow points to the front. The ${ts[first ? 2 : 0]} is ${first ? "at the front" : "at the back"}.` });
});
T("MAE-GM-01", "position", "follow-steps", "Follow the steps along a path", () => {
  const ts = shuffle(THINGS).slice(0, 4), k = ri(1, 4), c = 62;
  const g = range(0, 4).map(i => `<rect x="${4 + i * c}" y="4" width="${c - 6}" height="56" rx="9" fill="${i ? "#fff" : "#dcfce7"}" ${st}/>` + (i ? at(ICON[ts[i - 1]](), 4 + i * c + 8, 12) : lab(4 + (c - 6) / 2, 40, "Go", 20))).join("");
  return mc(`Start at Go. Move ${k} ${k === 1 ? "step" : "steps"}. Where do you land?`, ts.map((t, i) => ({ h: one(ICON[t](), 64), s: t, ok: i === k - 1 })), { keep: true, diagram: D(5 * c + 2, 66, g, 420), why: `Count ${k} ${k === 1 ? "step" : "steps"} from Go. You land on the ${ts[k - 1]}.` });
});

/* =====================================================================================
   MAE-GM-02  describes and compares lengths
   ===================================================================================== */
const pencil = (x, y, len, col) => `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="${len - 16}" height="14" fill="${col}" ${st}/><polygon points="${len - 16},0 ${len},7 ${len - 16},14" fill="#fde68a" ${st}/><polygon points="${len - 6},4.6 ${len},7 ${len - 6},9.4" fill="${INK}"/></g>`;
const LC = [COL.red, COL.blue, COL.green];
const lens = n => { let v; do { v = Array.from({ length: n }, () => ri(3, 12) * 20); } while (new Set(v).size < n || Math.min(...v.map((a, i) => Math.min(...v.map((b, j) => i === j ? 99 : Math.abs(a - b))))) < 40); return v; };
const pencils = v => D(290, v.length * 36 + 4, v.map((L, i) => lab(14, 22 + i * 36, AB[i]) + pencil(34, 8 + i * 36, L, LC[i])).join(""), 400);
T("MAE-GM-02", "length-compare", "longer", "Which is longer or shorter?", () => { const v = lens(2), long = pick([true, false]), ok = long ? (v[0] > v[1] ? 0 : 1) : (v[0] < v[1] ? 0 : 1); return mc(`Which pencil is ${long ? "longer" : "shorter"}?`, labChoices(2, ok), { keep: true, diagram: pencils(v), why: `They start at the same place. Pencil ${AB[ok]} ${long ? "goes further" : "stops first"}.` }); });
T("MAE-GM-02", "length-compare", "longest", "Longest or shortest of three", () => { const v = lens(3), long = pick([true, false]), ok = v.indexOf(Math[long ? "max" : "min"](...v)); return mc(`Which pencil is the ${long ? "longest" : "shortest"}?`, labChoices(3, ok), { keep: true, diagram: pencils(v), why: `Pencil ${AB[ok]} is the ${long ? "longest" : "shortest"}.` }); });
const tower = (x, n, col) => range(0, n - 1).map(i => `<rect x="${x}" y="${150 - (i + 1) * 22}" width="34" height="22" fill="${col}" ${st}/>`).join("");
T("MAE-GM-02", "length-compare", "taller", "Which is taller?", () => {
  const [a, b] = diff(2, 6, 2), tall = pick([true, false]), ok = tall ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
  return mc(`Which tower is ${tall ? "taller" : "shorter"}?`, labChoices(2, ok), { keep: true, diagram: D(200, 182, tower(34, a, COL.blue) + tower(132, b, COL.orange) + `<line x1="4" y1="151" x2="196" y2="151" stroke="${INK}" stroke-width="2"/>` + lab(51, 176, "A") + lab(149, 176, "B"), 270), why: `Tower A has ${a} blocks. Tower B has ${b} blocks.` });
});
T("MAE-GM-02", "length-compare", "same-length", "Are they the same length?", () => {
  const L = ri(5, 10) * 20, same = pick([true, false]), v = [L, same ? L : L + pick([-60, 60])];
  return mc("Are the pencils the same length?", [W("Yes", same), W("No", !same)], { keep: true, diagram: pencils(v), why: same ? "They start and stop at the same places." : "One pencil goes further than the other." });
});
T("MAE-GM-02", "length-compare", "string-compare", "Compare with a string", () => {
  const L = ri(5, 9) * 20, d = pick([-50, 50]), obj = L + d;
  const g = lab(40, 22, "String", 15) + `<path d="M84 16 h${L}" stroke="${COL.purple}" stroke-width="5" stroke-linecap="round"/>` + lab(40, 58, "Book", 15) + `<rect x="84" y="42" width="${obj}" height="24" fill="${COL.green}" ${st}/>`;
  return mc("Is the book longer or shorter than the string?", [W("Longer", d > 0), W("Shorter", d < 0)], { keep: true, diagram: D(330, 74, g, 420), why: `The book ${d > 0 ? "goes past the end of" : "stops before the end of"} the string.` });
});

/* =====================================================================================
   MAE-GM-03  identifies half the length and the halfway point
   ===================================================================================== */
const ribbon = (x, y, L, cut, px) => `<rect x="${x}" y="${y}" width="${L}" height="22" rx="3" fill="${COL.pink}" ${st}/><line x1="${x + cut}" y1="${y - 6}" x2="${x + cut}" y2="${y + 28}" stroke="${INK}" stroke-width="3" stroke-dasharray="6 4"/>`;
T("MAE-GM-03", "half-a-length", "cut-in-half", "Which ribbon is cut in half?", () => {
  const L = 200, cuts = shuffle([L / 2, pick([L * 0.25, L * 0.3]), pick([L * 0.7, L * 0.8])]), ok = cuts.indexOf(L / 2);
  return mc("Which ribbon is cut in half?", labChoices(3, ok), { keep: true, diagram: D(250, 150, cuts.map((c, i) => lab(14, 34 + i * 48, AB[i]) + ribbon(36, 16 + i * 48, L, c)).join(""), 380), why: `Ribbon ${AB[ok]} has two parts the same length.` });
});
T("MAE-GM-03", "half-a-length", "is-it-half", "Is it cut in half?", () => {
  const L = 220, half = pick([true, false]), c = half ? L / 2 : pick([L * 0.3, L * 0.68]);
  return mc("Is the ribbon cut in half?", [W("Yes", half), W("No", !half)], { keep: true, diagram: D(240, 46, ribbon(10, 12, L, c), 380), why: half ? "The two parts are the same length." : "One part is longer than the other." });
});
T("MAE-GM-03", "half-a-length", "halfway", "Which mark is halfway?", () => {
  const xs = shuffle([150, pick([70, 90]), pick([210, 235])]).sort((a, b) => a - b), ok = xs.indexOf(150);
  const g = `<line x1="20" y1="40" x2="280" y2="40" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` + at(ICON.star(), 0, 20, 0.9) + at(ICON.heart(), 264, 20, 0.9) + xs.map((x, i) => `<line x1="${x}" y1="28" x2="${x}" y2="52" stroke="${COL.red}" stroke-width="4"/>` + lab(x, 78, AB[i])).join("");
  return mc("Which mark is halfway along the path?", labChoices(3, ok), { keep: true, diagram: D(304, 86, g, 420), why: `Mark ${AB[ok]} is the same distance from each end.` });
});
T("MAE-GM-03", "half-a-length", "half-tower", "Half of a tower", () => { const n = pick([2, 4, 6, 8, 10]); return num(`The tower is ${n} blocks tall. How many blocks is half?`, n / 2, { diagram: D(120, 20 + n * 22, range(0, n - 1).map(i => `<rect x="43" y="${10 + i * 22}" width="34" height="22" fill="${i < n / 2 ? COL.blue : COL.yellow}" ${st}/>`).join(""), 150), why: `${n / 2} and ${n / 2} makes ${n}. Half of ${n} is ${n / 2}.` }); });

/* =====================================================================================
   MAE-2DS-01  sorts, describes, names and makes two-dimensional shapes
   ===================================================================================== */
const SH = ["circle", "square", "triangle", "rectangle"], SHC = () => pick(Object.keys(COL));
const shapeBig = (s, c, rot = 0) => svg(44, 44, `<g transform="rotate(${rot} 22 22)">` + at(ICON[s](c), 2, 2) + "</g>", 120);
T("MAE-2DS-01", "sort-describe-name", "name-shape", "Name the shape", () => { const s = pick(SH); return mc("What shape is this?", SH.map(x => W(x[0].toUpperCase() + x.slice(1), x === s)), { keep: true, diagram: { html: shapeBig(s, SHC(), s === "triangle" ? pick([0, 0, 180]) : 0), wMM: 26 }, why: `It is a ${s}.` }); });
T("MAE-2DS-01", "sort-describe-name", "find-shape", "Find the shape", () => { const s = pick(SH), others = shuffle(SH.filter(x => x !== s)).slice(0, 2); return mc(`Which one is a ${s}?`, [s, ...others].map((x, i) => ({ h: shapeBig(x, SHC(), x === "triangle" ? pick([0, 180, 90]) : x === "square" ? 0 : 0).replace('width="120"', 'width="84"'), s: x, ok: i === 0 }))); });
const SIDES = { square: 4, triangle: 3, rectangle: 4 };
T("MAE-2DS-01", "sort-describe-name", "sides", "Count the sides or corners", () => { const s = pick(Object.keys(SIDES)), side = pick([true, false]); return num(`How many ${side ? "sides" : "corners"} does it have?`, SIDES[s], { diagram: { html: shapeBig(s, SHC()), wMM: 26 }, why: `A ${s} has ${SIDES[s]} sides and ${SIDES[s]} corners.` }); });
T("MAE-2DS-01", "sort-describe-name", "odd-one-out", "Sort: which one does not belong?", () => {
  const [s, o] = shuffle(SH), k = ri(0, 3), items = range(0, 3).map(i => (i === k ? o : s)), cols = shuffle(Object.keys(COL));
  return mc("Which shape does not belong?", labChoices(4, k), { keep: true, diagram: D(4 * 64, 78, items.map((x, i) => at(ICON[x](cols[i]), 12 + i * 64, 4) + lab(32 + i * 64, 70, AB[i], 20)).join(""), 400), why: `Three are ${s}s. ${AB[k]} is a ${o}.` });
});
T("MAE-2DS-01", "sort-describe-name", "curved-straight", "Curved or straight sides", () => { const s = pick(SH); return mc("Are its sides straight or curved?", [W("Straight", s !== "circle"), W("Curved", s === "circle")], { keep: true, diagram: { html: shapeBig(s, SHC()), wMM: 26 }, why: s === "circle" ? "A circle is one curved line." : `A ${s} has straight sides.` }); });
const THING_SHAPE = [
  ["clock", "circle", `<circle cx="20" cy="20" r="17" fill="#fff" ${st}/><path d="M20 20 V9 M20 20 H28" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`],
  ["door", "rectangle", `<rect x="9" y="2" width="22" height="36" fill="#b45309" ${st}/><circle cx="26" cy="21" r="1.8" fill="${COL.yellow}"/>`],
  ["window", "square", `<rect x="5" y="5" width="30" height="30" fill="#bfdbfe" ${st}/><path d="M20 5 V35 M5 20 H35" stroke="${INK}" stroke-width="1.6"/>`],
  ["sign", "triangle", `<polygon points="20,3 37,33 3,33" fill="${COL.yellow}" ${st}/><rect x="18.4" y="33" width="3.2" height="6" fill="${INK}"/>`],
  ["wheel", "circle", `<circle cx="20" cy="20" r="17" fill="#475569" ${st}/><circle cx="20" cy="20" r="6" fill="#e2e8f0" ${st}/>`],
  ["book", "rectangle", `<rect x="3" y="9" width="34" height="22" fill="${COL.green}" ${st}/><line x1="8" y1="9" x2="8" y2="31" stroke="${INK}" stroke-width="1.6"/>`]
];
T("MAE-2DS-01", "represent-shapes", "everyday-shape", "Shapes in everyday things", () => { const [name, s, pic] = pick(THING_SHAPE); return mc(`What shape is the ${name}?`, SH.map(x => W(x[0].toUpperCase() + x.slice(1), x === s)), { keep: true, diagram: { html: svg(44, 44, at(pic, 2, 2), 130), wMM: 28 }, why: `The ${name} is a ${s}.` }); });
T("MAE-2DS-01", "represent-shapes", "shapes-in-picture", "Count the shapes in a picture", () => {
  const nT = ri(1, 3), nC = ri(1, 3), ask = pick(["triangle", "circle", "square"]);
  const house = `<rect x="25" y="70" width="70" height="70" fill="${COL.yellow}" ${st}/><polygon points="14,70 60,22 106,70" fill="${COL.red}" ${st}/>`;
  const trees = range(1, nT - 1).map(i => `<polygon points="${120 + i * 42},140 ${140 + i * 42},86 ${160 + i * 42},140" fill="${COL.green}" ${st}/>`).join("");
  const suns = range(0, nC - 1).map(i => `<circle cx="${150 + i * 44}" cy="34" r="17" fill="${COL.orange}" ${st}/>`).join("");
  const n = { triangle: nT, circle: nC, square: 1 }[ask];
  return num(`How many ${ask}s are in the picture?`, n, { diagram: D(290, 146, house + trees + suns, 400), why: `There ${n === 1 ? "is" : "are"} ${n} ${ask}${n === 1 ? "" : "s"}.` });
});

/* =====================================================================================
   MAE-2DS-02  describes and compares areas of similar shapes
   ===================================================================================== */
T("MAE-2DS-02", "area", "bigger-area", "Which shape is bigger?", () => {
  const s = pick(["square", "circle", "triangle", "rectangle"]), [a, b] = shuffle([pick([0.9, 1.1]), pick([1.9, 2.2])]), big = pick([true, false]), ok = big ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
  return mc(`Which ${s} is ${big ? "bigger" : "smaller"}?`, labChoices(2, ok), { keep: true, diagram: D(240, 118, at(ICON[s]("blue"), 50 - 20 * a, 48 - 20 * a, a) + at(ICON[s]("orange"), 170 - 20 * b, 48 - 20 * b, b) + lab(50, 114, "A") + lab(170, 114, "B"), 340), why: `${AB[ok]} covers ${big ? "more" : "less"} space.` });
});
T("MAE-2DS-02", "area", "biggest-mat", "Biggest or smallest of three", () => {
  const sc = shuffle([0.8, 1.4, 2.1]), big = pick([true, false]), ok = sc.indexOf(big ? 2.1 : 0.8), s = pick(["square", "circle", "rectangle"]);
  return mc(`Which mat is the ${big ? "biggest" : "smallest"}?`, labChoices(3, ok), { keep: true, diagram: D(330, 118, sc.map((k, i) => at(ICON[s](["green", "purple", "yellow"][i]), 55 + i * 110 - 20 * k, 48 - 20 * k, k) + lab(55 + i * 110, 114, AB[i])).join(""), 420), why: `Mat ${AB[ok]} covers the ${big ? "most" : "least"} space.` });
});
T("MAE-2DS-02", "area", "on-top", "Put one on top of the other", () => {
  const [c1, c2] = shuffle(["red", "blue", "green", "purple"]), big = pick([true, false]), s2 = pick(["square", "circle"]);
  return mc(`The ${c2} ${s2} is put on top of the ${c1} ${s2}. Which one is ${big ? "bigger" : "smaller"}?`, [W(`The ${c1} one`, big), W(`The ${c2} one`, !big)], { keep: true, diagram: D(140, 140, at(ICON[s2](c1), 2, 2, 3.4) + at(ICON[s2](c2), pick([30, 44]), pick([30, 44]), 1.5), 210), why: `You can still see the ${c1} ${s2} all around the ${c2} one, so the ${c1} one is bigger.` });
});
T("MAE-2DS-02", "area", "same-area", "Are they the same size?", () => {
  const same = pick([true, false]), a = 1.6, b = same ? 1.6 : pick([1.0, 2.2]);
  return mc("Do the two squares cover the same space?", [W("Yes", same), W("No", !same)], { keep: true, diagram: D(240, 100, at(ICON.square("green"), 60 - 20 * a, 50 - 20 * a, a) + at(ICON.square("purple"), 176 - 20 * b, 50 - 20 * b, b), 330), why: same ? "They are the same size." : "One square is bigger than the other." });
});

/* =====================================================================================
   MAE-3DS-01  manipulates, describes and sorts three-dimensional objects
   ===================================================================================== */
const OBJ = {
  ball: { say: "ball", roll: true, stack: false, pic: `<circle cx="20" cy="20" r="16" fill="${COL.orange}" ${st}/><path d="M9 12 q5 -5 10 -5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>` },
  box: { say: "box", roll: false, stack: true, pic: `<polygon points="4,14 26,14 26,36 4,36" fill="${COL.blue}" ${st}/><polygon points="4,14 14,5 36,5 26,14" fill="#93c5fd" ${st}/><polygon points="26,14 36,5 36,27 26,36" fill="#1d4ed8" ${st}/>` },
  can: { say: "can", roll: true, stack: true, pic: `<path d="M8 9 V31 A12 5 0 0 0 32 31 V9" fill="${COL.green}" ${st}/><ellipse cx="20" cy="9" rx="12" ry="5" fill="#86efac" ${st}/>` },
  cone: { say: "party hat", roll: true, stack: false, pic: `<path d="M20 3 L34 32 A14 5 0 0 1 6 32 Z" fill="${COL.purple}" ${st}/>` }
};
const objPic = (k, px = 84) => one(OBJ[k].pic, px);
T("MAE-3DS-01", "explore-3d", "can-roll", "Which objects roll?", () => { const ok = pick(["ball", "can"]); return mc("Which one can roll?", [ok, "box"].map(k => ({ h: objPic(k), s: OBJ[k].say, ok: k === ok })), { why: `A ${OBJ[ok].say} has a curved side, so it can roll. A box has only flat sides.` }); });
T("MAE-3DS-01", "explore-3d", "can-stack", "Which objects stack?", () => { const ok = pick(["box", "can"]); return mc("Which one is good for stacking?", [ok, "ball", "cone"].map(k => ({ h: objPic(k), s: OBJ[k].say, ok: k === ok })), { why: `A ${OBJ[ok].say} has flat sides on the top and bottom.` }); });
T("MAE-3DS-01", "explore-3d", "same-shape", "Find the object with the same shape", () => {
  const LIKE = { ball: ["orange", `<circle cx="20" cy="21" r="15" fill="#fb923c" ${st}/><ellipse cx="22" cy="6" rx="4" ry="2" fill="${COL.green}"/>`], box: ["dice", `<rect x="5" y="5" width="30" height="30" rx="5" fill="#fff" ${st}/><circle cx="13" cy="13" r="2.6" fill="${INK}"/><circle cx="27" cy="27" r="2.6" fill="${INK}"/><circle cx="20" cy="20" r="2.6" fill="${INK}"/>`], can: ["drum", `<path d="M5 12 V28 A15 6 0 0 0 35 28 V12" fill="${COL.red}" ${st}/><ellipse cx="20" cy="12" rx="15" ry="6" fill="#fde68a" ${st}/>`] };
  const k = pick(Object.keys(LIKE));
  return mc(`Which one is the same shape as the ${LIKE[k][0]}?`, ["ball", "box", "can"].map(x => ({ h: objPic(x), s: OBJ[x].say, ok: x === k })), { keep: true, diagram: { html: svg(44, 44, at(LIKE[k][1], 2, 2), 120), wMM: 26 }, why: `The ${LIKE[k][0]} is shaped like a ${OBJ[k].say}.` });
});
T("MAE-3DS-01", "explore-3d", "flat-or-curved", "Flat or curved?", () => { const k = pick(["ball", "box"]); return mc(`Is the ${OBJ[k].say} flat all over, or curved?`, [W("Flat sides", k === "box"), W("Curved", k === "ball")], { keep: true, diagram: { html: objPic(k, 120), wMM: 26 }, why: k === "box" ? "A box has flat sides." : "A ball is curved all over." }); });
T("MAE-3DS-01", "explore-3d", "sort-objects", "Sort: which one does not belong?", () => {
  const [s, o] = shuffle(["ball", "box", "can"]), k = ri(0, 2), items = range(0, 2).map(i => (i === k ? o : s));
  return mc("Which one does not belong?", labChoices(3, k), { keep: true, diagram: D(3 * 70, 78, items.map((x, i) => at(OBJ[x].pic, 15 + i * 70, 4) + lab(35 + i * 70, 72, AB[i], 20)).join(""), 340), why: `Two are ${OBJ[s].say === "box" ? "boxes" : OBJ[s].say + "s"}. ${AB[k]} is a ${OBJ[o].say}.` });
});

/* =====================================================================================
   MAE-3DS-02  describes and compares volumes
   ===================================================================================== */
const glass = (x, y, w, h, fill) => `<g transform="translate(${x} ${y})">${fill > 0 ? `<path d="M${2 + (1 - fill) * 4} ${h * (1 - fill)} L${w - 2 - (1 - fill) * 4} ${h * (1 - fill)} L${w - 6} ${h} L6 ${h} Z" fill="#7dd3fc"/>` : ""}<path d="M0 0 L6 ${h} L${w - 6} ${h} L${w} 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/></g>`;
T("MAE-3DS-02", "filling-packing", "holds-more", "Which holds more?", () => {
  const more = pick([true, false]), bigFirst = pick([true, false]), ok = (more === bigFirst) ? 0 : 1;
  const big = `<path d="M0 0 h70 l-8 84 h-54z" fill="#e0f2fe" ${st}/><path d="M70 14 q22 4 4 40" fill="none" stroke="${INK}" stroke-width="3"/>`, small = `<path d="M0 0 h34 l-4 36 h-26z" fill="#e0f2fe" ${st}/>`;
  return mc(`Which one holds ${more ? "more" : "less"} water?`, labChoices(2, ok), { keep: true, diagram: D(250, 126, at(bigFirst ? big : small, bigFirst ? 20 : 38, bigFirst ? 8 : 56) + at(bigFirst ? small : big, bigFirst ? 168 : 140, bigFirst ? 56 : 8) + lab(bigFirst ? 55 : 55, 120, "A") + lab(bigFirst ? 185 : 175, 120, "B"), 340), why: `The ${more ? "big jug" : "small cup"} holds ${more ? "more" : "less"}.` });
});
T("MAE-3DS-02", "filling-packing", "full-empty", "Full, half full or empty", () => {
  const f = shuffle([1, 0.5, 0]), ask = pick([[1, "full"], [0, "empty"], [0.5, "half full"]]), ok = f.indexOf(ask[0]);
  return mc(`Which glass is ${ask[1]}?`, labChoices(3, ok), { keep: true, diagram: D(300, 122, f.map((v, i) => glass(30 + i * 100, 8, 54, 84, v) + lab(57 + i * 100, 118, AB[i])).join(""), 390), why: `Glass ${AB[ok]} is ${ask[1]}.` });
});
T("MAE-3DS-02", "filling-packing", "more-water", "Which has more water?", () => {
  const [a, b] = shuffle([pick([0.25, 0.35]), pick([0.7, 0.85])]), more = pick([true, false]), ok = more ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
  return mc(`The glasses are the same. Which has ${more ? "more" : "less"} water?`, labChoices(2, ok), { keep: true, diagram: D(220, 122, glass(30, 8, 54, 84, a) + glass(136, 8, 54, 84, b) + lab(57, 118, "A") + lab(163, 118, "B"), 300), why: `The water in glass ${AB[ok]} is ${more ? "higher" : "lower"}.` });
});
T("MAE-3DS-02", "filling-packing", "pack-box", "How many blocks pack the box?", () => {
  const r = ri(1, 2), c = ri(2, 4), s = 40;
  return num("How many blocks fill the box?", r * c, { diagram: D(c * s + 24, r * s + 24, `<rect x="4" y="4" width="${c * s + 16}" height="${r * s + 16}" rx="6" fill="#fef3c7" ${st}/>` + range(0, r * c - 1).map(i => `<rect x="${12 + (i % c) * s}" y="${12 + Math.floor(i / c) * s}" width="${s}" height="${s}" fill="${COL.green}" ${st}/>`).join(""), Math.min(360, c * 80)), why: `Count the blocks: ${r * c}.` });
});
T("MAE-3DS-02", "volume-building", "count-blocks", "How many blocks in the tower?", () => { const n = ri(2, 8); return num("How many blocks were used?", n, { diagram: D(120, 172, tower(43, n, COL.blue).replace(/y="(\d+)"/g, (m, y) => `y="${Number(y) + 16}"`) + `<line x1="10" y1="167" x2="110" y2="167" stroke="${INK}" stroke-width="2"/>`, 150), why: `Count the blocks: ${n}.` }); });
T("MAE-3DS-02", "volume-building", "more-blocks", "Which building uses more blocks?", () => {
  const [a, b] = diff(2, 6, 2), more = pick([true, false]), ok = more ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
  const build = (x, n, col) => range(0, n - 1).map(i => `<rect x="${x + (i % 2) * 34}" y="${128 - (Math.floor(i / 2) + 1) * 26}" width="34" height="26" fill="${col}" ${st}/>`).join("");
  return mc(`Which building uses ${more ? "more" : "fewer"} blocks?`, labChoices(2, ok), { keep: true, diagram: D(240, 160, build(26, a, COL.red) + build(146, b, COL.purple) + `<line x1="4" y1="129" x2="236" y2="129" stroke="${INK}" stroke-width="2"/>` + lab(60, 154, "A") + lab(180, 154, "B"), 320), why: `A uses ${a} blocks. B uses ${b} blocks.` });
});

/* =====================================================================================
   MAE-NSM-01  describes and compares the masses of objects
   ===================================================================================== */
function balance(tilt, L, R) {   // tilt: -1 left pan down, 0 level, 1 right pan down
  const lx = 50, rx = 190, yL = 62 + (tilt < 0 ? 16 : tilt > 0 ? -16 : 0), yR = 62 + (tilt > 0 ? 16 : tilt < 0 ? -16 : 0);
  const pan = (x, y, inner, L2) => `<path d="M${x - 34} ${y} q34 26 68 0z" fill="#e2e8f0" ${st}/>` + at(inner, x - 18, y - 37, 0.9) + lab(x, y + 46, L2);
  return D(240, 150, `<line x1="${lx}" y1="${yL}" x2="${rx}" y2="${yR}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><polygon points="120,62 104,132 136,132" fill="#94a3b8" ${st}/><rect x="84" y="130" width="72" height="9" rx="3" fill="#64748b" ${st}/>` + pan(lx, yL, L, "A") + pan(rx, yR, R, "B"), 340);
}
T("MAE-NSM-01", "mass", "heavier", "Which is heavier? (balance)", () => { const [a, b] = shuffle(THINGS), tilt = pick([-1, 1]), heavy = pick([true, false]), ok = (tilt < 0) === heavy ? 0 : 1; return mc(`Which side is ${heavy ? "heavier" : "lighter"}?`, labChoices(2, ok), { keep: true, diagram: balance(tilt, ICON[a](), ICON[b]()), why: `The ${heavy ? "heavier side goes down" : "lighter side goes up"}. That is side ${AB[ok]}.` }); });
T("MAE-NSM-01", "mass", "same-mass", "Are they the same mass?", () => { const [a, b] = shuffle(THINGS), tilt = pick([0, 0, -1, 1]); return mc("Are the two sides the same mass?", [W("Yes", tilt === 0), W("No", tilt !== 0)], { keep: true, diagram: balance(tilt, ICON[a](), ICON[b]()), why: tilt === 0 ? "The balance is level, so they are the same." : "One side is lower, so it is heavier." }); });
const REAL = [["feather", "brick"], ["leaf", "rock"], ["balloon", "bucket of sand"], ["pencil", "chair"], ["sock", "school bag full of books"]];
T("MAE-NSM-01", "mass", "everyday-heavy", "Heavy and light everyday things", () => { const [l, h] = pick(REAL), heavy = pick([true, false]); return mc(`Which is ${heavy ? "heavier" : "lighter"}?`, shuffle([W("A " + l, !heavy), W("A " + h, heavy)]), { keep: true, why: `A ${h} is heavy. A ${l} is light.` }); });
T("MAE-NSM-01", "mass", "more-blocks-heavier", "More blocks are heavier", () => {
  const n = ri(2, 4), m = n + ri(1, 2), leftBig = pick([true, false]), pile = k => range(0, k - 1).map(i => at(ICON.block("green"), (i % 3) * 13 - 4, 18 - Math.floor(i / 3) * 13, 0.36)).join("");
  return mc("The blocks are all the same. Which side is heavier?", labChoices(2, leftBig ? 0 : 1), { keep: true, diagram: balance(leftBig ? -1 : 1, pile(leftBig ? m : n), pile(leftBig ? n : m)), why: `Side ${leftBig ? "A" : "B"} has more blocks, so it is heavier.` });
});

/* =====================================================================================
   MAE-NSM-02  sequences events and reads hour time on clocks
   ===================================================================================== */
const LONG = [["Blink your eyes", "Eat your lunch"], ["Clap your hands", "Sleep at night"], ["Put on a hat", "Watch a movie"], ["Jump once", "Walk to school"], ["Sneeze", "Read a book"]];
T("MAE-NSM-02", "duration", "takes-longer", "Which takes longer?", () => { const [s, l] = pick(LONG), long = pick([true, false]); return mc(`Which takes ${long ? "longer" : "less time"}?`, shuffle([W(s, !long), W(l, long)]), { keep: true, why: `"${l}" takes a long time. "${s}" is quick.` }); });
const DAY = [["Wake up", "Go to school", "Go to bed"], ["Eat breakfast", "Eat lunch", "Eat dinner"], ["Get dressed", "Play at lunch time", "Have a bath at night"]];
T("MAE-NSM-02", "duration", "order-day", "Order the events of a day", () => { const d = pick(DAY), k = pick([0, 2]); return mc(`Which comes ${k ? "last" : "first"} in the day?`, shuffle(d.map((x, i) => W(x, i === k))), { keep: true, why: `In order: ${d.join(", then ").toLowerCase()}.` }); });
T("MAE-NSM-02", "duration", "time-of-day", "Morning, afternoon or night", () => { const [e, t] = pick([["eat breakfast", "Morning"], ["wake up", "Morning"], ["go to sleep", "Night"], ["see the stars", "Night"], ["go home from school", "Afternoon"]]); return mc(`When do you ${e}?`, ["Morning", "Afternoon", "Night"].map(x => W(x, x === t)), { keep: true, why: `You ${e} in the ${t.toLowerCase()}.` }); });
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
T("MAE-NSM-02", "days-of-week", "day-after", "The day after, the day before", () => { const i = ri(0, 6), after = pick([true, false]), ans = DAYS[(i + (after ? 1 : 6)) % 7]; return mc(`What day comes ${after ? "after" : "before"} ${DAYS[i]}?`, shuffle([ans, ...shuffle(DAYS.filter(d => d !== ans && d !== DAYS[i])).slice(0, 2)]).map(d => W(d, d === ans)), { keep: true, why: `The days go: ${DAYS.join(", ")}.` }); });
T("MAE-NSM-02", "days-of-week", "school-days", "School days and the weekend", () => { const wk = pick([true, false]), ans = wk ? pick(["Saturday", "Sunday"]) : pick(DAYS.slice(0, 5)), others = shuffle(wk ? DAYS.slice(0, 5) : ["Saturday", "Sunday"]).slice(0, 2); return mc(wk ? "Which day is on the weekend?" : "Which day is a school day?", shuffle([ans, ...others]).map(d => W(d, d === ans)), { keep: true, why: "Monday to Friday are school days. Saturday and Sunday are the weekend." }); });
T("MAE-NSM-02", "days-of-week", "days-in-week", "How many days in a week?", () => num("How many days are in a week?", 7, { why: `Seven: ${DAYS.join(", ")}.` }));
const hourChoices = h => { const s = new Set([h]); while (s.size < 3) s.add(ri(1, 12)); return [...s].sort((a, b) => a - b); };
T("MAE-NSM-02", "hour-time", "read-clock", "Read o'clock on a clock face", () => { const h = ri(1, 12); return mc("What time is it?", hourChoices(h).map(x => W(`${x} o'clock`, x === h)), { keep: true, diagram: clock(h), why: `The long hand points to 12. The short hand points to ${h}. It is ${h} o'clock.` }); });
T("MAE-NSM-02", "hour-time", "read-digital", "Read o'clock on a digital clock", () => { const h = ri(1, 12); return mc("What time is it?", hourChoices(h).map(x => W(`${x} o'clock`, x === h)), { keep: true, diagram: digital(h), why: `${h}:00 is ${h} o'clock.` }); });
T("MAE-NSM-02", "hour-time", "hour-hand", "Where does the short hand point?", () => { const h = ri(1, 12); return num(`It is ${h} o'clock. What number does the short hand point to?`, h, { diagram: clock(h), why: `At ${h} o'clock the short hand points to ${h}.` }); });
T("MAE-NSM-02", "hour-time", "match-digital", "Match the clock face to a digital time", () => { const h = ri(1, 12); return mc("Which shows the same time?", hourChoices(h).map(x => ({ h: `${x}:00`, s: `${x} o'clock`, ok: x === h })), { keep: true, diagram: clock(h), why: `The clock shows ${h} o'clock. That is ${h}:00.` }); });

/* =====================================================================================
   MAE-DATA-01  contributes to collecting data and interprets data displays made from objects
   ===================================================================================== */
function display() {
  const ts = shuffle(THINGS).slice(0, 3); let v; do { v = [ri(1, 6), ri(1, 6), ri(1, 6)]; } while (new Set(v).size < 3);
  const g = ts.map((t, r) => at(ICON[t](), 4, 6 + r * 46) + `<line x1="50" y1="${4 + r * 46}" x2="50" y2="${48 + r * 46}" stroke="${INK}" stroke-width="2"/>` + range(0, v[r] - 1).map(i => at(ICON[t](), 58 + i * 44, 8 + r * 46, 0.9)).join("")).join("");
  return { ts, v, d: D(58 + 6 * 44, 3 * 46 + 6, g, 400) };
}
T("MAE-DATA-01", "organise-displays", "most", "Which has the most or the fewest?", () => { const X = display(), most = pick([true, false]), k = X.v.indexOf(Math[most ? "max" : "min"](...X.v)); return mc(`Which has the ${most ? "most" : "fewest"}?`, X.ts.map((t, i) => ({ h: one(ICON[t](), 64), s: nm(t, 2), ok: i === k })), { keep: true, diagram: X.d, why: `There are ${X.v.map((n, i) => `${n} ${nm(X.ts[i], n)}`).join(", ")}.` }); });
T("MAE-DATA-01", "organise-displays", "how-many-row", "How many in a row of the display?", () => { const X = display(), k = ri(0, 2); return num(`How many ${nm(X.ts[k], 2)}?`, X.v[k], { diagram: X.d, why: `Count along the row: ${X.v[k]}.` }); });
T("MAE-DATA-01", "organise-displays", "how-many-all", "How many altogether in the display?", () => { const ts = shuffle(THINGS).slice(0, 2), v = [ri(1, 5), ri(1, 5)]; const g = ts.map((t, r) => range(0, v[r] - 1).map(i => at(ICON[t](), 6 + i * 44, 6 + r * 46)).join("")).join(""); return num("How many things were sorted altogether?", v[0] + v[1], { diagram: D(5 * 44 + 8, 98, g, 340), why: `${v[0]} and ${v[1]} makes ${v[0] + v[1]}.` }); });
T("MAE-DATA-01", "organise-displays", "sorted", "How was it sorted?", () => {
  const byShape = pick([true, false]), a = ["circle", "red"], b = byShape ? ["square", "red"] : ["circle", "blue"];
  const g = `<rect x="2" y="2" width="150" height="96" rx="12" fill="#f8fafc" ${st}/><rect x="168" y="2" width="150" height="96" rx="12" fill="#f8fafc" ${st}/>` + range(0, 3).map(i => at(draw(a), 12 + (i % 2) * 66, 8 + Math.floor(i / 2) * 44, 0.95) + at(draw(b), 178 + (i % 2) * 66, 8 + Math.floor(i / 2) * 44, 0.95)).join("");
  return mc("How were they sorted?", [W("By colour", !byShape), W("By shape", byShape)], { keep: true, diagram: D(320, 100, g, 410), why: byShape ? "One box has circles. One box has squares." : "One box has red. One box has blue." });
});
T("MAE-DATA-01", "respond-collect", "yes-no", "Read a yes or no display", () => {
  let y, n; do { y = ri(1, 6); n = ri(1, 6); } while (y === n); const ask = pick(["yes", "no", "more"]);
  const g = lab(30, 34, "Yes", 18) + range(0, y - 1).map(i => at(ICON.counter("green"), 62 + i * 42, 8, 0.9)).join("") + lab(30, 82, "No", 18) + range(0, n - 1).map(i => at(ICON.counter("red"), 62 + i * 42, 56, 0.9)).join("");
  const d = D(62 + 6 * 42, 100, g, 400), intro = "The class was asked: Do you like apples?";
  return ask === "more" ? mc(`${intro} Did more children say yes or no?`, [W("Yes", y > n), W("No", n > y)], { keep: true, diagram: d, why: `${y} said yes and ${n} said no.` }) : num(`${intro} How many said ${ask}?`, ask === "yes" ? y : n, { diagram: d, why: `Count the ${ask === "yes" ? "green" : "red"} counters.` });
});
T("MAE-DATA-01", "respond-collect", "could-happen", "What could happen? (a bag of blocks)", () => {
  const [c1, c2] = shuffle(["red", "blue", "yellow", "green"]), n = ri(3, 5), askIn = pick([true, false]), c = askIn ? c1 : c2;
  const bag = `<path d="M20 30 q-18 60 10 92 h100 q28 -32 10 -92z" fill="#fef3c7" ${st}/><path d="M22 30 h116" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` + range(0, n - 1).map(i => at(ICON.block(c1), 34 + (i % 3) * 32, 82 - Math.floor(i / 3) * 34, 0.72)).join("");
  return mc(`All the blocks are ${c1}. Could you pick a ${c} block?`, [W("Yes", askIn), W("No", !askIn)], { keep: true, diagram: D(160, 130, bag, 210), why: askIn ? `Every block is ${c1}.` : `There are no ${c} blocks in the bag.` });
});
T("MAE-DATA-01", "respond-collect", "good-question", "Answer a question from what was collected", () => {
  const ts = shuffle(["apple", "fish", "star", "heart"]).slice(0, 2), v = diff(2, 6, 2), k = v[0] > v[1] ? 0 : 1;
  const g = ts.map((t, r) => range(0, v[r] - 1).map(i => at(ICON[t](), 6 + i * 44, 6 + r * 46)).join("")).join("");
  return mc("Children put a picture next to the one they like best. Which one do more children like?", ts.map((t, i) => ({ h: one(ICON[t](), 64), s: nm(t, 2), ok: i === k })), { keep: true, diagram: D(6 * 44 + 8, 98, g, 380), why: `${v[k]} is more than ${v[1 - k]}.` });
});

/* =====================================================================================
   PAPER ONLY — drawing and colouring, for the worksheet creators (a Kindergarten child shows
   a lot by drawing; the online quiz cannot ask for that)
   ===================================================================================== */
const empties = n => range(1, n).map(() => `<rect x="2" y="2" width="36" height="36" rx="8" fill="#fff" stroke="${INK}" stroke-width="1.4" stroke-dasharray="5 4"/>`);
PT("MAE-RWN-02", "connect-counting-numerals", "draw-collection", "Draw a collection", () => { const n = ri(3, 12), w = pick(["circles", "stars", "apples", "dots"]); return drawQ(`Draw ${n} ${w}.`, `${n} ${w}`, { drawSpace: 30 }); });
PT("MAE-RWN-01", "counting-sequence", "write-missing", "Write the missing numbers", () => { const a = ri(1, 14), v = range(a, a + 5), holes = shuffle([1, 2, 3, 4, 5]).slice(0, 3); const c = 58; return drawQ("Write the missing numbers.", holes.sort().map(i => v[i]).join(", "), { diagram: D(v.length * c + 8, 66, v.map((x, i) => `<rect x="${4 + i * c}" y="4" width="${c - 6}" height="56" rx="9" fill="#fff" ${st}/>` + (holes.includes(i) ? "" : lab(4 + i * c + (c - 6) / 2, 42, x, 28))).join(""), 430, 86) }); });
PT("MAE-CSQ-01", "additive-relations", "draw-more", "Draw more, then count", () => { const a = ri(1, 5), b = ri(1, 4); return Object.assign(num(`Draw ${b} more. How many now?`, a + b, { diagram: coll([...Array(a).fill(ICON.counter("red")), ...empties(b)], 5), why: `${a} and ${b} makes ${a + b}.` })); });
PT("MAE-CSQ-02", "part-whole-10", "draw-to-make", "Draw counters to make 5 or 10", () => { const ten = pick([true, false]), n = ri(1, ten ? 9 : 4), T2 = ten ? 10 : 5, c = 46; return drawQ(`Draw more counters to make ${T2}.`, `${T2 - n} more counters`, { diagram: D(5 * c + 8, (ten ? 2 : 1) * c + 8, range(0, T2 - 1).map(i => `<rect x="${4 + (i % 5) * c}" y="${4 + Math.floor(i / 5) * c}" width="${c}" height="${c}" fill="#fff" ${st}/>` + (i < n ? at(ICON.counter("red"), 4 + (i % 5) * c + 3, 4 + Math.floor(i / 5) * c + 3) : "")).join(""), 330, 70), why: `${n} and ${T2 - n} makes ${T2}.` }); });
PT("MAE-FG-01", "patterns", "draw-next", "Draw what comes next", () => { const P = pattern(), n = P.unit.length * 2; return drawQ("Draw the next two.", `${say(P.at(n))}, then ${say(P.at(n + 1))}`, { diagram: strip([...range(0, n - 1).map(i => draw(P.at(i))), ...empties(2)]), why: `The pattern repeats: ${P.unit.map(k => say(P.ps[k])).join(", ")}.` }); });
PT("MAE-FG-01", "patterns", "make-pattern", "Colour your own pattern", () => drawQ("Colour the circles to make a pattern that repeats.", "Any pattern that repeats, such as red, blue, red, blue", { diagram: strip(range(1, 8).map(() => `<circle cx="20" cy="20" r="16" fill="#fff" ${st}/>`)) }));
PT("MAE-FG-02", "record-grouping-sharing", "draw-share", "Share by drawing", () => { const k = ri(2, 3), each = ri(1, 4), w = pick(["apples", "dots", "stars"]); return drawQ(`Share ${k * each} ${w} onto the ${k} plates. Draw them.`, `${each} on each plate`, { diagram: D(k * 130, 96, range(0, k - 1).map(i => `<ellipse cx="${65 + i * 130}" cy="48" rx="60" ry="42" fill="#fff" ${st}/>`).join(""), 420, 30 * k + 20), why: `${k * each} shared between ${k} is ${each} each.` }); });
PT("MAE-GM-01", "position", "draw-position", "Draw it in the right place", () => { const w = pick(Object.keys(POS)), t = pick(["ball", "star", "apple"]); return drawQ(`Draw ${t === "apple" ? "an" : "a"} ${t} ${w} the table.`, `${t === "apple" ? "An" : "A"} ${t} drawn ${w} the table`, { diagram: { html: svg(210, 146, table + `<line x1="4" y1="139" x2="206" y2="139" stroke="#94a3b8" stroke-width="2"/>`, 250), wMM: 56 } }); });
PT("MAE-GM-02", "length-compare", "draw-longer", "Draw a longer or shorter line", () => { const long = pick([true, false]); return drawQ(`Draw a line that is ${long ? "longer" : "shorter"} than the pencil.`, `Any line ${long ? "longer" : "shorter"} than the pencil`, { diagram: D(300, 30, pencil(6, 8, long ? ri(4, 6) * 20 : ri(9, 12) * 20, COL.blue), 400, 76), drawSpace: 16 }); });
PT("MAE-GM-03", "half-a-length", "mark-half", "Mark half of the ribbon", () => drawQ("Draw a line to cut the ribbon in half.", "A line across the middle of the ribbon", { diagram: D(260, 40, `<rect x="10" y="9" width="${pick([180, 220, 240])}" height="22" rx="3" fill="${COL.pink}" ${st}/>`, 400, 80), why: "Both parts must be the same length." }));
PT("MAE-2DS-01", "represent-shapes", "draw-shape", "Draw a shape", () => { const s2 = pick(SH); return drawQ(`Draw a ${s2}.`, `A ${s2}${s2 === "circle" ? "" : ` (${SIDES[s2]} straight sides)`}`, { drawSpace: 30 }); });
PT("MAE-2DS-01", "represent-shapes", "make-picture", "Make a picture from shapes", () => { const [a, b] = shuffle(["circles", "squares", "triangles", "rectangles"]); return drawQ(`Draw a picture using ${a} and ${b}.`, `Any picture made from ${a} and ${b}`, { drawSpace: 42 }); });
PT("MAE-2DS-02", "area", "draw-bigger", "Draw a bigger or smaller shape", () => { const s2 = pick(["square", "circle", "triangle"]), big = pick([true, false]); return drawQ(`Draw a ${big ? "bigger" : "smaller"} ${s2}.`, `A ${s2} that covers ${big ? "more" : "less"} space`, { diagram: { html: svg(44, 44, at(ICON[s2]("blue"), 2, 2), big ? 70 : 130), wMM: big ? 16 : 30 }, drawSpace: big ? 40 : 26 }); });
PT("MAE-3DS-02", "volume-building", "colour-taller", "Colour the building with more blocks", () => { const [a, b] = diff(2, 7, 2); const build = (x, n) => range(0, n - 1).map(i => `<rect x="${x + (i % 2) * 34}" y="${128 - (Math.floor(i / 2) + 1) * 26}" width="34" height="26" fill="#fff" ${st}/>`).join(""); return drawQ("Colour the building that uses more blocks.", `Building ${a > b ? "A" : "B"} (${Math.max(a, b)} blocks)`, { diagram: D(240, 160, build(26, a) + build(146, b) + `<line x1="4" y1="129" x2="236" y2="129" stroke="${INK}" stroke-width="2"/>` + lab(60, 154, "A") + lab(180, 154, "B"), 320, 62), why: `A uses ${a} blocks. B uses ${b} blocks.` }); });
PT("MAE-NSM-02", "hour-time", "draw-hands", "Draw the hands for o'clock", () => { const h = ri(1, 12); return drawQ(`Draw the hands to show ${h} o'clock.`, `Long hand on 12, short hand on ${h}`, { diagram: { engine: "measure-engine", config: { diagramType: "clock", hands: false }, scale: 1.1 } }); });
PT("MAE-DATA-01", "organise-displays", "colour-display", "Colour a box for each one", () => {
  const ts = shuffle(THINGS).slice(0, 2), v = [ri(1, 5), ri(1, 5)], mix = shuffle([...Array(v[0]).fill(ts[0]), ...Array(v[1]).fill(ts[1])]);
  const top = mix.map((t, i) => at(ICON[t](), 6 + i * 40, 2, 0.85)).join("");
  const grid = ts.map((t, r) => at(ICON[t](), 6, 52 + r * 44, 0.85) + range(0, 4).map(i => `<rect x="${52 + i * 40}" y="${50 + r * 44}" width="40" height="38" fill="#fff" ${st}/>`).join("")).join("");
  return drawQ("Colour one box for each thing you count.", `${v[0]} ${nm(ts[0], v[0])} and ${v[1]} ${nm(ts[1], v[1])}`, { diagram: D(Math.max(mix.length * 40 + 10, 260), 142, top + grid, 420, 84) });
});

/* ======================= outcomes, bank ======================= */
export const OUTCOMES = {
  "MAE-RWN-01": { slug: "counting", strand: "number", title: "Counting and Seeing How Many", full: "Representing Whole Numbers: Counting and Number Patterns" },
  "MAE-RWN-02": { slug: "numbers-to-20", strand: "number", title: "Numbers to 20", full: "Representing Whole Numbers: Numbers to 20" },
  "MAE-CSQ-01": { slug: "adding-taking-away", strand: "number", title: "Adding and Taking Away", full: "Combining and Separating Quantities" },
  "MAE-CSQ-02": { slug: "parts-of-numbers", strand: "number", title: "Parts of Numbers to 10", full: "Combining and Separating Quantities: Part–Whole to 10" },
  "MAE-FG-01": { slug: "patterns", strand: "number", title: "Patterns", full: "Forming Groups: Repeating Patterns" },
  "MAE-FG-02": { slug: "sharing-equal-groups", strand: "number", title: "Sharing and Equal Groups", full: "Forming Groups: Equal Groups and Sharing" },
  "MAE-GM-01": { slug: "position", strand: "measurement-space", title: "Position", full: "Geometric Measure: Position" },
  "MAE-GM-02": { slug: "length", strand: "measurement-space", title: "Length", full: "Geometric Measure: Length" },
  "MAE-GM-03": { slug: "half-a-length", strand: "measurement-space", title: "Half a Length", full: "Geometric Measure: Half a Length" },
  "MAE-2DS-01": { slug: "2d-shapes", strand: "measurement-space", title: "2D Shapes", full: "2D Spatial Structure: 2D Shapes" },
  "MAE-2DS-02": { slug: "area", strand: "measurement-space", title: "Area", full: "2D Spatial Structure: Area" },
  "MAE-3DS-01": { slug: "3d-objects", strand: "measurement-space", title: "3D Objects", full: "3D Spatial Structure: 3D Objects" },
  "MAE-3DS-02": { slug: "volume", strand: "measurement-space", title: "Volume and Capacity", full: "3D Spatial Structure: Volume" },
  "MAE-NSM-01": { slug: "mass", strand: "measurement-space", title: "Mass", full: "Non-Spatial Measure: Mass" },
  "MAE-NSM-02": { slug: "time", strand: "measurement-space", title: "Time", full: "Non-Spatial Measure: Time" },
  "MAE-DATA-01": { slug: "data", strand: "statistics-probability", title: "Data", full: "Data" }
};
const ON_PAPER = typeof window !== "undefined" && !!window.WSF;      // the worksheet creator's frame is loading this bank
export const typesOf = (code, paper = ON_PAPER) => TYPES.filter(t => t.code === code && (paper || !t.paper));
const bigger = d => { if (d && d.engine) { d.scale = (d.scale || 1) * 1.3; d.minCapMM = 66; d.maxH = 440; } return d; };
export function kBank(code, extra = {}) {
  const O = OUTCOMES[code]; if (!O) throw new Error("No Early Stage 1 outcome " + code);
  const types = typesOf(code).map(t => ({
    id: t.id, levels: ["k"], level: "expected", stmt: t.stmt, label: t.label, paper: !!t.paper,
    gen: () => { const q = t.gen(); if (ON_PAPER) bigger(q.diagram); q.key = t.id + q.prompt + JSON.stringify(q.options || q.value) + JSON.stringify((q.diagram && (q.diagram.config || q.diagram.html)) || "").slice(0, 400); return q; }
  }));
  const low = s => s.charAt(0).toLowerCase() + s.slice(1);
  return Object.assign({
    id: "es1-" + O.slug, title: O.title, outcome: code,
    toolId: `es1-${O.slug}-quiz`, tool: `es1-${O.slug}-student-quiz`, mastery: "es1-" + O.slug,
    levels: { k: { name: "Kindergarten", sub: `${types.slice(0, 4).map(t => low(t.label)).join(", ")}${types.length > 4 ? " and more" : ""}.`, xp: 1 } },
    readAloud: true, young: true, year12: true, secondTry: true, autoRead: true, numPad: true, stars: true, defaultCount: 8, types, related: []
  }, extra);
}
