import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";

import World from "./game/World.jsx";
import TitleScreen from "./ui/TitleScreen.jsx";
import WorldReady from "./game/WorldReady.jsx";
import HUD from "./ui/HUD.jsx";
import EncounterModal from "./ui/EncounterModal.jsx";
import InteractionPrompt from "./ui/InteractionPrompt.jsx";
import InteractConfirm from "./ui/InteractConfirm.jsx";
import TouchControls from "./ui/TouchControls.jsx";
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
import ResultsCentre from "./ui/ResultsCentre.jsx";
import HowToPlay from "./ui/HowToPlay.jsx";
import TeacherPilotCard from "./ui/TeacherPilotCard.jsx";
import CloudLogin from "./ui/CloudLogin.jsx";
import BlockedGatePrompt from "./ui/BlockedGatePrompt.jsx";
import AchievementsWallUI from "./ui/AchievementsWallUI.jsx";
import OnboardingWelcome from "./ui/OnboardingWelcome.jsx";
import UnlockCelebration from "./ui/UnlockCelebration.jsx";
import DynamicDialogue from "./ui/encounters/DynamicDialogue.jsx";
import ToastLayer from "./ui/effects/ToastLayer.jsx";
import BilingualLayer from "./i18n/BilingualLayer.jsx";

import { useSession } from "./game/sessionStore.js";
import { useUI } from "./ui/effects/uiStore.js";
import { getInteractable } from "./data/interactables.js";
import { triggerInteraction } from "./game/interaction.js";

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
  const resultsOpen = useUI((s) => s.resultsOpen);
  const howToOpen = useUI((s) => s.howToOpen);
  const pilotOpen = useUI((s) => s.pilotOpen);
  const cloudLoginOpen = useUI((s) => s.cloudLoginOpen);

  // Returning players now land on the title screen too (its Continue button
  // goes straight back into the world). The 3D world mounts just AFTER the
  // first paint, so the title's loading curtain shows while it builds.
  const [mountWorld, setMountWorld] = useState(false);
  useEffect(() => {
    let a = 0, b = 0;
    a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setMountWorld(true)); });
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); };
  }, []);
  const title = phase === "creator";

  // Global "a modal/overlay is open" flag on <body>. CSS uses .modal-open to
  // hide ALL in-world (drei <Html>) labels so they never sit over a modal.
  const anyModalOpen = Boolean(activeEncounterId) || questLogOpen || trophyOpen || farmTrophyOpen || snowTrophyOpen || magmaTrophyOpen || resultsOpen || howToOpen || pilotOpen || cloudLoginOpen;
  useEffect(() => {
    document.body.classList.toggle("modal-open", anyModalOpen);
    return () => document.body.classList.remove("modal-open");
  }, [anyModalOpen]);

  // Global keyboard listener for the "E" interaction key.
  // We handle it here (outside the Canvas) so that opening the modal,
  // which is plain HTML, is straightforward. The interactable tells us which
  // encounter to run, so the world never hardcodes encounter logic.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key.toLowerCase() !== "e") return;
      if (useUI.getState().wallView) return; // looking at the Achievements Wall
      if (phase === "playing" && nearbyId && !activeEncounterId) {
        const interactable = getInteractable(nearbyId);
        if (interactable) {
          // Prevent this same keystroke from being typed into the answer input
          // that is about to mount and auto-focus (the "e leaks in" bug).
          e.preventDefault();
          // Shared with the touch "Interact with X?" confirm (W4-C).
          triggerInteraction(interactable);
        }
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
      <InteractConfirm />
      <TouchControls />
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
      <BlockedGatePrompt />
      <AchievementsWallUI />
      <QuestLog />
      <TrophyRoom />
      <FarmTrophyGrid />
      <SnowTrophyGrid />
      <MagmaTrophyGrid />
      <ResultsCentre />
      {activeEncounterId === "__dialogue__" ? (
        <div className="modal-overlay"><DynamicDialogue /></div>
      ) : (
        activeEncounterId && <EncounterModal encounterId={activeEncounterId} />
      )}
      <OnboardingWelcome />
      <HowToPlay />
      <TeacherPilotCard />
      <CloudLogin />
      <UnlockCelebration />
      <ToastLayer />
      </>
      )}
    </div>
  );
}
