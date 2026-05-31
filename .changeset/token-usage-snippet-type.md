---
"@unpunnyfuns/swatchbook-blocks": patch
---

`TokenUsageSnippet` now emits a CSS property matching the token's `$type` instead of always `color:`. Color tokens still show `color: var(--…)`; shadow/border/font tokens show their canonical property (`box-shadow`, `border`, `font-family`, …); and types with no single canonical property (`dimension`, `number`) show the var reference prefixed with a `/* <type> */` hint rather than a misleading property.
