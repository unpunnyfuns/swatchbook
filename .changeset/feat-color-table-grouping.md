---
'@unpunnyfuns/swatchbook-blocks': minor
---

`ColorTable` now collapses sibling variants into a single row with a pill selector — clicking a pill swaps the displayed HEX / HSL / OKLCH / CSS var to that variant's values. Given `variants={{ hover: 'hover', disabled: 'disabled' }}`, the tokens `color.bg.hi`, `color.bg.hi.disabled`, and `color.bg.hi.hover` emit one row with three pills (`base` / `disabled` / `hover`). Backmarket-style hyphen tails (`color.bg.hi-h` with `variants={{ hover: 'h' }}`) group identically.

Row click now expands the row inline instead of opening a drawer. The detail panel surfaces `$description`, the token's alias chain, and — for multi-variant groups — a compact sub-table comparing every variant's values at once. `onSelect` still acts as the escape hatch: when set, it replaces both the expansion and any drawer behavior with consumer-owned follow-up.

Single-member groups (no matching variants, or a lone variant with no siblings) render as plain rows with no pill selector. Passing no `variants` map disables grouping entirely — back-compat.
