# Area of a Parallelogram & Rhombus — Worksheet Generator (new, 2026-11-01)

The generator is at `worksheet-creators/stage-4/measurement-space/area-of-a-parallelogram.html`. It is built on the Area of a Triangle generator's frame: the same CSS, measured rows packed into A4 pages, a "Your turn" box in the leftover space, and answer key pages.

It links to the teaching tool and the Student Quiz. Both of those link back to it from their Tools menus.

## The idea
Every area comes back to a rectangle, the same story as the teaching tool:
- rows of unit squares
- a parallelogram cut along its height and slid into a base × height rectangle
- a rhombus as half the rectangle round its diagonals

## Levels (tick one, or several for a ladder)
- **Sweet:** sides 2–10.
- **Mild:** sides 3–12.
- **Medium:** sides 4–12, bigger areas.
- **Spicy:** sides 5–16, with halves (such as 6.5) on area questions only.
  - Squares are never halved.
  - A diagonal is halved only when the other diagonal is even, so there are no quarter areas.
  - A labelled sloping side keeps a whole-number height.

Working backwards always has whole-number answers. Quick sets: Getting started, Core Stage 4, Extension, All four.

## Shape switches
- Rectangles & squares
- Parallelograms
- Rhombuses (by a side and the height, with whole-number sides from 3-4-5 / 6-8-10 / 5-12-13)
- Rhombuses by their diagonals

The switches decide which shapes appear in C, E, F and H; at least one stays on. Other settings:
- the sloping side as a labelled distractor (never / sometimes / often)
- unit squares (drawn only when the lengths are whole numbers and the squares are big enough to count)
- the answer space in C (one line, or working lines)
- units, spacing, colour or black and white
- a worked example with or without the formulas
- name and date
- answer key pages

## Problem types (counts are editable)
- **A Rows of squares:** rectangles and squares on unit squares, answered as "__ rows of __ = __".
- **B Cut and slide:** a dotted cut along the height, a dashed ghost of where the piece goes, and an arrow. Students fill in "Rectangle __ × __ = __", then the parallelogram's area.
- **C Find the area:** the ticked shapes mixed.
- **D Rhombus from its diagonals:** inside a dashed p × q rectangle. Students find the rectangle, then the rhombus.
- **E Work backwards:** the area is given; find the base, height or diagonal. No grid.
- **F Spot the mistake:** used the sloping side, halved a parallelogram, or forgot to halve the diagonals. Students explain the mistake and fix it.
- **G Draw your own:** on squares, a shape with a given area, then a different shape with the same area.
- **H Fluency:** off by default. Lengths in words with no diagram, in 2 columns.

The "Your turn" prompt changes from page to page.

## Wiring
- Homepage worksheet mini card (worksheet count now 36).
- Resources by Stage "Worksheet maker" rows under:
  - MA4-ARE-C-01
  - MA3-2DS-03
  - MA3-2DS-02
- `toolLinks.js?v=7e30c29d`.
- A CLAUDE.md NEW block.
- Test surface `window.__WS__`.
