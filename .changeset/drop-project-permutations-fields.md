---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-switcher": patch
"@unpunnyfuns/swatchbook-mcp": patch
"@unpunnyfuns/swatchbook-integrations": patch
---

Closes #815. The cartesian-era `Project.permutations` / `Project.permutationsResolved` fields exit `@unpunnyfuns/swatchbook-core`'s public surface entirely, along with the `Permutation` type and the `permutationID()` function (both kept internal to the loader for now). `Project.graph` renamed to `Project.defaultTokens` for accuracy — it's the resolved TokenMap at the default tuple, not a reference graph.

### Removed (pre-1.0 minor bump)

- `Project.permutations: Permutation[]`
- `Project.permutationsResolved: Record<string, TokenMap>`
- `Project.graph` (renamed to `Project.defaultTokens`)
- `Permutation` type export from the `core` barrel
- `permutationID()` function export from the `core` barrel
- `@unpunnyfuns/swatchbook-blocks`: `ProjectSnapshot.permutations` + `ProjectSnapshot.permutationsResolved` + `VirtualPermutation` / `VirtualPermutationShape` types

### Added / changed

- `Project.disabledAxes` and `Project.presets` are now `readonly` arrays.
- `Project.defaultTokens: TokenMap` (replaces `Project.graph`).
- `@unpunnyfuns/swatchbook-blocks` test fixtures (`packages/blocks/test/*`) now declare the `cells` / `jointOverrides` / `defaultTuple` shape directly. The interim `withCellsShape` helper introduced in #844 is deleted; the legacy `snapshotResolveAt` fallback in `use-project.ts` (which already lost its `permutationsResolved` branch in #844) is unchanged.

### Migration

```ts
// before
project.permutations.find((p) => p.name === name);
project.permutationsResolved['Dark · Brand A']?.['color.accent.bg'];
project.graph;

// after
project.resolveAt({ mode: 'Dark', brand: 'Brand A' })['color.accent.bg'];
project.defaultTokens;
// theme names synthesized when needed: `axisValues.join(' · ')`
```

`emit-via-terrazzo`'s `selection: 'permutations'` (default) derives the singleton set from `axes + presets + defaultTuple` directly — same set the resolver loader produces, no `Project.permutations` dependency.

`@unpunnyfuns/swatchbook-mcp`: tool I/O unchanged. The CLI's reload log derives `themeCount` from axis cardinality.

`@unpunnyfuns/swatchbook-integrations`: `tailwind` reads `project.defaultTokens` (was `project.graph`).
