/* ---- Revision Generator question → worksheet question ----
   The Revision Generator banks (assessment/exam-builder/question-banks) give
   { prompt, diagram:{engine,config}, table, choices, subparts, answer,
   working[] }. Prompts use its own markup ([[frac:a:b]] …), so they go
   through its own renderMathText. The working lines become the key's reason. */
const RG = (() => {
  const RM = v => renderMathText(String(v == null ? '' : v));
  const table = t => !t || !Array.isArray(t.rows) || !t.rows.length ? '' :
    `${t.caption ? `<div class="tcap">${RM(t.caption)}</div>` : ''}<table class="dtab">${t.rows.map((row, r) =>
      `<tr>${row.map((c, i) => (t.headerRow === true && r === 0) || i === 0 ? `<th>${RM(c)}</th>` : `<td>${RM(c)}</td>`).join('')}</tr>`).join('')}</table>`;
  const L = i => `(${'abcdefgh'[i]})`;
  // rough printed width of a table (cells only break between words): too wide for half a page → the card spans the row
  const tableWide = t => {
    if (!t || !Array.isArray(t.rows) || !t.rows.length) return false;
    const plain = v => String(v == null ? '' : v).replace(/\[\[[^\]]*\]\]|<[^>]*>/g, 'xx');
    const cols = Math.max(...t.rows.map(r => r.length));
    let w = 0;
    for (let c = 0; c < cols; c++) w += 15 + 6.6 * Math.max(2, ...t.rows.map(r => Math.max(0, ...plain(r[c]).split(/\s+/).map(x => x.length))));
    return w > 300;
  };
  function correctIndex(choices, answer) {
    const a = String(answer == null ? '' : answer).trim();
    const m = /^\(?([A-F])\)?(?:[\s.:)]|$)/.exec(a);
    if (m && choices.length > 'ABCDEF'.indexOf(m[1])) return 'ABCDEF'.indexOf(m[1]);
    let i = choices.findIndex(c => String(c).trim() === a);
    if (i < 0) i = choices.findIndex(c => a && String(c).trim() && a.includes(String(c).trim()));
    return i;
  }
  /* match each thing on the left to one on the right: two columns of boxes, room between them for the lines */
  const matching = m => !m || !Array.isArray(m.left) || !Array.isArray(m.right) ? '' :
    `<div class="match">${Array.from({ length: Math.max(m.left.length, m.right.length) }, (_, i) =>
      `<span class="mb">${RM(m.left[i] || '')}</span><span class="mgap"><i></i><i></i></span><span class="mb">${RM(m.right[i] || '')}</span>`).join('')}</div>`;
  /* "Factorise 12ak + 18a²k fully." → the instruction, then the maths in its own span, so like
     questions can share one drill card ("Factorise fully:" with four expressions under it) */
  const LEADS = /^(Simplify|Expand and simplify|Expand|Factorise|Evaluate|Solve|Rationalise the denominator of)(\s+fully)?:?\s+(.+?)(\s+fully)?\.?$/;
  function drillPrompt(q) {
    if (q.table || q.diagram || (q.subparts || []).length || (q.choices || []).length) return null;
    const m = LEADS.exec(String(q.prompt || '').trim());
    if (!m) return null;
    const maths = m[3], plain = maths.replace(/\[\[[^\]]*\]\]/g, 'x');
    if (/[,;?]|\b(?!(?:sin|cos|tan|log|ln)\b)[A-Za-z]{3,}/.test(plain) || plain.length > 40) return null;
    return `${m[1]}${m[2] || m[4] ? ' fully' : ''} <span class="m">${RM(maths)}</span>.`;
  }
  function adapt(q) {
    if (!q) return null;
    // one picture in the parts (an area model to complete in part a) is shown with the stem
    const subD = (q.subparts || []).filter(p => p.diagram);
    if (subD.length > 1) return null;
    // a picture with the stem AND one in a part (a container, then four graphs to choose from): both, side by side
    const pair = subD.length && q.diagram ? [q.diagram, subD[0].diagram] : null;
    if (subD.length && !pair) q = Object.assign({}, q, { diagram: subD[0].diagram });
    const out = { prompt: drillPrompt(q) || RM(q.prompt) + table(q.table) + matching(q.matching), mode: 'none', why: (q.working || []).map(RM).join(' &nbsp;·&nbsp; ') };
    const conv = d => {
      const blankAxes = d.config && d.config.blank;   // empty axes to draw on: give them room
      // a number plane is read or drawn on: about 5 mm a unit, never squeezed into a thumbnail
      if (/^plane(-engine)?$/.test(d.engine))
        return d.config && d.config.diagramType === 'options'
          ? { engine: d.engine, config: d.config, scale: 1.0, maxH: 560, minCapMM: 72, fitMM: 76 }     // four small graphs, A to D
          : { engine: d.engine, config: d.config || {}, scale: 1.25, maxH: 520, minCapMM: 66, fitMM: 60 };
      const o = { engine: d.engine, config: d.config || {}, scale: blankAxes ? 1.45 : 1.0, maxH: blankAxes ? 470 : 330 };
      if (d.config && d.config.chartType === 'stem-leaf') o.minLabel = 13;
      // a graph to read values from (an account over time, a scatter plot) is not a thumbnail either
      if (/graph|scatter|line|travel/i.test((d.config && (d.config.diagramType || d.config.chartType)) || '')) { o.maxH = Math.max(o.maxH, 470); o.minCapMM = 62; }
      return o;
    };
    if (pair) { if (pair.every(d => d.engine)) out.diagram = { list: pair.map(conv) }; else return null; }
    else if (q.diagram && q.diagram.engine) out.diagram = conv(q.diagram);
    // answered by drawing on the picture: no answer box on the worksheet (the key still says what to draw)
    if (/^(construct-|draw-hands|draw-transformation|complete-symmetric|plot-point|design-generator)/.test(q.type || '')) out.noAnswerBox = true;
    // the bank asks for no answer space: the answer goes in the table or on the picture
    if (String(q.space || '').toLowerCase() === 'none' && (q.diagram || q.table || q.matching) && !(q.subparts || []).length && !(q.choices || []).length) out.noAnswerBox = true;
    if (q.diagramSpace) { out.drawSpace = 30; }
    // asked to draw or sketch with nothing to draw on: a box to do it in
    else if (!out.diagram) {
      const said = [q.prompt].concat((q.subparts || []).map(p => p.prompt)).join(' ');
      if (/\b(draw|sketch)\b/i.test(said) && !/possible to draw/i.test(said)) out.drawSpace = 46;
    }
    if (Array.isArray(q.choices) && q.choices.length) {
      if (new Set(q.choices.map(c => String(c).trim())).size !== q.choices.length) return null;
      const i = correctIndex(q.choices, q.answer);
      out.options = q.choices.map(RM);
      if (i >= 0) { out.mode = 'mc'; out.correct = i; }
      else out.prompt += `<ol class="subs">${out.options.map((o, k) => `<li><span class="sl">${'ABCDEF'[k]}</span> ${o}</li>`).join('')}</ol>`;
    }
    if (out.mode !== 'mc') out.answerHTML = RM(q.answer);
    if (Array.isArray(q.subparts) && q.subparts.length) {
      // each part gets its own answer line, under the part
      out.subq = q.subparts.map((p, i) => ({ label: p.label || L(i), answer: RM(p.answer),
        html: ' ' + RM(p.prompt) + table(p.table) + (p.choices ? ' ' + p.choices.map((c, k) => `${'ABCDEF'[k]}. ${RM(c)}`).join(' &nbsp; ') : '') }));
      out.answerHTML = out.subq.map(p => `${p.label} ${p.answer}`).join('<br>');
      const w = q.subparts.flatMap(p => p.working || []);
      if (w.length) out.why = w.map(RM).join(' &nbsp;·&nbsp; ');
    }
    out.steps = (q.working || []).length;
    // a proof is written out line by line: always give it working space
    if (!out.subq && out.mode !== 'mc' && /\b(prove|show that)\b/i.test(String(q.prompt))) out.work = true;
    if (tableWide(q.table) || (q.subparts || []).some(p => tableWide(p.table))) out.wide = true;
    out.loc = null; out.topic = q.topic || ''; out.rgType = q.type || '';
    return out;
  }
  /* one worksheet type from one bank type, at one level */
  function type(gen, level, rgId, label, stmt) {
    return { id: `${level === 'basic' ? 'b' : 'e'}-${rgId}`, level, label, stmt,
      gen: () => { for (let t = 0; t < 6; t++) { const q = adapt((gen({ count: 1, allowedTypes: [rgId] }) || [])[0]); if (q) return q; } return null; } };
  }
  return { adapt, type, RM, table };
})();
