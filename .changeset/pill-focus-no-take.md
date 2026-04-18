---
'@unpunnyfuns/swatchbook-addon': patch
---

Stop the toolbar popover's pills from taking focus on mouse click. Storybook's theme applies a `:focus` border-color rule that stuck on the previously-clicked pill even with `outline: none` and `boxShadow: none` overrides — cleaner fix is to skip focus-on-click with `onMouseDown: preventDefault`. Keyboard tabbing still focuses pills normally.
