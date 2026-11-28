/* 3D Objects — MA1-3DS-01. BUILT by stage12.py: types from the Revision Generator Stage 1 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.4;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 64); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "3D Objects", outcome: 'MA1-3DS-01', langKey: 'mmt-s1-3d-objects-ws-lang', bank: false, noLanguage: true,
  defaultCount: 8, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:17px;line-height:1.42;font-weight:700}.opts{font-size:16px;gap:2.6mm 5mm}.opt .L{width:6.4mm;height:6.4mm;font-size:12px}.tfRow{font-size:16px}.subs{font-size:16px}.dtab{font-size:14px}.ansLine{font-size:14.5px;min-height:10mm}.ansLine .unit{font-size:17px}.keyAns{font-size:17px}.item .ix,.item .ieq{font-size:19px}.qNum{width:30px;height:25px;font-size:13px}.secTitle{font-size:13.5px}.hdrTitle{font-size:17px}.lineLabel{font-size:11.5px}.ablank{height:9mm;min-width:30mm}.ablank.sm{min-width:22mm}.ablank.md{min-width:32mm}.lineBox{height:26px}",
  paperTypes: [
  Y(RG.type(G_STAGE_1_THREE_D_SPACE_A, 'basic', 'name-object', "Name the object", 'recognise-objects')),
  Y(RG.type(G_STAGE_1_THREE_D_SPACE_A, 'basic', 'real-objects', "Objects around us", 'recognise-objects')),
  Y(RG.type(G_STAGE_1_THREE_D_SPACE_A, 'basic', 'roll-or-stack', "Roll or stack?", 'sort-describe')),
  Y(RG.type(G_STAGE_1_THREE_D_SPACE_A, 'basic', 'flat-faces', "How many flat faces?", 'sort-describe')),
  Y(RG.type(G_STAGE_1_THREE_D_SPACE_A, 'expected', 'name-object', "Name the object", 'recognise-objects')),
  Y(RG.type(G_STAGE_1_THREE_D_SPACE_A, 'expected', 'real-objects', "Objects around us", 'recognise-objects')),
  Y(RG.type(G_STAGE_1_THREE_D_SPACE_A, 'expected', 'roll-or-stack', "Roll or stack?", 'sort-describe')),
  Y(RG.type(G_STAGE_1_THREE_D_SPACE_A, 'expected', 'flat-faces', "How many flat faces?", 'sort-describe')),
  Y(RG.type(G_STAGE_1_THREE_D_SPACE_B, 'expected', 'faces-edges-corners', "Faces, edges and corners", 'features')),
  Y(RG.type(G_STAGE_1_THREE_D_SPACE_B, 'expected', 'face-shapes', "What shape are the faces?", 'features')),
  Y(RG.type(G_STAGE_1_THREE_D_SPACE_B, 'expected', 'curved-face-shape', "Flat faces of curved objects", 'features'))
  ]
});
