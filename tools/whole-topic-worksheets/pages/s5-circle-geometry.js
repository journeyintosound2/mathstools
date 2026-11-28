/* Circle Geometry — MA5-CIR-P-01 (Path). BUILT by stage5.py: types from the Revision Generator Stage 5
   banks, mapped to this outcome's content statements. Basic = the first steps of each
   statement; Expected = the whole outcome. */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Circle Geometry", outcome: 'MA5-CIR-P-01', langKey: 'mmt-s5-circle-geometry-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  paperTypes: [
  T(G_CIRCLE_GEOMETRY, 'basic', 'circle-vocabulary', "Circle vocabulary", 'angle-chord'),
  T(G_CIRCLE_GEOMETRY, 'basic', 'chord-perpendicular', "Perpendicular from the centre to a chord", 'angle-chord'),
  T(G_CIRCLE_GEOMETRY, 'basic', 'angle-at-centre', "Angle at the centre and circumference", 'angle-chord'),
  T(G_CIRCLE_GEOMETRY, 'basic', 'angle-semicircle', "Angle in a semicircle", 'angle-chord'),
  T(G_CIRCLE_GEOMETRY, 'basic', 'same-segment', "Angles in the same segment", 'angle-chord'),
  T(G_CIRCLE_GEOMETRY, 'basic', 'tangent-radius', "Tangent and radius", 'tangent-secant'),
  T(G_CIRCLE_GEOMETRY, 'basic', 'two-tangents', "Tangents from an external point", 'tangent-secant'),
  T(G_CIRCLE_GEOMETRY, 'expected', 'circle-vocabulary', "Circle vocabulary", 'angle-chord'),
  T(G_CIRCLE_GEOMETRY, 'expected', 'chord-perpendicular', "Perpendicular from the centre to a chord", 'angle-chord'),
  T(G_CIRCLE_GEOMETRY, 'expected', 'angle-at-centre', "Angle at the centre and circumference", 'angle-chord'),
  T(G_CIRCLE_GEOMETRY, 'expected', 'angle-semicircle', "Angle in a semicircle", 'angle-chord'),
  T(G_CIRCLE_GEOMETRY, 'expected', 'same-segment', "Angles in the same segment", 'angle-chord'),
  T(G_CIRCLE_GEOMETRY, 'expected', 'cyclic-quadrilateral', "Cyclic quadrilaterals", 'angle-chord'),
  T(G_CIRCLE_GEOMETRY, 'expected', 'cyclic-exterior', "Exterior angle of a cyclic quadrilateral", 'angle-chord'),
  T(G_CIRCLE_GEOMETRY, 'expected', 'intersecting-chords', "Intersecting chords", 'angle-chord'),
  T(G_CIRCLE_GEOMETRY, 'expected', 'tangent-radius', "Tangent and radius", 'tangent-secant'),
  T(G_CIRCLE_GEOMETRY, 'expected', 'two-tangents', "Tangents from an external point", 'tangent-secant'),
  T(G_CIRCLE_GEOMETRY, 'expected', 'alternate-segment', "The alternate segment theorem", 'tangent-secant'),
  T(G_CIRCLE_GEOMETRY, 'expected', 'secants-tangents', "Secants and tangents from an external point", 'tangent-secant')
  ]
});
