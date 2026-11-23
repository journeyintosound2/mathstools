# Retrieval Practice Playground — redesigned from Jeff's videos (2026-11-09; staged for deploy)

Jeff sent eleven walk-through videos of Coffs Harbour High, numbered 1–11 on his annotated aerial. The brief: make the Playground mirror the videos, keep the Maths Block's two classrooms on every level, and build it bigger than life (higher ceilings, wider walkways) so it's easy to steer round on a screen. The nine staff, their keys, missions, topics, the Head Teacher and the padlocked hall work exactly as before. Only the school around them, and where each teacher stands, is new.

## Scale
- Storeys are **4.5 m** (high ceilings).
- Open corridors are **4.6 m** wide.
- Stair towers are **3 m** wide, with 3 m landings and gentle 0.28 m steps.
- The plan follows the aerial at about 1.35× real size, turned so you still arrive from Camperdown St.

## The video spots in the game
| Video | In the game | Who's there |
|---|---|---|
| 1 | **The Fig Quad**: big figs in brick planters, picnic sets, drain grates, stairs down to the courts | |
| 2 | **The Canteen**: blue and yellow walls, CANTEEN sign, brick planter + bench, a raised seating deck with ramp and steps, under the hall's **red and white striped awning** | Mr. Pearce |
| 3 | **The Undercroft** under B Block: an open ground floor with brick piers and concrete columns. It links A Block Courtyard to Banksia Court | |
| 4 | **The TAS Stairs**: up from the undercroft past the rainbow TAS poster on the landing to the first-floor balcony | |
| 5 | **The Glass Stairs**: a glazed stair tower from the court to the top floor | |
| 6 | **The Top Balcony**: desks, chairs and benches along N Block's top corridor | Ms. Mahoney |
| 7 | **The Food Tech Walkway**: off C Block's first floor, a covered ramp along the Maths Block's brick end wall, then steps down onto the Maths balcony | |
| 8 | **A Block Courtyard**: 1920s brick blocks, cream verandahs on brick piers, yellow edge lines, painted squares, timber planter boxes, a pelican mural | Ms. Brookes |
| 9 | **The Mural Lane**: the white verandah building, the **blue waves mural**, opening onto the Big Yard and its figs | Ms. Bacon |
| 10 | The balconies round **Banksia Court** (its tree and kitchen garden), with steel railings at the end | Mr. Morgan (in the court) |
| 11 | **The Maths Block**: **two walk-in classrooms on every floor** (M1–M6) with desks, chairs, maths whiteboards and posters; picket balustrades; a top-floor view to the sea | Mr. Dawson (top balcony) |

Also:
- The hall faces the arrival plaza, with Mrs. Kellahan on its stage behind the padlocked doors.
- Mr. Heywood and Ms. Ewings have moved:
  - Mr. Heywood is at the courts.
  - Ms. Ewings is on C Block's top floor with her telescope.
- Removed: the oval, the Sky Pier and its bush track, and the ag plot. Mills' welcome now points to the Glass Stairs, the Food Tech walkway and the Maths classrooms. The new labels and that line have Farsi and Arabic.

## Checked
- All ten Playground world checks pass, rewritten for the new school:
  - the scale
  - every classroom on every floor reachable
  - every drop guarded
  - the camera inside the classrooms and the undercroft
  - nothing blocking a stair
- **698/699 system checks.** The one failure, "Progress saves & reloads", failed the same way before this change and isn't related to it.
- The vite build is clean.
- Walked with the game's real player physics:
  - glass stairs to the top floor
  - undercroft → TAS stairs
  - round the first-floor balconies → Food Tech walkway → Maths balcony → a classroom
  - Maths tower to the top floor → Mr. Dawson → a top-floor classroom
- The walk test found two problems, both fixed:
  - a corner where a fast step could slip past a rail
  - a balustrade blocking the walkway steps

## Deploy status
- Source synced into `mills-maths-adventure-source/`. The replaced files are backed up in `Claude outputs/pre-playground-redesign-2026-11-09/`.
- The new build is in `mills-maths-adventure/` (`index-CzdBessL.js`). The old bundles are in `Claude outputs/old-build-2026-11-09-playground/`.
- **To go live:**
  1. Run `node tools/build-pwa.mjs` from the repo root.
  2. Commit and push.
- Two folders in `Claude outputs/` can be deleted: `_to_delete-unpack-src-2026-11-09` and `_to_delete-unpack-dist-2026-11-09`.

## Still to check on real devices
- Frame rate inside the classrooms on a school iPad.
- How the camera feels on the stair towers.
- How the glass tower looks.
- Mrs. Kellahan still has no model file (`kellahan.glb`), so she shows as a stand-in figure.
