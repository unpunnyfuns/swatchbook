import { beforeAll, expect, it } from 'vitest';
import { DEFAULT_CHROME_MAP, loadProject } from '@unpunnyfuns/swatchbook-core';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';

// The standalone chrome color defaults dogfood swatchbook's own tokens: each
// color role's DEFAULT_CHROME_MAP literal must equal the resolved color token
// at the default tuple. This guard keeps the published `core` map honest
// against the private dogfood tokens (which `blocks` already deps on for the
// scale generator) without a core->tokens build dependency. `bodyFontFamily`
// is deliberately absent: its default is a neutral `system-ui` fallback, not
// the brand font token (a standalone block shouldn't force-load a font).
const ROLE_TOKEN: Record<string, string> = {
  surfaceDefault: 'color.surface.default',
  surfaceMuted: 'color.surface.muted',
  surfaceRaised: 'color.surface.raised',
  textDefault: 'color.text.default',
  textMuted: 'color.text.muted',
  borderDefault: 'color.border.default',
  accentBg: 'color.accent.bg',
  accentFg: 'color.accent.fg',
};

// sRGB components (0..1) -> #rrggbb, the hex form DEFAULT_CHROME_MAP uses. The
// palette source values are hex, so the components round to exact bytes.
function toHex(value: unknown): string {
  const v = value as { components: number[] };
  return `#${v.components
    .map((c) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

let tokens: Record<string, { $value?: unknown }>;
// loadProject is ~1s — resolve once (the project's allowed perf escape hatch).
beforeAll(async () => {
  const project = await loadProject(
    { resolver: resolverPath, default: { mode: 'Light', brand: 'Default', contrast: 'Normal' } },
    tokensDir,
  );
  tokens = project.defaultTokens;
});

it('DEFAULT_CHROME_MAP color roles equal swatchbook color tokens (hex)', () => {
  const mismatches: string[] = [];
  for (const [role, path] of Object.entries(ROLE_TOKEN)) {
    const tokenHex = toHex(tokens[path]?.$value);
    const literal = String(
      DEFAULT_CHROME_MAP[role as keyof typeof DEFAULT_CHROME_MAP],
    ).toLowerCase();
    if (tokenHex !== literal) mismatches.push(`${role}: map=${literal} token=${tokenHex}`);
  }
  expect(mismatches).toEqual([]);
});
