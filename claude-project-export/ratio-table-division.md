# Division with a Ratio Table — Stage 3

Two files, one idea. **Both are in the repo and registered** (2026-09-06).

- `interactive-tools/stage-3/number/ratio-table-division/index.html`
- `worksheet-creators/stage-3/number/ratio-table-division.html`

Cross-listed MA3-MR-01, MA3-MR-02, MA4-RAT-C-01 — a Teacher tool row and a
Worksheet maker row under each: six rows, two URLs, nothing duplicated on disk.
Homepage carries both cards; Interactive Tools pill 28 → 29, Worksheet Creator
pill 26 → 27. Self-contained inline CSS/JS, same shell and tokens as the Stage
3/4 tools.

## The idea both files keep

Division read as a **missing factor**. Two columns — **Groups** and **Total** —
with a `×divisor` spine between them. Every table opens on `1 | 15` and closes on
a goal row `? | 270`. **The unknown is in the LEFT column.** That is the whole
conceptual move: "how many groups of 15 make 270", not "270 shared out". The
sibling Division by Grouping paper is the mirror image (all partitive sharing);
do not mix the two readings here.

---

# The teaching tool

**A ROW IS ENTERED AS A PAIR, THE WAY A COORDINATE IS** (teacher decision
2026-09-06). An empty line waits at the foot of the table. Click it and an input
opens in the Groups cell; Enter locks the groups and moves to the Total cell,
with the chip between them reading `10 × 8`. A correct pair locks in with a small
confetti burst; a wrong one shakes the line and takes the WHOLE PAIR away — half
a row is not a row. The line reopens so the class can go again. Escape drops a
half-finished pair. There is no entry bar outside the table; do not put one back.

**ONLY THE GROUPS COLUMN TAKES A CLICK.** The Groups cell is a real `<button>`;
the Total cell is inert. The Total is a *result*, and a click there would say the
two columns are the same kind of thing. This also carries keyboard access.

**ANY NUMBER OF GROUPS, AND EVERY ROW CAN GO** (teacher decision 2026-09-06). No
cap on how far past the target a row sits: 100 groups when dividing by 3 lands,
marked "past 54", and the graph rescales to hold it. Every row but the anchor
carries a `×`; taking one out rescales the graph back, un-finishes the question
if it was the landing row, and takes the answer off screen with it.

**THE ANCHOR ROW IS STICKY AND CANNOT BE DELETED.** `1 | 15` is the unit rate,
pinned at the top of the scroll box (`scroll-padding-top` is a row height so the
next row cannot park under it). No `×`; "start again" returns to it.

**THE MOVE IS FLASHED ON BOTH COLUMNS.** A derived row pops a `×2` badge beside
the left number AND the right. That is the entire claim a ratio table makes.

**FOUR WAYS TO MAKE A ROW.** Pair entry, plus one row's Groups cell for ×2 ×3 ×5
×10 and the ÷ moves that stay whole (only when BOTH columns divide and the result
is not already there — Stage 3 has no decimals here); two rows for add, or take
one from the other (larger minus smaller, so the left column never goes negative).

**ONE PAINT, NOT TWO, WHEN A PAIR LANDS.** `makeRow()` sets `S.flash` before
painting, and the next entry line opens before `tryAdd` runs, so one repaint shows
the row, the message and the waiting line. Painting twice flickered the message
away.

**THE ANSWER IS NEVER ON SCREEN UNTIL A ROW LANDS.** Three
`[data-role="answer"]` nodes read `?` until then; undo and delete take it back
off. Graph scales come from the rows built and the target only.

**SETTINGS IS DOWN TO WHAT CHANGES THE PICTURE** (teacher decision 2026-09-06):
Numbers, **Graph the rows**, **Between which rows?**. Both toggles off by default.
"Predict the total first", "check sentence", "read the question first" and "let
them add their own row" are GONE — predict was redundant once every typed row
asks for its total, the rest were switches on things that should always be true.
Do not add them back.

**Tools ▾ is exactly two rows**: a live Worksheet Creator link and a greyed
Student Quiz. The harness asserts that shape.

Also: the graph's line through the origin appears only once there are two points;
confetti and the shake both respect `prefers-reduced-motion`; `fitTable()`
measures the fold and floors to whole rows; the veil FLIPs the same element onto
the card, and "type your own" is typed on the veil.

**Verified — Playwright, 192 checks** (`check.mjs`, `shots.mjs`, session scratch).

---

# The worksheet creator

Follows `division-grouping.html` exactly: no topbar, `.wrap > .card`, three
control bands, `#out` below, the `.measure` probe, the `.mmtFooter`, and the whole
A4 machinery (`A4_CONTENT_PX` from a real 281mm probe,
`measureRows`/`layout`/`paginate`, `pageHTML`). Test surface `window.__RTW__`.

**The four sections are the teaching order.** A — Finish the table (handed the
unit rate and one friendly multiple). B — Build your own (the unit rate and
nothing else; the rows they choose are the strategy). C — Plot it (table beside
an empty first-quadrant grid, printed wide). D — Use it (word problems, all
**quotitive**, because that is the question the left column answers).

Options, all off: Grid beside every table, Check sentence, Which rows helped?,
Answer key pages.

**THE GIVEN ROW IS NEVER MOST OF THE WAY THERE** — a check asserts no given row is
at or past the quotient, or the only move left is one addition.

**A GRID IS THE SAME PHYSICAL SIZE ON EVERY QUESTION** —
`width:min(100%, var(--gw))`, 52mm normally and 88mm on a wide plot card, with the
SVG's text sizes stepped down there so labels land the same size on paper.

**THE AXIS NEVER ENDS ON THE ANSWER** — `axisFor(quotient × 1.35, 6)` and
`axisFor(dividend × 1.18, 6)`; the goal is drawn as a dashed line labelled with
the total.

**THE KEY IS A TABLE, BECAUSE THE METHOD IS A TABLE.** `routeOf()` splits by place
value above ten and takes a five out below ten (5 + 3 is a pair of known products;
8 alone is just the answer). No row printed twice: 11 groups is 10 + 1, and the 1
is the row it started on.

**NO QUESTION TWICE ON ONE PAPER** — the de-dup id carries no section.

**A LEVEL WITH NO GROUP SIZE OF ITS OWN FALLS BACK.** Default ticks are everything
but 50, so Medium and Spicy have 12, 15, 20, 25 to draw from.

**THE PROMPT BOX IS WHAT HAS TO FIT, NOT ITS RULED LINES** — the trim loop measures
the `.prompt`, not the `.promptRules` inside it; measuring the rules left 15px
hanging past the print budget.

**Verified — Playwright, 88 checks** (`wscheck.mjs`, `wsshots.mjs`).

---

## Installed and verified on disk

Files written over the bridge and hash-matched against the tested copies
(`da0bb5ed…` and `20e4ff05…`). `toolLinks.js` re-parsed as valid JS with all six
rows present; the homepage card and both pills confirmed. Backups of the edited
files are in `Claude outputs/ratio-table-backups/` (gitignored).

**Still to do:** the bubbles tool's Tools menu is now three rows (it links back),
so its own harness assertion of "exactly two rows" needs updating.

**Bridge gotcha, confirmed repeatedly:** the desktop bridge drops for minutes at a
time — retry rather than falling back to an installer script. And every `git`
command run through it leaves a `.git/index.lock` it cannot unlink, so run git in
Terminal. No locks were left this time.

## Not built yet

Student quiz (greyed in the Tools menu), no portal registry entry.
