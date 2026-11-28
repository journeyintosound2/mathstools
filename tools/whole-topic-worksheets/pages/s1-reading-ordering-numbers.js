/* Reading and Ordering Numbers — MA1-RWN-01. BUILT by stage12.py: types from the Revision Generator Stage 1 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.4;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 64); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Reading and Ordering Numbers", outcome: 'MA1-RWN-01', langKey: 'mmt-s1-reading-ordering-numbers-ws-lang', bank: false, noLanguage: true,
  defaultCount: 8, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:17px;line-height:1.42;font-weight:700}.opts{font-size:16px;gap:2.6mm 5mm}.opt .L{width:6.4mm;height:6.4mm;font-size:12px}.tfRow{font-size:16px}.subs{font-size:16px}.dtab{font-size:14px}.ansLine{font-size:14.5px;min-height:10mm}.ansLine .unit{font-size:17px}.keyAns{font-size:17px}.item .ix,.item .ieq{font-size:19px}.qNum{width:30px;height:25px;font-size:13px}.secTitle{font-size:13.5px}.hdrTitle{font-size:17px}.lineLabel{font-size:11.5px}.ablank{height:9mm;min-width:30mm}.ablank.sm{min-width:22mm}.ablank.md{min-width:32mm}.lineBox{height:26px}",
  paperTypes: [
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'count-pictures', "Count the pictures", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'ten-frame-count', "Count with ten-frames", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'tens-ones-blocks', "Tens and ones (blocks)", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'before-after', "Before, after and between", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'one-ten-more-less', "1 more, 1 less, 10 more, 10 less", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'more-or-less', "Which number is more?", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'order-cards', "Order the numbers", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'read-number-words', "Number words", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'chart-missing', "Missing numbers on a number chart", 'number-patterns')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'skip-count', "Skip count by 2s, 5s and 10s", 'number-patterns')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'basic', 'number-line-a', "Numbers on a number line", 'numbers-on-line')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'count-pictures', "Count the pictures", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'ten-frame-count', "Count with ten-frames", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'tens-ones-blocks', "Tens and ones (blocks)", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'before-after', "Before, after and between", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'one-ten-more-less', "1 more, 1 less, 10 more, 10 less", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'more-or-less', "Which number is more?", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'order-cards', "Order the numbers", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'read-number-words', "Number words", 'counting-ones')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'chart-missing', "Missing numbers on a number chart", 'number-patterns')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'skip-count', "Skip count by 2s, 5s and 10s", 'number-patterns')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_A, 'expected', 'number-line-a', "Numbers on a number line", 'numbers-on-line')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'hto-blocks', "Hundreds, tens and ones (blocks)", 'counting-ones-tens')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'zero-place', "Zero holds a place", 'counting-ones-tens')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'digit-value', "What is the digit worth?", 'counting-ones-tens')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'bigger-smaller', "Bigger or smaller?", 'counting-ones-tens')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'order-3digit', "Order 3-digit numbers", 'counting-ones-tens')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'odd-even', "Odd or even?", 'counting-ones-tens')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'words-to-1000', "Number words to 1000", 'counting-ones-tens')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'ten-hundred-more', "10 more, 100 more", 'counting-ones-tens')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'number-line-b', "Number lines to 1000", 'counting-ones-tens')),
  Y(RG.type(G_STAGE_1_WHOLE_NUMBERS_B, 'expected', 'count-by-tens-hundreds', "Count by 10s and 100s", 'counting-ones-tens'))
  ]
});
