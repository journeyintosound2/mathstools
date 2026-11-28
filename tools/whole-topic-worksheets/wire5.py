#!/usr/bin/env python3
"""Wire the Stage 5 whole-topic worksheet creators into the site's listings.

    python3 wire5.py <dir holding index.html, resources/toolLinks.js, resources/toolFamilies.js>

Adds, for every Stage 5 outcome in stage5.OUT (idempotent: an existing URL is skipped):
  * a "Worksheet maker" row at the top of the outcome's list in resources/toolLinks.js
  * a line in window.MMT_WHOLE_TOPIC_WORKSHEETS (resources/toolFamilies.js), so Resources by
    Stage shows the blue "Whole Topic Worksheet" band at the foot of the outcome
  * a homepage card in a "Stage 5 — whole topic" grid (replacing the "coming soon" note),
    and the Worksheet Creator group's resource count
"""
import html, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stage5

D = sys.argv[1]
SITE = '/home/claude/site_full'   # where contentStatements.js is read from

DESC = {
 'MA5-FIN-C-01': 'Wages, overtime, commission, tax, simple interest, and buying on terms or with loans.',
 'MA5-FIN-C-02': 'Compound interest and depreciation, by repeated steps and by formula.',
 'MA5-ALG-C-01': 'The four operations with algebraic fractions, expanding brackets, binomial products and common factors.',
 'MA5-ALG-P-01': 'Algebraic fractions with pronumeral denominators, common factors, binomial products and monic quadratics.',
 'MA5-ALG-P-02': 'Binomial numerators, special products, grouping, non-monic quadratics and completing the square.',
 'MA5-IND-C-01': 'Index laws with variables, the zero index, and negative indices with numbers.',
 'MA5-IND-P-01': 'Negative indices in algebraic expressions and fractions.',
 'MA5-IND-P-02': 'Surds: simplifying, the four operations, rationalising, and fractional indices.',
 'MA5-EQU-C-01': 'Linear equations to three steps, one algebraic fraction, formulas and word problems.',
 'MA5-EQU-P-01': 'Monic quadratic equations, simple cubics, and linear inequalities on a number line.',
 'MA5-EQU-P-02': 'Harder linear equations, changing the subject, the quadratic formula and simultaneous equations.',
 'MA5-LIN-C-01': 'Midpoint, gradient and distance on the plane, graphing lines, and parallel, horizontal and vertical lines.',
 'MA5-LIN-C-02': 'Gradient–intercept form, intercepts, and the equations of parallel and perpendicular lines.',
 'MA5-LIN-P-01': 'Coordinate geometry formulas, forms of a line, proofs on the plane, symmetry and transformations.',
 'MA5-NLI-C-01': 'Tables of values and graphs of quadratics and exponentials.',
 'MA5-NLI-C-02': 'Features of parabolas and exponential curves, and telling linear, quadratic and exponential apart.',
 'MA5-NLI-P-01': 'Parabolas, exponentials, hyperbolas, circles and cubics: features, sketches and transformations.',
 'MA5-RAT-P-01': 'Direct and inverse variation: tables, graphs, contexts and finding k.',
 'MA5-RAT-P-02': 'Constant and variable rates of change, travel graphs, containers filling and sketching from a story.',
 'MA5-POL-P-01': 'Operating with polynomials, division, the factor and remainder theorems, and polynomial graphs.',
 'MA5-LOG-P-01': 'Logarithmic and index form, the log laws, exponential equations and growth problems.',
 'MA5-FNC-P-01': 'Relations and functions, f(x) notation, domain and range, and regions from inequalities.',
 'MA5-MAG-C-01': 'SI prefixes, scientific notation, significant figures, and absolute and percentage error.',
 'MA5-TRG-C-01': 'Sine, cosine and tangent in right-angled triangles: sides, angles and practical problems.',
 'MA5-TRG-C-02': 'Angles of elevation and depression, and true and compass bearings.',
 'MA5-TRG-P-01': 'The sine, cosine and area rules, and three-dimensional right-angled triangle problems.',
 'MA5-TRG-P-02': 'The unit circle, exact values, the trigonometric graphs and trigonometric equations.',
 'MA5-ARE-C-01': 'Composite areas, surface areas of prisms, and cylinders and related composite solids.',
 'MA5-ARE-P-01': 'Surface areas of pyramids, cones, spheres and composite solids.',
 'MA5-VOL-C-01': 'Volumes of prisms, cylinders and composite solids, and capacity.',
 'MA5-VOL-P-01': 'Volumes of pyramids, cones, spheres and composite solids.',
 'MA5-GEO-C-01': 'Similar figures, scale factors, scale drawings and shadow problems.',
 'MA5-GEO-P-01': 'Congruence and similarity tests, and numerical reasoning with reasons.',
 'MA5-GEO-P-02': 'Proofs with congruent and similar triangles, and properties of quadrilaterals.',
 'MA5-CIR-P-01': 'Angle, chord, tangent and secant properties of circles, with reasons.',
 'MA5-NET-P-01': 'Graphs and networks, weighted paths, planar graphs and Euler’s formula, and Eulerian trails.',
 'MA5-DAT-C-01': 'Quartiles and IQR, box plots, outliers, and standard deviation.',
 'MA5-DAT-C-02': 'Bivariate data: scatter plots, association, lines of best fit and predictions.',
 'MA5-DAT-P-01': 'Populations and samples, sampling methods, bias, and reading media reports.',
 'MA5-PRO-C-01': 'Multistage experiments with and without replacement, tree diagrams and simulations.',
 'MA5-PRO-P-01': 'Venn diagrams, two-way tables, conditional probability and mutually exclusive events.',
}
TAGS = {
 'MA5-FIN-C-01': ['earning money', 'tax', 'simple interest', 'buying on terms'], 'MA5-FIN-C-02': ['compound interest', 'depreciation'],
 'MA5-ALG-C-01': ['algebraic fractions', 'expanding', 'factorising'], 'MA5-ALG-P-01': ['factorising', 'binomial products', 'monic quadratics'],
 'MA5-ALG-P-02': ['special products', 'difference of squares', 'perfect squares', 'non-monic', 'completing the square'],
 'MA5-IND-C-01': ['index laws', 'zero index', 'negative indices'], 'MA5-IND-P-01': ['negative indices'],
 'MA5-IND-P-02': ['surds', 'rationalising', 'fractional indices'], 'MA5-EQU-C-01': ['linear equations', 'algebraic fractions', 'word problems'],
 'MA5-EQU-P-01': ['quadratic equations', 'cubic equations', 'inequalities'], 'MA5-EQU-P-02': ['literal equations', 'quadratic formula', 'simultaneous equations'],
 'MA5-LIN-C-01': ['midpoint', 'gradient', 'distance', 'straight line graphs'], 'MA5-LIN-C-02': ['y = mx + c', 'parallel lines', 'perpendicular lines'],
 'MA5-LIN-P-01': ['coordinate geometry', 'general form', 'transformations', 'symmetry'], 'MA5-NLI-C-01': ['quadratics', 'exponentials', 'tables of values'],
 'MA5-NLI-C-02': ['parabolas', 'exponential graphs'], 'MA5-NLI-P-01': ['parabolas', 'hyperbolas', 'circles', 'cubics', 'transformations'],
 'MA5-RAT-P-01': ['direct variation', 'inverse variation'], 'MA5-RAT-P-02': ['rates of change', 'travel graphs'],
 'MA5-POL-P-01': ['polynomials', 'factor theorem', 'remainder theorem'], 'MA5-LOG-P-01': ['logarithms', 'log laws', 'exponential equations'],
 'MA5-FNC-P-01': ['functions', 'domain and range', 'inequality regions'], 'MA5-MAG-C-01': ['scientific notation', 'significant figures', 'error', 'SI prefixes'],
 'MA5-TRG-C-01': ['trigonometry', 'SOH CAH TOA', 'right-angled triangles'], 'MA5-TRG-C-02': ['elevation', 'depression', 'bearings'],
 'MA5-TRG-P-01': ['sine rule', 'cosine rule', 'area rule', '3D trigonometry'], 'MA5-TRG-P-02': ['unit circle', 'exact values', 'trigonometric equations'],
 'MA5-ARE-C-01': ['surface area', 'prisms', 'cylinders', 'composite area'], 'MA5-ARE-P-01': ['surface area', 'pyramids', 'cones', 'spheres'],
 'MA5-VOL-C-01': ['volume', 'prisms', 'cylinders', 'capacity'], 'MA5-VOL-P-01': ['volume', 'pyramids', 'cones', 'spheres'],
 'MA5-GEO-C-01': ['similar figures', 'scale factor', 'scale drawings'], 'MA5-GEO-P-01': ['congruence', 'similarity', 'geometric reasoning'],
 'MA5-GEO-P-02': ['geometric proofs', 'congruent triangles', 'quadrilaterals'], 'MA5-CIR-P-01': ['circle geometry', 'tangents', 'chords', 'cyclic quadrilaterals'],
 'MA5-NET-P-01': ['networks', 'Euler', 'planar graphs', 'Eulerian trails'], 'MA5-DAT-C-01': ['box plots', 'quartiles', 'standard deviation'],
 'MA5-DAT-C-02': ['bivariate data', 'scatter plots', 'line of best fit'], 'MA5-DAT-P-01': ['sampling', 'bias', 'statistical inquiry'],
 'MA5-PRO-C-01': ['probability', 'tree diagrams', 'multistage'], 'MA5-PRO-P-01': ['Venn diagrams', 'two-way tables', 'conditional probability'],
}
TOPIC = lambda folder: ('Number' if folder.startswith('number/') else 'Algebra' if folder.startswith('algebra/') else
                        'Ratio' if folder.startswith('ratios-rates/') else 'Measurement' if folder.startswith('measurement-space/') else 'Probability')


