import React, { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";

import { modelConfig, modelUrl, playerModelKey, PLAYER_CHARACTERS } from "./characterModels.js";
import { playerState } from "../sessionStore.js";
import { flattenClipTravel } from "./rootMotion.js";
import PlayerAvatar from "./PlayerAvatar.jsx";

/**
 * PLAYER CHARACTER — the student's chosen rigged model (Explorer / Cool Cat /
 * DJ Goat, per profile.character) with movement-driven animation:
 *   idle                standing still
 *   walk                moving at normal speed
 *   run                 moving while Shift is held (2× speed)
 *   jump over obstacle  airborne (Space)
 * The current mode is published each frame by Player.jsx as
 * `playerState.animMode`; this component just crossfades to match. Falls back
 * to the primitive avatar until the model loads (or if it fails).
 */

// Preload every selectable player model so switching (and the welcome-screen
// preview) is instant.
try {
  PLAYER_CHARACTERS.forEach((c) => {
    const file = modelConfig(c.model).file;
    if (file) useGLTF.preload(modelUrl(file));
  });
} catch { /* ignore */ }

function findClip(names, patterns, fallback) {
  for (const p of patterns) {
    const hit = names.find((n) => p.test(n));
    if (hit) return hit;
  }
  return fallback;
}

function RiggedPlayer({ modelKey, modeOverride }) {
  const cfg = modelConfig(modelKey);
  const { scene, animations } = useGLTF(modelUrl(cfg.file));
  // Each player character gets its OWN copy of the model. useGLTF hands every
  // caller the same cached scene, and a three.js object can only live in one
  // place: the title screen's character turntable (its own little canvas)
  // would take it from the in-game player behind the title — and when the
  // card closed, the player was left with nothing to draw (the "invisible
  // character" bug, 2026-10-09). SkeletonUtils.clone rebinds the skin to the
  // clone's own bones, so each copy animates independently.
  const model = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const ref = useRef();

  // Which clip is the jump — resolved from the config (or the jump/obstacle
  // keyword) against the RAW clip names, BEFORE the mixer is built.
  const jumpClipName = useMemo(() => {
    const rawNames = animations.map((a) => a.name);
    const v = cfg.clips ? cfg.clips.jump : undefined;
    if (v === false) return null; // model has no jump clip
    if (v && rawNames.includes(v)) return v;
    return findClip(rawNames, [/jump|obstacle/i], null);
  }, [animations, cfg]);

  // Flatten the jump clip's horizontal (Hips) travel so it animates IN PLACE.
  // Horizontal jump travel is owned by the game (Player.jsx `jumpVel`); without
  // this the mesh would leap forward via the clip and then SNAP BACK to neutral
  // when the clip ends — the "slide-back on landing" bug. Doing it here, before
  // useAnimations builds the mixer, is what makes it actually take effect.
  const preparedAnimations = useMemo(() => {
    if (!jumpClipName) return animations;
    return animations.map((a) => (a.name === jumpClipName ? flattenClipTravel(a) : a));
  }, [animations, jumpClipName]);

  const { actions, names } = useAnimations(preparedAnimations, ref);
  const current = useRef(null);

  const clips = useMemo(() => {
    // Explicit per-clip config (characterModels `clips`) wins — used when a
    // model's clip names don't match their content. `false` means "this
    // model has NO such clip" (blocks the regex fallback — important when a
    // misleading name like Idle_4 would otherwise match). Regex otherwise.
    const resolve = (key, regexes) => {
      const v = cfg.clips ? cfg.clips[key] : undefined;
      if (v === false) return null; // explicitly absent from the model
      if (v && names.includes(v)) return v;
      return findClip(names, regexes, null);
    };
    const idle = resolve("idle", [/idle/i]);
    const walk = resolve("walk", [/walk/i]);
    const run = resolve("run", [/run/i]);
    const jump = resolve("jump", [/jump|obstacle/i]);
    const fallback = idle || walk || names[0] || null;
    return {
      // No true idle clip → stand-in: the walk clip played VERY slowly.
      idle: idle || walk || fallback,
      idleIsSlowWalk: !idle && Boolean(walk),
      walk: walk || fallback,
      run: run || walk || fallback,
      jump: jump || fallback,
    };
  }, [names, cfg]);

  // JUMP TRAVEL. The jump clip is flattened to animate IN PLACE (see
  // `preparedAnimations` above), and horizontal travel is owned by the game
  // (Player.jsx `jumpVel`). So there is nothing to publish from here — the mesh
  // no longer travels on its own, which is exactly what removes the slide-back
  // when the clip ends.

  useFrame(() => {
    const mode = modeOverride || playerState.animMode || "idle";

    if (mode === current.current) return;
    const prevMode = current.current;
    current.current = mode;
    const want = clips[mode] || clips.idle;
    if (!want) return;
    const action = actions[want];
    if (!action) return;
    const prevClip = prevMode ? clips[prevMode] || clips.idle : null;
    if (want !== prevClip) {
      if (prevClip && actions[prevClip]) actions[prevClip].fadeOut(0.18);
      action.reset().fadeIn(0.18).play();
    }
    // Idle-without-an-idle-clip: freeze-ish the walk into a gentle sway.
    action.setEffectiveTimeScale(mode === "idle" && clips.idleIsSlowWalk ? 0.12 : 1);
  });

  return (
    <group ref={ref} scale={cfg.modelScale || 1} position={[0, cfg.yOffset || 0, 0]} rotation={[0, cfg.rotationY || 0, 0]}>
      <primitive object={model} />
    </group>
  );
}

class PlayerModelBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { /* fall back silently */ }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function PlayerCharacter({ profile = {}, modeOverride = null, character = null }) {
  // `character` prop (a PLAYER_CHARACTERS id) overrides the saved choice — used
  // by the welcome-screen toggle to preview a character before it's saved.
  const modelKey = playerModelKey(character || profile.character);
  const fallback = (
    <PlayerAvatar
      avatar={{
        body: profile.color, skin: profile.skin, hair: profile.hair,
        hairStyle: profile.hairStyle, hat: profile.hat,
        hatColour: profile.hatColour, glasses: profile.glasses,
      }}
    />
  );
  if (!modelConfig(modelKey).file) return fallback;
  return (
    <PlayerModelBoundary key={modelKey} fallback={fallback}>
      <Suspense fallback={fallback}>
        <RiggedPlayer modelKey={modelKey} modeOverride={modeOverride} />
      </Suspense>
    </PlayerModelBoundary>
  );
}
