/* 2D Spatial Structure: Area of Composite Figures, Parallelograms and Triangles — MA3-2DS-03. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "2D Spatial Structure: Area of Composite Figures, Parallelograms and Triangles", outcome: 'MA3-2DS-03', langKey: 'mmt-s3-area-composite-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Part B" },
  paperTypes: [
  T(G_TWOD, 'expected', 'composite-area-diagram', "Area of a drawn composite shape", 'composite'),
  T(G_TWOD, 'expected', 'composite-area', "Area of a composite figure", 'composite'),
  T(G_TWOD, 'expected', 'multi-part-area', "Multi-part area problem", 'composite'),
  T(G_TWOD, 'expected', 'area-parallelogram', "Area of a parallelogram", 'parallelogram'),
  T(G_TWOD, 'expected', 'area-triangle', "Area of a triangle", 'triangle')
  ]
});
