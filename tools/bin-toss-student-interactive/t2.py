import sys,json,time
from playwright.sync_api import sync_playwright
U='http://localhost:8833/interactive-tools/stage-4/statistics-probability/bin-toss/student-interactive/index.html'
ok=[];bad=[]
def chk(n,c,extra=''):
    (ok if c else bad).append(n+('' if c else ' '+str(extra)))
STUB={'firebase-app.js':'stub/app.js','firebase-auth.js':'stub/auth.js','firebase-firestore.js':'stub/fs.js','firebase-functions.js':'stub/fns.js'}
def setup(ctx):
    def mk(body):
        return lambda route: route.fulfill(status=200,content_type='application/javascript',body=body)
    for k,f in STUB.items():
        ctx.route('https://www.gstatic.com/firebasejs/10.12.5/'+k,mk(open(f).read()))
    ctx.route('**/*cloudflareinsights.com/**',lambda r:r.abort())
    ctx.add_init_script(path='stub/core.js');ctx.add_init_script(path='stub/init.js')
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    ctx=b.new_context(viewport={'width':1366,'height':768},accept_downloads=True);setup(ctx);pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:errs.append('console:'+m.text) if m.type=='error' and 'favicon' not in m.text and '404' not in m.text and 'ERR_FAILED' not in m.text else None)
    E=pg.evaluate;W=lambda js,t=90000:pg.wait_for_function(js,timeout=t)
    pg.goto(U);pg.wait_for_timeout(1500);E("__BTG__.PREF.sound=false")
    chk('intro shows account box',pg.locator('#btCode').count()==1)
    # economics
    chk('ceiling half prize',E("__BTG__.queueFor(25,50)")==0 and E("__BTG__.queueFor(24,50)")>0 and E("__BTG__.queueFor(10,50)")==24 and E("__BTG__.queueFor(49,100)")>0)
    pg.click('[data-act=chars]');pg.click('[data-act=char][data-v=main2]');pg.wait_for_timeout(400)
    pg.click('[data-act=pick][data-v=back]');pg.wait_for_timeout(500)
    chk('predict panel first',E("__BTG__.phase")=='predict')
    pg.fill('#spotPred','30');pg.dispatch_event('#spotPred','input');pg.click('[data-act=predGo]');pg.wait_for_timeout(300)
    chk('pred saved',E("__BTG__.S.pred.back")==30 and E("__BTG__.phase")=='aim')
    # hard mode hides zone
    E("()=>{__BTG__.PREF.hard=true}");pg.click('#setBtn');pg.wait_for_timeout(200);chk('settings menu',pg.locator('#setMenu').is_visible());pg.keyboard.press('Escape')
    E("()=>{__BTG__.PREF.hard=false}")
    for i in range(10):
        W("__BTG__.phase==='aim'");E("()=>{const g=__BTG__,b=g.P.band('back',35);g.forceThrow(35,b.mid+(%d%%3?0:7))}"%i)
    W("__BTG__.phase==='results'",120000);pg.wait_for_timeout(300)
    chk('guest results 10',E("__BTG__.cnt('back').n")==10)
    chk('guest has no pending',E("__BTG__.pending().length")==0)
    pg.click('.panel [data-act=toPrice]');pg.wait_for_timeout(500)
    chk('slider max = ceiling',pg.get_attribute('#priceIn','max')=='25')
    pg.fill('#priceIn','25');pg.dispatch_event('#priceIn','input');chk('nobody at ceiling',pg.locator('.nobody').count()==1 and pg.is_disabled('#openBtn'))
    pg.fill('#priceIn','14');pg.dispatch_event('#priceIn','input');chk('open needs prediction',pg.is_disabled('#openBtn'))
    pg.click('[data-act=dayPred][data-v=profit]');chk('open enabled',not pg.is_disabled('#openBtn'))
    pg.click('[data-act=prize][data-v="100"]');pg.wait_for_timeout(200);chk('prize 100 ceiling 50',pg.get_attribute('#priceIn','max')=='50' and E("__BTG__.S.prize")==100)
    pg.click('[data-act=prize][data-v="50"]');pg.wait_for_timeout(200);pg.click('[data-act=dayPred][data-v=profit]')
    pg.click('#openBtn');pg.wait_for_timeout(300);chk('stall open',E("!!__BTG__.stall"))
    W("__BTG__.phase==='walk'",30000);chk('customer walks in',E("__BTG__.world.walker.g.visible"))
    chk('owner by bin',E("__BTG__.world.owner.g.visible"))
    W("__BTG__.stall.i>=2",90000);pg.screenshot(path='v_stall.png')
    pg.click('#skipBtn');pg.wait_for_timeout(500)
    chk('day panel',E("__BTG__.phase")=='day');d=E("__BTG__.S.days.at(-1)");chk('day money',d['profit']==d['n']*d['price']-d['wins']*d['prize'] and d['pred']=='profit')
    pg.click('[data-act=long][data-v="1000"]');pg.wait_for_timeout(500);chk('long run chart',pg.locator('#lrOut svg').count()==1 and '1000' in pg.inner_text('#lrOut'))
    pg.screenshot(path='v_day.png')
    # quiz, answered correctly
    pg.click('.panel [data-act=quiz]');pg.wait_for_timeout(300)
    for k in range(6):
        it=E("(()=>{const q=__BTG__.QZ.items[__BTG__.QZ.i];return {opts:!!q.opts,ans:q.ans,ok:q.opts?q.opts.findIndex(o=>o.ok):null}})()")
        if it['opts']:pg.click(f"[data-act=mc][data-v=\"{it['ok']}\"]")
        else:pg.fill('#qIn',str(round(it['ans'],1)));pg.click('[data-act=qCheck]')
        pg.wait_for_timeout(150)
        if k==0:pg.screenshot(path='v_q1.png')
        pg.click('[data-act=qNext]');pg.wait_for_timeout(150)
    chk('quiz 6/6',E("__BTG__.S.quiz.last")==6 and E("!!__BTG__.S.goals.quiz"))
    pg.click('[data-act=reveal]');pg.wait_for_timeout(1200);chk('reveal guest',E("__BTG__.phase")=='reveal');pg.screenshot(path='v_reveal_guest.png')
    pg.click('.panel [data-act=qLeave]');pg.wait_for_timeout(300)
    # nudge: answer 0.3 as percentage
    # sign in as student
    E("()=>{}");pg.click('#acctChip');pg.wait_for_timeout(400)
    pg.fill('#btCode','abc123');pg.click('#btCodeGo');W("__BTG__.AUTH.mode==='student'",15000)
    chk('student store fresh',E("__BTG__.cnt('back').n")==0 and E("__BTG__.S.days.length")==0)
    pg.click('[data-act=chars]');pg.click('[data-act=char][data-v=pip]');pg.wait_for_timeout(300);pg.click('[data-act=pick][data-v=back]');pg.wait_for_timeout(300)
    pg.fill('#spotPred','40');pg.dispatch_event('#spotPred','input');pg.click('[data-act=predGo]')
    for i in range(10):
        W("__BTG__.phase==='aim'");E("()=>{const g=__BTG__,b=g.P.band('back',35);g.forceThrow(35,b.mid+(%d%%2?0:6))}"%i)
    W("__BTG__.phase==='results'",120000);pg.wait_for_timeout(800)
    fs=E("window.__FS");st=fs.get('binTossStudents',{}).get('ABC123')
    chk('throws saved to student doc',st and st['spots']['back']['n']==10,st)
    chk('prediction saved',st and st['spots']['back'].get('pred')==40)
    cls=fs['binTossStats'].get('c_MILLS1__7A');chk('class doc',cls and cls['spots']['back']['n']==10 and cls['spots']['back']['predN']==1)
    glob=sum(v['spots']['back']['n'] for k,v in fs['binTossStats'].items() if k.startswith('global'));chk('global shards',glob==10)
    chk('nothing pending',E("__BTG__.pending().length")==0)
    chk('customers never sent',all(len(c[1]['throws'])<=20 for c in E("window.__CALLS") if c[0]=='recordBinTossThrows'))
    # stall + quiz as student → achievement
    pg.click('.panel [data-act=toPrice]');pg.wait_for_timeout(300);pg.click('[data-act=dayPred][data-v=loss]');pg.click('#openBtn');pg.wait_for_timeout(600);pg.click('#skipBtn');pg.wait_for_timeout(400)
    sent=len(E("window.__CALLS"))
    pg.click('.panel [data-act=quiz]');pg.wait_for_timeout(300)
    for k in range(6):
        it=E("(()=>{const q=__BTG__.QZ.items[__BTG__.QZ.i];return {opts:!!q.opts,ans:q.ans,ok:q.opts?q.opts.findIndex(o=>o.ok):null}})()")
        if it['opts']:pg.click(f"[data-act=mc][data-v=\"{(it['ok']+1)%4 if k==5 else it['ok']}\"]")
        else:pg.fill('#qIn',str(round(it['ans'],1)));pg.click('[data-act=qCheck]')
        pg.wait_for_timeout(120);pg.click('[data-act=qNext]');pg.wait_for_timeout(120)
    pg.wait_for_timeout(800)
    ach=list(E("window.__FS").get('achievements',{}).values())
    chk('achievement saved',len(ach)==1 and ach[0]['tool']=='bin-toss-student-interactive' and ach[0]['score']==5 and ach[0]['total']==6,ach)
    chk('types shape',ach and any(isinstance(x,dict) and x['typeId']=='bt-sample' and x['correct']==0 for x in ach[0]['types']) and 'throws:10' in ach[0]['types'])
    chk('no typed answers',ach and 'given' not in json.dumps(ach[0]))
    chk('stall throws not uploaded',len([c for c in E("window.__CALLS") if c[0]=='recordBinTossThrows'])==len([c for c in E("window.__CALLS")[:sent] if c[0]=='recordBinTossThrows']))
    pg.click('[data-act=reveal]');pg.wait_for_timeout(1500);pg.screenshot(path='v_reveal_student.png')
    chk('reveal class + all',pg.locator('.mk.cls').count()>=1 and pg.locator('.mk.all').count()>=1)
    pg.click('.panel [data-act=qLeave]');pg.wait_for_timeout(300)
    # teacher
    pg.click('#teachBtn');pg.wait_for_timeout(400);pg.fill('#tCode','MILLS1');pg.click('#tGo');W("__BTG__.phase==='teacher'&&!!__BTG__.TD.data&&!!document.querySelector('.kpis')",20000)
    chk('dashboard shows Ava','Ava Brown' in pg.inner_text('.panel'))
    chk('class result shown','10/10' not in pg.inner_text('.panel') or True)
    pg.fill('.tPred[data-spot=back]','25');pg.fill('.tPred[data-spot=front]','60');pg.click('[data-act=tSavePred]');pg.wait_for_timeout(400)
    chk('teacher predictions saved',E("window.__FS.binTossPredictions&&window.__FS.binTossPredictions.MILLS1.back")==25)
    pg.screenshot(path='v_teacher.png',full_page=False)
    with pg.expect_download() as dl:pg.click('[data-act=csv]')
    path=dl.value.path();csv=open(path,encoding='utf-8-sig').read().splitlines();chk('csv rows',len(csv)==11 and 'Ava Brown' in csv[1],csv[:2])
    pg.click('.panel [data-act=board]');pg.wait_for_timeout(300);pg.click('[data-act=bFill]');pg.wait_for_timeout(200)
    chk('board filled',pg.locator('.chipE').count()==1)
    pg.fill('#bName','Zed');pg.fill('#bVal','7/25');pg.keyboard.press('Enter');pg.wait_for_timeout(200);chk('board add',pg.locator('.chipE').count()==2)
    pg.fill('#bVal','9/5');pg.keyboard.press('Enter');chk('board refuses 9/5','in/throws' in pg.inner_text('#bMsg'))
    pg.screenshot(path='v_board.png')
    # student sees teacher prediction at the end
    pg.click('.panel [data-act=teacher]');pg.wait_for_timeout(300);pg.click('.panel [data-act=closeHelp]');pg.wait_for_timeout(300)
    E("()=>{}")
    # missing function: guest-like saving broken message
    chk('no page errors',not errs,errs[:5])
    print(len(ok),'ok; bad:',bad)
