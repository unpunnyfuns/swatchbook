# @unpunnyfuns/swatchbook-core

## 0.66.1

## 0.66.0

### Minor Changes

- d97f56587a31ad2134b4b189d2c8f545e3c8649a: Add a project-wide config.indicators baseline for the block row-indicator strip; per-block indicators props override it

## 0.65.0

### Patch Changes

- d2d24f92a1d05e5f3a2dfcffede64fdd7fcde455: `project.resolveAt` now preserves alias provenance, so an axis-varying alias keeps its own chain, target, and description at non-default tuples; the MCP's per-theme token introspection was returning the resolved leaf target's metadata instead of the alias's own

## 0.64.0

## 0.63.0

### Minor Changes

- 0d23825d44d3a9454201637a7d08dadc3505be85: TokenNavigator rows show alias chain, reverse-reference count, axis-variance, out-of-gamut, and deprecation indicators, with click-to-navigate on alias references

## 0.62.4

## 0.62.3

### Patch Changes

- ad9b1efc315f854d783606c77b653e1d372c364f: Restructure the docs site: a product-showcase frontpage, a Concepts section, Quickstart in Guides, and an integrations reference entry.

## 0.62.2

### Patch Changes

- 4fbeb8638206991ddfc87ece7f76079195ff2c0b: Documentation accuracy sweep across the docs site and READMEs.

## 0.62.1

### Patch Changes

- e86472885601ba38643dd8d152e984f9d7de419c: `Project.defaultTokens` now carries the documented slim `SwatchbookToken` shape (served through `resolveAt`), no longer leaking the resolver's internal Terrazzo fields

## 0.62.0

### Minor Changes

- 8c90cbdad4b162fee9eaacd68b26cc8a86ff7317: upgrade Terrazzo to 2.3.0 and raise the @terrazzo/parser and @terrazzo/plugin-css peer floors to ^2.3.0

### Patch Changes

- ed9d9420a829de74fe41fc33cc9a3bb964e83399: consolidate color formatting into core (new color-formats and format-color modules shared by blocks/mcp/addon); MCP color output now uses the shared canonical rendering (integer rgb, 6-digit hex)
- 9b5e9af5eda4ccc4d13b7df10b6197116ba99b76: Condense the changelogs and switch to a one-line-per-change changelog format.
- 53ddc4be3beef24901f537cb49df7b7e09c3f639: Documentation review follow-ups.
- 7b8a8518f3c7681d6d04f33e7aac7bec1f4db69e: fix resolveAliasAt leaking baseline alias metadata into literal and partial-alias write results, which emitted var() references to the old alias target
- 2fac127f5238c7e9fe31f14225273ffbaa54b55c: fix blocks sortTokens and GradientPalette ignoring colorSpace on wide-gamut tokens; both now route through the shared colorjs construction (new core parseColor) so perceptual sort and gradient swatches respect display-p3 / a98-rgb / prophoto-rgb
- 8e918b18d1e9d0c390b257a8d927e3ee787d10c5: fix tailwind/css-in-js integrations and MCP get_token/get_consumer_output reporting CSS var names that diverge from plugin-css output on camelCase paths; names now come from the listing via the new core cssVarName helper
- c5ace2417f217fc64ea539cb38904b6f9efbd3a8: fix cssOptions (legacyHex, transform) only reaching the listing build and not the axis-projected emitter, so preview CSS now matches the listing previewValue instead of diverging
- 4ddd67907693fe43d35d60b299942e8f25575e20: fix a failed token resolution (dangling alias) leaving a cycle marker in the shared memo, which made resolveAllAt return iteration-order-dependent values that disagreed with resolveAt
- 86a42fe94aed4d6d5cf94ec0d7b3c0fac70ff2c9: fix four low-severity correctness bugs: core hex fallback dropping the alpha byte of #rrggbbaa/#rgba, css-in-js buildTree misfiling a path that collides with a leaf, tailwind mis-bucketing camelCase font-size tokens into spacing, and MCP describe_project counting each token type once per theme

## 0.61.0

### Minor Changes

