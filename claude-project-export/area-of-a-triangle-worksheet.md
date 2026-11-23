# Area of a Triangle — Worksheet Generator (rebuilt 2026-11-01)

`worksheet-creators/stage-4/measurement-space/area-of-a-triangle.html` (URL unchanged). It is built on the Area Model generator's frame:
- bands of settings;
- lettered problem types, each with a count;
- every row measured, then packed into A4 pages (what you see is what prints);
- a "Your turn" box in whatever space a page leaves;
- optional answer-key pages with a one-line reason for each answer.

## Problem types (the order is the lesson)
- **A Half the rectangle** — the rectangle is drawn round each triangle (a parallelogram when it is obtuse). Students write rectangle = __ × __ = __, then the triangle as half of it. Default 2.
- **B Find the area** — default 6. Each question has a single answer line: **Area of triangle = ____**.
  - Jeff asked for no ½ × __ × __ = __ frame.
  - A setting can add two working lines above the answer line.
- **C Same base, same height** — three triangles between two parallel lines on equal bases. Students tick the largest (answer: all the same) and explain. Default 1.
- **D Work backwards** — the area is given; find the missing base or height. Default 2.
- **E Spot the mistake** — students explain the error and give the correct area. Default 1. The mistakes are:
  - forgot to halve;
  - used the sloping side;
  - halved twice.
- **F Draw your own** — draw a triangle with a given area on squares, then a different one (can one be obtuse?). Default 1.
- **G Fluency** — no diagram; on Medium and Spicy some ask for a missing length. Off by default.

## Differentiation settings
- **Number levels** — tick one or several, and several make a ladder within each section.
  - Sweet: base to 10, height to 8.
  - Mild: base to 12, height to 10.
  - Medium: up to 12, with some halves.
  - Spicy: base to 20, height to 16.
  - Quick sets: Getting started, Core Stage 4, Extension, All four.
- **Kinds of triangle** — right-angled, acute and obtuse toggles.
- **A sloping side labelled too** — Never / Sometimes / Often. It is a whole-number distractor (3-4-5, 6-8-10, 5-12-13 …).
- **Turned triangles** — Never / Some / Most. The base is not at the bottom, so students find it from the right angle.
- **Unit squares** — printed only on triangles that are not turned and are big enough to count.
- **Units** — cm, mm, m or none.
- **Paper** — spacing (spacious / standard / compact) and colour or black and white.
- **Toggles:**
  - worked example on page 1;
  - show ½ × base × height in the example (off for a discovery lesson);
  - name and date;
  - answer key.

## Drawing
- `triSVG()` draws in mm. The triangle is dark green, with the height dashed in orange and a right-angle mark.
- An obtuse height sits on a dotted extension of the base.
- **Label placement:**
  - Base and sloping-side labels sit clear of the lines.
  - An inside height is labelled on its own line, on a white patch.
  - A sloping side's label goes outside or inside, whichever has more room.

## Wiring
- Homepage card retitled, with new search words.
- Resources by Stage row updated; `toolLinks.js?v=` bumped.
- CLAUDE.md note added.
