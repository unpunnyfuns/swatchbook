---
'@unpunnyfuns/swatchbook-blocks': minor
'@unpunnyfuns/swatchbook-addon': minor
'@unpunnyfuns/swatchbook-core': minor
---

Add `<Diagnostics />` block. Renders the project's load diagnostics — parser errors, resolver warnings, disabled-axes validation issues, etc. — as a collapsible severity-colored list. Auto-opens when the project carries errors or warnings; stays collapsed for clean loads. Consumers compose it on their own MDX pages alongside `<TokenNavigator />` / `<TokenTable />` to replace what the Design Tokens panel used to show at the top of its tree.