- 84b450c: Public API renames for clarity (breaking, no deprecated aliases). blocks: `FontFamilySample` → `FontFamilyPreview`, `StrokeStyleSample` → `StrokeStylePreview`, `DimensionKind` → `DimensionVisual` (prop `kind` → `visual`), drop unused `ProjectSnapshot.presets`/`disabledAxes`. addon: `parameters.swatchbook.permutation` → `themeName`, removed dead `parameters.swatchbook.theme`/`swatchbookTheme`/`PARAM_KEY`, `SwatchbookPluginOptions` → `SwatchbookTokensPluginOptions`. mcp: `get_color_contrast` output `ratio` → `value`. core: removed unused `Diagnostic.column`.

## 0.60.10

### Patch Changes

- deecf14: Tighten the "Built with AI" docs prose.

## 0.60.9

### Patch Changes

- a639114: Add a "Built with AI" disclosure to the docs (Introduction block + `developers/built-with-ai.mdx`).

## 0.60.7

### Patch Changes

- fb5e8ae: Release workflow's `release` environment now gates only on publish runs, not every push to main.
- dd8608d: Ship the security-infrastructure documentation into the current minor's docs snapshot.

## 0.60.6

### Patch Changes

- 619b7b8: Expose `Config.maxJointArity` (default `4`) to override the per-token joint-divergence arity probing cap.
- 95ddfa3: Exclude the addon's virtual module IDs from Vite's `optimizeDeps` pre-bundling so esbuild doesn't fail to resolve them.

## 0.60.5

### Patch Changes

- 48725a8: `emitAxisProjectedCss` joint-block emission now scales per-token (capped at 4 axes) instead of cartesian over project axes, fixing multi-axis emit hangs.

## 0.60.4

### Patch Changes

- 79d6c68: Add `reference/concepts.mdx` consolidating Swatchbook's mental model.
- 401b4de: Add `reference/diagnostics.mdx` cataloguing every `swatchbook/<group>` diagnostic and the runtime emit-error format.
- aacc744: `loadProject` emits phase-bounded timing to stdout when `SWATCHBOOK_LOG_VERBOSE=1` is set.

## 0.60.3

### Patch Changes

- 65a7865: Substitute DTCG `$ref` objects in modifier values against the resolver's baseline at write-extraction time, fixing a colorjs.io crash on unresolved refs.

## 0.60.2

### Patch Changes

- d2c7cfb: Color-shape validator diagnostic now names the JSON Pointer when `components` carries an unresolved `$ref` object.

## 0.60.1

### Patch Changes

- c3ded5b: Ship the PR #1002 docs audit fixes into the stable docs snapshot.
- 0868ed5: Smart-emitter `transformCSSValue` errors now name the token path, axis permutation, and offending `$value`, with the original error as `cause`.
- 2e6352a: Validate color token `$value` shape at load time, reporting DTCG color objects with missing or non-array `components` before they crash colorjs.io.

## 0.60.0

### Minor Changes

- 65adff6: Replace `Project.cells` + `Project.jointOverrides` + `Project.varianceByPath` with a single walkable `Project.tokenGraph`; per-tuple resolution is now a pure graph walk. Breaking: those three fields and the `/resolve-at` subpath are removed; use `Project.tokenGraph` + helpers from the new `@unpunnyfuns/swatchbook-core/graph` subpath (`resolveAt`, `resolveAllAt`, `resolveAliasAt`, `resolveAliasAllAt`, `getVariance`, `getAffectedBy`, `listPaths`). `Project.resolveAt(tuple)` and MCP `get_axis_variance` wire shape unchanged.

## 0.59.1

### Patch Changes

- 1792d02: Mark an axis whose `$extends` overlays can't be walked literally as wildcard-connected in the alias graph, preserving correctness at the cost of the orthogonality skip.
- 4f6073f: Optimize `probeJointOverrides` to skip orthogonal axis combinations via an alias-reachability graph; output byte-identical on every fixture.
- c9a401b: Tighten `isAxisComboConnected` to require a single connected component over the induced subgraph, culling combos spanning disjoint clusters.
- e27a20b: Make `expandReach` recursively chase `partialAliasOf` targets so the alias graph captures composites' full transitive reach.

## 0.59.0

### Minor Changes

