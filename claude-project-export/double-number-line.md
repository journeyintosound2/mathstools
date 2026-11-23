# One-Step Equations – Double Number Line (rebuilt 2026-11-17)

Three parts, all on the newer patterns:
- **Teaching tool** `interactive-tools/stage-4/algebra/double-numberline/index.html` — Number Groups shell, full screen.
- **Student quizzes** — one engine (`online-quizzes/stage-4/algebra/double-numberline/dnl-quiz/quiz.js` + `quiz.css`) behind the three existing pages: `student-quiz.html` (mixed), `student-quiz-add-subtract.html`, `student-quiz-mult-div.html`. Same URLs, registry entries and saved tool names, so tasks and results carry on.
- **Worksheet creator** `worksheet-creators/stage-4/algebra/double-numberline.html` — Number Groups generator frame.

## What it is teaching
A double number line pairs every point: an expression in x on top, its value underneath. The equation tells us ONE pair (x − 5 ↔ 7). x is found by making the move that gets from that pair back to x — and the same move has to be made on both lines. Orange = what was done to x (the build move), purple = the move that undoes it. The inverse operation is something students *see*, not a rule.

## Teaching tool: two ways in (Settings › How it starts)
**Explore (default, Equation first OFF)** — build the expression from x:
1. **Start with x** (× ÷: 0 is marked too, because multiplying is measured from 0).
2. **Build it** — orange: unit jumps for ± (x + 1, x + 2 …), equal groups for × (x, 2x, 3x), equal parts for ÷ (x/4, 2x/4 …).
3. **Show what it equals** — value under the expression; "?" under x.
4. **Turn it around** (× ÷ with a negative) — value first in red on the wrong side of 0, then a 3D half-turn.
5. **Think first** (Settings, off).
6. **Undo it** — purple on BOTH lines; bottom line fills in; the answer sits in a GREEN box (was yellow); panel writes the working.
7. **Check** (Settings, on) — 7 + 5 = 12 ✓.

**Equation first (ON, key E)** — works like the Multi-Step tool (added 2026-11-17, evening):
- The whole equation is one point (left side on top, right side underneath) → the same move on both lines → the line resets on the answer → check.
- Above the line: the first equation in a white card and ONE green card for the current line of working, which scrolls up on Next and down on Back (tucks under the first equation at the start and the check, when that card turns green).
- Optional **working panel** (button between ↺ and the side-panel button, key V; only in this mode): the whole working with = under =, a green box on the line the number line shows; it replaces the side panel, never both. Turning Equation first off closes it and brings the side panel back.
- The scenes and drawing are the Multi-Step tool's own (ported), so the two tools look and move the same.

**Equation type** button + menu (replaces the old mode switch on the board): Add or subtract · Multiply · Divide · Mixed (keys T, 1–4), as in the Multi-Step tool.

Keys: → / ← step · Space start again · Enter new · T / 1–4 equation type · E equation first · V working panel · N negatives · F full screen. Type your own: x + k, k + x, x − k, ax, x/d, either side, any letter.

## Student quiz (10 questions, one question one answer)
| Level | Numbers | Question types | Model |
|---|---|---|---|
| Sweet | small whole numbers (k 2–9, ×/÷ 2–5) | read the line forward (x is over 7: what goes under x + 5?), what undoes it? (MC), solve | yes — Show me plays the move on both lines AND counts along the bottom line |
| Mild | bigger whole numbers | solve, 5 + x and 12 = x + 5, other letters, check by substituting (MC), spot the mistake (move made the wrong way) | yes — draws the move, student applies it |
| Medium | negatives | solve, write the equation from words (MC), word problem, sign mistake | none |
| Spicy | bigger negatives, ×/÷ to 12, sides swapped | solve, 2 word problems (below zero only where it makes sense), check, sign mistake | none |

Model rules: opens on "What it equals" (Back shows the build); the answer stays "?" until the question is settled; on "What undoes it?" the move pills read "?" until settled; a wrong first answer runs the model to its end. Marking: first check scores, empty/unreadable checks are free, Next on an unanswered question counts wrong. Saved skills (object shape): dnl-add/sub/mul/div, pair, undo, check, mistake, write, word, negatives + level + scope.

## Worksheet creator
Scope (+− / ×÷ / both) · level tick-chips (ladder) · fraction or ÷ · vary the form · other letters · colour or B&W · spacing · D/E scaffold ("Undo: ___ on both sides" or answer only) · worked example · name/date · answer key.
Sections, picture fading: **A** Read the line · **B** Undo it on the line · **C** Draw the line · **D** Solve · **E** Solve and check · **F** Write the equation · **G** Use it · **H** Spot the mistake · **I** Make your own · **J** Fluency (off).

## Possible next
- Update the lesson plan's P section to mention the undo move on both lines, the check step and Equation first.
- Arabic / Farsi layer for the quiz.
- An optional "balance" view alongside the line, for classes moving to two-step equations.
