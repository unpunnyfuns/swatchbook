# @unpunnyfuns/swatchbook-core

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
