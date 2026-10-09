## Offline app (PWA)
- Before every push: run `node tools/build-pwa.mjs` and commit `precache-manifest.js`.
- New pages: run `node tools/build-pwa.mjs --inject` once so they get the PWA tags.

# Mills Maths Tools — Project Brief

> Hand this file to Claude at the start of any chat to get up to speed without
> re-uploading everything. Keep it short, current, high-signal. If a fact here
> stops being true, fix it here first.
>
> ## ⚠️ READ FIRST — `.git/index.lock` (recurring, every session)
>
> **THE CAUSE IS CLAUDE, NOT A CRASHED GIT.** Almost any git command run from the
> desktop-bridge shell (`device_bash`) — **including a plain `git status`** —
> creates `.git/index.lock`, and the bridge shell **cannot delete files**, so the
> lock is left behind. Jeff's very next `git add` / `git commit` in Terminal then
> fails with *"Another git process seems to be running"*. Nothing has crashed and
> nothing is corrupt — it is a stale zero-byte file.
>
> **THE RULE FOR CLAUDE: do not run git from the bridge shell.** Not `status`,
> not `add`, not `commit`, not `diff --stat`. To see what changed, list the files
> or diff them with `python3`/`ls`. Git in this repo is Jeff's Terminal only.
> `git log` is read-only and safe, but there is rarely a reason to need it.
>
> **THE FIX, whenever it happens** — every push command handed to Jeff should
> clear the lock first, so the failure can never happen twice:
>
> ```bash
> cd "/Users/jeffmills/Documents/GitHub/Mills Maths Tools" && \
> rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/main.lock && \
> git add -A && git commit -m "…" && git push
> ```
>
> Do NOT tell Jeff to hunt for a running git process or to re-clone. If Claude
> genuinely needs to clear the lock itself, it must ask for delete permission on
> the repo folder (`device_request_delete_permission`) — the bridge shell's `rm`
> fails with *"Operation not permitted"* until that is granted, and the grant
> only lasts for the current session.
>
> The bridge also has **NO network access**, so `git push` is always Jeff's
> Terminal, never Claude's.
>
> **NEW (2026-08-17): SINGLE-REPO CONSOLIDATION.** The game SOURCE is no longer a
> separate folder — it now lives IN this repo at
> `game-platforms/mills-maths-adventure-source/` (the Vite project), with its
> BUILT/deployed copy in the sibling `game-platforms/mills-maths-adventure/`.
> There is now ONE folder for everything: the local clone at
> `~/Documents/GitHub/Mills Maths Tools/` (GitHub repo **`journeyintosound2/mathstools`**
> — moved from `jeffmills2-rgb` on 2026-10-08; the old URL redirects — deployed by
> **GitHub Pages** on push to `main`, custom domain via `CNAME`; Netlify is retired).
> **Deploy an Adventure change:** edit in
> `game-platforms/mills-maths-adventure-source/` → `npm run build` → copy `dist/.`
> into `../mills-maths-adventure/` (and DELETE the old hashed bundles there —
> each build's `assets/index-*.js`, `index-*.css`, `MathAnswerInput-*.js`) →
> `node tools/build-pwa.mjs` → `git add -A && git commit && git push`.
> §2 "TWO folders", §3 deploy paths and §5's `mathstools-main 2` heading below
> describe the OLD layout — this block supersedes them.
>
> **NEW (2026-09-30, session — being pushed): KIDS CHESS ADVENTURE.**
> `games/chess-kids.html`, reached from a new first card on the Chess menu (no
> homepage card of its own; the chess card's search tags gained "kids"). English
> only, built for ~8–10-year-olds: every instruction is READ ALOUD (Web Speech,
> en-AU voice preferred, 🔊 replay on every bubble, voice/speed in ⚙ Grown-ups).
> Child is always White; the board never turns.
> * **ENGINE IS COPIED VERBATIM from chess.html** (the `chessEngineSrc` script +
>   the `PIECE_SVG` script). Change chess.html's engine → re-copy both blocks.
>   Three harmless engine additions made for this, in BOTH files: `attacked()`
>   returns false for sq < 0 (kingless mini-games), a `quiesce:false` search
>   option (a "greedy" bot that grabs guarded pieces), and `attacked` /
>   `pseudoMoves` exported. Perft still exact. chess.html also gained
>   `?level=sweet|mild|…` (opens Play the Computer on that level) and AR/FA
>   strings for the card.
> * **CURRICULUM** (`KIDS_DATA` script block — pure data): five worlds, 34 nodes,
>   unlock in order: 14 lessons (pawn, rook, bishop, queen, knight, king, check,
>   checkmate, special moves, piece points, free pieces, great starts, forks,
>   checkmate challenge) and 20 animal bots (Penny the Penguin → Drake the
>   Dragon). Lesson stage types: demo, stars (collect ⭐ / capture; a BFS solver
>   resets the stage if it can no longer be finished, and powers "Show me"),
>   puzzle (goals any/mate/castle/promote/ep/uci/develop/safe), choice, info.
>   Coach Hoot 🦉 teaches. Don't use Pip/Fern/Alby (Adventure NPC names).
> * **BOTS 1–8 ARE MINI-GAMES**: 1–2 pawn race, 3–6 pawns + one piece type
>   (kingless: win by reaching the end, capturing everything, or leaving them
>   no move), 7 kings+rooks+pawns, 8 no queens (real rules). 9–20 full chess.
>   All depth 1 with noise + random moves; 1–14 also `quiesce:false`. Drake (20)
>   is still easier than grown-up Sweet — measured by self-play against three
>   "kid" proxy players (harness in session scratch: calib.mjs).
> * **KID AIDS**: unlimited Oops (takeback), 💡 Hint (engine depth 3), 👀 Helper
>   (on by default): own pieces in danger wobble with a red ring, red move dots =
>   unsafe square, black pawns 2 steps from promoting flash, stalemate guard asks
>   before a tie. Stars: 3 = no Oops/Hints, 2 = ≤3, 1 = a win. Friendly reasons
>   for illegal moves ("that would put your king in danger"). Teacher decision
>   2026-09-19 (no hints) applies to grown-up Chess only.
> * **SAVING**: localStorage `mmtKidsChess.v1` — several player profiles per
>   device (name + picture), finished nodes, best stars, a game in progress
>   (resume). Optional ☁️ Sign in with the MMT student code via
>   `/portal/shared/quizClient.js` (dynamic import; offline = local only). Each
>   bot WIN (first, or more stars) → one `achievements` record, tool
>   `kids-chess-adventure`, score 1/1, types `bot:n`,`stars:n`,… (registry entry
>   `kids-chess-adventure`, category "Game"). On sign-in the page reads the
>   student's OWN achievements (`where studentCode == claim` — the live rules
>   allow it) and merges them; local wins the account lacks are uploaded. No
>   rules change. The student code is never stored — only a hash, to match a
>   profile to its account. Grown-up gate (a times-table question) guards
>   unlock-all / reset / remove player.
> * **Verified**: all 14 lessons solved through the UI, every puzzle/star stage
>   checked by harness, all 20 bots reply, win/loss/tie/resign/oops/hint/resume/
>   stalemate guard, cloud restore + upload with stubbed Firebase (code not in
>   storage, other tools/students ignored), offline sign-in message, 1920/1366/
>   1024/768/390 widths with no horizontal scroll.

> **NEW (2026-09-30, session — being pushed): ADDITION BY COMPENSATION.**
> `interactive-tools/stage-3/number/addition-compensation/`, MA3-AR-01. Self-contained,
> no Firebase. Tools ▾ is ONE row: Student Quiz (teacher decision 2026-09-30).
> * **STUDENT QUIZ** `online-quizzes/stage-3/number/addition-compensation.html`, registry
>   `addition-compensation-quiz`, writes `tool: "addition-compensation-student-quiz"`,
>   masteryTopic `addition-compensation`. Same ladder as Constant Difference: Sweet (2-digit,
>   total < 100), Mild (totals 100–199), Medium (3-digit, one number 1–35 below a hundred,
>   the other can give without breaking a ten) keep the WHOLE tool + ←10 ←1 1→ 10→ buttons;
>   Spicy/Extra Spicy = Mild/Medium numbers, no tiles. **Full hundreds bundle into FLATS**
>   (smaller, stacked 2 high, 3 high past two hundreds, at the pile's outer end) and stay
>   put — so a side never needs more than 9 rods + a loose column and the board scale is
>   fixed per question. types[]: `add:s/t`, `usedten:n/t`, `level:`, `model:`. 42k checks.
> * Each addend is a pile of DOM tiles in COLUMNS OF TEN (rods). Each pile's unfinished
>   ten stands NEXT TO THE MIDDLE, so the two face each other; empty slots in it are
>   dashed ("gap to the next ten", toggle). A moved tile KEEPS ITS COLOUR.
> * Tap to select, drag a tile (or the selected group) across, or box-select on one
>   side. Removing a tile swap-fills its slot with the pile's LAST tile (one tile slides,
>   no ripple). ←/→ keys and buttons move one tile, sending a visiting tile home first.
> * Live statement on top (+ sits over the divider), −n/+n chips, original question in
>   a pill underneath; total `?` until "Show the total". Scale fixed per question so
>   either pile could hold every tile. Numbers: one ends in 9 / 8–9 / 7–9, the other has
>   gap..6 ones; total under 100 / 100+ / either; type your own.
> * Verified: 63k Playwright checks (generation, drag, group, box select, keys, home,
>   conservation, no overlap, answer hidden, six viewports).

> **NEW (2026-09-30, session — being pushed): CONSTANT DIFFERENCE — TOOL + STUDENT QUIZ.**
> Teaching tool `interactive-tools/stage-3/number/constant-difference/` and quiz
> `online-quizzes/stage-3/number/constant-difference.html`, both under **MA3-AR-01**.
> * **TOOL:** one number line, mirrored: slid statement · orange band (drag) · LINE ·
>   blue band (fixed, the question) · question. The band snaps to whole numbers and
>   never changes length; purple +n hops at BOTH ends; the number taken away goes
>   green when released on a ten. Difference is `?` until "Show the difference".
>   No explanation text on the board — the teacher talks. Tools ▾ is ONE row: Student
>   Quiz (teacher decision 2026-09-30).
> * **QUIZ:** registered as `constant-difference-quiz`, writing
>   `tool: "constant-difference-student-quiz"`, masteryTopic `constant-difference`.
>   Five levels, 10 questions: Sweet (2-digit, take away …7/8/9), Mild (from up to
>   200), Medium (3-digit, take away 1–35 below a hundred) all keep the WHOLE tool plus
>   −10/−1/+1/+10 buttons; Spicy = Mild's numbers, Extra Spicy = Medium's, no model.
>   Every question regroups the long way; sliding up never changes the first number's
>   leading digits. Answer never on screen before marking; first attempt only scores.
>   types[]: `subtract:s/t`, `usedten:n/t` (model levels), `level:`, `model:on|off`.
>   Early submit is `import()`ed and `register()`ed; the button sits in `#mmtSubmitSlot`
>   in the nav row. No typed answer in the payload.
> * **Verified:** tool 45k checks, quiz 52.7k (9000 generated questions against the
>   rules, 250 papers, every level played through with the answer never on screen
>   early, first-attempt scoring, full payload, early-submit button, six viewports).

> **NEW (2026-09-28, session — being pushed): CROSSWISE — MATHS CROSSWORDS.**
> `games/crosswise.html`, Puzzles group. One self-contained file on the `.mmtTopbar`
> shell + MMT PHONE LAYOUT block, no Firebase, English only. Two modes, five levels
> each (Sweet → Extra Spicy); progress per mode in `mmtCrosswiseSave.v1`, best
> times in `mmtCrosswiseStats.v1`.
> * **ENGINE IS DOM-FREE** (`<script id="cwEngine">`, `var CW`).
> * **EQUATION CROSSWORD** (`CW.genEquation`, config `CW.EQ`): every equation is
>   five cells (number, sign, number, =, answer). NUMBERS SIT ON CELLS WHOSE ROW AND
>   COLUMN ARE BOTH EVEN, signs on odd offsets — so equations can only cross on a
>   number, a sign never touches another equation, and two equations on one line
>   are kept 6+ apart. Numbers are hidden one at a time and each kept hidden ONLY
>   if the grid can still be finished one-unknown-at-a-time (`eqSolvable`), which
>   makes the answer unique and never needs a guess. Extra Spicy hides SIGNS too —
>   chosen BEFORE the numbers are thinned, or no sign can ever be hidden — and a
>   sign is only hidden where exactly one of + − × ÷ fits. No zeros anywhere
>   (0 × ? has no single answer). Spicy+ use negatives. Sweet/Mild open with a
>   Number bank (the missing numbers as tiles). Each = goes green/red once its
>   equation is filled (setting).
> * **CROSS-NUMBER** (`CW.genCrossNumber`, config `CW.CN`): 5×5 to 7×7 grids with
>   180° symmetric blacks, answers 2–4 digits, no leading zero, no repeated answer.
>   Filled first, then clues written FROM SPECS (kind + numbers): sums, products,
>   powers, √, percentages, LCM/HCF, algebra (evaluate / solve for x), references
>   to other answers (never to another reference, so no loops) and number facts
>   ("a prime number", "a multiple of 7", "its digits add up to 15") that only a
>   crossing answer can pin down. `countSolutions` checks uniqueness; while two
>   fillings fit, a fact clue is swapped for a calculation. A clue never prints its
>   own answer (10% of 8080 was dropped for that reason).
> * **LAYOUT:** board cells sized from MEASURED room; above 1080px the keypad moves
>   into the side column so the board gets the height; phones get a sticky keypad
>   and (cross-number) a sticky current-clue bar. `.game-card` and `.game-area`
>   columns are `minmax(0,1fr)` — with plain `1fr` the board's own width propped
>   the column past a 320px screen.
> * **Verified:** engine harness (150k checks — every equation re-derived, an
>   independent one-unknown solver recovering every hidden number and sign, every
>   clue re-evaluated from its spec, facts re-tested, an independent brute-force
>   solver confirming exactly one filling for 300 cross-numbers) and 145 UI checks
>   (solve by keyboard, number bank, Check in both modes, resume, phones
>   320/375/390 and 1024/1280/1920 with no sideways scroll and no text spilling a
>   cell). Harnesses in the session scratch.
> * Not built: printable worksheet version, race mode.
>
> **NEW (2026-09-27, session — being pushed): CRACK THE EQUATION.**
> `games/crack-the-equation.html`, an original equation-guessing puzzle (the
> Nerdle/Wordle idea, renamed and rebuilt in MMT colours — nothing copied).
> Card in the **Puzzles** group (5 -> 6; Games stat tile 19 -> 20). One
> self-contained file on the `.mmtTopbar` shell with the MMT PHONE LAYOUT
> block. English only. Three modes: **Today's equations** (one per level,
> seeded from the local date so a whole class gets the same five), **Practice**
> and **Race Mode**.
> * **ENGINE IS DOM-FREE** (`<script id="ceEngine">`, `var CE`; the harness
>   `require`s it). The left side is evaluated with EXACT fractions, so any true
>   equation is accepted; answers are BUILT, not searched for — a ÷ always picks
>   a divisor of its own term, so every step is whole. Clues are two-pass (greens
>   first, then ambers from what is left), so repeats are honest.
> * **LEVELS:** Sweet 6 tiles + − · Mild 7 tiles, one operation · Medium 8 tiles,
>   one or two · Spicy 8 tiles, always ×/÷ mixed with +/− AND left-to-right would
>   give a different answer · Extra Spicy 10 tiles, two or three. Below Extra no
>   running total dips under zero; no ×1, ÷1 or lone 0 operands.
> * **THE IMPROVEMENT OVER THE ORIGINAL: AN UNTRUE GUESS IS EXPLAINED, NOT JUST
>   REFUSED.** `4+5*6=54` shows `4 + 5 × 6 → 4 + 30 → 34` and, when working left
>   to right would have given their number, says that is the trap. It costs no
>   row. Settings: explain (on), hard mode, colour-blind (orange/blue), timer.
>   No hint button (consistent with Sudoku). The result card shows the working.
> * **RACE MODE is on `mmt-firebase-games` at `equationRaceRooms/{CODE}` with a
>   `players/{uid}` subcollection — NEEDS A RULES PUBLISH** (the new block in
>   `firestore.games.rules`). Host writes the room; each player writes only their
>   own doc, so 30 guessing at once never contend. The room holds a SEED, never
>   the equation; a player doc holds the COLOURS of each guess, never the guess.
>   Host can play or run a class view, picks fastest / fewest guesses, starts,
>   ends, removes players, runs the next round, closes the room. Joining is
>   refused mid-round. Countdown runs from when each client SAW the start, so
>   clock skew costs nobody time. TTL on `expireAt` (3 days).
> * **Gotchas found in testing:** closing a modal must blur anything focused
>   inside it (a hidden switch kept the keyboard); tile type is sized from the
>   MEASURED tile width, and on a projector the board is also capped by HEIGHT
>   so board + keypad fit 1366x768 / 1280x720 / 1024x768.
> * **Verified:** engine harness (77k checks: 1500 answers per level re-derived
>   with an independent evaluator, every ÷ exact, Spicy never left-to-right safe,
>   scoring vs a reference, validation messages), 144 UI checks (daily, restore,
>   stats, hard mode, colour-blind, phones 320/360/390 and 1024–1920 with no
>   sideways scroll and the keypad on screen) and 35 race checks with a stubbed
>   Firestore enforcing the rules' key lists (join, late join refused, colours
>   only, auto finish, next round, kick, close, class view). Harnesses in the
>   session scratch.
>
> **NEW (2026-09-26, session — being pushed): REVISION GENERATOR — TOPIC PICKER REDESIGN.**
> The wizard's "Choose topics" step (and the per-stage modal) now use one shared picker,
> `renderTopicPicker(onlyStageId)` in `assessment/exam-builder/app.js`:
> - stage TABS (S1–S5 with Years, a badge = topics chosen; last tab remembered in
>   localStorage `mmt-picker-stage`) + a SEARCH box that searches every stage
>   (topic names, parts, notes AND question-type labels; word-start match, DOM-only
>   filtering in `applyPickerSearch()` — no re-render per keystroke);
> - topics grouped by STRAND (Number & Algebra / Measurement & Space / Statistics &
>   Probability via `strandOf()`); A/B/C parts collapse onto ONE card as chips
>   (`stageFamilies()`; `FAMILY_NAME_OVERRIDES` for odd names);
> - ONE TAP adds a part with every question type + `DEFAULT_TOPIC_COUNTS`
>   (`toggle-topic`); tap again removes. The gear on a selected chip (or the
>   "question types ›" link in the cart) opens the existing `open-topic-config` modal;
> - right-hand "Your selection" cart: totals, per-topic stage pill, −/+ question
>   stepper (`topic-count-step`, 1–80), remove ×, Clear all (`picker-clear-all`).
>   Stacks to one column under 900px.
> - Scroll position is kept across re-renders (`afterControlsRender()`).
> CSS: TOPIC PICKER block at the end of `styles/screen.css` (selectors are
> `.topic-picker .x` to beat `.builder-modal button`). The old `renderTopicCard` is
> unused by the wizard. `tools/picker.mjs` rewritten for the new DOM (all 5 stages +
> tabs/stepper/search checks) — needs jsdom.

