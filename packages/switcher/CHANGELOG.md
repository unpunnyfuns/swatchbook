# @unpunnyfuns/swatchbook-switcher

## 0.62.3

### Patch Changes

- ad9b1efc315f854d783606c77b653e1d372c364f: Restructure the docs site: a product-showcase frontpage, a Concepts section, Quickstart in Guides, and an integrations reference entry.

## 0.62.2

### Patch Changes

- 4fbeb8638206991ddfc87ece7f76079195ff2c0b: Documentation accuracy sweep across the docs site and READMEs.

## 0.62.1

## 0.62.0

### Minor Changes

- 8c90cbdad4b162fee9eaacd68b26cc8a86ff7317: upgrade Terrazzo to 2.3.0 and raise the @terrazzo/parser and @terrazzo/plugin-css peer floors to ^2.3.0

### Patch Changes

- 9b5e9af5eda4ccc4d13b7df10b6197116ba99b76: Condense the changelogs and switch to a one-line-per-change changelog format.
- 53ddc4be3beef24901f537cb49df7b7e09c3f639: Documentation review follow-ups.
- f2ec59040b4a5d93cbffa1959bc8a874d533ece5: fix four more low-severity bugs: AliasedBy hiding shared descendants in diamond alias graphs, the switcher preset active-match against a sparse tuple, the MCP server version reporting the css-var prefix, and css-in-js emitting duplicate exports when group names collide
- f8b3e15a6602c06c4b6410c40afb497b62238db3: Expose a preset's "modified" state in its accessible name, not just the aria-hidden visual dot

## 0.61.0

### Minor Changes

- 84b450c: Public API renames (clean break, no deprecated aliases): blocks `FontFamilySample`/`StrokeStyleSample` → `FontFamilyPreview`/`StrokeStylePreview`, `DimensionKind`/`kind` → `DimensionVisual`/`visual`, dropped `ProjectSnapshot.presets`/`disabledAxes`; addon `parameters.swatchbook.permutation` → `themeName`, removed dead `theme` param / `swatchbookTheme` global / `PARAM_KEY`, `SwatchbookPluginOptions` → `SwatchbookTokensPluginOptions`; mcp `get_color_contrast` output `ratio` → `value`; core dropped `Diagnostic.column`. Migration: rename the imports, props, and parameters; `switcher`/`integrations` version with the fixed group only.

## 0.60.10

### Patch Changes

- deecf14: Tighten "Built with AI" docs prose.

## 0.60.9

### Patch Changes

- a639114: Add a "Built with AI" disclosure to the docs and a `developers/built-with-ai.mdx` page.

## 0.60.8

## 0.60.7

### Patch Changes

- fb5e8ae: The release `environment` gate now fires only on publish runs (VP-PR squash-merge, commit starting `chore(release):`), not every push to main.
- dd8608d: Internal release shipping the security-infrastructure docs from #1044 into the current snapshot.

## 0.60.6

### Patch Changes

- 619b7b8: Expose `Config.maxJointArity` (default `4`) to override the per-token joint-divergence arity cap; `1` disables joint-block emission.
- 95ddfa3: The addon's Vite plugin excludes its virtual module IDs from `optimizeDeps` pre-bundling so esbuild doesn't fail to resolve them.

## 0.60.5

### Patch Changes

- 48725a8: `emitAxisProjectedCss` joint-block emission scales per-token (capped at 4 axes) instead of cartesian over project axes; a 687-token 12-axis project now emits in milliseconds instead of hanging. Output byte-identical for the reference fixture.

## 0.60.4

### Patch Changes

- 79d6c68: Add `reference/concepts.mdx` consolidating Swatchbook's mental model; slots first in the Reference > Model sidebar.
- 401b4de: Add `reference/diagnostics.mdx` cataloging every `swatchbook/<group>` diagnostic plus the runtime emit-error format.
- aacc744: `loadProject` emits phase-bounded timing to stdout when `SWATCHBOOK_LOG_VERBOSE=1` is set; unchanged otherwise.

## 0.60.3

