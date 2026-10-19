/* ============================================================================
   Mills Maths Tools — Resources by Stage : MANIFEST
   ----------------------------------------------------------------------------
   THIS IS THE ONLY FILE YOU EDIT WHEN YOU ADD A RESOURCE.

   The landing page (resources/index.html) builds itself from this file.

   HOW TO ADD A RESOURCE
   ---------------------
   1. Drop the file into the matching folder, e.g.
        resources/stage-5/trigonometry/bearings-intro.pdf
   2. Find the topic below (search for its `slug`), find the right outcome
      inside `outcomes`, and add ONE object to that outcome's `resources` array:

        { title:"Bearings — intro deck", type:"pptx", file:"bearings-intro.pptx" }

      `file` is relative to the topic folder, so you only write the filename.

   3. git add -A && git commit -m "resources: add bearings deck" && git push

   RESOURCE FIELDS
   ---------------
     title  (required)  what shows on the card
     type   (required)  "pdf" | "pptx" | "docx" | "xlsx" | "link" | "video"
     file   (required unless type:"link" or `path` is given)  filename inside the topic folder
     path   (optional)  site-root path to a file kept in ANOTHER topic's folder,
            e.g. "/resources/stage-4/computation-with-integers/deck.pptx" — lists one
            file under two outcomes without storing it twice
     url    (only for type:"link")  full URL
     note   (optional)  one short line under the title
     year   (optional)  "Year 9" etc — shows as a small chip
     tags   (optional)  ["revision","worked examples"] — searchable

   NOTES
   -----
   * Outcome codes / statements are verbatim from the NSW Mathematics K–10
     Syllabus (2022), NESA. Stage 5 focus areas are COLLATED (Trigonometry A/B/C/D
     -> one "Trigonometry" topic) as requested; each outcome keeps its own
     Core / Path badge and pathway note.
   * `path` values: "Core", or "Path" with `pathway` giving NESA's note
     (Stn = Standard, Adv = Advanced, Ext = Extension).
   * Adding a resource with an outcome code that doesn't exist here is a no-op —
     the page only renders what's listed below.
   ========================================================================== */

