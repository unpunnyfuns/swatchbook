# swatchbook-core

The framework-free loader at the heart of [swatchbook](https://github.com/unpunnyfuns/swatchbook).

Parses DTCG token files via [Terrazzo](https://terrazzo.app/), resolves aliases, composes themes through a DTCG 2025.10 resolver or authored layered axes. No DOM, no React, just a `Project` object you can consume from any Node-side tool.

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

// Read any tuple via the composer: bounded over the token graph,
// no resolver round-trip.
const darkBrandA = project.resolveAt({ mode: 'Dark', brand: 'Brand A' });
```

The [config reference](https://unpunnyfuns.github.io/swatchbook/reference/config) covers every field; the [core reference](https://unpunnyfuns.github.io/swatchbook/reference/core) covers the `Project` shape and exported helpers (`emitAxisProjectedCss`, typed `Axis` / `Config` / `Diagnostic` / `Project`).

## Browser-safe subpaths

Leaf utilities that don't need the loader's Node deps ship on dedicated, tree-shakeable subpaths (no `@terrazzo/parser`, no `node:*` imports): `/snapshot-for-wire`, `/themes`, `/match-path`, `/fuzzy`, `/css-var`, `/data-attr`, `/style-element`. The [core reference](https://unpunnyfuns.github.io/swatchbook/reference/core) documents each one's exports.

## Boundaries

`swatchbook-core` is build-time only: Node, scripts, SSR, Storybook presets. Pair it with [Terrazzo](https://terrazzo.app/)'s CLI for production artifact emission (CSS / JS / Tailwind / Swift / Sass). To hand data to the browser, ship the `snapshotForWire(project, css)` subset (the addon's preview does exactly this) rather than the full `Project`, whose `resolveAt` is a function and whose `cwd` is a Node-side absolute path. Stay on the core surface rather than reaching into `@terrazzo/parser` directly, so upgrades don't churn your code.

## Credits

Token parsing, alias resolution, and DTCG resolver evaluation are provided by [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp). This package wraps those APIs into a swatchbook-shaped project.

## Documentation

[unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/): concepts, guides, and full API reference.
