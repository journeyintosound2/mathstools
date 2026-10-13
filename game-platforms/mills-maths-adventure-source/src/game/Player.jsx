import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { useKeyboard } from "./useKeyboard.js";
import { useProgress } from "../progress/store.js";
import { useUI } from "../ui/effects/uiStore.js";
import { journeyTrack, useJourney, lockedPortalColliders, lockForPortal } from "./journeyStore.js";
import { useSession, playerState, clearMoveTarget, touchInput } from "./sessionStore.js";
import { getColliders } from "../data/worldColliders.js";
import { getRegion, clampToBounds } from "../data/regions.js";
import { resolveCircle, groundHeightAt, PLAYER_RADIUS, STEP_UP, STEP_DOWN } from "../systems/collisionEngine.js";
import PlayerCharacter from "./characters/PlayerCharacter.jsx";
import { useFarmChallenge } from "./farmChallengeStore.js";
import { useRoundUp } from "./roundUpStore.js";
import { useOrderParts } from "./orderPartsStore.js";
import { useCratePacking } from "./cratePackingStore.js";
import { useMilkSplitter } from "./milkSplitterStore.js";
import { useWeighStation } from "./weighStationStore.js";
import { useTradingPost } from "./tradingPostStore.js";
import { useVeggiePlot } from "./veggiePlotStore.js";
import { usePlankGap } from "./plankGapStore.js";
import { useFarmShop } from "./farmShopStore.js";
import { useSnowballRange } from "./snowballRangeStore.js";
import { useRinkGlide } from "./rinkGlideStore.js";
import { useGroveLights } from "./groveLightsStore.js";
import { useMeadowLevel } from "./meadowLevelStore.js";
import { useSledSlope } from "./sledSlopeStore.js";
import { useVillageSplit } from "./villageSplitStore.js";
import { useColonyPairs } from "./colonyPairsStore.js";
import { useCaveCrystals } from "./caveCrystalsStore.js";
import { useLodgeYard } from "./lodgeYardStore.js";
import { useAuroraLookout } from "./auroraLookoutStore.js";
import { useActiveSnowChallenge } from "./farmChallengeActive.js";
import { activeMagmaChallengeKey, useActiveMagmaChallenge, magmaStore } from "./magma/magmaActive.js";
import { getMagmaChallenge } from "../data/magma/magmaChallenges.js";
import { MAGMA_REGION_ID } from "../data/magma/magmaLayout.js";
import { activeJungleChallengeKey, useActiveJungleChallenge, jungleStore } from "./jungle/jungleActive.js";
import { getJungleChallenge } from "../data/jungle/jungleChallenges.js";
import { JUNGLE_REGION_ID } from "../data/jungle/jungleLayout.js";
import {
  CHALLENGE_FENCE,
  ORDER_VIEW_SPOT, CRATE_AREA, CRATE_VIEW_SPOT,
  MILK_AREA, MILK_VIEW_SPOT, WEIGH_AREA, WEIGH_VIEW_SPOT,
  TRADE_AREA, TRADE_VIEW_SPOT, VEGGIE_AREA, VEGGIE_VIEW_SPOT,
  PLANK_AREA, PLANK_VIEW_SPOT,
  SHOP_AREA, SHOP_VIEW_SPOT,
} from "../data/farm/farmLayout.js";
import { farmChallengeView, FARM_CAMERA_SHAKES, ROUNDUP_CAM_YAW } from "../data/farm/farmCameras.js";
import { challengePadY } from "../data/farm/farmTerrain.js";
import { snowChallengeView, snowParkSpot, SNOW_DOCK_LIFT } from "../data/snow/snowCameras.js";
import { wallViewCamera } from "../data/island/wallView.js";
import { challengePadY as snowStagePadY } from "../data/snow/snowTerrain.js";
import { stageFraming, startStageViewportTracker, BASE_FOV } from "./stageViewport.js";
import { WIPE, useWipeout, TRAIL_STEP, TRAIL_MAX, HOP_REPEAT_MS, HOP_EDGE_R, pickHopTarget, planHop, hopPoint } from "./hazardRescue.js";

// Phone / iPad (2026-10-11): a locked challenge camera frames its stage into
// the part of the screen the question card leaves free — an off-axis
// projection centres the stage there, and a narrow free area widens the fov
// (game/stageViewport.js). `fr` null eases everything back to normal.
function applyStageFraming(camera, fr, delta, W, H) {
  const k = 1 - Math.pow(0.02, delta);
  const view = camera.view && camera.view.enabled ? camera.view : null;
  const ox = view ? view.offsetX : 0;
  const oy = view ? view.offsetY : 0;
  const tFov = fr ? fr.fov : BASE_FOV;
  const tx = fr ? fr.offX : 0;
  const ty = fr ? fr.offY : 0;
  if (!fr && !view && camera.fov === BASE_FOV) return;
  const nFov = camera.fov + (tFov - camera.fov) * k;
  const nx = ox + (tx - ox) * k;
  const ny = oy + (ty - oy) * k;
  if (!fr && Math.abs(nFov - BASE_FOV) < 0.05 && Math.abs(nx) < 0.5 && Math.abs(ny) < 0.5) {
    camera.fov = BASE_FOV;
    if (view) camera.clearViewOffset();
    else camera.updateProjectionMatrix();
    return;
  }
  camera.fov = nFov;
  camera.setViewOffset(W, H, nx, ny, W, H); // (updates the projection)
}

// The Snowball Sums challenge cameras live in data/snow/snowCameras.js (one
// recipe per challenge, pad-relative — the snow valley rolls). They look a
// little BELOW their activity (SNOW_DOCK_LIFT) so the scene rides up clear of
// the bottom-docked card; the Magma cameras share that lift.

// Magma Multiples (2026-10-03): every challenge is authored in a STAGE FRAME
// (data/magma/magmaChallenges.js) and filmed from its inner side looking
// outward (the summit: inward over the crater). Resolve its world-space
// parking spot + look point once per challenge.
const _magmaViews = {};
function magmaViewFor(key) {
  if (_magmaViews[key]) return _magmaViews[key];
  const c = getMagmaChallenge(key);
  if (!c) return null;
  const [lx, ly, lz] = c.view.look;
  const [wx, wz] = c.frame.toWorld(lx, lz);
  const v = { key, frame: c.frame, view: c.view, spot: c.frame.toWorld(c.parkAt[0], c.parkAt[1]), lookWorld: [wx, c.frame.y + ly, wz] };
  _magmaViews[key] = v;
  return v;
}
// Emerald Jungle (2026-10-10): the vine-ladder challenges use the SAME stage
// camera (their registry has the same frame/view/parkAt shape).
const _jungleViews = {};
function jungleViewFor(key) {
  if (_jungleViews[key]) return _jungleViews[key];
  const c = getJungleChallenge(key);
  if (!c || !c.frame) return null;
  const [lx, ly, lz] = c.view.look;
  const [wx, wz] = c.frame.toWorld(lx, lz);
  const v = { key, frame: c.frame, view: c.view, spot: c.frame.toWorld(c.parkAt[0], c.parkAt[1]), lookWorld: [wx, c.frame.y + ly, wz] };
  _jungleViews[key] = v;
  return v;
}

// Short decaying camera wobble for wrong answers (triggered by the challenge
// panels via playerState.camShake = { start, dur }).
function applyCamShake(camera) {
  const sh = playerState.camShake;
  if (!sh) return;
  const age = Date.now() - sh.start;
  if (age >= sh.dur) {
    playerState.camShake = null;
    return;
  }
  const amp = 0.28 * (1 - age / sh.dur);
  camera.position.x += Math.sin(age * 0.09) * amp;
  camera.position.y += Math.cos(age * 0.13) * amp * 0.6;
}

const MOVE_SPEED = 7; // units per second (a touch faster for the bigger map)
const RUN_MULTIPLIER = 2; // hold Shift to run

// Touch joystick (2026-10-11): a push smaller than JOY_DEAD is ignored; the
// walk pace follows the push (a gentle push ambles, never slower than
// JOY_MIN_PACE); the rim runs (TouchControls sets touchInput.run).
const JOY_DEAD = 0.12;
const JOY_MIN_PACE = 0.4;
function joyPace(mag) {
  return Math.min(1, JOY_MIN_PACE + (1 - JOY_MIN_PACE) * Math.max(0, (mag - JOY_DEAD) / (0.8 - JOY_DEAD)));
}
// A tap-to-move trip longer than this RUNS (until it's nearly there).
const TAP_RUN_DIST = 12;
function hasKeyInput(k) {
  return k.forward || k.backward || k.left || k.right;
}

// Third-person camera placement, expressed as a distance + height "behind"
// the player. The "behind" direction is rotated by `camYaw` (Z/X controls).
// Lowered angle (W6): ~20° above the horizon (was ~33°) so more of the world is
// visible toward the horizon. Slightly further back to keep the player framed.
const CAMERA_DISTANCE = 12;
const CAMERA_HEIGHT = 4.5;
const ROTATE_SPEED = 1.8; // radians per second while Z or X is held

// Jump (small + game-friendly). Gravity integrates a vertical velocity; the
// player can only jump again after landing (no flying / infinite jumps). Apex
// ≈ v²/2g ≈ 1.3, enough to hop straight up the 1.1-high plateau edge.
const JUMP_VELOCITY = 7.2; // initial upward speed
const GRAVITY = 20; // downward acceleration
// A jump is a projectile: the horizontal launch velocity is locked in at
// take-off and can't be steered mid-air. A jump from a STANDSTILL still leaps
// forward (the animation is a forward vault) — this is that hop's speed. The
// jump clip's Hips travel is ~3.8 world units over the arc, so 5 u/s × ~0.72 s
// airtime ≈ 3.6 units matches the animation's leap and lands cleanly. (The
// snap-back is fixed at the source — the clip now animates in place; see
// PlayerCharacter.jsx — so this value only sets how far the hop carries.)
const JUMP_FORWARD_HOP = 5; // units/second, forward hop for a standing jump

