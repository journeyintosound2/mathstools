/* 3D Spatial Structure: Volume and Capacity — MA3-3DS-02. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "3D Spatial Structure: Volume and Capacity", outcome: 'MA3-3DS-02', langKey: 'mmt-s3-volume-capacity-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  paperTypes: [
  T(G_THREED, 'basic', 'capacity-units', "Choose units of capacity", 'capacity-units'),
  T(G_THREED, 'basic', 'read-jug', "Read a measuring jug", 'capacity-units'),
  T(G_THREED, 'basic', 'capacity-problems', "Capacity word problems", 'capacity-units'),
  T(G_THREED, 'basic', 'displacement', "Volume by displacement", 'displacement'),
  T(G_THREED, 'basic', 'convert-capacity', "Convert litres and millilitres", 'decimal-metric'),
  T(G_THREED, 'expected', 'capacity-units', "Choose units of capacity", 'capacity-units'),
  T(G_THREED, 'expected', 'read-jug', "Read a measuring jug", 'capacity-units'),
  T(G_THREED, 'expected', 'capacity-problems', "Capacity word problems", 'capacity-units'),
  T(G_THREED, 'expected', 'displacement', "Volume by displacement", 'displacement'),
  T(G_THREED, 'expected', 'convert-capacity', "Convert litres and millilitres", 'decimal-metric'),
  T(G_THREED, 'expected', 'cubic-metres', "Cubic metres and choosing units", 'cubic-metres'),
  T(G_THREED, 'expected', 'count-cubes', "Volume by counting cubes", 'multiplicative-structure'),
  T(G_THREED, 'expected', 'layers', "Volume in layers", 'multiplicative-structure'),
  T(G_THREED, 'expected', 'volume-formula', "Volume of rectangular prisms (cm\u00b3 and m\u00b3)", 'rectangular-prisms'),
  T(G_THREED, 'expected', 'missing-dimension', "Find a missing dimension", 'rectangular-prisms'),
  T(G_THREED, 'expected', 'multi-part-3d', "Multi-part 3D problem", 'rectangular-prisms')
  ]
});
