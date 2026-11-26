/* Data: Collecting and Displaying Data — MA3-DATA-01. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Data: Collecting and Displaying Data", outcome: 'MA3-DATA-01', langKey: 'mmt-s3-data-collect-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  paperTypes: [
  T(G_DA, 'basic', 'data-types', "Categorical or numerical data", 'collect'),
  T(G_DA, 'basic', 'survey-questions', "Good survey questions", 'collect'),
  T(G_DA, 'basic', 'choose-display', "Choose a suitable display", 'tables-graphs'),
  T(G_DA, 'basic', 'choose-scale', "Choose a scale for a graph", 'tables-graphs'),
  T(G_DA, 'basic', 'pictogram-key', "Pictograms with a key", 'tables-graphs'),
  T(G_DA, 'basic', 'two-way-table', "Two-way tables", 'tables-graphs'),
  T(G_DA, 'basic', 'construct-column', "Construct a column graph", 'tables-graphs'),
  T(G_DA, 'basic', 'construct-dot-plot', "Construct a dot plot", 'tables-graphs'),
  T(G_DA, 'expected', 'data-types', "Categorical or numerical data", 'collect'),
  T(G_DA, 'expected', 'survey-questions', "Good survey questions", 'collect'),
  T(G_DA, 'expected', 'choose-display', "Choose a suitable display", 'tables-graphs'),
  T(G_DA, 'expected', 'choose-scale', "Choose a scale for a graph", 'tables-graphs'),
  T(G_DA, 'expected', 'pictogram-key', "Pictograms with a key", 'tables-graphs'),
  T(G_DA, 'expected', 'two-way-table', "Two-way tables", 'tables-graphs'),
  T(G_DA, 'expected', 'construct-column', "Construct a column graph", 'tables-graphs'),
  T(G_DA, 'expected', 'construct-dot-plot', "Construct a dot plot", 'tables-graphs')
  ]
});
