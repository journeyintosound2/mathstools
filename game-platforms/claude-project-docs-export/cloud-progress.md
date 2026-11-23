# Cloud progress: sign in anywhere, carry on (built 2026-10-13; updated 2026-11-09)

A signed-in student's whole save now lives in the cloud. When they sign in on any computer, iPad or phone, the game picks up where they left off. That includes the journey, which worlds are open, every trophy, XP and coins, and the warm-ups and keys.

Students who don't sign in (demo mode) keep saving on the device, exactly as before.

## Update 2026-11-09: one student per save

**Why:** Jeff's HUD showed "Benji" (his son's explorer, with his son's character) on Jeff's own account. Signing out also left the game running with the old save.

**The explorer travels with the student.**
- The explorer's name and character are now part of the cloud save.
- When a different student signs in on a shared computer, they start with their account's first name and the default character. Their own explorer (from the cloud or this computer) replaces that a moment later.
- An explorer is only ever uploaded to the student it belongs to, so one student's name can never reach another student's account.
- **Once-off rename:** a save from before this update takes the student's account first name the first time they sign in, and keeps its character. They can rename in "Change character". Jeff's own account fixes itself this way.

**The character card.** If a different student code is typed and the name and character aren't touched, the new student's own name and character are used. Before, the fields kept showing the previous student's.

**Signing out goes back to the title screen.** This works from the ☁ chip, or from the title screen's "Sign out" item. In order, signing out:
1. Sends the last save to the cloud.
2. Signs the student out.
3. Puts their save aside on this computer, in case the cloud couldn't be reached. Signing back in brings it back, even offline.
4. Leaves the computer clean for the next student: no progress, name, results or times-table records.
5. Reloads at the title screen, dropping any `?code=` from the address so the student isn't signed straight back in.

**The Timestable Temple's times-table square travels too.** It's merged fact by fact: the record with more answers wins.

**Code and checks.**
- Code: `cloud/progressMerge.js` (`explorerOf`, `cleanExplorer`, `mergeFacts`), `cloud/progressSync.js` (`claimProfile`, `clearDeviceForNextStudent`), `cloud/explorerProfile.js` (`confirmExplorer`) and `cloudSession.signOutAndLeave()`.
- Three new checks, CP10–CP12, cover a shared computer, signing out and back in, and the square travelling.
- The Firestore rule is unchanged: both new fields sit inside the `progress` map.

## Cost

- Each student has **one small document**: about 25 KB, plus up to about 6 KB for a full times-table square.
- Signing in reads it **once**.
- While they play, it's saved at most **every ~30 seconds**, or within ~8 seconds of a milestone (a trophy, a warm-up, a journey step).
- A class of 30 playing for an hour is roughly 30 reads and up to 3–4 thousand writes. The first time each student signs in there is also a one-off read of their old achievement records.
- Firestore's free allowance is 50,000 reads and 20,000 writes **a day**. Past that, Blaze charges about 9 US cents per 100,000 writes.
- Expect $0, or a few cents in a very busy month.

## What travels with the student

**Travels:**
- XP, level and coins
- Pip's, Fern's and Alby's warm-ups, the Playground keys, and teacher tasks
- Badges
- The adaptive difficulty levels
- The journey: training, world tours and gate celebrations
- The trophy bests in every world (Timestable Temple included)
- Which worlds they've visited
- Farm teacher tasks they've finished
- **(2026-11-09)** The explorer's name and character, and the times-table square

**Stays on the device:**
- Settings (language, graphics, touch controls)
- The Results history (the teacher already has every attempt in the portal)
- Whatever challenge they were in the middle of

## How the two saves combine

On sign-in, the cloud save and the device's save are merged, keeping the best of both:
- **Numbers** (XP, coins, best scores): the highest wins.
- **Lists** (warm-ups, keys, badges, journey steps): everything from both.
- **The explorer:** the most recently chosen wins.
- **Times-table facts:** the record with more answers wins.

So progress is never lost. That holds even if a student played on two iPads, or played a bit before signing in.

The cloud copy only ever grows. A device that's been reset, or an old browser tab, can't shrink it.

## Shared iPads

- The game remembers which student's save is on each device.
- When a different student signs in, the previous student's save is set aside on that iPad, and the new student gets their own. This happens straight away, even if the internet is down, so two students' progress never mixes. **(2026-11-09)** The previous student's name and character don't carry over either.
- When the first student signs back in, theirs comes back.
- **(2026-11-09)** Signing out clears the device for the next student and returns to the title screen.
- On a device that has never had a student signed in, the first student to sign in keeps whatever progress is already on it. That's the "keep what they've reached" rule. On a shared class iPad that's been played anonymously, a teacher may want to use "Reset saved progress" first.

## What students see

- **The ☁ chip** (top right, or in ☰ on a phone) has a small dot:
  - green: saved
  - pulsing blue: saving or loading
  - amber: can't reach the cloud, so it's saved on the device and will be sent later
  - grey: cloud progress isn't switched on yet
