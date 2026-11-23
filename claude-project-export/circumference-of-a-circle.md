# Circumference of a Circle — Stage 4

`interactive-tools/stage-4/measurement-space/circumference-of-a-circle/index.html`
Filed under **MA4-LEN-C-01**. Built 2026-09-08, reworked the same day after
Jeff's first run through it. No Firebase, no registry entry, no siblings yet —
the Tools menu holds one live row (Perimeter of Plane Shapes, which links back)
and two greyed ones.

Sixteen steps: three diameters wound onto the rim one at a time, then the whole
circle **rolled out** along the number line, then ten ×10 zooms onto the end of
the circumference, then the name.

## The fact the whole tool rests on

**One diameter of string covers exactly 2 radians**, because arc = rθ and the
diameter is 2r. Three diameters cover 6 radians; a full turn is 2π ≈ 6.283; so
the gap is 2π − 6 radians, which is **π − 3 = 0.1416 of a diameter**. Every
number on screen is derived from that — nothing is a hard-coded constant, and
the answer is never written down before the picture has earned it.

## The three decisions that shape it

**The number line is drawn at the circle's own scale.** One unit on the line is
exactly the drawn diameter (`LU = 2R`), so the line is not a *record* of the
count — it is the circumference unrolled. That is also what makes the roll-out
possible: one turn of a wheel of radius R covers 2πR, and the line's unit is 2R,
so the wheel comes to rest at exactly π. Everything else is forced by it: the
line must reach past 3.14 diameters inside its width, so **R can never exceed
LW/7**, which is why the viewBox is 1400 wide.

**Every zoomed window is centred on the answer.** Window k is
[π − 10⁻ᵏ/2, π + 10⁻ᵏ/2], ten subdivisions wide, so the end of the circumference
never moves: each press is a pure ×10 scale about a fixed point and the marks
simply spread apart and multiply. The first build used round-edged windows
(3.1–3.2, then 3.14–3.15, …) which put the answer at 42%, then 16%, then 59% of
the width — the thing being looked at hopped across the board on every press,
which is exactly what a class cannot follow. The two marks the answer falls
between straddle the middle and are labelled in purple; four more sit either
side.

**Ten zooms, then a way back out.** The ladder runs to eleven decimal places
(3.14159265358 … 359). On the last one, zooming in is greyed out and a **Zoom
all the way out** button appears: two seconds back to the whole picture, landing
on the naming step, so the last thing the class sees is three diameters and a
bit with the bit finally named. `zoomLevel()` returns 0 at `S_NAME`; anything
indexing zoom levels must call it rather than computing `step - S_ZOOM0`.

At the tenth zoom the window is 10⁻¹⁰ wide, so `hi - lo` on two numbers near
3.14 throws away most of the precision the tick positions need. The window
therefore **carries its width** (`w`) rather than recovering it by subtraction.

## The animation

**The wrap is a real winding map, in two beats.** *Lift* moves the straight
diameter to where the wrap begins; *roll* winds it on, the wound part tight
against the rim and the rest still loose on radius R+18. Length is preserved at
every frame, so p = 1 is exactly the arc a diameter of string covers. The first
build ran the loose end off along the **tangent** — truer, but it throws a 376px
straight tail off the bottom of the board on the second diameter, straight
across the number line.

**Then the whole circle rolls.** Rather than lifting the gap off on its own, the
circle itself rolls along the line from 0, laying its rim as it goes and coming
to rest at π — which is where the end of the circumference *comes from*. The
wheel is the same rim rotated: at progress q the material at angle 2πq is the
part touching the line, so `rotate(180 − 360q)` and a travel of `q·π·LU` are two
descriptions of one motion. **A check asserts they agree** — that is the
no-slipping condition, and it is the whole reason one turn lands on the answer.
The band never un-lays what the three diameters already laid (`max(3, q·π)`),
and the static circle dims to 0.10 behind the rolling one.

## Layout traps

**Sub-ticks flank the band, they do not cross it.** Crossing puts a grey rule
through the numeral inside the band; drawing them *under* the band hides the
very tenth mark the gap is read against. Order is band → ticks → numerals.

