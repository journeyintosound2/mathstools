/* 3D Objects — MA2-3DS-01. BUILT by stage12.py: types from the Revision Generator Stage 2 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.22;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 60); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "3D Objects", outcome: 'MA2-3DS-01', langKey: 'mmt-s2-3d-objects-ws-lang', bank: false, noLanguage: true,
  defaultCount: 10, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:15px;line-height:1.4}.opts{font-size:14.2px;gap:2mm 4.5mm}.opt .L{width:5.6mm;height:5.6mm;font-size:11px}.tfRow{font-size:14.2px}.subs{font-size:14.2px}.dtab{font-size:12.6px}.ansLine{font-size:13px;min-height:8.5mm}.ansLine .unit{font-size:15.5px}.keyAns{font-size:15.5px}.item .ix,.item .ieq{font-size:17.5px}.qNum{width:28px;height:23px;font-size:12px}.ablank{height:7.4mm;min-width:26mm}.ablank.sm{min-width:18mm}",
  paperTypes: [
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'basic', 'name-object', "Name the 3D object", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'basic', 'faces-edges-vertices', "Count faces, edges and vertices", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'basic', 'flat-curved', "Flat and curved surfaces", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'basic', 'prism-or-pyramid', "Prism or pyramid?", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'basic', 'face-shapes', "What shapes are the faces?", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'basic', 'everyday-objects', "3D objects in the world", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'basic', 'roll-stack-slide', "Roll, stack or slide?", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'basic', 'object-riddle', "3D object riddles", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'basic', 'skeletal-model', "Skeletal models: straws and joiners", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'basic', 'compare-objects', "Compare two 3D objects", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'expected', 'name-object', "Name the 3D object", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'expected', 'faces-edges-vertices', "Count faces, edges and vertices", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'expected', 'flat-curved', "Flat and curved surfaces", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'expected', 'prism-or-pyramid', "Prism or pyramid?", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'expected', 'face-shapes', "What shapes are the faces?", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'expected', 'everyday-objects', "3D objects in the world", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'expected', 'roll-stack-slide', "Roll, stack or slide?", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'expected', 'object-riddle', "3D object riddles", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'expected', 'skeletal-model', "Skeletal models: straws and joiners", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'expected', 'compare-objects', "Compare two 3D objects", 'models')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_A, 'expected', 'net-to-object', "Which object does the net make?", 'representations')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'expected', 'cube-nets', "Which net folds into a cube?", 'representations'))
  ]
});
