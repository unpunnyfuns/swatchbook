---
"@unpunnyfuns/swatchbook-core": patch
---

Docs: register `tsx` + `typescript` with Prism so `.tsx` and `.ts` fenced code blocks across the docs site (quickstart, authoring-doc-stories guide, switcher reference, etc.) render with syntax highlighting instead of plaintext. The four `mdx` fences in the source switch to `tsx` since their content is JSX-import-heavy and tsx covers it cleanly; native `mdx` highlighting isn't bundled with `prism-react-renderer`.
