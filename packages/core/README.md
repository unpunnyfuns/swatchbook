# @unpunnyfuns/swatchbook-core

Framework-free DTCG loader. Parses token files (via Terrazzo), resolves aliases, composes themes through any of three idioms — explicit layers, DTCG 2025.10 resolvers, or Tokens Studio `$themes` manifests — and emits CSS variables + TypeScript types. All three inputs normalize to the same internal shape; a core unit test pins byte-identical output across them.

## Install

```sh
pnpm add @unpunnyfuns/swatchbook-core
```

## Public API

| Export | Purpose |
| --- | --- |
| `defineSwatchbookConfig(config)` | Identity helper for a typed `swatchbook.config.ts`. |
| `loadProject(config, cwd?)` | Parse + normalize — returns `Project { themes, themesResolved, graph, diagnostics, … }`. |
| `resolveTheme(project, name)` | Pick a single composed theme out of a project. |
| `emitCss(project, options?)` | Concatenated stylesheet, one `[data-theme="…"]` block per theme. |
| `projectCss(project)` | Same as `emitCss` with project defaults applied. |
| `emitTypes(project)` | TypeScript source declaring the token-path union + `SwatchbookTokenMap`. |
| `resolveThemingMode(config)` | `'layered' | 'resolver' | 'manifest'` — which branch the config activates. |
| Types | `Config`, `Theme`, `ThemeConfig`, `Project`, `ResolvedTheme`, `TokenMap`, `Diagnostic`, `DiagnosticSeverity`. |

## Minimal config

```ts
import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';

export default defineSwatchbookConfig({
  tokens: ['tokens/**/*.json'],
  manifest: 'tokens/$themes.manifest.json', // or `themes:` / `resolver:` — pick one
  default: 'Light',
  cssVarPrefix: 'sb',
});
```

## Load + emit

```ts
import { loadProject, projectCss, emitTypes } from '@unpunnyfuns/swatchbook-core';

const project = await loadProject(config, process.cwd());

const css = projectCss(project);
const dts = emitTypes(project);
```

`project.diagnostics` is always populated — severity is `'error' | 'warn' | 'info'`. The addon surfaces these in its Diagnostics panel; your own pipeline can inspect / `throw` on `severity === 'error'` as fits.

## Three theming idioms, one shape

```ts
// A — explicit layers
defineSwatchbookConfig({
  tokens: ['tokens/**/*.json'],
  themes: [
    { name: 'Light', layers: ['ref/**', 'sys/**', 'cmp/**', 'themes/light.json'] },
    { name: 'Dark',  layers: ['ref/**', 'sys/**', 'cmp/**', 'themes/dark.json'] },
  ],
});

// B — DTCG 2025.10 resolver
defineSwatchbookConfig({
  tokens: ['tokens/**/*.json'],
  resolver: 'tokens/resolver.json',
});

// C — Tokens Studio manifest
defineSwatchbookConfig({
  tokens: ['tokens/**/*.json'],
  manifest: 'tokens/$themes.manifest.json',
});
```

Mixing is an error surfaced during `loadProject`.

## Do / don't

- ✅ Use this package at build time — Node, scripts, SSR, storybook presets. It has no DOM or React dependency.
- ✅ Treat `emitCss` output as the source of truth for CSS vars; don't parallel-hand-write them.
- ❌ Don't import from `@terrazzo/parser` directly unless you need features core doesn't expose. Stay on the core surface so upgrades don't churn your code.
- ❌ Don't ship the `Project` object to the browser — it's node-parsed and carries full raw-AST references. Use `emitCss` / `emitTypes` / `themesResolved` projections instead.

## See also

- [`@unpunnyfuns/swatchbook-addon`](../addon) — the Storybook wrapper. Uses `loadProject` at startup, exposes results over a virtual module.
- [`@unpunnyfuns/swatchbook-blocks`](../blocks) — React doc blocks consumed from MDX.
- [Project README](../../README.md) — install + wiring flow for the whole toolchain.
