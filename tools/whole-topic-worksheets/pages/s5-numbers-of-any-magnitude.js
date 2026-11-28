/* Numbers of Any Magnitude — MA5-MAG-C-01 (Core). BUILT by stage5.py: types from the Revision Generator Stage 5
   banks, mapped to this outcome's content statements. Basic = the first steps of each
   statement; Expected = the whole outcome. */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Numbers of Any Magnitude", outcome: 'MA5-MAG-C-01', langKey: 'mmt-s5-numbers-of-any-magnitude-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  paperTypes: [
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'basic', 'si-prefixes', "SI prefixes (nano to tera)", 'small-large'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'basic', 'convert-prefixes', "Convert very large and very small units", 'small-large'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'basic', 'absolute-error', "Absolute error and limits of accuracy", 'error'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'basic', 'percentage-error', "Percentage error", 'error'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'basic', 'count-sig-figs', "Count significant figures", 'rounding'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'basic', 'round-sig-figs', "Round to significant figures", 'rounding'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'basic', 'write-scientific', "Write in scientific notation", 'scientific-notation'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'basic', 'scientific-to-decimal', "Scientific notation to a decimal", 'scientific-notation'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'basic', 'calculator-display', "Read a calculator display", 'scientific-notation'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'expected', 'si-prefixes', "SI prefixes (nano to tera)", 'small-large'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'expected', 'convert-prefixes', "Convert very large and very small units", 'small-large'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'expected', 'magnitude-contexts', "Very large and very small quantities in context", 'small-large'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'expected', 'absolute-error', "Absolute error and limits of accuracy", 'error'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'expected', 'percentage-error', "Percentage error", 'error'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'expected', 'bounds-calculations', "Upper and lower bounds in calculations", 'error'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'expected', 'count-sig-figs', "Count significant figures", 'rounding'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'expected', 'round-sig-figs', "Round to significant figures", 'rounding'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'expected', 'write-scientific', "Write in scientific notation", 'scientific-notation'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'expected', 'scientific-to-decimal', "Scientific notation to a decimal", 'scientific-notation'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'expected', 'calculator-display', "Read a calculator display", 'scientific-notation'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'expected', 'order-scientific', "Compare and order numbers in scientific notation", 'scientific-notation'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'expected', 'calculate-scientific', "Calculate with scientific notation", 'scientific-notation'),
  T(G_NUMBERS_OF_ANY_MAGNITUDE, 'expected', 'multi-part-magnitude', "Multi-part scientific notation problem", 'scientific-notation')
  ]
});
