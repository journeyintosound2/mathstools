#!/usr/bin/env python3
"""Write the Stage 3 page sources (pages/s3-*.js) and their pages.json entries.

Each Stage 3 outcome gets its own page. Question types come from the
Revision Generator's Stage 3 banks (one bank can serve several outcomes, so
every type is mapped here to ONE outcome and ONE content statement). Levels
are the syllabus parts: "Part A" (A statements) and "Parts A and B" (all).

    python3 stage3.py <site root>
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/site'
QB = os.path.join(SITE, 'assessment/exam-builder/question-banks')

BANKS = {
    'rn': ('stage-3/represents-numbers/index.js', 'generateRepresentsNumbersQuestions'),
    'ar': ('stage-3/additive-relations/index.js', 'generateAdditiveRelationsQuestions'),
    'mr': ('stage-3/multiplicative-relations/index.js', 'generateMultiplicativeRelationsQuestions'),
    'fr': ('stage-3/fractions/index.js', 'generateStage3FractionsQuestions'),
    'gm': ('stage-3/geometric-measure/index.js', 'generateStage3GeometricMeasureQuestions'),
    '2d': ('stage-3/two-d-space-area/index.js', 'generateStage3TwoDQuestions'),
    '3d': ('stage-3/three-d-space-volume/index.js', 'generateStage3ThreeDQuestions'),
    'mt': ('stage-3/mass-time/index.js', 'generateStage3MassTimeQuestions'),
    'da': ('stage-3/data/index.js', 'generateStage3DataQuestions'),
    'ch': ('stage-3/chance/index.js', 'generateStage3ChanceQuestions'),
    'an4': ('angles/index.js', 'generateAngleQuestions'),
}
ENGINES = ['bar-model/bar-model-engine.js', 'grid/grid-engine.js', 'manipulatives/manipulatives-engine.js',
           'measure/measure-engine.js', 'open-number-line/open-number-line-engine.js', 'probability/probability-engine.js',
           'solids/solids-engine.js', 'statistics/statistics-engine.js']
EXTRA_ENG = {'rn': ['fdp/fdp-engine.js', 'integers/integer-engine.js'], 'fr': ['fdp/fdp-engine.js'],
             'gm': ['angles/angle-engine.js', 'geometry/geometry-engine.js', 'length/length-engine.js', 'linear/linear-engine.js'],
             'mr': ['array-area/array-area-engine.js'], '2d': ['area/area-engine.js', 'geometry/geometry-engine.js'],
             '3d': ['volume/volume-engine.js'], 'an4': ['angles/angle-engine.js', 'geometry/geometry-engine.js']}

# outcome: (slug, folder, title, [(bank, type id, part, statement id), ...], extra page code)
OUT = {
 'MA3-RN-01': ('s3-whole-numbers', 'stage-3/number/whole-numbers-integers', 'Represents Numbers: Whole Numbers and Integers', [
    ('rn', 'read-millions', 'A', 'millions'), ('rn', 'order-millions', 'A', 'millions'), ('rn', 'place-value-large', 'A', 'millions'),
    ('rn', 'round-large', 'A', 'millions'), ('rn', 'regroup-thousands', 'A', 'partition-billion'), ('rn', 'partition-nonstandard', 'A', 'partition-billion'),
    ('rn', 'integer-number-line', 'B', 'integers'), ('rn', 'thermometer-negative', 'B', 'integers')]),
 'MA3-RN-02': ('s3-decimals', 'stage-3/number/decimals', 'Represents Numbers: Decimals', [
    ('rn', 'decimal-place-value', 'A', 'beyond-hundredths'), ('rn', 'hundred-grid', 'A', 'beyond-hundredths'),
    ('rn', 'compare-decimals', 'A', 'compare-decimals'), ('rn', 'order-decimals', 'A', 'compare-decimals'), ('rn', 'decimal-number-line', 'A', 'compare-decimals')]),
 'MA3-RN-03': ('s3-percentages', 'stage-3/number/percentages', 'Represents Numbers: Percentages', [
    ('rn', 'benchmark-equivalents', 'B', 'benchmark'), ('rn', 'benchmark-grid', 'B', 'benchmark'), ('rn', 'percent-of-quantity', 'B', 'benchmark'),
    ('rn', 'percentage-discount', 'B', 'discounts'), ('rn', 'multi-part-number', 'B', 'discounts')]),
 'MA3-AR-01': ('s3-additive', 'stage-3/number/additive-relations', 'Additive Relations', [
    ('ar', 'add-multidigit', 'A', 'mental-written'), ('ar', 'subtract-multidigit', 'A', 'mental-written'), ('ar', 'add-three-numbers', 'A', 'mental-written'),
    ('ar', 'missing-addend', 'A', 'mental-written'), ('ar', 'onl-bridging-add', 'A', 'mental-written'), ('ar', 'onl-jump-add', 'A', 'mental-written'),
    ('ar', 'onl-jumping-over-add', 'A', 'mental-written'), ('ar', 'onl-bridging-sub', 'A', 'mental-written'), ('ar', 'onl-counting-up', 'A', 'mental-written'),
    ('ar', 'bar-model-total', 'A', 'mental-written'), ('ar', 'bar-model-part', 'A', 'mental-written'), ('ar', 'bar-model-compare', 'A', 'mental-written'),
    ('ar', 'word-problem', 'A', 'mental-written'), ('ar', 'estimate-sum', 'A', 'estimation'), ('ar', 'is-it-reasonable', 'A', 'estimation'),
    ('ar', 'choose-strategy', 'B', 'choose-strategies'), ('ar', 'constant-difference', 'B', 'choose-strategies'), ('ar', 'bridging', 'B', 'choose-strategies'),
    ('ar', 'onl-constant-difference', 'B', 'choose-strategies'), ('ar', 'onl-draw-your-own', 'B', 'choose-strategies'), ('ar', 'calculator-or-not', 'B', 'choose-strategies'),
    ('ar', 'bar-model-draw', 'B', 'choose-strategies'), ('ar', 'multistep-word', 'B', 'choose-strategies'),
    ('ar', 'add-decimals', 'B', 'decimals'), ('ar', 'subtract-decimals', 'B', 'decimals'), ('ar', 'money-totals', 'B', 'decimals'), ('ar', 'bar-model-decimals', 'B', 'decimals')]),
 'MA3-MR-01': ('s3-multiply-divide', 'stage-3/number/multiplying-dividing', 'Multiplicative Relations: Multiplying and Dividing', [
    ('mr', 'array-product', 'A', 'products-factors'), ('mr', 'array-commutative', 'A', 'products-factors'), ('mr', 'factor-rectangles', 'A', 'products-factors'),
    ('mr', 'prime-composite-arrays', 'A', 'products-factors'), ('mr', 'square-numbers', 'A', 'products-factors'), ('mr', 'missing-factor-pair', 'A', 'products-factors'),
    ('mr', 'partition-to-multiply', 'A', 'partition-multiply'), ('mr', 'build-area-model', 'A', 'partition-multiply'), ('mr', 'area-model-3-digit', 'A', 'partition-multiply'),
    ('mr', 'area-model-read', 'A', 'partition-multiply'), ('mr', 'area-model-2x2', 'A', 'multiply-2-digit'),
    ('mr', 'division-model-remainder', 'A', 'remainders'), ('mr', 'interpret-remainder', 'A', 'remainders'),
    ('mr', 'division-model', 'A', 'divide-1-digit'), ('mr', 'divide-3-digit', 'A', 'divide-1-digit'),
    ('mr', 'estimate-product', 'A', 'estimate-check'), ('mr', 'estimate-quotient', 'A', 'estimate-check'),
    ('mr', 'multi-part-multiplicative', 'B', 'whole-numbers'), ('mr', 'powers-of-ten', 'B', 'powers-of-10')]),
 'MA3-MR-02': ('s3-number-sentences', 'stage-3/number/number-sentences-patterns', 'Multiplicative Relations: Number Sentences and Patterns', [
    ('mr', 'equivalent-sentence', 'B', 'equivalent-sentences'), ('mr', 'unknown-factor', 'B', 'equivalent-sentences'),
    ('mr', 'multiples-pattern', 'B', 'patterns-multiples'), ('mr', 'common-multiples', 'B', 'patterns-multiples'), ('mr', 'order-of-operations', 'B', 'brackets-order')]),
 'MA3-RQF-01': ('s3-fractions', 'stage-3/number/fractions', 'Fractions: Comparing, Adding and Subtracting', [
    ('fr', 'name-fraction-bar', 'A', 'one-whole'), ('fr', 'name-fraction-circle', 'A', 'one-whole'), ('fr', 'shade-fraction', 'A', 'one-whole'),
    ('fr', 'fraction-number-line', 'A', 'one-whole'), ('fr', 'mixed-numerals-bars', 'A', 'one-whole'), ('fr', 'compare-unit-fractions', 'A', 'unit-fractions'),
    ('fr', 'add-same-denominator', 'A', 'add-same-denominator'), ('fr', 'subtract-same-denominator', 'A', 'add-same-denominator'),
    ('fr', 'fraction-as-division', 'B', 'fraction-division'), ('fr', 'compare-related-fractions', 'B', 'related-denominators'),
    ('fr', 'compare-with-bars', 'B', 'related-denominators'), ('fr', 'order-fractions', 'B', 'related-denominators'),
    ('fr', 'equivalent-fractions', 'B', 'equivalence-add'), ('fr', 'add-with-bars', 'B', 'equivalence-add'), ('fr', 'add-related-denominators', 'B', 'equivalence-add')]),
 'MA3-RQF-02': ('s3-fraction-quantities', 'stage-3/number/fractions-of-quantities', 'Fractions: Fractions of Quantities', [
    ('fr', 'build-to-whole', 'B', 'build-whole'), ('fr', 'fraction-of-quantity', 'B', 'fraction-of-quantity'), ('fr', 'fraction-of-collection', 'B', 'fraction-of-quantity'),
    ('fr', 'name-fraction-set', 'B', 'fraction-of-quantity'), ('fr', 'fraction-of-measure', 'B', 'fraction-of-quantity'), ('fr', 'multi-part-fractions', 'B', 'fraction-of-quantity')]),
 'MA3-GM-01': ('s3-position', 'stage-3/measurement-space/position', 'Geometric Measure: Position', [
    ('gm', 'grid-map-read', 'A', 'cartesian'), ('gm', 'grid-map-give', 'A', 'cartesian'), ('gm', 'read-coordinates', 'A', 'cartesian'),
    ('gm', 'plot-point', 'A', 'cartesian'), ('gm', 'coordinate-vs-grid-map', 'A', 'cartesian'), ('gm', 'lines-not-spaces', 'A', 'cartesian'),
    ('gm', 'four-quadrants', 'B', 'four-quadrants')]),
 'MA3-GM-02': ('s3-length', 'stage-3/measurement-space/length', 'Geometric Measure: Length', [
    ('gm', 'metre-kilometre', 'A', 'metres-km'), ('gm', 'choose-length-unit', 'A', 'metres-km'),
    ('gm', 'perimeter-rectangle', 'A', 'perimeters'), ('gm', 'perimeter-polygon', 'A', 'perimeters'), ('gm', 'perimeter-missing-side', 'A', 'perimeters'),
    ('gm', 'decimal-length', 'B', 'decimal-metric'), ('gm', 'convert-length', 'B', 'convert-length'), ('gm', 'multi-part-perimeter', 'B', 'compare-lengths'),
    ('paper', 'p-order-lengths', 'B', 'compare-lengths')]),
 'MA3-GM-03': ('s3-angles', 'stage-3/measurement-space/angles', 'Geometric Measure: Angles', [
    ('gm', 'classify-angle', 'A', 'measure-angles'), ('gm', 'classify-angle-diagram', 'A', 'measure-angles'), ('gm', 'estimate-angle', 'A', 'measure-angles'),
    ('gm', 'estimate-angle-diagram', 'A', 'measure-angles'), ('gm', 'read-protractor', 'A', 'protractor'), ('gm', 'construct-angle', 'A', 'protractor'),
    ('gm', 'angles-straight-line', 'B', 'straight-line-point'), ('gm', 'angles-at-a-point', 'B', 'straight-line-point'),
    ('an4', 'vertically-opposite', 'B', 'intersecting-lines')]),
 'MA3-2DS-01': ('s3-2d-shapes', 'stage-3/measurement-space/2d-shapes', '2D Spatial Structure: Shapes and Transformations', [
    ('2d', 'classify-triangle-diagram', 'A', 'classify-shapes'), ('2d', 'classify-triangle', 'A', 'classify-shapes'),
    ('2d', 'classify-quadrilateral-diagram', 'A', 'classify-shapes'), ('2d', 'classify-quadrilateral', 'A', 'classify-shapes'),
    ('2d', 'shape-properties', 'A', 'classify-shapes'), ('2d', 'symmetry-diagram', 'A', 'classify-shapes'), ('2d', 'symmetry', 'A', 'classify-shapes'),
    ('2d', 'complete-symmetric', 'A', 'classify-shapes'),
    ('2d', 'name-transformation-grid', 'B', 'dissect-transform'), ('2d', 'describe-translation', 'B', 'dissect-transform'),
    ('2d', 'draw-transformation', 'B', 'dissect-transform'), ('2d', 'transformations', 'B', 'dissect-transform')]),
 'MA3-2DS-02': ('s3-area-rectangles', 'stage-3/measurement-space/area-rectangles', '2D Spatial Structure: Area of Rectangles', [
    ('2d', 'choose-unit', 'A', 'hectares'), ('2d', 'hectares', 'A', 'hectares'), ('2d', 'count-unit-squares', 'A', 'rectangles'),
    ('2d', 'rows-and-columns', 'A', 'rectangles'), ('2d', 'area-rectangle', 'A', 'rectangles'), ('2d', 'area-square', 'A', 'rectangles'), ('2d', 'missing-side', 'A', 'rectangles')]),
 'MA3-2DS-03': ('s3-area-composite', 'stage-3/measurement-space/area-triangles-composite', '2D Spatial Structure: Area of Composite Figures, Parallelograms and Triangles', [
    ('2d', 'composite-area-diagram', 'B', 'composite'), ('2d', 'composite-area', 'B', 'composite'), ('2d', 'multi-part-area', 'B', 'composite'),
    ('2d', 'area-parallelogram', 'B', 'parallelogram'), ('2d', 'area-triangle', 'B', 'triangle')]),
 'MA3-3DS-01': ('s3-3d-objects', 'stage-3/measurement-space/3d-objects', '3D Spatial Structure: 3D Objects', [
    ('3d', 'name-solid', 'A', 'prisms-pyramids'), ('3d', 'prism-or-pyramid', 'A', 'prisms-pyramids'), ('3d', 'faces-edges-vertices', 'A', 'prisms-pyramids'),
    ('3d', 'face-shapes', 'A', 'prisms-pyramids'), ('3d', 'fev-pattern', 'A', 'prisms-pyramids'),
    ('3d', 'net-to-solid', 'A', '3d-to-2d'), ('3d', 'cube-nets', 'A', '3d-to-2d'), ('3d', 'cube-stack-views', 'A', '3d-to-2d'),
    ('3d', 'skeletal-models', 'B', 'construct')]),
 'MA3-3DS-02': ('s3-volume-capacity', 'stage-3/measurement-space/volume-capacity', '3D Spatial Structure: Volume and Capacity', [
    ('3d', 'capacity-units', 'A', 'capacity-units'), ('3d', 'read-jug', 'A', 'capacity-units'), ('3d', 'capacity-problems', 'A', 'capacity-units'),
    ('3d', 'displacement', 'A', 'displacement'), ('3d', 'convert-capacity', 'A', 'decimal-metric'),
    ('3d', 'cubic-metres', 'B', 'cubic-metres'), ('3d', 'count-cubes', 'B', 'multiplicative-structure'), ('3d', 'layers', 'B', 'multiplicative-structure'),
    ('3d', 'volume-formula', 'B', 'rectangular-prisms'), ('3d', 'missing-dimension', 'B', 'rectangular-prisms'), ('3d', 'multi-part-3d', 'B', 'rectangular-prisms')]),
 'MA3-NSM-01': ('s3-mass', 'stage-3/measurement-space/mass', 'Non-Spatial Measure: Mass', [
    ('mt', 'mass-units', 'A', 'mass-units'), ('mt', 'read-scale', 'A', 'mass-units'), ('mt', 'order-masses', 'A', 'mass-units'),
    ('mt', 'mass-decimals', 'A', 'decimal-metric'), ('mt', 'convert-mass', 'B', 'convert-mass'), ('mt', 'mass-problems', 'B', 'convert-mass')]),
 'MA3-NSM-02': ('s3-time', 'stage-3/measurement-space/time', 'Non-Spatial Measure: Time', [
    ('mt', 'read-clock', 'A', '12-24-hour'), ('mt', 'draw-hands', 'A', '12-24-hour'), ('mt', 'to-24-hour', 'A', '12-24-hour'),
    ('mt', 'to-12-hour', 'A', '12-24-hour'), ('mt', 'clock-to-24', 'A', '12-24-hour'), ('mt', 'time-units', 'A', '12-24-hour'),
    ('mt', 'duration', 'B', 'duration'), ('mt', 'finish-time', 'B', 'duration'), ('mt', 'start-time', 'B', 'duration'),
    ('mt', 'timetable', 'B', 'duration'), ('mt', 'multi-part-time', 'B', 'duration')]),
 'MA3-DATA-01': ('s3-data-collect', 'stage-3/statistics-probability/data-collecting-displaying', 'Data: Collecting and Displaying Data', [
    ('da', 'data-types', 'A', 'collect'), ('da', 'survey-questions', 'A', 'collect'), ('da', 'choose-display', 'A', 'tables-graphs'),
    ('da', 'choose-scale', 'A', 'tables-graphs'), ('da', 'pictogram-key', 'A', 'tables-graphs'), ('da', 'two-way-table', 'A', 'tables-graphs'),
    ('da', 'construct-column', 'A', 'tables-graphs'), ('da', 'construct-dot-plot', 'A', 'tables-graphs')]),
 'MA3-DATA-02': ('s3-data-interpret', 'stage-3/statistics-probability/data-interpreting', 'Data: Interpreting Data', [
    ('da', 'many-to-one-scale', 'A', 'describe-interpret'), ('da', 'dot-plot-read', 'A', 'describe-interpret'), ('da', 'line-graph-read', 'A', 'describe-interpret'),
    ('da', 'line-graph-trend', 'A', 'describe-interpret'), ('da', 'timeline-read', 'A', 'describe-interpret'),
    ('da', 'side-by-side', 'B', 'compare-displays'), ('da', 'multi-part-data', 'B', 'compare-displays'), ('da', 'misleading-graph', 'B', 'digital-media')]),
 'MA3-CHAN-01': ('s3-chance', 'stage-3/statistics-probability/chance', 'Chance', [
    ('ch', 'list-outcomes', 'A', 'list-outcomes'), ('ch', 'chance-words', 'A', 'list-outcomes'), ('ch', 'probability-scale', 'A', 'list-outcomes'),
    ('ch', 'equally-likely', 'A', 'list-outcomes'), ('ch', 'probability-fraction', 'A', 'list-outcomes'), ('ch', 'most-likely', 'A', 'list-outcomes'),
    ('ch', 'expected-results', 'B', 'observed-expected'), ('ch', 'observed-vs-expected', 'B', 'observed-expected'),
    ('ch', 'design-generator', 'B', 'random-generators'), ('ch', 'fraction-decimal-percent', 'B', 'random-generators'),
    ('ch', 'more-trials', 'B', 'trials'), ('ch', 'multi-part-chance', 'B', 'trials')]),
}

PAPER = {
 'p-order-lengths': ('Compare and order lengths in different units', r'''() => {
    const C = WSF.C;
    for (let t = 0; t < 200; t++) {
      const base = C.ri(12, 480) * 10;            // millimetres
      const vals = [base, base + C.pick([-1, 1]) * C.ri(1, 30) * 10, base + C.pick([-1, 1]) * C.ri(40, 300), base + C.pick([-1, 1]) * C.ri(5, 90) * 10];
      if (new Set(vals).size < 4 || vals.some(v => v <= 0)) continue;
      const show = v => C.pick([0, 1, 2]) === 0 ? `${C.fmt(v / 1000, 3)} m` : C.pick([0, 1]) ? `${C.fmt(v / 10, 1)} cm` : `${v} mm`;
      const items = vals.map(v => ({ v, s: show(v) }));
      if (new Set(items.map(i => i.s.split(' ')[1])).size < 2) continue;
      const asc = items.slice().sort((a, b) => a.v - b.v);
      return { prompt: `Write these lengths in order from shortest to longest.<span class="big">${items.map(i => i.s).join(' , ')}</span>`, mode: 'none',
        answerHTML: asc.map(i => i.s).join(' , '), why: 'In millimetres: ' + asc.map(i => `${i.s} = ${i.v} mm`).join(', ') + '.' };
    }
  }'''),
}


def bank_labels(path):
    d = os.path.dirname(os.path.join(QB, path))
    txt = ''.join(open(os.path.join(d, f), encoding='utf-8').read() for f in os.listdir(d) if f.endswith('.js'))
    return dict(re.findall(r'\{ id: "([a-z0-9-]+)", label: "([^"]+)"', txt))


def lower1(s): return s[0].lower() + s[1:]


def main():
    pages = json.load(open(os.path.join(HERE, 'pages.json')))
    stm = json.loads(os.popen("node -e \"global.window={};require('%s/resources/contentStatements.js');process.stdout.write(JSON.stringify(window.MMT_CONTENT.statements))\"" % SITE).read())
    for oc, (slug, folder, title, rows) in OUT.items():
        used = sorted({b for b, *_ in rows if b != 'paper'})
        labels = {b: bank_labels(BANKS[b][0]) for b in used}
        sids = {s['id']: s for s in stm[oc]}
        js = ['/* %s — %s. BUILT by stage3.py: types from the Revision Generator Stage 3' % (title, oc),
              '   banks, mapped to this outcome\'s content statements. Part A types appear', '   in both papers; Part B types only in "Parts A and B". */']
        js.append('const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);')
        items = []
        for b, tid, part, sid in rows:
            assert sid in sids, (oc, sid)
            assert part == sids[sid].get('part'), (oc, tid, part, sids[sid].get('part'))
            if b == 'paper':
                label, fn = PAPER[tid]
                for lv in (['basic', 'expected'] if part == 'A' else ['expected']):
                    items.append((lv, "  { id: '%s%s', level: '%s', stmt: '%s', label: %s, gen: %s }" % ('b-' if lv == 'basic' else 'e-', tid, lv, sid, json.dumps(label), fn)))
                continue
            label = labels[b][tid]
            alias = 'G_' + b.upper().replace('2D', 'TWOD').replace('3D', 'THREED')
            for lv in (['basic', 'expected'] if part == 'A' else ['expected']):
                items.append((lv, "  T(%s, '%s', '%s', %s, '%s')" % (alias, lv, tid, json.dumps(label), sid)))
        items.sort(key=lambda x: 0 if x[0] == 'basic' else 1)
        A = [s['text'] for s in stm[oc] if s.get('part') == 'A']
        B = [s['text'] for s in stm[oc] if s.get('part') == 'B']
        sub = ''
        if A: sub += '<strong>Part A</strong>: ' + '; '.join(lower1(x) for x in A) + '. '
        if B: sub += ('<strong>Parts A and B</strong> add' if A else '<strong>Part B</strong>') + ': ' + '; '.join(lower1(x) for x in B) + '.'
        js.append("WSF.page({\n  topic: %s, outcome: '%s', langKey: 'mmt-%s-ws-lang', bank: false, noLanguage: true,\n  defaultCount: 12, statements: STATEMENTS,\n  levelNames: { basic: 'Part A', expected: %s },\n  paperTypes: [\n%s\n  ]\n});\n"
                  % (json.dumps(title), oc, slug, json.dumps('Parts A and B' if A else 'Part B'), ',\n'.join(i[1] for i in items)))
        open(os.path.join(HERE, 'pages', slug + '.js'), 'w', encoding='utf-8').write('\n'.join(js))
        eng = list(ENGINES)
        for b in used: eng += [e for e in EXTRA_ENG.get(b, []) if e not in eng]
        pages[slug] = {'outcome': oc, 'topic': title, 'folder': folder, 'engines': eng, 'subtitle': sub,
                       'rg': {'banks': [[BANKS[b][0], BANKS[b][1], 'G_' + b.upper().replace('2D', 'TWOD').replace('3D', 'THREED')] for b in used]}}
    json.dump(pages, open(os.path.join(HERE, 'pages.json'), 'w'), indent=1, ensure_ascii=False)
    print(len(OUT), 'Stage 3 pages written')


if __name__ == '__main__':
    main()
