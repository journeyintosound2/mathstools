/* Data Analysis — MA4-DAT-C-02. Quiz types from the whole-topic quiz bank
   (banks/data-analysis.js) under the three content statements, plus
   multi-part questions written for paper (all four measures, and the effect
   of a new value at Basic, where the quiz has none). */
(() => {
  const C = WSF.C;
  const { ri, pick, fmt } = C;
  const M = s => `<span class="m">${s}</span>`;
  const list = a => `<span class="dataList">${a.join(', ')}</span>`;
  const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
  const median = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const modes = a => { const f = {}; a.forEach(v => f[v] = (f[v] || 0) + 1); const m = Math.max(...Object.values(f)); return Object.keys(f).filter(k => f[k] === m).map(Number).sort((x, y) => x - y); };
  const range = a => Math.max(...a) - Math.min(...a);

  function allFour(level) {
    for (let t = 0; t < 300; t++) {
      const n = level === 'basic' ? pick([5, 7, 9]) : ri(6, 10);
      const a = Array.from({ length: n }, () => ri(2, level === 'basic' ? 20 : 40));
      const m = mean(a), md = modes(a);
      if (md.length !== 1 || md[0] === median(a)) continue;
      if (level === 'basic' && !Number.isInteger(m)) continue;
      const ctx = pick(['quiz scores', 'goals scored in each game', 'minutes spent reading', 'points in each round', 'temperatures (°C)']);
      const s = a.slice().sort((x, y) => x - y);
      return {
        prompt: `Here are some ${ctx}:${list(a)}Find the mean, median, mode and range.${level === 'expected' ? ' Give the mean to 1 decimal place where needed.' : ''}`,
        mode: 'none', drawSpace: 14,
        answerHTML: `mean ${fmt(Math.round(m * 10) / 10, 1)} · median ${fmt(median(a))} · mode ${md[0]} · range ${range(a)}`,
        why: `In order: ${s.join(', ')}. Mean = ${a.reduce((x, y) => x + y, 0)} ÷ ${n}; median is the middle; mode is most common; range = ${s[n - 1]} − ${s[0]}.`
      };
    }
  }
  function effectBasic() {
    for (let t = 0; t < 300; t++) {
      const a = Array.from({ length: 5 }, () => ri(4, 16));
      const m = mean(a); if (!Number.isInteger(m)) continue;
      const kind = pick(['up', 'down', 'same']);
      const v = kind === 'same' ? m : kind === 'up' ? m + ri(4, 10) : Math.max(0, m - ri(4, 10));
      if (kind !== 'same' && v === m) continue;
      const nm = mean(a.concat([v]));
      return {
        prompt: `The mean of ${list(a)}is ${m}. A new value, ${M(v)}, is added. Does the mean go up, go down, or stay the same? Explain.`,
        mode: 'mc', options: ['It goes up', 'It goes down', 'It stays the same'], correct: kind === 'up' ? 0 : kind === 'down' ? 1 : 2, keepOrder: true,
        why: `${v} is ${kind === 'up' ? 'more than' : kind === 'down' ? 'less than' : 'equal to'} the mean, so the new mean is ${fmt(Math.round(nm * 100) / 100, 2)}.`
      };
    }
  }

  WSF.page({
    topic: 'Data Analysis', outcome: 'MA4-DAT-C-02', langKey: 'mmt-dat2-ws-lang', bank: true,
    translateTopic: 'Data', defaultCount: 12, statements: STATEMENTS,
    stmtOf: {
      'b-mean': 'measures-of-centre', 'b-median': 'measures-of-centre', 'b-mode': 'measures-of-centre', 'b-range': 'measures-of-centre',
      'b-dot-stats': 'analyse', 'b-mean-context': 'measures-of-centre',
      'e-median-even': 'measures-of-centre', 'e-mean-dp': 'measures-of-centre', 'e-freq-table': 'analyse', 'e-stem-stats': 'analyse',
      'e-missing': 'measures-of-centre', 'e-outlier': 'effect-of-points', 'e-effect': 'effect-of-points', 'e-shape': 'analyse',
      'e-compare': 'analyse', 'e-choose-measure': 'analyse'
    },
    order: ['b-mean', 'b-median', 'b-mode', 'b-range', 'p-four-b', 'b-mean-context', 'p-effect-b', 'b-dot-stats',
      'e-median-even', 'e-mean-dp', 'p-four-e', 'e-missing', 'e-outlier', 'e-effect', 'e-freq-table', 'e-stem-stats', 'e-shape', 'e-compare', 'e-choose-measure'],
    paperTypes: [
      { id: 'p-four-b', level: 'basic', stmt: 'measures-of-centre', label: 'Mean, median, mode and range together', gen: () => allFour('basic') },
      { id: 'p-effect-b', level: 'basic', stmt: 'effect-of-points', label: 'Effect of adding a value on the mean', gen: effectBasic },
      { id: 'p-four-e', level: 'expected', stmt: 'measures-of-centre', label: 'Mean, median, mode and range together', gen: () => allFour('expected') }
    ]
  });
})();
