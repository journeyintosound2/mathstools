/* Data Classification and Visualisation — MA4-DAT-C-01. Quiz types from the
   whole-topic quiz bank (banks/data-visualisation.js) under the three content
   statements, plus displays to CONSTRUCT on blank axes (the statement says
   "display data"; the quiz can only ask students to read displays). The
   blank axes and the key's completed graph are the same statistics engine
   drawing, with and without `blank: true`. */
(() => {
  const C = WSF.C;
  const { ri, pick } = C;
  const ST = (config, scale = 1.0, maxH = 300) => ({ engine: 'statistics-engine', config, scale, maxH });
  const tab = (head, rows) => `<table class="dtab"><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;

  function column() {
    const ctx = pick([
      { t: 'Favourite sport', x: 'Sport', cats: ['Soccer', 'Netball', 'Cricket', 'Swimming', 'AFL'] },
      { t: 'How students travel to school', x: 'Transport', cats: ['Walk', 'Bus', 'Car', 'Bike', 'Train'] },
      { t: 'Pets owned', x: 'Pet', cats: ['Dog', 'Cat', 'Fish', 'Bird', 'None'] },
      { t: 'Favourite fruit', x: 'Fruit', cats: ['Apple', 'Banana', 'Mango', 'Grapes'] }]);
    const cats = ctx.cats.slice(0, Math.min(ctx.cats.length, pick([4, 5])));
    const vals = cats.map(() => ri(1, 10));
    const cfg = { chartType: 'column', title: ctx.t, xLabel: ctx.x, yLabel: 'Number of students', categories: cats, values: vals, yStep: 2, yMax: 12 };
    return {
      prompt: `A class was surveyed about their ${ctx.t.toLowerCase()}. Draw a column graph of the results.${tab([ctx.x].concat(cats), [['Students'].concat(vals)])}`,
      diagram: ST(Object.assign({ blank: true }, cfg), 1.45, 470), keyDiagram: ST(cfg, 1.45, 470), mode: 'none', noAnswerBox: true, wide: true,
      answerHTML: 'Column heights ' + vals.join(', '),
      why: 'One column for each category, the same width with gaps between them, each as tall as its frequency on the vertical axis.'
    };
  }
  function dotPlot() {
    const ctx = pick([['Goals scored in each game', 0, 6], ['Siblings each student has', 0, 5], ['Books read this term', 1, 8], ['Pets in each household', 0, 4]]);
    const n = ri(12, 16), data = Array.from({ length: n }, () => ri(ctx[1], ctx[2]));
    const cfg = { chartType: 'dot-plot', data, min: ctx[1], max: ctx[2], xLabel: ctx[0] };
    return {
      prompt: `Draw a dot plot of this data (${ctx[0].toLowerCase()}):<span class="dataList">${data.join(', ')}</span>`,
      diagram: ST(Object.assign({ blank: true }, cfg), 1.45, 470), keyDiagram: ST(cfg, 1.45, 470), mode: 'none', noAnswerBox: true,
      answerHTML: `${n} dots in total`, why: 'One dot above the number line for each value; stack the dots for values that repeat.'
    };
  }
  function stemLeaf() {
    const ctx = pick(['Ages of people at a gym class', 'Test marks out of 50', 'Minutes spent on homework', 'Heights of seedlings (mm)']);
    const lo = ri(1, 3), n = ri(12, 16);
    const data = Array.from({ length: n }, () => ri(lo * 10, (lo + 3) * 10 + 9));
    const sorted = data.slice().sort((a, b) => a - b);
    const rows = []; for (let s = Math.floor(sorted[0] / 10); s <= Math.floor(sorted[n - 1] / 10); s++) rows.push({ stem: s, leaves: sorted.filter(d => Math.floor(d / 10) === s).map(d => d % 10) });
    const key = `${rows[0].stem} | ${rows[0].leaves[0] ?? 3} = ${rows[0].stem}${rows[0].leaves[0] ?? 3}`;
    return {
      prompt: `Draw an ordered stem-and-leaf plot of this data (${ctx.toLowerCase()}). Include a key.<span class="dataList">${data.join(', ')}</span>`,
      mode: 'none', drawSpace: 34, noAnswerBox: true, keyDiagram: ST({ chartType: 'stem-leaf', rows, key }),
      answerHTML: `Stems ${rows[0].stem} to ${rows[rows.length - 1].stem}`, why: 'Tens digits are the stems, units digits the leaves, written in order from smallest to largest.'
    };
  }
  function histogram() {
    const ctx = pick([['Height (cm)', 140, 5], ['Time (seconds)', 10, 5], ['Mass (kg)', 30, 10], ['Score', 0, 10]]);
    const bins = Array.from({ length: 5 }, (_, i) => ({ lo: ctx[1] + i * ctx[2], hi: ctx[1] + (i + 1) * ctx[2], count: ri(1, 9) }));
    const cfg = { chartType: 'histogram', bins, xLabel: ctx[0], yLabel: 'Frequency' };
    return {
      prompt: `Draw a histogram of this grouped data.${tab(['Class', 'Frequency'], bins.map(b => [`${b.lo} to less than ${b.hi}`, b.count]))}`,
      diagram: ST(Object.assign({ blank: true }, cfg), 1.45, 470), keyDiagram: ST(cfg, 1.45, 470), mode: 'none', noAnswerBox: true, wide: true,
      answerHTML: 'Column heights ' + bins.map(b => b.count).join(', '),
      why: 'In a histogram the columns touch: each class interval is one column, as tall as its frequency.'
    };
  }

  WSF.page({
    topic: 'Data Classification and Visualisation', outcome: 'MA4-DAT-C-01', langKey: 'mmt-dat1-ws-lang', bank: true,
    translateTopic: 'Data', defaultCount: 12, statements: STATEMENTS,
    stmtOf: {
      'b-cat-num': 'classify', 'b-freq': 'display', 'b-column': 'interpret', 'b-dot-plot': 'interpret', 'b-pictogram': 'interpret', 'b-line': 'interpret',
      'e-classify': 'classify', 'e-census-sample': 'classify', 'e-stem-leaf': 'interpret', 'e-histogram': 'interpret',
      'e-sector': 'interpret', 'e-divided-bar': 'interpret', 'e-choose': 'display', 'e-misleading': 'interpret'
    },
    order: ['b-cat-num', 'b-freq', 'p-column', 'p-dot', 'b-column', 'b-dot-plot', 'b-pictogram', 'b-line',
      'e-classify', 'e-census-sample', 'e-choose', 'p-stem', 'p-hist', 'e-stem-leaf', 'e-histogram', 'e-sector', 'e-divided-bar', 'e-misleading'],
    paperTypes: [
      { id: 'p-column', level: 'basic', stmt: 'display', label: 'Draw a column graph', gen: column },
      { id: 'p-dot', level: 'basic', stmt: 'display', label: 'Draw a dot plot', gen: dotPlot },
      { id: 'p-stem', level: 'expected', stmt: 'display', label: 'Draw a stem-and-leaf plot', gen: stemLeaf },
      { id: 'p-hist', level: 'expected', stmt: 'display', label: 'Draw a histogram', gen: histogram }
    ]
  });
})();
