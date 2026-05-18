---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
---

Five small helper consolidations across the addon, blocks, switcher, and core, each previously duplicated across two or more sites.

- New `@unpunnyfuns/swatchbook-core/style-element` subpath exporting `ensureStyleElement(id, text)` + `SWATCHBOOK_STYLE_ELEMENT_ID`. Replaces three hand-rolled `<style>`-injection blocks in the addon preview and blocks' internal `useProject`.
- New `presetTuple` export from `@unpunnyfuns/swatchbook-switcher` — the addon's manager toolbar now imports the helper instead of carrying a byte-identical copy.
- `cells.ts` reuses the existing `value-key.ts` helper instead of re-deriving the same `JSON.stringify($value)` comparison.
- `ColorFormat` runtime validation in the addon manager now reads through `COLOR_FORMATS.includes()` from `@unpunnyfuns/swatchbook-blocks`, matching the preview path and dropping a hand-maintained five-way `||` chain. The `ColorFormat` type itself re-exports from blocks.
- The 9-field `INIT_EVENT` payload subset is built once via a `pickInitFields` helper, shared between the live broadcast and the HMR re-emit.
