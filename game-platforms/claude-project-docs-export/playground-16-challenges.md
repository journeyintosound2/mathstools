# Retrieval Practice Playground — 16 Challenges + Boss Exam

**Status (2026-11-10): ALL 16 BANKS BUILT, boss exam complete.** Framework
landed in Installment 1; Installment 2 (same day) added the other 14 banks,
ported the website's diagram/grid layer, and fixed the medal scaling for the
60-question exam.

Jeff's design:
> "16 challengers across the playground, matching the 16 C-level outcomes on the NESA Stage 4 syllabus… 20 questions each, bronze = 10 correct, silver = 15, gold = 19. Mrs. Kellahan is a 60-question mixed exam (4 per topic, except 2 for each data outcome). The question card should take up considerable space and the world behind it should be darkened to reduce cognitive load. Group the characters by strand on the map."

Also: square roots must have the bar over the WHOLE expression (Jeff,
2026-11-10) — see "Typesetting" below.

## 16 outcomes + strand grouping

### Number & Algebra (7 NPCs — East)
| NPC | Outcome | Bank id | Source |
|---|---|---|---|
| Mr. Pearce (canteen) | MA4-INT-C-01 | `integers` | **written for the game** |
| Ms. Brookes (quad-fig-E) | MA4-FRC-C-01 | `fdp` | **written for the game** |
| Mr. Noor (quad-fig-C) | MA4-ALG-C-01 | `algebraic-techniques` | **written for the game** |
| Ms. Lin (quad-fig-W) | MA4-EQU-C-01 | `equations` | **written for the game** |
| Mr. Morgan (office) | MA4-RAT-C-01 | `ratios-rates` | ported from website |
| Mr. Sahni (plaza) | MA4-IND-C-01 | `indices` | ported |
| Ms. Okafor (COLA) | MA4-LIN-C-01 | `linear-relationships` | ported |

### Measurement & Space (6 NPCs — West)
| NPC | Outcome | Bank id | Source |
|---|---|---|---|
| Mr. Green (foodtech) | MA4-LEN-C-01 | `length` | ported |
| Mr. Heywood (glass stairs) | MA4-ANG-C-01 | `angle-relationships` | **written for the game** |
| Mr. Dawson (sky pier) | MA4-PYT-C-01 | `pythagoras` | ported |
| Ms. Patel (Maths M1) | MA4-ARE-C-01 | `area` | ported |
| Mr. Vo (Maths M4) | MA4-VOL-C-01 | `volume` | ported |
| Mr. Ewings (science lookout) | MA4-GEO-C-01 | `geometrical-figures` | ported (+1 guard, below) |

### Statistics & Probability (3 NPCs — South)
| NPC | Outcome | Bank id | Source |
|---|---|---|---|
| Ms. Mahoney (top balcony) | MA4-DAT-C-01 | `data-visualisation` | ported |
| Mr. Ndlovu (A-block courtyard) | MA4-DAT-C-02 | `data-analysis` | ported |
| Mr. Bacon (mural lane) | MA4-PRO-C-01 | `probability` | ported |

### Boss — Hall
**Mrs. Kellahan** = 60-question mixed exam, needs all 16 keys. `BOSS_EXAM.mix`:
4 from each of 14 outcomes + 2 from each Data outcome = 60, shuffled; the
card head shows each question's topic. Medals scale: bronze 30/60, silver
45/60, gold 57/60. Passing marks `warmup-kellahan`.

## The five banks written for the game

The website's Integers / FDP / Algebraic Techniques / Equations / Angle
Relationships quizzes are older bespoke pages (inline generators, i18n,
drag-to-order, shading) that cannot be ported mechanically, so these five
were written fresh in the shared-bank format, covering each site quiz's type
list at C level (6–9 Basic + 7–9 Expected types each):

- **Integers** — compare (MC < >), order (typed list), number line (read a
  dot / two jumps), + − × ÷, temperature (thermometer), order of operations,
  powers of negatives ((−3)² vs −3²), multi-step, missing number, contexts
  (bank, diver, lift, quiz score, temperature difference), mean, rules T/F.
- **FDP** — shaded fraction (bar/circle), simplify + equivalent, convert
  F↔D↔%, largest/smallest, add/subtract, % of quantity, decimal ops,
  rounding; mixed numbers, × ÷ fractions, × ÷ decimals, recurring dot
  notation + terminating/recurring, one quantity as % / fraction of another
  (unit conversion), % increase/decrease and % change, discount / GST /
  GST component / profit-loss %, ordering mixed FDP lists.
