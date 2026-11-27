import subprocess, sys
from playwright.sync_api import sync_playwright
subprocess.run([sys.executable,'build.py'],check=True)
FOOT='''<div style="width:100%;font-family:Inter,sans-serif;font-size:8pt;color:#64748b;padding:0 14mm;display:flex;justify-content:space-between;-webkit-print-color-adjust:exact">
<span><b style="color:#1e3a6e">Mills Maths Tools</b> &nbsp;·&nbsp; Bin Toss: Is the $50 prize worth it?</span><span>millsmathstools.au &nbsp;·&nbsp; Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>'''
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page()
    pg.goto('file:///home/claude/ws/worksheet.html'); pg.wait_for_timeout(300)
    # overflow check: content of each page must stay inside 269mm
    res=pg.evaluate("""()=>[...document.querySelectorAll('.page')].map((s,i)=>{const r=s.getBoundingClientRect();let m=0;
      s.querySelectorAll('*').forEach(e=>{const b=e.getBoundingClientRect();if(b.height)m=Math.max(m,b.bottom)});return [i+1,Math.round((m-r.top)/3.7795),Math.round(r.height/3.7795)]})""")
    print(res)
    pg.pdf(path='bin-toss-worksheet.pdf',format='A4',print_background=True,display_header_footer=True,
           header_template='<span></span>',footer_template=FOOT,margin={'top':'12mm','bottom':'15mm','left':'14mm','right':'14mm'})
    b.close()
