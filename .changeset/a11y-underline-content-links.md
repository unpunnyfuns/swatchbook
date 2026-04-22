---
'@unpunnyfuns/swatchbook-blocks': patch
---

fix(a11y): underline body-content links so colour isn't the sole distinguisher

Axe flagged two related WCAG violations: **1.4.1 (Use of Color)** — links in body text weren't distinguishable without colour — and **1.4.11 (Non-text Contrast)** — the a11y=High-contrast amber primary (#fcd34d) only reached 1.31:1 against surrounding Dark-mode text (#f1f5f9), below the 3:1 non-text contrast minimum.

Underlining body links addresses both: colour is no longer the sole distinguisher, and 1.4.11's ratio requirement only applies when colour is carrying the signal on its own.

Rule scoped to `.markdown a` — Docusaurus's rendered-MDX container — so navbar, sidebar, footer, and button-style links are untouched. Those carry affordances via position and chrome instead of inline prose context.
