---
"@unpunnyfuns/swatchbook-core": patch
"@unpunnyfuns/swatchbook-addon": patch
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-switcher": patch
"@unpunnyfuns/swatchbook-mcp": patch
"@unpunnyfuns/swatchbook-integrations": patch
---

Internal migration. Core's own consumers of `Project.permutations` / `permutationsResolved` now route through abstractions that are upstream of the singleton enumeration:

- **`buildCells`** takes a `resolveTuple: (tuple) => TokenMap` callback. Resolver-backed projects pass `resolver.apply` directly (no scan of the singleton enumeration); layered / plain-parse projects pass a lookup over the loader's per-tuple parse output. Drops the `findPermByTuple` helper and the dependence on `Permutation[]` + `Record<string, TokenMap>` inputs.
- **`validateChrome`** takes a `ReadonlySet<string>` of token IDs instead of iterating `permutationsResolved` itself. `loadProject` computes the set from `varianceByPath.keys()` (same union of every path that appears in any theme, by construction).
- **`load.ts`** wires both new signatures; `validateChrome` now runs after `varianceByPath` is built so the token-ID set is ready. Order-only change; chrome diagnostics still land in the same `Project.diagnostics` order.

Part 2 of 3 for #815. With this PR, the only remaining `permutationsResolved` reads in core live in `load.ts` itself (the legacy `Project.permutationsResolved` field is still populated for `Project.graph` and the snapshot fallback in `blocks/use-project.ts`). Field removals + public-API exits land in Part 3, blocked on #842 (migrating blocks test snapshots off the legacy fallback).