- **Algebraic Techniques** — coefficient/constant, notation, words →
  expressions, substitution, like terms, × and ÷ terms, expand (area-model
  diagram); two-pronumeral substitution, x² and x terms, expand & simplify,
  expand with negatives / x(x + c), factorise fully, algebraic fractions,
  pattern tables, perimeter expressions (figure), worded expressions.
- **Equations** — one-step (+−, ×÷), two-step, check a solution (T/F),
  which equation matches a story, balance scale; x/a + b = c, (x + a)/b = c,
  brackets, both sides, collect first, form-and-solve (consecutive numbers,
  rectangle, ages, taxi, bar model), x² = c and ax² = c (both roots),
  harder checks. Every solution is a whole number.
- **Angle Relationships** — classify by size, read a protractor, complement /
  supplement / reflex, straight line, right angle, at a point, vertically
  opposite; corresponding / alternate / co-interior (three types), name the
  relationship, angle equations (2x, x + 20, x and 2x at a point, parallel
  with an expression), parallel-lines test (T/F), protractor reflex /
  supplement, complete-the-rule MC.

## Answer checking

`questionCore.js` (the website's core) + `exprCheck.js`, which registers two
new modes on the same CHECK table:
- **`expr`** — algebraic expressions. Parses to a canonical polynomial, so ANY
  equivalent answer is right (`3b + 8a` = `8a + 3b`). `q.form`:
  `simplified` / `expanded` / `factorised` — right value in the wrong form is
  a **nudge** (attempt not used): "now expand", "collect like terms",
  "take out the HIGHEST common factor".
- **`nums`** — a set or ordered list of numbers (ordering integers; ±7 for
  x² = 49; "x = 7 or x = −7" works).
Integer questions carry `signed:true` → text keyboard + a − key.

## Display layer (game side)

- `diagrams/engines.js` now has the website's `grid()` (clickable Cartesian
  plane) and its full `drawDiagram` (`{html}`, `{grid}`, engine diagrams
  trimmed to ink and drawn at natural size × `scale`). 18 engines: the 14
  from before + `angle-engine`, `integer-engine`, `fdp-engine`,
  `algebra-engine`, `equation-engine` (copied from the Revision Generator).
  **One game-only addition:** `integer-engine` honours
  `hideAnswerLabel` so a "what number is marked?" dot doesn't print its value.
- Veil: answer affixes (`pre` $ / `unit`), symbol keys (`q.keys` or per mode),
  π / power previews, MC letter chips with right/wrong colouring, feedback =
  "Answer: …" + the bank's "why"; card has a steady min-height.
- `dealRound` climbs Basic → Expected in type order, never the same type twice
  in a row, re-rolls repeated questions.
- **Typesetting:** `mathHtml.js` `radicals()` turns `√(…)` and `√169` into a
  drawn radical whose bar spans the whole radicand (prompt, why, options).

## Fixes worth porting back to the website
- `geometrical-figures` `b-quad-sum`: ~1 in 1000 drawings had a labelled angle
  1.6° off (rounding in fitPoints). The game copy redraws when any labelled
  angle is >1° out.
- The Revision Generator's `angles` bank "right-angle" type: the engine labels
  x on the knownAngle arc, so the answer is knownAngle, not 90 − knownAngle.
  Worth checking on the website.

## Verified (2026-11-10)
- Node harness: every type of all 16 banks × 1500 = **354,000 questions, 0
  problems** (own answer accepted by its checker, no NaN/undefined, MC options
  distinct, figure angles re-measured, rounds never repeat a type).
- Playwright through the real veil: all 16 challenges played to 20/20 via the
  UI (typing, MC, T/F, plotting), no console errors, no sideways overflow.
- Boss: locked at 15 keys, opens at 16 with exactly 4/4/…/2/2, 40/60 = bronze,
  marks `warmup-kellahan`; a bronze on a challenge marks `warmup-<npcId>`.

## Still open
- JSON-aware cloud sync for `mma-playground-<id>-best` (medal tier is
  device-local; KEYS already sync via `completedMissions`).
- In-game Playwright run walking to each NPC (tested via a preview page that
  mounts the veil directly).
- Arabic/Farsi.
