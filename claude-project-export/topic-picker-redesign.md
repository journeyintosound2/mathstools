# Topic picker redesign (Sept 2026)

This redesign replaces the busy "Choose topics" grid, which had one card for every A/B part with all stages stacked, with a single picker. The same picker appears in the wizard and in the per-stage modal.

## How it works
- **Stage tabs**: Stage 1–5, each showing its Years and a count of the topics chosen in that stage. The last tab used is remembered.
- **Search**: searches every stage at once. It matches topic names, parts, notes and question-type names, so "clock", "fractions" and "area" all work.
- **Strands**: topics are grouped into Number & Algebra, Measurement & Space, and Statistics & Probability. Each strand has its own colour.
- **Cards**: there is one card per topic. Its A/B/C parts appear as chips on that card.
- **Adding and removing**: one tap adds a topic with every question type and the default number of questions. Tapping again removes it.
- **Fine-tuning**: the gear on a selected chip, or the "question types ›" link in the selection panel, opens the question-type settings.
- **"Your selection" panel**: shows totals, a stage pill for each topic, a −/+ question stepper, a remove button and "Clear all".
- **Mobile**: on narrow screens the layout stacks to a single column.

## Code
- `app.js`: `renderTopicPicker()`, `stageFamilies()`, `strandOf()`, `applyPickerSearch()` and `afterControlsRender()`.
- The picker's click actions are `picker-stage`, `toggle-topic`, `topic-count-step` and `picker-clear-all`.
- `styles/screen.css`: the TOPIC PICKER block at the end of the file.
- `tools/picker.mjs`: a jsdom test covering all 5 stages, the tabs, the stepper and search.
