# Emerald Jungle — the seventh world (built 2026-10-07, not yet deployed)

A lush jungle valley reached through a GREEN mossy-arch portal on Number Island at [-17, 31] (the mirror of the red volcano gate). Land only — no characters or maths yet. Region id `emerald-jungle`; the name lives in `JUNGLE_NAME` (src/data/jungle/jungleLayout.js) so it can be renamed in one place.

## What's there
- **Size:** walkable land ≈ 69,800 m² = 2.07× Magma Multiples. An oval valley (≈256 × 336 m) walled by forested rim mountains, with a 16 m plateau behind the northern escarpment.
- **Hills:** Canopy Hill (26 m, spiral trail to the Canopy Lookout deck), Mossback Ridge (23 m crest that walks you up onto the plateau), Fern Hill, Sunny Knoll, smaller knolls — all tree-covered (≈2,230 trees).
- **Water:** a river from a waterfall off the escarpment down to the Lily Lagoon, an upper river on the plateau, and a stream out of the temple arch. All knee-deep (≤ 0.70 m) — you can wade anywhere, slowed.
- **Landmarks:** Temple Ruins (walkable roof), Redwood Hollow (giant trees + sunbeams), Vine Cliffs, the Great Tree (spiral stair → 20 m treehouse → rope bridge to the ridge), Mushroom Glade (bouncy mushrooms + giant toadstool), Palm Grove, Sky Shrine, Falls Lookout.
- **Ways up:** walk the hills · Waterfall Stairs · the ridge crest · push into vine walls to climb · hop eight leaf poles to a mid ledge · mushroom bounces (a mega bounce onto a high rock ledge, then onto the toadstool) · the Great Tree's spiral stair · the temple's side flights.
- **Ten reserved clearings** (flat, dry, open middles) for the future challenges: Palm Grove, Lily Lagoon, Sunny Knoll, Canopy Lookout, Mushroom Glade, Temple Ruins, The Great Tree, Redwood Hollow, Waterfall Pool, Sky Shrine.

## Where the code lives
- `src/data/jungle/` — jungleLayout.js (single source of truth: terrain grid, water, paths, structures, Player hooks), jungleProps.js (scatter + set-piece positions), jungleColliders.js.
- `src/game/JungleScenery.jsx` + `src/game/jungle/` (materials, procedural geometry, instanced tiles with LODs, static-mesh batching, terrain, water, trees, flora, set pieces, atmosphere).
- Wiring: regions.js (portals + hooks), worldColliders.js, World.jsx (`isJungle` branch), Portal.jsx (`JunglePortal`), Player.jsx (layered ground, slide/climb/bounce/wade hooks, height-banded colliders), sound.js (`boing`, `climb`).

## Verification
- **543 headless checks, all passing** (8 new: JG1–JG8 in src/dev/jungleChecks.js — gates and spawn, size, every trail walkable, flood-fill reachability, every climb route, bounces and water, bridges and cliffs, open clearings).
- The real Player physics was driven headlessly through every climb: Waterfall Stairs, both vine walls, all eight leaf poles, the mega bounce + toadstool bounce, the spiral stair + rope bridge, the temple roof and wading.
- vite build clean. Performance pass (static batching + tree LODs + undergrowth trims) cut draw calls ≈60% on High; Low drops tree shadows.

## Still to do
- A live `npm run dev` look on a real GPU and a school iPad/Chromebook (the jungle is heavier than Magma: Low ≈ 500 draws / 1.1 M triangles at the arrival view).
- Deploy (build → copy dist → push website).
- Later: claim a clearing per maths challenge (Magma pattern), Farsi/Arabic strings for the new labels.
