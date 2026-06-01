# @unpunnyfuns/swatchbook-integrations

## 0.61.0

### Minor Changes

- 84b450c: Public API renames for clarity. Breaking, clean break (no deprecated aliases).

  **blocks**

  - `FontFamilySample` → `FontFamilyPreview`, `StrokeStyleSample` → `StrokeStylePreview`. Both render the whole matching collection, like the rest of the `*Preview` family; the `*Sample` names implied a single token.
  - `DimensionKind` → `DimensionVisual`, and its `kind` prop → `visual` (it selects the visualization style, distinct from the type discriminators elsewhere called `kind`).
  - Removed the unused `presets` / `disabledAxes` fields from `ProjectSnapshot`.

  **addon**

  - Per-story `parameters.swatchbook.permutation` → `themeName` (it holds a composed theme-name string, not a permutation).
  - Removed the dead `parameters.swatchbook.theme` alias and the dead `swatchbookTheme` global — neither was read or written.
  - `SwatchbookPluginOptions` → `SwatchbookTokensPluginOptions`.
  - Removed the unused `PARAM_KEY` export.

  **mcp**

  - The `get_color_contrast` tool's output field `ratio` → `value` (in the APCA branch it carries a signed Lc score, not a ratio).

  **core**

  - Removed the unused `Diagnostic.column` field.

  Migration: rename the imports, props, and parameters above. `switcher` and `integrations` have no API changes but version with the fixed group.

### Patch Changes

- Updated dependencies [84b450c]
  - @unpunnyfuns/swatchbook-core@0.61.0

## 0.60.10

### Patch Changes

- deecf14: Tighten the "Built with AI" docs prose: drop the self-narrating opening ("This page says plainly…"), shorten "Claude, Anthropic's coding agent" to "Claude", and add one dry aside. Patch so the next release's snapshot rebuild carries it to the stable docs.
- Updated dependencies [deecf14]
  - @unpunnyfuns/swatchbook-core@0.60.10

## 0.60.9

### Patch Changes

- a639114: Add a "Built with AI" disclosure to the docs. A short block on the Introduction page states plainly that nearly all of swatchbook's code is written by an AI coding agent under human direction, and a new `developers/built-with-ai.mdx` page lays out who does what, what a human gates (every merge, every release), the quality machinery, and where the effort goes. Patch so the next release's snapshot rebuild picks it up.
- Updated dependencies [a639114]
  - @unpunnyfuns/swatchbook-core@0.60.9

## 0.60.8

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.60.8

## 0.60.7

### Patch Changes

- fb5e8ae: The release workflow's `release` environment now gates only on publish runs (the Version Packages PR's squash-merge), not on every push to main. Previously every changeset-PR merge would pause for approval even though no publish was about to happen — the action would just open a VP PR. Now the gate fires only when `github.event.head_commit.message` starts with `chore(release):` — i.e., the VP PR was just merged and `changeset publish` is about to run. Routine pushes proceed unattended. Documented in `developers/sharp-corners.mdx`. No published-package behaviour change.
- dd8608d: Internal release: ships the security-infrastructure documentation added in #1044 into the current minor's docs snapshot. No published-package behaviour change. The recent CI hardening landed across #1042 (pin GitHub Actions to commit SHAs + add zizmor workflow audit), #1043 (disable Actions cache during release for cache-poisoning defense), #1044 (gate release on deployment environment with required approval), and #1046 (fix template-injection findings in mirror-playwright). The release-approval gate is documented under `developers/sharp-corners.mdx`.
- Updated dependencies [fb5e8ae]
- Updated dependencies [dd8608d]
  - @unpunnyfuns/swatchbook-core@0.60.7

## 0.60.6

### Patch Changes

- 619b7b8: Expose `Config.maxJointArity` (default `4`) to override the cap on per-token joint-divergence arity probing. The default covers the largest joint shapes real-world design systems tend to express. Consumers with richer multi-axis systems can bump it for tokens that genuinely diverge across 5+ axes simultaneously; consumers with load-time concerns can lower it (1 disables joint-block emission entirely). Documented in `reference/config.mdx` with the per-token work formula and the failure-mode tradeoffs in both directions.
- 95ddfa3: The addon's Vite plugin now excludes its virtual module IDs (`virtual:swatchbook/tokens`, `virtual:swatchbook/integration-side-effects`) from Vite's `optimizeDeps` pre-bundling. Vite uses esbuild for pre-bundling, and esbuild doesn't see Rollup-style `resolveId` hooks — a preview file that gets pulled into pre-bundling and imports one of our virtuals would fail with `Could not resolve "virtual:swatchbook/tokens"`. The exclusion routes the virtuals through the dev-time plugin pipeline where `resolveId` / `load` handle them. Build mode is unaffected (Rollup throughout).
- Updated dependencies [619b7b8]
- Updated dependencies [95ddfa3]
  - @unpunnyfuns/swatchbook-core@0.60.6

## 0.60.5

### Patch Changes

- 48725a8: `emitAxisProjectedCss`'s joint-block emission now scales per-token rather than as a cartesian over project axes. `analyzeProjectVariance` probes joint divergences for each token within that token's `affectedBy` set (capped at 4 axes per token), and `collectJointBlocks` consumes the resulting joint cases directly — no cartesian enumeration over the project's full axes. For a 12-axis project that previously needed ~243M outer iterations × O(tokens) inner work (consumer-reported >1h hang on 687-token projects), emission now completes in milliseconds. CSS output for the reference fixture is unchanged byte-for-byte. Joint divergences spanning 5+ axes simultaneously aren't emitted as compound blocks — the practical limit covers mode × brand × density × contrast joint shapes (the largest real-world combinations).
- Updated dependencies [48725a8]
  - @unpunnyfuns/swatchbook-core@0.60.5

## 0.60.4

### Patch Changes

