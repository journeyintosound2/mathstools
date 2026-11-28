from playwright.sync_api import sync_playwright
exec(open('t2.py').read().split('with sync_playwright()')[0])
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    for lang,vw,vh in [('ar',1366,768),('fa',1366,768),('en',390,780)]:
        ctx=b.new_context(viewport={'width':vw,'height':vh});setup(ctx);pg=ctx.new_page();errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(U);pg.wait_for_timeout(1500);E=pg.evaluate
        E(f"()=>{{__BTG__.PREF.sound=false;__BTG__.setLang('{lang}')}}");pg.wait_for_timeout(300);pg.screenshot(path=f'l_{lang}_1.png')
        pg.click('[data-act=chars]');pg.click('[data-act=char][data-v=main1]');pg.wait_for_timeout(300);pg.click('[data-act=pick][data-v=middle]');pg.wait_for_timeout(400);pg.click('[data-act=predGo]')
        for i in range(10):
            pg.wait_for_function("__BTG__.phase==='aim'",timeout=90000);E("()=>{const g=__BTG__,b=g.P.band('middle',40);g.forceThrow(40,b.mid+(%d%%2?0:5))}"%i)
            if i==0:pg.wait_for_timeout(1700);pg.screenshot(path=f'l_{lang}_2.png')
        pg.wait_for_function("__BTG__.phase==='results'",timeout=120000);pg.wait_for_timeout(300);pg.screenshot(path=f'l_{lang}_3.png')
        pg.click('.panel [data-act=toPrice]');pg.wait_for_timeout(500);pg.screenshot(path=f'l_{lang}_4.png')
        pg.click('[data-act=dayPred][data-v=profit]');pg.click('#openBtn');pg.wait_for_timeout(500);pg.click('#skipBtn');pg.wait_for_timeout(400);pg.screenshot(path=f'l_{lang}_5.png')
        pg.click('.panel [data-act=quiz]');pg.wait_for_timeout(300);pg.fill('#qIn','0.3');pg.click('[data-act=qCheck]');pg.wait_for_timeout(200);pg.screenshot(path=f'l_{lang}_6.png')
        sw=E("document.documentElement.scrollWidth>innerWidth+1");print(lang,'overflow',sw,'nudge',pg.inner_text('#qNudge'),errs)
        ctx.close()
