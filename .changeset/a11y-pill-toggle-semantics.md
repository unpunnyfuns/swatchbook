---
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-addon': patch
---

Add toggle/group semantics to `OptionPill` (used by `ThemeSwitcher`) and the addon's `ColorFormatSelector`:

- `aria-pressed={active}` on every pill so SR users hear "Dark pressed" / "Light not pressed" instead of just the bare label.
- `role="group"` + `aria-labelledby` wrapping the axis pill row + the color-format pill row so SR users hear the grouping context ("mode group: Dark pressed, Light not pressed").
- `aria-label="<context> (<axis>)"` disambiguates pills that share a label across axes (e.g. `Default` on both `mode` and `brand`).
- Dropped `onMouseDown={(e) => e.preventDefault()}` from `ColorFormatSelector`'s buttons (was hiding focus on mouse-click; the `:focus-visible` rule gates ring-on-mouse so no sticky-ring regression).

Test expectations updated for the new accessible names (`Light (mode)`, `Hex color format`, etc.).
