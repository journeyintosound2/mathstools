/* Fractions, Decimals and Percentages — MA4-FRC-C-01. Question types from the
   Revision Generator's FDP bank (question-banks/fdp/) under the ten content
   statements, plus two written for paper where the bank has nothing:
   ordering a mix of fractions, decimals and percentages, and rational or
   irrational numbers. */
const T = (lv, id, label, stmt) => RG.type(BANK_GEN, lv, id, label, stmt);
const C = WSF.C;
const M = s => `<span class="m">${s}</span>`;
const fr = (n, d) => C.frac(n, d, false);
function orderMix(level) {
  for (let t = 0; t < 300; t++) {
    const pool = level === 'basic'
      ? [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10]]
      : [[1, 3], [2, 3], [1, 8], [3, 8], [5, 8], [7, 8], [3, 20], [7, 20], [11, 20], [5, 6], [4, 9], [2, 7]];
    const items = [];
    const used = new Set();
    while (items.length < 4) {
      const [n, d] = C.pick(pool), v = n / d, k = C.pick(['f', 'd', 'p']);
      const key = Math.round(v * 1e4);
      if (used.has(key)) continue;
      used.add(key);
      // a value close to another, written another way, is the point of the question
      const show = k === 'f' ? fr(n, d) : k === 'd' ? C.fmt(Math.round(v * 1000) / 1000, 3) : C.fmt(Math.round(v * 1000) / 10, 1) + '%';
      const txt = k === 'f' ? `${n}/${d}` : k === 'd' ? C.fmt(Math.round(v * 1000) / 1000, 3) : C.fmt(Math.round(v * 1000) / 10, 1) + '%';
      items.push({ v, show, txt, k });
    }
    if (new Set(items.map(i => i.k)).size < 3) continue;
    const asc = items.slice().sort((a, b) => a.v - b.v);
    return {
      prompt: `Write these numbers in order from smallest to largest.<span class="big">${items.map(i => i.show).join(' , ')}</span>`,
      mode: 'none', answerHTML: asc.map(i => i.show).join(' , '),
      why: 'As decimals: ' + asc.map(i => `${i.txt} = ${C.fmt(Math.round(i.v * 1000) / 1000, 3)}`).join(', ') + '.'
    };
  }
}
const IRR = [
  ['√2', false, '√2 is not a whole number and cannot be written as a fraction; its decimal never ends or repeats.'],
  ['√3', false, '3 is not a perfect square, so √3 is irrational.'],
  ['√10', false, '10 is not a perfect square, so √10 is irrational.'],
  ['π', false, 'π cannot be written as a fraction; its decimal never ends or repeats.'],
  ['√16', true, '√16 = 4, a whole number.'],
  ['√49', true, '√49 = 7.'],
  ['0.75', true, '0.75 = 3/4.'],
  ['0.3̇', true, '0.333… = 1/3: a repeating decimal is rational.'],
  ['2/7', true, 'It is already a fraction of two integers.'],
  ['−5', true, '−5 = −5/1.'],
  ['1.2̇5̇', true, 'A repeating decimal can always be written as a fraction.'],
  ['√(9/4)', true, '√(9/4) = 3/2.']
];
function irrational(level) {
  if (level === 'basic') {
    const it = C.pick(IRR);
    return { prompt: `Is ${M(it[0])} rational or irrational?`, mode: 'mc', options: ['Rational', 'Irrational'], correct: it[1] ? 0 : 1, why: it[2] };
  }
  const pick = C.shuffle(IRR).slice(0, 5);
  return { prompt: `Circle the irrational numbers. Explain how you know.<span class="big">${pick.map(p => p[0]).join(' &nbsp; ')}</span>`, mode: 'none', drawSpace: 8,
    answerHTML: pick.filter(p => !p[1]).map(p => p[0]).join(', ') || 'None of them',
    why: pick.map(p => `${p[0]}: ${p[2]}`).join(' ') };
}
function fracOp(kind, level) {
  const g = C.gcd, sf = (n, d) => { const k = g(Math.abs(n), Math.abs(d)); return [n / k, d / k]; };
  const show = (n, d) => { const [a, b] = sf(n, d); if (b === 1) return String(a); if (level === 'expected' && Math.abs(a) > b) { const w = Math.trunc(a / b), r = Math.abs(a % b); return `${w}${fr(r, b)}`; } return fr(a, b); };
  for (let t = 0; t < 300; t++) {
    const D = level === 'basic' ? [2, 3, 4, 5, 6, 8, 10] : [2, 3, 4, 5, 6, 7, 8, 9, 10, 12];
    const b = C.pick(D), d = C.pick(D), a = C.ri(1, b - 1), c = C.ri(1, d - 1);
    if (g(a, b) !== 1 || g(c, d) !== 1) continue;
    if (level === 'basic' && kind === 'as' && !(b % d === 0 || d % b === 0)) continue;
    let n, m, op, w;
    if (kind === 'as') {
      op = C.pick(['+', '−']);
      if (op === '−' && a / b <= c / d) continue;
      const L = C.lcm(b, d); n = op === '+' ? a * L / b + c * L / d : a * L / b - c * L / d; m = L;
      w = `Common denominator ${L}: ${fr(a * L / b, L)} ${op} ${fr(c * L / d, L)} = ${fr(n, L)}${sf(n, m)[1] !== m || Math.abs(n) > m ? ` = ${show(n, m)}` : ''}.`;
    } else {
      op = C.pick(['×', '÷']);
      if (op === '×') { n = a * c; m = b * d; w = `Multiply the numerators and the denominators: ${fr(a * c, b * d)}${sf(n, m)[1] !== m ? ` = ${show(n, m)}` : ''}.`; }
      else { n = a * d; m = b * c; w = `Dividing by ${fr(c, d)} is multiplying by ${fr(d, c)}: ${fr(a, b)} × ${fr(d, c)} = ${fr(n, m)}${sf(n, m)[1] !== m || n > m ? ` = ${show(n, m)}` : ''}.`; }
    }
    if (n <= 0) continue;
    return { prompt: `Calculate, giving your answer in simplest form.<span class="big">${fr(a, b)} ${op} ${fr(c, d)}</span>`, mode: 'none', answerHTML: show(n, m), why: w };
  }
}
WSF.page({
  topic: 'Fractions, Decimals and Percentages', outcome: 'MA4-FRC-C-01', langKey: 'mmt-fdp-ws-lang', bank: false,
  translateTopic: 'Fractions, Decimals and Percentages', defaultCount: 12, statements: STATEMENTS,
  paperTypes: [
    T('basic', 'shaded-fractions', 'Shaded fractions', 'equivalence'),
    T('basic', 'equivalent-fraction-visual', 'Equivalent fractions (bars)', 'equivalence'),
    T('basic', 'equivalent-fractions', 'Equivalent fractions', 'equivalence'),
    T('basic', 'simplify-fractions', 'Simplify fractions', 'equivalence'),
    T('basic', 'compare-fractions', 'Compare fractions', 'equivalence'),
    T('basic', 'round-decimals', 'Round decimals', 'round-decimals'),
    T('basic', 'recurring-decimals', 'Terminating and recurring decimals', 'terminating-recurring'),
    T('basic', 'fdp-conversions', 'Convert between fractions, decimals and percentages', 'fdp-conversions'),
    { id: 'p-irr-b', level: 'basic', stmt: 'irrational', label: 'Rational or irrational?', gen: () => irrational('basic') },
    T('basic', 'compare-decimals', 'Compare and order decimals', 'order-fdp'),
    { id: 'p-order-b', level: 'basic', stmt: 'order-fdp', label: 'Order fractions, decimals and percentages', gen: () => orderMix('basic') },
    { id: 'p-as-b', level: 'basic', stmt: 'add-subtract', label: 'Add and subtract fractions', gen: () => fracOp('as', 'basic') },
    T('basic', 'fraction-of-quantity', 'Fraction of a quantity', 'multiply-divide'),
    T('basic', 'fraction-multiply-area', 'Multiply fractions (area model)', 'multiply-divide'),
    T('basic', 'fraction-of-group', 'Fraction of a set', 'one-as-another'),
    T('basic', 'percentage-of', 'Percentage of a quantity', 'percentages'),

    T('expected', 'compare-fractions', 'Compare and order fractions', 'equivalence'),
    T('expected', 'mixed-improper', 'Mixed numbers and improper fractions', 'equivalence'),
    T('expected', 'round-decimals', 'Round decimals', 'round-decimals'),
    T('expected', 'recurring-decimals', 'Terminating and recurring decimals', 'terminating-recurring'),
    T('expected', 'fdp-conversions', 'Convert between fractions, decimals and percentages', 'fdp-conversions'),
    T('expected', 'true-false-fdp', 'True or false (reasoning)', 'fdp-conversions'),
    { id: 'p-irr-e', level: 'expected', stmt: 'irrational', label: 'Find the irrational numbers', gen: () => irrational('expected') },
    { id: 'p-order-e', level: 'expected', stmt: 'order-fdp', label: 'Order fractions, decimals and percentages', gen: () => orderMix('expected') },
    { id: 'p-as-e', level: 'expected', stmt: 'add-subtract', label: 'Add and subtract fractions (any denominators)', gen: () => fracOp('as', 'expected') },
    { id: 'p-md-e', level: 'expected', stmt: 'multiply-divide', label: 'Multiply and divide fractions', gen: () => fracOp('md', 'expected') },
    T('expected', 'decimal-operations', 'Operations with decimals', 'multiply-divide'),
    T('expected', 'fraction-of-quantity', 'Fraction of a quantity', 'multiply-divide'),
    T('expected', 'quantity-as-percentage', 'One quantity as a percentage of another', 'one-as-another'),
    T('expected', 'percentage-change', 'Percentage increase and decrease', 'percentages'),
    T('expected', 'discounts', 'Discounts and best buys', 'percentages'),
    T('expected', 'gst-tax', 'GST (10%)', 'percentages'),
    T('expected', 'profit-and-loss', 'Profit and loss', 'percentages'),
    T('expected', 'find-original-value', 'Find the original value', 'percentages'),
    T('expected', 'proportion-double-line', 'Percentages on a double number line', 'percentages'),
    T('expected', 'error-spot-fdp', 'Spot the error (reasoning)', 'percentages'),
    T('expected', 'multi-part-percentage', 'Multi-part percentage problem', 'percentages')
  ]
});
