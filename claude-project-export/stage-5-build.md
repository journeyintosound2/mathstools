# Stage 5 build (Revision Generator / exam-builder) — status 2026-09-25

**Status:** written to the Mac. All 52 files md5-verified on the device; `tools/stage5.mjs` and `tools/stages.mjs` pass there. CLAUDE.md has a Stage 5 top block. Awaiting Jeff's push.

## What was done
- All 41 Stage 5 outcomes now have a bank, registered in `STAGE5_TOPICS` (app.js) in syllabus order. There are 528 question types in total.
- 29 new banks, plus gap-fill modules for Algebraic Techniques A, Trigonometry A, Volume A and Introduction to Networks.
- Engines:
  - New plane-engine.
  - Geometry: circles and `localLabels`.
  - Solids: measured solids.
  - Statistics: box plots and scatter plots.
  - Probability: tree and Venn diagrams.
  - Algebra: `area-grid`.
  - New `[[sup:]]` token.
- Harness `tools/stage5.mjs`: 31 680 questions, all passed. Also passed: `verify.mjs`, `stages.mjs`, `picker.mjs`, the Stage 3 and Stage 4 harnesses, and all templates with solutions.

## Open items
- Network-engine labels print small.
- A few older Stage 5 generators crash when `allowedTypes` is null. The app always passes an array.
