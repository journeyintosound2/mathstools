# Timestable Temple — times-table fluency world (built 2026-11-08)

**Status:** built and tested; staged for deploy once synced to the Mac. Replaces the "Sunstone Desert" name (same desert world, now with challenges).

## Where it sits in the journey
- The golden gate on Number Island opens **with Magma Multiples** once Snowball Sums has 7 trophies (🥉 or better).
- It's a **branch**: it holds nothing up. Fraction Farm still only needs Magma's trophies.
- On the journey path it's drawn straight after Snowball Sums. Mills, the next-stop banner and the gate celebration all know about it.

## The fifteen stations (they open one at a time — a 🥉 opens the next)
| # | Station | Where |
|---|---|---|
| 1–3 | 10s, 5s, 11s | Bazaar Square (the Anchors) |
| 4 | Anchor Mix (10, 5, 11) | Bazaar Square |
| 5–7 | 2s, 4s, 8s | the Oasis shore (the Doubling family) |
| 8 | Doubling Mix (2, 4, 8 + some anchors) | the Oasis |
| 9–12 | 3s, 6s, 9s, 12s | top of the Red Mesa (the Threes family) |
| 13 | Threes Mix (3, 6, 9, 12 + earlier tables) | Red Mesa |
| 14 | 7s | Sun Temple |
| 15 | Grand Mix (all 78 facts, leaning to weak ones) | the Sunstone, top of the Great Pyramid |

No division (Jeff: a separate world later).

## A round
- **Clock:** 90 seconds. Medals count only the correct answers.
- **Typing:** answers go in by themselves once they have enough digits, so there's no Enter to press. Enter or ✓ sends a shorter answer early.
- **Slips:** the right answer appears with a "quick way" (e.g. 8 × 7 → double the 4s). The student types it to continue. A slip costs time, not points, and the fact comes back a few questions later.
- **Practice:** the same game with no clock and no medal. The facts go green as they're answered, and "Looks like you're ready — go for gold?" appears once they're all green.

### Targets (based on answer digits)
`floor(90 ÷ (thinking time + 0.4 s × the station's average answer digits))`.

| Medal | Thinking time per question |
|---|---|
| Gold | 1.2 s |
| Silver | 2.2 s |
| Bronze | 3.5 s |

Mixes allow +0.2 s for switching between tables.

| Station | 🥉 | 🥈 | 🥇 |
|---|---|---|---|
| 2s | 21 | 31 | 48 |
| 10s | 20 | 29 | 42 |
| 12s | 20 | 28 | 42 |
| Mixes (about) | 20 | 28 | 41 |

All of these numbers can be tuned at the top of `src/data/temple/templeTables.js`.

## Making fluency last
- **Every answer is recorded per fact:** right or wrong, and how fast.
- **Fluent:** a fact is fluent once it's answered fast on **two different days**. Fast means within 3 s plus 0.4 s per digit. A slip resets it.
- **Spaced review:** fast answers push a fact's next review further out (1 → 3 → 7 → 14 → 30 days). A slip brings it back today.
- **Temple Warm-up:** a 60-second round from the student's due facts. It comes from Dash and the square. The first warm-up each day earns coins.
- **Times-table square:** a 12 × 12 grid (78 facts), shown on the wall by the arrival and as a card. Each fact shows fluent / getting there / missed / not tried, and a blue edge means it's due for review.

## Coins & XP
- **XP:** 1 per correct answer.
- **Timed rounds:** 1 coin per 5 correct, plus 10 / 20 / 40 coins the first time a station reaches bronze / silver / gold.

## In the world
- **Station stones:** each stone's gem shows its state: locked, open, or its medal. The next station's gem floats under a gold ring.
- **Dash the camel 🐫** (by the Times-Table Wall) shows the next station and the way to it, the warm-up, and all 15 stations.
- **Demo:** one shared demo for all stations, with Dash as the host.

## Not yet
- Division (Jeff: a separate world).
- The fact records are per device: medals sync, but the square doesn't yet.
- A teacher view of the square.
- A board for the Temple on the island Achievements Wall.

## Tested
- **Checks:** 682/682 headless checks pass (TT1–TT11 are new). The demo checks pass and the build is clean.
- **Browser:** played through end to end on desktop: station → practice → slip → timed → results → next station opens → hub → square.
- **Phones and iPad:** iPhone in both orientations and iPad.
