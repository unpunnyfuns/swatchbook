---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

When the color-shape validator encounters `components` carrying an unresolved DTCG `$ref` object (a plain object with a string `$ref` member), the emitted diagnostic now names the JSON Pointer and identifies the upstream parser's failure to substitute the target — rather than the generic "`components` must be an array of numbers" message, which sends consumers hunting for source-side errors when the source is usually correct. Non-`$ref` non-array components keep the existing generic message.
