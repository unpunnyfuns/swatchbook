# @unpunnyfuns/swatchbook-core

Framework-free DTCG loader. Parses token files (via Terrazzo), resolves aliases, composes themes through a DTCG 2025.10 resolver, and emits CSS variables + TypeScript types.

## Install

```sh
pnpm add @unpunnyfuns/swatchbook-core
```

## Public API

| Export | Purpose |
| --- | --- |
| `defineSwatchbookConfig(config)` | Identity helper for a typed `swatchbook.config.ts`. |
| `loadProject(config, cwd?)` | Parse + resolve — returns `Project { axes, themes, themesResolved, graph, diagnostics, … }`. |
| `resolveTheme(project, name)` | Pick a single composed theme out of a project. |
| `emitCss(project, options?)` | Concatenated stylesheet, one `[data-theme="…"]` block per theme. |
| `projectCss(project)` | Same as `emitCss` with project defaults applied. |
| `emitTypes(project)` | TypeScript source declaring the token-path union + `SwatchbookTokenMap`. |
| `permutationID(input)` | Stringify a tuple (`{ mode: 'Dark', brand: 'Brand A' }` → `"Dark · Brand A"`) to the form used as `Theme.name` and CSS data-attribute values. |
| Types | `Axis`, `Config`, `Theme`, `Project`, `ResolvedTheme`, `TokenMap`, `Diagnostic`, `DiagnosticSeverity`. |

## Minimal config

```ts
import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';

export default defineSwatchbookConfig({
  tokens: ['tokens/**/*.json'],
  resolver: 'tokens/resolver.json',
  default: 'Light',
  cssVarPrefix: 'sb',
});
```

The resolver file is the spec-defined document describing how token sets compose into named themes — see [the DTCG 2025.10 resolver draft](https://design-tokens.org/tr/2025/drafts/resolver/).

## Load + emit

```ts
import { loadProject, projectCss, emitTypes } from '@unpunnyfuns/swatchbook-core';

const project = await loadProject(config, process.cwd());

const css = projectCss(project);
const dts = emitTypes(project);
```

`project.diagnostics` is always populated — severity is `'error' | 'warn' | 'info'`. The addon surfaces these in its Diagnostics panel; your own pipeline can inspect / `throw` on `severity === 'error'` as fits.

## Axes and theme naming

`Project.axes` surfaces the resolver's modifiers as first-class — one `Axis` per DTCG modifier, each with its `contexts`, `default`, and `description`. Projects loaded without a resolver fall back to a single synthetic axis named `theme`.

Theme names are derived from the axis tuple via `permutationID(input)`: single-axis tuples stringify to the context value alone (`{ theme: 'Light' }` → `"Light"`); multi-axis tuples join context values with ` · ` (`{ mode: 'Dark', brand: 'Brand A' }` → `"Dark · Brand A"`). Pick sensible context names — what you write is what the toolbar shows. Consuming code should prefer `axes` + `themes[].input` over matching names by string.

## Do / don't

- ✅ Use this package at build time — Node, scripts, SSR, storybook presets. It has no DOM or React dependency.
- ✅ Treat `emitCss` output as the source of truth for CSS vars; don't parallel-hand-write them.
- ❌ Don't import from `@terrazzo/parser` directly unless you need features core doesn't expose. Stay on the core surface so upgrades don't churn your code.
- ❌ Don't ship the `Project` object to the browser — it's node-parsed and carries full raw-AST references. Use `emitCss` / `emitTypes` / `themesResolved` projections instead.

## See also

- [`@unpunnyfuns/swatchbook-addon`](../addon) — the Storybook wrapper. Uses `loadProject` at startup, exposes results over a virtual module.
- [`@unpunnyfuns/swatchbook-blocks`](../blocks) — React doc blocks consumed from MDX.
- [Project README](../../README.md) — install + wiring flow for the whole toolchain.
