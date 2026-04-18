---
'@unpunnyfuns/swatchbook-blocks': minor
---

Add `<ConsumerOutput>` subcomponent to `<TokenDetail>` — a tabbed panel that surfaces the active token in four consumer-facing formats: CSS (var reference + declaration), JSON (`$type` + resolved `$value`, honoring the active `swatchbookColorFormat`), JS (the matching `useToken(...)` import + call), and TS (the generated `tokens.d.ts` entry). Each tab has a copy-to-clipboard button with a transient "Copied" state. An "Active tuple: …" indicator shows which axis context the rendered outputs reflect.
