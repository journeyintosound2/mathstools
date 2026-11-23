# Division by Grouping (bubbles) — Stage 3

`interactive-tools/stage-3/number/division-grouping-bubbles/index.html`

## The divisor cap is two caps, not one (teacher decision 2026-09-07)

**`MAXDIV = 10` — random questions and the Settings picker.** A class meeting
the tool for the first time is never handed nineteen bubbles. Unchanged.

**`MAXOWNDIV = 25` — "Type your own" only.** The teacher can now share into up
to 25 groups from the opening screen. The point is pedagogical and it is the
whole reason the cap moved: at fifteen groups a teacher can **show** that
sharing into bubbles has stopped being the sensible method rather than assert
it, and [[ratio-table-division]] next door then earns its place instead of
being announced. 25 is the 5 × 5 square.

Nothing else reaches the packs above ten. `pickDivisor()` still draws from
`randInt(2, MAXDIV)`.

**The Settings "Divide by" picker is disabled while the level is `custom`** —
the number of groups is chosen on the opening screen, so leaving the picker
live gave two controls that could disagree.

**Chips 11–25 are dashed, not hidden.** `introChip is-far`. The teacher can see
where the sensible range ends without the tool refusing to go there. The chip
row is capped at `830px` so 2–25 wraps into two tidy rows, not three.

## Layout consequences, all of them height problems

**`PACK` rows stay five wide past ten.** 11:[4,4,3] … 20:[5,5,5,5],
21:[5,4,4,4,4] … 25:[5,5,5,5,5]. Long row first, short rows centred, matching
the existing 5:[3,2] / 7:[4,3] convention.

**`.arena.dense` (4+ rows) shrinks the numerals and labels WITH the bubbles**,
so the strain reads as crowding rather than as text spilling out of circles.

**`fitArena()`'s floor drops as rows are added** — `rows >= 4 ? 30 : rows === 3
? 44 : 62`. At the old floor of 62 the binary search had no size that fitted
five rows, so it returned 62 anyway and pushed the entry bar off the fold.

**`fitArena(true)` now runs again at the end of `dismissIntro()`.** The board
was being sized while the intro veil was still over it, which is not the layout
it lands in — at 1280×800 that left a 25-group board hanging 29px past the
fold. This was a latent bug at every divisor; the 5 × 5 just made it visible.

**Narrow (≤960px) branch is capped for dense grids** —
`min(300/rows, rows >= 4 ? 46 : 999)`. Narrow screens scroll by design (they
already did at ÷2), but 60px × 5 rows was a board no tablet could show.

## Verified — Playwright, 16 checks + 5 viewports

Presets still stop at 10 (dropdown options, and 80 random questions never
exceeding it); chips run 2–25 with exactly 11–25 dashed; 375 ÷ 25 draws
[5,5,5,5,5] with 25 blobs and `.dense`; a round lands in all 25 with no numeral
overflow; 15 draws [5,5,5]. Entry bar above the fold at 1024×768 (33px
bubbles), 1280×800 (50px), 1366×768 (52px), 1920×1080 (100px). 900×700 still
scrolls — as it does unmodified at ÷2, so not a regression.

## Still to do

The bubbles harness asserts the Tools menu is "exactly two rows"; it is three
now that it links back to the ratio table. Unrelated to this change, still open.
