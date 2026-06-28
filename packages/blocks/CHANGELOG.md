# @unpunnyfuns/swatchbook-blocks

## 0.66.1

### Patch Changes

- d769fa8317949bcecbfb68ed85841befe1e890b7: Docs: add a guide for displaying tokens as stories (mounting the blocks as CSF stories for a sidebar token catalog)
  - @unpunnyfuns/swatchbook-core@0.66.1

## 0.66.0

### Minor Changes

- 7d59091a0d2af06a3bd112eaa9e91b06e79215fc: ColorTable renders the shared per-row indicator strip (alias chain, reverse referents, axis-variance, deprecation, opt-in `$description`) in place of the old Alias column, strikes through deprecated names, and accepts the same `indicators` prop to configure it
- 9a0bc02ae579381e2e427a7292fd8f99178da541: Add an opt-in `composes` row indicator: composite-typed tokens (typography, border, transition, gradient, shadow) show a `⊞ N` count of the parts they bundle. Off by default; enable via `indicators={{ composes: true }}` on TokenNavigator / TokenTable
- d97f56587a31ad2134b4b189d2c8f545e3c8649a: Add a project-wide config.indicators baseline for the block row-indicator strip; per-block indicators props override it

### Patch Changes

- Updated dependencies [d97f565]
  - @unpunnyfuns/swatchbook-core@0.66.0

## 0.65.0

### Minor Changes

- 45bfa73ef9776f502b8d6659a10feaf45300ee39: TokenNavigator and TokenTable accept an `indicators` prop to configure the per-row indicator strip: turn it off, drop individual indicators, or opt into a new `ⓘ` `$description` glyph

### Patch Changes

- 77dd2996b254eec76a3876fba486c97becf12c5b: Docs: describe the axis-variance indicator and toolbar behavior generically over the project's own axes, rather than presenting the dogfood's `mode`/`brand`/`contrast` as the canonical set
- Updated dependencies [d2d24f9]
  - @unpunnyfuns/swatchbook-core@0.65.0

## 0.64.0

### Minor Changes

- 5f4170589b1d17359a453af69ca65258fd1e8a68: TokenTable rows carry the same alias chain, reverse-reference count, axis-variance, out-of-gamut, and deprecation indicators as the navigator, in a dedicated column, with alias references that open the referenced token's detail

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.64.0

## 0.63.0

### Minor Changes

- 0d23825d44d3a9454201637a7d08dadc3505be85: TokenNavigator rows show alias chain, reverse-reference count, axis-variance, out-of-gamut, and deprecation indicators, with click-to-navigate on alias references

### Patch Changes

- Updated dependencies [0d23825]
  - @unpunnyfuns/swatchbook-core@0.63.0

## 0.62.4

### Patch Changes

- aa504a1d4494d2842c1e2ebae091c8fdf07265bc: TokenNavigator, TokenTable, and ColorTable now keep their expand, selection, and search state when you flip a theme axis on an MDX docs page (Storybook remounts docs blocks on a globals change, which previously reset that state).
  - @unpunnyfuns/swatchbook-core@0.62.4

## 0.62.3

### Patch Changes

- ad9b1efc315f854d783606c77b653e1d372c364f: Restructure the docs site: a product-showcase frontpage, a Concepts section, Quickstart in Guides, and an integrations reference entry.
- Updated dependencies [ad9b1ef]
  - @unpunnyfuns/swatchbook-core@0.62.3

## 0.62.2

### Patch Changes

- 4fbeb8638206991ddfc87ece7f76079195ff2c0b: Documentation accuracy sweep across the docs site and READMEs.
- Updated dependencies [4fbeb86]
  - @unpunnyfuns/swatchbook-core@0.62.2

## 0.62.1

### Patch Changes

- 1e2edb4ffd4031c3a04a7b18f06aac11d2b8a84d: Size the composite motion preview's loop to the token's real duration instead of a fixed 1200ms
- d34f06cf17c47381ff17be04d7e30489d0bcf4d6: Widen the Storybook peer range to ^10.1.0 (support all of Storybook 10.x), validated by a CI floor guard
- Updated dependencies [e864728]
  - @unpunnyfuns/swatchbook-core@0.62.1

## 0.62.0

### Minor Changes

- 8c90cbdad4b162fee9eaacd68b26cc8a86ff7317: upgrade Terrazzo to 2.3.0 and raise the @terrazzo/parser and @terrazzo/plugin-css peer floors to ^2.3.0

### Patch Changes

- 404d6d55a828c4e748332a1e3e7fcd9aa4401cf2: remove the unused @terrazzo/token-tools dependency and export TOKENS_UPDATED_EVENT (the dev-time HMR wire event, now the single source shared with the addon)
- 9b5e9af5eda4ccc4d13b7df10b6197116ba99b76: Condense the changelogs and switch to a one-line-per-change changelog format.
- 53ddc4be3beef24901f537cb49df7b7e09c3f639: Documentation review follow-ups.
- 68921f889d051cb0de99c237eb6bc906b008680e: fix addon live-update staleness: useToken now tracks the live toolbar axis tuple over the channel in provider-less (MDX/autodocs) renders, and a per-story axis override no longer sticks to the <html> attributes after navigating to an MDX docs page (blocks now expose useChannelGlobals)
- 004ba35e96d32621cec0611afc1d3215b7e4e5a1: fix blocks failing to import standalone (outside Storybook) due to a hard dependency on the addon's virtual:swatchbook/tokens module; blocks now read an injected snapshot via the new registerTokenSource, which the addon preview calls at init
- 2fac127f5238c7e9fe31f14225273ffbaa54b55c: fix blocks sortTokens and GradientPalette ignoring colorSpace on wide-gamut tokens; both now route through the shared colorjs construction (new core parseColor) so perceptual sort and gradient swatches respect display-p3 / a98-rgb / prophoto-rgb
- c74f6e3e454ea25716fc7858d1f97104139dcfd1: fix blocks rendered inside stories staying stale after a dev-time token save: the addon decorator now builds its ProjectSnapshot and resolveAt from the live token store (updated on HMR) instead of the static virtual-module exports (blocks now expose useTokenSnapshot)
- f2ec59040b4a5d93cbffa1959bc8a874d533ece5: fix four more low-severity bugs: AliasedBy hiding shared descendants in diamond alias graphs, the switcher preset active-match against a sparse tuple, the MCP server version reporting the css-var prefix, and css-in-js emitting duplicate exports when group names collide
- 61416a9ed722073e7472ebc7a2feb339e86a291e: fix TokenDetail crashing when a token appears or disappears between renders (useProject was called after a conditional early return)
- Updated dependencies [ed9d942]
- Updated dependencies [9b5e9af]
- Updated dependencies [53ddc4b]
- Updated dependencies [7b8a851]
- Updated dependencies [2fac127]
- Updated dependencies [8e918b1]
- Updated dependencies [c5ace24]
- Updated dependencies [4ddd679]
- Updated dependencies [86a42fe]
- Updated dependencies [8c90cbd]
  - @unpunnyfuns/swatchbook-core@0.62.0

