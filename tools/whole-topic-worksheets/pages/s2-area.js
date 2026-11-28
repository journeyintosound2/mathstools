/* Area — MA2-2DS-03. BUILT by stage12.py: types from the Revision Generator Stage 2 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.22;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 60); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Area", outcome: 'MA2-2DS-03', langKey: 'mmt-s2-area-ws-lang', bank: false, noLanguage: true,
  defaultCount: 10, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:15px;line-height:1.4}.opts{font-size:14.2px;gap:2mm 4.5mm}.opt .L{width:5.6mm;height:5.6mm;font-size:11px}.tfRow{font-size:14.2px}.subs{font-size:14.2px}.dtab{font-size:12.6px}.ansLine{font-size:13px;min-height:8.5mm}.ansLine .unit{font-size:15.5px}.keyAns{font-size:15.5px}.item .ix,.item .ieq{font-size:17.5px}.qNum{width:28px;height:23px;font-size:12px}.ablank{height:7.4mm;min-width:26mm}.ablank.sm{min-width:18mm}",
  paperTypes: [
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_B, 'basic', 'area-cm2', "Area in square centimetres", 'square-centimetres')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_B, 'basic', 'rectangle-area-cm2', "Area of a rectangle: rows \u00d7 columns", 'square-centimetres')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_B, 'basic', 'choose-area-unit', "Choose cm\u00b2 or m\u00b2", 'square-metres')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_B, 'basic', 'estimate-m2', "Estimate in square metres", 'square-metres')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_B, 'expected', 'area-cm2', "Area in square centimetres", 'square-centimetres')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_B, 'expected', 'rectangle-area-cm2', "Area of a rectangle: rows \u00d7 columns", 'square-centimetres')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_B, 'expected', 'choose-area-unit', "Choose cm\u00b2 or m\u00b2", 'square-metres')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_B, 'expected', 'estimate-m2', "Estimate in square metres", 'square-metres')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'expected', 'count-squares', "Area by counting squares", 'grid-structure')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'expected', 'half-squares', "Area with half squares", 'grid-structure')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'expected', 'rows-of-squares', "Area of a rectangle in rows", 'grid-structure')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'expected', 'compare-areas', "Which shape has the bigger area?", 'compare-surfaces')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_B, 'expected', 'same-area', "Same area, different shapes", 'compare-surfaces'))
  ]
});