- c270b8c: Brand `TupleKey` (`string & { __brand: 'TupleKey' }`) on `canonicalKey` / `jointOverrideKey` / `Project.jointOverrides`; exported from core. Structurally still `string`.

### Patch Changes

- 3e9e310: Fix `analyzeProjectVariance` docstring: layered multi-touch tokens classify as `orthogonal-after-probe`, not `joint-variant`.

## 0.58.0

### Minor Changes

- f73637a: Tighten the canonical `Project` type surface: `chrome` → `Partial<Record<ChromeRole, string>>`, `axes`/`sourceFiles` → `readonly`, `Permutation.input` → `Readonly`, `SnapshotForWire.varianceByPath` → direct `Record<…, AxisVarianceResult>`, `never` exhaustiveness branches on two closed-union switches, aligned `VirtualToken` with blocks' `VirtualTokenShape`. Closes #940.

### Patch Changes

- 1f65ada: Tighten weak / smoke-only test assertions across packages to pin falsifiable invariants.

## 0.57.1

### Patch Changes

- 0e0cc7a: Docs-site policy: keep one stable snapshot + current `docs/` rather than a per-minor archive. Removes the eight pre-0.57 versioned snapshots and updates `snapshot-docs-version.mjs` to drop prior `version-*/` dirs before writing.

## 0.57.0

### Minor Changes

- 76ba600: Remove the dead `emitViaTerrazzo` emitter and drop `Project.parserInput` from the public type (the `ParserInput` interface stays `@internal`). Bundle of audit #887.
- 975944d: Consolidate the two path-matchers onto a single `@unpunnyfuns/swatchbook-core/match-path` subpath using the conventional glob spec. Breaking: blocks' `filter="color.*"` now means a single segment; use `color.**` for all descendants.
- 4146d9f: Brand the public `TokenMap` shape as `SwatchbookToken` (the seven fields consumers read) so `Project.defaultTokens` / `resolveAt()` no longer leak Terrazzo's full `TokenNormalized`. Closes #892.
- 062276b: Add `@unpunnyfuns/swatchbook-core/themes` subpath (`tupleToName`, `enumerateThemes`, types) consolidating theme enumeration + tuple-join across 4 packages.

### Patch Changes

- 4bc19e8: Document public-surface exports that shipped without doc entries (`/themes`, `/match-path`, `/style-element` subpaths, `SwatchbookToken`, `jointOverrideKey`, `presetTuple`, color-formatting exports, `MotionSpeed`).
- f82eb5c: Doc-audit drift fixes (third of three) plus actually export the addon-namespace constants `addon.mdx` claimed importable.
- c69dec1: Refresh the npm landing page + apps/docs reference against the post-cartesian-drop public API.
- 6188fa8: Enable a batch of correctness-leaning oxlint rules without safe autofix (`no-throw-literal`, `no-inferrable-types`, `consistent-type-definitions: interface`).
- 3302705: Enable a batch of oxlint quality rules (`no-inline-comments`, `import/extensions`, `eqeqeq`, etc.) and sweep the codebase via autofix.
- cb161ec: Enable `import/consistent-type-specifier-style: prefer-top-level` and sweep mixed-syntax type imports to the pure form.
- c5d9089: Five small helper consolidations across addon, blocks, switcher, and core (new `/style-element` subpath, `presetTuple` export, `value-key` reuse, `COLOR_FORMATS` validation, `pickInitFields`).
- 55ee410: Four test-hygiene items: switcher `.browser.` infix, `diagnostics.test.ts` split, dropped cosmetic describes, cleaned ghost-field fixtures, new clean-config smoke test.

## 0.56.0

### Minor Changes

