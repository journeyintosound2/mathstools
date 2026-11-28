/* Partitioning Numbers — MA1-RWN-02. BUILT by stage12.py: types from the Revision Generator Stage 1 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.4;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 64); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Partitioning Numbers", outcome: 'MA1-RWN-02', langKey: 'mmt-s1-partitioning-numbers-ws-lang', bank: false, noLanguage: true,
  defaultCount: 8, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:17px;line-height:1.42;font-weight:700}.opts{font-size:16px;gap:2.6mm 5mm}.opt .L{width:6.4mm;height:6.4mm;font-size:12px}.tfRow{font-size:16px}.subs{font-size:16px}.dtab{font-size:14px}.ansLine{font-size:14.5px;min-height:10mm}.ansLine .unit{font-size:17px}.keyAns{font-size:17px}.item .ix,.item .ieq{font-size:19px}.qNum{width:30px;height:25px;font-size:13px}.secTitle{font-size:13.5px}.hdrTitle{font-size:17px}.lineLabel{font-size:11.5px}.ablank{height:9mm;min-width:30mm}.ablank.sm{min-width:22mm}.ablank.md{min-width:32mm}.lineBox{height:26px}",
  paperTypes: [
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'teen-numbers', "Teen numbers: ten and some more", 'groups-of-ten')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'tens-ones-split', "Split into tens and ones", 'groups-of-ten')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'tens-ones-blocks', "Tens and ones (blocks)", 'groups-of-ten')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'teen-numbers', "Teen numbers: ten and some more", 'groups-of-ten')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'tens-ones-split', "Split into tens and ones", 'groups-of-ten')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'tens-ones-blocks', "Tens and ones (blocks)", 'groups-of-ten')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'hto-split', "Split into hundreds, tens and ones", 'three-digit')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'rename', "Split another way (renaming)", 'three-digit')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'expanded', "Expanded form", 'three-digit')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'hto-blocks', "Hundreds, tens and ones (blocks)", 'three-digit')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'digit-value', "What is the digit worth?", 'three-digit'))
  ]
});
