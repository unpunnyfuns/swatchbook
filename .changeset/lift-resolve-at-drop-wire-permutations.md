---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-switcher": minor
"@unpunnyfuns/swatchbook-mcp": minor
"@unpunnyfuns/swatchbook-integrations": minor
---

`@unpunnyfuns/swatchbook-addon`, `@unpunnyfuns/swatchbook-blocks`: lift `resolveAt` to the preview decorator (built once per iframe at module load over the stable virtual exports) and ship it through `SwatchbookContext`. Blocks read `snapshot.resolveAt` directly — no more memo gymnastics. Closes #793.

Drops the wire-shipped `permutations`, `permutationsResolved`, and `defaultPermutation` from the virtual module + HMR snapshot + `InitPayload` + per-package `virtual.d.ts`. The block-side `ProjectSnapshot` keeps them as optional fields for hand-built test snapshots and legacy MDX consumers (the `snapshotResolveAt` fallback path still indexes them when `cells` is absent).

Migrates the three remaining addon-side consumers that previously read `Project.permutationsResolved` directly:
- `preset.ts` (codegen): iterates `project.varianceByPath.keys()` for token paths.
- `virtual/plugin.ts` (HMR reload log): counts from `project.varianceByPath.size`.
- `useToken` hook: reads the snapshot's `resolveAt` (or a module-level `fallbackResolveAt` built from the virtual exports when no provider is mounted).

`Project.permutations` and `Project.permutationsResolved` still exist on the core type — the loadProject rewrite that drops them follows in the next PR.
