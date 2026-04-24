---
'@unpunnyfuns/swatchbook-core': patch
---

Add explicit `.mdx` extensions to every internal doc-to-doc markdown link. Docusaurus only rewrites relative links to doc slugs when the source has an `.md`/`.mdx` extension; without it, the link becomes a raw URL resolved against the current page at click time — so `[text](./guides/integrations/tailwind)` from `/quickstart/` could land on `/quickstart/guides/integrations/tailwind` instead of `/guides/integrations/tailwind`. Seventy-something links across the docs corrected; directory-style links (`./developers/`, `./reference/blocks`, `./guides/integrations`) now point at the explicit index file (`./developers/index.mdx` etc.). No content changes; navigation robustness fix.
