---
"@unpunnyfuns/swatchbook-switcher": patch
---

Docs: add a dedicated reference page for `@unpunnyfuns/swatchbook-switcher` under `reference/switcher` — covers install, peer requirements, mount example, full prop surface, input shapes (`SwitcherAxis` / `SwitcherPreset` / `SwitcherTheme`), axis-state propagation policy, and styling hooks. Also fixes the README's `Usage` block, which referenced removed props (`activeAxes`, `colorFormat`, `onColorFormatChange`) — replaced with the current `activeTuple` / `defaults` / `lastApplied` / `onPresetApply` shape and a note on the `footer` slot for color-format UI.
