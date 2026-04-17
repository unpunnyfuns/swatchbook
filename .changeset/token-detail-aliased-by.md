---
'@unpunnyfuns/swatchbook-blocks': minor
---

`TokenDetail` now renders an "Aliased by" tree mirroring the existing "Alias chain". For any token, it walks Terrazzo's `aliasedBy` field backward — direct consumers, their consumers, and so on — so a viewer can trace from a primitive (e.g. `color.ref.neutral.0`) to every sys and cmp token that ultimately depends on it. Each level is sorted ref → sys → cmp → other, then alphabetical. Depth is capped at 6 hops with a visible "truncated" note when hit. Only renders when the focal token has at least one direct consumer; otherwise the section is hidden.

No new analysis — Terrazzo already produces `aliasedBy` during resolve. The section just surfaces it.
