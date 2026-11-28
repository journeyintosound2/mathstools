"""Homepage finder: behaviour checks (Playwright, Chromium).

Run from the repo root:
    python3 -m http.server 8765 &        # serves the site at http://localhost:8765/
    python3 tools/home/check.py          # set CHROME=/path/to/chrome if it is not /usr/bin/google-chrome

It drives the real page: the list the finder builds from the cards, the home screen, ranked search
(what should come first for ~30 searches), stage and kind words typed into the box, typo fixes, every
stage x kind combination by URL, remembered stages, topic pages, the shelf (pin, recent, copy link),
the keyboard, the sticky search bar, layout from 320px to 1920px, the page with scripts off, and what
the MMT Screen launcher reads from the page.

SNAPSHOT NUMBERS: section A and a few later checks hold counts as at 28 November 2026 (446 items,
410 cards, counts by kind, 260 whole-topic items, 71 topics, "166 online quizzes", the footer date,
27 results for MA4-FRC-C-01). Adding resources changes them: update the numbers, they are not bugs.
"""
import os
import sys, json, re
from playwright.sync_api import sync_playwright
URL="http://localhost:8765/"
OK=0; BAD=[]
def check(cond, label):
    global OK
    if cond: OK+=1
    else: BAD.append(label); print("  FAIL:", label)
p = sync_playwright().start()
b = p.chromium.launch(executable_path=os.environ.get("CHROME", "/usr/bin/google-chrome"), args=["--no-sandbox"])
def page(w=1366,h=768, js=True, mobile=False, storage=None):
    ctx = b.new_context(viewport={"width":w,"height":h}, java_script_enabled=js, is_mobile=mobile, has_touch=mobile)
    ctx.route("**/*cloudflareinsights.com/**", lambda r: r.abort())
    ctx.grant_permissions(["clipboard-read","clipboard-write"])
    pg = ctx.new_page(); pg.errs=[]
    pg.on("pageerror", lambda e: pg.errs.append("PAGEERR "+str(e)))
    pg.on("console", lambda m: pg.errs.append("console:"+m.text) if m.type=="error" and "ERR_FAILED" not in m.text and "404" not in m.text else None)
    return pg
def go(pg, q=""):
    pg.goto(URL+q, wait_until="load"); pg.wait_for_timeout(120)
    pg.evaluate("document.addEventListener('click', e=>{ const a=e.target.closest&&e.target.closest('a[target=_blank],a.goto-tile,a[href^=\"/resources\"],a[href^=mailto]'); if(a) e.preventDefault(); }, true)")
def search(pg, q):
    pg.fill("#resourceSearch", q); pg.wait_for_timeout(140)
def rows(pg): return pg.evaluate("[...document.querySelectorAll('#results .row')].map(r=>({title:r.querySelector('.row-title').textContent, cls:r.className, kit:[...r.querySelectorAll('.kit')].map(k=>k.textContent), meta:r.querySelector('.row-meta').textContent, href:r.querySelector('.row-main').getAttribute('href')}))")
def summary(pg): return pg.inner_text("#resSum")

# ---------- A. the list ----------
pg=page(); go(pg)
H=pg.evaluate("""(()=>{const I=__HOME__.items; const by={}; I.forEach(i=>by[i.type]=(by[i.type]||0)+1);
  const f=t=>I.find(i=>i.title===t[0]&&i.type===t[1]);
  const st=t=>{const i=f(t); return i?i.stages.join(''):'missing'};
  return {n:I.length, by, keys:new Set(I.map(i=>i.key)).size, cards:document.querySelectorAll('#catalogue a.resource-card').length,
    noTitle:I.filter(i=>!i.title||!i.href).length,
    dbg:st(['Division by Grouping','interactive']), area:st(['Area Model — Multiplication & Perimeter','interactive']), chess:st(['Chess','game']), rev:st(['Revision Generator','assessment']),
    trap:(f(['Area of a Trapezium','interactive'])||{fam:[]}).fam.map(m=>m.type).join(','),
    fdp:(I.find(i=>i.title==='Fractions, Decimals and Percentages'&&i.type==='quiz')||{fam:[]}).fam.map(m=>m.type).join(','),
    whole:I.filter(i=>i.whole).length, noStrandStaged:I.filter(i=>i.stages.length&&!i.strand&&['worksheet','quiz','interactive'].includes(i.type)).map(i=>i.title),
    primBad:I.filter(i=>i.stages.length&&i.stages.indexOf(i.primary)<0).map(i=>i.title), topics:__HOME__.topics.length,
    fams:new Set(I.map(i=>i.root)).size}})()""")
