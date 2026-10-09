# Mills Maths Adventure — source project brief

> This folder is the **game source** (and the Cloud Functions). As of
> **2026-08-17** it lives INSIDE the website repo at
> `game-platforms/mills-maths-adventure-source/` (repo
> `github.com/jeffmills2-rgb/mathstools`, cloned locally at
> `~/Documents/GitHub/Mills Maths Tools/`, deployed to millsmathstools.au via
> Netlify on push to `main`). There is no separate `mathstools-main 2` / `Mills
> Maths Adventure` folder any more. The BUILT/deployed game is the sibling
> `game-platforms/mills-maths-adventure/`. **Deploy:** `npm run build` here →
> copy `dist/.` into `../mills-maths-adventure/` → `git add`, commit, push
> (Netlify auto-deploys). Older references below to a separate website folder
> are superseded by this. See the repo-root `CLAUDE.md` for the whole-site view.
> Last reviewed: 2026-07-22 (newest work in the DONE 2026-07-22 section below). **All LIVE** (deployed 2026-07-08, commit `aad2142`):
> W3–W6, the Phase 3A–3G question-bank expansion (6 topics) + Linear teacher UI
> fixes, and the NEW topics Angle Relationships (3G), Properties of Geometrical
> Figures (3H) and Data Classification & Visualisation (3I) — so Stage 4 now has
> **14 topics** (see the per-phase sections below). Also live: schoolyard NPCs
> default to a RANDOM Stage 4 topic (Phase 3J) and Bacon's idle-clip fix. Nothing
> is pending deploy. **387 → 391 headless checks, all passing.**
>
> **NEW (built 2026-07-15 → 18): FRACTION FARM (F1–F10 + W7)** — a third
> region (large late-afternoon farming world, portal BEHIND the island
> spawn) with EIGHT in-world challenges, all 15 rounds, local bests + the
> trophy.glb stand: **Fence Challenge** (fraction of a length; locked
> side-on camera, banded points + BULLSEYE, bird marker), **The Round-Up**
> (f/d/% OF AN AMOUNT; equal-groups reveal), **Order the Parts** (order
> f/d/%; carrot swaps + confetti), **Crate Packing** (HCF via animated
> group-splitting; host Peck), **The Milk Splitter** (terminating vs
> recurring; the division performed live; host Milkman Pearce + Meshy
> milk-truck.glb), **The Weigh Station** (rounding + ≈ on a zoomed
> number-line beam; money to 5c; exact-vs-estimate judgement rounds),
> **The Trading Post** (FDP conversions across three stalls; ×10 trap tags;
> bulk deals with improper fractions/mixed numbers).
> Player = rigged main1.glb (Space jump / Shift run);
> welcome screen lets you PICK one of THREE rigged characters (Explorer /
> Cool Cat / DJ Goat). A build through Crate Packing v4 was
> deployed 2026-07-18; the Milk Splitter, Weigh Station, Trading Post + truck are NOT yet deployed
> (build → copy dist → push website).
> **391 → 438 headless checks, all passing.** See the farm sections below.
>
> **NEW (built + DEPLOYED 2026-07-22): EALD BILINGUAL SUPPORT + a 6-item teacher
> feedback batch + a stuck-key fix.** Offline bilingual layer (English + Farsi
> فارسی / Arabic العربية, both RTL) lives in `src/i18n/`: a hand dictionary
> (`translations.js`), a `<Bi>` component + `t()` helper (`i18n.jsx`), and an
> auto-`BilingualLayer.jsx` that translates matching on-screen text IN PLACE
> (only edits text-node values + parent attrs, never adds/removes DOM nodes, so
> it's safe alongside React + react-three-fiber). Picker is a LANGUAGE DROPDOWN
> (`LanguageSelector`, shows each language's own name + English in brackets, e.g.
> "فارسی (Farsi)") on the load screen and in the ⚙ menu; it blurs itself after a
> choice. Also in this batch: entering a student code on the LOAD screen now
> SIGNS IN online right there (`CharacterCreator.handleStart` → async
> `useCloud.registerWithCode`; wrong code holds + shows why, unreachable cloud
> falls through to local play); the Retrieval Practice Playground portal is now a
> LOCKED wooden gate + padlock until integers+fdp+algebra each have a best score
> ≥80% (`isPlaygroundUnlocked` in `results/resultUtils.js`, travel blocked in
> `Player.jsx`, locked visual in `Portal.jsx`/`World.jsx`); the Fraction Farm
> haybale portal MOVED to the western coastline `[-32,16]` (well clear of Integer
> Dunes) and its swirl is now bright YELLOW (`HAY_SWIRL` palette in `Portal.jsx`);
> a random FARM treasure chest (`farm-chest`, `FARM_CHEST_POS` in
> `interactables.js`, handled in `interaction.js`); island Mills mentions Fraction
> Farm and the farm Mills explains collecting all 10 trophies (gold 100% / silver
> 75% / bronze 50%) — both in `data/encounters.js`. STUCK-KEY FIX in
> `game/useKeyboard.js`: movement keys ignored while a `<select>` is focused +
> ALL keys cleared on window blur / tab hide (a focused native dropdown was
> swallowing keyup, leaving a key "stuck on"). This same deploy also carries all
> previously-pending farm work (Milk Splitter, Weigh Station, Trading Post +
> truck, Trade v2 / Weigh v3 / jumpable fences) — so those are now **LIVE** too.
>
> **NEW (built 2026-07-28, NOT yet deployed): SNOWBALL SUMS COMPLETE + THE
> LODGE INTERIOR.** All TEN snow challenges now exist (additive-strategies
> pedagogy, one strategy per reserved area — see the ten ###-sections below):
> Snowball Range (bridging to ten, Pip) · Ice Rink (jump by tens, Fern) ·
> Christmas Tree Grove (compensation, Alby) · Snowman Meadow (levelling,
> "Frosty") · Sledding Slope (constant difference, "Flake" — plus the snow
> world's FIRST TERRAIN, a real hill in the NE corner) · Igloo Village
> (partitioning, "Bloc") · Penguin Colony (near-doubles, "Pippin") · Ice Cave
> (think-addition, "Glim") · Lodge Yard (friends of 100, "Cocoa") · Aurora
> Lookout (the strategy-picker capstone, "Nova"). Quoted hosts are
> PLACEHOLDERS (no glbs → primitive bodies). PLUS a FIFTH region: **The Lodge
> Interior** (log-cabin great room + bedroom + animated woodfire) behind an
> AJAR, swing-open door on the ski lodge — door-to-door travel via the new
> portal `arrive` points; Pip hosts Fireside Addition (stage3 addSubTo20)
> by the hearth. The full headless suite went **449 → 482 over the session**
> (the documented "453" had drifted), all passing; every batch also
> vite-built clean. Everything wants a live `npm run dev` visual pass and a
> deploy (build → copy `dist` → push website) when troubleshooting is done.
>
> **NEW (built 2026-10-02/03, NOT yet deployed): MAGMA MULTIPLES** — the
> sixth region (volcano/lava world, red portal on the island at [17, 31]) and
> its TEN multiplicative-thinking challenges (arrays, split arrays/area model,
> the ×10 terraces, halve & double, factor forge, for-each combos, ratio
> tables, division by chunking, scaling dragons, the strategy summit), each
> hosted by a teacher glb, with a trophy stand on the plaza. See the two
> "DONE (2026-10-0x) — MAGMA MULTIPLES" sections. **535 checks, all passing.**
>
> **NEW (built 2026-10-07, NOT yet deployed): EMERALD JUNGLE** — the
> SEVENTH region (a lush jungle valley, GREEN mossy-arch portal on the island
> at [-17, 31], mirroring the volcano gate). Land only — no characters, no
> maths yet: a 2.07× Magma-sized valley of big tree-covered hills, a river
> from a waterfall to a lily lagoon, a 16 m plateau, and many ways UP (hills,
> Waterfall Stairs, the ridge crest, vine walls you climb, leaf-pole hops,
> bouncy mushrooms, the Great Tree's spiral stair → treehouse → rope bridge).
> TEN open clearings are reserved for future challenges. See "DONE
> (2026-10-07) — EMERALD JUNGLE". **535 → 543 checks, all passing.**
>
> **NEW (built 2026-10-07/08, NOT yet deployed): FRACTION FARM REBUILT** —
> the old flat 120×96 farm is now a big, ROLLING, explorable farm the size
> of the Emerald Jungle (1.02× its walkable land; 290 × 258 m inside the
> boundary fence, −4…16 m of relief). Big hills separate TEN themed areas,
> each home to one of the ten fraction challenges (unchanged maths), placed
> to be DISCOVERED along graded farm tracks, a creek with bridges, a duck
> pond and Windmill Hill. See "DONE (2026-10-08) — FRACTION FARM REBUILT".
> **543 → 552 checks, all passing; vite build clean.**
>
> **NEW (built 2026-10-08, NOT yet deployed): SNOWBALL SUMS REBUILT** — the
> old flat 120×96 snowfield is now a big alpine VALLEY the size of Fraction
> Farm (same 290 × 258 m inside the rim): rising snowfields + pine forests,
> big hills you SLIDE down (two toboggan chutes, a chairlift back up), a
> frozen river + pond to SKATE on, an icy glacier lake (bounce back out)
> with snowy islands, floes + plank bridges, the lodge village with glowing
> windows + smoking chimneys, a giant snowman, an ice cave and frozen falls
> under the escarpment, jagged peaks + the aurora. The ten snow challenges
> are unchanged (stages on level pads, cameras pad-relative). See "DONE
> (2026-10-08) — SNOWBALL SUMS REBUILT". **552 → 562 checks; vite build
> clean.**
>
> **NEW (built 2026-10-09, NOT yet deployed): NUMBER ISLAND REBUILT + A
> GAME TITLE SCREEN + THE ACHIEVEMENTS WALL.** The flat 76 m hub island is
> now a sunny 229 × 205 m tropical island (2.7× across, 7.4× the land) to
> the rebuilt worlds' standard, every world gate in a little landscape that
> previews its world; the old welcome card is a full title screen over a
> live flyover of the island; an Achievements Wall by the arrival arch shows
> every world's progress, with an Enter-to-look first-person view. Built
> over two sessions (the first ran out of usage before syncing; its work was
> recovered from its transcript). See "DONE (2026-10-09) — NUMBER ISLAND
> REBUILT". **562 → 566 checks; vite build clean.**
>
> **NEXT UP options:** live visual pass + deploy of the snow world + cabin ·
> teacher glbs for the six placeholder snow/cabin hosts (add each
> characterId to characterModels.js) · a snow/cabin cloud-completion path
> (all ten snow bests are LOCAL-ONLY — reportFarmCompletion is
> farm-specific) · Farsi/Arabic strings for all new snow/cabin text ·
> interactive plot-a-point input mode (tap the Cartesian grid) · Stage 5
> depth (still only 2 sample skills) · more Stage 4 topics (Area extension)
> · a DevPanel gallery to eyeball every new diagram/chart at once.

## DONE (2026-10-09) — NUMBER ISLAND REBUILT + TITLE SCREEN + ACHIEVEMENTS WALL
Jeff's brief: (1) upgrade the starting screen to a polished, professional
video-game feel; (2) rebuild the landing world to the standard of the
rebuilt Snowball Sums / Emerald Jungle, about 2.5× its size, with the portals
in meaningful, polished places; (3) an ACHIEVEMENTS WALL near the spawn
summarising every area, with an Enter key that switches to a first-person
view to read it. **562 → 566 checks (old flat-island checks rewritten; new
IL1–IL10 in `src/dev/islandWorldChecks.js`), all passing; vite build clean.**
NOT yet deployed. (Session note: the first session hit its usage limit
before syncing anything to the Mac; the second rebuilt its exact state by
replaying the transcript's file writes/edits in order — every recorded
check result matched — then finished it. Checkpoints were saved to
`../Claude outputs/mma-hub-*.tgz` along the way.)
- **Size call:** "2.5× the size" was taken as 2.5× ACROSS (229 × 205 m of
  land vs the old 76 m circle = 2.7× across, 7.4× the area) — the same
  scale family as the worlds it links to. If Jeff meant 2.5× the AREA, shrink
  `COAST.r0` (+ bumps) in islandLayout.js and re-tune pads/paths (IL2 guards
  the ratio).
- **The map (`src/data/island/islandLayout.js`, single source of truth):**
  S **Harbour Green** — you arrive at `ISLAND_SPAWN [0, 84]` off the jetty
  (compass-rose landing) LOOKING NORTH through the NUMBER ISLAND arch up
  Main Street; the **Achievements Wall** stands just west of the arch, the
  painted island MAP board east of it, Mills + the welcome sign on the green.
  C **Mission Plaza** — a raised octagonal stone plaza (deck 6.2 m, 1.2 m
  wall, four stair flights) with the Number Fountain, Mission Board and
  Trophy Stand, reached up cobbled Main Street past four cottages.
  N **Schoolhouse Hill** — the island school; the Retrieval Practice
  Playground portal is its padlocked yard gate. NW **Frosty Peak** (snowy
  ridged mountain, summit trail spiral → cairn + telescope) with **Igloo
  Hollow** = the Snowball Sums igloo, and **Pip's Number Line** (a giant
  −10…+10 thermometer) at the snow's edge. NE **Ember Peak** (smoking
  volcano, lava crater + stream) with the **Ember Terrace** (hex basalt
  paving) = the Magma Multiples arch, and **Fern's Ash Fields** below.
  W **Haybale Meadows** (barn, windmill, wheat, sunflowers, hay) = the
  Fraction Farm haybale gate. SW **Emerald Lagoon** (palms, ferns, Emerald
  Falls off the bluff) = the Emerald Jungle mossy arch on the ledge. E
  **Alby's Lighthouse** on its islet over a rope bridge. SE **Sunny Cove**
  (pier, beach huts, rowboats). 12 graded paths (`ISLAND_PATH_CTRL`),
  4 signposts, 8 chest spots, 13 named areas (`ISLAND_AREAS`).
- **Gates + door-to-door return:** the five island portals sit at
  `GATES` (each faces its approach). Every world's return portal now carries
  `arrive` / `arriveYaw` (regions.js), so coming home lands you just in front
  of the gate you left by, looking out — not back at the jetty.
- **Terrain (`src/data/island/islandTerrain.js`):** the farm/snow pipeline —
  1 m grid (301 × 281) from `rawHeight` (polar coastline with designed bays,
  headlands + cliffs, hills, Frosty Peak's ridged spurs, Ember Peak's cone +
  crater, the shelving sea floor) → level PADS → graded PATHS (≤ 0.28) →
  pad tops → the LAGOON + its channel → the lava stream. Sea level y = 0
  everywhere. Hooks (regions.js island-1): layered `islandGroundHeight`
  (plaza deck + stair flights solid; jetty/pier/rope bridge thin),
  `islandSlideAt` (cliffs, the upper cones), `islandSpeedAt` (WADE the
  shallows + lagoon, ×0.62), `islandHazardAt`/`islandHazardInfo` (deep sea →
  splash bounce-back with `SEA_HINT`; crater + stream → lava bounce),
  `islandIsSafe`, `cameraTerrainClamp`, `maxFrameDelta`, `arriveYaw: 0`.
  `collisionEngine.groundHeightAt` now delegates to the island terrain (the
  old PLATEAU/STAIRS/bridge height-field is gone; worldColliders/worldZones/
  worldBoundaries/worldBridges/worldLandmarks keep their exports, re-pointed
  at the new layout, for the DevPanel + older checks).
- **Scatter + colliders:** `islandProps.js` (≈310 trees — palms on the
  beaches + lagoon, the lagoon's little jungle, meadow copses, the NORTH
  WOODS round the school, Frosty Peak's snowy firs/spruces + pines below;
  ≈400 flowers, bushes, ferns, rocks, shells, driftwood, crops; building
  FOOTPRINTS; `clearAt`), `islandColliders.js` (circles from the same data;
  bridge/jetty rails height-banded).
- **Rendering (`src/game/IslandScenery.jsx` + `src/game/island/`):**
  `islandMaterials.js` (terrain shader: turf/sand/snow/ash/rock by height +
  slope; ocean with depth tint, swell, sparkle + shore foam; canvas
  textures), `IslandTerrain.jsx`, `IslandWater.jsx` (ocean, Emerald Falls,
  lava, splash/hot-foot), `IslandFlora.jsx` (instanced + LOD, GPU grass),
  `IslandBuildings.jsx` (plaza, cottages, school, lighthouse + rope bridge,
  harbour, cove, farm — StaticBatch with far LOD), `IslandLandmarks.jsx`,
  `IslandAtmosphere.jsx` (player-following sun, clouds, gulls, butterflies,
  crabs, dolphins, chimney smoke, far islands), `AchievementsWall.jsx`.
  Area labels (`NearLabel`) show while you APPROACH an area (8 m … 34 m) and
  step aside near a gate (`GATE_QUIET` 11 m) so they never stack on a gate's
  own sign. The island's sky is `SkyDome trueHorizon` — an elevation-keyed
  gradient, so the fogged sea meets the sky without the hard band the UV
  gradient made from high cameras (other regions unchanged).
- **Title screen (`src/ui/TitleScreen.jsx`, `styles/title.css`,
  `game/TitleCamera.jsx`, `game/WorldReady.jsx`):** World renders in `title`
  mode behind it; TitleCamera flies a closed spline round the island
  (`data/island/titleShots.js`, IL9 keeps it ≥ ~30 m clear of the ground).
  Flow: loading CURTAIN (until the world's first frames) → SPLASH (logo,
  "Press Enter or tap to start") → MENU (Continue for returning players /
  Start adventure, Change character, Sign in with student code, Options) →
  CHARACTER card (turntable ‹ ›, name, optional code, Set off!) / OPTIONS
  (language, graphics, sound, touch). Keeps every old welcome-screen
  behaviour (?code= auto sign-in, sign-in before play, reset with a confirm).
  Returning players now see the title too (Continue). Display fonts are
  bundled (OFL: Lilita One + Baloo 2 in `src/assets/fonts/`, `styles/
  fonts.css` — no network). Tablet portrait stacks the character card; all
  new strings have Farsi + Arabic in `i18n/translations.js`.
  `ui/CharacterCreator.jsx` is no longer imported (kept for reference).
- **Achievements Wall:** `data/island/achievements.js` (pure — six panels:
  Number Island level/XP/coins + Pip/Fern/Alby best vs 80% + badges; the
  Playground's 8 staff keys + Head Teacher's Cup; Fraction Farm / Snowball
  Sums / Magma Multiples 10 trophies each with medal counts; Emerald Jungle's
  explorer's log; a world counts as visited if `mma-visited:<region>` is set
  OR it has any best), `data/island/wallView.js` (geometry + the LOOK
  camera: whole wall or one board, framed from the live fov/aspect into the
  band above the caption bar), `game/island/achievementsCanvas.js` (each
  board is a live canvas texture), `game/island/AchievementsWall.jsx` (the
  gallery wall: plinth, six framed boards, header with the player's name,
  canopy, picture lamps), `ui/AchievementsWallUI.jsx` + `styles/wall.css`
  (Enter prompt in the wall's zone; while looking: ← → boards, ↑ ↓ zoom,
  1–6 jump, Enter/Esc step back; touch buttons). uiStore `wallView`
  (`openWall/closeWall/wallStep/wallZoom`); Player.jsx's wall camera mode
  hides the avatar (first person) and freezes locomotion.
- **Performance (SwiftShader, 800×470, arrival):** High ≈ 480 draws /
  1.19 M tris, Low ≈ 190 / 0.37 M — lighter than the farm (915 / 2.2 M) and
  snow (885 / 1.5 M). DEV-only: `window.__ISL_ONLY = ["IslandTrees", …]`;
  `window.__gl` (renderer) joins `__cam`/`__scene`/`__ps`.
- **Verified:** IL1–IL10 (hooks + door-to-door gates · 2.7× across + 16.7 m
  of relief · all 12 paths walkable · a flood fill reaches every gate,
  friend, the summit, the wall, the lighthouse, signposts + chests · flat
  pads + plaza deck + walkable flights · the wall faces the arrivals and all
  21 look views are clear at 16:9 + 4:3 + its data · wadeable lagoon, deep-sea
  + lava bounce, dry decks · scatter clear + sealed by the sea · the title
  flyover stays clear · areas/friends/signposts/gates sane). Real Player
  physics in a headless browser: jetty → Main Street → the plaza stairs →
  the deck (y 6.2); walk into the igloo → Snowball Sums → walk into its
  return gate → back in front of the igloo. Screenshots: title (16:9, 4:3,
  iPad portrait, phone), all five gates, the wall + its board views, aerials.
- **TODO:** a live look on a real GPU + a school iPad (the title flyover's
  frame rate, the wall camera glide, grass density, the lagoon falls);
  then deploy (build → copy dist → push website — mind the PWA-href gotcha
  in the 2026-09-28 section). Onboarding text + the island area names have
  no Farsi/Arabic yet.

## DONE (2026-10-08) — SNOWBALL SUMS REBUILT: a big, playful alpine valley
Jeff's brief (with four reference images — Banjo-Kazooie's icy water with
snowy hex floes + plank bridges and its snowy cabins with glowing windows on
islands, SM64 Cool Cool Mountain's slopes, giant snowman + spiky pines, SSX's
jagged peaks): upgrade Snowball Sums like the farm — the same size, playful,
NOT flat: rising snow fields, icy rivers/lakes/puddles, big hills to slide
down, a polished 3D-game look. The ten challenges' maths/stores/panels/3D
stages are UNCHANGED; each stage now stands on a level PAD in a themed area
(every challenge constant is still "its AREA + the same offsets", so the
stages + cameras never changed shape). **552 → 562 checks (new SW1–SW10 in
`src/dev/snowWorldChecks.js`; SN1/SN5/SL1 rewritten for the valley, SN2
lists the new `snow-chest`), all passing; vite build clean.** NOT yet
deployed.
- **The map (`src/data/snow/snowLayout.js`, single source of truth):** rim
  ±142 / ±126 (`SNOW_BOUNDS` 290 × 258, = the farm's), terrain modelled to
  ±186 / ±170 with jagged rim peaks. You ARRIVE at `SNOW_SPAWN [0, 104]`
  looking NORTH through the welcome ARCH (`SNOW_ARCH`) up the main trail to
  the lodge village; the painted TRAIL MAP (`SNOW_MAP_BOARD`) and the
  trophy cabinet are beside it, the igloo gate home just behind-right.
  Areas: **Lodge Village** (the ski lodge with its ajar door → the Lodge
  Interior, six log cabins, the big decorated tree) + **Lodge Yard** (cocoa
  stall) · **the Frozen Pond** = the Ice Rink · **Snowman Hill** (12.5 m,
  the GIANT snowman, the Tumble Run down onto the pond) above **Snowman
  Meadow** · **Christmas Tree Grove** on Pine Hill's flank · **Fort Frost**
  (snow-block walls round the Snowball Range) · **Big Sled Hill** (25 m
  summit = the Aurora Lookout; the chairlift up, the Big Sled Run down;
  the Sledding Slope's groomed run on its west flank) · **the Glacier
  Lake** (Igloo Island = Igloo Village, the Penguin Floe = Penguin Colony,
  bridges, floes) · **the Frozen River** from **the Frozen Falls** (an ice
  curtain draped down the escarpment) to the pond · **the Ice Cave** (a
  rocky arched mouth in the escarpment foot). 15 graded TRAILS
  (`SNOW_TRAIL_CTRL`), 10 signposts, 6 chest spots.
- **Terrain (`src/data/snow/snowTerrain.js`):** the farm's pipeline — 1 m
  grid (373 × 341) from `rawHeight` (tilted base + fbm + wind drifts, named
  HILLS incl. the lake basin, the escarpment, rim foothills + a steep wall +
  ridged peaks) → LEVEL PADS (`SNOW_PADS`; `incline` = the sled run,
  `island` = lake islands, `ice` = pond + falls pool, `cliff` = the cave)
  → graded TRAILS (grade ≤ 0.28; a trail that branches off another starts
  ON its surface; where two crowd each other the NEARER wins and a cut bank
  forms) → pad tops → the RIVER (ice ribbon, always falling, pinned pool →
  pond) + the CHUTES (icy trough + 1 m berms, profile always falling 0.07–
  0.5) — both skipped INSIDE pads so pads stay exactly level → the LAKE
  (bed, islands, gentle shores that keep trails + their shoulders).
  `padEdgeDist` fix: a pad's exact centre used to read as "not on the pad".
- **Player hooks (regions.js snow-sums; Player.jsx):** layered
  `snowGroundHeight` (bridge decks, floes) · `snowSlideAt` (rim + cliffs) ·
  **ICE** `iceAt` (pond, river, puddles, chute runouts: momentum + glide,
  and sloping ice pulls you downhill — `ICE_SLOPE_G`) · **the COLD LAKE**
  `isLava: snowHazardAt` + `hazardHint`/`hazardSound "splash"` (Magma's
  bounce-back, re-used: you hop back to the last safe spot with a splash) ·
  **TOBOGGAN CHUTES** `chuteAt`/`chuteFrame` (step into a trough → a guided
  ride on a red sled: gravity × grade − drag, steer left/right, released
  onto the runout ice; `playerState.sledding`) · **THE CHAIRLIFT**
  `liftBoardAt`/`liftSeatAt`/`liftDismount` (stand on the blue boarding mat
  → an open gondola carries you up Big Sled Hill and drops you on the
  summit; `playerState.onLift`). Ride props (sled, gondola) are drawn by
  Player.jsx `RideProps`. Hints use `playerState.blockedIcon` (no padlock
  for ride/hazard hints — BlockedGatePrompt). sound.js gained `whoosh` +
  `splash`.
- **Cameras (`src/data/snow/snowCameras.js`):** the ten snow challenge
  views in ONE place (the old per-challenge maths, now pad-relative);
  Player.jsx's ten snow camera branches collapsed into one (`snowCamKey`).
  `SnowStage` (like FarmStage) lifts each stage onto its pad and mounts it
  only within ~120 m.
- **Scatter + colliders:** `src/data/snow/snowProps.js` (firs, spruces,
  SM64 spiky pines, birches, boulders, crags, shrubs, drifts, logs, stumps,
  tufts, ice crystals — off trails/pads/chutes/ice/lake/bridges/the lift
  line and out of every challenge corridor; building FOOTPRINTS; Fort
  Frost's walls; lift towers; cave rocks). `snowColliders.js` rewritten
  (non-jumpable rim, the lodge, the old challenge collider ids, footprints,
  jumpable fort walls, trees/rocks/logs, height-banded bridge rails).
- **Rendering (`src/game/SnowScenery.jsx` root + `src/game/snow/`):**
  `snowMaterials.js` (snow terrain shader: sastrugi ripples, blue hollows,
  rock on steep faces, crystal GLINTS; glossy ice; the cold lake water with
  a foam rim; canvas textures: trail, ice, snowy planks, logs, snowy roof,
  snow blocks), `snowGeometry.js` (procedural trees with LOD/FAR, rocks,
  shrubs, drifts, logs, crystals, jagged peaks), `SnowTerrain.jsx` (ground
  chunks + trail ribbons), `SnowWater.jsx` (lake + slush chunks + floes,
  all the ice, the frozen falls, the splash), `SnowFlora.jsx`,
  `SnowBuildings.jsx` (lodge + ajar door, cabins dug into the slopes,
  igloos, Fort Frost, the chairlift with moving gondolas, chute gates +
  slalom flags + sled racks, snowy rope bridges, signposts, lamps, canes —
  StaticBatch with a far LOD), `SnowLandmarks.jsx` (arch, trail map,
  welcome board, giant snowman, cave mouth, snowmen, decorated trees +
  gifts, and IDLE dressing at each challenge's collider spots — hidden
  while that challenge runs), `SnowAnimals.jsx` (penguins on the floe,
  belly-sliders on the pond, snow hares that hop away from you),
  `SnowAtmosphere.jsx` (winter-afternoon sun following the player, GPU
  snowfall, aurora curtains over the north, horizon peaks, chimney smoke).
  World.jsx: sky dome r 640, fog 85/400, Effects `snow` (bloom threshold
  0.985 + softer AO so the snowfield doesn't glow). Labels only when near.
- **Performance (SwiftShader, 800×470, arrival):** High ≈ 885 draws /
  1.5 M tris, Low ≈ 404 / 0.63 M (the farm: 915 / 2.2 M and 430 / 0.71 M).
  DEV-only: `window.__SNOW_ONLY = ["SnowTrees", …]` draws only those layers.
- **Verified headlessly:** SW1–SW10 (hooks/gates/spawn · farm-sized
  (0.85× its walkable land — the lake takes the rest) + 49 m of relief ·
  every trail walkable · a 0.5 m flood fill from the spawn reaches all ten
  challenges + hosts, the lift, both chute tops, the islands over the
  bridges, signposts, every signpost arrow's target and every chest · level
  pads · every challenge camera clear at 16:9 + 4:3 (and no furniture in a
  shot) · ice + the cold lake + bridges + floes · chutes always fall onto
  ice, the gondola clears the hill, the rim slides you home · scatter off
  everything, rim sealed · ten areas spread out). Driven with the REAL
  Player physics: all 15 trails walked, both chute rides (Big Sled Run
  79 m / 25 m drop ≈ 12 s; Tumble Run ≈ 7 s), the lift (≈ 15 s, off at the
  dismount), the lake bounce-back, ice coasting 3.3 m vs 0 on snow. All ten
  challenges screenshotted at 16:9 + 4:3.
- **YELLOW-TINT FIX (2026-10-08, Jeff's live report):** on High graphics
  the whole snow scene flickered/turned YELLOW (HUD fine). Cause: the
  EffectComposer persisted across regions while `<Effects snow>` changed
  Bloom's props, so R3F rebuilt the Bloom effect and re-appended it at the
  END of the chain (merged with the Vignette after SMAA) — that pipeline
  zeroed a colour channel (blue in the snow → yellow; red back on the
  island → cyan-green) until the graphics toggle remounted it. Fix:
  `Effects.jsx` keys the composer on the look (`snow` / `standard`), so a
  prop change is always a fresh, correctly ordered chain. Verified on the
  real Apple GPU through repeated island ↔ snow ↔ jungle ↔ farm ↔ lodge
  trips. RULE: never change an effect's props on a live composer — key it.
  Also tidied three reversed GLSL `smoothstep`s in the snow shaders.
- **Notes / TODO:** a live look on a real GPU + an iPad (snowfall density,
  the chute ride's feel + camera, gondola timing, bloom on the lamps).
  Penguin Colony's 4-option card covers its rows on a 16:9/4:3 screen (the
  card + framing are unchanged from before the rebuild). Farsi/Arabic for
  the new labels + Mills' new welcome. Pete (WanderingPete.jsx) isn't in
  this source tree — his checks still pass via `isPeteSpotOk` (now in
  snowTerrain.js); if Pete returns, wire him to the terrain height.

## DONE (2026-10-08) — FRACTION FARM REBUILT: a big, rolling, explorable farm
Jeff's brief: expand Fraction Farm to the Emerald Jungle's size, with
navigable terrain where the player DISCOVERS the challenges — not flat, large
rolling hills separating areas, each area themed to its challenge, polished
to the jungle's standard. The ten challenges' maths/stores/panels are
UNCHANGED; their stages moved onto level pads in themed areas. **543 → 552
checks (new FW1–FW9 in `src/dev/farmWorldChecks.js`; FA1/FA5/FE1/FG1/FH1/
FV1/FP1/SN1/MG2 updated for the new layout), all passing; vite build
clean.** NOT yet deployed.
- **The map (`src/data/farm/farmLayout.js`, single source of truth):**
  boundary fence ±142 / ±126 (`FARM_BOUNDS` 290 × 258); terrain modelled
  out to x ±186 / z ±170 so the hills roll on past the fence. You ARRIVE at
  `FARM_SPAWN [0, 106]` on the arrival green looking NORTH up the drive
  through the ENTRY ARCH (cattle grid, "FRACTION FARM" sign) — Mills
  welcomes you, the painted MAP BOARD shows the whole farm, the trophy
  cabinet stands west of the gate, the haybale gate home is just behind-right
  (`FARM_RETURN_PORTAL [8.5, 114.5]`). Themed areas (`FARM_AREAS`, labels
  show when near): **Farm Gate Shop** at the homestead (shop) · **Orchard &
  Packing Shed** (crate) · **Carrot Patch** (order) · **The Dairy** +
  milking shed (milk) · **Cattle Run** (roundup) · **The Old Sawmill** on
  the creek with a turning water wheel (plank) · **The Long Paddock**
  (fence) · **Grain Silos** + weighbridge (weigh) · **Glasshouse Gardens**
  (veggie) · **Market Green** with bunting + marquee (trade) — plus the
  Homestead (barn, farmhouse, silo, coop, tank, ute), **Windmill Hill**
  (16 m summit, the big sail windmill, a picnic spot), **Sheep Downs** +
  shearing shed, the **Duck Pond** + jetty, sunflowers, lavender, wheat,
  corn, a vineyard, hay meadows and gum belts. 17 graded TRACKS
  (`FARM_PATH_CTRL`), 10 signposts at the junctions, 3 bridges over the
  creek, 6 treasure-chest spots.
- **Terrain (`src/data/farm/farmTerrain.js`):** a 1 m height GRID (373 ×
  341) built once: `rawHeight` (named capsule/ellipse HILLS + gentle noise)
  → LEVEL PADS (`FARM_PADS`: superellipse pads with per-angle bank widths and
  a weighted bank blend; terraces can share a level via `levelOf`; the pad
  under you always wins) → GRADED TRACKS (each track's profile is smoothed
  from the padded ground, pinned on pads + at its ends, then run through a
  grade limiter (0.28) and carved with BATTER cones so cuttings/fills meet
  the hillside cleanly) → the creek + pond (knee-deep, soft banks kept off
  pads and tracks). The ground mesh is built from the SAME grid with the
  SAME triangle split as `terrainHeight`. Region hooks (as the jungle):
  layered `farmGroundHeight` (bridge decks), `farmSlideAt` (slopes steeper
  than `F_SLIDE_SLOPE` 1.05 slide — the steep hill faces), `farmSpeedAt`
  (wading `F_WADE_SPEED` 0.62), `farmIsSafe`, `cameraTerrainClamp`,
  `maxFrameDelta`, `arriveYaw: 0`. `challengePadY(key)` = the level a
  challenge stage stands on. Pure helpers shared with the scatter live in
  `src/data/terrainKit.js`.
- **Props + colliders:** `src/data/farm/farmProps.js` (deterministic
  scatter — apple/pear orchards, gums, oaks, poplars, willows, pines, liquid
  ambers; crops; round + square bales; rocks/logs/stumps; flowers/bushes/
  reeds/lilies — kept off tracks, pads, paddocks, fences, building
  `FARM_FOOTPRINTS` and every challenge camera corridor via `clearAt`).
  `farmColliders.js` was rewritten (vaultable paddock fences with gates,
  non-jumpable boundary, buildings, trees/rocks/bales/logs, bridge rails
  with `yMin`/`yMax`; the old challenge collider ids are kept).
- **Challenge cameras (`src/data/farm/farmCameras.js`):**
  `farmChallengeView(key, fov, aspect)` frames each stage pad-relative for
  the live aspect (16:9 and 4:3 verified with screenshots);
  `farmCameraCorridors()` / `inFarmCameraView()` keep scatter out of shot.
  Player.jsx's ten farm camera branches collapsed into ONE (`farmCamKey`).
- **Rendering (`src/game/FarmScenery.jsx` root + `src/game/farm/`):**
  `farmMaterials.js` (terrain material + procedural canvas textures: track,
  boards, barn red, weatherboard, corrugated iron (plain/rusty/red/green),
  wire, shingles, straw, drystone, wheat), `farmGeometry.js` (procedural
  trees with LOD, crops, bales, fence parts, animal rigs), `farmKit.jsx`
  (box/cylinder/rod/roof/window/ladder helpers), `FarmTerrain.jsx` (vertex-
  coloured ground incl. a patchwork-paddock rim, track ribbons),
  `FarmWater.jsx` (creek + pond surfaces, fish), `FarmFlora.jsx` (instanced
  trees/crops/undergrowth + the GPU grass field, cleared on challenge pads),
  `FarmFences.jsx`, `FarmBuildings.jsx` (barn, farmhouse, silos, coop,
  tractors, ute, water windmill, packing shed, sawmill + water wheel,
  milking shed, grain silos + weighbridge, glasshouses, shearing shed,
  troughs — each area merged by StaticBatch with a FAR LOD),
  `FarmLandmarks.jsx` (entry arch, map board, signposts, bridges, the big
  windmill, picnic, jetty, scarecrow, Market Green, the big liquid amber
  with kickable leaves, milk truck glb), `FarmAnimals.jsx` (instanced
  Holstein/Hereford cows, sheep, pigs, chooks, ducks, rabbits),
  `FarmAtmosphere.jsx` (late-afternoon sun that follows the player,
  butterflies, dragonflies, thistledown), `FarmStage.jsx` (see perf).
  `src/game/FarmGrass.jsx` (old paddock grass) is GONE.
- **Performance (SwiftShader counts, 800×470, arrival view):** High ≈ 915
  draws / 2.2 M tris, Low ≈ 430 / 0.71 M (the jungle: 1,090 / 3.0 M and
  500 / 1.1 M). Got there by: `FarmStage` (each challenge's 3D scene only
  MOUNTS within 120 m — was ~40 % of all draws), StaticBatch `farDist` (an
  area beyond 125 m draws as ONE untextured vertex-coloured mesh), region
  `badgeRange`/`drawRange` in Interactable (farm 55 m / 170 m — badges no
  longer float over the hills from across the map), and the haybale portal's
  blades instanced + bales batched (also on the island). DEV-only:
  `window.__FARM_ONLY = ["FarmTrees", …]` draws only those layers;
  `window.__cam` / `window.__scene` expose the camera + scene.
- **Verified headlessly:** all 17 tracks WALKED end to end with the real
  Player physics (tap-to-move waypoints, no stalls); all ten challenges
  started and screenshotted at 16:9 and 4:3; area + aerial + low-graphics
  screenshots; FW1–FW9: hooks/gate/safe spawn · jungle-sized + hilly ·
  every track walkable (rise ≤ STEP_UP per step) · a 0.5 m flood fill from
  the spawn reaches every challenge, the summit, signposts and chests ·
  level pads under all ten stages · every challenge camera clear (16:9 +
  4:3) · knee-deep water + bridges on every track crossing · scatter off
  tracks/pads, gates open, fences vaultable, boundary sealed · ten themed
  areas spread out.
- **Mills' welcome** now explains exploring (map board + signposts, the ten
  areas). **TODO:** a live `npm run dev` look on a real GPU + an iPad (frame
  rate, camera on the steeper hills, the far-LOD swap distance, grass
  density), Farsi/Arabic strings for the new labels + welcome lines, then
  deploy.

## DONE (2026-10-07) — EMERALD JUNGLE: the SEVENTH region, a jungle valley (LAND ONLY)
Jeff's brief (with four reference images — Mario Odyssey's Wooded Kingdom
giant-tree forest + sunbeams, an N64 palm jungle with a cobbled path, an N64
rock cliff with vines + leaf-topped poles, a mossy temple arch with a
stream): a GREEN portal from the main island to a forest/jungle world about
TWICE the volcano world, NOT flat — large tree-covered hills and "scalable"
areas; polished, exploration only (maths later). **535 → 543 checks (new
JG1–JG8 in `src/dev/jungleChecks.js`, wired into `runSystemChecks`), all
passing; vite build clean.** NOT yet deployed. Region id `emerald-jungle`,
name **"Emerald Jungle"** (`JUNGLE_NAME` in jungleLayout.js — rename there).
- **Gates:** `island-to-jungle` at `[-17, 31]` (the volcano gate's mirror,
  clear of every island collider) and the return gate on the arrival glade's
  SW edge (`JUNGLE_RETURN_PORTAL`), both `variant: "jungle"` → `JunglePortal`
  in Portal.jsx (mossy stone arch, GREEN `JUNGLE_SWIRL`). You arrive at
  `JUNGLE_SPAWN [0, 134.5]` on a rise LOOKING NORTH up the valley to the falls
  (`arriveYaw: 0`).
- **Layout (single source of truth) `src/data/jungle/jungleLayout.js`:** an
  oval VALLEY (≈256 × 336 m, bounds circle r 182) walled by forested RIM
  mountains (slide hook keeps you in); the northern ESCARPMENT up to a 16 m
  PLATEAU; HILLS (Canopy Hill 26 m with a spiral trail to the Canopy Lookout
  deck, Mossback Ridge 23 m — a long crest you can walk up onto the plateau,
  Fern Hill, Sunny Knoll, plateau rises + knolls); the RIVER from the
  WATERFALL (drops off the escarpment into the falls pool) down to the LILY
  LAGOON, the UPPER RIVER on the plateau, the TEMPLE STREAM out of the temple
  arch — ALL knee-deep (≤ 0.70 m): wade anywhere, slowed (`WADE_SPEED` 0.62).
  11 smoothed dirt TRAILS (flattened across, stones + ribbons), 4 BRIDGES
  (plank / stone / log ×2, arched decks you can also wade under) + the rope
  bridge. TEN reserved clearings `JUNGLE_SPOTS` (Palm Grove, Lily Lagoon,
  Sunny Knoll, Canopy Lookout, Mushroom Glade, Temple Ruins, The Great Tree,
  Redwood Hollow, Waterfall Pool, Sky Shrine) — flat, dry, middles OPEN.
  The terrain is a 1 m height GRID (`getJungleGrid`, 329 × 425) built once
  from `rawHeight` → path carving → clearing flattening → water carving; the
  mesh is built from the SAME grid with the SAME triangle split as
  `terrainHeight`, so what you see is exactly what you stand on.
- **LAYERED ground (new for this region):** `jungleGroundHeight(x, z, y)`
  takes the player's height — solid structures (stairs, landings, the temple
  block, ledges, mushroom caps) always count; THIN ones (bridge decks, leaf
  pads, lily pads, the treehouse deck, the spiral stair, the toadstool cap)
  only when at/below y + STEP_UP, so you can walk UNDER a bridge or the
  toadstool and stand ON it, and the spiral's windings overlap in plan.
- **Ways up (all driven headlessly with the REAL Player physics):** the
  WATERFALL STAIRS (40 stone steps against the cliff east of the falls → a
  landing onto the plateau); the Mossback ridge crest + trail-ridge onto the
  plateau; the VINE CLIFFS — push INTO a vine wall to climb (`climbAt` hook,
  `CLIMB_SPEED` 3.1 m/s, mantle over the lip, "climb" sound), either the full
  wall, or EIGHT zig-zag LEAF POLES (each a hop up) to a mid rock ledge and
  a second vine wall; the MUSHROOM GLADE — mushroom caps are DOMES
  (`domeCap`, crown at `top`, rim 0.45 lower, drawn to match) that BOUNCE you
  (`bounceAt` hook, steer by holding a direction, "boing" sound); the big red
  one's MEGA bounce (launch speed derived from the ledge height via
  `BOUNCE_GRAVITY`, which mirrors Player.jsx's GRAVITY) lands you on a high
  rock ledge, whose orange mushroom bounces you onto the GIANT TOADSTOOL (a
  thin cap you can also walk under); the GREAT TREE — a 57-step spiral plank
  stair round the trunk up through a hatch onto a 20 m TREEHOUSE deck (hut,
  railings) and a sagging ROPE BRIDGE east onto Mossback Ridge; the TEMPLE —
  two side flights onto its walkable roof; the CANOPY LOOKOUT deck.
- **Player.jsx (region hooks, only active where a region defines them):**
  layered `groundHeight(x,z,y)`; `slideAt` (cliffs + rim: slide down, no
  walking up); `climbAt`; `bounceAt`; `speedAt` (wading); colliders may carry
  `yMin`/`yMax` (the band your FEET must be in for it to block — railings at
  deck height, leaf poles only below their pad); airborne fixes; `devCam`
  (DEV-only debug camera, stripped from builds). sound.js gained `boing` +
  `climb`.
- **Rendering (`src/game/JungleScenery.jsx` + `src/game/jungle/`):**
  `jungleMaterials.js` (terrain material with a slope-based rock blend,
  foliage material with wind sway + leafy mottling + up-facing normals for
  double-sided leaves, water with flow/foam, waterfall streaks, sunbeams; all
  procedural canvas textures); `jungleGeometry.js` (procedural broadleaf /
  emergent / conifer / giant-redwood / palm trees with LOD + FAR variants,
  ferns, bushes, big leaves, flowers, mushrooms, reeds, rocks, lilies, logs,
  stumps, vine strips, grass tufts, rock masses); `InstancedChunks.jsx`
  (per-tile instanced meshes → frustum + shadow culling, `maxDist` fade for
  small things, `lodGeometry`/`farGeometry` distance swaps);
  `StaticBatch.jsx` (merges every static set-piece mesh by material, colour
  baked into vertex colours → ~40 draws instead of hundreds; animated parts
  stay outside); `JungleTerrain.jsx` (chunked ground, trail ribbons,
  distant ranges); `JungleWater.jsx` (river/lagoon surfaces, the waterfall,
  wade ripples); `JungleTrees.jsx` (≈2,230 trees + hanging vines);
  `JungleFlora.jsx` (GPU wrapping grass field — High 50 m / Low 32 m patch —
  plus undergrowth); `JungleSetPieces.jsx`; `JungleAtmosphere.jsx`
  (late-morning player-following sun, Redwood-Hollow sunbeams, pollen,
  fireflies, butterflies, birds, falling leaves). Labels (`NearLabel`) for the
  welcome sign, clearings and landmarks show only when you're near. World.jsx
  `isJungle` branch (sky dome r 640, fog 70/360) + path footprints.
- **Performance (SwiftShader counts, 800×470):** High ≈ 1,090 draws /
  3.0 M tris per frame at the arrival view (was 2,950 / 4.6 M before the
  batch + LOD pass); Low ≈ 500 draws / 1.1 M tris (Low: no tree shadows —
  canopy shade is baked into the ground colours — and half the ferns).
  For comparison Magma's arrival is 720 / 0.83 M (High) and 384 / 0.41 M
  (Low): the jungle is a forest, so it is heavier — **needs a live check on a
  school iPad/Chromebook before deploy.** DEV-only profiling: set
  `window.__JG_ONLY = ["JungleTrees", …]` before entering to draw only those
  layers.
- **Colliders `jungleColliders.js`:** tree trunks (rim decoration excluded),
  rocks, logs + stumps (jumpable), the temple colonnade + rubble, signposts,
  the Great Tree trunk/stair balustrade/deck railing/hut walls, bridge and
  stair railings (height-banded), lookout + falls-deck railings, leaf poles,
  the shrine stones + altar, the lagoon statue. Wired in
  `worldColliders.getColliders`.
- **Checks `runJungleChecks()`:** JG1 hooks + both gates + safe spawn +
  STEP_UP agreement; JG2 size (walkable land 2.07× Magma's); JG3 every trail
  walkable end to end as the player walks it (rise ≤ STEP_UP per 0.4 m, no
  slides, no colliders); JG4 a 0.5 m flood fill from the spawn reaches all
  ten clearings (incl. the plateau's Sky Shrine), the gate, the climbs' feet,
  the temple roof and both lookouts on foot; JG5 vine walls / leaf poles /
  every stair flight (walked as routes) / the spiral stair, hatch and rope
  bridge; JG6 mushroom bounces land on their targets, domes, knee-deep
  water, wading only when wet, lily pads; JG7 bridges span water (wade-under
  rails) + the escarpment face slides; JG8 ten open, flat clearings and no
  props on trails. Writing these found and fixed real bugs: an unclimbable
  first step on the Waterfall Stairs + temple flights, a mushroom ledge the
  bounce couldn't reach, too-steep trail sections (Sunny Knoll — now a
  switchback; the Canopy trail start; the Sky Shrine approach), a mushroom
  and a temple pillar standing ON trails, shrine stones across the trail, and
  clearings tilted by river banks.
- **Future (when the maths lands):** claim a `JUNGLE_SPOTS` clearing per
  activity (the Magma pattern: registry, stage frames, view corridor, hosts,
  trophy stand); Farsi/Arabic strings for the new labels; a live `npm run
  dev` look on a real GPU + an iPad (frame rate, the waterfall/sunbeam
  transparency, mushroom bounce feel, vine-climb camera), then deploy.

## DONE (2026-10-03) — MAGMA MULTIPLES: the TEN multiplicative challenges + trophy stand
Jeff's brief: ten challenges that let students PLAY with multiplicative
strategies (area model, doubling/halving, flexible factoring, ratio tables for
× and ÷ …), built on Di Siemon's big ideas and the research on multiplicative
thinking, hosted by the character glbs, plus a trophy stand. **501 → 535
checks (new `runMagmaChallengeChecks` in `src/dev/magmaChallengeChecks.js`:
MCF1–MCF4 + three per challenge), all passing; vite build clean.** NOT yet
deployed. Every challenge was driven in a headless browser (screenshots of
every phase) and through its REAL store (perfect play = 375, gold).
- **Research spine** (why these ten, in this order): Siemon's progression
  from equal groups → ARRAYS → regions/area → "for each" (Cartesian product
  + ratio) and the factor-factor-product idea; her mental strategies (double,
  ×10, think-of, factor) and the move from "groups of" to "times as many";
  Hurst & Hurrell's connected big ideas (the multiplicative structure of place
  value, the distributive property, the array, the inverse); the National
  Numeracy Learning Progression MuS5–MuS7; Fosnot & Dolk's models becoming
  tools (open arrays, ratio tables); Anghileri's high-level chunking for
  division (and remainders in context); the Mr Short / Mr Tall additive trap.
  The SCENE owns the maths, the bottom-docked card owns the input; students
  BUILD the structure (rows, cracks, slides, blasts, fusions, rows of pots,
  table columns, poured chunks, bones) and the consequence is the feedback.
- **The ten (trophy order = recommended order; host · stage):**
  1 **Column Rectangles** (Basalt Columns, Mr. Dawson) — arrays + factor
  pairs: −/+ the rows, N columns stand themselves up, leftovers glow red,
  Keep every rectangle, "That's all!" (turned = same rectangle; primes S3,
  squares S4, rich numbers S5; an early claim REVEALS the missing arrays).
  2 **Crack the Crystal** (Obsidian Grove, Ms. Mahoney) — distributive /
  area model: move a lava crack (or push it past the edge to GROW to the next
  ten), type each piece, then the total; facts → place value → grow (9 × 7 =
  10 × 7 − 7) → two cracks/four pieces (14 × 23) → mixed; tiles ≤ 360, else
  an open region. 3 **Tenfold Terraces** (NEW 9th clearing at P(80,155),
  Ms. Ewings) — the ×10 idea: seven stone terraces Th…th, a FIXED decimal-
  point orb, ◀ × 10 / ÷ 10 ▶ hop the digit stones, Lock, type; placeholder
  zeros fade while moving and drop in once said; round 4 is always the
  "3.5 × 10 ≠ 3.50" trap; S4 tens facts (30 × 40), S5 decimal facts
  (0.4 × 6). 4 **Halve & Double** (Geyser Flats, Mr. Heywood) — steam cuts
  the tile terrace and restacks it alongside (same tiles); chain chip
  16 × 25 = 8 × 50 = 4 × 100; Solve from an easy form (+10); slabs over 900
  tiles use a √-compressed aspect. 5 **Factor Forge** (Ember Forge, Robot)
  — hammer an ingot into a factor pair (primes won't break), fuse two by
  typing their product; +10 only for making a ten ON THE WAY (never the final
  fusion, so straight multiplication can't earn it), +15 final first try.
  6 **Flower Combos** (Fire Flower Garden, Trevor) — for each: predict the
  combos, then plant (one, "this flower in EVERY pot", "copy to every
  glow"); the array appears only as it's planted; S3 adds glows (layers),
  S4 the missing factor; adding the counts is named. 7 **Cart Tables**
  (Cinder Cones, Steve) — ratio table for × AND ÷: tap columns (3D tablets or
  the card), × 2 ÷ 2 × 10 ÷ 10 + −, carts fill in, the student types rocks;
  efficiency vs a BFS minimum (`cinderBestPath`), S4 division, S5 non-unit
  rates (4 : 18). 8 **Lava Channels** (Lava Lake Islet, Mr. Pearce) —
  division by chunking: pour 1/2/5/10/20/50 rows (or any number) from the
  cauldron into a channel d wide over the lava; the poured channel is a
  visible open ARRAY (cells drawn); over-pouring SPLASHES (−3); S4 remainders
  in context (rafts round up / full bags down / leftovers), S5 sharing
  (moulds). 9 **Grow the Dragon** (Dragon Bones, Ms. Brookes) — times as
  many: set the grown-up's bones from the baby's, Raise! — wrong proportions
  make a wonky dragon with the true one as a gold ghost; the add-the-same
  trap is detected and named; one retry; S3 shrinks (toy dragon), S5 say the
  factor first. 10 **Strategy Summit** (crater rim, Ms. Bacon) — the
  capstone (mirrors Aurora Lookout): three rune tablets, the same problem
  rewritten three correct ways (halve/double, make a hundred, split, round &
  adjust, tens, nines, ratio, chunked division); easiest +10, others +5, then
  do it (+15). The one stage filmed INWARD across the crater.
  Mills welcomes arrivals at the plaza (`magma-welcome`); the trophy stand
  (`magma-records`, trophy.glb, groupScale 4.2) is on the plaza's east edge;
  `MagmaTrophyGrid` (uiStore `magmaTrophyOpen`).
- **Framework (one place each):** registry `data/magma/magmaChallenges.js`
  (keys, hosts, STAGE FRAMES — each scene is authored in local coords, x
  right / +z toward the camera — camera views incl. optional `lift`, park
  spots, `inMagmaChallengeView` corridor, `TERRACE_GEOM`); pure logic
  `data/magma/<key>Challenge.js` + `magmaMath.js`; records
  `magmaRecords.js` (`mma-magma-<key>-best`, 375, LOCAL-ONLY); store
  factory `game/magma/createMagmaStore.js` (idle → intro → play →
  celebrate|feedback → done; `award/say/endRound`; state fields must never
  share a name with a verb — MCF3 guards it); stores
  `game/magma/stores/*`; `game/magma/magmaActive.js` (MAGMA_STORES,
  hooks, `exitMagmaExcept`) spread into `farmChallengeActive.js` and
  `interaction.js` (`magma-<key>-host` intercept); 3D
  `game/magma/MagmaChallengeStages.jsx` + `stages/*` (only the running
  scene renders, plus the permanent terraces); 2D `ui/magma/MagmaPanelShell
  .jsx` + `MagmaPanels.jsx` (reuses the Snowball Sums card parts); Player.jsx
  magma camera mode (parks + hides the player, camera in the stage frame).
  World-quieting: clearing labels hide, scatter/obsidian spires in the
  corridor shrink away, the lake obelisk and the dragon ribcage step aside
  for their challenges, hosts in shot hide. CSS: MAGMA MULTIPLES block at the
  end of index.css.
- **TODO:** live `npm run dev` look on a real GPU + an iPad (4:3 framing of
  each card, tap targets on ingots/tablets, the lava glare on the lake
  channel); Farsi/Arabic strings for all new text; a cloud completion path
  (bests are local-only like the snow world); the crater stays sealed —
  opening the rune gate after ten golds would be a natural reward.

## DONE (2026-10-02) — MAGMA MULTIPLES: the SIXTH region, a volcano / lava world (LAND ONLY)
Jeff's brief: a RED portal on the main island → a new volcano/lava world for
multiplicative relationships later; for now just the land — a large,
climbable volcano in the middle (crater you can't enter yet), paths around
lava (inspired by Mario 64's lava levels, but less lava / more paths), about
THREE times Fraction Farm. No characters, no maths yet. **494 → 501 checks
(new MG1–MG7 in `runMagmaChecks`), all passing; vite build clean.** NOT yet
deployed. Region id `magma-multiples`, name **"Magma Multiples"**
(`MAGMA_NAME` in magmaLayout.js — rename there).
- **Island gate:** `island-to-magma` at `[17, 31]` (open SE grass between the
  spawn and the Algebra moat, near the coast), `variant: "volcano"` →
  `VolcanoPortal` in Portal.jsx (basalt-rock arch, RED `LAVA_SWIRL`, glowing
  cracks, two flickering braziers). The same variant is the return gate,
  which sits on the arrival plaza's SW edge (`MAGMA_RETURN_PORTAL`) so it
  never blocks the first view; you arrive at `[0, 93.3]` LOOKING NORTH up
  the avenue at the volcano (new optional region field `arriveYaw`).
- **Layout (single source of truth) `src/data/magma/magmaLayout.js`:** round
  basalt landmass (shore r≈103–116, `WS = 1.12` world scale) in a LAVA SEA;
  33,800 m² of land = **2.93× the farm**. THE VOLCANO: r 48 at the foot,
  36 m tall, flat summit rim r 11–18, crater lava lake inside. A **5.5 m
  spiral SUMMIT TRAIL** (`trailRadius/trailHeight/trailPoint`, 2 turns,
  ~400 m, grade ≤ 0.18) is CUT INTO the cone (`inset`): ~5 m rock wall on
  the inside, a 0.6 m stone KERB + ~1.3 m drop on the outside — the
  mountain keeps a cone silhouette. Torches + bedded boulders line it; a
  beacon brazier marks the top. Lowland: a LAVA MOAT (grand stone bridge in
  the south, three hop-stones in the north), FOUR LAVA RIVERS on the
  diagonals (moat → sea) splitting the land into quarters, a RING ROAD
  (r 76) crossing each river on a different bridge (stone arch / wooden
  planks + rope / iron grate + chains / hexagonal basalt), spokes + outer
  arcs to **EIGHT reserved clearings** (`MAGMA_CHALLENGE_SPOTS`, paved
  discs r 7.5, middles kept OPEN): Basalt Columns (+ a climbable hex-column
  stair), Obsidian Grove, Geyser Flats (erupting steam vents + mud pots),
  Ember Forge (smithy, furnace, anvil, ore cart), Lava Lake Islet (checker
  causeway nod to SM64, obelisk, hop-stones out, LAVA FALLS off a cliff),
  Cinder Cones, Dragon Bones (a fossil ribcage you walk THROUGH), Fire
  Flower Garden. Plus scattered boulders / charred trees / lava pools /
  knolls / ring-road lanterns (deterministic scatter, kept off paths).
- **Terrain functions (all pure, all checked):** `magmaGroundHeight` (bridge
  decks → platforms → volcano (walls max-filtered 0.35 m so your BODY stops
  at the rock) → lava surface → a precomputed 1 m land grid that the mesh is
  built from), `magmaIsLava`, `magmaIsSafe`, `magmaSlideAt` (the bare
  volcano flank → slide outward), `landSD` (signed distance to lava).
- **Player.jsx — region hooks (only active where a region defines them):**
  `isLava` → touching lava never hurts: a "hot-foot" BOUNCE whose arc lands
  exactly on the last safe spot (`lastSafe`, re-checked every 0.4 m), with a
  smoke puff (`playerState.lavaHit`), a hint ("Ouch — hot lava!") and a new
  `lava` sound in sound.js; no colliders/walls mid-bounce (`lavaFlight`).
  `slideAt` → you can't walk UP the flank and you SLIDE down it (no jump
  while sliding) — the trail is the way up. `cameraTerrainClamp` → the
  follow camera rides up over the mountain instead of clipping into it.
  `maxFrameDelta` (1/15 s) → a frame hitch can't tunnel you through a kerb.
  `arriveYaw` (see above). ALSO (all regions): a teleport now clears any
  stale tap-to-move target (a touch player who tapped a portal used to keep
  walking toward that spot in the NEW region).
- **Rendering (`src/game/MagmaScenery.jsx` + `src/game/magma/`):**
  `magmaMaterials.js` (ONE animated lava shader — domain-warped fbm in world
  space, shared by sea/moat/rivers/lake/pools/crater; a UV-flow variant for
  falls + flank streams; rock material with a per-vertex `aGlow` emissive so
  lava BANKS and crater walls glow without lights; procedural canvas
  textures: cobbles, planks, grate, hex, checker, puffs, embers);
  `MagmaTerrain.jsx` (lava sea plane under everything; lowland grid mesh;
  the volcano meshed ALONG THE SPIRAL (rows = spiral angle) so walls/kerbs
  are crisp; crater bowl; cobbled trail/path ribbons + plazas);
  `MagmaBridges.jsx`; `MagmaSetPieces.jsx` (instanced props, all eight
  set-pieces, sealed crater gate, flank lava streams); `MagmaAtmosphere.jsx`
  (lava clock, a SUNSET key light that FOLLOWS the player so shadows work
  across the big map, crater point light, smoke plume, ember fountain,
  ambient embers (High only), distant volcano skyline + sea rocks, hot-foot
  puff). Tap-to-move taps hit the real terrain. World.jsx: `isMagma` branch
  (warm hemisphere, no global key light, per-region `fogNear/fogFar` 85/290
  and `skyTop`, SkyDome `radius` prop 470), ash footprints that follow the
  terrain height (Footprints gained an optional `heightAt`).
- **Colliders `magmaColliders.js`:** crater-lip ring (56 overlapping stones,
  hint "The crater is sealed — far too hot to enter… for now!"), rune-gate
  pillars, bridge rails, braziers, sign, boulders/trees/lanterns, every
  set-piece. Wired in `worldColliders.getColliders`.
- **Checks `runMagmaChecks()`:** MG1 hooks + both gates + safe spawn, MG2
  size ≈3× farm and mostly land, MG3 the trail climbs (≤ 1 cm rise per 4
  mrad, no steep/lava on it, tops out at 36 m, wall ≥ 2 m, kerb blocks,
  flank slides outward), MG4 crater sealed, MG5 no path crosses bare lava
  (bridges/causeway/hop-stone gaps ≤ 1.2 m/column stair ≤ STEP_UP), MG6 a
  flood-fill from the spawn reaches all clearings + the trail mouth + the
  gate ON FOOT, MG7 clearings open, no props on paths or in lava.
  The full climb was also driven in a headless browser with the REAL
  Player physics (tap-to-move along the trail): foot → summit, y 0 → 36.
- **Future (when the maths lands):** claim a `MAGMA_CHALLENGE_SPOTS` entry
  per activity (farm/snow pattern); the crater is the obvious capstone —
  open the rune gate (`CRATER_GATE`) and add a path down. Farsi/Arabic
  strings for the new labels. A live `npm run dev` look on a real GPU +
  an iPad (lava shader cost, ember counts, shadow follow-light) before deploy.

## DONE (2026-09-29) — SNOWBALL SUMS ROUND 2 (Jeff's feedback on the audit)
Nine points from Jeff after playing the audit build. **491 → 494 checks (new
SA6–SA8 drive the real stores), all passing; vite build clean; deployed.**
- **Bigger cards everywhere** — a round-2 CSS block at the end of index.css
  (`.snow-dock` card up to 980px, question 1.85rem, buttons/inputs larger,
  world chips 30px). Every intro is now TWO short steps + one example.
- **Rink** — no route preview (the arcs used to give the answer away): the
  card shows only "Total so far: +22 · 4 tiles" and a 🚀 Launch button; the
  hop arcs draw as the penguin actually hops.
- **Grove** — a wrong bundle/fix is a shake + "Try again!" (no points, same
  step: `missedThisPart`/`missNote`/`missAt` in the store).
- **Sled** — the sleds STAY where the student leaves them; a non-tens spot
  says "There's an easier position…" and misses the slide points (gold needs
  the tens number).
- **Meadow** — the typing step asks the ORIGINAL sum ("7 + 11 = ?") with the
  double as a hint underneath.
- **Cave** — the student's chosen way now actually plays (store `chosen`);
  if it wasn't the quick way, the quick way plays after it
  (`cavePhases`/`caveRunFor`), with "⬆ up: 4 steps" / "⬇ back: 47 steps"
  counters, so the difference is SEEN. The window spans both routes; the
  answer is never labelled on the wall before a run lands on it; the scenery
  mound in the cave mouth hides during the challenge.
- **Igloo Village — REBUILT as a manipulative.** No multiple choice: the
  student moves tens and ones from both igloos into the middle one (tap the
  3D rods/cubes, or "➡ a ten"/"➡ a one"), swaps 10 ones for a ten when the
  pile reaches ten ("🔄 10 ones → 1 ten", or tap the pile), then ✅ Done!
  (build 10 — lost if Done was pressed with 10+ ones unswapped), then types
  a + b (15). Logic: `villageSite`, `gradeVillageBuild`,
  `VILLAGE_BUILD_POINTS`/`VILLAGE_TOTAL_POINTS`. Tighter camera
  (`LATE_SNOW_VIEW.village`, new per-view `minDist`).
- **Lodge Yard — REBUILT.** The hundred-bead board "looked like a ratio". Now
  a COUNTING-UP board: a number line from the price's tens number to 100c;
  tap coins (1c 5c 10c 20c 50c) and each is a labelled jump ("+5c"); the
  card shows "Total so far: 65c + 5c + 10c = 80c"; past $1 glows red (take a
  coin back). "💰 Give the change" works only on exactly 100c (10 pts, 5 if
  it went past $1 on the way), then "5c + 30c — how much change is that?"
  (15). Logic: `YARD_COINS`, `gradeYardCount`, `yardTillAfter`,
  `fewestCoinsFor`, `round.lineMin`.
- **Aurora — REBUILT.** Strategy NAMES were unreadable for this age. A round
  now offers THREE big tiles, each THIS sum rewritten (47 + 29 →
  "47 + 30 − 1" / "40 + 20 + 7 + 9" / "47 + 20 + 9") — all correct — and asks
  "Which way is easiest?" (easiest 10, the others 5). The student then does
  the sum THEIR way, one step per line, typing the last. Each archetype
  builds `ways` + `alts`; `round.choices` = [{key,label,show,steps}]. No tile
  or last step may contain the answer (regenerated if it would). New tool
  "🐾 Count in ones" (9 tools). makeTen avoids 9s and doubles so "easiest"
  is never a coin flip.
- **TODO:** live iPad look at the bigger cards (4:3), Farsi/Arabic strings
  for all the new wording, a tap-target check on the village rods on touch.

## DONE (2026-09-28) — SNOWBALL SUMS YEAR-7 AUDIT (all ten activities)
Jeff asked for an audit of the ten snow activities with the students' age in
mind ("some aren't intuitive for this age"). Every activity was played in a
headless browser and screenshotted before and after. **486 → 491 checks
(new SA1–SA5 in `runSnowAuditChecks`), all passing; vite build clean.**
- **Question card docks at the BOTTOM** (`.farm-challenge-panel.snow-dock`,
  styles at the end of index.css). The top-docked card was covering the maths
  each scene writes in the world (Grove, Lodge Yard and Aurora sums were fully
  hidden). Every snow camera looks `SNOW_DOCK_LIFT × dist` below its activity
  (Player.jsx) so the scene rides up clear of the card. The HUD movement hint
  hides during a snow challenge.
- **Nothing stands in the camera's line.** `SNOW_CHALLENGE_VIEWS` +
  `inSnowChallengeView()` (snowLayout.js) define a corridor per challenge
  (all filmed from the south). While one runs: scenery props in it are not
  rendered (SnowScenery), host NPCs in it are hidden (Interactable
  `outOfShot`), the parked player avatar is hidden (Player), wandering
  penguins leave the colony, the rink sliders go during the rink, the sled
  prop/flags go during the sled. Keys come from `useActiveSnowChallenge()` /
  `activeSnowChallengeKey()` in farmChallengeActive.js.
- **Kid-sized cards** — shared `ui/SnowCardParts.jsx`: `SnowIntro` (2–4
  numbered steps + ONE worked example, no points maths), `SnowRoundHead`
  ("Round 3 of 15 · ⭐ 50"), `SnowWorking` (feedback as one step per line —
  every round now carries a `working` array in its logic file). Jargon gone
  from student text: friendly, overflow, decade, level twins, sound tool,
  brightest path, tokens.
- **Per activity:** Range — idle crates hidden mid-round, pole chip reads
  "2 to the crate · 4 spare". Rink — each queued push draws an arc on the ice
  (an empty number line) + "lands on N" ring/readout; unit ticks; plan shown
  as "+10 ×4 · +1 ×5". Grove — "which is closest to 8?", fixes are Take 2 off /
  Take 1 off / Just right! / Add 1 / Add 2. **Meadow — HOP-IT-YOURSELF**:
  students tap Hop / Hop back, then call "They match!" or "They can never
  match" (first call scores the +10; a wrong call is a nudge, not a dead end),
  and the "4 apart, only 2 hops" insight comes AFTER on the typing card;
  bigger balls, closer camera. **Sled — number line now increases to the
  RIGHT** (it ran backwards), the self-contradictory rope prediction is
  retired (round = slide 10 + gap 15), bigger ticks/labels, closer camera.
  Village — ten-blocks are ROD of ten unit cubes (same cube as the ones),
  stronger colours, chips "23 = 2 tens + 3 ones", Part B is two sentence
  rows ("Tens 20 + 20 = [ ]"). Colony — both rows share a left edge so pairs
  line up, face the camera, row-count chips; "double 6, then +1" wording;
  **a wrong pick no longer prints the total**. Cave — only the BACK half of
  the dome is drawn (the front wall hid every crystal), pale-ice crystals,
  "which way is quicker?", "steps". Lodge Yard — cents and $1 (answers
  accept "35c"), lit cream bead board with 10c…100c row labels, camera on
  the board. Aurora — EIGHT tools (🧊 Tens and ones added — splitAdd's
  scaffold was that strategy but the menu lacked it), each with a one-line
  example, and a round OFFERS only four (`lookoutOptionsFor`).
- **Deployed** from a fresh `vite build` (the old bundle was a hand-patched
  build; asset hashes changed). **Build gotcha:** vite resolves the PWA block
  in the source index.html (`../../manifest.webmanifest`, the apple-touch
  icon) and emits hashed copies into `dist/assets/` — after copying `dist`,
  put those two hrefs back to `../../manifest.webmanifest` and
  `../../icons/apple-touch-icon.png` and delete the two copied files.
- **TODO:** a live iPad look (4:3 framing of the bottom card), Farsi/Arabic
  strings for the new card text, the Cave's scenery mound sits inside the
  cave mouth (visible left of the crystals).

## DONE (2026-07-29) — WORLD-QUIETING pass + Snowball Range re-stage (teacher feedback)
From a live screenshot: the ten-frame crate was invisible behind its own area
label, four world chips competed with the panel, and Pip/Alby/Fern all kept
pulsing "Talk to me" mid-challenge. **482 checks still pass** (headless run
after the changes). NOT yet deployed; the vite build must be run on the Mac
(rollup/esbuild native binaries won't run in the Linux harness).
- **World quieting (all regions).** `game/farmChallengeActive.js` gained a
  `CHALLENGE_STORES` list + a NON-REACTIVE `isAnyChallengeActive()` safe to
  call from a `useFrame` loop. While ANY farm/snow challenge runs:
  `Interactable.jsx` hides every status badge (`quiet = modalOpen ||
  challengeActive`), stops the turn-to-face tracking (via a `quietRef` so the
  frame loop doesn't re-subscribe), forces `nearby={false}` so
  CharacterModel crossfades back to the RESTING clip instead of talk/wave,
  and fades the interaction pads to 0.05. Wildlife holds still too:
  `SnowScenery` `WaddlingPenguins` (waddle rock/bob zeroed) + `RinkPenguins`
  (the belly-sliders cross the Glide-by-Tens number line), and FarmScenery
  `WanderingCows` — the Round-Up's own task cows are a separate component and
  are untouched.
- **Area labels come down during a challenge.** The `SNOW_CHALLENGE_SPOTS`
  pills (SnowScenery) and ALL farm paddock labels (FarmScenery — was
  Veggie-Plot-only) hide while a challenge runs. The "Snowball Range" pill
  sat exactly in front of the ten-frame; this was the reported bug.
- **Snowball Range re-stage** (`SnowballRangeChallenge.jsx`): `CELL`
  0.62→0.82, `BALL_R` 0.26→0.34, `FRAME_Y` 1.7→1.95; the board is now a
  wooden surround around a LIT cream panel (`BACKING`, emissive 0.42) with a
  `LANTERN` box + pointLight on the crossbar, so white snowballs AND dark
  sockets both read in the twilight; sockets opacity 0.55→0.85; cells sit at
  z 0.24, bars 0.08, panel 0.02. The packed crates of ten moved to
  `STACK_X = -4.4` (clear of the widened frame) and their chip now shows the
  VALUE ("20 packed", not "1 crates of ten" — grammar bug). Spare-pile label
  only appears once balls land on it (`round0Rest`). `Player.jsx` `rangeMode`
  camera tightened (fit half-width 8.0→6.6, dist cap 24→20, min 10→9, look
  y 1.5→1.9, z −1.6→−2.4).
- **One place for the maths** (Jeff's call): the 3D scene owns it, the panel
  owns the input. The split readout under the row shows only while the
  divider is live; during typing the equation chip shows the TRANSFORMATION
  ("18 + 7 → 20 + 5"); the panel's splitting strip is now just
  "❄️ Round n/15 · score" + Throw + Quit, and the typing card asks "How many
  altogether?" instead of restating the sum.
- **TODO:** live `npm run dev` visual pass (lantern intensity vs the twilight
  key light, backing-panel glare, new camera framing on a 4:3 iPad, the
  frozen penguins mid-waddle looking odd if a challenge starts as one walks).
  A check asserting no world label renders while a challenge is active would
  be worth adding.

### Round 2 (same day) — PLACE VALUE MADE VISIBLE + fill-to-continue
Second screenshot: "47 + 4" floated above a frame holding SEVEN, with the 40
as four small brown boxes off to the left — nothing tied them together, and a
student could throw any split and move on. **482 → 483 checks (new SR4), all
passing.** Still NOT deployed.
- **Packed crates are now FULL TEN-FRAMES** (`PackedTenFrame`, `MINI = 0.3`)
  — the same 5×2 grid on the same lit backing as the open crate, all ten
  cells packed. 47 reads as four identical full frames + one holding 7, so
  tens and ones are visibly the SAME unit. Stacked two-wide growing upward
  hard against the open frame's stand (`packedPos`, `STACK_RIGHT`,
  `STACK_COLS = 2`) — up to 9 crates for a 90s start. The old brown-box
  `TenCrate` is kept ONLY for the idle dressing when no challenge runs.
- **The start number is bracketed** (`PackedTens`): a value chip on the wall
  ("40"), a value chip under the open frame ("7"), and a lit BRACE spanning
  both tagged "40 + 7 = 47". The running equation chip above is unchanged.
- **The ten-frame must be FILLED to continue** — new store status
  **`missed`** + `retrySplit()` + an `attempts` counter. A throw that doesn't
  complete the frame no longer advances: the gaps/bounced surplus show, the
  panel names the direction, and the divider comes back for another go.
  `submitSum` is unreachable from `missed`, so nobody states a total over an
  unfilled frame. **Part A's +10 lands on attempt 1 only** (`scored` flag;
  the label degrades to "❄️ Crate full — ten!" when unscored) so the max set
  score is still 375 and the split still measures whether they KNEW the
  complement — retries teach it rather than score it.
- **Aim preview after a first miss** (`TenFrame` `preview={attempts > 0}`):
  the sockets the live split WOULD fill light up blue as the divider moves,
  capped at the number of empties. First attempt stays a clean assessment;
  the retry is scaffolded ("three empty, I need three").
- **Checks:** new **SR4** drives the real store — a miss holds the round at
  score 0 with typing gated, `retrySplit` returns to splitting, the refill
  opens typing but banks nothing for Part A, and a first-throw fill on the
  next round still pays the full 25.
- **TODO (adds to the list above):** the brace + three chips are a lot of
  world text at once — check on a live look whether the "40 + 7 = 47" brace
  chip can drop once the wall + the two value chips are doing the work. The
  wall tops out ~4.2 m for a 90s start, taller than the frame; confirm it
  doesn't crowd the equation chip. The other nine snow challenges still show
  their own `SLOT_OVERRIDES` maxes — unchanged by this.

## DONE (2026-08-01) — PETE, the snow world's wandering local
Ambient life for Snowball Sums: a rigged character who strolls the open snow,
stops, throws a spin jump, and walks on. **483 → 485 checks (PT1/PT2), all
passing.** NOT yet deployed.
- **The glb was 15.9 MB / 206k tris / a 7.3 MB PNG** — 40× the other
  characters (180–430 KB). Re-exported through gltf-transform
  (`resample → prune → weld → simplify --ratio 0.06 --error 0.006 → resize
  1024 → webp → meshopt --level high`) to **341 KB / 12.4k tris**, in line
  with steve.glb (347 KB) and pip.glb (363 KB). Rig verified intact
  afterwards: 24 joints, JOINTS_0/WEIGHTS_0 present, all five clips still
  targeting all 24 nodes. Same extension set as the other characters
  (EXT_meshopt_compression + EXT_texture_webp + KHR_mesh_quantization).
  **Re-run that pipeline if Pete is ever re-exported from Meshy.**
- **Three-beat loop** (`game/WanderingPete.jsx`): `walking` → stroll to a
  random legal spot (Walking) → `idling` 3–5 s (Idle_6) → `spinning` ONE
  360_Power_Spin_Jump (LoopOnce + clampWhenFinished, beat length read from
  the clip's own duration) → walk on. **He never runs** — `run` is absent
  from `PETE_CLIPS` and PT2 asserts it stays absent.
- **Not an interactable.** No badge, no encounter, no collider — students
  walk straight through him. He's world texture, not content.
- **Where he may walk** (`snowLayout.js`): `PETE_WANDER` (±50/±38, inside the
  ±58/±46 bank) filtered by `isPeteSpotOk` — off the rink ice (he has no
  slide physics) and ≥ `PETE_CHALLENGE_CLEARANCE` (11 m) from all ten
  challenge clearings. `pickTarget` also rejects spots inside a snow collider
  and anything closer than 8 m (no twitchy micro-steps); a step that would
  enter a collider abandons the target rather than pushing through, and
  `MAX_WALK_MS` (22 s) frees him if he ever wedges.
- **Obeys the world-quieting pass:** while any challenge runs he stops dead
  and holds the idle clip.
- **`PETE_CLIPS` lives in `snowLayout.js`, not characterModels.js** — the
  latter reads `import.meta.env` so it can't be imported by the headless
  harness. characterModels spreads `PETE_CLIPS` into its `pete` entry.
- **Checks:** `runWanderingPeteChecks()` — PT1 samples 4000 spots and asserts
  every accepted one is on snow, off the ice and clear of all ten clearings
  (plus that enough spots remain that he isn't boxed in); PT2 the clip map.
- **TODO:** live `npm run dev` look — `modelScale` 1.54 and `rotationY` 0 are
  copied from the other Meshy characters and may need tuning (flip rotationY
  to Math.PI if he moonwalks); check the spin-jump doesn't sink him through
  the snow, and that the walk clip's foot speed roughly matches
  `PETE_WALK_SPEED` (1.15 u/s) or he'll look like he's skating.

### ROOT MOTION (2026-08-01, same day) — no more snap-back
Teacher feedback: Pete's spin jump was cut short and he slid back to where he
launched; the same slide happens on the PLAYER's jump. Both are the same bug —
**the clips travel, the game's position didn't.** New shared
`game/characters/rootMotion.js`. **485 → 486 checks (PT3), all passing.**
- **Measured** (decompress the glb first — the shipped ones are meshopt):
  Pete `360_Power_Spin_Jump` = **3.07 s**, Hips +262.7 → ~4.0 world units.
  Player jump = 0.90 s, Hips ~+220–237 → **~3.4–3.8 world units**. Walk / run
  / idle cycles carry NO root translation, so only the action clips matter.
  **main1.glb's travelling clip is the one named `Idle_4`** (its clip names
  are shifted off their content — already handled by its `clips` map).
- **`extractRootMotion(clip)`** finds the travelling track (named
  root/hips/pelvis/armature, else the furthest-travelling position track),
  copies out the horizontal offsets, then FLATTENS x/z in the track so the
  clip animates IN PLACE and can never move the body itself. **Height is left
  alone** — the hop is the arc and belongs to the animation. Returns
  `{trackName, duration, total, sample(t)}` (clamped at both ends), `null`
  for an in-place cycle. Mutates the shared clip ONCE, WeakMap-cached.
  **`rootMotionScale(obj, trackName)`** reads the bone parent's live world
  scale so the 0.01 armature scale × modelScale is never hardcoded.
- **Pete:** the spin beat is now driven by the action's OWN playhead
  (`action.time` vs `clip.duration`) instead of a guessed 1600 ms — that
  guess was the truncation. Position is carried along `sample(t)` rotated by
  his yaw, and a landing that would be inside a collider / off-limits simply
  isn't committed, so he can't spin into a snowbank.
- **Player (Jeff's call: travel, don't cancel):** `PlayerCharacter` strips the
  jump clip's travel and publishes the world-space step each frame on
  `playerState.jumpRootStep` (rotated by the new `playerState.facing`);
  `Player.jsx` applies it through the SAME clampToBounds → resolveCircle →
  STEP_UP path as walking, then clears it. So a standing jump now genuinely
  carries ~3.5 m forward and lands there, but a wall still stops you mid-leap
  and `jumpable` colliders are still dropped while airborne (fence vaulting
  unchanged). The welcome-screen preview passes `modeOverride`, which
  suppresses publishing entirely.
- **TODO — this one needs a careful live pass.** A standing jump moving 3.5 m
  is a real change to game feel: re-test the plateau stairs, the moat bridge,
  vaulting paddock/challenge fences, and that you can't jump THROUGH a locked
  portal gate or out past a boundary fence. If it proves too far, the honest
  dial is to scale `step` in PlayerCharacter's publish block (a third feels
  about right) rather than to re-cut the clip.

## DONE (2026-07-27) — SNOWBALL SUMS (S1–S2): the FOURTH region, a twilight snow world
> **2026-10-08:** the snow world's MAP (the flat 120×96 field, the rink
> bank, the NE slope bump, positions, lanes, cameras in Player.jsx)
> described in this and the following snow sections is SUPERSEDED by the
> rebuild — see "DONE (2026-10-08) — SNOWBALL SUMS REBUILT". The ten
> challenges' mechanics, stores and panels below are unchanged.
A new 120×96 region (SAME dimensions as Fraction Farm) reached via an IGLOO
portal on the island at `[-14,-25]` — on the Integer Dunes snow patch, just
EAST of the dunes, between Pip's clearing and the playground portal. Purpose:
room for TEN future in-world maths challenges (topics TBD). Built, vite-built
clean, and run through the FULL headless system checks — the suite reported
**448 before this session** (the documented "444" had drifted) and **453
after** (5 new SN checks), **all passing**. NOT yet deployed; the visuals want
a live `npm run dev` pass (aurora height/opacity, igloo doorway, lodge roof,
penguin waddle, trophy-cup seating on the glb).
- **Region:** `snow-sums` in `regions.js` (twilight sky `#3a3f6b`, flat
  ground); collider switch in `worldColliders.getColliders`; render + TWILIGHT
  lighting branch (`isSnow`: cool moonlit key `#bdcdff` from the NE, indigo
  hemisphere, darker `SkyDome top`) in `World.jsx`; blue-grey snow footprints
  everywhere off the rink (`isOnSnow` predicate).
- **Layout (single source of truth) `src/data/snow/snowLayout.js`:** spawn/
  return-portal/lanes/lodge-yard mirroring the farm's arrival pattern; the ski
  LODGE (glowing windows) as the barn analogue; **TEN reserved
  `SNOW_CHALLENGE_SPOTS`** (rink · igloo village · penguin colony · snowman
  meadow · Christmas tree grove · snowball range · ice cave · sledding slope ·
  lodge yard · aurora lookout), each an open clearing with an in-world label,
  checked in-bounds / ≥14 m apart / clear of colliders; igloos, snowmen,
  Christmas trees (+ distant ones past the fence), lamp posts, candy canes,
  ice-cave crystals, sled + flags, boundary ice-block bank (±58/±46,
  non-jumpable), snowy horizon peaks.
- **Colliders `snowColliders.js`:** border runs (non-jumpable) + `rinkBankColliders()`
  (ellipse-rim mounds, JUMPABLE, southern entrance gap) + lodge grid + props.
- **Scenery `game/SnowScenery.jsx`:** all primitive MARKERS for teacher glbs —
  snowmen (hat/scarf/carrot), decorated xmas trees (baubles + glowing star),
  igloos, the lodge, ice cave, sled; **WADDLING PENGUINS** (wander like the
  farm cows inside `PENGUIN_WANDER`, side-to-side waddle rock + bob while
  walking) plus TWO penguins that belly-slide back and forth across the rink
  (upright spin at each end); ANIMATED AURORA (3 additive rippling ribbons,
  fog-off), star field + low moon; the rink sheet (glassy ellipse + skate
  rings + bank mounds rendered FROM the collider list so visuals can't drift).
- **ICE RINK IS SLIPPERY (Player.jsx):** on the rink (`isOnIce`), input steers
  a persistent velocity (`iceVel`, `ICE_GRIP = 1.5 s⁻¹`) instead of driving
  displacement — momentum, drift and glide-to-stop; walking on carries your
  speed in; gliding stops during dialogues (`frozen` guard); camera-lock and
  facing follow the actual skate direction; jump carries momentum.
- **Igloo portal (`Portal.jsx` `IglooPortal` + `ICE_SWIRL`):** snow-block dome
  + entrance arch with the swirl glowing icy blue in the doorway, flanking ice
  crystals, `variant: "igloo"` handled in World.jsx.
- **Trophy stand — IDENTICAL to the farm's:** shared `game/TrophyStand.jsx`
  extracts the trophy.glb cabinet + the SELF-CALIBRATING 2×5 pigeonhole cup
  placement + grand-trophy-at-10-golds as `TrophyStandAssembly` (FarmScenery's
  own copy untouched). Snow stand at `[-11,43]` (north fence, west of the
  return portal), group scale 5.2, collider r3.6. **`data/snow/snowRecords.js`**
  defines the TEN trophy slots keyed to the challenge-spot ids (best keys
  `mma-snow-<id>-best`, placeholder max 375 each) and IMPORTS the farm's
  MEDALS/medalFor so thresholds can never drift. `ui/SnowTrophyGrid.jsx`
  (reuses the `.ftrophy-*` styles; uiStore `snowTrophyOpen`/`setSnowTrophy`;
  stand intercepted in `interaction.js`) shows the ten slots as "coming soon"
  until challenges land. Mills greets arrivals (`snow-welcome` in
  encounters.js + a `snow-welcome-sign` interactable).
- **Stale-check fixes (pre-existing failures surfaced by the full run):** FA2
  still asserted the farm gate was BEHIND the spawn (it moved to the west
  coast 2026-07-22) → now asserts the western haybale gate; FA6's expected
  farm-interactable list was missing `farm-chest` (added 2026-07-22) → added.
- **When building a snow challenge later:** claim a `SNOW_CHALLENGE_SPOTS`
  entry, rename its slot in `snowRecords.js` (+ real max score), write bests
  to `mma-snow-<id>-best`, and follow the farm pattern (pure logic in
  `data/snow/`, store in `game/`, 3D + panel, mode camera in Player.jsx,
  `runXxxChecks()` in systemChecks). NOTE: bilingual `translations.js` has no
  Farsi/Arabic entries for the new snow strings yet (falls back to English).

### The Snowball Range (SR, built 2026-07-28) — BRIDGING TO TEN
The FIRST Snowball Sums challenge, claiming the reserved **"range"** area
(south-east clearing, `[33, 36.5]`). Host is **Pip** at `snow-range-sign`
(pip.glb — island + snow never co-render, same sharing pattern as the farm).
Bridging to ten as a PHYSICAL SPLIT: a ten-frame snowball CRATE on a stand is
already partly packed (e.g. 8); the student holds a handful (e.g. 6) on a sled
and drags/taps a DIVIDER through the row to split it BEFORE the throw — the
first group arcs into the crate's empty sockets (filling it to the ten), the
rest lands on the spare pile. 8 + 6 is SEEN as (8 + 2) + 4. Under-fill leaves
the unfilled sockets glowing green; over-fill bounces snowballs onto a red
glow — the consequence IS the feedback.
- **A set = 15 rounds, 3/stage, 25 pts each (max 375):** S1 make ten
  (6–9 + single) → S2 through the teens (13–18) → S3 any decade (two-digit +
  single, e.g. 38 + 6 → 40 + 4) → S4 TWO-digit handfuls (47 + 15 → 50 + 12;
  the split is still "complement + rest") → S5 the century throw (93–98 + n
  crossing 100). Two-part Weigh-Station pacing: A) SPLIT exactly (+10 — the
  crate fills or it doesn't, direction named on a miss), B) TYPE the total
  (+15; `checkRangeSum` accepts the plain number). SOLUTIONS-FIRST generation:
  ones digit never 0, comp = 10 − ones, rest ≥ 1 — every round genuinely
  bridges; consecutive rounds never repeat a (start, add) pair. All integers,
  no float dust.
- **Files:** pure logic `src/data/snow/snowballRangeChallenge.js`
  (`generateRangeSet` / `gradeRangeSplit` / `checkRangeSum` / `rangeStageFor`);
  store `src/game/snowballRangeStore.js` (zustand; best in localStorage
  `mma-snow-range-best`; LOCAL-ONLY — no cloud completion path for snow yet,
  the farm's `reportFarmCompletion` is farm-specific); 3D
  `src/game/SnowballRangeChallenge.jsx` (upright 5×2 ten-frame crate, packed
  "crates of ten" stack for the tens, sled + divider + full-row drag surface
  (iPad-friendly), staggered arc throw, spare-pile tray, running sentence chip,
  ConfettiBurst); 2D `src/ui/SnowballRangePanel.jsx` (reuses the
  `.farm-challenge-*` / `.weigh-input-row` styles — NO new CSS).
- **Wired:** `snowLayout.js` (`RANGE_AREA`/`RANGE_FRAME_POS`/`RANGE_CRATE_POS`/
  `RANGE_VIEW_SPOT`/`RANGE_SIGN`), `snowColliders.js` (frame + crates + sign),
  `interactables.js` + `encounters.js` (`snow-range-challenge` fallback),
  `interaction.js` (intercept + the mutual-exclusion list now covers snow),
  `farmChallengeActive.js` (suppresses Press-E during snow challenges too),
  `Player.jsx` `rangeMode` (parks at `RANGE_VIEW_SPOT`, front-on camera on the
  crate, camShake on wrong answers), `World.jsx` + `App.jsx` render,
  `snowRecords.js` range slot renamed via new `SLOT_OVERRIDES` (max 375).
- **Checks:** `runSnowballRangeChecks()` — SR1 geometry/wiring (claims the
  range spot, Pip host, view spot clear), SR2 300-set fuzz (always bridges,
  5-stage arc, no repeats), SR3 grading/scoring/trophy lockstep. SN2's
  expected snow-interactable list gained `snow-range-sign`. Full headless run:
  the suite reported **449 before this session** (the documented "453" had
  drifted) and **452 after** (3 new SR checks), **all passing.** NOT yet
  deployed; wants a live `npm run dev` visual pass (crate
  height/camera framing, throw arc feel, divider hit-area on iPad).
  NOTE: bilingual `translations.js` has no Farsi/Arabic entries for the new
  range strings yet (falls back to English).

### The Ice Rink — Glide by Tens (RG, built 2026-07-28) — JUMP STRATEGY
The SECOND Snowball Sums challenge, claiming the reserved **"rink"** area —
the slippery rink itself becomes a giant **0–100 empty number line** etched
into the ice (decade ticks + numeral chips). Host is **Fern** at
`snow-rink-sign`, just outside the southern rink gate (fern.glb — island +
snow never co-render). A penguin waits on the START number and must glide to
EXACTLY the target (a fish bucket): the student PLANS a queue of pushes
(+10/+1, later −10/−1) with big buttons or the arrow keys (↑ +10 · → +1 ·
↓ −10 · ← −1, Backspace undoes), then presses GO and watches the penguin
skate the jumps one beat at a time (`RINK_PUSH_MS`), the running value chip
updating as each push lands. A +10 is a long lean; a +1 a waddling scoot.
- **A set = 15 rounds, 3/stage, 25 pts each (max 375):** S1 jump forward
  (+10/+1 only) → S2 jump back (−10/−1) → S3 OVERSHOOT forward (ones 8–9 —
  gliding an extra ten then stepping back wins; all four pushes unlock) →
  S4 overshoot back → S5 skater's choice (any direction/ones). Scoring:
  LAND exactly = 15; EFFICIENCY bonus (landed only) banded vs the fewest
  possible pushes (`minPushesFor`): exact = 10 🎯, within 2 = 6, else 3 —
  so 37→82 as +10 ×4, +1 ×5 (9 pushes) beats forty-five shoves, and the
  queue is capped (`RINK_MAX_QUEUE` 24) so all-ones is never a plan.
  SOLUTIONS-FIRST: diff ones digit never 0, start never a decade, the whole
  route INCLUDING the overshoot ten stays on 0–100. Reason cards name the
  optimal route ("38: −10 ×4 → …, overshoot, then step back!").
- **Files:** pure logic `src/data/snow/rinkGlideChallenge.js`
  (`generateRinkSet` / `minPushesFor` / `gradeGlide` / `glideStops` /
  `routeText`); store `src/game/rinkGlideStore.js` (zustand; best in
  localStorage `mma-snow-rink-best`; LOCAL-ONLY like the Range); 3D
  `src/game/RinkGlideChallenge.jsx` (etched line + ticks + numerals, start
  flag, fish-bucket target, primitive racing penguin with lean/waddle,
  running value chip, miss/target rings, ConfettiBurst); 2D
  `src/ui/RinkGlidePanel.jsx` (push buttons reuse `.plank-piece-btn`, queue
  chips reuse `.fc-value` — NO new CSS).
- **Wired:** `snowLayout.js` (`RINK_GLIDE_LINE` xMin 5 → xMax 27 at z 4,
  `rinkGlideX()` mapping, `RINK_GLIDE_VIEW_SPOT` [9.5, 8.5] on the ice off
  the sightline, `RINK_GLIDE_SIGN` [12.2, 14.8] off the ice by the gate),
  `snowColliders.js` (sign), `interactables.js` + `encounters.js`
  (`snow-rink-challenge` fallback), `interaction.js` (intercept + mutual
  exclusion), `farmChallengeActive.js`, `Player.jsx` `rinkGlideMode`
  (fence-style side-on camera from the SOUTH framing the whole line,
  distance from live fov/aspect; parks the player, jump/orbit off),
  `World.jsx` + `App.jsx` render, `snowRecords.js` rink `SLOT_OVERRIDES`
  (max 375).
- **Checks:** `runRinkGlideChecks()` — RG1 geometry/wiring (line on the ice,
  exact mapping, Fern off the ice, spot clear), RG2 300-set fuzz (stage
  configs, overshoot genuinely pays + fits the line, exact minPushes, no
  repeat trips), RG3 grading (optimal 25 / wasteful banded / miss 0 /
  illegal pushes rejected) + bands monotone + trophy lockstep. SN2's
  expected list gained `snow-rink-sign`. **452 → 455, all passing.** NOT
  yet deployed; wants a live visual pass (line/tick contrast on the ice,
  penguin glide feel, the two belly-sliding scenery penguins crossing the
  line mid-round — hide them during the challenge if they distract).
  NOTE: no Farsi/Arabic strings yet (falls back to English).

### Christmas Tree Grove — Light the Tree (GV, built 2026-07-28) — COMPENSATION
The THIRD Snowball Sums challenge, claiming the reserved **"pines"** area
(eastern grove). Host is **Alby** at `snow-pines-sign` (alby.glb — island +
snow never co-render). Compensation as the LAZY-SMART grab: a BIG light-up
tree (spiralling fairy lights + glowing star) needs, say, 29 more lights;
lights come in BUNDLES OF TEN (the box shows the coils + a slow pile of
loose singles). Grab the friendly pile (3 bundles = 30), the lot hangs in
one go, the extra light glows RED until it's unclipped and PINGS back into
the box: 47 + 29 = 47 + 30 − 1. Adds ending 1–2 flip the fix (hang the
tens, clip 1–2 more — green pulsing sockets show the gap); exact-tens rounds
need NO fix ("Perfect — done!"), punishing blind always-adjusting.
- **A set = 15 rounds, 3/stage, 25 pts each (max 375):** S1 near-ten singles
  (+8/+9) → S2 nine-ish bundles (ends 8–9, round UP + unclip) → S3 just-past
  bundles (ends 1–2, round DOWN + clip) → S4 choose the direction (mixed) →
  S5 traps (mixed + round 13 FORCED to an exact-tens add every set —
  `GROVE_PERFECT_ROUND_INDEX`). Trading-Post-style three-parter: A) GRAB the
  friendly pile (+10; wrong piles get the tedium named — "9 singles to clip
  one… at… a… time!"), B) PICK the fix from the −2…+2 ladder (+10;
  `GROVE_ADJUSTMENTS`), C) TYPE the total (+5). The 3D chip scaffolds the
  strategy: "47 + 30 = 77" then "77 − 1 = ?". Ones digits only ever
  0/1/2/8/9 so the friendly pile is never a coin flip; totals stay two-digit
  so the spiral never overflows. SOLUTIONS-FIRST, all integers.
- **Files:** pure logic `src/data/snow/groveLightsChallenge.js`
  (`generateGroveSet` / `gradeGroveGrab` / `gradeGroveAdjust` /
  `checkGroveTotal`); store `src/game/groveLightsStore.js` (zustand; best in
  localStorage `mma-snow-pines-best`; LOCAL-ONLY like the other snow
  stores; after a wrong grab the FRIENDLY bundles still hang so the student
  sees the quick way — Part B is always a ±2 fix); 3D
  `src/game/GroveLightsChallenge.jsx` (big tree + spiral `lightPos`, bundle
  box with coils + singles pile, red over-hung pulses, green gap sockets,
  the pinging spare light, ConfettiBurst); 2D `src/ui/GroveLightsPanel.jsx`
  (bundle + fix buttons reuse `.plank-piece-btn`; keys 1–3 / 1–5 — NO new
  CSS).
- **Wired:** `snowLayout.js` (`GROVE_AREA`/`GROVE_TREE_POS` [36, 16.5]/
  `GROVE_BOX_POS`/`GROVE_VIEW_SPOT`/`GROVE_SIGN` [39.5, 23]),
  `snowColliders.js` (tree + box + sign), `interactables.js` +
  `encounters.js` (`snow-pines-challenge` fallback), `interaction.js`
  (intercept + mutual exclusion), `farmChallengeActive.js`, `Player.jsx`
  `groveMode` (front-on camera on the tree), `World.jsx` + `App.jsx`,
  `snowRecords.js` pines `SLOT_OVERRIDES` (max 375).
- **Checks:** `runGroveLightsChecks()` — GV1 geometry/wiring, GV2 300-set
  fuzz (friendly grabs, ±2 fixes, the guaranteed perfect trap, two-digit
  totals), GV3 grading/scoring/trophy lockstep. SN2's expected list gained
  `snow-pines-sign`. **455 → 458, all passing.** NOT yet deployed; wants a
  live visual pass (spiral density vs the light count, ping arc, the grove
  spot label overlapping the big tree — hide it during the challenge if it
  clashes). NOTE: no Farsi/Arabic strings yet (falls back to English).

### Snowman Meadow — Level the Twins (ML, built 2026-07-28) — LEVELLING
The FOURTH Snowball Sums challenge, claiming the reserved **"snowmen"** area
(south-west clearing). Host is **"Frosty"** at `snow-snowmen-sign` — a
PLACEHOLDER `snowmen-host` character with NO glb configured (primitive body
until a teacher model lands; add it to `characterModels.js` like the old
milk/weigh hosts). Levelling turns a sum into a DOUBLE and attacks "the
numbers in a sum are fixed": two snowman TOWERS of stacked snowballs
(columns of ten — place value for free; hat + scarf + live count chips).
The KEY question comes first: "17 and 21 — how many must hop to make level
twins?" (the trap: the whole difference; the truth: HALF, because every hop
helps BOTH). Then the balls hop one beat at a time and the equation chain
grows overhead — **17 + 21 = 18 + 20 = 19 + 19** — every sum visibly equal,
the TOTAL never printed until the student computes the double. Twins earn
matching gold scarves.
- **A set = 15 rounds, 3/stage, 25 pts each (max 375):** S1 little twins
  (doubles to 10) → S2 teen twins (11–15) → S3 LEVEL TO A TEN (26 + 34 →
  30 + 30; means 20/30/40) → S4 big twins (16–35) → S5 "twin or not?" —
  round 13 is ALWAYS an ODD difference (`MEADOW_ODD_ROUND_INDEX`): twins are
  IMPOSSIBLE, "Can't make twins!" is the right call, and the reveal levels
  to near-twins (19 + 20 = double 19 + 1), linking levelling to
  near-doubles + parity. Scoring: A) predict the hop count or the parity
  call (+10, `MEADOW_MOVE_OPTIONS` 1–4 + can't; keys 1–5), B) TYPE the
  total via the double (+15). SOLUTIONS-FIRST (level ± half chosen first),
  counts kept 4–44 so the towers stay renderable.
- **Files:** pure logic `src/data/snow/meadowLevelChallenge.js`
  (`generateMeadowSet` / `gradeMeadowPredict` / `checkMeadowTotal` /
  `meadowCountsAfter` / `meadowChain`); store `src/game/meadowLevelStore.js`
  (zustand; best `mma-snow-snowmen-best`; LOCAL-ONLY); 3D
  `src/game/MeadowLevelChallenge.jsx` (towers in columns of ten, hopping
  ball with arc, growing chain chip, gold twin scarves, ConfettiBurst); 2D
  `src/ui/MeadowLevelPanel.jsx` (reuses `.plank-piece-btn` +
  `.weigh-input-row` — NO new CSS).
- **Wired:** `snowLayout.js` (`MEADOW_AREA`/`MEADOW_TOWER_LEFT` [-33.8,
  33.5]/`MEADOW_TOWER_RIGHT` [-30.2, 33.5]/`MEADOW_VIEW_SPOT`/`MEADOW_SIGN`
  [-28.2, 38.2]), `snowColliders.js` (towers + sign), `interactables.js` +
  `encounters.js` (`snow-snowmen-challenge` fallback), `interaction.js`
  (intercept + mutual exclusion), `farmChallengeActive.js`, `Player.jsx`
  `meadowMode` (front-on camera on the towers), `World.jsx` + `App.jsx`,
  `snowRecords.js` snowmen `SLOT_OVERRIDES` (max 375).
- **Checks:** `runMeadowLevelChecks()` — ML1 geometry/wiring, ML2 300-set
  fuzz (half-the-difference hops, conservation by construction, the odd
  trap at round 13 and ONLY there, chain helpers genuinely level), ML3
  grading (half scores / whole-difference trap labelled / parity calls both
  ways) + scoring + trophy lockstep. SN2's expected list gained
  `snow-snowmen-sign`. **458 → 461, all passing.** NOT yet deployed; wants
  a live visual pass (tower column spacing vs the meadow's scenery snowmen,
  hop arc, chain chip width on long S3 chains). NOTE: no Farsi/Arabic
  strings yet (falls back to English).

### Sledding Slope — The Roped Sleds (SL, built 2026-07-28) — CONSTANT DIFFERENCE + A REAL HILL
The FIFTH Snowball Sums challenge, claiming the reserved **"sled"** area —
and the snow world's FIRST TERRAIN: the NE corner now has a real hill.
`snowLayout.js` `SLOPE` + `snowGroundHeight(x,z)` — a smooth 0→1→0 bump
(smoothstep both axes, crest near [54, −38], peak 2.8 m) that falls back to
ZERO before every zone edge, so the flat world, the boundary bank and every
other challenge area are untouched. `regions.js` snow-sums `groundHeight`
now points at it (SN1's flat-point assertion still holds); walking/jumping
just work (per-frame rise ≪ STEP_UP). `SnowScenery` gained a `SlopeHill`
draped mesh (subdivided plane, vertex heights from the same function,
+3 cm skirt so it never z-fights the flat sheet) and the sled prop / course
flags / spot labels now sit ON the ground via snowGroundHeight. Host is
**"Flake"** at `snow-sled-sign` — placeholder `sled-host`, no glb yet.
- **The mechanic:** two sleds sit on a ZOOMED number window etched down the
  run (unit ticks, bold labelled decades — values increase DOWNHILL), roped
  together — **the rope IS the difference** (a taut gold bar whose length
  visibly never changes). Three parts: A) PREDICT a rope thought-experiment
  (+10): "both sleds slide down 2 — the gap?" vs "ONLY the front sled slips
  down 1 — the gap?" answered bigger/same/smaller (both-movers → same,
  one-movers → it changes — so "same" can't be button-mashed); B) SLIDE the
  pair ±1 (buttons or arrows, both sleds + rope + live pair chip move
  together: 83 − 29 → 84 − 30) until the BACK sled rests on ANY decade,
  confirm with RACE! (+5; wrong resting spots reveal the friendly pair);
  C) TYPE the difference (+10) → the pair TEARS down the hill, rope taut,
  confetti at the runout (`SLED_RACE_MS`).
- **A set = 15 rounds, 3/stage, 25 pts each (max 375):** back sled ends 9
  (slide down 1) → ends 8/1 (choose the direction) → ends 1/2/8/9 both ways
  → bigger numbers (decades to 70, minuends to 97) → traps: round 13's back
  sled is ALREADY on a decade (`SLED_FRIENDLY_ROUND_INDEX`) — zero slides is
  the right move. SOLUTIONS-FIRST (decade − shift), gaps 11–35, slides
  capped (`SLED_MAX_SLIDES` 12, so ±10 alternate decades stay reachable).
- **Files:** pure logic `src/data/snow/sledSlopeChallenge.js`
  (`generateSledSet` / `sledScenarioAnswer` / `gradeSledPredict` /
  `gradeSledSlide` (any decade counts) / `checkSledDiff`); store
  `src/game/sledSlopeStore.js` (best `mma-snow-sled-best`; LOCAL-ONLY); 3D
  `src/game/SledSlopeChallenge.jsx` (slope-following ticks/sleds/rope via
  snowGroundHeight, surface-tilted sleds, race animation); 2D
  `src/ui/SledSlopePanel.jsx` (reuses `.plank-piece-btn` +
  `.weigh-input-row` — NO new CSS).
- **Wired:** snowLayout (`SLOPE`/`snowGroundHeight`/`SLOPE_LANE`/
  `SLOPE_VIEW_SPOT` (on the flat)/`SLOPE_SIGN`), regions.js, SnowScenery
  (SlopeHill + grounded props), snowColliders (sign), interactables +
  encounters (`snow-sled-challenge` fallback), interaction (intercept +
  mutual exclusion), farmChallengeActive, Player.jsx `sledMode` (side-on
  camera framing the run IN PROFILE — the hill's rise is the picture),
  World + App, snowRecords sled `SLOT_OVERRIDES` (max 375).
- **Checks:** `runSledSlopeChecks()` — SL1 the hill (zero everywhere it
  must be, peak at the crest, region wiring, run rises >1.5 m), SL2 300-set
  fuzz (decade shifts, rope scenarios, the friendly trap at 13 and only
  there), SL3 grading/scoring/trophy. SN2's list gained `snow-sled-sign`.
  **461 → 464, all passing.** NOT yet deployed; wants a live visual pass
  (hill shading/seam, sled tilt sign, tick density on wide gaps, footprints
  don't render on the hill — they stamp at y 0 — acceptable or exclude the
  zone from the footprint test). NOTE: no Farsi/Arabic strings yet.

### THE FINAL FIVE (VG/PC/IC/LY/AL, built 2026-07-28) — SNOWBALL SUMS COMPLETE
All TEN snow challenges now exist. The last five land together, ALL with
PLACEHOLDER hosts (no glbs → primitive bodies; add each characterId to
`characterModels.js` when teacher models arrive): **Bloc** (`village-host`),
**Pippin** (`colony-host`), **Glim** (`cave-host`), **Cocoa** (`yard-host`),
**Nova** (`lights-host`). Shared wiring pattern throughout (sign intercepts,
mutual exclusion, farmChallengeActive, snowRecords SLOT_OVERRIDES max 375,
best keys `mma-snow-<id>-best`, LOCAL-ONLY, reused `.farm-challenge-*` /
`.plank-piece-btn` / `.weigh-input-row` CSS — nothing new). Player.jsx adds
ONE shared mode for the five (`lateSnowMode` priority pick + a
`LATE_SNOW_VIEW` framing table — front-on south camera each; the Lookout's
aims HIGH so the sky owns the frame).

- **Igloo Village — JOIN THE IGLOOS (VG, `village`) — split strategy.**
  Ten-blocks + one-blocks on two stands; A) predict the ones OVERFLOW (+5),
  B) type the tens wall AND the RAW ones pile (13, not 3!) (+5+5), C) type
  the total (+10) while blocks fly like-with-like and ten ones SNAP into a
  fresh gold ten-block (the regroup, physical). Round 13's ones make
  EXACTLY ten (`VILLAGE_EXACT_ROUND_INDEX`). Files:
  `villageSplitChallenge.js` / `villageSplitStore.js` /
  `VillageSplitChallenge.jsx` / `VillageSplitPanel.jsx`.
- **Penguin Colony — PAIR THE PENGUINS (PC, `colony`) — doubles +
  near-doubles.** Two rows of cheap 2-mesh penguins pair off (glowing rings
  one beat at a time; the odd one glows gold). A) "which double is hiding?"
  — 4 generated forms, ANY true form scores (+10: 7+8 accepts BOTH double 7
  + 1 and double 8 − 1); B) type the total (+15). Round 13 is a
  DIFF-2 pair (`COLONY_MIDDLE_ROUND_INDEX`): one penguin WADDLES across →
  double the middle (levelling's little sibling). Grows to 24+25…38+39.
  Files: `colonyPairsChallenge.js` / `colonyPairsStore.js` /
  `ColonyPairsChallenge.jsx` / `ColonyPairsPanel.jsx`.
- **The Ice Cave — LIGHT THE CRYSTALS (IC, `cave`) — think-addition.** A
  DARK half-dome cave mouth (`CAVE_DOME`) swallows the back of the clearing;
  a numbered crystal wall spans the round's window. A) count UP or count
  BACK? (+10 — fewer glows wins, never a tie); B) the crystals glow one
  beat at a time (cyan up / amber back, gold landing ring) and the answer
  is read TWO WAYS: how-many-glows (up) vs where-you-land (back) — both
  a − b (+15). Round 13 is a LONG count-back (`CAVE_LONG_ROUND_INDEX`).
  Files: `caveCrystalsChallenge.js` / `caveCrystalsStore.js` /
  `CaveCrystalsChallenge.jsx` / `CaveCrystalsPanel.jsx`.
- **The Lodge Yard — COCOA CHANGE (LY, `lodgeyard`) — friends of 100.** The
  cocoa STALL (striped awning, steaming mug — the trading-post analogue)
  plus a HUNDRED-BEAD board (10×10; price = cocoa-brown beads, change =
  gold): pay with a 100-token and count UP — A) the ones hop to the next
  ten (+10), B) the tens hop to 100 (+5), C) the whole change (+10) — rows
  visibly completing ("friends of 10 make friends of 100"). Round 13 is ON
  a ten (ones hop ZERO), round 14 in the 90s (tens hop ZERO). Files:
  `lodgeYardChallenge.js` / `lodgeYardStore.js` / `LodgeYardChallenge.jsx` /
  `LodgeYardPanel.jsx`.
