---
'@unpunnyfuns/swatchbook-blocks': patch
---

fix(blocks): surface sub-value alias chains in `<CompositeBreakdown>`

When a composite token (`border`, `shadow`, `transition`, `typography`,
`gradient`) references another token by alias on one of its sub-values,
the `<TokenDetail>` drawer now shows the full alias chain next to that
row — the same way top-level token aliases are surfaced by
`<AliasChain>`. Previously a border whose `color` aliased another color
token rendered only the resolved hex, with no indication that the value
had been authored as an alias.

Chains walk transitively via Terrazzo's `partialAliasOf` + the target
token's own `aliasChain`, so authors see the full `borderColorAlias →
colorRole → colorPrimitive` path.
