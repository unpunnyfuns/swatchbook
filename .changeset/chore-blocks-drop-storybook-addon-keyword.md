---
'@unpunnyfuns/swatchbook-blocks': patch
---

chore(blocks): drop misleading "storybook-addon" npm keyword

`@unpunnyfuns/swatchbook-blocks` ships MDX doc blocks; the Storybook addon surface lives in the sibling `@unpunnyfuns/swatchbook-addon` package. Keeping the `storybook-addon` keyword here surfaced blocks in npm searches people really wanted the addon for.
