# Closest to 100 — rebuild (2026-11-17)

File: `games/closest-to-100.html` (one self-contained page, same URL). Based on youcubed's *How Close to 100?* (credit kept under the turn panel).

## What changed
- **Layout.** Three columns on laptops/projectors: side (whose turn, score cards, squares-filled bar to 100, ten roll slots) · the hundred grid, sized to the screen height so it is never cut off · the turn panel (Roll → Multiply → Draw steps) with the number-sentence log underneath. On tablets the side and panel sit above the board; on phones everything is one column with the panel above the board.
- **Banner** is one row at 1366: Undo moved into the turn panel, "Back to menu" became "Menu".
- **Roll card.** Pressing Roll (or R) dims and blurs the page and opens a centred card. Two 3D dice tumble and land, then the student types the product into `a × b = [ ]`.
  - Correct: confetti from the card, "✓ Correct! 4 × 6 = 24 — now draw a 4 × 6 or 6 × 4 array", then the card fades away (1.6 s, or a click/Enter) and the grid pulses.
  - Wrong: the correct product, what they wrote, a dot array (a rows of b), a strategy line (doubling, halving ×10, double-double, 5 groups and one more…) and OK. The turn is still missed, as in the original rules.
  - Pressing Enter with an empty box no longer costs the turn.
- **Placing.** Drag to draw (as before), or choose a way round (a × b or b × a buttons) and click — or on touch tap once to preview, tap again to place. Right-click or T rotates. The preview shows "w × h" live; a wrong-sized drag explains what was drawn and what was needed.
- **Pass check.** If the array still fits somewhere, Pass asks "Look again" (Keep looking / Pass anyway) without saying where.
- **Records.** Each number sentence shows the running total; the end screen writes the whole game as one addition plus "100 − total = gap", and gives a "Talk about it" discussion prompt.
- Grid has bolder halfway lines at 5 to help count. Reduced motion turns off the dice tumble and confetti.

## Unchanged
Rules (10 rolls, wrong product = missed turn), modes (single, pass and play, online), the Firestore room shape and online transaction code, EN/AR/FA language switch.

## Implementation notes
- The card's phase (`rollUI.phase`: rolling / answer / correct / wrong) is separate from game state so an online snapshot can't close it mid-feedback. `rollUI.settled` stops it reopening for a roll already answered while sync catches up.
- `--board` sizes the grid; the log uses `contain:size` so it only takes the height beside the board that the panel leaves.
- Full-screen icon host is `#turnCard`; no `data-fit` on the fullscreen script.
