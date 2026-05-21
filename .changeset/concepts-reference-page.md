---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

Add `reference/concepts.mdx` — a single page consolidating Swatchbook's mental model in one place: the "preview host, not transformer" framing, the axes/contexts/tuples vocabulary, what the token graph conceptually represents (without walker internals), and the alignment story with a production Terrazzo build. Slots first in the Reference > Model sidebar so the reading order goes conceptual → operational (Concepts → Axes → Token pipeline → Diagnostics). Cross-linked from `intro.mdx`'s "How to read these docs". Doesn't replace any existing page; front-loads the model for new and returning readers.
