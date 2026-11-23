# Constant Difference — Stage 3

Two files, both under **MA3-AR-01** (toolLinks rows + homepage cards):

- Teaching tool `interactive-tools/stage-3/number/constant-difference/index.html` (built 2026-09-30)
- Student quiz `online-quizzes/stage-3/number/constant-difference.html` (built 2026-09-30)

**The tool's Tools menu is ONE row: Student Quiz** (teacher decision 2026-09-30). The quiz's Tools menu links back to the teaching tool.

## The picture (both files)
One number line, mirrored about it:

statement (moves) · orange band (drag) · LINE · blue band (fixed) · statement (fixed)

- Below: the question `83 − 28 = ?` and a blue band 28→83, knobs carrying each number, dashed drops to the line.
- Above: an orange band the same length, starting exactly over the blue. Drag anywhere; snaps to whole numbers; clamps to the visible line; its statement rides above it (`85 − 30 = ?`).
- Purple hops at BOTH ends (+2/+2). The number taken away goes green when RELEASED on a ten (never mid-drag).
- The difference is `?` everywhere until shown/marked.
- No explanation text on the board — the teacher talks.

## Teaching tool
Settings: take away a number ending in 9 / 8 or 9 (default) / 7, 8 or 9; type your own (up to 300); Number line: Tens labelled / Open line; jumps toggle; green-on-a-ten toggle. Controls: Back to the start, Show the difference, New numbers. Keys ←/→ (Shift = 10), Home/0, S, N. Test surface `window.__CD__`.

## Student quiz
Registry `constant-difference-quiz`, writes `tool: "constant-difference-student-quiz"`, masteryTopic `constant-difference`. 10 questions.

| Level | Model | Numbers |
|---|---|---|
| Sweet | whole tool | 2-digit, take away …7/8/9 |
| Mild | whole tool | starting numbers 101–199 (take away 27–89, 97–99, or 117–169, all ending 7/8/9) |
| Medium | whole tool | 3-digit, take away 1–35 below a hundred (893 − 467 → slide to 500) |
| Spicy | none | Mild's numbers |
| Extra Spicy | none | Medium's numbers |

- Model levels add −10 / −1 / +1 / +10 slide buttons and Back to the start (fingers, and landing exactly at 3-digit scale). Tick/label spacing adapts (labels every 10/20/50/100).
- Every question regroups the long way; sliding up to the friendly number never changes the first number's leading digits.
- Answer never on screen before marking; first attempt only scores; a settled question stays workable; Next on an unanswered one settles it wrong; confetti only on a scoring answer.
- types[]: `subtract:s/t`, `usedten:n/t` (model levels — slid the gap onto a ten before marking), `level:`, `model:on|off`. No typed answer in the payload.
- Shared sign-in (`quizAuthUI.js`, `#mmtAuthSlot`, `MMTSave`), early submit `import()`ed + `register()`ed with the button in `#mmtSubmitSlot` in the nav row. Test surface `window.__CDQ__`.

## Verified — Playwright
Tool 45k checks. Quiz 52.7k over HTTP with the real shared files: 9000 generated questions against the rules, 250 papers, every level played through (answer never on screen early), first-attempt scoring, full payload, early-submit button, 1366×768 / 1280×720 / 1024×768 / 1920×1080 / 820×1180 / 390×844.

## Not built
Worksheet creator.
