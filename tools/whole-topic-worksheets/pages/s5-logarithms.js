/* Logarithms — MA5-LOG-P-01 (Path). BUILT by stage5.py: types from the Revision Generator Stage 5
   banks, mapped to this outcome's content statements. Basic = the first steps of each
   statement; Expected = the whole outcome. */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Logarithms", outcome: 'MA5-LOG-P-01', langKey: 'mmt-s5-logarithms-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  paperTypes: [
  T(G_LOGARITHMS, 'basic', 'index-to-log', "Write in logarithmic form", 'examine'),
  T(G_LOGARITHMS, 'basic', 'log-to-index', "Write in index form", 'examine'),
  T(G_LOGARITHMS, 'basic', 'evaluate-log', "Evaluate logarithms", 'examine'),
  T(G_LOGARITHMS, 'basic', 'log-laws-combine', "Simplify to a single logarithm", 'laws'),
  T(G_LOGARITHMS, 'basic', 'log-laws-evaluate', "Evaluate using the log laws", 'laws'),
  T(G_LOGARITHMS, 'basic', 'exponential-same-base', "Exponential equations: same base", 'laws'),
  T(G_LOGARITHMS, 'expected', 'index-to-log', "Write in logarithmic form", 'examine'),
  T(G_LOGARITHMS, 'expected', 'log-to-index', "Write in index form", 'examine'),
  T(G_LOGARITHMS, 'expected', 'evaluate-log', "Evaluate logarithms", 'examine'),
  T(G_LOGARITHMS, 'expected', 'log-graph', "The graph of y = logₐ x", 'examine'),
  T(G_LOGARITHMS, 'expected', 'log-true-false', "True or false? Log statements", 'examine'),
  T(G_LOGARITHMS, 'expected', 'log-laws-combine', "Simplify to a single logarithm", 'laws'),
  T(G_LOGARITHMS, 'expected', 'log-laws-evaluate', "Evaluate using the log laws", 'laws'),
  T(G_LOGARITHMS, 'expected', 'exponential-same-base', "Exponential equations: same base", 'laws'),
  T(G_LOGARITHMS, 'expected', 'log-laws-expand', "Expand using the log laws", 'laws'),
  T(G_LOGARITHMS, 'expected', 'log-laws-in-terms', "Express in terms of given logs", 'laws'),
  T(G_LOGARITHMS, 'expected', 'solve-log-equation', "Solve logarithmic equations", 'laws'),
  T(G_LOGARITHMS, 'expected', 'exponential-with-logs', "Exponential equations using logs", 'laws'),
  T(G_LOGARITHMS, 'expected', 'log-growth-decay', "Growth and decay problems", 'laws')
  ]
});
