import base64, pathlib
LOGO = base64.b64encode(open('logo.png','rb').read()).decode()

# ---------- small SVG helpers (all in mm) ----------
def likelihood_line(w=176):
    # gradient bar like the tool's slider, ticks 0..1, words under
    stops = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6']
    x0, x1 = 6, w-6
    X = lambda v: x0 + v*(x1-x0)
    s = f'<svg viewBox="0 0 {w} 30" width="{w}mm" height="30mm"><defs><linearGradient id="lg" x1="0" x2="1">'
    s += ''.join(f'<stop offset="{i/4}" stop-color="{c}"/>' for i,c in enumerate(stops))
    s += f'</linearGradient></defs><rect x="{x0}" y="8" width="{x1-x0}" height="3.2" rx="1.6" fill="url(#lg)"/>'
    for i in range(11):
        v=i/10; big = i%5==0 or i in (5,)
        h = 3.4 if i%5==0 else (2.6 if i in (2,3,7,8) else 1.8)
        s += f'<path d="M{X(v):.2f} {11.2} v{h}" stroke="#334155" stroke-width="0.35"/>'
    for v,lab in [(0,'0'),(0.25,'0.25'),(0.5,'0.5'),(0.75,'0.75'),(1,'1')]:
        s += f'<path d="M{X(v):.2f} 6.2 v8.6" stroke="#0f172a" stroke-width="0.45"/>'
        s += f'<text x="{X(v):.2f}" y="19" text-anchor="middle" font-size="3.3" font-weight="700" fill="#0f172a">{lab}</text>'
    for v,lab in [(0,'Impossible'),(0.25,'Unlikely'),(0.5,'Even chance'),(0.75,'Likely'),(1,'Certain')]:
        anc = 'start' if v==0 else 'end' if v==1 else 'middle'
        xx = X(v)-1 if v==0 else X(v)+1 if v==1 else X(v)
        s += f'<text x="{xx:.2f}" y="25" text-anchor="{anc}" font-size="3" font-weight="600" fill="#64748b" letter-spacing=".1">{lab.upper()}</text>'
    return s+'</svg>'

def graph_grid(w=176, h=104, xmax=30, ymax=100, xlab='Number of throws', ylab='Relative frequency of “in” (%)'):
    L,R,T,B = 14, 4, 4, 12
    pw, ph = w-L-R, h-T-B
    X = lambda v: L + v/xmax*pw
    Y = lambda v: T + ph - v/ymax*ph
    s = f'<svg viewBox="0 0 {w} {h}" width="{w}mm" height="{h}mm">'
    for i in range(xmax+1):
        s += f'<path d="M{X(i):.2f} {T} V{T+ph}" stroke="{"#94a3b8" if i%5==0 else "#dbe3ee"}" stroke-width="{0.3 if i%5==0 else 0.18}"/>'
    for j in range(0, ymax+1, 5):
        s += f'<path d="M{L} {Y(j):.2f} H{L+pw}" stroke="{"#94a3b8" if j%10==0 else "#dbe3ee"}" stroke-width="{0.3 if j%10==0 else 0.18}"/>'
    s += f'<path d="M{L} {T} V{T+ph} H{L+pw}" stroke="#0f172a" stroke-width="0.5" fill="none"/>'
    for i in range(0, xmax+1, 5):
        s += f'<text x="{X(i):.2f}" y="{T+ph+4.2}" text-anchor="middle" font-size="3.1" fill="#334155" font-weight="600">{i}</text>'
    for j in range(0, ymax+1, 10):
        s += f'<text x="{L-1.6}" y="{Y(j)+1.1:.2f}" text-anchor="end" font-size="3.1" fill="#334155" font-weight="600">{j}</text>'
    s += f'<text x="{L+pw/2}" y="{h-1.5}" text-anchor="middle" font-size="3.3" font-weight="800" fill="#0f172a">{xlab}</text>'
    s += f'<text transform="translate(3.6 {T+ph/2}) rotate(-90)" text-anchor="middle" font-size="3.3" font-weight="800" fill="#0f172a">{ylab}</text>'
    return s+'</svg>'

