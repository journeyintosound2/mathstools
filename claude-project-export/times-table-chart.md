# Times Table Chart (rebuilt 2026-11-18)

`interactive-tools/stage-3/number/timestable-chart/index.html` — same URL as the old "Interactive Timestable Chart", rebuilt as one self-contained file on the MMT shell (the Number Groups / Multi-Step Equations layout). localStorage `mmt.timesChart.v1`; test surface `window.__TT__`.

## Design in one line
One multiplication chart, ten "lenses". A fact you click becomes a rectangle from the top-left corner, and the chart zooms into it — the same squares growing, never a second picture.

## How it is built
- **Camera.** Every square is an absolutely placed div. `S.cam = {x, y, u, gr, gc}` positions them all (`placeCells`, `cellX/cellY`). Zooming = tweening the camera to fit region `[0..R]×[0..C]` (always contiguous with its headers because every rectangle starts at the corner). Squares outside the region get `.out` and fade. `gr/gc` open gaps between rows/columns (Divide › Share it).
- **Overlay SVG `#ov`** (outlines, the cut, labels, the diagonal, mirror arrows) is rebuilt from the camera each frame. Parts carry keys; only new keys animate in (`S.ovKeys`).
- **Everything comes from `S`**; `render()` repaints, Back is `step - 1`. Cell looks are computed per lens in `lookFn()`; statement/info in `readout()`.
- **Layout.** Chart on the left (square, `--side`), readout column on the right (lens picker, statement in maths font, lens options, info, hint). `fit()` sizes from the window. Narrow screens stack (chart under the statement) and scroll. Side panel (fact steppers + steps) starts folded under 1200px.

