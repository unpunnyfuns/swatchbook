---
'@unpunnyfuns/swatchbook-addon': minor
---

Consolidate the addon's `Swatchbook tokens` and `Swatchbook diagnostics` panels into a single `Design Tokens` panel. The primary content is now a hierarchical tree of the active theme's tokens (expand/collapse groups, type pill + inline value/color-swatch preview, click a leaf to copy its `var(--…)` reference, search filter across paths). Diagnostics live in a collapsible section beneath the tree — collapsed with a green "OK" badge when clean, auto-expanded with a severity summary when warnings or errors are present. The `PANEL_TOKENS_TAB` / `PANEL_DIAGNOSTICS_TAB` constants are removed; use the new `PANEL_ID = 'swatchbook/design-tokens'` if you're wiring panel focus programmatically.