def scene():
    # simplified classroom side-on with throw arcs, bin and prize card
    return '''<svg viewBox="0 0 1000 300" class="scene" preserveAspectRatio="xMidYMax meet">
  <defs><linearGradient id="bin" x1="0" x2="1"><stop offset="0" stop-color="#15803d"/><stop offset=".35" stop-color="#22c55e"/><stop offset=".7" stop-color="#16a34a"/><stop offset="1" stop-color="#14532d"/></linearGradient>
  <marker id="ar" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>
  <rect x="0" y="280" width="1000" height="20" fill="#e2e8f0"/><path d="M0 280H1000" stroke="#94a3b8" stroke-width="2"/>
  <g fill="#cbd5e1"><rect x="330" y="226" width="132" height="9" rx="3"/><rect x="338" y="234" width="7" height="46"/><rect x="447" y="234" width="7" height="46"/>
  <rect x="560" y="226" width="132" height="9" rx="3"/><rect x="568" y="234" width="7" height="46"/><rect x="677" y="234" width="7" height="46"/></g>
  <rect x="88" y="277" width="64" height="6" rx="2" fill="#f97316"/>
  <path d="M120 262 Q 480 -60 868 196" fill="none" stroke="#15803d" stroke-width="5" stroke-dasharray="13 10" stroke-linecap="round" marker-end="url(#ar)"/>
  <path d="M120 262 Q 380 40 640 272" fill="none" stroke="#ef4444" stroke-width="5" stroke-dasharray="13 10" stroke-linecap="round" opacity=".75" marker-end="url(#ar)"/>
  <path d="M120 262 Q 560 -20 985 268" fill="none" stroke="#ef4444" stroke-width="5" stroke-dasharray="13 10" stroke-linecap="round" opacity=".75" marker-end="url(#ar)"/>
  <ellipse cx="870" cy="200" rx="47" ry="10" fill="#1f2937"/>
  <path d="M823 200 L839 280 L901 280 L917 200 A47 10 0 0 1 823 200Z" fill="url(#bin)"/>
  <path d="M846 214 L854 270 M870 216 V272 M894 214 L886 270" stroke="#14532d" stroke-width="2" opacity=".28"/>
  <path d="M823 203 A47 10 0 0 0 917 203" fill="none" stroke="#166534" stroke-width="4"/>
  <g transform="translate(120 262)"><circle r="17" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5"/><path d="M-9 -6 L4 -2 L-3 8 M2 -11 L9 4" stroke="#cbd5e1" stroke-width="2" fill="none"/></g>
  <text x="120" y="298" text-anchor="middle" font-size="16" font-weight="800" fill="#c2410c">Throw line</text>
</svg>'''

def prize():
    return '''<svg viewBox="0 0 230 120" class="prize"><rect x="3" y="3" width="224" height="114" rx="12" fill="#fde68a" stroke="#b45309" stroke-width="3"/>
  <rect x="13" y="13" width="204" height="94" rx="8" fill="none" stroke="#d97706" stroke-width="2" stroke-dasharray="5 4"/>
  <circle cx="60" cy="60" r="30" fill="#fbbf24" stroke="#b45309" stroke-width="2.5"/><text x="60" y="71" text-anchor="middle" font-size="30" font-weight="900" fill="#92400e">$</text>
  <text x="152" y="66" text-anchor="middle" font-size="44" font-weight="900" fill="#78350f">$50</text>
  <text x="152" y="92" text-anchor="middle" font-size="16" font-weight="900" letter-spacing="4" fill="#92400e">PRIZE</text></svg>'''

