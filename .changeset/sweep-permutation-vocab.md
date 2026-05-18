---
'@unpunnyfuns/swatchbook-switcher': patch
---

Sweep stale "permutation" prose to "theme" across docs and the switcher README, mirroring the API rename that landed in PR #905. The literal Terrazzo field name `cssOptions.permutations` and the rendered `'permutations'` keyword stay as-is — they're Terrazzo API surface, not swatchbook's. Switcher README also drops the stale `permutations={...}` prop and the removed `SwitcherPermutation` type from its usage example.

Tightened the prose around `baseSelector` / `baseScheme` / `modeSelectors` to describe current behavior neutrally ("swatchbook ignores them — `permutations`-based emission supersedes them") instead of upgrade-flavoured "deprecated" framing.

Docs-only change; docs-site snapshot patch bump per the standing policy so the fix reaches `/`, not just `/next/`.