- **Aurora Lookout — THE STRATEGY PICKER (AL, `lights`) — the capstone.** A
  raised wooden VIEWING DECK (platform + rail + telescope) faces shimmering
  aurora pillars framing the sum written in the sky. A) pick the TOOL from
  all seven (`LOOKOUT_STRATEGIES`: bridge/jump/comp/double/countup/slide/
  friends) — the BRIGHTEST path +10, any SOUND tool +5, unsound 0; B)
  execute against a one-line scaffold in that strategy's language (+15).
  Eight problem ARCHETYPES on a FIXED 15-round schedule
  (`LOOKOUT_SCHEDULE` — every archetype in every set; sound sets never
  contain the brightest). Files: `auroraLookoutChallenge.js` /
  `auroraLookoutStore.js` / `AuroraLookoutChallenge.jsx` /
  `AuroraLookoutPanel.jsx`.
- **Checks:** `runVillageSplitChecks` / `runColonyPairsChecks` /
  `runCaveCrystalsChecks` / `runLodgeYardChecks` / `runAuroraLookoutChecks`
  (a shared `lateSnowWiring` helper; 3 checks each: geometry/wiring,
  300-set fuzz, grading/scoring/trophy lockstep). SN2's expected snow
  interactables now list ALL ELEVEN signs + the stand. **464 → 479, all
  passing.** NOT yet deployed; the five want a live visual pass (block-fly
  timing, penguin row widths vs the wandering scenery penguins, cave dome
  darkness vs the twilight, bead board angle, aurora pillar opacity).
  NOTE: no Farsi/Arabic strings yet (falls back to English).

