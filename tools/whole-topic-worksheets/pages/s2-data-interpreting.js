/* Reading Tables and Graphs — MA2-DATA-02. BUILT by stage12.py: types from the Revision Generator Stage 2 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.22;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 60); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Reading Tables and Graphs", outcome: 'MA2-DATA-02', langKey: 'mmt-s2-data-interpreting-ws-lang', bank: false, noLanguage: true,
  defaultCount: 10, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:15px;line-height:1.4}.opts{font-size:14.2px;gap:2mm 4.5mm}.opt .L{width:5.6mm;height:5.6mm;font-size:11px}.tfRow{font-size:14.2px}.subs{font-size:14.2px}.dtab{font-size:12.6px}.ansLine{font-size:13px;min-height:8.5mm}.ansLine .unit{font-size:15.5px}.keyAns{font-size:15.5px}.item .ix,.item .ieq{font-size:17.5px}.qNum{width:28px;height:23px;font-size:12px}.ablank{height:7.4mm;min-width:26mm}.ablank.sm{min-width:18mm}",
  paperTypes: [
  Y(RG.type(G_STAGE_2_DATA_A, 'basic', 'read-tally', "Read a tally chart", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_A, 'basic', 'read-column-graph', "Read a column graph", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_A, 'basic', 'compare-column-graph', "Most, least and how many more", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_A, 'basic', 'read-pictogram', "Read a pictogram (one symbol = one)", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_A, 'basic', 'read-dot-plot', "Read a dot plot", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_A, 'basic', 'read-table', "Read a table", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_B, 'basic', 'true-false', "Is the statement true?", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_B, 'basic', 'compare-groups', "Compare two classes", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_B, 'basic', 'table-to-graph', "Which graph matches the table?", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_B, 'basic', 'dot-plot-compare', "Dot plots: most, fewest, how many", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_A, 'expected', 'read-tally', "Read a tally chart", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_A, 'expected', 'read-column-graph', "Read a column graph", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_A, 'expected', 'compare-column-graph', "Most, least and how many more", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_A, 'expected', 'read-pictogram', "Read a pictogram (one symbol = one)", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_A, 'expected', 'read-dot-plot', "Read a dot plot", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_A, 'expected', 'read-table', "Read a table", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_B, 'expected', 'true-false', "Is the statement true?", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_B, 'expected', 'compare-groups', "Compare two classes", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_B, 'expected', 'table-to-graph', "Which graph matches the table?", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_B, 'expected', 'dot-plot-compare', "Dot plots: most, fewest, how many", 'interpret-compare')),
  Y(RG.type(G_STAGE_2_DATA_B, 'expected', 'scale-column-read', "Read a column graph with a scale of 2, 5 or 10", 'many-to-one')),
  Y(RG.type(G_STAGE_2_DATA_B, 'expected', 'scale-compare', "Compare using a scale", 'many-to-one')),
  Y(RG.type(G_STAGE_2_DATA_B, 'expected', 'pictogram-key', "Pictograms with a key", 'many-to-one'))
  ]
});
