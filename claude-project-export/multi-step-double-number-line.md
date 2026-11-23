# Multi-Step Equations on the Double Number Line

Built 2026-11-17. `interactive-tools/stage-4/algebra/multi-step-double-numberline/index.html` (single self-contained file, no Firebase). Listed under MA4-EQU-C-01, MA5-EQU-C-01 and MA5-ALG-C-01 (distributive). localStorage `mmt.multiStepDNL.v1`; test surface `window.__MS__`.

## The idea
- Starts from the finished equation, not from building the expression (Jeff's brief). An equation is ONE POINT: the left side on the top line, the right side on the bottom line. 3x + 4 = 13 opens as one tick with 3x + 4 above and 13 below.
- Solving = the same move on both lines (purple). After every move the line RESETS: it pans so the new, simpler equation is one point in the centre and the rest fades. Each stage gets its own scale, so the board never crowds.
- Pronumerals on both sides: the bottom label is an expression too. Take the smaller x-term from both sides; that hop is dashed because its length is not known yet. 10 − 2x = 4 is handled the same way (add 2x to both sides).
- Expanding brackets and collecting like terms are NOT moves: the point stays put, the old way of writing that side shrinks into a small grey note beside it with a grey "expand" / "collect" pill. Clearing a fraction IS a move (× both sides, measured from 0).
- Check step substitutes into the first equation: both sides give the same number, so they share a point.

## Negative answers: x is pictured positive, then the line turns around (Jeff, 2026-11-17)
- Until there is evidence, x is pictured POSITIVE. An x-term jump goes the way it would if x were positive (taking away 2x goes left) — before this, the jump read the hidden answer and went right when x was negative, which only made sense if you already knew the answer. A × / ÷ move with no number on the line is measured as if positive.
- The evidence is a negative number at a × or ÷ move (6x = −12, x/4 = −5). Two steps come before the move, as in the One-Step tool: **Measure from 0** — the point drawn to the right of 0 as assumed, the number in red ("Can −12 really be to the right of 0?") — then **Turn the line around**, a real half-turn of the board that mirrors every point across 0. The move is then made from the mirrored picture.
- When x is negative and an x-term jump came earlier, the turn's tip (or the solution's, when there was no turn) looks back: "when we took 2x from both sides, the point really moved to the right, not the left."

## Build it first (Daniela's feedback, 2026-11-17)
Settings › Steps › **Equation first** (key E, default ON). OFF: a two-step equation (one side written as operations on x, the other a number: 3x + 4, x/4 + 3, 3(x + 2), (x − 1)/4) is first BUILT from x before it is solved — x on its own, then each operation in turn as an orange hop or arrow with its pill (x → 3x → 3x + 4), on the line that side lives on. The built expression then pans into "the equation is one point" and the value appears underneath; solving undoes it last thing first. Hints: "What has been done to x so far?" → "What was the last thing done to x?". Equations with x on both sides, and 10 − 2x, always start from the equation. Mirrors the one-step tool's explore mode (its Equation first setting off).
- **Smoother (Daniela: "not as smooth as the one-step… blurs the order needed when solving"):** each build step plays in two parts — the line slides so the last expression is the start, then the new expression is built: + / − counted along one unit jump at a time (up to 12), × groups laid end to end one at a time, ÷ parts cut one at a time. While building, the top card writes the build out in order (x ×3→ 3x +5→ 3x + 5), so the order to undo it in stays on screen; at "the equation" it becomes the equation.

## Equation types (Jeff, same day)
Chosen with a prominent "Equation type" button on the board (family chip, name, example), which opens a menu of example cards in two families:
- **Two-step:** multiply then add or subtract (3x + 4 = 13) · divide then add or subtract (x/4 + 3 = 5) · brackets (3(x + 2) = 15) · a sum then divide ((x − 1)/4 = 3) · taking the pronumeral away (10 − 2x = 4) · mixed.
- **Pronumerals on both sides:** simple (5x + 2 = 3x + 10) · involving brackets (a(x + b) = cx + d, a(x + b) = c(x + d), a(x + b) + e = cx + d) · involving one fraction ((ax + b)/c = dx + e, x/c + b = dx + e) · harder (a(x + b) − c(x + d) = ex + f, (x + a)/b = (x + c)/d, b − a(x + c) = dx + e, x/a + b = x/c + d, a(x + b) = c(x + d) + e) · mixed.
- Order of work for the harder ones (as NSW resources teach it): clear fractions by multiplying both sides by the LCD → expand → collect like terms → take the smaller pronumeral term from both sides → two-step.
- Keys: T opens the menu, 1–6 choose within the current family, B swaps family (back to the type last used there). Type your own reads all of these, e.g. 5(x + 2) − 2(x − 1) = x + 20, (x + 6)/4 = (x + 3)/3, 3(x + 2) + 4 = 19.