// Camera Lock: how quickly the camera eases behind the movement direction.
const CAM_FOLLOW = 3.0;

// Slippery ice (the Snowball Sums rink): on the ice, input steers a PERSISTENT
// velocity instead of driving displacement directly — so the player skates with
// momentum and glides to a stop. Lower grip = slipperier.
const ICE_GRIP = 1.5; // s⁻¹ — how quickly input takes hold (and glide decays)
const ICE_STOP_SPEED = 0.06; // below this the glide is considered stopped
// Ice on a slope pulls you downhill (the frozen river drifts you to the pond).
const ICE_SLOPE_G = 9; // m/s² per unit of grade

// Snowball Sums TOBOGGAN CHUTES (regions with chuteAt / chuteFrame): drop
// into a chute's trough and you ride it down on a sled — gravity along the
// chute's fall, a little drag, steer left/right inside the berms.
const CHUTE_GRAVITY = 15; // m/s² per unit of grade
const CHUTE_DRAG = 0.42; // s⁻¹
const CHUTE_MIN_SPEED = 3.5;
const CHUTE_MAX_SPEED = 14;
const CHUTE_STEER = 4.5; // m/s across the trough
const CHUTE_HINT = "Wheee! 🛷 Steer left and right to carve down the run.";
// …and the CHAIRLIFT (liftBoardAt / liftSeatAt): step onto the boarding spot.
const LIFT_HINT = "All aboard! 🚡 The chairlift will carry you up to the top.";

// Magma Multiples (regions with the isLava / slideAt hooks):
const SLIDE_SPEED = 9; // m/s down a too-steep volcano flank
// (Lava hops you back along your path, deep water wipes you out to the
// spawn — game/hazardRescue.js.)
const LAVA_HINT = "Ouch — hot lava! 🔥 Stick to the paths, bridges and stones.";
const CAM_TERRAIN_CLEARANCE = 1.4; // keep the follow camera this far above the ground

// Emerald Jungle (regions with the climbAt / bounceAt / speedAt hooks):
const CLIMB_SPEED = 3.1; // m/s up a vine wall (×1.4 holding Shift)
const CLIMB_SIDE_SPEED = 1.8; // m/s sideways along a vine wall
const CLIMB_GRIP_OUT = 0.45; // how far in front of the vines the body hangs
const BOUNCE_HINT = "Boing! 🍄 Hold a direction while you bounce to steer.";

// Fence Challenge camera mode (F2 feedback): while the challenge runs, the
// camera glides to a fixed SIDE-ON view that frames the WHOLE fence (a giant
// physical number line), and the player walks LEFT/RIGHT only along a line
// just in front of it. The walk-line offset south of the fence:
const FENCE_WALK_OFFSET = 2.4;
// The challenge camera framings live in data/farm/farmCameras.js (shared
// with the headless checks); the Round-Up view sits to the SE, so the
// movement basis turns to ROUNDUP_CAM_YAW while it runs.

// Locked-gate/boundary hint: show when within this distance of a hinted
// collider, and keep it on screen for this long after the last near-contact.
const HINT_RANGE = 2.6;
const HINT_LINGER = 3000; // ms (≥3s, per Phase 2H-D)

