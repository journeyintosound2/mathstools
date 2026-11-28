/* Length — MA2-GM-02. BUILT by stage12.py: types from the Revision Generator Stage 2 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.22;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 60); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Length", outcome: 'MA2-GM-02', langKey: 'mmt-s2-length-ws-lang', bank: false, noLanguage: true,
  defaultCount: 10, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:15px;line-height:1.4}.opts{font-size:14.2px;gap:2mm 4.5mm}.opt .L{width:5.6mm;height:5.6mm;font-size:11px}.tfRow{font-size:14.2px}.subs{font-size:14.2px}.dtab{font-size:12.6px}.ansLine{font-size:13px;min-height:8.5mm}.ansLine .unit{font-size:15.5px}.keyAns{font-size:15.5px}.item .ix,.item .ieq{font-size:17.5px}.qNum{width:28px;height:23px;font-size:12px}.ablank{height:7.4mm;min-width:26mm}.ablank.sm{min-width:18mm}",
  paperTypes: [
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_A, 'basic', 'ruler-from-zero', "Measure with a ruler", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_A, 'basic', 'ruler-not-zero', "Measure when the object does not start at 0", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_A, 'basic', 'compare-lengths', "How much longer?", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_A, 'basic', 'metres-centimetres', "Metres and centimetres", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_A, 'basic', 'choose-length-unit', "Choose cm or m", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_A, 'basic', 'perimeter-grid', "Perimeter by counting on a grid", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_B, 'basic', 'choose-unit-b', "Choose mm, cm, m or km", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_B, 'basic', 'convert-length', "Convert mm, cm, m and km", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_A, 'expected', 'ruler-from-zero', "Measure with a ruler", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_A, 'expected', 'ruler-not-zero', "Measure when the object does not start at 0", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_A, 'expected', 'compare-lengths', "How much longer?", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_A, 'expected', 'metres-centimetres', "Metres and centimetres", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_A, 'expected', 'choose-length-unit', "Choose cm or m", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_A, 'expected', 'perimeter-grid', "Perimeter by counting on a grid", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_B, 'expected', 'choose-unit-b', "Choose mm, cm, m or km", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_B, 'expected', 'convert-length', "Convert mm, cm, m and km", 'm-cm-mm')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_B, 'expected', 'ruler-mm', "Measure in centimetres and millimetres", 'scaled-instruments')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_B, 'expected', 'perimeter-rectangle', "Perimeter of a rectangle", 'scaled-instruments')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_B, 'expected', 'perimeter-shape', "Perimeter of shapes with labelled sides", 'scaled-instruments')),
  Y(RG.type(G_STAGE_2_GEOMETRIC_MEASURE_B, 'expected', 'same-perimeter', "Same perimeter, different shapes", 'scaled-instruments'))
  ]
});
