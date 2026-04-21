# swatchbook-tokens

Internal workspace package (`@unpunnyfuns/swatchbook-tokens`). Exhaustive DTCG 2025.10 fixture used as swatchbook's internal test bed and as a reference for consumers structuring their own token projects. Private — not published.

## Theming compositions

`tokens/resolver.json` — a DTCG 2025.10 native resolver (`sets` + `modifiers` + `resolutionOrder`). Three independent modifiers compose into named themes: every combination of `mode` (Light/Dark), `brand` (Default/Brand A), and `contrast` (Normal/High).

## Consumption

```ts
import { tokensDir, resolverPath } from '@unpunnyfuns/swatchbook-tokens';
```

✅ Use the exported path helpers — they're `import.meta`-resolved and survive `node_modules` hoisting.
❌ Don't hard-code `node_modules/@unpunnyfuns/swatchbook-tokens/tokens/...` in consuming code.
