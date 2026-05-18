---
'@unpunnyfuns/swatchbook-core': patch
---

Tighten `isAxisComboConnected` to require a single connected component over the induced subgraph (BFS from `combo[0]`) instead of "every axis has ≥1 in-combo partner." The prior heuristic accepted combos spanning two disjoint sub-clusters when each sub-cluster was internally connected — such combos can't produce a joint divergence, since the cross-cluster cartesian is the independent product of two unrelated value sets.

Pair-arity (arity 2) is unchanged. Higher-arity culling tightens on configs with multiple disjoint clusters; configs that form a single big cluster see no change. Correctness preserved: the new test is strictly more selective than the old, never the other direction.