## DONE (2026-07-28) — THE LODGE INTERIOR (CB): the FIFTH region, behind an ajar door
A large (60×44) LOG-CABIN GREAT ROOM — the warm inside of the Snowball Sums
ski lodge — entered through an AJAR DOOR on the lodge's front. The door
rests slightly open with firelight in the crack and SWINGS WIDE as the
player approaches (both sides — SnowScenery `LodgeDoor` + the cabin's
`AjarDoor`), so stepping through feels like walking INTO the cabin.
DOOR-TO-DOOR travel: portals gained an optional `arrive: [x, z]` (handled
in Player.jsx's portal loop — overrides setRegion's spawn teleport), so you
land just inside/outside the matching doorway, never across the map. The
"cabindoor" portal variant draws NO swirl (World.jsx renders null — the
doors ARE the visuals).
- **Region `cabin` in regions.js** ("The Lodge"): rect bounds, flat plank
  floor, deep warm-brown skyColor (`#241a12` — the open-top dollhouse view
  reads as rafters lost in shadow; NO ceiling so the third-person camera
  works unchanged). FIRELIGHT lighting branch (`isCabin` in World.jsx):
  warm dim key + warm hemisphere; the fire + candles carry the local glow.
- **Layout (single source of truth) `src/data/cabin/cabinLayout.js`:**
  spawn just inside the south door; the stone WOODFIRE on the north wall
  (animated: flickering cone flames + a flickering warm pointLight, ember
  bed, crossed logs, mantel with mugs); hearth rug; a LONG dining table
  with benches; two round side tables with stools; three bookshelves with
  generated book spines; icy twilight WINDOWS on every wall; breathing
  CANDLES; a firewood basket — and a separate BEDROOM in the SE corner
  behind plank interior walls with its own doorway (bed + pillow +
  blanket + headboard, wardrobe, bedside table, rug).
