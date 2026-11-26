/* Non-Spatial Measure: Mass — MA3-NSM-01. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Non-Spatial Measure: Mass", outcome: 'MA3-NSM-01', langKey: 'mmt-s3-mass-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  paperTypes: [
  T(G_MT, 'basic', 'mass-units', "Choose units of mass", 'mass-units'),
  T(G_MT, 'basic', 'read-scale', "Read a scale", 'mass-units'),
  T(G_MT, 'basic', 'order-masses', "Compare and order masses", 'mass-units'),
  T(G_MT, 'basic', 'mass-decimals', "Mass as a decimal (kg and g)", 'decimal-metric'),
  T(G_MT, 'expected', 'mass-units', "Choose units of mass", 'mass-units'),
  T(G_MT, 'expected', 'read-scale', "Read a scale", 'mass-units'),
  T(G_MT, 'expected', 'order-masses', "Compare and order masses", 'mass-units'),
  T(G_MT, 'expected', 'mass-decimals', "Mass as a decimal (kg and g)", 'decimal-metric'),
  T(G_MT, 'expected', 'convert-mass', "Convert g, kg and t", 'convert-mass'),
  T(G_MT, 'expected', 'mass-problems', "Mass word problems", 'convert-mass')
  ]
});
