# @unpunnyfuns/swatchbook-addon

## 0.19.8

### Patch Changes

- a753766: Rework every package README to match the docs intro's register: human-register opening sentence, line breaks for pacing, detail-dense reference material (API tables, config fields, block catalogues, CLI flag tables, MCP tool tables) pushed out to the docs site where it belongs. Each README now answers "what is this and how do I install it" in ~50 lines instead of ~120, with clear links for readers who want more. Total README line count across all packages dropped from ~700 to ~370.
- Updated dependencies [a753766]
  - @unpunnyfuns/swatchbook-blocks@0.19.8
  - @unpunnyfuns/swatchbook-core@0.19.8
  - @unpunnyfuns/swatchbook-switcher@0.19.8

## 0.19.7

### Patch Changes

- Updated dependencies [74f57dc]
  - @unpunnyfuns/swatchbook-core@0.19.7
  - @unpunnyfuns/swatchbook-blocks@0.19.7
  - @unpunnyfuns/swatchbook-switcher@0.19.7

## 0.19.6

### Patch Changes

- Updated dependencies [d8937d3]
- Updated dependencies [d8937d3]
  - @unpunnyfuns/swatchbook-core@0.19.6
  - @unpunnyfuns/swatchbook-blocks@0.19.6
  - @unpunnyfuns/swatchbook-switcher@0.19.6

## 0.19.5

### Patch Changes

- Updated dependencies [380435c]
- Updated dependencies [380435c]
  - @unpunnyfuns/swatchbook-core@0.19.5
  - @unpunnyfuns/swatchbook-blocks@0.19.5
  - @unpunnyfuns/swatchbook-switcher@0.19.5

## 0.19.4

### Patch Changes

- Updated dependencies [6d76e77]
  - @unpunnyfuns/swatchbook-core@0.19.4
  - @unpunnyfuns/swatchbook-blocks@0.19.4
  - @unpunnyfuns/swatchbook-switcher@0.19.4

## 0.19.3

### Patch Changes

- Updated dependencies [0e1ec9e]
  - @unpunnyfuns/swatchbook-core@0.19.3
  - @unpunnyfuns/swatchbook-blocks@0.19.3
  - @unpunnyfuns/swatchbook-switcher@0.19.3

## 0.19.2

### Patch Changes

- Updated dependencies [b876729]
  - @unpunnyfuns/swatchbook-core@0.19.2
  - @unpunnyfuns/swatchbook-blocks@0.19.2
  - @unpunnyfuns/swatchbook-switcher@0.19.2

## 0.19.1

### Patch Changes

- Updated dependencies [3b1ff9e]
  - @unpunnyfuns/swatchbook-core@0.19.1
  - @unpunnyfuns/swatchbook-blocks@0.19.1
  - @unpunnyfuns/swatchbook-switcher@0.19.1

## 0.19.0

### Patch Changes

- Updated dependencies [ba41ead]
- Updated dependencies [785486c]
- Updated dependencies [9fde68e]
- Updated dependencies [91c9901]
- Updated dependencies [40f3a68]
- Updated dependencies [ca1e52a]
- Updated dependencies [52a5660]
- Updated dependencies [785486c]
  - @unpunnyfuns/swatchbook-core@0.19.0
  - @unpunnyfuns/swatchbook-blocks@0.19.0
  - @unpunnyfuns/swatchbook-switcher@0.19.0

## 0.18.0

### Minor Changes

- 44483af: Adopt `@terrazzo/plugin-token-listing` as the authoritative source for per-token metadata. `loadProject` now runs the plugin alongside Terrazzo's build for resolver-backed projects and attaches a path-indexed `listing` map to `Project`. Each entry carries the plugin-css-emitted CSS variable name (`names.css`), a CSS-ready `previewValue`, the original aliased value, and `source.loc` pointing back to the authoring file + line.

  Closes the drift risk Sidnioulz flagged: the block-display surface no longer reinvents naming or value-string generation where Terrazzo already has an opinion. `ColorTable` now reads its CSS var strings from the listing when available, falling back to the local Terrazzo-wrapping `makeCssVar` when a listing entry is missing (non-resolver projects, listing-plugin errors).

  The snapshot flowing through the addon's virtual module and HMR channel includes the listing slice under a new `listing` field — consumers building blocks against `ProjectSnapshot` get the same data.

  This is step 3 of the staged Terrazzo alignment. Step 1 (`makeCssVar` → Terrazzo) landed in the prior release; color value conversion and per-platform names (Swift/Android) are follow-ups that reuse the same listing pipeline.

### Patch Changes

- Updated dependencies [bc67608]
- Updated dependencies [9496c82]
- Updated dependencies [44483af]
- Updated dependencies [20909fa]
- Updated dependencies [dfe4d0b]
  - @unpunnyfuns/swatchbook-blocks@0.18.0
  - @unpunnyfuns/swatchbook-core@0.18.0
  - @unpunnyfuns/swatchbook-switcher@0.18.0

## 0.17.0

### Patch Changes

- Updated dependencies [ef944c5]
  - @unpunnyfuns/swatchbook-blocks@0.17.0
  - @unpunnyfuns/swatchbook-core@0.17.0
  - @unpunnyfuns/swatchbook-switcher@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [fba6841]
