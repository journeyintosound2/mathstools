import { useEffect, useState } from "react";

/**
 * Live CSS media-query match (re-renders when the screen is rotated or the
 * window resized). Used where the LAYOUT itself changes on small screens
 * (the compact HUD), not just its styling.
 */
export function useMediaQuery(query) {
  const get = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    if (mq.addEventListener) mq.addEventListener("change", on);
    else mq.addListener(on);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", on);
      else mq.removeListener(on);
    };
  }, [query]);
  return matches;
}

/** Phones (either way up) and very short windows: the compact HUD. */
export const COMPACT_QUERY = "(max-width: 700px), (max-height: 500px)";
