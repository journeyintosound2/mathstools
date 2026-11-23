# Stage 2 build (September 2026)

**Status:** committed to the Mac repo on 2026-09-25. All 33 files passed an md5 check on the Mac, and the Stage 2 block was added to the top of `CLAUDE.md`. Jeff is to push from Terminal.

## Scope
- 20 topics, visual-first, with a low reading load. They are in teaching order, Part A of every focus area first:
  1. Place Value A
  2. Addition and Subtraction A
  3. Multiplication and Division A
  4. Fractions A
  5. Position, Length and Angles A
  6. 2D Shapes and Area A
  7. 3D Objects A
  8. Mass and Time A
  9. Data A
  10. Chance A
- Part B follows in the same order.
- 232 question types in total.
- Outcomes covered: MA2-RN-01/02, AR-01/02, MR-01/02, PF-01, GM-01/02/03, 2DS-01/02/03, 3DS-01/02, NSM-01/02, DATA-01/02, CHAN-01.

## Key pieces
- `question-banks/stage-2/*` and `_shared/stage2-helpers.js`.
- The new manipulatives engine draws:
  - base-ten blocks, place-value charts, number lines, arrays, groups;
  - fraction walls and shapes, angle cards, compass, tally charts;
  - balance, column-sum (written method), ruler.
- Engine extensions:
  - grid: north arrow, route path, countable squares;
  - measure: clock halo, scale labelSize;
  - probability: word-only chance line.
- Harness: `tools/stage2.mjs`, 80 questions per type. It re-derives answers from the diagram configs.

## Verified
- The stage2 harness, verify, stages (4 stages), picker, and all Stage 3/4/5 harnesses pass.
- Preview renders in all 4 templates with solutions (20 banks × 4) with no errors.
- The end-to-end app run generated 51 questions with 0 diagram failures.

## Follow-ups
- Check the A/B split against the official NESA Stage 2 content document.
