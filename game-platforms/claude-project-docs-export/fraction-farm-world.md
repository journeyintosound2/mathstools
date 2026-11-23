# Fraction Farm — rebuilt as a big, rolling, explorable farm (built 2026-10-07/08, not yet deployed)

The old flat 120 × 96 farm is now a hilly farm the size of the Emerald Jungle, where students explore to DISCOVER the ten fraction challenges. Region id is unchanged (`farm-parts-whole`); the haybale gate on Number Island still leads here. The challenges' maths, stores, panels, trophies and teacher-task wiring are all unchanged — only the world around them (and where each stage stands) is new.

## What's there
- **Size:** walkable land ≈ 71,100 m² = 1.02× the Emerald Jungle; 290 × 258 m inside the boundary fence, terrain from −4 m (creek) to 16 m (Windmill Hill summit). The hills keep rolling past the fence into the haze.
- **Arrival:** you land on the arrival green looking north up the drive through the entry arch (cattle grid + "FRACTION FARM" sign). Mills welcomes you, a painted map board shows the whole farm, the trophy cabinet stands west of the gate, and the haybale gate home is just behind-right.
- **Ten themed areas, one challenge each:** Farm Gate Shop at the homestead (Farm Shop) · Orchard & Packing Shed (Crate Packing) · Carrot Patch (Order the Parts) · The Dairy + milking shed (Milk Splitter) · Cattle Run (Round-Up) · The Old Sawmill on the creek, turning water wheel (Plank the Gap) · The Long Paddock (Fence Challenge) · Grain Silos + weighbridge (Weigh Station) · Glasshouse Gardens (Veggie Plot) · Market Green with bunting and a marquee (Trading Post).
- **Also:** the Homestead (barn, farmhouse, silo, chook coop, tank, ute, tractor), Windmill Hill (big sail windmill + picnic spot), Sheep Downs + shearing shed, the Duck Pond + jetty, sunflowers, lavender, wheat, corn, a vineyard, orchards, hay meadows, gum belts, cows, sheep, pigs, chooks, ducks, rabbits, butterflies and dragonflies.
- **Getting around:** 17 graded farm tracks (all walkable end to end), signposts at the junctions, a knee-deep creek you can wade, three bridges, steep hill faces that slide you back down (the tracks are the way up), six treasure-chest spots.

## Where the code lives
- `src/data/farm/` — farmLayout.js (single source of truth: areas, pads, hills, tracks, creek/pond, paddocks, buildings, signposts), farmTerrain.js (1 m height grid: hills → level pads → graded tracks → water; Player hooks; `challengePadY`), farmProps.js (deterministic scatter), farmCameras.js (`farmChallengeView` — each challenge camera framed for the live aspect), farmColliders.js. Shared helpers: `src/data/terrainKit.js`.
- `src/game/FarmScenery.jsx` + `src/game/farm/` (materials + canvas textures, procedural geometry, terrain, water, flora + grass, fences, buildings, landmarks, animals, atmosphere, `FarmStage`).
- Wiring: regions.js (hooks + `badgeRange`/`drawRange`), World.jsx (`FarmStage` per challenge), Player.jsx (one farm camera branch), Interactable.jsx, Portal.jsx, StaticBatch.jsx (far LOD), encounters.js (Mills' new welcome).

## Verification
- **552 headless checks, all passing** (9 new: FW1–FW9 in src/dev/farmWorldChecks.js — hooks/gate/spawn, jungle-sized and hilly, every track walkable, flood-fill reachability of every challenge/summit/signpost/chest, level pads under all ten stages, clear challenge cameras at 16:9 and 4:3, water + bridges, scatter/gates/fences/boundary, ten spread-out themed areas). Also re-run on the Mac copy after syncing: 552/552.
- All 17 tracks walked with the real Player physics (headless); all ten challenges started and screenshotted at 16:9 and 4:3; area, aerial and Low-graphics screenshots reviewed.
- vite build clean.
- **Performance (arrival view):** High ≈ 915 draws / 2.2 M triangles, Low ≈ 430 / 0.71 M — lighter than the jungle (1,090 / 3.0 M and 500 / 1.1 M). Challenge scenes only mount within 120 m, far building groups draw as one mesh, and host badges only show within 55 m.

## Still to do
- A live `npm run dev` look on a real GPU and a school iPad/Chromebook (frame rate, the follow camera on the steeper hills, far-LOD swap distance, grass density).
- Farsi/Arabic strings for the new area labels and Mills' welcome lines.
- Deploy (build → copy dist → push website). The old `src/game/FarmGrass.jsx` was moved to `_to_delete/` on the Mac — safe to delete.
