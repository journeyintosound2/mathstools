import { useSession } from "./sessionStore.js";
import { useProgress } from "../progress/store.js";
import { useUI } from "../ui/effects/uiStore.js";
import { getChain } from "../data/npcQuestChains.js";
import {
  mainQuestSnapshot,
  sageDialogue,
  npcDialogue,
  assignedMissionDialogue,
} from "../data/mainQuest.js";
import { routeForMission } from "../data/topicWorldRoutes.js";
import { isSchoolyardNpc, rollSchoolyardTopic } from "../data/schoolyard/schoolyardTopics.js";
import { setSchoolyardMissionTopic } from "../data/missions.js";
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
import { farmRecordLines } from "../data/farm/farmRecords.js";
import { exitMagmaExcept, magmaStore } from "./magma/magmaActive.js";
import { exitJungleExcept, jungleStore } from "./jungle/jungleActive.js";

// Only one in-world challenge (farm OR snow) runs at a time — starting one
// exits the others.
function exitFarmChallengesExcept(keep) {
  if (keep !== "fence") useFarmChallenge.getState().exit();
  if (keep !== "roundup") useRoundUp.getState().exit();
  if (keep !== "order") useOrderParts.getState().exit();
  if (keep !== "crate") useCratePacking.getState().exit();
  if (keep !== "milk") useMilkSplitter.getState().exit();
  if (keep !== "weigh") useWeighStation.getState().exit();
  if (keep !== "trade") useTradingPost.getState().exit();
  if (keep !== "veggie") useVeggiePlot.getState().exit();
  if (keep !== "plank") usePlankGap.getState().exit();
  if (keep !== "shop") useFarmShop.getState().exit();
  if (keep !== "snowrange") useSnowballRange.getState().exit();
  if (keep !== "snowrink") useRinkGlide.getState().exit();
  if (keep !== "snowpines") useGroveLights.getState().exit();
  if (keep !== "snowmeadow") useMeadowLevel.getState().exit();
  if (keep !== "snowsled") useSledSlope.getState().exit();
  if (keep !== "snowvillage") useVillageSplit.getState().exit();
  if (keep !== "snowcolony") useColonyPairs.getState().exit();
  if (keep !== "snowcave") useCaveCrystals.getState().exit();
  if (keep !== "snowyard") useLodgeYard.getState().exit();
  if (keep !== "snowlights") useAuroraLookout.getState().exit();
  // Magma Multiples keys are the challenge keys themselves ("columns" …).
  exitMagmaExcept(keep);
  // Emerald Jungle keys too ("swap", "market" …).
  exitJungleExcept(keep);
}

// The random treasure chest gives a small coins bonus, once per session.
const CHEST_COINS = 15;
let chestOpened = false;
// The Fraction Farm chest — its own once-per-session bonus, tracked separately.
const FARM_CHEST_COINS = 15;
let farmChestOpened = false;
let snowChestOpened = false;
let schoolChestOpened = false;

/**
 * Run the interaction for an interactable — the single source of truth shared by
 * BOTH the keyboard ("E") path in App.jsx AND the touch "Interact with X?"
 * confirm (W4-C). Opens the trophy room / the right progress-aware dialogue /
 * the assigned-mission dialogue / the NPC chain, or falls back to the object's
 * encounter. Reads all state via getState() so it works outside React.
 */
