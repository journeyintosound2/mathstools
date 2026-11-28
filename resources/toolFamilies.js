/* ============================================================================
   Mills Maths Tools — Resources by Stage : TOOL FAMILIES + WHOLE-TOPIC QUIZZES
   ----------------------------------------------------------------------------
   Read only by resources/index.html (the teacher task picker does not need it).

   MMT_TOOL_FAMILIES
     "<interactive tool url>": [ "<worksheet url>", "<quiz url>", ... ]
     On Resources by Stage an interactive is ONE row; its worksheet creator,
     student quiz (and its own lesson plan / flash cards) sit in a small
     dropdown on the right of that row. Members filed under the same content
     statement as the tool are folded into it; a member filed somewhere the
     tool is not still shows as its own row there. Order here = order in the
     dropdown. Every URL must also be a row in toolLinks.js (that is where the
     title and kind come from). A new tool with siblings needs a line here.

   MMT_WHOLE_TOPIC_QUIZZES
     "<quiz url>": "<topic name>"
     These sit OUTSIDE the content statements, in a yellow band at the foot of
     their outcome, titled "Whole Topic Quiz – <topic name>". A toolLinks row
     tagged "whole topic" is treated the same way (its title is the name).

   MMT_WHOLE_TOPIC_WORKSHEETS
     "<worksheet creator url>": "<topic name>"
     The same for the whole-topic worksheet creators (one per outcome, Basic
     and Expected — Part A / Parts A and B in Stage 3 — every content statement): a light-blue band at the foot of
     the outcome, titled "Whole Topic Worksheet – <topic name>", above the
     quiz band. They are never filed under a content statement, so each shows
     once. A new one needs a line here.
   ========================================================================== */

