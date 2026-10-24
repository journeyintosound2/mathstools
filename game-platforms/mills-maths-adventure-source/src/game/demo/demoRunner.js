/**
 * THE DEMO RUNNER (2026-10-24) — plays a challenge's two worked examples on
 * the REAL stage and the REAL card.
 *
 * A demo definition (game/demo/scripts/*.js) is:
 *   {
 *     key, name, icon, host,          the challenge + who explains it
 *     store,                          its zustand store
 *     rounds(),                       → [example1, example2] round objects
 *     setup?(store, rounds),          (optional) put the store into play on
 *                                     these rounds — default: demoStart(rounds),
 *                                     else start() + rounds + beginRounds()
 *     ready?(state),                  (optional) "this round is playable"
 *     examples: [async (d, round) => {…}, async (d, round) => {…}],
 *   }
 * Each example is a little screenplay written with the helpers below
 * (d.say / d.think / d.step / d.tap / d.type / d.drag / d.until …). Every tap
 * names BOTH what to aim at on screen and the store action it stands for, so
 *   • in the game the hand glides to the real button and clicks it (or, for
 *     a 3D object, the action runs as the hand presses it), and
 *   • in the headless checks (dry mode) the actions run instantly — which is
 *     how src/dev/demoChecks.js proves every demo still plays correctly.
 *
 * While a demo runs: the student's keys + taps are held back (the overlay's
 * blocker), XP is not banked (roundOutcome.js asks isDemoActive()), and the
 * round header reads "Example 1 of 2". Afterwards the challenge starts fresh
 * (first time / ready card) or goes back to EXACTLY where the student was
 * (the mid-game ▶ Demo button).
 */
import { useDemo, markDemoSeen, demoSeen } from "./demoStore.js";
import { anchorScreen, worldToScreen } from "./demoAnchors.js";
import { captureRoundMark, restoreRoundMark } from "../roundOutcome.js";

export class DemoAbort extends Error {}

const DRY = { on: false };
/** Headless checks: no waiting, no DOM — actions run straight away. */
export function setDemoDry(on) {
  DRY.on = Boolean(on);
}

let current = null; // the running demo
let seq = 0;

const raw = (ms) => new Promise((r) => setTimeout(r, ms));
// Rendered frames so far — waits that depend on a 3D animation finishing
// stretch on a slow device instead of timing out (an iPad that drops to a few
// frames a second plays the same demo, just slower).
let frameCount = 0;
let frameLoop = false;
function countFrames() {
  if (frameLoop || typeof requestAnimationFrame === "undefined") return;
  frameLoop = true;
  const tick = () => {
    frameCount++;
    if (current) requestAnimationFrame(tick);
    else frameLoop = false;
  };
  requestAnimationFrame(tick);
}
const speedOf = () => {
  try {
    const s = Number(typeof window !== "undefined" && window.__demoSpeed);
    return s > 0 ? s : 1;
  } catch {
    return 1;
  }
};

function check(run) {
  if (run.aborted) throw new DemoAbort();
}

async function sleep(run, ms) {
  check(run);
  if (DRY.on) return;
  let left = ms / speedOf();
  while (left > 0) {
    const t = Math.min(left, 40);
    await raw(t);
    check(run);
    if (!useDemo.getState().paused) left -= t;
  }
}

