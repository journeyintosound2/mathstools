/* 2D Shapes — MA1-2DS-01. BUILT by stage12.py: types from the Revision Generator Stage 1 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.4;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 64); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "2D Shapes", outcome: 'MA1-2DS-01', langKey: 'mmt-s1-2d-shapes-ws-lang', bank: false, noLanguage: true,
  defaultCount: 8, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:17px;line-height:1.42;font-weight:700}.opts{font-size:16px;gap:2.6mm 5mm}.opt .L{width:6.4mm;height:6.4mm;font-size:12px}.tfRow{font-size:16px}.subs{font-size:16px}.dtab{font-size:14px}.ansLine{font-size:14.5px;min-height:10mm}.ansLine .unit{font-size:17px}.keyAns{font-size:17px}.item .ix,.item .ieq{font-size:19px}.qNum{width:30px;height:25px;font-size:13px}.secTitle{font-size:13.5px}.hdrTitle{font-size:17px}.lineLabel{font-size:11.5px}.ablank{height:9mm;min-width:30mm}.ablank.sm{min-width:22mm}.ablank.md{min-width:32mm}.lineBox{height:26px}",
  paperTypes: [
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_A, 'basic', 'name-shape', "Name the shape", 'classify-shapes')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_A, 'basic', 'sides-corners', "Sides and corners", 'classify-shapes')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_A, 'basic', 'find-the-shape', "Find the shape (A, B, C, D)", 'classify-shapes')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_A, 'basic', 'straight-curved', "Straight or curved?", 'classify-shapes')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_A, 'basic', 'odd-one-out', "Which does not belong?", 'classify-shapes')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_B, 'basic', 'fold-symmetry', "Is the fold line a line of symmetry?", 'slides-reflections')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_B, 'basic', 'slide-flip-turn', "Slide, flip or turn?", 'slides-reflections')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_A, 'expected', 'name-shape', "Name the shape", 'classify-shapes')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_A, 'expected', 'sides-corners', "Sides and corners", 'classify-shapes')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_A, 'expected', 'find-the-shape', "Find the shape (A, B, C, D)", 'classify-shapes')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_A, 'expected', 'straight-curved', "Straight or curved?", 'classify-shapes')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_A, 'expected', 'odd-one-out', "Which does not belong?", 'classify-shapes')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_B, 'expected', 'fold-symmetry', "Is the fold line a line of symmetry?", 'slides-reflections')),
  Y(RG.type(G_STAGE_2_TWO_D_SPACE_B, 'expected', 'slide-flip-turn', "Slide, flip or turn?", 'slides-reflections')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_B, 'expected', 'make-a-shape', "Two shapes make a new shape", 'combine-separate')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_B, 'expected', 'quadrilateral-or-not', "Is it a quadrilateral?", 'combine-separate')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_B, 'expected', 'find-quadrilaterals', "Find the quadrilateral", 'combine-separate')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_B, 'expected', 'polygon-name', "Name the polygon by its sides", 'combine-separate')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_B, 'expected', 'shape-clue', "Shape clues", 'combine-separate')),
  Y(RG.type(G_STAGE_1_TWO_D_SPACE_A, 'expected', 'turned-still-same', "Turned but still the same shape", 'quarter-turns'))
  ]
});
