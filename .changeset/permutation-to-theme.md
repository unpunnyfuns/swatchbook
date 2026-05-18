---
'@unpunnyfuns/swatchbook-blocks': minor
'@unpunnyfuns/swatchbook-addon': patch
---

**Breaking — blocks public surface:** vocabulary rename from "permutation" to "theme", aligning blocks with the rest of the swatchbook surface (MCP renamed in #862; the addon channel/panel already uses "theme"; the docs-site switcher already labels its dropdown "Theme").

- `PermutationContext` → `ThemeContext`
- `useActivePermutation()` → `useActiveTheme()`
- `ProjectSnapshot.activePermutation` → `ProjectSnapshot.activeTheme`
- `ProjectData.permutationNameForTuple` → `themeNameForTuple`

The addon's preview decorator follows: its internal `matchPermutationName` helper is now `matchThemeName`, and it provides the snapshot via `ThemeContext.Provider value={themeName}` plus `snapshot.activeTheme`. Story-parameter shape (`parameters.swatchbook.permutation`) and the legacy `swatchbookTheme` global are unchanged — those are author-facing inputs covered by their own deprecation path.

Documentation: the "Consuming the active permutation" guide moves to `consuming-the-active-theme.mdx`; in-doc references update in lockstep.

Pre-1.0 minor bump. Consumers update their imports + field reads; type errors at every callsite make the rename mechanically straightforward.

Closes #896