**The band is drawn the same way at every zoom level**, clamped to the board
rather than switched for a narrow window — switching styles part way through a
zoom makes the bar jump colour mid-flight.

**Short arcs get a leader line, not a label against them.** The gap and the
overshoot both sit within a few degrees of the start mark.

**The board is sized against the real page** (`fitBoard()`), not a guessed `vh`
cap — same lesson as [[halve-and-halve-again]]. Test mode carries five controls
in one row, which wraps to two lines under 1200px and pushed the buttons under
the fold on a 768-high screen; the row's label is hidden below that width.

## Why every circle gives the same number

**"New circle" changes the measurement, not the drawing** (5, 8, 12, 20 cm). The
picture is byte-identical whichever circle is chosen — a check asserts it —
because that *is* the argument for π being a constant. With **Show the
measurements** on (off by default) the same circle also gives C = 25.13 cm and
C ÷ d = 3.14, the arithmetic route to the same number.

## Test a number

The class calls out a number, it is wound on, and the verdict says which side it
falls and by how much: 5 goes 1.59 times around, 3.1 falls short by 0.0416 of a
diameter, 3.14 by 0.00159, 3.142 runs past by 0.000407. Tries accumulate as chips
and the tool states the bracket they have squeezed — the same nested-interval
hunt as the zoom ladder, done by them instead of by the tool. One time around is
**π diameters, not 2π**.

**The magnifier is a camera on the circle itself, not a panel.** There is no
inset lens: the circle is drawn from its own equation at magnification m about
the start mark, so m = 1 is the ordinary circle and every larger m is the same
circle seen closer — the rim visibly straightens as you go in, which is the
thing worth seeing. The zoom is a two-second animation, magnification chosen so
the miss is about 520px wide, and **Closer still ×10** goes further (capped at
×1,000,000). A thumbnail in the corner shows which sliver of rim is on screen.

Numbers that miss by more than a diameter cannot be zoomed into — the button is
greyed and the tool says so — because at 5 or 10 diameters the overshoot is
already bigger than the circle. 4 zooms only ×1.6, which is right: you are meant
to see a curve with an overlapped stretch, not a straight line.

## The answer is never on the board early

3.14 appears nowhere before the first zoom step, 3.1 nowhere before the roll-out
lands, and π is named only at the last step. Checks assert all three at every one
of the sixteen steps.

## Verified — Playwright, 361 checks

The wrapping map keeping its length and landing at exactly 2 radians; the gap
being π − 3 diameters; one turn of the wheel being π units of the line; the ten
zoom windows nesting, each centred on the answer, each a tenth of the one
before, with the end marker at the same pixel at every level and the digits
building to 3.14159265358; no early answer at any step; the three unit bands each
exactly one drawn diameter wide and the gap piece exactly π − 3 of one; the
roll-out sampled mid-flight with turn and travel agreeing to 1.5px and the band
never shrinking, ending on exactly π; the zoom-out button appearing only at the
last zoom, taking two seconds and finishing on the whole picture; Back returning
to an identical picture; all four circles drawing the same board; every display
toggle; predict-first; all six test numbers with the miss stated to three
significant figures; the tries bracket; the camera zoom at four numbers —
magnification, stated size, the rim measurably flattening, ×10 closer, zooming
back out — and the two numbers it refuses; the five input refusals; a full
click-through with the animation on; and the fit at 1366×768, 1280×800, 1024×768
and 1920×1080, including the zoomed test view. Harnesses live in the session
scratch, not the repo: `check.mjs`, `shots.mjs`.

## Still to do

A **worksheet creator** (`worksheet-creators/stage-4/measurement-space/circumference.html`)
— measure-and-divide first (a table of round objects with C, d and C ÷ d
columns, so every group's answer lands near 3.14), then C from d, then d from C,
then radius questions, then contexts. A **student quiz**
(`online-quizzes/stage-4/measurement-space/circumference.html`, registry id
`circumference-quiz`) laddering by what is given and what is asked, ending on
working backwards from C.

Extensions to the tool itself: a **radius mode** (the same wrap counted in radii,
which lands on 2π and is where C = 2πr comes from), an **area** follow-on, and
letting the rolling wheel keep going for a **second turn** — the same fact told
as distance travelled per turn.
