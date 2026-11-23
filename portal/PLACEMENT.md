# MMT Portal Placement (Phase 4A.1)

Audit of the live website repo + where the new Phase 4A platform was placed, what
links changed, and what still needs doing. **No Firestore rules deployed, no data
migrated, no files deleted.**

---
## Batch 1 update (consolidation, controlled)
This repo (`mathstools-main 2`) is now the **single source of truth** for the
deployable portal. The Mills Maths Adventure dev repo keeps a copy of `portal/`
only for automated checks; when you change the portal, develop here (or copy this
`portal/` back). One uploadable folder = the whole repo (Netlify `publish="."`).

**Old dashboards → redirects (originals archived, nothing deleted):**
- Originals copied to `dashboards/_archive/…`.
- `dashboards/student/index.html`, `index-secure-test.html` → redirect to `/portal/student/`.
- `dashboards/teacher/index.html`, `teacher-facing.html`, `teacher-dashboard.html` → `/portal/teacher/`.
- `dashboards/teacher/admin-console.html` → `/portal/admin/`.
  (Each is a 0-second meta + JS redirect with a visible fallback link.)

**Shared quiz layer:** `portal/shared/quizClient.js` — the ONE module every quiz
imports for secure sign-in + `saveAchievement`, sharing `firebaseConfig.js` with
the platforms. Import from the site root so it works at any depth:
`import { MMTQuiz } from "/portal/shared/quizClient.js";`

**First quiz migrated:** `online-quizzes/stage-4/algebra/algebraic-techniques.html`
now uses `quizClient` (no anonymous auth, no direct `students/{code}` read). Its
maths/UI are unchanged; `window.MMTFirebase.mode` + `saveAchievement` keep the same
interface, so the rest of the page needed no edits.

**All 10 student-achievement quizzes are now migrated (Phase 4A.1):**
- [x] `algebra/algebraic-techniques.html` (shared quizClient)
- [x] `algebra/equations.html`
- [x] `algebra/substitution.html` *(compat SDK)*
- [x] `algebra/double-numberline/student-quiz.html` *(compat SDK)*
- [x] `algebra/double-numberline/student-quiz-add-subtract.html`
- [x] `algebra/double-numberline/student-quiz-mult-div.html` *(compat SDK)*
- [x] `measurement-space/angle-relationships.html`
- [x] `measurement-space/reading-a-protractor.html`
- [x] `number/computation-with-integers.html`
- [x] `number/fractions-decimals-percentages.html`
- [x] `number/decimal-zoom.html` — **converted** from public-leaderboard to a secure achievements quiz.
- [x] `interactive-tools/.../Rounding decimals/student-quiz(2).html` — **converted** (same change).

The two rounding quizzes previously typed-in any code, wrote to their own
`decimalZoomRoundingQuizResults` collection, and showed a public leaderboard. They
now: sign in via the secure exchange (real code), save a compact `achievements`
record (`tool: "Decimal Zoom Rounding Quiz"`, no typed answers), keep Skip as
local-only, and the public leaderboard is retired (it pointed to the platform).
The old `decimalZoomRoundingQuizResults` collection is now unused — leave its data
in place; nothing reads it.

Two SDK styles were handled: **6 modular** quizzes import `exchangeOnApp` from
`/portal/shared/quizClient.js` and exchange on their own app; **3 compat-SDK**
quizzes (substitution + the two double-number-line compat pages) load
`firebase-functions-compat.js` and use `firebase.functions().httpsCallable(...)` +
`firebase.auth().signInWithCustomToken(...)`. In every case **only login changed**
— each quiz keeps its own `saveAchievement` and maths. Two of the number-line
quizzes that previously saved `teacher` but not `teacherCode` now also write
`teacherCode`/`teacherName` (so their results appear in the Teacher Platform and
pass the future rules).

All 10 are registered + enabled in `mmtToolRegistry.js` with their EXACT live
`tool` strings as `achievementToolName`. Games are NOT migrated (different
Firebase project). **Note:** a couple of number-line quizzes also write best-effort
`students/{code}` / platform-progress docs; those writes will be denied under the
strict rules but are wrapped in try/catch and don't block the achievement save.

