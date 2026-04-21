---
'@unpunnyfuns/swatchbook-blocks': patch
---

docs: explain the no-external-compile-step property

New "The token pipeline" concept page under Concepts, covering how tokens reach the blocks through the addon's Vite virtual module rather than a separate prebuild step. Includes how HMR works against the virtual module, why the module doesn't extend to production consumer apps (and what to use instead — `emitCss` from core), and the Terrazzo parser credit. Linked from a new bullet in the intro.
