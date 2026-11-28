/* ============================================================================
   Mills Maths Tools — Resources by Stage : CONTENT STATEMENTS ("ideas")
   ----------------------------------------------------------------------------
   The content statements of the NSW Mathematics K–10 Syllabus (2022) for every
   Stage 1, 2, 3, 4 and 5 outcome on the Resources by Stage page. On the page each
   statement is an "idea": click it and the resources filed under it open.

   WORDING: verbatim from NESA's own "Record of learning and achievement using
   syllabus content" documents (Stages 1 to 5, February 2024), which list
   every focus area's content statements. Stage 3 statements there carry a
   prefix such as "Whole numbers:" or "Length:" — it is kept here as `group`.
   © NSW Education Standards Authority for and on behalf of the Crown in right
   of the State of New South Wales.

   SHAPE
   -----
     "MA4-INT-C-01": [ { id, text, part?, group? }, … ]   in syllabus order

     id     short slug, unique within its outcome. Resources point at it.
     text   the content statement, word for word.
     part   Stages 1–3 only: "A" or "B" — which half of the focus area
            (a Year 5 / Year 6 emphasis of the same outcomes).
     group  Stages 1–3 only: NESA's sub-heading ("Whole numbers", "Area", …).

   STAGES 1 AND 2 (added 2026-11-28): a statement is filed under the outcome it serves, as for
   Stage 3. Two Data statements name both outcomes' work ("Represent … and describe the
   displays", "Construct and interpret …"), so they are listed under BOTH Data outcomes.

   Stage 3 focus areas list their statements against several outcomes at once
   (Geometric measure A → MA3-GM-01/02/03). Each statement is filed under the
   outcome it serves — the NESA sub-heading decides it where there is one
   (Position → GM-01, Length → GM-02, Angles → GM-03).

   HOW A RESOURCE IS FILED UNDER AN IDEA
   -------------------------------------
   Give the resource an `ideas` array of these ids — on the resource itself, in
   resourcesManifest.js (your files) or toolLinks.js (site tools):

     { title:"Integers — Practice Quiz", kind:"Student quiz", url:"…",
       ideas:["add-subtract","multiply-divide"] }

   A resource with no `ideas` (or an id that isn't listed here) still shows —
   under "Across the whole outcome" at the foot of the outcome.
   ========================================================================== */

