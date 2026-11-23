# Number Groups — Collecting Like Terms (rebuilt 2026-11-16)

`/interactive-tools/stage-4/algebra/number-groups/` (same URL as the old "Number Pattern" tool). Under MA4-ALG-C-01 idea `laws-properties`. Self-contained, no Firebase. Test surface `window.__NG__`, settings in `mmt.numberGroups.v1`.

## The idea
Like terms are taught as equal groups, not "3 apples + 2 apples". A term is a number of groups of the same thing, and collecting means counting the groups first: a × k + b × k = (a + b) × k.

- Each term is drawn as bars, one bar per group. Every bar is the same size because every group is the same.
- The bars stack into one pile. Braces count 3, 2 and 5, and the only label beside the pile is "10 groups of 7". The "3 + 2 + 5" line was removed as cognitive overload.
- Switching Numbers → Letters keeps the counts and only relabels the bars. 3 × 7 + 2 × 7 + 5 × 7 = 10 × 7 becomes 3x + 2x + 5x = 10x with the same picture.
- An unlike term (2 × 5, or 2y) is drawn a different length. It can't join the pile.
- Taking away (3x + 8x − 2x): the red bars land on top of the pile and both fade away.

## Steps
1. Read it — the expression alone, big.
2. Spot the group — the group turns green and the counts turn blue.
3. Draw the groups — the sentence rises; bars appear under captions that repeat each term.
4. Put the groups together — bars stack; braces and "10 groups of x" appear.
5. Take some away — only when a term is subtracted.
6. Write it shorter — the answer joins the **question line**: x + 3x + 6x = 10x. Copies of the brace counts (1, 3, 6) fly up and merge into the 10. A subtracted count flies too, in red. There is no "(1 + 3 + 6)x" line (Jeff's feedback).
7. The last step depends on the group:
   - Numbers: **Work it out** (= 70) on the same line, with the long way in the story panel.
   - Letters: **Simplest form** (10x, and why we stop). With the setting on, **Try a number** gives x a value and both ways agree.

The value never appears before the last step. The whole line is laid out from the start, with the unreached part hidden, so it never shifts sideways.

## Lettering
Letters use Word-style maths italics: the real glyphs from the Unicode maths alphabet (𝑥), as the Complete the Square tool does. If a font lacks them, the tool falls back to a serif with a true italic. Maths text is set at weight 500. The quiz and worksheet do the same, and leave out the letter v (it reads as w or u).

## Notation
The switch above the board offers groups of / × / brackets (keys 1–3). The sentence glides between notations. Brackets are written 3(7) for numbers and 3x for letters (a single x drops the 1).

## Controls
- **Side panel:** Groups (total) and Terms, each with a Random toggle; New question (Enter); Same counts, new group (G); Type your own (e.g. `3 × 7 + 2 × 7`, `3(7) + 2(7)`, `4a + a − 2a`).
- **Settings:** size of a group (2–9 / 3–12 / big 13–99), two-letter groups, allow a single group, taking away, unlike term, show units inside each group, compare with the long way, try a number for the letter.
- **Keys:** →/← step, Space start again, Enter new question, G, L, 1–3, F.

## Student quiz (rebuilt 2026-11-16)
`/online-quizzes/stage-4/algebra/number-groups.html` (thin shell) + `number-groups-quiz/quiz.js` + `quiz.css`. Same toolId, `number-groups-student-quiz`, masteryTopic `number-groups`. 10 questions (was 15).

**The card.** One question and one answer. The answer box sits inside the line of maths (3 × 7 + 2 × 7 = [ ] × 7, x + 3x + 6x = [ ]x).

**The model (Sweet and Mild).** The panel draws the question's own terms as bars. Show me stacks them into one pile, and takes groups away where a term is subtracted.
- The pile's count shows **"?" until the question is settled**.
- Missing-term questions show the total, the empty slots, or the red "? taken away" rows.
- A wrong first answer jumps the model to its last step.

Medium and Spicy have no model; the card fills the width.

**The ladder:**

| Level | What it adds |
|---|---|
| Sweet | Numbers, then the same picture with letters: count, value, collect, which is the same |
| Mild | A single x, take away, missing terms, spot "3x + 2x = 5x²" |
| Medium | Unlike terms, two-letter groups, big numbers, which are like terms, give the letter a value |
| Spicy | Two kinds of term each twice, results that cancel or go negative, "5x − x = 5", write 12x as three different like terms |

**Marking.**
- Whole expressions are typed in any order.
- An answer that is equal but not collected, contains a 0 term, or is written "1x" gets a free nudge, not a mark.
- Only the first check scores.
- Skills are saved in the object shape `{typeId, label, correct, total}`.

## Worksheet creator (rebuilt 2026-11-16)
`/worksheet-creators/stage-4/algebra/number-groups.html`. The picture fades across the sections:

| Section | What it asks |
|---|---|
| A Count the groups | Bars printed under each term (numbers) |
| B Same picture, letters | The same bars, labelled with a letter |
| C Draw the groups | An empty box; students draw the bars |
| D Collect | No picture |
| E Take away | One term subtracted |
| F Missing terms | One count left blank |
| G Unlike terms | Groups of different things stay apart |
| H Count first, then work it out | Big numbers; give the letter a value |
| I Spot the mistake | A classic error to explain and correct |
| J Make your own | Expressions that simplify to a given answer |
| K Fluency | Bare questions (off by default) |

**Options:**
- Level ladder.
- Number notation: × / brackets / words.
- "Count the groups first" line in sections D–G.
- Units inside numeric bars.
- Two-letter groups from Medium.
- Spacing and colour or black and white.
- Worked example: two piles, for numbers and for x.
- Answer key with a one-line reason for each answer.

## Possible next
- An x² vs x unlike option (different-shaped groups), in the tool and then the quiz and worksheet.
- Assignable sub-topic builder for the quiz (the `types[]` skill ids already make it meaningful).