- afaebb8: `AxisVarianceResult` is now a discriminated union on `kind` (`constant` / `single` / `multi`); JSON wire shape unchanged. New `AxisVariancePerAxis` helper type. Closes #825.
- a01887f: Discriminate `Config` into `ResolverConfig` / `LayeredConfig` / `PlainConfig` via field-presence narrowing, so invalid shapes are compile errors. Zero call-site churn; runtime checks intact. Closes #865.
- 0def2d3: Consolidate the three `dataAttr` impls onto a single `@unpunnyfuns/swatchbook-core/data-attr` subpath. Closes #824.
- fe5fa59: Consolidate the two `makeCssVar` impls onto a new `@unpunnyfuns/swatchbook-core/css-var` subpath, dropping a hand-rolled drift-risk copy.
- 158f2e1: Delete legacy cartesian-era code paths: `analyzeAxisVariance()` + its `/variance` subpath, `buildJointOverrides()`, internal `emitCss()`, `composeProjectCss()`. Migration: use `project.varianceByPath.get(path)` and `probeJointOverrides(...).overrides`.
- de4cc3d: Remove `Project.permutations` / `permutationsResolved` + the `Permutation` type / `permutationID()` from the public surface; rename `Project.graph` → `Project.defaultTokens`. Closes #815.
- a7025fe: Collapse `JointOverrides` from `ReadonlyMap` to `ReadonlyArray<readonly [string, JointOverride]>` (the wire shape consumers already saw). Closes #866.
- 570211b: Drop the `ParserInput` type from core's barrel (still internal); `Project.parserInput` stays as an `@internal` optional field. Closes #820.
- fedef53: Extract the wire-format snapshot helper into a new `@unpunnyfuns/swatchbook-core/snapshot-for-wire` subpath (`SnapshotForWire`, `SlimListedToken`, `snapshotForWire`). First half of #819.

### Patch Changes

- d54dd78: Strip remaining stale JSDoc / inline comments referencing the cartesian-drop chain. Closes #827.
- b8372c1: Route core's own `permutations` / `permutationsResolved` consumers (`buildCells`, `validateChrome`) through upstream abstractions. Part 2 of 3 for #815.
- 40616f8: Extract three duplicated helpers (`canonicalKey`, `valueKey`, `cssEscape`) into dedicated files. First half of #824.
- a455b2b: Add explicit `.ts` extensions to every `#/`-prefixed import in `packages/core/test/*.ts`. Closes #828.
- a2e3971: Add a checked-in golden snapshot for `emitAxisProjectedCss` against the reference fixture. Closes #830.
- 444433e: Tighten a silently-returning `swatchbook/resolver` test and add `prefers-reduced-motion.test.tsx` Chromatic-detection coverage. Closes #823, #832.
- fa3878b: Docs fix-forward: reference and architecture pages no longer describe removed APIs. Closes #821.
- 5cf90c2: Remove the `swatchbook/project` warn diagnostic at `load.ts:107-113` (unreachable under singleton enumeration). Closes #852.
- 5953b56: Eliminate 11 of 13 `as string` / `as number` casts that worked around `noUncheckedIndexedAccess`, replacing each with proper narrowing. Partial close of #835.
- bd6a031: Extend the layered test fixture with composites and a multi-hop alias chain for real-data coverage. Closes #833.
- 09d957f: Route non-core `permutations` / `permutationsResolved` read sites through `cells` / `resolveAt` / `varianceByPath` / `defaultTuple`. Part 1 of 3 for #815.
- 1c84b01: Add direct unit tests for `probeJointOverrides` covering every algorithmic branch. Closes #822.
- 575ccb6: Split four multi-`describe` test files into one-file-per-describe. Closes #858.
- b1befb6: Document why the `./resolve-at` / `./fuzzy` subpaths exist (browser-safe) and drop four internal-only constants from the addon barrel. Closes #834.

## 0.55.0

### Minor Changes

