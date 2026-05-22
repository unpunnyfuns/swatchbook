# @unpunnyfuns/swatchbook-blocks

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

- c270b8c: Brand `TupleKey` for canonical-tuple-key strings.

  `canonicalKey` and `jointOverrideKey` now return a `TupleKey = string & { readonly __brand: 'TupleKey' }` instead of bare `string`. `Project.jointOverrides` and the in-memory memo Map inside `buildResolveAt` use it too, as does the wire-shape `jointOverrides` entry the addon ships through `virtual:swatchbook/tokens` for the blocks preview.

  The brand catches places that pass an arbitrary string (token paths, axis names, theme display names) into a context expecting a canonical tuple key — these used to all compile as plain `string`. Structurally still `string`, so JSON round-trips and `Map` lookups behave identically; the brand is purely compile-time.

  Scope is intentionally narrow per [issue #941](https://github.com/unpunnyfuns/swatchbook/issues/941)'s "alternative narrower scope" — axis and context names stay bare `string` to avoid casting every fixture literal.

  `TupleKey` is exported from `@unpunnyfuns/swatchbook-core`.

- Updated dependencies [c270b8c]
- Updated dependencies [3e9e310]
  - @unpunnyfuns/swatchbook-core@0.59.0

## 0.58.1

### Patch Changes

- acfb0a5: Wrap the search-query state with `useDeferredValue` in `<TokenTable>`, `<TokenNavigator>`, and `<ColorTable>`. The input controls the immediate `query` (still re-renders on every keystroke so the field stays responsive), but the heavy memos — `fuzzyFilter` scans, `pruneTreeForMatches` rebuilds, group visibility — key off the deferred copy and run at React's chosen tempo. Keystroke latency stops scaling with token count on large projects.
- 12a9059: Two small perf fixes in blocks:

  - `GroupRow` in `<ColorTable>` is now wrapped in `React.memo`. Every variant-pill click or row-expand mutates `selectedByBase` / `expandedByBase` at the parent, but with no memo every row re-rendered on each mutation. With `memo` only the affected row re-renders; the parent's existing `useCallback`-wrapped handlers carry stable identity.
  - `<Diagnostics>` collapsed the three separate traversals over `diagnostics` (`summaryText` for counts, `hasErrorsOrWarnings` for the open-flag, `summaryVariant` for the className) into one `summarize()` walk that returns `{ text, variant, hasErrorsOrWarnings }`. Wrapped in `useMemo` keyed on `diagnostics` so the walk only runs when the array identity changes.

- 63541d6: Narrow `useMemo` dep arrays in `TokenTable`, `ColorPalette`, `ColorTable`, and the addon preview decorator to the specific fields each memo body actually consumes. Previously they depended on the whole `project` / `globals` / `parameters` object — token-value HMR or Storybook's per-render object recreation invalidated downstream memos even when the consumed fields were unchanged.

  - `resolveCssVar` and `resolveColorValue` in `packages/blocks/src/internal/use-project.ts` now take `Pick<ProjectData, 'listing' | 'cssVarPrefix'>` and `Pick<ProjectData, 'listing'>` respectively. Existing callers passing the full `ProjectData` keep working via structural subtyping.
  - `resolveTuple` and `resolveColorFormat` in `packages/addon/src/preview.tsx` take their inputs directly (`axesGlobal` + `paramSwatchbook` / `colorFormatGlobal`) instead of the broader `SwatchbookGlobals` + `StoryParameters` bags.

- ea60c22: `<TokenNavigator>` perf cleanup:

  - `LeafPreview` and `LeafRow` are now wrapped in `React.memo`. `LeafPreview` resolves CSS vars + formats values per leaf — on every keystroke the search query churns `flatVisible`, which previously re-rendered every leaf row and its preview. With memo, leaves with unchanged props skip rerendering. `LeafRow` takes `isFocused` as a pre-computed boolean (instead of receiving the full `focusedPath` string and re-deriving it internally) so focus shifts only re-render the previously- and newly-focused rows.
  - The focused-path repair effect (`useEffect` that called `setFocusedPath` based on `flatVisible`) is replaced with a `useMemo` that derives the visible focused path during render from the user-driven `storedFocus` plus `flatVisible`. Removes the deriving-state-in-effect anti-pattern; no spurious extra render per keystroke.
  - The DOM-sync `useEffect` that calls `node.focus()` when the active path moves stays in place — it's a legitimate DOM side-effect, not state derivation.

  `TreeNodeRow` itself is intentionally not wrapped in `memo`. Its `expanded: Set` prop changes identity on every toggle, which would defeat memoization anyway; group rows are also cheap relative to leaf rows.

  - @unpunnyfuns/swatchbook-core@0.58.1

## 0.58.0

### Minor Changes

- 33550f4: Drop the composed `data-<prefix>-theme="<tuple name>"` attribute. The per-axis attributes (`data-<prefix>-<axis>="<context>"`) are the actual scoping surface — the smart CSS emitter targets single-axis selectors plus joint compounds across multiple, never `[data-*-theme]`. The composed attribute was a v0.5-era artifact from before axes landed.

  - `themeAttrs(prefix, tuple)` (blocks): signature change. Now takes the active tuple and returns per-axis attrs + the stable `data-swatchbook-block` marker + wrapper classes. Replaces the old `themeAttrs(prefix, themeName)` shape.
  - `perAxisAttrs(prefix, tuple)` (blocks): new helper for elements that want per-axis cell scoping without block-wrapper chrome — used by `AxisVariance` so each grid swatch's CSS vars resolve at the cell's tuple instead of the document root's active tuple. **Fixes a visual bug**: grid swatches previously all showed the active tuple's color because the per-cell `data-<prefix>-theme` they wrote had zero CSS rules keyed against it.
  - Preview decorator (addon): stops writing `data-<prefix>-theme` on `<html>` and the story wrapper.
  - `ProjectData.themeNameForTuple` / `TokenDetailData.themeNameForTuple` (blocks): removed. Synthesise tuple names locally with `tupleToName` if needed.

### Patch Changes

- c1da921: `<DetailOverlay>` now sets `inert` on every other top-level body branch while it's mounted, restoring each sibling's original state on unmount. `aria-modal="true"` alone is widely known to be insufficient — VoiceOver and NVDA virtual cursors + swipe gestures still pierce the dialog and read sibling content behind the backdrop. `inert` is the modern fix; browsers without it (very old Safari/Firefox/Chrome) fall back to the existing focus trap + `aria-modal`.

  Bundled focus + inert in one `useEffect` so cleanup runs un-inert _before_ opener-focus restore — `.focus()` on an inert element is a no-op, so the order matters.

- 1f2af27: Add `aria-live` polite live regions for status transitions that were previously visual-only:

  - `<CopyButton>` — copy success transition. The icon variant's `✓` glyph is `aria-hidden`; the new sr-only live region announces "Copied" for SR users.
  - `<TokenTable>` + `<TokenNavigator>` — search match-count. The caption text already updates visually, but `<caption>` isn't re-announced by AT mid-interaction. New sr-only live regions announce `N tokens matching "<query>"` as the user types.

  Each component carries its own component-namespaced sr-only utility class (`__sr-status` / `__sr-only`) following the existing pattern in `ColorTable`. A future tidy could extract a shared utility.

  Audited finding from #932 scoped to the two clear wins; theme/axis-flip page-level announcements are deferred — that wants a debounced single live region in the addon preview decorator and rises above this PR's risk envelope. Gamut warnings already carry `aria-label="out of gamut"` everywhere (`TokenDetail`, `TokenTable`, `ColorPalette`, `ColorTable`); audit's finding there was outdated.

- 39b3b2a: `<MotionSample>`'s reduced-motion fallback prose wrapped the CSS media query in literal backticks (`Animation suppressed by \`prefers-reduced-motion: reduce\`.`). Screen-readers read the backticks aloud verbatim. Wrap the identifier in `<code>` instead — readable in print, parsed as a code-span by SR voicing.
- 1d4453e: Add disclosure semantics to clickable `<TokenTable>` rows and `<ColorTable>` group rows.

  - `<TokenTable>` rows already carry `tabIndex={0}` + `aria-label="Inspect <path>"` + Enter/Space activation; they now also carry `aria-haspopup="dialog"` so SR users hear the row will open a dialog before activating.
  - `<ColorTable>` group rows split by mode:
    - When `onSelect` is set (consumer owns the follow-up UI), the row carries `aria-haspopup="dialog"` — same as TokenTable.
    - In the default in-place-expand mode, the row's `aria-label` already rotates between `"Expand <base>"` and `"Collapse <base>"` to communicate state. No additional ARIA: `aria-expanded` on `<tr>` is invalid outside a `treegrid`, and the row isn't a popup trigger.

  `<tr>` elements keep their table-row semantics; the ARIA attributes layer disclosure cues on top without replacing roles.

- ecf7823: Three small ThemeSwitcher / addon-toolbar / Diagnostics a11y touches bundled.

  - **Addon toolbar `aria-haspopup`** — was `"dialog"` but the switcher body renders `role="group"` (settings panel, not modal dialog). Promised more than the popover delivered; switched to generic `aria-haspopup={true}` so the trigger announces "has popup" without claiming a dialog flavour that doesn't match.
  - **ThemeSwitcher `OptionPill`** — dropped `onMouseDown={(e) => e.preventDefault()}`. The preventDefault stripped focus on mouse-click so subsequent Tab restarted at the manager toolbar instead of the just-clicked pill, hurting keyboard users alternating mouse + Tab. The pill's `:focus-visible` ring already gates ring-on-mouse, so removing preventDefault doesn't bring back sticky focus rings for normal users.
  - **Diagnostics severity SR distinction** — explicit `role="list"` on the diagnostics `<ul>` (CSS-styled lists can shed list semantics in some AT combos), `aria-hidden` on the redundant severity-label span, and `aria-label="<severity>: <message>"` on each row so SR users hear "Error: <message>" / "Warning: <message>" / "Info: <message>" as one announcement unit.

- 3de4efb: `<TokenNavigator>` treeitem rows (both group and leaf) now carry the full WAI-ARIA tree-position metadata: `aria-level` (1-indexed depth), `aria-setsize` (count of siblings at this level), and `aria-posinset` (1-indexed position among siblings). Screen readers can now announce "item 3 of 12, level 2" instead of just "item" — required by the tree pattern when DOM ancestry alone doesn't carry the cardinality info AT needs.

  Threaded through `TreeNodeRow` + `LeafRow` props from the root render; recursion increments level + recomputes sibling counts at each step.

- f73637a: Tighten the canonical `Project` type surface — pre-1.0 readonly + closed-set narrowing pass.

  - `Project.chrome: Record<string, string>` → `Partial<Record<ChromeRole, string>>`. The `validateChrome` loader already enforces keys ∈ `CHROME_ROLES` at runtime; the type now reflects it. Same on `CommonConfig.chrome`.
  - `Project.axes: Axis[]` → `readonly Axis[]`. Matches the existing `readonly` on sibling fields (`disabledAxes`, `presets`); post-load the array is immutable in practice.
  - `Project.sourceFiles: string[]` → `readonly string[]`. Same rationale.
  - `SnapshotForWire.varianceByPath` drops the `ReturnType<Project['varianceByPath']['get']>` indirection (which carries an unused `| undefined`) for the direct `Record<string, AxisVarianceResult>` it always actually is.
  - `Permutation.input: Record<string, string>` → `Readonly<Record<string, string>>`. Internal `@internal` field; readonly matches its consumer pattern.
  - Added `never` exhaustiveness `default:` branches to two switches over closed unions: `axisTouchesToken` over `VarianceInfo` (`packages/core/src/css-axis-projected.ts`) and `AxisVariance`'s render switch over `AxisVarianceResult` (`packages/blocks/src/token-detail/AxisVariance.tsx`). A future variant lands and these throw loudly at runtime instead of falling through silently.
  - Aligned `addon/channel-types.ts` `VirtualToken` with `blocks/contexts.ts` `VirtualTokenShape` — added the missing `aliasOf` / `aliasChain` / `aliasedBy` / `partialAliasOf` fields so what ships over the channel matches what blocks expect to read.

  Closes #940

- 1f65ada: Tighten weak / smoke-only test assertions across packages — sweep from the audit's test-invariant-quality lens. Each previously-weak assertion now pins a meaningful, falsifiable invariant.

  - `variance-analysis-layered.test.ts` (closes #930) — was silently passing when the fixture's `color.accent` wasn't actually multi-touch. Extended the layered fixture (`brands/brand-a.json`) so `color.text` is overridden by both `mode` and `brand` axes; the test now asserts the actual classifier output (`orthogonal-after-probe` with `touching: {mode, brand}`). Surfaced a separate docstring-vs-implementation discrepancy filed as #942.
  - `prefers-reduced-motion.browser.test.tsx` — admitted in a comment it couldn't tell apart "initial-render default" from "useEffect set false". Now captures the full `observed[]` sequence + asserts `matchMedia` was actually called.
  - `variance-analysis-reference.test.ts` — joint-case loop was `toBeTruthy()` per field; now pins the known Dark+Brand A case end-to-end: `permutationName` shape, `cartesianValueKey` matches `JSON.stringify(jointOverrides[...].$value)`.
  - `cells.test.ts` — "default cell on each axis is the shared baseline" was a length-check; now asserts reference identity (`.toBe(baseline)`), the contract that lets `resolveAt` skip copies.
  - `config-terrazzo-options.test.ts` — `terrazzoPlugins` test ended with `expect(entry).toBeDefined()`; now also asserts the listing populated alongside the plugin invocations.
  - `computed-and-emit.test.ts` `get_color_formats` — `raw` field only had `.toBeDefined()`; now asserts `JSON.parse(raw.value)` round-trips with `colorSpace` + `components|channels`.
  - `computed-and-emit.test.ts` `resolve_theme` — partial-tuple test asserted `toBeTruthy()` on every axis; now asserts equality to each axis's declared `default`.
  - `token-introspection.test.ts` `get_token` — per-theme entries asserted only `toBeTruthy()`; now asserts Light-themed vs. Dark-themed value sets actually differ (a resolver bug emitting the same value across modes would slip through `toBeTruthy`).

  Plus the smaller nits: dropped a no-op `expect(resolverPath).toBeDefined()` in `resolver-edge-cases.test.ts`, added `group: 'swatchbook/presets'` / `'swatchbook/chrome'` literal pins to two diagnostic-assertion tests where prose was the only signal, swapped a tight diagnostic-prose regex for substring match.

- Updated dependencies [f73637a]
- Updated dependencies [1f65ada]
  - @unpunnyfuns/swatchbook-core@0.58.0

## 0.57.1

### Patch Changes

- Updated dependencies [0e0cc7a]
  - @unpunnyfuns/swatchbook-core@0.57.1

## 0.57.0

### Minor Changes

- 975944d: Consolidates the two divergent path-matchers onto a single `@unpunnyfuns/swatchbook-core/match-path` subpath:

  - `packages/blocks/src/internal/use-project.ts:globMatch` (5-line prefix matcher; treated `color.*` as "any descendants")
  - `packages/mcp/src/match.ts:matchPath` (full mid-string `*` / `**` matcher; treated `color.*` as strict single-segment per conventional glob spec)

  The blocks version was a documented narrow subset; the audit (#887 worth-a-PR #8) flagged them as "diverged despite a comment claiming parity." On closer inspection they're genuinely divergent — different semantic for `color.*`. Going with the **conventional glob spec** as the unified semantics (mcp's version): `*` matches a single segment, `**` matches any number of segments. This is a pre-1.0 minor break for blocks' `filter` prop.

  **Blocks-side migration:** any consumer passing `filter="color.*"` to a block (`<ColorPalette>`, `<ColorTable>`, `<TokenTable>`, `<TypographyScale>`, `<DimensionScale>`, etc.) expecting "all descendants of color" needs to update to `filter="color.**"`. The single `*` now means exactly one segment after the prefix. The doc-site MDX (`apps/storybook/src/docs/*`, `apps/docs/docs/quickstart.mdx`, `apps/docs/docs/guides/authoring-doc-stories.mdx`, `apps/docs/docs/reference/blocks/*.mdx`) and every blocks test fixture is migrated in this PR.

  **Touched files:**

  - New `packages/core/src/match-path.ts` + `./match-path` subpath in core's `package.json` exports + tsdown entry.
  - `packages/mcp/src/server.ts` — imports `matchPath` from the core subpath; deleted `packages/mcp/src/match.ts`.
  - `packages/blocks/src/internal/use-project.ts` — `globMatch` export removed; the 13 consuming blocks (`ColorTable`, `ColorPalette`, `TokenTable`, `TypographyScale`, `OpacityScale`, `FontWeightScale`, `FontFamilySample`, `DimensionScale`, `MotionPreview`, `ShadowPreview`, `BorderPreview`, `StrokeStyleSample`, `GradientPalette`) import `matchPath` from the core subpath directly.
  - Test moved: `packages/mcp/test/match.test.ts` → `packages/core/test/match-path.test.ts`. 5 blocks-test files updated to use `**` for descendant matches; same for ~10 MDX files in apps/storybook + apps/docs.

  The unified spec also gains mid-string globs (`color.**.500`) for blocks consumers that didn't have them before.

- 87e4c44: **Breaking — blocks public surface:** vocabulary rename from "permutation" to "theme", aligning blocks with the rest of the swatchbook surface (MCP renamed in #862; the addon channel/panel already uses "theme"; the docs-site switcher already labels its dropdown "Theme").

  - `PermutationContext` → `ThemeContext`
  - `useActivePermutation()` → `useActiveTheme()`
  - `ProjectSnapshot.activePermutation` → `ProjectSnapshot.activeTheme`
  - `ProjectData.permutationNameForTuple` → `themeNameForTuple`

  The addon's preview decorator follows: its internal `matchPermutationName` helper is now `matchThemeName`, and it provides the snapshot via `ThemeContext.Provider value={themeName}` plus `snapshot.activeTheme`. Story-parameter shape (`parameters.swatchbook.permutation`) and the legacy `swatchbookTheme` global are unchanged — those are author-facing inputs covered by their own deprecation path.

  Documentation: the "Consuming the active permutation" guide moves to `consuming-the-active-theme.mdx`; in-doc references update in lockstep.

  Pre-1.0 minor bump. Consumers update their imports + field reads; type errors at every callsite make the rename mechanically straightforward.

  Closes #896

### Patch Changes

- 3302705: Enable a batch of oxlint quality rules and sweep the existing codebase via autofix.

  Direct enforcement of project conventions (`CLAUDE.md`):

  - `no-inline-comments` — "No inline end-of-line comments."
  - `import/extensions` (with `ignorePackages`) — "Import specifiers: explicit extensions, always" for relative + `#/` imports; npm package imports stay extensionless.

  Style + correctness (all autofixable, applied via `oxlint --fix`):

  - `eqeqeq` (with `smart` so `== null` stays as the "null-or-undefined" idiom)
  - `no-var`, `prefer-const`, `object-shorthand`, `no-else-return`
  - `react/self-closing-comp`, `react/jsx-boolean-value`, `react/jsx-fragments`
  - `typescript/array-type`
  - `unicorn/throw-new-error`, `unicorn/catch-error-name`, `unicorn/prefer-includes`

  CI catches future regressions; new contributors don't need to memorise the conventions.

- cb161ec: Enable `import/consistent-type-specifier-style: ["error", "prefer-top-level"]` in `.oxlintrc.json` so mixed-syntax type imports (`import { type X, value }`) are caught at lint time and autofixed to the pure top-level form (`import type { X }` / `import { value }`). Sweep over the existing codebase via `oxlint --fix`.

  Mixed-syntax type imports erase the type binding under tsc, but the bundler still sees a side-effect import — esbuild in particular can drag the entire upstream bundle just because the import statement exists. Pure top-level form is fully erased.

- c5d9089: Five small helper consolidations across the addon, blocks, switcher, and core, each previously duplicated across two or more sites.

  - New `@unpunnyfuns/swatchbook-core/style-element` subpath exporting `ensureStyleElement(id, text)` + `SWATCHBOOK_STYLE_ELEMENT_ID`. Replaces three hand-rolled `<style>`-injection blocks in the addon preview and blocks' internal `useProject`.
  - New `presetTuple` export from `@unpunnyfuns/swatchbook-switcher` — the addon's manager toolbar now imports the helper instead of carrying a byte-identical copy.
  - `cells.ts` reuses the existing `value-key.ts` helper instead of re-deriving the same `JSON.stringify($value)` comparison.
  - `ColorFormat` runtime validation in the addon manager now reads through `COLOR_FORMATS.includes()` from `@unpunnyfuns/swatchbook-blocks`, matching the preview path and dropping a hand-maintained five-way `||` chain. The `ColorFormat` type itself re-exports from blocks.
  - The 9-field `INIT_EVENT` payload subset is built once via a `pickInitFields` helper, shared between the live broadcast and the HMR re-emit.

- 4146d9f: Brand the public `TokenMap` shape as `SwatchbookToken` — a strict subset of `@terrazzo/parser`'s `TokenNormalized` covering only the seven fields downstream consumers actually read (`$type`, `$value`, `$description`, `aliasOf`, `aliasChain`, `aliasedBy`, `partialAliasOf`). `Project.defaultTokens` and `Project.resolveAt()` now return `Record<string, SwatchbookToken>` instead of leaking the full `TokenNormalized` shape (with `id`, `source`, `originalValue`, `group`, `dependencies`, `$extensions`, `$extends`, `$deprecated`) onto the public surface.

  Insulates swatchbook consumers from future Terrazzo type churn: a rename or restructure inside `TokenNormalized` won't ripple through the swatchbook API. Pre-1.0 coordinated break worth doing before 1.0 commits us.

  `SwatchbookToken` is structurally compatible with `TokenNormalized` — internal core code that bridges resolver output into a `TokenMap` keeps working without changes. The smart emitter (`css-axis-projected.ts`) is the one site that genuinely needs the full Terrazzo shape to drive `transformCSSValue` / `generateShorthand`; it casts at the boundary via a documented `asRawTokens` helper.

  Closes #892

- 062276b: Adds `@unpunnyfuns/swatchbook-core/themes` subpath consolidating the "themes-a-project-surfaces" enumeration + the `tupleToName` join. Eliminates duplicated `enumerateThemeNames` / `buildTupleByName` / inline `tupleToName` impls across 4 packages.

  **New exports** (subpath: `/themes`):

  - `tupleToName(axes, tuple)` — synthesizes the canonical theme name (`axisValues.join(' · ')` in declared axis order) for the `data-<prefix>-theme` attribute. Same form `Project.cells` keys against.
  - `enumerateThemes({ axes, presets, defaultTuple })` — iterates default tuple + per-axis non-default singletons + presets, deduped by name. Same order the loader produces.
  - `ThemeEntry`, `ThemeEnumAxis`, `ThemeEnumPreset` types.

  Pure functions, structural input types — no `Project` import, no Terrazzo parser, no Node deps.

  **Consumer migrations:**

  - `packages/addon/src/preset.ts` — `enumerateThemeNames` (16-line local impl with its own inline `tupleToName`) replaced with `enumerateThemes(project).map(t => t.name)`.
  - `packages/addon/src/preview.tsx` — `matchPermutationName` now wraps `tupleToName(virtualAxes, tuple)` instead of inlining the join.
  - `packages/blocks/src/internal/use-project.ts` — local `tupleToName` helper deleted; consumers import from core subpath.
  - `packages/mcp/src/server.ts` — local `buildTupleByName` (20-line preset-fill impl) and `tupleToName` (5-line) deleted; `buildTupleByName` now wraps `enumerateThemes(project)`.

  The internal `permutationID` in `core/types.ts` stays (still used by the loader's per-tuple keys via `Object.values(input).join(…)`); it's a slightly different signature (joins `Object.values` not `axes.map`) and remains an internal detail. The new `tupleToName(axes, tuple)` is the consumer-facing replacement that's explicit about axis ordering.

  Sixth core subpath (joining `/fuzzy`, `/resolve-at`, `/css-var`, `/data-attr`, `/snapshot-for-wire`, `/match-path`). Pre-1.0 minor bump on core (new public subpath); patch on consumer packages.

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

- afaebb8: Closes #825. `AxisVarianceResult` is now a discriminated union on `kind`:

  - `constant` — `varyingAxes: readonly []`
  - `single` — adds `axis: string` shortcut + `varyingAxes: readonly [string]`
  - `multi` — `varyingAxes: readonly [string, string, ...string[]]`

  Consumers get exhaustive `switch (result.kind)` narrowing, and the `single` variant exposes `axis: string` directly so blocks no longer need to defensively check `varyingAxes[0]` for undefined. Same applied to the addon-side `VirtualVarianceEntry` wire shape and the virtual module's ambient `VirtualAxisVarianceEntry` declaration.

  JSON wire shape is identical to the previous flat interface — MCP `get_axis_variance` and snapshot payloads keep working unchanged. New helper type `AxisVariancePerAxis` exported for consumers that want to reference the shared `perAxis` sub-shape without reaching into the union.

  `#866` and `#865` carry the remaining `JointOverrides` and `Config` discriminated-union refactors from the same audit — each higher-churn and earning a standalone PR.

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

### Patch Changes

- d54dd78: Closes #827. Internal-only — strips remaining stale JSDoc / inline comments that referenced the cartesian-drop chain, "PR 6a" / "wire format change" phases, "see commit 893331f", and "Replaces the legacy …" patterns. The bulk of these were already cleaned up in #816 / #841 / #846 as those PRs deleted the code they pointed at; this PR catches the few that survived as stranded references.

  No behavior changes.

- a310586: Third (and final) sub-PR for #818. Splits `packages/blocks`'s vitest config into two projects, matching the shape `packages/addon/vitest.config.ts` already uses:

  - **node** — pure-function tests (`*.test.ts`): `format-color`, `format-token-value`, `sort-tokens`. Run in Node, no browser harness, ~40× faster (157 ms vs ~6 s under the browser provider).
  - **browser** — component tests (`*.test.tsx`): everything that calls `render(<X />)`. Runs in real Chromium + Firefox.

  The `.ts` vs `.tsx` discriminator is load-bearing and already consistent across this package: every `.test.tsx` file renders a React component, every `.test.ts` is pure-function. No file renames needed.

  Closes the #818 trilogy; with sub-PRs 1 (switcher migration #873) and 2 (fireEvent → userEvent sweep #875) already merged, the test infrastructure alignment work from the audit's "Critical" tier is done.

- 182e82d: Internal. Blocks test fixtures now provide `cells` / `jointOverrides` / `defaultTuple` via a new `withCellsShape` test helper (`packages/blocks/test/_snapshot-utils.ts`), derived from the existing `axes` + `permutationsResolved` ergonomics so individual fixture authoring stays unchanged.

  `snapshotResolveAt` in `packages/blocks/src/internal/use-project.ts` drops the legacy `permutationsResolved`-only fallback that existed for pre-migration hand-built snapshots. Snapshots now must provide `cells` (or a `resolveAt` accessor) — `withCellsShape` covers the common test case; production preview snapshots already provide both via the addon's wire format.

  Unblocks #815 Part 3 (the actual `Project.permutationsResolved` field removal).

- b962d1f: Second of three sub-PRs for #818. Sweeps `fireEvent` calls out of the blocks and addon browser-mode test suites — replaces with `userEvent` from `@vitest/browser/context` (project convention for browser-mode tests). Affects five blocks test files plus the addon's color-format-selector test.

  Specific conversions:

  - `fireEvent.change(input, { target: { value: 'x' } })` → `await userEvent.fill(input, 'x')` (matches intent + faster than `.type()` — translates to a single Playwright `locator.fill()` call).
  - `fireEvent.click(el)` → `await userEvent.click(el)`. Drops the wrapping `act()` since userEvent handles act internally.
  - Affected `it()` functions become `async`.

  Surfaced one real-browser-only difference along the way: `userEvent.click(<tr>)` under Playwright's actionability checks doesn't reliably trigger a `<tr>`'s `onClick` handler the way React's synthetic `fireEvent.click(<tr>)` did. The `ColorTable — expansion` tests switched to keyboard activation (`row.focus()` + `userEvent.keyboard('{Enter}')`) — the row already exposes `tabIndex={0}` and an Enter/Space handler for the accessibility contract; this exercises the same path a keyboard user takes, which is the more representative real-user interaction here anyway.

  #818's third sub-PR (split blocks tests into node + browser projects) is independent and lands separately.

- b8372c1: Internal migration. Core's own consumers of `Project.permutations` / `permutationsResolved` now route through abstractions that are upstream of the singleton enumeration:

  - **`buildCells`** takes a `resolveTuple: (tuple) => TokenMap` callback. Resolver-backed projects pass `resolver.apply` directly (no scan of the singleton enumeration); layered / plain-parse projects pass a lookup over the loader's per-tuple parse output. Drops the `findPermByTuple` helper and the dependence on `Permutation[]` + `Record<string, TokenMap>` inputs.
  - **`validateChrome`** takes a `ReadonlySet<string>` of token IDs instead of iterating `permutationsResolved` itself. `loadProject` computes the set from `varianceByPath.keys()` (same union of every path that appears in any theme, by construction).
  - **`load.ts`** wires both new signatures; `validateChrome` now runs after `varianceByPath` is built so the token-ID set is ready. Order-only change; chrome diagnostics still land in the same `Project.diagnostics` order.

  Part 2 of 3 for #815. With this PR, the only remaining `permutationsResolved` reads in core live in `load.ts` itself (the legacy `Project.permutationsResolved` field is still populated for `Project.graph` and the snapshot fallback in `blocks/use-project.ts`). Field removals + public-API exits land in Part 3, blocked on #842 (migrating blocks test snapshots off the legacy fallback).

- 808d146: Closes #819. Second-half follow-up to PR #883 (which extracted the `snapshotForWire` builder helper). This PR consolidates the duplicated wire-shape type declarations on the blocks side:

  **Before:**

  - `packages/blocks/src/contexts.ts` exported `VirtualTokenShape`, `VirtualTokenListingShape`, etc.
  - `packages/blocks/src/virtual.d.ts` re-declared the same shapes inline inside the `declare module 'virtual:swatchbook/tokens'` block.
  - That virtual.d.ts was missing the `disabledAxes` export (silent drift from the addon's emitter, which has shipped `disabledAxes` over the wire since v0.55).

  **After:**

  - `VirtualTokenListingShape` now aliases `SlimListedToken` from `@unpunnyfuns/swatchbook-core/snapshot-for-wire` — cross-package alignment, same definition both addon-server-side and blocks-consumer-side.
  - `packages/blocks/src/virtual.d.ts` imports its types from `#/contexts.ts` (mirroring the cleaner pattern `packages/addon/src/virtual.d.ts` already uses with its `#/channel-types.ts`). The inline declarations are gone.
  - `disabledAxes` is now declared in `blocks/virtual.d.ts` — wire shape matches what the addon's emit + the existing `blocks/test/virtual-stub.ts` already provided.

  Net duplication: the `VirtualToken`/`Virtual*` interfaces dropped from 3× (contexts.ts + 2 virtual.d.ts variants) to 2× (one per package — blocks' `contexts.ts` and addon's `channel-types.ts`). Cross-package single-sourcing isn't feasible without violating the manager-bundle's Node-free import constraint; per-package single-sourcing is the achievable end state.

  No source changes; pure type-shape consolidation.

- 0def2d3: Closes #824. Third and final half — consolidates the three `dataAttr` impls onto a single `@unpunnyfuns/swatchbook-core/data-attr` subpath, matching the shape of `/css-var`, `/resolve-at`, and `/fuzzy`.

  Previously `dataAttr` lived in three places with identical bodies:

  - `packages/core/src/css-axis-projected.ts:8` — private inline
  - `packages/addon/src/data-attr.ts` — standalone file, used by `preview.tsx` (5 call sites)
  - `packages/blocks/src/internal/data-attr.ts` — alongside `themeAttrs` / `BLOCK_ATTR` / `WRAPPER_CLASSES`, used by `themeAttrs` internally and `AxisVariance.tsx` directly

  The duplication existed because addon and blocks couldn't import from core's main barrel (Node-only loader deps), so each made a local copy. The browser-safe subpath pattern (established by `/resolve-at` and `/fuzzy`) eliminates the dilemma.

  Touched files:

  - new `packages/core/src/data-attr.ts` + `./data-attr` export in `package.json`
  - `packages/core/src/css-axis-projected.ts` — drops inline, imports from `#/data-attr.ts`
  - `packages/addon/src/data-attr.ts` deleted; `preview.tsx` imports from the core subpath
  - `packages/blocks/src/internal/data-attr.ts` — drops local `dataAttr`, imports from core; keeps `themeAttrs` / `BLOCK_ATTR` / `WRAPPER_CLASSES`
  - `packages/blocks/src/token-detail/AxisVariance.tsx` — direct subpath import (was reaching through blocks' internal file)
  - `data-attr.test.ts` moves from addon's test dir to core's (test follows the impl)

  Closes the audit's #824 consolidation cluster: `canonicalKey` / `valueKey` / `cssEscape` (PR #869), `findPermByTuple` (eliminated by cartesian drop), `makeCssVar` (PR #880), and `dataAttr` (this PR). The `defaultTuple` builder remains explicitly skipped — 2-line inlines per the original audit comment, extracting it adds an import for no real win.

  Minor bump on core (new public subpath); patch on blocks + addon.

- fe5fa59: Second of three `#824` halves. Consolidates the two `makeCssVar` impls onto a single source — `packages/addon/src/hooks/use-token.ts:55`'s hand-rolled `path.replaceAll('.', '-')` version was a confirmed drift risk (no Terrazzo casing / unicode pass), while `packages/blocks/src/internal/use-project.ts:287`'s correct wrapper around `@terrazzo/token-tools/css`'s `makeCSSVar` was internal-only.

  Adds `@unpunnyfuns/swatchbook-core/css-var` subpath exporting `makeCssVar(path, prefix)` — same browser-safe-subpath pattern as `/resolve-at` and `/fuzzy`. Both blocks and addon now import from there; the local impls are deleted. Future Terrazzo naming-policy shifts reach both surfaces in lockstep.

  Minor bump on core because the subpath is a new public surface area; patch on blocks + addon (no public API change, just consumer-side cleanup).

  The remaining `#824` half (`dataAttr` consolidation across 3 sites in core / addon / blocks) follows the same subpath shape and lands separately.

- 144e07d: Closes #837. The addon preview's global-axis applier and the blocks channel-globals subscriber both subscribe to all three of Storybook's `globalsUpdated` / `setGlobals` / `updateGlobals` events. Subscribing to all three is intentional (each carries the payload at a different point in the preview lifecycle — init, toolbar tick, cross-frame echo) but the handlers previously ran their full update path on every fire, so a single toolbar change fan-out to 3× DOM writes / 3× snapshot updates / 3× consumer re-renders.

  Both handlers now content-dedupe on a stringified fingerprint (`axes` JSON + `format`). The first fire of each tick applies; the second and third no-op. No behavior change beyond fewer redundant updates.

  The blocks-side previous identity-equality guard (`if (next !== snapshot)`) didn't dedupe because the spread (`{ ...next, axes: nextAxes }`) produced a fresh object identity on every fire even when content was unchanged.

- 158f2e1: `@unpunnyfuns/swatchbook-core`: legacy cartesian-era code paths deleted.

  Removed (pre-1.0 minor bump):

  - `analyzeAxisVariance()` function + its `@unpunnyfuns/swatchbook-core/variance` subpath export. Replaced by `Project.varianceByPath`, the load-time-built `ReadonlyMap<string, AxisVarianceResult>` consumed by the smart CSS emitter, the MCP `get_axis_variance` tool, and the `AxisVariance` doc block. Read `project.varianceByPath.get(path)` directly.
  - `buildJointOverrides()` shim (deprecated wrapper around `probeJointOverrides`, no non-test callers).
  - Internal `emitCss()` (the 200-line cartesian-fan-out CSS emitter) — replaced by `emitAxisProjectedCss()` in v0.54.
  - Internal `composeProjectCss()` from `@unpunnyfuns/swatchbook-addon` (`@internal` test-only re-export of `emitAxisProjectedCss`).

  Type-only kept on the barrel: `AxisVarianceResult` + `VarianceKind` (relocated from `variance.ts` into `types.ts` since they're load-bearing for `Project.varianceByPath` and the wire-format shape).

  Migration: replace `analyzeAxisVariance(path, ...)` with `project.varianceByPath.get(path)`. Replace `buildJointOverrides(...)` with `probeJointOverrides(...).overrides`.

  Docs site updated to document `project.varianceByPath` instead of the removed function.

- 444433e: Closes #823 and #832. Test-only.

  - **`@unpunnyfuns/swatchbook-core`** — the existing `swatchbook/resolver` test in `resolver-edge-cases.test.ts` was silently `return`ing in both branches (Terrazzo-rejects + diagnostic-absent), asserting nothing in either edge case. Tightened so exactly one of the two acceptable outcomes must hold: either `loadProject` throws with a recognizable error, or the project carries a `swatchbook/resolver` warn naming the broken modifier.
  - **`@unpunnyfuns/swatchbook-blocks`** — new `prefers-reduced-motion.test.tsx` covers the `usePrefersReducedMotion` hook + the internal `isChromatic` detector by stubbing `navigator.userAgent` and `window.matchMedia`. Three cases: Chromatic-UA-wins-over-matchMedia, matchMedia-true outside Chromatic, both-false fall-through. Pins the Chromatic detection so a silent regression doesn't un-stabilize the motion-bearing visual snapshots.

  The third audit-flagged diagnostic (`swatchbook/project` at `load.ts:107-113`) is unreachable under singleton enumeration — separately tracked as #852.

- 0f10c72: Partial close of #829. Drops trivial `.toBeDefined()` assertions on `getByText` / `getByTestId` / `findByTestId` results across the blocks test suite (38 sites in 10 files). Testing Library's `getByX` throws on absence, so `.toBeDefined()` was a no-op — the throw already enforced the invariant. The presence check now reads as `screen.getByText('…')` (or `screen.getByTestId('…')`) without the redundant assertion wrapper.

  Three remaining `.toBeDefined()` call sites that were also no-ops (against variables already returned by a throwing finder + then narrowed via `as`) are similarly cleaned up.

  The "one describe per file" half of #829 — splitting 4 multi-describe test files — is deferred to #858 for review-burden separation. No behavior change in this PR.

- 5953b56: Partial close of #835. Eliminates 11 of 13 `as string` / `as number` casts that worked around `noUncheckedIndexedAccess`. Each was replaced with a proper narrowing pattern (`typeof` checks, hoisted-variable + undefined-check, or `for…of` over `.entries()`):

  - `packages/core/src/types.ts` — `permutationID` uses destructured `[first, ...rest]` to narrow the array.
  - `packages/core/src/joint-overrides.ts` — `partialTuple[axis.name]` reads narrow via `undefined`-check `continue`.
  - `packages/core/src/variance-analysis.ts` — single-touching-axis case narrows by checking `axis !== undefined`.
  - `packages/core/src/fuzzy.ts` — ranked-index walk uses `flatMap` to drop undefined entries.
  - `packages/blocks/src/TokenNavigator.tsx` — segments loop narrows + continues on undefined.
  - `packages/blocks/src/format-color.ts` — `hexVal` hoisted then `typeof` narrowed.
  - `packages/blocks/src/internal/sort-tokens.ts` — `safeNumber` helper narrows `number | null | undefined` from `colorjs.io`'s `coords`.
  - `packages/addon/src/manager.tsx` — `rawTuple` / `rawColorFormat` narrow via `typeof` + literal-equality check.

  Two casts remain, both intentional: `sort-tokens.ts:187` (`source as string` for `colorjs.io`'s constructor union — documented in the surrounding comment) and `preview.tsx:294` (`previewResolveAt as unknown as ...` — structural mismatch the audit specifically flagged for a separate fix; tracked in #835 follow-up).

- 8fbe3e9: Fixes #817. `useProject()`'s returned `ProjectData` is now memoized against the stable inner-field identities, instead of being constructed fresh on every render.

  Previously the `snapshotToData(snapshot, resolveAt)` call ran inline on every render and produced a new object identity even when its inputs were unchanged — `resolveAt` was already memoized correctly, but the wrapping `ProjectData` wasn't. Downstream block consumers that do `useMemo([project, …])` saw a fresh `project` identity every render and invalidated their memos every time. The `useProject` JSDoc already warned about this exact shape for `resolveAt`; the wrapping object had the same problem, just one layer up.

  Same fix applied to the virtual-module fallback path (`useVirtualModuleFallback`), and to its internal `activeAxes` value which was being recomputed inline.

  No public API changes. Block render perf improves on every consumer that memoizes against `project` (`TokenNavigator`, `TokenTable`, `ColorPalette`, etc.).

- a7025fe: Closes #866. Collapses `JointOverrides` from `ReadonlyMap<string, JointOverride>` to `ReadonlyArray<readonly [string, JointOverride]>` — the same shape consumers already saw on the wire (virtual module, Storybook channel) and what blocks-side `makeResolveAt` already reconstructed Maps from on every snapshot read.

  No consumer uses keyed lookup. The three downstream callers (`buildResolveAt` in `resolve-at.ts`, `analyzeProjectVariance` in `variance-analysis.ts`, the smart emitter's `collectJointBlocks` in `css-axis-projected.ts`) all do `for (const … of …values())` iteration; switching to `for (const [, override] of …)` array destructuring is the only call-site change. Tests using `.size` switch to `.length`.

  `probeJointOverrides` still uses an internal `Map<string, JointOverride>` for canonical-key dedupe across arity passes; the public return is materialized to the array shape on emit. The Map-↔-array marshaling on the wire boundary disappears: `addon/virtual/plugin.ts` (both module body and HMR re-broadcast) stops calling `[...project.jointOverrides.entries()]`, and `blocks/internal/use-project.ts` stops `new Map(...)` reconstructing on every render.

  Pre-1.0 minor bump (`JointOverrides` is a public type export from core).

- 09d957f: Internal migration. Non-core read sites that iterated `Project.permutations` or indexed into `Project.permutationsResolved[name]` now route through `cells` / `resolveAt` / `varianceByPath` / `defaultTuple` instead. Theme name strings (e.g. `"Dark · Brand A"`) are synthesized from `axes + defaultTuple` at the call sites that need them, independent of the soon-to-be-removed `Project.permutations` array.

  Touched consumers:

  - `@unpunnyfuns/swatchbook-mcp` server tools (`describe_project`, `list_tokens`, `get_token`, `list_axes`, `get_alias_chain`, `get_aliased_by`, `get_color_formats`, `get_color_contrast`, `get_axis_variance`, `search_tokens`, `resolve_theme`, `get_consumer_output`) + the CLI's reload log line.
  - `@unpunnyfuns/swatchbook-integrations` css-in-js `collectPaths` (now reads `varianceByPath.keys()`).
  - `@unpunnyfuns/swatchbook-addon` preset `renderTokenTypes` (dropped the `permutationsResolved` fallback; enumerates singleton theme names from axes/presets/defaultTuple).
  - `@unpunnyfuns/swatchbook-blocks` `use-project` (dropped the legacy `nameForTuple` / `tuplesEqual` helpers; narrowed the snapshot fallback to the active-permutation path only).

  `Project.permutations` and `Project.permutationsResolved` are unchanged in this PR. Part 1 of 3 for #815 — the field removals and `Permutation`/`permutationID` exit from the public API land in subsequent PRs.

  Three vestigial MCP tests dropped (asserted a "No permutations in project." error string from guards the migrated tools no longer need; the new default-theme-name path always resolves).

- 63eb55a: Closes #863. Drops the last `as unknown as` cast in `packages/addon/src/preview.tsx` by structurally aligning `VirtualTokenShape` with what `buildResolveAt` actually returns: optional string fields widened to `?: T | undefined` so they accept Terrazzo's `string | undefined` shape under `exactOptionalPropertyTypes`, and `partialAliasOf` retyped as `unknown` since its per-composite-type structure is heterogeneous (color's `components: (string | undefined)[]` doesn't fit `Record<string, string | undefined>`; the `CompositeBreakdown` consumer already narrows at runtime).
- a2a0c61: Closes #836. `sortTokens` pre-computes per-token sort keys once before sorting (Schwartzian transform) instead of recomputing on every pair comparison. For N tokens, sort does O(N log N) comparisons; the per-call cost was dominated by the Oklch color conversion (`new Color()` + `to('oklch')`) on every comparison involving color tokens.

  Now: one key-computation pass per token (O(N)), then O(N log N) cheap key-comparison lookups. Visible improvement on `<ColorTable>` / `<TokenTable>` with a few hundred color tokens, especially on slower devices or in Chromatic capture runs.

  No behavior changes — same sort order in every case.

- 575ccb6: Closes #858. Splits four test files that carried 2–4 top-level `describe` blocks into one-file-per-describe, per project convention ("one describe per file at most"):

  - `packages/core/test/permutations-normalize.test.ts` → `permutations-normalize-gating.test.ts` + `permutations-normalize-dispatch.test.ts`. Disjoint setup; gating tests don't need the workspace-tmpdir lifecycle the dispatch tests use.
  - `packages/core/test/variance-analysis.test.ts` → `variance-analysis-reference.test.ts` + `variance-analysis-layered.test.ts` + `variance-analysis-edge-cases.test.ts`. Each new file owns its own `beforeAll` for the project it loads — the reference fixture, the layered fixture, or none.
  - `packages/blocks/test/detail-overlay.browser.test.tsx` → `-focus-lifecycle`, `-focus-trap`, `-dismissal` splits + shared `_detail-overlay-helpers.tsx` for `emptySnapshot()` / `renderOverlay()`.
  - `packages/blocks/test/token-navigator-keyboard.browser.test.tsx` → `-roving-tabindex`, `-arrow-navigation`, `-expand-collapse`, `-activation` splits + shared `_token-navigator-keyboard-helpers.tsx` for `snapshot()` / `renderNav()` / `treeItem()`.

  Helpers use the existing leading-underscore convention (matching `_color-table-helpers.tsx`, `_helpers.ts`). No assertion changes; same tests, same shapes, just reachable as flat `it()` calls in each file's reporter output.

- 686c5b0: Closes #831. Adds `play()` coverage to the seven previously-uncovered token-detail story files in `apps/storybook` (`AliasChain`, `AliasedBy`, `AxisVariance`, `CompositeBreakdown`, `CompositePreview`, `TokenHeader`, `TokenUsageSnippet`); only `ConsumerOutput.stories.tsx` had interaction coverage before.

  Each play asserts the block's user-facing render against the active fixture token — type pills and CSS-var text for `TokenHeader`, the alias-chain DOM for `AliasChain`, the aliased-by tree presence for `AliasedBy`, the values-table layout for both multi-axis and constant tokens in `AxisVariance`, the typography / shadow key/value grid in `CompositeBreakdown`, the color-swatch and typography pangram samples in `CompositePreview`, and the snippet text plus clipboard copy in `TokenUsageSnippet`. Also adds negative-path coverage where the block legitimately returns null (e.g. `AliasChain` for a primitive, `AliasedBy` for a leaf alias) — guards against accidental "always renders" regressions.

  No source changes; pure storybook test coverage.

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

### Minor Changes

- 3be6285: `TokenNavigator` now implements the full WAI-ARIA tree-view keyboard pattern. The `<li role="treeitem">` is the focusable element (roving tabindex — exactly one item carries `tabIndex=0`, the rest are `-1`); arrow keys traverse the visible tree (`Down`/`Up` walk the flattened list; `Right` expands a collapsed group or steps to the first child; `Left` collapses an expanded group or steps to the parent); `Home`/`End` jump to the first / last visible treeitem; `Enter`/`Space` activates a leaf or toggles a group. Previously focus lived on a nested `<div role="button">` and only Enter / Space worked.

  Behavior visible to consumers:

  - Tab into the tree lands on a single treeitem instead of cycling through every row.
  - Keyboard-only users can now traverse and operate the tree without reaching for a pointer device.
  - The DOM the consumer queries via `getAllByRole('treeitem')` is unchanged; existing component tests pass as-is.

### Patch Changes

- 6d0919f: Replace the `Record<string, unknown>` casts used to read DTCG composite `$value` shapes (`typography`, `border`, `transition`, `shadow`, `gradient`, `color`, `strokeStyle`) with named per-`$type` interfaces in a new `internal/composite-types.ts`. Sub-values stay `unknown` because each may be a primitive, an alias-resolved string, or a nested composite — the win is that typos in key reads (`fontFamlly`, `offstX`) now surface as compile errors instead of silent `undefined`s. 13 scattered casts collapse into 4 named imports. Internal refactor only; no behaviour change.
- 33de453: `DetailOverlay` now implements the WAI-ARIA dialog pattern's focus management. Opening the overlay moves focus into the panel; Tab is trapped so it cycles through the panel's interactive descendants only; closing restores focus to whatever opened the overlay (typically the table row or tree item the user clicked). Previously focus could wander into the backgrounded page on Tab, and after dismissal the user landed at the top of the document.
  - @unpunnyfuns/swatchbook-core@0.53.0

## 0.52.0

### Patch Changes

- 00a1bf7: Consolidate parallel type definitions: `@unpunnyfuns/swatchbook-blocks`'s `VirtualAxisShape` / `VirtualPermutationShape` / `VirtualDiagnosticShape` / `VirtualPresetShape` are now type-aliases of core's authoritative `Axis` / `Permutation` / `Diagnostic` / `Preset`. Internal `VirtualAxisLike` / `VirtualPermutationLike` helpers in blocks removed; core's types are used directly.

  Two array fields on core's types tighten to `readonly` so the existing immutable usage flows through cleanly:

  - `Axis.contexts: readonly string[]` (was `string[]`)
  - `Permutation.sources: readonly string[]` (was `string[]`)

  No first-party site mutates either array; consumers who treated them as immutable already match the tightened contract.

  Side cleanups while we were in here:

  - New `cssVarAsNumber` helper in blocks centralises the `var(--…)` → `CSSProperties.fontWeight` / `lineHeight` pattern. The four scattered `as unknown as number` casts are gone.
  - New `SwatchbookGlobals` / `StoryParameters` types in addon narrow the Storybook globals + parameters bags around the keys the addon actually owns. Eliminates seven `Record<string, unknown>` casts in `preview.tsx`.

  Composite-token shape narrowing (DTCG `$type` discriminated unions over shadow / border / gradient / typography) deferred to a follow-up — touches a different surface and is its own surgery.

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

- c53cef9: Fix: keyboard users now get a visible focus indicator on three interactive surfaces that previously had `tabIndex=0` + key handlers but no `:focus-visible` styling. Adds 2px solid outlines (using `var(--swatchbook-accent-bg, #1d4ed8)`) on:

  - `<TokenNavigator>` group-row + leaf-row.
  - `<TokenTable>` row.
  - `<ThemeSwitcher>` pill (was explicitly `outline: none` with no replacement).

  Mouse interaction stays focus-ring-free; only keyboard navigation paints the outline. Pre-1.0 a11y blocker per the dossier audit.

- Updated dependencies [c9b31ed]
- Updated dependencies [0b14715]
  - @unpunnyfuns/swatchbook-core@0.50.0

## 0.20.6

### Patch Changes

- a333b06: Render every non-color token through plugin-css's `previewValue` from the Token Listing — the CSS string the consumer's production stylesheet emits. A `cleanFloatNoise` post-processor scrubs IEEE-754 representation artefacts (e.g. `55.00000000000001%` → `55%`) by rounding any decimal with 8+ fractional digits to 1/1000; authored 3-decimal precision passes through unchanged. The local fallback formatters for `gradient`, `typography`, and `transition` are dropped — projects without a listing entry see truncated JSON for those types.
  - @unpunnyfuns/swatchbook-core@0.20.6

## 0.20.5

### Patch Changes

- 9bdd8da: Add `./style.css` to each package's `exports` map. The CSS files were already shipped via internal side-effect imports, but consumers that wanted to deliberately link the stylesheet (extract, reorder cascade, ship as a separate `<link>`) couldn't reach it via the package map. Now `import '@unpunnyfuns/swatchbook-blocks/style.css'` and `import '@unpunnyfuns/swatchbook-switcher/style.css'` resolve explicitly. The existing side-effect import path is unchanged.
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

- d0e2fc8: `<ColorTable>` now wraps its `<table>` in a `.sb-color-table__scroll` div with `overflow-x: auto; max-width: 100%`. Previously, wide rows (long alias paths or multiple variant pills on `nowrap` cells) could push the surrounding container horizontally — most noticeable on docs pages with several `<ColorTable>` instances stacked. The wrapper contains the worst case to the table's own region; `max-width: 240px` truncation on the value cell keeps typical rows from needing to scroll at all.
  - @unpunnyfuns/swatchbook-core@0.20.2

## 0.20.1

### Patch Changes

- d1ddb2e: `MotionSample` (and by extension `<TokenNavigator>` when it renders `duration` / `transition` / `cubicBezier` tokens inline) now falls back to its static reduced-motion state when rendering inside Chromatic's snapshot runner. Detection via Chromatic's user-agent string. The setInterval-driven ball position was previously snapshotted at different positions run-to-run, flagging affected stories as unstable in Chromatic's diff review. Skipping the loop in Chromatic produces deterministic captures. Capture-only — local dev, addon-vitest, and the manual Storybook experience keep the animated version.
  - @unpunnyfuns/swatchbook-core@0.20.1

## 0.20.0

### Minor Changes

- 33f17a1: Add `<OpacityScale>` — a type-specific block that renders each opacity token as the sample colour at that opacity over a checkerboard backdrop, so the transparency reads visually. Only `$type: 'number'` (or `'opacity'`) tokens whose `$value` is a finite number in `[0, 1]` are picked up; non-opacity `number` siblings (`line-height`, `z-index`) fall out naturally. Accepts `filter`, `type`, `sampleColor`, `sortBy`, `sortDir`, `caption` props. Default filter `'**.opacity.*'` covers common layouts (`number.opacity.*`, `opacity.*`) without configuration; default `sampleColor` is `'color.accent.bg'`.

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

- 52a5660: `<ConsumerOutput>` (and therefore `<TokenDetail>`, which composes it) now renders one extra row per non-CSS platform that appears in the Token Listing. Loading `@terrazzo/plugin-swift` / `-android` / `-sass` / `-js` through `config.terrazzoPlugins` and naming it in `config.listingOptions.platforms` is all it takes — rows with labels like "Swift", "Android", "Sass", "Js" appear automatically with each plugin's authoritative identifier, copy-to-clipboard included.

  Cashes in the per-platform half of the Token Listing migration. The data was already flowing through the addon → blocks plumbing; this change surfaces it.

  Exports `VirtualTokenListingShape` from `@unpunnyfuns/swatchbook-blocks` for consumers building custom per-platform blocks.

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

- 44483af: Adopt `@terrazzo/plugin-token-listing` as the authoritative source for per-token metadata. `loadProject` now runs the plugin alongside Terrazzo's build for resolver-backed projects and attaches a path-indexed `listing` map to `Project`. Each entry carries the plugin-css-emitted CSS variable name (`names.css`), a CSS-ready `previewValue`, the original aliased value, and `source.loc` pointing back to the authoring file + line.

  Closes the drift risk Sidnioulz flagged: the block-display surface no longer reinvents naming or value-string generation where Terrazzo already has an opinion. `ColorTable` now reads its CSS var strings from the listing when available, falling back to the local Terrazzo-wrapping `makeCssVar` when a listing entry is missing (non-resolver projects, listing-plugin errors).

  The snapshot flowing through the addon's virtual module and HMR channel includes the listing slice under a new `listing` field — consumers building blocks against `ProjectSnapshot` get the same data.

  This is step 3 of the staged Terrazzo alignment. Step 1 (`makeCssVar` → Terrazzo) landed in the prior release; color value conversion and per-platform names (Swift/Android) are follow-ups that reuse the same listing pipeline.

### Patch Changes

- bc67608: Document the Terrazzo-alignment work that landed in 0.15–0.17: the three new `defineSwatchbookConfig` props (`cssOptions`, `listingOptions`, `terrazzoPlugins`) in the config reference, the `Project.listing` + `ProjectSnapshot.listing` surface in the core and hooks references, and a new guide page on the `shared-terrazzo-options.ts` pattern for consumers who run `@terrazzo/cli` alongside swatchbook.
- 20909fa: Route the block-side `makeCssVar` through Terrazzo's `makeCSSVar` from `@terrazzo/token-tools/css` — same function `packages/core/src/css.ts` already uses when emitting the stylesheet. Removes a parallel kebab-casing implementation that would have drifted from Terrazzo's own naming rules over time. No behavior change for current inputs; future naming-policy shifts in Terrazzo now propagate to both emission and block display in one step.
- dfe4d0b: Thread the Token Listing entry through `formatTokenValue` so composite display strings (shadow / border / gradient / typography / transition) prefer `listing[path].previewValue` when available. Before this PR, value stringification for composite types was still stitched locally — listing's authoritative plugin-css-computed string was ignored. The gate: non-color types always prefer listing; color tokens prefer listing only when the active color format is `'hex'` (other formats stay as colorjs.io inspection output). Closes the last drift surface from the Token Listing adoption.

  Callers updated: `TokenTable`, `TokenDetail`, `TokenNavigator`, `DimensionScale`, `StrokeStyleSample`. `AxisVariance` deliberately keeps local formatting because it renders per-theme resolved values and listing entries carry one canonical representation.

- Updated dependencies [9496c82]
- Updated dependencies [44483af]
  - @unpunnyfuns/swatchbook-core@0.18.0

## 0.17.0

### Minor Changes

- ef944c5: `ColorTable` now collapses sibling variants into a single row with a pill selector — clicking a pill swaps the displayed HEX / HSL / OKLCH / CSS var to that variant's values. Given `variants={{ hover: 'hover', disabled: 'disabled' }}`, the tokens `color.bg.hi`, `color.bg.hi.disabled`, and `color.bg.hi.hover` emit one row with three pills (`base` / `disabled` / `hover`). Backmarket-style hyphen tails (`color.bg.hi-h` with `variants={{ hover: 'h' }}`) group identically.

  Row click now expands the row inline instead of opening a drawer. The detail panel surfaces `$description`, the token's alias chain, and — for multi-variant groups — a compact sub-table comparing every variant's values at once. `onSelect` still acts as the escape hatch: when set, it replaces both the expansion and any drawer behavior with consumer-owned follow-up.

  Single-member groups (no matching variants, or a lone variant with no siblings) render as plain rows with no pill selector. Passing no `variants` map disables grouping entirely — back-compat.

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.17.0

## 0.16.0

### Minor Changes

- c73585a: New `<ColorTable />` block — one row per color token with HEX, HSL, OKLCH, CSS var, and alias-target columns side-by-side. Each value cell carries a copy-to-clipboard button that reveals on row hover / focus. Same `filter` / `sortBy` / `sortDir` / `searchable` / `onSelect` props as `<TokenTable />`, so it drops in wherever the existing table was scoped to colors.

  `<TokenTable />` and `<TokenDetail />` also pick up copy-to-clipboard affordances: a button on the value cell in `TokenTable`, buttons on the resolved value and the usage snippet in `TokenDetail`.

  Shared `CopyButton` primitive lives in the blocks package internals — silently no-ops on environments without `navigator.clipboard.writeText` (older Safari, insecure origins).

### Patch Changes

- fba6841: Document `ColorTable` in the overview blocks reference, refresh `TokenNavigator` and `TokenTable` entries so their search primitive is described as fuzzy (not substring — swapped in 0.15), and note the copy-to-clipboard affordance on `TokenTable`'s value cell.
  - @unpunnyfuns/swatchbook-core@0.16.0

## 0.15.0

### Minor Changes

- e702b29: Fuzzy search across `TokenNavigator`, `TokenTable`, and the MCP `search_tokens` tool. Case-insensitive, tolerates a single-character typo per term, and accepts out-of-order terms — `"blue palette"` matches `color.palette.blue.500`, `"surf def"` matches `color.surface.default`. Replaces the previous case-insensitive substring match.

  Core now exports `fuzzyFilter(items, query, key, options?)` and `fuzzyMatches(haystack, query)` so downstream integrations can reuse the same ranking primitive. Backed by [`@leeoniya/ufuzzy`](https://github.com/leeoniya/uFuzzy).

### Patch Changes

- Updated dependencies [e702b29]
  - @unpunnyfuns/swatchbook-core@0.15.0

## 0.14.1

### Patch Changes

- Updated dependencies [b5976cd]
  - @unpunnyfuns/swatchbook-core@0.14.1

## 0.14.0

### Patch Changes

- 249e448: Docs: stop documenting `emitCss`, `projectCss`, and `emitViaTerrazzo` as user-facing APIs. They remain exported by `@unpunnyfuns/swatchbook-core` so existing callers don't break, but the README, reference pages, concept pages, and integration guides no longer promote them. Users who want production asset emission should run Terrazzo's CLI against the same DTCG sources.
- Updated dependencies [171c9aa]
  - @unpunnyfuns/swatchbook-core@0.14.0

## 0.13.1

### Patch Changes

- 3ce116a: Retire versioned documentation snapshots for 0.4-0.12. The 0.13 snapshot captures the post-reorg layout (Concepts as top-level, integrations docs, reshuffled guides) and becomes the single baseline. Also flips Concepts and Integrations navbar entries from the temporary `href`-with-hardcoded-`/next/` workaround to proper `type: 'docSidebar'` entries now that every retained version has those sidebars.
  - @unpunnyfuns/swatchbook-core@0.13.1

## 0.13.0

### Patch Changes

- 018f518: Add `get_axis_variance` MCP tool + extract the variance algorithm into `@unpunnyfuns/swatchbook-core` (`analyzeAxisVariance`). The algorithm now lives in one place and drives both the `AxisVariance` doc block and the new MCP tool, which classifies a token's axis dependence (`constant` / `single` / `multi`) and returns the per-axis breakdown of values seen in each context.
- ecc4e74: Docs: new guide for migrating from `@storybook/addon-themes` — decorator-by-decorator mapping to the swatchbook equivalent, coverage for class-based / data-attribute / JSX-provider patterns, honest notes on what's lost (MUI-style resolved-value factories) and what's gained.
- fea3791: Docs: add Integrations entry to the top navbar. Previously the section was only reachable via the intro page's reading guide, so users on `/next/` landed on the docs without any surfaced path to the integrations recipes.
- 34a71e7: Docs: new Integrations section covering the `@unpunnyfuns/swatchbook-integrations` package. Overview page with the recipe-coverage table + philosophy, plus per-subpath recipes for `/tailwind` and `/css-in-js` (wiring, generated output, prefix collision story, customisation hooks).
- 4349d23: Docs: reference/core gains an `emitViaTerrazzo` section, `ParserInput` + `SwatchbookIntegration` type documentation, and the new `Project.cwd` + `Project.parserInput` fields. Architecture doc picks up `parserInput` + the display-side integrations plugin system.
- f2914ae: Docs reorg:

  - Concepts promoted to a top-level navbar entry (was nested in the home sidebar).
  - `concepts/theme-reactivity` → `guides/consuming-the-active-theme`, retitled and tone-shifted to guide register (how-to, not concept).
  - `concepts/diagnostics` folded into the `<Diagnostics />` block reference in `reference/blocks/utility.mdx`, where its usage context lives. The `Diagnostic` type remains in `reference/core.mdx`.
  - Root README + docs intro updated to surface integrations + the reordered navigation.

- a6d6f97: Docs: raise contrast on light-theme Prism syntax highlighting for `.token.function`, `.keyword`, `.deleted`, `.builtin`, and `.attr-name` from `#d73a49` (4.29:1 against `#f6f8fa` — below WCAG AA) to `#b31d28` (~6.4:1). Axe-reported in bash code blocks like `npm install …`.
- 851d791: fix(tokens): resolve dark-mode accent contrast failure + push High-contrast to AAA across the board

  Two related contrast fixes on the Storybook reference fixture, surfaced by the new `get_color_contrast` MCP tool against `color.accent.bg` / `color.surface.default` pairs:

  - **Dark · Default · Normal** — `color.accent.bg` inherited `blue.700` from base, collided with the dark neutral.900 surface at a **2.66:1** ratio (below even the 3:1 non-text threshold). `dark.json` now overrides `accent.bg` to `blue.500` and `accent.bg-hover` to `blue.300` for a lift-on-hover dark-mode button. Lands at **4.85:1** — clear 3:1 non-text and AA for large text.
  - **Dark · Default · High** and **Light · Default · High** — brought to AAA across the board via alias indirection. Each mode file now declares a `color.accessible.accent.*` namespace (Light: deep blue.900 button + white text; Dark: inverted blue.100 button + neutral.900 dark text), and `contrast-high.json` aliases `color.accent.bg / bg-hover / fg` to that namespace. `contrast-high.json` stays mode-agnostic; each mode owns its own AAA values. Resolved ratios: **10.36:1** (Light + HC) and **14.63:1** (Dark + HC) — AAA for both accent-bg-vs-surface and accent-fg-vs-accent-bg.

  Same alias-indirection pattern already used in the docs-site's a11y overlay (`color.accessible.primary.*` → a11y = High-contrast). Applied here to the Storybook reference fixture's accent scale.

- Updated dependencies [018f518]
- Updated dependencies [f03161f]
- Updated dependencies [74e755c]
  - @unpunnyfuns/swatchbook-core@0.13.0

## 0.12.0

### Patch Changes

- 1cc3eee: fix(a11y): underline body-content links so colour isn't the sole distinguisher

  Axe flagged two related WCAG violations: **1.4.1 (Use of Color)** — links in body text weren't distinguishable without colour — and **1.4.11 (Non-text Contrast)** — the a11y=High-contrast amber primary (#fcd34d) only reached 1.31:1 against surrounding Dark-mode text (#f1f5f9), below the 3:1 non-text contrast minimum.

  Underlining body links addresses both: colour is no longer the sole distinguisher, and 1.4.11's ratio requirement only applies when colour is carrying the signal on its own.

  Rule scoped to `.markdown a` — Docusaurus's rendered-MDX container — so navbar, sidebar, footer, and button-style links are untouched. Those carry affordances via position and chrome instead of inline prose context.

## 0.11.6

### Patch Changes

- 4fd054c: docs: strip remaining pitch residue from the intro's "What the addon includes" section

  Follow-up to the prose conversion. A second read found eight smaller tells still reading as marketing framing: section heading ("gives you" → "includes"), action verbs ("brings in" → "includes"), tour-guide framing ("Most authoring happens in MDX"), a mid-prose `<ColorPalette filter="color.**" />` example that acted as a sales moment, an emphasised "A single Swatchbook icon" ("single" → dropped), a redundant gloss after the color-format selector's own name, and a three-parallel-clauses "nothing is written / no prebuild / HMR propagates" stack that worked as a strawman — consolidated to one descriptive clause. Section now reads as a reference entry.

- 3cff041: docs: rewrite the intro's "What the addon gives you" section as prose under subheadings

  Replaces the five **bold** — em-dash — sentence bullets with short subheaded paragraphs (Installation, No external compile step, Doc blocks, Toolbar, `useToken` hook). Also strips the editorial scaffolding — phrases like "Day-to-day authoring", "ready-made starting point", "without per-page wiring", "so typos surface at compile time rather than runtime" — that read as sales framing rather than description. The subsections now state what each feature is and where to read more, without pitching.

- 77c5f23: docs: prose sweep + adopt two orphaned concept pages into the sidebar

  **Prose sweep.** An audit across every live `.mdx` and each package README surfaced six clear pitch-language tells. Fixed five (kept two borderline "why axes, not themes" link-title italics as-is since they're page titles, not strawman setups):

  - Root README and intro both had "Drop them into MDX pages and your token reference writes itself" — replaced with descriptive version naming the per-type previews explicitly.
  - Addon reference: "those hooks just work wherever the addon is registered" → "the hooks resolve wherever the addon is registered".
  - Authoring guide: "the blocks just work inside MDX" → "the blocks render inside MDX".
  - Quickstart: "Takes ~5 minutes if you already have a Storybook project." → "Assumes an existing Storybook 10 project with the Vite builder. Install, register, author the first doc page."

  **Orphan adoption.** `concepts/axes-vs-themes` and `concepts/theme-reactivity` existed as pages and were linked from the intro, but weren't listed in the home sidebar's Concepts category. Clicking those links landed on pages with no sidebar highlighting or breadcrumb context. Added both to the Concepts category; `axes-vs-themes` goes first (foundational "why"), `theme-reactivity` goes between diagnostics and token-pipeline (implementation-facing after the concept tour).

## 0.11.5

### Patch Changes

- fbcbf6c: docs(tokens): match the switcher's axis order to the resolution order

  `resolutionOrder` controls which overlay wins when two touch the same token; the `modifiers` object's key order controls how the switcher UI enumerates the axes. The previous PR swapped resolutionOrder to `mode → typeface → a11y` but left modifiers in the old `mode → a11y → typeface` shape, so the switcher still rendered a11y before typeface.

  Swapping modifiers to match. Switcher now shows **mode → typeface → a11y**, which matches the conceptual flow: pick your base font, then opt in to the accessibility overlay on top.

## 0.11.4

### Patch Changes

- 58853c3: docs(tokens): a11y=High-contrast escalates base font through each typeface's accessibility slot

  Partial re-introduction of typography into a11y=High-contrast — but typeface-aware this time, so the axes stay conceptually separate in their overlay files while composing into different outcomes per tuple.

  Shape:

  - Every typeface context declares `font.family.base-accessible` alongside `font.family.base`. Mode-level Variable default: `base = system`, `base-accessible = comic`. Monotype overlay: `base = mono`, `base-accessible = comic-mono`.
  - `high-contrast.json` aliases `font.family.base = {font.family.base-accessible}` — doesn't mention any typeface name; resolves through whichever typeface slot is active.
  - `resolutionOrder` flipped to `[tokens, mode, typeface, a11y]` so a11y gets the last word after typeface has declared its accessibility slot.

  Outcomes per tuple:

  - typeface=Variable + a11y=Normal → system
  - typeface=Variable + a11y=High-contrast → Comic Sans (variable-width comic signal)
  - typeface=Monotype + a11y=Normal → monospace
  - typeface=Monotype + a11y=High-contrast → Comic Mono (comic-monospace signal)

  Same alias-indirection pattern as `color.accessible.primary.*` — just applied to font-family now.

## 0.11.3

### Patch Changes

- c50f0ab: docs(tokens): separate a11y from typeface in the docs-site fixture

  `high-contrast.json` used to also swap the base font family to `{font.family.comic}` — a leftover from when a11y carried a typography signal on top of its contrast role. Now that the `typeface` axis owns font-family independently (Variable vs Monotype), having a11y also touch it meant `typeface=Variable + a11y=High-contrast` reshuffled the font regardless of the reader's typeface pick.

  Drops the `font.family` block from the a11y overlay. a11y now owns **contrast only** — amber primary ramp via alias indirection, neutral shifts for muted text, plus the 108% base-size bump kept as a readability signal. Font family is entirely the typeface axis's domain: Variable ⇒ system, Monotype ⇒ comic-mono, regardless of a11y.

- c50f0ab: docs(tokens): rename `brand` axis to `typeface`, swap a11y primary to amber, route Monotype through a comic-monospace stack

  Three coordinated edits on the docs-site fixture that bring the axes' names in line with what they actually do and sharpen the accessibility signal:

  - **Axis rename.** `brand` was never a brand axis — it chose between a variable-width and a monospaced typeface. Renamed to `typeface` with contexts `Variable` / `Monotype`; the data-attribute selector becomes `[data-sb-typeface="…"]`. The storybook reference fixture's `brand` axis (an actual brand variation) is unchanged.
  - **A11y primary → amber.** `color.accessible.primary.*` in both mode files now aliases to a new `color.palette.amber.*` ramp instead of `color.palette.brand.*`. a11y=High-contrast gets yellow/burnt-orange links that read as high-visibility accessibility signal rather than brand voice — burnt-orange (amber.800) on white for Light + High-contrast, bright yellow (amber.300) on dark for Dark + High-contrast, both well above AAA contrast.
  - **Monotype = comic-monospace.** New `font.family.comic-mono` fontFamily stack that prefers playful free monospaces (Comic Mono, Fantasque Sans Mono, Comic Shanns Mono) then falls through to Comic Sans MS and the system monospace. The Monotype overlay uses this stack, so toggling typeface=Monotype now reads as slightly-unhinged teletype rather than plain code font.

  No bundled font files — readers with Comic Mono / Fantasque Sans Mono installed locally get the playful face, everyone else gets Comic Sans MS or the system monospace fallback.

## 0.11.2

### Patch Changes

- ad92a1a: docs: soften the intro's "What it's not" paragraph

  Dropped the "— that's a documentation affordance, not a production theming API." aside, which restated the scope twice and read as pushing readers away. Tweaked the production-theming redirect to frame `emitCss` as the same-shape output available to consumer apps, rather than a consolation path.

- b1102c8: docs(tokens): rename `brand` axis to `typeface`, swap a11y primary to amber, route Monotype through a comic-monospace stack

  Three coordinated edits on the docs-site fixture that bring the axes' names in line with what they actually do and sharpen the accessibility signal:

  - **Axis rename.** `brand` was never a brand axis — it chose between a variable-width and a monospaced typeface. Renamed to `typeface` with contexts `Variable` / `Monotype`; the data-attribute selector becomes `[data-sb-typeface="…"]`. The storybook reference fixture's `brand` axis (an actual brand variation) is unchanged.
  - **A11y primary → amber.** `color.accessible.primary.*` in both mode files now aliases to a new `color.palette.amber.*` ramp instead of `color.palette.brand.*`. a11y=High-contrast gets yellow/burnt-orange links that read as high-visibility accessibility signal rather than brand voice — burnt-orange (amber.800) on white for Light + High-contrast, bright yellow (amber.300) on dark for Dark + High-contrast, both well above AAA contrast.
  - **Monotype = comic-monospace.** New `font.family.comic-mono` fontFamily stack that prefers playful free monospaces (Comic Mono, Fantasque Sans Mono, Comic Shanns Mono) then falls through to Comic Sans MS and the system monospace. The Monotype overlay uses this stack, so toggling typeface=Monotype now reads as slightly-unhinged teletype rather than plain code font.

  No bundled font files — readers with Comic Mono / Fantasque Sans Mono installed locally get the playful face, everyone else gets Comic Sans MS or the system monospace fallback.

## 0.11.1

### Patch Changes

- b0ce33e: docs: surface the full package set across indexes

  Several places still listed the pre-v0.10 three-package story (core / addon / blocks) and omitted switcher + mcp:

  - Root `README.md` — added the `mcp` row to the package table.
  - `CONTRIBUTING.md` — expanded the "everything user-facing lives under…" list and the changeset rule to cover all five published packages.
  - `packages/switcher/README.md` — created from scratch; the package shipped without one. Covers install, usage, exported surface, and where it's consumed inside the repo.
  - `apps/docs/docs/intro.mdx` — added a short "For AI agents" section pointing at the MCP server, plus updated "How to read these docs" to include `mcp` in the Reference list and added the new Developers section.

- a294673: docs: restore `swatchbook-*` in each package README's title header

  Every package README was headed with a one-word title (`# Addon`, `# Blocks`, `# Core`, `# MCP`). On npm's package page that renders as a standalone word stripped of context — a reader who lands on the tarball's own page via a search, deep link, or alert sees "# Addon" and has to hunt for what it's an addon _of_. Restored the `swatchbook-*` prefix so each README's title matches its published package name and re-establishes context on first scroll.

## 0.11.0

### Patch Changes

- 4d6a946: docs(tokens): give the docs-site's high-contrast axis real contrast boost

  The a11y axis on the docs-site tokens used to only swap the base font to a comic display face and bump font size by 8%. Colors stayed identical — which undersold the accessibility signal and didn't meaningfully improve the site's contrast on either Light or Dark.

  Adds mode-aware contrast-boosted values via alias indirection: each mode file (`themes/light.json`, `themes/dark.json`) now carries a parallel `color.accessible.*` namespace with darker-on-light / brighter-on-dark variants of `text.muted` and the full primary ramp. `themes/high-contrast.json` aliases role tokens to that namespace, so the a11y overlay stays mode-agnostic at the file level while the resolved values remain mode-aware.

  Visible outcomes on a11y=High-contrast:

  - Light: `primary.default` from `brand.600` (contrast ~4.8:1 on white) to `brand.800` (~9.5:1); `text.muted` from `neutral.500` (~4.5:1) to `neutral.700` (~10:1).
  - Dark: `primary.default` from `brand.500` to `brand.300`; `text.muted` from `neutral.300` to `neutral.100`.

  No change to Normal-contrast Light or Dark — this is purely the a11y overlay gaining colour where before it only carried typography.

- 50e5d3a: docs: explain the no-external-compile-step property

  New "The token pipeline" concept page under Concepts, covering how tokens reach the blocks through the addon's Vite virtual module rather than a separate prebuild step. Includes how HMR works against the virtual module, why the module doesn't extend to production consumer apps (and what to use instead — `emitCss` from core), and the Terrazzo parser credit. Linked from a new bullet in the intro.

- 60a9c76: fix(docs): route latest release at `/` and main-branch at `/next/`

  The docusaurus site's versioning config had drifted — `lastVersion: 'current'` pinned the main-branch docs to `/`, which caused Docusaurus to flag the released 0.10 snapshot as "out of date" even though 0.10 is the currently-shipping version. Visitors landing on `/` were reading unreleased content by default.

  Now matches the intent described in CLAUDE.md: `/` serves the latest released snapshot (implicit `lastVersion` from the first entry in `versions.json`); main-branch docs move to `/next/` with an "unreleased documentation" banner. Visitors shipping against `@unpunnyfuns/swatchbook-*@0.10.2` land on docs that match their installed code.

  No content changes — this is a routing-config fix.

## 0.10.2

### Patch Changes

- 9aaad81: docs: add a "For developers" section to the docs site

  New top-level navbar entry alongside Blocks / Guides / Reference, with three pages aimed at people who want to work on swatchbook's code rather than consume it:

  - **For developers** — landing page, the repo map, pointers to typical work shapes.
  - **Architecture** — the one data structure everything revolves around (`Project`), plus the static build path and the dev/HMR path from token file to rendered block. Includes how the MCP server plugs in.
  - **Sharp corners** — the "someone will bleed on this" list: Storybook manager-bundle JSX trap, atomic-save watcher pattern, React rules-of-hooks regressions, etc.

  CONTRIBUTING.md on GitHub stays as the dev-setup source of truth; the docs-site section covers the how-does-it-work reference new contributors need for a mental model.

## 0.10.1

### Patch Changes

- 548b041: chore(blocks): drop misleading "storybook-addon" npm keyword

  `@unpunnyfuns/swatchbook-blocks` ships MDX doc blocks; the Storybook addon surface lives in the sibling `@unpunnyfuns/swatchbook-addon` package. Keeping the `storybook-addon` keyword here surfaced blocks in npm searches people really wanted the addon for.

- 9722153: docs(blocks): move hooks into a dedicated reference page; correct stale "not re-exported from addon" claims

  The addon has re-exported the full blocks surface (hooks, provider, contexts) since the one-stop-install work landed, so `import { useSwatchbookData } from '@unpunnyfuns/swatchbook-addon'` works the same as importing from blocks. The intro page and do/don't list still asserted the opposite; updated both. Hooks now have their own reference page under Blocks → Hooks.

- c1e6b98: fix(blocks): TokenNavigator hooks run before empty-state early return

  Typing a `root` or `type` arg that matches zero tokens used to cross a
  hook-order boundary — the `matchCount` `useMemo` sat after the
  `tree.length === 0` early return, so the first non-empty render threw
  "Rendered fewer hooks than expected". Hoisted the memo above the
  guard. Added a `NoMatches` story as a regression check.

## 0.10.0

## 0.9.0

## 0.8.0

### Minor Changes

- cd64451: feat: partial HMR for token edits — no more full preview reload

  Saving a token file in dev mode now re-renders the preview in place
  instead of blowing away the iframe. Toolbar state, story args, scroll
  position, and any open overlays survive the refresh.

  Under the hood:

  - The addon's Vite plugin now sends a custom HMR event
    (`swatchbook/tokens-updated`) carrying the fresh virtual-module
    payload when source files change, instead of firing a `full-reload`.
  - The preview subscribes via `import.meta.hot.on`, re-injects the
    generated stylesheet, and forwards the payload on Storybook's
    channel as `TOKENS_UPDATED_EVENT`.
  - A new `useTokenSnapshot()` hook in blocks mirrors the
    `channel-globals` pattern — subscribes to the channel via
    `useSyncExternalStore` and exposes a live snapshot that `useProject`
    reads from. Token edits propagate through React's normal
    re-render path; no block-specific wiring per consumer required.
  - Outside Storybook (the docs-site path, unit tests, production
    builds) the channel never fires and consumers keep seeing the
    initial values baked into the virtual module at build time — same
    behavior as before.

## 0.7.0

## 0.6.2

### Patch Changes

- 1971275: fix(blocks): honor the color-format selector in Shadow/Border/Gradient previews

  `<ShadowPreview>`, `<BorderPreview>`, and `<GradientPalette>` each shipped
  a local `formatColor` helper that ignored the toolbar's color-format
  selector — their sub-value text stayed in `colorSpace(components…)` or
  `rgb(%)` regardless of what the user picked. Now they route through the
  shared `formatColor` from `@unpunnyfuns/swatchbook-blocks`, subscribing
  to `useColorFormat()` the same way `<ColorPalette>` and
  `<CompositeBreakdown>` do.

  Flipping the toolbar between hex / rgb / hsl / oklch / raw now updates
  the breakdown labels in all three blocks.

- 97a32bb: fix(blocks): surface sub-value alias chains in `<CompositeBreakdown>`

  When a composite token (`border`, `shadow`, `transition`, `typography`,
  `gradient`) references another token by alias on one of its sub-values,
  the `<TokenDetail>` drawer now shows the full alias chain next to that
  row — the same way top-level token aliases are surfaced by
  `<AliasChain>`. Previously a border whose `color` aliased another color
  token rendered only the resolved hex, with no indication that the value
  had been authored as an alias.

  Chains walk transitively via Terrazzo's `partialAliasOf` + the target
  token's own `aliasChain`, so authors see the full `borderColorAlias →
colorRole → colorPrimitive` path.

- 1b5989c: fix(blocks): align detail-overlay close button with panel padding

  The slide-over close button was pinned at `top: 8px; right: 8px` — half
  the 16px panel padding — so it sat tucked against the corner instead of
  aligning with the content. Bumped both to `16px` so the button sits
  inside the visual inset, flush with the heading.

## 0.6.1

## 0.6.0

### Minor Changes

- 4aeb6ab: feat(blocks): runtime search on `<TokenTable>` and `<TokenNavigator>`

  Both blocks now render a search input at the top (default on) that narrows the visible tokens by case-insensitive substring. `<TokenTable>` filters rows by path, type, or value; `<TokenNavigator>` prunes the tree to matching leaves and auto-expands every group on the way to a match so hits are visible without clicking. Adds a `searchable?: boolean` prop to both; pass `false` to hide the input when you want authoring-time filtering (`filter` / `type` / `root`) only.

  Restores the runtime search UX the retired Design Tokens panel used to have, which the docs and Dashboard page have been (misleadingly) claiming ever since.

- 5ac3528: feat(blocks): `type` prop on `<TokenNavigator>`

  Scope the tree by DTCG `$type`. Pass a single string (`type="color"`) to restrict to one type, or an array (`type={['duration', 'cubicBezier', 'transition']}`) for a small-multiples view. Composes with `root` — both constraints must hold. Matches the `type` prop already available on `<TokenTable>`.

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

- d5f2a03: Move `format-color.ts` out of `src/internal/` to `src/format-color.ts`. It's part of the public API (documented on the docs site, paired with `useColorFormat()`), so living in `internal/` was confusing to anyone reading the source. No consumer-visible API change — the `formatColor` / `COLOR_FORMATS` / `ColorFormat` / `FormatColorResult` / `NormalizedColor` exports from `@unpunnyfuns/swatchbook-blocks` are unchanged.
- 89d48a1: Declare `"sideEffects": false` on all three published packages. No CSS imports, no module-level work that isn't gated behind used-export reachability. Gives consumer bundlers permission to tree-shake unused exports more aggressively.

## 0.1.4

### Patch Changes

- be1ee1f: Tidy npm keywords: drop `storybook-addon` from `@unpunnyfuns/swatchbook-blocks` (it's a companion doc-block library, not an addon), and add broader discovery terms `design` and `style` to `@unpunnyfuns/swatchbook-addon`.

## 0.1.3

### Patch Changes

- 34e6255: Fix the toolbar's color-format switcher (hex / rgb / hsl / oklch / raw) having no effect on blocks rendered in MDX docs pages. `useColorFormat()` was context-only, and the addon's preview decorator — which populates the context — doesn't run on bare MDX pages. Subscribe to `globalsUpdated` / `updateGlobals` / `setGlobals` as a fallback when no provider is mounted, mirroring `useProject()`'s existing pattern.
- 04c9c2f: Fix MDX-rendered blocks flickering back to default values one frame after an axis or color-format change. Storybook force-rerenders the docs container on every `updateGlobals`, which remounts the MDX-embedded blocks and reset their local `useState` trackers. Lift the channel-derived globals (axes / theme / color format) to a module-level store consumed via `useSyncExternalStore` so the values survive remounts, and drop the `setGlobals` listener that could overwrite a just-toggled value with the pre-toggle snapshot in edge orderings.
- 5dd94fe: Fix MDX blocks rendering defaults for one frame when the toolbar's URL-persisted selection is non-default. Storybook stores toolbar state in `?globals=…`, so deeplinking or reloading with e.g. `swatchbookColorFormat:rgb` already has `rgb` in the preview's `userGlobals`, but `SET_GLOBALS` — the event that carries it on init — fired before our listener subscribed. Subscribe at module load and re-add the `setGlobals` handler so first render matches the persisted selection.

## 0.1.2

### Patch Changes

- e298dc3: Fix axis switching on MDX docs pages. The addon's preview decorator wrote `data-<axis>` attributes to `<html>` from inside the story wrapper — so bare MDX pages (no `<Story />`) had no ancestor carrying the tuple, the per-tuple CSS selectors never matched, and colors stayed on `:root` defaults no matter what the toolbar did. Subscribe to the channel at module level and write the same attrs independent of any decorator run, and pick up `setGlobals` in the blocks' fallback so the "Active tuple" indicator reflects the current selection on first render.

## 0.1.1

## 0.1.0

### Minor Changes

- 943fda9: Add a color-format switcher across `TokenTable`, `TokenDetail`, and `ColorPalette`. A new `swatchbookColorFormat` global (default `hex`) and a matching toolbar dropdown route every color value through `formatColor()` — `hex`, `rgb`, `hsl`, `oklch`, or `raw` JSON. Out-of-gamut or wide-gamut colors fall back to `rgb()` for the `hex` format and are marked with a ⚠ indicator. Display only — emitted CSS is unaffected.
- 3741dc7: `ColorPalette`'s `groupBy` prop is now optional. When omitted, grouping is derived from the filter: one level below the filter's fixed prefix, clamped so every swatch keeps a leaf label. `<ColorPalette filter='color.sys.*' />` groups at `color.sys.<family>` automatically; `<ColorPalette filter='color.ref.blue.*' />` collapses the whole ramp into one group with each shade as a leaf. Pass `groupBy` explicitly when you want something the heuristic wouldn't pick.
- c593297: `TokenDetail` grows two new visuals.

  - **Color swatch** — opening a `color` token now shows a two-surface swatch (the token on a light and dark backdrop) in the composite preview area, alongside the existing inline swatch next to the resolved value line. Lets viewers gut-check contrast without leaving the detail pane.
  - **Composite sub-value breakdown** — `typography`, `shadow`, `border`, `transition`, and `gradient` tokens now render a labelled field list underneath the composite preview. Shadow breakdowns group multi-layer tokens with a "Layer N" header; gradient breakdowns list each stop by position percentage.

- 7a631dc: Add `<ConsumerOutput>` subcomponent to `<TokenDetail>` — two copyable rows surfacing the token dot-path and its CSS variable reference (e.g. `var(--sb-color-sys-accent-bg)`). An "Active tuple: …" indicator shows which axis context the rendered values reflect.
- dfb5ec6: Add `DimensionScale` block: renders dimension tokens (`space.*`, `radius.*`, `size.*`, or any `$type: 'dimension'`) as visible bars sized to the token's actual value. Three visualization kinds — `'length'` (horizontal bar, default), `'radius'` (sample square with the token applied as `border-radius`), `'size'` (square box sized to the token). Bars wider than 480px are capped with a visible marker so extreme tokens don't break the layout. Sorted ascending by computed pixel value; ties broken by path.
- 0cb84fd: Drop the explicit-layers theming input. The DTCG 2025.10 resolver is now the sole theming input — `Config.themes`, the `ThemeConfig` type, and `resolveThemingMode` are all gone. Consumers with a layered config must move to a `resolver.json`.

  Theme names come from the resolver's modifier contexts: single-axis resolvers use the modifier value directly (context `Light` → theme name `Light`), multi-axis resolvers keep Terrazzo's JSON-encoded permutation ID. Pick sensible modifier context names in your resolver; what you write is what consumers see.

  The `themingMode` field on the virtual module is also removed — there's only one mode to be in.

- 6c7bfe5: Drop Tokens Studio `$themes` manifest support. The DTCG 2025.10 resolver is now the spec-native theming input; consumers using a manifest should convert to a `resolver.json` (the transformation is mechanical). `Config.manifest` is removed, `resolveThemingMode` returns `'layered' | 'resolver'`, and `themingMode` on the virtual module narrows accordingly. `@unpunnyfuns/swatchbook-tokens-reference` no longer exports `manifestPath`.
- bdcc784: Extract per-token sample primitives from `MotionPreview`, `ShadowPreview`, `BorderPreview`, and `DimensionScale`. Each preview block's single-token renderer is now exported standalone so MDX authors can embed just one sample: `MotionSample`, `ShadowSample`, `BorderSample`, and `DimensionBar` — each takes a `path: string` prop (and `DimensionBar` also accepts `kind`, `MotionSample` accepts `speed` / `runKey`). The parent blocks are unchanged in DOM output and props; they're now thin iterators that filter, sort, and map over the extracted sample.
- 9b5ecdc: Two new blocks surface standalone font primitives that were previously visible only inside `typography` composites:

  - `FontFamilySample` renders one row per `fontFamily` token with sample text in that family, plus the full font stack as metadata.
  - `FontWeightScale` renders one row per `fontWeight` token with sample text at that weight, sorted ascending by numeric weight so the scale is visually legible.

  `TokenDetail`'s `CompositePreview` gains matching branches so opening a `font.ref.family.sans` or `font.ref.weight.bold` token in isolation _looks like_ the font / weight rather than falling back to a JSON blob or bare integer.

- e091420: Add `<GradientPalette filter? />` block for DTCG `gradient` tokens, and a `gradient` branch on `TokenDetail`'s composite preview. Samples default to `linear-gradient(to right, …)` since DTCG gradients are stop arrays and the gradient function is a rendering choice consumers make at use-site — if you need radial / conic previews, reach for a custom block.

  This closes the last spec-level `$type` gap the reference fixture was missing; Terrazzo-extension types (`boolean`, `string`, `link`) remain intentionally out of scope per `docs/type-coverage.md`.

- 48bf3e5: **Breaking.** `SwatchbookProvider`, `SwatchbookContext`, `ThemeContext`, `AxesContext`, `useSwatchbookData`, `useOptionalSwatchbookData`, `useActiveTheme`, `useActiveAxes`, and the `Virtual*Shape` / `ProjectSnapshot` types now live exclusively in `@unpunnyfuns/swatchbook-blocks`. They are no longer exported from `@unpunnyfuns/swatchbook-addon` — import them from `@unpunnyfuns/swatchbook-blocks` directly. Workspace dep graph runs addon → blocks, which is the direction it was always meant to. Closes issue #202.
- 78ef794: Add `MotionPreview` block. Renders motion tokens — `transition` composites, standalone `duration`, standalone `cubicBezier` — as a looping ball animation so timing and easing are legible in motion. Per-row spec strip shows duration + easing; a global speed control (0.25× / 0.5× / 1× / 2×) lets consumers slow fast transitions to inspect the curve. Respects `prefers-reduced-motion: reduce` — the animation is replaced by an inline "Animation suppressed" notice and the replay button disables.
- c1a8c71: Expose modifier axes as first-class on `Project`. `Project.axes: Axis[]` surfaces each DTCG resolver modifier with its `contexts`, `default`, `description`, and `source` (`'resolver' | 'synthetic'`); projects loaded without a resolver get a single synthetic `theme` axis. A new `permutationID(input)` utility centralizes the tuple-to-string logic previously inlined in the resolver loader — single-axis tuples stringify to the context value; multi-axis tuples join with `·`. The virtual `virtual:swatchbook/tokens` module now also exports `axes`, so toolbar and panel work in follow-up PRs can key on tuples rather than flat theme names.
- 4737535: Add `ShadowPreview` and `BorderPreview` blocks. Each renders its composite tokens by applying them to a sample element, so the visual effect is legible — not just the sub-value string. Sub-values (offset, blur, spread, color for shadows; width, style, color for borders) appear next to the sample as a breakdown. `ShadowPreview` handles layered shadows (DTCG shadow values can be arrays) with a per-layer breakdown.
- 1434e4e: Split `TokenDetail` into composable subcomponents. Each section — `TokenHeader`, `CompositePreview`, `CompositeBreakdown`, `AliasChain`, `AliasedBy`, `AxisVariance`, `TokenUsageSnippet` — is now exported as a standalone block so MDX authors can embed just the piece they need (each takes the same `path: string` prop). `TokenDetail` itself is unchanged in DOM output and props; it's now a thin composition of these pieces.
- 28b2473: New `StrokeStyleSample` block renders DTCG `strokeStyle` tokens — string-form values (`solid`, `dashed`, `dotted`, `double`, `groove`, `ridge`, `outset`, `inset`) display as a visible horizontal line at the computed `border-top-style`; object-form values (`{ dashArray, lineCap }`) render a textual fallback because CSS `border-style` has no matching primitive. Companion additions to the reference fixture exercise both forms plus a `number` group (opacities + line-height multipliers) so the full DTCG primitive surface is now covered.
- 92d5ae6: Introduce `SwatchbookProvider` + `useSwatchbookData` + `ProjectSnapshot` for framework-free block rendering. Blocks no longer depend on the addon's `virtual:swatchbook/tokens` module when a provider is in the tree, which means they render in plain React apps, unit tests, and non-Storybook doc sites — just hand the provider a `ProjectSnapshot`. The addon's preview decorator now mounts the provider around every story automatically, so Storybook-side authors see no change. The virtual-module fallback stays in place during the transition.
- 4a986d8: `TokenDetail` now renders an "Aliased by" tree mirroring the existing "Alias chain". For any token, it walks Terrazzo's `aliasedBy` field backward — direct consumers, their consumers, and so on — so a viewer can trace from a primitive (e.g. `color.ref.neutral.0`) to every sys and cmp token that ultimately depends on it. Each level is sorted ref → sys → cmp → other, then alphabetical. Depth is capped at 6 hops with a visible "truncated" note when hit. Only renders when the focal token has at least one direct consumer; otherwise the section is hidden.

  No new analysis — Terrazzo already produces `aliasedBy` during resolve. The section just surfaces it.

- 2f5bb68: `TokenDetail` now renders live previews for composite token types in its Resolved-value section. Typography tokens get a pangram sample styled via the emitted sub-vars (font-family / font-size / font-weight / line-height / letter-spacing); shadow and border tokens get a sample card with the effect applied; transition tokens get an animated ball using the composite's duration + easing. Color tokens keep their swatch. The preview sits above the formatted value text — one read gives you "what it looks like" and "what its sub-values are" together.

  Reduced-motion compliance: transition previews swap to an inline "Animation suppressed" notice when `prefers-reduced-motion: reduce` is set. `usePrefersReducedMotion` lifted to `internal/prefers-reduced-motion.ts` so it's shared with `MotionPreview`.

- 0ec7ff3: `TokenDetail` now renders visual previews for `dimension`, `duration`, and `cubicBezier` primitives — closing the consistency gap where these types had dedicated blocks (`DimensionScale`, `MotionPreview`) but fell back to raw text when opened individually. Dimension tokens show a bar sized to the token value; duration tokens animate a ball at that duration with neutral easing; cubicBezier tokens animate a ball at a fixed duration applying the easing curve. Both animated variants honor `prefers-reduced-motion: reduce` via the existing suppressed-notice path.
- 881038e: Add `TokenNavigator` block: expandable tree view of the token graph keyed on dot-path segments. Complements the flat `TokenTable` and the typed `ColorPalette` with an explorable hierarchy. Interior groups show child counts; leaves show a `$type` pill plus an inline preview (reuses `DimensionBar` / `ShadowSample` / `BorderSample` / `MotionSample` / `formatColor` for per-type visuals). Props: `root?` to mount at a subtree, `initiallyExpanded?` for default open-depth (default `1`), and `onSelect?(path)` for custom click handling — when omitted, clicking a leaf opens an inline slide-over with `<TokenDetail>` and a close button. Keyboard: Enter/Space toggles groups and activates leaves.
- b29dd7c: Tokens panel and `TokenDetail` block are now axis-tuple aware. The panel reads the active tuple from `globals.swatchbookAxes` (falling back to `swatchbookTheme` for back-compat) and shows a compact per-axis indicator above the token list. `TokenDetail` replaces its flat per-theme values table with an axis-aware view: tokens that are constant across every tuple collapse to one row; tokens that vary along a single axis render a compact 1-axis table (one row per context); tokens that vary along two or more axes render a matrix of the two most-varying axes, with further axes collapsed to the active selection. The `useProject()` hook now returns `activeAxes` + `axes` alongside `activeTheme` and subscribes to both `swatchbookAxes` and `swatchbookTheme` updates, keeping every block reactive to axis changes.

### Patch Changes

- 4ca9bb3: Align `storybook` peerDependency range on `@unpunnyfuns/swatchbook-addon` with `@unpunnyfuns/swatchbook-blocks` (`^10.3.5`). Consumers pinning Storybook to 10.3.0–10.3.4 previously satisfied the addon floor but failed the blocks floor.
- 954c26b: Extract the `wrapper` / `caption` / `empty` inline styles (plus the monospace stack and default border strings) shared across block components into `#/internal/styles.ts`. Pure refactor — no visible rendering change; each block's remaining `const styles = { ... }` now references the shared constants instead of re-declaring them.
- f5ccc4d: Sort token paths numerically so `color.ref.blue.50` comes before `color.ref.blue.100` instead of after. All block sorts now use `localeCompare(..., { numeric: true })`. Also corrected the `ColorPalette` `RefBlue` story's `groupBy` from `4` to `3` so every ramp shade groups under `color.ref.blue` instead of one swatch per row.
- 1986a0f: Add standard npm publish metadata — `license` (MIT), `repository`, `homepage`, `bugs`, `author`, `keywords` — to all three published packages. No runtime change; required for registry discoverability, npm provenance attestation, and legal clarity ahead of the v0.1.0 release.
