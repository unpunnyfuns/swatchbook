import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProject } from '@unpunnyfuns/swatchbook-core';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { makeCSSVar } from '@terrazzo/token-tools/css';

const HEADER = (what: string) =>
  `/*\n * GENERATED from @unpunnyfuns/swatchbook-tokens by\n` +
  ` * scripts/generate-internal-scales.mts. Do not edit by hand.\n` +
  ` * Run \`pnpm --filter @unpunnyfuns/swatchbook-blocks generate:scales\`.\n` +
  ` * ${what}: swatchbook's own tokens styling the block UI.\n */\n`;

function fmtValue(v: unknown): string {
  if (v && typeof v === 'object' && 'value' in v) {
    const dim = v as { value: number; unit?: string };
    return dim.value === 0 ? '0' : `${dim.value}${dim.unit ?? ''}`;
  }
  return String(v);
}

type Tokens = Record<string, { $value?: unknown }>;

// One `  --swatchbook-<name>: <value>;` line. `name` is the var path (usually
// the token path; opacity remaps it, below).
function emitLine(tokens: Tokens, path: string, name: string): string {
  return `  ${makeCSSVar(name, { prefix: 'swatchbook' })}: ${fmtValue(tokens[path]?.$value)};`;
}

// Wrap lines in a `:root {}` block, sorted by var name for stable output.
function wrap(lines: string[]): string {
  return `:root {\n${[...lines].sort().join('\n')}\n}\n`;
}

// Tokens whose first path segment is in `groups`, emitted at their own path.
function group(tokens: Tokens, groups: string[]): string[] {
  return Object.keys(tokens)
    .filter((p) => groups.includes(p.split('.')[0] ?? ''))
    .map((p) => emitLine(tokens, p, p));
}

// number.opacity.<role> -> --swatchbook-opacity-<role> (strip the `number.`
// prefix so blocks reference a clean `--swatchbook-opacity-*` namespace).
function opacity(tokens: Tokens): string[] {
  return Object.keys(tokens)
    .filter((p) => p.startsWith('number.opacity.'))
    .map((p) => emitLine(tokens, p, p.slice('number.'.length)));
}

/** Resolve swatchbook-tokens and render the two bundled scale stylesheets. */
export async function generateScales() {
  const project = await loadProject(
    { resolver: resolverPath, default: { mode: 'Light', brand: 'Default', contrast: 'Normal' } },
    tokensDir,
  );
  const tokens: Tokens = project.defaultTokens;
  return {
    dimensions: HEADER('Spacing + radii') + wrap(group(tokens, ['space', 'radius'])),
    typography:
      HEADER('Font sizes, line-height, tracking, opacity') +
      wrap([...group(tokens, ['type', 'leading', 'tracking']), ...opacity(tokens)]),
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { dimensions, typography } = await generateScales();
  const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'internal');
  writeFileSync(`${out}/internal-dimensions.css`, dimensions);
  writeFileSync(`${out}/internal-typography.css`, typography);
  console.log('generated internal-dimensions.css + internal-typography.css');
}
