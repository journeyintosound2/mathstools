/* Fractions: Fractions of Quantities — MA3-RQF-02. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Fractions: Fractions of Quantities", outcome: 'MA3-RQF-02', langKey: 'mmt-s3-fraction-quantities-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Part B" },
  paperTypes: [
  T(G_FR, 'expected', 'build-to-whole', "Build up to the whole", 'build-whole'),
  T(G_FR, 'expected', 'fraction-of-quantity', "Fraction of a quantity", 'fraction-of-quantity'),
  T(G_FR, 'expected', 'fraction-of-collection', "A fraction of a collection (counters)", 'fraction-of-quantity'),
  T(G_FR, 'expected', 'name-fraction-set', "Fraction of a group", 'fraction-of-quantity'),
  T(G_FR, 'expected', 'fraction-of-measure', "Fraction of a measurement", 'fraction-of-quantity'),
  T(G_FR, 'expected', 'multi-part-fractions', "Multi-part fraction problem", 'fraction-of-quantity')
  ]
});
