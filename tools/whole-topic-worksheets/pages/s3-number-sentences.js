/* Multiplicative Relations: Number Sentences and Patterns — MA3-MR-02. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Multiplicative Relations: Number Sentences and Patterns", outcome: 'MA3-MR-02', langKey: 'mmt-s3-number-sentences-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Part B" },
  paperTypes: [
  T(G_MR, 'expected', 'equivalent-sentence', "Equivalent number sentences", 'equivalent-sentences'),
  T(G_MR, 'expected', 'unknown-factor', "Find the unknown", 'equivalent-sentences'),
  T(G_MR, 'expected', 'multiples-pattern', "Patterns made by multiples", 'patterns-multiples'),
  T(G_MR, 'expected', 'common-multiples', "Common multiples", 'patterns-multiples'),
  T(G_MR, 'expected', 'order-of-operations', "Brackets and order of operations", 'brackets-order')
  ]
});
