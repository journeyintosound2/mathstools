# Feedback batch: dialogue box, bigger training, no skipping, new game, admin mode (built 2026-10-13; staged for deploy)

These changes follow Jeff's feedback after playing the live journey build.

## What changed

**1. The trophy stand in Mission Plaza is gone.** The Achievements Wall by the arrival arch shows every world's trophies, so the plaza stand was redundant. The Mission Board and the fountain stay.

**2. A new dialogue box for every conversation.** It covers Mills, Pip, Fern, Alby, the teachers, the challenge hosts and the treasure chests.
- **Layout:** it sits along the bottom of the screen, so the character you're talking to stays in view.
- **Who's talking:**
  - A round **portrait** of the speaker, rendered from their own 3D model.
  - A name plate in their colour, with what they do ("Your guide", "Times tables", "Teacher").
- **The text:**
  - Each line eases in.
  - Important words (worlds, friends, medals, trophies, numbers like "6 of 7") are in bold.
- **Getting around:**
  - Dots show how far through the conversation you are.
  - **‹ Back** re-reads a line. **Skip ››** jumps to the last line, where any choice is.
  - Click or tap anywhere on the box, or press Enter, Space or →, to go on. ← goes back and Esc closes.

**3. The training is big and clear.** While it runs, one large prompt owns the screen: bottom-centre on computers, under the top bar on phones and iPads.
- **What to press:**
  - It shows the **real keys** as keycaps (W A S D, Shift, Space, /, E, Enter, M), and they **light up green the moment they're pressed**.
  - On a phone or iPad it shows a drawing of the control instead, with a **pulsing ring and a pointing hand on the real button** (joystick, Jump, 👁️, Talk, 🗺️).
- **It changes as you go:**
  - "Now press / again to come back".
  - "Press E to talk to Mills!" once you're next to him.
  - A live arrow and distance when there's somewhere to walk to.
- **Feedback:** a fill bar (or three jump circles), then a big green ✓ and a cheer ("Wow, that's fast!") before the next step.
- **Less clutter:** everything that would compete for attention (the journey card, the hint bar, the waypoint chip) steps aside meanwhile.

**4. The training can't be skipped.**
- The "Skip training" and "Skip — I know how to play" buttons are gone. Every player does it once, including anyone who skipped it before.
- If a step somehow can't be done, a small "Stuck? Skip this step" appears after a full minute on it.

**5. Start new game** (title menu).
- After a confirm, it clears everything this device holds for the game and starts fresh on the character card.
- A signed-in student is signed out first, so their cloud save isn't touched.

**6. Admin mode** (for testing).
- **Unlocking it:** a small "🔒 Admin" link at the bottom of the title screen asks for the password. The password is stored only in scrambled (hashed) form. This is a convenience lock, not real security.
- **What it does:**
  - Every world gate is open.
  - A 🛠️ Admin button in the game jumps straight to any world, can finish the training, and turns admin mode off.
- **What it doesn't do:** it never changes trophies, keys or the journey, and gates it opens are never celebrated.

Start new game and admin mode have also been checked on an iPhone (upright and sideways) and an iPad. On a phone, the admin panel's "Turn admin mode off" button sat below the fold, so the panel now compacts on small screens and keeps its buttons pinned to the bottom.

## Where the code lives
- **Dialogue:**
  - `src/ui/dialogue/DialogueBox.jsx` is the box itself.
  - `src/ui/dialogue/speakers.js` holds each speaker's portrait, colour and role, plus the bold words.
  - `public/portraits/` holds the 17 portraits (112 KB in total).
- **Training:**
  - `src/ui/journey/TrainingPrompt.jsx` is the big prompt.
  - `src/data/training.js` holds each step's keys, touch control and cheer.
- **Admin mode:** `src/data/adminMode.js`, `src/game/adminStore.js` and `src/ui/admin/AdminPanel.jsx`.
- **Title screen:** Start new game and the admin lock are in `src/ui/TitleScreen.jsx`.

## Checks
- 650 headless checks, all passing, on the cloud copy and again on the Mac copy. Six of them are new (UX1–UX6).
- vite build clean.
- **Screenshotted:** the training, the Mills step and the dialogue box on desktop (960 × 560), iPhone (390 × 664) and iPad (1080 × 810).
- **Played through on desktop, iPhone and iPad:** the title menu, Start new game, the admin password (wrong, then right), the admin panel (from the ☰ menu on a phone), finishing the training from it, and jumping to another world with every gate open.

## Deploy status
- The source is synced into `mills-maths-adventure-source/`.
- **The new build** in `mills-maths-adventure/`:
  - `index-CZuuOiYe.js`, `index-8AuUqOY3.css` and `MathAnswerInput-C7qKTpaL.js`
  - a `portraits/` folder
  - the previous bundles were moved to `Claude outputs/old-build-2026-10-13d/`
- **To go live:**
  1. Run `node tools/build-pwa.mjs` from the repo root. This also adds the portraits to the offline list.
  2. Commit and push.
