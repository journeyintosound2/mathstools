# Sunstone Desert — the eighth world (built 2026-11-08, land only)

**Status:** built and tested in the source; **not yet deployed**. No maths challenges yet (by design — "this is all about designing a polished desert world to explore").

## How you get there
- A **golden gate** on Number Island at [57.5, 31], in its own little patch of sand (mini pyramid, cacti, date palms, a signposted path "Sunstone Sands").
- Students see it padlocked with **"Coming soon"**. It opens in **admin mode**.
- To open it to everyone: set `DESERT_OPEN_TO_STUDENTS = true` in `src/data/desert/desertLayout.js`. When the challenges arrive it also needs a journey slot.
- Rename the world in one place: `DESERT_NAME` in the same file.

## The world
- About 300 × 272 m inside a rim of layered cliffs and giant dunes. Roughly **66,000 m² walkable, 1.95× the volcano world**. Ground runs from −5 m (the sunken oasis) to 31 m (the mesa tops), so there's plenty of climbing.
- **Places** (all on the map board by the arrival and the M map):
  - **Caravan Gate + Bazaar:** pastel plaster town, Gerudo-style arch, market stalls, a well, a tower stair with a rooftop bridge, a little ziggurat.
  - **Great Pyramid:** six stepped tiers, a 60-step front stair and the glowing Sunstone on the summit, with an obelisk avenue.
  - **Sun Temple** against the south cliff, and the floating **Sky Pyramid**.
  - **Oasis:** a sunken pool with palms, lilies, two stairways and a carved hieroglyph wall.
  - **Red Mesas:** stair flights, ladders, a rope bridge, mine rails and a cart.
  - **Sun Arch**, and the **Sundial Rise** (a spiral ramp up to a gnomon).
  - **Dune Sea:** big wind-shaped dunes, a stranded Dune Ship and a half-buried Sand Sphinx head.
  - **Quicksand Flats:** an island ringed by a quicksand moat, reached by a boardwalk and stepping stones.
  - **Crystal Hollow**, and the **Fossil Dig** (a giant skeleton and tents).
  - **Life and weather:** camels, three kinds of cactus, tumbleweeds, dust devils, vultures, and butterflies at the oasis.

## Quicksand
- It behaves like the deep water in the main world. Step in and you sink, see "You sank in the quicksand!", and go back to the spawn.
- There's a soft edge about 1.6 m wide that slows you down first.
- Every lone pit has a warning sign.
- The oasis pool is shallow. It slows you down but never wipes you out.

## Testing done
- **Headless checks:** 671/671 pass (DS1–DS10 are new). They confirm every place can be reached and that stairs, ladders and trails are walkable.
- **Browser screenshots:** every landmark was checked in a real browser.
- **Quicksand:** the real player was walked into a pit and the wipe-out worked.
- **Screens:** iPhone portrait and landscape and iPad both orientations were checked.
- **Performance:** on Low graphics it's about 110–260 draw calls.

## Next
- Desert challenges, each with its live demo, a journey slot, then open the gate.
- Deploy: build, copy `dist` into `mills-maths-adventure/`, run `node tools/build-pwa.mjs`, then commit and push.
