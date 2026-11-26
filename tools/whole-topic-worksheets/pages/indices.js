/* Indices — MA4-IND-C-01. Question types come from the whole-topic quiz
   bank (online-quizzes/stage-4/topic-quiz/banks/indices.js), filed here
   under the three content statements, plus two written for paper. */
(() => {
  const C = WSF.C;
  const { ri, pick, sup } = C;
  const pw = (b, e) => e === 1 ? `${b}` : `${b}${sup(e)}`;
  const M = s => `<span class="m">${s}</span>`;
  const factorise = n => { const f = {}; let d = 2; while (n > 1) { while (n % d === 0) { f[d] = (f[d] || 0) + 1; n /= d; } d++; } return f; };
  const fstr = f => Object.entries(f).map(([b, e]) => pw(b, e)).join(' × ');

  WSF.page({
    topic: 'Indices', outcome: 'MA4-IND-C-01', langKey: 'mmt-ind-ws-lang', bank: true,
    translateTopic: 'Indices', defaultCount: 12, statements: STATEMENTS,
    stmtOf: {
      'b-notation': 'index-laws', 'b-evaluate': 'index-laws', 'b-roots': 'roots',
      'b-prime-factors': 'prime-factors', 'b-multiply': 'index-laws', 'b-divide': 'index-laws', 'b-zero': 'index-laws',
      'e-prime-index': 'prime-factors', 'e-hcf-lcm': 'prime-factors', 'e-estimate-root': 'roots', 'e-order-ops': 'roots',
      'e-power-power': 'index-laws', 'e-alg-multiply': 'index-laws', 'e-alg-divide': 'index-laws',
      'e-mixed-laws': 'index-laws', 'e-zero-alg': 'index-laws', 'e-true-false': 'index-laws'
    },
    order: ['b-notation', 'b-evaluate', 'b-roots', 'b-prime-factors', 'p-factor-tree', 'b-multiply', 'b-divide', 'b-zero',
      'e-prime-index', 'e-hcf-lcm', 'e-estimate-root', 'e-order-ops', 'p-establish', 'e-power-power',
      'e-alg-multiply', 'e-alg-divide', 'e-mixed-laws', 'e-zero-alg', 'e-true-false'],
    paperTypes: [
      { id: 'p-factor-tree', level: 'basic', stmt: 'prime-factors', label: 'Draw a factor tree',
        gen() {
          let n, f;
          do { n = ri(24, 220); f = factorise(n); } while (Object.values(f).reduce((a, b) => a + b, 0) < 3 || Object.keys(f).length < 2 || Object.keys(f).some(p => +p > 13));
          // one way down the tree, splitting off the smallest prime each time
          const steps = []; let m = n, d = 2, done = [];
          while (m > 1) { while (m % d) d++; done.push(d); m /= d; if (m > 1 && !C.isPrime(m)) steps.push(`${done.join(' × ')} × ${m}`); }
          return {
            prompt: `Draw a factor tree for ${M(n)}. Then write ${M(n)} as a product of its prime factors, using index notation.`,
            mode: 'none', drawSpace: 32, drawTag: 'Factor tree',
            answerHTML: M(`${n} = ${fstr(f)}`),
            why: `${n} = ${steps.join(' = ')}${steps.length ? ' = ' : ''}${done.join(' × ')} = ${fstr(f)}`
          };
        } },
      { id: 'p-establish', level: 'expected', stmt: 'index-laws', label: 'Show why an index law works',
        gen() {
          const k = pick(['mul', 'div', 'pow']);
          const b = pick([2, 3, 5, 'a', 'm', 'x', 'y']);
          const run = (e) => Array(e).fill(b).join(' × ');
          if (k === 'mul') {
            const m = ri(2, 5), n = ri(2, 4);
            return { prompt: `Write ${M(`${pw(b, m)} × ${pw(b, n)}`)} in expanded form, then write it as a single power. Use it to explain the index law for multiplying powers.`,
              mode: 'none', drawSpace: 16, answerHTML: M(`(${run(m)}) × (${run(n)}) = ${pw(b, m + n)}`),
              why: `There are ${m} + ${n} = ${m + n} factors of ${b}, so a${sup('m')} × a${sup('n')} = a${sup('m + n')}: keep the base and add the indices.` };
          }
          if (k === 'div') {
            const n = ri(2, 4), m = n + ri(1, 3);
            return { prompt: `Write ${M(`${pw(b, m)} ÷ ${pw(b, n)}`)} as a fraction in expanded form, cancel, then write it as a single power. Use it to explain the index law for dividing powers.`,
              mode: 'none', drawSpace: 20, answerHTML: M(pw(b, m - n)),
              why: `${m} factors of ${b} over ${n} factors of ${b}: ${n} cancel, leaving ${m} − ${n} = ${m - n}. So a${sup('m')} ÷ a${sup('n')} = a${sup('m − n')}.` };
          }
          const m = ri(2, 3), n = ri(2, 3);
          return { prompt: `Write ${M(`(${pw(b, m)})${sup(n)}`)} as ${n} lots of ${M(pw(b, m))} multiplied together, then as a single power. Use it to explain the index law for a power of a power.`,
            mode: 'none', drawSpace: 16, answerHTML: M(`${Array(n).fill(pw(b, m)).join(' × ')} = ${pw(b, m * n)}`),
            why: `${n} groups of ${m} factors is ${m} × ${n} = ${m * n} factors, so (a${sup('m')})${sup('n')} = a${sup('mn')}.` };
        } }
    ]
  });
})();
