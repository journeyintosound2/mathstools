/* Adding and Taking Away — MA1-CSQ-01. BUILT by stage12.py: types from the Revision Generator Stage 1 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.4;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 64); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Adding and Taking Away", outcome: 'MA1-CSQ-01', langKey: 'mmt-s1-adding-taking-away-ws-lang', bank: false, noLanguage: true,
  defaultCount: 8, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:17px;line-height:1.42;font-weight:700}.opts{font-size:16px;gap:2.6mm 5mm}.opt .L{width:6.4mm;height:6.4mm;font-size:12px}.tfRow{font-size:16px}.subs{font-size:16px}.dtab{font-size:14px}.ansLine{font-size:14.5px;min-height:10mm}.ansLine .unit{font-size:17px}.keyAns{font-size:17px}.item .ix,.item .ieq{font-size:19px}.qNum{width:30px;height:25px;font-size:13px}.secTitle{font-size:13.5px}.hdrTitle{font-size:17px}.lineLabel{font-size:11.5px}.ablank{height:9mm;min-width:30mm}.ablank.sm{min-width:22mm}.ablank.md{min-width:32mm}.lineBox{height:26px}",
  paperTypes: [
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'basic', 'two-colours', "Two parts, how many altogether?", 'count-by-one')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'basic', 'take-away-pictures', "Take away: how many are left?", 'count-by-one')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'basic', 'count-on-line', "Count on with a number line", 'count-by-one')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'basic', 'count-back-line', "Count back with a number line", 'count-by-one')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'basic', 'dice-total', "Add the dots", 'count-by-one')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'basic', 'how-many-more', "How many more? (compare rows)", 'count-by-one')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'basic', 'picture-story', "Picture stories", 'count-by-one')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'basic', 'make-ten', "How many more to make 10?", 'number-bonds')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'basic', 'bonds-to-10', "Number bonds to 10", 'number-bonds')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'basic', 'missing-part', "Missing part (part\u2013part\u2013whole)", 'number-bonds')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'basic', 'doubles', "Doubles", 'flexible-strategies')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'basic', 'near-doubles', "Near doubles", 'flexible-strategies')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'basic', 'turnaround', "Turnaround facts", 'equality')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'expected', 'two-colours', "Two parts, how many altogether?", 'count-by-one')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'expected', 'take-away-pictures', "Take away: how many are left?", 'count-by-one')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'expected', 'count-on-line', "Count on with a number line", 'count-by-one')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'expected', 'count-back-line', "Count back with a number line", 'count-by-one')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'expected', 'dice-total', "Add the dots", 'count-by-one')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'expected', 'how-many-more', "How many more? (compare rows)", 'count-by-one')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'expected', 'picture-story', "Picture stories", 'count-by-one')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'expected', 'make-ten', "How many more to make 10?", 'number-bonds')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'expected', 'bonds-to-10', "Number bonds to 10", 'number-bonds')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'expected', 'missing-part', "Missing part (part\u2013part\u2013whole)", 'number-bonds')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'expected', 'doubles', "Doubles", 'flexible-strategies')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'expected', 'near-doubles', "Near doubles", 'flexible-strategies')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_A, 'expected', 'turnaround', "Turnaround facts", 'equality')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_B, 'expected', 'fact-family', "Fact families", 'additive-relations')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_B, 'expected', 'difference', "How far apart? (difference)", 'additive-relations')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_B, 'expected', 'part-whole-story', "Part\u2013whole stories", 'additive-relations')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_B, 'expected', 'compare-story', "Compare stories", 'additive-relations')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_B, 'expected', 'doubles-halves', "Doubles and halves to 20", 'additive-relations')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_B, 'expected', 'add-three', "Add three numbers", 'additive-relations')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_B, 'expected', 'make-twenty', "How many more to make 20?", 'multiples-of-ten')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_B, 'expected', 'bridge-ten', "Make 10 first (bridging)", 'multiples-of-ten')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_B, 'expected', 'add-tens', "Add or take away tens", 'multiples-of-ten')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_B, 'expected', 'split-add', "Split into tens and ones to add", 'multiples-of-ten')),
  Y(RG.type(G_STAGE_1_COMBINING_SEPARATING_B, 'expected', 'missing-number-b', "Missing numbers", 'equality-problems'))
  ]
});