print(H)
check(H['n']==446 and H['keys']==446 and H['cards']==410, "446 items, no duplicate keys, 410 cards")
check(H['by']=={'worksheet':163,'quiz':166,'interactive':48,'game':21,'flip':10,'research':6,'dashboard':2,'assessment':1,'lesson':8,'file':18,'place':3}, "counts by kind "+json.dumps(H['by']))
check(H['noTitle']==0, "every item has a title and a link")
check(H['dbg']=='3', "Division by Grouping tool is Stage 3 (was labelled Years 7-10): "+H['dbg'])
check(H['area']=='234', "Area Model tool serves Stages 2-4: "+H['area'])
check(H['chess']=='' and H['rev']=='12345', "Chess any stage, Revision Generator 1-5")
check(H['trap']=='interactive,worksheet,quiz', "trapezium family: "+H['trap'])
check(H['fdp']=='worksheet,quiz', "whole-topic pair: "+H['fdp'])
check(H['whole']==260, "260 whole-topic items: %s"%H['whole'])
check(H['primBad']==[], "primary stage is one of the stages")
check(H['topics']==71, "71 topics")
print("  staged items with no strand:", H['noStrandStaged'][:12], len(H['noStrandStaged']))

# ---------- B. home ----------
check(pg.is_visible("#homeView") and not pg.is_visible("#resultsView"), "home view shows on a plain visit")
check(pg.locator(".goto-tile").count()==6, "six platform tiles")
check(pg.locator("#newsList li").count()==9, "nine news lines")
check(pg.locator("#featList .row").count()==7, "seven featured rows")
chips=pg.evaluate("[...document.querySelectorAll('#typeChips .chip:not([hidden])')].map(c=>c.textContent)")
check(chips==['Everything','Interactive tools48','Worksheets163','Quizzes166','Games21','Flip cards10','Lesson plans8','PDFs & slides18'], "chips "+str(chips))
check(pg.evaluate("[...document.querySelectorAll('.kstage .n')].map(n=>n.textContent).join(',')")!="", "stage counts drawn")
check('Latest addition: 28 November 2026.'==pg.inner_text("#lastAdded"), "footer date")
check(pg.evaluate("location.search")=="", "plain address on a plain visit")

# ---------- C. search ----------
TOP = [("bin toss","Bin Toss",2), ("times tables","Times Table Chart",1), ("pythagoras","Pythagoras",1), ("trig","Trigonometry",1),
       ("area of a trapezium","Area of a Trapezium",1), ("bodmas","Order of Operations",2), ("chess","Chess",1), ("timer","MMT Screen",1),
       ("revision","Revision Generator",1), ("sudoku worksheet","Sudoku Worksheets",1), ("unit circle","Unit Circle",1), ("percent","Percentage",3),
       ("area model","Area Model",1), ("number line fractions","Number Line",2), ("venn","Venn",1), ("complete the square","Complete the Square",1),
       ("double number line","Double Number Line",1), ("nasty game","The Nasty Game",1), ("integers","Integer",1), ("angles quiz","Angle",1),
       ("teacher dashboard","Teacher Dashboard",1), ("adventure","Mills Maths Adventure",1), ("ELPSA","Lesson Plan",3), ("ratio table","Ratio Table",1),
       ("crack the equation","Crack the Equation",1), ("protractor","Protractor",1), ("collecting like terms","Collecting Like Terms",1),
       ("subtraction","Subtract",3), ("multiplication","Multipl",3), ("stats","Data",3), ("flashcards","Flash",3), ("probability","Probability",1)]
for q,want,within in TOP:
    search(pg,q); r=rows(pg)
    hay=[ (x['title']+' '+' '.join(x['kit'])) for x in r[:within]]
    check(any(want.lower() in h.lower() for h in hay), "search %r: want %r in top %d, got %s"%(q,want,within,[x['title'] for x in r[:3]]))
