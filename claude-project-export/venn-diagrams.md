# Venn Diagrams: Sorting Numbers

Teaching tool at `interactive-tools/stage-5/statistics-probability/venn-diagrams/index.html` (single self-contained file, no Firebase). Built 2026-11-19 from Jeff's "Intro to Maths Venns" deck, in the spirit of Craig Barton's Maths Venns (deliberately not named after them). MMT shell copied from the Area of a Trapezium tool.

## Where it is filed
- **MA5-PRO-P-01 only** (ideas `venn-two-way`, `mutually-exclusive`). Jeff's rule: link to Stage 5 only when no Stage 4 content point mentions Venn diagrams. The 2022 syllabus MA4-PRO-C-01 has 13 content points and none mention Venn diagrams or two-way tables; Venns sit in Stage 5 Probability B (Path).
- Homepage Interactive card (pill 43 → 44). toolLinks row; `toolLinks.js?v=` bumped in `resources/index.html` and `portal/teacher/index.html`.
- Tools menu: Worksheet Creator and Student Quiz greyed ("coming soon"); links to Factor Circles, Times Table Chart, Probability Spinner Simulator.

## The pedagogy: a slow reveal for mini whiteboards
Steps are data (`buildSteps`); Back plays each animation in reverse.
1. **One circle** (A), cards in a tray. "Which of these numbers are even?"
2. **Sort into one circle**: inside / outside (but still inside the box).
3. **A second circle arrives apart.** Sort again.
4. **The clash**: a number in both circles has nowhere to go. It wobbles in the gap with a "?". Students sketch a fix.
5. **Overlap the circles**: it drops into the overlap. Every number now has one place.
6. Three-circle Venns repeat 3–5 for the third circle.
7. **Name the regions**: cards dim, region numbers appear; click any region to hear its name in words (and set notation if on).
8. **Practice numbers, one at a time**: the card lifts in the tray; the teacher drags it to the class's whiteboard answer; Next marks it green or red and flies it to its true region.
9. **Fill every region**: dashed "?" boxes, students find their own number for each.
10. **Possible answers**: one per region (A = show others), impossible regions hatched with ✗ and a reason; "What if…" buttons change one circle and jump back to "fill every region".

Every layer can be switched off in Settings (one circle first, start apart, name regions, practice 0/3/4/6, fill every region). Board extras: 3-2-1 "Show me!" countdown (W), region numbers (R / #), set notation, tint, font size.

First load: **An even number · Greater than 10** with 6, 15, 12, 7, 10 (10 is the boundary case: even, not greater than 10).

## The 15 Venns
- Starting out: even / > 10; multiple of 5 / even; prime / odd (only 2 is prime and not odd); negative / > −5 (neither is impossible).
- Factors and multiples: multiples of 4 / 6 (overlap = multiples of 12, LCM); factors of 24 / 36 (overlap = common factors, HCF 12); square / cube.
- Three circles: even / factor of 30 / > 10 and square / multiple of 3 / factor of 36 (both from Jeff's deck); prime / even / > 10 (one impossible region).
- Decimals and big numbers (Jeff's deck): > 0.4 / < 0.5 / last digit 4; > 7000 / < 20 000 / 5 digits long — several impossible regions.
- Probability: die (even / > 3); 1–20 (even / multiple of 3); 1–20 (prime / odd). Sort the whole sample space, count each region, then P(and), P(or), P(not), P(or but not both), P(neither) — question first, then shading and the simplified fraction.

## Making your own
Panel → change any circle (whole-number Venns): even, odd, prime, square, cube, multiple of n, factor of n, greater/less than n, last digit is d; add or remove a third circle. New numbers (Enter) picks numbers covering every possible region, always including the overlap, plus one boundary number. Every placement and answer is computed from the circle rules — nothing is hand-classified.

## How the layout works (for maintenance)
- Landscape and portrait layouts (`CFG_L`, `CFG_P`); portrait stacks circles with labels above and below (phones, portrait iPads).
- Radius per layout by binary search; the two-circle stage caps it, so circles never grow mid-story. Three-circle centres 1.1 r apart (measured: roomiest smallest region, about 0.33 r).
- Labels wrap onto two lines when wider than the circle.
- Cards placed incrementally: earlier cards keep their spot; a newcomer takes the free spot that overlaps nothing, then has room from the lines, then is near the middle. Labels, region numbers and the clash gap are obstacles. `layout()` rehearses every step and shrinks the cards until no two touch.
- Canvas font strings are `"800 %px …"` with `%` replaced by the number only — a double "px" silently measured everything at 10px.

## Verified (Playwright)
- Audit of 1,245 frames (15 Venns × every step × 1366, 1920, 1024, 1280, 390 wide): no card in the wrong region, nothing off the board or outside the box, no label over a card, no card overlaps at desktop/projector sizes — also with large type, region numbers and set notation on. Only the big-number Venn is crowded on a 390 px phone.
- 54 behaviour checks with real animations and a real mouse; 1,185 cards and answers re-derived with independent tests.

## Possible next
- Worksheet creator: the same ladder on paper (fill-every-region sheets, "is this region impossible?", design your own Venn).
- Student quiz: place numbers, then fill regions, then reason about impossible regions.
- A two-way table view beside the probability Venns (the other half of MA5-PRO-P-01).
