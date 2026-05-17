---
"@unpunnyfuns/swatchbook-blocks": patch
---

Internal. Blocks test fixtures now provide `cells` / `jointOverrides` / `defaultTuple` via a new `withCellsShape` test helper (`packages/blocks/test/_snapshot-utils.ts`), derived from the existing `axes` + `permutationsResolved` ergonomics so individual fixture authoring stays unchanged.

`snapshotResolveAt` in `packages/blocks/src/internal/use-project.ts` drops the legacy `permutationsResolved`-only fallback that existed for pre-migration hand-built snapshots. Snapshots now must provide `cells` (or a `resolveAt` accessor) — `withCellsShape` covers the common test case; production preview snapshots already provide both via the addon's wire format.

Unblocks #815 Part 3 (the actual `Project.permutationsResolved` field removal).
