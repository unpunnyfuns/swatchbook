---
'@unpunnyfuns/swatchbook-core': patch
---

Docs-site policy change: keep one stable snapshot + current `docs/` tree, not a per-minor archive.

- Remove the eight pre-0.57 versioned snapshots (`version-0.20`, `version-0.50` through `version-0.56`) from `apps/docs/`. They were stale and increasingly misleading — covering the cartesian-materialization era, the `Permutation` vocabulary, `Project.parserInput`, `projectCss` / `permutationsResolved` accessors, and other surface that no longer exists.
- Update `scripts/snapshot-docs-version.mjs` to drop every prior `version-*/` dir + sidebar + reset `versions.json` to `[]` before writing the current release's snapshot. Steady state after every future release: one stable snapshot on `/`, current `docs/` on `/next/`.

Pre-1.0 the per-minor frozen snapshots accumulate faster than they stay accurate, and the staleness compounds with every API change. Route everyone to current docs instead.

Patch bump per the docs-snapshot policy so the v0.57 snapshot rebuilds and the nuke takes effect on `/`.
