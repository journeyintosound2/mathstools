# Resources by Stage — organised by idea (2026-10-31)

`resources/index.html` now works like this: Stage tab, then strand, then topic, then outcome, then **NESA content statements** ("ideas"). Each content statement is a collapsible row. It shows a chip for each resource type plus a count, and opens to the resources filed under that idea. Statements with nothing filed show greyed as "Nothing yet", so gaps are visible at a glance.

## Data
- **`resources/contentStatements.js`** (`window.MMT_CONTENT.statements`) holds 241 statements: Stage 3 has 71, Stage 4 has 60 and Stage 5 has 110.
  - The wording is verbatim from NESA's *Record of learning and achievement using syllabus content* documents (Stages 3–5, Feb 2024, nsw.gov.au home-schooling templates). Four long statements were completed from the same source.
  - Stage 3 statements carry `part` (A/B) and NESA's sub-heading (`group`). Each Stage 3 statement is filed under the outcome it serves.
- **Each resource has `ideas: [ids]`**, set on its row in `toolLinks.js` or `resourcesManifest.js`. A resource with no ideas goes under "Across the whole outcome". The only one there is the Financial Expectation Spinner under MA5-FIN-C-01.
- There are 205 resource listings, all filed. The ×10 tool, quiz and worksheet were newly cross-listed under MA3-MR-01 ("Multiply and divide decimals by powers of 10").
- The page loads the data files with `?v=<md5 8>`. `precache-manifest.js` was rebuilt.

## Page behaviour
- **Deep links:** `#MA4-INT-C-01/four-operations` opens that idea and highlights it. Every open idea has a "Copy link to this idea" button. `#stage-4` and `#MA3-AR-01` still work.
- **Search** covers statement wording as well as resources:
  - An outcome-level hit shows all of that outcome's statements.
  - Otherwise only the matching ideas show, and they open.
- The Show pills, Core/Path and Has resources still work. Topics and ideas that are open stay open when the page re-renders.
- Expand all and Collapse all open and close ideas too.

## Verified
Playwright checks:
- Every resource is reachable on all 3 stages.
- Each outcome has exactly one row per statement.
- Clicking an idea opens it, and the Show filter, search and Has resources behave as described above.
- Deep links work for an outcome, an idea and a stage, including via hashchange.
- Copy link works.
- There is no sideways scroll at 390 px wide, and there are no console errors.

## Possible next
- Fill the many "Nothing yet" statements: Stage 5 is mostly empty, and so are Stage 4 Volume and Data.
- Maybe file resources from a resource's own page, so `ideas` is set when a tool is built.
