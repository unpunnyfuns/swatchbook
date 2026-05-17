---
"@unpunnyfuns/swatchbook-blocks": patch
---

Closes #836. `sortTokens` pre-computes per-token sort keys once before sorting (Schwartzian transform) instead of recomputing on every pair comparison. For N tokens, sort does O(N log N) comparisons; the per-call cost was dominated by the Oklch color conversion (`new Color()` + `to('oklch')`) on every comparison involving color tokens.

Now: one key-computation pass per token (O(N)), then O(N log N) cheap key-comparison lookups. Visible improvement on `<ColorTable>` / `<TokenTable>` with a few hundred color tokens, especially on slower devices or in Chromatic capture runs.

No behavior changes — same sort order in every case.
