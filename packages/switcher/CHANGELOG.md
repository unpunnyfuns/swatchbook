# @unpunnyfuns/swatchbook-switcher

## 0.54.0

### Minor Changes

- 8fb128c: `@unpunnyfuns/swatchbook-addon`: add `emitMode: 'cartesian' | 'projected'` option, defaulting to `'projected'`. The smart axis-projected emitter (`emitAxisProjectedCss`) now backs the addon's virtual-module `css` export — one `:root` baseline + per-cell deltas + compound `[data-A][data-B]` blocks for joint-variant tokens. Output is dramatically smaller than cartesian for typical fixtures while remaining spec-faithful for non-orthogonal DTCG resolvers. Pass `emitMode: 'cartesian'` to fall back to the explicit per-tuple fan-out (`projectCss`) — keep this in mind only for pathological cardinality where the projection analysis pass is too costly.
- 31999ef: `@unpunnyfuns/swatchbook-switcher`: remove the unused `permutations` prop from `<ThemeSwitcher>` and the `SwitcherPermutation` type from the public exports. The prop was declared but never read inside the component; the addon's manager and the storybook example are updated to drop the dead pass-through.
- 7b4225a: `@unpunnyfuns/swatchbook-core`: add `emitAxisProjectedCss(permutations, permutationsResolved, options?)` as an opt-in alternative to `emitCss` / `projectCss`. Emits one `:root` baseline block plus one `[data-<prefix>-<axis>="<context>"] { … }` block per non-default axis cell, carrying only the declarations that differ from baseline at that cell. Output composes via CSS cascade at runtime instead of fanning out across the cartesian tuple space. Axes must be orthogonal — see the function's doc-comment for the joint-variance limitation. Purely additive: existing `emitCss` / `projectCss` behavior unchanged.
- 5ed6b04: `@unpunnyfuns/swatchbook-core`: rewrite `emitAxisProjectedCss` to route per-token between projection (single-attribute selectors) and compound selectors based on `analyzeProjectVariance`. Spec-faithful for any DTCG-compliant resolver — orthogonal projects still get the size win; joint-variant projects get compound `[data-A][data-B]` blocks that preserve the cartesian-correct value at exactly the divergent joint tuples. Smart dedup: cells re-emit a token's value when ANY axis touches it (not just when this cell differs from baseline), so cascade-order resolves orthogonal-after-probe tokens correctly. Signature changed to `(project, options)` — function is `@internal`, only consumed in-package; no public API broken.
- 812676f: `@unpunnyfuns/swatchbook-core`: add internal `analyzeProjectVariance(project)` that classifies every token by how it varies across axes — baseline-only, single-axis, orthogonal-after-probe, or joint-variant. First step of a planned smart-emitter rewrite that routes per-token between projection (orthogonal) and compound-selector emit (joint-variant). Analysis only; no emit behaviour changes in this release. Not exported from the public API yet.

### Patch Changes

- ded154d: `@unpunnyfuns/swatchbook-core`: honest the orthogonality framing on `emitAxisProjectedCss`. JSDoc + test descriptions previously called the orthogonality requirement a "usage constraint," implying the consumer was responsible for authoring orthogonal modifiers. The DTCG Resolver Module 2025.10 spec explicitly permits non-orthogonal modifiers (Primer's "Pirate" light-only theme is the rationale doc's own example); projection is a lossy size optimization for them, not a contract. Cartesian (`emitCss`) is the spec-faithful default. Docs only — no behavior change.

## 0.53.0

## 0.52.0

### Patch Changes

- 27b3f69: A11y polish (first slice of #707):

  - **`@unpunnyfuns/swatchbook-addon` toolbar trigger** — adds `aria-haspopup="dialog"` + `aria-expanded` to the popover button so screen readers announce the disclosure state. (`aria-controls` is omitted because Storybook's `WithTooltipPure` portals the popover with a dynamically-generated id we can't anchor to.)
  - **`@unpunnyfuns/swatchbook-switcher` root** — switches `role="menu"` → `role="group"` with `aria-label="Swatchbook controls"`. The switcher is a settings panel (presets, axis selectors, color-format pills), not a command menu — ARIA `menu` would require `menuitem`-rolled children plus a roving tabindex, and the actual content is a panel of independent controls each of which exposes its own role + state.

  No visual changes. Pure assistive-tech announcement improvements.

## 0.51.1

## 0.51.0

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
