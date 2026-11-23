# Fraction of an Amount — Student Quiz (built 2026-11-04)

Page: `online-quizzes/stage-3/number/fraction-of-amount-division.html`
Engine: `fraction-of-amount-division-quiz/quiz.js` + `quiz.css` (CSS copied from the Area of a Parallelogram quiz; bump BOTH `?v=` in the page when either changes).
Partner of the teaching tool and worksheet creator `…/fraction-of-amount-division` (both link to it).

## Design
- Each card is **one question and one answer box** (Area-quiz pattern). Calculation questions show the expression large with the box after the equals sign.
- The panel on the right is the teaching tool's **bar**, built from the question's own numbers, stepped with ◀ / Show me ▸: the whole → cut into b equal parts (each named 1/b) → shade a of them (bracket "a parts").
- The model is never required, never marked, and **never shows a value**.
- Once cut, each part has a typing box: **type in one part and every part fills**, because the parts are equal. Not marked, not saved.
- **Ones** button (amounts ≤ 60): faint unit lines so one part can be counted. On by default at Sweet.
- "Which is the same?" questions show **only the whole** — cutting the bar would hand over the matching option. Their options are plain ink so colour can't give it away.
- "Back to the whole" shows the bar cut and shaded, the given amount bracketed under the shaded parts and "?" on the whole.
- A wrong first answer jumps the model to its last step; the feedback gives the working in the question's own form (e.g. "Brackets first: 30 ÷ 5 = 6. Then 3 × 6 = 18.").
- Colours match the tool: amount blue, number of parts purple, parts taken orange.

## Levels, 10 questions each
- **Sweet:** unit fractions only — halves, quarters, fifths, tenths; one part 2–6 (amount ≤ 60); 1/b of n (6) and n ÷ b (3); one "which is the same?". Ones on.
- **Mild:** unit fractions, + thirds, sixths, eighths; one part to 12; 1/b of n, n ÷ b and n/b (fraction as division); one "which is the same as n/b?"; one back to the whole.
- **Medium:** more than one part, all five forms — a/b of n, a × 1/b of n, a × (n ÷ b), (n ÷ b) × a, n/b × a; two "which is the same?" (both directions); one word problem.
- **Spicy:** any fraction to twelfths, one part 6–25 (amount ≤ 300), mixed forms, two back to the whole, two word problems, one "which is the same?".

Distractors for "which is the same?" carry their values, so none can coincide with the answer (½ of 4 = 2 = 4 − 2 was caught in testing).

## Scoring and data
- Only the first check scores; Check again lets a student fix it; an empty check is free; Next on an unanswered question counts it wrong.
- `types[]`: `fa-unit`, `fa-nonunit`, `fa-same`, `fa-whole`, `fa-word` as right/total, plus `level:x`. Labels in quizInsights SKILL_LABELS.
- Registry: toolId `fraction-of-amount-division-quiz`, achievementToolName `fraction-of-amount-division-student-quiz`, masteryTopic `fraction-of-amount-division`, topics `number`, Stage 3. No typed answers saved.

## Wiring
- Student quiz rows in Resources by Stage beside the tool and worksheet: MA3-RQF-02, MA3-RQF-01, MA3-MR-02, MA4-FRC-C-01.
- Homepage Online Quizzes card.
- Version chain bumped: mmtToolRegistry (teacher, student, resultUtils) → resultUtils (teacher); quizInsights → analytics.js → teacher; toolLinks (resources page, teacher).

## Verified (Playwright)
480 generated papers checked (fraction sets, ranges, unit/non-unit per level, simplest form, every printed expression re-evaluated, every MC option evaluated so only the right one equals the answer, no repeats in a paper); every level played to 10/10 with the answer never on screen early and the model never showing a value; first-attempt-only scoring, skip = wrong, wrong answer jumps the model; mirrored typing boxes; ones toggle; payload keys (no typed answers); no page scroll at 1366×768, 1280×800, 1024×768, 1920×1080; no sideways scroll at 390.
