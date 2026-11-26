/* Chance — MA3-CHAN-01. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Chance", outcome: 'MA3-CHAN-01', langKey: 'mmt-s3-chance-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  paperTypes: [
  T(G_CH, 'basic', 'list-outcomes', "List all the possible outcomes", 'list-outcomes'),
  T(G_CH, 'basic', 'chance-words', "Describe chance in words", 'list-outcomes'),
  T(G_CH, 'basic', 'probability-scale', "The 0 to 1 probability scale", 'list-outcomes'),
  T(G_CH, 'basic', 'equally-likely', "Equally likely outcomes (is it fair?)", 'list-outcomes'),
  T(G_CH, 'basic', 'probability-fraction', "Probability as a fraction", 'list-outcomes'),
  T(G_CH, 'basic', 'most-likely', "Compare chances", 'list-outcomes'),
  T(G_CH, 'expected', 'list-outcomes', "List all the possible outcomes", 'list-outcomes'),
  T(G_CH, 'expected', 'chance-words', "Describe chance in words", 'list-outcomes'),
  T(G_CH, 'expected', 'probability-scale', "The 0 to 1 probability scale", 'list-outcomes'),
  T(G_CH, 'expected', 'equally-likely', "Equally likely outcomes (is it fair?)", 'list-outcomes'),
  T(G_CH, 'expected', 'probability-fraction', "Probability as a fraction", 'list-outcomes'),
  T(G_CH, 'expected', 'most-likely', "Compare chances", 'list-outcomes'),
  T(G_CH, 'expected', 'expected-results', "Expected results", 'observed-expected'),
  T(G_CH, 'expected', 'observed-vs-expected', "Observed and expected results", 'observed-expected'),
  T(G_CH, 'expected', 'design-generator', "Design a spinner or bag", 'random-generators'),
  T(G_CH, 'expected', 'fraction-decimal-percent', "Probability as a fraction, decimal and percentage", 'random-generators'),
  T(G_CH, 'expected', 'more-trials', "Small and large numbers of trials", 'trials'),
  T(G_CH, 'expected', 'multi-part-chance', "Multi-part chance problem", 'trials')
  ]
});
