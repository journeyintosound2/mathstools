/* Geometric Measure: Position — MA3-GM-01. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Geometric Measure: Position", outcome: 'MA3-GM-01', langKey: 'mmt-s3-position-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  paperTypes: [
  T(G_GM, 'basic', 'grid-map-read', "What is at this grid reference?", 'cartesian'),
  T(G_GM, 'basic', 'grid-map-give', "Give the grid reference", 'cartesian'),
  T(G_GM, 'basic', 'read-coordinates', "Read coordinates from the plane", 'cartesian'),
  T(G_GM, 'basic', 'plot-point', "Plot a point on the plane", 'cartesian'),
  T(G_GM, 'basic', 'coordinate-vs-grid-map', "Coordinates or grid references?", 'cartesian'),
  T(G_GM, 'basic', 'lines-not-spaces', "Reading the number plane", 'cartesian'),
  T(G_GM, 'expected', 'grid-map-read', "What is at this grid reference?", 'cartesian'),
  T(G_GM, 'expected', 'grid-map-give', "Give the grid reference", 'cartesian'),
  T(G_GM, 'expected', 'read-coordinates', "Read coordinates from the plane", 'cartesian'),
  T(G_GM, 'expected', 'plot-point', "Plot a point on the plane", 'cartesian'),
  T(G_GM, 'expected', 'coordinate-vs-grid-map', "Coordinates or grid references?", 'cartesian'),
  T(G_GM, 'expected', 'lines-not-spaces', "Reading the number plane", 'cartesian'),
  T(G_GM, 'expected', 'four-quadrants', "All four quadrants", 'four-quadrants')
  ]
});
