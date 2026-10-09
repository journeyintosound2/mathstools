import React, { useEffect, useRef, useState } from "react";

import { useProgress, deriveLevel } from "../progress/store.js";
import { useSession } from "../game/sessionStore.js";
import { useUI } from "./effects/uiStore.js";
import { getInteractable } from "../data/interactables.js";
import { getAllQuests } from "../data/quests.js";
import { getQuestStatus, questProgress } from "../quests/questEngine.js";
import { MissionTracker } from "./MissionView.jsx";
import { useCloud } from "../cloud/cloudSession.js";
import { isFarmTaskDone } from "../cloud/farmCompletion.js";
import { studentChipLabel } from "../cloud/studentSession.js";
import { Bi, LanguageSelector } from "../i18n/i18n.jsx";
import TaskCompass from "./TaskCompass.jsx";
import { useActiveSnowChallenge } from "../game/farmChallengeActive.js";
import { useActiveMagmaChallenge } from "../game/magma/magmaActive.js";
import { firstOutstandingTask, taskObjectiveText } from "../data/taskCompass.js";

/**
 * The heads-up display overlaid on the 3D view.
 *
 * Shows, clearly and at a glance: the student's name, level, XP progress,
 * coins, and a dedicated Quest Tracker (current quest + objective + progress
 * bar). Also hosts the Quest Log, Results, Help and options buttons.
 */
