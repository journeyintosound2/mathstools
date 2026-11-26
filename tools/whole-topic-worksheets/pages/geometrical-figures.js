/* Properties of Geometrical Figures — MA4-GEO-C-01. Quiz types from the
   whole-topic quiz bank (banks/geometrical-figures.js) under the three content
   statements, plus sketching questions written for paper. */
(() => {
  const C = WSF.C;
  const { pick } = C;

  const TRI = [
    ['scalene', 'acute-angled', true, 'Three different sides, all angles less than 90°.'],
    ['scalene', 'right-angled', true, 'Three different sides and one 90° angle (for example sides 3, 4, 5).'],
    ['scalene', 'obtuse-angled', true, 'Three different sides and one angle more than 90°.'],
    ['isosceles', 'acute-angled', true, 'Two equal sides; the base angles are equal and all angles are less than 90°.'],
    ['isosceles', 'right-angled', true, 'Two equal sides meeting at a 90° angle; the other two angles are 45° each.'],
    ['isosceles', 'obtuse-angled', true, 'Two equal sides meeting at an angle more than 90°.'],
    ['equilateral', 'acute-angled', true, 'All sides equal and every angle is 60°.'],
    ['equilateral', 'right-angled', false, 'An equilateral triangle has three 60° angles, so it can never have a right angle.'],
    ['equilateral', 'obtuse-angled', false, 'An equilateral triangle has three 60° angles, so it can never have an obtuse angle.']
  ];
  const QUAD = [
    ['exactly one pair of parallel sides', 'trapezium', 'Only one pair of opposite sides is parallel.'],
    ['two pairs of parallel sides and no right angles', 'parallelogram (or a rhombus)', 'Both pairs of opposite sides are parallel.'],
    ['four equal sides and no right angles', 'rhombus', 'All sides equal; opposite sides parallel; diagonals cross at right angles.'],
    ['four right angles and two pairs of different side lengths', 'rectangle', 'Four 90° angles; opposite sides equal.'],
    ['two pairs of equal adjacent sides', 'kite', 'Two pairs of adjacent sides are equal; one diagonal is an axis of symmetry.'],
    ['four equal sides and four right angles', 'square', 'All sides equal and every angle 90°.'],
    ['diagonals that are equal in length and bisect each other', 'rectangle (or a square)', 'Equal diagonals that bisect each other means four right angles.'],
    ['diagonals that cross at right angles and bisect each other', 'rhombus (or a square)', 'Diagonals that bisect each other at right angles give four equal sides.']
  ];

  WSF.page({
    topic: 'Properties of Geometrical Figures', outcome: 'MA4-GEO-C-01', langKey: 'mmt-geo-ws-lang', bank: true,
    translateTopic: 'Geometrical Figures', defaultCount: 12, statements: STATEMENTS,
    stmtOf: {
      'b-tri-sides': 'classify-triangles', 'b-tri-angles': 'classify-triangles', 'b-tri-sum': 'apply-properties',
      'b-quad-name': 'classify-quadrilaterals', 'b-quad-sum': 'apply-properties', 'b-props': 'classify-quadrilaterals',
      'e-isosceles': 'apply-properties', 'e-exterior': 'apply-properties', 'e-special-quad': 'apply-properties',
      'e-algebraic': 'apply-properties', 'e-hierarchy': 'classify-quadrilaterals', 'e-both': 'classify-triangles',
      'e-convex': 'classify-quadrilaterals', 'e-unknown-side': 'apply-properties'
    },
    order: ['b-tri-sides', 'b-tri-angles', 'p-sketch-tri', 'b-tri-sum', 'b-quad-name', 'b-props', 'p-sketch-quad', 'b-quad-sum',
      'e-both', 'p-possible', 'e-isosceles', 'e-exterior', 'e-hierarchy', 'e-convex', 'p-sketch-quad-e', 'e-special-quad', 'e-algebraic', 'e-unknown-side'],
    paperTypes: [
      { id: 'p-sketch-tri', level: 'basic', stmt: 'classify-triangles', label: 'Sketch a triangle from its name',
        gen() {
          const t = pick(TRI.filter(x => x[2]));
          return { prompt: `Sketch a triangle that is <b>${t[0]}</b> and <b>${t[1]}</b>. Mark any equal sides and any right angle.`,
            mode: 'none', drawSpace: 30, noAnswerBox: true, answerHTML: `A ${t[0]} ${t[1]} triangle`, why: t[3] };
        } },
      { id: 'p-sketch-quad', level: 'basic', stmt: 'classify-quadrilaterals', label: 'Sketch and name a quadrilateral',
        gen() {
          const q = pick(QUAD.slice(0, 6));
          return { prompt: `Sketch a quadrilateral with <b>${q[0]}</b>. Mark its equal sides, parallel sides and right angles, then name it.`,
            mode: 'none', drawSpace: 28, answerHTML: q[1], why: q[2] };
        } },
      { id: 'p-possible', level: 'expected', stmt: 'classify-triangles', label: 'Is the triangle possible?',
        gen() {
          const t = pick(TRI);
          return { prompt: `Is it possible to draw a triangle that is <b>${t[0]}</b> and <b>${t[1]}</b>? If it is, sketch one. If not, explain why not.`,
            mode: 'none', drawSpace: 24, answerHTML: t[2] ? 'Yes' : 'No', why: t[3] };
        } },
      { id: 'p-sketch-quad-e', level: 'expected', stmt: 'classify-quadrilaterals', label: 'Name a quadrilateral from its diagonals or sides',
        gen() {
          const q = pick(QUAD.slice(4));
          return { prompt: `A quadrilateral has <b>${q[0]}</b>. Sketch it and name the most specific quadrilateral it could be.`,
            mode: 'none', drawSpace: 26, answerHTML: q[1], why: q[2] };
        } }
    ]
  });
})();