window.MMT_RESOURCES = {

  meta: {
    syllabus: "NSW Mathematics K–10 Syllabus (2022)",
    source: "https://curriculum.nsw.edu.au/learning-areas/mathematics/mathematics-k-10-2022",
    lastReviewed: "2026-07-29"
  },

  /* Strand display order + colour keys used by the page */
  strands: [
    { id: "number-algebra",        name: "Number and Algebra",        colour: "blue"   },
    { id: "measurement-space",     name: "Measurement and Space",     colour: "teal"   },
    { id: "statistics-probability",name: "Statistics and Probability",colour: "purple" }
  ],

  /* ==========================================================================
     STAGE 3  (Years 5–6) — 21 outcomes across 20 focus areas
     ---------------------------------------------------------------------------
     NESA splits each Stage 3 focus area into Part A and Part B (a Year 5 /
     Year 6 emphasis) — but BOTH parts carry the SAME outcomes. So the A/B pair
     is collated into one topic here, exactly as with Stage 5.
     K–6 has no Core / Path distinction, so Stage 3 outcomes carry no `path`
     field and the page renders no badge for them.
     ========================================================================== */
  stage3: [

    /* ---------- Number and Algebra ---------- */
    {
      slug: "represents-numbers",
      name: "Represents Numbers",
      strand: "number-algebra",
      icon: "123",
      collates: "Represents numbers A, B",
      blurb: "Place value to millions and billions, decimals to 3 places, integers on a number line, and benchmark percentages.",
      outcomes: [
        {
          code: "MA3-RN-01",
          focusArea: "Represents numbers A & B",
          statement: "applies an understanding of place value and the role of zero to represent the properties of numbers",
          resources: []
        },
        {
          code: "MA3-RN-02",
          focusArea: "Represents numbers A & B",
          statement: "compares and orders decimals up to 3 decimal places",
          resources: []
        },
        {
          code: "MA3-RN-03",
          focusArea: "Represents numbers A & B",
          statement: "determines percentages of quantities, and finds equivalent fractions and decimals for benchmark percentage values",
          resources: []
        }
      ]
    },
    {
      slug: "additive-relations",
      name: "Additive Relations",
      strand: "number-algebra",
      icon: "+−",
      collates: "Additive relations A, B",
      blurb: "Choosing efficient strategies for addition and subtraction, including with decimals.",
      outcomes: [
        {
          code: "MA3-AR-01",
          focusArea: "Additive relations A & B",
          statement: "selects and applies appropriate strategies to solve addition and subtraction problems",
          resources: [
            {
              title: "Addition Practice — Spot the Mistake",
              type: "pdf",
              file: "addition-practice-spot-the-mistake.pdf",
              note: "2-page worksheet — find and explain errors in column addition, complete a partitioning strategy and name it, then a Year 7 challenge page (angles, algebra, perimeter).",
              year: "Year 6",
              tags: ["worksheet", "error analysis", "column addition", "partitioning", "strategy", "transition to Year 7", "extension"]
            },
            {
              title: "Addition Challenge and Extension",
              type: "pdf",
              file: "addition-challenge-extension.pdf",
              note: "2-page challenge set — missing values, magic squares, an Open Middle digit task, balancing equivalent expressions, and an always/sometimes/never reasoning prompt on odd numbers.",
              year: "Year 6",
              tags: ["challenge", "extension", "magic squares", "open middle", "reasoning", "always sometimes never", "equivalence", "problem solving"]
            }
          ]
        }
      ]
    },
    {
      slug: "multiplicative-relations",
      name: "Multiplicative Relations",
      strand: "number-algebra",
      icon: "×÷",
      collates: "Multiplicative relations A, B",
      blurb: "Multiplication and division strategies, factors and multiples, number sentences and the order of operations.",
      outcomes: [
        {
          code: "MA3-MR-01",
          focusArea: "Multiplicative relations A & B",
          statement: "selects and applies appropriate strategies to solve multiplication and division problems",
          resources: [
            {
              title: "Division Strategies \u2014 Sharing, Known Products and Halving",
              type: "pptx",
              file: "division-strategies-stage-3.pptx",
              note: "49-slide lesson deck, built to click through one step at a time \u2014 an estimation warm-up, \"find four different ways\", then sharing into bubbles and a ratio table run on the same question so the two can be compared. Speaker notes throughout.",
              year: "Year 5\u20136",
              tags: ["lesson deck", "presentation", "division", "division strategies", "sharing and regrouping", "partial quotients", "known products", "ratio table", "estimation", "speaker notes"]
            },
            {
              title: "Division Strategies \u2014 Choose Your Strategy",
              type: "pdf",
              file: "division-strategies-choose-your-strategy.pdf",
              note: "3 pages \u2014 paired practice on the same question two ways (bubbles vs ratio table), then choose-your-own-strategy questions, then an extension plotting the table rows as a straight line through the origin. Answer key on page 3.",
              year: "Year 5\u20136",
              tags: ["worksheet", "division", "division strategies", "choose a strategy", "sharing and regrouping", "ratio table", "known products", "linear relationships", "graphing", "answer key"]
            },
            {
              title: "Dot Circle Factors",
              type: "pdf",
              file: "dot-circle-factors.pdf",
              note: "2-page worksheet — build dot arrangements in a circle, record the factor groups (\"2 groups of 3\"), then list the factors. Worked example on page 1, blank grid on page 2.",
              year: "Year 5",
              tags: ["worksheet", "factors", "multiples", "factor pairs", "arrays", "visual", "dot arrangements"]
            },
            {
              title: "Who Am I? — Non-Familiar Factors",
              type: "pdf",
              file: "who-am-i-non-familiar-factors.pdf",
              note: "2-page deduction puzzle — narrow down a number from clues about factor count, multiples, square numbers and factor sums. Page 2 is a harder version.",
              year: "Year 6",
              tags: ["puzzle", "factors", "multiples", "square numbers", "divisibility", "reasoning", "extension", "who am I"]
            }
          ]
        },
        {
          code: "MA3-MR-02",
          focusArea: "Multiplicative relations A & B",
          statement: "constructs and completes number sentences involving multiplicative relations, applying the order of operations to calculations",
          resources: [
            {
              title: "Order of Operations Review \u2014 Say What You See",
              type: "pptx",
              path: "/resources/stage-4/computation-with-integers/order-of-operations-review.pptx",
              note: "29-slide deck — no acronym: each expression is described as a picture first (\"5 and 3 groups of 5\"), then written in mathematical language; take-away and fractions of an amount, a your-turn set, and the \"boy with the telescope\" left-to-right rule for × and ÷. The Say What You See interactive is built from it. The file lives with Stage 4 Integers; listed here too because Stage 3 is where the order of operations is first met.",
              year: "Year 6",
              tags: ["lesson deck", "presentation", "order of operations", "BODMAS", "describe what you see", "visual", "groups of", "number sentences", "left to right", "boy with the telescope"]
            }
          ]
        }
      ]
    },
    {
      slug: "representing-quantity-fractions",
      name: "Representing Quantity Fractions",
      strand: "number-algebra",
      icon: "½",
      collates: "Representing quantity fractions A, B",
      blurb: "Comparing and ordering fractions with related denominators, and finding fractions of measures and quantities.",
      outcomes: [
        {
          code: "MA3-RQF-01",
          focusArea: "Representing quantity fractions A & B",
          statement: "compares and orders fractions with denominators of 2, 3, 4, 5, 6, 8 and 10",
          resources: []
        },
        {
          code: "MA3-RQF-02",
          focusArea: "Representing quantity fractions A & B",
          statement: "determines ½, ¼, ⅕ and 1/10 of measures and quantities",
          resources: []
        }
      ]
    },

    /* ---------- Measurement and Space ---------- */
    {
      slug: "geometric-measure",
      name: "Geometric Measure",
      strand: "measurement-space",
      icon: "📐",
      collates: "Geometric measure A, B",
      blurb: "Points on the coordinate plane, length and perimeter, and measuring and constructing angles.",
      outcomes: [
        {
          code: "MA3-GM-01",
          focusArea: "Geometric measure A & B — Position",
          statement: "locates and describes points on a coordinate plane",
          resources: []
        },
        {
          code: "MA3-GM-02",
          focusArea: "Geometric measure A & B — Length",
          statement: "selects and uses the appropriate unit and device to measure lengths and distances including perimeters",
          resources: []
        },
        {
          code: "MA3-GM-03",
          focusArea: "Geometric measure A & B — Angles",
          statement: "measures and constructs angles, and identifies the relationships between angles on a straight line and angles at a point",
          resources: []
        }
      ]
    },
    {
      slug: "two-dimensional-spatial-structure",
      name: "Two-Dimensional Spatial Structure",
      strand: "measurement-space",
      icon: "▦",
      collates: "Two-dimensional spatial structure A, B",
      blurb: "Classifying 2D shapes, area of rectangles, and rearranging shapes to find the area of parallelograms and triangles.",
      outcomes: [
        {
          code: "MA3-2DS-01",
          focusArea: "2D spatial structure A & B — 2D shapes",
          statement: "investigates and classifies two-dimensional shapes, including triangles and quadrilaterals based on their properties",
          resources: []
        },
        {
          code: "MA3-2DS-02",
          focusArea: "2D spatial structure A & B — Area",
          statement: "selects and uses the appropriate unit to calculate areas, including areas of rectangles",
          resources: []
        },
        {
          code: "MA3-2DS-03",
          focusArea: "2D spatial structure A & B — Area",
          statement: "combines, splits and rearranges shapes to determine the area of parallelograms and triangles",
          resources: []
        }
      ]
    },
    {
      slug: "three-dimensional-spatial-structure",
      name: "Three-Dimensional Spatial Structure",
      strand: "measurement-space",
      icon: "🧊",
      collates: "Three-dimensional spatial structure A, B",
      blurb: "Prisms and pyramids, nets and connections to 2D representations, and volume and capacity.",
      outcomes: [
        {
          code: "MA3-3DS-01",
          focusArea: "3D spatial structure A & B — 3D objects",
          statement: "visualises, sketches and constructs three-dimensional objects, including prisms and pyramids, making connections to two-dimensional representations",
          resources: []
        },
        {
          code: "MA3-3DS-02",
          focusArea: "3D spatial structure A & B — Volume",
          statement: "selects and uses the appropriate unit to estimate, measure and calculate volumes and capacities",
          resources: []
        }
      ]
    },
    {
      slug: "non-spatial-measure",
      name: "Non-Spatial Measure",
      strand: "measurement-space",
      icon: "⚖",
      collates: "Non-spatial measure A, B",
      blurb: "Measuring mass, and duration using 12- and 24-hour time.",
      outcomes: [
        {
          code: "MA3-NSM-01",
          focusArea: "Non-spatial measure A & B — Mass",
          statement: "selects and uses the appropriate unit and device to measure the masses of objects",
          resources: []
        },
        {
          code: "MA3-NSM-02",
          focusArea: "Non-spatial measure A & B — Time",
          statement: "measures and compares duration, using 12- and 24-hour time and am and pm notation",
          resources: []
        }
      ]
    },

    /* ---------- Statistics and Probability ---------- */
    {
      slug: "data",
      name: "Data",
      strand: "statistics-probability",
      icon: "📊",
      collates: "Data A, B",
      blurb: "Constructing graphs with many-to-one scales, and interpreting timelines, line graphs and media displays.",
      outcomes: [
        {
          code: "MA3-DATA-01",
          focusArea: "Data A & B",
          statement: "constructs graphs using many-to-one scales",
          resources: []
        },
        {
          code: "MA3-DATA-02",
          focusArea: "Data A & B",
          statement: "interprets data displays, including timelines and line graphs",
          resources: []
        }
      ]
    },
    {
      slug: "chance",
      name: "Chance",
      strand: "statistics-probability",
      icon: "🎲",
      collates: "Chance A, B",
      blurb: "Running chance experiments, and quantifying probability with fractions, decimals and percentages.",
      outcomes: [
        {
          code: "MA3-CHAN-01",
          focusArea: "Chance A & B",
          statement: "conducts chance experiments and quantifies the probability",
          resources: []
        }
      ]
    }
  ],

  /* ==========================================================================
     STAGE 4  (Years 7–8) — 16 outcomes across 16 focus areas
     ========================================================================== */
  stage4: [

    /* ---------- Number and Algebra ---------- */
    {
      slug: "computation-with-integers",
      name: "Computation with Integers",
      strand: "number-algebra",
      icon: "±",
      blurb: "Compare, order and operate with positive and negative integers.",
      outcomes: [
        {
          code: "MA4-INT-C-01",
          path: "Core",
          statement: "compares, orders and calculates with integers to solve problems",
          resources: [
            {
              title: "Order of Operations Review \u2014 Say What You See",
              type: "pptx",
              file: "order-of-operations-review.pptx",
              note: "29-slide deck — no acronym: each expression is described as a picture first (\"5 and 3 groups of 5\"), then written in mathematical language; take-away and fractions of an amount, a your-turn set, and the \"boy with the telescope\" left-to-right rule for × and ÷. The Say What You See interactive is built from it.",
              year: "Year 7",
              tags: ["lesson deck", "presentation", "order of operations", "BODMAS", "BIDMAS", "PEMDAS", "describe what you see", "visual", "groups of", "integers", "left to right", "boy with the telescope"]
            }
          ]
        }
      ]
    },
    {
      slug: "fractions-decimals-percentages",
      name: "Fractions, Decimals and Percentages",
      strand: "number-algebra",
      icon: "½",
      blurb: "Represent and operate across the three forms, and convert between them.",
      outcomes: [
        {
          code: "MA4-FRC-C-01",
          path: "Core",
          statement: "represents and operates with fractions, decimals and percentages to solve problems",
          resources: [
            {
              title: "Unit Fraction Calculations",
              type: "pdf",
              file: "unit-fraction-calculations.pdf",
              note: "2-page worksheet — completing number lines in unit fractions, comparing unit fractions with a bar model, and finding a fraction of an amount.",
              year: "Year 7",
              tags: ["worksheet", "unit fractions", "number line", "bar model", "fraction of an amount", "comparing fractions"]
            },
            {
              title: "Fraction of an Amount",
              type: "pdf",
              file: "fraction-of-an-amount.pdf",
              note: "1-page worksheet — completing double number lines to find unit and non-unit fractions of an amount, then applying it without a number line.",
              year: "Year 7",
              tags: ["worksheet", "fraction of an amount", "double number line", "unit fractions", "non-unit fractions"]
            },
            {
              title: "Comparing Fractions",
              type: "pdf",
              file: "comparing-fractions.pdf",
              note: "1-page faded worked example — Demonstration / Faded / Your turn. Uses a double number line to find equivalent fractions, then practice without the diagram.",
              year: "Year 7",
              tags: ["worksheet", "equivalent fractions", "comparing fractions", "double number line", "faded worked examples", "scaffolded", "worked example"]
            },
            {
              title: "Adding Fractions with Common Denominators",
              type: "pdf",
              file: "adding-fractions-with-common-denominators.pdf",
              note: "2-page worksheet — shading fraction bars to add and subtract with like denominators, improper and mixed fractions, and missing-value gap fills.",
              year: "Year 7",
              tags: ["worksheet", "adding fractions", "subtracting fractions", "common denominators", "fraction bar", "improper fractions", "mixed numerals"]
            },
            {
              title: "Percentage and Decimal of an Amount",
              type: "pdf",
              file: "percentage-and-decimal-of-an-amount.pdf",
              note: "2-page worksheet — using a number line to find a percentage or decimal of an amount, then comparing equivalent forms.",
              year: "Year 7",
              tags: ["worksheet", "number line", "percentage of an amount", "decimal of an amount"]
            }
          ]
        }
      ]
    },
    {
      slug: "ratios-and-rates",
      name: "Ratios and Rates",
      strand: "number-algebra",
      icon: "∶",
      blurb: "Ratio, rate and distance–time graphs.",
      outcomes: [
        {
          code: "MA4-RAT-C-01",
          path: "Core",
          statement: "solves problems involving ratios and rates, and analyses distance–time graphs",
          resources: [
            {
              title: "Rates with Year 8s — Speed, Distance and Time",
              type: "pptx",
              file: "rates-speed-stage-4.pptx",
              note: "17-slide lesson deck — comparing rates, unpacking what 300 km/h means, then paired 'what else can you work out?' / 'now answer this' questions on speed, distance and time.",
              year: "Year 8",
              tags: ["lesson deck", "presentation", "rates", "speed", "distance", "time", "average speed", "unit rates", "discussion prompts", "worked examples"]
            },
            {
              title: "Rates — Speed, Distance and Time",
              type: "pdf",
              file: "year-8-rates-speed-distance-time.pdf",
              note: "2-page worksheet — 9 questions on average speed, distance and time, including part-hour travel, metres per second, and finding speed from distance and time.",
              year: "Year 8",
              tags: ["worksheet", "rates", "speed", "distance", "time", "average speed", "km/h", "unit conversion", "problem solving"]
            }
          ]
        }
      ]
    },
    {
      slug: "algebraic-techniques",
      name: "Algebraic Techniques",
      strand: "number-algebra",
      icon: "𝑥",
      blurb: "Generalising number properties: simplifying, expanding and factorising.",
      outcomes: [
        {
          code: "MA4-ALG-C-01",
          path: "Core",
          statement: "generalises number properties to operate with algebraic expressions including expansion and factorisation",
          resources: []
        }
      ]
    },
    {
      slug: "indices",
      name: "Indices",
      strand: "number-algebra",
      icon: "xⁿ",
      blurb: "Primes, roots, positive-integer and zero indices, and the index laws.",
      outcomes: [
        {
          code: "MA4-IND-C-01",
          path: "Core",
          statement: "operates with primes and roots, positive-integer and zero indices involving numerical bases and establishes the relevant index laws",
          resources: []
        }
      ]
    },
    {
      slug: "equations",
      name: "Equations",
      strand: "number-algebra",
      icon: "=",
      blurb: "Solving linear equations up to two steps, and quadratics of the form ax² = c.",
      outcomes: [
        {
          code: "MA4-EQU-C-01",
          path: "Core",
          statement: "solves linear equations of up to 2 steps and quadratic equations of the form ax² = c",
          resources: []
        }
      ]
    },
    {
      slug: "linear-relationships",
      name: "Linear Relationships",
      strand: "number-algebra",
      icon: "📈",
      blurb: "Number patterns, the Cartesian plane and graphing linear relationships.",
      outcomes: [
        {
          code: "MA4-LIN-C-01",
          path: "Core",
          statement: "creates and displays number patterns and finds graphical solutions to problems involving linear relationships",
          resources: [
            {
              title: "Visual Patterns Activity",
              type: "docx",
              file: "visual-patterns-activity.docx",
              note: "Six growing patterns (squares, matchsticks, cubes, circles) \u2014 describe in your own words how each figure changes, then predict a far figure (7, 11, 6, 12, 28). Question 6 is a challenge. Editable Word file.",
              year: "Year 7",
              tags: ["worksheet", "visual patterns", "growing patterns", "number patterns", "predict", "describe", "matchsticks", "linear relationships", "notice and wonder", "editable"]
            }
          ]
        }
      ]
    },

    /* ---------- Measurement and Space ---------- */
    {
      slug: "length",
      name: "Length",
      strand: "measurement-space",
      icon: "📏",
      blurb: "Perimeter of plane shapes and circumference of circles.",
      outcomes: [
        {
          code: "MA4-LEN-C-01",
          path: "Core",
          statement: "applies knowledge of the perimeter of plane shapes and the circumference of circles to solve problems",
          resources: []
        }
      ]
    },
    {
      slug: "right-angled-triangles-pythagoras",
      name: "Right-Angled Triangles (Pythagoras’ Theorem)",
      strand: "measurement-space",
      icon: "📐",
      blurb: "Pythagoras’ theorem and its applications.",
      outcomes: [
        {
          code: "MA4-PYT-C-01",
          path: "Core",
          statement: "applies Pythagoras’ theorem to solve problems in various contexts",
          resources: []
        }
      ]
    },
    {
      slug: "area",
      name: "Area",
      strand: "measurement-space",
      icon: "▦",
      blurb: "Area and composite area of triangles, quadrilaterals and circles.",
      outcomes: [
        {
          code: "MA4-ARE-C-01",
          path: "Core",
          statement: "applies knowledge of area and composite area involving triangles, quadrilaterals and circles to solve problems",
          resources: []
        }
      ]
    },
    {
      slug: "volume",
      name: "Volume",
      strand: "measurement-space",
      icon: "🧊",
      blurb: "Volume and capacity of right prisms and cylinders.",
      outcomes: [
        {
          code: "MA4-VOL-C-01",
          path: "Core",
          statement: "applies knowledge of volume and capacity to solve problems involving right prisms and cylinders",
          resources: []
        }
      ]
    },
    {
      slug: "angle-relationships",
      name: "Angle Relationships",
      strand: "measurement-space",
      icon: "∠",
      blurb: "Angles at a point, on a line, and with transversals on parallel lines.",
      outcomes: [
        {
          code: "MA4-ANG-C-01",
          path: "Core",
          statement: "applies angle relationships to solve problems, including those related to transversals on sets of parallel lines",
          resources: []
        }
      ]
    },
    {
      slug: "properties-of-geometrical-figures",
      name: "Properties of Geometrical Figures",
      strand: "measurement-space",
      icon: "△",
      blurb: "Classifying and using the properties of triangles and quadrilaterals.",
      outcomes: [
        {
          code: "MA4-GEO-C-01",
          path: "Core",
          statement: "identifies and applies the properties of triangles and quadrilaterals to solve problems",
          resources: []
        }
      ]
    },

    /* ---------- Statistics and Probability ---------- */
    {
      slug: "data-classification-visualisation-analysis",
      name: "Data Classification, Visualisation and Analysis",
      strand: "statistics-probability",
      icon: "📊",
      blurb: "Classifying and displaying data, then analysing centre, range and shape.",
      outcomes: [
        {
          code: "MA4-DAT-C-01",
          path: "Core",
          focusArea: "Data classification and visualisation",
          statement: "classifies and displays data using a variety of graphical representations",
          resources: []
        },
        {
          code: "MA4-DAT-C-02",
          path: "Core",
          focusArea: "Data analysis",
          statement: "analyses simple datasets using measures of centre, range and shape of the data",
          resources: []
        }
      ]
    },
    {
      slug: "probability",
      name: "Probability",
      strand: "statistics-probability",
      icon: "🎲",
      blurb: "Probabilities of simple chance experiments.",
      outcomes: [
        {
          code: "MA4-PRO-C-01",
          path: "Core",
          statement: "solves problems involving the probabilities of simple chance experiments",
          resources: []
        }
      ]
    }
  ],

  /* ==========================================================================
     STAGE 5  (Years 9–10) — COLLATED TOPICS
     e.g. "Trigonometry A/B" (Core) + "Trigonometry C/D" (Path) -> "Trigonometry"
     ========================================================================== */
  stage5: [

    /* ---------- Number and Algebra ---------- */
    {
      slug: "financial-mathematics",
      name: "Financial Mathematics",
      strand: "number-algebra",
      icon: "💲",
      collates: "Financial mathematics A, B",
      blurb: "Earning and spending money, simple interest, compound interest and depreciation.",
      outcomes: [
        {
          code: "MA5-FIN-C-01",
          path: "Core",
          focusArea: "Financial mathematics A",
          statement: "solves financial problems involving simple interest, earning money and spending money",
          resources: []
        },
        {
          code: "MA5-FIN-C-02",
          path: "Core",
          focusArea: "Financial mathematics B",
          statement: "solves financial problems involving compound interest and depreciation",
          resources: []
        }
      ]
    },
    {
      slug: "algebraic-techniques",
      name: "Algebraic Techniques",
      strand: "number-algebra",
      icon: "𝑥",
      collates: "Algebraic techniques A, B (Path), C (Path)",
      blurb: "Algebraic fractions, expansion, factorisation and simplification.",
      outcomes: [
        {
          code: "MA5-ALG-C-01",
          path: "Core",
          focusArea: "Algebraic techniques A",
          statement: "simplifies algebraic fractions with numerical denominators and expands algebraic expressions",
          resources: [
            {
              title: "Simplifying Algebraic Fractions",
              type: "pdf",
              file: "simplifying-algebraic-fractions.pdf",
              note: "2-page faded worked example — Demonstration / Faded / Your turn columns, then practice. Q1 numerical denominators (15a/6), Q2 extends to cancelling common variable factors (12ab/18b).",
              year: "Year 9",
              tags: ["worksheet", "algebraic fractions", "simplifying", "cancelling", "faded worked examples", "scaffolded", "worked example"]
            }
          ]
        },
        {
          code: "MA5-ALG-P-01",
          path: "Path",
          pathway: "Adv",
          focusArea: "Algebraic techniques B",
          statement: "simplifies algebraic fractions involving indices, and expands and factorises algebraic expressions",
          resources: []
        },
        {
          code: "MA5-ALG-P-02",
          path: "Path",
          pathway: "Adv",
          focusArea: "Algebraic techniques C",
          statement: "selects and applies appropriate algebraic techniques to operate with algebraic fractions, and expands, factorises and simplifies algebraic expressions",
          resources: [
            {
              title: "Complete the Square \u2014 demo notes",
              type: "pdf",
              file: "complete-the-square-demo-notes.pdf",
              note: "4-page photo record of a manipulative whiteboard demonstration. Steps 1\u20134 build x\u00b2 + 26x = 27 as an area model, halve the 26x strip, add the missing 169 corner to complete the square, then square-root to get (x + 13)\u00b2 = 196 \u2192 x = 1 or 27 \u2014 with a note on why the negative solution was historically overlooked. Steps 5\u20138 repeat the same build with ax\u00b2 + bx + c = 0 to derive the quadratic formula.",
              year: "Year 10",
              tags: ["lesson notes", "completing the square", "quadratics", "area model", "algebra tiles", "quadratic formula", "proof", "demonstration", "worked example"]
            }
          ]
        }
      ]
    },
    {
      slug: "indices-and-surds",
      name: "Indices and Surds",
      strand: "number-algebra",
      icon: "√",
      collates: "Indices A, B (Path), C (Path)",
      blurb: "Index laws with algebraic expressions, negative indices, surds and fractional indices.",
      outcomes: [
        {
          code: "MA5-IND-C-01",
          path: "Core",
          focusArea: "Indices A",
          statement: "simplifies algebraic expressions involving positive-integer and zero indices, and establishes the meaning of negative indices for numerical bases",
          resources: []
        },
        {
          code: "MA5-IND-P-01",
          path: "Path",
          pathway: "Adv",
          focusArea: "Indices B",
          statement: "applies the index laws to operate with algebraic expressions involving negative-integer indices",
          resources: []
        },
        {
          code: "MA5-IND-P-02",
          path: "Path",
          pathway: "Adv",
          focusArea: "Indices C",
          statement: "describes and performs operations with surds and fractional indices",
          resources: []
        }
      ]
    },
    {
      slug: "equations",
      name: "Equations",
      strand: "number-algebra",
      icon: "=",
      collates: "Equations A, B (Path), C (Path)",
      blurb: "Linear equations, inequalities, quadratics, cubics and simultaneous equations.",
      outcomes: [
        {
          code: "MA5-EQU-C-01",
          path: "Core",
          focusArea: "Equations A",
          statement: "solves linear equations of up to 3 steps, limited to one algebraic fraction",
          resources: []
        },
        {
          code: "MA5-EQU-P-01",
          path: "Path",
          pathway: "Adv",
          focusArea: "Equations B",
          statement: "solves monic quadratic equations, linear inequalities and cubic equations of the form ax³ = c",
          resources: []
        },
        {
          code: "MA5-EQU-P-02",
          path: "Path",
          pathway: "Adv",
          focusArea: "Equations C",
          statement: "solves linear equations of more than 3 steps, monic and non-monic quadratic equations, and linear simultaneous equations",
          resources: []
        }
      ]
    },
    {
      slug: "linear-relationships",
      name: "Linear Relationships",
      strand: "number-algebra",
      icon: "📈",
      collates: "Linear relationships A, B, C (Path)",
      blurb: "Midpoint, gradient, distance, slope-intercept form, transformations and equations of lines.",
      outcomes: [
        {
          code: "MA5-LIN-C-01",
          path: "Core",
          focusArea: "Linear relationships A",
          statement: "determines the midpoint, gradient and length of an interval, and graphs linear relationships, with and without digital tools",
          resources: []
        },
        {
          code: "MA5-LIN-C-02",
          path: "Core",
          focusArea: "Linear relationships B",
          statement: "graphs and interprets linear relationships using the gradient/slope-intercept form",
          resources: []
        },
        {
          code: "MA5-LIN-P-01",
          path: "Path",
          pathway: "Adv",
          focusArea: "Linear relationships C",
          statement: "describes and applies transformations, the midpoint, gradient/slope and distance formulas, and equations of lines to solve problems",
          resources: []
        }
      ]
    },
    {
      slug: "non-linear-relationships",
      name: "Non-Linear Relationships",
      strand: "number-algebra",
      icon: "∪",
      collates: "Non-linear relationships A, B, C (Path)",
      blurb: "Quadratic and exponential relationships, parabolas, curves and their transformations.",
      outcomes: [
        {
          code: "MA5-NLI-C-01",
          path: "Core",
          focusArea: "Non-linear relationships A",
          statement: "identifies connections between algebraic and graphical representations of quadratic and exponential relationships in various contexts",
          resources: []
        },
        {
          code: "MA5-NLI-C-02",
          path: "Core",
          focusArea: "Non-linear relationships B",
          statement: "identifies and compares features of parabolas and exponential curves in various contexts",
          resources: []
        },
        {
          code: "MA5-NLI-P-01",
          path: "Path",
          pathway: "Adv",
          focusArea: "Non-linear relationships C",
          statement: "interprets and compares non-linear relationships and their transformations, both algebraically and graphically",
          resources: []
        }
      ]
    },
    {
      slug: "variation-and-rates-of-change",
      name: "Variation and Rates of Change",
      strand: "number-algebra",
      icon: "∝",
      collates: "Variation and rates of change A (Path), B (Path)",
      blurb: "Direct and inverse variation, and graphs relating to rates of change.",
      outcomes: [
        {
          code: "MA5-RAT-P-01",
          path: "Path",
          pathway: "Stn, Adv",
          focusArea: "Variation and rates of change A",
          statement: "identifies and solves problems involving direct and inverse variation and their graphical representations",
          resources: []
        },
        {
          code: "MA5-RAT-P-02",
          path: "Path",
          pathway: "Adv",
          focusArea: "Variation and rates of change B",
          statement: "analyses and constructs graphs relating to rates of change",
          resources: []
        }
      ]
    },
    {
      slug: "polynomials",
      name: "Polynomials",
      strand: "number-algebra",
      icon: "𝑃(x)",
      collates: "Polynomials (Path)",
      blurb: "Operating with and graphing polynomials; factor and remainder theorems.",
      outcomes: [
        {
          code: "MA5-POL-P-01",
          path: "Path",
          pathway: "Adv, Ext",
          focusArea: "Polynomials",
          statement: "defines, operates with and graphs polynomials and applies the factor and remainder theorems to solve problems",
          resources: []
        }
      ]
    },
    {
      slug: "logarithms",
      name: "Logarithms",
      strand: "number-algebra",
      icon: "log",
      collates: "Logarithms (Path)",
      blurb: "The laws of logarithms and their applications.",
      outcomes: [
        {
          code: "MA5-LOG-P-01",
          path: "Path",
          pathway: "Adv",
          focusArea: "Logarithms",
          statement: "establishes and applies the laws of logarithms to solve problems",
          resources: []
        }
      ]
    },
    {
      slug: "functions-and-other-graphs",
      name: "Functions and Other Graphs",
      strand: "number-algebra",
      icon: "ƒ",
      collates: "Functions and other graphs (Path)",
      blurb: "Function notation, graphing functions of one variable, and graphing inequalities.",
      outcomes: [
        {
          code: "MA5-FNC-P-01",
          path: "Path",
          pathway: "Adv",
          focusArea: "Functions and other graphs",
          statement: "uses function notation to describe and graph functions of one variable and graphs inequalities in one and 2 variables",
          resources: []
        }
      ]
    },

    /* ---------- Measurement and Space ---------- */
    {
      slug: "numbers-of-any-magnitude",
      name: "Numbers of Any Magnitude",
      strand: "measurement-space",
      icon: "×10ⁿ",
      collates: "Numbers of any magnitude",
      blurb: "Scientific notation, significant figures and rounding in measurement.",
      outcomes: [
        {
          code: "MA5-MAG-C-01",
          path: "Core",
          focusArea: "Numbers of any magnitude",
          statement: "solves measurement problems by using scientific notation to represent numbers and rounding to a given number of significant figures",
          resources: []
        }
      ]
    },
    {
      slug: "trigonometry",
      name: "Trigonometry",
      strand: "measurement-space",
      icon: "📐",
      collates: "Trigonometry A, B, C (Path), D (Path)",
      blurb: "Trig ratios, bearings, elevation/depression, 3D problems, sine and cosine rules, and trig functions.",
      outcomes: [
        {
          code: "MA5-TRG-C-01",
          path: "Core",
          focusArea: "Trigonometry A",
          statement: "applies trigonometric ratios to solve right-angled triangle problems",
          resources: []
        },
        {
          code: "MA5-TRG-C-02",
          path: "Core",
          focusArea: "Trigonometry B",
          statement: "applies trigonometry to solve problems, including bearings and angles of elevation and depression",
          resources: []
        },
        {
          code: "MA5-TRG-P-01",
          path: "Path",
          pathway: "Stn, Adv",
          focusArea: "Trigonometry C",
          statement: "applies Pythagoras’ theorem and trigonometry to solve 3-dimensional problems and applies the sine, cosine and area rules to solve 2-dimensional problems, including bearings",
          resources: []
        },
        {
          code: "MA5-TRG-P-02",
          path: "Path",
          pathway: "Adv",
          focusArea: "Trigonometry D",
          statement: "establishes and applies the properties of trigonometric functions and finds solutions to trigonometric equations",
          resources: []
        }
      ]
    },
    {
      slug: "area-and-surface-area",
      name: "Area and Surface Area",
      strand: "measurement-space",
      icon: "▦",
      collates: "Area and surface area A, B (Path)",
      blurb: "Surface area of prisms, pyramids, cones and spheres; composite shapes and solids.",
      outcomes: [
        {
          code: "MA5-ARE-C-01",
          path: "Core",
          focusArea: "Area and surface area A",
          statement: "solves problems involving the surface area of right prisms and practical problems involving the area of composite shapes and solids",
          resources: []
        },
        {
          code: "MA5-ARE-P-01",
          path: "Path",
          pathway: "Stn, Adv",
          focusArea: "Area and surface area B",
          statement: "applies knowledge of the surface area of right pyramids and cones, spheres and composite solids to solve problems",
          resources: []
        }
      ]
    },
    {
      slug: "volume",
      name: "Volume",
      strand: "measurement-space",
      icon: "🧊",
      collates: "Volume A, B (Path)",
      blurb: "Volume of composite solids, right pyramids, cones and spheres.",
      outcomes: [
        {
          code: "MA5-VOL-C-01",
          path: "Core",
          focusArea: "Volume A",
          statement: "solves problems involving the volume of composite solids consisting of right prisms and cylinders",
          resources: []
        },
        {
          code: "MA5-VOL-P-01",
          path: "Path",
          pathway: "Stn, Adv",
          focusArea: "Volume B",
          statement: "applies knowledge of the volume of right pyramids, cones and spheres to solve problems involving related composite solids",
          resources: []
        }
      ]
    },
    {
      slug: "properties-of-geometrical-figures",
      name: "Properties of Geometrical Figures",
      strand: "measurement-space",
      icon: "△",
      collates: "Properties of geometrical figures A, B (Path), C (Path)",
      blurb: "Similarity, scale drawings, congruence conditions and geometric proof.",
      outcomes: [
        {
          code: "MA5-GEO-C-01",
          path: "Core",
          focusArea: "Properties of geometrical figures A",
          statement: "identifies and applies the properties of similar figures and scale drawings to solve problems",
          resources: []
        },
        {
          code: "MA5-GEO-P-01",
          path: "Path",
          pathway: "Ext",
          focusArea: "Properties of geometrical figures B",
          statement: "establishes conditions for congruent triangles and similar triangles and solves problems relating to properties of similar figures and plane shapes",
          resources: []
        },
        {
          code: "MA5-GEO-P-02",
          path: "Path",
          pathway: "Ext",
          focusArea: "Properties of geometrical figures C",
          statement: "constructs proofs involving congruent triangles and similar triangles and proves properties of plane shapes",
          resources: []
        }
      ]
    },
    {
      slug: "circle-geometry",
      name: "Circle Geometry",
      strand: "measurement-space",
      icon: "◯",
      collates: "Circle geometry (Path)",
      blurb: "Deductive reasoning to prove and apply the circle theorems.",
      outcomes: [
        {
          code: "MA5-CIR-P-01",
          path: "Path",
          pathway: "Ext",
          focusArea: "Circle geometry",
          statement: "applies deductive reasoning to prove circle theorems and solve related problems",
          resources: []
        }
      ]
    },
    {
      slug: "introduction-to-networks",
      name: "Introduction to Networks",
      strand: "measurement-space",
      icon: "🕸",
      collates: "Introduction to networks (Path)",
      blurb: "Graphs/networks, planar graphs, Eulerian trails and circuits.",
      outcomes: [
        {
          code: "MA5-NET-P-01",
          path: "Path",
          pathway: "Stn",
          focusArea: "Introduction to networks",
          statement: "solves problems involving the characteristics of graphs/networks, planar graphs and Eulerian trails and circuits",
          resources: [
            {
              title: "Number Sum Chain",
              type: "link",
              url: "/interactive-tools/stage-5/measurement-space/square-sum-chain/",
              note: "Arrange 1–15 so every pair of neighbours adds to a square number. Free workspace with joins, pen and shared rooms.",
              tags: ["interactive","networks","paths","problem solving"]
            }
          ]
        }
      ]
    },

    /* ---------- Statistics and Probability ---------- */
    {
      slug: "data-analysis",
      name: "Data Analysis",
      strand: "statistics-probability",
      icon: "📊",
      collates: "Data analysis A, B, C (Path)",
      blurb: "Summary statistics, graphical comparison, bivariate data and statistical inquiry.",
      outcomes: [
        {
          code: "MA5-DAT-C-01",
          path: "Core",
          focusArea: "Data analysis A",
          statement: "compares and analyses datasets using summary statistics and graphical representations",
          resources: []
        },
        {
          code: "MA5-DAT-C-02",
          path: "Core",
          focusArea: "Data analysis B",
          statement: "displays and interprets datasets involving bivariate data",
          resources: []
        },
        {
          code: "MA5-DAT-P-01",
          path: "Path",
          pathway: "Stn, Adv",
          focusArea: "Data analysis C",
          statement: "plans, conducts and reviews a statistical inquiry into a question of interest",
          resources: []
        }
      ]
    },
    {
      slug: "probability",
      name: "Probability",
      strand: "statistics-probability",
      icon: "🎲",
      collates: "Probability A, B (Path)",
      blurb: "Multistage chance experiments, simulations, Venn diagrams and conditional probability.",
      outcomes: [
        {
          code: "MA5-PRO-C-01",
          path: "Core",
          focusArea: "Probability A",
          statement: "solves problems involving probabilities in multistage chance experiments and simulations",
          resources: []
        },
        {
          code: "MA5-PRO-P-01",
          path: "Path",
          pathway: "Adv",
          focusArea: "Probability B",
          statement: "solves problems involving Venn diagrams, 2-way tables and conditional probability",
          resources: []
        }
      ]
    }
  ]
};