export function triggerInteraction(interactable) {
  if (!interactable) return;

  // The trophy stand opens the Trophy Room (not an encounter).
  if (interactable.id === "trophy-stand") {
    useUI.getState().setTrophy(true);
    return;
  }

  // The random treasure chest (W6-B): a small coins bonus, once per session
  // (re-findable — it moves to a new spot each load).
  if (interactable.id === "chest") {
    const prog = useProgress.getState();
    const openDlg = useSession.getState().openDialogue;
    if (!chestOpened) {
      chestOpened = true;
      prog.awardRewards({ coins: CHEST_COINS });
      useUI.getState().pushToast({ type: "reward", icon: "🪙", title: "Treasure!", message: `You found ${CHEST_COINS} coins.` });
      openDlg({ speaker: "Treasure Chest", lines: [`You pry open the old chest… ${CHEST_COINS} shiny coins inside! ✨`] });
    } else {
      openDlg({ speaker: "Treasure Chest", lines: ["Empty now — you already grabbed the coins. Another chest will wash up next time!"] });
    }
    return;
  }

  // The Fraction Farm treasure chest — same idea, its own once-per-session bonus.
  if (interactable.id === "farm-chest") {
    const prog = useProgress.getState();
    const openDlg = useSession.getState().openDialogue;
    if (!farmChestOpened) {
      farmChestOpened = true;
      prog.awardRewards({ coins: FARM_CHEST_COINS });
      useUI.getState().pushToast({ type: "reward", icon: "🪙", title: "Treasure!", message: `You found ${FARM_CHEST_COINS} coins.` });
      openDlg({ speaker: "Treasure Chest", lines: [`Tucked behind the hay… ${FARM_CHEST_COINS} shiny coins! ✨`] });
    } else {
      openDlg({ speaker: "Treasure Chest", lines: ["Empty now — you already grabbed the coins. Another chest will turn up next visit!"] });
    }
    return;
  }

  // The Snowball Sums treasure chest — its own once-per-session bonus.
  if (interactable.id === "snow-chest") {
    const prog = useProgress.getState();
    const openDlg = useSession.getState().openDialogue;
    if (!snowChestOpened) {
      snowChestOpened = true;
      prog.awardRewards({ coins: FARM_CHEST_COINS });
      useUI.getState().pushToast({ type: "reward", icon: "🪙", title: "Treasure!", message: `You found ${FARM_CHEST_COINS} coins.` });
      openDlg({ speaker: "Treasure Chest", lines: [`Frozen shut… crack! ${FARM_CHEST_COINS} icy coins! ❄️`] });
    } else {
      openDlg({ speaker: "Treasure Chest", lines: ["Empty now — you already grabbed the coins. Another chest will turn up next visit!"] });
    }
    return;
  }

  // The Playground's treasure chest — its own once-per-session bonus.
  if (interactable.id === "school-chest") {
    const prog = useProgress.getState();
    const openDlg = useSession.getState().openDialogue;
    if (!schoolChestOpened) {
      schoolChestOpened = true;
      prog.awardRewards({ coins: FARM_CHEST_COINS });
      useUI.getState().pushToast({ type: "reward", icon: "🪙", title: "Treasure!", message: `You found ${FARM_CHEST_COINS} coins.` });
      openDlg({ speaker: "Treasure Chest", lines: [`Lost property… ${FARM_CHEST_COINS} shiny coins! Finders keepers ✨`] });
    } else {
      openDlg({ speaker: "Treasure Chest", lines: ["Empty now — you already grabbed the coins. Another chest will turn up next visit!"] });
    }
    return;
  }

  // ---- Fraction Farm (F2–F5) ----
  // The challenge signs start their in-world challenges (the welcome sign
  // runs its normal dialogue encounter). Only ONE challenge runs at a time —
  // starting one quietly ends the others.
  if (interactable.id === "farm-fence-sign") {
    exitFarmChallengesExcept("fence");
    const farm = useFarmChallenge.getState();
    if (farm.status === "idle") farm.start();
    return;
  }
  if (interactable.id === "farm-roundup-sign") {
    exitFarmChallengesExcept("roundup");
    const roundup = useRoundUp.getState();
    if (roundup.status === "idle") roundup.start();
    return;
  }
  if (interactable.id === "farm-order-sign") {
    exitFarmChallengesExcept("order");
    const order = useOrderParts.getState();
    if (order.status === "idle") order.start();
    return;
  }
  if (interactable.id === "farm-crate-sign") {
    exitFarmChallengesExcept("crate");
    const crate = useCratePacking.getState();
    if (crate.status === "idle") crate.start();
    return;
  }
  if (interactable.id === "farm-milk-sign") {
    exitFarmChallengesExcept("milk");
    const milk = useMilkSplitter.getState();
    if (milk.status === "idle") milk.start();
    return;
  }
  if (interactable.id === "farm-weigh-sign") {
    exitFarmChallengesExcept("weigh");
    const weigh = useWeighStation.getState();
    if (weigh.status === "idle") weigh.start();
    return;
  }
  if (interactable.id === "farm-trade-sign") {
    exitFarmChallengesExcept("trade");
    const trade = useTradingPost.getState();
    if (trade.status === "idle") trade.start();
    return;
  }
  if (interactable.id === "farm-veggie-sign") {
    exitFarmChallengesExcept("veggie");
    const veggie = useVeggiePlot.getState();
    if (veggie.status === "idle") veggie.start();
    return;
  }
  if (interactable.id === "farm-plank-sign") {
    exitFarmChallengesExcept("plank");
    const plank = usePlankGap.getState();
    if (plank.status === "idle") plank.start();
    return;
  }
  if (interactable.id === "farm-shop-sign") {
    exitFarmChallengesExcept("shop");
    const shop = useFarmShop.getState();
    if (shop.status === "idle") shop.start();
    return;
  }

  // Farm trophy bench (F5) — gold/silver/bronze per challenge, built live
  // from the local bests (see data/farm/farmRecords.js).
  if (interactable.id === "farm-records") {
    useUI.getState().setFarmTrophy(true);
    return;
  }

  // ---- Snowball Sums (SR) ----
  // Pip's sign starts the Snowball Range (bridging to ten), like the farm
  // challenge signs.
  if (interactable.id === "snow-range-sign") {
    exitFarmChallengesExcept("snowrange");
    const range = useSnowballRange.getState();
    if (range.status === "idle") range.start();
    return;
  }
  // Fern's sign starts the Ice Rink glide (jumping by tens).
  if (interactable.id === "snow-rink-sign") {
    exitFarmChallengesExcept("snowrink");
    const rink = useRinkGlide.getState();
    if (rink.status === "idle") rink.start();
    return;
  }
  // Alby's sign starts the Christmas Tree Grove (compensation).
  if (interactable.id === "snow-pines-sign") {
    exitFarmChallengesExcept("snowpines");
    const grove = useGroveLights.getState();
    if (grove.status === "idle") grove.start();
    return;
  }
  // Frosty's sign starts Snowman Meadow (levelling).
  if (interactable.id === "snow-snowmen-sign") {
    exitFarmChallengesExcept("snowmeadow");
    const meadow = useMeadowLevel.getState();
    if (meadow.status === "idle") meadow.start();
    return;
  }
  // Flake's sign starts the Sledding Slope (constant difference).
  if (interactable.id === "snow-sled-sign") {
    exitFarmChallengesExcept("snowsled");
    const sled = useSledSlope.getState();
    if (sled.status === "idle") sled.start();
    return;
  }
  // Bloc's sign starts the Igloo Village (partitioning).
  if (interactable.id === "snow-village-sign") {
    exitFarmChallengesExcept("snowvillage");
    const village = useVillageSplit.getState();
    if (village.status === "idle") village.start();
    return;
  }
  // Pippin's sign starts the Penguin Colony (doubles + near-doubles).
  if (interactable.id === "snow-colony-sign") {
    exitFarmChallengesExcept("snowcolony");
    const colony = useColonyPairs.getState();
    if (colony.status === "idle") colony.start();
    return;
  }
  // Glim's sign starts the Ice Cave (think-addition).
  if (interactable.id === "snow-cave-sign") {
    exitFarmChallengesExcept("snowcave");
    const cave = useCaveCrystals.getState();
    if (cave.status === "idle") cave.start();
    return;
  }
  // Cocoa's sign starts the Lodge Yard (friends of 100).
  if (interactable.id === "snow-yard-sign") {
    exitFarmChallengesExcept("snowyard");
    const yard = useLodgeYard.getState();
    if (yard.status === "idle") yard.start();
    return;
  }
  // Nova's sign starts the Aurora Lookout (the strategy-picker capstone).
  if (interactable.id === "snow-lights-sign") {
    exitFarmChallengesExcept("snowlights");
    const lights = useAuroraLookout.getState();
    if (lights.status === "idle") lights.start();
    return;
  }

  // ---- Magma Multiples: each host (magma-<key>-host) starts its challenge;
  // the plaza trophy stand opens the magma trophy grid. ----
  const magmaHost = /^magma-([a-z]+)-host$/.exec(interactable.id || "");
  if (magmaHost && magmaStore(magmaHost[1])) {
    exitFarmChallengesExcept(magmaHost[1]);
    const st = magmaStore(magmaHost[1]).getState();
    if (st.status === "idle") st.start();
    return;
  }
  if (interactable.id === "magma-records") {
    useUI.getState().setMagmaTrophy(true);
    return;
  }

  // ---- Emerald Jungle: each host (jungle-<key>-host) starts its vine-ladder
  // challenge; the arrival glade's trophy stand opens the jungle trophy grid. ----
  const jungleHost = /^jungle-([a-z]+)-host$/.exec(interactable.id || "");
  if (jungleHost && jungleStore(jungleHost[1])) {
    exitFarmChallengesExcept(jungleHost[1]);
    const st = jungleStore(jungleHost[1]).getState();
    if (st.status === "idle") st.start();
    return;
  }
  if (interactable.id === "jungle-records") {
    useUI.getState().setJungleTrophy(true);
    return;
  }

  // Snowball Sums trophy stand (S2) — the ten (future-challenge) slots.
  if (interactable.id === "snow-records") {
    useUI.getState().setSnowTrophy(true);
    return;
  }

  const progress = useProgress.getState();
  const snap = mainQuestSnapshot(progress);
  const openDialogue = useSession.getState().openDialogue;
  const openEncounter = useSession.getState().openEncounter;

  // Mills — the guide (id stays "sage"). Progress-aware lines, then marked "met".
  if (interactable.id === "sage") {
    const lines = sageDialogue(snap); // compute BEFORE marking met
    progress.setSageMet();
    openDialogue({ speaker: "Mills", lines });
    return;
  }

  // Teacher/free-choice routing: if a non-story mission is active and routed to
  // THIS NPC/marker (and not done), start/resume the ASSIGNED mission.
  const active = progress.getActiveMission();
  if (active && active.kind !== "story") {
    const route = routeForMission(active);
    const missionDone = progress.completedMissions.includes(active.missionId);
    if (route.targetId === interactable.id && route.targetId !== "mission-board" && !missionDone) {
      openDialogue(assignedMissionDialogue(interactable.id, active));
      return;
    }
  }

  // Topic NPCs (chain) → progress-aware conversation; else the object's encounter.
  const chain = getChain(interactable.id);
  if (chain) {
    // Schoolyard staff default to a RANDOM Stage 4 topic, re-rolled on each
    // FRESH (not-yet-completed) encounter and kept distinct across the nine.
    // Once the warm-up is COMPLETE we do NOT re-roll — the NPC stays in its
    // "well done / key unlocked" state (a topic reassigns next reload). Teacher
    // assignments were already handled above, so we only reach here on the
    // default path.
    if (isSchoolyardNpc(interactable.id)) {
      const warmupId = `warmup-${interactable.id}`;
      if (!progress.completedMissions.includes(warmupId)) {
        const topic = rollSchoolyardTopic(interactable.id);
        setSchoolyardMissionTopic(interactable.id, topic.id, topic.name);
      }
    }
    openDialogue(npcDialogue(interactable.id, snap));
  } else {
    openEncounter(interactable.encounterId);
  }
}
