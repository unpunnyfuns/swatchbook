# @unpunnyfuns/swatchbook-blocks

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
