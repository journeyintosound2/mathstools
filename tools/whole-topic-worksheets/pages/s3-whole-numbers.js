/* Represents Numbers: Whole Numbers and Integers — MA3-RN-01. BUILT by stage3.py: types from the Revision Generator Stage 3
   banks, mapped to this outcome's content statements. Part A types appear
   in both papers; Part B types only in "Parts A and B". */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Represents Numbers: Whole Numbers and Integers", outcome: 'MA3-RN-01', langKey: 'mmt-s3-whole-numbers-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  levelNames: { basic: 'Part A', expected: "Parts A and B" },
  paperTypes: [
  T(G_RN, 'basic', 'read-millions', "Read and write numbers in the millions", 'millions'),
  T(G_RN, 'basic', 'order-millions', "Order numbers in the millions", 'millions'),
  T(G_RN, 'basic', 'place-value-large', "Place value of a digit", 'millions'),
  T(G_RN, 'basic', 'round-large', "Round to a given place value", 'millions'),
  T(G_RN, 'basic', 'regroup-thousands', "Regroup thousands, millions and billions", 'partition-billion'),
  T(G_RN, 'basic', 'partition-nonstandard', "Partition numbers in non-standard forms", 'partition-billion'),
  T(G_RN, 'expected', 'read-millions', "Read and write numbers in the millions", 'millions'),
  T(G_RN, 'expected', 'order-millions', "Order numbers in the millions", 'millions'),
  T(G_RN, 'expected', 'place-value-large', "Place value of a digit", 'millions'),
  T(G_RN, 'expected', 'round-large', "Round to a given place value", 'millions'),
  T(G_RN, 'expected', 'regroup-thousands', "Regroup thousands, millions and billions", 'partition-billion'),
  T(G_RN, 'expected', 'partition-nonstandard', "Partition numbers in non-standard forms", 'partition-billion'),
  T(G_RN, 'expected', 'integer-number-line', "Integers on a number line", 'integers'),
  T(G_RN, 'expected', 'thermometer-negative', "Negative temperatures on a thermometer", 'integers')
  ]
});
