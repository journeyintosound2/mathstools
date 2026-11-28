/* Addition and Subtraction — MA2-AR-01. BUILT by stage12.py: types from the Revision Generator Stage 2 banks, mapped to this
   outcome's content statements. Part A statements are in both papers; Part B only in "Parts A and B".
   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */
const PIC = 1.22;
const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, 60); } };
  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };
const C = WSF.C;
WSF.page({
  topic: "Addition and Subtraction", outcome: 'MA2-AR-01', langKey: 'mmt-s2-addition-subtraction-ws-lang', bank: false, noLanguage: true,
  defaultCount: 10, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  css: ".qText{font-size:15px;line-height:1.4}.opts{font-size:14.2px;gap:2mm 4.5mm}.opt .L{width:5.6mm;height:5.6mm;font-size:11px}.tfRow{font-size:14.2px}.subs{font-size:14.2px}.dtab{font-size:12.6px}.ansLine{font-size:13px;min-height:8.5mm}.ansLine .unit{font-size:15.5px}.keyAns{font-size:15.5px}.item .ix,.item .ieq{font-size:17.5px}.qNum{width:28px;height:23px;font-size:12px}.ablank{height:7.4mm;min-width:26mm}.ablank.sm{min-width:18mm}",
  paperTypes: [
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'basic', 'count-on-difference', "Find the difference by counting on", 'add-subtract-connection')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'basic', 'fact-family', "Fact families (+ and \u2212 undo each other)", 'add-subtract-connection')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'basic', 'jump-add', "Jump strategy for adding (open number line)", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'basic', 'jump-subtract', "Jump back to subtract", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'basic', 'split-strategy', "Split into tens and ones", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'basic', 'bridge-to-ten', "Bridge to ten", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'basic', 'compensation', "Add 9 or 19 (add 10, take 1)", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'basic', 'make-ten', "Add three numbers: look for ten", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'basic', 'part-whole-problem', "Part\u2013whole word problems (bar model)", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'basic', 'compare-problem', "How many more? (bar model)", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'basic', 'estimate-sum', "Estimate by rounding to tens", 'select-strategies')),
  { id: 'b-money-values', level: 'basic', stmt: 'money-values', label: "Make an amount of money in two ways", gen: () => { const c = C.pick([35, 45, 55, 65, 70, 85, 90, 120, 150, 175, 240, 260]), show = v => v >= 100 ? '$' + (v / 100).toFixed(2) : v + 'c';
      const coins = [200, 100, 50, 20, 10, 5], greedy = v => { const o = []; coins.forEach(k => { while (v >= k) { o.push(k); v -= k; } }); return o; };
      const g = greedy(c), alt = g.slice(); const big = alt.findIndex(k => k > 5 && k !== 200); if (big >= 0) { const k = alt[big], half = k === 50 ? [20, 20, 10] : k === 100 ? [50, 50] : k === 20 ? [10, 10] : k === 10 ? [5, 5] : [k]; alt.splice(big, 1, ...half); }
      const say = a => a.map(k => k >= 100 ? '$' + k / 100 : k + 'c').join(' + ');
      return { prompt: `Show ${show(c)} in two different ways. Draw the coins.`, mode: 'none', drawSpace: 26, noAnswerBox: true, answerHTML: `For example: ${say(g)}; or ${say(alt)}`, why: 'Any two sets of coins that add to the same amount.' }; } },
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'expected', 'count-on-difference', "Find the difference by counting on", 'add-subtract-connection')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'expected', 'fact-family', "Fact families (+ and \u2212 undo each other)", 'add-subtract-connection')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'expected', 'jump-add', "Jump strategy for adding (open number line)", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'expected', 'jump-subtract', "Jump back to subtract", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'expected', 'split-strategy', "Split into tens and ones", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'expected', 'bridge-to-ten', "Bridge to ten", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'expected', 'compensation', "Add 9 or 19 (add 10, take 1)", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'expected', 'make-ten', "Add three numbers: look for ten", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'expected', 'part-whole-problem', "Part\u2013whole word problems (bar model)", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'expected', 'compare-problem', "How many more? (bar model)", 'select-strategies')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_A, 'expected', 'estimate-sum', "Estimate by rounding to tens", 'select-strategies')),
  { id: 'e-money-values', level: 'expected', stmt: 'money-values', label: "Make an amount of money in two ways", gen: () => { const c = C.pick([35, 45, 55, 65, 70, 85, 90, 120, 150, 175, 240, 260]), show = v => v >= 100 ? '$' + (v / 100).toFixed(2) : v + 'c';
      const coins = [200, 100, 50, 20, 10, 5], greedy = v => { const o = []; coins.forEach(k => { while (v >= k) { o.push(k); v -= k; } }); return o; };
      const g = greedy(c), alt = g.slice(); const big = alt.findIndex(k => k > 5 && k !== 200); if (big >= 0) { const k = alt[big], half = k === 50 ? [20, 20, 10] : k === 100 ? [50, 50] : k === 20 ? [10, 10] : k === 10 ? [5, 5] : [k]; alt.splice(big, 1, ...half); }
      const say = a => a.map(k => k >= 100 ? '$' + k / 100 : k + 'c').join(' + ');
      return { prompt: `Show ${show(c)} in two different ways. Draw the coins.`, mode: 'none', drawSpace: 26, noAnswerBox: true, answerHTML: `For example: ${say(g)}; or ${say(alt)}`, why: 'Any two sets of coins that add to the same amount.' }; } },
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_B, 'expected', 'add-hundreds-tens', "Add and subtract hundreds and tens mentally", 'partition-regroup')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_B, 'expected', 'jump-3-digit', "Jump strategy with 3-digit numbers (+ and \u2212)", 'partition-regroup')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_B, 'expected', 'split-3-digit', "Split strategy with 3-digit numbers", 'partition-regroup')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_B, 'expected', 'column-add', "Column addition with trading", 'partition-regroup')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_B, 'expected', 'column-subtract', "Column subtraction with trading", 'partition-regroup')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_B, 'expected', 'find-the-error', "Find the mistake", 'partition-regroup')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_B, 'expected', 'estimate-3-digit', "Estimate by rounding", 'partition-regroup')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_B, 'expected', 'bar-model-3-digit', "Bar model word problems", 'partition-regroup')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_B, 'expected', 'which-strategy', "Choose a good strategy", 'partition-regroup')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_B, 'expected', 'money-change', "Money and change", 'money-budgeting')),
  Y(RG.type(G_STAGE_2_ADDITIVE_RELATIONS_B, 'expected', 'two-step-problem', "Two-step problems", 'money-budgeting'))
  ]
});
