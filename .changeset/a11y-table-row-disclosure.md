---
'@unpunnyfuns/swatchbook-blocks': patch
---

Add disclosure semantics to clickable `<TokenTable>` rows and `<ColorTable>` group rows.

- `<TokenTable>` rows already carry `tabIndex={0}` + `aria-label="Inspect <path>"` + Enter/Space activation; they now also carry `aria-haspopup="dialog"` so SR users hear the row will open a dialog before activating.
- `<ColorTable>` group rows split by mode:
  - When `onSelect` is set (consumer owns the follow-up UI), the row carries `aria-haspopup="dialog"` — same as TokenTable.
  - In the default in-place-expand mode, the row's `aria-label` already rotates between `"Expand <base>"` and `"Collapse <base>"` to communicate state. No additional ARIA: `aria-expanded` on `<tr>` is invalid outside a `treegrid`, and the row isn't a popup trigger.

`<tr>` elements keep their table-row semantics; the ARIA attributes layer disclosure cues on top without replacing roles.