## 0.61.0

### Minor Changes

- 84b450c: Public API renames (breaking, clean break, no aliases): blocks `FontFamilySample`→`FontFamilyPreview`, `StrokeStyleSample`→`StrokeStylePreview`, `DimensionKind`→`DimensionVisual` (prop `kind`→`visual`), dropped `ProjectSnapshot.presets`/`disabledAxes`; addon `parameters.swatchbook.permutation`→`themeName`, removed dead `parameters.swatchbook.theme`/`swatchbookTheme`/`PARAM_KEY`, `SwatchbookPluginOptions`→`SwatchbookTokensPluginOptions`; mcp `get_color_contrast` output `ratio`→`value`; core removed `Diagnostic.column`. Migration: rename the imports, props, and parameters.

### Patch Changes

- Updated dependencies [84b450c]
  - @unpunnyfuns/swatchbook-core@0.61.0

## 0.60.10

### Patch Changes

- deecf14: Tighten the "Built with AI" docs prose.
- Updated dependencies [deecf14]
  - @unpunnyfuns/swatchbook-core@0.60.10

## 0.60.9

### Patch Changes

- a639114: Add a "Built with AI" disclosure to the docs.
- Updated dependencies [a639114]
  - @unpunnyfuns/swatchbook-core@0.60.9

## 0.60.8

### Patch Changes

- 2e8035d: `TokenNavigator` no longer resets its expand/collapse state when the active tuple changes; state persists across settings changes and re-seeds only when `initiallyExpanded` changes.
- 6a57fbb: `TokenNavigator` restores keyboard focus to the first visible row when the focused token disappears from the tree.
- 141280a: `TokenUsageSnippet` emits a CSS property matching the token's `$type` instead of always `color:`.
  - @unpunnyfuns/swatchbook-core@0.60.8

## 0.60.7

### Patch Changes

- fb5e8ae: The release workflow's `release` environment now gates only on publish runs, not on every push to main.
- dd8608d: Internal release: ships the security-infrastructure documentation into the current minor's docs snapshot.
- Updated dependencies [fb5e8ae]
- Updated dependencies [dd8608d]
  - @unpunnyfuns/swatchbook-core@0.60.7

## 0.60.6

### Patch Changes

- 619b7b8: Expose `Config.maxJointArity` (default `4`) to override the cap on per-token joint-divergence arity probing.
- 95ddfa3: The addon's Vite plugin now excludes its virtual module IDs from Vite's `optimizeDeps` pre-bundling.
- Updated dependencies [619b7b8]
- Updated dependencies [95ddfa3]
  - @unpunnyfuns/swatchbook-core@0.60.6

## 0.60.5

### Patch Changes

- 48725a8: `emitAxisProjectedCss`'s joint-block emission scales per-token (capped at 4 axes) rather than as a cartesian over project axes; a previously >1h hang on a 12-axis project now completes in milliseconds.
- Updated dependencies [48725a8]
  - @unpunnyfuns/swatchbook-core@0.60.5

## 0.60.4

### Patch Changes

- 79d6c68: Add `reference/concepts.mdx` consolidating Swatchbook's mental model.
- 401b4de: Add `reference/diagnostics.mdx` cataloging every `swatchbook/<group>` diagnostic the core can emit.
- aacc744: `loadProject` emits phase-bounded timing to stdout when `SWATCHBOOK_LOG_VERBOSE=1` is set.
- Updated dependencies [79d6c68]
- Updated dependencies [401b4de]
- Updated dependencies [aacc744]
  - @unpunnyfuns/swatchbook-core@0.60.4

## 0.60.3

### Patch Changes

- 65a7865: Substitute DTCG `$ref` objects in modifier values against the resolver's baseline output at write-extraction time, fixing a colorjs.io crash on unresolved `{ $ref }` objects.
- Updated dependencies [65a7865]
  - @unpunnyfuns/swatchbook-core@0.60.3

## 0.60.2

### Patch Changes

- d2c7cfb: The color-shape validator diagnostic now names the JSON Pointer when `components` carries an unresolved DTCG `$ref` object.
- Updated dependencies [d2c7cfb]
  - @unpunnyfuns/swatchbook-core@0.60.2

## 0.60.1

### Patch Changes

- c3ded5b: Patch release shipping the PR #1002 docs audit fixes into the stable docs snapshot.
- 0868ed5: When the smart emitter's `transformCSSValue` throws on a malformed `$value`, the error names the token path, axis permutation, and offending `$value`, with the original attached as `cause`.
- 2e6352a: Validate color token `$value` shape at load time, reporting DTCG color objects whose `components` field is missing or non-array.
- Updated dependencies [c3ded5b]
- Updated dependencies [0868ed5]
- Updated dependencies [2e6352a]
  - @unpunnyfuns/swatchbook-core@0.60.1

## 0.60.0

### Minor Changes

- 65adff6: Replace `Project.cells` + `Project.jointOverrides` + `Project.varianceByPath` with a single walkable `Project.tokenGraph`; per-tuple resolution is now a pure graph walk.

  **Breaking (pre-1.0 minor):** those three fields are removed — use `Project.tokenGraph` + helpers from the new `@unpunnyfuns/swatchbook-core/graph` subpath (`resolveAt`, `resolveAllAt`, `resolveAliasAt`, `resolveAliasAllAt`, `getVariance`, `getAffectedBy`, `listPaths`). `@unpunnyfuns/swatchbook-core/resolve-at` subpath removed → use `/graph`. `Project.resolveAt(tuple)` and MCP `get_axis_variance` wire shape unchanged.

  Reference-fixture wire payload: 607 KB → 45 KB un-gzipped.

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

