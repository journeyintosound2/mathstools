#!/usr/bin/env python3
"""Headless checks for a whole-topic worksheet creator.

    python3 test.py <slug> [--shots] [--n 300]
"""
import asyncio, json, sys
from playwright.async_api import async_playwright

PAGES = json.load(open('/home/claude/wt/pages.json'))
BASE = 'http://localhost:8765/worksheet-creators/'


async def main(slug, shots, N):
    p = PAGES[slug]
    url = BASE + (p['file'] if p.get('file') else p['folder'] + '/')
    fails = []
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        pg = await b.new_page(viewport={'width': 1366, 'height': 900})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') and 'cloudflare' not in m.text.lower() and 'ERR_' not in m.text and 'Failed to load resource' not in m.text and 'service worker' not in m.text.lower() and 'bad HTTP response code (404)' not in m.text else None)
        await pg.goto(url)
        await pg.wait_for_function('window.WSF && WSF.types.length > 0', timeout=15000)
        await pg.wait_for_timeout(400)

        # 1. coverage
        cov = await pg.evaluate('''() => {
          const st = WSF.statements.map(s => s.id), T = WSF.types, out = {};
          for (const lv of ['basic','expected']) out[lv] = st.filter(id => !T.some(t => t.level === lv && t.stmt === id));
          out.union = st.filter(id => !T.some(t => t.stmt === id));
          out.partA = WSF.statements.filter(s => s.part === 'A' && !T.some(t => t.level === 'basic' && t.stmt === s.id)).map(s => s.id);
          out.hasParts = WSF.statements.some(s => s.part);
          out.nostmt = T.filter(t => !st.includes(t.stmt)).map(t => t.id);
          out.counts = { basic: T.filter(t => t.level==='basic').length, expected: T.filter(t => t.level==='expected').length, paper: T.filter(t => t.paper).length };
          return out; }''')
        print('coverage', json.dumps(cov))
        if cov['union']: fails.append('statements with no type at all: %s' % cov['union'])
        if cov['hasParts'] and cov['partA']: fails.append('Part A paper misses Part A statements: %s' % cov['partA'])
        if cov['hasParts'] and cov['basic']: cov['basic'] = [x for x in cov['basic'] if x not in cov['partA']]
        if cov['expected']: fails.append('Expected paper misses statements: %s' % cov['expected'])
        if cov['nostmt']: fails.append('types not filed under a statement: %s' % cov['nostmt'])

        # 2. stress every generator
        res = await pg.evaluate('''(N) => {
          const bad = [], strip = h => { const d = document.createElement('div'); d.innerHTML = String(h); return d.textContent || ''; };
          const RX = /undefined|NaN|null|\\[object|Infinity/;
          for (const t of WSF.types) {
            for (let i = 0; i < N; i++) {
              let q; try { q = t.gen({ level: t.level, paper: true }); } catch (e) { bad.push(t.id + ' threw ' + e.message); break; }
              if (!q) continue;
              q.type = t.id;
              const a = WSF.answerHTML(q);
              const txt = strip(q.prompt) + ' || ' + strip(a) + ' || ' + strip(q.why || '') + ' || ' + (q.options || []).map(strip).join('|');
              if (!strip(q.prompt).trim()) { bad.push(t.id + ' empty prompt'); break; }
              if (!strip(a).trim()) { bad.push(t.id + ' empty answer: ' + strip(q.prompt).slice(0, 80)); break; }
              if (RX.test(txt)) { bad.push(t.id + ' bad text: ' + txt.slice(0, 200)); break; }
              if (q.mode === 'mc' && (q.correct == null || !q.options || q.correct >= q.options.length)) { bad.push(t.id + ' mc without a correct option'); break; }
              if (q.mode === 'mc' && new Set(q.options.map(strip)).size !== q.options.length) { bad.push(t.id + ' duplicate mc options: ' + q.options.map(strip).join(' | ')); break; }
            }
          }
          return bad; }''', N)
        if res: fails += res
        print('stress', 'ok' if not res else res[:12])

        # 3. papers: every level × language × working setting, with and without filling the pages
        levels = await pg.evaluate("[...document.querySelectorAll('#levelSel option')].filter(o => !o.disabled).map(o => o.value)")
        hidden = await pg.evaluate("document.getElementById('languageSel').parentNode.hidden")
        langs = ['en'] if hidden else ['en', 'ar', 'fa']
        combos = []
        for lv in levels:
            for lang in langs:
                combos.append((lv, lang, 'auto', True))
            combos.append((lv, 'en', 'all', True))
            combos.append((lv, 'en', 'none', False))
            combos.append((lv, 'en', 'auto', False))
        worst_free, worst_hole = 0, 0
        for lv, lang, work, fill in combos:
            await pg.select_option('#levelSel', lv)
            if not hidden: await pg.select_option('#languageSel', lang)
            await pg.select_option('#workSel', work)
            await pg.evaluate('(f) => { document.getElementById("toggleFill").checked = f; }', fill)
            await pg.fill('#countInp', '20')
            await pg.click('#genBtn')
            await pg.wait_for_timeout(700 if lang != 'en' else 250)
            r = await pg.evaluate('''() => {
              const MM = 3.7795, pages = [...document.querySelectorAll('#out .page')];
              const o = { pages: 0, key: 0, over: [], leak: 0, missing: 0, items: 0, keyItems: 0, bi: 0, free: [], holes: [] };
              pages.forEach((p, i) => {
                const key = p.classList.contains('isKey'); if (key) o.key++; else o.pages++;
                const body = p.querySelector('.pageBody'), br = body.getBoundingClientRect();
                const kids = [...body.children], last = kids[kids.length - 1];
                if (!key && last) o.free.push(Math.round((br.bottom - last.getBoundingClientRect().bottom) / MM));
                p.querySelectorAll('.qCard').forEach(c => {
                  const n = +c.dataset.n || 1; if (key) o.keyItems += n; else o.items += n;
                  const r = c.getBoundingClientRect(), num = (c.querySelector('.qNum') || {}).textContent;
                  if (r.bottom > br.bottom + 1.5 || r.right > br.right + 1.5) o.over.push(i + ':' + num + ':' + c.dataset.type);
                  c.querySelectorAll('svg,table,.opts,.big,.item,.ansLine,.keyAns,.math-expression').forEach(e => { const q = e.getBoundingClientRect(); if (q.right > r.right + 1.5) o.over.push(i + ':' + num + ':wide:' + c.dataset.type); });
                  if (!key && c.querySelector('.keyAns,.opt.right,.tfRow .right,.keyText')) o.leak++;
                  if (c.querySelector('.diagMissing')) o.missing++;
                  if (c.querySelector('.qText .loc')) o.bi++;
                  if (/undefined|NaN|\[object/.test(c.textContent)) o.bad = (o.bad || []).concat([i + ':' + num + ':' + c.dataset.type]);
                  const sp = c.querySelector(':scope > .spacer, :scope > .qMain > .spacer');
                  if (!key && sp && !c.classList.contains('side') && sp.getBoundingClientRect().height > 32 * MM) o.holes.push(i + ':' + num + ':' + Math.round(sp.getBoundingClientRect().height / MM) + 'mm:' + c.dataset.type);
                });
              });
              return o; }''')
            tag = '%s/%s/%s/%s' % (lv, lang, work, 'fill' if fill else 'nofill')
            inner = r['free'] if fill else r['free'][:-1]
            worst_free = max([worst_free] + inner)
            print(' paper', tag, r['pages'], '+', r['key'], 'pages,', r['items'], 'questions,', 'translated', r['bi'], 'free(mm)', r['free'], 'holes', r['holes'][:3], 'over', r['over'][:4], 'leak', r['leak'], 'missing', r['missing'])
            if r['items'] < 20: fails.append('%s: %d questions (want at least 20)' % (tag, r['items']))
            if r['items'] != r['keyItems']: fails.append('%s: key has %d questions, worksheet %d' % (tag, r['keyItems'], r['items']))
            if r['over']: fails.append('%s overflow %s' % (tag, r['over'][:6]))
            if r['leak']: fails.append('%s answers on student pages' % tag)
            if r['missing']: fails.append('%s missing diagrams' % tag)
            if r.get('bad'): fails.append('%s undefined/NaN printed: %s' % (tag, r['bad'][:4]))
            if fill and any(f > 24 for f in inner): fails.append('%s: a page ends with %s mm empty' % (tag, inner))
            if r['holes']: worst_hole += len(r['holes'])
            if shots and work == 'auto' and fill and lang in ('en', 'ar'):
                await pg.pdf(path='/home/claude/wt/shots/%s-%s-%s.pdf' % (slug, lv, lang), format='A4', print_background=True, prefer_css_page_size=True)
        print('worst inner-page gap %d mm; cards with a hole over 32 mm: %d' % (worst_free, worst_hole))
        if errs: fails.append('console: %s' % errs[:6])
        await b.close()
    print('FAILS' if fails else 'ALL OK', *fails, sep='\n  ')


if __name__ == '__main__':
    args = sys.argv[1:]
    n = 300
    if '--n' in args: n = int(args[args.index('--n') + 1])
    asyncio.run(main(args[0], '--shots' in args, n))