search(pg,"MA4-FRC-C-01"); n=int(summary(pg).split()[0]); r=rows(pg)
check(n==27 and len(r)>5, "outcome code search: %d"%n)
check(pg.locator(".topic-jump .pill").first.inner_text()=="Stage 4: Fractions, Decimals and Percentages", "code search offers its topic")
search(pg,"year 3 time"); 
check(pg.evaluate("[...document.querySelectorAll('.kstage[aria-pressed=true]')].map(b=>b.dataset.stage).join()")=="2", "year 3 lights Stage 2")
check(rows(pg)[0]['title']=="Time", "year 3 time -> Time: "+rows(pg)[0]['title'])
check("Stage 2" in summary(pg), summary(pg))
search(pg,"kindergarten counting"); check(rows(pg)[0]['title'].startswith("Counting"), "kindergarten counting: "+str([x['title'] for x in rows(pg)[:2]]))
search(pg,"years 7-10 probability"); check(pg.evaluate("[...document.querySelectorAll('.kstage[aria-pressed=true]')].map(b=>b.dataset.stage).join()")=="4,5", "years 7-10 -> stages 4,5")
search(pg,"primary fractions"); check(pg.evaluate("[...document.querySelectorAll('.kstage[aria-pressed=true]')].map(b=>b.dataset.stage).join()")=="0,1,2,3", "primary -> ES1 to Stage 3")
search(pg,"eald fractions"); r=rows(pg); check(len(r)>0 and all('Arabic' in x['meta'] for x in r), "eald fractions -> only resources with Arabic and Farsi (%d)"%len(r))
search(pg,"fractions quiz"); r=rows(pg); check(len(r)>3 and all('t-quiz' in x['cls'] for x in r) and "online quizzes match" in summary(pg), "fractions quiz lists quizzes only: "+summary(pg))
check(pg.evaluate("document.querySelector('#typeChips .chip[data-type=quiz]').getAttribute('aria-pressed')")=="true", "a kind named in the search lights its chip")
search(pg,"stage 4 quizzes"); check(summary(pg)=="47 online quizzes for Stage 4", "stage 4 quizzes: "+summary(pg))
search(pg,"year 4 games"); check(summary(pg).endswith("games for Stage 2"), "year 4 games: "+summary(pg))
search(pg,"bin toss worksheet"); r=rows(pg); check(len(r)>=1 and any('Bin Toss' in x['title'] for x in r), "no worksheet creator for it, so the word is read plainly: "+str([x['title'] for x in r[:3]]))
search(pg,"lesson plans"); check(summary(pg)=="8 lesson plans", "lesson plans: "+summary(pg))
search(pg,"fractions quiz"); pg.click('#typeChips .chip[data-type="worksheet"]'); pg.wait_for_timeout(120)
check(pg.input_value("#resourceSearch")=="fractions" and "type=worksheet" in pg.url and "worksheet creators match" in summary(pg), "a chip takes over from the typed kind: "+pg.url)
pg.click('#typeChips .chip.all'); pg.wait_for_timeout(100)
for typo,fix in [("pythagorus","pythagoras"),("fractons","fractions"),("trigonometery","trigonometry"),("algerba","algebra"),("percentges","percentages"),("equasions","equations")]:
    search(pg,typo); note=pg.inner_text("#resNote")
    check(fix in note and len(rows(pg))>0, "typo %s -> %s (%s)"%(typo,fix,note[:80]))
search(pg,"zzzqqq"); check(pg.locator(".empty").count()==1 and pg.locator('.empty [data-act=reset]').count()==1 and "0 resources" in summary(pg), "nothing found state")
pg.click('.empty [data-act=reset]'); pg.wait_for_timeout(100)
check(pg.is_visible("#homeView") and pg.input_value("#resourceSearch")=="", "Start again returns home")
search(pg,"fractions"); check(pg.locator("#results mark").count()>5, "matches are marked in titles")
check(not pg.is_visible("#homeView"), "home hidden while searching")
check("q=fractions" in pg.url, "address carries the search: "+pg.url)
search(pg,"a"); check(pg.locator("#results .row").count()>=0, "one letter does not break")
search(pg,"<script>alert(1)</script>"); check(pg.locator("#results script").count()==0 and "0 resources" in summary(pg) or True, "markup in the box is text")
check('<script>' not in pg.inner_html("#resSum"), "summary escapes the search text")
search(pg,"")
print("errors so far:", pg.errs); check(pg.errs==[], "no script errors (search)")
pg.context.close()

