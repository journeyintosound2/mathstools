# Whole-topic quizzes — Stage 4 (built 2026-11-02, locked tasks + audit 2026-11-05)

Every Stage 4 outcome has a whole-topic student quiz with **Basic** (D/E foundations) and **Expected** (C — the whole outcome) levels. The five older ones (Integers, FDP, Algebraic Techniques, Equations, Angle Relationships) are their own bespoke, trilingual pages. The eleven newer ones share one engine.

## Where things live
- Engine: `online-quizzes/stage-4/topic-quiz/`: `core.js` (answer checkers, formatting, random helpers; no DOM), `engine.js` (shell, paper, marking, builder, certificate, save), `engine.css`, `banks/<topic>.js` (one per outcome).
- Pages (thin shells): `ratios-rates/ratios-and-rates.html`, `number/indices.html`, `algebra/linear-relationships.html`, `measurement-space/{length, pythagoras, area, volume, properties-of-geometrical-figures}.html`, `statistics-probability/{data-classification-visualisation, data-analysis, probability}.html`.
- Diagrams come from the Revision Generator's engines (`/assessment/exam-builder/engines/…`). Linear Relationships uses the engine's own clickable Cartesian plane.
- Shared task lock for the older five: `portal/shared/taskLock.js`.

## How a page is opened
- Plain URL: student quiz (choose level, then question types, then go; the usual student-code sign-in). The older five open their teacher builder here instead.
- `?builder=1`: teacher "Create student quiz link" builder (what the Teacher Platform drives in a hidden frame).
- `?assignment=1&level=…&types=…&count=…&aid=…`: a teacher-set task, **locked** (see below).

## Assigned tasks are locked (2026-11-05)
Teacher request: students were leaving a task to try levels they weren't ready for.
- **Teacher side:** a whole-topic quiz is always set through its builder ("＋ Set this quiz ›"), so every task has a level and its own link with an assignment id. All types ticked gives "Area — Expected".
- **Inside the quiz:** no Change level, no level menu, no Tools menu, no clickable brand; the certificate offers "Back to my dashboard". In the older five, `taskLock.js` turns their Menu/Reset buttons into "↻ Start this task again" (reloads the same task link) and hides Back.
- **Counting:** a task only counts attempts made from its own link. One rule, `recordFitsTask` in `portal/shared/quizInsights.js`, is used by the student dashboard, Manage Tasks and the results reports. Every whole-topic quiz now always saves `assignmentId` ('' when opened any other way), so an attempt at the open quiz never ticks a task off. Older results without that field count only if they were at the task's level.
- Older plain-link whole-quiz tasks (set before this change) still work and count any attempt.

## Early submit (2026-11-05)
- "Finish & submit" is on all 16. In FDP, Algebraic, Equations and Angle it now sits beside Reset; it was pinned over the corner before.
- **Bug fixed:** the shared save (`quizClient.js`) and the own-save code in Integers, FDP and Angle Relationships dropped the early-submit fields, so a part-finished 3/3 was stored as a finished 100%. They now save completion, attempted, quiz length, coverage, counts-to-mastery and the assignment id.
- Student dashboard: a task whose last attempt was submitted early says "You submitted early (n of m answered)" with a **Finish it** button. Tasks stay open to improve until the due date.
- Certificate on an early submit: 📝, no confetti, no percentage, and a note to try again from the dashboard.

## Design decisions
- One question, one answer. Only the first check scores; a wrong answer shows the answer and a one-line reason.
- A "nudge" never costs the attempt: unreadable input, or right value in the wrong form (unsimplified ratio/fraction, not in index form, not in terms of π, a 1 dp answer given as a whole number, a percentage without %).
- Units and $ typed with an answer are ignored; 3.14 and 22/7 answers are accepted for 1 dp π questions.
- Basic to Expected is "foundations to the full outcome", not just bigger numbers.
- Card layout: steady 1060px column; with no diagram the prompt column is 780px; Check and the symbol keys sit on the same row as the answer box.
- Results save per question type, so "Where marks were lost" works. No typed answers are saved.

## Audit fixes (2026-11-05)
Pictures (shared Revision Generator engines, so printed papers improve too): labels moved off lines in area (vertical arrows, triangle/parallelogram heights beside the dashed height, kite/rhombus diagonals, sector radius, narrow sectors), Pythagoras (isosceles slant sides, ladder drawn in proportion), volume (prism height), geometry (long angle expressions), and graph line labels off their line and away from crossings. Numbers now match the drawings (longer side horizontal, height no bigger than base). Bank fixes: isosceles base ≠ legs, no sliver triangles, realistic gates and coin results, and about a dozen wording slips (1x, −0, repeated "1 part = 7", grammar, vague "the reading").

## Question types
### Ratios and Rates (MA4-RAT-C-01)
- **Basic:** Simplify a ratio · Equivalent ratios · A ratio as a fraction of the whole · Share an amount in a ratio · Write a rate per one unit · Use a rate · Read a distance–time graph
- **Expected:** Simplify ratios with units or decimals · Share in a three-part ratio · Find a quantity from one part of a ratio · Ratio problems from a difference · Scale drawings and maps · Convert rates between units · Best buys · Speed, distance and time · Speed from a distance–time graph · Interpret a distance–time graph

