import React, { useEffect } from "react";

import { useProgress } from "../progress/store.js";
import { useUI } from "./effects/uiStore.js";
import { getAllQuests } from "../data/quests.js";
import { getEncounter } from "../data/encounters.js";
import { getQuestStatus, questProgress } from "../quests/questEngine.js";
import { MissionDetails, BadgeShelf } from "./MissionView.jsx";
import JourneyPanel from "./journey/JourneyPanel.jsx";

/**
 * Quest Log — a panel students can open and close.
 *
 * Lists every quest grouped by status (active / completed / locked) and shows,
 * for each active quest, its objective checklist (which required encounters are
 * done) plus its rewards. It reads the same pure quest helpers the rest of the
 * game uses, so what it shows always matches the real game state.
 *
 * Open/close state lives in the UI store so the HUD button and the "Q" key
 * both control the same panel.
 */
export default function QuestLog() {
  const open = useUI((s) => s.questLogOpen);
  const setQuestLog = useUI((s) => s.setQuestLog);

  const completedEncounters = useProgress((s) => s.completedEncounters);
  const completedQuests = useProgress((s) => s.completedQuests);
  const snapshot = { completedEncounters, completedQuests };

  // Close on Escape for convenience.
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") setQuestLog(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setQuestLog]);

  if (!open) return null;

  const quests = getAllQuests();
  const ordered = [
    ...quests.filter((q) => getQuestStatus(q, snapshot) === "active"),
    ...quests.filter((q) => getQuestStatus(q, snapshot) === "completed"),
    ...quests.filter((q) => getQuestStatus(q, snapshot) === "locked"),
  ];

  return (
    <div className="questlog-overlay" onClick={() => setQuestLog(false)}>
      <div className="questlog-panel" onClick={(e) => e.stopPropagation()}>
        <div className="questlog-header">
          <h2>📜 Quest Log</h2>
          <button className="dev-close" onClick={() => setQuestLog(false)}>
            ✕
          </button>
        </div>

        <div className="questlog-body">
          {/* The journey (2026-10-13) — replaces the old "Unlock Number
              Island" main quest (MainQuestPanel in MissionView.jsx). */}
          <JourneyPanel />

          {/* Teacher-assigned mission + the student's badges (Phase 2D). */}
          <MissionDetails />
          <BadgeShelf />

          <h3 className="questlog-subhead">📜 Quests</h3>
          {ordered.map((quest) => {
            const status = getQuestStatus(quest, snapshot);
            const { done, total } = questProgress(quest, snapshot);
            const pct = Math.round((done / total) * 100);
            return (
              <div key={quest.id} className={`quest-card quest-${status}`}>
                <div className="quest-card-top">
                  <span className="quest-card-title">{quest.title}</span>
                  <span className={`quest-status-pill pill-${status}`}>{status}</span>
                </div>

                <p className="quest-card-desc">{quest.description}</p>

                {status !== "locked" && (
                  <>
                    <div className="quest-progress-bar">
                      <div className="quest-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <ul className="quest-objectives">
                      {quest.requiredEncounters.map((eid) => {
                        const enc = getEncounter(eid);
                        const ok = completedEncounters.includes(eid);
                        return (
                          <li key={eid} className={ok ? "obj-done" : "obj-todo"}>
                            {ok ? "☑" : "☐"} {enc ? enc.title : eid}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                {status === "locked" && (
                  <p className="quest-locked-note">
                    🔒 Unlocks after:{" "}
                    {quest.unlock.requiredQuests
                      .map((id) => quests.find((q) => q.id === id)?.title || id)
                      .join(", ")}
                  </p>
                )}

                <div className="quest-rewards">
                  Reward: {quest.rewards.xp} XP · {quest.rewards.coins} 🪙
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
