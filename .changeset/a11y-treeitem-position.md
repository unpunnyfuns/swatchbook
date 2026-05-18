---
'@unpunnyfuns/swatchbook-blocks': patch
---

`<TokenNavigator>` treeitem rows (both group and leaf) now carry the full WAI-ARIA tree-position metadata: `aria-level` (1-indexed depth), `aria-setsize` (count of siblings at this level), and `aria-posinset` (1-indexed position among siblings). Screen readers can now announce "item 3 of 12, level 2" instead of just "item" — required by the tree pattern when DOM ancestry alone doesn't carry the cardinality info AT needs.

Threaded through `TreeNodeRow` + `LeafRow` props from the root render; recursion increments level + recomputes sibling counts at each step.
