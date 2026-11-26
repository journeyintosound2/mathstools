/* Data: Interpreting Data — MA3-DATA-02. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Data: Interpreting Data", outcome: 'MA3-DATA-02', langKey: 'mmt-s3-data-interpret-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  paperTypes: [
  T(G_DA, 'basic', 'many-to-one-scale', "Read a column graph with a many-to-one scale", 'describe-interpret'),
  T(G_DA, 'basic', 'dot-plot-read', "Read a dot plot", 'describe-interpret'),
  T(G_DA, 'basic', 'line-graph-read', "Read a line graph", 'describe-interpret'),
  T(G_DA, 'basic', 'line-graph-trend', "Describe change on a line graph", 'describe-interpret'),
  T(G_DA, 'basic', 'timeline-read', "Read a time line", 'describe-interpret'),
  T(G_DA, 'expected', 'many-to-one-scale', "Read a column graph with a many-to-one scale", 'describe-interpret'),
  T(G_DA, 'expected', 'dot-plot-read', "Read a dot plot", 'describe-interpret'),
  T(G_DA, 'expected', 'line-graph-read', "Read a line graph", 'describe-interpret'),
  T(G_DA, 'expected', 'line-graph-trend', "Describe change on a line graph", 'describe-interpret'),
  T(G_DA, 'expected', 'timeline-read', "Read a time line", 'describe-interpret'),
  T(G_DA, 'expected', 'side-by-side', "Side-by-side column graphs", 'compare-displays'),
  T(G_DA, 'expected', 'multi-part-data', "Multi-part data problem", 'compare-displays'),
  T(G_DA, 'expected', 'misleading-graph', "Misleading graphs in the media", 'digital-media')
  ]
});