- **Colliders `cabinColliders.js`:** log-wall runs sealed on all four sides
  except the south doorway gap; bedroom walls sealed except their doorway;
  fireplace/tables/shelves/bed/wardrobe solid. `worldColliders.getColliders`
  gained the cabin case.
- **Pip hosts FIRESIDE ADDITION** (`cabin-pip` interactable by the hearth,
  pip.glb — the cabin + island never co-render): a plain curriculum
  mathsChallenge encounter `cabin-addition` → `{ stage: "stage3", topicId:
  "number-facts", skillId: "addSubTo20", questionCount: 5 }` (adaptive
  difficulty; swap the skillId later for harder sets). No interception —
  the default encounter path runs it.
- **Files:** `data/cabin/cabinLayout.js` + `cabinColliders.js`,
  `game/CabinScenery.jsx`; wired through regions.js (both portals +
  `arrive`), Player.jsx (arrive support), World.jsx (isCabin lighting +
  render + cabindoor variant), SnowScenery.jsx (the lodge's flat door
  replaced by the animated `LodgeDoor`), interactables.js + encounters.js.
- **Checks:** `runCabinChecks()` — CB1 region + door-to-door pairing (arrive
  points in-bounds, off the trigger radii — no bounce loops), CB2 walls
  sealed at 0.5 m sampling + doorways walkable + Pip's stage/topic/skill
  verified against the LIVE curriculum registry, CB3 furniture placement
  (fire on the north wall, bed in the bedroom, Pip fireside). **479 → 482,
  all passing.** NOT yet deployed; wants a live visual pass (log-course
  seams, fire flicker rate, door swing feel, window glow, camera inside the
  bedroom). NOTE: no Farsi/Arabic strings yet (falls back to English).

