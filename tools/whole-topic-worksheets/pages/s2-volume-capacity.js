/* Capacity and Volume — MA2-3DS-02. BUILT by stage12.py: types from the Revision Generator Stage 2 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.22;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 60); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Capacity and Volume", outcome: 'MA2-3DS-02', langKey: 'mmt-s2-volume-capacity-ws-lang', bank: false, noLanguage: true,
  defaultCount: 10, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:15px;line-height:1.4}.opts{font-size:14.2px;gap:2mm 4.5mm}.opt .L{width:5.6mm;height:5.6mm;font-size:11px}.tfRow{font-size:14.2px}.subs{font-size:14.2px}.dtab{font-size:12.6px}.ansLine{font-size:13px;min-height:8.5mm}.ansLine .unit{font-size:15.5px}.keyAns{font-size:15.5px}.item .ix,.item .ieq{font-size:17.5px}.qNum{width:28px;height:23px;font-size:12px}.ablank{height:7.4mm;min-width:26mm}.ablank.sm{min-width:18mm}",
  paperTypes: [
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'basic', 'litres-millilitres', "Litres and millilitres", 'litres')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'basic', 'choose-capacity-unit', "Choose L or mL", 'litres')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'basic', 'capacity-problem', "Capacity problems", 'litres')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'basic', 'count-cubes', "Volume by counting cubes", 'metric-volume')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'basic', 'layers', "Volume in layers", 'metric-volume')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'basic', 'compare-volume', "Which has the bigger volume?", 'metric-volume')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'expected', 'litres-millilitres', "Litres and millilitres", 'litres')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'expected', 'choose-capacity-unit', "Choose L or mL", 'litres')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'expected', 'capacity-problem', "Capacity problems", 'litres')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'expected', 'count-cubes', "Volume by counting cubes", 'metric-volume')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'expected', 'layers', "Volume in layers", 'metric-volume')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'expected', 'compare-volume', "Which has the bigger volume?", 'metric-volume')),
  Y(RG.type(G_STAGE_2_THREE_D_SPACE_B, 'expected', 'read-jug', "Read a measuring jug", 'scaled-capacity'))
  ]
});
