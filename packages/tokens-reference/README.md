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

`tokens/resolver.json` — a DTCG 2025.10 native resolver (`sets` + `modifiers` + `resolutionOrder`). Enumerates the full permutation cross-product: `appearance` (light/dark/high-contrast) × `brand` (default/a) = 6 themes.

## Consumption

```ts
import { tokensDir, resolverPath } from '@unpunnyfuns/swatchbook-tokens-reference';
```

✅ Use the exported path helpers — they're `import.meta`-resolved and survive `node_modules` hoisting.
❌ Don't hard-code `node_modules/@unpunnyfuns/swatchbook-tokens-reference/tokens/...` in consuming code.