def throw_boxes(n=30, per=10, label='Throw'):
    rows=''
    for r in range(0, n, per):
        rows += '<div class="tbRow">' + ''.join(f'<div class="tb"><span>{i+1}</span></div>' for i in range(r, min(n, r+per))) + '</div>'
    return f'<div class="tbWrap">{rows}</div>'

def lines(n, cls=''):
    return '<div class="lines {}">'.format(cls) + '<div class="ln"></div>'*n + '</div>'

def blank(w='22mm'):
    return f'<span class="blank" style="width:{w}"></span>'

def frac_blank():
    return '<span class="fb"><span class="t"></span><span class="b"></span></span>'

def sec(letter, title, tag):
    return f'<div class="secHead"><span class="secL">{letter}</span><h2>{title}</h2><span class="secTag">{tag}</span></div>'

def q(num, body):
    return f'<div class="q"><span class="qn">{num}</span><div class="qb">{body}</div></div>'

css = pathlib.Path('ws.css').read_text()

head = f'''<div class="band">
  <div class="bandTop"><img src="data:image/png;base64,{LOGO}" class="logo" alt="MMT"/>
    <div class="brand"><b>Mills Maths Tools</b><span>Stage 4 · Statistics and probability · MA4-PRO-C-01</span></div>
    <div class="bandTag">Student worksheet</div></div>
  <div class="bandMain"><div><div class="kicker">Bin Toss</div><h1>Is the $50 prize worth&nbsp;it?</h1>
    <p class="sub">Use data from a real experiment to estimate a chance, then use that chance to run a stall that doesn’t lose money.</p></div>
  </div>
</div>
<div class="nameRow"><div>Name <span></span></div><div>Class <span></span></div><div>Date <span></span></div></div>'''

page1 = f'''<section class="page">
{head}
<div class="hero">
  <div class="heroArt">{scene()}{prize()}</div>
  <div class="challenge">
    <div class="eyebrow">The challenge</div>
    <p>Our class is running a stall at the school fete. Anyone who throws a scrunched-up ball of paper into the bin from the <b>back of the room</b> wins <b>$50</b>.</p>
    <p class="big">How much should we charge to play?</p>
  </div>
</div>
<div class="li">
  <div><div class="eyebrow">Learning intention</div><p>We are learning to estimate a probability from an experiment, and to use that estimate to make a decision.</p></div>
  <div><div class="eyebrow">Success criteria</div>
    <ul class="sc"><li>I can write a relative frequency as a fraction, a decimal and a percentage.</li>
    <li>I can find the probability that something does <i>not</i> happen.</li>
    <li>I can use an estimated probability to predict results and choose a price.</li></ul></div>
</div>
{sec('A','Before we throw','Predict')}
{q('1','Mark with an <b>✗</b> how likely you think it is that a throw goes <b>in</b>.' + '<div class="ll">'+likelihood_line()+'</div>')}
<div class="twoCol">
{q('2','My prediction: &nbsp; P(in) = '+blank('20mm')+' %')}
{q('3','Our class average prediction: &nbsp; '+blank('20mm')+' %')}
</div>
{q('4','Before we have any data, what price would <b>you</b> charge to play? &nbsp; $ '+blank('18mm')+'<div class="hint">Why? Think about how often people would win the $50.</div>'+lines(2))}
</section>'''

page2 = f'''<section class="page">
{sec('B','Run the experiment','Collect data')}
<div class="fair"><b>Fair test.</b> Everyone throws from the same spot, with the same ball, at the same bin. One throw each, then the next person.</div>
{q('1','Throwing from: '+blank('70mm')+'<div class="hint">Write ✓ for <b class="in">in</b> or ✗ for <b class="out">out</b> as each throw happens.</div>'+throw_boxes())}
{q('2','Count the results.<table class="t3"><tr><th>In ✓</th><th>Out ✗</th><th>Total throws</th></tr><tr><td></td><td></td><td></td></tr></table>')}
{q('3','The <b>relative frequency</b> of an outcome is the number of times it happened divided by the total number of trials. It is our <b>estimate</b> of the probability.'
  '<table class="rf"><tr><th></th><th>Fraction</th><th>Decimal</th><th>Percentage</th></tr>'
  f'<tr><th class="rh">P(in) ≈</th><td>{frac_blank()}</td><td></td><td><span class="pcts">%</span></td></tr>'
  f'<tr><th class="rh">P(out) ≈</th><td>{frac_blank()}</td><td></td><td><span class="pcts">%</span></td></tr></table>')}
{q('4','Add your two decimals: &nbsp; P(in) + P(out) = '+blank('20mm')+'<div class="hint">Explain why the answer must always be the same, whatever happens in the experiment.</div>'+lines(3))}
</section>'''

