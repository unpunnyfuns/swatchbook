---
'@unpunnyfuns/swatchbook-blocks': patch
---

Wrap the search-query state with `useDeferredValue` in `<TokenTable>`, `<TokenNavigator>`, and `<ColorTable>`. The input controls the immediate `query` (still re-renders on every keystroke so the field stays responsive), but the heavy memos — `fuzzyFilter` scans, `pruneTreeForMatches` rebuilds, group visibility — key off the deferred copy and run at React's chosen tempo. Keystroke latency stops scaling with token count on large projects.
