/* Computation with Integers — MA4-INT-C-01. Question types from the Revision
   Generator's integers bank (question-banks/integers/) under the four
   content statements — its whole-number types (rounding, estimation, place
   value, remainders) are left out because they are not in this outcome — plus
   multiplying and dividing integers, written for paper. */
const T = (lv, id, label, stmt) => RG.type(BANK_GEN, lv, id, label, stmt);
const C = WSF.C;
const neg = v => v < 0 ? `(${C.MINUS}${Math.abs(v)})` : String(v);
const num = v => v < 0 ? `${C.MINUS}${Math.abs(v)}` : String(v);
const M = s => `<span class="m">${s}</span>`;
function mulDiv(level) {
  const nz = (a, b) => { let v; do { v = C.ri(a, b); } while (v === 0); return v; };
  if (level === 'basic' || Math.random() < 0.4) {
    const a = nz(-12, 12), b = nz(-12, 12);
    if (Math.random() < 0.5) return { prompt: `Calculate ${M(`${num(a)} × ${neg(b)}`)}.`, mode: 'num', value: a * b, why: `${a < 0 !== b < 0 ? 'Different signs: the answer is negative.' : 'Same signs: the answer is positive.'} ${Math.abs(a)} × ${Math.abs(b)} = ${Math.abs(a * b)}.` };
    return { prompt: `Calculate ${M(`${num(a * b)} ÷ ${neg(b)}`)}.`, mode: 'num', value: a, why: `${(a * b < 0) !== (b < 0) ? 'Different signs: the answer is negative.' : 'Same signs: the answer is positive.'} ${Math.abs(a * b)} ÷ ${Math.abs(b)} = ${Math.abs(a)}.` };
  }
  const a = nz(-9, 9), b = nz(-6, 6), c = nz(-5, 5);
  if (Math.random() < 0.5) {
    const v = a * b * c;
    return { prompt: `Calculate ${M(`${num(a)} × ${neg(b)} × ${neg(c)}`)}.`, mode: 'num', value: v, why: `${[a, b, c].filter(x => x < 0).length} negative sign${[a, b, c].filter(x => x < 0).length === 1 ? '' : 's'}: ${[a, b, c].filter(x => x < 0).length % 2 ? 'an odd number, so negative' : 'an even number, so positive'}. ${Math.abs(a)} × ${Math.abs(b)} × ${Math.abs(c)} = ${Math.abs(v)}.` };
  }
  const p = a * b;
  return { prompt: `Calculate ${M(`${num(p * c)} ÷ ${neg(c)} ÷ ${neg(b)}`)}.`, mode: 'num', value: a, why: `${num(p * c)} ÷ ${neg(c)} = ${num(p)}, then ${num(p)} ÷ ${neg(b)} = ${num(a)}.` };
}
function signPattern() {
  const b = C.pick([2, 3, 4, 5]);
  const rows = [3, 2, 1, 0, -1, -2];
  const ask = C.pick([-1, -2]);
  return { prompt: `Complete the pattern. What happens to the answer each time, and what does that show about multiplying by a negative number?<table class="dtab">${rows.map(r => `<tr><td>${M(`${num(r)} × ${neg(-b)}`)}</td><td>${r < 0 ? '' : num(r * -b)}</td></tr>`).join('')}</table>`,
    mode: 'none', drawSpace: 10, answerHTML: rows.filter(r => r < 0).map(r => `${num(r)} × ${neg(-b)} = ${num(r * -b)}`).join(', '),
    why: `Each answer goes up by ${b}, so the pattern continues past 0: a negative times a negative is positive.` };
}
WSF.page({
  topic: 'Computation with Integers', outcome: 'MA4-INT-C-01', langKey: 'mmt-int-ws-lang', bank: false,
  translateTopic: 'Integers', defaultCount: 12, statements: STATEMENTS,
  paperTypes: [
    T('basic', 'place-number-line', 'Place an integer on a number line', 'compare-order'),
    T('basic', 'compare-integers', 'Compare integers', 'compare-order'),
    T('basic', 'ordering-integers', 'Order integers', 'compare-order'),
    T('basic', 'thermometer-read', 'Read a thermometer', 'compare-order'),
    T('basic', 'number-line-jump', 'Add and subtract on a number line', 'add-subtract'),
    T('basic', 'combining-signs', 'Add and subtract integers', 'add-subtract'),
    { id: 'p-muldiv-b', level: 'basic', stmt: 'multiply-divide', label: 'Multiply and divide integers', gen: () => mulDiv('basic') },
    T('basic', 'real-world-integers', 'Integer problems in context', 'four-operations'),

    T('expected', 'ordering-integers', 'Order integers', 'compare-order'),
    T('expected', 'combining-signs', 'Add and subtract integers', 'add-subtract'),
    { id: 'p-signs', level: 'expected', stmt: 'multiply-divide', label: 'Why a negative times a negative is positive', gen: signPattern },
    { id: 'p-muldiv-e', level: 'expected', stmt: 'multiply-divide', label: 'Multiply and divide integers (chains)', gen: () => mulDiv('expected') },
    T('expected', 'integer-calculations', 'Integer calculations', 'four-operations'),
    T('expected', 'order-of-operations', 'Order of operations', 'four-operations'),
    T('expected', 'substitution-negatives', 'Substitution with negatives', 'four-operations'),
    T('expected', 'real-world-integers', 'Integer problems in context', 'four-operations'),
    T('expected', 'true-false-integers', 'True or false (reasoning)', 'four-operations'),
    T('expected', 'error-spot', 'Spot the error', 'four-operations'),
    T('expected', 'multi-part-integers', 'Multi-part integer problem', 'four-operations')
  ]
});