- 674944b: Expose `buildResolveAt` via a new dep-free `./resolve-at` subpath; blocks now consume `resolveAt(activeTuple)` and `ProjectData.resolveAt`, falling back to `permutationsResolved` indexing for pre-cells snapshots.
- 905161d: Drop `projectCss` + `emit.ts` and the addon's `emitMode` option / `composeProjectCss`; `emitAxisProjectedCss` becomes the single emitter. Breaking for consumers importing `projectCss` or setting `emitMode: 'cartesian'`.
- 9de9db9: The layered loader now enumerates `Σ(axes × contexts)` singleton tuples instead of cartesian. Breaking: removes `Config.maxPermutations`, `cartesianSize()`, `permutationGuardDiagnostic()`, `DEFAULT_MAX_PERMUTATIONS`, and the `swatchbook/permutations` diagnostic.
- af73dc4: Lift `resolveAt` to the preview decorator and ship it through `SwatchbookContext`; drop wire-shipped `permutations` / `permutationsResolved` / `defaultPermutation`. Closes #793.
- a2f776e: Resolver-backed `loadProject` no longer calls `resolver.listPermutations()` — enumerates singletons only, bounding `resolver.apply` by `Σ(axes × contexts)`. `Project.cells` stores delta cells for non-default contexts. Breaking: removes `resolvePermutation()` and `ResolvedPermutation`.
- f09066f: Server-side MCP / integrations consumers switch from `permutationsResolved[name]` indexing to `project.resolveAt(tuple)`; MCP builds a `tupleByName` map. Tool I/O unchanged.
- f1cf2db: Add `Project.cells`, `Project.jointOverrides`, `Project.defaultTuple`, and `Project.resolveAt(tuple)` alongside the cartesian shape (additive); `resolveAt` is exact for joint variance at any arity.
- d29813e: Add `Project.varianceByPath` — per-token `AxisVarianceResult` cached at load time for O(1) lookup.
- 5178532: Ship `cells` / `jointOverrides` / `varianceByPath` / `defaultTuple` over the virtual module + HMR snapshot (additive); `AxisVariance` block uses the O(1) `varianceByPath` lookup.

### Patch Changes

- e161fdb: Index permutations by canonical tuple key once per snapshot (`permutationNameForTuple`), dropping `AxisVariance`'s per-cell `permutations.find` scans.
- 0932217: Rewrite the joint-overrides build to probe via `resolver.apply` directly, returning `overrides` + `jointTouching`; fixes a false-positive touching class.
- e170124: Smart emitter + `analyzeProjectVariance` Phase 1 cell construction now reads `project.cells` directly. Same output.
- 83224fb: Smart emitter compound-block emission + `analyzeProjectVariance` Phase 3 read `project.jointOverrides` directly. Same output.

## 0.54.0

### Minor Changes

- 8fb128c: Add the addon's `emitMode: 'cartesian' | 'projected'` option (default `'projected'`); the smart axis-projected emitter backs the virtual-module `css` export.
- 31999ef: Remove the unused `permutations` prop from `<ThemeSwitcher>` and the `SwitcherPermutation` type from public exports.
- 7b4225a: Add `emitAxisProjectedCss(permutations, permutationsResolved, options?)` as an opt-in alternative emitting a `:root` baseline + per-axis cell deltas. Additive; requires orthogonal axes.
- 5ed6b04: Rewrite `emitAxisProjectedCss` to route per-token between projection and compound selectors via `analyzeProjectVariance`, making it spec-faithful for any DTCG resolver. Signature → `(project, options)`; `@internal`.
- 812676f: Add internal `analyzeProjectVariance(project)` classifying every token's axis variance (baseline-only / single-axis / orthogonal-after-probe / joint-variant). Analysis only.

### Patch Changes

- ded154d: Honest the orthogonality framing on `emitAxisProjectedCss`: projection is a lossy size optimization, cartesian (`emitCss`) is the spec-faithful default. Docs only.

## 0.52.0

### Minor Changes

- 9e9f635: Align core's public export surface with the reference docs ahead of v1.0: retract `emitTypes` / `emitCss` / `EmitCssOptions` / `emitViaTerrazzo` (+ its option/result types) / `dataAttr`; `projectCss` stays public; document the surface that caught up to reality.
- 00a1bf7: Make blocks' `Virtual*Shape` types aliases of core's authoritative `Axis` / `Permutation` / `Diagnostic` / `Preset`; tighten `Axis.contexts` / `Permutation.sources` to `readonly`. Side cleanups: `cssVarAsNumber` helper, `SwatchbookGlobals` / `StoryParameters` types.

## 0.51.0

### Minor Changes

- b087e60: `config.resolver` now accepts bare package specifiers, preferring `cwd`-relative paths and falling back to `node_modules` resolution.

## 0.50.0

### Minor Changes

- 0b14715: Rename the cartesian-product surface from `themes` to `permutations` across the public API (`Project.themes` → `permutations`, `resolveTheme()` → `resolvePermutation()`, `Theme` → `Permutation`, etc.); drop legacy single-name channels (`parameters.swatchbook.theme`, `globals.swatchbookTheme`); add `Config.maxPermutations` guard (default 1024) defending against pathological cartesian enumeration.

