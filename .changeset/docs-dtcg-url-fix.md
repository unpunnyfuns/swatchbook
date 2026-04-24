---
'@unpunnyfuns/swatchbook-core': patch
---

Fix broken DTCG spec links. The `design-tokens.org` domain is dead; the canonical home is `www.designtokens.org` and the path layout shifted from `/tr/2025/drafts/...` to `/TR/2025.10/...`. Eight occurrences across docs, core README, test fixtures, resolver JSON `$schema`, and the docs navbar footer now point at the live URL.
