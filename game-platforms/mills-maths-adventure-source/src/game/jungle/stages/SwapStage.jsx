import React from "react";

import { useSwapChallenge } from "../stores/swapStore.js";
import VineLadder, { useLadderScale, niceEnd, ladderEnd, LADDER_Z } from "./VineLadder.jsx";
import { ThatchStall, Monkey, FruitCrate, SignBoard } from "./JungleProps.jsx";
import { Chip } from "../../magma/stages/StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";
import { BANANA, MANGO } from "../../../data/jungle/swapChallenge.js";

/**
 * MONKEY SWAP — the vine ladder strung across the Palm Grove, bananas on the
 * top vine, mangoes below, knotted together at the zero post. The monkeys'
 * thatched fruit stall stands behind on the right with the DEAL board; the
 * monkey on the counter hops when a swap lands. Idle (no challenge running)
 * the vines hang empty so the clearing reads as "something happens here".
 */

const YS = [2.75, 1.35];
const IDLE_L = { top: BANANA, bottom: MANGO, a: 3, b: 2 };

export default function SwapStage({ labels = true }) {
  const status = useSwapChallenge((s) => s.status);
  const round = useSwapChallenge((s) => s.currentRound());
  const ladders = useSwapChallenge((s) => s.ladders);
  const sel = useSwapChallenge((s) => s.sel);
  const pending = useSwapChallenge((s) => s.pending);
  const wrong = useSwapChallenge((s) => s.wrong);
  const hit = useSwapChallenge((s) => s.hit);
  const last = useSwapChallenge((s) => s.last);

  const running = round && (status === "play" || status === "celebrate" || status === "feedback");
  const rungs = running && ladders[0] ? ladders[0].rungs : [];
  const goal = running && round.kind !== "smallest" ? round.goal : null;
  const maxShown = running ? Math.max(...rungs.map((r) => r[0]), pending ? pending.rung[0] : 0) : 12;
  const endTop = running ? ladderEnd(maxShown, goal ? goal[0] : null, round.kind !== "smallest" ? round.ladders[0].start[0][0] : null) : niceEnd(12);
  const scaleRef = useLadderScale(endTop);
  const ended = status === "celebrate" || status === "feedback";
  const deal = running ? round.ladders[0].start[0] : [3, 2];
  const hitRung = hit && rungs[hit.i] ? rungs[hit.i] : null;
  const cheer = status === "celebrate" && last ? last.at : 0;

  return (
    <group>
      <VineLadder
        L={running ? round.ladders[0].L : IDLE_L}
        ys={YS}
        rungs={rungs}
        scaleRef={scaleRef}
        drive={running ? round.drive : "top"}
        sel={ended ? [] : sel}
        pending={running && !ended ? pending : null}
        wrong={running && !ended ? wrong : null}
        goal={goal}
        hitTop={hitRung ? hitRung[0] : null}
        startTop={running && round.kind !== "smallest" ? deal[0] : null}
        fruit={running && round.fruit}
        onTap={running && !ended ? (i) => useSwapChallenge.getState().select(0, i) : undefined}
        names={["🍌 bananas", "🥭 mangoes"]}
        idle={!running}
        labels={labels}
        endTop={endTop}
      />

      {/* The monkeys' stall, back right, with the deal board. */}
      <ThatchStall position={[5.1, 0, -3.2]} width={3.0}>
        <FruitCrate position={[0.75, 1.07, 0.25]} color="#ffd43b" n={9} />
        <FruitCrate position={[-0.2, 1.07, 0.25]} color="#ff8c2b" n={6} />
        <SignBoard position={[0, 2.25, 0.62]} width={2.4} show={labels}>
          {running && round.kind === "smallest" ? `Big offer: ${deal[0]} 🍌 → ${deal[1]} 🥭` : `Deal: ${deal[0]} 🍌 → ${deal[1]} 🥭`}
        </SignBoard>
      </ThatchStall>
      <Monkey position={[3.85, 1.07, -2.75]} rotation={-0.35} cheer={cheer} holding={status === "celebrate" ? "#ff8c2b" : null} />
      <Monkey position={[7.2, 0, -1.6]} rotation={-0.9} cheer={cheer ? cheer + 250 : 0} />

      {/* The swap lands: the deal on a chip + confetti. */}
      {running && ended && hitRung && (
        <Chip position={[0.6, YS[0] + 1.1, LADDER_Z]} df={9} className="fc-count-chip good">
          {round.kind === "smallest"
            ? `Smallest swap: ${hitRung[0]} 🍌 ↔ ${hitRung[1]} 🥭`
            : `${hitRung[0]} 🍌 ↔ ${hitRung[1]} 🥭 — it's a deal!`}
        </Chip>
      )}
      {status === "celebrate" && <ConfettiBurst origin={[0.6, 1.2, LADDER_Z + 0.6]} />}
    </group>
  );
}
