/* Multiplication and Division — MA2-MR-01. BUILT by stage12.py: types from the Revision Generator Stage 2 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.22;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 60); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Multiplication and Division", outcome: 'MA2-MR-01', langKey: 'mmt-s2-multiplication-division-ws-lang', bank: false, noLanguage: true,
  defaultCount: 10, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:15px;line-height:1.4}.opts{font-size:14.2px;gap:2mm 4.5mm}.opt .L{width:5.6mm;height:5.6mm;font-size:11px}.tfRow{font-size:14.2px}.subs{font-size:14.2px}.dtab{font-size:12.6px}.ansLine{font-size:13px;min-height:8.5mm}.ansLine .unit{font-size:15.5px}.keyAns{font-size:15.5px}.item .ix,.item .ieq{font-size:17.5px}.qNum{width:28px;height:23px;font-size:12px}.ablank{height:7.4mm;min-width:26mm}.ablank.sm{min-width:18mm}",
  paperTypes: [
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'basic', 'skip-count-line', "Skip counting on a number line", 'patterns')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'basic', 'odd-even', "Odd and even numbers", 'patterns')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'basic', 'repeated-addition', "Repeated addition and multiplication", 'patterns')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'basic', 'equal-groups', "Equal groups to multiplication", 'arrays-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'basic', 'are-groups-equal', "Are the groups equal?", 'arrays-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'basic', 'array-sentence', "Arrays and turnaround facts", 'arrays-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'basic', 'doubling', "Double to multiply by 4 and 8", 'arrays-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'basic', 'facts-a', "Facts for \u00d72, \u00d73, \u00d74, \u00d75, \u00d710", 'recall-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'basic', 'share', "Division as sharing", 'recall-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'basic', 'grouping', "Division as grouping", 'recall-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'basic', 'groups-word-problem', "Equal groups word problems", 'recall-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'expected', 'skip-count-line', "Skip counting on a number line", 'patterns')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'expected', 'odd-even', "Odd and even numbers", 'patterns')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'expected', 'repeated-addition', "Repeated addition and multiplication", 'patterns')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'expected', 'equal-groups', "Equal groups to multiplication", 'arrays-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'expected', 'are-groups-equal', "Are the groups equal?", 'arrays-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'expected', 'array-sentence', "Arrays and turnaround facts", 'arrays-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'expected', 'doubling', "Double to multiply by 4 and 8", 'arrays-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'expected', 'facts-a', "Facts for \u00d72, \u00d73, \u00d74, \u00d75, \u00d710", 'recall-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'expected', 'share', "Division as sharing", 'recall-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'expected', 'grouping', "Division as grouping", 'recall-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_A, 'expected', 'groups-word-problem', "Equal groups word problems", 'recall-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_B, 'expected', 'multiples', "Multiples on a hundred chart", 'related-multiples')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_B, 'expected', 'facts-b', "Facts for \u00d76, \u00d77, \u00d78, \u00d79", 'known-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_B, 'expected', 'build-from-known', "Use a known fact (\u00d75 + 1 group, \u00d710 \u2212 1 group)", 'known-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_B, 'expected', 'division-facts', "Division facts", 'known-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_B, 'expected', 'remainders-groups', "Division with remainders (picture)", 'known-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_B, 'expected', 'remainder-problem', "What to do with the remainder", 'known-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_B, 'expected', 'word-problems-b', "Multiplication and division problems", 'known-facts')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_B, 'expected', 'area-model-2x1', "Area model: 2-digit \u00d7 1-digit", 'area-model')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_B, 'expected', 'split-array', "Split an array", 'number-properties')),
  Y(RG.type(G_STAGE_2_MULTIPLICATIVE_RELATIONS_B, 'expected', 'multiply-tens', "Multiply by multiples of 10", 'multiples-of-10'))
  ]
});
