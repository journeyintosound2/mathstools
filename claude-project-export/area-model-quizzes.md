# Area Model — Student Quizzes (rebuilt 2026-10-31, card simplified the same day)

There are two quizzes. They share one engine, and both are linked from the Area Model teaching tool's Tools menu.

| Page | Focus | toolId (unchanged) |
|---|---|---|
| `online-quizzes/stage-4/measurement-space/area-model.html` | Area Model — Multiplication | `area-model-quiz` |
| `online-quizzes/stage-4/measurement-space/perimeter-area-rectangle.html` | Area Model — Area & Perimeter | `perimeter-area-rectangle-quiz` |

The engine lives in `online-quizzes/stage-4/measurement-space/area-model-quiz/quiz.js` and `quiz.css`. Each page only sets `window.AMQ` to focus `area` or `both`.

## Design: one question, one answer
- The question card holds only the question and its answer space. The rest of the card is white space.
  - Example: `17 × 8 = [   ]`, written large in the maths font.
  - Example: "Find the perimeter of the rectangle." followed by `Perimeter = [   ]`.
- Under the Check button there is one quiet line: "→ Split the area model if it helps". The arrow points down (↓) on phones.
  - After marking, that same line becomes the feedback: ✓ Right first time, or "Not quite." with a short worked line.
- There is no prompt bar, no step headers, and no note under the board.
- The area model is a helper, not a task. Students may split it:
  - click a ruler to split;
  - drag a split to move it;
  - drag a split off the end to remove it.
- Students can also jot each piece's product in the dashed boxes inside the pieces. The board is never required and never marked.
- A wrong answer on a whole (unsplit) rectangle splits the model by place value. Every piece then shows its product, which shows the working.
- The Area & Perimeter page has an Area / Perimeter switch at the top of the board. In the perimeter view every edge is labelled. The switch is hidden on missing-number questions, because the perimeter view would show the missing side.
- The "Clear the splits" button is an icon (↺).
- The board fits the screen in JavaScript, so a laptop never needs to scroll.

## Levels (10 questions, one answer each)
**Multiplication**
- **Sweet:** the model is already split by place value.
- **Mild:** the model starts whole. Includes one "what did Mia leave out?" question.
- **Medium:** 3-digit numbers, and missing numbers (the products are given).
- **Spicy:** 3-digit × 2-digit, cut-out shapes and "which is NOT equal?".

**Area & Perimeter**
- Find the area.
- Find the perimeter, with the model split three ways:
  - tens and ones;
  - whole (double the half);
  - make a ten.
- Area and perimeter of the same rectangle, as two boxes.
- Cut-out shapes: three question types.
  - Find the area.
  - Find the perimeter.
  - Is the perimeter the same, longer or shorter?
- Missing numbers.
- Spot the mistake.
- Which is NOT equal?

## Scoring and data
- Only the first check scores. "Check again" lets a student fix an answer without changing the score.
- An empty check is free.
- Pressing Next on an unanswered question counts it as wrong (Skipped).
- `types[]` holds `area / backwards / composite / perimeter / reasoning` as `key:right/total`, plus `level:x`. An area-and-perimeter question counts towards both area and perimeter.
- Typed answers and jottings are never sent.
- Both quizzes score out of 10. The old Area & Perimeter quiz scored out of 30.

## Wiring
- Homepage: 2 quiz cards, and the quiz section count is 30.
- Resources by Stage quiz rows: MA3-2DS-02, MA3-MR-01, MA4-ARE-C-01 and MA4-LEN-C-01.
- The registry entries are updated.
- The `quizInsights` → `analytics.js` → teacher page version chain was bumped.
