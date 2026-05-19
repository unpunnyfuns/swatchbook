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
| 2 | ⏳ in progress | Snapshot/wire-payload swap: `snapshot-for-wire.ts`, addon virtual module, blocks React context expose `tokenGraph`. |
| 3 | pending | Block migrations one-by-one (TokenTable, ColorTable, TokenDetail, AxisVariance, TokenNavigator). |
| 4 | pending | Smart emitter (`css-axis-projected.ts`) + MCP `get_axis_variance` switch to graph walks. CSS byte-for-byte regression gate. |
| 5 | pending | Bench against real-consumer workload. **Gate**: build < 200ms, resolveAt < 1ms/call, ≥5× faster loadProject startup. STOP if gate fails. |
| 6 | pending | Delete `cells.ts`, `joint-overrides.ts`, `alias-graph.ts`, `resolve-at.ts`, `variance-by-path.ts`, `variance-analysis.ts`; remove legacy fields from `Project`. |
| 7 | pending | Sync with main, changeset, docs-site updates, open PR. |

## Last completed task

**Task 1.12** — Bench file stub (commit `2a4274b`). Phase 1 closed out.

## Next up

**Task 2.1** — Add `tokenGraph` to `snapshot-for-wire.ts`'s wire payload alongside existing fields. Test that the serialized graph is JSON-roundtrip safe.

## In-flight decisions / notes

- `valueKey` was updated in Phase 1 (commit `03bb7b9`) to sort object keys recursively. This was originally framed as a violation of "alongside existing code" but was clarified as in-scope for long-lived feature branches.
- `tsdown.config.ts` doesn't exist in `packages/core`; the build is driven by `scripts.build` CLI invocation in `package.json`. New entrypoints (`/graph` was the first) are added there.
- `Project.tokenGraph` for layered/plain-parse projects (no resolver) is an empty graph; only resolver-backed projects build a real one. Phase 5+ may revisit if layered projects need walker support.

## File index

Files added or substantially changed by this branch (cumulative through current phase):

- `packages/core/src/token-graph/types.ts` — `TokenGraph`, `TokenGraphNode`, `WriteValue`
- `packages/core/src/token-graph/build.ts` — `buildTokenGraph`, `extractWritesFromModifiers`, `computeAffectedBy`, `computeAliasTargets`
- `packages/core/src/token-graph/walk.ts` — `resolveAt`, `resolveAllAt`, `composePartial`
- `packages/core/src/token-graph/queries.ts` — `getVariance`, `getAffectedBy`, `listPaths`
- `packages/core/src/token-graph/diagnostics.ts` — `swatchbook/token-graph` diagnostic builders
- `packages/core/src/token-graph/index.ts` — `/graph` subpath barrel
- `packages/core/src/types.ts` — added `tokenGraph: TokenGraph` field on `Project`
- `packages/core/src/load.ts` — calls `buildTokenGraph`, attaches result to `Project`
- `packages/core/src/value-key.ts` — sorted-key replacer for canonical comparison
- `packages/core/package.json` — `./graph` export entry + tsdown entrypoint
- `packages/core/test/token-graph/{build,walk,queries,cycle,cartesian-truth}.test.ts` — 36 tests
- `packages/core/test/_helpers.ts` — `loadReferenceFixtureParserInput` helper
- `packages/core/bench/token-graph.bench.ts` — Phase 5 placeholder
