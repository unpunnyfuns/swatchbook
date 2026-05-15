---
'@unpunnyfuns/swatchbook-blocks': minor
---

`TokenNavigator` now implements the full WAI-ARIA tree-view keyboard pattern. The `<li role="treeitem">` is the focusable element (roving tabindex — exactly one item carries `tabIndex=0`, the rest are `-1`); arrow keys traverse the visible tree (`Down`/`Up` walk the flattened list; `Right` expands a collapsed group or steps to the first child; `Left` collapses an expanded group or steps to the parent); `Home`/`End` jump to the first / last visible treeitem; `Enter`/`Space` activates a leaf or toggles a group. Previously focus lived on a nested `<div role="button">` and only Enter / Space worked.

Behavior visible to consumers:

- Tab into the tree lands on a single treeitem instead of cycling through every row.
- Keyboard-only users can now traverse and operate the tree without reaching for a pointer device.
- The DOM the consumer queries via `getAllByRole('treeitem')` is unchanged; existing component tests pass as-is.
