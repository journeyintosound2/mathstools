/* Probability — MA4-PRO-C-01 — whole-topic quiz bank.
   Content statements: determine probabilities for chance experiments ·
   determine probabilities for complementary events.
   Single-step experiments only (two-step experiments are Stage 5). Every
   spinner, bag and card set is drawn from the counts the answer uses.
   Probabilities may be typed as a fraction, decimal or percentage unless the
   question asks for one form; fractions must be simplified. */
const C = window.MMTQCore;
const { ri, pick, shuffle, sample, gcd, fmt, frac } = C;
const T = [];
const add = (level, id, label, gen, check) => T.push({ level, id, label, gen, check });
const P = (config, scale = 1.0, maxH = 300) => ({ engine: "probability-engine", config, scale, maxH });
const COLOURS = ["Red", "Blue", "Green", "Yellow", "Purple", "Orange"];
const fr = (n, d) => ({ mode: "frac", n, d, answerHTML: frac(n, d) });
const isPrime = n => C.isPrime(n);
const EVENTS = [
  ["an even number", n => n % 2 === 0], ["an odd number", n => n % 2 === 1], ["a prime number", isPrime],
  ["a multiple of 3", n => n % 3 === 0], ["a number greater than K", (n, k) => n > k], ["a number less than K", (n, k) => n < k], ["a multiple of 5", n => n % 5 === 0]
];
function cardEvent(N) {
  for (;;) {
    const [w, f] = pick(EVENTS), k = ri(2, N - 2);
    const name = w.replace("K", k);
    const fav = Array.from({ length: N }, (_, i) => i + 1).filter(n => f(n, k)).length;
    if (fav > 0 && fav < N) return { name, fav, k };
  }
}

