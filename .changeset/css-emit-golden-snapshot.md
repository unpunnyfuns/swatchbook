---
"@unpunnyfuns/swatchbook-core": patch
---

Closes #830. Adds a checked-in golden snapshot for `emitAxisProjectedCss` against the reference fixture (`packages/core/test/__snapshots__/css-axis-projected.css`). Existing substring matchers cover individual shape invariants (which selectors exist, which vars appear); the snapshot pins everything substring matchers don't — declaration order within each block, selector specificity, exact spacing around the joint compound selectors.

Regenerate with `vitest -u` after a deliberate emit change; otherwise the snapshot diff makes any unintended emit drift visible at PR review time. No source changes; emit output unchanged.
