#!/usr/bin/env python3
"""Wire the Stage 1 and Stage 2 whole-topic worksheet creators into the site's listings (idempotent).

    python3 wire12.py <dir holding index.html, resources/toolLinks.js, resources/toolFamilies.js>

For every outcome in stage12.OUT: a "Worksheet maker" row after the outcome's quiz row in toolLinks.js,
a line in MMT_WHOLE_TOPIC_WORKSHEETS (toolFamilies.js), and a homepage card in "Stage 1 — whole topic" /
"Stage 2 — whole topic" grids placed before the Stage 3 whole-topic worksheet grid.
"""
import html, json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stage12
OUT = stage12.OUT
D = sys.argv[1]
STRAND = lambda f: 'Number' if '/number/' in f else 'Measurement' if '/measurement-space/' in f else 'Statistics'


def main():
    tl = open(os.path.join(D, 'resources/toolLinks.js'), encoding='utf-8').read()
    fam = open(os.path.join(D, 'resources/toolFamilies.js'), encoding='utf-8').read()
    home = open(os.path.join(D, 'index.html'), encoding='utf-8').read()
    famlines, cards = [], {1: [], 2: []}
    for oc, (slug, folder, title, topic, spec_) in OUT.items():
        st = int(oc[2]); url = '/worksheet-creators/%s/' % folder
        key = '  "%s": [\n' % oc
        i = tl.index(key); j = tl.index('\n  ],', i)
        block = tl[i:j]
        m = re.search(r'note: "Whole-topic quiz: (.*?)\. Part ', block)
        desc = m.group(1) + '.'
        tags = re.search(r'kind: "Student quiz".*?tags: \[(.*?)\]', block, re.S).group(1)
        own = [t for t in json.loads('[' + tags + ']') if t not in ('quiz', 'whole topic', 'subset builder', 'read aloud')]
        if url not in tl:
            note = ('Printable whole-topic worksheet: %s Large print, a picture in most questions and room to write. '
                    'Part A, or Parts A and B; every content statement, with an answer key and reasons.') % desc
            row = '    {\n      title: %s,\n      kind: "Worksheet maker",\n      url: "%s",\n      note: %s,\n      tags: %s\n    }' % (
                json.dumps(title + ' — Whole Topic Worksheet', ensure_ascii=False), url, json.dumps(note, ensure_ascii=False),
                json.dumps(['worksheet generator', 'printable', 'whole topic', 'large print'] + own, ensure_ascii=False).replace('","', '", "'))
            q = tl.index('kind: "Student quiz"', i); e = tl.index('\n    }', q) + len('\n    }')
            tl = tl[:e] + ',\n' + row + tl[e:]
        if url not in fam: famlines.append((st, '  "%s": %s' % (url, json.dumps(title, ensure_ascii=False))))
        t = STRAND(folder)
        srch = 'worksheet worksheet creator whole topic %s %s stage %d year %d year %d %s outcome printable large print answer key part a part b %s %s' % (
            title.lower(), oc.lower(), st, st * 2 - 1, st * 2, t.lower(), ' '.join(own).lower(), desc.lower())
        cards[st].append('''<a class="resource-card " href="worksheet-creators/%s/index.html" target="_blank" rel="noopener" data-type="worksheet" data-stage="Stage %d" data-topic="%s" data-search="%s">
  <div class="resource-top">
    <span class="resource-type"><span>🧾</span>Worksheet Creator</span>
    <span class="status-label">Printable</span>
  </div>
  <h4>%s</h4>
  <span class="outcome-code">%s</span>
  <p>%s</p>
  <div class="resource-meta"><span>Stage %d</span><span>%s</span></div>
  <span class="resource-link">Open →</span>
</a>''' % (folder, st, t, html.escape(srch, quote=True), html.escape(title), oc, html.escape(desc), st, t))
    open(os.path.join(D, 'resources/toolLinks.js'), 'w', encoding='utf-8').write(tl)
    if famlines:
        i = fam.index('window.MMT_WHOLE_TOPIC_WORKSHEETS = {') + len('window.MMT_WHOLE_TOPIC_WORKSHEETS = {')
        add = '\n  /* ---- Stage 1 and Stage 2 (levels are the syllabus parts; large print) ---- */\n' + ',\n'.join(l for _, l in famlines) + ','
        fam = fam[:i] + add + fam[i:]
    open(os.path.join(D, 'resources/toolFamilies.js'), 'w', encoding='utf-8').write(fam)
    if 'worksheet-creators/stage-1/number/adding-taking-away/' not in home:
        old = '  <div class="quiz-subhead"><h4>Stage 3 — whole topic</h4><span>Each creator covers'
        assert home.count(old) == 1
        new = ''
        for st, yrs in ((1, 'Years 1 and 2'), (2, 'Years 3 and 4')):
            new += '  <div class="quiz-subhead"><h4>Stage %d — whole topic</h4><span>%s: each creator covers a full Stage %d outcome (Part A, or Parts A and B) in large print, with pictures and room to write</span></div>\n  <div class="resource-grid">\n%s\n  </div>\n' % (st, yrs, st, '\n'.join(cards[st]))
        home = home.replace(old, new + old)
        k = home.index(old); ms = list(re.finditer(r'<span class="group-count">(\d+) resources</span>', home[:k])); m = ms[-1]
        n = int(m.group(1)) + 36
        home = home[:m.start(1)] + str(n) + home[m.end(1):]
        print('worksheet pill', m.group(1), '->', n)
    open(os.path.join(D, 'index.html'), 'w', encoding='utf-8').write(home)
    print(sum(len(c) for c in cards.values()), 'cards;', len(famlines), 'family lines')


if __name__ == '__main__':
    main()
