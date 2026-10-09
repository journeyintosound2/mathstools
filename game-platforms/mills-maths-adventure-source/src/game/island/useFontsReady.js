import { useEffect, useState } from "react";

/**
 * Bumps once the bundled display fonts ("MMA Display" / "MMA Rounded") have
 * loaded, so canvas textures that draw text (signs, the map board, the
 * Achievements Wall) can redraw in the right typeface. Safe everywhere: it
 * falls back to the system font if the Font Loading API isn't there.
 */
let _ready = false;
const _waiters = new Set();
function kick() {
  if (typeof document === "undefined" || !document.fonts || !document.fonts.load) return;
  Promise.all([
    document.fonts.load("64px 'MMA Display'"),
    document.fonts.load("700 32px 'MMA Rounded'"),
    document.fonts.load("800 32px 'MMA Rounded'"),
    document.fonts.load("500 32px 'MMA Rounded'"),
  ]).then(() => {
    _ready = true;
    _waiters.forEach((f) => f());
    _waiters.clear();
  }).catch(() => {});
}
kick();

export function fontsReady() {
  return _ready;
}

export function useFontsReady() {
  const [v, setV] = useState(_ready ? 1 : 0);
  useEffect(() => {
    if (_ready) { setV(1); return undefined; }
    const f = () => setV(1);
    _waiters.add(f);
    return () => _waiters.delete(f);
  }, []);
  return v;
}
