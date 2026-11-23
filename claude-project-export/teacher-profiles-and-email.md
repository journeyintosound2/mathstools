# Teacher profiles, admin email, access requests, school impact + school map (2026-10-24, data source updated 2026-10-26)

## What was built
- **Admin console** (`portal/admin/`): email required when creating a teacher (+ optional role/position and school picker), optional "email them their code" welcome email; **Edit** on every teacher (name, email, school picker, role, update-email opt-in, "Email them their code"); "Missing email" and "Missing location" filters; "No email" badge; location under the school in the teacher list; Last sign-in column; row checkboxes → "Email selected"; overview tile "Teacher emails x / y".
- **Teacher CSV round trip** (Teachers page): **Export CSV** has every editable field (Teacher code, Name, Email, Role, School, School ID, Sector, School type, Suburb, State, Postcode, Country, Latitude, Longitude, Location source, Update emails) plus read-only Status/Classes/Active students/Last sign-in. **⤒ Import CSV** (or drop a .csv anywhere on the Teachers page): matched by Teacher code; **blank cell = no change**; read-only and unknown columns (e.g. Notes) ignored; a School ID on the official list (current or old ID) fills the official name, suburb, state, postcode, sector, type and pin; changing a school/place without an ID unlinks the old ID and moves the pin to the new suburb centre; bad emails/states/sectors/coordinates are flagged and skipped (rest of the row still applies). Preview shows old → new per field with a tick box per teacher; only real changes are written; name/school changes follow to students. Excel files get a "save as CSV UTF-8" message. Code: `portal/admin/teacherCsv.js` (pure functions). Runs: 2026-10-24 filled all 16 teachers; 2026-10-26 `mmt-teachers-acara-ids-2026-10-26.csv` converts them to ACARA IDs.
- **Email page** (new sidebar item): All active teachers or hand-picked; subject + message with {firstName} {name} {school} {code}; `**bold**`, blank line = paragraph, links clickable; live preview; "Skip teachers who turned off update emails"; Send a test to me; Send; fallback "Open in my email app" (BCC) and "Copy addresses"; Sent emails history (from `emailLog`).
- **Teacher platform** (`portal/teacher/`): 👤 Profile button (topbar) + "Edit profile" on the profile card; profile modal (name, email*, role, **school picker***, "Email me about updates", code + copy, help box); a nudge asks for the email first, then "📍 Confirm your school" (only once the school list is installed); Help & support card. "Set Adventure Task" retired 2026-10-24 (storyline replaces it; old tasks View/Remove only in Manage Tasks).
- **Sign-in page redesign** + **"Request teacher access"** → `portal/teacher/request/`, a **two-step form**: Step 1 About you (name*, school email*, role) → Step 2 Your school (school picker*, message, update opt-in).
- **Admin Requests page**: pending count, overview callout, Approve (editable details incl. school picker → creates teacher code + sends welcome email), Decline (with reason email), Delete (spam).
- **School impact (Overview)**: Schools tile + "Active this month" tile; sortable Schools table with location and **sector** filters; "Growth over time" chart; **Copy impact summary**; school breakdown pop-up with **School details** (pick the official school once for every teacher in that group).
- **Map of schools (Overview)**: Leaflet 1.9.4 + OpenStreetMap + Leaflet.markercluster 1.5.3. **Bright red pin per school** (size by students); nearby schools join into numbered bubbles coloured by activity (green active 28 days, blue used before, slate no tasks yet) that split on zoom. NSW / Australia / World views; overseas = dashed country pin. **Full screen** with a searchable, sortable **Schools list** (tick to show/hide, click to fly to); Esc/Back/button to exit. **Trackpad pinch** zooms the map, never the page.
- **Back-fill ("Find their schools")**: matches teachers without a map location against the official list.
- **Cloud Functions**: `updateMyTeacherProfile`, `sendAdminEmail`, `requestTeacherAccess`, `reviewAccessRequest`; `cleanSchoolMeta()` accepts schoolId, sector, schoolType, postcode, lat, lng, locSource.
- **Rules**: `emailLog` (admin read), `accessRequests` (admin read + delete). Nothing since has needed a rules change.