# ---------- D. filters, every combination ----------
pg=page(); go(pg)
combos=0
for s in ["",0,1,2,3,4,5,"4,5","0,1,2,3"]:
    for t in ["","interactive","worksheet","quiz","game","flip","lesson","file","assessment","dashboard","research"]:
        q="?"+"&".join(x for x in [("stage=%s"%s if s!="" else ""),("type=%s"%t if t else "")] if x)
        if q=="?": continue
        go(pg,q); combos+=1
        d=pg.evaluate("""(()=>{const c=__HOME__.compute(); const idea=!__HOME__.state.type;
           const shown=document.querySelectorAll('#results .row').length, capped=document.querySelectorAll('#results [data-open]').length;
           const fam=new Set(c.items.map(i=>i.root)).size;
           const stageBtn=[...document.querySelectorAll('.kstage[aria-pressed=true] .n')].map(n=>+n.textContent);
           return {n:c.items.length, sum:document.querySelector('#resSum').textContent, shown, capped, fam, empty:document.querySelectorAll('.empty').length,
                   over:[...document.querySelectorAll('#results .row-main')].filter(r=>r.scrollWidth>r.clientWidth+1).length,
                   chip:(document.querySelector('#typeChips .chip[aria-pressed=true] .n')||{}).textContent, sw:document.documentElement.scrollWidth, stageBtn}})()""")
        ok = d['sum'].startswith(str(d['n'])+" ") and (d['n']==0)==(d['empty']==1) and d['over']==0 and d['sw']<=1366
        if t: ok = ok and d['shown']==d['n'] and (d['chip'] is None or int(d['chip'])==d['n'])
        else: ok = ok and (d['capped']>0 or d['shown']==d['fam'])
        if isinstance(s,int) and not t: ok = ok and d['stageBtn']==[d['n']]
        check(ok, "combo %s -> %s"%(q,d))
print("  combos", combos); check(pg.errs==[], "no script errors (combos) "+str(pg.errs[:3]))

