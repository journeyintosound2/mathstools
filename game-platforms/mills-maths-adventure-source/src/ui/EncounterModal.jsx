import React, { useEffect } from "react";

import { getEncounter } from "../data/encounters.js";
import { useSession } from "../game/sessionStore.js";
import { useUI } from "./effects/uiStore.js";

// Opens the Trophy Room then dismisses this encounter (used if the trophy stand
// is opened as an encounter, e.g. from the DevPanel).
function TrophyBoardOpener() {
  const setTrophy = useUI((s) => s.setTrophy);
  const closeEncounter = useSession((s) => s.closeEncounter);
  useEffect(() => {
    setTrophy(true);
    closeEncounter();
  }, [setTrophy, closeEncounter]);
  return null;
}

// Encounter types that are safe to close with Escape (no progress to lose).
// mathsChallenge is intentionally excluded — it has its own leave-with-confirm.
const ESCAPE_SAFE = new Set([
  "dialogue", "treasure", "gate", "missionBoard", "battlePlaceholder", "bossPlaceholder",
]);

import MathsEncounter from "./encounters/MathsEncounter.jsx";
import MissionBoardEncounter from "./encounters/MissionBoardEncounter.jsx";
import MissionBuilder from "./encounters/MissionBuilder.jsx";
import DialogueEncounter from "./encounters/DialogueEncounter.jsx";
import TreasureEncounter from "./encounters/TreasureEncounter.jsx";
import GateEncounter from "./encounters/GateEncounter.jsx";
import BattlePlaceholder from "./encounters/BattlePlaceholder.jsx";
import BossPlaceholder from "./encounters/BossPlaceholder.jsx";

/**
 * EncounterModal is a ROUTER, not an implementation.
 *
 * It takes an encounterId, looks up the encounter data, and renders the
 * component that knows how to run that `type`. Adding a new encounter type is
 * therefore a two-step job: write a new component, then add a `case` here.
 *
 * Every encounter component is given the encounter data and is responsible for
 * calling progress.completeEncounter(...) and session.closeEncounter() itself.
 */
export default function EncounterModal({ encounterId }) {
  const closeEncounter = useSession((s) => s.closeEncounter);
  const encounter = getEncounter(encounterId);

  // Escape closes safe modals (maths challenges handle their own leave flow).
  useEffect(() => {
    if (!encounter || !ESCAPE_SAFE.has(encounter.type)) return undefined;
    function onKey(e) {
      if (e.key === "Escape") closeEncounter();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [encounter, closeEncounter]);

  // Defensive: an unknown id should never crash the game.
  if (!encounter) {
    return (
      <div className="modal-overlay">
        <div className="modal-card">
          <p>Unknown encounter: {encounterId}</p>
          <button className="primary-button" onClick={closeEncounter}>
            Close
          </button>
        </div>
      </div>
    );
  }

  let body;
  switch (encounter.type) {
    case "mathsChallenge":
      body = <MathsEncounter encounter={encounter} />;
      break;
    case "missionBoard":
      body = <MissionBoardEncounter encounter={encounter} />;
      break;
    case "missionBuilder":
      body = <MissionBuilder encounter={encounter} />;
      break;
    case "trophyBoard":
      body = <TrophyBoardOpener />;
      break;
    case "dialogue":
      body = <DialogueEncounter encounter={encounter} />;
      break;
    case "treasure":
      body = <TreasureEncounter encounter={encounter} />;
      break;
    case "gate":
      body = <GateEncounter encounter={encounter} />;
      break;
    case "battlePlaceholder":
      body = <BattlePlaceholder encounter={encounter} />;
      break;
    case "bossPlaceholder":
      body = <BossPlaceholder encounter={encounter} />;
      break;
    default:
      body = (
        <div className="modal-card">
          <p>Encounter type "{encounter.type}" is not supported yet.</p>
          <button className="primary-button" onClick={closeEncounter}>
            Close
          </button>
        </div>
      );
  }

  // A conversation docks along the bottom (ui/dialogue/DialogueBox.jsx).
  return <div className={`modal-overlay${encounter.type === "dialogue" ? " dlg-overlay" : ""}`}>{body}</div>;
}
