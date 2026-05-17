# @unpunnyfuns/swatchbook-core

## 0.55.0

### Minor Changes

- 674944b: `@unpunnyfuns/swatchbook-core`: expose `buildResolveAt` via the new `./resolve-at` subpath — a small, dep-free entry point browser-side consumers can import without dragging the loader / Terrazzo runtime through their bundles.

  `@unpunnyfuns/swatchbook-blocks`: blocks now consume `resolveAt(activeTuple)` instead of indexing `permutationsResolved[activePermutation]` for the current `resolved` token map. `ProjectData` exposes `resolveAt` so per-tuple consumers (the `AxisVariance` block's grid cells) can read any tuple's values without `permutations.find` + tuple-name scans. Snapshots that pre-date the cells wire format fall back to `permutationsResolved` indexing — covers hand-built test snapshots and the docs-site path.

- 905161d: `@unpunnyfuns/swatchbook-core`: drop `projectCss` and the supporting `packages/core/src/emit.ts` module. The smart `emitAxisProjectedCss` (default since v0.54) becomes the single emitter. Also drops the unused `emitTypes` helper (the addon's `preset.ts` has its own `renderTokenTypes`).

  `@unpunnyfuns/swatchbook-addon`: drop the `AddonOptions.emitMode` option and the `composeProjectCss` dispatch helper. With only one emitter there's no dispatch to do; the addon's plugin calls `emitAxisProjectedCss` directly.

  `@unpunnyfuns/swatchbook-mcp`: `emit_css` tool calls `emitAxisProjectedCss(project)` directly. Tool description updated to describe the smart-emit shape (`:root` baseline + per-axis singleton cells + compound joint-override blocks + chrome alias trailer).

  `apps/docs/scripts/build-tokens.mts`: switches to `emitAxisProjectedCss`.

  Pre-1.0 breaking change for consumers who explicitly imported `projectCss` from core or set `emitMode: 'cartesian'` on the addon. Production consumers were on the smart-emit default already.

- 9de9db9: `@unpunnyfuns/swatchbook-core`: the **layered loader** now enumerates `Σ(axes × contexts)` singleton tuples — the default tuple plus one per `(axis, non-default-context)` — instead of `Π(contexts)` cartesian tuples. Symmetric with the resolver path after #810. Joint divergences are unrecoverable without a resolver, so the truth model for layered is projection composition over delta cells; `composeAt` at any multi-non-default tuple applies each axis's delta on top of the baseline in axis order.

  The `Config.maxPermutations` guard is **removed**. With singleton enumeration, the loader is intrinsically bounded by axis cardinality regardless of cartesian size — there's nothing left to guard against.

  Public API removed (pre-1.0 minor bump):

  - `Config.maxPermutations` field.
  - `cartesianSize()` export.
  - `permutationGuardDiagnostic()` export.
  - `DEFAULT_MAX_PERMUTATIONS` export.
  - The `swatchbook/permutations` warn diagnostic group.

  Migration: drop `maxPermutations` from your swatchbook config. The reference `axes.mdx` / `config.mdx` docs reflect the new scoping levers (`presets`, `disabledAxes`).

- af73dc4: `@unpunnyfuns/swatchbook-addon`, `@unpunnyfuns/swatchbook-blocks`: lift `resolveAt` to the preview decorator (built once per iframe at module load over the stable virtual exports) and ship it through `SwatchbookContext`. Blocks read `snapshot.resolveAt` directly — no more memo gymnastics. Closes #793.

  Drops the wire-shipped `permutations`, `permutationsResolved`, and `defaultPermutation` from the virtual module + HMR snapshot + `InitPayload` + per-package `virtual.d.ts`. The block-side `ProjectSnapshot` keeps them as optional fields for hand-built test snapshots and legacy MDX consumers (the `snapshotResolveAt` fallback path still indexes them when `cells` is absent).

  Migrates the three remaining addon-side consumers that previously read `Project.permutationsResolved` directly:

  - `preset.ts` (codegen): iterates `project.varianceByPath.keys()` for token paths.
  - `virtual/plugin.ts` (HMR reload log): counts from `project.varianceByPath.size`.
  - `useToken` hook: reads the snapshot's `resolveAt` (or a module-level `fallbackResolveAt` built from the virtual exports when no provider is mounted).

  `Project.permutations` and `Project.permutationsResolved` still exist on the core type — the loadProject rewrite that drops them follows in the next PR.

- a2f776e: `@unpunnyfuns/swatchbook-core`: `loadProject` no longer calls `resolver.listPermutations()`. The resolver-backed loader now enumerates only **singletons** — the axes-defaults tuple plus one per `(axis, non-default-context)` — so total `resolver.apply` calls are bounded by `Σ(axes × contexts)` instead of the cartesian product. Pathological resolvers (terrazzo#752: 15M tuples) load in milliseconds instead of OOMing.

  `Project.cells` now stores **delta cells** for non-default contexts: each non-default `(axis, context)` cell holds only the tokens whose value differs from the default-cell baseline. Default cells stay as full TokenMaps. Delta cells make `composeAt` correct under sparse composition — a later axis's cell can't accidentally overwrite an earlier axis's overlay on a token the later axis doesn't touch.

  `probeJointOverrides` now falls back to the baseline TokenMap when a delta cell omits a path, so the "axis A's cell alone would produce" comparison stays accurate. The CSS axis-projected emitter passes the full composed TokenMap separately for alias resolution while emitting per-axis cell deltas, so smart-dedup re-emit (the previous cascade trick) is no longer needed — joint compound `[data-axis-A][data-axis-B]` blocks handle the joint-variance cases.

  Public API removed (pre-1.0 minor bump):

  - `resolvePermutation()` export.
  - `ResolvedPermutation` type.

  `Project.permutations` and `Project.permutationsResolved` are retained for now (still keyed against the singleton enumeration); the layered loader continues to use cartesian enumeration unchanged.

  `Config.maxPermutations` is documented as **layered-only** — the resolver path is intrinsically bounded.

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

- e170124: `@unpunnyfuns/swatchbook-core`: smart emitter (`emitAxisProjectedCss`) and `analyzeProjectVariance` switch their Phase 1 cell construction from `findPermByTuple(permutations, …) → permutationsResolved[name]` to reading `project.cells` directly. Internal refactor only — same output for every fixture, just sourced from the bounded per-axis surface instead of the cartesian map. Phase 3 (joint case probing + lookup) still uses the resolver + `permutationsResolved`; that moves in the next PR alongside the loadProject rewrite. No public API changes.
- 83224fb: `@unpunnyfuns/swatchbook-core`: smart emitter (`emitAxisProjectedCss`) compound-block emission and `analyzeProjectVariance` Phase 3 read from `project.jointOverrides` directly. The smart emitter iterates overrides for N-arity compound selectors (pairs / triples / etc. uniformly); the variance analysis derives the legacy pair-shape `JointCase` array from the same overrides for back-compat. No more `findPermByTuple` + `permutationsResolved[jointCase.permutationName]` lookup in either path. Internal refactor; same output for every fixture. `loadProject` still materializes the cartesian map; that goes in the next PR.

## 0.54.0

### Minor Changes

- 8fb128c: `@unpunnyfuns/swatchbook-addon`: add `emitMode: 'cartesian' | 'projected'` option, defaulting to `'projected'`. The smart axis-projected emitter (`emitAxisProjectedCss`) now backs the addon's virtual-module `css` export — one `:root` baseline + per-cell deltas + compound `[data-A][data-B]` blocks for joint-variant tokens. Output is dramatically smaller than cartesian for typical fixtures while remaining spec-faithful for non-orthogonal DTCG resolvers. Pass `emitMode: 'cartesian'` to fall back to the explicit per-tuple fan-out (`projectCss`) — keep this in mind only for pathological cardinality where the projection analysis pass is too costly.
- 31999ef: `@unpunnyfuns/swatchbook-switcher`: remove the unused `permutations` prop from `<ThemeSwitcher>` and the `SwitcherPermutation` type from the public exports. The prop was declared but never read inside the component; the addon's manager and the storybook example are updated to drop the dead pass-through.
- 7b4225a: `@unpunnyfuns/swatchbook-core`: add `emitAxisProjectedCss(permutations, permutationsResolved, options?)` as an opt-in alternative to `emitCss` / `projectCss`. Emits one `:root` baseline block plus one `[data-<prefix>-<axis>="<context>"] { … }` block per non-default axis cell, carrying only the declarations that differ from baseline at that cell. Output composes via CSS cascade at runtime instead of fanning out across the cartesian tuple space. Axes must be orthogonal — see the function's doc-comment for the joint-variance limitation. Purely additive: existing `emitCss` / `projectCss` behavior unchanged.
- 5ed6b04: `@unpunnyfuns/swatchbook-core`: rewrite `emitAxisProjectedCss` to route per-token between projection (single-attribute selectors) and compound selectors based on `analyzeProjectVariance`. Spec-faithful for any DTCG-compliant resolver — orthogonal projects still get the size win; joint-variant projects get compound `[data-A][data-B]` blocks that preserve the cartesian-correct value at exactly the divergent joint tuples. Smart dedup: cells re-emit a token's value when ANY axis touches it (not just when this cell differs from baseline), so cascade-order resolves orthogonal-after-probe tokens correctly. Signature changed to `(project, options)` — function is `@internal`, only consumed in-package; no public API broken.
- 812676f: `@unpunnyfuns/swatchbook-core`: add internal `analyzeProjectVariance(project)` that classifies every token by how it varies across axes — baseline-only, single-axis, orthogonal-after-probe, or joint-variant. First step of a planned smart-emitter rewrite that routes per-token between projection (orthogonal) and compound-selector emit (joint-variant). Analysis only; no emit behaviour changes in this release. Not exported from the public API yet.

### Patch Changes

- ded154d: `@unpunnyfuns/swatchbook-core`: honest the orthogonality framing on `emitAxisProjectedCss`. JSDoc + test descriptions previously called the orthogonality requirement a "usage constraint," implying the consumer was responsible for authoring orthogonal modifiers. The DTCG Resolver Module 2025.10 spec explicitly permits non-orthogonal modifiers (Primer's "Pirate" light-only theme is the rationale doc's own example); projection is a lossy size optimization for them, not a contract. Cartesian (`emitCss`) is the spec-faithful default. Docs only — no behavior change.

## 0.53.0

## 0.52.0

### Minor Changes

- 9e9f635: Align the public export surface with the reference docs ahead of v1.0.

  **Retracted from `@unpunnyfuns/swatchbook-core`** (no first-party consumers, removed from the package's public surface):

  - `emitTypes`, `emitCss`, `EmitCssOptions`
  - `emitViaTerrazzo`, `EmitViaTerrazzoOptions`, `EmitSelectionEntry`, `EmittedFile`
  - `dataAttr`

  `projectCss` stays public — it has real first-party consumers and is now documented in the [core reference](https://unpunnyfuns.github.io/swatchbook/reference/core). For production-platform emission, use Terrazzo's CLI directly.

  **Newly documented surface** (no API change, just docs that catch up to reality):

  - core: `projectCss`, `analyzeAxisVariance`, `CHROME_ROLES`, `DEFAULT_CHROME_MAP`, `ChromeRole`, `AxisVarianceResult`, `VarianceKind`, `ResolvedPermutation`, `TokenMap`, `ListedToken`, `DiagnosticSeverity`, `ParserInput`
  - addon: `AddonOptions` typed shape; phantom `GLOBAL_KEY` removed from the exported-constants example

- 00a1bf7: Consolidate parallel type definitions: `@unpunnyfuns/swatchbook-blocks`'s `VirtualAxisShape` / `VirtualPermutationShape` / `VirtualDiagnosticShape` / `VirtualPresetShape` are now type-aliases of core's authoritative `Axis` / `Permutation` / `Diagnostic` / `Preset`. Internal `VirtualAxisLike` / `VirtualPermutationLike` helpers in blocks removed; core's types are used directly.

  Two array fields on core's types tighten to `readonly` so the existing immutable usage flows through cleanly:

  - `Axis.contexts: readonly string[]` (was `string[]`)
  - `Permutation.sources: readonly string[]` (was `string[]`)

  No first-party site mutates either array; consumers who treated them as immutable already match the tightened contract.

  Side cleanups while we were in here:

  - New `cssVarAsNumber` helper in blocks centralises the `var(--…)` → `CSSProperties.fontWeight` / `lineHeight` pattern. The four scattered `as unknown as number` casts are gone.
  - New `SwatchbookGlobals` / `StoryParameters` types in addon narrow the Storybook globals + parameters bags around the keys the addon actually owns. Eliminates seven `Record<string, unknown>` casts in `preview.tsx`.

  Composite-token shape narrowing (DTCG `$type` discriminated unions over shadow / border / gradient / typography) deferred to a follow-up — touches a different surface and is its own surgery.

## 0.51.1

## 0.51.0

### Minor Changes

- b087e60: `config.resolver` now accepts bare package specifiers (e.g. `@my/tokens/resolver.json`). Resolution prefers `cwd`-relative paths when the file is on disk — preserving every existing config form — and falls back to `node_modules` resolution from `cwd` otherwise, so token packages can ship a resolver that consumers reference directly without copying it into their tree.

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

- c9b31ed: Docs: register `tsx` + `typescript` with Prism so `.tsx` and `.ts` fenced code blocks across the docs site (quickstart, authoring-doc-stories guide, switcher reference, etc.) render with syntax highlighting instead of plaintext. The four `mdx` fences in the source switch to `tsx` since their content is JSX-import-heavy and tsx covers it cleanly; native `mdx` highlighting isn't bundled with `prism-react-renderer`.

## 0.20.6

## 0.20.5

### Patch Changes

- 198d331: Fix: emit a `swatchbook/listing` warn diagnostic when the Token Listing build fails (plugin crash inside a user-supplied `terrazzoPlugins` entry, missing listing output, malformed JSON). Previously those failures returned an empty listing silently, leaving `<TokenTable>` / `<ColorTable>` / `<TokenDetail>` previews falling back to raw values with no signal as to why. The `<Diagnostics />` block already auto-opens when warnings are non-zero, so authors see the failure immediately.

## 0.20.4

## 0.20.3

### Patch Changes

- dcdb9ee: Docs: restructure `guides/sharing-terrazzo-options` so the shared-options module pattern is the first section after the intro, with motivation (drift symptoms, what-swatchbook-owns) demoted below the example. Adds a "why this pattern, not a `config.terrazzo: TerrazzoConfig` field?" section explaining why swatchbook accepts plugin objects rather than ingesting a constructed Terrazzo config (closure-trapped plugin options; symmetric handling matches `tsconfig` `extends`).

## 0.20.2

## 0.20.1

## 0.20.0

## 0.19.9

### Patch Changes

- 2444c4e: Rework every package README to match the docs intro's register: human-register opening sentence, line breaks for pacing, detail-dense reference material (API tables, config fields, block catalogues, CLI flag tables, MCP tool tables) pushed out to the docs site where it belongs. Each README now answers "what is this and how do I install it" in ~50 lines instead of ~120, with clear links for readers who want more. Total README line count across all packages dropped from ~700 to ~370.

## 0.19.8

### Patch Changes

- a753766: Rework every package README to match the docs intro's register: human-register opening sentence, line breaks for pacing, detail-dense reference material (API tables, config fields, block catalogues, CLI flag tables, MCP tool tables) pushed out to the docs site where it belongs. Each README now answers "what is this and how do I install it" in ~50 lines instead of ~120, with clear links for readers who want more. Total README line count across all packages dropped from ~700 to ~370.

## 0.19.7

### Patch Changes

- 74f57dc: Fix broken DTCG spec links. The `design-tokens.org` domain is dead; the canonical home is `www.designtokens.org` and the path layout shifted from `/tr/2025/drafts/...` to `/TR/2025.10/...`. Eight occurrences across docs, core README, test fixtures, resolver JSON `$schema`, and the docs navbar footer now point at the live URL.

## 0.19.6

### Patch Changes

- d8937d3: Add `<ColorTable>` to the colors example in the authoring guide and to the "Blocks at a glance" table. The example now shows `ColorPalette` + `ColorTable` + `TokenTable` together — the three natural shapes for a colors doc page (swatch grid, variant-aware grouped table, flat list).
- d8937d3: Add explicit `.mdx` extensions to every internal doc-to-doc markdown link. Docusaurus only rewrites relative links to doc slugs when the source has an `.md`/`.mdx` extension; without it, the link becomes a raw URL resolved against the current page at click time — so `[text](./guides/integrations/tailwind)` from `/quickstart/` could land on `/quickstart/guides/integrations/tailwind` instead of `/guides/integrations/tailwind`. Seventy-something links across the docs corrected; directory-style links (`./developers/`, `./reference/blocks`, `./guides/integrations`) now point at the explicit index file (`./developers/index.mdx` etc.). No content changes; navigation robustness fix.

## 0.19.5

### Patch Changes

- 380435c: Add `<ColorTable>` to the colors example in the authoring guide and to the "Blocks at a glance" table. The example now shows `ColorPalette` + `ColorTable` + `TokenTable` together — the three natural shapes for a colors doc page (swatch grid, variant-aware grouped table, flat list).
- 380435c: Add explicit `.mdx` extensions to every internal doc-to-doc markdown link. Docusaurus only rewrites relative links to doc slugs when the source has an `.md`/`.mdx` extension; without it, the link becomes a raw URL resolved against the current page at click time — so `[text](./guides/integrations/tailwind)` from `/quickstart/` could land on `/quickstart/guides/integrations/tailwind` instead of `/guides/integrations/tailwind`. Seventy-something links across the docs corrected; directory-style links (`./developers/`, `./reference/blocks`, `./guides/integrations`) now point at the explicit index file (`./developers/index.mdx` etc.). No content changes; navigation robustness fix.

## 0.19.4

### Patch Changes

- 6d76e77: Add explicit `.mdx` extensions to every internal doc-to-doc markdown link. Docusaurus only rewrites relative links to doc slugs when the source has an `.md`/`.mdx` extension; without it, the link becomes a raw URL resolved against the current page at click time — so `[text](./guides/integrations/tailwind)` from `/quickstart/` could land on `/quickstart/guides/integrations/tailwind` instead of `/guides/integrations/tailwind`. Seventy-something links across the docs corrected; directory-style links (`./developers/`, `./reference/blocks`, `./guides/integrations`) now point at the explicit index file (`./developers/index.mdx` etc.). No content changes; navigation robustness fix.

## 0.19.3

### Patch Changes

- 0e1ec9e: Add a short "If your stories use Tailwind or a CSS-in-JS library" section to the Quickstart. Stories already using CSS variables pick up toolbar flips via cascade with no extra work; the two common library cases get a one-bullet each pointing at the respective integration guide. Surfaces the integration story earlier so first-time users discover it alongside the addon install, not only after digging through Guides.

## 0.19.2

### Patch Changes

- b876729: Lead the introduction with swatchbook's Terrazzo foundation: the first paragraph now states that swatchbook is built on Terrazzo's parser and that a production pipeline running Terrazzo's CLI against the same DTCG source shares the swatchbook-reads-it-too story. Readers previously had to scroll to "What it isn't" to learn swatchbook and Terrazzo are the same pipeline's preview and production halves. Trim the redundant re-explanation from "What it isn't" since the lead now carries it.

## 0.19.1

### Patch Changes

- 3b1ff9e: Fix two discoverability regressions from the previous docs restructure:

  - Split `guides/integrations.mdx` back into `guides/integrations/{index,tailwind,css-in-js}.mdx`. The merged single-page form was terser but readers scanning the Guides sidebar couldn't see that Tailwind or CSS-in-JS were covered — the library names didn't surface. Three pages under an "Integrations" sidebar category makes both the scope and each integration visible at a glance.
  - Group the Reference sidebar into three categories — **Packages** (addon / core / config / mcp), **Blocks** (index / overview / inspector / samples / utility / hooks), **Model** (axes / token-pipeline). Previously eleven flat entries mixed these kinds; grouping reads as an index, not a laundry list.

## 0.19.0

### Minor Changes

- 785486c: Tighten `Config.cssOptions`: `filename` and `skipBuild` are now stripped from the allowed type in addition to `variableName` and `permutations`. Neither was ever honored end-to-end — `filename` is overridden to the in-memory capture name, and `skipBuild: true` would silently null out the listing's `previewValue`. Removing them from the type turns a silent no-op into a compile-time signal.

  Deprecated plugin-css knobs (`baseSelector`, `baseScheme`, `modeSelectors`) are still type-accepted because they sit on `CSSPluginOptions`, but are runtime-inert under swatchbook's permutation-based emission. Setting any of them now produces a `swatchbook/css-options` warn diagnostic that lists the offending keys and points at the replacement, matching the validation pattern already used for `default` / `presets` / `chrome` / `disabledAxes`.

  Breaking (pre-1.0, minor): configs that were setting `filename` or `skipBuild` on `cssOptions` — which had no effect in practice — will now fail to typecheck. Delete the field.

### Patch Changes

- ba41ead: Declare `@terrazzo/parser` and `@terrazzo/plugin-css` as peer dependencies on swatchbook-core (still listed under `dependencies` too). Terrazzo's ecosystem plugins — `@terrazzo/plugin-swift`, `-android`, `-sass`, `-js`, etc. — all peer-depend on `@terrazzo/parser`. Without the peer declaration on our side, a user installing `plugin-swift@3.x` next to our `parser@2.x` would hit silent API-shape mismatches (parser 3 and plugin 3 talk one protocol; parser 2 talks another). Now pnpm can hoist to a single shared parser instance and surface version mismatches at install time instead of at render time.

  No runtime behavior change; installs that already satisfy the range see no difference.

- 785486c: Expand the "Aligning with your token build" guide (`guides/sharing-terrazzo-options`) from a short shared-options recipe into a full primer: per-knob notes for `cssOptions` / `listingOptions` / `terrazzoPlugins`, what swatchbook owns vs what passes through, the soft-inert `baseSelector` / `baseScheme` / `modeSelectors` trio, per-platform identifier display via `terrazzoPlugins` + `listingOptions.platforms`, monorepo layout guidance, a Style Dictionary section covering DTCG-source alignment and the "don't try to match names" counterpoint, and a common-pitfalls section. Guide now appears in the sidebar; cross-linked from `concepts/token-pipeline` and `integrations/`.
- 9fde68e: Correct the "Consuming the active theme" guide: swatchbook does ship React hooks (`useActiveAxes` / `useActiveTheme` / `useColorFormat` from `@unpunnyfuns/swatchbook-addon`), and for React story / block / decorator code inside the Storybook preview they're the ergonomic path — the previous guide framed DOM-observation as the only option and claimed "no framework-specific hooks" which is wrong. DOM observation is now positioned as the cross-framework / out-of-preview fallback, and the intro lists three paths (CSS variables → React hook → DOM observation) in order of preference. Non-React bindings are still explicitly not shipped — that part is unchanged.
- 91c9901: Add a "Terrazzo dependencies" mini-section to the Quickstart. Clarifies that `@terrazzo/parser`, `plugin-css`, and `plugin-token-listing` come with `swatchbook-core` transitively (no extra install for the default setup), and flags the two cases where explicit Terrazzo installs are warranted: pinning matching versions alongside a production `@terrazzo/cli`, or installing additional ecosystem plugins (`plugin-swift`, `-android`, `-sass`, `-js`) to populate per-platform names in `<TokenDetail>`.
- 40f3a68: Restructure the documentation: consolidate sprawling sections, drop duplicate and pre-emptive pages, tighten the register. Sidebar drops from six nav pills to three (Guides / Reference / Developers). Page count drops from twenty-three to fifteen.

  - `concepts/axes-vs-themes` + `concepts/axes` merged into `reference/axes` — one page, the runtime model plus a short framing paragraph, no separate "why" page.
  - `guides/token-dashboard` merged into `guides/authoring-doc-stories` as a composition example; tutorial framing retained.
  - `integrations/{index,tailwind,css-in-js}` merged into `guides/integrations` — two integrations are small enough to live as sections on one page, not three.
  - `concepts/token-pipeline` moved to `reference/token-pipeline` and rewritten for tighter register.
  - `concepts/presets` and `concepts/theming-inputs` dropped — content already covered in `reference/config`.
  - `guides/migrating-from-addon-themes` dropped — the migration story is two sentences in the intro.
  - `guides/multi-axis-walkthrough` dropped — the axes reference + resolver docs carry the load.
  - Intro + quickstart trimmed: pitchier phrasings replaced with direct descriptions. Less "powerful" / "seamless" voice, more "a tool for visualising your design tokens." Register matches the rest of the reference material.
  - Every cross-link and anchor updated across the remaining pages; docs build passes cleanly.

- ca1e52a: Tighten the framing on `<TokenDetail>`'s per-platform Consumer Output rows and the alignment guide's per-platform section so it's clear: swatchbook doesn't transform tokens, it displays what the consumer's configured transformers emit. The rows match production naming only when the plugin invocations match (pass `plugin-swift({ yourProductionOptions })`, not `plugin-swift()`). No behaviour change; the caveat makes the "preview host, not token transformer" scope explicit in-docs so users don't read the displayed defaults as authoritative.

## 0.18.0

### Minor Changes

- 9496c82: New config props on `defineSwatchbookConfig` for sharing Terrazzo plugin options with the internal build pipeline: `cssOptions`, `listingOptions`, and `terrazzoPlugins`. Consumers who run their own Terrazzo CLI in production can now align swatchbook's docs-side emission with whatever their production build produces — no more drift between the hex values / CSS variable names / per-platform identifiers the docs show and what actually ships.

  - `cssOptions?: Omit<CSSPluginOptions, 'variableName' | 'permutations'>` forwards to the internal `plugin-css` instance. `legacyHex`, `colorDepth`, `transform`, and everything else plugin-css accepts flow through; `variableName` and `permutations` stay managed because swatchbook's axis composition depends on them.
  - `listingOptions?: Omit<TokenListingPluginOptions, 'filename'>` forwards to the internal `plugin-token-listing`. Register platforms beyond `css` (swift, android, figma, custom name functions) and `listing[path].names.<platform>` populates for block consumption.
  - `terrazzoPlugins?: readonly Plugin[]` adds extra Terrazzo plugins alongside swatchbook's internal two. Required when `listingOptions.platforms` references anything outside the built-in `css` entry — the referenced plugin has to be loaded in the build.

  Consumers who don't run a separate Terrazzo build leave all three unset and nothing changes. The idiomatic share-across-configs pattern is a single file that exports the shared options and imports into both `terrazzo.config.ts` and `swatchbook.config.ts`.

- 44483af: Adopt `@terrazzo/plugin-token-listing` as the authoritative source for per-token metadata. `loadProject` now runs the plugin alongside Terrazzo's build for resolver-backed projects and attaches a path-indexed `listing` map to `Project`. Each entry carries the plugin-css-emitted CSS variable name (`names.css`), a CSS-ready `previewValue`, the original aliased value, and `source.loc` pointing back to the authoring file + line.

  Closes the drift risk Sidnioulz flagged: the block-display surface no longer reinvents naming or value-string generation where Terrazzo already has an opinion. `ColorTable` now reads its CSS var strings from the listing when available, falling back to the local Terrazzo-wrapping `makeCssVar` when a listing entry is missing (non-resolver projects, listing-plugin errors).

  The snapshot flowing through the addon's virtual module and HMR channel includes the listing slice under a new `listing` field — consumers building blocks against `ProjectSnapshot` get the same data.

  This is step 3 of the staged Terrazzo alignment. Step 1 (`makeCssVar` → Terrazzo) landed in the prior release; color value conversion and per-platform names (Swift/Android) are follow-ups that reuse the same listing pipeline.

## 0.17.0

## 0.16.0

## 0.15.0

### Minor Changes

- e702b29: Fuzzy search across `TokenNavigator`, `TokenTable`, and the MCP `search_tokens` tool. Case-insensitive, tolerates a single-character typo per term, and accepts out-of-order terms — `"blue palette"` matches `color.palette.blue.500`, `"surf def"` matches `color.surface.default`. Replaces the previous case-insensitive substring match.

  Core now exports `fuzzyFilter(items, query, key, options?)` and `fuzzyMatches(haystack, query)` so downstream integrations can reuse the same ranking primitive. Backed by [`@leeoniya/ufuzzy`](https://github.com/leeoniya/uFuzzy).

## 0.14.1

### Patch Changes

- b5976cd: Mark `emitCss`, `projectCss`, `emitTypes`, `emitViaTerrazzo`, and their associated option / result types (`EmitCssOptions`, `EmitViaTerrazzoOptions`, `EmitSelectionEntry`, `EmittedFile`, `ParserInput`) as `@internal`. Exports stay in place to preserve 0.13-era call sites, but editors that honour the tag will stop suggesting them to consumers. Actual removal waits for a future breaking window.

## 0.14.0

### Minor Changes

- 171c9aa: Auto-inject CSS-side-effect integrations into the Storybook preview. `SwatchbookIntegration.virtualModule.autoInject: true` opts a global-stylesheet integration (Tailwind's `@theme` block, any rules-heavy CSS) into an addon-managed import — consumers no longer hand-write a second `import 'virtual:swatchbook/…';` line after plugging the integration in. The addon's preview side-effect-imports an aggregate virtual module (`virtual:swatchbook/integration-side-effects`) whose body is generated from each auto-inject integration's virtualId.

  `@unpunnyfuns/swatchbook-integrations/tailwind` now opts in. Consumers drop the explicit `import 'virtual:swatchbook/tailwind.css'` from their `.storybook/preview.tsx`. CSS-in-JS stays as an explicit named-import (users write `import { theme, color } from 'virtual:swatchbook/theme'` where needed).

## 0.13.1

## 0.13.0

### Minor Changes

- f03161f: Add `emitViaTerrazzo(project, options)` — axis-aware wrapper around `@terrazzo/parser`'s programmatic `build()`. Auto-derives compound-selector permutations from `project.themes` (or `project.presets`, via `selection`), pins `variableName` to `cssVarPrefix`, and runs `@terrazzo/plugin-css` alongside any additional Terrazzo plugins the caller passes. Foundational for library-level platform emission (Tailwind `@theme`, CSS-in-JS accessors, Swift, Sass, …) without users re-deriving axis composition per plugin.

  Also ships a pnpm patch for `@terrazzo/plugin-css-in-js@2.0.3` fixing a one-line bug where dashed path segments (`number.line-height.loose`, `color.accent.bg-hover`) crash the build. File upstream separately.

### Patch Changes

- 018f518: Add `get_axis_variance` MCP tool + extract the variance algorithm into `@unpunnyfuns/swatchbook-core` (`analyzeAxisVariance`). The algorithm now lives in one place and drives both the `AxisVariance` doc block and the new MCP tool, which classifies a token's axis dependence (`constant` / `single` / `multi`) and returns the per-axis breakdown of values seen in each context.
- 74e755c: Retain Terrazzo's parser output on `Project.parserInput` (`{ tokens, sources, resolver }`) and the loader's `cwd` on `Project.cwd`. Adds `SwatchbookIntegration` to the public type surface. All additive — no behaviour change for existing consumers. Unblocks library-level emission wrappers that drive Terrazzo's programmatic `build()` without re-parsing.

## 0.12.0

## 0.11.6

## 0.11.5

## 0.11.4

## 0.11.3

## 0.11.2

## 0.11.1

### Patch Changes

- a294673: docs: restore `swatchbook-*` in each package README's title header

  Every package README was headed with a one-word title (`# Addon`, `# Blocks`, `# Core`, `# MCP`). On npm's package page that renders as a standalone word stripped of context — a reader who lands on the tarball's own page via a search, deep link, or alert sees "# Addon" and has to hunt for what it's an addon _of_. Restored the `swatchbook-*` prefix so each README's title matches its published package name and re-establishes context on first scroll.

## 0.11.0

## 0.10.2

## 0.10.1

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

### Patch Changes

- a9d1a1c: docs: serve main-branch docs at `/` instead of the last-cut release

  Pre-1.0, pinning the docs default at the last release means visitors
  see a snapshot that's often behind what's actually on `main`. Flip
  `lastVersion: 'current'` so the main-branch docs mount at `/` with a
  plain "Next" label (no more "unreleased" banner — nothing to warn
  about when current _is_ the headline). Released snapshots keep working
  at `/<version>/` through the version dropdown.

- 94b1b3e: docs: add a DTCG-aware theme switcher to the docs-site navbar

  Extends `apps/docs/tokens/` with a second axis (`a11y: Normal |
High-contrast`) layered on top of the existing `mode` axis, and mounts
  a live theme-switcher popover next to Docusaurus's built-in colour-mode
  toggle. The popover is rendered through the shared
  `@unpunnyfuns/swatchbook-switcher` package — same component the
  Storybook addon toolbar uses, so the two surfaces stay in lockstep on
  any future axis additions.

  State lives in a `SwatchbookSwitcherProvider` (installed via a Root
  swizzle), persists to `localStorage`, and flips `data-sb-<axis>`
  attributes on `<html>` so the already-emitted multi-axis CSS picks up
  the new tuple. The build script now also emits
  `src/tokens.snapshot.json` alongside the generated CSS, which the
  context provider reads at build time — no runtime fetch, no manual
  axis list.

  Colour-mode stays on Docusaurus's `[data-theme]` attribute; the two
  systems bridge cleanly via the compound CSS selectors the swatchbook
  emitter produces (`[data-theme="dark"][data-sb-a11y="High-contrast"]`
  etc.).

- b947c99: docs: wire Docusaurus Infima theming through a swatchbook token pipeline

  `apps/docs/tokens/` now holds a minimal DTCG set — a brand / neutral
  palette plus per-mode surface, text, primary, and code role tokens.
  A small build-time script (`apps/docs/scripts/build-tokens.mts`) loads
  it through `loadProject` / `projectCss` from swatchbook-core and emits
  `apps/docs/src/css/tokens.generated.css`, post-processing the
  `[data-sb-theme="…"]` selectors into Docusaurus's `[data-theme="…"]`
  shape so the per-mode vars track the Infima toggle on `<html>`.

  `custom.css` drops its hand-tuned hex values and maps Infima variables
  onto the emitted `--sb-color-*` vars (primary ramp, surfaces, text,
  code chrome). Changes to `apps/docs/tokens/*.json` now flow into the
  live Infima theme on rebuild — the docs site dogfoods the addon's own
  token pipeline instead of maintaining a parallel colour list.

- e571197: docs: split Docs nav into per-category top-level entries

  The Docusaurus navbar now exposes Quickstart, Concepts, Blocks, Guides,
  and Reference as discrete top-level items instead of a single collapsed
  "Docs" link. `activeBaseRegex` on each entry highlights the pill for the
  whole section — Reference excludes `/reference/blocks/*` so the Blocks
  entry keeps the active style while browsing block pages.

- 887cb0a: docs: split docs sidebar per section so left rail stops duplicating navbar

  The left sidebar listed every category (Blocks / Concepts / Guides /
  Reference) as a collapsible header, which mirrored the navbar entries
  added in the previous patch. Split the single `docs` sidebar into five
  section-scoped sidebars (`home`, `concepts`, `blocks`, `guides`,
  `reference`) and bind each navbar entry with `type: 'docSidebar'` +
  `sidebarId`. The left rail now lists only the pages in the current
  section.

  Versioned sidebar snapshots (0.4 / 0.5 / 0.6) were rewritten to the new
  shape — navbar `docSidebar` entries resolve per-version, so leaving
  older versions on the old `docs` sidebar would 500 every page under
  `/0.4/…` etc.

## 0.6.2

### Patch Changes

- 97a32bb: docs: simplify block reference headers and add inline usage snippets
- 97a32bb: docs: add CONTRIBUTING.md

  First-class contributor guide covering dev setup (Node 24, pnpm 10.33.0, `pnpm install`, `pnpm dev`), the full pre-commit check chain (`pnpm -r format && pnpm turbo run lint typecheck test`), code conventions (ESM only, explicit extensions, `#/*` subpath imports, no CSS-in-JS, oxlint + oxfmt), test structure rules (flat, no nested describe, prose names), PR title + body conventions (Conventional Commits, lowercase scope, Milestone / Closes / Plan impact), and the changeset policy (patch for docs, minor for features and breakings pre-1.0).

## 0.6.1

### Patch Changes

- 6a142ee: docs: simplify block reference headers and add inline usage snippets
- e708940: docs: add CONTRIBUTING.md

  First-class contributor guide covering dev setup (Node 24, pnpm 10.33.0, `pnpm install`, `pnpm dev`), the full pre-commit check chain (`pnpm -r format && pnpm turbo run lint typecheck test`), code conventions (ESM only, explicit extensions, `#/*` subpath imports, no CSS-in-JS, oxlint + oxfmt), test structure rules (flat, no nested describe, prose names), PR title + body conventions (Conventional Commits, lowercase scope, Milestone / Closes / Plan impact), and the changeset policy (patch for docs, minor for features and breakings pre-1.0).

## 0.6.0

## 0.5.0

### Minor Changes

- d565fcd: feat: flat token paths, per DTCG `$type`

  Token paths organize by DTCG `$type` at the root. Color primitives live under `color.palette.<hue>.*` (e.g. `color.palette.blue.500`); semantic color roles sit at `color.<role>.*` (`color.surface.default`, `color.text.default`, `color.accent.bg`). Other types follow the same flat pattern: `size.100` alongside `space.md`, `duration.fast` alongside `transition.enter`, `font.family.sans` alongside `typography.body`. No `ref` / `sys` / `cmp` tier prefix.

  CSS emission follows the paths: `--<prefix>-color-palette-blue-500`, `--<prefix>-color-surface-default`, `--<prefix>-typography-body-font-family`. `DEFAULT_CHROME_MAP` in core points each chrome role at its flat-path target.

  The reference and starter fixtures demonstrate the shape: per-type `.json` files under `tokens/` (`color.json`, `size.json`, `typography.json`, …) plus resolver modifier overlays under `tokens/themes/`.

## 0.4.0

### Minor Changes

- 01fdcb0: feat(core): chrome config with hard-coded literal defaults

  Blocks now read ten chrome variables in a fixed `--swatchbook-*` namespace
  (`--swatchbook-surface-default`, `--swatchbook-accent-bg`, etc.),
  independent of the project's `cssVarPrefix`. Every chrome variable is
  always declared — by default to hard-coded light-mode literals in
  `DEFAULT_CHROME_MAP` (`#ffffff`, `#111827`, `system-ui, …`, etc.), so
  zero config still gives readable themed chrome.

  To wire chrome to your own tokens, supply a `chrome` map keyed by role
  name. Any role you set becomes a `var(--<prefix>-<your-token>)`
  reference that flips with your theme switches; the rest stay on the
  literal defaults:

  ```ts
  swatchbookAddon({
    config: {
      chrome: {
        surfaceDefault: "color.brand.bg.primary",
        textDefault: "color.brand.fg.primary",
        accentBg: "color.brand.accent.primary",
      },
    },
  });
  ```

  Composite sub-field targets (`'typography.sys.body.font-size'`) are
  accepted. Unknown roles and unresolved targets produce `warn`
  diagnostics (group `swatchbook/chrome`) and fall back to the literal
  default.

  The closed set of roles is exported as `CHROME_ROLES` with the
  `ChromeRole` type and the default map as `DEFAULT_CHROME_MAP`, all from
  `@unpunnyfuns/swatchbook-core`.

  **Breaking (blocks internals):** `chromeAliases()` and `CHROME_VARS` are
  removed from `@unpunnyfuns/swatchbook-blocks` — blocks no longer need to
  rewire the project prefix on every wrapper because chrome vars are a
  fixed namespace. Consumers only importing the public block components
  are unaffected.

## 0.3.0

### Minor Changes

- 8e89d8d: Add `<Diagnostics />` block. Renders the project's load diagnostics — parser errors, resolver warnings, disabled-axes validation issues, etc. — as a collapsible severity-colored list. Auto-opens when the project carries errors or warnings; stays collapsed for clean loads. Consumers compose it on their own MDX pages alongside `<TokenNavigator />` / `<TokenTable />` to replace what the Design Tokens panel used to show at the top of its tree.
- 3d2d4bd: **Breaking**: remove the addon's Design Tokens panel. Composing `<Diagnostics />` + `<TokenNavigator />` + `<TokenTable />` on an MDX page now serves the same role the panel played — see the [token-dashboard guide](https://unpunnyfuns.github.io/swatchbook/guides/token-dashboard). The `PANEL_ID` constant is removed from the public API; the `swatchbook/design-tokens` panel tab is no longer registered. Channel events and everything outside the panel itself are unchanged.
- 3fb0acf: Two behavioural changes to the list-style blocks (`TokenTable`, `ColorPalette`, `TokenNavigator`-adjacent, `TypographyScale`, `DimensionScale`, `FontWeightScale`, `GradientPalette`, `StrokeStyleSample`, `FontFamilySample`, `BorderPreview`, `ShadowPreview`):

  - **Fix empty renders for typed-but-differently-pathed tokens.** Every block defaulted its `filter` prop to its `$type` name (`filter = 'fontFamily'`, `filter = 'dimension'`, etc.), which treated the type name as a **path** glob. Projects whose token paths don't coincidentally start with the type name (e.g. `font.ref.weight.*` for `fontWeight`) rendered as empty. Defaults removed — the `$type` check inside each block already scopes correctly, `filter` is purely additive for narrowing.
  - **Add `sortBy` / `sortDir` props.** `sortBy: 'path' | 'value' | 'none'` (default `'path'`, except `DimensionScale` and `FontWeightScale` which default to `'value'` to preserve their pixel/weight-ordered layout). `sortDir: 'asc' | 'desc'`. `'value'` ordering uses numeric magnitude for `dimension` / `duration` / `fontWeight`, perceptual oklch L → C → H for `color`, lexicographic for `fontFamily` / `strokeStyle`, and falls through to path for composites where a one-dimensional "value" isn't meaningful.

- e6dd438: **Breaking**: `<TokenTable />` redesign — compact two-column layout (`Path | Value`) with a click-to-open `<TokenDetail>` slide-over. The row's value cell renders the type pill + color swatch + formatted value inline. The `showVar` prop is removed; the CSS var is one click away in the drawer. Table layout is now `auto` (no fixed percentage widths) with per-column `min-width` floors so columns follow content and stop collapsing on narrow containers. Consumers who want to own the follow-up UI can pass `onSelect(path)` to suppress the built-in drawer. The `<TokenNavigator />` drawer is unchanged in behavior but now shares the same overlay component internally (no visible difference).

### Patch Changes

- a82552f: Fix blocks inheriting Storybook MDX docs element styling. Every block's outer wrapper now carries a `data-swatchbook-block` marker, and the blocks package mounts a scoped stylesheet (`[data-swatchbook-block] table, ul, li, details, summary, … { all: revert-layer }`) that neutralizes `.sbdocs` element styles bleeding into the chrome. Consumers no longer need to wrap blocks in `<Unstyled>` on MDX docs pages — blocks look the same in stories and in docs.
- a2b5fcc: Unify block chrome: text colors, surface backgrounds, and border weights now come from named constants in `internal/styles` (`TEXT_MUTED`, `TEXT_DEFAULT`, `SURFACE_DEFAULT`, `SURFACE_MUTED`, `SURFACE_RAISED`, `BORDER_DEFAULT`, `BORDER_STRONG`, `BORDER_FAINT`) instead of inline `var(--sb-*)` strings repeated across 15+ files. Empty-state divs are replaced by a shared `EmptyState` component. No visual change for valid configs; fallback alphas now match across blocks.
- c6aab6d: Fix value display across every block: TokenTable, TokenDetail, TokenNavigator, AxisVariance, CompositeBreakdown, DimensionScale, StrokeStyleSample now route one-line value strings through a single `formatTokenValue` helper that honors the active color-format dropdown for color tokens and known composites (border, shadow, gradient). Typography / transition / cubicBezier / dimension / fontFamily get dedicated stringifications instead of raw JSON dumps; only truly-foreign shapes fall through to truncated JSON now.

## 0.2.2

### Patch Changes

- 9a775be: Tighten the addon's HMR watch-path matching. File-path matches now require a path-separator boundary (`/project/resolver.json` no longer also matches `/project/resolver.json.backup`), and `picomatch.scan` replaces the hand-rolled glob-to-dir regex — brace-expansion patterns (`tokens/{base,overlays}/**/*.json`) and nested globstars now derive the correct watch root.
- cdf37dc: Fix `ColorPalette` success-state wrapper missing the `chromeAliases` spread that PR #324 added elsewhere. The empty-state wrapper got the alias layer; the main grid wrapper didn't, so consumers on any `cssVarPrefix` other than `sb` saw fallback colors for border / text chrome on the populated ColorPalette block. One-line fix — all other blocks were already correct.
- 416d5b7: Surface two previously-silent misconfiguration cases as `warn` diagnostics:

  - `swatchbook/resolver` — resolver modifier with no `default` and no contexts. Previously collapsed to an axis with an empty-string `default` and propagated into theme names; now users see "Resolver modifier X has no default and no contexts — axis is unusable" in the Design Tokens panel.
  - `swatchbook/project` — `config.disabledAxes` filtered out every theme. Previously rendered an empty tree with no hint; now the diagnostic names the pinned axes and suggests checking that their default contexts appear in the resolver's permutations.

  Both are diagnostics, not errors — the project still loads. No behavior change for valid configs.

## 0.2.1

### Patch Changes

- e86d414: Fix block chrome rendering when `cssVarPrefix` is anything other than `sb`. Blocks were referencing their own chrome (surface, borders, text, accent) via literal `var(--sb-color-sys-*)`, which fell through to fallback values for every project on the post-0.2.0 default prefix (`swatch`) or any custom prefix. Each block wrapper now spreads a CSS custom-property alias layer redirecting the `--sb-*` names to the project's actual prefix; chrome renders correctly regardless of prefix.

## 0.2.0

### Minor Changes

- 2f733b5: **BREAKING:** Prefix `data-*` attributes with `cssVarPrefix`. `emitCss` now emits `[data-<prefix>-mode="Dark"][data-<prefix>-brand="Brand A"]` instead of `[data-mode="Dark"][data-brand="Brand A"]`, and the addon's preview decorator writes the matching prefixed attrs on `<html>`. Default prefix becomes `swatch` (applied in `loadProject` when config omits one); set `cssVarPrefix: ''` to keep the bare `data-<axis>` form. Fixes collisions with third-party libs that claim generic `data-mode` / `data-theme` (Tailwind, many theme-switcher plugins).

  Also adds `dataAttr(prefix, key)` export from `@unpunnyfuns/swatchbook-core` so consumer code setting these attrs manually stays in lockstep.

  Docs reframed to clarify that swatchbook is a **DTCG token documentation tool**, not a runtime theme-switcher or CSS-variable framework. The toolbar's axis switching is a documentation affordance for inspecting tokens across every context; the emitted CSS + attrs are internal scaffolding, not a production theming API.

## 0.1.5

### Patch Changes

- 89d48a1: Declare `"sideEffects": false` on all three published packages. No CSS imports, no module-level work that isn't gated behind used-export reachability. Gives consumer bundlers permission to tree-shake unused exports more aggressively.

## 0.1.4

## 0.1.3

## 0.1.2

## 0.1.1

## 0.1.0

### Minor Changes

- 9d862a3: `Config.default` now takes a partial tuple object (`{ axisName: contextName }`) instead of a composed permutation string. Partial tuples fill omitted axes from each axis's own `default`; unknown axis keys and invalid context values surface as `warn` diagnostics (group `swatchbook/default`) and are sanitized out. Omit `default` entirely to start in the all-axis-defaults tuple.

  Migration: replace `default: 'Light · Default'` with `default: { mode: 'Light', brand: 'Default' }` (or omit the field if the all-defaults tuple is fine).

- 5072345: New `Config.disabledAxes?: string[]` suppresses declared axes from the toolbar, CSS emission, and theme enumeration without editing the resolver. Each listed axis pins to its `default` context: `Project.axes` drops it, `Project.themes` collapses to the default-context slice, CSS emission stops including it in compound selectors, and the addon's toolbar skips the dropdown. The tokens panel shows a small pinned indicator so the suppression stays visible. Unknown axis names surface as `warn` diagnostics (group `swatchbook/disabled-axes`) and are ignored. Filtered-out names land on the new `Project.disabledAxes: string[]` for downstream tooling. Config-level only — no runtime toggle.
- 0cb84fd: Drop the explicit-layers theming input. The DTCG 2025.10 resolver is now the sole theming input — `Config.themes`, the `ThemeConfig` type, and `resolveThemingMode` are all gone. Consumers with a layered config must move to a `resolver.json`.

  Theme names come from the resolver's modifier contexts: single-axis resolvers use the modifier value directly (context `Light` → theme name `Light`), multi-axis resolvers keep Terrazzo's JSON-encoded permutation ID. Pick sensible modifier context names in your resolver; what you write is what consumers see.

  The `themingMode` field on the virtual module is also removed — there's only one mode to be in.

- 6c7bfe5: Drop Tokens Studio `$themes` manifest support. The DTCG 2025.10 resolver is now the spec-native theming input; consumers using a manifest should convert to a `resolver.json` (the transformation is mechanical). `Config.manifest` is removed, `resolveThemingMode` returns `'layered' | 'resolver'`, and `themingMode` on the virtual module narrows accordingly. `@unpunnyfuns/swatchbook-tokens-reference` no longer exports `manifestPath`.
- 8db913b: Extend `defineSwatchbookConfig` with an `axes` shape for authored layered configurations — no DTCG resolver file required. Each axis lists its contexts as ordered file lists that overlay onto `tokens`; the loader parses `[...base, ...overlaysInAxisOrder]` once per cartesian tuple with alias resolution (last-write-wins on duplicate token paths). `Config.resolver` is now optional; setting both `resolver` and `axes` throws. Layered axes surface on `Project.axes` with `source: 'layered'`.
- d45d5da: Multi-axis permutation IDs now join tuple values with `·` instead of Terrazzo's JSON-encoded format, so data-attribute values and toolbar labels stay readable. Single-axis resolvers are unchanged (modifier value used directly). Consumers pinning theme names by string (`parameters.swatchbook.theme`, `Config.default`) update from `'Light'` / `'Dark'` to `'Light · Default'` / `'Dark · Default'` when switching to a multi-axis resolver. The stringification is a stopgap until `Project.axes` exposes modifier structure directly (issue #131).
- 37933a3: `Config.tokens` is now optional when `config.resolver` is set. The resolver's own `$ref` targets fully determine what gets loaded, and `Project.sourceFiles` exposes every file touched so the addon's Vite plugin can derive HMR watch paths without a parallel `tokens` glob. Supplying `tokens` alongside `resolver` still works — the watch paths union with the resolver-derived set, useful when you want HMR to watch broader directories than the resolver references.

  Plain-parse (no resolver, no axes) and layered (`axes` set) modes still require `tokens` — the loader has no other starting point. Configs that omit `resolver`, `axes`, AND `tokens` now throw a descriptive error at load time.

- abf657d: CSS emission now keys per-axis instead of per-composed-theme. Multi-axis projects emit one `:root` block carrying the default-tuple values plus one block per non-default cartesian tuple, each keyed on a compound attribute selector in `Project.axes` order (`[data-mode="Dark"][data-brand="Brand A"] { … }`). Every var is redeclared per tuple — flat emission stays correct when axes collide at the same token path (`brand-a.json` overriding `color.sys.surface.default` already set by `mode.dark`), where nested cascading would need cross-axis collision analysis. Single-axis projects (one resolver modifier, or the synthetic `theme` axis) keep the familiar `[data-theme="…"]` shape. `emitCss` takes a new optional `axes` in `EmitCssOptions`; `projectCss` routes `project.axes` in by default.
- c1a8c71: Expose modifier axes as first-class on `Project`. `Project.axes: Axis[]` surfaces each DTCG resolver modifier with its `contexts`, `default`, `description`, and `source` (`'resolver' | 'synthetic'`); projects loaded without a resolver get a single synthetic `theme` axis. A new `permutationID(input)` utility centralizes the tuple-to-string logic previously inlined in the resolver loader — single-axis tuples stringify to the context value; multi-axis tuples join with `·`. The virtual `virtual:swatchbook/tokens` module now also exports `axes`, so toolbar and panel work in follow-up PRs can key on tuples rather than flat theme names.
- 04b3f44: Named tuple presets — `defineSwatchbookConfig({ presets })` now takes an ordered list of `{ name, axes, description? }` entries. Each preset names a partial axis tuple (any axis the preset omits falls back to that axis's `default` when applied). Core validates presets at `loadProject` time: unknown axis keys and invalid context values surface as `warn` diagnostics and are sanitized out, but the preset itself is preserved (an empty preset is still a valid tuple). Project gains a `presets` field, the virtual module gains a `presets` export, and the addon broadcasts presets alongside axes/themes on `INIT_EVENT`. The toolbar renders presets as quick-select pills next to the axis dropdowns: clicking a pill writes the composed tuple into `globals.swatchbookAxes` + `globals.swatchbookTheme`, highlights the pill whose tuple matches the current selection, and shows a subtle modified-marker dot if the user tweaks an axis dropdown after applying a preset.

### Patch Changes

- 4ca9bb3: Align `storybook` peerDependency range on `@unpunnyfuns/swatchbook-addon` with `@unpunnyfuns/swatchbook-blocks` (`^10.3.5`). Consumers pinning Storybook to 10.3.0–10.3.4 previously satisfied the addon floor but failed the blocks floor.
- 1986a0f: Add standard npm publish metadata — `license` (MIT), `repository`, `homepage`, `bugs`, `author`, `keywords` — to all three published packages. No runtime change; required for registry discoverability, npm provenance attestation, and legal clarity ahead of the v0.1.0 release.
