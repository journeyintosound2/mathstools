# Set an Online Task — quiz picker (2026-10-27)

Teacher Platform (`portal/teacher/index.html`). Replaces the old "Set Dashboard Task" modal, which had two long lists ("Quizzes linked to tools" and "Broad topic overview").

## What the teacher sees
- **Class** and **Due date** at the top. The due date has quick buttons: This Friday, In a week, In 2 weeks. The last class used is remembered, and if there is only one class it is chosen automatically.
- **Stage tabs:** Stage 3 · Stage 4 · Stage 5. Each tab shows its years and how many quizzes it has, plus a blue dot counting the quizzes chosen from it. Stage 5 shows an empty state until it has quizzes.
- **Strand headings**, then **collapsible topic cards** in syllabus order. Each card shows its quiz count and an "n chosen" badge. There is an Expand all / Collapse all link.
- **Whole-topic quizzes** (the ones with a question-type builder) appear as an overview card at the top of their own topic, with **Add whole quiz** and **Choose question types ›**. There are five: Integers, FDP, Algebraic Techniques, Equations and Angle Relationships.
- **Focused quizzes** are rows under the overview card. Each row shows a one-line description and has a preview ↗ link that opens the quiz in a new tab.
- **Search** covers every stage.
- **Your task panel** stays in view on the right. It lists what is chosen, each item with its stage and topic. Custom versions say what was chosen ("Expected · 2 of 11 types · 20 questions") and have a ✎ Edit button. The button reads "Set 3 tasks".

## Choosing question types (whole-topic quizzes)
"Choose question types ›" opens a builder **inside the same window**, in place of the quiz list (the Your task panel stays visible). There is no pop-up window and no "Generate link" step.
- **Level:** Basic / Expected, each showing how many question types it has. Switching level ticks all of that level's types again.
- **Questions:** − / + stepper and 10 / 15 / 20 / 25 / 30 presets, kept within the quiz's own limits (Integers starts at 10).
- **Question types:** two-column tick grid with Select all / Clear. A count shows "4 of 11".
- **Diagram options** (Angle Relationships only) as switches.
- **Task name students see:** filled in automatically ("Equations — Expected", "Equations: Solve x² = c", "Equations: 4 question types (Expected)"). It can be changed, and "Use the automatic name" puts the automatic one back.
- **Add to task**, or **Save changes** when editing. Esc or Cancel goes back to the list. Adding an identical version twice is refused.

### How it makes the link
Each quiz page is loaded invisibly in the background (preloaded as soon as its topic is opened). The builder copies the teacher's choices into the quiz's own builder and presses its own Generate button, so the links are exactly what each quiz has always made. It checks that the link matches the choices before adding it. A new whole-topic quiz works automatically if its builder uses the same element ids as the other five (`levelToggleBtn`, `builderTypes`, `builderCount`, `generateAssignmentBtn`, `assignmentLinkOut`) and it is added to `BUILDER_QUIZZES`.

If a quiz page can't load, the builder offers **Try again** or the quiz's own builder in a new window, and the "paste a link" box still works. A pasted link can be edited with ✎ like any other.

## How quizzes are sorted (no list to maintain)
Each quiz's stage and topic come from the outcomes its URL is filed under in `resources/toolLinks.js`, matched to the topics in `resources/resourcesManifest.js`. A new quiz files itself once it is in the registry and toolLinks.js. A quiz filed under outcomes in two stages appears in both. If those files can't load, the picker falls back to the registry's stage and rough topic names.

## Not changed
Cloud Functions, Firestore rules, the registry, the student portal, the five quiz pages, and the stored task shape (`toolId`, `title`, `launchUrl`, `className`, `dueAt`).
