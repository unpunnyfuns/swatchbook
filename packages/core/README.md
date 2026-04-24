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
// project.themesResolved[themeName] — ready to read, no further I/O.
```

The [config reference](https://unpunnyfuns.github.io/swatchbook/reference/config) covers every field; the [core reference](https://unpunnyfuns.github.io/swatchbook/reference/core) covers the `Project` shape and exported helpers (`resolveTheme`, `permutationID`, typed `Axis` / `Theme` / `Diagnostic`).

## Boundaries

- ✅ Build-time use — Node, scripts, SSR, Storybook presets.
- ✅ Pair with [Terrazzo](https://terrazzo.app/)'s CLI for production artifact emission (CSS / JS / Tailwind / Swift / Sass / …).
- ❌ Don't ship the `Project` object to the browser — it carries full raw-AST references. Use `themesResolved` projections instead.
- ❌ Don't reach into `@terrazzo/parser` directly. Stay on the core surface so upgrades don't churn your code.

## Credits

Token parsing, alias resolution, and DTCG resolver evaluation are provided by [Terrazzo](https://terrazzo.app/) by the [Terrazzo team](https://github.com/terrazzoapp). This package wraps those APIs into a swatchbook-shaped project.

## Documentation

[unpunnyfuns.github.io/swatchbook](https://unpunnyfuns.github.io/swatchbook/) — concepts, guides, and full API reference.
