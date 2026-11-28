/* Whole Numbers — MA2-RN-01. BUILT by stage12.py: types from the Revision Generator Stage 2 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.22;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 60); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Whole Numbers", outcome: 'MA2-RN-01', langKey: 'mmt-s2-whole-numbers-ws-lang', bank: false, noLanguage: true,
  defaultCount: 10, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:15px;line-height:1.4}.opts{font-size:14.2px;gap:2mm 4.5mm}.opt .L{width:5.6mm;height:5.6mm;font-size:11px}.tfRow{font-size:14.2px}.subs{font-size:14.2px}.dtab{font-size:12.6px}.ansLine{font-size:13px;min-height:8.5mm}.ansLine .unit{font-size:15.5px}.keyAns{font-size:15.5px}.item .ix,.item .ieq{font-size:17.5px}.qNum{width:28px;height:23px;font-size:12px}.ablank{height:7.4mm;min-width:26mm}.ablank.sm{min-width:18mm}",
  paperTypes: [
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'blocks-to-number', "Read a number made with base-ten blocks", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'number-to-blocks', "How many blocks make the number?", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'read-pv-chart', "Read a place-value chart", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'numerals-and-words', "Numerals and words", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'compare-numbers', "Compare numbers with < and >", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'order-numbers', "Order numbers", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'number-line-read', "Read a number line", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'counting-patterns', "Count by 10s, 100s and 1000s", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'more-or-less', "10, 100 or 1000 more or less", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'zero-placeholder', "Zero holds a place", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'digit-cards', "Make numbers from digit cards", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'complete-pv-chart', "Complete a place-value chart", 'partition-4-digits')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'value-of-digit', "The value of a digit", 'partition-4-digits')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'expanded-form', "Expanded form", 'partition-4-digits')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'rename-numbers', "Rename numbers (e.g. 34 hundreds)", 'partition-4-digits')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'basic', 'trading', "Trade ones, tens and hundreds", 'partition-4-digits')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'blocks-to-number', "Read a number made with base-ten blocks", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'number-to-blocks', "How many blocks make the number?", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'read-pv-chart', "Read a place-value chart", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'numerals-and-words', "Numerals and words", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'compare-numbers', "Compare numbers with < and >", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'order-numbers', "Order numbers", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'number-line-read', "Read a number line", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'counting-patterns', "Count by 10s, 100s and 1000s", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'more-or-less', "10, 100 or 1000 more or less", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'zero-placeholder', "Zero holds a place", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'digit-cards', "Make numbers from digit cards", 'read-order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'complete-pv-chart', "Complete a place-value chart", 'partition-4-digits')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'value-of-digit', "The value of a digit", 'partition-4-digits')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'expanded-form', "Expanded form", 'partition-4-digits')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'rename-numbers', "Rename numbers (e.g. 34 hundreds)", 'partition-4-digits')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_A, 'expected', 'trading', "Trade ones, tens and hundreds", 'partition-4-digits')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_B, 'expected', 'round-number-line', "Round using a number line", 'order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_B, 'expected', 'round-to-place', "Round to the nearest 10, 100 or 1000", 'order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_B, 'expected', 'which-rounds', "Which numbers round to\u2026?", 'order-thousands')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_B, 'expected', 'read-5-digit', "Read 5-digit numbers in a chart", 'rename-6-digits')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_B, 'expected', 'value-5-digit', "Value of a digit in a 5-digit number", 'rename-6-digits')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_B, 'expected', 'expanded-5-digit', "Expanded form to tens of thousands", 'rename-6-digits')),
  Y(RG.type(G_STAGE_2_PLACE_VALUE_B, 'expected', 'words-5-digit', "Numerals and words to tens of thousands", 'rename-6-digits')),
  { id: 'e-times-as-large', level: 'expected', stmt: 'times-as-large', label: "10, 100 or 1000 times as large", gen: () => { const k = C.pick([10, 10, 100, 100, 1000]), n = k === 1000 ? C.ri(2, 9) : k === 100 ? C.ri(2, 60) : C.ri(12, 450), sp = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return C.pick([0, 1]) ? { prompt: `What number is ${sp(k)} times as large as ${sp(n)}?`, mode: 'none', answerHTML: sp(n * k), why: `Each digit moves ${String(k).length - 1} place${k > 10 ? 's' : ''} to the left: ${sp(n)} × ${sp(k)} = ${sp(n * k)}.` }
        : { prompt: `${sp(n * k)} is how many times as large as ${sp(n)}?`, mode: 'none', answerHTML: `${sp(k)} times`, why: `${sp(n)} × ${sp(k)} = ${sp(n * k)}.` }; } }
  ]
});
