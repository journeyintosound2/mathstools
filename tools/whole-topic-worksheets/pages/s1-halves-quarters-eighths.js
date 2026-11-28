/* Halves, Quarters and Eighths — MA1-GM-03. BUILT by stage12.py: types from the Revision Generator Stage 1 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.4;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 64); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Halves, Quarters and Eighths", outcome: 'MA1-GM-03', langKey: 'mmt-s1-halves-quarters-eighths-ws-lang', bank: false, noLanguage: true,
  defaultCount: 8, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:17px;line-height:1.42;font-weight:700}.opts{font-size:16px;gap:2.6mm 5mm}.opt .L{width:6.4mm;height:6.4mm;font-size:12px}.tfRow{font-size:16px}.subs{font-size:16px}.dtab{font-size:14px}.ansLine{font-size:14.5px;min-height:10mm}.ansLine .unit{font-size:17px}.keyAns{font-size:17px}.item .ix,.item .ieq{font-size:19px}.qNum{width:30px;height:25px;font-size:13px}.secTitle{font-size:13.5px}.hdrTitle{font-size:17px}.lineLabel{font-size:11.5px}.ablank{height:9mm;min-width:30mm}.ablank.sm{min-width:22mm}.ablank.md{min-width:32mm}.lineBox{height:26px}",
  paperTypes: [
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'basic', 'equal-parts', "Is it cut into halves?", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'basic', 'half-or-quarter', "Half or quarter shaded?", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'basic', 'shade-half', "Colour one half", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'basic', 'which-strip', "Which strip shows a half (or a quarter)?", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'basic', 'halves-in-whole', "How many halves (quarters) in a whole?", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'basic', 'half-a-length', "Half of a length", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'basic', 'halve-again', "Halve a half", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'basic', 'half-on-line', "Halfway on a number line", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'expected', 'equal-parts', "Is it cut into halves?", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'expected', 'half-or-quarter', "Half or quarter shaded?", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'expected', 'shade-half', "Colour one half", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'expected', 'which-strip', "Which strip shows a half (or a quarter)?", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'expected', 'halves-in-whole', "How many halves (quarters) in a whole?", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'expected', 'half-a-length', "Half of a length", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'expected', 'halve-again', "Halve a half", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_A, 'expected', 'half-on-line', "Halfway on a number line", 'halves-quarters')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_B, 'expected', 'halving-wall', "Halve, halve again, halve again", 'eighths')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_B, 'expected', 'name-coloured', "How many halves, quarters or eighths are coloured?", 'eighths')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_B, 'expected', 'bigger-part', "Which part is bigger?", 'eighths')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_B, 'expected', 'same-as-half', "Parts that make one half", 'eighths')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_B, 'expected', 'parts-in-whole-b', "How many make one whole?", 'eighths')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_B, 'expected', 'fraction-of-length', "A half, quarter or eighth of a length", 'eighths')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_B, 'expected', 'colour-parts', "Colour the parts", 'eighths')),
  Y(RG.type(G_STAGE_1_HALVES_QUARTERS_B, 'expected', 'where-on-line', "Halves and quarters on a line", 'eighths'))
  ]
});
