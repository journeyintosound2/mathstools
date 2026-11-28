/* Fractions — MA2-PF-01. BUILT by stage12.py: types from the Revision Generator Stage 2 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.22;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 60); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Fractions", outcome: 'MA2-PF-01', langKey: 'mmt-s2-fractions-ws-lang', bank: false, noLanguage: true,
  defaultCount: 10, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:15px;line-height:1.4}.opts{font-size:14.2px;gap:2mm 4.5mm}.opt .L{width:5.6mm;height:5.6mm;font-size:11px}.tfRow{font-size:14.2px}.subs{font-size:14.2px}.dtab{font-size:12.6px}.ansLine{font-size:13px;min-height:8.5mm}.ansLine .unit{font-size:15.5px}.keyAns{font-size:15.5px}.item .ix,.item .ieq{font-size:17.5px}.qNum{width:28px;height:23px;font-size:12px}.ablank{height:7.4mm;min-width:26mm}.ablank.sm{min-width:18mm}",
  paperTypes: [
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'basic', 'name-shaded', "Name the shaded fraction", 'fractional-parts')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'basic', 'equal-parts', "Equal parts or not?", 'fractional-parts')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'basic', 'shade-fraction', "Shade a fraction", 'fractional-parts')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'basic', 'halving-wall', "Halving: halves, quarters, eighths", 'fractional-parts')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'basic', 'fraction-words', "Fraction words and symbols", 'fractional-parts')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'basic', 'fraction-of-strip', "Fractions as lengths", 'fractional-parts')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'basic', 'parts-in-whole', "How many parts make a whole?", 'fractional-parts')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'basic', 'compare-unit', "Compare unit fractions", 'unit-fractions-line')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'basic', 'compare-same-denominator', "Compare fractions with the same bottom number", 'unit-fractions-line')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'basic', 'number-line-0-1', "Fractions on a number line from 0 to 1", 'unit-fractions-line')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'basic', 'count-fractions', "Count by fractions", 'unit-fractions-line')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'expected', 'name-shaded', "Name the shaded fraction", 'fractional-parts')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'expected', 'equal-parts', "Equal parts or not?", 'fractional-parts')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'expected', 'shade-fraction', "Shade a fraction", 'fractional-parts')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'expected', 'halving-wall', "Halving: halves, quarters, eighths", 'fractional-parts')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'expected', 'fraction-words', "Fraction words and symbols", 'fractional-parts')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'expected', 'fraction-of-strip', "Fractions as lengths", 'fractional-parts')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'expected', 'parts-in-whole', "How many parts make a whole?", 'fractional-parts')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'expected', 'compare-unit', "Compare unit fractions", 'unit-fractions-line')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'expected', 'compare-same-denominator', "Compare fractions with the same bottom number", 'unit-fractions-line')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'expected', 'number-line-0-1', "Fractions on a number line from 0 to 1", 'unit-fractions-line')),
  Y(RG.type(G_STAGE_2_FRACTIONS_A, 'expected', 'count-fractions', "Count by fractions", 'unit-fractions-line')),
  Y(RG.type(G_STAGE_2_FRACTIONS_B, 'expected', 'fifths-tenths', "Fifths and tenths", 'equivalent-lengths')),
  Y(RG.type(G_STAGE_2_FRACTIONS_B, 'expected', 'halving-thirds', "Thirds, sixths (and twelfths) by halving", 'equivalent-lengths')),
  Y(RG.type(G_STAGE_2_FRACTIONS_B, 'expected', 'equivalent-wall', "Equivalent fractions on a fraction wall", 'equivalent-lengths')),
  Y(RG.type(G_STAGE_2_FRACTIONS_B, 'expected', 'equivalent-shapes', "Name equal fractions", 'equivalent-lengths')),
  Y(RG.type(G_STAGE_2_FRACTIONS_B, 'expected', 'compare-order-b', "Compare and order fractions", 'equivalent-lengths')),
  Y(RG.type(G_STAGE_2_FRACTIONS_B, 'expected', 'half-benchmark', "More or less than one half?", 'equivalent-lengths')),
  Y(RG.type(G_STAGE_2_FRACTIONS_B, 'expected', 'fraction-of-collection', "Fraction of a group of objects", 'equivalent-lengths')),
  Y(RG.type(G_STAGE_2_FRACTIONS_B, 'expected', 'number-line-beyond-1', "Fractions on a number line beyond 1", 'greater-than-one')),
  Y(RG.type(G_STAGE_2_FRACTIONS_B, 'expected', 'count-beyond-1', "Count by fractions past 1", 'greater-than-one')),
  Y(RG.type(G_STAGE_2_FRACTIONS_B, 'expected', 'make-a-whole', "How much more to make a whole?", 'greater-than-one'))
  ]
});
