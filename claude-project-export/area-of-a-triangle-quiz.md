# Area of a Triangle — Student Quiz (rebuilt 2026-11-01)

`online-quizzes/stage-4/measurement-space/area-of-a-triangle.html` (the URL is unchanged). It is built on the same pattern as the Area Model quizzes. The page itself is a thin shell; the engine is in `area-of-a-triangle-quiz/quiz.js` and `quiz.css`.

## Design
- Each card on the left is **one question and one answer box** — nothing else. A single quiet line sits under Check, and after marking it shows the feedback.
- **Sweet and Mild:** the panel on the right is the teaching tool's model, built from the question's own triangle. Students step through it with the panel's own **◀ / Show me ▸** buttons. It is never required and never marked.
  - When the height is inside the triangle or is one of its sides, the model tells the Rectangle story: cut along the height, then each copy slides and turns to complete the rectangle.
  - When the triangle is obtuse, it tells the Two copies story: the copy slides and turns into a parallelogram, which is chopped at the edge of the base and slid into a rectangle.
  - A wrong first answer jumps the model to its last step.
- **Medium and Spicy:** a plain diagram with no unit squares. A sloping side with a whole-number length is often labelled as well, as a distractor, so students have to choose the perpendicular height.
- Measurements are in cm and areas in cm². Answers can be typed as `22.5`, `22½`, `22 1/2` or `45/2`.

## Levels (10 questions each)
- **Sweet:** "The triangle is half of a rectangle — what is the rectangle's area?" (twice), then areas of right-angled and acute triangles. Small numbers.
- **Mild:** obtuse triangles join in, a two-copies rectangle question, and a "forgot to halve" mistake to spot.
- **Medium:** no model. A sloping side is labelled as a distractor, some answers are halves, and there is a "used the sloping side as the height" mistake to spot.
- **Spicy:** bigger numbers. Students work back from the area to a missing base or height (5 questions), and spot a "halved twice" mistake.

## Scoring and data
- Only the first check scores, and Check again lets a student fix it.
- An empty check is free. Pressing Next on an unanswered question counts it as wrong.
- `types[]` holds `tri-rect`, `tri-area`, `tri-area-obtuse`, `tri-missing` and `tri-mistake` as `right/total`, plus `level:x`. Their labels are in quizInsights SKILL_LABELS.
- The old quiz had 15 questions and sent one tag per question.
- toolId, achievementToolName and masteryTopic are unchanged, so old results still group with new ones.

## Also changed in the teaching tool (Jeff's request)
- **Space:** starts the steps again.
- **Enter:** makes a new triangle.
- **→ / ←:** step forwards and back.
