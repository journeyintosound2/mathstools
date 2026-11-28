/* 2D Shapes — MA2-2DS-01. BUILT by stage12.py: types from the Revision Generator Stage 2 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.22;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 60); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "2D Shapes", outcome: 'MA2-2DS-01', langKey: 'mmt-s2-2d-shapes-ws-lang', bank: false, noLanguage: true,
  defaultCount: 10, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:15px;line-height:1.4}.opts{font-size:14.2px;gap:2mm 4.5mm}.opt .L{width:5.6mm;height:5.6mm;font-size:11px}.tfRow{font-size:14.2px}.subs{font-size:14.2px}.dtab{font-size:12.6px}.ansLine{font-size:13px;min-height:8.5mm}.ansLine .unit{font-size:15.5px}.keyAns{font-size:15.5px}.item .ix,.item .ieq{font-size:17.5px}.qNum{width:28px;height:23px;font-size:12px}.ablank{height:7.4mm;min-width:26mm}.ablank.sm{min-width:18mm}",
  paperTypes: [
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'basic', 'sides-vertices', "Count sides and vertices", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'basic', 'name-polygon', "Name the polygon", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'basic', 'turned-shape', "Same shape, turned", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'basic', 'name-quadrilateral', "Name the quadrilateral", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'basic', 'parallel-sides', "Parallel sides", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'basic', 'regular-irregular', "Regular or irregular?", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'basic', 'odd-one-out', "Which shape does not belong?", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'basic', 'shape-riddle', "Shape riddles", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'expected', 'sides-vertices', "Count sides and vertices", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'expected', 'name-polygon', "Name the polygon", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'expected', 'turned-shape', "Same shape, turned", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'expected', 'name-quadrilateral', "Name the quadrilateral", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'expected', 'parallel-sides', "Parallel sides", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'expected', 'regular-irregular', "Regular or irregular?", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'expected', 'odd-one-out', "Which shape does not belong?", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_A, 'expected', 'shape-riddle', "Shape riddles", 'features')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_B, 'expected', 'lines-of-symmetry', "How many lines of symmetry?", 'symmetry')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_B, 'expected', 'is-it-symmetry', "Is the dashed line a line of symmetry?", 'symmetry')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_B, 'expected', 'complete-symmetry', "Complete the symmetrical shape", 'symmetry'))
  ]
});
