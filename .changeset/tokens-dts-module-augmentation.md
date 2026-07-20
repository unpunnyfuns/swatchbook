---
'@unpunnyfuns/swatchbook-addon': patch
---

Generated `.swatchbook/tokens.d.ts` is now a module augmentation, so it no longer shadows the addon's `/hooks` exports (`useToken` and friends) in a consumer's typecheck
