/* Ratios and Rates — MA4-RAT-C-01. Quiz types from the whole-topic quiz bank
   (banks/ratios-rates.js) filed under the five content statements, plus a
   distance–time graph to DRAW (the statement says interpret AND construct;
   the quiz can only ask students to read one). */
(() => {
  const C = WSF.C;
  const { ri, pick } = C;

  /* A walk from home, built leg by leg so every corner lands on the grid. */
  function walk(legsWanted, comeBack) {
    for (let tries = 0; tries < 400; tries++) {
      const legs = []; let t = 0, d = 0;
      const away = () => { const dt = pick([5, 10, 15, 20]), s = pick([10, 15, 20, 25]); if (d + s * dt > 400) return false; legs.push({ kind: 'away', dt, s, from: [t, d], to: [t + dt, d + s * dt] }); t += dt; d += s * dt; return true; };
      const stop = () => { const dt = pick([5, 10, 15]); legs.push({ kind: 'stop', dt, s: 0, from: [t, d], to: [t + dt, d] }); t += dt; return true; };
      const home = () => { const opts = [5, 10, 15, 20, 25, 30].filter(dt => d % dt === 0 && d / dt <= 40 && d / dt >= 5); if (!opts.length) return false; const dt = pick(opts); legs.push({ kind: 'home', dt, s: d / dt, from: [t, d], to: [t + dt, 0] }); t += dt; d = 0; return true; };
      let ok = away();
      if (legsWanted >= 2) ok = ok && stop();
      if (legsWanted >= 3) ok = ok && (comeBack ? home() : away());
      if (legsWanted >= 4) ok = ok && (comeBack ? true : stop());
      if (!ok || t > 70 || d > 400) continue;
      if (legs.some(l => l.kind !== 'stop' && (l.to[1] % 25 !== 0 || l.from[1] % 25 !== 0))) continue;
      return { legs, tMax: Math.ceil((t + 5) / 10) * 10, dMax: Math.max(100, Math.ceil((Math.max(...legs.map(l => l.to[1])) + 25) / 50) * 50) };
    }
    return null;
  }
  const said = (l, who) => l.kind === 'away' ? `walks away from home at ${l.s} m/min for ${l.dt} minutes`
    : l.kind === 'stop' ? `stops for ${l.dt} minutes` : `walks straight home at ${l.s} m/min`;
  function dtDiagram(w, blank) {
    const pts = [{ x: 0, y: 0 }].concat(w.legs.map(l => ({ x: l.to[0], y: l.to[1] })));
    return { engine: 'rates-engine', scale: blank ? 1.55 : 1.25, maxH: 520, config: { diagramType: 'distance-time', mode: blank ? 'blank' : 'completed', xLabel: 'Time (minutes)', yLabel: 'Distance from home (m)', xMax: w.tMax, yMax: w.dMax, xStep: 10, yStep: 50, xMinorStep: 5, yMinorStep: 25, points: pts } };
  }
  function drawWalk(n, back) {
    const w = walk(n, back); if (!w) return null;
    const who = pick(['Ava', 'Noah', 'Mia', 'Leo', 'Zara', 'Kai', 'Ruby', 'Omar']);
    const story = w.legs.map((l, i) => (i === 0 ? '' : i === w.legs.length - 1 ? ' and then ' : ', then ') + said(l, who)).join('');
    const corners = [[0, 0]].concat(w.legs.map(l => l.to)).map(p => `(${p[0]}, ${p[1]})`).join(', ');
    return {
      prompt: `${who} ${story}. Draw the distance–time graph of the walk on the axes.`,
      diagram: dtDiagram(w, true), keyDiagram: dtDiagram(w, false), wide: true, noAnswerBox: true, mode: 'none',
      answerHTML: 'The graph joins ' + corners,
      why: w.legs.map(l => l.kind === 'away' ? `${l.s} m/min × ${l.dt} min = ${l.s * l.dt} m further from home` : l.kind === 'stop' ? `a flat line for ${l.dt} minutes` : `back to 0 m in ${l.dt} minutes (${l.s * l.dt} m ÷ ${l.dt} = ${l.s} m/min)`).join('; ') + '.'
    };
  }

  WSF.page({
    topic: 'Ratios and Rates', outcome: 'MA4-RAT-C-01', langKey: 'mmt-rat-ws-lang', bank: true,
    translateTopic: 'Ratios and Rates', defaultCount: 12, statements: STATEMENTS,
    stmtOf: {
      'b-simplify': 'simplify-ratios', 'b-equivalent': 'simplify-ratios', 'b-fraction': 'ratio-problems', 'b-share': 'ratio-problems',
      'b-unit-rate': 'simplify-rates', 'b-use-rate': 'rate-problems', 'b-dt-read': 'distance-time',
      'e-simplify-units': 'simplify-ratios', 'e-share3': 'ratio-problems', 'e-known-part': 'ratio-problems', 'e-difference': 'ratio-problems',
      'e-scale': 'ratio-problems', 'e-convert-rate': 'simplify-rates', 'e-best-buy': 'rate-problems', 'e-sdt': 'rate-problems',
      'e-dt-speed': 'distance-time', 'e-dt-interpret': 'distance-time'
    },
    order: ['b-simplify', 'b-equivalent', 'b-fraction', 'b-share', 'b-unit-rate', 'b-use-rate', 'b-dt-read', 'p-dt-draw-b',
      'e-simplify-units', 'e-share3', 'e-known-part', 'e-difference', 'e-scale', 'e-convert-rate', 'e-best-buy', 'e-sdt',
      'e-dt-speed', 'e-dt-interpret', 'p-dt-draw-e'],
    paperTypes: [
      { id: 'p-dt-draw-b', level: 'basic', stmt: 'distance-time', label: 'Draw a distance–time graph', gen: () => drawWalk(2, false) },
      { id: 'p-dt-draw-e', level: 'expected', stmt: 'distance-time', label: 'Draw a distance–time graph with a return', gen: () => drawWalk(3, true) }
    ]
  });
})();