### Patch Changes

- c9b31ed: Register `tsx` + `typescript` with Prism so `.tsx`/`.ts` fenced code blocks render highlighted.

## 0.20.5

### Patch Changes

- 198d331: Emit a `swatchbook/listing` warn diagnostic when the Token Listing build fails instead of returning an empty listing silently.

## 0.20.3

### Patch Changes

- dcdb9ee: Restructure `guides/sharing-terrazzo-options` so the shared-options module pattern leads, plus a "why plugin objects, not a `config.terrazzo` field?" section.

## 0.19.9

### Patch Changes

- 2444c4e: Rework every package README to the docs intro's register: human-register opener, detail pushed to the docs site. Total README line count ~700 → ~370.

## 0.19.8

### Patch Changes

- a753766: Rework every package README to the docs intro's register: human-register opener, detail pushed to the docs site. Total README line count ~700 → ~370.

## 0.19.7

### Patch Changes

- 74f57dc: Fix broken DTCG spec links (`design-tokens.org` → `www.designtokens.org`, path layout shift) across eight occurrences.

## 0.19.6

### Patch Changes

- d8937d3: Add `<ColorTable>` to the colors example + "Blocks at a glance" table, and add explicit `.mdx` extensions to every internal doc-to-doc link.

## 0.19.5

### Patch Changes

- 380435c: Add `<ColorTable>` to the colors example + "Blocks at a glance" table, and add explicit `.mdx` extensions to every internal doc-to-doc link.

## 0.19.4

### Patch Changes

- 6d76e77: Add explicit `.mdx` extensions to every internal doc-to-doc link so Docusaurus rewrites them correctly.

## 0.19.3

### Patch Changes

- 0e1ec9e: Add a short "If your stories use Tailwind or a CSS-in-JS library" section to the Quickstart.

## 0.19.2

### Patch Changes

- b876729: Lead the introduction with swatchbook's Terrazzo foundation rather than burying it under "What it isn't".

## 0.19.1

### Patch Changes

- 3b1ff9e: Fix two docs discoverability regressions: split `guides/integrations.mdx` back into three pages and group the Reference sidebar into Packages / Blocks / Model categories.

## 0.19.0

### Minor Changes

- 785486c: Tighten `Config.cssOptions`: strip `filename` and `skipBuild` (in addition to `variableName` / `permutations`) since neither was honored; deprecated `baseSelector` / `baseScheme` / `modeSelectors` now produce a `swatchbook/css-options` warn. Breaking: configs setting `filename`/`skipBuild` fail to typecheck.

### Patch Changes

- ba41ead: Declare `@terrazzo/parser` and `@terrazzo/plugin-css` as peer deps on swatchbook-core so pnpm hoists a single shared parser instance and surfaces mismatches at install time.
- 785486c: Expand the "Aligning with your token build" guide into a full per-knob primer covering `cssOptions` / `listingOptions` / `terrazzoPlugins`.
- 9fde68e: Correct the "Consuming the active theme" guide: swatchbook does ship React hooks; DOM observation is the cross-framework fallback, not the only option.
- 91c9901: Add a "Terrazzo dependencies" mini-section to the Quickstart clarifying the transitive installs and the two explicit-install cases.
- 40f3a68: Restructure the documentation: six nav pills → three (Guides / Reference / Developers), 23 pages → 15, tightened register.
- ca1e52a: Tighten the framing on `<TokenDetail>`'s Consumer Output rows and the alignment guide: swatchbook displays what the consumer's transformers emit, it doesn't transform tokens.

## 0.18.0

### Minor Changes

- 9496c82: New `defineSwatchbookConfig` props for sharing Terrazzo plugin options with the internal build: `cssOptions`, `listingOptions`, `terrazzoPlugins` (`variableName` / `permutations` / `filename` stay managed).
- 44483af: Adopt `@terrazzo/plugin-token-listing` as the authoritative source for per-token metadata; `loadProject` attaches a path-indexed `listing` map (`names.css`, `previewValue`, original value, `source.loc`) to `Project` and ships a slice over the virtual module + HMR channel.

