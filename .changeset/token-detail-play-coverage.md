---
"@unpunnyfuns/swatchbook-blocks": patch
---

Closes #831. Adds `play()` coverage to the seven previously-uncovered token-detail story files in `apps/storybook` (`AliasChain`, `AliasedBy`, `AxisVariance`, `CompositeBreakdown`, `CompositePreview`, `TokenHeader`, `TokenUsageSnippet`); only `ConsumerOutput.stories.tsx` had interaction coverage before.

Each play asserts the block's user-facing render against the active fixture token — type pills and CSS-var text for `TokenHeader`, the alias-chain DOM for `AliasChain`, the aliased-by tree presence for `AliasedBy`, the values-table layout for both multi-axis and constant tokens in `AxisVariance`, the typography / shadow key/value grid in `CompositeBreakdown`, the color-swatch and typography pangram samples in `CompositePreview`, and the snippet text plus clipboard copy in `TokenUsageSnippet`. Also adds negative-path coverage where the block legitimately returns null (e.g. `AliasChain` for a primitive, `AliasedBy` for a leaf alias) — guards against accidental "always renders" regressions.

No source changes; pure storybook test coverage.
