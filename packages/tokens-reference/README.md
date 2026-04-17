# @unpunnyfuns/swatchbook-tokens-reference

Exhaustive DTCG 2025.10 pyramid used as swatchbook's internal test bed. Private — not published.

## Structure

| Layer      | Purpose                                              | Aliases       |
| ---------- | ---------------------------------------------------- | ------------- |
| `ref/`     | Raw primitives (no aliases, no semantics)            | none          |
| `sys/`     | Semantic slots (theme-neutral shape)                 | → `ref/`      |
| `cmp/`     | Component-scoped tokens                              | → `sys/`      |
| `themes/`  | Sparse overrides of `sys/`                           | → `ref/`      |

## Theming compositions

Two parallel expressions of the same compositions — both must resolve identically:

- `tokens/$themes.manifest.json` — Tokens Studio convention (`$themes[].selectedTokenSets`).
- `tokens/resolver.json` — DTCG 2025.10 native resolver (`sets` + `modifiers` + `resolutionOrder`).

Compositions: Light, Dark, Light · Brand A, Dark · Brand A, High Contrast.

## Consumption

```ts
import { tokensDir, manifestPath, resolverPath } from '@unpunnyfuns/swatchbook-tokens-reference';
```

✅ Use the exported path helpers — they're `import.meta`-resolved and survive `node_modules` hoisting.
❌ Don't hard-code `node_modules/@unpunnyfuns/swatchbook-tokens-reference/tokens/...` in consuming code.
