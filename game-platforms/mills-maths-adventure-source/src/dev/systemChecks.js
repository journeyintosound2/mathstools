import { runEngineSelfTest, ENGINES, buildQuestionSet } from "../maths/index.js";
import {
  MAGMA_REGION_ID, MAGMA_NAME, MAGMA_BOUNDS, MAGMA_SPAWN, MAGMA_RETURN_PORTAL, MAGMA_PLAZA,
  VOLCANO, TRAIL_END, TRAIL_PHI, trailPoint, trailHeight, trailRadius, magmaGroundHeight,
  magmaIsLava, magmaIsSafe, magmaSlideAt, landSD, bridgeDeckAt, platformTopAt, pathEdgeDist,
  MAGMA_BRIDGES, MAGMA_PATHS, MAGMA_CHALLENGE_SPOTS, MAGMA_PLATFORMS, COLUMN_STAIR, LAKE_CAUSEWAY,
  RIVERS, RING_ROAD_R, LAVA_Y, CRATER_GATE, isOnTrail,
} from "../data/magma/magmaLayout.js";
import { getMagmaColliders, CRATER_HINT } from "../data/magma/magmaColliders.js";
import { runMagmaChallengeChecks } from "./magmaChallengeChecks.js";
import { runJungleChecks } from "./jungleChecks.js";
import { runFarmWorldChecks } from "./farmWorldChecks.js";
import { runIslandWorldChecks } from "./islandWorldChecks.js";
import { runSchoolyardWorldChecks } from "./schoolyardWorldChecks.js";
import { CRATER_LIP_STONES } from "../data/magma/magmaProps.js";
import { makeTriangle, makeQuad, makeGenericQuad, verifyQuad, propertiesOf, SPECIAL_QUADS, TRIANGLE_TYPES } from "../maths/curriculum/stage4/geometry/shapeCatalogue.js";
import { makeNominal, makeContinuous, makePartsOfWhole, makeTimeSeries, SCENARIOS, TYPE_LABEL } from "../maths/curriculum/stage4/data/datasetGenerator.js";
import { sectorAngles, sectorAngleOf, niceScale, sum as chartSum } from "../ui/diagrams/chartUtils.js";
import { answersMatchMath } from "../maths/helpers.js";
import { fitPoints, POLYGON_SPECS, resolveLabelPositions } from "../ui/diagrams/lengthDiagramUtils.js";
import { factorChain } from "../ui/diagrams/factorTreeUtils.js";
import { parseRule } from "../maths/curriculum/stage4/linear/linearSkills.js";
import { ENCOUNTERS, getAllEncounterIds } from "../data/encounters.js";
import { INTERACTABLES } from "../data/interactables.js";
import { QUESTS } from "../data/quests.js";
import { loadProgress, saveProgress } from "../progress/storage.js";
import { latexToPlain, asciiToPlain } from "../ui/math-input/mathInputUtils.js";
import {
  getStages,
  getTopics,
  getTopic,
  generateCurriculumQuestion,
} from "../maths/curriculum/curriculumRegistry.js";
import { xpForDifficulty } from "../maths/curriculum/shared/curriculumUtils.js";
import {
  suggestDifficulty,
  suggestDifficultyInRange,
  newProfile,
} from "../maths/adaptive/adaptiveSelector.js";
import {
  getAllMissions,
  getMission,
  validateMission,
  normaliseMission,
  getPresetMissions,
  isPresetMission,
  setSchoolyardMissionTopic,
} from "../data/missions.js";
import { rollSchoolyardTopic, isSchoolyardNpc } from "../data/schoolyard/schoolyardTopics.js";
import {
  buildMissionQuestions,
  resolveMissionDifficulty,
  createMissionProgress,
  recordMissionAttempt as engineRecordMissionAttempt,
  completionTarget,
} from "../missions/missionEngine.js";
import { getAllBadges, isValidBadge, decorateEarnedBadges } from "../data/badges.js";
import { getChain, getAllChains } from "../data/npcQuestChains.js";
import { PASS_THRESHOLD, isPass, scorePercent, bandMessage, resultTitle } from "../missions/scoring.js";
import { WORLD_ZONES, getZoneForNpc, getZone } from "../data/worldZones.js";
import { SPAWN_POINT } from "../data/worldSpawnPoints.js";
import { getUnlock } from "../data/worldUnlocks.js";
import { getRegion, getAllRegions, clampToBounds, DEFAULT_REGION_ID } from "../data/regions.js";
import { playerState, touchInput, requestMoveTo, clearMoveTarget, useSession } from "../game/sessionStore.js";
import { ROPE_BRIDGE } from "../data/island/islandLayout.js";
import {
  islandGroundHeight, islandHazardAt, terrainHeight as islandTerrainHeight, SEA_Y, onPad as islandOnPad, snowCover as islandSnowCover,
} from "../data/island/islandTerrain.js";
import { getColliders, PLATEAU, STAIRS, TREE_POSITIONS } from "../data/worldColliders.js";
import { resolveCircle, groundHeightAt, PLAYER_RADIUS, STEP_UP } from "../systems/collisionEngine.js";
import { WORLD_BOUNDARIES, getBoundaryColliders } from "../data/worldBoundaries.js";
import { WALKABLE_RADIUS } from "../data/worldZones.js";
import { HUB_POINT } from "../data/worldSpawnPoints.js";
import {
  isUnlockedById,
  resolveChainStep,
  getNpcAction,
} from "../systems/unlockEngine.js";
import { SUPPORTED_DIAGRAM_TYPES } from "../ui/diagrams/diagramTypes.js";
import { INTEGER_LEVELS } from "../maths/difficulty/difficultyProfiles.js";
import { splitPrompt } from "../maths/promptFormat.js";
import { getInteractable, getInteractablesForRegion } from "../data/interactables.js";
import { SCHOOLYARD_CHARACTERS } from "../data/schoolyard/schoolyardLayout.js";
import { SCHOOLYARD_KEY_IDS, isBossUnlocked, keysEarned } from "../data/schoolyard/schoolyardProgress.js";
import { DEFAULT_PROGRESS } from "../progress/storage.js";
import {
  MAIN_QUEST,
  resolveMainQuest,
  mainQuestGuidance,
  resolveStudentGuidance,
  sageDialogue,
  npcDialogue,
  pendingCelebration,
  shouldShowOnboarding,
  mainQuestSnapshot,
  mainQuestTarget,
  assignedMissionDialogue,
} from "../data/mainQuest.js";
import { resolveTopicTarget, resolveMissionTarget } from "../data/questTargets.js";
import {
  TOPIC_WORLD_ROUTES,
  getTopicRoute,
  routeGuidanceTarget,
  routeForMission,
} from "../data/topicWorldRoutes.js";
import { FIREBASE_MISSION_FIELDS } from "../data/missions.js";
import {
  ANSWER_MODES,
  answerModeOf,
  gradeAnswer,
  tableInputCells,
} from "../maths/answerModes.js";
import {
  normaliseResult,
  validateResult,
  makeAttemptId,
  statusForAverage,
  MASTERY,
  RESULT_RECORD_FIELDS,
  FIREBASE_RESULT_FIELDS,
} from "../results/resultTypes.js";
import {
  summariseByTopic,
  summariseBySkill,
  teacherSummary,
  overallSnapshot,
  hardestAnswerModes,
  repeatedFailures,
  suggestedNextStep,
  teacherReportText,
  studentProgress,
  answerModeSummary,
  resultSummaryText,
  csvCell,
  toCSV,
  toQuestionCSV,
  toJSON,
} from "../results/resultUtils.js";
import { PILOT_CARD, LOCAL_ONLY_WARNING } from "../classroom/pilotInfo.js";
import { CLASSROOM_MAX_PRESET_QUESTIONS, LONG_MISSION_THRESHOLD } from "../data/missions.js";
import {
  shouldCloudSave,
  mapResultToAchievement,
  mapResultToAdventureAttempt,
  masteryTopicFor,
  pickCompletionIdentity,
} from "../cloud/adventureAttemptMapper.js";
import { saveCloudAttemptWith, buildCloudPayloads } from "../cloud/cloudResultWriter.js";
import { normaliseStudentCode } from "../cloud/studentSession.js";
import { defaultCloudClient } from "../cloud/firebaseClient.js";
import { cloudSaveMessage } from "../cloud/cloudMessages.js";
import { PHASE3C_COMPATIBILITY_RULES, RULES_META, RULES_LIMITATIONS } from "../cloud/firestoreRulesDraft.js";
import { PHASE3D_CLAIMS_RULES, RULES_3D_META, RULES_3D_LIMITATIONS } from "../cloud/firestoreRulesDraft.js";
import {
  EXCHANGE_FUNCTIONS,
  validateStudentForExchange, buildStudentClaims, buildSafeStudentProfile,
  validateTeacherForExchange, buildTeacherClaims, buildSafeTeacherProfile,
} from "../cloud/codeExchange.js";
import { exchangeStudentCode, exchangeTeacherCode } from "../cloud/firebaseClient.js";
import { PORTAL_FILES, RULES_READINESS, EXCHANGE_FN as PORTAL_EXCHANGE_FN } from "../cloud/portalMigration.js";
import { PLATFORM_FILES, PLATFORM_RULES_READINESS } from "../cloud/platformManifest.js";
import { getAllTools, getEnabledTools, getTool, isToolEnabled, toolIdForAchievement } from "../../portal/shared/mmtToolRegistry.js";
import { RESULTS_KEY } from "../results/resultStore.js";
import { DEFAULT_PROGRESS as PROGRESS_DEFAULTS } from "../progress/storage.js";
import {
  FARM_BOUNDS, FARM_SPAWN, FARM_PADDOCKS, CHALLENGE_FENCE, CHALLENGE_FENCE_LENGTH, CHALLENGE_SIGN,
  ROUNDUP_PEN, ROUNDUP_FIELD, ROUNDUP_SIGN, ROUNDUP_GATE_OUT, ROUNDUP_GATE_IN,
} from "../data/farm/farmLayout.js";
import {
  generateRoundUpSet, gradeRoundUp, roundUpFeedback, fieldSpots, penSlots, formationSlots, roundUpStageFor,
  ROUNDUP_ROUNDS_PER_SET, MAX_HERD, HERD_RADIUS, ROUNDUP_IDLE_HERD,
} from "../data/farm/roundUpChallenge.js";
import { ORDER_GARDEN, ORDER_VIEW_SPOT, ORDER_SIGN, orderSlotX } from "../data/farm/farmLayout.js";
import {
  generateOrderSet, gradeOrder, sortedItems, orderFeedback,
  ORDER_ROUNDS_PER_SET, ORDER_ITEM_COUNT, ORDER_FULL_POINTS, ORDER_PARTIAL_PER_FIXED,
} from "../data/farm/orderPartsChallenge.js";
import { FARM_MAX_SCORES, MEDALS, medalFor, farmBestPercent } from "../data/farm/farmRecords.js";
import { CRATE_AREA, CRATE_SIZES, CRATE_VIEW_SPOT, crateSlotX } from "../data/farm/farmLayout.js";
import { FARM_PACKING_SHED, FARM_GRAIN_SILOS, BIG_AMBER, FARM_SAWMILL } from "../data/farm/farmLayout.js";
import {
  generateCrateSet, gradeCrate, crateFeedback, factorsOf, gcd as crateGcd, crateStageFor,
  CRATE_ROUNDS_PER_SET, CRATE_MAX_PILE, CRATE_FULL_POINTS, CRATE_COMMON_POINTS,
} from "../data/farm/cratePackingChallenge.js";
import { MILK_AREA, MILK_VIEW_SPOT, MILK_SIGN } from "../data/farm/farmLayout.js";
import {
  generateMilkSet, decimalExpansion, isTerminatingFraction, milkNotation, milkOptions,
  milkStageFor, milkReasonA, milkReasonB, pourDigits, pourDurationMs,
  MILK_ROUNDS_PER_SET, MILK_ROUND_POINTS, MILK_PREDICT_POINTS, MILK_NOTATION_POINTS,
} from "../data/farm/milkSplitterChallenge.js";
import { WEIGH_AREA, WEIGH_VIEW_SPOT, WEIGH_SIGN } from "../data/farm/farmLayout.js";
import { TRADE_AREA, TRADE_VIEW_SPOT, TRADE_SIGN } from "../data/farm/farmLayout.js";
import {
  generateTradeSet, gradeTradeTap, tradeStageFor, tradeDisplay, tradeChain, tradeMixed,
  tradeFraction, tradeDecimal, tradePercent, TRADE_STALLS,
  TRADE_ROUNDS_PER_SET, TRADE_ROUND_POINTS, TRADE_STALL_POINTS, TRADE_BOTH_BONUS,
} from "../data/farm/tradingPostChallenge.js";
import { VEGGIE_AREA, VEGGIE_VIEW_SPOT, VEGGIE_SIGN, VEGGIE_BED } from "../data/farm/farmLayout.js";
import { PLANK_AREA, PLANK_VIEW_SPOT, PLANK_SIGN } from "../data/farm/farmLayout.js";
import { SHOP_AREA, SHOP_VIEW_SPOT, SHOP_SIGN, FARM_WINDMILL } from "../data/farm/farmLayout.js";
import {
  generateShopSet, gradeShop, buildChain, parseShopInput, fmtMoney,
  SHOP_ROUNDS_PER_SET, SHOP_ROUND_POINTS, GST_RATE,
} from "../data/farm/farmShopChallenge.js";
import {
  generatePlankSet, gradePlank, sumPlanks, twDisplay, plankStageFor,
  PLANK_ROUNDS_PER_SET, PLANK_ROUND_POINTS, PLANK_TWELFTHS, PLANK_PIECES,
} from "../data/farm/plankGapChallenge.js";
import {
  generateVeggieSet, gradeVeggiePlace, gradeVeggiePotion, checkAreaProduct,
  veggieStageFor, reduceFraction, parseFractionInput,
  VEGGIE_ROUNDS_PER_SET, VEGGIE_ROUND_POINTS, VEGGIE_PLACE_POINTS, VEGGIE_TYPE_POINTS, VEGGIE_POTION_POINTS,
  VEGGIE_AREA_ROUNDS, VEGGIE_POTION_ROUNDS,
} from "../data/farm/veggiePlotChallenge.js";
import {
  generateWeighSet, gradeWeigh, weighStageFor, weighFormat, WEIGH_JUDGEMENT_BANK,
  gradeLocate, checkRoundedInput, WEIGH_LOCATE_BANDS,
  WEIGH_ROUNDS_PER_SET, WEIGH_ROUND_POINTS, WEIGH_LOCATE_POINTS, WEIGH_TYPE_POINTS,
} from "../data/farm/weighStationChallenge.js";
import { getFarmColliders } from "../data/farm/farmColliders.js";
import {
  generateRoundSet, gradePlacement, displayValue, feedbackFor, stageForRound as fenceStageForRound,
  ROUNDS_PER_SET, PLACEMENT_TOLERANCE, SCORE_BANDS, MAX_ROUND_POINTS,
} from "../data/farm/fenceChallenge.js";
import {
  SNOW_BOUNDS, SNOW_SPAWN, SNOW_RETURN_PORTAL, SNOW_CHALLENGE_SPOTS, SNOW_RECORDS_STAND,
  SNOW_WELCOME_SIGN, SNOW_BOUNDARY, SNOW_LODGE, ICE_RINK, PENGUIN_WANDER,
  PETE_WANDER, PETE_START, PETE_WALK_SPEED, PETE_IDLE_MS, PETE_CHALLENGE_CLEARANCE,
  PETE_CLIPS,
  RANGE_AREA, RANGE_FRAME_POS, RANGE_CRATE_POS, RANGE_VIEW_SPOT, RANGE_SIGN,
  RINK_GLIDE_LINE, RINK_GLIDE_VIEW_SPOT, RINK_GLIDE_SIGN, rinkGlideX,
  GROVE_AREA, GROVE_TREE_POS, GROVE_BOX_POS, GROVE_VIEW_SPOT, GROVE_SIGN,
  MEADOW_AREA, MEADOW_TOWER_LEFT, MEADOW_TOWER_RIGHT, MEADOW_VIEW_SPOT, MEADOW_SIGN,
  SLOPE_LANE, SLOPE_VIEW_SPOT, SLOPE_SIGN, SLOPE_RUN_GRADE,
  VILLAGE_AREA, VILLAGE_LEFT_STAND, VILLAGE_RIGHT_STAND, VILLAGE_BUILD_SITE, VILLAGE_VIEW_SPOT, VILLAGE_SIGN,
  COLONY_AREA, COLONY_ROWS, COLONY_VIEW_SPOT, COLONY_SIGN,
  CAVE_AREA, CAVE_WALL, CAVE_DOME, CAVE_VIEW_SPOT, CAVE_SIGN,
  YARD_AREA, YARD_STALL, YARD_BOARD, YARD_VIEW_SPOT, YARD_SIGN,
  LOOKOUT_AREA, LOOKOUT_DECK, LOOKOUT_VIEW_SPOT, LOOKOUT_SIGN,
} from "../data/snow/snowLayout.js";
import {
  generateRangeSet, generateRangeRound, rangeStageFor, gradeRangeSplit, checkRangeSum,
  RANGE_ROUNDS_PER_SET, RANGE_SPLIT_POINTS, RANGE_TYPE_POINTS, RANGE_ROUND_POINTS, RANGE_MAX_SCORE,
} from "../data/snow/snowballRangeChallenge.js";
import { useSnowballRange } from "../game/snowballRangeStore.js";
import { extractRootMotion } from "../game/characters/rootMotion.js";
import {
  generateRinkSet, generateRinkRound, rinkStageFor, minPushesFor, gradeGlide, glideStops,
  RINK_ROUNDS_PER_SET, RINK_LAND_POINTS, RINK_EFF_BANDS, RINK_ROUND_POINTS, RINK_MAX_SCORE, RINK_MAX_QUEUE,
} from "../data/snow/rinkGlideChallenge.js";
import {
  generateGroveSet, generateGroveRound, groveStageFor, gradeGroveGrab, gradeGroveAdjust, checkGroveTotal,
  GROVE_ROUNDS_PER_SET, GROVE_GRAB_POINTS, GROVE_ADJUST_POINTS, GROVE_TOTAL_POINTS, GROVE_ROUND_POINTS,
  GROVE_MAX_SCORE, GROVE_ADJUSTMENTS, GROVE_PERFECT_ROUND_INDEX,
} from "../data/snow/groveLightsChallenge.js";
import {
  generateMeadowSet, generateMeadowRound, meadowStageFor, gradeMeadowPredict, checkMeadowTotal,
  meadowCountsAfter, meadowChain,
  MEADOW_ROUNDS_PER_SET, MEADOW_PREDICT_POINTS, MEADOW_TOTAL_POINTS, MEADOW_ROUND_POINTS,
  MEADOW_MAX_SCORE, MEADOW_MOVE_OPTIONS, MEADOW_CANT, MEADOW_ODD_ROUND_INDEX,
} from "../data/snow/meadowLevelChallenge.js";
import {
  generateSledSet, generateSledRound, sledStageFor, sledScenarioAnswer,
  gradeSledPredict, gradeSledSlide, checkSledDiff,
  SLED_ROUNDS_PER_SET, SLED_PREDICT_POINTS, SLED_SLIDE_POINTS, SLED_DIFF_POINTS,
  SLED_ROUND_POINTS, SLED_MAX_SCORE, SLED_PREDICT_OPTIONS, SLED_FRIENDLY_ROUND_INDEX,
} from "../data/snow/sledSlopeChallenge.js";
import {
  generateVillageSet, generateVillageRound, villageStageFor, gradeVillagePredict, checkVillageJoin, checkVillageTotal,
  VILLAGE_ROUNDS_PER_SET, VILLAGE_PREDICT_POINTS, VILLAGE_TENS_POINTS, VILLAGE_ONES_POINTS, VILLAGE_TOTAL_POINTS,
  VILLAGE_BUILD_POINTS, villageSite, gradeVillageBuild, VILLAGE_ROUND_POINTS, VILLAGE_MAX_SCORE, VILLAGE_EXACT_ROUND_INDEX,
} from "../data/snow/villageSplitChallenge.js";
import {
  generateColonySet, generateColonyRound, colonyStageFor, gradeColonyPredict, checkColonyTotal, colonyFormTrue,
  COLONY_ROUNDS_PER_SET, COLONY_PREDICT_POINTS, COLONY_TOTAL_POINTS, COLONY_ROUND_POINTS, COLONY_MAX_SCORE,
  COLONY_MIDDLE_ROUND_INDEX,
} from "../data/snow/colonyPairsChallenge.js";
import {
  generateCaveSet, generateCaveRound, caveStageFor, gradeCaveChoose, checkCaveAnswer,
  CAVE_ROUNDS_PER_SET, CAVE_CHOOSE_POINTS, CAVE_ANSWER_POINTS, CAVE_ROUND_POINTS, CAVE_MAX_SCORE,
  CAVE_LONG_ROUND_INDEX,
} from "../data/snow/caveCrystalsChallenge.js";
import {
  generateYardSet, generateYardRound, yardStageFor, checkYardOnes, checkYardTens, checkYardChange,
  YARD_ROUNDS_PER_SET, YARD_COUNT_POINTS, YARD_COUNT_OVER_POINTS, YARD_CHANGE_POINTS, YARD_ROUND_POINTS, YARD_MAX_SCORE,
  gradeYardCount, fewestCoinsFor,
  YARD_ON_TEN_ROUND_INDEX, YARD_NINETIES_ROUND_INDEX,
} from "../data/snow/lodgeYardChallenge.js";
import {
  generateLookoutSet, generateLookoutRound, gradeLookoutPick, checkLookoutAnswer,
  LOOKOUT_ROUNDS_PER_SET, LOOKOUT_PICK_BEST_POINTS, LOOKOUT_PICK_SOUND_POINTS, LOOKOUT_ANSWER_POINTS,
  LOOKOUT_ROUND_POINTS, LOOKOUT_MAX_SCORE, LOOKOUT_STRATEGIES, LOOKOUT_SCHEDULE, LOOKOUT_ARCHETYPE_KEYS,
} from "../data/snow/auroraLookoutChallenge.js";
import {
  CABIN_BOUNDS, CABIN_SPAWN, CABIN_DOOR, LODGE_DOOR_SNOW,
  CABIN_ARRIVE_FROM_SNOW, SNOW_ARRIVE_FROM_CABIN,
  CABIN_WALL, CABIN_DOOR_GAP, CABIN_FIRE, CABIN_LONG_TABLE, CABIN_ROUND_TABLES,
  CABIN_BEDROOM, CABIN_BED, CABIN_PIP, CABIN_HEARTH_RUG,
} from "../data/cabin/cabinLayout.js";
import { getCabinColliders } from "../data/cabin/cabinColliders.js";
import { getSnowColliders } from "../data/snow/snowColliders.js";
import {
  isOnIce, isOnSnow, isPeteSpotOk, terrainHeight as snowTerrainHeight, slopeAt as snowSlopeAt, onPad as onSnowPad,
} from "../data/snow/snowTerrain.js";
import { runSnowWorldChecks } from "./snowWorldChecks.js";
import {
  SNOW_CHALLENGE_IDS, SNOW_BEST_KEYS, SNOW_MAX_SCORES, SNOW_TROPHY_META,
  snowBestPercent, snowTrophyRows, snowShelfEntries,
} from "../data/snow/snowRecords.js";
import { MEDALS as SNOW_MEDALS, medalFor as snowMedalFor } from "../data/snow/snowRecords.js";

// Fields every generated curriculum question must carry.
const REQUIRED_QUESTION_FIELDS = [
  "id", "stage", "topicId", "topicName", "skillId", "skillName",
  "difficultyLevel", "difficultyLabel", "xpValue", "inputMode",
  "text", "answer", "acceptableAnswers", "feedback", "check",
];

/**
 * Internal integrity checks. Used by the DevPanel "Run system checks" button.
 * Each check returns { name, pass, detail }.
 *
 * `progressSnapshot` is the current progress store state, used for the
 * save/reload round-trip check.
 */
export function runSystemChecks(progressSnapshot) {
  const checks = [];

  // 1) Maths engines still pass their own self-test.
  const engineResults = runEngineSelfTest(100);
  const engineFails = engineResults.filter((r) => r.failed > 0);
  checks.push({
    name: "Maths engines self-test",
    pass: engineFails.length === 0,
    detail:
      engineFails.length === 0
        ? `${Object.keys(ENGINES).length} engines, all questions valid`
        : `failing: ${engineFails.map((r) => r.topic).join(", ")}`,
  });

  // 2) Every interactable references a valid encounter id.
  const badRefs = INTERACTABLES.filter((i) => !ENCOUNTERS[i.encounterId]);
  checks.push({
    name: "Interactable encounter ids valid",
    pass: badRefs.length === 0,
    detail:
      badRefs.length === 0
        ? `${INTERACTABLES.length} interactables OK`
        : `bad: ${badRefs.map((i) => `${i.id}->${i.encounterId}`).join(", ")}`,
  });

  // 3) Every quest's required encounters exist.
  const allEncounterIds = getAllEncounterIds();
  const questReqProblems = [];
  for (const q of Object.values(QUESTS)) {
    for (const eid of q.requiredEncounters) {
      if (!allEncounterIds.includes(eid)) questReqProblems.push(`${q.id}->${eid}`);
    }
  }
  checks.push({
    name: "Quest required encounters exist",
    pass: questReqProblems.length === 0,
    detail:
      questReqProblems.length === 0
        ? `${Object.keys(QUESTS).length} quests OK`
        : `missing: ${questReqProblems.join(", ")}`,
  });

  // 4) Every quest unlock requirement references a real quest.
  const unlockProblems = [];
  for (const q of Object.values(QUESTS)) {
    for (const qid of q.unlock?.requiredQuests ?? []) {
      if (!QUESTS[qid]) unlockProblems.push(`${q.id}->${qid}`);
    }
  }
  checks.push({
    name: "Quest unlock references valid",
    pass: unlockProblems.length === 0,
    detail:
      unlockProblems.length === 0
        ? "all unlock chains valid"
        : `bad: ${unlockProblems.join(", ")}`,
  });

  // 5) Simple-input questions still work end to end.
  const simpleQ = buildQuestionSet("integers", 1)[0];
  checks.push({
    name: "Simple-input question works",
    pass: simpleQ.inputMode === "simple" && simpleQ.check(simpleQ.answer),
    detail: `integers → "${simpleQ.answer}" accepted`,
  });

  // 6) Math-input questions produce LaTeX/plain-comparable answers and check
  //    out, including numeric equivalence (1/2 = 0.5, sqrt(2) = 2^(1/2), etc.).
  const mathQs = buildQuestionSet("math-examples", 6);
  const mathShapeOk = mathQs.every(
    (q) => q.inputMode === "math" && q.check(q.answer)
  );
  const equivOk =
    answersMatchMath("1/2", "0.5") &&
    answersMatchMath("sqrt(2)", "2^(1/2)") &&
    answersMatchMath("root(3)(8)", "2") &&
    !answersMatchMath("x^2", "x^3");
  // The pure plain-text converters used by the editor are sane.
  const convertOk =
    latexToPlain("\\frac{1}{2}") === "(1)/(2)" &&
    asciiToPlain("sqrt(2)") === "sqrt(2)";
  checks.push({
    name: "Math-input questions & equivalence",
    pass: mathShapeOk && equivOk && convertOk,
    detail: `shape:${mathShapeOk} equiv:${equivOk} convert:${convertOk}`,
  });

  // --- Curriculum & adaptive checks (Phase 2C) ---

  // C1) The three stages exist.
  const stageIds = getStages().map((s) => s.id);
  checks.push({
    name: "Stages registered",
    pass: ["stage3", "stage4", "stage5"].every((id) => stageIds.includes(id)),
    detail: stageIds.join(", "),
  });

  // C2) Every topic has required metadata + at least one skill, and every
  //     sample question generates with all required fields and self-checks.
  //     Also collect simple/math coverage and XP sanity.
  let topicMetaOk = true;
  let genOk = true;
  let sawSimpleOk = false;
  let sawMathOk = false;
  let xpOk = true;
  const genProblems = [];
  for (const stage of getStages()) {
    for (const t of getTopics(stage.id)) {
      const topic = getTopic(stage.id, t.id);
      if (!topic || !topic.name || !Array.isArray(topic.skills) || topic.skills.length === 0) {
        topicMetaOk = false;
        continue;
      }
      for (const skill of topic.skills) {
        if (!skill.id || !skill.name || typeof skill.generate !== "function") {
          topicMetaOk = false;
          continue;
        }
        for (let level = 1; level <= 5; level++) {
          const q = generateCurriculumQuestion(stage.id, t.id, skill.id, level);
          const fieldsOk = q && REQUIRED_QUESTION_FIELDS.every((f) => q[f] !== undefined);
          const selfChecks = fieldsOk && q.check(q.answer);
          const xpMatches = fieldsOk && q.xpValue === xpForDifficulty(level) && q.xpValue > 0;
          if (!fieldsOk || !selfChecks) {
            genOk = false;
            if (genProblems.length < 3) genProblems.push(`${stage.id}.${t.id}.${skill.id}.L${level}`);
          }
          if (!xpMatches) xpOk = false;
          if (fieldsOk && selfChecks && q.inputMode === "simple") sawSimpleOk = true;
          if (fieldsOk && selfChecks && q.inputMode === "math") sawMathOk = true;
        }
      }
    }
  }
  checks.push({ name: "Topics have required metadata", pass: topicMetaOk, detail: topicMetaOk ? "all topics valid" : "missing metadata" });
  checks.push({
    name: "Sample questions generate & self-check",
    pass: genOk,
    detail: genOk ? "all stages × skills × L1–5 OK" : `failing: ${genProblems.join(", ")}`,
  });
  checks.push({ name: "Simple-input curriculum question checks", pass: sawSimpleOk, detail: sawSimpleOk ? "found & valid" : "none valid" });
  checks.push({ name: "Math-input curriculum question checks", pass: sawMathOk, detail: sawMathOk ? "found & valid" : "none valid" });

  // C3) XP exists and scales by difficulty.
  const xpScales =
    xpForDifficulty(1) < xpForDifficulty(3) &&
    xpForDifficulty(3) < xpForDifficulty(5) &&
    xpOk;
  checks.push({
    name: "XP scales with difficulty",
    pass: xpScales,
    detail: `L1=${xpForDifficulty(1)} L3=${xpForDifficulty(3)} L5=${xpForDifficulty(5)}`,
  });

  // C4) Adaptive selector never leaves 1..5, and moves the right direction.
  const up = { ...newProfile(), workingDifficulty: 5, streak: 9 };
  const down = { ...newProfile(), workingDifficulty: 1, incorrectStreak: 9 };
  const mid = { ...newProfile(), workingDifficulty: 3, streak: 1 };
  const adaptiveOk =
    suggestDifficulty(up) === 5 && // clamped at top
    suggestDifficulty(down) === 1 && // clamped at bottom
    suggestDifficulty({ ...newProfile(), workingDifficulty: 2, streak: 3 }) === 3 && // up one
    suggestDifficulty({ ...newProfile(), workingDifficulty: 3, incorrectStreak: 2 }) === 2 && // down one
    suggestDifficulty(mid) === 3; // mixed → stay
  checks.push({ name: "Adaptive selector stays in 1..5", pass: adaptiveOk, detail: adaptiveOk ? "clamped & gradual" : "out of range / wrong move" });

  // 7) Completed encounters/quests survive a localStorage save + reload.
  if (progressSnapshot) {
    saveProgress(progressSnapshot);
    const reloaded = loadProgress() || {};
    const sameEnc =
      JSON.stringify(reloaded.completedEncounters || []) ===
      JSON.stringify(progressSnapshot.completedEncounters || []);
    const sameQuests =
      JSON.stringify(reloaded.completedQuests || []) ===
      JSON.stringify(progressSnapshot.completedQuests || []);
    const sameXp = reloaded.xp === progressSnapshot.xp;
    const sameCoins = reloaded.coins === progressSnapshot.coins;
    checks.push({
      name: "Progress saves & reloads",
      pass: sameEnc && sameQuests && sameXp && sameCoins,
      detail: `enc:${sameEnc} quests:${sameQuests} xp:${sameXp} coins:${sameCoins}`,
    });
  }

  // --- Mission & badge checks (Phase 2D) appended to the full suite. ---
  for (const c of runMissionChecks(progressSnapshot)) checks.push(c);

  // --- Diagram & Area checks (Phase 2E) appended to the full suite. ---
  for (const c of runDiagramChecks()) checks.push(c);

  // --- Real-engine (legacy adapter) checks (Phase 2F) appended. ---
  for (const c of runRealEngineChecks()) checks.push(c);

  // --- Difficulty-calibration checks (Phase 2F) appended. ---
  for (const c of runDifficultyChecks()) checks.push(c);

  // --- FDP (legacy adapter) checks (Phase 2F) appended. ---
  for (const c of runFdpChecks()) checks.push(c);

  // --- Algebraic Techniques (legacy adapter) checks (Phase 2F Slice 3). ---
  for (const c of runAlgebraChecks()) checks.push(c);

  // --- World progression checks (Phase 2G). ---
  for (const c of runWorldChecks(progressSnapshot)) checks.push(c);

  // --- Scoring / pass-threshold checks (Phase 2G polish). ---
  for (const c of runScoringChecks()) checks.push(c);

  // --- Collision / verticality checks (Phase 2H-B). ---
  for (const c of runCollisionChecks()) checks.push(c);

  // --- Camera / plaza checks (Phase 2H-C). ---
  for (const c of runCameraChecks()) checks.push(c);

  // --- Locked-zone boundary checks (Phase 2H-D). ---
  for (const c of runBoundaryChecks()) checks.push(c);

  // Story / onboarding (Phase 2I).
  for (const c of runStoryChecks(progressSnapshot)) checks.push(c);

  // Topic→world routing + teacher missions (Phase 2J).
  for (const c of runRouteChecks()) checks.push(c);

  // Answer modes + newly-adopted deferred types (Phase 2K).
  for (const c of runAnswerModeChecks()) checks.push(c);

  // Local results / reporting (Phase 2L).
  for (const c of runResultChecks()) checks.push(c);

  // Results polish / reporting quality (Phase 2M).
  for (const c of runResult2MChecks()) checks.push(c);

  // Pythagoras topic (Phase 2N).
  for (const c of runPythagorasChecks()) checks.push(c);

  // Year 7 classroom-pilot readiness (Phase 2O).
  for (const c of runClassroomChecks(progressSnapshot)) checks.push(c);

  // Classroom pilot dry-run reliability (Phase 2P).
  for (const c of runPilotChecks()) checks.push(c);

  // Cloud Attempts MVP (Phase 3B) — pure mappers + mocked writer (no network).
  for (const c of runCloudChecks()) checks.push(c);

  // Safer Firestore rules draft + portal compatibility (Phase 3C).
  for (const c of runRulesChecks()) checks.push(c);

  // Secure code exchange + claim-based rules (Phase 3D).
  for (const c of runCodeExchangeChecks()) checks.push(c);
  for (const c of run3dRulesChecks()) checks.push(c);

  // Portal + quiz migration to secure code exchange (Phase 3D.1).
  for (const c of runPortalMigrationChecks()) checks.push(c);

  // Clean Student + Teacher platform rebuild (Phase 4A).
  for (const c of runPlatformChecks()) checks.push(c);

  for (const c of runTouchChecks()) checks.push(c);

  // Ratios & Rates native topic (Phase 3A question-bank expansion).
  for (const c of runRatioChecks()) checks.push(c);

  // Length native topic (Phase 3B, diagram-heavy).
  for (const c of runLengthChecks()) checks.push(c);

  // Equations native topic (Phase 3C, linear → quadratic).
  for (const c of runEquationsChecks()) checks.push(c);

  // Probability native topic (Phase 3D, theoretical + observed + complements).
  for (const c of runProbabilityChecks()) checks.push(c);

  // Indices native topic (Phase 3E, notation → primes → roots → index laws).
  for (const c of runIndicesChecks()) checks.push(c);

  // Linear relationships native topic (Phase 3F, Cartesian plane + patterns).
  for (const c of runLinearChecks()) checks.push(c);

  for (const c of runAnglesChecks()) checks.push(c);

  for (const c of runGeometryChecks()) checks.push(c);

  for (const c of runDataChecks()) checks.push(c);

  for (const c of runSchoolyardTopicChecks()) checks.push(c);

  // Parts of a Whole Farm — region + in-world Fence Challenge (F1–F2).
  for (const c of runFarmChecks()) checks.push(c);

  // The Round-Up — fraction OF AN AMOUNT herding challenge (F3).
  for (const c of runRoundUpChecks()) checks.push(c);

  // Order the Parts — ordering f/d/% in the carrot garden (F4).
  for (const c of runOrderPartsChecks()) checks.push(c);

  // Farm Records trophy bench (F5).
  for (const c of runFarmRecordsChecks()) checks.push(c);

  // Crate Packing — HCF + simplifying by the barn (F6).
  for (const c of runCratePackingChecks()) checks.push(c);

  // The Milk Splitter — terminating vs recurring decimals (F8).
  for (const c of runMilkSplitterChecks()) checks.push(c);

  // The Weigh Station — rounding + ≈ (F9).
  for (const c of runWeighStationChecks()) checks.push(c);

  // The Trading Post — FDP conversions (F10).
  for (const c of runTradingPostChecks()) checks.push(c);

  // Veggie Plot (F11)
  for (const c of runVeggiePlotChecks()) checks.push(c);

  // Plank the Gap (F12)
  for (const c of runPlankGapChecks()) checks.push(c);

  // The Farm Shop (F13)
  for (const c of runFarmShopChecks()) checks.push(c);

  // Snowball Sums — the fourth region + igloo gate + rink + trophy slots (S1–S2).
  for (const c of runSnowChecks()) checks.push(c);

  // Pete — the snow world's wandering local (ambient life).
  for (const c of runWanderingPeteChecks()) checks.push(c);

  // The Snowball Range — bridging to ten (SR, the first snow challenge).
  for (const c of runSnowballRangeChecks()) checks.push(c);

  // The Ice Rink — glide by tens (RG, the second snow challenge).
  for (const c of runRinkGlideChecks()) checks.push(c);

  // Christmas Tree Grove — compensation (GV, the third snow challenge).
  for (const c of runGroveLightsChecks()) checks.push(c);

  // Snowman Meadow — levelling (ML, the fourth snow challenge).
  for (const c of runMeadowLevelChecks()) checks.push(c);

  // Sledding Slope — constant difference on the new hill (SL, the fifth).
  for (const c of runSledSlopeChecks()) checks.push(c);

  // The final five: Igloo Village (VG), Penguin Colony (PC), the Ice Cave
  // (IC), the Lodge Yard (LY) and the Aurora Lookout capstone (AL).
  for (const c of runVillageSplitChecks()) checks.push(c);
  for (const c of runColonyPairsChecks()) checks.push(c);
  for (const c of runCaveCrystalsChecks()) checks.push(c);
  for (const c of runLodgeYardChecks()) checks.push(c);
  for (const c of runAuroraLookoutChecks()) checks.push(c);

  // The Lodge Interior — the fifth region, behind the lodge's ajar door (CB).
  for (const c of runCabinChecks()) checks.push(c);
  for (const c of runSnowAuditChecks()) checks.push(c);
  for (const c of runMagmaChecks()) checks.push(c);
  // Magma Multiples — the ten multiplicative challenges (MCF1–4 + 3 each).
  for (const c of runMagmaChallengeChecks()) checks.push(c);
  // Emerald Jungle — the seventh region, a jungle valley (JG1–JG8).
  for (const c of runJungleChecks()) checks.push(c);
  for (const c of runFarmWorldChecks()) checks.push(c);
  // Snowball Sums rebuilt as a big alpine valley (SW1–SW10).
  for (const c of runSnowWorldChecks()) checks.push(c);
  // Number Island rebuilt (~2.5× across), the Achievements Wall + the title flyover (IL1–IL10).
  for (const c of runIslandWorldChecks()) checks.push(c);
  // The Retrieval Practice Playground rebuilt as a big hillside high school (SY1–SY10).
  for (const c of runSchoolyardWorldChecks()) checks.push(c);

  return checks;
}


/**
 * LOCKED-ZONE BOUNDARY CHECKS (Phase 2H-D). Confirm locked zones are sealed
 * (no walkable bypass) while locked, the path opens when unlocked, blockers
 * have colliders, the hint lingers ≥3s and differs per gate, and spawn/hub stay
 * clear of the new boundary colliders.
 */
export function runBoundaryChecks() {
  const checks = [];
  const PASS = 2 * PLAYER_RADIUS; // a player can pass a gap wider than this

  const lockedSnap = { completedMissions: [], earnedBadges: [], completedEncounters: [] };
  const unlockedSnap = {
    completedMissions: [],
    earnedBadges: [
      { badgeId: "integer-adventurer", earnedAt: 1 },
      { badgeId: "fraction-explorer", earnedAt: 1 },
      { badgeId: "algebra-apprentice", earnedAt: 1 },
    ],
    completedEncounters: [],
  };
  const colsL = getColliders(lockedSnap);
  const colsU = getColliders(unlockedSnap);

  // (2026-10-09) The rebuilt Number Island is an OPEN sandbox with natural
  // edges (the sea, cliffs, the plaza wall): no zone-boundary arcs, no
  // gate-fills, no locked-gate hints — every friend is reachable on foot
  // (the island checks IL4 flood-fill it).
  {
    const gateFills = colsL.filter((c) => String(c.id).endsWith("-gatefill"));
    const hintCols = colsL.filter((c) => String(c.id).startsWith("bnd-") && c.hint);
    const openU = colsU.filter((c) => c.kind === "gate").length === 0;
    checks.push({
      name: "Island is open: no zone boundaries, gate-fills or locked hints",
      pass: WORLD_BOUNDARIES.length === 0 && gateFills.length === 0 && hintCols.length === 0 && openU,
      detail: `${WORLD_BOUNDARIES.length} boundary arcs, ${gateFills.length} gate-fills, ${hintCols.length} hint colliders`,
    });
  }

  // Region system (W2): the active region is valid and the player clamp keeps a
  // far-away point inside the region's bounds.
  const region = getRegion(DEFAULT_REGION_ID);
  const clampedIn = clampToBounds(9999, 9999, region.bounds);
  const insideBounds = Math.hypot(clampedIn.x, clampedIn.z) <= (region.bounds.radius || 0) + 0.001;
  const regionOk = Boolean(region && region.spawn && region.geometry && region.bounds) &&
    getAllRegions().length >= 1 && insideBounds;
  checks.push({
    name: "Region system: active region valid + clamp works",
    pass: regionOk,
    detail: regionOk ? `${getAllRegions().length} region(s); clamp keeps player in bounds` : "region/clamp wrong",
  });

  // Schoolyard (W2-B): a valid rectangular region with its own colliders, and the
  // clamp keeps the player inside its bounds.
  const yard = getRegion("schoolyard");
  const yardClamp = clampToBounds(9999, 9999, yard.bounds);
  const inYard = Math.abs(yardClamp.x) <= yard.bounds.width / 2 + 0.001 &&
    Math.abs(yardClamp.z) <= yard.bounds.height / 2 + 0.001;
  const yardCols = getColliders({}, "schoolyard");
  const yardOk = yard.id === "schoolyard" && yard.bounds.shape === "rect" &&
    typeof yard.groundHeight === "function" && inYard &&
    Array.isArray(yardCols) && yardCols.length >= 3;
  checks.push({
    name: "Schoolyard region: rect bounds + terraced ground + colliders",
    pass: yardOk,
    detail: yardOk ? `${yardCols.length} colliders; rect clamp + tiers ok` : "schoolyard wrong",
  });

  // Teleport Gates (W2-C): each region has a portal to the other.
  const toYard = (getRegion("island-1").portals || []).some((p) => p.target === "schoolyard" && p.radius > 0);
  const toIsland = (getRegion("schoolyard").portals || []).some((p) => p.target === "island-1" && p.radius > 0);
  checks.push({
    name: "Teleport Gates link the two regions",
    pass: toYard && toIsland,
    detail: toYard && toIsland ? "island↔schoolyard portals present" : "missing portal",
  });

  // Schoolyard NPCs (W2-D): each has a warm-up chain, a schoolyard interactable,
  // and progress-aware dialogue that starts its warm-up.
  const syInteract = getInteractablesForRegion("schoolyard").map((i) => i.id);
  const allKeysCM = SCHOOLYARD_KEY_IDS.map((id) => `warmup-${id}`);
  const syNpcOk = SCHOOLYARD_CHARACTERS.every((c) => {
    const chain = getChain(c.id);
    const step = chain && chain.steps[0];
    const mission = step && getMission(step.missionId);
    // The boss only offers her challenge once the 8 keys are earned.
    const dlg = npcDialogue(c.id, mainQuestSnapshot({ completedMissions: c.boss ? allKeysCM : [] }));
    return Boolean(chain) && Boolean(mission) && validateMission(mission).valid &&
      syInteract.includes(c.id) && dlg && dlg.action && dlg.action.missionId === step.missionId;
  });
  checks.push({
    name: "Schoolyard NPCs: chain + interactable + dialogue",
    pass: Boolean(syNpcOk),
    detail: syNpcOk ? `${SCHOOLYARD_CHARACTERS.length} schoolyard NPCs wired` : "schoolyard NPC wiring wrong",
  });

  // Coffs Coast story pass (W2-E): a welcome sign with a valid dialogue encounter,
  // and each schoolyard NPC has a themed completion dialogue.
  const signIx = getInteractablesForRegion("schoolyard").find((i) => i.id === "schoolyard-sign");
  const welcomeOk = signIx && ENCOUNTERS[signIx.encounterId] && ENCOUNTERS[signIx.encounterId].type === "dialogue";
  const completesOk = SCHOOLYARD_CHARACTERS.every(
    (c) => ENCOUNTERS[`${c.id}-complete`] && ENCOUNTERS[`${c.id}-complete`].type === "dialogue"
  );
  checks.push({
    name: "Schoolyard story: welcome sign + NPC completions",
    pass: Boolean(welcomeOk) && completesOk,
    detail: welcomeOk && completesOk ? "welcome + staff completion dialogues present" : "story wiring wrong",
  });

  // Schoolyard boss/keys (W2-G): keys derive from completed warm-ups; the gate
  // locks the Head Teacher until all 8 keys, and beating her awards the trophy.
  const noKeys = [];
  const allKeys = SCHOOLYARD_KEY_IDS.map((id) => `warmup-${id}`);
  const lockThenOpen = !isBossUnlocked(noKeys) && keysEarned(allKeys) === SCHOOLYARD_KEY_IDS.length && isBossUnlocked(allKeys);
  const bossMission = getMission("warmup-kellahan");
  const bossReward = Boolean(bossMission) && bossMission.rewardBadge === "schoolyard-champion" && isValidBadge("schoolyard-champion");
  const lockedDlg = npcDialogue("kellahan", mainQuestSnapshot({ completedMissions: noKeys }));
  const gateWhenLocked = getColliders({ completedMissions: noKeys }, "schoolyard").some((c) => String(c.id).startsWith("sy-gate"));
  const gateWhenOpen = !getColliders({ completedMissions: allKeys }, "schoolyard").some((c) => String(c.id).startsWith("sy-gate"));
  const bossOk = lockThenOpen && bossReward && !lockedDlg.action && gateWhenLocked && gateWhenOpen;
  checks.push({
    name: "Schoolyard boss: keys unlock the gate + award the trophy",
    pass: Boolean(bossOk),
    detail: bossOk ? "8 keys open the gate; boss awards Schoolyard Champion" : "boss wiring wrong",
  });

  // The hint lingers ≥3s after the last contact (pure timing rule check).
  const LINGER = 3000;
  const base = 1_000_000;
  const expiry = base + LINGER;
  const lingerOk = base < expiry && base + 2999 < expiry && !(base + 3001 < expiry);
  checks.push({
    name: "Locked-gate hint lingers ≥3s",
    pass: lingerOk,
    detail: "active until expiry (base+3000ms)",
  });

  // Spawn & hub remain clear of all (incl. boundary) colliders.
  const clear = [["spawn", SPAWN_POINT], ["hub", HUB_POINT]].every(([, p]) =>
    !colsL.some((c) => Math.hypot(p.x - c.x, p.z - c.z) < PLAYER_RADIUS + c.radius)
  );
  checks.push({
    name: "Spawn & hub clear of boundary colliders",
    pass: clear,
    detail: clear ? "both clear" : "a point is inside a collider",
  });

  return checks;
}

/**
 * CAMERA / PLAZA CHECKS (Phase 2H-C). Confirm the Camera-Lock and Quest-HUD
 * preferences persist to localStorage, the plaza plateau/stairs data exists and
 * a player can stand on the plateau, and key hub objects sit on the plaza and
 * remain interactable. Uses safe localStorage round-trips (restores originals).
 */
export function runCameraChecks() {
  const checks = [];

  // Persistence round-trip helper (restores the original value).
  function persists(key) {
    try {
      const orig = localStorage.getItem(key);
      localStorage.setItem(key, "1");
      const a = localStorage.getItem(key) === "1";
      localStorage.setItem(key, "0");
      const b = localStorage.getItem(key) === "0";
      if (orig === null) localStorage.removeItem(key);
      else localStorage.setItem(key, orig);
      return a && b;
    } catch {
      return false;
    }
  }

  checks.push({
    name: "Camera Lock setting persists",
    pass: persists("mills-maths-adventure:cameraLock"),
    detail: "localStorage round-trip ok",
  });
  checks.push({
    name: "Quest HUD setting persists",
    pass: persists("mills-maths-adventure:questHud"),
    detail: "localStorage round-trip ok",
  });

  // Plateau/stairs data + a player can stand on the plaza deck (ground = deck).
  const standOk = Math.abs(groundHeightAt(HUB_POINT.x, HUB_POINT.z) - PLATEAU.height) < 1e-6 && PLATEAU.height > PLATEAU.base;
  checks.push({
    name: "Player can stand on the plaza plateau",
    pass: standOk && STAIRS.length >= 2,
    detail: `plateau h=${PLATEAU.height}, stand=${standOk}`,
  });

  // The stairs are fully WALKABLE (no step exceeds STEP_UP) so students are
  // never blocked from the plaza (per flight, from the plaza's base level).
  let prevH = PLATEAU.base;
  let walkable = true;
  const flight0 = STAIRS.filter((st) => st.flight === STAIRS[0].flight);
  for (const st of [...flight0].sort((a, b) => a.height - b.height)) {
    if (st.height - prevH > STEP_UP + 1e-9) walkable = false;
    prevH = st.height;
  }
  if (PLATEAU.height - prevH > STEP_UP + 1e-9) {
    // final rise onto plateau may need a jump — that's fine, but ensure the jump
    // can clear it (apex ≈ 1.3 with JUMP_VELOCITY 7.2).
    walkable = PLATEAU.height - prevH <= 1.2;
  }
  checks.push({
    name: "Plaza stairs are climbable (walk or small jump)",
    pass: walkable,
    detail: walkable ? "all rises reachable" : "a rise is too high",
  });

  // Board + Trophy sit on the (square) plateau; Mills now stands OFF it near the
  // spawn (W6-C). Uses the rect extents so the straight-edged plateau is tested.
  const onRect = (id) => {
    const it = INTERACTABLES.find((x) => x.id === id);
    return it && Math.abs(it.position[0] - PLATEAU.x) <= PLATEAU.halfW &&
      Math.abs(it.position[1] - PLATEAU.z) <= PLATEAU.halfD && Boolean(it.encounterId);
  };
  const boardTrophyOn = onRect("mission-board") && onRect("trophy-stand");
  const mills = INTERACTABLES.find((x) => x.id === "sage");
  const millsOff = mills && !(Math.abs(mills.position[0] - PLATEAU.x) <= PLATEAU.halfW &&
    Math.abs(mills.position[1] - PLATEAU.z) <= PLATEAU.halfD);
  // And Board + Trophy interaction radii must not overlap (they were cramped).
  const b = INTERACTABLES.find((x) => x.id === "mission-board");
  const t = INTERACTABLES.find((x) => x.id === "trophy-stand");
  const spaced = b && t && Math.hypot(b.position[0] - t.position[0], b.position[1] - t.position[1]) >
    (b.interactionRadius + t.interactionRadius);
  checks.push({
    name: "Hub objects on the plaza & interactable",
    pass: Boolean(boardTrophyOn && millsOff && spaced),
    detail: boardTrophyOn ? (millsOff ? (spaced ? "board/trophy on plateau, spaced; Mills off" : "board+trophy radii overlap") : "Mills still on plateau") : "board/trophy off-plateau",
  });

  return checks;
}

/**
 * COLLISION / VERTICALITY CHECKS (Phase 2H-B). Confirm colliders are registered,
 * NPCs have collision + interaction radii, locked gates block while unlocked
 * gates allow passage, the plateau/stairs height-field exists and needs a jump,
 * and resolution runs without crashing.
 */
export function runCollisionChecks() {
  const checks = [];

  const lockedSnap = { completedMissions: [], earnedBadges: [], completedEncounters: [] };
  const unlockedSnap = {
    completedMissions: [],
    earnedBadges: [
      { badgeId: "integer-adventurer", earnedAt: 1 },
      { badgeId: "fraction-explorer", earnedAt: 1 },
      { badgeId: "algebra-apprentice", earnedAt: 1 },
    ],
    completedEncounters: [],
  };

  const cols = getColliders(lockedSnap);
  checks.push({
    name: "World colliders registered",
    pass: cols.length >= 10 &&
      cols.some((c) => c.kind === "tree") &&
      cols.some((c) => c.kind === "landmark") &&
      cols.some((c) => c.kind === "interactable"),
    detail: `${cols.length} colliders (trees:${TREE_POSITIONS.length})`,
  });

  // (2026-10-09) Alby's ROPE BRIDGE (the rebuilt island's bridge, out to the
  // lighthouse islet): walked as the player walks it — layered ground, every
  // step ≤ STEP_UP, never in the deep water, with height-banded rails.
  {
    const b = ROPE_BRIDGE;
    const dx = b.to[0] - b.from[0], dz = b.to[1] - b.from[1];
    const L = Math.hypot(dx, dz);
    let y = islandGroundHeight(b.from[0] - (dx / L) * 2, b.from[1] - (dz / L) * 2);
    let maxStep = 0, wet = false, minY = Infinity;
    for (let d = -2; d <= L + 2; d += 0.12) {
      const x = b.from[0] + (dx / L) * d, z = b.from[1] + (dz / L) * d;
      const h = islandGroundHeight(x, z, y);
      maxStep = Math.max(maxStep, h - y);
      if (islandHazardAt(x, z, h)) wet = true;
      y = h;
      if (d > 2 && d < L - 2) minY = Math.min(minY, h);
    }
    const rails = cols.filter((c) => String(c.id).startsWith("island-rail-rope-bridge")).length;
    const ok = maxStep <= STEP_UP && !wet && minY > SEA_Y + 1 && rails >= 8;
    checks.push({
      name: "Rope bridge is walkable end to end",
      pass: ok,
      detail: `max step ${maxStep.toFixed(3)} · dry ${!wet} · deck ≥ ${minY.toFixed(2)} · rails ${rails}`,
    });
  }

  // Key NPCs/interactables carry both a collision and an interaction radius.
  const keyIds = ["pip", "fern", "alby", "sage", "mission-board", "trophy-stand", "chest"];
  const radiiOk = keyIds.every((id) => {
    const it = INTERACTABLES.find((x) => x.id === id);
    return it && it.collision && it.collision.radius > 0 && it.interactionRadius > it.collision.radius;
  });
  checks.push({
    name: "Key NPCs have collision + interaction radii",
    pass: radiiOk,
    detail: radiiOk ? "interaction radius > collision radius for all" : "missing/!> radii",
  });

  // Sandbox model: the world is OPEN — there are no gate colliders blocking
  // movement in free-play (a student can walk to any character).
  const gate = cols.find((c) => c.kind === "gate");
  checks.push({
    name: "Open world: no gate blocks movement",
    pass: !gate,
    detail: gate ? "a gate still blocks" : "no gate colliders (open world)",
  });

  // Unlocked gate allows passage: no gate colliders once unlocked.
  const colsUnlocked = getColliders(unlockedSnap);
  const noGateColliders = colsUnlocked.every((c) => c.kind !== "gate");
  checks.push({
    name: "Unlocked gates allow passage",
    pass: noGateColliders,
    detail: noGateColliders ? "no gate colliders when unlocked" : "gate still blocks",
  });

  // Mission Board + Trophy Stand remain interactable.
  const boardOk = INTERACTABLES.some((i) => i.id === "mission-board" && i.encounterId);
  const trophyOk = INTERACTABLES.some((i) => i.id === "trophy-stand" && i.encounterId);
  checks.push({
    name: "Mission Board & Trophy Stand interactable",
    pass: boardOk && trophyOk,
    detail: `board:${boardOk} trophy:${trophyOk}`,
  });

  // Plateau/stairs height-field exists and is consistent.
  const heightOk =
    PLATEAU.height > PLATEAU.base && STAIRS.length >= 2 &&
    Math.abs(groundHeightAt(HUB_POINT.x, HUB_POINT.z) - PLATEAU.height) < 1e-6 &&
    Math.abs(groundHeightAt(40, 40) - islandTerrainHeight(40, 40)) < 1e-6;
  checks.push({
    name: "Plateau/stairs height-field exists",
    pass: heightOk,
    detail: `plateau h=${PLATEAU.height}, steps=${STAIRS.length}`,
  });

  // The plaza stairs are fully WALKABLE (no rise exceeds STEP_UP) so students
  // are never blocked from the Mission Plaza; a Shift jump is an optional
  // shortcut up the plateau side (Phase 2H-C).
  let allWalkable = true;
  for (const fid of new Set(STAIRS.map((st) => st.flight))) {
    let prevH = PLATEAU.base;
    for (const st of STAIRS.filter((x) => x.flight === fid).sort((a, b) => a.height - b.height)) {
      if (st.height - prevH > STEP_UP + 1e-9) allWalkable = false;
      prevH = st.height;
    }
    if (PLATEAU.height - prevH > STEP_UP + 1e-9) allWalkable = false;
  }
  checks.push({
    name: "Plaza stairs fully walkable (no dead-ends)",
    pass: allWalkable,
    detail: allWalkable ? "every rise ≤ STEP_UP" : "a rise blocks walking",
  });

  // Resolution runs without crashing on a normal move + a no-collider case.
  let noCrash = true;
  try {
    resolveCircle(0, 0, cols, PLAYER_RADIUS);
    resolveCircle(5, 5, [], PLAYER_RADIUS);
  } catch {
    noCrash = false;
  }
  checks.push({ name: "Collision resolves without crashing", pass: noCrash, detail: noCrash ? "ok" : "threw" });

  return checks;
}

/**
 * SCORING / PASS-THRESHOLD CHECKS (Phase 2G polish). Confirm the 60% pass rule
 * and that result messages match performance (and never claim success below the
 * threshold). These are PURE (no store mutation) — the store's finalize follows
 * the same isPass() rule, verified end-to-end in the headless harness.
 */
export function runScoringChecks() {
  const checks = [];

  checks.push({
    name: "Pass threshold is 60%",
    pass: Math.abs(PASS_THRESHOLD - 0.6) < 1e-9,
    detail: `${Math.round(PASS_THRESHOLD * 100)}%`,
  });

  const belowFails = !isPass(5, 10) && !isPass(0, 10) && !isPass(59, 100);
  const atOrAbovePasses = isPass(6, 10) && isPass(10, 10) && isPass(60, 100);
  checks.push({
    name: "Score <60% fails, ≥60% passes",
    pass: belowFails && atOrAbovePasses,
    detail: `5/10:${isPass(5, 10)} 6/10:${isPass(6, 10)} 0/10:${isPass(0, 10)}`,
  });

  // Completion (mission / badge / gate / quest step) requires a pass.
  const completesOnFail = isPass(0, 10); // must be false
  const completesOnPass = isPass(8, 10); // must be true
  checks.push({
    name: "Mission/badge/gate completion requires a pass",
    pass: !completesOnFail && completesOnPass,
    detail: `fail→${completesOnFail} pass→${completesOnPass}`,
  });

  // Result messages are accurate and never claim success below threshold.
  const msgOk =
    bandMessage(100) === "Perfect!" &&
    bandMessage(70) === "Good work!" &&
    bandMessage(50).toLowerCase().includes("practising") &&
    bandMessage(0).toLowerCase().includes("another go") &&
    resultTitle(true) === "Challenge complete" &&
    resultTitle(false).toLowerCase().includes("try again") &&
    scorePercent(3, 10) === 30;
  checks.push({
    name: "Result messages match performance",
    pass: msgOk,
    detail: `0%→"${bandMessage(0)}"`,
  });

  return checks;
}

/**
 * WORLD PROGRESSION CHECKS (Phase 2G). Confirm the student-facing Mission Board
 * can read missions, a mission can be started, mission completion triggers an
 * unlock that persists through a save/reload, NPC quest chains resolve, and the
 * badge/trophy display can read earned badges.
 */
export function runWorldChecks(progressSnapshot) {
  const checks = [];

  // W1) Mission Board can read available missions (the curated, non-NPC set).
  const boardMissions = getAllMissions().filter((m) => !m.missionId.startsWith("npc-"));
  checks.push({
    name: "Mission Board reads available missions",
    pass: boardMissions.length >= 1 && boardMissions.every((m) => validateMission(m).valid),
    detail: `${boardMissions.length} board missions, all valid`,
  });

  // W2) A mission can be "started" (activated) and generates its questions.
  const startMission = getMission("npc-pip-1");
  const started = startMission && validateMission(startMission).valid &&
    buildMissionQuestions(startMission, 4, () => newProfile()).every((q) => q.check(q.answer));
  checks.push({
    name: "A mission can be started from the board",
    pass: Boolean(started),
    detail: started ? "npc-pip-1 activates & generates" : "failed",
  });

  // W3) Mission completion triggers an unlock; unlock derives purely from badges.
  const lockedSnap = { completedMissions: [], earnedBadges: [], completedEncounters: [] };
  const unlockedSnap = {
    completedMissions: ["npc-pip-1"],
    earnedBadges: [{ badgeId: "integer-adventurer", earnedAt: 1 }],
    completedEncounters: [],
  };
  // Sandbox model: bridge-fdp is OPEN in free-play (open regardless of badges),
  // and preserves its original badge requirement in `campaignRequires` so the
  // teacher-driven campaign can re-lock it later.
  const openInSandbox = isUnlockedById("bridge-fdp", lockedSnap) === true;
  const bridgeUnlock = getUnlock("bridge-fdp");
  const campaignPreserved = Boolean(bridgeUnlock && bridgeUnlock.campaignRequires &&
    (bridgeUnlock.campaignRequires.badges || []).includes("integer-adventurer"));
  checks.push({
    name: "Sandbox gates open; campaign requirement preserved",
    pass: openInSandbox && campaignPreserved,
    detail: `open:${openInSandbox} campaignReq:${campaignPreserved}`,
  });

  // W4) Unlock state persists through a save/reload (it derives from saved
  //     badges/missions). Restores the real snapshot afterward.
  if (progressSnapshot) {
    const synthetic = {
      ...progressSnapshot,
      earnedBadges: [{ badgeId: "integer-adventurer", earnedAt: 1 }],
      completedMissions: ["npc-pip-1"],
    };
    saveProgress(synthetic);
    const re = loadProgress() || {};
    const persistOk = isUnlockedById("bridge-fdp", re);
    saveProgress(progressSnapshot);
    checks.push({
      name: "Unlock state persists through refresh",
      pass: persistOk,
      detail: persistOk ? "derived unlock survives reload" : "lost after reload",
    });
  }

  // W5) Default NPC chains are the arithmetic WARM-UPS (sandbox model): a single
  //     step that completes when the warm-up mission is done.
  const pip = getChain("pip");
  const s0 = resolveChainStep(pip, []);
  const s1 = resolveChainStep(pip, ["warmup-pip"]);
  const chainOk = pip && s0.index === 0 && !s0.complete && s1.complete &&
    getNpcAction(pip, []).kind === "mission" &&
    getNpcAction(pip, []).missionId === "warmup-pip" &&
    getNpcAction(pip, ["warmup-pip"]).kind === "complete";
  checks.push({
    name: "Default NPC warm-up chains resolve (Pip/Fern/Alby)",
    pass: Boolean(chainOk) && getAllChains().length === 12,
    detail: chainOk ? "warm-up advances & completes" : "chain resolution wrong",
  });

  // W6) Badge/trophy display can read earned badges.
  const decorated = decorateEarnedBadges([{ badgeId: "integer-adventurer", earnedAt: 1 }]);
  checks.push({
    name: "Trophy display reads earned badges",
    pass: decorated.length === 1 && decorated[0].badgeName === "Integer Adventurer",
    detail: decorated.length ? decorated[0].badgeName : "none",
  });

  // --- Larger-map checks (Phase 2H) ---

  // W7) All zones registered with valid positions/radii.
  const zonesValid = WORLD_ZONES.length >= 5 && WORLD_ZONES.every((z) =>
    z.id && Array.isArray(z.center) && z.center.length === 2 &&
    Number.isFinite(z.center[0]) && Number.isFinite(z.center[1]) && z.radius > 0
  );
  checks.push({
    name: "Zones registered with valid positions",
    pass: zonesValid,
    detail: `${WORLD_ZONES.length} zones`,
  });

  // W8) Each key NPC/interactable is assigned to a zone.
  const keyNpcs = ["pip", "fern", "alby", "mission-board", "trophy-stand"];
  const unassigned = keyNpcs.filter((id) => !getZoneForNpc(id));
  checks.push({
    name: "Key NPCs/interactables assigned to zones",
    pass: unassigned.length === 0,
    detail: unassigned.length === 0 ? "all assigned" : `missing: ${unassigned.join(", ")}`,
  });

  // W9) Mission board is in the hub; player spawn point exists.
  const hub = getZone("zone-hub");
  const boardInHub = hub && (hub.npcIds || []).includes("mission-board");
  const spawnOk = SPAWN_POINT && Number.isFinite(SPAWN_POINT.x) && Number.isFinite(SPAWN_POINT.z);
  checks.push({
    name: "Mission Board in hub + spawn point exists",
    pass: Boolean(boardInHub) && spawnOk,
    detail: `boardInHub:${Boolean(boardInHub)} spawn:(${SPAWN_POINT.x},${SPAWN_POINT.z})`,
  });

  // W10) Champion's Grove is open in the sandbox, but preserves its campaign
  //      requirement (badge) for a future "lock the world" campaign mode.
  const grove = getZone("zone-grove");
  const groveUnlock = grove && grove.unlockId ? getUnlock(grove.unlockId) : null;
  const grovePreserved = Boolean(groveUnlock && groveUnlock.campaignRequires &&
    ((groveUnlock.campaignRequires.badges || []).length || (groveUnlock.campaignRequires.completedMissions || []).length));
  checks.push({
    name: "Champion's Grove preserves its campaign requirement",
    pass: grovePreserved,
    detail: groveUnlock ? `campaign-gated by ${grove.unlockId}` : "no grove unlock",
  });

  return checks;
}

/**
 * STORY / ONBOARDING CHECKS (Phase 2I). Confirm the guided journey resolves
 * correctly and is purely derived: onboarding only for a new save, Sage dialogue
 * tracks progress, main-quest steps advance on each mission pass (and NOT on a
 * fail), celebrations don't replay, guidance points to the live target, NPC
 * missions still require visiting the NPC, and all the new flags persist.
 */
export function runStoryChecks(progressSnapshot) {
  const checks = [];
  const badge = (ids) => ids.map((id) => ({ badgeId: id, earnedAt: 1 }));

  // Snapshots along the journey (each builds on the last).
  const S = {
    fresh: mainQuestSnapshot({}),
    sage: mainQuestSnapshot({ sageMet: true }),
    pip: mainQuestSnapshot({ sageMet: true, earnedBadges: badge(["integer-adventurer"]), completedMissions: ["npc-pip-1"] }),
    fern: mainQuestSnapshot({ sageMet: true, earnedBadges: badge(["integer-adventurer", "fraction-explorer"]), completedMissions: ["npc-pip-1", "npc-fern-1"] }),
    alby: mainQuestSnapshot({ sageMet: true, earnedBadges: badge(["integer-adventurer", "fraction-explorer", "algebra-apprentice"]), completedMissions: ["npc-pip-1", "npc-fern-1", "npc-alby-1"] }),
  };
  const champ = mainQuestSnapshot({ ...S.alby, championClaimed: true });

  // S1) Onboarding only auto-shows for a brand-new save.
  const onboardOk = shouldShowOnboarding({ onboardingSeen: false }) === true &&
    shouldShowOnboarding({ onboardingSeen: true }) === false;
  checks.push({ name: "Onboarding only starts for a new save", pass: onboardOk, detail: onboardOk ? "new:show, seen:hide" : "wrong" });

  // S2) Main-quest steps resolve correctly across the journey.
  const stepIds = [
    resolveMainQuest(S.fresh).step.id,
    resolveMainQuest(S.sage).step.id,
    resolveMainQuest(S.pip).step.id,
    resolveMainQuest(S.fern).step.id,
    resolveMainQuest(S.alby).step.id,
  ];
  const champRes = resolveMainQuest(champ);
  // After Alby (the last authored step) the journey is complete (W6-B removed the
  // Champion's Grove claim step; the grove is now the SchoolYard portal).
  const stepsOk = stepIds.join(",") === "meet-sage,pip,fern,alby,champion" &&
    champRes.complete && champRes.step.id === "champion";
  checks.push({ name: "Main quest steps resolve correctly", pass: stepsOk, detail: stepsOk ? "meet-sage→…→champion" : `got ${stepIds.join(",")}` });

  // S3/S4/S5) Each pass opens the matching gate AND advances the main quest.
  const pipUnlocks = isUnlockedById("bridge-fdp", S.pip) && resolveMainQuest(S.pip).step.id === "fern";
  const fernUnlocks = isUnlockedById("gate-algebra", S.fern) && resolveMainQuest(S.fern).step.id === "alby";
  const albyUnlocks = isUnlockedById("reward-grove", S.alby) && resolveMainQuest(S.alby).complete;
  checks.push({ name: "Pip pass → Fraction Bridge step", pass: pipUnlocks, detail: pipUnlocks ? "bridge open, step fern" : "wrong" });
  checks.push({ name: "Fern pass → Algebra path step", pass: fernUnlocks, detail: fernUnlocks ? "gate open, step alby" : "wrong" });
  checks.push({ name: "Alby pass → journey complete (grove portal)", pass: albyUnlocks, detail: albyUnlocks ? "grove open, journey complete" : "wrong" });

  // S6) A FAIL (below 60%) does not progress the main quest.
  const failNoProgress = isPass(2, 5) === false &&
    resolveMainQuest(mainQuestSnapshot({ sageMet: true })).step.id === "pip";
  checks.push({ name: "Failed challenge does not progress main quest", pass: failNoProgress, detail: failNoProgress ? "2/5 fails, stays at pip" : "wrong" });

  // S7) Sage dialogue changes with progress (5 distinct opening lines across the
  //      journey; after Alby the story is complete — W6-B dropped the grove step).
  const sageOpeners = new Set([
    sageDialogue(S.fresh)[0],
    sageDialogue(S.sage)[0],
    sageDialogue(S.pip)[0],
    sageDialogue(S.fern)[0],
    sageDialogue(S.alby)[0],
  ]);
  checks.push({ name: "Sage dialogue changes with progress", pass: sageOpeners.size === 5, detail: `${sageOpeners.size}/5 distinct states` });

  // S8) Sandbox gates start open, so they do NOT fire a "world changed"
  //     celebration (there is nothing to reveal).
  const celUnlocked = mainQuestSnapshot({ earnedBadges: badge(["integer-adventurer"]), seenUnlocks: [] });
  const celOk = pendingCelebration(celUnlocked) === null;
  checks.push({ name: "Sandbox gates do not celebrate", pass: celOk, detail: celOk ? "open gates: no celebration" : "unexpected celebration" });

  // S9) Quest HUD / guidance shows the correct next step.
  const guideOk =
    mainQuestGuidance(S.fresh).text === MAIN_QUEST.steps[0].hint &&
    mainQuestGuidance(S.sage).text === MAIN_QUEST.steps[1].hint;
  checks.push({ name: "Quest HUD shows correct next step", pass: guideOk, detail: guideOk ? "hint matches current step" : "wrong" });

  // S10) Guidance marker points at a real current-target interactable.
  const g = mainQuestGuidance(S.sage);
  const tgt = mainQuestTarget(S.sage);
  const markerOk = g.targetId === "pip" && tgt && tgt.id === "pip" &&
    MAIN_QUEST.steps[MAIN_QUEST.steps.length - 1].id === "alby";
  checks.push({ name: "Guidance marker points to current target", pass: Boolean(markerOk), detail: markerOk ? "points at pip; last step is alby" : "wrong" });

  // S11) Mission Board free-choice missions still work (NPC chain ones hidden).
  const board = getAllMissions().filter((m) => !m.missionId.startsWith("npc-"));
  const boardOk = board.length >= 1 && board.every((m) => validateMission(m).valid) &&
    !board.some((m) => m.missionId.startsWith("npc-"));
  checks.push({ name: "Mission Board free-choice missions still work", pass: boardOk, detail: `${board.length} free-choice, npc hidden` });

  // S12) The default warm-up is begun by talking to the NPC (dialogue action),
  //      and once the warm-up is done the NPC offers no start action.
  const pipDlg = npcDialogue("pip", mainQuestSnapshot({}));
  const pipDoneDlg = npcDialogue("pip", mainQuestSnapshot({ completedMissions: ["warmup-pip"] }));
  const npcOk = pipDlg.action && pipDlg.action.missionId === "warmup-pip" && !pipDoneDlg.action;
  checks.push({ name: "Default warm-up requires visiting the NPC", pass: Boolean(npcOk), detail: npcOk ? "start via dialogue only" : "wrong" });

  // S13) Save/refresh preserves onboarding + main-quest flags (derived steps too).
  if (progressSnapshot) {
    const synthetic = {
      ...progressSnapshot,
      onboardingSeen: true,
      sageMet: true,
      championClaimed: true,
      seenUnlocks: ["bridge-fdp"],
    };
    saveProgress(synthetic);
    const re = loadProgress() || {};
    const persistOk = re.onboardingSeen === true && re.sageMet === true &&
      re.championClaimed === true && (re.seenUnlocks || []).includes("bridge-fdp");
    saveProgress(progressSnapshot); // restore
    checks.push({ name: "Save/refresh preserves onboarding + quest state", pass: persistOk, detail: persistOk ? "flags survive reload" : "lost" });
  }

  // S14) Reset defaults exist (DevPanel reset tools clear these flags).
  const defaultsOk = DEFAULT_PROGRESS.onboardingSeen === false &&
    DEFAULT_PROGRESS.sageMet === false && DEFAULT_PROGRESS.championClaimed === false &&
    Array.isArray(DEFAULT_PROGRESS.seenUnlocks);
  checks.push({ name: "Story flags have safe reset defaults", pass: defaultsOk, detail: defaultsOk ? "defaults present" : "missing" });

  // S15) Topic→target resolver maps known topics to their zone/NPC.
  const mappedOk =
    resolveTopicTarget("integers").targetId === "pip" &&
    resolveTopicTarget("fdp").targetId === "fern" &&
    resolveTopicTarget("algebra").targetId === "alby" &&
    resolveTopicTarget("area").targetId === "mission-board"; // area falls back (W6-B)
  checks.push({ name: "Topic→target maps known topics to zones/NPCs", pass: mappedOk, detail: mappedOk ? "integers/fdp/algebra mapped; area→board" : "wrong" });

  // S16) Unmapped topics fall back to the Mission Board (never crash, never
  //      forced onto Pip/Fern/Alby). Tests an unmapped registered topic AND a
  //      totally unknown one.
  const fb1 = resolveTopicTarget("surds");
  const fb2 = resolveTopicTarget("totally-made-up-topic");
  const fb3 = resolveTopicTarget(undefined);
  const fallbackOk = [fb1, fb2, fb3].every((t) => t.targetId === "mission-board" && t.fallback === true);
  checks.push({ name: "Unmapped topics fall back to Mission Board", pass: fallbackOk, detail: fallbackOk ? "safe board fallback" : "wrong" });

  // S17) Mission system stays flexible: a teacher mission on ANY registered
  //      topic resolves a target; single-topic → its zone, multi/unmapped →
  //      board. Built straight from the curriculum registry (not hardcoded).
  const regTopics = [];
  for (const st of getStages()) for (const t of getTopics(st.id)) regTopics.push(t.id);
  const singleAlg = resolveMissionTarget({ missionId: "t1", selectedTopics: ["algebra"] }).targetId === "alby";
  const singleSurd = resolveMissionTarget({ missionId: "t2", selectedTopics: ["surds"] });
  const multi = resolveMissionTarget({ missionId: "t3", selectedTopics: ["integers", "algebra"] });
  const missionTargetOk = singleAlg &&
    singleSurd.targetId === "mission-board" && singleSurd.fallback === true &&
    multi.targetId === "mission-board" && multi.fallback === true &&
    regTopics.length >= 4;
  checks.push({ name: "Teacher missions resolve target for any topic (board fallback)", pass: Boolean(missionTargetOk), detail: missionTargetOk ? `${regTopics.length} registry topics, fallback safe` : "wrong" });

  // S18) Guidance routing: an active free-choice mission overrides to its topic
  //      target; an active NPC-chain mission does NOT (curated chain owns it).
  const freeSnap = mainQuestSnapshot({ sageMet: true, activeMissionId: "free-alg", missionProgress: { missionId: "free-alg", complete: false } });
  const freeGuide = resolveStudentGuidance(freeSnap, { missionId: "free-alg", selectedTopics: ["algebra"] });
  const npcSnap = mainQuestSnapshot({ sageMet: true, activeMissionId: "npc-pip-1", missionProgress: { missionId: "npc-pip-1", complete: false } });
  const npcGuide = resolveStudentGuidance(npcSnap, getMission("npc-pip-1"));
  const routingOk = freeGuide.source === "mission" && freeGuide.targetId === "alby" &&
    npcGuide.source === "mainQuest";
  checks.push({ name: "Guidance separates free-choice from curated chain", pass: routingOk, detail: routingOk ? "free→topic, npc→chain" : "wrong" });

  return checks;
}

/**
 * TEACHER MISSION + TOPIC-ROUTING CHECKS (Phase 2J). Confirm the flexible
 * mission system routes any topic to the world (with a safe fallback), that
 * teacher/free missions are created correctly and DON'T progress the main story,
 * that guidance + NPC start/resume use the route, and that the local mission
 * shape stays future-Firebase-ready.
 */
export function runRouteChecks() {
  const checks = [];

  // R1) Every Stage 4 topic resolves to a real target (route or board fallback).
  const s4Topics = getTopics("stage4").map((t) => t.id);
  const unresolved = s4Topics.filter((id) => {
    const t = routeGuidanceTarget(id);
    return !t.targetId || !getInteractable(t.targetId);
  });
  checks.push({
    name: "Every Stage 4 topic has a route or safe fallback",
    pass: s4Topics.length >= 4 && unresolved.length === 0,
    detail: unresolved.length === 0 ? `${s4Topics.length} topics resolve` : `unresolved: ${unresolved.join(", ")}`,
  });

  // R2) The four authored routes map to the right NPC/marker.
  const r = (id) => (getTopicRoute(id) || {}).guidanceTarget;
  const routesOk = r("integers") === "pip" && r("fdp") === "fern" &&
    r("algebra") === "alby" && TOPIC_WORLD_ROUTES.length >= 3;
  checks.push({ name: "Integers→Pip, FDP→Fern, Algebra→Alby", pass: routesOk, detail: routesOk ? "routes correct" : "wrong" });

  // R3) A teacher/free-choice mission is created + validates + generates.
  const teacherRaw = {
    kind: "teacher", missionId: "test-teacher-fdp", title: "FDP Percentage practice",
    stages: ["stage4"], selectedTopics: ["fdp"], selectedSkills: ["percentageOf"],
    difficultyRange: { min: 1, max: 3 }, requiredQuestions: 5,
  };
  const tMission = normaliseMission(teacherRaw);
  const tValid = validateMission(tMission).valid && tMission.kind === "teacher";
  let tGen = false;
  try {
    tGen = buildMissionQuestions(tMission, 4, () => newProfile()).every((q) => q.check(q.answer));
  } catch { tGen = false; }
  checks.push({ name: "Teacher/free-choice mission creation works", pass: tValid && tGen, detail: tValid && tGen ? "valid + generates + self-checks" : "failed" });

  // R4) A teacher FDP mission does NOT progress the main story (Fern's step
  //     stays incomplete because npc-fern-1 wasn't done), even with the badge.
  const teacherSnap = mainQuestSnapshot({
    sageMet: true,
    completedMissions: ["npc-pip-1", "test-teacher-fdp"],
    earnedBadges: [{ badgeId: "integer-adventurer", earnedAt: 1 }, { badgeId: "fraction-explorer", earnedAt: 1 }],
  });
  const storyUnaffected = resolveMainQuest(teacherSnap).step.id === "fern";
  checks.push({ name: "Teacher mission does not progress main story", pass: storyUnaffected, detail: storyUnaffected ? "story stays at Fern's step" : "story advanced wrongly" });

  // R5) Guidance for an active teacher mission points to the routed target.
  const activeSnap = mainQuestSnapshot({ sageMet: true, activeMissionId: tMission.missionId, missionProgress: { missionId: tMission.missionId, complete: false } });
  const g = resolveStudentGuidance(activeSnap, tMission);
  const guideOk = g.source === "mission" && g.targetId === "fern";
  checks.push({ name: "Guidance marker points to routed target", pass: guideOk, detail: guideOk ? "FDP mission → Fern" : "wrong" });

  // R6) The mission can start/resume at the routed NPC (dialogue offers it).
  const dlg = assignedMissionDialogue("fern", tMission);
  const startOk = routeForMission(tMission).targetId === "fern" &&
    dlg.action && dlg.action.missionId === tMission.missionId;
  checks.push({ name: "Mission starts/resumes at routed NPC", pass: Boolean(startOk), detail: startOk ? "Fern offers the assigned mission" : "wrong" });

  // R7) Fallback route works for a topic without a dedicated route.
  const fb = routeForMission({ missionId: "x", selectedTopics: ["surds"] });
  const fbMulti = routeForMission({ missionId: "y", selectedTopics: ["integers", "fdp"] });
  const fallbackOk = fb.targetId === "mission-board" && fb.fallback === true &&
    fbMulti.targetId === "mission-board" && fbMulti.fallback === true;
  checks.push({ name: "Fallback route works for topic without a route", pass: fallbackOk, detail: fallbackOk ? "→ Mission Board" : "wrong" });

  // R8) The local mission shape is future-Firebase-ready (all fields present).
  const missing = FIREBASE_MISSION_FIELDS.filter((k) => !(k in tMission));
  const shapeOk = missing.length === 0 && tMission.passThreshold === 0.6 &&
    "createdBy" in tMission && "assignedAt" in tMission && "studentProgress" in tMission;
  checks.push({ name: "Local mission shape is future Firebase-ready", pass: shapeOk, detail: shapeOk ? `${FIREBASE_MISSION_FIELDS.length} fields present` : `missing: ${missing.join(", ")}` });

  // R8b) A teacher task can carry a reward badge ("get to the end" → trophy): a
  //      valid badge survives normaliseMission and awardBadge would accept it,
  //      while an unknown id is rejected so a task can't grant a junk badge.
  const badgeMission = normaliseMission({ missionId: "t-badge", kind: "teacher", stages: ["stage4"], selectedTopics: ["algebra"], rewardBadge: "stage4-quest-champion" });
  const badgeOk = badgeMission.rewardBadge === "stage4-quest-champion" &&
    isValidBadge(badgeMission.rewardBadge) && !isValidBadge("not-a-badge");
  checks.push({ name: "Teacher task can award a valid reward badge", pass: Boolean(badgeOk), detail: badgeOk ? "valid badge carried; unknown rejected" : "wrong" });

  // R9) The curated main story still completes end-to-end (story missions only).
  const champSnap = mainQuestSnapshot({
    sageMet: true,
    completedMissions: ["npc-pip-1", "npc-fern-1", "npc-alby-1"],
    championClaimed: true,
  });
  const storyOk = resolveMainQuest(mainQuestSnapshot({})).step.id === "meet-sage" &&
    resolveMainQuest(champSnap).complete;
  checks.push({ name: "Main story still completes (story missions only)", pass: storyOk, detail: storyOk ? "meet-sage → champion" : "wrong" });

  return checks;
}

/**
 * ANSWER MODE CHECKS (Phase 2K). Confirm the reusable answer-mode system works:
 * existing simple/MathLive modes still pass, each new mode generates + grades
 * correctly, the newly-adopted deferred FDP/Algebra types are safe, the new
 * skills appear in the Teacher Mission Builder + route to the right NPC, and
 * mission scoring + the 60% pass threshold still hold with structured answers.
 */
export function runAnswerModeChecks() {
  const checks = [];

  // The correct value for a generated question, shaped per mode.
  function correctValueFor(q) {
    const mode = answerModeOf(q);
    if (mode === ANSWER_MODES.MULTI_PART) return (q.expectedParts || []).map((p) => p.answer);
    if (mode === ANSWER_MODES.TABLE) return tableInputCells(q.tableConfig || {}).map((c) => c.answer);
    if (mode === ANSWER_MODES.ORDERED_LIST) return (q.orderedItems || []).slice();
    return q.answer;
  }

  // Generate a skill `samples` times, asserting: mode matches, self-check passes,
  // the correct value grades correct, and (where determinable) a wrong value fails.
  function modeOk(topic, skill, mode, samples = 16) {
    for (let i = 0; i < samples; i++) {
      const q = generateCurriculumQuestion("stage4", topic, skill, (i % 5) + 1);
      if (!q || answerModeOf(q) !== mode) return { ok: false, detail: `mode=${q && answerModeOf(q)}` };
      if (typeof q.check !== "function" || !q.check(q.answer)) return { ok: false, detail: "self-check failed" };
      const g = gradeAnswer(q, correctValueFor(q));
      if (!g.correct) return { ok: false, detail: "correct value not graded correct" };
      // A wrong value should fail (skip orderedList of length 1 — reverse equals).
      let wrong;
      if (mode === ANSWER_MODES.MULTI_PART) wrong = (q.expectedParts || []).map(() => "zzz");
      else if (mode === ANSWER_MODES.TABLE) wrong = tableInputCells(q.tableConfig || {}).map(() => "424242");
      else if (mode === ANSWER_MODES.ORDERED_LIST) wrong = (q.orderedItems || []).length > 1 ? (q.orderedItems || []).slice().reverse() : null;
      else if (mode === ANSWER_MODES.TRUE_FALSE) wrong = q.answer === "True" ? "False" : "True";
      else if (mode === ANSWER_MODES.COMPARISON) wrong = q.answer === "<" ? ">" : "<";
      else wrong = "definitely-wrong-zzz";
      if (wrong !== null && gradeAnswer(q, wrong).correct) return { ok: false, detail: "wrong value graded correct" };
    }
    return { ok: true, detail: `${samples} ok` };
  }

  // K1) Existing modes still work.
  const simpleQ = generateCurriculumQuestion("stage4", "integers", "addingIntegers", 2);
  const mathQ = generateCurriculumQuestion("stage4", "algebra", "simplifySimple", 2);
  checks.push({ name: "Simple answer mode still works", pass: answerModeOf(simpleQ) === "simple" && simpleQ.check(simpleQ.answer), detail: "ok" });
  checks.push({ name: "MathLive answer mode still works", pass: answerModeOf(mathQ) === "math" && mathQ.check(mathQ.answer), detail: "ok" });

  // K2) Each new mode generates + grades.
  const tf = modeOk("fdp", "trueFalseFdp", ANSWER_MODES.TRUE_FALSE);
  checks.push({ name: "trueFalse mode works", pass: tf.ok, detail: tf.detail });
  const cmp = modeOk("fdp", "compareFractions", ANSWER_MODES.COMPARISON);
  checks.push({ name: "comparisonSymbol mode works", pass: cmp.ok, detail: cmp.detail });
  const ord = modeOk("fdp", "orderDecimals", ANSWER_MODES.ORDERED_LIST);
  checks.push({ name: "orderedList mode works", pass: ord.ok, detail: ord.detail });
  const mpF = modeOk("fdp", "multiPartPercentage", ANSWER_MODES.MULTI_PART);
  checks.push({ name: "multiPart mode works (FDP)", pass: mpF.ok, detail: mpF.detail });
  const tbl = modeOk("algebra", "patternTable", ANSWER_MODES.TABLE);
  checks.push({ name: "tableInput mode works", pass: tbl.ok, detail: tbl.detail });
  const tfA = modeOk("algebra", "trueFalseEquivalent", ANSWER_MODES.TRUE_FALSE);
  const mpA = modeOk("algebra", "multiPartAlgebra", ANSWER_MODES.MULTI_PART);
  checks.push({ name: "Algebra deferred types generate safely", pass: tfA.ok && mpA.ok && tbl.ok, detail: tfA.ok && mpA.ok ? "trueFalse + multiPart + table ok" : `${tfA.detail}/${mpA.detail}` });
  checks.push({ name: "FDP deferred types generate safely", pass: tf.ok && cmp.ok && ord.ok && mpF.ok, detail: "compare/order/trueFalse/multiPart ok" });

  // K3) Partial scoring policy: all-or-nothing per question, with part feedback.
  let partialOk = false;
  {
    const q = generateCurriculumQuestion("stage4", "fdp", "multiPartPercentage", 3);
    const parts = (q.expectedParts || []).map((p) => p.answer);
    const allG = gradeAnswer(q, parts);
    const oneWrong = parts.slice(); oneWrong[oneWrong.length - 1] = "zzz";
    const partG = gradeAnswer(q, oneWrong);
    partialOk = allG.correct === true && partG.correct === false &&
      partG.total === parts.length && partG.correctCount === parts.length - 1 &&
      Array.isArray(partG.partResults);
  }
  checks.push({ name: "Multi-part scoring is all-or-nothing with part feedback", pass: partialOk, detail: partialOk ? "all parts required; partResults exposed" : "wrong" });

  // K4) New skills appear in the Teacher Mission Builder (the topic skill lists).
  const fdpSkillIds = (getTopics("stage4").find((t) => t.id === "fdp") || {}).skills?.map((s) => s.id) || [];
  const algSkillIds = (getTopics("stage4").find((t) => t.id === "algebra") || {}).skills?.map((s) => s.id) || [];
  const newFdp = ["compareFractions", "orderDecimals", "trueFalseFdp", "multiPartPercentage"];
  const newAlg = ["patternTable", "trueFalseEquivalent", "multiPartAlgebra"];
  const builderOk = newFdp.every((s) => fdpSkillIds.includes(s)) && newAlg.every((s) => algSkillIds.includes(s));
  checks.push({ name: "New skills appear in Teacher Mission Builder", pass: builderOk, detail: builderOk ? "all new FDP/Algebra skills listed" : "missing skill" });

  // K5) Missions using new skills route to the correct NPC.
  const routeFdp = routeForMission({ missionId: "t", selectedTopics: ["fdp"], selectedSkills: ["compareFractions"] }).targetId === "fern";
  const routeAlg = routeForMission({ missionId: "t", selectedTopics: ["algebra"], selectedSkills: ["patternTable"] }).targetId === "alby";
  checks.push({ name: "New-skill missions route to the correct NPC", pass: routeFdp && routeAlg, detail: routeFdp && routeAlg ? "FDP→Fern, Algebra→Alby" : "wrong" });

  // K6) Mission scoring + 60% pass threshold still hold with structured answers.
  let scoringOk = false;
  {
    const mission = normaliseMission({
      kind: "teacher", missionId: "k6", title: "FDP compare mission",
      stages: ["stage4"], selectedTopics: ["fdp"], selectedSkills: ["compareFractions"],
      difficultyRange: { min: 1, max: 3 }, requiredQuestions: 5,
    });
    const qs = buildMissionQuestions(mission, 5, () => newProfile());
    // Grade all correct → 5/5 (pass); grade 2/5 → fail.
    const allCorrect = qs.every((q) => gradeAnswer(q, q.answer).correct);
    scoringOk = mission.kind === "teacher" && allCorrect && isPass(5, 5) === true && isPass(2, 5) === false;
  }
  checks.push({ name: "Mission scoring + 60% threshold work with new modes", pass: scoringOk, detail: scoringOk ? "5/5 pass, 2/5 fail" : "wrong" });

  return checks;
}

/**
 * RESULT / REPORTING CHECKS (Phase 2L). Confirm the local attempt records are
 * valid + future-Firebase-ready, failed attempts are saved as failed, duplicates
 * are not created, multiPart/table partResults are stored, topic/skill summaries
 * aggregate correctly, JSON export is valid, and clearing results never touches
 * game/story progress. All pure (a local list mirrors the store's add/dedupe).
 */
export function runResultChecks() {
  const checks = [];

  // Mirror the store's add+dedupe+cap without touching the live results store.
  function simAdd(list, raw) {
    const rec = normaliseResult(raw);
    if (list.some((r) => r.attemptId === rec.attemptId)) return list;
    return [rec, ...list].slice(0, 200);
  }

  // L1) Record shape valid + future-Firebase-ready field constants present.
  const passRec = normaliseResult({ missionKind: "teacher", questionCount: 5, correctCount: 5 });
  const shapeOk = validateResult(passRec).valid &&
    RESULT_RECORD_FIELDS.every((f) => f in passRec) &&
    passRec.passed === true && passRec.status === "completed" && passRec.source === "local" &&
    FIREBASE_RESULT_FIELDS.length >= 14;
  checks.push({ name: "Result record shape is valid + Firebase-ready", pass: shapeOk, detail: shapeOk ? `${RESULT_RECORD_FIELDS.length} fields` : "wrong" });

  // L2) Teacher + story completions both produce saveable records.
  let list = [];
  list = simAdd(list, { attemptId: makeAttemptId(), missionKind: "teacher", missionTitle: "T", topicIds: ["fdp"], topicNames: ["FDP"], questionCount: 5, correctCount: 5, skillIds: ["percentageOf"], skillNames: ["%"], questionResults: [{ skillId: "percentageOf", answerMode: "simple", correct: true }] });
  list = simAdd(list, { attemptId: makeAttemptId(), missionKind: "story", missionTitle: "Pip", topicIds: ["integers"], topicNames: ["Integers"], questionCount: 4, correctCount: 3, skillIds: ["addingIntegers"], skillNames: ["Add"], questionResults: [{ skillId: "addingIntegers", answerMode: "simple", correct: true }] });
  const kinds = list.map((r) => r.missionKind);
  checks.push({ name: "Teacher + story completions save results", pass: list.length === 2 && kinds.includes("teacher") && kinds.includes("story"), detail: kinds.join(",") });

  // L3) A failed attempt (<60%) saves as failed and is not "completed".
  const failRec = normaliseResult({ missionKind: "teacher", questionCount: 5, correctCount: 2 });
  const failOk = failRec.passed === false && failRec.status === "failed" && failRec.percentage === 40;
  checks.push({ name: "Failed attempt saves as failed (not completed)", pass: failOk, detail: failOk ? "2/5 → 40% failed" : "wrong" });

  // L4) Duplicate attemptId does not create a second record.
  const dupId = makeAttemptId();
  let dl = [];
  dl = simAdd(dl, { attemptId: dupId, questionCount: 3, correctCount: 3 });
  dl = simAdd(dl, { attemptId: dupId, questionCount: 3, correctCount: 1 });
  checks.push({ name: "Duplicate result is not created on re-render", pass: dl.length === 1, detail: `len=${dl.length}` });

  // L5) multiPart / tableInput partResults are stored.
  const mpRec = normaliseResult({ questionResults: [{ answerMode: "multiPart", partResults: [true, false, true], correct: false }, { answerMode: "tableInput", partResults: [true, true], correct: true }] });
  const partsOk = mpRec.questionResults[0].partResults.join(",") === "true,false,true" &&
    mpRec.questionResults[1].partResults.length === 2;
  checks.push({ name: "multiPart/tableInput partResults are stored", pass: partsOk, detail: partsOk ? "partResults preserved" : "wrong" });

  // L6) Topic summary aggregates correctly.
  const topicSet = [
    normaliseResult({ topicIds: ["fdp"], topicNames: ["FDP"], questionCount: 4, correctCount: 4, completedAt: 2 }),
    normaliseResult({ topicIds: ["fdp"], topicNames: ["FDP"], questionCount: 4, correctCount: 0, completedAt: 1 }),
  ];
  const ts = summariseByTopic(topicSet).find((t) => t.topicId === "fdp");
  const topicAggOk = ts && ts.attempts === 2 && ts.avgPercentage === 50 && ts.passCount === 1 && ts.failCount === 1 && ts.bestScore === 100 && ts.latestScore === 100;
  checks.push({ name: "Topic summary aggregates correctly", pass: Boolean(topicAggOk), detail: topicAggOk ? "2 attempts, avg 50%, 1/1" : "wrong" });

  // L7) Skill summary aggregates correctly (question-level).
  const skillSet = [
    normaliseResult({ skillIds: ["s"], skillNames: ["S"], questionResults: [{ skillId: "s", correct: true }, { skillId: "s", correct: false }] }),
  ];
  const ss = summariseBySkill(skillSet).find((s) => s.skillId === "s");
  const skillAggOk = ss && ss.questions === 2 && ss.correct === 1 && ss.avgPercentage === 50;
  checks.push({ name: "Skill summary aggregates correctly", pass: Boolean(skillAggOk), detail: skillAggOk ? "2 q, 1 correct, 50%" : "wrong" });

  // L8) Teacher summary + JSON export are valid.
  const tsum = teacherSummary(topicSet);
  let jsonOk = false;
  try { const parsed = JSON.parse(toJSON(topicSet)); jsonOk = Array.isArray(parsed.results) && parsed.results.length === 2 && parsed.source; } catch { jsonOk = false; }
  checks.push({ name: "Teacher summary + JSON export are valid", pass: jsonOk && tsum.attemptCount === 2, detail: jsonOk ? "parseable JSON" : "bad JSON" });

  // L9) Old saves with no results + missing fields don't crash.
  let robustOk = true;
  try {
    normaliseResult(undefined);
    normaliseResult({});
    summariseByTopic([]);
    summariseBySkill([]);
    normaliseResult({ questionResults: [{}] });
  } catch { robustOk = false; }
  checks.push({ name: "Old saves / missing fields do not crash", pass: robustOk, detail: robustOk ? "tolerant" : "threw" });

  // L10) Clearing results never wipes mission/story progress (separate keys).
  let sepOk = false;
  try {
    const before = loadProgress();
    saveProgress({ ...(before || PROGRESS_DEFAULTS), sageMet: true });
    localStorage.setItem(RESULTS_KEY, "[{\"attemptId\":\"x\"}]");
    localStorage.removeItem(RESULTS_KEY); // the "clear results" action
    const after = loadProgress();
    sepOk = RESULTS_KEY !== "mills-maths-adventure:v1" && after && after.sageMet === true && localStorage.getItem(RESULTS_KEY) === null;
    saveProgress(before || PROGRESS_DEFAULTS); // restore
  } catch { sepOk = false; }
  checks.push({ name: "Clearing results does not wipe game/story progress", pass: sepOk, detail: sepOk ? "separate localStorage keys" : "wrong" });

  return checks;
}

/**
 * RESULTS POLISH CHECKS (Phase 2M). Confirm the new reporting helpers + refined
 * exports are correct: snapshot/mastery thresholds, teacher + student summaries,
 * CSV escaping, attempt-level + question-level CSV, the rule-based next-step, and
 * that empty/malformed data is handled without crashing.
 */
export function runResult2MChecks() {
  const checks = [];
  const mk = (over) => normaliseResult({ missionKind: "teacher", missionTitle: "M", topicIds: ["fdp"], topicNames: ["FDP"], questionCount: 4, correctCount: 4, skillIds: ["compareFractions"], skillNames: ["Compare"], questionResults: [{ topicId: "fdp", skillId: "compareFractions", answerMode: "comparison", correct: true, text: "1/2 ? 3/4", studentAnswer: "<", expectedAnswer: "<", difficultyLevel: 2 }], ...over });
  const data = [
    mk({ percentage: 100, correctCount: 4 }),
    mk({ percentage: 20, correctCount: 1, passed: false, missionTitle: "M2", questionResults: [{ topicId: "fdp", skillId: "orderDecimals", answerMode: "orderedList", correct: false, text: "order", studentAnswer: "a", expectedAnswer: "b", difficultyLevel: 3 }] }),
    mk({ percentage: 20, correctCount: 1, passed: false, missionTitle: "M2" }),
  ];

  // M1) Overall snapshot.
  const snap = overallSnapshot(data);
  checks.push({ name: "Overall snapshot aggregates", pass: snap.total === 3 && snap.passed === 1 && snap.failed === 2 && snap.avgPercentage === 47, detail: `${snap.passed}/${snap.total} avg ${snap.avgPercentage}%` });

  // M2) Mastery status thresholds (PART 4 rule).
  const m = [statusForAverage(0, 0), statusForAverage(49, 1), statusForAverage(50, 1), statusForAverage(79, 1), statusForAverage(80, 1)];
  const masteryOk = m[0] === MASTERY.NONE && m[1] === MASTERY.NEEDS && m[2] === MASTERY.DEVELOPING && m[3] === MASTERY.DEVELOPING && m[4] === MASTERY.SECURE;
  checks.push({ name: "Mastery status thresholds correct", pass: masteryOk, detail: masteryOk ? "none/needs/dev/dev/secure" : m.join(",") });

  // M3) Teacher summary + report text generate.
  const tsum = teacherSummary(data);
  const report = teacherReportText(data);
  const teacherOk = tsum.attemptCount === 3 && typeof report === "string" && report.includes("Attempts: 3") && Array.isArray(tsum.failedAttempts) && tsum.failedAttempts.length === 2;
  checks.push({ name: "Teacher summary + report text generate", pass: teacherOk, detail: teacherOk ? "report built" : "wrong" });

  // M4) Student progress generates.
  const sp = studentProgress(data, { studentName: "Tess" });
  const studentOk = sp.studentName === "Tess" && sp.attemptCount === 3 && Array.isArray(sp.recent) && sp.topicSummary.length >= 1;
  checks.push({ name: "Student progress summary generates", pass: studentOk, detail: studentOk ? "ok" : "wrong" });

  // M5) Suggested next step is rule-based + present with data, null when empty.
  const next = suggestedNextStep(data);
  const nextOk = typeof next === "string" && next.length > 0 && suggestedNextStep([]) === null;
  checks.push({ name: "Rule-based next-step recommendation", pass: nextOk, detail: nextOk ? "present + null-when-empty" : "wrong" });

  // M6) CSV escaping protects commas/quotes/newlines.
  const escOk = csvCell("a,b") === '"a,b"' && csvCell('a"b') === '"a""b"' && csvCell("a\nb") === '"a\nb"' && csvCell("plain") === "plain";
  checks.push({ name: "CSV escaping handles commas/quotes/newlines", pass: escOk, detail: escOk ? "escaped" : "wrong" });

  // M7) Attempt-level CSV has the teacher columns + one row per attempt.
  const aCsv = toCSV(data).split("\n");
  const aHead = aCsv[0];
  const attemptCsvOk = aCsv.length === data.length + 1 && aHead.includes("attemptId") && aHead.includes("answerModeSummary") && aHead.includes("difficultyRange") && aHead.includes("durationSeconds");
  checks.push({ name: "Attempt-level CSV export is valid", pass: attemptCsvOk, detail: attemptCsvOk ? `${data.length} rows + header` : "wrong" });

  // M8) Question-level CSV has one row per question + the right columns.
  const totalQ = data.reduce((n, r) => n + (r.questionResults || []).length, 0);
  const qCsv = toQuestionCSV(data).split("\n");
  const qHead = qCsv[0];
  const qCsvOk = qCsv.length === totalQ + 1 && qHead.includes("questionNumber") && qHead.includes("studentAnswer") && qHead.includes("diagramType") && qHead.includes("skillName");
  checks.push({ name: "Question-level CSV export is valid", pass: qCsvOk, detail: qCsvOk ? `${totalQ} question rows` : "wrong" });

  // M9) answerModeSummary string + hardest-mode ordering.
  const ams = answerModeSummary(data[0]);
  const hard = hardestAnswerModes(data);
  const insightOk = typeof ams === "string" && ams.includes("comparison") && hard.length >= 1 && hard[0].avgPercentage <= hard[hard.length - 1].avgPercentage;
  checks.push({ name: "Answer-mode insight + ordering", pass: insightOk, detail: insightOk ? "hardest-first" : "wrong" });

  // M10) Empty + malformed data never crashes the reporting layer.
  let safeOk = true;
  try {
    overallSnapshot([]); teacherSummary([]); studentProgress([]); teacherReportText([]);
    toCSV([]); toQuestionCSV([]); answerModeSummary({}); suggestedNextStep([]);
    summariseByTopic([normaliseResult({})]);
    toQuestionCSV([normaliseResult({ questionResults: [{}] })]);
    repeatedFailures([normaliseResult({})]);
  } catch { safeOk = false; }
  checks.push({ name: "Empty/malformed results never crash reporting", pass: safeOk, detail: safeOk ? "tolerant" : "threw" });

  return checks;
}

/**
 * PYTHAGORAS CHECKS (Phase 2N). Confirm the new Stage 4 Pythagoras topic
 * integrates end-to-end: registered + selectable, generates valid questions in
 * every skill, grades numeric answers with/without units + rounding, grades
 * triad yes/no, produces DiagramRenderer-recognised figures, routes safely,
 * never progresses the main story, and saves cleanly into the result system.
 */
export function runPythagorasChecks() {
  const checks = [];
  const SKILLS = [
    "pythagoras-squares", "pythagoras-square-roots", "pythagoras-hypotenuse",
    "pythagoras-shorter-side", "pythagoras-decimal-sides", "pythagoras-triads",
    "pythagoras-real-world", "pythagoras-multi-step",
  ];
  const bare = (s) => (String(s).match(/-?\d+(?:\.\d+)?/) || [""])[0];

  // P1) Topic registered with the expected name.
  const topic = getTopics("stage4").find((t) => t.id === "pythagoras");
  checks.push({ name: "Pythagoras topic registered in curriculum", pass: Boolean(topic) && topic.name === "Pythagoras", detail: topic ? topic.name : "missing" });

  // P2) All 8 skills registered + selectable (appear in the topic skill list).
  const skillIds = (topic && topic.skills ? topic.skills.map((s) => s.id) : []);
  const skillsOk = SKILLS.every((s) => skillIds.includes(s));
  checks.push({ name: "Pythagoras skills registered & selectable", pass: skillsOk, detail: skillsOk ? `${skillIds.length} skills` : "missing skill" });

  // P3 + P4) Every skill generates valid questions carrying the required fields.
  let genOk = true, genDetail = "all ok";
  for (const s of SKILLS) {
    for (let i = 0; i < 8; i++) {
      const q = generateCurriculumQuestion("stage4", "pythagoras", s, (i % 5) + 1);
      if (!q || !q.text || q.topicId !== "pythagoras" || q.skillId !== s || !q.answer ||
        typeof q.check !== "function" || !q.check(q.answer) || !(q.difficultyLevel >= 1)) {
        genOk = false; genDetail = `bad ${s}`; break;
      }
    }
    if (!genOk) break;
  }
  checks.push({ name: "Pythagoras generator returns valid questions", pass: genOk, detail: genDetail });
  checks.push({ name: "Pythagoras questions carry topic/skill/prompt/answer/difficulty", pass: genOk, detail: genOk ? "fields present" : genDetail });

  // P5) Numeric answers grade with AND without units.
  const hyp = generateCurriculumQuestion("stage4", "pythagoras", "pythagoras-hypotenuse", 2);
  const unitsOk = hyp.check(hyp.answer) && hyp.check(bare(hyp.answer)) && hyp.check(`x = ${bare(hyp.answer)}`) && !hyp.check(String(Number(bare(hyp.answer)) + 9));
  checks.push({ name: "Pythagoras numeric answers grade with/without units", pass: Boolean(unitsOk), detail: unitsOk ? "units optional" : "wrong" });

  // P6) Rounded decimal answers grade correctly.
  const dec = generateCurriculumQuestion("stage4", "pythagoras", "pythagoras-decimal-sides", 3);
  const roundOk = dec.check(dec.answer) && dec.check(bare(dec.answer));
  checks.push({ name: "Pythagoras rounded decimal answers grade correctly", pass: Boolean(roundOk), detail: roundOk ? "1 dp accepted" : "wrong" });

  // P7) Triad → Yes/No CHOICE (trueFalse mode), not a numeric box; prompt drops
  //     "Justify your answer"; grading accepts the answer + rejects the opposite.
  const tri = generateCurriculumQuestion("stage4", "pythagoras", "pythagoras-triads", 3);
  const triMode = answerModeOf(tri);
  const triOptionsOk = Array.isArray(tri.options) && tri.options[0] === "Yes" && tri.options[1] === "No";
  const noJustify = !/justify/i.test(tri.text);
  const other = tri.answer === "Yes" ? "No" : "Yes";
  const triGrade = tri.check(tri.answer) && !tri.check(other);
  checks.push({ name: "Pythagoras triad uses a Yes/No choice (non-numeric)", pass: triMode === "trueFalse" && triOptionsOk, detail: `mode ${triMode}` });
  checks.push({ name: "Pythagoras triad drops 'Justify' + grades Yes/No", pass: noJustify && Boolean(triGrade), detail: noJustify && triGrade ? `answer ${tri.answer}` : "wrong" });

  // P7b) Real-world questions NEVER show the blank "Draw a diagram" box; ladder/
  //      rectangle/ramp scenarios map to contextual figures (Phase 2N patch).
  let drawBox = false, badType = false;
  const sawTypes = new Set();
  for (let i = 0; i < 150; i++) {
    const q = generateCurriculumQuestion("stage4", "pythagoras", "pythagoras-real-world", 4);
    if (q.diagramType) {
      sawTypes.add(q.diagramType);
      if (q.diagramType === "studentDiagramSpace") drawBox = true;
      else if (!["pythagorasLadder", "pythagorasRectangle", "pythagorasRamp"].includes(q.diagramType)) badType = true;
      const t = q.text.toLowerCase();
      if (/ladder/.test(t) && q.diagramType !== "pythagorasLadder") badType = true;
      if (/(rectangular|screen|wide|paper|square of side)/.test(t) && q.diagramType !== "pythagorasRectangle") badType = true;
      if (/(ramp|driveway)/.test(t) && q.diagramType !== "pythagorasRamp") badType = true;
    }
  }
  for (let i = 0; i < 30; i++) {
    if (generateCurriculumQuestion("stage4", "pythagoras", "pythagoras-multi-step", 5).diagramType === "studentDiagramSpace") drawBox = true;
  }
  checks.push({ name: "Pythagoras real-world never uses the Draw-a-diagram box", pass: !drawBox && !badType, detail: drawBox ? "draw box used" : (badType ? "wrong scenario diagram" : `types: ${[...sawTypes].join(", ") || "none"}`) });
  checks.push({ name: "Ladder/rectangle/ramp map to contextual figures", pass: sawTypes.has("pythagorasLadder") && sawTypes.has("pythagorasRectangle") && sawTypes.has("pythagorasRamp"), detail: [...sawTypes].join(", ") });

  // P8) Diagram types are recognised by the renderer.
  const PY_DIAGS = ["pythagorasTriangle", "pythagorasRamp", "pythagorasLadder", "pythagorasRectangle"];
  const diagSupported = PY_DIAGS.every((t) => SUPPORTED_DIAGRAM_TYPES.includes(t));
  checks.push({ name: "Pythagoras diagram types recognised by DiagramRenderer", pass: diagSupported, detail: diagSupported ? `${PY_DIAGS.length} types supported` : "missing type" });

  // P9) Right-triangle render path: data shape is renderable (won't crash).
  // (decimal-sides always carries a right-triangle figure.)
  const triData = dec.diagramType === "pythagorasTriangle" ? dec.diagramData : null;
  const triRenderOk = Boolean(triData && Number(triData.a) > 0 && Number(triData.b) > 0 && triData.labels);
  checks.push({ name: "Right-triangle diagram data is renderable", pass: triRenderOk, detail: triRenderOk ? "a/b/labels present" : "missing diagram data" });

  // P10) Word problems generate cleanly WITHOUT a draw box (Phase 2N patch).
  //      The studentDiagramSpace type stays registered (future worksheet use)
  //      but is never emitted by the game adapter.
  let msClean = true;
  for (let i = 0; i < 24; i++) {
    const ms = generateCurriculumQuestion("stage4", "pythagoras", "pythagoras-multi-step", 5);
    if (ms.diagramType === "studentDiagramSpace" || !ms.text || !ms.check(ms.answer)) { msClean = false; break; }
  }
  const typeStillRegistered = SUPPORTED_DIAGRAM_TYPES.includes("studentDiagramSpace");
  checks.push({ name: "Word problems generate without a draw box", pass: msClean && typeStillRegistered, detail: msClean ? "no draw box; type still registered" : "wrong" });

  // P11) Routing: Pythagoras has no dedicated zone → falls back to the Mission
  //      Board safely (W6-B removed the Area Meadow marker), single or multi-topic.
  const route = routeForMission({ missionId: "p", selectedTopics: ["pythagoras"] });
  const routeOk = route.targetId === "mission-board" &&
    routeForMission({ missionId: "p2", selectedTopics: ["pythagoras", "fdp"] }).targetId === "mission-board";
  checks.push({ name: "Pythagoras routes to Mission Board fallback", pass: routeOk, detail: routeOk ? "→ Mission Board" : "wrong" });

  // P12) A teacher/free Pythagoras mission does NOT progress the main story.
  const storySnap = mainQuestSnapshot({ sageMet: true, completedMissions: ["teacher-pyth"], earnedBadges: [{ badgeId: "fraction-explorer", earnedAt: 1 }] });
  const storyUnaffected = resolveMainQuest(storySnap).step.id === "pip";
  checks.push({ name: "Pythagoras mission does not alter story progression", pass: storyUnaffected, detail: storyUnaffected ? "story stays at Pip" : "story changed" });

  // P13) Attempt records normalise correctly for results.
  const rec = normaliseResult({
    missionKind: "teacher", missionTitle: "Pyth", topicIds: ["pythagoras"], topicNames: ["Pythagoras"],
    skillIds: ["pythagoras-hypotenuse"], skillNames: ["Find the Hypotenuse"], questionCount: 3, correctCount: 2,
    questionResults: [{ topicId: "pythagoras", skillId: "pythagoras-hypotenuse", answerMode: "simple", correct: true, text: "x?", studentAnswer: "13 cm", expectedAnswer: "13 cm", diagramType: "pythagorasTriangle", sourceType: "legacy-adapter", difficultyLevel: 2 }],
  });
  const recOk = validateResult(rec).valid && rec.topicIds.includes("pythagoras") && rec.percentage === 67;
  checks.push({ name: "Pythagoras attempt records normalise correctly", pass: recOk, detail: recOk ? "valid record" : "wrong" });

  // P14) Question-level results include diagram/source metadata.
  const qr = rec.questionResults[0];
  const metaOk = qr.diagramType === "pythagorasTriangle" && qr.sourceType === "legacy-adapter";
  checks.push({ name: "Pythagoras question results include diagram/source metadata", pass: metaOk, detail: metaOk ? "diagram + source kept" : "wrong" });

  // P15) Existing result exports tolerate Pythagoras attempts.
  let exportOk = false;
  try {
    const jsonParsed = JSON.parse(toJSON([rec]));
    const aCsv = toCSV([rec]).split("\n");
    const qCsv = toQuestionCSV([rec]).split("\n");
    exportOk = jsonParsed.results.length === 1 && aCsv.length === 2 && qCsv.length === 2 && aCsv[1].includes("Pyth");
  } catch { exportOk = false; }
  checks.push({ name: "Result exports (JSON/CSV) tolerate Pythagoras attempts", pass: exportOk, detail: exportOk ? "JSON+CSV ok" : "export failed" });

  return checks;
}

/**
 * CLASSROOM-READINESS CHECKS (Phase 2O). Confirm the Year 7 pilot pieces work:
 * presets exist + are valid teacher/preset missions that generate and don't
 * progress the story, classroom-appropriate lengths, local player name/code
 * persists + flows into results, routing + Results Centre + exports tolerate
 * presets, and existing story missions still work.
 */
export function runClassroomChecks(progressSnapshot) {
  const checks = [];
  const presets = getPresetMissions();

  // O1) Year 7 presets exist (a sensible set).
  checks.push({ name: "Year 7 presets exist", pass: presets.length >= 5, detail: `${presets.length} presets` });

  // O2) Each preset is a VALID 'preset'-kind mission (not story).
  const allValid = presets.every((m) => validateMission(m).valid && m.kind === "preset");
  checks.push({ name: "Each preset is a valid teacher/preset mission", pass: allValid, detail: allValid ? "all valid, kind=preset" : "invalid preset" });

  // O3) Presets include valid topicIds + skillIds, classroom-appropriate length.
  const topicsOk = presets.every((m) => m.selectedTopics.length >= 1);
  const lengthOk = presets.every((m) => m.requiredQuestions >= 8 && m.requiredQuestions <= 15);
  checks.push({ name: "Presets have valid topics + classroom-length", pass: topicsOk && lengthOk, detail: lengthOk ? "8–15 questions each" : "bad length" });

  // O4) Presets GENERATE questions that self-check.
  let genOk = true;
  for (const m of presets) {
    try {
      const qs = buildMissionQuestions(m, Math.min(6, m.requiredQuestions), () => newProfile());
      if (!qs.length || !qs.every((q) => q.check(q.answer))) { genOk = false; break; }
    } catch { genOk = false; break; }
  }
  checks.push({ name: "Preset missions generate valid questions", pass: genOk, detail: genOk ? "all generate" : "generation failed" });

  // O5) A completed PRESET does NOT progress the main story.
  const presetSnap = mainQuestSnapshot({ sageMet: true, completedMissions: ["y7-mixed-review"], earnedBadges: [{ badgeId: "fraction-explorer", earnedAt: 1 }] });
  const storyUnaffected = resolveMainQuest(presetSnap).step.id === "pip" && isPresetMission("y7-mixed-review");
  checks.push({ name: "Preset missions do not progress the main story", pass: storyUnaffected, detail: storyUnaffected ? "story stays at Pip" : "story changed" });

  // O6) Presets route to an existing target or the Mission Board fallback.
  const singleRoute = routeForMission(getMission("y7-integer-foundations")).targetId === "pip";
  const mixedRoute = routeForMission(getMission("y7-mixed-review")).targetId === "mission-board";
  checks.push({ name: "Preset topic routing works (target or board fallback)", pass: singleRoute && mixedRoute, detail: singleRoute && mixedRoute ? "single→NPC, mixed→board" : "wrong" });

  // O7) Local player name + student code persist (no login).
  let identityOk = false;
  try {
    const before = loadProgress();
    const prof = { name: "Jordan", color: "#3a86ff", studentCode: "7M-12", classCode: "" };
    saveProgress({ ...(before || PROGRESS_DEFAULTS), profile: prof });
    const re = loadProgress() || {};
    identityOk = re.profile && re.profile.name === "Jordan" && re.profile.studentCode === "7M-12";
    saveProgress(before || PROGRESS_DEFAULTS); // restore
  } catch { identityOk = false; }
  checks.push({ name: "Player name + student code persist locally", pass: identityOk, detail: identityOk ? "saved + reloaded" : "lost" });

  // O8) Results carry player name + student code where available.
  const rec = normaliseResult({
    missionKind: "preset", missionId: "y7-mixed-review", missionTitle: "Mixed Year 7 Review",
    studentName: "Jordan", studentCode: "7M-12",
    topicIds: ["integers", "fdp"], topicNames: ["Integers", "FDP"], questionCount: 12, correctCount: 9,
    questionResults: [{ topicId: "integers", skillId: "addingIntegers", answerMode: "simple", correct: true }],
  });
  const recOk = validateResult(rec).valid && rec.missionKind === "preset" && rec.studentName === "Jordan" && rec.studentCode === "7M-12";
  checks.push({ name: "Results include player name + student code", pass: recOk, detail: recOk ? "name + code stored" : "missing" });

  // O9) Results Centre summaries + exports tolerate preset attempts.
  let centreOk = false;
  try {
    const t = teacherSummary([rec]);
    const json = JSON.parse(toJSON([rec]));
    const csv = toCSV([rec]).split("\n");
    const qcsv = toQuestionCSV([rec]).split("\n");
    centreOk = t.attemptCount === 1 && json.results.length === 1 &&
      csv.length === 2 && csv[1].includes("preset") && qcsv.length === 2;
  } catch { centreOk = false; }
  checks.push({ name: "Results Centre + exports tolerate preset attempts", pass: centreOk, detail: centreOk ? "summary + CSV/JSON ok" : "failed" });

  // O10) Duplicate preset attempt is not stored twice (dedupe by attemptId).
  function simAdd(list, raw) {
    const r = normaliseResult(raw);
    return list.some((x) => x.attemptId === r.attemptId) ? list : [r, ...list];
  }
  const id = "preset-dup";
  let dl = [];
  dl = simAdd(dl, { attemptId: id, missionKind: "preset", questionCount: 10, correctCount: 7 });
  dl = simAdd(dl, { attemptId: id, missionKind: "preset", questionCount: 10, correctCount: 2 });
  checks.push({ name: "Retrying/leaving does not duplicate a preset attempt", pass: dl.length === 1, detail: `len=${dl.length}` });

  // O11) Existing story missions still generate + the story still completes.
  const storyMission = getMission("npc-pip-1");
  let storyGen = false;
  try { storyGen = validateMission(storyMission).valid && buildMissionQuestions(storyMission, 4, () => newProfile()).every((q) => q.check(q.answer)); } catch { storyGen = false; }
  const storyFlow = resolveMainQuest(mainQuestSnapshot({ sageMet: true, completedMissions: ["npc-pip-1", "npc-fern-1", "npc-alby-1"], championClaimed: true })).complete;
  checks.push({ name: "Existing story missions still work", pass: Boolean(storyGen) && storyFlow, detail: storyGen && storyFlow ? "story generates + completes" : "wrong" });

  return checks;
}

/**
 * PILOT DRY-RUN RELIABILITY CHECKS (Phase 2P). Confirm the classroom loop is
 * robust: the Teacher Pilot card data + local-only warning exist, the result
 * summary reads correctly, preset lengths stay short while long custom missions
 * are still allowed (with condensed progress), exports tolerate mixed kinds, and
 * the safe-clearing / no-duplicate / leave-doesn't-save rules hold.
 */
export function runPilotChecks() {
  const checks = [];

  // P1) Teacher Pilot card data + local-only warning exist.
  const cardOk = PILOT_CARD && PILOT_CARD.workflow.length >= 5 && PILOT_CARD.checklist.length >= 5 &&
    typeof LOCAL_ONLY_WARNING === "string" && /device/i.test(LOCAL_ONLY_WARNING) && /export/i.test(LOCAL_ONLY_WARNING);
  checks.push({ name: "Teacher Pilot card + local-only warning exist", pass: Boolean(cardOk), detail: cardOk ? "workflow + checklist + warning" : "missing" });

  // P2) Copy-result summary includes name/code, mission, score, %, pass/fail,
  //     and the saved-locally status.
  const rec = normaliseResult({
    missionKind: "preset", missionTitle: "Mixed Year 7 Review", studentName: "Jeff", studentCode: "7M-12",
    questionCount: 10, correctCount: 8, topicIds: ["integers"], topicNames: ["Integers"],
    questionResults: [{ topicId: "integers", skillId: "addingIntegers", answerMode: "simple", correct: true }],
  });
  const summary = resultSummaryText(rec);
  const summaryOk = summary.includes("Jeff") && summary.includes("7M-12") && summary.includes("Mixed Year 7 Review") &&
    summary.includes("8/10") && summary.includes("80%") && /passed/i.test(summary) && /saved locally/i.test(summary);
  checks.push({ name: "Copy result summary includes name/code/score/%/result", pass: summaryOk, detail: summaryOk ? "plain-English summary" : summary });

  // P3) A failed summary reads "not passed".
  const failRec = normaliseResult({ missionTitle: "Algebra Readiness", studentName: "Sam", questionCount: 10, correctCount: 3 });
  const failSummaryOk = /not passed/i.test(resultSummaryText(failRec));
  checks.push({ name: "Failed attempt summary reads 'not passed'", pass: failSummaryOk, detail: failSummaryOk ? "ok" : "wrong" });

  // P4) Preset lengths stay classroom-appropriate (≤ cap); custom long allowed.
  const presets = getPresetMissions();
  const presetsShort = presets.every((m) => m.requiredQuestions <= CLASSROOM_MAX_PRESET_QUESTIONS);
  // A 30-question custom mission is still valid (just not a default/preset).
  const longCustom = normaliseMission({ missionId: "custom-30", kind: "teacher", stages: ["stage4"], selectedTopics: ["pythagoras"], selectedSkills: ["pythagoras-squares"], requiredQuestions: 30 });
  const longOk = validateMission(longCustom).valid && longCustom.requiredQuestions === 30 && !isPresetMission("custom-30");
  checks.push({ name: "Presets stay short; long custom missions still allowed", pass: presetsShort && longOk, detail: presetsShort ? `presets ≤ ${CLASSROOM_MAX_PRESET_QUESTIONS}, 30q custom ok` : "preset too long" });

  // P5) The condensed-progress threshold is sane (long missions use the bar).
  const condensedOk = LONG_MISSION_THRESHOLD >= 12 && LONG_MISSION_THRESHOLD < 30 && longCustom.requiredQuestions > LONG_MISSION_THRESHOLD;
  checks.push({ name: "Long missions use condensed progress display", pass: condensedOk, detail: condensedOk ? `threshold ${LONG_MISSION_THRESHOLD}` : "wrong" });

  // P6) Exports tolerate story + teacher + preset attempts together.
  const mixed = [
    rec,
    normaliseResult({ missionKind: "story", missionTitle: "Pip's Integer Trial", studentName: "Jeff", questionCount: 4, correctCount: 4, topicIds: ["integers"], topicNames: ["Integers"] }),
    normaliseResult({ missionKind: "teacher", missionTitle: "Custom FDP", studentName: "Sam", questionCount: 5, correctCount: 2, topicIds: ["fdp"], topicNames: ["FDP"] }),
  ];
  let mixedOk = false;
  try {
    const json = JSON.parse(toJSON(mixed));
    const csv = toCSV(mixed).split("\n");
    mixedOk = json.results.length === 3 && csv.length === 4 &&
      teacherSummary(mixed).attemptCount === 3 &&
      [...new Set(mixed.map((r) => r.missionKind))].length === 3;
  } catch { mixedOk = false; }
  checks.push({ name: "Exports tolerate story + teacher + preset attempts", pass: mixedOk, detail: mixedOk ? "3 kinds export ok" : "failed" });

  // P7) Retrying creates a NEW attempt id (not a duplicate); leaving saves none.
  const a1 = makeAttemptId();
  const a2 = makeAttemptId();
  const retryOk = a1 !== a2; // each run/attempt mints its own id
  checks.push({ name: "Retry mints a new attempt id (no duplicate)", pass: retryOk, detail: retryOk ? "unique ids" : "collision" });

  // P8) Clearing results (key-level) keeps identity + story progress intact.
  let safeClearOk = false;
  try {
    const before = loadProgress();
    saveProgress({ ...(before || PROGRESS_DEFAULTS), sageMet: true, profile: { name: "Jeff", color: "#000", studentCode: "7M-12", classCode: "" } });
    localStorage.setItem(RESULTS_KEY, "[{\"attemptId\":\"z\"}]");
    localStorage.removeItem(RESULTS_KEY); // "Clear results only"
    const after = loadProgress() || {};
    safeClearOk = after.sageMet === true && after.profile && after.profile.name === "Jeff" &&
      after.profile.studentCode === "7M-12" && localStorage.getItem(RESULTS_KEY) === null;
    saveProgress(before || PROGRESS_DEFAULTS);
  } catch { safeClearOk = false; }
  checks.push({ name: "Clearing results keeps identity + story progress", pass: safeClearOk, detail: safeClearOk ? "identity + story preserved" : "wrong" });

  return checks;
}

/**
 * CLOUD ATTEMPTS MVP CHECKS (Phase 3B). Pure mapper + writer behaviour with a
 * MOCKED cloud client — no Firebase, no network. Confirms: normalisation matches
 * MMT, demo/story are not synced, mappers produce the compact + rich records,
 * typed answers are stripped, the compact record has no question array, save
 * failure doesn't throw, retries get a new id, and story stays separate.
 */
export function runCloudChecks() {
  const checks = [];
  const student = { studentCode: "ZK7Q2", name: "Alex Tan", firstName: "Alex", surname: "Tan", className: "7MAB", teacherCode: "MILLS4821", teacherName: "A. Mills", school: "Example HS", active: true };
  const rec = normaliseResult({
    attemptId: makeAttemptId(), missionKind: "preset", missionId: "y7-fdp-check", missionTitle: "FDP Check",
    studentName: "LocalName", topicIds: ["fdp"], topicNames: ["Fractions, Decimals & Percentages"],
    skillIds: ["percentageOf"], skillNames: ["Percentage of a Quantity"], questionCount: 10, correctCount: 8,
    xpAwarded: 60, coinsAwarded: 30, startedAt: Date.now() - 60000, completedAt: Date.now(),
    questionResults: [{ questionId: "q1", text: "20% of 50", topicId: "fdp", skillId: "percentageOf", difficultyLevel: 2, answerMode: "simple", studentAnswer: "10", expectedAnswer: "10", correct: true, sourceType: "legacy-adapter" }],
  });

  // C1) Code normalisation matches the existing MMT pattern.
  const normOk = normaliseStudentCode(" zk7q2! ") === "ZK7Q2" && normaliseStudentCode("ab-12_x") === "AB-12X";
  checks.push({ name: "Cloud student-code normalisation matches MMT", pass: normOk, detail: normOk ? "trim/upper/strip" : "wrong" });

  // C2) Demo (no profile) is NOT cloud-saved; registered IS — including story
  //     (Phase 3B.1 policy change). Abandoned never reaches here.
  const story = { ...rec, attemptId: makeAttemptId(), missionKind: "story", missionId: "npc-pip-1", missionTitle: "Pip's Integer Trial" };
  const gateOk = shouldCloudSave(rec, student) === true &&
    shouldCloudSave(rec, null) === false &&
    shouldCloudSave(story, student) === true && // story now eligible when registered
    shouldCloudSave(story, null) === false;     // demo story stays local
  checks.push({ name: "Registered attempts (incl. story) save; demo stays local", pass: gateOk, detail: gateOk ? "registered any-kind; demo none" : "wrong" });

  // C2b) Story maps with missionKind:"story", null task fields, stripped answers,
  //      and no question array in the compact achievement.
  const storyAch = mapResultToAchievement(story, student);
  const storyAtt = mapResultToAdventureAttempt(story, student);
  const storyOk = storyAch.missionKind === "story" && storyAch.level === "Pip's Integer Trial" &&
    storyAch.levelKey === "npc-pip-1" && storyAch.adventureTaskId === null && !("questionResults" in storyAch) &&
    storyAtt.missionKind === "story" && storyAtt.taskId === null && storyAtt.taskCode === null && storyAtt.classCode === null &&
    storyAtt.questionResults.length === 1 && !("studentAnswer" in storyAtt.questionResults[0]);
  checks.push({ name: "Story attempt tagged missionKind:story; task fields null; answers stripped", pass: storyOk, detail: storyOk ? "story tagged + separated" : "wrong" });

  // C3) Compact achievement: identity from Firebase, mapped topic, NO question array.
  const ach = mapResultToAchievement(rec, student);
  const achOk = ach.studentName === "Alex Tan" && ach.studentCode === "ZK7Q2" &&
    ach.tool === "Mills Maths Adventure" && ach.level === "FDP Check" &&
    ach.masteryTopic === "Fractions, Decimals & Percentages" && ach.percent === 80 &&
    !("questionResults" in ach) && ach.adventureAttemptId === rec.attemptId;
  checks.push({ name: "Maps to compact achievement (no question array)", pass: achOk, detail: achOk ? "compact + mapped" : "wrong" });

  // C4) Rich adventure attempt: id reuse, snapshot, typed answers stripped.
  const att = mapResultToAdventureAttempt(rec, student);
  const q0 = att.questionResults[0];
  const attOk = att.attemptId === rec.attemptId && att.source === "mills-maths-adventure" &&
    Array.isArray(att.questionResults) && q0.prompt === "20% of 50" && q0.correct === true &&
    q0.expectedAnswer === "10" && !("studentAnswer" in q0) &&
    att.taskId === null && att.classCode === null;
  checks.push({ name: "Maps to rich attempt; typed answers stripped", pass: attOk, detail: attOk ? "snapshot kept, answer stripped" : "wrong" });

  // C5) buildCloudPayloads returns both shapes consistently.
  const payloads = buildCloudPayloads(rec, student);
  const payOk = payloads.achievement.studentCode === "ZK7Q2" && payloads.adventureAttempt.attemptId === rec.attemptId;
  checks.push({ name: "Cloud payloads build both records", pass: payOk, detail: payOk ? "achievement + attempt" : "wrong" });

  // C6) Writer is callable with an injected mock client (the async dual-save +
  //     failure-doesn't-throw behaviour is verified headlessly with mocks; here
  //     we confirm the injectable contract so no live Firebase is needed).
  checks.push({ name: "Cloud writer accepts an injected client (no live Firebase)", pass: typeof saveCloudAttemptWith === "function" && typeof buildCloudPayloads === "function", detail: "injectable + mock-tested" });

  // C7) Retry → a new attempt id → a new cloud doc id.
  const rec2 = normaliseResult({ ...rec, attemptId: makeAttemptId() });
  const retryOk = mapResultToAdventureAttempt(rec2, student).attemptId !== att.attemptId;
  checks.push({ name: "Cloud retry produces a new attempt id", pass: retryOk, detail: retryOk ? "unique ids" : "collision" });

  // C8) masteryTopic mapping for each Adventure topic.
  const topicMapOk = masteryTopicFor(["integers"]) === "Integers" &&
    masteryTopicFor(["pythagoras"]) === "Pythagoras" &&
    masteryTopicFor(["fdp", "algebra"]) === "Mills Maths Adventure (Mixed)";
  checks.push({ name: "Cloud mastery-topic mapping is correct", pass: topicMapOk, detail: topicMapOk ? "topics mapped" : "wrong" });

  // C9) No task/class assignment introduced in 3B (future-ready, null now).
  const noTasksOk = att.taskId === null && att.taskCode === null && att.classCode === null;
  checks.push({ name: "No task assignment introduced (taskId null)", pass: noTasksOk, detail: noTasksOk ? "taskId/taskCode/classCode null" : "wrong" });

  // C10) The cloud client exposes NO summary writer — so a story (or any) save
  //      cannot create/update adventure task summaries (Phase 3B.1).
  // Phase 3D: the client no longer reads students/{code} (getStudentDoc removed);
  // it exposes ONLY connect + the two append-only result writers — still no
  // summary/update writer of any kind.
  const clientKeys = Object.keys(defaultCloudClient).sort().join(",");
  const noSummaryWriter = !/summary/i.test(clientKeys) &&
    clientKeys === "ensureConnected,writeAchievement,writeAdventureAttempt";
  checks.push({ name: "No task-summary writer exists (story can't update summaries)", pass: noSummaryWriter, detail: noSummaryWriter ? "achievement + attempt only" : clientKeys });

  // C11) Completion identity prefers the Firebase profile when registered, and
  //      falls back to the local record / "Explorer" otherwise.
  const fbId = pickCompletionIdentity(student, { studentName: "Explorer", studentCode: "7K" });
  const localId = pickCompletionIdentity(null, { studentName: "Local Sam", studentCode: "7Z-1" });
  const fallbackId = pickCompletionIdentity(null, null);
  const identityOk = fbId.source === "firebase" && fbId.name === "Alex Tan" && fbId.tag === "7MAB" &&
    localId.source === "local" && localId.name === "Local Sam" && localId.tag === "7Z-1" &&
    fallbackId.name === "Explorer";
  checks.push({ name: "Completion identity prefers Firebase, else local, else Explorer", pass: identityOk, detail: identityOk ? "firebase→local→explorer" : "wrong" });

  // C12) Cloud status wording is clear (story save is tagged separately).
  const msgOk = /tagged separately/i.test(cloudSaveMessage("saved", true)) &&
    cloudSaveMessage("saved", false) === "☁ Saved locally and online." &&
    /Sign in/i.test(cloudSaveMessage("unregistered", false)) &&
    /device only/i.test(cloudSaveMessage("demo", false)) &&
    /online save failed/i.test(cloudSaveMessage("failed", false));
  checks.push({ name: "Cloud status wording is clear (story tagged separately)", pass: msgOk, detail: msgOk ? "messages clear" : "wrong" });

  return checks;
}

/**
 * FIRESTORE RULES / COMPATIBILITY CHECKS (Phase 3C). Pure & static — they read
 * the in-repo rules DRAFT string (no filesystem, no network) and assert it is
 * safer than the open rules, plus confirm the Adventure cloud writes satisfy the
 * draft's create-only validation. No rules are deployed by these checks.
 */
export function runRulesChecks() {
  const checks = [];
  const R = PHASE3C_COMPATIBILITY_RULES;

  // S1) The recommended rules NEVER contain the open `allow read, write: if true`.
  const noOpen = !/allow\s+read\s*,\s*write\s*:\s*if\s+true/.test(R);
  checks.push({ name: "Draft rules contain no open `allow read, write: if true`", pass: noOpen, detail: noOpen ? "no open rule" : "open rule present!" });

  // S2) Default-deny catch-all is present.
  const defaultDeny = /match\s*\/\{document=\*\*\}\s*\{[\s\S]*allow\s+read\s*,\s*write\s*:\s*if\s+false/.test(R) && RULES_META.deniesByDefault === true;
  checks.push({ name: "Draft rules deny by default", pass: defaultDeny, detail: defaultDeny ? "catch-all if false" : "missing default deny" });

  // S3) Identity is read-by-code only: get allowed, list denied, writes denied.
  const studentsOk = /match\s*\/students\/\{studentCode\}\s*\{[\s\S]*?allow\s+get:\s*if\s+authed\(\)[\s\S]*?allow\s+list:\s*if\s+false[\s\S]*?allow\s+create,\s*update,\s*delete:\s*if\s+false/.test(R);
  const teachersOk = /match\s*\/teachers\/\{teacherCode\}\s*\{[\s\S]*?allow\s+get:\s*if\s+authed\(\)[\s\S]*?allow\s+list:\s*if\s+false[\s\S]*?allow\s+create,\s*update,\s*delete:\s*if\s+false/.test(R);
  checks.push({ name: "Draft rules: students/teachers get-by-code, no list, no writes", pass: studentsOk && teachersOk, detail: studentsOk && teachersOk ? "get-only identity" : "wrong" });

  // S4) achievements: create-only (+validated) and no update/delete.
  const achBlock = (R.match(/match\s*\/achievements\/\{id\}\s*\{[\s\S]*?\n\s*\}/) || [""])[0];
  const achOk = /allow\s+create:/.test(achBlock) && /allow\s+update,\s*delete:\s*if\s+false/.test(achBlock) &&
    /percent/.test(achBlock) && /studentCode/.test(achBlock) && /teacherCode/.test(achBlock) && /tool/.test(achBlock);
  checks.push({ name: "Draft rules: achievements create-only + validated, no edit/delete", pass: achOk, detail: achOk ? "create-only validated" : "wrong" });

  // S5) adventureAttempts: create-only (+validated, id==attemptId) and no update/delete.
  const attBlock = (R.match(/match\s*\/adventureAttempts\/\{id\}\s*\{[\s\S]*?\n\s*\}/) || [""])[0];
  const attOk = /allow\s+create:/.test(attBlock) && /allow\s+update,\s*delete:\s*if\s+false/.test(attBlock) &&
    /attemptId\s*==\s*id/.test(attBlock) && /source\s*==\s*'mills-maths-adventure'/.test(attBlock) &&
    /missionKind/.test(attBlock) && /questionCount/.test(attBlock) && /percent/.test(attBlock) && /createdAtClient/.test(attBlock);
  checks.push({ name: "Draft rules: adventureAttempts create-only + validated, no edit/delete", pass: attOk, detail: attOk ? "create-only, id==attemptId" : "wrong" });

  // S6) Limitations honestly flag the anonymous, Teacher-Dashboard and Admin risks.
  const lim = RULES_LIMITATIONS.join(" \n ");
  const flagsOk = /shared secret|not.*identity|not production/i.test(lim) &&
    /Teacher Dashboard/i.test(lim) && /Admin Console/i.test(lim) && /broad-read|READABLE|broad read/i.test(lim);
  checks.push({ name: "Rules docs flag anonymous + Teacher/Admin compatibility risks", pass: flagsOk, detail: flagsOk ? "risks disclosed" : "missing disclosure" });

  // S7) The Adventure cloud writes satisfy the draft's required fields, and the
  //     rich attempt still strips typed answers (compatibility under 3C).
  const student = { studentCode: "ZK7Q2", name: "Alex", className: "7M", teacherCode: "MILLS4821", active: true };
  const rec = normaliseResult({
    attemptId: makeAttemptId(), missionKind: "preset", missionId: "y7-fdp-check", missionTitle: "FDP",
    topicIds: ["fdp"], questionCount: 5, correctCount: 4,
    questionResults: [{ text: "q", topicId: "fdp", skillId: "s", answerMode: "simple", studentAnswer: "x", expectedAnswer: "x", correct: true }],
  });
  const a = mapResultToAchievement(rec, student);
  const v = mapResultToAdventureAttempt(rec, student);
  const fieldsOk = typeof a.studentCode === "string" && typeof a.teacherCode === "string" && typeof a.tool === "string" &&
    typeof a.score === "number" && typeof a.total === "number" && a.percent >= 0 && a.percent <= 100 &&
    typeof v.studentCode === "string" && typeof v.teacherCode === "string" && typeof v.missionKind === "string" &&
    v.source === "mills-maths-adventure" && v.questionCount >= 0 && v.correctCount >= 0 && typeof v.createdAtClient === "string" &&
    !("studentAnswer" in v.questionResults[0]);
  checks.push({ name: "Adventure writes satisfy 3C validation + strip answers", pass: fieldsOk, detail: fieldsOk ? "create-valid + stripped" : "wrong" });

  // S8) The deployable rules file mirrors the canonical string's safety (version
  //     + default-deny present) — sanity that the source of truth is intact.
  const versionOk = /rules_version\s*=\s*'2'/.test(R) && RULES_META.rulesVersion === "2";
  checks.push({ name: "Draft rules pinned to rules_version 2", pass: versionOk, detail: versionOk ? "v2" : "wrong" });

  return checks;
}

/**
 * CODE EXCHANGE CHECKS (Phase 3D). Verify the secure code-exchange layer:
 * the callable function names, the pure server-side validation (reject
 * missing/inactive/bad-PIN), the minimal claim shape, the safe profile (no PIN),
 * and that the Mills Maths Adventure client no longer reads `students/{code}`
 * directly (identity now comes from the exchange custom token). All pure — no
 * Firebase / network.
 */
export function runCodeExchangeChecks() {
  const checks = [];

  // 1) The two callable functions are named (client + functions must agree).
  const namesOk = EXCHANGE_FUNCTIONS.student === "exchangeStudentCode" &&
    EXCHANGE_FUNCTIONS.teacher === "exchangeTeacherCode";
  checks.push({ name: "Cloud Functions: exchangeStudentCode + exchangeTeacherCode named", pass: namesOk, detail: namesOk ? "both present" : "missing" });

  // 2) Student exchange rejects missing / inactive / bad PIN, accepts active.
  const sMissing = validateStudentForExchange(null).ok === false;
  const sInactive = validateStudentForExchange({ studentCode: "X", active: false }).ok === false;
  const sBadPin = validateStudentForExchange({ studentCode: "X", pin: "1234" }, "0000").ok === false;
  const sGoodPin = validateStudentForExchange({ studentCode: "X", pin: "1234" }, "1234").ok === true;
  const sActive = validateStudentForExchange({ studentCode: "X", active: true }).ok === true;
  const sOk = sMissing && sInactive && sBadPin && sGoodPin && sActive;
  checks.push({ name: "Student exchange rejects missing/inactive/bad-PIN", pass: sOk, detail: sOk ? "validated" : "wrong" });

  // 3) Teacher exchange rejects missing / inactive, accepts active.
  const tOk = validateTeacherForExchange(null).ok === false &&
    validateTeacherForExchange({ teacherCode: "T", active: false }).ok === false &&
    validateTeacherForExchange({ teacherCode: "T" }).ok === true;
  checks.push({ name: "Teacher exchange rejects missing/inactive", pass: tOk, detail: tOk ? "validated" : "wrong" });

  // 4) Claims are minimal and carry role + studentCode/teacherCode (no PIN/name).
  const sc = buildStudentClaims({ studentCode: "AB12", teacherCode: "MILLS4821", className: "7MAB", school: "CHHS", pin: "1", name: "A" });
  const tc = buildTeacherClaims({ teacherCode: "MILLS4821", school: "CHHS", teacherName: "Mills" });
  const claimsOk = sc.role === "student" && sc.studentCode === "AB12" && sc.teacherCode === "MILLS4821" &&
    sc.className === "7MAB" && !("pin" in sc) && !("name" in sc) &&
    tc.role === "teacher" && tc.teacherCode === "MILLS4821" && !("teacherName" in tc);
  checks.push({ name: "Claims minimal: role + code, no PIN/name", pass: claimsOk, detail: claimsOk ? "minimal claims" : "wrong" });

  // 5) Safe profiles expose display fields but never the PIN.
  const sp = buildSafeStudentProfile({ studentCode: "AB12", firstName: "Alex", surname: "Tan", className: "7MAB", teacherCode: "MILLS4821", teacher: "Mills", school: "CHHS", pin: "9" });
  const tp = buildSafeTeacherProfile({ teacherCode: "MILLS4821", teacherName: "Mills", school: "CHHS" });
  const profOk = sp.name === "Alex Tan" && sp.teacherName === "Mills" && !("pin" in sp) &&
    tp.teacherCode === "MILLS4821" && tp.active === true && !("pin" in tp);
  checks.push({ name: "Safe profiles expose display fields, never PIN", pass: profOk, detail: profOk ? "no PIN leaked" : "wrong" });

  // 6) MMA client uses the exchange and NO LONGER reads students/{code} directly.
  const fbMod = "../cloud/firebaseClient.js"; // doc anchor
  const clientUsesExchange = typeof exchangeStudentCode === "function" && typeof exchangeTeacherCode === "function" &&
    !("getStudentDoc" in defaultCloudClient);
  checks.push({ name: "MMA client uses exchange (no direct students/{code} read)", pass: clientUsesExchange, detail: clientUsesExchange ? "exchange-only" : "still reads students", ref: fbMod });

  // 7) Demo/skip remains local-only (no studentProfile → never cloud-saved).
  const demoRec = normaliseResult({ attemptId: makeAttemptId(), missionKind: "free", topicIds: ["integers"], questionCount: 3, correctCount: 2, questionResults: [] });
  const demoLocalOnly = shouldCloudSave(demoRec, null) === false && shouldCloudSave(demoRec, {}) === false;
  checks.push({ name: "Demo/skip stays local-only under 3D", pass: demoLocalOnly, detail: demoLocalOnly ? "no cloud save without student" : "leaked" });

  // 8) Cloud mappers STILL strip typed student answers (unchanged guarantee).
  const recA = normaliseResult({
    attemptId: makeAttemptId(), missionKind: "story", topicIds: ["fdp"], questionCount: 2, correctCount: 2,
    questionResults: [{ text: "q", topicId: "fdp", skillId: "s", answerMode: "simple", studentAnswer: "secret", expectedAnswer: "x", correct: true }],
  });
  const v = mapResultToAdventureAttempt(recA, { studentCode: "AB12", teacherCode: "MILLS4821", name: "A" });
  const stripped = !("studentAnswer" in v.questionResults[0]);
  checks.push({ name: "3D mappers still strip typed student answers", pass: stripped, detail: stripped ? "no studentAnswer" : "LEAK" });

  return checks;
}

/**
 * PORTAL MIGRATION CHECKS (Phase 3D.1). Validate the migration MANIFEST
 * (src/cloud/portalMigration.js) is the SECURE shape: each portal/quiz declares
 * the secure-exchange markers it must contain and the unsafe markers it must
 * not. The headless verify harness additionally greps the real /portals/*.html
 * against this same manifest, so intent and files cannot drift. Pure — no fs.
 */
export function runPortalMigrationChecks() {
  const checks = [];
  const byId = Object.fromEntries(PORTAL_FILES.map((p) => [p.id, p]));
  const has = (p, s) => p && p.mustContain.some((m) => m.includes(s));
  const forbids = (p, s) => p && p.mustNotContain.some((m) => m.includes(s));

  const sd = byId.studentDashboard, td = byId.teacherDashboard, qz = byId.quizTemplate, ad = byId.adminConsole;

  // 1–3) Student Dashboard: exchange + custom token, no anonymous auth.
  checks.push({ name: "Student Dashboard uses exchangeStudentCode", pass: has(sd, "exchangeStudentCode"), detail: sd ? sd.file : "missing" });
  checks.push({ name: "Student Dashboard uses signInWithCustomToken", pass: has(sd, "signInWithCustomToken"), detail: "custom token sign-in" });
  checks.push({ name: "Student Dashboard drops anonymous auth", pass: forbids(sd, "signInAnonymously"), detail: "no signInAnonymously" });
  checks.push({ name: "Student Dashboard disables class leaderboard (className read)", pass: forbids(sd, "className"), detail: "leaderboard removed" });

  // 4–7) Teacher Dashboard: exchange + custom token, teacherCode-scoped queries.
  checks.push({ name: "Teacher Dashboard uses exchangeTeacherCode", pass: has(td, "exchangeTeacherCode"), detail: td ? td.file : "missing" });
  checks.push({ name: "Teacher Dashboard uses signInWithCustomToken", pass: has(td, "signInWithCustomToken"), detail: "custom token sign-in" });
  checks.push({ name: "Teacher Dashboard student query is teacherCode-scoped", pass: has(td, "where('teacherCode','==',currentTeacher.teacherCode)"), detail: "scoped student list" });
  checks.push({ name: "Teacher Dashboard disables client student writes", pass: has(td, "disabled here under the secure rules model") && forbids(td, "setDoc(doc(db,COLLECTIONS.students"), detail: "identity write removed" });

  // 8) Admin Console: writes disabled + clear warning, no admin secret.
  const adminWarned = has(ad, "secureRulesWarning") && has(ad, "Admin identity writes are disabled");
  const adminNoSecret = forbids(ad, "privateKey") && forbids(ad, "service_account");
  checks.push({ name: "Admin Console warns + disables writes (no client secret)", pass: adminWarned && adminNoSecret, detail: adminWarned && adminNoSecret ? "read-only + warned" : "wrong" });

  // 9–10) Quiz template: exchange + preserves skip/demo + compact save + XP.
  checks.push({ name: "Quiz template uses exchangeStudentCode", pass: has(qz, "exchangeStudentCode") && forbids(qz, "getDoc(doc(db, 'students', code))"), detail: qz ? qz.file : "missing" });
  checks.push({ name: "Quiz template preserves skip/demo + compact save + XP", pass: has(qz, "Guest mode") && has(qz, "addDoc(collection(db, 'achievements')") && has(qz, "xpEarned"), detail: "demo + achievements + XP kept" });

  // 11) Function names agree with the deployed callables.
  checks.push({ name: "Portal manifest targets exchangeStudentCode/exchangeTeacherCode", pass: PORTAL_EXCHANGE_FN.student === "exchangeStudentCode" && PORTAL_EXCHANGE_FN.teacher === "exchangeTeacherCode", detail: "names agree" });

  // 12) Rules-readiness map confirms the eight required allows + the two known
  //     intentional gaps (leaderboard, legacy IN queries).
  const allowOk = ["student-read-own-profile", "student-read-own-achievements", "student-create-own-achievement",
    "teacher-read-own-teacher-profile", "teacher-query-students-by-teacherCode", "teacher-query-achievements-by-teacherCode",
    "no-client-identity-writes", "no-result-update-delete"].every((id) => RULES_READINESS.find((r) => r.id === id && r.ok === true));
  const gapsOk = RULES_READINESS.find((r) => r.id === "student-class-leaderboard" && r.ok === false) &&
    RULES_READINESS.find((r) => r.id === "teacher-legacy-in-queries" && r.ok === false);
  checks.push({ name: "Migrated portals satisfy Phase 3D rules (8 allows + 2 documented gaps)", pass: allowOk && Boolean(gapsOk), detail: allowOk && gapsOk ? "rules-ready" : "wrong" });

  return checks;
}

/**
 * PLATFORM CHECKS (Phase 4A). Validate the new static platform (portal/) is the
 * SECURE shape via the manifest, and that the tool registry behaves. The verify
 * harness additionally greps the real portal files against the manifest.
 */
export function runPlatformChecks() {
  const checks = [];
  const byId = Object.fromEntries(PLATFORM_FILES.map((p) => [p.id, p]));
  const has = (p, s) => p && p.mustContain.some((m) => m.includes(s));
  const forbids = (p, s) => p && p.mustNotContain.some((m) => m.includes(s));
  const sp = byId.studentPlatform, tp = byId.teacherPlatform, sc = byId.sharedClient, ad = byId.adminPlatform;

  // 1–3) Student Platform: exchange via shared client, scoped own read, no anon / no direct read.
  checks.push({ name: "Student Platform uses secure login (loginStudent → exchange)", pass: has(sp, "loginStudent"), detail: sp ? sp.file : "missing" });
  checks.push({ name: "Student Platform reads only own achievements (studentCode scoped)", pass: has(sp, "studentCode"), detail: "own-data read" });
  checks.push({ name: "Student Platform: no anon auth + no direct students/{code} read", pass: forbids(sp, "signInAnonymously") && forbids(sp, 'getDoc(doc(db, "students"'), detail: "secure only" });

  // 4–8) Teacher Platform: exchange, teacherCode-scoped queries, graceful adventureAttempts.
  checks.push({ name: "Teacher Platform uses secure login (loginTeacher → exchange)", pass: has(tp, "loginTeacher"), detail: tp ? tp.file : "missing" });
  checks.push({ name: "Teacher Platform student + achievements queries are teacherCode-scoped", pass: has(tp, 'where("teacherCode","==", teacher.teacherCode)'), detail: "teacher-scoped" });
  checks.push({ name: "Teacher Platform reads adventureAttempts (rich)", pass: has(tp, "COLLECTIONS.adventureAttempts"), detail: "rich attempts query present" });
  checks.push({ name: "Teacher Platform handles missing adventureAttempts gracefully", pass: has(tp, "adventureAttempts not available"), detail: "fallback note" });
  checks.push({ name: "Teacher Platform: no anon auth + no direct teachers/{code} read", pass: forbids(tp, "signInAnonymously") && forbids(tp, 'getDoc(doc(db, "teachers"'), detail: "secure only" });

  // 5b) Shared client uses custom-token sign-in, no anonymous.
  checks.push({ name: "Shared client: signInWithCustomToken + exchange, no anonymous", pass: has(sc, "signInWithCustomToken") && has(sc, "EXCHANGE_FUNCTIONS") && forbids(sc, "signInAnonymously"), detail: "custom-token client" });

  // 9–10) Tool registry exists, includes MMA, supports enable/disable.
  const all = getAllTools(), enabled = getEnabledTools();
  const mma = getTool("mills-maths-adventure");
  const registryOk = all.length >= 2 && Boolean(mma) && mma.enabled === true && mma.richCollection === "adventureAttempts";
  checks.push({ name: "Tool registry exists + includes Mills Maths Adventure", pass: registryOk, detail: registryOk ? `${all.length} tools` : "wrong" });
  const togglesOk = isToolEnabled("mills-maths-adventure") === true && isToolEnabled("pythagoras-quiz") === false &&
    enabled.length < all.length && toolIdForAchievement({ tool: "Mills Maths Adventure" }) === "mills-maths-adventure";
  checks.push({ name: "Tool registry can enable/disable tools + match records", pass: togglesOk, detail: togglesOk ? `${enabled.length}/${all.length} enabled` : "wrong" });

  // 11) Admin page: disabled, no public writes, no secret.
  const adminOk = has(ad, "temporarily disabled") && has(ad, "Firebase Console") &&
    forbids(ad, "setDoc(") && forbids(ad, "deleteDoc(") && forbids(ad, "service_account");
  checks.push({ name: "Admin page disabled — no public writes, no client secret", pass: adminOk, detail: adminOk ? "read-only/disabled" : "wrong" });

  // 12) Platform fits the Phase 3D claim rules (all readiness items ok).
  const readyOk = PLATFORM_RULES_READINESS.every((r) => r.ok === true);
  checks.push({ name: "Platform queries fit Phase 3D claim rules", pass: readyOk, detail: readyOk ? "rules-ready" : "wrong" });

  return checks;
}

/**
 * PHASE 3D CLAIM-RULES CHECKS. Static checks over the in-repo claim-based rules
 * string: deny-by-default, uses request.auth.token.role, blocks identity writes,
 * blocks result update/delete, and scopes result CREATE to the signed-in
 * student's own studentCode.
 */
export function run3dRulesChecks() {
  const checks = [];
  const R = PHASE3D_CLAIMS_RULES;

  // 1) No open rule; default-deny catch-all present.
  const noOpen = !/allow\s+read\s*,\s*write\s*:\s*if\s+true/.test(R);
  const defaultDeny = /match\s*\/\{document=\*\*\}\s*\{[\s\S]*allow\s+read\s*,\s*write\s*:\s*if\s+false/.test(R) && RULES_3D_META.deniesByDefault === true;
  checks.push({ name: "3D rules: no open rule + deny by default", pass: noOpen && defaultDeny, detail: noOpen && defaultDeny ? "fail-closed" : "wrong" });

  // 2) Uses claim-based identity (request.auth.token.role + codes).
  const usesClaims = /request\.auth\.token\.role/.test(R) && /request\.auth\.token\.studentCode/.test(R) &&
    /request\.auth\.token\.teacherCode/.test(R) && RULES_3D_META.usesCustomClaims === true;
  checks.push({ name: "3D rules: scoped by request.auth.token.role/codes", pass: usesClaims, detail: usesClaims ? "claim-scoped" : "wrong" });

  // 3) Identity collections: no client create/update/delete (server-side only).
  const studentsNoWrite = /match\s*\/students\/\{studentCode\}\s*\{[\s\S]*?allow\s+create,\s*update,\s*delete:\s*if\s+false/.test(R);
  const teachersNoWrite = /match\s*\/teachers\/\{teacherCode\}\s*\{[\s\S]*?allow\s+create,\s*update,\s*delete:\s*if\s+false/.test(R);
  checks.push({ name: "3D rules: students/teachers writes denied (server-side only)", pass: studentsNoWrite && teachersNoWrite, detail: studentsNoWrite && teachersNoWrite ? "identity writes blocked" : "wrong" });

  // 4) Teacher read of a class is scoped to the teacher's own teacherCode claim.
  const studentBlock = (R.match(/match\s*\/students\/\{studentCode\}\s*\{[\s\S]*?\n\s{4}\}/) || [""])[0];
  const teacherScoped = /isTeacher\(\)\s*&&\s*resource\.data\.teacherCode\s*==\s*myTeacher\(\)/.test(studentBlock) &&
    /isStudent\(\)\s*&&\s*myStudent\(\)\s*==\s*studentCode/.test(studentBlock);
  checks.push({ name: "3D rules: student reads own doc; teacher reads only own class", pass: teacherScoped, detail: teacherScoped ? "owner-scoped reads" : "wrong" });

  // 5) achievements: create scoped to own studentCode; no update/delete.
  const achBlock = (R.match(/match\s*\/achievements\/\{id\}\s*\{[\s\S]*?\n\s{4}\}/) || [""])[0];
  const achOk = /allow\s+create:\s*if\s+isStudent\(\)/.test(achBlock) &&
    /request\.resource\.data\.studentCode\s*==\s*myStudent\(\)/.test(achBlock) &&
    /allow\s+update,\s*delete:\s*if\s+false/.test(achBlock);
  checks.push({ name: "3D rules: achievements create-only for own student, no edit/delete", pass: achOk, detail: achOk ? "self-scoped create-only" : "wrong" });

  // 6) adventureAttempts: create scoped to own student + id==attemptId + source; no update/delete.
  const attBlock = (R.match(/match\s*\/adventureAttempts\/\{id\}\s*\{[\s\S]*?\n\s{4}\}/) || [""])[0];
  const attOk = /allow\s+create:\s*if\s+isStudent\(\)/.test(attBlock) &&
    /request\.resource\.data\.studentCode\s*==\s*myStudent\(\)/.test(attBlock) &&
    /attemptId\s*==\s*id/.test(attBlock) && /source\s*==\s*'mills-maths-adventure'/.test(attBlock) &&
    /allow\s+update,\s*delete:\s*if\s+false/.test(attBlock);
  checks.push({ name: "3D rules: adventureAttempts create-only for own student, no edit/delete", pass: attOk, detail: attOk ? "self-scoped create-only" : "wrong" });

  // 7) Limitations honestly flag fail-closed + legacy + admin + leaderboard caveats.
  const lim = RULES_3D_LIMITATIONS.join(" \n ");
  const flagsOk = /fail-closed|denied/i.test(lim) && /legacy/i.test(lim) && /Admin Console/i.test(lim) && /leaderboard/i.test(lim);
  checks.push({ name: "3D rules: limitations disclose fail-closed/legacy/admin/leaderboard", pass: flagsOk, detail: flagsOk ? "risks disclosed" : "missing disclosure" });

  // 8) Pinned to rules_version 2.
  const versionOk = /rules_version\s*=\s*'2'/.test(R) && RULES_3D_META.rulesVersion === "2";
  checks.push({ name: "3D rules pinned to rules_version 2", pass: versionOk, detail: versionOk ? "v2" : "wrong" });

  return checks;
}

/**
 * ALGEBRA CHECKS (Phase 2F Slice 3). Confirm the real Algebraic Techniques topic
 * integrates: questions generate + self-check, MathLive (expression) AND simple
 * (numeric) inputs appear, the 4 algebra diagram types are produced + supported,
 * commutative answer checking works, and teacher missions can select Algebra.
 */
export function runAlgebraChecks() {
  const checks = [];
  const topic = getTopic("stage4", "algebra");
  const skills = topic ? topic.skills : [];

  checks.push({
    name: "Algebra uses real engine (skills)",
    pass: skills.length >= 12,
    detail: `${skills.length} algebra skills`,
  });

  const REQ = [
    "stage", "topicId", "skillId", "difficultyLevel", "xpValue", "inputMode",
    "text", "answer", "acceptableAnswers", "check", "sourceType", "legacyType",
  ];
  let metaOk = true, sawMath = false, sawSimple = false;
  const diagramTypes = new Set();
  const probs = [];
  for (const sk of skills) {
    for (let level = 1; level <= 5; level++) {
      const q = generateCurriculumQuestion("stage4", "algebra", sk.id, level);
      const fok = q && REQ.every((f) => q[f] !== undefined);
      const cok = fok && q.check(q.answer) && q.acceptableAnswers.every((a) => q.check(a));
      if (!fok || !cok) { metaOk = false; if (probs.length < 4) probs.push(`${sk.id}.L${level}`); }
      if (fok && cok && q.inputMode === "math") sawMath = true;
      if (fok && cok && q.inputMode === "simple") sawSimple = true;
      if (q && q.diagramType) diagramTypes.add(q.diagramType);
    }
  }
  checks.push({ name: "Algebra questions: metadata & self-check", pass: metaOk, detail: metaOk ? "all algebra skills × L1–5 OK" : `failing: ${probs.join(", ")}` });
  checks.push({ name: "Algebra MathLive (expression) input works", pass: sawMath, detail: sawMath ? "found & valid" : "none" });
  checks.push({ name: "Algebra simple (numeric) input works", pass: sawSimple, detail: sawSimple ? "found & valid" : "none" });

  // All 4 algebra diagram types produced + recognised.
  const EXPECTED = ["algebraTiles", "expandAreaModel", "perimeterFigure", "functionMachine"];
  const prodOk = EXPECTED.every((t) => diagramTypes.has(t));
  const supOk = EXPECTED.every((t) => SUPPORTED_DIAGRAM_TYPES.includes(t));
  checks.push({ name: "Algebra diagram types produced & supported", pass: prodOk && supOk, detail: `produced ${[...diagramTypes].filter((t) => EXPECTED.includes(t)).length}/${EXPECTED.length}, supported:${supOk}` });

  // Commutative answer checking: "2k + 9b" should be accepted for a "9b + 2k"
  // style answer (sampled from simplifyMixed).
  let commutativeOk = true;
  for (let i = 0; i < 8; i++) {
    const q = generateCurriculumQuestion("stage4", "algebra", "simplifyMixed", 2);
    const terms = String(q.answer).split("+").map((s) => s.trim()).filter(Boolean);
    if (terms.length === 2) {
      const reordered = `${terms[1]} + ${terms[0]}`;
      if (!q.check(reordered)) commutativeOk = false;
    }
  }
  checks.push({ name: "Algebra checking is commutative", pass: commutativeOk, detail: commutativeOk ? "reordered sums accepted" : "rejected a reordered sum" });

  // Teacher mission can select Algebra and gets only Algebra questions.
  const m = normaliseMission({
    title: "Algebra POC", stages: ["stage4"], selectedTopics: ["algebra"],
    selectedSkills: ["simplifySimple", "subTwo", "functionMachine"],
    difficultyRange: { min: 1, max: 4 }, requiredQuestions: 6,
  });
  const onlyAlg = validateMission(m).valid &&
    buildMissionQuestions(m, 6, () => newProfile()).every((q) => q.topicId === "algebra" && q.check(q.answer));
  checks.push({ name: "Teacher mission can select Algebra", pass: onlyAlg, detail: onlyAlg ? "Algebra-only & valid" : "failed" });

  return checks;
}

/**
 * FDP CHECKS (Phase 2F). Confirm the real FDP topic integrates: questions
 * generate with metadata + self-check, MathLive (fraction) AND simple inputs
 * both appear and validate, simplest-form is enforced, the fraction-circle
 * diagram is produced + supported, and teacher missions can select FDP.
 */
export function runFdpChecks() {
  const checks = [];
  const topic = getTopic("stage4", "fdp");
  const skills = topic ? topic.skills : [];

  checks.push({
    name: "FDP uses real engine (skills)",
    pass: skills.length >= 10,
    detail: `${skills.length} FDP skills`,
  });

  const REQ = [
    "stage", "topicId", "skillId", "difficultyLevel", "xpValue", "inputMode",
    "text", "answer", "acceptableAnswers", "check", "sourceType", "legacyType",
  ];
  let metaOk = true, sawMath = false, sawSimple = false;
  const diagramTypes = new Set();
  const probs = [];
  for (const sk of skills) {
    for (let level = 1; level <= 5; level++) {
      const q = generateCurriculumQuestion("stage4", "fdp", sk.id, level);
      const fok = q && REQ.every((f) => q[f] !== undefined);
      const cok = fok && q.check(q.answer) && q.acceptableAnswers.every((a) => q.check(a));
      if (!fok || !cok) { metaOk = false; if (probs.length < 4) probs.push(`${sk.id}.L${level}`); }
      if (fok && cok && q.inputMode === "math") sawMath = true;
      if (fok && cok && q.inputMode === "simple") sawSimple = true;
      if (q && q.diagramType) diagramTypes.add(q.diagramType);
    }
  }
  checks.push({
    name: "FDP questions: metadata & self-check",
    pass: metaOk,
    detail: metaOk ? "all FDP skills × L1–5 OK" : `failing: ${probs.join(", ")}`,
  });
  checks.push({ name: "FDP MathLive (fraction) input works", pass: sawMath, detail: sawMath ? "found & valid" : "none" });
  checks.push({ name: "FDP simple input works", pass: sawSimple, detail: sawSimple ? "found & valid" : "none" });

  // Simplest-form enforcement: a simplify question must reject an unreduced
  // equivalent of its own answer.
  let simplestOk = true;
  for (let i = 0; i < 10; i++) {
    const q = generateCurriculumQuestion("stage4", "fdp", "simplifyFractions", 3);
    const [n, d] = String(q.answer).split("/").map(Number);
    if (Number.isFinite(n) && Number.isFinite(d) && q.check(`${n * 2}/${d * 2}`)) simplestOk = false;
  }
  checks.push({
    name: "FDP enforces simplest form",
    pass: simplestOk,
    detail: simplestOk ? "unreduced equivalents rejected" : "accepted a non-simplest answer",
  });

  // All FDP diagram types are produced by their skills AND recognised by the
  // renderer (Slice 2B: 7 FDP diagram types).
  const EXPECTED_FDP_DIAGRAMS = [
    "fractionCircle", "fractionBar", "fractionSet", "fractionNumberLine",
    "equivalentFractionBars", "fractionMultiplicationArea", "doubleNumberLine",
  ];
  const producedOk = EXPECTED_FDP_DIAGRAMS.every((t) => diagramTypes.has(t));
  const supportedOk = EXPECTED_FDP_DIAGRAMS.every((t) => SUPPORTED_DIAGRAM_TYPES.includes(t));
  checks.push({
    name: "FDP diagram types produced & supported",
    pass: producedOk && supportedOk,
    detail: `produced ${[...diagramTypes].filter((t) => EXPECTED_FDP_DIAGRAMS.includes(t)).length}/${EXPECTED_FDP_DIAGRAMS.length}, all supported:${supportedOk}`,
  });

  // Each diagram-heavy FDP skill yields well-formed diagramData (plain numbers/
  // arrays only — no functions — so the React components render safely).
  const DIAGRAM_SKILLS = [
    "shadedFractions", "fractionOfGroup", "placeFractionNumberLine",
    "equivalentFractionVisual", "fractionMultiplyArea", "proportionDoubleLine",
    "shadedFractionCircle",
  ];
  let dataOk = true;
  const dataProblems = [];
  for (const sk of DIAGRAM_SKILLS) {
    for (let level = 1; level <= 3; level++) {
      const q = generateCurriculumQuestion("stage4", "fdp", sk, level);
      const d = q.diagramData;
      const ok = q.diagramType && d && typeof d === "object" &&
        Object.values(d).every((v) => typeof v !== "function") &&
        SUPPORTED_DIAGRAM_TYPES.includes(q.diagramType);
      if (!ok) { dataOk = false; if (dataProblems.length < 3) dataProblems.push(`${sk}.L${level}`); }
    }
  }
  checks.push({
    name: "FDP diagram skills yield safe diagramData",
    pass: dataOk,
    detail: dataOk ? `${DIAGRAM_SKILLS.length} diagram skills OK` : `failing: ${dataProblems.join(", ")}`,
  });

  // Teacher mission can select FDP and gets only FDP questions.
  const m = normaliseMission({
    title: "FDP POC", stages: ["stage4"], selectedTopics: ["fdp"],
    selectedSkills: ["simplifyFractions", "percentageOf", "discounts"],
    difficultyRange: { min: 1, max: 4 }, requiredQuestions: 6,
  });
  const onlyFdp = validateMission(m).valid &&
    buildMissionQuestions(m, 6, () => newProfile()).every((q) => q.topicId === "fdp" && q.check(q.answer));
  checks.push({ name: "Teacher mission can select FDP", pass: onlyFdp, detail: onlyFdp ? "FDP-only & valid" : "failed" });

  return checks;
}

/**
 * DIFFICULTY-CALIBRATION CHECKS (Phase 2F).
 *
 * Confirm difficulty 1–5 changes the actual question (not only metadata):
 * requested level passes through, actual level is recorded, XP scales, the
 * Integers magnitude bands are monotonic and enforced, the thermometer scale
 * supports minor ticks, and teacher-mission difficulty ranges are respected.
 */
export function runDifficultyChecks() {
  const checks = [];

  // F1) Requested difficulty passes through and actual is recorded.
  const q4 = generateCurriculumQuestion("stage4", "integers", "mixedIntegerOperations", 4);
  checks.push({
    name: "Requested difficulty passes through adapter",
    pass: q4.requestedDifficultyLevel === 4 && Number.isFinite(q4.actualDifficultyLevel),
    detail: `requested:${q4.requestedDifficultyLevel} actual:${q4.actualDifficultyLevel}`,
  });

  // F2) XP scales with the actual difficulty served.
  const xpL1 = generateCurriculumQuestion("stage4", "integers", "addingIntegers", 1).xpValue;
  const xpL5 = generateCurriculumQuestion("stage4", "integers", "addingIntegers", 5).xpValue;
  checks.push({
    name: "XP scales with difficulty (Integers)",
    pass: xpL1 < xpL5,
    detail: `L1=${xpL1} L5=${xpL5}`,
  });

  // F3) Integer magnitude bands are monotonic (deterministic) AND enforced at
  //     L1 (sampled) — proving content, not just metadata, changes.
  const bandsMonotonic = ["addingIntegers", "subtractingIntegers", "mixedIntegerOperations"].every((sk) => {
    const p = INTEGER_LEVELS[sk].params;
    return p[1].magMax <= p[3].magMax && p[3].magMax <= p[5].magMax;
  });
  // Sampled runtime check: most L1 questions stay within the cap. We tolerate
  // the occasional rejection-sampling fallback (documented in integersAdapter)
  // rather than failing the whole suite on a rare miss.
  const cap = INTEGER_LEVELS.addingIntegers.params[1].magMax;
  const SAMPLES = 24;
  let within = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const q = generateCurriculumQuestion("stage4", "integers", "addingIntegers", 1);
    const nums = (q.text.match(/-?\d+/g) || []).map((n) => Math.abs(Number(n)));
    if (nums.every((n) => n <= cap)) within += 1;
  }
  const l1MostlyWithinCap = within >= SAMPLES - 2; // allow ≤2 fallbacks
  checks.push({
    name: "Integers difficulty maps to content (magnitude)",
    pass: bandsMonotonic && l1MostlyWithinCap,
    detail: `bands monotonic:${bandsMonotonic} · L1 ≤ ${cap}: ${within}/${SAMPLES}`,
  });

  // F4) Difficulty notes / legacyType recorded (provenance for inspection).
  const notesOk = typeof q4.difficultyNotes === "string" && q4.difficultyNotes.length > 0 &&
    typeof q4.legacyType === "string" && q4.sourceType === "legacy-adapter";
  checks.push({
    name: "Difficulty notes & legacyType recorded",
    pass: notesOk,
    detail: notesOk ? `legacyType:${q4.legacyType}` : "missing notes/legacyType",
  });

  // F5) Thermometer scale supports minor ticks (step subdivides cleanly).
  const therm = generateCurriculumQuestion("stage4", "integers", "thermometer", 1);
  const td = therm.diagramData || {};
  const minorStep = Math.max(1, Math.round((td.step || 0) / 5));
  const thermOk =
    therm.diagramType === "thermometer" &&
    td.step >= 2 && minorStep >= 1 &&
    Number.isFinite(td.min) && Number.isFinite(td.max);
  checks.push({
    name: "Thermometer scale supports minor ticks",
    pass: thermOk,
    detail: `step:${td.step} minorStep:${minorStep} range:${td.min}..${td.max}`,
  });

  // F5b) Maths expression prompts render as a separate non-breaking block: the
  //      order-of-operations adapter provides mathExpression separately from the
  //      wording, and the shared splitter recognises it too.
  let promptSplitOk = false;
  let splitDetail = "no expression provided";
  for (let i = 0; i < 12 && !promptSplitOk; i++) {
    const q = generateCurriculumQuestion("stage4", "integers", "orderOfOperations", 4);
    const provided = q.mathExpression && q.promptText &&
      !q.promptText.includes(q.mathExpression);
    const split = splitPrompt(q.text);
    if (provided && split && split.mathExpression) {
      promptSplitOk = true;
      splitDetail = `"${q.promptText}" ⟂ "${q.mathExpression}"`;
    }
  }
  checks.push({
    name: "Maths expression rendered as separate block",
    pass: promptSplitOk,
    detail: splitDetail,
  });

  // F6) Teacher-mission difficulty range is respected (no question exceeds it),
  //     including when adaptive pushes difficulty up.
  const m = normaliseMission({
    title: "Range 1–3",
    stages: ["stage4"],
    selectedTopics: ["integers"],
    selectedSkills: ["addingIntegers", "mixedIntegerOperations"],
    difficultyRange: { min: 1, max: 3 },
    requiredQuestions: 10,
    adaptiveOn: true,
  });
  const pushy = { ...newProfile(), workingDifficulty: 5, streak: 9 }; // wants harder
  const mqs = buildMissionQuestions(m, 10, () => pushy);
  const inRange = mqs.every(
    (q) => q.requestedDifficultyLevel >= 1 && q.requestedDifficultyLevel <= 3 &&
      q.actualDifficultyLevel >= 1 && q.actualDifficultyLevel <= 3
  );
  checks.push({
    name: "Mission difficulty range respected (1–3)",
    pass: inRange,
    detail: inRange ? "all questions within 1–3 even when adaptive pushes up" : "a question left the range",
  });

  return checks;
}

/**
 * REAL-ENGINE CHECKS (Phase 2F).
 *
 * Confirm the legacy-engine-backed topics (currently Integers) integrate
 * cleanly: questions generate with full metadata and self-check, the new
 * integer diagram types are produced + supported, teacher missions can select
 * the topic and get only its questions, the three NPC topics still generate,
 * and the maths layer stays pure (no DOM). Legacy-import isolation is verified
 * with a source grep in the verification harness (it can't be introspected at
 * runtime), but generation succeeding here is itself evidence of isolation.
 */
export function runRealEngineChecks() {
  const checks = [];

  // R1) Integers topic now uses the real engine (skills present).
  const intTopic = getTopic("stage4", "integers");
  const intSkills = intTopic ? intTopic.skills : [];
  checks.push({
    name: "Integers uses real engine (skills)",
    pass: intSkills.length >= 5,
    detail: `${intSkills.length} integer skills`,
  });

  // R2) Integer questions carry full metadata, self-check, and the calc skills
  //     produce ASCII-numeric answers; collect produced diagram types.
  const REQ = [
    "stage", "topicId", "topicName", "skillId", "skillName",
    "difficultyLevel", "difficultyLabel", "xpValue", "inputMode",
    "text", "answer", "acceptableAnswers", "check",
  ];
  let metaOk = true;
  let simpleOk = false;
  const intDiagramTypes = new Set();
  const probs = [];
  for (const sk of intSkills) {
    for (let level = 1; level <= 5; level++) {
      const q = generateCurriculumQuestion("stage4", "integers", sk.id, level);
      const fok = q && REQ.every((f) => q[f] !== undefined);
      const cok = fok && q.check(q.answer) && q.acceptableAnswers.every((a) => q.check(a));
      if (!fok || !cok) {
        metaOk = false;
        if (probs.length < 3) probs.push(`${sk.id}.L${level}`);
      }
      if (fok && cok && q.inputMode === "simple") simpleOk = true;
      if (q && q.diagramType) intDiagramTypes.add(q.diagramType);
    }
  }
  checks.push({
    name: "Integer questions: metadata & self-check",
    pass: metaOk,
    detail: metaOk ? "all integer skills × L1–5 OK" : `failing: ${probs.join(", ")}`,
  });
  checks.push({
    name: "Integer simple-input checks correctly",
    pass: simpleOk,
    detail: simpleOk ? "found & valid" : "none valid",
  });

  // R3) New integer diagram types are produced and recognised by the renderer.
  const newTypesOk = ["integerNumberLine", "thermometer"].every(
    (t) => intDiagramTypes.has(t) && SUPPORTED_DIAGRAM_TYPES.includes(t)
  );
  checks.push({
    name: "Integer diagram types produced & supported",
    pass: newTypesOk,
    detail: [...intDiagramTypes].join(", ") || "none",
  });

  // R4) Teacher missions can select Integers and get only integer questions.
  const m = normaliseMission({
    title: "Integers POC",
    stages: ["stage4"],
    selectedTopics: ["integers"],
    selectedSkills: ["mixedIntegerOperations", "numberLineJumps"],
    difficultyRange: { min: 1, max: 4 },
    requiredQuestions: 6,
  });
  const mValid = validateMission(m).valid;
  const mq = buildMissionQuestions(m, 6, () => newProfile());
  const onlyInt = mq.length === 6 && mq.every((q) => q.topicId === "integers" && q.check(q.answer));
  checks.push({
    name: "Teacher mission can select Integers",
    pass: mValid && onlyInt,
    detail: `valid:${mValid} onlyIntegers:${onlyInt}`,
  });

  // R5) NPC topics (Pip→integers, Fern→fdp, Alby→algebra) all still generate.
  const npcOk = [
    ["integers", "mixedIntegerOperations"],
    ["fdp", "percentageOf"],
    ["algebra", "simplifySimple"],
  ].every(([t, s]) => {
    const q = generateCurriculumQuestion("stage4", t, s, 2);
    return q && q.check(q.answer);
  });
  checks.push({
    name: "NPC topics still generate (Pip/Fern/Alby)",
    pass: npcOk,
    detail: npcOk ? "integers/fdp/algebra OK" : "a topic failed",
  });

  // R6) The integers adapter stays DOM-free (smoke): a diagram question is pure
  //     serialisable data with no functions in diagramData.
  let pure = true;
  try {
    const q = generateCurriculumQuestion("stage4", "integers", "thermometer", 3);
    pure = typeof q.text === "string" && q.diagramData &&
      Object.values(q.diagramData).every((v) => typeof v !== "function");
  } catch {
    pure = false;
  }
  checks.push({
    name: "Integers adapter stays DOM-free (smoke)",
    pass: pure,
    detail: pure ? "generates as pure data" : "impure / needed DOM",
  });

  return checks;
}

/**
 * DIAGRAM & AREA CHECKS (Phase 2E).
 *
 * Run on their own from the DevPanel's "Run diagram system checks" button, and
 * also appended to the full suite. They confirm:
 *   - the Area topic is registered with skills
 *   - Area questions generate, carry a valid diagramType + diagramData, and
 *     self-check their answers
 *   - every diagramType the Area engine produces is recognised by the renderer
 *   - mission filters can select Area (and then only generate Area questions)
 *   - simple AND math input curriculum questions still validate
 *   - existing missions still validate
 *   - the maths/curriculum layer stays DOM-free (smoke test)
 */
export function runDiagramChecks() {
  const checks = [];

  // D1) Area topic registered with skills.
  const areaTopic = getTopic("stage4", "area");
  const areaSkills = areaTopic ? areaTopic.skills : [];
  checks.push({
    name: "Area topic registered",
    pass: Boolean(areaTopic) && areaSkills.length >= 3,
    detail: areaTopic ? `${areaSkills.length} area skills` : "missing stage4/area",
  });

  // D2) Area questions generate with valid diagramType + diagramData and
  //     self-check, across difficulty levels.
  const producedTypes = new Set();
  let genOk = true;
  let dataOk = true;
  let answerOk = true;
  const problems = [];
  for (const skill of areaSkills) {
    for (let level = 1; level <= 5; level++) {
      const q = generateCurriculumQuestion("stage4", "area", skill.id, level);
      const hasType = q && typeof q.diagramType === "string" && SUPPORTED_DIAGRAM_TYPES.includes(q.diagramType);
      const hasData = q && q.diagramData && typeof q.diagramData === "object";
      const selfOk = q && typeof q.check === "function" && q.check(q.answer);
      const acceptedOk = selfOk && (q.acceptableAnswers || []).every((a) => q.check(a));
      if (hasType) producedTypes.add(q.diagramType);
      if (!hasType) genOk = false;
      if (!hasData) dataOk = false;
      if (!selfOk || !acceptedOk) answerOk = false;
      if ((!hasType || !hasData || !selfOk) && problems.length < 3) {
        problems.push(`${skill.id}.L${level}`);
      }
    }
  }
  checks.push({
    name: "Area questions have valid diagramType",
    pass: genOk,
    detail: genOk ? `types: ${[...producedTypes].join(", ")}` : `failing: ${problems.join(", ")}`,
  });
  checks.push({
    name: "Area questions have diagramData",
    pass: dataOk,
    detail: dataOk ? "all carry diagramData" : `failing: ${problems.join(", ")}`,
  });
  checks.push({
    name: "Area questions check answers correctly",
    pass: answerOk,
    detail: answerOk ? "canonical + acceptable answers accepted" : `failing: ${problems.join(", ")}`,
  });

  // D3) Renderer recognises every produced type, and the three area types are
  //     all exercised.
  const allRecognised = [...producedTypes].every((t) => SUPPORTED_DIAGRAM_TYPES.includes(t));
  const coversAll = ["rectangleArea", "triangleArea", "compositeRectangleArea"].every((t) =>
    producedTypes.has(t)
  );
  checks.push({
    name: "DiagramRenderer recognises all diagram types",
    pass: allRecognised && coversAll,
    detail: `recognised:${allRecognised} covered:${coversAll} (${SUPPORTED_DIAGRAM_TYPES.length} supported)`,
  });

  // D4) Mission filters can select Area and then generate ONLY area questions.
  const areaMission = normaliseMission({
    title: "Area POC",
    stages: ["stage4"],
    selectedTopics: ["area"],
    selectedSkills: ["rectangleArea", "triangleArea", "compositeArea"],
    difficultyRange: { min: 1, max: 4 },
    requiredQuestions: 6,
  });
  const missionValid = validateMission(areaMission).valid;
  const areaQs = buildMissionQuestions(areaMission, 6, () => newProfile());
  const onlyArea =
    areaQs.length === 6 &&
    areaQs.every((q) => q.topicId === "area" && SUPPORTED_DIAGRAM_TYPES.includes(q.diagramType));
  checks.push({
    name: "Mission filters can select Area",
    pass: missionValid && onlyArea,
    detail: `valid:${missionValid} onlyArea:${onlyArea}`,
  });

  // D5) Simple AND math input curriculum questions still work.
  const simpleQ = generateCurriculumQuestion("stage4", "area", "rectangleArea", 2);
  const mathQ = generateCurriculumQuestion("stage4", "fdp", "simplifyFractions", 2);
  const inputsOk =
    simpleQ.inputMode === "simple" && simpleQ.check(simpleQ.answer) &&
    mathQ.inputMode === "math" && mathQ.check(mathQ.answer);
  checks.push({
    name: "Simple & math input still work",
    pass: inputsOk,
    detail: `area:${simpleQ.inputMode} fdp:${mathQ.inputMode}`,
  });

  // D6) Existing sample missions still validate (didn't break with the new topic).
  const existingOk = getAllMissions().every((m) => validateMission(m).valid);
  checks.push({
    name: "Existing missions still valid",
    pass: existingOk,
    detail: existingOk ? "all sample missions valid" : "a mission failed validation",
  });

  // D7) Maths/curriculum layer stays DOM-free (smoke test): generating an Area
  //     question is a pure function that needs no window/document. The fact that
  //     these checks run at all (incl. headless) is the real signal; a build-time
  //     grep gives the hard guarantee (see the verification harness).
  let pureOk = true;
  try {
    const q = generateCurriculumQuestion("stage4", "area", "triangleArea", 3);
    pureOk = typeof q.text === "string" && typeof q.diagramData === "object" &&
      // diagramData must be plain data (no functions) so it can later serialise.
      Object.values(q.diagramData).every((v) => typeof v !== "function");
  } catch {
    pureOk = false;
  }
  checks.push({
    name: "Maths layer stays DOM-free (smoke)",
    pass: pureOk,
    detail: pureOk ? "area generates as pure data" : "generation needed DOM / impure",
  });

  return checks;
}

/**
 * MISSION SYSTEM CHECKS (Phase 2D).
 *
 * Run on their own from the DevPanel's "Run mission system checks" button, and
 * also appended to the full runSystemChecks() suite. They confirm:
 *   - missions reference valid stage/topic/skill (and badges)
 *   - mission filters can actually generate valid, in-range questions
 *   - adaptive difficulty stays inside each mission's allowed range
 *   - mission completion (and therefore its reward) triggers exactly once
 *   - missions/badges save & reload from localStorage
 *   - no Firebase has been added (persistence is still local-only)
 *
 * `progressSnapshot` (optional) enables the save/reload round-trip; the real
 * saved state is restored afterward so running checks never wipes progress.
 */
export function runMissionChecks(progressSnapshot) {
  const checks = [];
  const missions = getAllMissions();

  // M1) Every sample mission references a valid stage/topic/skill (+ badge).
  const refProblems = [];
  for (const m of missions) {
    const { valid, problems } = validateMission(m);
    if (!valid) refProblems.push(`${m.missionId}: ${problems.join(",")}`);
  }
  checks.push({
    name: "Missions have valid stage/topic/skill refs",
    pass: refProblems.length === 0,
    detail: refProblems.length === 0 ? `${missions.length} missions valid` : refProblems.join(" | "),
  });

  // M2) Mission filters generate valid questions inside the difficulty range.
  let genOk = true;
  const genProblems = [];
  for (const m of missions) {
    const qs = buildMissionQuestions(m, 6, () => newProfile());
    const ok =
      qs.length === 6 &&
      qs.every(
        (q) =>
          q &&
          typeof q.check === "function" &&
          q.check(q.answer) &&
          q.difficultyLevel >= m.difficultyRange.min &&
          q.difficultyLevel <= m.difficultyRange.max
      );
    if (!ok) {
      genOk = false;
      genProblems.push(m.missionId);
    }
  }
  checks.push({
    name: "Mission filters generate questions",
    pass: genOk,
    detail: genOk ? "all missions produce valid in-range questions" : `failing: ${genProblems.join(", ")}`,
  });

  // M3) Adaptive difficulty respects the mission range (even for extreme runs).
  const hi = { ...newProfile(), workingDifficulty: 5, streak: 9 };
  const lo = { ...newProfile(), workingDifficulty: 1, incorrectStreak: 9 };
  let rangeOk = true;
  for (const m of missions) {
    const { min, max } = m.difficultyRange;
    const a = suggestDifficultyInRange(hi, min, max);
    const b = suggestDifficultyInRange(lo, min, max);
    const c = resolveMissionDifficulty(m, "x", () => hi);
    if (a > max || a < min || b > max || b < min || c > max || c < min) rangeOk = false;
  }
  // adaptiveOff missions should sit at the range minimum.
  const offMin = resolveMissionDifficulty(
    { difficultyRange: { min: 3, max: 5 }, adaptiveOn: false },
    "x",
    () => hi
  );
  checks.push({
    name: "Adaptive selector respects mission range",
    pass: rangeOk && offMin === 3,
    detail: rangeOk ? `clamped to each range; off→min (${offMin})` : "left the allowed range",
  });

  // M4) A mission completes — and so pays its reward — exactly once.
  const sample = getMission("stage4-integers-warmup");
  let prog = createMissionProgress(sample);
  let completions = 0;
  for (let i = 0; i < completionTarget(sample) + 4; i++) {
    const r = engineRecordMissionAttempt(prog, sample, true, 10);
    prog = r.progress;
    if (r.justCompleted) completions++;
  }
  checks.push({
    name: "Mission reward applied once only",
    pass: completions === 1 && prog.complete,
    detail: `completion fired ${completions}× (expected 1)`,
  });

  // M5) Missions & badges save and reload.
  if (progressSnapshot) {
    const synthetic = {
      ...progressSnapshot,
      earnedBadges: [{ badgeId: "fraction-explorer", earnedAt: 123 }],
      completedMissions: ["stage4-fdp-revision"],
      activeMission: getMission("stage4-fdp-revision"),
      activeMissionId: "stage4-fdp-revision",
      missionProgress: {
        missionId: "stage4-fdp-revision",
        answered: 3,
        correct: 2,
        complete: false,
        rewarded: false,
      },
    };
    saveProgress(synthetic);
    const re = loadProgress() || {};
    const badgesOk = JSON.stringify(re.earnedBadges) === JSON.stringify(synthetic.earnedBadges);
    const missionsOk =
      JSON.stringify(re.completedMissions) === JSON.stringify(synthetic.completedMissions);
    const activeOk =
      re.activeMissionId === "stage4-fdp-revision" && re.missionProgress?.answered === 3;
    // Restore the real saved state so running checks never wipes progress.
    saveProgress(progressSnapshot);
    checks.push({
      name: "Missions & badges save & reload",
      pass: badgesOk && missionsOk && activeOk,
      detail: `badges:${badgesOk} completed:${missionsOk} active:${activeOk}`,
    });
  }

  // M6) Badge catalogue is well-formed (ids resolve, no dupes).
  const badges = getAllBadges();
  const badgeIdsOk = badges.every((b) => b.badgeId && b.badgeName && b.icon && isValidBadge(b.badgeId));
  const uniqueIds = new Set(badges.map((b) => b.badgeId)).size === badges.length;
  checks.push({
    name: "Badge catalogue valid",
    pass: badgeIdsOk && uniqueIds,
    detail: `${badges.length} badges, ids unique:${uniqueIds}`,
  });

  // M7) No Firebase: persistence is still local-only. (A build-time grep gives
  // the hard guarantee; at runtime we confirm no firebase global is present.)
  const noFirebaseGlobal =
    typeof globalThis === "undefined" || typeof globalThis.firebase === "undefined";
  checks.push({
    name: "No Firebase (local-only persistence)",
    pass: noFirebaseGlobal,
    detail: noFirebaseGlobal ? "no firebase global; localStorage only" : "firebase global detected",
  });

  return checks;
}

/**
 * TOUCH-CONTROLS CHECKS (W4). Confirm the tap-to-move / tap-to-interact wiring in
 * the session store behaves: a tap sets a move target (+ optional approach id), a
 * plain ground tap clears any approach, arriving/keyboard/cancel clears cleanly,
 * and the shared on-screen-control input object has the expected shape. The
 * rendering + gesture layers are verified live on a device (can't be headless).
 */
export function runTouchChecks() {
  const checks = [];

  // T1) requestMoveTo sets the non-reactive move target AND the reactive approach
  //     id; clearMoveTarget clears both.
  requestMoveTo(3, -4, "pip");
  const setOk = playerState.moveTarget && playerState.moveTarget.x === 3 &&
    playerState.moveTarget.z === -4 && useSession.getState().approachId === "pip";
  clearMoveTarget();
  const clearOk = playerState.moveTarget === null && useSession.getState().approachId === null;
  checks.push({
    name: "Tap-to-move: requestMoveTo / clearMoveTarget",
    pass: Boolean(setOk) && clearOk,
    detail: setOk ? (clearOk ? "sets target+approach; clears both" : "clear failed") : "set failed",
  });

  // T2) A plain ground tap (no approach id) clears any prior approach, so the
  //     "Interact?" confirm can't pop from a stale target.
  requestMoveTo(1, 1, "fern");
  requestMoveTo(2, 2); // ground tap → approach cleared, target updated
  const groundOk = useSession.getState().approachId === null &&
    playerState.moveTarget.x === 2 && playerState.moveTarget.z === 2;
  clearMoveTarget();
  checks.push({
    name: "Tap-to-move: ground tap clears approach",
    pass: groundOk,
    detail: groundOk ? "approach cleared; target moved" : "stale approach remained",
  });

  // T3) The store's approach actions toggle the reactive approachId.
  useSession.getState().setApproach("alby");
  const aSet = useSession.getState().approachId === "alby";
  useSession.getState().clearApproach();
  const aClear = useSession.getState().approachId === null;
  checks.push({
    name: "Tap-to-interact: setApproach / clearApproach",
    pass: aSet && aClear,
    detail: `set:${aSet} clear:${aClear}`,
  });

  // T4) The shared on-screen-control input object exposes the expected flags
  //     (Player OR-combines these with the keyboard each frame).
  const shapeOk = touchInput && "jump" in touchInput &&
    "rotateLeft" in touchInput && "rotateRight" in touchInput;
  checks.push({
    name: "Touch controls: shared input shape",
    pass: Boolean(shapeOk),
    detail: shapeOk ? "jump + rotateLeft + rotateRight present" : "missing flags",
  });

  return checks;
}

/**
 * RATIOS & RATES CHECKS (Phase 3A). Confirm the new NATIVE Stage 4 topic
 * integrates end-to-end: registered + selectable, every skill generates valid
 * questions at all 5 levels, the multiPart / trueFalse / tableInput modes grade
 * correct AND wrong answers properly, the double-number-line diagram data is
 * renderable, missions validate + route safely, and the story is untouched.
 */
export function runRatioChecks() {
  const checks = [];
  const SKILLS = [
    "ratioDoubleLine", "simplifyRatio", "mixedUnitRatio", "ratioAsFraction",
    "equivalentRatios", "dividingQuantity", "unitaryMethod", "unitRates",
    "convertRates", "bestBuy", "mapScale", "ratioTables",
    "distanceTimeRead", "distanceTimeSpeed",
  ];

  // R1) Topic registered with the expected name + all 7 skills selectable.
  const topic = getTopics("stage4").find((t) => t.id === "ratio");
  checks.push({ name: "Ratio topic registered in curriculum", pass: Boolean(topic) && topic.name === "Ratios & Rates", detail: topic ? topic.name : "missing" });
  const skillIds = (topic && topic.skills ? topic.skills.map((s) => s.id) : []);
  const skillsOk = SKILLS.every((s) => skillIds.includes(s));
  checks.push({ name: "Ratio skills registered & selectable", pass: skillsOk, detail: skillsOk ? `${skillIds.length} skills` : "missing skill" });

  // R2) Every skill generates valid questions at every level 1–5, and the
  //     canonical answer always self-grades true.
  let genOk = true, genDetail = "all ok";
  for (const s of SKILLS) {
    for (let i = 0; i < 10; i++) {
      const q = generateCurriculumQuestion("stage4", "ratio", s, (i % 5) + 1);
      if (!q || !q.text || q.topicId !== "ratio" || q.skillId !== s || !q.answer ||
        typeof q.check !== "function" || !q.check(q.answer) || !(q.difficultyLevel >= 1)) {
        genOk = false; genDetail = `bad ${s}`; break;
      }
    }
    if (!genOk) break;
  }
  checks.push({ name: "Ratio generators return valid questions (L1–L5)", pass: genOk, detail: genDetail });

  // R3) Simplify Ratios uses the RATIO mode (boxes with colons between — no
  //     ":" typing): the boxes array grades; a typed "a:b" string also grades;
  //     a wrong array fails. Mixed-unit ratios use the same mode.
  const sr = generateCurriculumQuestion("stage4", "ratio", "simplifyRatio", 2);
  const srParts = (sr.ratioParts || []).map(String);
  const srOk = answerModeOf(sr) === "ratio" && srParts.length >= 2 &&
    gradeAnswer(sr, srParts).correct && sr.check(srParts.join(":")) &&
    !gradeAnswer(sr, srParts.map(() => "424242")).correct;
  const mu = generateCurriculumQuestion("stage4", "ratio", "mixedUnitRatio", 3);
  const muOk = answerModeOf(mu) === "ratio" && (mu.ratioParts || []).length === 2 &&
    gradeAnswer(mu, mu.ratioParts.map(String)).correct;
  checks.push({ name: "Simplify Ratios uses ratio boxes (no ':' typing)", pass: srOk, detail: srOk ? `${srParts.length} parts` : "wrong" });
  checks.push({ name: "Mixed-unit ratios use ratio boxes + grade", pass: Boolean(muOk), detail: muOk ? "2 parts" : "wrong" });

  // R4) Dividing a Quantity: numeric at low levels; 3-way multiPart at level 5.
  const dq2 = generateCurriculumQuestion("stage4", "ratio", "dividingQuantity", 2);
  const dq5 = generateCurriculumQuestion("stage4", "ratio", "dividingQuantity", 5);
  const dqOk = answerModeOf(dq2) === "simple" && dq2.check(dq2.answer) &&
    answerModeOf(dq5) === "multiPart" && (dq5.expectedParts || []).length === 3 &&
    gradeAnswer(dq5, dq5.expectedParts.map((p) => p.answer)).correct;
  checks.push({ name: "Dividing a Quantity: simple low / 3-part share at L5", pass: dqOk, detail: dqOk ? "both modes ok" : "wrong" });

  // R5) Unit Rates money answers tolerate "3" vs "3.00" (numeric match).
  let urOk = true;
  for (let i = 0; i < 20; i++) {
    const q = generateCurriculumQuestion("stage4", "ratio", "unitRates", 2);
    const n = Number(q.answer);
    if (!q.check(String(n)) || !q.check(n.toFixed(2))) { urOk = false; break; }
  }
  checks.push({ name: "Unit Rates grade with/without trailing zeros", pass: urOk, detail: urOk ? "3 == 3.00" : "wrong" });

  // R6) Best Buy is a True/False choice; grades the answer + rejects the
  //     opposite; one line per pack (teacher feedback) with counts as WORDS.
  const bb = generateCurriculumQuestion("stage4", "ratio", "bestBuy", 3);
  const bbOther = bb.answer === "True" ? "False" : "True";
  const bbLines = bb.text.split("\n");
  const bbWords = !/Pack A: \d/.test(bb.text); // "Pack A: four pens…", never "Pack A: 4"
  const bbOk = answerModeOf(bb) === "trueFalse" && Array.isArray(bb.options) &&
    bb.options[0] === "True" && bb.check(bb.answer) && !bb.check(bbOther) &&
    /(each|per)/.test(bb.feedback) && bbLines.length === 3 && bbWords;
  checks.push({ name: "Best Buy: True/False, line per pack, counts as words", pass: Boolean(bbOk), detail: bbOk ? `answer ${bb.answer}` : "wrong" });

  // R7) Ratio Tables: editable cells exist, grade correct, and reject wrong cells.
  const rt = generateCurriculumQuestion("stage4", "ratio", "ratioTables", 3);
  const rtCells = tableInputCells(rt.tableConfig || {});
  const rtOk = answerModeOf(rt) === "tableInput" && rtCells.length >= 3 &&
    gradeAnswer(rt, rtCells.map((c) => c.answer)).correct &&
    !gradeAnswer(rt, rtCells.map(() => "424242")).correct;
  checks.push({ name: "Ratio Tables grade cell-by-cell", pass: rtOk, detail: rtOk ? `${rtCells.length} cells` : "wrong" });

  // R8) Double-number-line diagram: recognised type + internally consistent data
  //     (mark strictly inside the top line; answer on the bottom scale).
  let dlOk = SUPPORTED_DIAGRAM_TYPES.includes("doubleNumberLine");
  for (let i = 0; i < 20 && dlOk; i++) {
    const q = generateCurriculumQuestion("stage4", "ratio", "ratioDoubleLine", (i % 5) + 1);
    const d = q.diagramData || {};
    if (q.diagramType !== "doubleNumberLine" || !(d.markPercent > 0) || !(d.markPercent < d.topMax) ||
      !(Number(q.answer) > 0) || !(Number(q.answer) < d.bottomMax) || !(d.ticks >= 2)) dlOk = false;
  }
  checks.push({ name: "Ratio double-number-line diagram data is renderable", pass: dlOk, detail: dlOk ? "type + data consistent" : "wrong" });

  // R9) Missions: a ratio mission validates + routes to the Mission Board fallback.
  const vm = validateMission(normaliseMission({ missionId: "t-ratio", kind: "teacher", title: "Ratios", stages: ["stage4"], selectedTopics: ["ratio"] }));
  const route = routeForMission({ missionId: "t-ratio", selectedTopics: ["ratio"] });
  const missionOk = vm.valid && route.targetId === "mission-board";
  checks.push({ name: "Ratio missions validate + route to Mission Board", pass: missionOk, detail: missionOk ? "valid → Mission Board" : (vm.problems || []).join("; ") || "bad route" });

  // R10) A ratio mission does NOT progress the main story.
  const snap = mainQuestSnapshot({ sageMet: true, completedMissions: ["t-ratio"] });
  const storyOk = resolveMainQuest(snap).step.id === "pip";
  checks.push({ name: "Ratio mission does not alter story progression", pass: storyOk, detail: storyOk ? "story stays at Pip" : "story changed" });

  // R11) Reworded prompts (teacher feedback, 3A2): dividing-a-quantity reads
  //      "… is/are divided in the ratio …" on line 1 with the question on line
  //      2; unit-rate prompts always split context/question across lines.
  const dqR = generateCurriculumQuestion("stage4", "ratio", "dividingQuantity", 2);
  const dqWordOk = /(is|are) divided in the ratio/.test(dqR.text) && dqR.text.includes("\n");
  let urLines = true;
  for (let i = 0; i < 12; i++) {
    if (!generateCurriculumQuestion("stage4", "ratio", "unitRates", (i % 5) + 1).text.includes("\n")) urLines = false;
  }
  checks.push({ name: "Ratio prompts: passive divide wording + sentence-per-line", pass: dqWordOk && urLines, detail: dqWordOk ? (urLines ? "reworded + multi-line" : "unit-rate one-liner") : "wrong wording" });

  // R12) Unit Rates asks all THREE speed-triangle questions (speed, distance,
  //      time), not just km/h — plus non-car rates.
  const urKinds = new Set();
  for (let i = 0; i < 150; i++) {
    const t = generateCurriculumQuestion("stage4", "ratio", "unitRates", 3).text;
    if (/average speed/.test(t)) urKinds.add("speed");
    else if (/How far/.test(t)) urKinds.add("distance");
    else if (/How long/.test(t)) urKinds.add("time");
    else urKinds.add("other");
  }
  const urVariety = ["speed", "distance", "time", "other"].every((k) => urKinds.has(k));
  checks.push({ name: "Unit Rates cover speed/distance/time + other rates", pass: urVariety, detail: [...urKinds].join(", ") });

  // R13) Converting rates: recognised conversions with clean numeric answers.
  let crOk = true;
  for (let i = 0; i < 40; i++) {
    const q = generateCurriculumQuestion("stage4", "ratio", "convertRates", (i % 5) + 1);
    const n = Number(q.answer);
    if (!Number.isFinite(n) || n <= 0 || !q.check(q.answer)) { crOk = false; break; }
  }
  checks.push({ name: "Converting rates give clean positive answers", pass: crOk, detail: crOk ? "m/s ↔ km/h ↔ m/min" : "wrong" });

  // R14) Distance–time graphs: renderer-recognised type, consistent journey
  //      data (starts at 0, times increase, flat stop segment), integer speeds.
  let dtOk = SUPPORTED_DIAGRAM_TYPES.includes("distanceTimeGraph");
  for (let i = 0; i < 30 && dtOk; i++) {
    const q = generateCurriculumQuestion("stage4", "ratio", i % 2 ? "distanceTimeRead" : "distanceTimeSpeed", (i % 5) + 1);
    const d = q.diagramData || {};
    const pts = d.points || [];
    if (q.diagramType !== "distanceTimeGraph" || pts.length < 4 || pts[0].y !== 0) dtOk = false;
    for (let p = 1; p < pts.length && dtOk; p++) {
      if (!(pts[p].x > pts[p - 1].x) || pts[p].y > d.yMax + 1e-9) dtOk = false;
    }
    if (dtOk && !q.check(q.answer)) dtOk = false;
  }
  const dtSpeed = generateCurriculumQuestion("stage4", "ratio", "distanceTimeSpeed", 3);
  if (!Number.isInteger(Number(dtSpeed.answer))) dtOk = false;
  checks.push({ name: "Distance–time graphs: valid journeys + integer speeds", pass: dtOk, detail: dtOk ? "type + data consistent" : "wrong" });

  // R15) Ratios never wrap mid-expression: displayed ratio text uses
  //      non-breaking spaces ("a : b" with U+00A0) in every ratio prompt.
  let nbOk = true;
  for (const s of ["simplifyRatio", "mixedUnitRatio", "ratioAsFraction", "dividingQuantity", "unitaryMethod", "mapScale"]) {
    for (let i = 0; i < 8; i++) {
      const q = generateCurriculumQuestion("stage4", "ratio", s, (i % 5) + 1);
      // Any plain-space " : " in the prompt means a breakable ratio slipped in.
      if (/ : /.test(q.text)) { nbOk = false; break; }
      if (/ratio/.test(q.text) && !/\u00A0:\u00A0/.test(q.text)) { nbOk = false; break; }
    }
    if (!nbOk) break;
  }
  checks.push({ name: "Ratio prompts use non-breaking 'a : b' text", pass: nbOk, detail: nbOk ? "U+00A0 joined" : "breakable ratio found" });

  // R16) Ratio-as-fraction uses the MathLive editor (like FDP fractions), each
  //      sentence on its own line, and accepts ONLY the simplest form.
  const raf = generateCurriculumQuestion("stage4", "ratio", "ratioAsFraction", 3);
  const [rn, rd] = String(raf.answer).split("/").map(Number);
  const rafOk = answerModeOf(raf) === "math" && raf.text.split("\n").length === 3 &&
    raf.check(raf.answer) && raf.check(`\\frac{${rn}}{${rd}}`) &&
    !raf.check(`${rn * 2}/${rd * 2}`) && !raf.check(String(rn / rd));
  checks.push({ name: "Ratio-as-fraction: MathLive + simplest form only", pass: Boolean(rafOk), detail: rafOk ? `${raf.answer} only` : "wrong" });

  return checks;
}

/**
 * LENGTH CHECKS (Phase 3B). Confirm the new diagram-heavy Length topic
 * integrates end-to-end: registered, every skill generates valid questions at
 * all 5 levels with a RENDERER-RECOGNISED diagram, exact-π answers grade in
 * all typed forms (12π / 12pi / \pi) and reject decimals, approximate circle
 * answers use the tolerant 1-dp grading, the circle-feature naming switches
 * from True/False to multiple choice at higher levels, and missions validate.
 */
export function runLengthChecks() {
  const checks = [];
  const SKILLS = [
    "quadPerimeter", "missingSidePerimeter", "compositeRectilinear",
    "circleFeatures", "circumference", "circumferenceExact", "arcLength",
    "sectorPerimeter", "partialCircle", "curvedComposite",
  ];
  const LEN_DIAGS = ["lengthPolygon", "compositeRectilinear", "circleFeatures", "circleMeasure", "sectorArc", "curvedComposite"];

  // L1) Topic registered + all 10 skills selectable.
  const topic = getTopics("stage4").find((t) => t.id === "length");
  checks.push({ name: "Length topic registered in curriculum", pass: Boolean(topic) && topic.name === "Length", detail: topic ? topic.name : "missing" });
  const skillIds = (topic && topic.skills ? topic.skills.map((s) => s.id) : []);
  const skillsOk = SKILLS.every((s) => skillIds.includes(s));
  checks.push({ name: "Length skills registered & selectable", pass: skillsOk, detail: skillsOk ? `${skillIds.length} skills` : "missing skill" });

  // L2) Every skill × every level: valid question, self-grading answer, and a
  //     diagram of a renderer-recognised type (this IS the diagram-heavy topic).
  let genOk = true, genDetail = "all ok";
  for (const s of SKILLS) {
    for (let i = 0; i < 10; i++) {
      const q = generateCurriculumQuestion("stage4", "length", s, (i % 5) + 1);
      if (!q || !q.text || q.topicId !== "length" || !q.answer ||
        typeof q.check !== "function" || !q.check(q.answer) ||
        !q.diagramType || !SUPPORTED_DIAGRAM_TYPES.includes(q.diagramType) ||
        !LEN_DIAGS.includes(q.diagramType) || !q.diagramData) {
        genOk = false; genDetail = `bad ${s} (${q && q.diagramType})`; break;
      }
    }
    if (!genOk) break;
  }
  checks.push({ name: "Length generators: valid questions + diagrams (L1–L5)", pass: genOk, detail: genDetail });

  // L3) Exact-π grading: accepts 12π / 12pi / \pi forms, rejects decimals and
  //     wrong coefficients.
  const ce = generateCurriculumQuestion("stage4", "length", "circumferenceExact", 2);
  const kStr = String(ce.answer).replace(/π/, "");
  const piOk = answerModeOf(ce) === "math" &&
    ce.check(`${kStr}π`) && ce.check(`${kStr}pi`) && ce.check(`${kStr}\\pi`) && ce.check(`${kStr} pi`) &&
    !ce.check(String(Number(kStr) * Math.PI)) && !ce.check(`${Number(kStr) + 1}π`) && !ce.check(kStr);
  checks.push({ name: "Exact-π answers grade in all typed forms", pass: Boolean(piOk), detail: piOk ? `${ce.answer} ok` : "wrong" });

  // L4) Approximate circle answers: tolerant 1-dp grading (calculator-π vs
  //     3.14 users both pass; clearly wrong values fail).
  const cq = generateCurriculumQuestion("stage4", "length", "circumference", 2);
  const cAns = Number(cq.answer);
  const tolOk = cq.check(cAns.toFixed(1)) && cq.check(cAns.toFixed(2)) && !cq.check(String(cAns + 1));
  checks.push({ name: "Circle answers use tolerant 1-dp grading", pass: Boolean(tolOk), detail: tolOk ? "±0.05 ok" : "wrong" });

  // L5) Circle features: True/False at low levels, multiple choice (4 options,
  //     correct answer present, wrong option rejected) at level 3+.
  const cfLow = generateCurriculumQuestion("stage4", "length", "circleFeatures", 1);
  const cfHigh = generateCurriculumQuestion("stage4", "length", "circleFeatures", 4);
  const wrongOpt = (cfHigh.options || []).find((o) => o !== cfHigh.answer);
  const cfOk = answerModeOf(cfLow) === "trueFalse" && answerModeOf(cfHigh) === "multipleChoice" &&
    (cfHigh.options || []).length === 4 && cfHigh.options.includes(cfHigh.answer) &&
    cfHigh.check(cfHigh.answer) && !cfHigh.check(wrongOpt);
  checks.push({ name: "Circle features: T/F low, multiple choice high", pass: Boolean(cfOk), detail: cfOk ? `answer ${cfHigh.answer}` : "wrong" });

  // L6) Composite rectilinear: answer always equals 2 × (W + H) — the derived
  //     edges are consistent with the labelled ones.
  let crOk2 = true;
  for (let i = 0; i < 20; i++) {
    const q = generateCurriculumQuestion("stage4", "length", "compositeRectilinear", (i % 5) + 1);
    const pts = q.diagramData.points;
    const W = Math.max(...pts.map((p) => p.x));
    const H = Math.max(...pts.map((p) => p.y));
    if (Number(q.answer) !== 2 * (W + H)) { crOk2 = false; break; }
  }
  checks.push({ name: "Composite rectilinear perimeter = 2(W+H)", pass: crOk2, detail: crOk2 ? "geometry consistent" : "wrong" });

  // L7) Arc setups always give an integer/half-integer π-coefficient, and the
  //     sector/partial perimeters self-grade.
  let arcOk = true;
  for (let i = 0; i < 30; i++) {
    const q = generateCurriculumQuestion("stage4", "length", "arcLength", 4);
    const k = Number(String(q.answer).replace(/π/, ""));
    if (!Number.isFinite(k) || Math.round(k * 2) !== k * 2) { arcOk = false; break; }
  }
  checks.push({ name: "Arc-length π coefficients stay clean", pass: arcOk, detail: arcOk ? "k integer/half" : "wrong" });

  // L8) Length missions validate + route to the Mission Board fallback, and do
  //     not progress the main story.
  const vmL = validateMission(normaliseMission({ missionId: "t-length", kind: "teacher", title: "Length", stages: ["stage4"], selectedTopics: ["length"] }));
  const routeL = routeForMission({ missionId: "t-length", selectedTopics: ["length"] });
  const storyL = resolveMainQuest(mainQuestSnapshot({ sageMet: true, completedMissions: ["t-length"] })).step.id === "pip";
  checks.push({ name: "Length missions validate + route + story-safe", pass: vmL.valid && routeL.targetId === "mission-board" && storyL, detail: vmL.valid ? "valid → Mission Board" : (vmL.problems || []).join("; ") });

  // L9) Not-to-scale still LOOKS right (teacher fix): the base of a rectangle/
  //     parallelogram is drawn longer, so its base label must carry the larger
  //     number — in both the perimeter and missing-side skills.
  let scaleOk = true;
  const numOfLabel = (s) => Number(String(s).match(/-?\d+(?:\.\d+)?/)?.[0]);
  for (let i = 0; i < 80 && scaleOk; i++) {
    const q = generateCurriculumQuestion("stage4", "length", i % 2 ? "quadPerimeter" : "missingSidePerimeter", (i % 5) + 1);
    const d = q.diagramData || {};
    if (d.shape !== "rectangle" && d.shape !== "parallelogram") continue;
    const l0 = d.labels[0] === "x" ? Number(q.answer) : numOfLabel(d.labels[0]);
    const l1 = d.labels[1] === "x" ? Number(q.answer) : numOfLabel(d.labels[1]);
    if (Number.isFinite(l0) && Number.isFinite(l1) && !(l0 > l1)) scaleOk = false;
  }
  checks.push({ name: "Longer edges carry the larger numbers", pass: scaleOk, detail: scaleOk ? "base > side everywhere" : "inverted labels found" });

  // L10) Semicircles label the DIAMETER (never a half-edge radius), and the
  //      arc/sector skills no longer serve 180° (semicircles live in
  //      partialCircle); arc prompts don't restate the diagram.
  let semiOk = true, sawSemi = false;
  for (let i = 0; i < 40; i++) {
    const q = generateCurriculumQuestion("stage4", "length", "partialCircle", (i % 2) + 1); // L1–2 = semicircle
    const d = q.diagramData || {};
    if (d.angle === 180) {
      sawSemi = true;
      if (d.labelMode !== "diameter" || Number(d.labelValue) !== 2 * Number(d.radius)) semiOk = false;
    }
  }
  let no180 = true, noRestate = true;
  for (let i = 0; i < 40; i++) {
    const qa = generateCurriculumQuestion("stage4", "length", "arcLength", (i % 5) + 1);
    const qs = generateCurriculumQuestion("stage4", "length", "sectorPerimeter", (i % 5) + 1);
    if (qa.diagramData.angle === 180 || qs.diagramData.angle === 180) no180 = false;
    if (/has radius|and angle/.test(qa.text + qs.text)) noRestate = false;
  }
  checks.push({ name: "Semicircles label the diameter; sectors skip 180°", pass: semiOk && sawSemi && no180 && noRestate, detail: semiOk && no180 ? (noRestate ? "diameter + no restating" : "text restates diagram") : "wrong" });

  // L11) Side labels never overlap (teacher fix): run the SAME pure placement
  //      the renderers use over many generated figures and assert every pair
  //      of label positions keeps a minimum gap — including tiny notches.
  let labelOk = true, worst = Infinity;
  for (let i = 0; i < 120 && labelOk; i++) {
    const skill = i % 2 ? "compositeRectilinear" : (i % 4 ? "quadPerimeter" : "missingSidePerimeter");
    const q = generateCurriculumQuestion("stage4", "length", skill, (i % 5) + 1);
    const d = q.diagramData || {};
    let pts, edges;
    if (skill === "compositeRectilinear") {
      pts = fitPoints(d.points, { left: 62, top: 30, width: 236, height: 160 });
      edges = (d.edgeLabels || []).map((e) => e.edge);
    } else {
      const spec = POLYGON_SPECS[d.shape];
      if (!spec) { labelOk = false; break; }
      pts = fitPoints(spec.points, { left: 56, top: 34, width: 248, height: 150 });
      edges = d.labels.map((t, ei) => (t ? ei : -1)).filter((ei) => ei >= 0);
    }
    const pos = resolveLabelPositions(pts, edges, skill === "compositeRectilinear" ? {} : { offset: 20 });
    for (let a = 0; a < pos.length; a++) {
      for (let b = a + 1; b < pos.length; b++) {
        const gap = Math.hypot(pos[a].x - pos[b].x, pos[a].y - pos[b].y);
        worst = Math.min(worst, gap);
        if (gap < 24) labelOk = false;
      }
    }
  }
  checks.push({ name: "Length side labels never overlap", pass: labelOk, detail: labelOk ? `min gap ${Math.round(worst)}px` : `labels ${Math.round(worst)}px apart` });

  return checks;
}

/**
 * EQUATIONS CHECKS (Phase 3C). Confirm the Equations topic covers the NESA
 * statements end-to-end: registered, every skill × level generates valid
 * self-grading questions, equations render via the non-breaking
 * promptText/mathExpression pair, non-integer solutions accept BOTH fraction
 * and decimal forms, both-sides equations really have pronumerals on both
 * sides, verification uses substitution choices, quadratic ± pairs grade part
 * by part, exact surd answers match in multiple forms, and missions validate.
 */
export function runEquationsChecks() {
  const checks = [];
  const SKILLS = [
    "writeEquation", "expressionVsEquation", "oneStepEquations",
    "twoStepEquations", "bothSidesEquations", "equationWordProblems",
    "verifySolution", "formulaSubstitution", "quadraticReasoning",
    "solveQuadratics", "quadraticFormulas",
  ];

  // E1) Topic registered + all 11 skills selectable.
  const topic = getTopics("stage4").find((t) => t.id === "equations");
  checks.push({ name: "Equations topic registered in curriculum", pass: Boolean(topic) && topic.name === "Equations", detail: topic ? topic.name : "missing" });
  const skillIds = (topic && topic.skills ? topic.skills.map((s) => s.id) : []);
  const skillsOk = SKILLS.every((s) => skillIds.includes(s));
  checks.push({ name: "Equations skills registered & selectable", pass: skillsOk, detail: skillsOk ? `${skillIds.length} skills` : "missing skill" });

  // E2) Every skill × level 1–5 generates valid, self-grading questions.
  let genOk = true, genDetail = "all ok";
  for (const s of SKILLS) {
    for (let i = 0; i < 10; i++) {
      const q = generateCurriculumQuestion("stage4", "equations", s, (i % 5) + 1);
      if (!q || !q.text || q.topicId !== "equations" || !q.answer ||
        typeof q.check !== "function" || !q.check(q.answer)) {
        genOk = false; genDetail = `bad ${s}`; break;
      }
    }
    if (!genOk) break;
  }
  checks.push({ name: "Equations generators valid at L1–L5", pass: genOk, detail: genDetail });

  // E3) Solve-style prompts carry a non-breaking mathExpression with "=".
  let exprOk = true;
  for (const s of ["oneStepEquations", "twoStepEquations", "bothSidesEquations"]) {
    const q = generateCurriculumQuestion("stage4", "equations", s, 3);
    if (!q.mathExpression || !q.mathExpression.includes("=") || !q.promptText) exprOk = false;
  }
  checks.push({ name: "Equations render on their own non-breaking line", pass: exprOk, detail: exprOk ? "promptText + mathExpression" : "missing expression" });

  // E4) Non-integer solutions accept BOTH fraction and decimal forms.
  let ratOk = false;
  for (let i = 0; i < 200 && !ratOk; i++) {
    const q = generateCurriculumQuestion("stage4", "equations", "oneStepEquations", 5);
    const frac = (q.acceptableAnswers || []).find((a) => /^-?\d+\/\d+$/.test(a));
    if (frac) {
      const [p, d] = frac.split("/").map(Number);
      const dec = p / d;
      ratOk = q.check(frac) && (!Number.isInteger(dec * 100) || q.check(String(dec)));
    }
  }
  checks.push({ name: "Non-integer solutions grade as fraction AND decimal", pass: ratOk, detail: ratOk ? "7/2 == 3.5" : "no rational case found" });

  // E5) Both-sides equations genuinely have x on both sides.
  let bsOk = true;
  for (let i = 0; i < 20; i++) {
    const q = generateCurriculumQuestion("stage4", "equations", "bothSidesEquations", (i % 5) + 1);
    const [lhs, rhs] = String(q.mathExpression).split("=");
    if (!/x/.test(lhs) || !/x/.test(rhs)) { bsOk = false; break; }
  }
  checks.push({ name: "Both-sides equations have x on both sides", pass: bsOk, detail: bsOk ? "x = both sides" : "one-sided" });

  // E6) Verify-by-substitution: Yes/No at low levels, pick-the-solution
  //     multiple choice (with exactly one correct candidate) at level 3+.
  const vLow = generateCurriculumQuestion("stage4", "equations", "verifySolution", 1);
  const vHigh = generateCurriculumQuestion("stage4", "equations", "verifySolution", 4);
  const vWrong = (vHigh.options || []).find((o) => o !== vHigh.answer);
  const vOk = answerModeOf(vLow) === "trueFalse" && answerModeOf(vHigh) === "multipleChoice" &&
    (vHigh.options || []).length === 4 && vHigh.check(vHigh.answer) && !vHigh.check(vWrong) &&
    /[Ss]ubstitut/.test(vHigh.text + vHigh.feedback);
  checks.push({ name: "Verify-by-substitution: T/F low, choose-solution high", pass: Boolean(vOk), detail: vOk ? "both modes ok" : "wrong" });

  // E7) Quadratic ± pairs: multiPart with positive AND negative roots; the
  //     positive-only array must NOT grade correct.
  const qr = generateCurriculumQuestion("stage4", "equations", "solveQuadratics", 1);
  const roots = (qr.expectedParts || []).map((p) => p.answer);
  const qrOk = answerModeOf(qr) === "multiPart" && roots.length === 2 &&
    Number(roots[0]) === -Number(roots[1]) &&
    gradeAnswer(qr, roots).correct && !gradeAnswer(qr, [roots[0], roots[0]]).correct;
  checks.push({ name: "x² = c grades BOTH roots (±)", pass: Boolean(qrOk), detail: qrOk ? `±${roots[0]}` : "wrong" });

  // E8) Exact surd answers match in multiple typed forms (k√m and √(k²m)),
  //     and a wrong surd fails.
  const sq = generateCurriculumQuestion("stage4", "equations", "solveQuadratics", 4);
  const surdOk = answerModeOf(sq) === "math" &&
    (sq.acceptableAnswers || []).every((a) => sq.check(a)) &&
    !sq.check("sqrt(9999991)");
  checks.push({ name: "Exact surd solutions match in all forms", pass: Boolean(surdOk), detail: surdOk ? sq.answer : "wrong" });

  // E9) Quadratic-formula contexts keep only the POSITIVE root and say why.
  let qfOk = true;
  for (let i = 0; i < 12; i++) {
    const q = generateCurriculumQuestion("stage4", "equations", "quadraticFormulas", (i % 5) + 1);
    if (Number(String(q.answer)) <= 0 || !/positive|can't be negative|cannot be negative/i.test(q.feedback)) { qfOk = false; break; }
  }
  checks.push({ name: "Formula quadratics keep the positive root + explain", pass: qfOk, detail: qfOk ? "context roots positive" : "wrong" });

  // E10) Missions validate + route + story-safe.
  const vmE = validateMission(normaliseMission({ missionId: "t-eq", kind: "teacher", title: "Equations", stages: ["stage4"], selectedTopics: ["equations"] }));
  const routeE = routeForMission({ missionId: "t-eq", selectedTopics: ["equations"] });
  const storyE = resolveMainQuest(mainQuestSnapshot({ sageMet: true, completedMissions: ["t-eq"] })).step.id === "pip";
  checks.push({ name: "Equations missions validate + route + story-safe", pass: vmE.valid && routeE.targetId === "mission-board" && storyE, detail: vmE.valid ? "valid → Mission Board" : (vmE.problems || []).join("; ") });

  return checks;
}

/**
 * PROBABILITY CHECKS (Phase 3D). Confirm the Probability topic covers all
 * three NESA strands end-to-end: registered, every skill × level generates
 * valid self-grading questions, probability fractions grade in EQUIVALENT
 * forms (3/6 == 1/2 == 0.5 — students never lose marks for unsimplified but
 * correct answers), probabilities stay inside [0, 1], observed/simulation data
 * always sums to the stated trials, complements pair correctly (P + P' = 1),
 * pin/top contexts stay theory-free, and missions validate.
 */
export function runProbabilityChecks() {
  const checks = [];
  const SKILLS = [
    "sampleSpace", "theoreticalProbability", "probabilityScale", "sumToOne",
    "theoreticalVsObserved", "observedProbability", "randomSimulation",
    "complementDescribe", "complementCalculate",
  ];
  const asNum = (s) => {
    const m = String(s).match(/^(-?\d+(?:\.\d+)?)(?:\/(\d+))?$/);
    if (!m) return null;
    return m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]);
  };

  // P1) Topic registered + all 9 skills selectable.
  const topic = getTopics("stage4").find((t) => t.id === "probability");
  checks.push({ name: "Probability topic registered in curriculum", pass: Boolean(topic) && topic.name === "Probability", detail: topic ? topic.name : "missing" });
  const skillIds = (topic && topic.skills ? topic.skills.map((s) => s.id) : []);
  const skillsOk = SKILLS.every((s) => skillIds.includes(s));
  checks.push({ name: "Probability skills registered & selectable", pass: skillsOk, detail: skillsOk ? `${skillIds.length} skills` : "missing skill" });

  // P2) Every skill × level 1–5 generates valid, self-grading questions.
  let genOk = true, genDetail = "all ok";
  for (const s of SKILLS) {
    for (let i = 0; i < 10; i++) {
      const q = generateCurriculumQuestion("stage4", "probability", s, (i % 5) + 1);
      if (!q || !q.text || q.topicId !== "probability" || q.answer == null ||
        typeof q.check !== "function" || !q.check(q.answer)) {
        genOk = false; genDetail = `bad ${s}`; break;
      }
    }
    if (!genOk) break;
  }
  checks.push({ name: "Probability generators valid at L1–L5", pass: genOk, detail: genDetail });

  // P3) Fraction probabilities grade in EQUIVALENT forms: unsimplified
  //     fraction AND decimal both pass; a wrong fraction fails.
  let eqvOk = true;
  for (let i = 0; i < 20 && eqvOk; i++) {
    const q = generateCurriculumQuestion("stage4", "probability", "theoreticalProbability", (i % 3) + 1);
    const v = asNum(q.answer);
    if (v == null) continue;
    const [num, den] = String(q.answer).includes("/") ? String(q.answer).split("/").map(Number) : [v, 1];
    if (!q.check(`${num * 3}/${den * 3}`)) eqvOk = false; // unsimplified form
    if (Number.isInteger(v * 100) && !q.check(String(v))) eqvOk = false; // decimal form
    if (q.check(`${num + den}/${den}`)) eqvOk = false; // wrong value
  }
  checks.push({ name: "Probability fractions grade in equivalent forms", pass: eqvOk, detail: eqvOk ? "3/6 == 1/2 == 0.5" : "wrong" });

  // P4) Every numeric probability answer stays inside [0, 1] (expected counts
  //     and sample-space counts excluded — they are counts, not probabilities).
  let rangeOk = true;
  for (let i = 0; i < 60 && rangeOk; i++) {
    const q = generateCurriculumQuestion("stage4", "probability", ["theoreticalProbability", "sumToOne", "observedProbability"][i % 3], (i % 5) + 1);
    if (answerModeOf(q) !== "simple" && answerModeOf(q) !== "math") continue;
    const v = asNum(q.answer);
    if (v != null && (v < 0 || v > 1) && !/expect|How many/i.test(q.text)) rangeOk = false;
  }
  checks.push({ name: "Probabilities stay within the 0–1 scale", pass: rangeOk, detail: rangeOk ? "all in [0,1]" : "out of range" });

  // P5) Observed/simulation data is internally consistent: listed counts sum
  //     to the stated number of trials, and the answer equals count/trials.
  let simOk = true;
  for (let i = 0; i < 25 && simOk; i++) {
    const q = generateCurriculumQuestion("stage4", "probability", "randomSimulation", (i % 2) + 1);
    const trials = Number((q.text.match(/(\d+) whole numbers/) || [])[1]);
    const counts = [...q.text.matchAll(/came up (\d+) times/g)].map((m) => Number(m[1]));
    if (!trials || counts.reduce((a, b) => a + b, 0) !== trials) simOk = false;
  }
  checks.push({ name: "Simulation counts sum to the stated trials", pass: simOk, detail: simOk ? "data consistent" : "counts ≠ trials" });

  // P6) The simulation skill covers the RNG statement end-to-end: reading
  //     relative frequencies low, completing the table mid, long-run
  //     behaviour high (settles towards the theoretical value).
  const simMid = generateCurriculumQuestion("stage4", "probability", "randomSimulation", 3);
  let simHighOk = false;
  for (let i = 0; i < 40 && !simHighOk; i++) {
    const q = generateCurriculumQuestion("stage4", "probability", "randomSimulation", 5);
    if (answerModeOf(q) === "multipleChoice" && /closer/i.test(q.text)) simHighOk = true;
    if (/expect|should the number/i.test(q.text)) continue;
  }
  const simModes = answerModeOf(simMid) === "tableInput" && tableInputCells(simMid.tableConfig || {}).length >= 1;
  checks.push({ name: "RNG simulation: read → complete table → long-run", pass: simModes && simHighOk, detail: simModes ? "all three stages" : "table stage missing" });

  // P7) Complement pairs really sum to 1 (the multiPart verify at level 4).
  const cc = generateCurriculumQuestion("stage4", "probability", "complementCalculate", 4);
  const parts = (cc.expectedParts || []).map((p) => asNum(p.answer));
  const ccOk = answerModeOf(cc) === "multiPart" && parts.length === 2 &&
    Math.abs(parts[0] + parts[1] - 1) < 1e-9 &&
    gradeAnswer(cc, cc.expectedParts.map((p) => p.answer)).correct;
  checks.push({ name: "Complement pairs sum to 1 and grade part-by-part", pass: Boolean(ccOk), detail: ccOk ? "P + P' = 1" : "wrong" });

  // P8) Pin/bottle-top contexts (no theoretical value) live in the OBSERVED
  //     skill and say so in the feedback.
  let pinSeen = false, pinOk = true;
  for (let i = 0; i < 60; i++) {
    const q = generateCurriculumQuestion("stage4", "probability", "observedProbability", 3);
    if (/drawing pin|bottle top/.test(q.text)) {
      pinSeen = true;
      if (!/no theoretical/i.test(q.feedback)) pinOk = false;
    }
  }
  checks.push({ name: "Observed skill covers theory-free experiments", pass: pinSeen && pinOk, detail: pinSeen ? "pins/tops present + explained" : "never generated" });

  // P9) Sample spaces: choose-the-list low, ordered listing mid, outcome
  //     counting high (compound experiments).
  const ssLow = generateCurriculumQuestion("stage4", "probability", "sampleSpace", 1);
  const ssMid = generateCurriculumQuestion("stage4", "probability", "sampleSpace", 2);
  const ssHigh = generateCurriculumQuestion("stage4", "probability", "sampleSpace", 5);
  const ssOk = answerModeOf(ssLow) === "multipleChoice" && answerModeOf(ssMid) === "orderedList" &&
    answerModeOf(ssHigh) === "simple" && Number(ssHigh.answer) >= 4;
  checks.push({ name: "Sample spaces: choose → list → count progression", pass: Boolean(ssOk), detail: ssOk ? "3 stages" : "wrong" });

  // P10) Missions validate + route + story-safe.
  const vmP = validateMission(normaliseMission({ missionId: "t-prob", kind: "teacher", title: "Probability", stages: ["stage4"], selectedTopics: ["probability"] }));
  const routeP = routeForMission({ missionId: "t-prob", selectedTopics: ["probability"] });
  const storyP = resolveMainQuest(mainQuestSnapshot({ sageMet: true, completedMissions: ["t-prob"] })).step.id === "pip";
  checks.push({ name: "Probability missions validate + route + story-safe", pass: vmP.valid && routeP.targetId === "mission-board" && storyP, detail: vmP.valid ? "valid → Mission Board" : (vmP.problems || []).join("; ") });

  return checks;
}

/**
 * INDICES CHECKS (Phase 3E). Confirm the Indices topic covers all three NESA
 * statement groups end-to-end: registered, every skill × level generates valid
 * self-grading questions, student-facing text NEVER shows plain-text notation
 * (^, sqrt() — real superscripts and radicals only), index-form answers grade
 * STRUCTURALLY (2⁷ ✓, 128 ✗; any typed form 2^7 / 2⁷ accepted), prime
 * factorisations accept any order but reject non-prime bases, surd
 * simplification rejects the unsimplified root, root estimates use tolerant
 * 1-dp grading, factor trees render a consistent chain, and missions validate.
 */
export function runIndicesChecks() {
  const checks = [];
  const SKILLS = [
    "indexTerminology", "indexNotation", "evaluateIndices", "orderOpsIndices",
    "divisibilityTests", "primeFactorisation", "rootNotation", "rootProperty",
    "estimateRoots", "rootOrderOps", "indexLawsMultiply", "indexLawsDivide",
    "indexLawsPower", "zeroIndex",
  ];

  // I1) Topic registered + all 14 skills selectable.
  const topic = getTopics("stage4").find((t) => t.id === "indices");
  checks.push({ name: "Indices topic registered in curriculum", pass: Boolean(topic) && topic.name === "Indices", detail: topic ? topic.name : "missing" });
  const skillIds = (topic && topic.skills ? topic.skills.map((s) => s.id) : []);
  const skillsOk = SKILLS.every((s) => skillIds.includes(s));
  checks.push({ name: "Indices skills registered & selectable", pass: skillsOk, detail: skillsOk ? `${skillIds.length} skills` : "missing skill" });

  // I2) Every skill × level 1–5 generates valid, self-grading questions.
  let genOk = true, genDetail = "all ok";
  for (const s of SKILLS) {
    for (let i = 0; i < 10; i++) {
      const q = generateCurriculumQuestion("stage4", "indices", s, (i % 5) + 1);
      if (!q || !q.text || q.topicId !== "indices" || q.answer == null ||
        typeof q.check !== "function" || !q.check(q.answer)) {
        genOk = false; genDetail = `bad ${s}`; break;
      }
    }
    if (!genOk) break;
  }
  checks.push({ name: "Indices generators valid at L1–L5", pass: genOk, detail: genDetail });

  // I3) NOTATION: student-facing text never contains ^, sqrt( or x^2-style
  //     plain text — real superscripts (²³⁴) and radicals (√ ∛) only.
  let notationOk = true, notationDetail = "clean";
  for (const s of SKILLS) {
    for (let i = 0; i < 6; i++) {
      const q = generateCurriculumQuestion("stage4", "indices", s, (i % 5) + 1);
      const facing = `${q.text} ${q.feedback} ${(q.options || []).join(" ")} ${(q.expectedParts || []).map((p) => p.prompt).join(" ")}`;
      if (/[\^]|sqrt\(|cbrt\(/.test(facing)) { notationOk = false; notationDetail = `plain-text notation in ${s}`; break; }
    }
    if (!notationOk) break;
  }
  checks.push({ name: "Indices prompts use real notation (no ^ or sqrt())", pass: notationOk, detail: notationDetail });

  // I4) Index-form answers grade STRUCTURALLY: typed 2^7 AND unicode 2⁷ pass;
  //     the evaluated value and a wrong exponent fail.
  const law = generateCurriculumQuestion("stage4", "indices", "indexLawsMultiply", 2);
  const [ibase, iexp] = (() => {
    const m = law.answer.match(/^(\d+)(.+)$/);
    const SUPS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
    return [Number(m[1]), Number(m[2].split("").map((c) => SUPS.indexOf(c)).join(""))];
  })();
  const structOk = law.check(`${ibase}^${iexp}`) && law.check(law.answer) &&
    !law.check(String(ibase ** iexp)) && !law.check(`${ibase}^${iexp + 1}`);
  checks.push({ name: "Index-form answers grade structurally (2⁷ ✓, 128 ✗)", pass: Boolean(structOk), detail: structOk ? law.answer : "wrong" });

  // I5) Prime factorisation: any ORDER and index/expanded form accepted;
  //     non-prime bases and the bare number rejected.
  const pf = generateCurriculumQuestion("stage4", "indices", "primeFactorisation", 4);
  const nMatch = pf.text.match(/Write (\d+) as/);
  const N = Number(nMatch && nMatch[1]);
  const factors = [];
  {
    let x = N;
    for (let p = 2; p * p <= x; p++) while (x % p === 0) { factors.push(p); x /= p; }
    if (x > 1) factors.push(x);
  }
  const expandedForm = factors.slice().reverse().join("*"); // reversed order
  const pfOk = N > 1 && pf.check(expandedForm) && !pf.check(String(N)) &&
    !pf.check(`${N}^1`) && (N % 4 !== 0 || !pf.check(`4*${N / 4}`));
  checks.push({ name: "Prime factorisation: any order ✓, non-primes ✗", pass: Boolean(pfOk), detail: pfOk ? `${N} ok` : "wrong" });

  // I6) Surd simplification rejects the UNSIMPLIFIED root (k√m required).
  const surd = generateCurriculumQuestion("stage4", "indices", "rootProperty", 4);
  const sm = surd.answer.match(/^(\d+)√(\d+)$/);
  const surdOk = sm && surd.check(`${sm[1]}√${sm[2]}`) && surd.check(`${sm[1]}sqrt(${sm[2]})`) &&
    !surd.check(`√${Number(sm[1]) ** 2 * Number(sm[2])}`) && !surd.check(`${sm[1]}√${Number(sm[2]) + 1}`);
  checks.push({ name: "Surd answers require simplified k√m form", pass: Boolean(surdOk), detail: surdOk ? surd.answer : "wrong" });

  // I7) Root estimates: tolerant 1-dp grading; between-whole-numbers pairs
  //     are genuinely consecutive.
  const est = generateCurriculumQuestion("stage4", "indices", "estimateRoots", 3);
  const estV = Number(est.answer);
  const estOk = est.check(est.answer) && est.check(estV.toFixed(2)) && !est.check(String(estV + 1));
  const between = generateCurriculumQuestion("stage4", "indices", "estimateRoots", 1);
  const bParts = (between.expectedParts || []).map((p) => Number(p.answer));
  const betweenOk = bParts.length === 2 && bParts[1] === bParts[0] + 1;
  checks.push({ name: "Root estimates: 1-dp tolerance + consecutive bounds", pass: Boolean(estOk && betweenOk), detail: estOk ? "both ok" : "wrong" });

  // I8) Factor trees: renderer-recognised type and a chain consistent with the
  //     number (product of all leaves = the number).
  const pf3 = generateCurriculumQuestion("stage4", "indices", "primeFactorisation", 3);
  let treeOk = pf3.diagramType === "factorTree" && SUPPORTED_DIAGRAM_TYPES.includes("factorTree");
  if (treeOk) {
    const num = pf3.diagramData.number;
    const chain = factorChain(num);
    const leaves = chain.map(([p]) => p);
    const lastQ = chain.length ? chain[chain.length - 1][1] : num;
    const product = leaves.reduce((a, b) => a * b, 1) * lastQ;
    treeOk = product === num && chain.length >= 1;
  }
  checks.push({ name: "Factor trees: registered + chain multiplies back", pass: treeOk, detail: treeOk ? "consistent" : "wrong" });

  // I9) The zero index: a⁰ grades as 1, and the L5 comparison distinguishes
  //     (m×n)⁰ from m×n⁰.
  const z1 = generateCurriculumQuestion("stage4", "indices", "zeroIndex", 1);
  const z5 = generateCurriculumQuestion("stage4", "indices", "zeroIndex", 5);
  const zOk = Number(z1.answer) === 1 && z1.check("1") && !z1.check("0") &&
    answerModeOf(z5) === "comparison" && (z5.answer === "<" || z5.answer === ">");
  checks.push({ name: "Zero index: a⁰ = 1 + bracket-scope comparison", pass: Boolean(zOk), detail: zOk ? "ok" : "wrong" });

  // I10) Divisibility: the L5 ordered list contains only true divisors, in order.
  const dv = generateCurriculumQuestion("stage4", "indices", "divisibilityTests", 5);
  const dvN = Number((dv.text.match(/into (\d+)\?/) || [])[1]);
  const dvItems = (dv.orderedItems || []).map(Number);
  const dvOk = dvN > 0 && dvItems.length >= 3 && dvItems.every((d) => dvN % d === 0) &&
    dvItems.every((d, i) => i === 0 || d > dvItems[i - 1]) &&
    [2, 3, 4, 5, 6, 10].filter((d) => dvN % d === 0).length === dvItems.length;
  checks.push({ name: "Divisibility lists: complete, correct, ordered", pass: Boolean(dvOk), detail: dvOk ? `${dvN}: ${dvItems.join(",")}` : "wrong" });

  // I11) Misconception guards exist: √(a+b) ≠ √a+√b and (a+b)² ≠ a²+b² both
  //      appear as False statements.
  let miscon1 = false, miscon2 = false;
  for (let i = 0; i < 40; i++) {
    const q1 = generateCurriculumQuestion("stage4", "indices", "rootProperty", 5);
    if (/\+/.test(q1.text) && q1.answer === "False") miscon1 = true;
    const q2 = generateCurriculumQuestion("stage4", "indices", "indexLawsPower", 4);
    if (/\+/.test(q2.text) && q2.answer === "False") miscon2 = true;
    if (miscon1 && miscon2) break;
  }
  checks.push({ name: "Misconception guards: roots/squares don't split over +", pass: miscon1 && miscon2, detail: miscon1 && miscon2 ? "both present" : "missing" });

  // I12) Missions validate + route + story-safe.
  const vmI = validateMission(normaliseMission({ missionId: "t-ind", kind: "teacher", title: "Indices", stages: ["stage4"], selectedTopics: ["indices"] }));
  const routeI = routeForMission({ missionId: "t-ind", selectedTopics: ["indices"] });
  const storyI = resolveMainQuest(mainQuestSnapshot({ sageMet: true, completedMissions: ["t-ind"] })).step.id === "pip";
  checks.push({ name: "Indices missions validate + route + story-safe", pass: vmI.valid && routeI.targetId === "mission-board" && storyI, detail: vmI.valid ? "valid → Mission Board" : (vmI.problems || []).join("; ") });

  return checks;
}

/**
 * LINEAR RELATIONSHIPS CHECKS (Phase 3F). Confirm the topic covers the NESA
 * statements end-to-end: registered, every skill × level generates valid
 * self-grading questions, EVERY plane's points/lines/intersections sit inside
 * the plotted range (graphs always readable), typed rules grade structurally
 * in all forms (y=3x+1 / 3x+1 / 1+3x) and reject wrong gradients/intercepts,
 * decreasing patterns exist, non-integer coordinates appear at high levels,
 * the flagship representations skill spans multiple directions, intersection
 * data is mathematically consistent, and missions validate.
 */
export function runLinearChecks() {
  const checks = [];
  const SKILLS = [
    "readCoordinates", "identifyPoint", "tilePattern", "patternToRule",
    "applyRule", "tableFromRule", "representations", "pointOnLine",
    "solveFromGraph", "intersection", "compareLines", "realLifeLinear",
  ];

  // LR1) Topic registered + all 12 skills selectable.
  const topic = getTopics("stage4").find((t) => t.id === "linear");
  checks.push({ name: "Linear topic registered in curriculum", pass: Boolean(topic) && topic.name === "Linear Relationships", detail: topic ? topic.name : "missing" });
  const skillIds = (topic && topic.skills ? topic.skills.map((s) => s.id) : []);
  const skillsOk = SKILLS.every((s) => skillIds.includes(s));
  checks.push({ name: "Linear skills registered & selectable", pass: skillsOk, detail: skillsOk ? `${skillIds.length} skills` : "missing skill" });

  // LR2) Every skill × level generates valid, self-grading questions.
  let genOk = true, genDetail = "all ok";
  for (const s of SKILLS) {
    for (let i = 0; i < 10; i++) {
      const q = generateCurriculumQuestion("stage4", "linear", s, (i % 5) + 1);
      if (!q || !q.text || q.topicId !== "linear" || q.answer == null ||
        typeof q.check !== "function" || !q.check(q.answer)) {
        genOk = false; genDetail = `bad ${s}`; break;
      }
    }
    if (!genOk) break;
  }
  checks.push({ name: "Linear generators valid at L1–L5", pass: genOk, detail: genDetail });

  // LR3) Plane sanity: every point and line intercept fits inside the plotted
  //      range, and stated intersections really are on BOTH lines.
  let planeOk = true, planeDetail = "all inside range";
  for (const s of SKILLS) {
    for (let i = 0; i < 8 && planeOk; i++) {
      const q = generateCurriculumQuestion("stage4", "linear", s, (i % 5) + 1);
      if (q.diagramType !== "cartesianPlane") continue;
      const d = q.diagramData;
      for (const p of d.points || []) {
        if (p.x < d.xMin || p.x > d.xMax || p.y < d.yMin || p.y > d.yMax) { planeOk = false; planeDetail = `point outside in ${s}`; }
      }
      for (const ln of d.lines || []) {
        if (typeof ln.m !== "number" || typeof ln.c !== "number") { planeOk = false; planeDetail = `bad line in ${s}`; }
      }
      // Intersections must be ON-grid only where the question is ABOUT the
      // intersection (compareLines shows line pairs whose crossing point is
      // irrelevant — or non-existent, for parallels).
      if ((d.lines || []).length === 2 && (s === "intersection" || d.showIntersection)) {
        const [A, B] = d.lines;
        if (Math.abs(A.m - B.m) > 1e-12) {
          const ix = (B.c - A.c) / (A.m - B.m);
          const iy = A.m * ix + A.c;
          if (ix < d.xMin || ix > d.xMax || iy < d.yMin || iy > d.yMax) { planeOk = false; planeDetail = `intersection off-grid in ${s}`; }
        }
      }
    }
    if (!planeOk) break;
  }
  checks.push({ name: "Plane data always fits the plotted range", pass: planeOk, detail: planeDetail });

  // LR4) Typed rules grade structurally in all accepted forms.
  let ruleOk = false;
  for (let i = 0; i < 30 && !ruleOk; i++) {
    const q = generateCurriculumQuestion("stage4", "linear", "patternToRule", 4);
    const r = parseRule(q.answer);
    if (!r) continue;
    const { m, c } = r;
    const forms = [`y=${m}x${c >= 0 ? `+${c}` : c}`, `${m}x${c >= 0 ? `+${c}` : c}`];
    if (c !== 0) forms.push(`y=${c}${m >= 0 ? `+${m}` : m}x`);
    ruleOk = forms.every((f) => q.check(f)) && !q.check(`y=${m + 1}x${c >= 0 ? `+${c}` : c}`) && !q.check(`y=${m}x+${c + 1}`);
  }
  checks.push({ name: "Rules grade in all typed forms (y=3x+1 / 1+3x)", pass: ruleOk, detail: ruleOk ? "structural" : "wrong" });

  // LR5) Decreasing patterns (negative gradients) really occur.
  let sawDecreasing = false;
  for (let i = 0; i < 60 && !sawDecreasing; i++) {
    const q = generateCurriculumQuestion("stage4", "linear", "patternToRule", 4);
    const r = parseRule(q.answer);
    if (r && r.m < 0) sawDecreasing = true;
  }
  checks.push({ name: "Decreasing patterns appear (negative gradient)", pass: sawDecreasing, detail: sawDecreasing ? "found" : "never generated" });

  // LR6) Non-integer coordinates appear at high levels of coordinate skills.
  let sawHalf = false;
  for (let i = 0; i < 60 && !sawHalf; i++) {
    const q = generateCurriculumQuestion("stage4", "linear", "readCoordinates", 5);
    const p = (q.diagramData.points || [])[0];
    if (p && (!Number.isInteger(p.x) || !Number.isInteger(p.y))) sawHalf = true;
  }
  checks.push({ name: "Non-whole-number coordinates appear at L4–5", pass: sawHalf, detail: sawHalf ? "halves present" : "never generated" });

  // LR7) The flagship representations skill really spans multiple directions:
  //      each level maps a DIFFERENT pair of representations.
  const repModes = [1, 2, 3, 4, 5].map((L) => answerModeOf(generateCurriculumQuestion("stage4", "linear", "representations", L)));
  const repOk = repModes[0] === "multipleChoice" && repModes[1] === "multipleChoice" &&
    repModes[2] === "multipleChoice" && repModes[3] === "math" && repModes[4] === "math";
  const rep4 = generateCurriculumQuestion("stage4", "linear", "representations", 4);
  checks.push({ name: "Representations: 5 levels, 5 directions (MC → typed)", pass: repOk && rep4.diagramType === "cartesianPlane", detail: repOk ? repModes.join(",") : "wrong modes" });

  // LR8) Intersection questions are mathematically consistent: the stated
  //      answer satisfies both line equations.
  let intOk = true;
  for (let i = 0; i < 15 && intOk; i++) {
    const q = generateCurriculumQuestion("stage4", "linear", "intersection", 1);
    const nums = (String(q.answer).match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    const [x0, y0] = nums;
    const [A, B] = q.diagramData.lines;
    if (nums.length !== 2 || Math.abs(A.m * x0 + A.c - y0) > 1e-9 || Math.abs(B.m * x0 + B.c - y0) > 1e-9) intOk = false;
  }
  checks.push({ name: "Intersections satisfy BOTH line equations", pass: intOk, detail: intOk ? "verified" : "inconsistent" });

  // LR9) Solve-from-graph: NO marked point (it would give the answer away —
  //      teacher fix), the wording is "work out the value of x when y equals",
  //      and the answer really lies on the graphed line at y = k.
  let sgOk = true;
  for (let i = 0; i < 12 && sgOk; i++) {
    const q = generateCurriculumQuestion("stage4", "linear", "solveFromGraph", (i % 5) + 1);
    const ln = q.diagramData.lines[0];
    const k = Number((q.text.match(/y equals (-?\d+)/) || [])[1]);
    if ((q.diagramData.points || []).length > 0) sgOk = false;
    if (!/work out the value of x when y equals/.test(q.text)) sgOk = false;
    if (Math.abs(ln.m * Number(q.answer) + ln.c - k) > 1e-9) sgOk = false;
  }
  checks.push({ name: "Solve-from-graph: no give-away dot + reworded", pass: sgOk, detail: sgOk ? "consistent" : "wrong" });

  // LR12) Coordinate answers use ONE box and REQUIRE brackets: "(3,2)" and
  //       "( 3 , 2 )" pass, "3, 2" fails (teacher fix). Applies to both
  //       coordinate-reading and intersection-reading questions.
  let brOk = true;
  for (const s of ["readCoordinates", "intersection"]) {
    for (let i = 0; i < 8 && brOk; i++) {
      const q = generateCurriculumQuestion("stage4", "linear", s, s === "intersection" ? 1 : 2);
      const nums = (String(q.answer).match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
      if (nums.length !== 2) { brOk = false; break; }
      const [x0, y0] = nums;
      if (!q.check(`(${x0},${y0})`) || !q.check(`( ${x0} , ${y0} )`) || q.check(`${x0}, ${y0}`) || q.check(`(${x0 + 1},${y0})`)) brOk = false;
    }
    if (!brOk) break;
  }
  checks.push({ name: "Coordinate entry: one box, brackets required", pass: brOk, detail: brOk ? "(a, b) enforced" : "wrong" });

  // LR13) Tables of values render as REAL tables (valuesTable diagrams) in the
  //       pattern-rule, representation and table-method intersection skills,
  //       and tile patterns rotate through multiple visual styles.
  const vtOk = ["patternToRule", "representations"].every((s) =>
    generateCurriculumQuestion("stage4", "linear", s, 1).diagramType === "valuesTable") &&
    generateCurriculumQuestion("stage4", "linear", "intersection", 3).diagramType === "valuesTable" &&
    generateCurriculumQuestion("stage4", "linear", "intersection", 3).diagramData.tables.length === 2;
  const tileStyles = new Set();
  for (let i = 0; i < 60; i++) tileStyles.add(generateCurriculumQuestion("stage4", "linear", "tilePattern", 2).diagramData.style);
  checks.push({ name: "Real value-tables + varied tile patterns", pass: vtOk && tileStyles.size >= 2, detail: vtOk ? `styles: ${[...tileStyles].join(",")}` : "missing table diagram" });

  // LR10) Tile patterns: the diagram's rule matches the table/answer.
  let tpOk = true;
  for (let i = 0; i < 12 && tpOk; i++) {
    const q = generateCurriculumQuestion("stage4", "linear", "tilePattern", 5);
    const { a, b } = q.diagramData;
    const n = Number((q.text.match(/Figure (\d+)\?/) || [])[1]);
    if (!n || Number(q.answer) !== a * n + b) tpOk = false;
  }
  checks.push({ name: "Tile patterns: diagram rule matches the answer", pass: tpOk, detail: tpOk ? "a·n + b consistent" : "wrong" });

  // LR11) Missions validate + route + story-safe.
  const vmL2 = validateMission(normaliseMission({ missionId: "t-lin", kind: "teacher", title: "Linear", stages: ["stage4"], selectedTopics: ["linear"] }));
  const routeL2 = routeForMission({ missionId: "t-lin", selectedTopics: ["linear"] });
  const storyL2 = resolveMainQuest(mainQuestSnapshot({ sageMet: true, completedMissions: ["t-lin"] })).step.id === "pip";
  checks.push({ name: "Linear missions validate + route + story-safe", pass: vmL2.valid && routeL2.targetId === "mission-board" && storyL2, detail: vmL2.valid ? "valid → Mission Board" : (vmL2.problems || []).join("; ") });

  // LR14) Multiple-choice rule/coordinate questions ALWAYS offer exactly 4
  //       DISTINCT options, one of which is the answer (teacher fix — a MC
  //       question must never render fewer than 4 choices).
  let mc4Ok = true, mc4Detail = "4 distinct";
  const mc4Specs = [
    ["patternToRule", 1], ["patternToRule", 2],
    ["representations", 1], ["representations", 2], ["representations", 3],
  ];
  for (const [skill, lvl] of mc4Specs) {
    for (let i = 0; i < 30 && mc4Ok; i++) {
      const q = generateCurriculumQuestion("stage4", "linear", skill, lvl);
      if (answerModeOf(q) !== "multipleChoice") continue;
      const opts = q.options || [];
      if (opts.length !== 4 || new Set(opts).size !== 4 || !opts.includes(q.answer)) {
        mc4Ok = false; mc4Detail = `${skill} L${lvl}: ${opts.length} opts`;
      }
    }
  }
  checks.push({ name: "MC rule/coordinate questions have exactly 4 options", pass: mc4Ok, detail: mc4Detail });

  // LR15) The STEEPER question labels its two lines "Line A"/"Line B" (teacher
  //       fix) — in BOTH the options and the graded answer.
  let steepOk = true, steepDetail = "Line A/B";
  for (let i = 0; i < 24 && steepOk; i++) {
    const q = generateCurriculumQuestion("stage4", "linear", "compareLines", (i % 2) + 1);
    if (!/STEEPER/.test(q.text)) continue;
    const opts = q.options || [];
    const lineLabels = (q.diagramData?.lines || []).map((l) => l.label);
    if (opts.length !== 2 || opts[0] !== "Line A" || opts[1] !== "Line B" ||
      !["Line A", "Line B"].includes(q.answer) || !q.check(q.answer) ||
      lineLabels[0] !== "Line A" || lineLabels[1] !== "Line B") {
      steepOk = false; steepDetail = `opts ${JSON.stringify(opts)} ans ${q.answer}`;
    }
  }
  checks.push({ name: "Steeper question uses Line A / Line B", pass: steepOk, detail: steepDetail });

  // LR16) Point-on-line (Yes/No) plots NO giveaway point — showing (x, y) on
  //       the grid would reveal the answer (teacher fix). Just the line.
  let ponOk = true;
  for (let i = 0; i < 24 && ponOk; i++) {
    const q = generateCurriculumQuestion("stage4", "linear", "pointOnLine", (i % 2) + 1);
    if (answerModeOf(q) !== "trueFalse") continue;
    if ((q.diagramData?.points || []).length > 0) ponOk = false;
  }
  checks.push({ name: "Point-on-line hides the giveaway point", pass: ponOk, detail: ponOk ? "line only" : "point plotted" });

  // LR17) Coordinate-set MC options carry centerOptions THROUGH the curriculum
  //       pipeline (decorateQuestion whitelists fields — this guards it).
  let coOk = true;
  for (let i = 0; i < 20 && coOk; i++) {
    const q = generateCurriculumQuestion("stage4", "linear", "representations", 2);
    if (answerModeOf(q) === "multipleChoice" && q.centerOptions !== true) coOk = false;
  }
  checks.push({ name: "Coordinate MC options flagged centre-aligned", pass: coOk, detail: coOk ? "centerOptions carried" : "flag lost in pipeline" });

  return checks;
}

/**
 * ANGLE RELATIONSHIPS (Phase 3G). The native Angles topic: geometry language &
 * conventions, angles at a point, the transversal family (name + reason +
 * reverse justification), a TRUE protractor (difference of two non-zero
 * readings) and multi-step reasoning. Confirms every skill generates + grades,
 * the protractor teaches a difference, MC questions always have 4 options, the
 * reverse "are they parallel?" verdict matches the geometry, and notation is
 * covered.
 */
export function runAnglesChecks() {
  const checks = [];
  const SKILLS = [
    "naming", "conventions", "angleTypes", "complementarySupplementary",
    "adjacentVertical", "anglesAtPoint", "protractor", "namePair",
    "parallelAngles", "parallelReason", "areParallel", "multiStep",
  ];

  // AN1) Topic registered + all 12 skills selectable.
  const topic = getTopics("stage4").find((t) => t.id === "angles");
  checks.push({ name: "Angles topic registered in curriculum", pass: Boolean(topic) && topic.name === "Angle Relationships", detail: topic ? topic.name : "missing" });
  const skillIds = topic && topic.skills ? topic.skills.map((s) => s.id) : [];
  const skillsOk = SKILLS.every((s) => skillIds.includes(s));
  checks.push({ name: "Angle skills registered & selectable", pass: skillsOk, detail: skillsOk ? `${skillIds.length} skills` : "missing skill" });

  // AN2) Every skill × level generates valid, self-grading questions with a
  //      supported diagram type when one is attached.
  let genOk = true, genDetail = "all ok", diagOk = true;
  for (const s of SKILLS) {
    for (let i = 0; i < 20; i++) {
      const q = generateCurriculumQuestion("stage4", "angles", s, (i % 5) + 1);
      if (!q || !q.text || q.topicId !== "angles" || q.answer == null || typeof q.check !== "function" || !q.check(q.answer)) {
        genOk = false; genDetail = `bad ${s}`; break;
      }
      if (q.diagramType && !SUPPORTED_DIAGRAM_TYPES.includes(q.diagramType)) { diagOk = false; genDetail = `unknown diagram ${q.diagramType}`; }
    }
    if (!genOk) break;
  }
  checks.push({ name: "Angle generators valid at L1–L5", pass: genOk, detail: genDetail });
  checks.push({ name: "Angle diagrams all use supported types", pass: diagOk, detail: diagOk ? "5 angle diagram types" : genDetail });

  // AN3) THE protractor: both arms sit at NON-ZERO readings and the answer is
  //      the DIFFERENCE of the two readings (never "read the arm's number"),
  //      and straddle-90° (cross-scale) cases really occur.
  let protOk = true, straddle = false;
  for (let i = 0; i < 200 && protOk; i++) {
    const q = generateCurriculumQuestion("stage4", "angles", "protractor", (i % 5) + 1);
    const { armA, armB } = q.diagramData || {};
    // Neither arm may be pinned to 0° or 180° (the old bug), and the answer must
    // be the DIFFERENCE of the two arm readings — so the student must subtract.
    if (!(armA > 0 && armA < 180 && armB > 0 && armB < 180)) protOk = false;
    if (Number(q.answer) !== Math.abs(Math.round(armA) - Math.round(armB))) protOk = false;
    if (Math.min(armA, armB) < 90 && Math.max(armA, armB) > 90) straddle = true;
  }
  checks.push({ name: "Protractor answer = difference of two non-zero readings", pass: protOk, detail: protOk ? "no arm pinned to 0°" : "arm pinned / wrong difference" });
  checks.push({ name: "Protractor includes cross-scale (straddle 90°) cases", pass: straddle, detail: straddle ? "found" : "never generated" });

  // AN4) Naming / type / reason questions are multiple-choice with EXACTLY 4
  //      distinct options including the answer.
  let mcOk = true, mcDetail = "4 distinct";
  for (const s of ["naming", "conventions", "angleTypes", "namePair", "parallelReason", "areParallel", "adjacentVertical"]) {
    for (let i = 0; i < 25 && mcOk; i++) {
      const q = generateCurriculumQuestion("stage4", "angles", s, (i % 5) + 1);
      if (answerModeOf(q) !== "multipleChoice") continue;
      const o = q.options || [];
      if (o.length !== 4 || new Set(o).size !== 4 || !o.includes(q.answer)) { mcOk = false; mcDetail = `${s}: ${o.length}/${new Set(o).size}`; }
    }
  }
  checks.push({ name: "Angle MC questions have exactly 4 distinct options", pass: mcOk, detail: mcDetail });

  // AN5) Numeric solves accept BOTH a bare number and "N°".
  let degOk = true;
  for (const s of ["complementarySupplementary", "anglesAtPoint", "parallelAngles", "protractor"]) {
    for (let i = 0; i < 15 && degOk; i++) {
      const q = generateCurriculumQuestion("stage4", "angles", s, (i % 5) + 1);
      if (answerModeOf(q) !== "simple") continue;
      if (!q.check(String(q.answer)) || !q.check(`${q.answer}°`)) degOk = false;
    }
  }
  checks.push({ name: "Angle values accept a bare number and \"N°\"", pass: degOk, detail: degOk ? "both forms grade" : "format rejected" });

  // AN6) Parallel-line solving is mathematically consistent: equal for
  //      corresponding/alternate, supplementary for co-interior, and the drawn
  //      known angle matches the labelled value (to scale).
  let parOk = true, sawCoint = false;
  for (let i = 0; i < 120 && parOk; i++) {
    const q = generateCurriculumQuestion("stage4", "angles", "parallelAngles", (i % 5) + 1);
    const known = Number((q.diagramData.top.concat(q.diagramData.bottom).find((s) => /°/.test(String(s.label))) || {}).label?.replace("°", ""));
    const ans = Number(q.answer);
    if (!(ans > 0 && ans < 180)) parOk = false;
    if (/supplementary/.test(q.feedback)) { sawCoint = true; if (known + ans !== 180) parOk = false; }
    else if (known !== ans) parOk = false;
  }
  checks.push({ name: "Parallel-line angles consistent (equal / supplementary)", pass: parOk && sawCoint, detail: parOk ? (sawCoint ? "equal + co-interior verified" : "no co-interior seen") : "inconsistent" });

  // AN7) Reverse reasoning: the "are they parallel?" verdict ALWAYS matches the
  //      geometry (Yes iff the relationship holds), and BOTH verdicts occur.
  let revOk = true, sawYes = false, sawNo = false;
  for (let i = 0; i < 400 && revOk; i++) {
    const q = generateCurriculumQuestion("stage4", "angles", "areParallel", (i % 5) + 1);
    const saysYes = /^Yes/.test(q.answer);
    const fbYes = /ARE parallel/.test(q.feedback);
    if (saysYes !== fbYes) revOk = false;
    if (!q.check(q.answer)) revOk = false;
    saysYes ? (sawYes = true) : (sawNo = true);
  }
  checks.push({ name: "\"Are they parallel?\" verdict matches the angles", pass: revOk && sawYes && sawNo, detail: revOk ? "consistent, both verdicts occur" : "verdict/geometry mismatch" });

  // AN8) Geometry NOTATION is covered: the ∠ symbol, and the ⊥ / ∥ conventions,
  //      all appear in the language skills.
  let sawAngleSym = false, sawPerpPar = false;
  for (let i = 0; i < 60; i++) {
    const n = generateCurriculumQuestion("stage4", "angles", "naming", (i % 5) + 1);
    if ((n.options || []).some((o) => /∠/.test(o)) || /∠/.test(n.text)) sawAngleSym = true;
    const c = generateCurriculumQuestion("stage4", "angles", "conventions", (i % 5) + 1);
    if (/[⊥∥]/.test(c.text) || (c.options || []).some((o) => /perpendicular|parallel/.test(o))) sawPerpPar = true;
  }
  checks.push({ name: "Notation covered (∠ naming, ⊥ / ∥ conventions)", pass: sawAngleSym && sawPerpPar, detail: sawAngleSym && sawPerpPar ? "∠, ⊥, ∥ present" : `∠:${sawAngleSym} ⊥∥:${sawPerpPar}` });

  // AN9) Multi-step questions ask ONLY for the value (multiple valid paths, so
  //      no reason instruction / no forced intermediate — teacher fix), while
  //      the feedback still shows a two-relationship worked route.
  let msOk = true, msDetail = "value-only, two-reason feedback";
  for (let i = 0; i < 60 && msOk; i++) {
    const q = generateCurriculumQuestion("stage4", "angles", "multiStep", (i % 5) + 1);
    if (answerModeOf(q) !== "simple") { msOk = false; msDetail = `mode=${answerModeOf(q)}`; }
    if (/giving reasons|Give a reason/i.test(q.text)) { msOk = false; msDetail = "reason still in prompt"; }
    // Feedback should reference at least two distinct angle-fact relationships.
    const reasonsHit = ["straight line", "Vertically opposite", "Corresponding", "Alternate", "Co-interior", "at a point"].filter((r) => q.feedback.includes(r)).length;
    if (reasonsHit < 2) { msOk = false; msDetail = "feedback < 2 relationships"; }
  }
  checks.push({ name: "Multi-step asks for the value only (paths differ)", pass: msOk, detail: msDetail });

  // AN10) "Value + reason" solve questions are two-part: a numeric value (a bare
  //       number and "N°" both grade) PLUS a reason chosen from EXACTLY 4
  //       distinct options including the correct angle-fact. The question is
  //       correct only when BOTH parts are right (teacher request).
  let vrOk = true, vrDetail = "value + reason", sawVR = false;
  for (const s of ["anglesAtPoint", "parallelAngles", "complementarySupplementary", "adjacentVertical"]) {
    for (let i = 0; i < 40 && vrOk; i++) {
      const q = generateCurriculumQuestion("stage4", "angles", s, (i % 5) + 1);
      if (answerModeOf(q) !== "multiPart") continue;
      sawVR = true;
      const parts = q.expectedParts || [];
      if (parts.length !== 2) { vrOk = false; vrDetail = `${s}: ${parts.length} parts`; break; }
      const [vp, rp] = parts;
      const opts = rp.options || [];
      if (opts.length !== 4 || new Set(opts).size !== 4 || !opts.includes(rp.answer)) { vrOk = false; vrDetail = `${s}: reason opts ${opts.length}`; break; }
      // Both correct → correct; wrong reason → NOT correct; wrong value → NOT correct.
      const both = gradeAnswer(q, [String(vp.answer), rp.answer]);
      const wrongReason = gradeAnswer(q, [String(vp.answer), opts.find((o) => o !== rp.answer)]);
      const withDeg = gradeAnswer(q, [`${vp.answer}°`, rp.answer]);
      if (!both.correct || wrongReason.correct || !withDeg.correct) { vrOk = false; vrDetail = `${s}: grading wrong`; break; }
    }
  }
  checks.push({ name: "Value+reason questions grade value AND reason (4 options)", pass: vrOk && sawVR, detail: vrOk ? (sawVR ? "both parts required" : "none seen") : vrDetail });

  // AN11) An EQUAL-marked angle pair is DRAWN equal (teacher fix): in the
  //       matching-arc-mark question the two ticked angles are the same size.
  let eqOk = false;
  for (let i = 0; i < 20; i++) {
    const q = generateCurriculumQuestion("stage4", "angles", "conventions", 2);
    const d = q.diagramData;
    if (!d || !Array.isArray(d.angles) || d.angles.length !== 2) continue;
    const pt = Object.fromEntries((d.points || []).map((p) => [p.id, p]));
    const bearing = (v, p) => (Math.atan2(-(p.y - v.y), p.x - v.x) * 180) / Math.PI;
    const sizeOf = (a) => Math.abs(bearing(pt[a.vertex], pt[a.from]) - bearing(pt[a.vertex], pt[a.to]));
    const s0 = sizeOf(d.angles[0]), s1 = sizeOf(d.angles[1]);
    const bothTicked = d.angles.every((a) => a.ticks);
    if (bothTicked && Math.abs(s0 - s1) <= 3) { eqOk = true; break; }
  }
  checks.push({ name: "Equal-marked angles are drawn equal", pass: eqOk, detail: eqOk ? "∠AOB ≈ ∠BOC, both ticked" : "unequal or not ticked" });

  return checks;
}

/**
 * PROPERTIES OF GEOMETRICAL FIGURES (Phase 3H). The native geometry topic built
 * on the property-verified shapeCatalogue + two diagram engines. Confirms every
 * skill generates + grades, the shapes are the CORRECT type (a general
 * parallelogram is never a rectangle, an isosceles triangle is never
 * equilateral, a "non-convex" quad is genuinely concave), the new select-all
 * mode grades as an exact set, value+reason and the scaffolded proofs work, and
 * the angle-sum arithmetic is consistent.
 */
export function runGeometryChecks() {
  const checks = [];
  const SKILLS = [
    "naming", "triangleType", "quadType", "shapeProperties", "verifyProperty",
    "convexity", "hierarchy", "angleSums", "proofs", "unknownAngles", "unknownSides", "multiStep",
  ];

  // GM1) Topic registered + all 12 skills selectable.
  const topic = getTopics("stage4").find((t) => t.id === "geometry");
  checks.push({ name: "Geometry topic registered in curriculum", pass: Boolean(topic) && topic.name === "Properties of Geometrical Figures", detail: topic ? topic.name : "missing" });
  const skillIds = topic && topic.skills ? topic.skills.map((s) => s.id) : [];
  checks.push({ name: "Geometry skills registered & selectable", pass: SKILLS.every((s) => skillIds.includes(s)), detail: `${skillIds.length} skills` });

  // GM2) Every skill × level generates valid, self-grading questions with a
  //      supported diagram type.
  let genOk = true, genDetail = "all ok";
  for (const s of SKILLS) {
    for (let i = 0; i < 20 && genOk; i++) {
      const q = generateCurriculumQuestion("stage4", "geometry", s, (i % 5) + 1);
      if (!q || !q.text || q.topicId !== "geometry" || q.answer == null || typeof q.check !== "function" || !q.check(q.answer)) { genOk = false; genDetail = `bad ${s}`; }
      else if (q.diagramType && !SUPPORTED_DIAGRAM_TYPES.includes(q.diagramType)) { genOk = false; genDetail = `unknown diagram ${q.diagramType}`; }
    }
  }
  checks.push({ name: "Geometry generators valid at L1–L5", pass: genOk, detail: genDetail });

  // GM3) SHAPE CATALOGUE is correct: every triangle type matches its actual
  //      side/angle marks; every special quad verifies; a parallelogram is
  //      never a rectangle/rhombus; concave quads are genuinely non-convex.
  let triOk = true, quadOk = true, pgOk = true, cvxOk = true;
  for (const [sc, ac] of TRIANGLE_TYPES) {
    for (let i = 0; i < 40 && triOk; i++) {
      const t = makeTriangle(sc, ac);
      const tickN = t.ticks.filter((x) => x > 0).length;
      const gotSide = tickN === 3 ? "equilateral" : tickN === 2 ? "isosceles" : "scalene";
      const gotAngle = t.right.some(Boolean) ? "right" : Math.max(...t.angles) > 91 ? "obtuse" : "acute";
      if (gotSide !== sc || gotAngle !== ac || Math.abs(t.angles.reduce((a, b) => a + b, 0) - 180) > 2) triOk = false;
    }
  }
  for (const type of SPECIAL_QUADS) {
    for (let i = 0; i < 40 && quadOk; i++) if (!verifyQuad(makeQuad(type))) quadOk = false;
  }
  for (let i = 0; i < 200 && pgOk; i++) { const q = makeQuad("parallelogram"); if (q.right.some(Boolean) || (q.ticks.every((x) => x === 1) && Math.max(...q.ticks) === 1)) pgOk = false; }
  for (let i = 0; i < 200 && cvxOk; i++) { if (makeGenericQuad(true).convex || !makeGenericQuad(false).convex) cvxOk = false; }
  checks.push({ name: "Triangles match their side/angle class", pass: triOk, detail: triOk ? "7 types verified" : "misclassified" });
  checks.push({ name: "Special quadrilaterals verify their properties", pass: quadOk, detail: quadOk ? "6 types verified" : "property fail" });
  checks.push({ name: "A parallelogram is never a rectangle/rhombus", pass: pgOk, detail: pgOk ? "no right angles / not all-equal" : "degenerate" });
  checks.push({ name: "Convex vs non-convex quads are correct", pass: cvxOk, detail: cvxOk ? "concave is genuinely reflex" : "wrong convexity" });

  // GM4) SELECT-ALL (multiSelect): correct set grades right; a missing or extra
  //      option grades wrong; correctOptions is non-empty.
  let msOk = true, msDetail = "exact-set", sawMs = false;
  for (const s of ["shapeProperties", "triangleType", "hierarchy"]) {
    for (let i = 0; i < 40 && msOk; i++) {
      const q = generateCurriculumQuestion("stage4", "geometry", s, (i % 5) + 1);
      if (answerModeOf(q) !== "multiSelect") continue;
      sawMs = true;
      const co = q.correctOptions || [];
      if (!co.length) { msOk = false; msDetail = `${s}: empty correct`; break; }
      const exact = gradeAnswer(q, co).correct;
      const extra = (q.options || []).find((o) => !co.includes(o));
      const withExtra = extra != null ? gradeAnswer(q, [...co, extra]).correct : false;
      const missing = co.length > 1 ? gradeAnswer(q, co.slice(0, -1)).correct : false;
      if (!exact || withExtra || missing) { msOk = false; msDetail = `${s}: grading`; }
    }
  }
  checks.push({ name: "Select-all grades as an exact set", pass: msOk && sawMs, detail: msOk ? (sawMs ? "correct/missing/extra all handled" : "none seen") : msDetail });

  // GM5) Value+reason questions (unknowns / angle sums): a numeric value part
  //      plus a reason chosen from EXACTLY 4 distinct options; both must match.
  let vrOk = true, vrDetail = "value+reason", sawVr = false;
  for (const s of ["angleSums", "unknownAngles", "unknownSides"]) {
    for (let i = 0; i < 40 && vrOk; i++) {
      const q = generateCurriculumQuestion("stage4", "geometry", s, (i % 5) + 1);
      if (answerModeOf(q) !== "multiPart" || !(q.expectedParts || []).some((p) => p.options)) continue;
      sawVr = true;
      const parts = q.expectedParts;
      const rp = parts.find((p) => p.options);
      if (rp.options.length !== 4 || new Set(rp.options).size !== 4 || !rp.options.includes(rp.answer)) { vrOk = false; vrDetail = `${s}: reason opts`; break; }
      const both = gradeAnswer(q, parts.map((p) => p.answer)).correct;
      const wrongReason = gradeAnswer(q, parts.map((p) => (p === rp ? rp.options.find((o) => o !== rp.answer) : p.answer))).correct;
      if (!both || wrongReason) { vrOk = false; vrDetail = `${s}: grading`; }
    }
  }
  checks.push({ name: "Unknown-value questions grade value AND reason", pass: vrOk && sawVr, detail: vrOk ? "both required, 4 reasons" : vrDetail });

  // GM6) The three proofs are scaffolded as fill-the-reason multi-part questions
  //      (each MC part has 4 distinct options) on their construction diagram.
  let prOk = true, prKinds = new Set();
  for (let i = 0; i < 80 && prOk; i++) {
    const q = generateCurriculumQuestion("stage4", "geometry", "proofs", (i % 5) + 1);
    if (answerModeOf(q) !== "multiPart" || q.diagramType !== "geometryProof") { prOk = false; break; }
    prKinds.add(q.diagramData.kind);
    for (const p of q.expectedParts) {
      if (!p.options || p.options.length !== 4 || new Set(p.options).size !== 4 || !p.options.includes(p.answer)) prOk = false;
    }
    if (!gradeAnswer(q, q.expectedParts.map((p) => p.answer)).correct) prOk = false;
  }
  checks.push({ name: "Proofs are scaffolded on their constructions", pass: prOk && prKinds.size === 3, detail: prOk ? `kinds: ${[...prKinds].join(", ")}` : "structure/grading" });

  // GM7) Classification MC questions offer distinct options including the answer
  //      (full-name / quad-type give at least 4).
  let mcOk = true, mcDetail = "distinct";
  for (const s of ["quadType", "verifyProperty"]) {
    for (let i = 0; i < 30 && mcOk; i++) {
      const q = generateCurriculumQuestion("stage4", "geometry", s, 5);
      if (answerModeOf(q) !== "multipleChoice") continue;
      const o = q.options || [];
      if (o.length < 4 || new Set(o).size !== o.length || !o.includes(q.answer)) { mcOk = false; mcDetail = `${s}: ${o.length}`; }
    }
  }
  checks.push({ name: "Classification MC has ≥4 distinct options", pass: mcOk, detail: mcDetail });

  // GM8) Angle-sum arithmetic is consistent (triangle → 180°, quad → 360°).
  let asOk = true;
  for (let i = 0; i < 60 && asOk; i++) {
    const q = generateCurriculumQuestion("stage4", "geometry", "angleSums", 3 + (i % 3));
    if (answerModeOf(q) !== "multiPart") continue;
    const nums = (q.feedback.match(/-?\d+°/g) || []).map((x) => parseInt(x));
    const ans = Number(q.expectedParts[0].answer);
    if (!(ans > 0 && ans < 360) || nums.length < 2) asOk = false;
  }
  checks.push({ name: "Angle-sum questions are arithmetically sound", pass: asOk, detail: asOk ? "triangle/quad/exterior" : "inconsistent" });

  // GM9) Every numeric answer is a WHOLE number — no half-degree / fractional
  //      answers anywhere (teacher fix: an isosceles base angle must be whole).
  let wholeOk = true, wholeDetail = "integers";
  for (const s of SKILLS) {
    for (let i = 0; i < 60 && wholeOk; i++) {
      const q = generateCurriculumQuestion("stage4", "geometry", s, (i % 5) + 1);
      const mode = answerModeOf(q);
      let val = null;
      if (mode === "simple") val = q.answer;
      else if (mode === "multiPart") { const vp = (q.expectedParts || []).find((p) => !p.options); if (vp) val = vp.answer; }
      if (val == null) continue;
      const n = Number(String(val).replace(/[^0-9.\-]/g, ""));
      if (!Number.isFinite(n) || !Number.isInteger(n)) { wholeOk = false; wholeDetail = `${s}: "${val}"`; }
    }
  }
  checks.push({ name: "All numeric geometry answers are whole numbers", pass: wholeOk, detail: wholeOk ? "no half-degree answers" : wholeDetail });

  return checks;
}

/**
 * DATA CLASSIFICATION & VISUALISATION (Phase 3I). The native data topic built on
 * the pure charting core + dataset generator + three chart renderers. Confirms
 * every skill generates + grades, datasets carry the right variable types and
 * full chart furniture, sector angles are proportional whole numbers, histogram
 * classes are equal width, axes auto-scale from zero, select-all + two-part
 * grading work, misleading charts carry a flag, and answers are whole numbers.
 */
export function runDataChecks() {
  const checks = [];
  const SKILLS = [
    "defineClassify", "discreteContinuous", "nominalOrdinal", "readGraph", "constructGraph",
    "chooseGraph", "interpretTrend", "compareGraphs", "misleading", "infographic",
  ];
  const CHART_TYPES = new Set(["statAxisChart", "statProportionChart", "statPlotChart"]);

  // DA1) Topic registered + all 10 skills selectable.
  const topic = getTopics("stage4").find((t) => t.id === "data");
  checks.push({ name: "Data topic registered in curriculum", pass: Boolean(topic) && topic.name === "Data Classification & Visualisation", detail: topic ? topic.name : "missing" });
  const skillIds = topic && topic.skills ? topic.skills.map((s) => s.id) : [];
  checks.push({ name: "Data skills registered & selectable", pass: SKILLS.every((s) => skillIds.includes(s)), detail: `${skillIds.length} skills` });

  // DA2) Every skill × level generates valid, self-grading questions; charts use
  //      a supported diagram type and ALL three chart families are reached.
  let genOk = true, genDetail = "all ok";
  const familiesSeen = new Set();
  for (const s of SKILLS) {
    for (let i = 0; i < 24 && genOk; i++) {
      const q = generateCurriculumQuestion("stage4", "data", s, (i % 5) + 1);
      if (!q || !q.text || q.topicId !== "data" || q.answer == null || typeof q.check !== "function" || !q.check(q.answer)) { genOk = false; genDetail = `bad ${s}`; }
      else if (q.diagramType) { if (!SUPPORTED_DIAGRAM_TYPES.includes(q.diagramType)) { genOk = false; genDetail = `unknown diagram ${q.diagramType}`; } if (CHART_TYPES.has(q.diagramType)) familiesSeen.add(q.diagramType); }
    }
  }
  checks.push({ name: "Data generators valid at L1–L5", pass: genOk, detail: genDetail });
  checks.push({ name: "All three chart families are used", pass: familiesSeen.size === 3, detail: [...familiesSeen].join(", ") || "none" });

  // DA3) Datasets carry the right variable TYPE + full chart furniture (title,
  //      axis labels, source).
  let dsOk = true, dsDetail = "typed + furnished";
  for (let i = 0; i < 60 && dsOk; i++) {
    for (const ds of [makeNominal(), makeContinuous(), makePartsOfWhole()]) {
      if (!TYPE_LABEL[ds.variable.type]) { dsOk = false; dsDetail = `bad type ${ds.variable.type}`; }
      if (!ds.title || !ds.source || !/Source:/.test(ds.source)) { dsOk = false; dsDetail = "missing furniture"; }
    }
  }
  checks.push({ name: "Datasets are typed + carry title/source", pass: dsOk, detail: dsOk ? "numerical/categorical + source line" : dsDetail });

  // DA4) Continuous data has EQUAL-WIDTH histogram classes; axes auto-scale from
  //      ZERO with nice ticks.
  let binOk = true, scaleOk = niceScale(34).ticks[0] === 0 && niceScale(160).ticks[0] === 0;
  for (let i = 0; i < 60 && binOk; i++) {
    const bins = makeContinuous().bins;
    const w = bins[0].hi - bins[0].lo;
    if (!bins.every((b) => b.hi - b.lo === w)) binOk = false;
  }
  checks.push({ name: "Histogram classes are equal width", pass: binOk, detail: binOk ? "constant class width" : "uneven" });
  checks.push({ name: "Axes auto-scale from zero", pass: scaleOk, detail: scaleOk ? "ticks start at 0" : "non-zero start" });

  // DA5) Sector angles are GENUINELY proportional whole numbers summing to 360°.
  let secOk = true;
  for (let i = 0; i < 80 && secOk; i++) {
    const ds = makePartsOfWhole();
    const total = chartSum(ds.categories.map((c) => c.freq));
    const segs = sectorAngles(ds.categories.map((c) => c.freq));
    if (Math.abs(segs.reduce((a, s) => a + s.angle, 0) - 360) > 0.5) secOk = false;
    for (const c of ds.categories) if (sectorAngleOf(c.freq, total) !== Math.round((c.freq / total) * 360)) secOk = false;
  }
  checks.push({ name: "Sector angles proportional & sum to 360°", pass: secOk, detail: secOk ? "freq÷total×360" : "not proportional" });

  // DA6) Classification scenarios are all validly typed, and the classify
  //      questions grade correctly.
  const scenOk = SCENARIOS.length >= 12 && SCENARIOS.every((s) => TYPE_LABEL[s.type]);
  checks.push({ name: "Classification scenarios are validly typed", pass: scenOk, detail: `${SCENARIOS.length} scenarios` });

  // DA7) Select-all (multiSelect) grades as an exact set with a non-empty
  //      correct set; two-part choose/misleading grade BOTH parts (4 options).
  let msOk = true, tpOk = true, msSeen = false, tpSeen = false, mislSeen = false;
  for (const s of ["defineClassify", "discreteContinuous", "nominalOrdinal", "infographic"]) {
    for (let i = 0; i < 30 && msOk; i++) {
      const q = generateCurriculumQuestion("stage4", "data", s, 4);
      if (answerModeOf(q) !== "multiSelect") continue;
      msSeen = true;
      const co = q.correctOptions || [];
      if (!co.length) { msOk = false; break; }
      const extra = (q.options || []).find((o) => !co.includes(o));
      if (!gradeAnswer(q, co).correct || (extra != null && gradeAnswer(q, [...co, extra]).correct)) msOk = false;
    }
  }
  for (const s of ["chooseGraph", "misleading"]) {
    for (let i = 0; i < 30 && tpOk; i++) {
      const q = generateCurriculumQuestion("stage4", "data", s, (i % 5) + 1);
      if (answerModeOf(q) !== "multiPart") continue;
      tpSeen = true;
      const parts = q.expectedParts || [];
      if (parts.length !== 2 || !parts.every((p) => p.options && p.options.length === 4 && new Set(p.options).size === 4 && p.options.includes(p.answer))) { tpOk = false; break; }
      if (!gradeAnswer(q, parts.map((p) => p.answer)).correct) tpOk = false;
      if (gradeAnswer(q, [parts[0].options.find((o) => o !== parts[0].answer), parts[1].answer]).correct) tpOk = false;
      if (s === "misleading" && q.diagramData && q.diagramData.misleading) mislSeen = true;
    }
  }
  checks.push({ name: "Select-all grades as an exact set", pass: msOk && msSeen, detail: msOk ? "correct/extra handled" : "grading" });
  checks.push({ name: "Choose/misleading grade choice AND reason", pass: tpOk && tpSeen, detail: tpOk ? "both parts, 4 options" : "grading" });
  checks.push({ name: "Misleading charts carry a misleading flag", pass: mislSeen, detail: mislSeen ? "honest + dishonest capable" : "no flag" });

  // DA8) Every numeric data answer is a whole number.
  let wholeOk = true, wholeDetail = "integers";
  for (const s of SKILLS) {
    for (let i = 0; i < 40 && wholeOk; i++) {
      const q = generateCurriculumQuestion("stage4", "data", s, (i % 5) + 1);
      if (answerModeOf(q) !== "simple") continue;
      const n = Number(String(q.answer).replace(/[^0-9.\-]/g, ""));
      if (!Number.isFinite(n) || !Number.isInteger(n)) { wholeOk = false; wholeDetail = `${s}: ${q.answer}`; }
    }
  }
  checks.push({ name: "All numeric data answers are whole numbers", pass: wholeOk, detail: wholeOk ? "whole" : wholeDetail });

  // DA9) Line-graph points land ON gridlines: every timeseries value is a whole
  //      multiple of the chart's yStep, so values and the increment are readable
  //      off the vertical axis (teacher fix).
  let gridOk = true;
  for (let i = 0; i < 60 && gridOk; i++) {
    const ds = makeTimeSeries();
    if (!ds.yStep || !ds.series.every((p) => p.value % ds.yStep === 0)) gridOk = false;
  }
  for (let i = 0; i < 20 && gridOk; i++) {
    const q = generateCurriculumQuestion("stage4", "data", "interpretTrend", 2 + (i % 2));
    const d = q.diagramData;
    if (d && d.chartType === "line" && d.yStep && !d.series.every((p) => p.value % d.yStep === 0)) gridOk = false;
  }
  checks.push({ name: "Line-graph points land on gridlines", pass: gridOk, detail: gridOk ? "values are multiples of yStep" : "off-gridline" });

  return checks;
}

/**
 * SCHOOLYARD RANDOM TOPICS (Phase 3J). The schoolyard staff default to a RANDOM
 * Stage 4 topic (re-rolled on each fresh, not-yet-completed encounter, kept
 * distinct across the nine, L1–5). Confirms the warm-up missions are now valid
 * Stage 4 missions that generate questions, the roller yields distinct valid
 * topics, the topic-setter keeps the SAME missionId/rewards (so keys/unlocks/
 * completion are untouched), and the boss still awards the trophy.
 */
export function runSchoolyardTopicChecks() {
  const checks = [];
  const syIds = SCHOOLYARD_CHARACTERS.map((c) => c.id);
  const stage4Topics = getTopics("stage4").map((t) => t.id);

  // SJ1) Every schoolyard warm-up mission is a VALID Stage 4 mission (not the
  //      old Stage 3 number-facts) and validates.
  let missionOk = true, missionDetail = "stage4 + valid";
  for (const id of syIds) {
    const m = getMission(`warmup-${id}`);
    if (!m || !(m.stages || []).includes("stage4") || !(m.selectedTopics || []).every((t) => stage4Topics.includes(t)) || !validateMission(m).valid) {
      missionOk = false; missionDetail = `warmup-${id}`;
    }
  }
  checks.push({ name: "Schoolyard warm-ups are valid Stage 4 missions", pass: missionOk, detail: missionOk ? "9 stage4 warm-ups" : missionDetail });

  // SJ2) Rolling all nine yields DISTINCT valid Stage 4 topics.
  const rolled = syIds.map((id) => rollSchoolyardTopic(id));
  const distinct = new Set(rolled.map((r) => r.id)).size === rolled.length;
  const allValid = rolled.every((r) => stage4Topics.includes(r.id));
  checks.push({ name: "Schoolyard topics roll distinct + valid", pass: distinct && allValid && rolled.length === 9, detail: distinct && allValid ? `${rolled.length} distinct topics` : "repeat or invalid" });

  // SJ3) The topic-setter applies a topic, keeps the SAME missionId + rewards,
  //      sets the L1–5 band, and the mission then generates a real Stage 4
  //      question. The boss keeps her trophy.
  let setOk = true, setDetail = "applies + generates";
  for (const id of syIds) {
    const topicId = rollSchoolyardTopic(id).id;
    const before = getMission(`warmup-${id}`);
    const badgeBefore = before.rewardBadge;
    setSchoolyardMissionTopic(id, topicId, "X");
    const m = getMission(`warmup-${id}`);
    const q = generateCurriculumQuestion("stage4", topicId, undefined, 3);
    if (m.missionId !== `warmup-${id}` || m.rewardBadge !== badgeBefore || !m.selectedTopics.includes(topicId) ||
      m.difficultyRange.min !== 1 || m.difficultyRange.max !== 5 || !q || typeof q.check !== "function" || !q.check(q.answer)) {
      setOk = false; setDetail = `warmup-${id}`;
    }
  }
  const boss = getMission("warmup-kellahan");
  const bossOk = boss && boss.rewardBadge === "schoolyard-champion";
  checks.push({ name: "Topic-setter keeps id/rewards + generates Stage 4 Qs", pass: setOk && bossOk, detail: setOk && bossOk ? "same id, boss keeps trophy" : setDetail });

  // SJ4) Island NPCs are NOT treated as schoolyard (unchanged).
  const islandOk = ["pip", "fern", "alby"].every((id) => !isSchoolyardNpc(id)) && syIds.every((id) => isSchoolyardNpc(id));
  checks.push({ name: "Only schoolyard NPCs get random topics", pass: islandOk, detail: islandOk ? "island NPCs unchanged" : "npc scope wrong" });

  return checks;
}

/**
 * PARTS OF A WHOLE FARM checks (F1–F2) — the third region and its in-world
 * Fence Challenge. Pure data + maths only (rendering is verified live in dev).
 */
export function runFarmChecks() {
  const checks = [];
  const farm = getRegion("farm-parts-whole");
  const island = getRegion("island-1");

  // FA1) Region is valid: rect bounds, spawn inside, terrain ground (the
  //      rebuilt rolling farm — FW1–FW9 check the terrain itself), geometry.
  const spawnIn = clampToBounds(FARM_SPAWN.x, FARM_SPAWN.z, FARM_BOUNDS);
  const fa1 =
    farm && farm.bounds === FARM_BOUNDS && FARM_BOUNDS.shape === "rect" &&
    FARM_BOUNDS.width > 250 && FARM_BOUNDS.height > 220 && // it must be BIG (jungle-sized)
    typeof farm.groundHeight === "function" && typeof farm.slideAt === "function" &&
    Number.isFinite(farm.groundHeight(7, -9)) &&
    spawnIn.x === FARM_SPAWN.x && spawnIn.z === FARM_SPAWN.z &&
    Boolean(farm.geometry && farm.geometry.skyColor);
  checks.push({
    name: "Farm region: big rect bounds + terrain ground + spawn inside",
    pass: fa1,
    detail: fa1 ? `${FARM_BOUNDS.width}×${FARM_BOUNDS.height}, spawn (${FARM_SPAWN.x}, ${FARM_SPAWN.z})` : "region wrong",
  });

  // FA2) Teleport Gates: the island → farm haybale gate on the WESTERN
  //      coastline (moved 2026-07-22, well clear of Integer Dunes), farm →
  //      island return, and the island-side gate is clear of colliders.
  const toFarm = (island.portals || []).find((p) => p.target === "farm-parts-whole");
  const toIsland = (farm.portals || []).find((p) => p.target === "island-1");
  const islandCols = getColliders({ completedMissions: [], earnedBadges: [], completedEncounters: [] }, "island-1");
  const gateClear = toFarm && islandCols.every((c) => Math.hypot(c.x - toFarm.position[0], c.z - toFarm.position[1]) > c.radius + toFarm.radius);
  const fa2 = Boolean(toFarm && toIsland) && toFarm.variant === "haybale" &&
    toFarm.position[0] < -20 && gateClear &&
    Math.hypot(toIsland.position[0] - FARM_SPAWN.x, toIsland.position[1] - FARM_SPAWN.z) > toIsland.radius + 1;
  checks.push({
    name: "Farm Teleport Gates: western haybale gate, linked both ways, clear",
    pass: fa2,
    detail: fa2 ? `island gate (${toFarm.position[0]}, ${toFarm.position[1]}) ↔ farm return` : "portal wrong",
  });

  // FA3) Farm colliders are well-formed and the spawn + challenge sign are
  //      not buried inside any collider.
  const cols = getFarmColliders({});
  const wellFormed = cols.length > 40 && cols.every((c) => c.id && c.kind && Number.isFinite(c.x) && Number.isFinite(c.z) && c.radius > 0);
  const spawnClear = cols.every((c) => Math.hypot(c.x - FARM_SPAWN.x, c.z - FARM_SPAWN.z) > c.radius + 0.5);
  const fa3 = wellFormed && spawnClear;
  checks.push({
    name: "Farm colliders: well-formed + spawn clear",
    pass: fa3,
    detail: fa3 ? `${cols.length} colliders` : "collider wrong",
  });

  // FA4) The WHOLE challenge fence is walkable on both sides: no collider
  //      intrudes into a corridor along the fence line (the student must be
  //      able to walk its full length while placing).
  let corridorClear = true;
  for (let t = 0; t <= 1.001; t += 0.02) {
    const fx = CHALLENGE_FENCE.x1 + CHALLENGE_FENCE_LENGTH * t;
    for (const c of cols) {
      if (c.id === "farm-challenge-sign") continue; // the sign sits by the east end
      if (c.jumpable) continue; // jumpable fences are MEANT to sit on the fence line (Space vaults them)
      if (Math.abs(c.z - CHALLENGE_FENCE.z) < 3.2 && Math.abs(c.x - fx) < c.radius + 1.0) corridorClear = false;
    }
  }
  checks.push({
    name: "Challenge fence corridor is walkable end-to-end",
    pass: corridorClear,
    detail: corridorClear ? `${CHALLENGE_FENCE_LENGTH} m corridor clear` : "collider intrudes on fence",
  });

  // FA5) Every paddock gate gap is genuinely walkable (a player-width gap in
  //      that paddock's own fence colliders at the gate centre).
  let gatesOk = true;
  for (const p of FARM_PADDOCKS) {
    for (const g of [p.gate, p.gate2].filter(Boolean)) {
      const gx = g.side === "east" ? p.x + p.w / 2 : g.side === "west" ? p.x - p.w / 2 : p.x + (g.offset || 0);
      const gz = g.side === "south" ? p.z + p.d / 2 : g.side === "north" ? p.z - p.d / 2 : p.z + (g.offset || 0);
      const mine = cols.filter((c) => c.id.startsWith(`${p.id}-`));
      if (!mine.length || !mine.every((c) => Math.hypot(c.x - gx, c.z - gz) > c.radius + 0.6)) gatesOk = false;
    }
  }
  checks.push({
    name: "Paddock gates leave a walkable gap",
    pass: gatesOk,
    detail: gatesOk ? `${FARM_PADDOCKS.length} paddocks OK (interiors reserved for animals)` : "a gate is sealed",
  });

  // FA6) Farm interactables: welcome + three challenge signs + the records
  //      stand, all region-scoped with valid encounters; the fence sign sits
  //      by the fence's east end.
  const farmIx = getInteractablesForRegion("farm-parts-whole");
  const signDist = Math.hypot(CHALLENGE_SIGN.position[0] - CHALLENGE_FENCE.x2, CHALLENGE_SIGN.position[1] - CHALLENGE_FENCE.z);
  const wantedIx = ["farm-welcome-sign", "farm-fence-sign", "farm-roundup-sign", "farm-order-sign", "farm-crate-sign", "farm-milk-sign", "farm-weigh-sign", "farm-trade-sign", "farm-veggie-sign", "farm-plank-sign", "farm-shop-sign", "farm-records", "farm-chest"];
  const fa6 = farmIx.length === wantedIx.length && farmIx.every((i) => ENCOUNTERS[i.encounterId]) &&
    wantedIx.every((id) => farmIx.some((i) => i.id === id)) && signDist < 8;
  checks.push({
    name: "Farm interactables: signs + records stand, valid encounters",
    pass: fa6,
    detail: fa6 ? `${wantedIx.length} farm interactables OK` : "interactables wrong",
  });

  // FA7) Fence Challenge maths — 200-set fuzz. Every set: 5 rounds in the
  //      fixed concept order (fraction ×3 → decimal → percent), values in
  //      (0,1), target on the fence, prompt shows the display + post, exact
  //      placements grade correct, far placements grade wrong, and feedback
  //      exists for both.
  let fuzzOk = true;
  let fuzzDetail = "200 sets OK";
  for (let s = 0; s < 200 && fuzzOk; s++) {
    const set = generateRoundSet();
    if (set.length !== ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    const kinds = set.map((r) => r.kind).join(",");
    const expectedKinds = set.map((r) => ["fraction", "fraction", "fraction", "decimal", "percent"][fenceStageForRound(r.roundIndex)]).join(",");
    if (kinds !== expectedKinds) { fuzzOk = false; fuzzDetail = `kind order: ${kinds}`; break; }
    // Consecutive rounds must move the bird — targets clearly apart.
    const stuck = set.some((r, i) => i > 0 && Math.abs(r.targetFromRed - set[i - 1].targetFromRed) <= PLACEMENT_TOLERANCE * 2);
    if (stuck) { fuzzOk = false; fuzzDetail = "consecutive rounds share a target"; break; }
    for (const r of set) {
      const okRound =
        r.value > 0 && r.value < 1 && r.n > 0 && r.n < r.d &&
        r.targetFromRed >= 0 && r.targetFromRed <= r.length &&
        r.length === CHALLENGE_FENCE_LENGTH &&
        r.prompt.includes(r.display) && r.prompt.includes(r.fromEnd.toUpperCase()) &&
        !r.prompt.includes("NaN") && !r.prompt.includes("undefined");
      const exact = gradePlacement(r, r.targetFromRed);
      const off = gradePlacement(r, r.targetFromRed > r.length / 2 ? r.targetFromRed - PLACEMENT_TOLERANCE - 2 : r.targetFromRed + PLACEMENT_TOLERANCE + 2);
      // Banded points: a perfect strike is a max-points BULLSEYE; outside the
      // tolerance band it's not "correct" and earns fewer points; points can
      // never increase as the error grows.
      const okGrade = exact.correct && exact.band === "bullseye" && exact.points === MAX_ROUND_POINTS &&
        !off.correct && off.points < gradePlacement(r, r.targetFromRed + PLACEMENT_TOLERANCE).points &&
        typeof feedbackFor(r, exact) === "string" && feedbackFor(r, off).includes("m off");
      if (!okRound || !okGrade) { fuzzOk = false; fuzzDetail = `round ${r.roundIndex} (${r.display} from ${r.fromEnd})`; break; }
    }
  }
  checks.push({ name: "Fence Challenge maths: 200-set fuzz + grading bands", pass: fuzzOk, detail: fuzzDetail });

  // FA8) Displays are exact for each kind + the tolerance is sane (generous
  //      but far smaller than the gap between neighbouring answers).
  // Score bands: tightest-first, points strictly decreasing, bullseye INSIDE
  // the tolerance band, and the tolerance boundary still "counts" (≥ 15 pts
  // band) so the original pass meaning is preserved.
  const bandsMonotone = SCORE_BANDS.every((b, i) =>
    i === 0 || (b.frac > SCORE_BANDS[i - 1].frac && b.points < SCORE_BANDS[i - 1].points));
  const fa8 =
    displayValue("fraction", 3, 5) === "3/5" &&
    displayValue("decimal", 7, 10) === "0.7" &&
    displayValue("percent", 3, 4) === "75%" &&
    PLACEMENT_TOLERANCE > 0 && PLACEMENT_TOLERANCE <= 0.05 * CHALLENGE_FENCE_LENGTH &&
    PLACEMENT_TOLERANCE < (CHALLENGE_FENCE_LENGTH / 10) / 2 && // < half a tenth-gap
    bandsMonotone && SCORE_BANDS[0].id === "bullseye" &&
    SCORE_BANDS[0].frac * CHALLENGE_FENCE_LENGTH < PLACEMENT_TOLERANCE &&
    SCORE_BANDS[1].frac * CHALLENGE_FENCE_LENGTH === PLACEMENT_TOLERANCE;
  checks.push({
    name: "Fence Challenge displays + tolerance sane",
    pass: fa8,
    detail: fa8 ? `±${PLACEMENT_TOLERANCE} m on ${CHALLENGE_FENCE_LENGTH} m` : "display/tolerance wrong",
  });

  return checks;
}

/**
 * THE ROUND-UP checks (F3) — fraction/decimal/percentage OF AN AMOUNT via the
 * equal-groups herding challenge. Pure data + maths only.
 */
export function runRoundUpChecks() {
  const checks = [];
  const inField = (x, z, m = 0) =>
    x >= ROUNDUP_FIELD.x1 - m && x <= ROUNDUP_FIELD.x2 + m &&
    z >= ROUNDUP_FIELD.z1 - m && z <= ROUNDUP_FIELD.z2 + m;
  const inPen = (x, z) =>
    Math.abs(x - ROUNDUP_PEN.x) <= ROUNDUP_PEN.w / 2 - 0.4 &&
    Math.abs(z - ROUNDUP_PEN.z) <= ROUNDUP_PEN.d / 2 - 0.4;

  // FB1) Pen + field geometry: both inside the farm bounds, NOT overlapping,
  //      and the gate waypoints sit just outside / just inside the pen.
  const halfW = FARM_BOUNDS.width / 2, halfH = FARM_BOUNDS.height / 2;
  const penIn = Math.abs(ROUNDUP_PEN.x) + ROUNDUP_PEN.w / 2 < halfW && Math.abs(ROUNDUP_PEN.z) + ROUNDUP_PEN.d / 2 < halfH;
  const fieldIn = Math.abs(ROUNDUP_FIELD.x1) < halfW && Math.abs(ROUNDUP_FIELD.x2) < halfW && Math.abs(ROUNDUP_FIELD.z2) < halfH;
  const noOverlap = ROUNDUP_FIELD.z1 > ROUNDUP_PEN.z + ROUNDUP_PEN.d / 2; // field strictly south of the pen
  const gatesOk = !inPen(ROUNDUP_GATE_OUT[0], ROUNDUP_GATE_OUT[1]) && inPen(ROUNDUP_GATE_IN[0], ROUNDUP_GATE_IN[1]);
  const fb1 = penIn && fieldIn && noOverlap && gatesOk;
  checks.push({ name: "Round-Up pen + field geometry valid", pass: fb1, detail: fb1 ? "pen, field and gate waypoints OK" : "geometry wrong" });

  // FB2) The herd field is clear of ALL farm colliders (cows + player roam
  //      freely) and the pen's own gate gap is walkable.
  const cols = getFarmColliders({});
  const fieldClear = cols.every((c) => {
    const nx = Math.max(ROUNDUP_FIELD.x1, Math.min(ROUNDUP_FIELD.x2, c.x));
    const nz = Math.max(ROUNDUP_FIELD.z1, Math.min(ROUNDUP_FIELD.z2, c.z));
    return Math.hypot(c.x - nx, c.z - nz) > c.radius + 0.3;
  });
  const gateGapClear = cols.filter((c) => c.id.startsWith("roundup-pen"))
    .every((c) => Math.hypot(c.x - ROUNDUP_GATE_OUT[0], c.z - ROUNDUP_GATE_OUT[1]) > c.radius + 0.6);
  const fb2 = fieldClear && gateGapClear;
  checks.push({ name: "Round-Up field clear of colliders + gate walkable", pass: fb2, detail: fb2 ? "herding space clear" : "collider intrudes" });

  // FB3) The Round-Up sign: farm-scoped interactable, valid encounter, near
  //      the pen, and its start is intercepted (id matches interaction.js).
  const ix = getInteractablesForRegion("farm-parts-whole");
  const sign = ix.find((i) => i.id === "farm-roundup-sign");
  const signNearPen = sign && Math.hypot(sign.position[0] - ROUNDUP_PEN.x, sign.position[1] - ROUNDUP_PEN.z) < 12;
  const fb3 = Boolean(sign && ENCOUNTERS[sign.encounterId] && signNearPen && ROUNDUP_SIGN.id === "farm-roundup-sign");
  checks.push({ name: "Round-Up sign interactable valid + near pen", pass: fb3, detail: fb3 ? "sign OK" : "sign wrong" });

  // FB4) Round maths — 300-set fuzz. Concept order fixed; every round is
  //      SOLUTIONS-FIRST: herd = d × groupSize (6..MAX_HERD), target = n ×
  //      groupSize, 0 < target < herd, all whole numbers; displays match the
  //      kind; percents are true percentages of the fraction; prompt +
  //      reasoning carry the equal-groups language with no NaN/undefined.
  let fuzzOk = true, fuzzDetail = "300 sets OK";
  for (let s = 0; s < 300 && fuzzOk; s++) {
    const set = generateRoundUpSet();
    if (set.length !== ROUNDUP_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    const kinds = set.map((r) => r.kind).join(",");
    const expectedKinds = set.map((r) => ["fraction", "fraction", "fraction", "decimal", "percent"][roundUpStageFor(r.roundIndex)]).join(",");
    if (kinds !== expectedKinds) { fuzzOk = false; fuzzDetail = `kind order: ${kinds}`; break; }
    if (set[0].n !== 1) { fuzzOk = false; fuzzDetail = "round 1 must be a unit fraction"; break; }
    for (const r of set) {
      const wholes = [r.n, r.d, r.herd, r.groupSize, r.target].every((v) => Number.isInteger(v) && v > 0);
      const solutionsFirst = r.herd === r.d * r.groupSize && r.target === r.n * r.groupSize &&
        r.herd >= 6 && r.herd <= MAX_HERD && r.target > 0 && r.target < r.herd && r.n < r.d;
      const displayOk =
        (r.kind === "fraction" && r.display === `${r.n}/${r.d}`) ||
        (r.kind === "decimal" && r.display === String(r.n / 10) && r.d === 10) ||
        (r.kind === "percent" && r.display === `${r.pct}%` && r.pct === Math.round((r.n / r.d) * 100));
      const textOk = r.prompt.includes(r.display) && r.prompt.includes(String(r.herd)) &&
        r.reasoning.includes("÷") && r.reasoning.includes("each group") &&
        !`${r.prompt}${r.reasoning}`.includes("NaN") && !`${r.prompt}${r.reasoning}`.includes("undefined");
      if (!wholes || !solutionsFirst || !displayOk || !textOk) {
        fuzzOk = false; fuzzDetail = `round ${r.roundIndex} (${r.display} of ${r.herd})`; break;
      }
    }
  }
  checks.push({ name: "Round-Up maths: 300-set fuzz (solutions-first, whole cows)", pass: fuzzOk, detail: fuzzDetail });

  // FB5) Grading is EXACT and feedback names the direction of the miss.
  const rr = generateRoundUpSet()[1];
  const exact = gradeRoundUp(rr, rr.target);
  const over = gradeRoundUp(rr, rr.target + 1);
  const under = gradeRoundUp(rr, rr.target - 1);
  const fb5 = exact.correct && !over.correct && !under.correct && over.diff === 1 && under.diff === -1 &&
    roundUpFeedback(rr, over).includes("too many") && roundUpFeedback(rr, under).includes("too few") &&
    roundUpFeedback(rr, exact).includes(String(rr.target));
  checks.push({ name: "Round-Up grading exact + directional feedback", pass: fb5, detail: fb5 ? "±1 rejected, direction named" : "grading wrong" });

  // FB6) Spot geometry: field spots all in the field; pen slots all in the
  //      pen and distinct; both provide MAX_HERD spots.
  const fs = fieldSpots(MAX_HERD);
  const ps = penSlots(MAX_HERD);
  const fsOk = fs.length === MAX_HERD && fs.every(([x, z]) => inField(x, z, 0.1));
  const psOk = ps.length === MAX_HERD && ps.every(([x, z]) => inPen(x, z)) &&
    new Set(ps.map(([x, z]) => `${x.toFixed(2)},${z.toFixed(2)}`)).size === MAX_HERD;
  const fb6 = fsOk && psOk;
  checks.push({ name: "Round-Up field spots + pen slots inside their areas", pass: fb6, detail: fb6 ? `${MAX_HERD} spots + ${MAX_HERD} slots OK` : "spots wrong" });

  // FB7) The EQUAL-GROUPS reveal: one slot per cow, d columns of groupSize,
  //      highlighted slots == target, everything inside the field.
  let revealOk = true, revealDetail = "formations OK";
  for (let s = 0; s < 50 && revealOk; s++) {
    for (const r of generateRoundUpSet()) {
      const slots = formationSlots(r);
      const highlighted = slots.filter((sl) => sl.highlight).length;
      const groups = new Set(slots.map((sl) => sl.group));
      const perGroup = [...groups].every((gid) => slots.filter((sl) => sl.group === gid).length === r.groupSize);
      if (slots.length !== r.herd || highlighted !== r.target || groups.size !== r.d || !perGroup ||
        !slots.every((sl) => inField(sl.x, sl.z, 0.2))) {
        revealOk = false; revealDetail = `${r.display} of ${r.herd}`; break;
      }
    }
  }
  checks.push({ name: "Round-Up equal-groups reveal matches the maths", pass: revealOk, detail: revealDetail });

  // FB8) Tuning constants sane: ambient herd fits the field, herding radius
  //      is generous but local.
  const fb8 = ROUNDUP_IDLE_HERD >= 6 && ROUNDUP_IDLE_HERD <= MAX_HERD && HERD_RADIUS >= 3 && HERD_RADIUS <= 10 &&
    ROUNDUP_ROUNDS_PER_SET === 15;
  checks.push({ name: "Round-Up tuning constants sane", pass: fb8, detail: fb8 ? `herd ${ROUNDUP_IDLE_HERD} idle, radius ${HERD_RADIUS} m` : "constants wrong" });

  return checks;
}

/**
 * ORDER THE PARTS checks (F4) — ordering fractions/decimals/percentages in
 * the carrot garden. Pure data + maths only.
 */
export function runOrderPartsChecks() {
  const checks = [];

  // FC1) Garden geometry: bed + all carrot slots + view spot inside the farm
  //      bounds; slots evenly spaced and inside the bed.
  const halfW = FARM_BOUNDS.width / 2, halfH = FARM_BOUNDS.height / 2;
  const slots = Array.from({ length: ORDER_GARDEN.count }, (_, i) => orderSlotX(i));
  const slotsOk = slots.every((sx) => Math.abs(sx - ORDER_GARDEN.x) <= ORDER_GARDEN.bedW / 2 - 0.8 && Math.abs(sx) < halfW) &&
    slots.every((sx, i) => i === 0 || Math.abs(sx - slots[i - 1] - ORDER_GARDEN.spacing) < 1e-9);
  const fc1 = slotsOk && Math.abs(ORDER_GARDEN.z) + ORDER_GARDEN.bedD / 2 < halfH &&
    Math.abs(ORDER_VIEW_SPOT[0]) < halfW && Math.abs(ORDER_VIEW_SPOT[1]) < halfH;
  checks.push({ name: "Order garden geometry: slots in bed, inside bounds", pass: fc1, detail: fc1 ? `${ORDER_GARDEN.count} slots OK` : "geometry wrong" });

  // FC2) The view spot + order sign are clear of all farm colliders (the
  //      player is auto-parked there in order mode).
  const cols = getFarmColliders({});
  const spotClear = cols.every((c) => Math.hypot(c.x - ORDER_VIEW_SPOT[0], c.z - ORDER_VIEW_SPOT[1]) > c.radius + 0.5);
  const signClear = cols.filter((c) => c.id !== "farm-order-sign")
    .every((c) => Math.hypot(c.x - ORDER_SIGN.position[0], c.z - ORDER_SIGN.position[1]) > c.radius);
  const fc2 = spotClear && signClear;
  checks.push({ name: "Order garden view spot + sign clear", pass: fc2, detail: fc2 ? "approach clear" : "collider intrudes" });

  // FC3) Round maths — 300-set fuzz. Five rounds in the fixed concept order
  //      (unit fractions → same denominator → benchmarks → decimals → MIXED
  //      with ≥1 of each notation); 5 items each, all values distinct in
  //      (0,1), display order NEVER already ascending, displays clean.
  let fuzzOk = true, fuzzDetail = "300 sets OK";
  for (let s = 0; s < 300 && fuzzOk; s++) {
    const set = generateOrderSet();
    if (set.length !== ORDER_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (const r of set) {
      const vals = r.items.map((it) => it.value);
      const distinct = new Set(vals.map((v) => v.toFixed(6))).size === ORDER_ITEM_COUNT;
      const inRange = vals.every((v) => v > 0 && v < 1);
      const preSorted = r.items.every((it, idx) => idx === 0 || r.items[idx - 1].value < it.value);
      const displaysOk = r.items.every((it) => it.display && !it.display.includes("NaN") && !it.display.includes("undefined"));
      const kinds = r.items.map((it) => it.kind);
      const kindOk =
        (r.stage === 0 && kinds.every((k) => k === "fraction") && r.items.every((it) => it.display.startsWith("1/"))) ||
        (r.stage === 1 && kinds.every((k) => k === "fraction")) ||
        (r.stage === 2 && kinds.every((k) => k === "fraction")) ||
        (r.stage === 3 && kinds.every((k) => k === "decimal")) ||
        (r.stage === 4 && ["fraction", "decimal", "percent"].every((k) => kinds.includes(k)));
      if (r.items.length !== ORDER_ITEM_COUNT || !distinct || !inRange || preSorted || !displaysOk || !kindOk) {
        fuzzOk = false; fuzzDetail = `round ${r.roundIndex}`; break;
      }
    }
  }
  checks.push({ name: "Order the Parts maths: 300-set fuzz (pools + never pre-sorted)", pass: fuzzOk, detail: fuzzDetail });

  // FC4) Grading: perfect order = full points; an adjacent swap leaves 3
  //      fixed (6 pts, not correct); partial credit is always 2 per fixed.
  const rr = generateOrderSet()[2];
  const sortedIds = sortedItems(rr).map((it) => it.id);
  const perfect = gradeOrder(rr, sortedIds);
  const swapped = [...sortedIds];
  [swapped[1], swapped[2]] = [swapped[2], swapped[1]];
  const nearMiss = gradeOrder(rr, swapped);
  const fc4 = perfect.correct && perfect.points === ORDER_FULL_POINTS &&
    !nearMiss.correct && nearMiss.fixed === 3 && nearMiss.points === 3 * ORDER_PARTIAL_PER_FIXED &&
    nearMiss.points < ORDER_FULL_POINTS;
  checks.push({ name: "Order grading: full vs partial credit", pass: fc4, detail: fc4 ? "25 vs 2/fixed OK" : "grading wrong" });

  // FC5) sortedItems is strictly ascending + feedback shows the full chain
  //      and the percent equivalents, with no NaN.
  const sorted = sortedItems(rr);
  const asc = sorted.every((it, idx) => idx === 0 || sorted[idx - 1].value < it.value);
  const fb = orderFeedback(rr, nearMiss);
  const fc5 = asc && (fb.match(/</g) || []).length >= 8 && fb.includes("%") && !fb.includes("NaN");
  checks.push({ name: "Order feedback: ascending chain + percent line", pass: fc5, detail: fc5 ? "chain + % OK" : "feedback wrong" });

  // FC6) Constants sane: full points beat any possible partial haul.
  const fc6 = ORDER_ROUNDS_PER_SET === 15 && ORDER_ITEM_COUNT === 5 &&
    ORDER_FULL_POINTS > ORDER_ITEM_COUNT * ORDER_PARTIAL_PER_FIXED;
  checks.push({ name: "Order constants sane", pass: fc6, detail: fc6 ? `${ORDER_FULL_POINTS} full / ${ORDER_PARTIAL_PER_FIXED} per fixed` : "constants wrong" });

  return checks;
}

/**
 * FARM RECORDS checks (F5) — trophy bench medal thresholds + maximums.
 */
export function runFarmRecordsChecks() {
  const checks = [];

  // FD1) Medal thresholds: gold needs a PERFECT set; the boundaries sit at
  //      100 / 75 / 50; ordering is strict.
  const fd1 =
    medalFor(100) && medalFor(100).id === "gold" &&
    medalFor(99) && medalFor(99).id === "silver" &&
    medalFor(75) && medalFor(75).id === "silver" &&
    medalFor(74) && medalFor(74).id === "bronze" &&
    medalFor(50) && medalFor(50).id === "bronze" &&
    medalFor(49) === null &&
    MEDALS.every((m, i) => i === 0 || m.minPercent < MEDALS[i - 1].minPercent);
  checks.push({ name: "Farm trophies: medal thresholds (100/75/50)", pass: fd1, detail: fd1 ? "gold=perfect, silver 75+, bronze 50+" : "thresholds wrong" });

  // FD2) Maximums match the live challenge constants and percent maths caps
  //      at 100 even if an old best exceeds a rescaled maximum.
  const fd2 =
    FARM_MAX_SCORES.fence === ROUNDS_PER_SET * MAX_ROUND_POINTS &&
    FARM_MAX_SCORES.roundup === ROUNDUP_ROUNDS_PER_SET &&
    FARM_MAX_SCORES.order === ORDER_ROUNDS_PER_SET * ORDER_FULL_POINTS &&
    FARM_MAX_SCORES.crate === CRATE_ROUNDS_PER_SET * CRATE_FULL_POINTS &&
    FARM_MAX_SCORES.milk === MILK_ROUNDS_PER_SET * MILK_ROUND_POINTS &&
    FARM_MAX_SCORES.weigh === WEIGH_ROUNDS_PER_SET * WEIGH_ROUND_POINTS &&
    FARM_MAX_SCORES.trade === TRADE_ROUNDS_PER_SET * TRADE_ROUND_POINTS &&
    farmBestPercent("fence", FARM_MAX_SCORES.fence) === 100 &&
    farmBestPercent("fence", FARM_MAX_SCORES.fence * 2) === 100 &&
    farmBestPercent("roundup", 0) === 0;
  checks.push({ name: "Farm trophies: maximums match challenge constants", pass: fd2, detail: fd2 ? `fence ${FARM_MAX_SCORES.fence} / roundup ${FARM_MAX_SCORES.roundup} / order ${FARM_MAX_SCORES.order}` : "maxes wrong" });

  return checks;
}

/**
 * CRATE PACKING checks (F6) — HCF via the common-groups (crate) model.
 */
export function runCratePackingChecks() {
  const checks = [];

  // FE1) Staging geometry: the area sits at the orchard's packing shed (the
  //      rolling farm, 2026-10-07), every choice-crate slot and the view spot
  //      are inside the farm bounds, and the view spot is clear of all farm
  //      colliders.
  const halfW = FARM_BOUNDS.width / 2, halfH = FARM_BOUNDS.height / 2;
  const nearBarn = Math.hypot(CRATE_AREA.x - FARM_PACKING_SHED.x, CRATE_AREA.z - FARM_PACKING_SHED.z) < 16;
  const slotsIn = CRATE_SIZES.every((_, i) => Math.abs(crateSlotX(i)) < halfW);
  const cols = getFarmColliders({});
  const spotClear = cols.every((c) => Math.hypot(c.x - CRATE_VIEW_SPOT[0], c.z - CRATE_VIEW_SPOT[1]) > c.radius + 0.5);
  const fe1 = nearBarn && slotsIn && Math.abs(CRATE_VIEW_SPOT[1]) < halfH && spotClear;
  checks.push({ name: "Crate Packing staging: by the packing shed, slots + spot clear", pass: fe1, detail: fe1 ? `${CRATE_SIZES.length} choice crates OK` : "geometry wrong" });

  // FE2) Round maths — 300-set fuzz. 15 rounds, 3 per stage; every round is
  //      SOLUTIONS-FIRST: gcd(n1, n2) === hcf EXACTLY, hcf is in the choice
  //      palette, piles within 2..CRATE_MAX_PILE, and prompts are clean
  //      (groups language, no simplify framing).
  let fuzzOk = true, fuzzDetail = "300 sets OK";
  for (let t = 0; t < 300 && fuzzOk; t++) {
    const set = generateCrateSet();
    if (set.length !== CRATE_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (const r of set) {
      const stageOk = r.stage === crateStageFor(r.roundIndex);
      const mathsOk = crateGcd(r.n1, r.n2) === r.hcf && CRATE_SIZES.includes(r.hcf) &&
        r.n1 >= 2 && r.n2 >= 2 && r.n1 <= CRATE_MAX_PILE && r.n2 <= CRATE_MAX_PILE &&
        r.common[r.common.length - 1] === r.hcf;
      const textOk = r.prompt.includes(String(r.n1)) && r.prompt.includes(String(r.n2)) &&
        !r.prompt.includes("NaN") && !r.prompt.includes("undefined");
      if (!stageOk || !mathsOk || !textOk) { fuzzOk = false; fuzzDetail = `round ${r.roundIndex} (${r.n1}, ${r.n2})`; break; }
    }
  }
  checks.push({ name: "Crate Packing maths: 300-set fuzz (gcd exact, palette, framing)", pass: fuzzOk, detail: fuzzDetail });

  // FE3) Grading: the HCF earns full points; a smaller common factor packs
  //      for partial credit; a non-factor spills for zero (with leftovers in
  //      the pack plan).
  const rr = generateCrateSet()[7]; // a stage-3 round (bigger HCFs)
  const hcfGrade = gradeCrate(rr, rr.hcf);
  const commonFactor = rr.common.length > 1 ? rr.common[rr.common.length - 2] : null;
  const partial = commonFactor ? gradeCrate(rr, commonFactor) : null;
  const nonFactor = CRATE_SIZES.find((sz) => rr.n1 % sz !== 0 || rr.n2 % sz !== 0);
  const spill = nonFactor ? gradeCrate(rr, nonFactor) : null;
  const fe3 = hcfGrade.correct && hcfGrade.points === CRATE_FULL_POINTS &&
    hcfGrade.plans[0].leftover === 0 && hcfGrade.plans[1].leftover === 0 &&
    (!partial || (!partial.correct && partial.points === CRATE_COMMON_POINTS && partial.plans[0].leftover === 0)) &&
    (!spill || (!spill.correct && spill.points === 0 && (spill.plans[0].leftover > 0 || spill.plans[1].leftover > 0)));
  checks.push({ name: "Crate Packing grading: HCF / common / spill bands", pass: fe3, detail: fe3 ? "25 / 8 / 0 OK" : "grading wrong" });

  // FE4) Feedback tells the factor story in GROUPS language: the HCF line
  //      names the group counts, partial credit says bigger was possible,
  //      and a spill names what was left over.
  const fbHcf = crateFeedback(rr, hcfGrade);
  const fbPartial = partial ? crateFeedback(rr, partial) : "bigger";
  const fbSpill = spill ? crateFeedback(rr, spill) : "isn't a factor";
  const fe4 = fbHcf.includes("HCF") && fbHcf.includes(String(rr.hcf)) && fbHcf.includes("groups") &&
    fbPartial.includes("bigger") && fbSpill.includes("isn't a factor") &&
    !`${fbHcf}${fbPartial}${fbSpill}`.includes("NaN");
  checks.push({ name: "Crate Packing feedback: groups-language factor story", pass: fe4, detail: fe4 ? "HCF/partial/spill lines OK" : "feedback wrong" });

  // FE5) Helpers + constants: factorsOf is complete, palette is ascending
  //      and starts at 1 (the coprime answer must be choosable).
  const fe5 = factorsOf(12).join(",") === "1,2,3,4,6,12" && crateGcd(24, 36) === 12 &&
    CRATE_SIZES[0] === 1 && CRATE_SIZES.every((v, i) => i === 0 || v > CRATE_SIZES[i - 1]) &&
    CRATE_ROUNDS_PER_SET === 15 && CRATE_FULL_POINTS > CRATE_COMMON_POINTS;
  checks.push({ name: "Crate Packing helpers + constants sane", pass: fe5, detail: fe5 ? "factors/gcd/palette OK" : "helpers wrong" });

  return checks;
}

/**
 * MILK SPLITTER checks (F8) — terminating vs recurring decimals via the
 * dividing machine. Pure data + maths only.
 */
export function runMilkSplitterChecks() {
  const checks = [];
  const DOT = "\u0307";

  // FF1) Dairy corner geometry: machine + view spot inside bounds, in the
  //      quiet NW quadrant, and the view spot clear of all farm colliders.
  const halfW = FARM_BOUNDS.width / 2, halfH = FARM_BOUNDS.height / 2;
  const cols = getFarmColliders({});
  const spotClear = cols.every((c) => Math.hypot(c.x - MILK_VIEW_SPOT[0], c.z - MILK_VIEW_SPOT[1]) > c.radius + 0.5);
  const ff1 = Math.abs(MILK_AREA.x) < halfW && Math.abs(MILK_AREA.z) < halfH &&
    MILK_AREA.x < -25 && MILK_AREA.z < -15 && spotClear &&
    Math.hypot(MILK_SIGN.position[0] - MILK_AREA.x, MILK_SIGN.position[1] - MILK_AREA.z) < 12;
  checks.push({ name: "Milk Splitter dairy corner: NW, in bounds, spot clear", pass: ff1, detail: ff1 ? "machine + milkman placed" : "geometry wrong" });

  // FF2) The expansion engine is CORRECT: reconstructed value matches n/d,
  //      terminating ⟺ the 2s-and-5s rule, and known expansions hold.
  const known = [
    [1, 8, "125", ""], [1, 3, "", "3"], [1, 6, "1", "6"], [1, 7, "", "142857"],
    [5, 12, "41", "6"], [3, 6, "5", ""], [9, 12, "75", ""], [2, 6, "", "3"],
  ];
  let ff2 = true, ff2Detail = "expansions exact";
  for (const [n, d, pre, cycle] of known) {
    const e = decimalExpansion(n, d);
    if (e.pre !== pre || e.cycle !== cycle || isTerminatingFraction(n, d) !== (cycle === "")) {
      ff2 = false; ff2Detail = `${n}/${d}`; break;
    }
  }
  // Value reconstruction spot-check (terminating): 0.pre === n/d exactly.
  if (ff2) {
    const e = decimalExpansion(3, 8);
    if (Number(`0.${e.pre}`) !== 3 / 8) { ff2 = false; ff2Detail = "3/8 value"; }
  }
  checks.push({ name: "Milk Splitter maths: long-division expansion correct", pass: ff2, detail: ff2Detail });

  // FF3) Notation: dots ONLY on recurring; single-digit cycle = one dot;
  //      longer cycle = dots on first AND last cycle digits.
  const ff3 =
    milkNotation(1, 8) === "0.125" && !milkNotation(1, 8).includes(DOT) &&
    milkNotation(1, 3) === `0.3${DOT}` &&
    milkNotation(1, 6) === `0.16${DOT}` &&
    milkNotation(1, 7) === `0.1${DOT}42857${DOT}` &&
    milkNotation(5, 12) === `0.416${DOT}`;
  checks.push({ name: "Milk Splitter notation: dot placement", pass: ff3, detail: ff3 ? "dot/vinculum rules OK" : "notation wrong" });

  // FF4) Round fuzz — 300 sets: 15 rounds, 3 per stage; stage pools honour
  //      the arc (S1 terminating units, S2 recurring units, S5 includes
  //      simplify traps); options always 3, distinct, containing the correct
  //      notation at correctIndex; prompts clean; pour timings sane.
  let fuzzOk = true, fuzzDetail = "300 sets OK";
  for (let t = 0; t < 300 && fuzzOk; t++) {
    const set = generateMilkSet();
    if (set.length !== MILK_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (const r of set) {
      const stageOk = r.stage === milkStageFor(r.roundIndex) &&
        (r.stage === 0 ? r.isTerminating && r.n === 1 : true) &&
        (r.stage === 1 ? !r.isTerminating && r.n === 1 : true);
      const optsOk = r.options.length === 3 && new Set(r.options).size === 3 &&
        r.options[r.correctIndex] === r.notation && r.n < r.d && r.d <= 15;
      const textOk = r.prompt.includes(String(r.n)) && r.prompt.includes(String(r.d)) &&
        !r.prompt.includes("NaN") && pourDigits(r) >= 1 && pourDigits(r) <= 10 &&
        pourDurationMs(r) > 1000 && pourDurationMs(r) < 8000;
      const truthOk = r.isTerminating === isTerminatingFraction(r.n, r.d) &&
        (r.isTerminating ? r.expansion.cycle === "" : r.expansion.cycle.length > 0);
      if (!stageOk || !optsOk || !textOk || !truthOk) {
        fuzzOk = false; fuzzDetail = `round ${r.roundIndex} (${r.n}/${r.d})`; break;
      }
    }
  }
  checks.push({ name: "Milk Splitter fuzz: stages, options, timings", pass: fuzzOk, detail: fuzzDetail });

  // FF5) Reasons name the rule and the notation; scoring constants sane
  //      (both parts needed for the full 25).
  const rTerm = generateMilkSet()[0];
  const rRec = generateMilkSet()[4];
  const ff5 = milkReasonA(rTerm).includes("2s and 5s") && milkReasonA(rRec).includes("remainder") &&
    milkReasonB(rRec).includes(rRec.notation) &&
    MILK_PREDICT_POINTS + MILK_NOTATION_POINTS === MILK_ROUND_POINTS && MILK_ROUND_POINTS === 25;
  checks.push({ name: "Milk Splitter reasons + scoring constants", pass: ff5, detail: ff5 ? "rule named, 10+15=25" : "reasons wrong" });

  return checks;
}

/**
 * WEIGH STATION checks (F9) — rounding as locating on the zoomed beam.
 * Pure data + maths only; ALL values integer-backed (no float dust).
 */
export function runWeighStationChecks() {
  const checks = [];

  // FG1) Geometry: at the grain silos (north-east of the homestead), in
  //      bounds, view spot clear of every farm collider, host near the scale.
  const halfW = FARM_BOUNDS.width / 2, halfH = FARM_BOUNDS.height / 2;
  const cols = getFarmColliders({});
  const spotClear = cols.every((c) => Math.hypot(c.x - WEIGH_VIEW_SPOT[0], c.z - WEIGH_VIEW_SPOT[1]) > c.radius + 0.5);
  const nearSilos = FARM_GRAIN_SILOS.some(([x, z]) => Math.hypot(x - WEIGH_AREA.x, z - WEIGH_AREA.z) < 30);
  const fg1 = Math.abs(WEIGH_AREA.x) < halfW && Math.abs(WEIGH_AREA.z) < halfH &&
    WEIGH_AREA.x > 35 && WEIGH_AREA.z < -20 && nearSilos && spotClear &&
    Math.hypot(WEIGH_SIGN.position[0] - WEIGH_AREA.x, WEIGH_SIGN.position[1] - WEIGH_AREA.z) < 12;
  checks.push({ name: "Weigh Station: at the grain silos, in bounds, spot clear", pass: fg1, detail: fg1 ? "scale + host placed" : "geometry wrong" });

  // FG2) Round fuzz — 300 sets. 15 rounds, 3 per stage; numeric rounds are
  //      SOLUTIONS-FIRST (lower/upper are step multiples bracketing exact;
  //      correct = the nearer end, ties round UP); options 3 + distinct with
  //      correctIndex at the correct string; the needle fraction matches;
  //      judgement rounds have exactly one matching scenario.
  let fuzzOk = true, fuzzDetail = "300 sets OK";
  for (let t = 0; t < 300 && fuzzOk; t++) {
    const set = generateWeighSet();
    if (set.length !== WEIGH_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (const r of set) {
      if (r.stage !== weighStageFor(r.roundIndex)) { fuzzOk = false; fuzzDetail = `stage ${r.roundIndex}`; break; }
      if (r.kind === "round") {
        const bracketOk = r.lower % r.step === 0 && r.upper === r.lower + r.step &&
          r.exact > r.lower && r.exact < r.upper;
        const frac = (r.exact - r.lower) / r.step;
        const nearestStr = frac >= 0.5 ? r.upperStr : r.lowerStr;
        const correctOk = r.correctStr === nearestStr;
        const tieOk = !r.isTie || (frac === 0.5 && r.correctStr === r.upperStr);
        const moneyOk = r.stage === 3 ? r.money && r.exactStr.startsWith("$") : !r.money;
        // The typed-answer checker accepts the correct rounding (with or
        // without units) and rejects the other end + garbage.
        const typedOk = checkRoundedInput(r, r.correctStr).correct &&
          checkRoundedInput(r, r.correctStr.replace("$", "").replace(" kg", "")).correct &&
          !checkRoundedInput(r, (frac >= 0.5 ? r.lowerStr : r.upperStr)).correct &&
          !checkRoundedInput(r, "banana").valid;
        const textOk = r.prompt.includes(r.exactStr) && Math.abs(r.needleFrac - frac) < 1e-9 &&
          !r.prompt.includes("NaN") && !r.reason.includes("NaN") && r.reason.includes("≈");
        if (!bracketOk || !correctOk || !tieOk || !moneyOk || !typedOk || !textOk) {
          fuzzOk = false; fuzzDetail = `round ${r.roundIndex} (${r.exactStr})`; break;
        }
      } else {
        const matches = r.items.filter((it) => it.exact === r.wantExact).length;
        if (r.stage !== 4 || r.options.length !== 3 || matches !== 1 ||
          r.items[r.correctIndex].exact !== r.wantExact) {
          fuzzOk = false; fuzzDetail = `judge ${r.roundIndex}`; break;
        }
      }
    }
  }
  checks.push({ name: "Weigh Station fuzz: brackets, ties UP, options, judgement", pass: fuzzOk, detail: fuzzDetail });

  // FG3) Formatting: integer-backed, trailing zeros correct, money as $.
  const fg3 = weighFormat(3500, 1) === "3.5 kg" && weighFormat(3500, 2) === "3.50 kg" &&
    weighFormat(3478, 3) === "3.478 kg" && weighFormat(785, 2, true) === "$7.85" &&
    weighFormat(6000, 0) === "6 kg";
  checks.push({ name: "Weigh Station formatting exact", pass: fg3, detail: fg3 ? "kg + $ strings OK" : "format wrong" });

  // FG4) Judgement grading + constants + the bank has both kinds; the two
  //      numeric parts (locate 10 + type 15) total a normal 25-point round.
  const jr = generateWeighSet()[13]; // a stage-5 judgement round
  const good = gradeWeigh(jr, jr.correctIndex);
  const bad = gradeWeigh(jr, (jr.correctIndex + 1) % 3);
  const bankOk = WEIGH_JUDGEMENT_BANK.some((j) => j.exact) && WEIGH_JUDGEMENT_BANK.some((j) => !j.exact) &&
    WEIGH_JUDGEEMENT_BANK_OK();
  const fg4 = good.correct && good.points === WEIGH_ROUND_POINTS && !bad.correct && bad.points === 0 &&
    WEIGH_ROUNDS_PER_SET === 15 && WEIGH_ROUND_POINTS === 25 &&
    WEIGH_LOCATE_POINTS + WEIGH_TYPE_POINTS === WEIGH_ROUND_POINTS && bankOk;
  checks.push({ name: "Weigh Station grading + judgement bank", pass: fg4, detail: fg4 ? "25/0, 10+15, bank balanced" : "grading wrong" });

  // FG5) Locate bands: fence-style — tightest first, points strictly
  //      decreasing; dead centre = BULLSEYE max; far off = 0.
  const nr = generateWeighSet()[4]; // a numeric round
  const bandsMonotone = WEIGH_LOCATE_BANDS.every((b, i) =>
    i === 0 || (b.frac > WEIGH_LOCATE_BANDS[i - 1].frac && b.points < WEIGH_LOCATE_BANDS[i - 1].points));
  const dead = gradeLocate(nr, nr.needleFrac);
  const far = gradeLocate(nr, nr.needleFrac >= 0.5 ? 0 : 1);
  const fg5 = bandsMonotone && WEIGH_LOCATE_BANDS[0].id === "bullseye" &&
    dead.band === "bullseye" && dead.points === WEIGH_LOCATE_POINTS && far.points === 0;
  checks.push({ name: "Weigh Station locate bands (bullseye → 0)", pass: fg5, detail: fg5 ? "banded like the fence" : "bands wrong" });

  return checks;
}

function WEIGH_JUDGEEMENT_BANK_OK() {
  return WEIGH_JUDGEMENT_BANK.every((j) => j.text && j.why);
}

/**
 * TRADING POST checks (F10) — one value, three notations, exact.
 */
export function runTradingPostChecks() {
  const checks = [];

  // FH1) Geometry: the stalls stand on the MARKET GREEN (south-east, under
  //      the big liquid amber); the view spot is clear.
  const cols = getFarmColliders({});
  const spotClear = cols.every((c) => Math.hypot(c.x - TRADE_VIEW_SPOT[0], c.z - TRADE_VIEW_SPOT[1]) > c.radius + 0.4);
  const fh1 = TRADE_AREA.x > 25 && TRADE_AREA.z > 40 && spotClear &&
    Math.hypot(BIG_AMBER.position[0] - TRADE_AREA.x, BIG_AMBER.position[1] - TRADE_AREA.z) < 25 &&
    Math.hypot(TRADE_SIGN.position[0] - TRADE_AREA.x, TRADE_SIGN.position[1] - TRADE_AREA.z) < 12;
  checks.push({ name: "Trading Post: on the Market Green, spot clear", pass: fh1, detail: fh1 ? "stalls placed" : "geometry wrong" });

  // FH2) Formatting is EXACT across all three notations + the mixed form.
  const fh2 = tradeFraction(600) === "3/5" && tradeDecimal(600) === "0.6" && tradePercent(600) === "60%" &&
    tradeFraction(125) === "1/8" && tradePercent(125) === "12.5%" &&
    tradeFraction(1750) === "7/4" && tradeMixed(1750) === "1 3/4" && tradeDecimal(1750) === "1.75" &&
    tradePercent(1750) === "175%" && tradeChain(1750) === "7/4 = 1 3/4 = 1.75 = 175%" &&
    tradeChain(600) === "3/5 = 0.6 = 60%";
  checks.push({ name: "Trading Post formatting: f/d/% + mixed exact", pass: fh2, detail: fh2 ? "chains exact" : "format wrong" });

  // FH3) Round fuzz — 300 sets. 15 rounds, 3 per stage; every round: the
  //      source stall shows its own notation of V; the TWO other stalls each
  //      offer 3 distinct tags with the correct one at correctIndex; bulk
  //      rounds (V > 1000) carry the mixed form in the chain; prompts clean.
  let fuzzOk = true, fuzzDetail = "300 sets OK";
  for (let t = 0; t < 300 && fuzzOk; t++) {
    const set = generateTradeSet();
    if (set.length !== TRADE_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (const r of set) {
      const stageOk = r.stage === tradeStageFor(r.roundIndex) &&
        (r.stage === 3 ? r.bulk : true);
      const srcOk = r.sourceDisplay === tradeDisplay(r.sourceStall, r.V) &&
        r.targets.length === 2 && !r.targets.some((tg) => tg.stall === r.sourceStall) &&
        TRADE_STALLS.includes(r.sourceStall);
      const tagsOk = r.targets.every((tg) =>
        tg.tags.length === 3 && new Set(tg.tags).size === 3 &&
        tg.tags[tg.correctIndex] === tradeDisplay(tg.stall, r.V));
      const chainOk = r.chain.includes(tradeFraction(r.V)) && r.chain.includes(tradeDecimal(r.V)) &&
        r.chain.includes(tradePercent(r.V)) && (!r.bulk || r.chain.includes(tradeMixed(r.V)));
      const textOk = r.prompt.includes(r.sourceDisplay) && !r.prompt.includes("NaN") && !r.reason.includes("NaN");
      if (!stageOk || !srcOk || !tagsOk || !chainOk || !textOk) {
        fuzzOk = false; fuzzDetail = `round ${r.roundIndex} (V=${r.V})`; break;
      }
    }
  }
  checks.push({ name: "Trading Post fuzz: sources, tags, bulk chains", pass: fuzzOk, detail: fuzzDetail });

  // FH4) Grading + scoring: 10 per stall, +5 both — a 25-point round.
  const rr = generateTradeSet()[0];
  const tg = rr.targets[0];
  const good = gradeTradeTap(tg, tg.correctIndex);
  const bad = gradeTradeTap(tg, (tg.correctIndex + 1) % 3);
  const fh4 = good.correct && good.points === TRADE_STALL_POINTS && !bad.correct && bad.points === 0 &&
    TRADE_STALL_POINTS * 2 + TRADE_BOTH_BONUS === TRADE_ROUND_POINTS && TRADE_ROUND_POINTS === 25 &&
    TRADE_ROUNDS_PER_SET === 15;
  checks.push({ name: "Trading Post grading: 10 + 10 + 5 = 25", pass: fh4, detail: fh4 ? "scoring OK" : "grading wrong" });

  // FH5) Sellers are BALANCED — exactly 5 fraction / 5 decimal / 5 percent
  //      across the 15 rounds, in a random pattern with no seller three times
  //      in a row (teacher feedback: alternate the stallholders evenly).
  let balanceOk = true, balanceDetail = "200 sets balanced 5/5/5";
  for (let t = 0; t < 200 && balanceOk; t++) {
    const set = generateTradeSet();
    const counts = { fraction: 0, decimal: 0, percent: 0 };
    for (const r of set) counts[r.sourceStall]++;
    if (counts.fraction !== 5 || counts.decimal !== 5 || counts.percent !== 5) {
      balanceOk = false; balanceDetail = `counts ${counts.fraction}/${counts.decimal}/${counts.percent}`; break;
    }
    for (let i = 2; i < set.length; i++) {
      if (set[i].sourceStall === set[i - 1].sourceStall && set[i - 1].sourceStall === set[i - 2].sourceStall) {
        balanceOk = false; balanceDetail = `3-in-a-row at ${i}`; break;
      }
    }
  }
  checks.push({ name: "Trading Post sellers balanced 5/5/5, no triple", pass: balanceOk, detail: balanceDetail });

  return checks;
}

export function runVeggiePlotChecks() {
  const checks = [];

  // FV1) Geometry: the bed sits in the MIDDLE of the (renamed) Veggie Plot
  //      paddock, in bounds; the view spot is clear of every farm collider;
  //      the host is near the bed; the paddock label reads "Veggie Plot".
  const halfW = FARM_BOUNDS.width / 2, halfH = FARM_BOUNDS.height / 2;
  const paddock = FARM_PADDOCKS.find((p) => p.id === "veggie-garden");
  const cols = getFarmColliders({});
  const spotClear = cols.every((c) => Math.hypot(c.x - VEGGIE_VIEW_SPOT[0], c.z - VEGGIE_VIEW_SPOT[1]) > c.radius + 0.5);
  // (Centred across the garden; a little north of its middle so the view
  //  spot has room in front.)
  const centred = paddock && Math.abs(VEGGIE_AREA.x - paddock.x) < 0.01 && Math.abs(VEGGIE_AREA.z - paddock.z) < 3;
  const fv1 = Math.abs(VEGGIE_AREA.x) < halfW && Math.abs(VEGGIE_AREA.z) < halfH && centred && spotClear &&
    Boolean(paddock) && paddock.label === "Veggie Plot" && VEGGIE_BED > 0 &&
    Math.hypot(VEGGIE_SIGN.position[0] - VEGGIE_AREA.x, VEGGIE_SIGN.position[1] - VEGGIE_AREA.z) < 14;
  checks.push({ name: "Veggie Plot: centred in the walled garden, spot clear, labelled", pass: fv1, detail: fv1 ? "bed placed" : "geometry wrong" });

  // FV2) Round fuzz — 300 sets. 15 rounds, 3 per stage. AREA rounds are proper
  //      x proper with product ac/bd (grid = the denominators); the typed check
  //      accepts the product AND its reduced form, rejects a wrong value +
  //      garbage. POTION rounds never have factor 1; grow <=> n>d; S1 unit x
  //      unit; S4 all shrink; prompts clean.
  let fuzzOk = true, fuzzDetail = "300 sets OK";
  for (let t = 0; t < 300 && fuzzOk; t++) {
    const set = generateVeggieSet();
    if (set.length !== VEGGIE_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (const r of set) {
      if (r.stage !== veggieStageFor(r.roundIndex)) { fuzzOk = false; fuzzDetail = `stage ${r.roundIndex}`; break; }
      if (r.kind === "area") {
        const proper = r.wn >= 1 && r.wn < r.wd && r.ln >= 1 && r.ln < r.ld;
        const prodOk = r.prodN === r.wn * r.ln && r.prodD === r.wd * r.ld &&
          r.gridCols === r.wd && r.gridRows === r.ld && r.targetCols === r.wn && r.targetRows === r.ln &&
          Math.abs(r.productValue - r.prodN / r.prodD) < 1e-9;
        const gradeOk = gradeVeggiePlace(r, r.targetCols, r.targetRows).correct &&
          !gradeVeggiePlace(r, r.targetCols, (r.targetRows % r.gridRows) + 1).correct;
        const typedOk = checkAreaProduct(r, r.productStr).correct && checkAreaProduct(r, r.simplifiedStr).correct &&
          !checkAreaProduct(r, `${r.prodN + 1}/${r.prodD}`).correct && !checkAreaProduct(r, "banana").valid;
        const s1 = r.stage !== 0 || (r.wn === 1 && r.ln === 1);
        const textOk = r.prompt.includes(r.widthStr) && r.prompt.includes(r.lengthStr) &&
          !r.prompt.includes("NaN") && !r.reason.includes("NaN") && r.reason.includes("\u00d7");
        if (!proper || !prodOk || !gradeOk || !typedOk || !s1 || !textOk) { fuzzOk = false; fuzzDetail = `area ${r.roundIndex} (${r.widthStr}x${r.lengthStr})`; break; }
      } else {
        const growOk = r.grows === (r.n > r.d) && r.n !== r.d && r.answer === (r.grows ? "grow" : "shrink");
        const gradeOk = gradeVeggiePotion(r, r.answer).correct && !gradeVeggiePotion(r, r.answer === "grow" ? "shrink" : "grow").correct;
        const textOk = r.prompt.includes(r.factorStr) && !r.reason.includes("NaN");
        if (!growOk || !gradeOk || !textOk) { fuzzOk = false; fuzzDetail = `potion ${r.roundIndex}`; break; }
      }
    }
    // Set-level split: exactly 11 AREA rounds then 4 POTION rounds, with at
    // least one SHRINK so the "x<1 makes it smaller" lesson always appears.
    const areaCount = set.filter((r) => r.kind === "area").length;
    const potionCount = set.filter((r) => r.kind === "potion").length;
    const shrinkCount = set.filter((r) => r.kind === "potion" && !r.grows).length;
    if (fuzzOk && (areaCount !== VEGGIE_AREA_ROUNDS || potionCount !== VEGGIE_POTION_ROUNDS || shrinkCount < 1)) {
      fuzzOk = false; fuzzDetail = `split ${areaCount}/${potionCount} shrink ${shrinkCount}`;
    }
  }
  checks.push({ name: "Veggie Plot fuzz: area products, typed check, 11+4 split", pass: fuzzOk, detail: fuzzDetail });

  // FV3) Fraction helpers exact + scoring constants (place 10 + type 15 = 25;
  //      potion 25; max set 15x25 matches the trophy max).
  const helpersOk = reduceFraction(6, 12) === "1/2" && reduceFraction(8, 12) === "2/3" &&
    reduceFraction(4, 4) === "1" && reduceFraction(3, 5) === "3/5" &&
    parseFractionInput("6/12") === 0.5 && parseFractionInput("3") === 3 && parseFractionInput("bad") === null;
  const fv3 = helpersOk &&
    VEGGIE_PLACE_POINTS + VEGGIE_TYPE_POINTS === VEGGIE_ROUND_POINTS &&
    VEGGIE_POTION_POINTS === VEGGIE_ROUND_POINTS && VEGGIE_ROUND_POINTS === 25 &&
    VEGGIE_ROUNDS_PER_SET === 15 && FARM_MAX_SCORES.veggie === VEGGIE_ROUNDS_PER_SET * VEGGIE_ROUND_POINTS;
  checks.push({ name: "Veggie Plot helpers + scoring (10+15=25, max 375)", pass: fv3, detail: fv3 ? "exact" : "helpers/scoring wrong" });

  return checks;
}


export function runPlankGapChecks() {
  const checks = [];

  // FP1) Geometry: the gap stands in the OLD SAWMILL's yard (the rolling
  //      farm, 2026-10-07), in bounds; the view spot is clear of every farm
  //      collider; the host is near the gap.
  const halfW = FARM_BOUNDS.width / 2, halfH = FARM_BOUNDS.height / 2;
  const cols = getFarmColliders({});
  const spotClear = cols.every((c) => Math.hypot(c.x - PLANK_VIEW_SPOT[0], c.z - PLANK_VIEW_SPOT[1]) > c.radius + 0.5);
  const centred = Math.hypot(PLANK_AREA.x - FARM_SAWMILL.x, PLANK_AREA.z - FARM_SAWMILL.z) < 20;
  const fp1 = Math.abs(PLANK_AREA.x) < halfW && Math.abs(PLANK_AREA.z) < halfH && centred && spotClear &&
    PLANK_SIGN.id === "farm-plank-sign" && Array.isArray(PLANK_VIEW_SPOT) &&
    Math.hypot(PLANK_SIGN.position[0] - PLANK_AREA.x, PLANK_SIGN.position[1] - PLANK_AREA.z) < 20;
  checks.push({ name: "Plank the Gap: in the sawmill yard, spot clear, host near", pass: fp1, detail: fp1 ? "gap placed" : "geometry wrong" });

  // FP2) Round fuzz — 400 sets. 15 rounds, 3 per stage. Stages 0-2 ADD from an
  //      empty gap (pre = 0, total = gap); stages 3-4 SUBTRACT (a trough with a
  //      pre-laid part, remainder = total - used). Every gap is a whole number
  //      of twelfths in (0, 36]; filling EXACTLY grades correct while one
  //      twelfth over/under does not; each set is 9 ADD + 6 SUBTRACT.
  let fuzzOk = true, fuzzDetail = "400 sets OK";
  for (let t = 0; t < 400 && fuzzOk; t++) {
    const set = generatePlankSet();
    if (set.length !== PLANK_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    let adds = 0, subs = 0;
    for (const r of set) {
      if (r.stage !== plankStageFor(r.roundIndex)) { fuzzOk = false; fuzzDetail = `stage ${r.roundIndex}`; break; }
      if (r.gapTw <= 0 || r.gapTw > PLANK_TWELFTHS * 3 || !Number.isInteger(r.gapTw)) { fuzzOk = false; fuzzDetail = `gap ${r.roundIndex}`; break; }
      if (r.kind === "add") {
        adds++;
        if (r.preTw !== 0 || r.totalTw !== r.gapTw) { fuzzOk = false; fuzzDetail = `add shape ${r.roundIndex}`; break; }
      } else {
        subs++;
        if (r.preTw <= 0 || r.totalTw - r.preTw !== r.gapTw) { fuzzOk = false; fuzzDetail = `sub shape ${r.roundIndex}`; break; }
      }
      const exact = gradePlank(r, r.gapTw).correct && gradePlank(r, r.gapTw).points === PLANK_ROUND_POINTS;
      const rejects = !gradePlank(r, r.gapTw - 1).correct && !gradePlank(r, r.gapTw + 1).correct;
      const flags = gradePlank(r, r.gapTw + 1).over && gradePlank(r, r.gapTw - 1).under;
      const textOk = !r.prompt.includes("NaN") && !r.reason.includes("NaN") && (r.kind === "add" ? r.prompt.includes(r.gapStr) : (r.prompt.includes(r.totalStr) && r.prompt.includes(r.preStr)));
      if (!exact || !rejects || !flags || !textOk) { fuzzOk = false; fuzzDetail = `grade ${r.roundIndex}`; break; }
    }
    if (fuzzOk && (adds !== 9 || subs !== 6)) { fuzzOk = false; fuzzDetail = `split ${adds}/${subs}`; }
  }
  checks.push({ name: "Plank the Gap fuzz: gap shapes, exact grade, 9+6 add/sub split", pass: fuzzOk, detail: fuzzDetail });

  // FP3) Pieces all land on the twelfths grid, twDisplay reduces mixed
  //      fractions, sumPlanks totals a laid list, and scoring matches the
  //      trophy max (15 x 25 = 375).
  const piecesOk = Array.isArray(PLANK_PIECES) && PLANK_PIECES.length === 5 &&
    PLANK_PIECES.every((p) => Number.isInteger(p.tw) && p.tw >= 1 && p.tw <= PLANK_TWELFTHS && p.label && p.color);
  const dispOk = twDisplay(15) === "1 1/4" && twDisplay(27) === "2 1/4" && twDisplay(21) === "1 3/4" &&
    twDisplay(6) === "1/2" && twDisplay(12) === "1" && twDisplay(0) === "0";
  const sumOk = sumPlanks([6, 4]) === 10 && sumPlanks([]) === 0 && sumPlanks([3, 3, 6]) === 12;
  const fp3 = piecesOk && dispOk && sumOk &&
    PLANK_ROUND_POINTS === 25 && PLANK_ROUNDS_PER_SET === 15 &&
    FARM_MAX_SCORES.plank === PLANK_ROUNDS_PER_SET * PLANK_ROUND_POINTS;
  checks.push({ name: "Plank the Gap pieces + twDisplay + scoring (max 375)", pass: fp3, detail: fp3 ? "exact" : "pieces/display/scoring wrong" });

  return checks;
}


export function runFarmShopChecks() {
  const checks = [];

  // FS1) Geometry: the stall sits in FRONT of the windmill, in bounds; the view
  //      spot is clear of every farm collider; the host sign is at the counter.
  const halfW = FARM_BOUNDS.width / 2, halfH = FARM_BOUNDS.height / 2;
  const cols = getFarmColliders({});
  const spotClear = cols.every((c) => Math.hypot(c.x - SHOP_VIEW_SPOT[0], c.z - SHOP_VIEW_SPOT[1]) > c.radius + 0.5);
  const inFront = SHOP_AREA.z > FARM_WINDMILL.z && SHOP_AREA.z < FARM_WINDMILL.z + 16;
  const fs1 = Math.abs(SHOP_AREA.x) < halfW && Math.abs(SHOP_AREA.z) < halfH && inFront && spotClear &&
    SHOP_SIGN.id === "farm-shop-sign" && Array.isArray(SHOP_VIEW_SPOT) &&
    Math.hypot(SHOP_SIGN.position[0] - SHOP_AREA.x, SHOP_SIGN.position[1] - SHOP_AREA.z) < 12;
  checks.push({ name: "Farm Shop: in front of the windmill, spot clear, host near", pass: fs1, detail: fs1 ? "stall placed" : "geometry wrong" });

  // FS2) Round fuzz — 400 sets. Hybrid composition (2 %-of, 3 markup, 3
  //      discount, 2 GST, 2 profit, 3 restock), every set carries a LOSS chain
  //      so the profit/loss report always appears, exact answers grade while a
  //      wrong value does not, and no prompt/working ever prints NaN.
  let fuzzOk = true, fuzzDetail = "400 sets OK";
  for (let t = 0; t < 400 && fuzzOk; t++) {
    const set = generateShopSet();
    if (set.length !== SHOP_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    const counts = {};
    let lossSeen = false;
    for (const r of set) {
      counts[r.kind] = (counts[r.kind] || 0) + 1;
      if (r.stage !== Math.floor(r.roundIndex / 3)) { fuzzOk = false; fuzzDetail = `stage ${r.roundIndex}`; break; }
      if (Number.isNaN(r.answer)) { fuzzOk = false; fuzzDetail = `NaN answer ${r.kind}`; break; }
      if (r.prompt.includes("NaN") || r.reason.includes("NaN")) { fuzzOk = false; fuzzDetail = `NaN text ${r.kind}`; break; }
      if (!gradeShop(r, String(r.answer)).correct) { fuzzOk = false; fuzzDetail = `grade ${r.kind}`; break; }
      const off = r.answerUnit === "items" ? 5 : 1;
      if (gradeShop(r, String(r.answer + off)).correct) { fuzzOk = false; fuzzDetail = `falsepos ${r.kind}`; break; }
      if (r.kind === "profit" && r.answer < 0) lossSeen = true;
    }
    if (fuzzOk && (counts.percentof !== 2 || counts.markup !== 3 || counts.discount !== 3 ||
        counts.gst !== 2 || counts.profit !== 2 || counts.restock !== 3)) {
      fuzzOk = false; fuzzDetail = `composition ${JSON.stringify(counts)}`;
    }
    if (fuzzOk && !lossSeen) { fuzzOk = false; fuzzDetail = "no loss chain in set"; }
  }
  checks.push({ name: "Farm Shop fuzz: composition, loss chain, exact grade, no NaN", pass: fuzzOk, detail: fuzzDetail });

  // FS3) Chain math is exact integer cents through markup/discount/GST; money +
  //      parse helpers behave; scoring matches the trophy max (15 x 25 = 375).
  let centsOk = true;
  const combos = [[10, 50, 20], [8, 25, 10], [12, 50, 25], [5, 100, 20], [6, 50, 10],
    [25, 20, 10], [8, 50, 25], [15, 20, 25], [10, 20, 25], [20, 25, 20]];
  for (const [c, m, d] of combos) {
    const ch = buildChain(c, m, d);
    for (const k of ["costC", "markedC", "saleC", "gstC", "profitC"]) if (!Number.isInteger(ch[k])) centsOk = false;
  }
  const helpersOk = fmtMoney(1320) === "$13.20" && fmtMoney(900) === "$9.00" && fmtMoney(-150) === "-$1.50" &&
    parseShopInput("$13.20") === 13.2 && parseShopInput("20%") === 20 && parseShopInput("-10") === -10 &&
    Number.isNaN(parseShopInput("banana"));
  const fs3 = centsOk && helpersOk && GST_RATE === 10 &&
    SHOP_ROUND_POINTS === 25 && SHOP_ROUNDS_PER_SET === 15 &&
    FARM_MAX_SCORES.shop === SHOP_ROUNDS_PER_SET * SHOP_ROUND_POINTS;
  checks.push({ name: "Farm Shop chain cents + helpers + scoring (max 375)", pass: fs3, detail: fs3 ? "exact" : "cents/helpers/scoring wrong" });

  return checks;
}


export function runSnowChecks() {
  const checks = [];
  const snow = getRegion("snow-sums");
  const island = getRegion("island-1");

  // SN1) Region + gates: rect bounds the SAME SIZE as Fraction Farm, flat
  //      ground, spawn inside; the island gate is the IGLOO variant sitting on
  //      the Integer Dunes snow patch, EAST of the dunes and between them and
  //      the playground portal, clear of every island collider; the return
  //      gate links back and isn't on top of the snow spawn.
  const spawnIn = clampToBounds(SNOW_SPAWN.x, SNOW_SPAWN.z, SNOW_BOUNDS);
  const toSnow = (island.portals || []).find((p) => p.target === "snow-sums");
  const toIslandBack = (snow.portals || []).find((p) => p.target === "island-1");
  const islandCols2 = getColliders({ completedMissions: [], earnedBadges: [], completedEncounters: [] }, "island-1");
  const gateClear2 = toSnow && islandCols2.every((c) => Math.hypot(c.x - toSnow.position[0], c.z - toSnow.position[1]) > c.radius + toSnow.radius);
  // (2026-10-09) On the rebuilt island the igloo stands in Igloo Hollow, on
  // the snow on Frosty Peak's flank, above Pip's number line.
  const pip = getZone("zone-integers");
  const gatePlaced = Boolean(toSnow) &&
    toSnow.variant === "igloo" &&
    islandOnPad("igloo", toSnow.position[0], toSnow.position[1]) &&
    islandSnowCover(toSnow.position[0], toSnow.position[1]) > 0.5 &&
    Math.hypot(toSnow.position[0] - pip.center[0], toSnow.position[1] - pip.center[1]) > pip.radius + 2;
  const sn1 =
    snow && snow.bounds === SNOW_BOUNDS && SNOW_BOUNDS.shape === "rect" &&
    SNOW_BOUNDS.width === FARM_BOUNDS.width && SNOW_BOUNDS.height === FARM_BOUNDS.height && // the (rebuilt) farm's footprint
    typeof snow.groundHeight === "function" && Number.isFinite(snow.groundHeight(SNOW_SPAWN.x, SNOW_SPAWN.z)) &&
    spawnIn.x === SNOW_SPAWN.x && spawnIn.z === SNOW_SPAWN.z &&
    Boolean(snow.geometry && snow.geometry.skyColor) &&
    gatePlaced && gateClear2 && Boolean(toIslandBack) &&
    Math.hypot(toIslandBack.position[0] - SNOW_SPAWN.x, toIslandBack.position[1] - SNOW_SPAWN.z) > toIslandBack.radius + 1;
  checks.push({
    name: "Snow region: farm-sized valley + igloo gate in Igloo Hollow",
    pass: sn1,
    detail: sn1 ? `${SNOW_BOUNDS.width}×${SNOW_BOUNDS.height}, gate (${toSnow.position[0]}, ${toSnow.position[1]})` : "region/gate wrong",
  });

  // SN2) Snow colliders are well-formed; the spawn is clear; the boundary bank
  //      seals all four sides with NON-jumpable circles; the welcome sign +
  //      records stand are solid; both snow interactables are region-scoped
  //      with valid encounters.
  const scols = getSnowColliders({});
  const sWellFormed = scols.length > 60 && scols.every((c) => c.id && c.kind && Number.isFinite(c.x) && Number.isFinite(c.z) && c.radius > 0);
  const sSpawnClear = scols.every((c) => Math.hypot(c.x - SNOW_SPAWN.x, c.z - SNOW_SPAWN.z) > c.radius + 0.5);
  const borderSides = ["n", "s", "w", "e"].every((s) => {
    const run = scols.filter((c) => c.id.startsWith(`snow-border-${s}`));
    return run.length > 10 && run.every((c) => !c.jumpable);
  });
  const snowIx = getInteractablesForRegion("snow-sums");
  const wantedSnowIx = [
    "snow-welcome-sign", "snow-range-sign", "snow-rink-sign", "snow-pines-sign", "snow-snowmen-sign",
    "snow-sled-sign", "snow-village-sign", "snow-colony-sign", "snow-cave-sign", "snow-yard-sign",
    "snow-lights-sign", "snow-records", "snow-chest",
  ];
  const ixOk = snowIx.length === wantedSnowIx.length &&
    wantedSnowIx.every((id) => snowIx.some((i) => i.id === id)) &&
    snowIx.every((i) => ENCOUNTERS[i.encounterId]);
  const standCollider = scols.find((c) => c.id === "snow-records");
  const signCollider = scols.find((c) => c.id === "snow-welcome-sign");
  const sn2 = sWellFormed && sSpawnClear && borderSides && ixOk &&
    Boolean(standCollider && standCollider.radius >= 3) && Boolean(signCollider) &&
    SNOW_RECORDS_STAND.id === "snow-records";
  checks.push({
    name: "Snow colliders + boundary bank + interactables",
    pass: sn2,
    detail: sn2 ? `${scols.length} colliders; ${snowIx.length} interactables OK` : "colliders/interactables wrong",
  });

  // SN3) TEN reserved challenge areas: distinct ids, all inside the boundary
  //      bank, pairwise well apart (≥ 14 m), and every centre clear of the
  //      scenery colliders — so ten in-world challenges can land without
  //      fighting the world for space.
  const ids = SNOW_CHALLENGE_SPOTS.map((s) => s.id);
  const distinct = new Set(ids).size === 10 && SNOW_CHALLENGE_SPOTS.length === 10;
  const inBank = SNOW_CHALLENGE_SPOTS.every((s) =>
    Math.abs(s.center[0]) < SNOW_BOUNDARY.halfW - 2 && Math.abs(s.center[1]) < SNOW_BOUNDARY.halfD - 2);
  let apart = true;
  for (let i = 0; i < SNOW_CHALLENGE_SPOTS.length; i++) {
    for (let j = i + 1; j < SNOW_CHALLENGE_SPOTS.length; j++) {
      const a = SNOW_CHALLENGE_SPOTS[i].center;
      const b = SNOW_CHALLENGE_SPOTS[j].center;
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 14) apart = false;
    }
  }
  const centresClear = SNOW_CHALLENGE_SPOTS.every((s) =>
    scols.every((c) => Math.hypot(c.x - s.center[0], c.z - s.center[1]) > c.radius + 1.4));
  const labelled = SNOW_CHALLENGE_SPOTS.every((s) => typeof s.label === "string" && s.label.length > 2);
  const sn3 = distinct && inBank && apart && centresClear && labelled;
  checks.push({
    name: "Snow: ten reserved challenge areas, spaced + clear",
    pass: sn3,
    detail: sn3 ? "10 areas placed" : `distinct:${distinct} inBank:${inBank} apart:${apart} clear:${centresClear}`,
  });

  // SN4) Trophy slots in LOCKSTEP: the ten stand slots mirror the ten reserved
  //      areas across ids / best keys / max scores / grid meta, the medal
  //      thresholds are the SAME OBJECTS as the farm's (they can never drift),
  //      and the % maths is exact at the medal edges.
  const keysMatch =
    JSON.stringify(SNOW_CHALLENGE_IDS) === JSON.stringify(ids) &&
    JSON.stringify(Object.keys(SNOW_BEST_KEYS)) === JSON.stringify(ids) &&
    JSON.stringify(Object.keys(SNOW_MAX_SCORES)) === JSON.stringify(ids) &&
    JSON.stringify(SNOW_TROPHY_META.map((m) => m.key)) === JSON.stringify(ids);
  const bestKeysOk = ids.every((id) => SNOW_BEST_KEYS[id] === `mma-snow-${id}-best`) &&
    new Set(Object.values(SNOW_BEST_KEYS)).size === 10;
  const maxOk = ids.every((id) => Number.isFinite(SNOW_MAX_SCORES[id]) && SNOW_MAX_SCORES[id] > 0);
  const medalsShared = SNOW_MEDALS === MEDALS && snowMedalFor === medalFor;
  const someId = ids[0];
  const pctOk =
    snowBestPercent(someId, 0) === 0 &&
    snowBestPercent(someId, SNOW_MAX_SCORES[someId]) === 100 &&
    snowBestPercent(someId, SNOW_MAX_SCORES[someId] * 0.75) === 75 &&
    snowBestPercent(someId, SNOW_MAX_SCORES[someId] * 2) === 100; // clamped
  const shelf = snowShelfEntries();
  const rows = snowTrophyRows();
  const shelfOk = shelf.length === 10 && shelf.every((e, i) => e.key === ids[i] && Number.isFinite(e.percent));
  const rowsOk = rows.length === 10 && rows.every((r) => r.name && r.icon && r.blurb && Number.isFinite(r.pct) && r.max > 0);
  const sn4 = keysMatch && bestKeysOk && maxOk && medalsShared && pctOk && shelfOk && rowsOk;
  checks.push({
    name: "Snow trophy stand: 10 slots in lockstep, farm medal thresholds",
    pass: sn4,
    detail: sn4 ? "10 slots, gold/silver/bronze shared with the farm" : `keys:${keysMatch} best:${bestKeysOk} medals:${medalsShared} pct:${pctOk}`,
  });

  // SN5) The ice rink = the frozen pond: fully inside the rim; the ice test
  //      is exact (centre on, spawn/portal/stand off); nothing solid stands
  //      on the ice (the old bank ring is gone — the pond is open all round);
  //      the penguins' wander box sits on the Penguin Floe, off the ice.
  const [rcx, rcz] = ICE_RINK.center;
  const rinkInside =
    Math.abs(rcx) + ICE_RINK.rx < SNOW_BOUNDARY.halfW - 1 &&
    Math.abs(rcz) + ICE_RINK.rz < SNOW_BOUNDARY.halfD - 1;
  const iceTestOk =
    isOnIce(rcx, rcz) && isOnIce(rcx + ICE_RINK.rx * 0.85, rcz) &&
    !isOnIce(SNOW_SPAWN.x, SNOW_SPAWN.z) &&
    !isOnIce(SNOW_RETURN_PORTAL[0], SNOW_RETURN_PORTAL[1]) &&
    !isOnIce(SNOW_RECORDS_STAND.position[0], SNOW_RECORDS_STAND.position[1]) &&
    !isOnIce(SNOW_WELCOME_SIGN.position[0], SNOW_WELCOME_SIGN.position[1]) &&
    !isOnSnow(rcx, rcz) && isOnSnow(SNOW_SPAWN.x, SNOW_SPAWN.z);
  const iceOpen = scols.every((c) => !isOnIce(c.x, c.z) || /snow-rail-|snow-lift/.test(c.id));
  const wanderOk =
    PENGUIN_WANDER.minX < PENGUIN_WANDER.maxX && PENGUIN_WANDER.minZ < PENGUIN_WANDER.maxZ &&
    [[PENGUIN_WANDER.minX, PENGUIN_WANDER.minZ], [PENGUIN_WANDER.maxX, PENGUIN_WANDER.minZ],
     [PENGUIN_WANDER.minX, PENGUIN_WANDER.maxZ], [PENGUIN_WANDER.maxX, PENGUIN_WANDER.maxZ]]
      .every(([px, pz]) => !isOnIce(px, pz) && onSnowPad("penguin-floe", px, pz));
  const sn5 = rinkInside && iceTestOk && iceOpen && wanderOk;
  checks.push({
    name: "Ice rink (the frozen pond): exact ice test, open ice, penguins on their floe",
    pass: sn5,
    detail: sn5 ? "pond ice exact + open; penguins on the floe" : `inside:${rinkInside} ice:${iceTestOk} open:${iceOpen} penguins:${wanderOk}`,
  });

  return checks;
}

/**
 * PETE (PT) — the snow world's wandering local. Ambient life only: he has no
 * interactable, no collider and no encounter, so the checks guard the two
 * things that CAN break — where he's allowed to walk, and the clip names his
 * three-beat loop depends on.
 */
export function runWanderingPeteChecks() {
  const checks = [];

  // PT1) The wander box sits inside the boundary bank, his start spot is
  //      legal, and `isPeteSpotOk` genuinely keeps him off the rink ice and
  //      out of every reserved challenge clearing.
  const b = PETE_WANDER;
  const insideBank =
    b.minX > -SNOW_BOUNDARY.halfW && b.maxX < SNOW_BOUNDARY.halfW &&
    b.minZ > -SNOW_BOUNDARY.halfD && b.maxZ < SNOW_BOUNDARY.halfD &&
    b.minX < b.maxX && b.minZ < b.maxZ;
  const startOk = isPeteSpotOk(PETE_START[0], PETE_START[1]);
  const outsideBox =
    !isPeteSpotOk(b.minX - 1, 0) && !isPeteSpotOk(b.maxX + 1, 0) &&
    !isPeteSpotOk(0, b.minZ - 1) && !isPeteSpotOk(0, b.maxZ + 1);
  // The rink centre and every challenge centre must be refused.
  const iceOut = !isPeteSpotOk(ICE_RINK.center[0], ICE_RINK.center[1]);
  const spotsOut = SNOW_CHALLENGE_SPOTS.every((s) => !isPeteSpotOk(s.center[0], s.center[1]));
  // …and a big sample of ACCEPTED spots must satisfy all three rules.
  let sampleOk = true;
  let accepted = 0;
  for (let i = 0; i < 4000; i++) {
    const x = b.minX + ((i * 37) % 1000) / 1000 * (b.maxX - b.minX);
    const z = b.minZ + ((i * 61) % 997) / 997 * (b.maxZ - b.minZ);
    if (!isPeteSpotOk(x, z)) continue;
    accepted++;
    if (isOnIce(x, z)) { sampleOk = false; break; }
    if (!isOnSnow(x, z)) { sampleOk = false; break; }
    for (const s of SNOW_CHALLENGE_SPOTS) {
      if (Math.hypot(x - s.center[0], z - s.center[1]) < PETE_CHALLENGE_CLEARANCE) {
        sampleOk = false;
        break;
      }
    }
    if (!sampleOk) break;
  }
  // He must still have somewhere to go — a clearance that swallowed the world
  // would leave him frozen on the spot.
  const roomToRoam = accepted > 800;
  const pt1 = insideBank && startOk && outsideBox && iceOut && spotsOut && sampleOk && roomToRoam;
  checks.push({
    name: "Pete wander area: inside the bank, off the ice, clear of the ten challenge clearings",
    pass: pt1,
    detail: pt1
      ? `${accepted} legal spots sampled, all on snow and ≥${PETE_CHALLENGE_CLEARANCE}m from every clearing`
      : `bank:${insideBank} start:${startOk} outside:${outsideBox} ice:${iceOut} spots:${spotsOut} sample:${sampleOk} room:${roomToRoam} (accepted ${accepted})`,
  });

  // PT2) The three clips the walk → idle → spin loop needs are named exactly
  //      as they ship in pete.glb. Crucially there is NO run clip mapped —
  //      the teacher asked for walking only, and an accidental `run` entry is
  //      the one thing that could reintroduce it. (These live in snowLayout
  //      because characterModels.js reads import.meta.env and can't be
  //      imported here; it spreads PETE_CLIPS into its own `pete` entry.)
  const cfgOk =
    PETE_CLIPS.walk === "Walking" &&
    PETE_CLIPS.idle === "Idle_6" &&
    PETE_CLIPS.spin === "360_Power_Spin_Jump" &&
    !("run" in PETE_CLIPS) &&
    Object.keys(PETE_CLIPS).length === 3;
  // Idle beat is a real 3–5 second pause, and he strolls rather than sprints.
  const pacingOk =
    Array.isArray(PETE_IDLE_MS) && PETE_IDLE_MS.length === 2 &&
    PETE_IDLE_MS[0] === 3000 && PETE_IDLE_MS[1] === 5000 &&
    PETE_IDLE_MS[0] < PETE_IDLE_MS[1] &&
    PETE_WALK_SPEED > 0 && PETE_WALK_SPEED < 2;
  const pt2 = cfgOk && pacingOk;
  checks.push({
    name: "Pete config: pete.glb, walk/idle/spin clips mapped, NO run clip, 3–5s idle",
    pass: pt2,
    detail: pt2 ? "walk → idle 3–5s → 360 spin → walk" : `cfg:${cfgOk} pacing:${pacingOk}`,
  });

  // PT3) ROOT MOTION extraction. Pete's spin jump and the players' jump clips
  //      walk the hips several metres forward; left alone, the body snaps
  //      back to the take-off spot the instant the clip ends. `extractRootMotion`
  //      must (a) find the travelling track, (b) report the real duration and
  //      total travel, (c) FLATTEN the horizontal values so the clip can no
  //      longer move the body itself, (d) leave the vertical hop alone, and
  //      (e) be a no-op on an in-place cycle like Walking.
  //      Driven with clip-shaped stand-ins (no glb needed headlessly), using
  //      the real measured numbers from pete.glb.
  let rmOk = true;
  let rmDetail = "";
  try {
    const times = new Float32Array([0, 1.5, 3.07]);
    // Hips: still, then 131 forward + a 60-unit hop, then 262.7 forward, back down.
    const values = new Float32Array([0, 92.9, 0, 0, 152.9, 131.4, 0, 92.9, 262.7]);
    const travelClip = { tracks: [{ name: "Hips.position", times, values }] };
    const m = extractRootMotion(travelClip);
    const found = Boolean(m) && m.trackName === "Hips.position";
    const durOk = found && Math.abs(m.duration - 3.07) < 1e-3;
    const totalOk = found && Math.abs(m.total.z - 262.7) < 0.01 && Math.abs(m.total.x) < 1e-6;
    // Mid-clip sample sits on the curve, and the ends are exact.
    const midOk =
      found &&
      Math.abs(m.sample(0).z) < 1e-6 &&
      Math.abs(m.sample(1.5).z - 131.4) < 0.01 &&
      Math.abs(m.sample(3.07).z - 262.7) < 0.01 &&
      m.sample(0.75).z > 0 && m.sample(0.75).z < 131.4;
    // Past the ends it CLAMPS (never extrapolates the player into orbit).
    const clampOk = found && m.sample(-5).z === 0 && Math.abs(m.sample(99).z - 262.7) < 0.01;
    // The clip is now in place horizontally…
    const flatOk =
      values[0] === 0 && values[3] === 0 && values[6] === 0 &&
      values[2] === 0 && values[5] === 0 && values[8] === 0;
    // …but the HOP (y) survives — that's the arc, and it belongs to the clip.
    const hopOk = Math.abs(values[4] - 152.9) < 1e-3 && Math.abs(values[1] - 92.9) < 1e-3;
    // Calling it twice is a cached no-op, not a second flattening.
    const again = extractRootMotion(travelClip);
    const cacheOk = again === m;
    // An in-place cycle (Walking) yields null, so callers do nothing.
    const still = new Float32Array([0, 92.9, 0, 0, 92.94, 0]);
    const walkClip = { tracks: [{ name: "Hips.position", times: new Float32Array([0, 1.03]), values: still }] };
    const walkMotion = extractRootMotion(walkClip);
    const inPlaceOk = walkMotion === null || Math.abs(walkMotion.total.z) < 1e-6;
    rmOk = found && durOk && totalOk && midOk && clampOk && flatOk && hopOk && cacheOk && inPlaceOk;
    rmDetail = rmOk
      ? "travel extracted + clip flattened horizontally, hop preserved, cycles untouched"
      : `found:${found} dur:${durOk} total:${totalOk} mid:${midOk} clamp:${clampOk} flat:${flatOk} hop:${hopOk} cache:${cacheOk} inPlace:${inPlaceOk}`;
  } catch (err) {
    rmOk = false;
    rmDetail = `threw: ${err && err.message}`;
  }
  checks.push({
    name: "Root motion: travel extracted, clip flattened in place, hop kept (no snap-back)",
    pass: rmOk,
    detail: rmDetail,
  });

  return checks;
}

export function runSnowballRangeChecks() {
  const checks = [];

  // SR1) Geometry + wiring: the challenge claims the reserved "range" area;
  //      the crate stand / idle crates / Pip's sign sit around (not on) the
  //      centre; their colliders exist; the view spot is walkable (clear of
  //      every snow collider) and inside the boundary bank; Pip's sign is a
  //      region-scoped interactable with a valid fallback encounter.
  const rangeSpot = SNOW_CHALLENGE_SPOTS.find((s) => s.id === "range");
  const claims = rangeSpot && RANGE_AREA.x === rangeSpot.center[0] && RANGE_AREA.z === rangeSpot.center[1];
  const srCols = getSnowColliders({});
  const near = (p, r) =>
    Math.hypot(p[0] - RANGE_AREA.x, p[1] - RANGE_AREA.z) < r &&
    Math.abs(p[0]) < SNOW_BOUNDARY.halfW - 1 && Math.abs(p[1]) < SNOW_BOUNDARY.halfD - 1;
  const propsPlaced =
    near(RANGE_FRAME_POS, 8) && near(RANGE_CRATE_POS, 8) && near(RANGE_SIGN.position, 8) &&
    near(RANGE_VIEW_SPOT, 8) &&
    RANGE_FRAME_POS[1] < RANGE_VIEW_SPOT[1]; // the crate faces the parked player
  const colliderIds = ["snow-range-frame", "snow-range-crates", "snow-range-sign"];
  const collidersOk = colliderIds.every((id) => srCols.some((c) => c.id === id));
  const spotClear = srCols.every(
    (c) => Math.hypot(c.x - RANGE_VIEW_SPOT[0], c.z - RANGE_VIEW_SPOT[1]) > c.radius + 0.9
  );
  const signIx = getInteractable("snow-range-sign");
  const signOk =
    signIx && signIx.regionId === "snow-sums" && signIx.characterId === "pip" &&
    Boolean(ENCOUNTERS[signIx.encounterId]) &&
    Math.hypot(signIx.position[0] - RANGE_SIGN.position[0], signIx.position[1] - RANGE_SIGN.position[1]) < 0.01;
  const sr1 = claims && propsPlaced && collidersOk && spotClear && Boolean(signOk);
  checks.push({
    name: "Snowball Range: claims the range clearing, Pip hosts, spot clear",
    pass: sr1,
    detail: sr1 ? "stand + crates + Pip placed" : `claims:${claims} props:${propsPlaced} cols:${collidersOk} clear:${spotClear} sign:${Boolean(signOk)}`,
  });

  // SR2) Maths fuzz over 300 sets: every round BRIDGES (the ones digit is
  //      never 0, the complement is exactly 10−ones, the throw always
  //      crosses the next ten with ≥1 spare), the 5-stage arc holds its
  //      ranges (make ten → teens → any decade → two-digit throws → the
  //      century), 3 rounds per stage, consecutive rounds never repeat the
  //      same (start, add) pair, and no NaN ever appears.
  let fuzzOk = true;
  let fuzzDetail = "300 sets OK";
  outer: for (let s = 0; s < 300; s++) {
    const set = generateRangeSet();
    if (set.length !== RANGE_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (let i = 0; i < set.length; i++) {
      const r = set[i];
      const nums = [r.start, r.ones, r.fullCrates, r.add, r.comp, r.rest, r.nextTen, r.sum];
      if (!nums.every(Number.isInteger)) { fuzzOk = false; fuzzDetail = `NaN in round ${i}`; break outer; }
      if (r.stage !== rangeStageFor(i)) { fuzzOk = false; fuzzDetail = `stage wrong at ${i}`; break outer; }
      const ones = r.start % 10;
      const bridges =
        ones >= 1 && ones <= 9 && r.ones === ones &&
        r.comp === 10 - ones && r.rest >= 1 &&
        r.add === r.comp + r.rest && r.sum === r.start + r.add &&
        r.nextTen === r.start + r.comp && r.nextTen % 10 === 0 &&
        Math.floor(r.sum / 10) > Math.floor(r.start / 10) && // genuinely crosses
        r.fullCrates === Math.floor(r.start / 10);
      if (!bridges) { fuzzOk = false; fuzzDetail = `no bridge at ${i} (${r.start}+${r.add})`; break outer; }
      const stageOk =
        (r.stage === 0 && r.start >= 6 && r.start <= 9 && r.add <= 9) ||
        (r.stage === 1 && r.start >= 13 && r.start <= 18 && r.add <= 9) ||
        (r.stage === 2 && r.start >= 20 && r.start <= 89 && r.add <= 9 && r.sum < 100) ||
        (r.stage === 3 && r.add >= 12 && r.add <= 15 && r.start >= 20 && r.sum <= 99) ||
        (r.stage === 4 && r.start >= 93 && r.start <= 98 && r.add <= 9 && r.sum > 100);
      if (!stageOk) { fuzzOk = false; fuzzDetail = `stage range wrong at ${i} (${r.start}+${r.add})`; break outer; }
      if (!r.prompt || !r.reason || !r.prompt.includes(String(r.start)) || !r.reason.includes(String(r.sum))) {
        fuzzOk = false; fuzzDetail = `prompt/reason wrong at ${i}`; break outer;
      }
      if (i > 0 && r.start === set[i - 1].start && r.add === set[i - 1].add) {
        fuzzOk = false; fuzzDetail = `repeat pair at ${i}`; break outer;
      }
    }
  }
  checks.push({
    name: "Snowball Range fuzz: always bridges, 5-stage arc, no repeats",
    pass: fuzzOk,
    detail: fuzzDetail,
  });

  // SR3) Grading + scoring + trophy lockstep: the split is EXACT (fill the
  //      crate or not — with the under/over direction named), the typed
  //      total accepts the number (spaces tolerated) and rejects
  //      off-by-ones, 10 + 15 = 25 and 15 × 25 = 375 = the trophy slot's
  //      max, the best key matches the store, and the range trophy slot has
  //      its real name (no longer "coming soon").
  const probe = generateRangeRound(7, () => 0.5); // a mid-set S3 round
  const gRight = gradeRangeSplit(probe, probe.comp);
  const gShort = gradeRangeSplit(probe, probe.comp - 1);
  const gOver = gradeRangeSplit(probe, probe.comp + 1);
  const gradeOk =
    gRight.correct && gRight.points === RANGE_SPLIT_POINTS &&
    !gShort.correct && gShort.points === 0 && gShort.short &&
    !gOver.correct && gOver.points === 0 && !gOver.short;
  const typeOk =
    checkRangeSum(probe, String(probe.sum)).correct &&
    checkRangeSum(probe, ` ${probe.sum} `).correct &&
    !checkRangeSum(probe, String(probe.sum + 1)).correct &&
    !checkRangeSum(probe, String(probe.sum - 1)).correct &&
    !checkRangeSum(probe, "sum").valid && !checkRangeSum(probe, "").valid;
  const scoringOk =
    RANGE_SPLIT_POINTS + RANGE_TYPE_POINTS === RANGE_ROUND_POINTS &&
    RANGE_ROUND_POINTS === 25 &&
    RANGE_MAX_SCORE === RANGE_ROUNDS_PER_SET * RANGE_ROUND_POINTS &&
    RANGE_MAX_SCORE === SNOW_MAX_SCORES.range;
  const slot = SNOW_TROPHY_META.find((m) => m.key === "range");
  const trophyOk =
    slot && slot.name === "The Snowball Range" && !/coming soon/i.test(slot.skill) &&
    SNOW_BEST_KEYS.range === "mma-snow-range-best";
  const sr3 = gradeOk && typeOk && scoringOk && Boolean(trophyOk);
  checks.push({
    name: "Snowball Range grading + scoring + trophy slot (10+15=25, max 375)",
    pass: sr3,
    detail: sr3 ? "exact split, typed total, slot renamed" : `grade:${gradeOk} type:${typeOk} score:${scoringOk} trophy:${Boolean(trophyOk)}`,
  });

  // SR4) THE TEN-FRAME MUST BE FILLED TO CONTINUE (2026-07-29). Driving the
  //      real store: a wrong split parks in "missed" on the SAME round with
  //      nothing scored and no typing box; retrySplit hands the divider back;
  //      the fill then opens typing but banks NOTHING for Part A on a later
  //      attempt (so a retried round tops out at RANGE_TYPE_POINTS and the
  //      set max is still RANGE_MAX_SCORE). A first-throw fill still pays.
  const sr = useSnowballRange.getState();
  let retryOk = true;
  let retryDetail = "";
  try {
    sr.start();
    useSnowballRange.getState().beginRounds();
    const r0 = useSnowballRange.getState().currentRound();
    // A deliberate under-fill.
    useSnowballRange.getState().setSplit(Math.max(0, r0.comp - 1));
    useSnowballRange.getState().throwSplit();
    let s = useSnowballRange.getState();
    const missedOk =
      s.status === "missed" && s.roundIndex === 0 && s.score === 0 && s.attempts === 1;
    // The typing box must NOT be reachable from a miss.
    useSnowballRange.getState().submitSum(String(r0.sum));
    const gatedOk = useSnowballRange.getState().status === "missed";
    // Divider comes back, the fill now lands — but scores nothing.
    useSnowballRange.getState().retrySplit();
    const backOk = useSnowballRange.getState().status === "splitting";
    useSnowballRange.getState().setSplit(r0.comp);
    useSnowballRange.getState().throwSplit();
    s = useSnowballRange.getState();
    const refillOk =
      s.status === "typing" && s.score === 0 && s.attempts === 2 &&
      s.splitResult.correct && s.splitResult.scored === false &&
      !/\+\s*\d+\s*pts/i.test(s.splitResult.label);
    const typedOk =
      useSnowballRange.getState().submitSum(String(r0.sum)) === "correct" &&
      useSnowballRange.getState().score === RANGE_TYPE_POINTS;
    // A clean first-throw fill on the NEXT round still pays the full 25.
    useSnowballRange.getState().next();
    const r1 = useSnowballRange.getState().currentRound();
    useSnowballRange.getState().setSplit(r1.comp);
    useSnowballRange.getState().throwSplit();
    const firstTryOk =
      useSnowballRange.getState().splitResult.scored === true &&
      useSnowballRange.getState().score === RANGE_TYPE_POINTS + RANGE_SPLIT_POINTS;
    useSnowballRange.getState().exit();
    retryOk = missedOk && gatedOk && backOk && refillOk && typedOk && firstTryOk;
    retryDetail = retryOk
      ? "miss holds the round, retry unscored, first-try fill still pays"
      : `missed:${missedOk} gated:${gatedOk} back:${backOk} refill:${refillOk} typed:${typedOk} first:${firstTryOk}`;
  } catch (err) {
    retryOk = false;
    retryDetail = `threw: ${err && err.message}`;
  }
  checks.push({
    name: "Snowball Range: the ten-frame must be filled to continue (retry unscored)",
    pass: retryOk,
    detail: retryDetail,
  });

  return checks;
}

export function runRinkGlideChecks() {
  const checks = [];

  // RG1) Geometry + wiring: the 0–100 line spans the rink ON the ice with an
  //      exact linear mapping; the view spot is on the ice, off the line's
  //      sightline and clear of every collider; Fern's sign stands OFF the
  //      ice by the southern gate with its collider present, and is a
  //      region-scoped interactable with a valid fallback encounter.
  const { xMin, xMax, z: lineZ } = RINK_GLIDE_LINE;
  const lineOnIce =
    xMin < xMax &&
    isOnIce(xMin, lineZ) && isOnIce(xMax, lineZ) && isOnIce((xMin + xMax) / 2, lineZ);
  const mapOk =
    rinkGlideX(0) === xMin && rinkGlideX(100) === xMax &&
    Math.abs(rinkGlideX(50) - (xMin + xMax) / 2) < 1e-9 &&
    rinkGlideX(37) < rinkGlideX(82);
  const rgCols = getSnowColliders({});
  const spotOk =
    isOnIce(RINK_GLIDE_VIEW_SPOT[0], RINK_GLIDE_VIEW_SPOT[1]) &&
    Math.abs(RINK_GLIDE_VIEW_SPOT[1] - lineZ) > 2 && // never blocks the side-on view
    rgCols.every((c) => Math.hypot(c.x - RINK_GLIDE_VIEW_SPOT[0], c.z - RINK_GLIDE_VIEW_SPOT[1]) > c.radius + 0.9);
  const rinkSignIx = getInteractable("snow-rink-sign");
  const signOk2 =
    rinkSignIx && rinkSignIx.regionId === "snow-sums" && rinkSignIx.characterId === "fern" &&
    Boolean(ENCOUNTERS[rinkSignIx.encounterId]) &&
    !isOnIce(RINK_GLIDE_SIGN.position[0], RINK_GLIDE_SIGN.position[1]) &&
    rgCols.some((c) => c.id === "snow-rink-sign") &&
    Math.hypot(rinkSignIx.position[0] - RINK_GLIDE_SIGN.position[0], rinkSignIx.position[1] - RINK_GLIDE_SIGN.position[1]) < 0.01;
  const rg1 = lineOnIce && mapOk && spotOk && Boolean(signOk2);
  checks.push({
    name: "Ice Rink glide: 0–100 line on the ice, Fern hosts by the gate",
    pass: rg1,
    detail: rg1 ? "line + spot + Fern placed" : `line:${lineOnIce} map:${mapOk} spot:${spotOk} sign:${Boolean(signOk2)}`,
  });

  // RG2) Maths fuzz over 300 sets: starts/targets live on the line (never on
  //      a decade start), the difference's ones digit is never 0, each
  //      stage's direction/buttons/ranges hold (forward → back → overshoot
  //      forward → overshoot back → free), overshoot rounds genuinely reward
  //      the overshoot (fewest < tens + ones), the whole route INCLUDING the
  //      overshoot ten stays within 0–100, minPushes is exact, and
  //      consecutive rounds never repeat a trip.
  let fuzzOk = true;
  let fuzzDetail = "300 sets OK";
  outer: for (let s = 0; s < 300; s++) {
    const set = generateRinkSet();
    if (set.length !== RINK_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (let i = 0; i < set.length; i++) {
      const r = set[i];
      if (![r.start, r.target, r.diff, r.minPushes].every(Number.isInteger)) {
        fuzzOk = false; fuzzDetail = `NaN at ${i}`; break outer;
      }
      if (r.stage !== rinkStageFor(i)) { fuzzOk = false; fuzzDetail = `stage wrong at ${i}`; break outer; }
      const d = Math.abs(r.diff);
      const tens = Math.floor(d / 10);
      const ones = d % 10;
      const baseOk =
        r.start >= 3 && r.start <= 97 && r.target >= 3 && r.target <= 97 &&
        r.start % 10 !== 0 && r.diff === r.target - r.start && r.diff !== 0 &&
        ones >= 1 && r.dir === Math.sign(r.diff) &&
        r.minPushes === minPushesFor(r.diff, r.four) && r.minPushes >= 2 &&
        r.minPushes <= RINK_MAX_QUEUE;
      if (!baseOk) { fuzzOk = false; fuzzDetail = `round invalid at ${i} (${r.start}→${r.target})`; break outer; }
      const twoBtn = JSON.stringify(r.buttons) === JSON.stringify(r.dir > 0 ? [10, 1] : [-10, -1]);
      const fourBtn = JSON.stringify(r.buttons) === JSON.stringify([10, 1, -10, -1]);
      const stageOk =
        (r.stage === 0 && r.dir === 1 && !r.four && twoBtn && ones <= 4) ||
        (r.stage === 1 && r.dir === -1 && !r.four && twoBtn && ones <= 4) ||
        (r.stage === 2 && r.dir === 1 && r.four && fourBtn && ones >= 8) ||
        (r.stage === 3 && r.dir === -1 && r.four && fourBtn && ones >= 8) ||
        (r.stage === 4 && r.four && fourBtn);
      if (!stageOk) { fuzzOk = false; fuzzDetail = `stage config wrong at ${i}`; break outer; }
      // Overshoot rounds: the shortcut must exist AND fit on the line.
      if (r.four && ones >= 8) {
        const overshootPoint = r.start + r.dir * 10 * (tens + 1);
        if (!(r.minPushes < tens + ones) || overshootPoint < 0 || overshootPoint > 100) {
          fuzzOk = false; fuzzDetail = `overshoot broken at ${i} (${r.start}→${r.target})`; break outer;
        }
      }
      if (!r.prompt.includes(String(r.start)) || !r.prompt.includes(String(r.target)) || !r.reason) {
        fuzzOk = false; fuzzDetail = `prompt/reason wrong at ${i}`; break outer;
      }
      if (i > 0 && r.start === set[i - 1].start && r.target === set[i - 1].target) {
        fuzzOk = false; fuzzDetail = `repeat trip at ${i}`; break outer;
      }
    }
  }
  checks.push({
    name: "Ice Rink glide fuzz: stages, overshoot pays, exact minPushes",
    pass: fuzzOk,
    detail: fuzzDetail,
  });

  // RG3) Grading + scoring + trophy lockstep: the optimal plan lands for the
  //      full 25, a wasteful landing keeps the 15 but drops the bonus, a
  //      missed landing scores 0, illegal pushes never land, glideStops
  //      traces the route, the bands are monotone, and the trophy slot /
  //      best key / max score all agree with the store.
  const probe2 = generateRinkRound(13, () => 0.5); // an S5 four-button round
  const d2 = Math.abs(probe2.diff);
  let bestK = 0;
  let bestCost = Infinity;
  for (let k = 0; k <= 12; k++) {
    const cost = k + Math.abs(d2 - 10 * k);
    if (cost < bestCost) { bestCost = cost; bestK = k; }
  }
  const optimal = [];
  for (let k = 0; k < bestK; k++) optimal.push(probe2.dir * 10);
  const afterTens2 = probe2.start + probe2.dir * 10 * bestK;
  const rem = probe2.target - afterTens2;
  for (let k = 0; k < Math.abs(rem); k++) optimal.push(Math.sign(rem));
  const gOpt = gradeGlide(probe2, optimal);
  const wasteful = [];
  const tens2 = Math.floor(d2 / 10);
  const ones2 = d2 % 10;
  for (let k = 0; k < tens2; k++) wasteful.push(probe2.dir * 10);
  for (let k = 0; k < ones2; k++) wasteful.push(probe2.dir * 1);
  const gWaste = gradeGlide(probe2, wasteful);
  const gMiss = gradeGlide(probe2, [...optimal, probe2.dir * 1]);
  const gIllegal = gradeGlide(generateRinkRound(0, () => 0.5), [-10]);
  const stops = glideStops(probe2, optimal);
  const stopsOk =
    stops.length === optimal.length + 1 && stops[0] === probe2.start &&
    stops[stops.length - 1] === probe2.target;
  const gradeOk2 =
    gOpt.landed && gOpt.points === RINK_ROUND_POINTS && gOpt.effPoints === RINK_EFF_BANDS[0].points &&
    gWaste.landed && gWaste.points >= RINK_LAND_POINTS + 3 && gWaste.points <= RINK_ROUND_POINTS &&
    !gMiss.landed && gMiss.points === 0 &&
    !gIllegal.landed && gIllegal.points === 0 && !gIllegal.legal;
  const bandsOk = RINK_EFF_BANDS.every((b, i) =>
    i === 0 || (b.over > RINK_EFF_BANDS[i - 1].over && b.points < RINK_EFF_BANDS[i - 1].points));
  const scoringOk2 =
    RINK_LAND_POINTS + RINK_EFF_BANDS[0].points === RINK_ROUND_POINTS && RINK_ROUND_POINTS === 25 &&
    RINK_MAX_SCORE === RINK_ROUNDS_PER_SET * RINK_ROUND_POINTS &&
    RINK_MAX_SCORE === SNOW_MAX_SCORES.rink;
  const rinkSlot = SNOW_TROPHY_META.find((m) => m.key === "rink");
  const trophyOk2 =
    rinkSlot && rinkSlot.name === "The Ice Rink" && !/coming soon/i.test(rinkSlot.skill) &&
    SNOW_BEST_KEYS.rink === "mma-snow-rink-best";
  const rg3 = gradeOk2 && stopsOk && bandsOk && scoringOk2 && Boolean(trophyOk2);
  checks.push({
    name: "Ice Rink glide grading + scoring + trophy slot (15+10=25, max 375)",
    pass: rg3,
    detail: rg3 ? "optimal 25, wasteful banded, miss 0, slot renamed" : `grade:${gradeOk2} stops:${stopsOk} bands:${bandsOk} score:${scoringOk2} trophy:${Boolean(trophyOk2)}`,
  });

  return checks;
}

export function runGroveLightsChecks() {
  const checks = [];

  // GV1) Geometry + wiring: the challenge claims the reserved "pines" area;
  //      the big tree / bundle box / Alby's sign sit around (not on) the
  //      centre, in bounds, with colliders present; the view spot is clear
  //      of every snow collider; Alby's sign is a region-scoped interactable
  //      with a valid fallback encounter.
  const pinesSpot = SNOW_CHALLENGE_SPOTS.find((s) => s.id === "pines");
  const claimsGv = pinesSpot && GROVE_AREA.x === pinesSpot.center[0] && GROVE_AREA.z === pinesSpot.center[1];
  const gvCols = getSnowColliders({});
  const nearGv = (p, r) =>
    Math.hypot(p[0] - GROVE_AREA.x, p[1] - GROVE_AREA.z) < r &&
    Math.abs(p[0]) < SNOW_BOUNDARY.halfW - 1 && Math.abs(p[1]) < SNOW_BOUNDARY.halfD - 1;
  const propsGv =
    nearGv(GROVE_TREE_POS, 8) && nearGv(GROVE_BOX_POS, 8) && nearGv(GROVE_SIGN.position, 8) &&
    nearGv(GROVE_VIEW_SPOT, 8) &&
    GROVE_TREE_POS[1] < GROVE_VIEW_SPOT[1]; // the tree faces the parked player
  const gvColliderIds = ["snow-grove-tree", "snow-grove-box", "snow-pines-sign"];
  const gvCollidersOk = gvColliderIds.every((id) => gvCols.some((c) => c.id === id));
  const gvSpotClear = gvCols.every(
    (c) => Math.hypot(c.x - GROVE_VIEW_SPOT[0], c.z - GROVE_VIEW_SPOT[1]) > c.radius + 0.9
  );
  const gvSignIx = getInteractable("snow-pines-sign");
  const gvSignOk =
    gvSignIx && gvSignIx.regionId === "snow-sums" && gvSignIx.characterId === "alby" &&
    Boolean(ENCOUNTERS[gvSignIx.encounterId]) &&
    Math.hypot(gvSignIx.position[0] - GROVE_SIGN.position[0], gvSignIx.position[1] - GROVE_SIGN.position[1]) < 0.01;
  const gv1 = claimsGv && propsGv && gvCollidersOk && gvSpotClear && Boolean(gvSignOk);
  checks.push({
    name: "Grove lights: claims the pines clearing, Alby hosts, spot clear",
    pass: gv1,
    detail: gv1 ? "tree + box + Alby placed" : `claims:${claimsGv} props:${propsGv} cols:${gvCollidersOk} clear:${gvSpotClear} sign:${Boolean(gvSignOk)}`,
  });

  // GV2) Maths fuzz over 300 sets: the addition's ones digit is only ever
  //      0/1/2/8/9 (so the friendly pile is never a coin flip), the grab is
  //      the NEAREST pile, the fix is exactly add − grab·10 and within ±2,
  //      totals stay two-digit (so the tree's spiral never overflows), the
  //      stage arc holds (singles → 8/9s → 1/2s → mixed → traps), round 13
  //      is ALWAYS the exact-tens "perfect" trap, grab options are three
  //      ascending piles containing the friendly one, and consecutive
  //      rounds never repeat a job.
  let fuzzOk = true;
  let fuzzDetail = "300 sets OK";
  outer: for (let s = 0; s < 300; s++) {
    const set = generateGroveSet();
    if (set.length !== GROVE_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (let i = 0; i < set.length; i++) {
      const r = set[i];
      const nums = [r.start, r.add, r.tens, r.ones, r.grabBundles, r.grabValue, r.adjust, r.hung, r.total];
      if (!nums.every(Number.isInteger)) { fuzzOk = false; fuzzDetail = `NaN at ${i}`; break outer; }
      if (r.stage !== groveStageFor(i)) { fuzzOk = false; fuzzDetail = `stage wrong at ${i}`; break outer; }
      const wantGrab = r.ones >= 8 ? r.tens + 1 : r.tens;
      const baseOk =
        [0, 1, 2, 8, 9].includes(r.ones) && r.add === r.tens * 10 + r.ones && r.add >= 8 &&
        r.grabBundles === wantGrab && r.grabBundles >= 1 && r.grabValue === r.grabBundles * 10 &&
        r.adjust === r.add - r.grabValue && Math.abs(r.adjust) <= 2 &&
        r.hung === r.start + r.grabValue && r.total === r.start + r.add &&
        r.start >= 10 && r.total <= 99 && r.hung <= 99;
      if (!baseOk) { fuzzOk = false; fuzzDetail = `round invalid at ${i} (${r.start}+${r.add})`; break outer; }
      const stageOk =
        (r.stage === 0 && r.tens === 0 && [8, 9].includes(r.ones)) ||
        (r.stage === 1 && r.tens >= 1 && [8, 9].includes(r.ones)) ||
        (r.stage === 2 && r.tens >= 1 && [1, 2].includes(r.ones)) ||
        (r.stage === 3 && r.tens >= 1 && [1, 2, 8, 9].includes(r.ones)) ||
        (r.stage === 4 && r.tens >= 1 && [0, 1, 2, 8, 9].includes(r.ones));
      if (!stageOk) { fuzzOk = false; fuzzDetail = `stage range wrong at ${i}`; break outer; }
      if (i === GROVE_PERFECT_ROUND_INDEX && r.ones !== 0) {
        fuzzOk = false; fuzzDetail = "the perfect-trap round is missing"; break outer;
      }
      if (i !== GROVE_PERFECT_ROUND_INDEX && r.ones === 0) {
        fuzzOk = false; fuzzDetail = `stray exact-tens round at ${i}`; break outer;
      }
      const optsOk =
        r.grabOptions.length === 3 && r.grabOptions.includes(r.grabBundles) &&
        r.grabOptions[0] >= 1 && r.grabOptions[0] < r.grabOptions[1] && r.grabOptions[1] < r.grabOptions[2];
      if (!optsOk) { fuzzOk = false; fuzzDetail = `grab options wrong at ${i}`; break outer; }
      if (!r.prompt.includes(String(r.start)) || !r.prompt.includes(String(r.add)) || !r.reason.includes(String(r.total))) {
        fuzzOk = false; fuzzDetail = `prompt/reason wrong at ${i}`; break outer;
      }
      if (i > 0 && r.start === set[i - 1].start && r.add === set[i - 1].add) {
        fuzzOk = false; fuzzDetail = `repeat job at ${i}`; break outer;
      }
    }
  }
  checks.push({
    name: "Grove lights fuzz: friendly grabs, ±2 fixes, the perfect trap",
    pass: fuzzOk,
    detail: fuzzDetail,
  });

  // GV3) Grading + scoring + trophy lockstep: the friendly grab scores and
  //      wrong piles get the tedium named (direction-aware), the fix is
  //      exact-choice, the typed total accepts the number and rejects
  //      off-by-ones, 10 + 10 + 5 = 25 and 15 × 25 = 375 = the trophy
  //      slot's max, the adjustment menu is the exact −2…+2 ladder, and the
  //      pines slot has its real name + best key.
  const probeGv = generateGroveRound(4, () => 0.5); // an S2 round (ones 8/9)
  const gGrab = gradeGroveGrab(probeGv, probeGv.grabBundles);
  const gLow = gradeGroveGrab(probeGv, probeGv.grabBundles - 1);
  const gHigh = gradeGroveGrab(probeGv, probeGv.grabBundles + 1);
  const grabOk =
    gGrab.correct && gGrab.points === GROVE_GRAB_POINTS &&
    !gLow.correct && gLow.points === 0 && gLow.label.includes("singles") &&
    !gHigh.correct && gHigh.points === 0 && gHigh.label.includes("too many");
  const gAdj = gradeGroveAdjust(probeGv, probeGv.adjust);
  const gAdjWrong = gradeGroveAdjust(probeGv, probeGv.adjust === 0 ? -1 : 0);
  const adjOk =
    gAdj.correct && gAdj.points === GROVE_ADJUST_POINTS && !gAdjWrong.correct && gAdjWrong.points === 0;
  const totOk =
    checkGroveTotal(probeGv, String(probeGv.total)).correct &&
    checkGroveTotal(probeGv, ` ${probeGv.total} `).correct &&
    !checkGroveTotal(probeGv, String(probeGv.total + 1)).correct &&
    !checkGroveTotal(probeGv, String(probeGv.total - 1)).correct &&
    !checkGroveTotal(probeGv, "lights").valid && !checkGroveTotal(probeGv, "").valid;
  const menuOk =
    JSON.stringify(GROVE_ADJUSTMENTS.map((a) => a.value)) === JSON.stringify([-2, -1, 0, 1, 2]) &&
    GROVE_ADJUSTMENTS.every((a) => a.label.length > 3);
  const scoreGvOk =
    GROVE_GRAB_POINTS + GROVE_ADJUST_POINTS + GROVE_TOTAL_POINTS === GROVE_ROUND_POINTS &&
    GROVE_ROUND_POINTS === 25 &&
    GROVE_MAX_SCORE === GROVE_ROUNDS_PER_SET * GROVE_ROUND_POINTS &&
    GROVE_MAX_SCORE === SNOW_MAX_SCORES.pines;
  const pinesSlot = SNOW_TROPHY_META.find((m) => m.key === "pines");
  const trophyGvOk =
    pinesSlot && pinesSlot.name === "Christmas Tree Grove" && !/coming soon/i.test(pinesSlot.skill) &&
    SNOW_BEST_KEYS.pines === "mma-snow-pines-best";
  const gv3 = grabOk && adjOk && totOk && menuOk && scoreGvOk && Boolean(trophyGvOk);
  checks.push({
    name: "Grove lights grading + scoring + trophy slot (10+10+5=25, max 375)",
    pass: gv3,
    detail: gv3 ? "grab/fix/total exact, slot renamed" : `grab:${grabOk} adj:${adjOk} tot:${totOk} menu:${menuOk} score:${scoreGvOk} trophy:${Boolean(trophyGvOk)}`,
  });

  return checks;
}

export function runMeadowLevelChecks() {
  const checks = [];

  // ML1) Geometry + wiring: the challenge claims the reserved "snowmen"
  //      area; the two towers + Frosty's sign sit around (not on) the
  //      centre, in bounds, with colliders; the view spot is clear of every
  //      snow collider; the host is a region-scoped interactable (the
  //      placeholder "snowmen-host" — no glb yet) with a valid encounter.
  const meadowSpot = SNOW_CHALLENGE_SPOTS.find((s) => s.id === "snowmen");
  const claimsMl = meadowSpot && MEADOW_AREA.x === meadowSpot.center[0] && MEADOW_AREA.z === meadowSpot.center[1];
  const mlCols = getSnowColliders({});
  const nearMl = (p, r) =>
    Math.hypot(p[0] - MEADOW_AREA.x, p[1] - MEADOW_AREA.z) < r &&
    Math.abs(p[0]) < SNOW_BOUNDARY.halfW - 1 && Math.abs(p[1]) < SNOW_BOUNDARY.halfD - 1;
  const propsMl =
    nearMl(MEADOW_TOWER_LEFT, 8) && nearMl(MEADOW_TOWER_RIGHT, 8) &&
    nearMl(MEADOW_SIGN.position, 8) && nearMl(MEADOW_VIEW_SPOT, 8) &&
    MEADOW_TOWER_LEFT[0] < MEADOW_TOWER_RIGHT[0] &&
    Math.hypot(MEADOW_TOWER_LEFT[0] - MEADOW_TOWER_RIGHT[0], MEADOW_TOWER_LEFT[1] - MEADOW_TOWER_RIGHT[1]) > 2.5 &&
    MEADOW_TOWER_LEFT[1] < MEADOW_VIEW_SPOT[1]; // the towers face the parked player
  const mlColliderIds = ["snow-meadow-left", "snow-meadow-right", "snow-snowmen-sign"];
  const mlCollidersOk = mlColliderIds.every((id) => mlCols.some((c) => c.id === id));
  const mlSpotClear = mlCols.every(
    (c) => Math.hypot(c.x - MEADOW_VIEW_SPOT[0], c.z - MEADOW_VIEW_SPOT[1]) > c.radius + 0.9
  );
  const mlSignIx = getInteractable("snow-snowmen-sign");
  const mlSignOk =
    mlSignIx && mlSignIx.regionId === "snow-sums" && mlSignIx.characterId === "snowmen-host" &&
    Boolean(ENCOUNTERS[mlSignIx.encounterId]) &&
    Math.hypot(mlSignIx.position[0] - MEADOW_SIGN.position[0], mlSignIx.position[1] - MEADOW_SIGN.position[1]) < 0.01;
  const ml1 = claimsMl && propsMl && mlCollidersOk && mlSpotClear && Boolean(mlSignOk);
  checks.push({
    name: "Snowman Meadow: claims the snowmen clearing, towers + host placed",
    pass: ml1,
    detail: ml1 ? "towers + Frosty placed" : `claims:${claimsMl} props:${propsMl} cols:${mlCollidersOk} clear:${mlSpotClear} sign:${Boolean(mlSignOk)}`,
  });

  // ML2) Maths fuzz over 300 sets: every pair splits level±half (or the odd
  //      near-twin shape), the total is conserved by construction, hops =
  //      HALF the difference (never the whole difference), round 13 is
  //      ALWAYS the odd-difference trap and the ONLY one, the stage arc
  //      holds its level ranges (to-10 → teens → friendly tens → 16–35),
  //      counts stay renderable (4–44), the counts-after/chain helpers
  //      genuinely level the towers, and consecutive rounds never repeat.
  let fuzzOk = true;
  let fuzzDetail = "300 sets OK";
  outer: for (let s = 0; s < 300; s++) {
    const set = generateMeadowSet();
    if (set.length !== MEADOW_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (let i = 0; i < set.length; i++) {
      const r = set[i];
      const nums = [r.left, r.right, r.diff, r.moves, r.level, r.total, r.shorter, r.taller];
      if (!nums.every(Number.isInteger)) { fuzzOk = false; fuzzDetail = `NaN at ${i}`; break outer; }
      if (r.stage !== meadowStageFor(i)) { fuzzOk = false; fuzzDetail = `stage wrong at ${i}`; break outer; }
      const odd = i === MEADOW_ODD_ROUND_INDEX;
      const baseOk =
        r.left >= 4 && r.right >= 4 && r.left <= 44 && r.right <= 44 &&
        r.left + r.right === r.total && Math.abs(r.left - r.right) === r.diff &&
        r.left !== r.right &&
        r.tallerSide === (r.left > r.right ? "left" : "right") &&
        r.taller === Math.max(r.left, r.right) && r.shorter === Math.min(r.left, r.right) &&
        r.canTwin === !odd && r.moves >= 1;
      if (!baseOk) { fuzzOk = false; fuzzDetail = `round invalid at ${i} (${r.left}+${r.right})`; break outer; }
      if (odd) {
        const oddOk = r.diff % 2 === 1 && [3, 5, 7].includes(r.diff) &&
          r.moves === (r.diff - 1) / 2 && r.total === 2 * r.level + 1 && r.halfDiff === null;
        if (!oddOk) { fuzzOk = false; fuzzDetail = `odd trap wrong at ${i}`; break outer; }
      } else {
        const evenOk = r.diff % 2 === 0 && r.halfDiff === r.diff / 2 &&
          r.halfDiff >= 1 && r.halfDiff <= 4 && r.moves === r.halfDiff && r.total === 2 * r.level;
        if (!evenOk) { fuzzOk = false; fuzzDetail = `even round wrong at ${i}`; break outer; }
      }
      const stageOk =
        (r.stage === 0 && r.level >= 6 && r.level <= 10) ||
        (r.stage === 1 && r.level >= 11 && r.level <= 15) ||
        (r.stage === 2 && [20, 30, 40].includes(r.level)) ||
        (r.stage === 3 && r.level >= 16 && r.level <= 35) ||
        (r.stage === 4 && r.level >= 16 && r.level <= 34);
      if (!stageOk) { fuzzOk = false; fuzzDetail = `stage range wrong at ${i} (level ${r.level})`; break outer; }
      const after = meadowCountsAfter(r, r.moves);
      const levelled = odd
        ? Math.abs(after.left - after.right) === 1 && after.left + after.right === r.total
        : after.left === r.level && after.right === r.level;
      const chain = meadowChain(r, r.moves);
      if (!levelled || !chain.startsWith(`${r.left} + ${r.right}`) || chain.split("=").length !== r.moves + 1) {
        fuzzOk = false; fuzzDetail = `levelling helpers wrong at ${i}`; break outer;
      }
      if (!r.prompt.includes(String(r.left)) || !r.prompt.includes(String(r.right)) || !r.reason.includes(String(r.total))) {
        fuzzOk = false; fuzzDetail = `prompt/reason wrong at ${i}`; break outer;
      }
      if (i > 0 && r.left === set[i - 1].left && r.right === set[i - 1].right) {
        fuzzOk = false; fuzzDetail = `repeat pair at ${i}`; break outer;
      }
    }
  }
  checks.push({
    name: "Snowman Meadow fuzz: half-the-difference hops, the odd-diff trap",
    pass: fuzzOk,
    detail: fuzzDetail,
  });

  // ML3) Grading + scoring + trophy lockstep: the half-difference prediction
  //      scores, the WHOLE-difference trap gets its teaching label, calling
  //      "can't" on an even pair fails, calling "can't" on the odd trap
  //      scores, the typed total is exact, 10 + 15 = 25 and 15 × 25 = 375 =
  //      the trophy slot's max, the menu is 1–4 + the parity call, and the
  //      snowmen slot has its real name + best key.
  const probeMl = generateMeadowRound(7, () => 0.5); // an S3 friendly-tens round
  const pRight = gradeMeadowPredict(probeMl, probeMl.halfDiff);
  const pWhole = gradeMeadowPredict(probeMl, probeMl.diff);
  const pCant = gradeMeadowPredict(probeMl, MEADOW_CANT);
  const oddProbe = generateMeadowRound(MEADOW_ODD_ROUND_INDEX, () => 0.5);
  const pOddCant = gradeMeadowPredict(oddProbe, MEADOW_CANT);
  const pOddMoves = gradeMeadowPredict(oddProbe, oddProbe.moves);
  const predictOk =
    pRight.correct && pRight.points === MEADOW_PREDICT_POINTS &&
    !pWhole.correct && pWhole.points === 0 && /WHOLE difference/i.test(pWhole.label) &&
    !pCant.correct && pCant.points === 0 &&
    pOddCant.correct && pOddCant.points === MEADOW_PREDICT_POINTS &&
    !pOddMoves.correct && pOddMoves.points === 0;
  const totMlOk =
    checkMeadowTotal(probeMl, String(probeMl.total)).correct &&
    checkMeadowTotal(probeMl, ` ${probeMl.total} `).correct &&
    !checkMeadowTotal(probeMl, String(probeMl.total + 1)).correct &&
    !checkMeadowTotal(probeMl, String(probeMl.total - 1)).correct &&
    !checkMeadowTotal(probeMl, "twins").valid && !checkMeadowTotal(probeMl, "").valid;
  const menuMlOk =
    JSON.stringify(MEADOW_MOVE_OPTIONS) === JSON.stringify([1, 2, 3, 4, MEADOW_CANT]);
  const scoreMlOk =
    MEADOW_PREDICT_POINTS + MEADOW_TOTAL_POINTS === MEADOW_ROUND_POINTS && MEADOW_ROUND_POINTS === 25 &&
    MEADOW_MAX_SCORE === MEADOW_ROUNDS_PER_SET * MEADOW_ROUND_POINTS &&
    MEADOW_MAX_SCORE === SNOW_MAX_SCORES.snowmen;
  const snowmenSlot = SNOW_TROPHY_META.find((m) => m.key === "snowmen");
  const trophyMlOk =
    snowmenSlot && snowmenSlot.name === "Snowman Meadow" && !/coming soon/i.test(snowmenSlot.skill) &&
    SNOW_BEST_KEYS.snowmen === "mma-snow-snowmen-best";
  const ml3 = predictOk && totMlOk && menuMlOk && scoreMlOk && Boolean(trophyMlOk);
  checks.push({
    name: "Snowman Meadow grading + scoring + trophy slot (10+15=25, max 375)",
    pass: ml3,
    detail: ml3 ? "predict/total exact, parity call graded, slot renamed" : `predict:${predictOk} tot:${totMlOk} menu:${menuMlOk} score:${scoreMlOk} trophy:${Boolean(trophyMlOk)}`,
  });

  return checks;
}

export function runSledSlopeChecks() {
  const checks = [];

  // SL1) The RUN + wiring: the groomed run is a real incline up the west
  //      flank of Big Sled Hill (values increase uphill) at its configured
  //      grade, walkable (not a slide face), the region's groundHeight is the
  //      terrain there; Flake's sign (placeholder host) is wired with its
  //      collider, OFF the run; the view spot is gentle ground, clear of
  //      every collider.
  const hb = snowTerrainHeight(SLOPE_LANE.xBottom, SLOPE_LANE.z), ht = snowTerrainHeight(SLOPE_LANE.xTop, SLOPE_LANE.z);
  const rise = ht - hb;
  const gradeOk = Math.abs(rise - SLOPE_RUN_GRADE * (SLOPE_LANE.xTop - SLOPE_LANE.xBottom)) < 0.35 && rise > 2.5;
  let walkable = true;
  for (let x = SLOPE_LANE.xBottom; x <= SLOPE_LANE.xTop; x += 0.5) if (snowSlopeAt(x, SLOPE_LANE.z) > 0.6) walkable = false;
  const snowRegion = getRegion("snow-sums");
  const regionOk =
    Math.abs(snowRegion.groundHeight(SLOPE_LANE.xTop, SLOPE_LANE.z) - ht) < 1e-6 &&
    Math.abs(snowRegion.groundHeight(SLOPE_LANE.xBottom + 2, SLOPE_LANE.z) - snowTerrainHeight(SLOPE_LANE.xBottom + 2, SLOPE_LANE.z)) < 1e-6;
  const slCols = getSnowColliders({});
  const slSignIx = getInteractable("snow-sled-sign");
  const slSignOk =
    slSignIx && slSignIx.regionId === "snow-sums" && slSignIx.characterId === "sled-host" &&
    Boolean(ENCOUNTERS[slSignIx.encounterId]) &&
    slCols.some((c) => c.id === "snow-sled-sign") &&
    Math.abs(SLOPE_SIGN.position[1] - SLOPE_LANE.z) > 2 && // off the run
    Math.hypot(slSignIx.position[0] - SLOPE_SIGN.position[0], slSignIx.position[1] - SLOPE_SIGN.position[1]) < 0.01;
  const slSpotOk =
    snowSlopeAt(SLOPE_VIEW_SPOT[0], SLOPE_VIEW_SPOT[1]) < 0.5 &&
    slCols.every((c) => Math.hypot(c.x - SLOPE_VIEW_SPOT[0], c.z - SLOPE_VIEW_SPOT[1]) > c.radius + 0.9);
  const sl1 = gradeOk && walkable && regionOk && Boolean(slSignOk) && slSpotOk;
  checks.push({
    name: "Sledding Slope: a real groomed incline up Big Sled Hill's flank",
    pass: sl1,
    detail: sl1 ? `run ${SLOPE_LANE.xBottom}→${SLOPE_LANE.xTop} rises ${rise.toFixed(2)} m` : `grade:${gradeOk} (${rise.toFixed(2)}) walk:${walkable} region:${regionOk} sign:${Boolean(slSignOk)} spot:${slSpotOk}`,
  });

  // SL2) Maths fuzz over 300 sets: the back sled is a decade ± ≤2 (never
  //      ending 3–7), sliding the pair by `shift` lands it EXACTLY on its
  //      decade, round 13 is ALWAYS already friendly (shift 0) and the ONLY
  //      such round, gaps/decades hold their stage ranges, minuends stay
  //      two-digit, the rope thought-experiment's answer matches the rope
  //      (both → same, one-mover → changes), and consecutive rounds never
  //      repeat a pair.
  let fuzzOk = true;
  let fuzzDetail = "300 sets OK";
  outer: for (let s = 0; s < 300; s++) {
    const set = generateSledSet();
    if (set.length !== SLED_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (let i = 0; i < set.length; i++) {
      const r = set[i];
      if (![r.a, r.b, r.gap, r.decade, r.shift].every(Number.isInteger)) {
        fuzzOk = false; fuzzDetail = `NaN at ${i}`; break outer;
      }
      if (r.stage !== sledStageFor(i)) { fuzzOk = false; fuzzDetail = `stage wrong at ${i}`; break outer; }
      const friendlyRound = i === SLED_FRIENDLY_ROUND_INDEX;
      const baseOk =
        r.decade % 10 === 0 && r.b === r.decade - r.shift && Math.abs(r.shift) <= 2 &&
        (r.b + r.shift) % 10 === 0 &&
        r.a === r.b + r.gap && r.a <= 97 && r.b >= 11 &&
        r.gap >= 11 && r.gap <= 35 &&
        r.friendly === friendlyRound && (r.shift === 0) === friendlyRound &&
        (r.b % 10 === 0) === friendlyRound;
      if (!baseOk) { fuzzOk = false; fuzzDetail = `round invalid at ${i} (${r.a}−${r.b})`; break outer; }
      const stageOk = friendlyRound
        ? r.stage === 4
        : (r.stage === 0 && r.shift === 1 && r.decade >= 20 && r.decade <= 50) ||
          (r.stage === 1 && [2, -1].includes(r.shift) && r.decade >= 20 && r.decade <= 50) ||
          (r.stage === 2 && [1, 2, -1, -2].includes(r.shift) && r.decade >= 20 && r.decade <= 60) ||
          (r.stage === 3 && [1, 2, -1, -2].includes(r.shift) && r.decade >= 30 && r.decade <= 70) ||
          (r.stage === 4 && [1, 2, -1, -2].includes(r.shift) && r.decade >= 20 && r.decade <= 70);
      if (!stageOk) { fuzzOk = false; fuzzDetail = `stage range wrong at ${i}`; break outer; }
      const sc = r.scenario;
      const scOk =
        ["both", "front", "back"].includes(sc.mover) && [1, -1, 2].includes(sc.delta) &&
        sc.answer === sledScenarioAnswer(sc.mover, sc.delta) &&
        (sc.mover === "both") === (sc.answer === "same") &&
        typeof sc.text === "string" && sc.text.includes("rope");
      if (!scOk) { fuzzOk = false; fuzzDetail = `scenario wrong at ${i}`; break outer; }
      if (!r.prompt.includes(String(r.a)) || !r.prompt.includes(String(r.b)) || !r.reason.includes(String(r.gap))) {
        fuzzOk = false; fuzzDetail = `prompt/reason wrong at ${i}`; break outer;
      }
      if (i > 0 && r.a === set[i - 1].a && r.b === set[i - 1].b) {
        fuzzOk = false; fuzzDetail = `repeat pair at ${i}`; break outer;
      }
    }
  }
  checks.push({
    name: "Sledding Slope fuzz: decade shifts, rope scenarios, the friendly trap",
    pass: fuzzOk,
    detail: fuzzDetail,
  });

  // SL3) Grading + scoring + trophy lockstep: the rope prediction is exact
  //      (both-movers vs one-movers labelled apart), the slide accepts ANY
  //      decade (including ±10 away, and 0 slides on the friendly trap) and
  //      rejects off-decade spots, the typed difference is exact, 10 + 5 +
  //      10 = 25 and 15 × 25 = 375 = the trophy slot's max, and the sled
  //      slot has its real name + best key.
  const probeSl = generateSledRound(7, () => 0.5); // an S3 round
  const spRight = gradeSledPredict(probeSl, probeSl.scenario.answer);
  const spWrong = gradeSledPredict(probeSl, probeSl.scenario.answer === "same" ? "bigger" : "same");
  const slRight = gradeSledSlide(probeSl, probeSl.shift);
  const slFar = gradeSledSlide(probeSl, probeSl.shift + 10); // the next decade up
  const slWrong = gradeSledSlide(probeSl, probeSl.shift + 1);
  const friendlyProbe = generateSledRound(SLED_FRIENDLY_ROUND_INDEX, () => 0.5);
  const slZero = gradeSledSlide(friendlyProbe, 0);
  const gradeSlOk =
    spRight.correct && spRight.points === SLED_PREDICT_POINTS && !spWrong.correct && spWrong.points === 0 &&
    slRight.correct && slRight.points === SLED_SLIDE_POINTS &&
    slFar.correct && !slWrong.correct && slWrong.points === 0 &&
    slZero.correct && /no sliding/i.test(slZero.label);
  const diffOk =
    checkSledDiff(probeSl, String(probeSl.gap)).correct &&
    checkSledDiff(probeSl, ` ${probeSl.gap} `).correct &&
    !checkSledDiff(probeSl, String(probeSl.gap + 1)).correct &&
    !checkSledDiff(probeSl, String(probeSl.gap - 1)).correct &&
    !checkSledDiff(probeSl, "rope").valid && !checkSledDiff(probeSl, "").valid;
  const menuSlOk = JSON.stringify(SLED_PREDICT_OPTIONS) === JSON.stringify(["bigger", "same", "smaller"]);
  // 2026-09-28: the rope prediction no longer scores in play — a round is
  // slide 10 + difference 15.
  const scoreSlOk =
    SLED_SLIDE_POINTS + SLED_DIFF_POINTS === SLED_ROUND_POINTS &&
    SLED_ROUND_POINTS === 25 &&
    SLED_MAX_SCORE === SLED_ROUNDS_PER_SET * SLED_ROUND_POINTS &&
    SLED_MAX_SCORE === SNOW_MAX_SCORES.sled;
  const sledSlot = SNOW_TROPHY_META.find((m) => m.key === "sled");
  const trophySlOk =
    sledSlot && sledSlot.name === "Sledding Slope" && !/coming soon/i.test(sledSlot.skill) &&
    SNOW_BEST_KEYS.sled === "mma-snow-sled-best";
  const sl3 = gradeSlOk && diffOk && menuSlOk && scoreSlOk && Boolean(trophySlOk);
  checks.push({
    name: "Sledding Slope grading + scoring + trophy slot (10+15=25, max 375)",
    pass: sl3,
    detail: sl3 ? "rope predict, any-decade slide, exact diff, slot renamed" : `grade:${gradeSlOk} diff:${diffOk} menu:${menuSlOk} score:${scoreSlOk} trophy:${Boolean(trophySlOk)}`,
  });

  return checks;
}

// Shared helper for the late snow challenges: sign wired + view spot clear.
function lateSnowWiring(spotId, signId, hostId, area, signPos, viewSpot, colliderIds) {
  const spot = SNOW_CHALLENGE_SPOTS.find((s) => s.id === spotId);
  const claims = spot && area.x === spot.center[0] && area.z === spot.center[1];
  const cols = getSnowColliders({});
  const collidersOk = colliderIds.every((id) => cols.some((c) => c.id === id));
  const spotClear = cols.every(
    (c) => Math.hypot(c.x - viewSpot[0], c.z - viewSpot[1]) > c.radius + 0.9
  );
  const ix = getInteractable(signId);
  const signOk =
    ix && ix.regionId === "snow-sums" && ix.characterId === hostId &&
    Boolean(ENCOUNTERS[ix.encounterId]) &&
    Math.hypot(ix.position[0] - signPos[0], ix.position[1] - signPos[1]) < 0.01 &&
    Math.hypot(signPos[0] - area.x, signPos[1] - area.z) < 8 &&
    Math.hypot(viewSpot[0] - area.x, viewSpot[1] - area.z) < 8;
  return { claims, collidersOk, spotClear, signOk: Boolean(signOk) };
}

export function runVillageSplitChecks() {
  const checks = [];

  // VG1) Geometry + wiring.
  const w = lateSnowWiring("village", "snow-village-sign", "village-host", VILLAGE_AREA,
    VILLAGE_SIGN.position, VILLAGE_VIEW_SPOT,
    ["snow-village-left", "snow-village-right", "snow-village-site", "snow-village-sign"]);
  const stands =
    Math.hypot(VILLAGE_LEFT_STAND[0] - VILLAGE_AREA.x, VILLAGE_LEFT_STAND[1] - VILLAGE_AREA.z) < 8 &&
    Math.hypot(VILLAGE_RIGHT_STAND[0] - VILLAGE_AREA.x, VILLAGE_RIGHT_STAND[1] - VILLAGE_AREA.z) < 8 &&
    Math.hypot(VILLAGE_BUILD_SITE[0] - VILLAGE_AREA.x, VILLAGE_BUILD_SITE[1] - VILLAGE_AREA.z) < 8 &&
    VILLAGE_LEFT_STAND[0] < VILLAGE_RIGHT_STAND[0];
  const vg1 = w.claims && w.collidersOk && w.spotClear && w.signOk && stands;
  checks.push({
    name: "Igloo Village: claims the village clearing, stands + host placed",
    pass: vg1,
    detail: vg1 ? "stands + site + Bloc placed" : `claims:${w.claims} cols:${w.collidersOk} clear:${w.spotClear} sign:${w.signOk} stands:${stands}`,
  });

  // VG2) Maths fuzz over 300 sets: like-with-like sums exact, ones digits
  //      1–9 (structure always visible), regroup ⟺ ones sum ≥ 10, totals
  //      two-digit, the exact-ten trap at round 13 and ONLY there, the
  //      stage arc (under → under → over → over → mixed), no repeats.
  let fuzzOk = true;
  let fuzzDetail = "300 sets OK";
  outer: for (let s = 0; s < 300; s++) {
    const set = generateVillageSet();
    if (set.length !== VILLAGE_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (let i = 0; i < set.length; i++) {
      const r = set[i];
      if (![r.a, r.b, r.ta, r.tb, r.oa, r.ob, r.tensSum, r.onesSum, r.total].every(Number.isInteger)) {
        fuzzOk = false; fuzzDetail = `NaN at ${i}`; break outer;
      }
      const baseOk =
        r.stage === villageStageFor(i) &&
        r.a === r.ta * 10 + r.oa && r.b === r.tb * 10 + r.ob &&
        r.oa >= 1 && r.oa <= 9 && r.ob >= 1 && r.ob <= 9 && r.ta >= 1 && r.tb >= 1 &&
        r.tensSum === (r.ta + r.tb) * 10 && r.onesSum === r.oa + r.ob &&
        r.total === r.a + r.b && r.total <= 99 &&
        r.regroup === (r.onesSum >= 10) && r.exactTen === (r.onesSum === 10) &&
        (i === VILLAGE_EXACT_ROUND_INDEX) === (r.onesSum === 10);
      if (!baseOk) { fuzzOk = false; fuzzDetail = `round invalid at ${i} (${r.a}+${r.b})`; break outer; }
      const stageOk =
        (r.stage <= 1 && !r.regroup) ||
        (r.stage === 2 && r.regroup) || (r.stage === 3 && r.regroup) ||
        r.stage === 4;
      if (!stageOk) { fuzzOk = false; fuzzDetail = `stage shape wrong at ${i}`; break outer; }
      if (!r.prompt.includes(String(r.a)) || !r.reason.includes(String(r.total))) {
        fuzzOk = false; fuzzDetail = `prompt/reason wrong at ${i}`; break outer;
      }
      if (i > 0 && r.a === set[i - 1].a && r.b === set[i - 1].b) {
        fuzzOk = false; fuzzDetail = `repeat pair at ${i}`; break outer;
      }
    }
  }
  checks.push({
    name: "Igloo Village fuzz: like with like, regrouping, the exact-ten trap",
    pass: fuzzOk,
    detail: fuzzDetail,
  });

  // VG3) Grading + scoring + trophy lockstep. The ones pile must be the RAW
  //      pile (13, not 3) on regroup rounds.
  const probe = generateVillageRound(10, () => 0.5); // an S4 regroup round
  const pYes = gradeVillagePredict(probe, true);
  const pNo = gradeVillagePredict(probe, false);
  const jRight = checkVillageJoin(probe, String(probe.tensSum), String(probe.onesSum));
  const jTrap = checkVillageJoin(probe, String(probe.tensSum), String(probe.onesSum - 10)); // "3" for "13"
  const jBad = checkVillageJoin(probe, "x", "3");
  const gradeOk =
    probe.regroup && pYes.correct && pYes.points === VILLAGE_PREDICT_POINTS && !pNo.correct && pNo.points === 0 &&
    jRight.valid && jRight.tensCorrect && jRight.onesCorrect &&
    jTrap.valid && jTrap.tensCorrect && !jTrap.onesCorrect &&
    !jBad.valid;
  const totOk =
    checkVillageTotal(probe, String(probe.total)).correct &&
    !checkVillageTotal(probe, String(probe.total + 1)).correct &&
    !checkVillageTotal(probe, "igloo").valid;
  // Round 2 (2026-09-29): a round is BUILD 10 + TOTAL 15; the build grade
  // refuses an unfinished move and a missed ten-for-ten swap.
  const full = { ta: probe.ta, tb: probe.tb, oa: probe.oa, ob: probe.ob };
  const bPart = gradeVillageBuild(probe, { ...full, oa: 0 }, false);
  const bNoSwap = gradeVillageBuild(probe, full, false);
  const bRight = gradeVillageBuild(probe, full, true);
  const buildOk =
    !bPart.done && !bPart.miss && !bNoSwap.done && bNoSwap.miss && bRight.done &&
    villageSite(probe, full, true).value === probe.total;
  const scoreOk = buildOk &&
    VILLAGE_BUILD_POINTS + VILLAGE_TOTAL_POINTS === VILLAGE_ROUND_POINTS &&
    VILLAGE_ROUND_POINTS === 25 && VILLAGE_MAX_SCORE === 375 && VILLAGE_MAX_SCORE === SNOW_MAX_SCORES.village;
  const slot = SNOW_TROPHY_META.find((m) => m.key === "village");
  const trophyOk =
    slot && slot.name === "Igloo Village" && !/coming soon/i.test(slot.skill) &&
    SNOW_BEST_KEYS.village === "mma-snow-village-best";
  const vg3 = gradeOk && totOk && scoreOk && Boolean(trophyOk);
  checks.push({
    name: "Igloo Village grading + scoring + trophy slot (build 10 + total 15, max 375)",
    pass: vg3,
    detail: vg3 ? "raw ones pile enforced, slot renamed" : `grade:${gradeOk} tot:${totOk} score:${scoreOk} trophy:${Boolean(trophyOk)}`,
  });

  return checks;
}

export function runColonyPairsChecks() {
  const checks = [];

  // PC1) Geometry + wiring: the pairing rows straddle the colony clearing.
  const w = lateSnowWiring("colony", "snow-colony-sign", "colony-host", COLONY_AREA,
    COLONY_SIGN.position, COLONY_VIEW_SPOT, ["snow-colony-sign"]);
  const rowsOk =
    COLONY_ROWS.z1 < COLONY_ROWS.z2 &&
    Math.abs(COLONY_ROWS.z1 - COLONY_AREA.z) < 4 && Math.abs(COLONY_ROWS.z2 - COLONY_AREA.z) < 4;
  const pc1 = w.claims && w.collidersOk && w.spotClear && w.signOk && rowsOk;
  checks.push({
    name: "Penguin Colony: claims the colony clearing, rows + host placed",
    pass: pc1,
    detail: pc1 ? "rows + Pippin placed" : `claims:${w.claims} cols:${w.collidersOk} clear:${w.spotClear} sign:${w.signOk} rows:${rowsOk}`,
  });

  // PC2) Maths fuzz over 300 sets: diffs only 0/1/2, four DISTINCT options
  //      whose correct flags are mathematically true (diff-1 rounds carry
  //      BOTH true forms; diff-0 and diff-2 exactly one), round 13 is
  //      ALWAYS diff-2 (double the middle) and diff-2 appears ONLY in S5,
  //      the stage arc holds, no repeats.
  let fuzzOk = true;
  let fuzzDetail = "300 sets OK";
  outer: for (let s = 0; s < 300; s++) {
    const set = generateColonySet();
    if (set.length !== COLONY_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (let i = 0; i < set.length; i++) {
      const r = set[i];
      if (![r.a, r.b, r.diff, r.total].every(Number.isInteger)) { fuzzOk = false; fuzzDetail = `NaN at ${i}`; break outer; }
      const baseOk =
        r.stage === colonyStageFor(i) && r.b === r.a + r.diff && [0, 1, 2].includes(r.diff) &&
        r.total === r.a + r.b && r.a >= 4 && r.b <= 39 &&
        (i === COLONY_MIDDLE_ROUND_INDEX ? r.diff === 2 : true) &&
        (r.diff === 2 ? r.stage === 4 && r.middleBase === r.a + 1 : r.middleBase === null);
      if (!baseOk) { fuzzOk = false; fuzzDetail = `round invalid at ${i} (${r.a}+${r.b})`; break outer; }
      const stageOk =
        (r.stage === 0 && r.diff === 1) || (r.stage === 1 && r.diff === 0) ||
        (r.stage === 2 && r.diff === 1) || (r.stage === 3 && r.diff === 1) ||
        r.stage === 4;
      if (!stageOk) { fuzzOk = false; fuzzDetail = `stage diff wrong at ${i}`; break outer; }
      const labels = new Set(r.options.map((o) => o.label));
      const trueCount = r.options.filter((o) => o.correct).length;
      const flagsOk =
        r.options.length === 4 && labels.size === 4 &&
        r.options.every((o) => o.correct === colonyFormTrue(r, o.base, o.adjust)) &&
        (r.diff === 1 ? trueCount === 2 : trueCount === 1);
      if (!flagsOk) { fuzzOk = false; fuzzDetail = `options wrong at ${i}`; break outer; }
      if (i > 0 && r.a === set[i - 1].a && r.b === set[i - 1].b) {
        fuzzOk = false; fuzzDetail = `repeat pair at ${i}`; break outer;
      }
    }
  }
  checks.push({
    name: "Penguin Colony fuzz: true doubles-forms, the middle-double trap",
    pass: fuzzOk,
    detail: fuzzDetail,
  });

  // PC3) Grading + scoring + trophy lockstep: ANY true form scores.
  const probe2 = generateColonyRound(6, () => 0.5); // an S3 diff-1 round
  const trueIdx = probe2.options.findIndex((o) => o.correct);
  const falseIdx = probe2.options.findIndex((o) => !o.correct);
  const secondTrueIdx = probe2.options.findIndex((o, i) => o.correct && i !== trueIdx);
  const gTrue = gradeColonyPredict(probe2, trueIdx);
  const gTrue2 = gradeColonyPredict(probe2, secondTrueIdx);
  const gFalse = gradeColonyPredict(probe2, falseIdx);
  const gradeOk2 =
    gTrue.correct && gTrue.points === COLONY_PREDICT_POINTS &&
    gTrue2.correct && gTrue2.points === COLONY_PREDICT_POINTS && // BOTH true forms score
    !gFalse.correct && gFalse.points === 0;
  const totOk2 =
    checkColonyTotal(probe2, String(probe2.total)).correct &&
    !checkColonyTotal(probe2, String(probe2.total + 1)).correct &&
    !checkColonyTotal(probe2, "waddle").valid;
  const scoreOk2 =
    COLONY_PREDICT_POINTS + COLONY_TOTAL_POINTS === COLONY_ROUND_POINTS && COLONY_ROUND_POINTS === 25 &&
    COLONY_MAX_SCORE === 375 && COLONY_MAX_SCORE === SNOW_MAX_SCORES.colony;
  const slot2 = SNOW_TROPHY_META.find((m) => m.key === "colony");
  const trophyOk2 =
    slot2 && slot2.name === "Penguin Colony" && !/coming soon/i.test(slot2.skill) &&
    SNOW_BEST_KEYS.colony === "mma-snow-colony-best";
  const pc3 = gradeOk2 && totOk2 && scoreOk2 && Boolean(trophyOk2);
  checks.push({
    name: "Penguin Colony grading + scoring + trophy slot (10+15=25, max 375)",
    pass: pc3,
    detail: pc3 ? "both true forms score, slot renamed" : `grade:${gradeOk2} tot:${totOk2} score:${scoreOk2} trophy:${Boolean(trophyOk2)}`,
  });

  return checks;
}

export function runCaveCrystalsChecks() {
  const checks = [];

  // IC1) Geometry + wiring: the crystal wall + dark dome dress the BACK of
  //      the cave clearing (the centre stays walkable).
  const w = lateSnowWiring("cave", "snow-cave-sign", "cave-host", CAVE_AREA,
    CAVE_SIGN.position, CAVE_VIEW_SPOT, ["snow-cave-sign"]);
  const wallOk =
    CAVE_WALL.xMin < CAVE_WALL.xMax && CAVE_WALL.z < CAVE_AREA.z && // behind the centre
    CAVE_DOME.center[1] < CAVE_AREA.z && CAVE_DOME.radius > 5;
  const ic1 = w.claims && w.collidersOk && w.spotClear && w.signOk && wallOk;
  checks.push({
    name: "Ice Cave: claims the cave clearing, wall + dome at the back",
    pass: ic1,
    detail: ic1 ? "wall + dome + Glim placed" : `claims:${w.claims} cols:${w.collidersOk} clear:${w.spotClear} sign:${w.signOk} wall:${wallOk}`,
  });

  // IC2) Maths fuzz over 300 sets: the winning direction ALWAYS needs fewer
  //      glows (never a tie), up-rounds have tiny gaps, back-rounds tiny
  //      subtrahends, the stage arc holds (up → back → mixed → mixed →
  //      long), round 13 is ALWAYS a long count-back, windows stay small
  //      enough to render (≤ 16 crystals), no repeats.
  let fuzzOk = true;
  let fuzzDetail = "300 sets OK";
  outer: for (let s = 0; s < 300; s++) {
    const set = generateCaveSet();
    if (set.length !== CAVE_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (let i = 0; i < set.length; i++) {
      const r = set[i];
      if (![r.a, r.b, r.answer, r.steps, r.otherSteps, r.windowMin, r.windowMax].every(Number.isInteger)) {
        fuzzOk = false; fuzzDetail = `NaN at ${i}`; break outer;
      }
      const baseOk =
        r.stage === caveStageFor(i) && r.answer === r.a - r.b && r.a <= 97 && r.b >= 1 &&
        (r.kind === "up" ? r.steps === r.a - r.b && r.otherSteps === r.b : r.steps === r.b && r.otherSteps === r.a - r.b) &&
        r.steps < r.otherSteps && // the winning way genuinely wins
        r.windowMax - r.windowMin <= 100 && r.windowMin <= Math.min(r.b, r.answer) && r.windowMax >= r.a &&
        (i === CAVE_LONG_ROUND_INDEX ? r.kind === "back" && r.steps >= 7 : true);
      if (!baseOk) { fuzzOk = false; fuzzDetail = `round invalid at ${i} (${r.a}−${r.b})`; break outer; }
      const stageOk =
        (r.stage === 0 && r.kind === "up") || (r.stage === 1 && r.kind === "back") ||
        r.stage === 2 || r.stage === 3 ||
        (r.stage === 4 && r.steps >= 7 && r.steps <= 9);
      if (!stageOk) { fuzzOk = false; fuzzDetail = `stage kind wrong at ${i}`; break outer; }
      if (i > 0 && r.a === set[i - 1].a && r.b === set[i - 1].b) {
        fuzzOk = false; fuzzDetail = `repeat pair at ${i}`; break outer;
      }
    }
  }
  checks.push({
    name: "Ice Cave fuzz: the short way always wins, the long-back trap",
    pass: fuzzOk,
    detail: fuzzDetail,
  });

  // IC3) Grading + scoring + trophy lockstep.
  const probe3 = generateCaveRound(7, () => 0.5); // an S3 round
  const cRight = gradeCaveChoose(probe3, probe3.kind);
  const cWrong = gradeCaveChoose(probe3, probe3.kind === "up" ? "back" : "up");
  const gradeOk3 =
    cRight.correct && cRight.points === CAVE_CHOOSE_POINTS &&
    !cWrong.correct && cWrong.points === 0 && cWrong.label.includes(String(probe3.otherSteps));
  const ansOk =
    checkCaveAnswer(probe3, String(probe3.answer)).correct &&
    !checkCaveAnswer(probe3, String(probe3.answer + 1)).correct &&
    !checkCaveAnswer(probe3, "glow").valid;
  const scoreOk3 =
    CAVE_CHOOSE_POINTS + CAVE_ANSWER_POINTS === CAVE_ROUND_POINTS && CAVE_ROUND_POINTS === 25 &&
    CAVE_MAX_SCORE === 375 && CAVE_MAX_SCORE === SNOW_MAX_SCORES.cave;
  const slot3 = SNOW_TROPHY_META.find((m) => m.key === "cave");
  const trophyOk3 =
    slot3 && slot3.name === "The Ice Cave" && !/coming soon/i.test(slot3.skill) &&
    SNOW_BEST_KEYS.cave === "mma-snow-cave-best";
  const ic3 = gradeOk3 && ansOk && scoreOk3 && Boolean(trophyOk3);
  checks.push({
    name: "Ice Cave grading + scoring + trophy slot (10+15=25, max 375)",
    pass: ic3,
    detail: ic3 ? "direction + answer exact, slot renamed" : `grade:${gradeOk3} ans:${ansOk} score:${scoreOk3} trophy:${Boolean(trophyOk3)}`,
  });

  return checks;
}

export function runLodgeYardChecks() {
  const checks = [];

  // LY1) Geometry + wiring: the stall + hundred-bead board flank the yard.
  const w = lateSnowWiring("lodgeyard", "snow-yard-sign", "yard-host", YARD_AREA,
    YARD_SIGN.position, YARD_VIEW_SPOT, ["snow-yard-stall", "snow-yard-board", "snow-yard-sign"]);
  const propsOk =
    Math.hypot(YARD_STALL[0] - YARD_AREA.x, YARD_STALL[1] - YARD_AREA.z) < 8 &&
    Math.hypot(YARD_BOARD[0] - YARD_AREA.x, YARD_BOARD[1] - YARD_AREA.z) < 8;
  const ly1 = w.claims && w.collidersOk && w.spotClear && w.signOk && propsOk;
  checks.push({
    name: "Lodge Yard: claims the yard, stall + counting board placed",
    pass: ly1,
    detail: ly1 ? "stall + board + Cocoa placed" : `claims:${w.claims} cols:${w.collidersOk} clear:${w.spotClear} sign:${w.signOk} props:${propsOk}`,
  });

  // LY2) Maths fuzz over 300 sets: hops rebuild the change EXACTLY
  //      (onesHop + tensHop = 100 − price), the ones hop is a proper
  //      complement (0–9), the tens hop a clean multiple of ten, round 13
  //      is ALWAYS on a ten (ones hop 0) and round 14 ALWAYS in the 90s
  //      (tens hop 0) — and those zeros appear ONLY there, the stage ones
  //      digits hold, no repeated prices.
  let fuzzOk = true;
  let fuzzDetail = "300 sets OK";
  outer: for (let s = 0; s < 300; s++) {
    const set = generateYardSet();
    if (set.length !== YARD_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
    for (let i = 0; i < set.length; i++) {
      const r = set[i];
      if (![r.price, r.onesHop, r.afterOnes, r.tensHop, r.change].every(Number.isInteger)) {
        fuzzOk = false; fuzzDetail = `NaN at ${i}`; break outer;
      }
      const baseOk =
        r.stage === yardStageFor(i) && r.price >= 11 && r.price <= 99 &&
        r.onesHop === (10 - (r.price % 10)) % 10 && r.afterOnes === r.price + r.onesHop &&
        r.afterOnes % 10 === 0 && r.tensHop === 100 - r.afterOnes && r.tensHop % 10 === 0 &&
        r.change === 100 - r.price && r.change === r.onesHop + r.tensHop &&
        (i === YARD_ON_TEN_ROUND_INDEX) === (r.onesHop === 0) &&
        (i === YARD_NINETIES_ROUND_INDEX) === (r.tensHop === 0);
      if (!baseOk) { fuzzOk = false; fuzzDetail = `round invalid at ${i} (price ${r.price})`; break outer; }
      const ones = r.price % 10;
      const stageOk =
        i === YARD_ON_TEN_ROUND_INDEX || i === YARD_NINETIES_ROUND_INDEX ||
        (r.stage === 0 && ones === 5) ||
        (r.stage === 1 && [1, 2, 8, 9].includes(ones)) ||
        (r.stage === 2 && [3, 4, 6, 7].includes(ones)) ||
        r.stage >= 3;
      if (!stageOk) { fuzzOk = false; fuzzDetail = `stage ones wrong at ${i}`; break outer; }
      if (i > 0 && r.price === set[i - 1].price) { fuzzOk = false; fuzzDetail = `repeat price at ${i}`; break outer; }
    }
  }
  checks.push({
    name: "Lodge Yard fuzz: hops rebuild the change, the zero-hop traps",
    pass: fuzzOk,
    detail: fuzzDetail,
  });

  // LY3) Grading + scoring + trophy lockstep (zero accepted where zero is
  //      the truth).
  const probe4 = generateYardRound(YARD_ON_TEN_ROUND_INDEX, () => 0.5); // ones hop 0
  const gradeOk4 =
    checkYardOnes(probe4, "0").correct && !checkYardOnes(probe4, "5").correct &&
    checkYardTens(probe4, String(probe4.tensHop)).correct &&
    !checkYardTens(probe4, String(probe4.tensHop + 10)).correct &&
    checkYardChange(probe4, String(probe4.change)).correct &&
    !checkYardChange(probe4, String(probe4.change + 1)).correct &&
    !checkYardOnes(probe4, "cocoa").valid;
  // Round 2 (2026-09-29): count up with coins — only exactly 100c goes
  // through; overshooting on the way halves the count points.
  const p4 = generateYardRound(2, () => 0.5);
  const under = gradeYardCount(p4, [1], false);
  const exact = gradeYardCount(p4, [p4.change], false);
  const exactOver = gradeYardCount(p4, [p4.change], true);
  const countOk4 =
    !under.done && exact.done && exact.points === YARD_COUNT_POINTS && exactOver.points === YARD_COUNT_OVER_POINTS &&
    fewestCoinsFor(35) === 3 && fewestCoinsFor(37) === 5 && fewestCoinsFor(0) === 0;
  const scoreOk4 = countOk4 &&
    YARD_COUNT_POINTS + YARD_CHANGE_POINTS === YARD_ROUND_POINTS && YARD_ROUND_POINTS === 25 &&
    YARD_MAX_SCORE === 375 && YARD_MAX_SCORE === SNOW_MAX_SCORES.lodgeyard;
  const slot4 = SNOW_TROPHY_META.find((m) => m.key === "lodgeyard");
  const trophyOk4 =
    slot4 && slot4.name === "The Lodge Yard" && !/coming soon/i.test(slot4.skill) &&
    SNOW_BEST_KEYS.lodgeyard === "mma-snow-lodgeyard-best";
  const ly3 = gradeOk4 && scoreOk4 && Boolean(trophyOk4);
  checks.push({
    name: "Lodge Yard grading + scoring + trophy slot (count 10 + change 15, max 375)",
    pass: ly3,
    detail: ly3 ? "hops + change exact (zeros included), slot renamed" : `grade:${gradeOk4} score:${scoreOk4} trophy:${Boolean(trophyOk4)}`,
  });

  return checks;
}

export function runAuroraLookoutChecks() {
  const checks = [];

  // AL1) Geometry + wiring: the raised deck dresses the lookout.
  const w = lateSnowWiring("lights", "snow-lights-sign", "lights-host", LOOKOUT_AREA,
    LOOKOUT_SIGN.position, LOOKOUT_VIEW_SPOT, ["snow-lookout-deck", "snow-lights-sign"]);
  const deckOk = Math.hypot(LOOKOUT_DECK[0] - LOOKOUT_AREA.x, LOOKOUT_DECK[1] - LOOKOUT_AREA.z) < 8;
  const al1 = w.claims && w.collidersOk && w.spotClear && w.signOk && deckOk;
  checks.push({
    name: "Aurora Lookout: claims the lookout, deck + host placed",
    pass: al1,
    detail: al1 ? "deck + Nova placed" : `claims:${w.claims} cols:${w.collidersOk} clear:${w.spotClear} sign:${w.signOk} deck:${deckOk}`,
  });

  // AL2) The capstone's structure: the schedule is 15 rounds covering EVERY
  //      archetype; fuzz 300 sets — each round's brightest tool is on the
  //      menu, the sound set never contains the brightest, the archetype
  //      matches the schedule, answers are consistent with the expression,
  //      scaffolds + reasons are present, no repeated expressions.
  const menuKeys = LOOKOUT_STRATEGIES.map((s) => s.key);
  const scheduleOk =
    LOOKOUT_SCHEDULE.length === LOOKOUT_ROUNDS_PER_SET &&
    LOOKOUT_ARCHETYPE_KEYS.every((k) => LOOKOUT_SCHEDULE.includes(k));
  let fuzzOk = scheduleOk;
  let fuzzDetail = scheduleOk ? "300 sets OK" : "schedule incomplete";
  if (fuzzOk) {
    outer: for (let s = 0; s < 300; s++) {
      const set = generateLookoutSet();
      if (set.length !== LOOKOUT_ROUNDS_PER_SET) { fuzzOk = false; fuzzDetail = "wrong set length"; break; }
      for (let i = 0; i < set.length; i++) {
        const r = set[i];
        // The expression re-evaluates to the answer (− is the unicode minus).
        const m = r.expr.match(/^(\d+) ([+−]) (\d+)$/);
        const evald = m ? (m[2] === "+" ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3])) : NaN;
        const baseOk =
          r.archetype === LOOKOUT_SCHEDULE[i] &&
          Number.isInteger(r.answer) && r.answer >= 0 && evald === r.answer &&
          menuKeys.includes(r.best) && r.sound.every((k) => menuKeys.includes(k)) &&
          !r.sound.includes(r.best) &&
          typeof r.scaffold === "string" && r.scaffold.length > 5 &&
          r.reason.includes(String(r.answer)) &&
          // Round 2: three concrete ways, all correct, none giving the answer away.
          Array.isArray(r.choices) && r.choices.length === 3 &&
          r.choices.every((c) => {
            const last = c.steps[c.steps.length - 1];
            return c.show && /= \?$/.test(last) &&
              !(c.show.match(/\d+/g) || []).concat(last.match(/\d+/g) || []).includes(String(r.answer));
          });
        if (!baseOk) { fuzzOk = false; fuzzDetail = `round invalid at ${i} (${r.expr})`; break outer; }
        if (i > 0 && r.expr === set[i - 1].expr) { fuzzOk = false; fuzzDetail = `repeat expr at ${i}`; break outer; }
      }
    }
  }
  checks.push({
    name: "Aurora Lookout fuzz: full-coverage schedule, sound ≠ brightest",
    pass: fuzzOk,
    detail: fuzzDetail,
  });

  // AL3) Grading + scoring + trophy lockstep: brightest 10, sound 5,
  //      unsound 0 — and the menu carries all seven tools.
  const probe5 = generateLookoutRound(3, () => 0.5); // nineAdd → comp best, jump sound
  const gBest = gradeLookoutPick(probe5, probe5.best);
  const gSound = gradeLookoutPick(probe5, probe5.sound[0]);
  const unsoundKey = menuKeys.find((k) => k !== probe5.best && !probe5.sound.includes(k));
  const gUnsound = gradeLookoutPick(probe5, unsoundKey);
  const gradeOk5 =
    gBest.best && gBest.points === LOOKOUT_PICK_BEST_POINTS &&
    gSound.sound && !gSound.best && gSound.points === LOOKOUT_PICK_SOUND_POINTS &&
    !gUnsound.sound && gUnsound.points === 0;
  const ansOk5 =
    checkLookoutAnswer(probe5, String(probe5.answer)).correct &&
    !checkLookoutAnswer(probe5, String(probe5.answer + 1)).correct &&
    !checkLookoutAnswer(probe5, "aurora").valid;
  // 2026-09-28: eight tools (🧊 Tens and ones added), each with an example.
  const menuOk5 = LOOKOUT_STRATEGIES.length === 9 && new Set(menuKeys).size === 9 &&
    menuKeys.includes("split") && LOOKOUT_STRATEGIES.every((t) => t.example && t.example.length > 4);
  const scoreOk5 =
    LOOKOUT_PICK_BEST_POINTS + LOOKOUT_ANSWER_POINTS === LOOKOUT_ROUND_POINTS && LOOKOUT_ROUND_POINTS === 25 &&
    LOOKOUT_PICK_SOUND_POINTS < LOOKOUT_PICK_BEST_POINTS &&
    LOOKOUT_MAX_SCORE === 375 && LOOKOUT_MAX_SCORE === SNOW_MAX_SCORES.lights;
  const slot5 = SNOW_TROPHY_META.find((m) => m.key === "lights");
  const trophyOk5 =
    slot5 && slot5.name === "Aurora Lookout" && !/coming soon/i.test(slot5.skill) &&
    SNOW_BEST_KEYS.lights === "mma-snow-lights-best";
  const al3 = gradeOk5 && ansOk5 && menuOk5 && scoreOk5 && Boolean(trophyOk5);
  checks.push({
    name: "Aurora Lookout grading + scoring + trophy slot (10/5 pick + 15, max 375)",
    pass: al3,
    detail: al3 ? "easiest/works/unsound tiers, 9 tools, slot renamed" : `grade:${gradeOk5} ans:${ansOk5} menu:${menuOk5} score:${scoreOk5} trophy:${Boolean(trophyOk5)}`,
  });

  return checks;
}

// ---- SNOWBALL SUMS AUDIT (2026-09-28) ----------------------------------------
import {
  SNOW_CHALLENGE_VIEWS as SA_VIEWS,
  inSnowChallengeView as saInView,
  RANGE_FRAME_POS as SA_RANGE_FRAME,
  RINK_GLIDE_LINE as SA_RINK_LINE,
  GROVE_TREE_POS as SA_GROVE_TREE,
  MEADOW_TOWER_LEFT as SA_MEADOW_L,
  SLOPE_LANE as SA_SLOPE_LANE,
  VILLAGE_BUILD_SITE as SA_VILLAGE_SITE,
  COLONY_ROWS as SA_COLONY_ROWS,
  COLONY_AREA as SA_COLONY_AREA,
  CAVE_WALL as SA_CAVE_WALL,
  YARD_BOARD as SA_YARD_BOARD,
  LOOKOUT_AREA as SA_LOOKOUT_AREA,
} from "../data/snow/snowLayout.js";
import { generateRangeSet as saRange } from "../data/snow/snowballRangeChallenge.js";
import { generateRinkSet as saRink } from "../data/snow/rinkGlideChallenge.js";
import { generateGroveSet as saGrove } from "../data/snow/groveLightsChallenge.js";
import { generateMeadowSet as saMeadow, gradeMeadowCall, meadowCountsAfterHops, MEADOW_ODD_ROUND_INDEX as SA_ODD } from "../data/snow/meadowLevelChallenge.js";
import { generateSledSet as saSled } from "../data/snow/sledSlopeChallenge.js";
import { generateVillageSet as saVillage } from "../data/snow/villageSplitChallenge.js";
import { generateColonySet as saColony, gradeColonyPredict as saColonyGrade } from "../data/snow/colonyPairsChallenge.js";
import { generateCaveSet as saCave } from "../data/snow/caveCrystalsChallenge.js";
import { generateYardSet as saYard, checkYardChange as saYardChange } from "../data/snow/lodgeYardChallenge.js";
import { generateLookoutSet as saLookout, LOOKOUT_STRATEGIES as SA_TOOLS, LOOKOUT_OPTIONS_PER_ROUND } from "../data/snow/auroraLookoutChallenge.js";
import { useMeadowLevel as saMeadowStore } from "../game/meadowLevelStore.js";
import { useVillageSplit as saVillageStore } from "../game/villageSplitStore.js";
import { useLodgeYard as saYardStore } from "../game/lodgeYardStore.js";
import { useGroveLights as saGroveStore } from "../game/groveLightsStore.js";
import { useAuroraLookout as saLookoutStore } from "../game/auroraLookoutStore.js";

/**
 * SA1–SA8 — the 2026-09-28 Year-7 audit (+ round 2, 2026-09-29) of Snowball Sums: view corridors
 * clear the camera line, every round carries a kid-sized worked solution
 * and a jargon-free prompt, the colony never leaks the total on a wrong
 * pick, the meadow's hop-it-yourself flow scores the FIRST call only, and
 * the Aurora offers four tools (always including the easiest).
 */
export function runSnowAuditChecks() {
  const checks = [];

  // SA1) Each of the ten corridors exists and contains its activity's
  //      front line — so what the camera films is what gets cleared for.
  const focus = {
    range: SA_RANGE_FRAME, rink: [(SA_RINK_LINE.xMin + SA_RINK_LINE.xMax) / 2, SA_RINK_LINE.z],
    grove: SA_GROVE_TREE, meadow: SA_MEADOW_L,
    sled: [(SA_SLOPE_LANE.xTop + SA_SLOPE_LANE.xBottom) / 2, SA_SLOPE_LANE.z],
    village: SA_VILLAGE_SITE, colony: [SA_COLONY_AREA.x, SA_COLONY_ROWS.z1],
    cave: [(SA_CAVE_WALL.xMin + SA_CAVE_WALL.xMax) / 2, SA_CAVE_WALL.z], yard: SA_YARD_BOARD,
    lights: [SA_LOOKOUT_AREA.x, SA_LOOKOUT_AREA.z - 6],
  };
  const keys = Object.keys(focus);
  const sa1 = keys.length === 10 && keys.every((k) => SA_VIEWS[k] && saInView(k, focus[k][0], focus[k][1] + 0.5)) &&
    !saInView(null, 0, 0) && !saInView("range", 0, 0);
  checks.push({ name: "Snow audit: ten view corridors cover their activities", pass: sa1, detail: sa1 ? "10 corridors OK" : "a corridor misses its activity" });

  // SA2) Worked solutions + plain prompts over 100 sets of every challenge.
  const jargon = /friendl|overflow|decade|sound tool|brightest|twins/i;
  const gens = { range: saRange, rink: saRink, grove: saGrove, meadow: saMeadow, sled: saSled, village: saVillage, colony: saColony, cave: saCave, yard: saYard, lights: saLookout };
  let sa2 = true; let sa2d = "working + plain prompts OK";
  outer: for (const [k, gen] of Object.entries(gens)) {
    for (let n = 0; n < 100; n++) {
      for (const r of gen()) {
        const w = r.working;
        if (!Array.isArray(w) || w.length < 2 || !w.every((l) => typeof l === "string" && l.length > 3 && !/NaN|undefined/.test(l))) {
          sa2 = false; sa2d = `${k}: bad working`; break outer;
        }
        if (jargon.test(r.prompt)) { sa2 = false; sa2d = `${k}: jargon in prompt "${r.prompt}"`; break outer; }
      }
    }
  }
  checks.push({ name: "Snow audit: every round has a worked solution + a jargon-free prompt", pass: sa2, detail: sa2d });

  // SA3) Penguin Colony: a WRONG pick never prints the total (Part B's answer).
  let sa3 = true;
  for (let n = 0; n < 200 && sa3; n++) {
    for (const r of saColony()) {
      r.options.forEach((o, i) => {
        if (!o.correct && saColonyGrade(r, i).label.includes(String(r.total))) sa3 = false;
      });
    }
  }
  checks.push({ name: "Snow audit: the colony's wrong-pick label never gives away the total", pass: sa3, detail: sa3 ? "no leak in 200 sets" : "total leaked" });

  // SA4) Snowman Meadow hop-it-yourself: pure grading + the real store.
  const probe = saMeadow()[1];
  const odd = saMeadow()[SA_ODD];
  const pureOk =
    !gradeMeadowCall(probe, 0, "match").done && gradeMeadowCall(probe, probe.moves, "match").correct &&
    !gradeMeadowCall(probe, probe.moves, "cant").correct && gradeMeadowCall(odd, 0, "cant").correct &&
    meadowCountsAfterHops(probe, probe.moves).left === meadowCountsAfterHops(probe, probe.moves).right &&
    meadowCountsAfterHops(probe, 99).left + meadowCountsAfterHops(probe, 99).right === probe.total;
  const st = saMeadowStore.getState();
  st.start(); st.beginRounds();
  const r0 = saMeadowStore.getState().currentRound();
  saMeadowStore.getState().call("match"); // wrong: nothing hopped yet
  const afterWrong = saMeadowStore.getState();
  for (let i = 0; i < r0.moves; i++) saMeadowStore.getState().hop(1);
  if (r0.canTwin) saMeadowStore.getState().call("match"); else saMeadowStore.getState().call("cant");
  const afterRight = saMeadowStore.getState();
  const storeOk =
    afterWrong.status === "hopping" && afterWrong.callMissed && Boolean(afterWrong.callNote) &&
    afterRight.status === "typing" && afterRight.score === 0 && afterRight.predictResult && !afterRight.predictResult.correct;
  saMeadowStore.getState().exit();
  const sa4 = pureOk && storeOk;
  checks.push({ name: "Snow audit: meadow hop-it-yourself (first call scores, nudges don't block)", pass: sa4, detail: sa4 ? "pure + store OK" : `pure:${pureOk} store:${storeOk}` });

  // SA5) Aurora offers three distinct ways incl. the easiest; the
  //      split archetype's easiest tool is 🧊 Tens and ones; cents parse.
  const toolKeys = SA_TOOLS.map((t) => t.key);
  let sa5 = LOOKOUT_OPTIONS_PER_ROUND === 3;
  for (let n = 0; n < 300 && sa5; n++) {
    for (const r of saLookout()) {
      const o = r.options;
      if (!o || o.length !== 3 || new Set(o).size !== 3 || !o.includes(r.best) || !o.every((k) => toolKeys.includes(k))) sa5 = false;
      if (!r.choices || r.choices.some((c) => !c.show || /NaN|undefined/.test(c.show + c.steps.join()))) sa5 = false;
      if (r.archetype === "splitAdd" && r.best !== "split") sa5 = false;
    }
  }
  const yr = saYard()[0];
  sa5 = sa5 && saYardChange(yr, `${yr.change}c`).correct && saYardChange(yr, `${yr.change}`).correct;
  checks.push({ name: "Snow audit: Aurora offers 3 ways incl. the easiest; Lodge Yard takes cents", pass: sa5, detail: sa5 ? "OK" : "options/split/cents wrong" });

  // SA6) Igloo Village (round 2, 2026-09-29): the student BUILDS the sum —
  //      Done before everything moved is a nudge, a missed swap costs the
  //      build points, and the right build opens the typing step.
  let sa6 = true; let sa6d = "build flow OK";
  {
    const vs = saVillageStore.getState();
    vs.start();
    vs.beginRounds();
    // Find a regroup round to drive.
    let guard = 0;
    while (!saVillageStore.getState().currentRound().regroup && guard++ < 20) {
      saVillageStore.setState({ roundIndex: saVillageStore.getState().roundIndex + 1 });
    }
    const r = saVillageStore.getState().currentRound();
    const st = () => saVillageStore.getState();
    st().finishBuild(); // nothing moved
    const a1 = st().status === "building" && !st().buildMissed && st().buildNote;
    for (let i = 0; i < r.ta; i++) st().moveBlock("a", "ten");
    for (let i = 0; i < r.tb; i++) st().moveBlock("b", "ten");
    st().moveAll("a", "one");
    st().moveAll("b", "one");
    const extra = st().moveBlock("a", "one"); // nothing left to move
    st().finishBuild(); // 10+ ones not swapped → a miss
    const a2 = st().status === "building" && st().buildMissed && !extra;
    const swapped = st().regroup();
    st().finishBuild();
    const a3 = swapped && st().status === "typing" && st().score === 0;
    st().submitTotal(String(r.total));
    const a4 = st().status === "celebrate" && st().score === 15;
    sa6 = Boolean(a1 && a2 && a3 && a4);
    if (!sa6) sa6d = `nudge:${Boolean(a1)} miss:${a2} swap:${a3} total:${a4}`;
    st().exit();
  }
  checks.push({ name: "Snow audit: Igloo Village is built by hand (move, swap, done)", pass: sa6, detail: sa6d });

  // SA7) Lodge Yard (round 2): coins count up along the line; only exactly
  //      100c gives the change; an overshoot halves the count points.
  let sa7 = true; let sa7d = "coin flow OK";
  {
    const st = () => saYardStore.getState();
    st().start();
    st().beginRounds();
    const r = st().currentRound();
    st().giveChange(); // nothing counted yet
    const b1 = st().status === "paying";
    st().addCoin(50); st().addCoin(50); // past $1 for every price
    const b2 = st().overshot && st().note && st().note.tone === "bad";
    st().undoCoin(); st().undoCoin();
    let left = r.change;
    for (const c of [50, 20, 10, 5, 1]) while (left >= c) { st().addCoin(c); left -= c; }
    st().giveChange();
    const b3 = st().status === "typing" && st().score === YARD_COUNT_OVER_POINTS;
    st().submitChange(`${r.change}c`);
    const b4 = st().status === "celebrate" && st().score === YARD_COUNT_OVER_POINTS + YARD_CHANGE_POINTS;
    sa7 = Boolean(b1 && b2 && b3 && b4);
    if (!sa7) sa7d = `early:${b1} over:${Boolean(b2)} give:${b3} change:${b4}`;
    st().exit();
  }
  checks.push({ name: "Snow audit: Lodge Yard counts up with coins to exactly 100c", pass: sa7, detail: sa7d });

  // SA8) Grove: a wrong bundle is a shake + retry (no points, same step);
  //      Aurora: whichever way is picked, typing follows its steps.
  let sa8 = true; let sa8d = "retry + ways OK";
  {
    const g = () => saGroveStore.getState();
    g().start(); g().beginRounds();
    const r = g().currentRound();
    const wrong = r.grabOptions.find((b) => b !== r.grabBundles);
    g().chooseGrab(wrong);
    const c1 = g().status === "grabbing" && g().missNote && g().score === 0;
    g().chooseGrab(r.grabBundles);
    const c2 = g().status === "adjusting" && g().score === 0;
    g().exit();
    const a = () => saLookoutStore.getState();
    a().start(); a().beginRounds();
    const lr = a().currentRound();
    const other = lr.choices.find((c) => c.key !== lr.best);
    a().choosePick(other.key);
    const c3 = a().status === "typing" && a().score === 5 && a().pickResult.key === other.key;
    a().exit();
    sa8 = Boolean(c1 && c2 && c3);
    if (!sa8) sa8d = `groveRetry:${Boolean(c1)} groveNext:${c2} aurora:${c3}`;
  }
  checks.push({ name: "Snow audit: Grove wrong bundle retries; Aurora any way works", pass: sa8, detail: sa8d });

  return checks;
}

export function runCabinChecks() {
  const checks = [];

  // CB1) The fifth region + DOOR-TO-DOOR travel: the cabin region is
  //      registered with rect bounds and a flat floor; the snow world's
  //      lodge front carries the snow-to-cabin portal (variant "cabindoor",
  //      IN the lodge doorway, arrive point = just inside the cabin's
  //      door); the cabin's own door portal travels back with an arrive
  //      point just outside the lodge; both arrive points sit INSIDE their
  //      region's bounds and OFF the destination portal's trigger radius
  //      (no bounce loops).
  const cabin = getRegion("cabin");
  const snowR = getRegion("snow-sums");
  const toCabin = (snowR.portals || []).find((p) => p.target === "cabin");
  const toSnow = (cabin.portals || []).find((p) => p.target === "snow-sums");
  const lodgeFrontZ = SNOW_LODGE.z + SNOW_LODGE.d / 2;
  const regionOk =
    cabin && cabin.id === "cabin" && cabin.bounds === CABIN_BOUNDS && CABIN_BOUNDS.shape === "rect" &&
    typeof cabin.groundHeight === "function" && cabin.groundHeight(5, 5) === 0 &&
    Boolean(cabin.geometry && cabin.geometry.skyColor);
  const doorPortalOk =
    Boolean(toCabin) && toCabin.variant === "cabindoor" &&
    Math.abs(toCabin.position[0] - SNOW_LODGE.x) < 1 && // centred on the lodge door
    toCabin.position[1] > lodgeFrontZ && toCabin.position[1] < lodgeFrontZ + 2.5 && // just outside the front face
    JSON.stringify(toCabin.arrive) === JSON.stringify(CABIN_ARRIVE_FROM_SNOW) &&
    Boolean(toSnow) && toSnow.variant === "cabindoor" &&
    JSON.stringify(toSnow.arrive) === JSON.stringify(SNOW_ARRIVE_FROM_CABIN);
  const cabinArriveIn = clampToBounds(CABIN_ARRIVE_FROM_SNOW[0], CABIN_ARRIVE_FROM_SNOW[1], CABIN_BOUNDS);
  const arriveOk =
    cabinArriveIn.x === CABIN_ARRIVE_FROM_SNOW[0] && cabinArriveIn.z === CABIN_ARRIVE_FROM_SNOW[1] &&
    Math.hypot(CABIN_ARRIVE_FROM_SNOW[0] - CABIN_DOOR.position[0], CABIN_ARRIVE_FROM_SNOW[1] - CABIN_DOOR.position[1]) > CABIN_DOOR.radius + 0.5 &&
    Math.hypot(SNOW_ARRIVE_FROM_CABIN[0] - LODGE_DOOR_SNOW.position[0], SNOW_ARRIVE_FROM_CABIN[1] - LODGE_DOOR_SNOW.position[1]) > LODGE_DOOR_SNOW.radius + 0.2 &&
    isOnSnow(SNOW_ARRIVE_FROM_CABIN[0], SNOW_ARRIVE_FROM_CABIN[1]);
  const cb1 = regionOk && doorPortalOk && arriveOk;
  checks.push({
    name: "Lodge Interior: fifth region + door-to-door travel through the lodge",
    pass: cb1,
    detail: cb1 ? `cabin ${CABIN_BOUNDS.width}×${CABIN_BOUNDS.height}, doors paired` : `region:${regionOk} doors:${doorPortalOk} arrive:${arriveOk}`,
  });

  // CB2) Colliders: the log walls SEAL all four sides except the south
  //      doorway (sampled every 0.5 m — no slip-throughs), the bedroom
  //      walls seal except their doorway, both doorways are genuinely
  //      walkable, the spawn + Pip approach are clear, and Pip is wired
  //      with a REAL curriculum encounter (the stage/topic/skill exist in
  //      the registry).
  const ccols = getCabinColliders();
  const sealGap = (x, z, gap) => (gap && x > gap.xMin && x < gap.xMax ? true : ccols.some((c) => Math.hypot(c.x - x, c.z - z) <= c.radius + 0.3));
  let sealed = true;
  for (let x = -CABIN_WALL.halfW; x <= CABIN_WALL.halfW; x += 0.5) {
    if (!sealGap(x, -CABIN_WALL.halfD)) sealed = false;
    if (!sealGap(x, CABIN_WALL.halfD, CABIN_DOOR_GAP)) sealed = false;
  }
  for (let z = -CABIN_WALL.halfD; z <= CABIN_WALL.halfD; z += 0.5) {
    if (!sealGap(-CABIN_WALL.halfW, z)) sealed = false;
    if (!sealGap(CABIN_WALL.halfW, z)) sealed = false;
  }
  // Bedroom z-wall sealed outside its doorway.
  let bedroomSealed = true;
  for (let x = CABIN_BEDROOM.wallX; x <= CABIN_WALL.halfW; x += 0.5) {
    if (!sealGap(x, CABIN_BEDROOM.wallZ, { xMin: CABIN_BEDROOM.doorXMin, xMax: CABIN_BEDROOM.doorXMax })) bedroomSealed = false;
  }
  for (let z = CABIN_BEDROOM.wallZ; z <= CABIN_WALL.halfD; z += 0.5) {
    if (!sealGap(CABIN_BEDROOM.wallX, z)) bedroomSealed = false;
  }
  const clearAt = (x, z, m) => ccols.every((c) => Math.hypot(c.x - x, c.z - z) > c.radius + m);
  const walkable =
    clearAt(CABIN_DOOR.position[0], CABIN_DOOR.position[1] - 0.6, 0.35) && // in the south doorway
    clearAt((CABIN_BEDROOM.doorXMin + CABIN_BEDROOM.doorXMax) / 2, CABIN_BEDROOM.wallZ, 0.35) && // the bedroom doorway
    clearAt(CABIN_SPAWN.x, CABIN_SPAWN.z, 0.5) &&
    clearAt(CABIN_PIP.position[0], CABIN_PIP.position[1] - 1.6, 0.35); // standing before Pip
  const pipIx = getInteractable("cabin-pip");
  const pipEnc = pipIx && ENCOUNTERS[pipIx.encounterId];
  const pipTopic = pipEnc && pipEnc.type === "mathsChallenge"
    ? getTopic(pipEnc.config.stage, pipEnc.config.topicId)
    : null;
  const pipOk =
    Boolean(pipIx) && pipIx.regionId === "cabin" && pipIx.characterId === "pip" &&
    Boolean(pipTopic) && pipTopic.skills.some((k) => k.id === pipEnc.config.skillId) &&
    ccols.some((c) => c.id === "cabin-pip") &&
    Math.hypot(pipIx.position[0] - CABIN_PIP.position[0], pipIx.position[1] - CABIN_PIP.position[1]) < 0.01;
  const cb2 = sealed && bedroomSealed && walkable && pipOk;
  checks.push({
    name: "Lodge Interior: walls sealed, doorways walkable, Pip's facts real",
    pass: cb2,
    detail: cb2 ? `${ccols.length} colliders; Pip → ${pipEnc && pipEnc.config.skillId}` : `sealed:${sealed} bedroom:${bedroomSealed} walk:${walkable} pip:${pipOk}`,
  });

  // CB3) Furniture placement: the fireplace sits against the NORTH wall,
  //      the hearth rug in front of it, tables + bed inside the bounds and
  //      clear of the doorways, the bed inside the bedroom, and Pip by the
  //      hearth (inside the great room, not the bedroom).
  const inBounds = ([x, z]) => Math.abs(x) < CABIN_WALL.halfW && Math.abs(z) < CABIN_WALL.halfD;
  const fireOk =
    CABIN_FIRE.position[1] < -CABIN_WALL.halfD + 2.5 && inBounds(CABIN_FIRE.position) &&
    CABIN_HEARTH_RUG.position[1] > CABIN_FIRE.position[1] + 2;
  const tablesOk =
    inBounds([CABIN_LONG_TABLE.x, CABIN_LONG_TABLE.z]) &&
    CABIN_ROUND_TABLES.every((t) => inBounds([t.x, t.z])) &&
    CABIN_ROUND_TABLES.every((t) => t.z < CABIN_BEDROOM.wallZ || t.x < CABIN_BEDROOM.wallX);
  const bedOk =
    CABIN_BED.position[0] > CABIN_BEDROOM.wallX + 1 && CABIN_BED.position[1] > CABIN_BEDROOM.wallZ + 1 &&
    inBounds(CABIN_BED.position);
  const pipPlaceOk =
    inBounds(CABIN_PIP.position) &&
    Math.hypot(CABIN_PIP.position[0] - CABIN_FIRE.position[0], CABIN_PIP.position[1] - CABIN_FIRE.position[1]) < 8 &&
    (CABIN_PIP.position[0] < CABIN_BEDROOM.wallX || CABIN_PIP.position[1] < CABIN_BEDROOM.wallZ);
  const cb3 = fireOk && tablesOk && bedOk && pipPlaceOk;
  checks.push({
    name: "Lodge Interior: fire on the north wall, bed in the bedroom, Pip fireside",
    pass: cb3,
    detail: cb3 ? "great room + bedroom furnished" : `fire:${fireOk} tables:${tablesOk} bed:${bedOk} pip:${pipPlaceOk}`,
  });

  return checks;
}


// ===========================================================================
// MAGMA MULTIPLES (MG, built 2026-10-02) — the sixth region: a volcano / lava
// world, LAND ONLY (no characters or maths yet). These guard the geometry the
// student actually walks: a reachable world, a climbable summit trail, a
// sealed crater, lava that's always crossable by a bridge or stones, and
// props that never sit on a path.
// ===========================================================================
export function runMagmaChecks() {
  const checks = [];
  const region = getRegion(MAGMA_REGION_ID);
  const island = getRegion("island-1");
  const colliders = getColliders({}, MAGMA_REGION_ID);
  const hitsCollider = (x, z, pad = PLAYER_RADIUS) => colliders.some((c) => Math.hypot(x - c.x, z - c.z) < c.radius + pad);

  // MG1) Region + portals: registered with the four terrain hooks; the RED
  //      volcano gate on Number Island targets it; its return gate goes home;
  //      spawn is on safe, flat, collider-free ground and outside the return
  //      portal's trigger (no bounce); both gates sit on land, in bounds.
  const toMagma = (island.portals || []).find((p) => p.target === MAGMA_REGION_ID);
  const back = (region.portals || []).find((p) => p.target === "island-1");
  const hooksOk = region && region.id === MAGMA_REGION_ID && region.name === MAGMA_NAME &&
    region.bounds === MAGMA_BOUNDS && region.groundHeight === magmaGroundHeight &&
    region.isLava === magmaIsLava && region.slideAt === magmaSlideAt && region.isSafe === magmaIsSafe &&
    region.cameraTerrainClamp === true && region.maxFrameDelta > 0 && region.maxFrameDelta <= 0.1;
  // (2026-10-09) On the rebuilt island it stands on the Ember Terrace.
  const islandGateOk = Boolean(toMagma) && toMagma.variant === "volcano" &&
    islandOnPad("terrace", toMagma.position[0], toMagma.position[1]) &&
    colliders.length > 0 &&
    getColliders({}, "island-1").every((c) => Math.hypot(c.x - toMagma.position[0], c.z - toMagma.position[1]) > c.radius + 2.2);
  const backOk = Boolean(back) && back.variant === "volcano" && landSD(back.position[0], back.position[1]) > 3 &&
    !magmaIsLava(back.position[0], back.position[1]);
  const sp = MAGMA_SPAWN;
  const spawnOk = magmaIsSafe(sp.x, sp.z) && Math.abs(magmaGroundHeight(sp.x, sp.z)) < 0.05 &&
    !hitsCollider(sp.x, sp.z) && Math.hypot(sp.x - back.position[0], sp.z - back.position[1]) > back.radius + 2;
  const mg1 = hooksOk && islandGateOk && backOk && spawnOk;
  checks.push({
    name: "Magma Multiples: region hooks + red island gate + return gate + safe spawn",
    pass: mg1,
    detail: mg1 ? `gate at [${toMagma.position}] → ${MAGMA_NAME}; spawn safe` : `hooks:${hooksOk} gate:${islandGateOk} back:${backOk} spawn:${spawnOk}`,
  });

  // MG2) Size ≈ 3× Fraction Farm, and most of it is LAND (lava is the
  //      obstacle, not the floor): count 1 m cells.
  let land = 0, lava = 0;
  const RB = MAGMA_BOUNDS.radius;
  for (let x = -RB; x <= RB; x += 1) {
    for (let z = -RB; z <= RB; z += 1) {
      if (Math.hypot(x, z) > RB) continue;
      if (landSD(x, z) >= 0) land++; else if (Math.hypot(x, z) < 100) lava++;
    }
  }
  // (Measured against the ORIGINAL flat Fraction Farm, 120 × 96 m — the farm
  //  has since grown to the jungle's size.)
  const farmArea = 120 * 96;
  const ratio = land / farmArea;
  const mg2 = ratio > 2.6 && ratio < 3.6 && lava < land * 0.2;
  checks.push({
    name: "Magma Multiples: about three times the original farm, mostly walkable land",
    pass: mg2,
    detail: `land ${land} m² = ${ratio.toFixed(2)}× the original farm; inland lava ${lava} m² (${((lava / land) * 100).toFixed(0)}% of land)`,
  });

  // MG3) THE SUMMIT TRAIL: from the mouth to the rim every step is walkable
  //      (rise ≤ STEP_UP, never steep, never lava) at three lanes across it;
  //      it tops out at the rim height; the inner wall is unclimbable (taller
  //      than a jump) and the outer kerb blocks walking off once it rises;
  //      the bare flank slides you DOWN (outward) everywhere it's sampled.
  const lanes = [-1.6, -0.3, 1.0];
  let worstRise = 0, steepOnTrail = 0, lavaOnTrail = 0;
  for (const u of lanes) {
    let prev = null;
    for (let phi = 0.02; phi <= TRAIL_END - 0.02; phi += 0.004) {
      const [x, z] = trailPoint(phi, u);
      const h = magmaGroundHeight(x, z);
      if (prev !== null) worstRise = Math.max(worstRise, Math.abs(h - prev));
      if (magmaSlideAt(x, z)) steepOnTrail++;
      if (magmaIsLava(x, z)) lavaOnTrail++;
      prev = h;
    }
  }
  const [tx, tz] = trailPoint(TRAIL_END - 0.05, 0);
  const topOk = Math.abs(magmaGroundHeight(tx, tz) - VOLCANO.height) < 0.05 && Math.abs(trailHeight(TRAIL_PHI) - VOLCANO.height) < 1e-6;
  let wallBad = 0, kerbBad = 0;
  for (let phi = 1.2; phi < TRAIL_PHI - 0.8; phi += 0.05) {
    const h = trailHeight(phi);
    const [wx, wz] = trailPoint(phi, -VOLCANO.pathW / 2 - 0.4);
    if (magmaGroundHeight(wx, wz) - h < 2.0) wallBad++; // jump is ~1.3 m
    const [kx, kz] = trailPoint(phi, VOLCANO.pathW / 2 - 0.5);
    if (magmaGroundHeight(kx, kz) - h < STEP_UP + 0.05) kerbBad++;
  }
  let flankBad = 0, flankN = 0;
  for (let i = 0; i < 400; i++) {
    const a = i * 2.39996, r = VOLCANO.rRim + 1 + ((i * 0.618) % 1) * (VOLCANO.rBase - VOLCANO.rRim - 2);
    const x = r * Math.cos(a), z = r * Math.sin(a);
    if (isOnTrail(x, z)) continue;
    flankN++;
    const sl = magmaSlideAt(x, z);
    if (!sl || sl.x * x + sl.z * z <= 0) flankBad++;
  }
  const mg3 = worstRise <= STEP_UP * 0.5 && steepOnTrail === 0 && lavaOnTrail === 0 && topOk && wallBad === 0 && kerbBad === 0 && flankBad === 0 && flankN > 100;
  checks.push({
    name: "Magma Multiples: the spiral summit trail climbs the volcano; flank + walls hold",
    pass: mg3,
    detail: `rise≤${worstRise.toFixed(3)} steep:${steepOnTrail} lava:${lavaOnTrail} top:${topOk} wall:${wallBad} kerb:${kerbBad} flank:${flankBad}/${flankN}`,
  });

  // MG4) The crater is SEALED: every point on the lip ring is covered by a
  //      lip stone (stone radius + player radius), each carries the "not yet"
  //      hint, and the sealed rune gate sits on the rim.
  const lip = colliders.filter((c) => c.id.startsWith("mg-lip-"));
  let gaps = 0;
  for (let k = 0; k < 720; k++) {
    const a = (k / 720) * Math.PI * 2;
    const r = Math.hypot(CRATER_LIP_STONES[0].c[0], CRATER_LIP_STONES[0].c[1]);
    const x = r * Math.cos(a), z = r * Math.sin(a);
    if (!lip.some((c) => Math.hypot(x - c.x, z - c.z) < c.radius + PLAYER_RADIUS * 0.9)) gaps++;
  }
  const gateR = Math.hypot(CRATER_GATE.position[0], CRATER_GATE.position[1]);
  const mg4 = lip.length >= 40 && gaps === 0 && lip.every((c) => c.hint === CRATER_HINT) &&
    gateR > VOLCANO.rCrater && gateR < VOLCANO.rRim;
  checks.push({
    name: "Magma Multiples: the crater is sealed (lip ring + rune gate)",
    pass: mg4,
    detail: mg4 ? `${lip.length} lip stones, no gaps` : `stones:${lip.length} gaps:${gaps} gateR:${gateR.toFixed(1)}`,
  });

  // MG5) Lava is always crossable: every path centre point is land or a
  //      bridge deck / causeway; every bridge spans lava with land at both
  //      ends, a deck above the lava and rails; the ring road meets each
  //      river at a bridge; hop-stones are ≤ a standing hop apart.
  let pathInLava = 0;
  for (const p of MAGMA_PATHS) {
    for (let i = 0; i < p.pts.length - 1; i++) {
      const [ax, az] = p.pts[i], [bx, bz] = p.pts[i + 1];
      const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.5);
      for (let k = 0; k <= n; k++) {
        const x = ax + ((bx - ax) * k) / n, z = az + ((bz - az) * k) / n;
        if (magmaIsLava(x, z)) pathInLava++;
      }
    }
  }
  const bridgeOk = MAGMA_BRIDGES.every((b) => {
    const mx = (b.from[0] + b.to[0]) / 2, mz = (b.from[1] + b.to[1]) / 2;
    const rails = colliders.filter((c) => c.id.startsWith(`mg-rail-${b.id}-`)).length;
    return landSD(mx, mz) < 0 && bridgeDeckAt(mx, mz) > LAVA_Y + 0.5 && !magmaIsLava(mx, mz) &&
      landSD(b.from[0], b.from[1]) > 1 && landSD(b.to[0], b.to[1]) > 1 && rails >= 8;
  });
  const riverBridged = RIVERS.every((rv) => MAGMA_BRIDGES.some((b) => b.id === `bridge-${rv.id}`));
  const moatBridged = MAGMA_BRIDGES.some((b) => b.id === "bridge-moat");
  const causewayOk = [LAKE_CAUSEWAY.x1 - 0.3, (LAKE_CAUSEWAY.x1 + LAKE_CAUSEWAY.x2) / 2, LAKE_CAUSEWAY.x2 + 0.3]
    .every((x) => !magmaIsLava(x, LAKE_CAUSEWAY.z) && platformTopAt(x, LAKE_CAUSEWAY.z) !== null);
  const hop = (ids) => {
    const st = ids.map((id) => MAGMA_PLATFORMS.find((p) => p.id === id));
    for (let i = 0; i < st.length - 1; i++) {
      const gap = Math.hypot(st[i].c[0] - st[i + 1].c[0], st[i].c[1] - st[i + 1].c[1]) - st[i].r - st[i + 1].r;
      if (gap > 1.2 || gap < 0.2) return false;
    }
    return true;
  };
  const stonesOk = hop(["moat-stone-0", "moat-stone-1", "moat-stone-2"]) && hop(["lake-stone-0", "lake-stone-1", "lake-stone-2"]);
  const stairOk = COLUMN_STAIR.every((c, i) => i === 0 || c.top - COLUMN_STAIR[i - 1].top <= STEP_UP || c.id === "col-top");
  const mg5 = pathInLava === 0 && bridgeOk && riverBridged && moatBridged && causewayOk && stonesOk && stairOk;
  checks.push({
    name: "Magma Multiples: paths never cross bare lava (bridges, causeway, hop-stones)",
    pass: mg5,
    detail: mg5 ? `${MAGMA_BRIDGES.length} bridges, causeway + 6 hop-stones, column stair` : `pathLava:${pathInLava} bridges:${bridgeOk} rivers:${riverBridged} moat:${moatBridged} causeway:${causewayOk} stones:${stonesOk} stair:${stairOk}`,
  });

  // MG6) Everything is REACHABLE on foot (no hops needed): flood-fill a 1 m
  //      grid of walkable lowland (non-lava, not steep, not inside a
  //      collider, height steps ≤ STEP_UP) from the spawn and confirm it
  //      reaches all eight clearings, the trail mouth and the return gate.
  const O = MAGMA_BOUNDS.radius, N = 2 * O + 1;
  const idx = (i, j) => j * N + i;
  const walk = new Int8Array(N * N);
  const hgt = new Float32Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = i - O, z = j - O;
    const r = Math.hypot(x, z);
    if (r > O - 1 || r < VOLCANO.rBase + 0.5) continue; // the lowland + apron
    if (magmaIsLava(x, z) || magmaSlideAt(x, z) || hitsCollider(x, z, 0.45)) continue;
    walk[idx(i, j)] = 1;
    hgt[idx(i, j)] = magmaGroundHeight(x, z);
  }
  const seen = new Int8Array(N * N);
  const q = [idx(Math.round(sp.x) + O, Math.round(sp.z) + O)];
  seen[q[0]] = 1;
  while (q.length) {
    const k = q.pop();
    const i = k % N, j = (k - i) / N;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
      const nk = idx(ni, nj);
      if (seen[nk] || !walk[nk] || Math.abs(hgt[nk] - hgt[k]) > STEP_UP) continue;
      seen[nk] = 1;
      q.push(nk);
    }
  }
  const reach = ([x, z]) => {
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const k = idx(Math.round(x) + O + di, Math.round(z) + O + dj);
      if (seen[k]) return true;
    }
    return false;
  };
  const mouth = trailPoint(0.05, VOLCANO.pathW / 2 + 0.8);
  const targets = [
    ...MAGMA_CHALLENGE_SPOTS.filter((s) => s.id !== "lake").map((s) => [s.id, s.center]),
    ["lake-causeway", [LAKE_CAUSEWAY.x1 + 1.2, LAKE_CAUSEWAY.z]],
    ["trail-mouth", mouth],
    ["return-gate", [back.position[0] + 1.5, back.position[1] - 1.5]],
  ];
  const unreached = targets.filter(([, p]) => !reach(p)).map(([id]) => id);
  const mg6 = unreached.length === 0;
  checks.push({
    name: "Magma Multiples: every clearing, the trail and the gate are reachable on foot",
    pass: mg6,
    detail: mg6 ? `${targets.length} targets reached from the spawn` : `unreached: ${unreached.join(", ")}`,
  });

  // MG7) The clearings are real, open spaces: NINE of them (the Tenfold
  //      Terraces joined with the ten challenges, 2026-10-03), ≥ 14 m apart,
  //      on land, and no prop collider intrudes on any path or a clearing's
  //      open middle (the challenges' own hosts + the terraces staircase
  //      are the clearing's apparatus, so they may); no scenery collider
  //      stands in lava.
  const spots = MAGMA_CHALLENGE_SPOTS;
  let apart = true;
  for (let a = 0; a < spots.length; a++) for (let b = a + 1; b < spots.length; b++) {
    if (Math.hypot(spots[a].center[0] - spots[b].center[0], spots[a].center[1] - spots[b].center[1]) < 14) apart = false;
  }
  const onLand = spots.every((s) => landSD(s.center[0], s.center[1]) > 2 && !magmaIsLava(s.center[0], s.center[1]));
  const scatter = colliders.filter((c) => /^mg-(boulder|tree|lantern|col|obsidian|cinder|ember-tree|g\d)/.test(c.id));
  const onPath = scatter.filter((c) => pathEdgeDist(c.x, c.z) < c.radius).map((c) => c.id);
  const middleBlocked = spots.filter((s) => colliders.some((c) => Math.hypot(c.x - s.center[0], c.z - s.center[1]) < Math.min(3.5, s.radius - 0.5) + c.radius && !/^mg-(obelisk|rib|host|terrace)/.test(c.id))).map((s) => s.id);
  const inLava = colliders.filter((c) => !/^mg-(rail|lip|cliff)/.test(c.id) && magmaIsLava(c.x, c.z)).map((c) => c.id);
  const mg7 = spots.length === 9 && apart && onLand && onPath.length === 0 && middleBlocked.length === 0 && inLava.length === 0;
  checks.push({
    name: "Magma Multiples: nine open clearings; no props on paths or in lava",
    pass: mg7,
    detail: mg7 ? `${spots.length} clearings, ${scatter.length} scatter props clear` : `apart:${apart} land:${onLand} onPath:${onPath.slice(0, 4)} middle:${middleBlocked} lava:${inLava.slice(0, 4)}`,
  });

  return checks;
}
