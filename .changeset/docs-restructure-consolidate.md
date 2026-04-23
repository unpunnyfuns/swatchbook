---
'@unpunnyfuns/swatchbook-core': patch
---

Restructure the documentation: consolidate sprawling sections, drop duplicate and pre-emptive pages, tighten the register. Sidebar drops from six nav pills to three (Guides / Reference / Developers). Page count drops from twenty-three to fifteen.

- `concepts/axes-vs-themes` + `concepts/axes` merged into `reference/axes` — one page, the runtime model plus a short framing paragraph, no separate "why" page.
- `guides/token-dashboard` merged into `guides/authoring-doc-stories` as a composition example; tutorial framing retained.
- `integrations/{index,tailwind,css-in-js}` merged into `guides/integrations` — two integrations are small enough to live as sections on one page, not three.
- `concepts/token-pipeline` moved to `reference/token-pipeline` and rewritten for tighter register.
- `concepts/presets` and `concepts/theming-inputs` dropped — content already covered in `reference/config`.
- `guides/migrating-from-addon-themes` dropped — the migration story is two sentences in the intro.
- `guides/multi-axis-walkthrough` dropped — the axes reference + resolver docs carry the load.
- Intro + quickstart trimmed: pitchier phrasings replaced with direct descriptions. Less "powerful" / "seamless" voice, more "a tool for visualising your design tokens." Register matches the rest of the reference material.
- Every cross-link and anchor updated across the remaining pages; docs build passes cleanly.
