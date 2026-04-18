---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-addon': minor
---

New `Config.disabledAxes?: string[]` suppresses declared axes from the toolbar, CSS emission, and theme enumeration without editing the resolver. Each listed axis pins to its `default` context: `Project.axes` drops it, `Project.themes` collapses to the default-context slice, CSS emission stops including it in compound selectors, and the addon's toolbar skips the dropdown. The tokens panel shows a small pinned indicator so the suppression stays visible. Unknown axis names surface as `warn` diagnostics (group `swatchbook/disabled-axes`) and are ignored. Filtered-out names land on the new `Project.disabledAxes: string[]` for downstream tooling. Config-level only — no runtime toggle.
