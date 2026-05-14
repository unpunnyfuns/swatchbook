---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-switcher": minor
"@unpunnyfuns/swatchbook-integrations": minor
"@unpunnyfuns/swatchbook-mcp": minor
---

Rename the cartesian-product surface from `themes` to `permutations`. A *theme* is a curated presentational choice (Light, Dark, Brand A — what `presets` already captures); a *permutation* is the raw cartesian product the DTCG resolver enumerates. The old vocabulary muddled the two, and the muddle made terrazzo#752 ("is 15M permutations a bug?") harder than it needed to be.

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
