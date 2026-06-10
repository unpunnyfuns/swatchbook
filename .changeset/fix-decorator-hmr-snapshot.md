---
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
---

fix blocks rendered inside stories staying stale after a dev-time token save: the addon decorator now builds its ProjectSnapshot and resolveAt from the live token store (updated on HMR) instead of the static virtual-module exports (blocks now expose useTokenSnapshot)
