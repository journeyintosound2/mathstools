# Halve and Halve Again — Stage 3

`interactive-tools/stage-3/number/halve-and-halve-again/index.html`
Cross-listed under **MA3-MR-01** and **MA3-MR-02**. Built 2026-09-07 from
Jeff's own sketch. No Firebase, no registry entry, no siblings yet.

A bar holding the whole number is cut in half, and in half again, until the
number of equal parts **is** the divisor. Only ÷ 2, ÷ 4 and ÷ 8 exist, because
those are the only divisors repeated halving reaches; sixteenths on a classroom
screen are too thin to hold a number.

## The three decisions that shape it

**The answer is what ONE part is worth.** The last press does not consume a
part — a *copy* of the leftmost one flies out and lands opposite the equals
sign while the bar keeps every part, and the part it came from turns green.
Taking one away would be a different question. A check asserts the bar still
holds all its parts afterwards.

**The number sentence stays open until that last beat.** The *bar* may already
show what one part is worth — that is the method, and hiding it would leave
nothing to read — but `#sAnswer` is `?` until the copy-out. A check plays every
question right through and fails if the answer appears on the card early.

**The split is swell → pop → fall, and all three beats matter.** The amount
swells first, so the class is looking at the number about to be shared, not at
the box. Then it pops. Then the two children start life covering exactly the
box their parent filled and slide apart into their own halves — starting them
anywhere else shows two numbers *arriving* rather than one being *cut*. That is
the whole animation, and it is what makes halving visible rather than asserted.

## Structure

**Everything on screen is derived from `S.step`.** `partsAt(k)`, `valueAt(k)`,
the ladder rows, the progress dots and the prompt are all folds over that one
number, so Back is literally `S.step--` and a repaint, and no two displays can
disagree. Never cache a part value or a ladder row.

**The halving ladder is the written record**, revealed a row per split —
`96 ÷ 2 = 48`, `48 ÷ 2 = 24`, then "Halved twice" and the total. Same job the
partial-quotient column does in [[division-grouping-bubbles]]: the picture and
the written method side by side.

**The check is doubling back up the same ladder** — `4 × 24 = 96`, with
"Double it back: 24 → 48 → 96". Doubling is the inverse of the thing just done,
so the check is *read off* the picture rather than worked out again. That is
also why the tool is cross-listed under MA3-MR-02.

**"Why it works" is off by default** (teacher decision 2026-09-07):
"÷ 4 is ÷ 2 then ÷ 2, because 2 × 2 = 4". The plainest board is what a teacher
gets without asking; the equivalence is a reveal they choose.

**"Keep each stage on screen" turns it into a halving wall** (off by default).
Every completed stage stays above the live bar, muted and half height, with a
row label naming it. All bars share one fixed 62px label gutter so they start
and end at the same x — a wall only reads as halving if the wholes line up.
With a single bar the gutter is removed (`.barStack.solo`), because the label
just repeats the chip and costs the bar 62px of width.

## Layout traps

**How tall the bar can be is a question about height, and it is measured.**
`fitBar()` binary-searches `--barH` against the real page: grow until the
control card would drop below the fold, then step back. A guessed clamp left a
third of a 1366×768 screen empty on a one-bar question.

**It is also capped by width** — `(barWidth / divisor) × 1.7`. Eight parts of a
1024-wide board are 83px across, and a full-height bar turns them into tall
columns, which stops reading as a bar and starts reading as a set of counters.
The cap uses the **final** divisor, not the current part count, so the bar does
not change height between steps.

**The bar is sized before anything is drawn in it**, because the height is what
sets the size of the numerals inside each part (`numSize`). Slots are computed
in real pixels, not percent, for the same reason.

**The question is read before the board exists**, same as the bubbles tool: an
intro veil carrying the sentence alone, and `dismissIntro()` FLIPs that same
element down onto the card. `buildBar()` runs again after it lands, because the
board was sized while the veil was over it.

## Generation

Every dividend is a multiple of its divisor, so every halving on the way down
is a whole number and no part is ever a fraction. Quotients are at least 3 —
8 ÷ 4 is a picture of nothing. Settings: divisor mode (mixed / only ÷2 / ÷4 /
÷8) and number size (two-digit / three-digit / both / type your own), which are
orthogonal. "Type your own" refuses a number that will not halve all the way
down and says which multiple to try.

## Verified — Playwright, 482 checks

4800 generated questions over every divisor mode and range (exactness, digit
range, quotient floor, no repeat, mixed dealing all three); ten questions played
right through with the part count doubling, every part carrying the halved
value, parts equal and filling the bar, the ladder and dots re-derived, the
answer never on the card early, the check block only at the end and saying the
inverse, Back returning exactly to the whole bar; the chip and part names; all
three "why it works" texts; the wall's rows lining up; the typed-question
refusals; the swell/pop/fall sampled mid-animation; the copy-out duplicating
rather than consuming; and the fit at 1366×768, 1280×800, 1024×768, 1920×1080
and 820×1180 with no number spilling its part and no part becoming a tall
column. Harnesses live in the session scratch, not the repo: `check.mjs`,
`shots.mjs`.

## Still to do

A **worksheet creator** and a **student quiz** — both greyed rows in its Tools
menu. Possible extensions to the tool itself: **halving an odd number** (one
part carries the half, which is where a class meets a half of a whole), and a
**doubling mode** running the same bar the other way.

Note: the bubbles tool's own harness asserts its Tools menu is "exactly two
rows". It is four now — the ratio table, and this tool. Session-scratch
harness, so nothing in the repo breaks, but worth knowing.
