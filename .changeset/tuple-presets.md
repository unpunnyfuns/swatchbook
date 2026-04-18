---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-addon': minor
---

Named tuple presets — `defineSwatchbookConfig({ presets })` now takes an ordered list of `{ name, axes, description? }` entries. Each preset names a partial axis tuple (any axis the preset omits falls back to that axis's `default` when applied). Core validates presets at `loadProject` time: unknown axis keys and invalid context values surface as `warn` diagnostics and are sanitized out, but the preset itself is preserved (an empty preset is still a valid tuple). Project gains a `presets` field, the virtual module gains a `presets` export, and the addon broadcasts presets alongside axes/themes on `INIT_EVENT`. The toolbar renders presets as quick-select pills next to the axis dropdowns: clicking a pill writes the composed tuple into `globals.swatchbookAxes` + `globals.swatchbookTheme`, highlights the pill whose tuple matches the current selection, and shows a subtle modified-marker dot if the user tweaks an axis dropdown after applying a preset.
