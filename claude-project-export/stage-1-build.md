# Stage 1 build (September 2026)

**Status:** committed to the Mac repo on 2026-09-26. All 29 files passed the md5 check, and the Stage 1 block was added to the top of `CLAUDE.md`. Jeff is to push from Terminal.

## Scope

- **Outcomes:** all 16 official MA1 outcomes, checked on the NESA outcomes page. Stage 1 fractions are MA1-GM-03; there is no Stage 1 RQF outcome.
- **Topics:** 20 topics, listed first in the picker. Each topic has an A part and a B part, and the A parts come first:
  - Numbers to 120 A, then Numbers to 1000 B
  - Adding and Taking Away
  - Equal Groups
  - Halves and Quarters (B adds Eighths)
  - Position and Length
  - 2D Shapes and Area
  - 3D Objects and Capacity
  - Mass and Time
  - Data
  - Chance
- **Question types:** 184 in total.

## Design

- **Picture-first.** Questions use:
  - ten-frames, dice and picture collections, including crossed-out pictures for take-away;
  - hundred charts, base-ten blocks and number lines;
  - part–whole bars and informal-unit lengths;
  - balances, clocks and calendars;
  - picture graphs, tallies, spinners and bags.
- **Reading load:** prompts are 25 words or fewer and no word is longer than 13 letters. `tools/stage1.mjs` enforces this.

## Engine additions

The manipulatives engine gains these types:
- `objects`
- `ten-frame`
- `dice`
- `hundred-chart`
- `unit-length`
- `calendar`

## Verified

- stage1, stage2, stage3 and stage5 harnesses, plus verify, stages (5 stages), picker, and every Stage 3 and Stage 4 harness.
- 20 banks × 4 templates rendered with solutions, with no errors.
- End-to-end app run: 52 questions, 0 diagram failures.

## Follow-ups

- Check the A/B split against the official NESA Stage 1 content document.
