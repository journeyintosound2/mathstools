import asyncio, json, sys
from playwright.async_api import async_playwright
PAGES=json.load(open('/home/claude/wt/pages.json'))
async def m(slug, lv, n, only):
  async with async_playwright() as pw:
    b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']); pg=await b.new_page(viewport={'width':1366,'height':900})
    await pg.goto('http://localhost:8765/worksheet-creators/'+(PAGES[slug].get('file') or PAGES[slug]['folder']+'/')); await pg.wait_for_function('WSF.types.length>0'); await pg.wait_for_timeout(300)
    await pg.select_option('#levelSel',lv); await pg.wait_for_timeout(100)
    if only:
      await pg.evaluate('(o)=>{document.querySelectorAll("#chkWrap input").forEach(b=>b.checked=o.includes(b.id.slice(4)))}', only.split(','))
    await pg.fill('#countInp',str(n)); await pg.click('#genBtn'); await pg.wait_for_timeout(800)
    await pg.pdf(path=f'/home/claude/wt/shots/{slug}-{lv}.pdf',format='A4',print_background=True,prefer_css_page_size=True)
    print(await pg.evaluate('document.querySelectorAll("#out .page").length'))
    await b.close()
asyncio.run(m(sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4] if len(sys.argv)>4 else ''))
