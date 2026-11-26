/* Represents Numbers: Decimals — MA3-RN-02. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Represents Numbers: Decimals", outcome: 'MA3-RN-02', langKey: 'mmt-s3-decimals-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  paperTypes: [
  T(G_RN, 'basic', 'decimal-place-value', "Place value in decimals", 'beyond-hundredths'),
  T(G_RN, 'basic', 'hundred-grid', "Hundredths on a hundred grid", 'beyond-hundredths'),
  T(G_RN, 'basic', 'compare-decimals', "Compare two decimals", 'compare-decimals'),
  T(G_RN, 'basic', 'order-decimals', "Order decimals", 'compare-decimals'),
  T(G_RN, 'basic', 'decimal-number-line', "Decimals on a number line", 'compare-decimals'),
  T(G_RN, 'expected', 'decimal-place-value', "Place value in decimals", 'beyond-hundredths'),
  T(G_RN, 'expected', 'hundred-grid', "Hundredths on a hundred grid", 'beyond-hundredths'),
  T(G_RN, 'expected', 'compare-decimals', "Compare two decimals", 'compare-decimals'),
  T(G_RN, 'expected', 'order-decimals', "Order decimals", 'compare-decimals'),
  T(G_RN, 'expected', 'decimal-number-line', "Decimals on a number line", 'compare-decimals')
  ]
});
