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
  function adapt(q) {
    if (!q) return null;
    // one picture in the parts (an area model to complete in part a) is shown with the stem
    const subD = (q.subparts || []).filter(p => p.diagram);
    if (subD.length > 1 || (subD.length && q.diagram)) return null;
    if (subD.length) q = Object.assign({}, q, { diagram: subD[0].diagram });
    const out = { prompt: RM(q.prompt) + table(q.table), mode: 'none', why: (q.working || []).map(RM).join(' &nbsp;·&nbsp; ') };
    if (q.diagram && q.diagram.engine) {
      const blankAxes = q.diagram.config && q.diagram.config.blank;   // empty axes to draw on: give them room
      out.diagram = { engine: q.diagram.engine, config: q.diagram.config || {}, scale: blankAxes ? 1.45 : 1.0, maxH: blankAxes ? 470 : 330 };
    }
    // answered by drawing on the picture: no answer box on the worksheet (the key still says what to draw)
    if (/^(construct-|draw-hands|draw-transformation|complete-symmetric|plot-point|design-generator)/.test(q.type || '')) out.noAnswerBox = true;
    if (q.diagramSpace) { out.drawSpace = 30; }
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
