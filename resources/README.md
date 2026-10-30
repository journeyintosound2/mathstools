# Resources by Stage

Live page: **https://www.millsmathstools.au/resources/**

Teaching and revision resources organised by NSW Mathematics K–10 Syllabus (2022)
outcome. Stage 3 (Years 5–6), Stage 4 (Years 7–8) and Stage 5 (Years 9–10),
grouped by strand, collapsible by topic. **Inside each outcome the page is organised by
idea: every NESA content statement is a row, and clicking it opens the resources that
teach that idea.**

**78 outcomes across 44 collated topics.** Focus areas that NESA splits into
A / B / C / D are merged into a single topic (Trigonometry A–D → "Trigonometry").

---

## How to add a resource (3 steps)

**1. Drop the file in the right folder.**

```
resources/stage-5/trigonometry/bearings-intro.pptx
resources/stage-4/equations/two-step-equations-worksheet.pdf
```

Folder names are lowercase-hyphenated and match the `slug` of each topic in
`resourcesManifest.js`. They already exist — see the tree below.

**2. Add one line to `resourcesManifest.js`.**

Find the topic (search for its `slug`), find the right outcome inside
`outcomes`, and push an object into that outcome's `resources` array:

```js
{
  code: "MA5-TRG-C-02",
  path: "Core",
  focusArea: "Trigonometry B",
  statement: "applies trigonometry to solve problems, including bearings …",
  resources: [
    { title:"Bearings — intro deck", type:"pptx", file:"bearings-intro.pptx",
      note:"Worked examples + 6 practice questions", year:"Year 9",
      tags:["bearings","worked examples"],
      ideas:["bearings"] }
  ]
}
```

**3. Push.**

```bash
git add -A && git commit -m "resources: add bearings deck" && git push
```

Netlify redeploys in ~1 minute. Nothing else needs editing — the page counts,
badges and search index all rebuild from the manifest.

---

## Resource fields

| Field    | Required | Notes |
|----------|----------|-------|
| `title`  | yes      | Shown on the card |
| `type`   | yes      | `pdf` · `pptx` · `docx` · `xlsx` · `link` · `video` |
| `file`   | yes*     | Filename only — resolved against the topic folder. *Not needed for `type:"link"` |
| `url`    | link only| Full URL for `type:"link"` |
| `note`   | no       | One short line under the title |
| `year`   | no       | e.g. `"Year 9"` — renders as a small chip |
| `tags`   | no       | Array of strings — searchable (shown in the hover tooltip) |
| `ideas`  | no       | Array of content-statement ids from `contentStatements.js` for this outcome, e.g. `["bearings"]`. Puts the resource under those ideas. Leave it out and the resource shows under **Across the whole outcome** |

---

## Structure

```
resources/
  index.html               the landing page (reads both data files below)
  resourcesManifest.js     ← THE FILE YOU EDIT (outcomes + your uploaded files)
  toolLinks.js             wiring for tools/quizzes already on the site
  contentStatements.js     NESA's content statements per outcome — the "ideas"
  README.md                this file
  stage-3/<topic>/         drop Stage 3 files here
  stage-4/<topic>/         drop Stage 4 files here
  stage-5/<topic>/         drop Stage 5 files here
```

### Stage 3 topics (10 topics · 21 outcomes — Part A/B collated)

NESA splits each Stage 3 focus area into **Part A** and **Part B** — a Year 5 /
Year 6 emphasis of the *same* outcomes. So A/B are collated into one topic, and
Stage 3 outcomes carry **no Core/Path badge** (K–6 has no such distinction; the
Core/Path filter pills hide themselves on this tab).

| Strand | Folder | Outcomes |
|---|---|---|
| Number & Algebra | `represents-numbers` | MA3-RN-01, -02, -03 |
| | `additive-relations` | MA3-AR-01 |
| | `multiplicative-relations` | MA3-MR-01, -02 |
| | `representing-quantity-fractions` | MA3-RQF-01, -02 |
| Measurement & Space | `geometric-measure` | MA3-GM-01 (position), -02 (length), -03 (angles) |
| | `two-dimensional-spatial-structure` | MA3-2DS-01, -02, -03 |
| | `three-dimensional-spatial-structure` | MA3-3DS-01, -02 |
| | `non-spatial-measure` | MA3-NSM-01 (mass), -02 (time) |
| Statistics & Probability | `data` | MA3-DATA-01, -02 |
| | `chance` | MA3-CHAN-01 |

### Stage 4 topics (15 topics · 16 outcomes)

