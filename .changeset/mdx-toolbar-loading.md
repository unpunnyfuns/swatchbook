---
'@unpunnyfuns/swatchbook-addon': patch
---

Fix the Swatchbook toolbar sitting in its disabled `loading…` state on MDX docs pages. `broadcastInit()` — the event that ships the virtual-module payload to the manager so the toolbar can render axes — was called inside the decorator's `useEffect`, so it never fired on bare MDX pages that don't render a story. Hoist the init (and `ensureStylesheet()`) to the module-level installer alongside the axis-attrs subscription so they run on preview load regardless of decorator state. Follow-up to the same-shape fix in v0.1.2.
