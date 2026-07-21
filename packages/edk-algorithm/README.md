# edk-algorithm

Intended modules:

- `edk.algorithm.graph`
- `edk.algorithm.search`
- `edk.algorithm.sort`
- `edk.algorithm.matching`
- `edk.algorithm.scheduling`
- `edk.algorithm.ranking`
- `edk.algorithm.diff`
- `edk.algorithm.text`
- `edk.algorithm.stats`
- `edk.algorithm.pure.priority_queue`
- `edk.algorithm.pure.disjoint_set`
- `edk.algorithm.pure.heap`
- `edk.algorithm.pure.matrix`
- `edk.algorithm.pure.string_match`
- `edk.algorithm.testsupport.generators`

Current implementation status:

- pure Etas reference implementations have been added for graph traversal,
  bounded search, stable integer sorting, ranking, scheduling, matching, diff,
  statistics, deterministic collection helpers, matrix helpers, string matching,
  deterministic test generators, and small text/number helpers;
- topological sort uses an explicit smallest-node tie-break when multiple
  zero-indegree nodes are available, and reports cycles through `acyclic=false`;
- strongly connected component discovery returns components in deterministic
  smallest-node order with each component's nodes sorted by node ID, and rejects
  invalid directed graphs with an empty component set until EDK-owned typed errors
  are available;
- weighted shortest-path results expose explicit status strings for `ok`,
  `no_path`, `invalid_graph`, and `invalid_weight` while typed algorithm errors
  remain blocked by the current frontend/std error substrate;
- bounded breadth-first search exposes explicit `ok`, `no_path`,
  `invalid_graph`, `invalid_limit`, and `limit_exceeded` statuses so search
  limits remain testable without hidden runtime behavior;
- dependency scheduling uses declared task IDs rather than array positions,
  rejects duplicate or missing dependency tasks, reports cycles through
  `feasible=false`, and uses the smallest ready task ID as a deterministic
  tie-break;
- edge-list matching uses deterministic `(left, right)` edge ordering,
  augmenting-path rematching, and left-sorted output pairs for its concrete pure
  helper surface;
- integer diff uses dynamic-programming edit distance and deterministic edit
  reconstruction, preferring delete, then insert, then replace when multiple
  minimal scripts have the same cost;
- `edk.algorithm.package_smoke` is a non-public package tooling entry used to
  let the current package metadata command check this library package without
  hand-written metadata;
- the public surface is intentionally conservative where current Etas package
  metadata cannot yet express the full generic callback/effect contracts from
  `docs/architect/package-implementation-design.md`;
- callback-based APIs from the architecture remain pending rather than being
  represented by pure or narrower fallback flows; specifically, helpers in this
  package do not implement or substitute for `a_star`, `rank`,
  `stable_sort_by`, callback-based matching, visitor traversal, or other APIs
  that must preserve callback latent effects in public metadata;
- no host binding, default handler, or fallback runtime path is used by this
  package.