rows = ''.join(f'<tr><td>{n}</td><td></td><td></td></tr>' for n in (5,10,15,20,25,30))
page3 = f'''<section class="page">
{sec('B','Run the experiment (continued)','Watch the estimate change')}
<div class="split">
  {q('5','Look back at your record in B1. Fill in the table after every 5 throws.<table class="run"><tr><th>Throws so far</th><th>Ins so far</th><th>Relative frequency of in (%)</th></tr>'+rows+'</table>')}
  <div class="tip"><div class="eyebrow">Example</div><p>After 10 throws there had been 3 ins.</p>
    <p class="m">3 ÷ 10 = 0.3 = <b>30%</b></p><p>Plot the point (10, 30).</p></div>
</div>
{q('6','Plot your points on the grid and join them with straight lines. Then rule a <b>dashed</b> line across at your class prediction from A3.' + '<div class="grid">'+graph_grid(h=118)+'</div>')}
{q('7','What happens to the line as more throws are made? Why do mathematicians prefer lots of trials?'+lines(3))}
</section>'''

page4 = f'''<section class="page">
{sec('C','Set a price','Use the data')}
<div class="worked">
  <div class="eyebrow">Worked example</div>
  <p>Another class got <b>6 in out of 20</b> throws, so P(in) ≈ <span class="fr"><span>6</span><span>20</span></span> = 0.3 = 30%. They charged <b>$20</b> a go.</p>
  <table class="money">
    <tr><th>If 100 people play</th><td>We expect about 0.3 × 100</td><td class="r">30 winners</td></tr>
    <tr><th>We collect</th><td>100 × $20</td><td class="r">$2000</td></tr>
    <tr><th>We pay out</th><td>30 × $50</td><td class="r">$1500</td></tr>
    <tr class="tot"><th>Profit</th><td>$2000 − $1500</td><td class="r pos">$500</td></tr>
  </table>
</div>
{q('1','Use <b>your class’s</b> P(in) from B3. Imagine 100 people play. &nbsp; P(in) ≈ '+blank('20mm')+'<table class="prices"><tr><th>Price to play</th><th>Expected winners</th><th>We collect</th><th>We pay out</th><th>Profit (or loss)</th></tr>'
  '<tr><td class="p">$5</td><td></td><td></td><td></td><td></td></tr><tr><td class="p">$10</td><td></td><td></td><td></td><td></td></tr><tr><td class="p">$20</td><td></td><td></td><td></td><td></td></tr><tr><td class="p">$'+blank('10mm')+'</td><td></td><td></td><td></td><td></td></tr></table>')}
{q('2','The <b>break-even price</b> is the price where we expect to make $0 profit. Each player has a chance of P(in) of winning $50, so on average each player costs us P(in) × $50.'
  '<div class="calc">Break-even price = '+blank('16mm')+' × $50 = $ '+blank('16mm')+'</div>')}
{q('3','What price would <b>you</b> choose for the fete? &nbsp; $ '+blank('16mm')+'<div class="hint">Give two reasons. Think about profit and whether people would still want to play.</div>'+lines(4))}
{q('4','Compare this with your first guess in A4. Did the data change your mind? Why?'+lines(3))}
</section>'''