// Lerp between two angles along the shortest path (radians).
function lerpAngle(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export const CAMERA_DISTANCE_VALUE = CAMERA_DISTANCE; // re-export for DevPanel

/**
 * The student's controllable character.
 *
 * Responsibilities:
 *   - read the keyboard each frame and move the character
 *   - keep the character on the island
 *   - publish its position to playerState (so interactables can measure distance)
 *   - drive a third-person camera that follows AND can orbit around the player
 *
 * Camera orbit (Mario-64 / Lakitu style): holding Z rotates the camera left
 * around the player, X rotates right. Movement is CAMERA-RELATIVE, so "forward"
 * always means "away from the camera, into the screen" no matter which way the
 * camera is facing — keeping the controls feeling natural after rotating.
 */
export default function Player({ cinematic = false }) {
  const group = useRef();
  const keys = useKeyboard();
  const { camera, scene: devScene, gl: devGl, size: viewSize } = useThree();
  useMemo(() => startStageViewportTracker(), []);

  const profile = useProgress((s) => s.profile);
  const activeEncounterId = useSession((s) => s.activeEncounterId);
  const cameraLock = useUI((s) => s.cameraLock);
  const fpv = useUI((s) => s.fpv);
  // While a Snowball Sums challenge runs the player is parked in front of
  // the camera — step the avatar out of shot so it never stands between the
  // student and the maths (2026-09-28 audit: it hid the range's handful row).
  const snowChallenge = useActiveSnowChallenge();
  // …and the same for a running Magma Multiples challenge.
  const magmaChallenge = useActiveMagmaChallenge();
  // …and a running Emerald Jungle challenge.
  const jungleChallenge = useActiveJungleChallenge();
  // Looking at the Achievements Wall (Number Island) — a first-person look,
  // so the avatar steps out of the way.
  const wallView = useUI((s) => s.wallView);

  // Colliders depend on unlock-affecting progress AND the active region → rebuild
  // only when those change (not every frame).
  const completedMissions = useProgress((s) => s.completedMissions);
  const earnedBadges = useProgress((s) => s.earnedBadges);
  const completedEncounters = useProgress((s) => s.completedEncounters);
  const currentRegionId = useSession((s) => s.currentRegionId);
  // The JOURNEY (2026-10-13): a locked Number Island gate is solid, and
  // standing by it says what opens it (the hinted-collider prompt below).
  const journeyLocks = useJourney((s) => s.lockSig);
  const colliders = useMemo(
    () => [
      ...getColliders({ completedMissions, earnedBadges, completedEncounters }, currentRegionId),
      ...lockedPortalColliders(currentRegionId),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completedMissions, earnedBadges, completedEncounters, currentRegionId, journeyLocks]
  );

  // Camera yaw (radians). 0 = camera directly behind the player on +Z.
  const camYaw = useRef(0);

  // Reusable temp vectors (avoid allocating inside the frame loop).
  const move = useRef(new THREE.Vector3());
  const camTarget = useRef(new THREE.Vector3());

  // Vertical jump state.
  const vy = useRef(0); // vertical velocity
  const grounded = useRef(true); // on the ground (can jump)
  const jumpHeld = useRef(false); // edge-detect so holding Shift doesn't re-jump
  const jumpVel = useRef({ x: 0, z: 0 }); // horizontal launch velocity, locked while airborne
  const lastTravel = useRef(0); // cooldown so a portal doesn't re-trigger instantly
  const stuckFrames = useRef(0); // tap-to-move: abandon a target we can't reach
  const fpvYaw = useRef(0); // first-person look yaw
  const fpvPitch = useRef(0); // first-person look pitch
  const fpvInit = useRef(false); // seed the look direction on entering FPV
  const camLook = useRef(new THREE.Vector3()); // lerped look-at point (locked modes)
  const lockedPrev = useRef(false); // seed camLook on entering a locked camera mode
  const iceVel = useRef({ x: 0, z: 0 }); // persistent skate velocity on the rink ice
  const chuteRide = useRef(null); // { chute, s, off, v } while sledding down a chute
  const liftRide = useRef(null); // { t } while riding the chairlift
  const liftCooldown = useRef(0); // no instant re-boarding
  // Hazards (game/hazardRescue.js): deep WATER wipes you out back to the
  // spawn; LAVA hops you back along your path.
  const safeTrail = useRef([]); // recent safe spots, oldest → newest
  const hazardHits = useRef([]); // lava touch times (three quick ones → the spawn)
  const hop = useRef(null); // the guided lava hop in flight
  const wipe = useRef(null); // { t0, y0 } while sinking after falling in deep water
  const settleUntil = useRef(0); // a beat after a hop lands before you can walk again
  const climbing = useRef(null); // { wall, t } while hanging on a vine wall (Emerald Jungle)
  const prevYClimb = useRef(0); // last frame's height (climb animation)
  // Colliders with a height range (yMin / yMax = the band your FEET must be
  // in) only block at those heights — e.g. the treehouse railings 20 m up, a
  // stair's balustrade, or a leaf pole below its pad.
  const hasYRange = useMemo(() => colliders.some((c) => c.yMin !== undefined || c.yMax !== undefined), [colliders]);
  // Title screen: the player stands still (hidden) while TitleCamera flies
  // the camera. When play starts, the camera GLIDES in from the flyover to
  // its spot behind the player (a slower ease for the first moments).
  const wasCinematic = useRef(cinematic);
  const introGlide = useRef(0);
  const _dir = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (!group.current) return;
    if (cinematic) { wasCinematic.current = true; return; }
    if (wasCinematic.current) {
      wasCinematic.current = false;
      introGlide.current = 2.2;
      camera.getWorldDirection(_dir);
      camLook.current.copy(camera.position).addScaledVector(_dir, 30);
    }

    // Teleport request (Return to Hub / DevPanel) — snap and clear.
    if (playerState.teleport) {
      group.current.position.x = playerState.teleport.x;
      group.current.position.z = playerState.teleport.z;
      group.current.position.y = 0;
      vy.current = 0;
      grounded.current = true;
      {
        const tr = getRegion(useSession.getState().currentRegionId);
        // A tap-to-move target from the OLD spot (e.g. the portal you walked
        // into) means nothing after a teleport — drop it so you don't wander.
        if (playerState.moveTarget) clearMoveTarget();
        // Safe spots (for the lava hop) are re-learnt from where you land.
        safeTrail.current = [];
        hazardHits.current = [];
        settleUntil.current = 0;
        // Regions with a signature view (Magma Multiples: the volcano) turn
        // the player + camera to face it on arrival; a door-to-door arrival
        // (a world gate on Number Island) brings its own yaw.
        const ay = typeof playerState.teleport.yaw === "number" ? playerState.teleport.yaw : tr.arriveYaw;
        if (typeof ay === "number") {
          camYaw.current = ay;
          group.current.rotation.y = ay + Math.PI;
        }
      }
      hop.current = null;
      wipe.current = null;
      climbing.current = null;
      chuteRide.current = null;
      liftRide.current = null;
      playerState.teleport = null;
    }

    // Active region: its bounds clamp the player and its own ground function (the
    // Schoolyard's tiers/stairs) drives height, else island-1's plateau/stairs.
    const region = getRegion(useSession.getState().currentRegionId);
    // LAYERED ground (Emerald Jungle): the region's ground function may take
    // the player's current height, so thin structures (bridges, decks, a
    // spiral stair) only count when you're at / above them. Regions that
    // ignore the third argument behave exactly as before.
    const groundAt = (x, z, y) => (region.groundHeight
      ? region.groundHeight(x, z, y === undefined ? group.current.position.y : y)
      : groundHeightAt(x, z));
    // Big-terrain regions (Magma Multiples) cap the frame step so a hitch
    // (tab switch, slow device) can't tunnel the player through a trail
    // kerb or fling them down the volcano in a single frame.
    if (region.maxFrameDelta) delta = Math.min(delta, region.maxFrameDelta);

    const k = keys.current;
    // The Achievements Wall look (island only — leaving the island closes it).
    let wv = useUI.getState().wallView;
    if (wv && region.id !== "island-1") { useUI.getState().closeWall(); wv = null; }
    // Freeze locomotion while an encounter modal is open OR in first-person look
    // mode (in FPV the arrow/WASD keys steer the camera instead of the player),
    // OR while looking at the Achievements Wall (the arrows pick boards there).
    // …and while the full-screen world map is open.
    // …and while a lava hop or a wipe-out (fell in deep water) plays out.
    const rescuing = Boolean(hop.current) || Boolean(wipe.current);
    const frozen = Boolean(activeEncounterId) || fpv || Boolean(wv) || useUI.getState().mapOpen || rescuing;

    // Fence Challenge mode (F2): fixed side-on camera + left/right-only walking
    // along the fence. Active for the whole challenge (placing → done).
    const fenceMode =
      region.id === "farm-parts-whole" && useFarmChallenge.getState().status !== "idle";

    // Round-Up mode (F3): raised ~45° camera over the herd field; walking
    // stays free. (The farm challenges are mutually exclusive.)
    const roundUpMode =
      !fenceMode && region.id === "farm-parts-whole" && useRoundUp.getState().status !== "idle";

    // Order-the-Parts mode (F4): front-on garden camera; the puzzle is
    // tap-only, so the player just parks at the viewing spot.
    const orderMode =
      !fenceMode && !roundUpMode && region.id === "farm-parts-whole" &&
      useOrderParts.getState().status !== "idle";

    // Crate Packing mode (F6): front-on barn-yard camera; tap-only.
    const crateMode =
      !fenceMode && !roundUpMode && !orderMode && region.id === "farm-parts-whole" &&
      useCratePacking.getState().status !== "idle";

    // Milk Splitter mode (F8): front-on dairy-corner camera; tap-only.
    const milkMode =
      !fenceMode && !roundUpMode && !orderMode && !crateMode &&
      region.id === "farm-parts-whole" && useMilkSplitter.getState().status !== "idle";

    // Weigh Station mode (F9): front-on NE-corner camera; tap-only.
    const weighMode =
      !fenceMode && !roundUpMode && !orderMode && !crateMode && !milkMode &&
      region.id === "farm-parts-whole" && useWeighStation.getState().status !== "idle";

    // Trading Post mode (F10): front-on eastern-stalls camera; tap-only.
    const tradeMode =
      !fenceMode && !roundUpMode && !orderMode && !crateMode && !milkMode && !weighMode &&
      region.id === "farm-parts-whole" && useTradingPost.getState().status !== "idle";

    // Veggie Plot mode (F11): front-on camera on the paddock bed; drag/tap-only.
    const veggieMode =
      !fenceMode && !roundUpMode && !orderMode && !crateMode && !milkMode && !weighMode && !tradeMode &&
      region.id === "farm-parts-whole" && useVeggiePlot.getState().status !== "idle";

    // Plank the Gap mode (F12): front-on camera on the fence gap; tap-only.
    const plankMode =
      !fenceMode && !roundUpMode && !orderMode && !crateMode && !milkMode && !weighMode && !tradeMode && !veggieMode &&
      region.id === "farm-parts-whole" && usePlankGap.getState().status !== "idle";

    // Farm Shop mode (F13): front-on camera on the market stall; typed answers.
    const shopMode =
      !fenceMode && !roundUpMode && !orderMode && !crateMode && !milkMode && !weighMode && !tradeMode && !veggieMode && !plankMode &&
      region.id === "farm-parts-whole" && useFarmShop.getState().status !== "idle";

    const farmCamKey = fenceMode ? "fence" : roundUpMode ? "roundup" : orderMode ? "order" : crateMode ? "crate"
      : milkMode ? "milk" : weighMode ? "weigh" : tradeMode ? "trade" : veggieMode ? "veggie" : plankMode ? "plank"
        : shopMode ? "shop" : null;

    // Snowball Sums challenges — ONE locked mode (data/snow/snowCameras.js
    // frames each from the south, pad-relative). They're mutually exclusive.
    const snowCamKey = region.id === "snow-sums"
      ? (useSnowballRange.getState().status !== "idle" ? "range"
        : useRinkGlide.getState().status !== "idle" ? "rink"
        : useGroveLights.getState().status !== "idle" ? "grove"
        : useMeadowLevel.getState().status !== "idle" ? "meadow"
        : useSledSlope.getState().status !== "idle" ? "sled"
        : useVillageSplit.getState().status !== "idle" ? "village"
        : useColonyPairs.getState().status !== "idle" ? "colony"
        : useCaveCrystals.getState().status !== "idle" ? "cave"
        : useLodgeYard.getState().status !== "idle" ? "yard"
        : useAuroraLookout.getState().status !== "idle" ? "lights" : null)
      : null;
    // Magma Multiples challenges share the same parked, locked-camera
    // treatment (their own stage-frame camera below).
    const magmaKey = region.id === MAGMA_REGION_ID ? activeMagmaChallengeKey() : null;
    // The Emerald Jungle's vine-ladder challenges share the magma stage camera.
    const jungleKey = region.id === JUNGLE_REGION_ID ? activeJungleChallengeKey() : null;
    const magmaView = magmaKey ? magmaViewFor(magmaKey) : jungleKey ? jungleViewFor(jungleKey) : null;
    const stageStore = magmaKey ? magmaStore(magmaKey) : jungleKey ? jungleStore(jungleKey) : null;
    // Any parked, locked "stage" camera (snow, magma or jungle).
    const stageMode = snowCamKey || (magmaView ? `stage:${magmaKey || jungleKey}` : null);

    // --- Camera orbit (Z / X, or the on-screen rotate buttons) ---
    // (disabled in the locked challenge views)
    const canOrbit = !frozen && !fenceMode && !roundUpMode && !orderMode && !crateMode && !milkMode && !weighMode && !tradeMode && !veggieMode && !plankMode && !shopMode && !stageMode;
    if (canOrbit) {
      if (k.rotateLeft || touchInput.rotateLeft) { camYaw.current -= ROTATE_SPEED * delta; journeyTrack.looked += ROTATE_SPEED * delta; }
      if (k.rotateRight || touchInput.rotateRight) { camYaw.current += ROTATE_SPEED * delta; journeyTrack.looked += ROTATE_SPEED * delta; }
      // Touch: a finger dragged across the 3D view swings the camera round.
      if (touchInput.yawDelta) { camYaw.current += touchInput.yawDelta; journeyTrack.looked += Math.abs(touchInput.yawDelta); }
    }
    // First-person view on touch (2026-10-13): the same drag looks around
    // through the explorer's eyes (sideways = turn, up/down = tilt).
    const fpvDragYaw = fpv && !wv ? touchInput.yawDelta : 0;
    const fpvDragPitch = fpv && !wv ? touchInput.pitchDelta || 0 : 0;
    touchInput.yawDelta = 0; // a drag while the camera is locked is simply dropped
    touchInput.pitchDelta = 0;
    // Align the movement basis with the locked Round-Up view so WASD/arrows
    // keep matching the screen while (and after) the camera glides over.
    if (roundUpMode) {
      camYaw.current = lerpAngle(camYaw.current, ROUNDUP_CAM_YAW, 1 - Math.exp(-3 * delta));
    }
    const yaw = camYaw.current;
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);

    // Camera-relative basis on the ground plane.
    //   forward = from camera toward player ("into the screen")
    //   right   = screen-right
    // At yaw = 0 these are (0,-1) and (1,0), matching the original layout.
    const forward = { x: -sin, z: -cos };
    const right = { x: cos, z: -sin };

    // --- Movement (camera-relative; fence mode = world left/right only;
    // order/crate/milk modes = tap-only, no locomotion) ---
    move.current.set(0, 0, 0);
    const canWalk = !frozen && Date.now() >= settleUntil.current && !orderMode && !crateMode && !milkMode && !weighMode && !tradeMode && !veggieMode && !plankMode && !shopMode && !stageMode;
    // The touch joystick (analogue): below JOY_DEAD it's ignored; the push
    // sets the walking pace; at the rim (touchInput.run) you RUN.
    const joyMag = Math.min(1, Math.hypot(touchInput.moveX, touchInput.moveY));
    const joyOn = joyMag > JOY_DEAD;
    let inputScale = 1; // keyboard = full pace
    let joyRun = false;
    if (canWalk) {
      if (fenceMode) {
        // Left/right arrows (or A/D, or the on-screen rotate buttons, or the
        // joystick's left/right) slide the player along the fence in WORLD x
        // — screen-left is west (red post), screen-right is east (blue post)
        // in the locked view.
        let dx =
          (k.right ? 1 : 0) - (k.left ? 1 : 0) +
          (touchInput.rotateRight ? 1 : 0) - (touchInput.rotateLeft ? 1 : 0);
        if (!dx && Math.abs(touchInput.moveX) > JOY_DEAD) {
          dx = Math.sign(touchInput.moveX);
          inputScale = joyPace(Math.abs(touchInput.moveX));
        }
        move.current.x = dx;
        move.current.z = 0;
      } else {
        let fwd = (k.forward ? 1 : 0) - (k.backward ? 1 : 0);
        let strafe = (k.right ? 1 : 0) - (k.left ? 1 : 0);
        if (!fwd && !strafe && joyOn) {
          fwd = touchInput.moveY;
          strafe = touchInput.moveX;
          inputScale = joyPace(joyMag);
          joyRun = Boolean(touchInput.run);
        }
        move.current.x = forward.x * fwd + right.x * strafe;
        move.current.z = forward.z * fwd + right.z * strafe;
      }
    }

    const pos = group.current.position;
    const prevX = pos.x;
    const prevZ = pos.z;

    // Tap-to-move (W4): when the keyboard isn't driving movement, steer toward the
    // tapped destination (playerState.moveTarget). Keyboard input always wins and
    // cancels the target, so touch + WASD coexist on hybrid devices.
    const ARRIVE = 0.35; // stop this close to the destination
    if (move.current.lengthSq() > 0) {
      if (playerState.moveTarget) clearMoveTarget(); // keyboard cancels tap + approach
      stuckFrames.current = 0;
    } else if (playerState.moveTarget && !frozen) {
      const tx = playerState.moveTarget.x - prevX;
      const tz = playerState.moveTarget.z - prevZ;
      if (Math.hypot(tx, tz) <= ARRIVE) {
        playerState.moveTarget = null; // arrived (approachId left for the UI)
        stuckFrames.current = 0;
      } else {
        move.current.set(tx, 0, tz); // the block below normalises + steps
      }
    }

    // Hold Shift to RUN (2× speed + the run animation) — or push the touch
    // joystick to its rim, or tap somewhere far away (a long tap-to-move
    // trip runs, so the big worlds don't take forever on a tablet).
    const longTrip = Boolean(playerState.moveTarget) && !hasKeyInput(k) && !joyOn &&
      Math.hypot(playerState.moveTarget.x - prevX, playerState.moveTarget.z - prevZ) > TAP_RUN_DIST;
    const running = (Boolean(k.run) || joyRun || longTrip) && !frozen;

    // Slippery ice (Snowball Sums rink): while ON the ice, input steers a
    // persistent velocity (momentum + glide) rather than setting displacement
    // directly. Off the ice the velocity just mirrors the input, so stepping
    // onto the rink carries the walk/run speed in and gliding feels seamless.
    // (Regions with an iceAt hook — the Snowball Sums pond, frozen river,
    // puddles and chute runouts.)
    const onIce = Boolean(region.iceAt && grounded.current && region.iceAt(prevX, prevZ, pos.y));
    const hasInput = move.current.lengthSq() > 0;
    if (hasInput) move.current.normalize();
    // Wading through water (Emerald Jungle's speedAt hook) slows you down.
    const terrainSpeed = region.speedAt ? region.speedAt(prevX, prevZ, pos.y) : 1;
    const targetSpeed = MOVE_SPEED * (running ? RUN_MULTIPLIER : inputScale) * terrainSpeed;
    if (onIce) {
      const grip = 1 - Math.exp(-ICE_GRIP * delta);
      iceVel.current.x += (move.current.x * targetSpeed - iceVel.current.x) * grip;
      iceVel.current.z += (move.current.z * targetSpeed - iceVel.current.z) * grip;
      // Sloping ice pulls you downhill.
      if (!frozen) {
        const e = 0.6;
        const gx = (groundAt(prevX + e, prevZ) - groundAt(prevX - e, prevZ)) / (2 * e);
        const gz = (groundAt(prevX, prevZ + e) - groundAt(prevX, prevZ - e)) / (2 * e);
        iceVel.current.x -= gx * ICE_SLOPE_G * delta;
        iceVel.current.z -= gz * ICE_SLOPE_G * delta;
      }
    } else {
      iceVel.current.x = move.current.x * targetSpeed;
      iceVel.current.z = move.current.z * targetSpeed;
    }
    const glideSpeed = Math.hypot(iceVel.current.x, iceVel.current.z);
    const gliding = !frozen && !hasInput && onIce && glideSpeed > ICE_STOP_SPEED;

    // --- TOBOGGAN CHUTES + THE CHAIRLIFT (Snowball Sums) -----------------
    // Step down into a chute's trough and you're on a sled: gravity along
    // its fall, steer across inside the berms, then shoot out onto the
    // runout ice. Step onto the chairlift's boarding spot and a chair
    // carries you up to the top station.
    let riding = false;
    let liftRiding = false;
    if (!frozen && !stageMode && region.liftBoardAt) {
      if (!liftRide.current && !chuteRide.current && grounded.current && Date.now() - liftCooldown.current > 2500 &&
          region.liftBoardAt(pos.x, pos.z)) {
        liftRide.current = { t: 0 };
        if (playerState.moveTarget) clearMoveTarget();
        playerState.blockedHint = LIFT_HINT;
        playerState.blockedIcon = "";
        playerState.blockedExpiry = Date.now() + 3200;
        useUI.getState().playSound("whoosh");
      }
      const lr = liftRide.current;
      if (lr) {
        riding = true;
        liftRiding = true;
        lr.t = Math.min(1, lr.t + (region.liftSpeed / region.liftLength) * delta);
        const seat = region.liftSeatAt(lr.t);
        pos.set(seat.x, seat.y, seat.z);
        group.current.rotation.y = seat.yaw;
        camYaw.current = lerpAngle(camYaw.current, seat.yaw + Math.PI, 1 - Math.exp(-2 * delta));
        vy.current = 0;
        iceVel.current.x = 0; iceVel.current.z = 0;
        if (lr.t >= 1) {
          // Step off onto the summit.
          liftRide.current = null;
          liftRiding = false;
          liftCooldown.current = Date.now();
          pos.x = region.liftDismount[0];
          pos.z = region.liftDismount[1];
          pos.y = groundAt(pos.x, pos.z, pos.y + 3);
          grounded.current = true;
        }
      }
    }
    if (!frozen && !stageMode && region.chuteAt && !liftRide.current) {
      if (!chuteRide.current && grounded.current) {
        const c = region.chuteAt(pos.x, pos.z, pos.y);
        if (c) {
          const f0 = region.chuteFrame(c.chute, c.s);
          const v0 = Math.max(CHUTE_MIN_SPEED, iceVel.current.x * f0.tx + iceVel.current.z * f0.tz);
          chuteRide.current = { chute: c.chute, s: c.s, off: c.off, v: v0 };
          if (playerState.moveTarget) clearMoveTarget();
          playerState.blockedHint = CHUTE_HINT;
          playerState.blockedIcon = "";
          playerState.blockedExpiry = Date.now() + 2600;
          useUI.getState().playSound("whoosh");
        }
      }
      const cr = chuteRide.current;
      if (cr) {
        riding = true;
        const f = region.chuteFrame(cr.chute, cr.s);
        cr.v += (CHUTE_GRAVITY * f.grade - CHUTE_DRAG * cr.v) * delta;
        cr.v = Math.min(CHUTE_MAX_SPEED, Math.max(CHUTE_MIN_SPEED, cr.v));
        cr.s += cr.v * delta;
        const steer = hasInput ? move.current.x * -f.tz + move.current.z * f.tx : 0;
        const lim = cr.chute.hw - 0.55;
        cr.off = Math.max(-lim, Math.min(lim, cr.off + steer * CHUTE_STEER * delta));
        const g = region.chuteFrame(cr.chute, cr.s);
        pos.x = g.x - g.tz * cr.off;
        pos.z = g.z + g.tx * cr.off;
        pos.y = groundAt(pos.x, pos.z, g.h + 0.3);
        vy.current = 0;
        grounded.current = true;
        group.current.rotation.y = Math.atan2(g.tx, g.tz);
        camYaw.current = lerpAngle(camYaw.current, Math.atan2(-g.tx, -g.tz), 1 - Math.exp(-3.5 * delta));
        iceVel.current.x = g.tx * cr.v;
        iceVel.current.z = g.tz * cr.v;
        // Off the bottom: out onto the runout ice (still gliding).
        if (cr.s >= cr.chute.len - 0.25) chuteRide.current = null;
      }
    }
    playerState.sledding = Boolean(chuteRide.current);
    playerState.onLift = Boolean(liftRide.current);

    // Horizontal locomotion. GROUNDED → live input (or ice glide) drives it.
    // AIRBORNE → the launch velocity locked in at take-off drives it and live
    // input is IGNORED, so a jump follows a fixed arc (no mid-air steering) and
    // lands wherever its trajectory carries it — like a real leap.
    // --- VINE CLIMBING (regions with a climbAt hook) ---------------------
    // Push INTO a vine wall to climb it; let go by pushing away or jumping.
    // At the top you pull yourself up over the lip onto the ledge above.
    let climbingNow = false;
    if (region.climbAt && !frozen) {
      if (!climbing.current && hasInput) {
        const c = region.climbAt(pos.x, pos.z, pos.y);
        if (c && -(move.current.x * c.wall.nx + move.current.z * c.wall.nz) > 0.55) {
          climbing.current = { wall: c.wall, t: c.t };
          jumpVel.current.x = 0; jumpVel.current.z = 0;
        }
      }
      const cl = climbing.current;
      if (cl) {
        const w = cl.wall;
        const into = hasInput ? -(move.current.x * w.nx + move.current.z * w.nz) : 0;
        const side = hasInput ? move.current.x * w.tx + move.current.z * w.tz : 0;
        const jumpNow = (k.jump || touchInput.jump) && !jumpHeld.current;
        if (jumpNow || into < -0.5) {
          // Let go: a little push-off backwards, then fall.
          climbing.current = null;
          grounded.current = false;
          vy.current = jumpNow ? 4 : 0;
          jumpVel.current.x = w.nx * 2.2; jumpVel.current.z = w.nz * 2.2;
          if (jumpNow) jumpHeld.current = true;
        } else {
          climbingNow = true;
          if (into > 0.3) pos.y += CLIMB_SPEED * (running ? 1.4 : 1) * delta;
          cl.t = Math.max(0.35, Math.min(w.len - 0.35, cl.t + side * CLIMB_SIDE_SPEED * delta));
          const f = Math.max(0, Math.min(1, (pos.y - w.base) / Math.max(0.5, w.top - w.base)));
          const sOut = CLIMB_GRIP_OUT - f * w.cliffW;
          pos.x = w.a[0] + w.tx * cl.t + w.nx * sOut;
          pos.z = w.a[1] + w.tz * cl.t + w.nz * sOut;
          group.current.rotation.y = Math.atan2(-w.nx, -w.nz);
          vy.current = 0;
          grounded.current = false;
          if (playerState.moveTarget && into <= 0.3 && Math.abs(side) < 0.2) clearMoveTarget();
          if (pos.y >= w.top - 0.05) {
            // Mantle over the lip onto the ledge above.
            climbing.current = null;
            climbingNow = false;
            pos.x = w.a[0] + w.tx * cl.t - w.nx * (w.cliffW + 1.3);
            pos.z = w.a[1] + w.tz * cl.t - w.nz * (w.cliffW + 1.3);
            pos.y = groundAt(pos.x, pos.z, w.top + 0.3);
            grounded.current = true;
            useUI.getState().playSound("climb");
          }
        }
      }
    }

    const airborne = !grounded.current;
    const hv = airborne ? jumpVel.current : iceVel.current;
    const hvLen = Math.hypot(hv.x, hv.z);
    const applyHoriz = !climbingNow && !riding && (airborne ? (!frozen && hvLen > 1e-6) : (hasInput || gliding));
    if (applyHoriz) {
      const steeringToTarget = !airborne && Boolean(playerState.moveTarget) && !k.forward && !k.backward && !k.left && !k.right;
      // Facing/camera direction follows the ACTUAL velocity (input direction off
      // the ice, skate direction on it, launch direction in the air).
      const vLen = Math.max(hvLen, 1e-6);
      const dirX = hv.x / vLen;
      const dirZ = hv.z / vLen;
      move.current.set(hv.x * delta, 0, hv.z * delta);

      // Camera Lock: ease the camera to sit BEHIND the movement direction
      // (Option A: Z/X still nudges, then movement gently pulls it back).
      // Skip while airborne — the jump direction is fixed, so leave the camera be.
      if (!airborne && cameraLock && !frozen && !fenceMode && !roundUpMode) {
        const desiredYaw = Math.atan2(-dirX, -dirZ);
        camYaw.current = lerpAngle(camYaw.current, desiredYaw, 1 - Math.exp(-CAM_FOLLOW * delta));
      }

      let nx = prevX + move.current.x;
      let nz = prevZ + move.current.z;

      // Keep the player within the ACTIVE region's walkable bounds (a circle for
      // island-1, a rectangle for the Schoolyard).
      const clamped = clampToBounds(nx, nz, region.bounds);
      nx = clamped.x;
      nz = clamped.z;

      // Solid-object collision: push out of any collider (slides naturally).
      // While AIRBORNE (mid-jump, y > ~0.9), drop `jumpable` colliders so Space
      // vaults paddock / challenge fences — border fences stay non-jumpable.
      // (Terrain regions measure "aloft" from the ground under you, not y = 0.)
      const aloft = region.slideAt ? airborne && pos.y - groundAt(pos.x, pos.z) > 0.6 : pos.y > 0.9;
      let activeColliders = aloft ? colliders.filter((c) => !c.jumpable) : colliders;
      if (hasYRange && activeColliders.length) {
        activeColliders = activeColliders.filter((c) => (c.yMin === undefined || pos.y >= c.yMin) && (c.yMax === undefined || pos.y <= c.yMax));
      }
      const res = resolveCircle(nx, nz, activeColliders, PLAYER_RADIUS);
      nx = res.x;
      nz = res.z;

      // Ground "walls": can't walk UP a surface taller than STEP_UP above the
      // current height (plateau side / final stair). Slide along it per-axis.
      if (groundAt(nx, nz) > pos.y + STEP_UP) {
        if (groundAt(nx, prevZ) <= pos.y + STEP_UP) nz = prevZ;
        else if (groundAt(prevX, nz) <= pos.y + STEP_UP) nx = prevX;
        else { nx = prevX; nz = prevZ; }
      }

      // Too-steep ground (Magma Multiples' volcano flank): you can't walk UP
      // onto it — the summit trail is the way up. Slide per-axis like a wall.
      if (region.slideAt && !airborne) {
        const steepUp = (x, z) => region.slideAt(x, z, pos.y) && groundAt(x, z) > pos.y + 0.02;
        if (steepUp(nx, nz)) {
          if (!steepUp(nx, prevZ)) nz = prevZ;
          else if (!steepUp(prevX, nz)) nx = prevX;
          else { nx = prevX; nz = prevZ; }
        }
      }

      // Hitting a wall mid-air kills the horizontal launch velocity, so the jump
      // drops straight down against the obstacle instead of hugging it.
      if (airborne && Math.hypot(nx - prevX, nz - prevZ) < 0.004) {
        jumpVel.current.x = 0;
        jumpVel.current.z = 0;
      }

      pos.x = nx;
      pos.z = nz;
      // Face the travel direction while grounded; keep the take-off facing in the
      // air (you can't twist to a new heading mid-jump).
      if (!airborne) group.current.rotation.y = Math.atan2(move.current.x, move.current.z);

      // Tap-to-move safety valve: if we're steering to a target but a collider /
      // boundary is stopping us making progress, abandon the target so we don't
      // shuffle in place forever (e.g. the tap landed inside a wall).
      if (steeringToTarget) {
        if (Math.hypot(pos.x - prevX, pos.z - prevZ) < 0.004) {
          if (++stuckFrames.current > 12) { clearMoveTarget(); stuckFrames.current = 0; }
        } else {
          stuckFrames.current = 0;
        }
      }
    }

    // --- JUMP TRAVEL ------------------------------------------------------
    // Horizontal jump travel is now CODE-OWNED via `jumpVel` (locked at
    // take-off, integrated in the locomotion block above), so a jump is a
    // predictable projectile that never slides back. PlayerCharacter still
    // strips the leap out of the jump CLIP so it animates IN PLACE (no visual
    // snap when the clip ends) — but we deliberately DON'T re-apply that
    // animation step to the position here, or the character would travel twice.
    playerState.jumpRootStep = null; // drained so it can't accumulate

    // Fence mode: smoothly WALK the player into position — ease them onto the
    // walk line just in front of the fence, and keep them between the posts
    // (a little beyond each end so the end posts are still reachable).
    if (fenceMode && !frozen) {
      pos.x = Math.max(CHALLENGE_FENCE.x1 - 1.5, Math.min(CHALLENGE_FENCE.x2 + 1.5, pos.x));
      const walkZ = CHALLENGE_FENCE.z + FENCE_WALK_OFFSET;
      const dz = walkZ - pos.z;
      if (Math.abs(dz) > 0.02) {
        const step = Math.min(Math.abs(dz), MOVE_SPEED * 0.8 * delta);
        pos.z += Math.sign(dz) * step;
        // Face the walk-in direction (unless the player is already sliding
        // left/right, in which case the move block set the facing).
        if (Math.abs(dz) > 0.4 && !k.left && !k.right) {
          group.current.rotation.y = Math.atan2(0, Math.sign(dz));
        }
      }
    }

    // Order/crate/milk modes: smoothly park the player at the viewing spot
    // (the challenges are tap-only) and ignore stray tap-to-move targets.
    if ((orderMode || crateMode || milkMode || weighMode || tradeMode || veggieMode || plankMode || shopMode || stageMode) && !frozen) {
      if (playerState.moveTarget) clearMoveTarget();
      const spot = magmaView ? magmaView.spot : snowCamKey ? snowParkSpot(snowCamKey) : orderMode ? ORDER_VIEW_SPOT : crateMode ? CRATE_VIEW_SPOT : milkMode ? MILK_VIEW_SPOT : weighMode ? WEIGH_VIEW_SPOT : tradeMode ? TRADE_VIEW_SPOT : veggieMode ? VEGGIE_VIEW_SPOT : plankMode ? PLANK_VIEW_SPOT : SHOP_VIEW_SPOT;
      const odx = spot[0] - pos.x;
      const odz = spot[1] - pos.z;
      const od = Math.hypot(odx, odz);
      if (od > 0.05) {
        const step = Math.min(od, MOVE_SPEED * 0.8 * delta);
        pos.x += (odx / od) * step;
        pos.z += (odz / od) * step;
        group.current.rotation.y = Math.atan2(odx, odz);
      } else if (orderMode) {
        group.current.rotation.y = Math.PI; // face the garden (north)
      } else if (crateMode) {
        // Crate mode parks off to the side — face the staging area itself.
        group.current.rotation.y = Math.atan2(CRATE_AREA.x - pos.x, CRATE_AREA.z - pos.z);
      } else if (milkMode) {
        group.current.rotation.y = Math.atan2(MILK_AREA.x - pos.x, MILK_AREA.z - pos.z);
      } else if (weighMode) {
        group.current.rotation.y = Math.atan2(WEIGH_AREA.x - pos.x, WEIGH_AREA.z - pos.z);
      } else if (tradeMode) {
        group.current.rotation.y = Math.atan2(TRADE_AREA.x - pos.x, TRADE_AREA.z - pos.z);
      } else if (veggieMode) {
        group.current.rotation.y = Math.atan2(VEGGIE_AREA.x - pos.x, VEGGIE_AREA.z - pos.z);
      } else if (plankMode) {
        group.current.rotation.y = Math.atan2(PLANK_AREA.x - pos.x, PLANK_AREA.z - pos.z);
      } else if (stageMode) {
        const lk = magmaView ? magmaView.lookWorld : snowChallengeView(snowCamKey).look;
        group.current.rotation.y = Math.atan2(lk[0] - pos.x, lk[2] - pos.z);
      } else {
        group.current.rotation.y = Math.atan2(SHOP_AREA.x - pos.x, SHOP_AREA.z - pos.z);
      }
    }

    // Persistent locked-gate / boundary hint: while the player is NEAR a hinted
    // (locked) collider, refresh the hint + its 3s expiry. The prompt UI polls
    // playerState and keeps it visible until the expiry passes — so it lingers
    // after the player stops, instead of vanishing the moment movement ends.
    let bestHint = null;
    let bestD = Infinity;
    for (const c of colliders) {
      if (!c.hint) continue;
      const d = Math.hypot(pos.x - c.x, pos.z - c.z) - c.radius;
      if (d < bestD) { bestD = d; bestHint = c.hint; }
    }
    if (bestHint && bestD <= HINT_RANGE) {
      playerState.blockedHint = bestHint;
      playerState.blockedIcon = "🔒";
      playerState.blockedExpiry = Date.now() + HINT_LINGER;
    }

    // Steep flank: if you're standing on it (fell or hopped off the trail),
    // you slide straight down it — no climbing the volcano the short way.
    const onFace = Boolean(region.slideAt && grounded.current && !frozen && !climbingNow && !riding && region.slideAt(pos.x, pos.z, pos.y));
    if (onFace) {
      const sl = region.slideAt(pos.x, pos.z, pos.y);
      pos.x += sl.x * SLIDE_SPEED * delta;
      pos.z += sl.z * SLIDE_SPEED * delta;
      if (playerState.moveTarget) clearMoveTarget();
    }

    // --- Jump (Shift or the on-screen Jump button): edge-triggered + only when
    // grounded → no flying. ---
    const jumpPressed = k.jump || touchInput.jump;
    if (!frozen && !onFace && !climbingNow && !riding && !fenceMode && !orderMode && !crateMode && !milkMode && !weighMode && !tradeMode && !veggieMode && !plankMode && !shopMode && !stageMode) {
      if (jumpPressed && !jumpHeld.current && grounded.current) {
        vy.current = JUMP_VELOCITY;
        grounded.current = false;
        journeyTrack.jumps += 1;
        // Lock the horizontal launch velocity for the whole arc (no steering).
        // Moving at take-off → carry that momentum forward; standing → a hop in
        // the facing direction, so a solo jump still leaps ahead and lands there.
        if (hasInput) {
          jumpVel.current.x = iceVel.current.x;
          jumpVel.current.z = iceVel.current.z;
        } else {
          const yaw = group.current.rotation.y;
          jumpVel.current.x = Math.sin(yaw) * JUMP_FORWARD_HOP;
          jumpVel.current.z = Math.cos(yaw) * JUMP_FORWARD_HOP;
        }
      }
      jumpHeld.current = jumpPressed;
    } else {
      jumpHeld.current = false;
    }

    // --- Verticality: follow the ground height; fall off ledges; land after a
    // jump. The walkable surface comes from groundHeightAt (plateau + stairs). ---
    const ground = climbingNow || liftRiding || rescuing ? pos.y : groundAt(pos.x, pos.z);
    if (climbingNow || liftRiding || rescuing) {
      // Hanging on the vines / sitting on the chairlift / mid-hop or sinking
      // after falling in (scripted below) — gravity waits.
    } else if (grounded.current) {
      if (ground >= pos.y - STEP_DOWN) {
        pos.y = ground; // walk up small steps / stay / step down smoothly
      } else {
        grounded.current = false; // walked off a ledge → start falling
        vy.current = 0;
        // Carry current horizontal momentum off the edge (projectile — but no
        // steering once airborne), matching the locked-arc jump behaviour.
        jumpVel.current.x = iceVel.current.x;
        jumpVel.current.z = iceVel.current.z;
      }
    }
    if (!grounded.current) {
      vy.current -= GRAVITY * delta;
      pos.y += vy.current * delta;
      if (pos.y <= ground) {
        pos.y = ground;
        vy.current = 0;
        grounded.current = true;
        jumpVel.current.x = 0; // landed → clear the locked launch velocity
        jumpVel.current.z = 0;
        // Bouncy mushroom cap (Emerald Jungle): landing launches you again —
        // steer the bounce by holding a direction.
        const pad = region.bounceAt ? region.bounceAt(pos.x, pos.z, pos.y) : null;
        if (pad) {
          vy.current = pad.vy;
          grounded.current = false;
          jumpVel.current.x = iceVel.current.x * 0.75;
          jumpVel.current.z = iceVel.current.z * 0.75;
          playerState.bounceHit = { id: pad.id, t: Date.now() };
          if (!playerState.blockedHint || Date.now() > (playerState.blockedExpiry || 0)) {
            playerState.blockedHint = BOUNCE_HINT;
            playerState.blockedIcon = "";
            playerState.blockedExpiry = Date.now() + 1800;
          }
          useUI.getState().playSound("boing");
        }
      }
    }

    // --- HAZARDS (regions with an isLava hook) ---------------------------
    // Deep WATER (the island's sea, the snow world's lake): you sink, the
    // screen irises shut on "WIPED OUT!" and you're put back at the spawn.
    // LAVA: a guided "hot-foot" hop back along your path that lands EXACTLY
    // on a remembered safe spot (game/hazardRescue.js).
    const nowMs = Date.now();
    if (wipe.current) {
      const w = wipe.current;
      const t = nowMs - w.t0;
      const s = Math.min(1, t / WIPE.sinkMs);
      pos.y = w.y0 - WIPE.sinkDepth * s * s;
      vy.current = 0;
      grounded.current = false;
      if (t >= WIPE.teleportAt) {
        wipe.current = null;
        playerState.teleport = { x: region.spawn.x, z: region.spawn.z };
        // Once you're back, a reminder of what to avoid.
        const hz = region.hazardInfo ? region.hazardInfo(w.x, w.z) : null;
        playerState.blockedHint = (hz && hz.hint) || region.hazardHint || LAVA_HINT;
        playerState.blockedIcon = "";
        playerState.blockedExpiry = nowMs + 5200;
      }
    } else if (hop.current) {
      const h = hop.current;
      const s = Math.min(1, (nowMs - h.t0) / h.dur);
      const pt = hopPoint(h, s);
      pos.set(pt.x, pt.y, pt.z);
      group.current.rotation.y = Math.atan2(h.to.x - h.from.x, h.to.z - h.from.z);
      // The free camera swings round behind you, so you face away from the lava.
      if (h.turnCam) camYaw.current = lerpAngle(camYaw.current, Math.atan2(h.from.x - h.to.x, h.from.z - h.to.z), 1 - Math.exp(-2.5 * delta));
      vy.current = 0;
      grounded.current = false;
      if (s >= 1) {
        pos.y = groundAt(h.to.x, h.to.z, h.to.y + 0.2);
        grounded.current = true;
        jumpVel.current.x = 0; jumpVel.current.z = 0;
        iceVel.current.x = 0; iceVel.current.z = 0;
        hop.current = null;
        settleUntil.current = nowMs + 350;
      }
    } else if (region.isLava && !frozen && !riding && !climbingNow) {
      const hz = region.hazardInfo ? region.hazardInfo(pos.x, pos.z) : null;
      const kind = (hz && hz.kind) || region.hazardKind || "lava";
      // Touching it: standing in it, or (water) dropping below its surface.
      let hit = grounded.current && region.isLava(pos.x, pos.z, pos.y);
      if (!hit && !grounded.current && vy.current < 0 && kind === "water" && region.waterLevelAt) {
        const lvl = region.waterLevelAt(pos.x, pos.z);
        hit = lvl !== null && pos.y < lvl - 0.3 && region.isLava(pos.x, pos.z, pos.y);
      }
      if (hit) {
        if (playerState.moveTarget) clearMoveTarget();
        playerState.lavaHit = { x: pos.x, y: pos.y, z: pos.z, t: nowMs };
        jumpVel.current.x = 0; jumpVel.current.z = 0;
        iceVel.current.x = 0; iceVel.current.z = 0;
        vy.current = 0;
        grounded.current = false;
        if (kind === "water") {
          wipe.current = { t0: nowMs, y0: pos.y, x: pos.x, z: pos.z };
          safeTrail.current = [];
          hazardHits.current = [];
          playerState.blockedHint = null;
          useWipeout.getState().start({ kind, line: (hz && hz.wipe) || region.wipeLine || "You fell into the deep water!" });
          useUI.getState().playSound((hz && hz.sound) || region.hazardSound || "splash");
          useUI.getState().playSound("wipeout");
        } else {
          hazardHits.current = hazardHits.current.filter((t) => nowMs - t < HOP_REPEAT_MS);
          hazardHits.current.push(nowMs);
          const from = { x: pos.x, y: pos.y, z: pos.z };
          const pick = pickHopTarget(safeTrail.current, from, hazardHits.current.length);
          let to = pick.spot;
          if (to) safeTrail.current.length = pick.keep;
          else {
            // Third touch in a row (or nowhere remembered): back to the spawn.
            to = { x: region.spawn.x, y: groundAt(region.spawn.x, region.spawn.z, 1e4), z: region.spawn.z };
            safeTrail.current = [];
            hazardHits.current = [];
          }
          hop.current = { ...planHop(from, to, (x, z) => groundAt(x, z, 1e4)), t0: nowMs, turnCam: canOrbit || cameraLock };
          playerState.blockedHint = (hz && hz.hint) || region.hazardHint || LAVA_HINT;
          playerState.blockedIcon = "";
          playerState.blockedExpiry = nowMs + 2600;
          useUI.getState().playSound((hz && hz.sound) || region.hazardSound || "lava");
        }
      } else if (grounded.current && !onFace) {
        // Remember safe ground along your path (every TRAIL_STEP metres).
        const tr = safeTrail.current;
        const last = tr[tr.length - 1];
        if ((!last || Math.hypot(pos.x - last.x, pos.z - last.z) > TRAIL_STEP) &&
            (!region.isSafe || region.isSafe(pos.x, pos.z)) &&
            !region.isLava(pos.x, pos.z, pos.y) &&
            !(region.slideAt && region.slideAt(pos.x, pos.z, pos.y))) {
          let edge = false;
          for (let i = 0; i < 6 && !edge; i++) {
            const a = (i / 6) * Math.PI * 2;
            const sx = pos.x + Math.cos(a) * HOP_EDGE_R;
            const sz = pos.z + Math.sin(a) * HOP_EDGE_R;
            edge = region.isLava(sx, sz, groundAt(sx, sz, pos.y));
          }
          tr.push({ x: pos.x, y: pos.y, z: pos.z, edge });
          if (tr.length > TRAIL_MAX) tr.shift();
        }
      }
    }

    // What the on-screen touch controls may do this frame (TouchControls
    // shows / hides the joystick + Jump from this).
    {
      const caps = playerState.touchCaps;
      caps.walk = canWalk && !liftRiding; // (a sled on a chute still steers)
      caps.walkAxis = fenceMode ? "x" : null;
      caps.orbit = canOrbit && !riding;
      caps.jump = (canWalk && !fenceMode && !riding) || climbingNow;
      // First-person view: the drag looks around instead (no joystick).
      caps.look = fpv && !wv;
    }

    // The journey's training counts real walking + running (not rides,
    // lava bounces or teleports).
    {
      const stepD = Math.hypot(pos.x - prevX, pos.z - prevZ);
      if (!frozen && !riding && stepD < 2) {
        journeyTrack.walked += stepD;
        if (running) journeyTrack.ran += stepD;
      }
    }

    // Publish position for proximity checks (non-reactive shared object).
    playerState.x = pos.x;
    playerState.y = pos.y;
    playerState.z = pos.z;
    playerState.camYaw = camYaw.current;
    // The model's yaw — PlayerCharacter rotates the jump's root motion by it.
    if (group.current) playerState.facing = group.current.rotation.y;

    // Animation mode for the rigged player model (PlayerCharacter.jsx):
    // airborne → jump; actually moving this frame → run/walk; else idle.
    // (Displacement covers keyboard, tap-to-move AND the auto walk-ins.)
    const movedThisFrame = Math.hypot(pos.x - prevX, pos.z - prevZ) > 0.004 || (climbingNow && Math.abs(pos.y - prevYClimb.current) > 1e-3);
    playerState.climbing = climbingNow;
    playerState.animMode = riding
      ? "idle"
      : climbingNow
      ? (movedThisFrame || (hasInput && pos.y > prevYClimb.current + 1e-4) ? "walk" : "idle")
      : !grounded.current
      ? "jump"
      : movedThisFrame
        ? (running ? "run" : "walk")
        : "idle";

    prevYClimb.current = pos.y;

    // Teleport Gates: stepping into a portal travels to its target region (with a
    // short cooldown so arriving next to one can't bounce you straight back).
    if (!frozen) {
      for (const portal of region.portals || []) {
        if (Math.hypot(pos.x - portal.position[0], pos.z - portal.position[1]) <= portal.radius) {
          // A gate the journey hasn't opened yet goes nowhere (its collider
          // keeps you out; this is the belt-and-braces).
          if (region.id === "island-1" && lockForPortal(portal.id)) break;
          // (The Retrieval Practice Playground used to be a LOCKED gate until
          // Pip, Fern and Alby were each passed at 80% — removed 2026-10-09 at
          // Jeff's request. Since the JOURNEY (2026-10-13) the island gates
          // open in turn instead — see data/journey.js.)
          if (Date.now() - lastTravel.current > 1200) {
            lastTravel.current = Date.now();
            useSession.getState().setRegion(portal.target);
            // Door-to-door travel (CB): land AT the matching doorway rather
            // than the region spawn (overrides setRegion's spawn teleport).
            if (portal.arrive) {
              playerState.teleport = { x: portal.arrive[0], z: portal.arrive[1], yaw: portal.arriveYaw };
            }
          }
          break;
        }
      }
    }

    const p = group.current.position;

    if (!wv && !farmCamKey && !snowCamKey && !magmaView) applyStageFraming(camera, null, delta, viewSize.width, viewSize.height);
    if (wv) {
      fpvInit.current = false;
      // --- The Achievements Wall look: the camera glides from behind the
      // player to eye height in front of the wall (the whole wall, or one
      // world's board up close — data/island/wallView.js frames each from
      // the live fov/aspect). Position + look ease in → a smooth glide.
      // A screen narrower than 4:3 (a phone / iPad held upright) keeps the
      // 4:3 framing distance and widens the view, so a whole board fits.
      const t0 = Math.tan((BASE_FOV * Math.PI) / 360);
      const wf = camera.aspect < 4 / 3 ? { fov: (2 * Math.atan((t0 * (4 / 3)) / camera.aspect) * 180) / Math.PI, offX: 0, offY: 0 } : null;
      applyStageFraming(camera, wf, delta, viewSize.width, viewSize.height);
      const view = wallViewCamera(wv.panel, wf ? wf.fov : BASE_FOV, camera.aspect);
      if (!lockedPrev.current) camLook.current.set(p.x, p.y + 1.6, p.z);
      camTarget.current.set(view.pos[0], view.pos[1], view.pos[2]);
      camera.position.lerp(camTarget.current, 1 - Math.pow(0.004, delta));
      camLook.current.lerp({ x: view.look[0], y: view.look[1], z: view.look[2] }, 1 - Math.pow(0.002, delta));
      camera.lookAt(camLook.current);
    } else if (fpv) {
      // --- First-person look (W6): camera at the eyes; arrows/WASD pan the view.
      if (!fpvInit.current) { fpvYaw.current = group.current.rotation.y; fpvPitch.current = 0; fpvInit.current = true; }
      const LOOK = 1.7 * delta;
      // (The training counts how far you look each way — journeyTrack.fpvLook.)
      const fl = journeyTrack.fpvLook;
      if (k.left) { fpvYaw.current += LOOK; fl.left += LOOK; }
      if (k.right) { fpvYaw.current -= LOOK; fl.right += LOOK; }
      if (k.forward) { fpvPitch.current = Math.min(1.2, fpvPitch.current + LOOK); fl.up += LOOK; }
      if (k.backward) { fpvPitch.current = Math.max(-1.0, fpvPitch.current - LOOK); fl.down += LOOK; }
      if (fpvDragYaw) { fpvYaw.current += fpvDragYaw; if (fpvDragYaw > 0) fl.left += fpvDragYaw; else fl.right -= fpvDragYaw; }
      if (fpvDragPitch) {
        fpvPitch.current = Math.max(-1.0, Math.min(1.2, fpvPitch.current + fpvDragPitch));
        if (fpvDragPitch > 0) fl.up += fpvDragPitch * 1.6; else fl.down -= fpvDragPitch * 1.6; // (a tilt is a shorter drag)
      }
      const eyeY = p.y + 1.7;
      camera.position.set(p.x, eyeY, p.z);
      const cp = Math.cos(fpvPitch.current);
      camTarget.current.set(
        p.x + Math.sin(fpvYaw.current) * cp,
        eyeY + Math.sin(fpvPitch.current),
        p.z + Math.cos(fpvYaw.current) * cp
      );
      camera.lookAt(camTarget.current);
    } else if (farmCamKey) {
      fpvInit.current = false;
      // --- Fraction Farm challenge cameras (F2–F13): each challenge glides to
      // its own fixed view (data/farm/farmCameras.js — side-on along the
      // fence, 45° down over the Round-Up field, front-on at the stations).
      // Distances come from the live fov/aspect so the whole stage always
      // fits; the views are pad-relative, so the pad's height is added (the
      // farm is hilly now). Position AND look-at ease in → a smooth glide. ---
      const fr = stageFraming();
      applyStageFraming(camera, fr, delta, viewSize.width, viewSize.height);
      const view = fr ? farmChallengeView(farmCamKey, fr.viewFov, fr.viewAspect) : farmChallengeView(farmCamKey, BASE_FOV, camera.aspect);
      const padY = challengePadY(farmCamKey);
      if (!lockedPrev.current) camLook.current.set(p.x, p.y + 1, p.z); // seed from the player
      camTarget.current.set(view.pos[0], view.pos[1] + padY, view.pos[2]);
      camera.position.lerp(camTarget.current, 1 - Math.pow(0.01, delta));
      camLook.current.lerp({ x: view.look[0], y: view.look[1] + padY, z: view.look[2] }, 1 - Math.pow(0.01, delta));
      camera.lookAt(camLook.current);
      if (FARM_CAMERA_SHAKES[farmCamKey]) applyCamShake(camera); // wrong-answer wobble (the panels)
    } else if (snowCamKey) {
      fpvInit.current = false;
      // --- Snowball Sums challenge cameras: each glides to its own locked
      // front-on view from the south (data/snow/snowCameras.js — distances
      // from the live fov/aspect). Pad-relative: the stage's pad height is
      // added (the sled run's view is absolute — its pad is 0). ---
      const fr = stageFraming();
      applyStageFraming(camera, fr, delta, viewSize.width, viewSize.height);
      const view = fr ? snowChallengeView(snowCamKey, fr.viewFov, fr.viewAspect) : snowChallengeView(snowCamKey, BASE_FOV, camera.aspect);
      const padY = snowStagePadY(snowCamKey);
      // (The views look a little low so the stage rides above a bottom card
      // on a computer; the phone framing centres it in the free area itself.)
      const unLift = fr ? SNOW_DOCK_LIFT * view.dist : 0;
      if (!lockedPrev.current) camLook.current.set(p.x, p.y + 1, p.z);
      camTarget.current.set(view.pos[0], view.pos[1] + padY, view.pos[2]);
      camera.position.lerp(camTarget.current, 1 - Math.pow(0.01, delta));
      camLook.current.lerp({ x: view.look[0], y: view.look[1] + padY + unLift, z: view.look[2] }, 1 - Math.pow(0.01, delta));
      camera.lookAt(camLook.current);
      applyCamShake(camera); // wrong-answer wobble (the snow panels)
    } else if (magmaView) {
      fpvInit.current = false;
      // --- Magma Multiples camera: placed in the challenge's STAGE FRAME —
      // on the inner side of the clearing looking outward (the summit looks
      // inward across the crater), at the view's elevation, far enough back
      // that `fit` metres either side of the look point fill the screen. A
      // store may widen the fit for a round (viewFit). Looks a little BELOW
      // the stage so the scene rides up clear of the bottom-docked card. ---
      const { frame: fr, view: vw } = magmaView;
      const fit = stageStore?.getState().viewFit || vw.fit;
      const sf = stageFraming();
      applyStageFraming(camera, sf, delta, viewSize.width, viewSize.height);
      const halfW = sf ? sf.halfW : Math.tan((BASE_FOV * Math.PI) / 360) * camera.aspect;
      // A tall scene (the jungle's tape + graph board) also has a half-HEIGHT to fit.
      const halfV = sf ? sf.halfV : Math.tan((BASE_FOV * Math.PI) / 360);
      const fitDist = Math.max(fit / halfW, vw.fitH ? vw.fitH / halfV : 0);
      const dist = Math.min(vw.maxDist ?? 30, Math.max(vw.minDist ?? 9, fitDist));
      const [lx, ly, lz] = vw.look;
      const [cx, cz] = fr.toWorld(lx, lz + Math.cos(vw.elev) * dist);
      if (!lockedPrev.current) camLook.current.set(p.x, p.y + 1, p.z);
      camTarget.current.set(cx, fr.y + ly + Math.sin(vw.elev) * dist, cz);
      camera.position.lerp(camTarget.current, 1 - Math.pow(0.01, delta));
      camLook.current.lerp(
        { x: magmaView.lookWorld[0], y: magmaView.lookWorld[1] - (sf ? 0 : (vw.lift ?? SNOW_DOCK_LIFT)) * dist, z: magmaView.lookWorld[2] },
        1 - Math.pow(0.01, delta)
      );
      camera.lookAt(camLook.current);
      applyCamShake(camera); // wrong-answer wobble (MagmaPanelShell)
    } else {
      fpvInit.current = false;
      // --- Third-person camera follow (orbited by camYaw) ---
      // Camera sits "behind" the player: opposite the forward direction.
      camTarget.current.set(
        p.x + sin * CAMERA_DISTANCE,
        p.y + CAMERA_HEIGHT,
        p.z + cos * CAMERA_DISTANCE
      );
      // Big-terrain regions (the volcano): never let the camera dip into the
      // mountain behind/beside the player — ride up over it instead.
      if (region.cameraTerrainClamp) {
        const minY = groundAt(camTarget.current.x, camTarget.current.z) + CAM_TERRAIN_CLEARANCE;
        if (camTarget.current.y < minY) camTarget.current.y = minY;
      }
      // Regions with buildings you walk round (the Playground): keep the
      // camera out of the blocks and UNDER the corridor decks / roofs it
      // looks beneath, so a verandah or stair tower never hides the player.
      if (region.cameraFit) region.cameraFit(p.x, p.y, p.z, camTarget.current);
      if (introGlide.current > 0) {
        // The title flyover → the game: a slower SWOOP down behind the
        // player — the camera stays high while it's far away (clear of the
        // rooftops + trees) and settles as it arrives.
        introGlide.current -= delta;
        const e = 1 - Math.pow(0.06, delta);
        const far = Math.hypot(camera.position.x - camTarget.current.x, camera.position.z - camTarget.current.z);
        const lift = Math.min(28, far * 0.45);
        camera.position.x += (camTarget.current.x - camera.position.x) * e;
        camera.position.z += (camTarget.current.z - camera.position.z) * e;
        camera.position.y += (Math.max(camTarget.current.y + lift, Math.min(camera.position.y, camTarget.current.y + lift + 6)) - camera.position.y) * e;
        camLook.current.lerp({ x: p.x, y: p.y + 1, z: p.z }, 1 - Math.pow(0.02, delta));
      } else {
        camera.position.lerp(camTarget.current, 1 - Math.pow(0.001, delta));
      }
      if (region.cameraTerrainClamp) {
        const minY = groundAt(camera.position.x, camera.position.z) + 1.0;
        if (camera.position.y < minY) camera.position.y = minY;
      }
      if (region.cameraFit && introGlide.current <= 0) region.cameraFit(p.x, p.y, p.z, camera.position);
      if (introGlide.current > 0) camera.lookAt(camLook.current);
      else camera.lookAt(p.x, p.y + 1, p.z);
    }
    // Dev-only photo camera (headless screenshots): playerState.devCam =
    // { pos: [x,y,z], look: [x,y,z] } overrides the view. Never set in play.
    if (import.meta.env.DEV) { window.__cam = camera; window.__scene = devScene; window.__gl = devGl; window.__ps = playerState; window.__ui = useUI; window.__session = useSession; }
    if (import.meta.env.DEV && playerState.devCam) {
      camera.position.set(...playerState.devCam.pos);
      camera.lookAt(...playerState.devCam.look);
    }
    lockedPrev.current = fenceMode || roundUpMode || orderMode || crateMode || milkMode || weighMode || tradeMode || veggieMode || plankMode || shopMode || Boolean(stageMode) || Boolean(wv);
  });

  // The player's initial position = the active region's spawn (island-1 default).
  const spawnPt = getRegion(useSession.getState().currentRegionId).spawn;

  return (
    <group ref={group} position={[spawnPt.x, 0, spawnPt.z]}>
      {/* main1.glb with movement-driven idle/walk/run/jump animation
          (primitive avatar fallback until the model loads). HIDDEN in
          first-person view so the camera (at the eyes) never sits inside the
          character mesh. */}
      <group visible={!cinematic && !fpv && !snowChallenge && !magmaChallenge && !jungleChallenge && !wallView}>
        <PlayerCharacter profile={profile} />
        {/* Snowball Sums: a sled under your feet on a toboggan chute, a
            chair under you on the chairlift. */}
        <RideProps />
      </group>
    </group>
  );
}

