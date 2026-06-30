# @unpunnyfuns/swatchbook-integrations

## 0.68.0

### Patch Changes

- Updated dependencies [b250540]
  - @unpunnyfuns/swatchbook-core@0.68.0

## 0.67.0

### Patch Changes

- Updated dependencies [e0cb966]
  - @unpunnyfuns/swatchbook-core@0.67.0

## 0.66.4

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.66.4

## 0.66.3

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.66.3

## 0.66.2

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.66.2

## 0.66.1

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.66.1

## 0.66.0

### Patch Changes

- Updated dependencies [d97f565]
  - @unpunnyfuns/swatchbook-core@0.66.0

## 0.65.0

### Patch Changes

- Updated dependencies [d2d24f9]
  - @unpunnyfuns/swatchbook-core@0.65.0

## 0.64.0

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.64.0

## 0.63.0

### Patch Changes

- Updated dependencies [0d23825]
  - @unpunnyfuns/swatchbook-core@0.63.0

## 0.62.4

### Patch Changes

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

- Updated dependencies [e864728]
  - @unpunnyfuns/swatchbook-core@0.62.1

## 0.62.0

### Minor Changes

- 8c90cbdad4b162fee9eaacd68b26cc8a86ff7317: upgrade Terrazzo to 2.3.0 and raise the @terrazzo/parser and @terrazzo/plugin-css peer floors to ^2.3.0

### Patch Changes

- 9b5e9af5eda4ccc4d13b7df10b6197116ba99b76: Condense the changelogs and switch to a one-line-per-change changelog format.
- 53ddc4be3beef24901f537cb49df7b7e09c3f639: Documentation review follow-ups.
- 8e918b18d1e9d0c390b257a8d927e3ee787d10c5: fix tailwind/css-in-js integrations and MCP get_token/get_consumer_output reporting CSS var names that diverge from plugin-css output on camelCase paths; names now come from the listing via the new core cssVarName helper
- 86a42fe94aed4d6d5cf94ec0d7b3c0fac70ff2c9: fix four low-severity correctness bugs: core hex fallback dropping the alpha byte of #rrggbbaa/#rgba, css-in-js buildTree misfiling a path that collides with a leaf, tailwind mis-bucketing camelCase font-size tokens into spacing, and MCP describe_project counting each token type once per theme
- f2ec59040b4a5d93cbffa1959bc8a874d533ece5: fix four more low-severity bugs: AliasedBy hiding shared descendants in diamond alias graphs, the switcher preset active-match against a sparse tuple, the MCP server version reporting the css-var prefix, and css-in-js emitting duplicate exports when group names collide
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

- 84b450c: Public API renames (clean break, no aliases): blocks `FontFamilySample`/`StrokeStyleSample`/`DimensionKind` → `FontFamilyPreview`/`StrokeStylePreview`/`DimensionVisual` (`kind` prop → `visual`), dropped `ProjectSnapshot.presets`/`disabledAxes`; addon `parameters.swatchbook.permutation` → `themeName`, `SwatchbookPluginOptions` → `SwatchbookTokensPluginOptions`, removed dead `theme` param / `swatchbookTheme` global / `PARAM_KEY`; mcp `get_color_contrast` output `ratio` → `value`; core dropped `Diagnostic.column`. Migration: rename the imports, props, and parameters above.

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

- @unpunnyfuns/swatchbook-core@0.60.8

## 0.60.7

### Patch Changes

- fb5e8ae: The release `environment` gate now fires only on publish runs (VP-PR squash-merge), not every push to main.
- dd8608d: Internal release shipping the security-infrastructure docs into the current minor's snapshot.
- Updated dependencies [fb5e8ae]
- Updated dependencies [dd8608d]
  - @unpunnyfuns/swatchbook-core@0.60.7

## 0.60.6

### Patch Changes

- 619b7b8: Expose `Config.maxJointArity` (default `4`) to override the joint-divergence arity-probing cap.
- 95ddfa3: Exclude the addon's virtual module IDs from Vite's `optimizeDeps` pre-bundling so esbuild doesn't fail to resolve them.
- Updated dependencies [619b7b8]
- Updated dependencies [95ddfa3]
  - @unpunnyfuns/swatchbook-core@0.60.6

## 0.60.5

### Patch Changes

- 48725a8: `emitAxisProjectedCss` joint-block emission now scales per-token instead of cartesian over project axes, turning a >1h hang on large projects into milliseconds.
- Updated dependencies [48725a8]
  - @unpunnyfuns/swatchbook-core@0.60.5

## 0.60.4

### Patch Changes

