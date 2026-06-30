import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProject, makeCSSVar } from '@unpunnyfuns/swatchbook-core';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';

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

function rootBlock(tokens: Record<string, { $value?: unknown }>, groups: string[]): string {
  const lines = Object.keys(tokens)
    .filter((p) => {
      const prefix = p.split('.')[0];
      return prefix !== undefined && groups.includes(prefix);
    })
    .sort()
    .map((p) => {
      const token = tokens[p];
      return `  ${makeCSSVar(p, { prefix: 'swatchbook' })}: ${fmtValue(token?.$value)};`;
    });
  return `:root {\n${lines.join('\n')}\n}\n`;
}

/** Resolve swatchbook-tokens and render the two bundled scale stylesheets. */
export async function generateScales() {
  const project = await loadProject(
    { resolver: resolverPath, default: { mode: 'Light', brand: 'Default', contrast: 'Normal' } },
    tokensDir,
  );
  const tokens: Record<string, { $value?: unknown }> = project.defaultTokens;
  return {
    dimensions: HEADER('Spacing + radii') + rootBlock(tokens, ['space', 'radius']),
    typography: HEADER('Font sizes, line-height, tracking') + rootBlock(tokens, ['type', 'leading', 'tracking']),
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
