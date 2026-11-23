# The Unit Circle and the Trigonometric Ratios

**File:** `interactive-tools/stage-5/measurement-space/unit-circle-trig-ratios/index.html` (single file, trapezium shell, no Firebase)
**Outcome:** MA5-TRG-P-02 (Trigonometry D), ideas `unit-circle` and `trig-equations`
**Built:** 2026-11-18, reworked several times since after Jeff's feedback. Test surface `window.__UC__`. Settings are saved in `mmt.unitCircle.v2` (settings only; every load starts at the stick).
**Lesson plan:** `lesson-plan.html` beside the tool. It is a 60-minute ELPSA first lesson, reached from the Tools menu ("Lesson plan – intro to the unit circle") and listed under MA5-TRG-P-02.
**Siblings (2026-11-19):**
- Flip cards: `flip-cards/unit-circle-related-angles.html`
- Worksheet creator: `worksheet-creators/stage-5/measurement-space/unit-circle-trig.html`

The Tools menu reads: Lesson plan · Flip cards · Worksheet Creator · Student Quiz (greyed).

## The main sequence
1. **A stick 1 unit long:** a wooden stick with a "1 unit" bracket.
2. **The first quadrant:** the stick lands on the number plane, zoomed in on quadrant 1, and turns to 40°.
   - Only quadrant 1 is drawn (grid, positive axes, a quarter of the dashed circle), so the class focuses there.
   - It can only be dragged between 0° and 90°.
   - The sin, cos and tan graphs (x-axis 0°–90°) are drawn from 0 up to the stick's angle. They wind back when the stick turns back, which suits notice and wonder.
3. **The whole unit circle:** the view zooms out, and the rest of the circle, the grid and the negative axes grow in.
   - The side labels gain signs (±x, ±y).
   - The stick goes up to three turns (0°–1080°, held at both ends). The graphs' x-axis is 0°–360° and zooms smoothly to 720° and 1080° as the stick passes each turn (and back in when it turns back).

## Applications (they branch off the whole unit circle)
**More applications ▾** sits beside the Next/Done button and opens upward. Since 2026-11-19 it is grouped by ratio, three columns wide:
- **Sine:** The Ferris wheel · The tide · A mass on a spring · Mains electricity
- **Cosine:** Sunrise over the year · The pendulum · Phases of the Moon
- **Tangent:** The lighthouse beam · The gradient of a line · A camera follows a runner · A flagpole's shadow

**Moving between applications:**
- Next from the whole circle goes to the Ferris wheel.
- Choosing an application from the unit circle plays its own way in.
- Choosing one from another application morphs straight across (Jeff, 2026-11-18): the old scene fades as the new one comes up, and the hand comes the short way round to the new application's starting angle.
- Back always returns to the step the application came from.

**Most applications run for three turns (0°–1080°).** Past 1080° they start again from 0°, and the graph and table clear. The camera (0°–63.4°, the finish line), the road signs (0°–45°), the gradient (0°–360°) and the shadow (0°–180°, sunrise to sunset) stop at their own limits instead, with a message.

### The Ferris wheel
From a textbook lesson starter: 18 m across, the rider starts halfway up on the right and turns anticlockwise, the ground 2 m below the bottom.
- The stick swings to the bottom and the unit circle turns into the wheel; a stick figure walks in and climbs into the bottom gondola.
- h = 9 sin θ and d = 9 cos θ, measured from the centre (graphs −9 to 9).
- Panel: graphs of the height and the distance across over three turns; a table of 13 positions that fills in as the wheel reaches each one.

### Sunrise over the year (Coffs Harbour, December start)
- Looking east from Jetty Beach (stylised Muttonbird Island, breakwalls, jetty). The horizon is the x-axis, −1 to 1 (±27° of due east; north left, south right).
- The stick is a month hand (30° a month from the December 2025 solstice); the sun rises at the foot of the triangle: **position = cos θ**.
- Steps: the scene · a photo every month stacked into a record · the record turns on its side into the cos graph. The panel graph stands up and turns with it.

### The tide (Coffs Harbour Jetty)
- Side on: the circle becomes a tide clock and the water is always level with the tip of the hand: **h = 0.7 sin θ** m, one turn = 12 h 25 min, starting Saturday 6:00 am at mid-tide rising.
- Steps: the tide clock (Shift + ↑ about an hour) · three tides over a day and a half. Panel: height of the tide plus a table with clock times.

### The pendulum
- A bob on a lab stand always hangs below the foot of the triangle: **x = cos θ**. A ruler reads −1 to 1.
- Steps: the pendulum · a strobe photo every twelfth of a swing, stacked · turned on its side into the cos graph.

### A mass on a spring (2026-11-19; 3 steps)
- The mass hangs to the LEFT of the reference circle and is always **level with the point**: y = sin θ. A ruler reads −1 to 1.
- Step 2, **a pen on the mass**: the paper moves left, so the trace reads left to right in time, like the panel graph.
- Step 3, **beside the pendulum**: the pendulum hangs below the same circle (bob below the point, x = cos θ). Read the point from the side and it is sine; from below, cosine. The panel graphs both and the table gives y and x.