- 79d6c68: Add `reference/concepts.mdx` consolidating Swatchbook's mental model.
- 401b4de: Add `reference/diagnostics.mdx` cataloging every `swatchbook/<group>` diagnostic.
- aacc744: `loadProject` emits phase-bounded timing to stdout when `SWATCHBOOK_LOG_VERBOSE=1` is set.
- Updated dependencies [79d6c68]
- Updated dependencies [401b4de]
- Updated dependencies [aacc744]
  - @unpunnyfuns/swatchbook-core@0.60.4

## 0.60.3

### Patch Changes

- 65a7865: Substitute DTCG `$ref` objects in modifier values against the resolver baseline at write-extraction time, fixing an emit-time colorjs.io crash on unresolved references.
- Updated dependencies [65a7865]
  - @unpunnyfuns/swatchbook-core@0.60.3

## 0.60.2

### Patch Changes

- d2c7cfb: Color-shape validator now names the JSON Pointer when `components` carries an unresolved `$ref`, instead of the generic array message.
- Updated dependencies [d2c7cfb]
  - @unpunnyfuns/swatchbook-core@0.60.2

## 0.60.1

### Patch Changes

- c3ded5b: Ship the PR #1002 docs audit fixes into the stable snapshot.
- 0868ed5: Smart-emitter `transformCSSValue` errors now name the token path, axis permutation, and offending `$value`, with the original error as `cause`.
- 2e6352a: Validate color token `$value` shape at load time, reporting color objects with missing or non-array `components`.
- Updated dependencies [c3ded5b]
- Updated dependencies [0868ed5]
- Updated dependencies [2e6352a]
  - @unpunnyfuns/swatchbook-core@0.60.1

## 0.60.0

### Minor Changes

- 65adff6: Replace `Project.cells` / `jointOverrides` / `varianceByPath` with a single walkable `Project.tokenGraph`; per-tuple resolution is now a graph walk. Migration: use `Project.tokenGraph` + helpers from the new `@unpunnyfuns/swatchbook-core/graph` subpath (`resolveAt`, `resolveAllAt`, `resolveAliasAt`, `getVariance`, `getAffectedBy`, `listPaths`); `/resolve-at` subpath removed.

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

- 6188fa8: Enable a small batch of correctness-leaning oxlint rules (`no-throw-literal`, `no-inferrable-types`, `consistent-type-definitions: interface`).
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

