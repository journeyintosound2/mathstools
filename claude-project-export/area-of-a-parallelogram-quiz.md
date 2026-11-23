# Area of a Parallelogram & Rhombus — Student Quiz (new, 2026-11-01)

The page is `online-quizzes/stage-4/measurement-space/area-of-a-parallelogram.html`, and its engine is `area-of-a-parallelogram-quiz/quiz.js` + `quiz.css`. It follows the same pattern as the Area of a Triangle quiz.

## Design
- Each card is **one question and one answer box**, and answers are in cm or cm². Students can type halves as `6.5`, `6½` or `13/2`.
- On every level, the panel on the right is the teaching tool's model, built from the question's own shape. Students step through it with **◀ / Show me ▸**:
  - **Rectangle or square:** one row of squares darkens, then the rows.
  - **Parallelogram or rhombus:** cut along the height, then slide the piece into a rectangle. When the shape leans further than its base, it is cut into strips.
  - **Rhombus by its diagonals:** cut along both diagonals, then slide the two bottom pieces up.
- The model is never required and never marked, and it **never shows the answer**: no area bubble, and no running totals up the side of a rectangle.
- A wrong first answer jumps the model to its last step. The feedback line gives the working, e.g. "Base × height: 9 × 6 = 54 cm². The 10 cm side slopes — it isn't the height."
- A parallelogram's sloping side is labelled whenever it is a whole number, so students have to choose the height. Rhombuses get equal-side marks.

## Levels (Jeff's spec), 10 questions each
- **Sweet:** squares, rectangles, parallelograms and rhombuses (no diagonals), with whole numbers within the 12 × 12 tables, on unit squares.
- **Mild:** as Sweet, plus rhombuses (and a square) given by their diagonals.
- **Medium:** as Mild, but 5 of the 10 questions give the area and ask for the base or height (the length or width for a rectangle). The grid is off on those, so the answer can't be counted.
- **Spicy:**
  - No unit squares.
  - Lengths in halves (6.5) on the area questions only.
  - 2 questions ask for a diagonal, given the area and the other diagonal.

## Scoring and data
- Only the first check scores, and Check again lets a student fix it.
- An empty check is free. Pressing Next on an unanswered question counts it as wrong.
- `types[]` holds `pa-rect`, `pa-para`, `pa-diag`, `pa-missing` and `pa-diag-missing` as `right/total`, plus `level:x`. Their labels are in quizInsights SKILL_LABELS.
- Registry: toolId `area-of-a-parallelogram-quiz`, achievementToolName `area-of-a-parallelogram-student-quiz`, masteryTopic `area-of-a-parallelogram`.

## Wiring
- Homepage quiz card added, and the quiz section count is now 31.
- Resources by Stage rows added under MA4-ARE-C-01, MA3-2DS-03 and MA3-2DS-02.
- The teaching tool's Tools menu links to the quiz.
- The version chain was bumped: toolLinks, and quizInsights → analytics → teacher page.