- **The sign-in panel**, when signed in, shows where their progress is saved and has a **Sign out** button. A note under it explains that signing out saves their progress and goes back to the start screen for the next student.
- **The title screen's** sign-in item reads **"Sign out ✓ name"** when someone is signed in.
- **"Reset saved progress"** on the title screen signs the student out first. It only clears the device, so a signed-in student's progress comes back from the cloud the next time they sign in.

Farsi and Arabic are included for the new lines.

## Switching it on: one Firestore rule

Until this rule is in place, sign-in works as before and progress saves on the device. The dot shows grey.

**Easiest:** the full production rules with this block already added are in `game-platforms/Claude outputs/firestore-rules-2026-10-13.txt` (made 2026-10-13 from the live rules Jeff copied out of the console; nothing else changed).
1. Open the Firebase console for **mills-maths-tools**.
2. Go to **Firestore Database → Rules**.
3. Select everything and paste that file's contents over it.
4. Click **Publish**.

The production file uses its own helper functions (`isStudent()`, `myStudent()`, `isAdmin()` …) and also lets the admin account read saves. To add the block by hand instead, use the version below: it doesn't depend on any helpers. Paste it inside `match /databases/{database}/documents {`, just **above** the final `match /{document=**}` default-deny block.

```
    // Mills Maths Adventure — cloud progress (2026-10-13): one save per student.
    match /adventureProgress/{studentCode} {
      allow read: if request.auth != null && (
           (request.auth.token.role == 'student' && request.auth.token.studentCode == studentCode)
        || (request.auth.token.role == 'teacher' && resource.data.teacherCode == request.auth.token.teacherCode));
      allow create, update: if request.auth != null
        && request.auth.token.role == 'student'
        && request.auth.token.studentCode == studentCode
        && request.resource.data.studentCode == studentCode
        && request.resource.data.teacherCode == request.auth.token.teacherCode
        && request.resource.data.v is number
        && request.resource.data.progress is map
        && request.resource.data.bests is map
        && request.resource.data.flags is map
        && request.resource.data.keys().hasOnly(['v', 'studentCode', 'teacherCode', 'className', 'updatedAt', 'updatedAtClient', 'progress', 'bests', 'flags']);
      allow delete: if false;
    }
```

What the rule allows:
- A student can only read and write **their own** save, and only in the game's exact shape.
- A teacher can read their own class's saves.
- Nobody can delete a save from the game. To wipe a student's progress, delete their document in the console.

This block uses the sign-in claims directly, so it works whatever helper functions the live rules have. It does the same as the `adventureProgress` block in the repo's `firestore.phase3d.claims.rules`.

## Students who already played signed-in

The first time one of these students signs in, there's no cloud save yet. The game rebuilds what it can from their existing achievement records:
- passed warm-ups, Playground keys and teacher tasks
- Fraction Farm best scores

It merges that with whatever is on the device they're using. Snowball Sums, Magma Multiples and Emerald Jungle bests were never sent to the cloud before, so for those worlds only the device's own copy counts on that first sign-in.

## Where the code lives

- `src/cloud/progressMerge.js` (pure): what travels, the merge, cleaning a cloud document, the rebuild from achievements, save timing.
- `src/cloud/progressSync.js`: loading at sign-in, the autosave, shared devices, the never-shrink rule, claiming the profile, and clearing the device at sign-out.
- `src/cloud/explorerProfile.js`: the character card's explorer choice.
- **Wiring:**
  - `cloudSession.js`: sign-in, sign-out (`signOutAndLeave`) and demo mode.
  - `firebaseClient.js` / `firebaseConfig.js`: the document read and write.
  - `progress/store.js`: `applyCloudProgress`.
  - `results/resultStore.js`: `replaceResults`.
  - `App.jsx`: starts the autosave.
- **UI:** `ui/cloud/ProgressSyncDot.jsx`, `ui/cloud/ProgressSyncLine.jsx`, `CloudLogin.jsx`, `HUD.jsx`, and `TitleScreen.jsx` (the reset).
- **Rules:** `firestore.phase3d.claims.rules` and `src/cloud/firestoreRulesDraft.js`.

## Checks

- **685 headless checks**, all passing (as of 2026-11-09). CP1–CP12 cover cloud progress:
  - what travels, the merge, cleaning a cloud document, the rebuild from old records and save timing
  - a new device picking up the cloud save
  - a shared iPad, including offline
  - the autosave gaps
  - the rule
  - **(2026-11-09)** the explorer belonging to the student, signing out and back in, and the square travelling
- The live sign-in code was also run against a stand-in Firestore: a first sign-in, a second device, the rule missing, a slow network, and a refused save.
- **(2026-11-09)** Sign-out tested in a real browser mid-game. It came back at the title with 0 XP, no name and no owner, and the save was kept aside for that student.

## Deploy status

- **2026-11-09:** source and build synced into `mills-maths-adventure-source/` and `mills-maths-adventure/` (`index-m_TzkN4L.js`).
- **To go live:**
  1. Run `node tools/build-pwa.mjs` from the repo root.
  2. Commit and push.
- The Firestore rule from 2026-10-13 is unchanged.
