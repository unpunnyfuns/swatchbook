---
'@unpunnyfuns/swatchbook-blocks': patch
---

TokenNavigator, TokenTable, and ColorTable now keep their expand, selection, and search state when you flip a theme axis on an MDX docs page (Storybook remounts docs blocks on a globals change, which previously reset that state).