- c270b8c: Brand `TupleKey` for canonical-tuple-key strings (`canonicalKey` / `jointOverrideKey` return it; exported from core). Compile-time only; JSON and Map lookups unchanged.
- Updated dependencies [c270b8c]
- Updated dependencies [3e9e310]
  - @unpunnyfuns/swatchbook-core@0.59.0

## 0.58.1

### Patch Changes

- acfb0a5: Wrap the search-query state with `useDeferredValue` in `<TokenTable>`, `<TokenNavigator>`, and `<ColorTable>` so heavy filter memos run at React's tempo.
- 12a9059: Two blocks perf fixes: `GroupRow` in `<ColorTable>` wrapped in `React.memo`; `<Diagnostics>` collapses three `diagnostics` traversals into one memoized `summarize()` walk.
- 63541d6: Narrow `useMemo` dep arrays in `TokenTable`, `ColorPalette`, `ColorTable`, and the addon preview decorator to the specific fields each memo consumes.
- ea60c22: `<TokenNavigator>` perf cleanup: `LeafPreview`/`LeafRow` wrapped in `React.memo`; the focused-path repair effect replaced with a render-time `useMemo`.
  - @unpunnyfuns/swatchbook-core@0.58.1

## 0.58.0

### Minor Changes

- 33550f4: Drop the composed `data-<prefix>-theme` attribute; per-axis attributes are the actual scoping surface. `themeAttrs(prefix, tuple)` signature change (now takes the active tuple); new `perAxisAttrs(prefix, tuple)` helper fixes a visual bug where `AxisVariance` grid swatches all showed the active tuple's color; preview decorator stops writing `data-<prefix>-theme`; `themeNameForTuple` removed (synthesize with `tupleToName`).

### Patch Changes

- c1da921: `<DetailOverlay>` sets `inert` on every other top-level body branch while mounted, restoring siblings' state on unmount.
- 1f2af27: Add `aria-live` polite live regions for `<CopyButton>` copy success and `<TokenTable>`/`<TokenNavigator>` search match-count.
- 39b3b2a: `<MotionSample>`'s reduced-motion fallback wraps the media-query identifier in `<code>` instead of literal backticks so screen readers don't read them verbatim.
- 1d4453e: Add disclosure semantics (`aria-haspopup="dialog"`) to clickable `<TokenTable>` rows and `<ColorTable>` group rows.
- ecf7823: Three ThemeSwitcher / addon-toolbar / Diagnostics a11y touches: addon toolbar `aria-haspopup` relaxed to generic; ThemeSwitcher `OptionPill` drops focus-stealing `onMouseDown` preventDefault; Diagnostics gains explicit `role="list"` + per-row severity `aria-label`.
- 3de4efb: `<TokenNavigator>` treeitem rows now carry full WAI-ARIA tree-position metadata (`aria-level` / `aria-setsize` / `aria-posinset`).
- f73637a: Tighten the canonical `Project` type surface — readonly + closed-set narrowing pass (`chrome` keyed by `ChromeRole`, readonly `axes`/`sourceFiles`, exhaustiveness `default:` branches). Closes #940
- 1f65ada: Tighten weak / smoke-only test assertions across packages so each pins a falsifiable invariant.
- Updated dependencies [f73637a]
- Updated dependencies [1f65ada]
  - @unpunnyfuns/swatchbook-core@0.58.0

## 0.57.1

### Patch Changes

- Updated dependencies [0e0cc7a]
  - @unpunnyfuns/swatchbook-core@0.57.1

## 0.57.0

### Minor Changes

- 975944d: Consolidate the two divergent path-matchers onto a single `@unpunnyfuns/swatchbook-core/match-path` subpath on the conventional glob spec (`*` = one segment, `**` = any). Blocks-side migration: `filter="color.*"` (all descendants) → `filter="color.**"`.
- 87e4c44: Breaking blocks-surface vocabulary rename "permutation"→"theme": `PermutationContext`→`ThemeContext`, `useActivePermutation()`→`useActiveTheme()`, `ProjectSnapshot.activePermutation`→`activeTheme`, `ProjectData.permutationNameForTuple`→`themeNameForTuple`. Closes #896

### Patch Changes

