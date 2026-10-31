/**
 * MMT TOOL REGISTRY (Phase 4A) — the single place that declares which tools /
 * quizzes feed results into the platform. Add or disable entries here to control
 * what the Student + Teacher platforms surface; nothing else should hardcode a
 * single tool. PURE data + helpers (no Firebase / DOM), so the app's system
 * checks can import it directly.
 *
 * Field meanings:
 *   toolId                 stable id used in filters / dedupe
 *   title                  display name
 *   category               grouping ("Adventure", "Quiz", ...)
 *   enabled                show in the platform (false = hidden but kept)
 *   resultCollection       compact records collection (always "achievements")
 *   richCollection         rich per-attempt collection, or null
 *   achievementToolName    the `tool` value this writes into achievements
 *   topics                 topic ids/names this tool covers
 *   stage                  NSW stage label
 *   launchUrl              where to play/open the tool
 *   supportsAdventureAttempts  writes rich adventureAttempts?
 *   supportsSkillBreakdown     per-question/skill detail available?
 *   notes                  free text
 */
export const MMT_TOOLS = Object.freeze([
  {
    toolId: "mills-maths-adventure",
    title: "Mills Maths Adventure",
    category: "Adventure",
    enabled: true,
    resultCollection: "achievements",
    richCollection: "adventureAttempts",
    achievementToolName: "Mills Maths Adventure",
    topics: ["integers", "fdp", "algebra", "area", "pythagoras"],
    stage: "Stage 4",
    // Site-absolute path (Netlify publish="."). Built Adventure lives in a
    // lowercase-hyphenated folder (no space) — copy `dist/` here after building.
    launchUrl: "/game-platforms/mills-maths-adventure/index.html",
    supportsAdventureAttempts: true,
    supportsSkillBreakdown: true,
    notes: "3D low-poly maths world. Compact achievements + rich adventureAttempts (no typed answers).",
  },
  {
    toolId: "algebraic-techniques",
    title: "Algebraic Techniques — Student Quiz",
    category: "Quiz",
    enabled: true,
    resultCollection: "achievements",
    richCollection: null,
    achievementToolName: "Algebraic Techniques — Student Quiz",
    topics: ["algebra"],
    stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/algebra/algebraic-techniques.html",
    supportsAdventureAttempts: false,
    supportsSkillBreakdown: false,
    notes: "Live quiz page still uses the OLD anonymous pattern — apply docs/quiz-migration-guide.md (canonical migrated template lives in the MMA repo portals/). achievementToolName matches the live records.",
  },
  // Migrated student-achievement quizzes (Phase 4A.1, secure code exchange).
  // achievementToolName = the EXACT live `tool` string each page writes.
  {
    toolId: "equations-quiz", title: "Equations — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "equations-student-quiz", topics: ["algebra"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/algebra/equations.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false, notes: "Migrated.",
  },
  {
    toolId: "substitution-quiz", title: "Substitution — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "substitution-in-algebra-student-quiz", topics: ["algebra"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/algebra/substitution.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false, notes: "Migrated.",
  },
  {
    toolId: "double-numberline-quiz", title: "Double Number Line: Equations — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "equations-double-number-line-student-quiz", topics: ["algebra"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/algebra/double-numberline/student-quiz.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false, notes: "Migrated.",
  },
  {
    toolId: "double-numberline-add-subtract-quiz", title: "Double Number Line: +/− Equations — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "addition-subtraction-equations-student-quiz", topics: ["algebra"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/algebra/double-numberline/student-quiz-add-subtract.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false, notes: "Migrated.",
  },
  {
    toolId: "double-numberline-mult-div-quiz", title: "Double Number Line: ×/÷ Equations — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "multiplication-division-equations-student-quiz", topics: ["algebra"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/algebra/double-numberline/student-quiz-mult-div.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false, notes: "Migrated.",
  },
  {
    toolId: "angle-relationships-quiz", title: "Angle Relationships — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "angle-relationships-student-quiz", topics: ["measurement-space"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/measurement-space/angle-relationships.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false, notes: "Migrated.",
  },
  {
    toolId: "reading-a-protractor-quiz", title: "Reading a Protractor — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "reading-a-protractor-student-quiz", topics: ["measurement-space"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/measurement-space/reading-a-protractor.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false, notes: "Migrated.",
  },
  {
    toolId: "area-of-a-triangle-quiz", title: "Area of a Triangle — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "area-of-a-triangle-student-quiz", topics: ["measurement-space"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/measurement-space/area-of-a-triangle.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Sweet/Mild/Medium/Spicy area-of-triangle quiz (⅓ obtuse from Mild up; Medium half-of-odd areas; Spicy find-a-missing-length). Optional student-code login + secure MMTQuiz achievements save; no typed answers; masteryTopic 'area-of-a-triangle'. Pairs with the interactive + worksheet creator.",
  },
  {
    toolId: "integers-quiz", title: "Computation with Integers — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "integers-student-quiz", topics: ["integers"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/number/computation-with-integers.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false, notes: "Migrated.",
  },
  {
    toolId: "fdp-quiz", title: "Fractions, Decimals & Percentages — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "fdp-student-quiz", topics: ["fdp"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/number/fractions-decimals-percentages.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false, notes: "Migrated.",
  },
  {
    toolId: "decimal-zoom-quiz", title: "Decimal Zoom Rounding — Stage 4 Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "Decimal Zoom Rounding Quiz", topics: ["fdp"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/number/decimal-zoom.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Converted from a public-leaderboard quiz to a secure achievements quiz (Phase 4A.1). Retitled Stage 4 when the Stage 3 whole-number companion shipped; achievementToolName kept as 'Decimal Zoom Rounding Quiz' for record continuity.",
  },
  {
    toolId: "whole-number-zoom-quiz", title: "Whole Number Zoom Rounding — Stage 3 Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "Whole Number Zoom Rounding Quiz", topics: ["whole-numbers"], stage: "Stage 3",
    launchUrl: "/online-quizzes/stage-3/number/whole-number-zoom.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Stage 3 whole-number companion to the Decimal Zoom quiz — rounds to the nearest 10/100/1000/10 000/100 000 (no decimals). Same Sweet/Mild/Medium/Spicy structure + secure achievements save; masteryTopic 'rounding-whole-numbers'.",
  },
  {
    toolId: "fraction-thinking-explorer", title: "Fraction Thinking Explorer — Student", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "Fraction Thinking Explorer — Student", topics: ["fdp"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/number/fraction-thinking-explorer.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Open exploration + thinking-challenge shuffler (predict/construct/compare/misconception/recurring/division). Informational feedback, no typed answers; achievement = challenges met/worked. score/total are challenge counts, not marks. NOTE: superseded for classroom use by the guided 'Fraction Thinking Quest' — keep or set enabled:false to hide.",
  },
  {
    toolId: "fractions-number-line-quiz", title: "Fractions Number Line Quiz — Student", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "Fractions Number Line Quiz — Student", topics: ["fdp"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/number/fraction-thinking-quest.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Guided 8-stage progression (understand→equivalence→density→recurring→division→improper→compare→convince) with RANDOMISED values (same learning intention each attempt). EN/Arabic/Farsi bilingual. Minimal student UI: drag the point + an 'equal parts' stepper + contextual chips. Informational feedback, no typed answers; part-b checkable inputs + reasoning tags stored in types[]. score/total = stages completed. localStorage resume + secure achievement save.",
  },
  // Newly-migrated student quizzes (2026-07, secure code exchange + dashboard-linkable).
  // Each page now shows the student-login modal on load and writes an `achievements`
  // record via window.MMTSave; achievementToolName MUST match the `tool` string the page writes.
  {
    toolId: "fraction-to-percentage-quiz", title: "Fraction to Percentage — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "fraction-to-percentage-student-quiz", topics: ["fdp"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/number/fraction-to-percentage.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Sweet/Mild/Medium/Spicy, 15 questions, built on the Fraction to Percentage double number line. Each question opens with an ESTIMATE (drag the marker), which clears on the first reveal; the second reveal names ONE part (100 ÷ d) and the student counts on. No unit fractions in any bank — 1/d would be the answer. Sweet = friendly only; Mild = 7 friendly then 8 terminating (improper in both); Medium = 5 friendly / 5 terminating / 5 recurring; Spicy = Medium's bank with NO model. Secure student-code login + achievements save; masteryTopic 'fraction-to-percentage'; types[] carry level/kind/improper/estimate-accuracy flags. No typed answers stored.",
  },
  {
    toolId: "adding-subtracting-fractions-quiz", title: "Adding and Subtracting Fractions — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "adding-subtracting-fractions-student-quiz", topics: ["fdp"], stage: "Stage 4",   // five levels: sweet/mild/medium/spicy/extrahot (extrahot = coprime denominators <= 10, no model)
    launchUrl: "/online-quizzes/stage-4/number/adding-subtracting-fractions.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Sweet/Mild/Medium/Spicy, 15 questions, built on the Adding and Subtracting Fractions bar + number-line tool. The ladder raises the RENAMING demand while the model stays: Sweet = same denominators, Mild = related (one bar re-splits), Medium = unrelated (both re-split, improper sums, simplifying); Spicy = Medium's bank with NO model and take-aways that pass zero (negative answers). Each model question runs estimate (drag the marker) → bars in their own units; every modelled level (Sweet/Mild/Medium) offers an optional reveal via back/forward arrows ('Show the pieces' / 'Show the renaming', tagged usedRenameReveal), with the pieces animating into and out of place. Answers are entered in a MathLive fraction editor (same library as the Adventure's MathAnswerInput, trimmed to ONE fraction-template button; CDN-loaded, falls back to the plain typed input offline). Answers accept any equivalent form — 10/12, 5/6 or 1 3/20 — matched as exact rationals; one attempt per question, so the score is a true /15. Secure student-code login + achievements save; masteryTopic 'adding-subtracting-fractions'; types[] carry level/op/den/improper/negative/estimate flags. No typed answers stored. Trilingual EN/AR/FA (selected language on top, English beneath; maths and numerals stay Western/LTR); non-English attempts tagged lang:ar / lang:fa in types[].",
  },
  {
    toolId: "fraction-of-amount-quiz", title: "Fraction of an Amount — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "fraction-of-amount-student-quiz", topics: ["fdp"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/number/fraction-of-amount.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Sweet/Mild/Medium/Spicy fraction-of-an-amount quiz (times-table chart tool). Added secure student-code login + achievements save (2026-07). masteryTopic 'fraction-of-amount'; no typed answers stored.",
  },
  {
    toolId: "collecting-like-terms-quiz", title: "Collecting Like Terms — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "collecting-like-terms-student-quiz", topics: ["algebra"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/algebra/collecting-like-terms.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Escape-room style, 15 locks, EN/AR/FA. Added secure student-code login + achievements save (2026-07). score = locks broken; masteryTopic 'collecting-like-terms'.",
  },
  {
    toolId: "number-groups-quiz", title: "Number Groups (Coefficients) — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "number-groups-student-quiz", topics: ["algebra"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/algebra/number-groups.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Seeing a coefficient × factor as equal groups (lead-in to like terms). Added secure student-code login + achievements save (2026-07). masteryTopic 'number-groups'. (Page <title> was a copy-paste of the like-terms quiz — content is the groups quiz.)",
  },
  {
    toolId: "counting-strategies-first-quadrant-quiz", title: "Counting Strategies — First Quadrant Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "counting-strategies-first-quadrant-student-quiz", topics: ["algebra"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/algebra/counting-strategies-first-quadrant.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "First quadrant only: x from 0, every y at least 0. Sweet/Mild/Medium/Spicy, 10 questions (teacher design 2026-10-27). The ladder is APPLICATION, not number size: Sweet = skip-counting language (write the sequence; fill a table while the graph plots it live; write y = [ ] ± [ ]x from 'start at, count by'; read counting back from an equation). Mild = the same ideas in algebra language (table from an equation with live plotting; what the two numbers mean; equations from words, tables and graphs; which-equation-matches MC with swapped/wrong-way/one-step-late distractors). Medium = make the graph yourself (table from the rule, then CLICK the grid to plot every point; plot from a given table; equations from a graph). Spicy = worded problems (33 shared stories from the teaching tool's contexts.js), going further than counting can (x = 25, x = -10, solve for x), graphing lines from their equation incl. a half gradient, and what the numbers in a story equation mean. Square-cell graphs with friendly y scales; every point to read or plot sits on a gridline. Answers are never on screen before marking; the line appears only once a question is settled. Only the FIRST check of each part scores; a question is right when every part is right first time. types[]: count/table/equation/meaning/plot/apply as right/total, level:x, quadrants:first|all. No typed answer is ever in the payload. Trilingual EN/AR/FA (2026-10-28): chosen language on top, English beneath, maths/numerals LTR and Western; non-English attempts tagged lang:ar / lang:fa in types[]. Sweet works in the first quadrant (x from 0) on BOTH pages (the All Quadrants page still shows the four-quadrant plane so the line is seen to carry on), and its live-table questions add a second part: write the equation, then the line is drawn through the dots. masteryTopic 'counting-strategies-linear'. Shared engine: online-quizzes/stage-4/algebra/counting-strategies-quiz/quiz.js. Pairs with the teaching tool + worksheet creator under MA4-LIN-C-01.",
  },
  {
    toolId: "counting-strategies-all-quadrants-quiz", title: "Counting Strategies — All Quadrants Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "counting-strategies-all-quadrants-student-quiz", topics: ["algebra"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/algebra/counting-strategies-all-quadrants.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "All four quadrants: tables run x = -3..3 (count back for negative x), graphs centre the origin; stories stay in the first quadrant. Sweet/Mild/Medium/Spicy, 10 questions (teacher design 2026-10-27). The ladder is APPLICATION, not number size: Sweet = skip-counting language (write the sequence; fill a table while the graph plots it live; write y = [ ] ± [ ]x from 'start at, count by'; read counting back from an equation). Mild = the same ideas in algebra language (table from an equation with live plotting; what the two numbers mean; equations from words, tables and graphs; which-equation-matches MC with swapped/wrong-way/one-step-late distractors). Medium = make the graph yourself (table from the rule, then CLICK the grid to plot every point; plot from a given table; equations from a graph). Spicy = worded problems (33 shared stories from the teaching tool's contexts.js), going further than counting can (x = 25, x = -10, solve for x), graphing lines from their equation incl. a half gradient, and what the numbers in a story equation mean. Square-cell graphs with friendly y scales; every point to read or plot sits on a gridline. Answers are never on screen before marking; the line appears only once a question is settled. Only the FIRST check of each part scores; a question is right when every part is right first time. types[]: count/table/equation/meaning/plot/apply as right/total, level:x, quadrants:first|all. No typed answer is ever in the payload. Trilingual EN/AR/FA (2026-10-28): chosen language on top, English beneath, maths/numerals LTR and Western; non-English attempts tagged lang:ar / lang:fa in types[]. Sweet works in the first quadrant (x from 0) on BOTH pages (the All Quadrants page still shows the four-quadrant plane so the line is seen to carry on), and its live-table questions add a second part: write the equation, then the line is drawn through the dots. masteryTopic 'counting-strategies-linear'. Shared engine: online-quizzes/stage-4/algebra/counting-strategies-quiz/quiz.js. Pairs with the teaching tool + worksheet creator under MA4-LIN-C-01.",
  },
  {
    toolId: "stacked-bar-ratio-quiz", title: "Stacked Bar Model — Ratio — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "stacked-bar-ratio-student-quiz", topics: ["ratios-rates"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/ratios-rates/stacked-bar-ratio.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Sweet/Mild/Medium/Spicy, 10 questions (teacher design 2026-09-21). Sweet = share a total only; Mild adds one share known; Medium mixes all three types (share a total, one share known, difference known); Spicy is all three with NO bar model. Sweet-Medium keep the teaching tool's model and ask for TWO steps: what one part is worth (typed into the glowing boxes, which mirror) and then the answer. A question scores only if BOTH steps are right first time. types[] carries per-type subtotals (type1/type2/type3:s/t), onepart:s/t at the model levels, level and model:on/off. No typed answer is ever in the payload. masteryTopic 'stacked-bar-ratio'. Pairs with the teaching tool and the worksheet creator, all under MA4-RAT-C-01.",
  },
  {
    toolId: "addition-compensation-quiz", title: "Addition by Compensation — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "addition-compensation-student-quiz", topics: ["number"], stage: "Stage 3",
    launchUrl: "/online-quizzes/stage-3/number/addition-compensation.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Sweet/Mild/Medium/Spicy/Extra Spicy, 10 questions (teacher design 2026-09-30, same ladder as Constant Difference). Sweet/Mild/Medium keep the WHOLE teaching tool (drag tiles or a selected group across, box-select, gap to the next ten, -n/+n chips, green on a ten) plus <-10 <-1 1-> 10-> buttons. Sweet two-digit, total under 100; Mild totals 100-199 (ten tens bundle into a FLAT); Medium three-digit with one number 1-35 below a hundred and the other able to give without breaking a ten. Hundreds are drawn as smaller flats stacked 2-3 high and stay put. Spicy = Mild's numbers, Extra Spicy = Medium's, no tiles. Answer never on screen before marking; first attempt only scores. types[]: add:s/t, usedten:n/t (model levels), level, model:on/off. No typed answer in the payload. masteryTopic 'addition-compensation'. Pairs with the teaching tool under MA3-AR-01.",
  },
  {
    toolId: "kids-chess-adventure", title: "Kids Chess Adventure", category: "Game",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "kids-chess-adventure", topics: ["chess"], stage: "All stages",
    launchUrl: "/games/chess-kids.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Kids Chess Adventure (2026-09-30): 14 lessons + 20 animal bots in five worlds, reached from the Chess menu. ONE record per bot WIN (first win, or a better star count): score 1/1, level 'Bot n: Name', levelKey botNN, types[] bot:n, stars:1-3, variant:race|army|kings, oops:n, hints:n, moves:n. Lessons are not written (beating bot n implies every earlier node). category 'Game' keeps it out of the dashboard-task builder. The page reads the student's own records back on sign-in to restore progress on any device. No typed answers.",
  },
  {
    toolId: "constant-difference-quiz", title: "Constant Difference — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "constant-difference-student-quiz", topics: ["number"], stage: "Stage 3",
    launchUrl: "/online-quizzes/stage-3/number/constant-difference.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Sweet/Mild/Medium/Spicy/Extra Spicy, 10 questions (teacher design 2026-09-30). Sweet/Mild/Medium keep the WHOLE teaching tool (drag the gap along the number line, jumps, green on a ten, plus -10/-1/+1/+10 buttons): Sweet two-digit taking away a number ending 7/8/9; Mild starting numbers 101-199; Medium three-digit with the number taken away 1-35 below a hundred (893 - 467 -> slide to 500). Spicy = Mild's numbers, Extra Spicy = Medium's, with no model. Every question regroups the long way. The answer is never on screen before marking. Only the FIRST attempt scores. types[]: subtract:s/t, usedten:n/t at model levels (slid the gap onto a ten before marking), level, model:on/off. No typed answer is ever in the payload. masteryTopic 'constant-difference'. Pairs with the teaching tool under MA3-AR-01.",
  },
  {
    toolId: "multiply-divide-by-ten-quiz", title: "Multiplying and Dividing by 10 — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "multiply-divide-by-ten-student-quiz", topics: ["number"], stage: "Stage 3",
    launchUrl: "/online-quizzes/stage-3/number/multiply-divide-by-ten.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Sweet/Mild/Medium/Spicy. The LEVEL is how much of the teaching tool the student keeps: Sweet gives the place value board AND plays the move, Mild keeps the board but will not move it, Medium and Spicy take the board away. Numbers climb alongside (whole -> 1dp -> 2dp -> 3dp and crossing the point). 12 questions. Four kinds — multiply, divide, what is missing, use it — with subtotals by kind in types[]. The answer is never on screen before it is marked; at Sweet the board may be moved, which is the METHOD, but the number sentence keeps its ?. Only the FIRST attempt scores, though a settled question stays workable. masteryTopic 'multiply-divide-by-ten'. Pairs with the teaching tool and the worksheet creator, all under MA3-RN-01.",
  },
  {
    toolId: "division-grouping-quiz", title: "Division by Grouping — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "division-grouping-student-quiz", topics: ["number"], stage: "Stage 3",
    launchUrl: "/online-quizzes/stage-3/number/division-grouping.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Sweet/Mild/Medium/Spicy. The LEVEL is how much of the teaching tool the student keeps: Sweet is the whole thing (bubbles, running total, partial-quotient table, quick numbers); Mild drops the table; Medium drops the running total and the quick numbers too, so the student tracks what they have shared; Spicy has no bubbles at all. 12 questions, 10 at Spicy. Five kinds — share it out, how many left, with a remainder, missing factor, use it — with subtotals by kind in types[]. The tool NEVER prints the answer: the number sentence keeps its ? until the question is marked. Only the FIRST attempt scores. masteryTopic 'division-grouping'. Pairs with the interactive + worksheet creator, both cross-listed under MA3-MR-01 and MA3-MR-02.",
  },
  {
    toolId: "perimeter-plane-shapes-quiz", title: "Perimeter of Plane Shapes — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "perimeter-plane-shapes-student-quiz", topics: ["measurement-space"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/measurement-space/perimeter-plane-shapes.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Sweet/Mild/Medium/Spicy. The LEVEL is how much of the teaching tool the student keeps: Sweet has the whole thing (click a ? to send the side across, trace builds the number sentence but never the total); Mild drops the sentence; Medium and Spicy drop the clicking too and the trace is a plain blue line. Medium is 30% missing-side questions, Spicy 50%. 15 questions, 10 at Spicy. Only the FIRST attempt scores; subtotals by kind in types[]. masteryTopic 'perimeter-plane-shapes'. Pairs with the interactive + worksheet creator.",
  },
  {
    toolId: "perimeter-area-rectangle-quiz", title: "Area Model — Area & Perimeter — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "perimeter-area-rectangle-student-quiz", topics: ["measurement-space"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/measurement-space/perimeter-area-rectangle.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "REBUILT 2026-10-31 on the shared engine online-quizzes/stage-4/measurement-space/area-model-quiz/quiz.js (window.AMQ.focus='both'). Each question is ONE question with ONE answer box; the live area model beside it is an optional helper (students may split it and jot each piece's product in it — never required, never marked). A wrong answer on a whole rectangle splits the model by place value to show the working. Only the FIRST check scores (Check again lets them fix it), empty check is free, Next on an unanswered question = wrong. No typed answers or jottings in the payload. The model has an Area / Perimeter switch. Questions: find the area; find the perimeter (split by tens and ones, whole, or make a ten); area AND perimeter (two boxes, counts to both skills); cut-out shapes (area / perimeter / same-longer-shorter); missing numbers; spot the mistake; which-is-NOT-equal. types[]: area/backwards/composite/perimeter/reasoning as right/total + level:x. Score out of 10 (the old quiz was out of 30). toolId/achievementToolName/masteryTopic unchanged so old records still group.",
  },
  {
    toolId: "area-model-quiz", title: "Area Model — Multiplication — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "area-model-student-quiz", topics: ["measurement-space"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/measurement-space/area-model.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "REBUILT 2026-10-31 on the shared engine online-quizzes/stage-4/measurement-space/area-model-quiz/quiz.js (window.AMQ.focus='area'). Each question is ONE question with ONE answer box; the live area model beside it is an optional helper (students may split it and jot each piece's product in it — never required, never marked). A wrong answer on a whole rectangle splits the model by place value to show the working. Only the FIRST check scores (Check again lets them fix it), empty check is free, Next on an unanswered question = wrong. No typed answers or jottings in the payload. Sweet = the model starts split by place value (teen x 1-digit up to 2-digit x 2-digit); Mild = the model starts whole, plus 'what did they leave out?'; Medium = 3-digit and missing numbers from the products; Spicy = 3-digit x 2-digit, cut-out shapes, which-is-NOT-equal. types[]: area/backwards/composite/reasoning as right/total + level:x. masteryTopic 'area-model' unchanged.",
  },
  {
    toolId: "factor-circles-quiz", title: "Products & Factors: Escape the Factor Circle Room — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "factor-circles-student-quiz", topics: ["number"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/number/factor-circles.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Escape-room, 10 locks (factors/products). Added secure student-code login + achievements save on escape (2026-07). score = locks solved out of 10; masteryTopic 'factors-and-products'.",
  },
  {
    toolId: "integer-addition-quiz", title: "Integer Addition & Subtraction — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "integer-addition-student-quiz", topics: ["integers"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/number/integer-addition.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Add/subtract integers, Sweet→Spicy, 15 questions. Added secure student-code login + achievements save (2026-07). masteryTopic 'integer-addition'.",
  },
  {
    toolId: "integer-combined-signs-quiz", title: "Integers: Combined Signs — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "integer-combined-signs-student-quiz", topics: ["integers"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/number/integer-combined-signs.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Combined-signs integer quiz with worked solutions. Added secure student-code login + achievements save (2026-07). masteryTopic 'integer-combined-signs'.",
  },
  {
    toolId: "negatives-on-the-number-line-quiz", title: "Negatives on the Number Line — Student Quiz", category: "Quiz",
    enabled: true, resultCollection: "achievements", richCollection: null,
    achievementToolName: "negatives-on-the-number-line-student-quiz", topics: ["integers"], stage: "Stage 4",
    launchUrl: "/online-quizzes/stage-4/number/negatives-on-the-number-line.html",
    supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Missing-value on a number line incl. negatives, 20 questions. Added secure student-code login + achievements save on completion (2026-07). masteryTopic 'negatives-on-the-number-line'.",
  },
  // Disabled placeholder — no standalone Pythagoras quiz yet (Adventure covers it).
  // Demonstrates the enable/disable switch; flip enabled + set launchUrl when built.
  {
    toolId: "pythagoras-quiz", title: "Pythagoras — Student Quiz", category: "Quiz",
    enabled: false, resultCollection: "achievements", richCollection: null,
    achievementToolName: "Pythagoras — Student Quiz", topics: ["pythagoras"], stage: "Stage 4",
    launchUrl: "", supportsAdventureAttempts: false, supportsSkillBreakdown: false,
    notes: "Placeholder — no standalone quiz yet.",
  },
]);

/**
 * ⚠ NAME-MISMATCH NOTE (Phase 4A.1 audit of the live website repo).
 * Existing achievements records use INCONSISTENT `tool` values, e.g.
 * "Mills Maths Adventure" (✓ matches), "Algebraic Techniques — Student Quiz" (✓),
 * but also slugs like "fdp-student-quiz", "equations-student-quiz",
 * "angle-relationships-student-quiz", "Decimal Zoom Rounding Quiz".
 * Until each quiz is migrated + standardised, set each placeholder's
 * `achievementToolName` to the EXACT live string so records group correctly
 * (unmatched records still appear, grouped as "other"). Recommended: standardise
 * tool names to the registry title as you migrate each quiz.
 */

/** All tools (incl. disabled) — for admin/registry views. */
export function getAllTools() { return MMT_TOOLS.slice(); }

/** Only enabled tools — what the platforms surface by default. */
export function getEnabledTools() { return MMT_TOOLS.filter((t) => t.enabled); }

/** Look up a tool by id. */
export function getTool(toolId) { return MMT_TOOLS.find((t) => t.toolId === toolId) || null; }

/** Is a tool enabled? */
export function isToolEnabled(toolId) { const t = getTool(toolId); return Boolean(t && t.enabled); }

/**
 * Match a compact achievement record to a registry tool. Records carry a `tool`
 * string (achievementToolName); fall back to a loose title match. Returns the
 * toolId or "other" so the platform can always group a result.
 */
export function toolIdForAchievement(record = {}) {
  const name = String(record.tool || record.toolName || "").trim();
  if (!name) return "other";
  const hit = MMT_TOOLS.find((t) => t.achievementToolName === name) ||
    MMT_TOOLS.find((t) => name.toLowerCase().includes(t.title.toLowerCase().split(" —")[0].toLowerCase()));
  return hit ? hit.toolId : "other";
}

/** Distinct topic ids across enabled tools (for filter dropdowns). */
export function enabledTopics() {
  const set = new Set();
  for (const t of getEnabledTools()) for (const tp of (t.topics || [])) set.add(tp);
  return [...set];
}
