# Number Sum Chain — session notes (2026-10-19)

File: `interactive-tools/stage-5/measurement-space/square-sum-chain/index.html` (listed under MA5-NET-P-01 in resourcesManifest.js; homepage Interactive Tools card added, pill 34 → 35).

## Added
- **How-to-play pop-up** on load (`?intro=0` skips; round **?** button in the top bar reopens). 3-beat demo: 30+34=64 (8×8 dots) ✓, 30+35=65 (one dot left over) ✗, chain 34·30·51. Demo numbers are all **above 25** (the picker's max) so the demo is never a link in a real answer. Reason: with 1–15 only 15 pairs make squares and 14 are links in the unique chain (the odd one out is 1+3).
- **How far does it go?** picker, 1–15 up to 1–25. N travels with the room state (`state.n`; no rules change — `state` is an open map). Undo restores N.
- Facts (verified by exhaustive search): chains exist for 15, 16, 17 (one each, plus reverse), 23 (three), 25 (ten); **none** for 18–22 and 24.
- **Sums on joins** toggle: a pill with a+b at the middle of every join; follows dragged tiles.
- **Network view** — **no toolbar button** (teacher decision 2026-10-19: it's too big a scaffold). Opens from the "Solved!" message ("See it as a network"), or the teacher presses **N** (ignored while typing in a box or with another pop-up open). Numbers round a circle, lines coloured by the square they make.
  - *Trace*: tap along lines; refuses non-joins with the reason, reports "stuck", and a full trace can be put straight into the answer.
  - *Reason it out*: step-through deduction from the DOM-free engine `SSC.reason(n)` (`<script id="sscEngine">`): dead ends must be ends; non-ends with two partners force both joins; a number with all its neighbours has its other joins crossed out; "if it were the end" lookahead; case splits. Ends in the chain (15–17) or a contradiction (three ends / a number needing three neighbours / a loop) for 18–22, 24. Checked: never claims a possible N impossible; every forced/crossed-out join agrees with every real chain.
  - *Show a chain*: teacher reveal (gated), cycles through all chains for 23/25; says "there is no chain" for impossible N.
- **Hints were built and then REMOVED** (teacher decision 2026-10-19: they gave it away). `hintsFor()` is still in the file, unused; `renderHints()` is a no-op.
- Win message: counts the chains for N, "Try 1 to N+1" button, "See it as a network".
- Terminology for class: the chain is a **Hamiltonian (Hamilton) path** — every vertex once, not returning to the start (that would be a Hamiltonian circuit). A graph with one is called **traceable**. Contrast with Eulerian trails/circuits (every edge once), which MA5-NET-P-01 names.

## Phones, iPads and short laptop screens
- App layout: toolbar pinned to the top, answer tray pinned to the bottom, board sized to fill the gap (`fitBoard()`); on a big screen where the whole page fits, sized so nothing scrolls. "Let's go" scrolls to the workspace when needed.
- ≤1340px: Tidy / Clear / Empty / Sums in a **More** menu, toolbar one row. ≤700px: compact header, challenge box starts collapsed, tools as a 5-column row, Check in the toolbar.
- Tap-to-place: tap a tile → empty spaces glow, tray says "Tap a space for 8"; tap the workspace to move the selected tile there. Dragging near the edge scrolls the page.
- Tiles shrink (min 34px) only when a small board must hold many rows (1–25 on an iPhone SE). Network dots have finger-sized tap targets.
- Verified (Playwright, touch emulation): iPhone SE/13/Pro Max, iPad, iPad mini (portrait + landscape), 1280×720, 1366×768, 1920×1080 — tiles and tray on screen together, no overlaps, no sideways scroll, tap/drag/More/network all working, at 1–15 and 1–25. Not yet tried on a real device.

## Rooms
- Verified with two pages on a stubbed Firestore: tile moves (drag and tap), answer spaces, Tidy, N changes and Undo all sync both ways.
- Fixed: a tile dropped outside the workspace/spaces now sends its resting position (others were left with a half-way position from the live drag); the dragger no longer sees a ghost copy of the tile mid-drag.

## Possible next
- A printable version; letting students build the network themselves on the workspace with a "check my network" button.