window.MMT_TOOL_FAMILIES = {
  /* ---- Stage 3 ---- */
  "/interactive-tools/stage-3/number/timestable-chart/": [
    "/worksheet-creators/stage-3/number/times-table-chart-printable.html"
  ],
  "/interactive-tools/stage-3/number/addition-compensation/": [
    "/online-quizzes/stage-3/number/addition-compensation.html"
  ],
  "/interactive-tools/stage-3/number/constant-difference/": [
    "/online-quizzes/stage-3/number/constant-difference.html"
  ],
  "/interactive-tools/stage-3/number/division-grouping-bubbles/": [
    "/worksheet-creators/stage-3/number/division-grouping.html",
    "/online-quizzes/stage-3/number/division-grouping.html"
  ],
  "/interactive-tools/stage-3/number/fraction-of-amount-division/": [
    "/worksheet-creators/stage-3/number/fraction-of-amount-division.html",
    "/online-quizzes/stage-3/number/fraction-of-amount-division.html"
  ],
  "/interactive-tools/stage-3/number/multiply-divide-by-ten/": [
    "/worksheet-creators/stage-3/number/multiply-divide-by-ten.html",
    "/online-quizzes/stage-3/number/multiply-divide-by-ten.html",
    "/interactive-tools/stage-3/number/multiply-divide-by-ten/flash-cards.html",
    "/interactive-tools/stage-3/number/multiply-divide-by-ten/student-flash.html"
  ],
  "/interactive-tools/stage-3/number/partition-splitter/": [
    "/interactive-tools/stage-3/number/partition-splitter/partition-flash.html",
    "/interactive-tools/stage-3/number/partition-splitter/student-flash.html"
  ],
  "/interactive-tools/stage-3/number/ratio-table-division/": [
    "/worksheet-creators/stage-3/number/ratio-table-division.html"
  ],

  /* ---- Stage 4 · Number ---- */
  "/interactive-tools/stage-4/number/adding-fractions/": [
    "/worksheet-creators/stage-4/number/adding-subtracting-fractions.html",
    "/online-quizzes/stage-4/number/adding-subtracting-fractions.html"
  ],
  "/interactive-tools/stage-4/number/factor-circles/": [
    "/worksheet-creators/stage-4/number/factor-circles.html",
    "/online-quizzes/stage-4/number/factor-circles.html",
    "/interactive-tools/stage-4/number/factor-circles/lesson-plan.html"
  ],
  "/interactive-tools/stage-4/number/fraction-bar-number-line/": [
    "/online-quizzes/stage-4/number/fraction-thinking-quest.html",
    "/online-quizzes/stage-4/number/fraction-thinking-explorer.html"
  ],
  "/interactive-tools/stage-4/number/fraction-grid-number-line/": [
    "/worksheet-creators/stage-4/number/fraction-grid-number-line.html"
  ],
  "/interactive-tools/stage-4/number/fraction-to-percentage/": [
    "/worksheet-creators/stage-4/number/fraction-to-percentage.html",
    "/online-quizzes/stage-4/number/fraction-to-percentage.html"
  ],
  "/interactive-tools/stage-4/number/integer-addition/": [
    "/worksheet-creators/stage-4/number/integer-addition.html",
    "/online-quizzes/stage-4/number/integer-addition.html"
  ],
  "/interactive-tools/stage-4/number/integer-combined-signs/": [
    "/online-quizzes/stage-4/number/integer-combined-signs.html",
    "/interactive-tools/stage-4/number/integer-combined-signs/lesson-plan.html"
  ],
  "/interactive-tools/stage-4/number/multiplying-fractions-area-model/": [
    "/worksheet-creators/stage-4/number/multiplying-fractions.html"
  ],
  "/interactive-tools/stage-4/number/negatives-on-the-number-line/": [
    "/worksheet-creators/stage-4/number/negatives-on-the-number-line.html",
    "/online-quizzes/stage-4/number/negatives-on-the-number-line.html"
  ],
  "/interactive-tools/stage-4/number/order-of-operations-in-words/": [
    "/worksheet-creators/stage-4/number/order-of-operations-in-words.html"
  ],
  "/interactive-tools/stage-4/number/rounding-decimals/": [
    "/online-quizzes/stage-4/number/decimal-zoom.html"
  ],

  /* ---- Stage 4 · Algebra ---- */
  "/interactive-tools/stage-4/algebra/collecting-like-terms/": [
    "/worksheet-creators/stage-4/algebra/collecting-like-terms.html",
    "/online-quizzes/stage-4/algebra/collecting-like-terms.html",
    "/interactive-tools/stage-4/algebra/collecting-like-terms/lesson-plan.html"
  ],
  "/interactive-tools/stage-4/algebra/counting-strategies-linear/": [
    "/worksheet-creators/stage-4/algebra/counting-strategies-linear.html",
    "/online-quizzes/stage-4/algebra/counting-strategies-first-quadrant.html",
    "/online-quizzes/stage-4/algebra/counting-strategies-all-quadrants.html"
  ],
  "/interactive-tools/stage-4/algebra/multi-step-double-numberline/": [
    "/worksheet-creators/stage-4/algebra/multi-step-double-numberline.html",
    "/online-quizzes/stage-4/algebra/multi-step-equations/two-step.html",
    "/online-quizzes/stage-4/algebra/multi-step-equations/two-step-grouping.html",
    "/online-quizzes/stage-4/algebra/multi-step-equations/pronumerals-both-sides.html",
    "/online-quizzes/stage-4/algebra/multi-step-equations/fractions-harder.html",
    "/online-quizzes/stage-4/algebra/multi-step-equations/mixed.html"
  ],
  "/interactive-tools/stage-4/algebra/double-numberline/": [
    "/worksheet-creators/stage-4/algebra/double-numberline.html",
    "/online-quizzes/stage-4/algebra/double-numberline/student-quiz.html",
    "/online-quizzes/stage-4/algebra/double-numberline/student-quiz-add-subtract.html",
    "/online-quizzes/stage-4/algebra/double-numberline/student-quiz-mult-div.html",
    "/interactive-tools/stage-4/algebra/double-numberline/lesson-plan.html"
  ],
  "/interactive-tools/stage-4/algebra/number-groups/": [
    "/worksheet-creators/stage-4/algebra/number-groups.html",
    "/online-quizzes/stage-4/algebra/number-groups.html",
    "/interactive-tools/stage-4/algebra/number-groups/lesson-plan.html"
  ],
  "/interactive-tools/stage-4/algebra/substitution/": [
    "/worksheet-creators/stage-4/algebra/substitution.html",
    "/online-quizzes/stage-4/algebra/substitution.html",
    "/interactive-tools/stage-4/algebra/substitution/lesson-plan.html"
  ],
  "/interactive-tools/stage-4/algebra/visual-patterns/": [
    "/worksheet-creators/stage-4/algebra/visual-patterns.html"
  ],

  /* ---- Stage 4 · Measurement and space ---- */
  "/interactive-tools/stage-4/measurement-space/area-of-a-parallelogram/": [
    "/worksheet-creators/stage-4/measurement-space/area-of-a-parallelogram.html",
    "/online-quizzes/stage-4/measurement-space/area-of-a-parallelogram.html"
  ],
  "/interactive-tools/stage-4/measurement-space/area-of-a-trapezium/": [
    "/worksheet-creators/stage-4/measurement-space/area-of-a-trapezium.html",
    "/online-quizzes/stage-4/measurement-space/area-of-a-trapezium.html"
  ],
  "/interactive-tools/stage-4/measurement-space/area-of-a-circle/": [
    "/worksheet-creators/stage-4/measurement-space/area-of-a-circle.html"
  ],
  "/interactive-tools/stage-4/measurement-space/area-of-a-triangle/": [
    "/worksheet-creators/stage-4/measurement-space/area-of-a-triangle.html",
    "/online-quizzes/stage-4/measurement-space/area-of-a-triangle.html"
  ],
  "/interactive-tools/stage-4/measurement-space/perimeter-area-rectangle/": [
    "/worksheet-creators/stage-4/measurement-space/perimeter-area-rectangle.html",
    "/online-quizzes/stage-4/measurement-space/area-model.html",
    "/online-quizzes/stage-4/measurement-space/perimeter-area-rectangle.html",
    "/interactive-tools/stage-4/measurement-space/perimeter-area-rectangle/lesson-plan.html"
  ],
  "/interactive-tools/stage-4/measurement-space/perimeter-plane-shapes/": [
    "/worksheet-creators/stage-4/measurement-space/perimeter-plane-shapes.html",
    "/online-quizzes/stage-4/measurement-space/perimeter-plane-shapes.html"
  ],
  "/interactive-tools/stage-4/measurement-space/reading-a-protractor/": [
    "/online-quizzes/stage-4/measurement-space/reading-a-protractor.html"
  ],
  "/interactive-tools/stage-4/measurement-space/unit-conversion-number-line/": [
    "/worksheet-creators/stage-4/measurement-space/unit-conversion.html"
  ],

  /* ---- Stage 4 · Ratios and rates ---- */
  "/interactive-tools/stage-4/ratios-rates/stacked-bar-ratio/": [
    "/worksheet-creators/stage-4/ratios-rates/stacked-bar-ratio.html",
    "/online-quizzes/stage-4/ratios-rates/stacked-bar-ratio.html"
  ],

  /* ---- Stage 5 ---- */
  "/interactive-tools/stage-5/algebra/complete-the-square/": [
    "/worksheet-creators/stage-5/algebra/complete-the-square.html"
  ],
  "/interactive-tools/stage-5/measurement-space/unit-circle-trig-ratios/": [
    "/interactive-tools/stage-5/measurement-space/unit-circle-trig-ratios/lesson-plan.html",
    "/flip-cards/unit-circle-related-angles.html",
    "/worksheet-creators/stage-5/measurement-space/unit-circle-trig.html"
  ],
  "/interactive-tools/stage-4/statistics-probability/bin-toss/": [
    "/interactive-tools/stage-4/statistics-probability/bin-toss/student-interactive/"
  ]
};

