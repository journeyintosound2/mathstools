# The Quotient Temple (built 2026-11-09)

The ninth region: the inside of the desert's old Sun Temple. It's for exploring only for now, and the maths challenges come later.

## How you get in
- The old Sun Temple in Sunstone Desert is now the **Quotient Temple**. Its doorway has two bronze leaves sealed with a gold ÷, and an arch of **15 sockets** around it, one per Timestable Temple station. Each socket lights up bronze, silver or gold to match that station's best medal.
- The door opens only when **every station has at least a bronze**. 14 out of 15 is not enough. Admin mode opens it too.
- If you walk into the locked door you get the 🔒 hint. "Read the temple door" shows `🥉 have / 15`.
- The **7s stone moved to the top of Sundial Rise**. Mills' lines, the desert intro, the signposts and the map were all updated to match.

## The world (`quotient-temple`, 236 × 180 m, about half the desert's footprint)
1. **Temple Doors.** This is where you arrive. Mills and the map board are here, and the doors behind you lead back to the desert.
2. **The Grand Descent.** Three flights of stairs with two landings, going 18 m down. It has a red carpet, owl statues, torches and glyph panels.
3. **The Great Hall.** 60 × 63 m and 30 m high:
   - a marble checker floor with the Quotient Seal set in the middle
   - 14 fluted columns, a blue vault with gold stars and gold ribs, and rose windows
   - shafts of light from the windows, and raised galleries along both sides
   - seated colossi beside the stair arch and standing colossi beside the Sanctum
   - **The Sealed Sanctum**: a great ÷ door on a dais, kept for the future challenges
4. **The Hall of Heads.** Golden faces on the walls (Mario RPG style), stone piers and a sunken floor.
5. **The Scribes' Library.** Bookcases, reading tables, scrolls, hanging lamps and a lectern on a raised platform.
6. **The Sunken Pit.** The floor is 32 m down, with ledges around the walls, ramps, a platform and a long stair. A hanging **grate bridge** crosses it, and there is **sinking sand** with sand pouring in from the ceiling.
7. **The Cobra Throne.** Cobra-headed pillars, glowing green glyph walls, and a coiled gold cobra on a four-tier dais.
8. **The Treasury.** Coin heaps, gold bars, urns, chests, and a golden idol holding a ÷.
9. **The Guardians' Court.** Two terraces with eight great stone guardian heads, a well of daylight, a treasure chest on the high terrace, and more sinking sand.

## Adding rooms later
The whole temple is carved from one plan in `src/data/qtemple/qtempleWorld.js`. To add a room, add an entry to `CELLS` plus a doorway cell that touches an existing room. The walls, door lintels, floor, ceiling, map colours and the walk check all follow automatically.

There is unused rock on every side. The obvious next wing is north, behind the Sealed Sanctum door.

## Files
- Plan and physics: `data/qtemple/qtempleWorld.js`
- Visuals: `game/QTempleScenery.jsx` plus `game/qtemple/` (geometry, structure, hall, rooms, figures, atmosphere, materials)
- Door logic: `data/temple/templeTables.js` (`quotientDoorOpen`) and `game/desert/DesertTempleStations.jsx` (`QuotientDoor`)
- Checks: `dev/qtempleChecks.js` (QT1–QT10). **699 checks pass.**
