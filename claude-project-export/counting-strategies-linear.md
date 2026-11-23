# Counting Strategies for Linear Relationships (built 2026-10-21)

Stage 4, MA4-LIN-C-01 — from counting, to linear relationships, to graphing straight lines in all four quadrants.
- Teaching tool: `interactive-tools/stage-4/algebra/counting-strategies-linear/index.html`
- Worded problems (shared by tool and worksheet): `interactive-tools/stage-4/algebra/counting-strategies-linear/contexts.js`
- Worksheet creator: `worksheet-creators/stage-4/algebra/counting-strategies-linear.html` (linked from the tool's Tools menu)
- Student quizzes: `online-quizzes/stage-4/algebra/counting-strategies-first-quadrant.html` and `…-all-quadrants.html` (see below)
The tool and worksheet use no Firebase; the quizzes save results through the shared student login.

## Teaching tool — lesson flow
1. **The problem alone** — a counting instruction ("Start at 5, count up by 3s"), a worded problem ("Jimmy started with $25 but spent $2 every hour on lollies") or an equation (y = 25 − 2x). Three-way toggle at the top of the opening screen (W cycles). Students write the sequence on their boards.
   - **All three views show the SAME example (2026-11-11).** Every example is made as a story first, so its numbers make sense in a context, then shown as the count and as the equation — the teacher can flick between them to show "start at 5, count up by 3s" = the story = y = 5 + 3x. Switching view keeps the numbers and anything typed in the table.
   - **Whole numbers only:** the start (b) and the step (m) are always integers, so Spicy no longer uses 0.5 steps. Negative starts come from the temperature stories (Medium and Spicy), giving equations like y = −4 − 3x.
   - Counting and equation views: New numbers (R), Type your own (E). In the equation view Type your own is one box (y = 5 + 3x, 3x + 5, y = −2x + 25 …). Typed numbers are given a story that fits them (same direction; below zero only for a temperature story).
   - Worded view: New story (R), Choose a story (list of 33, grouped going up / going down), Change the numbers (E; the story keeps its direction).
2. **Next** — the sentence, story or equation morphs (FLIP, same element) up into a heading above the graphing card. A story's width is set in em so it wraps at the same words in both places.
3. **Table of values** — x prefilled 0..7 (editable), y blank. In worded mode the table headers and axis titles name x and y (e.g. "hours", "money left ($)"). The teacher types the class's sequence, mistakes and all; points appear as values are typed.
4. **Equation** — type y = 25 − 2x (or −2x + 25, etc.). Up to four equations in different colours so a misconception can sit beside the correct rule.

### Auto-scale (teacher decision 2026-10-21)
On by default. The axes are set from the problem's **first ten terms** (x = 0 to 9) before anything is typed, so entering the first ten values never moves the graph. From the **11th** value on — or a slip outside the frame, like 170 for 17 — the axes stretch with every entry. Each axis scaled on its own. Off: equal scale. Panning or zooming switches auto-scale off.

### Four quadrants (teacher request 2026-10-27)
Settings › The plane › **Four quadrants** (remembered). A small **+ Add a row** appears above the table and adds x = −1, then −2, … (↑ on the top row does the same) — counting back from the start. Auto-scale then frames the line from **x = −5 to 10**, always with both axes on screen, so typing values in that range never moves the graph; a point outside it still grows it.

### Other controls
Numbers (Sweet/Mild/Medium/Spicy), Count (up/down/either — also filters the stories), **Equation form** (y = b + mx, the default, or y = mx + b), starting rows (5/6/8/10). Reveals, all off by default: jumps between table rows (an odd jump turns red), rise/run steps on the graph, (x, y) labels, "Goes through n of m points". Fill the table from the rule (demo only), Clear, Reset, full screen (F).

Colour language: start number blue = the points; step orange = jumps and steps (in stories and equations too).

## The worded problems (contexts.js)
33 stories — 18 going up (savings, phone plan, taxi, gym, car hire, fun run, gift card, seedling, bucket, train, snowfall, stamps, reading, queue, block tower, followers, plane, warming up) and 15 going down (lolly money, loan, bus card, candle, leaking tank, petrol, hike, paint, phone battery, pizza, tickets, biscuits, pages to go, hot-air balloon, cooling down).
Each story has a number "kind" (money, count, measure, temperature, big, percent) with ranges per level; money prints as $2.50; a battery never starts above 100%; only temperatures go below zero, and only from Medium; a few stories borrow easier numbers where big ones stop being believable. Add a story to contexts.js and it appears in both the tool and the worksheet. (The teaching tool now asks only for whole numbers from these tiers; the worksheet and quizzes still use them as before.)

## Worksheet creator
**Levels (teacher request 2026-10-23):** four tick-chips — Sweet, Mild, Medium, Spicy — instead of a drop-down with a "Mixed" option. Tick one and every question is that level; tick several (any combination, e.g. Sweet + Mild) and each section climbs through just those, easiest first. The last chip can't be unticked. Quick links: All four / Sweet + Mild / Mild + Medium / Medium + Spicy. Default: all four.

**Questions are:** counting instructions / worded problems / a mix (default: mix).

**Four quadrants (2026-10-27, Options):** counting questions run into negative x (counting back from the start) — A and E use x = −2 to 3, B x = −3 to 3 on a −4 to 4 grid, C tables and D x = −2 to 2. Every graph keeps both axes on the paper. Worded problems stay at x ≥ 0 (there is no "−2 hours"). The origin's 0 is printed just above the x-axis so "−1 0" never reads as −10.

Sections, each with its own number of questions, climbing through the chosen levels:
- **A Count it out** — six empty boxes (worded: "Let x = hours and y = money left ($). Write y for x = 0 to 5."; four quadrants: "Count back as well as on", each box labelled with its x).
- **B Table and graph** — a table, a numbered grid, "What do you notice? Where can you see the $25 and the $2?"
- **C Write the equation** — from the words/story, or from a table (then also the counting instruction).
- **D Work backwards** — from an equation (worded: "Write a story this equation could tell"; key gives an example) or from a graph of dots. Dots always sit on grid crossings.
- **E Spot the mistake** — someone else's table or equation: one slip; a slip carried on; started one step late; start and change swapped (test at x = 2). A slip never lands on the start (x = 0).
- **F Go further** — the equation, y at x = 20 and 50, which x gives a far term.
- **G Graph the line (2026-10-27)** — fluency for Stage 4 graphing straight lines: just an equation (y = ±mx ± b or y = ±b ± mx, following "Write equations as"), a table of values and a scaled grid to plot and rule. x = −3 to 3 with Four quadrants, otherwise 0 to 5 (and every y stays ≥ 0). Sweet: positive gradients 1–3, positive intercepts; Mild: gradients 1–4, intercepts either sign; Medium: gradients either sign; Spicy adds gradients 0.5 and 1.5. Off by default.
- "Argue about it" (y = 5 + 3x vs y = 3x + 5) fills the last page — on by default.

Quick sets for the sections: The lesson (A–F) / Just graphing lines (G) / The lesson, then G.

Options: equation order (start first / count first / mix), four quadrants, number the axes (off = students choose the scale), name and date, answer key (explains each mistake; draws every point and line).
Sweet and Mild never print a negative number in the first quadrant.

## Student quizzes (built 2026-10-27)
Two quizzes, linked from the tool's Tools menu, the homepage (Online Quizzes) and Tool Links under MA4-LIN-C-01. Both save to the student dashboard through the usual student-code login (Skip = guest, no save). They don't store any typed answers.
- **First Quadrant Student Quiz** — `online-quizzes/stage-4/algebra/counting-strategies-first-quadrant.html`. No negative x or y anywhere.
- **All Quadrants Student Quiz** — `online-quizzes/stage-4/algebra/counting-strategies-all-quadrants.html`. Tables run x = −3 to 3 (count back for negative x) and graphs centre the origin. The stories stay in the first quadrant.
- One shared engine: `online-quizzes/stage-4/algebra/counting-strategies-quiz/quiz.js` + `quiz.css`. It holds a verbatim copy of the tool's engine and uses the tool's contexts.js stories.

**The levels step up in how the idea is used, not in the size of the numbers** (10 questions each):
- **Sweet — skip-counting language.** Write the numbers from "Start at 11, count up by 2s"; fill a table while the graph plots each value as it's typed, then write the equation in a y = [ ] ± [ ]x frame — once it's marked the line is drawn through the dots, like typing the equation into the teaching tool (a wrong equation's line shows in red beside it); write the equation on its own; read the counting back off an equation. **Sweet always starts at x = 0 and stays in the first quadrant, on both pages** (teacher request 2026-10-28). On the All Quadrants page Sweet's table graphs still show the whole four-quadrant plane, so once the equation is marked students see the line carry on into the other quadrants.
- **Mild — the same ideas in algebra language.** A table from an equation (still plotting live); "When x = 0, y = __; each time x increases by 1, y increases/decreases by __"; write the equation from a description, a table and a graph; "Which equation matches this table?" (wrong options: numbers swapped, wrong direction, one step late).
- **Medium — make the graph yourself.** Complete the table from the rule, then click the grid to plot every point. Points snap to the grid, there is one point per x, and clicking a point again removes it. Also plot from a given table, and write equations from a graph, a description and a table.
- **Spicy — use it.** Write the equation for a story; go further than counting can (y at x = 25, and x = −10 in All Quadrants; which x gives a far value); graph a line from its equation (table, then plot), including a half gradient; story → table → plot; "What does the 28 tell you?" about a story's equation; write the equation of a story graph.

**Languages (2026-10-28):** EN / ع / فا switch in the top bar and the level chooser, remembered between visits. The same convention as the fractions quizzes: the chosen language on top, English beneath; equations, tables, graphs and numerals stay left-to-right with Western digits. All 33 stories are translated (names transliterated; Arabic sentences written so no verb has to agree with the person's name). Results from Arabic or Farsi attempts are tagged lang:ar / lang:fa. The translations are Claude's own — worth a check by an Arabic and a Farsi speaker on staff.

**Updates reaching students:** the quiz pages load their script and styles as `quiz.js?v=…` etc., and the site's offline app now fetches any `?v=` file fresh when online. Before this, the first visit after an update could pair the new page with yesterday's saved script (the language buttons did nothing until a reload).

**Marking:**
- Only the first check of each part counts. A question is right when every part is right first time.
- Corrections, green rings on missed points and the line only appear after marking.
- An empty or incomplete check doesn't use up the attempt. Next on an unfinished question marks it wrong.
- A part that's right locks.
- The certificate breaks the score down into Counting / Tables / Equations / What the numbers mean / Plotting / Using it.

Graphs use square cells and friendly y scales, and every point a student has to read or plot sits on a grid crossing.

## Possible next
The same tick-chip levels could replace the Mixed option in other worksheet creators. The quizzes could add an Extra Spicy level (two lines: where do they meet?).
