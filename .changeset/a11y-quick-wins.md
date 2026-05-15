---
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-switcher': patch
---

A11y polish (first slice of #707):

- **`@unpunnyfuns/swatchbook-addon` toolbar trigger** — adds `aria-haspopup="dialog"` + `aria-expanded` to the popover button so screen readers announce the disclosure state. (`aria-controls` is omitted because Storybook's `WithTooltipPure` portals the popover with a dynamically-generated id we can't anchor to.)
- **`@unpunnyfuns/swatchbook-switcher` root** — switches `role="menu"` → `role="group"` with `aria-label="Swatchbook controls"`. The switcher is a settings panel (presets, axis selectors, color-format pills), not a command menu — ARIA `menu` would require `menuitem`-rolled children plus a roving tabindex, and the actual content is a panel of independent controls each of which exposes its own role + state.

No visual changes. Pure assistive-tech announcement improvements.
