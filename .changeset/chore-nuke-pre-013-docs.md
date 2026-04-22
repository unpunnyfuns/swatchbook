---
'@unpunnyfuns/swatchbook-blocks': patch
---

Retire versioned documentation snapshots for 0.4-0.12. The 0.13 snapshot captures the post-reorg layout (Concepts as top-level, integrations docs, reshuffled guides) and becomes the single baseline. Also flips Concepts and Integrations navbar entries from the temporary `href`-with-hardcoded-`/next/` workaround to proper `type: 'docSidebar'` entries now that every retained version has those sidebars.
