# Tokens starter

Published as `@unpunnyfuns/swatchbook-tokens`. Minimal DTCG design-token starter set. Drop in for a working baseline; fork and extend.

> **Status:** iceboxed past v0.1.0. The package currently exists as a build-pipeline smoke test for `@unpunnyfuns/swatchbook-core`, not a public starter. Pin from npm at your own risk until v0.1.0 ships; the shape below is the intent, not yet a contract.

## Install

```sh
pnpm add @unpunnyfuns/swatchbook-tokens
```

## Structure

| Path                               | What                                                                 |
| ---------------------------------- | -------------------------------------------------------------------- |
| `@unpunnyfuns/swatchbook-tokens/css`    | Single concatenated stylesheet with `[data-theme="…"]` blocks.  |
| `@unpunnyfuns/swatchbook-tokens/themes/<name>.json` | Per-theme resolved tokens (keyed by token path).    |
| `@unpunnyfuns/swatchbook-tokens/tokens/*` | Raw DTCG JSON — for re-resolving with your own config.          |
| `@unpunnyfuns/swatchbook-tokens`        | Typed `cssVars` map + `token()` helper + `themes` list.         |

## Drop-in use

```ts
import '@unpunnyfuns/swatchbook-tokens/css';
// Flip the active theme:
document.documentElement.setAttribute('data-theme', 'Light');
```

```css
.button {
  background: var(--sb-color-sys-accent);
  color:      var(--sb-color-sys-text-inverse);
  padding:    var(--sb-space-sys-sm) var(--sb-space-sys-md);
}
```

## Typed lookups

```ts
import { token, cssVars, type TokenPath } from '@unpunnyfuns/swatchbook-tokens';

const bg = token('color.sys.accent');           // 'var(--sb-color-sys-accent)'
const muted: TokenPath = 'color.sys.text-muted'; // ✅ autocompletes
```

✅ Use via CSS vars when styling DOM. Prefer `token()` only when you need a string at runtime.
❌ Don't import the raw JSON to rehydrate values at runtime — use the prebuilt `/themes/*.json` exports or rebuild via `@unpunnyfuns/swatchbook-core`.
