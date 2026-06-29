import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

// The blocks own a fixed-namespace dimensional scale (consumers can't be
// referenced — prefix unknown at build time). It must mirror the project's
// size.json scale; this guard fails if either side drifts from the contract.
const EXPECTED_SPACE: Record<string, string> = {
  none: '0',
  '3xs': '2px',
  '2xs': '4px',
  xs: '6px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '40px',
  '3xl': '64px',
};
const EXPECTED_RADIUS: Record<string, string> = {
  '3xs': '2px',
  '2xs': '4px',
  xs: '6px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  pill: '9999px',
};

const cssPath = fileURLToPath(new URL('../src/internal/internal-dimensions.css', import.meta.url));
const tokensPath = fileURLToPath(new URL('../../tokens/tokens/size.json', import.meta.url));

function declaredVars(prefix: string): Record<string, string> {
  const css = readFileSync(cssPath, 'utf8');
  const out: Record<string, string> = {};
  for (const m of css.matchAll(/--swatchbook-(space|radius)-([\w-]+):\s*([^;]+);/g)) {
    const [, type, label, raw] = m;
    if (type === prefix && label !== undefined && raw !== undefined) out[label] = raw.trim();
  }
  return out;
}

// Resolve a size.json alias ("{size.300}") or literal to "<n>px" / "0".
function resolvePx(tokens: any, node: any): string {
  const v =
    typeof node.$value === 'string'
      ? tokens.size[node.$value.replace('{size.', '').replace('}', '')].$value
      : node.$value;
  return v.value === 0 ? '0' : `${v.value}${v.unit}`;
}

it('internal-dimensions.css space vars match the contract', () => {
  expect(declaredVars('space')).toEqual(EXPECTED_SPACE);
});

it('internal-dimensions.css radius vars match the contract', () => {
  expect(declaredVars('radius')).toEqual(EXPECTED_RADIUS);
});

it('size.json space/radius resolve to the same contract', () => {
  const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
  const space = Object.fromEntries(
    Object.entries(tokens.space)
      .filter(([k]) => k !== '$type' && k !== '$description')
      .map(([k, n]) => [k, resolvePx(tokens, n)]),
  );
  const radius = Object.fromEntries(
    Object.entries(tokens.radius)
      .filter(([k]) => k !== '$type' && k !== '$description')
      .map(([k, n]) => [k, resolvePx(tokens, n)]),
  );
  expect(space).toEqual(EXPECTED_SPACE);
  expect(radius).toEqual({ none: '0', ...EXPECTED_RADIUS });
});