### Mains electricity (2026-11-19; 2 steps)
- A generator seen end-on: the coil's two wires (⊙ ⊗) turn between an N pole (top) and an S pole (bottom). The stick is half the coil.
- **V = 325 sin θ** volts: the most when the wire cuts across the field (top and bottom), none when it slides along it (the sides). A bulb glows with V², and there is a voltmeter.
- 50 turns a second, so one turn is 20 ms; step 2 is three turns (60 ms). The hint explains that 230 V is the effective voltage, so the peak is 230 × √2 ≈ 325 V.

### Phases of the Moon (2026-11-19; 3 steps)
- Looking down on the Earth and the Moon (not to scale), with sunlight from the right. The Moon is at the end of the stick; θ = 0 is a new moon.
- Half the Moon is always lit; the **gold** part is the lit part that faces the Earth, which is what we see.
- An inset shows the Moon **as seen from Coffs Harbour** (Southern Hemisphere, so a waxing Moon is lit on the left), with its name and % lit. A day chip counts days: one turn = 29.5 days.
- **lit = (1 − cos θ)/2.** Step 2 runs three lunar months. Step 3 **builds it from cos θ** in the panel: cos θ → −cos θ (upside down) → 1 − cos θ (up 1) → ÷ 2, with each earlier stage ghosted. On the board a gold bar shows 1 − cos θ out of the whole diameter, 2.
- On a portrait board (phones) the inset sits above the orbit.

### The lighthouse beam (2026-11-19; 3 steps)
- Plan view at night. On the way in, the tan line x = 1 appears first and then **becomes the sea wall**; the lamp is 1 km off the wall.
- The lamp shines both ways (front beam yellow, back beam pink). The spot is **tan θ km** from the nearest point (north positive). The big triangle (lamp, nearest point, spot) is drawn, with the unit triangle faint inside it.
- Step 2: a steady turn with **a mark every 10°**. The turns are equal but the gaps grow: 0.18, 0.19, 0.21 … 2.92 km.
- Step 3: past 90° the spot runs off to infinity, then the back beam brings it back from the far end. The pink marks land on the yellow ones, so **tan repeats every 180°**. The graph colours its branches front and back.
- It is deliberately not named after a real lighthouse. South Solitary Island (about 15–18 km NE of Coffs, Fl. W. 5 s) now has a solar LED beacon, not a rotating beam.

### The gradient of a line (2026-11-19; 2 steps)
- The stick is extended into a line through the origin. A run of 1 to x = 1 gives a rise of tan θ, so **m = tan θ** (1 at 45°, √3 at 60°; the same line every 180°). Range 0°–360°; the table gives exact values.
- Step 2, **road signs**: a road up a hill with a car and a yellow sign. 100 m across climbs 100 tan θ m, so the sign shows **100 tan θ %**. Range 0°–45°.

### A camera follows a runner (2026-11-19; 3 steps)
- Plan view of a 100 m straight. The lane is x = 1, 50 m from the camera, which is level with the start, so the runner is **s = 50 tan θ** m along. Range 0°–63.4°.
- Step 2: the camera turns steadily, marking every 5°. The gaps grow (4.4 m up to 15.2 m), so the runner would have to speed up.
- Step 3: the runner runs steadily at 10 m/s, and the angle follows (`derive:"cam"`). Every 10 m needs a smaller turn (11.3° down to 2.5°), so the camera slows down. A second panel graph shows the camera's angle against time.

### A flagpole's shadow (2026-11-19; 2 steps)
- Side view. The top of the 8 m pole is the origin, and the sun's angle θ is measured there. The ray past the top meets the ground at the shadow's tip, so the shadow is **8 ÷ tan θ m** (−8 ÷ tan θ in the afternoon, when tan θ < 0). The angle is drawn again at the tip.
- 6 am to 6 pm at a pretend steady 15° an hour; the cue says the real sun doesn't quite do this. Step 2 marks the tip every hour: fast at sunrise and sunset, slow at noon, endless when tan θ = 0. The graph shows the tip's position, a tan curve shifted 90°.

## The lesson plan (lesson-plan.html)
It prints as 7 A4 pages: 6 pages of ELPSA plan (experience, language, pictorial, symbolic with on-screen flip cards and the equivalent-statement step, application with the Ferris wheel, close) plus printed answer and sign cards. The header links the tool, the flip cards and the worksheet. An "After this lesson" panel lists the flip-card sets and the worksheet ladder.

## Flip cards: related angles (2026-11-19)
**File:** `flip-cards/unit-circle-related-angles.html`, on the shared flip-card engine.
- The back is the equivalent statement (sin 210° → −sin 30°), with a small unit circle sketch and a one-line reason.
- Ten sets: signs, each quadrant, all four, exact values, complementary angles, solve (related / exact), beyond 360° and negative angles.
- Settings for the angle set, sin/cos only, axis angles, sketch/reason/ghost, and 1/√2 or √2/2.

