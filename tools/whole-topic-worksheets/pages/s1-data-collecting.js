/* Collecting Data — MA1-DATA-01. BUILT by stage12.py: types from the Revision Generator Stage 1 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.4;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 64); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Collecting Data", outcome: 'MA1-DATA-01', langKey: 'mmt-s1-data-collecting-ws-lang', bank: false, noLanguage: true,
  defaultCount: 8, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:17px;line-height:1.42;font-weight:700}.opts{font-size:16px;gap:2.6mm 5mm}.opt .L{width:6.4mm;height:6.4mm;font-size:12px}.tfRow{font-size:16px}.subs{font-size:16px}.dtab{font-size:14px}.ansLine{font-size:14.5px;min-height:10mm}.ansLine .unit{font-size:17px}.keyAns{font-size:17px}.item .ix,.item .ieq{font-size:19px}.qNum{width:30px;height:25px;font-size:13px}.secTitle{font-size:13.5px}.hdrTitle{font-size:17px}.lineLabel{font-size:11.5px}.ablank{height:9mm;min-width:30mm}.ablank.sm{min-width:22mm}.ablank.md{min-width:32mm}.lineBox{height:26px}",
  paperTypes: [
  Y(RG.type(G_STAGE_1_DATA_A, 'basic', 'list-count', "Count from a list", 'ask-gather')),
  Y(RG.type(G_STAGE_1_DATA_A, 'basic', 'sort-count', "Sort and count pictures", 'ask-gather')),
  Y(RG.type(G_STAGE_1_DATA_A, 'basic', 'tally-totals', "Write the tally totals", 'represent-describe')),
  Y(RG.type(G_STAGE_1_DATA_A, 'expected', 'list-count', "Count from a list", 'ask-gather')),
  Y(RG.type(G_STAGE_1_DATA_A, 'expected', 'sort-count', "Sort and count pictures", 'ask-gather')),
  Y(RG.type(G_STAGE_1_DATA_A, 'expected', 'tally-totals', "Write the tally totals", 'represent-describe')),
  Y(RG.type(G_STAGE_1_DATA_B, 'expected', 'good-question', "Choose a good survey question", 'question-of-interest')),
  Y(RG.type(G_STAGE_1_DATA_B, 'expected', 'tally-from-list', "Make a tally from a list", 'create-interpret')),
  Y(RG.type(G_STAGE_1_DATA_B, 'expected', 'table-from-tally', "Tally to table", 'create-interpret'))
  ]
});
