# @unpunnyfuns/swatchbook-mcp

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

- ed9d9420a829de74fe41fc33cc9a3bb964e83399: consolidate color formatting into core (new color-formats and format-color modules shared by blocks/mcp/addon); MCP color output now uses the shared canonical rendering (integer rgb, 6-digit hex)
- 9b5e9af5eda4ccc4d13b7df10b6197116ba99b76: Condense the changelogs and switch to a one-line-per-change changelog format.
- 53ddc4be3beef24901f537cb49df7b7e09c3f639: Documentation review follow-ups.
- 8e918b18d1e9d0c390b257a8d927e3ee787d10c5: fix tailwind/css-in-js integrations and MCP get_token/get_consumer_output reporting CSS var names that diverge from plugin-css output on camelCase paths; names now come from the listing via the new core cssVarName helper
- 86a42fe94aed4d6d5cf94ec0d7b3c0fac70ff2c9: fix four low-severity correctness bugs: core hex fallback dropping the alpha byte of #rrggbbaa/#rgba, css-in-js buildTree misfiling a path that collides with a leaf, tailwind mis-bucketing camelCase font-size tokens into spacing, and MCP describe_project counting each token type once per theme
- f2ec59040b4a5d93cbffa1959bc8a874d533ece5: fix four more low-severity bugs: AliasedBy hiding shared descendants in diamond alias graphs, the switcher preset active-match against a sparse tuple, the MCP server version reporting the css-var prefix, and css-in-js emitting duplicate exports when group names collide
- dd7fcf3eb006500fb2cca7665f55ad0d92fdad5a: fix get_color_formats and get_color_contrast rejecting DTCG wide-gamut color-space ids (display-p3, a98-rgb, prophoto-rgb)
- 369d86d3bb6c02bed79e2157a37d8f1095ccb95f: fix MCP tools silently falling back to the default theme for an unknown theme name while labeling the response with the requested name; they now return an error listing the valid theme names
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

- 84b450c: Public API renames (clean break, no aliases). blocks: `FontFamilySample`→`FontFamilyPreview`, `StrokeStyleSample`→`StrokeStylePreview`, `DimensionKind`→`DimensionVisual` (prop `kind`→`visual`), dropped `ProjectSnapshot.presets`/`disabledAxes`. addon: `parameters.swatchbook.permutation`→`themeName`, dropped `parameters.swatchbook.theme` + `swatchbookTheme` global + `PARAM_KEY`, `SwatchbookPluginOptions`→`SwatchbookTokensPluginOptions`. mcp: `get_color_contrast` output `ratio`→`value`. core: dropped `Diagnostic.column`. Migration: rename the imports, props, and parameters above.

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

- a639114: Add a "Built with AI" disclosure to the docs (Introduction block + `developers/built-with-ai.mdx`).
- Updated dependencies [a639114]
  - @unpunnyfuns/swatchbook-core@0.60.9

## 0.60.8

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.60.8

## 0.60.7

### Patch Changes

- fb5e8ae: The release `environment` gate now fires only on publish runs (commit message starting `chore(release):`), not every push to main.
- dd8608d: Internal release shipping the security-infrastructure docs from #1044 into the current snapshot.
- Updated dependencies [fb5e8ae]
- Updated dependencies [dd8608d]
  - @unpunnyfuns/swatchbook-core@0.60.7

## 0.60.6

### Patch Changes

- 619b7b8: Expose `Config.maxJointArity` (default `4`) to override the per-token joint-divergence arity cap; `1` disables joint-block emission.
- 95ddfa3: The addon's Vite plugin excludes its virtual module IDs from `optimizeDeps` pre-bundling so esbuild doesn't fail resolving them.
- Updated dependencies [619b7b8]
- Updated dependencies [95ddfa3]
  - @unpunnyfuns/swatchbook-core@0.60.6

## 0.60.5

### Patch Changes

- 48725a8: `emitAxisProjectedCss` joint-block emission now scales per-token instead of cartesian over project axes, taking 12-axis emission from >1h hangs to milliseconds; reference CSS unchanged.
- Updated dependencies [48725a8]
  - @unpunnyfuns/swatchbook-core@0.60.5

## 0.60.4

### Patch Changes