window.MMT_WHOLE_TOPIC_QUIZZES = {
  /* ---- Stage 1 and Stage 2 (levels are the syllabus parts; read aloud) ---- */
  "/online-quizzes/stage-1/number/reading-ordering-numbers.html": "Reading and Ordering Numbers",
  "/online-quizzes/stage-1/number/partitioning-numbers.html": "Partitioning Numbers",
  "/online-quizzes/stage-1/number/adding-taking-away.html": "Adding and Taking Away",
  "/online-quizzes/stage-1/number/equal-groups.html": "Equal Groups",
  "/online-quizzes/stage-1/measurement-space/position.html": "Position",
  "/online-quizzes/stage-1/measurement-space/length.html": "Length",
  "/online-quizzes/stage-1/measurement-space/halves-quarters-eighths.html": "Halves, Quarters and Eighths",
  "/online-quizzes/stage-1/measurement-space/2d-shapes.html": "2D Shapes",
  "/online-quizzes/stage-1/measurement-space/area.html": "Area",
  "/online-quizzes/stage-1/measurement-space/3d-objects.html": "3D Objects",
  "/online-quizzes/stage-1/measurement-space/volume-capacity.html": "Capacity and Volume",
  "/online-quizzes/stage-1/measurement-space/mass.html": "Mass",
  "/online-quizzes/stage-1/measurement-space/time.html": "Time",
  "/online-quizzes/stage-1/statistics-probability/data-collecting.html": "Collecting Data",
  "/online-quizzes/stage-1/statistics-probability/data-interpreting.html": "Reading Graphs and Tables",
  "/online-quizzes/stage-1/statistics-probability/chance.html": "Chance",
  "/online-quizzes/stage-2/number/whole-numbers.html": "Whole Numbers",
  "/online-quizzes/stage-2/number/decimals.html": "Decimals",
  "/online-quizzes/stage-2/number/addition-subtraction.html": "Addition and Subtraction",
  "/online-quizzes/stage-2/number/additive-number-sentences.html": "Missing Numbers: Adding and Subtracting",
  "/online-quizzes/stage-2/number/multiplication-division.html": "Multiplication and Division",
  "/online-quizzes/stage-2/number/multiplicative-number-sentences.html": "Missing Numbers: Multiplying and Dividing",
  "/online-quizzes/stage-2/number/fractions.html": "Fractions",
  "/online-quizzes/stage-2/measurement-space/position.html": "Maps and Directions",
  "/online-quizzes/stage-2/measurement-space/length.html": "Length",
  "/online-quizzes/stage-2/measurement-space/angles.html": "Angles",
  "/online-quizzes/stage-2/measurement-space/2d-shapes.html": "2D Shapes",
  "/online-quizzes/stage-2/measurement-space/transformations.html": "Moving and Joining Shapes",
  "/online-quizzes/stage-2/measurement-space/area.html": "Area",
  "/online-quizzes/stage-2/measurement-space/3d-objects.html": "3D Objects",
  "/online-quizzes/stage-2/measurement-space/volume-capacity.html": "Capacity and Volume",
  "/online-quizzes/stage-2/measurement-space/mass.html": "Mass",
  "/online-quizzes/stage-2/measurement-space/time.html": "Time",
  "/online-quizzes/stage-2/statistics-probability/data-collecting-graphing.html": "Collecting and Graphing Data",
  "/online-quizzes/stage-2/statistics-probability/data-interpreting.html": "Reading Tables and Graphs",
  "/online-quizzes/stage-2/statistics-probability/chance.html": "Chance",
  /* ---- Stage 3 (levels are the syllabus parts: Part A / Parts A and B, or Part B) ---- */
  "/online-quizzes/stage-3/number/whole-numbers-integers.html": "Represents Numbers: Whole Numbers and Integers",
  "/online-quizzes/stage-3/number/decimals.html": "Represents Numbers: Decimals",
  "/online-quizzes/stage-3/number/percentages.html": "Represents Numbers: Percentages",
  "/online-quizzes/stage-3/number/additive-relations.html": "Additive Relations",
  "/online-quizzes/stage-3/number/multiplying-dividing.html": "Multiplicative Relations: Multiplying and Dividing",
  "/online-quizzes/stage-3/number/number-sentences-patterns.html": "Multiplicative Relations: Number Sentences and Patterns",
  "/online-quizzes/stage-3/number/fractions.html": "Fractions: Comparing, Adding and Subtracting",
  "/online-quizzes/stage-3/number/fractions-of-quantities.html": "Fractions: Fractions of Quantities",
  "/online-quizzes/stage-3/measurement-space/position.html": "Geometric Measure: Position",
  "/online-quizzes/stage-3/measurement-space/length.html": "Geometric Measure: Length",
  "/online-quizzes/stage-3/measurement-space/angles.html": "Geometric Measure: Angles",
  "/online-quizzes/stage-3/measurement-space/2d-shapes.html": "2D Spatial Structure: Shapes and Transformations",
  "/online-quizzes/stage-3/measurement-space/area-rectangles.html": "2D Spatial Structure: Area of Rectangles",
  "/online-quizzes/stage-3/measurement-space/area-triangles-composite.html": "2D Spatial Structure: Area of Composite Figures, Parallelograms and Triangles",
  "/online-quizzes/stage-3/measurement-space/3d-objects.html": "3D Spatial Structure: 3D Objects",
  "/online-quizzes/stage-3/measurement-space/volume-capacity.html": "3D Spatial Structure: Volume and Capacity",
  "/online-quizzes/stage-3/measurement-space/mass.html": "Non-Spatial Measure: Mass",
  "/online-quizzes/stage-3/measurement-space/time.html": "Non-Spatial Measure: Time",
  "/online-quizzes/stage-3/statistics-probability/data-collecting-displaying.html": "Data: Collecting and Displaying Data",
  "/online-quizzes/stage-3/statistics-probability/data-interpreting.html": "Data: Interpreting Data",
  "/online-quizzes/stage-3/statistics-probability/chance.html": "Chance",
  /* ---- Stage 4 ---- */
  "/online-quizzes/stage-4/number/computation-with-integers.html":                         "Computation with Integers",
  "/online-quizzes/stage-4/number/fractions-decimals-percentages.html":                    "Fractions, Decimals and Percentages",
  "/online-quizzes/stage-4/number/indices.html":                                           "Indices",
  "/online-quizzes/stage-4/ratios-rates/ratios-and-rates.html":                            "Ratios and Rates",
  "/online-quizzes/stage-4/algebra/algebraic-techniques.html":                             "Algebraic Techniques",
  "/online-quizzes/stage-4/algebra/equations.html":                                        "Equations",
  "/online-quizzes/stage-4/algebra/linear-relationships.html":                             "Linear Relationships",
  "/online-quizzes/stage-4/measurement-space/length.html":                                 "Length",
  "/online-quizzes/stage-4/measurement-space/pythagoras.html":                             "Right-Angled Triangles (Pythagoras)",
  "/online-quizzes/stage-4/measurement-space/area.html":                                   "Area",
  "/online-quizzes/stage-4/measurement-space/volume.html":                                 "Volume",
  "/online-quizzes/stage-4/measurement-space/angle-relationships.html":                    "Angle Relationships",
  "/online-quizzes/stage-4/measurement-space/properties-of-geometrical-figures.html":      "Properties of Geometrical Figures",
  "/online-quizzes/stage-4/statistics-probability/data-classification-visualisation.html": "Data Classification and Visualisation",
  "/online-quizzes/stage-4/statistics-probability/data-analysis.html":                     "Data Analysis",
  "/online-quizzes/stage-4/statistics-probability/probability.html":                       "Probability",
  /* ---- Stage 5 (Core and Path outcomes; levels Basic / Expected) ---- */
  "/online-quizzes/stage-5/number/financial-mathematics-a.html": "Financial Mathematics A: Earning, Spending and Simple Interest",
  "/online-quizzes/stage-5/number/financial-mathematics-b.html": "Financial Mathematics B: Compound Interest and Depreciation",
  "/online-quizzes/stage-5/algebra/algebraic-techniques-a.html": "Algebraic Techniques A: Algebraic Fractions and Expanding",
  "/online-quizzes/stage-5/algebra/algebraic-techniques-b.html": "Algebraic Techniques B: Factorising and Binomial Products",
  "/online-quizzes/stage-5/algebra/algebraic-techniques-c.html": "Algebraic Techniques C: Special Products and Factorising",
  "/online-quizzes/stage-5/number/indices-a.html": "Indices A: Index Laws, Zero and Negative Indices",
  "/online-quizzes/stage-5/number/indices-b.html": "Indices B: Negative Indices in Algebra",
  "/online-quizzes/stage-5/number/indices-c.html": "Indices C: Surds and Fractional Indices",
  "/online-quizzes/stage-5/algebra/equations-a.html": "Equations A: Linear Equations",
  "/online-quizzes/stage-5/algebra/equations-b.html": "Equations B: Quadratics, Cubics and Inequalities",
  "/online-quizzes/stage-5/algebra/equations-c.html": "Equations C: Literal, Quadratic and Simultaneous Equations",
  "/online-quizzes/stage-5/algebra/linear-relationships-a.html": "Linear Relationships A: Midpoint, Gradient and Distance",
  "/online-quizzes/stage-5/algebra/linear-relationships-b.html": "Linear Relationships B: Gradient–Intercept Form",
  "/online-quizzes/stage-5/algebra/linear-relationships-c.html": "Linear Relationships C: Coordinate Geometry and Transformations",
  "/online-quizzes/stage-5/algebra/non-linear-relationships-a.html": "Non-Linear Relationships A: Tables and Graphs",
  "/online-quizzes/stage-5/algebra/non-linear-relationships-b.html": "Non-Linear Relationships B: Parabolas and Exponential Curves",
  "/online-quizzes/stage-5/algebra/non-linear-relationships-c.html": "Non-Linear Relationships C: Parabolas, Hyperbolas, Circles and More",
  "/online-quizzes/stage-5/ratios-rates/variation-and-rates-a.html": "Variation and Rates of Change A: Direct and Inverse Variation",
  "/online-quizzes/stage-5/ratios-rates/variation-and-rates-b.html": "Variation and Rates of Change B: Rates of Change",
  "/online-quizzes/stage-5/algebra/polynomials.html": "Polynomials",
  "/online-quizzes/stage-5/algebra/logarithms.html": "Logarithms",
  "/online-quizzes/stage-5/algebra/functions-and-other-graphs.html": "Functions and Other Graphs",
  "/online-quizzes/stage-5/number/numbers-of-any-magnitude.html": "Numbers of Any Magnitude",
  "/online-quizzes/stage-5/measurement-space/trigonometry-a.html": "Trigonometry A: Right-Angled Triangles",
  "/online-quizzes/stage-5/measurement-space/trigonometry-b.html": "Trigonometry B: Elevation, Depression and Bearings",
  "/online-quizzes/stage-5/measurement-space/trigonometry-c.html": "Trigonometry C: Non-Right-Angled Triangles and 3D Problems",
  "/online-quizzes/stage-5/measurement-space/trigonometry-d.html": "Trigonometry D: The Unit Circle and Trigonometric Equations",
  "/online-quizzes/stage-5/measurement-space/area-and-surface-area-a.html": "Area and Surface Area A: Composite Areas, Prisms and Cylinders",
  "/online-quizzes/stage-5/measurement-space/area-and-surface-area-b.html": "Area and Surface Area B: Pyramids, Cones and Spheres",
  "/online-quizzes/stage-5/measurement-space/volume-a.html": "Volume A: Prisms, Cylinders and Composite Solids",
  "/online-quizzes/stage-5/measurement-space/volume-b.html": "Volume B: Pyramids, Cones and Spheres",
  "/online-quizzes/stage-5/measurement-space/geometrical-figures-a.html": "Properties of Geometrical Figures A: Similar Figures and Scale",
  "/online-quizzes/stage-5/measurement-space/geometrical-figures-b.html": "Properties of Geometrical Figures B: Congruence, Similarity and Reasoning",
  "/online-quizzes/stage-5/measurement-space/geometrical-figures-c.html": "Properties of Geometrical Figures C: Geometric Proofs",
  "/online-quizzes/stage-5/measurement-space/circle-geometry.html": "Circle Geometry",
  "/online-quizzes/stage-5/measurement-space/introduction-to-networks.html": "Introduction to Networks",
  "/online-quizzes/stage-5/statistics-probability/data-analysis-a.html": "Data Analysis A: Quartiles, Box Plots and Standard Deviation",
  "/online-quizzes/stage-5/statistics-probability/data-analysis-b.html": "Data Analysis B: Bivariate Data",
  "/online-quizzes/stage-5/statistics-probability/data-analysis-c.html": "Data Analysis C: Statistical Inquiries and Media Reports",
  "/online-quizzes/stage-5/statistics-probability/probability-a.html": "Probability A: Multistage Chance Experiments",
  "/online-quizzes/stage-5/statistics-probability/probability-b.html": "Probability B: Venn Diagrams, Two-Way Tables and Conditional Probability",
};