## Worksheet creator (2026-11-19)
**File:** `worksheet-creators/stage-5/measurement-space/unit-circle-trig.html` (Double Number Line creator frame).
- Sweet → Spicy ladder; sections A–J: read the circle, signs, related angles, exact values, complementary and supplementary angles, solve 0°–360°, read the graph, use it (Ferris wheel, tide, pendulum, daylight), spot the mistake, fluency.
- Exact values are stored as s·√m/d. URL presets: `?levels=sweet,mild&types=A,B,C&key=1`.

### A unit circle to draw on (2026-11-19, Jeff)
For the related-angle questions, students can draw the stick at the angle and drop the triangle on a blank unit circle, so the related angle comes from the picture.
- **The toggle sits on the question type itself.** C (Related angles), D (Exact values) and F (Solve) each have a "Unit circle to draw on" switch on their type card. It is off by default. Each section can have the circles or not, independently, and turning the switch on or off keeps the same questions.
- **C and D:** one blank circle per part, in a row under the parts, lettered a) b) c). There are none for Spicy D's sums and products. Circles are at least 24 mm; on a narrow (three-a-row) card they wrap and centre.
- **F:** one circle beside the working, for drawing every answer.
- The heading adds "Draw each angle and its triangle on the unit circle first."
- **One paper-wide select, "Unit circles to draw on":**
  - blank (axes, circle, 0°/90°/180°/270°)
  - ticks every 30° and 45°, to help weaker students place the angle
  - ticks every 10°
- **The answer key draws the working in:**
  - the stick, with the turn arc, so 400° and −30° show the extra turn or the backwards turn;
  - the dropped triangle;
  - the related angle, shaded and labelled (a small angle is labelled just outside its wedge).
  - In F, every solution is drawn.
- Code: `drawUC(w, o)` and `drawRow()`; `opts.draw.{C,D,F}`; `opts.marks`. URL: `&draw=C,D,F&marks=blank|sp|ten`.
- **Checks:**
  - 92 configurations × 2 (every level × density × marks, key on): nothing past a page or card, the key mirrors the paper, no working on student circles, and every key circle has a stick.
  - The PDF page count equals the preview.
  - The suite with the circles off is unchanged.

## Labels and readouts
- **Side labels:**
  - Letters: x and y, which become ±x and ±y.
  - Numbers.
  - Names: Opposite and Adjacent.
  - Trig names: ±cos θ and ±sin θ. The point is labelled (cos θ, sin θ), and tan θ = sin θ / cos θ.
  - The L key cycles them. Each application has its own labels, such as "325 sin θ" or "8 ÷ tan θ".
- **Collisions:** tick numbers, scene captions and marks step aside automatically when a label would sit on them.

## Settings (optional layers start OFF)
- Off by default:
  - label the point (cos θ, sin θ)
  - related angle
  - quadrant summaries
  - tan θ on the circle
  - angles in radians
  - show the rules (applies to every application: h = 9 sin θ, spot = tan θ, …)
  - the whole curve shown faintly
- Also: exact values (on), turn steps and sweep speed.

## Adding another real-world scene
Since 2026-11-19, new scenes go through the **`XAPPS` registry**: one object per application. Each object has:
- `keys` (its morph parameters in `P`), with a box in `XVIEWS` per key (optionally `boxP` for portrait boards);
- `core(P)` (how the stick, triangle, point and θ look), `labels`, and the SVG layers `back`, `mid` and `front`;
- the panel: `rows` (s and c are graphs drawn by `xGraph`; t is a table from `xTab`), `expr`, `sign`, `graph` and `table`;
- `tag`, `hint`, `drag`, `brief`, `done`, `fillMsg`, `big` (Shift + ↑), `rand`, and optionally `sweep`;
- its steps, each with `prev`, `app` and `appName`, and optionally `range`, `full` or `xreset`. Segment flags are `fill`, `long`, `reset` and `derive`.
- a button in the right group of the menu.

It gets the morph between applications, Back, the tables and the marks automatically. The first four applications are still written directly into `render()` and the panel.

**Checks (2026-11-19):**
- 2,190 layout frames across every new step, both label modes, a spread of angles and 5 viewports.
- 191 interaction and value checks.
- The older suites still pass, and the cue height is unchanged.

## Controls
- **Keys:**
  - →/← step
  - ↑/↓ turn 1°. With Shift, each application has its own step: a month, a photo, an hour, a day, 1 ms, 10°, 5°…
  - Enter random angle
  - L labels · G graphs panel · F full screen · Space start again
- **Angles:** type an angle in the θ box, or drag anywhere on the board.
- **Panel:** row toggles and ▶ Sweep (in the camera's last step, the sweep is a steady runner).

## Possible next
- More scenes: daylight hours at Coffs (a partner to the sunrise, and a shifted graph), a bike wheel's valve.
- The worksheet's "Use it" section could gain the new applications (lighthouse, gradient, Moon).
- The flip cards could link to a worksheet with the drawing circles on (`&draw=C`).
- A student quiz (the Tools menu row is greyed).