| Strand | Folder | Outcomes |
|---|---|---|
| Number & Algebra | `computation-with-integers` | MA4-INT-C-01 |
| | `fractions-decimals-percentages` | MA4-FRC-C-01 |
| | `ratios-and-rates` | MA4-RAT-C-01 |
| | `algebraic-techniques` | MA4-ALG-C-01 |
| | `indices` | MA4-IND-C-01 |
| | `equations` | MA4-EQU-C-01 |
| | `linear-relationships` | MA4-LIN-C-01 |
| Measurement & Space | `length` | MA4-LEN-C-01 |
| | `right-angled-triangles-pythagoras` | MA4-PYT-C-01 |
| | `area` | MA4-ARE-C-01 |
| | `volume` | MA4-VOL-C-01 |
| | `angle-relationships` | MA4-ANG-C-01 |
| | `properties-of-geometrical-figures` | MA4-GEO-C-01 |
| Statistics & Probability | `data-classification-visualisation-analysis` | MA4-DAT-C-01, MA4-DAT-C-02 |
| | `probability` | MA4-PRO-C-01 |

### Stage 5 topics (19 topics · 41 outcomes — focus areas collated)

NESA splits Stage 5 into 41 focus areas (Trigonometry A/B/C/D, Equations A/B/C …).
Those are **collated into one topic per concept** here; each outcome keeps its own
Core / Path badge.

| Strand | Folder | Collates | Outcomes |
|---|---|---|---|
| Number & Algebra | `financial-mathematics` | Financial mathematics A, B | MA5-FIN-C-01/02 |
| | `algebraic-techniques` | Algebraic techniques A, B, C | MA5-ALG-C-01, P-01, P-02 |
| | `indices-and-surds` | Indices A, B, C | MA5-IND-C-01, P-01, P-02 |
| | `equations` | Equations A, B, C | MA5-EQU-C-01, P-01, P-02 |
| | `linear-relationships` | Linear relationships A, B, C | MA5-LIN-C-01/02, P-01 |
| | `non-linear-relationships` | Non-linear relationships A, B, C | MA5-NLI-C-01/02, P-01 |
| | `variation-and-rates-of-change` | Variation and rates of change A, B | MA5-RAT-P-01/02 |
| | `polynomials` | Polynomials | MA5-POL-P-01 |
| | `logarithms` | Logarithms | MA5-LOG-P-01 |
| | `functions-and-other-graphs` | Functions and other graphs | MA5-FNC-P-01 |
| Measurement & Space | `numbers-of-any-magnitude` | Numbers of any magnitude | MA5-MAG-C-01 |
| | `trigonometry` | Trigonometry A, B, C, D | MA5-TRG-C-01/02, P-01/02 |
| | `area-and-surface-area` | Area and surface area A, B | MA5-ARE-C-01, P-01 |
| | `volume` | Volume A, B | MA5-VOL-C-01, P-01 |
| | `properties-of-geometrical-figures` | Properties of geometrical figures A, B, C | MA5-GEO-C-01, P-01/02 |
| | `circle-geometry` | Circle geometry | MA5-CIR-P-01 |
| | `introduction-to-networks` | Introduction to networks | MA5-NET-P-01 |
| Statistics & Probability | `data-analysis` | Data analysis A, B, C | MA5-DAT-C-01/02, P-01 |
| | `probability` | Probability A, B | MA5-PRO-C-01, P-01 |

---

## Deep links

The page supports hash deep-links, handy for putting on a Google Classroom post
or a scope-and-sequence doc:

- `/resources/#stage-3` — opens on the Stage 3 tab (also `#stage-4`, `#stage-5`)
- `/resources/#MA3-AR-01` — opens the right stage, filters to that outcome and scrolls to it
- `/resources/#MA5-TRG-C-02` — same, any MA3/MA4/MA5 code works
- `/resources/#MA4-INT-C-01/four-operations` — that outcome with one idea already
  open and highlighted. Every open idea has a **Copy link to this idea** button that
  makes this link for you.

---

## Ideas = NESA content statements (`contentStatements.js`)

Each outcome lists its content statements in syllabus order, word for word from NESA's
*Record of learning and achievement using syllabus content* documents (Stages 3–5,
February 2024). 241 statements: Stage 3 71, Stage 4 60, Stage 5 110. Each has a short
`id` (unique within its outcome) — that is what a resource's `ideas` array points at.
Stage 3 statements also carry `part: "A"` or `"B"` (shown as a small A/B tag) and
NESA's sub-heading as `group`.

To find an id, search `contentStatements.js` for the outcome code:

