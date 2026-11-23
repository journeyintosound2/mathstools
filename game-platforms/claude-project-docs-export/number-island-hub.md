# Number Island — rebuilt hub, title screen + Achievements Wall (built 2026-10-09; build staged for deploy)

Three changes to the front of the game: a proper video-game TITLE SCREEN, the hub island REBUILT to the standard of the new worlds, and an ACHIEVEMENTS WALL by the arrival with an Enter-to-look first-person view. Region id is unchanged (`island-1`). Built over two sessions: the first ran out of usage before syncing, so the second rebuilt its exact state from its transcript, finished it and synced it to the Mac source folder.

## Deploy status (2026-10-09 evening)
- The repo is now **journeyintosound2/mathstools**. The old jeffmills2-rgb URL redirects to it. It's served by **GitHub Pages** (custom domain via `CNAME`); Netlify is retired.
- Jeff's 18:35 push ("Updates adventure") deployed, but it held the SOURCE only, so students saw no change.
- The fresh BUILD is now in `game-platforms/mills-maths-adventure/`:
  - 7 new files and a new `index.html`
  - the old build's 5 stale bundles deleted
  - `precache-manifest.js` regenerated with `node tools/build-pwa.mjs` (version e5852d5d10)
- **Next:** commit + push in GitHub Desktop.
- **Deploy recipe from now on:**
  1. `npm run build` in the source folder.
  2. Copy `dist/.` into `../mills-maths-adventure/` and delete the previous hashed bundles.
  3. Run `node tools/build-pwa.mjs` from the repo root.
  4. Commit and push.

## The title screen
- A live cinematic flyover of Number Island plays behind it (the camera loops the whole island at 30+ m).
- Flow: branded loading curtain → logo + "Press Enter or tap to start" → menu (Continue for returning players / Start adventure, Change character, Sign in with student code, Options) → the explorer card (turntable with ‹ ›, name, optional student code, Set off!) or Options (language, graphics, sound, touch).
- Keeps every old welcome-screen behaviour: ?code= in the URL signs the student in, a typed code signs in before play, reset needs a confirm. Fonts are bundled (no network). Lays out for 16:9, 4:3, iPad portrait and phones. All new text has Farsi + Arabic.

## The island
- **Size:** 229 × 205 m of land: 2.7× across the old 76 m island (7.4× the area). "2.5× the size" was read as 2.5× across. If area was meant, it can be shrunk.
- **Arrival:** off the jetty onto Harbour Green, looking north through the NUMBER ISLAND arch up Main Street to the raised Mission Plaza (fountain, Mission Board, Trophy Stand). Mills, the welcome sign, the island map board and the Achievements Wall are on the green.
- **Each gate sits in a landscape that previews its world:**
  - Retrieval Practice Playground: the padlocked yard gate of the Schoolhouse Hill school (north).
  - Snowball Sums: an igloo in Igloo Hollow on snowy Frosty Peak (NW), with Pip's giant thermometer number line below.
  - Magma Multiples: a basalt arch on the Ember Terrace of smoking Ember Peak (NE), with Fern's ash fields below.
  - Fraction Farm: a haybale gate in Haybale Meadows (W), with a barn, windmill, wheat and sunflowers.
  - Emerald Jungle: a mossy arch by the Emerald Lagoon and its waterfall (SW).
- **Coming home:** every world's return gate now lands you in front of the island gate you left by.
- **Also:** Alby's lighthouse on an islet over a rope bridge (E), Sunny Cove (SE), a village of cottages, a summit trail up Frosty Peak, a wadeable lagoon and shallows, deep water and lava that bounce you back, about 310 trees, crabs, gulls, dolphins, butterflies and chimney smoke.

## The Achievements Wall
- A stone-and-timber gallery wall west of the arch, facing the arrivals. It has six framed boards (Number Island, the Playground, Fraction Farm, Snowball Sums, Magma Multiples, Emerald Jungle) under a header with the student's name.
- The boards are live. They show level, XP and coins; Pip/Fern/Alby bests against the 80% gate and the badges; the 8 Playground keys and the Head Teacher's Cup; the 10 trophies per world with medal counts; and the jungle's explorer's log.
- Walk up and press **Enter** (or tap): the camera moves to eye height in front of the wall and the avatar hides. Use ← → to step board to board, ↑ ↓ to zoom in and out, 1–6 to jump to a world, and Enter or Esc to step back.

## Where the code lives
- `src/data/island/`: islandLayout.js (single source of truth), islandTerrain.js (1 m grid + Player hooks), islandProps.js, islandColliders.js, achievements.js, wallView.js, titleShots.js.
- `src/game/IslandScenery.jsx` + `src/game/island/` (materials, terrain, water, flora, buildings, landmarks, atmosphere, the wall).
- `src/ui/TitleScreen.jsx` + `styles/title.css`, `game/TitleCamera.jsx`, `game/WorldReady.jsx`; `ui/AchievementsWallUI.jsx` + `styles/wall.css`.
- Wiring: regions.js, World.jsx, Player.jsx (wall camera + title glide), App.jsx, Portal.jsx, SkyBackdrop.jsx (true-horizon sky), uiStore, i18n/translations.js. Full notes: the "DONE (2026-10-09)" section of the source CLAUDE.md.

## Verification
- **566 headless checks, all passing**, in the cloud copy and re-run on the Mac copy after syncing. That includes 10 new island checks (IL1–IL10: hooks and gates, size, every path walkable, everything reachable on foot, the plaza, the wall and its 21 look views, water and lava, scatter, the title flyover, the areas). vite build clean.
- Driven with the real Player physics: jetty → Main Street → plaza stairs → the deck; walk into the igloo → Snowball Sums → walk back through its return gate → land at the igloo.
- Screenshots reviewed: the title screen at four screen shapes, all five gates, the wall and its board views, and aerials.
- **Performance (arrival):** High ≈ 480 draws / 1.2 M triangles, Low ≈ 190 / 0.37 M. That's lighter than the rebuilt farm and snow worlds.

## Still to do
- A live look on a real GPU and a school iPad (title flyover frame rate, the wall camera glide, grass density).
- Farsi/Arabic for the onboarding card and the island's area names.
- The PWA list also picks up the source folder's local `dist/` (not deployed), so devices skip 26 "not found" files on install. Harmless, but `tools/build-pwa.mjs` could skip `dist` folders.
