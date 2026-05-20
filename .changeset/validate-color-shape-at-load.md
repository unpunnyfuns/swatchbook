---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

Validate color token `$value` shape at load time. The graph builder now walks every literal value and reports DTCG color objects whose `components` field is missing or non-array — the shape that crashes `colorjs.io` inside `inGamut(...)` with the unactionable `coords.map is not a function` traceback. Covers top-level color tokens and color sub-fields inside composites uniformly: any object whose `colorSpace` is a string is treated as a color and validated. Healthy fixtures see no new diagnostics; the validator finds problems, it doesn't create them.
