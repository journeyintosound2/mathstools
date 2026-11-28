/* Probability A: Multistage Chance Experiments — MA5-PRO-C-01 (Core). BUILT by stage5.py: types from the Revision Generator Stage 5
   banks, mapped to this outcome's content statements. Basic = the first steps of each
   statement; Expected = the whole outcome. */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Probability A: Multistage Chance Experiments", outcome: 'MA5-PRO-C-01', langKey: 'mmt-s5-probability-a-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  paperTypes: [
  T(G_PROBABILITY_A, 'basic', 'list-sample-space', "List the sample space", 'multistage'),
  T(G_PROBABILITY_A, 'basic', 'two-dice-grid', "Two-dice (grid) probabilities", 'multistage'),
  T(G_PROBABILITY_A, 'basic', 'complete-tree', "Complete a probability tree", 'multistage'),
  T(G_PROBABILITY_A, 'basic', 'tree-independent', "Tree diagrams: independent events", 'multistage-problems'),
  T(G_PROBABILITY_A, 'basic', 'tree-without-replacement', "Tree diagrams: without replacement", 'multistage-problems'),
  T(G_PROBABILITY_A, 'basic', 'relative-frequency', "Relative frequency and simulation", 'simulations'),
  T(G_PROBABILITY_A, 'basic', 'expected-frequency', "Expected frequency", 'simulations'),
  T(G_PROBABILITY_A, 'expected', 'list-sample-space', "List the sample space", 'multistage'),
  T(G_PROBABILITY_A, 'expected', 'two-dice-grid', "Two-dice (grid) probabilities", 'multistage'),
  T(G_PROBABILITY_A, 'expected', 'complete-tree', "Complete a probability tree", 'multistage'),
  T(G_PROBABILITY_A, 'expected', 'with-vs-without', "With or without replacement?", 'multistage'),
  T(G_PROBABILITY_A, 'expected', 'tree-independent', "Tree diagrams: independent events", 'multistage-problems'),
  T(G_PROBABILITY_A, 'expected', 'tree-without-replacement', "Tree diagrams: without replacement", 'multistage-problems'),
  T(G_PROBABILITY_A, 'expected', 'at-least-one', "At least one (complement)", 'multistage-problems'),
  T(G_PROBABILITY_A, 'expected', 'three-stage', "Three-stage experiments", 'multistage-problems'),
  T(G_PROBABILITY_A, 'expected', 'relative-frequency', "Relative frequency and simulation", 'simulations'),
  T(G_PROBABILITY_A, 'expected', 'expected-frequency', "Expected frequency", 'simulations')
  ]
});
