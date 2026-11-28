/* Mass — MA2-NSM-01. BUILT by stage12.py: types from the Revision Generator Stage 2 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.22;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 60); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Mass", outcome: 'MA2-NSM-01', langKey: 'mmt-s2-mass-ws-lang', bank: false, noLanguage: true,
  defaultCount: 10, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:15px;line-height:1.4}.opts{font-size:14.2px;gap:2mm 4.5mm}.opt .L{width:5.6mm;height:5.6mm;font-size:11px}.tfRow{font-size:14.2px}.subs{font-size:14.2px}.dtab{font-size:12.6px}.ansLine{font-size:13px;min-height:8.5mm}.ansLine .unit{font-size:15.5px}.keyAns{font-size:15.5px}.item .ix,.item .ieq{font-size:17.5px}.qNum{width:28px;height:23px;font-size:12px}.ablank{height:7.4mm;min-width:26mm}.ablank.sm{min-width:18mm}",
  paperTypes: [
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'basic', 'balance-compare', "Heavier or lighter on a balance", 'kilogram')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'basic', 'balance-units', "Measure mass with blocks on a balance", 'kilogram')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'basic', 'kg-or-g', "Kilograms or grams?", 'kilogram')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'basic', 'estimate-mass', "Estimate mass", 'kilogram')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'basic', 'read-kg-scale', "Read a scale", 'kilogram')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'expected', 'balance-compare', "Heavier or lighter on a balance", 'kilogram')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'expected', 'balance-units', "Measure mass with blocks on a balance", 'kilogram')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'expected', 'kg-or-g', "Kilograms or grams?", 'kilogram')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'expected', 'estimate-mass', "Estimate mass", 'kilogram')),
  Y(RG.type(G_STAGE_2_MASS_TIME_A, 'expected', 'read-kg-scale', "Read a scale", 'kilogram')),
  Y(RG.type(G_STAGE_2_MASS_TIME_B, 'expected', 'kg-g-convert', "Kilograms and grams", 'scaled-mass')),
  Y(RG.type(G_STAGE_2_MASS_TIME_B, 'expected', 'read-scale-b', "Read a scale (work out the marks)", 'scaled-mass')),
  Y(RG.type(G_STAGE_2_MASS_TIME_B, 'expected', 'order-masses', "Order masses", 'scaled-mass')),
  Y(RG.type(G_STAGE_2_MASS_TIME_B, 'expected', 'mass-problem', "Mass problems", 'scaled-mass')),
  Y(RG.type(G_STAGE_2_MASS_TIME_B, 'expected', 'balance-share', "Equal objects on a balance", 'scaled-mass'))
  ]
});
