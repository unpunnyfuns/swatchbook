---
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-switcher": patch
---

Fix: keyboard users now get a visible focus indicator on three interactive surfaces that previously had `tabIndex=0` + key handlers but no `:focus-visible` styling. Adds 2px solid outlines (using `var(--swatchbook-accent-bg, #1d4ed8)`) on:

- `<TokenNavigator>` group-row + leaf-row.
- `<TokenTable>` row.
- `<ThemeSwitcher>` pill (was explicitly `outline: none` with no replacement).

Mouse interaction stays focus-ring-free; only keyboard navigation paints the outline. Pre-1.0 a11y blocker per the dossier audit.
