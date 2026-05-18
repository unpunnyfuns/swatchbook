# swatchbook-core

The framework-free loader at the heart of [swatchbook](https://github.com/unpunnyfuns/swatchbook).

Parses DTCG token files via [Terrazzo](https://terrazzo.app/), resolves aliases, composes themes through a DTCG 2025.10 resolver or authored layered axes. No DOM, no React — just a `Project` object you can consume from any Node-side tool.

Storybook consumers get this transitively via [`@unpunnyfuns/swatchbook-addon`](../addon). Install directly when you're running `loadProject` outside Storybook: build scripts, CLIs, docs-site generators, custom tooling.

## Install

```sh
npm install @unpunnyfuns/swatchbook-core
```

## Usage

```ts
import { loadProject, defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';

const config = defineSwatchbookConfig({
  resolver: 'tokens/resolver.json',
  cssVarPrefix: 'sb',
});

const project = await loadProject(config, process.cwd());

// Read the default-tuple snapshot directly.
const defaults = project.defaultTokens;

// Read any tuple via the composer — bounded over per-axis cells +
// joint overrides, no resolver round-trip.
const darkBrandA = project.resolveAt({ mode: 'Dark', brand: 'Brand A' });
```

The [config reference](https://unpunnyfuns.github.io/swatchbook/reference/config) covers every field; the [core reference](https://unpunnyfuns.github.io/swatchbook/reference/core) covers the `Project` shape and exported helpers (`emitAxisProjectedCss`, `jointOverrideKey`, typed `Axis` / `Config` / `Diagnostic` / `Project`).

## Browser-safe subpaths

Leaf utilities consumers need without the loader's Node deps live on dedicated subpaths — each tree-shake-clean, no `@terrazzo/parser`, no `node:*` imports:

- `@unpunnyfuns/swatchbook-core/resolve-at` — `buildResolveAt(axes, cells, jointOverrides, defaultTuple)`
- `@unpunnyfuns/swatchbook-core/snapshot-for-wire` — `snapshotForWire(project, css)` + `SnapshotForWire` type
- `@unpunnyfuns/swatchbook-core/fuzzy` — uFuzzy-backed token search
- `@unpunnyfuns/swatchbook-core/css-var` — `makeCssVar(path, prefix)`
- `@unpunnyfuns/swatchbook-core/data-attr` — `dataAttr(prefix, key)`

## Boundaries

- ✅ Build-time use — Node, scripts, SSR, Storybook presets.
- ✅ Pair with [Terrazzo](https://terrazzo.app/)'s CLI for production artifact emission (CSS / JS / Tailwind / Swift / Sass / …).
- ✅ Ship `project.cells` / `project.jointOverrides` / `project.defaultTokens` to the browser via the `snapshot-for-wire` subpath — that's exactly what the addon's preview does.
- ❌ Don't ship the full `Project` object to the browser. `parserInput` carries the raw Terrazzo AST; use `snapshotForWire(project, css)` to get a JSON-friendly subset.
- ❌ Don't reach into `@terrazzo/parser` directly. Stay on the core surface so upgrades don't churn your code.

## Credits

Token parsing, alias resolution, and DTCG resolver evaluation are provided by [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp). This package wraps those APIs into a swatchbook-shaped project.

## Documentation

[unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/) — concepts, guides, and full API reference.
