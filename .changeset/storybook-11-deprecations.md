---
'@unpunnyfuns/swatchbook-addon': patch
---

Migrate the manager toolbar off three components deprecated in Storybook 10 and slated for removal in Storybook 11:

- `IconButton` → `Button` (loading-state button) and `ToggleButton` (active disclosure button, with `pressed={open}` replacing the deprecated `active` prop).
- `WithTooltipPure` → `WithTooltip` (controlled `visible` + `onVisibleChange` props still work the same).
- `ariaLabel` (about to become mandatory) is now supplied on both buttons. The visible-on-hover tooltip moves from the legacy HTML `title` attribute to the new `tooltip` prop.

No behaviour change — the toolbar pill, popover open/close mechanics, screen-reader semantics, and outside-click handling all preserved.
