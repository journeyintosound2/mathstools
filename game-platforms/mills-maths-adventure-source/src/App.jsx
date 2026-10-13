import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";

import World from "./game/World.jsx";
import TitleScreen from "./ui/TitleScreen.jsx";
import WorldReady from "./game/WorldReady.jsx";
import HUD from "./ui/HUD.jsx";
import EncounterModal from "./ui/EncounterModal.jsx";
import InteractionPrompt from "./ui/InteractionPrompt.jsx";
import TouchControls, { RotateHint } from "./ui/TouchControls.jsx";
import FarmChallengePanel from "./ui/FarmChallengePanel.jsx";
import RoundUpPanel from "./ui/RoundUpPanel.jsx";
import OrderPartsPanel from "./ui/OrderPartsPanel.jsx";
import CratePackingPanel from "./ui/CratePackingPanel.jsx";
import MilkSplitterPanel from "./ui/MilkSplitterPanel.jsx";
import WeighStationPanel from "./ui/WeighStationPanel.jsx";
import TradingPostPanel from "./ui/TradingPostPanel.jsx";
import VeggiePlotPanel from "./ui/VeggiePlotPanel.jsx";
import PlankGapPanel from "./ui/PlankGapPanel.jsx";
import FarmShopPanel from "./ui/FarmShopPanel.jsx";
import SnowballRangePanel from "./ui/SnowballRangePanel.jsx";
import RinkGlidePanel from "./ui/RinkGlidePanel.jsx";
import GroveLightsPanel from "./ui/GroveLightsPanel.jsx";
import MeadowLevelPanel from "./ui/MeadowLevelPanel.jsx";
import SledSlopePanel from "./ui/SledSlopePanel.jsx";
import VillageSplitPanel from "./ui/VillageSplitPanel.jsx";
import ColonyPairsPanel from "./ui/ColonyPairsPanel.jsx";
import CaveCrystalsPanel from "./ui/CaveCrystalsPanel.jsx";
import LodgeYardPanel from "./ui/LodgeYardPanel.jsx";
import AuroraLookoutPanel from "./ui/AuroraLookoutPanel.jsx";
import QuestLog from "./ui/QuestLog.jsx";
import TrophyRoom from "./ui/TrophyRoom.jsx";
import FarmTrophyGrid from "./ui/FarmTrophyGrid.jsx";
import SnowTrophyGrid from "./ui/SnowTrophyGrid.jsx";
import MagmaTrophyGrid from "./ui/MagmaTrophyGrid.jsx";
import MagmaPanels from "./ui/magma/MagmaPanels.jsx";
import JungleTrophyGrid from "./ui/JungleTrophyGrid.jsx";
import MapViewer from "./ui/map/MapViewer.jsx";
import { hasRegionMap } from "./data/maps/regionMaps.js";
import { isAnyChallengeActive, useFarmChallengeActive } from "./game/farmChallengeActive.js";
import JunglePanels from "./ui/jungle/JunglePanels.jsx";
import ResultsCentre from "./ui/ResultsCentre.jsx";
import HowToPlay from "./ui/HowToPlay.jsx";
import TeacherPilotCard from "./ui/TeacherPilotCard.jsx";
import CloudLogin from "./ui/CloudLogin.jsx";
import BlockedGatePrompt from "./ui/BlockedGatePrompt.jsx";
import AchievementsWallUI from "./ui/AchievementsWallUI.jsx";
import { CoachCard } from "./ui/journey/JourneyCoach.jsx";
import JourneyCelebration from "./ui/journey/JourneyCelebration.jsx";
import { startJourney, useJourney } from "./game/journeyStore.js";
import { startProgressAutosave } from "./cloud/progressSync.js";
import TrainingPrompt from "./ui/journey/TrainingPrompt.jsx";
import AdminPanel from "./ui/admin/AdminPanel.jsx";
import { useProgress } from "./progress/store.js";
import UnlockCelebration from "./ui/UnlockCelebration.jsx";
import DynamicDialogue from "./ui/encounters/DynamicDialogue.jsx";
import ToastLayer from "./ui/effects/ToastLayer.jsx";
import WipeoutOverlay from "./ui/effects/WipeoutOverlay.jsx";
import { useWipeout } from "./game/hazardRescue.js";
import BilingualLayer from "./i18n/BilingualLayer.jsx";

import { useSession, playerState, requestTeleport } from "./game/sessionStore.js";
import { useUI } from "./ui/effects/uiStore.js";
import { getInteractable, INTERACTABLES } from "./data/interactables.js";
import { triggerInteraction, isInteractKey, isTypingTarget } from "./game/interaction.js";
import { inWallPromptZone } from "./data/island/wallView.js";

