# Area of a Circle — teaching tool (2026-11-16)

`interactive-tools/stage-4/measurement-space/area-of-a-circle/index.html` — built on the trapezium tool's shell. Filed under MA4-ARE-C-01 ("Develop and use the formula to find the area of circles and sectors"), homepage Interactive card, linked from the Circumference, Triangle, Parallelogram and Trapezium tools. Worksheet creator and quiz are greyed in its Tools menu (not built yet).

## The story (Next / Back, every animation also runs backwards)
1. **The circle** — radius *r* (orange). "Area = ?" above the board.
2. **Cut it into n equal slices** — the cuts sweep round from the centre, then the slices separate with thin white gaps. Each straight edge is a radius.
3. **Go round the rim** — the rim draws round in blue: circumference **2πr**; it splits into two halves, the halves turn two shades, and a faint blue double-headed arrow grows round each half with its **πr** label on it.
4. **Unroll each half** — both halves travel across and flatten: the curved rim becomes a straight edge, still πr long, with the slices hanging off it like comb teeth. The πr arrows straighten with them. The circle stays behind as a dashed outline.
5. **Fit the two halves together** — the bottom row slides half a slice across, then the rows close up: a bumpy parallelogram made of the whole circle.
6. **Move half a slice to the other end** (rectangle ending only) — the end slice is cut in half, the half is picked up, slid across and set down, so both ends stand up straight. The left end is now exactly a radius.
7. **Measure it** — a copy of the circle's radius flies out and turns into place on the end of the shape (short side *r*); the long sides are the rim halves (πr). A dashed outline shows the rectangle it is becoming.
8. **Thinner slices** — the count doubles (8 → 16 → 32 → 64): the bumps flatten, the shape fills the outline. Same pieces, same area.
9. **The area** — πr × r = **πr²** inside the shape, and the circle fills back in with "πr²".

## What the teacher controls
- **Slices: 4 to 128**, changed at ANY step (− / +, slider, quick chips 4·8·16·32·64·128, keys ↑ ↓ or + −). The picture stays in place and keeps its size — slide from 4 to 128 at the "measure it" step to show the bumps disappear.
- **Letters or numbers** (side panel): letters r, πr, πr² (default); or a radius 1–20, labels like "π × 5", area to 2 decimal places (≈ 78.54).
- **Finish as** a rectangle (adds the half-slice step) or a parallelogram (base × height, as in the parallelogram tool).
- Outline of the rectangle it is becoming; **"How close to a rectangle?"** card (long side measured straight: 3.061r at 8 slices → 3.140r at 64; short side 0.924r → 0.999r); show the calculation; slice colour; units.
- Keys: → / ← step (Enter = next), Space start again, ↑ ↓ or + − slices, F full screen. Side panel can be hidden; full screen keeps the step in the line under the board.

## Design notes
- Each half is a chain hinged at its rim corners, so the curved rim straightens into chords laid end to end — the same rigid slices at every moment, so the area visibly never changes. When fitted together, each slice fills the gap between two of the other half's slices exactly.
- The long side is half the circumference because it IS the rim; the short side is a radius because it IS a slice's straight edge. Thinner slices only change how close the shape is to a rectangle.
- **πr arrows (Jeff's feedback 2026-11-16):** each arrow follows the circle through the half's first, middle and last rim corners, pushed outward, so it is round when the half is round and straight when it is flat. The arrows stop just short of the ends so the two halves' arrowheads meet tip to tip.
- **The radius turns into place (Jeff's feedback 2026-11-16):** the orange stick is a copy of the circle's radius; it lifts off, flies across and rotates onto the shape's end (vertical for the rectangle, the sloping end for the parallelogram), with its r label alongside.
- The answer (πr²) never appears before the last step.

Possible next: a worksheet creator (cut-and-rearrange on paper, then find areas, work backwards from an area to the radius, sectors as fractions of the circle) and a student quiz on the triangle/trapezium quiz pattern with this model in the side panel. A "sectors" extension (shade a fraction of the slices to find a sector's area) would fit MA4-ARE-C-01 too.
