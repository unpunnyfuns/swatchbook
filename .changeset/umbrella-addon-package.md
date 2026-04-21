---
'@unpunnyfuns/swatchbook-addon': minor
---

feat(addon): one-stop meta package — re-export blocks + switcher APIs

The addon package now re-exports every public API from
`@unpunnyfuns/swatchbook-blocks` and `@unpunnyfuns/swatchbook-switcher`.
Consumers can install a single package (`pnpm add
@unpunnyfuns/swatchbook-addon`) and pull `TokenTable`, `ColorPalette`,
`TokenDetail`, `ThemeSwitcher`, `useToken`, and the rest directly
from it:

```tsx
import { TokenTable, ThemeSwitcher } from '@unpunnyfuns/swatchbook-addon';
```

The blocks / switcher / core packages remain independently installable
for consumers who only need a slice (e.g. the docs site imports just
the switcher). No runtime change — the re-exports are external in the
bundle, so the addon's dist stays the same size and tree-shaking keeps
unused pieces out of consumer bundles.

Subpath entries (`./preset`, `./manager`, `./preview`, `./hooks`) are
unchanged; the meta re-export is on the main `.` entry point only.