/** Plain text of a caption ("**6**" → "6") for reading time + speech. */
export function plainCaption(text) {
  return String(text || "").replace(/\*\*/g, "").replace(/[_`]/g, "");
}

/** How long a young reader needs for a line (ms). */
export function readingMs(text) {
  const words = plainCaption(text).split(/\s+/).filter(Boolean).length;
  return Math.max(2300, Math.min(7600, 1500 + words * 340));
}

// ---------------------------------------------------------------------------
// Read aloud (optional, per device — the 🔊 toggle on the demo console)
// ---------------------------------------------------------------------------
let voice = null;
function pickVoice() {
  if (voice || typeof window === "undefined" || !window.speechSynthesis) return voice;
  const vs = window.speechSynthesis.getVoices() || [];
  voice = vs.find((v) => /en-AU/i.test(v.lang)) || vs.find((v) => /en-GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  return voice;
}
function speak(run, text) {
  if (DRY.on || !useDemo.getState().speak || typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      const u = new SpeechSynthesisUtterance(plainCaption(text).replace(/[^\p{L}\p{N}\s.,!?'’:;%$+−×÷=–-]/gu, " "));
      u.rate = 0.95;
      u.pitch = 1.05;
      const v = pickVoice();
      if (v) u.voice = v;
      u.lang = (v && v.lang) || "en-AU";
      let done = false;
      const end = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      u.onend = end;
      u.onerror = end;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      setTimeout(end, 16000);
      const poll = setInterval(() => {
        if (run.aborted) {
          clearInterval(poll);
          end();
        }
        if (done) clearInterval(poll);
      }, 120);
    } catch {
      resolve();
    }
  });
}
export function stopSpeaking() {
  try {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Targets — where the hand goes. Each is resolved fresh (React re-renders).
// ---------------------------------------------------------------------------
// The challenge card — plus the Veggie Plot's answer bar, a sibling of it.
const PANEL = ".farm-challenge-panel, .veggie-answer-bar";
function visible(el) {
  if (!el || !el.getBoundingClientRect) return false;
  const r = el.getBoundingClientRect();
  return r.width > 2 && r.height > 2;
}
const norm = (s) => String(s || "").replace(/\s+/g, " ").trim();
function matches(el, re) {
  if (!re) return true;
  const t = [norm(el.textContent), norm(el.getAttribute && el.getAttribute("aria-label"))].filter(Boolean).join(" ");
  return re instanceof RegExp ? re.test(t) : t.includes(re);
}
function findEl(selector, re, scope = PANEL) {
  if (DRY.on || typeof document === "undefined") return null;
  const roots = scope ? [...document.querySelectorAll(scope)] : [document];
  for (const root of roots) {
    const els = [...root.querySelectorAll(selector)].filter((e) => visible(e) && matches(e, re) && !e.disabled);
    if (els.length) return els[0];
  }
  return null;
}
function elPoint(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height * 0.58, rect: { x: r.left, y: r.top, w: r.width, h: r.height }, el };
}

const described = (desc, fn) => Object.assign(fn, { desc });
export const targets = {
  /** A button (or [role=button]) in the challenge card whose text matches. */
  btn: (re, scope) => described(`button ${re}${scope ? ` in ${scope}` : ""}`, () => {
    const el = findEl("button, [role='button']", re, scope);
    return el ? elPoint(el) : null;
  }),
  /** Any element by CSS selector (+ optional text). */
  sel: (selector, re, scope = null) => described(`${selector}${re ? ` ${re}` : ""}`, () => {
    const el = findEl(selector, re, scope);
    return el ? elPoint(el) : null;
  }),
  /** The n-th text box in the card. */
  input: (n = 0) => described(`input #${n}`, () => {
    if (DRY.on || typeof document === "undefined") return null;
    const els = [...document.querySelectorAll(PANEL)].flatMap((root) => [...root.querySelectorAll("input")]).filter(visible);
    return els[n] ? elPoint(els[n]) : null;
  }),
  /** A tagged 3D object (game/demo/demoAnchors.js). */
  anchor: (name, offset) => described(`anchor ${name}`, () => {
    if (DRY.on) return null;
    const p = anchorScreen(name, offset);
    return p ? { ...p, circle: true } : null;
  }),
  /** A world point [x, y, z]. */
  world: (p) => () => {
    if (DRY.on) return null;
    const s = worldToScreen(typeof p === "function" ? p() : p);
    return s ? { ...s, circle: true } : null;
  },
  /** A fixed spot as fractions of the screen. */
  screen: (fx, fy) => () => (DRY.on || typeof window === "undefined" ? null : { x: window.innerWidth * fx, y: window.innerHeight * fy, circle: true }),
};

const DEV = Boolean(typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV);
function resolve(t) {
  if (!t || DRY.on) return null;
  let p = null;
  try {
    p = typeof t === "function" ? t() : t;
  } catch {
    p = null;
  }
  // DEV only: say when a demo can't find what it aims at (the harness reads it).
  if (!p && DEV && t.desc) console.warn(`[demo] no target: ${t.desc}`);
  return p;
}