/* ================================ BASIC ================================ */
add("basic", "b-sample-space", "Sample spaces", () => {
  const k = pick(["die", "spinner", "cards", "letters"]);
  if (k === "die") return { prompt: `A fair six-sided die is rolled. How many outcomes are in the sample space?`, mode: "num", value: 6, why: `The sample space is {1, 2, 3, 4, 5, 6}: 6 outcomes.`, key: "die" };
  if (k === "spinner") { const n = ri(3, 8), labels = Array.from({ length: n }, (_, i) => String(i + 1)); return { prompt: `This spinner is spun once. How many outcomes are in the sample space?`, diagram: P({ diagramType: "spinner", labels }), mode: "num", value: n, why: `It can land on ${labels.join(", ")}: ${n} outcomes.` }; }
  if (k === "cards") { const n = ri(5, 12), items = Array.from({ length: n }, (_, i) => String(i + 1)); return { prompt: `One card is chosen at random. How many outcomes are in the sample space?`, diagram: P({ diagramType: "cards", items }), mode: "num", value: n, why: `Each card is one outcome: ${n}.` }; }
  const w = pick(["MATHS", "NUMBER", "CHANCE", "SPINNER", "DICE"]); const u = [...new Set(w.split(""))];
  return { prompt: `The letters of <b>${w}</b> are on tiles, and one tile is chosen. How many <b>different</b> letters could be chosen?`, diagram: P({ diagramType: "cards", items: w.split("") }), mode: "num", value: u.length, why: `The different letters are ${u.join(", ")}: ${u.length}.` };
});
add("basic", "b-chance-words", "Describe chance in words", () => {
  const items = [
    ["rolling a 7 on a normal six-sided die", "Impossible"], ["the sun rising in the east tomorrow", "Certain"], ["a fair coin landing on heads", "Even chance"],
    ["rolling a number less than 7 on a six-sided die", "Certain"], ["rolling a 6 on a six-sided die", "Unlikely"], ["rolling a number greater than 1 on a six-sided die", "Likely"],
    ["choosing a red card from a normal deck of 52 playing cards", "Even chance"], ["choosing a blue counter from a bag of 9 blue and 1 red counter", "Likely"],
    ["choosing a red counter from a bag of 9 blue and 1 red counter", "Unlikely"], ["it snowing in Sydney in January", "Unlikely"]
  ];
  const [e, a] = pick(items);
  const opts = ["Impossible", "Unlikely", "Even chance", "Likely", "Certain"];
  return { prompt: `Which word best describes the chance of ${e}?`, mode: "mc", options: opts, correct: opts.indexOf(a), keepOrder: true, why: `${a}${{ Impossible: " — it cannot happen (probability 0).", Certain: " — it must happen (probability 1).", "Even chance": " — it is as likely to happen as not (probability ½).", Unlikely: " — less than an even chance.", Likely: " — more than an even chance." }[a]}`, key: e };
});
add("basic", "b-scale", "The 0 to 1 probability scale", () => {
  const items = [["rolling a 7 on a six-sided die", 0], ["a coin landing on tails", 0.5], ["rolling a number from 1 to 6 on a six-sided die", 1], ["rolling a 1 on a six-sided die", 1 / 6], ["rolling a number greater than 1 on a six-sided die", 5 / 6]];
  const [e, p] = pick(items);
  const vals = shuffle([0, 1 / 6, 0.5, 5 / 6, 1].filter(v => v !== p)).slice(0, 3).concat(p).sort((a, b) => a - b);
  const L = ["A", "B", "C", "D"];
  return { prompt: `Which letter on the probability scale best shows the chance of ${e}?`, diagram: P({ diagramType: "scale", markers: vals.map((v, i) => ({ value: v, label: L[i] })) }, 1.0, 200), mode: "mc", options: L, correct: vals.indexOf(p), keepOrder: true, why: `The probability is ${p === 0 ? "0 (impossible)" : p === 1 ? "1 (certain)" : p === 0.5 ? "½ (even chance)" : p < 0.5 ? "1/6 — close to 0" : "5/6 — close to 1"}.`, key: e + vals.join() };
});
add("basic", "b-die", "Probability with a die", () => {
  const ev = pick([["a 4", n => n === 4], ["an even number", n => n % 2 === 0], ["a number greater than 4", n => n > 4], ["a number less than 3", n => n < 3], ["a prime number", isPrime], ["a 1 or a 6", n => n === 1 || n === 6], ["a multiple of 3", n => n % 3 === 0], ["a number less than 5", n => n < 5]]);
  const fav = [1, 2, 3, 4, 5, 6].filter(ev[1]);
  return { prompt: `A fair six-sided die is rolled. What is the probability of rolling ${ev[0]}?`, ...fr(fav.length, 6), why: `Favourable outcomes: ${fav.join(", ")} (${fav.length} of 6). P = ${fav.length}/6${gcd(fav.length, 6) > 1 ? ` = ${C.fracText(fav.length, 6)}` : ""}.`, key: ev[0] };
});
add("basic", "b-spinner", "Probability with a spinner", () => {
  const n = pick([4, 5, 6, 8, 10]), cols = sample(COLOURS, ri(2, 3));
  let labels; do { labels = Array.from({ length: n }, () => pick(cols)); } while (new Set(labels).size < cols.length);
  labels = shuffle(labels);
  const c = pick(cols), f = labels.filter(l => l === c).length;
  return { prompt: `The spinner has ${n} equal sectors. What is the probability that it lands on <b>${c}</b>?`, diagram: P({ diagramType: "spinner", labels }), ...fr(f, n), why: `${f} of the ${n} equal sectors ${f === 1 ? "is" : "are"} ${c}: P = ${C.fracText(f, n)}.` };
});
add("basic", "b-bag", "Probability with counters in a bag", () => {
  const cols = sample(["red", "blue", "green", "yellow"], ri(2, 3)), counts = {};
  cols.forEach(c => counts[c] = ri(1, 6));
  const tot = Object.values(counts).reduce((a, b) => a + b, 0), c = pick(cols);
  return { prompt: `A counter is taken at random from the bag. What is the probability that it is <b>${c}</b>?`, diagram: P({ diagramType: "bag", counts }), ...fr(counts[c], tot), why: `${counts[c]} of the ${tot} counters are ${c}: P = ${C.fracText(counts[c], tot)}.` };
});
add("basic", "b-cards", "Probability with numbered cards", () => {
  const N = pick([8, 10, 12, 15, 20]), e = cardEvent(N);
  return { prompt: `Cards numbered 1 to ${N} are shuffled and one is chosen. What is the probability that it shows <b>${e.name}</b>?`, ...fr(e.fav, N), why: `${e.fav} of the ${N} cards show ${e.name}: P = ${C.fracText(e.fav, N)}.` };
}, q => { const N = +q.prompt.match(/1 to (\d+)/)[1]; const e = q.prompt.match(/shows <b>(.+)<\/b>/)[1]; const k = +(e.match(/than (\d+)/) || [])[1]; const ev = EVENTS.find(([w]) => w.replace("K", k) === e); const fav = Array.from({ length: N }, (_, i) => i + 1).filter(n => ev[1](n, k)).length; return fav * q.d === q.n * N ? null : "card count"; });

