/* Position — MA1-GM-01. BUILT by stage12.py: types from the Revision Generator Stage 1 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.4;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 64); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Position", outcome: 'MA1-GM-01', langKey: 'mmt-s1-position-ws-lang', bank: false, noLanguage: true,
  defaultCount: 8, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:17px;line-height:1.42;font-weight:700}.opts{font-size:16px;gap:2.6mm 5mm}.opt .L{width:6.4mm;height:6.4mm;font-size:12px}.tfRow{font-size:16px}.subs{font-size:16px}.dtab{font-size:14px}.ansLine{font-size:14.5px;min-height:10mm}.ansLine .unit{font-size:17px}.keyAns{font-size:17px}.item .ix,.item .ieq{font-size:19px}.qNum{width:30px;height:25px;font-size:13px}.secTitle{font-size:13.5px}.hdrTitle{font-size:17px}.lineLabel{font-size:11.5px}.ablank{height:9mm;min-width:30mm}.ablank.sm{min-width:22mm}.ablank.md{min-width:32mm}.lineBox{height:26px}",
  paperTypes: [
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'basic', 'left-right', "Left and right of", 'follow-directions')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'basic', 'between', "Between", 'follow-directions')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'basic', 'ordinal', "First, second, third \u2026", 'follow-directions')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'basic', 'above-below', "Above, below, next to (grid)", 'follow-directions')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'expected', 'left-right', "Left and right of", 'follow-directions')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'expected', 'between', "Between", 'follow-directions')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'expected', 'ordinal', "First, second, third \u2026", 'follow-directions')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_A, 'expected', 'above-below', "Above, below, next to (grid)", 'follow-directions')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_B, 'expected', 'follow-steps', "Follow the steps on a map", 'simple-maps')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_B, 'expected', 'describe-path', "Describe the path", 'simple-maps')),
  Y(RG.type(G_STAGE_1_POSITION_LENGTH_B, 'expected', 'turns', "Quarter and half turns", 'simple-maps'))
  ]
});