- 79d6c68: Add `reference/concepts.mdx` consolidating Swatchbook's mental model.
- 401b4de: Add `reference/diagnostics.mdx` cataloging every `swatchbook/<group>` diagnostic plus the runtime emit-error format.
- aacc744: `loadProject` emits phase-bounded timing to stdout when `SWATCHBOOK_LOG_VERBOSE=1` is set.
- Updated dependencies [79d6c68]
- Updated dependencies [401b4de]
- Updated dependencies [aacc744]
  - @unpunnyfuns/swatchbook-core@0.60.4

## 0.60.3

### Patch Changes

- 65a7865: Substitute DTCG `$ref` objects in modifier values against the resolver's baseline at write-extraction time, fixing a colorjs.io crash on unresolved `{ $ref }` objects.
- Updated dependencies [65a7865]
  - @unpunnyfuns/swatchbook-core@0.60.3

## 0.60.2

### Patch Changes

- d2c7cfb: When `components` carries an unresolved `$ref` object, the diagnostic now names the JSON Pointer and the upstream substitution failure instead of the generic array-of-numbers message.
- Updated dependencies [d2c7cfb]
  - @unpunnyfuns/swatchbook-core@0.60.2

## 0.60.1

### Patch Changes

- c3ded5b: Patch release shipping the PR #1002 docs-audit fixes into the stable snapshot.
- 0868ed5: When the smart emitter's `transformCSSValue` throws, the error now names the token path, axis permutation, and `$value`, with the original attached as `cause`.
- 2e6352a: Validate color token `$value` shape at load time, reporting color objects whose `components` is missing or non-array before they crash colorjs.io.
- Updated dependencies [c3ded5b]
- Updated dependencies [0868ed5]
- Updated dependencies [2e6352a]
  - @unpunnyfuns/swatchbook-core@0.60.1

## 0.60.0

### Minor Changes

- 65adff6: Replace `Project.cells` + `Project.jointOverrides` + `Project.varianceByPath` with a single walkable `Project.tokenGraph`; per-tuple resolution is now a graph walk. Migration: import `resolveAt`/`resolveAllAt`/`resolveAliasAt`/`resolveAliasAllAt`/`getVariance`/`getAffectedBy`/`listPaths` from the new `@unpunnyfuns/swatchbook-core/graph` subpath (replaces the removed `/resolve-at` subpath); `Project.resolveAt(tuple)` and MCP `get_axis_variance` wire shape unchanged. Reference payload 607 KB → 45 KB.

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

