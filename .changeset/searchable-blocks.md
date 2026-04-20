---
'@unpunnyfuns/swatchbook-blocks': minor
---

feat(blocks): runtime search on `<TokenTable>` and `<TokenNavigator>`

Both blocks now render a search input at the top (default on) that narrows the visible tokens by case-insensitive substring. `<TokenTable>` filters rows by path, type, or value; `<TokenNavigator>` prunes the tree to matching leaves and auto-expands every group on the way to a match so hits are visible without clicking. Adds a `searchable?: boolean` prop to both; pass `false` to hide the input when you want authoring-time filtering (`filter` / `type` / `root`) only.

Restores the runtime search UX the retired Design Tokens panel used to have, which the docs and Dashboard page have been (misleadingly) claiming ever since.