function setNativeValue(el, value) {
  const proto = Object.getPrototypeOf(el);
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  if (desc && desc.set) desc.set.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

// ---------------------------------------------------------------------------
// The helpers a demo script is written with.
// ---------------------------------------------------------------------------
function helpers(run) {
  const { store } = run.def;
  const setHand = (patch) => useDemo.setState((s) => ({ hand: { ...(s.hand || {}), ...patch, at: Date.now() } }));
  const spotFor = (p) =>
    p.rect
      ? { x: p.rect.x - 7, y: p.rect.y - 7, w: p.rect.w + 14, h: p.rect.h + 14, circle: false }
      : { x: p.x - 36, y: p.y - 36, w: 72, h: 72, circle: true };

  const d = {
    st: () => store.getState(),
    round: () => (store.getState().currentRound ? store.getState().currentRound() : null),
    ...targets,
    sleep: (ms) => sleep(run, ms),

    /** The step label above the caption ("Step 1 · Fill the crate"). */
    step(n, title) {
      check(run);
      useDemo.setState({ step: { n, title } });
    },

    /** The host says a line (**bold** allowed). Waits long enough to read it. */
    async say(text, { ms, wait = true } = {}) {
      // Fire-and-forget lines (said while the hand works) never throw.
      if (!wait) {
        if (!run.aborted) {
          useDemo.setState({ caption: { text, think: false, at: Date.now() } });
          speak(run, text);
        }
        return;
      }
      check(run);
      useDemo.setState({ caption: { text, think: false, at: Date.now() } });
      await Promise.all([sleep(run, ms ?? readingMs(text)), speak(run, text)]);
    },

    /**
     * "Have a think…" — a question with a thinking bar, so the watcher
     * predicts before the demo answers (example 2's pattern).
     */
    async think(text, ms = 3200) {
      check(run);
      useDemo.setState({ caption: { text, think: true, ms: ms / speedOf(), at: Date.now() } });
      await Promise.all([sleep(run, Math.max(ms, readingMs(text) * 0.8)), speak(run, text)]);
    },

    /** Point at something (no click). */
    async point(target, { ms = 900 } = {}) {
      check(run);
      const p = resolve(target);
      if (!p) return false;
      useDemo.setState({ spot: spotFor(p) });
      setHand({ x: p.x, y: p.y, press: false, drag: false, hidden: false });
      await sleep(run, ms);
      return true;
    },

    /** Take the hand + highlight away. */
    rest() {
      useDemo.setState((s) => ({ spot: null, hand: s.hand ? { ...s.hand, hidden: true } : null }));
    },
    clearSpot() {
      useDemo.setState({ spot: null });
    },

    /**
     * Tap something. `target` is where the hand goes; `action` is the store
     * call it stands for — used for a 3D target (no DOM button to click),
     * whenever the button isn't on screen, and in the headless checks.
     */
    async tap(target, action, { linger = 380 } = {}) {
      check(run);
      const p = resolve(target);
      if (!p) {
        if (action) action();
        await sleep(run, 450);
        return;
      }
      useDemo.setState({ spot: spotFor(p) });
      setHand({ x: p.x, y: p.y, press: false, drag: false, hidden: false });
      await sleep(run, 720);
      const q = resolve(target) || p; // it may have moved while we glided
      setHand({ x: q.x, y: q.y, press: true });
      await sleep(run, 170);
      if (q.el && q.el.isConnected) q.el.click();
      else if (action) action();
      setHand({ press: false });
      await sleep(run, linger);
      useDemo.setState({ spot: null });
    },

    /** Several taps on the same thing (◀ ◀ ◀, + + …). */
    async tapTimes(target, times, action, { gap = 320 } = {}) {
      for (let i = 0; i < times; i++) {
        check(run);
        const p = resolve(target);
        if (!p) {
          if (action) action(i);
          await sleep(run, gap);
          continue;
        }
        if (i === 0) {
          useDemo.setState({ spot: spotFor(p) });
          setHand({ x: p.x, y: p.y, press: false, drag: false, hidden: false });
          await sleep(run, 720);
        }
        setHand({ press: true });
        await sleep(run, 140);
        const q = resolve(target) || p;
        if (q.el && q.el.isConnected) q.el.click();
        else if (action) action(i);
        setHand({ press: false });
        await sleep(run, gap);
      }
      useDemo.setState({ spot: null });
    },

    /**
     * Type an answer into a text box, then press its Check / Go button (or
     * Enter). `submit(text)` is the store call that stands for it.
     */
    async type(target, text, submit, { submitBtn, noSubmit = false } = {}) {
      check(run);
      const p = resolve(target);
      if (!p || !p.el) {
        if (submit) submit(String(text));
        await sleep(run, 500);
        return;
      }
      useDemo.setState({ spot: spotFor(p) });
      setHand({ x: p.x, y: p.y, press: false, drag: false, hidden: false });
      await sleep(run, 720);
      setHand({ press: true });
      await sleep(run, 150);
      setHand({ press: false });
      // The card can re-render its box mid-typing (a slow device, a label
      // change) — so find it again if it went away, and never lose a digit.
      let el = p.el;
      const live = () => {
        if (el && el.isConnected) return el;
        const again = resolve(target);
        el = again && again.el && again.el.isConnected ? again.el : null;
        return el;
      };
      const want = String(text);
      setNativeValue(el, "");
      for (let i = 0; i < want.length; i++) {
        await sleep(run, 260);
        if (!live()) break;
        setNativeValue(el, want.slice(0, i + 1));
      }
      await sleep(run, 480);
      if (noSubmit) {
        if (live() && el.value !== want) setNativeValue(el, want);
        return;
      }
      if (!live()) {
        if (submit) submit(want);
        await sleep(run, 400);
        return;
      }
      if (el.value !== want) {
        setNativeValue(el, want);
        await sleep(run, 120);
      }
      // Its own button: in the same row, else the card's first Check / Go.
      const row = el.closest(".weigh-input-row, .magma-input-row, .farm-challenge-buttons") || el.parentElement;
      const re = submitBtn || /check|go!?|✓|submit|answer|done/i;
      let btn = row ? [...row.querySelectorAll("button")].find((b) => visible(b) && matches(b, re) && !b.disabled) : null;
      if (!btn) btn = findEl("button", re);
      if (btn) {
        await d.tap(() => elPoint(btn), () => submit && submit(String(text)));
      } else {
        el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        await sleep(run, 400);
      }
    },

    /**
     * Press-and-drag from one target to another over `ms`, calling
     * `onT(t)` (0…1) as it goes — e.g. slide the pole one gap at a time.
     */
    async drag(from, to, onT, { ms = 1400, frames = 28 } = {}) {
      check(run);
      const a = resolve(from);
      const b0 = resolve(to);
      if (!a || !b0) {
        if (onT) onT(1);
        await sleep(run, 500);
        return;
      }
      useDemo.setState({ spot: spotFor(a) });
      setHand({ x: a.x, y: a.y, press: false, drag: false, hidden: false });
      await sleep(run, 720);
      setHand({ press: true, drag: true });
      useDemo.setState({ spot: null });
      await sleep(run, 160);
      for (let i = 1; i <= frames; i++) {
        const t = i / frames;
        const b = resolve(to) || b0;
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        setHand({ x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, press: true, drag: true });
        if (onT) onT(t);
        await sleep(run, ms / frames);
      }
      setHand({ press: false, drag: false });
      await sleep(run, 300);
    },

    /**
     * Wait for the game (an animation, a store change). `dry` is what makes
     * it happen in the headless checks (where nothing animates).
     */
    async until(pred, { timeout = 12000, dry } = {}) {
      check(run);
      if (DRY.on) {
        if (!pred() && dry) dry();
        if (!pred()) throw new Error(`[demo ${run.def.key}] until() not met in dry run`);
        return;
      }
      // Real time (animations don't speed up), unpaused time only — and only
      // time in which the page actually drew frames (a stalled frame is not
      // the animation being slow to finish, it's the device being busy).
      countFrames();
      let waited = 0;
      let seen = frameCount;
      while (!pred()) {
        await raw(50);
        check(run);
        const drew = frameCount !== seen;
        seen = frameCount;
        if (!useDemo.getState().paused && drew) waited += 50;
        if (waited > timeout) {
          if (dry) {
            dry();
            if (pred()) return;
          }
          throw new Error(`[demo ${run.def.key}] timed out waiting`);
        }
      }
    },

    /** Something to undo when the demo ends early (a held key, a walk). */
    cleanup(fn) {
      run.cleanups = run.cleanups || [];
      run.cleanups.push(fn);
    },
    /** Real time, one frame at a time (walking the avatar). */
    frame: () => (DRY.on || typeof requestAnimationFrame === "undefined" ? Promise.resolve() : new Promise((r) => requestAnimationFrame(() => r()))),
    dry: () => DRY.on,
    check: () => check(run),

    /** Run a store action with no hand (something that just happens). */
    act(fn) {
      check(run);
      fn();
    },
  };
  return d;
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
function snapshotOf(store) {
  const s = store.getState();
  const out = {};
  for (const k of Object.keys(s)) if (typeof s[k] !== "function") out[k] = s[k];
  return out;
}

const NOT_PLAYING = new Set(["idle", "intro", "celebrate", "feedback", "done"]);
function playable(def, s) {
  return def.ready ? def.ready(s) : !NOT_PLAYING.has(s.status);
}

function setupRounds(def, rounds) {
  const { store } = def;
  if (def.setup) {
    def.setup(store, rounds);
    return;
  }
  const st = store.getState();
  if (st.demoStart) {
    st.demoStart(rounds);
    return;
  }
  st.start();
  store.setState({ rounds, roundIndex: 0 });
  const s2 = store.getState();
  if (s2.status === "intro" && s2.beginRounds) s2.beginRounds();
}

/** Start a demo. mode "intro" = then a fresh game; "replay" = then back to the game. */
export function startDemo(def, mode = "intro", carry = null) {
  if (!def) return null;
  if (current) finishDemo(current, { quiet: true });
  const store = def.store;
  const run = {
    id: ++seq,
    def,
    mode,
    aborted: false,
    snapshot: carry ? carry.snapshot : mode === "replay" ? snapshotOf(store) : null,
    mark: carry ? carry.mark : mode === "replay" ? captureRoundMark(store) : null,
  };
  current = run;
  useDemo.setState({
    active: true, key: def.key, mode, example: 0, examples: def.examples.length,
    step: null, caption: null, paused: false, hand: null, spot: null, ended: false, hold: false,
  });
  if (typeof document !== "undefined") document.body.classList.add("demo-on");
  // If the challenge is closed under us (leaving the world …), stop quietly.
  run.unsub = store.subscribe((s) => {
    if (s.status === "idle" && current === run) {
      if (import.meta.env && import.meta.env.DEV && !DRY.on) console.warn("[demo] challenge closed under the demo", new Error().stack);
      finishDemo(run, { quiet: true });
    }
  });
  run.promise = play(run);
  return run;
}

async function play(run) {
  const { def } = run;
  const store = def.store;
  const d = helpers(run);
  try {
    const rounds = def.rounds();
    // A spare copy of the last example so an auto-advance can never run off
    // the end of the list while the "Your turn!" card is up.
    setupRounds(def, [...rounds, rounds[rounds.length - 1]]);
    for (let i = 0; i < def.examples.length; i++) {
      const last = i === def.examples.length - 1;
      useDemo.setState({ example: i, step: null, caption: null, hold: last });
      await d.until(() => store.getState().roundIndex === i && playable(def, store.getState()), {
        timeout: 9000,
        dry: () => {
          const s = store.getState();
          if (s.status === "celebrate" || s.status === "feedback") s.next();
        },
      });
      await sleep(run, i === 0 ? 400 : 700);
      await def.examples[i](d, rounds[i]);
      d.rest();
      // A one-answer challenge ends its round on the feedback card (Fence,
      // Round-Up, Order the Parts, Crate Packing): press Next like a student.
      if (!last && store.getState().status === "feedback" && store.getState().roundIndex === i) {
        await d.sleep(1600);
        await d.tap(targets.btn(/Next/), () => store.getState().next());
      }
      if (!last) {
        await d.until(() => store.getState().roundIndex === i + 1, {
          timeout: 12000,
          dry: () => {
            const s = store.getState();
            if (s.status === "celebrate" || s.status === "feedback") s.next();
          },
        });
      }
    }
    run.completed = true;
    run.finalStatus = store.getState().status;
    await sleep(run, 900);
  } catch (e) {
    if (e instanceof DemoAbort) return run;
    run.error = e;
    if (typeof console !== "undefined") console.warn("[demo]", def.key, e && e.message);
    if (DRY.on) return run;
  }
  if (run.aborted) return run;
  useDemo.setState({ ended: true, hand: null, spot: null, caption: null, step: null });
  return run;
}

/** End a demo: back to the game (replay) or a fresh game (intro). */
function runCleanups(run) {
  for (const fn of run.cleanups || []) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
  run.cleanups = [];
}

export function finishDemo(run = current, { quiet = false } = {}) {
  if (!run) return;
  if (import.meta.env && import.meta.env.DEV && !DRY.on && !run.aborted && !useDemo.getState().ended) {
    console.warn(`[demo] finished early (quiet=${quiet})`, new Error().stack);
  }
  run.aborted = true;
  runCleanups(run);
  if (run.unsub) run.unsub();
  if (current === run) current = null;
  stopSpeaking();
  const store = run.def.store;
  markDemoSeen(run.def.key);
  // Put the game back WHILE the demo flag is still up, so no XP is banked
  // for scores the demo moved.
  if (!quiet && store.getState().status !== "idle") {
    if (run.snapshot) {
      store.setState(run.snapshot);
      restoreRoundMark(store, run.mark);
    } else {
      store.getState().start();
      const s2 = store.getState();
      if (s2.status === "intro" && s2.beginRounds) s2.beginRounds();
    }
  }
  if (!current) {
    useDemo.setState({ active: false, key: null, mode: null, ended: false, hand: null, spot: null, caption: null, step: null, hold: false, paused: false });
    if (typeof document !== "undefined") document.body.classList.remove("demo-on");
  }
}

/** The "Watch again" button on the Your-turn card. */
export function watchAgain() {
  const run = current;
  if (!run) return;
  const carry = { snapshot: run.snapshot, mark: run.mark };
  run.aborted = true;
  runCleanups(run);
  if (run.unsub) run.unsub();
  current = null;
  startDemo(run.def, run.mode, carry);
}

export function skipDemo() {
  finishDemo(current);
}

export function togglePause() {
  const paused = !useDemo.getState().paused;
  useDemo.setState({ paused });
  try {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      if (paused) window.speechSynthesis.pause();
      else window.speechSynthesis.resume();
    }
  } catch {
    /* ignore */
  }
}

export function currentDemo() {
  return current;
}

// ---------------------------------------------------------------------------
// Auto-play: the FIRST time a student opens a challenge on this device, its
// demo plays straight away (they can Skip). After that the challenge opens
// on the ready card (▶ Watch how to play / Let's go!).
// ---------------------------------------------------------------------------
let installed = false;
export function installDemoAutoplay(defs) {
  if (installed) return;
  installed = true;
  for (const def of defs) {
    def.store.subscribe((s, prev) => {
      if (prev.status !== "idle" || s.status === "idle" || current || DRY.on) return;
      if (demoSeen(def.key)) return;
      setTimeout(() => {
        if (!current && def.store.getState().status !== "idle" && !demoSeen(def.key)) startDemo(def, "intro");
      }, 450);
    });
  }
}

/** Run a demo start-to-finish with no waits (headless checks). */
export async function dryRunDemo(def) {
  const prev = DRY.on;
  DRY.on = true;
  try {
    const run = startDemo(def, "intro");
    const res = await run.promise;
    const out = { completed: Boolean(res.completed), error: res.error ? String(res.error.message || res.error) : null, finalStatus: res.finalStatus, state: def.store.getState() };
    finishDemo(run, { quiet: true });
    return out;
  } finally {
    DRY.on = prev;
  }
}
