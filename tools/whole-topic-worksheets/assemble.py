#!/usr/bin/env python3
"""Assemble the whole-topic worksheet creators.

Each page = frame/shell.html + frame/grid.js + pages/<slug>.js, with the
outcome's NESA content statements injected from resources/contentStatements.js
and every loaded script stamped ?v=<first 8 of md5> (CLAUDE.md, PWA rules).

    python3 assemble.py <site root> [slug ...]
"""
import hashlib, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else '/home/claude/site'
ONLY = set(sys.argv[2:])

QZ = '/online-quizzes/stage-4/topic-quiz/'
ENG = '/assessment/exam-builder/engines/'

# slug: (outcome, topic, folder under worksheet-creators, quiz bank or None, engines, subtitle, langKey, translateTopic)
PAGES = json.load(open(os.path.join(HERE, 'pages.json')))


def md5v(path):
    with open(os.path.join(SITE, path.lstrip('/')), 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


def statements():
    js = os.path.join(SITE, 'resources/contentStatements.js')
    code = "global.window={};require(%r);process.stdout.write(JSON.stringify(window.MMT_CONTENT.statements))" % js
    return json.loads(subprocess.check_output(['node', '-e', code]))


def main():
    shell = open(os.path.join(HERE, 'frame/shell.html'), encoding='utf-8').read()
    grid = open(os.path.join(HERE, 'frame/grid.js'), encoding='utf-8').read()
    stmts = statements()
    built = []
    for slug, p in PAGES.items():
        if ONLY and slug not in ONLY:
            continue
        out_rel = 'worksheet-creators/' + (p['file'] if p.get('file') else p['folder'].strip('/') + '/index.html')
        depth = out_rel.count('/')
        root = '../' * depth
        scripts = [QZ + 'core.js'] + [ENG + e for e in p.get('engines', [])]
        tags = '\n'.join('<script src="%s?v=%s"></script>' % (s, md5v(s)) for s in scripts)
        bank = ''
        if p.get('bank'):
            b = QZ + 'banks/' + p['bank']
            bank = '<script type="module" src="%s?v=%s"></script>' % (b, md5v(b))
        page_js = open(os.path.join(HERE, 'pages', slug + '.js'), encoding='utf-8').read()
        st = [dict({'id': s['id'], 'text': s['text']}, **({'part': s['part']} if s.get('part') else {})) for s in stmts[p['outcome']]]
        page_js = 'const STATEMENTS = %s;\n' % json.dumps(st, ensure_ascii=False) + page_js
        if p.get('rg'):
            # an ES module: the Revision Generator bank, its renderer, the adapter
            qr = '/assessment/exam-builder/renderers/question-renderer.js'
            banks = p['rg'].get('banks') or [[p['rg']['bank'], p['rg']['fn'], 'BANK_GEN']]
            imports = "import { renderMathText } from '%s?v=%s';\n" % (qr, md5v(qr))
            for path, fn, alias in banks:
                bk = '/assessment/exam-builder/question-banks/' + path
                imports += "import { %s as %s } from '%s?v=%s';\n" % (fn, alias, bk, md5v(bk))
            adapter = open(os.path.join(HERE, 'frame/rg-adapter.js'), encoding='utf-8').read()
            page_script = '<script type="module">\n' + imports + adapter + '\n' + page_js + '\n</script>'
        else:
            page_script = '<script>\n' + page_js + '\n</script>'
        tr = '/assessment/exam-builder/utils/translation.js?v=' + md5v('/assessment/exam-builder/utils/translation.js')
        html = shell
        for k, v in {
            '{{TOPIC}}': p['topic'], '{{OUTCOME}}': p['outcome'], '{{SLUG}}': slug,
            '{{SUBTITLE}}': p['subtitle'], '{{ROOT}}': root, '{{SCRIPTS}}': tags,
            '{{GRID}}': grid, '{{TRANSLATION}}': tr, '{{BANK_SCRIPT}}': bank,
        }.items():
            html = html.replace(k, v)
        html = html.replace('{{PAGE_SCRIPT}}', page_script)
        left = re.findall(r'\{\{[A-Z_]+\}\}', html)
        assert not left, (slug, left)
        dest = os.path.join(SITE, out_rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        open(dest, 'w', encoding='utf-8').write(html)
        built.append((slug, out_rel, len(html)))
    for b in built:
        print('%-34s %-80s %7d bytes' % b)


if __name__ == '__main__':
    main()
