/* Linear Relationships — MA4-LIN-C-01. Quiz types from the whole-topic quiz
   bank (banks/linear-relationships.js) under the three content statements,
   plus two written for paper: complete a table and DRAW the line, and solve
   an equation by drawing its graph. */
(() => {
  const C = WSF.C;
  const { ri, pick, MINUS } = C;
  const n = v => v < 0 ? MINUS + Math.abs(v) : String(v);
  const M = s => `<span class="m">${s}</span>`;
  const rule = (m, b) => {
    const mx = m === 1 ? 'x' : m === -1 ? MINUS + 'x' : `${n(m)}x`;
    return `y = ${mx}${b === 0 ? '' : b > 0 ? ` + ${b}` : ` ${MINUS} ${Math.abs(b)}`}`;
  };
  const tableHTML = (xs, ys) => `<table class="dtab"><tr><th>${M('x')}</th>${xs.map(x => `<td>${n(x)}</td>`).join('')}</tr><tr><th>${M('y')}</th>${ys.map(y => y == null ? '<td class="blank"></td>' : `<td>${n(y)}</td>`).join('')}</tr></table>`;

  function drawLine(level) {
    for (let tries = 0; tries < 200; tries++) {
      const m = level === 'basic' ? ri(1, 3) : pick([-3, -2, -1, 1, 2, 3]);
      const b = level === 'basic' ? ri(0, 4) : ri(-4, 4);
      const xs = level === 'basic' ? [0, 1, 2, 3, 4] : [-2, -1, 0, 1, 2];
      const ys = xs.map(x => m * x + b);
      const yMin = Math.min(0, ...ys) - 1, yMax = Math.max(...ys) + 1;
      if (yMax - yMin > 17 || (level === 'basic' && Math.min(...ys) < 0)) continue;
      const g = { xMin: level === 'basic' ? 0 : -3, xMax: level === 'basic' ? 5 : 3, yMin: level === 'basic' ? 0 : yMin, yMax, cell: 30 };
      return {
        prompt: `Complete the table of values for ${M(rule(m, b))}. Plot the points and draw the line.${tableHTML(xs, xs.map(() => null))}`,
        diagram: { grid: g }, keyDiagram: { grid: Object.assign({}, g, { lines: [{ m, b, label: rule(m, b) }], points: xs.map((x, i) => ({ x, y: ys[i] })) }) },
        mode: 'none', noAnswerBox: true,
        answerHTML: tableHTML(xs, ys),
        why: `Substitute each x: ${xs.slice(0, 2).map((x, i) => `x = ${n(x)} gives y = ${n(ys[i])}`).join(', ')}, and so on. The points lie on one straight line.`
      };
    }
  }
  function solveByDrawing() {
    for (let tries = 0; tries < 200; tries++) {
      const m = pick([1, 2, 3, -1, -2]), b = ri(-3, 4), x = pick([-2, -1, 1, 2, 3]), c = m * x + b;
      if (Math.abs(c) > 8 || c === b) continue;
      const xs = [-2, -1, 0, 1, 2, 3], ys = xs.map(v => m * v + b);
      const yMin = Math.min(...ys, c) - 1, yMax = Math.max(...ys, c) + 1;
      if (yMax - yMin > 16) continue;
      const lhs = rule(m, b).replace(/^y = /, '');
      const g = { xMin: -3, xMax: 4, yMin, yMax, cell: 28 };
      return {
        prompt: `Draw the graph of ${M(rule(m, b))} and the line ${M(`y = ${n(c)}`)}. Use your graph to solve ${M(`${lhs} = ${n(c)}`)}.`,
        diagram: { grid: g }, keyDiagram: { grid: Object.assign({}, g, { lines: [{ m, b, label: rule(m, b) }, { m: 0, b: c, label: `y = ${n(c)}`, color: '#1d4ed8' }], points: [{ x, y: c, color: '#16a34a', label: `(${n(x)}, ${n(c)})` }] }) },
        mode: 'none', answerHTML: M(`x = ${n(x)}`),
        why: `The lines meet at (${n(x)}, ${n(c)}), so x = ${n(x)}. Check: ${lhs.replace(/x/, `(${n(x)})`)} = ${n(c)}.`
      };
    }
  }

  /* Plot three corners in all four quadrants and find the fourth. */
  function fourthVertex() {
    for (let t = 0; t < 300; t++) {
      const shape = pick(['rectangle', 'square', 'parallelogram']);
      const x1 = ri(-5, 1), y1 = ri(-5, 1), w = ri(3, 6), h = shape === 'square' ? w : ri(2, 5), s = shape === 'parallelogram' ? pick([-2, -1, 1, 2]) : 0;
      const P = [[x1, y1], [x1 + w, y1], [x1 + w + s, y1 + h], [x1 + s, y1 + h]];
      if (P.some(([x, y]) => Math.abs(x) > 6 || Math.abs(y) > 6)) continue;
      if (!(P.some(([x, y]) => x < 0) && P.some(([x, y]) => x > 0) && P.some(([x, y]) => y < 0) && P.some(([x, y]) => y > 0))) continue;
      const miss = ri(0, 3), names = ['A', 'B', 'C', 'D'];
      const given = P.map((p, i) => i === miss ? null : `${names[i]}${M(`(${n(p[0])}, ${n(p[1])})`)}`).filter(Boolean).join(', ');
      const g = { xMin: -6, xMax: 6, yMin: -6, yMax: 6, cell: 22, unitMM: 4.6 };
      return {
        prompt: `Plot ${given}. Find ${names[miss]} so that ABCD is a ${shape}, and plot it.`,
        diagram: { grid: g }, keyDiagram: { grid: Object.assign({}, g, { points: P.map((p, i) => ({ x: p[0], y: p[1], label: names[i], color: i === miss ? '#16a34a' : '#1d4ed8' })) }) },
        mode: 'none', answerHTML: `${names[miss]}${M(`(${n(P[miss][0])}, ${n(P[miss][1])})`)}`,
        why: `Opposite sides of a ${shape} are parallel and equal, so ${names[miss]} is found by moving the same steps across and up as the opposite side.`
      };
    }
  }

  WSF.page({
    topic: 'Linear Relationships', outcome: 'MA4-LIN-C-01', langKey: 'mmt-lin-ws-lang', bank: true,
    translateTopic: 'Linear Relationships', defaultCount: 12, statements: STATEMENTS,
    stmtOf: {
      'b-read-point': 'plot-points', 'b-plot-point': 'plot-points', 'b-quadrant': 'plot-points',
      'b-table': 'plot-linear', 'b-rule-match': 'plot-linear', 'b-on-line': 'plot-linear',
      'e-plot-on-line': 'plot-linear', 'e-rule-from-table': 'plot-linear', 'e-rule-from-graph': 'plot-linear',
      'e-solve-graph': 'graphical-solutions', 'e-intersect': 'graphical-solutions', 'e-real-life': 'plot-linear', 'e-pattern': 'plot-linear'
    },
    order: ['b-read-point', 'b-plot-point', 'b-quadrant', 'b-table', 'b-rule-match', 'b-on-line', 'p-draw-b', 'p-solve-b',
      'e-plot-on-line', 'e-rule-from-table', 'e-rule-from-graph', 'e-pattern', 'e-real-life', 'p-vertex', 'p-draw-e', 'e-solve-graph', 'e-intersect', 'p-solve-e'],
    paperTypes: [
      { id: 'p-draw-b', level: 'basic', stmt: 'plot-linear', label: 'Complete a table and draw the line', gen: () => drawLine('basic') },
      { id: 'p-solve-b', level: 'basic', stmt: 'graphical-solutions', label: 'Solve an equation by drawing graphs', gen: solveByDrawing },
      { id: 'p-vertex', level: 'expected', stmt: 'plot-points', label: 'Plot points and find the fourth corner', gen: fourthVertex },
      { id: 'p-draw-e', level: 'expected', stmt: 'plot-linear', label: 'Complete a table and draw the line (all quadrants)', gen: () => drawLine('expected') },
      { id: 'p-solve-e', level: 'expected', stmt: 'graphical-solutions', label: 'Solve an equation by drawing graphs', gen: solveByDrawing }
    ]
  });
})();