## The ten lenses (keys 1–9 and 0, T opens the picker)
**Multiply and divide** (choose a fact, then Next):
1. **Build the rectangle** — build → count row by row (the right-hand column of the rectangle IS the skip count: 6, 12, 18, 24) → the answer in the corner → *Turn it around*: a 3D flip over the diagonal (`rotate3d(1,1,0,180deg)`), landing as 6 × 4.
2. **Find it** — row, column, where they meet, turn it around (mirror arrow across the diagonal).
3. **Split it** — known facts / distributive: 5 and the rest, 10 and the rest, halves, double and the rest, one less; 9 gets "10 take away 1" (region grows to 10 rows, the extra row hatched red). The cut is draggable; rows or columns.
4. **Double it** (added 2026-11-19 from a colleague's feedback: "a 'double double' feature so students can use known multiples to find unknown multiples. 6 × 4 = 24, double 24 is 48") — halve one number until it is odd, start from a fact you know, then double back up. `doubleInfo()` halves the number with more factors of 2 (8 → 1, 2, 4, 8). **Default start is "double double"** (6 × 8 starts at 6 × 2 = 12 → 24 → 48); chips on the board pick another start (6 × 4 = one double, 6 × 1 = double double double) and a switch picks rows or columns (an odd one is disabled). Each doubling is its own colour; a copy of the block so far slides across by its own width (`playCopy`, `.copySheet` in `#flipLayer`); the corners along the edge show 6, 12, 24, 48, and the answer appears only on the last step. Readout: "6 × 4 = double 12 = 24" per line. Both numbers odd → "Both numbers are odd… Try Split it". New fact (Enter) prefers a number that halves twice (4, 8, 12).
5. **Divide** — start at the divisor, count the jumps along the row (badges 1…q), read the top, share into exploded rows, fact family. ÷ row or ÷ column.
6. **Fraction of an amount** — the rectangle is the whole, columns are the parts, headers become k/c, the bottom of the last part taken is the answer. Click a column to change k.

**Look for patterns:**
7. **Factors** — every cell with the value, each one's rectangle outlined, factors lit on the headers; notes on off-chart pairs, squares, primes.
8. **Multiples** — up to three numbers (header clicks or chips), common multiples green, lowest ringed, lists in the readout.
9. **Patterns** — turnarounds, square numbers, L-shapes (each L adds to a cube), same numbers, odd and even, last digits. Teacher notes sit behind a reveal in the side panel.
0. **Cover up** — all covered; Quiz me (Enter) lights a hidden fact's row and column; click to check. Header click covers/uncovers a row or column.

Patterns and Multiples have a "Print this pattern / chart" chip that opens the poster maker set to the same pattern.

## Pedagogy rules kept
- Colour = role: first number (rows) blue, second (in each row) orange, product green.
- The answer is never in the statement or revealed on the chart before its step (unless the teacher turns on Keep faded values).
- No acronyms or rules on screen; the board carries the picture, the teacher the talk (prompts are questions; notes are hidden).

## Settings
Chart size 10 × 10 / 12 × 12 · New facts from (any / 2–5 / 2–10 / tricky 6–9) · Read 4 × 6 as "4 rows of 6" / "4 groups of 6" / "4 times 6" · Turn-it-around step · **Keep faded values** (off by default: the squares keep their numbers very faint and each reveal makes the ones that matter dark) · hover preview · tint the diagonal · animations.

## Keys
→/← step · **R** start the steps again · **Space** back to the whole chart · **Enter** a new fact of the current lens at any step · T choose a lens · 1–9, 0 lenses · F full screen · **Esc** leaves full screen (and only Esc does; otherwise it goes back to the whole chart). A button just clicked with the mouse never swallows Enter/Space. Arrow keys move a cursor round the chart only when it was reached with Tab and nothing is chosen.

## Tools menu
**Printable chart** (link carries the current pattern) and a **Related tools** flyout (opens on hover or click): Area Model, Factor Circles, Division by Grouping, Halve and Halve Again, Fraction of an Amount; games Maths Memory, Dots and Boxes, Closest to 100.

## Printable Times Table Chart (poster maker, 2026-11-18)
`worksheet-creators/stage-3/number/times-table-chart-printable.html` — made after a teacher asked for a colourful multiplication chart template that shows how multiples connect.
- One poster is SVG in A4 millimetres; a page places 1 (poster), 2 (desk) or 4 (small) posters on A4 or A3, portrait or landscape, with dashed cut lines. The preview is the print (`@page` size set per paper, margins none).
- Themes: rainbow (stripes, clouds, stars), confetti (scattered pieces + ribbon title), stars (night-sky band, planet), polka dots (scalloped band), clean. Sticker-style title (editable), optional line under it.
- Patterns: Rainbow, Rows of multiples (each row tinted its number's colour), Square numbers, Turnarounds, L-shapes, Same numbers, Odd and even, Last digits, Multiples of up to three numbers (common green, lowest common multiple ringed). Every number has one colour on both the top and the side.
- Key to the colours, a question to talk about, "how to read it" line; numbers all / some blank (New blanks) / products blank; full colour, ink saver, black and white.
- URL params from the chart: `?pattern=squares`, `?pattern=mult&m=4,6`, `&n=10`. Options saved in `mmtTimesPoster.v1`; test surface `window.__TP__`.

## Type your own
`7 × 8` · `56 ÷ 8` (→ Divide) · `2/3 of 24` (→ Fraction) · `24` or `factors of 24` (→ Factors). Refuses anything not on the chart, with the reason. A typed fact keeps Double it if that lens is open.

## Findability
Homepage card "Times Table Chart" (Stage 3, Number, MA3-MR-01) with a long `data-search` and a "times tables" chip under the search box; "Printable Times Table Chart" card in Worksheet Creators. toolLinks rows under MA3-MR-01, MA3-MR-02 (both tool + printable) and MA3-RQF-02; toolFamilies folds the printable into the chart's row.

## Removed
The old Stage 4 "Fraction of Amount Using a Timestable Chart" tool, quiz and worksheet (redundant). Its registry entry stays, disabled, so old results keep their name.

## Verified
6,903 layout checks (7 lenses incl. Double it × 10 facts × every step × 4 screen sizes), 56 interaction checks, 23 checks on the feedback changes and the poster maker (810 option combinations render cleanly, text stays on the page, print shows only the poster, A3 page size), full-screen Esc/Enter checks, 16 Double it checks (every fact on a 12 × 12 chart re-checked line by line, start chips, rows/columns, odd × odd, new facts, the sliding copy, key 0).

## Possible next
A student quiz (recall ladder that withdraws the chart), a worksheet creator for split-it and double-double practice, and a Stage 2 (MA2-MR) listing once Stage 2 content statements are in `contentStatements.js`.
