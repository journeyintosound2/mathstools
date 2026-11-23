# Area Model — Worksheet Generator (rebuilt 2026-10-31)

`worksheet-creators/stage-4/measurement-space/perimeter-area-rectangle.html` — same URL as the old "Rectangles - Area/Perimeter worksheet maker", rebuilt on the Order of Operations worksheet generator's shell (bands, problem-type cards with examples, 196 × 281 mm pages, measured packing, answer key, B&W, "Your turn" fill). Sibling of [[area-model]]. Test surface `window.__WS__`.

## Controls
- **What are we practising?** Area (multiplication) / Perimeter (addition) / Both. Hides the other focus's sections; F and G ask for whichever is chosen.
- **Level tick-chips** (Counting Strategies pattern): Teen × 1-digit, 2-digit × 1-digit, Teen × teen, 2-digit × 2-digit, 3-digit × 1-digit, 3-digit × 2-digit. Several ticked = each section climbs easiest-first. Quick sets. Last chip can't be unticked.
- **The splits:** Drawn by place value / Drawn, a mix of splits (non-standard: 10 + 10 + 3, 7 + 7, 15 + 8, 25 + …) / **Fade out** (default: first half of each section drawn, the rest blank; the section head says "From question N, draw the splits yourself") / Blank (students split).
- **Unit squares:** on where they fit (drawn to scale when both sides ≤ 60 and a square is ≥ 2.2 mm, so mostly Stage 3 sizes) / off (open models with a minimum part width).
- **Perimeter working** (section D scaffold): tens and ones / double the half / alternate / own way (working box).
- Units, spacing (Spacious 2 per row large, Standard 2, Compact 3), colour/B&W, multiplication written small in each piece, worked example on page 1, name/date, answer key.
- Link kept to the ready-made Matchstick Troubles PDF.

## Sections
A Multiply with the model · B Two splits, one answer (place value vs another split, "what do you notice?") · C Missing numbers (products given, find the sides; harder variant one part missing each side) · D Add the edges · E Make a ten (one side split so a part tops the other up to a ten, e.g. 48 by 2 + 24) · F Cut-out shapes (corner = same perimeter, notch = longer; area as pieces or whole − gap; the same/longer/shorter tick boxes) · G Fluency (off by default).

Answer key fills every piece, missing side and edge, with the reason (divisions for C, pairs for E, whole − gap and the same/longer explanation for F).

## Wiring (done 2026-10-31)
Homepage mini card retitled "Area Model — Multiplication & Perimeter" with area-model search words. toolLinks "Area Model — Worksheet Creator" rows under MA3-MR-01 (partition-multiply, multiply-2-digit), MA3-2DS-02 (rectangles), MA3-2DS-03 (composite), MA4-ARE-C-01 and MA4-LEN-C-01; `toolLinks.js?v=` bumped; offline list rebuilt; CLAUDE.md note added.

## Verified (Playwright)
70 random option combinations (1,084 questions): focus obeyed, level ladder, parts sum to sides, fade pattern, B's second split differs, E makes a ten, F shapes connected with no holes, area and perimeter re-derived against an independent unit-square count, C always solvable, key mirrors the worksheet with continuous numbering, every key shows the right answer, nothing past the page or wider than its card. Every level × split mode gives the full count. PDF page count = preview (normal, roomy, tight).

## Possible next
A student quiz built on the same sections (the two existing quizzes predate the rebuild), or a trilingual layer like the other creators.