- 79d6c68: Add `reference/concepts.mdx` — a single page consolidating Swatchbook's mental model in one place: the "preview host, not transformer" framing, the axes/contexts/tuples vocabulary, what the token graph conceptually represents (without walker internals), and the alignment story with a production Terrazzo build. Slots first in the Reference > Model sidebar so the reading order goes conceptual → operational (Concepts → Axes → Token pipeline → Diagnostics). Cross-linked from `intro.mdx`'s "How to read these docs". Doesn't replace any existing page; front-loads the model for new and returning readers.
- 401b4de: Add `reference/diagnostics.mdx` — a catalog of every `swatchbook/<group>` diagnostic the core can emit, with severity, trigger condition, and what to check for each known message. Also documents the structured `swatchbook: failed to transform token "<path>" at permutation <tuple>…` runtime emit-error format. Cross-linked from `reference/core.mdx` (`Project.diagnostics`), `reference/addon.mdx` (Design Tokens panel), and `intro.mdx` (How to read these docs). No package source changes; the patch changeset is so the next release's snapshot rebuild picks up the new page.
- aacc744: `loadProject` now emits phase-bounded timing to stdout when the `SWATCHBOOK_LOG_VERBOSE=1` environment variable is set. Lines look like `[swatchbook:load] graph build: 380ms`, with one entry per major phase (parse + normalize, preset apply sweep when presets are configured, token-listing build, graph build, total). When the env var is unset, behaviour is unchanged — no console output, only a few `performance.now()` calls per load (negligible overhead). Intended use: a consumer reports a hung or slow load and we need to know which phase is the offender before reaching for a full CPU profile.
- Updated dependencies [79d6c68]
- Updated dependencies [401b4de]
- Updated dependencies [aacc744]
  - @unpunnyfuns/swatchbook-core@0.60.4

## 0.60.3

### Patch Changes

- 65a7865: Substitute DTCG `$ref` objects in modifier values against the resolver's baseline output. The resolver-based loader's `extractWritesFromModifiers` was reading from `resolver.source.modifiers` directly — a pre-`processTokens` representation where cross-document `$ref` references in modifier source values (e.g. a semantic token's `components` referencing a primitive's `components` array via JSON Pointer) had not yet been resolved. The unresolved `{ $ref }` objects flowed through write values into the walker and reached emit time, where colorjs.io crashed on them. The fix performs the same JSON Pointer substitution at write-extraction time, using the already-resolved baseline as the lookup source. Unresolved pointers are left intact and continue to surface via the existing emit-time error wrap and load-time diagnostic.
- Updated dependencies [65a7865]
  - @unpunnyfuns/swatchbook-core@0.60.3

## 0.60.2

### Patch Changes

- d2c7cfb: When the color-shape validator encounters `components` carrying an unresolved DTCG `$ref` object (a plain object with a string `$ref` member), the emitted diagnostic now names the JSON Pointer and identifies the upstream parser's failure to substitute the target — rather than the generic "`components` must be an array of numbers" message, which sends consumers hunting for source-side errors when the source is usually correct. Non-`$ref` non-array components keep the existing generic message.
- Updated dependencies [d2c7cfb]
  - @unpunnyfuns/swatchbook-core@0.60.2

## 0.60.1

### Patch Changes

- c3ded5b: Patch release to ship the docs audit fixes from PR #1002 into the stable docs snapshot. The fixes (corrected import paths, removed broken anchors, jargon swapped for plain language, prose register tightened) only reached `/next/` after the original PR — this release rebuilds the `version-0.60/` snapshot so they reach `/` too. No package source changes.
- 0868ed5: When the smart emitter's call to `transformCSSValue` throws on a malformed token `$value`, the thrown error now names the token path, the active axis permutation, and the offending `$value`, with the original error attached as `cause`. Previously a malformed token surfaced as a four-frames-deep colorjs.io traceback with no clue which token was at fault. Healthy tokens are unaffected.
- 2e6352a: Validate color token `$value` shape at load time. The graph builder now walks every literal value and reports DTCG color objects whose `components` field is missing or non-array — the shape that crashes `colorjs.io` inside `inGamut(...)` with the unactionable `coords.map is not a function` traceback. Covers top-level color tokens and color sub-fields inside composites uniformly: any object whose `colorSpace` is a string is treated as a color and validated. Healthy fixtures see no new diagnostics; the validator finds problems, it doesn't create them.
- Updated dependencies [c3ded5b]
- Updated dependencies [0868ed5]
- Updated dependencies [2e6352a]
  - @unpunnyfuns/swatchbook-core@0.60.1

## 0.60.0

### Minor Changes

