---
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-addon': patch
---

fix blocks failing to import standalone (outside Storybook) due to a hard dependency on the addon's virtual:swatchbook/tokens module; blocks now read an injected snapshot via the new registerTokenSource, which the addon preview calls at init
