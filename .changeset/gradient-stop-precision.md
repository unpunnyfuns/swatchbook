---
"@unpunnyfuns/swatchbook-blocks": patch
---

Fix: composite tokens (`gradient`, `typography`, `transition`) now render through their local formatters again instead of plugin-css's CSS-shorthand `previewValue`. The previewValue short-circuit was producing surprising rendering for these three types where plugin-css's CSS-shorthand convention diverges from this file's docstring contract:

- `gradient` — stops as `position * 100`% leak IEEE-754 float precision (e.g. `55.00000000000001%` for a 0.55 stop). Local `formatGradient` `Math.round`s and joins with `→`.
- `typography` — plugin-css emits CSS `font` shorthand (`weight size/lh family`), burying the family at the end. Local `formatTypography` leads with `family / size / lh / weight` so columns line up across rows in `<TokenTable>` / `<TokenNavigator>`.
- `transition` — plugin-css emits `duration delay easing` and keeps `0ms` delay visible. Local `formatTransition` produces `duration easing [delay]` and strips zero delay.

Other types' `previewValue` paths are unchanged (border, shadow, strokeStyle, dimension, fontFamily — these use shapes that already match the local formatters). Surfaced after PR #710's storybook config fix made the listing build start succeeding for the first time, which exposed the long-standing previewValue short-circuit on composite tokens.