window.MMT_CONTENT = {

  meta: {
    source: "NSW Mathematics K–10 Syllabus (2022), NESA — content statements as listed in NESA's Record of learning and achievement using syllabus content (Stages 1–5, February 2024)",
    url: "https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-k-10-2022",
    checked: "2026-11-28"
  },

  statements: {

    /* ======================= STAGE 1 ======================= */

    "MA1-RWN-01": [
      { id:"counting-ones", part:"A", text:"Use counting sequences of ones with two-digit numbers and beyond" },
      { id:"number-patterns", part:"A", text:"Continue and create number patterns" },
      { id:"numbers-on-line", part:"A", text:"Represent numbers on a line" },
      { id:"counting-ones-tens", part:"B", text:"Use counting sequences of ones and tens flexibly" }
    ],
    "MA1-RWN-02": [
      { id:"groups-of-ten", part:"A", text:"Represent the structure of groups of ten in whole numbers" },
      { id:"three-digit", part:"B", text:"Form, regroup, and rename three-digit numbers" }
    ],
    "MA1-CSQ-01": [
      { id:"count-by-one", part:"A", text:"Use advanced count-by-one strategies to solve addition and subtraction problems" },
      { id:"number-bonds", part:"A", text:"Recognise and recall number bonds up to ten" },
      { id:"flexible-strategies", part:"A", text:"Use flexible strategies to solve addition and subtraction problems" },
      { id:"equality", part:"A", text:"Represent equality" },
      { id:"additive-relations", part:"B", text:"Represent and reason about additive relations" },
      { id:"multiples-of-ten", part:"B", text:"Form multiples of ten when adding and subtracting two-digit numbers" },
      { id:"equality-problems", part:"B", text:"Use knowledge of equality to solve related problems" }
    ],
    "MA1-FG-01": [
      { id:"skip-counting", part:"A", text:"Count in multiples using rhythmic and skip counting" },
      { id:"skip-patterns", part:"A", text:"Use skip counting patterns" },
      { id:"equal-groups", part:"A", text:"Model and use equal groups of objects to represent multiplication" },
      { id:"division", part:"A", text:"Recognise and represent division" },
      { id:"combining-groups", part:"B", text:"Represent and explain multiplication as the combining of equal groups" },
      { id:"doubling-halving", part:"B", text:"Model doubling and halving with fractions" },
      { id:"mult-div-problems", part:"B", text:"Represent multiplication and division problems" }
    ],
    "MA1-GM-01": [
      { id:"follow-directions", part:"A", group:"Position", text:"Follow directions to familiar locations" },
      { id:"simple-maps", part:"B", group:"Position", text:"Explore simple maps of familiar locations" }
    ],
    "MA1-GM-02": [
      { id:"measure-informal", part:"A", group:"Length", text:"Measure the lengths of objects using uniform informal units" },
      { id:"compare-informal", part:"A", group:"Length", text:"Compare lengths using uniform informal units" },
      { id:"order-lengths", part:"B", group:"Length", text:"Compare and order lengths, using appropriate uniform informal units" },
      { id:"formal-units", part:"B", group:"Length", text:"Recognise and use formal units to measure the lengths of objects" }
    ],
    "MA1-GM-03": [
      { id:"halves-quarters", part:"A", group:"Length", text:"Subdivide lengths to find halves and quarters" },
      { id:"eighths", part:"B", group:"Length", text:"Repeatedly halve lengths to form eighths" }
    ],
    "MA1-2DS-01": [
      { id:"classify-shapes", part:"A", group:"2D shapes", text:"Recognise and classify shapes using obvious features" },
      { id:"slides-reflections", part:"A", group:"2D shapes", text:"Transform shapes with slides and reflections" },
      { id:"combine-separate", part:"B", group:"2D shapes", text:"Represent, combine and separate two-dimensional shapes" },
      { id:"quarter-turns", part:"B", group:"2D shapes", text:"Identify and describe the orientation of shapes using quarter turns" }
    ],
    "MA1-2DS-02": [
      { id:"compare-indirectly", part:"A", group:"Area", text:"Indirectly compare area" },
      { id:"informal-units", part:"A", group:"Area", text:"Measure areas using uniform informal units" },
      { id:"rows-columns", part:"B", group:"Area", text:"Compare rectangular areas using uniform square units of an appropriate size in rows and columns" }
    ],
    "MA1-3DS-01": [
      { id:"recognise-objects", part:"A", group:"3D objects", text:"Recognise familiar three-dimensional objects" },
      { id:"sort-describe", part:"A", group:"3D objects", text:"Sort and describe three-dimensional objects" },
      { id:"features", part:"B", group:"3D objects", text:"Describe the features of three-dimensional objects" }
    ],
    "MA1-3DS-02": [
      { id:"filling", part:"A", group:"Volume", text:"Measure and compare the internal volumes (capacities) of containers by filling" },
      { id:"packing", part:"A", group:"Volume", text:"Measure the internal volume (capacity) of containers by packing" },
      { id:"construct-cubes", part:"A", group:"Volume", text:"Construct volumes using cubes" },
      { id:"compare-containers", part:"B", group:"Volume", text:"Compare containers based on internal volume (capacity) by filling and packing" },
      { id:"compare-volumes", part:"B", group:"Volume", text:"Compare volumes using uniform informal units" }
    ],
    "MA1-NSM-01": [
      { id:"investigate-balance", part:"A", group:"Mass", text:"Investigate mass using an equal-arm balance" },
      { id:"compare-balance", part:"B", group:"Mass", text:"Compare the masses of objects using an equal-arm balance" }
    ],
    "MA1-NSM-02": [
      { id:"months", part:"A", group:"Time", text:"Name and order the cycle of months" },
      { id:"half-hour", part:"A", group:"Time", text:"Tell time to the half-hour" },
      { id:"duration", part:"B", group:"Time", text:"Describe duration using units of time" },
      { id:"quarter-hour", part:"B", group:"Time", text:"Tell time to the quarter-hour using the language of ‘past’ and ‘to’" }
    ],
    "MA1-DATA-01": [
      { id:"ask-gather", part:"A", text:"Ask questions and gather data" },
      { id:"represent-describe", part:"A", text:"Represent data with objects and drawings and describe the displays" },
      { id:"question-of-interest", part:"B", text:"Identify a question of interest and gather relevant data" },
      { id:"create-interpret", part:"B", text:"Create displays of data and interpret them" }
    ],
    "MA1-DATA-02": [
      { id:"represent-describe", part:"A", text:"Represent data with objects and drawings and describe the displays" },
      { id:"create-interpret", part:"B", text:"Create displays of data and interpret them" }
    ],
    "MA1-CHAN-01": [
      { id:"possible-outcomes", part:"A", text:"Identify and describe possible outcomes" },
      { id:"activities-chance", part:"B", text:"Identify and describe activities that involve chance" }
    ],

    /* ======================= STAGE 2 ======================= */

    "MA2-RN-01": [
      { id:"read-order-thousands", part:"A", group:"Whole numbers", text:"Read, represent and order numbers to thousands" },
      { id:"partition-4-digits", part:"A", group:"Whole numbers", text:"Apply place value to partition and regroup numbers up to 4 digits" },
      { id:"order-thousands", part:"B", group:"Whole numbers", text:"Order numbers in the thousands" },
      { id:"rename-6-digits", part:"B", group:"Whole numbers", text:"Apply place value to partition, regroup and rename numbers up to 6 digits" },
      { id:"times-as-large", part:"B", group:"Whole numbers", text:"Recognise and represent numbers that are 10, 100 or 1000 times as large" }
    ],
    "MA2-RN-02": [
      { id:"tenths-hundredths", part:"B", group:"Decimals", text:"Extend the application of the place value system from whole numbers to tenths and hundredths" },
      { id:"fractions-decimals", part:"B", group:"Decimals", text:"Make connections between fractions and decimal notation" }
    ],
    "MA2-AR-01": [
      { id:"add-subtract-connection", part:"A", text:"Recognise and explain the connection between addition and subtraction" },
      { id:"select-strategies", part:"A", text:"Select strategies flexibly to solve addition and subtraction problems of up to 3 digits" },
      { id:"money-values", part:"A", text:"Represent money values in multiple ways" },
      { id:"partition-regroup", part:"B", text:"Partition, rearrange and regroup numbers to at least 1000 to solve additive problems" },
      { id:"money-budgeting", part:"B", text:"Apply addition and subtraction to familiar contexts, including money and budgeting" }
    ],
    "MA2-AR-02": [
      { id:"equality", part:"A", text:"Use the principle of equality" },
      { id:"number-sentences", part:"B", text:"Complete number sentences involving additive relations to find unknown quantities" }
    ],
    "MA2-MR-01": [
      { id:"patterns", part:"A", text:"Generate and describe patterns" },
      { id:"arrays-facts", part:"A", text:"Use arrays to establish multiplication facts from multiples of 2 and 4, 5 and 10" },
      { id:"recall-facts", part:"A", text:"Recall multiplication facts of 2 and 4, 5 and 10 and related division facts" },
      { id:"related-multiples", part:"B", text:"Investigate number sequences involving related multiples" },
      { id:"known-facts", part:"B", text:"Use known number facts and strategies" },
      { id:"area-model", part:"B", text:"Use the structure of the area model to represent multiplication and division" },
      { id:"number-properties", part:"B", text:"Use number properties to find related multiplication facts" },
      { id:"multiples-of-10", part:"B", text:"Operate with multiples of 10" }
    ],
    "MA2-MR-02": [
      { id:"fact-families", part:"A", text:"Represent and solve problems involving multiplication fact families" },
      { id:"word-problems", part:"B", text:"Represent and solve word problems with number sentences involving multiplication or division" }
    ],
    "MA2-PF-01": [
      { id:"fractional-parts", part:"A", text:"Create fractional parts of a length using techniques other than repeated halving" },
      { id:"unit-fractions-line", part:"A", text:"Model and represent unit fractions, and their multiples, to a complete whole on a number line" },
      { id:"equivalent-lengths", part:"B", text:"Model equivalent fractions as lengths" },
      { id:"greater-than-one", part:"B", text:"Represent fractional quantities equal to and greater than one" }
    ],
    "MA2-GM-01": [
      { id:"movement-map", part:"A", group:"Position", text:"Interpret movement on a map" },
      { id:"grid-positions", part:"A", group:"Position", text:"Locate positions on grid maps" },
      { id:"create-grid-maps", part:"B", group:"Position", text:"Create and interpret grid maps" },
      { id:"describe-routes", part:"B", group:"Position", text:"Use directional language and describe routes with grid maps" }
    ],
    "MA2-GM-02": [
      { id:"m-cm-mm", part:"A", group:"Length", text:"Measure and compare objects using metres, centimetres and millimetres" },
      { id:"scaled-instruments", part:"B", group:"Length", text:"Use scaled instruments to measure and compare lengths" }
    ],
    "MA2-GM-03": [
      { id:"measures-of-turn", part:"A", group:"Angles", text:"Identify angles as measures of turn" },
      { id:"compare-right-angle", part:"B", group:"Angles", text:"Compare angles to a right angle" }
    ],
    "MA2-2DS-01": [
      { id:"features", part:"A", group:"2D shapes", text:"Compare and describe features of two-dimensional shapes" },
      { id:"symmetry", part:"B", group:"2D shapes", text:"Create symmetrical patterns and shapes" }
    ],
    "MA2-2DS-02": [
      { id:"transform", part:"A", group:"2D shapes", text:"Transform shapes by reflecting, translating and rotating" },
      { id:"combine-split", part:"B", group:"2D shapes", text:"Create two-dimensional shapes that result from combining and splitting common shapes" }
    ],
    "MA2-2DS-03": [
      { id:"square-centimetres", part:"A", group:"Area", text:"Use square centimetres to measure and estimate the areas of rectangles" },
      { id:"square-metres", part:"A", group:"Area", text:"Use square metres to measure and estimate the areas of rectangles" },
      { id:"grid-structure", part:"B", group:"Area", text:"Measure the areas of shapes using the grid structure" },
      { id:"compare-surfaces", part:"B", group:"Area", text:"Compare surfaces using familiar metric units of area" }
    ],
    "MA2-3DS-01": [
      { id:"models", part:"A", group:"3D objects", text:"Make models of three-dimensional objects to compare and describe key features" },
      { id:"representations", part:"B", group:"3D objects", text:"Connect three-dimensional objects and two-dimensional representations" }
    ],
    "MA2-3DS-02": [
      { id:"litres", part:"A", group:"Volume", text:"Measure and order containers using litres" },
      { id:"metric-volume", part:"A", group:"Volume", text:"Compare objects using familiar metric units of volume" },
      { id:"scaled-capacity", part:"B", group:"Volume", text:"Use scaled instruments to measure and compare capacities (internal volumes)" }
    ],
    "MA2-NSM-01": [
      { id:"kilogram", part:"A", group:"Mass", text:"Compare objects using the kilogram" },
      { id:"scaled-mass", part:"B", group:"Mass", text:"Use scaled instruments to measure and compare masses" }
    ],
    "MA2-NSM-02": [
      { id:"analog-time", part:"A", group:"Time", text:"Represent and read analog time" },
      { id:"digital-time", part:"B", group:"Time", text:"Represent and interpret digital time displays" },
      { id:"am-pm", part:"B", group:"Time", text:"Use am and pm notation" }
    ],
    "MA2-DATA-01": [
      { id:"collect", part:"A", text:"Collect discrete data" },
      { id:"tables-graphs", part:"A", text:"Organise and display data using tables and graphs" },
      { id:"collection-methods", part:"B", text:"Select and trial methods for data collection" },
      { id:"many-to-one", part:"B", text:"Construct and interpret data displays with many-to-one scales" }
    ],
    "MA2-DATA-02": [
      { id:"interpret-compare", part:"A", text:"Interpret and compare data" },
      { id:"many-to-one", part:"B", text:"Construct and interpret data displays with many-to-one scales" }
    ],
    "MA2-CHAN-01": [
      { id:"possible-outcomes", part:"A", text:"Identify possible outcomes from chance experiments" },
      { id:"likelihood", part:"B", text:"Describe the likelihood of outcomes of chance events" },
      { id:"previous-events", part:"B", text:"Identify when events are affected by previous events" }
    ],

    /* ======================= STAGE 3 ======================= */

    /* Represents numbers A & B */
    "MA3-RN-01": [
      { id:"millions",          part:"A", group:"Whole numbers", text:"Recognise, represent and order numbers in the millions" },
      { id:"partition-billion", part:"A", group:"Whole numbers", text:"Apply place value to partition, regroup and rename numbers to 1 billion" },
      { id:"integers",          part:"B", group:"Whole numbers", text:"Locate and represent integers on a number line" }
    ],
    "MA3-RN-02": [
      { id:"beyond-hundredths", part:"A", group:"Decimals and percentages", text:"Recognise that the place value system can be extended beyond hundredths" },
      { id:"compare-decimals",  part:"A", group:"Decimals and percentages", text:"Compare, order and represent decimals" }
    ],
    "MA3-RN-03": [
      { id:"benchmark",         part:"B", group:"Decimals and percentages", text:"Make connections between benchmark fractions, decimals and percentages" },
      { id:"discounts",         part:"B", group:"Decimals and percentages", text:"Determine percentage discounts of 10%, 25% and 50%" }
    ],

    /* Additive relations A & B */
    "MA3-AR-01": [
      { id:"mental-written",    part:"A", text:"Apply efficient mental and written strategies to solve addition and subtraction problems" },
      { id:"estimation",        part:"A", text:"Use estimation and place value understanding to determine the reasonableness of solutions" },
      { id:"choose-strategies", part:"B", text:"Choose and use efficient strategies to solve addition and subtraction problems" },
      { id:"decimals",          part:"B", text:"Applies known strategies to add and subtract decimals" }
    ],

    /* Multiplicative relations A & B */
    "MA3-MR-01": [
      { id:"products-factors",   part:"A", text:"Determine products and factors" },
      { id:"partition-multiply", part:"A", text:"Use partitioning and place value to multiply 2-, 3- and 4-digit numbers by one-digit numbers" },
      { id:"multiply-2-digit",   part:"A", text:"Select and apply mental and written strategies to multiply 2- and 3-digit numbers by 2-digit numbers" },
      { id:"remainders",         part:"A", text:"Represent and solve division problems with whole number remainders" },
      { id:"divide-1-digit",     part:"A", text:"Select and apply strategies to divide a number with 3 or more digits by a one-digit divisor" },
      { id:"estimate-check",     part:"A", text:"Use estimation and rounding to check the reasonableness of answers to calculations" },
      { id:"whole-numbers",      part:"B", text:"Select and apply strategies to solve problems involving multiplication and division with whole numbers" },
      { id:"powers-of-10",       part:"B", text:"Multiply and divide decimals by powers of 10" }
    ],
    "MA3-MR-02": [
      { id:"equivalent-sentences", part:"B", text:"Use equivalent number sentences involving multiplication and division to find unknown quantities" },
      { id:"patterns-multiples",   part:"B", text:"Represent and describe number patterns formed by multiples" },
      { id:"brackets-order",       part:"B", text:"Explore the use of brackets and the order of operations to write number sentences" }
    ],

    /* Representing quantity fractions A & B */
    "MA3-RQF-01": [
      { id:"one-whole",            part:"A", text:"Recognise the role of the number 1 as representing the whole" },
      { id:"unit-fractions",       part:"A", text:"Compare and order common unit fractions" },
      { id:"add-same-denominator", part:"A", text:"Solve problems involving addition and subtraction of fractions with the same denominator" },
      { id:"fraction-division",    part:"B", text:"Recognise that a fraction can represent a division" },
      { id:"related-denominators", part:"B", text:"Compare common fractions with related denominators" },
      { id:"equivalence-add",      part:"B", text:"Use equivalence to add and subtract fractional quantities" }
    ],
    "MA3-RQF-02": [
      { id:"build-whole",          part:"B", text:"Build up to the whole from a given fractional part" },
      { id:"fraction-of-quantity", part:"B", text:"Find fractional quantities of whole numbers (halves, quarters, fifths and tenths)" }
    ],

    /* Geometric measure A & B */
    "MA3-GM-01": [
      { id:"cartesian",      part:"A", group:"Position", text:"Explore the Cartesian coordinate system" },
      { id:"four-quadrants", part:"B", group:"Position", text:"Use the 4 quadrants of the coordinate plane" }
    ],
    "MA3-GM-02": [
      { id:"metres-km",       part:"A", group:"Length", text:"Use metres and kilometres for length and distances" },
      { id:"perimeters",      part:"A", group:"Length", text:"Measure lengths to find perimeters" },
      { id:"decimal-metric",  part:"B", group:"Length", text:"Connect decimal representations to the metric system" },
      { id:"convert-length",  part:"B", group:"Length", text:"Convert between common metric units of length" },
      { id:"compare-lengths", part:"B", group:"Length", text:"Solve problems involving the comparison of lengths using appropriate units" }
    ],
    "MA3-GM-03": [
      { id:"measure-angles",      part:"A", group:"Angles", text:"Estimate, measure and compare angles using degrees" },
      { id:"protractor",          part:"A", group:"Angles", text:"Use a protractor to measure and identify types of angles" },
      { id:"straight-line-point", part:"B", group:"Angles", text:"Investigate angles on a straight line and angles at a point" },
      { id:"intersecting-lines",  part:"B", group:"Angles", text:"Investigate the relationships formed by the intersection of straight lines" }
    ],

    /* Two-dimensional spatial structure A & B */
    "MA3-2DS-01": [
      { id:"classify-shapes",   part:"A", group:"2D shapes", text:"Classify two-dimensional shapes and describe their properties" },
      { id:"dissect-transform", part:"B", group:"2D shapes", text:"Dissect two-dimensional shapes and rearrange them using translations, reflections and rotations" }
    ],
    "MA3-2DS-02": [
      { id:"hectares",   part:"A", group:"Area", text:"Use hectares and square kilometres as units of measurement for area" },
      { id:"rectangles", part:"A", group:"Area", text:"Calculate the areas of rectangles using familiar metric units" }
    ],
    "MA3-2DS-03": [
      { id:"composite",     part:"B", group:"Area", text:"Find the area of composite figures" },
      { id:"parallelogram", part:"B", group:"Area", text:"Calculate the area of a parallelogram using subdivision and rearrangement" },
      { id:"triangle",      part:"B", group:"Area", text:"Determine the area of a triangle" }
    ],

    /* Three-dimensional spatial structure A & B */
    "MA3-3DS-01": [
      { id:"prisms-pyramids", part:"A", group:"3D objects", text:"Compare, describe and name prisms and pyramids" },
      { id:"3d-to-2d",        part:"A", group:"3D objects", text:"Connect three-dimensional objects with two-dimensional representations" },
      { id:"construct",       part:"B", group:"3D objects", text:"Construct prisms and pyramids" }
    ],
    "MA3-3DS-02": [
      { id:"capacity-units",           part:"A", group:"Volume", text:"Choose appropriate units of measurement for capacity" },
      { id:"displacement",             part:"A", group:"Volume", text:"Use displacement to investigate volumes of irregular solids" },
      { id:"decimal-metric",           part:"A", group:"Volume", text:"Connect decimal representations to the metric system" },
      { id:"cubic-metres",             part:"B", group:"Volume", text:"Use cubic metres for measurement of volume" },
      { id:"multiplicative-structure", part:"B", group:"Volume", text:"Recognise the multiplicative structure for finding volume" },
      { id:"rectangular-prisms",       part:"B", group:"Volume", text:"Find the volumes of rectangular prisms in cubic centimetres and cubic metres" }
    ],

    /* Non-spatial measure A & B */
    "MA3-NSM-01": [
      { id:"mass-units",     part:"A", group:"Mass", text:"Choose appropriate units of measurement for mass" },
      { id:"decimal-metric", part:"A", group:"Mass", text:"Connect decimal representations to the metric system" },
      { id:"convert-mass",   part:"B", group:"Mass", text:"Convert between common metric units of mass" }
    ],
    "MA3-NSM-02": [
      { id:"12-24-hour", part:"A", group:"Time", text:"Compare 12- and 24-hour time systems and convert between them" },
      { id:"duration",   part:"B", group:"Time", text:"Solve problems involving duration, using 12- and 24-hour time" }
    ],

    /* Data A & B */
    "MA3-DATA-01": [
      { id:"collect",       part:"A", text:"Collect categorical and discrete numerical data by observation or survey" },
      { id:"tables-graphs", part:"A", text:"Choose and use appropriate tables and graphs" }
    ],
    "MA3-DATA-02": [
      { id:"describe-interpret", part:"A", text:"Describe and interpret different datasets in context" },
      { id:"compare-displays",   part:"B", text:"Interpret and compare a range of data displays" },
      { id:"digital-media",      part:"B", text:"Interpret data presented in digital media and elsewhere" }
    ],

    /* Chance A & B */
    "MA3-CHAN-01": [
      { id:"list-outcomes",     part:"A", text:"List outcomes of chance experiments involving equally likely outcomes and represent probabilities" },
      { id:"observed-expected", part:"B", text:"Compare observed frequencies of outcomes with expected results" },
      { id:"random-generators", part:"B", text:"Create random generators and describe probabilities using fractions" },
      { id:"trials",            part:"B", text:"Conduct chance experiments with both small and large numbers of trials" }
    ],

    /* ======================= STAGE 4 ======================= */

    "MA4-INT-C-01": [
      { id:"compare-order",   text:"Compare and order integers" },
      { id:"add-subtract",    text:"Add and subtract positive and negative integers" },
      { id:"multiply-divide", text:"Multiply and divide positive and negative integers" },
      { id:"four-operations", text:"Apply the 4 operations to integers" }
    ],
    "MA4-FRC-C-01": [
      { id:"equivalence",           text:"Compare fractions using equivalence" },
      { id:"round-decimals",        text:"Round decimals to a specified degree of accuracy using approximations" },
      { id:"terminating-recurring", text:"Identify terminating and recurring decimals" },
      { id:"fdp-conversions",       text:"Identify and make use of the relationship between fractions, decimals and percentages to carry out simple conversions" },
      { id:"irrational",            text:"Examine the concept of irrational numbers" },
      { id:"order-fdp",             text:"Order and compare the value of fractions, decimals and percentages" },
      { id:"add-subtract",          text:"Solve problems that involve the addition and subtraction of fractions" },
      { id:"multiply-divide",       text:"Solve problems that involve the multiplication and division of fractions and decimals" },
      { id:"one-as-another",        text:"Represent one quantity as a fraction, decimal or percentage of another, with and without the use of digital tools" },
      { id:"percentages",           text:"Solve problems that involve the use of percentages" }
    ],
    "MA4-RAT-C-01": [
      { id:"simplify-ratios", text:"Recognise and simplify ratios" },
      { id:"ratio-problems",  text:"Solve problems involving ratios" },
      { id:"simplify-rates",  text:"Recognise and simplify rates" },
      { id:"rate-problems",   text:"Solve problems involving rates" },
      { id:"distance-time",   text:"Interpret and construct distance–time graphs from authentic data" }
    ],
    "MA4-ALG-C-01": [
      { id:"pronumerals",              text:"Examine the concept of pronumerals as a way of representing numbers" },
      { id:"expressions-substitution", text:"Create algebraic expressions and evaluate them by substitution" },
      { id:"laws-properties",          text:"Extend and apply the laws and properties of arithmetic to algebraic terms and expressions" },
      { id:"distributive",             text:"Extend and apply the distributive law to the expansion of algebraic expressions" },
      { id:"factorise",                text:"Factorise algebraic expressions by identifying numerical and algebraic factors" }
    ],
    "MA4-IND-C-01": [
      { id:"prime-factors", text:"Apply index notation to represent whole numbers as products of powers of prime numbers" },
      { id:"roots",         text:"Examine cube roots and square roots" },
      { id:"index-laws",    text:"Use index notation to establish the index laws with positive-integer indices and the zero index" }
    ],
    "MA4-EQU-C-01": [
      { id:"two-steps", text:"Solve linear equations up to 2 steps" },
      { id:"verify",    text:"Solve and verify linear equations by substitution" },
      { id:"quadratic", text:"Solve quadratic equations" }
    ],
    "MA4-LIN-C-01": [
      { id:"plot-points",         text:"Plot and identify points on the Cartesian plane" },
      { id:"plot-linear",         text:"Plot linear relationships on the Cartesian plane" },
      { id:"graphical-solutions", text:"Solve linear equations using graphical techniques" }
    ],
    "MA4-LEN-C-01": [
      { id:"perimeter", text:"Solve problems involving the perimeter of various quadrilaterals and simple composite figures" },
      { id:"circles",   text:"Describe the relationships between the features of circles" }
    ],
    "MA4-PYT-C-01": [
      { id:"define",   text:"Identify and define Pythagoras’ theorem" },
      { id:"problems", text:"Examine problems involving Pythagoras’ theorem" }
    ],
    "MA4-ARE-C-01": [
      { id:"rectangles-triangles-parallelograms", text:"Develop and use formulas to find the area of rectangles, triangles and parallelograms to solve problems" },
      { id:"circles-sectors",                     text:"Develop and use the formula to find the area of circles and sectors to solve problems" },
      { id:"trapeziums-rhombuses-kites",          text:"Develop and use the formulas to find the area of trapeziums, rhombuses and kites to solve problems" },
      { id:"units",                               text:"Choose appropriate units of measurement for area and convert between units" }
    ],
    "MA4-VOL-C-01": [
      { id:"views",    text:"Describe the different views of prisms and solids that have been formed from prism combinations" },
      { id:"prisms",   text:"Develop and apply the formula to find the volume of a prism to solve problems" },
      { id:"cylinder", text:"Develop the formula for finding the volume of a cylinder and apply the formula to solve problems" },
      { id:"units",    text:"Choose appropriate units of measurement for volume and capacity and convert between units" }
    ],
    "MA4-ANG-C-01": [
      { id:"language-notation", text:"Apply the language, notation and conventions of geometry" },
      { id:"angles-at-a-point", text:"Identify geometrical properties of angles at a point" },
      { id:"transversals",      text:"Identify and describe corresponding, alternate and co-interior angles when 2 straight lines are crossed by a transversal, including parallel lines" },
      { id:"reasoning",         text:"Solve numerical problems involving angles using reasoning" }
    ],
    "MA4-GEO-C-01": [
      { id:"classify-triangles",      text:"Classify triangles according to their side and angle properties" },
      { id:"classify-quadrilaterals", text:"Classify quadrilaterals and describe their properties" },
      { id:"apply-properties",        text:"Apply the properties of triangles and quadrilaterals" }
    ],
    "MA4-DAT-C-01": [
      { id:"classify",  text:"Classify data as either numerical (discrete or continuous) or categorical (nominal or ordinal) variables" },
      { id:"display",   text:"Display data using graphical representations relevant to the purpose of the data" },
      { id:"interpret", text:"Interpret data in graphical representations" }
    ],
    "MA4-DAT-C-02": [
      { id:"measures-of-centre", text:"Calculate and compare the mean, median, mode and range for simple datasets" },
      { id:"effect-of-points",   text:"Interpret the effect individual data points have on measures of centre and range" },
      { id:"analyse",            text:"Analyse datasets presented in various ways and draw conclusions" }
    ],
    "MA4-PRO-C-01": [
      { id:"chance-experiments", text:"Determine probabilities for chance experiments" },
      { id:"complementary",      text:"Determine probabilities for complementary events" }
    ],

    /* ======================= STAGE 5 ======================= */

    "MA5-FIN-C-01": [
      { id:"earning",         text:"Solve problems involving earning money" },
      { id:"simple-interest", text:"Solve problems involving simple interest" },
      { id:"spending",        text:"Solve problems involving spending money" }
    ],
    "MA5-FIN-C-02": [
      { id:"compound-depreciation", text:"Solve problems involving compound interest and depreciation" }
    ],
    "MA5-ALG-C-01": [
      { id:"fractions-numerical", text:"Apply the 4 operations to simplify algebraic fractions with numerical denominators" },
      { id:"distributive",        text:"Apply the distributive law to the expansion of algebraic expressions, and collect like terms where appropriate" }
    ],
    "MA5-ALG-P-01": [
      { id:"fractions-pronumerals", text:"Apply the 4 operations involving algebraic fractions with pronumerals in the denominator" },
      { id:"common-factor",         text:"Factorise algebraic expressions by taking out a common algebraic factor" },
      { id:"binomial-monic",        text:"Expand binomial products and factorise monic quadratic expressions" }
    ],
    "MA5-ALG-P-02": [
      { id:"binomial-numerators", text:"Operate with algebraic fractions involving binomial numerators and numerical denominators" },
      { id:"special-products",    text:"Expand, factorise and simplify algebraic expressions including special products" }
    ],
    "MA5-IND-C-01": [
      { id:"variables-zero",      text:"Extend and apply the index laws to variables, using positive-integer indices and the zero index" },
      { id:"products-quotients",  text:"Simplify algebraic products and quotients using index laws" },
      { id:"negative-numerical",  text:"Apply index laws to numerical expressions with negative-integer indices" }
    ],
    "MA5-IND-P-01": [
      { id:"negative-algebraic", text:"Apply index laws to algebraic expressions involving negative-integer indices" }
    ],
    "MA5-IND-P-02": [
      { id:"describe-surds",     text:"Describe surds" },
      { id:"surd-problems",      text:"Apply knowledge of surds to solve problems" },
      { id:"fractional-indices", text:"Describe and use fractional indices" }
    ],
    "MA5-EQU-C-01": [
      { id:"three-steps",   text:"Solve linear equations involving up to 3 steps" },
      { id:"one-fraction",  text:"Solve linear equations involving one algebraic fraction" },
      { id:"word-problems", text:"Solve linear equations arising from word problems and substitution into formulas" }
    ],
    "MA5-EQU-P-01": [
      { id:"monic-quadratic", text:"Solve monic quadratic equations" },
      { id:"cubic",           text:"Solve cubic equations" },
      { id:"inequalities",    text:"Solve linear inequalities and graph their solutions on a number line" }
    ],
    "MA5-EQU-P-02": [
      { id:"fractions-more-steps", text:"Solve linear equations involving algebraic fractions and equations of more than 3 steps" },
      { id:"literal",              text:"Rearrange literal equations" },
      { id:"quadratic-methods",    text:"Solve quadratic equations using a variety of methods" },
      { id:"simultaneous",         text:"Solve linear simultaneous equations, both algebraically and graphically" }
    ],
    "MA5-LIN-C-01": [
      { id:"midpoint-gradient", text:"Find the midpoint and gradient of a line segment (interval) on the Cartesian plane" },
      { id:"distance",          text:"Find the distance between 2 points located on the Cartesian plane" },
      { id:"graph-equations",   text:"Recognise and graph equations" },
      { id:"parallel-horizontal-vertical", text:"Examine parallel, horizontal and vertical lines" }
    ],
    "MA5-LIN-C-02": [
      { id:"gradient-intercept",     text:"Examine the gradient/slope-intercept form" },
      { id:"parallel-perpendicular", text:"Find the equations of parallel and perpendicular lines" }
    ],
    "MA5-LIN-P-01": [
      { id:"midpoint-gradient-formulas", text:"Apply formulas to find the midpoint and gradient/slope of an interval on the Cartesian plane" },
      { id:"distance-formula",           text:"Apply the distance formula to find the distance between 2 points located on the Cartesian plane" },
      { id:"forms-of-a-line",            text:"Use various forms of the equation of a straight line" },
      { id:"coordinate-problems",        text:"Solve problems by applying coordinate geometry formulas" },
      { id:"symmetry",                   text:"Identify line and rotational symmetries" },
      { id:"transformations",            text:"Describe translations, reflections in an axis, and rotations through multiples of 90 degrees on the Cartesian plane, using coordinates" }
    ],
    "MA5-NLI-C-01": [
      { id:"connections", text:"Examine the connection between algebraic and graphical representations of quadratics and exponentials" }
    ],
    "MA5-NLI-C-02": [
      { id:"quadratic",   text:"Graph and examine quadratic relationships" },
      { id:"exponential", text:"Graph and examine exponential relationships" },
      { id:"distinguish", text:"Distinguish between linear, quadratic and exponential relationships by examining their graphical representations" }
    ],
    "MA5-NLI-P-01": [
      { id:"parabolas",         text:"Graph parabolas and describe their features and transformations" },
      { id:"exponentials",      text:"Graph exponentials and describe their features and transformations" },
      { id:"hyperbolas",        text:"Graph hyperbolas and describe their features and transformations" },
      { id:"circles",           text:"Graph circles and describe their features and transformations" },
      { id:"distinguish",       text:"Distinguish between different types of graphs by examining their algebraic and graphical representations and solve problems" },
      { id:"polynomial-curves", text:"Graph and compare polynomial curves and describe their features and transformations" }
    ],
    "MA5-RAT-P-01": [
      { id:"variation-problems", text:"Identify and describe problems involving direct and inverse variation" },
      { id:"variation-graphs",   text:"Identify and describe graphs involving direct and inverse variation" },
      { id:"solve-variation",    text:"Solve problems involving direct and inverse variation and examine the relationship between graphs and equations corresponding to proportionality" }
    ],
    "MA5-RAT-P-02": [
      { id:"constant-rate",   text:"Analyse graphs that are decreasing or increasing at a constant rate" },
      { id:"variable-rates",  text:"Analyse the relationship between graphs and variable rates of change" },
      { id:"construct-graphs", text:"Construct graphical representations of rates of change" }
    ],
    "MA5-POL-P-01": [
      { id:"define-operate",   text:"Define and operate with polynomials" },
      { id:"divide",           text:"Divide polynomials" },
      { id:"factor-remainder", text:"Apply the factor and remainder theorems to solve problems" },
      { id:"graph",            text:"Graph polynomials" }
    ],
    "MA5-LOG-P-01": [
      { id:"examine", text:"Examine logarithms both numerically and graphically" },
      { id:"laws",    text:"Establish and apply the laws of logarithms to solve problems" }
    ],
    "MA5-FNC-P-01": [
      { id:"relations-functions", text:"Define relations and functions, and use function notation" },
      { id:"domain-range",        text:"Find the domain and range of a function and graph functions" },
      { id:"inequality-regions",  text:"Graph regions corresponding to linear inequalities in one and 2 variables" }
    ],
    "MA5-MAG-C-01": [
      { id:"small-large",         text:"Identify and describe very small and very large measurements" },
      { id:"error",               text:"Find absolute and percentage error" },
      { id:"rounding",            text:"Estimate and round numbers to a specified degree of accuracy" },
      { id:"scientific-notation", text:"Express numbers in scientific notation" }
    ],
    "MA5-TRG-C-01": [
      { id:"constancy",      text:"Demonstrate and explain the constancy of trigonometric ratios for a given angle in right-angled triangles" },
      { id:"right-triangles", text:"Apply trigonometry to solve right-angled triangle problems" }
    ],
    "MA5-TRG-C-02": [
      { id:"elevation-depression", text:"Solve right-angled triangle problems involving angles of elevation and depression" },
      { id:"bearings",             text:"Solve right-angled triangle problems involving bearings" }
    ],
    "MA5-TRG-P-01": [
      { id:"three-dimensional", text:"Solve 3-dimensional problems involving right-angled triangles" },
      { id:"sine-cosine-area",  text:"Apply the sine, cosine and area rules to any triangle and solve related problems" }
    ],
    "MA5-TRG-P-02": [
      { id:"unit-circle",    text:"Use the unit circle to define trigonometric functions and represent them graphically" },
      { id:"trig-equations", text:"Solve trigonometric equations using exact values and the relationships between supplementary and complementary angles" }
    ],
    "MA5-ARE-C-01": [
      { id:"areas-surface-areas", text:"Solve problems involving areas and surface areas" },
      { id:"cylinder-formula",    text:"Develop and apply the formula for surface areas of cylinders" },
      { id:"cylinder-composite",  text:"Solve problems involving surface areas of cylinders and related composite solids" }
    ],
    "MA5-ARE-P-01": [
      { id:"surface-areas", text:"Solve problems involving surface areas" }
    ],
    "MA5-VOL-C-01": [
      { id:"composite-solids", text:"Solve problems involving composite solids consisting of right prisms and cylinders" }
    ],
    "MA5-VOL-P-01": [
      { id:"volumes", text:"Solve problems involving volumes" }
    ],
    "MA5-GEO-C-01": [
      { id:"similar-properties", text:"Identify and describe the properties of similar figures" },
      { id:"scale-factors",      text:"Solve problems using ratio and scale factors in similar figures" }
    ],
    "MA5-GEO-P-01": [
      { id:"congruence",             text:"Identify and explain congruence" },
      { id:"congruent-triangles",    text:"Develop and use the conditions for congruent triangles" },
      { id:"similar-triangles",      text:"Develop and apply the minimum conditions for triangles to be similar" },
      { id:"similar-shapes-solids",  text:"Establish and apply properties of similar shapes and solids" },
      { id:"numerical-reasoning",    text:"Apply logical reasoning to numerical problems involving plane shapes" }
    ],
    "MA5-GEO-P-02": [
      { id:"proofs", text:"Apply logical reasoning to proofs involving plane shapes" }
    ],
    "MA5-CIR-P-01": [
      { id:"angle-chord",    text:"Prove and apply angle and chord properties of circles" },
      { id:"tangent-secant", text:"Prove and apply tangent and secant properties of circles" }
    ],
    "MA5-NET-P-01": [
      { id:"graphs-networks", text:"Examine and describe a graph/network" },
      { id:"planar-euler",    text:"Define a planar graph and apply Euler’s formula for planar graphs" },
      { id:"eulerian",        text:"Explain the concept of Eulerian trails and circuits in the context of the Königsberg bridges problem" }
    ],
    "MA5-DAT-C-01": [
      { id:"standard-deviation", text:"Examine standard deviation as a measure of spread" },
      { id:"quartiles-iqr",      text:"Determine quartiles and interquartile range" },
      { id:"box-plots",          text:"Represent datasets using box plots and use them to compare datasets" }
    ],
    "MA5-DAT-C-02": [
      { id:"describe-bivariate",  text:"Identify and describe numerical datasets involving 2 variables" },
      { id:"scatter-plots",       text:"Represent datasets involving 2 numerical variables, using a scatter plot and a line of best fit, by eye" },
      { id:"interpret-bivariate", text:"Interpret data involving 2 numerical variables, using graphical representations" }
    ],
    "MA5-DAT-P-01": [
      { id:"plan-inquiry",  text:"Plan and conduct a statistical inquiry into a question of interest" },
      { id:"media-reports", text:"Examine reports of studies in digital media and elsewhere for information on their planning and implementation" }
    ],
    "MA5-PRO-C-01": [
      { id:"multistage",          text:"Describe multistage chance experiments involving independent and dependent events" },
      { id:"multistage-problems", text:"Solve problems for multistage chance experiments" },
      { id:"simulations",         text:"Design and use simulations to model and examine situations involving probability" }
    ],
    "MA5-PRO-P-01": [
      { id:"venn-two-way",         text:"Solve problems involving Venn diagrams and 2-way tables" },
      { id:"conditional-language", text:"Use the language, 'if … then', 'given', 'of' and 'knowing that', to examine conditional statements and identify common mistakes in interpreting the language" },
      { id:"mutually-exclusive",   text:"Describe mutually and non-mutually exclusive events using specific language and calculate related probabilities" }
    ]
  }
};
