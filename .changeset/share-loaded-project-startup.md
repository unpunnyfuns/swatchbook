---
"@unpunnyfuns/swatchbook-addon": patch
---

Closes #838. The addon's preset now calls `loadProject` once at Storybook startup and shares the result with both the typed-token codegen and the Vite plugin's first virtual-module render. Previously each ran its own independent `loadProject` call, parsing the same DTCG sources twice in sequence at startup.

`swatchbookTokensPlugin` gains an optional `initialProject` field; when supplied, the plugin's first `buildStart` skips its `loadProject` call and uses the pre-loaded project directly. HMR-triggered reloads still call `loadProject` as before (no behavior change for live reloads).

Storybook startup is now a single `loadProject` pass for the addon. Order of operations and emitted outputs unchanged.
