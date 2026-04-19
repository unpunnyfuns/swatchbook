---
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-core': patch
---

Align `storybook` peerDependency range on `@unpunnyfuns/swatchbook-addon` with `@unpunnyfuns/swatchbook-blocks` (`^10.3.5`). Consumers pinning Storybook to 10.3.0–10.3.4 previously satisfied the addon floor but failed the blocks floor.
