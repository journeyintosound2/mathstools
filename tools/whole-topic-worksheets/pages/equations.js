/* Equations — MA4-EQU-C-01. Question types from the Revision Generator's
   equations bank (question-banks/equations/) under the three content
   statements. Inequalities are left out: they are Stage 5, not this outcome. */
const T = (lv, id, label, stmt) => RG.type(BANK_GEN, lv, id, label, stmt);
WSF.page({
  topic: 'Equations', outcome: 'MA4-EQU-C-01', langKey: 'mmt-equ-ws-lang', bank: false,
  translateTopic: 'Equations', defaultCount: 12, statements: STATEMENTS,
  paperTypes: [
    T('basic', 'represent', 'Representing equations', 'two-steps'),
    T('basic', 'balance-model', 'Form and solve from a balance', 'two-steps'),
    T('basic', 'inspection', 'Solve by inspection', 'two-steps'),
    T('basic', 'one-step-add-subtract', 'One-step: add and subtract', 'two-steps'),
    T('basic', 'one-step-multiply-divide', 'One-step: multiply and divide', 'two-steps'),
    T('basic', 'two-standard', 'Two-step: ax + b = c', 'two-steps'),
    T('basic', 'bar-model-equation', 'Form an equation from a bar model', 'two-steps'),
    T('basic', 'verify', 'Substitute to check: true or false', 'verify'),
    T('basic', 'word-problems', 'Word problems: form and solve', 'two-steps'),
    T('basic', 'quad-x2', 'Solve x² = c', 'quadratic'),

    T('expected', 'two-standard', 'Two-step: ax + b = c', 'two-steps'),
    T('expected', 'two-frac-var', 'Fraction equations: x/a + b = c', 'two-steps'),
    T('expected', 'two-frac-all', 'Fraction equations: (x + a)/b = c', 'two-steps'),
    T('expected', 'two-brackets', 'Bracket equations: a(x + b) = c', 'two-steps'),
    T('expected', 'collect-like', 'Collect like terms first', 'two-steps'),
    T('expected', 'both-sides', 'Pronumerals on both sides', 'two-steps'),
    T('expected', 'equivalent-equations', 'Equivalent equations (reasoning)', 'two-steps'),
    T('expected', 'verify', 'Substitute to check: true or false', 'verify'),
    T('expected', 'formulas', 'Substitute into a formula', 'verify'),
    T('expected', 'multi-part-equation', 'Form, solve and check', 'verify'),
    T('expected', 'error-spot-equation', 'Spot the error (reasoning)', 'verify'),
    T('expected', 'multi-step-word', 'Multi-step word problems', 'two-steps'),
    T('expected', 'quad-x2', 'Solve x² = c', 'quadratic'),
    T('expected', 'quad-ax2', 'Solve ax² = c', 'quadratic')
  ]
});
