# Area of a Triangle — Half the Rectangle (rebuilt 2026-10-31, revised 2026-11-01, 2026-11-05, 2026-11-11, 2026-11-16)

`interactive-tools/stage-4/measurement-space/area-of-a-triangle/index.html` (the URL is unchanged). It is a whole-class teaching tool built on the Area Model tool's shell.

## The idea
A triangle is always half of a base × height rectangle. The tool shows three ways to see it, one per mode. Each mode is a short step story in the side panel (Next / Back / Show all). Every mode then ends with the same two area steps (added 2026-11-11, see below).

- **Animations play backwards on Back:** every animation reverses when you step back.
- **Colours:** the triangle is a dark green so it stands out. Pale green marks the copies.
- **No outline on the finish:** the finished rectangle has no dark outline in any mode.
- **The triangle locks once the steps start:**
  - The drag handles disappear and nothing can be dragged.
  - The Base / Height steppers and presets still work, and they restart the story at step 1.
- **Every copy moves in two separate, clear motions**, so new learners can see it is the same triangle:
  1. A clean straight slide (no turning), part of the way towards its place.
  2. A half-turn into place.
  - It lands exactly where it completes the rectangle or parallelogram.
  - Jeff tried a reflection / page-turn flip first and found slide-then-turn clearer.
  - The board keeps the same scale through all the steps of a mode, with room left for the copy to move.

### 1. Rectangle — acute and right-angled only
This mode is greyed out for obtuse triangles. Dragging the top past the end of the base switches to Two copies.

1. The triangle, as it is.
2. The dotted height appears, the scissors cut along it, and the halves part by a thin white strip.
3. A pale copy of each half slides, then turns into place.
   - The halves slide back together and the cut line fades.
   - Then the dotted height (with its label and right-angle mark) slides out to the rectangle's nearer edge, so students see that the height is the rectangle's side. This was added 2026-11-05.
   - The student quiz's model does the same.

For a right-angled triangle, step 2 marks the sloping side, and in step 3 one pale copy slides and turns into place. The height is already a side, so nothing moves.

### 2. Two copies
1. The triangle.
2. A copy slides, then turns onto the **longest slanted side**, making a parallelogram on the base.
3. Scissors chop at the edge of the base. The piece parts, then slides across to complete the base × height rectangle.
   - A very long lean takes more than one chop.
   - A right-angled triangle makes a rectangle straight away.

The triangle's edges stay dark throughout. The dotted height glides to the rectangle's nearer edge. This matches the paper-cutting demo Jeff shared.

### 3. Slide the top (no stripes)
1. The triangle.
2. The top slides along the dashed line to the nearer right angle. A ghost outline shows where it started.
3. A pale copy slides, then turns to complete the rectangle.

### The two area steps every mode ends with (Jeff, 2026-11-11)
4. **Count the squares, row by row.** The bottom row lights up square by square, then the other rows light up one after another. The total pops up in a bubble in the middle of the rectangle and flies into a label beside it: "Rectangle = 54", or "Square = 49" when base = height.
5. **Halve it.** The row highlight fades so the triangle stands out. The total swells, breaks into two halves, one half drops away, and the label becomes "Triangle = 27" as the remaining half moves into place.

- The label never says "Parallelogram": no mode ends on one (Two copies is chopped into the rectangle first).
- Halves of odd areas show as decimals (e.g. 22.5).
- The label sits to the right of the rectangle, past the height's label when that is on the right. Room for it is kept at every step so the scale never changes. On narrow screens (phones, and 1024 wide with the calculation and units on) it sits above the rectangle instead.
- The rows are counted even with unit squares turned off, because counting them is the point of the step.
- Timing scales with base and height (about 4 s for the rows, 2.5 s for the halving).

## Show the calculation (Settings, off by default)
- **Off:** no ½ × base × height appears anywhere on screen. The labels are just "Rectangle = 54" and "Triangle = 27".
- **On:** the `Area = ½ × b × h = ?` line shows above the board, and the answer appears once the halving finishes. The step lines gain their calculations, and the labels carry the working: "Rectangle = 6 × 9 = 54", "Triangle = 54 ÷ 2 = 27". The old answer bubble in the middle of the board is gone.

## Formula mode (Settings, off by default — added 2026-11-16)
- The base and height are labelled **b** and **h** (maths italics) instead of numbers, and units drop out.
- The panel steps use the letters ("a b × h rectangle", "b squares in each row, h rows").
- The label beside the shape builds the formula: "Rectangle = b × h", then the halving splits it into "Triangle = ½ × b × h".
- The line above the board reads "Area = ?" until the last step, then "Area = ½ × b × h". It shows in Formula mode whether or not Show the calculation is on.
- The pictures (cuts, slides, rows lighting up) are unchanged. The steppers still show the drawing's real size.
- Same switch in the parallelogram and trapezium tools.

## Controls
- **Changing the triangle (at step 1):**
  - Drag the top.
  - Drag the end of the base.
  - Use the steppers.
  - Use the Acute / Right / Obtuse presets.
  - New triangle.
- **Corner icons:** start again, hide panel, full screen.
- **Keys:** Space (start again), Enter (new triangle), → / ←, 1–3, F.
- **Other settings:** unit squares, units, triangle colour, Formula mode.
- **Tools menu** also links the Area of a Trapezium tool (2026-11-16).
