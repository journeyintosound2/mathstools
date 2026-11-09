/**
 * Playground diagram engines — one shared loader.
 *
 * Each `*-engine.js` beside this file is the Revision Generator's own engine,
 * copied verbatim. It's a plain side-effect script that puts itself on the
 * window as `MMT_<NAME>_ENGINE` (e.g. `MMT_RATES_ENGINE`), so we import them
 * for the side effect only and then look them up by name through `getEngine`.
 * The lookup mirrors `engineFor` in the website's `topic-quiz/engine.js`.
 *
 * To add another engine: drop the file next to this one, add it to `ENGINES`
 * below. Everything else resolves by name.
 */
import "./rates-engine.js";
import "./pythagoras-engine.js";
import "./geometry-engine.js";
import "./area-engine.js";
import "./volume-engine.js";
import "./length-engine.js";
import "./linear-engine.js";
import "./statistics-engine.js";
import "./probability-engine.js";
import "./plane-engine.js";
import "./manipulatives-engine.js";
import "./measure-engine.js";
import "./grid-engine.js";
import "./solids-engine.js";

export const ENGINES = [
  "rates-engine", "pythagoras-engine", "geometry-engine", "area-engine",
  "volume-engine", "length-engine", "linear-engine", "statistics-engine",
  "probability-engine", "plane-engine", "manipulatives-engine", "measure-engine",
  "grid-engine", "solids-engine",
];

/** Look up an engine by its name (matches the `engine:` key in a bank diagram). */
export function getEngine(name) {
  if (typeof window === "undefined") return null;
  const key = "MMT_" + String(name).replace(/-engine$/, "").toUpperCase().replace(/-/g, "_") + "_ENGINE";
  return window[key] || null;
}

/** Render a diagram into `host`, as the website engine does. Returns true on success. */
export function drawDiagram(host, d) {
  if (!host) return false;
  while (host.firstChild) host.removeChild(host.firstChild);
  if (!d || !d.engine) return false;
  const E = getEngine(d.engine);
  if (!E || typeof E.render !== "function") {
    host.textContent = `(diagram engine missing: ${d.engine})`;
    return false;
  }
  try {
    E.render(host, d.config || {});
    return true;
  } catch (e) {
    host.textContent = "(diagram error)";
    if (typeof console !== "undefined") console.warn("[playground diagram]", d.engine, e);
    return false;
  }
}
