# Feedback batch 2: wiped out, Enter, four-way look, next stop, new HUD, challenge card, chest (built 2026-10-13 evening; staged for deploy)

Jeff's second round of feedback (seven screenshots) after playing the batch-1 build.

## What changed

**1. Falling into deep water → "Wiped out!" → back to the start.**
- **The bug:** falling into the sea could loop forever (fall → bounced back → land on the cliff → slide back in…). The old bounce aimed at the last safe spot but fell short whenever that spot was higher than the bounce, landed on the slope and slid back into the water.
- **Now (Jeff's call):** the player sinks with a splash and a "wah-wah-wahhh", the screen closes in like a cartoon iris onto a big card ("Wiped out! / You fell into the deep water! / Back to the start…"), and they reappear at the world's starting spawn point with a reminder to stay in the shallows. About 3 seconds.
- **Where:** Number Island's sea and Snowball Sums' freezing lake. A fall off the rope bridge triggers it as you go under the surface.
- **Lava** (Magma Multiples, Ember Peak) keeps its "hot-foot" hop, but it now lands exactly on solid ground back along your path, so it can't loop either. A second touch hops further back; a third within ten seconds goes to the spawn.

**2. Enter is the interaction key.** Talking to characters, signs, boards and chests all use Enter now (E still works quietly). Every label says Enter: the new "Talk to Pip [Enter ↵]" prompt (with the character's face), the hint bar, Help and the training. Enter never interacts while typing an answer, straight after a conversation closes, or in front of the Achievements Wall (which has its own Enter).

**3. The first-person training step uses all four arrow keys.** In first-person, the four arrow keys on the training panel fill up as you look that way and turn green with a ✓. Only when all four are done does it say "Now press / again to come back". On a phone/iPad it's the same with a drag in all four directions.

**4. "NEXT STOP" when a world opens.** Once Pip, Fern and Alby are passed (and for every world after), a big banner in the world's colour sits at the top of the screen until the student goes in: "NEXT STOP · ❄️ Snowball Sums is open! · Go through the igloo gate — Igloo Hollow, under Frosty Peak", with a live arrow and distance. It also drops the golden waypoint beam on the gate, and the gate's sign says "NEW! … Step inside". (The celebration card still appears first.)

**5. The new player card and top bar.**
- **Top-left:** a level medallion whose gold ring fills with XP, the student's name, a gold XP bar and a coin purse — navy and gold like the rest of the game.
- **Top-right:** one bar of icon tiles (Map, Quests, Results, Help, Sign in, Options) with little M / Q key hints.
- The options menu matches. Phones get a slim pill and round buttons.

**6. The new challenge card** (Pip/Fern/Alby warm-ups, missions, teacher tasks).
- A header in the host's colour with their portrait and the challenge name.
- Result pips (green ✓ / amber), "Question 3 / 8", difficulty stars.
- The question big in the middle and a big answer box.
- Friendly feedback cards and one main button (Check → Next ▸).
- Leaving now asks inside the card ("Keep going / Leave") instead of a browser pop-up.

**7. The slimmed finish screen.** A medal, "Challenge complete!" (or "Nearly there!"), a score ring with "7 / 8 correct", XP and coins counting up, a level-up if there is one, one short save line, and ONE button (Continue, or Try again / Not now). Removed: quest progress, "Show teacher / Copy result", "View Results", "Back to Mission Board" and the long save sentences. Every attempt is still in the Results Centre.

**8. A proper treasure chest.** Planks, iron straps, brass corners and a rounded lid with a lock (a glint winks on it). Open it and the lid swings back to show a heap of glowing coins and gems with sparkles, and it stays open for the rest of the visit. The badge then says "Opened". This applies to the island, farm, snow and school chests.

## Where the code lives
- **Hazards:** `src/game/hazardRescue.js` (timings, hop maths), `src/game/Player.jsx` (the hazard block), `src/ui/effects/WipeoutOverlay.jsx`.
- **Enter:** `isInteractKey` / `isTypingTarget` in `src/game/interaction.js`; the handler is in `src/App.jsx`; the prompt is `src/ui/InteractionPrompt.jsx`.
- **Four-way look:** `journeyTrack.fpvLook` / `noteFpvExit` in `src/game/journeyStore.js`; `src/ui/journey/TrainingPrompt.jsx`.
- **Next stop:** `src/ui/journey/NextStopBanner.jsx`; `freshPortal` in journeyStore; the NEW! sign in `src/game/Portal.jsx`.
- **HUD:** `src/ui/HUD.jsx`.
- **Challenge card and finish screen:** `src/ui/encounters/MathsEncounter.jsx` and `CompletionScreen.jsx`.
- **Chest:** `src/game/TreasureChest.jsx` and `src/game/chestStore.js`.
- **Styles:** `src/styles/polish.css`.

## Checks
- 659 headless checks, all passing. Nine are new: PL1–PL9 in `src/dev/polishChecks.js`.
- vite build clean.
- Screenshotted and played through headless on desktop, iPhone and iPad: the wipe-out, the lava hop, the four-way look, the Enter prompts, the next-stop banner, the new HUD and menu, the challenge card (right, wrong, leave?), the finish screen (pass and not yet), and the chest shut and open.
- The same 659 checks also pass on the Mac copy.

## Deploy status
- The source is synced into `mills-maths-adventure-source/`.
- **The new build** in `mills-maths-adventure/`:
  - `index-gWdhl-_Z.js`, `index-DMCQzgYn.css` and `MathAnswerInput-huoLX8sH.js`
  - the previous bundles were moved to `Claude outputs/old-build-2026-10-13e/`
- **To go live:**
  1. Run `node tools/build-pwa.mjs` from the repo root.
  2. Commit and push.
