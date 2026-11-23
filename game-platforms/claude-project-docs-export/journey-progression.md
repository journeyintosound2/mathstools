# The journey: worlds open in order (built 2026-10-13; build staged for deploy, not live yet)

Number Island used to be fully open, with no progression. Now the game has a **journey**:

1. A short **training** on Harbour Green.
2. **Pip's, Fern's and Alby's warm-ups**, which open the first gate.
3. The worlds then open **one at a time, from easiest to hardest**.

Jeff's decisions on 2026-10-13:
- Fraction Farm comes after the volcano.
- **7 of 10 trophies at bronze or better** opens the next gate.
- **No teacher override.** A teacher task in a locked world waits until the student opens that world.
- **Keep what they've reached.** Students who already played keep the worlds they've been in.

## The path

| Step | What opens it |
|---|---|
| 🎓 Training on Harbour Green | First visit (can be skipped, and replayed from the Quest Log) |
| ❄️ Snowball Sums (igloo gate) | Pass all three island warm-ups, in any order: Pip (adding & subtracting), Fern (times tables), Alby (division facts) |
| 🌋 Magma Multiples (volcano arch) | 7 Snowball Sums trophies, bronze or better |
| 🌾 Fraction Farm (haybale gate) | 7 Magma Multiples trophies |
| 🌿 Emerald Jungle (mossy arch) | 7 Fraction Farm trophies |
| 🏫 Retrieval Practice Playground (school gate) | 7 Emerald Jungle trophies |

- Bronze is 50% of a challenge's best score, silver 75% and gold 100%.
- The Lodge Interior is inside Snowball Sums, so it opens with it.
- A teacher task set on Pip, Fern or Alby and passed counts as passing that friend.

**Old saves:** any world where the student has already scored stays open (any best above 0, or any Playground key). So does every world before it on the path. The first time an old save loads, the gates that are already open get no "gate open!" fanfare.

## What students see

**The training.** Each step ticks itself off only when the student actually does it:
1. Walk.
2. Look around (Z/X, or drag on a touch screen).
3. Run (Shift, or push the joystick to its edge).
4. Jump three times.
5. First-person view (/, or the new 👁️ button on touch) — switch it on, then back off.
6. Meet Mills.
7. The Achievements Wall. A tip explains the boards and the padlocks.
8. The map. Pip's pin pulses; clicking it sets a waypoint.

Other details:
- New players get a welcome card. Returning players see "New: the island journey" — everyone does the training once.
- The training can't be skipped (changed later on 2026-10-13 at Jeff's request — students would skip it). A small "Stuck? Skip this step" appears only after a full minute on one step. Since that change the training shows as one big prompt with lit-up keys (see `claude/feedback-batch-2026-10-13.md`).
- The final card gives +20 XP and +10 coins and shows where the three friends are.

**Locked gates.**
- Each locked gate is drawn shut, with a wooden gate and a brass padlock across it.
- Its sign shows progress, e.g. "🔒 Magma Multiples · 4 / 7 ❄️ trophies".
- It's solid. Walking up to it says exactly what opens it.

**"Gate open!"**
- A confetti card appears the moment a gate opens. It waits until the challenge or conversation that earned it has closed.
- "Show me the way" sets a waypoint to the gate. From inside another world, it leads to the gate home first, then to the new gate.

**First visit to a world.**
- Snowball Sums gets a guided tour: the trophy stand (with a waypoint to it), then the map, then the first challenge.
- Each trophy grid now explains how trophies work and shows the 7 slots that open the next world.
- The other worlds get one welcome card each. Mills' welcome in each world says what 7 trophies open.

**Always on screen.**
- A "Your journey" card under the stats shows the one next goal. On a phone it's a chip in the stats pill.
- 📍 sets a waypoint to whatever the goal needs next: the next friend, the open gate, or the first challenge without a trophy.
- The Quest Log's "Your journey" page shows the whole path.

**Elsewhere in the game:**
- **Achievements Wall:** reads in path order, with locked worlds' boards padlocked.
- **Island map:** shows 🔒 on locked gates.
- **Pip, Fern and Alby:** their badges show "Warm-up" or "Warm-up passed".
- **The floating marker:** follows the journey.
- **Mills on the green:** talks the student through it.

Farsi and Arabic are included for every fixed piece of text.

## Where the code lives
- `src/data/journey.js` — the rules. Pure: which gates are open, the next goal, the lock text, Mills' lines.
- `src/data/training.js` — the training steps and each world's intro.
- `src/game/journeyStore.js` — the live state, the coach engine, gate colliders, celebrations and the 📍 helper.
- `src/ui/journey/` — the coach and its cards, the celebration, the tracker, the Quest Log page, the trophy-grid strip and the first-person chip.
- `src/styles/journey.css`

Wiring:
- `Player.jsx` (counters, locked gates, first-person drag on touch), `Portal.jsx` and `World.jsx` (gates drawn shut), and `interaction.js` (Mills).
- `HUD.jsx`, `TouchControls.jsx` (👁️), `App.jsx`, `QuestLog.jsx` and the four trophy grids.
- `AchievementsWallUI.jsx` plus `achievements.js` and `achievementsCanvas.js` (the wall), `MapViewer.jsx` and `regionMaps.js` (the map).
- `TaskCompass.jsx`, `progress/storage.js` and `progress/store.js` (the saved journey beats).
- `encounters.js`, `TitleScreen.jsx`, `HowToPlay.jsx` and `translations.js`.

## Checks
- 635 headless checks at the time (644 with cloud progress), all passing, on the cloud copy and again on the Mac copy. That includes 11 new journey checks (JY1–JY11, in `src/dev/journeyChecks.js`).
- vite build clean.
- Played in a headless browser with real key presses: every training step, a warm-up passed through the real store path, the igloo opening and walking through it, the Snowball Sums tour, 7 trophies opening the volcano, the way home and the arrow to the volcano arch, the Quest Log and the wall.
- Screenshotted at desktop sizes, iPhone portrait (390 × 664) and iPad landscape (1080 × 810) with touch controls.

## Deploy status
- The source is synced into `mills-maths-adventure-source/`.
- The build staged in `mills-maths-adventure/` now also carries cloud progress (see `claude/cloud-progress.md`): `index-C6kezmMV.js`, `index-BVM3sG4B.css` and `MathAnswerInput-DvPcIuYn.js`. Earlier bundles are in `Claude outputs/old-build-2026-10-13/` and `old-build-2026-10-13b/`.
- **To go live:**
  1. Run `node tools/build-pwa.mjs` from the repo root.
  2. Commit and push.

## Worth knowing
- **Signed-in students now carry their progress between devices** (cloud progress, built the same day — see `claude/cloud-progress.md`; needs one Firestore rule). Students in demo mode still save per device.
- **Testing the new-player flow on your own computer:** your saves keep every world you've played open. Use a private/incognito window, or "Reset saved progress" on the title screen.
- **Fixed along the way:** the title screen's reset now clears the Emerald Jungle's bests too. Otherwise they would have kept worlds open after a reset.
- **Teacher portal labels don't match the game.** The portal shows Alby as multiplication and Fern as division, but in the game Fern does times tables and Alby does division.