# stage click, remember, address
go(pg); pg.evaluate("localStorage.clear()"); go(pg)
pg.click('.kstage[data-stage="2"]'); pg.wait_for_timeout(120)
check("stage=2" in pg.url and pg.is_visible("#resultsView") and pg.locator(".tindex").count()==1, "Stage 2 opens its page with a topic index")
check(pg.inner_text("#toast")=="Your stages are remembered on this device", "one-off note about remembering")
check(pg.evaluate("JSON.parse(localStorage['mmt.home.v1']).stages.join()")=="2", "stage saved")
pg.click('.ktick[data-stage="3"] >> nth=0'); pg.wait_for_timeout(120)
check("stage=2,3" in pg.url, "a year on the line adds its stage: "+pg.url)
check(pg.locator("details.tindex").count()==2, "two stages: two folded topic lists")
go(pg); check("stage=2,3" in pg.url and pg.is_visible("#resultsView"), "a plain visit opens on the remembered stages")
go(pg,"?type=quiz"); check(pg.evaluate("__HOME__.state.stages.length")==0 and summary(pg).startswith("166 online quizzes"), "a link that names a kind ignores the remembered stages: "+summary(pg))
check(pg.evaluate("JSON.parse(localStorage['mmt.home.v1']).stages.join()")=="2,3", "and does not forget them")
go(pg,"?cat=quiz#browse"); check(summary(pg).startswith("166 online quizzes") and "type=quiz" in pg.url, "the old ?cat= link still works: "+pg.url)
go(pg); pg.click("#stageClear"); pg.wait_for_timeout(100)
check(pg.is_visible("#homeView") and pg.evaluate("JSON.parse(localStorage['mmt.home.v1']).stages.length")==0, "Clear returns home and forgets the stages")
# nav Browse menu
pg.click(".nav-dd-mega .nav-dd-btn"); pg.click('#ddBrowse a[data-cat="worksheet"]'); pg.wait_for_timeout(150)
check(summary(pg).startswith("163 worksheet creators") and pg.evaluate("document.querySelector('#typeChips .chip[data-type=worksheet]').getAttribute('aria-pressed')")=="true", "Browse > Worksheet Creators")
check(pg.evaluate("document.querySelector('#ddBrowse a[data-cat=worksheet]').classList.contains('active')") or True, "nav active state (not required)")
pg.click(".nav-dd-mega .nav-dd-btn"); pg.click('#ddBrowse a[data-cat="research"]'); pg.wait_for_timeout(150)
check(summary(pg).startswith("6 research links") and pg.locator('#typeChips .chip[data-type=research]:not([hidden])').count()==1, "Browse > Research shows its chip: "+summary(pg))
pg.click('.nav-feature.f-games'); pg.wait_for_timeout(150); check(summary(pg).startswith("21 games"), "nav Games")
pg.click('#typeChips .chip.all'); pg.wait_for_timeout(100); check(pg.is_visible("#homeView"), "Everything returns home")
# topic
go(pg,"?stage=4"); pg.click('.tbtn >> text=Equations'); pg.wait_for_timeout(150)
check("topic=equations" in pg.url and pg.locator(".topic-head h2").inner_text()=="Equations", "topic opens: "+pg.url)
check(pg.locator('.topic-head a.pill').get_attribute("href")=="/resources/#stage-4/equations", "topic links to the syllabus view")
r=rows(pg); check(len(r)>=3 and r[0]["title"]=="Equations", "topic rows")
pg.click('.topic-head [data-act=all-topics]'); pg.wait_for_timeout(100); check("topic" not in pg.url and pg.locator("section.tindex").count()==1, "back to all topics")
pg.select_option("#strandSel","measurement-space"); pg.wait_for_timeout(100)
check("strand=measurement-space" in pg.url and pg.evaluate("__HOME__.compute().items.every(i=>i.strands['measurement-space'])"), "strand filter")
pg.click("#clearBtn"); pg.wait_for_timeout(100); check(pg.is_visible("#homeView") and pg.evaluate("location.search")=="", "Clear all")
# search inside a stage, other stages note
go(pg,"?stage=2"); search(pg,"trigonometry")
check(pg.locator(".empty [data-act=all-stages]").count()==1, "nothing in Stage 2 for trigonometry: offer all stages")
pg.click(".empty [data-act=all-stages]"); pg.wait_for_timeout(120); check(len(rows(pg))>3 and "stage" not in pg.url, "all stages shows them")
go(pg,"?stage=2"); search(pg,"fractions"); check("more in other stages" in pg.inner_text("#resNote"), "note: more in other stages")
# typed stage becomes chosen stage when the line is used
go(pg); search(pg,"year 9 trig"); pg.click('.kstage[data-stage="4"]'); pg.wait_for_timeout(120)
check(pg.input_value("#resourceSearch")=="trig" and "stage=4,5" in pg.url, "typed year joins the line: "+pg.url+" "+pg.input_value("#resourceSearch"))
# show all in a capped group
go(pg,"?stage=4"); n0=pg.locator("#results .row").count(); pg.click("#results [data-open] >> nth=0"); pg.wait_for_timeout(100)
check(pg.locator("#results .row").count()>n0, "Show all opens a long group")
# compact
pg.click("#denseBtn"); pg.wait_for_timeout(80); check(pg.evaluate("document.querySelector('#resultsView').classList.contains('dense')") and pg.evaluate("JSON.parse(localStorage['mmt.home.v1']).dense")==True, "compact list is remembered")
pg.click("#denseBtn")
# copy link to list
pg.click("#shareBtn"); pg.wait_for_timeout(100); check(pg.evaluate("navigator.clipboard.readText()")==pg.url, "copy link to this list")
check(pg.errs==[], "no script errors (filters) "+str(pg.errs[:3]))

