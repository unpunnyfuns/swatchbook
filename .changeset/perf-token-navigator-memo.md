---
'@unpunnyfuns/swatchbook-blocks': patch
---

`<TokenNavigator>` perf cleanup:

- `LeafPreview` and `LeafRow` are now wrapped in `React.memo`. `LeafPreview` resolves CSS vars + formats values per leaf — on every keystroke the search query churns `flatVisible`, which previously re-rendered every leaf row and its preview. With memo, leaves with unchanged props skip rerendering. `LeafRow` takes `isFocused` as a pre-computed boolean (instead of receiving the full `focusedPath` string and re-deriving it internally) so focus shifts only re-render the previously- and newly-focused rows.
- The focused-path repair effect (`useEffect` that called `setFocusedPath` based on `flatVisible`) is replaced with a `useMemo` that derives the visible focused path during render from the user-driven `storedFocus` plus `flatVisible`. Removes the deriving-state-in-effect anti-pattern; no spurious extra render per keystroke.
- The DOM-sync `useEffect` that calls `node.focus()` when the active path moves stays in place — it's a legitimate DOM side-effect, not state derivation.

`TreeNodeRow` itself is intentionally not wrapped in `memo`. Its `expanded: Set` prop changes identity on every toggle, which would defeat memoization anyway; group rows are also cheap relative to leaf rows.