/* =============================== EXPECTED ============================== */
add("expected", "e-fdp", "Probability as a fraction, decimal and percentage", () => {
  const d = pick([4, 5, 8, 10, 20, 25]), n = ri(1, d - 1), form = pick(["decimal", "percent"]);
  const thing = pick([`A spinner has ${d} equal sectors and ${n} of them are shaded.`, `A bag holds ${d} marbles and ${n} of them are green.`]);
  return { prompt: `${thing} Write the probability of getting ${/shaded/.test(thing) ? "a shaded sector" : "a green marble"} as a <b>${form === "decimal" ? "decimal" : "percentage"}</b>.`, mode: "frac", n, d, form, answerHTML: form === "decimal" ? fmt(n / d) : fmt(n / d * 100) + "%", why: `P = ${n}/${d} = ${fmt(n / d)} = ${fmt(n / d * 100)}%.` };
});
add("expected", "e-complement", "P(not A) = 1 − P(A)", () => {
  const k = pick(["frac", "dec", "pct"]);
  if (k === "frac") { const d = pick([5, 7, 8, 9, 10, 12, 20]); let n; do { n = ri(1, d - 1); } while (gcd(n, d) > 1); const ev = pick(["Sam wins the race", "it rains tomorrow", "the bus is late", "a seed sprouts"]); return { prompt: `The probability that ${ev} is ${frac(n, d)}. What is the probability that this does <b>not</b> happen?`, ...fr(d - n, d), why: `P(not) = 1 − ${n}/${d} = ${d - n}/${d}.` }; }
  if (k === "dec") { const p = ri(5, 95) / 100; return { prompt: `The probability of an event is ${fmt(p)}. What is the probability of its complement?`, mode: "frac", n: Math.round((1 - p) * 100), d: 100, simplest: false, answerHTML: fmt(1 - p), why: `1 − ${fmt(p)} = ${fmt(1 - p)}.` }; }
  const p = ri(1, 19) * 5; return { prompt: `There is a ${p}% chance of rain tomorrow. What is the chance that it does <b>not</b> rain?`, mode: "frac", n: 100 - p, d: 100, answerHTML: `${100 - p}%`, why: `100% − ${p}% = ${100 - p}%.` };
});
add("expected", "e-complement-event", "Describe the complementary event", () => {
  const items = [
    ["rolling an even number on a die", "rolling an odd number", ["rolling a 6", "rolling a number less than 6", "rolling a 1"]],
    ["rolling a number greater than 4 on a die", "rolling a number less than or equal to 4", ["rolling a number less than 4", "rolling a 5", "rolling a number greater than 5"]],
    ["a coin landing on heads", "the coin landing on tails", ["the coin landing on heads twice", "the coin landing on its edge", "rolling a 6"]],
    ["choosing a vowel from the letters of a word", "choosing a consonant", ["choosing the letter A", "choosing a vowel", "choosing the last letter"]],
    ["the spinner landing on red", "the spinner not landing on red", ["the spinner landing on blue", "the spinner landing on red twice", "the spinner landing between colours"]],
    ["a team winning a soccer game", "the team not winning (a draw or a loss)", ["the team losing", "the team drawing", "the other team scoring"]]
  ];
  const [e, a, wrong] = pick(items);
  const opts = shuffle([a, ...wrong]);
  return { prompt: `What is the <b>complement</b> of the event "${e}"?`, mode: "mc", options: opts, correct: opts.indexOf(a), why: `The complement is everything else that can happen: "${a}". Together they cover every outcome and cannot both happen.`, key: e };
});
add("expected", "e-sum-to-one", "Probabilities add to 1", () => {
  for (;;) {
    const cols = sample(COLOURS, ri(3, 4));
    const ps = cols.map(() => ri(1, 9) * 5); const s = ps.slice(0, -1).reduce((a, b) => a + b, 0); if (s >= 95) continue;
    ps[ps.length - 1] = 100 - s; if (ps[ps.length - 1] <= 0) continue;
    const miss = ri(0, cols.length - 1);
    const tbl = `<table class="dtab"><tr><th>Colour</th>${cols.map(c => `<td>${c}</td>`).join("")}</tr><tr><th>Probability</th>${ps.map((p, i) => i === miss ? `<td class="q">?</td>` : `<td>${fmt(p / 100)}</td>`).join("")}</tr></table>`;
    return { prompt: `A spinner can land on these colours. Find the missing probability.${tbl}`, mode: "frac", n: ps[miss], d: 100, form: "decimal", answerHTML: fmt(ps[miss] / 100), why: `The probabilities add to 1: 1 − (${ps.filter((_, i) => i !== miss).map(p => fmt(p / 100)).join(" + ")}) = ${fmt(ps[miss] / 100)}.` };
  }
});
add("expected", "e-relative-frequency", "Relative frequency", () => {
  const exp = pick([["A drawing pin is dropped", ["Point up", "Point down"]], ["A coin is tossed", ["Heads", "Tails"]], ["A paper cup is thrown", ["Upright", "Upside down", "On its side"]]]);
  const N = pick([20, 25, 40, 50, 100, 200]);
  let f;
  // A coin's results should look like a coin's: within 10% of half.
  if (exp[1][0] === "Heads") { const h = Math.round(N / 2 + ri(-N / 10, N / 10)); f = [h, N - h]; } else do { const cuts = Array.from({ length: exp[1].length - 1 }, () => ri(1, N - 1)).sort((a, b) => a - b); f = cuts.map((c, i) => c - (i ? cuts[i - 1] : 0)).concat(N - cuts[cuts.length - 1]); } while (f.some(v => v < 2));
  const i = ri(0, exp[1].length - 1);
  const tbl = `<table class="dtab"><tr><th>Outcome</th>${exp[1].map(o => `<td>${o}</td>`).join("")}</tr><tr><th>Frequency</th>${f.map(v => `<td>${v}</td>`).join("")}</tr></table>`;
  return { prompt: `${exp[0]} ${N} times. The results are in the table.${tbl}What is the relative frequency of <b>${exp[1][i]}</b>, as a decimal?`, mode: "frac", n: f[i], d: N, form: "decimal", answerHTML: fmt(f[i] / N), why: `Relative frequency = ${f[i]} ÷ ${N} = ${fmt(f[i] / N)}.` };
});
add("expected", "e-expected", "Expected number of outcomes", () => {
  const k = pick([0, 1, 2]);
  if (k === 0) { const n = pick([60, 120, 300, 600]), face = ri(1, 6); return { prompt: `A fair die is rolled ${n} times. About how many times would you expect to roll a ${face}?`, mode: "num", value: n / 6, why: `P(${face}) = 1/6, and 1/6 × ${n} = ${n / 6}.` }; }
  if (k === 1) { const p = pick([2, 4, 5, 10, 20, 25]), n = pick([200, 400, 500, 1000]); return { prompt: `The probability that a light globe is faulty is ${p}%. Out of ${n} globes, how many would you expect to be faulty?`, mode: "num", value: n * p / 100, why: `${p}% of ${n} = ${fmt(n * p / 100)}.` }; }
  const d = pick([4, 5, 8, 10]), nn = ri(1, d - 1), t = d * pick([10, 20, 25, 50]);
  return { prompt: `A spinner has ${d} equal sectors and ${nn} of them are blue. It is spun ${t} times. How many times would you expect it to land on blue?`, mode: "num", value: t * nn / d, why: `P(blue) = ${nn}/${d}, and ${nn}/${d} × ${t} = ${fmt(t * nn / d)}.` };
});
add("expected", "e-not-equal", "Outcomes that are not equally likely", () => {
  for (;;) {
    const parts = pick([[2, 1, 1], [3, 1], [1, 1, 2], [3, 2, 1], [2, 2, 1, 1], [4, 1, 1, 2]]);
    const labels = sample(["A", "B", "C", "D"], parts.length);
    const tot = parts.reduce((a, b) => a + b, 0); const i = ri(0, parts.length - 1);
    if (parts.filter(p => p === parts[i]).length === parts.length) continue;
    const angles = parts.map(p => p / tot * 360);
    if (angles.some(a => !Number.isInteger(a))) continue;
    return { prompt: `A spinner has ${parts.length} sectors of angles ${angles.map((a, j) => `${labels[j]} = ${a}°`).join(", ")}. What is the probability that it lands on <b>${labels[i]}</b>?`, diagram: P({ diagramType: "spinner", labels, weights: parts }), ...fr(parts[i], tot), why: `The sectors are not equal, so use the angle: ${angles[i]}/360 = ${C.fracText(parts[i], tot)}.` };
  }
});
add("expected", "e-letters", "Probability with letters", () => {
  const w = pick(["MISSISSIPPI", "BANANA", "PROBABILITY", "STATISTICS", "MATHEMATICS", "AUSTRALIA", "PARALLEL"]);
  const V = "AEIOU", L = w.split("");
  const k = pick(["vowel", "consonant", "letter"]);
  let fav, name;
  if (k === "vowel") { fav = L.filter(l => V.includes(l)).length; name = "a vowel"; }
  else if (k === "consonant") { fav = L.filter(l => !V.includes(l)).length; name = "a consonant"; }
  else { const l = pick([...new Set(L)].filter(x => L.filter(y => y === x).length > 1)); fav = L.filter(x => x === l).length; name = `the letter ${l}`; }
  return { prompt: `The letters of <b>${w}</b> are on tiles in a bag, and one tile is chosen at random. What is the probability that it is ${name}?`, diagram: P({ diagramType: "cards", items: L }, 1.0, 200), ...fr(fav, L.length), why: `${fav} of the ${L.length} tiles: P = ${C.fracText(fav, L.length)}.` };
});

MMTQ.run({
  id: "probability", title: "Probability", outcome: "MA4-PRO-C-01",
  toolId: "probability-quiz", tool: "probability-student-quiz", mastery: "probability",
  levels: {
    basic: { sub: "Sample spaces, chance words and the 0 to 1 scale, and the probability of an event with dice, spinners, bags and cards." },
    expected: { sub: "Fractions, decimals and percentages, complementary events, relative frequency, expected outcomes and outcomes that are not equally likely." }
  },
  related: [],
  types: T
});
