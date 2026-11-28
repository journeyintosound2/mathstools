#!/usr/bin/env python3
"""Write the Early Stage 1 (Kindergarten) page sources (pages/k-*.js) and their pages.json entries.

The questions are NOT here: each page loads its quiz's bank (online-quizzes/early-stage-1/topic-quiz/banks/<slug>.js,
made in ../k.js), which also carries the pencil-and-paper types (draw, colour) when it is loaded by a
worksheet page. This script only reads the type list (id → content statement) and sets the paper for
five- and six-year-olds: very large print, big pictures, tall writing lines, 6 questions by default.

    python3 stagek.py <site root>     then     python3 assemble.py <site root> <k-slugs>
"""
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/site'
TQ = 'online-quizzes/early-stage-1/topic-quiz'
ENGINES = ['manipulatives/manipulatives-engine.js', 'measure/measure-engine.js']
KCSS = (".qText{font-size:19px;line-height:1.4;font-weight:700}.opts{font-size:17px;gap:3mm 6mm;align-items:center}.opt{align-items:center}"
        ".opt .L{width:7.4mm;height:7.4mm;font-size:13px}.tfRow{font-size:17px}.ansLine{font-size:15px;min-height:12mm}.ansLine .unit{font-size:18px}"
        ".keyAns{font-size:19px}.keyText{font-size:14px}.qNum{width:32px;height:27px;font-size:14px}.secTitle{font-size:14px}.hdrTitle{font-size:18px}"
        ".ablank{height:11mm;min-width:34mm}.ablank.sm{min-width:26mm}.lineBox{height:30px}.drawBox{border-radius:10px}")


def main():
    code = ("import {pathToFileURL} from 'url';globalThis.window={WSF:1};import(pathToFileURL(%r+'/'+%r+'/k.js').href).then(m=>{const o={};for(const c in m.OUTCOMES){o[c]=Object.assign({},m.OUTCOMES[c],"
            "{types:m.kBank(c).types.map(t=>({id:t.id,stmt:t.stmt,paper:t.paper}))})}console.log(JSON.stringify(o))})") % (SITE, TQ)
    meta = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', code]))
    stm = json.loads(os.popen("node -e \"global.window={};require('%s/resources/contentStatements.js');process.stdout.write(JSON.stringify(window.MMT_CONTENT.statements))\"" % SITE).read())
    pages = json.load(open(os.path.join(HERE, 'pages.json')))
    for oc, m in meta.items():
        ids = {s['id'] for s in stm[oc]}
        assert {t['stmt'] for t in m['types']} == ids, (oc, ids ^ {t['stmt'] for t in m['types']})
        slug = 'k-' + m['slug']
        js = ("/* %s — %s (Early Stage 1, Kindergarten). BUILT by stagek.py. The questions come from the quiz's bank\n"
              "   (%s/banks/%s.js); this file files each type under its content statement and sets the paper for\n"
              "   young children: very large print, 6 questions by default, one level. */\n"
              "WSF.page({\n  topic: %s, outcome: '%s', langKey: 'mmt-%s-ws-lang', bank: true, noLanguage: true,\n  defaultCount: 6, statements: STATEMENTS,\n"
              "  levelNames: { basic: 'Kindergarten', expected: 'Kindergarten' },\n  stmtOf: %s,\n  css: %s\n});\n") % (
                  m['title'], oc, TQ, m['slug'], json.dumps(m['title']), oc, slug, json.dumps({t['id']: t['stmt'] for t in m['types']}), json.dumps(KCSS))
        open(os.path.join(HERE, 'pages', slug + '.js'), 'w', encoding='utf-8').write(js)
        sub = ('For <strong>Kindergarten</strong> (Early Stage 1): ' + '; '.join(s['text'][0].lower() + s['text'][1:] for s in stm[oc]) +
               '. Very large print and a picture in every question. Children circle an answer, write a number or draw. Read each question aloud to children who are not yet reading. The questions are the same as the online quiz, plus drawing questions.')
        pages[slug] = {'outcome': oc, 'topic': m['title'], 'folder': 'early-stage-1/%s/%s' % (m['strand'], m['slug']),
                       'bank': '/%s/banks/%s.js' % (TQ, m['slug']), 'engines': ENGINES, 'subtitle': sub}
    json.dump(pages, open(os.path.join(HERE, 'pages.json'), 'w'), indent=1, ensure_ascii=False)
    print(len(meta), 'Early Stage 1 pages written')


if __name__ == '__main__':
    main()