## DONE (2026-07-22) — Teacher-visibility fixes + task navigation compass (session)
Portal→game sign-in, farm cloud completion for ALL signed-in play, local-progress
backfill, and an in-world navigation compass. Built + esbuild-parsed; the compass
routing + angle math are headless-tested (22/22) but NOT yet run through the full
systemChecks, and the compass VISUAL wants a live `npm run dev` look. Deployed
(build → copy `dist` → push website).
- **Load-screen auto sign-in (`ui/CharacterCreator.jsx`):** reads `?code=` (or
  `?student=`) from the URL, pre-fills the code field AND auto-registers on mount
  (`useCloud.registerWithCode`), showing "✓ Signed in as …". The website student
  dashboard "Play" link now carries the code, so a student launched from the portal
  signs into the game with no second login. `handleStart` skips a duplicate sign-in
  if already registered with that code.
- **Farm completions upload for ALL signed-in play (`cloud/farmCompletion.js`):**
  `reportFarmCompletion` no longer requires an active teacher task — it uploads a
  completion for any registered student who finishes a farm set (tagged with the
  task if one matches, else `missionKind:"free"`). New shared `buildFarmRecord`.
- **Local-progress backfill on sign-in (`cloud/farmCompletion.js` +
  `cloud/cloudSession.js`):** new `syncLocalFarmBests()` runs after
  `registerWithCode` → `loadAssignments()` (dynamic import, fire-and-forget). Reads
  each `mma-farm-<id>-best` and uploads any best not yet synced, so farm trophies
  earned locally (before signing in) reach the teacher. De-dup via an
  `mma-farm-synced:<challenge>` high-water marker (also written by
  `reportFarmCompletion`) so nothing uploads twice and only improvements re-sync.
