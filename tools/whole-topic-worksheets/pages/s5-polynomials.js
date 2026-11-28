/* Polynomials — MA5-POL-P-01 (Path). BUILT by stage5.py: types from the Revision Generator Stage 5
   banks, mapped to this outcome's content statements. Basic = the first steps of each
   statement; Expected = the whole outcome. */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Polynomials", outcome: 'MA5-POL-P-01', langKey: 'mmt-s5-polynomials-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  paperTypes: [
  T(G_POLYNOMIALS, 'basic', 'polynomial-vocabulary', "Degree, leading coefficient, constant term", 'define-operate'),
  T(G_POLYNOMIALS, 'basic', 'evaluate-polynomial', "Evaluate P(a)", 'define-operate'),
  T(G_POLYNOMIALS, 'basic', 'add-subtract-polynomials', "Add and subtract polynomials", 'define-operate'),
  T(G_POLYNOMIALS, 'basic', 'divide-polynomial', "Divide a polynomial by (x − a)", 'divide'),
  T(G_POLYNOMIALS, 'basic', 'remainder-theorem', "The remainder theorem", 'factor-remainder'),
  T(G_POLYNOMIALS, 'basic', 'factor-theorem', "The factor theorem", 'factor-remainder'),
  T(G_POLYNOMIALS, 'basic', 'polynomial-graph-features', "Graphs from factored form", 'graph'),
  T(G_POLYNOMIALS, 'basic', 'which-polynomial-graph', "Match a polynomial to its graph (A–D)", 'graph'),
  T(G_POLYNOMIALS, 'expected', 'polynomial-vocabulary', "Degree, leading coefficient, constant term", 'define-operate'),
  T(G_POLYNOMIALS, 'expected', 'evaluate-polynomial', "Evaluate P(a)", 'define-operate'),
  T(G_POLYNOMIALS, 'expected', 'add-subtract-polynomials', "Add and subtract polynomials", 'define-operate'),
  T(G_POLYNOMIALS, 'expected', 'multiply-polynomials', "Multiply polynomials", 'define-operate'),
  T(G_POLYNOMIALS, 'expected', 'divide-polynomial', "Divide a polynomial by (x − a)", 'divide'),
  T(G_POLYNOMIALS, 'expected', 'remainder-theorem', "The remainder theorem", 'factor-remainder'),
  T(G_POLYNOMIALS, 'expected', 'factor-theorem', "The factor theorem", 'factor-remainder'),
  T(G_POLYNOMIALS, 'expected', 'find-unknown-coefficient', "Find an unknown coefficient", 'factor-remainder'),
  T(G_POLYNOMIALS, 'expected', 'factorise-cubic', "Factorise a cubic", 'factor-remainder'),
  T(G_POLYNOMIALS, 'expected', 'solve-cubic', "Solve a cubic equation", 'factor-remainder'),
  T(G_POLYNOMIALS, 'expected', 'polynomial-graph-features', "Graphs from factored form", 'graph'),
  T(G_POLYNOMIALS, 'expected', 'which-polynomial-graph', "Match a polynomial to its graph (A–D)", 'graph'),
  T(G_POLYNOMIALS, 'expected', 'polynomial-from-graph', "Find a polynomial's equation from its graph", 'graph')
  ]
});
