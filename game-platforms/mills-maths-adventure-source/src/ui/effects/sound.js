/**
 * Tiny sound engine — NO audio files.
 *
 * Sounds are synthesised on the fly with the Web Audio API, so there are no
 * assets to load and nothing to break offline. Each effect is a short, gentle,
 * classroom-friendly blip.
 *
 * This module is stateless: it just makes sounds. Whether sound is ON/OFF is
 * decided by the UI store (see uiStore.js → playSound), so muting is trivial.
 */

let ctx = null;

// Lazily create (and resume) a shared AudioContext. Created on the first play,
// which always happens in response to a user action, so autoplay rules are fine.
function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// Play a single tone with a soft attack/decay envelope.
function tone(c, freq, startOffset, duration, type = "sine", peak = 0.06) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(c.destination);

  const t = c.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.start(t);
  osc.stop(t + duration + 0.02);
}

/**
 * Play a named effect. Unknown names fall back to a soft blip.
 *   correct       two rising notes
 *   wrong         gentle low double-note (never harsh)
 *   coin          quick bright blip
 *   complete      little 3-note arpeggio
 *   levelUp       rising 4-note fanfare
 *   questComplete pleasant two-note chime
 *   boing         springy wobble (the jungle's bouncy mushrooms)
 *   climb         little two-step (pulling up over a vine wall's lip)
 *   whoosh        a falling swoosh (a toboggan chute / the chairlift)
 *   splash        a cold "plip-plop" (stepping into the snow world's icy lake)
 */
export function play(name) {
  const c = getCtx();
  if (!c) return;

  switch (name) {
    case "correct":
      tone(c, 660, 0, 0.12);
      tone(c, 880, 0.1, 0.14);
      break;
    case "wrong":
      tone(c, 300, 0, 0.16, "sine", 0.05);
      tone(c, 240, 0.12, 0.2, "sine", 0.05);
      break;
    case "coin":
      tone(c, 1040, 0, 0.07, "square", 0.04);
      tone(c, 1320, 0.06, 0.1, "square", 0.04);
      break;
    case "complete":
      [523, 659, 784].forEach((f, i) => tone(c, f, i * 0.1, 0.16));
      break;
    case "levelUp":
      [523, 659, 784, 1047].forEach((f, i) => tone(c, f, i * 0.1, 0.18));
      break;
    case "lava": // a quick hiss-and-pop for the hot-foot bounce
      tone(c, 520, 0, 0.09, "triangle", 0.05);
      tone(c, 340, 0.06, 0.12, "triangle", 0.05);
      tone(c, 880, 0.16, 0.1, "sine", 0.04);
      break;
    case "boing": { // a springy rising wobble for the jungle's bouncy mushrooms
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      const t = c.currentTime;
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.18);
      osc.frequency.exponentialRampToValueAtTime(420, t + 0.32);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.07, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.4);
      break;
    }
    case "whoosh": { // a falling swoosh as the sled tips over the lip
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "triangle";
      const t = c.currentTime;
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(260, t + 0.45);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.52);
      break;
    }
    case "splash": // a cold plip-plop, then a shivery little trill
      tone(c, 420, 0, 0.07, "sine", 0.05);
      tone(c, 260, 0.06, 0.12, "sine", 0.05);
      tone(c, 990, 0.2, 0.05, "triangle", 0.03);
      tone(c, 930, 0.26, 0.05, "triangle", 0.03);
      tone(c, 990, 0.32, 0.06, "triangle", 0.03);
      break;
    case "climb": // a cheerful little two-step when you pull up over a ledge
      tone(c, 587, 0, 0.08, "triangle", 0.045);
      tone(c, 880, 0.07, 0.12, "triangle", 0.045);
      break;
    case "questComplete":
      tone(c, 784, 0, 0.16);
      tone(c, 1047, 0.12, 0.24);
      break;
    default:
      tone(c, 660, 0, 0.1);
  }
}
