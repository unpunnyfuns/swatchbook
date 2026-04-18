---
'@unpunnyfuns/swatchbook-addon': patch
---

Actually kill the pill's stray border color after deselection. Previous `outline: none` + `boxShadow: none` + `onMouseDown: preventDefault` attempts all missed the root cause: `OPTION_PILL_BASE` used the `border` shorthand, so when React transitioned active → inactive it *removed* the `borderColor` inline-style key rather than updating its value — letting Storybook's theme's own `border-color` rule paint the button white. Switching to explicit `borderWidth` / `borderStyle` / `borderColor` longhands keeps `borderColor` permanently in the inline style, so every transition is a value change.