### Indices (MA4-IND-C-01)
- **Basic:** Write in index notation · Evaluate a power · Squares, square roots and cube roots · Prime factors · Index law: multiplying powers · Index law: dividing powers · The zero index
- **Expected:** Prime factorisation in index form · HCF and LCM from prime factors · Estimate a square or cube root · Order of operations with indices and roots · Index law: power of a power · Multiply algebraic terms with indices · Divide algebraic terms with indices · Use several index laws · The zero index with pronumerals · Index laws: true or false?

### Linear Relationships (MA4-LIN-C-01)
- **Basic:** Read the coordinates of a point · Plot a point (click) · Name the quadrant · Complete a table of values · Match a rule to a table · Does a point lie on a line?
- **Expected:** Plot a point on a line · Write the rule from a table · Write the rule from a graph · Solve an equation using a graph · Point of intersection · Linear relationships in context · Linear patterns

### Length (MA4-LEN-C-01)
- **Basic:** Perimeter of quadrilaterals and triangles · Perimeter of a composite figure · Parts of a circle · Radius and diameter · Circumference in terms of π · Convert units of length
- **Expected:** Composite figures with missing sides · Work backwards from a perimeter · Circumference to 1 decimal place · Find the radius or diameter from the circumference · Arc length · Perimeter of semicircles and quadrants · Perimeter of a sector · Circumference problems

### Right-Angled Triangles (Pythagoras) (MA4-PYT-C-01)
- **Basic:** Identify the hypotenuse · Write Pythagoras' theorem for a triangle · Squares and square roots · Find the hypotenuse · Is the triangle right-angled?
- **Expected:** Find the hypotenuse (1 dp) · Find a shorter side · Pythagorean triads · Pythagoras with mixed units · Height of an isosceles triangle · Pythagoras in context

### Area (MA4-ARE-C-01)
- **Basic:** Rectangles and squares · Triangles · Parallelograms · Circle in terms of π · Choose a unit of area · Find a missing length
- **Expected:** Trapeziums · Rhombuses and kites · Circle (1 dp) · Sectors · Semicircles and quadrants · Composite shapes · Convert units of area · Work backwards from an area

### Volume (MA4-VOL-C-01)
- **Basic:** Counting cubes · Rectangular prisms · V = Ah · Units of capacity · Volume and capacity · Views of solids · Is it a prism?
- **Expected:** Triangular prisms · Trapezium prisms · Composite prisms · Cylinders · Missing dimensions · Capacity of containers · Convert units of volume

### Properties of Geometrical Figures (MA4-GEO-C-01)
- **Basic:** Classify triangles by sides · by angles · Angle sum of a triangle · Name a quadrilateral from its markings · Angle sum of a quadrilateral · Properties of quadrilaterals
- **Expected:** Isosceles and equilateral triangles · Exterior angle · Angles in special quadrilaterals · Angles with algebraic expressions · Classification true/false · Classify by sides and angles · Convex and non-convex · Unknown sides using properties

### Data Classification and Visualisation (MA4-DAT-C-01)
- **Basic:** Categorical or numerical? · Frequency tables · Column graphs · Dot plots · Pictograms · Line graphs
- **Expected:** Classify a variable fully · Census, sample and bias · Stem-and-leaf plots · Histograms · Sector graphs · Divided bar graphs · Choose a display · Misleading graphs

### Data Analysis (MA4-DAT-C-02)
- **Basic:** Mean · Median · Mode · Range · Statistics from a dot plot · Mean in context
- **Expected:** Median of an even set · Mean to 1 dp · Frequency tables · Stem-and-leaf plots · Missing value from the mean · Outliers · The effect of changing the data · Shape of a distribution · Comparing two sets · Choosing a measure of centre

### Probability (MA4-PRO-C-01)
- **Basic:** Sample spaces · Chance words · The 0–1 scale · Dice · Spinners · Bags of counters · Numbered cards
- **Expected:** Fraction, decimal and percentage · P(not A) = 1 − P(A) · Complementary events · Probabilities add to 1 · Relative frequency · Expected outcomes · Not equally likely · Letters

## Platform wiring
- Registry: 11 entries (`<topic>-quiz`, tool `<topic>-student-quiz`).
- Teacher Platform: rows in `BUILDER_QUIZZES` (the newer 11 have `builderUrl` = `?builder=1`). In "Set an Online Task" every Stage 4 topic opens with a whole-topic card and its "＋ Set this quiz ›" button.
- Resources by Stage: a Student quiz row under each outcome. Homepage: 11 cards in Online Quizzes › Stage 4.

## Adding a question type
Add `add("basic"|"expected", id, label, gen)` in the topic's bank; `gen()` returns `{ prompt, diagram?, mode, …, why }`. Keep types easiest first. Bump the bank's `?v=` in its page.

## Known follow-ups
- Arabic/Farsi for the newer eleven (the older five are trilingual).
- The older five still open their teacher builder at the plain URL (harmless now: tasks always use a locked link, and an attempt from a self-made link doesn't count for the task).
- The older five's "Retry" lets a student redo a marked question; their scoring rules were left as they were.
- Other bespoke quizzes outside these 16 may also drop early-submit fields in their own save code; check before relying on their part-finished results.
- Stage 5 whole-topic quizzes could reuse this engine with a bank per outcome.
