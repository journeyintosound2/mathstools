# Addition by Compensation — Stage 3

Two files, both under **MA3-AR-01** (toolLinks rows + homepage cards). Built 2026-09-30. Sibling of [[constant-difference]] (the subtraction strategy).

- Teaching tool `interactive-tools/stage-3/number/addition-compensation/index.html` — test surface `window.__AC__`
- Student quiz `online-quizzes/stage-3/number/addition-compensation.html` — test surface `window.__ACQ__`

**The tool's Tools menu is ONE row: Student Quiz** (teacher decision 2026-09-30 — the Constant Difference link was removed). The quiz links back to the tool.

## The picture
live statement `35 + 50 = ?` · −1 / +1 chips · TWO PILES OF TILES · original `36 + 49 = ?` in a pill

## Pedagogical decisions
1. **Tiles stand in columns of ten (rods)** — tens and ones read at a glance; 49 is visibly one short of five tens.
2. **Each pile's unfinished ten stands next to the middle**, so the two unfinished tens face each other across the divider and a tile's trip is short.
3. **The gap to the next ten is drawn** as dashed empty slots in the unfinished column (toggle in the tool, always on in the quiz).
4. **A moved tile keeps its colour** — 50 is forty-nine orange tiles and one blue. Nothing is made or lost, so the total visibly can't change.
5. **Equal-and-opposite chips** (−1 / +1) — the mirror of Constant Difference's matching +2/+2 hops.
6. The live number turns **green on a ten** (not 0, not mid-drag). Total is `?` until shown/marked.
7. The `+` in both statements sits over the divider, each number over its own pile.

## Interaction (tool and quiz)
- Tap to select/unselect; drag a tile (or the selected group on that side) across; drag on empty space to box-select (one side only). Drop on the other half (tints green) to move; anywhere else snaps back and deselects.
- Removing a tile swap-fills its slot with the pile's LAST tile — one tile slides, no ripple.
- Buttons/keys move 1 (tool) or 1 and 10 (quiz: ←10 ←1 1→ 10→, Shift+arrow = 10), sending visiting tiles home first (so the opposite arrow is an undo). Back to the start restores colours and order.

## Tool numbers
One addend ends in 9 / 8 or 9 (default) / 7, 8 or 9; the other has between (gap) and 6 ones. Total under 100 (default) / 100+ / either. Type your own (1–99). Tool lays 100+ totals out as plain columns (no flats yet).

## Student quiz
Registry `addition-compensation-quiz`, writes `tool: "addition-compensation-student-quiz"`, masteryTopic `addition-compensation`. 10 questions. Same ladder as Constant Difference.

| Level | Model | Numbers |
|---|---|---|
| Sweet | whole tool | 2-digit, total under 100, one number ends 7/8/9 |
| Mild | whole tool | totals 100–199 (incl. 97–99 + n → make 100; 1x7–1x9 + 2-digit) |
| Medium | whole tool | 3-digit, one number 1–35 below a hundred, the other has enough tens AND ones to give without breaking anything, and is not itself near a hundred (last two digits ≤ 59) |
| Spicy | none | Mild's numbers |
| Extra Spicy | none | Medium's numbers |

**Big numbers — flats.** A full hundred is bundled into a FLAT (10×10 cells, drawn smaller) at the pile's outer end, stacked 2 high (up to two hundreds) or 3 high (beyond). Reading outward from the middle: loose ones · rods · flats. So a side never needs more than nine rods + a loose column, the scale is fixed per question, and 97 + 3 visibly bundles ten tens into a hundred. Flat tiles are locked (never needed). Tiles ≥ 12px at 1024 wide even at Medium.

Answer never on screen before marking; first attempt only scores; Next settles unanswered as wrong; confetti only on a scoring answer. types[]: `add:s/t`, `usedten:n/t` (model levels — a pile landed on a multiple of ten before marking), `level:`, `model:on|off`. No typed answer in the payload. Shared sign-in (`quizAuthUI.js`), early submit `import()`ed + registered, button in `#mmtSubmitSlot`.

## Verified — Playwright
Tool 63k checks. Quiz 42k over HTTP with the real shared files: 9000 generated questions against the rules; slot geometry (no overlaps, each side stays on its side and on the board) for pile sizes 0–999; every level played through — tens by button, a one by drag, then buttons — reaching the friendly number with the right live statement, green, correct flat count and every tile inside the board; answer never on screen early; first-attempt scoring; payload; 97 + 3 bundles into one flat of 100 locked tiles; home; early-submit button; worst case (everything on one side) at six viewports.

## Not built
Worksheet creator. Possible: port flats into the teaching tool's "100 or more" mode.
