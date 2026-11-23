# Retrieval Practice Playground — rebuilt as Coffs Harbour High (built 2026-10-09) — SUPERSEDED

> **Superseded on 2026-11-09.** The school was redesigned from Jeff's eleven walk-through videos. The courtyard complex, undercroft, TAS and glass stairs, Food Tech walkway, a Maths Block with walk-in classrooms, 4.5 m storeys and 4.6 m corridors are now in the game. The oval, Sky Pier, bush track and ag plot below no longer exist. See `claude/playground-redesign-from-videos.md`. This page is kept for history.

Jeff's brief: bring the Playground up to the quality and size of Snowball Sums and the Emerald Jungle, inspired by the aerial and photos of Coffs Harbour High (a school on several levels, with stairs and corridors, and the big orange-roofed hall), and use the nearby ocean for the background. The region id stayed the same (`schoolyard`).

## What it had
- 280 × 255 m inside the fence. The site stepped up the hill in 3 m storeys: L0 (front lawns, plaza, oval, car parks) to L4 (top corridors). A bush track climbed to the Sky Pier at 21.6 m.
- **Buildings:**
  - Blocks A, B and C, with open corridors and switchback stair towers
  - the Art block with the ocean mural
  - the canteen, the front office, the TAS workshops and the sports shed
- **The hall:** a red gable roof and a stage, with eight padlocks on the doors. These still work the same way.
- **Staff spots:**
  - Pearce: canteen
  - Mahoney: library balcony
  - Ewings: science lookout
  - Dawson: Sky Pier
  - Heywood: oval
  - Morgan: ag plot
  - Bacon: mural
  - Brookes: courtyard
  - Kellahan: hall stage
- **The background**, which is unchanged: the streets, the town, Jetty Beach, the jetty, the breakwalls, Muttonbird Island and the marina.

## How it works (still true)
- `src/data/schoolyard/` is the single source of truth: layout, terrain, rails, colliders and props.
- The ground is layered, so you walk under the corridor decks.
- The `cameraFit` hook keeps the follow camera out of the buildings.
- A geometry kit merges everything per material.
