# `feat/token-graph` — branch status

Long-lived feature branch implementing the **token-graph redesign**: replacing `Project.cells + Project.jointOverrides + Project.varianceByPath` with a single walkable `Project.tokenGraph`. The 15M `resolver.apply` workload that triggered the redesign now resolves structurally with bounded apply calls at build time.

## Branch policy

- **No PR-to-main until Phase 7.** This file is the read-once orientation for anyone fetching the branch.
- Shared utilities (`value-key.ts`, etc.) may be modified directly — the branch is purposely heading toward the new architecture, not living alongside the old in any preservationist sense.
- Format / lint sweeps that ride along with task commits are accepted as natural maintenance.
- Spec + implementation plan are **local-only** (gitignored under `docs/superpowers/`). If you need them, look in the originating session or ask the maintainer for a copy.

## Phase tracker

| Phase | Status | Notes |
|---|---|---|
| 0 | ✅ done | Branch created from `main` (c6df619) |
| 1 | ✅ done | `packages/core/src/token-graph/` module: builder, walker, queries, diagnostics, `/graph` subpath. Cross-validated against `resolver.apply` for the entire reference-fixture cartesian. Wired into `loadProject` alongside legacy fields. (range: c6df619..2a4274b) |
| 2 | ✅ done | `snapshot-for-wire`, addon virtual module, blocks React context all expose `tokenGraph` (commits 513baa1, 7df5da0, 6b7db4e). |
| 3 | ✅ done | Migrated `packages/blocks/src/internal/use-project.ts` + `channel-tokens.ts` + addon `preview.tsx` to back `resolveAt` and `varianceByPath` from `tokenGraph`. Block components were unchanged (they go through `useProject()`). Single commit (`9c5a9d6`) covered the work; the plan's per-block decomposition collapsed because the audit showed no block reads legacy fields directly. |
| 4 | ✅ done | Smart emitter (`css-axis-projected.ts`, commit `0ef47bb`) + MCP `get_axis_variance` (commit `ce8bdfd`) both switched to graph walks. CSS snapshot byte-for-byte preserved. MCP wire shape unchanged. |
| 5 | ✅ done | Synthetic baselines captured (no real-consumer fixture available). `bench/token-graph.bench.ts` + `bench/compare-legacy.ts` + `test:bench` script added. |
| 6 | ✅ done | Added `resolveAliasAt` (commit `90627bd`); dropped legacy `resolveAt` from emitter + load.ts (`f06380a`); extended graph builder to layered/plain-parse projects (`64305f5`); deletion sweep removed cells/joint-overrides/alias-graph/resolve-at/variance-by-path (`bd06d44`); inlined variance classification into the emitter (`a726f01`). All `Project.cells`/`.jointOverrides`/`.varianceByPath` fields removed from public type. |
| 7 | ⏳ in progress | Sync with main, changeset, docs-site updates, open PR. |

## Last completed task

**Phase 6** — Legacy resolution code deleted (commits `90627bd`, `f06380a`, `64305f5`, `bd06d44`, `a726f01`). All `Project.cells`/`.jointOverrides`/`.varianceByPath` fields removed; `cells.ts`, `joint-overrides.ts`, `alias-graph.ts`, `resolve-at.ts`, `variance-by-path.ts`, `variance-analysis.ts`, `compare-legacy.ts` bench, cartesian-truth test deleted. Variance classification for the smart emitter inlined as file-local helpers in `css-axis-projected.ts`. All 11 packages pass tests, lint, typecheck, and build.

## Next up

**Phase 7 — PR to main.** Sync `feat/token-graph` with `origin/main` (merge in if any non-trivial drift), write the changeset (minor bump per pre-1.0 semver, all six published packages), update `apps/docs/docs/reference/model/` to describe the new graph and remove cells/joint-overrides pages, open the PR.

## In-flight decisions / notes

