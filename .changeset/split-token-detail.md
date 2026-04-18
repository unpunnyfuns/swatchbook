---
'@unpunnyfuns/swatchbook-blocks': minor
---

Split `TokenDetail` into composable subcomponents. Each section — `TokenHeader`, `CompositePreview`, `CompositeBreakdown`, `AliasChain`, `AliasedBy`, `AxisVariance`, `TokenUsageSnippet` — is now exported as a standalone block so MDX authors can embed just the piece they need (each takes the same `path: string` prop). `TokenDetail` itself is unchanged in DOM output and props; it's now a thin composition of these pieces.