- 1f65ada: Tighten weak / smoke-only test assertions across packages, pinning falsifiable invariants (closes #930).
- Updated dependencies [f73637a]
- Updated dependencies [1f65ada]
  - @unpunnyfuns/swatchbook-core@0.58.0

## 0.57.1

### Patch Changes

- Updated dependencies [0e0cc7a]
  - @unpunnyfuns/swatchbook-core@0.57.1

## 0.57.0

### Patch Changes

- 3302705: Enable a batch of oxlint quality rules (`no-inline-comments`, `import/extensions`, `eqeqeq`, `no-var`, and more) and sweep the codebase via autofix.
- 975944d: Consolidate the two divergent path-matchers onto a single `@unpunnyfuns/swatchbook-core/match-path` subpath using conventional glob semantics (`*` = one segment, `**` = any). Migration: blocks `filter="color.*"` expecting all descendants becomes `filter="color.**"`.
- 062276b: Add `@unpunnyfuns/swatchbook-core/themes` subpath (`tupleToName`, `enumerateThemes`, types), eliminating duplicated theme-enumeration impls across 4 packages.
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

- 174d162: Rename `permutations`→`themes` and `defaultPermutation`→`defaultTheme` in MCP response shapes (`describe_project`, `list_axes`); breaking for clients keying off the old names, values unchanged (closes #826).

### Patch Changes

- d54dd78: Strip remaining stale JSDoc / inline comments referencing the cartesian-drop chain (closes #827).
- b8372c1: Route core's own `Project.permutations` consumers through callback abstractions: `buildCells` takes a `resolveTuple` callback, `validateChrome` takes a token-ID set (part 2 of 3 for #815).
- 158f2e1: Delete legacy cartesian-era code paths: `analyzeAxisVariance()` + `/variance` subpath, `buildJointOverrides()`, internal `emitCss()`, `composeProjectCss()`. Migration: use `project.varianceByPath.get(path)` and `probeJointOverrides(...).overrides`.
- de4cc3d: Remove `Project.permutations`/`permutationsResolved` + `Permutation`/`permutationID` from the public surface; rename `Project.graph`→`Project.defaultTokens` (closes #815). Migration: use `project.resolveAt(tuple)` and `project.defaultTokens`.
- 09d957f: Route non-core read sites off `Project.permutations`/`permutationsResolved` onto `cells`/`resolveAt`/`varianceByPath`/`defaultTuple` (part 1 of 3 for #815).
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

- 674944b: Expose `buildResolveAt` via the new dep-free `./resolve-at` subpath; blocks consume `resolveAt(activeTuple)` instead of indexing `permutationsResolved`.
- 905161d: Drop `projectCss` + `emit.ts`, making smart `emitAxisProjectedCss` the single emitter; drop the addon's `emitMode` option and `emit_css`/MCP dispatch. Breaking for consumers importing `projectCss` or setting `emitMode: 'cartesian'`.
- af73dc4: Lift `resolveAt` to the preview decorator and ship it through `SwatchbookContext`; drop wire-shipped `permutations`/`permutationsResolved`/`defaultPermutation` (closes #793).
- f09066f: Server-side consumers switch from `Project.permutationsResolved[name]` indexing to `project.resolveAt(tuple)`; MCP builds a `tupleByName` map per project. Tool I/O unchanged.
- f1cf2db: Add `Project.cells`/`jointOverrides`/`defaultTuple`/`resolveAt(tuple)` alongside the cartesian shape (additive); foundation for moving consumers off the cartesian map.
- d29813e: Add `Project.varianceByPath` caching per-token `AxisVarianceResult` at load time for O(1) axis lookups.
- 5178532: Ship `cells`/`jointOverrides`/`varianceByPath`/`defaultTuple` over the virtual module + HMR snapshot (additive); `AxisVariance` block uses the O(1) `varianceByPath` lookup.

### Patch Changes

- e161fdb: Index permutations by canonical tuple key once per snapshot (`permutationNameForTuple`), dropping `AxisVariance`'s per-cell `permutations.find` scans.
- 0932217: Rewrite the joint-overrides build to probe via `resolver.apply` directly, returning `overrides` + `jointTouching`; fixes a false-positive where a non-touching axis looked like it touched a token.
- 9de9db9: The layered loader now enumerates `Σ(axes × contexts)` singleton tuples instead of cartesian. `Config.maxPermutations`, `cartesianSize()`, `permutationGuardDiagnostic()`, `DEFAULT_MAX_PERMUTATIONS`, and the `swatchbook/permutations` diagnostic are removed. Migration: drop `maxPermutations` from config.
- a2f776e: `loadProject` no longer calls `resolver.listPermutations()`; enumerates only singletons, bounding `resolver.apply` calls and loading 15M-tuple resolvers in ms. `Project.cells` now stores delta cells. Removed `resolvePermutation()` + `ResolvedPermutation`.
- e170124: Smart emitter + `analyzeProjectVariance` Phase 1 read `project.cells` directly instead of `findPermByTuple`. Internal; same output.
- 83224fb: Smart emitter compound-block emission + `analyzeProjectVariance` Phase 3 read `project.jointOverrides` directly. Internal; same output.
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

- 8fb128c: Add `emitMode: 'cartesian' | 'projected'` (default `'projected'`); the smart axis-projected emitter backs the addon's virtual-module `css` export.
- 31999ef: Remove the unused `permutations` prop from `<ThemeSwitcher>` and the `SwitcherPermutation` type.
- 7b4225a: Add `emitAxisProjectedCss(permutations, permutationsResolved, options?)` emitting a `:root` baseline plus per-axis cell deltas (orthogonal axes only). Additive.
- 5ed6b04: Rewrite `emitAxisProjectedCss` to route per-token between projection and compound selectors via `analyzeProjectVariance`; spec-faithful for any DTCG resolver. Signature → `(project, options)`; `@internal`.
- 812676f: Add internal `analyzeProjectVariance(project)` classifying each token's axis variance. Analysis only; no emit change.

### Patch Changes

- ded154d: Correct the orthogonality framing on `emitAxisProjectedCss`: projection is a lossy size optimization for non-orthogonal modifiers, cartesian is the spec-faithful default. Docs only.
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

- 39dd274: Add unit coverage for the computed + emit MCP tools (#695).
- d6ceac1: Add unit coverage for `load-config.ts` (#695).
- b72ebdf: Add unit coverage for project-metadata MCP tools plus the in-memory test harness (#695).
- 20fcb3b: Add unit coverage for `contrast.ts` and `format-color.ts` (#695).
- c0ec405: Add unit coverage for token-introspection MCP tools (#695).
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

- 0b14715: Rename the cartesian-product surface from `themes` to `permutations` across the public API (`Project.themes`→`permutations`, `resolveTheme()`→`resolvePermutation()`, `Theme`→`Permutation`, virtual exports, typegen, and more). Drop the legacy `parameters.swatchbook.theme` reader and `globals.swatchbookTheme` channel. Add `Config.maxPermutations` guard (default 1024) defending against pathological resolver cartesian-product OOMs; CSS attribute and `ThemeSwitcher` naming unchanged.
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

- 5324d0c: Make the MCP-client wiring instructions client-agnostic across the README and docs site.
  - @unpunnyfuns/swatchbook-core@0.20.2

## 0.20.1

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.20.1

## 0.20.0

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.20.0

## 0.19.9

### Patch Changes

- 2444c4e: Rework every package README to the docs-intro register, pushing detail-dense reference material to the docs site (~700 → ~370 total lines).
- Updated dependencies [2444c4e]
  - @unpunnyfuns/swatchbook-core@0.19.9

## 0.19.8

### Patch Changes

- a753766: Rework every package README to the docs-intro register, pushing detail-dense reference material to the docs site (~700 → ~370 total lines).
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

### Minor Changes

- e702b29: Fuzzy search across `TokenNavigator`, `TokenTable`, and MCP `search_tokens` (case-insensitive, single-typo tolerant, out-of-order terms); core exports `fuzzyFilter` / `fuzzyMatches`, backed by `@leeoniya/ufuzzy`.

### Patch Changes

- Updated dependencies [e702b29]
  - @unpunnyfuns/swatchbook-core@0.15.0

## 0.14.1

### Patch Changes

- Updated dependencies [b5976cd]
  - @unpunnyfuns/swatchbook-core@0.14.1

## 0.14.0

### Patch Changes

- Updated dependencies [171c9aa]
  - @unpunnyfuns/swatchbook-core@0.14.0

## 0.13.1

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.13.1

## 0.13.0

### Minor Changes

- 018f518: Add `get_axis_variance` MCP tool + extract the variance algorithm into core as `analyzeAxisVariance`, classifying a token's axis dependence (`constant` / `single` / `multi`).

### Patch Changes

- Updated dependencies [018f518]
- Updated dependencies [f03161f]
- Updated dependencies [74e755c]
  - @unpunnyfuns/swatchbook-core@0.13.0

## 0.12.0

### Minor Changes

- 197b856: Add the `get_color_contrast` MCP tool computing contrast between two color tokens per theme via `wcag21` (1–21 ratio + AA/AAA pass flags) or `apca` (signed Lc + pass flags). Built on colorjs.io; no new deps.

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.12.0

## 0.11.6

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.11.6

## 0.11.5

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.11.5

## 0.11.4

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.11.4

## 0.11.3

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.11.3

## 0.11.2

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.11.2

## 0.11.1

### Patch Changes

- a294673: Restore the `swatchbook-*` prefix in each package README's title header so it matches the published package name.
- Updated dependencies [a294673]
  - @unpunnyfuns/swatchbook-core@0.11.1

## 0.11.0

### Minor Changes

- da22d9e: First npm publish of `@unpunnyfuns/swatchbook-switcher` and `@unpunnyfuns/swatchbook-mcp` (previously 404'd; trusted publishing covered only core/addon/blocks). Tips the fixed group to 0.11.0.

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.11.0

## 0.10.2

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.10.2

## 0.10.1

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.10.1

## 0.10.0

### Minor Changes

- 23fb25d: New `@unpunnyfuns/swatchbook-mcp` MCP server exposing a swatchbook DTCG project to AI agents (`describe_project`, `list_tokens`, `search_tokens`, `resolve_theme`, `get_token`, `get_alias_chain`, `get_aliased_by`, `get_consumer_output`, `get_color_formats`, `list_axes`, `get_diagnostics`, `emit_css`). Runs without Storybook, watches source + config (opt out with `--no-watch`); usable as a CLI or MCP client, with `createServer` / `loadFromConfig` exports for embedding.

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.10.0