/** The sled (on a chute) / the lift chair (on the chairlift) under the player. */
function RideProps() {
  const sled = useRef();
  const chair = useRef();
  useFrame((state) => {
    if (sled.current) {
      sled.current.visible = Boolean(playerState.sledding);
      if (playerState.sledding) sled.current.rotation.z = Math.sin(state.clock.elapsedTime * 9) * 0.03;
    }
    if (chair.current) chair.current.visible = Boolean(playerState.onLift);
  });
  return (
    <>
      <group ref={sled} visible={false}>
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.05, 0]} castShadow>
            <boxGeometry args={[0.07, 0.07, 1.7]} />
            <meshStandardMaterial color="#b9c2cc" metalness={0.6} roughness={0.35} />
          </mesh>
        ))}
        <mesh position={[0.0, 0.05, 0.86]} rotation={[-0.9, 0, 0]} castShadow>
          <boxGeometry args={[0.66, 0.06, 0.32]} />
          <meshStandardMaterial color="#b9c2cc" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.17, -0.05]} castShadow>
          <boxGeometry args={[0.8, 0.09, 1.45]} />
          <meshStandardMaterial color="#c0392b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.25, 0.62]} castShadow>
          <boxGeometry args={[0.8, 0.12, 0.12]} />
          <meshStandardMaterial color="#e8d5b0" roughness={0.7} />
        </mesh>
      </group>
      <group ref={chair} visible={false}>
        {/* An open GONDOLA cabin: floor, waist rails, corner posts, roof and
            the grip arm up to the cable (≈3.4 m above your feet). */}
        <mesh position={[0, -0.08, 0]} castShadow>
          <boxGeometry args={[1.5, 0.12, 1.5]} />
          <meshStandardMaterial color="#2f6fb5" roughness={0.5} />
        </mesh>
        {[[-0.72, 0], [0.72, 0], [0, -0.72], [0, 0.72]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.55, z]} castShadow>
            <boxGeometry args={[x ? 0.06 : 1.5, 0.95, z ? 0.06 : 1.5]} />
            <meshStandardMaterial color={i % 2 ? "#e9eef3" : "#2f6fb5"} transparent opacity={0.92} roughness={0.5} />
          </mesh>
        ))}
        {[[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].map(([x, z], i) => (
          <mesh key={`p${i}`} position={[x, 1.25, z]}>
            <cylinderGeometry args={[0.035, 0.035, 2.5, 6]} />
            <meshStandardMaterial color="#9aa3ad" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 2.55, 0]} castShadow>
          <boxGeometry args={[1.62, 0.12, 1.62]} />
          <meshStandardMaterial color="#c0392b" roughness={0.6} />
        </mesh>
        <mesh position={[0, 3.0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.85, 6]} />
          <meshStandardMaterial color="#9aa3ad" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
    </>
  );
}
