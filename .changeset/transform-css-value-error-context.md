---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

When the smart emitter's call to `transformCSSValue` throws on a malformed token `$value`, the thrown error now names the token path, the active axis permutation, and the offending `$value`, with the original error attached as `cause`. Previously a malformed token surfaced as a four-frames-deep colorjs.io traceback with no clue which token was at fault. Healthy tokens are unaffected.
