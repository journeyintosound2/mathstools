# Crosswise — maths crosswords (built 2026-09-28)

`games/crosswise.html`, homepage Puzzles group. No Firebase.

Research options considered: equation crossword (cross-math), cross-number (clue style), Kakuro, number fill-in, vocabulary crossword. Jeff chose **both** equation crossword and cross-number, as two modes.

- **Equation crossword:** crossing 5-cell equations; missing numbers (and at Extra Spicy missing signs). Unique, guess-free by construction (one-unknown-at-a-time check). Levels: Sweet + − to 20 (number bank), Mild + − × tables to 10 (bank), Medium all four to 12, Spicy negatives, Extra Spicy negatives + missing signs. Live green/red = per equation.
- **Cross-number:** digit crossword 5×5–7×7; clues from specs — sums/differences (Sweet), all four ops + first facts (Mild), squares/cubes/primes/multiples/digit sums (Medium), percentages/powers/references to other answers (Spicy), algebra/LCM/HCF/√ (Extra). Uniqueness enforced by a solver; fact clues swapped for calculations while ambiguous.
- Check marks wrong boxes (equations) or ✓/✗ per answer (cross-number); "Show the answer" ends a puzzle. Best times per level.
- Phone: sticky keypad, sticky clue bar; desktop: keypad in side column.
- Possible next: printable worksheet creator, race mode, daily puzzle.
