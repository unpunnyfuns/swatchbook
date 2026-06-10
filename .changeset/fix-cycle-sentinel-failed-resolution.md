---
'@unpunnyfuns/swatchbook-core': patch
---

fix a failed token resolution (dangling alias) leaving a cycle marker in the shared memo, which made resolveAllAt return iteration-order-dependent values that disagreed with resolveAt