### Patch Changes

- 65a7865: Substitute DTCG `$ref` objects in modifier values against the resolver's baseline at write-extraction time, so unresolved `{ $ref }` objects no longer crash colorjs.io at emit.

## 0.60.2

### Patch Changes

- d2c7cfb: The color-shape validator's diagnostic for an unresolved `$ref` in `components` now names the JSON Pointer and the upstream substitution failure instead of the generic array message.

## 0.60.1

### Patch Changes

- c3ded5b: Patch release rebuilding the `version-0.60/` snapshot to ship PR #1002's docs audit fixes to `/`.
- 0868ed5: When the smart emitter's `transformCSSValue` throws, the error names the token path, axis permutation, and offending `$value`, with the original attached as `cause`.
- 2e6352a: Validate color token `$value` shape at load time, reporting color objects whose `components` is missing or non-array before colorjs.io crashes on them.

## 0.60.0

### Minor Changes

- 65adff6: Replace `Project.cells` + `Project.jointOverrides` + `Project.varianceByPath` with a single walkable `Project.tokenGraph`; per-tuple resolution is a pure graph walk, calling `resolver.apply` Σ(axes × non-default contexts) + 1 times at load, never per-tuple. Breaking (pre-1.0 minor): those three fields and the `core/resolve-at` subpath are removed; use `Project.tokenGraph` + helpers from the new `core/graph` subpath (`resolveAt`, `resolveAllAt`, `resolveAliasAt`, `resolveAliasAllAt`, `getVariance`, `getAffectedBy`, `listPaths`). `Project.resolveAt` and MCP `get_axis_variance` wire shapes unchanged. Reference-fixture payload 607 KB → 45 KB.

## 0.59.1

## 0.59.0

## 0.58.1

## 0.58.0

### Patch Changes

- f82fe37: Add toggle/group semantics to `OptionPill` and the addon's `ColorFormatSelector`: `aria-pressed` per pill, `role="group"` + `aria-labelledby` on each pill row, disambiguating `aria-label`, and dropped focus-stealing `onMouseDown` preventDefault.
- ecf7823: Three ThemeSwitcher / toolbar / Diagnostics a11y touches: toolbar `aria-haspopup={true}` (was `"dialog"`), `OptionPill` drops focus-stealing `onMouseDown`, and Diagnostics gains `role="list"` + per-row severity `aria-label`.

## 0.57.1

## 0.57.0

### Patch Changes

- c69dec1: Refresh the npm READMEs + docs reference against the post-cartesian-drop public API (`core/README.md`, `reference/{core,switcher,config}.mdx`).
- c5d9089: Five helper consolidations: new `core/style-element` subpath (`ensureStyleElement`), new `presetTuple` export from switcher, `cells.ts` reuses `value-key.ts`, addon `ColorFormat` validation reads `COLOR_FORMATS.includes()` from blocks, and a shared `pickInitFields` for the `INIT_EVENT` subset.
- 1c56c88: Sweep stale "permutation" prose to "theme" across docs and the switcher README; Terrazzo's literal `permutations` field name stays.
- 55ee410: Four test-hygiene items: switcher test gains `.browser.` infix, `diagnostics.test.ts` split in two, cosmetic addon `describe` wrappers dropped, ghost test fixtures cleaned, and a new clean-config zero-diagnostics smoke test.

## 0.56.0

### Patch Changes

- b8372c1: Internal migration: `buildCells` takes a `resolveTuple` callback and `validateChrome` takes a token-ID set, routing core's own consumers upstream of the singleton enumeration. Part 2 of 3 for #815.
- 158f2e1: Delete legacy cartesian-era code paths (pre-1.0 minor): `analyzeAxisVariance()` + `core/variance` subpath, `buildJointOverrides()` shim, internal `emitCss()` and addon `composeProjectCss()`. Migration: read `project.varianceByPath.get(path)`; use `probeJointOverrides(...).overrides`.
- de4cc3d: Closes #815. The cartesian-era `Project.permutations` / `permutationsResolved` fields, the `Permutation` type, and `permutationID()` exit the public surface; `Project.graph` → `Project.defaultTokens`. Migration: use `project.resolveAt(tuple)` and `project.defaultTokens`.
- 09d957f: Internal migration: non-core read sites route through `cells` / `resolveAt` / `varianceByPath` / `defaultTuple`, synthesizing theme names from axes + defaultTuple. Part 1 of 3 for #815.
- d8a8bdf: Migrate the switcher test suite from jsdom to vitest real-browser mode (Chromium + Firefox); drops `jsdom`, adds `@vitest/browser` + `playwright`. First of three sub-PRs for #818.

