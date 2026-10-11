import React from "react";

import MagmaPanelShell from "../magma/MagmaPanelShell.jsx";
import LadderPlay from "./LadderPlay.jsx";
import { getJungleChallenge } from "../../data/jungle/jungleChallenges.js";
import { JUNGLE_ROUNDS_PER_SET } from "../../data/jungle/jungleRecords.js";
import { JUNGLE_REGION_ID } from "../../data/jungle/jungleLayout.js";
import { JUNGLE_STORES } from "../../game/jungle/jungleActive.js";
import { JUNGLE_INTROS, JUNGLE_MOVE_LABELS } from "./jungleIntros.jsx";

/**
 * EMERALD JUNGLE — the challenge cards. One shell (the Magma card, reused
 * with the jungle's registry + region) and ONE set of vine-ladder controls
 * (LadderPlay) shared by all ten challenges. Each challenge only brings its
 * two-step intro + example (jungleIntros.jsx) and, optionally, its own names
 * for the moves ("➕ One more swap").
 *
 * A right answer after a slip shows WHAT slipped (each wrong number with
 * the right one) and no "quick way": any route up the ladder is as good as
 * another (Jeff, 2026-10-10).
 */

/** What slipped on the way (shown on a right-answer card that lost points). */
export function ladderSlip(r, st) {
  const s = st.slips || [];
  if (!s.length) return null;
  const shown = s.slice(0, 3).join(" · ");
  return `What slipped: ${shown}${s.length > 3 ? ` · +${s.length - 3} more` : ""}.`;
}

const JUNGLE = {
  regionId: JUNGLE_REGION_ID,
  getMeta: getJungleChallenge,
  total: JUNGLE_ROUNDS_PER_SET,
  backLabel: "Back to the jungle",
  dockClass: "magma-dock jungle-dock",
  slipWorking: false,
  feedbackLead: "here's one way to see it:",
  feedbackZero: "Here's one way to see it:",
};

const plays = {};
function playFor(key, useStore) {
  if (!plays[key]) {
    const labels = JUNGLE_MOVE_LABELS[key] || {};
    plays[key] = function Play({ round }) {
      return <LadderPlay round={round} useStore={useStore} labels={labels} />;
    };
  }
  return plays[key];
}

export default function JunglePanels() {
  return (
    <>
      {JUNGLE_STORES.map(([key, useStore]) => (
        <MagmaPanelShell
          key={key}
          {...JUNGLE}
          useStore={useStore}
          intro={JUNGLE_INTROS[key]}
          Play={playFor(key, useStore)}
          slip={ladderSlip}
          celebrate={(r) => r.celebrate || "Right!"}
        />
      ))}
    </>
  );
}
