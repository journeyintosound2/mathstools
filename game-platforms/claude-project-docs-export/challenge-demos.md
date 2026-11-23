# Challenge demos: every challenge teaches itself (built 2026-10-24; staged for deploy)

Jeff's brief: replace the written "how to play" cards with a live demonstration. Each challenge shows two worked examples, step by step, with explanations. Students can skip the demo, and they can watch it again at any point mid-game. This covers all 40 challenges in Snowball Sums, Magma Multiples, Fraction Farm and the Emerald Jungle. Pip, Fern and Alby's fluency warm-ups are not included.

## What students see

**It's obvious it's a demo.** Every demo opens on a big title card in the middle of the screen. It shows a red "● DEMO MODE" label, the host, "Fern will show you how to play", the challenge name, and "Watch 2 examples · Think along · Then it's your turn!". After a few seconds the card shrinks and glides into the corner, where the host explains each step.
- A "DEMO MODE" banner stays at the top centre for the whole demo, and a soft red glow frames the screen. On phones, the caption strip says "DEMO MODE" instead of the banner.
- Everything grows with the screen, so a big classroom display gets a big caption box and a big hand.
- A bar under each caption fills while the line is up, so the screen never looks frozen.
- Before the second example, a card in the middle of the screen says "Example 2 of 2 — 🤔 Now YOU think first!"
- *(Updated 24 Oct after Jeff's first look: the first version was too small and felt frozen.)*

**The first time** a student opens a challenge, it plays itself. The real 3D stage and the real question card are used, so the demo looks exactly like the game.
- A cartoon glove glides to the actual button and presses it, with a ripple and a gold ring around whatever it is about to touch.
- It types answers into the actual box, one digit at a time.
- It drags the real pole, marker, crack or garden-bed edge. In the Fence Challenge it walks the avatar along the fence; in the Round-Up it herds the cows.
- If the card is covering the part of the stage the hand is working on, the card fades out while it works.

**The host explains every step** in a caption box in the corner, with their portrait. Pip hosts the Snowball Range, Mr. Dawson hosts Column Rectangles, and so on.
- A numbered step chip shows the parts of the round (for example "Step 1 · Fill the crate", "Step 2 · How many altogether?").
- The numbers that matter are shown in bold.

**Two examples, gradual release:**
- **Example 1 ("I do"):** the host thinks aloud through every step. For example: "The crate already has 8 snowballs. A full crate holds 10. 8 and 2 more make 10 — so 2 empty spaces to fill."
- **Example 2 ("you think, then watch"):** before each decision, the host asks the student to predict, with a 🤔 caption and a thinking bar ("How many snowballs will fill the crate to 50?"). Then the demo shows the answer.

**Controls during a demo:**
- **Skip** (or Esc) is always available. Students can't knock the demo off course by tapping, and a stray tap makes the Skip button wiggle.
- **Pause** (or Space).
- **🔊 Read aloud** uses the device's voice and is off by default. It may help EAL/D students and younger readers.

**"Your turn!"** appears at the end of the demo, with two buttons:
- **Watch again** replays both examples.
- **Let's go!** starts a fresh game at Round 1.

**After the first time,** a challenge opens on a ready card showing the host, the challenge name, **▶ Watch how to play** and **Let's go!**. Fence, Round-Up and Order the Parts have no ready card. They never had an intro and still start straight in.

**▶ Demo** sits on every round header. A student can watch the demo at any point mid-game, then "Back to my game" returns them exactly where they were: same round, same score.

**The demo never gives XP, coins or best scores.**

## Teaching choices
- The examples are real rounds from each challenge's own generator. They are picked for friendly numbers and no trick rounds, because the demo teaches the rules and the game teaches the rest.
- Captions carry one idea each (about 15 words) and name what is on screen ("the red pole", "the fish bucket"). Each caption stays up long enough for a young reader.
- **Emerald Jungle demos follow your rules:** any route up the ladder is a good route, and no demo route goes "through one". Every jungle demo repeats the key idea: whatever you do to one vine, do to the other.
- **Text removed from the cards:** the written intros, plus the "how to" lines inside the cards (for example "Drag the red pole…", "Tap two carrots…", "Tap ONE ingot…").
- **Text kept on the cards:** task prompts, live counters, feedback and worked solutions.

## For future challenges
CLAUDE.md now has a standing rule: every new challenge ships with a two-example demo script, a ready card and a ▶ Demo button. The headless checks (DM1–DM5) fail if a challenge has no demo. They also replay every demo to make sure both examples still end on a right answer with full marks.

## Where the code lives
- **Engine:** `src/game/demo/` (`demoRunner.js`, `demoStore.js`, `demoAnchors.js`, `registry.js`)
- **Demo scripts:** `src/game/demo/scripts/` (snow, magma, farm, jungle)
- **On-screen pieces:** `src/ui/demo/` (the overlay, the ready card, the ▶ Demo button)
- **Styles:** `src/styles/demo.css`
- **Checks:** `src/dev/demoChecks.js`

## How it was checked
- **Automatic checks:** all 664 headless checks pass. Five new ones (DM1–DM5) make sure every challenge has a demo, play every demo through to a right answer with full marks, and confirm a demo never gives XP or coins. They also confirm that "Back to my game" puts the round and score back exactly as they were.
- **Laptop size:** all 40 demos played start to finish in a real (headless) browser at 1024×640, with screenshots mid-demo and of the "Your turn!" card. "Let's go!" landed on a fresh Round 1 every time.
- **Phone and iPad:** a cross-section of 12 challenges from all four worlds was played again at iPhone size (390×664) and iPad size (1080×810).
- **Fixed along the way:**
  - The Veggie Plot's answer bar was hidden behind the demo box on phones.
  - The Fence's walking caption mentioned arrow keys on touch devices.
  - A typing hiccup could end a demo early.
  - Slow devices now play the same demo more slowly instead of cutting it short.
  - On a slow iPad, the jungle demos could replay a finished step.

## Still to do
- Watch a few demos on a real computer and an iPad and check the pacing. One constant (`readingMs`) controls it.
- Farsi and Arabic captions.
- Possibly a teacher setting to turn demos off.