- 65adff6: Replace `Project.cells` + `Project.jointOverrides` + `Project.varianceByPath` with a single walkable `Project.tokenGraph`. Per-tuple resolution is now a pure graph walk; `resolver.apply` is called at most Σ(axes × non-default contexts) + 1 times at `loadProject` time, never per-tuple. On a real consumer workload that previously triggered 15M+ `resolver.apply` calls, this is the structural fix.

  **Breaking (pre-1.0, minor bump per project semver):**

  - `Project.cells`, `Project.jointOverrides`, `Project.varianceByPath` are removed. Use `Project.tokenGraph` + helpers from the new `@unpunnyfuns/swatchbook-core/graph` subpath:
    - `resolveAt(graph, path, tuple)` — resolved leaf value
    - `resolveAllAt(graph, tuple)` — full TokenMap
    - `resolveAliasAt(graph, path, tuple)` — alias-preserving view (token with `aliasOf` populated)
    - `resolveAliasAllAt(graph, tuple)` — full TokenMap with alias-preserving view
    - `getVariance(graph, path)` — same `AxisVarianceResult` shape consumers had before
    - `getAffectedBy(graph, path)` — set of axes that can change this path's value
    - `listPaths(graph)` — sorted path universe
  - `Project.resolveAt(tuple)` signature unchanged; backed by the graph walker internally.
  - `@unpunnyfuns/swatchbook-core/resolve-at` subpath is removed. Use `@unpunnyfuns/swatchbook-core/graph` — same `resolveAt`-ish helpers, but parameterised over a `TokenGraph` instead of constructed against `cells + jointOverrides`.
  - MCP `get_axis_variance` wire shape is unchanged.

  **Internal:** `cells.ts`, `joint-overrides.ts`, `alias-graph.ts`, `resolve-at.ts`, `variance-by-path.ts`, `variance-analysis.ts` are deleted. Variance classification used by the smart CSS emitter is now an unexported helper inside `css-axis-projected.ts`.

  **Performance:** synthetic baseline on the reference fixture shows `buildTokenGraph` at 0.39 ms vs `buildCells + probeJointOverrides + buildVarianceByPath` at 3.24 ms — 8.24× faster. Real-consumer workload not measured in this branch; baselines tracked in `packages/core/bench/token-graph.bench.ts` for future regression-tracking.

  Wire payload reduction: graph stores slim `SwatchbookToken` shapes (only `$value`, `$type`, `$description`, `aliasOf`, `aliasChain`, `partialAliasOf`, `aliasedBy` — strips Terrazzo's `source.node`/`mode`/`group`/etc.). Reference-fixture payload: 607 KB → 45 KB un-gzipped (13×).

### Patch Changes

- Updated dependencies [65adff6]
  - @unpunnyfuns/swatchbook-core@0.60.0

## 0.59.1

### Patch Changes

- Updated dependencies [1792d02]
- Updated dependencies [4f6073f]
- Updated dependencies [c9a401b]
- Updated dependencies [e27a20b]
  - @unpunnyfuns/swatchbook-core@0.59.1

## 0.59.0

### Patch Changes

- Updated dependencies [c270b8c]
- Updated dependencies [3e9e310]
  - @unpunnyfuns/swatchbook-core@0.59.0

## 0.58.1

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.58.1

## 0.58.0

### Patch Changes

- Updated dependencies [f73637a]
- Updated dependencies [1f65ada]
  - @unpunnyfuns/swatchbook-core@0.58.0

## 0.57.1

### Patch Changes

- Updated dependencies [0e0cc7a]
  - @unpunnyfuns/swatchbook-core@0.57.1

## 0.57.0

### Patch Changes

- 6188fa8: Enable a small batch of correctness-leaning oxlint rules — the ones without safe autofix that nudge style consistency rather than mechanical reshape.

  - `no-throw-literal` — throw `Error` (or subclass), not strings. Better stack traces; matches established codebase pattern.
  - `typescript/no-inferrable-types` — strip redundant annotations like `let x: string = 'foo'`. Lets TS do its job.
  - `typescript/consistent-type-definitions: ["error", "interface"]` — pick `interface` for object shapes; `type` stays valid for unions / intersections / primitives.

  Codebase was nearly compliant — only two pre-existing violations across the monorepo. Fixed both in the same PR.

- Updated dependencies [4bc19e8]
- Updated dependencies [f82eb5c]
- Updated dependencies [c69dec1]
- Updated dependencies [76ba600]
- Updated dependencies [6188fa8]
- Updated dependencies [3302705]
- Updated dependencies [cb161ec]
- Updated dependencies [c5d9089]
- Updated dependencies [975944d]
- Updated dependencies [4146d9f]
- Updated dependencies [55ee410]
- Updated dependencies [062276b]
  - @unpunnyfuns/swatchbook-core@0.57.0

## 0.56.0

### Patch Changes

- b8372c1: Internal migration. Core's own consumers of `Project.permutations` / `permutationsResolved` now route through abstractions that are upstream of the singleton enumeration:

  - **`buildCells`** takes a `resolveTuple: (tuple) => TokenMap` callback. Resolver-backed projects pass `resolver.apply` directly (no scan of the singleton enumeration); layered / plain-parse projects pass a lookup over the loader's per-tuple parse output. Drops the `findPermByTuple` helper and the dependence on `Permutation[]` + `Record<string, TokenMap>` inputs.
  - **`validateChrome`** takes a `ReadonlySet<string>` of token IDs instead of iterating `permutationsResolved` itself. `loadProject` computes the set from `varianceByPath.keys()` (same union of every path that appears in any theme, by construction).
  - **`load.ts`** wires both new signatures; `validateChrome` now runs after `varianceByPath` is built so the token-ID set is ready. Order-only change; chrome diagnostics still land in the same `Project.diagnostics` order.

  Part 2 of 3 for #815. With this PR, the only remaining `permutationsResolved` reads in core live in `load.ts` itself (the legacy `Project.permutationsResolved` field is still populated for `Project.graph` and the snapshot fallback in `blocks/use-project.ts`). Field removals + public-API exits land in Part 3, blocked on #842 (migrating blocks test snapshots off the legacy fallback).

- 158f2e1: `@unpunnyfuns/swatchbook-core`: legacy cartesian-era code paths deleted.

  Removed (pre-1.0 minor bump):

  - `analyzeAxisVariance()` function + its `@unpunnyfuns/swatchbook-core/variance` subpath export. Replaced by `Project.varianceByPath`, the load-time-built `ReadonlyMap<string, AxisVarianceResult>` consumed by the smart CSS emitter, the MCP `get_axis_variance` tool, and the `AxisVariance` doc block. Read `project.varianceByPath.get(path)` directly.
  - `buildJointOverrides()` shim (deprecated wrapper around `probeJointOverrides`, no non-test callers).
  - Internal `emitCss()` (the 200-line cartesian-fan-out CSS emitter) — replaced by `emitAxisProjectedCss()` in v0.54.
  - Internal `composeProjectCss()` from `@unpunnyfuns/swatchbook-addon` (`@internal` test-only re-export of `emitAxisProjectedCss`).

  Type-only kept on the barrel: `AxisVarianceResult` + `VarianceKind` (relocated from `variance.ts` into `types.ts` since they're load-bearing for `Project.varianceByPath` and the wire-format shape).

  Migration: replace `analyzeAxisVariance(path, ...)` with `project.varianceByPath.get(path)`. Replace `buildJointOverrides(...)` with `probeJointOverrides(...).overrides`.

  Docs site updated to document `project.varianceByPath` instead of the removed function.

- de4cc3d: Closes #815. The cartesian-era `Project.permutations` / `Project.permutationsResolved` fields exit `@unpunnyfuns/swatchbook-core`'s public surface entirely, along with the `Permutation` type and the `permutationID()` function (both kept internal to the loader for now). `Project.graph` renamed to `Project.defaultTokens` for accuracy — it's the resolved TokenMap at the default tuple, not a reference graph.

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
  project.permutationsResolved["Dark · Brand A"]?.["color.accent.bg"];
  project.graph;

  // after
  project.resolveAt({ mode: "Dark", brand: "Brand A" })["color.accent.bg"];
  project.defaultTokens;
  // theme names synthesized when needed: `axisValues.join(' · ')`
  ```

  `emit-via-terrazzo`'s `selection: 'permutations'` (default) derives the singleton set from `axes + presets + defaultTuple` directly — same set the resolver loader produces, no `Project.permutations` dependency.

  `@unpunnyfuns/swatchbook-mcp`: tool I/O unchanged. The CLI's reload log derives `themeCount` from axis cardinality.

  `@unpunnyfuns/swatchbook-integrations`: `tailwind` reads `project.defaultTokens` (was `project.graph`).

- 09d957f: Internal migration. Non-core read sites that iterated `Project.permutations` or indexed into `Project.permutationsResolved[name]` now route through `cells` / `resolveAt` / `varianceByPath` / `defaultTuple` instead. Theme name strings (e.g. `"Dark · Brand A"`) are synthesized from `axes + defaultTuple` at the call sites that need them, independent of the soon-to-be-removed `Project.permutations` array.

  Touched consumers:

  - `@unpunnyfuns/swatchbook-mcp` server tools (`describe_project`, `list_tokens`, `get_token`, `list_axes`, `get_alias_chain`, `get_aliased_by`, `get_color_formats`, `get_color_contrast`, `get_axis_variance`, `search_tokens`, `resolve_theme`, `get_consumer_output`) + the CLI's reload log line.
  - `@unpunnyfuns/swatchbook-integrations` css-in-js `collectPaths` (now reads `varianceByPath.keys()`).
  - `@unpunnyfuns/swatchbook-addon` preset `renderTokenTypes` (dropped the `permutationsResolved` fallback; enumerates singleton theme names from axes/presets/defaultTuple).
  - `@unpunnyfuns/swatchbook-blocks` `use-project` (dropped the legacy `nameForTuple` / `tuplesEqual` helpers; narrowed the snapshot fallback to the active-permutation path only).

  `Project.permutations` and `Project.permutationsResolved` are unchanged in this PR. Part 1 of 3 for #815 — the field removals and `Permutation`/`permutationID` exit from the public API land in subsequent PRs.

  Three vestigial MCP tests dropped (asserted a "No permutations in project." error string from guards the migrated tools no longer need; the new default-theme-name path always resolves).

- Updated dependencies [d54dd78]
- Updated dependencies [afaebb8]
- Updated dependencies [b8372c1]
- Updated dependencies [a01887f]
- Updated dependencies [40616f8]
- Updated dependencies [0def2d3]
- Updated dependencies [fe5fa59]
- Updated dependencies [a455b2b]
- Updated dependencies [a2e3971]
- Updated dependencies [158f2e1]
- Updated dependencies [444433e]
- Updated dependencies [fa3878b]
- Updated dependencies [de4cc3d]
- Updated dependencies [5cf90c2]
- Updated dependencies [5953b56]
- Updated dependencies [a7025fe]
- Updated dependencies [bd6a031]
- Updated dependencies [09d957f]
- Updated dependencies [570211b]
- Updated dependencies [1c84b01]
- Updated dependencies [fedef53]
- Updated dependencies [575ccb6]
- Updated dependencies [b1befb6]
  - @unpunnyfuns/swatchbook-core@0.56.0

## 0.55.0

### Minor Changes

- 674944b: `@unpunnyfuns/swatchbook-core`: expose `buildResolveAt` via the new `./resolve-at` subpath — a small, dep-free entry point browser-side consumers can import without dragging the loader / Terrazzo runtime through their bundles.

  `@unpunnyfuns/swatchbook-blocks`: blocks now consume `resolveAt(activeTuple)` instead of indexing `permutationsResolved[activePermutation]` for the current `resolved` token map. `ProjectData` exposes `resolveAt` so per-tuple consumers (the `AxisVariance` block's grid cells) can read any tuple's values without `permutations.find` + tuple-name scans. Snapshots that pre-date the cells wire format fall back to `permutationsResolved` indexing — covers hand-built test snapshots and the docs-site path.

- 905161d: `@unpunnyfuns/swatchbook-core`: drop `projectCss` and the supporting `packages/core/src/emit.ts` module. The smart `emitAxisProjectedCss` (default since v0.54) becomes the single emitter. Also drops the unused `emitTypes` helper (the addon's `preset.ts` has its own `renderTokenTypes`).

  `@unpunnyfuns/swatchbook-addon`: drop the `AddonOptions.emitMode` option and the `composeProjectCss` dispatch helper. With only one emitter there's no dispatch to do; the addon's plugin calls `emitAxisProjectedCss` directly.

  `@unpunnyfuns/swatchbook-mcp`: `emit_css` tool calls `emitAxisProjectedCss(project)` directly. Tool description updated to describe the smart-emit shape (`:root` baseline + per-axis singleton cells + compound joint-override blocks + chrome alias trailer).

  `apps/docs/scripts/build-tokens.mts`: switches to `emitAxisProjectedCss`.

  Pre-1.0 breaking change for consumers who explicitly imported `projectCss` from core or set `emitMode: 'cartesian'` on the addon. Production consumers were on the smart-emit default already.

- af73dc4: `@unpunnyfuns/swatchbook-addon`, `@unpunnyfuns/swatchbook-blocks`: lift `resolveAt` to the preview decorator (built once per iframe at module load over the stable virtual exports) and ship it through `SwatchbookContext`. Blocks read `snapshot.resolveAt` directly — no more memo gymnastics. Closes #793.

  Drops the wire-shipped `permutations`, `permutationsResolved`, and `defaultPermutation` from the virtual module + HMR snapshot + `InitPayload` + per-package `virtual.d.ts`. The block-side `ProjectSnapshot` keeps them as optional fields for hand-built test snapshots and legacy MDX consumers (the `snapshotResolveAt` fallback path still indexes them when `cells` is absent).

  Migrates the three remaining addon-side consumers that previously read `Project.permutationsResolved` directly:

  - `preset.ts` (codegen): iterates `project.varianceByPath.keys()` for token paths.
  - `virtual/plugin.ts` (HMR reload log): counts from `project.varianceByPath.size`.
  - `useToken` hook: reads the snapshot's `resolveAt` (or a module-level `fallbackResolveAt` built from the virtual exports when no provider is mounted).

  `Project.permutations` and `Project.permutationsResolved` still exist on the core type — the loadProject rewrite that drops them follows in the next PR.

- f09066f: `@unpunnyfuns/swatchbook-mcp`, `@unpunnyfuns/swatchbook-integrations`: server-side consumers switch from indexing `Project.permutationsResolved[name]` to calling `project.resolveAt(tuple)`. MCP builds a small `tupleByName: Map<permutationName, axisTuple>` once per project (refreshed on `setProject`) so tools that accept a `theme` name parameter map it to a tuple in O(1) before calling `resolveAt`. `get_axis_variance` drops its redundant `permutations.some` existence scan — `varianceByPath.has(path)` covers it. MCP tool inputs / outputs are unchanged. The `css-in-js` integration's `collectPaths` switches to `resolveAt(theme.input)` for the same iteration. After this PR only `loadProject` itself materializes the cartesian permutation map; the next PR drops that.
- f1cf2db: `@unpunnyfuns/swatchbook-core`: add `Project.cells`, `Project.jointOverrides`, `Project.defaultTuple`, and `Project.resolveAt(tuple)` alongside the existing cartesian shape. `cells[axisName][contextName]` holds the resolved `TokenMap` for `{ ...defaultTuple, [axisName]: contextName }` — bounded by `Σ(axes × contexts)` regardless of cartesian product size. `jointOverrides` carries the divergent partial-tuple values that cell composition cannot reconstruct on its own, populated by an exhaustive arity-ascending probe so `resolveAt(tuple)` is exactly equivalent to `permutationsResolved[permutationID(tuple)]` for every fixture tuple (covers joint variance at any order, not just pairs). Additive — no consumer migration required; foundation for the subsequent PRs that move blocks / MCP / virtual module off the cartesian map.
- d29813e: `@unpunnyfuns/swatchbook-core`: add `Project.varianceByPath` — per-token `AxisVarianceResult` cached at load time so consumers can look up which axes affect a token in O(1) instead of re-running the bucket analysis on every read. Same shape `analyzeAxisVariance` returns; populated with the existing cartesian-bucket algorithm for now (a later PR replaces the implementation with an analytical probe over `cells` when the cartesian materialization goes away). Smart-emitter Phase 2 and MCP `get_axis_variance` switch to read from the cache.
- 5178532: `@unpunnyfuns/swatchbook-addon`, `@unpunnyfuns/swatchbook-blocks`: ship `cells`, `jointOverrides`, `varianceByPath`, and `defaultTuple` over the virtual module and HMR snapshot, alongside the existing `permutationsResolved` (additive). Blocks-side `ProjectSnapshot` / `ProjectData` expose the new fields. The `AxisVariance` block drops its `analyzeAxisVariance(...)` call in favor of an O(1) `varianceByPath[path]` lookup. Other block migrations (TokenTable / TokenDetail / ColorTable reading via `resolveAt`) ship in a later PR.

### Patch Changes

- e161fdb: `@unpunnyfuns/swatchbook-blocks`: index permutations by canonical tuple key once per snapshot, exposed as `permutationNameForTuple(tuple)` on `ProjectData`. `AxisVariance`'s grid drops its per-cell `permutations.find` scans for `O(1)` `Map.get` lookups. Bounded by the permutation count regardless of how many cells render.
- 0932217: `@unpunnyfuns/swatchbook-core`: rewrite the joint-overrides build to probe via `resolver.apply` directly instead of iterating `permutationsResolved`. New `probeJointOverrides` returns two derived signals from one probe pass:

  - `overrides` — partial-tuple divergences (fed into `resolveAt` so cell composition reproduces the cartesian-correct value).
  - `jointTouching` — per-path axes that genuinely contribute to a joint divergence (separated from cell-composition artifacts; drives variance display).

  `buildVarianceByPath` now consumes `jointTouching` directly instead of deriving from `jointOverrides`, fixing the false-positive class where a non-touching axis's cell value overwrote another axis's delta and the override looked like the axis "touched" the token.

  Algorithm probes every axis-arity from 2 to N (all-orders), so joint variance at any arity is caught — bounded by `Σ_n C(axes, n) × Π contexts^n`, which is small at typical axis counts but unbounded for pathological fixtures; an arity cap is a future optimization.

  Internal-only — `loadProject` still materializes the full cartesian shape into `Project.permutations` + `Project.permutationsResolved`. The cartesian materialization drop is the next PR.

- 9de9db9: `@unpunnyfuns/swatchbook-core`: the **layered loader** now enumerates `Σ(axes × contexts)` singleton tuples — the default tuple plus one per `(axis, non-default-context)` — instead of `Π(contexts)` cartesian tuples. Symmetric with the resolver path after #810. Joint divergences are unrecoverable without a resolver, so the truth model for layered is projection composition over delta cells; `composeAt` at any multi-non-default tuple applies each axis's delta on top of the baseline in axis order.

  The `Config.maxPermutations` guard is **removed**. With singleton enumeration, the loader is intrinsically bounded by axis cardinality regardless of cartesian size — there's nothing left to guard against.

  Public API removed (pre-1.0 minor bump):

  - `Config.maxPermutations` field.
  - `cartesianSize()` export.
  - `permutationGuardDiagnostic()` export.
  - `DEFAULT_MAX_PERMUTATIONS` export.
  - The `swatchbook/permutations` warn diagnostic group.

  Migration: drop `maxPermutations` from your swatchbook config. The reference `axes.mdx` / `config.mdx` docs reflect the new scoping levers (`presets`, `disabledAxes`).

- a2f776e: `@unpunnyfuns/swatchbook-core`: `loadProject` no longer calls `resolver.listPermutations()`. The resolver-backed loader now enumerates only **singletons** — the axes-defaults tuple plus one per `(axis, non-default-context)` — so total `resolver.apply` calls are bounded by `Σ(axes × contexts)` instead of the cartesian product. Pathological resolvers (terrazzo#752: 15M tuples) load in milliseconds instead of OOMing.

  `Project.cells` now stores **delta cells** for non-default contexts: each non-default `(axis, context)` cell holds only the tokens whose value differs from the default-cell baseline. Default cells stay as full TokenMaps. Delta cells make `composeAt` correct under sparse composition — a later axis's cell can't accidentally overwrite an earlier axis's overlay on a token the later axis doesn't touch.

  `probeJointOverrides` now falls back to the baseline TokenMap when a delta cell omits a path, so the "axis A's cell alone would produce" comparison stays accurate. The CSS axis-projected emitter passes the full composed TokenMap separately for alias resolution while emitting per-axis cell deltas, so smart-dedup re-emit (the previous cascade trick) is no longer needed — joint compound `[data-axis-A][data-axis-B]` blocks handle the joint-variance cases.

  Public API removed (pre-1.0 minor bump):

  - `resolvePermutation()` export.
  - `ResolvedPermutation` type.

  `Project.permutations` and `Project.permutationsResolved` are retained for now (still keyed against the singleton enumeration); the layered loader continues to use cartesian enumeration unchanged.

  `Config.maxPermutations` is documented as **layered-only** — the resolver path is intrinsically bounded.

- e170124: `@unpunnyfuns/swatchbook-core`: smart emitter (`emitAxisProjectedCss`) and `analyzeProjectVariance` switch their Phase 1 cell construction from `findPermByTuple(permutations, …) → permutationsResolved[name]` to reading `project.cells` directly. Internal refactor only — same output for every fixture, just sourced from the bounded per-axis surface instead of the cartesian map. Phase 3 (joint case probing + lookup) still uses the resolver + `permutationsResolved`; that moves in the next PR alongside the loadProject rewrite. No public API changes.
- 83224fb: `@unpunnyfuns/swatchbook-core`: smart emitter (`emitAxisProjectedCss`) compound-block emission and `analyzeProjectVariance` Phase 3 read from `project.jointOverrides` directly. The smart emitter iterates overrides for N-arity compound selectors (pairs / triples / etc. uniformly); the variance analysis derives the legacy pair-shape `JointCase` array from the same overrides for back-compat. No more `findPermByTuple` + `permutationsResolved[jointCase.permutationName]` lookup in either path. Internal refactor; same output for every fixture. `loadProject` still materializes the cartesian map; that goes in the next PR.
- Updated dependencies [674944b]
- Updated dependencies [e161fdb]
- Updated dependencies [905161d]
- Updated dependencies [0932217]
- Updated dependencies [9de9db9]
- Updated dependencies [af73dc4]
- Updated dependencies [a2f776e]
- Updated dependencies [f09066f]
- Updated dependencies [f1cf2db]
- Updated dependencies [d29813e]
- Updated dependencies [e170124]
- Updated dependencies [83224fb]
- Updated dependencies [5178532]
  - @unpunnyfuns/swatchbook-core@0.55.0

## 0.54.0

### Minor Changes

- 8fb128c: `@unpunnyfuns/swatchbook-addon`: add `emitMode: 'cartesian' | 'projected'` option, defaulting to `'projected'`. The smart axis-projected emitter (`emitAxisProjectedCss`) now backs the addon's virtual-module `css` export — one `:root` baseline + per-cell deltas + compound `[data-A][data-B]` blocks for joint-variant tokens. Output is dramatically smaller than cartesian for typical fixtures while remaining spec-faithful for non-orthogonal DTCG resolvers. Pass `emitMode: 'cartesian'` to fall back to the explicit per-tuple fan-out (`projectCss`) — keep this in mind only for pathological cardinality where the projection analysis pass is too costly.
- 31999ef: `@unpunnyfuns/swatchbook-switcher`: remove the unused `permutations` prop from `<ThemeSwitcher>` and the `SwitcherPermutation` type from the public exports. The prop was declared but never read inside the component; the addon's manager and the storybook example are updated to drop the dead pass-through.
- 7b4225a: `@unpunnyfuns/swatchbook-core`: add `emitAxisProjectedCss(permutations, permutationsResolved, options?)` as an opt-in alternative to `emitCss` / `projectCss`. Emits one `:root` baseline block plus one `[data-<prefix>-<axis>="<context>"] { … }` block per non-default axis cell, carrying only the declarations that differ from baseline at that cell. Output composes via CSS cascade at runtime instead of fanning out across the cartesian tuple space. Axes must be orthogonal — see the function's doc-comment for the joint-variance limitation. Purely additive: existing `emitCss` / `projectCss` behavior unchanged.
- 5ed6b04: `@unpunnyfuns/swatchbook-core`: rewrite `emitAxisProjectedCss` to route per-token between projection (single-attribute selectors) and compound selectors based on `analyzeProjectVariance`. Spec-faithful for any DTCG-compliant resolver — orthogonal projects still get the size win; joint-variant projects get compound `[data-A][data-B]` blocks that preserve the cartesian-correct value at exactly the divergent joint tuples. Smart dedup: cells re-emit a token's value when ANY axis touches it (not just when this cell differs from baseline), so cascade-order resolves orthogonal-after-probe tokens correctly. Signature changed to `(project, options)` — function is `@internal`, only consumed in-package; no public API broken.
- 812676f: `@unpunnyfuns/swatchbook-core`: add internal `analyzeProjectVariance(project)` that classifies every token by how it varies across axes — baseline-only, single-axis, orthogonal-after-probe, or joint-variant. First step of a planned smart-emitter rewrite that routes per-token between projection (orthogonal) and compound-selector emit (joint-variant). Analysis only; no emit behaviour changes in this release. Not exported from the public API yet.

### Patch Changes

- ded154d: `@unpunnyfuns/swatchbook-core`: honest the orthogonality framing on `emitAxisProjectedCss`. JSDoc + test descriptions previously called the orthogonality requirement a "usage constraint," implying the consumer was responsible for authoring orthogonal modifiers. The DTCG Resolver Module 2025.10 spec explicitly permits non-orthogonal modifiers (Primer's "Pirate" light-only theme is the rationale doc's own example); projection is a lossy size optimization for them, not a contract. Cartesian (`emitCss`) is the spec-faithful default. Docs only — no behavior change.
- Updated dependencies [8fb128c]
- Updated dependencies [31999ef]
- Updated dependencies [7b4225a]
- Updated dependencies [ded154d]
- Updated dependencies [5ed6b04]
- Updated dependencies [812676f]
  - @unpunnyfuns/swatchbook-core@0.54.0

## 0.53.0

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.53.0

## 0.52.0

### Patch Changes

- Updated dependencies [9e9f635]
- Updated dependencies [00a1bf7]
  - @unpunnyfuns/swatchbook-core@0.52.0

## 0.51.1

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.51.1

## 0.51.0

### Patch Changes

- Updated dependencies [b087e60]
  - @unpunnyfuns/swatchbook-core@0.51.0

## 0.50.0

### Minor Changes

- 0b14715: Rename the cartesian-product surface from `themes` to `permutations`. A _theme_ is a curated presentational choice (Light, Dark, Brand A — what `presets` already captures); a _permutation_ is the raw cartesian product the DTCG resolver enumerates. The old vocabulary muddled the two, and the muddle made terrazzo#752 ("is 15M permutations a bug?") harder than it needed to be.

  **Renamed across the public API:**

  - `Project.themes` → `Project.permutations`
  - `Project.themesResolved` → `Project.permutationsResolved`
  - `resolveTheme()` → `resolvePermutation()`
  - `Theme` → `Permutation`
  - `ResolvedTheme` → `ResolvedPermutation`
  - `ProjectSnapshot.activeTheme` → `activePermutation`
  - `useActiveTheme()` → `useActivePermutation()`
  - `SwitcherTheme` → `SwitcherPermutation`
  - `ThemeContext` → `PermutationContext`
  - virtual `themes` / `defaultTheme` exports → `permutations` / `defaultPermutation`
  - `ThemeName` typegen → `PermutationName`
  - `emitViaTerrazzo` selection `'themes'` → `'permutations'`
  - `packages/core/src/themes/` → `packages/core/src/permutations/`
  - `normalizeThemes()` / `loadResolverThemes()` / `loadLayeredThemes()` → `normalizePermutations()` / `loadResolverPermutations()` / `loadLayeredPermutations()`

  **Dropped legacy single-name channels** (no deprecation; pre-1.0 minor bump):

  - `parameters.swatchbook.theme` reader removed.
  - `globals.swatchbookTheme` removed: the `GLOBAL_KEY` constant, the globalType registration, the initialGlobals entry, toolbar writes via `setAxis` / `applyPreset`, the `composedNameFor` / `tupleMatchesInput` / `tupleForName` helpers, the `channel-globals.ts` subscription, and the `use-project.ts` `channelTheme` fallback cascade. `AXES_GLOBAL_KEY` is now the only active-permutation channel.

  **Unchanged** (external conventions):

  - `data-<prefix>-theme="…"` CSS attribute (Storybook/CSS ecosystem).
  - `ThemeSwitcher` component + `@unpunnyfuns/swatchbook-switcher` package name.
  - `theme-switcher` Storybook TOOL_ID.
  - `virtual:swatchbook/theme` css-in-js integration export.
  - Storybook's own `themes` import in `apps/storybook/.storybook/manager.ts`.

  **New: `Config.maxPermutations` guard** (default 1024). Defends against terrazzo#752 — the resolver's cartesian-product enumerator OOMs on pathological state-space modifier products. When the cap is exceeded, `loadProject` loads only the default-tuple permutation + materializes any declared presets on demand via `resolver.apply()`, and surfaces a `swatchbook/permutations` warn diagnostic. The upstream `listPermutations()` call is bypassed entirely under the guard. Set `0` to disable. New docs in `config.mdx` (`maxPermutations` reference entry) + `axes.mdx` ("Scoping large modifier spaces" section).

### Patch Changes

- Updated dependencies [c9b31ed]
- Updated dependencies [0b14715]
  - @unpunnyfuns/swatchbook-core@0.50.0

## 0.20.6

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.20.6

## 0.20.5

### Patch Changes

- Updated dependencies [198d331]
  - @unpunnyfuns/swatchbook-core@0.20.5

## 0.20.4

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.20.4

## 0.20.3

### Patch Changes

- Updated dependencies [dcdb9ee]
  - @unpunnyfuns/swatchbook-core@0.20.3

## 0.20.2

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.20.2

## 0.20.1

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.20.1

## 0.20.0

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.20.0

## 0.19.9

### Patch Changes

- 2444c4e: Rework every package README to match the docs intro's register: human-register opening sentence, line breaks for pacing, detail-dense reference material (API tables, config fields, block catalogues, CLI flag tables, MCP tool tables) pushed out to the docs site where it belongs. Each README now answers "what is this and how do I install it" in ~50 lines instead of ~120, with clear links for readers who want more. Total README line count across all packages dropped from ~700 to ~370.
- Updated dependencies [2444c4e]
  - @unpunnyfuns/swatchbook-core@0.19.9

## 0.19.8

### Patch Changes

- a753766: Rework every package README to match the docs intro's register: human-register opening sentence, line breaks for pacing, detail-dense reference material (API tables, config fields, block catalogues, CLI flag tables, MCP tool tables) pushed out to the docs site where it belongs. Each README now answers "what is this and how do I install it" in ~50 lines instead of ~120, with clear links for readers who want more. Total README line count across all packages dropped from ~700 to ~370.
- Updated dependencies [a753766]
  - @unpunnyfuns/swatchbook-core@0.19.8

## 0.19.7

### Patch Changes

- Updated dependencies [74f57dc]
  - @unpunnyfuns/swatchbook-core@0.19.7

## 0.19.6

### Patch Changes

- Updated dependencies [d8937d3]
- Updated dependencies [d8937d3]
  - @unpunnyfuns/swatchbook-core@0.19.6

## 0.19.5

### Patch Changes

- Updated dependencies [380435c]
- Updated dependencies [380435c]
  - @unpunnyfuns/swatchbook-core@0.19.5

## 0.19.4

### Patch Changes

- Updated dependencies [6d76e77]
  - @unpunnyfuns/swatchbook-core@0.19.4

## 0.19.3

### Patch Changes

- Updated dependencies [0e1ec9e]
  - @unpunnyfuns/swatchbook-core@0.19.3

## 0.19.2

### Patch Changes

- Updated dependencies [b876729]
  - @unpunnyfuns/swatchbook-core@0.19.2

## 0.19.1

### Patch Changes

- Updated dependencies [3b1ff9e]
  - @unpunnyfuns/swatchbook-core@0.19.1

## 0.19.0

### Minor Changes

- 2f1b3ea: Replace `/tailwind`'s hardcoded `DEFAULT_ROLES` map with a dynamic role derivation that walks the project's default-theme token graph at render time and classifies each token into a Tailwind scale by `$type` + path. Color tokens → `color`, `space.*` / `spacing.*` dimensions → `spacing`, `radius.*` / `borderRadius.*` / `border-radius.*` dimensions → `radius`, shadows → `shadow`, font families → `font`. Font-size-ish dimensions (`font.size.*`, `text.*`) are intentionally skipped because Tailwind's `--text-*` entries want size + line-height pairs that this preview integration doesn't synthesize.

  Result: zero-config now works for every DTCG project shape, not just the one that matches the reference fixture. A project using `color.background.*` / `spacing.small` / `borderRadius.round` gets usable Tailwind utilities out of the box; previously it got a `@theme` block of `var(--undefined-…)` references.

  The `roles` option still wins — pass your own map to pin a curated subset, rename scales, or emit into Tailwind scales the derivation doesn't cover.

  Breaking (pre-1.0, minor): projects relying on the reference-fixture shape will now additionally emit `--color-<prefix>-palette-*` utilities etc. for every palette token. This is extra utility surface, not a removal; existing class names keep working.

### Patch Changes

- Updated dependencies [ba41ead]
- Updated dependencies [785486c]
- Updated dependencies [9fde68e]
- Updated dependencies [91c9901]
- Updated dependencies [40f3a68]
- Updated dependencies [ca1e52a]
- Updated dependencies [785486c]
  - @unpunnyfuns/swatchbook-core@0.19.0

## 0.18.0

### Minor Changes

- 87a92c2: Prune production-emitter surface from the two integrations. The `renderTailwindTheme` and `renderTheme` helpers, plus the `DEFAULT_ROLES` export, are no longer public — integrations are consumed exclusively through the addon's virtual-module pipeline. The banner comments are rephrased from the file-on-disk "Generated by … do not edit" form to preview-framed "Synthesized by … rebuilt on token changes", and the JSDoc on both defaults now states plainly that these integrations exist to make stories render correctly inside Storybook, not to replace the consumer's production Tailwind or CSS-in-JS build.

  Breaking (pre-1.0, minor): anyone importing the named helpers directly needs to wire the addon instead; they were never on the documented path.

### Patch Changes

- Updated dependencies [9496c82]
- Updated dependencies [44483af]
  - @unpunnyfuns/swatchbook-core@0.18.0

## 0.17.0

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.17.0

## 0.16.0

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [e702b29]
  - @unpunnyfuns/swatchbook-core@0.15.0

## 0.14.1

### Patch Changes

- Updated dependencies [b5976cd]
  - @unpunnyfuns/swatchbook-core@0.14.1

## 0.14.0

### Minor Changes

- 171c9aa: Auto-inject CSS-side-effect integrations into the Storybook preview. `SwatchbookIntegration.virtualModule.autoInject: true` opts a global-stylesheet integration (Tailwind's `@theme` block, any rules-heavy CSS) into an addon-managed import — consumers no longer hand-write a second `import 'virtual:swatchbook/…';` line after plugging the integration in. The addon's preview side-effect-imports an aggregate virtual module (`virtual:swatchbook/integration-side-effects`) whose body is generated from each auto-inject integration's virtualId.

  `@unpunnyfuns/swatchbook-integrations/tailwind` now opts in. Consumers drop the explicit `import 'virtual:swatchbook/tailwind.css'` from their `.storybook/preview.tsx`. CSS-in-JS stays as an explicit named-import (users write `import { theme, color } from 'virtual:swatchbook/theme'` where needed).

### Patch Changes

- Updated dependencies [171c9aa]
  - @unpunnyfuns/swatchbook-core@0.14.0

## 0.13.1

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.13.1

## 0.13.0

### Patch Changes

- 562bbc7: Release plumbing: `@unpunnyfuns/swatchbook-integrations` joins the fixed-version group so it releases in lockstep with core / addon / blocks / switcher / mcp (reaching `0.13.0` at its first publish).
- f66b9ef: Move `@unpunnyfuns/swatchbook-core` from `peerDependencies` to `dependencies`. The two packages ship together in the fixed-version group, so the peer-dep framing buys nothing and triggers Changesets' peer-dep safety cascade (forcing a major bump across the entire fixed group when any member's version moves).
- Updated dependencies [018f518]
- Updated dependencies [f03161f]
- Updated dependencies [74e755c]
  - @unpunnyfuns/swatchbook-core@0.13.0
