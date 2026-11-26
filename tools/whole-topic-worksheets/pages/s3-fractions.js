/* Fractions: Comparing, Adding and Subtracting — MA3-RQF-01. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Fractions: Comparing, Adding and Subtracting", outcome: 'MA3-RQF-01', langKey: 'mmt-s3-fractions-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  paperTypes: [
  T(G_FR, 'basic', 'name-fraction-bar', "Name the fraction (bar)", 'one-whole'),
  T(G_FR, 'basic', 'name-fraction-circle', "Name the fraction (circle)", 'one-whole'),
  T(G_FR, 'basic', 'shade-fraction', "Shade a fraction", 'one-whole'),
  T(G_FR, 'basic', 'fraction-number-line', "Fractions on a number line", 'one-whole'),
  T(G_FR, 'basic', 'mixed-numerals-bars', "Fractions greater than one (bars)", 'one-whole'),
  T(G_FR, 'basic', 'compare-unit-fractions', "Compare unit fractions", 'unit-fractions'),
  T(G_FR, 'basic', 'add-same-denominator', "Add fractions (same denominator)", 'add-same-denominator'),
  T(G_FR, 'basic', 'subtract-same-denominator', "Subtract fractions (same denominator)", 'add-same-denominator'),
  T(G_FR, 'expected', 'name-fraction-bar', "Name the fraction (bar)", 'one-whole'),
  T(G_FR, 'expected', 'name-fraction-circle', "Name the fraction (circle)", 'one-whole'),
  T(G_FR, 'expected', 'shade-fraction', "Shade a fraction", 'one-whole'),
  T(G_FR, 'expected', 'fraction-number-line', "Fractions on a number line", 'one-whole'),
  T(G_FR, 'expected', 'mixed-numerals-bars', "Fractions greater than one (bars)", 'one-whole'),
  T(G_FR, 'expected', 'compare-unit-fractions', "Compare unit fractions", 'unit-fractions'),
  T(G_FR, 'expected', 'add-same-denominator', "Add fractions (same denominator)", 'add-same-denominator'),
  T(G_FR, 'expected', 'subtract-same-denominator', "Subtract fractions (same denominator)", 'add-same-denominator'),
  T(G_FR, 'expected', 'fraction-as-division', "A fraction as a division", 'fraction-division'),
  T(G_FR, 'expected', 'compare-related-fractions', "Compare related fractions", 'related-denominators'),
  T(G_FR, 'expected', 'compare-with-bars', "Compare fractions using bars", 'related-denominators'),
  T(G_FR, 'expected', 'order-fractions', "Order fractions", 'related-denominators'),
  T(G_FR, 'expected', 'equivalent-fractions', "Equivalent fractions", 'equivalence-add'),
  T(G_FR, 'expected', 'add-with-bars', "Add fractions using bars", 'equivalence-add'),
  T(G_FR, 'expected', 'add-related-denominators', "Add fractions (related denominators)", 'equivalence-add')
  ]
});
