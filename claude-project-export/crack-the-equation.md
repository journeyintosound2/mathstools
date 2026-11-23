# Crack the Equation (built 2026-09-27)

Original equation-guessing puzzle (Nerdle-style idea, renamed and rebuilt in MMT styling) at `games/crack-the-equation.html`. Puzzles group on the homepage.

- Modes: Today's equations (date-seeded, one per level, same for the whole class), Practice, Race Mode.
- Levels: Sweet 6 tiles (+ −), Mild 7 (one op), Medium 8 (1–2 ops), Spicy 8 (×/÷ mixed with +/−, order of operations changes the answer), Extra Spicy 10 (2–3 ops).
- Key improvement: an untrue guess shows its order-of-operations working (e.g. 4 + 5 × 6 → 4 + 30 → 34) and flags the left-to-right trap; costs no row.
- Settings: explain untrue guesses, hard mode, colour-blind colours, timer. Stats + share (colours only).
- Phone layout: one-row icon header, sticky full-width keypad, tile type sized from measured width; desktop board capped by height so board + keypad fit 1024×768 upward.
- Race: `equationRaceRooms/{CODE}` + `players/{uid}` on mmt-firebase-games. Host writes room (seed, never the equation); each player writes own doc (colours only). Up to 30 players, class view option, fastest or fewest-guesses. NEEDS the new block in `firestore.games.rules` published + TTL on `expireAt` for `equationRaceRooms` and `players`.
- Homepage card + CLAUDE.md block applied by `apply_crack_the_equation.py` (idempotent).
- Verified: engine 77k checks, 144 UI checks (incl. 320/360/390 phones), 35 race checks with stubbed Firestore.
