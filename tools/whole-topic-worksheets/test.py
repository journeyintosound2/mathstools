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
        b = await pw.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
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
          out.nostmt = T.filter(t => !st.includes(t.stmt)).map(t => t.id);
          out.counts = { basic: T.filter(t => t.level==='basic').length, expected: T.filter(t => t.level==='expected').length, paper: T.filter(t => t.paper).length };
          return out; }''')
        print('coverage', json.dumps(cov))
        if cov['union']: fails.append('statements with no type at all: %s' % cov['union'])
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

        # 3. papers
        for lv in ['basic', 'expected']:
            for lang in ['en', 'ar', 'fa']:
                for work in [False, True]:
                    await pg.select_option('#levelSel', lv)
                    await pg.select_option('#languageSel', lang)
                    await pg.evaluate('(w) => { document.getElementById("toggleWorking").checked = w; }', work)
                    await pg.fill('#countInp', '20')
                    await pg.click('#genBtn')
                    await pg.wait_for_timeout(700 if lang != 'en' else 300)
                    r = await pg.evaluate('''() => {
                      const pages = [...document.querySelectorAll('#out .page')], o = { pages: pages.length, key: 0, over: [], leak: 0, missing: 0, cards: 0, bi: 0 };
                      pages.forEach((p, i) => {
                        const key = p.classList.contains('answerKeyPage'); if (key) o.key++;
                        const body = p.querySelector('.pageBody').getBoundingClientRect();
                        p.querySelectorAll('.qCard').forEach(c => {
                          o.cards++;
                          const r = c.getBoundingClientRect();
                          if (r.bottom > body.bottom + 1.5 || r.right > body.right + 1.5) o.over.push(i + ':' + c.querySelector('.qNum').textContent + ':' + c.dataset.type);
                          c.querySelectorAll('svg,table,.opts,.ansBox,.big').forEach(e => { const q = e.getBoundingClientRect(); if (q.right > r.right + 1.5) o.over.push(i + ':' + c.querySelector('.qNum').textContent + ':wide:' + c.dataset.type); });
                          if (!key && (c.querySelector('.ansBox.key') || c.querySelector('.opt.right') || c.querySelector('.tfRow .right') || c.querySelector('.why'))) o.leak++;
                          if (c.querySelector('.diagMissing')) o.missing++;
                          if (c.querySelector('.qPrompt .loc')) o.bi++;
                        });
                      });
                      return o; }''')
                    tag = '%s/%s/%s' % (lv, lang, 'work' if work else 'plain')
                    print(' paper', tag, r['pages'] - r['key'], '+', r['key'], 'pages,', r['cards'], 'cards,', 'translated', r['bi'], 'over', r['over'][:4], 'leak', r['leak'], 'missing', r['missing'])
                    if r['cards'] != 40: fails.append('%s: %d cards (want 40)' % (tag, r['cards']))
                    if r['over']: fails.append('%s overflow %s' % (tag, r['over'][:6]))
                    if r['leak']: fails.append('%s answers on student pages' % tag)
                    if r['missing']: fails.append('%s missing diagrams' % tag)
                    if shots and not work and lang in ('en', 'ar'):
                        await pg.pdf(path='/home/claude/wt/shots/%s-%s-%s.pdf' % (slug, lv, lang), format='A4', print_background=True, prefer_css_page_size=True)
        if errs: fails.append('console: %s' % errs[:6])
        await b.close()
    print('FAILS' if fails else 'ALL OK', *fails, sep='\n  ')


if __name__ == '__main__':
    args = sys.argv[1:]
    n = 300
    if '--n' in args: n = int(args[args.index('--n') + 1])
    asyncio.run(main(args[0], '--shots' in args, n))