**Rules stay open until all of the above is tested live.**

---

## Repository structure (live site — Netlify `publish = "."`)
```
index.html                     ← homepage (links to dashboards/portal)
assets/ (mmt.png, banner.png, fbmmt.png)
dashboards/
  student/ index.html          ← OLD student dashboard (anonymous auth)
  student/ index-secure-test.html  ← secure test (uses exchange)
  teacher/ index.html          ← OLD teacher dashboard (anonymous auth)
  teacher/ teacher-facing.html ← OLD teacher dashboard the homepage links to
  teacher/ teacher-dashboard.html  ← migrated secure teacher dashboard (exchange)
  teacher/ admin-console.html  ← OLD admin console (anonymous auth)
online-quizzes/stage-4/{algebra,measurement-space,number}/*.html
interactive-tools/… , worksheet-creators/… , flip-cards/… , games/…
assessment/Exam-builder/…
Game Platforms/mills-maths-adventure/index.html   ← Mills Maths Adventure build
portal/                        ← NEW platform (this folder)
netlify.toml                   ← publish="."
```
Because Netlify serves the repo root, **every path maps directly to a URL** and
relative imports inside `portal/` resolve as-is.

## Where the portal was placed
`/portal/` at the repo root (beside `dashboards/`). The internal `../shared/…`
imports resolve correctly from `/portal/student/` and `/portal/teacher/`.

## URLs this creates
- Student Platform → `https://www.millsmathstools.au/portal/student/`
- Teacher Platform → `https://www.millsmathstools.au/portal/teacher/`
- Admin (disabled) → `https://www.millsmathstools.au/portal/admin/`
- Shared modules   → `…/portal/shared/…` (loaded by the pages)

## Links updated (homepage `index.html`)
| Old link | New link | Occurrences |
|---|---|---|
| `dashboards/student/index.html` | `/portal/student/` | 3 (hero, resource grid, footer) |
| `dashboards/teacher/teacher-facing.html` | `/portal/teacher/` | 3 (nav, resource grid, footer) |

## Old dashboards — status (KEPT as backups, not modified)
| File | Likely URL | Decision |
|---|---|---|
| `dashboards/student/index.html` | `/dashboards/student/` | Superseded by `/portal/student/`. Keep for now; redirect or archive after live test. |
| `dashboards/teacher/teacher-facing.html` | `/dashboards/teacher/teacher-facing.html` | Superseded by `/portal/teacher/`. Keep; redirect/archive later. |
| `dashboards/teacher/index.html`, `teacher-dashboard.html`, `index-secure-test.html` | various | Older/variant builds. Keep as reference; tidy later. |
| `dashboards/teacher/admin-console.html` | `/dashboards/teacher/admin-console.html` | Superseded by `/portal/admin/` (disabled page). Keep; do admin in Firebase Console. |

Direct/bookmarked links to the old paths still work (files untouched). Only the
homepage now points at the new portal.

## Firebase-enabled pages found (audit)
- **Student-achievement quizzes** (project `mills-maths-tools`, write `achievements`)
  — these are the ones to migrate to the secure exchange:
  - `online-quizzes/stage-4/algebra/algebraic-techniques.html`
  - `online-quizzes/stage-4/algebra/equations.html`
  - `online-quizzes/stage-4/algebra/substitution.html`
  - `online-quizzes/stage-4/algebra/double-numberline/student-quiz.html`
  - `online-quizzes/stage-4/algebra/double-numberline/student-quiz-add-subtract.html`
  - `online-quizzes/stage-4/algebra/double-numberline/student-quiz-mult-div.html`
  - `online-quizzes/stage-4/measurement-space/angle-relationships.html`
  - `online-quizzes/stage-4/measurement-space/reading-a-protractor.html`
  - `online-quizzes/stage-4/number/computation-with-integers.html`
  - `online-quizzes/stage-4/number/fractions-decimals-percentages.html`
  - (verify: `online-quizzes/stage-4/number/decimal-zoom.html`,
    `interactive-tools/stage-4/number/Rounding decimals/student-quiz(2).html` use
    Firebase anon — confirm whether they write `achievements`.)