## Above the board
- The ORIGINAL equation sits in a subtle white card at the top, so it reads as the question (while building first, that card writes the build out instead).
- Under it, ONE green card shows only the current line of working (the move as small grey pills, then the equation). It is a window onto the whole working: Next scrolls up to the next line, Back scrolls down. When the current line IS the first equation (the start, and the check), the green card tucks up under the original and the original's card turns green instead.

## Working panel
- Icon button between ↺ and the side-panel button (key V, saved). On: the side panel closes and a "Working" column opens. The two panels are never open together.
- A copy of the original equation flies from the board into the panel, then the lines are written in; new lines slide down into place and back up on Back. A green box sits behind the line the number line is showing.
- Its footer has a "Show controls" toggle (folded by default, remembered) that opens a New question button and the keyboard-shortcut line (Daniela's feedback: with the side panel closed she couldn't find how to get a new equation). Same in the one-step tool.

## Steps
[`b0` … `bN` when building first; each forward build step plays `c{i}` (slide) then `b{i}`] → `s` → for each real move: [`u{i}` measure from 0, `f{i}` turn the line around — only before a × / ÷ move with a negative number] `t{i}` (optional, top line only), `m{i}` (move on both lines), `r{i}` (reset) — for a rewrite (expand / collect): one step `w{i}` → `check`. Current line: `hiRow()` = stage (build steps → 0), check → 0.

## Options
Panel: solutions whole / can be non-whole (W), negative solutions none / some / always (N). Settings: division as a fraction or ÷; non-whole numbers as fractions, mixed numbers or decimals; write it another way; other letters; equation first (E); top line first; check; written working (both sides or just the new equation); show moves; show units and parts; name the lines.

## Engine / code notes
- Side = `num` | `ops` (ordered operations on x, two-step) | `lin` (mx + k) | `ex` (terms: x, number, c(mx + k), top/d) for the harder both-sides types. `exSolve` does clear fractions → expand → collect, then hands the plain equation to the original `solve()`. Values are exact fractions throughout.
- Generators (`genBoth`) build each form from its answer and work out the last constant, so every equation is true; forms needing a non-whole constant are thrown away.
- `mix()` tweens keyed scenes; `keyT/keyB` keep an unchanged side's key across a rewrite. Build mode: `buildSide(q)`, `builtP(sd, i)`, `buildScene(i, els, pre)`, `buildChainHTML()`; the last built expression uses `p0` / `keyT(0)` so it pans into `s`. Negatives: `needsTurn(q, i)`, `turnScene(i, turned)` (from `moveScene` with `S.forceSgn`), flip drawn in `frame()`, `xtermLookBack()`. Multi-part animations: `S.anim.legs`.
- Board: `#bOrig` + `#stepWin` window; Panel: `workHTML()` in `#wsBody`, `#curHi` highlight, `.wsFoot` footer.

