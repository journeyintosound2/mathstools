/* Volume — MA4-VOL-C-01. Quiz types from the whole-topic quiz bank
   (banks/volume.js) under the four content statements, plus views to DRAW
   (the quiz can only ask which drawing is right) at both levels. The views
   follow the quiz bank's own rules (copied from banks/volume.js). */
(() => {
  const C = WSF.C;
  const { ri, pick } = C;
  const S = (config, scale = 1.0, maxH = 300) => ({ engine: 'solids-engine', config, scale, maxH });

  /* ---------- views of a stack of cubes — copied from banks/volume.js ---------- */
  function viewsOf(heights) {
    const rows = heights.length, cols = Math.max(...heights.map(r => r.length));
    const front = [], side = [], top = [];
    for (let c = 0; c < cols; c++) { const h = Math.max(...heights.map(r => r[c] || 0)); for (let z = 0; z < h; z++) front.push([c, z]); }
    for (let r = 0; r < rows; r++) { const h = Math.max(...heights[r]); for (let z = 0; z < h; z++) side.push([r, z]); }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if ((heights[r][c] || 0) > 0) top.push([c, r]);
    return { front, side, top };
  }
  const ck = cells => cells.map(c => c.join(',')).sort().join(';');
  function randomStack() {
    for (;;) {
      const rows = pick([2, 2, 3]), cols = pick([2, 3, 3]);
      const heights = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, () => (r === 0 ? ri(1, 3) : ri(0, 3))));
      const v = viewsOf(heights);
      if (new Set([ck(v.front), ck(v.side), ck(v.top)]).size < 3) continue;
      let ok = true;
      for (let r = 1; r < rows; r++) for (let c = 0; c < cols; c++) { if (heights[r][c] > 0 && heights[r][c] < heights[r - 1][c]) ok = false; if (heights[r][c] === 0 && heights[r - 1][c] === 0) ok = false; }
      if (ok && Math.max(...heights.flat()) >= 2) return heights;
    }
  }
  const count = h => h.flat().reduce((a, b) => a + b, 0);

  function drawViews(level) {
    const heights = randomStack(), v = viewsOf(heights);
    const which = level === 'basic' ? [pick(['top', 'front'])] : ['top', 'front', 'side'];
    const name = { top: 'Top', front: 'Front', side: 'Side (from the right)' };
    return {
      prompt: level === 'basic'
        ? `This solid is made from ${count(heights)} cubes. On the grid, draw its view from the <b>${which[0]}</b>.`
        : `This solid is made from ${count(heights)} cubes. On the grid, draw its <b>top</b>, <b>front</b> and <b>side</b> (from the right) views.`,
      diagram: S({ diagramType: 'stack-views', heights, options: [] }, 0.95, 230),
      keyDiagram: S({ diagramType: 'views', options: which.map(w => ({ label: name[w], cells: v[w] })) }, 0.9, 200),
      mode: 'none', drawSpace: level === 'basic' ? 24 : 32, grid5: true, noAnswerBox: true, wide: level !== 'basic',
      answerHTML: which.map(w => `${name[w]}: ${v[w].length} squares`).join(' · '),
      why: 'From the top you see one square for every column of cubes; from the front each column shows its tallest stack; from the right the front row is on your left.'
    };
  }

  WSF.page({
    topic: 'Volume', outcome: 'MA4-VOL-C-01', langKey: 'mmt-vol-ws-lang', bank: true,
    translateTopic: 'Volume', defaultCount: 12, statements: STATEMENTS,
    stmtOf: {
      'b-cubes': 'prisms', 'b-rect-prism': 'prisms', 'b-v-ah': 'prisms', 'b-capacity-units': 'units', 'b-vol-cap': 'units',
      'b-views': 'views', 'b-prism': 'prisms',
      'e-tri-prism': 'prisms', 'e-trap-prism': 'prisms', 'e-composite': 'prisms', 'e-cylinder': 'cylinder',
      'e-missing': 'prisms', 'e-capacity': 'units', 'e-units': 'units'
    },
    order: ['b-views', 'p-views-b', 'b-prism', 'b-cubes', 'b-rect-prism', 'b-v-ah', 'b-capacity-units', 'b-vol-cap',
      'p-views-e', 'e-tri-prism', 'e-trap-prism', 'e-composite', 'e-cylinder', 'e-missing', 'e-units', 'e-capacity'],
    paperTypes: [
      { id: 'p-views-b', level: 'basic', stmt: 'views', label: 'Draw a view of a solid', gen: () => drawViews('basic') },
      { id: 'p-views-e', level: 'expected', stmt: 'views', label: 'Draw the top, front and side views', gen: () => drawViews('expected') }
    ]
  });
})();
