---
'@unpunnyfuns/swatchbook-core': patch
---

docs: add a DTCG-aware theme switcher to the docs-site navbar

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