- b8372c1: Internal migration: `buildCells` takes a `resolveTuple` callback and `validateChrome` takes a token-ID set, routing core's own `permutations`/`permutationsResolved` consumers through abstractions upstream of the singleton enumeration (part 2 of 3 for #815).
- 158f2e1: Delete legacy cartesian-era code paths: `analyzeAxisVariance()` + its `/variance` subpath, `buildJointOverrides()`, internal `emitCss()` and `composeProjectCss()`. Migration: use `project.varianceByPath.get(path)` and `probeJointOverrides(...).overrides`.
- de4cc3d: Remove cartesian-era `Project.permutations` / `permutationsResolved` / `Permutation` / `permutationID()` from the public surface; `Project.graph` renamed to `Project.defaultTokens` (closes #815). Migration: use `project.resolveAt(tuple)` and `project.defaultTokens`.
- 09d957f: Internal migration: non-core read sites route through `cells` / `resolveAt` / `varianceByPath` / `defaultTuple` instead of iterating `Project.permutations` (part 1 of 3 for #815).
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

- 674944b: Expose `buildResolveAt` via a dep-free `./resolve-at` subpath; blocks now consume `resolveAt(activeTuple)` instead of indexing `permutationsResolved`.
- 905161d: Drop `projectCss` and `emit.ts`; `emitAxisProjectedCss` becomes the single emitter, and the addon drops its `emitMode` option. Migration: stop importing `projectCss` or setting `emitMode: 'cartesian'`.
- af73dc4: Lift `resolveAt` to the preview decorator and ship it through `SwatchbookContext`; drops wire-shipped `permutations`/`permutationsResolved`/`defaultPermutation` (closes #793).
- f09066f: Server-side consumers (mcp, integrations) switch from indexing `permutationsResolved[name]` to `project.resolveAt(tuple)`.
- f1cf2db: Add `Project.cells` / `jointOverrides` / `defaultTuple` / `resolveAt(tuple)` alongside the cartesian shape (additive).
- d29813e: Add `Project.varianceByPath` caching per-token `AxisVarianceResult` at load time for O(1) lookup.
- 5178532: Ship `cells` / `jointOverrides` / `varianceByPath` / `defaultTuple` over the virtual module and HMR snapshot (additive).

### Patch Changes

- e161fdb: Index permutations by canonical tuple key once per snapshot, exposed as `permutationNameForTuple(tuple)` for O(1) `AxisVariance` grid lookups.
- 0932217: Rewrite the joint-overrides build to probe via `resolver.apply` directly, returning `overrides` + `jointTouching` and fixing a false-positive touched-axis class.
- 9de9db9: Layered loader now enumerates `Σ(axes × contexts)` singleton tuples instead of `Π(contexts)` cartesian; `Config.maxPermutations` / `cartesianSize()` / `permutationGuardDiagnostic()` / `DEFAULT_MAX_PERMUTATIONS` / the `swatchbook/permutations` diagnostic removed. Migration: drop `maxPermutations` from your config.
- a2f776e: Resolver loader enumerates only singletons (no `listPermutations()`); `Project.cells` stores delta cells for non-default contexts; `resolvePermutation()` / `ResolvedPermutation` removed.
- e170124: Smart emitter and `analyzeProjectVariance` Phase 1 read `project.cells` directly instead of `findPermByTuple` + `permutationsResolved` (internal, same output).
- 83224fb: Smart emitter compound-block emission and `analyzeProjectVariance` Phase 3 read `project.jointOverrides` directly (internal, same output).
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

- 8fb128c: Add addon `emitMode: 'cartesian' | 'projected'` (default `'projected'`), backing the virtual-module `css` export with `emitAxisProjectedCss`.
- 31999ef: Remove the unused `permutations` prop from `<ThemeSwitcher>` and the `SwitcherPermutation` type.
- 7b4225a: Add `emitAxisProjectedCss(permutations, permutationsResolved, options?)` as an opt-in alternative to `emitCss` / `projectCss` (additive).
- 5ed6b04: Rewrite `emitAxisProjectedCss` to route per-token between projection and compound selectors via `analyzeProjectVariance`, making it spec-faithful for any DTCG resolver; signature changed to `(project, options)`.
- 812676f: Add internal `analyzeProjectVariance(project)` classifying each token's axis-variance kind (analysis only, not exported).

### Patch Changes

- ded154d: Reframe `emitAxisProjectedCss`'s orthogonality as a lossy size optimization, not a usage constraint; cartesian (`emitCss`) is the spec-faithful default.
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

- 0b14715: Rename the cartesian-product surface from `themes` to `permutations` across the public API (`Project.themes` → `permutations`, `resolveTheme()` → `resolvePermutation()`, `Theme` → `Permutation`, virtual exports, typegen, etc.); drop the legacy `parameters.swatchbook.theme` reader and `globals.swatchbookTheme`; add `Config.maxPermutations` guard (default 1024) against pathological resolver cartesian blowups. Migration: rename the above; CSS attributes, `ThemeSwitcher`, and the switcher package name are unchanged.

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

- 2444c4e: Rework every package README to the docs-intro register, pushing detail-dense reference material to the docs site.
- Updated dependencies [2444c4e]
  - @unpunnyfuns/swatchbook-core@0.19.9

## 0.19.8

### Patch Changes

- a753766: Rework every package README to the docs-intro register, pushing detail-dense reference material to the docs site.
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

- 2f1b3ea: Replace `/tailwind`'s hardcoded `DEFAULT_ROLES` with dynamic role derivation that walks the default-theme graph and classifies tokens into Tailwind scales by `$type` + path, so zero-config works for any DTCG project shape. Breaking (pre-1.0, minor): reference-fixture projects emit extra palette utilities; the `roles` option still overrides.

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

- 87a92c2: Prune the production-emitter surface from both integrations: `renderTailwindTheme` / `renderTheme` / `DEFAULT_ROLES` are no longer public, consumed exclusively through the addon's virtual-module pipeline. Breaking (pre-1.0, minor): wire the addon instead of importing the named helpers.

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

- 171c9aa: Auto-inject CSS-side-effect integrations into the Storybook preview via `virtualModule.autoInject: true`, so consumers drop the hand-written second `import`; `/tailwind` opts in, css-in-js stays explicit.

### Patch Changes

- Updated dependencies [171c9aa]
  - @unpunnyfuns/swatchbook-core@0.14.0

## 0.13.1

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.13.1

## 0.13.0

### Patch Changes

- 562bbc7: `@unpunnyfuns/swatchbook-integrations` joins the fixed-version group, releasing in lockstep at `0.13.0`.
- f66b9ef: Move `@unpunnyfuns/swatchbook-core` from `peerDependencies` to `dependencies` to avoid Changesets' peer-dep major-bump cascade.
- Updated dependencies [018f518]
- Updated dependencies [f03161f]
- Updated dependencies [74e755c]
  - @unpunnyfuns/swatchbook-core@0.13.0