## 0.55.0

### Minor Changes

- 674944b: Expose `buildResolveAt` via the new `core/resolve-at` subpath; blocks consume `resolveAt(activeTuple)` instead of indexing `permutationsResolved`, with a legacy fallback for pre-cells snapshots.
- 905161d: Drop `projectCss` + `core/src/emit.ts` and the addon's `emitMode` option, making smart `emitAxisProjectedCss` the single emitter. Pre-1.0 breaking for consumers importing `projectCss` or setting `emitMode: 'cartesian'`.
- af73dc4: Lift `resolveAt` to the preview decorator and ship it through `SwatchbookContext`; drops wire-shipped `permutations` / `permutationsResolved` / `defaultPermutation` from the virtual module + HMR snapshot. Closes #793.
- f09066f: Server-side MCP + integrations consumers call `project.resolveAt(tuple)` instead of indexing `permutationsResolved[name]`, via an O(1) `tupleByName` map; tool I/O unchanged.
- f1cf2db: Add `Project.cells`, `jointOverrides`, `defaultTuple`, and `resolveAt(tuple)` alongside the cartesian shape; bounded by Σ(axes × contexts) with an exhaustive joint-variance probe. Additive.
- d29813e: Add `Project.varianceByPath` — per-token `AxisVarianceResult` cached at load for O(1) lookup; smart emitter and MCP `get_axis_variance` read from it.
- 5178532: Ship `cells`, `jointOverrides`, `varianceByPath`, `defaultTuple` over the virtual module + HMR snapshot (additive); the `AxisVariance` block uses an O(1) `varianceByPath` lookup.

### Patch Changes

- e161fdb: Index permutations by canonical tuple key once per snapshot as `permutationNameForTuple(tuple)`; `AxisVariance`'s grid drops per-cell `permutations.find` scans for O(1) lookups.
- 0932217: Rewrite joint-overrides to probe via `resolver.apply` directly (`probeJointOverrides` returning `overrides` + `jointTouching`), fixing the false-positive touching-axis class; probes every arity 2..N.
- 9de9db9: The layered loader enumerates Σ(axes × contexts) singleton tuples instead of Π(contexts) cartesian; removes `Config.maxPermutations`, `cartesianSize()`, `permutationGuardDiagnostic()`, `DEFAULT_MAX_PERMUTATIONS`, and the `swatchbook/permutations` group. Migration: drop `maxPermutations` from config.
- a2f776e: `loadProject` no longer calls `resolver.listPermutations()`; the resolver loader enumerates singletons only (Σ(axes × contexts)) with delta cells for non-default contexts. Removes `resolvePermutation()` + `ResolvedPermutation`.
- e170124: Smart emitter and `analyzeProjectVariance` read Phase 1 cells from `project.cells` directly instead of `findPermByTuple`. Internal refactor, same output.
- 83224fb: Smart emitter compound-block emission and `analyzeProjectVariance` Phase 3 read from `project.jointOverrides` directly. Internal refactor, same output.

## 0.54.0

### Minor Changes

