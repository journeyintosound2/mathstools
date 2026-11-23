# Kids Chess Adventure (built 2026-09-30)

`games/chess-kids.html` — reached from a new first card on the Chess menu. Designed for ~8–10-year-olds; every instruction is read aloud.

## Design decisions (Jeff, 2026-09-30)
- Age target 8–10: short sentences, voice on by default with 🔊 replay.
- Bots 1–8 are mini-games with only the pieces learned so far; 9–20 are full chess.
- Lives as a "Kids" card on the chess menu; grown-up levels are NOT locked. Beating all 20 opens the Champion's Castle → "Challenge the grown-up bots" (chess.html?level=sweet).
- Signed-in wins save as achievements and show in teacher results.

## Structure
Five worlds, 34 nodes unlocked in order:
- Pawn Beach: Pawn lesson, Penny the Penguin, Toby the Turtle (pawn races)
- Piece Park: Rook, Bishop, Queen, Knight lessons, each followed by a bot using that piece (Rocky, Bonnie, Queenie, Kip)
- Castle Hill: King, Check, Checkmate, Special Moves lessons; Frankie the Frog (kings + rooks), Ollie the Otter (no queens)
- Tricky Forest: Piece Points, Free Pieces, Great Starts lessons; bots 9–14 (full chess)
- Dragon Mountain: Forks, Checkmate Challenge; bots 15–20 up to Drake the Dragon

## Kid aids
Unlimited Oops, Hint, Helper (danger warnings, pawn-about-to-promote warning, stalemate guard), stars 1–3 by how much help was used.

## Saving
Local profiles on the device; optional student-code sign-in writes one achievement per bot win and restores progress on any device (no rules change). Full notes in CLAUDE.md.

## Possible next steps
- Translate to AR/FA like the grown-up game (currently English only)
- A teacher view summarising which bots each student has beaten
- More puzzle lessons (pins, skewers, endgames: K+Q v K)