## 0.15.0

### Minor Changes

- e702b29: Fuzzy search across `TokenNavigator`, `TokenTable`, and MCP `search_tokens` (single-typo-tolerant, out-of-order terms); core exports `fuzzyFilter` / `fuzzyMatches`, backed by `@leeoniya/ufuzzy`.

## 0.14.1

### Patch Changes

- b5976cd: Mark `emitCss`, `projectCss`, `emitTypes`, `emitViaTerrazzo`, and their option/result types as `@internal`; exports stay to preserve 0.13-era call sites.

## 0.14.0

### Minor Changes

- 171c9aa: Auto-inject CSS-side-effect integrations into the Storybook preview via `SwatchbookIntegration.virtualModule.autoInject: true`; the Tailwind integration opts in, dropping the consumer's explicit `import`.

## 0.13.0

### Minor Changes

- f03161f: Add `emitViaTerrazzo(project, options)` — axis-aware wrapper around `@terrazzo/parser`'s programmatic `build()`. Also ships a pnpm patch for `@terrazzo/plugin-css-in-js@2.0.3` fixing a dashed-path-segment crash.

### Patch Changes

- 018f518: Add `get_axis_variance` MCP tool + extract the variance algorithm into core (`analyzeAxisVariance`), shared with the `AxisVariance` block.
- 74e755c: Retain Terrazzo's parser output on `Project.parserInput` and `cwd` on `Project.cwd`; add `SwatchbookIntegration` to the public type surface. Additive.

## 0.11.1

### Patch Changes

- a294673: Restore the `swatchbook-*` prefix in each package README's title header so npm pages show the published package name.

## 0.7.0

### Patch Changes

- a9d1a1c: Serve main-branch docs at `/` instead of the last-cut release (`lastVersion: 'current'`).
- 94b1b3e: Add a DTCG-aware theme switcher to the docs-site navbar via the shared `@unpunnyfuns/swatchbook-switcher` package, with a second `a11y` axis.
- b947c99: Wire Docusaurus Infima theming through a swatchbook token pipeline; `custom.css` maps Infima vars onto the emitted `--sb-color-*` vars.
- e571197: Split the Docs nav into per-category top-level entries (Quickstart, Concepts, Blocks, Guides, Reference).
- 887cb0a: Split the docs sidebar per section so the left rail stops duplicating the navbar.

## 0.6.2

### Patch Changes

- 97a32bb: Simplify block reference headers with inline usage snippets, and add CONTRIBUTING.md.

## 0.6.1

### Patch Changes

- 6a142ee: Simplify block reference headers and add inline usage snippets.
- e708940: Add CONTRIBUTING.md covering dev setup, pre-commit checks, code conventions, PR conventions, and the changeset policy.

## 0.5.0

### Minor Changes

- d565fcd: Flat token paths organized by DTCG `$type` at the root (no `ref` / `sys` / `cmp` tier prefix); CSS emission and `DEFAULT_CHROME_MAP` follow the flat paths.

## 0.4.0

### Minor Changes

- 01fdcb0: Chrome config with hard-coded literal defaults: blocks read ten chrome vars in a fixed `--swatchbook-*` namespace independent of `cssVarPrefix`; supply a `chrome` map to wire roles to your tokens. Breaking (blocks internals): `chromeAliases()` and `CHROME_VARS` removed.

## 0.3.0

### Minor Changes

- 8e89d8d: Add `<Diagnostics />` block rendering the project's load diagnostics as a collapsible severity-colored list; auto-opens on errors/warnings.
- 3d2d4bd: Breaking: remove the addon's Design Tokens panel (compose `<Diagnostics />` + `<TokenNavigator />` + `<TokenTable />` instead); `PANEL_ID` removed from the public API.
- 3fb0acf: List-style blocks: fix empty renders for typed-but-differently-pathed tokens (drop the `$type`-as-path `filter` default), and add `sortBy` / `sortDir` props.
- e6dd438: Breaking: `<TokenTable />` redesign — compact two-column `Path | Value` layout with a click-to-open `<TokenDetail>` slide-over; `showVar` prop removed; pass `onSelect(path)` to suppress the built-in drawer.

