import React from "react";

import { useMarketChallenge } from "../stores/marketStore.js";
import LadderSet, { useLadderRound } from "./LadderSet.jsx";
import { LADDER_Z } from "./VineLadder.jsx";
import { AwningStall, FruitCrate, SignBoard, fruitColor } from "./JungleProps.jsx";
import { Chip } from "../../magma/stages/StageKit.jsx";
import { ConfettiBurst } from "../../OrderPartsChallenge.jsx";
import { MARKET_FRUIT } from "../../../data/jungle/marketChallenge.js";
import { fmtMoney, fmtVal, vineChip, rungFor } from "../../../data/jungle/vineLadder.js";

/**
 * SUNNY MARKET — the vine ladder in front of the market stalls on top of
 * Sunny Knoll: fruit on the top vine, dollars below. Best-buy rounds hang a
 * THREE-vine ladder (Stall A's dollars above the shared fruit vine, Stall
 * B's below), so a common amount of fruit lines up straight down both — then
 * the better stall gets the "Best buy" banner.
 */

const ONE = [2.75, 1.35];
const THREE = [2.85, 2.0, 1.15]; // Stall A $ · the shared fruit vine · Stall B $
const DOLLARS = { kind: "money", icon: "💲", one: "dollar", many: "dollars" };
const IDLE_L = { top: MARKET_FRUIT[0], bottom: DOLLARS, a: 4, b: 1000 };
const fruitLabel = (f) => `${f.icon} ${f.kind === "kg" ? "kg" : f.many}`;
const amount = (fruit, v) => (fruit.kind === "kg" ? fmtVal("kg", v) : vineChip(fruit, v));

export default function MarketStage({ labels = true }) {
  const S = useLadderRound(useMarketChallenge);
  const { running, round, ended, status, hits, common, called } = S;
  const compare = running && round.kind === "compare";
  const fruit = running ? round.fruit : MARKET_FRUIT[0];
  const col = fruitColor(fruit.one);

  const priceOf = (li, v) => {
    const r = rungFor(round.ladders[li].L, "top", v);
    return r ? fmtMoney(r[1]) : "";
  };

  return (
    <group>
      <LadderSet
        S={S}
        ys={ONE}
        ys3={THREE}
        labels={labels}
        idleL={IDLE_L}
        idleNames={[fruitLabel(fruit), "💲 dollars"]}
        names={(r) => [fruitLabel(r.fruit), "💲 dollars"]}
        sharedNames={(r) => ["Stall A 💲", fruitLabel(r.fruit), "Stall B 💲"]}
      />

      {/* The stalls behind: one for the price rounds, two for best buys. */}
      {!compare ? (
        <AwningStall position={[5.0, 0, -3.3]} width={2.8} stripes={["#e76f51", "#fff3d6"]}>
          <FruitCrate position={[0.6, 1.06, 0.2]} color={col} n={9} />
          <FruitCrate position={[-0.5, 1.06, 0.2]} color={col} n={6} />
          <SignBoard position={[0, 2.15, 0.62]} width={2.3} show={labels}>
            {running ? `${amount(fruit, round.L.a)} = ${fmtMoney(round.L.b)}` : "Sunny Market"}
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
      {compare && ended && called !== null && common !== null && (
        <Chip position={[0.6, THREE[0] + 1.05, LADDER_Z]} df={9} className={`fc-count-chip${called === round.better ? " good" : ""}`}>
          {`⭐ ${round.ladders[round.better].name}: ${amount(fruit, common)} for ${priceOf(round.better, common)} — the better buy`}
        </Chip>
      )}

      {running && ended && !compare && hits.length > 0 && (
        <Chip position={[0.6, ONE[0] + 1.1, LADDER_Z]} df={9} className="fc-count-chip good">
          {`${amount(fruit, round.goal[0])} = ${fmtMoney(round.goal[1])} ✓`}
        </Chip>
      )}
      {status === "celebrate" && <ConfettiBurst origin={[0.6, 1.2, LADDER_Z + 0.6]} />}
    </group>
  );
}
