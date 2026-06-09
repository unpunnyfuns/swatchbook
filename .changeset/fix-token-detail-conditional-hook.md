---
'@unpunnyfuns/swatchbook-blocks': patch
---

fix TokenDetail crashing when a token appears or disappears between renders (useProject was called after a conditional early return)