## Worksheet creator (built 2026-11-17)
`worksheet-creators/stage-4/algebra/multi-step-double-numberline.html`, single file on the one-step creator's frame (bands, level tick-chips with a ladder, lettered sections with counts, measured A4 packing, "Your turn", answer key). Linked from the tool's Tools menu, toolLinks "Worksheet maker" rows under MA4-EQU-C-01, MA5-EQU-C-01 and MA5-ALG-C-01, toolFamilies, homepage mini card. Test surface `window.__WS__`.
- **The tool's engine is copied verbatim** into `const ENG` — change the tool's engine → re-copy it.
- **Equations to use:** the nine kinds as chips in two families (Two-step ×5, Pronumerals on both sides ×4) + quick sets (all two-step / all both sides / everything). Default: all five two-step kinds. Each section deals the ticked kinds from a shuffled deck.
- **Levels (numbers):** Sweet whole numbers ≤ 20, x ≤ 10, nothing rewritten · Mild ≤ 40, x ≤ 15 · Medium every other answer negative · Spicy negatives and fraction answers. "Write some another way" and other letters from Mild.
- **Sections, picture fading:** A first move printed on a double number line (pills dashed, new value boxed; a × / ÷ by more than 8 is skipped) · B working = under =, a box for the move under each side (or "moves given") · C draw the first move (empty line) · D solve (+ substitution check) · E spot the mistake (move one way/one side only, x-term on one side, half-expanded bracket, sign lost on a negative bracket, fraction cleared from one term; key names the first wrong line, the right line and the answer) · F think of a number (sentence built from the equation) · G use it (taxi, gym, ribbon, tickets + drink, lollies, candle, savings, phone plans, marbles; "Let v be the number of visits") · H make your own (target x, per family ticked) · I fluency (off).
- Worked example: 3x + 4 = 19 (or 2x + 5 = x + 9 when no two-step kind is ticked) — two moves on the line beside the working and a check. A page that a section continues past gets a "Working space" box instead of Your turn.
- Note: section A's printed x-term jumps still follow the actual value (the worksheet's engine copy predates the "x pictured positive" rule); Medium/Spicy are where negatives appear.
- Verified: 3,888 generated questions (every solution stage true, level sign/fraction rules, mistakes false only from the named line, 0 failures); 24 random configurations × 3 spacings with no card past a page or wider than its card, key mirrors the paper, no answers on student pages; PDF pages = preview.

## Student quizzes (built 2026-11-17) — five pages, one engine
`online-quizzes/stage-4/algebra/multi-step-equations/`: `two-step.html` (3x + 4 = 19, x/4 + 3 = 5, 10 − 2x = 4) · `two-step-grouping.html` (3(x + 2) = 15, (x − 1)/4 = 3) · `pronumerals-both-sides.html` (5x + 2 = 3x + 10, 3(x + 2) = x + 14) · `fractions-harder.html` ((x + 7)/2 = x + 2, two fractions, two brackets) · `mixed.html` (all nine kinds). Thin shells set `window.MSQ`; engine `msq/quiz.js` + `msq/quiz.css` (bump both `?v=`). Each page is its own registry entry, so a teacher sets exactly the one their class is up to (Jeff: a series, not one quiz). Test surface `window.__MSQ__`.
- **The tool's engine and board are copied** (`const MS`), with one hook: `S.hide` shows the new number as "?" until the student types it. The copy predates build-first and the negative-turn changes; Sweet (the only level that draws the line) has no negatives, so it is unaffected.
- **Levels are the same on every page — how much of the tool the student keeps:**
  - **Sweet: drive the double number line.** Choose each move from four pills (the right one, doing it again, undoing in the wrong order, another operation — each wrong one says why); the move plays on both lines (the tool's own scenes), then type the new number where the "?" is. Expanding and collecting are a press, unmarked. The working builds up = under = on the card.
  - **Mild: write the working.** A move box under the left side (mirrored on the right) and both sides of each new equation typed; any equivalent linear form is accepted, unsimplified or bracketed is a free nudge.
  - **Medium:** answer only, every second answer negative; which move first; check by substituting; spot the mistake; think of a number.
  - **Spicy:** negative and fraction answers (MathLive fraction box, plain box fallback), spot the mistake, worded problems.
- Marking: a question scores only if every part is right first time; Next on an unfinished question = wrong. types[] object shape (`msq-<kind>`, `msq-eq-<type>`, negatives, fractions). No typed answer saved.
- **Trilingual EN / ع / فا** (Counting Strategies convention). Think-of-a-number sentences are built per language from the equation's structure; the worded problems carry Arabic and Farsi. Want a fluent proofread.
- **Stage 5 placement:** MA5-EQU-C-01 lists the tool, worksheet and the Both sides / Fractions / Mixed quizzes; MA5-ALG-C-01 (distributive law) lists the tool and worksheet. MA4-EQU-C-01 lists Two-step / Grouping / Both sides / Mixed. The quizzes fold into the tool's row on Resources by Stage (toolFamilies).
- Verified: 1,200 generated papers, every page × level played through right (10/10) and with a wrong first attempt on every other question (5/10) in all three languages, parser unit checks, payload, 1366×768 and 390 wide. MathLive not exercised (CDN blocked in testing).

## Not built yet
Possible extensions: equations from formulas (substitution into formulas, the rest of MA5-EQU-C-01's third statement), three-step one-side equations as their own type (the engine already solves 3(x + 2) + 4 = 19 when typed); a build-first step in the Sweet quiz; bring the "x pictured positive" rule into the worksheet's section A pictures.