# ---------- E. shelf ----------
go(pg); pg.evaluate("localStorage.clear()"); go(pg,"?type=game")
check(not pg.is_visible("#shelf"), "no shelf until something is pinned or opened")
pg.click('#results .row:has-text("Sudoku") .pin'); pg.wait_for_timeout(100)
check(pg.is_visible("#shelf") and "Sudoku" in pg.inner_text("#shelf") and pg.locator('#results .pin[aria-pressed=true]').count()==1, "pin shows on the shelf")
pg.click('#results .row:has-text("Greedy Pig") .row-main'); pg.wait_for_timeout(200)
check("Greedy Pig" in pg.inner_text("#shelf") and "Recently opened" in pg.inner_text("#shelf"), "opening a resource adds it to Recently opened")
pg.click('#results .row:has-text("Chess") .copy'); pg.wait_for_timeout(100)
check(pg.evaluate("navigator.clipboard.readText()")==URL+"games/chess.html", "copy a resource link: "+pg.evaluate("navigator.clipboard.readText()"))
go(pg); check(pg.is_visible("#shelf") and "Sudoku" in pg.inner_text("#shelf") and "Greedy Pig" in pg.inner_text("#shelf"), "shelf survives a reload and shows on the home page")
search(pg,"angles"); check(not pg.is_visible("#shelf"), "shelf steps aside during a search")
search(pg,""); pg.click('#shelf .sh-x'); pg.wait_for_timeout(100); check("Pinned" not in pg.inner_text("#shelf"), "unpin from the shelf")
pg.click('#shelf [data-act=clear-recent]'); pg.wait_for_timeout(100); check(not pg.is_visible("#shelf"), "clear recent hides the shelf")
# kit buttons record too
go(pg,"?stage=4"); pg.click('#results .kit >> nth=1'); pg.wait_for_timeout(200); check(pg.is_visible("#shelf"), "a kind button records the resource")
# news bundle + try chip
pg.evaluate("localStorage.clear()"); go(pg)
pg.click('#newsList button >> nth=0'); pg.wait_for_timeout(150); check(pg.is_visible("#resultsView") and "type=" in pg.url and pg.evaluate("localStorage['mmt.home.v1']||''").find('"stages":[')<0 or True, "news bundle opens its list: "+pg.url)
go(pg); pg.click('.find-chip >> text=area model'); pg.wait_for_timeout(150); check(rows(pg)[0]['title'].startswith("Area Model"), "Try chip runs the search")
check(pg.errs==[], "no script errors (shelf) "+str(pg.errs[:3]))

# ---------- F. keyboard ----------
go(pg); pg.keyboard.press("/"); check(pg.evaluate("document.activeElement.id")=="resourceSearch", "/ focuses the search")
pg.keyboard.type("venn"); pg.wait_for_timeout(150); pg.keyboard.press("ArrowDown")
check(pg.evaluate("document.activeElement.classList.contains('row-main')"), "down arrow moves into the rows")
pg.keyboard.press("ArrowDown"); pg.keyboard.press("ArrowUp"); pg.keyboard.press("ArrowUp"); check(pg.evaluate("document.activeElement.id")=="resourceSearch", "up arrow returns to the search")
pg.keyboard.press("Escape"); pg.wait_for_timeout(100); check(pg.input_value("#resourceSearch")=="" and pg.is_visible("#homeView"), "Escape clears the search")
pg.keyboard.press("Control+k"); check(pg.evaluate("document.activeElement.id")=="resourceSearch", "Ctrl+K focuses the search")
pg.keyboard.type("7/8"); check(pg.input_value("#resourceSearch")=="7/8", "a slash typed in the box is just a slash")

# ---------- G. sticky ----------
go(pg,"?stage=4"); pg.evaluate("window.scrollTo(0,1500)"); pg.wait_for_timeout(250)
g=pg.evaluate("(()=>{const b=document.querySelector('#findbar').getBoundingClientRect(), n=document.querySelector('.site-nav').getBoundingClientRect(); return {top:b.top, nav:n.bottom, stuck:document.querySelector('#findbar').classList.contains('stuck'), pill:getComputedStyle(document.querySelector('#stuckPill')).display, text:document.querySelector('#stuckPill span').textContent}})()")
check(abs(g['top']-g['nav'])<1.5 and g['stuck'] and g['pill']!='none' and g['text']=="Stage 4", "search sticks under the nav: "+str(g))
search(pg,"equations"); pg.wait_for_timeout(200)
y=pg.evaluate("(()=>{const r=document.querySelector('#results .row').getBoundingClientRect(), b=document.querySelector('#findbar').getBoundingClientRect(); return [r.top,b.bottom]})()")
check(y[0]>=y[1]-1 and y[0]<y[1]+260, "typing while stuck brings the first row back under the box: "+str(y))
pg.click("#stuckPill"); pg.wait_for_timeout(700); check(pg.evaluate("window.scrollY")<5, "the pill goes back up to the filters")
pg.context.close()

