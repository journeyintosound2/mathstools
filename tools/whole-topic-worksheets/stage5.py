#!/usr/bin/env python3
"""Write the Stage 5 page sources (pages/s5-*.js) and their pages.json entries.

One page per Stage 5 outcome (41: 13 Core, 28 Path). Question types come from
the Revision Generator's Stage 5 banks (question-banks/stage-5/*). Every type is
mapped here to ONE content statement of its outcome, and to a level:

    plain id   Basic and Expected (the first steps of the statement)
    +id        Expected only (the rest of the outcome)
    -id        Basic only (a warm-up the Expected paper does not need)

A type can come from ANOTHER bank (bank:id), e.g. Linear Relationships C
borrows the midpoint and distance types from A so the formula statements have
a first step.

    python3 stage5.py <site root>
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/site_full'
QB = os.path.join(SITE, 'assessment/exam-builder/question-banks')
ENG = os.path.join(SITE, 'assessment/exam-builder/engines')

# outcome: (bank, page slug, folder under worksheet-creators, title, Core/Path, {statement: "types"})
OUT = {
 'MA5-FIN-C-01': ('financial-mathematics-a', 'number/financial-mathematics-a', 'Financial Mathematics A: Earning, Spending and Simple Interest', 'Core', {
   'earning': 'hourly-wages overtime-penalty-rates salary-conversions commission piecework-royalties +pay-rise-percent-change +leave-loading +taxable-income +tax-payable-table +net-earnings-after-tax',
   'simple-interest': 'simple-interest simple-interest-total-amount +simple-interest-time-conversion +simple-interest-find-variable +simple-interest-compare +simple-interest-table-graph',
   'spending': 'buying-on-terms compare-payment-options +short-term-loans +best-financial-option'}),
 'MA5-FIN-C-02': ('financial-mathematics-b', 'number/financial-mathematics-b', 'Financial Mathematics B: Compound Interest and Depreciation', 'Core', {
   'compound-depreciation': 'compound-repeated-simple-interest compound-repeated-multiplication compound-formula-future-value compound-interest-earned depreciation-repeated depreciation-formula-value depreciation-amount +compound-compounding-frequency +simple-vs-compound-compare +compound-find-present-value +compound-find-rate-or-time +depreciation-find-rate-or-time'}),
 'MA5-ALG-C-01': ('algebraic-techniques-a', 'algebra/algebraic-techniques-a', 'Algebraic Techniques A: Algebraic Fractions and Expanding', 'Core', {
   'fractions-numerical': 'simplify-algebraic-fractions add-subtract-algebraic-fractions multiply-algebraic-fractions divide-algebraic-fractions +mixed-algebraic-fractions',
   'distributive': 'expand-single-brackets expand-negative-coefficients expand-collect-like-terms factorise-common-factor check-factorisation +factorise-negative-factor +expand-two-brackets +expand-binomial-products +expand-binomial-area-model +expand-and-evaluate +area-expression +mixed-expansion-simplification'}),
 'MA5-ALG-P-01': ('algebraic-techniques-b', 'algebra/algebraic-techniques-b', 'Algebraic Techniques B: Factorising and Binomial Products', 'Path', {
   'fractions-pronumerals': 'multiply-algebraic-fractions divide-algebraic-fractions +add-fractions-pronumeral',
   'common-factor': 'factorise-hcf factorise-negative-hcf factorise-check +factorise-binomial-factor',
   'binomial-monic': 'expand-binomial factorise-area-model factorise-monic +expand-and-simplify +multi-part-algebra-b'}),
 'MA5-ALG-P-02': ('algebraic-techniques-c', 'algebra/algebraic-techniques-c', 'Algebraic Techniques C: Special Products and Factorising', 'Path', {
   'binomial-numerators': 'binomial-numerator-fractions',
   'special-products': 'expand-perfect-square expand-difference-squares factorise-difference-squares factorise-perfect-square special-products-mental +factorise-grouping +factorise-non-monic +factorise-completely +complete-the-square +choose-technique +simplify-by-factorising +multiply-divide-factorising +multi-part-algebra-c'}),
 'MA5-IND-C-01': ('indices-a', 'number/indices-a', 'Indices A: Index Laws, Zero and Negative Indices', 'Core', {
   'variables-zero': 'product-law quotient-law power-of-power zero-index +power-of-quotient',
   'products-quotients': 'several-laws check-the-working +algebraic-fractions-indices +substitute-indices +multi-part-indices-a',
   'negative-numerical': 'negative-index-pattern negative-index-meaning write-negative-index +numerical-laws-negative +evaluate-numerical'}),
 'MA5-IND-P-01': ('indices-b', 'number/indices-b', 'Indices B: Negative Indices in Algebra', 'Path', {
   'negative-algebraic': 'rewrite-positive rewrite-negative product-negative quotient-negative numerical-fractions-negative check-negative-working +power-negative +fraction-negative-power +simplify-negative-fractions +evaluate-negative +multi-part-indices-b'}),
 'MA5-IND-P-02': ('indices-c', 'number/indices-c', 'Indices C: Surds and Fractional Indices', 'Path', {
   'describe-surds': 'rational-or-irrational simplify-surd entire-surd +order-surds',
   'surd-problems': 'add-subtract-surds multiply-surds divide-surds +expand-surds +binomial-surds +rationalise-monomial +rationalise-binomial +surd-measurement +multi-part-surds',
   'fractional-indices': 'fractional-index-evaluate surd-index-form +fractional-index-laws'}),
 'MA5-EQU-C-01': ('equations-a', 'algebra/equations-a', 'Equations A: Linear Equations', 'Core', {
   'three-steps': '-linear-one-step linear-two-step linear-three-step linear-negative-solutions pronumerals-both-sides equations-one-bracket verify-solution-substitution +linear-decimals +mixed-linear-equations +pronumerals-both-sides-constants +pronumerals-both-sides-negative +equations-brackets-both-sides +expand-simplify-solve +mixed-grouping-equations',
   'one-fraction': 'fraction-x-over-number fraction-linear-numerator +fraction-with-constant +mixed-algebraic-fraction-equations',
   'word-problems': 'substitute-formulas-solve write-equation-word-problem number-word-problems +geometry-word-problems +money-sharing-word-problems +mixed-equation-word-problems'}),
 'MA5-EQU-P-01': ('equations-b', 'algebra/equations-b', 'Equations B: Quadratics, Cubics and Inequalities', 'Path', {
   'monic-quadratic': 'x-squared-equals-k null-factor-law solve-monic common-factor-quadratic check-solutions +square-of-binomial +rearrange-then-solve +quadratic-problems',
   'cubic': 'cubic-equations',
   'inequalities': 'solve-inequality read-number-line graph-inequality +inequality-negative +inequality-problems +multi-part-equations-b'}),
 'MA5-EQU-P-02': ('equations-c', 'algebra/equations-c', 'Equations C: Literal, Quadratic and Simultaneous Equations', 'Path', {
   'fractions-more-steps': 'multi-step-linear two-fractions',
   'literal': 'change-subject',
   'quadratic-methods': 'non-monic-solve quadratic-formula-exact quadratic-formula-rounded +complete-square-solve +discriminant +quadratic-applications',
   'simultaneous': 'simultaneous-graphical simultaneous-substitution simultaneous-elimination +simultaneous-problems +multi-part-equations-c'}),
 'MA5-LIN-C-01': ('linear-relationships-a', 'algebra/linear-relationships-a', 'Linear Relationships A: Midpoint, Gradient and Distance', 'Core', {
   'midpoint-gradient': 'midpoint-from-graph midpoint-coordinates gradient-from-graph gradient-two-points gradient-types +find-endpoint +gradient-in-context',
   'distance': 'distance-from-graph distance-coordinates +multi-part-interval',
   'graph-equations': 'table-of-values graph-a-line point-on-line',
   'parallel-horizontal-vertical': 'horizontal-vertical parallel-lines'}),
 'MA5-LIN-C-02': ('linear-relationships-b', 'algebra/linear-relationships-b', 'Linear Relationships B: Gradient–Intercept Form', 'Core', {
   'gradient-intercept': 'read-m-and-c intercepts equation-from-m-c equation-from-graph sketch-from-m-c +rearrange-to-form +equation-point-gradient +equation-two-points +linear-models +multi-part-linear-b',
   'parallel-perpendicular': 'perpendicular-gradient parallel-perpendicular-check parallel-through-point +perpendicular-through-point'}),
 'MA5-LIN-P-01': ('linear-relationships-c', 'algebra/linear-relationships-c', 'Linear Relationships C: Coordinate Geometry and Transformations', 'Path', {
   'midpoint-gradient-formulas': 'linear-relationships-a:midpoint-coordinates linear-relationships-a:gradient-two-points +collinear-points',
   'distance-formula': 'linear-relationships-a:distance-coordinates',
   'forms-of-a-line': 'point-gradient-form general-form +two-points-general +perpendicular-bisector',
   'coordinate-problems': 'unknown-coordinate +triangle-proof +parallelogram-proof +multi-part-coordinate',
   'symmetry': 'rotational-symmetry',
   'transformations': 'translate-coordinates reflect-in-axis rotate-about-origin +describe-transformation'}),
 'MA5-NLI-C-01': ('non-linear-relationships-a', 'algebra/non-linear-relationships-a', 'Non-Linear Relationships A: Tables and Graphs', 'Core', {
   'connections': 'nonlinear-quadratic-table-values nonlinear-exponential-table-values nonlinear-identify-graph-type nonlinear-real-life-contexts +nonlinear-graph-quadratic-from-table +nonlinear-graph-exponential-from-table +nonlinear-match-equation-to-graph +nonlinear-table-patterns'}),
 'MA5-NLI-C-02': ('non-linear-relationships-b', 'algebra/non-linear-relationships-b', 'Non-Linear Relationships B: Parabolas and Exponential Curves', 'Core', {
   'quadratic': 'nonlinear-b-quadratic-features nonlinear-b-compare-parabolas +nonlinear-b-simultaneous-linear-quadratic',
   'exponential': 'nonlinear-b-exponential-features +nonlinear-b-simultaneous-linear-exponential',
   'distinguish': 'nonlinear-b-which-graph nonlinear-b-distinguish-table +nonlinear-b-match-equation-graph +nonlinear-b-real-life-problems'}),
 'MA5-NLI-P-01': ('non-linear-relationships-c', 'algebra/non-linear-relationships-c', 'Non-Linear Relationships C: Parabolas, Hyperbolas, Circles and More', 'Path', {
   'parabolas': 'parabola-features parabola-transformations sketch-parabola +complete-square-vertex +parabola-from-graph',
   'exponentials': 'exponential-features exponential-from-graph',
   'hyperbolas': 'hyperbola-features',
   'circles': 'circle-centre-radius circle-from-graph +circle-complete-square +point-and-circle',
   'distinguish': 'which-graph +line-curve-intersection',
   'polynomial-curves': 'cubic-graphs'}),
 'MA5-RAT-P-01': ('variation-a', 'ratios-rates/variation-and-rates-a', 'Variation and Rates of Change A: Direct and Inverse Variation', 'Path', {
   'variation-problems': 'identify-variation-context identify-variation-table direct-context +inverse-context +change-effect',
   'variation-graphs': 'direct-graph inverse-graph',
   'solve-variation': 'direct-find-k inverse-find-k complete-variation-table +power-variation +variation-multi-part'}),
 'MA5-RAT-P-02': ('variation-b', 'ratios-rates/variation-and-rates-b', 'Variation and Rates of Change B: Rates of Change', 'Path', {
   'constant-rate': 'gradient-as-rate convert-rates travel-graph-speeds +travel-graph-interpret +compare-rates-graph',
   'variable-rates': 'describe-variable-rate average-rate-table container-filling +average-rate-curve',
   'construct-graphs': 'story-to-graph sketch-from-story +rates-multi-part'}),
 'MA5-POL-P-01': ('polynomials', 'algebra/polynomials', 'Polynomials', 'Path', {
   'define-operate': 'polynomial-vocabulary evaluate-polynomial add-subtract-polynomials +multiply-polynomials',
   'divide': 'divide-polynomial',
   'factor-remainder': 'remainder-theorem factor-theorem +find-unknown-coefficient +factorise-cubic +solve-cubic',
   'graph': 'polynomial-graph-features which-polynomial-graph +polynomial-from-graph'}),
 'MA5-LOG-P-01': ('logarithms', 'algebra/logarithms', 'Logarithms', 'Path', {
   'examine': 'index-to-log log-to-index evaluate-log +log-graph +log-true-false',
   'laws': 'log-laws-combine log-laws-evaluate exponential-same-base +log-laws-expand +log-laws-in-terms +solve-log-equation +exponential-with-logs +log-growth-decay'}),
 'MA5-FNC-P-01': ('functions-graphs', 'algebra/functions-and-other-graphs', 'Functions and Other Graphs', 'Path', {
   'relations-functions': 'function-ordered-pairs vertical-line-test evaluate-function +substitute-expression +solve-f-equals-k',
   'domain-range': 'domain-range-graph domain-range-equation +function-multi-part',
   'inequality-regions': 'test-point-region graph-inequality-region +inequality-from-region +multiple-inequalities'}),
 'MA5-MAG-C-01': ('numbers-of-any-magnitude', 'number/numbers-of-any-magnitude', 'Numbers of Any Magnitude', 'Core', {
   'small-large': 'si-prefixes convert-prefixes +magnitude-contexts',
   'error': 'absolute-error percentage-error +bounds-calculations',
   'rounding': 'count-sig-figs round-sig-figs',
   'scientific-notation': 'write-scientific scientific-to-decimal calculator-display +order-scientific +calculate-scientific +multi-part-magnitude'}),
 'MA5-TRG-C-01': ('trigonometry-a', 'measurement-space/trigonometry-a', 'Trigonometry A: Right-Angled Triangles', 'Core', {
   'constancy': 'identify-hoa match-trig-ratios similar-constant-ratios +approximate-trig-ratios',
   'right-triangles': 'choose-the-ratio write-trig-equation find-unknown-side find-unknown-angle +degrees-minutes +practical-problems +pythagoras-then-ratio +shared-side-triangles +isosceles-split +mixed-trigonometry'}),
 'MA5-TRG-C-02': ('trigonometry-b', 'measurement-space/trigonometry-b', 'Trigonometry B: Elevation, Depression and Bearings', 'Core', {
   'elevation-depression': 'identify-elevation-depression elevation-problems depression-problems',
   'bearings': 'true-bearings compass-bearings convert-bearings +reverse-bearings +bearing-practical-with-diagram +bearing-practical-no-diagram +bearing-distance +bearing-angle +mixed-bearings'}),
 'MA5-TRG-P-01': ('trigonometry-c', 'measurement-space/trigonometry-c', 'Trigonometry C: Non-Right-Angled Triangles and 3D Problems', 'Path', {
   'three-dimensional': 'rectangular-prism-3d +three-dimensional-elevation-bearing +three-dimensional-practical',
   'sine-cosine-area': 'sine-rule-side cosine-rule-side area-rule-triangle +sine-rule-angle +cosine-rule-angle +mixed-non-right-trig'}),
 'MA5-TRG-P-02': ('trigonometry-d', 'measurement-space/trigonometry-d', 'Trigonometry D: The Unit Circle and Trigonometric Equations', 'Path', {
   'unit-circle': 'unit-circle-coordinates quadrant-signs related-angle exact-values +exact-values-any-angle +given-one-ratio +trig-graph-features +which-trig-graph',
   'trig-equations': 'supplementary-complementary solve-from-graph +solve-exact +solve-calculator +obtuse-angle-triangle'}),
 'MA5-ARE-C-01': ('area-and-surface-area-a', 'measurement-space/area-and-surface-area-a', 'Area and Surface Area A: Composite Areas, Prisms and Cylinders', 'Core', {
   'areas-surface-areas': 'rectilinear-composite-area shaded-area composite-area-circles identify-prism-faces recognise-valid-nets surface-area-from-net rectangular-prism-surface-area triangular-prism-surface-area +trapezoidal-prism-surface-area +composite-prism-surface-area +practical-area-applications',
   'cylinder-formula': 'curved-surface-area-cylinder closed-cylinder-surface-area cylinder-net-surface-area',
   'cylinder-composite': 'half-cylinder-surface-area +composite-cylinder-surface-area +practical-cylinder-surface-area'}),
 'MA5-ARE-P-01': ('area-and-surface-area-b', 'measurement-space/area-and-surface-area-b', 'Area and Surface Area B: Pyramids, Cones and Spheres', 'Path', {
   'surface-areas': 'square-pyramid-sa cone-curved-sa cone-total-sa sphere-sa hemisphere-sa +pyramid-sa-find-slant +rectangular-pyramid-sa +cone-find-slant +composite-solid-sa +sa-find-dimension +sa-practical'}),
 'MA5-VOL-C-01': ('volume-a', 'measurement-space/volume-a', 'Volume A: Prisms, Cylinders and Composite Solids', 'Core', {
   'composite-solids': 'rectangular-prisms uniform-cross-section triangular-prisms quadrilateral-prisms cylinders volume-unit-conversions +prism-find-dimension +cylinder-find-dimension +composite-prisms +part-circle-prisms +composite-cylinders +composite-prisms-cylinders +practical-capacity'}),
 'MA5-VOL-P-01': ('volume-b', 'measurement-space/volume-b', 'Volume B: Pyramids, Cones and Spheres', 'Path', {
   'volumes': 'pyramid-volume cone-volume sphere-volume hemisphere-volume cone-cylinder-compare +pyramid-volume-slant +cone-volume-slant +composite-volume +volume-removed +volume-find-dimension +volume-capacity +volume-practical'}),
 'MA5-GEO-C-01': ('geometrical-figures-a', 'measurement-space/geometrical-figures-a', 'Properties of Geometrical Figures A: Similar Figures and Scale', 'Core', {
   'similar-properties': 'similar-angles are-they-similar +nested-triangles',
   'scale-factors': 'scale-factor similar-unknown-side map-scale-real map-scale-drawn +similar-two-sides +find-the-scale +shadow-problems +similar-area-volume'}),
 'MA5-GEO-P-01': ('geometrical-figures-b', 'measurement-space/geometrical-figures-b', 'Properties of Geometrical Figures B: Congruence, Similarity and Reasoning', 'Path', {
   'congruence': 'congruence-statement',
   'congruent-triangles': 'congruence-test congruent-unknowns +not-a-test',
   'similar-triangles': 'similarity-test similar-by-ratios',
   'similar-shapes-solids': 'geometrical-figures-a:similar-area-volume +geometrical-figures-a:similar-two-sides',
   'numerical-reasoning': 'angle-reasoning-isosceles angle-reasoning-parallel polygon-angles +exterior-angle'}),
 'MA5-GEO-P-02': ('geometrical-figures-c', 'measurement-space/geometrical-figures-c', 'Properties of Geometrical Figures C: Geometric Proofs', 'Path', {
   'proofs': 'missing-reason quadrilateral-properties parallelogram-tests prove-congruent +prove-then-deduce +prove-similar +prove-quadrilateral-property +prove-isosceles-property'}),
 'MA5-CIR-P-01': ('circle-geometry', 'measurement-space/circle-geometry', 'Circle Geometry', 'Path', {
   'angle-chord': 'circle-vocabulary chord-perpendicular angle-at-centre angle-semicircle same-segment +cyclic-quadrilateral +cyclic-exterior +intersecting-chords',
   'tangent-secant': 'tangent-radius two-tangents +alternate-segment +secants-tangents'}),
 'MA5-NET-P-01': ('introduction-to-networks', 'measurement-space/introduction-to-networks', 'Introduction to Networks', 'Path', {
   'graphs-networks': 'network-definition vertices-edges-degree sum-of-degrees real-world-applications network-from-table +same-graph-different-drawings +weighted-route-length +weighted-shortest-path',
   'planar-euler': 'planar-and-non-planar faces-and-euler-formula',
   'eulerian': 'connected-walk-trail-path-cycle eulerian-trails-circuits konigsberg-bridges'}),
 'MA5-DAT-C-01': ('data-analysis-a', 'statistics-probability/data-analysis-a', 'Data Analysis A: Quartiles, Box Plots and Standard Deviation', 'Core', {
   'standard-deviation': 'interpret-sd standard-deviation +effect-on-statistics',
   'quartiles-iqr': 'quartiles-iqr-list five-number-summary +quartiles-stem-leaf +outliers',
   'box-plots': 'read-box-plot draw-box-plot +parallel-box-plots +skewness +compare-datasets'}),
 'MA5-DAT-C-02': ('data-analysis-b', 'statistics-probability/data-analysis-b', 'Data Analysis B: Bivariate Data', 'Core', {
   'describe-bivariate': 'identify-variables describe-association +causation',
   'scatter-plots': 'read-scatter plot-scatter +line-of-best-fit-equation',
   'interpret-bivariate': 'predict-from-line interpolate-extrapolate +scatter-outlier'}),
 'MA5-DAT-P-01': ('data-analysis-c', 'statistics-probability/data-analysis-c', 'Data Analysis C: Statistical Inquiries and Media Reports', 'Path', {
   'plan-inquiry': 'population-sample sampling-method primary-secondary question-wording +stratified-sample +systematic-sample +plan-inquiry',
   'media-reports': 'misleading-graph identify-bias +evaluate-claim'}),
 'MA5-PRO-C-01': ('probability-a', 'statistics-probability/probability-a', 'Probability A: Multistage Chance Experiments', 'Core', {
   'multistage': 'list-sample-space two-dice-grid complete-tree +with-vs-without',
   'multistage-problems': 'tree-independent tree-without-replacement +at-least-one +three-stage',
   'simulations': 'relative-frequency expected-frequency'}),
 'MA5-PRO-P-01': ('probability-b', 'statistics-probability/probability-b', 'Probability B: Venn Diagrams, Two-Way Tables and Conditional Probability', 'Path', {
   'venn-two-way': 'read-venn complete-venn venn-probability two-way-table shade-venn +three-set-venn +table-to-venn',
   'conditional-language': 'conditional-venn conditional-table',
   'mutually-exclusive': 'mutually-exclusive addition-rule'}),
}


def bank_info(bank):
    d = os.path.join(QB, 'stage-5', bank)
    txt = ''.join(open(os.path.join(d, f), encoding='utf-8').read() for f in sorted(os.listdir(d)) if f.endswith('.js'))
    main = open(os.path.join(d, 'index.js'), encoding='utf-8').read()
    fn = re.search(r'export function (generate\w+Questions)', main).group(1)
    labels = dict(re.findall(r'\{ id: "([a-z0-9-]+)", label: "([^"]+)"', txt))
    return fn, labels


def engines_of(banks):
    """engine files the banks name (plus the plane engine every Stage 5 graph uses)"""
    files = {f.replace('.js', ''): sub + '/' + f for sub in os.listdir(ENG) if os.path.isdir(os.path.join(ENG, sub))
             for f in os.listdir(os.path.join(ENG, sub)) if f.endswith('-engine.js')}
    names = set()
    for b in banks:
        d = os.path.join(QB, 'stage-5', b)
        for f in os.listdir(d):
            if f.endswith('.js'):
                names |= set(re.findall(r'engine:\s*"([a-z-]+)"', open(os.path.join(d, f), encoding='utf-8').read()))
    names.add('plane-engine')
    out = []
    for n in sorted(names):
        key = n if n.endswith('-engine') else n + '-engine'
        if key in files: out.append(files[key])
        else: print('  ! no engine file for', n)
    return out


def alias(bank): return 'G_' + re.sub(r'[^A-Z0-9]', '_', bank.upper())


def lower1(s): return s[0].lower() + s[1:]


def main():
    pages = json.load(open(os.path.join(HERE, 'pages.json')))
    stm = json.loads(os.popen("node -e \"global.window={};require('%s/resources/contentStatements.js');process.stdout.write(JSON.stringify(window.MMT_CONTENT.statements))\"" % SITE).read())
    total = 0
    for oc, (bank, folder, title, kind, spec) in OUT.items():
        slug = 's5-' + bank
        sids = [s['id'] for s in stm[oc]]
        assert sorted(spec) == sorted(sids), (oc, sorted(spec), sorted(sids))
        rows, used = [], [bank]
        for sid in sids:                       # syllabus order
            for tok in spec[sid].split():
                lv = 'E' if tok[0] == '+' else ('B0' if tok[0] == '-' else 'B')
                tok = tok.lstrip('+-')
                b, tid = (tok.split(':') if ':' in tok else (bank, tok))
                if b not in used: used.append(b)
                rows.append((b, tid, lv, sid))
        info = {b: bank_info(b) for b in used}
        seen = set()
        for b, tid, lv, sid in rows:
            assert tid in info[b][1], (oc, b, tid)
            assert tid not in seen, (oc, 'duplicate', tid); seen.add(tid)
        # every type of the page's own bank is used
        missing = set(info[bank][1]) - {t for b, t, *_ in rows if b == bank}
        assert not missing, (oc, 'unmapped', sorted(missing))
        js = ['/* %s — %s (%s). BUILT by stage5.py: types from the Revision Generator Stage 5' % (title, oc, kind),
              '   banks, mapped to this outcome\'s content statements. Basic = the first steps of each',
              '   statement; Expected = the whole outcome. */',
              'const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);']
        items = []
        for b, tid, lv, sid in rows:
            label = info[b][1][tid]
            for L in (['basic', 'expected'] if lv == 'B' else ['basic'] if lv == 'B0' else ['expected']):
                items.append((L, "  T(%s, '%s', '%s', %s, '%s')" % (alias(b), L, tid, json.dumps(label, ensure_ascii=False), sid)))
        items.sort(key=lambda x: 0 if x[0] == 'basic' else 1)
        total += len(rows)
        st = [s['text'] for s in stm[oc]]
        exp_only = [info[b][1][t] for b, t, lv, _ in rows if lv == 'E']
        extra = ', '.join(lower1(x) for x in exp_only[:5]) + (' and more' if len(exp_only) > 5 else '')
        sub = ('<strong>%s outcome.</strong> %s. <strong>Basic</strong> keeps to the first steps of each content statement; '
               '<strong>Expected</strong> is the whole outcome%s.') % (
            kind, '; '.join(st[:1] + [lower1(x) for x in st[1:]]), (', adding ' + extra) if exp_only else '')
        js.append("WSF.page({\n  topic: %s, outcome: '%s', langKey: 'mmt-%s-ws-lang', bank: false, noLanguage: true,\n  defaultCount: 12, statements: STATEMENTS,\n  paperTypes: [\n%s\n  ]\n});\n"
                  % (json.dumps(title, ensure_ascii=False), oc, slug, ',\n'.join(i[1] for i in items)))
        open(os.path.join(HERE, 'pages', slug + '.js'), 'w', encoding='utf-8').write('\n'.join(js))
        pages[slug] = {'outcome': oc, 'topic': title, 'folder': 'stage-5/' + folder, 'engines': engines_of(used), 'subtitle': sub,
                       'rg': {'banks': [['stage-5/%s/index.js' % b, info[b][0], alias(b)] for b in used]}}
    json.dump(pages, open(os.path.join(HERE, 'pages.json'), 'w'), indent=1, ensure_ascii=False)
    print(len(OUT), 'Stage 5 pages written,', total, 'types mapped')


if __name__ == '__main__':
    main()