```js
"MA4-INT-C-01": [
  { id:"compare-order",   text:"Compare and order integers" },
  { id:"add-subtract",    text:"Add and subtract positive and negative integers" },
  { id:"multiply-divide", text:"Multiply and divide positive and negative integers" },
  { id:"four-operations", text:"Apply the 4 operations to integers" }
],
```

A resource can sit under several ideas (`ideas:["add-subtract","four-operations"]`).
A statement with nothing filed under it shows greyed as *Nothing yet*, so gaps are
visible at a glance. **Has resources** hides them.

---

## Two resource files, on purpose

| File | Holds | Who edits it |
|---|---|---|
| `resourcesManifest.js` | The 78 syllabus outcomes + **your uploaded PDFs/decks** | You, by hand |
| `toolLinks.js` | **186 links** to interactive tools, student quizzes, worksheet makers, flip cards, games and ELPSA lesson plans that already live elsewhere on the site | Hand-maintained alongside each new tool |

They're split so that adding a worksheet never means scrolling past a wall of
tool links, and so the tool wiring can be rebuilt from scratch without touching
anything you typed.

**`toolLinks.js` shape** — keyed by outcome code:

```js
"MA4-ALG-C-01": [
  { title:"Collecting Like Terms", kind:"Teacher tool",
    url:"/interactive-tools/stage-4/algebra/collecting-like-terms/",
    note:"Group and combine like terms with visual term tiles.",
    tags:["algebra","like terms","simplifying"],
    ideas:["laws-properties"] }
]
```

`kind` decides the icon and the small right-hand label, and the order inside an
idea: **files → interactive tools → worksheet creators → quizzes → lesson plans →
games & cards**.

A tool can appear under several outcomes on purpose. The Protractor Explorer is
listed under both MA3-GM-03 and MA4-ANG-C-01; the URL is identical, so nothing
is duplicated on disk.

**Not listed:** the Revision Generator (Exam Builder), by choice — it spans
almost every topic and would repeat down the whole page. Ultimate Tic-Tac-Toe is
also out; it has no maths content.

---

## File hygiene (read once)

Files live in the repo alongside the manifest, so a single commit always contains
both the PDF and its entry — they can't drift apart. That's the reason for this
setup. It works comfortably to several hundred worksheets.

Two things to know:

**1. Replacing files is expensive; adding them is cheap.**
Git keeps every version of a binary forever. Adding 300 worksheets is fine
(~350 MB, well inside GitHub's 1 GB soft limit and Netlify's free tier). But
re-exporting the *same* worksheet ten times stores all ten copies permanently.
So: get a worksheet right before committing it, rather than pushing successive
drafts of the same file.

**2. Canva decorative borders cost ~900 KB per page.**
Measured on `adding-fractions-with-common-denominators.pdf`: two objects were
93% of the 1.9 MB file. They're not images — they're the full-bleed decorative
border drawn as vector paths, one per page. The actual maths content (text,
fonts, fraction bars) is about 40 KB.

This means compression tools barely help — the data is already Flate-compressed
vector, not a downsamplable raster. Ghostscript manages ~25%.

If file size ever matters, the lever is **Canva, not tooling**: exporting without
the decorative background takes a worksheet from ~1.2 MB to ~90 KB. Purely
optional — the borders look good and nothing is currently straining.

**Don't flatten PDFs to raster to save space.** It roughly halves the size but
destroys the text layer — no PDF search, no copy-paste, no screen-reader access.
Not a worthwhile trade.

### When to revisit

If the library passes roughly 500 files, or you start hosting video, move the
files to object storage (Cloudflare R2's free tier is 10 GB with zero egress
fees) and switch those manifest entries to `type:"link"` with full URLs. The page
already supports that — no code change needed.

---

## Adding a whole new topic

Only needed if NESA changes the syllabus. Add an object to `stage3`, `stage4` or
`stage5` in the manifest with `slug`, `name`, `strand`, `icon`, `blurb`,
`outcomes[]`, then create the matching folder. The page picks it up
automatically — topic counts, hero chips and the search index all derive from
the manifest.

Outcome shape: include `path: "Core"` or `path: "Path"` (plus `pathway` for Path
outcomes) for Stage 4/5. **Omit `path` entirely for Stage 3** — the page then
renders no badge, which is correct for K–6.

To add a whole new *stage*, also add its key to the `STAGES` array near the top
of the script in `index.html` and add a tab button. Everything else is derived.

---

Outcome codes and statements are verbatim from the
[NSW Mathematics K–10 Syllabus (2022)](https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-k-10-2022),
© NSW Education Standards Authority. Pathway notes: Stn = Standard,
Adv = Advanced, Ext = Extension.
