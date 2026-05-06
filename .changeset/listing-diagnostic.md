---
"@unpunnyfuns/swatchbook-core": patch
---

Fix: emit a `swatchbook/listing` warn diagnostic when the Token Listing build fails (plugin crash inside a user-supplied `terrazzoPlugins` entry, missing listing output, malformed JSON). Previously those failures returned an empty listing silently, leaving `<TokenTable>` / `<ColorTable>` / `<TokenDetail>` previews falling back to raw values with no signal as to why. The `<Diagnostics />` block already auto-opens when warnings are non-zero, so authors see the failure immediately.