export default function HUD() {
  const profile = useProgress((s) => s.profile);
  const xp = useProgress((s) => s.xp);
  const coins = useProgress((s) => s.coins);
  const completedEncounters = useProgress((s) => s.completedEncounters);
  const completedQuests = useProgress((s) => s.completedQuests);

  const nearbyId = useSession((s) => s.nearbyId);
  const activeEncounterId = useSession((s) => s.activeEncounterId);
  const openCreator = useSession((s) => s.openCreator);

  const toggleQuestLog = useUI((s) => s.toggleQuestLog);
  const toggleResults = useUI((s) => s.toggleResults);
  const toggleHowTo = useUI((s) => s.toggleHowTo);
  const setCloudLogin = useUI((s) => s.setCloudLogin);

  const cloudMode = useCloud((s) => s.mode);
  const cloudStudent = useCloud((s) => s.student);
  const farmTasks = useCloud((s) => s.farmTasks);
  const assignments = useCloud((s) => s.assignments);
  const questHudOn = useUI((s) => s.questHudOn);
  const toggleQuestHud = useUI((s) => s.toggleQuestHud);
  const soundEnabled = useUI((s) => s.soundEnabled);
  const toggleSound = useUI((s) => s.toggleSound);
  const cameraLock = useUI((s) => s.cameraLock);
  // A Snowball Sums challenge parks the player and docks its question card
  // at the BOTTOM of the screen — the movement hint is irrelevant then and
  // would sit under the card, so it steps aside.
  const snowChallenge = useActiveSnowChallenge();
  const magmaChallenge = useActiveMagmaChallenge();
  const toggleCameraLock = useUI((s) => s.toggleCameraLock);
  const cogOpen = useUI((s) => s.cogOpen);
  const toggleCog = useUI((s) => s.toggleCog);
  const touchMode = useUI((s) => s.touchMode);
  const toggleTouchMode = useUI((s) => s.toggleTouchMode);
  const graphicsQuality = useUI((s) => s.graphicsQuality);
  const toggleGraphicsQuality = useUI((s) => s.toggleGraphicsQuality);

  const activeMissionId = useProgress((s) => s.activeMissionId);
  const missionProgress = useProgress((s) => s.missionProgress);
  // Completed mission ids come from the progress store (the existing mission
  // completion structure). Default to [] so the HUD never crashes if the field
  // is missing during startup. The main-quest guidance guards internally.
  const completedMissions = useProgress((s) => s.completedMissions) || [];
  const earnedBadges = useProgress((s) => s.earnedBadges);
  const sageMet = useProgress((s) => s.sageMet);
  const championClaimed = useProgress((s) => s.championClaimed);
  const activeMission = useProgress((s) => s.activeMission);
  // Objectives are TEACHER-DRIVEN only. The on-screen objective line shows the
  // current teacher-set task (island / schoolyard NPC or a Fraction Farm
  // challenge) and nothing else — there are no curated "Find X" suggestions.
  // When the teacher has set no tasks, or every task is done, there is no
  // objective and the world is free to explore. The navigation compass reads the
  // same source, so the arrow and the objective always agree, and each advances
  // to the next task as the current one is completed.
  const taskIsDone = (t) =>
    t.location === "farm"
      ? isFarmTaskDone(t.assignmentId)
      : (completedMissions || []).includes(t.assignmentId);
  const currentTask = firstOutstandingTask(assignments, taskIsDone);
  const guidanceText = currentTask ? taskObjectiveText(currentTask) : null;

  const { level, xpIntoLevel, xpForLevel } = deriveLevel(xp);
  const xpPercent = Math.round((xpIntoLevel / xpForLevel) * 100);

  // Briefly animate the level badge whenever the level number increases.
  const [levelPulse, setLevelPulse] = useState(false);
  const prevLevel = useRef(level);
  useEffect(() => {
    if (level > prevLevel.current) {
      setLevelPulse(true);
      const t = setTimeout(() => setLevelPulse(false), 900);
      prevLevel.current = level;
      return () => clearTimeout(t);
    }
    prevLevel.current = level;
    return undefined;
  }, [level]);

  // "Q" opens/closes the Quest Log; "/" toggles first-person look. Both are
  // ignored while typing or mid-encounter.
  const toggleFpv = useUI((s) => s.toggleFpv);
  useEffect(() => {
    function onKey(e) {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (activeEncounterId) return;
      if (useUI.getState().wallView) return; // the Achievements Wall look owns the keys
      if (e.key.toLowerCase() === "q") toggleQuestLog();
      else if (e.key === "/") { e.preventDefault(); toggleFpv(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleQuestLog, toggleFpv, activeEncounterId]);

  // The quest tracker shows the first active quest (or a nearby prompt).
  const snapshot = { completedEncounters, completedQuests };
  const activeQuest = getAllQuests().find(
    (q) => getQuestStatus(q, snapshot) === "active"
  );
  const nearby = nearbyId ? getInteractable(nearbyId) : null;

  let trackerBody;
  if (nearby && !activeEncounterId) {
    trackerBody = (
      <div className="tracker-prompt">
        <Bi>Press</Bi> <kbd>E</kbd> — <Bi>{nearby.promptLabel}</Bi>
      </div>
    );
  } else if (activeQuest) {
    const { done, total } = questProgress(activeQuest, snapshot);
    const pct = Math.round((done / total) * 100);
    trackerBody = (
      <>
        <div className="tracker-title"><Bi>{activeQuest.title}</Bi></div>
        <div className="tracker-desc"><Bi>{activeQuest.description}</Bi></div>
        <div className="tracker-progress">
          <div className="tracker-bar">
            <div className="tracker-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="tracker-count">{done}/{total}</span>
        </div>
      </>
    );
  } else {
    trackerBody = (
      <div className="tracker-desc"><Bi>All quests complete — explore freely! 🎉</Bi></div>
    );
  }

  return (
    <div className="hud">
      <TaskCompass />
      {/* Top-left: player stats */}
      <div className="hud-panel hud-stats">
        <div className="hud-name">{profile.name}</div>

        <div className="hud-row">
          <span className={`hud-badge ${levelPulse ? "pulse" : ""}`}>Lv {level}</span>
          <div className="xp-bar">
            <div className="xp-fill" style={{ width: `${xpPercent}%` }} />
            <span className="xp-text">{xpIntoLevel} / {xpForLevel} XP</span>
          </div>
        </div>

        <div className="hud-row">
          <span className="coin">🪙</span>
          <span className="coin-count">{coins}</span>
        </div>
      </div>

      {/* Top-right: controls */}
      <div className="hud-buttons">
        <button className="hud-icon-btn" onClick={toggleQuestLog} title="Quest Log (Q)">
          📜 <Bi>Quests</Bi>
        </button>
        <button className="hud-icon-btn" onClick={toggleResults} title="Results Centre">
          📊 <Bi>Results</Bi>
        </button>
        <button className="hud-icon-btn" onClick={toggleHowTo} title="How to play">
          ❔ <Bi>Help</Bi>
        </button>
        <button
          className={`hud-icon-btn cloud-chip cloud-${cloudMode}`}
          onClick={() => setCloudLogin(true)}
          title="Cloud sign-in / demo mode"
        >
          {cloudMode === "registered" && cloudStudent
            ? `☁ ${studentChipLabel(cloudStudent)}`
            : cloudMode === "skip"
              ? "☁ Demo (local)"
              : "☁ Sign in"}
        </button>

        {/* Options cog (⚙): Camera Lock + Quest HUD live here. */}
        <div className="cog-wrap">
          <button
            className={`hud-icon-btn ${cogOpen ? "active" : ""}`}
            onClick={toggleCog}
            title="Options"
            aria-label="Options"
          >
            ⚙
          </button>
          {cogOpen && (
            <div className="cog-menu">
              <div className="cog-item cog-item-static" title="Choose the language shown alongside English">
                <span><Bi>Language</Bi></span>
                <LanguageSelector compact />
              </div>
              <button className="cog-item" onClick={toggleCameraLock}>
                <span><Bi>Camera Lock</Bi></span>
                <span className={`cog-switch ${cameraLock ? "on" : ""}`}><Bi>{cameraLock ? "On" : "Off"}</Bi></span>
              </button>
              <button className="cog-item" onClick={toggleQuestHud}>
                <span><Bi>Quest HUD</Bi></span>
                <span className={`cog-switch ${questHudOn ? "on" : ""}`}><Bi>{questHudOn ? "On" : "Off"}</Bi></span>
              </button>
              <button className="cog-item" onClick={toggleSound}>
                <span><Bi>Sound</Bi></span>
                <span className={`cog-switch ${soundEnabled ? "on" : ""}`}><Bi>{soundEnabled ? "On" : "Off"}</Bi></span>
              </button>
              <button className="cog-item" onClick={toggleTouchMode} title="Tap-to-move + on-screen keypad (for phones/tablets)">
                <span><Bi>Touch controls</Bi></span>
                <span className={`cog-switch ${touchMode ? "on" : ""}`}><Bi>{touchMode ? "On" : "Off"}</Bi></span>
              </button>
              <button className="cog-item" onClick={toggleGraphicsQuality} title="Higher = richer lighting (best on a computer); Lower = smoother on phones/tablets">
                <span><Bi>Graphics</Bi></span>
                <span className={`cog-switch ${graphicsQuality === "high" ? "on" : ""}`}><Bi>{graphicsQuality === "high" ? "High" : "Low"}</Bi></span>
              </button>
              <button className="cog-item" onClick={() => { toggleCog(); openCreator(); }} title="Redesign your explorer + edit your name/code (keeps your progress)">
                <span><Bi>Edit name</Bi></span>
                <span className="cog-arrow">✏️</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Persistent Current Quest card — toggled by the Quest HUD button. When
          off, contextual "Press E" prompts still appear via InteractionPrompt. */}
      {questHudOn && (
        <div className="hud-panel hud-tracker">
          <span className="tracker-label">Current Quest</span>
          {trackerBody}
        </div>
      )}

      {/* Light "what next?" guidance (Phase 2G). */}
      {guidanceText && !activeEncounterId && (
        <div className="hud-guidance">🧭 <Bi>{guidanceText}</Bi></div>
      )}

      {/* Mission Tracker (only shown when a teacher mission is active) */}
      <MissionTracker />

      {!snowChallenge && !magmaChallenge && <div className="hud-panel hud-controls">
        {cameraLock
          ? <Bi>WASD / Arrows to move · Space to jump · Shift to run · E to interact · Q for quests · Camera follows you</Bi>
          : <Bi>WASD / Arrows to move · Space to jump · Shift to run · E to interact · Z / X to rotate camera · Q for quests</Bi>}
      </div>}
    </div>
  );
}
