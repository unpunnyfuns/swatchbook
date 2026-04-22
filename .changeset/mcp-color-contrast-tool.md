---
'@unpunnyfuns/swatchbook-mcp': minor
---

feat(mcp): `get_color_contrast` tool for pair-wise contrast queries

New tool that computes the contrast between two color tokens against a given theme. Two algorithms:

- **`wcag21`** (default) — classic 1–21 ratio plus boolean pass flags for WCAG 2.1 AA (normal + large text) and AAA (normal + large text).
- **`apca`** — signed Lc value (polarity-preserving; negative = dark foreground on light background, positive = light on dark) plus body / large-text / non-text pass flags against the Silver-draft bronze thresholds (`|Lc| ≥ 75 / 60 / 45`).

Closes the loop on the accessibility work — the same computation axe runs against rendered HTML becomes queryable from an agent *about the tokens themselves*, per-theme. Useful for reasoning about link legibility, focus-ring visibility, border contrast, muted-text readability, without having to re-implement luminance math in the agent or pick between three competing algorithms.

Built on `colorjs.io`'s contrast primitives, which the MCP package already depended on for `get_color_formats`. No new dependencies.
