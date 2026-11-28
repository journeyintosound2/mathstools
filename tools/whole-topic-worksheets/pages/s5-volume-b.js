/* Volume B: Pyramids, Cones and Spheres — MA5-VOL-P-01 (Path). BUILT by stage5.py: types from the Revision Generator Stage 5
   banks, mapped to this outcome's content statements. Basic = the first steps of each
   statement; Expected = the whole outcome. */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Volume B: Pyramids, Cones and Spheres", outcome: 'MA5-VOL-P-01', langKey: 'mmt-s5-volume-b-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  paperTypes: [
  T(G_VOLUME_B, 'basic', 'pyramid-volume', "Volume of a pyramid", 'volumes'),
  T(G_VOLUME_B, 'basic', 'cone-volume', "Volume of a cone", 'volumes'),
  T(G_VOLUME_B, 'basic', 'sphere-volume', "Volume of a sphere", 'volumes'),
  T(G_VOLUME_B, 'basic', 'hemisphere-volume', "Volume of a hemisphere", 'volumes'),
  T(G_VOLUME_B, 'basic', 'cone-cylinder-compare', "Compare a cone and a cylinder", 'volumes'),
  T(G_VOLUME_B, 'expected', 'pyramid-volume', "Volume of a pyramid", 'volumes'),
  T(G_VOLUME_B, 'expected', 'cone-volume', "Volume of a cone", 'volumes'),
  T(G_VOLUME_B, 'expected', 'sphere-volume', "Volume of a sphere", 'volumes'),
  T(G_VOLUME_B, 'expected', 'hemisphere-volume', "Volume of a hemisphere", 'volumes'),
  T(G_VOLUME_B, 'expected', 'cone-cylinder-compare', "Compare a cone and a cylinder", 'volumes'),
  T(G_VOLUME_B, 'expected', 'pyramid-volume-slant', "Pyramid volume from the slant height", 'volumes'),
  T(G_VOLUME_B, 'expected', 'cone-volume-slant', "Cone volume from the slant height", 'volumes'),
  T(G_VOLUME_B, 'expected', 'composite-volume', "Volume of composite solids", 'volumes'),
  T(G_VOLUME_B, 'expected', 'volume-removed', "Solids with a part removed", 'volumes'),
  T(G_VOLUME_B, 'expected', 'volume-find-dimension', "Find a dimension from the volume", 'volumes'),
  T(G_VOLUME_B, 'expected', 'volume-capacity', "Volume and capacity", 'volumes'),
  T(G_VOLUME_B, 'expected', 'volume-practical', "Practical volume problems", 'volumes')
  ]
});
