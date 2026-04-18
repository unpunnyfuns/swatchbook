---
'@unpunnyfuns/swatchbook-blocks': minor
'@unpunnyfuns/swatchbook-addon': minor
---

Introduce `SwatchbookProvider` + `useSwatchbookData` + `ProjectSnapshot` for framework-free block rendering. Blocks no longer depend on the addon's `virtual:swatchbook/tokens` module when a provider is in the tree, which means they render in plain React apps, unit tests, and non-Storybook doc sites — just hand the provider a `ProjectSnapshot`. The addon's preview decorator now mounts the provider around every story automatically, so Storybook-side authors see no change. The virtual-module fallback stays in place during the transition.