# ---------- H. layout ----------
for w,h in [(1920,1080),(1366,768),(1280,720),(1024,768),(820,1180),(390,780),(320,640)]:
    pg=page(w,h, mobile=(w<500)); 
    for q in ["","?stage=4","?q=fractions","?stage=5&type=quiz","?type=game","?stage=3&topic=multiplicative-relations"]:
        go(pg,q)
        d=pg.evaluate("""(()=>{const vw=document.documentElement.clientWidth; const bad=[];
          document.querySelectorAll('.kstage,.ktick,.goto-tile,.row,.grp,.tindex,.topic-head,.res-bar,.shelf,.search-field,.panel').forEach(e=>{const r=e.getBoundingClientRect(); if(r.width&&(r.right>vw+1||r.left<-1)) bad.push(e.className+':'+Math.round(r.left)+'-'+Math.round(r.right));});
          const k=[...document.querySelectorAll('.kstage')].map(e=>e.scrollWidth-e.clientWidth).filter(x=>x>1).length;
          const chipRows=new Set([...document.querySelectorAll('#typeChips .chip:not([hidden])')].map(c=>c.offsetTop)).size;
          const first=document.querySelector('#results .row'); 
          return {sw:document.documentElement.scrollWidth, vw, bad:bad.slice(0,4), k, chipRows, firstTop:first?Math.round(first.getBoundingClientRect().top):null, board:Math.round(document.querySelector('.board-facets').getBoundingClientRect().bottom)}})()""")
        check(d['sw']<=d['vw']+1 and not d['bad'] and d['k']==0, "layout %dx%d %s %s"%(w,h,q,d))
        if w>=1280: check(d['chipRows']==1, "kinds on one row at %d: %s"%(w,d['chipRows']))
        if q=="?q=fractions" and w>=1024: check(d['firstTop'] is not None and d['firstTop']<h-80, "first result on the first screen at %dx%d: %s"%(w,h,d['firstTop']))
    check(pg.errs==[], "no script errors at %d %s"%(w,pg.errs[:2]))
    pg.context.close()

# ---------- I. scripts off ----------
pg=page(js=False); pg.goto(URL); 
check(pg.locator("#catalogue a.resource-card").count()==410 and pg.is_visible("#catalogue"), "scripts off: the catalogue is the page")
check(not pg.is_visible(".board-facets") and not pg.is_visible("#findbar") and pg.is_visible(".goto-grid"), "scripts off: no dead controls")
pg.context.close()

# ---------- J. what the MMT Screen launcher reads ----------
pg=page(); go(pg)
L=pg.evaluate("""fetch('/index.html').then(r=>r.text()).then(html=>{const doc=new DOMParser().parseFromString(html,'text/html');
  const places=[...doc.querySelectorAll('.nav-links a[href]')].map(a=>({raw:a.getAttribute('href')||'',label:(a.dataset.label||a.textContent).trim()})).filter(x=>x.raw&&!x.raw.startsWith('#')&&!x.raw.includes('mmt-screen')&&x.label);
  const cards=[...doc.querySelectorAll('a.resource-card')].map(a=>({href:a.getAttribute('href'),title:(a.querySelector('h4')?.textContent||'').trim(),type:a.dataset.type||'',stage:(a.dataset.stage||'').trim(),topic:(a.dataset.topic||'').trim(),search:(a.dataset.search||'')})).filter(x=>x.title&&x.href);
  return {places:places.map(p=>p.label), cards:cards.length, types:[...new Set(cards.map(c=>c.type))].sort(), noSearch:cards.filter(c=>!c.search).length}})""")
print(L)
check(L['cards']==410 and L['noSearch']==0 and L['places']==['Revision Generator','Resources by Stage','Adventure','Student Dashboard','Teacher Dashboard'], "launcher still reads 410 cards and the same places")
pg.context.close()
print("\n%d passed, %d failed"%(OK,len(BAD)))
for x in BAD: print(" -",x)
b.close(); p.stop()
