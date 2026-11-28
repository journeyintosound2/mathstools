/* Length — MA1-GM-02. BUILT by stage12.py: types from the Revision Generator Stage 1 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.4;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 64); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Length", outcome: 'MA1-GM-02', langKey: 'mmt-s1-length-ws-lang', bank: false, noLanguage: true,
  defaultCount: 8, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:17px;line-height:1.42;font-weight:700}.opts{font-size:16px;gap:2.6mm 5mm}.opt .L{width:6.4mm;height:6.4mm;font-size:12px}.tfRow{font-size:16px}.subs{font-size:16px}.dtab{font-size:14px}.ansLine{font-size:14.5px;min-height:10mm}.ansLine .unit{font-size:17px}.keyAns{font-size:17px}.item .ix,.item .ieq{font-size:19px}.qNum{width:30px;height:25px;font-size:13px}.secTitle{font-size:13.5px}.hdrTitle{font-size:17px}.lineLabel{font-size:11.5px}.ablank{height:9mm;min-width:30mm}.ablank.sm{min-width:22mm}.ablank.md{min-width:32mm}.lineBox{height:26px}",
  paperTypes: [
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'basic', 'measure-cubes', "Measure with cubes", 'measure-informal')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'basic', 'measure-paperclips', "Measure with paperclips", 'measure-informal')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'basic', 'same-unit', "Why use the same unit?", 'measure-informal')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'basic', 'longer-shorter', "Longer or shorter?", 'compare-informal')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'basic', 'how-much-longer', "How much longer?", 'compare-informal')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'expected', 'measure-cubes', "Measure with cubes", 'measure-informal')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'expected', 'measure-paperclips', "Measure with paperclips", 'measure-informal')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'expected', 'same-unit', "Why use the same unit?", 'measure-informal')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'expected', 'longer-shorter', "Longer or shorter?", 'compare-informal')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'expected', 'how-much-longer', "How much longer?", 'compare-informal')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'expected', 'order-lengths', "Order lengths", 'order-lengths')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_B, 'expected', 'bigger-unit', "Bigger unit, fewer units", 'order-lengths')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_B, 'expected', 'ruler-cm', "Measure in centimetres", 'formal-units')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_B, 'expected', 'm-or-cm', "Metres or centimetres?", 'formal-units')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_B, 'expected', 'estimate-length', "Best estimate", 'formal-units')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_B, 'expected', 'metre-facts', "Metres and centimetres", 'formal-units')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_B, 'expected', 'length-story', "Length stories", 'formal-units'))
  ]
});
