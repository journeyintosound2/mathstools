# Order of Operations — Say What You See

Teaching tool at `interactive-tools/stage-4/number/order-of-operations-in-words/` (built 2026-10-16, redesigned 2026-10-19 after Jeff's feedback and refined several more times the same day). Listed under MA4-INT-C-01 (Stage 4 integers) and MA3-MR-02 (Stage 3, "applying the order of operations").

Worksheet creator at `worksheet-creators/stage-4/number/order-of-operations-in-words.html` (built 2026-10-19, fluency type and paper-picture fix added 2026-10-20). It is linked from the tool's Tools menu.

## The idea
No BODMAS/BIDMAS/PEMDAS. An expression describes a picture:
- `+` and · `−` take away · `×` groups of · `÷` half of / a third of … · `( )` one amount
- `5 + 3 × 5` = "5 and 3 groups of 5". The 3 counts groups, so it is never drawn as tiles.
- `10 − 4 ÷ 2` = "10 take away half of 4"; `(10 − 4) ÷ 2` = "half of (10 take away 4)".

## Design rules (from Jeff's feedback, 2026-10-19)
- **The board looks like the slides.** It shows tiles only, with no boxes, brackets, labels or highlights. Structure comes from spacing. Symbols sit large above each amount's tiles; words sit below (optional).
- **Positive tiles are GREEN** (highlights the positive), negative tiles are red.
- **No teacher-talk on the page.** Questions like "what do you notice?" / "what just happened?" are the teacher's to ask. Prompts are off by default.
- **Every transition works backwards too.** Back plays the same morph in reverse.
- **× is an array** (3 × 5 = three rows of five), never repeated dice-fives. Groups of a bracket stand apart as clusters (Example 2).
- **÷ is the whole amount with all but one equal part faded**, from the very first picture.
- **Red means "being taken away"; faded means "the part of a fraction not counted"** — never anything else.
  - This holds even when the part can't yet come out of the first amount ((16 − 5) − 4, 3 × 5 − 4). In that case the part is drawn apart, already red. On an integer board it is crossed out instead, since red already means −1.
  - In 6 − (−4) ÷ 2, two of the negative tiles are crossed out and the other half is faded.
  - When the part comes out of the first amount, its tiles turn red as they slide.
- **Subtraction follows Jeff's mock-up.** The whole amount comes first. Then the part being taken comes out of it and turns red. In the words step, "24" sits over the WHOLE group and "2 groups of 3" sits under the red tiles. These labels then morph into the two sentences. Then the red tiles fade to white.
- **On paper, a part taken out of the first amount TOUCHES what is left of it** (2026-10-20). Paper has no slide and no "10" label, so 10 − 3 × 2 must show ten tiles with six of them red. Drawn apart, the 10 read as 4. A part that can't come out yet (2 × 6 − 5) stays apart. The board keeps its gap.
- **"Bad grammar" gets brackets:** (20 ÷ 5) × 2, (6 × 4) ÷ 2, (12 − 3) − 4. The other reading shows 20 ÷ (5 × 2).

## Controls
- **Type your own** opens an equation editor in the spirit of the MMT Screen one, cut down to what the board draws (whole numbers, + − × ÷, brackets).
  - It tidies as you type (`*`/`x` → ×, `/` → ÷, `-` → −, spacing), has an on-screen keypad, and reads the sentence back in words or says why it cannot be drawn.
  - Anything it cannot draw (a decimal, a power) is kept and explained, never silently changed.
- **New problem** (bottom bar, or R) makes another problem of the same shape as the one on the board: same signs, brackets and kind of steps.
  - Numbers are friendly: groups and divisors 2–5, and divisions built to share exactly.
  - Amounts stay near their original size, the picture is never bigger than before, and the answer is sensible.
- **Tools menu** links only to the Worksheet Creator. Student Quiz is greyed (not built).

## Question sets
- The lesson in order (Jeff's examples plus 10 − 4 ÷ 2)
- Stage 3: × with + −
- Stage 3: ÷ joins in
- **Stage 3: mixed** (both Stage 3 sets)
- × ÷ / + − read left to right
- Stage 4: integers
- Mixed
- Type your own

A "the other reading" button draws what a left-to-right or bracket-dropping reading would mean.

## Worksheet creator
The tool's engine and generators are copied in verbatim, so a picture on paper matches the board (paper mode joins a taken-out part to its amount; see above). If the tool's engine changes, re-copy it into the worksheet.

**Problem types** are checkboxes with counts, and each description includes a worked example. They follow the lesson order:
- A See it (picture → sentence)
- B Say it (sentence → words)
- C Write it (words → sentence)
- D Draw it (dot paper)
- E Work it out
- F Argue it (two students' readings, one picture each — who is right?)
- **G Fluency** (off until ticked, 12 by default): number sentences with "= ____" only, no pictures and no working space. Ticked on its own, it makes a warm-up page.

**Levels:**
- Sweet, Mild, Stage 3 mixed, Medium, Spicy (integers)
- Mixed Stage 3 ladder; Mixed Stage 3 and 4 ladder

Each section climbs its own ladder.

**Options:**
- Spacing: Spacious (default, 2 per row, large print — made for younger students), Standard, Compact.
- Colour or black and white. In black and white, taken-away tiles are crossed out and faded parts are dashed.
- Tile diagrams on or off, the "Say it in words" strip, working space, name and date, and answer-key pages. The key draws every picture and writes every sentence in words.

**Pages:** A4, measured and packed so nothing overflows. Leftover space becomes a "Your turn" box, and the PDF page count matches the preview.
