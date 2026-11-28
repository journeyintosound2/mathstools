/* Chance — MA1-CHAN-01. BUILT by stage12.py: types from the Revision Generator Stage 1 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.4;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 64); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Chance", outcome: 'MA1-CHAN-01', langKey: 'mmt-s1-chance-ws-lang', bank: false, noLanguage: true,
  defaultCount: 8, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:17px;line-height:1.42;font-weight:700}.opts{font-size:16px;gap:2.6mm 5mm}.opt .L{width:6.4mm;height:6.4mm;font-size:12px}.tfRow{font-size:16px}.subs{font-size:16px}.dtab{font-size:14px}.ansLine{font-size:14.5px;min-height:10mm}.ansLine .unit{font-size:17px}.keyAns{font-size:17px}.item .ix,.item .ieq{font-size:19px}.qNum{width:30px;height:25px;font-size:13px}.secTitle{font-size:13.5px}.hdrTitle{font-size:17px}.lineLabel{font-size:11.5px}.ablank{height:9mm;min-width:30mm}.ablank.sm{min-width:22mm}.ablank.md{min-width:32mm}.lineBox{height:26px}",
  paperTypes: [
  Y(RG.type(G_STAGE_1_CHANCE_A, 'basic', 'will-might-wont', "Will happen, might happen, won't happen", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_A, 'basic', 'can-spinner-land', "Can the spinner land on it?", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_A, 'basic', 'can-you-pull', "Can you take it from the bag?", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_A, 'basic', 'most-likely-colour', "Which colour will you most likely get?", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_A, 'basic', 'sort-events', "Could it happen?", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_A, 'basic', 'bigger-part', "Which colour is more likely? (spinner)", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_A, 'basic', 'all-one-colour', "Will happen or won't happen? (bag)", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_B, 'basic', 'list-outcomes', "What could happen?", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_A, 'expected', 'will-might-wont', "Will happen, might happen, won't happen", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_A, 'expected', 'can-spinner-land', "Can the spinner land on it?", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_A, 'expected', 'can-you-pull', "Can you take it from the bag?", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_A, 'expected', 'most-likely-colour', "Which colour will you most likely get?", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_A, 'expected', 'sort-events', "Could it happen?", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_A, 'expected', 'bigger-part', "Which colour is more likely? (spinner)", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_A, 'expected', 'all-one-colour', "Will happen or won't happen? (bag)", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_B, 'expected', 'list-outcomes', "What could happen?", 'possible-outcomes')),
  Y(RG.type(G_STAGE_1_CHANCE_B, 'expected', 'chance-word', "Impossible, unlikely, likely, certain", 'activities-chance')),
  Y(RG.type(G_STAGE_1_CHANCE_B, 'expected', 'more-likely-spinner', "More likely or less likely? (spinner)", 'activities-chance')),
  Y(RG.type(G_STAGE_1_CHANCE_B, 'expected', 'compare-bags', "Which bag gives a better chance?", 'activities-chance')),
  Y(RG.type(G_STAGE_1_CHANCE_B, 'expected', 'equal-chance', "Equal chance?", 'activities-chance')),
  Y(RG.type(G_STAGE_1_CHANCE_B, 'expected', 'certain-impossible-bag', "Certain or impossible? (bag)", 'activities-chance'))
  ]
});