## School picker (`portal/shared/schoolPicker.js`)
**🇦🇺 In Australia** → type the school name or suburb and pick it from the official list (sector shown; NSW first) · **My school isn't listed** → typed name + ABS suburb (pin at suburb centre) · **🌏 Another country** → free text, country-centre pin. Stored: `school, schoolId, sector, schoolType, suburb, state, postcode, country, lat, lng, locSource`. If the data files don't load it falls back to typed suburb + state (never blocks a teacher). The source line under the picker credits ACARA.

## School and suburb data (`portal/shared/geo/`)
Built by `python3 tools/geo/build-geo-data.py` from downloads in `tools/geo-source/` (git-ignored).
- **Schools: ACARA Australian schools list** (https://asl.acara.edu.au/) — **CC BY 4.0, all sectors**, every registered school and campus. ACARA's Data Access Program recommended it on 26 Oct 2026 (instead of the My School School Location/Profile xlsx, whose terms don't allow republishing and which is a year old) and asked only that we credit it. Live build (downloaded 2026-10-26): **10,900 open schools** — Government 7,177 · Catholic 1,824 · Independent 1,899; NSW 3,409 = 2,209 / 566 / 634. Sector comes from SchoolSector + IndependentSchool (NG+Y = Independent, NG+N = Catholic).
- **IDs are ACARA IDs** (e.g. Coffs Harbour High School = 42372). The file's `legacy` map turns the 2,209 old `NSW-<code>` IDs (from the 24 Oct NSW-only list) into ACARA IDs; the picker, admin grouping and CSV import all understand old IDs, and a teacher's profile upgrades itself when saved.
- **Refresh each term** (ASL updates ~5 times a year): asl.acara.edu.au → Search with every box empty → Submit → "Download search results as: **JSON**" → save as `tools/geo-source/asl-schools-YYYY-MM-DD.json` → re-run the script → push. ACARA also offers a SIF 3.4.6 XML API (registration needed); not used — the termly download is enough.
- `--nsw` = fallback to the NSW DoE government list; `--acara` (My School xlsx) is retired.
- **Suburbs: ABS ASGS 2021 Suburbs and Localities** (CC BY 4.0): 15,334 places.

## How schools are grouped
Same official `schoolId` (old IDs translated) = one school; otherwise normalised name + suburb.

## Spam protection on the request form
Honeypot + minimum 2.5 s on page; 40 requests/hour per connection (IP hashed); resubmitting updates the pending request; admin alerts capped at 20/day.

## Resend limits to remember
Free plan = 100 emails/day, 3,000/month.

## Config lines
- functions/index.js: `MAIL_FROM`, `MAIL_REPLY_TO`, `ADMIN_UIDS`, `REQUESTS_PER_IP_PER_HOUR`, `ADMIN_ALERTS_PER_DAY`, `AU_STATE_CODES`, `SECTORS`, `LOC_SOURCES`.
- portal/shared/location.js: `COUNTRIES`, `AU_STATES`, `COUNTRY_CENTRES`.
- portal/admin/index.html: `DECLINE_REASONS`, `MAP_VIEWS`, `pinSize()`, `makeLayer()` → `maxClusterRadius`, `TIER_COL`, `PIN_RED`.
- portal/admin/teacherCsv.js: `EXPORT_COLUMNS`, `ALIASES`.
- tools/geo/build-geo-data.py: `ASL_SECTOR`, `ASL_TYPE`.

## Ideas not built yet
- Cloudflare Email Routing so hello@millsmathstools.au forwards to a personal inbox.
- Re-engagement email to teachers not seen in 30 days; saved drafts; scheduled sends.
- Overseas school lists (pins at the town rather than the country centre).
- Once task history grows large, move the impact numbers to a nightly Cloud Function summary.
