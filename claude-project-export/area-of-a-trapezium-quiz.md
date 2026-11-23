# Area of a Trapezium — Student Quiz (2026-11-16)

`online-quizzes/stage-4/measurement-space/area-of-a-trapezium.html` (thin shell) + `area-of-a-trapezium-quiz/quiz.js` + `quiz.css`. Built on the Area of a Triangle quiz pattern. Registry `area-of-a-trapezium-quiz`, saves `tool: "area-of-a-trapezium-student-quiz"`, masteryTopic `area-of-a-trapezium`, Stage 4 measurement-space. Listed under MA4-ARE-C-01 (`trapeziums-rhombuses-kites`), homepage quiz mini card, the teaching tool's Tools menu.

## How a question works
- ONE question, ONE answer box. Only the first check scores; an empty check is free; Next on an unanswered question counts as wrong. Confetti on a first-time right answer.
- **Sweet and Mild:** the side panel is the teaching tool's own model built from the question's trapezium. A switch in its head chooses one of three ways:
  - **Average base**: cut at the middles → swing the corners → how long is it?
  - **Two copies**: copy, slide, turn → base b + a → chop and slide.
  - **Halve the height** (added later on 2026-11-16): cut it halfway up → turn the top half → base b + a → chop and slide.
- The model is stepped with ◀ / Show me, is never marked, and never shows the answer (an "average" question keeps "?" in the pill). A wrong first answer jumps the model to its last step.
- **Medium and Spicy:** a clean diagram only.

## Levels (10 questions each)
| Level | Numbers | What's in it |
|---|---|---|
| Sweet | base ≤ 10, height 3–6, average of the parallel sides a whole number | model; mostly isosceles and right-angled; one "how long is the rectangle?", one two-copies question, one halve-the-height question |
| Mild | to 12, whole areas | model; leaning trapeziums; a "forgot to halve" spot-the-mistake; one halve-the-height question |
| Medium | to 14, some halves (22.5) | no model; sloping-side distractors; turned trapeziums (parallel sides up the page); "used the sloping side" mistake |
| Spicy | to 20 | missing height or a parallel side (whole answers), "multiplied the parallel sides" mistake, distractors, turned |

The halve-the-height question (`qMid`) reads: "Cut the trapezium across halfway up and turn the top half round. It makes a parallelogram. What is the area of the parallelogram?" The answer is the trapezium's own area. It always uses an even height, so half the height is a whole number.

## Saved (no typed answers)
types[]: `trap-avg`, `trap-para`, `trap-mid`, `trap-area`, `trap-missing`, `trap-mistake` as right/total, plus `level:x`. Labels are in `quizInsights.js` SKILL_LABELS ("Halve the height" for trap-mid), so "where marks were lost" works.

## Shared code
`mkTrap` (shape maker) and `trapSVG` (diagram) are pasted into quiz.js AND the worksheet generator — change one, re-copy.
- Rules: no slivers (a ≥ b/4, sensible height), no answer equal to a length on the drawing, and never a half area on an isosceles trapezium (impossible on whole numbers: a + b is always even).
- `o.hEven` asks for an even height.
- `trapSVG` has `show:"avg" | "para" | "mid"`.

Test surface `window.__ZQ__`. Verified:
- 1,000 papers, with no fallback shapes.
- 1,190 play checks across every level at 1366 and 390 wide. These step all three stories, check for the answer on screen, and check that nothing leaves the panel.