- `valueKey` was updated in Phase 1 (commit `03bb7b9`) to sort object keys recursively. This was originally framed as a violation of "alongside existing code" but was clarified as in-scope for long-lived feature branches.
- `tsdown.config.ts` doesn't exist in `packages/core`; the build is driven by `scripts.build` CLI invocation in `package.json`. New entrypoints (`/graph` was the first) are added there.
- `Project.tokenGraph` for layered/plain-parse projects (no resolver) is an empty graph; only resolver-backed projects build a real one. Phase 5+ may revisit if layered projects need walker support.
- **Phase 6 blocker (alias provenance) resolved:** `resolveAliasAt`/`resolveAliasAllAt` added in commit `90627bd`. The CSS emitter calls `resolveAliasAllAt(graph, tuple)` to get tokens with `aliasOf`/`partialAliasOf` preserved for `var(--…)` emission.
- `.prettierignore` files added at repo root and `packages/core/` to exclude `__snapshots__/` directories from oxfmt — the format sweep in commit `4a51e57` had quietly corrupted the golden CSS snapshot, hiding for nearly a phase.
- CI bench gate (closes #995): `test:bench` task runs in CI for execution-time visibility, catches build-breaking regressions in the bench file itself, and surfaces gross runtime regressions via the 5-minute timeout. A numeric-threshold gate (`resolveAt` < 10 µs, etc.) is deferred — vitest's bench mode doesn't expose a clean `expect`-style assertion API, so threshold checks would require a custom comparator script.

## File index

Files added or substantially changed by this branch (cumulative through current phase):

- `packages/core/src/token-graph/types.ts` — `TokenGraph`, `TokenGraphNode`, `WriteValue`
- `packages/core/src/token-graph/build.ts` — `buildTokenGraph`, `extractWritesFromModifiers`, `computeAffectedBy`, `computeAliasTargets`
- `packages/core/src/token-graph/walk.ts` — `resolveAt`, `resolveAllAt`, `resolveAliasAt`, `resolveAliasAllAt`
- `packages/core/src/token-graph/queries.ts` — `getVariance`, `getAffectedBy`, `listPaths`
- `packages/core/src/token-graph/diagnostics.ts` — `swatchbook/token-graph` diagnostic builders
- `packages/core/src/token-graph/index.ts` — `/graph` subpath barrel
- `packages/core/src/types.ts` — added `tokenGraph: TokenGraph` field on `Project`
- `packages/core/src/load.ts` — calls `buildTokenGraph`, attaches result to `Project`
- `packages/core/src/value-key.ts` — sorted-key replacer for canonical comparison
- `packages/core/package.json` — `./graph` export entry + tsdown entrypoint
- `packages/core/test/token-graph/{build,walk,queries,cycle}.test.ts` — 36 tests
- `packages/core/test/_helpers.ts` — `loadReferenceFixtureParserInput` helper
- `packages/core/bench/token-graph.bench.ts` — Phase 5 benchmarks (buildTokenGraph, resolveAt, resolveAllAt, getVariance)

## Phase 5 baselines (synthetic only — no real-consumer fixture)

Reference fixture (3 axes × small context counts × ~150 paths). vitest bench v4.1.4 / tinybench v2.9.0 / Node v24.15.0.

| Operation | Mean (µs) | Notes |
|---|---|---|
| `buildTokenGraph` (full build) | 32,358 µs (32.4 ms) | includes normalizePermutations parse cost |
| `resolveAt` — constant path / default tuple | 0.5 µs | constant fast-path (affectedBy.length === 0) |
| `resolveAt` — varying path / default tuple | 0.5 µs | default-tuple early-exit fast-path |
| `resolveAt` — varying path / single-axis non-default | 3.5 µs | one axis write lookup |
| `resolveAt` — varying path / joint tuple (mode + brand) | 3.4 µs | two-axis write ordering |
| `resolveAllAt` — default tuple | 54 µs | all paths, default tuple |
| `resolveAllAt` — single-axis non-default (mode) | 72 µs | all paths, one non-default axis |
| `getVariance` — constant path | 7 µs | perAxis loop, no writes |
| `getVariance` — multi-axis varying path | 17 µs | perAxis loop with write scan |

Comparison (one-shot script, 10 runs, median):

| Path | Median |
|---|---|
| Legacy (`buildCells` + `probeJointOverrides` + `buildVarianceByPath`) | 3.24 ms |
| New (`buildTokenGraph`) | 0.39 ms |
| Ratio (legacy / new) | **8.24×** |

Note: `probeJointOverrides` on the reference fixture makes a small number of `resolver.apply` calls (the fixture has limited joint divergence). The 15M-apply workload that triggered the redesign is not represented here — these are synthetic baselines for future regression-tracking, not satisfying the spec's "≥5× speedup on real consumer workload" gate. When real-consumer data arrives, re-run `vitest bench --run` against the new fixture; compare numbers to the synthetic baselines above for a regression check.
