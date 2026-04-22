---
'@unpunnyfuns/swatchbook-addon': patch
---

Add `@unpunnyfuns/swatchbook-integrations/css-in-js` subpath. Contributes `virtual:swatchbook/theme` — a typed JS accessor whose leaves are `var(--<cssVarPrefix>-*)` references. Drop-in for styled-components / emotion / any ThemeProvider that passes its theme object through as-is; values stay stable across tuples and the swatchbook toolbar flips everything via CSS cascade.

Covers the JSX-provider recipes in `@storybook/addon-themes` except MUI (which needs resolved-value emission — deferred until demand surfaces).