window.MMT_WHOLE_TOPIC_WORKSHEETS = {
  /* ---- Stage 1 and Stage 2 (levels are the syllabus parts; large print) ---- */
  "/worksheet-creators/stage-1/number/reading-ordering-numbers/": "Reading and Ordering Numbers",
  "/worksheet-creators/stage-1/number/partitioning-numbers/": "Partitioning Numbers",
  "/worksheet-creators/stage-1/number/adding-taking-away/": "Adding and Taking Away",
  "/worksheet-creators/stage-1/number/equal-groups/": "Equal Groups",
  "/worksheet-creators/stage-1/measurement-space/position/": "Position",
  "/worksheet-creators/stage-1/measurement-space/length/": "Length",
  "/worksheet-creators/stage-1/measurement-space/halves-quarters-eighths/": "Halves, Quarters and Eighths",
  "/worksheet-creators/stage-1/measurement-space/2d-shapes/": "2D Shapes",
  "/worksheet-creators/stage-1/measurement-space/area/": "Area",
  "/worksheet-creators/stage-1/measurement-space/3d-objects/": "3D Objects",
  "/worksheet-creators/stage-1/measurement-space/volume-capacity/": "Capacity and Volume",
  "/worksheet-creators/stage-1/measurement-space/mass/": "Mass",
  "/worksheet-creators/stage-1/measurement-space/time/": "Time",
  "/worksheet-creators/stage-1/statistics-probability/data-collecting/": "Collecting Data",
  "/worksheet-creators/stage-1/statistics-probability/data-interpreting/": "Reading Graphs and Tables",
  "/worksheet-creators/stage-1/statistics-probability/chance/": "Chance",
  "/worksheet-creators/stage-2/number/whole-numbers/": "Whole Numbers",
  "/worksheet-creators/stage-2/number/decimals/": "Decimals",
  "/worksheet-creators/stage-2/number/addition-subtraction/": "Addition and Subtraction",
  "/worksheet-creators/stage-2/number/additive-number-sentences/": "Missing Numbers: Adding and Subtracting",
  "/worksheet-creators/stage-2/number/multiplication-division/": "Multiplication and Division",
  "/worksheet-creators/stage-2/number/multiplicative-number-sentences/": "Missing Numbers: Multiplying and Dividing",
  "/worksheet-creators/stage-2/number/fractions/": "Fractions",
  "/worksheet-creators/stage-2/measurement-space/position/": "Maps and Directions",
  "/worksheet-creators/stage-2/measurement-space/length/": "Length",
  "/worksheet-creators/stage-2/measurement-space/angles/": "Angles",
  "/worksheet-creators/stage-2/measurement-space/2d-shapes/": "2D Shapes",
  "/worksheet-creators/stage-2/measurement-space/transformations/": "Moving and Joining Shapes",
  "/worksheet-creators/stage-2/measurement-space/area/": "Area",
  "/worksheet-creators/stage-2/measurement-space/3d-objects/": "3D Objects",
  "/worksheet-creators/stage-2/measurement-space/volume-capacity/": "Capacity and Volume",
  "/worksheet-creators/stage-2/measurement-space/mass/": "Mass",
  "/worksheet-creators/stage-2/measurement-space/time/": "Time",
  "/worksheet-creators/stage-2/statistics-probability/data-collecting-graphing/": "Collecting and Graphing Data",
  "/worksheet-creators/stage-2/statistics-probability/data-interpreting/": "Reading Tables and Graphs",
  "/worksheet-creators/stage-2/statistics-probability/chance/": "Chance",
  /* ---- Stage 3 (levels are the syllabus parts: Part A / Parts A and B) ---- */
  "/worksheet-creators/stage-3/number/whole-numbers-integers/": "Represents Numbers: Whole Numbers and Integers",
  "/worksheet-creators/stage-3/number/decimals/": "Represents Numbers: Decimals",
  "/worksheet-creators/stage-3/number/percentages/": "Represents Numbers: Percentages",
  "/worksheet-creators/stage-3/number/additive-relations/": "Additive Relations",
  "/worksheet-creators/stage-3/number/multiplying-dividing/": "Multiplicative Relations: Multiplying and Dividing",
  "/worksheet-creators/stage-3/number/number-sentences-patterns/": "Multiplicative Relations: Number Sentences and Patterns",
  "/worksheet-creators/stage-3/number/fractions/": "Fractions: Comparing, Adding and Subtracting",
  "/worksheet-creators/stage-3/number/fractions-of-quantities/": "Fractions: Fractions of Quantities",
  "/worksheet-creators/stage-3/measurement-space/position/": "Geometric Measure: Position",
  "/worksheet-creators/stage-3/measurement-space/length/": "Geometric Measure: Length",
  "/worksheet-creators/stage-3/measurement-space/angles/": "Geometric Measure: Angles",
  "/worksheet-creators/stage-3/measurement-space/2d-shapes/": "2D Spatial Structure: Shapes and Transformations",
  "/worksheet-creators/stage-3/measurement-space/area-rectangles/": "2D Spatial Structure: Area of Rectangles",
  "/worksheet-creators/stage-3/measurement-space/area-triangles-composite/": "2D Spatial Structure: Area of Composite Figures, Parallelograms and Triangles",
  "/worksheet-creators/stage-3/measurement-space/3d-objects/": "3D Spatial Structure: 3D Objects",
  "/worksheet-creators/stage-3/measurement-space/volume-capacity/": "3D Spatial Structure: Volume and Capacity",
  "/worksheet-creators/stage-3/measurement-space/mass/": "Non-Spatial Measure: Mass",
  "/worksheet-creators/stage-3/measurement-space/time/": "Non-Spatial Measure: Time",
  "/worksheet-creators/stage-3/statistics-probability/data-collecting-displaying/": "Data: Collecting and Displaying Data",
  "/worksheet-creators/stage-3/statistics-probability/data-interpreting/": "Data: Interpreting Data",
  "/worksheet-creators/stage-3/statistics-probability/chance/": "Chance",
  /* ---- Stage 4 ---- */
  "/worksheet-creators/stage-4/number/computation-with-integers/": "Computation with Integers",
  "/worksheet-creators/stage-4/number/fractions-decimals-percentages.html": "Fractions, Decimals and Percentages",
  "/worksheet-creators/stage-4/ratios-rates/ratios-and-rates/": "Ratios and Rates",
  "/worksheet-creators/stage-4/algebra/algebraic-techniques/": "Algebraic Techniques",
  "/worksheet-creators/stage-4/number/indices/": "Indices",
  "/worksheet-creators/stage-4/algebra/equations/": "Equations",
  "/worksheet-creators/stage-4/algebra/linear-relationships/": "Linear Relationships",
  "/worksheet-creators/stage-4/measurement-space/length/": "Length",
  "/worksheet-creators/stage-4/measurement-space/pythagoras-theorem/": "Right-Angled Triangles (Pythagoras' Theorem)",
  "/worksheet-creators/stage-4/measurement-space/area/": "Area",
  "/worksheet-creators/stage-4/measurement-space/volume/": "Volume",
  "/worksheet-creators/stage-4/measurement-space/angle-relationships/": "Angle Relationships",
  "/worksheet-creators/stage-4/measurement-space/properties-of-geometrical-figures/": "Properties of Geometrical Figures",
  "/worksheet-creators/stage-4/statistics-probability/data-classification-visualisation/": "Data Classification and Visualisation",
  "/worksheet-creators/stage-4/statistics-probability/data-analysis/": "Data Analysis",
  "/worksheet-creators/stage-4/statistics-probability/probability/": "Probability",
  /* ---- Stage 5 (levels Basic / Expected; each outcome is Core or Path) ---- */
  "/worksheet-creators/stage-5/number/financial-mathematics-a/": "Financial Mathematics A: Earning, Spending and Simple Interest",
  "/worksheet-creators/stage-5/number/financial-mathematics-b/": "Financial Mathematics B: Compound Interest and Depreciation",
  "/worksheet-creators/stage-5/algebra/algebraic-techniques-a/": "Algebraic Techniques A: Algebraic Fractions and Expanding",
  "/worksheet-creators/stage-5/algebra/algebraic-techniques-b/": "Algebraic Techniques B: Factorising and Binomial Products",
  "/worksheet-creators/stage-5/algebra/algebraic-techniques-c/": "Algebraic Techniques C: Special Products and Factorising",
  "/worksheet-creators/stage-5/number/indices-a/": "Indices A: Index Laws, Zero and Negative Indices",
  "/worksheet-creators/stage-5/number/indices-b/": "Indices B: Negative Indices in Algebra",
  "/worksheet-creators/stage-5/number/indices-c/": "Indices C: Surds and Fractional Indices",
  "/worksheet-creators/stage-5/algebra/equations-a/": "Equations A: Linear Equations",
  "/worksheet-creators/stage-5/algebra/equations-b/": "Equations B: Quadratics, Cubics and Inequalities",
  "/worksheet-creators/stage-5/algebra/equations-c/": "Equations C: Literal, Quadratic and Simultaneous Equations",
  "/worksheet-creators/stage-5/algebra/linear-relationships-a/": "Linear Relationships A: Midpoint, Gradient and Distance",
  "/worksheet-creators/stage-5/algebra/linear-relationships-b/": "Linear Relationships B: Gradient–Intercept Form",
  "/worksheet-creators/stage-5/algebra/linear-relationships-c/": "Linear Relationships C: Coordinate Geometry and Transformations",
  "/worksheet-creators/stage-5/algebra/non-linear-relationships-a/": "Non-Linear Relationships A: Tables and Graphs",
  "/worksheet-creators/stage-5/algebra/non-linear-relationships-b/": "Non-Linear Relationships B: Parabolas and Exponential Curves",
  "/worksheet-creators/stage-5/algebra/non-linear-relationships-c/": "Non-Linear Relationships C: Parabolas, Hyperbolas, Circles and More",
  "/worksheet-creators/stage-5/ratios-rates/variation-and-rates-a/": "Variation and Rates of Change A: Direct and Inverse Variation",
  "/worksheet-creators/stage-5/ratios-rates/variation-and-rates-b/": "Variation and Rates of Change B: Rates of Change",
  "/worksheet-creators/stage-5/algebra/polynomials/": "Polynomials",
  "/worksheet-creators/stage-5/algebra/logarithms/": "Logarithms",
  "/worksheet-creators/stage-5/algebra/functions-and-other-graphs/": "Functions and Other Graphs",
  "/worksheet-creators/stage-5/number/numbers-of-any-magnitude/": "Numbers of Any Magnitude",
  "/worksheet-creators/stage-5/measurement-space/trigonometry-a/": "Trigonometry A: Right-Angled Triangles",
  "/worksheet-creators/stage-5/measurement-space/trigonometry-b/": "Trigonometry B: Elevation, Depression and Bearings",
  "/worksheet-creators/stage-5/measurement-space/trigonometry-c/": "Trigonometry C: Non-Right-Angled Triangles and 3D Problems",
  "/worksheet-creators/stage-5/measurement-space/trigonometry-d/": "Trigonometry D: The Unit Circle and Trigonometric Equations",
  "/worksheet-creators/stage-5/measurement-space/area-and-surface-area-a/": "Area and Surface Area A: Composite Areas, Prisms and Cylinders",
  "/worksheet-creators/stage-5/measurement-space/area-and-surface-area-b/": "Area and Surface Area B: Pyramids, Cones and Spheres",
  "/worksheet-creators/stage-5/measurement-space/volume-a/": "Volume A: Prisms, Cylinders and Composite Solids",
  "/worksheet-creators/stage-5/measurement-space/volume-b/": "Volume B: Pyramids, Cones and Spheres",
  "/worksheet-creators/stage-5/measurement-space/geometrical-figures-a/": "Properties of Geometrical Figures A: Similar Figures and Scale",
  "/worksheet-creators/stage-5/measurement-space/geometrical-figures-b/": "Properties of Geometrical Figures B: Congruence, Similarity and Reasoning",
  "/worksheet-creators/stage-5/measurement-space/geometrical-figures-c/": "Properties of Geometrical Figures C: Geometric Proofs",
  "/worksheet-creators/stage-5/measurement-space/circle-geometry/": "Circle Geometry",
  "/worksheet-creators/stage-5/measurement-space/introduction-to-networks/": "Introduction to Networks",
  "/worksheet-creators/stage-5/statistics-probability/data-analysis-a/": "Data Analysis A: Quartiles, Box Plots and Standard Deviation",
  "/worksheet-creators/stage-5/statistics-probability/data-analysis-b/": "Data Analysis B: Bivariate Data",
  "/worksheet-creators/stage-5/statistics-probability/data-analysis-c/": "Data Analysis C: Statistical Inquiries and Media Reports",
  "/worksheet-creators/stage-5/statistics-probability/probability-a/": "Probability A: Multistage Chance Experiments",
  "/worksheet-creators/stage-5/statistics-probability/probability-b/": "Probability B: Venn Diagrams, Two-Way Tables and Conditional Probability"
};