- Updated dependencies [c73585a]
  - @unpunnyfuns/swatchbook-blocks@0.16.0
  - @unpunnyfuns/swatchbook-core@0.16.0
  - @unpunnyfuns/swatchbook-switcher@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [e702b29]
  - @unpunnyfuns/swatchbook-core@0.15.0
  - @unpunnyfuns/swatchbook-blocks@0.15.0
  - @unpunnyfuns/swatchbook-switcher@0.15.0

## 0.14.1

### Patch Changes

- 3ff8741: Add unit tests for the integration-side-effects aggregate virtual module. Covers `resolveId` mapping, empty-integration bodies (no integrations + all opted-out), auto-inject filtering across a mixed list, and the fall-through path for unrelated IDs. Closes a hole where the aggregation logic added in 0.14 was only exercised end-to-end through Storybook builds.
- Updated dependencies [b5976cd]
  - @unpunnyfuns/swatchbook-core@0.14.1
  - @unpunnyfuns/swatchbook-blocks@0.14.1
  - @unpunnyfuns/swatchbook-switcher@0.14.1

## 0.14.0

### Minor Changes

- 171c9aa: Auto-inject CSS-side-effect integrations into the Storybook preview. `SwatchbookIntegration.virtualModule.autoInject: true` opts a global-stylesheet integration (Tailwind's `@theme` block, any rules-heavy CSS) into an addon-managed import — consumers no longer hand-write a second `import 'virtual:swatchbook/…';` line after plugging the integration in. The addon's preview side-effect-imports an aggregate virtual module (`virtual:swatchbook/integration-side-effects`) whose body is generated from each auto-inject integration's virtualId.

  `@unpunnyfuns/swatchbook-integrations/tailwind` now opts in. Consumers drop the explicit `import 'virtual:swatchbook/tailwind.css'` from their `.storybook/preview.tsx`. CSS-in-JS stays as an explicit named-import (users write `import { theme, color } from 'virtual:swatchbook/theme'` where needed).

### Patch Changes

- Updated dependencies [249e448]
- Updated dependencies [171c9aa]
  - @unpunnyfuns/swatchbook-blocks@0.14.0
  - @unpunnyfuns/swatchbook-core@0.14.0
  - @unpunnyfuns/swatchbook-switcher@0.14.0

## 0.13.1

### Patch Changes

- Updated dependencies [3ce116a]
  - @unpunnyfuns/swatchbook-blocks@0.13.1
  - @unpunnyfuns/swatchbook-core@0.13.1
  - @unpunnyfuns/swatchbook-switcher@0.13.1

## 0.13.0

### Minor Changes

- 19d9948: Display-side integration plugin system. The addon's Vite plugin now iterates a new `integrations: SwatchbookIntegration[]` option, serving each integration's virtual module and invalidating it on HMR. The addon itself stays tool-neutral — integrations ship as separate packages.

  First integration published as `@unpunnyfuns/swatchbook-integrations/tailwind`: a virtual module (`virtual:swatchbook/tailwind.css`) whose `@theme` block aliases Tailwind v4 utility scales to the project's DTCG tokens via `var(--<cssVarPrefix>-*)` references, nested under the same prefix so they never collide with Tailwind's shipped scales. Users import it from `.storybook/preview` and the switch-toolbar flips every Tailwind utility via cascade.

### Patch Changes

- e9ce3ed: Docs: add README for the `@unpunnyfuns/swatchbook-integrations` package — covers the two shipping subpaths (`/tailwind` and `/css-in-js`), install + wiring pattern, the `SwatchbookIntegration` contract for custom integrations, and explicit scope boundaries (display-side only, no production artifact writes, MUI-shape deferred).
- 8fe014a: Add `@unpunnyfuns/swatchbook-integrations/css-in-js` subpath. Contributes `virtual:swatchbook/theme` — a typed JS accessor whose leaves are `var(--<cssVarPrefix>-*)` references. Drop-in for styled-components / emotion / any ThemeProvider that passes its theme object through as-is; values stay stable across tuples and the swatchbook toolbar flips everything via CSS cascade.

  Covers the JSX-provider recipes in `@storybook/addon-themes` except MUI (which needs resolved-value emission — deferred until demand surfaces).

- Updated dependencies [018f518]
- Updated dependencies [ecc4e74]
- Updated dependencies [fea3791]
- Updated dependencies [34a71e7]
- Updated dependencies [4349d23]
- Updated dependencies [f2914ae]
- Updated dependencies [f03161f]
- Updated dependencies [a6d6f97]
- Updated dependencies [851d791]
- Updated dependencies [74e755c]
  - @unpunnyfuns/swatchbook-core@0.13.0
  - @unpunnyfuns/swatchbook-blocks@0.13.0
  - @unpunnyfuns/swatchbook-switcher@0.13.0

## 0.12.0

### Patch Changes

- Updated dependencies [1cc3eee]
  - @unpunnyfuns/swatchbook-blocks@0.12.0
  - @unpunnyfuns/swatchbook-core@0.12.0
  - @unpunnyfuns/swatchbook-switcher@0.12.0

## 0.11.6

### Patch Changes

- Updated dependencies [4fd054c]
- Updated dependencies [3cff041]
- Updated dependencies [77c5f23]
  - @unpunnyfuns/swatchbook-blocks@0.11.6
  - @unpunnyfuns/swatchbook-core@0.11.6
  - @unpunnyfuns/swatchbook-switcher@0.11.6

## 0.11.5

### Patch Changes

- Updated dependencies [fbcbf6c]
  - @unpunnyfuns/swatchbook-blocks@0.11.5
  - @unpunnyfuns/swatchbook-core@0.11.5
  - @unpunnyfuns/swatchbook-switcher@0.11.5

## 0.11.4

### Patch Changes

- Updated dependencies [58853c3]
  - @unpunnyfuns/swatchbook-blocks@0.11.4
  - @unpunnyfuns/swatchbook-core@0.11.4
  - @unpunnyfuns/swatchbook-switcher@0.11.4

## 0.11.3

### Patch Changes

- Updated dependencies [c50f0ab]
- Updated dependencies [c50f0ab]
  - @unpunnyfuns/swatchbook-blocks@0.11.3
  - @unpunnyfuns/swatchbook-core@0.11.3
  - @unpunnyfuns/swatchbook-switcher@0.11.3

## 0.11.2

### Patch Changes

- Updated dependencies [ad92a1a]
- Updated dependencies [b1102c8]
  - @unpunnyfuns/swatchbook-blocks@0.11.2
  - @unpunnyfuns/swatchbook-core@0.11.2
  - @unpunnyfuns/swatchbook-switcher@0.11.2

## 0.11.1

### Patch Changes

- 8de4d5d: docs(addon): drop the removed Design Tokens panel from the README

  The addon's README still described a "unified Design Tokens panel (hierarchical tree + diagnostics)" that got removed in v0.3.0. Also had a lingering "Go through `useToken` / the panel / the doc blocks" bullet in the do-don't list that pointed consumers at an API surface that no longer exists.

  Rewrote the intro paragraph to describe the current toolbar (axis dropdowns + preset pills + color-format picker) and call out the addon's re-export of the full blocks + switcher surface. Trimmed "the panel" from the do-don't rule.

- a294673: docs: restore `swatchbook-*` in each package README's title header

  Every package README was headed with a one-word title (`# Addon`, `# Blocks`, `# Core`, `# MCP`). On npm's package page that renders as a standalone word stripped of context — a reader who lands on the tarball's own page via a search, deep link, or alert sees "# Addon" and has to hunt for what it's an addon _of_. Restored the `swatchbook-*` prefix so each README's title matches its published package name and re-establishes context on first scroll.

- Updated dependencies [b0ce33e]
- Updated dependencies [a294673]
  - @unpunnyfuns/swatchbook-blocks@0.11.1
  - @unpunnyfuns/swatchbook-core@0.11.1
  - @unpunnyfuns/swatchbook-switcher@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [4d6a946]
- Updated dependencies [50e5d3a]
- Updated dependencies [60a9c76]
- Updated dependencies [da22d9e]
  - @unpunnyfuns/swatchbook-blocks@0.11.0
  - @unpunnyfuns/swatchbook-switcher@0.11.0
  - @unpunnyfuns/swatchbook-core@0.11.0

## 0.10.2

### Patch Changes

- Updated dependencies [9aaad81]
  - @unpunnyfuns/swatchbook-blocks@0.10.2
  - @unpunnyfuns/swatchbook-core@0.10.2
  - @unpunnyfuns/swatchbook-switcher@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies [548b041]
- Updated dependencies [9722153]
- Updated dependencies [c1e6b98]
  - @unpunnyfuns/swatchbook-blocks@0.10.1
  - @unpunnyfuns/swatchbook-core@0.10.1
  - @unpunnyfuns/swatchbook-switcher@0.10.1

## 0.10.0

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.10.0
- @unpunnyfuns/swatchbook-blocks@0.10.0
- @unpunnyfuns/swatchbook-switcher@0.10.0

## 0.9.0

### Minor Changes

- d528fe2: feat(addon): one-stop meta package — re-export blocks + switcher APIs

  The addon package now re-exports every public API from
  `@unpunnyfuns/swatchbook-blocks` and `@unpunnyfuns/swatchbook-switcher`.
  Consumers can install a single package (`pnpm add
@unpunnyfuns/swatchbook-addon`) and pull `TokenTable`, `ColorPalette`,
  `TokenDetail`, `ThemeSwitcher`, `useToken`, and the rest directly
  from it:

  ```tsx
  import { TokenTable, ThemeSwitcher } from "@unpunnyfuns/swatchbook-addon";
  ```

  The blocks / switcher / core packages remain independently installable
  for consumers who only need a slice (e.g. the docs site imports just
  the switcher). No runtime change — the re-exports are external in the
  bundle, so the addon's dist stays the same size and tree-shaking keeps
  unused pieces out of consumer bundles.

  Subpath entries (`./preset`, `./manager`, `./preview`, `./hooks`) are
  unchanged; the meta re-export is on the main `.` entry point only.

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.9.0
- @unpunnyfuns/swatchbook-blocks@0.9.0
- @unpunnyfuns/swatchbook-switcher@0.9.0

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

### Patch Changes

- cd64451: fix(addon): pick up token edits when tokens live in a sibling workspace package

  Two overlapping bugs in the virtual-module plugin's dev-server watcher
  conspired to drop every token edit on the floor when tokens lived
  outside the Storybook project's own directory:

  1. `configureServer` runs **before** `buildStart` in Vite's plugin
     lifecycle, so `project` (and therefore `project.sourceFiles`) was
     still undefined when we derived the watcher set. For configs that
     supply a `resolver` but no `tokens` glob — which the reference
     Storybook and most real-world consumers ship — every `$ref` target
     silently dropped; only the resolver file itself was watched. Force
     an initial `refresh()` at the top of `configureServer` so
     `sourceFiles` is populated before the watcher wiring runs.

  2. Even with `sourceFiles` populated, `server.watcher.add()` is rooted
     at the dev server's project directory; absolute paths added outside
     that root don't reliably emit change events across pnpm-symlinked
     package boundaries. Replace the Vite dir-level watch with a direct
     `node:fs.watch` on each source file — native, no root constraint,
     fires on every save.

  Saves to any token file pulled in by the resolver now invalidate the
  `virtual:swatchbook/tokens` module and trigger a single full-reload in
  the preview — no dev-server restart required.

- Updated dependencies [cd64451]
  - @unpunnyfuns/swatchbook-blocks@0.8.0
  - @unpunnyfuns/swatchbook-core@0.8.0
  - @unpunnyfuns/swatchbook-switcher@0.8.0

## 0.7.0

### Patch Changes

- cecfdff: feat(switcher): extract theme-switcher popover into a standalone package

  Introduce `@unpunnyfuns/swatchbook-switcher`, a framework-agnostic
  React component that renders the axis / preset / color-format popover
  swatchbook's Storybook toolbar used to own inline. Consumers pass in
  `axes`, `presets`, `activeTuple`, and change callbacks; the component
  owns the pill UI + keyboard-accessible menu. Compiled with classic JSX
  (`React.createElement`) so it embeds cleanly in Storybook's manager
  bundle (which does not expose `react/jsx-runtime`).

  The addon's `AxesToolbar` now composes `<ThemeSwitcher>` inside its
  existing `WithTooltipPure` popover — no user-visible change; the same
  icon button, shortcuts, and behavior stay in place.

  Ships the switcher in the fixed-version group alongside core / addon /
  blocks so the four release together.

- 0240cb4: fix(addon): pick up token edits when tokens live in a sibling workspace package

  Two overlapping bugs in the virtual-module plugin's dev-server watcher
  conspired to drop every token edit on the floor when tokens lived
  outside the Storybook project's own directory:

  1. `configureServer` runs **before** `buildStart` in Vite's plugin
     lifecycle, so `project` (and therefore `project.sourceFiles`) was
     still undefined when we derived the watcher set. For configs that
     supply a `resolver` but no `tokens` glob — which the reference
     Storybook and most real-world consumers ship — every `$ref` target
     silently dropped; only the resolver file itself was watched. Force
     an initial `refresh()` at the top of `configureServer` so
     `sourceFiles` is populated before the watcher wiring runs.

  2. Even with `sourceFiles` populated, `server.watcher.add()` is rooted
     at the dev server's project directory; absolute paths added outside
     that root don't reliably emit change events across pnpm-symlinked
     package boundaries. Replace the Vite dir-level watch with a direct
     `node:fs.watch` on each source file — native, no root constraint,
     fires on every save.

  Saves to any token file pulled in by the resolver now invalidate the
  `virtual:swatchbook/tokens` module and trigger a single full-reload in
  the preview — no dev-server restart required.

- Updated dependencies [a9d1a1c]
- Updated dependencies [94b1b3e]
- Updated dependencies [cecfdff]
- Updated dependencies [b947c99]
- Updated dependencies [e571197]
- Updated dependencies [887cb0a]
  - @unpunnyfuns/swatchbook-core@0.7.0
  - @unpunnyfuns/swatchbook-switcher@0.7.0
  - @unpunnyfuns/swatchbook-blocks@0.7.0

## 0.6.2

### Patch Changes

- Updated dependencies [97a32bb]
- Updated dependencies [1971275]
- Updated dependencies [97a32bb]
- Updated dependencies [97a32bb]
- Updated dependencies [1b5989c]
  - @unpunnyfuns/swatchbook-core@0.6.2
  - @unpunnyfuns/swatchbook-blocks@0.6.2

## 0.6.1

### Patch Changes

- Updated dependencies [6a142ee]
- Updated dependencies [e708940]
  - @unpunnyfuns/swatchbook-core@0.6.1
  - @unpunnyfuns/swatchbook-blocks@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [4aeb6ab]
- Updated dependencies [5ac3528]
  - @unpunnyfuns/swatchbook-blocks@0.6.0
  - @unpunnyfuns/swatchbook-core@0.6.0

## 0.5.0

### Minor Changes

- d565fcd: feat: flat token paths, per DTCG `$type`

  Token paths organize by DTCG `$type` at the root. Color primitives live under `color.palette.<hue>.*` (e.g. `color.palette.blue.500`); semantic color roles sit at `color.<role>.*` (`color.surface.default`, `color.text.default`, `color.accent.bg`). Other types follow the same flat pattern: `size.100` alongside `space.md`, `duration.fast` alongside `transition.enter`, `font.family.sans` alongside `typography.body`. No `ref` / `sys` / `cmp` tier prefix.

  CSS emission follows the paths: `--<prefix>-color-palette-blue-500`, `--<prefix>-color-surface-default`, `--<prefix>-typography-body-font-family`. `DEFAULT_CHROME_MAP` in core points each chrome role at its flat-path target.

  The reference and starter fixtures demonstrate the shape: per-type `.json` files under `tokens/` (`color.json`, `size.json`, `typography.json`, …) plus resolver modifier overlays under `tokens/themes/`.

### Patch Changes

- Updated dependencies [d565fcd]
  - @unpunnyfuns/swatchbook-core@0.5.0
  - @unpunnyfuns/swatchbook-blocks@0.5.0

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

### Patch Changes

- Updated dependencies [01fdcb0]
  - @unpunnyfuns/swatchbook-core@0.4.0
  - @unpunnyfuns/swatchbook-blocks@0.4.0

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
- Updated dependencies [a82552f]
- Updated dependencies [a2b5fcc]
- Updated dependencies [8e89d8d]
- Updated dependencies [c6aab6d]
- Updated dependencies [3d2d4bd]
- Updated dependencies [3fb0acf]
- Updated dependencies [e6dd438]
  - @unpunnyfuns/swatchbook-blocks@0.3.0
  - @unpunnyfuns/swatchbook-core@0.3.0

## 0.2.2

### Patch Changes

- 9a775be: Tighten the addon's HMR watch-path matching. File-path matches now require a path-separator boundary (`/project/resolver.json` no longer also matches `/project/resolver.json.backup`), and `picomatch.scan` replaces the hand-rolled glob-to-dir regex — brace-expansion patterns (`tokens/{base,overlays}/**/*.json`) and nested globstars now derive the correct watch root.
- cdf37dc: Fix `ColorPalette` success-state wrapper missing the `chromeAliases` spread that PR #324 added elsewhere. The empty-state wrapper got the alias layer; the main grid wrapper didn't, so consumers on any `cssVarPrefix` other than `sb` saw fallback colors for border / text chrome on the populated ColorPalette block. One-line fix — all other blocks were already correct.
- 416d5b7: Surface two previously-silent misconfiguration cases as `warn` diagnostics:

  - `swatchbook/resolver` — resolver modifier with no `default` and no contexts. Previously collapsed to an axis with an empty-string `default` and propagated into theme names; now users see "Resolver modifier X has no default and no contexts — axis is unusable" in the Design Tokens panel.
  - `swatchbook/project` — `config.disabledAxes` filtered out every theme. Previously rendered an empty tree with no hint; now the diagnostic names the pinned axes and suggests checking that their default contexts appear in the resolver's permutations.

  Both are diagnostics, not errors — the project still loads. No behavior change for valid configs.

- Updated dependencies [9a775be]
- Updated dependencies [cdf37dc]
- Updated dependencies [416d5b7]
  - @unpunnyfuns/swatchbook-core@0.2.2
  - @unpunnyfuns/swatchbook-blocks@0.2.2

## 0.2.1

### Patch Changes

- e86d414: Fix block chrome rendering when `cssVarPrefix` is anything other than `sb`. Blocks were referencing their own chrome (surface, borders, text, accent) via literal `var(--sb-color-sys-*)`, which fell through to fallback values for every project on the post-0.2.0 default prefix (`swatch`) or any custom prefix. Each block wrapper now spreads a CSS custom-property alias layer redirecting the `--sb-*` names to the project's actual prefix; chrome renders correctly regardless of prefix.
- Updated dependencies [e86d414]
  - @unpunnyfuns/swatchbook-blocks@0.2.1
  - @unpunnyfuns/swatchbook-core@0.2.1

## 0.2.0

### Minor Changes

- 2f733b5: **BREAKING:** Prefix `data-*` attributes with `cssVarPrefix`. `emitCss` now emits `[data-<prefix>-mode="Dark"][data-<prefix>-brand="Brand A"]` instead of `[data-mode="Dark"][data-brand="Brand A"]`, and the addon's preview decorator writes the matching prefixed attrs on `<html>`. Default prefix becomes `swatch` (applied in `loadProject` when config omits one); set `cssVarPrefix: ''` to keep the bare `data-<axis>` form. Fixes collisions with third-party libs that claim generic `data-mode` / `data-theme` (Tailwind, many theme-switcher plugins).

  Also adds `dataAttr(prefix, key)` export from `@unpunnyfuns/swatchbook-core` so consumer code setting these attrs manually stays in lockstep.

  Docs reframed to clarify that swatchbook is a **DTCG token documentation tool**, not a runtime theme-switcher or CSS-variable framework. The toolbar's axis switching is a documentation affordance for inspecting tokens across every context; the emitted CSS + attrs are internal scaffolding, not a production theming API.

### Patch Changes

- da9ac3e: Fix two toolbar-popover papercuts:

  - Clicks inside the preview iframe now close the popover. The manager's document-level mousedown listener can't observe events inside the preview, so the preview now emits a channel event on mousedown and the popover listens for it.
  - Toolbar no longer stays stuck in its "loading…" state when the manager mounts after the preview's initial `INIT_EVENT` broadcast. Manager now sends an `INIT_REQUEST` on mount and the preview re-broadcasts in response, closing the timing race.

- Updated dependencies [2f733b5]
  - @unpunnyfuns/swatchbook-core@0.2.0
  - @unpunnyfuns/swatchbook-blocks@0.2.0

## 0.1.5

### Patch Changes

- 51c9b7e: Add an explicit `aria-label="Search tokens"` to the Design Tokens panel's search input. Placeholder text alone doesn't satisfy WCAG 2.1 4.1.2 (Name, Role, Value) — screen readers now announce the field's purpose.
- 89d48a1: Declare `"sideEffects": false` on all three published packages. No CSS imports, no module-level work that isn't gated behind used-export reachability. Gives consumer bundlers permission to tree-shake unused exports more aggressively.
- Updated dependencies [d5f2a03]
- Updated dependencies [89d48a1]
  - @unpunnyfuns/swatchbook-blocks@0.1.5
  - @unpunnyfuns/swatchbook-core@0.1.5

## 0.1.4

### Patch Changes

- be1ee1f: Tidy npm keywords: drop `storybook-addon` from `@unpunnyfuns/swatchbook-blocks` (it's a companion doc-block library, not an addon), and add broader discovery terms `design` and `style` to `@unpunnyfuns/swatchbook-addon`.
- df29138: Fix the Swatchbook toolbar popover not closing on outside click. `WithTooltipPure`'s built-in `closeOnOutsideClick` misses the case of clicks that land outside the portaled popover; add a document-level `mousedown` listener while open that closes unless the click is inside the trigger wrapper or the popover body.
- Updated dependencies [be1ee1f]
  - @unpunnyfuns/swatchbook-blocks@0.1.4
  - @unpunnyfuns/swatchbook-core@0.1.4

## 0.1.3

### Patch Changes

- e809013: Fix the Swatchbook toolbar sitting in its disabled `loading…` state on MDX docs pages. `broadcastInit()` — the event that ships the virtual-module payload to the manager so the toolbar can render axes — was called inside the decorator's `useEffect`, so it never fired on bare MDX pages that don't render a story. Hoist the init (and `ensureStylesheet()`) to the module-level installer alongside the axis-attrs subscription so they run on preview load regardless of decorator state. Follow-up to the same-shape fix in v0.1.2.
- Updated dependencies [34e6255]
- Updated dependencies [04c9c2f]
- Updated dependencies [5dd94fe]
  - @unpunnyfuns/swatchbook-blocks@0.1.3
  - @unpunnyfuns/swatchbook-core@0.1.3

## 0.1.2

### Patch Changes

- e298dc3: Fix axis switching on MDX docs pages. The addon's preview decorator wrote `data-<axis>` attributes to `<html>` from inside the story wrapper — so bare MDX pages (no `<Story />`) had no ancestor carrying the tuple, the per-tuple CSS selectors never matched, and colors stayed on `:root` defaults no matter what the toolbar did. Subscribe to the channel at module level and write the same attrs independent of any decorator run, and pick up `setGlobals` in the blocks' fallback so the "Active tuple" indicator reflects the current selection on first render.
- Updated dependencies [e298dc3]
  - @unpunnyfuns/swatchbook-blocks@0.1.2
  - @unpunnyfuns/swatchbook-core@0.1.2

## 0.1.1

### Patch Changes

- 76456b6: Fix the `storybook.icon` URL in the addon's `package.json` — previous path referenced a non-existent file, and the Storybook addon catalog doesn't support SVG. Point at the committed PNG so the addon tile renders on https://storybook.js.org/addons.
  - @unpunnyfuns/swatchbook-core@0.1.1
  - @unpunnyfuns/swatchbook-blocks@0.1.1

## 0.1.0

### Minor Changes

- 735150a: Addon preview now resolves theme selection from an axis **tuple** rather than a composed name. New `swatchbookAxes` global (`Record<axisName, contextName>`) and `parameters.swatchbook.axes` per-story override take precedence over the existing `swatchbookTheme` / `parameters.swatchbook.theme` string form (still accepted for back-compat). The decorator writes one `data-<axisName>="<context>"` attribute per axis to `<html>` and the story wrapper — alongside the existing `data-theme` composed ID — giving upcoming CSS emission (#135) and toolbar (#134) work a stable target. A new `AxesContext` + `useActiveAxes()` hook exposes the tuple to consumer components.
- 943fda9: Add a color-format switcher across `TokenTable`, `TokenDetail`, and `ColorPalette`. A new `swatchbookColorFormat` global (default `hex`) and a matching toolbar dropdown route every color value through `formatColor()` — `hex`, `rgb`, `hsl`, `oklch`, or `raw` JSON. Out-of-gamut or wide-gamut colors fall back to `rgb()` for the `hex` format and are marked with a ⚠ indicator. Display only — emitted CSS is unaffected.
- 3cffe67: Consolidate the Swatchbook toolbar into a single icon button that opens one popover holding presets, per-axis pickers, and the color-format selector. The popover stays open across picks and closes only on root-icon click, outside click, or Escape. Replaces the previous chain of chips which consumed most of the toolbar width at three axes.
- 1d77100: Consolidate the addon's `Swatchbook tokens` and `Swatchbook diagnostics` panels into a single `Design Tokens` panel. The primary content is now a hierarchical tree of the active theme's tokens (expand/collapse groups, type pill + inline value/color-swatch preview, click a leaf to copy its `var(--…)` reference, search filter across paths). Diagnostics live in a collapsible section beneath the tree — collapsed with a green "OK" badge when clean, auto-expanded with a severity summary when warnings or errors are present. The `PANEL_TOKENS_TAB` / `PANEL_DIAGNOSTICS_TAB` constants are removed; use the new `PANEL_ID = 'swatchbook/design-tokens'` if you're wiring panel focus programmatically.
- 5072345: New `Config.disabledAxes?: string[]` suppresses declared axes from the toolbar, CSS emission, and theme enumeration without editing the resolver. Each listed axis pins to its `default` context: `Project.axes` drops it, `Project.themes` collapses to the default-context slice, CSS emission stops including it in compound selectors, and the addon's toolbar skips the dropdown. The tokens panel shows a small pinned indicator so the suppression stays visible. Unknown axis names surface as `warn` diagnostics (group `swatchbook/disabled-axes`) and are ignored. Filtered-out names land on the new `Project.disabledAxes: string[]` for downstream tooling. Config-level only — no runtime toggle.
- 0cb84fd: Drop the explicit-layers theming input. The DTCG 2025.10 resolver is now the sole theming input — `Config.themes`, the `ThemeConfig` type, and `resolveThemingMode` are all gone. Consumers with a layered config must move to a `resolver.json`.

  Theme names come from the resolver's modifier contexts: single-axis resolvers use the modifier value directly (context `Light` → theme name `Light`), multi-axis resolvers keep Terrazzo's JSON-encoded permutation ID. Pick sensible modifier context names in your resolver; what you write is what consumers see.

  The `themingMode` field on the virtual module is also removed — there's only one mode to be in.

- 6c7bfe5: Drop Tokens Studio `$themes` manifest support. The DTCG 2025.10 resolver is now the spec-native theming input; consumers using a manifest should convert to a `resolver.json` (the transformation is mechanical). `Config.manifest` is removed, `resolveThemingMode` returns `'layered' | 'resolver'`, and `themingMode` on the virtual module narrows accordingly. `@unpunnyfuns/swatchbook-tokens-reference` no longer exports `manifestPath`.
- 26fa690: Inline configuration in `.storybook/main.ts` is now the documented default — `options.config` takes a `Config` object directly, no separate `swatchbook.config.ts` file required. `options.configPath` is still supported; it's the right answer when you want the same config consumed by other tooling (a CLI, a CI lint job) alongside Storybook. READMEs, quickstart, and the config reference page all lead with the inline shape.

  No API change — both options already existed on the addon. The addon's own fixture (`apps/storybook/.storybook/main.ts`) switches to inline to dogfood the preferred setup.

- 48bf3e5: **Breaking.** `SwatchbookProvider`, `SwatchbookContext`, `ThemeContext`, `AxesContext`, `useSwatchbookData`, `useOptionalSwatchbookData`, `useActiveTheme`, `useActiveAxes`, and the `Virtual*Shape` / `ProjectSnapshot` types now live exclusively in `@unpunnyfuns/swatchbook-blocks`. They are no longer exported from `@unpunnyfuns/swatchbook-addon` — import them from `@unpunnyfuns/swatchbook-blocks` directly. Workspace dep graph runs addon → blocks, which is the direction it was always meant to. Closes issue #202.
- 05b38dd: Toolbar now renders one dropdown per modifier axis instead of a single flat list of composed theme names. For a project with independent `mode` and `brand` axes you get two controls (`mode: Light`, `brand: Brand A`) that combine into any valid permutation; the synthetic single-theme axis still presents as one "Theme" dropdown so UX is unchanged for projects without a resolver. Each dropdown shows the axis contexts with the current selection checked, surfaces the axis description in a tooltip when present, and updates both `swatchbookAxes` (the canonical tuple) and `swatchbookTheme` (the composed permutation ID for the panel + legacy consumers) atomically. The `alt+T` shortcut now cycles the primary (first) axis's contexts while pinning the rest of the tuple.
- 37933a3: `Config.tokens` is now optional when `config.resolver` is set. The resolver's own `$ref` targets fully determine what gets loaded, and `Project.sourceFiles` exposes every file touched so the addon's Vite plugin can derive HMR watch paths without a parallel `tokens` glob. Supplying `tokens` alongside `resolver` still works — the watch paths union with the resolver-derived set, useful when you want HMR to watch broader directories than the resolver references.

  Plain-parse (no resolver, no axes) and layered (`axes` set) modes still require `tokens` — the loader has no other starting point. Configs that omit `resolver`, `axes`, AND `tokens` now throw a descriptive error at load time.

- c1a8c71: Expose modifier axes as first-class on `Project`. `Project.axes: Axis[]` surfaces each DTCG resolver modifier with its `contexts`, `default`, `description`, and `source` (`'resolver' | 'synthetic'`); projects loaded without a resolver get a single synthetic `theme` axis. A new `permutationID(input)` utility centralizes the tuple-to-string logic previously inlined in the resolver loader — single-axis tuples stringify to the context value; multi-axis tuples join with `·`. The virtual `virtual:swatchbook/tokens` module now also exports `axes`, so toolbar and panel work in follow-up PRs can key on tuples rather than flat theme names.
- 92d5ae6: Introduce `SwatchbookProvider` + `useSwatchbookData` + `ProjectSnapshot` for framework-free block rendering. Blocks no longer depend on the addon's `virtual:swatchbook/tokens` module when a provider is in the tree, which means they render in plain React apps, unit tests, and non-Storybook doc sites — just hand the provider a `ProjectSnapshot`. The addon's preview decorator now mounts the provider around every story automatically, so Storybook-side authors see no change. The virtual-module fallback stays in place during the transition.
- 2d94d76: The bundled `tokens-reference` fixture gains a `contrast` axis (`Normal` / `High`), composing with `mode` and `brand` for 8 total themes. The `High` context thickens borders and swaps the focus ring to a high-contrast yellow; surfaces and accents stay owned by `mode` and `brand`. A new `A11y High Contrast` preset demonstrates the composition. Consumers of the fixture see three toolbar dropdowns and three-segment theme names (e.g. `Light · Default · Normal`).
- b29dd7c: Tokens panel and `TokenDetail` block are now axis-tuple aware. The panel reads the active tuple from `globals.swatchbookAxes` (falling back to `swatchbookTheme` for back-compat) and shows a compact per-axis indicator above the token list. `TokenDetail` replaces its flat per-theme values table with an axis-aware view: tokens that are constant across every tuple collapse to one row; tokens that vary along a single axis render a compact 1-axis table (one row per context); tokens that vary along two or more axes render a matrix of the two most-varying axes, with further axes collapsed to the active selection. The `useProject()` hook now returns `activeAxes` + `axes` alongside `activeTheme` and subscribes to both `swatchbookAxes` and `swatchbookTheme` updates, keeping every block reactive to axis changes.
- 04b3f44: Named tuple presets — `defineSwatchbookConfig({ presets })` now takes an ordered list of `{ name, axes, description? }` entries. Each preset names a partial axis tuple (any axis the preset omits falls back to that axis's `default` when applied). Core validates presets at `loadProject` time: unknown axis keys and invalid context values surface as `warn` diagnostics and are sanitized out, but the preset itself is preserved (an empty preset is still a valid tuple). Project gains a `presets` field, the virtual module gains a `presets` export, and the addon broadcasts presets alongside axes/themes on `INIT_EVENT`. The toolbar renders presets as quick-select pills next to the axis dropdowns: clicking a pill writes the composed tuple into `globals.swatchbookAxes` + `globals.swatchbookTheme`, highlights the pill whose tuple matches the current selection, and shows a subtle modified-marker dot if the user tweaks an axis dropdown after applying a preset.

### Patch Changes

- f14083a: Addon UI polish: restore the yinyang-style toolbar icon, drop the "Swatchbook" label from the toolbar button (tooltip still explains), and clear lingering `:focus` outlines from toolbar pills and Design Tokens panel tree rows. Also moves the Diagnostics section to the top of the Design Tokens panel so warnings and errors are visible without scrolling past the token tree. Closes #219 and #220.
- 4ca9bb3: Align `storybook` peerDependency range on `@unpunnyfuns/swatchbook-addon` with `@unpunnyfuns/swatchbook-blocks` (`^10.3.5`). Consumers pinning Storybook to 10.3.0–10.3.4 previously satisfied the addon floor but failed the blocks floor.
- 226b34e: Actually kill the pill's stray border color after deselection. Previous `outline: none` + `boxShadow: none` + `onMouseDown: preventDefault` attempts all missed the root cause: `OPTION_PILL_BASE` used the `border` shorthand, so when React transitioned active → inactive it _removed_ the `borderColor` inline-style key rather than updating its value — letting Storybook's theme's own `border-color` rule paint the button white. Switching to explicit `borderWidth` / `borderStyle` / `borderColor` longhands keeps `borderColor` permanently in the inline style, so every transition is a value change.
- 37774f7: Kill the stray focus ring that stuck on previously-clicked toolbar pills. `outline: none` alone wasn't enough — Storybook's button theme paints a `box-shadow`-based focus ring on `:focus`, which inline style overrides. Added `boxShadow: 'none'` to the pill base.
- d3e2b18: Stop the toolbar popover's pills from taking focus on mouse click. Storybook's theme applies a `:focus` border-color rule that stuck on the previously-clicked pill even with `outline: none` and `boxShadow: none` overrides — cleaner fix is to skip focus-on-click with `onMouseDown: preventDefault`. Keyboard tabbing still focuses pills normally.
- 1986a0f: Add standard npm publish metadata — `license` (MIT), `repository`, `homepage`, `bugs`, `author`, `keywords` — to all three published packages. No runtime change; required for registry discoverability, npm provenance attestation, and legal clarity ahead of the v0.1.0 release.
- Updated dependencies [4ca9bb3]
- Updated dependencies [943fda9]
- Updated dependencies [3741dc7]
- Updated dependencies [c593297]
- Updated dependencies [7a631dc]
- Updated dependencies [9d862a3]
- Updated dependencies [dfb5ec6]
- Updated dependencies [5072345]
- Updated dependencies [0cb84fd]
- Updated dependencies [6c7bfe5]
- Updated dependencies [bdcc784]
- Updated dependencies [954c26b]
- Updated dependencies [9b5ecdc]
- Updated dependencies [e091420]
- Updated dependencies [48bf3e5]
- Updated dependencies [8db913b]
- Updated dependencies [78ef794]
- Updated dependencies [d45d5da]
- Updated dependencies [f5ccc4d]
- Updated dependencies [37933a3]
- Updated dependencies [abf657d]
- Updated dependencies [c1a8c71]
- Updated dependencies [1986a0f]
- Updated dependencies [4737535]
- Updated dependencies [1434e4e]
- Updated dependencies [28b2473]
- Updated dependencies [92d5ae6]
- Updated dependencies [4a986d8]
- Updated dependencies [2f5bb68]
- Updated dependencies [0ec7ff3]
- Updated dependencies [881038e]
- Updated dependencies [b29dd7c]
- Updated dependencies [04b3f44]
  - @unpunnyfuns/swatchbook-blocks@0.1.0
  - @unpunnyfuns/swatchbook-core@0.1.0
