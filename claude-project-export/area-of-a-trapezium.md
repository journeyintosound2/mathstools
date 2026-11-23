# Area of a Trapezium — teaching tool (2026-11-16)

`interactive-tools/stage-4/measurement-space/area-of-a-trapezium/index.html` — built on the Area of a Triangle tool's shell and animation style. Filed under MA4-ARE-C-01 ("Develop and use the formulas to find the area of trapeziums, rhombuses and kites"), homepage Interactive card, linked from the triangle and parallelogram tools. Its Tools menu links the **Student Quiz** (`claude/area-of-a-trapezium-quiz.md`) and the **Worksheet Generator** (`claude/area-of-a-trapezium-worksheet.md`), both added 2026-11-16.

## Three ways (mode switch, keys 1 / 2 / 3)

**Average base** (from Jeff's sketch 1), 6 steps:
1. The trapezium (top a purple, base b blue, height orange).
2. Find the middle of each sloping side (pin + equal-halves tick marks) and cut straight down — or up, when a top corner hangs over. Curved arrows show where each corner will go.
3. Swing each corner half a turn round the middle point → rectangle. The original outline stays as a dashed ghost ("the top got longer, the base got shorter, by the same amount").
4. How long is the rectangle? a drops and b rises to halfway up, they meet and the number halfway between pops out (the midline), then drops to label the base.
5. Count the squares, row by row → "Rectangle = 24".
6. Swing the corners back → same pieces, same area → "Trapezium = 24".

**Half a parallelogram** (from Jeff's sketch 2), 6 steps:
1. The trapezium.
2. Copy, slide it over and turn it onto the right sloping side → parallelogram (copy labels: b on top, a on the bottom).
3. Its base is both parallel sides: b and a slide together, "+", pop into a + b.
4. Chop at the edge of the base and slide the piece across → (a + b) × h rectangle (skipped when a side is vertical).
5. Count the rows → "Rectangle = 48".
6. Halve it → the number splits, the piece slides back, the copy fades → "Trapezium = 24".

**Halve the height** (from Jeff's sketch 3, added later on 2026-11-16), 7 steps:
1. The trapezium.
2. Cut it across, halfway up. The cut joins the middles of the two sloping sides (pins + equal-halves ticks). The height label h splits into two labels, ½h each ("two pieces, each 2 high"), and the pieces part slightly.
3. Turn the top half round the middle of the right-hand side: a curved arrow, then half a turn clockwise about that point. The top half's ½h and its a travel with it. Its half of the right-hand side lands exactly on the bottom half's (the tick marks meet) → parallelogram a + b long and ½h high. The trapezium stays as a dashed ghost.
4. Its base is both parallel sides: b and the turned a slide together, "+", pop into a + b.
5. Chop at the edge of the base and slide → (a + b) × ½h rectangle (or "It's already a rectangle" for a right trapezium with a vertical left side).
6. Count the rows → "Rectangle = 24" (half a row when h is odd).
7. Turn the top half back → same pieces, same area → "Trapezium = 24". Statement: (a + b) × h/2; Formula mode: (a + b) × ½h.

Design notes for this mode:
- **Why clockwise:** the whole trapezium is on one side of the right-hand side, so a clockwise half-turn about its middle never runs the top half through the bottom half. This was checked for all 11,340 allowed shapes.
- **Why a pure turn:** the top half turns about the pin itself, not "slide then turn", because the point it turns about is the idea being taught.
- **Scale:** the board keeps the whole turn in view, so this mode draws the trapezium a little smaller than the other two.

## Formula mode (Settings, off by default — added 2026-11-16 at Jeff's request)
- The sides are labelled **a** and **b** (the parallel sides) and **h**, in maths italics, with no units.
- The pictures are unchanged; the labels and panel build the expression instead of numbers.
- **Average base:**
  - a and b meet halfway up and pop out **½(a + b)**, the rectangle's length.
  - "Rectangle = ½(a + b) × h", then "Trapezium = ½(a + b) × h" when the corners swing back.
- **Half a parallelogram:**
  - b and the copy's a merge into **a + b**.
  - "Rectangle = (a + b) × h", then the halving splits it into "Trapezium = ½ × (a + b) × h".
- **Halve the height:**
  - h splits into two **½h**, and b and a merge into **a + b**.
  - "Rectangle = (a + b) × ½h", then "Trapezium = (a + b) × ½h".
- The line above the board reads "Area = ?" until the last step, then shows the formula for the mode on screen:
  - Average base: (a + b)/2 × h.
  - Half a parallelogram: ½ × (a + b) × h.
  - Halve the height: (a + b) × h/2.
- It shows in Formula mode even with Show the calculation off.
- The same switch was added to the triangle (b, h) and parallelogram tools (b, h; rectangle l, b; rhombus diagonals x, y).

## Teacher choices
- Settings → Formula mode (above).
- Settings → Show the calculation (off by default): the statement for the mode with a "?" until the end, and working in the labels and panel.
- Kind of new trapezium: isosceles, right-angled, leaning (a corner hangs past the base), neither. Presets for the first three.
- Unit squares, colour (same six as the triangle tool), units.
- Drag the top-left corner (slide the top / height), top-right corner (top length), base corner (base). Shape locks once the steps start.
- Keys: → / ← step, Space start again, Enter new trapezium, 1 / 2 / 3 way, F full screen.

## Design notes
- Every allowed shape works in Average base because a top corner always sits over the base (`pRange`). Checked for 3,240 shapes.
- When the average base is a half (a + b odd) or the rectangle starts half a square across, the background grid fades while counting and the last cell in each row is a half.
- The height always ends on the rectangle's left side so the area label has room on the right.