def main():
    stm = json.loads(os.popen("node -e \"global.window={};require('%s/resources/contentStatements.js');process.stdout.write(JSON.stringify(window.MMT_CONTENT.statements))\"" % SITE).read())
    tl = open(os.path.join(D, 'resources/toolLinks.js'), encoding='utf-8').read()
    fam = open(os.path.join(D, 'resources/toolFamilies.js'), encoding='utf-8').read()
    home = open(os.path.join(D, 'index.html'), encoding='utf-8').read()
    famlines, cards, missing = [], [], []
    for oc, (bank, folder, title, kind, spec) in stage5.OUT.items():
        url = '/worksheet-creators/stage-5/%s/' % folder
        st = [s['text'] for s in stm[oc]]
        note = ('%s outcome. Covers %s. Basic keeps to the first steps of each content statement; Expected is the whole outcome. '
                'Every content statement, with an answer key and reasons. English only for now.') % (
                    kind, '; '.join(x[0].lower() + x[1:] for x in st))
        if url not in tl:
            row = '    {\n      title: %s,\n      kind: "Worksheet maker",\n      url: "%s",\n      note: %s,\n      tags: %s\n    }' % (
                json.dumps(title + ' — Whole Topic Worksheet', ensure_ascii=False), url, json.dumps(note, ensure_ascii=False),
                json.dumps(['worksheet generator', 'printable', 'whole topic'] + TAGS[oc], ensure_ascii=False).replace('","', '", "'))
            key = '  "%s": [\n' % oc
            if key in tl: tl = tl.replace(key, key + row + ',\n', 1)
            else: missing.append('  "%s": [\n%s\n  ],\n\n' % (oc, row))
        if url not in fam: famlines.append('  "%s": %s' % (url, json.dumps(title, ensure_ascii=False)))
        t = TOPIC(folder)
        srch = 'worksheet worksheet creator whole topic %s %s stage 5 %s outcome printable answer key basic expected %s %s %s' % (
            title.lower(), oc.lower(), kind.lower(), t.lower(), ' '.join(TAGS[oc]).lower(), DESC[oc].lower())
        cards.append('''<a class="resource-card " href="worksheet-creators/stage-5/%s/index.html" target="_blank" rel="noopener" data-type="worksheet" data-stage="Stage 5" data-topic="%s" data-search="%s">
  <div class="resource-top">
    <span class="resource-type"><span>🧾</span>Worksheet Creator</span>
    <span class="status-label">Printable</span>
  </div>
  <h4>%s</h4>
  <span class="outcome-code">%s</span>
  <p>%s (%s; Basic and Expected).</p>
  <div class="resource-meta"><span>Stage 5</span><span>%s</span></div>
  <span class="resource-link">Open →</span>
</a>''' % (folder, t, html.escape(srch, quote=True), html.escape(title), oc, html.escape(DESC[oc][:-1]), kind, t))
    if missing:                                   # outcomes with nothing listed yet: a new key, with the other MA5 keys
        first = tl.index('  "MA5-')
        tl = tl[:first] + ''.join(missing) + tl[first:]
        print(len(missing), 'new outcome keys')
    open(os.path.join(D, 'resources/toolLinks.js'), 'w', encoding='utf-8').write(tl)
    if famlines:
        i = fam.index('window.MMT_WHOLE_TOPIC_WORKSHEETS = {')
        j = fam.index('\n};', i)                 # the object's closing brace: Stage 5 goes after Stage 4
        body = fam[:j].rstrip()
        if not body.endswith(','): body += ','
        fam = body + '\n  /* ---- Stage 5 (levels Basic / Expected; each outcome is Core or Path) ---- */\n' + ',\n'.join(famlines) + fam[j:]
    open(os.path.join(D, 'resources/toolFamilies.js'), 'w', encoding='utf-8').write(fam)
    if 'worksheet-creators/stage-5/number/financial-mathematics-a/' not in home:
        old = '''  <div class="quiz-subhead"><h4>Stage 5</h4><span>Outcome worksheet creators</span></div>
  <div class="quiz-comingsoon"><span aria-hidden="true">🚧</span><span>Stage 5 worksheet creators are coming soon.</span></div>
'''
        assert home.count(old) == 1
        home = home.replace(old, '''  <div class="quiz-subhead"><h4>Stage 5 — whole topic</h4><span>Each creator covers a full Stage 5 outcome, Core or Path (Basic, or Expected)</span></div>
  <div class="resource-grid">
''' + '\n'.join(cards) + '\n  </div>\n')
        m = re.search(r'(id="worksheet-creator".*?<span class="group-count">)(\d+) resources(</span>)', home, re.S)
        home = home[:m.start(2)] + str(int(m.group(2)) + len(cards)) + home[m.end(2):]
        print('worksheet pill', m.group(2), '->', int(m.group(2)) + len(cards))
    open(os.path.join(D, 'index.html'), 'w', encoding='utf-8').write(home)
    print(len(cards), 'cards;', len(famlines), 'family lines')


if __name__ == '__main__':
    main()