- 3302705: Enable a batch of oxlint quality rules (`no-inline-comments`, `import/extensions`, `eqeqeq`, etc.) and autofix-sweep the codebase.
- cb161ec: Enable `import/consistent-type-specifier-style: prefer-top-level` so mixed-syntax type imports are autofixed to pure top-level form.
- c5d9089: Five small helper consolidations across addon/blocks/switcher/core: new `/style-element` core subpath (`ensureStyleElement`), `presetTuple` from switcher, `cells.ts` reuses `value-key.ts`, addon reads `COLOR_FORMATS.includes()` from blocks, shared `pickInitFields` for `INIT_EVENT`.
- 4146d9f: Brand the public `TokenMap` shape as `SwatchbookToken` (seven-field subset of Terrazzo's `TokenNormalized`); `Project.defaultTokens`/`resolveAt()` return it. Closes #892
- 062276b: Add `@unpunnyfuns/swatchbook-core/themes` subpath (`tupleToName`, `enumerateThemes`, types), eliminating duplicated theme-name enumeration across 4 packages.
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

### Minor Changes

- afaebb8: `AxisVarianceResult` is now a discriminated union on `kind` (`constant` / `single` / `multi`); JSON wire shape unchanged. New `AxisVariancePerAxis` helper type. Closes #825
- de4cc3d: The cartesian-era `Project.permutations` / `permutationsResolved` / `Permutation` / `permutationID()` exit core's public surface; `Project.graph`→`Project.defaultTokens`; blocks `ProjectSnapshot.permutations`/`permutationsResolved`/`VirtualPermutation` removed. Migration: use `project.resolveAt(tuple)` and `project.defaultTokens`. Closes #815

### Patch Changes

- d54dd78: Internal-only: strip stale JSDoc / inline comments referencing the cartesian-drop chain.
- a310586: Split `packages/blocks`'s vitest config into node + browser projects (the `.ts` vs `.tsx` discriminator). Closes #818
- 182e82d: Internal: blocks test fixtures provide `cells`/`jointOverrides`/`defaultTuple` via a new `withCellsShape` helper; drops the legacy `permutationsResolved`-only fallback.
- b962d1f: Sweep `fireEvent` out of blocks/addon browser-mode tests in favor of `userEvent` from `@vitest/browser/context`.
- b8372c1: Internal: core's `Project.permutations`/`permutationsResolved` consumers (`buildCells`, `validateChrome`) route through abstractions upstream of the singleton enumeration. Part 2 of 3 for #815.
- 808d146: Consolidate the duplicated blocks-side wire-shape type declarations; `VirtualTokenListingShape` aliases core's `SlimListedToken`, `virtual.d.ts` imports from `#/contexts.ts`, `disabledAxes` declared. Closes #819
- 0def2d3: Consolidate the three `dataAttr` impls onto a single `@unpunnyfuns/swatchbook-core/data-attr` subpath. Closes #824
- fe5fa59: Consolidate the two `makeCssVar` impls onto a new `@unpunnyfuns/swatchbook-core/css-var` subpath.
- 144e07d: The addon's global-axis applier and the blocks channel-globals subscriber content-dedupe on a stringified fingerprint, so one toolbar change no longer fans out to 3× updates. Closes #837
- 158f2e1: Delete legacy cartesian-era code paths: `analyzeAxisVariance()` + its `/variance` subpath (use `project.varianceByPath.get(path)`), `buildJointOverrides()` shim, `emitCss()`, addon's `composeProjectCss()`.
- 444433e: Test-only: tighten the silently-returning `swatchbook/resolver` test; add `prefers-reduced-motion.test.tsx` covering the Chromatic detector. Closes #823, #832
- 0f10c72: Drop trivial `.toBeDefined()` assertions on Testing Library finder results across the blocks suite (38 sites). Partial close of #829.
- 5953b56: Eliminate 11 of 13 `as string`/`as number` casts that worked around `noUncheckedIndexedAccess`. Partial close of #835.
- 8fbe3e9: `useProject()`'s returned `ProjectData` is now memoized against stable inner-field identities instead of being rebuilt every render. Fixes #817
- a7025fe: Collapse `JointOverrides` from `ReadonlyMap` to `ReadonlyArray<readonly [string, JointOverride]>` — the shape consumers already saw on the wire. Closes #866
- 09d957f: Internal: non-core read sites route off `Project.permutations`/`permutationsResolved` through `cells`/`resolveAt`/`varianceByPath`/`defaultTuple`. Part 1 of 3 for #815.
- 63eb55a: Drop the last `as unknown as` cast in `preview.tsx` by structurally aligning `VirtualTokenShape` with `buildResolveAt`'s return. Closes #863
- a2a0c61: `sortTokens` pre-computes per-token sort keys once (Schwartzian transform) instead of recomputing the Oklch conversion per comparison. Closes #836
- 575ccb6: Split four multi-`describe` test files into one-file-per-describe per project convention. Closes #858
- 686c5b0: Add `play()` coverage to the seven previously-uncovered token-detail story files. Closes #831
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

- 674944b: Expose `buildResolveAt` via the new core `./resolve-at` subpath; blocks consume `resolveAt(activeTuple)` instead of indexing `permutationsResolved[activePermutation]`, and `ProjectData` exposes `resolveAt`.
- 905161d: Drop `projectCss` + `emit.ts` and `emitTypes`; `emitAxisProjectedCss` becomes the single emitter. Drop the addon's `emitMode` option and `composeProjectCss`; MCP `emit_css` calls `emitAxisProjectedCss` directly. Breaking for consumers who imported `projectCss` or set `emitMode: 'cartesian'`.
- af73dc4: Lift `resolveAt` to the preview decorator (built once per iframe) and ship it through `SwatchbookContext`; drop wire-shipped `permutations`/`permutationsResolved`/`defaultPermutation`. Closes #793
- f09066f: MCP and integrations switch from indexing `permutationsResolved[name]` to `project.resolveAt(tuple)`; MCP builds a `tupleByName` map once per project. Tool I/O unchanged.
- f1cf2db: Add `Project.cells`, `Project.jointOverrides`, `Project.defaultTuple`, and `Project.resolveAt(tuple)` alongside the cartesian shape, bounded by `Σ(axes × contexts)`. Additive.
- d29813e: Add `Project.varianceByPath` — per-token `AxisVarianceResult` cached at load time for O(1) lookup.
- 5178532: Ship `cells`/`jointOverrides`/`varianceByPath`/`defaultTuple` over the virtual module + HMR snapshot (additive); `AxisVariance` drops its `analyzeAxisVariance(...)` call for an O(1) `varianceByPath[path]` lookup.

### Patch Changes

- e161fdb: Index permutations by canonical tuple key once per snapshot, exposed as `permutationNameForTuple(tuple)` on `ProjectData`; `AxisVariance` drops per-cell `permutations.find` scans.
- 0932217: Rewrite the joint-overrides build to probe via `resolver.apply` directly, returning `overrides` + `jointTouching`; `buildVarianceByPath` consumes `jointTouching`, fixing a false-positive touch class.
- 9de9db9: The layered loader enumerates `Σ(axes × contexts)` singleton tuples instead of `Π(contexts)` cartesian. `Config.maxPermutations` guard, `cartesianSize()`, `permutationGuardDiagnostic()`, `DEFAULT_MAX_PERMUTATIONS`, and the `swatchbook/permutations` warn removed (pre-1.0 minor). Migration: drop `maxPermutations` from config.
- a2f776e: `loadProject` no longer calls `resolver.listPermutations()`; the resolver loader enumerates only singletons (bounded by `Σ(axes × contexts)`). `Project.cells` now stores delta cells for non-default contexts. `resolvePermutation()` / `ResolvedPermutation` removed (pre-1.0 minor).
- e170124: Smart emitter + `analyzeProjectVariance` Phase 1 read `project.cells` directly instead of `findPermByTuple → permutationsResolved`. Internal refactor, same output.
- 83224fb: Smart emitter compound-block emission + `analyzeProjectVariance` Phase 3 read `project.jointOverrides` directly. Internal refactor, same output.
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

- 8fb128c: Add the addon's `emitMode: 'cartesian' | 'projected'` option (default `'projected'`); the smart axis-projected emitter backs the virtual-module `css` export.
- 31999ef: Remove the unused `permutations` prop from `<ThemeSwitcher>` and the `SwitcherPermutation` type from public exports.
- 7b4225a: Add `emitAxisProjectedCss(permutations, permutationsResolved, options?)` as an opt-in alternative to `emitCss`/`projectCss` — `:root` baseline + per-axis cell deltas. Additive.
- 5ed6b04: Rewrite `emitAxisProjectedCss` to route per-token between projection and compound selectors via `analyzeProjectVariance`; spec-faithful for any DTCG resolver. Signature changed to `(project, options)` (`@internal`).
- 812676f: Add internal `analyzeProjectVariance(project)` classifying every token's axis variation (baseline / single / orthogonal-after-probe / joint-variant). Analysis only.

### Patch Changes

- ded154d: Docs-only: honest the orthogonality framing on `emitAxisProjectedCss` — projection is a lossy size optimization, cartesian (`emitCss`) is the spec-faithful default.
- Updated dependencies [8fb128c]
- Updated dependencies [31999ef]
- Updated dependencies [7b4225a]
- Updated dependencies [ded154d]
- Updated dependencies [5ed6b04]
- Updated dependencies [812676f]
  - @unpunnyfuns/swatchbook-core@0.54.0

## 0.53.0

### Minor Changes

- 3be6285: `TokenNavigator` now implements the full WAI-ARIA tree-view keyboard pattern (roving tabindex; arrow/Home/End/Enter/Space traversal); the `<li role="treeitem">` is the focusable element. Queried DOM unchanged.

### Patch Changes

- 6d0919f: Replace `Record<string, unknown>` casts for reading DTCG composite `$value` shapes with named per-`$type` interfaces in a new `internal/composite-types.ts`.
- 33de453: `DetailOverlay` implements the WAI-ARIA dialog focus management — focus moves into the panel, Tab is trapped, dismissal restores focus to the opener.
  - @unpunnyfuns/swatchbook-core@0.53.0

## 0.52.0

### Patch Changes

- 00a1bf7: Consolidate parallel type definitions: blocks' `Virtual*Shape` types alias core's authoritative `Axis`/`Permutation`/`Diagnostic`/`Preset`; `Axis.contexts` and `Permutation.sources` tighten to `readonly`. Side cleanups: new `cssVarAsNumber` blocks helper and `SwatchbookGlobals`/`StoryParameters` addon types.
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

- 0b14715: Rename the cartesian-product surface from `themes` to `permutations` across the public API (`Project.themes`→`permutations`, `resolveTheme()`→`resolvePermutation()`, `Theme`→`Permutation`, `useActiveTheme()`→`useActivePermutation()`, etc.). Drop legacy single-name channels (`parameters.swatchbook.theme`, `globals.swatchbookTheme`). New `Config.maxPermutations` guard (default 1024) with a `swatchbook/permutations` warn. CSS attrs, `ThemeSwitcher`, and package names unchanged.

### Patch Changes

- c53cef9: Add visible `:focus-visible` focus indicators (2px outlines) on `<TokenNavigator>` rows, `<TokenTable>` rows, and `<ThemeSwitcher>` pills for keyboard users.
- Updated dependencies [c9b31ed]
- Updated dependencies [0b14715]
  - @unpunnyfuns/swatchbook-core@0.50.0

## 0.20.6

### Patch Changes

- a333b06: Render every non-color token through plugin-css's `previewValue` from the Token Listing, with a `cleanFloatNoise` post-processor scrubbing IEEE-754 artifacts. Local `gradient`/`typography`/`transition` fallback formatters dropped.
  - @unpunnyfuns/swatchbook-core@0.20.6

## 0.20.5

### Patch Changes

- 9bdd8da: Add `./style.css` to each package's `exports` map so consumers can deliberately link the stylesheet.
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

- d0e2fc8: `<ColorTable>` wraps its `<table>` in a horizontally-scrollable `.sb-color-table__scroll` div so wide rows no longer push the surrounding container.
  - @unpunnyfuns/swatchbook-core@0.20.2

## 0.20.1

### Patch Changes

- d1ddb2e: `MotionSample` falls back to its static reduced-motion state inside Chromatic's snapshot runner (via user-agent detection) so captures are deterministic.
  - @unpunnyfuns/swatchbook-core@0.20.1

## 0.20.0

### Minor Changes

- 33f17a1: Add `<OpacityScale>` — renders each opacity token as the sample color at that opacity over a checkerboard backdrop. Default filter `'**.opacity.*'`, default `sampleColor` `'color.accent.bg'`.

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.20.0

## 0.19.9

### Patch Changes

- 2444c4e: Rework every package README to a ~50-line human-register opening, pushing detail-dense reference to the docs site.
- Updated dependencies [2444c4e]
  - @unpunnyfuns/swatchbook-core@0.19.9

## 0.19.8

### Patch Changes

- a753766: Rework every package README to a ~50-line human-register opening, pushing detail-dense reference to the docs site.
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

- 52a5660: `<ConsumerOutput>` (and `<TokenDetail>`) renders one extra row per non-CSS platform in the Token Listing — load `@terrazzo/plugin-swift`/`-android`/`-sass`/`-js` via `config.terrazzoPlugins` and name it in `config.listingOptions.platforms`. Exports `VirtualTokenListingShape` from blocks.

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

- 44483af: Adopt `@terrazzo/plugin-token-listing` as the authoritative source for per-token metadata; `loadProject` attaches a path-indexed `listing` map to `Project` (`names.css`, `previewValue`, original value, `source.loc`). `ColorTable` reads CSS var strings from the listing, falling back to `makeCssVar`. The snapshot now includes the `listing` slice.

### Patch Changes

- bc67608: Document the Terrazzo-alignment work from 0.15–0.17 (`cssOptions`/`listingOptions`/`terrazzoPlugins`, `Project.listing`, the `shared-terrazzo-options.ts` guide).
- 20909fa: Route blocks-side `makeCssVar` through Terrazzo's `makeCSSVar` from `@terrazzo/token-tools/css`, removing a parallel kebab-casing impl.
- dfe4d0b: Thread the Token Listing entry through `formatTokenValue` so composite display strings prefer `listing[path].previewValue`; non-color types always prefer listing, color prefers it only for `'hex'` format.
- Updated dependencies [9496c82]
- Updated dependencies [44483af]
  - @unpunnyfuns/swatchbook-core@0.18.0

## 0.17.0

### Minor Changes

- ef944c5: `ColorTable` collapses sibling variants into a single row with a pill selector; row click expands inline (surfacing `$description`, alias chain, and a per-variant sub-table) instead of opening a drawer. No `variants` map disables grouping (back-compat).

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.17.0

## 0.16.0

### Minor Changes

- c73585a: New `<ColorTable />` block — one row per color token with HEX, HSL, OKLCH, CSS var, and alias-target columns plus per-cell copy-to-clipboard. `<TokenTable />` and `<TokenDetail />` also gain copy-to-clipboard affordances via a shared `CopyButton` primitive.

### Patch Changes

- fba6841: Document `ColorTable`; refresh `TokenNavigator`/`TokenTable` entries to describe their search as fuzzy; note the copy-to-clipboard affordance.
  - @unpunnyfuns/swatchbook-core@0.16.0

## 0.15.0

### Minor Changes

- e702b29: Fuzzy search across `TokenNavigator`, `TokenTable`, and MCP `search_tokens` (case-insensitive, single-typo tolerant, out-of-order terms), replacing substring match. Core exports `fuzzyFilter` / `fuzzyMatches`, backed by `@leeoniya/ufuzzy`.

### Patch Changes

- Updated dependencies [e702b29]
  - @unpunnyfuns/swatchbook-core@0.15.0

## 0.14.1

### Patch Changes

- Updated dependencies [b5976cd]
  - @unpunnyfuns/swatchbook-core@0.14.1

## 0.14.0

### Patch Changes

- 249e448: Docs: stop documenting `emitCss`/`projectCss`/`emitViaTerrazzo` as user-facing APIs (still exported); point users at Terrazzo's CLI for production emission.
- Updated dependencies [171c9aa]
  - @unpunnyfuns/swatchbook-core@0.14.0

## 0.13.1

### Patch Changes

- 3ce116a: Retire versioned documentation snapshots for 0.4-0.12; the 0.13 snapshot becomes the single baseline. Flip Concepts/Integrations navbar entries to proper `docSidebar` entries.
  - @unpunnyfuns/swatchbook-core@0.13.1

## 0.13.0

### Patch Changes

- 018f518: Add `get_axis_variance` MCP tool + extract the variance algorithm into core (`analyzeAxisVariance`), driving both the `AxisVariance` block and the tool.
- ecc4e74: Docs: new guide for migrating from `@storybook/addon-themes`.
- fea3791: Docs: add an Integrations entry to the top navbar.
- 34a71e7: Docs: new Integrations section covering `@unpunnyfuns/swatchbook-integrations` with `/tailwind` and `/css-in-js` recipes.
- 4349d23: Docs: reference/core gains an `emitViaTerrazzo` section, `ParserInput`/`SwatchbookIntegration` type docs, and the `Project.cwd`/`Project.parserInput` fields.
- f2914ae: Docs reorg: Concepts promoted to a top-level navbar entry; `theme-reactivity`→`guides/consuming-the-active-theme`; `concepts/diagnostics` folded into the `<Diagnostics />` block reference.
- a6d6f97: Docs: raise contrast on light-theme Prism syntax highlighting (`#d73a49`→`#b31d28`, ~6.4:1) for several token classes.
- 851d791: fix(tokens): resolve dark-mode accent contrast failure + push High-contrast to AAA — `dark.json` overrides `accent.bg` to `blue.500` (4.85:1), and a `color.accessible.accent.*` namespace aliased by `contrast-high.json` lands 10.36:1 (Light+HC) / 14.63:1 (Dark+HC).
- Updated dependencies [018f518]
- Updated dependencies [f03161f]
- Updated dependencies [74e755c]
  - @unpunnyfuns/swatchbook-core@0.13.0

## 0.12.0

### Patch Changes

- 1cc3eee: fix(a11y): underline body-content links (scoped to `.markdown a`) so color isn't the sole distinguisher, addressing WCAG 1.4.1 and 1.4.11.

## 0.11.6

### Patch Changes

- 4fd054c: docs: strip remaining pitch residue from the intro's "What the addon includes" section.
- 3cff041: docs: rewrite the intro's "What the addon gives you" section as prose under subheadings.
- 77c5f23: docs: prose sweep removing pitch-language tells + adopt two orphaned concept pages (`axes-vs-themes`, `theme-reactivity`) into the sidebar.

## 0.11.5

### Patch Changes

- fbcbf6c: docs(tokens): match the switcher's axis order to the resolution order (mode → typeface → a11y).

## 0.11.4

### Patch Changes

- 58853c3: docs(tokens): a11y=High-contrast escalates base font through each typeface's `base-accessible` accessibility slot, composing typeface × a11y per tuple.

## 0.11.3

### Patch Changes

- c50f0ab: docs(tokens): separate a11y from typeface — drop the `font.family` block from the a11y overlay so a11y owns contrast only.
- c50f0ab: docs(tokens): rename `brand` axis to `typeface`, swap a11y primary to amber, route Monotype through a comic-monospace stack.

## 0.11.2

### Patch Changes

- ad92a1a: docs: soften the intro's "What it's not" paragraph; reframe `emitCss` as the same-shape output available to consumer apps.
- b1102c8: docs(tokens): rename `brand` axis to `typeface`, swap a11y primary to amber, route Monotype through a comic-monospace stack.

## 0.11.1

### Patch Changes

- b0ce33e: docs: surface the full package set (add `mcp` + `switcher`) across the root README, CONTRIBUTING, a new switcher README, and the intro.
- a294673: docs: restore the `swatchbook-*` prefix in each package README's title header so it matches the published package name on npm.

## 0.11.0

### Patch Changes

- 4d6a946: docs(tokens): give the docs-site's a11y axis real contrast boost via mode-aware `color.accessible.*` alias indirection (e.g. Light `primary.default` ~4.8:1 → ~9.5:1).
- 50e5d3a: docs: new "The token pipeline" concept page covering how tokens reach blocks via the Vite virtual module rather than a prebuild step.
- 60a9c76: fix(docs): route latest release at `/` and main-branch at `/next/`; routing-config fix, no content changes.

## 0.10.2

### Patch Changes

- 9aaad81: docs: add a "For developers" section to the docs site (landing page, Architecture, Sharp corners).

## 0.10.1

### Patch Changes

- 548b041: chore(blocks): drop the misleading `storybook-addon` npm keyword (blocks ships MDX doc blocks, not the addon).
- 9722153: docs(blocks): move hooks into a dedicated reference page; correct stale "not re-exported from addon" claims.
- c1e6b98: fix(blocks): hoist `TokenNavigator`'s `matchCount` `useMemo` above the empty-state early return so a zero-match arg no longer throws "Rendered fewer hooks than expected".

## 0.10.0

## 0.9.0

## 0.8.0

### Minor Changes

- cd64451: feat: partial HMR for token edits — saving a token file re-renders the preview in place via a custom `swatchbook/tokens-updated` HMR event instead of a full reload; toolbar state, args, scroll, and overlays survive. New `useTokenSnapshot()` hook in blocks.

## 0.7.0

## 0.6.2

### Patch Changes

- 1971275: fix(blocks): honor the color-format selector in `<ShadowPreview>`/`<BorderPreview>`/`<GradientPalette>` by routing through the shared `formatColor`.
- 97a32bb: fix(blocks): surface sub-value alias chains in `<CompositeBreakdown>`, walking transitively via Terrazzo's `partialAliasOf`.
- 1b5989c: fix(blocks): align the detail-overlay close button with the panel's 16px padding.

## 0.6.1

## 0.6.0

### Minor Changes

- 4aeb6ab: feat(blocks): runtime search input on `<TokenTable>` and `<TokenNavigator>` (default on, case-insensitive substring); adds `searchable?: boolean`.
- 5ac3528: feat(blocks): `type` prop on `<TokenNavigator>` to scope the tree by DTCG `$type` (single string or array), composing with `root`.

## 0.5.0

### Minor Changes

- d565fcd: feat: flat token paths per DTCG `$type` (color primitives under `color.palette.<hue>.*`, semantic roles at `color.<role>.*`, etc.); no `ref`/`sys`/`cmp` tier prefix. CSS emission and `DEFAULT_CHROME_MAP` follow the flat paths.

## 0.4.0

### Minor Changes

- 01fdcb0: feat(core): chrome config with hard-coded literal defaults — blocks read ten chrome variables in a fixed `--swatchbook-*` namespace independent of `cssVarPrefix`, defaulting to light-mode literals in `DEFAULT_CHROME_MAP`; supply a `chrome` map to wire roles to your tokens. Breaking (blocks internals): `chromeAliases()` and `CHROME_VARS` removed.

## 0.3.0

### Minor Changes

- 8e89d8d: Add `<Diagnostics />` block rendering the project's load diagnostics as a collapsible severity-colored list; auto-opens on errors/warnings.
- 3d2d4bd: Breaking: remove the addon's Design Tokens panel (compose `<Diagnostics />` + `<TokenNavigator />` + `<TokenTable />` instead); `PANEL_ID` removed from the public API.
- 3fb0acf: Two behavioral changes to list-style blocks: remove the `$type`-name `filter` default (fixed empty renders for typed-but-differently-pathed tokens); add `sortBy` / `sortDir` props.
- e6dd438: Breaking: `<TokenTable />` redesign — compact two-column `Path | Value` layout with a click-to-open `<TokenDetail>` slide-over; `showVar` prop removed, table layout now `auto`. Pass `onSelect(path)` to own the follow-up UI.

### Patch Changes

- a82552f: Fix blocks inheriting Storybook MDX docs element styling — each wrapper carries a `data-swatchbook-block` marker + a scoped `revert-layer` stylesheet, so consumers no longer need `<Unstyled>`.
- a2b5fcc: Unify block chrome (text colors, surfaces, border weights) into named constants in `internal/styles`; shared `EmptyState` component. No visual change for valid configs.
- c6aab6d: Route one-line value strings across every block through a single `formatTokenValue` helper that honors the color-format dropdown; dedicated stringifications for typography/transition/cubicBezier/dimension/fontFamily.

## 0.2.2

### Patch Changes

- 9a775be: Tighten the addon's HMR watch-path matching — path-separator boundary on file matches, and `picomatch.scan` replaces the hand-rolled glob-to-dir regex.
- cdf37dc: Fix `ColorPalette`'s populated-grid wrapper missing the `chromeAliases` spread, so non-`sb` `cssVarPrefix` consumers no longer saw fallback chrome colors.
- 416d5b7: Surface two previously-silent misconfigurations as `warn` diagnostics: `swatchbook/resolver` (modifier with no default and no contexts) and `swatchbook/project` (`disabledAxes` filtered out every theme).

## 0.2.1

### Patch Changes

- e86d414: Fix block chrome rendering when `cssVarPrefix` is anything other than `sb` — each wrapper spreads a CSS custom-property alias layer redirecting `--sb-*` to the project's actual prefix.

## 0.2.0

### Minor Changes

- 2f733b5: BREAKING: prefix `data-*` attributes with `cssVarPrefix` (e.g. `[data-<prefix>-mode="Dark"]`); default prefix becomes `swatch`, set `cssVarPrefix: ''` for the bare form. Adds `dataAttr(prefix, key)` export. Fixes collisions with libs claiming generic `data-mode`/`data-theme`.

## 0.1.5

### Patch Changes

- d5f2a03: Move `format-color.ts` out of `src/internal/` to `src/format-color.ts` (it's public API). No consumer-visible API change.
- 89d48a1: Declare `"sideEffects": false` on all three published packages for more aggressive tree-shaking.

## 0.1.4

### Patch Changes

- be1ee1f: Tidy npm keywords: drop `storybook-addon` from blocks, add `design`/`style` to the addon.

## 0.1.3

### Patch Changes

- 34e6255: Fix the toolbar's color-format switcher having no effect on blocks in MDX docs pages — `useColorFormat()` subscribes to `globalsUpdated`/`updateGlobals`/`setGlobals` as a fallback when no provider is mounted.
- 04c9c2f: Fix MDX-rendered blocks flickering back to defaults one frame after an axis/color-format change — lift channel-derived globals to a module-level `useSyncExternalStore` store that survives remounts.
- 5dd94fe: Fix MDX blocks rendering defaults for one frame when the toolbar's URL-persisted selection is non-default — subscribe at module load and re-add the `setGlobals` handler.

## 0.1.2

### Patch Changes

- e298dc3: Fix axis switching on MDX docs pages — write `data-<axis>` attributes to `<html>` from a module-level channel subscription independent of any decorator run, and pick up `setGlobals` in the blocks fallback.

## 0.1.1

## 0.1.0

### Minor Changes

- 943fda9: Add a color-format switcher (`hex`/`rgb`/`hsl`/`oklch`/`raw`) across `TokenTable`, `TokenDetail`, and `ColorPalette` via a new `swatchbookColorFormat` global + toolbar dropdown; out-of/wide-gamut colors fall back to `rgb()` with a ⚠ marker. Display only.
- 3741dc7: `ColorPalette`'s `groupBy` prop is now optional — grouping is derived from the filter (one level below the fixed prefix, clamped to keep leaf labels) when omitted.
- c593297: `TokenDetail` grows a two-surface color swatch and a composite sub-value breakdown (typography/shadow/border/transition/gradient field lists; multi-layer shadow headers; gradient stops by position).
- 7a631dc: Add `<ConsumerOutput>` subcomponent to `<TokenDetail>` — two copyable rows for the token dot-path and its CSS variable reference, plus an "Active tuple" indicator.
- dfb5ec6: Add `DimensionScale` block rendering dimension tokens as bars sized to their actual value; three kinds (`'length'`/`'radius'`/`'size'`), bars over 480px capped, sorted ascending by pixel value.
- 0cb84fd: Drop the explicit-layers theming input — the DTCG 2025.10 resolver is now the sole theming input; `Config.themes`, `ThemeConfig`, `resolveThemingMode`, and `themingMode` removed. Migration: move layered configs to a `resolver.json`.
- 6c7bfe5: Drop Tokens Studio `$themes` manifest support — `Config.manifest` removed; convert manifests to a `resolver.json`. `resolveThemingMode` returns `'layered' | 'resolver'`.
- bdcc784: Extract standalone per-token sample primitives from `MotionPreview`/`ShadowPreview`/`BorderPreview`/`DimensionScale`: `MotionSample`, `ShadowSample`, `BorderSample`, `DimensionBar` (each takes `path: string`). Parent blocks unchanged.
- 9b5ecdc: Two new blocks for standalone font primitives: `FontFamilySample` (one row per `fontFamily` token with sample text + font stack) and `FontWeightScale` (one row per `fontWeight`, sorted ascending). `TokenDetail`'s `CompositePreview` gains matching branches.
- e091420: Add `<GradientPalette filter? />` block for DTCG `gradient` tokens plus a `gradient` branch on `TokenDetail`'s composite preview (default `linear-gradient(to right, …)`).
- 48bf3e5: Breaking: `SwatchbookProvider`, contexts, hooks, and `Virtual*Shape`/`ProjectSnapshot` types now live exclusively in `@unpunnyfuns/swatchbook-blocks` — no longer exported from the addon. Closes issue #202.
- 78ef794: Add `MotionPreview` block rendering motion tokens (transition / duration / cubicBezier) as a looping ball animation with a per-row spec strip and global speed control; respects `prefers-reduced-motion: reduce`.
- c1a8c71: Expose modifier axes as first-class on `Project` — `Project.axes: Axis[]` (with `contexts`/`default`/`description`/`source`); projects without a resolver get a synthetic `theme` axis. New `permutationID(input)` utility; virtual module now exports `axes`.
- 4737535: Add `ShadowPreview` and `BorderPreview` blocks applying composite tokens to a sample element with a sub-value breakdown; `ShadowPreview` handles layered (array) shadows.
- 1434e4e: Split `TokenDetail` into composable subcomponents (`TokenHeader`, `CompositePreview`, `CompositeBreakdown`, `AliasChain`, `AliasedBy`, `AxisVariance`, `TokenUsageSnippet`), each exported standalone. `TokenDetail` itself unchanged.
- 28b2473: New `StrokeStyleSample` block rendering DTCG `strokeStyle` tokens — string-form values display as a line at the computed `border-top-style`; object-form values render a textual fallback. Companion reference-fixture additions cover both forms plus a `number` group.
- 92d5ae6: Introduce `SwatchbookProvider` + `useSwatchbookData` + `ProjectSnapshot` for framework-free block rendering — blocks render in plain React, unit tests, and non-Storybook sites when a provider is in the tree. The addon's decorator mounts it automatically; virtual-module fallback stays.
- 4a986d8: `TokenDetail` renders an "Aliased by" tree walking Terrazzo's `aliasedBy` backward (ref→sys→cmp→other, alphabetical), capped at 6 hops; only renders when the token has direct consumers.
- 2f5bb68: `TokenDetail` renders live previews for composite types in its Resolved-value section (typography pangram, shadow/border sample card, animated transition ball; color keeps its swatch). Transition previews honor `prefers-reduced-motion`; `usePrefersReducedMotion` lifted to `internal/`.
- 0ec7ff3: `TokenDetail` renders visual previews for `dimension`/`duration`/`cubicBezier` primitives opened individually (sized bar; animated ball at the duration / easing curve), honoring `prefers-reduced-motion`.
- 881038e: Add `TokenNavigator` block — an expandable tree view of the token graph keyed on dot-path segments; interior groups show child counts, leaves show a `$type` pill + inline preview. Props `root?`/`initiallyExpanded?`/`onSelect?`; Enter/Space toggles/activates.
- b29dd7c: Tokens panel and `TokenDetail` are now axis-tuple aware — reading the active tuple from `globals.swatchbookAxes`; `TokenDetail` collapses constant tokens to one row, renders a 1-axis table for single-axis variation, and a two-axis matrix otherwise. `useProject()` returns `activeAxes`/`axes`.

### Patch Changes

- 4ca9bb3: Align the `storybook` peerDependency range on the addon with blocks (`^10.3.5`).
- 954c26b: Extract shared `wrapper`/`caption`/`empty` inline styles into `#/internal/styles.ts`. Pure refactor.
- f5ccc4d: Sort token paths numerically (`localeCompare(..., { numeric: true })`) so `blue.50` precedes `blue.100`; corrected the `ColorPalette` `RefBlue` story's `groupBy`.
- 1986a0f: Add standard npm publish metadata (`license`, `repository`, `homepage`, `bugs`, `author`, `keywords`) to all three published packages.
