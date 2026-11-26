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
    if ((q.subparts || []).some(p => p.diagram)) return null;
    const out = { prompt: RM(q.prompt) + table(q.table), mode: 'none', why: (q.working || []).map(RM).join(' &nbsp;·&nbsp; ') };
    if (q.diagram && q.diagram.engine) out.diagram = { engine: q.diagram.engine, config: q.diagram.config || {}, scale: 1.0, maxH: 330 };
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
      out.prompt += `<ol class="subs">${q.subparts.map((p, i) => `<li><span class="sl">${p.label || L(i)}</span> ${RM(p.prompt)}${table(p.table)}${p.choices ? ' ' + p.choices.map((c, k) => `${'ABCDEF'[k]}. ${RM(c)}`).join(' &nbsp; ') : ''}</li>`).join('')}</ol>`;
      out.answerHTML = q.subparts.map((p, i) => `${p.label || L(i)} ${RM(p.answer)}`).join('<br>');
      const w = q.subparts.flatMap(p => p.working || []);
      if (w.length) out.why = w.map(RM).join(' &nbsp;·&nbsp; ');
      out.drawSpace = Math.max(out.drawSpace || 0, 8 * q.subparts.length);
    }
    out.loc = null;
    return out;
  }
  /* one worksheet type from one bank type, at one level */
  function type(gen, level, rgId, label, stmt) {
    return { id: `${level === 'basic' ? 'b' : 'e'}-${rgId}`, level, label, stmt,
      gen: () => { for (let t = 0; t < 6; t++) { const q = adapt((gen({ count: 1, allowedTypes: [rgId] }) || [])[0]); if (q) return q; } return null; } };
  }
  return { adapt, type, RM, table };
})();