> **NEW (2026-09-26, session — being pushed): REVISION GENERATOR — STAGE 1
> ADDED (Years 1–2), PICTURE-FIRST.** `assessment/exam-builder/`. 20 banks in
> `question-banks/stage-1/`, registered in `STAGE1_TOPICS` (app.js, keys
> `stage1<Name>`, default count 8), listed FIRST in the picker via
> `{ id: "stage1", selectionKey: "selectedStage1Topics" }` — 5 stages now.
> Sequence (A then B): Numbers (to 120 / to 1000), Adding and Taking Away,
> Equal Groups, Halves–Quarters(–Eighths), Position and Length, 2D Shapes and
> Area, 3D Objects and Capacity, Mass and Time, Data, Chance — 184 types
> covering all 16 MA1 outcomes (fractions = MA1-GM-03; there is no Stage 1
> RQF outcome). Read `assessment/exam-builder/docs/stage-1-syllabus-reference.md`.
> Reading-load rules ENFORCED by `node tools/stage1.mjs`: prompts <= 25 words,
> no word > 13 letters, short answers; harness also re-derives answers from
> diagram configs. Helpers: `question-banks/_shared/stage1-helpers.js`
> (`makeStage1`, `pic`, `tf`, `numOptions`). New manipulatives types:
> `objects` (12 picture icons; `crossed`, `circle`, `items`, `labels`,
> `rowLabels`, "" = empty slot), `ten-frame`, `dice`, `hundred-chart`
> (window + blanks/shade), `unit-length` (cube/paperclip/hand/rod, per row),
> `calendar`. probability chance scale gets side padding with `wordList`.
> Also fixed two rare Stage 2 place-value-b edge cases (no-distractor MC).
>
> **NEW (2026-09-25, session — being pushed): REVISION GENERATOR — STAGE 2
> ADDED (Years 3–4), VISUAL-FIRST.** `assessment/exam-builder/`. 20 banks in
> `question-banks/stage-2/`, registered in `STAGE2_TOPICS` (app.js, keys
> `stage2<Name>`, default count 8) and listed FIRST in the picker via
> `{ id: "stage2", selectionKey: "selectedStage2Topics" }`. Teaching order:
> Part A of every focus area, then Part B (Place Value, Addition and
> Subtraction, Multiplication and Division, Fractions, Position/Length/Angles,
> 2D Shapes and Area, 3D Objects (+ Capacity/Volume in B), Mass and Time, Data,
> Chance) — 232 types covering all 20 Stage 2 outcomes. Read
> `assessment/exam-builder/docs/stage-2-syllabus-reference.md` first. Design
> rules: every type draws a model; prompts ≤ 45 words; MC distractors where
> sensible. Helpers: `question-banks/_shared/stage2-helpers.js`
> (`makeStage2(topic, outcome)` tags `stage2` + outcome). NEW engine
> `engines/manipulatives/manipulatives-engine.js` (`MMT_MANIPULATIVES_ENGINE`,
> base text units 13): base-ten blocks, cards, PV charts, number lines, grids,
> groups, arrays, shapes, compass, angle cards (`tester`, `plain`), tally
> charts (`rows`), fraction walls/shapes, balance, `column-sum` (written
> method with trade boxes), `ruler` (cm/mm, object need not start at 0).
> Backwards-compatible extensions: grid-engine `north`, `path`, `countable`,
> `shapes[].labelAt`; measure-engine clock numbers haloed over hands, scale
> `labelSize`; probability chance scale `numbers: false`, `wordList`,
> `wordSize`. Stage 3 now EXPORTS `makeMove` (two-d-space-area/extra-types.js)
> and `NETS`, `sq` (three-d-space-volume) for reuse. Harness
> `node tools/stage2.mjs` re-derives answers from the diagram configs;
> `tools/stages.mjs` now expects 4 stages. A/B split is paraphrased — check
> against the official NESA Stage 2 content document when available.
>
> **NEW (2026-09-25, session — being pushed): REVISION GENERATOR — STAGE 5
> COMPLETE.** `assessment/exam-builder/`. All 41 Stage 5 outcomes now have a
> bank in `question-banks/stage-5/`, registered in `STAGE5_TOPICS` (app.js) in
> syllabus order — 528 Stage 5 question types. Read
> `assessment/exam-builder/docs/stage-5-syllabus-reference.md` first (coverage
> table with type counts, content per focus area, engine notes). 29 NEW banks:
> Algebraic Techniques B/C, Indices A/B/C (C = surds + fractional indices),
> Equations B/C, Linear Relationships A/B/C, Non-linear C, Variation and Rates
> of Change A/B, Polynomials, Logarithms, Functions and Other Graphs, Numbers
> of Any Magnitude, Trigonometry D, Area and Surface Area B, Volume B,
> Geometrical Figures A/B/C, Circle Geometry, Data Analysis A/B/C, Probability
> A/B. Gap-fill `extra-types.js` on Algebraic Techniques A, Trigonometry A,
> Volume A, Introduction to Networks (Networks has only NET-P-01 — no separate
> "networks and paths" outcome). ENGINES: new `engines/plane/plane-engine.js`
> (`MMT_PLANE_ENGINE`) is the ONE number plane for all Stage 5 graphs — curves
> line/quadratic/poly/exp/log/hyperbola/circle/sin/cos/tan, regions, points,
> segments, `polylines`, and `diagramType: "options"` (A–D cards, `columns: 2`
> for a 2×2 grid); geometry `circles` + `localLabels`; solids `measured`
> (pyramid, cone, cylinder, sphere, hemisphere, composites); statistics
> `box-plot` (+ guides when blank) and `scatter`; probability `tree` + `venn`
> (2/3 sets); algebra `area-grid`; markup token `[[sup:…]]`. Shared helpers:
> `question-banks/_shared/algebra-helpers.js` (mono/poly/joinTerms, exact
> rationals `Q`, surds, `fromRoots`). HARNESS: `node tools/stage5.mjs` (every
> bank × type × 60: leak lint + independent re-derivations — polynomial
> remainders, cubic roots, probabilities in [0,1], circle angles, lines
> through points). Gotchas: the renderer trims every viewBox to its ink, so a
> blank "draw here" diagram needs faint guides (box plot) or axes to keep its
> size; the network engine draws at a fixed 720×420 frame (not trimmed), so
> spread its nodes across that frame. Open items: network-engine labels print
> small; algebraic-techniques-a/equations-a/fin-a/trig-b/trig-c generators
> crash if `allowedTypes` is `null` (the app always passes an array).
>
> **NEW (2026-09-25, session — being pushed): REVISION GENERATOR — STAGE 3
> COMPLETE, WITH VISUALS.** `assessment/exam-builder/`. Four new Stage 3 banks
> (`question-banks/stage-3/`): **3D Space and Volume** (20 types — name solids
> from a picture, faces/edges/vertices, nets, which nets fold into a cube,
> skeletal models, top/front/side views of cube stacks, capacity, reading a
> jug, displacement, counting cubes, layers, V = lwh in cm³/m³), **Mass and
> Time** (17 — dial scales, g/kg/t, analogue clocks read and drawn, 12/24-hour,
> durations on a time line, timetables), **Data** (16 — many-to-one column
> graphs, pictograms, dot plots, side-by-side columns, line graphs, two-way
> tables, time lines, misleading media graphs, construct-a-graph on blank
> axes) and **Chance** (12). Registered in `STAGE3_TOPICS` in `app.js`.
> Four new engines: `engines/measure/` (clock, digital, dial scale, jugs, time
> line), `engines/solids/` (3D prisms/pyramids with COMPUTED hidden edges,
> nets, cube stacks + view options), `engines/grid/` (transformations,
> mirror lines, grid MAPS), `engines/bar-model/`. `statistics-engine` gained
> `grouped-column`. Visual gap-fill: each older Stage 3 bank has an
> `extra-types.js` spread into its registry (+28 types: drawn shapes, grid
> transformations, symmetry, composite area, drawn angles, construct an
> angle, grid maps, hundred grids, thermometers, fraction bars, prime/composite
> arrays, bar-model word problems). Fixed "a equilateral triangle".
> `geometrical-figures/index.js` now EXPORTS `buildTriangle`, `quadFigure`,
> `sidesFor` (reused by Stage 3). New harnesses `tools/stage3-three-d.mjs`,
> `stage3-mass-time.mjs`, `stage3-data-chance.mjs`, `stage3-visual-gaps.mjs`
> re-derive answers from the diagrams with independent methods; the older
> Stage 3 harnesses were updated for the new type counts. Gotcha found: the
> renderer trims every diagram to its INK (getBBox), so reserved empty space
> (e.g. room to draw an angle) must be "inked" with invisible text.
>
> **NEW (2026-09-24, session — being pushed): REVISION GENERATOR — STAGE 4
> COMPLETE.** All 16 Stage 4 outcomes now have a topic in
> `assessment/exam-builder/` (313 Stage 4 question types, up from 227). Read
> `assessment/exam-builder/docs/stage-4-syllabus-reference.md` first — it has
> the outcome map, what each topic covers, and the conventions.
> * **Five new banks:** `volume/` (MA4-VOL, 17 types), `geometrical-figures/`
>   (MA4-GEO, 18), `data-visualisation/` (MA4-DAT-C-01, 17), `data-analysis/`
>   (MA4-DAT-C-02, 16), `probability/` (MA4-PRO, 16). Registered in `app.js`
>   `TOPICS` (ids `volume`, `geometricalFigures`, `dataVisualisation`,
>   `dataAnalysis`, `probability`).
> * **Gaps filled in existing banks** via an `extra-types.js` beside each
>   `index.js`, spread into its `TYPE_LIST` / `GENERATORS` (3-line edit):
>   Angles +7 (naming, classifying, complementary/supplementary, reflex,
>   naming parallel-line pairs, "are the lines parallel?", multi-step), FDP +3
>   (recurring decimals with dot notation, quantity as a %, profit and loss),
>   Indices +1 (HCF/LCM by prime factorisation), Pythagoras +1 (identify the
>   hypotenuse / state the theorem).
> * **Three new engines** (added to `index.html` and the renderer registry):
>   `geometry-engine` (figures from named points — ticks, parallel arrows,
>   arcs incl. reflex, right-angle marks), `statistics-engine` (column, bar,
>   histogram/polygon, dot plot, stem-and-leaf incl. back-to-back, line,
>   sector, divided bar, pictogram; `blank` for construct questions),
>   `probability-engine` (spinner, bag of lettered counters, 0–1 scale,
>   cards). `volume-engine` gained `cube-array` and `showArea: false`.
> * **Shared code** for the new banks: `question-banks/_shared/`
>   (`bank-helpers.js`, `figure-helpers.js` — builds polygons FROM their
>   angles so figures match the numbers — and `data-helpers.js`).
> * `utils/multiple-choice.js` honours a bank's `mcDistractors` array (word
>   answers now convert to good MC without printing options on the short
>   answer version).
> * **Harnesses:** `node tools/stage4-{geometry,volume,data,probability,
>   angles,gapfill}.mjs` re-measure every figure / recount every chart; plus
>   `verify.mjs`, `stages.mjs`, `picker.mjs` (jsdom) all pass. Checked in a
>   real browser across all four templates with worked solutions.
> * Not done: AR/FA phrase tables for the five new topics (they use the
>   generic fallback); symmetry and constructions deliberately left out of
>   Geometrical Figures. `tools/stage3-additive.mjs` fails about 1 run in 40
>   on the ORIGINAL code too — a pre-existing flaky check, not this change.
>
> **NEW (2026-09-23, session — being pushed): SHIKAKU + SUDOKU WORKSHEET
> CREATORS.** `worksheet-creators/puzzles/shikaku.html` and
> `worksheet-creators/puzzles/sudoku.html` (a new `puzzles/` folder), with two
> cards under a new **Puzzles** subhead at the end of the homepage Worksheet
> Creator group (pill 28 -> 32, which is the real card count). **The games'
> PLAY is unchanged (teacher request)** — so, unlike Dot Detective and Total
> Trail, the worksheet is a separate page. Each game only gained two ways OUT
> to it (teacher request, same day): a "🖨 Worksheet" topbar button and a
> "Printable worksheet" menu card, both plain `location.href` buttons. They
> carry no `data-i18n` on purpose — a missing key would print the English twice
> in AR/FA. Same shell,
> A4-in-mm pages, zoomed preview, 1 / 2 / 4 / 6 per page as a SIZE control
> (board widths in `LAYOUT`), answer key, name/date, rules box.
> * **THE ENGINES ARE COPIED, NOT IMPORTED.** Sudoku: `SudokuEngine` byte for
>   byte. Shikaku: the generator from `randInt` to `generatePuzzle`, with two
>   edits to the COPY only — a `sweet` 5 × 5 row in `levelConfig`, and
>   `level === 'mild'` widened to include sweet. Fix an engine in the game →
>   re-copy it here.
> * **SHIKAKU PUZZLES ARE PROVED UNIQUE BEFORE PRINTING.** The game's generator
>   does not check uniqueness (fine on screen, where any valid tiling wins, but
>   a printed key must be THE answer). `SK.countSolutions` is an exact-cover
>   search (MRV over clues and empty cells); a non-unique puzzle has its clues
>   re-placed with the game's own `chooseClueCell`, then regenerated. Checked
>   against an independent cell-first solver. Median well under 0.1 s a puzzle.
> * Sudoku key: givens black, found digits green; "Name the thinking each
>   puzzle needs" (off by default, always on the key) lists the techniques the
>   grader used, in the game's own names.
> * Shikaku warns (does not refuse) when squares print under 6 mm (14 × 14 at
>   4 or 6 a page). Sudoku's 6-a-page board is 54 mm so the technique line fits.
> * **Verified** in Playwright: every level × every per-page setting with key,
>   rules and name on (182 checks — no card, board or footer overflowing its A4
>   page, page and puzzle counts, every Sudoku unique + logically solvable with
>   a valid key, every Shikaku unique), print-to-PDF page counts, 390 px phone
>   with no sideways scroll. Harnesses `ui.mjs`, `sk1.mjs` in the session scratch.
>
> **NEW (2026-09-21, session — being pushed): THE NASTY GAME.**
> `games/nasty-game.html`, a place value dice game (after the classic
> classroom game): roll a digit, write it in one empty place value square on
> your OWN board or — the nasty part — on somebody else's. Card in the
> **Games related to mathematics** group (`#games`, 9 -> 10; Games stat tile
> 18 -> 19), `data-stage="Stage 3"`, and a `kind: "Game"` row under
> **MA3-RN-01** in `resources/toolLinks.js`. One self-contained file on the
> `.mmtTopbar` shell with the MMT PHONE LAYOUT block. English only.
> * **THREE MODES, ONE RENDERER.** Play the computer (you + 1–5 CPUs, Sweet /
>   Mild / Medium / Spicy), Pass and play (2–30 on one screen, optional CPU
>   seats), and **Play online as a class** (up to 30). Whatever drives the game
>   hands `render()` an engine state plus `C.canAct()` / `C.mySeat`; the drawing
>   code does not know which mode it is in.
> * **ENGINE IS DOM-FREE** (first `<script>`, `var NG`; the harness `require`s
>   it). **All arithmetic is integers**: a board's value is its digits read as
>   a whole number, i.e. SCALED by 10^decimals, and totals, means and
>   "off by" distances stay integers until display (`fmtScaled`, `fmtRatio`).
>   State is plain JSON because online stores it as one string (Firestore
>   cannot hold the boards, which are arrays of arrays).
> * **THE RULES — KEEP OR PASS (teacher decisions 2026-09-21 and -22).** Roll,
>   then EITHER keep it (write it in an empty square of your OWN board) OR
>   **pass it** to another player, who **must take it** and chooses which of
>   their own empty squares it goes in. Taking is not a turn; play moves on
>   from the roller. Nobody ever writes on another person's board. You may
>   pass on ANY roll — the first build's "first go each round must be kept"
>   rule was removed on 2026-09-22 (`mustOwn()` is kept only as an
>   always-false stub). A full board can only pass. Engine phases:
>   `roll → place → (take) → roll`; `NG.actor(st)` is whoever must act (the
>   taker during `take`), and every UI/online check uses it, never `st.turn`.
>   A passed digit's cell has `by` = the passer, so it shows red. The very
>   first build let players write straight onto an opponent's board — that was
>   replaced the same day. The "Pass and play" mode is now **"Play on one
>   screen"**, because "pass" is a move. Against the computer the human seat is
>   `mySeat` 0, so the page says "You rolled… your board".
> * **PHONE LAYOUT (teacher request 2026-09-22), below 700px:**
>   - **A DOCK fixed to the bottom** holds the status, the die and the Roll
>     button (thumb reach; rolling never means scrolling up). `fitDock()` pads
>     the page by the dock's REAL height so nothing hides under it. A disabled
>     Roll button is hidden on phones, and the goal chip moves out, so the
>     status line gets the room; title and subtitle clamp to two lines, and
>     phones get shorter prompts ("Tap a square to keep it — or 😈 Pass it on").
>   - **The HERO board** — yours, or on a shared phone whoever must act
>     (`heroSeat()`; the TAKER during a pass) — goes first, full width, squares
>     sized from the real width (`phoneCells()`, up to 72px; 38px is the floor
>     for six squares plus a point on a 320px iPhone SE). On a shared phone
>     the page scrolls the new hero into view when it changes hands.
>   - **Every other board is a slim ROW**: name over small squares, no place
>     names, and a 46px-tall "😈 Pass the 3" button on the right.
>   - The setup sheet's Start button is sticky; menu cards are compact; the
>     Remember panel is hidden (How to play has it).
>   - Checked with `phone2.mjs` on iPhone 13 / SE / Pixel 5 / Galaxy S9+
>     emulation: dock on the bottom edge, no sideways scroll, hero squares
>     tappable, pass buttons ≥ 44px, nothing under the dock, the hero following
>     the actor and then the taker; plus the online suite at 390×844.
>   - **Bridge gotcha:** `device_commit_files` twice reported "written" but left
>     the OLD file on disk; the second call worked. After committing, check
>     the size or grep for a new string before telling Jeff to push.
> * **SETTINGS (teacher choices 2026-09-21):** die 0–9 or 1–6; 3–6 squares;
>   0–2 of them after the decimal point (the point is DRAWN between the ones
>   and tenths columns, never typed); rounds 1–8; goal **largest**,
>   **smallest**, or **closest to the average** (winner's total nearest the
>   mean of everyone's; needs 3+ players locally, because with two both are
>   always the same distance from the mean — online the mean is over the
>   WHOLE ROOM, so tables of 2 are fine). Display prefs: place names as words
>   / numbers (1000, 100…) / automatic / off; "say what each digit is worth"
>   (narration "Ben had to take Ava's 2 and put it in the ones = 2" and a hover
>   tip); passed digits in red (each cell stores `by`, the seat that wrote it); fast CPUs.
> * **THE COMPUTER PLAYS FROM AN EXACT DP** (retuned for the pass rule: a pass
>   is scored by assuming the taker puts the digit in their least-bad square;
>   the junk-in-your-top-square planning (`QTAB`) no longer helps and is set to
>   1 = off; Medium's noise is 0.3 of the top place value). `dpTable` values a board's empty
>   squares by the best expected fill over the die's faces (≤ 2^6 states), so a
>   6 goes in the hundreds of an empty four-square board, not the thousands.
>   **Spicy mixes in a chance (`QTAB`) that an opponent dumps junk in your top
>   empty square first**, which makes it fill its own high places promptly —
>   that one change took it from level with Medium to clearly ahead. Utility is
>   own expected final minus a blend of the leader and the field. Self-play
>   (200 four-player games per pair, all three goals): Mild > Sweet, Medium >
>   Mild, Spicy > Medium, Spicy > Mild. It is a dice game, so margins are
>   modest by design.
> * **ONLINE IS TABLES + A LEADERBOARD** (teacher decision 2026-09-21: strict
>   turn-taking with 30 is 29 turns of waiting). The host (teacher) makes a
>   room and gets a 5-character code; players join a lobby; the host picks the
>   settings and a table size (2/3/4) and **deals**: shuffled, split into
>   tables whose sizes differ by at most one (`dealSizes`). Each table plays
>   the real rules; the host's screen is a class leaderboard plus a live mini
>   view of every table. The host can play too ("I'm playing as well"), with
>   a Class view / My table switch.
> * **FIRESTORE: `nastyGameRooms/{CODE}` on `mmt-firebase-games`, with
>   `members/{uid}` and `tables/{tid}` subcollections. THIS NEEDS A RULES
>   PUBLISH** — the new block in `firestore.games.rules` (paste the whole file
>   into the console). Until it is published, online fails with a message
>   naming the rules; the other two modes do not touch Firebase at all
>   (dynamic import, only when "Play online" is opened).
>   - Tables are SEPARATE docs because every move is a transaction; one room
>     doc shared by 30 would thrash. The leaderboard is `scores.<uid>`
>     field-path updates written when a ROUND ends — the rules let any
>     signed-in user change `scores`/`updatedAtMs` and nothing else.
>   - Members and tables carry `hostUid`, so the rules let the host delete 30+
>     docs in one batch with **no `get()` per document** (rules cap get()s
>     per batch). A member is created only while the room is in the lobby, so
>     nobody slips into a started game; a table is written only by its seated
>     players (or the host) and its `uids`/`gen`/`hostUid` cannot change.
>   - Every doc has `expireAt` (+3 days) — add TTL policies on `expireAt` for
>     the `nastyGameRooms`, `members` and `tables` collection groups.
>   - **The rules were NOT run against the emulator** (the emulator jar
>     download is blocked from the session container). They were reviewed by
>     hand against every write the page makes. Worth a quick live check: make
>     a room, join from a second device, play a round, Back to lobby, Close.
> * **SOMEONE WALKS AWAY:** after 45 s idle on a human's turn, anyone at the
>   table sees "Play X's turn for them" — the Mild computer plays ONE turn
>   (it only ever builds that player's own number). A finished round moves on
>   by itself after 15 s if nobody presses Next. Every table write is a
>   transaction that re-checks turn/phase/`seq`, so double presses cannot both
>   land.
> * Local games save to `mmtNastySave.v1` (Continue on the menu); an Undo takes
>   back the last HUMAN placement until the next roll (local only). Online
>   rejoin via `mmtNastyOnline.v1` (same device = same anonymous uid).
> * **Verified**: engine harness (243k checks: 600 random games at every
>   setting — every square filled once per round, the first-go rule, the
>   starter rotating, totals, winners re-derived for all three goals — plus
>   the CPU ladder), 89 UI checks (vs computer through to game over, undo,
>   worth tip, continue restoring the exact game, decimals, average refusing
>   2, 30 players with no horizontal overflow at 1920 and 1366, 2/4/6 players
>   with six squares at 1366/1280/1024/390/360 — boards and labels inside
>   their cards, cells ≥ 26px — settings and prefs saved), and 48 + 50 online
>   checks with a stubbed Firestore across eight pages (join, kick, late join
>   refused, dealing, idle takeover, a whole class game to class results,
>   leaderboard totals matching every table, back to lobby, close; and again
>   with the host playing). Harnesses in the session scratch.
>
> **NEW (2026-09-21, session — being pushed): STACKED BAR MODEL — RATIO —
> STUDENT QUIZ.** `online-quizzes/stage-4/ratios-rates/stacked-bar-ratio.html`,
> registered as `stacked-bar-ratio-quiz` writing `tool: "stacked-bar-ratio-student-quiz"`,
> masteryTopic `stacked-bar-ratio`, topic `ratios-rates` (the teacher portal's
> `TOPIC_AREA_NAME` now maps that to a new **Ratios & Rates** group — without it
> the quiz sat under "Other" in Set Dashboard Task). Listed under MA4-RAT-C-01;
> the tool's Tools menu now has both rows live. **The family is complete.**
> * **LEVELS ARE THE TEACHER'S (2026-09-21), 10 QUESTIONS:** Sweet = share a total
>   only · Mild adds one share known · Medium mixes all three types · Spicy is all
>   three with NO model. Types are dealt as evenly as the level allows, never three
>   of a type in a row, never the same ratio twice running.
> * **THE NUMBERS ARE BANDED BY THE TABLES, NOT BY SIZE** (teacher feedback
>   2026-09-21). The division that finds one part has to be a fact the student
>   knows, so everywhere except the end of Spicy BOTH the number of parts and
>   what one part is worth stay inside the **12 × 12 tables** (`BANDS.tables12`);
>   Spicy's **last three** questions use `tables15` — up to the 15s, with at
>   least one of the two numbers past 12 so they are genuinely harder rather
>   than quietly the same. The band comes from the question's POSITION on the
>   paper, not from its type.
> * **A SETTLED QUESTION SAYS WHICH OF THREE THINGS HAPPENED** (teacher feedback
>   2026-09-21: a right answer that came second was being told, in red, to "see
>   where it went wrong"). Correct first time → green, and **confetti**. Right in
>   the end → an amber note naming the step that lost the mark ("one part was
>   wrong on the first try… so this one does not score"). Moved on without
>   answering → "You moved on without answering this one."
> * **CONFETTI FOR WHAT WAS RIGHT FIRST TIME** — hand-rolled (the site loads
>   nothing from a CDN), one rAF loop, removes itself, skipped entirely under
>   `prefers-reduced-motion`. A **smaller burst (0.45)** when ONE PART is right
>   first time, the **full burst** when the question scores. Neither fires for
>   something fixed on the second go, or it would stop meaning anything.
> * **A LEVEL WITH NO MODEL EMPTIES `#modelHost`, it does not just hide it.** A
>   model left over from the level before is invisible but still in the DOM, and
>   "hidden but present" is how an answer ends up somewhere it should not be —
>   the leak sweep found the previous question's bars sitting inside Spicy.
> * **WITH THE MODEL, A QUESTION IS TWO STEPS:** what one part is worth, typed
>   into the glowing boxes (they mirror, as in the tool's Practice), THEN the
>   answer fields appear. It scores only if **both** steps are right first time.
>   A settled question stays workable; Next on an unanswered one settles it wrong.
> * **The answer is never on screen before marking** — the bar totals stay "?"
>   and the answer line appears only once settled. The boxes filling with one
>   part is the METHOD, not the answer.
> * **Shared sign-in and save:** one `<script src="/portal/shared/quizAuthUI.js">`,
>   `#mmtAuthSlot`, `window.MMTSave()` on finish, no Firebase config in the page.
>   **`earlySubmit.js` is an ES MODULE and is `import()`ed, then `register()`ed** —
>   the multiply/divide-by-ten quiz loads it with a plain `<script>` tag, which
>   stops at the `export` line and never defines `window.MMTSubmit`, and the
>   division-grouping quiz imports it but never calls `register()`, so NEITHER of
>   those shows a "Finish & submit" button. This one does; worth porting.
> * **A delayed `focus()` is a bug in a quiz.** The first build focused the first
>   box 30ms after painting, which pulled the cursor out of a box the student had
>   already clicked and sent their typing into the wrong answer. It now focuses
>   synchronously and never steals focus from a box already in use.
> * types[]: `type1/type2/type3:s/t`, `onepart:s/t` at the model levels, `level:`,
>   `model:on|off`. **No typed answer is ever in the payload** (asserted).
> * **Verified** through Playwright over HTTP with the real shared files: 400
>   papers (composition per level, no runs, exact arithmetic), every level played
>   right through for 10/10 with the answer never on screen early, first-attempt
>   scoring for EACH step, the number band of every question at every position,
>   the confetti firing on a scoring answer and NOT on a late one, the amber
>   "does not score" note, the full save payload, a partial early submit, skipping,
>   and the fit at 1366×768, 1280×800, 1024×768, 1920×1080 and 390 wide.
>   Harness in the session scratch: `qcheck.mjs`.
>
> **NEW (2026-09-21, session — being pushed): STACKED BAR MODEL — RATIO —
> WORKSHEET CREATOR.** `worksheet-creators/stage-4/ratios-rates/stacked-bar-ratio.html`
> (a new folder), listed under **MA4-RAT-C-01** beside the teaching tool, whose
> "Tools ▾" menu is now ONE live row pointing at it — the two related-tool links
> were removed on teacher request (2026-09-21) — with only Student Quiz greyed.
> Same shell, bands, spice chips, measured A4 pagination and answer key as the
> other creators; **no trilingual layer** (same deliberate omission as the
> multiply/divide-by-ten creator — a clean addition whenever it is wanted).
> * **FIVE SECTIONS, AND THE PICTURE COMES OFF LAST.** **A** share a total ·
>   **B** one share known · **C** the difference known — the tool's three types
>   with the bars drawn — then **D draw the bars yourself** (an empty box and
>   nothing else) and **E use it** (words, no picture). D is the section that
>   matters: a student who can draw the bars owns the model.
> * **THE GIVEN AMOUNT IS BRACKETED ONTO THE PART OF THE MODEL IT MEASURES**, as
>   on screen: a brace around both bars (A), a bracket over the known bar (B), a
>   bracket over the dashed gap boxes (C). Top bar's bracket above it, bottom
>   bar's below, so it never sits between the two bars.
> * **A BOX IS AT LEAST 9mm ACROSS AND AT MOST 13mm**, and a question whose ratio
>   needs more width than its column has is printed across **two or more columns**
>   automatically (`spanFor`) — the alternative is a 9 : 7 ratio drawn at 5mm a
>   box, which nobody can write a number inside. The model is one SVG per
>   question in millimetres, so a box is a known size on paper.
> * **NOTHING ON THE STUDENT HALF IS COLOURED** (these get photocopied) — the two
>   bars are told apart by their labels. The key fills every box in green and
>   gives the reasoning, not just the totals.
> * **Defaults are bare: only the bars.** The one-part line, check line, thinking
>   prompt and answer key all start off.
> * **Two pagination traps, both fixed here:** a section that carries over prints
>   a "continued" chip, and on a long heading that chip is what wraps the heading
>   to a second line — so the packer measures the heading WITH it. And every
>   `.section` carries a bottom margin including the last one on a page, so a new
>   section costs heading + rows + that margin. The "write your own question"
>   filler is removable when it will not fit; the thinking prompt never is (it
>   gets a page of its own).
> * **Verified** through Playwright: 2400 generated questions (simplest form,
>   never 1 : 1, level ranges, every amount exact, the word problem's type
>   matching its sentence), the drawn box counts against the printed ratio, the
>   amount on the model being the one in the question, the key mirroring the
>   worksheet question for question with every answer re-derived, no page over
>   the print budget at three densities × five levels × three option sets, and
>   ratios never wrapping across two lines. Harness in the session scratch:
>   `wscheck.mjs`.
>
> **NEW (2026-09-20, session — being pushed): STACKED BAR MODEL — RATIO,
> RESTYLED.** `interactive-tools/stage-4/ratios-rates/stacked-bar-ratio/index.html`
> (an early tool) rebuilt on the `.mmtTopbar` shell, same URL, under
> **MA4-RAT-C-01**. Self-contained, no Firebase.
> * **THE THREE TYPES MOVED INTO SETTINGS** (teacher request) as radio cards —
>   Share a total / One share is known / The difference is known / Mixed — with
>   a chip beside the mode switch that opens Settings. Demo / Practice / Quiz is
>   a segmented control. Also in Settings: ratio numbers up to 5/8/10, money-only
>   contexts, and toggles for the given amount on the model, the working, the check.
> * **ONE GRID FOR BOTH BARS** so a box in each bar is the same width by
>   construction. **The given amount sits on the part of the model it measures**:
>   a brace over both bars (Type 1), a bracket over the known bar (Type 2), a
>   bracket over the dashed gap boxes (Type 3). Top bar's bracket above, bottom
>   bar's below. On a phone the totals column goes and the Type 1 brace turns
>   into a bracket under the bars.
> * **Stages 0–3 (question, model, one part, answer) and everything is drawn from
>   `S.stage`**; Back is `stage--`. A side card writes the working line by line
>   (parts, parts = amount, 1 part = ÷, then ×, then a check).
> * Ratios are simplest form and never 1 : 1; totals 40–400. Practice: type one
>   part into any glowing box (all mirror), then the answers; "Show me" skips a
>   stuck step. Quiz: 15 questions, first check scores, a wrong answer shows the
>   right one. Old full-screen button dropped (the layout fills the screen).
> * **THE WRITTEN WORKING IS OFF BY DEFAULT** (teacher decision 2026-09-21), like
>   every other optional layer on this site: the plainest board is the one a
>   teacher gets without asking, and with the side card off the bars take the
>   whole width. Settings &rsaquo; Written working brings it back.
> * **THE AMOUNT IN THE QUESTION IS A FULL PALE CHIP, NOT A HIGHLIGHTER STRIPE**
>   (teacher feedback 2026-09-21): a `linear-gradient(transparent 62%, …)` underline
>   covers only the bottom of the text and reads as distracting. It is now the same
>   amber as the label that amount becomes on the model, which is what ties the
>   question to the bracket.
> * **THE NUMBER IN A BOX IS SIZED FROM THE BOX'S MEASURED WIDTH** (`fitBoxText`),
>   not from a breakpoint — a 13-part ratio on a 1024×768 projector clipped its
>   digits otherwise. Short screens (`max-height:800px`) also shrink the bar, the
>   question and the bracket labels, because Type 3's bracket row and Practice's
>   answer row both pushed the controls under the fold at 1024×768.
> * Types 2 and 3 get NO total brace at the answer: with ten boxes the extra
>   column squeezes the bars, and the answer line already states the total.
> * `prefers-reduced-motion` turns every animation off.
> * **TWO ANIMATIONS IN DEMO MODE (teacher design, 2026-09-22).** *Find one
>   part*: the given amount flies out of its label on the model to the middle of
>   the screen, grows to about 64px type (a set SIZE, not a multiple — on a short
>   projector the label starts small), and POPS into one copy of the one-part
>   value per box it is spread over, which scatter into those boxes — so 63
>   visibly becomes nine 7s. *Show the answer*: each bar's values gather (as
>   chips, so they read over the numbers still in the boxes), pop into that bar's
>   share, and the share flies to its pill at the end of the bar — blue, then
>   red, about a second each; the answer line appears last.
>   - **Both are OVERLAYS on a board `render()` has already drawn in its final
>     state**, with only the landing spots hidden (`visibility:hidden`) until
>     something lands. So `abortAnim()` — called by Back, Start again, New
>     question, a mode change and the given-amount toggle — just clears the fly
>     layer and redraws, and the board is simply correct. Every step checks
>     `alive()` against `ANIM_ID` so an aborted run cannot reveal anything later.
>   - `S.busy` locks Next and the keys while it plays. Off entirely under
>     `prefers-reduced-motion`. Practice mode is unchanged (the student types the
>     one part there). The harnesses set `S.noAnim = true`; `anim.mjs` drives the
>     real animations (151 checks: what flies from where, the pop count and
>     value, blue landing before red starts, ~2 s for the answer, clean aborts,
>     keys locked, reduced motion).
> * Verified in Playwright: 9000 generated problems, every stage of every type
>   (box counts, what is filled, answer never early), practice and quiz flows,
>   and no overflow at 390/1024/1280/1366/1920 over 540 questions.
>
> **NEW (2026-09-20, session — being pushed): DOT DETECTIVE.**
> `games/dot-detective.html`, after two printed Japanese dot-grid puzzles,
> renamed and rebuilt (nothing copied). Card in the **Puzzles** group; Games
> 17 -> 18. Self-contained, no Firebase, English only. Two modes on one page:
> * **FIND THE SHAPE** — marked lattice points hide exactly one set that are the
>   corners of the named shape (square, rectangle, rhombus, parallelogram, kite,
>   isosceles right / right-angled / isosceles triangle). **Names are INCLUSIVE,
>   as the syllabus defines them**: a "rectangle" board has no square on it either,
>   and the answer is always a PLAIN one (a rectangle that is not a square).
>   Uniqueness is proved by testing every k-subset of the dots with exact integer
>   vectors (squared lengths, dot and cross products — no floats).
> * **TRAPEZIUM IS FEEDBACK-ONLY, NEVER A TARGET**: almost any handful of dots holds
>   a parallel pair somewhere, so it could never be unique. Triangle targets get
>   fewer dots than quadrilaterals (`TYPE_DOTS`) for the same reason. The type is
>   picked FIRST and kept while retrying — re-picking on failure silently made
>   every board a square or rectangle.
> * **FIND THE TRIANGLE** — exactly one triple of dots has the given area (kept
>   DOUBLED as an integer so halves are exact). Sweet/Mild always have a flat side;
>   Extra Spicy never does, so it needs the box method.
> * **Wrong answers teach**: a wrong set is named ("those four make a rectangle,
>   not a square"; "that triangle's area is 4"), and after a check equal sides get
>   tick marks and right angles get squares. A **box method** button draws the
>   enclosing rectangle, shades and labels the corner triangles, and works the
>   area out. All four are Settings toggles, on by default.
> * **WORKSHEET CREATOR** (🖨 Worksheet): Shape / Triangle / Both, level or Mixed,
>   1–12 puzzles, **2 / 4 / 6 per page as a size control** (grid 78 / 72 / 48 mm),
>   definitions, a working box for area puzzles, answer key (dots ringed, shape
>   shaded; area keys show the box working). Shape types on a sheet are dealt
>   from a shuffled deck so a sheet is not all squares. Same mm/zoom/print
>   approach as Total Trail; harness asserts no overflow at 12@6, 8@4, 5@2, 6@6.
>
> **NEW (2026-09-20, session — being pushed): TOTAL TRAIL.**
> `games/total-trail.html` (briefly built as "Equation Trail", which used the
> order of operations — replaced the same day, teacher decision). After a
> printed "snakes" sheet, renamed and rebuilt. Card in the **Puzzles** group.
> Self-contained, no Firebase, English only.
> * **IT IS A RUNNING TOTAL, NOT ONE LONG SUM — teacher decision 2026-09-20.**
>   The first number starts the total; each sign-and-number changes it straight
>   away, in walking order (5, +3, ×2 → 16). **A trail is NEVER written as a
>   single expression anywhere on screen**, because "5 + 3 × 2 = 16" is false under
>   BODMAS and would plant exactly the misconception the site fights elsewhere.
>   Trails are written as function-machine chains (`5 → +3 → ×2 → 16`), the bar
>   under the board shows ONE number (the running total) plus the single step
>   that made it, and "Your steps" lists each step as its own true equation
>   (`8 × 2 = 16`). The finish squares next to the target are ARROWS, not "=".
>   A note under the board and the rules say outright that as one sum the order
>   of operations would give a different answer. A UI check fails if any text
>   the game writes about a trail contains two operations in a row.
> * **A ÷ that does not go exactly is refused** ("34 ÷ 4 is not a whole number…"),
>   so every running total is a whole number. Negative totals are allowed while
>   playing; generated answers only dip below zero at Extra Spicy.
> * **GENERATION BY EXHAUSTION** (`ET.allTrails`, running total carried through
>   the DFS): a board is kept only if some target is reached by exactly `find`
>   trails, which spell different step chains, differ by at least four squares,
>   and contain no step followed by its own undo (+12 −12, ×6 ÷6). ×/÷ levels use
>   numbers from 2. Levels: Sweet 4x4 + − find 2 · Mild 5x5 + − find 3 · Medium
>   + − × · Spicy all four · Extra Spicy numbers to 12, negatives, find 4.
> * The running total is written in the corner of each number square on the
>   trail. Settings › "Show the running total" (on by default) hides all of it
>   so students keep the total themselves.
> * **WORKSHEET CREATOR, built into the same page** (🖨 Worksheet in the topbar,
>   or the menu card). Level (or Mixed — a Sweet-to-Extra-Spicy ladder), 1–12
>   puzzles, and **puzzles per page 1 / 2 / 4, which is a SIZE control** (board
>   156 / 90 / 60 mm; 2-per-page puts the record lines beside the board). A4 pages
>   in millimetres, boards as SVG, the preview is the real page shrunk with
>   `zoom`, and `@media print` hides everything but the pages. Options: record
>   lines, answer key, the "steps, not one long sum" note, name/date, coloured
>   × ÷. The key draws every trail in its own colour AND dash pattern (readable
>   on a black-and-white copier) and writes each as a step chain, never a sum.
>   Changing the layout re-lays the SAME puzzles; only Generate re-rolls. No two
>   puzzles on a sheet share a target. The layouts are fixed sizes, and the
>   harness asserts no puzzle box, grid or page overflows at 12@4, 5@2 (Mixed),
>   3@1 and 4@4, and that the printed PDF has the expected page count.
>   Options saved in `mmtTotalTrailSheet.v1`.
> * Share link `#t1.n.T.cells`, progress `mmtTotalTrailSave.v1`. Verified: 150
>   generated boards re-counted with an independent evaluator + Playwright UI checks.
>
> **NEW (2026-09-19, session — being pushed): ORDER UP.** `games/order-up.html`,
> a logic puzzle after a printed "put 1–16 in a 4x4 so every row and column hits
> the target" sheet, renamed and rebuilt from scratch (nothing copied). Homepage
> card before Chess; Games 15 -> 16. One self-contained file on the `.mmtTopbar`
> shell, no Firebase, English only (the EN/AR/FA layer is a clean addition).
> * **ENGINE IS DOM-FREE** (the first `<script>`, `var OU`). `evalExact` marks with
>   exact RATIONALS (4 ÷ 8 × 6 is 3), so ANY arrangement that hits every line wins.
>   `evalFriendly` is used only to CHOOSE the intended answer: every ÷ whole and,
>   below Extra Spicy, no running total under zero.
> * **GENERATION IS CONSTRUCTIVE.** A random 1–16 board almost never has eight
>   lines sharing a target, so it picks the target and fills row 0, col 0, row 1,
>   col 1, … choosing ops AND numbers per line from a prefix-indexed list of
>   candidates. Under 1 s at every level.
> * **UNIQUENESS BY COUNTING** (`countSolutions`, same row/col interleave over
>   every hitting tuple). Checked against a brute force over all 9! boards.
>   Numbers are removed from the busiest row+column first, so no puzzle hands over
>   a whole line. The printed sheet's top-right puzzle comes out unique too.
> * **LEVELS:** Sweet 3x3 + − · Mild 3x3 all four · Medium 4x4 + − × (8 given) ·
>   Spicy 4x4 all four (7) · Extra Spicy (5, negatives on the way).
> * **LINE CHECKS DEFAULT TO TICK/CROSS** — students do the arithmetic. Settings
>   offers values + step-by-step working (tap a total), or nothing until the end.
>   No hints (consistent with Sudoku/Chess); "Show answer" ends the puzzle.
> * **MAKE YOUR OWN:** tap circles to change signs; when every line matches,
>   "Turn it into a puzzle" hides numbers while keeping one answer. Or set givens +
>   a target and it checks 0/1/many. Puzzles SHARE AS A LINK (`#v1.n.T.ops.givens`)
>   — nothing online.
> * Progress in `mmtOrderUpSave.v1`, settings in `mmtOrderUpSettings.v1`.
> * **RACE MODE (2–4 players)** at `games/order-up/rooms/{CODE}` on
>   `mmt-firebase-games` — the existing `/games/{gameId}/rooms/{roomCode}` rule
>   covers it, **no rules change**. Same shape as Sudoku's race (create/join,
>   Ready, 3-2-1 gate, board veiled until then, late joiners refused, rematch when
>   all press Play again, leave). Firebase is a DYNAMIC import. The room stores
>   the puzzle as its share code (Firestore cannot hold nested arrays) and never
>   the answer; a win is checked in a transaction by `boardOK`. "Values and
>   working" drops to tick/cross in a race so nobody has a calculator.
>   Verified with a stubbed Firestore across three pages (24 checks).
> * Level icons are ONE emoji each (🍬 🍃 🌶️ 🔥 🌋, as Sudoku) — two emoji wrap
>   inside the 44px icon box and spill into the title.
>
> **NEW (2026-09-19): THE GAMES CATEGORY IS THREE GROUPS.** `index.html` now has
> three `data-resource-group data-cat="game"` sections: **Games related to
> mathematics** (`#games`, topic "Maths games": Battleships, Cartesian Capture,
> Cartesian Connect 4, Closest to 100, Fractional Hex, Greedy Pig, Maths Memory,
> Row & Column Challenge, Taxed by the King), **Games** (`#games-strategy`,
> "Strategy games": Chess, Checkers, Dots and Boxes, Ultimate Tic-Tac-Toe) and
> **Puzzles** (`#games-puzzles`, "Puzzles": Order Up, Shikaku, Sudoku). Every
> card is still `data-type="game"`, so the Games tab and counts are unchanged;
> the topic filter now offers the three groups. A new game goes in one of the
> three and its `group-count` pill is edited by hand.
>
> **NEW (2026-09-19, session — being pushed): CHECKERS.** `games/checkers.html`,
> built on the CHESS shell (same modes, clocks, online room shape, takeback-only
> policy, phone layout, EN/AR/FA) — read the Chess block below; this one lists
> only what differs. Homepage card before Closest to 100; Games 14 -> 15.
> * **ENGLISH DRAUGHTS, EXACTLY** (what Australian schools and clubs play):
>   8x8, dark squares, **Black moves first**; men move and capture forward only;
>   kings one square any diagonal (not flying); **captures compulsory** (any
>   capture, not the longest); a multi-jump must be finished; captured pieces
>   stay on the board until the move ends (cannot be jumped twice); **a man that
>   is crowned ends its move** even if the new king could jump on; no legal move
>   = loss; draws by threefold repetition or 40 moves each with no capture and no
>   man move. Standard square numbers 1-32 (1-4 on Black's back row, top-left
>   with White at the bottom) and standard notation `11-15`, `22x15x8`.
> * **Perft matches the published English-draughts counts to depth 8**
>   (7, 49, 302, 1469, 7361, 36768, 179740, 845931). Incremental Zobrist hash
>   checked against from-scratch after 200 random games.
> * **Result strings follow Chess: `1-0` = WHITE wins** even though Black moves
>   first. The first build had this backwards in `status()` and the self-play
>   harness caught it (every level appeared to lose to the one below).
> * AI: negamax alpha-beta + TT + killers, and a **capture quiescence** (captures
>   are forced, so the search never stops mid-exchange). Eval: men 100 + advance,
>   kings 175, back-row guard, centre, trade-down when ahead, king-to-enemy
>   distance in the endgame. Levels by depth/time/noise; self-play Mild 4/4 v
>   Sweet, Medium 4/4 v Mild, Spicy 4/4 v Medium.
> * **Multi-jumps are entered one landing at a time** (tap, or drag the first hop
>   then tap on); the piece is drawn where it has got to and the next landing
>   squares are ringed. Trying to move a non-capturing piece when a capture exists
>   says "You must capture!" and flashes the pieces that can jump. Crowning shows
>   a gold crown and a message.
> * Pieces are original SVG discs with a gold crown for kings (`DRAUGHT_SVG`).
>   Setting "Show square numbers" (off by default) for writing moves down.
> * **Verified**: perft/hash harness, 37 UI checks (Black first, forced capture
>   + flashing movers, tap and drag multi-jumps, crowning ends the move, win by
>   no pieces, keyboard, resign, draw, clocks with Black's first move untimed,
>   takeback, continue, playing White flips and lets the computer open, rules,
>   square numbers, FA RTL) and 18 online checks with a stubbed Firestore
>   (join, third refused, White can't open, sync, clock charge, forced capture
>   and recapture synced, draw offer/accept, rematch swap, resign). FA name
>   "چکرز" is a transliteration; a fluent speaker may prefer another word.
>
> **NEW (2026-09-19, session — being pushed): CHESS.** `games/chess.html`, one
> self-contained file on the `.mmtTopbar` shell with the shared MMT PHONE LAYOUT
> block (plus Chess's own phone rules inside the fence). Homepage card before
> Closest to 100; Games stat tile and group count 13 -> 14. EN/AR/FA as the other
> games (AR/FA want a fluent proofread). Three modes:
> * **Play the Computer — five levels** (Sweet/Mild/Medium/Spicy/Extra Spicy).
>   Negamax alpha-beta + quiescence, MVV-LVA and killer/history ordering, a
>   transposition table on Zobrist keys, check extensions, piece-square tables.
>   Levels differ by depth, time AND deliberate noise: Sweet (depth 1, big score
>   noise, 35% random moves), Mild (depth 2, noise, 10% random), Medium (depth 3,
>   small noise), Spicy (to depth 5, 1.6 s), Extra Spicy (iterative deepening,
>   3.2 s). Self-play: Mild beat Sweet 4/4, Medium beat Mild 4/4. The engine runs
>   in a **Web Worker built from the page's own `<script id="chessEngineSrc">`**
>   (its textContent is the worker source), so the board never freezes while it
>   thinks; if Worker creation fails it falls back to the main thread. A reply is
>   held to at least 450 ms so the move can be seen.
>   **Takeback only — no hint or best-move button (teacher decision 2026-09-19,
>   consistent with Sudoku).** Takeback undoes back to the player's turn; it is
>   not offered in Pass and Play or Play a Friend. No draw offers vs computer.
> * **Pass and Play** — names for both sides, optional clocks, "Agree a draw",
>   resign, and a setting to turn the board each move (off by default).
> * **Play a Friend** — room code at `games/chess/rooms/{CODE}` on
>   `mmt-firebase-games`, covered by the existing `/games/{gameId}/rooms/{roomCode}`
>   rule: **no rules change, nothing to publish**. The room stores the MOVE LIST
>   (UCI), clocks, result, draw offer and rematch flags; every write is a
>   transaction that REPLAYS the moves through the engine and refuses an illegal
>   or out-of-turn move, and every client rebuilds its board from the list. Third
>   player refused. Rematch swaps colours (`gen` increments). Firebase is a
>   dynamic import, only when Play a Friend is opened.
> * **Clocks** (none, 3+2, 5+0, 10+0, 15+10): White's first move is untimed, then
>   each side runs from the end of the opponent's move, increment after each timed
>   move. Online, remaining time is `times[side] - (now - lastMoveAtMs)`; either
>   client may claim a flag in a transaction that re-checks it. A flag against a
>   side that cannot possibly mate is a draw.
> * **Rules are exact and perft-verified**: castling (not out of/through/into
>   check), en passant, all four promotions, checkmate, stalemate, threefold
>   repetition (Zobrist keys, en passant counted only when capturable), fifty-move
>   rule, insufficient material. Perft matches the published counts for the start
>   position (d4), Kiwipete (d3), and positions 3–6 of the standard set, and the
>   incremental hash equals a from-scratch hash after 200 random games. SAN with
>   disambiguation, `+`/`#`, `=Q`.
> * **Pieces are original SVG artwork drawn for this game** (`PIECE_SVG`), not a
>   copied set and not Unicode glyphs (iOS turns the black pawn into an emoji).
>   One path set per piece, White light-fill/dark-outline, Black dark-fill with
>   light detail lines.
> * **Board UX:** tap-tap or drag (pointer events with capture; ghost follows
>   the finger), legal-move dots and capture rings, last-move and check shading,
>   promotion picker (or "always queen" setting), coordinates, slide animation,
>   flip board, captured pieces with material count, SAN move list, keyboard
>   (arrows + Enter/Space, roving tabindex, aria-labels per square). Computer and
>   Pass-and-Play games are saved to localStorage (`mmtChessSave.v1`) and offered
>   as Continue. Rules modal teaches each piece with its icon, the special moves
>   and every way a game ends.
> * **Layout:** board beside a status/actions/moves column on desktop (fits 1366x768
>   and 1440x900 with no page scroll); below 1080px the side column becomes
>   `display:contents` so status sits above the board and actions/moves below.
>   Phone: full-width board (46px squares at 390px), both player bars and clocks
>   on the first screen, no horizontal overflow, no button under 36px.
> * **Verified**: perft + hash harness (Node), 37 UI checks (castling, en passant,
>   under-promotion, illegal-move message, fool's mate end modal, drag, keyboard,
>   resign, agreed draw, clocks incl. untimed first move/increment/flag, takeback,
>   continue, playing Black flips the board, settings, AR RTL with the board kept
>   LTR) and 23 online checks with a stubbed Firestore across three pages (join,
>   third player refused, turn enforcement, sync, clock charge + increment, draw
>   offer/decline, checkmate result on both boards, rematch colour swap, timeout
>   claim, resign). Harnesses in the session scratch.
>
> **NEW (2026-09-19, session — being pushed): SUDOKU.** A new game at
> `games/sudoku.html`, one self-contained file on the same `.mmtTopbar` shell and
> tokens as Shikaku, with the shared MMT PHONE LAYOUT block (plus Sudoku's own
> phone rules inside the same fence). Homepage card added after Shikaku; the
> Games stat tile and group count went 12 -> 13. Not in `toolLinks.js` — no
> syllabus outcome is about Sudoku. The MMT Screen launcher picks it up from the
> homepage card by itself.
> * **FIVE LEVELS, GRADED BY TECHNIQUE, NOT CLUE COUNT.** Sweet 4x4 (2x2 boxes),
>   Mild 6x6 (2x3 boxes), Medium 9x9 (naked + hidden singles), Spicy 9x9 (needs
>   pointing/claiming or naked/hidden pairs/triples), Extra Spicy 9x9 (needs
>   X-Wing, Swordfish, XY-Wing or XYZ-Wing). The engine's grader solves like a
>   person — always the easiest step that works — and a puzzle's level is the
>   hardest tier it had to use. A Spicy that only needed singles is thrown away.
> * **EVERY PUZZLE IS UNIQUE AND NEEDS NO GUESSING, BY CONSTRUCTION.** Cells come
>   out in 180-degree-symmetric pairs, and a removal is kept only if the grader
>   can STILL finish using the level's tiers. A logical finish implies a unique
>   solution, so there is no separate uniqueness count in the generator (the
>   harness checks it independently anyway). Generated live in the browser:
>   Extra Spicy median ~75 ms, worst seen ~340 ms on a laptop.
> * **NO HINT BUTTON AND NO FILL-NOTES BUTTON — teacher decision 2026-09-19.**
>   The first build had both (a two-press explained hint, and a button that
>   pencilled every candidate in); both were removed so students do the
>   noticing and the note-taking themselves. Do not add them back. The engine
>   still grades by technique, and the "Thinking you may need" panel still
>   names the techniques a level needs — that is information, not a hint.
> * **Player tools:** notes (pencil marks, `N` or Shift+digit, entered by
>   hand), undo (whole-board snapshots, so Restart is undoable too), erase, clash
>   highlighting (always on — it is a rule, not the answer), "show wrong numbers"
>   (a setting, OFF by default, forced off in a race), matching-number highlight,
>   auto-tidy notes, pause (auto on tab hide), timer. Single-player progress is
>   saved to localStorage (`mmtSudokuSave.v1`) and the menu offers Continue.
> * **RACE MODE: 2-4 PLAYERS** at `games/sudoku/rooms/{CODE}` on
>   `mmt-firebase-games`, covered by the existing `/games/{gameId}/rooms/{roomCode}`
>   rule — **no rules change, nothing to publish in the console** (the reference
>   file's audit list was updated). **The room stores the givens only, never the
>   solution**; each client derives it with the solver. The board is blank until
>   the countdown gate so nobody reads the givens early. Late joiners after the
>   start are refused. Progress bars show cells FILLED, not cells correct.
> * **Firebase is a dynamic import, only on opening Race Mode**, so single player
>   works on a network that blocks gstatic.com (Shikaku imports statically and is
>   dead offline).
> * **Verified** through Playwright + Node: 11,477 grader steps across 300
>   generated puzzles, every placement the correct digit and no elimination
>   ever removing the true digit; every level's puzzles unique and at
>   exactly their tier; UI checks (no hint/fill-notes buttons, notes, undo,
>   restart, pause, continue, keyboard, settings, AR/FA RTL with the board kept
>   LTR) and 29 race checks with a stubbed Firestore across three pages
>   (create/join/ready/countdown/veil/progress sync/win/lock/view solution/
>   rematch/leave/late join). Layout checked at 1440x900 and 1366x768 (no page
>   scroll), 1024, 390x780 and 360x740 (sticky number pad, no horizontal
>   overflow, no button under 34px). Harnesses in the session scratch.
> * AR/FA strings want a fluent proofread, as everywhere else.
>
> **NEW (2026-09-18, session 2 — being pushed): THE MULTIPLY/DIVIDE BY 10 FAMILY
> IS COMPLETE.** The teaching tool got a second pass and its two siblings were
> rebuilt on the current shell. All four files (tool, worksheet creator, student
> quiz, class flash cards) are under **MA3-RN-01**.
>
> * **ZEROES ARE DIGITS OF THE NUMBER, AND THEY TRAVEL.** The first build derived
>   a placeholder zero after each hop and popped it into the empty column, drawn
>   grey. Teacher feedback 2026-09-18: a zero that APPEARS is exactly the "just
>   add a zero" misconception the tool exists to kill. So the model is now a TAPE
>   — one digit per place, zeros above and below the number, running off both
>   ends into a three-place buffer — and x10 is a single operation: SHIFT THE
>   WHOLE TAPE. The zero that turns up in the ones when 45 becomes 450 IS the
>   trailing zero from the tenths, it travels there, and it is blue like every
>   other digit of 450. **The harness asserts the element id of the zero in the
>   ones after the hop equals the id of the digit that was in the tenths before
>   it.** Nothing on this board may ever appear in a column it did not travel to.
> * **A digit about to come on screen is revealed BEFORE the hop, at its old
>   position.** Revealing it on landing is the same pop by another name. That
>   ordering — reveal, travel, recolour — is the whole of `hop()`.
> * **Settings › Show trailing zeroes** writes the zeros that are always there
>   after the last digit (45 as 45.0000) in faint grey. Multiply, and one crosses
>   the point into the ones and turns blue; another comes in at the far right.
>   Off by default — it is a reveal a teacher chooses.
> * **The board now runs hundred thousands to TEN THOUSANDTHS** (ten columns).
> * **THE WORKSHEET CREATOR** (`worksheet-creators/stage-3/number/multiply-divide-by-ten.html`)
>   was on the old banner shell with six numbered "levels" and float arithmetic.
>   It is now the current creator shell (bands, spice chips, measured A4
>   pagination, answer key) with a **Sweet/Mild/Medium/Spicy/Mixed** ladder and
>   five sections: **A** the place value grid printed with the number in it and a
>   blank row underneath, **B** multiply, **C** divide, **D** find what is
>   missing, **E** use it. Sections carry their own question counts, and the six
>   powers are a tick list so a sweet paper can still be all x1000.
>   - **THE POINT IS PRINTED IN BOTH ROWS OF EVERY GRID.** Leaving the student to
>     place it in the answer row teaches the opposite of the tool. There is a
>     toggle to remove it, for a teacher deliberately setting that discussion,
>     and it is the only thing in the Options band with a note explaining itself.
>   - **The grid's column span is computed from the question AND the answer**, so
>     540 ÷ 100 prints hundreds through tenths and nothing else.
>   - **Pagination is measured, not estimated**: a row is appended and, if the
>     sheet has overflowed, taken back off to start the next page. Nothing can
>     land under the page footer and a split section says "continued".
>   - **Every word problem is phrased with the given quantity as q and the answer
>     as a, and declares the operation it needs.** The first draft phrased two of
>     them around the answer and printed the given number as the answer on the
>     key — caught by the harness, which re-derives every printed answer.
> * **THE STUDENT QUIZ** moved from `student-flash.html` (a bespoke flash-card
>   page with no sign-in and no saving) to
>   `online-quizzes/stage-3/number/multiply-divide-by-ten.html`, registered as
>   `multiply-divide-by-ten-quiz` writing `tool: "multiply-divide-by-ten-student-quiz"`,
>   masteryTopic `multiply-divide-by-ten`. `student-flash.html` is left in place —
>   it is linked from toolLinks and from the tool's Tools menu as Class Flash Cards'
>   self-paced sibling.
>   - **THE LEVEL IS HOW MUCH OF THE TEACHING TOOL THE STUDENT KEEPS**, the same
>     design as the Perimeter and Division by Grouping quizzes. Sweet gives the
>     board AND plays the move; Mild keeps the board but will not move it; Medium
>     and Spicy take the board away. The numbers climb alongside, but the
>     withdrawal of the model is the real ladder.
>   - **The answer is never on screen before it is marked.** At Sweet the board
>     may be moved — the digits in their new columns are the METHOD, and the
>     student still has to read the number off and write it — but the number
>     sentence keeps its `?`. A check plays all four levels right through and
>     fails if the expected answer appears as a whole token anywhere on the page.
>   - **Only the first attempt scores, but a settled question stays workable** —
>     disabling Check after marking locks a student out of finishing their own
>     thinking, which the harness caught.
>   - Shared sign-in: one `<script src="/portal/shared/quizAuthUI.js">`, an
>     `#mmtAuthSlot`, and a `window.MMTSave()` on finish. No Firebase config in
>     the quiz, and **no typed answer is ever in the payload** — both asserted.
> * **Verified** through Playwright: **77 checks on the tool** (the point at the
>   same pixel after every operation at five viewports, 96 exact shifts, the zero
>   travelling rather than appearing, trailing zeroes crossing and turning blue,
>   the ten columns, three hops for x1000, the board edges, words, keyboard),
>   **48 on the worksheet creator** (2880 generated questions exact and inside
>   their level, every printed answer re-derived, every grid's point in both rows,
>   no sheet overflowing at three sizes and five levels, each section alone, the
>   operation tick list obeyed) and **52 on the quiz** (240 generated papers, what
>   each level hands over, no answer on screen before marking, first-attempt-only
>   scoring, the whole save payload, the point not moving, a phone width).
>   Harnesses live in the session scratch, not the repo: `check.mjs`,
>   `wscheck.mjs`, `qcheck.mjs`.
> * **Deliberately NOT done: the trilingual EN/AR/FA worksheet layer** that the
>   other creators carry. Every one of those notes says the AR/FA strings want a
>   fluent proofread, and adding a third set I cannot check seemed worse than
>   leaving it — it is a clean addition whenever Jeff wants it.
>
> **NEW (2026-09-18, session — being pushed): PLACE VALUE — MULTIPLY AND DIVIDE
> BY 10, REBUILT.** `interactive-tools/stage-3/number/multiply-divide-by-ten/index.html`
> was an early tool on the old back-pill shell. It is now on the shared MMT
> topbar with Settings and Tools menus, same tokens as the other Stage 3 tools,
> and the model underneath was rewritten. Same URL, same three siblings (class
> flash cards, student practice, worksheet creator); filed under **MA3-RN-01** as
> before, which is the right outcome precisely because that outcome is about
> place value AND THE ROLE OF ZERO.
> * **THE DECIMAL POINT IS NOT A DIGIT AND IS NOT IN THE DIGIT LAYER.** It is
>   painted into its own column band — a tinted strip with a vertical line
>   running the full height of the grid and a "POINT STAYS" pin above it — so it
>   is not merely that the point does not move, it is that no code path exists
>   that could move it. That is the whole pedagogy of the tool: the digits change
>   place, the point does not. **The harness asserts the point glyph is at the
>   same pixel after every operation**, across four starting numbers, sixteen
>   operations and five viewports. Do not make the point part of the number.
> * **NOTHING MULTIPLIES A JAVASCRIPT NUMBER.** A number is a list of
>   `{id, d, place}` digits and x10 is `place + 1` on every one of them. So
>   523.146 x 10 is exactly 5231.46, never 5231.459999999 — the old tool did the
>   arithmetic in floats. 78 shifts are re-derived in the harness against
>   string-shifted expectations that owe nothing to floats.
> * **THE DIGITS TRAVEL; THEY ARE NOT RE-RENDERED.** Each digit is one absolutely
>   positioned element in a layer over the columns, animating its `left` between
>   measured column centres. The old tool ran a CSS slide and THEN redrew the
>   grid, so the digits slid and snapped. A digit crossing the point travels
>   further in pixels than the others, because the point column sits between
>   them — the harness checks the landing COLUMN, not a constant pixel step, and
>   that is why.
> * **PLACEHOLDER ZEROS ARE DERIVED, NOT CARRIED.** A zero that is only holding a
>   column open is not one of the digits that travelled, so it never travels: it
>   is recomputed after each hop, pops in when a column is left empty, and fades
>   when it is no longer needed. It is drawn hollow/grey so a class can tell it
>   from a digit that moved. This is the answer to "just add a zero" — 52 x 10
>   shows the 5 and the 2 moving and a zero being WRITTEN IN behind them. An
>   internal zero (the 0 in 5031) IS a digit of the number and does travel.
>   **The old tool printed trailing zeros — 5231.46 displayed as 4 6 0 0 0 0.**
> * **THE GRID IS A FIXED NINE-COLUMN WINDOW**, hundred thousands to thousandths,
>   all on screen at once. The old one was nineteen columns with sideways
>   scrolling and vertical labels, so the digits were tiny and the class had to
>   scroll to follow the movement. A move that would push a digit off either end
>   DISABLES that button rather than erroring afterwards, and a typed number past
>   the window is refused at the input. The scientific-notation fallback is gone
>   (teacher decision 2026-09-18) — it is a different lesson.
> * **x100 AND x1000 ARE PLAYED AS SEPARATE HOPS OF TEN**, with a chip reading
>   "x 10 — hop 2 of 3" (teacher decision 2026-09-18). Multiplying by 1000 IS
>   multiplying by 10 three times and the tool should show that, not slide three
>   columns in one motion. Settings › Speed › "Straight there" turns the
>   animation off entirely, which is also what the harness runs at.
> * **THE BOARD IS MEASURED TO FIT, TWICE.** `fitGrid()` binary-searches the
>   column width against the real page, then binary-searches the box HEIGHT
>   separately, because a projector usually leaves vertical room over and a
>   guessed cap wastes it. Boxes are capped near square — a tall thin box stops
>   reading as a place value column. Verified at 1920x1080, 1366x768, 1280x800,
>   1024x768 and 1512x982 with no page scroll and no digit outside the grid.
> * **The "POINT STAYS" pin has a lane of its own above the labels.** Tucking it
>   into the labels row saves 20px and costs a collision with "ones" and "tenths"
>   as soon as the columns narrow — it did, at 1024.
> * **Verified** through Playwright: 59 checks — the point at the same pixel
>   after every operation and at every viewport, 78 exact shifts with the
>   out-of-range ones correctly disabled, the zero rules (no invented trailing
>   zeros, a leading zero before the point, an internal zero travelling), every
>   digit landing one column along, x1000 announced as three hops, the board
>   edges and the four input refusals, the running expression accumulating and
>   Reset clearing it, all five settings, 40 random numbers all still movable
>   both ways, five viewports, and the arrow keys. Harness is in the session
>   scratch, not the repo: `check.mjs` (it sets Speed and the switches through
>   `dispatchEvent`, since both live inside menus or behind styled toggles).
> * Left arrow multiplies and right arrow divides, because that is the way the
>   digits go.
>
> **NEW (2026-09-18, session — being pushed): GAMES ON A PHONE.** Every game in
> `games/` now has a phone layout, following the one Greedy Pig got on 2026-09-17.
> Each file carries ONE appended block, fenced by
> `/* ==== MMT PHONE LAYOUT (added 2026-09-18) ... */` markers immediately before
> its closing `</style>`, so it is the last thing in the cascade and overrides the
> file's own breakpoints without touching them. **Re-run or re-edit that block
> rather than adding a second one** — everything above the start marker is the
> original stylesheet.
> * **THE SHARED PART IS THE SAME IN ALL ELEVEN FILES** (the `.mmtTopbar` shell is
>   byte-for-byte identical across the games, so it transplants): at
>   `max-width:700px` the header goes `position:relative` (it scrolls away instead
>   of holding the top third of the screen), the brand text hides, logo and title
>   share one row and `.actions` becomes a wrapping flex row of >=38px buttons.
>   That alone took 150-500px off every game. Modals get
>   `max-height:calc(100dvh - 20px);overflow:auto` and their backdrop
>   `align-items:start` — **seven games had a centred modal with no max-height, so
>   a setup panel taller than the phone lost its buttons off the bottom with no
>   way to scroll to them.** Rows & Columns could not be started on a phone at all.
>   Every `<select>`/`<input>` is 16px so iOS does not zoom the page on tap.
> * **THE REAL BREAKAGES WERE ALL min-content, NOT BREAKPOINTS.** A grid item
>   cannot shrink below its min-content, so ONE `white-space:nowrap` pill deep
>   inside a card widens the whole track past the screen. Battleships' placement
>   coach ("Coordinates are written as (x,y)") widened `.layout` to **552px** and
>   cut the grid, the ship list and the Submit button off the right edge — the
>   game was unplayable on a phone. Fraction Hex Path's
>   `@media(max-width:1180px){.goal-frame{min-width:max-content}}` made the frame
>   **620px**; releasing it lets the frame fit and the board scroll inside
>   `.board-wrap` instead (a 5-wide hex board cannot fit 390px at a size the
>   fractions are readable at — that scroll is deliberate). Connect 4's and
>   Ultimate Tic-Tac-Toe's `.settings-menu` is `position:absolute;right:0` against
>   its button, so once the header buttons wrapped the 364px panel hung off the
>   LEFT edge; on a phone it is a `position:fixed` sheet pinned to the bottom.
> * **HEIGHT MATTERED AS MUCH AS WIDTH.** Dots and Boxes' four full-width score
>   cards put the board ~1100px down the page; two-up cards bring it onto the
>   first screen (1165px -> 879px total). Same two-up treatment in Closest to 100,
>   Connect 4 (1543 -> 1051) and Ultimate Tic-Tac-Toe. Taxed by the King's
>   `.card-stage` and `.hero-left` each reserve 340px, which pushed the student's
>   **Bank** button off the bottom — trimmed to 212px/auto, exactly as Greedy Pig's
>   `.dice-stage` was.
> * **Dots and Boxes' line hit areas** are `stroke-width:28` in a 720 viewBox —
>   about 13px once the board is phone sized. Widened to 52 (~26px), still far
>   under half the gap between neighbouring lines, so the wrong line is never hit.
> * **Verified in headless Chromium at 360/390/430 x 780**, landing screen and
>   in-game, by driving each game into play with a stubbed Firebase module (the
>   games are one ES module that statically imports `firebasejs`, so with no
>   network NOTHING wires up and every button is dead — stub
>   `initializeApp`/`getAuth`/`getFirestore` etc. to test offline). No horizontal
>   overflow anywhere, no button under 34px, no input under 16px. Harness is in
>   the session scratch, not the repo.
> * **Greedy Pig was already done and is untouched.** Battleships' tap-a-ship then
>   tap-the-grid placement path already existed (`setupFleetSvg` has a `click`
>   handler as well as HTML5 drag), so touch placement works — HTML5 `dragstart`
>   alone would not have.
>
> **NEW (2026-09-21, session — being pushed): THE SEARCH BOX MOVED UP, AND
> THE RESULTS MOVED IN WITH IT.** Teacher feedback: the homepage search existed
> but was buried three screens down inside the Browse card and read as part of
> the furniture. **The `#browse` section now sits directly under the hero** —
> above "Featured this term", which moved below it — and its card
> (`.browse-shell`) opens with a tinted **`.findbar-head`** (`id="findbar"`,
> which is what the hero's "Search all resources" button scrolls to and focuses)
> holding the search field and a row of **"Try:" chips** (`.find-chip`,
> `data-q`) that fill the box and run the search. The section head above the
> card carries the kicker *Find it fast* and the heading *"Know what you want?
> Search below to find it!"*.
> * **THE SEARCH BOX AND THE RESULTS ARE ONE CARD** (teacher feedback
>   2026-09-21). A separate band above the results card read as disconnected —
>   you typed in one box and the answers appeared in a different one. So the
>   head is the TOP OF the results card, flush to its edges: `.browse-shell` is
>   `padding:0;overflow:hidden`, the head is full-bleed with a bottom border,
>   and every OTHER direct child of the shell is padded in by CSS
>   (`.browse-shell > *:not(.findbar-head)`), which is why nothing there may
>   rely on the shell's own padding.
> * **THE INPUT WAS MOVED, NOT COPIED.** There is still exactly ONE
>   `#resourceSearch`, so there is no second input to keep in sync and every
>   existing handler (`enterSearch`, `applyFilters`, `showHome`, `backBtn`)
>   works untouched. The old `.browse-search` wrapper and its CSS are gone; the
>   `.filter-select:focus` rule that shared its selector was kept.
> * `enterSearch()` still hides the featured strip, which now sits BELOW the
>   browse section, so a search never leaves a gap mid-page.
> * **The MMT Screen launcher is unaffected** — it reads `a.resource-card` and
>   `.nav-links a[href]`, and neither changed.
> * Verified in Playwright at 1440x900, 1366x768 and 390x780 (50 checks): one
>   input, the field and `#resultsArea` inside the same `.browse-shell`, the
>   head flush to the card's edges, results drawn inside the card with padding
>   under the last one, the card above the featured strip, no horizontal
>   overflow, the chips, Reset clearing and bringing the featured strip back,
>   the hero button focusing the box, and category browse still working with the
>   search box on screen.
>
> **NEW (2026-09-17, session — being pushed): ONE-ROW SITE NAV.** The homepage
> banner had grown to 13 links over two rows. It is now ONE row: **Browse ▾** (a
> panel of the eight categories in Teach / Practise / More columns, each with a
> blurb and a live card count), four **feature links** — Resources by Stage,
> Games, Adventure, MMT Screen — that keep their colour only in a round icon chip, and
> one amber **Sign in ▾** holding the Student and Teacher dashboards. **Games**
> was moved out of Browse into the feature links (it opens the Games category, and
> lights up while you are in it). At 1080px and below it all folds into a **Menu** sheet. Click to open, never hover (the
> board is often a touch screen); Escape or a click elsewhere closes.
> * **The SAME nav block (CSS + markup + script) is in `index.html` AND
>   `resources/index.html`** — they are the only two pages with `.site-nav`.
>   Change one, change the other. On Resources by Stage the Browse items link to
>   `/?cat=<cat>#browse`, and the homepage now opens that category on load.
> * **Every non-anchor nav link carries `data-label`.** The MMT Screen launcher
>   reads `.nav-links a[href]` for its "places", and the menu blurbs sit inside
>   the links, so `launcher.js` now uses `a.dataset.label || textContent`. Leave
>   `data-label` off a new link and its title will have the blurb glued on.
>
> **NEW (2026-09-17, session — being pushed): RESOURCES BY STAGE — TYPE CARDS.**
> `resources/index.html` no longer lists an outcome's resources as one flat
> column. Each outcome now shows one CARD PER TYPE, in this order: PDFs &
> slides → Interactive tools → Worksheet creators → Student quizzes → Lesson
> plans → Games & cards (empty cards are skipped). A closed topic shows one
> tinted chip per type with its count, and a second row in the controls bar —
> **Show** — filters the whole stage to one type (topics auto-open).
> * The grouping lives in `GROUPS` / `groupOf()` in `resources/index.html`. Files
>   from the manifest → `files`; tool links → by `kind` via `KIND_VARIANT`
>   (flip/flash cards fold into `game`); a manifest `type:"link"` with no kind
>   is placed by its URL folder (`/interactive-tools/` → tool, etc.).
> * `"Worksheet creator"` is now mapped (it used to fall back to the globe).
> * No data files changed — `resourcesManifest.js` and `toolLinks.js` are as before.
>
> **NEW (2026-09-08, session — being pushed): CIRCUMFERENCE OF A CIRCLE.** A
> Stage 4 teaching tool at
> `interactive-tools/stage-4/measurement-space/circumference-of-a-circle/index.html`,
> filed under **MA4-LEN-C-01**. Self-contained inline CSS/JS, same shell and
> tokens as the other Stage 4 measurement tools. Sixteen steps: three diameters
> wound onto the rim one at a time, then the whole circle **rolled out** along
> the number line, then **ten ×10 zooms** onto the end of the circumference,
> then the name. No Firebase, no registry entry, no worksheet creator and no
> student quiz yet — its "Tools ▾" menu is one live row (Perimeter of Plane
> Shapes, which now links back) plus two greyed ones.
>
> * **ONE DIAMETER OF STRING COVERS EXACTLY 2 RADIANS**, because arc = rθ and
>   the diameter is 2r. That single fact is the whole tool: three diameters
>   cover 6 radians, a full turn is 2π ≈ 6.283, so the gap is 2π − 6 radians =
>   **π − 3 = 0.1416 of a diameter**. Every number on screen is derived from it;
>   nothing is a magic constant.
> * **THE NUMBER LINE IS DRAWN AT THE CIRCLE'S OWN SCALE.** One unit on the line
>   is exactly the drawn diameter (`LU = 2R`), so the line is not a record of the
>   count — it IS the circumference unrolled, which is also what makes the
>   roll-out possible: one turn of a wheel of radius R covers 2πR and the line's
>   unit is 2R, so the wheel comes to rest at exactly π. Everything else is
>   forced by that: the line has to reach past 3.14 diameters inside `LW`, so
>   **R can never exceed LW/7**. That is why the viewBox is 1400 wide (a
>   1000-wide one capped R at 135 and wasted a third of the board).
> * **THE WHOLE CIRCLE ROLLS OUT ALONG THE LINE** at step 4 — it does not lift
>   the gap off on its own, which was the first build and never showed where the
>   end point came from. The wheel is the same rim rotated: at progress q the
>   material at angle 2πq is the part touching the line, so `rotate(180 − 360q)`
>   and a travel of `q·π·LU` are two descriptions of ONE motion. A check asserts
>   they agree — that is the no-slipping condition, and it is the whole reason
>   one turn lands on the answer. The band never un-lays what the three
>   diameters already laid (`max(3, q·π)`), and the static circle dims to 0.10
>   behind the rolling one.
> * **EVERY ZOOMED WINDOW IS CENTRED ON THE ANSWER.** Window k is
>   [π − 10⁻ᵏ/2, π + 10⁻ᵏ/2], ten subdivisions wide, so the end of the
>   circumference NEVER MOVES: each press is a pure ×10 scale about a fixed
>   point and the marks simply spread apart and multiply. Round-edged windows
>   (3.1–3.2, then 3.14–3.15, …) were the first build and put the answer at 42%,
>   then 16%, then 59% of the width — the thing being looked at hopped across
>   the board on every press, which is exactly what a class cannot follow. The
>   two marks the answer falls between straddle the middle, in purple, with four
>   more either side.
> * **THE WINDOW CARRIES ITS WIDTH.** At the tenth zoom the window is 10⁻¹⁰
>   wide, and `hi - lo` on two numbers near 3.14 throws away most of the
>   precision the tick positions need. `win(k)` returns `w` and `xOf` uses it.
> * **TEN ZOOMS, THEN A WAY BACK OUT.** The ladder reaches eleven decimal places
>   (3.14159265358 … 359). On the last one, zooming in is greyed out and a
>   **Zoom all the way out** button appears: two seconds back to the whole
>   picture, landing on the naming step, so the last thing the class sees is
>   three diameters and a bit with the bit finally named. `zoomLevel()` returns
>   0 at `S_NAME`; anything indexing zoom levels must call it rather than
>   computing `step - S_ZOOM0`.
> * **THE WRAP IS A REAL WINDING MAP, IN TWO BEATS.** *Lift* moves the straight
>   diameter to where the wrap begins; *roll* winds it on, with the wound part
>   tight against the rim and the rest still LOOSE on radius R+18. Length is
>   preserved at every frame. The first build ran the loose end off along the
>   **tangent**, which is the truer picture but throws a 376px straight tail off
>   the bottom of the board on the second diameter, straight across the number
>   line.
> * **THE SUB-TICKS FLANK THE BAND, THEY DO NOT CROSS IT.** Crossing puts a grey
>   rule straight through the numeral written inside the band; drawing them
>   *under* the band hides the very tenth mark the gap is being read against.
>   Order is band → ticks → numerals.
> * **THE BAND IS DRAWN THE SAME WAY AT EVERY ZOOM LEVEL**, clamped to the board
>   rather than switched for a narrow window. Switching drawing styles part way
>   through a zoom makes the bar visibly jump colour mid-flight.
> * **"NEW CIRCLE" CHANGES THE MEASUREMENT, NOT THE DRAWING** (5, 8, 12, 20 cm).
>   The picture is byte-identical whichever circle is chosen — a check asserts
>   it — because that IS the argument for π being a constant. With **Show the
>   measurements** on (off by default) the same circle also gives
>   C = 25.13 cm and C ÷ d = 3.14, the arithmetic route to the same number.
> * **TEST A NUMBER** (button, or `T`) is the second half of the tool. The class
>   calls out a number, it is wound on, and the verdict says which side it falls
>   and by how much: 5 goes 1.59 times around, 3.1 falls short by 0.0416 of a
>   diameter, 3.14 by 0.00159, 3.142 runs past by 0.000407. Tries accumulate as
>   chips and the tool states the bracket they have squeezed — the same
>   nested-interval hunt as the zoom ladder, done by the class instead of by the
>   tool. One time around is **π diameters, not 2π**.
> * **THE MAGNIFIER IS A CAMERA ON THE CIRCLE ITSELF, NOT A PANEL.** There is no
>   inset lens (that was the first build). The circle is drawn from its own
>   equation at magnification m about the start mark, so m = 1 is the ordinary
>   circle and every larger m is the same circle seen closer — the rim visibly
>   STRAIGHTENS as you go in, which is the thing worth seeing. Two-second zoom,
>   magnification chosen so the miss is ~520px wide, **Closer still ×10** beyond
>   that (capped ×1,000,000), and a corner thumbnail showing which sliver of rim
>   is on screen. A number that misses by more than a diameter cannot be zoomed
>   into — the button greys and the tool says why — because at 5 or 10 diameters
>   the overshoot is already bigger than the circle; 4 zooms only ×1.6, which is
>   right, since there you are meant to see a curve with an overlapped stretch.
> * **THE ANSWER IS NEVER ON THE BOARD EARLY.** 3.14 appears nowhere before the
>   first zoom step, 3.1 nowhere before the roll-out lands, and π is named only
>   at the last step. Checks assert all three at every one of the sixteen steps.
> * **Verified** through Playwright: 361 checks — the wrapping map keeping its
>   length and landing at exactly 2 radians, the gap being π − 3 diameters, one
>   turn of the wheel being π units of the line, the ten windows nesting and
>   each centred on the answer with the end marker at the same pixel every time
>   and the digits building to 3.14159265358, no early answer at any step, the
>   three unit bands each exactly one drawn diameter wide and the gap piece
>   exactly π − 3 of one, the roll-out sampled mid-flight with turn and travel
>   agreeing to 1.5px and the band never shrinking, the zoom-out button
>   appearing only at the last zoom and taking two seconds, Back returning to an
>   identical picture, all four circles drawing the same board, every display
>   toggle, predict-first, all six test numbers with the miss to three
>   significant figures, the tries bracket, the camera zoom at four numbers
>   (magnification, stated size, the rim measurably flattening, ×10 closer,
>   zooming back out) and the two it refuses, the five input refusals, a real
>   click-through with the animation on, and the fit at 1366×768, 1280×800,
>   1024×768 and 1920×1080 including the zoomed test view. Harnesses live in the
>   session scratch, not the repo: `check.mjs`, `shots.mjs`.

> **NEW (2026-09-07, session — being pushed): HALVE AND HALVE AGAIN.** A Stage 3
> teaching tool at
> `interactive-tools/stage-3/number/halve-and-halve-again/index.html`,
> cross-listed under **MA3-MR-01** and **MA3-MR-02**. Self-contained inline
> CSS/JS, same shell and tokens as the other Stage 3 number tools. A bar holding
> the whole number is cut in half, and in half again, until the number of equal
> parts IS the divisor. Built from Jeff's own sketch. Only ÷ 2, ÷ 4 and ÷ 8
> exist, because those are the only divisors repeated halving reaches. No
> Firebase, no registry entry, no worksheet creator and no student quiz yet —
> its "Tools ▾" menu points at the two other Stage 3 division tools (both of
> which now link back to it) with both siblings greyed out.
>
> * **EVERYTHING ON SCREEN IS DERIVED FROM `S.step`.** `partsAt(k)`,
>   `valueAt(k)`, the ladder rows, the dots and the prompt are all folds over
>   that one number, so Back is literally `S.step--` and a repaint, and no two
>   displays can disagree. Never cache a part value or a row.
> * **THE ANSWER IS WHAT ONE PART IS WORTH.** The last press does not consume a
>   part — a COPY of the leftmost one flies out and lands opposite the equals
>   sign while the bar keeps all its parts, and the part it came from turns
>   green. Taking one away would be a different question. A check asserts the
>   bar still holds every part afterwards.
> * **THE NUMBER SENTENCE STAYS OPEN UNTIL THAT LAST BEAT.** The BAR may already
>   show what one part is worth — that is the METHOD, and hiding it would leave
>   nothing to read — but `#sAnswer` is `?` until the copy-out, and a check
>   plays every question right through and FAILS if the answer appears early.
> * **THE SPLIT IS SWELL → POP → FALL, AND ALL THREE BEATS MATTER.** The amount
>   swells first, so the class is looking at the number about to be shared, not
>   at the box. Then it pops. Then the two children start life covering exactly
>   the box their parent filled and slide apart into their own halves —
>   starting them anywhere else shows two numbers ARRIVING rather than one being
>   CUT. That is the whole animation and it is what makes halving visible.
> * **THE HALVING LADDER IS THE WRITTEN RECORD**, revealed a row per split:
>   `96 ÷ 2 = 48`, `48 ÷ 2 = 24`, then "Halved twice" and the total. It is the
>   same job the partial-quotient column does in Division by Grouping — the
>   picture and the written method side by side.
> * **THE CHECK IS DOUBLING BACK UP THE SAME LADDER** — `4 × 24 = 96`, with
>   "Double it back: 24 → 48 → 96". Doubling is the inverse of the thing just
>   done, so the check is READ OFF the picture rather than worked out again.
>   That is also why the tool is cross-listed under MA3-MR-02.
> * **"WHY IT WORKS" IS OFF BY DEFAULT** (teacher decision 2026-09-07):
>   "÷ 4 is ÷ 2 then ÷ 2, because 2 × 2 = 4". The plainest board is the one a
>   teacher gets without asking; the equivalence is a reveal they choose.
> * **"KEEP EACH STAGE ON SCREEN" TURNS IT INTO A HALVING WALL** (off by
>   default): every completed stage stays above the live bar, muted and half
>   height, with a row label naming it. All the bars share one fixed 62px label
>   gutter so they start and end at the same x — a wall only reads as halving if
>   the wholes line up. With one bar the gutter is REMOVED (`.barStack.solo`),
>   because the label just repeats the chip and costs the bar 62px.
> * **HOW TALL THE BAR CAN BE IS A QUESTION ABOUT HEIGHT, AND IT IS MEASURED.**
>   `fitBar()` binary-searches `--barH` against the real page: grow until the
>   control card would drop below the fold, then step back. A guessed clamp left
>   a third of a 1366×768 screen empty on a one-bar question. It is ALSO capped
>   by width — `(barWidth / divisor) × 1.7` — because eight parts of a 1024-wide
>   board are 83px across and a full-height bar turns them into tall columns,
>   which stops reading as a bar. The cap uses the FINAL divisor, not the
>   current part count, so the bar does not change height between steps.
> * **THE BAR IS SIZED BEFORE ANYTHING IS DRAWN IN IT**, because the height is
>   what sets the size of the numerals inside each part (`numSize`).
> * **SLOTS ARE COMPUTED IN REAL PIXELS**, not percent, for the same reason.
> * **THE QUESTION IS READ BEFORE THE BOARD EXISTS**, same as the bubbles tool:
>   an intro veil carrying the sentence alone, and `dismissIntro()` FLIPs that
>   SAME element down onto the card. `buildBar()` runs again after it lands,
>   because the board was sized while the veil was over it.
> * **EVERY DIVIDEND IS A MULTIPLE OF ITS DIVISOR**, so every halving on the way
>   down is a whole number and no part is ever a fraction. Quotients are at
>   least 3 — 8 ÷ 4 is a picture of nothing. "Type your own" refuses a number
>   that will not halve all the way down and says which multiple to try.
> * **Verified** through Playwright: 482 checks — 4800 generated questions over
>   every divisor mode and number range (exactness, digit range, quotient floor,
>   no repeat, mixed really dealing all three), ten questions played right
>   through with the part count doubling, every part carrying the halved value,
>   the parts equal and filling the bar, the ladder and the dots re-derived, the
>   answer never on the card early, the check block only at the end and saying
>   the inverse, Back returning exactly to the whole bar, the chip and the part
>   names, all three "why it works" texts, the wall's rows lining up, the
>   typed-question refusals, the swell/pop/fall sampled mid-animation, the
>   copy-out duplicating rather than consuming, and the fit at 1366×768,
>   1280×800, 1024×768, 1920×1080 and 820×1180 with no number spilling its part
>   and no part becoming a tall column. Harnesses live in the session scratch,
>   not the repo: `check.mjs`, `shots.mjs`.
>
> **NEW (2026-09-05, session — being pushed): DIVISION BY GROUPING — STUDENT
> QUIZ.** `online-quizzes/stage-3/number/division-grouping.html`, the third page
> of the family. Registered in `portal/shared/mmtToolRegistry.js` as
> `division-grouping-quiz`, writing `tool: "division-grouping-student-quiz"`, so
> a teacher can set it from the dashboard. The tool's "Tools ▾" menu is now two
> live rows and nothing greyed.
>
> * **THE ENGINE IS THE TEACHING TOOL'S, COPIED.** The packing, the
>   fly-and-duplicate round, the derived totals and the overshoot bounce are the
>   tool's, so a bubble does the same thing in the quiz as it did on the board.
>   Fix one and port it to the other.
> * **THE LEVEL IS HOW MUCH OF THE TOOL THE STUDENT KEEPS**, the same design as
>   the Perimeter quiz. **Sweet** hands over the whole thing — bubbles, running
>   total, partial-quotient table, quick numbers. **Mild** drops the table.
>   **Medium** drops the running total AND the quick numbers, so the student has
>   to keep track of how much they have shared. **Spicy** takes the bubbles away
>   entirely. The numbers climb alongside, but the withdrawal of the model is the
>   real ladder.
> * **THE TOOL MUST NOT ANSWER THE QUESTION OUT LOUD.** The teaching tool
>   announces "Each group has 14" when the sharing completes and prints the
>   answer in the sentence; here `paintSentence` keeps the `?` until the question
>   is marked, the completion prompt asks the student to write it instead, and
>   the check sentence and ladder total are gone. A check plays every level right
>   through and FAILS if the sentence ever shows the answer before marking. The
>   bubbles themselves still show what is in a group — that is the METHOD, not a
>   spoiler, and taking it away would leave nothing to use.
> * **"HOW MANY LEFT?" IS A PICTURE TO BE READ, NOT DRIVEN.** One round is
>   already in the bubbles and the question is what is still to share, so the
>   sharing controls are hidden AND the running total is withheld — it would
>   simply be the answer.
> * **FIVE KINDS, WITH SUBTOTALS.** share it out / how many left / with a
>   remainder / missing factor (`6 × ? = 84`) / use it. `types[]` carries one
>   `kind:x/y` flag per kind plus the level, so the dashboard can see WHICH part
>   went wrong. The missing-factor kind is why the quiz is cross-listed under
>   MA3-MR-02 as well.
> * **ONLY THE REMAINDER KIND HAS REMAINDERS**, and it is Spicy only. A
>   remainder question shows a second box and both numbers must be right.
> * **ORDERING IS DONE IN ONE PASS, NOT DURING GENERATION.** Two things want
>   spreading out — the KIND, so a level is not four blocks of the same question,
>   and the NUMBER OF GROUPS, because ÷5 twice running is one question asked
>   twice. Generating in a good order does not survive the interleave that
>   follows it; a hill-climbing repair afterwards gets stuck. Both are done
>   greedily in one pass: take the question that breaks a divisor run first, a
>   kind run second, and otherwise whichever number of groups is commonest in
>   what is left, which is what stops a divisor being stranded at the end.
> * **ONLY THE FIRST ATTEMPT SCORES.** A wrong answer goes red and stays
>   editable so the student finishes the thinking; the dashboard number means
>   what it says. Pressing Next on an unanswered question settles it and reveals.
> * **THE LOGIN AND THE SAVE ARE THE SHARED ONES.** One
>   `<script src="/portal/shared/quizAuthUI.js">` before `</body>` and a
>   `window.MMTSave()` call on finish — no Firebase config, no keys and no
>   sign-in markup inlined in the quiz, and a check asserts that. `earlySubmit.js`
>   is imported for the "Finish & submit" button, and the payload carries
>   `MMTSubmit.fields()`. **No typed answer is ever in the payload**, which a
>   check also asserts.
> * **Verified** through Playwright: 86 checks — the shared auth plumbing and no
>   inlined Firebase, the level ladder withdrawing one layer at a time, 240
>   generated papers (identity, ranges, kinds, no repeats, no divisor run), every
>   level played right through for full marks with the answer never on screen
>   early, a right answer on the second go scoring nothing, the tool sharing 84
>   into six groups and the overshoot still bouncing back, exactly what each level
>   hands over, the "how many left?" picture and its withheld total, remainders
>   needing both boxes, the whole save payload, and the fit at 1366×768, 1280×800,
>   1024×768 and 820×1180. Harnesses live in the session scratch, not the repo:
>   `qcheck.mjs`, `qshots.mjs`.

> **NEW (2026-09-05, session — being pushed): DIVISION BY GROUPING — WORKSHEET
> CREATOR.** `worksheet-creators/stage-3/number/division-grouping.html`, the
> printable sibling of the teaching tool and cross-listed under the same two
> outcomes (**MA3-MR-01**, **MA3-MR-02**). Same shell, A4 machinery and
> trilingual EN/AR/FA convention as the other creators; the tool's "Tools ▾"
> menu is now a live row pointing at it, with only Student Quiz still greyed.
>
> * **THE BUBBLES ARE PRINTED, AND THAT IS THE POINT.** A student shares out a
>   chunk at a time on paper exactly as the class did on the board. **Draw the
>   bubbles** is a toggle, because the same paper is wanted again once a class
>   no longer needs the picture — with it off, every question becomes the table
>   plus a ruled working box.
> * **FOUR SECTIONS, AND THE PICTURE COMES OFF LAST** (teacher feedback
>   2026-09-05). **A Share it out** — bubbles drawn, the student's own chunks.
>   **B Some left over.** **C Draw your own bubbles** — an empty box and nothing
>   else; a student who can draw the groups themselves owns the model, and one
>   who cannot has only been filling in someone else's. **THE BOX GROWS TO FILL
>   ITS CARD** (teacher feedback 2026-09-05) — cards in a grid row are as tall as
>   the tallest, so a fixed height gave the ÷3 question visibly less room to draw
>   in than the ÷5 beside it, and for a task that is entirely about drawing the
>   space IS the question. Its MINIMUM still comes from how the tool would have
>   packed them, so a ÷9 is never given less than three rows' worth, and the
>   `.qFill` spacer is left off a draw card or the two would fight. **D Use it.**
>   The paper opens on 4, 4, 2 and 2 questions.
>   A "Finish the sharing" section that pre-filled the first round WAS built and
>   was REMOVED: reading a worked round and then continuing it is more to hold
>   in your head at once, not less. A "just the table" section went with it —
>   the table is now an option on every question instead of a section of its own.
> * **THE DEFAULTS ARE BARE: ONLY THE BUBBLES** (teacher decision 2026-09-05).
>   The table, the check sentence, the fewer-rounds prompt and the answer key
>   all start OFF, so the plainest paper is the one a teacher gets without
>   asking and each extra is a deliberate choice.
> * **WHATEVER A PAGE LEAVES IS A QUESTION OF THE STUDENT'S OWN** — "Design your
>   own question", with a sentence to fill in and ruled room. A "Working" box was
>   there first and says nothing; writing your own division question is the same
>   skill read backwards.
> * **ONLY THE REMAINDER SECTION HAS REMAINDERS.** Sprinkling them through the
>   spicy questions in other sections was tried and it contradicts the section's
>   own heading — "share it out" with an r-box on the end is a different question.
> * **THE KEY'S CHUNKING IS PLACE VALUE, BIGGEST FIRST** — 43 is 40 then 3, not
>   20 + 20 + 3. `chunksOf()` is checked over every quotient to 600: the parts
>   sum to the quotient, each is a single digit times a power of ten, and they
>   descend. That is what makes the ladder the bridge to short division rather
>   than just a tidy record.
> * **NOT THE SAME NUMBER OF GROUPS TWICE RUNNING.** Three ÷2 questions in a row
>   is not a ladder, it is one question asked three times.
> * **EVERY QUESTION ENDS WITH THE INVERSE** — `6 × ___ = 84` — so an answer can
>   be tested rather than believed, and division and multiplication are written
>   side by side. That is why the paper is cross-listed under MA3-MR-02.
> * **A BUBBLE IS 27mm ACROSS, AND THE SAME SIZE ON EVERY QUESTION** (teacher
>   feedback 2026-09-05: young hands write large numbers and must not run out of
>   room). The SVG is capped at `per × 27mm` — capping it is also what stops a
>   ÷4 question printing circles twice the size of a ÷6 one, which reads as
>   though the groups were different. Seven or more groups spans TWO columns, or
>   there is no room to write in them.
> * **THE CHECK LINE IS PINNED TO THE BOTTOM OF ITS CARD** (`.qFill` grows).
>   Cards in a grid row are as tall as the tallest, so without it a short
>   question printed a hole in its middle instead of writing room.
> * **PAGES ARE FILLED, NOT BALANCED.** Spreading rows evenly across the pages
>   was tried and is worse on paper: it leaves a visible gap on EVERY page
>   rather than one at the end. Rows are measured for real (a `.qGrid` sits
>   flush against the next, so a row costs exactly its own height — a guessed
>   gap is what made the packer break a page early), and whatever a page leaves
>   becomes a ruled **Working** box, or on the last page the **fewer-rounds
>   prompt**. Both boxes are capped, and a post-render pass measures the real
>   page and takes any overshoot back off the filler, so the filler can never be
>   what pushes a card past the print budget. The packing is done against
>   **281mm**, not the 297mm the preview shows, because print margins take the
>   difference.
> * **THE PROMPT IS NEVER SILENTLY DROPPED.** If the last page cannot hold it,
>   it gets a page of its own rather than vanishing.
> * **THE WORD PROBLEMS ARE ALL SHARING QUESTIONS**, never "how many groups of
>   6?" — that is a different picture and the bubbles do not model it. A check
>   asserts every one of them asks how many in EACH group.
> * **AR/FA WANT A FLUENT PROOFREAD**, as in the other creators.
> * **Verified** through Playwright: 106 checks — the bare defaults and the 4/4/2/2
>   counts and what Reset returns to, every drawing space in a row being the same
>   size and reaching the bottom of its card, the draw-your-own space growing with the number of groups
>   and drawing nothing for the student, every printed bubble measured between
>   15mm and 25mm, a leftover box in the remainder section and nowhere else, no
>   section asking the same number of groups twice running, no question ever
>   printed as a bare sentence with nowhere to work, every quotient to 600 chunked
>   and re-derived, 2500 generated questions satisfying d × q + r = dividend
>   with their chunks summing to q and each section's own rules, the divisor
>   tick-list obeyed, the key mirroring the worksheet question for question and
>   every answer re-derived from its own question, nothing falling off a page at
>   three densities and with the bubbles off, no page that could have held
>   another question, each section alone, a 58-question paper, both refusals,
>   all three languages with the numerals staying Western, and the word problems
>   being sharing questions. Harnesses live in the session scratch, not the
>   repo: `wscheck.mjs`, `wsshots.mjs`.

> **NEW (2026-09-05, session — being pushed): DIVISION BY GROUPING — BUBBLES.**
> A Stage 3 teaching tool at
> `interactive-tools/stage-3/number/division-grouping-bubbles/index.html`,
> cross-listed under **MA3-MR-01** and **MA3-MR-02**. Self-contained inline
> CSS/JS, same shell and tokens as the Stage 4/5 tools. The teacher types how
> many go in EACH group; the number flies to the first bubble and then copies
> itself into every other one while a running tally counts up. No Firebase, no
> registry entry, no worksheet creator and no student quiz yet — its "Tools ▾"
> menu points at the two other Stage 3 number tools and Factor Circles, with
> both siblings greyed out.
>
> * **THE BUBBLE SIZE IS THE ANSWER, WHICH MAKES THIS SHARING, NOT MEASURING.**
>   `84 ÷ 6` is drawn as SIX bubbles and the question is how many go in each —
>   the partitive reading. The quotitive one ("how many groups of 6?") is a
>   different picture and is deliberately not what this tool shows; if it is
>   ever wanted it needs a second mode, not a relabelled arena.
> * **THE DUPLICATION IS WHAT ENFORCES EQUALITY.** A teacher cannot put a
>   different amount in a different bubble, because one entry fans out to all of
>   them. Equal groups are a property of the mechanic, not a rule anyone has to
>   remember, and that is why there is no per-bubble editing.
> * **THE TALLY COUNTS AS EACH COPY LANDS, NOT ONCE AT THE END** — 10, 20, 30,
>   40, 50, 60 for a round of 10 into six groups. That IS skip counting, and it
>   is the whole reason the copies are staggered rather than fired together.
>   Anything that batches the landings destroys it.
> * **THE GROUPS ARE AN ARRAY, NOT A STRIP** (teacher feedback 2026-09-05).
>   `GRID` maps the divisor to a shape — 6 is 3 × 2, 4 is 2 × 2 — and 2, 3 and 5
>   stay in one row because they have no second factor worth drawing. The width
>   a strip of six was wasting goes into the bubbles instead.
> * **HOW BIG A BUBBLE CAN BE IS A QUESTION ABOUT HEIGHT, AND IT IS MEASURED.**
>   `fitArena()` binary-searches `--bubMax` against the real page: grow until the
>   entry bar would drop below the fold, then step back. A guessed `vh` cap left
>   39px of a 1366×768 screen unused and overflowed a shorter one; the measured
>   fit gives 155px bubbles at 1366×768 and the full 186px at 1080p, from the
>   same code. It re-fits on a rebuild and on a debounced resize, and is a no-op
>   when nothing that matters has changed.
> * **THE QUESTION IS READ BEFORE THE BOARD EXISTS** (teacher decision
>   2026-09-05). Every new question opens on a veil carrying the sentence alone
>   and a **Next** button. Pressing Next does NOT swap one sentence for another:
>   `dismissIntro()` FLIPs the SAME element down onto the card (measure both
>   rects, translate + scale, fade the backdrop out from under it), so the thing
>   the class just read is the thing the bubbles are about. The veil sits at
>   `z-index:30`, UNDER the topbar, and `showIntro()` closes any open menu —
>   the Settings menu is at 120 and would otherwise sit on top of it. Settings
>   toggle: **Read the question first**, on by default.
> * **THE CARD HOLDS THE SENTENCE AND NOTHING ELSE** (teacher feedback
>   2026-09-05). The "84 shared equally into 6 groups" line is gone — the prompt
>   bar, the `6 equal groups` chip and the entry's "Put in **each** group" all
>   carry the partitive reading already. The outcome tag and the dice button are
>   taken out of the flow, and `fitEqCard()` pads the card by their width on BOTH
>   sides so the sentence's centre and the card's centre are the same point
>   whatever the numbers do. Below 1180px the dice button drops its words rather
>   than let a three-digit sentence collide with it; if it still cannot fit, the
>   card stacks.
> * **THE STRATEGY IS PARTIAL QUOTIENTS.** Rounds accumulate, so 10 then 4 into
>   six groups reaches 84 and the ladder records `6 × 10 = 60`, `6 × 4 = 24`,
>   then `10 + 4 = 14 in each group`. That column IS the bridge to short and
>   long division: the chunks a student chooses are the digits they will later
>   write above the bracket. Do not "help" by suggesting the efficient chunk —
>   the rounds counter is there so a class can be asked whether it could have
>   been done in fewer.
> * **THE GROUPS PACK LIKE STACKED PIPES, AND THE DIVISOR GOES TO TEN** (teacher
>   feedback 2026-09-05). `PACK` maps the divisor to rows — 5 is 3 over 2, 7 is
>   4 over 3, 9 is 3+3+3, 10 is 5+5 — and every row is CENTRED, so a short row
>   sits in the gaps of the row above. Rows are equal wherever the number allows
>   it (4, 6, 8, 9, 10), because equal rows are what "equal groups" should look
>   like. 2, 3 and 5 across in one row have no second factor worth drawing.
> * **"TYPE YOUR OWN" IS TYPED ON THE LOAD SCREEN** (teacher feedback
>   2026-09-05): the intro's sentence becomes an input plus a row of 2–10 chips,
>   and the numbers the teacher types are what flies onto the card — there is no
>   second copy of the question anywhere to disagree with it. The Settings
>   inputs that used to do this are GONE; they closed the menu the moment the
>   level changed and could not be reached. Choosing that level forces the intro
>   on and disables its toggle, or there would be nowhere to type.
> * **AN OVERSHOOT FLIES OUT AND BOUNCES BACK.** Teacher decision 2026-09-05:
>   blocking the entry before it moves hides the very thing worth seeing. The
>   copies fly, the tally goes red AT THE GROUP THAT TIPS IT OVER (so a class can
>   see 4 groups of 20 was fine and the fifth was not), then everything flies
>   home and NOTHING is kept. `S.rounds.pop()` is the entire undo, because…
> * **EVERY DISPLAY IS DERIVED FROM `S.rounds`.** `bubbleValue(i)`, `usedTotal()`,
>   `eachTotal()` and `remaining()` are all folds over that one array, and a
>   round carries `landed` = how many groups have received it so far. So a
>   half-finished flight, an undo and a bounced overshoot are the same operation
>   and cannot disagree with each other. Never cache a total.
> * **A MID-OVERSHOOT TALLY NEVER SHOWS A NEGATIVE.** "Still to share − 36" is
>   not a number this class has met; the row relabels itself to "Too many by 36",
>   and to "Left over" once a remainder question finishes.
> * **AN EXACTLY-DIVIDING QUESTION CAN NEVER STRAND A PART-GROUP.** Used is
>   always a multiple of the divisor, so what is left is too — a teacher can
>   never be left holding fewer than one each. That property is what lets the
>   finish rule be the single line `left === 0 || left < divisor`, which also
>   gives the remainder levels their ending for free. Checked exhaustively.
> * **THE COUNTERS ARE COLOURED BY ROUND, NOT BY PLACE.** With counters on, a
>   bubble holding 43 after rounds of 40 and 3 shows four blue rods and three
>   green dots — the chunks stay visible inside the total. Hundreds become flats
>   so a 3-digit bubble stays compact.
> * **THE CHECK SENTENCE LIVES INSIDE THE LADDER CARD.** As its own card the
>   right-hand column ran 42px past the fold at 1366×768 exactly when it
>   mattered — the moment a question is finished. Two cards became one; the
>   ladder card is shown when EITHER the ladder or the check sentence is wanted.
> * **THE TALLY STAYS BESIDE THE BUBBLES DOWN TO 960px.** A 1024×768 projector
>   is a real classroom, and a running total you have to scroll to is not a
>   running total. The side column is `clamp(266px,24vw,336px)` and the topbar
>   drops its brand text at 1180px so it never wraps to two rows.
> * **Verified** through Playwright: 232 checks — 3600 generated questions across
>   the three levels for range, exactness and no back-to-back repeats; the
>   divisor lock; scripted solves in one round, two rounds and fourteen rounds of
>   1 agreeing; the tally, the ladder rows, the "left" column and both check
>   sentences re-derived; the overshoot keeping nothing and the question still
>   finishing afterwards; undo and start-again; remainders and the leftover tray;
>   the answer absent from the screen until the question is done; the counters
>   drawn in every bubble summing to that bubble's number; input guarding
>   (empty, non-numeric, zero, negative, decimal, absurd); custom numbers and the
>   refusal of more than six groups; a real flight sampled mid-animation to prove
>   the groups fill one at a time and the tally climbs with them; the array
>   shape, bubble sizing and reading order at every divisor; the intro veil
>   covering the board, holding the entry shut, flying the sentence to within
>   40px of its landing place and leaving nothing stranded; and the sentence
>   staying centred and clear of the tag for four question widths at five
>   viewports. Harnesses live in the session scratch, not the repo:
>   `check.mjs`, `shots.mjs`.

> **NEW (2026-09-02, session — being pushed): THE WORKING PAD.** A drag-and-drop
> scratchpad beside the figure, shared by the teaching tool (Settings → **Working
> pad**, off by default) and the student quiz (always on, every level). One
> source: it lives in the TOOL between sections 5 and 6 and the quiz's extractor
> carries it across with the engine — edit it in the tool, re-cut, rebuild.
>
> * **WHAT IT IS FOR.** Adding a dozen sides is not the skill; keeping track of
>   WHICH ONES YOU HAVE ALREADY USED is where the marks go, and on paper it is
>   invisible. Drag a side off the figure and it lands in the pad as a number
>   and the side turns GREEN, so what is left to count is obvious at a glance.
> * **THE PAD NEVER ADDS FOR YOU.** Dropping one number on another opens "What
>   is the sum?" and the two only become one when the student says what they
>   make — the same combine-by-answering rule as the **Row & Column
>   Challenge** (`games/row-column-challenge.html`), deliberately, so a class
>   meets the mechanic twice. A wrong sum shakes the box and changes nothing.
> * **A `?` CANNOT BE DRAGGED IN.** It has to be found first, which keeps the
>   sides-before-adding order intact even at the levels where the animation is
>   switched off. Dropping a number outside the pad sends it back to the figure.
> * **THE DROP TEST IS CENTRE TO CENTRE, NOT POINTER-IN-BOX** (teacher feedback
>   2026-09-02). Asking whether the CURSOR is inside the target's rectangle is
>   far too mean: two numbers can sit visibly on top of each other while the
>   pointer is off the edge of both, and nothing happens. `nearestTile` measures
>   centre to centre with a 58px reach — wide enough that a visible overlap
>   always counts, tight enough that numbers merely parked side by side do not
>   ask to be added — and a tile drag is judged from the DRAGGED TILE'S own
>   centre, not from where the student grabbed it.
> * **A SIDE CAN BE DROPPED STRAIGHT ONTO A NUMBER.** Landing it in a space
>   first and dragging it again is a step nobody wants. If the pairing is then
>   cancelled the newcomer is moved to a space of its own, so it is not left
>   sitting on top of the number it did not join.
> * **THE PAD IS TOGGLED ON SCREEN, NOT IN A MENU** (teacher feedback
>   2026-09-02): a `.padOpenBtn` beside the figure in both hosts, plus a slim
>   fold-away rail down the side of the panel. **FOLDING IS NOT SWITCHING OFF** —
>   `collapse()` keeps every tile and every green side, because a student who
>   wants a bigger figure for a moment must not lose their counting; only
>   `enable(false)` (or a new figure) clears it. The tool starts folded, the
>   quiz starts open.
> * **THE HOST HANDS IT `SRC`** — `{edges, unit, busy, render}` — so nothing in
>   the pad knows which page it is on. `render()` is how the green gets back
>   onto a rebuilt board: the engine's `render()` ends with
>   `if (window.__PAD__) window.__PAD__.paint()`, and `resetWalk()` calls
>   `PAD.reset()` so a new figure starts a clean pad.
> * **TWO TRAPS.** (1) The pad can be switched on BEFORE the first figure
>   exists, so `repaint()` must not call `render()` with `S.shape` null.
>   (2) A drag that starts on a side also arrives as a CLICK on it when you let
>   go — which opens the side editor — so any click within 320 ms of a real
>   drag is swallowed in the capture phase.
> * **Verified**: `padcheck.mjs`, 19 checks driving the real mouse — every side
>   dragged in, the green count, no side twice, the sum prompt refusing a wrong
>   answer, joining down to one tile that equals the perimeter, undo, a new
>   figure clearing the pad, a `?` refused, and switching the pad off clearing
>   the green. Plus 20 more inside the quiz's own harness.

> **NEW (2026-09-02, session — being pushed): PERIMETER OF PLANE SHAPES —
> STUDENT QUIZ.** `online-quizzes/stage-4/measurement-space/perimeter-plane-shapes.html`,
> the third page of the family and the one the tool's "Tools ▾" menu finally
> points at in full (both rows are now live). Registered in
> `portal/shared/mmtToolRegistry.js` as `perimeter-plane-shapes-quiz`, writing
> `tool: "perimeter-plane-shapes-student-quiz"`, so a teacher can set it from
> the dashboard.
>
> * **THE LEVEL IS HOW MUCH OF THE TOOL THE STUDENT KEEPS.** That is the whole
>   design and it is a teacher decision (2026-09-02), not an accident of
>   difficulty. **Sweet** hands over the teaching tool entire: click a `?` and
>   the side flies across, trace the perimeter and the number sentence builds
>   term by term. **Mild** is the same tool with a wider bank and NO number
>   sentence. **Medium** takes the clicking away — the figure is to be READ —
>   and the trace becomes a plain blue line. **Spicy** is the worksheet's spicy
>   bank (staircases, combs, decimals), read-only, half missing sides.
> * **THE TOTAL IS NEVER ON THE SCREEN.** The engine's `paintTotal` and
>   `paintFormula` are replaced with empty functions and `paintExpression`
>   stops at "= ?", because the tool's running total IS this page's answer.
>   A headless check re-derives every perimeter and fails if that number can
>   be found in the visible text before the student has answered — a perimeter
>   is always longer than any one side, so it can never be a label by
>   coincidence.
> * **"Reveal all sides" IS GONE ON PURPOSE.** Sweet and Mild students click
>   each side themselves; there is no button that does it for them.
> * **SWEET IS WHOLE NUMBERS AND NO COMPOSITES** (teacher decision 2026-09-02):
>   the worksheet's Medium bank with L, T and the cross taken out, scale fixed
>   at 1. The cross went with the other two because it is a harder composite
>   than either.
> * **ENTER MARKS, THEN MOVES ON — AND THE BOX MUST STAY FOCUSABLE.** A
>   `disabled` input drops focus and stops firing `keydown`, so the second
>   Enter went nowhere. It is `readOnly` and refocused instead.
> * **THE WORKING PAD IS ON AT EVERY LEVEL.** It is not a difficulty setting,
>   it is the workbench — see the 2026-09-02 working-pad block.
> * **THE ENGINE IS THE TEACHING TOOL'S, COPIED.** Everything above the quiz
>   layer is lifted from `interactive-tools/.../perimeter-plane-shapes/` so a
>   figure behaves identically in class and in the quiz. Only FOUR things were
>   patched: `chooseKey` reads the level's pool, `resetWalk` drops the predict
>   row and the side editor, and both the walk's stop-at-a-missing-side rule
>   and the click target now ask `QUIZ.stopAtMissing()` / `QUIZ.canAnimate()`.
>   Fix a shape in one place and port it to all three files.
> * **TWO SIDES TO FIND IS THE MOST ANY FIGURE ASKS.** A regular pentagon can
>   legitimately carry one number and four tick marks, but four clicks to
>   start a question is a chore, not a lesson. A third of figures come fully
>   labelled so students cannot answer by reflex.
> * **A MISSING-SIDE QUESTION SHOWS EXACTLY ONE `?`.** Otherwise it has no
>   single answer. The sides a derivation reads from are always labelled, so
>   re-knowing the others can never strand the one that is kept; a check
>   asserts both.
> * **ONLY THE FIRST ATTEMPT SCORES.** A wrong answer goes red and stays
>   editable so the student finishes the thinking, but the dashboard number
>   means what it says. Once a question is settled every side is revealed, so
>   they can see where it went wrong.
> * **Verified** through Playwright: 77 checks — every level's bank re-derived
>   from its own geometry, the pools obeyed, what each level lets the student
>   hold (clickable sides, the number sentence, whether the trace stops at a
>   `?`), the answer never on screen, marking and the score, the certificate
>   and the exact save payload, the fit at 1366x768, and zero label collisions
>   over 24 generated papers. Harness: `check.mjs` in the session scratch.

> **NEW (2026-09-01, session — being pushed): PERIMETER OF PLANE SHAPES —
> WORKSHEET CREATOR.** `worksheet-creators/stage-4/measurement-space/perimeter-plane-shapes.html`,
> the printable sibling of the teaching tool and cross-listed under the same
> outcome (**MA4-LEN-C-01**). Same shell, A4 machinery and trilingual EN/AR/FA
> convention as the Unit Conversion creator; the tool's "Tools ▾" menu is now a
> single live row pointing at it, with only Student Quiz still greyed out.
>
> * **THE FIGURES ARE THE TEACHING TOOL'S OWN.** The whole geometry section is
>   lifted from `interactive-tools/.../perimeter-plane-shapes/`, with
>   `applyReasoning` taking the missing-side mode as an ARGUMENT instead of
>   reading tool state. Fix a shape in one place and port it to the other.
> * **FIVE SECTIONS, AND THE ORDER IS THE POINT.** **A Find the missing side**
>   asks for one length and explicitly *no perimeter* — the commonest Year 7
>   error is adding four numbers when the figure has six sides, so the sides
>   get a section of their own. **B** is perimeter with every side labelled,
>   pure addition. **C** puts the two steps together. **D Work backwards**
>   gives the perimeter and takes a side away. **E Use it** is short Australian
>   contexts. Teacher choice 2026-09-01: no "use the shortcut" section.
> * **EQUAL SIDES ARE MARKED, NOT REPEATED — IN EVERY SECTION.** Teacher
>   feedback 2026-09-01: three `17.5 cm` labels crammed into one notch. So
>   `markEqualSides` groups edges by their LENGTH on the finished figure (not
>   by the builder's `cls`, which composites do not set), gives each class its
>   own tick count, and prints the value ONCE — the rest carry the marks alone
>   (`e.hide`). Capped at three classes; nobody counts four tick marks. A side
>   printed in another unit is left out of the grouping, because its text does
>   not match its partners'.
> * **THE MARKS ARE NOT OPTIONAL.** The toggles for equal-side and right-angle
>   marks were REMOVED (teacher feedback 2026-09-01): without them an
>   unlabelled side cannot be assumed equal and the question has no answer.
>   Headless checks assert every hidden side has a visible equal partner with
>   the same tick count, that no two different lengths share a tick count, and
>   that everything printed is still enough to answer the question.
> * **WORK BACKWARDS HAS TWO SHAPES.** An equal-sided figure (square, rhombus,
>   equilateral, regular polygon) gets NO side labelled and P ÷ n is the
>   question; everything else has every side but one, and the answer is P minus
>   the rest.
> * **THE ANSWER KEY GIVES THE REASON.** `whyOf` prints "equal to the 9 cm
>   side", "4 + 3 = 7 cm" or "16 − 9 = 7 cm" under every answer, so the key can
>   be handed to a student. Do not reduce it to bare numbers.
> * **FOUR THINGS MAKE THE PAGE FILL, AND THE LAYOUT REPEATABLE.** Teacher
>   feedback 2026-09-01 was that the spacing was hit and miss and re-generating
>   gave a different fit each time. Measured, the causes were:
>   (1) every figure had its OWN viewBox aspect, so one card was half again as
>   tall as its neighbour and the grid row stretched to the tallest — now a
>   FIXED `VBW × VBH` box, and every figure card is exactly the same height;
>   (2) the worksheet and the key shared one pagination while a key card runs
>   up to 138px taller than the blank one it mirrors (the reason line), so the
>   worksheet reserved the KEY's height and left ~100mm of every page blank —
>   the two halves are now paginated SEPARATELY, same questions, same order;
>   (3) heights that varied per run — the randomly chosen reasoning prompt and
>   the word cards — are now pinned (probe the TALLEST prompt, and
>   `.qCard.word` has a min-height), which makes the page count identical on
>   every press of Generate;
>   (4) whatever the questions leave is taken by the reasoning box, or by a
>   ruled **Working** box when the prompt is off, and neither carries a
>   max-height any more. Worksheet waste is now 3mm in every configuration.
> * **PACKING IS MAXIMIN, THEN DE-WIDOWED.** Rows only fit a page in whole
>   numbers, so tightening the cap does nothing until it crosses a threshold —
>   searching for the first cap that still fits just returns greedy. Every cap
>   is tried and the packing with the FULLEST emptiest page wins. A uniform cap
>   still cannot say "three rows here but stop before the word problems there",
>   so `deWidow` then pulls whole rows back off the second-to-last page until
>   the last one carries its weight, and re-derives the "continued" flags.
>   9, 9, 6, 1 became 9, 9, 4, 3.
> * **THE PACKER WALKS REAL ROW HEIGHTS.** Every card is measured in the probe,
>   per half, and the pages are filled row by row. Sampling one row drops a
>   card under the page footer.
> * **NOT THE SAME SHAPE TWICE RUNNING**, and the Sweet tier is four shapes,
>   not two — squares and rectangles were a third of every paper.
> * **THE LABEL SOLVER IS THE TOOL'S, AND SO ARE ITS TRAPS.** Real metrics from
>   a hidden `#probeText`; most-constrained-first placement with each label free
>   to sit either side of its own line; then relaxation; then the type steps
>   down. **`#probeText` MUST carry `text-anchor:middle; dominant-baseline:middle`**
>   — a start-anchored probe hands the solver an offset of half the label width
>   and every box lands wrong, which is exactly the bug that put labels outside
>   their figures on the first run. And `PADX` must be wide enough to hold a
>   whole label outside the figure, or the clamp drags numbers back over the
>   shape's own edge.
> * **Verified** through Playwright: 115 checks including every generated answer
>   re-derived from the geometry at all four levels, the shape tick-list obeyed,
>   nine different papers checked for label collisions / labels outside their
>   figure / cards under the page footer, the answer key mirroring the worksheet
>   question for question, all three languages with the units staying Western,
>   and the control panel's warnings and reset. Harness: `check.mjs` in the
>   session scratch, not the repo.

> **NEW (2026-09-01, session — being pushed): PERIMETER OF PLANE SHAPES.** A
> Stage 4 teaching tool at
> `interactive-tools/stage-4/measurement-space/perimeter-plane-shapes/index.html`,
> filed under **MA4-LEN-C-01**. Self-contained inline CSS/JS, same shell and
> tokens as the Unit Conversion tool. It takes the perimeter trace from the
> Area Model Splitter and drops the grid entirely: plane shapes drawn TO SCALE
> from their own side lengths. Teacher choice 2026-09-01: its "Tools ▾" menu is
> ONE live row — the **Worksheet Creator** — with Student Quiz greyed out; the
> Splitter links back. No Firebase, no registry entry, no student quiz yet.
>
> * **THE TRACE REFUSES TO WALK PAST AN UNLABELLED SIDE.** This is the whole
>   tool. The walk stops dead at a `?` side, that side pulses, and the prompt
>   asks for it to be clicked; resolving it resumes the walk automatically from
>   the same index. The common Year 7 error is not adding wrongly, it is adding
>   four numbers when the figure has six sides, so the tool makes that
>   impossible rather than marking it afterwards. `S.waitingOn` holds the index;
>   `resolveEdge` re-enters `runWalk()` only when it matches.
> * **A MISSING SIDE IS FOUND, NOT GUESSED.** Clicking a `?` flies a GHOST of
>   the side it comes from across the figure and lays it on top. THREE forms,
>   all declared per shape as `derive`:
>   `{type:'copy', from:[i]}` for an equal side; `{type:'sum', from:[i,j,...]}`
>   for a long side, where the ghosts land END TO END so they visibly cover it;
>   and `{type:'part', whole:w, others:[...]}` for a SHORT side, where the other
>   pieces fly onto the (labelled) long side and stop short.
>   **THE `part` SEQUENCE HAS FIVE BEATS AND THEY ARE ALL LOAD-BEARING**
>   (teacher feedback 2026-09-01): the known pieces fly on → they slide TOGETHER
>   and become ONE number with a pop (`5 + 6` becomes `11`) → the unknown flies
>   ACROSS and takes the room that is left → `11 + ? = 15` → the answer pops in
>   place and flies HOME with another pop. The pieces are packed to the START of
>   the long side. **THE GAP NEVER MOVES** (teacher feedback 2026-09-02): it
>   keeps the unknown's OWN slot, directly across the figure from the side it
>   stands for. It does not have to move — the pieces TILE the long side, so
>   taking the unknown's slot out always leaves one clear stretch. Packing them
>   to the long side's `A` end is packing to a WINDING direction, not to a place
>   on the screen, and on a U-shape it threw the gap to the opposite corner from
>   the side being found, where it read as a different side altogether.
>   What cannot always be drawn is the merged BAR: with the unknown at one END
>   the known pieces are already side by side and merge where they truly are;
>   with it in the MIDDLE they sit on either side of it, so nothing is merged
>   and the prompt does the adding instead. A tidier picture is not worth a
>   misleading one. Harness check 11 asserts the gap lands within 6% of the
>   long side's length of the side it stands for, and it FAILS on the old
>   packing — verified before the fix was accepted.
>   Subtraction as "what room is left", never as a rule. The animation IS the
>   justification; do not replace it with a printed one.
> * **EVERY NUMBER IN A `part` RUN SITS INSIDE THE FIGURE.** The long side's own
>   number is outside it, and two numbers on one line collide.
> * **WHAT IS MISSING IS A SETTING, NOT A DIFFERENT SHAPE.** Every composite
>   declares `groups {whole, parts[]}` (a long side and the shorter sides that
>   tile it) and `pairs [i,j]` (simply equal sides); `applyReasoning` reads
>   `S.missMode` — mix / whole / part — and decides what to hide. Groups and
>   pairs NEVER share an edge, which is what guarantees the source of a
>   derivation is itself labelled. Teacher feedback 2026-09-01: leaving only the
>   long sides missing trains one move; the short-side case is the one that
>   catches students out.
> * **SIX COMPOSITES, FROM THE TEXTBOOK PAGES.** L, T and cross; then the
>   harder group — staircase (3–4 steps), U (one notch) and E (two notches).
>   The notch is the point of the last two: **P = 2(W + H) breaks there.** A
>   step can be pushed out to the enclosing rectangle, a notch cannot, so each
>   notch adds its depth TWICE and `boxFormula` says so on the card. A headless
>   check asserts the box rule for L/T/cross/staircase and asserts it FAILS for
>   U/E.
> * **THE GHOSTS ARE ORDERED GEOMETRICALLY, NOT BY HAND.** `sortAlong` projects
>   each piece's midpoint onto the long side's own unit vector; `slotsAlong`
>   then lays the lengths end to end, rescaled to fill it exactly so rounding
>   can never make a piece overshoot. That is what makes the `part` gap appear
>   in its TRUE position, and it survives every rotation. Hand-listed ordering
>   broke as soon as `rot90` was applied.
> * **A LONG THIN FIGURE IS NEVER TURNED ON ITS SIDE.** `turnFor` allows the
>   quarter turns only when the figure is roughly as wide as it is tall; a 2:1
>   comb rotated to portrait is bound by the board's height, renders at half
>   the size, and takes the room its numbers need with it. An elongated figure
>   gets the half turn instead, which costs no scale. Related: the viewBox
>   WIDTH follows the figure's own aspect ratio (`computeFit`) and the board's
>   max-width is derived from it, so a portrait figure is never letterboxed
>   inside a landscape box.
> * **THE NOTCH MUST BE A BITE, NOT A SLOT.** A notch three deep and six wide
>   has to hold three numbers in three units of depth. `comb().dims()` keeps
>   each gap within one unit of the depth and derives H from W, so every notch
>   has a roughly square mouth — which is also how a textbook draws one.
> * **THE GHOST'S NUMBER IS OFFSET ALONG THE LINE'S OWN NORMAL** —
>   `translate(0,-27) rotate(-ang)`, in that order. Offsetting in screen space
>   (`rotate(-ang) translate(0,-25)`) puts the number on top of a vertical side.
> * **A CSS `transform` REPLACES AN SVG `transform` ATTRIBUTE.** A pop keyframe
>   put on the group that carries `translate()/rotate()` parks the ghost at the
>   ghost layer's ORIGIN, and `animation-fill-mode: both` leaves it there for
>   the rest of the lesson — the stray orange bar teachers reported. Every
>   ghost is therefore built as `g` (position) > `.ghostInner` (scale) > line +
>   label wrapper > `text` (its own pop), and a keyframe only ever touches
>   `.ghostInner` or the `text`. Harness check 9 samples the whole sequence and
>   fails if any flying number leaves the figure's box.
> * **WHICH SIDE A FLYING NUMBER FACES IS A QUESTION ABOUT THE ANGLE IT LANDS
>   AT.** A segment is symmetric, so `nearestAngle` may settle a ghost 180°
>   round from the angle it was asked for; asking `labelSide` at the requested
>   angle put two numbers of the same run on opposite sides of one line. A
>   ghost carries `pin = {nx, ny, want}` (+1 outside, −1 inside) and `applyPin`
>   recomputes the side from the RESTING angle inside `moveGhost`.
> * **EVERY RESET RETIRES THE RUNNING ANIMATION.** `S.resolveToken` is bumped
>   by `abandonAnimation()`, `resolveEdge` checks `alive()` after every await,
>   and the ghost layer is swept — otherwise "New numbers" pressed mid-flight
>   stranded the numbers on screen and the abandoned sequence carried on
>   editing a figure that no longer existed. Harness check 10 covers it.
> * **LABEL PLACEMENT IS SOLVED, NOT COMPUTED.** A twelve-sided figure with
>   3 cm sides puts its numbers on top of each other. `solveLabels` sizes the
>   type from the SHORTEST side, then places most-constrained-first over three
>   sweeps — each label choosing which SIDE of its own line to sit on (the
>   inside of a notch is often the only place a number fits, which is where a
>   textbook puts it) and how far to slide along it — then relaxes the rest
>   apart, `out` being allowed to go NEGATIVE so the two walls of a notch can
>   pass back across their own lines instead of deadlocking. If nothing packs,
>   the type steps down until it does. Verified at zero collisions and zero
>   spill over 2160 generated figures.
> * **TWO TRAPS COST HOURS HERE; BOTH ARE STILL LIVE.**
>   (1) `.sideLabel` MUST NOT declare `font-size` in CSS — a CSS declaration
>   beats an SVG presentation attribute, so the solver sized every label at
>   16px and the browser drew all of them at 27px, and the solver reported
>   success while the screen showed overlaps.
>   (2) `measureText`'s probe returns `getBBox()` in the PROBE'S OWN user
>   space, so its parked x/y must be subtracted from the offsets — leave them
>   in and every label inherits the probe's parking spot and the layout is
>   silently wrong. The probe is parked at (200,290) rather than the origin
>   only so its hidden box does not hang off the left edge and read as spill.
> * **EVERY OUTLINE IS COUNTER-CLOCKWISE IN y-UP, AND MUST STAY SO.** Outward
>   normals are `(-Dy, Dx)` from the winding, NOT "away from the centroid" —
>   the centroid rule puts the L-shape's step labels inside the notch. Builders
>   hand back CCW polygons; `rot90` preserves it, reflections do not, which is
>   why the L has two hand-written outlines (notch top-right, notch top-left)
>   and only ever gets rotated. A non-CCW outline logs a console warning.
> * **THE L IS PARAMETRISED BY ITS FOUR LABELLED SIDES** (`a` top, `b` step
>   across, `c` step down, `d` short right), so `W = a + b` and `H = c + d` are
>   exactly the two sides to find, every labelled side is independently
>   editable, and no edit can produce an invalid figure. Its formula reveal is
>   `2 × (W + H)` — the same perimeter as the rectangle around it.
> * **THE TRAPEZIUM IS PARAMETRISED BY WHAT IS DRAWN** (`a`, `b`, `h`) and the
>   sloping side is COMPUTED, never stored. Storing `L` alongside `a` and `b`
>   let an edit change the base while the slant kept its old label. Defaults
>   come from Pythagorean triples so the slant starts whole.
> * **THE FORMULA COMES LAST.** The addition builds term by term as the walk
>   goes; only when it closes does `2(l + w)` / `4s` / `n × s` appear, so the
>   shortcut is a compression of something already seen. Settings toggles:
>   missing sides, running total, formula reveal, predict first, edit lengths,
>   equal-side marks, right-angle marks.
> * **THE FIGURE YIELDS TO THE NUMBERS ON A SHORT SCREEN.** The board's WIDTH is
>   capped from the height budget (`--boardH × 1.7241`, the viewBox is
>   1000×580) — capping height alone letterboxes a small figure inside a wide
>   box. Under `max-height:820px` the hint and the eyebrow go and the reserve
>   drops, so the running total and the formula reveal stay above the fold at
>   1366×768.
> * **Verified headlessly** (jsdom, ~274k checks over all three missing-side
>   modes: CCW winding, simple polygons, every drawn side equal to its label,
>   every derived side equal to its copy / sum / whole-minus-others sources,
>   the pieces of a long side genuinely TILING it end to end, outward normals
>   genuinely outward, each mode producing only its own kind of thinking, the
>   enclosing-rectangle rule holding for L/T/cross/staircase and failing for
>   U/E, and the same again after every legal edit) and driven through
>   Playwright: 43 behaviour checks across three viewports (the walk pausing
>   and resuming, predict-first, the length editor refusing an impossible
>   triangle, every display toggle), all 18 shapes traced end to end, and a
>   dedicated label sweep of 2160 figures. Harnesses live in the session
>   scratch, not the repo: `check.mjs`, `behave.mjs`, `shots.mjs`, `labels.mjs`.

> **NEW (2026-08-31, session — being pushed): COMPLETE THE SQUARE — WORKSHEET
> CREATOR.** `worksheet-creators/stage-5/algebra/complete-the-square.html`, the
> first Stage 5 worksheet creator. Same shell, same A4 machinery and the same
> trilingual EN/AR/FA convention as the Unit Conversion creator; cross-listed
> under the SAME three outcomes as the teaching tool (**MA5-ALG-P-01**,
> **MA5-EQU-P-01**, **MA5-EQU-P-02**), and the tool's "Tools ▾" menu row 1 is now
> a live link to it (only Student Quiz is still greyed out).
>
> * **FIVE SECTIONS, and the scaffold fades across them.** **A Label the area
>   model** is the screen from the teaching tool with the two edge labels and the
>   corner missing, and the identity underneath to finish — the picture and the
>   symbols on one card, which is the whole point of the pairing. **B Fill the
>   two boxes** is `x² + bx + ☐ = (x + ☐)²` and nothing else. **C Completed
>   square form** adds a constant to carry. **D Solve the equation** is the whole
>   method with ruled room to work. **E Use it** asks the three things completing
>   the square is actually FOR: the minimum point, the smallest value, and "show
>   this is always positive".
> * **THE LEVEL LADDER IS THE SIGN, NOT THE SIZE, IN SECTION A.** b is ALWAYS
>   even there — half of an odd number is a length nobody can draw on a schematic
>   — so Sweet and Mild are positive and **Medium and Spicy are the NEGATIVE
>   models**, hatched strips and a positive corner. That is where the thinking
>   is. Elsewhere the ladder is even b → either sign → odd b (fractions and
>   surds) → big numbers and a ≠ 1.
> * **EVERY ANSWER IS EXACT.** Nothing on the paper is a rounded decimal:
>   `fr()` keeps p as a half and q as a quarter, `simpSurd()` pulls every square
>   factor out, and roots print as `(−b ± k√m)/2a` reduced by
>   `gcd(gcd(|b|, k), |2a|)`. Checks substitute both roots of 5304 quadratics
>   back into the equation and assert no card ever contains a "." or a hyphen
>   used as a minus.
> * **The discriminant is CHOSEN, not hoped for.** `makeSolveQ` builds Sweet and
>   Mild from the ROOTS (integers, sum even so b stays even, neither root 0 —
>   that would be a factorising question); Medium picks p and a non-square m so
>   the answer is `−p ± √m`; Spicy either brings a ≠ 1 or an odd b. No generated
>   equation is ever unsolvable, and 2400 of them are verified per run.
> * **a is always a factor of b when a ≠ 1**, so taking it out leaves a half at
>   worst rather than an unreadable sixth. And **"show it is always positive" is
>   only ever asked when it IS** — c is built up from the square so q > 0.
> * **A RADICAL IS DRAWN, NOT TYPED.** The √ glyph's metrics differ wildly
>   between maths fonts — in Latin Modern it hangs below the baseline and the
>   vinculum floats off to the left. So the tick is a stretched inline `<svg>`
>   and the vinculum is the radicand's own `border-top`, with
>   `align-items:stretch` making the svg exactly as tall as what it covers.
>   Font-independent, and it survives inside a fraction numerator.
> * **`<sup>` inside a FLEX row is a flex item**, so `gap` pushed it sideways and
>   `vertical-align` stopped applying — `x²` printed as "x 2". Expressions are
>   `display:block` text; only the boxes, fractions and radicals are inline-flex.
> * **Same typography as the teaching tool:** `mathItalic()` + `detectMathAlpha()`
>   for Word's real italic alphabet with an ASCII fallback, weight 500 not 800,
>   and `mathify()` italicises the algebra inside every `<bdi>` in the prose (it
>   parks entities first so `&sup2;` survives, and uses no lookbehind, which old
>   Safari does not have). The "use it" placeholders are `{1}` and `{2}` — DIGITS
>   — precisely so the italiciser walks past them.
> * **Verified headlessly** (jsdom, 67 checks) and screenshotted through
>   Playwright at three densities, five levels, both scopes and all three
>   languages, with an audit for cards or sections running under the page footer.
>
> **NEW (2026-08-31, session — being pushed): COMPLETE THE SQUARE.** A Stage 5
> teaching tool at `interactive-tools/stage-5/algebra/complete-the-square/index.html`,
> built directly from Jeff's own whiteboard lesson (the photos in
> `Complete the square notes.pdf`). Self-contained inline CSS/JS, same shell and
> tokens as the Stage 4 tools. **The tile colours are the sticky notes from the
> board and must not change** — blue x², green x-terms, yellow the constant on
> the right, pink the piece that completes the square. A class that saw the
> board sees the same picture here.
>
> * **TWO modes, one segmented control.** *Build it with tiles* (numbers) and
>   *Prove the formula* (the same moves on ax² + bx + c = 0, ending on the
>   quadratic formula). Steps 5–8 of the lesson notes ARE the proof mode.
> * **Clicking the tile IS the move.** The glowing ring sits on the green
>   rectangle (click → it halves and the second half slides underneath), then on
>   the empty corner (click → the pink square drops in), then on the two
>   right-hand tiles (click → they merge). Next/Back still walk the whole
>   sequence, and every hotspot is a real `role="button"` with `tabindex` so it
>   works from the keyboard.
> * **ONE LAYOUT FOR BOTH SIGNS — the tiles are a TWO-WAY TABLE, not a cut-out.**
>   Teacher feedback 2026-08-31 replaced the curly braces and their bracketed
>   side lengths with plain **edge labels on the top and left**, the way an area
>   model is normally labelled: `x` and `h` sit against the column and the row
>   they measure (`EDGE_FS = 26`, `S.edges`), and every cell is simply the
>   product of its two edges — `x²`, `hx`, `hx`, `h²`. That one change made the
>   old cut-off-strips branch for negative b unnecessary and **it has been
>   deleted**: for x² − 2x = 143 the edge label just reads `−1`, the two `−x`
>   cells are hatched, and the corner reads a **positive** `1` because
>   (−1)(−1) = 1. The sign arithmetic is now visible in the table instead of
>   being narrated by a second story. Same four tile ids (`sq/gr/gb/pk`), same
>   2×2 grid, both signs.
> * **THE PROOF STARTS WITH THREE STEPS OF PURE ALGEBRA, BEFORE ANY TILE.**
>   Teacher feedback 2026-08-31. The tiles can only ever show a MONIC quadratic,
>   so the proof does the two moves that get there first, one arrow-press each:
>   step 1 is ax² + bx + c = 0 on its own, step 2 takes c across, step 3 divides
>   every term by a — and only on step 4 do the tiles appear. When a is divided
>   out the monic equation slides up to become the headline
>   (`proofHeadHTML(monic)` + a `.swap` class re-triggered with
>   `void head.offsetWidth`); taking c across deliberately does NOT touch the
>   headline, because the equation on the card is still the one being solved.
>   That is why the three step constants are **functions of the mode, not
>   numbers**: `TILE_FIRST()` (0 numbers / 3 proof), `DISPLAY_START()` (4 / 7)
>   and `STEPS()` (7 / 10, from `NUM_STEPS` and `PROOF_STEPS`). Anything that
>   indexes steps must CALL them — using `DISPLAY_START` as a constant is a real
>   bug a headless check now catches.
> * **THREE FINAL LINES IN THE PROOF, NOT FOUR.** Rooting both sides and then
>   simplifying √(4a²) to 2a read as the same line twice on screen (teacher
>   feedback 2026-08-31), so the perfect square comes out in the one move:
>   (x + b/2a)² = (b²−4ac)/4a² → x + b/2a = ±√(b²−4ac)/2a → the formula. A check
>   asserts the three lines are pairwise different and that the radical appears
>   on exactly two of them.
> * **FOUR TILE STEPS, THEN THE MODEL GETS OUT OF THE WAY.** The tile steps
>   build the picture; from `DISPLAY_START()` the tiles vanish and the algebra
>   takes the whole board at display size, one line at a time — 3 lines in
>   numbers mode, 4 in the proof. Back and forward across that boundary is the
>   point: the teacher can pull the picture back to show where a line came
>   from. **Both solutions are always shown**; there is no toggle. The history
>   note about negative roots is the optional **Explainer note** (Settings,
>   default OFF) — the area/non-negative argument is a teacher-talk moment,
>   not screen furniture.
> * **The right-hand side is a SQUARE, and the same size as the completed one.**
>   196 is the area of a square of side 14, so drawing it as a wide rectangle
>   quietly contradicted the next step (teacher feedback 2026-08-31). At step 4
>   the merged tile is a square of side `XS + hS`, top-aligned with the left —
>   "square = square" is what makes rooting BOTH sides obvious. It also keeps
>   the yellow tile's id (`yc`) so it GROWS into that square rather than
>   cross-fading, and the pink piece beside it is drawn h by h because it is
>   literally the corner that was just added.
> * **Crossing into the algebra is a MORPH, not a fade.** The pieces are already
>   on screen — the two TOP EDGE LABELS naming the side, and the number in the
>   square — so on the last tile step → first display step they FLY into their
>   places in `(x + 13)² = 196` while the brackets, the ² and the = fade in
>   around them, and they fly back on the way in reverse. Three things make the
>   handoff seamless and must stay true: `sideParts()` builds `x + h` out of the
>   very nodes the edges draw and spaces it with measured `SP()`s, so each edge
>   label lands exactly on its own slot inside the bracket (the negative case
>   drops the `+` and uses one wider spacer instead); `line1Spec(true)` returns
>   the line with those
>   two pieces wrapped in `GH()`, which MEASURES identically but draws nothing,
>   so the frame has holes exactly where they land; and each piece is painted
>   twice mid-flight, its tile colour fading into its equation colour, so
>   neither end pops. Headless checks assert the flight's destination equals
>   what `layoutLines` gives the static line, to the pixel.
> * **The maths line states the CURRENT EQUATION, not the move just made.**
>   Halving a tile does not change the equation, so step 2's line is identical
>   to step 1's in BOTH modes. An earlier build printed
>   `(b/a)x = (b/2a)x + (b/2a)x` at that step and it did not describe the
>   picture on screen; teacher feedback 2026-08-31. The cue carries the move,
>   the maths line carries the state.
> * **The randomiser picks the ROOTS, not the coefficients.** With roots p and
>   q: b = −(p+q), c = −pq, side = |p−q|/2, so the side is always exact and no
>   random equation ever needs a surd. Roots are given **opposite signs**, which
>   forces c > 0 (a positive yellow tile, the picture the lesson used) and
>   guarantees the second-solution step always has something to say. Tiers:
>   Starter (small even positive b) → Core (even, either sign) → Stretch (odd b,
>   so half of it is a half) → Challenge (big, either sign).
> * **Typed equations are freer than random ones:** any b and c, with a surd
>   side rendered exactly (`sideOf` pulls the 4 out — √t = √(4t)/2 — so odd b
>   still lands exactly), and **a negative completed area is reported as "no
>   real solutions" rather than drawn**. That guard is where the discriminant
>   lives; do not let it silently draw a square with negative area.
> * **The tiles are SCHEMATIC and must stay so.** x is unknown, so a true-to-
>   scale picture is impossible (in x² + 26x = 27 the answer is 1 and the
>   x-square would be a speck). `hSize()` still grows the h-side with √|h| so 13
>   looks bigger than 3, clamped to 58–122 against a fixed x-side of 168.
> * **The viewBox is computed per equation** (`computeVB`, over the TILE steps
>   only, never mid-tween) so the tiles fill the card and the algebra display is
>   then centred inside that same box — the card does not resize when the model
>   steps aside. It must also reserve the MEASURED extent of the EDGE labels:
>   once `b/2a` is a real fraction a fixed padding is not enough. The left-hand
>   labels hang 20px clear of the tiles (raised after a clash on the vertical
>   axis, teacher feedback 2026-08-31).
> * **The `=` column starts after whatever the left side actually reaches**, per
>   step. With a fixed column the wide b-by-x tile at step 1 sat on top of the
>   equals sign and the yellow tile (teacher feedback 2026-08-31); a headless
>   check now asserts the clearance at every tile step.
> * **There is a small SVG MATHS TYPESETTER in here** (`MT/MI/MR/MF/MS/MP/MB/SP/GH`,
>   `mSize`, `mDraw`) — real fraction rules, real radicals with a vinculum, and
>   brackets that grow. Slash notation was rejected on teacher feedback.
>   Every variable goes through `MI()`, and **it is set the way WORD SETS IT**:
>   Word's equation editor does not slant an upright face, it draws variables
>   from Cambria Math's own italic alphabet, which lives in Unicode's
>   **Mathematical Alphanumeric Symbols** block (x → U+1D465, and ℎ from U+210E
>   because the block has a hole there). `mathItalic()` does that mapping and
>   `detectMathAlpha()` decides ONCE at boot whether to use it — it measures a
>   run of those code points against a run of private-use ones, and equal widths
>   mean both came back as notdef boxes, so it falls back to ASCII plus a
>   synthesised `font-style:italic` and nothing ever tofus. `--mathFont` leads
>   with **Cambria Math** for exactly that reason, then the other real maths
>   faces, then serifs that at least own a genuine italic. Everything
>   mathematical also dropped from weight 800 to `--mathWeight` 500 — an
>   equation editor sets regular weight, and 800 was most of why it did not look
>   like one (teacher feedback 2026-08-31). Numbers and operators stay upright in
>   `MT()`, and `coefX(v)` writes the coefficient of x and **never prints a 1**,
>   so it reads `−x`, not `−1x`. Two
>   traps it exists to avoid: **SVG collapses leading and trailing whitespace**,
>   so every gap is an explicit measured `SP()` spacer and never a space inside
>   a text node (a text node's rendered and measured widths disagree, which put
>   the `=` on top of the following fraction rule); and **display lines are
>   stacked on their measured ascent and descent**, because a fixed line step
>   makes a fraction-inside-a-radical-inside-a-fraction land on the line above.
>   Widths come from `getComputedTextLength` with an `approxWidth` fallback, so
>   it still lays out under jsdom.
> * **Gotchas:** the proof's tiles carry a typeset NODE and no plain label, so
>   the label guard has to test `t.label != null || t.node` or every green and
>   pink tile prints blank; a hyphen is not a minus sign, so labels go through
>   `neat()`; and the hatch fill for negative cells is a `<pattern>` with a
>   `patternTransform`, which `getBBox` ignores — so a naive overflow audit has
>   to measure the cell, not the paint.
> * **Verified headlessly** (jsdom, 151 checks): 7560 equations re-derived
>   independently (both roots substituted back into x² + bx = c), 2000 random
>   equations against their tier rules, every surd squared back to its target,
>   the scene geometry (the corner exactly fills the L-shape's gap and is h by
>   h; the wide tile is exactly twice the halved one), the negative-b branch,
>   the answer never leaking before its step, the click targets actually
>   advancing, both modes rendering cleanly over 720 steps, no hyphen ever used
>   as a minus, the mode-dependent step constants, the three opening algebra
>   steps revealing one line each with no tiles on screen, the divide-by-a
>   headline matching the monic tiles, the three final proof lines being
>   pairwise different, every cell of the two-way table equal to the product of
>   its edge labels in both signs, and every variable set correctly in BOTH
>   typography paths — italic in the fallback, real math-alphanumeric glyphs and
>   nothing synthetically slanted when the alphabet is there. Screenshotted
>   through Playwright at every step of both modes with an out-of-viewBox audit.
> * **Wired in:** cross-listed in `resources/toolLinks.js` under **MA5-EQU-P-01**,
>   **MA5-EQU-P-02** and **MA5-ALG-P-01**, plus a homepage Interactive Tool card
>   (interactive count 26 → 27). Its **"Tools ▾" menu holds two greyed-out
>   rows** — Worksheet Creator and Student Quiz, neither built.
> * **Deliberately not built (v1):** non-monic a ≠ 1 in the TILE mode — the
>   PROOF mode now does the rearranging explicitly (steps 1–3 above), but the
>   numbers mode still opens monic; and same-sign roots / c < 0, which would put
>   a negative on the yellow tile.

> **NEW (2026-08-31, session — being pushed): UNIT CONVERSION — DOUBLE NUMBER
> LINE.** A new Stage 4 teaching tool at
> `interactive-tools/stage-4/measurement-space/unit-conversion-number-line/index.html`
> (self-contained inline CSS/JS, same shell/tokens as the Stage 4 fraction
> tools). Metric conversions are done by SCALING, not by a rule about zeros: the
> larger unit runs along the top line, the smaller along the bottom, and every
> value on the page is the same multiplier applied to the `1 : ratio` anchor.
>
> * **The anchor never leaves the screen.** Step 1 is `1 km / 1000 m` and
>   nothing else; every later position is drawn WITH it, because the whole
>   argument is “2 is twice 1, so it is twice 1000”. This is why the drawn
>   domain is `max(1.35, lam * 1.28)` rather than something that frames the
>   target nicely — do not “improve” it into a view that drops the anchor.
> * **Steps are anchor → (pose → reveal) × n**, endlessly, generated lazily and
>   cached in `state.rounds` so Back replays the same numbers instead of
>   re-rolling them. Each Next to a NEW position runs a two-phase tween in one
>   animation (old target fades, line geo-zooms, new target arrives); pose →
>   reveal does NOT zoom, so the eye stays on the position.
> * **The blank ALTERNATES top and bottom** (`r % 2`), so the class converts in
>   both directions. Big-to-small and small-to-big are deliberately told as the
>   SAME act — the × arc is identical on both lines either way — with the
>   × / ÷ rule carried only by the one line of maths underneath.
> * **The scaling arc arrives in two halves:** the GIVEN line's `× lam` arc is
>   there at the pose, and the other line's identical arc appears with the
>   answer. “The same jump on both lines” is the reveal. The vertical green
>   `× ratio` link is shown alone at the anchor step, then at the target on
>   each reveal — two routes to the same answer, a commutative square.
> * **The faint hop marks are NEVER labelled.** Labelling every anchor multiple
>   on both lines would hand over the answer; unlabelled they let a child count
>   hops. When the target falls between hops that ONE interval is subdivided,
>   and the subdivision is chosen (2/4/5/8/10/16/20) so the target lands ON a
>   mark — a target floating between sub-ticks reads as a drawing error. Skipped
>   when the marks would come closer than 18px.
> * **Three hard constraints on the multiplier `lam`,** all about the picture,
>   enforced in `lamPool` and asserted headlessly: `lam >= 0.25` (closer to zero
>   and the label collides with the 0), `lam <= 12` (further out and the anchor
>   is squashed against the left edge), and `|lam - 1| >= 0.1` (a target sitting
>   on the anchor hides the jump). **Big numbers come from a bigger unit gap
>   (km → cm gives 1 : 100 000), never from a bigger multiplier.**
> * **Tiers vary the VALUES, not the units** — Starter (whole 2–9) → Core (whole
>   to 12 + halves) → Stretch (one decimal place, values under 1) → Challenge
>   (awkward decimals — 0.375, 1.125, 11.25). A tier may carry at most
>   `log10(ratio)` decimal places (`+1` at Challenge, which is the only tier
>   allowed a decimal on the smaller-unit line).
> * **Gotcha — floating point:** `8.2 * 1000000` is `8199999.999999999`. Every
>   product goes through `mulK()` (scale to a whole number of thousandths
>   FIRST), and `round9()` rounds to 12 SIGNIFICANT figures, not 12 decimal
>   places — the bottom line reaches into the billions for mg and mL.
> * **Gotcha — the settings menu must NOT scroll.** The Difficulty submenu is
>   absolutely positioned outside the menu box, so any `overflow` but `visible`
>   on `.settingsMenu` clips it away entirely. Keep the menu short instead.
> * **Gotcha:** the stylesheet's `.nline text{font-family:var(--mathFont)}` beats
>   a `font-family` presentation ATTRIBUTE, so UI-font labels go through
>   `uiFont()` (inline `style.fontFamily`) — same trap as the area model.
> * **Units:** length (km/m/cm/mm), mass (t/kg/g/mg), capacity (ML/kL/L/mL). The
>   top list omits the smallest unit and the bottom list offers only the units
>   BELOW the chosen top one, so the ratio always exceeds one.
> * **Settings:** Measure / Top line / Bottom line, a Difficulty submenu, and
>   four Display switches — Estimate first (default OFF; a typed prediction is
>   locked in before Next unlocks, and is reported back at the reveal), Scaling
>   arrows, Unit link, Faint hop marks.
> * **Verified headlessly** (jsdom, 53 checks): 3080 multiplier/unit-pair
>   combinations for exactness, decimal-place limits, whole smaller-unit values
>   and label spacing; 480 pose/reveal pairs asserting the answer is NEVER on
>   the line before the reveal (compared as whole `<text>` labels — substring
>   matching false-positives, “375” lives inside “0.375”), that the empty box is
>   there at the pose and gone at the reveal, the alternating blank, Back not
>   re-rolling, the unit pickers, estimate mode, every Display toggle, Reset, and
>   that the on-screen cue stays under 60 characters. Screenshotted through
>   Playwright at every step including mid-zoom.
> * **The Display defaults are all OFF except the hop marks** (teacher feedback,
>   same session): the scaling arrows and the unit link are a REVEAL the teacher
>   chooses to add, not scaffolding the class starts with. Do not switch them
>   back on by default.
> * **Cross-listed in `resources/toolLinks.js` under FIVE outcomes** — Stage 3
>   **MA3-GM-02** (Length), **MA3-NSM-01** (Mass), **MA3-3DS-02** (Volume and
>   capacity), and Stage 4 **MA4-LEN-C-01** and **MA4-RAT-C-01** (the double
>   number line IS the ratio representation). Nothing is duplicated on disk;
>   all ten rows point at the same two URLs. Its **“Tools ▾” menu holds two
>   rows** — a live *Worksheet Creator* link and a greyed-out *Student Quiz*
>   (the harness asserts that shape). No Firebase, no registry entry, no
>   homepage card yet.

> **NEW (2026-08-31, session — being pushed): CONVERTING UNITS OF MEASUREMENT
> — WORKSHEET CREATOR.** `worksheet-creators/stage-4/measurement-space/unit-conversion.html`,
> the printable sibling of the tool above, built from Jeff's own Stage 3
> “Converting units of capacity” sheet (a full double number line with values
> missing down BOTH lines, then plain conversions). Same shell, spice ladder,
> trilingual convention, measured-then-greedy pagination and answer key as the
> Multiplying Fractions creator — read that one's notes first, this is the same
> machine.
>
> * **Five sections, scaffold fading left to right** (`line`, `jump`, `fluent`,
>   `compare`, `word`), each independently toggled with its OWN question count
>   and its OWN spice ladder. **A** fill a whole number line (the Stage 3
>   opener) → **B** one jump from the 1 : ratio anchor → **C** bare conversions
>   → **D** write `<` `=` `>` between two measurements → **E** short in-context
>   problems.
> * **TWO orthogonal controls, and they must stay orthogonal:** **Stage** picks
>   the UNIT PAIRS (Stage 3 = neighbouring units only, and never mg or t;
>   Stage 4 = any gap), **Level** picks the NUMBERS on them. So a Stage 3 class
>   can still meet spicy decimals on L and mL.
> * **Section D's whole point is the EQUAL pairs.** Roughly one comparison in
>   four is genuinely equal (2.5 km vs 2500 m), because a student reading only
>   the digits will always call it “<”. Do not “fix” the frequency down.
> * **TWO multiplier pools, and the difference matters.** `poolFor(level, k,
>   forPicture)`: the DRAWN pool obeys the teaching tool's constraints (0.25 ≤
>   lam ≤ 12, |lam−1| ≥ 0.1) so the picture works; the TEXT pool is wider,
>   which is where `8886 mL = 8.886 L` lives. Both cap decimal places at
>   `log10(ratio)` so the smaller unit always lands whole.
> * **The printed jump needs FOUR extra limits the board does not** — it gets a
>   quarter of the width. Ratio ≤ 10 000, lam ≤ 6, |lam−1| ≥ 0.3, and its own
>   620-unit viewBox (a 1000-unit one shrank the type to nothing). It also
>   **draws no zeros**: the closed left end says zero already, and on a
>   half-page card the two zero labels sat on top of the anchor.
> * **Fill-the-line ticks are BUCKETED, not just min-gapped.** Random picks with
>   a minimum gap still clump — five ticks landed at 1, 6, 7, 8, 9 and left half
>   the line empty. One tick per bucket, jittered inside the middle of it, is
>   irregular (the point) AND spread (legible). Grids must be fine enough to
>   jitter in: with E=1 at tenths there are only 10 slots and four ticks are
>   FORCED onto 2, 4, 6, 8, which put two identical lines on one page. Hence
>   `SPAN_DEC` prefers finer grids and the dedupe key for a line is its TICK
>   PATTERN ALONE, ignoring units.
> * **The given side ALTERNATES down every line** — that is what makes one
>   picture ask for both directions.
> * **Reasoning prompts are TAGGED by measure** (`fam`), because a
>   capacity-only sheet arguing about kilometres is a sheet nobody reads. Keep
>   at least two per family so a one-measure paper can vary them.
> * **The larger unit is on TOP**, matching the teaching tool. Jeff's original
>   sheet had mL on top; consistency with the board won.
> * **Nothing on the student half is coloured** — these get photocopied. The
>   only colour is the answer key's green.
> * **Gotchas:** every printed value is length-capped (≤ 9 characters) or a long
>   one wraps and makes a card taller than the row the packer measured;
>   comparisons use `baseOf()` (scale to whole thousandths FIRST) because
>   `12.06 * 1e9` carries fuzz that made two genuinely equal amounts compare
>   unequal; and the pagination heights are NaN-proofed so a zero-layout
>   environment cannot produce a nonsense budget.
> * **Verified headlessly** (jsdom, 71 checks): 2240 generated questions
>   re-derived independently (including that every printed `<` `=` `>` is the
>   true relation and never compares two values in the same unit), 5337
>   multipliers for exactness and whole smaller-unit values, 672 number lines
>   for tick spread/alternation/wholeness, rendered pages inspected for answer
>   leaks on the student half, section lettering, question numbering, the
>   trilingual rendering in all three languages, template completeness across
>   EN/AR/FA, every option toggle and Reset. Audited again under Playwright for
>   real layout: no page overflows its A4 box, no question is lost or
>   duplicated when a section splits, non-final pages run 95–97% full, and the
>   Arabic and Farsi papers were screenshotted.
> * **Wired into the homepage** (`index.html`): a full *Interactive Tool* card
>   and a *Worksheet Creator* mini card, so both appear under the nav's
>   Interactive Tools / Worksheet Creator tabs and in search. Their
>   `data-search` text spells the units out in FULL (millilitres, kilograms —
>   a teacher does not type "mL") and carries all five outcome codes and both
>   stage words, since a card can only hold one `data-stage`.
> * **Housekeeping done at the same time:** the hardcoded `.group-count` pills
>   on the homepage had drifted — worksheet-creator said 18 for 24 cards and
>   online-quizzes said 20 for 23, both wrong BEFORE this change. All three
>   (with interactive-tools 19 → 26) now match the cards. **They are hardcoded,
>   not computed** — the live counts are only on the chooser tiles
>   (`refreshCatCounts`), so a new card means editing the pill by hand.
> * **TODO:** the AR/FA strings want a fluent proofread (same as the other
>   creators). A **cubic-units section** (isometric cubes — how many small cubes
>   fill the big one, leading to 1 cm³ = 1 mL) was scoped from Jeff's original
>   sheet and deliberately left out of v1.

> **NEW (2026-08-26, session — being pushed): MULTIPLYING FRACTIONS — AREA
> MODEL.** A new Stage 4 teaching tool at
> `interactive-tools/stage-4/number/multiplying-fractions-area-model/index.html`
> (self-contained inline CSS/JS, same shell/tokens as the other Stage 4 fraction
> tools). ONE unit square is cut into columns by one fraction and into rows by
> the other; the answer is the rectangle where the two shadings cross.
>
> **Design rule for this tool: the SCREEN carries the picture, the TEACHER
> carries the words.** A first build put a "what the picture says" receipt panel
> beside the square and a paragraph of narration per step; both were cut on
> teacher feedback (2026-08-26) as too busy. What is left is the square, the two
> edge labels, a ≤48-character cue, and one line of maths. A headless check
> ENFORCES the cue length — do not let explanation creep back in.
>
> * **Five reveals, and only five** (ids `whole,across,down,name,answer`):
>   `whole` (the blank square under a "1 whole" bracket — the first click is
>   deliberately the empty unit) → `across` (the SECOND fraction, light blue —
>   cut into d columns, shade c) → `down` (the FIRST fraction, also light blue,
>   **darker where the two overlap**) → `name` (every cell in the whole square
>   carries its own unit fraction: dark inside the overlap, pale outside — this
>   is where the denominator comes from) → `answer`. Shaded once = light,
>   shaded twice = dark, so the picture explains itself without a legend.
> * **The answer step CLEARS the piece names** and shows the product alone
>   (a×c/b×d) on a white plate in the middle of the overlap. It does NOT
>   simplify. If the answer simplifies, a **Simplify** button appears in the nav
>   row (key `m`); pressing it re-groups the picture and the button becomes
>   **Undo**. Simplifying is a THING THAT HAPPENS TO THE PIECES, never a line of
>   text: the pn small pieces slide to new homes, the square is re-cut into sd
>   bigger parts with bold rules, the edge brackets come off (they no longer
>   measure those fractions), and the plate gains "= sn/sd". Leaving the step,
>   changing the problem or Start again all drop it.
> * **How the re-grouping is computed** (`blockSplit`): split sd into x·y with
>   x | acrD and y | dwnD, giving sd equal BLOCKS each holding exactly g whole
>   pieces. Such a split always exists because sd divides acrD·dwnD (distribute
>   each prime's exponent between the two). `targetCell(k)` places piece k in
>   block floor(k/g); `sourceCell(k)` is where it started inside the overlap;
>   the difference drives a `slideIn` transform. Do NOT replace this with "shade
>   the first sn columns" — the pieces do not tile a column unless sd | acrD.
> * **The number line is OPT-IN** (Settings › Show number line, default OFF, or
>   the `n` key) and it tells the SAME story one dimension down, in step with the
>   square: at `across` the line is cut into d and c of them shaded, with its
>   name above; at `down` that shaded length is broken into b parts and the
>   answer's worth darkened; at `name` the cut is carried across the whole line
>   (skipped past 30 pieces — it turns into a hairbrush); at `answer` the point
>   is dotted and named below the axis, and Simplify re-cuts it into sd parts
>   and renames the point. It never shows all three values at once. **When it is
>   on the SQUARE SHRINKS** — `layout()` swaps a whole geometry set (`G`) and the
>   viewBox (`VB_PLAIN` 610 tall / `VB_LINE` 700), which is the only reason the
>   two never collide. Nothing in the draw code may use a fixed square constant;
>   read `G.x/G.y/G.s/G.r/G.b/G.ly`.
> * **"Read it the other way"** (button, or `s`) transposes the picture — same
>   rectangle, factors swapped. Commutativity as a fact about a shape.
> * **Decimal layer on the SAME model** (Settings › Decimals and percentages).
>   The randomiser's **Tenths** tier forces both denominators to 10 and switches
>   the labels on, so 0.4 × 0.6 is a 10×10 grid of hundredths. `decStr()` gives
>   an EXACT terminating decimal where one exists and `≈` otherwise.
> * **Randomiser tiers:** Unit fractions → Simple (bottoms 2–6) → Any proper
>   (2–12) → Answer simplifies → Tenths.
> * **Proper fractions only** (bottoms 2–12) so the square is exactly one whole.
>   Mixed numbers would need a grid wider than 1 — a real extension, and the
>   bridge to expanding brackets.
> * **Predict mode was REMOVED** in the redesign (it hung off the old always-on
>   number line). If it comes back it belongs as an extra step BEFORE the blank
>   whole, shown only when the line is on.
> * **Gotcha:** the stylesheet's `.model text{font-family:var(--mathFont)}` beats
>   a `font-family` presentation ATTRIBUTE, so UI-font labels must set
>   `e.style.fontFamily` inline or every label comes out serif.
> * **Verified headlessly** (jsdom, ~336k checks): every a/b×c/d with bottoms
>   2–12 re-derived independently, including that the picture's two counts ARE
>   the numerator and denominator; the reveal is exactly five steps in that
>   order; step 1 is a bare square; the piece names appear at step 4 and are
>   GONE at step 5; **the answer never appears before step 5** and carries no
>   "=" until Simplify (asserted via `[data-role="answer"]`, not string
>   sniffing); for all 3145 simplifiable pairs the block split exists, blocks
>   hold exactly g pieces, and every piece lands on its own cell inside the
>   first sn blocks; the Simplify/Undo button states; swap = commutativity;
>   decimal/percentage naming with exact round-trips; the number-line group
>   (`[data-role="line"]`) only ever grows; the cue stays <= 48 characters.
>   Screenshotted through Playwright at every step, including a real
>   click-through of Simplify and Undo.
> * **The WORKSHEET CREATOR** is
>   `worksheet-creators/stage-4/number/multiplying-fractions.html`. Five lettered
>   sections, each handing the student a different amount of the model, which is
>   the whole design idea: `shade` (a square already cut both ways — shade it)
>   → `finish` (only the SECOND fraction is cut and shaded; the student makes
>   the other cuts) → `read` (a shaded model, write the multiplication —
>   backwards) → `nopart` (a BLANK square; the student cuts it up) → `nomodel`
>   (plain fluency, one line per question, no picture). A `count` section
>   (fill in b×d and a×c) was built and then **removed on teacher feedback
>   2026-08-26** — do not add it back without asking.
>   Four spice levels (sweet = unit fractions; mild never simplifies; medium
>   sometimes; spicy always), a simplest-form step, and a misconception to argue
>   with at the foot of every page. **Model sections cap b×d at 48** (`MODEL_CAP`)
>   so a square is still shadeable by hand; `nomodel` may go higher.
>   - **THREE model cards per row, always.** The square is the point, so it gets
>     the width; the size selector changes the SQUARE (52 / 46 / 38 mm), never
>     the column count. Only `nomodel` packs more across — and it drops a column
>     when the simplest-form box is on, because that adds a whole extra fraction
>     to a one-line card. Its cards also `flex-wrap`, so they can never spill out
>     of a column (they did, and got clipped, before that was added).
>   - **Trilingual EN / AR / FA** (`langSel`, persisted as `mmt-mulf-ws-lang`),
>     same convention as the other creators: chosen language on top, English
>     beneath, numerals and fractions Western and LTR inside `<bdi>`. Two
>     gotchas, both found in render: the simplest-form note must be joined to the
>     instruction **per language** before `TR()`, or the heading prints four
>     alternating lines; and the ✎ has to live inside each translation, or the
>     block-level target-language line pushes it onto a row of its own.
>   - **The answer key re-renders the models as `full`**, so the teacher marks
>     the picture, not just the numbers. Same square size, so pagination is
>     unaffected.
>   - **There are NO boxed numerator/denominator slots.** The student gets an
>     equals sign and a ruled line, nothing more. Boxed slots were built first
>     and **removed on teacher feedback 2026-08-26**: they make children ask
>     “what goes in this box?” instead of thinking about the question. Do not
>     reintroduce them. The Read section gets one full-width line and the
>     student writes the whole multiplication; on a key the line is replaced by
>     the answer in green. Nothing on the page hints at which answers simplify.
>   - **Question counts are PER SECTION** (`nShade`, `nFinish`, `nRead`,
>     `nNopart`, `nNomodel`), not one global total — a teacher wanting 4 shaded
>     models and 30 fluency questions can have exactly that. Each card's toggle
>     and its number box stay in step (typing 0 switches the section off;
>     switching a section on fills in a sensible default), and a live pill shows
>     the total. **Every section climbs its OWN spice ladder**, so a short
>     section still runs sweet → spicy inside itself.
>   - **The probe is measured TWICE, student and key, and the larger kept.**
>     Both halves share one pagination, and an answer written into a key card
>     can make it taller than the blank one it mirrors.
>   - **Packing is measured, then GREEDY.** An earlier version tried to even the
>     pages out by packing to the average section cost; with five small sections
>     that average is barely one section, so every page came out holding one
>     section and two-thirds white. Pages now run 95–99% full. The reasoning box
>     is `flex:1 0 auto` and STRETCHES into whatever the last page leaves (capped
>     at 96mm so a light page does not become a full page of ruled paper), so its
>     natural height — which the packer reserves — must stay modest: that is why
>     `.exSq` is 26mm and `.ruled` is a repeating-gradient at a fixed handwriting
>     pitch rather than a fixed number of `<span>` rules.
> * **Wired in:** both are filed under **MA4-FRC-C-01** in
>   `resources/toolLinks.js` (Teacher tool + Worksheet maker) with mini cards on
>   the homepage. The teaching tool's **"Tools ▾" menu holds exactly two rows** —
>   a live *Worksheet Creator* link and a greyed-out *Student Quiz* — and the
>   headless harness asserts that shape. The four other Stage 4 fraction tools
>   still link TO the teaching tool from their own menus. No student quiz yet;
>   see §8.

> **NEW (2026-08-20, session — being pushed): ADDING AND SUBTRACTING FRACTIONS
> family.** The teaching tool
> (`interactive-tools/stage-4/number/adding-fractions/index.html`, built the
> night before as "Adding Fractions") grew up and gained its two siblings:
>
> 1. **Teaching tool upgrades.** (a) The EQUIVALENT FRACTIONS now appear in a
>    band between the joined bar and the number line once the split step is
>    reached (e.g. 3/6 + 2/6 under their segments; subtraction writes −C/D
>    inside the pink hatch) — the line moved down to make room (viewBox 436).
>    (b) **Negative answers allowed**: the take-away may exceed the start; the
>    axis extends to −1 (`axisMin()`), sign-aware fraction rendering everywhere,
>    the swap/validation removed, narration adapts ("straight past zero").
>    (c) Below-line labels sit lower and the landing tick is shorter, so labels
>    like 17/20 no longer collide with ticks. (d) A "Tools ▾" menu links the two
>    siblings. Retitled **Adding and Subtracting Fractions**.
> 2. **Student quiz** `online-quizzes/stage-4/number/adding-subtracting-fractions.html`
>    (registry id `adding-subtracting-fractions-quiz`). Sweet/Mild/Medium/Spicy,
>    15 questions; the ladder raises the RENAMING demand while the model stays —
>    Sweet same denominators, Mild related (one bar re-splits), Medium unrelated
>    (both re-split, improper sums, simplifying), **Spicy = Medium with NO model
>    + take-aways that pass zero** (negative answers). Estimate-first (drag the
>    marker, never marked), then the bars, then an optional reveal (tagged
>    `usedRenameReveal`) on **every modelled level — Sweet ("Show the pieces"),
>    Mild and Medium ("Show the renaming")**; what disappears at Spicy and Extra
>    hot is the model itself. The reveal is a **back/forward arrow pair** (forward
>    disabled once revealed, back greyed until then) and the pieces ANIMATE
>    falling into place and lifting back out (slideIn/slideOut on the strip
>    segments, faded ticks/labels) instead of snapping; the same smooth BACK now
>    exists on the teaching tool (`state.animExit` + exit classes slideOut /
>    tickOut / fadeOut / popOut — one-step Back plays the current step's exit,
>    then lands). A **fifth level, Extra hot** (`extrahot`): coprime denominator
>    pairs, both <= 10, product >= 18, and BOTH fractions in simplest form
>    (2/6 would quietly reduce to 1/3) — e.g. 3/8 + 4/7, where the new unit is
>    the denominators multiplied; no model, improper sums + negative take-aways.
>    The MathLive box sits on the equation's own line, vertically CENTRED with
>    it (padding only — a min-height taller than the content top-aligns the
>    fraction), and the fraction button + its translated "Click to enter a
>    fraction" hint sit in their own centred row ABOVE the whole question card
>    (`#fracBarRow`, revealed with the field, hidden in the estimate phase and
>    when MathLive fails to load); landing labels drop a row near endpoint
>    labels ("1 whole"). **Answers are entered in a MathLive fraction editor** —
>    the Adventure's MathAnswerInput pattern trimmed to ONE fraction-template
>    button (`\frac{#?}{#?}`, so a typed whole number stays outside → mixed
>    numbers work), menu/keyboard icons hidden, Enter captured; loaded from
>    jsDelivr (`mathlive@0.101.2`), and if the CDN is unreachable the plain
>    typed input silently remains. **Never set `display`/flex on `<math-field>`**
>    — it breaks MathLive's own hit-testing and the first keystroke after a click
>    is swallowed (cost a debugging round); size it with min-height + padding.
>    Marking reads the LATEX (never ascii-math,
>    which flattens "1 3/20" to "13/20") via `latexToEntry()`, handling
>    MathLive's brace-less `\frac44` form. Matched as EXACT rationals,
>    any equivalent form (10/12 = 5/6 = mixed); one attempt per question. Carries
>    the byte-identical v2 login block (now **eleven** quizzes — §8 updated).
>    **Trilingual EN/AR/FA** (same convention as the Fractions Number Line Quiz:
>    selected language on top, English beneath; maths/numerals stay Western/LTR;
>    lang toggle in the top row, persisted as `mmt-asf-lang`; non-English
>    attempts tagged `lang:ar`/`lang:fa` in `types[]`).
> 3. **Worksheet creator** `worksheet-creators/stage-4/number/adding-subtracting-fractions.html`.
>    Level ladder (same/related/unrelated/mixed spice), add/sub/both, past-1-whole
>    and negative toggles, answer key. "Show the model" prints the two bars in
>    their own units above a number line already cut into the COMMON unit with
>    the start marked (the answer is NOT marked — counting on/back is the work;
>    the count-on arrow hint was removed on teacher feedback); an **Extra hot
>    tier** (value `coprime`) mirrors the quiz's fifth level — coprime pairs
>    <= 10 (model pool capped at product 20 for readable ticks), its own dark-red
>    badge, and Mixed spice now deals a ladder of all FOUR tiers;
>    2×4 per A4 with the model, 3×6 without. (A "Fade the model" option that
>    scaffolded only the first half was removed on teacher feedback 2026-08-20 —
>    unnecessary; run two papers instead.) The control panel is laid out in three
>    full-width BANDS — "The paper" (level / operation / count / language in an
>    auto-fit grid), "Options" (the toggles in one wrapping row) and the action
>    buttons — so nothing is orphaned when the window narrows.
>    A **Worksheet language** select (EN / AR / FA,
>    persisted as `mmt-asf-ws-lang`) prints every card instruction, the Answer
>    label and Name/Date bilingually — Arabic or Farsi on top, English beneath —
>    re-rendering the SAME questions on change.
>
> All three are filed under **MA4-FRC-C-01** in `resources/toolLinks.js`, mini
> cards added on the homepage, quiz registered in `mmtToolRegistry.js`
> (masteryTopic `adding-subtracting-fractions`).
>
> **NEW (2026-08-18, session — DEPLOYED, commits `34cbb73` / `9d962b3` /
> `5c9029e`): FRACTION TO PERCENTAGE family, a shared quiz SIGN-IN BANNER, and
> per-kind RESOURCE ICONS.**
>
> 1. **Fraction to Percentage.** The teaching tool
>    (`interactive-tools/stage-4/number/fraction-to-percentage/`, built the night
>    before) now has two siblings —
>    `worksheet-creators/stage-4/number/fraction-to-percentage.html` and
>    `online-quizzes/stage-4/number/fraction-to-percentage.html`. The tool's
>    "Tools ▾" menu holds ONLY those two. All three are filed under
>    **MA4-FRC-C-01** in `resources/toolLinks.js`, so they appear on Resources by
>    Stage → Stage 4 → Fractions, Decimals and Percentages.
>    - *Worksheet:* "Show number line" ON prints the tool's FIRST REVEAL — whole
>      partitioned, fraction marked, shaded distance, blank under the tick — 2×4
>      per A4; OFF is the plain conversion card, 3×6. The tier is re-checked
>      AFTER reducing, so a "Friendly" question can never arrive recurring.
>      Denominators cap at 20 when the model shows, or ticks become unreadable.
>    - *Quiz:* 15 questions, Sweet / Mild / Medium / Spicy (**Spicy = Medium's
>      bank with NO model**). Each model question runs estimate → a HELD beat to
>      read the estimate → placement → one part named (100 ÷ d) → the student
>      counts on. **No unit fractions in any bank** — with the first part
>      revealed, 1/d would BE the answer. Recurring answers accept `66 2/3`,
>      `200/3` or `66.7` and reject `66.6`. One attempt per question, so the
>      score is a true /15; the estimate is never marked.
>
> 2. **Shared quiz login block v2.** The **ten** quizzes carrying
>    `mmtLoginOverlay` now hold a BYTE-IDENTICAL copy. To change it: edit the
>    copy in `online-quizzes/stage-4/number/fraction-to-percentage.html`, then
>    re-apply to the other nine by replacing the span from
>    `<!-- ===== MMT student-code login` to the `</script>` after
>    `window.MMTMode=`. New in v2:
>    - a status chip painted into **`#mmtAuthSlot`** (added beside each quiz's
>      Reset button) — "Signed in as NAME", or "Guest mode" + a Sign in button
>      that reopens the overlay. It sits in the page's own flow so it stays
>      BEHIND the quiz's modals instead of bleeding over them;
>    - `window.MMTAuth { mode, student, name, signedIn, signIn, certTail, shareLine }`;
>    - certificate wording that follows the sign-in state — **Google Classroom is
>      mentioned only when nothing is being saved**. The block rewrites every
>      `.certSub`; a quiz's OWN certificate / clipboard / canvas text calls
>      `MMTAuth.certTail()` or `.shareLine()`.
>    **Firestore rules did NOT need changing** — the live `achievements` block
>    already allows create for the signed-in student, and these write that same
>    shape. Do not re-investigate this.
>
> 3. **Resources by Stage icons.** Uploaded files badge with a TEXT label, so a
>    GLYPH badge now means "this opens a page" and the drawing says which kind:
>    teacher tool (screen + cursor), student quiz (clipboard + tick), worksheet
>    maker (ruled sheet), lesson plan (open book), flip/flash cards, game (die).
>    Edit `KIND_VARIANT` / `KIND_ICON` in `resources/index.html`; a `kind` with
>    no entry falls back to the old globe.
>
> **Bridge gotcha (cost an hour):** a Claude session that dies mid-write leaves
> `.git/index.lock` / `HEAD.lock` behind, and the desktop-bridge shell can only
> `mv`, never delete — so git then refuses every commit with "Another git process
> seems to be running". Check `find .git -name '*.lock'` and clear them in
> Terminal. The bridge also has NO network, so `git push` must be run by hand.
>
> **NEW (2026-08-17, session — being pushed): STAGE 3 MULTIPLICATIVE RELATIONS
> + GEOMETRIC MEASURE.** Two more Stage 3 banks, taking the stage to **6 of 8**
> topics. **Geometric Measure** (18 types) reuses the linear, angle and length
> engines. **Multiplicative Relations** (21 types) needed the one genuinely new
> engine, `engines/array-area/array-area-engine.js`, which draws four things:
> an array, an area model (build it, read it), a factor-rectangle set, and a
> hundred chart with multiples shaded. Twelve of its twenty-one types carry a
> figure, because "use partitioning and place value to multiply" is a claim
> about a picture. Division reuses the SAME rectangle with the quotient
> missing, so the inverse is visible rather than asserted.
> Every Stage 3 bank now has its own harness in `assessment/exam-builder/tools/`
> (`node tools/stage3-<topic>.mjs`) that re-derives every answer independently
> of the bank — the new `stage3-multiplicative.mjs` caught a live defect, where
> `a − b × c` could evaluate negative (Stage 3 has no integers yet); the bank
> now builds the product first and places the start number above it.
>
> **NEW (2026-08-04, session — being pushed): REVISION GENERATOR overhaul +
> Stage 3.** Big session on `assessment/exam-builder/` (the "Revision Generator"
> on the homepage). Three strands:
>
> 1. **Print/layout rules, all universal across the five templates.** Stacked
>    fractions no longer spill into the line above (`--frac-scale` /
>    `--frac-leading` in `hsc-template.css`); diagrams are sized at a CONSTANT
>    SCALE from their own ink so a label is the same physical size in every
>    question (`fitDiagramSvg()`); tables, diagrams and answer rules all align
>    with the prompt text via `--content-indent`; topic bands can never be
>    stranded from their questions; an expression that ends a prompt is set on
>    its own line and is never split; thousands separators are non-breaking.
>    `styles/print.css` now suppresses the "A4 preview" watermark.
> 2. **The worksheet template was rebuilt.** Answer space is a KIND, not a
>    t-shirt size — see `utils/answer-space-rules.js` `resolveAnswerSpace()`:
>    a short answer gets a small inline box, working gets ruled lines sized by
>    marks, and a question answered on its diagram gets nothing. Same paper went
>    from 61 pages to 20. Two columns, like the textbook template.
> 3. **STAGE 3 (Years 5–6) added.** Stages are now DATA (`STAGES` registry in
>    `app.js`) rather than hardcoded pairs, so a new stage is one entry. **Five**
>    banks built so far — Represents Numbers, Additive Relations, Fractions,
>    2D Space and Area, and **Geometric Measure** (18 types: coordinate plane in
>    one and four quadrants, metric length, perimeter, protractor reading, and
>    angles on a straight line / at a point — reusing the linear, angle and
>    length engines, no new engine needed). See
>    `assessment/exam-builder/docs/stage-3-syllabus-reference.md`, which is the
>    source of truth for scope, outcome mapping and the calibration conventions
>    every further Stage 3 bank should follow.
>
> New `assessment/exam-builder/tools/` harnesses (plain `node`, no deps except
> `picker.mjs` which needs jsdom and skips without it), plus `layout-check.html`
> which renders real questions in the browser and measures the boxes.
>
> Last reviewed: 2026-08-26. **All LIVE** — the Adventure now has **14 Stage 4
> topics** (deployed 2026-07-08, commit `aad2142`): the Phase 3A–3G expansion
> (Ratios & Rates, Length, Equations, Probability, Indices, Linear) PLUS Angle
> Relationships (3G), Properties of Geometrical Figures (3H) and Data
> Classification & Visualisation (3I). Also live: schoolyard NPCs now default to
> a RANDOM Stage 4 topic (a teacher task still overrides). `adventureManifest.js`
> lists all 14 topics and matches the live game.
>
> **NEW (2026-07-22, session — deployed): portal UX + teacher-visibility + game
> compass.** (1) **Login readiness on both portals** (`portal/teacher/` +
> `portal/student/`): the Sign in button starts disabled ("Connecting…" + spinner)
> until the page scripts/Firebase SDK load, a progress bar runs through BOTH
> sign-in AND the dashboard data load (no more mid-load flip back to a clickable
> "Sign in"), and a 12s safety net prevents a lockout. (2) **Portal→game sign-in:**
> the student dashboard "Play" link now carries `?code=` so the game auto-signs-in
> (game side rebuilt). (3) **Results & Analytics Topic column** shows the actual
> challenge/mission name for Adventure rows (e.g. "The Round-Up") instead of a
> generic label — display-side, so existing rows are fixed too. (4) **Teacher
> dashboard Refresh button** reloads results/completions and updates an open
> Results / Manage Tasks view in place. (5) **Farm progress now reaches the
> teacher:** the game uploads any farm set finished while signed in, and back-fills
> locally-earned farm trophies on sign-in (see the game repo CLAUDE.md). (6)
> **Task navigation compass** in the Adventure — a top-of-screen arrow to the next
> teacher task (see the game repo CLAUDE.md). Deployed via commits `8fae9af` /
> `9df6990` / `bae6a94`.

> **NEW (being pushed 2026-07-08):** a **Fraction Bar + Number Line** teacher
> interactive tool (`interactive-tools/stage-4/number/fraction-bar-number-line/`)
> with a "Tools ▾" menu, plus two student pages in `online-quizzes/stage-4/number/`:
> the **Fraction Thinking Explorer** (open shuffler) and the **Fractions Number
> Line Quiz** (guided 8-stage progression; file kept as `fraction-thinking-quest.html`).
> The Quiz is **trilingual (EN/AR/FA)** and now **randomises every stage's values**
> each attempt (same learning intention). Both student pages are registered in
> `mmtToolRegistry.js`. See §5.
> Full details: the game repo's CLAUDE.md (per-phase sections + "Schoolyard
> default topics").
> **The Adventure's "Fraction Farm"** (deployed 2026-07-18, commit `0ec63a1`)
> — a THIRD region (large late-afternoon farming world, portal BEHIND the
> island spawn) with in-world fraction challenges, each 15 rounds +
> local-only bests + a trophy stand (trophy.glb): **Fence Challenge**
> (fraction of a length on a locked side-on number-line view, banded points
> + BULLSEYE), **The Round-Up** (f/d/% OF AN AMOUNT — herd cows into a pen;
> herd regroups into equal groups), **Order the Parts** (order f/d/% — swap
> carrots, confetti/reveal), **Crate Packing** (HCF as biggest common group
> size — animated fruit splitting, spill = remainder; host Peck the Bird).
> Also live: portal renames ("Fraction Farm" / "Retrieval Practice
> Playground"), rigged main1.glb player (Space = jump, Shift = run),
> name-only welcome screen (character creator retired).
> **NOT yet deployed (built 2026-07-18, game source): The Milk Splitter** —
> terminating vs recurring decimals: the machine performs the division live
> (digits grow, tank drains; recurring = endless drip loop 🔁), predict
> STOPS/REPEATS then pick the dot-notation jug; host Milkman Pearce + a
> Meshy milk-truck.glb. Needs `npm run build` → copy `dist/.` → push.
> Game-source checks 391 → 425, all passing. Full details: the game repo's
> CLAUDE.md (F1–F8, W7).
>
> **NEW (built 2026-07-22, TEACHER PLATFORM v2 — being deployed):** the Teacher
> Platform (`portal/teacher/index.html`) was redesigned **button-first** (a home
> screen of tiles; every action opens a pop-up window). New capabilities, all
> keeping the secure server-authed model:
> - **Add Student** now supports **bulk** (paste one "First Surname" per line).
> - **Saved classes** — new callables `createClass` / `setClassActive` + a
>   `classes` collection (a teacher reads only their own). Classes now persist
>   (even empty) instead of being derived from students.
> - **Set Dashboard Task** — assign online quizzes to a class with a due date via
>   new callables `createDashboardTask` / `updateDashboardTask` /
>   `setDashboardTaskActive` + a `dashboardAssignments` collection. The **student
>   portal** shows a **task pop-up** on login (+ a "Tasks set by your teacher"
>   section). A task can be a **whole quiz** OR a **custom sub-topic subset**: the
>   portal opens a quiz's existing "Create student quiz link" builder in a pop-up
>   and reads the generated link back (same-origin), storing it site-relative.
>   Only the 4 quizzes with a builder support subsets (integers, angles, fdp,
>   algebraic-techniques).
> - **Set Adventure Task** — reworked into locations (Number Island / Retrieval
>   Practice Playground / **Fraction Farm**). Farm challenges are now assignable
>   (see below). Number Island wording shows Pip = Addition & Subtraction facts,
>   Alby = Multiplication facts, Fern = Division facts (portal display only).
> - **Fraction Farm Adventure tasks** — a farm task = an `adventureAssignments`
>   doc with `location:"farm"` + `challengeId` (the game reads it, shows an
>   in-world objective, and writes a cloud completion tagged with the task id).
>   Needs the game built + pushed. Full game side: the game repo's CLAUDE.md
>   (DONE 2026-07-22 — Fraction Farm teacher tasks).
> - **Rules:** the live rules now include `adventureAssignments`,
>   `dashboardAssignments` AND `classes` blocks (an earlier go-live copy was
>   missing `adventureAssignments` — restored). `firestore.golive.claims.rules`
>   in the website repo matches the live rules.
>
> **NEW (2026-09-13): MMT SCREEN — a classroom display board at `/mmt-screen/`.**
> Jeff's own replacement for the Classroomscreen subscription, in MMT styling.
> Reached from the homepage by the violet **MMT Screen** nav pill and a hero
> button. Plain static files, no Firebase, no sign-in, no build step — it
> deploys with the rest of the site.
>
> * **IT IS A HOST PLUS A REGISTRY, NOT ONE BIG PAGE.** `mmt-screen/app.js` owns
>   the board (placement, drag, resize, z-order, saving, screens, backgrounds)
>   and knows NOTHING about any widget. Each widget is one ES module in
>   `mmt-screen/widgets/` exporting a definition object; `widgets/index.js` is
>   the registry. **Adding a widget = write the module, import it, add it to the
>   `ALL` array. Nothing else changes** — not the host, not the HTML, not the
>   dock. The contract is documented at the top of `widgets/index.js`. This is
>   the one convention in this folder worth defending: the moment a widget needs
>   a special case in `app.js`, the thing stops being extensible.
> * **THE STATE OBJECT IS THE SAVE FILE.** Everything on screen derives from
>   `state`, and `state` is what goes to `localStorage` under `mmtScreen.v1`
>   (debounced 250ms — a test that reads storage sooner than that races it).
>   A widget that keeps a setting in a closure instead of calling
>   `ctx.setState()` loses it on reload and there is no second mechanism.
> * **WIDGETS SAVE SETTINGS, NEVER LIVE TICKS.** The timer saves its mode and
>   its SET duration; how far through a run it is, it does not. A countdown that
>   restores itself mid-count after a reload is worse than useless — the teacher
>   has moved on and the board is lying about the time left.
> * **NEW WIDGETS SCAN FOR A FREE SLOT**, they do not cascade. Cascading was the
>   first build: adding four widgets in a row made a pile the teacher had to
>   drag apart before the board was usable, and the fourth landed over the
>   third's buttons so it looked broken. `freeSpot()` only cascades when the
>   board genuinely has no gap left.
> * **THE DRAWING LAYER IS A SINGLETON WITH AN OFF MODE, AND ESCAPE PUTS THE PEN
>   DOWN.** It is fullscreen and above every widget (which is the point — you
>   have to be able to ring a number on the timer), so while the pen is live the
>   canvas swallows every click and nothing on screen explains why. Escape was
>   added after a Playwright run got stuck exactly there.
> * **STROKES ARE STORED AS FRACTIONS OF THE VIEWPORT, NOT PIXELS OR A BITMAP.**
>   A bitmap has to be stretched or thrown away every time the window changes
>   size, and the window changes size every time this is plugged into a
>   projector. Points redraw crisply at any size and a stroke drawn on the
>   laptop lands in the same place on the board. Capped at 400 strokes so a
>   day's annotation cannot fill the storage quota.
> * **SCALING IS DONE IN JS (`fitUnit` sets `--u`), NOT WITH CONTAINER-QUERY
>   UNITS**, so it still works on the older Chrome/Edge builds on school
>   desktops.
> * **THE NAME PICKER DEFAULTS TO NO-REPEATS** and saves the used pile. A picker
>   that can call the same student three times while another is never called
>   produces a visibly unfair lesson and the class notices within a week.
> * **THE MMT TOOL LAUNCHER HAS NO LIST OF TOOLS IN IT, AND MUST NEVER GET ONE**
>   (`widgets/launcher.js`, shipped 2026-09-13). It `fetch`es the site's own
>   `/index.html` and reads the `a.resource-card` elements out of it with
>   `DOMParser` — all 111 cards already carry href, title, `data-type`,
>   `data-stage`, `data-topic`, the outcome code and Jeff's own `data-search`
>   keyword string. A hand-kept copy would be a second catalogue that rots:
>   every new tool would be missing from the board until someone remembered to
>   add it twice, and nobody remembers the second time. Notes on it:
>   - **The nav is parsed too.** Mills Maths Adventure, Resources by Stage and
>     the dashboards are top-level destinations with NO card — searching
>     "adventure" found nothing until `.nav-links a[href]` was added, which is
>     the most obvious test anyone would give it. Where a nav link and a card
>     share a URL the **card wins** (it has the stage, topic and keywords; the
>     nav link has a label and nothing else).
>   - **Homepage hrefs are SITE-ROOT relative.** Resolved against
>     `location.origin`, not the current page, or every link 404s under
>     `/mmt-screen/…`.
>   - **`DOMParser`, not a regex** — the homepage mixes `Years 7&#8211;10` and
>     `Years 7–10` in the same attribute, and the parser decodes both to one
>     string so the stage filter does not end up with two of everything.
>   - **RESULTS ARE RANKED, not left in page order.** The `data-search` strings
>     are deliberately generous (the Length flip cards list "circumference"),
>     so unranked results answered "circumference" with *Length*. Title hits
>     outrank keyword hits ~10:1; page order only breaks ties.
>   - Cache-first from `localStorage` (`mmtScreen.catalogue.v1`), then a
>     background refresh, so it paints instantly and still picks up a tool
>     added last night. Favourites are starred and saved per widget; the search
>     box is deliberately NOT saved (a stale query at the start of a lesson
>     hides everything and looks broken).
> * **THE STARTER SAVES WHAT IS ON THE BOARD; THE TIMER DELIBERATELY DOES NOT.**
>   `widgets/starter.js` puts `current` AND `revealed` in the saved state,
>   because a starter is what thirty people are reading and writing about: a
>   projector blink or a lid-open must bring back the SAME problem, not a new
>   one that wipes out half the room's work. The timer is the mirror image and
>   the reasoning is in its own file. 43 built-in starters (problems, "which
>   one doesn't belong", true/false), no-repeats like the name picker, and it
>   WRAPS rather than announcing at 8:55am that it has run out. Jeff's own
>   starters go in through "Add yours" (blank line between, answer on an `A:`
>   line), are keyed `c<n>` against the bank's `b<n>` so adding one never
>   renumbers the bank, and get a "Mine" chip that stays hidden until he has
>   some. **A question is never labelled with its own opening words** — "Which
>   one doesn't belong?" and "True or false:" are both the kind AND the start
>   of the prompt, so `labelFor()` drops the label when the question already
>   says it.
> * **TIMER PRESETS STACK (2026-09-23, teacher request).** The first preset
>   press SETS the time; each further preset press in a row ADDS to it (10m,
>   10m, 5m = 25:00, capped at 5 h like +/−). Start, Reset, +/− or a mode change
>   ends the run, so the next preset sets afresh. One `stacking` flag in
>   `widgets/timer.js`. Test gotcha: the presets are `pointer-events:none`
>   until the card is hovered, so a forced click lands on nothing — hover first
>   or `dispatchEvent('click')`.
> * **THE RANDOM GENERATOR SAVES SETTINGS, NEVER THE NUMBERS**
>   (`widgets/maths-random.js`) — a reload gives back the generator you set up,
>   ready to roll, not a stale answer the class has already done. Five modes
>   (integers, dice, fractions, decimals, coordinates) and the settings are the
>   ones that change the MATHEMATICS: negatives in range, "fraction that needs
>   simplifying" vs "already simplest", proper/improper/mixed, first-quadrant-
>   only coordinates (which also excludes points ON an axis, since those are in
>   no quadrant at all). **Constrained draws use bounded rejection** — `draw()`
>   retries ~80 times then returns its best effort, so an impossible setting
>   (denominators up to 3, "needs simplifying") gives a slightly-wrong number
>   instead of a frozen board.
> * **PENDING SAVES FLUSH ON `pagehide` / `beforeunload` / hidden
>   `visibilitychange`** (app.js). The 250ms debounce stops a drag hammering
>   localStorage, but it also means the last quarter-second is still in memory
>   when the page goes away — and the way this page goes away is a teacher
>   shutting the lid right after changing something.
> * **THE QR CODE WIDGET ENCODES LOCALLY** (`widgets/qr-code.js`, 2026-09-16).
>   The encoder is Project Nayuki's qrcodegen, compiled from TS and vendored at
>   `widgets/vendor/qrcodegen.js` with one added `export default` — no CDN, no
>   QR API, the link never leaves the laptop. Bare domains get `https://`
>   prepended (phones treat a scheme-less address as text); `3.14`, `mailto:`
>   and plain text are untouched. The generated `code` is saved (a reload keeps
>   the same code); dark-on-white square modules only. Verified in Playwright by
>   decoding the on-board SVG and the downloaded PNG with jsQR.
> * **The dock icons must stay visually distinct.** Name picker (people) and
>   Random maths (two dice) shipped with the SAME icon and it was a coin toss
>   which one you hit; caught in a screenshot, not by a test.
> * **SAVING A SCREEN TO A TEACHER ACCOUNT (2026-09-13).** Teachers who already
>   have a code can press **Save** and open that screen on any computer. It
>   reuses the existing code exchange exactly as the portals do — no new auth,
>   no new functions. **NEEDS A RULES DEPLOY:** a `screens` block, in
>   `firestore.golive.claims.rules`, pasted into the Firebase console. Until
>   that lands, Save fails with a message naming the rules and nothing else
>   breaks.
>   - **`cloudSync.js` IS IMPORTED DYNAMICALLY, AND THAT IS NOT AN
>     OPTIMISATION.** It statically imports the Firebase SDK from gstatic. As a
>     static import anywhere in the board's module graph, a gstatic outage, a
>     school proxy blocking it, or no network at all would stop the WHOLE PAGE
>     loading — a timer and a traffic light taken out by a sign-in feature
>     nobody was using. `app.js` does `await import()` in a try/catch; if it
>     fails the two cloud buttons stay hidden and the board is untouched. There
>     is a Playwright case for exactly this (the container cannot reach gstatic,
>     so it tests itself).
>   - **SCREENS ARE WRITTEN DIRECTLY BY THE CLIENT**, unlike classes and the
>     assignment collections, which go through callables. A screen is the
>     teacher's own furniture — not identity, not student results, which is what
>     the server-side-only convention protects. The rules do the scoping: create
>     requires the new doc to carry the caller's own `teacherCode` AND the doc
>     id to start with it; update requires BOTH the existing and the incoming
>     doc to be theirs (without the second check a teacher could hand a screen
>     to somebody else's code); delete has no `request.resource` so it checks
>     the existing doc only.
>   - **THERE IS NO BACKGROUND SYNC — Save is a button.** The local save fires
>     on every drag frame; pointing that at Firestore would be hundreds of
>     writes to move one widget.
>   - **localStorage IS STILL THE AUTHORITY.** A saved screen is a COPY; opening
>     one writes it into local state and the board reads local from then on.
>     Nothing on the page ever waits on the network to paint. Opening a cloud
>     screen REPLACES the local screen of the same id rather than adding a
>     second one with the same name.
>   - **DRAWING STROKES ARE STRIPPED BEFORE SAVING** (`screenPayload.js`, kept
>     apart from cloudSync so the payload rules can be tested without Firebase).
>     A saved screen is the set-up; pen marks are this lesson's annotations and
>     nobody wants them over next period's board. They are also the only part
>     that grows without limit — a measured 6.3 MB for a well-drawn board
>     against Firestore's 1 MiB ceiling. Right behaviour and the size fix at
>     once. The name picker's class list IS saved: the same first-name data the
>     platform already holds, and a per-screen choice the teacher makes.
>   - `auth` gotcha already fixed once: `paintCloudChrome()` must NOT re-derive
>     the teacher from the cached profile. It did, so the auth callback could
>     never clear it — a cached session with a dead token showed a Save button
>     forever and every press failed with a permission error.
> * **WIDGETS FILL THEIR CARD (2026-09-13).** `fitUnit(el, {nw, nh})` scales
>   from each widget's OWN natural content size instead of a fixed base with a
>   ~2.2x cap, which is why a dragged-out widget used to sit in a lake of white
>   space: past roughly double, the contents just stopped growing. Two rules
>   learned the hard way:
>   - **The natural width must be MEASURED, not guessed.** The timer claimed
>     250, then 285; the presets row actually needs 310 at --u: 1, and until it
>     said so "20m" kept dropping onto a second line. The widest row in the
>     layout IS the natural width.
>   - **Everything that contributes to that width has to scale.** The chips had
>     `font-size: calc(var(--u)*12px)` but `padding: .2rem` — so the numbers
>     grew and the pills around them did not, and the layout stopped widening.
> * **`def.aspect` LOCKS A WIDGET'S PROPORTIONS** (width ÷ height of the whole
>   card) and `def.headOverlay` floats its header instead of letting it take
>   ~30px off the top forever. The traffic light uses both: it is now JUST the
>   light — the caption and hint are gone, because a light on a classroom wall
>   does not come with a paragraph, and the text was what forced a wide card
>   that was mostly empty. It fills 87% of its card at any size.
> * **THE TEXT WIDGET HAS A REAL FORMATTING BAR** — size stepper, B/I/U, text
>   colour, background colour and alignment as dropdowns, plus a second bar of
>   maths symbols (Greek · operators · relations · structures · arrows) that
>   opens under it. Four things in that file are non-obvious and each one was a
>   bug first:
>   - **The base font-weight must not already be bold.** It was 650, so the
>     browser judged the text already bold and the FIRST press of B set
>     `font-weight: normal`. 500 reads weighty on a projector and still counts
>     as not-bold.
>   - **Maths is inserted with the Range API, NOT `execCommand('insertHTML')`.**
>     insertHTML runs markup through the paste sanitiser, which with
>     styleWithCSS on rewrites classes into computed inline styles — a fraction
>     went in as a two-span stack and came out as a loose span carrying
>     `text-align:center; font-weight:650` with the numerator torn out.
>   - **The editable area is a plain block inside a centring wrapper.** Making
>     `.tx-body` itself a grid (to centre vertically) turned every element child
>     into a full-width grid item, so a fraction drew its bar right across the
>     box and forced a line break after itself.
>   - **Maths is spans and borders, not MathLive or KaTeX.** Every part stays
>     editable (click into a denominator and retype it), the saved state is
>     still just a string of HTML, and the board keeps no network dependency.
>     Stored markup is sanitised on load — it is the one field that round trips
>     through a database as markup.
> * **FONT SIZE APPLIES TO THE SELECTION** (2026-09-13). `execCommand('fontSize')`
>   only understands the seven legacy HTML sizes, so it marks the selection as
>   size 7 and those elements are rewritten to the real px value — and
>   `styleWithCSS` must be turned OFF for that one call or it emits a span and
>   leaves no `<font size="7">` to find. Two traps, each a bug first:
>   - **The number input steals the selection it is meant to resize.** The +/-
>     buttons cancel their own mousedown so the highlight survives, but a real
>     `<input>` has to take focus, so "highlight a heading, type 64" resized the
>     whole panel. The last real highlight (tracked via `selectionchange`, not
>     just keyup/mouseup) is restored before the size is applied.
>   - **Sizing the FIRST words leaves a phantom blank line.** Chrome
>     materialises the pending style as `<div><span style="font-size:…"><br>`
>     at the top of the editable, a moment AFTER the command returns — so an
>     inline check is too early to see it. `dropPhantomLine()` runs on every
>     commit and only removes a leading empty block that CONTAINS a sized span,
>     so a blank line typed with Enter is left alone.
> * **MATHS LIVES IN ITS OWN BOX** (`widgets/mathfield.js`). Loose structures in
>   the running text were wrong three ways at once — a fraction sat low against
>   the words, letters looked like prose, and nothing said where the equation
>   ended. One `.meq` container fixes all three because they are the same
>   question: is this text or is this maths? Hard-won details:
>   - **Alignment is `vertical-align: middle`**, which IS the mathematical axis.
>     The old `-0.45em` was eyeballed against one font at one size.
>   - **Letters italic, digits upright.** CSS cannot select digits, so letter
>     runs are wrapped in `<i class="mv">` as they are typed, with the caret
>     saved and restored as a character offset.
>   - **EVERY SLOT IS `display:inline-block`, AND A DELETE THAT WOULD EMPTY ONE
>     IS INTERCEPTED.** A `<sup>` is a plain inline element: replace all its
>     contents and Chrome deletes the element too, which is exactly why typing a
>     power gave "x3" on the baseline. `guardSlotDelete()` empties the slot to a
>     zero-width space instead. `tidy()` also strips the font-size/font-style
>     Chrome carries forward as a typing style when a slot is emptied.
>   - **NORMALISE BEFORE SELECTING THE PLACEHOLDER, NOT AFTER.** Italicising
>     replaces the text node inside it, collapsing the selection; the caret was
>     then restored by offset and landed before the whole structure.
>   - **Tab walks the slots and parks at the END OF THE EQUATION, not outside
>     it** — tabbing out made every later structure start a new box, so one
>     expression became three fields. Escape is what leaves.
>   - **A caret needs a real text node to sit in.** `(box, childCount)` gets
>     normalised by Chrome into the deepest inline descendant, and an empty text
>     node silently swallows the next keystroke — both bugs looked like "Tab
>     does nothing".
> * **GROUP MAKER** (`widgets/group-maker.js` + `widgets/lists.js`). Groups are
>   DEALT round-robin, not sliced: slicing 17 names into 7 groups leaves an
>   empty group on the board. The made groups ARE saved — a reload that
>   re-dealt would send half the room to the wrong table; only the button deals
>   again. **Class lists live in their own store** (`mmtScreen.lists.v1`),
>   shared by every screen and every widget, and deliberately NOT part of a
>   saved screen — so a class roll does not travel to Firestore unless the
>   teacher names a list inside a widget.
> * Still to build: scoreboard, work symbols, clock, QR, embed. Also worth
>   doing: point the name picker at `lists.js` so a class is typed once.

---

## 1. What this is
A hub-and-spoke website of interactive maths tools for NSW Years 7–10, built by a
NSW maths teacher. It now also has a **secure Student/Teacher Platform** and
**Mills Maths Adventure** (a 3D low-poly maths game), all live.

- **Live site:** https://www.millsmathstools.au (GitHub Pages + custom domain via `CNAME`; Netlify retired 2026-10-08)
- **GitHub repo (the website):** https://github.com/journeyintosound2/mathstools (branch `main`; was `jeffmills2-rgb/mathstools` — the old URL redirects)
- **Firebase project:** `mills-maths-tools` (Blaze plan)

## 2. TWO folders / two projects (important)
1. **`mathstools-main 2/` = THE WEBSITE** (what deploys). Plain static HTML +
   the portal + the *built* Adventure. It is a **git clone of the repo above**;
   Netlify auto-deploys `main` on every push (`netlify.toml` = `publish="."`,
   no build step).
2. **`Mills Maths Adventure/` = THE GAME SOURCE** (Vite + React + R3F + Zustand +
   MathLive). Not uploadable as-is — must be **built**. Also holds the **Cloud
   Functions** (`functions/`).

## 3. Deploy workflows
- **Website change** (HTML tool, quiz, homepage, portal): edit in
  `mathstools-main 2` → `git add -A && git commit -m "…" && git push`. Live in ~1 min.
- **Adventure change:** edit in `Mills Maths Adventure` → `npm run build` → copy
  `dist/.` into `mathstools-main 2/game-platforms/mills-maths-adventure/` → push
  the website. (`vite.config.js` has `base:"./"` so it works in that subfolder.)
- **Cloud Functions change:** edit `Mills Maths Adventure/functions/index.js` →
  `firebase deploy --only functions --project mills-maths-tools`.
- **Firestore rules:** deploy MANUALLY via Firebase Console → Firestore → Rules
  (never from code). Current live rules = `firestore.golive.claims.rules` (kept in
  the website repo for reference).
- Rollback safety branch on GitHub: `backup/pre-portal-…`.

## 4. Security model (the core of the rebuild)
- **No anonymous auth, no client identity reads.** Everyone signs in via the
  **secure code exchange**: Cloud Functions `exchangeStudentCode` /
  `exchangeTeacherCode` validate a typed code server-side and mint a Firebase
  custom token with claims `{ role, studentCode | teacherCode, … }`; clients
  `signInWithCustomToken`.
- **`createStudentForTeacher`** (callable, teacher-authed) creates students
  server-side, stamped with the caller's own `teacherCode`.
- **`setStudentAvatar`** (callable, student-authed) saves the Adventure player's
  customisable avatar to the caller's OWN `students/{code}` doc (code from the
  verified claim). Admin-SDK write (no rules change); avatar is returned by
  `exchangeStudentCode` and applied on sign-in so the character follows the
  student across devices. Cosmetic only — no answers/PII stored.
- **Teacher-set Adventure tasks** (callables `createAdventureTask`,
  `updateAdventureTask`, `setAdventureTaskActive`, all teacher-authed and stamped
  with the caller's own `teacherCode`) write the `adventureAssignments` collection;
  rules let a teacher manage their class's tasks and a student read active tasks
  matching their `teacherCode`+`className` claims. See §6 + the game repo's
  `docs/teacher-adventure-tasks-plan.md`. **Farm tasks (2026-07-22):** the same
  callables also accept a farm shape (`location:"farm"` + `challengeId`, no NPC/
  topic) — the game writes the completion (game repo CLAUDE.md).
- **Saved classes (2026-07-22):** callables `createClass` (idempotent, doc id
  `<TEACHERCODE>__<NAME>`) / `setClassActive`, both teacher-authed and stamped
  with the caller's `teacherCode`, write a `classes` collection. Rules: a teacher
  reads only their own; client writes denied.
- **Dashboard tasks (2026-07-22):** callables `createDashboardTask` (one doc per
  quiz), `updateDashboardTask`, `setDashboardTaskActive`, teacher-authed, write a
  `dashboardAssignments` collection (fields `toolId`, `title`, `launchUrl`,
  `className`, `dueAt`, `active`). Rules mirror `adventureAssignments` (teacher
  reads own; student reads active tasks matching teacherCode+className). The
  `launchUrl` can carry a quiz's `?assignment=1&level=…&types=…` subset params.
- **Live Firestore rules are strict + claim-based:** a student reads only their
  own data; a teacher reads only their own class; results are create-only and
  scoped to the signed-in student; no client identity writes; no result
  edits/deletes; default deny. Identity is managed server-side only.
- **Never store typed student answers in Firebase.** The web API key is public by
  design. The **arcade/flip-card games** use a **different** Firebase project
  (`mmt-firebase-games`) and are out of scope for these rules — BUT **Mills Maths
  Adventure is on `mills-maths-tools`** (it joined the secure ecosystem), so the
  claim-based rules above DO apply to it.
- Functions region: **us-central1**. Test codes: student `8F6AYH`, teacher `MILLS0423`.

## 5. Website structure (`mathstools-main 2`)
```
index.html                         hub / homepage (nav links to portal + Adventure)
portal/                            THE PLATFORM
  student/index.html               Student Platform (results/progress + teacher-set task pop-up)
  teacher/index.html               Teacher Platform — BUTTON-FIRST (v2, 2026-07-22): a tile home
                                   screen → pop-ups for Add Student (single+bulk), Add Class,
                                   Set Dashboard Task (quizzes + sub-topic builder), Set Adventure
                                   Task (island/playground/farm), Students, Results, Manage Tasks
  admin/index.html                 disabled page (admin via Firebase Console)
  shared/ firebaseConfig.js · codeExchangeClient.js · quizClient.js ·
          mmtToolRegistry.js · resultUtils.js · portalStyles.css ·
          adventureManifest.js (Stage-4 topics/NPCs for the Set-task form)
online-quizzes/ , interactive-tools/ , worksheet-creators/ , flip-cards/ , games/
assessment/exam-builder/
assessment/exam-builder/           THE REVISION GENERATOR (homepage calls it that)
  app.js                           UI + the STAGES registry (stage3/4/5) + generation
  question-banks/<topic>/          Stage 4 · stage-5/<topic>/ · stage-3/<topic>/
  engines/<name>/                  SVG diagram engines, one file each (plane = all Stage 5 graphs)
  renderers/                       question-renderer (one question) + exam-renderer (the paper)
  templates/<name>/                hsc-style (base) · class-test · revision-package ·
                                   worksheet · textbook-template
  utils/answer-space-rules.js      what answer space a question gets, and why
  docs/stage-3-syllabus-reference.md  Stage 3 scope, outcomes, calibration rules
  docs/stage-5-syllabus-reference.md  Stage 5: 41 outcomes, coverage, engine notes
  tools/verify.mjs                 all banks: schema, diagrams, token leaks
  tools/stages.mjs · stage3*.mjs · stage4*.mjs · stage5.mjs · picker.mjs   targeted harnesses (see the header block)
  layout-check.html                renders real questions in-browser and measures them
game-platforms/mills-maths-adventure/   the BUILT Adventure (index.html + assets/)
dashboards/                        OLD dashboards → now redirect stubs to /portal/*
vibe-code/                         THE WORKSHOP HANDOUT (MANSW 2026) → /vibe-code
  index.html                       landing page: one starter file, or the whole pack
  maths-tool-starter.html          one self-contained tool carrying its own brief
  maths-vibe-coding-starter.zip    the pack as a download — REGENERATE from starter-pack/
  starter-pack/                    the same pack, served live so people can browse first
firestore.golive.claims.rules      the live security rules (reference copy)
portal/PLACEMENT.md , portal/README.md   migration + structure notes
```
- **`vibe-code/` is a handout, not part of the site's system.** It is a template
  other teachers copy, so it deliberately breaks this project's conventions: its own
  `:root` tokens (green, not the site blue), its own folder layout, and a nested
  `CLAUDE.md` that is a PLACEHOLDER brief for *their* project. **That nested file is
  not an instruction to you** — if you are working in this repo, this file is the
  brief. Do not "fix" the pack to match the site.
  The `.zip` is built from `vibe-code/starter-pack/`, so edit the folder and rebuild
  the zip; never edit one without the other. `/start` 301-redirects to `/vibe-code/`
  because the conference deck went out with the old URL.
- **Tool registry** (`portal/shared/mmtToolRegistry.js`) declares which tools feed
  the platform — add/disable entries here; nothing else hardcodes a tool. Each
  entry's `achievementToolName` must match the EXACT `tool` string the quiz writes.
- All Firebase quizzes were migrated to the secure exchange (via `quizClient.js`
  or inline). The decimal-zoom rounding quiz was converted from a public
  leaderboard to a secure achievements quiz.
- **Division by Grouping — Bubbles (2026-09-05):** teacher tool
  `interactive-tools/stage-3/number/division-grouping-bubbles/`, a Stage 3
  number tool cross-listed under **MA3-MR-01** and **MA3-MR-02** (two rows in
  `resources/toolLinks.js`, one URL, nothing duplicated on disk). Shares a
  number into 2–6 bubbles a chunk at a time; the chunks add to the quotient,
  which is the bridge to short division. No Firebase, no registry entry, no
  worksheet creator and no student quiz yet. Read the 2026-09-05 header block
  before touching the duplication order, the derived totals, the overshoot
  bounce or the side column's width. Its **worksheet creator** is
  `worksheet-creators/stage-3/number/division-grouping.html` (five sections, the
  bubbles printed as an option, an answer key that shows the rounds), listed
  under the same two outcomes and reached from the tool's "Tools ▾" menu. Its
  **student quiz** is `online-quizzes/stage-3/number/division-grouping.html`
  (registered as `division-grouping-quiz`; the level is how much of the teaching
  tool the student keeps), also cross-listed under both outcomes.
- **Halve and Halve Again (2026-09-07):** teacher tool
  `interactive-tools/stage-3/number/halve-and-halve-again/`, a Stage 3 number
  tool cross-listed under **MA3-MR-01** and **MA3-MR-02**. A bar cut in half,
  and in half again, until the number of equal parts is the divisor — ÷ 2,
  ÷ 4 and ÷ 8 only, because those are the divisors repeated halving reaches.
  No Firebase, no registry entry, no worksheet creator and no student quiz yet.
  Read the 2026-09-07 header block before touching the split animation, the
  copy-out, `fitBar()`'s two caps or the halving wall's label gutter. The other
  two Stage 3 division tools link to it and it links back to them.
- **Circumference of a Circle (2026-09-08):** teacher tool
  `interactive-tools/stage-4/measurement-space/circumference-of-a-circle/`,
  filed under **MA4-LEN-C-01**. Diameters wound around the rim, then the whole
  circle rolled out along a number line drawn at the circle's own scale, then
  ten ×10 zooms that hold the end of the circumference still and pin down one
  digit each; plus a **Test a number** mode whose magnifier is a camera on the
  circle itself. No Firebase, no registry entry, no siblings yet. Read the
  2026-09-08 header block before touching the winding map, the roll-out, the
  zoom windows, the tick order or the camera magnification. Perimeter of Plane
  Shapes links to it and it links back.
- **Complete the Square (2026-08-31):** teacher tool
  `interactive-tools/stage-5/algebra/complete-the-square/`, the first Stage 5
  algebra tool. Two modes (tiles, and the formula proof), cross-listed under
  **MA5-EQU-P-01 / MA5-EQU-P-02 / MA5-ALG-P-01**, alongside its worksheet
  creator `worksheet-creators/stage-5/algebra/complete-the-square.html` (the
  first Stage 5 creator, listed under the same three outcomes, reached from the
  tool's "Tools ▾" menu). Read BOTH 2026-08-31 header blocks before touching the
  tile colours, the proof's opening algebra steps, the exact-answer arithmetic
  or the drawn radical.
- **Perimeter of Plane Shapes family (2026-09-01):** teacher tool
  `interactive-tools/stage-4/measurement-space/perimeter-plane-shapes/`, filed
  under **MA4-LEN-C-01**, 18 shapes over four groups (quadrilaterals,
  triangles, regular polygons, and six composite figures), and its worksheet
  creator `worksheet-creators/stage-4/measurement-space/perimeter-plane-shapes.html`
  (five sections, same figures, answers with reasons) and its student quiz
  `online-quizzes/stage-4/measurement-space/perimeter-plane-shapes.html`
  (registered as `perimeter-plane-shapes-quiz`; the level decides how much of
  the teaching tool the student keeps), beside the
  **Length worksheet creator**
  (`worksheet-creators/stage-4/measurement-space/length/`), whose Basic
  question types it was built from. Teaching tool ONLY so far (no quiz), and it
  touches neither Firebase nor the registry. Read the 2026-09-01 header block
  before touching the winding rule, the ghost transforms, the L-shape or
  trapezium parametrisation, or the board's height budget.
- **Unit Conversion family (2026-08-31):** teacher tool
  `interactive-tools/stage-4/measurement-space/unit-conversion-number-line/`
  and worksheet creator
  `worksheet-creators/stage-4/measurement-space/unit-conversion.html`.
  **Cross-listed under five outcomes** so it is findable from both stages:
  Stage 3 **MA3-GM-02** / **MA3-NSM-01** / **MA3-3DS-02**, Stage 4
  **MA4-LEN-C-01** / **MA4-RAT-C-01** (ten rows, two URLs, nothing duplicated
  on disk — the same cross-listing convention as the Protractor). No Firebase,
  no registry entry, no student quiz yet. Read the two 2026-08-31 header
  blocks before touching the drawn domain, the hop marks, the multiplier
  constraints or the worksheet's tick bucketing.
- **Multiplying Fractions — Area Model (2026-08-26):** teacher tool
  `interactive-tools/stage-4/number/multiplying-fractions-area-model/`, filed
  under **MA4-FRC-C-01**. Teaching tool ONLY so far (no worksheet, no quiz), and
  it does not touch Firebase or the registry. Its “Tools ▾” menu holds the other
  four Stage 4 fraction tools, and each of those now links back to it. FIVE
  reveal steps, an opt-in number line, a Simplify/Undo re-grouping, and
  deliberately almost no on-screen prose — read the 2026-08-26 header block
  before adding anything to it. Its worksheet creator is
  `worksheet-creators/stage-4/number/multiplying-fractions.html`.
- **Fraction to Percentage family (2026-08-18):** teacher tool
  `interactive-tools/stage-4/number/fraction-to-percentage/` (double number line,
  fraction above / percentage below, step reveals, predict mode) +
  `worksheet-creators/stage-4/number/fraction-to-percentage.html` +
  `online-quizzes/stage-4/number/fraction-to-percentage.html` (registered in
  `mmtToolRegistry.js` as `fraction-to-percentage-student-quiz`). See the
  2026-08-18 header block.
- **Fraction Bar + Number Line family (2026-07-08):**
  - **Teacher tool** `interactive-tools/stage-4/number/fraction-bar-number-line/index.html`
    — self-contained (inline CSS/JS): a fraction shown as a part-whole bar, a
    point/decimal on a (double) number line, and as division (Animate). Denominator
    2–100, Bar/Number-Line/Decimal/Simplify toggles, smooth zoom-out, drag the
    point, arrow-key nudge. Has a **"Tools ▾"** menu → **Student Quiz** link.
  - **Student pages** in `online-quizzes/stage-4/number/`, both registered in
    `mmtToolRegistry.js` and using the secure `MMTQuiz` save (dynamic import → work
    offline; **no typed answers stored**, only structured `types[]` flags):
    - `fraction-thinking-explorer.html` — open "Explore + shuffler" (superseded for
      classroom use by the Quiz; kept enabled).
    - `fraction-thinking-quest.html` — **"Fractions Number Line Quiz"** (title/registry
      renamed; filename kept). Guided **8-stage** progression
      (understand→equivalence→density→recurring→division→improper→compare→convince),
      **trilingual EN/AR/FA** (selected language on top, English beneath; number line
      stays LTR/Western numerals), part-b checkable inputs + reasoning chips stored as
      `types[]` tags. **Every stage randomises its values per attempt** via per-stage
      `gen()` functions cached in `P` (`{token}` templates filled by `fill()`); same
      learning intention each time, cleared on reset. `score/total` = stages completed.
    - Tested headlessly (jsdom): all 8 stages generate valid params in all 3 langs,
      no leftover `{tokens}`, satisfiable across 200 random trials.
    - TODO: AR/FA strings want a fluent proofread; hub cards for the student pages;
      teacher portal export of the `types[]` reasoning tags.

## 6. Mills Maths Adventure (game source repo)
- Vite + React + R3F. `src/` (game), `functions/` (Cloud Functions),
  `portal/` (a DEV copy used only by the automated checks — the **website**
  `portal/` is the deployed one).
- **Dev panel** shows only in `npm run dev` (hidden in the production build).
- Defaults: **Camera Lock ON, Quest HUD OFF**.
- **391 headless system checks** in `src/dev/systemChecks.js` — run via the babel
  parse-check + Node harness (set `package.json` `type:module` temporarily, shim
  localStorage/window/document, run `runSystemChecks()`; restore package.json).
  esbuild can't run in that harness (platform mismatch) — don't rely on it.
- **Player avatar cloud-save (W3):** customisable "shape" avatar saved to the
  student's `students/{code}` doc via `setStudentAvatar` (follows them across
  devices). **Touch controls (W4):** tap-to-move / tap-to-interact / on-screen
  keypad, ⚙-toggled. **Soft-cartoon graphics (W5):** ⚙ **Graphics** High/Low
  (auto-low on touch) — lighting/AO/bloom/outlines/wind-grass; needs the
  `@react-three/postprocessing` dep (`npm install` before build). **World redesign
  (W6):** bigger irregular island, square plaza, snow/ash themed zones, grove→
  SchoolYard portal. FPV toggle is PARKED (not working). Full where-everything-
  lives: the game repo's `CLAUDE.md` (W3–W6 sections).
- Cloud save: completed attempts write a compact `achievements` record + a rich
  `adventureAttempts` record (no typed answers). Demo/skip stays local-only.
  Curriculum/adapters/diagram systems are isolated — only adapters touch legacy banks.
- **Teacher-set tasks (Phases 1–2, built 2026-07-01):** teachers assign tasks from
  the Teacher Platform; students get them roster-pushed by class, delivered by the
  chosen NPC (Pip/Fern/Alby, off-theme allowed). New `adventureAssignments`
  collection + functions (§4). Game side: `cloudSession.loadAssignments()` →
  runtime missions + NPC chain overlay (teacher steps prepended so they show even
  for a finished student). Completion is tagged with `taskId` and surfaced in the
  teacher portal (per-task Done count + View breakdown, and a "Teacher task" badge
  per student). Full design/where-everything-lives:
  `Mills Maths Adventure/docs/teacher-adventure-tasks-plan.md`.

## 7. Working agreement with Claude
- **Test before deploying** where practical: website pages via a local server
  (`python3 -m http.server` from `mathstools-main 2`, open the page); bigger
  changes via a branch + Netlify deploy preview.
- Keep the secure-exchange model; never re-open anonymous writes or client
  identity writes; never store typed answers; don't weaken the live rules without
  a clear reason.
- Match existing design tokens / folder casing (lowercase-hyphenated).
- **Teacher-facing controls stay readable in English.** A worksheet creator's
  language `<select>` names the language in ENGLISH FIRST with the native script
  in brackets — `English` / `Arabic (العربية)` / `Farsi / Persian (فارسی)` (the
  Adding and Subtracting Fractions one prints bilingually, so it reads
  `Arabic + English (العربية)`). The control's own label keeps the English name
  in every language too (`زبان برگه (Worksheet language)`), or a teacher who
  switches to Farsi cannot find the control again. Swept across all 7 creators
  with a language selector on 2026-08-20. Student-facing toggles are different —
  the quizzes' `EN / ع / فا` buttons are chosen BY the student, so native script
  alone is right there.
- When a change spans both repos (e.g. a teacher feature + a function), deploy the
  **function first**, then push the website.

## 8. Open / future items
- **Student-quiz sign-in sweep:** 11 of 26 quizzes carry the v2 login block
  (adding-subtracting-fractions joined 2026-08-20).
  The other **15** still have bespoke inline sign-in and their own completion
  screens (9 of those have no `.certSub` at all) — extend the v2 block to them
  when convenient. Within the ten, `collecting-like-terms` and `factor-circles`
  have no `.certSub` (they end with a copy-a-message panel), so only the chip
  changed there; their "paste into Google Classroom" copy tips are about a
  celebration message, not a result, and were left alone (the trilingual one
  has AR/FA translations of that string too).
- **Multiplying Fractions — Area Model siblings:** the teaching tool and the
  **worksheet creator** shipped 2026-08-26 (see the header block). Still to
  build: a **student quiz** (`online-quizzes/stage-4/number/multiplying-fractions.html`,
  registry id `multiplying-fractions-quiz`) carrying the v2 login block and the
  MathLive fraction box — a ladder that fades the model, then the counting, then
  leaves only the rule. Also possible in the tool itself: **mixed numbers**
  (needs a grid wider than one whole, and is the bridge to expanding brackets),
  and **dividing** fractions on the same square.
- **Complete the Square siblings:** the teaching tool AND its worksheet creator
  shipped 2026-08-31. Still
  to build: a **worksheet creator** and a **student quiz** (both stubbed as
  greyed rows in its Tools menu). Extensions flagged in the header block:
  non-monic quadratics in the TILE mode (needs a "divide by a" step), c < 0,
  and a discriminant view built on the existing "no real solutions" guard.
- **Unit Conversion — Double Number Line siblings:** the teaching tool and the
  **worksheet creator** both shipped 2026-08-31. Still to build: a **student
  quiz** (`online-quizzes/stage-4/measurement-space/unit-conversion.html`,
  registry id `unit-conversion-quiz`) carrying the v2 login block — it is
  stubbed as the one remaining greyed row in the tool's Tools menu. A
  **cubic-units section** for the worksheet creator (isometric cubes → 1 cm³ =
  1 mL) is scoped and deliberately unbuilt. Possible extensions to the tool itself:
  **time** (h/min/s — valuable precisely BECAUSE the ratio is 60, not a power
  of ten, so it breaks the “move the decimal point” habit) and **area/volume**
  (m² ↔ cm² is 10 000, not 100 — the classic trap, and it would need its own
  tier). Digital storage (GB/MB/kB) was considered and left out.
- **Division by Grouping:** the teaching tool, the worksheet creator AND the
  student quiz all shipped 2026-09-05 — the family is complete. Possible
  extensions to the tool itself: a **quotitive mode** ("how many groups of 6?",
  which needs bubbles that are created rather than filled) and **divisors above
  ten** (the packing table would need more rows). For the quiz: a **sub-topic
  builder** in the teacher portal so a task can ask for one KIND of question,
  which the `types[]` flags already make meaningful.
- **Halve and Halve Again siblings:** the teaching tool shipped 2026-09-07;
  both rows of its Tools menu are still greyed. A **worksheet creator**
  (`worksheet-creators/stage-3/number/halve-and-halve-again.html`) would print
  the bar already cut into 2, 4 or 8 for the student to fill, then blank bars to
  cut themselves, then the ladder alone. A **student quiz**
  (`online-quizzes/stage-3/number/halve-and-halve-again.html`, registry id
  `halve-and-halve-again-quiz`) would ladder by how much of the bar is left:
  the parts drawn and numbered, then drawn and blank, then no bar at all.
  Possible extensions to the tool itself: **halving an odd number** (the bar
  splits and one part carries the half, which is where a class meets a half of
  a whole), and a **doubling mode** running the same bar the other way.
- **Circumference of a Circle siblings:** the teaching tool shipped 2026-09-08;
  two rows of its Tools menu are still greyed. A **worksheet creator**
  (`worksheet-creators/stage-4/measurement-space/circumference.html`) would run
  measure-and-divide (a table of round objects with C, d and C ÷ d columns, so
  every group's answer lands near 3.14), then C from d, then d from C, then
  radius questions, then contexts. A **student quiz**
  (`online-quizzes/stage-4/measurement-space/circumference.html`, registry id
  `circumference-quiz`) would ladder by what is given and what is asked, ending
  on working backwards from C. Possible extensions to the tool itself: a
  **radius mode** (the same wrap in radii, which lands on 2π and is where
  C = 2πr comes from), an **area** follow-on, and letting the roll-out keep
  going for a **second turn** — the same fact told as distance travelled per
  turn.
- **Revision Generator — Stage 4 is COMPLETE** (2026-09-24, all 16 outcomes; see
  `assessment/exam-builder/docs/stage-4-syllabus-reference.md`).
- **Revision Generator — Stage 3 is COMPLETE** (2026-09-25, all 10 topics incl.
  Data and Chance; visual gap-fill types added to the 6 older banks; see
  `assessment/exam-builder/docs/stage-3-syllabus-reference.md`).
  Scope, outcome mapping and the calibration conventions are in
  `assessment/exam-builder/docs/stage-3-syllabus-reference.md` — read it before
  writing a bank, and add the new conventions it records to any new one.
- Revision Generator — smaller follow-ups: right-align the worksheet answer
  boxes into a consistent column for faster marking (trade-off: short prompts
  wrap awkwardly around them); page numbers need Chrome's own print
  header/footer since CSS cannot generate them; the protractor and thermometer
  diagrams still carry more whitespace than they need.
- Adventure: **interactive plot-a-point input mode** (student taps the
  Cartesian grid — flagged during the Linear Relationships build); **Stage 5
  depth** (still just 2 sample skills); **Area extension** as a further Stage 4
  topic. (The 14 Stage 4 topics — through Angles, Geometry and Data — are all
  LIVE; see the game repo's Phase 3A–3J sections.)
- Consider a **DevPanel diagram/chart gallery** to eyeball every new figure at
  once, and a live-review polish pass on the newest diagrams (protractor,
  geometry shapes, data charts).
- Teacher portal: revisit **graphs** (engagement/leaderboard — removed for now),
  add student **enable/disable/edit**. (Adventure-TASK create/edit/remove +
  completion view, **saved classes**, **dashboard/quiz tasks + sub-topic builder**
  and **farm Adventure tasks** are now DONE — see the 2026-07-22 header block, §4.)
  Follow-ups: subset builders for the other quizzes; a systemChecks farm-task
  check; a class rename/merge view.
- Adventure tasks — future polish: per-skill selection in the Set-task form (only
  topic-level today — now 14 Stage 4 topics), in-game due-date
  display/overdue handling, more stages/NPCs.
- Functions runtime: bump **Node 20 → 22** before Oct 2026 (Google deprecation).
- Consider **App Check**; consider consolidating the 3 Firebase projects later.
- Old pre-reorg URLs (e.g. `/factor-circles/`) now 404 — add redirects if any were
  widely shared.