- **Task navigation compass (`data/taskCompass.js` + `ui/TaskCompass.jsx`, wired in
  `ui/HUD.jsx`, styles `.hud-compass` in `styles/index.css`):** a top-centre arrow
  that points the player to their current teacher task — first to the portal for the
  task's region (island-1 is the hub; schoolyard/farm are leaves routed via the
  hub), then to the challenge sign / NPC once in-region, with a live distance +
  "You're here". Multiple tasks follow `assignedAt` order (earliest first) and
  advance as each completes (`isFarmTaskDone` / `completedMissions`).
  `taskCompass.js` is pure: `taskTarget`, `nextWaypoint`, `compassAngle` (from
  Player.jsx's camera basis — 0 = ahead/up, +ve = clockwise), `planRoute`. Reads
  live `playerState.x/z/camYaw` each frame via rAF; hidden when no tasks outstand.
- **TODO:** add `runTaskCompassChecks()` to `systemChecks.js`; live visual pass on
  the compass (placement/size/rotation feel); consider aiming at the activity
  `*_AREA` centre instead of the sign, and an "arrived" pulse.

## DONE (2026-07-22) — Fraction Farm challenges are TEACHER-ASSIGNABLE (cloud completion)
Farm challenges were LOCAL-ONLY (localStorage bests, no cloud). They can now be
set as Adventure tasks from the Teacher Platform, show an in-world objective, and
write a CLOUD completion tagged with the task id so the teacher portal tracks who
finished. **Additive + esbuild/parse-checked only — NOT yet run through the full
headless checks or a `npm run dev` visual pass. Do both before relying on it.**
- **Assignment shape:** an `adventureAssignments` doc with `location:"farm"` +
  `challengeId` (fence/roundup/order/crate/milk/weigh/trade/veggie/plank/shop)
  instead of an NPC+topic. Written by the website `createAdventureTask` /
  `updateAdventureTask` (a farm branch that skips NPC/topic validation). No new
  Firestore rules — it's the same `adventureAssignments` collection.
- **Read path:** `src/cloud/cloudSession.js` `loadAssignments()` now splits farm
  tasks (`location==="farm"`) out of the island/schoolyard set (so they DON'T go
  through `setRuntimeMissions`/the NPC chain), stores them in `farmTasks`, and
  exposes `farmTaskFor(challengeId)`. `farmTasks` cleared in `clearSession` + the
  early-return.
- **Objective:** new pure `src/data/farm/farmTaskObjective.js` (`FARM_TASK_META`
  keyed by challengeId + `farmObjectiveText`). `src/ui/HUD.jsx` reads
  `useCloud(s=>s.farmTasks)` and OVERRIDES the guidance line
  (`guidanceText`) with the farm objective for the first active farm task that
  isn't locally done — "Find Pip to complete the Fence Challenge in Fraction Farm".
  (Farm signs bypass the NPC/teacher dialogue path in `interaction.js`, so the
  objective is surfaced via the HUD, not NPC dialogue.)
- **Completion write:** new `src/cloud/farmCompletion.js`
  `reportFarmCompletion(challengeId, score, rounds)` — no-op unless
  `useCloud.mode==="registered"` AND there's a `farmTaskFor(challengeId)`. Builds a
  `normaliseResult` record (`missionKind:"teacher"`, `taskId`=assignmentId,
  `percentage`=score/`FARM_MAX_SCORES[id]`, `passed:true`) and calls
  `useCloud.saveAttempt` — REUSING the normal achievements + adventureAttempts
  path unchanged (the mapper already emits `taskId`/`adventureTaskId`, so the
  portal matches farm completions like maths tasks). Writes a local marker
  `mma-farm-task-done:<assignmentId>` (via `markFarmTaskDone`; `isFarmTaskDone`
  read by HUD) so the objective clears for that student. "Done" = finishing a set
  (any score), per teacher choice. Each of the 10 stores calls it on ONE line
  right after `writeBest(score)` in the terminal `next()` branch
  (`reportFarmCompletion("<id>", score, <ROUNDS_PER_SET const>)`).
- **Portal side (website repo):** Set Adventure Task's Fraction Farm tab now sets
  these; Manage Tasks renders them (🚜 challenge name + host). Number Island
  character wording changed to Pip = Addition & Subtraction facts / Alby =
  Multiplication facts / Fern = Division facts — **portal display only, no game
  change** (the actual assignable topic/dropdown is unchanged).
- **Checks TODO:** `runCloudChecks` has an assertion that a normal attempt keeps
  `taskId` null — still true (farm path is separate/inert in the headless env), so
  the 444 should still pass, BUT add a dedicated farm-task check
  (finished set + active task ⇒ record carries `taskId`/`adventureTaskId`) and a
  challengeId-lockstep check (the 10 keys match across `FARM_BEST_KEYS`,
  `FARM_MAX_SCORES`, `FARM_TASK_META`, and the portal list).

## DONE (2026-07-22) — EALD bilingual + feedback batch + stuck-key fix
Built, esbuild-parsed (all changed files) and DEPLOYED 2026-07-22 (build → copy
`dist` into `mathstools-main 2/game-platforms/mills-maths-adventure` → push the
website repo). Interpretation notes where a request was open-ended are flagged.

- **Bilingual EALD system (`src/i18n/`)** — offline English + Farsi/Arabic.
  `translations.js` is a dictionary keyed by the EXACT English string (missing
  keys fall back to English, so partial coverage is always safe). `i18n.jsx`
  exports `LANG_ORDER`, `LANG_LABEL` (own name + English in brackets),
  `RTL_LANGS`, `useLang()`, `translate()/t()`, the `<Bi>` block component, and
  `LanguageSelector` (now a `<select>` dropdown, `compact` variant for the ⚙
  menu; blurs on change). `BilingualLayer.jsx` is a global auto-translator: a
  TreeWalker + MutationObserver (childList/subtree/characterData only, rAF-
  debounced) that rewrites matching text nodes in place and marks the parent
  (`data-bi-en`, `dir=rtl`, `lang`); the English original is drawn underneath via
  CSS `[data-bi-en]::after`. It NEVER adds/removes nodes and skips
  INPUT/TEXTAREA/SELECT/CODE/.bi. Rendered in both App return paths.
- **Language = dropdown** (feedback #1). `LANG_LABEL` = `English` /
  `فارسی (Farsi)` / `العربية (Arabic)`. HUD ⚙ row is now a static `.cog-item`
  holding `<LanguageSelector compact />`.
- **Load-screen sign-in** (feedback #2). `CharacterCreator.handleStart` is async:
  if a student code is present and cloud is enabled it `await`s
  `useCloud.registerWithCode(code)` BEFORE `startGame()`. Shows "Signing in…"
  (disabled button); a bad/inactive code sets `signInError` and holds on the
  screen; a connection failure falls through so local play is never blocked.
- **Farm Mills dialogue** (feedback #3, `encounters.js` `farm-welcome`) — collect
  all TEN fraction-challenge trophies; 🥇 100% / 🥈 75% / 🥉 50% (thresholds
  verified against `data/farm/farmRecords.js` MEDALS).
- **Island Mills dialogue** (feedback #4, `encounters.js` `dialogue-sage`) — now
  names Pip/Fern/Alby, the 80% gate, the yellow haybale portal left of Integer
  Dunes, and the 10 farm trophies.
- **Locked playground gate + farm portal move + yellow swirl** (feedback #5).
  `regions.js`: `island-to-schoolyard` gains `lock: "playground"`;
  `island-to-farm` moved to `[-32,16]`, `rotationY: Math.atan2(32,-16)` (faces map
  centre). `resultUtils.js`: `PLAYGROUND_PASS_MARK=80`,
  `PLAYGROUND_REQUIRED_TOPICS=["integers","fdp","algebra"]`, `isPlaygroundUnlocked`
  (uses `summariseByTopic().bestScore`). `Player.jsx` blocks travel through a
  locked portal and sets `playerState.blockedHint`. `World.jsx` subscribes to
  results and passes `locked` to `<Portal>`. `Portal.jsx` renders a wooden gate +
  brass padlock when `locked`, and `PortalSwirl` now takes a `palette` — the
  haybale gate passes `HAY_SWIRL` (gold). NOTE: kept the farm gate as the HAYBALE
  variant (rectangular hay pillars + circular swirl) rather than a plain wooden
  gate — flagged to Jeff as an assumption.
- **Farm treasure chest** (feedback #6). `interactables.js`: `FARM_CHEST_SPOTS`
  (4 open spots) → random `FARM_CHEST_POS`; a `farm-chest` interactable
  (`regionId: "farm-parts-whole"`). `interaction.js`: `FARM_CHEST_COINS=15` +
  `farmChestOpened` flag, mirroring the island `chest`. `farm-treasure` fallback
  dialogue added.
- **Stuck-key fix** (`game/useKeyboard.js`) — `isTyping` now also matches
  `<select>`; added `clearAll()` bound to `window blur` + `visibilitychange`
  (tab hidden). Root cause: a focused native `<select>` popup swallowed the
  `keyup`, so a movement key stayed pressed. `LanguageSelector` also blurs itself
  on change.

## DONE (2026-07-19) — Trade v2 + Weigh v3 + jumpable fences
Teacher feedback batch — **all three parts implemented, babel-parsed AND run
through the full headless system checks (now **435**, all passing).** NOT yet
deployed (build → copy `dist/.` → push website); the Milk Splitter, Weigh
Station, Trading Post + truck from the prior batch are also still awaiting that
same deploy. The new 3D/camera geometry is logic- + parse-checked only and still
wants a live visual pass in `npm run dev`.

- **Trading Post v2:** the trading strip shows ONLY "🏪 Round x/15 · xx pts";
  the SELLER's stall keeper WALKS out to the trading table and speaks a bubble
  ("I sell {item} for {sourceDisplay}. Pay the other two stalls in THEIR
  language!"); only the two buyer stalls show tags. Steeper/closer `tradeMode`
  camera; CSS `.trade-bubble`, bigger `.trade-tag`/`.trade-stall-name`.
- **Weigh Station v3** (`WeighStationChallenge.jsx` + `Player.jsx`): the analogue
  `Scale` is wrapped in `<group position={[-4.4,0,0.4]} rotation={[0,0.5,0]}>`
  (moved LEFT + angled toward the camera) so it stops hiding the beam. The
  number-line beam is bigger/lower/closer: `BEAM_W 4.4→6.2`, new `BEAM_POS =
  [0.8,2.7,1.5]` const drives the group position, and `setFromPoint` now
  subtracts `WEIGH_AREA.x + BEAM_POS[0]` so the drag frac stays correct. Enlarged
  beam bar, ticks, estimate marker, true-pointer + drag plane; end labels are now
  `.fc-count-chip` at `±(BEAM_W/2+0.75)` (distanceFactor 9.5). `weighMode`
  camera in `Player.jsx` retargeted at the new beam (pos/look x −0.6, look y 2.0,
  look z +0.6).
- **Jumpable fences:** every `fenceRunColliders()` circle is tagged
  `jumpable: true` (paddocks + Round-Up pen); the challenge fence now has a solid
  but jumpable run (`farm-challenge-fence-*` along `CHALLENGE_FENCE`, was
  deliberately collider-free). In `Player.jsx`, colliders with `jumpable` are
  dropped from `resolveCircle` while airborne (`pos.y > 0.9`) so Space vaults
  paddock/challenge fences. The property BOUNDARY fence stays NON-jumpable:
  `BoundaryFence` in `FarmScenery.jsx` is now a tall WHITE-PICKET style (2.1 m
  pickets, pointed pyramid caps, `#f4f4ef`) and a new `boundaryColliders()` adds
  solid non-jumpable circles along ±58/±46 (`farm-border-*`) — you can't hop out.
  `systemChecks.js` FA4 corridor check now skips `c.jumpable` colliders.

### Follow-up batch 2 (2026-07-19) — Trade balance/walk · Weigh number-line · character select
A second teacher-feedback pass, all implemented + run through the full checks
(434 → **435**; new FH5). Same deploy status (build → copy `dist/.` → push).
- **Trading Post — balanced sellers + walk fix:** the seller now walks to the
  front of its OWN stall (`outPos=[0,1.7]` in `TradingPostChallenge.jsx`),
  never in front of the neighbours, so the speech bubble stops overlapping other
  stalls. Sellers are now BALANCED — exactly 5 fraction / 5 decimal / 5 percent
  per 15-round set, shuffled with no seller three times in a row
  (`balancedSellers()` in `tradingPostChallenge.js`; `generateTradeRound` gained
  a `forcedSource`). Bulk deals are DECOUPLED from fraction (they can be sold in
  any notation now; the improper fraction still shows in the chain + as the
  fraction buyer's tag) so the 5/5/5 split is exact. Bulk speech/prompt reworded
  (no more "N crates"). FH3 relaxed (dropped the bulk⇒fraction assertion), new
  **FH5** asserts 5/5/5 + no-triple over 200 sets.
- **Weigh Station number line:** CENTRED on screen (`BEAM_POS=[0,2.5,1.9]`;
  `weighMode` camera in `Player.jsx` looks straight at it and is pulled CLOSER),
  bigger (`BEAM_W 7.4`), and the interval now extends a little BEYOND the two
  round values (candidates map across the inner `BEAM_INNER` 82%). Bigger orange
  drag pin; a bold INDIGO bar (`#3d3f8f`) + white ticks so it POPS off the
  grass/fence (was wood-brown, blended in). The clashing tree moved
  (`FARM_TREES [52,-40] → [56,-44]`). The scale slid further left
  (`[-5.6,0,0.4]`). CONFETTI now bursts on a correct typed rounding (the
  wrong-answer camera shake already existed).
- **Selectable player characters (W7-B):** Cool Cat (`main2.glb`) + DJ Goat
  (`main3.glb`) added to `public/models/characters/`. The welcome screen
  (`CharacterCreator.jsx`) has a 3-way toggle (Explorer / Cool Cat / DJ Goat)
  with a live idling preview that swaps as you toggle; the choice persists in
  `profile.character` (`storage.js`) and `PlayerCharacter.jsx` renders the chosen
  model (preloads all three). Both new models carry 4 correctly-named clips
  (`Idle_3` / `Walking` / `Running` / `Jump_Over_Obstacle_2` → idle/walk/run/
  jump); `characterModels.js` gains `player-cat`/`player-goat` + a
  `PLAYER_CHARACTERS` list + `playerModelKey()`. main1 keeps its remapped clips.
  ⚙ menu label → "Edit character"; `.char-picker` styles appended to index.css.

### Follow-up batch 3 (2026-07-19) — trophy stand relocate/enlarge · farmer stall keepers
Third teacher-feedback pass (still 435 checks, all passing; same deploy status).
- **Trophy stand moved + enlarged:** `FARM_RECORDS_STAND` moved from the
  crossroads `[9,7.5]` to the SOUTH-WEST corner of the sheep paddock
  (`[20,32]`, rotationY -0.8). The WHOLE `TrophyShelf` assembly (stand model +
  the dynamic cups) is now scaled up by `TROPHY_STAND_GROUP_SCALE = 2.6` in
  `FarmScenery.jsx` so it reads as a landmark (cups stay on the shelf because
  the outer group scales uniformly). The `farm-records` collider grew to r2.0
  (`farmColliders.js` + `interactables.js`; interactionRadius 3.8 → 5.0).
- **Farmer stall keepers (Trading Post):** the primitive box-and-sphere keepers
  are replaced by the teacher's rigged **farmer.glb** (`public/models/
  characters/`; clips Idle_3 / Walking / Running → idle/walk/run). Three render
  at once, so each stall CLONES the scene (`SkeletonUtils.clone` from
  three-stdlib) to animate independently. The keeper plays the WALK clip while
  moving out from behind the counter / back, and idles otherwise
  (`movingRef`-driven crossfade in a new `RiggedFarmer`; primitive keeper is the
  Suspense/error fallback). `characterModels.js` gained a `farmer` entry
  (modelScale 1.35, rotationY 0 — flip to Math.PI if it faces away on a live
  look). The speech bubble is offset OFF TO THE SIDE (`[1.6,2.7,0.2]`) so the
  farmer stands beside it, never hidden behind it.
- **Farmer follow-ups (2026-07-19):** the keepers are DOUBLE height now
  (`farmer` modelScale 1.35 → 2.7) and WALK AROUND their counter instead of
  through it (a stall-local waypoint path: out to the side → forward → in to the
  front, reversed on the way back; they face the walk direction, rest facing the
  camera). The three placeholder QUIZ HOSTS (`milk-host` / `weigh-host` /
  `trade-host`) now use farmer.glb too (NPC size, modelScale 1.6) — new configs
  in `characterModels.js`; since several farmer NPCs render at once,
  `CharacterModel.jsx` now CLONES the scene per instance (`SkeletonUtils.clone`)
  so they animate independently. Still 435 checks.
- **Peck fix (2026-07-19):** `bird.glb` was never added, so the Crate Packing
  host (`crate-bird`, "Peck the Bird") fell back to a primitive. Repointed it to
  farmer.glb (NPC size) and renamed it **"Farmer Peck"** (`interactables.js`;
  speaker "Peck" kept). NOTE: `fence-bird` (the Fence Challenge marker) still
  references the missing bird.glb and shows a primitive until a bird model is
  added — left as-is since it's a sliding fence marker, not a host.
- **Host characters (2026-07-19):** three teacher-supplied generic NPCs replace
  the farm quiz hosts — **Trevor** (`trevor.glb`) = Veggie Plot, **Steve**
  (`steve.glb`) = Trading Post, **Robot** (`robot.glb`) = Crate Packing (were
  Farmer Vera / The Trader / Farmer Peck). New `trevor`/`steve`/`robot` configs
  in `characterModels.js` (NPC rigs: Walking/Running + Talk/Wave, no true idle,
  so CharacterModel rests on the wave/talk pose and talks when the player is
  near); interactables + encounter speakers renamed. Milk Splitter + Weigh
  Station hosts + the Trading Post stall keepers stay farmer.glb.

### The Veggie Plot (F11, built 2026-07-19) — MULTIPLYING FRACTIONS
The 8th farm challenge, in the MIDDLE of the sheep paddock — which is RENAMED
"Veggie Plot" (its `FARM_PADDOCKS` label). Multiply two fractions as an AREA
model grown in soil: a unit-square garden bed with a grid; the student DRAGS the
width edge to wn/wd and the length edge to ln/ld (or nudges with the arrow
keys), the overlap shades, and the harvest reveals the product (2/3 × 3/4 =
6/12). Two-part like the Weigh Station (place 10 + type 15 = 25); the typed
answer accepts the product OR its reduced form. Companion mechanic: FERTILISER
POTIONS (stages 4–5) multiply a plant's height by a factor (×3/5, ×1/4, ×3/2 …)
— the student predicts GROW or SHRINK first (a correct call = 25), then the
plant scales, physically attacking "multiplying always makes bigger" (a factor
below 1 SHRINKS it). 15 rounds, 3/stage; max 375.
- **New files:** `data/farm/veggiePlotChallenge.js` (pure logic + generation +
  grading), `game/veggiePlotStore.js`, `game/VeggiePlotChallenge.jsx` (bed grid,
  draggable edges, shaded overlap, potion + growing plant),
  `ui/VeggiePlotPanel.jsx`.
- **Wired:** `farmLayout` (`VEGGIE_AREA`/`VEGGIE_BED`/`VEGGIE_VIEW_SPOT`/
  `VEGGIE_SIGN` + the paddock rename), `farmColliders` (bed + sign), host
  "Farmer Vera" (`farm-veggie-sign` → farmer.glb `veggie-host`) in
  `interactables` + `encounters` + `interaction.js` (start + mutual-exclusion),
  `Player.jsx` `veggieMode` camera + park, `World.jsx` + `App.jsx` render, an
  8th trophy cup in `FarmScenery`/`farmRecords`, `farmChallengeActive`.
- **Checks:** `runVeggiePlotChecks()` (FV1 geometry/rename, FV2 300-set fuzz,
  FV3 helpers + scoring) → **435 → 438**, all passing. FA6 interactable list +
  count updated. Parse-checked + full headless run. NOT yet deployed. Needs a
  live visual pass (bed camera angle, drag feel, potion scale).
- **v2 (2026-07-19, teacher feedback):** the two partition LINES are now
  dragged/tapped via ONE full-bed pointer surface (press picks the nearer line,
  drag or tap moves it — works on iPad/iPhone). The product is NEVER shown until
  answered (the 3D chip only appends "= p" on celebrate/feedback; the "how many
  of N plots?" giveaway is gone). The typed answer now uses the MathLive
  equation editor (`MathAnswerInput`, fraction entry) after the "a/b × c/d ="
  sentence; `parseFractionInput` tolerates its "(1)/(8)" plain output. The
  "Veggie Plot" paddock LABEL is hidden while the challenge runs (was sitting
  behind the bed chips). New `.veggie-harvest-row`/`.veggie-sentence`/
  `.veggie-math` CSS.
- **v3 (2026-07-19, teacher feedback):** the answer input moved to a compact
  BOTTOM bar (`.veggie-answer-bar`) with a small stacked-fraction input (num/den,
  "/" jumps to the denominator) — no MathLive editor, no product shown — so the
  array stays visible for counting. Split changed to **11 AREA + 4 POTION**
  rounds (`VEGGIE_AREA_ROUNDS`=11; potions guarantee ≥1 shrink; FV2 now asserts
  the 11/4 split). The 3D sentence chip hides while typing. "/" no longer toggles
  first-person view during any farm challenge (HUD guards on
  `useFarmChallengeActive` + math-field), and the player model is hidden in FPV
  (Player.jsx `visible={!fpv}`) so the camera never sits inside it. The tree at
  `[24,14]` (inside the paddock) moved to `[56,16]`; the potion plant/bottle are
  centred on the bed. Still 438 checks.

### Plank the Gap (F12, built 2026-07-20) — ADDING & SUBTRACTING FRACTIONS
The fourth farm build-challenge, in the MIDDLE of the **cow paddock**
(`PLANK_AREA {x:-36, z:2}`, centred on the `cow-paddock` FARM_PADDOCK). Host is
**Woody** at `farm-plank-sign` using `farmer.glb` (the `plank-host` character). A
hole in the fence is some width; the student lays planks to fill it EXACTLY.

- **Pedagogy — common denominator = a shared grid.** Every plank is a whole
  number of TWELFTHS (½=6/12, ⅓=4/12, ¼=3/12, ⅙=2/12, 1/12), so they all snap
  onto the same faint twelfths grid; "finding a common denominator" is literally
  seeing which grid the pieces share. All maths is integer twelfths — no float
  dust ever reaches a display or a grade.
- **Design note — ⅛ dropped on purpose.** The brief's ⅛ can't sit on a twelfths
  grid (⅛ = 1.5/12), so the pile uses ⅙ + 1/12 instead, keeping every plank
  grid-exact.
- **A set = 15 rounds, 25 pts each (max 375).** 9 ADDITION rounds (fill an empty
  gap; stages ≤1 whole → mixed denominators → more than 1 whole) then 6
  SUBTRACTION rounds ("the trough is 3 m; you've laid 1¾ — fill the rest";
  remainder = total − used). Subtraction prompts never state the remainder (that
  is the answer). Exact fill = correct; over/under → camera shake + reason.
- **Files:** `data/farm/plankGapChallenge.js` (pure logic: `generatePlankSet` /
  `gradePlank` / `twDisplay` / `PLANK_PIECES`), `game/plankGapStore.js` (zustand),
  `game/PlankGapChallenge.jsx` (3D gap + laid planks + confetti),
  `ui/PlankGapPanel.jsx` (2D piece buttons; `.plank-pieces` / `.plank-piece-btn`
  in index.css). Player.jsx has `plankMode` (parks at `PLANK_VIEW_SPOT`, camera on
  the gap); wired through farmLayout / farmColliders / interactables / encounters /
  interaction / farmChallengeActive / farmRecords / World / App.
- **Cows:** 5 black-and-white (Holstein) cows wander the cow paddock
  (`FarmScenery` `WanderingCows`, bounds `COW_WANDER` in farmLayout).
- **Checks:** `runPlankGapChecks` (FP1 geometry, FP2 round fuzz over 400 sets:
  gap shapes + exact grade + 9/6 add-sub split, FP3 pieces + twDisplay + scoring).
  Total now **441** (all pass).

### The Farm Shop (F13, built 2026-07-21) — PERCENTAGES CAPSTONE
The percentages capstone, a market stall JUST IN FRONT of the windmill
(`SHOP_AREA {x:-13, z:-28}`; the windmill sits at z:-36). Host is **Sunny** at
`farm-shop-sign` (`farmer.glb`, the `shop-host` character). Run the stall for a
market day: every decision is a percentage calculation with a visible price.

- **Skills covered:** set a **% markup** on cost, apply a rainy-day **%
  discount**, add **10% GST** at the till (Australia), read the **profit/loss as
  a % of cost**, and **unitary restocks** ("these 12 melons are 30% of the crop
  — how many total?") plus quick "what % is X of Y?" stocktakes.
- **Hybrid rounds, typed answers.** 15 rounds/set, 25 pts each (max 375). Two
  "% of another" warm-ups, a standalone markup + discount, a full 4-step tycoon
  CHAIN (markup → discount → GST → profit%), two unitary restocks, a second full
  chain, and a final restock. Consecutive chain rounds share the product and
  carry the correct running price forward. The student TYPES each answer (a $, a
  % or a count) into a numeric field and rings it up. At least one chain per set
  is a LOSS so the profit/loss report always appears.
- **No float dust.** All money is INTEGER CENTS; chains are DERIVED from curated
  (cost, markup, discount) combos and the checks assert every markup / discount /
  GST / profit value lands on exact cents. Profit% can be negative (a loss).
- **Files:** `data/farm/farmShopChallenge.js` (logic: `generateShopSet` /
  `gradeShop` / `buildChain` / `fmtMoney` / `parseShopInput`),
  `game/farmShopStore.js` (zustand), `game/FarmShopChallenge.jsx` (3D stall:
  striped awning, produce crate, chalkboard ledger), `ui/FarmShopPanel.jsx` (2D
  typed field; `.shop-*` styles in index.css). Player.jsx has `shopMode` (parks
  at `SHOP_VIEW_SPOT`, front-on camera on the stall); wired through farmLayout /
  farmColliders / interactables / encounters / interaction / farmChallengeActive
  / farmRecords / World / App.
- **Checks:** `runFarmShopChecks` (FS1 geometry — in front of the windmill, spot
  clear; FS2 round fuzz over 400 sets — composition + loss chain + exact grade +
  no NaN; FS3 chain cents + helpers + scoring). Total now **444** (all pass).

### Farm Trophies + scenery polish (2026-07-21)
- **Trophy stand** moved onto the NORTH boundary fence between the return portal
  [0,44.5] and Alby the Owl (Order the Parts host, [26,41]) — now
  `FARM_RECORDS_STAND = {position:[13,43], rotationY:Math.PI}`. The dynamic cups
  were lowered onto the shelf (`CUP_Y` 1.0→0.5, `CUP_Z`→0.2 in FarmScenery — a
  glb-relative offset, nudge on a live look) and a 10th cup (🛒 Farm Shop) added.
- **Trophy grid modal** replaces the old dialogue: the stand now opens
  `ui/FarmTrophyGrid.jsx` (uiStore `farmTrophyOpen` / `setFarmTrophy`, wired in
  interaction.js). A 3-column grid of all ten challenges (medal + name), each
  tile clickable → an achievement detail (skill, best/max, %, blurb). Data from
  `farmTrophyRows()` / `FARM_TROPHY_META` in data/farm/farmRecords.js; styles
  `.ftrophy-*` in index.css.
- **Paddock grass** (`game/FarmGrass.jsx`) — a carpet of blades scattered inside
  the cow/veggie/pig paddocks that bend away from the player (same shader as
  Number Island's WindGrass), High graphics only, clear of the fences + the
  Veggie bed / Plank gap.
- **Path footprints** — `game/Footprints.jsx` gained an optional `test(x,z)`
  predicate (+ life/stride/size); World renders one over the dirt lanes + barn
  yard via `isOnFarmPath()` (farmLayout), so walking the paths leaves fading
  prints like the snow. System checks still 444/444.

### Trophy stand v3 + HUD trim (2026-07-21)
- **Trophies now sit IN the cabinet's ten pigeonholes** (2 rows × 5), one per
  challenge, top row Fence→Milk and bottom row Weigh→Shop. Placement is
  SELF-CALIBRATING: `TrophyStandModel` measures the glb's world bounding box
  (`THREE.Box3`), `TrophyShelf` converts it to the stand's local frame and lays
  the grid from FRACTIONS that were read directly off the decoded trophy.glb
  mesh (vertex-density peaks = shelf surfaces): `PH_ROW_LOWER = 0.12` (plinth
  top), `PH_ROW_UPPER = 0.32` (divider top), top ledge ≈ 0.50; cups sized
  `PH_CUP = 0.22` (~0.10 of height) so they fit each ~0.14-tall cubby.
  NOTE: trophy.glb is Draco + EXT_texture_webp compressed and is a SINGLE mesh
  ("Mesh_0", native bbox X≈±0.9, Y 0→1.5, Z≈±0.29) — no named shelf nodes, so
  those fractions came from decoding the vertices, not from the scene graph.
- **Stand doubled** — `TROPHY_STAND_GROUP_SCALE = 5.2` (was 2.6); because the
  cups are anchored to the measured box they scale with it and stay seated. The
  `farm-records` collider was bumped to radius 3.6 to match.
- **Grand trophy** — a large gold cup + star (`GrandTrophy`) appears ON TOP of
  the stand (`GRAND_Y = 0.50`, the top ledge) only when EVERY challenge is gold
  (`allGold` in TrophyShelf). Reward for a perfect farm.
- **HUD trimmed** (ui/HUD.jsx): removed the **Reset**, **Hub** and **Trophies**
  buttons, and the **⚙ Dev** launcher (dropped `<DevPanel/>` from App.jsx). Kept
  Quests, Results, Help, cloud sign-in and the ⚙ options cog. Students now view
  medals by visiting the trophy stand (the FarmTrophyGrid modal), not a HUD
  button. There is no longer any in-game "reset progress" control. (For
  reference: Reset only ever cleared LOCAL localStorage — it never touched the
  teacher-portal/Firebase records, which are create-only per the firestore
  rules.)

## What this is
Mills Maths Adventure — a 3D low-poly maths game: **Vite + React + React Three
Fiber + Zustand + MathLive**. Built and copied into the website; not uploaded as
source.

## Build & deploy
- Dev: `npm run dev` (port 5173; the Dev panel shows only here).
- Build: `npm run build` → `dist/`. `vite.config.js` sets `base:"./"` so it works
  in a subfolder.
- Deploy the game: copy `dist/.` into
  `…/mathstools-main 2/game-platforms/mills-maths-adventure/`, then push the
  website repo (Netlify auto-deploys).
- Deploy the Cloud Functions: `firebase deploy --only functions --project mills-maths-tools`.

## Layout
- `src/` — the game. Curriculum/adapters/diagram systems are isolated; only
  adapters import legacy banks. Defaults: **Camera Lock ON, Quest HUD OFF**.
- `functions/index.js` — Cloud Functions (CommonJS, firebase-admin):
  `exchangeStudentCode`, `exchangeTeacherCode`, `createStudentForTeacher`,
  `setStudentAvatar` (student-authed; saves the player avatar to the caller's own
  `students/{code}` doc — see Player avatar below), and the teacher-task functions
  `createAdventureTask`, `updateAdventureTask`, `setAdventureTaskActive` (see
  Teacher-set tasks below).
- `portal/` — a DEV copy of the platform used only by the automated checks; the
  **deployed** portal is in the website repo, not here.
- `firestore.golive.claims.rules` / `firestore.phase3d.claims.rules` — rules
  drafts (live rules are deployed manually via the Firebase Console).
- `docs/` — phase notes/history.

## Schoolyard default topics (Phase 3J, built 2026-07-06, LIVE 2026-07-08)
The nine schoolyard staff no longer pose fixed Stage 3 number-facts warm-ups —
each defaults to a RANDOM Stage 4 topic. `src/data/schoolyard/schoolyardTopics.js`
holds the live assignment map + `rollSchoolyardTopic(npcId)` (keeps the nine
DISTINCT). `interaction.js` rolls a fresh topic + calls
`setSchoolyardMissionTopic` (missions.js) on each FRESH encounter, but ONLY when
`!completedMissions.includes(warmup-{id})` — so once a warm-up is done the NPC
stays in its "well done / key unlocked" state and a topic only reassigns next
reload. Same `warmup-{id}` missionId + rewards are reused, so keys/unlocks/
completion/boss-gating are untouched; the boss now also gets a random topic (still
awards the trophy). L1–5 adaptive. Teacher tasks still override (handled upstream
in interaction.js). Guarded by `runSchoolyardTopicChecks()`. Island NPCs (Pip/
Fern/Alby) unchanged.

## System checks (566)
`src/dev/systemChecks.js` → `runSystemChecks()`. Run headlessly: temporarily set
`package.json` `"type":"module"`, shim `localStorage/window/document`, import and
run; also babel parse-check `src/`, `portal/`, `functions/`. Restore package.json
after (`grep -c '"type"'` should return 0). No npm install; esbuild won't run here.

## Cloud / security
Completed attempts write a compact `achievements` record + a rich
`adventureAttempts` record (NO typed answers); demo/skip stays local. Sign-in is
via the secure code exchange (custom tokens). Never store typed answers; keep the
secure model. Firebase project `mills-maths-tools`, region us-central1. (The
Adventure is on `mills-maths-tools` — the `mmt-firebase-games` note in the website
brief is for the OTHER arcade games, not this one.)

## Teacher-set tasks (Phases 1–2, built 2026-07-01)
Teachers assign Adventure tasks from the Teacher Platform; students get them
roster-pushed by class. End-to-end and passing the full checks.
- **Collection `adventureAssignments`** (mission shape + `npcId`, `className`,
  `teacherCode`, `dueAt`, `active`). Written ONLY by the functions above; rules
  let a teacher read their class's tasks and a student read active tasks matching
  their `teacherCode`+`className` claims (block added to
  `firestore.phase3d.claims.rules` AND `src/cloud/firestoreRulesDraft.js`).
- **Game read path:** `src/cloud/cloudSession.js` `loadAssignments()` (after
  sign-in) → `firebaseClient.readClassAssignments` → registers each as a RUNTIME
  mission (`missions.js` `setRuntimeMissions`/`getMission`) and overlays it on its
  NPC via `npcQuestChains.js` `setRuntimeAssignments`/`getChain` (teacher steps
  PREPENDED so they surface even when the static chain is complete). Off-theme
  pairings get a generic intro in `mainQuest.js` `npcDialogue`; multiple tasks
  show "task N of M". Cleared on sign-out.
- **Completion tagging:** teacher-task attempts carry `taskId` (== assignmentId;
  `missionId` also == assignmentId) via `MathsEncounter.jsx` + `resultTypes.js` →
  mapper writes `taskId`/`adventureTaskId`, so the portal matches completion.
- **Teacher UI lives in the WEBSITE repo** (`portal/teacher/` + shared client +
  `adventureManifest.js`), not here. Full design: `docs/teacher-adventure-tasks-plan.md`.

## Player avatar (W3, built 2026-07-02)
Enriched customisable "shape" avatar for the player — outfit/skin/hair colour +
hair style/hat/glasses — with a live spinning 3D preview in the creator.
- **Options + renderer:** `src/game/characters/avatarOptions.js` (palettes +
  `DEFAULT_AVATAR`/`normaliseAvatar`) and `PlayerAvatar.jsx` (parametric primitive
  avatar). `Player.jsx` renders it in the fallback branch (used unless a
  `player.glb` is configured); `CharacterCreator.jsx` is the editor.
- **Persistence:** stored in the progress `profile` (`storage.js`) with a
  `created` flag, so the creator is NOT forced every launch (`App.jsx` skips it
  once on mount when `profile.created`). Re-open any time via the ⚙ HUD menu →
  "Edit character" (`sessionStore.openCreator()` — keeps all progress/position).
- **Cloud save (W3-B):** when signed in, the avatar is saved to the student's own
  `students/{code}` doc via the student-authed `setStudentAvatar` function
  (Admin-SDK write, so NO Firestore-rules change needed) and returned by
  `exchangeStudentCode`; `cloudSession.registerWithCode` applies it on sign-in
  (`applyCloudAvatar`) so the character follows the student across devices.
  Wiring: `firebaseClient.setStudentAvatar` → `cloudSession.saveAvatar`, called
  from the creator's Save when registered. Fire-and-forget; never blocks play.

## Touch controls (W4, built 2026-07-02)
Phone/tablet support ADDED ALONGSIDE keyboard (both always active). Auto-detected
via `pointer:coarse`, override in the ⚙ menu ("Touch controls"). `uiStore.touchMode`.
- **Tap-to-move (W4-B):** an invisible `GroundTapCatcher` plane (`TapToMove.jsx`,
  rendered only in touchMode) sets `playerState.moveTarget`; `Player.jsx` steers
  there each frame reusing the normal collision/bounds/step-up/ground code (with a
  stuck-abandon valve). Keyboard input cancels the target (`clearMoveTarget`). A
  pulsing `DestinationMarker` shows where you tapped.
- **Tap-to-interact (W4-C):** tapping a character (`Interactable.jsx`
  `onPointerDown`) walks to the edge of its interaction radius and sets the
  reactive `sessionStore.approachId`; on arrival `InteractConfirm.jsx` shows
  "Interact with X? [Interact]/[Cancel]". BOTH the tap-confirm and the desktop "E"
  key call the shared `triggerInteraction()` (`src/game/interaction.js`, extracted
  from App.jsx). "Press E" prompt is hidden in touchMode.
- **On-screen keypad (W4-D):** `TouchKeypad.jsx` for the `simple` numeric mode
  (SimpleAnswerInput goes readOnly + inputMode="none" in touchMode so the OS
  keyboard never pops); math questions use MathLive's own virtual keyboard
  (`mathVirtualKeyboardPolicy="onfocus"` on touch). Button modes need no keyboard.
- **On-screen buttons (W4-E):** `TouchControls.jsx` — camera rotate + Jump, writing
  to the shared `touchInput` object which `Player.jsx` OR-combines with the keyboard.
- Checks: `runTouchChecks()` (store wiring). Rendering/gestures verified live on a
  device (can't be headless). Note the viewport meta + `touch-action:none`/
  `overscroll-behavior:none` in index.html / index.css.

## Soft-cartoon graphics (W5, built 2026-07-03)
A "Zelda-lite" look gated behind a ⚙ **Graphics** toggle (`uiStore.graphicsQuality`
"high"|"low"; auto-low on touch). Low = fast default render; High = the full stack.
- **Lighting (W5-A):** warm key light + a cool rim/back light + a procedural
  drei `<Environment>` (Lightformers, no HDR download) for soft IBL — all in
  `World.jsx`. ACES exposure ≈ 1.0, dpr capped at 2 (`App.jsx` Canvas).
- **Post (W5-B/D):** `Effects.jsx` (`@react-three/postprocessing`, High only) —
  N8AO + subtle Bloom (emissive lava/portal glow) + a gentle HueSaturation/
  BrightnessContrast colour grade + SMAA + vignette. **This dep must be `npm
  install`ed** before building.
- **Outlines (W5-C):** `characters/outline.js` inverted-hull applied to glTF
  characters (`CharacterModel`) + the primitive player avatar (`PlayerAvatar`),
  High only; skinned meshes share the skeleton so it animates.
- **Sky/coast/grass (W5-E/F):** `SkyBackdrop.jsx` (gradient sky dome + distant
  islands w/ lighthouse+cabin), `WorldScenery.IslandCoast` (irregular wavy
  coastline), `WindGrass.jsx` (instanced short grass that BENDS from the player —
  no wind sway — mixed greens, High only; excluded from paths/zones/patches).

## World redesign (W6, built 2026-07-03/04)
> **2026-10-09:** the island MAP described here (the 38 m circle, the
> plateau + stairs, Integer Dunes / Fraction Volcano patches, the Algebra
> moat) is SUPERSEDED — see "DONE (2026-10-09) — NUMBER ISLAND REBUILT".
- **Cleanup (W6-B):** removed Area Meadow (+ its routes/checks) and the Island-
  Champion claim/podium; Champion's Grove now holds the **SchoolYard portal**
  (`regions.js` island portal at `[0,-32]`) as the progression. Fixed treasure
  chest → **random** collision-safe spot each load, +15 coins once/session
  (`interaction.js`).
- **Plateau (W6-C):** square straight-edged `PLATEAU` (`halfW/halfD`, `worldColliders.js`)
  with flush stairs BOTH sides; Mills moved to spawn, Board/Trophy spaced.
- **Bigger irregular island (W6-D):** `WALKABLE_RADIUS` 38 (bounds stay a circle
  for collision); zones translated outward (moat/bridge/gate moved together to
  stay aligned). Camera lowered (`CAMERA_HEIGHT` 4.5).
- **Themed zones:** Integer Dunes = **snow** (`SAND_PATCH`) with snowmen/xmas-trees
  + snow dunes; Fraction Volcano = **ash** (`ASH_PATCH`) with pebbles + an animated
  lava `Volcano` (crater + flow + pool); both use `SnowEdge` (grass→patch blend)
  and pooled fading `Footprints`. Landmark types live in `WorldScenery.Landmark`.
- **FPV toggle ("/", W6-A) is PARKED — not working** (camera ends up underground);
  code left in place (`uiStore.fpv`, `Player.jsx` FPV branch) to revisit.

## Question-bank expansion (Phases 3A–3G, built 2026-07-04→06, LIVE 2026-07-08)
Six NEW native Stage 4 topics in `src/maths/curriculum/stage4/` — part of the
14-topic Stage 4 set now LIVE. All pure generators (no adapters/legacy banks);
each topic has its own `run<Topic>Checks()` block in `systemChecks.js` and is
mirrored in the website's `adventureManifest.js` (committed + deployed). Passed
its checks + big random fuzzes; visuals were teacher-reviewed live in dev over
several rounds.
- **Topics:** `ratio/` (14 skills incl. distance–time graphs), `length/`
  (10, diagram-heavy: perimeter/circles/arcs/sectors/composites),
  `equations/` (11, linear → quadratic ax²=c), `probability/` (9,
  theoretical + observed/RNG-simulation + complements), `indices/` (14,
  notation → primes/factor trees → roots → index laws, unicode ²³/√/∛
  notation ONLY — a check bans `^`/`sqrt()` in student-facing text),
  `linear/` (12, Cartesian plane, patterns → rules → five representations →
  graphical solving/intersections).
- **New answer modes** (in `answerModes.js` + `ui/answer-modes/`): `ratio`
  (boxes with colons), `multipleChoice` (2–4 options, keyboard 1–4). Plus
  single-box coordinate entry "(a, b)" via custom checks (brackets REQUIRED;
  touch keypad gained `(` `)` `,`; `validateAnswerFormat` allows them).
- **New diagram renderers** (`ui/diagrams/`, all registered in
  `diagramTypes.js` + `DiagramRenderer.jsx`): distanceTimeGraph,
  lengthPolygon, compositeRectilinear, circleFeatures, circleMeasure,
  sectorArc, curvedComposite, factorTree (sketch-style branching),
  cartesianPlane (arrowheaded lines, half-unit subgrid, quadrant-aware
  labels), tilePattern (towers/row/L variety), valuesTable (real x/y cells).
  Shared pure geometry in `lengthDiagramUtils.js` (incl. collision-aware
  label placement — checks assert labels can never overlap) +
  `factorTreeUtils.js`. DoubleNumberLine was redesigned to a single line.
- **Grading conventions:** structural checks beat numeric where the FORM is
  the skill (index form rejects the evaluated number; prime products need
  prime bases any order; simplified surds k√m reject √(k²m); rules y=mx+c
  parse from y=3x+1 / 3x+1 / 1+3x). Numeric equivalence where form is NOT the
  skill (probability 3/6 == 1/2 == 0.5). Tolerant ±0.05 for "correct to 1 dp"
  circle/root answers. Exact-vs-approx is first-class (π and surd matchers).
- **Editor/UI upgrades:** MathLive toolbar has × ÷ + − ("Math symbols";
  grading accepts both × and *, ÷ and /); virtual keyboard lifted above the
  modal (`--keyboard-zindex: 2000`) and the modal reflows around it
  (`--vk-height` + `body.vk-open`); `.prompt-expression` uses a maths serif
  face; `.question-prompt` is `white-space: pre-line` (generators put one
  sentence per line); coordinates/ratios use non-breaking internal spaces.
  BUGFIX: `TableAnswerInput` never rendered `headerRow` — it does now.
- **Teacher UI fixes (2026-07-06, LIVE 2026-07-08):**
  (1) Math toolbar stripped to fraction/√/ⁿ√/power/×/÷/Clear — the x, + and −
  buttons were REMOVED globally (`math-input/MathAnswerInput.jsx`); students
  still type them via the physical / MathLive virtual keyboard, so the linear
  "type the equation" mode is unaffected. (2) `CartesianPlaneDiagram` line
  labels now sit ALONG the line (rotated), offset PERPENDICULAR above it (never
  on the line), colour-matched via `cp-line-a/b/c-label` — fixes labels
  spilling over lines. (3) `pointOnLine` L≤2 (Yes/No) no longer plots the given
  point (was a giveaway). (4) `compareLines` steeper + all cartesian line
  labels use "Line A"/"Line B" (options + answer too). (5) Coordinate-set MC
  options centre-aligned (`centerOptions` flag → `choice-grid-center`;
  whitelisted through `decorateQuestion`). (6) `optionsOf()` guarantees EXACTLY
  4 distinct MC options for rule/coord questions (patternToRule L≤2,
  representations L1–3) — no more 3-option questions; rule questions already go
  typed at L3+. New checks LR14–LR17 (→ 346 total).
- **Harness tip:** the stdin-ESM trick works well —
  `cat harness.mjs | node --input-type=module -` from the repo root resolves
  node_modules without creating temp files.

## Angle Relationships (Phase 3G, built 2026-07-06, LIVE 2026-07-08)
The 12th Stage 4 topic (`src/maths/curriculum/stage4/angles/anglesSkills.js`) —
native generators, full NESA angle coverage, `runAnglesChecks()` in
`systemChecks.js` (→ **358** total), mirrored in the website
`adventureManifest.js`. All logic fuzz-tested headlessly; the DIAGRAMS still
need a live visual pass in `npm run dev` (can't render headless).
- **12 skills (order = progression):** naming · conventions (marks, ⊥, ∥,
  transversal) · angleTypes → complementarySupplementary · adjacentVertical ·
  anglesAtPoint → protractor → namePair · parallelAngles · parallelReason →
  areParallel → multiStep. Bands: language/convention → one relationship at a
  point → protractor → parallel-line pairs (name + solve + reason) → reverse
  "are they parallel?" → chained multi-step (multiPart at L4–5).
- **Reasons (value + reason, teacher fix 2026-07-06):** single-relationship
  solve questions (anglesAtPoint, parallelAngles, complementarySupplementary L4,
  adjacentVertical L2) are `multiPart` "value + reason" — the student types x AND
  picks the correct angle-fact from 4 options drawn from ALL reasons (`R`);
  BOTH parts must be right. `MultiPartAnswerInput` renders a part with `options`
  as a single-select MC (`.multipart-choices`). Pure "which reason?" drills stay
  (parallelReason etc.). `multiStep` asks the VALUE ONLY (multiple valid paths —
  no reason instruction / no forced intermediate); feedback still shows one
  route. All MC guarantee exactly 4 distinct options (`optionsOf`). Equal-marked
  angles are DRAWN equal (GeometryFigure renders angle `ticks`).
- **Protractor (the point of it):** BOTH arms sit at non-zero readings; the
  answer is the DIFFERENCE of the two readings, with straddle-90° / choose-a-
  scale cases. Never "read the number the arm points at" (the old engine's bug).
  A check asserts arms are never pinned to 0°/180° and answer == |a − b|.
- **5 new diagram renderers** (`ui/diagrams/`, all in `diagramTypes.js` +
  `DiagramRenderer.jsx`, shared pure geometry in `angleDiagramUtils.js` — math
  convention, y-up): `angleAtVertex` (straight/point/right/complementary/
  supplementary/adjacent), `crossingLines` (vertically opposite), `geometryFigure`
  (naming/markings/⊥/∥/types, data-driven points+segments+angles), `protractor`
  (dual-scale), `parallelTransversal` (corresponding/alternate/co-interior, to
  scale via `sectorSize(θ)`; the reverse "are they parallel?" uses it as a
  labelled "not to scale" sketch). Clean unicode ∠ ° ⊥ ∥ throughout.

## Properties of Geometrical Figures (Phase 3H, built 2026-07-06, LIVE 2026-07-08)
The 13th Stage 4 topic (`src/maths/curriculum/stage4/geometry/geometrySkills.js`)
— built from scratch, the most diagram-dependent topic. Full NESA coverage.
`runGeometryChecks()` in `systemChecks.js` (→ **372** total), mirrored in the
website `adventureManifest.js`. Logic fuzz-tested headlessly; the DIAGRAMS need a
live visual pass in `npm run dev` (can't render headless).
- **Graphics engine = the centrepiece.** ONE shared, pure marking/geometry
  library `ui/diagrams/geometryShapeUtils.js` (fit-to-box, rotation, equal-side
  ticks 1/2/3, parallel chevrons 1/2, equal-angle arcs 1/2/3, right-angle
  squares, diagonal marks, convexity/parallel tests, collision-aware labels) +
  a property-verified shape factory `geometry/shapeCatalogue.js` (builds every
  triangle (7 side×angle types) and quad (square/rectangle/rhombus/
  parallelogram/trapezium/kite + convex/concave) FROM defining properties, with
  GUARDS so a parallelogram is never a rectangle, isosceles never equilateral,
  concave genuinely reflex; marks are computed GENERICALLY from the finished
  geometry so they always match). Two React renderers: `geometryShape`
  (data-driven polygon + all markings + diagonals + labels) and `geometryProof`
  (the 3 constructions: parallel-through-apex, extended-side exterior angle,
  quad diagonal split). `buildSpec(shape, opts)` turns a catalogue shape into a
  diagram spec.
- **12 skills (order = progression):** naming → triangleType, quadType →
  shapeProperties (select-all), verifyProperty → convexity → hierarchy
  ("more than one type") → angleSums → proofs → unknownAngles, unknownSides
  (value+reason) → multiStep (value only).
- **NEW `multiSelect` answer mode** (select-all checkboxes): `gradeMultiSelect`
  (exact-set) in `answerModes.js`, `MultiSelectAnswerInput.jsx`, AnswerRenderer
  case, `correctOptions` carried through `decorateQuestion`. Used by
  shapeProperties + hierarchy + triangleType L4.
- **Reasons:** classification/verify/hierarchy = MC; select-all = multiSelect;
  unknown side/angle = value+reason (multiPart, reason from all `R.*`); proofs =
  fill-the-reason multiPart on the construction; multiStep = value only. All MC
  reason parts guarantee 4 distinct options.

## Data Classification & Visualisation (Phase 3I, built 2026-07-06, LIVE 2026-07-08)
The 14th Stage 4 topic (`src/maths/curriculum/stage4/data/dataSkills.js`) — the
chart-heaviest topic. Full NESA coverage. `runDataChecks()` in `systemChecks.js`
(→ **386** total), mirrored in the website `adventureManifest.js`. Logic fuzz-
tested headlessly; the CHARTS need a live visual pass in `npm run dev`.
- **Chart engine = the deliverable.** A pure core `ui/diagrams/chartUtils.js`
  (nice-number auto-scaling from ZERO, value→pixel scales, proportional sector
  angles, equal-width histogram bins, frequency-polygon midpoints, dot stacking,
  ordered stem-and-leaf + key, pictogram icon maths, truncated-axis misleading
  transform) + a pure `data/datasetGenerator.js` (typed datasets in realistic
  contexts with title/source/unit metadata; a classification scenario bank) that
  ties the classify strand to the choice-of-graph strand. THREE renderers by
  geometry family, sharing furniture (title/axis labels/scale/key/source):
  `statAxisChart` (column/bar/line/histogram/frequency polygon + overlay +
  truncated-axis misleading), `statProportionChart` (sector/pie, divided bar,
  pictogram w/ key + partial icons + icon-size distortion), `statPlotChart`
  (dot plot, stem-and-leaf). All 9 syllabus graph types covered.
- **10 skills (order = progression):** defineClassify · discreteContinuous ·
  nominalOrdinal → readGraph → constructGraph → chooseGraph (two-part) →
  interpretTrend · compareGraphs → misleading (two-part) → infographic.
- **Answer modes reused:** select-all `multiSelect` (classify + infographic);
  two-part MC (chooseGraph = graph+reason, misleading = flaw+fix) via multiPart
  with MC parts; numeric reads/constructs (all whole numbers, guarded).
  BUGFIX: multiSelect self-check now identity-matches the canonical string so
  option labels may contain commas.

## Parts of a Whole Farm (F1–F2, built 2026-07-15, NOT yet deployed)
> **2026-10-08:** the farm's MAP (positions, paddocks, the flat 120×96
> ground, cameras) described in this and the follow-up farm sections is
> SUPERSEDED by the rebuild — see "DONE (2026-10-08) — FRACTION FARM
> REBUILT". The challenge mechanics, stores and panels below are unchanged.
The THIRD region — a large (120×96) flat farming world for fraction "in-world
challenges", reached via a Teleport Gate BEHIND the island spawn (island portal
at `[2.5, 29]`, clear of the tree at `[-2, 28]`). Farm look: barn + silo +
animated windmill, three fenced paddocks (cow/sheep/pig — interiors kept EMPTY
for future Meshy animals), crop field + scarecrow, duck pond, hay bales,
orchard trees, dirt lanes, welcome sign. `runFarmChecks()` (FA1–FA8, FB1–FB8, FC1–FC6, FD1–FD2, FE1–FE5, FF1–FF5, FG1–FG5, FH1–FH4 → **434**
checks). Progress is LOCAL-ONLY for now (best score in localStorage
`mma-farm-fence-best`; +XP/coins via `awardRewards`); cloud achievements can be
wired once the mechanic is proven in class.
- **Where everything lives:** layout (single source of truth)
  `src/data/farm/farmLayout.js`; colliders `farmColliders.js` (fence runs =
  circle rows with gate gaps; challenge fence NOT solid); pure challenge maths
  `fenceChallenge.js`; scenery `src/game/FarmScenery.jsx`; challenge 3D layer
  `src/game/FenceChallenge.jsx`; round state `src/game/farmChallengeStore.js`
  (zustand); 2D card `src/ui/FarmChallengePanel.jsx` (+ styles appended to
  `src/styles/index.css`); region entry `regions.js` (`farm-parts-whole`,
  `groundHeight: () => 0`); collider switch in `worldColliders.getColliders`;
  region render in `World.jsx`; sign interactables in `interactables.js` +
  fallback dialogues in `encounters.js`; the fence sign is INTERCEPTED in
  `interaction.js` → `useFarmChallenge.start()`.
- **Fence Challenge mechanic (the point):** a 40 m fence (1 unit = 1 m) with a
  RED west post (0 m) and BLUE east post (40 m). 5-round set, concept order
  fixed (halves/quarters → thirds/fifths → non-unit → tenths as DECIMAL →
  PERCENT), values randomised per set, distances asked FROM a named post. NO
  live tape measure — the marker tracks the PLAYER along the fence, then the
  fence REVEALS denominator ticks + the true spot (green flag). Movement
  stays LIVE (the panel is not a modal); leaving the region auto-exits.
- **Fence camera mode (teacher feedback 2026-07-15):** while the challenge
  runs, `Player.jsx` `fenceMode` LOCKS a smooth side-on camera that frames
  the WHOLE fence (distance computed from live fov/aspect, clamped 20–50 to
  stay inside the fog; look-at + position both eased), auto-walks the player
  onto a line 2.4 m in front of the fence, and restricts input to LEFT/RIGHT
  only (←→/A/D in WORLD x; the on-screen rotate buttons slide too;
  tap-to-move still works, z re-clamped). Jump + orbit + camera-lock chasing
  disabled in this mode; exits when the challenge status returns to idle.
- **Cog-load card pass (teacher feedback 2026-07-15):** both challenge cards
  dropped their grey helper paragraphs; instructions are now one idea per
  line in large type (`.farm-challenge-line`/`.big`) with the key value in a
  highlight chip (`.fc-value`) and the post name coloured (`.fc-red/.fc-blue`).
  The Round-Up also has its own locked camera: `Player.jsx` `roundUpMode`
  glides to a raised SE vantage looking DOWN ~45° framing the WHOLE field +
  pen (distance from live fov/aspect); walking stays free and `camYaw` eases
  to the view yaw so controls match the screen; the duplicate in-world pen
  label was removed (the static "Sorting Pen" sign remains).
- **Banded points (same feedback):** `SCORE_BANDS` in `fenceChallenge.js` —
  ≤1.25 % of length = **🎯 BULLSEYE! 25 pts** (gold verdict + gold marker),
  ≤4.5 % (the old "correct") 15, ≤9 % 8, ≤15 % 3, else 0. `gradePlacement`
  now returns `{correct, band, points, label, …}`; store `score` is POINTS
  (max 125/set) + `bullseyes` count; rewards xp=points,
  coins=points/5+3/bullseye. Checks assert bands are monotone, bullseye sits
  INSIDE tolerance, and the 15-pt band edge == PLACEMENT_TOLERANCE.
- **The Round-Up (F3, built 2026-07-15):** "fraction/decimal/percentage OF AN
  AMOUNT" via the EQUAL-GROUPS model. A grazing herd of WHITE MARKER cows
  (Meshy models later) in `ROUNDUP_FIELD` beside a gated `ROUNDUP_PEN`
  (sorting pen, south gate). Field cows AMBLE around their grazing spot
  (slow wander waypoints clamped to the field; task targets always override)
  and carry an enlarged INVISIBLE tap sphere (r 1.15) so they're easy to
  click/tap (teacher feedback 2026-07-15). Click/tap a cow within
  `HERD_RADIUS` (8 m) →
  it trots THROUGH THE GATE (waypoints `ROUNDUP_GATE_OUT/IN`, never through a
  fence) into the pen; click a penned cow to release it. 5-round arc: unit
  fractions → non-unit → fifths/eighths → tenths-as-DECIMAL → benchmark
  PERCENTS (25/50/75 → quarters; tens → tenths). SOLUTIONS-FIRST: herd
  N = d×groupSize (6–20) so answers are always whole cows; grading EXACT
  (discrete count, unlike the fence's estimation band); live pen count shown
  (the skill is multiplicative reasoning, not counting). On feedback the
  WHOLE herd walks into d columns × groupSize with the n counted groups
  ringed green — the reveal IS the model — plus divide-then-multiply
  reasoning text. Where it lives: pure maths `src/data/farm/roundUpChallenge.js`;
  state `src/game/roundUpStore.js`; 3D herd `src/game/RoundUpChallenge.jsx`;
  2D card `src/ui/RoundUpPanel.jsx`; pen scenery via `Paddock` in
  FarmScenery; sign intercepted in `interaction.js` (the two farm challenges
  are MUTUALLY EXCLUSIVE — starting one exits the other). Local best in
  localStorage `mma-farm-roundup-best`. Checks FB1–FB8 (`runRoundUpChecks()`).
- **Renames (2026-07-15):** the farm is now **"Fraction Farm"** and the
  schoolyard region is **"Retrieval Practice Playground"** (region `name`s +
  island portal labels + farm welcome sign/encounter; region IDS unchanged —
  still `farm-parts-whole` / `schoolyard`). Round-Up camera zoomed out
  (min dist 26, fit width 15).
- **Order the Parts (F4, built 2026-07-15):** ordering fractions/decimals/
  percentages ASCENDING in the carrot garden (SE pasture, `ORDER_GARDEN`).
  5 carrots with value chips; tap one to lift, tap another to swap (slide
  anim); "Check the order!" → correct = carrots PULL OUT + confetti burst,
  25 pts; wrong = decaying shake, 2 pts per carrot already in its right spot
  (max 6), then the row slides itself into the correct order (the reveal).
  Round arc: unit fractions → same denominator → benchmark fractions →
  decimals (0.09-vs-0.1 traps) → MIXED f/d/% (≥1 of each). Feedback always
  shows the sorted chain + percent equivalents (one shared scale). Locked
  front-on camera + player auto-parked at `ORDER_VIEW_SPOT` (`orderMode` in
  Player.jsx; tap-only, movement paused). Pure maths
  `src/data/farm/orderPartsChallenge.js`; state `src/game/orderPartsStore.js`;
  3D `src/game/OrderPartsChallenge.jsx` (incl. ConfettiBurst); card
  `src/ui/OrderPartsPanel.jsx`. Best in localStorage `mma-farm-order-best`.
  Checks FC1–FC6 (`runOrderPartsChecks()`).
- **Farm Records stand (F5):** a board (`farm-records`, model "board") by the
  entrance opposite the welcome sign — interaction.js builds a LIVE dialogue
  from the three localStorage bests (fence points / round-up n/5 / order
  points). All three challenge signs are mutually exclusive (starting one
  exits the others).
- **Feedback pass (2026-07-16, → 415 checks):** (1) all world Html labels
  (paddock names, interactable badges, chips) now pass `zIndexRange={[24,0]}`
  so they can NEVER overlay the challenge cards (z 28). (2) The farm sign
  posts became CHARACTERS via a new `characterId` field on interactables
  (Interactable.jsx passes it to CharacterAvatar): Mills greets at the
  entrance, Pip hosts the Fence Challenge, Fern the Round-Up, Alby Order the
  Parts (the island + farm copies never render together, so sharing the glbs
  is safe). (3) Esc quits any farm challenge (panel keydown). (4) All three
  challenges are now **15 rounds per set** — the 5-concept arcs unchanged,
  THREE rounds per concept via `stageForRound`/`roundUpStageFor`/
  `orderStageFor` (rounds carry `roundIndex` + `stage`; maxes: fence/order
  375 pts, round-up 15). (5) The fence marker is now a BIRD perched on the
  rail: `"fence-bird"` in characterModels.js → `bird.glb` (drop into
  public/models/characters/; "air squat" clip = idle, "headstand flip" =
  sliding; primitive fallback bird until the file exists — tune
  modelScale/rotationY on first look). (6) The records board became a TROPHY
  BENCH (`model:"bench"` in Interactable.jsx + live `TrophyShelf` cups in
  FarmScenery): gold 100% / silver 75–99 / bronze 50–74 per challenge, pure
  logic + dialogue lines in `data/farm/farmRecords.js` (checks FD1–FD2).
- **Crate Packing (F6, built 2026-07-16; v2 same day):** HCF via the
  COMMON-GROUPS model, in the barn yard (`CRATE_AREA` (13,-25), front-on
  locked camera `crateMode`, player parked — tap-only like the garden).
  **v2 (teacher feedback):** the number = a GROUP SIZE, made visible: piles
  are countable ARRAYS of fruit (rows of 6, ≤36 each), choice crates show
  their capacity as SOCKETS + a "groups of N" chip, and tapping ANIMATES the
  division — fruit fly one-by-one (staggered, with a hop) into groups of
  that size on trays in front of the pile; non-fitting fruit tumble to a
  spill row glowing red (the remainder made physical). Chips read
  "24 = 2 groups of 12". HCF = 25 pts + confetti; smaller common factor =
  splits but 8 pts ("bigger was possible"); non-factor = leftovers + shake,
  0 pts. 15 rounds, 3 per stage: HCF 2–3 → 4–5 → 6–8 → 8–12 → coprime traps
  (HCF 1 = only groups of 1) + large HCFs. The SIMPLIFY-fraction framing was
  REMOVED (didn't land). Solutions-first: hcf × coprime multipliers so gcd
  is EXACT. **v3 polish:** STEEP ~48° close camera (fruit/sockets read
  large), leftovers land on raised RED reject trays BESIDE each pile (west
  of apples / east of pears — never occluded), player parks off to the
  front-left by Pearce facing the area, hay bales moved west of the barn,
  prompt = teacher's wording ("both piles must use the same group size…").
  **v4:** the instruction card shows ONCE ("intro" store status → Start), then
  only a slim round/points strip remains; verdicts moved IN-WORLD (floating
  chip + per-pile confetti over the groups on HCF, leftovers EXPLODE in a
  golden-angle scatter on a red glow disc); rounds AUTO-ADVANCE after 3 s
  (Enter skips). Idle look = a HARVEST SCENE (big crates + scattered fruit)
  so the area reads on approach. The trophy stand moved to the crossroads
  (9, 7.5) and renders the teacher's **public/models/trophy.glb** (10 spaces
  + a grand-trophy top spot, criteria TBD; `TROPHY_STAND_SCALE`/`CUP_Y`/
  `CUP_Z` in FarmScenery need a live tune) with the 4 dynamic cups on top;
  Interactable gained a `"none"` model (interaction/badge only) for it. Host: **Mr. Pearce** (`characterId:"pearce"`
  — schoolyard + farm never co-render). Where it lives: pure maths
  `src/data/farm/cratePackingChallenge.js` (gcd/factorsOf exported); state
  `src/game/cratePackingStore.js`; 3D `src/game/CratePackingChallenge.jsx`
  (imports ConfettiBurst, now EXPORTED from OrderPartsChallenge.jsx); card
  `src/ui/CratePackingPanel.jsx`; best `mma-farm-crate-best`; the trophy
  bench has a 4th cup + records row. Checks FE1–FE5
  (`runCratePackingChecks()`, → **420** total). 4-way exclusivity via
  `exitFarmChallengesExcept()` in interaction.js.
- **World dressing (F7, built 2026-07-18):** the farm runs on LATE-AFTERNOON
  light (warm sky `#f6d9a8` in regions.js + a low golden sun/hemisphere in
  World.jsx via `isFarm`). New in FarmScenery: `BoundaryFence` (tall 3-rail
  fence at ±58/±46), `HorizonHills` (10 hazy hill domes out in the fog, on a
  pasture plane extended +100), `AutumnTree` liquid ambers (`AUTUMN_TREES`
  in-bounds w/ colliders + `DISTANT_TREES` past the fence), and
  `BigLiquidAmber` at (-30, 20): a 2.1× amber over a 44-leaf carpet whose
  leaves FLUTTER (kick + spin + settle) when the player walks through.
  Crate Packing layout pass: piles moved beside the crate row, fruit r 0.24,
  BIG `.fc-count-chip` labels BELOW the row.
- **Main character swap (W7, built 2026-07-18):** the player is now the
  teacher's rigged **main1.glb** (public/models/characters/, config
  `player` in characterModels.js) via `characters/PlayerCharacter.jsx`:
  movement-driven clips — idle / walk / run / "jump over obstacle" — from
  `playerState.animMode`, published each frame by Player.jsx (airborne → jump;
  displacement → walk/run; else idle). Controls changed: **Space = jump**
  (was Shift; Space preventDefault'd), **Shift = run (2× speed + run
  clip)**; HUD hint text updated. The CHARACTER CREATOR was retired:
  CharacterCreator.jsx is now a simple welcome screen (name + optional
  student code + a spinning main1.glb preview); the avatar-customisation UI
  is gone but avatarOptions/PlayerAvatar remain as the model's fallback and
  the cloud-avatar plumbing (W3-B) is untouched. ⚙ menu label → "Edit name".
  ALSO: fence sets now guarantee consecutive targets differ (> 2× tolerance
  — the bird must move every round), horizon hills pushed fully OUTSIDE the
  boundary fence (footprints clear of ±58/±46; pasture plane +160).
- **The Milk Splitter (F8, built 2026-07-18):** terminating vs recurring
  decimals — the machine in the NW "dairy corner" (`MILK_AREA` (-40,-28),
  milk truck parked beside, locked front-on `milkMode` camera) SHARES n L
  among d cups by performing the division: the display grows digit-by-digit
  (long division live), the tank drains, cups fill; terminating → tap stops
  (✋ green); recurring → the drip + digits LOOP forever (🔁 pulsing) — the
  loop IS the concept. Two-part rounds: A) predict by tapping the STOPS
  (green) / REPEATS (purple) chute (+10); B) pick the correct DOT-notation
  jug from 3 options (+15; distractors = truncated-no-dots + misplaced-dot /
  spurious-dot + digit-mash) — so a coin-flip can't carry a round. 15
  rounds, 3/stage: terminating units → recurring units → mixed (1/8) →
  non-unit → simplify traps (3/6 STOPS) + the 1/7 six-digit showpiece.
  Correct jugs shelve up on their chute with a count. Host: **Milkman
  Pearce** (pearce, freed from crates by Peck). Pure maths (long-division
  `decimalExpansion`, 2s-and-5s rule, combining-dot `milkNotation`)
  `src/data/farm/milkSplitterChallenge.js`; state
  `src/game/milkSplitterStore.js`; 3D `src/game/MilkSplitterChallenge.jsx`;
  card `src/ui/MilkSplitterPanel.jsx` (crate-style pacing: full pour → 1s →
  `applyCamShake` + reason card; celebrate auto-advances). Best
  `mma-farm-milk-best`; trophy stand has a 5th cup. Checks FF1–FF5
  (`runMilkSplitterChecks()`, → **425** total). The parked truck renders the
  teacher's **public/models/milk-truck.glb** (Meshy tanker, ~9.9 MB —
  consider a leaner re-export; `MILK_TRUCK_SCALE` in FarmScenery needs a
  live tune), primitive-truck fallback if it fails.
- **The Weigh Station (F9, built 2026-07-18):** rounding + ≈, in the
  BACK-RIGHT (NE) corner (`WEIGH_AREA` (48,-38), locked front-on `weighMode`
  camera). A big analogue scale (trembling dial needle) with a ZOOMED
  NUMBER-LINE BEAM above it: lower candidate ← ticks + red pointer at the
  exact reading → upper candidate — rounding as LOCATING ("tap the closer ≈
  sign"), not a digit rule. 3 tappable ≈ signs (3rd = misconception:
  wrong-place / midpoint / "pay the exact amount"). 15 rounds, 3/stage:
  whole kg → 1 dp → 2 dp incl. EXACT-HALFWAY ties (round UP) → money to 5c
  ("tap what they pay") → JUDGEMENT rounds (3 scenario cards, tap the job
  where exact/≈ fits; bank in `WEIGH_JUDGEMENT_BANK`). **v2 (teacher
  feedback, Decimal-Zoom-tool flow):** numeric rounds are TWO-part — A)
  DRAG the estimate marker on the beam (click/drag or ←→ nudge; NO pointer
  shown) then "Lock it in" → fence-style bands `WEIGH_LOCATE_BANDS`
  (🎯 BULLSEYE 10 / 6 / 3 / 0) + the TRUE green pointer reveals; B) TYPE
  the rounded value into the input box (+15; `checkRoundedInput` accepts
  $/kg/equivalent forms). 10+15 = 25/round. ALL values integer
  thousandths/cents — zero float dust. Host = generic placeholder NPC
  ("weigh-host", no glb yet). Pure maths
  `src/data/farm/weighStationChallenge.js`; state
  `src/game/weighStationStore.js`; 3D `src/game/WeighStationChallenge.jsx`;
  card `src/ui/WeighStationPanel.jsx` (celebrate auto-advance / shake +
  reason card). Best `mma-farm-weigh-best`; trophy stand has a 6th cup.
  Checks FG1–FG5 (`runWeighStationChecks()`, → **430** total).
- **Milk polish (same day):** jugs are churn-sized in 1–2 rows (7 = 4 back +
  3 front, `jugPos`), churns idle-only + moved beside the machine, dots on
  recurring notation now drawn by CSS (`ui/MilkNotation.jsx` DottedText —
  the combining char rendered off-centre), the pour is DROP WAVES (one drop
  into EVERY jug per decimal place, shrinking each place; single-digit
  cycles show 5 repeats, 1/7 one cycle then the endless small loop), and
  the "Press E" prompt/tap-confirm are suppressed during ANY farm challenge
  (`game/farmChallengeActive.js`). Milk host is now a generic placeholder
  ("milk-host") awaiting a teacher glb.
- **The Trading Post (F10, built 2026-07-18):** FDP conversions as commerce,
  in the eastern gap BETWEEN the pig pen and sheep paddock (`TRADE_AREA`
  (38,-1), locked front-on `tradeMode` camera, player parked). THREE stalls
  in an arc — Fraction Fred (blue) / Decimal Dot (orange) / Percent Penny
  (green) — each pricing in its OWN notation. A crate lands on the trading
  table priced in ONE notation; the student taps the SAME-value tag at each
  of the other two stalls (3 tags each; distractors = ×10/÷10 scale slips —
  60% vs 6%). Both right → +5 bonus, confetti + the full chain chip
  ("3/5 = 0.6 = 60%"); any wrong → shake + chain reason card. 10+10+5 =
  25/round, 15 rounds, 3/stage: benchmarks → fifths/tenths → twentieths +
  eighths (12.5%) → BULK DEALS (improper fractions, always
  fraction-sourced; chain shows the mixed form "7/4 = 1 3/4 = 1.75 = 175%")
  → fluency mix. ALL values integer thousandths of a coin — exact. Host =
  generic placeholder NPC ("trade-host", no glb yet); stall keepers are
  primitive bodies. Pure maths `src/data/farm/tradingPostChallenge.js`;
  state `src/game/tradingPostStore.js`; 3D `src/game/TradingPostChallenge.jsx`;
  card `src/ui/TradingPostPanel.jsx`. Best `mma-farm-trade-best`; trophy
  stand has a 7th cup. Checks FH1–FH4 (`runTradingPostChecks()`, →
  **434** total).
- **Future:** more in-world challenges (share the feed, partition the paddock
  area), cloud save + a portal topic entry, farmer NPC delivering the
  missions, Meshy cow/pig/sheep models replacing the marker cows; a Meshy
  trophy-STAND glb to replace the primitive bench (wire like the characters:
  keep the cups dynamic).

## Rules of thumb
Don't break: story/onboarding/missions/badges/unlocks/MathLive/diagrams/
answer-modes/collision/jump/camera/gates/touch-controls/graphics-toggle. Run the
full system checks after changes. Re-export any new glTF characters as Meshy
Low-Poly (~7MB) before deploy; keep `public/models/characters/` lean.
When adding curriculum topics: solutions first, coefficients built backwards;
skill ORDER carries the concept progression, levels 1–5 carry numeric
difficulty per `DIFFICULTY_INTENT`; mirror new topics in the website
`adventureManifest.js`; add a `run<Topic>Checks()` block; never let a diagram
datum leave its plotted range.
