---
"@unpunnyfuns/swatchbook-core": patch
---

Closes #822. Adds direct unit tests for `probeJointOverrides` in `packages/core/test/probe-joint-overrides.test.ts` covering every algorithmic branch with synthetic minimal `axes / cells / resolver` inputs: the `axes.length < 2` early-return, the resolver-undefined early-return, arity-2 override capture, the `cellB[path] ?? baseline[path]` baseline-fallback (touching detection through a delta cell that omits a path), arity-3+ conservative touching marking, and canonical-key dedupe (axes lexicographically sorted regardless of declared order).

Also extends `packages/core/test/joint-overrides.test.ts` (the fixture-based suite) with two new invariants: the reference fixture produces at least one arity-3 override entry (pins that the arity-3 loop has real-data coverage — the audit's "dead in tests" claim was actually wrong, the fixture's `{Brand A, High, Dark}` triple exists), and an axis appears in `varianceByPath.varyingAxes` even when its singleton cell matches baseline (variance surfaces via the joint probe). No source changes.