- 8fb128c: Add the addon's `emitMode: 'cartesian' | 'projected'` option (default `'projected'`), backing the virtual `css` export with `emitAxisProjectedCss`; `'cartesian'` falls back to per-tuple `projectCss`.
- 31999ef: Remove the unused `permutations` prop from `<ThemeSwitcher>` and the `SwitcherPermutation` type from the public exports.
- 7b4225a: Add `emitAxisProjectedCss(permutations, permutationsResolved, options?)` as an opt-in emitter producing a `:root` baseline plus per-axis-cell delta blocks; assumes orthogonal axes. Additive.
- 5ed6b04: Rewrite `emitAxisProjectedCss` to route per-token between projection and compound selectors via `analyzeProjectVariance`, emitting compound `[data-A][data-B]` blocks for joint-variant tokens. Signature now `(project, options)`; `@internal`.
- 812676f: Add internal `analyzeProjectVariance(project)` classifying each token as baseline-only / single-axis / orthogonal-after-probe / joint-variant. Analysis only, not exported.

### Patch Changes

- ded154d: Correct the orthogonality framing on `emitAxisProjectedCss`: non-orthogonal modifiers are spec-permitted, so projection is a lossy size optimization and cartesian is the spec-faithful default. Docs only.

## 0.53.0

## 0.52.0

### Patch Changes

- 27b3f69: A11y polish (first slice of #707): addon toolbar trigger gains `aria-haspopup="dialog"` + `aria-expanded`; switcher root switches `role="menu"` → `role="group"` with `aria-label`. No visual changes.

## 0.51.1

## 0.51.0

## 0.50.0

### Minor Changes

- 0b14715: Rename the cartesian-product surface from `themes` to `permutations` across the public API (`Project.themes` → `permutations`, `resolveTheme()` → `resolvePermutation()`, `Theme` → `Permutation`, etc.) and drop the legacy `parameters.swatchbook.theme` reader and `globals.swatchbookTheme` channel. External conventions (`data-*-theme`, `ThemeSwitcher`, package name) unchanged. Adds the `Config.maxPermutations` guard (default 1024) defending against pathological resolver enumeration.

### Patch Changes

- c53cef9: Add `:focus-visible` 2px outlines for keyboard users on `<TokenNavigator>` rows, `<TokenTable>` rows, and the `<ThemeSwitcher>` pill; mouse interaction stays focus-ring-free.

## 0.20.6

### Patch Changes

- 74536c8: Add a `reference/switcher` docs page (install, peer requirements, mount example, props, input shapes, styling hooks) and fix the README's stale `Usage` block to the current `activeTuple` / `defaults` / `lastApplied` / `onPresetApply` shape.

## 0.20.5

### Patch Changes

- 9bdd8da: Add `./style.css` to each package's `exports` map so consumers can link the stylesheet explicitly; the existing side-effect import path is unchanged.

## 0.20.4

## 0.20.3

## 0.20.2

## 0.20.1

## 0.20.0

## 0.19.9

### Patch Changes

- 2444c4e: Rework every package README to the docs intro's register: short opening sentence, detail-dense reference pushed to the docs site (~50 lines each, down from ~120).

## 0.19.8

### Patch Changes

- a753766: Rework every package README to the docs intro's register: short opening sentence, detail-dense reference pushed to the docs site (~50 lines each, down from ~120).

## 0.19.7

## 0.19.6

## 0.19.5

## 0.19.4

## 0.19.3

## 0.19.2

## 0.19.1

## 0.19.0

## 0.18.0

## 0.17.0

## 0.16.0

## 0.15.0

## 0.14.1

## 0.14.0

## 0.13.1

## 0.13.0

## 0.12.0

## 0.11.6

## 0.11.5

## 0.11.4

## 0.11.3

## 0.11.2

## 0.11.1

## 0.11.0

### Minor Changes

- da22d9e: First npm publish of `switcher` and `mcp`, bootstrapped via npm's pending-trusted-publisher flow; subsequent releases publish via the standard OIDC path. Tips the fixed-version group to 0.11.0.

## 0.10.2

## 0.10.1

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

### Minor Changes

- cecfdff: Extract the theme-switcher popover into the standalone `@unpunnyfuns/swatchbook-switcher` package — a framework-agnostic React component (compiled with classic JSX for the manager bundle) that the addon's `AxesToolbar` now composes; no user-visible change. Ships in the fixed-version group.
