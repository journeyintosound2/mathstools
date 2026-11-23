# The Nasty Game

`games/nasty-game.html` — a place value dice game. Built 2026-09-21. Homepage card in **Games related to mathematics**; listed under **MA3-RN-01** in `resources/toolLinks.js`.

## How it plays (rules as of 2026-09-22)
Roll the die, then either:
- **Keep it:** write it in an empty square on your own board, or
- **Pass it** to another player. They **have to take it** and choose which empty square on their own board it goes in. Play then carries on from the player who passed.

You can pass on **any** roll, including your first roll of a round. Nobody writes on another person's board. A player whose board is full can only pass. The round ends when every square is full, and each board's number is added to that player's total. Passed digits show in red on the board, and the "nastiest player" award goes to whoever passed the most digits.

History:
- 2026-09-21: the first build let players write straight onto an opponent's board. Jeff changed that the same day: the nasty move is making someone else take a digit you don't want.
- 2026-09-22: the "first go of each round must be kept" rule from the original written rules was removed. Jeff wants the keep-or-pass choice from the very first roll.

## Teacher decisions (2026-09-21)
- Die: 0–9 or 1–6, chosen in the game settings.
- 3–6 squares, with 0–2 of them after the decimal point.
- Who wins: largest total, smallest total, or closest to the average (the mean of everyone's totals).
- For big groups: online play splits the class into tables of 2–4, plus a class leaderboard.

## Modes
- **Play the computer:** 1–5 computer players at four levels (Sweet, Mild, Medium, Spicy). Mild never passes unless its board is full. Medium and Spicy pass when it hurts the leader, and a computer that is passed a digit puts it where it does the least damage. In this mode the page talks to the human player as "you" ("You rolled 8… your board").
- **Play on one screen:** 2–30 players, with optional computer seats. This mode was called "Pass and play" until 2026-09-21; it was renamed because "pass" is now a move in the game.
- **Online as a class:** the host gets a 5-character room code, deals the tables, and sees a live leaderboard and every table. The host can also play. If a player stops responding, anyone at their table can let the computer take their turn, or take a digit they were passed.

## Firebase
The online mode stores rooms at `nastyGameRooms/{CODE}` on `mmt-firebase-games`, with `members` and `tables` subcollections. **It needs the new `nastyGameRooms` block in `firestore.games.rules` published in the console.** Neither rule change affected the Firestore rules. Also add TTL policies on `expireAt` for the three collection groups. The computer and one-screen modes never touch Firebase.

## Possible next steps
- Expanded form and words at scoring (offered, not chosen).
- Arabic and Farsi (EN/AR/FA) layer.
- A worksheet creator (record sheets, plus "where should the 7 go?" reasoning questions).
