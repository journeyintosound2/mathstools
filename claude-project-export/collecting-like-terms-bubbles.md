# Collecting Like Terms – Bubbles (rebuilt 2026-11-16)

`interactive-tools/stage-4/algebra/collecting-like-terms/index.html` — same URL as the old tool, rebuilt on the
Number Groups / trapezium shell (mmtTopbar, board card + side panel, Settings / Tools menus, panel toggle, full screen,
mini steps). Self-contained, no Firebase. localStorage `mmt.likeTermsBubbles.v1`. Test surface `window.__CLT__`.

**Renamed (Jeff, 2026-11-16):** this tool is **Collecting Like Terms – Bubbles**; the multiplicative one at
`interactive-tools/stage-4/algebra/number-groups/` is **Collecting Like Terms – Number Groups**. Each links the other
first in its Tools menu ("Start here: count the groups" / "Next: collect them by hand").

## The model
- **A term is a bubble of pieces.** 3x is a bubble holding three x pieces; −2x is a red bubble of two −x pieces; a plain
  number 4 is a bubble of four 1s ("a number is a pile of ones"); in Numbers mode 5 × 8 is five 8 pieces.
- The board is the expression in **reading order** (left to right, row by row). The big line above the board is always
  the current board; once a move is made a small "Simplify …" line keeps the question in view.
- **Moves, all by drag (pointer events, works with touch):**
  - bubble onto a like bubble, same sign → **join** (pieces glide in, the bubble grows);
  - bubble onto a like bubble of the opposite sign → **zero pairs**: pieces fly onto partners and pop in pairs with a
    floating "0" and sparks; the bigger side keeps what is left;
  - one piece onto a like bubble → moves across (same sign) or makes **one zero pair** (opposite sign);
  - one piece onto empty space → **split** (5x → 4x + x), Settings can turn this off;
  - bubble into a gap (purple slot bar) → **rearrange**; the sign travels with its term;
  - onto an **unlike** bubble → the target shakes and a toast explains why (x vs y; x vs x² = x × x; groups of 8 vs 5).
  - **Look-alikes:** ab and ba share a key, so they join; the ba pieces re-pop as ab and a toast says a × b = b × a.
- A one-piece bubble is always dragged as a bubble (a single piece out of a bubble of one is just a rearrange).

## The working (side panel)
- Every move adds a line, `= …`, named (Join like terms / Zero pairs / Split a term / Rearrange / Move one across);
  consecutive rearranges collapse into one line. Every line is equal to the first.
- **Show me** (→) plays the next sensible move: (1) like terms side by side, (2) join same signs, (3) zero pairs,
  (4) Numbers mode: "Work out each group" (= 64 + 3) then "Add" (= 67), and the big line ends "= 67".
  **Finish it** plays them all. **Undo** (←) restores full snapshots (tokens that popped come back). Space = start again.
- Done = no two bubbles share a key → tag "Simplified ✓", Show me becomes "Simplified ✓".

## Questions
- Letters (default) or Numbers; Terms 2–6 and Kinds 1–3 (each with a Random dice). Like terms are dealt NOT side by side.
- Settings: taking away (on), plain numbers (off), look-alikes (off; ab/ba or x/x²), group size for Numbers,
  colour each kind (off, so students read the bubbles), split (on), name each move (on).
- Type your own: `3x + 2y − x + 4`, `4ab − 2ba`, `x² + x`, `5 × 8 + 3(8)`. Up to 6 terms, 12 per term, 40 pieces.
- Notation switch as Number Groups: Groups of (3 groups of x, take away) · Times sign (3 × x) · Algebra (3x, 3(7)).

## Layout
- Pieces pack on a hex grid, nearest the middle first (3 = triangle, 7 = flower); bubble radius from the pack.
- One piece size `t` for the whole board: the largest (≤ 72px) that fits every bubble + caption in rows. Captions are
  measured in the page (`capSize`, a hidden `.cap.measure`), not estimated.
- Stacked layout (≤ 980px): instead of shrinking pieces past touch size the board grows taller (`L.grow`).

## Verified (Playwright)
Real-mouse drags (join, zero pair, unlike refused + toast, split, rearrange, undo), Finish it on 60 random questions per
viewport with every kind's total conserved, Numbers evaluation re-derived, undo back to the start, nothing outside the
board / overlapping at 1366×768, 1024×768, 1920×1080, 1280×800, 390×844, no page scroll above 980px.

