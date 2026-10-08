import React from "react";
import { EffectComposer, N8AO, Bloom, SMAA, Vignette, HueSaturation, BrightnessContrast } from "@react-three/postprocessing";

/**
 * Post-processing stack (W5-B) — the soft-cartoon depth pass. Rendered ONLY on
 * High graphics (see World.jsx); Low skips the composer entirely so phones and
 * tablets keep the fast default render path.
 *
 *  - N8AO      ambient occlusion: soft contact-darkening where objects meet the
 *              ground and where shapes overlap. This is the big anti-washout
 *              upgrade — it puts depth and grounding back into the flat scene.
 *  - Bloom     a gentle glow on the brightest things (the portal, the trophy).
 *              A high luminance threshold keeps the grass/sky from blooming.
 *  - Colour grade (W5-D): a touch more saturation + gentle contrast unifies the
 *              island and schoolyard palettes under one warm, art-directed look,
 *              in ONE place — no per-mesh recolouring.
 *  - SMAA      clean edge anti-aliasing (the composer bypasses the canvas MSAA).
 *  - Vignette  a faint darkening at the corners to focus the eye (very subtle).
 *
 * KEYED on the look (snow vs standard): the effects' props must never change
 * on a LIVE composer. When they did (walking island ↔ snow swapped the Bloom
 * threshold), R3F rebuilt the Bloom effect and re-appended it at the END of
 * the chain — merged with the Vignette after SMAA — and that pipeline wiped a
 * whole colour channel: the snow world went YELLOW (no blue) and the island
 * cyan-green (no red) until the graphics setting was toggled. A fresh
 * composer per look always builds the chain in order. (2026-10-08)
 */
export default function Effects({ snow = false }) {
  return (
    <EffectComposer key={snow ? "snow" : "standard"} multisampling={0} enableNormalPass>
      <N8AO halfRes aoRadius={1.6} distanceFalloff={1} intensity={snow ? 1.4 : 2.2} />
      {/* The snow world is bright white everywhere — only its lamps, glowing
          windows + ice glints should bloom, not the whole snowfield. */}
      <Bloom luminanceThreshold={snow ? 0.985 : 0.8} intensity={snow ? 0.4 : 0.5} mipmapBlur />
      {/* Palette unification (W5-D): a gentle nudge only — enough to feel
          art-directed without the greens going neon. */}
      <HueSaturation saturation={0.04} />
      <BrightnessContrast brightness={0.0} contrast={0.05} />
      <SMAA />
      <Vignette offset={0.32} darkness={0.32} eskil={false} />
    </EffectComposer>
  );
}
