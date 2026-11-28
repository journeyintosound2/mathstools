/* Financial Mathematics B: Compound Interest and Depreciation — MA5-FIN-C-02 (Core). BUILT by stage5.py: types from the Revision Generator Stage 5
   banks, mapped to this outcome's content statements. Basic = the first steps of each
   statement; Expected = the whole outcome. */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Financial Mathematics B: Compound Interest and Depreciation", outcome: 'MA5-FIN-C-02', langKey: 'mmt-s5-financial-mathematics-b-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  paperTypes: [
  T(G_FINANCIAL_MATHEMATICS_B, 'basic', 'compound-repeated-simple-interest', "Compound interest by repeated simple-interest steps", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'basic', 'compound-repeated-multiplication', "Compound interest by repeated multiplication", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'basic', 'compound-formula-future-value', "Use FV = PV(1 + r)ⁿ", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'basic', 'compound-interest-earned', "Calculate compound interest earned", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'basic', 'depreciation-repeated', "Depreciation by repeated multiplication", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'basic', 'depreciation-formula-value', "Use S = V₀(1 − r)ⁿ", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'basic', 'depreciation-amount', "Calculate the amount of depreciation", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'expected', 'compound-repeated-simple-interest', "Compound interest by repeated simple-interest steps", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'expected', 'compound-repeated-multiplication', "Compound interest by repeated multiplication", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'expected', 'compound-formula-future-value', "Use FV = PV(1 + r)ⁿ", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'expected', 'compound-interest-earned', "Calculate compound interest earned", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'expected', 'depreciation-repeated', "Depreciation by repeated multiplication", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'expected', 'depreciation-formula-value', "Use S = V₀(1 − r)ⁿ", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'expected', 'depreciation-amount', "Calculate the amount of depreciation", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'expected', 'compound-compounding-frequency', "Compound interest with different compounding periods", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'expected', 'simple-vs-compound-compare', "Compare simple interest and compound interest", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'expected', 'compound-find-present-value', "Calculate the amount to invest now", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'expected', 'compound-find-rate-or-time', "Calculate rate or time in compound situations", 'compound-depreciation'),
  T(G_FINANCIAL_MATHEMATICS_B, 'expected', 'depreciation-find-rate-or-time', "Calculate rate or time in depreciation situations", 'compound-depreciation')
  ]
});
