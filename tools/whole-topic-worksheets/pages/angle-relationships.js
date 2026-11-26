/* Angle Relationships — MA4-ANG-C-01. Question types from the Revision
   Generator's Stage 4 angles bank (question-banks/angles/), drawn by its
   angle and geometry engines, filed under the four content statements. A
   type that belongs at both levels is listed twice (b-/e- ids). */
const T = (lv, id, label, stmt) => RG.type(BANK_GEN, lv, id, label, stmt);
WSF.page({
  topic: 'Angle Relationships', outcome: 'MA4-ANG-C-01', langKey: 'mmt-ang-ws-lang', bank: false,
  translateTopic: 'Angle Relationships', defaultCount: 12, statements: STATEMENTS,
  paperTypes: [
    T('basic', 'classify-angles', 'Classify angles (acute to revolution)', 'language-notation'),
    T('basic', 'naming-angles', 'Name angles using three letters', 'language-notation'),
    T('basic', 'protractor', 'Read an angle from a protractor', 'language-notation'),
    T('basic', 'right-angle', 'Angles in a right angle', 'angles-at-a-point'),
    T('basic', 'straight-line', 'Angles on a straight line', 'angles-at-a-point'),
    T('basic', 'around-point', 'Angles around a point', 'angles-at-a-point'),
    T('basic', 'vertically-opposite', 'Vertically opposite angles', 'angles-at-a-point'),
    T('basic', 'complementary-supplementary', 'Complementary and supplementary angles', 'reasoning'),

    T('expected', 'naming-angles', 'Name angles using three letters', 'language-notation'),
    T('expected', 'reflex-angles', 'Reflex angles', 'language-notation'),
    T('expected', 'complementary-supplementary', 'Complementary and supplementary angles', 'angles-at-a-point'),
    T('expected', 'around-point', 'Angles around a point', 'angles-at-a-point'),
    T('expected', 'name-angle-pairs', 'Name the angle pair on parallel lines', 'transversals'),
    T('expected', 'parallel-lines', 'Find angles on parallel lines', 'transversals'),
    T('expected', 'are-lines-parallel', 'Are the lines parallel? (with reasons)', 'transversals'),
    T('expected', 'equations-application', 'Form and solve an equation', 'reasoning'),
    T('expected', 'multi-step-parallel', 'Multi-step problems (with reasons)', 'reasoning')
  ]
});
