#!/usr/bin/env python3
"""Join the frame's parts into frame/shell.html (assemble.py reads that).
   head.html + <style> controls.css + paper.css </style> + pwa.html + body.html"""
import os
D = os.path.dirname(os.path.abspath(__file__))
r = lambda f: open(os.path.join(D, f), encoding='utf-8').read()
out = r('head.html') + '  <style>\n' + r('controls.css') + '\n' + r('paper.css') + '  </style>\n' + r('pwa.html') + r('body.html')
open(os.path.join(D, 'shell.html'), 'w', encoding='utf-8').write(out)
print('shell.html', len(out))
