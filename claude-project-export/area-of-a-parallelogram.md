# Area of a Parallelogram & Rhombus (new teaching tool, 2026-11-01; Formula mode 2026-11-16)

The tool is at `interactive-tools/stage-4/measurement-space/area-of-a-parallelogram/index.html`. It is a whole-class Stage 4 area tool built on the Area of a Triangle tool's shell and conventions.

## The idea
Every area comes back to a rectangle made of rows of unit squares. There are three modes, each a short step story in the side panel (Next / Back / Show all).

**Every story ends with the same final reveal step, "The area".** The answer pops up as a small bubble in the middle of the shape, for example "28 square units", or "40 cm²" when units are set.

1. **Rectangle (count the array)**
   - The rectangle starts **pale green**, and each square darkens as it is counted.
   - Step 1: "How many squares cover it? Guess first."
   - Step 2: count one row, square by square, with the squares numbered.
   - Step 3: count the rows. A running total sits at the end of each row (b, 2b, 3b …).
   - Step 4: h rows of b.
   - Step 5: the area bubble.
   - It covers squares as well.
2. **Parallelogram (cut and slide)**
   - The shape is set by its base, height and lean (+ leans right, − leans left).
   - Cut along the height. The scissors cut down from the top corner and the piece parts by a thin white strip.
   - Slide the piece to the other end. It is now a base × height rectangle with the same area.
   - The area bubble pops up in the middle of that rectangle.
   - When the shape leans further than its base, it is cut into strips one base wide that slide back.
   - The sloping side is labelled as a distractor when it is a whole number (this can be turned off).
   - The Rhombus preset uses whole-number sides (3-4-5, 6-8-10, 5-12-13) and shows equal-side marks.
3. **Diagonals (a rhombus)**
   - The rhombus is drawn by its diagonals p and q, which meet at right angles, inside a dashed p × q rectangle.
   - Cut along both diagonals.
   - The two bottom pieces slide up into the top corners, one after the other. This makes a p × q/2 rectangle, half of the one round it.
   - The area bubble pops up in the middle of that half rectangle.
   - The Square preset makes p = q.

## Formula mode (Settings, off by default — added 2026-11-16)
Letters instead of numbers, using the NSW formula-sheet letters, in maths italics, with no units:
- **Rectangle:** across **l**, up **b**. The panel counts "b rows of l". The running totals and the numbers in the first row are hidden (they would be numbers). Ends on "Area = l × b".
- **Parallelogram:** **b** and **h**. The sloping-side distractor is hidden. Ends on "Area = b × h".
- **Diagonals:** **x** and **y**, with the half rectangle's side labelled **½y**. The panel title becomes "Why half of x × y?". Ends on "Area = ½ × x × y".

In every mode:
- The last step is "The formula": the bubble on the board and the panel both show it.
- The line above the board reads "Area = ?" until that step. It shows in Formula mode even with Show the calculation off.
- Same switch in the triangle and trapezium tools.

## Conventions (the same as the triangle tool)
- The shape is green, and every animation runs backwards on Back, including the bubble, which shrinks away.
- The shape locks once the steps start: the handles disappear. The panel's steppers and presets restart the steps at step 1.
- **Show the calculation** (Settings) is off by default, so no formula appears on screen. The area bubble at the end shows the answer only.
- **Keys:**
  - Space: start again
  - Enter: new shape
  - → / ←: step forwards and back
  - 1–3: switch mode
  - F: full screen
- **Corner icons:** start again, hide panel (the step then shows under the board, with a mini Next), full screen.
- **Settings:** Formula mode, show the calculation, unit squares, label the sloping side, units.

## Wiring
- Homepage interactive card added, with search words such as parallelogram, rhombus, diagonals, base × height and rearrangement. The interactive section count was updated.
- Resources by Stage rows added:
  - MA4-ARE-C-01 (rectangles-triangles-parallelograms)
  - MA3-2DS-03 (parallelogram)
  - MA3-2DS-02 (rectangles)
- Linked from the triangle tool's Tools menu.
- The Tools menu links the Student Quiz (`claude/area-of-a-parallelogram-quiz.md`), the Worksheet Creator (`claude/area-of-a-parallelogram-worksheet.md`) and, since 2026-11-16, the Area of a Trapezium tool.