plays = throw_boxes(20, 10)
page5 = f'''<section class="page">
{sec('D','Play for money','Test the price')}
{q('1','Our price: $ '+blank('16mm')+' &nbsp; Prize: <b>$50</b>. &nbsp; Record each play: ✓ = won, ✗ = lost.'+plays)}
{q('2','Count the money.<table class="money blankm">'
  '<tr><th>Plays</th><td></td><th>Winners</th><td></td></tr>'
  '<tr><th>We collected</th><td>'+blank('10mm')+' × $'+blank('10mm')+' = $'+blank('16mm')+'</td><th>We paid out</th><td>'+blank('10mm')+' × $50 = $'+blank('16mm')+'</td></tr>'
  '<tr class="tot"><th>Profit</th><td colspan="3">$'+blank('18mm')+' − $'+blank('18mm')+' = $'+blank('18mm')+'</td></tr></table>')}
{q('3','Using your P(in) from B3, how much profit did you <b>expect</b> from this many plays? &nbsp; $ '+blank('18mm')+'<div class="hint">Was the real profit higher or lower? Give a reason why the two can be different.</div>'+lines(4))}
<div class="mistake">
  <div class="mHead"><span class="badge">Spot the mistake</span><b>Jordan’s spreadsheet</b></div>
  <p>Jordan charged <b>$20</b> a go. There were 10 plays and 3 winners. Jordan’s working:</p>
  <table class="sheet"><tr><th></th><th>A</th><th>B</th></tr>
  <tr><th>1</th><td>Money in</td><td>10 × $15 = $150</td></tr>
  <tr><th>2</th><td>Money paid</td><td>3 × $50 = $150</td></tr>
  <tr><th>3</th><td>Profit</td><td>$150 − $150 = $0</td></tr></table>
  {q('4','Find Jordan’s mistake and correct the profit.'+lines(3))}
</div>
</section>'''

page6 = f'''<section class="page">
{sec('E','Take it further','Apply and reason')}
{q('1','Priya’s class found P(in) = 0.35.<div class="sub2"><span>a)</span><span> What is P(out) as a percentage? '+blank('18mm')+' %</span></div><div class="sub2"><span>b)</span><span> In 40 more throws, about how many would you expect to be <b>out</b>? '+blank('18mm')+'</span></div>')}
{q('2','A Year 8 class tested three throwing distances.'
  '<table class="dist"><tr><th>Distance</th><th>Ins</th><th>Throws</th><th>P(in) as a %</th><th>Break-even price ($50 prize)</th></tr>'
  '<tr><td>2 metres</td><td>18</td><td>25</td><td></td><td></td></tr><tr><td>4 metres</td><td>9</td><td>30</td><td></td><td></td></tr><tr><td>6 metres</td><td>4</td><td>40</td><td></td><td></td></tr></table>'
  '<div class="hint">Which estimate do you trust most? Explain.</div>'+lines(2))}
{q('3','P(in) = 0.2 and the price to play is $5. What is the <b>biggest prize</b> the stall can offer and still expect not to lose money? &nbsp; $ '+blank('18mm')+lines(2))}
{q('4','Mia says, “We got 6 in out of 20, so if 100 people play, <i>exactly</i> 30 will win.” Do you agree? Explain.'+lines(2))}
{q('5','At a hook-a-duck stall, 36 of the last 200 players won a $8 prize. It costs $2 to play.<div class="sub2"><span>a)</span><span> Estimate P(win) as a percentage. '+blank('18mm')+' %</span></div><div class="sub2"><span>b)</span><span> What profit would you expect from the next 100 players? $ '+blank('18mm')+'</span></div>'+lines(2))}
<div class="reflect">
  <div class="eyebrow">Reflect</div>
  <p>Is your class’s relative frequency the <b>true</b> chance of getting the ball in? How could you get a better estimate?</p>{lines(2)}
  <div class="self"><span>How did I go?</span>
    <div><i class="dot g"></i>I can do this</div><div><i class="dot a"></i>I’m nearly there</div><div><i class="dot r"></i>I need help</div></div>
</div>
</section>'''