- **Multiplayer games** (`games/*.html`) use a **different** Firebase project
  (`mmt-firebase-games`) and do **not** write `achievements`. **Out of scope** —
  do NOT migrate these for the portal; the Phase 3D `mills-maths-tools` rules do
  not affect them.
- **Mills Maths Adventure** (`Game Platforms/mills-maths-adventure/`) already uses
  the secure exchange (confirmed live).

## Quizzes still needing migration (mills-maths-tools)
All 10 student-achievement quizzes above still use the OLD `signInAnonymously` +
`getDoc(students/{code})` pattern. Migrate each with `docs/quiz-migration-guide.md`
(canonical migrated template: `algebraic-techniques.html` in the MMA repo
`portals/`). They keep writing compact `achievements`; only sign-in changes.

## Tool registry (`portal/shared/mmtToolRegistry.js`) — updates made
- `launchUrl` set to **site-absolute** paths:
  - Mills Maths Adventure → `/Game%20Platforms/mills-maths-adventure/index.html`
  - Algebraic Techniques → `/online-quizzes/stage-4/algebra/algebraic-techniques.html`
- Added a **name-mismatch note**: existing `achievements` records use
  inconsistent `tool` strings (`fdp-student-quiz`, `equations-student-quiz`,
  `angle-relationships-student-quiz`, `Decimal Zoom Rounding Quiz`, …). Set each
  placeholder's `achievementToolName` to the EXACT live string before enabling it,
  or standardise names as you migrate. Unmatched records still display (grouped as
  "other").
- Recommended: keep Integers/FDP/Area/Pythagoras as **disabled placeholders**
  until their quiz pages are migrated; enable Algebraic Techniques (records exist).
- Consider renaming `Game Platforms` → `game-platforms` (repo convention) later;
  update the launchUrl when you do.

## Linkover strategy chosen: Option A (add beside, update homepage links)
New portal added; old dashboards left in place; homepage now points to the portal.
Old direct links keep working. After live testing, optionally move to **Option C**
(replace old dashboard files with small redirect pages to `/portal/...`).

Redirect stub you can drop into an old dashboard file later:
```html
<!doctype html><meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=/portal/student/">
<link rel="canonical" href="/portal/student/">
<p>This page has moved to <a href="/portal/student/">the new Student Platform</a>.</p>
```

## Backup / rollback plan
```bash
# from the website repo root
git checkout -b portal-rebuild-backup     # snapshot current state
git add -A && git commit -m "Backup before portal placement (Phase 4A.1)"
git checkout main                          # (or your default branch)
git checkout -b portal-placement           # work on a feature branch
# … the portal/ folder + homepage link edits are already applied …
git add portal/ index.html
git commit -m "Phase 4A.1: add secure portal + point homepage links to /portal"
# push for a Netlify deploy preview before merging:
git push -u origin portal-placement
```
Rollback: `git checkout main` (old dashboards untouched), or revert the commit:
`git revert <hash>`. The old dashboards remain on disk as the fallback.

## Manual test checklist (before deploying strict rules)
1. Deploy/preview this branch (Netlify). Open `/portal/student/`, sign in with a
   real student code (your own test student) → profile + own results load.
2. `/portal/teacher/` → sign in with a real teacher code (your own) →
   students + results load; CSV/copy/modal work; Adventure rich panel shows or
   degrades gracefully.
3. Homepage buttons (hero, resource grid, footer) now open the new portal.
4. Old dashboard URLs still load (backups intact).
5. Mills Maths Adventure → a completed mission appears in both platforms.
6. Only after this: run the Rules Playground checklist, then deploy
   `firestore.phase3d.claims.rules` manually.

## ⚠️ Do NOT deploy the strict Firestore rules yet
The live rules are still open. Deploy the Phase 3D claim rules only after the new
platform is tested live AND the 10 student-achievement quizzes are migrated (games
are unaffected — different project). Deploying earlier breaks any page still on
anonymous auth.
