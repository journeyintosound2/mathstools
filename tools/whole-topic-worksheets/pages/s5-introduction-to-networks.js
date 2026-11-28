/* Introduction to Networks — MA5-NET-P-01 (Path). BUILT by stage5.py: types from the Revision Generator Stage 5
   banks, mapped to this outcome's content statements. Basic = the first steps of each
   statement; Expected = the whole outcome. */
const T = (gen, lv, id, label, stmt) => RG.type(gen, lv, id, label, stmt);
WSF.page({
  topic: "Introduction to Networks", outcome: 'MA5-NET-P-01', langKey: 'mmt-s5-introduction-to-networks-ws-lang', bank: false, noLanguage: true,
  defaultCount: 12, statements: STATEMENTS,
  paperTypes: [
  T(G_INTRODUCTION_TO_NETWORKS, 'basic', 'network-definition', "Network, graph, vertex and edge definitions", 'graphs-networks'),
  T(G_INTRODUCTION_TO_NETWORKS, 'basic', 'vertices-edges-degree', "Identify vertices, edges and degree", 'graphs-networks'),
  T(G_INTRODUCTION_TO_NETWORKS, 'basic', 'sum-of-degrees', "Sum of degrees and number of edges", 'graphs-networks'),
  T(G_INTRODUCTION_TO_NETWORKS, 'basic', 'real-world-applications', "Real-world applications of networks", 'graphs-networks'),
  T(G_INTRODUCTION_TO_NETWORKS, 'basic', 'network-from-table', "Draw a network from a table", 'graphs-networks'),
  T(G_INTRODUCTION_TO_NETWORKS, 'basic', 'planar-and-non-planar', "Planar and non-planar graphs", 'planar-euler'),
  T(G_INTRODUCTION_TO_NETWORKS, 'basic', 'faces-and-euler-formula', "Faces and Euler’s formula", 'planar-euler'),
  T(G_INTRODUCTION_TO_NETWORKS, 'basic', 'connected-walk-trail-path-cycle', "Connected graphs, walks, trails, paths and cycles", 'eulerian'),
  T(G_INTRODUCTION_TO_NETWORKS, 'basic', 'eulerian-trails-circuits', "Eulerian trails and circuits", 'eulerian'),
  T(G_INTRODUCTION_TO_NETWORKS, 'basic', 'konigsberg-bridges', "Königsberg bridges problem", 'eulerian'),
  T(G_INTRODUCTION_TO_NETWORKS, 'expected', 'network-definition', "Network, graph, vertex and edge definitions", 'graphs-networks'),
  T(G_INTRODUCTION_TO_NETWORKS, 'expected', 'vertices-edges-degree', "Identify vertices, edges and degree", 'graphs-networks'),
  T(G_INTRODUCTION_TO_NETWORKS, 'expected', 'sum-of-degrees', "Sum of degrees and number of edges", 'graphs-networks'),
  T(G_INTRODUCTION_TO_NETWORKS, 'expected', 'real-world-applications', "Real-world applications of networks", 'graphs-networks'),
  T(G_INTRODUCTION_TO_NETWORKS, 'expected', 'network-from-table', "Draw a network from a table", 'graphs-networks'),
  T(G_INTRODUCTION_TO_NETWORKS, 'expected', 'same-graph-different-drawings', "Same graph drawn in different ways", 'graphs-networks'),
  T(G_INTRODUCTION_TO_NETWORKS, 'expected', 'weighted-route-length', "Length of a route in a weighted network", 'graphs-networks'),
  T(G_INTRODUCTION_TO_NETWORKS, 'expected', 'weighted-shortest-path', "Shortest path in a weighted network", 'graphs-networks'),
  T(G_INTRODUCTION_TO_NETWORKS, 'expected', 'planar-and-non-planar', "Planar and non-planar graphs", 'planar-euler'),
  T(G_INTRODUCTION_TO_NETWORKS, 'expected', 'faces-and-euler-formula', "Faces and Euler’s formula", 'planar-euler'),
  T(G_INTRODUCTION_TO_NETWORKS, 'expected', 'connected-walk-trail-path-cycle', "Connected graphs, walks, trails, paths and cycles", 'eulerian'),
  T(G_INTRODUCTION_TO_NETWORKS, 'expected', 'eulerian-trails-circuits', "Eulerian trails and circuits", 'eulerian'),
  T(G_INTRODUCTION_TO_NETWORKS, 'expected', 'konigsberg-bridges', "Königsberg bridges problem", 'eulerian')
  ]
});
