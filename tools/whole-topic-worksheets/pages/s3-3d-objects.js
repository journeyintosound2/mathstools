/* 3D Spatial Structure: 3D Objects — MA3-3DS-01. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "3D Spatial Structure: 3D Objects", outcome: 'MA3-3DS-01', langKey: 'mmt-s3-3d-objects-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  paperTypes: [
  T(G_THREED, 'basic', 'name-solid', "Name prisms and pyramids from a picture", 'prisms-pyramids'),
  T(G_THREED, 'basic', 'prism-or-pyramid', "Prism or pyramid? Give a reason", 'prisms-pyramids'),
  T(G_THREED, 'basic', 'faces-edges-vertices', "Count faces, edges and vertices", 'prisms-pyramids'),
  T(G_THREED, 'basic', 'face-shapes', "The shapes of the faces", 'prisms-pyramids'),
  T(G_THREED, 'basic', 'fev-pattern', "Faces, edges and vertices patterns", 'prisms-pyramids'),
  T(G_THREED, 'basic', 'net-to-solid', "Which solid does this net make?", '3d-to-2d'),
  T(G_THREED, 'basic', 'cube-nets', "Which nets fold into a cube?", '3d-to-2d'),
  T(G_THREED, 'basic', 'cube-stack-views', "Top, front and side views", '3d-to-2d'),
  T(G_THREED, 'expected', 'name-solid', "Name prisms and pyramids from a picture", 'prisms-pyramids'),
  T(G_THREED, 'expected', 'prism-or-pyramid', "Prism or pyramid? Give a reason", 'prisms-pyramids'),
  T(G_THREED, 'expected', 'faces-edges-vertices', "Count faces, edges and vertices", 'prisms-pyramids'),
  T(G_THREED, 'expected', 'face-shapes', "The shapes of the faces", 'prisms-pyramids'),
  T(G_THREED, 'expected', 'fev-pattern', "Faces, edges and vertices patterns", 'prisms-pyramids'),
  T(G_THREED, 'expected', 'net-to-solid', "Which solid does this net make?", '3d-to-2d'),
  T(G_THREED, 'expected', 'cube-nets', "Which nets fold into a cube?", '3d-to-2d'),
  T(G_THREED, 'expected', 'cube-stack-views', "Top, front and side views", '3d-to-2d'),
  T(G_THREED, 'expected', 'skeletal-models', "Skeletal models: straws and connectors", 'construct')
  ]
});