page7 = f'''<section class="page teacher">
<div class="tHead"><img src="data:image/png;base64,{LOGO}" class="logoS" alt=""/><div><div class="kicker">Teacher notes and answers</div><h2>Bin Toss: Is the $50 prize worth it?</h2></div></div>
<div class="tCols">
<div>
<h3>Running the lesson</h3>
<p>Pair this sheet with the <b>Bin Toss</b> teaching tool (millsmathstools.au → Interactive Tools). The tool runs the same steps on the board: predict, record In and Out, see the relative frequency, set a price, then play for money and count it.</p>
<ul>
<li><b>Day 1:</b> sections A, B and C. Students record each throw in B1 while the teacher records in the tool.</li>
<li><b>Day 2:</b> section D with a price the class chose in C3, then section E.</li>
<li>Answers in A to D depend on the class’s own data. Check that relative frequencies add to 1 and that profit = collected − paid out.</li>
</ul>
<h3>Key ideas to draw out</h3>
<ul>
<li>Relative frequency = times it happened ÷ total trials. It is an <b>estimate</b> of probability.</li>
<li>P(in) + P(out) = 1, because every throw is either in or out (complementary events).</li>
<li>The estimate settles down as the number of trials grows (B6, B7).</li>
<li>An estimate tells us about how many to <b>expect</b>, never exactly how many (E4, D3).</li>
<li>Break-even price = P(win) × prize. A stall that wants a profit charges more.</li>
</ul>
<h3>Syllabus</h3>
<p>MA4-PRO-C-01: determine probabilities for chance experiments; determine probabilities for complementary events.</p>
</div>
<div>
<h3>Answers</h3>
<table class="ans">
<tr><th>B4</th><td>1. Every throw is either in or out, so the two relative frequencies always add to the whole.</td></tr>
<tr><th>B7</th><td>The line jumps about early on, then settles closer to one value. More trials give a more reliable estimate.</td></tr>
<tr><th>C worked example</th><td>Break-even price for P(in) = 0.3 is 0.3 × $50 = <b>$15</b>.</td></tr>
<tr><th>D4</th><td>Money in should use the price: 10 × $20 = $200. Paid out 3 × $50 = $150. Profit <b>$50</b>, not $0.</td></tr>
<tr><th>E1</th><td>a) 65% &nbsp; b) 0.65 × 40 = <b>26</b> out</td></tr>
<tr><th>E2</th><td>2 m: 72%, $36 · 4 m: 30%, $15 · 6 m: 10%, $5.<br>The 6 m result uses the most throws (40), so it is the most reliable estimate; all three are small samples.</td></tr>
<tr><th>E3</th><td>0.2 × prize ≤ $5, so the biggest prize is <b>$25</b>.</td></tr>
<tr><th>E4</th><td>Disagree. 30 is what we expect <i>on average</i>; the real number will vary around 30.</td></tr>
<tr><th>E5</th><td>a) 36 ÷ 200 = <b>18%</b> &nbsp; b) collect 100 × $2 = $200, pay about 18 × $8 = $144, profit about <b>$56</b>.</td></tr>
<tr><th>Reflect</th><td>No: it is an estimate from a sample. More throws, or combining several classes’ results, gives a better estimate.</td></tr>
</table>
<div class="ext"><div class="eyebrow">Extension</div><p>Stage 5 students can call P(in) × $50 the <b>financial expectation</b> per play, and compare it with the price to find the expected profit per player.</p></div>
</div>
</div>
</section>'''

html = f'''<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>Bin Toss: Is the $50 prize worth it? | Mills Maths Tools</title>
<style>{css}</style></head><body>{page1}{page2}{page3}{page4}{page5}{page6}{page7}</body></html>'''
pathlib.Path('worksheet.html').write_text(html)
print('ok', len(html))
