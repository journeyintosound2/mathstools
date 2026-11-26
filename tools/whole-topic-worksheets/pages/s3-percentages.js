/* Represents Numbers: Percentages — MA3-RN-03. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Represents Numbers: Percentages", outcome: 'MA3-RN-03', langKey: 'mmt-s3-percentages-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Part B" },
  paperTypes: [
  T(G_RN, 'expected', 'benchmark-equivalents', "Benchmark fractions, decimals and percentages", 'benchmark'),
  T(G_RN, 'expected', 'benchmark-grid', "Benchmark percentages on a grid", 'benchmark'),
  T(G_RN, 'expected', 'percent-of-quantity', "Percentages of quantities", 'benchmark'),
  T(G_RN, 'expected', 'percentage-discount', "Percentage discounts", 'discounts'),
  T(G_RN, 'expected', 'multi-part-number', "Multi-part number problem", 'discounts')
  ]
});
