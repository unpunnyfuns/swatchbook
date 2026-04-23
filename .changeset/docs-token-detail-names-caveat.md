---
'@unpunnyfuns/swatchbook-core': patch
---

Tighten the framing on `<TokenDetail>`'s per-platform Consumer Output rows and the alignment guide's per-platform section so it's clear: swatchbook doesn't transform tokens, it displays what the consumer's configured transformers emit. The rows match production naming only when the plugin invocations match (pass `plugin-swift({ yourProductionOptions })`, not `plugin-swift()`). No behaviour change; the caveat makes the "preview host, not token transformer" scope explicit in-docs so users don't read the displayed defaults as authoritative.
