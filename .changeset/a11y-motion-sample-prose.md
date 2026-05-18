---
'@unpunnyfuns/swatchbook-blocks': patch
---

`<MotionSample>`'s reduced-motion fallback prose wrapped the CSS media query in literal backticks (`Animation suppressed by \`prefers-reduced-motion: reduce\`.`). Screen-readers read the backticks aloud verbatim. Wrap the identifier in `<code>` instead — readable in print, parsed as a code-span by SR voicing.