## The statement morphs (feedback round, 2026-11-16)
- Every term and sign in the big line is keyed to its bubble (`data-k` / `data-op`; question line `data-ok` /
  `data-oop`, ids in `S.origIds`). `paintText` snapshots the old spans, rewrites, and `morphStmt` FLIPs each span from
  where it was (translate + scale), so rearranging slides the terms and a notation change morphs them.
- **First move:** the old line splits in two — one copy shrinks up into "Simplify …" (the word fades in), the other
  slides into the new working line.
- **Like terms collide:** a move sets `S.fx.merge {from, to}` (join, zero pairs, a piece emptying a bubble). Ghost
  copies of the old terms (and the sign between them) crash together at the new term, which pops in — 4y + 3y → 7y.
  If nothing is left (−5x + 5x) a purple "0" puffs instead. `S.fx.bump` pulses terms whose count changed (one piece
  moved across); `S.fx.split` makes the new term emerge from its source.
- A repaint with the same HTML (a resize, a busy repaint) leaves the line alone so a morph in flight keeps going.

## Numbers only (2026-11-16)
- Settings › **Terms are**: Letters / Numbers only (synced with the panel's Letters / Numbers switch, key L). Bubbles hold
  groups of numbers: 5 × 7 + 3 × 7 + 2 × 5 + 2 × 7 + 3 × 5 collects into 10 × 7 + 5 × 5 = 95, exactly like
  5x + 3x + 2y. Type your own accepts `5x7` as 5 × 7. Switching to numbers moves Algebra notation to Times sign.
- **Compare with the long way** (on): after "Work out each group" and "Add", the working gets a dashed aside card — every
  original term multiplied separately, summed, and "5 multiplications the long way · 2 after collecting". The hint
  says "Count the groups first: 2 multiplications instead of 5 — and the same answer."

## Student quiz (rebuilt 2026-11-16)
`/online-quizzes/stage-4/algebra/collecting-like-terms.html` (thin shell) + `collecting-like-terms-quiz/quiz.js` + `quiz.css`.
Same toolId, `collecting-like-terms-student-quiz`, masteryTopic `collecting-like-terms`. 10 questions. English only
(the old escape-room quiz was EN/AR/FA — a translation layer would be a separate job).

**The model (Sweet and Mild):** the panel IS the Bubbles tool, built from the question. Students drag like bubbles
together, drop pieces on their opposites, or press Show me ▸ / ↶. A bubble that has changed is captioned "?x" until
the question is settled, so the student still counts the pieces. A wrong first answer plays every move to the end.

| Level | What it asks |
|---|---|
| Sweet | Two kinds, all added; numbers only (5 × 7 + 3 × 7 + 2 × 5); one box per kind; which bubble can join? |
| Mild | Taking away, plain numbers, a kind that cancels, unlike-terms and minus-sign mistakes |
| Medium | No model; type the whole answer; three kinds; ab = ba; missing numbers; 3x + 2x = 5x² |
| Spicy | x and x² apart, answers below zero, numbers only with three kinds, 5x − x = 5, make your own |

Marking as Number Groups: only the first check scores; equal-but-not-collected, a 0 term or "1x" is a free nudge.

## Worksheet creator (rebuilt 2026-11-16)
`/worksheet-creators/stage-4/algebra/collecting-like-terms.html`, on the Number Groups generator's frame.
A Join the bubbles (printed) · B Zero pairs (printed, red dashed bubbles to cross out) · C Draw the bubbles · D Collect ·
E Taking away · F Plain numbers · G Groups of numbers (work it out; key counts the multiplications saved) ·
H Look-alikes (ab/ba, x/x²) · I Missing terms · J Spot the mistake · K Make your own · L Fluency (off).
Options: level ladder, × or brackets for groups of numbers, "count each kind first" answer space or answer only,
colour or black and white, spacing, worked example (bubbles before and after), name/date, answer key with reasons.

## Answer spaces say what they hold (feedback, 2026-11-16)
- Quiz (Sweet/Mild box questions): "[ ] groups of x + [ ] groups of y" ("[ ] ones" for plain numbers, "[ ] groups of 7"
  for numbers only), with an **All together** line that rebuilds the answer live from what is typed (= 5x + ?y).
- Worksheet: "___ groups of n + ___ groups of j", then "All together = ___". The key writes
  "7 groups of n + 5 groups of j" then "= 7n + 5j", and its reasons read "2 + 3 + 2 = 7 groups of n".
