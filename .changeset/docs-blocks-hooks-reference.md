---
'@unpunnyfuns/swatchbook-blocks': patch
---

docs(blocks): move hooks into a dedicated reference page; correct stale "not re-exported from addon" claims

The addon has re-exported the full blocks surface (hooks, provider, contexts) since the one-stop-install work landed, so `import { useSwatchbookData } from '@unpunnyfuns/swatchbook-addon'` works the same as importing from blocks. The intro page and do/don't list still asserted the opposite; updated both. Hooks now have their own reference page under Blocks → Hooks.
