---
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
---

Three small ThemeSwitcher / addon-toolbar / Diagnostics a11y touches bundled.

- **Addon toolbar `aria-haspopup`** — was `"dialog"` but the switcher body renders `role="group"` (settings panel, not modal dialog). Promised more than the popover delivered; switched to generic `aria-haspopup={true}` so the trigger announces "has popup" without claiming a dialog flavour that doesn't match.
- **ThemeSwitcher `OptionPill`** — dropped `onMouseDown={(e) => e.preventDefault()}`. The preventDefault stripped focus on mouse-click so subsequent Tab restarted at the manager toolbar instead of the just-clicked pill, hurting keyboard users alternating mouse + Tab. The pill's `:focus-visible` ring already gates ring-on-mouse, so removing preventDefault doesn't bring back sticky focus rings for normal users.
- **Diagnostics severity SR distinction** — explicit `role="list"` on the diagnostics `<ul>` (CSS-styled lists can shed list semantics in some AT combos), `aria-hidden` on the redundant severity-label span, and `aria-label="<severity>: <message>"` on each row so SR users hear "Error: <message>" / "Warning: <message>" / "Info: <message>" as one announcement unit.