### Patch Changes

- a82552f: Fix blocks inheriting Storybook MDX docs element styling via a `data-swatchbook-block` marker + scoped `revert-layer` stylesheet; no more `<Unstyled>` wrapping needed.
- a2b5fcc: Unify block chrome onto named constants in `internal/styles` and a shared `EmptyState` component. No visual change for valid configs.
- c6aab6d: Route every block's one-line value strings through a single `formatTokenValue` helper honoring the active color-format dropdown, with dedicated stringifications per type.

## 0.2.2

### Patch Changes

- 9a775be: Tighten the addon's HMR watch-path matching: require a path-separator boundary and use `picomatch.scan` for brace-expansion / nested-globstar watch roots.
- cdf37dc: Fix `ColorPalette` success-state wrapper missing the `chromeAliases` spread, so non-`sb` prefixes no longer show fallback chrome colors.
- 416d5b7: Surface two previously-silent misconfiguration cases as warn diagnostics: `swatchbook/resolver` (modifier with no default/contexts) and `swatchbook/project` (`disabledAxes` filtering out every theme).

## 0.2.1

### Patch Changes

- e86d414: Fix block chrome rendering when `cssVarPrefix` is anything other than `sb` by spreading a CSS custom-property alias layer on each block wrapper.

## 0.2.0

### Minor Changes

- 2f733b5: Breaking: prefix `data-*` attributes with `cssVarPrefix` (default prefix `swatch`; set `cssVarPrefix: ''` for the bare form) to avoid collisions with third-party `data-mode` / `data-theme`. Adds `dataAttr(prefix, key)` export.

## 0.1.5

### Patch Changes

- 89d48a1: Declare `"sideEffects": false` on all three published packages for more aggressive consumer tree-shaking.

## 0.1.0

### Minor Changes

- 9d862a3: `Config.default` now takes a partial tuple object (`{ axisName: contextName }`) instead of a composed string; omitted axes fill from each axis's `default`. Migration: replace `default: 'Light · Default'` with `default: { mode: 'Light', brand: 'Default' }`.
- 5072345: New `Config.disabledAxes?: string[]` suppresses declared axes from the toolbar, CSS emission, and theme enumeration, pinning each to its `default`; unknown names surface as `swatchbook/disabled-axes` warns.
- 0cb84fd: Drop the explicit-layers theming input — the DTCG 2025.10 resolver is the sole input; `Config.themes`, `ThemeConfig`, and `resolveThemingMode` are gone. Migration: move layered configs to a `resolver.json`.
- 6c7bfe5: Drop Tokens Studio `$themes` manifest support; `Config.manifest` removed, `resolveThemingMode` returns `'layered' | 'resolver'`.
- 8db913b: Extend `defineSwatchbookConfig` with an `axes` shape for authored layered configs (no resolver file); `Config.resolver` is now optional and setting both throws.
- d45d5da: Multi-axis permutation IDs now join tuple values with `·` instead of Terrazzo's JSON-encoded format. Migration: pinned theme names go from `'Light'` to `'Light · Default'`.
- 37933a3: `Config.tokens` is now optional when `config.resolver` is set; resolver `$ref` targets determine loaded files and `Project.sourceFiles` exposes them for HMR. Plain-parse / layered modes still require `tokens`.
- abf657d: CSS emission now keys per-axis instead of per-composed-theme: one `:root` block plus one compound-selector block per non-default cartesian tuple. `emitCss` takes a new optional `axes`.
- c1a8c71: Expose modifier axes as first-class on `Project.axes` (with `contexts` / `default` / `description` / `source`); add a `permutationID(input)` utility; the virtual module exports `axes`.
- 04b3f44: Named tuple presets — `defineSwatchbookConfig({ presets })` takes ordered `{ name, axes, description? }` entries (omitted axes fall back to defaults); validated at load time, surfaced on `Project.presets` + the virtual module + toolbar pills.

### Patch Changes

- 4ca9bb3: Align the `storybook` peerDependency range on swatchbook-addon with swatchbook-blocks (`^10.3.5`).
- 1986a0f: Add standard npm publish metadata (`license`, `repository`, `homepage`, `bugs`, `author`, `keywords`) to all three published packages.
