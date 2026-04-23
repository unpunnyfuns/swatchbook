---
'@unpunnyfuns/swatchbook-blocks': patch
---

Route the block-side `makeCssVar` through Terrazzo's `makeCSSVar` from `@terrazzo/token-tools/css` — same function `packages/core/src/css.ts` already uses when emitting the stylesheet. Removes a parallel kebab-casing implementation that would have drifted from Terrazzo's own naming rules over time. No behavior change for current inputs; future naming-policy shifts in Terrazzo now propagate to both emission and block display in one step.
