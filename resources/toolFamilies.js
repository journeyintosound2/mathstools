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
   ========================================================================== */

window.MMT_TOOL_FAMILIES = {
  /* ---- Stage 3 ---- */
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
  "/interactive-tools/stage-4/number/fraction-of-amount/": [
    "/worksheet-creators/stage-4/number/fraction-of-amount.html",
    "/online-quizzes/stage-4/number/fraction-of-amount.html"
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
  ]
};

window.MMT_WHOLE_TOPIC_QUIZZES = {
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
  "/online-quizzes/stage-4/statistics-probability/probability.html":                       "Probability"
};
