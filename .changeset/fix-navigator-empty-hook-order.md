---
'@unpunnyfuns/swatchbook-blocks': patch
---

fix(blocks): TokenNavigator hooks run before empty-state early return

Typing a `root` or `type` arg that matches zero tokens used to cross a
hook-order boundary — the `matchCount` `useMemo` sat after the
`tree.length === 0` early return, so the first non-empty render threw
"Rendered fewer hooks than expected". Hoisted the memo above the
guard. Added a `NoMatches` story as a regression check.
