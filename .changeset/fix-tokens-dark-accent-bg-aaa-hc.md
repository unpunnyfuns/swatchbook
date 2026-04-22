---
'@unpunnyfuns/swatchbook-blocks': patch
---

fix(tokens): resolve dark-mode accent contrast failure + push High-contrast to AAA across the board

Two related contrast fixes on the Storybook reference fixture, surfaced by the new `get_color_contrast` MCP tool against `color.accent.bg` / `color.surface.default` pairs:

- **Dark · Default · Normal** — `color.accent.bg` inherited `blue.700` from base, collided with the dark neutral.900 surface at a **2.66:1** ratio (below even the 3:1 non-text threshold). `dark.json` now overrides `accent.bg` to `blue.500` and `accent.bg-hover` to `blue.300` for a lift-on-hover dark-mode button. Lands at **4.85:1** — clear 3:1 non-text and AA for large text.
- **Dark · Default · High** and **Light · Default · High** — brought to AAA across the board via alias indirection. Each mode file now declares a `color.accessible.accent.*` namespace (Light: deep blue.900 button + white text; Dark: inverted blue.100 button + neutral.900 dark text), and `contrast-high.json` aliases `color.accent.bg / bg-hover / fg` to that namespace. `contrast-high.json` stays mode-agnostic; each mode owns its own AAA values. Resolved ratios: **10.36:1** (Light + HC) and **14.63:1** (Dark + HC) — AAA for both accent-bg-vs-surface and accent-fg-vs-accent-bg.

Same alias-indirection pattern already used in the docs-site's a11y overlay (`color.accessible.primary.*` → a11y = High-contrast). Applied here to the Storybook reference fixture's accent scale.
