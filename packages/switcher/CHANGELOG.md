# @unpunnyfuns/swatchbook-switcher

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

## 0.20.6

### Patch Changes

- 74536c8: Docs: add a dedicated reference page for `@unpunnyfuns/swatchbook-switcher` under `reference/switcher` — covers install, peer requirements, mount example, full prop surface, input shapes (`SwitcherAxis` / `SwitcherPreset` / `SwitcherTheme`), axis-state propagation policy, and styling hooks. Also fixes the README's `Usage` block, which referenced removed props (`activeAxes`, `colorFormat`, `onColorFormatChange`) — replaced with the current `activeTuple` / `defaults` / `lastApplied` / `onPresetApply` shape and a note on the `footer` slot for color-format UI.

## 0.20.5

### Patch Changes

- 9bdd8da: Add `./style.css` to each package's `exports` map. The CSS files were already shipped via internal side-effect imports, but consumers that wanted to deliberately link the stylesheet (extract, reorder cascade, ship as a separate `<link>`) couldn't reach it via the package map. Now `import '@unpunnyfuns/swatchbook-blocks/style.css'` and `import '@unpunnyfuns/swatchbook-switcher/style.css'` resolve explicitly. The existing side-effect import path is unchanged.

## 0.20.4

## 0.20.3

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

- da22d9e: feat(switcher, mcp): first npm publish

  Earlier releases listed these packages in the repo and docs, but they never reached the npm registry — `npm install @unpunnyfuns/swatchbook-switcher` and `npm install @unpunnyfuns/swatchbook-mcp` both 404'd because trusted publishing was configured for `core` / `addon` / `blocks` only, and the partial-publish failure caused `changesets/action` to skip the subsequent tag push too (which is why git tags stopped at 0.6.2).

  Bootstrapped via npm's pending-trusted-publisher flow on both package names. Subsequent releases publish alongside `core` / `addon` / `blocks` via the standard OIDC path, and the tag / GitHub-release step runs normally.

  This changeset also tips the fixed-version group to 0.11.0 — the arrival of these two packages on the registry is the right anchor for a minor bump.

## 0.10.2

## 0.10.1

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

### Minor Changes

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
