#!/usr/bin/env python3
"""Write the Stage 1 and Stage 2 page sources (pages/s1-*.js, pages/s2-*.js) and their pages.json entries.

One page per outcome. The question types are the Revision Generator's Stage 1 and Stage 2 banks
(question-banks/stage-1/*, stage-2/*), which were written for paper: picture-first, short prompts.
Here every type is mapped to ONE content statement of its outcome (resources/contentStatements.js);
the statement's part decides the paper: Part A statements are in both papers, Part B only in
"Parts A and B". A type may be borrowed from another bank ("bank:id") when a statement would
otherwise have nothing. Young pages get larger type, larger pictures and bigger writing lines
(YOUNG_CSS) and fewer questions by default.

    python3 stage12.py <site root>
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/site'
QB = os.path.join(SITE, 'assessment/exam-builder/question-banks')
ENGINES = ['array-area/array-area-engine.js', 'bar-model/bar-model-engine.js', 'grid/grid-engine.js', 'length/length-engine.js', 'manipulatives/manipulatives-engine.js',
           'measure/measure-engine.js', 'open-number-line/open-number-line-engine.js', 'probability/probability-engine.js',
           'solids/solids-engine.js', 'statistics/statistics-engine.js', 'volume/volume-engine.js']
# outcome: (slug, folder, title, [topic banks], {statement id: "type ids …"})
OUT = {
 # ------------------------------ STAGE 1 ------------------------------
 'MA1-RWN-01': ('s1-reading-ordering-numbers', 'stage-1/number/reading-ordering-numbers', 'Reading and Ordering Numbers', 'whole-numbers', {
    'counting-ones': 'count-pictures ten-frame-count tens-ones-blocks before-after one-ten-more-less more-or-less order-cards read-number-words',
    'number-patterns': 'chart-missing skip-count', 'numbers-on-line': 'number-line-a',
    'counting-ones-tens': 'hto-blocks zero-place digit-value bigger-smaller order-3digit odd-even words-to-1000 ten-hundred-more number-line-b count-by-tens-hundreds'}),
 'MA1-RWN-02': ('s1-partitioning-numbers', 'stage-1/number/partitioning-numbers', 'Partitioning Numbers', 'whole-numbers', {
    'groups-of-ten': 'teen-numbers tens-ones-split tens-ones-blocks', 'three-digit': 'hto-split rename expanded hto-blocks digit-value'}),
 'MA1-CSQ-01': ('s1-adding-taking-away', 'stage-1/number/adding-taking-away', 'Adding and Taking Away', 'combining-separating', {
    'count-by-one': 'two-colours take-away-pictures count-on-line count-back-line dice-total how-many-more picture-story',
    'number-bonds': 'make-ten bonds-to-10 missing-part', 'flexible-strategies': 'doubles near-doubles', 'equality': 'turnaround',
    'additive-relations': 'fact-family difference part-whole-story compare-story doubles-halves add-three',
    'multiples-of-ten': 'make-twenty bridge-ten add-tens split-add', 'equality-problems': 'missing-number-b'}),
 'MA1-FG-01': ('s1-equal-groups', 'stage-1/number/equal-groups', 'Equal Groups', 'forming-groups', {
    'skip-counting': 'skip-count-pictures', 'skip-patterns': 'pairs whole-numbers-a:skip-count', 'equal-groups': 'equal-or-not groups-of groups-total rows make-groups',
    'division': 'share half-collection', 'combining-groups': 'array-count array-both-ways repeated-addition jumps-on-line groups-of-3',
    'doubling-halving': 'combining-separating-b:doubles-halves', 'mult-div-problems': 'group-story share-story grouping-story left-over'}),
 'MA1-GM-01': ('s1-position', 'stage-1/measurement-space/position', 'Position', 'position-length', {
    'follow-directions': 'left-right between ordinal above-below', 'simple-maps': 'follow-steps describe-path turns'}),
 'MA1-GM-02': ('s1-length', 'stage-1/measurement-space/length', 'Length', 'position-length', {
    'measure-informal': 'measure-cubes measure-paperclips same-unit', 'compare-informal': 'longer-shorter how-much-longer',
    'order-lengths': 'order-lengths bigger-unit', 'formal-units': 'ruler-cm m-or-cm estimate-length metre-facts length-story'}),
 'MA1-GM-03': ('s1-halves-quarters-eighths', 'stage-1/measurement-space/halves-quarters-eighths', 'Halves, Quarters and Eighths', 'halves-quarters', {
    'halves-quarters': 'equal-parts half-or-quarter shade-half which-strip halves-in-whole half-a-length halve-again half-on-line',
    'eighths': 'halving-wall name-coloured bigger-part same-as-half parts-in-whole-b fraction-of-length colour-parts where-on-line'}),
 'MA1-2DS-01': ('s1-2d-shapes', 'stage-1/measurement-space/2d-shapes', '2D Shapes', 'two-d-space', {
    'classify-shapes': 'name-shape sides-corners find-the-shape straight-curved odd-one-out', 'slides-reflections': 'fold-symmetry stage-2/two-d-space-b:slide-flip-turn',
    'combine-separate': 'make-a-shape quadrilateral-or-not find-quadrilaterals polygon-name shape-clue', 'quarter-turns': 'turned-still-same'}),
 'MA1-2DS-02': ('s1-area', 'stage-1/measurement-space/area', 'Area', 'two-d-space', {
    'compare-indirectly': 'more-area', 'informal-units': 'cover-squares', 'rows-columns': 'rows-columns-area compare-area-count'}),
 'MA1-3DS-01': ('s1-3d-objects', 'stage-1/measurement-space/3d-objects', '3D Objects', 'three-d-space', {
    'recognise-objects': 'name-object real-objects', 'sort-describe': 'roll-or-stack flat-faces', 'features': 'faces-edges-corners face-shapes curved-face-shape'}),
 'MA1-3DS-02': ('s1-volume-capacity', 'stage-1/measurement-space/volume-capacity', 'Capacity and Volume', 'three-d-space', {
    'filling': 'holds-more cups-to-fill order-capacity', 'packing': 'build-volume', 'construct-cubes': 'count-blocks',
    'compare-containers': 'bigger-cup capacity-difference estimate-capacity', 'compare-volumes': 'compare-volume'}),
 'MA1-NSM-01': ('s1-mass', 'stage-1/measurement-space/mass', 'Mass', 'mass-time', {
    'investigate-balance': 'heavier-lighter mass-in-blocks order-mass-blocks which-heavier', 'compare-balance': 'balance-share blocks-difference heaviest-chain'}),
 'MA1-NSM-02': ('s1-time', 'stage-1/measurement-space/time', 'Time', 'mass-time', {
    'months': 'months days-of-week', 'half-hour': 'oclock half-past draw-oclock one-hour-later',
    'duration': 'longer-time order-durations weeks-days calendar-read', 'quarter-hour': 'quarter-past quarter-to half-hour-later'}),
 'MA1-DATA-01': ('s1-data-collecting', 'stage-1/statistics-probability/data-collecting', 'Collecting Data', 'data', {
    'ask-gather': 'list-count sort-count', 'represent-describe': 'tally-totals', 'question-of-interest': 'good-question', 'create-interpret': 'tally-from-list table-from-tally'}),
 'MA1-DATA-02': ('s1-data-interpreting', 'stage-1/statistics-probability/data-interpreting', 'Reading Graphs and Tables', 'data', {
    'represent-describe': 'tally-read picture-graph-read most-least how-many-more yes-no-table', 'create-interpret': 'total-surveyed true-or-false compare-rows column-graph-read what-it-tells'}),
 'MA1-CHAN-01': ('s1-chance', 'stage-1/statistics-probability/chance', 'Chance', 'chance', {
    'possible-outcomes': 'will-might-wont can-spinner-land can-you-pull most-likely-colour sort-events bigger-part all-one-colour list-outcomes',
    'activities-chance': 'chance-word more-likely-spinner compare-bags equal-chance certain-impossible-bag'}),
 # ------------------------------ STAGE 2 ------------------------------
 'MA2-RN-01': ('s2-whole-numbers', 'stage-2/number/whole-numbers', 'Whole Numbers', 'place-value', {
    'read-order-thousands': 'blocks-to-number number-to-blocks read-pv-chart numerals-and-words compare-numbers order-numbers number-line-read counting-patterns more-or-less zero-placeholder digit-cards',
    'partition-4-digits': 'complete-pv-chart value-of-digit expanded-form rename-numbers trading', 'order-thousands': 'round-number-line round-to-place which-rounds',
    'rename-6-digits': 'read-5-digit value-5-digit expanded-5-digit words-5-digit', 'times-as-large': 'paper:times-as-large'}),
 'MA2-RN-02': ('s2-decimals', 'stage-2/number/decimals', 'Decimals', 'place-value', {
    'tenths-hundredths': 'tenths-strip hundredths-grid decimal-pv decimal-number-line compare-decimals order-decimals decimal-blocks money-decimals',
    'fractions-decimals': 'fraction-decimal fractions-b:tenths-decimals'}),
 'MA2-AR-01': ('s2-addition-subtraction', 'stage-2/number/addition-subtraction', 'Addition and Subtraction', 'additive-relations', {
    'add-subtract-connection': 'count-on-difference fact-family', 'select-strategies': 'jump-add jump-subtract split-strategy bridge-to-ten compensation make-ten part-whole-problem compare-problem estimate-sum',
    'money-values': 'paper:money-values', 'partition-regroup': 'add-hundreds-tens jump-3-digit split-3-digit column-add column-subtract find-the-error estimate-3-digit bar-model-3-digit which-strategy',
    'money-budgeting': 'money-change two-step-problem'}),
 'MA2-AR-02': ('s2-additive-number-sentences', 'stage-2/number/additive-number-sentences', 'Missing Numbers: Adding and Subtracting', 'additive-relations', {
    'equality': 'missing-number check-with-inverse', 'number-sentences': 'missing-3-digit'}),
 'MA2-MR-01': ('s2-multiplication-division', 'stage-2/number/multiplication-division', 'Multiplication and Division', 'multiplicative-relations', {
    'patterns': 'skip-count-line odd-even repeated-addition', 'arrays-facts': 'equal-groups are-groups-equal array-sentence doubling', 'recall-facts': 'facts-a share grouping groups-word-problem',
    'related-multiples': 'multiples', 'known-facts': 'facts-b build-from-known division-facts remainders-groups remainder-problem word-problems-b',
    'area-model': 'area-model-2x1', 'number-properties': 'split-array', 'multiples-of-10': 'multiply-tens'}),
 'MA2-MR-02': ('s2-multiplicative-number-sentences', 'stage-2/number/multiplicative-number-sentences', 'Missing Numbers: Multiplying and Dividing', 'multiplicative-relations', {
    'fact-families': 'multiply-divide-link missing-factor', 'word-problems': 'missing-numbers-b equal-sentences'}),
 'MA2-PF-01': ('s2-fractions', 'stage-2/number/fractions', 'Fractions', 'fractions', {
    'fractional-parts': 'name-shaded equal-parts shade-fraction halving-wall fraction-words fraction-of-strip parts-in-whole',
    'unit-fractions-line': 'compare-unit compare-same-denominator number-line-0-1 count-fractions',
    'equivalent-lengths': 'fifths-tenths halving-thirds equivalent-wall equivalent-shapes compare-order-b half-benchmark fraction-of-collection',
    'greater-than-one': 'number-line-beyond-1 count-beyond-1 make-a-whole'}),
 'MA2-GM-01': ('s2-position', 'stage-2/measurement-space/position', 'Maps and Directions', 'geometric-measure', {
    'movement-map': 'compass-4 map-direction follow-route', 'grid-positions': 'grid-map-read grid-map-give', 'create-grid-maps': 'compass-8 map-direction-8', 'describe-routes': 'compass-turns route-8'}),
 'MA2-GM-02': ('s2-length', 'stage-2/measurement-space/length', 'Length', 'geometric-measure', {
    'm-cm-mm': 'ruler-from-zero ruler-not-zero compare-lengths metres-centimetres choose-length-unit perimeter-grid choose-unit-b convert-length',
    'scaled-instruments': 'ruler-mm perimeter-rectangle perimeter-shape same-perimeter'}),
 'MA2-GM-03': ('s2-angles', 'stage-2/measurement-space/angles', 'Angles', 'geometric-measure', {
    'measures-of-turn': 'turns bigger-angle angle-turn-link', 'compare-right-angle': 'right-angle-compare right-angles-in-shapes name-angle order-angles'}),
 'MA2-2DS-01': ('s2-2d-shapes', 'stage-2/measurement-space/2d-shapes', '2D Shapes', 'two-d-space', {
    'features': 'sides-vertices name-polygon turned-shape name-quadrilateral parallel-sides regular-irregular odd-one-out shape-riddle', 'symmetry': 'lines-of-symmetry is-it-symmetry complete-symmetry'}),
 'MA2-2DS-02': ('s2-transformations', 'stage-2/measurement-space/transformations', 'Moving and Joining Shapes', 'two-d-space', {
    'transform': 'slide-flip-turn describe-slide', 'combine-split': 'split-shape combine-shapes'}),
 'MA2-2DS-03': ('s2-area', 'stage-2/measurement-space/area', 'Area', 'two-d-space', {
    'square-centimetres': 'area-cm2 rectangle-area-cm2', 'square-metres': 'choose-area-unit estimate-m2', 'grid-structure': 'count-squares half-squares rows-of-squares', 'compare-surfaces': 'compare-areas same-area'}),
 'MA2-3DS-01': ('s2-3d-objects', 'stage-2/measurement-space/3d-objects', '3D Objects', 'three-d-space', {
    'models': 'name-object faces-edges-vertices flat-curved prism-or-pyramid face-shapes everyday-objects roll-stack-slide object-riddle skeletal-model compare-objects', 'representations': 'net-to-object cube-nets'}),
 'MA2-3DS-02': ('s2-volume-capacity', 'stage-2/measurement-space/volume-capacity', 'Capacity and Volume', 'three-d-space', {
    'litres': 'litres-millilitres choose-capacity-unit capacity-problem', 'metric-volume': 'count-cubes layers compare-volume', 'scaled-capacity': 'read-jug'}),
 'MA2-NSM-01': ('s2-mass', 'stage-2/measurement-space/mass', 'Mass', 'mass-time', {
    'kilogram': 'balance-compare balance-units kg-or-g estimate-mass read-kg-scale', 'scaled-mass': 'kg-g-convert read-scale-b order-masses mass-problem balance-share'}),
 'MA2-NSM-02': ('s2-time', 'stage-2/measurement-space/time', 'Time', 'mass-time', {
    'analog-time': 'read-clock-5 past-to draw-hands time-facts time-later read-clock-minute seconds', 'digital-time': 'analog-digital duration-timeline finish-time timetable', 'am-pm': 'am-pm'}),
 'MA2-DATA-01': ('s2-data-collecting-graphing', 'stage-2/statistics-probability/data-collecting-graphing', 'Collecting and Graphing Data', 'data', {
    'collect': 'complete-tally tally-from-list', 'tables-graphs': 'draw-column-graph', 'collection-methods': 'survey-question', 'many-to-one': 'pictogram-draw choose-scale draw-scaled-graph'}),
 'MA2-DATA-02': ('s2-data-interpreting', 'stage-2/statistics-probability/data-interpreting', 'Reading Tables and Graphs', 'data', {
    'interpret-compare': 'read-tally read-column-graph compare-column-graph read-pictogram read-dot-plot read-table true-false compare-groups table-to-graph dot-plot-compare',
    'many-to-one': 'scale-column-read scale-compare pictogram-key'}),
 'MA2-CHAN-01': ('s2-chance', 'stage-2/statistics-probability/chance', 'Chance', 'chance', {
    'possible-outcomes': 'list-outcomes can-it-happen', 'likelihood': 'chance-words chance-line bag-likely spinner-most-likely compare-bags equally-likely fair-game expected-results record-results observed-expected more-trials design-spinner results-graph',
    'previous-events': 'paper:previous-events'}),
}
# statements where the syllabus content needs paper and pencil rather than a bank type
PAPER = {
 'times-as-large': ('10, 100 or 1000 times as large', '''() => { const k = C.pick([10, 10, 100, 100, 1000]), n = k === 1000 ? C.ri(2, 9) : k === 100 ? C.ri(2, 60) : C.ri(12, 450), sp = v => String(v).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ' ');
      return C.pick([0, 1]) ? { prompt: `What number is ${sp(k)} times as large as ${sp(n)}?`, mode: 'none', answerHTML: sp(n * k), why: `Each digit moves ${String(k).length - 1} place${k > 10 ? 's' : ''} to the left: ${sp(n)} × ${sp(k)} = ${sp(n * k)}.` }
        : { prompt: `${sp(n * k)} is how many times as large as ${sp(n)}?`, mode: 'none', answerHTML: `${sp(k)} times`, why: `${sp(n)} × ${sp(k)} = ${sp(n * k)}.` }; }'''),
 'money-values': ('Make an amount of money in two ways', '''() => { const c = C.pick([35, 45, 55, 65, 70, 85, 90, 120, 150, 175, 240, 260]), show = v => v >= 100 ? '$' + (v / 100).toFixed(2) : v + 'c';
      const coins = [200, 100, 50, 20, 10, 5], greedy = v => { const o = []; coins.forEach(k => { while (v >= k) { o.push(k); v -= k; } }); return o; };
      const g = greedy(c), alt = g.slice(); const big = alt.findIndex(k => k > 5 && k !== 200); if (big >= 0) { const k = alt[big], half = k === 50 ? [20, 20, 10] : k === 100 ? [50, 50] : k === 20 ? [10, 10] : k === 10 ? [5, 5] : [k]; alt.splice(big, 1, ...half); }
      const say = a => a.map(k => k >= 100 ? '$' + k / 100 : k + 'c').join(' + ');
      return { prompt: `Show ${show(c)} in two different ways. Draw the coins.`, mode: 'none', drawSpace: 26, noAnswerBox: true, answerHTML: `For example: ${say(g)}; or ${say(alt)}`, why: 'Any two sets of coins that add to the same amount.' }; }'''),
 'previous-events': ('Does the first pick change the next one?', '''() => { const r = C.ri(2, 5), b = C.ri(2, 5), keep = C.pick([0, 1]), col = C.pick(['red', 'blue']), other = col === 'red' ? 'blue' : 'red', left = (col === 'red' ? r : b) - 1;
      return keep
        ? { prompt: `A bag has ${r} red and ${b} blue counters. You take out a ${col} counter and keep it. How many ${col} counters are left? Is ${col} now more likely or less likely than before?`, mode: 'none', answerHTML: `${left} ${col}; less likely`, why: `There is one fewer ${col} counter, so the first pick changes the chance for the next pick.` }
        : { prompt: `A bag has ${r} red and ${b} blue counters. You take out a ${col} counter, then put it back. Has the chance of picking ${col} next time changed? Why?`, mode: 'none', answerHTML: 'No', why: `The counter went back, so the bag is the same as before: ${r} red and ${b} blue.` }; }'''),
}
YOUNG_CSS = {
 1: ".qText{font-size:17px;line-height:1.42;font-weight:700}.opts{font-size:16px;gap:2.6mm 5mm}.opt .L{width:6.4mm;height:6.4mm;font-size:12px}.tfRow{font-size:16px}.subs{font-size:16px}.dtab{font-size:14px}.ansLine{font-size:14.5px;min-height:10mm}.ansLine .unit{font-size:17px}.keyAns{font-size:17px}.item .ix,.item .ieq{font-size:19px}.qNum{width:30px;height:25px;font-size:13px}.secTitle{font-size:13.5px}.hdrTitle{font-size:17px}.lineLabel{font-size:11.5px}.ablank{height:9mm;min-width:30mm}.ablank.sm{min-width:22mm}.ablank.md{min-width:32mm}.lineBox{height:26px}",
 2: ".qText{font-size:15px;line-height:1.4}.opts{font-size:14.2px;gap:2mm 4.5mm}.opt .L{width:5.6mm;height:5.6mm;font-size:11px}.tfRow{font-size:14.2px}.subs{font-size:14.2px}.dtab{font-size:12.6px}.ansLine{font-size:13px;min-height:8.5mm}.ansLine .unit{font-size:15.5px}.keyAns{font-size:15.5px}.item .ix,.item .ieq{font-size:17.5px}.qNum{width:28px;height:23px;font-size:12px}.ablank{height:7.4mm;min-width:26mm}.ablank.sm{min-width:18mm}",
}
PIC = {1: 1.4, 2: 1.22}       # pictures are drawn this much larger than on a Stage 3–5 page
COUNT = {1: 8, 2: 10}


def bank_labels(path):
    txt = open(os.path.join(QB, path), encoding='utf-8').read()
    return dict(re.findall(r'\{ id: "([a-z0-9-]+)", label: "([^"]+)"', txt))


def gen_name(path):
    return re.search(r'export function (generate\w+Questions)', open(os.path.join(QB, path), encoding='utf-8').read()).group(1)


def lower1(s): return s[0].lower() + s[1:]


def main():
    pages = json.load(open(os.path.join(HERE, 'pages.json')))
    stm = json.loads(os.popen("node -e \"global.window={};require('%s/resources/contentStatements.js');process.stdout.write(JSON.stringify(window.MMT_CONTENT.statements))\"" % SITE).read())
    LAB = {}
    def labels(bank):
        if bank not in LAB: LAB[bank] = bank_labels(bank + '/index.js')
        return LAB[bank]
    n = 0
    for oc, (slug, folder, title, topic, spec) in OUT.items():
        st = int(oc[2]); sids = {s['id']: s for s in stm[oc]}
        assert set(spec) == set(sids), (oc, set(sids) ^ set(spec))
        own = ['stage-%d/%s-a' % (st, topic), 'stage-%d/%s-b' % (st, topic)]
        used, items = [], []
        alias = lambda b: 'G_' + re.sub(r'[^A-Z0-9]', '_', b.upper())
        for s in stm[oc]:                       # syllabus order
            part = s.get('part')
            lvs = ['basic', 'expected'] if part == 'A' else ['expected']
            for ref in spec[s['id']].split():
                if ref.startswith('paper:'):
                    label, fn = PAPER[ref[6:]]
                    for lv in lvs: items.append((lv, "  { id: '%s%s', level: '%s', stmt: '%s', label: %s, gen: %s }" % ('b-' if lv == 'basic' else 'e-', ref[6:], lv, s['id'], json.dumps(label), fn)))
                    continue
                if ':' in ref:
                    b, tid = ref.split(':'); b = b if b.startswith('stage-') else 'stage-%d/%s' % (st, b)
                else:
                    tid = ref; b = next((x for x in own if tid in labels(x)), None)
                assert b and tid in labels(b), (oc, ref)
                if b not in used: used.append(b)
                for lv in lvs: items.append((lv, "  Y(RG.type(%s, '%s', '%s', %s, '%s'))" % (alias(b), lv, tid, json.dumps(labels(b)[tid]), s['id'])))
        items.sort(key=lambda x: 0 if x[0] == 'basic' else 1)
        A = [s['text'] for s in stm[oc] if s.get('part') == 'A']; B = [s['text'] for s in stm[oc] if s.get('part') == 'B']
        yr = {1: ('Year 1', 'Year 2'), 2: ('Year 3', 'Year 4')}[st]
        sub = ''
        if A: sub += '<strong>Part A</strong> (usually %s): ' % yr[0] + '; '.join(lower1(x) for x in A) + '. '
        if B: sub += ('<strong>Parts A and B</strong> (%s) add' % yr[1] if A else '<strong>Part B</strong> (usually %s)' % yr[1]) + ': ' + '; '.join(lower1(x) for x in B) + '.'
        sub += ' Large print, a picture in most questions and room to write.'
        js = ['/* %s — %s. BUILT by stage12.py: types from the Revision Generator Stage %d banks, mapped to this' % (title, oc, st),
              '   outcome\'s content statements. Part A statements are in both papers; Part B only in "Parts A and B".',
              '   Young pages: pictures are drawn larger (PIC) and the paper CSS is larger (css). */',
              'const PIC = %s;' % PIC[st],
              'const Y = t => { const g = t.gen; t.gen = () => { const q = g(); const big = d => { if (d && !d.list) { d.scale = (d.scale || 1) * PIC; d.maxH = Math.round((d.maxH || 330) * PIC); d.minCapMM = Math.max(d.minCapMM || 0, %d); } };' % (64 if st == 1 else 60),
              '  if (q && q.diagram) { if (q.diagram.list) q.diagram.list.forEach(big); else big(q.diagram); } return q; }; return t; };',
              'const C = WSF.C;']
        js.append("WSF.page({\n  topic: %s, outcome: '%s', langKey: 'mmt-%s-ws-lang', bank: false, noLanguage: true,\n  defaultCount: %d, statements: STATEMENTS,\n  levelNames: { basic: 'Part A', expected: %s },\n  css: %s,\n  paperTypes: [\n%s\n  ]\n});\n"
                  % (json.dumps(title), oc, slug, COUNT[st], json.dumps('Parts A and B' if A else 'Part B'), json.dumps(YOUNG_CSS[st]), ',\n'.join(i[1] for i in items)))
        open(os.path.join(HERE, 'pages', slug + '.js'), 'w', encoding='utf-8').write('\n'.join(js))
        pages[slug] = {'outcome': oc, 'topic': title, 'folder': folder, 'engines': ENGINES, 'subtitle': sub,
                       'rg': {'banks': [[b + '/index.js', gen_name(b + '/index.js'), alias(b)] for b in used]}}
        n += 1
    json.dump(pages, open(os.path.join(HERE, 'pages.json'), 'w'), indent=1, ensure_ascii=False)
    print(n, 'Stage 1 and 2 pages written')


if __name__ == '__main__':
    main()
