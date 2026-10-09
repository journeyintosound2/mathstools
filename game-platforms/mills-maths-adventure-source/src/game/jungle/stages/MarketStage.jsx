import React from "react";

import { useMarketChallenge } from "../stores/marketStore.js";
import VineLadder, { CompareLadder, useLadderScale, niceEnd, ladderEnd, LADDER_Z } from "./VineLadder.jsx";
import { AwningStall, FruitCrate, SignBoard, fruitColor } from "./JungleProps.jsx";
import { Chip } from "../../magma/stages/StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";
import { MARKET_FRUIT } from "../../../data/jungle/marketChallenge.js";
import { fmtMoney, fmtVal, vineChip, rungFor } from "../../../data/jungle/vineLadder.js";

/**
 * SUNNY MARKET — the vine ladder in front of the market stalls on top of
 * Sunny Knoll: fruit on the top vine, dollars below. Best-buy rounds hang
 * TWO ladders (Stall A above, Stall B below) on the SAME fruit scale, so a
 * common rung lines up straight down both — then the better stall gets the
 * "Best buy" banner.
 */

const ONE = [2.75, 1.35];
const THREE = [2.85, 2.0, 1.15]; // Stall A $ · the shared fruit vine · Stall B $
const DOLLARS = { kind: "money", icon: "💲", one: "dollar", many: "dollars" };
const IDLE_L = { top: MARKET_FRUIT[0], bottom: DOLLARS, a: 4, b: 1000 };
const fruitLabel = (f) => `${f.icon} ${f.kind === "kg" ? "kg" : f.many}`;

export default function MarketStage({ labels = true }) {
  const status = useMarketChallenge((s) => s.status);
  const round = useMarketChallenge((s) => s.currentRound());
  const ladders = useMarketChallenge((s) => s.ladders);
  const active = useMarketChallenge((s) => s.active);
  const sel = useMarketChallenge((s) => s.sel);
  const pending = useMarketChallenge((s) => s.pending);
  const wrong = useMarketChallenge((s) => s.wrong);
  const hit = useMarketChallenge((s) => s.hit);
  const common = useMarketChallenge((s) => s.common);
  const called = useMarketChallenge((s) => s.called);

  const running = round && (status === "play" || status === "celebrate" || status === "feedback");
  const ended = status === "celebrate" || status === "feedback";
  const compare = running && round.kind === "compare";
  const maxShown = running
    ? Math.max(...ladders.flatMap((l) => l.rungs.map((r) => r[0])), pending ? pending.rung[0] : 0)
    : 8;
  const endTop = running
    ? ladderEnd(maxShown, round.goal ? round.goal[0] : null, compare ? Math.min(...round.ladders.map((l) => l.start[0][0])) : round.ladders[0].start[0][0])
    : niceEnd(8);
  const scaleRef = useLadderScale(endTop);
  const fruit = running ? round.fruit : MARKET_FRUIT[0];
  const col = fruitColor(fruit.one);

  const ladderProps = (li, ys) => ({
    L: round.ladders[li].L,
    ys,
    rungs: ladders[li] ? ladders[li].rungs : [],
    scaleRef,
    drive: round.drive,
    sel: ended || active !== li ? [] : sel,
    active: !compare || active === li,
    pending: !ended && pending && pending.li === li ? pending : null,
    wrong: !ended && wrong && wrong.li === li ? wrong : null,
    goal: round.kind === "reach" ? round.goal : null,
    hitTop: hit && hit.li === li && ladders[li] ? ladders[li].rungs[hit.i][0] : null,
    commonTop: common,
    onTap: ended ? undefined : (i) => useMarketChallenge.getState().select(li, i),
    endTop,
  });

  const priceOf = (li, v) => {
    const r = rungFor(round.ladders[li].L, "top", v);
    return r ? fmtMoney(r[1]) : "";
  };

  return (
    <group>
      {!running && (
        <VineLadder L={IDLE_L} ys={ONE} rungs={[]} scaleRef={scaleRef} names={[fruitLabel(fruit), "💲 dollars"]} idle labels={labels} />
      )}
      {running && !compare && (
        <VineLadder {...ladderProps(0, ONE)} names={[fruitLabel(fruit), "💲 dollars"]} />
      )}
      {running && compare && (
        <CompareLadder
          ladders={round.ladders.map((l, li) => ({ L: l.L, rungs: ladders[li] ? ladders[li].rungs : [] }))}
          ys={THREE}
          scaleRef={scaleRef}
          active={ended ? -1 : active}
          sel={ended ? [] : sel}
          pending={!ended ? pending : null}
          wrong={!ended ? wrong : null}
          common={common}
          called={called}
          better={round.better}
          endTop={endTop}
          labels={labels}
          names={["Stall A 💲", fruitLabel(fruit), "Stall B 💲"]}
          onTap={ended ? undefined : (li, i) => useMarketChallenge.getState().select(li, i)}
        />
      )}

      {/* The stalls behind: one for the price rounds, two for best buys. */}
      {!compare ? (
        <AwningStall position={[5.0, 0, -3.3]} width={2.8} stripes={["#e76f51", "#fff3d6"]}>
          <FruitCrate position={[0.6, 1.06, 0.2]} color={col} n={9} />
          <FruitCrate position={[-0.5, 1.06, 0.2]} color={col} n={6} />
          <SignBoard position={[0, 2.15, 0.62]} width={2.3} show={labels}>
            {running ? `${fruit.kind === "kg" ? fmtVal("kg", round.L.a) : vineChip(fruit, round.L.a)} = ${fmtMoney(round.L.b)}` : "Sunny Market"}
          </SignBoard>
        </AwningStall>
      ) : (
        <>
          {[0, 1].map((li) => (
            <AwningStall key={li} position={[li === 0 ? -1.4 : 4.6, 0, -6.2]} width={2.6} stripes={li === 0 ? ["#2a9d8f", "#e9f5f2"] : ["#e9c46a", "#fff8e1"]}>
              <FruitCrate position={[0.5, 1.06, 0.2]} color={col} n={9} />
              <FruitCrate position={[-0.55, 1.06, 0.2]} color={col} n={4} />
            </AwningStall>
          ))}
        </>
      )}

      {/* The verdict on a best buy: the winning stall at the common amount. */}
      {running && compare && ended && called !== null && common !== null && (
        <Chip position={[0.6, THREE[0] + 1.05, LADDER_Z]} df={9} className={`fc-count-chip${called === round.better ? " good" : ""}`}>
          {`⭐ ${round.ladders[round.better].name}: ${fruit.kind === "kg" ? fmtVal("kg", common) : vineChip(fruit, common)} for ${priceOf(round.better, common)} — the better buy`}
        </Chip>
      )}

      {running && ended && !compare && hit && (
        <Chip position={[0.6, ONE[0] + 1.1, LADDER_Z]} df={9} className="fc-count-chip good">
          {`${fruit.kind === "kg" ? fmtVal("kg", round.goal[0]) : vineChip(fruit, round.goal[0])} = ${fmtMoney(round.goal[1])} ✓`}
        </Chip>
      )}
      {status === "celebrate" && <ConfettiBurst origin={[0.6, 1.2, LADDER_Z + 0.6]} />}
    </group>
  );
}
