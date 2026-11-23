# Area Model — Multiplication & Perimeter (Stage 3–4)

`interactive-tools/stage-4/measurement-space/perimeter-area-rectangle/index.html` — rebuilt 2026-10-31 from the old "Area Model Splitter" (same URL). One self-contained file, SVG board, test surface `window.__AM__`.

Filed under **MA3-MR-01** (new row, ideas partition-multiply + multiply-2-digit), **MA3-2DS-02**, **MA4-ARE-C-01** and **MA4-LEN-C-01**. Homepage card retitled with "area model" in its search keywords.

## The idea
One rectangle, two questions about it. Splitting a side splits the rectangle into pieces that still cover the same area, so 23 × 14 = 20 × 10 + 3 × 10 + 20 × 4 + 3 × 4, and any split gives the same total (the distributive law, seen). The same cuts break each edge into parts, so the perimeter is an addition of those parts, and the split you choose is an addition strategy.

## Pedagogical decisions
1. **Starts whole by default.** The class decides how to split before anyone touches the ruler (setting can start split by place value).
2. **Splits are shared by both modes.** Nothing built in Multiply is lost when switching to Perimeter.
3. **Non-standard splits are first-class:** click/drag anywhere on the ruler, or type `15 + 8`, `10 + 10 + 3`, `7 + 7`.
4. **Same-size pieces share a colour and group in the working.** Into tens on 40 × 30 shows twelve identical 10 × 10 pieces and `12 × 100 = 1200`, not "3 × 4 with two zeros".
5. **The answer is never on screen early.** Products show as `20 × 10 = ?` until revealed; the total appears only after Add them up.
6. **Ways we've found** logs every finished method, so a class can see three splits all landing on 322.
7. **Perimeter strategies:** Walk round (running total), Tens & ones (digits of every edge part by place value), Double half (top + right, doubled; whole rectangle only), Your order (tap edges; "a ten!" flagged, e.g. 27 + 3 = 30).
8. **Remove pieces** builds composite shapes but never one that is in two parts or has a hole, so the perimeter is always one walk round. A corner cut keeps the perimeter; a notch raises it. Area working adds "whole rectangle take away the gaps".

## Board controls for low cognitive load (Jeff's feedback, 2026-10-31)
Three icons in the board's top-right corner:
- **↺ Clear all splits** — same as Unsplit (also puts cut-away pieces back), reachable when the side panel is hidden.
- **Panel toggle** — folds the side panel away so the board gets the full width; remembered between visits.
- **Full screen** (or the F key) — the board alone: topbar and side panel hidden, browser full screen where supported. Esc or F leaves it.

With the panel away or in full screen, a small ◀ / Next ▸ pair sits bottom-right of the board so pieces can still be revealed step by step (clicking a piece also works).

## Drawing
To scale with unit squares (sides ≤ 100). Long thin rectangles, or slivers under 18px when a side is over 100, switch to an open model marked "Not to scale" where every part gets a minimum width. Board sized to the real page; no scrolling at 1024×768 and up.

## Verified (Playwright)
400 random rectangles with random splits and removals against an independent unit-by-unit count; every strategy's working; real-mouse ruler click, drag, snap and drag-off; piece and edge taps; keyboard; inline number editing; all six number levels; fit at seven screen sizes; clear, panel collapse (and its memory across a reload), mini steps, and full screen on and off on desktop and phone.

## Not built / ideas
Student quiz and worksheet are the existing ones (Area Model quiz, Area & Perimeter quiz, worksheet creator). Possible: a "decimals" mode (2.3 × 1.4), or algebra tiles (x + 3)(x + 4) using the same board.