// DEV-only handles for the headless phone/iPad harness (stripped from builds):
// jump to any character / challenge host and open it without walking there.
if (import.meta.env.DEV && typeof window !== "undefined") {
  window.__mma = { useSession, useUI, playerState, requestTeleport, getInteractable, INTERACTABLES, triggerInteraction, useProgress, useJourney, useWipeout };
}

/**
 * App is the top-level orchestrator.
 *
 * It switches between two phases:
 *   - "creator": the TITLE SCREEN (ui/TitleScreen.jsx) over a live
 *     flyover of the island — Continue / Start adventure, the character
 *     card, sign-in and options.
 *   - "playing": the 3D world is shown with the HUD overlaid.
 *
 * The ONE <Canvas> stays mounted across both, so pressing Continue glides
 * the camera straight from the flyover down behind the player.
 *
 * The 3D <Canvas> and the 2D HTML UI (HUD, modal, prompts) are deliberately
 * kept separate. They communicate only through the zustand stores
 * (sessionStore for transient state, progress store for saved data).
 * This keeps the rendering layers decoupled and easy to extend.
 */
export default function App() {
  const phase = useSession((s) => s.phase);
  const nearbyId = useSession((s) => s.nearbyId);
  const activeEncounterId = useSession((s) => s.activeEncounterId);
  const openEncounter = useSession((s) => s.openEncounter);
  const questLogOpen = useUI((s) => s.questLogOpen);
  const trophyOpen = useUI((s) => s.trophyOpen);
  const farmTrophyOpen = useUI((s) => s.farmTrophyOpen);
  const snowTrophyOpen = useUI((s) => s.snowTrophyOpen);
  const magmaTrophyOpen = useUI((s) => s.magmaTrophyOpen);
  const jungleTrophyOpen = useUI((s) => s.jungleTrophyOpen);
  const mapOpen = useUI((s) => s.mapOpen);
  const resultsOpen = useUI((s) => s.resultsOpen);
  const howToOpen = useUI((s) => s.howToOpen);
  const pilotOpen = useUI((s) => s.pilotOpen);
  const cloudLoginOpen = useUI((s) => s.cloudLoginOpen);

  // Returning players now land on the title screen too (its Continue button
  // goes straight back into the world). The 3D world mounts just AFTER the
  // first paint, so the title's loading curtain shows while it builds.
  const [mountWorld, setMountWorld] = useState(false);
  // THE JOURNEY (2026-10-13): the progression engine (gates, training,
  // world tours, celebrations) starts once and runs in the background.
  useEffect(() => { startJourney(); startProgressAutosave(); }, []);
  useEffect(() => {
    let a = 0, b = 0;
    a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setMountWorld(true)); });
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); };
  }, []);
  const title = phase === "creator";

  // Touch devices (phones / iPads): a body class for the touch-only CSS, and
  // no browser pinch-zoom / double-tap zoom of the whole game (iOS ignores
  // user-scalable=no) — the map viewer's own pinch uses pointer events.
  const touchMode = useUI((s) => s.touchMode);
  useEffect(() => {
    document.body.classList.toggle("touch-mode", touchMode);
  }, [touchMode]);
  // A challenge has the screen (its card + locked camera): phones tuck the
  // HUD's stats pill away so the card and the stage get the room.
  const challengeOn = useFarmChallengeActive();
  useEffect(() => {
    document.body.classList.toggle("challenge-on", challengeOn);
    return () => document.body.classList.remove("challenge-on");
  }, [challengeOn]);
  useEffect(() => {
    const stop = (e) => e.preventDefault();
    document.addEventListener("gesturestart", stop, { passive: false });
    document.addEventListener("gesturechange", stop, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("gesturechange", stop);
    };
  }, []);

  // Global "a modal/overlay is open" flag on <body>. CSS uses .modal-open to
  // hide ALL in-world (drei <Html>) labels so they never sit over a modal.
  const anyModalOpen = Boolean(activeEncounterId) || questLogOpen || trophyOpen || farmTrophyOpen || snowTrophyOpen || magmaTrophyOpen || jungleTrophyOpen || mapOpen || resultsOpen || howToOpen || pilotOpen || cloudLoginOpen;
  useEffect(() => {
    document.body.classList.toggle("modal-open", anyModalOpen);
    return () => document.body.classList.remove("modal-open");
  }, [anyModalOpen]);

  // "M" opens / closes the world map (any world that has one), unless a
  // challenge, a modal or a text box has the keyboard.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key.toLowerCase() !== "m" || e.repeat) return;
      const tag = (e.target && e.target.tagName) || "";
      if (/input|textarea|select/i.test(tag) || (e.target && e.target.isContentEditable)) return;
      if (phase !== "playing") return;
      const ui = useUI.getState();
      if (ui.mapOpen) { ui.closeMap(); return; }
      if (activeEncounterId || ui.wallView || isAnyChallengeActive()) return;
      if (!hasRegionMap(useSession.getState().currentRegionId)) return;
      ui.openMap();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, activeEncounterId]);

  // Global keyboard listener for the interaction key — ENTER (E still
  // works quietly; game/interaction.js). Handled here (outside the Canvas) so
  // opening the modal, which is plain HTML, is straightforward. The
  // interactable tells us which encounter to run, so the world never
  // hardcodes encounter logic. Enter does a lot of jobs, so it only
  // interacts when nothing else owns it: not while typing, not when another
  // handler already used this press (the dialogue's Next, a focused button),
  // not in a challenge / the map / the wall look / a modal, not in front of
  // the Achievements Wall (its own Enter wins), and not in the half-second
  // after a conversation closes (a quick double-press can't re-open it).
  const closedAt = useRef(0);
  const hadEncounter = useRef(false);
  useEffect(() => {
    if (hadEncounter.current && !activeEncounterId) closedAt.current = Date.now();
    hadEncounter.current = Boolean(activeEncounterId);
  }, [activeEncounterId]);
  useEffect(() => {
    function onKeyDown(e) {
      if (!isInteractKey(e) || e.defaultPrevented || isTypingTarget(e.target)) return;
      // A button in a card / dialog has the focus → Enter is for that button.
      if (e.target && e.target.closest && e.target.closest('[role="dialog"], .modal-overlay, .jcelebrate-overlay, .coach, .admin-overlay')) return;
      if (phase !== "playing" || !nearbyId || activeEncounterId) return;
      const ui = useUI.getState();
      if (ui.wallView || ui.mapOpen) return;
      if (document.body.classList.contains("modal-open") || useWipeout.getState().active) return;
      if (isAnyChallengeActive()) return;
      if (e.key === "Enter" && useSession.getState().currentRegionId === "island-1" && inWallPromptZone(playerState.x, playerState.z)) return;
      if (Date.now() - closedAt.current < 500) return;
      const interactable = getInteractable(nearbyId);
      if (interactable) {
        // Stop this same keystroke reaching a focused button, or being typed
        // into the answer box that's about to mount (the old "e leaks in").
        e.preventDefault();
        // Shared with the touch "Interact with X?" confirm (W4-C).
        triggerInteraction(interactable);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, nearbyId, activeEncounterId, openEncounter]);

  return (
    <div className="game-shell">
      <BilingualLayer />
      {/* The 3D scene. Soft PCF shadows + ACES tone mapping (a touch brighter for
          a warm, storybook feel). dpr capped at 2 so retina/tablets stay sharp
          without over-rendering. */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 6, 10], fov: 50 }}
        onCreated={({ gl }) => { gl.toneMappingExposure = 1.0; }}
      >
        {mountWorld && <World title={title} />}
        {mountWorld && <WorldReady />}
      </Canvas>

      {title ? (
        <>
          <TitleScreen />
          <CloudLogin />
        </>
      ) : (
      <>
      {/* 2D overlays rendered on top of the canvas. */}
      <HUD />
      <InteractionPrompt />
      <TouchControls />
      <RotateHint />
      <FarmChallengePanel />
      <RoundUpPanel />
      <OrderPartsPanel />
      <CratePackingPanel />
      <MilkSplitterPanel />
      <WeighStationPanel />
      <TradingPostPanel />
      <VeggiePlotPanel />
      <PlankGapPanel />
      <FarmShopPanel />
      <SnowballRangePanel />
      <RinkGlidePanel />
      <GroveLightsPanel />
      <MeadowLevelPanel />
      <SledSlopePanel />
      <VillageSplitPanel />
      <ColonyPairsPanel />
      <CaveCrystalsPanel />
      <LodgeYardPanel />
      <AuroraLookoutPanel />
      <MagmaPanels />
      <JunglePanels />
      <BlockedGatePrompt />
      <AchievementsWallUI />
      <QuestLog />
      <TrophyRoom />
      <FarmTrophyGrid />
      <SnowTrophyGrid />
      <MagmaTrophyGrid />
      <JungleTrophyGrid />
      <MapViewer />
      <ResultsCentre />
      {activeEncounterId === "__dialogue__" ? (
        <div className="modal-overlay dlg-overlay"><DynamicDialogue /></div>
      ) : (
        activeEncounterId && <EncounterModal encounterId={activeEncounterId} />
      )}
      {/* The journey (2026-10-13) — replaces the old one-time welcome card
          (ui/OnboardingWelcome.jsx, kept for reference). */}
      <CoachCard />
      <TrainingPrompt />
      <AdminPanel />
      <JourneyCelebration />
      <HowToPlay />
      <TeacherPilotCard />
      <CloudLogin />
      <UnlockCelebration />
      <ToastLayer />
      <WipeoutOverlay />
      </>
      )}
    </div>
  );
}
